const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const modules = new Map();
function load(relativePath) {
  const file = path.resolve(__dirname, '..', relativePath);
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
    id => load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(file), id.endsWith('.json') ? id : id + '.ts'))),
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
            if (sql.startsWith('SELECT payload FROM answer_cache')) {
              return rows.has(values[0]) ? { payload: rows.get(values[0]) } : null;
            }
            throw new Error(`Unexpected SELECT: ${sql}`);
          },
          async run() {
            if (sql.startsWith('INSERT OR IGNORE INTO answer_cache')) {
              if (!rows.has(values[0])) rows.set(values[0], values[1]);
              return {};
            }
            if (sql.startsWith('INSERT INTO decision_traces')) return {};
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
let scopeLabel = 'IN_SCOPE';
const concurrentQuestion = 'Năm 2026 hộ kinh doanh khai thuế vào lúc nào?';
let releaseConcurrent;
const concurrentGate = new Promise(resolve => { releaseConcurrent = resolve; });
let concurrentCalls = 0;
global.caches = { default: { match: async () => undefined, put: async () => {} } };
global.fetch = async (_url, init) => {
  const input = JSON.parse(init.body);
  if (String(_url).includes('mkp-api.fptcloud.com')) {
    return Response.json({ choices: [{ message: { content: scopeLabel } }] });
  }
  assert.equal(input.stream, false, 'Web SSE and MCP must send the same non-stream model request');
  const call = ++modelCalls;
  if (input.input.at(-1).content[0].text === concurrentQuestion) {
    concurrentCalls += 1;
    if (concurrentCalls === 2) releaseConcurrent();
    await Promise.race([
      concurrentGate,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Concurrent requests did not reach the model together')), 2000)),
    ]);
  }
  return Response.json({ output: [{ type: 'message', content: [{ text: `Câu trả lời kiểm thử từ mô hình lần ${call}. Căn cứ pháp lý: tài liệu kiểm thử.` }] }] });
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
  const methodAnswer = await mcpAnswer(methodQuestion);
  assert.match(methodAnswer, /17%/);
  assert.match(methodAnswer, /47\.600\.000 đồng/);
  assert.doesNotMatch(methodAnswer, /0[,.]5%/);
  assert.equal(await streamAnswer(methodQuestion), methodAnswer);

  const sectorQuestion = 'Cá nhân cư trú cung cấp dịch vụ sửa chữa máy vi tính, không bán lẻ tạp hóa, doanh thu 1,5 tỷ năm 2026, thuế GTGT và TNCN bao nhiêu?';
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

  await Promise.all(pending);
  console.log('Web SSE, web JSON and MCP exact-answer parity checks passed.');
}
const keepAlive = setInterval(() => {}, 1000);
main().catch(error => { console.error(error); process.exitCode = 1; })
  .finally(() => { clearInterval(keepAlive); global.fetch = originalFetch; global.caches = originalCaches; });
