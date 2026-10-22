/**
 * HYBRID RETRIEVER cho RAG (chạy trên Cloudflare Workers)
 * - Chuẩn hoá tiếng Việt không dấu => "tiktok shop" / "tiếp thị liên kết" / "tiep thi lien ket" đều khớp
 * - BM25 trên unigram + bigram, có trọng số riêng cho tiêu đề (section)
 * - Mở rộng từ đồng nghĩa (query expansion)
 * - Route (query-map) chỉ BOOST điểm, không loại bỏ kết quả tìm kiếm
 * - Cắt snippet theo câu hỏi để prompt gọn, LLM không bị nhiễu bởi chunk dài
 */
import { CANONICAL_CHUNKS, QUERY_ROUTES, RagChunk, matchRoute } from './ragEngine';
import { resolveAnswerScope, type AnswerScope } from './answerScope';
import { extractAllAmounts } from './decision/factExtractor';
import { foldText as fold } from './utils/text';
import { legacyPinRefs } from './decision/retrievalPlan';
import { evidenceProvenance, type EvidenceProvenance } from './kb/provenance';
import chunkPeriods from './kb/chunkMeta.json';
import { periodFits, type EffectiveInterval } from './kb/periodApplicability';

const STOP = new Set(
  ('la va cua cho co khong nhung cac mot nhu the nao bao nhieu thi duoc bi ma khi nay do de toi minh ban hay ' +
    'o tai voi tu den trong ve neu thu phai nen ra vao se da dang cung rat con lai nua roi a nhe nha ah oi ' +
    'gi sao nhu vay').split(' ')
);

const SYNONYMS: Record<string, string[]> = {
  'tiktok shop': ['tmdt', 'san tmdt', 'thuong mai dien tu'],
  shopee: ['tmdt', 'san tmdt'],
  lazada: ['tmdt', 'san tmdt'],
  'ban online': ['tmdt', 'thuong mai dien tu'],
  'livestream': ['tmdt', 'tiktok'],
  affiliate: ['tiep thi lien ket', 'hoa hong'],
  'hoa hong': ['affiliate', 'tiep thi lien ket'],
  tiki: ['tmdt', 'san tmdt'],
  'cho thue': ['thue tai san', 'bat dong san'],
  'dang ky': ['dang ky thue', 'mst', '888'],
  'thu nhap': ['tncn', 'doanh thu'],
  phat: ['xu phat', 'vi pham', 'truy thu'],
  hoan: ['hoan thue', 'nop thua'],
  'nop thua': ['hoan thue'],
  'quyet toan': ['to khai quyet toan', '05/qtt'],
  'ma so thue': ['mst', '888', 'dinh danh'],
  koc: ['tiep thi lien ket', 'noi dung so'],
  kol: ['tiep thi lien ket', 'noi dung so'],
  hkd: ['ho kinh doanh'],
  'ho kinh doanh': ['hkd', 'ca nhan kinh doanh'],
  'mst': ['ma so thue'],
  'cccd': ['dinh danh', 'ma so thue'],
  'hoa don': ['hddt', 'hoa don dien tu'],
  'ke khai': ['to khai', 'khai thue'],
  'mien thue': ['nguong doanh thu', '1 ty'],
  'khau tru': ['nop thay', 'khai thay'],
  'ke toan': ['so sach', 'so ke toan'],
  'thue khoan': ['ke khai', 'ty le'],
  // Tên cũ dân vẫn dùng -> tên chính thức trong văn bản (từ 2017 "thuế môn bài" đổi thành "lệ phí môn bài")
  'mon bai': ['le phi mon bai'],
  'thue mon bai': ['le phi mon bai'],
  // Nhóm A/B/C: Thủ tục đăng ký, gỡ lỗi cổng thuế, phần mềm hệ thống
  'nguoi phu thuoc': ['giam tru gia canh', '1.008499', 'etax mobile'],
  'giam tru gia canh': ['nguoi phu thuoc', '1.008499'],
  'tai khoan ngan hang': ['thong bao tai khoan', 'etax mobile', 'dieu 13'],
  'etax mobile': ['etax', 'ung dung thue', '1.008499', 'tai khoan ngan hang'],
  'thuedientu': ['cong thue dien tu', 'khai thue dien tu', '89/2026'],
  'canhantmdt': ['ma 888', '311/tct', 'vneid'],
  'vneid': ['dinh danh dien tu', 'muc 2', 'canhantmdt'],
  'khong tiep nhan': ['thong bao tiep nhan', 'da ghi nhan', '89/2026'],
  'nhay thue': ['tu tinh', 'htkk', 'phan mem'],
  'nop trung': ['treo no', 'gop quy', 'quen khai'],
  'trang thai 03': ['ngung hoat dong', 'khoa mst', 'cham dut hieu luc'],
  'trang thai 06': ['khong hoat dong tai dia chi', 'khoa mst'],
  '04/ss-hddt': ['sai sot hoa don', 'dieu chinh', 'thay the'],
};

interface IndexedChunk {
  chunk: RagChunk;
  tf: Map<string, number>;
  len: number;
}

let INDEX: IndexedChunk[] | null = null;
let DF: Map<string, number> = new Map();
let AVG_LEN = 1;

function termsOf(text: string): string[] {
  const allToks = fold(text)
    .split(' ')
    .filter((t) => t.length > 0);
  const toks = allToks.filter((t) => !STOP.has(t));
  const out: string[] = [];
  for (const t of toks) out.push(t);
  // Ghép bigram TRÊN token đầy đủ (kể cả stopword): giữ được "ban_hang", "cho_thue", "nam_nay".
  // Bỏ bigram toàn stopword để tránh nhiễu ("la_cua", "va_nhung"...).
  for (let i = 0; i + 1 < allToks.length; i++) {
    const a = allToks[i];
    const b = allToks[i + 1];
    if (STOP.has(a) && STOP.has(b)) continue;
    out.push(a + '_' + b);
  }
  return out;
}

function build() {
  if (INDEX) return;
  INDEX = CANONICAL_CHUNKS.filter((chunk) =>
    chunk.tier === 'VERIFIED' || chunk.tier === 'VERIFIED_CONDITIONAL'
  ).map((chunk) => {
    const tf = new Map<string, number>();
    const body = termsOf(chunk.text);
    for (const t of body) tf.set(t, (tf.get(t) || 0) + 1);
    // Tiêu đề / ref_id có trọng số x4
    for (const t of termsOf(`${chunk.section || ''} ${chunk.ref_id || ''}`)) tf.set(t, (tf.get(t) || 0) + 4);
    return { chunk, tf, len: body.length };
  });
  for (const d of INDEX) for (const t of d.tf.keys()) DF.set(t, (DF.get(t) || 0) + 1);
  AVG_LEN = INDEX.reduce((s, d) => s + d.len, 0) / Math.max(1, INDEX.length);
}

function expandQuery(q: string): string {
  const f = fold(q);
  const extra: string[] = [];
  for (const [k, vs] of Object.entries(SYNONYMS)) if (f.includes(k)) extra.push(...vs);
  return extra.length ? `${q} ${extra.join(' ')}` : q;
}

export interface Retrieved {
  chunk: RagChunk;
  score: number;
  viaRoute: boolean;
  required?: 'DOCUMENT_REFERENCE' | 'RETRIEVAL_PLAN';
}

export function retrieve(query: string, limit = 4, scope: AnswerScope = resolveAnswerScope([], query), plan?: import('./decision/types').RetrievalPlan): { results: Retrieved[]; routeId: string | null; usedFallback: boolean } {
  build();
  const idx = INDEX!;
  const qTerms = termsOf(expandQuery(`${query} ${scope.years.join(' ')} ${(plan?.boost_keywords||[]).join(' ')}`));
  const route = matchRoute(`${query} ${scope.years.join(' ')}`);
  const allowRouteBoost = !plan?.semantic_topic || plan.strategy === 'ROUTE_FIRST';
  const routeRefs = new Set(allowRouteBoost ? (route?.refs || []) : []);
  // A compound question can explicitly name more than the highest-priority route.
  // Preserve the primary source for each named policy using the existing route data.
  // Restore document token boundaries in compact typing (e.g. mốcNQ43còn).
  // This only identifies an explicitly named document, never eligibility.
  const policyQuery=fold(query).replace(/(?:nghi quyet|nq)\s*(?=\d)/g,m=>` ${m} `)
    .replace(/(\d)(?=\p{L})/gu,'$1 ');
  const namedPolicies = new Set([...policyQuery.matchAll(/\b(?:nq|nghi quyet)\s*(\d+)\b/g)].map(m => `NQ${m[1]}`));
  const namedPolicyRefs = QUERY_ROUTES.filter(r => namedPolicies.has(r.id)).flatMap(r => r.refs.slice(0, 1));
  for (const ref of namedPolicyRefs) routeRefs.add(ref);
  const withNamedPolicyEvidence = (items: Retrieved[]) => {
    const pinned = namedPolicyRefs.map(ref => idx.find(item => item.chunk.ref_id === ref)).filter((item): item is IndexedChunk => !!item)
      .map(item => ({ chunk: item.chunk, score: items[0]?.score || 0, viaRoute: true,required:'DOCUMENT_REFERENCE' as const }));
    const combined=[...pinned,...items.filter(item=>!pinned.some(p=>p.chunk.id===item.chunk.id))];
    const required=combined.filter(item=>item.required);
    return [...required,...combined.filter(item=>!item.required)].slice(0,Math.max(limit,required.length));
  };
  const N = idx.length;
  const k1 = 1.4;
  const b = 0.75;

  const scored: Retrieved[] = idx.map((d) => {
    let s = 0;
    for (const t of qTerms) {
      const f = d.tf.get(t);
      if (!f) continue;
      const df = DF.get(t) || 1;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      const w = t.includes('_') ? 1.6 : 1; // bigram khớp chính xác giá trị hơn
      s += w * idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / AVG_LEN)));
    }
    const viaRoute = !!d.chunk.ref_id && routeRefs.has(d.chunk.ref_id);
    if (viaRoute) s += 8 + (route ? route.priority / 10 : 0);
    if (d.chunk.tier === 'VERIFIED') s *= 1.1;
    return { chunk: d.chunk, score: s, viaRoute };
  });

  const normalizedQuery = fold(query);
  const asksAboutSales = /\b(ban hang|ban tren|doanh thu ban)\b/.test(normalizedQuery);
  const asksAboutAffiliate = /\b(affiliate|tiep thi lien ket|hoa hong|koc|kol)\b/.test(normalizedQuery);
  // Năm hiện tại lấy động — tự lăn theo thời gian, không hardcode 2026.
  // oldYears = 5 năm trước năm hiện tại (ý nghĩa cũ của 2021–2025 khi năm hiện tại là 2026).
  const currentYear = Number(scope.today.slice(0, 4));
  const asksCurrentYear = scope.years.includes(currentYear);
  const historicalOnly = scope.years.length > 0 && scope.years.every(year => year < 2026);
  const asksWageCalculation = /\b(bieu thue|bac thue|giam tru|tinh thue luong|thue luong bao nhieu)\b/.test(normalizedQuery);
  const oldYearsRe = new RegExp(`\\b(${Array.from({ length: 5 }, (_, i) => currentYear - 5 + i).join('|')})\\b`);
  const currentYearRe = new RegExp(`\\b${currentYear}\\b`);

  // Gom chuỗi lọc thành hàm để có thể thử lại với ngưỡng thấp hơn (fallback).
  const pick = (minScore: number): Retrieved[] => {
    const results = scored
      // Apply semantic bounds before top-K truncation. Filtering afterwards
      // can discard every candidate even though permitted evidence exists.
      .filter((r) => !plan?.allowed_refs || plan.allowed_refs.includes(r.chunk.ref_id || ''))
      // Rank eligible periods before top-K: current-law hits must not crowd
      // out historical evidence and then disappear in the downstream gate.
      .filter((r) => {
        const period=(chunkPeriods as Record<string,EffectiveInterval>)[r.chunk.ref_id||r.chunk.id];
        return !period||periodFits(period,{years:scope.years});
      })
      .filter((r) => r.score >= minScore)
      .filter((r) => !asksAboutSales || asksAboutAffiliate ||
        !/affiliate|tiep thi lien ket/.test(fold(r.chunk.section)))
      .filter((r) => /\b(youtube|adsense)\b/.test(normalizedQuery) ||
        !/\b(youtube|adsense)\b/.test(fold(r.chunk.section)))
      .filter((r) => !asksAboutAffiliate || asksWageCalculation ||
        !['16.81', '16.82', '16.93'].includes(r.chunk.ref_id || ''))
      .filter((r) => !historicalOnly || !['16.57', '16.95', '16.96'].includes(r.chunk.ref_id || ''))
      .filter((r) => !asksCurrentYear || scope.years.some(year => year < 2026) || !oldYearsRe.test(fold(r.chunk.section)) ||
        currentYearRe.test(r.chunk.section))
      .sort((a, b2) => b2.score - a.score)
      .slice(0, limit);
    // Cắt các kết quả quá yếu so với kết quả đầu (giảm nhiễu)
    const top = results[0]?.score || 0;
    return results.filter((r, i) => i === 0 || r.viaRoute || r.score >= top * 0.35);
  };

  let selected = pick(8);
  let usedFallback = false;
  if (selected.length === 0) {
    // Ngưỡng 8 là ước lượng tay — câu hỏi diễn đạt lạ có thể rớt sạch dù KB có bài.
    // Nới ngưỡng thay vì trả "không tìm thấy", và đánh dấu để prompt thận trọng hơn.
    selected = pick(2.5);
    usedFallback = selected.length > 0;
  }
  // The decision plan owns mandatory evidence when present. Keep the legacy
  // routing only for DECISION_MODE=off, where callers omit the plan.
  if (plan) {
    const pinned: Retrieved[] = [];
    for (const ref of plan.must_include_refs) {
      const evidence = idx.find(item => item.chunk.ref_id === ref);
      if (evidence && !pinned.some(item => item.chunk.id === evidence.chunk.id)) {
        pinned.push({ chunk: evidence.chunk, score: selected[0]?.score || 0, viaRoute: false,required:'RETRIEVAL_PLAN' });
      }
    }
    selected = [...pinned, ...selected.filter(item => !pinned.some(p => p.chunk.id === item.chunk.id))];
    if (plan.allowed_refs) selected = selected.filter(item => plan.allowed_refs!.includes(item.chunk.ref_id || ''));
    selected = selected.slice(0, Math.max(limit,selected.filter(item=>item.required).length));
    return { results: withNamedPolicyEvidence(selected), routeId: plan.semantic_topic || route?.id || null, usedFallback };
  }
  // Điểm cao nhất hiện tại — dùng để gắn cho chunk chèn tay (ưu tiên lên đầu).
  const topScore = selected[0]?.score || 0;
  // Ghim legacy: thứ tự, điều kiện và bonus định nghĩa tập trung ở
  // decision/retrievalPlan.ts (legacyPinRefs). Duyệt ngược để ref đầu
  // danh sách nằm trước nhất — giữ nguyên hành vi cũ.
  for (const pin of [...legacyPinRefs(query, scope)].reverse()) {
    const evidence = idx.find((item) => item.chunk.ref_id === pin.ref);
    if (!evidence) continue;
    const existing = selected.findIndex((item) => item.chunk.ref_id === pin.ref);
    if (existing >= 0) selected.splice(existing, 1);
    selected.unshift({ chunk: evidence.chunk, score: topScore + pin.bonus, viaRoute: false });
  }
  return {
    results: withNamedPolicyEvidence(selected),
    routeId: route?.id || null,
    usedFallback,
  };
}

/** Giữ lại các dòng liên quan nhất của chunk dài, giữ nguyên thứ tự gốc và bảo toàn chuỗi bước thao tác hướng dẫn. */
export function snippet(chunk: RagChunk, query: string, budget = 2200): string {
  const text = chunk.text;
  if (text.length <= budget) return text;
  const lines = text.split('\n');
  const qset = new Set(termsOf(expandQuery(query)).filter((t) => !t.includes('_')));
  const requestedYears = Array.from(query.matchAll(/\b(?:19|20)\d{2}\b/g), (match) => match[0]);
  const isStepLine = (l: string) =>
    /^\s*(?:[-*+]|\d+[.)])?\s*(?:\*\*)?(?:Bước\s*\d+|B\d+\s*[:.-]|Trường hợp\s*\d+|Luồng\s*\d+|\[SỰ CỐ VẬN HÀNH\])/i.test(l) ||
    /^\s*\d+[.)]\s+\S/.test(l) ||
    /^\s*-\s*(?:Truy cập|Đăng nhập|Vào mục|Chọn\s+chức\s+năng)\b/i.test(l);
  const stepIndices = lines.map((l, idx) => (isStepLine(l) ? idx : -1)).filter((idx) => idx >= 0);

  const scored = lines.map((l, i) => {
    const lt = new Set(termsOf(l));
    let s = i === 0 ? 100 : 0; // luôn giữ tiêu đề
    if (/LEGAL_STATUS|Căn cứ|Nguồn:/i.test(l)) s += 1;
    // Ưu tiên dòng nêu điều kiện / ngoại lệ / lưu ý — thường là chỗ quyết định đúng-sai,
    // dễ bị loại khi chỉ chấm theo từ khóa câu hỏi (tương đương ~3 từ khóa khớp).
    if (/\b(ngoai tru|khong ap dung|dieu kien|truong hop|chi ap dung|mien|giam|luu y|chu y)\b/.test(fold(l))) s += 6;
    // Bảo toàn các bước thao tác hướng dẫn (Nhóm A/B/C) không bị xé lẻ
    if (isStepLine(l)) s += 28;
    if (chunk.ref_id === '16.60' && requestedYears.some((year) => new RegExp(`^\\s*-\\s*\\*\\*${year}:`).test(l))) s += 80;
    if (chunk.ref_id === '16.77' && (/^\s*\|/.test(l) || /Bảng tỷ lệ/i.test(l))) s += 50;
    for (const t of qset) if (lt.has(t)) s += 2;
    return { l, i, s, n: l.length };
  });
  const picked = new Set<number>();
  let used = 0;
  for (const x of [...scored].sort((a, b) => b.s - a.s)) {
    // Include the governing bullet with a child bullet; never detach an exception from its scope.
    const required = [x.i];
    if (isStepLine(x.l) && stepIndices.length > 1) {
      for (const sIdx of stepIndices) {
        if (!required.includes(sIdx)) required.push(sIdx);
      }
    }
    if (/^\s{2,}-/.test(x.l)) {
      for (let parent = x.i - 1; parent >= 0; parent--) {
        if (/^-/.test(lines[parent])) { required.push(parent); break; }
      }
    }
    const missing = required.filter(i => !picked.has(i));
    const cost = missing.reduce((sum, i) => sum + lines[i].length + 1, 0);
    if (used + cost > budget) continue;
    missing.forEach(i => picked.add(i));
    used += cost;
  }
  return lines.filter((_, i) => picked.has(i)).join('\n');
}

/**
 * Trích xuất các văn bản pháp luật quy phạm sạch (Điều, Khoản, Nghị định, Thông tư, Luật, Công văn)
 * Tuyệt đối không lấy mã nội bộ (16.xx), phân tích hay tiêu đề tóm tắt RAG.
 */
export function extractLegalCitationsFromChunk(chunk: RagChunk): string[] {
  const text = `${chunk.section || ''}\n${chunk.text || ''}`;
  const citations = new Set<string>();

  // 1. Khoản/Điều + Văn bản pháp luật
  const articleRegex = /(?:(?:Khoản\s+\d+[a-z]?(?:,\s*\d+)*\s+)?(?:Điều\s+\d+[a-z]?(?:\s*(?:,|và|&|-)\s*\d+[a-z]?)*\s+)?(?:Nghị định|Thông tư|Luật|Nghị quyết|Quyết định|Công văn|Văn bản hợp nhất)\s+(?:số\s+)?\d+(?:\/\d+)?\/[A-ZĐa-z0-9-]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = articleRegex.exec(text)) !== null) {
    citations.add(m[0].trim().replace(/\s+/g, ' '));
  }

  // 2. Viết tắt NĐ ... / TT ...
  const shortRegex = /(?:(?:Khoản\s+\d+\s+)?(?:Điều\s+\d+\s+)?(?:NĐ|TT)\s+\d+(?:\/\d+)?\/[A-ZĐa-z0-9-]+)/gi;
  while ((m = shortRegex.exec(text)) !== null) {
    let s = m[0].trim().replace(/\s+/g, ' ')
      .replace(/\bNĐ\s+/gi, 'Nghị định ')
      .replace(/\bTT\s+/gi, 'Thông tư ');
    citations.add(s);
  }

  // 3. Tên Luật có tên chuẩn
  const lawRegex = /(?:Luật\s+(?:Quản lý thuế|Thuế thu nhập cá nhân|Thuế giá trị gia tăng|Thuế GTGT|Thuế TNCN|Doanh nghiệp))(?:\s+(?:số\s+)?\d+\/\d+\/[A-Z0-9]+)?/gi;
  while ((m = lawRegex.exec(text)) !== null) {
    citations.add(m[0].trim().replace(/\s+/g, ' '));
  }

  // 4. Các dạng viết tắt năm không đuôi: NĐ 68/2026, NĐ 141/2026, TT 40/2021
  const simpleDocRegex = /(?:(?:Khoản\s+\d+\s+)?(?:Điều\s+\d+\s+)?(?:Nghị định|Thông tư|NĐ|TT)\s+\d+\/\d+)/gi;
  while ((m = simpleDocRegex.exec(text)) !== null) {
    let s = m[0].trim().replace(/\s+/g, ' ')
      .replace(/\bNĐ\s+/gi, 'Nghị định ')
      .replace(/\bTT\s+/gi, 'Thông tư ');
    if (s.includes('Nghị định') && !s.includes('/NĐ-CP') && /\d+\/\d+$/.test(s)) s += '/NĐ-CP';
    if (s.includes('Thông tư') && !s.includes('/TT-BTC') && /\d+\/\d+$/.test(s)) s += '/TT-BTC';
    citations.add(s);
  }

  // 5. Công văn / Quyết định không kèm năm trong số hiệu (ví dụ CV 311/TCT-DNNCN, CV 7403/CT-TMĐT)
  const dispatchRegex = /(?:Công văn|CV|Quyết định|QĐ)\s+(?:số\s+)?\d+\/[A-ZĐa-z0-9-]+/gi;
  while ((m = dispatchRegex.exec(text)) !== null) {
    const s = m[0].trim().replace(/\s+/g, ' ')
      .replace(/^CV\s+/i, 'Công văn ')
      .replace(/^QĐ\s+/i, 'Quyết định ');
    citations.add(s);
  }

  // 6. Tài liệu hướng dẫn / Mã TTHC / Cổng thuế chính thức có trong chunk (dành cho nhóm A/B/C)
  if (/1\.008499/.test(text) && /eTax\s*Mobile/i.test(text)) {
    citations.add('Hướng dẫn thủ tục đăng ký người phụ thuộc (Mã TTHC 1.008499) trên ứng dụng eTax Mobile');
  }
  if (/canhantmdt\.gdt\.gov\.vn/i.test(text)) {
    citations.add('Hướng dẫn trên Cổng Thông tin điện tử dành cho hộ, cá nhân kinh doanh TMĐT (canhantmdt.gdt.gov.vn)');
  }

  return cleanAndDeduplicateCitations(Array.from(citations));
}

export function cleanAndDeduplicateCitations(list: string[]): string[] {
  const filtered = list
    .map((s) => s.trim().replace(/\s+/g, ' '))
    .filter((s) => {
      if (!s || s.length < 6 || s.length > 90) return false;
      if (/^16\.\d+/i.test(s)) return false;
      if (/VERIFIED|CONTROL|LEGAL_STATUS|RAG|KB\//i.test(s)) return false;
      return true;
    });

  const results: string[] = [];
  for (const item of filtered) {
    let normalized = item;
    if (normalized.includes('Nghị định') && !normalized.includes('/NĐ-CP') && /\d+\/\d{4}$/.test(normalized)) {
      normalized += '/NĐ-CP';
    }
    if (normalized.includes('Thông tư') && !normalized.includes('/TT-BTC') && /\d+\/\d{4}$/.test(normalized)) {
      normalized += '/TT-BTC';
    }

    const isDuplicate = results.some((existing) => {
      if (existing.toLowerCase() === normalized.toLowerCase()) return true;
      if (existing.includes(normalized) && existing.includes('Điều')) return true;
      return false;
    });

    if (!isDuplicate) {
      const generalIdx = results.findIndex((existing) => normalized.includes(existing) && normalized.includes('Điều'));
      if (generalIdx !== -1) {
        results[generalIdx] = normalized;
      } else {
        results.push(normalized);
      }
    }
  }

  return results.slice(0, 4);
}

export interface EvidencePassage { id:string; ref_id:string; text:string; request_ids?:string[]; provenance?:EvidenceProvenance; purpose?:string }
export function buildContext(results: Retrieved[], query: string, totalBudget = 6500, scope: AnswerScope = resolveAnswerScope([], query), purpose?:string): { text: string; citations: string[]; includedRefs: string[]; passages:EvidencePassage[]; missingDocumentRefs:string[];missingRequiredRefs:string[] } {
  let text = '';
  const rawCitations: string[] = [];
  const includedRefs: string[] = [];
  const passages: EvidencePassage[]=[];

  // Curated purpose passages must be literal parts of the period-gated source.
  // Never use an unrelated high-scoring passage merely to fill top K.
  const scopedResults=purpose?results.filter(r=>{
    const segment=r.chunk.purpose_passages?.[purpose];
    return segment&&r.chunk.text.includes(segment);
  }):[];
  const requiredResults=[...results.filter(r=>r.required==='DOCUMENT_REFERENCE'),...results.filter(r=>r.required==='RETRIEVAL_PLAN')];
  const contextResults=[...requiredResults,...scopedResults.filter(r=>!r.required),...results.filter(r=>!r.required&&!scopedResults.includes(r))];
  for (const r of contextResults) {
    const per = Math.max(1200, Math.floor(totalBudget / results.length));
    // Dọn sạch tiêu đề thô 16.xx khỏi snippet để LLM không bị dính vào câu trả lời
    // Curated conditional paragraphs are an indivisible rule plus its exceptions.
    // The line selector would otherwise drop a whole one-line paragraph when it
    // exceeds the per-document allowance, silently giving the model no evidence.
    const curatedParagraph = r.chunk.file === 'KB/semantic-topic-supplements' && r.chunk.text.length <= 4000;
    // Consolidation can replace a rule's text while keeping its original file
    // name. Preserve short complete rules by structure/size, not filename.
    const boundedRule = r.chunk.text.length <= 3000;
    // A rate table and its governing conditions are one unit. Selecting rows
    // independently can keep only "other activities" and silently drop the
    // applicable rate. Preserve the complete bounded rule, never a lone row.
    const boundedTableRule = /(?:^|\n)\s*\|[^\n]+\|/.test(r.chunk.text) && r.chunk.text.length <= 6000;
    const purposeSnippet=purpose?r.chunk.purpose_passages?.[purpose]:undefined;
    // Reviewed excerpts are literal, self-contained portions of the canonical
    // source. Never silently truncate an indivisible legal rule or synthesize
    // new law while compressing context. Invalid excerpts fall back to source.
    const excerptPeriod=r.chunk.context_passage_period;
    const compact=(!excerptPeriod||scope.years.length>0&&scope.years.every(year=>periodFits(excerptPeriod,{years:[year]})))?r.chunk.context_passage:undefined;
    const rawSnippet = purposeSnippet&&r.chunk.text.includes(purposeSnippet)?purposeSnippet:
      compact&&r.chunk.text.includes(compact)?compact:r.chunk.evidence_mode==='COMPLETE_RULE'||boundedRule || curatedParagraph || boundedTableRule ? r.chunk.text : snippet(r.chunk, `${query} ${scope.years.join(' ')}`, per);
    const cleanedSnippet = rawSnippet
      .replace(/^##?\s*16\.\d+.*?\n/gim, '')
      .replace(/^##?\s*\d+\.\d+.*?\n/gim, '')
      .replace(/^-\s*\*\*LEGAL_STATUS:\*\*.*?\n/gim, '')
      .replace(/^-\s*CROSS_REFERENCE:.*?\n/gim, '');
    if(!cleanedSnippet.trim())continue;

    const conditionNote = r.chunk.tier === 'VERIFIED_CONDITIONAL'
      ? ' — chỉ áp dụng khi đã xác minh đầy đủ điều kiện trong đoạn này'
      : '';
    const periodNote = scope.years.length ? '' : ' — chưa xác định kỳ thuế của người hỏi; các năm trong tài liệu không phải năm của người hỏi';
    const passage:EvidencePassage={id:`E${passages.length+1}`,ref_id:r.chunk.ref_id||r.chunk.id,text:cleanedSnippet,provenance:evidenceProvenance(r.chunk),...(purposeSnippet&&r.chunk.text.includes(purposeSnippet)?{purpose}: {})};
    const part = `\n[Tri thức liên quan: ${r.chunk.file}${conditionNote}${periodNote}; evidence_id=${passage.id}; ref_id=${passage.ref_id}]\n${passage.text}\n`;
    if (text.length + part.length > totalBudget + 800) continue;
    text += part;
    passages.push(passage);
    if (r.chunk.ref_id) includedRefs.push(r.chunk.ref_id);

    // Trích xuất điều khoản văn bản sạch từ chunk
    const extracted = extractLegalCitationsFromChunk({ ...r.chunk, text: cleanedSnippet });
    rawCitations.push(...extracted);
  }

  const explicitYears = scope.years;
  const latestRequestedYear = explicitYears.length ? Math.max(...explicitYears) : null;
  const citations = cleanAndDeduplicateCitations(rawCitations).filter((citation) => {
    if (latestRequestedYear === null) return true;
    const documentYears = Array.from(citation.matchAll(/\/(?:19|20)\d{2}\b/g), (match) => Number(match[0].slice(1)));
    return documentYears.every((year) => year <= latestRequestedYear);
  });

  const missingDocumentRefs=results.filter(r=>r.required==='DOCUMENT_REFERENCE'&&!includedRefs.includes(r.chunk.ref_id||r.chunk.id)).map(r=>r.chunk.ref_id||r.chunk.id);
  const missingRequiredRefs=results.filter(r=>r.required&&!includedRefs.includes(r.chunk.ref_id||r.chunk.id)).map(r=>r.chunk.ref_id||r.chunk.id);
  return { text, citations, includedRefs, passages,missingDocumentRefs,missingRequiredRefs };
}

/**
 * Trích số tiền trong câu hỏi và so sánh với các ngưỡng bằng code (LLM nhỏ hay so sánh sai),
 * đồng thời chạy Deterministic Tax Engine để đưa kết quả tính toán chính xác vào prompt.
 */
export function analyzeAmounts(query: string): string {
  const facts = extractAllAmounts(query).map(amount =>
    `- Số "${amount.raw}" = ${amount.vnd.toLocaleString('vi-VN')} đồng (giữ chính xác đến 1 đồng).`);
  return facts.length
    ? `QUY ĐỔI ĐƠN VỊ (chưa xác định kỳ tính thuế hoặc tính chất doanh thu):\n${facts.join('\n')}\nChỉ kết luận nghĩa vụ thuế sau khi xác định năm/kỳ, loại thu nhập và căn cứ phù hợp.\n`
    : '';
}
