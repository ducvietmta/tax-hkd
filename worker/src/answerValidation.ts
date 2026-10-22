import type { AnswerScope } from './answerScope';
import type { BusinessClassification } from './decision/jevProvider';

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
  .replace(/([a-z])(?=\d)|(\d)(?=[a-z])/g, '$1$2 ');
const EINVOICE_CITATION = 'Khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP (sửa đổi khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP)';

export function requestedTaxFocus(question: string): 'vat' | 'pit' | 'both' | 'unspecified' {
  const active = fold(question).replace(/\b(?:khong|ko)\s+(?:hoi|can|tinh|xet)(?:\s+(?:hoi|tinh|xet|ve|den|phan|thue))*\s*(?:tncn|thu nhap ca nhan|gtgt|gia tri gia tang)\b/g, '');
  const vat = /\bgtgt\b|gia tri gia tang/.test(active);
  const pit = /\btncn\b|thu nhap ca nhan/.test(active);
  return vat && pit ? 'both' : vat ? 'vat' : pit ? 'pit' : 'unspecified';
}

/** Compare the answer against every material intent explicitly present in the question. */
export function missingAnswerIntents(question: string, answer: string, semantic?: BusinessClassification): string[] {
  const q = fold(question);
  const a = fold(answer);
  const missing: string[] = [];
  const explicitFocus = requestedTaxFocus(question);
  const focus = explicitFocus === 'both' ? 'both' : semantic?.taxFocus && semantic.taxFocus !== 'unspecified' ? semantic.taxFocus : explicitFocus;
  const asksRelief = semantic ? semantic.primaryIntent === 'RELIEF_REDUCTION' || semantic.secondaryIntents.includes('RELIEF_REDUCTION')
    : /giam|\b(?:nq\s*204|204\/2025)\b/.test(q);
  if (semantic?.vatRelief !== 'INELIGIBLE' && (focus === 'vat' || focus === 'both') && asksRelief &&
      (!/gtgt/.test(a) || !/204|174|20\s*%|0[,.]8\s*%|4\s*%|giam\s+gtgt/.test(a))) missing.push('vat_relief');
  const asksPitAmount = !semantic || ['TAX_AMOUNT', 'REVENUE_THRESHOLD'].includes(semantic.topic || '');
  // A tax name or percentage alone is not a calculated amount. Check each
  // requested tax separately; never borrow the other tax's numeric result.
  if (semantic && focus === 'both' &&
      (semantic.primaryIntent === 'TAX_CALCULATION' || semantic.secondaryIntents.includes('TAX_CALCULATION')) &&
      semantic.topic === 'TAX_AMOUNT') {
    const body = a.split('can cu phap ly')[0];
    const amount = '\\d[\\d.,]*\\s*(?:dong|trieu|ty)';
    for (const [tax, other, issue] of [['gtgt|gia tri gia tang', 'tncn|thu nhap ca nhan', 'vat_amount'],
      ['tncn|thu nhap ca nhan', 'gtgt|gia tri gia tang', 'pit_amount']]) {
      const segment = `(?:${tax})(?:(?!(?:${other}))[\\s\\S]){0,450}?`;
      // A revenue/base amount near a tax name is not a tax result. Require
      // an equality or an explicit payable/result label inside that tax block.
      const result = `(?:=|(?:phai nop|truoc giam|sau giam|con phai nop|so thue|tong thue|tong gtgt|tong tncn)\\s*[:=]?)\\s*(?:la\\s*)?${amount}`;
      const directResult = `(?:${tax})\\s*(?:phai nop|truoc giam|sau giam)?\\s*[:=]\\s*${amount}`;
      if (!new RegExp(segment + result).test(body) && !new RegExp(directResult).test(body) &&
          !new RegExp(segment + '(?:khong phai nop|chua (?:du|the)|thieu (?:du kien|ho so))').test(body)) missing.push(issue);
    }
  }
  if (asksPitAmount && (focus === 'pit' || focus === 'both' || /thu nhap tinh thue/.test(q)) && !/tncn|thu nhap ca nhan/.test(a)) missing.push('pit');
  const platformContext = /tiktok|nen tang|\bsan\b|\btax\b/.test(q) ||
    semantic?.primaryIntent === 'PLATFORM_WITHHOLDING' || semantic?.secondaryIntents.includes('PLATFORM_WITHHOLDING') ||
    semantic?.incomeTypes.includes('AFFILIATE_COMMISSION');
  if (platformContext && /\btax\b|giu lai|khau tru|nop thay|doi tru/.test(q) &&
      !/\btax\b|khau tru|nop thay|chung tu|doi soat/.test(a)) missing.push('platform_withholding');
  if ((!semantic || semantic.topic === 'INVOICE_REGISTRATION') && /hoa don dien tu|hddt/.test(q) && !/hoa don dien tu|hddt/.test(a)) missing.push('einvoice');
  return missing;
}

/** A template may bypass generation only when it answers the complete request. */
export function canUseVerifiedAnswer(question: string, answer: string, taxFocus?: BusinessClassification['taxFocus'], semantic?: BusinessClassification, calculatedByRules=false): boolean {
  if(semantic?.subjectContext==='INDIVIDUAL_ACTIVITY'&&semantic.registrationStatus!=='HOUSEHOLD_REGISTERED'&&semantic.topic!=='TAX_AMOUNT')return false;
  // A scoped policy question goes through grounded generation and semantic
  // assessment; fixed prose cannot establish coverage by mentioning a policy.
  if(semantic?.policyFocus&&semantic.policyFocus!=='UNSPECIFIED')return false;
  // No fixed answer can certify actual obligations from a projection/partial year.
  // This applies to priority templates as well as the ordinary template branch.
  if(['PROJECTED','PARTIAL_PERIOD'].includes(semantic?.revenueContext||''))return false;
  if((!semantic?.policyFocus||semantic.policyFocus==='UNSPECIFIED')&&semantic?.answerPurpose==='ELIGIBILITY'&&
    ['REVENUE_THRESHOLD','REVENUE_OWNERSHIP'].includes(semantic?.topic||''))return false;
  // A classifier's narrower label must not certify omission of a tax explicitly
  // requested alongside another. This is a veto, not legal classification.
  if(requestedTaxFocus(question)==='both'&&taxFocus!=='both')return false;
  // Opening-registration templates cannot certify a closing procedure.
  if (['BUSINESS_CESSATION','BUSINESS_SUSPENSION','TAX_REGISTRATION_CHANGE','TAX_STATUS_RESTORATION','TAX_PAYMENT_RECONCILIATION','TAX_EXTENSION','TAXPAYER_RIGHTS','ACCOUNTING_RETENTION','INVOICE_USAGE','BUSINESS_EXPENSES'].includes(semantic?.topic || '')) return false;
  // A single-basis template cannot certify an aggregated/scenario calculation or
  // override the taxpayer's already active PIT method. These are semantic labels.
  if (!calculatedByRules && ['TAX_AMOUNT', 'REVENUE_THRESHOLD'].includes(semantic?.topic || '') &&
      ((semantic?.calculationShape && semantic.calculationShape !== 'SINGLE') ||
       (semantic?.methodContext && semantic.methodContext !== 'UNSPECIFIED' && taxFocus !== 'vat'))) return false;
  if (missingAnswerIntents(question, answer, semantic).length) return false;
  const q = fold(question);
  const revenue = q.match(/\b(?:tong\s+)?doanh thu\s+(\d+(?:[.,]\d+)?)\s*(ty|trieu)\b/);
  if (revenue) {
    const expected = Math.round(Number(revenue[1].replace(',', '.')) * (revenue[2] === 'ty' ? 1e9 : 1e6));
    const a = fold(answer);
    const values = [...a.matchAll(/(\d+(?:[.,]\d+)?)\s*(ty|trieu)\b/g)]
      .map(m => Math.round(Number(m[1].replace(',', '.')) * (m[2] === 'ty' ? 1e9 : 1e6)));
    const exact = [...a.matchAll(/(?<!\d)\d{1,3}(?:[.,]\d{3}){2,}(?!\d)/g)].map(m => Number(m[0].replace(/[.,]/g, '')));
    if (!values.includes(expected) && !exact.includes(expected)) return false;
  }
  const focus = taxFocus || requestedTaxFocus(question);
  const body = fold(answer.split(/Căn cứ pháp lý\s*:/i)[0]);
  if (focus === 'pit' && !/hai hoat dong|hai nganh|vua ban|vua lam|nhieu nganh|tru nguong 1 ty|tru 1 ty|muc tru 1 ty/.test(q) && /(?:thue\s+)?gtgt[^\n]{0,100}(?:\d[\d.,]*\s*(?:%|dong|trieu|ty))/.test(body)) return false;
  if (focus === 'vat' && /(?:thue\s+)?tncn[^\n]{0,100}(?:\d[\d.,]*\s*(?:%|dong|trieu|ty))/.test(body)) return false;
  if (focus === 'vat' && /thu nhap chiu thue|doanh thu chiu thue tncn|tncn (?:truoc|sau)/.test(fold(answer))) return false;
  return true;
}

/** Danh sách toàn bộ văn bản pháp luật và công văn hướng dẫn đang có hiệu lực trong KB. */
export const KNOWN_EFFECTIVE_DOC_PATTERNS = [
  // Văn bản năm 2026
  '68/2026', '141/2026', '252/2026', '253/2026', '254/2026', '296/2026',
  '43/2026', '89/2026', '90/2026', '91/2026', '87/2026', '50/2026',
  '18/2026', '20/2026', '09/2026', '24/2026', '25/2026', '144/2026',
  '6480/ct',
  // Văn bản năm 2025
  '36/2025', '204/2025', '174/2025', '168/2025', '152/2025', '181/2025', '310/2025',
  '320/2025', '108/2025', '109/2025', '64/2025', '67/2025', '70/2025',
  '122/2025', '311/tct', '7403/ct', '1272/qd',
  // Văn bản năm 2024 trở về trước còn hiệu lực hoặc đối chiếu lịch sử
  '86/2024', '48/2024', '40/2021', '78/2021', '88/2021', '100/2021',
  '01/2021', '123/2020', '125/2020', '126/2020', '22/2020', '139/2016',
  '92/2015', '111/2013',
] as const;

/** Các mẫu viện dẫn tài liệu hướng dẫn / cổng thuế / mã TTHC hợp lệ khi có trong bằng chứng (Nhóm A/B/C). */
const MANUAL_PORTAL_MARKERS = [
  '1.008499', '1.007565', 'etax mobile', 'canhantmdt.gdt.gov.vn', 'thuedientu.gdt.gov.vn',
  'canhan.gdt.gov.vn', 'dichvucong.gdt.gov.vn', 'hoadondientu.gdt.gov.vn', 'htkk', 'itaxviewer',
  '01/cnkd', '01/tkn-cnkd', '01/tbdt', '01/bk-stk', '02/qtt-tncn-cnkd',
  '03-dkt', '03-dk-tct', '04/ss-hddt', '01/dktd-hddt', '20-dkt', '20-dkt-th', '20-dk-th-tct',
  's1a-hkd', 's2a-hkd', 's2b-hkd', 's2c-hkd', 's2d-hkd', 's2e-hkd',
].map(m => fold(m));

/** Validate a known rule's document, article, clause, content and effective tax period. */
export function validateLegalCitations(
  question: string,
  answer: string,
  citations: string[],
  scope: AnswerScope,
  relevantChunks?: Array<{ ref_id?: string | null; section?: string; text?: string }>,
  semantic?: BusinessClassification,
) {
  const isAbcGroup =
    ['BUSINESS_CESSATION', 'SYSTEM_REGISTRATION', 'PORTAL_TROUBLESHOOTING', 'TAX_SOFTWARE_SYSTEM', 'BUSINESS_REGISTRATION', 'TAX_REGISTRATION', 'REGISTRATION_COMPARISON', 'REGISTRATION_REQUIREMENTS', 'INVOICE_REGISTRATION'].includes(semantic?.topic || '') ||
    ['SYSTEM_REGISTRATION', 'PORTAL_TROUBLESHOOTING', 'TAX_SOFTWARE_SYSTEM', 'REGISTRATION', 'TAX_ID_888'].includes(semantic?.primaryIntent || '');

  // Retrieval candidates are not automatically sources supporting the final answer.
  // Keep only documents actually cited in the prose; do not invent missing citations.
  const documentIds = (text: string): string[] => {
    const f = fold(text);
    const byYear = f.match(/\b\d+\/(?:19|20)\d{2}(?:\/[a-z0-9-]+)?/g) || [];
    const byAgency = f.match(/\b\d+\/(?:tct|ct|qd|btc|gdt|cntt)(?:-[a-z0-9]+)?\b/g) || [];
    return [...new Set([...byYear, ...byAgency])];
  };
  const manualTokens = (text: string): string[] => {
    const f = fold(text);
    return MANUAL_PORTAL_MARKERS.filter(m => f.includes(m));
  };

  const evidenceText = relevantChunks?.length
    ? fold(relevantChunks.map(c => `${c.section || ''} ${c.text || ''}`).join(' '))
    : '';

  const citedIds = new Set(documentIds(answer));
  const citedManuals = new Set(manualTokens(answer));

  citations = citations.filter(citation => {
    const ids = documentIds(citation);
    if (ids.length) return ids.some(id => citedIds.has(id));
    if (isAbcGroup) {
      const mTokens = manualTokens(citation);
      if (mTokens.length) return mTokens.some(m => citedManuals.has(m));
    }
    return fold(answer).includes(fold(citation));
  });

  const sourceSection = answer.split(/Căn cứ(?:\s+pháp\s+lý|\s+hướng\s+dẫn)?\s*:/i).slice(1).join('\n');
  for (const rawLine of sourceSection.split('\n')) {
    const line = rawLine.replace(/^[-*+•]\s*/, '').trim();
    if (!line || /^không áp dụng/i.test(line)) continue;
    const ids = documentIds(line);
    if (ids.length) {
      if (!citations.some(c => documentIds(c).some(id => ids.includes(id)))) {
        citations.push(line);
      }
    } else if (isAbcGroup) {
      const mTokens = manualTokens(line);
      // Nhóm A/B/C được phép viện dẫn tài liệu hướng dẫn / cổng thuế / mã TTHC NẾU thực sự có trong bằng chứng
      if (mTokens.length && (!relevantChunks?.length || mTokens.some(m => evidenceText.includes(m)))) {
        if (!citations.some(c => fold(c) === fold(line))) {
          citations.push(line);
        }
      }
    }
  }

  // Loại bỏ trích dẫn văn bản tương lai không thuộc kỳ tính thuế đang hỏi
  const maxRequestedYear = scope.years.length ? Math.max(...scope.years) : 2026;
  const isSupportedCitation = (citation: string): boolean => {
    const docYears = Array.from(citation.matchAll(/\/(?:19|20)\d{2}\b/g), m => Number(m[0].slice(1)));
    if (!docYears.every(y => y <= maxRequestedYear)) return false;
    if (!relevantChunks?.length) return true;
    const ids = documentIds(citation);
    if (ids.length) {
      const evidenceIds=documentIds(evidenceText);
      const baseId=(id:string)=>id.match(/^\d+\/(?:19|20)\d{2}/)?.[0]||id;
      return ids.every(id=>evidenceIds.some(source=>source===id||baseId(source)===baseId(id)));
    }
    if (isAbcGroup) {
      const mTokens = manualTokens(citation);
      if (mTokens.length) {
        return mTokens.some(m => evidenceText.includes(m));
      }
    }
    return evidenceText.includes(fold(citation));
  };

  citations = citations.filter(isSupportedCitation);

  const q = fold(question);
  let corrected = answer;
  if (relevantChunks?.length && /Căn cứ(?:\s+pháp\s+lý|\s+hướng\s+dẫn)?\s*:/i.test(corrected)) {
    const parts = corrected.split(/(Căn cứ(?:\s+pháp\s+lý|\s+hướng\s+dẫn)?\s*:)/i);
    if (parts.length >= 3) {
      const head = parts[0];
      const label = parts[1];
      const tail = parts.slice(2).join('');
      const keptLines = tail.split('\n').filter(rawLine => {
        const line = rawLine.replace(/^[-*+•]\s*/, '').trim();
        if (!line) return true;
        if (/^không áp dụng/i.test(line)) return true;
        return isSupportedCitation(line);
      });
      corrected = `${head}${label}${keptLines.join('\n')}`.trim();
    }
  }

  // Sửa lỗi viện dẫn Luật 38/2019 hết hiệu lực từ 2026
  if (scope.years.every(y => y >= 2026) && /38\/2019\/qh14/.test(fold(corrected)) && evidenceText.includes('108/2025') && !evidenceText.includes('chuyen tiep')) {
    corrected = corrected.replace(/Luật\s+(?:Quản lý thuế\s+)?(?:số\s+)?38\/2019\/QH14/gi, 'Luật Quản lý thuế (sửa đổi) 108/2025/QH15');
    citations = citations.map(c => c.replace(/38\/2019\/QH14/g, '108/2025/QH15'));
  }

  const invoiceRule = scope.years.every(y => y >= 2026) &&
    /hoa don dien tu|hddt/.test(q) && /1\s*ty|1[.]000[.]000[.]000/.test(q + ' ' + fold(corrected)) &&
    /30\s*ngay/.test(fold(corrected));
  if (!invoiceRule) return { answer: corrected, citations };
  const wrongArticle = /(?:khoan\s*\d+\s*)?dieu\s*9[\s,.:;–—-]*nghi\s*dinh\s*(?:so\s*)?141\/2026/.test(fold(corrected));
  const hasCorrect = /khoan\s*2\s*dieu\s*1\s*nghi\s*dinh\s*(?:so\s*)?141\/2026/.test(fold(corrected)) &&
    /khoan\s*5\s*dieu\s*8\s*nghi\s*dinh\s*68\/2026/.test(fold(corrected));
  if (wrongArticle) corrected = corrected.replace(/(?:Khoản\s*\d+\s*)?Điều\s*9[\s,.:;–—-]*Nghị\s*định\s*(?:số\s*)?141\/2026\/NĐ-CP/gi,
    hasCorrect ? '' : EINVOICE_CITATION);
  if (!hasCorrect && !wrongArticle) corrected += `\n\nCăn cứ trực tiếp cho thời hạn 30 ngày: ${EINVOICE_CITATION}.`;
  const cleanCitations = citations.filter(c => !/(?:Khoản\s*\d+\s*)?Điều\s*9[\s,.:;–—-]*Nghị\s*định\s*(?:số\s*)?141\/2026\/NĐ-CP/i.test(c));
  if (!cleanCitations.includes(EINVOICE_CITATION)) cleanCitations.push(EINVOICE_CITATION);
  return { answer: corrected, citations: cleanCitations };
}
