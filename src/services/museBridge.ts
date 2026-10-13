import { checkQuestion, refusalText } from './guard';

export interface MuseResponse {
  success: boolean;
  target?: string;
  text?: string;
  source?: string;
  error?: string;
}

export interface BridgeStatus {
  connected: boolean;
  port?: number;
  tools?: any[];
  error?: string;
}

export interface ParsedTaxResponse {
  answer: string;
  legalBasis: string;
}

export { isTaxRelatedQuery } from './guard';

/**
 * Tự động bóc tách câu trả lời từ AI thành 2 khối riêng biệt:
 * 1. Nội dung giải đáp
 * 2. Căn cứ pháp lý
 */
export function parseTaxResponse(rawText: string): ParsedTaxResponse {
  if (!rawText) return { answer: '', legalBasis: '' };

  // Dọn dẹp nếu mô hình vô tình lặp lại dòng prompt chỉ dẫn
  const cleaned = rawText
    .replace(/(?:---|Yêu cầu định dạng câu trả lời:?|\[QUY TẮC PHẠM VI.*?\])[\s\S]*?(?:BẮT BUỘC.*?:\s*)/gi, '')
    .trim();

  // Kiểm tra nếu câu trả lời thông báo nằm ngoài phạm vi hỗ trợ
  const isOutOfScope = /nằm ngoài phạm vi hỗ trợ|nằm ngoài hỗ trợ/i.test(cleaned);

  // Tìm vị trí của tiêu đề Căn cứ pháp lý / Cơ sở pháp lý
  const regex = /(?:^|\n)\s*(?:#+\s*)?(?:\*{1,3})?(?:Căn cứ pháp lý|Cơ sở pháp lý|Căn cứ pháp luật|Văn bản pháp luật áp dụng|Căn cứ)(?:\*{1,3})?:?\s*/i;
  const matchIndex = cleaned.search(regex);

  if (matchIndex !== -1) {
    const answer = cleaned.slice(0, matchIndex).trim();
    const rest = cleaned.slice(matchIndex);
    const legalBasis = rest.replace(regex, '').trim();

    return {
      answer: answer || cleaned.trim(),
      legalBasis: isOutOfScope ? 'Không áp dụng' : legalBasis,
    };
  }

  // Nếu câu trả lời nằm ngoài hỗ trợ nhưng không có header Căn cứ pháp lý
  if (isOutOfScope) {
    return {
      answer: cleaned.trim(),
      legalBasis: 'Không áp dụng (Câu hỏi không thuộc phạm vi tư vấn thuế HKD & CNKD)',
    };
  }

  // Phương án dự phòng: nếu mô hình không in tiêu đề, quét các dòng chứa tên văn bản luật
  const lines = cleaned.split('\n');
  const legalLines: string[] = [];
  const answerLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(?:-|\*|\d+\.)?\s*(?:Thông tư|Nghị định|Luật|Điều\s+\d+|Khoản\s+\d+)/i.test(trimmed)) {
      legalLines.push(trimmed);
    } else {
      answerLines.push(line);
    }
  }

  if (legalLines.length > 0 && answerLines.length > 0) {
    return {
      answer: answerLines.join('\n').trim(),
      legalBasis: legalLines.join('\n').trim(),
    };
  }

  return {
    answer: cleaned.trim(),
    legalBasis: '',
  };
}

/**
 * Kiểm tra trạng thái AI Chat Bridge trên port 8788
 */
export async function checkBridgeStatus(): Promise<BridgeStatus> {
  try {
    const res = await fetch('/api/bridge-status');
    if (!res.ok) return { connected: false };
    return await res.json();
  } catch {
    return { connected: false };
  }
}

/**
 * Gửi câu hỏi đến AI qua AI Chat Bridge (tự động ghép chỉ dẫn cấu trúc và phạm vi)
 */
export async function queryMuseAI(question: string, _target?: string): Promise<MuseResponse> {
  try {
    // Chặn sớm ở client (tiết kiệm lượt gọi); server vẫn kiểm tra lại bắt buộc
    const check = checkQuestion(question);
    if (!check.ok) {
      return { success: true, text: refusalText(check.message), source: 'guard' };
    }

    const res = await fetch('/api/bridge-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: check.clean }),
    });

    if (!res.ok) {
      return { success: false, error: `Lỗi kết nối máy chủ (${res.status})` };
    }

    const data: MuseResponse = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Không thể kết nối đến AI Chat Bridge' };
  }
}
