/**
 * Chat pipeline RAG + Decision + LLM. Tách từ index.ts — router gọi handleChat.
 * Mọi return đều là Response hoàn chỉnh (JSON hoặc SSE).
 */

import { taxRegistrationInstructions } from '../../shared/taxRegistrationWorkflow';
import type { RagChunk } from './ragEngine';
import { verifiedFirebasePhone } from './firebaseAuth';
import { retrieve, buildContext, analyzeAmounts } from './retriever';
import { resolveAnswerScope, scopeInstructions, intentInstructions, OUT_OF_SCOPE_RESPONSE } from './answerScope';
import { resolveTaxRelevance } from './taxRelevance';
import { matchPendingTopics } from './pendingTopics';
import { buildConversationRetrievalQuery, normalizeConversationHistory } from './conversation';
import { buildMuseRequest } from './museRequest';
import { validateLegalCitations } from './answerValidation';
import { understandClassifiedQuery, buildSubrequests } from './decision/understandQuery';
import { resolveAbcCategory } from './decision/labels';
import { JevDecisionProvider } from './decision/jevProvider';
import { repairGroundedAnswer } from './decision/repairAnswer';
import { retrieveSubrequests } from './decision/subrequests';
import { groundingInstructions, parseGroundedAnswer, type GroundingPacket } from './decision/claimGrounding';
import { MuseEvidenceReviewer } from './decision/museEvidenceReviewer';
import { calculationInstructions } from './decision/calculationContract';
import { resolveCalculations } from './decision/arithmetic';
import { canReleaseReviewedAnswer } from './decision/reviewIntegrity';
import { answerContract, UNVERIFIED_ANSWER } from './decision/answerContract';
import { groundedAnswerPolicy, reviewRepairGuidance } from './decision/answerPolicy';
import { filterAndGateEvidence,isSubjectCompatible } from './decision/evidenceGate';
import { evaluateDecisionFrame } from './rules/evaluator';
import { validateAnswer } from './decision/answerValidator';
import { buildRetrievalPlan } from './decision/retrievalPlan';
import { decide } from './decision/orchestrator';
import { TONE_GUIDANCE } from './answerTone';
import { vectorSearch, mergeVectorHits } from './vectorRetriever';
import { CURRENT_RULESET_VERSION, RULESET_REGISTRY } from './rules/registry';
import { CANONICAL_CHUNKS } from './ragEngine';
import chunkMeta from './kb/chunkMeta.json';
import legalRelations from './kb/legalRelations.json';
import { jsonResponse, type Env } from './http';
import { isChatRateLimited } from './rateLimit';
import { logRetrieval } from './retrievalStats';
import { streamChatProgress } from './chatProgressStream';
import type { ChatProgress } from '../../shared/chatProgress';
import { PIPELINE_VERSION } from './buildInfo';
import { PipelineBudget } from './decision/pipelineBudget';
import { planScenarios, scenarioRequests } from './decision/scenarioPlan';

export { PIPELINE_VERSION };

let kbVersionPromise: Promise<string> | undefined;
function knowledgeVersion(): Promise<string> {
  if (!kbVersionPromise) {
    kbVersionPromise = crypto.subtle.digest('SHA-256', new TextEncoder().encode(
      JSON.stringify(CANONICAL_CHUNKS) + JSON.stringify(chunkMeta) + JSON.stringify(RULESET_REGISTRY) + JSON.stringify(legalRelations)
    )).then(bytes => Array.from(new Uint8Array(bytes)).slice(0, 12)
      .map(value => value.toString(16).padStart(2, '0')).join(''));
  }
  return kbVersionPromise;
}

export function selectReasoningEffort(
  message: string,
  classification?: any,
  decisionFrame?: any,
): 'low' | 'medium' | 'high' {
  // This is a sourced procedure lookup, not a tax calculation even when the
  // user mentions salary withholding or a processing deadline.
  if (classification?.topic === 'BUSINESS_CESSATION') return 'low';
  const norm = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const isBoundaryOrComplex =
    /10[,.]1\s*ty|50\s*ty|999|001|1[,.]3\s*ty|hai quan|2 quan|2 cua hang|vua ban|vua lam|vua dich vu|vua thuong mai|hai nhom|tach 2 nhom|tru 1 ty/i.test(norm) ||
    Boolean(decisionFrame?.facts?.multi_activities) ||
    Boolean(decisionFrame?.facts?.platform_fee_vnd) ||
    (classification?.secondaryIntents && classification.secondaryIntents.length >= 2);
  if (isBoundaryOrComplex) return 'high';

  const hasCalculation =
    Boolean(decisionFrame?.facts?.revenue_vnd) ||
    classification?.topic === 'TAX_AMOUNT' ||
    /tinh thue|bao nhieu|nop thue|phai nop|khau tru/i.test(norm);
  // Retrieved rules + reviewed arithmetic do not require a long reasoning run.
  // Keep the answer inside the MCP request window instead of retrying a slow
  // speculative generation several times.
  if (hasCalculation) return classification?.topic === 'TAX_AMOUNT' ? 'low' : 'medium';

  const isSimpleLookup =
    ['BUSINESS_REGISTRATION', 'TAX_REGISTRATION', 'REGISTRATION_COMPARISON', 'REGISTRATION_REQUIREMENTS', 'SYSTEM_REGISTRATION', 'PORTAL_TROUBLESHOOTING', 'TAX_SOFTWARE_SYSTEM'].includes(classification?.topic || '') ||
    classification?.topic === 'TAX_IDENTIFIER' ||
    classification?.topic === 'INVOICE_REGISTRATION' ||
    /le phi mon bai|mon bai|ma 888|dang ky hkd|thu tuc|giay to|mau so|etax|htkk|thuedientu/i.test(norm);
  if (isSimpleLookup) return 'low';

  return 'medium';
}

export async function handleChat(
  request: Request, env: Env, ctx: ExecutionContext, corsHeaders: Headers,
  onProgress?: (progress: ChatProgress) => void,
  caller?: 'connector',
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
// 7. TƯ VẤN THUẾ AI VỚI RAG KNOWLEDGE BASE ENGINE (POST /api/chat & POST /api/chatgpt/tax-qa)
  if ((path === '/api/chat' || path === '/api/chatgpt/tax-qa') && request.method === 'POST') {
    const body: any = await request.json().catch(() => ({}));
    if(!body||typeof body!=='object'||Array.isArray(body))return jsonResponse({success:false,error:'Nội dung gửi không hợp lệ.'},400,corsHeaders);
    if (body.stream && path === '/api/chat' && !onProgress) {
      return streamChatProgress(notify => handleChat(new Request(request.url, {
        method: 'POST', headers: request.headers, body: JSON.stringify({ ...body, stream: false }),
      }), env, ctx, corsHeaders, notify, caller), ctx, corsHeaders);
    }
    const rawMessage = body?.message ?? body?.question;
    const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';
    const { phone, fileKey } = body;

    // The connector endpoint is deliberately public, but receives the same IP
    // quota. An arbitrary HTTP header must never grant internal privileges.
    const isInternal = caller === 'connector' || path === '/api/chatgpt/tax-qa';
    let verifiedPhone: string | null = null;

    // Bỏ lượt hỏi cho khách vãng lai: Yêu cầu đăng nhập tài khoản bằng số điện thoại đối với web client
    if (!isInternal) {
      verifiedPhone = await verifiedFirebasePhone(request);
      if (!verifiedPhone) {
        return jsonResponse(
          {
            success: false,
            error: 'Vui lòng đăng nhập bằng số điện thoại để đặt câu hỏi tư vấn thuế.',
            requireLogin: true,
          },
          401,
          corsHeaders
        );
      }
      if (phone && phone !== verifiedPhone) {
        return jsonResponse(
          {
            success: false,
            error: 'Thông tin xác thực tài khoản không khớp.',
            requireLogin: true,
          },
          403,
          corsHeaders
        );
      }
    }
    const activePhone = verifiedPhone || '';

    if (fileKey) {
      return jsonResponse({
        success: false,
        error: 'Hệ thống chưa hỗ trợ đọc nội dung tệp đính kèm để tư vấn. Vui lòng nhập câu hỏi bằng văn bản.',
      }, 422, corsHeaders);
    }

    if (!message) {
      return jsonResponse({ success: false, error: 'Nội dung câu hỏi không được để trống.' }, 400, corsHeaders);
    }

    if (message.length > 50000) {
      return jsonResponse({ success: false, error: 'Nội dung câu hỏi quá dài (vui lòng gửi dưới 50.000 ký tự).' }, 400, corsHeaders);
    }

    const registrationGuide = body.workflow === 'tax_registration';
    const workflowEvidence = registrationGuide ? taxRegistrationInstructions() : '';
    let userHistory;
    try { userHistory = normalizeConversationHistory(body.history); }
    catch { return jsonResponse({success:false,error:'Hội thoại quá dài. Vui lòng mở cuộc trò chuyện mới và giữ lại các dữ kiện cần dùng.'},413,corsHeaders); }
    const history = registrationGuide ? normalizeConversationHistory([
      { role: 'user', content: 'Tôi cần được hướng dẫn đăng ký thuế trực tiếp cho cá nhân kinh doanh. Hãy trao đổi để làm rõ hoạt động, ngành nghề, hồ sơ và nơi nộp; chưa xác nhận tôi được miễn đăng ký hộ.' },
      ...userHistory,
    ]) : userHistory;

    // Both transports return the same finalized answer; SSE only changes delivery.
    const respondWithAnswer = (payload: any, remainingCredits: number, cached = false): Response => {
      const answerPayload = {
        ...payload,
        remainingCredits,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        ...(cached ? { cached: true } : {}),
      };
      if (path === '/api/chatgpt/tax-qa') {
        return jsonResponse({
          success: true,
          answer: payload.response,
          legal_citations: payload.citations || [],
          evidence: (payload.retrieval?.evidence || []).map((e: any) => e.title),
          decision: payload.retrieval?.decision,
          source: payload.source,
          ...(payload.diagnostic_code ? { diagnostic_code: payload.diagnostic_code } : {}),
        }, 200, corsHeaders);
      }
      if (!body.stream) return jsonResponse(answerPayload, 200, corsHeaders);
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      ctx.waitUntil((async () => {
        try {
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'meta', source: payload.source, citations: payload.citations || [],
            retrieval: payload.retrieval, remainingCredits,
          })}\n\n`));
          const answer = payload.response || '';
          for (let i = 0; i < answer.length; i += 120) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'delta', delta: answer.slice(i, i + 120) })}\n\n`));
          }
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done', fullText: answer, remainingCredits })}\n\n`));
          await writer.write(encoder.encode('data: [DONE]\n\n'));
        } finally {
          await writer.close();
        }
      })());
      const headers = new Headers(corsHeaders);
      headers.set('Content-Type', 'text/event-stream; charset=utf-8');
      headers.set('Cache-Control', 'no-cache, no-transform');
      return new Response(readable, { status: 200, headers });
    };

    const answerScope = resolveAnswerScope(history, message);
    const cacheBypass = request.headers.get('X-Bypass-Cache') === '1' || url.searchParams.get('nocache') === '1';
    const cacheable = !fileKey && !cacheBypass;
    const normMsg = message.trim().normalize('NFC').replace(/\s+/g, ' ');
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Run rate-limit, user credit lookup, and cache hash computation in parallel
    const [rateLimited, userRecord, digest] = await Promise.all([
      isChatRateLimited(ip, env, ctx),
      !isInternal && env.DB && activePhone
        ? env.DB.prepare(`SELECT id, phone, credits, role FROM users WHERE phone = ?`).bind(activePhone).first<{ id: string; phone: string; credits: number; role?: string }>()
        : Promise.resolve(null),
      crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(`${PIPELINE_VERSION}|rules:${CURRENT_RULESET_VERSION}|kb:${await knowledgeVersion()}|mode:${env.DECISION_MODE || 'enforce'}|today:${answerScope.today}|years:${answerScope.years.join(',')}|q:${normMsg}|hist:${JSON.stringify(history)}${registrationGuide ? '|guide:2' : ''}`)
      ),
    ]);

    if (rateLimited) {
      return jsonResponse({ success: false, error: 'Bạn gửi câu hỏi quá nhanh, vui lòng thử lại sau ít phút.' }, 429, corsHeaders);
    }

    if (!isInternal && env.DB && activePhone) {
      if (!userRecord) {
        return jsonResponse(
          {
            success: false,
            error: 'Tài khoản chưa được khởi tạo. Vui lòng đăng nhập lại.',
            requireLogin: true,
          },
          404,
          corsHeaders
        );
      }

      if (userRecord.credits <= 0) {
        return jsonResponse(
          {
            success: false,
            error: 'Bạn đã dùng hết lượt hỏi tư vấn. Vui lòng nạp thêm lượt để tiếp tục tra cứu.',
            requireDeposit: true,
            remainingCredits: 0,
          },
          403,
          corsHeaders
        );
      }
    }

    // Reserve before cache/model work. Concurrent requests cannot spend the
    // same last credit. Any non-chargeable return or exception refunds it.
    let reserved = false;
    if (!isInternal && env.DB && activePhone) {
      const reservation = await env.DB.prepare('UPDATE users SET credits = credits - 1, updated_at = CURRENT_TIMESTAMP WHERE phone = ? AND credits > 0 RETURNING credits')
        .bind(activePhone).first<{credits:number}>();
      if (!reservation) return jsonResponse({success:false,requireDeposit:true,error:'Bạn chưa có lượt hỏi.',remainingCredits:0},403,corsHeaders);
      reserved = true;
    }
    let deducted = false;
    try {
    onProgress?.({ stage: 'received' });
    // Helper trừ 1 lượt nguyên tử khi trả lời thành công
    let finalRemainingCredits = userRecord?.credits ?? 99;

    const deductCreditOnce = async (): Promise<number> => {
      if (deducted || isInternal || !env.DB || !activePhone || !userRecord) {
        return finalRemainingCredits;
      }
      deducted = true;
      try {
        const fresh = await env.DB.prepare(`SELECT credits FROM users WHERE phone = ?`).bind(activePhone).first<{ credits: number }>();
        finalRemainingCredits = fresh ? fresh.credits : Math.max(0, userRecord.credits - 1);
      } catch (e: any) {
        console.error('[CREDIT_DEDUCT_ERR]', e?.message);
        finalRemainingCredits = Math.max(0, userRecord.credits - 1);
      }
      return finalRemainingCredits;
    };

    // Định kỳ dọn dẹp log chat cũ hơn 90 ngày (opportunistic cleanup)
    if (env.DB && Math.random() < 0.05) {
      ctx.waitUntil(
        env.DB.prepare(`DELETE FROM chat_logs WHERE created_at < datetime('now', '-90 days')`)
          .run()
          .catch((e: any) => console.error('[CLEANUP_90D_ERR]', e?.message))
      );
      ctx.waitUntil(
        env.DB.prepare(`DELETE FROM answer_cache WHERE created_at < datetime('now', '-7 days')`)
          .run()
          .catch((e: any) => console.error('[ANSWER_CACHE_CLEANUP_ERR]', e?.message))
      );
      ctx.waitUntil(
        env.DB.prepare(`DELETE FROM decision_traces WHERE created_at < datetime('now', '-90 days')`)
          .run()
          .catch((e: any) => console.error('[DECISION_TRACE_CLEANUP_ERR]', e?.message))
      );
    }

    const hash = Array.from(new Uint8Array(digest)).slice(0, 12).map((x) => x.toString(16).padStart(2, '0')).join('');
    const cacheKey = new Request(`https://cache.internal/chat/${hash}`);
    if (cacheable) {
      let cached: any = null;
      if (env.DB) {
        const row = await env.DB.prepare('SELECT payload FROM answer_cache WHERE cache_key = ?')
          .bind(hash).first() as { payload: string } | null;
        if (row?.payload) cached = JSON.parse(row.payload);
      } else {
        const hit = await caches.default.match(cacheKey);
        if (hit) cached = await hit.json();
      }
      if (cached) {
        onProgress?.({ stage: 'cache' });
        const remainingCredits = await deductCreditOnce();
        logRetrieval(env, ctx, {
          transport: path === '/api/chatgpt/tax-qa' ? 'chatgpt'
            : request.headers.get('X-Internal-Caller') === 'mcp' ? 'mcp' : 'web',
          routeId: null, usedFallback: false, cacheHit: true,
          hasPlan: false, resultCount: 0, years: cached.retrieval?.period?.years || answerScope.years,
        });
        if (env.DB && activePhone) {
          ctx.waitUntil(
            env.DB.prepare(
              `INSERT INTO chat_logs (id, user_phone, message, response, credits_used, source) VALUES (?, ?, ?, ?, 1, ?)`
            )
              .bind(`chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, activePhone, message, cached.response, 'cache')
              .run()
              .catch(() => {})
          );
        }
        return respondWithAnswer(cached, remainingCredits, true);
      }
    }

    const tStart = Date.now();
    let durationClassifyMs = 0;
    let durationRagMs = 0;
    let durationGenMs = 0;
    let durationRev1Ms = 0;
    let durationRepairMs = 0;
    let durationRev2Ms = 0;
    const budget = new PipelineBudget();

    // Khởi chạy Vector Search song song ngay từ đầu để ẩn hoàn toàn latency (~250-400ms)
    const earlyRetrievalQuery = buildConversationRetrievalQuery(history, message, answerScope.years);
    const vectorSearchPromise = vectorSearch(earlyRetrievalQuery, env, 8, answerScope.years).catch(() => null);

    // --- BƯỚC 0: KIỂM TRA PHẠM VI & PHÂN LOẠI NGỮ NGHĨA SONG SONG ---
    const decisionApiKey = env.JEV_API_KEY || env.FPT_AI_KEY || '';
    const decisionEndpoint = env.DECISION_ENDPOINT || (env.JEV_API_KEY ? 'https://api.typesafe.ai/v1/systemone' : undefined);
    const decisionModel = env.DECISION_MODEL || (env.JEV_API_KEY ? 'jev-latest' : undefined);

    const businessProvider = new JevDecisionProvider(decisionApiKey, decisionEndpoint, 30000, decisionModel);
    const t0Classify = Date.now();
    onProgress?.({ stage: 'classifying' });
    const [taxRelevance, businessClassification] = await Promise.all([
      resolveTaxRelevance(message, history, decisionApiKey, decisionEndpoint, decisionModel),
      decisionApiKey ? businessProvider.classifyBusiness(message, history) : Promise.resolve(null),
    ]);
    durationClassifyMs = Date.now() - t0Classify;
    if (taxRelevance !== 'IN_SCOPE') {
      const outOfScopeResponse = {
        success: true,
        response: taxRelevance === 'OUT_OF_SCOPE' ? OUT_OF_SCOPE_RESPONSE
          : taxRelevance === 'UNCERTAIN'
            ? 'Bạn muốn hỏi vấn đề thuế nào trong tình huống này? Vui lòng nêu rõ để hệ thống tư vấn đúng trọng tâm.'
            : 'Mình chưa kiểm tra được phạm vi câu hỏi lúc này, bạn thử lại sau ít phút nhé.',
        source: taxRelevance === 'OUT_OF_SCOPE' ? 'out_of_scope'
          : taxRelevance === 'UNCERTAIN' ? 'scope_clarification' : 'scope_unavailable',
        citations: [],
        legal_citations: [],
      };
      return respondWithAnswer(outOfScopeResponse, userRecord?.credits ?? 99);
    }

    console.log('[QUYET_BUSINESS]', JSON.stringify({ model: businessProvider.name,
      available: !!businessClassification, labels: businessClassification }));
    if (!businessClassification) {
      return respondWithAnswer({ success: true,
        response: 'Mình chưa phân loại được câu hỏi lúc này, bạn thử lại sau ít phút nhé.',
        source: 'classification_unavailable', diagnostic_code: businessProvider.failureCode || 'INVALID_CLASSIFICATION', citations: [], legal_citations: [] }, userRecord?.credits ?? 99);
    }

    // answerScope scope refinement
    if (businessClassification.primaryIntent !== 'COMPARE_PERIODS' &&
        !businessClassification.secondaryIntents.includes('COMPARE_PERIODS') &&
        businessClassification.taxYears?.length === 1 && answerScope.years.includes(businessClassification.taxYears[0])) {
      answerScope.years = businessClassification.taxYears;
    }

    // Classify before retrieval so the frame controls the evidence path.
    const decisionMode = env.DECISION_MODE || 'enforce';
    const applyDecision = decisionMode === 'enforce';
    const decisionFrame = understandClassifiedQuery(message, answerScope, history, businessClassification);
    if(businessClassification.calculationShape==='SCENARIOS'){
      try{
        if(!env.MUSE_API_KEY)throw Error('SCENARIO_PLAN_UNAVAILABLE');
        const scenarios=await planScenarios(message,history,env.MUSE_API_KEY);
        if(scenarios.length)decisionFrame.requests=scenarioRequests(decisionFrame,scenarios);
        else{
          businessClassification.calculationShape='METHOD_COMPARISON';
          businessClassification.topic='TAX_AMOUNT';
          decisionFrame.semantic={...decisionFrame.semantic,calculationShape:'METHOD_COMPARISON',topic:'TAX_AMOUNT'};
          decisionFrame.requests=buildSubrequests(decisionFrame);
        }
      }catch{
        return respondWithAnswer({success:true,response:'Mình chưa tách chắc chắn được các kịch bản trong câu hỏi lúc này. Bạn thử lại giúp mình; lượt này không bị trừ.',source:'scenario_plan_unavailable',citations:[],legal_citations:[]},userRecord?.credits??99);
      }
    }
    const abcCategory = resolveAbcCategory(
      businessClassification.topic,
      decisionFrame?.tax_intent.primary.value || businessClassification.primaryIntent,
      decisionFrame?.tax_intent.secondary || businessClassification.secondaryIntents,
    );
    const decisionPlan = decisionFrame ? buildRetrievalPlan(decisionFrame) : undefined;
    // Semantic evidence routing is active independently of legal-rule enforcement.
    const retrievalPlan = decisionPlan;
    const decisionEvaluation = decisionFrame?.facts.revenue_vnd && decisionFrame.tax_period.years.length === 1 &&
      (businessClassification.revenueContext === 'ACTUAL_YEAR' ||
        (businessClassification.revenueContext === 'UNSPECIFIED' && businessClassification.topic === 'TAX_AMOUNT' &&
          businessClassification.primaryIntent === 'TAX_CALCULATION'))
      ? evaluateDecisionFrame(decisionFrame) : null;

    // --- BƯỚC 1: HYBRID RETRIEVAL (BM25 + decision plan + evidence gate) ---
    const t0Rag = Date.now();
    onProgress?.({ stage: 'retrieving' });
    const retrievalQuery = buildConversationRetrievalQuery(history, message, answerScope.years);
    const topK = businessClassification.topic === 'TAX_AMOUNT' ? 6 : abcCategory ? 5 : 4;
    const subretrieval=decisionFrame.requests && decisionFrame.requests.length>1
      ? retrieveSubrequests(retrievalQuery,decisionFrame,answerScope,Math.max(topK,8)) : null;
    const retrieved = subretrieval || retrieve(retrievalQuery, topK, answerScope, retrievalPlan);
    const { routeId, usedFallback } = retrieved;
    // Dense opt-in: Weighted RRF + True-Pin preservation + Period metadata filtering
    const vectorHits = await vectorSearchPromise;
    if (vectorHits?.length) {
      retrieved.results = mergeVectorHits(retrieved.results, vectorHits, Math.max(topK + 2,subretrieval?.plans.filter(p=>p.refs.length).length||0), {
        query: retrievalQuery,
        years: answerScope.years,
        pinnedRefs: subretrieval ? subretrieval.plans.flatMap(p=>p.refs.slice(0,1)) : retrievalPlan?.must_include_refs,
        allowedRefs: subretrieval ? [...new Set(subretrieval.plans.flatMap(p=>p.refs))] : retrievalPlan?.allowed_refs,
        rrfK: 60,
        wBm25: 1.0,
        wDense: 0.6,
        minScore: 0.35,
      });
    }
    logRetrieval(env, ctx, {
      transport: path === '/api/chatgpt/tax-qa' ? 'chatgpt'
        : request.headers.get('X-Internal-Caller') === 'mcp' ? 'mcp' : 'web',
      routeId, usedFallback, cacheHit: false,
      hasPlan: !!retrievalPlan, resultCount: retrieved.results.length, years: answerScope.years,
    });
    const gated = decisionFrame ? filterAndGateEvidence(retrieved.results.map(r => r.chunk), decisionFrame) : null;
    const results = applyDecision && gated
      ? retrieved.results.filter(r => gated.passedChunks.includes(r.chunk))
      : retrieved.results.filter(r=>isSubjectCompatible(r.chunk,decisionFrame));
    const relevantChunks: RagChunk[] = results.map((r) => r.chunk);
    const structuredDecision = decisionFrame && decisionPlan && gated
      ? decide(decisionFrame, decisionEvaluation, gated.evidenceItems, decisionPlan) : null;
    const matchedRoute = routeId ? { refs: relevantChunks.map((c) => c.ref_id).filter(Boolean) } : null;
    // Reserve room for the official form/industry evidence in the guide. Both
    // generation and review receive this same context; don't silently overrun
    // the reviewer's 14k evidence limit and fall back without a review.
    const reviewOverhead = workflowEvidence.length + analyzeAmounts(message).length + answerContract(businessClassification).length + 600;
    // Required legal dependencies need the same bounded space even when the
    // provider returns a broad topic such as OTHER. Preserve review's reserve.
    const contextBudget = registrationGuide ? 4500 : businessClassification.topic === 'TAX_AMOUNT'||results.some(r=>r.required)
      ? Math.min(12000, Math.max(6500, 14000 - reviewOverhead - 800)) : retrievalPlan?.semantic_topic ? 9000 : 6500;
    const { text: ragContextText, citations: retrievedCitations, includedRefs, passages,missingDocumentRefs,missingRequiredRefs } = buildContext(results, retrievalQuery, contextBudget, answerScope,businessClassification.answerPurpose==='DEFINITION'?'DEFINITION':undefined);
    if(missingRequiredRefs.length)console.warn('[REQUIRED_CONTEXT_OMITTED]',JSON.stringify({refs:missingRequiredRefs,contextBudget}));
    if(missingDocumentRefs.length){
      console.warn('[DOCUMENT_CONTEXT_INCOMPLETE]',JSON.stringify({refs:missingDocumentRefs,contextBudget}));
      return respondWithAnswer({success:true,response:'Mình đã tìm thấy văn bản bạn hỏi nhưng chưa đưa đủ nội dung liên quan vào lượt xử lý này. Bạn vui lòng tách từng văn bản hoặc từng yêu cầu để mình đối chiếu chính xác; lượt này không bị trừ.',source:'evidence_context_incomplete',citations:[],legal_citations:[]},userRecord?.credits??99);
    }
    for(const passage of passages)passage.request_ids=subretrieval?.links[passage.ref_id]||decisionFrame.requests?.map(r=>r.id)||[];
    const requestEvidenceCoverage=decisionFrame.requests?.map(r=>({request_id:r.id,evidence_ids:passages.filter(p=>p.request_ids?.includes(r.id)).map(p=>p.id)}))||[];
    if(requestEvidenceCoverage.some(r=>!r.evidence_ids.length))console.warn('[REQUEST_EVIDENCE_GAPS]',JSON.stringify(requestEvidenceCoverage.filter(r=>!r.evidence_ids.length)));
    let groundingPacket:GroundingPacket={claims:[],passages,requests:decisionFrame.requests||[]};
    const citationEvidence=passages.map(p=>({ref_id:p.ref_id,text:p.text}));
    let claimVerdicts:Record<string,{choice:string;confidence:number}>={};
    let claimRoles:Record<string,{choice:string;confidence:number}>={};
    const reviewRounds:Array<{provider?:string;report?:unknown;issues:string[]|null;checks:Record<string,{choice:string;confidence:number}>;context_key?:string;integrity?:Array<{claim_id:string;code:string}>;changed_claims?:string[]}>=[];
    durationRagMs = Date.now() - t0Rag;
    onProgress?.({ stage: 'preparing' });
    const canUseDecisionCalculation = applyDecision && decisionFrame && decisionEvaluation?.status === 'ANSWERED' &&
      !decisionFrame.tax_period.event_date &&
      (!businessClassification.calculationShape || ['SINGLE','COMPOSITE'].includes(businessClassification.calculationShape)) &&
      (!businessClassification.methodContext || ['UNSPECIFIED','INCOME_ACTIVE'].includes(businessClassification.methodContext) || businessClassification.taxFocus === 'vat') &&
      decisionFrame.tax_period.years.length === 1 &&
      decisionFrame.facts.revenue_basis === 'ANNUAL' &&
      (decisionFrame.residency.value === 'RESIDENT' || businessClassification.taxFocus === 'vat') &&
      ['HOUSEHOLD_BUSINESS', 'INDIVIDUAL_BUSINESS'].includes(decisionFrame.taxpayer_type.value) &&
      ['GOODS_SALES', 'SERVICE', 'FREELANCE_SERVICE', 'FOOD_SERVICE'].includes(decisionFrame.income_type[0]?.value || '') &&
      ['TAX_CALCULATION', 'RELIEF_REDUCTION', 'EXEMPTION_ELIGIBILITY'].includes(decisionFrame.tax_intent.primary.value) &&
      decisionFrame.tax_intent.secondary.every(intent => ['RELIEF_REDUCTION', 'COMPARE_PERIODS'].includes(intent)) &&
      !decisionFrame.facts.platform_fee_vnd &&
      !decisionFrame.facts.shipping_cod_vnd && !decisionFrame.missing_facts.some(fact => fact.blocking) &&
      !(decisionFrame.facts.vat_relief_assumed && decisionFrame.tax_period.years[0] !== 2026) &&
      !(decisionFrame.tax_intent.primary.value === 'RELIEF_REDUCTION' &&
        /gtgt|204\/2025/i.test(message) && !decisionFrame.facts.vat_relief_assumed) &&
      !['PROJECTED', 'PARTIAL_PERIOD', 'TRANSACTION'].includes(businessClassification.revenueContext || '');
    const useBroadContext = businessClassification.answerPurpose!=='DEFINITION' && !['PROJECTED', 'PARTIAL_PERIOD', 'TRANSACTION'].includes(businessClassification.revenueContext || '') &&
      !['REVENUE_TIMING', 'REVENUE_COMPOSITION', 'REVENUE_OWNERSHIP', 'VAT_METHOD_CLASSIFICATION', 'BUSINESS_EXPENSES', 'INVOICE_CORRECTION', 'BUSINESS_REGISTRATION', 'TAX_REGISTRATION', 'REGISTRATION_COMPARISON', 'REGISTRATION_REQUIREMENTS', 'SYSTEM_REGISTRATION', 'PORTAL_TROUBLESHOOTING', 'TAX_SOFTWARE_SYSTEM'].includes(businessClassification.topic || '');
    // Every substantive answer is generated by the LLM; the engine only supplies calculations.
    let legalCitations = retrievedCitations;
    const decisionStatus = structuredDecision?.decision_status || 'NO_BASIS';
    // Guard chủ đề PENDING: chèn disclaimer vào prompt, không để model chốt cứng
    const pendingTopics = matchPendingTopics(message);
    const pendingNotice = pendingTopics.length
      ? `CHỦ ĐỀ CHƯA XÁC MINH: ${pendingTopics.map((t) => t.disclaimer).join(' ')} Chỉ trình bày các cách hiểu có thể dựa trên trích lục, nêu rõ điểm chưa chắc chắn, KHÔNG chốt cứng một đáp án duy nhất.\n`
      : '';
    const reasoningEffort = selectReasoningEffort(message, businessClassification, decisionFrame);
    const retrievalTrace = {
      method: vectorHits?.length
        ? (routeId ? 'Hybrid (BM25 + Vectorize + Định tuyến)' : 'Hybrid (BM25 + Vectorize)')
        : (routeId ? 'BM25 và định tuyến câu hỏi' : 'BM25'),
      vectorHitsCount: vectorHits?.length || 0,
      reasoningEffort,
      period: { years: answerScope.years, source: answerScope.periodSource },
      subrequests:decisionFrame.requests,
      requestEvidenceCoverage,
      requestEvidence:passages.map(p=>({evidence_id:p.id,ref_id:p.ref_id,request_ids:p.request_ids})),
      pendingTopics: pendingTopics.map((t) => t.id),
      decision: decisionFrame ? {
        layer: decisionFrame.meta.layer,
        model: decisionFrame.meta.l2_used ? (businessProvider.name.includes('jev') ? 'JEV (TypeSafe AI)' : 'Quyet-1.0-Large (FPT Cloud AI)') : 'L1 Deterministic Rules',
        taxpayer: decisionFrame.taxpayer_type.value,
        intent: decisionFrame.tax_intent.primary.value,
        income: decisionFrame.income_type[0]?.value,
        incomeTypes: decisionFrame.income_type.map(x => x.value),
        secondaryIntents: decisionFrame.tax_intent.secondary,
        topic: businessClassification.topic,
        answerPurpose: businessClassification.answerPurpose??'OTHER',
        subjectContext:businessClassification.subjectContext??'UNKNOWN',
        registrationStatus:businessClassification.registrationStatus??'UNKNOWN',
        sourceCoverage:{periodFallback:!!retrievalPlan?.period_fallback,required:results.filter(r=>r.required).map(r=>({ref:r.chunk.ref_id||r.chunk.id,reason:r.required})),
          provided:includedRefs,missingDocuments:missingDocumentRefs,missingRequired:missingRequiredRefs},
        abcCategory,
        revenueContext: businessClassification.revenueContext,
        policyFocus: businessClassification.policyFocus??'UNSPECIFIED',
        taxFocus: businessClassification.taxFocus,
        vatRelief: businessClassification.vatRelief,
        invoicePeriod: businessClassification.invoicePeriod,
        calculationShape: businessClassification.calculationShape,
        methodContext: businessClassification.methodContext,
        explicitVatRate: decisionFrame.facts.vat_rate_explicit,
        revenueVnd: decisionFrame.facts.revenue_vnd,
        confidence: Math.round(decisionFrame.meta.confidence * 100) / 100,
        status: decisionStatus,
        risk: structuredDecision?.risk_level,
      } : undefined,
      evidence: relevantChunks.map((chunk) => ({
        title: (chunk.text.match(/^##\s*(?:16\.\d+\.\s*)?(.+)$/m)?.[1] || chunk.section)
          .replace(/[*`]/g, '').slice(0, 150),
        conditional: chunk.tier === 'VERIFIED_CONDITIONAL',
        providedToModel: includedRefs.includes(chunk.ref_id || ''),
      })),
      excludedEvidence: gated?.evidenceItems.filter(item => item.evidence_relation === 'NOT_RELEVANT').map(item => item.ref_id) || [],
      ruleIds: decisionEvaluation?.rule_outcomes.map(outcome => outcome.rule_id) || [],
    };

    const decisionPrefix = applyDecision && decisionFrame?.meta?.l2_used ? (businessProvider.name.includes('jev') ? 'JEV + ' : 'Quyet-1.0-Large + ') : '';
    let aiText = '';
    let generationPrompt = '';
    const generationRuns: Array<Record<string,unknown>> = [];
    let source = relevantChunks.length === 0
      ? 'Chưa tìm thấy căn cứ'
      : routeId ? `${decisionPrefix}RAG Hybrid (${routeId})` : `${decisionPrefix}RAG Hybrid (BM25)`;

    const abcPromptGuidance = abcCategory ? `
HƯỚNG DẪN TRẢ LỜI THỦ TỤC / GỠ LỖI (NHÓM ${abcCategory}):
- Hướng dẫn từng bước theo yêu cầu thực tế; phân biệt thủ tục thuế với đăng ký kinh doanh dựa trên bằng chứng.
- Mọi thời hạn, biểu mẫu, điều kiện, nghĩa vụ và cơ quan tiếp nhận phải có trong bằng chứng đúng kỳ áp dụng. Phân loại chỉ là gợi ý truy xuất.
- Dẫn đúng văn bản hoặc tài liệu thao tác đã sử dụng. Không tự tạo menu, mã lỗi, địa chỉ liên hệ hay quy trình.
- Trả lời đầy đủ phần đã có căn cứ; phần chưa đủ phải nêu rõ thông tin thiếu và cách xác minh tiếp theo.` : '';

    // --- BƯỚC 2: LLM GENERATION VỚI MUSE SPARK API (META AI) ---
    let isSystemError = false;
    let generationFailure: string | undefined;
    if (!aiText && ragContextText) {
      const broadSystemPrompt = `${TONE_GUIDANCE}
${scopeInstructions(answerScope)}
${intentInstructions(message)}
${groundedAnswerPolicy(businessClassification)}
PHÂN LOẠI NGỮ NGHĨA (gợi ý, không phải kết luận pháp lý): ${JSON.stringify(businessClassification)}
${answerContract(businessClassification)}${abcPromptGuidance}
${pendingNotice}
${canUseDecisionCalculation && decisionEvaluation ? `RULES ENGINE: ${decisionEvaluation.explanation}` : ''}
${analyzeAmounts(message)}
BẰNG CHỨNG:
${ragContextText}`;
      const focusedPrompt = `${TONE_GUIDANCE}
${scopeInstructions(answerScope)}
${groundedAnswerPolicy(businessClassification)}
${answerContract(businessClassification)}${abcPromptGuidance}
${pendingNotice}
${analyzeAmounts(message)}
BẰNG CHỨNG:
${ragContextText}`;
      const baseSystemPrompt = useBroadContext && (!businessClassification.policyFocus||businessClassification.policyFocus==='UNSPECIFIED') ? broadSystemPrompt : focusedPrompt;
      const systemPrompt = (workflowEvidence ? baseSystemPrompt + '\n\n' + workflowEvidence : baseSystemPrompt)+'\n'+groundingInstructions(groundingPacket.requests)+'\n'+calculationInstructions(decisionFrame,decisionEvaluation);
      generationPrompt = systemPrompt;
      // ƯU TIÊN 1: Gọi LLM (Meta Muse API trực tiếp) nếu có key
      const museKey = env.MUSE_API_KEY;
      if (museKey) {
        const t0Gen = Date.now();
        budget.startGeneration();
        onProgress?.({ stage: 'generating' });

        const genModel = 'muse-spark-1.3-contributor';
        const genEndpoint = 'https://api.meta.ai/v1/responses';
        let scopeRetry='';
        const assessDraft=async(run:Record<string,unknown>)=>{
          if(!aiText)return false;
          const arithmetic=resolveCalculations(aiText,passages.map(p=>p.id));
          run.arithmetic={calculations:arithmetic.records,issues:arithmetic.issues};
          if(arithmetic.issues.length){
            aiText='';generationFailure='MODEL_CALCULATION_INVALID';
            scopeRetry='\nCông cụ số học chưa thực hiện được: '+JSON.stringify(arithmetic.issues)+'. Viết lại phép tính đúng cú pháp, dùng evidence_id đã cung cấp và giữ nguyên dữ kiện/điều kiện. Không tự thay bằng một số chưa kiểm tra.';
            return true;
          }
          aiText=arithmetic.text;
          if(!decisionApiKey)return false;
          const assessor=new JevDecisionProvider(decisionApiKey,decisionEndpoint,Math.min(12000,budget.generation()),decisionModel);
          const assessment=await assessor.assessAnswerScope(message,aiText,ragContextText,history,businessClassification);
          run.scope_assessment=assessment;
          console.log('[SEMANTIC_SCOPE_ASSESSMENT]',JSON.stringify({attempt:run.attempt,...assessment}));
          if(assessment.status!=='REPAIR')return false;
          aiText='';generationFailure='MODEL_SCOPE_MISMATCH';
          scopeRetry='\nBản trước không đạt các mục đối chiếu ngữ nghĩa: '+JSON.stringify(assessment.issues)+
            '. Hãy giải quyết đúng yêu cầu, giữ vai trò dữ kiện và phạm vi nguồn. Không sửa chỉ để thêm từ/cụm từ; không tự bổ sung điều kiện đã thỏa.\n'+answerContract(businessClassification);
          return true;
        };

        for (let attempt = 1; attempt <= 2 && !aiText && budget.generation() > 500; attempt++) {
          try {
            const inputDigest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({systemPrompt:systemPrompt+scopeRetry,history,message}))))).map(b=>b.toString(16).padStart(2,'0')).join('');
            const run:Record<string,unknown>={pipeline:PIPELINE_VERSION,provider:'meta',model:genModel,
              attempt,input_sha256:inputDigest,temperature:null,seed:null,sampling:'PROVIDER_DEFAULT_UNSPECIFIED',
              reasoning_effort:reasoningEffort,refs:includedRefs,policyFocus:businessClassification.policyFocus,
              revenueContext:businessClassification.revenueContext};
            generationRuns.push(run);
            console.log('[GENERATION_RUN]',JSON.stringify(run));
            if (attempt > 1) await new Promise(r => setTimeout(r, attempt * 250));
            {
              const modelRequest = buildMuseRequest(systemPrompt+scopeRetry, history, message, false, genModel, reasoningEffort);
              modelRequest.max_output_tokens = 16000;
              const museRes = await fetch(genEndpoint, {
                method: 'POST',
                headers: { Authorization: `Bearer ${museKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(modelRequest),
                signal: AbortSignal.timeout(budget.generation()),
              });
              if (museRes.ok) {
                const museData: any = await museRes.json();
                Object.assign(run,{response_id:museData.id,returned_model:museData.model,system_fingerprint:museData.system_fingerprint??null,usage:museData.usage});
                console.log('[GENERATION_RESULT]',JSON.stringify(run));
                const msgOutput = (museData?.output || []).find((item: any) => item.type === 'message' && item.content);
                const outText = msgOutput?.content?.[0]?.text?.trim();
                if (outText && outText.length > 15) {
                  aiText = outText;
                  source = `Muse Spark 1.3 (Meta AI) + ${source}`;
                } else {
                  generationFailure = 'MODEL_EMPTY';
                  console.warn('[MODEL_EMPTY]', JSON.stringify({ model: genModel, attempt, routeId, refs: relevantChunks.map(c => c.ref_id) }));
                }
                if(await assessDraft(run))continue;
                break;
              }
              const body = (await museRes.text()).slice(0, 300);
              generationFailure = `MODEL_HTTP_${museRes.status}`;
              console.warn('[MODEL_HTTP_ERROR]', JSON.stringify({ model: genModel, status: museRes.status, body, attempt, routeId, refs: relevantChunks.map(c => c.ref_id) }));
              if (museRes.status !== 429 && museRes.status !== 404 && museRes.status < 500) break;
            }
          } catch (errGen: any) {
            generationFailure = ['TimeoutError','AbortError'].includes(errGen?.name) ? 'MODEL_TIMEOUT' : 'MODEL_REQUEST_ERROR';
            console.error('[MODEL_REQUEST_ERROR]', JSON.stringify({ model: genModel, error: errGen?.name || 'Error', detail: errGen?.message, attempt, routeId, refs: relevantChunks.map(c => c.ref_id) }));
            if (generationFailure === 'MODEL_TIMEOUT' || Date.now() - tStart >= 85000) break;
          }
        }
        durationGenMs = Date.now() - t0Gen;
      } else {
        generationFailure = 'MODEL_UNCONFIGURED';
        console.warn('[MODEL_UNCONFIGURED]', JSON.stringify({ routeId, refs: relevantChunks.map(c => c.ref_id) }));
      }

      // Không dùng model dự phòng khi Muse Spark lỗi theo yêu cầu nghiêm ngặt (chỉ dùng Muse Spark)
    }

    if(aiText){const parsed=parseGroundedAnswer(aiText,passages,groundingPacket.requests);aiText=parsed.text;groundingPacket=parsed.packet;}
    // Preserve generated wording and source mappings. Legacy keyword/example
    // rewrites cannot replace a claim; use structured rules or reviewed edits.

    // Nếu mô hình không khả dụng và không có answer guard, thử render từ Rules Engine
    let llmOk = !!aiText;
    if (!aiText) {
      if (!aiText) {
        if (relevantChunks.length > 0) {
          aiText = ['MODEL_SCOPE_MISMATCH','MODEL_CALCULATION_INVALID'].includes(generationFailure||'')
            ? 'Bản trả lời vừa tạo chưa giữ đúng chính sách hoặc điều kiện doanh thu bạn nêu, nên mình chưa gửi kết luận đó. Bạn vui lòng thử lại.'
            : 'Mình đang bị gián đoạn kết nối một chút, bạn thử lại sau ít phút nhé.';
          source = 'system_connection_error';
          isSystemError = true;
        } else if (abcCategory) {
          aiText = 'Lưu ý (chưa có tài liệu chính thức, cần đối chiếu thêm): Kho tri thức hiện chưa có tài liệu hướng dẫn chính thức hoặc bảng mã lỗi kỹ thuật chi tiết cho thao tác/sự cố này. Bạn vui lòng kiểm tra trực tiếp hướng dẫn tại Cổng Thuế điện tử (thuedientu.gdt.gov.vn / canhan.gdt.gov.vn), ứng dụng eTax Mobile hoặc liên hệ bộ phận hỗ trợ CNTT của cơ quan thuế quản lý / nhà cung cấp chữ ký số để được tra cứu và hỗ trợ chính xác nhé.';
        } else {
          aiText = `Mình chưa tìm thấy căn cứ đủ chắc cho câu hỏi này. Bạn cho mình biết thêm doanh thu năm, ngành nghề và bán trên kênh nào (sàn TMĐT, cửa hàng, dịch vụ) nhé. Nếu cần chắc chắn, bạn có thể đặt lịch tư vấn với chuyên viên.`;
        }
      }
    }

    // Dọn dẹp nếu model vẫn sinh ra thẻ suy luận sót lại
    aiText = aiText.replace(/(?:<thinking>|\[SUY_LUAN\])[\s\S]*?(?:<\/thinking>|\[\/SUY_LUAN\])/i, '').trim();
    // --- BƯỚC 3: ANSWER VALIDATOR (LEGAL COMPLIANCE GUARD) ---
    let validationPass = isSystemError || !applyDecision || !decisionFrame;
    let validationStatus = 'SKIPPED';
    if (!isSystemError && decisionFrame) {
      const applicableEvaluation = canUseDecisionCalculation && decisionEvaluation?.status === 'ANSWERED'
        ? decisionEvaluation : undefined;
      const valReport = validateAnswer(aiText, decisionFrame, applicableEvaluation, message);
      const validatorChangedText=!!valReport.repairedText&&valReport.repairedText!==aiText;
      validationStatus = valReport.status;
      if (valReport.repairedText) {
        aiText = valReport.repairedText;
      }
      if (applyDecision && valReport.status === 'DOWNGRADE') {
        if (valReport.reasons.some(r => r.includes('0,5%') || r.includes('Không có câu trả lời'))) {
          aiText = 'Mình chưa thể xác minh chắc chắn kết quả tính thuế từ tài liệu hiện có. Bạn vui lòng thử lại hoặc trao đổi với chuyên viên thuế.';
          legalCitations = [];
        } else {
          aiText = valReport.repairedText || aiText;
        }
      }
      if (applyDecision) validationPass = validateAnswer(aiText, decisionFrame,
        canUseDecisionCalculation && decisionEvaluation?.status === 'ANSWERED' ? decisionEvaluation : undefined, message).status !== 'DOWNGRADE';
      if (validationPass && validationStatus === 'REPAIR') validationStatus = validatorChangedText?'PASS_AFTER_REPAIR':'REVIEW_REQUIRED';
    }
    if (isSystemError) {
      legalCitations = [];
    } else {
      const citationCheck = validateLegalCitations(message, aiText, legalCitations, answerScope, citationEvidence, businessClassification);
      aiText = citationCheck.answer;
      legalCitations = citationCheck.citations;
    }

    let semanticReviewPassed = isSystemError;
    let semanticReviewIssues: string[] | null = null;
    let reviewFailureCode:string|undefined;
    let reviewMissingFact: string | undefined;

    let repairTrace: {
      turn1Draft: string;
      turn1Issues: string[] | null;
      turn2Repaired?: string;
      turn2Issues?: string[] | null;
    } | null = null;
    if (applyDecision && !isSystemError && aiText && generationPrompt && decisionApiKey) {
      const useMuseReview=businessClassification.answerPurpose==='DEFINITION'&&!!env.MUSE_API_KEY;
      budget.startReview();
      const reviewBudget=()=>budget.review();
      const reviewer = useMuseReview?new MuseEvidenceReviewer(env.MUSE_API_KEY!,reviewBudget()):new JevDecisionProvider(decisionApiKey, decisionEndpoint,reviewBudget(), decisionModel);
      onProgress?.({ stage: 'reviewing' });
      const fullReviewEvidence = [
        `KỲ TÍNH THUẾ XÉT NGHĨA VỤ: Năm ${answerScope.years.join(', ')} (xác định tại thời điểm ngày ${answerScope.today}). Chỉ áp dụng các văn bản và ngưỡng có hiệu lực trong kỳ này.`,
        ragContextText,
        workflowEvidence,
        analyzeAmounts(message),
        "YÊU CẦU BAO PHỦ: " + answerContract(businessClassification)
      ].filter(Boolean).join('\n\n');

      const t0Rev1 = Date.now();
      // Guards may have changed prose after generation; invalidate stale mappings.
      if(groundingPacket.claims.map(c=>c.text).join('\n\n')!==aiText)groundingPacket=parseGroundedAnswer(aiText,passages,groundingPacket.requests).packet;
      const issues = await reviewer.reviewAnswer(message, aiText, fullReviewEvidence, history, businessClassification,groundingPacket);
      if('lastReviewedPacket' in reviewer&&reviewer.lastReviewedPacket)groundingPacket=reviewer.lastReviewedPacket;
      reviewFailureCode=reviewer.failureCode;
      claimVerdicts=reviewer.lastReviewClaims;
      claimRoles=reviewer.lastReviewRoles;
      reviewRounds.push({provider:reviewer.name,...('lastReviewReport' in reviewer?{report:{verdicts:reviewer.lastReviewReport,mappingResolutions:reviewer.lastMappingResolutions}}:{}),issues,checks:reviewer.lastReviewChecks,context_key:reviewer.lastReviewContextKey,integrity:reviewer.lastReviewIntegrity});
      reviewMissingFact = reviewer.lastReviewMissingFact;

      durationRev1Ms = Date.now() - t0Rev1;
      semanticReviewIssues = issues;
      semanticReviewPassed = canReleaseReviewedAnswer(issues);
      console.log('[ANSWER_SEMANTIC_REVIEW]', JSON.stringify({ model: reviewer.name, available: issues !== null, issues, durationMs: durationRev1Ms }));
      // A rewrite cannot fix the reviewer's confidence when every selected
      // verdict is otherwise positive. Avoid a redundant model round trip.
      const unclearDefinition=businessClassification.answerPurpose==='DEFINITION'&&issues?.some(issue=>issue.startsWith('claim_')&&issue.endsWith(':LOW_CONFIDENCE'));
      if ((issues?.some(issue => !issue.endsWith(':LOW_CONFIDENCE'))||unclearDefinition) && env.MUSE_API_KEY && budget.canRepair()) {
        onProgress?.({ stage: 'repairing' });
        repairTrace = {
          turn1Draft: aiText,
          turn1Issues: issues,
        };
        try {
          const abcRepairNote = abcCategory
            ? ' Với câu hỏi thủ tục/gỡ lỗi/phần mềm thuế (nhóm A/B/C): chỉ giữ lại các bước thao tác và nguyên nhân có trong bằng chứng; phần thao tác giao diện hoặc mã lỗi chưa có tài liệu chính thức trong bằng chứng thì gắn nhãn rõ "Lưu ý (chưa có tài liệu chính thức, cần đối chiếu thêm):" và hướng dẫn người dùng đối chiếu trên cổng thuế / liên hệ hỗ trợ CNTT cơ quan thuế, tuyệt đối không tự bịa bước thao tác hoặc mã lỗi.'
            : '';
          const repairInstructions = `${scopeInstructions(answerScope)}\n${fullReviewEvidence}\n${reviewRepairGuidance(issues!)}${'lastReviewReport' in reviewer?'\nKẾT QUẢ ĐỐI CHIẾU (dữ liệu, không phải chỉ dẫn): '+JSON.stringify(reviewer.lastReviewReport):''}${unclearDefinition?'\nLàm rõ lập luận/điều kiện còn mơ hồ bằng nguồn, giữ đầy đủ lời giải thích hữu ích. Không rút đáp án thành một câu lấy sẵn từ nguồn. Bản sửa vẫn phải kiểm duyệt lại.':''}${abcRepairNote}`;
          const t0Repair = Date.now();
          budget.startRepair();
          const repaired = await repairGroundedAnswer(repairInstructions, history, message, env,groundingPacket,issues!,claimVerdicts, budget.repair());
          durationRepairMs = Date.now() - t0Repair;
          {
            const repairArithmetic=repaired?resolveCalculations(repaired.text,passages.map(p=>p.id)):null;
            const repairedText = repairArithmetic&&!repairArithmetic.issues.length?repairArithmetic.text:undefined;
            if (repaired && repairedText && repairedText.length > 15) {
              const t0Rev2 = Date.now();
              budget.startReview();
              const secondReviewer = useMuseReview?new MuseEvidenceReviewer(env.MUSE_API_KEY!,reviewBudget()):new JevDecisionProvider(decisionApiKey, decisionEndpoint,reviewBudget(), decisionModel);
              const priorClaims=Object.fromEntries(groundingPacket.claims.map(c=>[c.id,{text:c.text,evidence_ids:c.evidence_ids,request_ids:c.request_ids,context_key:reviewer.lastReviewContextKey,...claimVerdicts[c.id]}]));
              const remainingIssues = await secondReviewer.reviewAnswer(message, repairedText, fullReviewEvidence, history, businessClassification,repaired.packet,priorClaims);
              reviewFailureCode=secondReviewer.failureCode;
              groundingPacket='lastReviewedPacket' in secondReviewer&&secondReviewer.lastReviewedPacket?secondReviewer.lastReviewedPacket:repaired.packet;claimVerdicts=secondReviewer.lastReviewClaims;claimRoles=secondReviewer.lastReviewRoles;
              reviewRounds.push({provider:secondReviewer.name,...('lastReviewReport' in secondReviewer?{report:secondReviewer.lastReviewReport}:{}),issues:remainingIssues,checks:secondReviewer.lastReviewChecks,context_key:secondReviewer.lastReviewContextKey,integrity:secondReviewer.lastReviewIntegrity,changed_claims:repaired.changes});
              Object.assign(repairTrace,{changedClaims:repaired.changes,checksRound1:reviewer.lastReviewChecks,checksRound2:secondReviewer.lastReviewChecks});
              reviewMissingFact = secondReviewer.lastReviewMissingFact;

              durationRev2Ms = Date.now() - t0Rev2;
              semanticReviewIssues = remainingIssues;
              const repairedValidation = validateAnswer(repairedText, decisionFrame,
                canUseDecisionCalculation && decisionEvaluation?.status === 'ANSWERED' ? decisionEvaluation : undefined, message);
              const isValidationAcceptable = repairedValidation.status !== 'DOWNGRADE'&&(!repairedValidation.repairedText||repairedValidation.repairedText===repairedText);
              const candidateText = repairedValidation.repairedText || repairedText;
              repairTrace.turn2Repaired = candidateText;
              repairTrace.turn2Issues = remainingIssues;
              if (canReleaseReviewedAnswer(remainingIssues) && isValidationAcceptable) {
                aiText = candidateText;
                const repairedCitations = validateLegalCitations(message, aiText, legalCitations, answerScope, citationEvidence, businessClassification);
                legalCitations = repairedCitations.citations;
                semanticReviewPassed = true;
                source = `Semantic review repaired (${repaired?.provider}) + ${source}`;
              }
              console.log('[ANSWER_REPAIR_REVIEW]', JSON.stringify({ issues: remainingIssues }));
            }
          }
        } catch (e: any) { console.warn('[ANSWER_REPAIR_ERROR]', e?.name || 'request_failed'); }
      }
    }
    // Only a fully reviewed LLM answer may be released as legal guidance.
    let blockGate: 'NONE' | 'NO_EVIDENCE_CHUNKS' | 'ANSWER_VALIDATOR_DOWNGRADE' | 'SEMANTIC_REVIEW_FAILED' | 'REVIEW_PROVIDER_UNAVAILABLE' =
      relevantChunks.length === 0 ? 'NO_EVIDENCE_CHUNKS' : 'NONE';
    if (applyDecision && !semanticReviewPassed && !isSystemError) {
      if (semanticReviewIssues === null) {
        // An unavailable reviewer is not a positive legal verdict. Arithmetic
        // or a document name alone cannot certify applicability.
          aiText = UNVERIFIED_ANSWER;
          legalCitations = [];
          source = reviewFailureCode?.startsWith('REVIEW_') ? 'Review budget exceeded' : 'Review provider unavailable';
          if(reviewFailureCode?.startsWith('REVIEW_'))aiText='Câu trả lời cần kiểm tra vượt giới hạn xử lý của lượt này. Bạn có thể tách câu hỏi thành từng phần; lượt hỏi này không bị trừ.';
          blockGate = 'REVIEW_PROVIDER_UNAVAILABLE';
          if (retrievalTrace.decision) retrievalTrace.decision.status = 'NEEDS_LEGAL_REVIEW';
      } else {
        const hasFatalViolation = semanticReviewIssues.some(i => i.endsWith(':CONTRADICTED') || i.endsWith(':INVENTED'));
        const finalValidation = validateAnswer(aiText, decisionFrame,
          canUseDecisionCalculation && decisionEvaluation?.status === 'ANSWERED' ? decisionEvaluation : undefined, message);
        const finalValidationPass = finalValidation.status !== 'DOWNGRADE';
        if (!canReleaseReviewedAnswer(semanticReviewIssues) || !finalValidationPass) {
          console.warn('[ANSWER_REVIEW_BLOCKED]', JSON.stringify({
            hasFatalViolation,
            validationReasons: finalValidation.reasons,
            issues: semanticReviewIssues,
            abcCategory,
          }));
          // Failed semantic review is an operational failure, never an assembled legal answer.
          aiText = UNVERIFIED_ANSWER;
          legalCitations = [];
          source = 'Answer review blocked';
          blockGate = !finalValidationPass ? 'ANSWER_VALIDATOR_DOWNGRADE' : 'SEMANTIC_REVIEW_FAILED';
          if (retrievalTrace.decision) retrievalTrace.decision.status = 'NEEDS_LEGAL_REVIEW';
        }
      }
    }
    const answerReviewStatus = isSystemError
      ? 'SKIPPED_GENERATION_ERROR'
      : semanticReviewIssues === null
        ? 'SKIPPED_PROVIDER_ERROR'
        : semanticReviewPassed
          ? 'PASS'
          : 'BLOCKED';
    const answerReview = { status: answerReviewStatus, issues: semanticReviewIssues, ...(reviewFailureCode?{diagnosticCode:reviewFailureCode}:{}), ...(reviewMissingFact && reviewMissingFact !== 'NONE' ? { missingFact: reviewMissingFact } : {}) };
    const timings = {
      classifyMs: durationClassifyMs,
      ragMs: durationRagMs,
      generationMs: durationGenMs,
      review1Ms: durationRev1Ms,
      repairMs: durationRepairMs,
      review2Ms: durationRev2Ms,
      totalMs: Date.now() - tStart,
    };
    const abcTelemetry = abcCategory ? {
      abcCategory,
      topic: businessClassification.topic,
      primaryIntent: decisionFrame?.tax_intent.primary.value || businessClassification.primaryIntent,
      routeId,
      matchedRefs: relevantChunks.map(c => c.ref_id).filter(Boolean),
      usedVerifiedTemplate: false,
      blocked: aiText === UNVERIFIED_ANSWER || blockGate !== 'NONE',
      blockGate,
      validationStatus,
      reviewStatus: answerReviewStatus,
      reviewIssues: semanticReviewIssues,
    } : undefined;
    if (abcTelemetry) {
      console.log('[ABC_GROUP_TELEMETRY]', JSON.stringify(abcTelemetry));
    }
    if (retrievalTrace.decision) Object.assign(retrievalTrace.decision, { answerReview, timings, ...(abcTelemetry ? { abcTelemetry } : {}) });
    Object.assign(retrievalTrace, { answerReview, timings,reviewRounds,claimEvidence:groundingPacket.claims.map(c=>({...c,verification:claimVerdicts[c.id]||null,role:claimRoles[c.id]||null})), ...(repairTrace ? { repairTrace } : {}), ...(abcTelemetry ? { abcTelemetry } : {}) });
    console.log('[CHAT_TIMINGS]', JSON.stringify({ message: message.slice(0, 50), ...timings }));

    // Kiểm tra hậu kỳ đối với câu hỏi năm cũ (< 2026)
    let logD1Prefix = '';
    if (answerScope.years.some((y) => y < 2026)) {
      const normAi = aiText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
      const mentions1B = normAi.includes('1 ty') || aiText.includes('1 tỷ');
      const mentions100M = normAi.includes('100 trieu') || aiText.includes('100 triệu');
      if (mentions1B && !mentions100M) {
        console.warn(`[POST_CHECK_WARN] Năm < 2026 nhưng phản hồi nhắc 1 tỷ mà không nhắc 100 triệu: "${message}"`);
        logD1Prefix = '[WARN_THRESHOLD_MISMATCH] ';
      }
    }

    let canonicalPayload: any = {
      success: true,
      response: aiText,
      source,
      citations: legalCitations,
      retrieval: retrievalTrace,
      ...(isSystemError ? { diagnostic_code: generationFailure || 'MODEL_UNAVAILABLE' } : {}),
      matchedRefs: matchedRoute?.refs || [],
    };
    const isCleanReview = semanticReviewIssues !== null && semanticReviewIssues.length === 0;
    if (cacheable && !isSystemError && llmOk && validationPass && (semanticReviewPassed && isCleanReview) &&
        !pendingTopics.length && (!applyDecision || ['ANSWERABLE_VERIFIED', 'ANSWERABLE_WITH_EVIDENCE', 'CONDITIONAL'].includes(decisionStatus))) {
      if (env.DB) {
        // The first completed answer wins even when web and MCP ask concurrently.
        await env.DB.prepare('INSERT OR IGNORE INTO answer_cache (cache_key, payload) VALUES (?, ?)')
          .bind(hash, JSON.stringify(canonicalPayload)).run();
        const row = await env.DB.prepare('SELECT payload FROM answer_cache WHERE cache_key = ?')
          .bind(hash).first() as { payload: string } | null;
        if (!row?.payload) throw new Error('Answer cache did not retain the canonical result');
        canonicalPayload = JSON.parse(row.payload);
      } else {
        await caches.default.put(cacheKey, new Response(JSON.stringify(canonicalPayload), {
          headers: { 'Cache-Control': 'max-age=86400', 'Content-Type': 'application/json' },
        }));
      }
    }
    aiText = canonicalPayload.response;
    source = canonicalPayload.source;

    if (env.DB && decisionFrame) {
      ctx.waitUntil(env.DB.prepare('INSERT INTO answer_grounding_traces (id,pipeline_version,trace_json) VALUES (?,?,?)').bind(
        `agt_${crypto.randomUUID()}`,PIPELINE_VERSION,JSON.stringify({requests:decisionFrame.requests,
          evidence:passages.map(p=>({id:p.id,ref_id:p.ref_id,request_ids:p.request_ids,provenance:p.provenance})),
          claims:groundingPacket.claims,verdicts:claimVerdicts,roles:claimRoles,issues:semanticReviewIssues,reviewRounds,repair:repairTrace,
          blockGate,answerReviewStatus,generationRuns})
      ).run().catch((error:any)=>console.warn('[GROUNDING_TRACE_ERR]',error?.message)));
      ctx.waitUntil(env.DB.prepare(
        `INSERT INTO decision_traces (id, mode, decision_status, layer, tax_years, rule_ids, evidence_refs, excluded_refs, validation_status, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        `dt_${crypto.randomUUID()}`, decisionMode, decisionStatus, decisionFrame.meta.layer,
        JSON.stringify(decisionFrame.tax_period.years), JSON.stringify(decisionEvaluation?.rule_outcomes.map(outcome => outcome.rule_id) || []),
        JSON.stringify(relevantChunks.map(chunk => chunk.ref_id).filter(Boolean)),
        JSON.stringify(gated?.evidenceItems.filter(item => item.evidence_relation === 'NOT_RELEVANT').map(item => item.ref_id) || []),
        validationStatus, source
      ).run().catch((error: any) => console.warn('[DECISION_TRACE_ERR]', error?.message)));
    }

    // Blocked drafts, partial answers and clarification do not spend a credit.
    const chargeableAnswer = !isSystemError && blockGate === 'NONE' && validationPass && (semanticReviewPassed || !applyDecision);
    // --- BƯỚC 3: GHI LOG VÀO CLOUDFLARE D1 ---
    if (env.DB && activePhone) {
      ctx.waitUntil(
        env.DB.prepare(
          `INSERT INTO chat_logs (id, user_phone, message, response, credits_used, source)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
          .bind(
            `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            activePhone,
            message,
            logD1Prefix ? `${logD1Prefix}${aiText}` : aiText,
            chargeableAnswer ? 1 : 0,
            logD1Prefix ? `${logD1Prefix}${source}` : source
          )
          .run()
          .catch((e: any) => console.error('log error', e?.message))
      );
    }

    const remainingCredits = chargeableAnswer ? await deductCreditOnce() : (userRecord?.credits ?? 99);
    onProgress?.({ stage: 'finalizing' });
    return respondWithAnswer(canonicalPayload, remainingCredits);
    } finally {
      if (reserved && !deducted) await env.DB.prepare('UPDATE users SET credits = credits + 1, updated_at = CURRENT_TIMESTAMP WHERE phone = ?').bind(activePhone).run();
    }
  }
  return jsonResponse({ success: false, error: 'Method not allowed.' }, 405, corsHeaders);
}
