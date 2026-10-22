import type { TaxDecisionFrame } from './types';
import type { EvaluationResult } from '../rules/evaluator';
import { methodComparisonLedger, historicalCalculationLedger } from './methodComparison';
import { ARITHMETIC_INSTRUCTIONS } from './arithmetic';

/** Only a fully scoped engine evaluation is a ledger, never a loose numeric hint. */
export function codeCalculationLedger(frame:TaxDecisionFrame,evaluation:EvaluationResult|null){
  if(!evaluation||evaluation.status!=='ANSWERED'||frame.tax_period.years.length!==1||frame.facts.revenue_basis!=='ANNUAL'||
    !['HOUSEHOLD_BUSINESS','INDIVIDUAL_BUSINESS'].includes(frame.taxpayer_type.value)||
    (frame.residency.value!=='RESIDENT'&&frame.semantic?.taxFocus!=='vat')||
    frame.semantic?.calculationShape==='SCENARIOS'||
    // A broad service label does not prove its VAT subgroup (e.g. repair,
    // transport, or a contract including materials). Prefer sourced arithmetic.
    !frame.income_type.every(t=>['GOODS_SALES','FOOD_SERVICE'].includes(t.value))||
    (frame.income_type.length>1&&!frame.facts.multi_activities?.length)||
    (frame.facts.vat_relief_assumed&&frame.tax_period.years[0]!==2026)||
    ['PROJECTED','PARTIAL_PERIOD','TRANSACTION'].includes(frame.semantic?.revenueContext||'')||
    (frame.semantic?.methodContext==='TURNOVER_ACTIVE'&&frame.semantic?.taxFocus!=='vat')||
    frame.missing_facts.some(f=>f.blocking)||frame.facts.platform_fee_vnd||frame.facts.shipping_cod_vnd)return null;
  return {year:frame.tax_period.years[0],facts:frame.facts,assumptions:frame.requests?.flatMap(r=>r.assumptions)||[],
    method:evaluation.method,rule_outcomes:evaluation.rule_outcomes,vat_base:evaluation.taxable_vat_revenue_vnd,
    vat_rate:evaluation.vat_rate,vat_due:evaluation.vat_due_vnd,pit_base:evaluation.taxable_pit_revenue_vnd,pit_rate:evaluation.pit_rate,
    pit_before:evaluation.pit_before_relief_vnd,pit_after:evaluation.pit_after_relief_vnd,activities:evaluation.activities};
}
function ledgerInstructions(frame:TaxDecisionFrame,evaluation:EvaluationResult|null){
 const comparison=methodComparisonLedger(frame);
 if(comparison)return `LEDGER SO SÁNH CÓ ĐIỀU KIỆN DO CODE TÍNH: ${JSON.stringify(comparison)}. Giải thích cả hai phương pháp trên cùng dữ kiện. Giữ các điều kiện pháp lý và chi phí từ nguồn. Khi sector_known=false, không chọn ngành cho người hỏi: nêu công thức với tỷ lệ ngành và các ví dụ được đánh hypothetical, rồi hỏi ngành để chốt; vẫn trả số đã tính được của nhánh thu nhập. Kết quả sau giảm chỉ có điều kiện cư trú/NQ43, không biến thành dữ kiện đã biết. Reviewer vẫn phải đối chiếu nguồn cho từng phương pháp.`;
 const historical=historicalCalculationLedger(frame);
 if(historical)return `LEDGER KỲ LỊCH SỬ CÓ ĐIỀU KIỆN DO CODE TÍNH: ${JSON.stringify(historical)}. Trả phần nghĩa vụ và số tiền tính được theo tỷ lệ gốc dưới giả định hàng hóa/dịch vụ chịu thuế và phạm vi cá nhân cư trú của nguồn. Không dùng ngưỡng hiện tại hồi tố. Không lấy chi phí làm cơ sở TNCN của phương pháp tỷ lệ trong kỳ lịch sử. Số GTGT chưa giảm không phải số chốt cuối nếu chưa xét điều kiện giảm; giữ rõ trước đối trừ đã nộp. Reviewer phải đối chiếu nguồn lịch sử, không tự xác nhận điều kiện chưa biết.`;
 const ledger=codeCalculationLedger(frame,evaluation);
 return ledger?`SỐ THUẾ DO CODE TÍNH CÓ ĐIỀU KIỆN: ${JSON.stringify(ledger)}. Chỉ dùng kết quả nếu điều kiện, vai trò số liệu, giả định và kỳ trong ledger đúng câu hỏi. Những nhánh còn lại có đủ dữ kiện và nguồn thì dùng công cụ số học bên dưới; mapping căn cứ và reviewer vẫn bắt buộc. Không lấy tiền GTGT làm TNCN hay đổi cơ sở.`
 : 'Chưa có bảng tính engine phù hợp. Dùng công cụ số học dưới đây cho phần có đủ dữ kiện và nguồn; giữ phần còn thiếu có điều kiện.';
}
export function calculationInstructions(frame:TaxDecisionFrame,evaluation:EvaluationResult|null){
 return ledgerInstructions(frame,evaluation)+'\n'+ARITHMETIC_INSTRUCTIONS;
}
