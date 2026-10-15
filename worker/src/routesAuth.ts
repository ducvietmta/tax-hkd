/**
 * Auth + user/credits routes. Server là nguồn duy nhất cho role/credits.
 */

import { verifiedFirebasePhone } from './firebaseAuth';
import { jsonResponse, type Env } from './http';

/** Guard chung cho /api/user/*: chỉ Firebase ID token hợp lệ mới qua. */
export async function guardUserRoute(request: Request, url: URL, corsHeaders: Headers): Promise<string | Response> {
  const verifiedPhone = await verifiedFirebasePhone(request);
  if (!verifiedPhone) return jsonResponse({ success: false, error: 'Firebase sign-in required.' }, 401, corsHeaders);
  const requestedPhone = request.method === 'GET'
    ? url.searchParams.get('phone')
    : ((await request.clone().json().catch(() => ({}))) as { phone?: string }).phone;
  if (requestedPhone !== verifiedPhone) return jsonResponse({ success: false, error: 'Access denied.' }, 403, corsHeaders);
  return verifiedPhone;
}

export async function handleAuthSession(request: Request, env: Env, corsHeaders: Headers): Promise<Response> {
  const phone = await verifiedFirebasePhone(request);
  if (!phone) {
    return jsonResponse({ success: false, error: 'Invalid Firebase session.' }, 401, corsHeaders);
  }

  const vipPhone = env.VIP_PHONE || '';
  const isVip = !!vipPhone && phone === vipPhone;
  const vipCredits = parseInt(env.VIP_CREDITS || '1000', 10);

  let userRecord: unknown = null;

  if (env.DB) {
    userRecord = await env.DB.prepare(`SELECT * FROM users WHERE phone = ?`).bind(phone).first();

    if (!userRecord) {
      const initialCredits = isVip ? vipCredits : 3;
      const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const role = isVip ? 'vip' : 'user';
      const name = isVip ? 'Tài khoản VIP Quản trị' : `Khách hàng ${phone.slice(-4)}`;

      await env.DB.prepare(
        `INSERT INTO users (id, phone, name, credits, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      ).bind(newId, phone, name, initialCredits, role).run();

      await env.DB.prepare(
        `INSERT INTO transactions (id, user_phone, amount, credits, payment_method, status, notes)
         VALUES (?, ?, 0, ?, 'system_welcome', 'completed', ?)`
      ).bind(
        `tx_${Date.now()}`,
        phone,
        initialCredits,
        isVip ? 'Cấp 1.000 lượt hỏi VIP' : 'Tặng 3 lượt hỏi miễn phí khi đăng ký'
      ).run();

      userRecord = { id: newId, phone, name, credits: initialCredits, role };
    } else if (isVip && (userRecord as { credits: number }).credits < vipCredits) {
      await env.DB.prepare(`UPDATE users SET credits = ? WHERE phone = ?`).bind(vipCredits, phone).run();
      (userRecord as { credits: number }).credits = vipCredits;
    }
  } else {
    userRecord = {
      phone,
      name: isVip ? 'Tài khoản VIP Quản trị' : `Khách hàng ${phone.slice(-4)}`,
      credits: isVip ? vipCredits : 3,
      role: isVip ? 'vip' : 'user',
    };
  }

  return jsonResponse({ success: true, user: userRecord }, 200, corsHeaders);
}

export async function handleUserProfile(env: Env, corsHeaders: Headers, url: URL): Promise<Response> {
  const phone = url.searchParams.get('phone');
  if (!phone) {
    return jsonResponse({ success: false, error: 'Thiếu tham số phone.' }, 400, corsHeaders);
  }

  let userRecord: unknown = null;
  let txList: unknown[] = [];
  let chatList: unknown[] = [];

  if (env.DB) {
    userRecord = await env.DB.prepare(`SELECT * FROM users WHERE phone = ?`).bind(phone).first();
    const txRes = await env.DB.prepare(
      `SELECT * FROM transactions WHERE user_phone = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(phone).all();
    txList = txRes.results || [];

    const chatRes = await env.DB.prepare(
      `SELECT id, message, response, source, created_at FROM chat_logs WHERE user_phone = ? ORDER BY created_at DESC LIMIT 30`
    ).bind(phone).all();
    chatList = chatRes.results || [];
  }

  if (!userRecord) {
    return jsonResponse({ success: false, error: 'Không tìm thấy tài khoản.' }, 404, corsHeaders);
  }

  return jsonResponse(
    { success: true, user: { ...(userRecord as object), transactions: txList, chatLogs: chatList } },
    200, corsHeaders
  );
}

export async function handleChatHistory(request: Request, env: Env, corsHeaders: Headers, url: URL): Promise<Response> {
  if (request.method === 'GET') {
    const phone = url.searchParams.get('phone');
    if (!phone) {
      return jsonResponse({ success: false, error: 'Thiếu tham số phone.' }, 400, corsHeaders);
    }
    let historyList: unknown[] = [];
    if (env.DB) {
      const chatRes = await env.DB.prepare(
        `SELECT id, message, response, source, created_at FROM chat_logs WHERE user_phone = ? ORDER BY created_at DESC LIMIT 50`
      ).bind(phone).all();
      historyList = chatRes.results || [];
    }
    return jsonResponse({ success: true, history: historyList }, 200, corsHeaders);
  }

  if (request.method === 'DELETE') {
    const body: { phone?: string; id?: string } = await request.json().catch(() => ({}));
    const phone = (body.phone || url.searchParams.get('phone') || '').trim();
    const id = body.id || url.searchParams.get('id');
    if (!phone) {
      return jsonResponse({ success: false, error: 'Thiếu tham số phone.' }, 400, corsHeaders);
    }
    if (env.DB) {
      if (id) {
        await env.DB.prepare(`DELETE FROM chat_logs WHERE id = ? AND user_phone = ?`).bind(id, phone).run();
      } else {
        await env.DB.prepare(`DELETE FROM chat_logs WHERE user_phone = ?`).bind(phone).run();
      }
    }
    return jsonResponse({ success: true, message: 'Đã xóa lịch sử câu hỏi.' }, 200, corsHeaders);
  }

  return jsonResponse({ success: false, error: 'Method not allowed.' }, 405, corsHeaders);
}

export async function handleConsumeCredit(request: Request, env: Env, corsHeaders: Headers): Promise<Response> {
  const body: { phone?: string } = await request.json();
  const phone = (body.phone || '').trim();

  if (!phone) {
    return jsonResponse({ success: false, error: 'Vui lòng đăng nhập trước khi hỏi.' }, 401, corsHeaders);
  }

  if (env.DB) {
    const user = await env.DB.prepare(`SELECT credits FROM users WHERE phone = ?`).bind(phone).first<{ credits: number }>();
    if (!user) {
      return jsonResponse({ success: false, error: 'Tài khoản không tồn tại.' }, 404, corsHeaders);
    }
    if (user.credits <= 0) {
      return jsonResponse({ success: false, error: 'Bạn đã hết lượt hỏi. Vui lòng nạp thêm.' }, 403, corsHeaders);
    }

    await env.DB.prepare(
      `UPDATE users SET credits = credits - 1, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`
    ).bind(phone).run();

    return jsonResponse({ success: true, remainingCredits: user.credits - 1 }, 200, corsHeaders);
  }

  return jsonResponse({ success: true, remainingCredits: 99 }, 200, corsHeaders);
}

export function handleDepositReject(corsHeaders: Headers): Response {
  return jsonResponse({ success: false, error: 'Lượt hỏi chỉ được cộng sau khi xác nhận giao dịch ngân hàng.' }, 403, corsHeaders);
}
