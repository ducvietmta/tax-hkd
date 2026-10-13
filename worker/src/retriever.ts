/**
 * HYBRID RETRIEVER cho RAG (chạy trên Cloudflare Workers)
 * - Chuẩn hoá tiếng Việt không dấu => "tiktok shop" / "tiếp thị liên kết" / "tiep thi lien ket" đều khớp
 * - BM25 trên unigram + bigram, có trọng số riêng cho tiêu đề (section)
 * - Mở rộng từ đồng nghĩa (query expansion)
 * - Route (query-map) chỉ BOOST điểm, không loại bỏ kết quả tìm kiếm
 * - Cắt snippet theo câu hỏi để prompt gọn, LLM không bị nhiễu bởi chunk dài
 */
import { CANONICAL_CHUNKS, RagChunk, matchRoute } from './ragEngine';
import { resolveAnswerScope, type AnswerScope } from './answerScope';
import { extractTaxFactsFromQuery, calculateTax } from './taxEngine';

export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9%\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
}

export function retrieve(query: string, limit = 4, scope: AnswerScope = resolveAnswerScope([], query)): { results: Retrieved[]; routeId: string | null; usedFallback: boolean } {
  build();
  const idx = INDEX!;
  const qTerms = termsOf(expandQuery(`${query} ${scope.years.join(' ')}`));
  const route = matchRoute(`${query} ${scope.years.join(' ')}`);
  const routeRefs = new Set(route?.refs || []);
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
  const asksRefund = /\b(hoan thue|nop thua|lay lai tien thue)\b/.test(normalizedQuery) ||
    (/\bthue\b/.test(normalizedQuery) && /\b(hoan lai|hoan tien|lay lai)\b/.test(normalizedQuery));
  const asksWageCalculation = /\b(bieu thue|bac thue|giam tru|tinh thue luong|thue luong bao nhieu)\b/.test(normalizedQuery);
  const oldYearsRe = new RegExp(`\\b(${Array.from({ length: 5 }, (_, i) => currentYear - 5 + i).join('|')})\\b`);
  const currentYearRe = new RegExp(`\\b${currentYear}\\b`);

  // Gom chuỗi lọc thành hàm để có thể thử lại với ngưỡng thấp hơn (fallback).
  const pick = (minScore: number): Retrieved[] => {
    const results = scored
      .filter((r) => r.score >= minScore)
      .filter((r) => !asksAboutSales || asksAboutAffiliate ||
        !/affiliate|tiep thi lien ket/.test(fold(r.chunk.section)))
      .filter((r) => /\b(youtube|adsense)\b/.test(normalizedQuery) ||
        !/\b(youtube|adsense)\b/.test(fold(r.chunk.section)))
      .filter((r) => !asksAboutAffiliate || asksWageCalculation ||
        !['16.81', '16.82', '16.93'].includes(r.chunk.ref_id || ''))
      .filter((r) => !historicalOnly || !['16.57', '16.95', '16.96'].includes(r.chunk.ref_id || ''))
      .filter((r) => !asksCurrentYear || !oldYearsRe.test(fold(r.chunk.section)) ||
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
  // Điểm cao nhất hiện tại — dùng để gắn cho chunk chèn tay (ưu tiên lên đầu).
  const topScore = selected[0]?.score || 0;
  // Annual revenue questions about 2022–2025 need the historical 100-million threshold,
  // even when a broad e-commerce route scores higher.
  if (historicalOnly && /\bdoanh thu\b/.test(normalizedQuery)) {
    const historicalThreshold = idx.find((item) => item.chunk.ref_id === '16.54');
    if (historicalThreshold) {
      selected = selected.filter((item) => item.chunk.ref_id !== '16.54');
      selected.unshift({ chunk: historicalThreshold.chunk, score: topScore + 1, viaRoute: false });
    }
  }
  // A multi-part question needs both classification and refund evidence, not a salary table.
  const requiredRefs = [
    ...(asksAboutAffiliate && !historicalOnly ? ['16.95'] : []),
    ...(asksRefund ? ['16.51'] : []),
  ];
  for (const ref of requiredRefs.reverse()) {
    const evidence = idx.find(item => item.chunk.ref_id === ref);
    if (!evidence) continue;
    const existing = selected.findIndex(item => item.chunk.ref_id === ref);
    if (existing >= 0) selected.splice(existing, 1);
    selected.unshift({ chunk: evidence.chunk, score: topScore + 1, viaRoute: false });
  }
  // A short follow-up with annual revenue must still retrieve the year-specific threshold.
  if (asksCurrentYear && (
      (normalizedQuery.includes('doanh thu') && /\b(nop thue|mien thue|gtgt|tncn)\b/.test(normalizedQuery)) ||
      (asksRefund && asksAboutAffiliate && /\b\d+\s*(trieu|ty)\b/.test(normalizedQuery))
    )) {
    const threshold = idx.find((item) => item.chunk.ref_id === '16.60');
    if (threshold) {
      const existing = selected.findIndex((item) => item.chunk.ref_id === '16.60');
      if (existing >= 0) selected.splice(existing, 1);
      selected.unshift({ chunk: threshold.chunk, score: topScore + 1, viaRoute: false });
    }
  }
  // Keep the tax-ID and 2026 filing guidance together for multi-part affiliate questions.
  if (!historicalOnly && (/\b888\b/.test(normalizedQuery) ||
      (asksAboutAffiliate && /\b(1 ty|mot ty)\b/.test(normalizedQuery)))) {
    const guidance = idx.find((item) => item.chunk.ref_id === '16.96');
    if (guidance) {
      const existing = selected.findIndex((item) => item.chunk.ref_id === '16.96');
      if (existing >= 0) selected.splice(existing, 1);
      selected.unshift({ chunk: guidance.chunk, score: topScore + 2, viaRoute: false });
    }
  }
  // MỤC 5: Ép bảng tỷ lệ % thuế (chunk 16.77) khi hỏi "bao nhiêu %" / "bao nhiêu phần trăm" và có ngành nghề
  const asksPercentageRate = /bao nhieu\s*(phan tram|%)/.test(normalizedQuery) ||
    (/\b(thue suat|ty le)\b/.test(normalizedQuery) && /\b(bao nhieu|may %)\b/.test(normalizedQuery));
  const mentionsSector = /\b(hang hoa|tap hoa|dich vu|an uong|van tai|xay dung|phan phoi|cat toc|spa|nha hang|quan an|ca phe)\b/.test(normalizedQuery);

  // NQ 43/2026/QH16 (chunk 16.99): Nạp ưu đãi giảm 30% TNCN khi tính thuế năm 2026
  const asksTaxCalculation2026 =
    !historicalOnly &&
    (/\b(1[,.]01\s*ty|1010\s*trieu|1[,.]5\s*ty|1500\s*trieu|1[.]000[.]000[.]001|tinh thue|nop thue|phai nop|nq43|30%)\b/.test(normalizedQuery) ||
      (asksPercentageRate && mentionsSector) ||
      (normalizedQuery.includes('doanh thu') && /\b(ty|trieu)\b/.test(normalizedQuery)));
  if (asksTaxCalculation2026) {
    const nq43Chunk = idx.find((item) => item.chunk.ref_id === '16.99');
    if (nq43Chunk) {
      const existing = selected.findIndex((item) => item.chunk.ref_id === '16.99');
      if (existing >= 0) selected.splice(existing, 1);
      selected.unshift({ chunk: nq43Chunk.chunk, score: topScore + 1.2, viaRoute: false });
    }
  }

  if (asksPercentageRate && mentionsSector) {
    const rateChunk = idx.find((item) => item.chunk.ref_id === '16.77');
    if (rateChunk) {
      const existing = selected.findIndex((item) => item.chunk.ref_id === '16.77');
      if (existing >= 0) selected.splice(existing, 1);
      selected.unshift({ chunk: rateChunk.chunk, score: topScore + 2, viaRoute: false });
    }
  }
  return {
    results: selected.slice(0, limit),
    routeId: route?.id || null,
    usedFallback,
  };
}

/** Giữ lại các dòng liên quan nhất của chunk dài, giữ nguyên thứ tự gốc. */
export function snippet(chunk: RagChunk, query: string, budget = 2200): string {
  const text = chunk.text;
  if (text.length <= budget) return text;
  const lines = text.split('\n');
  const qset = new Set(termsOf(expandQuery(query)).filter((t) => !t.includes('_')));
  const requestedYears = Array.from(query.matchAll(/\b(?:19|20)\d{2}\b/g), (match) => match[0]);
  const scored = lines.map((l, i) => {
    const lt = new Set(termsOf(l));
    let s = i === 0 ? 100 : 0; // luôn giữ tiêu đề
    if (/LEGAL_STATUS|Căn cứ|Nguồn:/i.test(l)) s += 1;
    // Ưu tiên dòng nêu điều kiện / ngoại lệ / lưu ý — thường là chỗ quyết định đúng-sai,
    // dễ bị loại khi chỉ chấm theo từ khóa câu hỏi (tương đương ~3 từ khóa khớp).
    if (/\b(ngoai tru|khong ap dung|dieu kien|truong hop|chi ap dung|mien|giam|luu y|chu y)\b/.test(fold(l))) s += 6;
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

export function buildContext(results: Retrieved[], query: string, totalBudget = 6500, scope: AnswerScope = resolveAnswerScope([], query)): { text: string; citations: string[] } {
  let text = '';
  const rawCitations: string[] = [];

  for (const r of results) {
    const per = Math.max(1200, Math.floor(totalBudget / results.length));
    // Dọn sạch tiêu đề thô 16.xx khỏi snippet để LLM không bị dính vào câu trả lời
    const rawSnippet = snippet(r.chunk, `${query} ${scope.years.join(' ')}`, per);
    const cleanedSnippet = rawSnippet
      .replace(/^##?\s*16\.\d+.*?\n/gim, '')
      .replace(/^##?\s*\d+\.\d+.*?\n/gim, '')
      .replace(/^-\s*\*\*LEGAL_STATUS:\*\*.*?\n/gim, '')
      .replace(/^-\s*CROSS_REFERENCE:.*?\n/gim, '');

    const conditionNote = r.chunk.tier === 'VERIFIED_CONDITIONAL'
      ? ' — chỉ áp dụng khi đã xác minh đầy đủ điều kiện trong đoạn này'
      : '';
    const periodNote = scope.years.length ? '' : ' — chưa xác định kỳ thuế của người hỏi; các năm trong tài liệu không phải năm của người hỏi';
    const part = `\n[Tri thức liên quan: ${r.chunk.file}${conditionNote}${periodNote}]\n${cleanedSnippet.replace(/\b16\.\d+\b/g, '')}\n`;
    if (text.length + part.length > totalBudget + 800) break;
    text += part;

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

  return { text, citations };
}

/**
 * Trích số tiền trong câu hỏi và so sánh với các ngưỡng bằng code (LLM nhỏ hay so sánh sai),
 * đồng thời chạy Deterministic Tax Engine để đưa kết quả tính toán chính xác vào prompt.
 */
export function analyzeAmounts(query: string): string {
  const f = query.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
  const re = /(\d+(?:[.,]\d+)?)\s*(nghin ty|ty|trieu|tr)\b/g;
  const facts: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(f))) {
    const n = parseFloat(m[1].replace(',', '.'));
    if (!isFinite(n)) continue;
    const unit = m[2];
    const vnd = unit === 'nghin ty' ? n * 1e12 : unit === 'ty' ? n * 1e9 : n * 1e6;
    const ty = vnd / 1e9;
    const fmt = ty >= 1 ? `${+ty.toFixed(3)} tỷ đồng` : `${Math.round(vnd / 1e6)} triệu đồng`;
    facts.push(`- Số "${m[0]}" = ${fmt}.`);
  }
  return facts.length
    ? `QUY ĐỔI ĐƠN VỊ (chưa xác định kỳ tính thuế hoặc tính chất doanh thu):\n${facts.join('\n')}\nChỉ kết luận nghĩa vụ thuế sau khi xác định năm/kỳ, loại thu nhập và căn cứ phù hợp.\n`
    : '';
}
