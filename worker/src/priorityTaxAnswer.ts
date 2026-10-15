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
  const q = fold(question);
  if (scope.years.includes(2025) && scope.years.includes(2026) &&
      /hoa don dien tu|hddt/.test(q) &&
      /(?:(?:nam\s*2025|2025)[^.!?]{0,65}(?:tren|vuot|hon)\s*1\s*ty|(?:tren|vuot|hon)\s*1\s*ty[^.!?]{0,65}(?:nam\s*2025|2025))/.test(q)) {
    return result('Nếu doanh thu năm trước (2025) của hộ thực sự trên 1 tỷ đồng và hộ tiếp tục kinh doanh trong năm 2026, phải xét nghĩa vụ dùng hóa đơn điện tử theo điểm a khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP được sửa đổi bởi khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP. Không áp nhánh 30 ngày dành cho hộ mới hoặc năm trước không quá 1 tỷ rồi mới vượt ngưỡng trong năm hiện tại. Cần kiểm thời điểm bắt đầu áp dụng, tình trạng sử dụng hóa đơn và quy định chuyển tiếp cho hồ sơ cụ thể.', ['Khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP (sửa đổi khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP)'], ['ND141_2026_PRIOR_YEAR_EINVOICE'], { taxYear: 2026, activityType: 'unknown' });
  }
  if (scope.years.length !== 1 || scope.years[0] !== 2026) return null;
  // A withholding percentage alone cannot determine the income category or refund.
  if (/tiktok|affiliate|tiep thi lien ket/.test(q) && /hoa hong/.test(q) &&
      /hoan|nop thua/.test(q) && /luong|tien cong/.test(q)) {
    return result(`Mình đang xét năm ${scope.years[0]}. Không cộng tiền lương công ty vào doanh thu kinh doanh affiliate. Nếu hồ sơ xác định khoản hoa hồng thực chất là tiền lương, tiền công thì mới xét chung với lương khi quyết toán theo loại thu nhập đó; chỉ tỷ lệ khấu trừ chưa đủ để phân loại.

Về hoàn thuế: chưa thể chốt số được hoàn từ số tiền hoa hồng hoặc tỷ lệ đã giữ. Cần xác định khoản đã giữ là loại thuế nào, tư cách cư trú, tổng doanh thu kinh doanh cả năm và chứng từ đã khai, nộp thay đúng người, đúng kỳ. Nếu thuế TNCN kinh doanh đã nộp vượt số phải nộp sau khi xét miễn, giảm thì có thể đề nghị xử lý nộp thừa hoặc hoàn theo thủ tục; không mặc định hoàn toàn bộ khoản khấu trừ. Bạn cần đối soát hợp đồng, bảng thanh toán và chứng từ nộp thuế trước khi tính số cuối cùng.`,
      ['Điều 11–12 Nghị định 68/2026/NĐ-CP (sửa đổi bởi Nghị định 141/2026/NĐ-CP)', 'Điều 43 Nghị định 252/2026/NĐ-CP', 'Điểm i khoản 1 Điều 25 Thông tư 111/2013/TT-BTC'],
      ['AFFILIATE_REFUND_INCOME_CLASSIFICATION'], { taxYear: 2026, activityType: 'affiliate_unknown' });
  }
  if (/du thao/.test(q) && /van ban da ban hanh|van ban chinh thuc|con hieu luc/.test(q)) {
    return result('Để chốt nghĩa vụ, phải dùng văn bản quy phạm pháp luật đã ban hành và có hiệu lực tại thời điểm giao dịch; bản dự thảo chỉ là nội dung dự kiến, không phải căn cứ áp dụng. Cần đối chiếu văn bản gốc, các văn bản sửa đổi và bản hợp nhất chính thức để xác định nội dung đang có hiệu lực.', ['Luật Ban hành văn bản quy phạm pháp luật 64/2025/QH15'], ['LEGAL_SOURCE_EFFECTIVE_TEXT'], { taxYear: 2026, activityType: 'unknown' });
  }
  const amounts = unique([...exact(q), ...named(q)]);
  const revenue = amounts.find(n => n > 3e9 && n <= 50e9) || 0;

  // T86/T100: 3,000,000,001 is safely representable as an integer, never rounded to 3 billion.
  const overThree = revenue || (/3\s*ty\s*(?:(?:\+|cong\s*them|them)\s*)?1\s*dong/.test(q) ? 3_000_000_001 : 0);
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
    const reliefText = overThree > 10_000_000_000
      ? `Doanh thu vượt 10 tỷ đồng nên không được giảm 30% theo Nghị quyết 43; số TNCN là ${formatVnd(calc.pitBeforeReliefVnd)}.`
      : `${!resident ? 'Nếu bạn là cá nhân cư trú và đủ điều kiện Nghị quyết 43, ' : ''}giảm 30% thuế TNCN theo Nghị quyết 43/2026/QH16, còn ${formatVnd(calc.pitAfterReliefVnd)}.`;
    const response = income !== undefined
      ? `Doanh thu ${formatVnd(overThree)} đã vượt 3 tỷ đồng; không được dùng phương pháp TNCN 0,5% trên doanh thu. Trong dải trên 3 tỷ đến 50 tỷ, TNCN = thu nhập tính thuế × 17%. Với thu nhập tính thuế hợp lệ ${formatVnd(income)}, thuế trước giảm là ${formatVnd(calc.pitBeforeReliefVnd)}. ${reliefText} Mức 1 tỷ là ngưỡng miễn thuế riêng, không phải mốc chọn phương pháp 3 tỷ. Thuế GTGT tính riêng theo hoạt động.`
      : `Doanh thu ${formatVnd(overThree)} vượt mốc 3 tỷ đồng nên TNCN phải tính trên thu nhập tính thuế với thuế suất 17%, không được dùng 0,5% trên doanh thu. Muốn tính số tiền cần doanh thu, chi phí hợp lệ để xác định thu nhập tính thuế. Nếu là cá nhân cư trú và tổng doanh thu năm không quá 10 tỷ đồng, số TNCN phải nộp tiếp tục được giảm 30% theo Nghị quyết 43/2026/QH16. Mốc 1 tỷ là ngưỡng miễn thuế riêng.`;
    return result(response, citations, ['PIT_METHOD_3B', 'NQ43_2026_ART1_1'], facts);
  }

  // T84: respect the user's explicit assumption that goods qualify for the VAT reduction.
  const eligible = /(du dieu kien|thuoc dien|duoc giam|gia dinh)[^.!?]{0,90}(giam|20\s*%|gtgt)|(?:hang hoa|mat hang)[^.!?]{0,90}(du dieu kien|duoc giam)/.test(q) ||
    (/du dieu kien|thuoc dien|duoc giam|gia dinh/.test(q) && /\bnq\s*204\b|nghi quyet 204|174\/2025/.test(q));
  const asksVatRelief = /gtgt/.test(q) && /(?:giam|204\/2025|\bnq\s*204\b|nghi quyet 204|174\/2025|20\s*%)/.test(q);
  const goods = /tap hoa|ban hang hoa|ban hang|ban le|hang hoa/.test(q) &&
    !/khong ban le|khong ban hang hoa|khong ban hang|khong phai tap hoa/.test(q) &&
    !/dich vu|sua chua|affiliate|hoa hong/.test(q);
  const retailRevenue = amounts.find(n => n > 1e9 && n <= 3e9);
  if (eligible && asksVatRelief && goods && retailRevenue && /1\s*%/.test(q)) {
    const facts: TaxFacts = { taxYear: 2026, activityType: 'goods', grossRevenueVnd: retailRevenue, vatReliefEligible: true };
    const calc = calculateTax(facts);
    const citations = ['Điều 1 Nghị quyết 204/2025/QH15', 'Khoản 1, khoản 2 Điều 1 Nghị định 174/2025/NĐ-CP'];
    return result(`Với giả định hàng hóa bạn bán đủ điều kiện giảm GTGT 20% mức tỷ lệ và giao dịch, hóa đơn thuộc thời gian áp dụng, tỷ lệ 1% còn 0,8%. Thuế GTGT trên toàn bộ doanh thu ${formatRevenue(retailRevenue)} là ${formatRevenue(retailRevenue)} × (1% × 80%) = ${formatVnd(calc.vatDueVnd)}. Đây là số GTGT sau giảm; ${formatVnd(Math.round(retailRevenue * 0.01))} chỉ là số trước giảm. Chính sách này không tự quyết định số thuế TNCN.`, citations, ['NQ204_2025_VAT_RELIEF', 'ND174_2025_ART1'], facts);
  }
  if (eligible && asksVatRelief && /dich vu|sua chua|sua may/.test(q) && !goods && retailRevenue && /5\s*%/.test(q)) {
    const facts: TaxFacts = { taxYear: 2026, activityType: 'service', grossRevenueVnd: retailRevenue, vatReliefEligible: true };
    const calc = calculateTax(facts);
    const citations = ['Điều 1 Nghị quyết 204/2025/QH15', 'Khoản 1, khoản 2 Điều 1 Nghị định 174/2025/NĐ-CP'];
    return result(`Nếu dịch vụ sửa chữa thuộc diện được giảm GTGT và không nằm trong phụ lục loại trừ, tỷ lệ GTGT theo doanh thu 5% giảm 20% còn 4%. Với doanh thu ${formatRevenue(retailRevenue)}, thuế GTGT sau giảm là ${formatRevenue(retailRevenue)} × (5% × 80%) = ${formatVnd(calc.vatDueVnd)}. Cần đối chiếu đúng loại dịch vụ và điều kiện giảm trước khi chốt nghĩa vụ.`, citations, ['NQ204_2025_VAT_RELIEF', 'ND174_2025_ART1'], facts);
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
  if (/hoa don dien tu|hddt/.test(q) && /30\s*ngay|thoi han|han dang ky|khi nao|bao lau/.test(q) && /1\s*ty|1[.]000[.]000[.]000/.test(q)) {
    const facts: TaxFacts = { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: 1e9 };
    return result('Nếu hộ mới kinh doanh hoặc năm trước có doanh thu không quá 1 tỷ đồng, nhưng doanh thu tính thuế GTGT lũy kế năm hiện tại vượt 1 tỷ đồng, thời hạn đăng ký sử dụng hóa đơn điện tử là 30 ngày kể từ ngày cuối cùng của kỳ tính thuế có doanh thu lũy kế vượt ngưỡng. Không lấy mặc định ngày giao dịch vừa vượt 1 tỷ làm ngày bắt đầu tính hạn. Nếu hộ đã thuộc diện bắt buộc từ đầu năm thì cần xét nhánh đăng ký tương ứng. Căn cứ trực tiếp là khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP sửa đổi khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP.', ['Khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP (sửa đổi khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP)'], ['ND141_2026_ART1_2_EINVOICE'], facts);
  }

  // Direct consultation on core tax documents from the Legal Knowledge Base
  if (/tu van (?:chi tiet )?(?:cac )?quy dinh (?:cua )?/.test(q) || (/tu van/.test(q) && /(?:nghi dinh|thong tu|cong van|luat|nghi quyet)/.test(q))) {
    // 1. Nghị định 141/2026/NĐ-CP
    if (/141\/2026/.test(q)) {
      const resp = `Nghị định 141/2026/NĐ-CP (ban hành ngày 29/04/2026, hiệu lực áp dụng từ 01/01/2026) sửa đổi, bổ sung Nghị định 68/2026/NĐ-CP với các nội dung trọng tâm đối với hộ kinh doanh và cá nhân kinh doanh:\n\n1. Nâng ngưỡng doanh thu miễn thuế lên 1 tỷ đồng/năm: Hộ kinh doanh có doanh thu năm từ 1 tỷ đồng trở xuống không phải nộp thuế GTGT và thuế TNCN (trước đây là 500 triệu đồng).\n2. Cách xác định doanh thu: Tính toàn bộ tiền bán hàng, hoa hồng, dịch vụ phát sinh trong năm (không trừ chi phí, không trừ phí sàn TMĐT, không trừ khoản sàn đã khấu trừ).\n3. Xét theo từng cá nhân: Ngưỡng 1 tỷ đồng xét riêng cho từng cá nhân kinh doanh (đại diện hộ kinh doanh), không cộng gộp doanh thu của hai vợ chồng kinh doanh độc lập.\n4. Quy định về hóa đơn điện tử: Doanh thu từ 1 tỷ trở xuống không bắt buộc dùng hóa đơn điện tử (được tự nguyện đăng ký). Khi doanh thu lũy kế vượt 1 tỷ đồng, bắt buộc đăng ký sử dụng hóa đơn điện tử trong thời hạn 30 ngày.`;
      return result(resp, ['Điều 1 Nghị định 141/2026/NĐ-CP', 'Nghị định 68/2026/NĐ-CP'], ['DOC_ND141_2026'], { taxYear: 2026, activityType: 'unknown' });
    }

    // 2. Thông tư 88/2021/TT-BTC
    if (/88\/2021/.test(q)) {
      const resp = `Thông tư 88/2021/TT-BTC của Bộ Tài Chính hướng dẫn chế độ chứng từ và sổ sách kế toán đơn giản cho hộ kinh doanh, cá nhân kinh doanh:\n\n1. Nhóm áp dụng chế độ kế toán đầy đủ: Hộ kinh doanh nộp thuế theo phương pháp kê khai phải lập chứng từ và mở đủ các sổ kế toán theo quy định (Sổ chi tiết doanh thu, chi phí, vật tư, tiền lương...).\n2. Nhóm doanh thu từ 1 tỷ đồng trở xuống hoặc nộp thuế theo tỷ lệ %: Chỉ cần mở và ghi chép Sổ theo dõi doanh thu bán hàng hóa, dịch vụ (Mẫu S1a-HKD). Hộ có thể ghi chép trên máy tính hoặc sổ giấy, không bắt buộc mua sổ in sẵn.\n3. Khuyến nghị lưu trữ: Cần lưu trữ đầy đủ hóa đơn đầu vào, chứng từ bán hàng để chứng minh doanh thu thực tế khi cơ quan thuế kiểm tra, đối chiếu.`;
      return result(resp, ['Thông tư 88/2021/TT-BTC', 'Luật Quản lý thuế 108/2025/QH15'], ['DOC_TT88_2021'], { taxYear: 2026, activityType: 'unknown' });
    }

    // 3. Công văn 311/TCT-DNNCN (Mã 888)
    if (/311(?:\/tct|\/2025)?/.test(q) || /311-tct/.test(q)) {
      const resp = `Công văn 311/TCT-DNNCN của Tổng cục Thuế hướng dẫn quy trình cấp và quản lý mã số thuế phân loại 888 cho hộ, cá nhân kinh doanh trên sàn thương mại điện tử qua tài khoản định danh VNeID mức 2:\n\n1. Hiệu lực trong năm 2026: Hậu tố 888 VẪN ĐƯỢC SỬ DỤNG trong năm 2026 để phân loại hoạt động TMĐT và kinh doanh nền tảng số. Từ 01/07/2025, CCCD/số định danh thay thế 10 số đầu làm định danh gốc, còn hậu tố 888 vẫn giữ để phân loại.\n2. Bắt buộc đăng ký: Hộ, cá nhân kinh doanh trên sàn TMĐT (Shopee, TikTok Shop...), mạng xã hội BẮT BUỘC phải đăng ký trên Cổng TMĐT HKD (https://canhantmdt.gdt.gov.vn) để được cấp/gắn mã 888.\n3. Quy trình 3 bước theo CV 311:\n- Bước 1: Truy cập Cổng TMĐT (canhantmdt.gdt.gov.vn).\n- Bước 2: Đăng nhập bằng tài khoản Định danh điện tử (VNeID mức 2).\n- Bước 3: Hệ thống tự động kiểm tra:\n  + Nếu chưa có MST: Kê khai mẫu 03-ĐK-TCT để được cấp MST gắn đuôi 888;\n  + Nếu đã có MST 10 số (hoặc CCCD) nhưng chưa có 888: Hiển thị form đăng ký bổ sung phân loại 888;\n  + Nếu đã có mã 888: Tự động đăng nhập vào cổng để thực hiện kê khai, nộp thuế.`;
      return result(resp, ['Công văn 311/TCT-DNNCN', 'Thông tư 86/2024/TT-BTC'], ['DOC_CV311_TCT'], { taxYear: 2026, activityType: 'ecommerce' });
    }

    // 4. Nghị định 123/2020/NĐ-CP
    if (/123\/2020/.test(q)) {
      const resp = `Nghị định 123/2020/NĐ-CP của Chính Phủ quy định về hóa đơn, chứng từ điện tử đối với hộ kinh doanh:\n\n1. Nguyên tắc sử dụng: Hộ kinh doanh nộp thuế theo phương pháp kê khai hoặc có doanh thu trên 1 tỷ đồng/năm bắt buộc phải sử dụng hóa đơn điện tử có mã của cơ quan thuế.\n2. Hóa đơn từ máy tính tiền: Hộ kinh doanh trong lĩnh vực bán lẻ, ăn uống, dịch vụ trực tiếp đến người tiêu dùng được áp dụng hóa đơn điện tử khởi tạo từ máy tính tiền kết nối chuyển dữ liệu điện tử với cơ quan thuế.\n3. Hộ doanh thu từ 1 tỷ trở xuống: Không thuộc diện bắt buộc sử dụng hóa đơn điện tử nhưng được quyền tự nguyện đăng ký sử dụng nếu đáp ứng đủ điều kiện về hạ tầng công nghệ thông tin.`;
      return result(resp, ['Nghị định 123/2020/NĐ-CP', 'Thông tư 78/2021/TT-BTC', 'Nghị định 141/2026/NĐ-CP'], ['DOC_ND123_2020'], { taxYear: 2026, activityType: 'unknown' });
    }

    // 5. Nghị quyết 43/2026/QH16
    if (/43\/2026/.test(q)) {
      const resp = `Nghị quyết 43/2026/QH16 của Quốc Hội quy định chính sách giảm thuế TNCN trong năm 2026–2027 cho cá nhân kinh doanh:\n\n1. Mức giảm: Giảm 30% số thuế TNCN phải nộp phát sinh từ hoạt động sản xuất, kinh doanh.\n2. Điều kiện áp dụng: Áp dụng cho cá nhân cư trú có tổng doanh thu kinh doanh trong năm không quá 10 tỷ đồng.\n3. Lưu ý quan trọng: Chính sách chỉ giảm cho thuế TNCN, KHÔNG áp dụng giảm cho thuế GTGT; không áp dụng cho thu nhập từ tiền lương, tiền công; không áp dụng cho cá nhân không cư trú hoặc các năm trước 2026.`;
      return result(resp, ['Khoản 1 Điều 1 và Khoản 1 Điều 2 Nghị quyết 43/2026/QH16'], ['DOC_NQ43_2026'], { taxYear: 2026, activityType: 'unknown' });
    }

    // 6. Thông tư 86/2024/TT-BTC
    if (/86\/2024/.test(q)) {
      const resp = `Thông tư 86/2024/TT-BTC của Bộ Tài Chính hướng dẫn về đăng ký thuế và sử dụng số định danh cá nhân:\n\n1. Từ ngày 01/07/2025: Số định danh cá nhân (CCCD 12 số) được sử dụng chính thức thay thế cho mã số thuế 10 số của cá nhân và người đại diện hộ kinh doanh.\n2. Đối với mã phụ 888: Hậu tố 888 vẫn được giữ nguyên và gắn liền với số CCCD để phân loại hoạt động kinh doanh thương mại điện tử trên hệ thống quản lý thuế điện tử.`;
      return result(resp, ['Thông tư 86/2024/TT-BTC', 'Công văn 311/TCT-DNNCN'], ['DOC_TT86_2024'], { taxYear: 2026, activityType: 'unknown' });
    }

    // 7. Thông tư 40/2021/TT-BTC
    if (/40\/2021/.test(q)) {
      const resp = `Thông tư 40/2021/TT-BTC của Bộ Tài Chính hướng dẫn chính sách thuế GTGT, TNCN và quản lý thuế đối với hộ, cá nhân kinh doanh:\n\n1. Phương pháp tính thuế: Quy định cách tính thuế theo tỷ lệ trên doanh thu đối với hộ khoán, hộ kê khai và cá nhân kinh doanh từng lần phát sinh.\n2. Biểu tỷ lệ thuế trên doanh thu: Phân định chi tiết theo từng lĩnh vực (Phân phối, cung cấp hàng hóa: 1% GTGT + 0,5% TNCN; Dịch vụ, xây dựng: 5% GTGT + 2% TNCN; Cho thuê tài sản: 5% GTGT + 5% TNCN...).\n3. Cập nhật năm 2026: Ngưỡng doanh thu bắt đầu chịu thuế đã được Nghị định 141/2026/NĐ-CP nâng lên trên 1 tỷ đồng/năm.`;
      return result(resp, ['Thông tư 40/2021/TT-BTC', 'Nghị định 141/2026/NĐ-CP'], ['DOC_TT40_2021'], { taxYear: 2026, activityType: 'unknown' });
    }

    // 8. Nghị định 68/2026/NĐ-CP
    if (/68\/2026/.test(q)) {
      const resp = `Nghị định 68/2026/NĐ-CP của Chính Phủ quy định chi tiết về chính sách thuế và quản lý thuế đối với HKD, cá nhân kinh doanh và nền tảng số:\n\n1. Trách nhiệm của sàn TMĐT: Sàn giao dịch TMĐT có chức năng đặt hàng, thanh toán trực tuyến có trách nhiệm khấu trừ, kê khai và nộp thay thuế cho cá nhân kinh doanh trên sàn theo kỳ quy định.\n2. Doanh thu chịu thuế: Xác định dựa trên tổng giá trị giao dịch thực tế trên nền tảng (không trừ phí sàn và các khoản chiết khấu dịch vụ).\n3. Ngưỡng miễn thuế: Được sửa đổi bởi Nghị định 141/2026/NĐ-CP nâng lên 1 tỷ đồng/năm.`;
      return result(resp, ['Nghị định 68/2026/NĐ-CP', 'Nghị định 141/2026/NĐ-CP'], ['DOC_ND68_2026'], { taxYear: 2026, activityType: 'ecommerce' });
    }

    // 9. Công văn 6480/CT-QLNT
    if (/6480(?:\/ct|\/2026)?/.test(q) || /6480-ct/.test(q)) {
      const resp = `Công văn 6480/CT-QLNT của Cục Thuế trả lời kiến nghị về quản lý nợ thuế và cưỡng chế thuế đối với cá nhân, hộ kinh doanh:\n\n1. Biện pháp tạm hoãn xuất cảnh: Áp dụng đối với cá nhân kinh doanh, người đại diện theo pháp luật của hộ kinh doanh thuộc diện chưa hoàn thành nghĩa vụ nộp thuế theo Luật Quản lý thuế.\n2. Quy trình rà soát: Cơ quan thuế gửi thông báo nhắc nợ, đôn đốc nộp thuế trước khi ban hành thông báo tạm hoãn xuất cảnh hoặc áp dụng các biện pháp cưỡng chế tài khoản.\n3. Hoàn thành nghĩa vụ thuế: Người nộp thuế nộp đủ tiền thuế, tiền phạt, tiền chậm nộp sẽ được cơ quan thuế ban hành văn bản hủy bỏ tạm hoãn xuất cảnh trong thời hạn quy định.`;
      return result(resp, ['Công văn 6480/CT-QLNT', 'Luật Quản lý thuế 108/2025/QH15'], ['DOC_CV6480_QLNT'], { taxYear: 2026, activityType: 'unknown' });
    }
  }

  return null;
}
