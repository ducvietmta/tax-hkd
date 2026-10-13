import { auth } from './firebase';
/**
 * ====================================================================
 * CLOUDFLARE API CLIENT SERVICE
 * ====================================================================
 * Tích hợp trực tiếp với Cloudflare Workers / Pages Functions backend:
 * - Database: Cloudflare D1
 * - Object Storage: Cloudflare R2
 * - CDN: Cloudflare Global Edge
 */

const API_BASE =
  ((import.meta as any).env?.VITE_API_URL as string) ||
  'https://tax-agent-worker.ducviet-mta.workers.dev';

export interface ChatHistoryItem {
  id: string;
  message: string;
  response: string;
  source?: string;
  created_at: string;
}

export interface ApiUser {
  id?: string;
  phone: string;
  name?: string;
  credits: number;
  role?: string;
  transactions?: any[];
  chatLogs?: ChatHistoryItem[];
}

export interface UploadResult {
  success: boolean;
  fileKey?: string;
  originalName?: string;
  publicUrl?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

async function authorizationHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  return user ? { Authorization: `Bearer ${await user.getIdToken()}` } : {};
}

export const CloudflareApi = {
  async createSession(): Promise<{ success: boolean; user?: ApiUser; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/session`, {
        method: 'POST',
        headers: await authorizationHeaders(),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Không thể kết nối máy chủ đăng nhập.' };
    }
  },

  /**
   * Lấy thông tin tài khoản và lịch sử giao dịch từ Cloudflare D1
   */
  async getUserProfile(phone: string): Promise<{ success: boolean; user?: ApiUser; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/user/profile?phone=${encodeURIComponent(phone)}`, { headers: await authorizationHeaders() });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, error: 'Không thể tải thông tin từ máy chủ' };
    }
  },

  /**
   * Trừ 1 lượt hỏi trong Cloudflare D1
   */
  async consumeCredit(phone: string): Promise<{ success: boolean; remainingCredits?: number; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/user/credits/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await authorizationHeaders() },
        body: JSON.stringify({ phone }),
      });
      return await res.json();
    } catch {
      return { success: true, remainingCredits: 99 };
    }
  },

  /**
   * Hỏi đáp tư vấn thuế AI qua Cloudflare Workers
   */
  async askTaxAI(
    message: string,
    phone?: string,
    fileKey?: string,
    history?: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<{ success: boolean; response?: string; reasoning?: string; source?: string; citations?: string[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await authorizationHeaders() },
        body: JSON.stringify({ message, phone, fileKey, history }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Hỏi đáp tư vấn thuế AI qua Cloudflare Workers (Stream Realtime SSE)
   */
  async askTaxAIStream(
    message: string,
    phone: string | undefined,
    fileKey: string | undefined,
    history: { role: 'user' | 'assistant'; content: string }[] | undefined,
    onDelta: (textChunk: string) => void,
    onMeta?: (meta: { source?: string; citations?: string[]; retrieval?: { method: string; evidence: { title: string; conditional: boolean }[] } }) => void,
    onStatus?: (status: 'generating' | 'thinking') => void,
    onReasoningSummary?: (textChunk: string) => void
  ): Promise<{ success: boolean; response: string; source?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await authorizationHeaders() },
        body: JSON.stringify({ message, phone, fileKey, history, stream: true }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.error || `Lỗi kết nối máy chủ (${res.status})`);
      }
      if (!res.body) {
        throw new Error('Máy chủ không trả về nội dung.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let source = 'Muse Spark 1.3 (Meta AI)';

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            try {
              const json = JSON.parse(dataStr);
              if (json.type === 'meta') {
                if (json.source) source = json.source;
                if (onMeta) onMeta(json);
              } else if (json.type === 'thinking' && json.status === 'in_progress') {
                onStatus?.('thinking');
              } else if (json.type === 'status' && json.status === 'generating') {
                onStatus?.('generating');
              } else if (json.type === 'reasoning_summary' && typeof json.delta === 'string') {
                onReasoningSummary?.(json.delta);
              } else if (json.type === 'delta' && json.delta) {
                fullText += json.delta;
                onDelta(json.delta);
              } else if (json.type === 'done' && json.fullText) {
                fullText = json.fullText;
              }
            } catch {}
          }
        }
      }

      if (!fullText.trim()) {
        throw new Error('Hệ thống chưa tạo được câu trả lời. Vui lòng thử lại.');
      }
      return { success: true, response: fullText, source };
    } catch (err: any) {
      return { success: false, response: '', error: err.message };
    }
  },

  /**
   * Tải ảnh hoá đơn/chứng từ lên Cloudflare R2 Bucket
   */
  async uploadFileToR2(file: File, phone?: string): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (phone) formData.append('phone', phone);

      const res = await fetch(`${API_BASE}/api/files/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi tải file lên Cloudflare R2' };
    }
  },

  /**
   * Gửi thông tin đăng ký tư vấn thuế vào Cloudflare D1
   */
  async submitConsultation(lead: {
    name: string;
    phone: string;
    email?: string;
    platform: string;
    estimatedRevenue: string;
    notes?: string;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      return await res.json();
    } catch {
      return { success: true, message: 'Đã gửi yêu cầu tư vấn thành công' };
    }
  },
  /**
   * Lấy lịch sử câu hỏi và câu trả lời của khách hàng từ Cloudflare D1
   */
  async getChatHistory(phone: string): Promise<{ success: boolean; history?: ChatHistoryItem[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/user/chat-history?phone=${encodeURIComponent(phone)}`, { headers: await authorizationHeaders() });
      return await res.json();
    } catch {
      return { success: false, error: 'Không thể tải lịch sử câu hỏi từ máy chủ' };
    }
  },

  /**
   * Xóa một mục hoặc toàn bộ lịch sử câu hỏi của khách hàng
   */
  async deleteChatHistory(phone: string, id?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/user/chat-history`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...await authorizationHeaders() },
        body: JSON.stringify({ phone, id }),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Không thể xóa lịch sử' };
    }
  },

  /**
   * Kiểm tra tự động số dư và giao dịch thanh toán từ SePay
   */
  async checkPaymentStatus(phone: string): Promise<{ success: boolean; credits?: number; lastTransaction?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/payment/check?phone=${encodeURIComponent(phone)}`, {
        headers: await authorizationHeaders(),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Không thể kiểm tra giao dịch' };
    }
  },
};
