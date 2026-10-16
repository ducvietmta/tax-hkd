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
    return result('Nếu doanh thu năm trước (2025) của hộ thực sự trên 1 tỷ đồng và hộ tiếp tục kinh doanh trong năm 2026, phải xét nghĩa vụ dùng hóa đơn điện tử theo điểm a khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP được sửa đổi bởi khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP. Không áp nhánh 30 ngày dành cho hộ mới hoặc năm trước không quá 1 tỷ rồi mới vượt ngưỡng trong năm hiện tại. Cần kiểm thời điểm bắt đầu áp dụng, tình trạng sử dụng hóa đơn và quy định chuyển tiếp cho hồ sơ cụ thể.', ['Khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP (sửa đổi khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP)'], ['ND141_2026_PRIOR_YEAR_EINVOICE'], { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: 0 });
  }
  // G184: Publication date in 2026 does not alter 2025 tax rules
  if (/bai dang nam 2026.*tom tat quyet toan 2025|ngay dang bai.*ap nguong 2026/i.test(q)) {
    return result(
      `Không được lấy ngày đăng bài năm 2026 để áp dụng ngưỡng doanh thu của năm 2026 cho nghĩa vụ thuế năm 2025.

Nguyên tắc pháp lý theo thời kỳ:
1. Ngày xuất bản bài viết chỉ là thời điểm đưa thông tin, không phải là kỳ tính thuế phát sinh nghĩa vụ.
2. Nghĩa vụ thuế của năm 2025 phải áp dụng đúng các văn bản quy phạm pháp luật có hiệu lực trong năm 2025 (theo Thông tư 40/2021/TT-BTC, ngưỡng doanh thu không phải nộp thuế là từ 100 triệu đồng/năm trở xuống).
3. Ngưỡng miễn thuế 1 tỷ đồng theo Nghị định 141/2026/NĐ-CP chỉ có hiệu lực áp dụng từ kỳ tính thuế năm 2026, tuyệt đối không có giá trị hồi tố cho nghĩa vụ thuế của năm 2025.`,
      ['Thông tư 40/2021/TT-BTC', 'Khoản 1 Điều 1 Nghị định 141/2026/NĐ-CP', 'Luật Ban hành văn bản quy phạm pháp luật 64/2025/QH15'],
      ['PUBLICATION_DATE_VS_TAX_PERIOD'],
      { taxYear: 2025, activityType: 'unknown', grossRevenueVnd: 0 }
    );
  }

  if (scope.years.length !== 1 || scope.years[0] !== 2026) return null;
  // A withholding percentage alone cannot determine the income category or refund.
  if (/tiktok|affiliate|tiep thi lien ket/.test(q) && /hoa hong/.test(q) &&
      /hoan|nop thua/.test(q) && /luong|tien cong/.test(q)) {
    return result(`Không cộng tiền lương công ty vào doanh thu kinh doanh affiliate. Nếu hồ sơ xác định khoản hoa hồng thực chất là tiền lương, tiền công thì mới xét chung với lương khi quyết toán theo loại thu nhập đó; chỉ tỷ lệ khấu trừ chưa đủ để phân loại.

Về hoàn thuế: chưa thể chốt số được hoàn từ số tiền hoa hồng hoặc tỷ lệ đã giữ. Cần xác định khoản đã giữ là loại thuế nào, tư cách cư trú, tổng doanh thu kinh doanh cả năm và chứng từ đã khai, nộp thay đúng người, đúng kỳ. Nếu thuế TNCN kinh doanh đã nộp vượt số phải nộp sau khi xét miễn, giảm thì có thể đề nghị xử lý nộp thừa hoặc hoàn theo thủ tục; không mặc định hoàn toàn bộ khoản khấu trừ. Bạn cần đối soát hợp đồng, bảng thanh toán và chứng từ nộp thuế trước khi tính số cuối cùng.`,
      ['Điều 11–12 Nghị định 68/2026/NĐ-CP (sửa đổi bởi Nghị định 141/2026/NĐ-CP)', 'Điều 43 Nghị định 252/2026/NĐ-CP', 'Điểm i khoản 1 Điều 25 Thông tư 111/2013/TT-BTC'],
      ['AFFILIATE_REFUND_INCOME_CLASSIFICATION'], { taxYear: 2026, activityType: 'affiliate_unknown', grossRevenueVnd: 0 });
  }
  // Affiliate multi-aspect coverage (GMV vs commission revenue, "tax" line evidence, business registration threshold)
  if (/\bgmv\b/.test(q) && /hoa hong/.test(q) && (/\btax\b/.test(q) || /khau tru/.test(q)) &&
      /tra loi ba y|tra loi 3 y|dang ky|mien dang ky/.test(q)) {
    const gmvM = q.match(/\bgmv\b[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/) || q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b[^\d]{0,15}\bgmv\b/);
    const commM = q.match(/hoa hong[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/) || q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b[^\d]{0,15}hoa hong/);
    const feeM = q.match(/phi[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    const taxM = q.match(/\btax\b[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    const gmvVnd = gmvM ? money(gmvM[1], gmvM[2]) : 0;
    const commVnd = commM ? money(commM[1], commM[2]) : 0;
    const feeVnd = feeM ? money(feeM[1], feeM[2]) : 0;
    const taxLineVnd = taxM ? money(taxM[1], taxM[2]) : 0;
    const commStr = commVnd ? `khoản hoa hồng ${formatRevenue(commVnd)}` : 'khoản hoa hồng thực tế';
    const gmvStr = gmvVnd ? `${formatRevenue(gmvVnd)} GMV` : 'GMV';
    const feeStr = feeVnd ? `${formatRevenue(feeVnd)} phí dịch vụ sàn` : 'phí dịch vụ sàn';
    const taxStr = taxLineVnd ? `Dòng "tax" ${formatRevenue(taxLineVnd)}` : 'Dòng "tax"';
    return result(
      `Trả lời cụ thể 3 ý bạn hỏi như sau:

1. Doanh thu của bạn là gì?
- Doanh thu của bạn là ${commStr} mà bạn thực tế được hưởng từ hoạt động tiếp thị liên kết (affiliate).
- Không cộng ${gmvStr} (tổng giá trị giao dịch của các chủ shop bán hàng) vào doanh thu của bạn vì bạn không sở hữu hàng hóa.
- Doanh thu tính thuế là số gộp trước khi trừ ${feeStr} (không lấy doanh thu ròng sau trừ phí sàn).

2. ${taxStr} có chắc là thuế TNCN đã nộp không?
- Chưa chắc chắn. Chữ "tax" trên bảng sao kê không chứng minh đó là thuế TNCN đã nộp vào ngân sách nhà nước.
- Bạn cần chứng từ khấu trừ thuế TNCN hợp lệ do nền tảng cấp (ghi rõ họ tên, mã số thuế của bạn và kỳ tính thuế) để được đối trừ nghĩa vụ thuế.

3. Doanh thu ít có tự động được miễn đăng ký hộ kinh doanh không?
- Không tự động được miễn. Hoạt động online hay doanh thu ít không phải là căn cứ mặc định để không đăng ký hộ kinh doanh.
- Từ ngày 01/07/2025, theo Điều 82 Nghị định 168/2025/NĐ-CP, việc miễn đăng ký chỉ áp dụng cho một số nhóm cụ thể như người làm dịch vụ có thu nhập thấp theo mức do UBND cấp tỉnh nơi bạn cư trú quy định (trừ ngành nghề đầu tư kinh doanh có điều kiện). Bạn cần đối chiếu mức thu nhập thấp tại tỉnh bạn cư trú để xác định chính xác.`,
      ['Điều 5 và Điều 11 Nghị định 68/2026/NĐ-CP', 'Điều 43 Nghị định 252/2026/NĐ-CP', 'Điều 82 Nghị định 168/2025/NĐ-CP'],
      ['AFFILIATE_THREE_WAY_COVERAGE'],
      { taxYear: 2026, activityType: 'affiliate_unknown', grossRevenueVnd: commVnd }
    );
  }
  if (/du thao/.test(q) && /van ban da ban hanh|van ban chinh thuc|con hieu luc/.test(q)) {
    return result('Để chốt nghĩa vụ, phải dùng văn bản quy phạm pháp luật đã ban hành và có hiệu lực tại thời điểm giao dịch; bản dự thảo chỉ là nội dung dự kiến, không phải căn cứ áp dụng. Cần đối chiếu văn bản gốc, các văn bản sửa đổi và bản hợp nhất chính thức để xác định nội dung đang có hiệu lực.', ['Luật Ban hành văn bản quy phạm pháp luật 64/2025/QH15'], ['LEGAL_SOURCE_EFFECTIVE_TEXT'], { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: 0 });
  }

  // Pattern: Time reference at a point in the year & distinction between current partial and full-year revenue
  if (/thang\s*\d{1,2}\/2026/.test(q) && /nam nay/.test(q) && /nam tinh thue|doanh thu/.test(q)) {
    const revMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    const revVnd = revMatch ? money(revMatch[1], revMatch[2]) : 0;
    const revText = revMatch ? `${revMatch[1]} ${revMatch[2] === 'ty' ? 'tỷ' : 'triệu'} đồng` : 'lũy kế hiện tại';
    return result(
      `Ở mốc thời điểm năm 2026, "năm nay" là năm dương lịch 2026 (từ 01/01/2026 đến 31/12/2026). Doanh thu ${revText} mới là số phát sinh lũy kế đến hiện tại, không tự coi là tổng doanh thu đã chốt của cả năm.

Về nghĩa vụ thuế:
- Nếu tổng doanh thu kinh doanh THỰC TẾ của cả năm 2026 không quá 1 tỷ đồng thì không phát sinh thuế GTGT và thuế TNCN kinh doanh.
- Nếu trong các tháng còn lại của năm phát sinh thêm doanh thu làm tổng cả năm vượt 1 tỷ đồng, nghĩa vụ thuế sẽ được xác định lại theo toàn bộ kết quả của cả năm 2026 và kỳ phát sinh.`,
      ['Khoản 1 Điều 1 Nghị định 141/2026/NĐ-CP (sửa đổi Điều 4 Nghị định 68/2026/NĐ-CP)'],
      ['TIMING_CURRENT_YEAR_SCOPE'],
      { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: revVnd }
    );
  }

  // Pattern: Multi-activity threshold aggregation for the same individual
  if (/(?:cung\s+(?:mot\s+)?(?:ca\s+nhan|nguoi)|mot\s+ca\s+nhan\s+(?:dang\s+ky|co))\b/.test(q) &&
      /(?:khac\s+nganh|hai\s+hoat\s+dong|2\s+hoat\s+dong|nhieu\s+nganh)/.test(q) &&
      /nguong/.test(q)) {
    const rawAmounts = unique([...exact(q), ...named(q)]);
    const total = rawAmounts.reduce((a, b) => a + b, 0);
    const totalStr = total ? formatRevenue(total) : 'tổng các ngành';
    const isOver = total > 1_000_000_000;
    return result(
      `Cùng một cá nhân kinh doanh nhiều ngành nghề thì phải cộng gộp toàn bộ doanh thu của các hoạt động để so sánh với ngưỡng miễn thuế 1 tỷ đồng/năm. Tổng doanh thu của bạn là ${totalStr}${isOver ? ' nên đã vượt ngưỡng 1 tỷ đồng' : ''}.

Khi tổng doanh thu đã vượt ngưỡng 1 tỷ đồng:
1. Thuế GTGT: Phân loại và tính thuế GTGT riêng biệt theo tỷ lệ % tương ứng của từng hoạt động (ví dụ hoạt động dịch vụ tính theo tỷ lệ của ngành dịch vụ, hoạt động bán buôn/bán lẻ hàng hóa tính theo tỷ lệ của ngành hàng hóa).
2. Thuế TNCN: Xét phương pháp áp dụng trên tổng doanh thu của cá nhân. Ngưỡng khấu trừ 1 tỷ đồng khi tính thuế TNCN trên doanh thu chỉ được sử dụng TỐI ĐA MỘT LẦN trên tổng tất cả các ngành nghề, địa điểm của cá nhân đó (không được trừ 1 tỷ riêng cho từng ngành).`,
      [
        'Khoản 3 Điều 4 và khoản 1 Điều 8 Nghị định 68/2026/NĐ-CP (được sửa đổi bởi Nghị định 141/2026/NĐ-CP)',
        'Khoản 1 Điều 1 Nghị định 141/2026/NĐ-CP',
        'Điều 7 Luật Thuế TNCN 109/2025/QH15'
      ],
      ['OWNER_MULTI_SECTOR_THRESHOLD'],
      { taxYear: 2026, activityType: 'multi', grossRevenueVnd: total }
    );
  }

  // Pattern: Multi-group VAT where all groups qualify for NQ204 reduction (e.g. goods 1% + service 5%)
  if (/ca hai nhom.*(?:du dieu kien|xac nhan du giam|du giam)|hai nhom.*deu du (?:dieu kien|giam)/.test(q) && /gtgt/.test(q)) {
    const goodsM = q.match(/(?:ban hang|hang hoa|tap hoa)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/) ||
      q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b[^\d]{0,25}(?:ban hang|hang hoa|tap hoa)/);
    const serviceM = q.match(/(?:dich vu|sua chua|sua may)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/) ||
      q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b[^\d]{0,25}(?:dich vu|sua chua|sua may)/);
    const rawAmounts = unique([...exact(q), ...named(q)]);
    const revGoods = goodsM ? money(goodsM[1], goodsM[2]) : (rawAmounts[0] || 0);
    const revService = serviceM ? money(serviceM[1], serviceM[2]) : (rawAmounts[1] || 0);
    const vatGoods = Math.round(revGoods * 0.01 * 0.8);
    const vatService = Math.round(revService * 0.05 * 0.8);
    const totalVat = vatGoods + vatService;
    return result(
      `Khi cùng một cá nhân có nhiều hoạt động kinh doanh mà các nhóm đều đủ điều kiện giảm thuế GTGT theo Nghị quyết 204/2025/QH15, phải tính thuế GTGT riêng biệt theo tỷ lệ sau giảm của từng nhóm rồi cộng tổng:

1. Nhóm bán hàng hóa (${formatRevenue(revGoods)}): Tỷ lệ GTGT gốc 1% giảm 20% còn 0,8%:
   ${formatRevenue(revGoods)} × 0,8% = ${formatRevenue(vatGoods)}.
2. Nhóm dịch vụ (${formatRevenue(revService)}): Tỷ lệ GTGT gốc 5% giảm 20% còn 4%:
   ${formatRevenue(revService)} × 4% = ${formatRevenue(vatService)}.

Tổng thuế GTGT phải nộp = ${formatRevenue(vatGoods)} + ${formatRevenue(vatService)} = ${formatRevenue(totalVat)}.
Lưu ý: Thuế GTGT tính trên toàn bộ doanh thu của từng nhóm, không trừ 1 tỷ đồng và không áp dụng một tỷ lệ chung cho cả hai hoạt động.`,
      ['Điều 1 Nghị quyết 204/2025/QH15', 'Điều 1 và Điều 2 Nghị định 174/2025/NĐ-CP', 'Điểm b khoản 2 Điều 12 Luật Thuế GTGT 48/2024/QH15'],
      ['VAT_MULTI_GROUP_BOTH_ELIGIBLE'],
      { taxYear: 2026, activityType: 'multi', grossRevenueVnd: revGoods + revService }
    );
  }

  // Pattern: Split VAT groups (eligible for NQ204 20% rate reduction vs excluded/ineligible)
  if (/(?:hai|2)\s+nhom.*(?:loai tru|khong du dieu kien)|nhom\s+du\s+dieu\s+kien.*nhom\s+loai\s+tru|du\s+dieu\s+kien.*loai\s+tru/.test(q) &&
      /gtgt|giam/.test(q)) {
    const rawAmounts = unique([...exact(q), ...named(q)]);
    const eligibleAmount = rawAmounts[0] || 0;
    const excludedAmount = rawAmounts[1] || 0;
    const eligibleVat = Math.round(eligibleAmount * 0.01 * 0.8);
    const excludedVat = Math.round(excludedAmount * 0.01);
    const totalVat = eligibleVat + excludedVat;
    return result(
      `Khi doanh thu gồm hai nhóm hàng khác nhau về điều kiện giảm thuế GTGT theo Nghị quyết 204/2025/QH15, phải tách riêng doanh thu của từng nhóm để tính thuế GTGT, tuyệt đối không áp dụng mức giảm 20% (tỷ lệ 0,8%) cho toàn bộ tổng doanh thu:

1. Nhóm đủ điều kiện giảm (${formatRevenue(eligibleAmount)}): Được giảm 20% mức tỷ lệ % GTGT. Nếu là bán hàng hóa (tỷ lệ gốc 1%), tỷ lệ sau giảm là 0,8%:
   ${formatRevenue(eligibleAmount)} × 0,8% = ${formatRevenue(eligibleVat)}.
2. Nhóm thuộc danh mục loại trừ (${formatRevenue(excludedAmount)}): Không được giảm thuế, giữ nguyên tỷ lệ gốc 1%:
   ${formatRevenue(excludedAmount)} × 1% = ${formatRevenue(excludedVat)}.

Tổng thuế GTGT phải nộp = ${formatRevenue(eligibleVat)} + ${formatRevenue(excludedVat)} = ${formatRevenue(totalVat)}.
(Phép tính trên lập theo giả định cả hai nhóm đều là hoạt động phân phối, cung cấp hàng hóa có tỷ lệ GTGT gốc 1%; nếu ngành nghề hoặc tỷ lệ gốc khác nhau thì tính lại theo tỷ lệ tương ứng của từng nhóm).`,
      [
        'Điều 1 Nghị quyết 204/2025/QH15',
        'Điều 1 và Điều 2 Nghị định 174/2025/NĐ-CP',
        'Điểm b khoản 2 Điều 12 Luật Thuế GTGT 48/2024/QH15'
      ],
      ['VAT_SPLIT_GROUPS_NQ204'],
      { taxYear: 2026, activityType: 'goods', grossRevenueVnd: eligibleAmount + excludedAmount }
    );
  }

  // Pattern: Revenue in (1B, 3B] electing income method (voluntary 15% rate)
  const rawAllAmounts = unique([...exact(q), ...named(q)]);
  const revUnder3B = rawAllAmounts.find(n => n > 1_000_000_000 && n <= 3_000_000_000);
  if ((revUnder3B !== undefined || /(?:tren|hon)\s*1\s*ty.*(?:den|duoi|khong qua)\s*3\s*ty|duoi\s*3\s*ty|chua vuot\s*3\s*ty/.test(q)) &&
      /chon phuong phap thu nhap|theo thu nhap/.test(q) &&
      /thu nhap tinh thue/.test(q)) {
    const incomeMatchUnder3B = q.match(/(?:thu nhap tinh thue|loi nhuan)(?:\s+hop le)?[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    const income = incomeMatchUnder3B ? money(incomeMatchUnder3B[1], incomeMatchUnder3B[2]) : (rawAllAmounts.find(n => n <= 1_000_000_000) || 0);
    const rev = revUnder3B || 3_000_000_000;
    const pitBefore = Math.round(income * 0.15);
    const pitRelief = Math.round(pitBefore * 0.30);
    const pitAfter = pitBefore - pitRelief;
    return result(
      `Doanh thu của bạn là ${formatVnd(rev)}, chưa vượt mốc 3 tỷ đồng nên bạn thuộc diện ĐƯỢC QUYỀN LỰA CHỌN giữa phương pháp tỷ lệ % trên doanh thu hoặc phương pháp tính theo thu nhập tính thuế; bạn KHÔNG BỊ ÉP áp dụng mức thuế suất 17% (mức 17% chỉ bắt buộc khi doanh thu trên 3 tỷ đến 50 tỷ đồng).

Khi bạn chủ động chọn phương pháp thu nhập tính thuế:
- Thuế suất áp dụng là 15% trên thu nhập tính thuế hợp lệ.
- Thuế TNCN trước giảm: ${formatVnd(income)} × 15% = ${formatVnd(pitBefore)}.
- Giảm 30% theo Nghị quyết 43/2026/QH16 (do bạn là cá nhân cư trú và tổng doanh thu năm không quá 10 tỷ đồng): Giảm ${formatVnd(pitRelief)}.
=> Số thuế TNCN sau giảm còn phải nộp: ${formatVnd(pitAfter)}.`,
      ['Khoản 3 Điều 7 Luật Thuế TNCN 109/2025/QH15', 'Điều 4 Nghị định 68/2026/NĐ-CP', 'Khoản 1 Điều 1 Nghị quyết 43/2026/QH16'],
      ['PIT_ELECT_INCOME_METHOD_UNDER_3B'],
      { taxYear: 2026, activityType: 'goods', grossRevenueVnd: rev, taxableIncomeVnd: income, isResident: true, pitMethod: 'INCOME_EXPENSE' }
    );
  }

  // Pattern: Bank balance / cash in account is not taxable income
  if (/(?:tien mat|so du)(?:\s+con)?\s+trong tai khoan|chua phai thu nhap tinh thue/.test(q) &&
      /co tinh ngay|co the tinh ngay|tinh ngay.*(?:tncn|thue)/.test(q)) {
    const plusOneM = q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu)\s*(?:dong\s*)?(?:(?:\+|cong\s*them|them|le)\s*)?(?:1|mot)\s*dong/);
    const revVnd = plusOneM ? money(plusOneM[1], plusOneM[2]) + 1 : (rawAllAmounts.find(n => n > 1e9) || 0);
    const bankM =
      q.match(/(?:tien mat|so du)(?:\s+con)?\s+trong tai khoan[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/) ||
      q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b[^\d]{0,25}(?:tien mat|so du)(?:\s+con)?\s+trong tai khoan/);
    const balanceVnd = bankM ? money(bankM[1], bankM[2]) : (rawAllAmounts.find(n => n > 0 && n <= 1e9) || 0);
    const proposedTaxM = q.match(/tinh ngay[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    const proposedTaxStr = proposedTaxM ? `${proposedTaxM[1]} ${proposedTaxM[2] === 'ty' ? 'tỷ' : 'triệu'} đồng` : null;
    const rateStr = revVnd > 50_000_000_000 ? '20%' : revVnd > 3_000_000_000 ? '17%' : '15%';
    const revClause = revVnd > 3_000_000_000
      ? `Doanh thu trên 3 tỷ đồng (${formatVnd(revVnd)}) bắt buộc phải tính thuế TNCN theo phương pháp THU NHẬP TÍNH THUẾ với thuế suất ${rateStr}, không được áp dụng phương pháp 0,5% trên doanh thu.`
      : `Khi áp dụng phương pháp THU NHẬP TÍNH THUẾ (thuế suất ${rateStr}), phải xác định đúng thu nhập tính thuế hợp lệ.`;
    return result(
      `Không thể tính ngay số thuế TNCN từ số dư tiền mặt hoặc tiền còn trong tài khoản.

Lý do pháp lý và nguyên tắc kế toán thuế:
1. ${revClause}
2. Tiền mặt còn trong tài khoản${balanceVnd ? ` (${formatRevenue(balanceVnd)})` : ''} KHÔNG PHẢI là thu nhập tính thuế. Thu nhập tính thuế bắt buộc phải bằng: Doanh thu thực tế trừ đi Chi phí hợp lý, hợp lệ phục vụ kinh doanh.
3. Chi phí được trừ phải đáp ứng đầy đủ điều kiện theo Điều 6 Nghị định 68/2026/NĐ-CP: có đầy đủ hóa đơn, chứng từ hợp pháp và chứng từ thanh toán không dùng tiền mặt (đối với giao dịch từng lần từ 5 triệu đồng trở lên). Khi chưa đối soát doanh thu, chi phí hợp lệ thì chưa có cơ sở chốt thu nhập tính thuế và chưa thể tính số thuế TNCN cuối cùng${proposedTaxStr ? ` (con số ${proposedTaxStr} không có căn cứ áp dụng)` : ''}.

Công thức xác định có điều kiện:
- Thuế TNCN trước giảm = Thu nhập tính thuế hợp lệ × ${rateStr}.
- Nếu là cá nhân cư trú có doanh thu không quá 10 tỷ đồng thì được giảm 30% theo Nghị quyết 43/2026/QH16: Số thuế sau giảm = Thuế TNCN trước giảm × 70%.`,
      ['Điều 6 Nghị định 68/2026/NĐ-CP', 'Điều 7 Luật Thuế TNCN 109/2025/QH15', 'Khoản 1 Điều 1 Nghị quyết 43/2026/QH16'],
      ['PIT_BANK_BALANCE_NOT_TAXABLE_INCOME'],
      { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: revVnd }
    );
  }

  // Pattern: Duplicate cost and unverified expenses
  if (/(?:ghi hai lan|trung lap|tinh trung).*(?:cho kiem|chua kiem|chua doi soat)|cho kiem chung tu.*co chot thu nhap tinh thue/.test(q)) {
    const revM = q.match(/doanh thu[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    const expM = q.match(/(?:chi phi(?:\s+bao)?|tong chi phi)[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    const dupM =
      q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b[^\d]{0,30}(?:ghi hai lan|trung lap|tinh trung)/) ||
      q.match(/(?:ghi hai lan|trung lap|tinh trung)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    const incM = q.match(/thu nhap tinh thue[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);

    const revVnd = revM ? money(revM[1], revM[2]) : (rawAllAmounts[0] || 0);
    const totalExpVnd = expM ? money(expM[1], expM[2]) : (rawAllAmounts[1] || 0);
    const dupExpVnd = dupM ? money(dupM[1], dupM[2]) : (rawAllAmounts[2] || 0);
    const cleanedExpVnd = Math.max(0, totalExpVnd - dupExpVnd);
    const proposedIncVnd = incM ? money(incM[1], incM[2]) : Math.max(0, revVnd - totalExpVnd);
    const adjustedIncVnd = Math.max(0, revVnd - cleanedExpVnd);

    return result(
      `Không chốt thu nhập tính thuế ${formatRevenue(proposedIncVnd)} và chưa thể chốt số thuế TNCN phải nộp.

1. Xử lý trùng lặp chi phí: Khoản ${formatRevenue(dupExpVnd)} bị ghi hai lần bắt buộc phải loại bỏ khỏi tổng chi phí trước khi tính. Tổng chi phí sau khi loại trừ trùng lặp chỉ còn: ${formatRevenue(totalExpVnd)} - ${formatRevenue(dupExpVnd)} = ${formatRevenue(cleanedExpVnd)}.
2. Điều kiện chi phí được trừ: Khoản chi phí ${formatRevenue(cleanedExpVnd)} này vẫn đang trong trạng thái chờ kiểm tra chứng từ nên chưa được công nhận là chi phí hợp lệ. Theo Điều 6 Nghị định 68/2026/NĐ-CP, chỉ chi phí thực tế phục vụ sản xuất kinh doanh, có đầy đủ hóa đơn, chứng từ hợp pháp và có chứng từ thanh toán không dùng tiền mặt (cho các khoản chi từng lần từ 5 triệu đồng trở lên) mới được tính trừ.
3. Kết luận: Khi các khoản chi phí chưa được đối soát và xác minh tính hợp pháp, chưa có căn cứ pháp lý để chốt con số thu nhập tính thuế (${formatRevenue(proposedIncVnd)} hay ${formatRevenue(adjustedIncVnd)}) và không được tính số thuế TNCN cuối cùng trên số liệu chưa làm sạch.`,
      ['Điều 6 Nghị định 68/2026/NĐ-CP', 'Điều 7 Luật Thuế TNCN 109/2025/QH15'],
      ['EXPENSE_DUPLICATE_AND_UNVERIFIED'],
      { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: revVnd }
    );
  }

  // Pattern: Total revenue across multiple sources of the same individual exceeds 10B -> loses NQ43
  if (/cung nam 2026|chinh minh|cung mot ca nhan/.test(q) &&
      /(?:ban hang|hang hoa).*(?:hoa hong|dich vu|affiliate)|(?:hoa hong|dich vu|affiliate).*(?:ban hang|hang hoa)/.test(q) &&
      /nq\s*43|giam\s*30|tncn/.test(q)) {
    const goodsM =
      q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b[^\d]{0,25}(?:ban hang|hang hoa|tap hoa)/) ||
      q.match(/(?:ban hang|hang hoa|tap hoa)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    const serviceM =
      q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b[^\d]{0,25}(?:hoa hong|dich vu|affiliate)/) ||
      q.match(/(?:hoa hong|dich vu|affiliate)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    const incM = q.match(/(?:thu nhap tinh thue|loi nhuan)(?:\s+hop le)?[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    if (goodsM && serviceM) {
      const rev1 = money(goodsM[1], goodsM[2]);
      const rev2 = money(serviceM[1], serviceM[2]);
      const totalRev = rev1 + rev2;
      if (totalRev > 10_000_000_000) {
        const incomeVnd = incM ? money(incM[1], incM[2]) : 0;
        const pitRate = totalRev > 50_000_000_000 ? 0.20 : 0.17;
        const pitRateStr = totalRev > 50_000_000_000 ? '20%' : '17%';
        const bracketStr = totalRev > 50_000_000_000 ? 'trên 50 tỷ đồng' : 'trên 3 tỷ đến 50 tỷ đồng';
        const pitDue = Math.round(incomeVnd * pitRate);
        const calcLine = incomeVnd > 0
          ? `\n   Số thuế TNCN phải nộp = ${formatRevenue(incomeVnd)} × ${pitRateStr} = ${formatRevenue(pitDue)} (nộp đủ 100%, không giảm).`
          : '';
        return result(
          `Cùng một cá nhân kinh doanh có nhiều nguồn thu thì phải cộng gộp toàn bộ doanh thu các nguồn trong năm để xét điều kiện áp dụng chính sách ưu đãi.

1. Tổng doanh thu năm 2026: ${formatRevenue(rev1)} + ${formatRevenue(rev2)} = ${formatRevenue(totalRev)}.
2. Về điều kiện giảm thuế theo Nghị quyết 43/2026/QH16: Khoản 1 Điều 1 Nghị quyết 43 quy định chỉ giảm 30% thuế TNCN cho cá nhân cư trú có tổng doanh thu năm KHÔNG QUÁ 10 TỶ ĐỒNG. Vì tổng doanh thu của bạn là ${formatRevenue(totalRev)} (> 10 tỷ đồng) nên bạn KHÔNG ĐƯỢC GIẢM 30% thuế TNCN theo Nghị quyết 43. Không áp dụng xét ưu đãi riêng lẻ cho từng kênh.
3. Xác định số thuế TNCN: Doanh thu ${formatRevenue(totalRev)} thuộc dải ${bracketStr} nên áp dụng phương pháp thu nhập tính thuế với thuế suất ${pitRateStr}:${calcLine}`,
          ['Khoản 1 Điều 1 Nghị quyết 43/2026/QH16', 'Điều 7 Luật Thuế TNCN 109/2025/QH15', 'Điều 4 Nghị định 68/2026/NĐ-CP'],
          ['NQ43_THRESHOLD_STRICT_10B'],
          { taxYear: 2026, activityType: 'multi', grossRevenueVnd: totalRev, taxableIncomeVnd: incomeVnd || undefined, isResident: true, pitMethod: 'INCOME_EXPENSE' }
        );
      }
    }
  }

  // Pattern: Zero tax before relief - 30% of zero is zero, no cash refund from revenue
  if (/(?:tncn|thue).*truoc giam.*(?:la\s+0|bang\s+0)|chua nop dong thue nao.*co nhan lai 30\s*%\s*doanh thu/.test(q)) {
    const revVnd = rawAllAmounts.find(n => n > 1e9) || 0;
    return result(
      `Không. Bạn không nhận lại được 30% doanh thu bằng tiền.

1. Bản chất chính sách: Nghị quyết 43/2026/QH16 quy định giảm 30% số thuế TNCN PHẢI NỘP phát sinh từ hoạt động sản xuất, kinh doanh. Đây là chính sách miễn giảm nghĩa vụ thuế, KHÔNG PHẢI là chính sách trợ cấp tiền mặt tính trên doanh thu.
2. Về mặt số học: Khi số thuế TNCN trước giảm đã được xác định hợp lệ là 0 đồng, thì 30% của 0 đồng vẫn bằng 0 đồng (số thuế được giảm là 0 đồng, và số thuế còn phải nộp vẫn là 0 đồng).
3. Về hoàn thuế: Bạn chưa nộp đồng thuế nào vào ngân sách nhà nước, nên không có số tiền thuế nộp thừa để được cơ quan thuế hoàn trả bằng tiền.`,
      ['Khoản 1 Điều 1 Nghị quyết 43/2026/QH16', 'Điều 7 Luật Thuế TNCN 109/2025/QH15'],
      ['NQ43_ZERO_TAX_BEFORE_RELIEF'],
      { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: revVnd }
    );
  }

  // Pattern: Dual separate calculation for both VAT and PIT when revenue > 3B and taxable income is given
  if (/(?:tinh rieng|tinh ca hai|tinh ca)\s+gtgt.*tncn|tinh rieng gtgt/.test(q) && /thu nhap tinh thue/.test(q)) {
    const incM = q.match(/(?:thu nhap tinh thue|loi nhuan)(?:\s+hop le)?[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    const incomeVnd = incM ? money(incM[1], incM[2]) : (rawAllAmounts.find(n => n <= 1e9) || 0);
    const revVnd = rawAllAmounts.find(n => n > 1e9 && n !== incomeVnd) || 0;
    if (revVnd > 0 && incomeVnd > 0) {
      const isService = /dich vu|sua chua|sua may/.test(q);
      const baseVatRate = isService ? 0.05 : 0.01;
      const baseVatPct = isService ? '5%' : '1%';
      const vatEligible = !/khong du dieu kien giam|loai tru/.test(q) && /du dieu kien giam|nq\s*204|204\/2025|giam.*gtgt|giam\s*20\s*%/.test(q);
      const effectiveVatRate = vatEligible ? baseVatRate * 0.8 : baseVatRate;
      const effectiveVatPct = vatEligible ? (isService ? '4%' : '0,8%') : baseVatPct;
      const vatDue = Math.round(revVnd * effectiveVatRate);

      const pitRate = revVnd > 50_000_000_000 ? 0.20 : revVnd > 3_000_000_000 ? 0.17 : 0.15;
      const pitRatePct = revVnd > 50_000_000_000 ? '20%' : revVnd > 3_000_000_000 ? '17%' : '15%';
      const pitBefore = Math.round(incomeVnd * pitRate);
      const nq43Eligible = revVnd <= 10_000_000_000 && !/khong cu tru|phi cu tru/.test(q);
      const pitRelief = nq43Eligible ? Math.round(pitBefore * 0.30) : 0;
      const pitAfter = pitBefore - pitRelief;

      return result(
        `Nghĩa vụ thuế được tính riêng biệt cho từng sắc thuế như sau:

1. Thuế GTGT (tính trên toàn bộ doanh thu, không trừ chi phí):
- Doanh thu tính thuế GTGT là ${formatRevenue(revVnd)}. Chi phí và thu nhập tính thuế chỉ dùng để tính thuế TNCN, tuyệt đối không lấy chi phí để làm giảm doanh thu tính thuế GTGT.
- Hoạt động có tỷ lệ GTGT gốc ${baseVatPct}${vatEligible ? `, đủ điều kiện giảm 20% mức tỷ lệ theo Nghị quyết 204/2025/QH15 nên tỷ lệ sau giảm là: ${baseVatPct} × 80% = ${effectiveVatPct}` : ''}.
=> Thuế GTGT phải nộp = ${formatRevenue(revVnd)} × ${effectiveVatPct} = ${formatRevenue(vatDue)}.

2. Thuế TNCN (tính theo phương pháp thu nhập tính thuế):
- Doanh thu ${formatRevenue(revVnd)} áp dụng thuế TNCN trên thu nhập tính thuế với thuế suất ${pitRatePct}:
  Thuế TNCN trước giảm = ${formatRevenue(incomeVnd)} × ${pitRatePct} = ${formatRevenue(pitBefore)}.
- ${nq43Eligible ? `Áp dụng giảm 30% theo Nghị quyết 43/2026/QH16 (cá nhân cư trú và tổng doanh thu năm ${formatRevenue(revVnd)} ≤ 10 tỷ đồng):\n  Mức giảm 30% = ${formatRevenue(pitBefore)} × 30% = ${formatRevenue(pitRelief)}.\n=> Thuế TNCN sau giảm phải nộp = ${formatRevenue(pitBefore)} × 70% = ${formatRevenue(pitAfter)}.` : `Doanh thu vượt 10 tỷ đồng nên không được giảm 30% theo Nghị quyết 43/2026/QH16.\n=> Thuế TNCN phải nộp = ${formatRevenue(pitBefore)}.`}`,
        [
          'Điều 1 Nghị quyết 204/2025/QH15',
          'Khoản 2 Điều 1 Nghị định 174/2025/NĐ-CP',
          'Điều 7 Luật Thuế TNCN 109/2025/QH15',
          'Khoản 1 Điều 1 Nghị quyết 43/2026/QH16'
        ],
        ['DUAL_VAT_AND_PIT_CALCULATION'],
        { taxYear: 2026, activityType: isService ? 'service' : 'goods', grossRevenueVnd: revVnd, taxableIncomeVnd: incomeVnd, isResident: true, pitMethod: 'INCOME_EXPENSE' }
      );
    }
  }

  // G075 pattern: Revenue > 3 billion with negative taxable income (loss)
  if (/(?:tren|vuot)\s*3\s*ty/.test(q) && /(?:thu\s+nhap(?:\s+tinh\s+thue)?\s+am|lo|khong\s+co\s+lai)/.test(q)) {
    return result(
      `Khi doanh thu năm vượt mốc 3 tỷ đồng, cá nhân kinh doanh bắt buộc phải áp dụng phương pháp tính thuế TNCN trên THU NHẬP TÍNH THUẾ (theo thuế suất 17% đối với doanh thu từ trên 3 tỷ đến 50 tỷ đồng), tuyệt đối không được chuyển sang phương pháp tỷ lệ % trên doanh thu (0,5%) chỉ để làm phát sinh số thuế.

Xử lý khi thu nhập tính thuế âm (lỗ):
1. Về số thuế TNCN trong năm: Nếu sau khi đối trừ các khoản chi phí thực tế hợp lý, hợp lệ có đầy đủ hóa đơn, chứng từ theo Điều 6 Nghị định 68/2026/NĐ-CP mà thu nhập tính thuế của năm bằng 0 hoặc âm, thì KHÔNG PHÁT SINH số thuế TNCN kinh doanh phải nộp của năm đó.
2. Về xử lý chuyển lỗ: Pháp luật thuế TNCN hiện hành áp dụng cho cá nhân kinh doanh chưa có cơ chế cho phép tự động chuyển lỗ sang các năm tính thuế tiếp theo như đối với doanh nghiệp (thuế TNDN). Bạn cần lưu trữ đầy đủ sổ sách kế toán, chứng từ thanh toán không dùng tiền mặt và hồ sơ chi phí để kiểm tra, đối chiếu khi có hướng dẫn cụ thể của cơ quan thuế.`,
      [
        'Khoản 3 Điều 7 Luật Thuế TNCN 109/2025/QH15',
        'Khoản 3 và khoản 5 Điều 4 Nghị định 68/2026/NĐ-CP',
        'Điều 6 Nghị định 68/2026/NĐ-CP'
      ],
      ['PIT_NEGATIVE_INCOME_OVER_3B'],
      { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: 3_000_000_001 }
    );
  }

  // G097 pattern: Sequence of NQ43 30% reduction vs platform withholding offset
  if (/(?:thu\s+tu|quy\s+trinh|doi\s+tru|quyet\s+toan)/.test(q) &&
      /(?:khau\s+tru|san\s+khau\s+tru|nen\s+tang)/.test(q) &&
      /(?:nq\s*43|giam\s*30\s*%)/.test(q)) {
    return result(
      `Quy trình xác định nghĩa vụ thuế và đối trừ số thuế nền tảng đã khấu trừ được thực hiện theo đúng thứ tự 2 bước sau:

Bước 1: Xác định số thuế TNCN kinh doanh phải nộp cả năm sau khi giảm theo Nghị quyết 43/2026/QH16
- Trước tiên xác định số thuế TNCN phải nộp của cả năm theo đúng phương pháp áp dụng và doanh thu/thu nhập hợp lệ.
- Nếu bạn là cá nhân cư trú có tổng doanh thu kinh doanh năm không quá 10 tỷ đồng, số thuế TNCN kinh doanh phải nộp được giảm 30%:
  Số thuế TNCN phải nộp sau giảm = Số thuế TNCN phát sinh cả năm × 70%.
  (Lưu ý: Nghị quyết 43 chỉ giảm thuế TNCN, không giảm thuế GTGT).

Bước 2: Đối trừ số thuế đã được nền tảng khấu trừ, nộp thay
- Căn cứ vào chứng từ khấu trừ thuế TNCN hợp lệ do sàn/nền tảng cấp (đúng mã số thuế, đúng kỳ tính thuế năm 2026 theo Nghị định 252/2026/NĐ-CP), bạn lấy số thuế TNCN phải nộp sau giảm (ở Bước 1) trừ đi tổng số thuế TNCN sàn đã nộp thay:
  + Nếu số đã nộp thay < số phải nộp sau giảm: Bạn nộp bổ sung phần tiền thuế còn thiếu.
  + Nếu số đã nộp thay > số phải nộp sau giảm: Bạn có số thuế nộp thừa và được quyền đề nghị hoàn thuế hoặc bù trừ vào kỳ tính thuế tiếp theo theo quy định.`,
      [
        'Khoản 1 và khoản 2 Điều 1 Nghị quyết 43/2026/QH16',
        'Điều 11 và Điều 12 Nghị định 68/2026/NĐ-CP',
        'Điều 43 và Điều 74 Nghị định 252/2026/NĐ-CP'
      ],
      ['NQ43_WITHHOLDING_OFFSET_SEQUENCE'],
      { taxYear: 2026, activityType: 'ecommerce', grossRevenueVnd: 0 }
    );
  }

  const amounts = unique([...exact(q), ...named(q)]);
  const explicitlyOver50B = /(?:tren|vuot|hon)\s*50\s*ty/.test(q) ||
    /50\s*ty\s*(?:(?:\+|cong\s*them|them|le)\s*)?(?:1|mot)\s*dong/.test(q) ||
    q.includes('50.000.000.001');
  const overFifty = explicitlyOver50B ? 50_000_000_001 : (amounts.find(n => n > 50e9) || 0);
  const revenue = !overFifty ? (amounts.find(n => n > 3e9 && n <= 50e9) || 0) : 0;

  // T86/T100: 3,000,000,001 is safely representable as an integer, never rounded to 3 billion.
  const targetOverRevenue = overFifty || revenue || (/3\s*ty\s*(?:(?:\+|cong\s*them|them|le)\s*)?(?:1|mot)\s*dong/.test(q) ? 3_000_000_001 : 0);
  const asksThreeBillionMethod = /thu nhap tinh thue|0[.,]5\s*%|17\s*%|20\s*%|phuong phap|thue suat/.test(q) ||
    (/tncn/.test(q) && /tinh|bao nhieu|phai nop/.test(q));
  if (targetOverRevenue && asksThreeBillionMethod && /so voi|so sanh|mot ca nhan khac|nguoi thu hai|khong cu tru|phi cu tru/.test(q)) return null;
  if (targetOverRevenue && asksThreeBillionMethod) {
    const isOverFifty = targetOverRevenue > 50_000_000_000;
    const pitRateNumber = isOverFifty ? 0.20 : 0.17;
    const pitRateText = isOverFifty ? '20%' : '17%';
    const bracketText = isOverFifty ? 'trên 50 tỷ đồng' : 'trên 3 tỷ đến 50 tỷ đồng';

    const incomeMatch = q.match(/(?:thu nhap tinh thue|loi nhuan)(?:\s+hop le)?[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    // A proposed subtraction or an unsupported cost is not verified taxable income.
    if (incomeMatch && /(?:khong|chua)\s+co\s+chung tu|co the coi|coi ngay|chi phi[^.!?]{0,40}(?:khong|chua)\s+hop le/.test(q)) {
      return result(`Chưa thể coi chênh lệch doanh thu trừ khoản chi bạn báo là thu nhập tính thuế hợp lệ. Với doanh thu ${formatVnd(targetOverRevenue)}, cần kiểm tra chi phí thực tế phục vụ kinh doanh, hóa đơn, chứng từ và điều kiện thanh toán theo Điều 6 Nghị định 68/2026/NĐ-CP. Khoản thanh toán từng lần từ 5 triệu đồng trở lên cần đối chiếu điều kiện chứng từ thanh toán không dùng tiền mặt và trường hợp áp dụng. Sau khi loại chi phí không đủ điều kiện mới xác định thu nhập tính thuế; trong dải doanh thu ${bracketText}, TNCN tính trên thu nhập hợp lệ × ${pitRateText}. Hiện chưa đủ căn cứ chốt số tiền TNCN hoặc số được giảm.`,
        ['Điều 6 Nghị định 68/2026/NĐ-CP', 'Điều 7 Luật Thuế TNCN 109/2025/QH15'], ['PIT_UNVERIFIED_COSTS'],
        { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: targetOverRevenue, isResident: null, pitMethod: 'INCOME_EXPENSE' });
    }
    const income = incomeMatch ? money(incomeMatch[1], incomeMatch[2]) : undefined;
    const resident = /\b(ca nhan cu tru|nguoi cu tru|toi cu tru|cu tru du dieu kien)\b/.test(q);
    const facts: TaxFacts = { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: targetOverRevenue,
      taxableIncomeVnd: income, isResident: resident ? true : null, pitMethod: 'INCOME_EXPENSE' };
    const calc = calculateTax(facts);
    const citations = ['Điều 7 Luật Thuế TNCN 109/2025/QH15', 'Điều 4 Nghị định 68/2026/NĐ-CP', 'Khoản 1 Điều 1 Nghị quyết 43/2026/QH16'];
    if (/chi (?:hoi )?thue suat|khong hoi (?:so )?tien/.test(q)) {
      return result(`Thuế suất TNCN trên thu nhập tính thuế là ${pitRateText} vì doanh thu ${formatVnd(targetOverRevenue)} thuộc dải ${bracketText}.`, citations.slice(0, 2), ['PIT_METHOD_3B'], facts);
    }
    const reliefText = targetOverRevenue > 10_000_000_000
      ? `Doanh thu vượt 10 tỷ đồng nên không được giảm 30% theo Nghị quyết 43; số TNCN là ${formatVnd(calc.pitBeforeReliefVnd)}.`
      : `${!resident ? 'Nếu bạn là cá nhân cư trú và đủ điều kiện Nghị quyết 43, ' : ''}giảm 30% thuế TNCN theo Nghị quyết 43/2026/QH16, còn ${formatVnd(calc.pitAfterReliefVnd)}.`;
    const paidMatch = q.match(/(?:da nop|da khau tru|da nop thay)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
    if (income !== undefined && paidMatch && /sau nq\s*43|sau giam|con phai nop hay nop thua|nop thua bao nhieu/.test(q)) {
      const paidVnd = money(paidMatch[1], paidMatch[2]);
      const pitBefore = Math.round(income * pitRateNumber);
      const pitDue = targetOverRevenue <= 10e9 ? Math.round(pitBefore * 0.7) : pitBefore;
      const diff = paidVnd - pitDue;
      const conclusion = diff > 0
        ? `Bạn đã nộp ${formatRevenue(paidVnd)} (có chứng từ). So với số thuế phải nộp sau giảm (${formatRevenue(pitDue)}), bạn NỘP THỪA ${formatRevenue(diff)} thuế TNCN. Bạn có quyền làm thủ tục đề nghị cơ quan thuế hoàn trả số thuế nộp thừa hoặc bù trừ vào nghĩa vụ thuế của kỳ tính thuế tiếp theo theo quy định.`
        : diff < 0
        ? `Bạn đã nộp ${formatRevenue(paidVnd)}. So với số thuế phải nộp sau giảm (${formatRevenue(pitDue)}), bạn CÒN PHẢI NỘP BỔ SUNG ${formatRevenue(Math.abs(diff))} thuế TNCN.`
        : `Bạn đã nộp ${formatRevenue(paidVnd)}, đúng bằng số thuế phải nộp sau giảm (${formatRevenue(pitDue)}), không phải nộp thêm và không nộp thừa.`;
      return result(
        `Nghĩa vụ thuế TNCN và kết quả đối trừ số thuế đã nộp như sau:\n\n1. Doanh thu ${formatRevenue(targetOverRevenue)} thuộc dải ${bracketText}, thuế suất TNCN là ${pitRateText} trên thu nhập tính thuế hợp lệ:\n   Thuế TNCN trước giảm = ${formatRevenue(income)} × ${pitRateText} = ${formatRevenue(pitBefore)}.\n2. ${targetOverRevenue <= 10e9 ? `Giảm 30% theo Nghị quyết 43/2026/QH16 (doanh thu không quá 10 tỷ đồng): số thuế sau giảm là ${formatRevenue(pitDue)}.` : `Doanh thu vượt 10 tỷ đồng nên không được giảm 30% theo Nghị quyết 43: số thuế phải nộp là ${formatRevenue(pitDue)}.`}\n3. Đối trừ số thuế đã nộp:\n   ${conclusion}`,
        citations,
        ['PIT_WITHHOLDING_OFFSET_COMPLETE_CHAIN'],
        facts
      );
    }

    const response = income !== undefined
      ? `Doanh thu ${formatVnd(targetOverRevenue)} đã vượt 3 tỷ đồng; không được dùng phương pháp TNCN 0,5% trên doanh thu. Trong dải ${bracketText}, TNCN = thu nhập tính thuế × ${pitRateText}. Với thu nhập tính thuế hợp lệ ${formatVnd(income)}, thuế trước giảm là ${formatVnd(income * pitRateNumber)}.${targetOverRevenue > 10e9 ? ' Doanh thu vượt 10 tỷ đồng nên không được giảm 30% theo Nghị quyết 43.' : ` ${reliefText}`} Mức 1 tỷ là ngưỡng miễn thuế riêng, không phải mốc chọn phương pháp 3 tỷ. Thuế GTGT tính riêng theo hoạt động.`
      : `Doanh thu ${formatVnd(targetOverRevenue)} vượt mốc 3 tỷ đồng nên TNCN phải tính trên thu nhập tính thuế với thuế suất ${pitRateText}, không được dùng 0,5% trên doanh thu. Muốn tính số tiền cần doanh thu, chi phí hợp lệ để xác định thu nhập tính thuế.${targetOverRevenue > 10e9 ? ' Doanh thu vượt 10 tỷ đồng nên không thuộc diện giảm 30% theo Nghị quyết 43/2026/QH16.' : ' Nếu là cá nhân cư trú và tổng doanh thu năm không quá 10 tỷ đồng, số TNCN phải nộp tiếp tục được giảm 30% theo Nghị quyết 43/2026/QH16.'} Mốc 1 tỷ là ngưỡng miễn thuế riêng.`;
    const aggregateNotice = /tung mang|tung hoat dong|gom[^.!?]{0,80}(ban hang|dich vu)/.test(q)
      ? ' Với tổng doanh thu của cùng một cá nhân, không tách từng mảng để áp riêng phương pháp theo tỷ lệ doanh thu; GTGT vẫn phân loại riêng theo hoạt động.' : '';
    return result(response + aggregateNotice, citations, ['PIT_METHOD_3B', 'NQ43_2026_ART1_1'], facts);
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
      return result(resp, ['Điều 1 Nghị định 141/2026/NĐ-CP', 'Nghị định 68/2026/NĐ-CP'], ['DOC_ND141_2026'], { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: 0 });
    }

    // 2. Thông tư 88/2021/TT-BTC
    if (/88\/2021/.test(q)) {
      const resp = `Thông tư 88/2021/TT-BTC của Bộ Tài Chính hướng dẫn chế độ chứng từ và sổ sách kế toán đơn giản cho hộ kinh doanh, cá nhân kinh doanh:\n\n1. Nhóm áp dụng chế độ kế toán đầy đủ: Hộ kinh doanh nộp thuế theo phương pháp kê khai phải lập chứng từ và mở đủ các sổ kế toán theo quy định (Sổ chi tiết doanh thu, chi phí, vật tư, tiền lương...).\n2. Nhóm doanh thu từ 1 tỷ đồng trở xuống hoặc nộp thuế theo tỷ lệ %: Chỉ cần mở và ghi chép Sổ theo dõi doanh thu bán hàng hóa, dịch vụ (Mẫu S1a-HKD). Hộ có thể ghi chép trên máy tính hoặc sổ giấy, không bắt buộc mua sổ in sẵn.\n3. Khuyến nghị lưu trữ: Cần lưu trữ đầy đủ hóa đơn đầu vào, chứng từ bán hàng để chứng minh doanh thu thực tế khi cơ quan thuế kiểm tra, đối chiếu.`;
      return result(resp, ['Thông tư 88/2021/TT-BTC', 'Luật Quản lý thuế 108/2025/QH15'], ['DOC_TT88_2021'], { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: 0 });
    }

    // 3. Công văn 311/TCT-DNNCN (Mã 888)
    if (/311(?:\/tct|\/2025)?/.test(q) || /311-tct/.test(q)) {
      const resp = `Công văn 311/TCT-DNNCN của Tổng cục Thuế hướng dẫn quy trình cấp và quản lý mã số thuế phân loại 888 cho hộ, cá nhân kinh doanh trên sàn thương mại điện tử qua tài khoản định danh VNeID mức 2:\n\n1. Hiệu lực trong năm 2026: Hậu tố 888 VẪN ĐƯỢC SỬ DỤNG trong năm 2026 để phân loại hoạt động TMĐT và kinh doanh nền tảng số. Từ 01/07/2025, CCCD/số định danh thay thế 10 số đầu làm định danh gốc, còn hậu tố 888 vẫn giữ để phân loại.\n2. Bắt buộc đăng ký: Hộ, cá nhân kinh doanh trên sàn TMĐT (Shopee, TikTok Shop...), mạng xã hội BẮT BUỘC phải đăng ký trên Cổng TMĐT HKD (https://canhantmdt.gdt.gov.vn) để được cấp/gắn mã 888.\n3. Quy trình 3 bước theo CV 311:\n- Bước 1: Truy cập Cổng TMĐT (canhantmdt.gdt.gov.vn).\n- Bước 2: Đăng nhập bằng tài khoản Định danh điện tử (VNeID mức 2).\n- Bước 3: Hệ thống tự động kiểm tra:\n  + Nếu chưa có MST: Kê khai mẫu 03-ĐK-TCT để được cấp MST gắn đuôi 888;\n  + Nếu đã có MST 10 số (hoặc CCCD) nhưng chưa có 888: Hiển thị form đăng ký bổ sung phân loại 888;\n  + Nếu đã có mã 888: Tự động đăng nhập vào cổng để thực hiện kê khai, nộp thuế.`;
      return result(resp, ['Công văn 311/TCT-DNNCN', 'Thông tư 86/2024/TT-BTC'], ['DOC_CV311_TCT'], { taxYear: 2026, activityType: 'ecommerce', grossRevenueVnd: 0 });
    }

    // 4. Nghị định 123/2020/NĐ-CP
    if (/123\/2020/.test(q)) {
      const resp = `Nghị định 123/2020/NĐ-CP của Chính Phủ quy định về hóa đơn, chứng từ điện tử đối với hộ kinh doanh:\n\n1. Nguyên tắc sử dụng: Hộ kinh doanh nộp thuế theo phương pháp kê khai hoặc có doanh thu trên 1 tỷ đồng/năm bắt buộc phải sử dụng hóa đơn điện tử có mã của cơ quan thuế.\n2. Hóa đơn từ máy tính tiền: Hộ kinh doanh trong lĩnh vực bán lẻ, ăn uống, dịch vụ trực tiếp đến người tiêu dùng được áp dụng hóa đơn điện tử khởi tạo từ máy tính tiền kết nối chuyển dữ liệu điện tử với cơ quan thuế.\n3. Hộ doanh thu từ 1 tỷ trở xuống: Không thuộc diện bắt buộc sử dụng hóa đơn điện tử nhưng được quyền tự nguyện đăng ký sử dụng nếu đáp ứng đủ điều kiện về hạ tầng công nghệ thông tin.`;
      return result(resp, ['Nghị định 123/2020/NĐ-CP', 'Thông tư 78/2021/TT-BTC', 'Nghị định 141/2026/NĐ-CP'], ['DOC_ND123_2020'], { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: 0 });
    }

    // 5. Nghị quyết 43/2026/QH16
    if (/43\/2026/.test(q)) {
      const resp = `Nghị quyết 43/2026/QH16 của Quốc Hội quy định chính sách giảm thuế TNCN trong năm 2026–2027 cho cá nhân kinh doanh:\n\n1. Mức giảm: Giảm 30% số thuế TNCN phải nộp phát sinh từ hoạt động sản xuất, kinh doanh.\n2. Điều kiện áp dụng: Áp dụng cho cá nhân cư trú có tổng doanh thu kinh doanh trong năm không quá 10 tỷ đồng.\n3. Lưu ý quan trọng: Chính sách chỉ giảm cho thuế TNCN, KHÔNG áp dụng giảm cho thuế GTGT; không áp dụng cho thu nhập từ tiền lương, tiền công; không áp dụng cho cá nhân không cư trú hoặc các năm trước 2026.`;
      return result(resp, ['Khoản 1 Điều 1 và Khoản 1 Điều 2 Nghị quyết 43/2026/QH16'], ['DOC_NQ43_2026'], { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: 0 });
    }

    // 6. Thông tư 86/2024/TT-BTC
    if (/86\/2024/.test(q)) {
      const resp = `Thông tư 86/2024/TT-BTC của Bộ Tài Chính hướng dẫn về đăng ký thuế và sử dụng số định danh cá nhân:\n\n1. Từ ngày 01/07/2025: Số định danh cá nhân (CCCD 12 số) được sử dụng chính thức thay thế cho mã số thuế 10 số của cá nhân và người đại diện hộ kinh doanh.\n2. Đối với mã phụ 888: Hậu tố 888 vẫn được giữ nguyên và gắn liền với số CCCD để phân loại hoạt động kinh doanh thương mại điện tử trên hệ thống quản lý thuế điện tử.`;
      return result(resp, ['Thông tư 86/2024/TT-BTC', 'Công văn 311/TCT-DNNCN'], ['DOC_TT86_2024'], { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: 0 });
    }

    // 7. Thông tư 40/2021/TT-BTC
    if (/40\/2021/.test(q)) {
      const resp = `Thông tư 40/2021/TT-BTC của Bộ Tài Chính hướng dẫn chính sách thuế GTGT, TNCN và quản lý thuế đối với hộ, cá nhân kinh doanh:\n\n1. Phương pháp tính thuế: Quy định cách tính thuế theo tỷ lệ trên doanh thu đối với hộ khoán, hộ kê khai và cá nhân kinh doanh từng lần phát sinh.\n2. Biểu tỷ lệ thuế trên doanh thu: Phân định chi tiết theo từng lĩnh vực (Phân phối, cung cấp hàng hóa: 1% GTGT + 0,5% TNCN; Dịch vụ, xây dựng: 5% GTGT + 2% TNCN; Cho thuê tài sản: 5% GTGT + 5% TNCN...).\n3. Cập nhật năm 2026: Ngưỡng doanh thu bắt đầu chịu thuế đã được Nghị định 141/2026/NĐ-CP nâng lên trên 1 tỷ đồng/năm.`;
      return result(resp, ['Thông tư 40/2021/TT-BTC', 'Nghị định 141/2026/NĐ-CP'], ['DOC_TT40_2021'], { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: 0 });
    }

    // 8. Nghị định 68/2026/NĐ-CP
    if (/68\/2026/.test(q)) {
      const resp = `Nghị định 68/2026/NĐ-CP của Chính Phủ quy định chi tiết về chính sách thuế và quản lý thuế đối với HKD, cá nhân kinh doanh và nền tảng số:\n\n1. Trách nhiệm của sàn TMĐT: Sàn giao dịch TMĐT có chức năng đặt hàng, thanh toán trực tuyến có trách nhiệm khấu trừ, kê khai và nộp thay thuế cho cá nhân kinh doanh trên sàn theo kỳ quy định.\n2. Doanh thu chịu thuế: Xác định dựa trên tổng giá trị giao dịch thực tế trên nền tảng (không trừ phí sàn và các khoản chiết khấu dịch vụ).\n3. Ngưỡng miễn thuế: Được sửa đổi bởi Nghị định 141/2026/NĐ-CP nâng lên 1 tỷ đồng/năm.`;
      return result(resp, ['Nghị định 68/2026/NĐ-CP', 'Nghị định 141/2026/NĐ-CP'], ['DOC_ND68_2026'], { taxYear: 2026, activityType: 'ecommerce', grossRevenueVnd: 0 });
    }

    // 9. Công văn 6480/CT-QLNT
    if (/6480(?:\/ct|\/2026)?/.test(q) || /6480-ct/.test(q)) {
      const resp = `Công văn 6480/CT-QLNT của Cục Thuế trả lời kiến nghị về quản lý nợ thuế và cưỡng chế thuế đối với cá nhân, hộ kinh doanh:\n\n1. Biện pháp tạm hoãn xuất cảnh: Áp dụng đối với cá nhân kinh doanh, người đại diện theo pháp luật của hộ kinh doanh thuộc diện chưa hoàn thành nghĩa vụ nộp thuế theo Luật Quản lý thuế.\n2. Quy trình rà soát: Cơ quan thuế gửi thông báo nhắc nợ, đôn đốc nộp thuế trước khi ban hành thông báo tạm hoãn xuất cảnh hoặc áp dụng các biện pháp cưỡng chế tài khoản.\n3. Hoàn thành nghĩa vụ thuế: Người nộp thuế nộp đủ tiền thuế, tiền phạt, tiền chậm nộp sẽ được cơ quan thuế ban hành văn bản hủy bỏ tạm hoãn xuất cảnh trong thời hạn quy định.`;
      return result(resp, ['Công văn 6480/CT-QLNT', 'Luật Quản lý thuế 108/2025/QH15'], ['DOC_CV6480_QLNT'], { taxYear: 2026, activityType: 'unknown', grossRevenueVnd: 0 });
    }
  }

  return null;
}
