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
const conversation = loadModule('worker/src/conversation.ts');
const scope = loadModule('worker/src/answerScope.ts', { './conversation': conversation });
const taxEngine = loadModule('worker/src/taxEngine.ts');
const { retrieve, buildContext, analyzeAmounts } = loadModule('worker/src/retriever.ts', {
  './ragEngine': engine,
  './answerScope': scope,
  './taxEngine': taxEngine,
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
assert.match(analyzeAmounts('doanh thu 1,5 tỷ'), /1\.5 tỷ đồng/);
assert.match(analyzeAmounts('doanh thu 1.5 tỷ'), /1\.5 tỷ đồng/);
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

const affiliateQuestion = 'Trước mã số thuế của em đuôi 888, nay chuyển sang CCCD. Em làm tiếp thị liên kết TikTok từ 2025, năm nay doanh thu dưới 1 tỷ thì chỉ cần khai thuế cuối năm đúng không?';
const affiliateResults = resultsFor(affiliateQuestion);
assert.ok(affiliateResults.results.some(({ chunk }) => chunk.ref_id === '16.96'));
const affiliateContext = buildContext(affiliateResults.results, affiliateQuestion).text;
assert.match(affiliateContext, /31\/01\/2027/);
assert.match(affiliateContext, /đuôi 888.*hoạt động kinh doanh trực tuyến của cá nhân/);
const idGuidance = affiliateResults.results.find(({ chunk }) => chunk.ref_id === '16.96').chunk.text;
assert.doesNotMatch(idGuidance, /đã đăng ký hộ kinh doanh|giấy phép hộ kinh doanh/);
assert.match(affiliateContext, /06\/10\/2026/);
