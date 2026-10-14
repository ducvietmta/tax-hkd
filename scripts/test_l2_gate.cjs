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
const { understandQuery, refineQueryWithL2 } = load('worker/src/decision/understandQuery.ts', {
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
  console.log('L2 gate and explicit-fact precedence passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
