/**
 * SePay webhook + kiểm tra trạng thái giao dịch.
 * Tách từ index.ts để router mỏng.
 */

import { verifiedFirebasePhone } from './firebaseAuth';
import { jsonResponse, type Env } from './http';

export async function handleSePayWebhook(request: Request, env: Env, corsHeaders: Headers): Promise<Response> {
  const webhookKey = env.SEPAY_API_KEY;
  if (!webhookKey || request.headers.get('Authorization') !== `Apikey ${webhookKey}`) {
    return jsonResponse({ success: false, error: 'Invalid payment webhook credentials.' }, 401, corsHeaders);
  }
  let body: Record<string, unknown> | null = null;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Dữ liệu JSON không hợp lệ' }, 400, corsHeaders);
  }
  if (!body) return jsonResponse({ success: false, error: 'Dữ liệu JSON không hợp lệ' }, 400, corsHeaders);

  const transferType = String(body.transferType || body.type || 'in').toLowerCase();
  const transferAmount = Number(body.transferAmount || body.amount || 0);
  const content = String(body.content || body.description || '');
  const sepayId = String(body.id || body.referenceCode || Date.now());
  const accountNumber = String(body.accountNumber || '').replace(/\D/g, '');

  if (!/^\d+$/.test(sepayId) || accountNumber !== '9594180624') {
    return jsonResponse({ success: false, error: 'Payment account or transaction ID does not match.' }, 400, corsHeaders);
  }

  if (transferType !== 'in' || transferAmount <= 0) {
    return jsonResponse({ success: true, message: 'Bỏ qua giao dịch không phải tiền vào' }, 200, corsHeaders);
  }

  const fullText = `${content} ${body.code || ''}`;
  const phoneMatch = fullText.match(/TAX\s*([0-9]{10})/i) ||
                     fullText.match(/(0[35789][0-9]{8})/);

  const targetPhone = phoneMatch ? phoneMatch[1] : null;

  if (!targetPhone) {
    console.warn('SePay webhook: Không tìm thấy số điện thoại hợp lệ trong nội dung:', content);
    return jsonResponse({
      success: false,
      error: 'Không trích xuất được số điện thoại khách hàng',
      content
    }, 200, corsHeaders);
  }

  let creditsToAdd = 0;
  let packageName = 'Gói Tuỳ Chỉnh';

  if (transferAmount >= 249000) {
    creditsToAdd = 100;
    packageName = 'Gói Doanh Nhân (+100 lượt)';
  } else if (transferAmount >= 99000) {
    creditsToAdd = 30;
    packageName = 'Gói Chuyên Nghiệp (+30 lượt)';
  } else if (transferAmount >= 49000) {
    creditsToAdd = 10;
    packageName = 'Gói Cơ Bản (+10 lượt)';
  } else {
    creditsToAdd = Math.max(1, Math.floor(transferAmount / 5000));
    packageName = `Gói linh hoạt (+${creditsToAdd} lượt)`;
  }

  if (env.DB) {
    const txId = `sepay_${sepayId}`;

    const existingTx = await env.DB.prepare(`SELECT id FROM transactions WHERE id = ?`).bind(txId).first();
    if (existingTx) {
      return jsonResponse({
        success: true,
        message: 'Giao dịch đã được ghi nhận trước đó',
        transactionId: txId
      }, 200, corsHeaders);
    }

    const existingUser = await env.DB.prepare(`SELECT * FROM users WHERE phone = ?`).bind(targetPhone).first();

    if (existingUser) {
      await env.DB.prepare(
        `UPDATE users SET credits = credits + ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`
      ).bind(creditsToAdd, targetPhone).run();
    } else {
      const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await env.DB.prepare(
        `INSERT INTO users (id, phone, name, credits, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      ).bind(newId, targetPhone, `Khách hàng ${targetPhone.slice(-4)}`, creditsToAdd + 3).run();
    }

    await env.DB.prepare(
      `INSERT INTO transactions (id, user_phone, amount, credits, payment_method, status, notes)
       VALUES (?, ?, ?, ?, 'sepay_mbbank', 'completed', ?)`
    ).bind(
      txId,
      targetPhone,
      transferAmount,
      creditsToAdd,
      `SePay MBBank 9594180624: ${packageName} (Mã GD: ${body.referenceCode || sepayId})`
    ).run();

    return jsonResponse({
      success: true,
      message: `Tự động cộng thành công ${creditsToAdd} lượt cho SĐT ${targetPhone}`,
      phone: targetPhone,
      creditsAdded: creditsToAdd,
      amount: transferAmount,
      transactionId: txId
    }, 200, corsHeaders);
  }

  return jsonResponse({ success: true, message: 'D1 database not bound' }, 200, corsHeaders);
}

export async function handlePaymentCheck(request: Request, env: Env, corsHeaders: Headers, url: URL): Promise<Response> {
  const phone = url.searchParams.get('phone');
  if (!phone) {
    return jsonResponse({ success: false, error: 'Thiếu tham số phone' }, 400, corsHeaders);
  }
  if (await verifiedFirebasePhone(request) !== phone) {
    return jsonResponse({ success: false, error: 'Access denied.' }, 403, corsHeaders);
  }

  if (env.DB) {
    const user = await env.DB.prepare(`SELECT phone, credits FROM users WHERE phone = ?`).bind(phone).first();
    const lastTx = await env.DB.prepare(
      `SELECT id, amount, credits, payment_method, status, created_at
       FROM transactions
       WHERE user_phone = ?
       ORDER BY created_at DESC LIMIT 1`
    ).bind(phone).first();

    return jsonResponse({
      success: true,
      phone,
      credits: (user as { credits?: number } | null)?.credits ?? 0,
      lastTransaction: lastTx || null
    }, 200, corsHeaders);
  }

  return jsonResponse({ success: true, phone, credits: 0 }, 200, corsHeaders);
}
