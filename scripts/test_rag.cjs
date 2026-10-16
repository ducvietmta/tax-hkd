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

const engine = loadModule('worker/src/ragEngine.ts');
// Content regressions: these conditions prevent a mathematically correct
// formula from being applied to the wrong method, period or legal purpose.
const reviewed = ref => engine.CANONICAL_CHUNKS.find(c => c.ref_id === ref).text;
assert.doesNotMatch(reviewed('16.99'), /Ví dụ E\d|T06|T21|T40|T41/, 'Knowledge must not encode evaluation IDs');
assert.match(reviewed('16.99'), /TNCN THEO THU NHẬP/);
assert.match(reviewed('16.99'), /không trừ mức miễn của TNCN/);
assert.match(reviewed('16.56'), /cuối năm.*từ năm tiếp theo/);
assert.match(reviewed('16.50'), /5%.*4%/);
assert.match(reviewed('16.50'), /Thuế suất 5%.*không đồng nghĩa tỷ lệ trực tiếp 5%/);
assert.match(reviewed('16.35'), /Dòng tax.*chưa chứng minh đã nộp TNCN/);
assert.match(reviewed('16.35'), /Chứng từ ghi GTGT không phải TNCN/);
assert.match(reviewed('16.72'), /GMV.*không tự là doanh thu/);
assert.match(reviewed('16.102'), /người nhà.*nhân viên.*thành viên hộ/);
assert.match(reviewed('16.107'), /địa phương/);
for (const ref of ['16.20','16.73']) assert.match(reviewed(ref), /KHÔNG phải quy tắc phân loại chung/);
const conversation = loadModule('worker/src/conversation.ts');
const textUtils = loadModule('worker/src/utils/text.ts');
const scope = loadModule('shared/taxScope.ts');
const retrievalPlan = loadModule('worker/src/decision/retrievalPlan.ts');
const taxEngine = loadModule('worker/src/taxEngine.ts');
const factExtractor = loadModule('worker/src/decision/factExtractor.ts', { '../utils/text': textUtils });
const { retrieve, buildContext, analyzeAmounts } = loadModule('worker/src/retriever.ts', {
  './ragEngine': engine,
  './answerScope': scope,
  './taxEngine': taxEngine,
  './decision/factExtractor': factExtractor,
  './decision/retrievalPlan': retrievalPlan,
  './utils/text': textUtils,
});

function resultsFor(query) {
  const response = retrieve(query, 4);
  assert.ok(response.results.every(({ chunk }) =>
    chunk.tier === 'VERIFIED' || chunk.tier === 'VERIFIED_CONDITIONAL'
  ));
  return response;
}

assert.equal(resultsFor('abc xyz completely unrelated question').results.length, 0);
assert.equal(buildContext([], 'abc xyz').citations.length, 0);
assert.notEqual(resultsFor('Doanh thu 800 triệu bán Shopee có phải nộp thuế không?').routeId, 'PLATFORM_WITHHELD');
assert.notEqual(resultsFor('Hộ kinh doanh có cần xuất hóa đơn điện tử không?').routeId, 'NO_INVOICE_PENALTY');
assert.equal(resultsFor('Sàn đã khấu trừ thuế của tôi').routeId, 'PLATFORM_WITHHELD');
assert.equal(resultsFor('Bị phạt không xuất hóa đơn').routeId, 'NO_INVOICE_PENALTY');
assert.ok(resultsFor('Thuế năm 2021 cho hộ khoán kinh doanh 9 tháng doanh thu 90 triệu?')
  .results.some(({ chunk }) => chunk.ref_id === '16.60'));
const historicalQuery = 'Thuế năm 2021 cho hộ khoán kinh doanh 9 tháng doanh thu 90 triệu?';
const historicalCitations = buildContext(resultsFor(historicalQuery).results, historicalQuery).citations;
assert.ok(historicalCitations.every((citation) => !/\/202[2-9]\b/.test(citation)));
assert.doesNotMatch(analyzeAmounts('doanh thu 800 triệu năm 2021'), /miễn thuế|phải nộp/i);
assert.match(analyzeAmounts('doanh thu 1,5 tỷ'), /1\.500\.000\.000 đồng/);
assert.match(analyzeAmounts('doanh thu 1.5 tỷ'), /1\.500\.000\.000 đồng/);
assert.match(analyzeAmounts('doanh thu 3 tỷ + 1 đồng'), /3\.000\.000\.001 đồng/);
for (const query of [
  'Doanh thu 800 triệu bán Shopee có phải nộp thuế không?',
  'Doanh thu 1.5 tỷ bán hàng online tính thuế thế nào?',
  'Làm affiliate TikTok bị trừ bao nhiêu phần trăm?',
  'Hộ kinh doanh có cần xuất hóa đơn điện tử không?',
  'Cho thuê nhà thuế bao nhiêu?',
  'Kê khai thuế theo quý hay năm?',
]) {
  assert.ok(resultsFor(query).results.length > 0, `No retrieval for: ${query}`);
}

console.log('RAG retrieval regression checks passed.');

// Both effective periods and the price-error clause must survive retrieval and
// context packing, rather than leaving the model only the name-error example.
const { buildRetrievalPlan } = loadModule('worker/src/decision/retrievalPlan.ts');
const halfYearFrame={tax_period:{years:[2026],is_historical:false},tax_intent:{primary:{value:'E_INVOICE'},secondary:[]},taxpayer_type:{value:'UNKNOWN'},semantic:{topic:'INVOICE_CORRECTION',invoicePeriod:'H1_2026'}};
assert.deepEqual(buildRetrievalPlan(halfYearFrame).allowed_refs,['16.106']);
assert.ok(buildRetrievalPlan({...halfYearFrame,semantic:{...halfYearFrame.semantic,invoicePeriod:'MIXED_OR_UNKNOWN'}}).allowed_refs.includes('16.103'),'Cross-period or unknown dates must retain transition evidence');
assert.ok(buildRetrievalPlan({...halfYearFrame,tax_period:{years:[2025],is_historical:true}}).allowed_refs.includes('16.103'),'A semantic half-year label cannot override an explicit different year');
const invoicePlan = buildRetrievalPlan({ tax_period: { years: [2026], is_historical: false },
  tax_intent: { primary: { value: 'E_INVOICE' }, secondary: [] },
  semantic: { topic: 'INVOICE_CORRECTION', revenueContext: 'TRANSACTION' },
  taxpayer_type: { value: 'UNKNOWN' } });
for (const question of [
  'Đã bán hàng tháng 3, khách trả lại tháng 4; doanh thu và GTGT cần điều chỉnh kỳ nào?',
  'Xuất hóa đơn điều chỉnh giảm do sai giá, không trả hàng, xử lý GTGT thế nào?',
]) {
  const period = scope.resolveAnswerScope([], question, new Date('2026-10-15T00:00:00Z'));
  const selected = retrieve(question, 4, period, invoicePlan);
  const context = buildContext(selected.results, question, 9000, period).text;
  assert.match(context, /khoản 13 Điều 1 Nghị định 70\/2025/);
  assert.match(context, /điểm b khoản 1 Điều 10 Thông tư 91\/2026/);
  assert.match(context, /không phải nhánh trả hàng/);
}

const affiliateQuestion = 'Trước mã số thuế của em đuôi 888, nay chuyển sang CCCD. Em làm tiếp thị liên kết TikTok từ 2025, năm nay doanh thu dưới 1 tỷ thì chỉ cần khai thuế cuối năm đúng không?';
const affiliateResults = resultsFor(affiliateQuestion);
assert.ok(affiliateResults.results.some(({ chunk }) => chunk.ref_id === '16.96'));
const affiliateContext = buildContext(affiliateResults.results, affiliateQuestion).text;
assert.match(affiliateContext, /31\/01\/2027/);
assert.match(affiliateContext, /888.*(hoạt động kinh doanh trực tuyến của cá nhân|phân loại hoạt động TMĐT)/);
const idGuidance = affiliateResults.results.find(({ chunk }) => chunk.ref_id === '16.96').chunk.text;
assert.doesNotMatch(idGuidance, /đã đăng ký hộ kinh doanh|giấy phép hộ kinh doanh/);
assert.match(affiliateContext, /06\/10\/2026/);
