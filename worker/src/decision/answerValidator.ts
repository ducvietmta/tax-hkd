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

function inspectAnswer(
  answerText: string,
  frame: TaxDecisionFrame,
  evalResult?: EvaluationResult,
  userMessage?: string
): ValidationReport {
  const reasons: string[] = [];
  let status: 'PASS' | 'REPAIR' | 'DOWNGRADE' = 'PASS';
  let text = answerText;

  if (!text.trim() || /hiện chưa thể tổng hợp câu trả lời/i.test(text)) {
    return { status: 'DOWNGRADE', reasons: ['Không có câu trả lời có thể kiểm chứng'], repairedText: text };
  }

  const focus = frame.semantic?.taxFocus;
  const body = text.split(/Căn cứ pháp lý\s*:/i)[0];
  const excluded = focus === 'pit' ? 'GTGT' : focus === 'vat' ? 'TNCN' : null;
  const messageMentionsExcluded = !!(excluded && userMessage && new RegExp(`\\b${excluded}\\b`, 'i').test(userMessage));
  const isCalculationIntent = frame.tax_intent.primary.value === 'TAX_CALCULATION' ||
    frame.tax_intent.secondary.includes('TAX_CALCULATION') ||
    frame.semantic?.topic === 'TAX_AMOUNT';
  if (excluded && !messageMentionsExcluded && isCalculationIntent) {
    const lines = body.split('\n');
    for (const line of lines) {
      if (new RegExp(`\\b${excluded}\\b`, 'i').test(line)) {
        if (/ngưỡng|ranh giới|mốc|hạn mức|điều kiện|miễn|không phải nộp/i.test(line)) {
          continue;
        }
        if (
          /không|chưa|chỉ|riêng|thuộc|phạm vi|đối trừ|khấu trừ|bù trừ|chứng từ/i.test(line) &&
          /không (?:áp dụng|giảm|tính|thu|phải nộp|thuộc|đối trừ|khấu trừ|bù trừ|thể|được|cho phép)|chưa (?:tính|xét)|chỉ (?:giảm|tính|xét)|ngoài phạm vi|chứng từ/i.test(line)
        ) {
          continue;
        }
        if (new RegExp(`(?:thuế\\s+${excluded}|${excluded})[^\\n]{0,40}?(?:phải nộp|nộp thêm|tạm tính|tính ra|là|:|=|phát sinh)?\\s*\\d[\\d.,]*\\s*(?:đồng|triệu|nghìn|%|k\\b)`, 'i').test(line)) {
          return { status: 'DOWNGRADE', reasons: ['Tính thêm loại thuế người dùng không yêu cầu'], repairedText: text };
        }
      }
    }
  }
  const isReliefIntent = frame.tax_intent.primary.value === 'RELIEF_REDUCTION' ||
    frame.tax_intent.secondary.includes('RELIEF_REDUCTION');
  const asksRateOrMethod = !isReliefIntent && (
    frame.tax_intent.primary.value === 'TAX_CALCULATION' ||
    frame.tax_intent.secondary.includes('TAX_CALCULATION') ||
    frame.semantic?.topic === 'TAX_AMOUNT'
  );
  if (focus !== 'vat' && evalResult?.status === 'ANSWERED' && evalResult.effective_revenue_vnd > 3_000_000_000 &&
      frame.tax_period.years[0] >= 2026) {
    if (/0[,.]5\s*%/.test(text)) {
      return { status: 'DOWNGRADE', reasons: ['Áp dụng sai phương pháp 0,5% cho doanh thu trên 3 tỷ'], repairedText: text };
    }
    if (asksRateOrMethod && !text.includes(`${evalResult.pit_rate * 100}%`)) {
      return { status: 'DOWNGRADE', reasons: ['Thiếu thuế suất của phương pháp thu nhập khi được hỏi'], repairedText: text };
    }
  }

  // 1. Kiểm tra cấm trích dẫn Luật Quản lý thuế 38/2019 nếu nói về HĐĐT máy tính tiền năm 2026
  if (
    frame.tax_period.years.includes(2026) &&
    /Luật (?:Quản lý thuế|QLT)\s*38\/2019/i.test(text) &&
    /máy tính tiền|hóa đơn điện tử/i.test(text)
  ) {
    status = 'REPAIR';
    reasons.push('Cần đối chiếu kỳ giao dịch và căn cứ Luật 38/2019 khi giải thích HĐĐT năm 2026');
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
    !['PROJECTED','PARTIAL_PERIOD'].includes(frame.semantic?.revenueContext||'') &&
    (frame.tax_intent.primary.value === 'E_INVOICE' ||
    frame.tax_intent.secondary.includes('E_INVOICE'))
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

  // 6. Kiểm tra biên nghiêm ngặt NQ43 (> 10 tỷ không được giảm 30%)
  if (
    evalResult &&
    evalResult.effective_revenue_vnd > 10_000_000_000 &&
    /(?:được|áp dụng)\s+giảm\s+30\s*%|×\s*70\s*%/i.test(body) &&
    !/không\s+(?:được|thuộc\s+diện|áp\s+dụng)\s+giảm\s+30\s*%/i.test(body)
  ) {
    return {
      status: 'DOWNGRADE',
      reasons: ['Áp dụng sai giảm 30% NQ43 cho doanh thu vượt 10 tỷ đồng'],
      repairedText: text,
    };
  }

  // 7. Kiểm tra bao phủ khi người dùng hỏi cả 2 sắc thuế (GTGT và TNCN)
  if (
    focus === 'both' &&
    asksRateOrMethod &&
    evalResult?.status === 'ANSWERED' &&
    evalResult.effective_revenue_vnd > 1_000_000_000
  ) {
    if (!/\bGTGT\b|giá trị gia tăng/i.test(body) || !/\bTNCN\b|thu nhập cá nhân/i.test(body)) {
      return {
        status: 'DOWNGRADE',
        reasons: ['Thiếu phép tính cho một trong hai sắc thuế GTGT hoặc TNCN khi được hỏi cả hai'],
        repairedText: text,
      };
    }
  }

  // 8. Kiểm tra chuỗi đối trừ thuế đã nộp / đã khấu trừ
  if (
    frame.facts.tax_paid_vnd &&
    frame.facts.tax_paid_vnd > 0 &&
    evalResult?.status === 'ANSWERED' &&
    !/nộp thừa|hoàn thuế|nộp thêm|nộp bổ sung|bù trừ/i.test(text)
  ) {
    status = 'REPAIR';
    reasons.push('Thiếu bước đối trừ số thuế đã nộp/khấu trừ để kết luận nộp thêm hay nộp thừa');
    const paid = frame.facts.tax_paid_vnd;
    const due = evalResult.pit_after_relief_vnd;
    const diff = paid - due;
    if (diff > 0) {
      text += `\n\n*Đối trừ số thuế đã nộp:* Bạn đã nộp ${paid.toLocaleString('vi-VN')} đồng, lớn hơn số thuế TNCN phải nộp sau giảm (${due.toLocaleString('vi-VN')} đồng), nên **nộp thừa ${diff.toLocaleString('vi-VN')} đồng** (được đề nghị hoàn thuế hoặc bù trừ kỳ sau khi có đủ chứng từ hợp lệ).`;
    } else if (diff < 0) {
      text += `\n\n*Đối trừ số thuế đã nộp:* Bạn đã nộp ${paid.toLocaleString('vi-VN')} đồng, nhỏ hơn số thuế TNCN phải nộp sau giảm (${due.toLocaleString('vi-VN')} đồng), nên **còn phải nộp bổ sung ${Math.abs(diff).toLocaleString('vi-VN')} đồng**.`;
    } else {
      text += `\n\n*Đối trừ số thuế đã nộp:* Số thuế đã nộp (${paid.toLocaleString('vi-VN')} đồng) đúng bằng số thuế phải nộp (${due.toLocaleString('vi-VN')} đồng), không phát sinh nộp thêm hay nộp thừa.`;
    }
  }

  return {
    status,
    reasons,
    repairedText: text,
  };
}

/** Validation reports issues; it cannot replace law names, append unverified
 * COD exemptions, or allocate an unidentified payment to PIT. Text edits belong
 * to the grounded repair path and require a fresh independent review. */
export function validateAnswer(answerText:string,frame:TaxDecisionFrame,evalResult?:EvaluationResult,userMessage?:string):ValidationReport{
  return {...inspectAnswer(answerText,frame,evalResult,userMessage),repairedText:answerText};
}
