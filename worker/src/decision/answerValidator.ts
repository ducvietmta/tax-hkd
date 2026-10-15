/**
 * LEGAL ANSWER VALIDATOR & GUARDRAIL
 *
 * Kiểm định toàn diện câu trả lời trước khi gửi tới người dùng.
 * Mở rộng từ answerValidation.ts hiện có.
 */

import type { TaxDecisionFrame } from './types';
import type { EvaluationResult } from '../rules/evaluator';

export interface ValidationReport {
  status: 'PASS' | 'REPAIR' | 'DOWNGRADE';
  reasons: string[];
  repairedText?: string;
}

export function validateAnswer(
  answerText: string,
  frame: TaxDecisionFrame,
  evalResult?: EvaluationResult
): ValidationReport {
  const reasons: string[] = [];
  let status: 'PASS' | 'REPAIR' | 'DOWNGRADE' = 'PASS';
  let text = answerText;

  if (!text.trim() || /hiện chưa thể tổng hợp câu trả lời/i.test(text)) {
    return { status: 'DOWNGRADE', reasons: ['Không có câu trả lời có thể kiểm chứng'], repairedText: text };
  }

  if (evalResult?.status === 'ANSWERED' && evalResult.effective_revenue_vnd > 3_000_000_000 &&
      frame.tax_period.years[0] >= 2026 &&
      (/0[,.]5\s*%/.test(text) || !text.includes(`${evalResult.pit_rate * 100}%`))) {
    return { status: 'DOWNGRADE', reasons: ['TNCN theo doanh thu hoặc thiếu thuế suất của phương pháp thu nhập'], repairedText: text };
  }

  // 1. Kiểm tra cấm trích dẫn Luật Quản lý thuế 38/2019 nếu nói về HĐĐT máy tính tiền năm 2026
  if (
    frame.tax_period.years.includes(2026) &&
    /Luật (?:Quản lý thuế|QLT)\s*38\/2019/i.test(text) &&
    /máy tính tiền|hóa đơn điện tử/i.test(text)
  ) {
    status = 'REPAIR';
    reasons.push('Phát hiện trích dẫn sai Luật 38/2019 cho HĐĐT 2026');
    text = text.replace(/Luật (?:Quản lý thuế|QLT)\s*38\/2019\/QH14/g, 'Nghị định 68/2026/NĐ-CP');
  }

  // 2. Kiểm tra tính toàn vẹn của số thuế nếu có kết quả từ Rules Engine
  if (evalResult && evalResult.status === 'ANSWERED') {
    const payableVnd = evalResult.total_tax_payable_vnd;
    if (payableVnd === 0) {
      if (!/0 đồng|không phải nộp/i.test(text)) {
        status = 'REPAIR';
        reasons.push('Câu trả lời chưa nêu rõ số thuế phải nộp là 0 đồng');
      }
    }
  }

  // 3. Kiểm tra các câu hỏi về HĐĐT máy tính tiền có nêu mốc 30 ngày không
  if (
    frame.tax_intent.primary.value === 'E_INVOICE' ||
    frame.tax_intent.secondary.includes('E_INVOICE')
  ) {
    if (/trên 1 tỷ|vượt 1 tỷ|hơn 1 tỷ/i.test(text) && !/30 ngày/i.test(text)) {
      status = 'REPAIR';
      reasons.push('Thiếu mốc thời hạn 30 ngày bắt buộc sử dụng HĐĐT từ máy tính tiền');
      text += '\n\n*Lưu ý quan trọng:* Với trường hợp doanh thu lũy kế vượt ngưỡng trong năm, hộ kinh doanh thuộc diện áp dụng phải đăng ký sử dụng hóa đơn điện tử trong **30 ngày kể từ ngày cuối cùng của kỳ tính thuế** có doanh thu lũy kế trên 1 tỷ đồng.';
    }
  }

  // 4. Cảnh báo bẫy dòng tiền TMĐT: Phí sàn
  if (frame.facts.platform_fee_vnd && !/không được (?:tự )?trừ (?:chi )?phí sàn/i.test(text)) {
    status = 'REPAIR';
    reasons.push('Thiếu lưu ý về việc không được tự trừ phí sàn khi tính thuế theo tỷ lệ % doanh thu');
    text += '\n\n*Lưu ý về dòng tiền TMĐT:* Phí sàn (phí hoa hồng, phí cố định, phí dịch vụ...) không được tự trừ khỏi doanh thu nếu áp dụng phương pháp tỷ lệ % trên doanh thu theo Điều 5 Nghị định 68/2026/NĐ-CP.';
  }

  // 5. Cảnh báo bẫy dòng tiền TMĐT: Tiền COD thu hộ
  if (frame.facts.shipping_cod_vnd && !/thu hộ|không tính vào doanh thu/i.test(text)) {
    status = 'REPAIR';
    reasons.push('Thiếu làm rõ về tiền thu hộ COD của hãng vận chuyển');
    text += '\n\n*Lưu ý về tiền COD/Ship:* Tiền cước vận chuyển do đơn vị giao nhận thu hộ trực tiếp từ khách hàng không tính vào doanh thu chịu thuế của hộ kinh doanh.';
  }

  return {
    status,
    reasons,
    repairedText: text,
  };
}
