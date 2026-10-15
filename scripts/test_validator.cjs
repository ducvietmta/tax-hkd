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
const { CANONICAL_CHUNKS } = loadModule('worker/src/ragEngine.ts');

const { buildRetrievalPlan } = loadModule('worker/src/decision/retrievalPlan.ts', { './types': {} });
const { decide } = loadModule('worker/src/decision/orchestrator.ts', { '../rules/evaluator': {}, './types': {} });
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

runTest('EvidenceGate_Does_Not_Restore_Rejected_Chunk', () => {
  const frame = understandQuery('Năm 2026 doanh thu 1,5 tỷ nộp thuế gì?', { years: [2026], periodSource: 'current_message' });
  const result = filterAndGateEvidence([
    { id: 'old', ref_id: '16.54', section: 'Ngưỡng 2025', tier: 'VERIFIED', text: '2025: 100 triệu' },
  ], frame);
  assert.equal(result.passedChunks.length, 0);
  assert.equal(result.evidenceItems[0].evidence_relation, 'NOT_RELEVANT');
});

runTest('RetrievalPlan_Pins_Correct_Legal_Chunks', () => {
  const frame = understandQuery('Cá nhân cư trú dịch vụ sửa chữa 3 tỷ + 1 đồng năm 2026 có giảm GTGT theo Nghị quyết 204 không?', { years: [2026], periodSource: 'current_message' });
  const refs = buildRetrievalPlan(frame).must_include_refs;
  assert.ok(refs.includes('16.50') && refs.includes('16.99'));
  assert.ok(!refs.includes('16.88'));
});

runTest('Orchestrator_Requires_Missing_Income', () => {
  const frame = understandQuery('Cá nhân cư trú sửa chữa doanh thu 3 tỷ + 1 đồng năm 2026, tính TNCN?', { years: [2026], periodSource: 'current_message' });
  const decision = decide(frame, { status: 'NEEDS_INFO' }, [], buildRetrievalPlan(frame));
  assert.equal(decision.decision_status, 'NEEDS_INFO');
  assert.equal(decision.rule_outcomes.length, 0);
});

// 3. Validator: Bổ sung mốc 30 ngày cho HĐĐT
runTest('Nq204_Shorthand_Pins_Current_Vat_Evidence', () => {
  const frame = understandQuery('Dịch vụ sửa máy tính 1,5 tỷ: GTGT theo NQ204? TNCN theo NQ43?', { years: [2026], periodSource: 'current_default' });
  const plan = buildRetrievalPlan(frame);
  assert.ok(plan.must_include_refs.includes('16.50'));
  assert.ok(plan.must_include_refs.includes('16.99'));
  const vatChunk = CANONICAL_CHUNKS.find(c => c.ref_id === '16.50');
  assert.ok(vatChunk);
  const evidence = filterAndGateEvidence([vatChunk], frame);
  assert.equal(evidence.passedChunks.length, 1);
  const futureFrame = { ...frame, tax_period: { ...frame.tax_period, years: [2027] } };
  assert.equal(filterAndGateEvidence([vatChunk], futureFrame).passedChunks.length, 0);
});

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
