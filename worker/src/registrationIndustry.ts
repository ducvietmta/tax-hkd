import { jsonResponse, type Env } from './http';
import { RegistrationIndustryProvider } from './registrationIndustryProvider';
import { INDUSTRY_CLARIFICATIONS } from '../../shared/registrationIndustry';

/** Anonymous, narrowly scoped catalogue lookup; independent of paid tax chat. */
export async function handleRegistrationIndustry(request: Request, env: Env, cors: Headers): Promise<Response> {
  const headers = new Headers(cors); headers.set('Cache-Control', 'no-store');
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, headers);
  if (!request.headers.get('Content-Type')?.includes('application/json')) return jsonResponse({ error: 'Cần gửi JSON.' }, 415, headers);
  let body: any;
  const reader = request.body?.getReader();
  if (!reader) return jsonResponse({ error: 'Thiếu mô tả hoạt động.' }, 400, headers);
  try {
    let size = 0, text = ''; const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength; if (size > 16000) throw new Error('BODY_LIMIT');
      text += decoder.decode(value, { stream: true });
    }
    body = JSON.parse(text + decoder.decode());
  } catch { return jsonResponse({ error: 'Mô tả không hợp lệ hoặc quá dài.' }, 400, headers); }
  finally { try { await reader.cancel(); } catch {} reader.releaseLock(); }
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).some(key => !['activity', 'clarifications', 'clarificationReasons'].includes(key))
    || typeof body.activity !== 'string' || !body.activity.trim() || body.activity.length > 1200
    || !Array.isArray(body.clarifications) || body.clarifications.length > 3
    || body.clarifications.some((v: unknown) => typeof v !== 'string' || !v.trim() || v.length > 1200)
    || (body.clarificationReasons!==undefined && (!Array.isArray(body.clarificationReasons)
      || body.clarificationReasons.length!==body.clarifications.length
      || body.clarificationReasons.some((v:unknown)=>typeof v!=='string'||!Object.hasOwn(INDUSTRY_CLARIFICATIONS,v))))) {
    return jsonResponse({ error: 'Chỉ gửi mô tả hoạt động và tối đa 3 câu làm rõ, mỗi câu tối đa 1.200 ký tự.' }, 400, headers);
  }
  const key = env.MUSE_API_KEY;
  if (!key || !env.DB) return jsonResponse({ error: 'Chưa gợi ý được mã. Bạn có thể tra danh mục hoặc thử lại.' }, 503, headers);
  // Atomic admission: <=12 attempts/IP/hour and <=500/day across this endpoint.
  // No activity or personal form values are stored in the rate-limit table.
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return jsonResponse({ error: 'Không xác định được phiên truy cập.' }, 429, headers);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  const ipHash = Array.from(new Uint8Array(digest), v => v.toString(16).padStart(2, '0')).join('');
  try {
    const reservation = await env.DB.prepare(`INSERT INTO registration_industry_limits (scope)
      SELECT ? WHERE (SELECT COUNT(*) FROM registration_industry_limits WHERE scope = ? AND created_at > datetime('now', '-1 hour')) < 12
      AND (SELECT COUNT(*) FROM registration_industry_limits WHERE created_at >= date('now')) < 500 RETURNING id`)
      .bind(`registration-industry:${ipHash}`, `registration-industry:${ipHash}`).first();
    if (!reservation) return jsonResponse({ error: 'Đã hết lượt gợi ý tạm thời. Bạn vẫn có thể chọn từ danh mục.' }, 429, headers);
  } catch { return jsonResponse({ error: 'Gợi ý tạm thời chưa sẵn sàng. Bạn vẫn có thể tra danh mục.' }, 503, headers); }
  const provider = new RegistrationIndustryProvider(key);
  const result = await provider.suggestRegistrationIndustry(body.activity.trim(), body.clarifications.map((s: string) => s.trim()),body.clarificationReasons||[]);
  return result ? jsonResponse(result, 200, headers)
    : jsonResponse({ error: 'AI chưa chọn được mã lúc này. Thử lại hoặc tìm trong danh mục bên dưới.',code:provider.failureCode }, 503, headers);
}
