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
      if (!(id in dependencies)) {
 if(id.endsWith('/periodApplicability')||id.endsWith('/conversationHistory')) {
  const p=path.resolve(path.dirname(path.join(__dirname,'..',relativePath)),id+'.ts');
  const mod={exports:{}};new Function('module','exports',ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod,mod.exports);return mod.exports;
 }
 if(id.endsWith('.json'))return {default:JSON.parse(fs.readFileSync(path.resolve(path.dirname(path.join(__dirname,'..',relativePath)),id),'utf8'))};
 throw new Error(`Unexpected import: ${id}`);
}
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
for (const ref of ['16.20','16.73','16.95']) {
  assert.match(reviewed(ref), /lao động/, 'Platform affiliate must retain the employment-income branch');
  assert.match(reviewed(ref), /7403-CT-TMDT-2026\.docx/, 'Affiliate guidance must point to the supplied source');
}
assert.match(reviewed('16.95'), /khoản 12 Điều 3 Luật Thương mại điện tử 122\/2025/);
assert.match(reviewed('16.95'), /trong NGÀY của TỪNG người bán/,'Buyer expense threshold is per seller per day, not each individual payment');
assert.match(reviewed('16.95'), /không tự thay thế việc xác định phương pháp/,'The affiliate rate must not override the annual tax method');
// Cross-topic content checks: these protect legal conditions shared by many
// questions, rather than matching the wording or IDs of an evaluation case.
assert.match(reviewed('16.51'), /02\/QTT-TNCN-CNKD/);
assert.doesNotMatch(reviewed('16.51'), /\*\*Mẫu 02\/CNKD-TNCN-QTT\*\*/);
assert.match(reviewed('16.51'), /10 ngày làm việc từ ngày ban hành kết luận/,
  'Inspection-first refund deadline starts after the inspection result, not submission');
assert.match(reviewed('16.51'), /Không dùng mốc 40 ngày/);
assert.match(reviewed('16.71'), /tối thiểu \*\*05 năm\*\*/);
assert.match(reviewed('16.71'), /không đồng nghĩa miễn ghi sổ/);
assert.doesNotMatch(reviewed('16.71'), /loại trừ nhóm tự chọn phương pháp kê khai/);
assert.match(reviewed('16.87'), /chứng nhận cư trú nước ngoài/);
assert.match(reviewed('16.87'), /không phải bất kỳ hợp đồng có thời hạn nào cũng đủ/);
assert.match(reviewed('16.90'), /vàng miếng.*thời điểm áp dụng thu/);
assert.match(reviewed('16.90'), /Bản quyền.*từng hợp đồng/);
assert.match(reviewed('16.85'), /dịch bệnh.*Điều40.*Điều49.*tự quyết toán/);
assert.doesNotMatch(reviewed('16.77'), /affiliate chưa đăng ký kinh doanh\/đăng ký thuế/);
assert.match(reviewed('16.84'), /không có đăng ký không tự biến mọi khoản thành tiền công/);
assert.match(reviewed('16.42'), /không miễn thông báo doanh thu năm/);
assert.match(reviewed('16.57'), /năm tiếp theo/);
assert.match(reviewed('16.46'), /630.000.*Sau đó mới đối chiếu\/trừ/);
assert.ok(reviewed('16.96').length <= 1200,
  'Identifier definition, transition limits and annual duties must fit together in context');
assert.doesNotMatch(reviewed('16.91'), /16\.92\b/);
assert.doesNotMatch(reviewed('16.64'), /chưa được cấp giấy chứng nhận — đăng ký thuế trực tiếp/);
assert.match(reviewed('16.88'), /hình thành trong tương lai/);
assert.match(reviewed('16.94'), /\*\*trên 183 ngày\*\*/);
assert.doesNotMatch(reviewed('16.94'), /hiện diện tại đó ít nhất 183 ngày/);
const conversation = loadModule('worker/src/conversation.ts');
const textUtils = loadModule('worker/src/utils/text.ts');
const scope = loadModule('shared/taxScope.ts');
const retrievalPlan = loadModule('worker/src/decision/retrievalPlan.ts');
const taxEngine = loadModule('worker/src/taxEngine.ts');
const factExtractor = loadModule('worker/src/decision/factExtractor.ts', { '../utils/text': textUtils });
const { retrieve, buildContext, analyzeAmounts } = loadModule('worker/src/retriever.ts', {
  './kb/provenance': loadModule('worker/src/kb/provenance.ts',{'./chunkMeta.json':{default:JSON.parse(fs.readFileSync(path.join(__dirname,'../worker/src/kb/chunkMeta.json'),'utf8'))}}),
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
for (const [ref, question, expected] of [
  ['16.51', 'Năm 2026 kiểm tra trước hoàn thuế tính hạn từ khi nào?', /10 ngày làm việc từ ngày ban hành kết luận/],
  ['16.71', 'Hộ kinh doanh dưới 1 tỷ năm 2026 có cần lưu sổ sách không?', /05 năm/],
  ['16.87', 'Ở Việt Nam 150 ngày, có nhà thuê, chứng nhận cư trú nước ngoài thì sao?', /chứng nhận cư trú nước ngoài/],
]) {
  const chunk = engine.CANONICAL_CHUNKS.find(c => c.ref_id === ref);
  const packed = buildContext([{ chunk, score: 100 }], question, 1200).text;
  assert.match(packed, expected, `Critical condition lost from packed evidence: ${ref}`);
}
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
