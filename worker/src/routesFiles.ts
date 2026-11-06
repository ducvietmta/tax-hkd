/**
 * R2 upload/download + consultation leads.
 */

import { verifiedFirebasePhone } from './firebaseAuth';
import { jsonResponse, type Env } from './http';

export async function handleConsultation(request: Request, env: Env, corsHeaders: Headers): Promise<Response> {
  const body: { name?: string; phone?: string; email?: string; platform?: string; estimatedRevenue?: string; notes?: string } =
    await request.json();
  const { name, phone, email, platform, estimatedRevenue, notes } = body;

  if (Object.values(body).some(v=>typeof v!=='string'||v.length>4000))return jsonResponse({success:false,error:'Invalid fields.'},400,corsHeaders);
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
  const owner=await verifiedFirebasePhone(request);
  if(!owner)return jsonResponse({success:false,error:'Sign-in required.'},401,corsHeaders);
  if (!env.STORAGE_BUCKET) {
    return jsonResponse({ success: false, error: 'Cloudflare R2 Bucket chưa được cấu hình binding.' }, 500, corsHeaders);
  }

  const contentType = request.headers.get('Content-Type') || '';
  let fileBuffer: ArrayBuffer;
  let originalName = 'document.png';
  let mimeType = 'image/png';
  const userPhone = owner;
  const reader=request.body?.getReader();
  const parts:Uint8Array[]=[];let total=0;
  if(reader)while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>11*1024*1024){await reader.cancel();return jsonResponse({success:false,error:'File too large.'},413,corsHeaders);}parts.push(value);}
  const bounded=new Uint8Array(total);let offset=0;for(const part of parts){bounded.set(part,offset);offset+=part.length;}
  const safeBody=new Response(bounded,{headers:{'Content-Type':contentType}});

  if (contentType.includes('multipart/form-data')) {
    const formData = await safeBody.formData();
    const file = formData.get('file') as File;


    if (!(file instanceof File)) {
      return jsonResponse({ success: false, error: 'Không tìm thấy file trong form data.' }, 400, corsHeaders);
    }

    fileBuffer = await file.arrayBuffer();
    originalName = file.name;
    mimeType = file.type || 'application/octet-stream';
  } else {
    fileBuffer = await safeBody.arrayBuffer();
    originalName = request.headers.get('X-File-Name') || `upload_${Date.now()}.png`;
    mimeType = contentType || 'application/octet-stream';

  }

  if(fileBuffer.byteLength>10*1024*1024)return jsonResponse({success:false,error:'File too large.'},413,corsHeaders);
  const bytes=new Uint8Array(fileBuffer);
  const matches=(signature:number[])=>signature.every((value,i)=>bytes[i]===value);
  const detected=matches([0x25,0x50,0x44,0x46,0x2d])?'application/pdf':matches([137,80,78,71,13,10,26,10])?'image/png':matches([255,216,255])?'image/jpeg':null;
  if(!detected||mimeType!==detected)return jsonResponse({success:false,error:'Only PDF, PNG and JPEG are accepted.'},415,corsHeaders);
  originalName=originalName.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120);
  const fileKey = `docs/${crypto.randomUUID()}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

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
  const owner=await verifiedFirebasePhone(request);
  if(!owner)return jsonResponse({success:false,error:'Sign-in required.'},401,corsHeaders);
  if (!env.STORAGE_BUCKET) {
    return jsonResponse({ success: false, error: 'Cloudflare R2 Bucket chưa kích hoạt.' }, 500, corsHeaders);
  }

  const key = decodeURIComponent(path.replace('/api/files/', ''));
  if (!key) {
    return jsonResponse({ success: false, error: 'Thiếu file key.' }, 400, corsHeaders);
  }

  const record=await env.DB?.prepare('SELECT user_phone FROM files WHERE file_key=? AND user_phone=?').bind(key,owner).first();
  if(!record)return jsonResponse({success:false,error:'File not found.'},404,corsHeaders);
  const object = await env.STORAGE_BUCKET.get(key);
  if (!object) {
    return jsonResponse({ success: false, error: 'File không tồn tại trên Cloudflare R2.' }, 404, corsHeaders);
  }

  const headers = new Headers(corsHeaders);
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control','private, no-store');
  headers.set('Content-Disposition','attachment');
  headers.set('Content-Security-Policy',"sandbox; default-src 'none'");
  headers.set('X-Content-Type-Options','nosniff');

  return new Response(object.body, { headers });
}
