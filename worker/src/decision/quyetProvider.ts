/**
 * QUYET-1.0-LARGE DECISION MODEL PROVIDER (FPT CLOUD AI MARKETPLACE)
 *
 * Tích hợp Decision Model Quyết V1.0 Large (Gemma-4-31B-it calibrated decision model)
 * làm bộ phân loại ngữ nghĩa L2 (S-Layer) khi L1 deterministic có độ tự tin thấp.
 *
 * Nguyên tắc:
 * - Dùng prompt dạng trắc nghiệm (Multiple-Choice) để đạt tốc độ tối đa (~300-450ms).
 * - Có timeout 1.500ms để bảo vệ SLA cạnh (Cloudflare Edge).
 * - Tuyệt đối không sinh text kết luận thuế; chỉ trả về Enum nhãn Lớp S.
 */

import type { DecisionModelProvider } from './types';
import type { TaxpayerType, TaxIntent, IncomeType } from './labels';

export class QuyetDecisionProvider implements DecisionModelProvider {
  name = 'Quyet-1.0-Large';
  private apiKey: string;
  private endpoint: string;
  private timeoutMs: number;

  constructor(apiKey: string, endpoint = 'https://mkp-api.fptcloud.com/v1/chat/completions', timeoutMs = 1500) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.timeoutMs = timeoutMs;
  }

  private async callModel(prompt: string, maxTokens = 40): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'Quyet-1.0-Large',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.0,
        }),
        signal: controller.signal,
      });

      if (!res.ok) return null;
      const data: any = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async classifyTaxpayer(text: string): Promise<{ taxpayer: TaxpayerType; confidence: number }> {
    const prompt = `Xác định đối tượng nộp thuế trong câu sau:
"${text}"
A. Hộ kinh doanh
B. Cá nhân kinh doanh
C. Cá nhân làm công ăn lương
D. Doanh nghiệp
E. Không xác định
Chọn đáp án đúng (chỉ ghi chữ cái A, B, C, D hoặc E):`;

    const answer = await this.callModel(prompt, 10);
    if (!answer) return { taxpayer: 'UNKNOWN', confidence: 0.5 };

    if (answer.startsWith('A')) return { taxpayer: 'HOUSEHOLD_BUSINESS', confidence: 0.9 };
    if (answer.startsWith('B')) return { taxpayer: 'INDIVIDUAL_BUSINESS', confidence: 0.85 };
    if (answer.startsWith('C')) return { taxpayer: 'INDIVIDUAL_EMPLOYEE', confidence: 0.9 };
    if (answer.startsWith('D')) return { taxpayer: 'ENTERPRISE', confidence: 0.9 };
    return { taxpayer: 'UNKNOWN', confidence: 0.5 };
  }

  async classifyIntent(text: string): Promise<{ intent: TaxIntent; confidence: number }> {
    const prompt = `Mục đích thuế chính của câu sau là gì:
"${text}"
A. Tính số thuế phải nộp hoặc hỏi thuế suất
B. Đăng ký kinh doanh hoặc mã số thuế 888
C. Hóa đơn điện tử hoặc máy tính tiền
D. Kê khai và nộp tờ khai thuế
E. Giảm thuế hoặc miễn thuế
F. Khác / Xử phạt
Chọn đáp án đúng (chỉ ghi chữ cái):`;

    const answer = await this.callModel(prompt, 10);
    if (!answer) return { intent: 'TAX_CALCULATION', confidence: 0.5 };

    if (answer.startsWith('A')) return { intent: 'TAX_CALCULATION', confidence: 0.9 };
    if (answer.startsWith('B')) return { intent: 'REGISTRATION', confidence: 0.9 };
    if (answer.startsWith('C')) return { intent: 'E_INVOICE', confidence: 0.9 };
    if (answer.startsWith('D')) return { intent: 'DECLARATION_FILING', confidence: 0.85 };
    if (answer.startsWith('E')) return { intent: 'RELIEF_REDUCTION', confidence: 0.9 };
    if (answer.startsWith('F')) return { intent: 'PENALTY', confidence: 0.8 };
    return { intent: 'TAX_CALCULATION', confidence: 0.6 };
  }

  async classifyIncome(text: string): Promise<{ income: IncomeType; confidence: number }> {
    const prompt = `Loại thu nhập chính trong câu sau là gì:
"${text}"
A. Bán hàng hóa, tạp hóa, thương mại
B. Dịch vụ ăn uống (quán ăn, phở, cà phê)
C. Bán hàng trên sàn TMĐT (Shopee, TikTok Shop)
D. Hoa hồng tiếp thị liên kết (Affiliate)
E. Cho thuê tài sản (nhà, đất, xe)
F. Dịch vụ tự do (Freelancer, sửa chữa, lập trình)
G. Thu nhập khác
Chọn đáp án đúng (chỉ ghi chữ cái):`;

    const answer = await this.callModel(prompt, 10);
    if (!answer) return { income: 'UNKNOWN', confidence: 0.5 };

    if (answer.startsWith('A')) return { income: 'GOODS_SALES', confidence: 0.9 };
    if (answer.startsWith('B')) return { income: 'FOOD_SERVICE', confidence: 0.9 };
    if (answer.startsWith('C')) return { income: 'MARKETPLACE_SALES', confidence: 0.9 };
    if (answer.startsWith('D')) return { income: 'AFFILIATE_COMMISSION', confidence: 0.9 };
    if (answer.startsWith('E')) return { income: 'PROPERTY_RENTAL', confidence: 0.9 };
    if (answer.startsWith('F')) return { income: 'FREELANCE_SERVICE', confidence: 0.85 };
    return { income: 'OTHER', confidence: 0.6 };
  }
}
