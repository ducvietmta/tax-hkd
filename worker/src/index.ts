/**
 * ====================================================================
 * CLOUDFLARE WORKERS BACKEND - HỆ THỐNG THUẾ TMĐT & HKD 2026
 * ====================================================================
 * Router mỏng: điều phối request tới các route modules.
 * - worker/src/http.ts: Env, CORS, jsonResponse
 * - worker/src/routesInfra.ts: health, openapi, test-ai, test-quyet
 * - worker/src/routesMcp.ts: MCP endpoint (gọi trực tiếp handleChat)
 * - worker/src/routesAuth.ts: session, profile, history, credits
 * - worker/src/routesPayments.ts: SePay webhook, payment check
 * - worker/src/routeChat.ts: pipeline RAG + Decision + LLM
 * - worker/src/routesFiles.ts: consultations, R2 upload/download
 * - worker/src/rateLimit.ts: sliding-window D1 + cache fallback
 *
 * Secrets (MUSE_API_KEY, FPT_AI_KEY, SEPAY_API_KEY, VIP_PHONE) đọc từ
 * `wrangler secret`, KHÔNG commit vào worker/wrangler.toml.
 */

import { isChatRateLimited, RateLimitUnavailable } from './rateLimit';
import { handleCors, jsonResponse, type Env } from './http';
import { handleHealth, handleLegalCoverage, handleOpenApi } from './routesInfra';
import { handleMcp } from './routesMcp';
import {
  guardUserRoute,
  handleAuthSession,
  handleUserProfile,
  handleChatHistory,
  handleConsumeCredit,
  handleDepositReject,
} from './routesAuth';
import { handleSePayWebhook, handlePaymentCheck } from './routesPayments';
import { handleChat } from './routeChat';
import { handleDocumentChat } from './documentChat';
import { handleRegistrationAdvisor } from './registrationAdvisor';
import { handleRegistrationOffice } from './registrationOffice';
import { handleRegistrationIndustry } from './registrationIndustry';
import { handleConsultation, handleFileUpload, handleFileGet } from './routesFiles';

export type { Env };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = handleCors(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      const length=Number(request.headers.get('Content-Length')||0);
      if(length>12*1024*1024)return jsonResponse({success:false,error:'Request too large.'},413,corsHeaders);
      // Guard chung: mọi /api/user/* yêu cầu Firebase ID token khớp phone.
      if (path.startsWith('/api/user/')) {
        const gate = await guardUserRoute(request, url, corsHeaders);
        if (typeof gate !== 'string') return gate;
      }

      if (path === '/api/test-ai' || path === '/api/test-quyet') return jsonResponse({success:false,error:'Not found.'},404,corsHeaders);

      if (path === '/api/etax-app' || path === '/app' || path === '/etax-app') {
        const ua = request.headers.get('User-Agent') || '';
        if (/android/i.test(ua)) {
          return Response.redirect('https://play.google.com/store/apps/details?id=com.etaxmobile&hl=vi', 302);
        }
        if (/iphone|ipad|ipod/i.test(ua)) {
          return Response.redirect('https://apps.apple.com/vn/app/etax-mobile/id1588647895', 302);
        }
        return Response.redirect('https://canhan.gdt.gov.vn', 302);
      }

      if (path === '/' || path === '/api/health') return handleHealth(env, corsHeaders);
      if (path === '/api/kb/coverage' && request.method === 'GET') return handleLegalCoverage(corsHeaders);

      if (path === '/openapi.json' || path === '/.well-known/openapi.json') {
        return handleOpenApi(corsHeaders);
      }

      if (path === '/mcp' || path === '/api/mcp') {
        const mcpRes = await handleMcp(request, env, ctx, corsHeaders);
        if (mcpRes) return mcpRes;
        return jsonResponse({ success: false, error: `Không tìm thấy endpoint: ${path}` }, 404, corsHeaders);
      }

      if (path === '/api/auth/session' && request.method === 'POST') {
        return handleAuthSession(request, env, corsHeaders);
      }

      if (path === '/api/user/profile' && request.method === 'GET') {
        return handleUserProfile(env, corsHeaders, url);
      }

      if (path === '/api/user/chat-history') {
        return handleChatHistory(request, env, corsHeaders, url);
      }

      if (path === '/api/user/credits/consume' && request.method === 'POST') {
        return handleConsumeCredit(request, env, corsHeaders);
      }

      if (path === '/api/user/credits/deposit' && request.method === 'POST') {
        return handleDepositReject(corsHeaders);
      }

      if (path === '/api/payment/webhook' && request.method === 'POST') {
        return handleSePayWebhook(request, env, corsHeaders);
      }

      if (path === '/api/payment/check' && request.method === 'GET') {
        return handlePaymentCheck(request, env, corsHeaders, url);
      }

      if (path === '/api/document-chat') return await handleDocumentChat(request,env,ctx,corsHeaders);
      if (path === '/api/registration-guide/industry') return await handleRegistrationIndustry(request, env, corsHeaders);
      if (path === '/api/registration-guide/chat') return await handleRegistrationAdvisor(request, env, ctx, corsHeaders);
      if (path === '/api/registration-guide/office') return await handleRegistrationOffice(request, env, ctx, corsHeaders);

      if ((path === '/api/chat' || path === '/api/chatgpt/tax-qa') && request.method === 'POST') {
        return await handleChat(request, env, ctx, corsHeaders);
      }
      if (path === '/api/chat' || path === '/api/chatgpt/tax-qa') {
        return jsonResponse({ success: false, error: 'Method not allowed.' }, 405, corsHeaders);
      }

      if (path === '/api/consultations' && request.method === 'POST') {
        if(await isChatRateLimited(request.headers.get('CF-Connecting-IP')||'unknown',env,ctx))return jsonResponse({success:false,error:'Too many requests.'},429,corsHeaders);
        return await handleConsultation(request, env, corsHeaders);
      }

      if (path === '/api/files/upload' && request.method === 'POST') {
        return await handleFileUpload(request, env, corsHeaders, url);
      }

      if (path.startsWith('/api/files/') && request.method === 'GET') {
        return await handleFileGet(request, env, corsHeaders, path);
      }

      return jsonResponse({ success: false, error: `Không tìm thấy endpoint: ${path}` }, 404, corsHeaders);
    } catch(error) {
      if(error instanceof RateLimitUnavailable)return jsonResponse({success:false,error:error.message,diagnostic_code:'RATE_LIMIT_UNAVAILABLE'},503,corsHeaders);
      return jsonResponse(
        {
          success: false,
          error: 'Lỗi máy chủ Cloudflare Workers',

        },
        500,
        corsHeaders
      );
    }
  },

  async scheduled(_controller: unknown, env: Env, _ctx: ExecutionContext): Promise<void> {
    if (env.DB) {
      try {
        const result = await env.DB.prepare(
          `DELETE FROM chat_logs WHERE created_at < datetime('now', '-90 days')`
        ).run();
        await env.DB.batch([
          env.DB.prepare("DELETE FROM answer_cache WHERE created_at < datetime('now','-7 days')"),
          env.DB.prepare("DELETE FROM answer_grounding_traces WHERE created_at < datetime('now','-30 days')"),
          env.DB.prepare("DELETE FROM decision_traces WHERE created_at < datetime('now','-90 days')"),
          env.DB.prepare("DELETE FROM rate_limits WHERE created_at < datetime('now','-2 hours')")
        ]);
        console.log(`[SCHEDULED_CLEANUP_90D] Cleaned old chat logs: ${result.meta?.changes ?? 0} rows deleted.`);
      } catch (err: unknown) {
        console.error('[SCHEDULED_CLEANUP_90D_ERR]', (err as Error)?.message);
      }
    }
  },
};
