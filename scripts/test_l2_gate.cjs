const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relativePath, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => dependencies[id] || {}, mod, mod.exports);
  return mod.exports;
}

const labels = load('worker/src/decision/labels.ts');
const facts = load('worker/src/decision/factExtractor.ts', { './labels': labels });
const { understandQuery, refineQueryWithL2, understandClassifiedQuery } = load('worker/src/decision/understandQuery.ts', {
  './labels': labels, './factExtractor': facts,
});
const scope = { years: [2026], periodSource: 'current_message' };

async function main() {
  const explicit = understandQuery('Cá nhân cư trú sửa chữa máy vi tính, không bán lẻ tạp hóa, doanh thu 1,5 tỷ năm 2026', scope);
  let calls = 0;
  const provider = { classifyAll: async () => {
    calls++;
    return { taxpayer: 'HOUSEHOLD_BUSINESS', taxpayerConf: 0.95,
      income: 'GOODS_SALES', incomeConf: 0.95,
      intent: 'REGISTRATION', intentConf: 0.95, durationMs: 1 };
  } };
  const unchanged = await refineQueryWithL2(explicit, 'irrelevant', provider);
  assert.equal(calls, 0, 'Confident L1 labels must not call L2');
  assert.equal(unchanged.income_type[0].value, 'SERVICE');
  const forced = await refineQueryWithL2(explicit, 'irrelevant', provider, true);
  assert.equal(calls, 1);
  assert.equal(forced.income_type[0].value, 'SERVICE', 'L2 must not overwrite an explicit activity');
  const semantic = { taxpayer: 'INDIVIDUAL_BUSINESS', primaryIntent: 'REFUND',
    secondaryIntents: ['PLATFORM_WITHHOLDING', 'LEGAL_TEXT_LOOKUP'], incomeTypes: ['AFFILIATE_COMMISSION', 'WAGE_SALARY'] };
  const modelFrame = understandClassifiedQuery('Doanh thu 3 tỷ + 1 đồng năm 2026, thu nhập tính thuế hợp lệ 400 triệu. Tôi không bán lẻ tạp hóa.', scope, [], semantic);
  assert.equal(modelFrame.taxpayer_type.value, semantic.taxpayer);
  assert.equal(modelFrame.taxpayer_type.source, 'llm');
  assert.equal(modelFrame.tax_intent.primary.value, 'REFUND');
  assert.deepEqual(modelFrame.tax_intent.secondary, semantic.secondaryIntents);
  assert.deepEqual(modelFrame.income_type.map(x => x.value), semantic.incomeTypes);
  assert.equal(modelFrame.facts.revenue_vnd, 3_000_000_001);
  assert.equal(modelFrame.facts.taxable_income_vnd, 400_000_000);
  assert.equal(modelFrame.meta.l2_used, true);
  const unknown = understandClassifiedQuery('Hộ kinh doanh bán tạp hóa cần đăng ký hóa đơn', scope, [], {
    taxpayer: 'UNKNOWN', primaryIntent: 'OTHER_TAX', secondaryIntents: [], incomeTypes: ['UNKNOWN'],
  });
  assert.equal(unknown.taxpayer_type.value, 'UNKNOWN', 'No keyword fallback even with obvious words');
  assert.equal(unknown.income_type[0].value, 'UNKNOWN');
  assert.equal(unknown.tax_intent.primary.value, 'OTHER_TAX');
  assert.throws(() => understandClassifiedQuery('Bán hàng', scope, [], null), /required/);
  const { QuyetDecisionProvider } = load('worker/src/decision/quyetProvider.ts', { './labels': labels });
  const oldFetch = global.fetch;
  try {
    let reply;
    let captured;
    global.fetch = async (_url, init) => {
      captured = JSON.parse(init.body);
      const field = captured.messages[0].content.split('\n')[0];
      const options = field.endsWith('TAXPAYER') ? labels.TAXPAYER_TYPES : field.endsWith('INTENT') ? labels.TAX_INTENTS.filter(x => x !== 'OUT_OF_SCOPE') : labels.INCOME_TYPES;
      const selected = field.endsWith('TAXPAYER') ? [semantic.taxpayer] : field.endsWith('INTENT') ? [semantic.primaryIntent, ...semantic.secondaryIntents] : semantic.incomeTypes;
      return Response.json({ choices: [{ message: { content: reply ?? selected.map(x => String.fromCharCode(65 + options.indexOf(x))).join(',') } }] });
    };
    const realProvider = new QuyetDecisionProvider('fixture');
    const history = [{ role: 'user', content: 'Tôi làm affiliate và có lương.' }];
    assert.deepEqual(await realProvider.classifyBusiness('Có hoàn được không?', history), semantic);
    assert.deepEqual(JSON.parse(captured.messages.at(-1).content.match(/(\{"history":[^\n]+\})\nChỉ trả/)[1]).history, history);
    const basic = { taxpayer: 'INDIVIDUAL_BUSINESS', primaryIntent: 'TAX_CALCULATION', secondaryIntents: [], incomeTypes: ['SERVICE'] };
    const originalMock = global.fetch;
    global.fetch = async (_url, init) => {
      const task = JSON.parse(init.body).messages[0].content.split('\n')[0];
      return Response.json({ choices: [{ message: { content: task.endsWith('TAXPAYER') ? 'B. INDIVIDUAL_BUSINESS'
        : task.endsWith('INTENT') ? 'D. TAX_CALCULATION' : 'B. SERVICE' } }] });
    };
    assert.deepEqual(await realProvider.classifyBusiness('Sửa chữa tính nhóm nào?'), basic);
    global.fetch = originalMock;
    for (const invalid of ['', 'A,B', 'Z', 'Có chữ A ở trong câu', 'A. ENTERPRISE', 'IN_SCOPE']) {
      reply = invalid;
      assert.equal(await realProvider.classifyBusiness('Có hoàn không?'), null);
    }
    global.fetch = async () => { throw new DOMException('timeout', 'AbortError'); };
    assert.equal(await realProvider.classifyBusiness('Có hoàn không?'), null);
  } finally { global.fetch = oldFetch; }
  console.log('L2 gate and explicit-fact precedence passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
