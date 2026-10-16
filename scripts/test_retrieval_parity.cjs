/**
 * PARITY + REGRESSION cho retrieval sau refactor:
 * 1. matchRoute fold dấu: query không dấu trúng cùng route như bản có dấu.
 * 2. `not` trong query-map được tôn trọng.
 * 3. Thứ tự ghim legacy (legacyPinRefs) ổn định front-to-back.
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
    module,
    module.exports,
  );
  return module.exports;
}

const engine = loadModule('worker/src/ragEngine.ts');
const textUtils = loadModule('worker/src/utils/text.ts');
const scopeMod = loadModule('shared/taxScope.ts');
const factExtractor = loadModule('worker/src/decision/factExtractor.ts', { '../utils/text': textUtils });
const retrievalPlanMod = loadModule('worker/src/decision/retrievalPlan.ts');
const { retrieve } = loadModule('worker/src/retriever.ts', {
  './ragEngine': engine,
  './answerScope': scopeMod,
  './taxEngine': loadModule('worker/src/taxEngine.ts'),
  './decision/factExtractor': factExtractor,
  './decision/retrievalPlan': retrievalPlanMod,
  './utils/text': textUtils,
});
const { matchRoute } = engine;
const { legacyPinRefs } = retrievalPlanMod;
const { resolveAnswerScope } = scopeMod;

const refsOf = (res) => res.results.map((r) => r.chunk.ref_id);

// 1. Không dấu == có dấu ở tầng route.
const accentPairs = [
  ['tiep thi lien ket tren tiktok co phai nop thue khong', 'tiếp thị liên kết trên tiktok có phải nộp thuế không'],
  ['cho thue nha 800 trieu mot nam tinh thue nao', 'cho thuê nhà 800 triệu một năm tính thuế nào'],
  ['dang ky ma so thue 888 nhu the nao', 'đăng ký mã số thuế 888 như thế nào'],
  ['san da khau tru thue cua toi', 'sàn đã khấu trừ thuế của tôi'],
];
for (const [unsigned, accented] of accentPairs) {
  const a = matchRoute(unsigned)?.id || null;
  const b = matchRoute(accented)?.id || null;
  assert.ok(a, `unsigned query must hit a route: ${unsigned}`);
  assert.equal(a, b, `route parity unsigned/accented: ${unsigned} (${a}) vs (${b})`);
}

// 2. `not` loại route.
assert.notEqual(matchRoute('bán nhà cho thuê có phải nộp thuế?')?.id, 'REAL_ESTATE_TRANSFER_TAX');
assert.equal(matchRoute('bán nhà sang tên có phải nộp thuế?')?.id, 'REAL_ESTATE_TRANSFER_TAX');
assert.equal(matchRoute('khi nào nên đăng ký cnkd và khi nào nên đăng ký hkd')?.id, 'CHON_HKD_CNKD');

// 2b. Câu hỏi chọn loại hình: ghim 16.107 + 16.7 + 16.8, không ghim oan affiliate.
const choiceFrame = {
  tax_period: { years: [2026], is_historical: false },
  taxpayer_type: { value: 'UNKNOWN' },
  tax_intent: { primary: { value: 'REGISTRATION' }, secondary: [] },
  income_type: [], facts: {}, missing_facts: [],
  semantic: { topic: 'BUSINESS_REGISTRATION', revenueContext: 'UNSPECIFIED' },
};
assert.deepEqual(retrievalPlanMod.buildRetrievalPlan(choiceFrame).must_include_refs, ['16.107', '16.7', '16.8']);
const affFrame = { ...choiceFrame, income_type: [{ value: 'AFFILIATE_COMMISSION' }] };
assert.deepEqual(retrievalPlanMod.buildRetrievalPlan(affFrame).must_include_refs, ['16.107', '16.73', '16.20']);
const choiceRes = retrieve('khi nào nên đăng ký cnkd và khi nào nên đăng ký hkd', 4,
  resolveAnswerScope([], 'khi nào nên đăng ký cnkd và khi nào nên đăng ký hkd', new Date('2026-10-15T00:00:00Z')),
  retrievalPlanMod.buildRetrievalPlan(choiceFrame));
assert.deepEqual(refsOf(choiceRes), ['16.107', '16.7', '16.8']);
assert.ok(!refsOf(choiceRes).includes('16.73'));

// 3. Thứ tự ghim legacy ổn định.
const scope2026 = resolveAnswerScope([], 'năm 2026', new Date('2026-10-15T00:00:00Z'));
assert.deepEqual(
  legacyPinRefs('Bán hàng doanh thu 1,5 tỷ năm 2026 tính thuế thế nào?', scope2026).map((p) => p.ref),
  ['16.99'],
);
const pinsPct = legacyPinRefs('Bán tạp hóa doanh thu 1,2 tỷ chịu bao nhiêu phần trăm thuế?', scope2026).map((p) => p.ref);
assert.deepEqual(pinsPct.slice(0, 2), ['16.77', '16.99']);
assert.deepEqual(
  legacyPinRefs('Thuế năm 2021 cho hộ khoán doanh thu 90 triệu?', resolveAnswerScope([], 'năm 2021', new Date('2026-10-15T00:00:00Z'))).map((p) => p.ref),
  ['16.54'],
);

// 4. retrieve() end-to-end giữ nguyên thứ tự ghim ở đầu.
const calc = retrieve('Bán hàng doanh thu 1,5 tỷ năm 2026 tính thuế thế nào?', 4, scope2026);
assert.equal(refsOf(calc)[0], '16.99');
const pct = retrieve('Bán tạp hóa doanh thu 1,2 tỷ chịu bao nhiêu phần trăm thuế?', 4, scope2026);
assert.deepEqual(refsOf(pct).slice(0, 2), ['16.77', '16.99']);

// 5. Dense opt-in: Weighted RRF, True-Pin preservation, lọc theo kỳ hiệu lực và mở rộng truy vấn.
(async () => {
  const metaData = require('../worker/src/kb/chunkMeta.json');
  const { vectorSearch, mergeVectorHits, rewriteQueryForDense, isPeriodCompatible } = loadModule('worker/src/vectorRetriever.ts', {
    './ragEngine': engine,
    './kb/chunkMeta.json': Object.assign({}, metaData, { default: metaData }),
  });
  assert.equal(await vectorSearch('bán hàng 1,5 tỷ', {}), null);
  assert.equal(await vectorSearch('bán hàng 1,5 tỷ', { VECTORIZE_ENABLED: '1' }), null);

  // Period compatibility
  assert.equal(isPeriodCompatible('16.54', [2026]), false, '16.54 (2025) không được lọt vào 2026');
  assert.equal(isPeriodCompatible('16.99', [2026]), true, '16.99 hợp lệ cho 2026');

  // Query rewriting
  assert.ok(rewriteQueryForDense('bán hàng trên shopee').includes('thương mại điện tử'));
  assert.ok(rewriteQueryForDense('đăng ký mã 888').includes('311/TCT'));

  // True-pin preservation: chunk 16.99 có điểm >= 90 luôn giữ vị trí số 1
  const base = calc.results.map((r) => ({ chunk: r.chunk, score: r.score, viaRoute: r.viaRoute }));
  const merged = mergeVectorHits(base, [{ refId: '16.77', score: 0.9 }, { refId: 'nope', score: 0.9 }], 6, {
    query: 'Bán hàng doanh thu 1,5 tỷ năm 2026 tính thuế thế nào?',
    years: [2026],
  });
  assert.equal(merged[0].chunk.ref_id, '16.99', 'Chunk ghim 16.99 phải luôn ở vị trí số 1');
  assert.ok(merged.map(m => m.chunk.ref_id).includes('16.77'), 'Vector hit 16.77 điểm cao được kết hợp qua RRF');

  // Lọc chunk thời kỳ cũ không lọt vào năm 2026
  const periodFiltered = mergeVectorHits(base, [{ refId: '16.54', score: 0.95 }], 6, { years: [2026] });
  assert.ok(!periodFiltered.map(m => m.chunk.ref_id).includes('16.54'), '16.54 phải bị loại khỏi kết quả năm 2026');

  console.log('Retrieval parity and Weighted RRF checks passed.');
})().catch((e) => { console.error(e); process.exit(1); });
