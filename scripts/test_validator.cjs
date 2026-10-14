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
console.log('🛡️ TEST EVIDENCE GATE, RETRIEVAL PLAN VÀ ANSWER VALIDATOR');
console.log('================================================================\n');

const labels = loadModule('worker/src/decision/labels.ts');
const factExtractor = loadModule('worker/src/decision/factExtractor.ts', { './types': {}, './labels': labels });
const understandQuery = loadModule('worker/src/decision/understandQuery.ts', {
  '../answerScope': {},
  './types': {},
  './labels': labels,
  './factExtractor': factExtractor,
}).understandQuery;

const chunkMetaJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../worker/src/kb/chunkMeta.json'), 'utf8'));

const { buildRetrievalPlan } = loadModule('worker/src/decision/retrievalPlan.ts', { './types': {} });
const { filterAndGateEvidence } = loadModule('worker/src/decision/evidenceGate.ts', {
  '../ragEngine': {},
  './types': {},
  '../kb/chunkMeta.json': { default: chunkMetaJson, ...chunkMetaJson },
});
const { validateAnswer } = loadModule('worker/src/decision/answerValidator.ts', {
  './types': {},
  '../rules/evaluator': {},
});

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ [${name}] PASS`);
    passed++;
  } catch (err) {
    console.error(`❌ [${name}] FAILED:`, err.message);
  }
}

// 1. Retrieval Plan: 2025 ghim 16.54
runTest('RetrievalPlan_2025_Pins', () => {
  const frame = understandQuery('Năm 2025 bán hàng 300 triệu nộp thuế gì?', { years: [2025], periodSource: 'current_message' });
  const plan = buildRetrievalPlan(frame);
  assert.ok(plan.must_include_refs.includes('16.54'));
});

// 2. Evidence Gate: Lọc chunk 2025 khi câu hỏi là 2026
runTest('EvidenceGate_Filters_2025_For_2026', () => {
  const frame = understandQuery('Năm 2026 bán hàng 1,01 tỷ nộp thuế gì?', { years: [2026], periodSource: 'current_message' });
  const mockChunks = [
    { id: 'chunk1', ref_id: '16.54', section: 'Ngưỡng 2025 100tr', tier: 'VERIFIED', text: 'Năm 2025 áp dụng TT40...' },
    { id: 'chunk2', ref_id: '16.1', section: 'Cầm đồ', tier: 'VERIFIED_CONDITIONAL', text: 'Năm 2026 áp dụng NĐ 141...' }
  ];
  const gateResult = filterAndGateEvidence(mockChunks, frame);
  // Chunk 16.54 phải bị loại khỏi passedChunks
  assert.equal(gateResult.passedChunks.length, 1);
  assert.equal(gateResult.passedChunks[0].ref_id, '16.1');
});

// 3. Validator: Bổ sung mốc 30 ngày cho HĐĐT
runTest('Validator_Repairs_30_Days_Invoice', () => {
  const frame = understandQuery('Hộ kinh doanh khi nào phải dùng hóa đơn điện tử máy tính tiền?', { years: [2026], periodSource: 'current_default' });
  const rawAnswer = 'Hộ kinh doanh doanh thu trên 1 tỷ đồng phải sử dụng hóa đơn điện tử khởi tạo từ máy tính tiền.';
  const report = validateAnswer(rawAnswer, frame);
  assert.equal(report.status, 'REPAIR');
  assert.ok(report.repairedText.includes('30 ngày'));
});

// 4. Validator: Sửa Luật 38/2019
runTest('Validator_Repairs_Luat38', () => {
  const frame = understandQuery('Quy định hóa đơn điện tử máy tính tiền năm 2026', { years: [2026], periodSource: 'current_default' });
  const rawAnswer = 'Theo Luật Quản lý thuế 38/2019/QH14, hộ kinh doanh phải dùng hóa đơn điện tử máy tính tiền.';
  const report = validateAnswer(rawAnswer, frame);
  assert.equal(report.status, 'REPAIR');
  assert.ok(!report.repairedText.includes('38/2019'));
  assert.ok(report.repairedText.includes('Nghị định 68/2026/NĐ-CP'));
});

// 5. Validator: Cảnh báo bẫy phí sàn
runTest('Validator_Warns_Platform_Fee', () => {
  const frame = understandQuery('Bán Shopee doanh thu 800 triệu, trừ phí sàn 50 triệu thì tính thuế thế nào?', { years: [2026], periodSource: 'current_default' });
  const rawAnswer = 'Thuế GTGT là 1% và TNCN là 0.5%.';
  const report = validateAnswer(rawAnswer, frame);
  assert.equal(report.status, 'REPAIR');
  assert.ok(report.repairedText.includes('không được tự trừ khỏi doanh thu'));
});

// 6. Validator: Cảnh báo tiền ship COD
runTest('Validator_Warns_COD_Shipping', () => {
  const frame = understandQuery('Tiền ship COD thu hộ 20 triệu có phải tính vào doanh thu bán hàng không?', { years: [2026], periodSource: 'current_default' });
  const rawAnswer = 'Doanh thu bán hàng tính thuế theo quy định.';
  const report = validateAnswer(rawAnswer, frame);
  assert.equal(report.status, 'REPAIR');
  assert.ok(report.repairedText.includes('không tính vào doanh thu'));
});

console.log('\n================================================================');
console.log(`📊 TỔNG KẾT: ${passed}/${total} TEST CASES PASSED`);
console.log('================================================================');

if (passed !== total) process.exit(1);
