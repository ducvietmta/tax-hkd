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

// 5. Dense opt-in: tắt mặc định, merge chỉ thêm chunk thiếu ở cuối.
(async () => {
  const { vectorSearch, mergeVectorHits } = loadModule('worker/src/vectorRetriever.ts', {
    './ragEngine': engine,
  });
  assert.equal(await vectorSearch('bán hàng 1,5 tỷ', {}), null);
  assert.equal(await vectorSearch('bán hàng 1,5 tỷ', { VECTORIZE_ENABLED: '1' }), null);
  const base = calc.results.map((r) => ({ chunk: r.chunk, score: r.score, viaRoute: r.viaRoute }));
  const merged = mergeVectorHits(base, [{ refId: '16.77', score: 0.9 }, { refId: 'nope', score: 0.9 }], 6);
  assert.deepEqual(refsOf({ results: merged }).slice(0, base.length), refsOf(calc));
  assert.ok(refsOf({ results: merged }).includes('16.77'));
  assert.equal(mergeVectorHits(base, [], 6).length, base.length);

  console.log('Retrieval parity checks passed.');
})().catch((e) => { console.error(e); process.exit(1); });
