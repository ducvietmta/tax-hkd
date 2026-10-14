const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const modules = new Map();
function load(relativePath) {
  const file = path.resolve(__dirname, '..', relativePath);
  if (modules.has(file)) return modules.get(file);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'setTimeout', compiled)(
    id => load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(file), id + '.ts'))),
    module, module.exports, (callback, ms) => setTimeout(callback, ms).unref(),
  );
  modules.set(file, module.exports);
  return module.exports;
}
const { resolveAnswerScope, scopeInstructions, intentInstructions } = load('worker/src/answerScope.ts');
const { buildConversationRetrievalQuery } = load('worker/src/conversation.ts');
const { retrieve, buildContext, snippet } = load('worker/src/retriever.ts');
const now = new Date('2026-10-13T04:02:00Z');
const user = content => ({ role: 'user', content });
const assistant = content => ({ role: 'assistant', content });
const scopeFor = (message, history = []) => resolveAnswerScope(history, message, now);
const question = 'TikTok đã trừ 10% thuế trên tiền hoa hồng của em. Tổng năm chỉ được 30 triệu thì có được hoàn lại không? Có cần cộng tiền lương ở công ty vào không?';
assert.deepEqual(scopeFor(question).years, [2026]);
assert.equal(scopeFor(question).periodSource, 'current_default');
assert.equal(scopeFor(question).today, '2026-10-13');
for (const text of ['Cả năm được 30 triệu', 'Quyết toán cuối năm', 'Luật 109/2025/QH15', 'Công văn ngày 06/10/2026', 'Tôi không nhắc gì đến năm 2025']) {
  assert.deepEqual(scopeFor(text).years, [2026], text);
}
assert.deepEqual(scopeFor('Không phải năm 2025 mà là 2026').years, [2026]);
assert.deepEqual(scopeFor('Thu nhập năm 2025').years, [2025]);
assert.deepEqual(scopeFor('So sánh năm 2025 và 2026').years, [2025, 2026]);
assert.deepEqual(scopeFor('Năm nay').years, [2026]);
assert.deepEqual(scopeFor('Năm ngoái').years, [2025]);
assert.deepEqual(resolveAnswerScope([], 'năm nay', new Date('2026-12-31T18:00:00Z')).years, [2027]);
assert.deepEqual(scopeFor('30 triệu', [assistant('Nếu năm 2025 thì...')]).years, [2026]);
const history = [user('Bán Shopee năm 2025 có nộp thuế không?'), assistant('Doanh thu bao nhiêu?')];
assert.deepEqual(scopeFor('800 triệu', history).years, [2025]);
assert.deepEqual(scopeFor('Năm 2026 nhé', history).years, [2026]);
assert.deepEqual(scopeFor(question, history).years, [2026]);
assert.deepEqual(scopeFor('Cho thuê nhà tính thuế thế nào?', history).years, [2026]);
assert.deepEqual(scopeFor('Tôi chưa nói năm nào', history).years, [2026]);
assert.deepEqual(scopeFor('30 triệu', [...history, user('Cho thuê nhà tính thuế thế nào?')]).years, [2026]);
const query = buildConversationRetrievalQuery(history, question);
assert.equal(query, question);
assert.match(buildConversationRetrievalQuery(history, '800 triệu'), /Shopee/);
assert.doesNotMatch(buildConversationRetrievalQuery(history, 'Năm 2026 nhé', [2026]), /2025/);
assert.ok(buildConversationRetrievalQuery(Array.from({ length: 8 }, () => user('x'.repeat(1000))), question).startsWith(question));
const scope = scopeFor(question);
const results = retrieve(query, 4, scope).results;
const refs = results.map(r => r.chunk.ref_id);
assert.ok(refs.includes('16.51'), 'Refund evidence must cover the refund question');
assert.ok(refs.includes('16.95'), 'Affiliate evidence must cover the classification question');
assert.ok(refs.includes('16.60'), 'Current-year threshold must cover the annual refund question');
assert.ok(!refs.includes('16.81') && !refs.includes('16.82'), 'Salary mention must not pull in unsolicited tax tables');
const context = buildContext(results, query, 6500, scope).text;
assert.match(context, /01 tỷ đồng\/năm trở xuống/);
assert.match(scopeInstructions(scope), /hiểu là năm hiện tại/);
assert.match(intentInstructions(question), /lương công ty không cộng vào doanh thu kinh doanh/i);
assert.ok(!retrieve('Affiliate TikTok năm 2025', 4, scopeFor('năm 2025')).results.some(r => r.chunk.ref_id === '16.95'));
assert.equal(retrieve('Thuế năm ngoái', 4, scopeFor('năm ngoái')).routeId, 'HISTORICAL_YEAR_THRESHOLD');
// RAG compression must retain a governing condition before a matching child bullet.
const chunk = { id: 'test', ref_id: 'test', file: 'test', section: '', tier: 'VERIFIED', text: 'Tiêu đề\nChỉ áp dụng nếu đã xác minh điều kiện này.\n  - Hoàn thuế theo điều kiện trên.\n' + 'Phần khác.\n'.repeat(50) };
const excerpt = snippet(chunk, 'hoàn thuế', 180);
assert.match(excerpt, /Chỉ áp dụng nếu/);
assert.match(excerpt, /Hoàn thuế theo/);
const { buildSecurePrompt } = load('src/services/guard.ts');
assert.match(buildSecurePrompt(question), /hiểu là năm hiện tại/);
console.log('Answer scope, conversation and multi-intent retrieval regression checks passed.');

async function testWorkerPaths() {
  const worker = load('worker/src/index.ts').default;
  const originalFetch = global.fetch;
  const originalCaches = global.caches;
  const pending = [];
  const ctx = { waitUntil: task => pending.push(task) };
  global.caches = { default: { match: async () => undefined, put: async () => {} } };
  const captured = [];
  global.fetch = async (_url, init) => {
    const input = JSON.parse(init.body);
    captured.push(input);
    if (input.stream) {
      return new Response('data: ' + JSON.stringify({ type: 'response.output_text.delta', delta: 'Câu trả lời giả lập để kiểm tra đường truyền.' }) + '\n\n');
    }
    return Response.json({ output: [{ type: 'message', content: [{ text: 'Câu trả lời giả lập để kiểm tra đường truyền.' }] }] });
  };
  const request = (stream, message = question) => new Request('https://test.local/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Internal-Caller': 'mcp' }, body: JSON.stringify({ message, stream }),
  });
  try {
    for (const stream of [false, true]) {
      const response = await worker.fetch(request(stream), { MUSE_API_KEY: 'test-fixture' }, ctx);
      assert.equal(response.status, 200);
      const body = await response.text();
      if (stream) {
        assert.match(body, /"years":\[2026\],"source":"current_default"/);
        assert.match(body, /\[DONE\]/);
      }
      assert.match(captured[captured.length - 1].instructions, /hiểu là năm hiện tại/);
      assert.equal(captured[captured.length - 1].input.slice(-1)[0].content[0].text, question);
    }
    const repairQuestion = 'Năm 2026 tôi sửa chữa doanh thu 1,5 tỷ, thuế TNCN sau giảm bao nhiêu?';
    const museCallsBeforeVerified = captured.length;
    for (const stream of [false, true]) {
      const response = await worker.fetch(request(stream, repairQuestion), { MUSE_API_KEY: 'test-fixture' }, ctx);
      assert.equal(response.status, 200);
      const body = await response.text();
      assert.match(body, /7\.000\.000 đồng/);
      assert.match(body, /Tax Engine \(verified rules\)/);
      assert.equal(captured.length, museCallsBeforeVerified, 'Verified tax amount must bypass model generation');
    }
    const fallback = await worker.fetch(request(false), {}, ctx);
    assert.equal(fallback.status, 200);
    assert.match((await fallback.json()).response, /chưa thể tổng hợp câu trả lời/);
    await Promise.all(pending);
    console.log('Worker integration checks passed: Muse stream, non-stream and provider-unavailable fallback share the same scope.');
  } finally {
    global.fetch = originalFetch;
    global.caches = originalCaches;
  }
}
const keepAlive = setInterval(() => {}, 1000);
testWorkerPaths()
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(() => clearInterval(keepAlive));
