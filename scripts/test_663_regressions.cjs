/**
 * Hồi quy 663 (2026-11-03): sửa gốc, không hardcode đáp án.
 * - Kết luận so sánh phương pháp do code chốt, khớp số học, đúng với biến thể đổi số/ngành.
 * - Nguồn bắt buộc quá ngân sách vẫn vào ngữ cảnh bằng đoạn trích cùng nguồn.
 * - Chính sách trả lời từng phần: routeChat không còn chặn toàn bộ khi thiếu nguồn bắt buộc.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relativePath, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)((id) => {
    if (!(id in dependencies)) throw new Error(`Unexpected import: ${id}`);
    return dependencies[id];
  }, mod, mod.exports);
  return mod.exports;
}

const labels = load('worker/src/decision/labels.ts');
const ruleset2026 = JSON.parse(fs.readFileSync(path.join(__dirname, '../worker/src/rules/rulesets/hkd_2026.json'), 'utf8'));
const ruleset2025 = JSON.parse(fs.readFileSync(path.join(__dirname, '../worker/src/rules/rulesets/hkd_2025.json'), 'utf8'));
const rulesRegistry = { getRulesetForYear: (year) => (year >= 2026 ? ruleset2026 : ruleset2025) };
const methodComparison = load('worker/src/decision/methodComparison.ts', { '../rules/registry': rulesRegistry });

function frame({ revenue, expense, income }) {
  return {
    semantic: { calculationShape: 'METHOD_COMPARISON', methodContext: 'UNSPECIFIED', revenueContext: 'ACTUAL_YEAR' },
    tax_period: { years: [2026] },
    taxpayer_type: { value: 'INDIVIDUAL_BUSINESS' },
    residency: { value: 'RESIDENT' },
    facts: { revenue_basis: 'ANNUAL', revenue_vnd: revenue, reported_expense_vnd: expense },
    income_type: income ? [{ value: income }] : [],
  };
}

// Ca gốc đổi số: doanh thu 3,1 tỷ, chi phí 2,6 tỷ -> thu nhập 500tr x15% = 75tr, sau giảm 52,5tr;
// doanh thu chịu thuế phần vượt 1 tỷ = 2,1 tỷ. Mọi ngành tỷ lệ doanh thu đều thấp hơn.
for (const [rev, exp, inc] of [[2_900_000_000, 2_500_000_000, 'SERVICE'], [1_800_000_000, 400_000_000, 'GOODS_SALES'], [2_400_000_000, 2_000_000_000, 'FOOD_SERVICE']]) {
  const ledger = methodComparison.methodComparisonLedger(frame({ revenue: rev, expense: exp, income: inc }));
  assert.ok(ledger, `phải có ledger cho ${rev}`);
  assert.equal(ledger.conclusion.length, 1);
  const c = ledger.conclusion[0];
  const expectedLower = c.income_amount < c.turnover_amount ? 'INCOME' : c.income_amount > c.turnover_amount ? 'TURNOVER' : 'EQUAL';
  assert.equal(c.lower, expectedLower, 'kết luận code phải khớp chính số của nó');
  assert.equal(c.difference_vnd, Math.abs(c.income_amount - c.turnover_amount));
  // Không được kết luận phương pháp thu nhập thấp hơn khi số của nó cao hơn (lỗi G073/G245).
  if (c.income_amount > c.turnover_amount) assert.equal(c.lower, 'TURNOVER');
}
// Trường hợp thu nhập thấp hơn thật: chi phí rất sát doanh thu.
const lowIncome = methodComparison.methodComparisonLedger(frame({ revenue: 1_200_000_000, expense: 1_190_000_000, income: 'SERVICE' }));
assert.equal(lowIncome.conclusion[0].lower, 'INCOME');

// Ledger đa hoạt động: mức trừ 1 tỷ phân bổ cho tỷ lệ cao trước, GTGT không dùng mức trừ.
// Biến thể gốc (L09): tạp hóa 800tr (0,5%) + vận tải/dịch vụ 500tr (2%) -> trừ hết 500tr dịch vụ + 500tr hàng hóa.
function multiFrame(items, resident = 'RESIDENT') {
  return {
    semantic: { revenueContext: 'ACTUAL_YEAR' }, tax_period: { years: [2026] },
    taxpayer_type: { value: 'INDIVIDUAL_BUSINESS' }, residency: { value: resident },
    facts: { revenue_basis: 'ANNUAL', revenue_vnd: items.reduce((n, a) => n + a.revenueVnd, 0), multi_activities: items },
    income_type: [],
  };
}
const multi = methodComparison.multiActivityLedger(multiFrame([
  { id: 'goods', kind: 'goods', revenueVnd: 800_000_000 },
  { id: 'service', kind: 'production_transport', revenueVnd: 500_000_000 },
]));
assert.equal(multi.rows.find(r => r.id === 'service').allowance_vnd, 500_000_000);
assert.equal(multi.rows.find(r => r.id === 'goods').allowance_vnd, 500_000_000);
assert.equal(multi.pit_before_relief_vnd, 1_500_000); // (800-500)tr x 0,5%
assert.equal(multi.pit_after_relief_vnd, 1_050_000); // giảm 30%
assert.equal(multi.vat_due_vnd, 23_000_000); // 800tr x1% + 500tr vận tải x3%, không dùng mức trừ
// Dịch vụ thường 5%/2% cho cùng cấu trúc số phải ra GTGT khác:
const multiService = methodComparison.multiActivityLedger(multiFrame([
  { id: 'goods', kind: 'goods', revenueVnd: 800_000_000 },
  { id: 'service', kind: 'service', revenueVnd: 500_000_000 },
]));
assert.equal(multiService.vat_due_vnd, 33_000_000);
// Biến thể đổi số/thứ tự: dịch vụ liệt kê trước, số khác.
const multi2 = methodComparison.multiActivityLedger(multiFrame([
  { id: 'service', kind: 'service', revenueVnd: 900_000_000 },
  { id: 'goods', kind: 'goods', revenueVnd: 700_000_000 },
]));
assert.equal(multi2.rows.find(r => r.id === 'service').allowance_vnd, 900_000_000);
assert.equal(multi2.rows.find(r => r.id === 'goods').allowance_vnd, 100_000_000);
assert.equal(multi2.pit_before_relief_vnd, 3_000_000); // (700-100)tr x 0,5%
// Dưới ngưỡng: không thuế.
const multiBelow = methodComparison.multiActivityLedger(multiFrame([
  { id: 'goods', kind: 'goods', revenueVnd: 600_000_000 },
  { id: 'service', kind: 'service', revenueVnd: 300_000_000 },
]));
assert.equal(multiBelow.pit_before_relief_vnd, 0);
assert.equal(multiBelow.vat_due_vnd, 0);
// Chưa xác nhận cư trú: không tự áp giảm.
const multiUnknown = methodComparison.multiActivityLedger(multiFrame([
  { id: 'goods', kind: 'goods', revenueVnd: 800_000_000 },
  { id: 'service', kind: 'service', revenueVnd: 500_000_000 },
], 'UNKNOWN'));
assert.equal(multiUnknown.pit_relief_vnd, 0);

// Đóng gói ngữ cảnh: chunk bắt buộc dài hơn ngân sách vẫn phải có mặt.
const textUtils = load('worker/src/utils/text.ts');
const scopeMod = load('shared/taxScope.ts');
const engine = load('worker/src/ragEngine.ts');
const factExtractor = load('worker/src/decision/factExtractor.ts', { '../utils/text': textUtils, './labels': labels });
const chunkMetaJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../worker/src/kb/chunkMeta.json'), 'utf8'));
const retrievalPlan = load('worker/src/decision/retrievalPlan.ts', {
  './factExtractor': factExtractor,
  '../kb/policyRetrievalIndex.json': { default: JSON.parse(fs.readFileSync(path.join(__dirname, '../worker/src/kb/policyRetrievalIndex.json'), 'utf8')) },
  '../kb/chunkMeta.json': { default: chunkMetaJson },
  '../kb/periodApplicability': load('worker/src/kb/periodApplicability.ts'),
});
const legalMarkdownSearch = load('worker/src/kb/legalMarkdownSearch.ts', {
  '../utils/text': textUtils,
  '../data/documentLibrary.json': { default: [] },
});
const retriever = load('worker/src/retriever.ts', {
  './kb/provenance': load('worker/src/kb/provenance.ts', { './chunkMeta.json': { default: chunkMetaJson } }),
  './ragEngine': engine, './answerScope': scopeMod, './taxEngine': load('worker/src/taxEngine.ts'),
  './decision/factExtractor': factExtractor, './decision/retrievalPlan': retrievalPlan, './utils/text': textUtils,
  './kb/legalMarkdownSearch': legalMarkdownSearch,
  './kb/chunkMeta.json': { default: chunkMetaJson },
  './kb/periodApplicability': load('worker/src/kb/periodApplicability.ts'),
});
const longChunk = {
  id: 'long-required', ref_id: '99.1', file: 'KB/test', section: 'test', tier: 'VERIFIED',
  text: ('Dòng quy tắc không liên quan để lấp đầy ngữ cảnh kiểm thử đóng gói nguồn bắt buộc. '.repeat(120))
    + '\nĐiều kiện quyết định: doanh thu vượt ngưỡng thì áp dụng phương pháp theo thu nhập tính thuế.\n'
    + ('Dòng phụ thêm về thủ tục chung không chứa điều kiện quyết định của câu hỏi. '.repeat(120)),
};
const packed = retriever.buildContext([{ chunk: longChunk, score: 1, required: 'RETRIEVAL_PLAN' }],
  'doanh thu vượt ngưỡng áp dụng phương pháp nào', 1500, { years: [2026], today: '2026-11-03', periodSource: 'current_default' });
assert.ok(packed.includedRefs.includes('99.1'), 'nguồn bắt buộc dài không được biến mất khỏi ngữ cảnh');
assert.deepEqual(packed.missingRequiredRefs, []);
assert.ok(packed.text.includes('phương pháp theo thu nhập'), 'đoạn trích phải giữ dòng quyết định');

// Chính sách từng phần ở routeChat: không còn source evidence_context_incomplete chặn toàn bộ.
const routeChatSrc = fs.readFileSync(path.join(__dirname, '..', 'worker/src/routeChat.ts'), 'utf8');
assert.ok(!routeChatSrc.includes("source:'evidence_context_incomplete'"), 'không được chặn toàn bộ đáp án khi thiếu một nguồn');
assert.ok(routeChatSrc.includes('contextIncompleteNote'), 'phải khai báo giới hạn nguồn cho model');
assert.ok(routeChatSrc.includes('requestIncompleteNote'), 'phải khai báo giới hạn theo từng ý hỏi');
assert.ok((routeChatSrc.match(/ragContextText\}\$\{fullContextNote\}/g) || []).length >= 2, 'cả hai prompt phải nhận giới hạn nguồn');

// Reviewer phải mang các kiểm tra bao phủ theo chủ đề cho các họ điểm must:
// nhiều địa điểm trên hóa đơn, hủy/trả hàng, ấn định Điều 24, mẫu khai bổ sung.
const recursiveModules = new Map();
function loadRecursive(file) {
  file = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(file)) file += '.ts';
  if (recursiveModules.has(file)) return recursiveModules.get(file);
  if (file.endsWith('.json')) { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return { default: v, ...v }; }
  const m = { exports: {} };
  recursiveModules.set(file, m.exports);
  new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(
    (id) => loadRecursive(path.resolve(path.dirname(file), id)), m, m.exports);
  recursiveModules.set(file, m.exports);
  return m.exports;
}
const jev = loadRecursive('worker/src/decision/jevProvider.ts');
async function capturedReviewQuestions(topic, primaryIntent) {
  class Capture extends jev.JevDecisionProvider {
    async ask(_state, questions) {
      this.captured = questions;
      const answers = {};
      for (const [key, q] of Object.entries(questions)) {
        if (q.type === 'noul') { answers[key] = { type: 'noul', noul: 0.95 }; continue; }
        const choices = Object.keys(q.criteria);
        answers[key] = { type: 'choice', choice: choices.includes('COMPLETE') ? 'COMPLETE' : choices[0], confidence: 0.95 };
      }
      return answers;
    }
  }
  const p = new Capture('stub');
  await p.reviewAnswer('câu hỏi', 'đáp án', 'bằng chứng', [], { topic, primaryIntent, secondaryIntents: [], incomeTypes: [] });
  return p.captured;
}
(async () => {
  const inv = await capturedReviewQuestions('INVOICE_USAGE', 'E_INVOICE');
  assert.ok(inv.multi_location_invoice && inv.invoice_timing, 'INVOICE_USAGE phải kiểm mã địa điểm + thời điểm lập');
  const rights = await capturedReviewQuestions('TAXPAYER_RIGHTS', 'LEGAL_TEXT_LOOKUP');
  assert.ok(rights.assessment_basis, 'TAXPAYER_RIGHTS phải kiểm căn cứ ấn định');
  const decl = await capturedReviewQuestions('OTHER', 'DECLARATION_FILING');
  assert.ok(decl.supplementary_forms && decl.filing_forms_by_method, 'DECLARATION_FILING phải kiểm mẫu/phụ lục dù topic rộng');
  const corr = await capturedReviewQuestions('INVOICE_CORRECTION', 'E_INVOICE');
  assert.ok(corr.cancel_return_handling, 'INVOICE_CORRECTION phải kiểm nhánh hủy/trả hàng');
  const routeSrc = fs.readFileSync(path.join(__dirname, '..', 'worker/src/routeChat.ts'), 'utf8');
  assert.ok(routeSrc.includes('Compact retry'), 'phải có lượt review gọn chống SKIPPED');
  assert.ok(routeSrc.includes('ANSWER_REVIEW_CONFIRM'), 'chặn cứng phải qua xác nhận độc lập thứ hai');
  assert.ok(routeSrc.includes("env.REVIEW_BLOCKING !== 'off'"), 'phải có cờ tắt chặn review');
  const wrangler = fs.readFileSync(path.join(__dirname, '..', 'worker/wrangler.toml'), 'utf8');
  assert.ok(wrangler.includes('REVIEW_BLOCKING = "off"'), 'production phải tắt chặn review theo cấu hình');
  console.log('663 regression checks passed.');
})().catch((e) => { console.error(e); process.exit(1); });
