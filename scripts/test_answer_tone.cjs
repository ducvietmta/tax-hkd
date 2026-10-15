/**
 * Giọng văn con người: tone module + template deterministic + prompt assembly.
 * Số tiền/căn cứ không đổi — chỉ khóa cách diễn đạt.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadModule(relativePath, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    (id) => {
      if (!(id in dependencies)) throw new Error(`Unexpected import: ${id}`);
      return dependencies[id];
    },
    module, module.exports,
  );
  return module.exports;
}

const { TONE_GUIDANCE, BANNED_OPENERS } = loadModule('worker/src/answerTone.ts');
assert.ok(TONE_GUIDANCE.length > 200, 'tone guidance phải đủ cụ thể');
assert.match(TONE_GUIDANCE, /mình/);
assert.match(TONE_GUIDANCE, /bạn/);
assert.ok(BANNED_OPENERS.length >= 5);

// Template deterministic render phải mở đầu tự nhiên, giữ số và căn cứ.
const { renderDeterministicAnswer, renderMultiYearComparison } = loadModule('worker/src/decision/render.ts');
const frame = {
  tax_period: { years: [2026] }, residency: { value: 'RESIDENT' }, semantic: {},
  facts: {},
};
const zero = renderDeterministicAnswer({
  effective_revenue_vnd: 800000000, total_tax_payable_vnd: 0, citations: ['Điều 1 Nghị định 141/2026/NĐ-CP'],
}, frame).response;
assert.match(zero, /Mình đối chiếu giúp bạn/);
assert.match(zero, /không phải nộp đồng nào/);
assert.match(zero, /Nghị định 141\/2026/);
const calc = renderDeterministicAnswer({
  effective_revenue_vnd: 1500000000, total_tax_payable_vnd: 57500000,
  vat_rate: 0.01, vat_due_vnd: 15000000, pit_rate: 0.005,
  pit_before_relief_vnd: 2500000, pit_relief_vnd: 0, pit_after_relief_vnd: 2500000,
  taxable_pit_revenue_vnd: 500000000, taxableVatRevenueVnd: 1500000000,
  citations: ['Điều 12 Luật Thuế GTGT 48/2024/QH15'],
}, frame).response;
assert.match(calc, /Mình tính cho trường hợp của bạn/);
assert.match(calc, /15 triệu đồng/);
const multi = renderMultiYearComparison({
  2025: { total_tax_payable_vnd: 4500000, vat_due_vnd: 3000000, pit_after_relief_vnd: 1500000, pit_relief_vnd: 0, citations: ['Thông tư 40/2021/TT-BTC'] },
  2026: { total_tax_payable_vnd: 0, vat_due_vnd: 0, pit_after_relief_vnd: 0, pit_relief_vnd: 0, citations: ['Nghị định 141/2026/NĐ-CP'] },
}, { facts: { revenue_vnd: 300000000 } }).response;
assert.match(multi, /Mình so sánh giúp bạn/);
for (const text of [zero, calc, multi]) {
  for (const banned of BANNED_OPENERS) assert.ok(!text.includes(banned), `template dính giọng công văn: ${banned}`);
}

// businessTaxAnswer: số giữ nguyên, mở đầu tự nhiên.
const textUtils = loadModule('worker/src/utils/text.ts');
const scopeMod = loadModule('shared/taxScope.ts');
const answerValidation = loadModule('worker/src/answerValidation.ts');
const sectorIntent = loadModule('worker/src/sectorIntent.ts', { './utils/text': textUtils });
const { answerVerifiedBusinessTax } = loadModule('worker/src/businessTaxAnswer.ts', {
  './taxEngine': loadModule('worker/src/taxEngine.ts'),
  './utils/text': textUtils,
  './sectorIntent': sectorIntent,
  './answerValidation': answerValidation,
});
const scope = scopeMod.resolveAnswerScope([], 'Bán hàng doanh thu 1,5 tỷ năm 2026 tính thuế thế nào?', new Date('2026-10-15T00:00:00Z'));
const biz = answerVerifiedBusinessTax('Bán hàng doanh thu 1,5 tỷ năm 2026 tính thuế thế nào?', scope);
assert.ok(biz, 'phải ra template cho câu tính thuế cơ bản');
assert.match(biz.response, /Mình tính cho bạn/);
assert.match(biz.response, /15\.000\.000 đồng/);
for (const banned of BANNED_OPENERS) assert.ok(!biz.response.includes(banned));

// Prompt assembly: tone phải đứng đầu cả 2 prompt sinh.
const routeChatSrc = fs.readFileSync(path.join(__dirname, '..', 'worker', 'src', 'routeChat.ts'), 'utf8');
assert.ok(routeChatSrc.includes("import { TONE_GUIDANCE } from './answerTone'"));
assert.ok(routeChatSrc.includes('const broadSystemPrompt = `${TONE_GUIDANCE}'));
assert.ok(routeChatSrc.includes('const focusedPrompt = `${TONE_GUIDANCE}'));
const contractSrc = fs.readFileSync(path.join(__dirname, '..', 'worker', 'src', 'decision', 'answerContract.ts'), 'utf8');
assert.match(contractSrc, /xưng mình, gọi bạn/);

console.log('Answer tone checks passed.');
