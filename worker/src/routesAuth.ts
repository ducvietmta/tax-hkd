/**
 * Auth + user/credits routes. Server là nguồn duy nhất cho role/credits.
 */

import { verifiedFirebasePhone } from './firebaseAuth';
import { jsonResponse, type Env } from './http';

const GUIDE_PRICE = 10;
// Legacy full-price receipts remain valid; free/fractional and arbitrary-note
// transactions must never become entitlements on the next session refresh.
const VALID_GUIDE_RECEIPT = `status = 'completed' AND amount = 0 AND credits = -10
  AND payment_method IN ('guide_purchase_v1', 'credits_consume')
  AND notes IN ('unlock_guide_household', 'unlock_guide_individual')`;

async function unlockedGuidesFor(db: D1Database, phone: string): Promise<string[]> {
  const rows = await db.prepare(
    `SELECT DISTINCT notes FROM transactions WHERE user_phone = ? AND ${VALID_GUIDE_RECEIPT}`
  ).bind(phone).all<{ notes: string }>();
  return rows.results.map(row => row.notes.slice('unlock_guide_'.length));
}

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

    let unlockedGuides: string[] = [];
    if (env.DB) {
      unlockedGuides = await unlockedGuidesFor(env.DB, phone);
    }
    userRecord = { ...(userRecord as object), unlockedGuides };
  } else {
    userRecord = {
      phone,
      name: isVip ? 'Tài khoản VIP Quản trị' : `Khách hàng ${phone.slice(-4)}`,
      credits: isVip ? vipCredits : 3,
      role: isVip ? 'vip' : 'user',
      unlockedGuides: isVip ? ['household', 'individual'] : [],
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
  let unlockedGuides: string[] = [];

  if (env.DB) {
    userRecord = await env.DB.prepare(`SELECT * FROM users WHERE phone = ?`).bind(phone).first();
    const txRes = await env.DB.prepare(
      `SELECT * FROM transactions WHERE user_phone = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(phone).all();
    txList = txRes.results || [];

    unlockedGuides = await unlockedGuidesFor(env.DB, phone);

    const chatRes = await env.DB.prepare(
      `SELECT id, message, response, source, created_at FROM chat_logs WHERE user_phone = ? ORDER BY created_at DESC LIMIT 30`
    ).bind(phone).all();
    chatList = chatRes.results || [];
  }

  if (!userRecord) {
    return jsonResponse({ success: false, error: 'Không tìm thấy tài khoản.' }, 404, corsHeaders);
  }

  return jsonResponse(
    { success: true, user: { ...(userRecord as object), transactions: txList, chatLogs: chatList, unlockedGuides } },
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
  const body = await request.json().catch(() => null) as { phone?: unknown; amount?: unknown; notes?: unknown } | null;
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  if (!phone) return jsonResponse({ success: false, error: 'Sign-in required.' }, 401, corsHeaders);
  const note = body?.notes;
  // The old endpoint is now a product purchase, never a client-priced debit.
  // Keep the existing client wire format, but accept only known products/prices.
  if ((note !== 'unlock_guide_household' && note !== 'unlock_guide_individual') ||
      (body?.amount !== undefined && body.amount !== GUIDE_PRICE)) {
    return jsonResponse({ success: false, error: 'Invalid guide or price.' }, 400, corsHeaders);
  }
  if (!env.DB) return jsonResponse({ success: false, error: 'Purchase service unavailable.' }, 503, corsHeaders);

  const txId = `guide_${crypto.randomUUID()}`;
  try {
    // D1 batch is a transaction: admission, full debit and receipt completion
    // cannot interleave with another purchase/chat or partially commit on error.
    // The pending receipt is created only when the balance covers the full price.
    const results = await env.DB.batch([
      env.DB.prepare(`INSERT INTO transactions(id, user_phone, amount, credits, payment_method, status, notes)
        SELECT ?, phone, 0, ?, 'guide_purchase_v1', 'pending', ? FROM users
        WHERE phone = ? AND credits >= ? AND NOT EXISTS (
          SELECT 1 FROM transactions WHERE user_phone = ? AND notes = ? AND ${VALID_GUIDE_RECEIPT}
        )`).bind(txId, -GUIDE_PRICE, note, phone, GUIDE_PRICE, phone, note),
      env.DB.prepare(`UPDATE users SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP
        WHERE phone = ? AND credits >= ? AND EXISTS (
          SELECT 1 FROM transactions WHERE id = ? AND user_phone = ? AND status = 'pending'
        )`).bind(GUIDE_PRICE, phone, GUIDE_PRICE, txId, phone),
      env.DB.prepare(`UPDATE transactions SET status = 'completed' WHERE id = ? AND status = 'pending'`).bind(txId),
      env.DB.prepare(`SELECT credits, EXISTS (
        SELECT 1 FROM transactions WHERE user_phone = ? AND notes = ? AND ${VALID_GUIDE_RECEIPT}
      ) AS unlocked FROM users WHERE phone = ?`).bind(phone, note, phone),
    ]);
    const result = results[3] as { results: Array<{ credits: number; unlocked: number }> };
    const user = result.results[0];
    if (!user) return jsonResponse({ success: false, error: 'Account not found.' }, 404, corsHeaders);
    if (!user.unlocked) return jsonResponse({ success: false, error: 'INSUFFICIENT_CREDITS' }, 403, corsHeaders);
    return jsonResponse({ success: true, remainingCredits: user.credits }, 200, corsHeaders);
  } catch {
    return jsonResponse({ success: false, error: 'Purchase could not be completed.' }, 503, corsHeaders);
  }
}

export function handleDepositReject(corsHeaders: Headers): Response {
  return jsonResponse({ success: false, error: 'Lượt hỏi chỉ được cộng sau khi xác nhận giao dịch ngân hàng.' }, 403, corsHeaders);
}
