import type { AnswerScope } from './answerScope';

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const EINVOICE_CITATION = 'Khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP (sửa đổi khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP)';

/** Compare the answer against every material intent explicitly present in the question. */
export function missingAnswerIntents(question: string, answer: string): string[] {
  const q = fold(question);
  const a = fold(answer);
  const missing: string[] = [];
  if (/gtgt/.test(q) && /giam|204\/2025/.test(q) && !/gtgt/.test(a)) missing.push('vat_relief');
  if (/tncn|thu nhap tinh thue/.test(q) && !/tncn|thu nhap ca nhan/.test(a)) missing.push('pit');
  if (/tiktok/.test(q) && /\btax\b/.test(q) && !/\btax\b|khau tru|nop thay|chung tu/.test(a)) missing.push('platform_withholding');
  if (/hoa don dien tu|hddt/.test(q) && !/hoa don dien tu|hddt/.test(a)) missing.push('einvoice');
  return missing;
}

/** Validate a known rule's document, article, clause, content and effective tax period. */
export function validateLegalCitations(question: string, answer: string, citations: string[], scope: AnswerScope) {
  // Retrieval candidates are not automatically sources supporting the final answer.
  // Keep only documents actually cited in the prose; do not invent missing citations.
  const documentIds = (text: string) => fold(text).match(/\b\d+\/(?:19|20)\d{2}(?:\/[a-z0-9-]+)?/g) || [];
  const citedIds = new Set(documentIds(answer));
  citations = citations.filter(citation => {
    const ids = documentIds(citation);
    return ids.length ? ids.some(id => citedIds.has(id)) : fold(answer).includes(fold(citation));
  });
  const sourceSection = answer.split(/Căn cứ pháp lý\s*:/i).slice(1).join('\n');
  for (const line of sourceSection.split('\n').map(s => s.trim()).filter(Boolean)) {
    const ids = documentIds(line);
    if (ids.length && !citations.some(c => documentIds(c).some(id => ids.includes(id)))) citations.push(line);
  }
  const q = fold(question);
  const a = fold(answer);
  const invoiceRule = scope.years.every(y => y >= 2026) &&
    /hoa don dien tu|hddt/.test(q) && /1\s*ty|1[.]000[.]000[.]000/.test(q) &&
    /30\s*ngay/.test(a);
  if (!invoiceRule) return { answer, citations };
  const wrongArticle = /(?:khoan\s*\d+\s*)?dieu\s*9[\s,.:;–—-]*nghi\s*dinh\s*141\/2026/.test(a);
  const hasCorrect = /khoan\s*2\s*dieu\s*1\s*nghi\s*dinh\s*141\/2026/.test(a) &&
    /khoan\s*5\s*dieu\s*8\s*nghi\s*dinh\s*68\/2026/.test(a);
  let corrected = answer;
  if (wrongArticle) corrected = corrected.replace(/(?:Khoản\s*\d+\s*)?Điều\s*9[\s,.:;–—-]*Nghị\s*định\s*141\/2026\/NĐ-CP/gi,
    hasCorrect ? '' : EINVOICE_CITATION);
  if (!hasCorrect && !wrongArticle) corrected += `\n\nCăn cứ trực tiếp cho thời hạn 30 ngày: ${EINVOICE_CITATION}.`;
  const cleanCitations = citations.filter(c => !/(?:Khoản\s*\d+\s*)?Điều\s*9[\s,.:;–—-]*Nghị\s*định\s*141\/2026\/NĐ-CP/i.test(c));
  if (!cleanCitations.includes(EINVOICE_CITATION)) cleanCitations.push(EINVOICE_CITATION);
  return { answer: corrected, citations: cleanCitations };
}
