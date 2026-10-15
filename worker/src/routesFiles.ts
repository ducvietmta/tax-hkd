/**
 * R2 upload/download + consultation leads.
 */

import { jsonResponse, type Env } from './http';

export async function handleConsultation(request: Request, env: Env, corsHeaders: Headers): Promise<Response> {
  const body: { name?: string; phone?: string; email?: string; platform?: string; estimatedRevenue?: string; notes?: string } =
    await request.json();
  const { name, phone, email, platform, estimatedRevenue, notes } = body;

  if (!name || !phone) {
    return jsonResponse({ success: false, error: 'Vui lòng cung cấp họ tên và số điện thoại.' }, 400, corsHeaders);
  }

  if (env.DB) {
    const leadId = `lead_${Date.now()}`;
    await env.DB.prepare(
      `INSERT INTO consultation_leads (id, name, phone, email, platform, estimated_revenue, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(leadId, name, phone, email || '', platform || 'tiktok', estimatedRevenue || '1-3 tỷ', notes || '').run();

    return jsonResponse(
      {
        success: true,
        message: 'Yêu cầu tư vấn đã được ghi nhận vào cơ sở dữ liệu Cloudflare D1.',
        leadId,
      },
      200, corsHeaders
    );
  }

  return jsonResponse({ success: true, message: 'Đã nhận thông tin tư vấn.' }, 200, corsHeaders);
}

export async function handleFileUpload(request: Request, env: Env, corsHeaders: Headers, url: URL): Promise<Response> {
  if (!env.STORAGE_BUCKET) {
    return jsonResponse({ success: false, error: 'Cloudflare R2 Bucket chưa được cấu hình binding.' }, 500, corsHeaders);
  }

  const contentType = request.headers.get('Content-Type') || '';
  let fileBuffer: ArrayBuffer;
  let originalName = 'document.png';
  let mimeType = 'image/png';
  let userPhone = '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    userPhone = (formData.get('phone') as string) || '';

    if (!file) {
      return jsonResponse({ success: false, error: 'Không tìm thấy file trong form data.' }, 400, corsHeaders);
    }

    fileBuffer = await file.arrayBuffer();
    originalName = file.name;
    mimeType = file.type || 'application/octet-stream';
  } else {
    fileBuffer = await request.arrayBuffer();
    originalName = request.headers.get('X-File-Name') || `upload_${Date.now()}.png`;
    mimeType = contentType || 'application/octet-stream';
    userPhone = request.headers.get('X-User-Phone') || '';
  }

  const fileKey = `docs/${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  await env.STORAGE_BUCKET.put(fileKey, fileBuffer, {
    httpMetadata: { contentType: mimeType },
    customMetadata: { uploadedBy: userPhone, originalName },
  });

  const publicUrl = `${url.origin}/api/files/${encodeURIComponent(fileKey)}`;

  if (env.DB) {
    const fileId = `file_${Date.now()}`;
    await env.DB.prepare(
      `INSERT INTO files (id, user_phone, file_key, original_name, mime_type, file_size, public_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(fileId, userPhone, fileKey, originalName, mimeType, fileBuffer.byteLength, publicUrl).run();
  }

  return jsonResponse(
    {
      success: true,
      fileKey,
      originalName,
      fileSize: fileBuffer.byteLength,
      mimeType,
      publicUrl,
      message: 'Tải tài liệu lên Cloudflare R2 thành công.',
    },
    200, corsHeaders
  );
}

export async function handleFileGet(request: Request, env: Env, corsHeaders: Headers, path: string): Promise<Response> {
  void request;
  if (!env.STORAGE_BUCKET) {
    return jsonResponse({ success: false, error: 'Cloudflare R2 Bucket chưa kích hoạt.' }, 500, corsHeaders);
  }

  const key = decodeURIComponent(path.replace('/api/files/', ''));
  if (!key) {
    return jsonResponse({ success: false, error: 'Thiếu file key.' }, 400, corsHeaders);
  }

  const object = await env.STORAGE_BUCKET.get(key);
  if (!object) {
    return jsonResponse({ success: false, error: 'File không tồn tại trên Cloudflare R2.' }, 404, corsHeaders);
  }

  const headers = new Headers(corsHeaders);
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}
