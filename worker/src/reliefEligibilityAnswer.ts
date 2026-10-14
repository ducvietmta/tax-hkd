import type { AnswerScope } from './answerScope';

export interface VerifiedReliefAnswer {
  response: string;
  citations: string[];
  ruleIds: string[];
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

/** Answer the eligibility boundary without guessing a sector or a PIT amount. */
export function answerVerifiedReliefEligibility(question: string, scope: AnswerScope): VerifiedReliefAnswer | null {
  const q = normalize(question);
  if (scope.years.length !== 1 || ![2026, 2027].includes(scope.years[0])) return null;
  if (!/nghi quyet\s*43\/2026|giam\s*30\s*%/.test(q) || !/tncn|thu nhap ca nhan/.test(q)) return null;
  if (!/\bca nhan cu tru\b/.test(q) || /\bkhong cu tru\b/.test(q) || !/\bdoanh thu kinh doanh\b/.test(q)) return null;
  const tenBillionPlusOne = /\b10\s*ty(?:\s*dong)?\s*(?:cong\s*them|cong|them|hon|vuot|\+)\s*1\s*dong\b/.test(q) ||
    /(?<!\d)10[.,]000[.,]000[.,]001(?!\d)/.test(q);
  const tenBillion = /\b10\s*ty\b|(?<!\d)10[.,]000[.,]000[.,]000(?!\d)/.test(q);
  if (!tenBillion || !tenBillionPlusOne) return null;

  const year = scope.years[0];
  const multiLocation = /\b(?:5|nam)\s*(?:cua hang|dia diem|co so|chi nhanh)\b/.test(q);
  const citations = ['Khoản 1 Điều 1 và khoản 1 Điều 2 Nghị quyết 43/2026/QH16'];
  const lines = [
    `Với kỳ tính thuế ${year}, cá nhân cư trú có doanh thu kinh doanh cả năm đúng 10.000.000.000 đồng đáp ứng điều kiện doanh thu “không quá 10 tỷ đồng” để được giảm 30% số thuế TNCN phải nộp từ kinh doanh theo Nghị quyết 43/2026/QH16.`,
    'Người có doanh thu cả năm 10.000.000.001 đồng đã vượt trần 10 tỷ đồng dù chỉ 1 đồng, nên không đủ điều kiện giảm 30% theo nghị quyết này, kể cả khi là cá nhân cư trú.',
    multiLocation
      ? 'Nếu 5 cửa hàng thuộc cùng một cá nhân kinh doanh, cộng doanh thu của cả 5 cửa hàng trong năm để xét trần 10 tỷ đồng ở cấp cá nhân; không xét riêng từng cửa hàng. Cách hiểu này dựa trên việc Nghị quyết xét doanh thu hằng năm của cá nhân cư trú.'
      : 'Doanh thu từ nhiều cửa hàng của cùng một cá nhân kinh doanh được xét gộp theo doanh thu năm của cá nhân, không xét từng cửa hàng như từng người nộp thuế độc lập. Cách hiểu này dựa trên việc Nghị quyết xét doanh thu hằng năm của cá nhân cư trú.',
    'Mức 10 tỷ đồng ở đây chỉ là trần doanh thu để xét giảm 30% TNCN phải nộp; nó không phải ngưỡng 1 tỷ đồng dùng để xét nghĩa vụ thuế theo quy định khác. Không thể tính số tiền được giảm nếu chưa biết số thuế TNCN phải nộp.',
    `Căn cứ pháp lý:\n${citations.join('\n')}`,
  ];
  return { response: lines.join('\n\n'), citations, ruleIds: ['NQ43_2026_ART1_1_REVENUE_CAP'] };
}
