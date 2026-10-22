const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const modules = new Map();
// Transport parity uses an authenticated synthetic web user; an HTTP header
// is deliberately insufficient to bypass authentication.
modules.set(path.resolve(process.env.TAX_TEST_SOURCE_ROOT || path.resolve(__dirname,'..'),'worker/src/firebaseAuth.ts'),{verifiedFirebasePhone:async()=> 'offline-user'});
const testSourceRoot=process.env.TAX_TEST_SOURCE_ROOT || path.resolve(__dirname,'..');
function load(relativePath) {
  const file = path.resolve(testSourceRoot, relativePath);
  if (modules.has(file)) return modules.get(file);
  if (file.endsWith('.json')) {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { default: parsed, ...parsed };
  }
  const source = fs.readFileSync(file, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'setTimeout', compiled)(
    id => load(path.relative(testSourceRoot, path.resolve(path.dirname(file), id.endsWith('.json') ? id : id + '.ts'))),
    module, module.exports, (callback, ms) => setTimeout(callback, ms).unref(),
  );
  modules.set(file, module.exports);
  return module.exports;
}

const worker = load('worker/src/index.ts').default;
const originalFetch = global.fetch;
const originalCaches = global.caches;
const rows = new Map();
const pending = [];
const ctx = { waitUntil: promise => pending.push(promise) };
const db = {
  prepare(sql) {
    return {
      bind(...values) {
        return {
          async first() {
            if(sql.includes('FROM users'))return {id:'offline-user',phone:'offline-user',credits:100};
            if(sql.startsWith('UPDATE users SET credits = credits - 1'))return {credits:99};
            if(sql.startsWith('SELECT credits'))return {credits:99};
            if (sql.startsWith('SELECT payload FROM answer_cache')) {
              return rows.has(values[0]) ? { payload: rows.get(values[0]) } : null;
            }
            if (sql.startsWith('SELECT COUNT(*) AS n FROM rate_limits')) return { n: 0 };
            throw new Error(`Unexpected SELECT: ${sql}`);
          },
          async run() {
            if(sql.startsWith('UPDATE users SET credits'))return {};
            if(sql.startsWith('INSERT INTO chat_logs'))return {};
            if (sql.startsWith('INSERT OR IGNORE INTO answer_cache')) {
              if (!rows.has(values[0])) rows.set(values[0], values[1]);
              return {};
            }
            if (sql.startsWith('INSERT INTO decision_traces')) return {};
            if (sql.startsWith('INSERT INTO answer_grounding_traces')) return {};
            if (sql.startsWith('INSERT INTO retrieval_stats')) return {};
            if (sql.startsWith('INSERT INTO rate_limits')) return {};
            if (sql.startsWith('DELETE FROM rate_limits')) return {};
            throw new Error(`Unexpected write: ${sql}`);
          },
        };
      },
      async run() {
        if (sql.startsWith('DELETE FROM')) return {};
        throw new Error(`Unexpected statement: ${sql}`);
      },
    };
  },
};

let modelCalls = 0;
let lastModelInput, lastReviewInput;
let scopeLabel = 'IN_SCOPE';
let reviewFailure = false;
let reviewIncomplete = false;
let reviewUnavailable = false;
let generationUnavailable = false;
let reviewCalls = 0;
const semanticOverrides = new Map();
// Model output fixtures belong only to this transport test. The runtime must
// preserve and review them, rather than overwrite them with canned tax prose.
const modelDrafts = new Map();
const concurrentQuestion = 'Năm 2026 hộ kinh doanh khai thuế vào lúc nào?';
let releaseConcurrent;
const concurrentGate = new Promise(resolve => { releaseConcurrent = resolve; });
let concurrentCalls = 0;
global.caches = { default: { match: async () => undefined, put: async () => {} } };
global.fetch = async (_url, init) => {
  const input = JSON.parse(init.body);
  if (String(_url).includes('mkp-api.fptcloud.com')) {
    if (input.questions.facts) { reviewCalls++; lastReviewInput=input; }
    assert.equal(String(_url), 'https://mkp-api.fptcloud.com/v1/systemone');
    if (input.questions.facts && reviewUnavailable) return new Response('',{status:503});
    if(input.questions.facts&&reviewIncomplete){const reply=require('./fixtures/jev_native.cjs')(input,scopeLabel);reply.answers.coverage={type:'choice',choice:'INCOMPLETE',confidence:.99};return Response.json(reply);}
    if (input.questions.facts && reviewFailure) return Response.json({ answers: {
      ...require('./fixtures/jev_native.cjs')(input,scopeLabel).answers,
      facts: { type: 'choice', choice: 'INVENTED', confidence: 0.99 },
      evidence: { type: 'choice', choice: 'SUPPORTED', confidence: 0.99 },
      coverage: { type: 'choice', choice: 'COMPLETE', confidence: 0.99 },
      ...Object.fromEntries(Object.keys(input.questions).filter(key=>key.startsWith('claim_')).map(key=>[key,{type:'choice',choice:'INVENTED',confidence:.99}])),
    } });
    if (input.questions.scope) return Response.json(require('./fixtures/jev_native.cjs')(input, scopeLabel));
    const q = input.state.original_question || input.state.question;
    const fixture = load('worker/src/decision/understandQuery.ts').understandQuery(q, { years: [2026], periodSource: 'current_message' });
    return Response.json(require('./fixtures/jev_native.cjs')(input, scopeLabel, semanticOverrides.get(q) || {
      taxpayer: fixture.taxpayer_type.value, primaryIntent: fixture.tax_intent.primary.value,
      secondaryIntents: fixture.tax_intent.secondary, incomeTypes: fixture.income_type.map(x => x.value),
    }));
  }
  assert.equal(input.stream, false, 'Web SSE and MCP must send the same non-stream model request');
  lastModelInput=input;
  const call = ++modelCalls;
  if (generationUnavailable) return new Response('', { status: 404 });
  if (input.input.at(-1).content[0].text === concurrentQuestion) {
    concurrentCalls += 1;
    if (concurrentCalls === 2) releaseConcurrent();
    await Promise.race([
      concurrentGate,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Concurrent requests did not reach the model together')), 2000)),
    ]);
  }
  const requests=JSON.parse(input.instructions.match(/YÊU CẦU CẦN GIẢI QUYẾT: (\[[^\n]+\])/)?.[1]||'[]');
  const evidenceId=input.instructions.match(/evidence_id=(E\d+)/)?.[1];
  const mapping=evidenceId&&requests[0]?` [[E:${evidenceId};R:${requests[0].id}]]`:'';
  const draft=modelDrafts.get(input.input.at(-1).content[0].text)||`Câu trả lời kiểm thử từ mô hình lần ${call}.`;
  return Response.json({ output: [{ type: 'message', content: [{ text: `${draft}${mapping}` }] }] });
};
const env = { DB: db, MUSE_API_KEY: 'test-fixture', FPT_AI_KEY: 'scope-fixture', DECISION_L2: 'off', DECISION_MODE: 'enforce' };
const question = 'Hộ kinh doanh năm 2026 tính nghĩa vụ thuế như thế nào?';
const webRequest = (message, stream, history = []) => new Request('https://test.local/api/chat', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Internal-Caller': 'mcp' },
  body: JSON.stringify({ message, stream, history }),
});
const mcpRequest = (message, history = []) => new Request('https://test.local/mcp', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'ask_tax_ai', arguments: { question: message, history } } }),
});
async function mcpAnswer(message, history = []) {
  const response = await worker.fetch(mcpRequest(message, history), env, ctx);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.result.isError, false);
  assert.equal(body.result.content[0].text, body.result.structuredContent.answer);
  return body.result.content[0].text;
}
async function streamAnswer(message, history = []) {
  const response = await worker.fetch(webRequest(message, true, history), env, ctx);
  assert.equal(response.status, 200);
  const events = (await response.text()).split('\n\n')
    .filter(part => part.startsWith('data: {')).map(part => JSON.parse(part.slice(6)));
  const deltas = events.filter(event => event.type === 'delta').map(event => event.delta).join('');
  const completed = events.find(event => event.type === 'done').fullText;
  assert.equal(deltas, completed);
  return completed;
}

async function main() {
  if(!process.env.TAX_TEST_WORKFLOW_ONLY){
  const first = await mcpAnswer(question);
  assert.equal(await streamAnswer(question), first);
  const webJson = await (await worker.fetch(webRequest(question, false), env, ctx)).json();
  assert.equal(webJson.response, first);
  assert.equal(await mcpAnswer('  Hộ kinh doanh năm 2026 tính nghĩa vụ thuế như thế nào?  '), first);
  assert.equal(modelCalls, 1, 'Identical independent questions should generate only once');

  const [webConcurrent, mcpConcurrent] = await Promise.all([
    streamAnswer(concurrentQuestion), mcpAnswer(concurrentQuestion),
  ]);
  assert.equal(webConcurrent, mcpConcurrent, 'Concurrent web and MCP requests must use the same D1 winner');
  assert.equal(modelCalls, 3, 'Two concurrent cache misses may generate twice, then converge');

  const history = [
    { role: 'user', content: 'Tôi kinh doanh năm 2026.' },
    { role: 'assistant', content: 'Bạn có thể cho biết ngành nghề?' },
  ];
  const followUp = 'Nếu doanh thu là 500 triệu thì sao?';
  assert.equal(await streamAnswer(followUp, history), await mcpAnswer(followUp, history));
  assert.equal(modelCalls, 4, 'Equivalent history should share one canonical answer');

  const unrelated = 'Thời tiết Hà Nội hôm nay như thế nào?';
  scopeLabel = 'OUT_OF_SCOPE';
  assert.equal(await streamAnswer(unrelated), await mcpAnswer(unrelated), 'Out-of-scope answers must match too');
  assert.equal(modelCalls, 4, 'Out-of-scope answers must not invoke the model');
  scopeLabel = 'IN_SCOPE';

  const methodQuestion = 'Cá nhân cư trú cung cấp dịch vụ sửa chữa, doanh thu 3 tỷ + 1 đồng năm 2026, thu nhập tính thuế hợp lệ 400 triệu; tính thuế TNCN bao nhiêu?';
  modelDrafts.set(methodQuestion,'Nếu phương pháp thu nhập áp dụng cho kỳ này, TNCN trước giảm = 400 triệu × 17% = 68 triệu; khi đủ điều kiện giảm, còn 47.600.000 đồng. Nếu đang theo tỷ lệ và cuối năm mới vượt ngưỡng thì phải xét quy định chuyển từ năm sau.');
  const methodAnswer = await mcpAnswer(methodQuestion);
  assert.match(methodAnswer, /17%/);
  assert.match(methodAnswer, /47\.600\.000 đồng/);
  assert.doesNotMatch(methodAnswer, /0[,.]5%/);
  assert.equal(await streamAnswer(methodQuestion), methodAnswer);

  const sectorQuestion = 'Cá nhân cư trú cung cấp dịch vụ sửa chữa máy vi tính, không bán lẻ tạp hóa, doanh thu 1,5 tỷ năm 2026, thuế GTGT và TNCN bao nhiêu?';
  modelDrafts.set(sectorQuestion,'Sửa máy vi tính có tỷ lệ GTGT gốc 5%: 1,5 tỷ × 5% = 75 triệu đồng trước khi xét giảm GTGT. Nếu đang áp TNCN theo tỷ lệ, phần cơ sở sau mức trừ là 500 triệu; 2% = 10 triệu đồng trước giảm.');
  const sectorAnswer = await mcpAnswer(sectorQuestion);
  assert.match(sectorAnswer, /75 triệu đồng/);
  assert.doesNotMatch(sectorAnswer, /15 triệu đồng/);
  assert.equal(await streamAnswer(sectorQuestion), sectorAnswer);

  const toolsResponse = await worker.fetch(new Request('https://test.local/mcp', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
  }), env, ctx);
  const listed = await toolsResponse.json();
  assert.ok(listed.result.tools[0].inputSchema.properties.history, 'MCP must expose history for context-equivalent requests');

  const vatOnly = 'Hộ tôi cung cấp dịch vụ gắn với hàng hóa, doanh thu tính GTGT cả năm 2026 là 2,4 tỷ đồng. Tỷ lệ GTGT gốc đã xác định là 3%, toàn bộ doanh thu đủ điều kiện giảm 20% mức tỷ lệ theo Nghị quyết 204 và Nghị định 174. Chỉ tính GTGT phải nộp, không tính TNCN.';
  semanticOverrides.set(vatOnly, { taxpayer:'HOUSEHOLD_BUSINESS',primaryIntent:'TAX_CALCULATION',secondaryIntents:['RELIEF_REDUCTION'],incomeTypes:['SERVICE'],taxFocus:'vat',vatRelief:'ELIGIBLE' });
  modelDrafts.set(vatOnly,'GTGT gốc 3%, sau giảm tỷ lệ còn 2,4%; 2,4 tỷ × 2,4% = 57.600.000 đồng.');
  const vatOnlyAnswer = await mcpAnswer(vatOnly);
  assert.match(vatOnlyAnswer, /57[.,]600[.,]000/);
  assert.match(vatOnlyAnswer, /3%/);
  assert.match(vatOnlyAnswer, /2,4%/);
  assert.doesNotMatch(vatOnlyAnswer.split('Căn cứ pháp lý:')[0], /TNCN|19[.,]200[.,]000/);
  assert.equal(await streamAnswer(vatOnly), vatOnlyAnswer);
  const pitOnly = 'Tôi là cá nhân cư trú kinh doanh sửa chữa, doanh thu năm 2026 là 3,6 tỷ, thu nhập tính thuế đã xác định hợp lệ 550 triệu. Đủ điều kiện giảm 30% TNCN theo Nghị quyết 43. TNCN cuối cùng là bao nhiêu? Không tính GTGT.';
  semanticOverrides.set(pitOnly, { taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'TAX_CALCULATION',secondaryIntents:['RELIEF_REDUCTION'],incomeTypes:['SERVICE'],taxFocus:'pit',vatRelief:'UNKNOWN' });
  modelDrafts.set(pitOnly,'Nhánh phương pháp thu nhập: 550 triệu × 17% = 93.500.000 đồng; đủ giảm 30% thì TNCN còn 65.450.000 đồng. Cần giữ điều kiện về phương pháp áp dụng cho kỳ này.');
  const pitOnlyAnswer = await mcpAnswer(pitOnly);
  assert.match(pitOnlyAnswer, /65[.,]450[.,]000/);
  assert.doesNotMatch(pitOnlyAnswer, /GTGT|4\.000000|209[.,]450[.,]000|Điều 3, Điều 4/);
  assert.equal(await streamAnswer(pitOnly), pitOnlyAnswer);
  const frame = load('worker/src/decision/understandQuery.ts').understandClassifiedQuery(pitOnly, {years:[2026],periodSource:'current_message'}, [], semanticOverrides.get(pitOnly));
  assert.equal(frame.facts.vat_relief_assumed, false, 'PIT relief cannot authorize VAT relief');
  const invalid = load('worker/src/decision/answerValidator.ts').validateAnswer('Thuế TNCN: 65.450.000 đồng. Thuế GTGT: 144 triệu đồng.', frame);
  assert.equal(invalid.status, 'DOWNGRADE');
  assert.equal(load('worker/src/answerValidation.ts').canUseVerifiedAnswer(pitOnly,'Thuế TNCN: 65.450.000 đồng. Thuế GTGT: 144 triệu đồng.','pit'),false);

  const compoundSemantic = { taxpayer:'INDIVIDUAL_BUSINESS', primaryIntent:'TAX_CALCULATION', secondaryIntents:['RELIEF_REDUCTION'], incomeTypes:['SERVICE'], topic:'TAX_AMOUNT', revenueContext:'ACTUAL_YEAR', taxFocus:'both', vatRelief:'ELIGIBLE' };
  for (const [q, vatAmount] of [
    ['Cá nhân cư trú sửa máy doanh thu4 tỷ,thu nhập tính thuế hợp lệ500 triệu,tỷ lệGTGTgốc5%,toàn bộ đủ giảmGTGT. Hãy tính riêngGTGT,TNCNtrước/sauNQ43,và đừng lấy chi phí giảm doanh thuGTGT.', '160 triệu'],
    ['Cá nhân cư trú dịch vụ, tổng doanh thu năm 2026 là 4 tỷ, thu nhập tính thuế hợp lệ 500 triệu, tỷ lệ GTGT gốc 3%, toàn bộ đủ điều kiện giảm GTGT. Tính riêng GTGT và TNCN trước/sau NQ43.', '96 triệu'],
    ['Cá nhân cư trú bán hàng, tổng doanh thu năm 2026 là 4 tỷ, thu nhập tính thuế hợp lệ 500 triệu, tỷ lệ GTGT gốc 1%, toàn bộ đủ điều kiện giảm GTGT. Tính riêng GTGT và TNCN trước/sau NQ43.', '32 triệu'],
  ]) {
    const semantic = {...compoundSemantic, incomeTypes: q.includes('bán hàng') ? ['GOODS_SALES'] : ['SERVICE'],
      ...(q.includes('doanh thu4') ? {revenueContext:'UNSPECIFIED',secondaryIntents:['COMPARE_PERIODS']} : {})};
    semanticOverrides.set(q, semantic);
    modelDrafts.set(q,`GTGT: 4 tỷ đồng × tỷ lệ gốc đã xác định × 80% = ${vatAmount} đồng. TNCN nhánh theo thu nhập: 500 triệu đồng × 17% = 85 triệu đồng; nếu đủ NQ43 còn 59,5 triệu đồng. Phải đối chiếu phương pháp đang áp dụng và thời điểm chuyển phương pháp; không lấy chi phí giảm doanh thu GTGT.`);
    const incomplete = load('worker/src/priorityTaxAnswer.ts').answerPriorityTax(q, {years:[2026]});
    assert.ok(incomplete, 'Reproduce priority PIT-only candidate');
    if (q.includes('doanh thu4')) assert.equal(load('worker/src/answerValidation.ts').canUseVerifiedAnswer(q, incomplete.response, 'both', semantic), false,
      'Reject PIT-only priority answer for a compound calculation');
    const callsBeforeCompound = modelCalls;
    const complete = await mcpAnswer(q);
    assert.ok(complete.includes(vatAmount), complete);
    assert.match(complete, /85 triệu/);
    assert.match(complete, /59,5 triệu|59[.,]500[.,]000/);
    assert.match(complete, /4 tỷ đồng ×/);
    assert.match(complete, /500 triệu đồng × 17%/);
    assert.equal(modelCalls, callsBeforeCompound+1, 'Compound answer must be generated and reviewed, preserving all branches');
    assert.equal(await streamAnswer(q), complete);
    const json = await (await worker.fetch(webRequest(q, false), env, ctx)).json();
    assert.equal(json.response, complete);
  }

  const historical='Tôi rà lại nghĩa vụ năm 2025 của cá nhân cư trú bán hàng hóa: tổng doanh thu chịu thuế cả năm 150 triệu, không được giảm GTGT, chưa có khoản đã nộp thay. Tỷ lệ GTGT 1%, TNCN 0,5%. Tính giúp từng loại thuế của năm 2025, không dùng ngưỡng năm 2026.';
  semanticOverrides.set(historical,{taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'TAX_CALCULATION',secondaryIntents:[],incomeTypes:['GOODS_SALES'],taxYears:[2025],taxFocus:'both',vatRelief:'INELIGIBLE'});
  modelDrafts.set(historical,'Theo Điều 10 và Phụ lục I Thông tư 40/2021/TT-BTC, GTGT 150 triệu × 1% = 1.500.000 đồng, TNCN 150 triệu × 0,5% = 750.000 đồng. Tổng 2.250.000 đồng, chưa đối trừ đã nộp.');
  const beforeHistorical=modelCalls;
  const historicalAnswer=await mcpAnswer(historical);
  assert.match(historicalAnswer,/2[.,]250[.,]000/);
  assert.doesNotMatch(historicalAnswer,/Điều [89][, ]+Thông tư 40/);
  assert.equal(modelCalls,beforeHistorical+1,'Historical answer must be generated from period-scoped evidence, not a canned early return');

  reviewFailure = true;
  const cachedBefore = rows.size;
  const callsBefore = modelCalls;
  const blocked = await mcpAnswer('Hộ kinh doanh năm 2026 cần lưu chứng từ gì?');
  assert.equal(blocked, load('worker/src/decision/answerContract.ts').UNVERIFIED_ANSWER,
    'Enforce must not serve the original rejected draft when repair fails');
  assert.equal(modelCalls, callsBefore + 2, 'One bounded repair only');
  assert.equal(rows.size, cachedBefore, 'A still-failing semantic review must not populate the shared answer cache');
  reviewFailure = false;
  reviewIncomplete=true;
  const rowsBeforeIncomplete=rows.size;
  const incomplete=await (await worker.fetch(webRequest('Năm 2026 cá nhân kinh doanh cần đối chiếu hồ sơ kế toán và chứng từ như thế nào?',false),env,ctx)).json();
  assert.equal(incomplete.retrieval.answerReview.status,'PARTIAL_VERIFIED','An incomplete whole answer may return independently reviewed claims, never PASS');
  assert.equal(incomplete.source,'Verified partial answer');
  assert.equal(rows.size,rowsBeforeIncomplete,'Partial answers must not populate the complete-answer cache');
  reviewIncomplete=false;
  const expenseSemantic = { taxpayer:'INDIVIDUAL_BUSINESS', primaryIntent:'ACCOUNTING_BOOKS',secondaryIntents:[],incomeTypes:['UNKNOWN'],topic:'BUSINESS_EXPENSES',taxFocus:'pit' };
  assert.deepEqual(load('worker/src/answerValidation.ts').missingAnswerIntents(
    'Tính TNCN theo thu nhập, hợp đồng vay mang tên người thân thì có được trừ lãi không?',
    'Chưa đủ hồ sơ để xác định chi phí được trừ, cần đối chiếu nghĩa vụ vay.', expenseSemantic), [],
    'Do not append unrelated PIT payment/offset boilerplate to an expense answer');
  assert.deepEqual(load('worker/src/answerValidation.ts').missingAnswerIntents(
    'Hóa đơn điện tử sai giá, xử lý thế nào?', 'Được chọn điều chỉnh hoặc thay thế hóa đơn.',
    {...expenseSemantic,topic:'INVOICE_CORRECTION',taxFocus:'unspecified'}), [],
    'Invoice correction must not trigger an unrelated registration appendix');
  for (const topic of ['REVENUE_OWNERSHIP','REVENUE_THRESHOLD']) {
    const ownershipFrame = load('worker/src/decision/understandQuery.ts').understandClassifiedQuery(
      'Một cá nhân có nhiều hoạt động kinh doanh xét giảm thuế năm 2026 như thế nào?',
      {years:[2026],periodSource:'current_message'}, [], {...expenseSemantic,topic,primaryIntent:'RELIEF_REDUCTION'});
    const plan = load('worker/src/decision/retrievalPlan.ts').buildRetrievalPlan(ownershipFrame);
    assert.ok(plan.must_include_refs.includes('16.39'),'Relief evidence must survive topic routing');
    assert.ok(plan.must_include_refs.includes('16.72') || plan.must_include_refs.includes('16.75'));
  }
  reviewUnavailable = true;
  const unavailable = await mcpAnswer('Cần lưu hồ sơ kinh doanh những gì để đối chiếu?');
  assert.equal(unavailable,load('worker/src/decision/answerContract.ts').UNVERIFIED_ANSWER);
  assert.equal(rows.size,cachedBefore,'Unavailable review must neither release nor cache a draft');
  reviewUnavailable = false;
  generationUnavailable = true;
  const beforeFailedGenerationReview = reviewCalls;
  const failedQuestion = 'Affiliate thu nhập ít có cần mở hộ kinh doanh hay không?';
  semanticOverrides.set(failedQuestion, { taxpayer:'INDIVIDUAL_BUSINESS', primaryIntent:'REGISTRATION', secondaryIntents:[], incomeTypes:['AFFILIATE_COMMISSION'], topic:'BUSINESS_REGISTRATION' });
  const failedResponse = await (await worker.fetch(webRequest(failedQuestion, false), env, ctx)).json();
  assert.equal(failedResponse.source, 'system_connection_error');
  assert.equal(failedResponse.diagnostic_code, 'MODEL_HTTP_404');
  assert.equal(failedResponse.retrieval.decision.answerReview.status, 'SKIPPED_GENERATION_ERROR');
  assert.equal(reviewCalls, beforeFailedGenerationReview, 'Do not spend reviewer tokens on a connection error message');
  generationUnavailable = false;
  const testFetch=global.fetch;
  try {
    let repairCalls=0;
    global.fetch=async()=>{repairCalls++;return new Response('',{status:503});};
    const repaired=await load('worker/src/decision/repairAnswer.ts').repairAnswer('Nguồn và yêu cầu sửa',[], 'Câu hỏi',{
      MUSE_API_KEY:'fixture',AI:{run:async()=>{throw new Error('Should not call other models');}},
    });
    assert.equal(repaired,null,'Must not fall back to other models when Muse fails');
    assert.equal(repairCalls,1);
  } finally {global.fetch=testFetch;}

  }
  const registrationQuestion='Tôi làm dịch vụ sửa máy tính tại nhà khách hàng, hướng dẫn đăng ký thuế trực tiếp cho cá nhân kinh doanh.';
  semanticOverrides.set(registrationQuestion,{taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'REGISTRATION',secondaryIntents:[],incomeTypes:['SERVICE'],topic:'TAX_REGISTRATION',taxFocus:'unspecified'});
  const guideRequest=(message)=>new Request('https://test.local/api/chat',{
    method:'POST',headers:{'Content-Type':'application/json','X-Internal-Caller':'mcp'},
    body:JSON.stringify({message,workflow:'tax_registration'}),
  });
  const beforeGuide=modelCalls, beforeGuideReview=reviewCalls;
  const guideResponse=await (await worker.fetch(guideRequest(registrationQuestion),env,ctx)).json();
  assert(guideResponse.success);
  assert.equal(modelCalls,beforeGuide+1,'Conversational guide must use the model, not a generic registration template');
  assert.equal(reviewCalls,beforeGuideReview+1,'Guide must still pass semantic review');
  assert.equal(lastModelInput.input.at(-1).content[0].text,registrationQuestion);
  assert.match(lastModelInput.instructions,/CHẾ ĐỘ HƯỚNG DẪN/);
  assert.match(lastModelInput.instructions,/9510\/95100/);
  assert.match(JSON.stringify(lastReviewInput),/9510\/95100/,'Reviewer receives the same verified industry source');
  assert(lastReviewInput.state.evidence.length<=14000,'Guide source pack must fit the reviewer evidence budget');
  await Promise.all(pending);
  console.log('Web SSE, web JSON and MCP exact-answer parity checks passed.');
}
const keepAlive = setInterval(() => {}, 1000);
main().catch(error => { console.error(error); process.exitCode = 1; })
  .finally(() => { clearInterval(keepAlive); global.fetch = originalFetch; global.caches = originalCaches; });
