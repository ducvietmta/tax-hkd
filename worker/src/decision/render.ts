/**
 * DETERMINISTIC ANSWER RENDERER
 *
 * Sinh câu trả lời chuẩn mực trực tiếp từ kết quả của Rules Engine cho các ca
 * đã xác minh (ANSWERABLE_VERIFIED), không cần gọi LLM, đảm bảo độ trễ 0ms và độ chính xác 100%.
 */

import type { EvaluationResult } from '../rules/evaluator';
import type { TaxDecisionFrame } from './types';

export function renderDeterministicAnswer(
  evalResult: EvaluationResult,
  frame: TaxDecisionFrame
): { response: string; citations: string[] } {
  const taxYear = frame.tax_period.years[0] || 2026;
  const rev = evalResult.effective_revenue_vnd;

  let response = '';
  const focus = frame.semantic?.taxFocus;
  const percentage = (rate: number) => Number((rate * 100).toFixed(6)).toLocaleString('vi-VN');
  const onlyTax = focus === 'vat' ? 'GTGT' : focus === 'pit' ? 'TNCN' : null;

  if (evalResult.total_tax_payable_vnd === 0) {
    if (onlyTax) {
      response = `Mình đối chiếu giúp bạn: doanh thu ${formatVnd(rev)} trong năm ${taxYear} nằm trong ngưỡng không phải nộp thuế ${onlyTax}, nên bạn không phải nộp đồng nào.`;
    } else {
    if (taxYear >= 2026) {
      response = `Mình đối chiếu giúp bạn: doanh thu ${formatVnd(rev)} trong năm ${taxYear} từ 1 tỷ đồng/năm trở xuống nên không phải nộp thuế GTGT và thuế TNCN (Nghị định 141/2026/NĐ-CP), bạn không phải nộp đồng nào. Lệ phí môn bài từ 01/01/2026 cũng đã được bãi bỏ hoàn toàn.`;
    } else {
      response = `Mình đối chiếu giúp bạn: doanh thu ${formatVnd(rev)} năm ${taxYear} từ 100 triệu đồng/năm trở xuống nên không phải nộp thuế GTGT và thuế TNCN theo Thông tư 40/2021/TT-BTC, bạn không phải nộp đồng nào.`;
    }
    }
  } else {
    const vatLine = evalResult.activities
      ? evalResult.activities.map(a=>`- GTGT hoạt động ${a.id}: ${formatVnd(a.revenue_vnd)} × ${percentage(a.vat_rate)}% = ${formatVnd(a.vat_due_vnd)}.`).join('\n')+`\nTổng GTGT: ${formatVnd(evalResult.vat_due_vnd)}. Chi phí không làm giảm doanh thu tính GTGT.`
      : `- Thuế GTGT: ${formatVnd(evalResult.taxable_vat_revenue_vnd)} × ${percentage(evalResult.vat_rate)}% = ${formatVnd(evalResult.vat_due_vnd)}. Chi phí không làm giảm doanh thu tính GTGT.`;
    const usesIncomeMethod = evalResult.method==='INCOME'||(taxYear >= 2026 && rev > 3_000_000_000);
    const pitBaseLine = usesIncomeMethod
      ? `- Thuế TNCN trước giảm: thu nhập tính thuế ${formatVnd(evalResult.taxable_pit_revenue_vnd)} × ${percentage(evalResult.pit_rate)}% = ${formatVnd(evalResult.pit_before_relief_vnd)}`
      : evalResult.activities
      ? evalResult.activities.map(a=>`- TNCN hoạt động ${a.id}: (${formatVnd(a.revenue_vnd)} − mức trừ ${formatVnd(a.allowance_vnd)}) × ${percentage(a.pit_rate)}% = ${formatVnd(a.pit_before_relief_vnd)}.`).join('\n')+`\nTNCN trước giảm: ${formatVnd(evalResult.pit_before_relief_vnd)}. Mức trừ chỉ dùng một lần, phân bổ ưu tiên hoạt động có tỷ lệ cao hơn.`
      : taxYear >= 2026
      ? `- Thuế TNCN (${evalResult.pit_rate * 100}% trên phần doanh thu vượt 1 tỷ đồng): ${formatVnd(evalResult.pit_before_relief_vnd)}`
      : `- Thuế TNCN (${evalResult.pit_rate * 100}% trên toàn bộ doanh thu): ${formatVnd(evalResult.pit_before_relief_vnd)}`;

    let pitReliefLine = '';
    if (evalResult.pit_relief_vnd > 0) {
      pitReliefLine = `\n- Khi là cá nhân cư trú, tổng doanh thu kinh doanh năm không quá 10 tỷ đồng và đủ điều kiện Nghị quyết 43/2026/QH16: TNCN sau giảm = ${formatVnd(evalResult.pit_before_relief_vnd)} × 70% = ${formatVnd(evalResult.pit_after_relief_vnd)} (giảm ${formatVnd(evalResult.pit_relief_vnd)}).${focus === 'pit' ? '' : ' Chính sách này không giảm thêm GTGT.'}`;
    }

    const assumption = frame.facts.vat_rate_explicit !== undefined && focus !== 'pit'
      ? `Theo tỷ lệ GTGT gốc ${percentage(frame.facts.vat_rate_explicit)}% bạn cung cấp${frame.facts.vat_relief_assumed ? ', với giả định toàn bộ doanh thu đủ điều kiện giảm 20% mức tỷ lệ' : ''}:\n` : '';
    const periodAssumption = frame.semantic?.revenueContext === 'UNSPECIFIED'
      ? 'Mình tính với giả định số doanh thu bạn cho là tổng doanh thu kinh doanh cả năm. Nếu đây chỉ là số lũy kế hoặc của một cửa hàng thì cần xác định lại tổng năm trước khi chốt nghĩa vụ.\n' : '';
    response = periodAssumption + assumption + `Mình tính cho trường hợp của bạn (doanh thu ${formatVnd(rev)}, năm ${taxYear}) nhé:\n` +
      (focus === 'pit' ? '' : `${vatLine}\n`) +
      (focus === 'vat' ? '' : `${pitBaseLine}${pitReliefLine}\n`) +
      (onlyTax ? `Số thuế ${onlyTax} phải nộp: ${formatVnd(focus === 'vat' ? evalResult.vat_due_vnd : evalResult.pit_after_relief_vnd)}.`
        : `=> Tổng số thuế phải nộp: ${formatVnd(evalResult.total_tax_payable_vnd)}.`);
  }

  const fullText = `${response}\n\nCăn cứ pháp lý:\n${evalResult.citations.map((c) => `- ${c}`).join('\n')}`;
  return {
    response: fullText,
    citations: evalResult.citations,
  };
}

function formatVnd(amount: number): string {
  if (!Number.isSafeInteger(amount) || amount % 1_000_000 !== 0) {
    return `${amount.toLocaleString('vi-VN')} đồng`;
  }
  if (amount >= 1_000_000_000) {
    const billions = amount / 1_000_000_000;
    return `${billions.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} tỷ đồng`;
  }
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `${millions.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} triệu đồng`;
  }
  return `${amount.toLocaleString('vi-VN')} đồng`;
}

/**
 * Render bảng so sánh đối chiếu đa thời kỳ (ví dụ 2025 vs 2026)
 */
export function renderMultiYearComparison(
  multiResults: Record<number, EvaluationResult>,
  frame: TaxDecisionFrame
): { response: string; citations: string[] } {
  const years = Object.keys(multiResults).map(Number).sort((a, b) => a - b);
  const rev = frame.facts.revenue_vnd || 0;
  const sections: string[] = [];
  const allCitations = new Set<string>();

  for (const year of years) {
    const res = multiResults[year];
    res.citations.forEach((c) => allCitations.add(c));
    if (res.total_tax_payable_vnd === 0) {
      const thresholdDesc = year >= 2026 ? '1 tỷ đồng/năm (NĐ 141/2026/NĐ-CP)' : '100 triệu đồng/năm (TT 40/2021/TT-BTC)';
      sections.push(`### Năm ${year}:\n- Doanh thu ${formatVnd(rev)} không vượt ngưỡng miễn thuế ${thresholdDesc}.\n- Tổng số thuế phải nộp: **0 đồng**.`);
    } else {
      sections.push(
        `### Năm ${year}:\n` +
        `- Thuế GTGT: ${formatVnd(res.vat_due_vnd)}\n` +
        `- Thuế TNCN: ${formatVnd(res.pit_after_relief_vnd)} ${res.pit_relief_vnd > 0 ? '(đã giảm 30% theo NQ 43)' : ''}\n` +
        `- Tổng thuế phải nộp: **${formatVnd(res.total_tax_payable_vnd)}**`
      );
    }
  }

  const response = `**Mình so sánh giúp bạn các năm với doanh thu ${formatVnd(rev)} nhé:**\n\n` +
    sections.join('\n\n') +
    `\n\n**Điểm khác biệt then chốt:**\n` +
    `- **Năm 2025 trở về trước:** Ngưỡng không chịu thuế là 100 triệu đồng/năm. Nếu vượt 100 triệu, phải nộp thuế trên TOÀN BỘ doanh thu và không được áp dụng giảm 30% TNCN của Nghị quyết 43.\n` +
    `- **Năm 2026 trở đi:** Ngưỡng miễn thuế nâng lên 1 tỷ đồng/năm (NĐ 141/2026/NĐ-CP). Nếu vượt 1 tỷ, thuế TNCN chỉ tính trên phần doanh thu vượt 1 tỷ đồng (Luật 109/2025/QH15) và cá nhân cư trú được giảm 30% thuế TNCN theo Nghị quyết 43/2026/QH16.\n\n` +
    `Căn cứ pháp lý:\n${Array.from(allCitations).map((c) => `- ${c}`).join('\n')}`;

  return {
    response,
    citations: Array.from(allCitations),
  };
}

