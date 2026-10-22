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
    module,
    module.exports,
  );
  return module.exports;
}

console.log('================================================================');
console.log('⚖️ TEST TƯƠNG ĐƯƠNG: DATA-DRIVEN RULES ENGINE vs TAX ENGINE CŨ');
console.log('================================================================\n');

// Tải dependencies
const taxEngine = loadModule('worker/src/taxEngine.ts');
const labels = loadModule('worker/src/decision/labels.ts');
const factExtractor = loadModule('worker/src/decision/factExtractor.ts', { './types': {}, './labels': labels });
const understandQuery = loadModule('worker/src/decision/understandQuery.ts', {
  '../answerScope': {},
  './types': {},
  './labels': labels,
  './factExtractor': factExtractor,
}).understandQuery;

const ruleset2026 = JSON.parse(fs.readFileSync(path.join(__dirname, '../worker/src/rules/rulesets/hkd_2026.json'), 'utf8'));
const ruleset2025 = JSON.parse(fs.readFileSync(path.join(__dirname, '../worker/src/rules/rulesets/hkd_2025.json'), 'utf8'));

const registry = {
  getRulesetForYear: (year) => (year >= 2026 ? ruleset2026 : ruleset2025),
  RULESET_REGISTRY: { HKD_2026: ruleset2026, HKD_2025: ruleset2025 },
};

const { evaluateDecisionFrame } = loadModule('worker/src/rules/evaluator.ts', {
  '../decision/types': {},
  './types': {},
  './registry': registry,
  './integrity': loadModule('worker/src/rules/integrity.ts'),
});

const testCases = [
  {
    name: '2026 Bán hàng 1,01 tỷ cư trú (E01/T21)',
    query: 'Bán hàng 1,01 tỷ năm 2026 cư trú',
    scope: { years: [2026], periodSource: 'current_message' },
    oldFacts: { taxYear: 2026, activityType: 'goods', grossRevenueVnd: 1_010_000_000, isResident: true },
  },
  {
    name: '2026 Bán hàng 450 triệu dưới ngưỡng (T01)',
    query: 'Bán hàng 450 triệu năm 2026',
    scope: { years: [2026], periodSource: 'current_message' },
    oldFacts: { taxYear: 2026, activityType: 'goods', grossRevenueVnd: 450_000_000, isResident: true },
  },
  {
    name: '2025 Bán hàng 300 triệu vượt ngưỡng cũ (E03/T11)',
    query: 'Bán hàng 300 triệu năm 2025',
    scope: { years: [2025], periodSource: 'current_message' },
    oldFacts: { taxYear: 2025, activityType: 'goods', grossRevenueVnd: 300_000_000, isResident: true },
  },
  {
    name: '2025 Bán hàng 80 triệu dưới ngưỡng cũ (T25)',
    query: 'Bán hàng 80 triệu năm 2025',
    scope: { years: [2025], periodSource: 'current_message' },
    oldFacts: { taxYear: 2025, activityType: 'goods', grossRevenueVnd: 80_000_000, isResident: true },
  },
  {
    name: '2026 Dịch vụ 1,5 tỷ cư trú (E02/T27)',
    query: 'Dịch vụ sửa chữa 1,5 tỷ năm 2026 cư trú',
    scope: { years: [2026], periodSource: 'current_message' },
    oldFacts: { taxYear: 2026, activityType: 'service', grossRevenueVnd: 1_500_000_000, isResident: true },
  },
];

let passed = 0;
for (const tc of testCases) {
  const oldRes = taxEngine.calculateTax(tc.oldFacts);
  const frame = understandQuery(tc.query, tc.scope);
  const newRes = evaluateDecisionFrame(frame);

  try {
    assert.equal(newRes.status, oldRes.status, 'Khác trạng thái status');
    assert.equal(newRes.effective_revenue_vnd, oldRes.effectiveRevenueVnd, 'Khác doanh thu tính thuế');
    assert.equal(newRes.vat_due_vnd, oldRes.vatDueVnd, 'Khác số thuế GTGT');
    assert.equal(newRes.pit_before_relief_vnd, oldRes.pitBeforeReliefVnd, 'Khác PIT trước giảm');
    assert.equal(newRes.pit_after_relief_vnd, oldRes.pitAfterReliefVnd, 'Khác PIT sau giảm');
    assert.equal(newRes.total_tax_payable_vnd, oldRes.totalTaxPayableVnd, 'Khác tổng số thuế phải nộp');
    console.log(`✅ [${tc.name}] TƯƠNG ĐƯƠNG 100%: Tổng thuế = ${newRes.total_tax_payable_vnd.toLocaleString()} đ`);
    passed++;
  } catch (err) {
    console.error(`❌ [${tc.name}] KHÁC BIỆT:`, err.message);
    console.error('Old result:', oldRes);
    console.error('New result:', newRes);
  }
}

console.log('\n================================================================');
console.log(`📊 TỔNG KẾT: ${passed}/${testCases.length} TEST CASES TƯƠNG ĐƯƠNG TUYỆT ĐỐI`);
console.log('================================================================');

if (passed !== testCases.length) process.exit(1);

const over3WithoutIncome = understandQuery('Cá nhân cư trú dịch vụ sửa chữa doanh thu 3 tỷ + 1 đồng năm 2026, nộp TNCN bao nhiêu?', { years: [2026], periodSource: 'current_message' });
assert.equal(evaluateDecisionFrame(over3WithoutIncome).status, 'NEEDS_INFO');

const over3WithIncome = understandQuery('Cá nhân cư trú dịch vụ sửa chữa doanh thu 3 tỷ + 1 đồng năm 2026, thu nhập tính thuế hợp lệ 400 triệu', { years: [2026], periodSource: 'current_message' });
const incomeResult = evaluateDecisionFrame(over3WithIncome);
assert.equal(incomeResult.status, 'ANSWERED');
assert.equal(incomeResult.pit_rate, 0.17);
assert.equal(incomeResult.pit_after_relief_vnd, 47_600_000);

const overReliefCap = understandQuery('Cá nhân cư trú dịch vụ sửa chữa doanh thu 10 tỷ cộng thêm 1 đồng năm 2026, thu nhập tính thuế hợp lệ 400 triệu', { years: [2026], periodSource: 'current_message' });
assert.equal(evaluateDecisionFrame(overReliefCap).pit_relief_vnd, 0);
console.log('✅ [Boundary_3B_And_10B] PASS');
