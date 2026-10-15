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
    id => {
      const target = path.resolve(path.dirname(file), id);
      if (id.endsWith('.json')) {
        const data = JSON.parse(fs.readFileSync(target, 'utf8'));
        return { default: data, ...data };
      }
      return load(path.relative(path.resolve(__dirname, '..'), target + '.ts'));
    },
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
const compoundEvidence = retrieve('Dịch vụ sửa máy tính 1,5 tỷ: GTGT theo NQ204? TNCN theo NQ43? Khoản nền tảng giữ lại có được trừ?', 4, scopeFor('Năm 2026')).results;
assert.ok(compoundEvidence.some(r => r.chunk.ref_id === '16.50'), 'Keep explicitly requested VAT relief evidence');
assert.ok(compoundEvidence.some(r => r.chunk.ref_id === '16.39' || r.chunk.ref_id === '16.99'), 'Keep explicitly requested PIT relief evidence');
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
  let scopeLabel = 'IN_SCOPE';
  const scopeRequests = [];
  global.fetch = async (_url, init) => {
    const input = JSON.parse(init.body);
    if (String(_url).includes('mkp-api.fptcloud.com')) {
      scopeRequests.push(input);
      if (scopeLabel === 'HTTP_ERROR') return new Response('', { status: 503 });
      if (scopeLabel === 'TIMEOUT') throw new DOMException('timeout', 'AbortError');
      return Response.json({ choices: [{ message: { content: scopeLabel } }] });
    }
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
    const { resolveTaxRelevance } = load('worker/src/taxRelevance.ts');
    const repairBundle = 'Người bán gói dịch vụ sửa chữa có kèm phụ tùng miễn phí trên quảng cáo nhưng giá đã bao gồm phụ tùng. Tính nhóm nào?';
    const semanticEnv = { MUSE_API_KEY: 'test-fixture', FPT_AI_KEY: 'scope-fixture', DECISION_L2: 'off' };
    const accepted = await (await worker.fetch(request(false, repairBundle), semanticEnv, ctx)).json();
    assert.notEqual(accepted.source, 'out_of_scope', 'No tax keyword required to enter tax pipeline');
    assert.equal(JSON.parse(scopeRequests.at(-1).messages.at(-1).content).question, repairBundle);
    scopeLabel = 'OUT_OF_SCOPE';
    const unrelated = 'Viết bài hát có chữ thuế';
    const rejected = await (await worker.fetch(request(false, unrelated), semanticEnv, ctx)).json();
    assert.equal(rejected.source, 'out_of_scope', 'Tax keyword cannot override semantic classification');
    const rejectedStream = await (await worker.fetch(request(true, unrelated), semanticEnv, ctx)).text();
    const scopeEvents = rejectedStream.split('\n\n').filter(part => part.startsWith('data: {')).map(part => JSON.parse(part.slice(6)));
    assert.equal(scopeEvents.find(event => event.type === 'done')?.fullText, rejected.response, 'SSE uses identical scope rejection');
    const rejectedMcp = await (await worker.fetch(new Request('https://test.local/mcp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 'scope', method: 'tools/call', params: { name: 'ask_tax_ai', arguments: { question: unrelated } } }),
    }), semanticEnv, ctx)).json();
    assert.ok(rejectedMcp.result.content[0].text.startsWith(rejected.response));
    for (const label of ['UNCERTAIN', 'A', 'OUT_OF_SCOPE because I said so', 'HTTP_ERROR', 'TIMEOUT']) {
      scopeLabel = label;
      const expected = label === 'UNCERTAIN' ? 'UNCERTAIN' : 'UNAVAILABLE';
      assert.equal(await resolveTaxRelevance(repairBundle, [], 'fixture'), expected, label);
      const beforeBlocked = captured.length;
      const blocked = await (await worker.fetch(request(false, repairBundle), semanticEnv, ctx)).json();
      assert.equal(blocked.source, expected === 'UNCERTAIN' ? 'scope_clarification' : 'scope_unavailable', label);
      assert.deepEqual(blocked.citations, []);
      assert.equal(captured.length, beforeBlocked, 'Unconfirmed scope must not call answer model');
      const blockedSse = await (await worker.fetch(request(true, repairBundle), semanticEnv, ctx)).text();
      const blockedEvents = blockedSse.split('\n\n').filter(part => part.startsWith('data: {')).map(part => JSON.parse(part.slice(6)));
      assert.equal(blockedEvents.find(event => event.type === 'done')?.fullText, blocked.response);
      const blockedMcp = await (await worker.fetch(new Request('https://test.local/mcp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: label, method: 'tools/call', params: { name: 'ask_tax_ai', arguments: { question: repairBundle } } }),
      }), semanticEnv, ctx)).json();
      assert.equal(blockedMcp.result.structuredContent.answer, blocked.response);
      assert.equal(captured.length, beforeBlocked, 'All transports must stop before generation');
    }
    assert.equal(await resolveTaxRelevance(repairBundle, []), 'UNAVAILABLE');
    const missingKey = await (await worker.fetch(request(false, repairBundle), {}, ctx)).json();
    assert.equal(missingKey.source, 'scope_unavailable');
    scopeLabel = 'IN_SCOPE';
    const followupHistory = [user('Tôi đang hỏi phân loại doanh thu để tính thuế.')];
    assert.equal(await resolveTaxRelevance('Vậy gói này thuộc nhóm nào?', followupHistory, 'fixture'), 'IN_SCOPE');
    assert.deepEqual(JSON.parse(scopeRequests.at(-1).messages.at(-1).content).history, followupHistory);
    console.log('Semantic scope checks passed: shared web/SSE/MCP gate, context, malformed output and provider failures.');
    const providerQuestion = 'Hộ kinh doanh cần lưu chứng từ thanh toán thế nào?';
    for (const stream of [false, true]) {
      const response = await worker.fetch(request(stream, providerQuestion), semanticEnv, ctx);
      assert.equal(response.status, 200);
      const body = await response.text();
      if (stream) {
        assert.match(body, /"years":\[2026\],"source":"current_default"/);
        assert.match(body, /\[DONE\]/);
      }
      assert.match(captured[captured.length - 1].instructions, /hiểu là năm hiện tại/);
      assert.equal(captured[captured.length - 1].input.slice(-1)[0].content[0].text, providerQuestion);
    }
    const repairQuestion = 'Năm 2026 tôi sửa chữa doanh thu 1,5 tỷ, thuế TNCN sau giảm bao nhiêu?';
    const museCallsBeforeVerified = captured.length;
    for (const stream of [false, true]) {
      const response = await worker.fetch(request(stream, repairQuestion), semanticEnv, ctx);
      assert.equal(response.status, 200);
      const body = await response.text();
      assert.match(body, /7\.000\.000 đồng/);
      assert.match(body, /Tax Engine \(verified rules\)/);
      assert.equal(captured.length, museCallsBeforeVerified, 'Verified tax amount must bypass model generation');
    }
    const vatReliefQuestion = 'Tôi cung cấp dịch vụ sửa chữa máy vi tính, không bán lẻ tạp hóa, doanh thu 1,5 tỷ năm 2026, thuế GTGT theo tỷ lệ 5%. Nghị quyết 204/2025/QH15 có thể giảm mức tỷ lệ GTGT của tôi xuống 4% hay không? Cần xác định điều kiện gì? Nghị quyết 43/2026/QH16 có giảm GTGT không? Không đổi thành ngành bán lẻ.';
    const webResponse = await worker.fetch(request(false, vatReliefQuestion), semanticEnv, ctx);
    assert.equal(webResponse.status, 200);
    const webAnswer = await webResponse.json();
    assert.match(webAnswer.response, /5% còn 4%/);
    assert.match(webAnswer.response, /60\.000\.000 đồng/);
    assert.doesNotMatch(webAnswer.response, /doanh thu bán hàng hóa\/tạp hóa|thuế GTGT: 1%/i);
    const mcpResponse = await worker.fetch(new Request('https://test.local/mcp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 77, method: 'tools/call', params: { name: 'ask_tax_ai', arguments: { question: vatReliefQuestion } } }),
    }), semanticEnv, ctx);
    assert.equal(mcpResponse.status, 200);
    const mcpAnswer = await mcpResponse.json();
    assert.equal(mcpAnswer.result.isError, false);
    assert.ok(mcpAnswer.result.content[0].text.startsWith(webAnswer.response), 'MCP and web must share the same core answer');
    const nq43BoundaryQuestion = 'Một cá nhân cư trú có tổng doanh thu kinh doanh năm 2026 đúng bằng 10 tỷ đồng; một cá nhân khác có doanh thu 10 tỷ đồng cộng thêm 1 đồng. Chỉ xét đến chính sách giảm 30% thuế thu nhập cá nhân (TNCN) theo Nghị quyết 43/2026. Trường hợp nào đủ điều kiện, và liệu doanh thu từ 5 cửa hàng có được cộng gộp ở cấp độ cá nhân hay không? Lưu ý không nhầm lẫn giữa mức 10 tỷ đồng này với ngưỡng miễn thuế 1 tỷ đồng.';
    const museCallsBeforeBoundary = captured.length;
    const boundaryWebResponse = await worker.fetch(request(false, nq43BoundaryQuestion), semanticEnv, ctx);
    assert.equal(boundaryWebResponse.status, 200);
    const boundaryWebAnswer = await boundaryWebResponse.json();
    assert.match(boundaryWebAnswer.response, /10\.000\.000\.000 đồng.*đáp ứng/);
    assert.match(boundaryWebAnswer.response, /10\.000\.000\.001 đồng.*không đủ điều kiện/);
    const boundaryStreamResponse = await worker.fetch(request(true, nq43BoundaryQuestion), semanticEnv, ctx);
    assert.equal(boundaryStreamResponse.status, 200);
    const boundaryStreamEvents = (await boundaryStreamResponse.text()).split('\n\n').filter(part => part.startsWith('data: {')).map(part => JSON.parse(part.slice(6)));
    assert.equal(boundaryStreamEvents.find(event => event.type === 'done')?.fullText, boundaryWebAnswer.response, 'Web stream and non-stream must share the verified answer');
    const boundaryMcpResponse = await worker.fetch(new Request('https://test.local/mcp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 78, method: 'tools/call', params: { name: 'ask_tax_ai', arguments: { question: nq43BoundaryQuestion } } }),
    }), semanticEnv, ctx);
    assert.equal(boundaryMcpResponse.status, 200);
    const boundaryMcpAnswer = await boundaryMcpResponse.json();
    assert.equal(boundaryMcpAnswer.result.isError, false);
    assert.ok(boundaryMcpAnswer.result.content[0].text.startsWith(boundaryWebAnswer.response), 'MCP must use the same 10 billion boundary answer as web');
    assert.equal(captured.length, museCallsBeforeBoundary, 'Verified 10 billion boundary must bypass model generation');
    const priorityCases = [
      ['G021', question, /không mặc định hoàn toàn bộ/],
      ['T84', 'Năm 2026 bán tạp hóa doanh thu 1,5 tỷ, tỷ lệ GTGT 1%. Giả định hàng hóa đủ điều kiện giảm GTGT 20% theo Nghị quyết 204/2025, tính thuế GTGT bao nhiêu?', /12\.000\.000 đồng/],
      ['T86', 'Tôi là cá nhân cư trú năm 2026 có doanh thu 3.000.000.001 đồng, thu nhập tính thuế hợp lệ 400 triệu đồng. TNCN sau giảm 30% theo Nghị quyết 43 là bao nhiêu?', /47\.600\.000 đồng/],
      ['T91', 'Năm 2026 doanh thu hoa hồng TikTok 500 triệu, TikTok giữ lại dòng tax 5 triệu. Doanh thu là bao nhiêu và tax đó chắc là TNCN đã nộp thay không?', /chưa đủ/],
      ['T95', 'Năm 2026 vợ chồng làm affiliate độc lập, mỗi người 600 triệu doanh thu. Có cộng gộp không, nếu một người đứng tên hộ thì sao?', /đứng tên hộ/],
      ['T98', 'Năm 2026 vượt 1 tỷ, thời hạn đăng ký hóa đơn điện tử 30 ngày căn cứ điều khoản nào?', /khoản 2 Điều 1 Nghị định 141\/2026/],
      ['T100', 'Năm 2026 doanh thu 3 tỷ + 1 đồng, có thể vẫn dùng TNCN 0,5% không? Thuế suất nào?', /17%/],
    ];
    const beforePriority = captured.length;
    for (const [id, priorityQuestion, expected] of priorityCases) {
      const web = await (await worker.fetch(request(false, priorityQuestion), semanticEnv, ctx)).json();
      assert.match(web.response, expected, id);
      const mcp = await (await worker.fetch(new Request('https://test.local/mcp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: 'ask_tax_ai', arguments: { question: priorityQuestion } } }),
      }), semanticEnv, ctx)).json();
      assert.ok(mcp.result.content[0].text.startsWith(web.response), `${id}: MCP/web parity`);
    }
    assert.equal(captured.length, beforePriority, 'All priority answers must be deterministic and shared across transports');
    const vatOnly = await (await worker.fetch(request(false, 'Bán tạp hóa 1,5 tỷ, chỉ hỏi GTGT được giảm, không hỏi TNCN.'), semanticEnv, ctx)).json();
    assert.match(vatOnly.response, /12\.000\.000 đồng/);
    assert.match(vatOnly.response, /loại trừ/);
    assert.doesNotMatch(vatOnly.response, /TNCN trước|TNCN sau|1\.750\.000/);
    const beforeCompound = captured.length;
    const compound = await (await worker.fetch(request(false, 'Dịch vụ sửa máy tính 1,5 tỷ: GTGT theo NQ204? TNCN theo NQ43? Khoản nền tảng giữ lại có được trừ?'), semanticEnv, ctx)).json();
    assert.ok(captured.length > beforeCompound, 'An incomplete verified answer must not bypass generation');
    assert.match(compound.response, /phí dịch vụ với tiền thuế/);
    const fallback = await worker.fetch(request(false), { FPT_AI_KEY: 'scope-fixture', DECISION_L2: 'off' }, ctx);
    assert.equal(fallback.status, 200);
    assert.match((await fallback.json()).response, /không mặc định hoàn toàn bộ/);
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
