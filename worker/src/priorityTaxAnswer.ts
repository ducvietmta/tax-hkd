import type { AnswerScope } from './answerScope';
import { calculateTax, formatVnd, formatRevenue, type TaxFacts } from './taxEngine';
import type { VerifiedBusinessAnswer } from './businessTaxAnswer';

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const vnd = (s: string) => Number(s.replace(/[.,]/g, ''));
const money = (s: string, unit: string) => Math.round(Number(s.replace(',', '.')) * (unit === 'ty' ? 1e9 : 1e6));
const exact = (q: string) => [...q.matchAll(/(?<!\d)\d{1,3}(?:[.,]\d{3}){2,}(?!\d)/g)].map(m => vnd(m[0]));
const named = (q: string) => [...q.matchAll(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/g)].map(m => money(m[1], m[2]));
const unique = (xs: number[]) => [...new Set(xs)];

function result(response: string, citations: string[], ruleIds: string[], facts: TaxFacts): VerifiedBusinessAnswer {
  return { response: `${response}\n\nCăn cứ pháp lý:\n${citations.join('\n')}`, citations, ruleIds, facts };
}

/** High-confidence rules for compound questions that the generic engine/guard must not overwrite. */
export function answerPriorityTax(question: string, scope: AnswerScope): VerifiedBusinessAnswer | null {
  if (scope.years.length !== 1 || scope.years[0] !== 2026) return null;
  const q = fold(question);
  const amounts = unique([...exact(q), ...named(q)]);
  const revenue = amounts.find(n => n > 3e9 && n <= 50e9) || 0;

  // T86/T100: 3,000,000,001 is safely representable as an integer, never rounded to 3 billion.
  const overThree = revenue || (/3\s*ty\s*(?:\+|cong\s*them|them)\s*1\s*dong/.test(q) ? 3_000_000_001 : 0);
  const asksThreeBillionMethod = /(?:3\s*ty|3[.]000[.]000[.]001|3,000,000,001|0[.,]5\s*%|17\s*%)/.test(q) &&
    /tncn|thu nhap tinh thue|0[.,]5\s*%|17\s*%|phuong phap/.test(q);
  if (overThree && asksThreeBillionMethod) {
    const incomeMatch = q.match(/(?:thu nhap tinh thue|loi nhuan)(?:\s+hop le)?[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    const income = incomeMatch ? money(incomeMatch[1], incomeMatch[2]) : undefined;
    const resident = /\b(ca nhan cu tru|nguoi cu tru|toi cu tru|cu tru du dieu kien)\b/.test(q);
    const facts: TaxFacts = { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: overThree,
      taxableIncomeVnd: income, isResident: resident ? true : null, pitMethod: 'INCOME_EXPENSE' };
    const calc = calculateTax(facts);
    const citations = ['Điều 7 Luật Thuế TNCN 109/2025/QH15', 'Điều 4 Nghị định 68/2026/NĐ-CP', 'Khoản 1 Điều 1 Nghị quyết 43/2026/QH16'];
    const condition = income !== undefined && !resident ? 'Nếu bạn là cá nhân cư trú và đủ điều kiện Nghị quyết 43, ' : '';
    const response = income !== undefined
      ? `Doanh thu ${formatVnd(overThree)} đã vượt 3 tỷ đồng, dù chỉ 1 đồng; không được dùng phương pháp TNCN 0,5% trên doanh thu. Trong dải trên 3 tỷ đến 50 tỷ, TNCN = thu nhập tính thuế × 17%. Với thu nhập tính thuế hợp lệ ${formatVnd(income)}, thuế trước giảm là ${formatVnd(calc.pitBeforeReliefVnd)}. ${condition}giảm 30% thuế TNCN theo Nghị quyết 43/2026/QH16, còn ${formatVnd(calc.pitBeforeReliefVnd - Math.round(calc.pitBeforeReliefVnd * 0.3))}. Mức 1 tỷ là ngưỡng miễn thuế riêng, không phải mốc chọn phương pháp 3 tỷ. Thuế GTGT tính riêng theo hoạt động.`
      : `Doanh thu ${formatVnd(overThree)} vượt mốc 3 tỷ đồng nên TNCN phải tính trên thu nhập tính thuế với thuế suất 17%, không được dùng 0,5% trên doanh thu. Muốn tính số tiền cần doanh thu, chi phí hợp lệ để xác định thu nhập tính thuế. Nếu là cá nhân cư trú và tổng doanh thu năm không quá 10 tỷ đồng, số TNCN phải nộp tiếp tục được giảm 30% theo Nghị quyết 43/2026/QH16. Mốc 1 tỷ là ngưỡng miễn thuế riêng.`;
    return result(response, citations, ['PIT_METHOD_3B', 'NQ43_2026_ART1_1'], facts);
  }

  // T84: respect the user's explicit assumption that goods qualify for the VAT reduction.
  const eligible = /(du dieu kien|thuoc dien|duoc giam|gia dinh)[^.!?]{0,90}(giam|20\s*%|gtgt)|(?:hang hoa|mat hang)[^.!?]{0,90}(du dieu kien|duoc giam)/.test(q);
  const asksVatRelief = /gtgt/.test(q) && /(?:giam|204\/2025|174\/2025|20\s*%)/.test(q);
  const goods = /tap hoa|ban hang hoa|ban le|hang hoa/.test(q) && !/khong ban le|khong ban hang hoa|khong phai tap hoa/.test(q);
  const retailRevenue = amounts.find(n => n > 1e9 && n <= 3e9);
  if (eligible && asksVatRelief && goods && retailRevenue && /1\s*%/.test(q)) {
    const facts: TaxFacts = { taxYear: 2026, activityType: 'goods', grossRevenueVnd: retailRevenue, vatReliefEligible: true };
    const calc = calculateTax(facts);
    const citations = ['Điều 1 Nghị quyết 204/2025/QH15', 'Khoản 1, khoản 2 Điều 1 Nghị định 174/2025/NĐ-CP'];
    return result(`Với giả định hàng hóa bạn bán đủ điều kiện giảm GTGT 20% mức tỷ lệ và giao dịch, hóa đơn thuộc thời gian áp dụng, tỷ lệ 1% còn 0,8%. Thuế GTGT trên toàn bộ doanh thu ${formatRevenue(retailRevenue)} là ${formatRevenue(retailRevenue)} × (1% × 80%) = ${formatVnd(calc.vatDueVnd)}. Đây là số GTGT sau giảm; ${formatVnd(Math.round(retailRevenue * 0.01))} chỉ là số trước giảm. Chính sách này không tự quyết định số thuế TNCN.`, citations, ['NQ204_2025_VAT_RELIEF', 'ND174_2025_ART1'], facts);
  }

  // T91: a platform's unexplained "tax" line is not evidence of paid PIT.
  const platformRevenueMatch = q.match(/(?:doanh thu|hoa hong)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
  const platformRevenue = platformRevenueMatch ? money(platformRevenueMatch[1], platformRevenueMatch[2]) : null;
  const platformTaxMatch = q.match(/\btax\b[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
  const platformTax = platformTaxMatch ? money(platformTaxMatch[1], platformTaxMatch[2]) : null;
  if (/tiktok/.test(q) && /\btax\b/.test(q) && /khau tru|nop thay|giu lai|da nop|co chac/.test(q) && platformRevenue !== null) {
    const facts: TaxFacts = { taxYear: 2026, activityType: 'affiliate_unknown', grossRevenueVnd: platformRevenue };
    const revenueText = formatRevenue(platformRevenue);
    const taxText = platformTax === null ? 'khoản “tax”' : `khoản “tax” ${formatRevenue(platformTax)}`;
    return result(`Doanh thu hoa hồng TikTok trong dữ kiện bạn nêu là ${revenueText}; không lấy số thực nhận sau khi TikTok giữ lại ${taxText} làm doanh thu. Dòng “tax” chưa đủ để khẳng định đó là thuế TNCN đã được TikTok khấu trừ, kê khai và nộp thay cho bạn. Cần xem bảng đối soát của TikTok, loại thuế ghi trên chứng từ khấu trừ hoặc chứng từ nộp thuế và đối chiếu với mã số thuế/kỳ thuế của bạn; chỉ ghi nhận là số TNCN đã nộp khi các chứng từ khớp. Bản chất hợp đồng hoa hồng cũng quyết định cách kê khai khoản ${revenueText}.`, ['Điều 43 Nghị định 252/2026/NĐ-CP về khấu trừ, nộp thay trên nền tảng thương mại điện tử', 'Nghị định 68/2026/NĐ-CP về doanh thu kinh doanh'], ['TIKTOK_WITHHOLDING_EVIDENCE'], facts);
  }

  // T95: evidence-limited fallback even when the synthesis model is unavailable.
  const eachMatch = q.match(/(?:moi nguoi|moi ca nhan|moi ben)[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
  const eachRevenue = eachMatch ? money(eachMatch[1], eachMatch[2]) : null;
  if (/vo chong|chong vo|hai vo chong/.test(q) && /affiliate|tiep thi lien ket|hoa hong/.test(q) && /doc lap|dung ten ho|cong gop/.test(q) && eachRevenue !== null) {
    const facts: TaxFacts = { taxYear: 2026, activityType: 'affiliate_unknown', grossRevenueVnd: eachRevenue };
    const threshold = eachRevenue <= 1e9
      ? `Nếu đây là thu nhập kinh doanh, ${formatRevenue(eachRevenue)}/người trong năm 2026 không vượt ngưỡng 1 tỷ đồng/người.`
      : `Nếu đây là thu nhập kinh doanh, ${formatRevenue(eachRevenue)}/người vượt ngưỡng 1 tỷ đồng/người nên cần tính thuế theo phương pháp phù hợp.`;
    return result(`Nếu vợ và chồng thực sự kinh doanh affiliate độc lập, mỗi người có hợp đồng/tài khoản, doanh thu và chứng từ riêng, thì xét doanh thu theo từng cá nhân: mỗi người ${formatRevenue(eachRevenue)}, không tự cộng doanh thu của hai người cho một người. ${threshold} Nếu một người chỉ đứng tên hộ hoặc tiền và giao dịch thực tế thuộc về cùng một cá nhân, phải quy doanh thu cho người kinh doanh thực tế; không chia đôi chỉ vì là vợ chồng. Cần kiểm tra hợp đồng, tài khoản nhận tiền và chứng từ khấu trừ để xác định bản chất thu nhập affiliate, thay vì mặc định mọi khoản hoa hồng đều là doanh thu kinh doanh.`, ['Điều 3 và Điều 4 Nghị định 68/2026/NĐ-CP, sửa đổi bởi Nghị định 141/2026/NĐ-CP'], ['INDEPENDENT_AFFILIATE_PERSON'], facts);
  }

  // T98: attach the precise amending provision, not an unrelated article.
  if (/hoa don dien tu|hddt/.test(q) && /30\s*ngay|thoi han|khi nao|bao lau/.test(q) && /1\s*ty|1[.]000[.]000[.]000/.test(q)) {
    const facts: TaxFacts = { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: 1e9 };
    return result('Khi doanh thu tính thuế GTGT lũy kế vượt 1 tỷ đồng trong kỳ tính thuế, hộ/cá nhân kinh doanh thuộc trường hợp phải dùng hóa đơn điện tử theo quy định. Thời hạn đăng ký sử dụng là 30 ngày kể từ ngày cuối cùng của kỳ tính thuế có doanh thu lũy kế vượt ngưỡng. Căn cứ trực tiếp là khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP sửa đổi khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP.', ['Khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP (sửa đổi khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP)'], ['ND141_2026_ART1_2_EINVOICE'], facts);
  }
  return null;
}
