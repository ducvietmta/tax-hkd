import { auth } from './firebase';
import { CHAT_PROGRESS_LABELS, type ChatProgress } from '../../shared/chatProgress';
import type { RegistrationPanelContext } from '../../shared/registrationAdvisor';
/**
 * ====================================================================
 * CLOUDFLARE API CLIENT SERVICE
 * ====================================================================
 * Tích hợp trực tiếp với Cloudflare Workers / Pages Functions backend:
 * - Database: Cloudflare D1
 * - Object Storage: Cloudflare R2
 * - CDN: Cloudflare Global Edge
 */

/**
 * Ưu tiên cùng origin (`/api/*` qua Pages Functions proxy tới Worker) để
 * tránh CORS 2 cấu hình. Đặt VITE_API_URL chỉ khi muốn trỏ thẳng Worker
 * (local/preview ngoài Pages).
 */
const API_BASE = ((import.meta as any).env?.VITE_API_URL as string) || '';

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
  unlockedGuides?: string[];
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
   * Trừ lượt hỏi trong Cloudflare D1
   */
  async consumeCredit(phone: string, amount: number = 1, notes?: string): Promise<{ success: boolean; remainingCredits?: number; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/user/credits/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await authorizationHeaders() },
        body: JSON.stringify({ phone, amount, notes }),
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
    onMeta?: (meta: { source?: string; citations?: string[]; retrieval?: { method: string; evidence: { title: string; conditional: boolean }[] }; remainingCredits?: number }) => void,
    onStatus?: (status: 'generating' | 'thinking') => void,
    onReasoningSummary?: (textChunk: string) => void,
    onProgress?: (progress: ChatProgress) => void,
    workflow?: 'tax_registration',
    panelContext?: RegistrationPanelContext,
    signal?: AbortSignal,
  ): Promise<{ success: boolean; response: string; source?: string; error?: string; requireLogin?: boolean; requireDeposit?: boolean; remainingCredits?: number }> {
    let remainingCredits: number | undefined;
    try {
      const requestStarted = Date.now();
      onProgress?.({ stage: 'connecting' });
      // Only the SSE transport is shared. Registration has its own server route,
      // source pack, conversation and one-call model path, independent of tax QA.
      const endpoint = workflow === 'tax_registration' ? '/api/registration-guide/chat' : '/api/chat';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...await authorizationHeaders() },
        body: JSON.stringify({ message, phone, fileKey, history, stream: true, ...(workflow === 'tax_registration' ? { panelContext } : {}) }),
        signal,
      });

      console.debug('[CHAT_STREAM_CONNECTED] ' + JSON.stringify({ elapsedMs: Date.now() - requestStarted, serverTiming: res.headers.get('Server-Timing') }));
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        return {
          success: false,
          response: '',
          error: errorBody?.error || `Lỗi kết nối máy chủ (${res.status})`,
          requireLogin: !!errorBody?.requireLogin,
          requireDeposit: !!errorBody?.requireDeposit,
          remainingCredits: typeof errorBody?.remainingCredits === 'number' ? errorBody.remainingCredits : undefined,
        };
      }
      if (!res.body) {
        throw new Error('Máy chủ không trả về nội dung.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let source = 'Muse Spark 1.3 (Meta AI)';
      let firstRegistrationDelta = false;
      let completed = false;
      let terminal = false;
      let eventData: string[] = [];
      let buffer = '';
      const dispatchEvent = () => {
        if (!eventData.length || terminal) return;
        const data = eventData.join('\n').trim();
        eventData = [];
        if (data === '[DONE]') {
          terminal = true;
          return;
        }
        let json;
        try { json = JSON.parse(data); }
        catch { throw new Error('Dữ liệu trả lời bị gián đoạn hoặc không hợp lệ. Vui lòng thử lại.'); }
        if (json.type === 'error') throw new Error(json.error || json.message || 'Dịch vụ trả lời gặp lỗi.');
        if (completed) return;
        if (json.type === 'progress' && typeof json.stage === 'string' && Object.hasOwn(CHAT_PROGRESS_LABELS, json.stage)) {
          console.debug('[CHAT_PROGRESS] ' + JSON.stringify({ stage: json.stage, elapsedMs: Date.now() - requestStarted }));
          onProgress?.({ stage: json.stage as ChatProgress['stage'] });
        } else if (json.type === 'meta') {
          if (json.source) source = json.source;
          if (typeof json.remainingCredits === 'number') remainingCredits = json.remainingCredits;
          onMeta?.(json);
        } else if (json.type === 'thinking' && json.status === 'in_progress') {
          onStatus?.('thinking');
        } else if (json.type === 'status' && json.status === 'generating') {
          onStatus?.('generating');
        } else if (json.type === 'reasoning_summary' && typeof json.delta === 'string') {
          onReasoningSummary?.(json.delta);
        } else if (json.type === 'delta' && typeof json.delta === 'string') {
          if (workflow === 'tax_registration' && !firstRegistrationDelta && json.delta) {
            firstRegistrationDelta = true;
            console.debug('[REGISTRATION_FIRST_TEXT] ' + JSON.stringify({ elapsedMs: Date.now() - requestStarted }));
          }
          fullText += json.delta;
          onDelta(json.delta);
        } else if (json.type === 'done') {
          if (typeof json.fullText !== 'string' || !json.fullText.trim()) {
            throw new Error('Máy chủ chưa trả về đáp án hoàn chỉnh. Vui lòng thử lại.');
          }
          fullText = json.fullText;
          completed = true;
          if (workflow === 'tax_registration') console.debug('[REGISTRATION_DONE] ' + JSON.stringify({ elapsedMs: Date.now() - requestStarted }));
          if (typeof json.remainingCredits === 'number') remainingCredits = json.remainingCredits;
        }
      };
      const acceptLine = (rawLine: string) => {
        const line = rawLine.replace(/\r$/, '');
        if (!line) dispatchEvent();
        else if (line.startsWith('data:')) eventData.push(line.slice(5).replace(/^ /, ''));
      };
      try {
        while (!terminal) {
          const { done, value } = await reader.read();
          buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) acceptLine(line);
          if (done) {
            if (buffer) acceptLine(buffer);
            dispatchEvent();
            break;
          }
        }
      } finally {
        // [DONE] may arrive before the connection closes. Stop reading it;
        // malformed/truncated responses must also release their stream.
        try { await reader.cancel(); } catch {}
        reader.releaseLock();
      }
      if (!completed) {
        throw new Error('Câu trả lời bị gián đoạn trước khi hoàn tất. Vui lòng thử lại.');
      }
      return { success: true, response: fullText, source, remainingCredits };
    } catch (err: any) {
      return { success: false, response: '', error: err.message, remainingCredits };
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
