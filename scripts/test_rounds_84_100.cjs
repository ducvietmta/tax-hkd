const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, deps = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(id => {
    if (!(id in deps)) throw new Error(`Unexpected import ${id}`);
    return deps[id];
  }, module, module.exports);
  return module.exports;
}

const conversation = load('worker/src/conversation.ts');
const textUtils = load('worker/src/utils/text.ts');
const scope = load('shared/taxScope.ts');
const engine = load('worker/src/taxEngine.ts');
const priority = load('worker/src/priorityTaxAnswer.ts', { './taxEngine': engine });
const validation = load('worker/src/answerValidation.ts');
const now = new Date('2026-10-14T05:00:00Z');
const answer = q => priority.answerPriorityTax(q, scope.resolveAnswerScope([], q, now))?.response;
assert.equal(validation.requestedTaxFocus('Chỉ hỏi GTGT được giảm, không hỏi TNCN.'), 'vat');
assert.equal(validation.requestedTaxFocus('Chỉ hỏi TNCN, không cần tính GTGT.'), 'pit');
assert.equal(validation.canUseVerifiedAnswer('Dịch vụ sửa máy tính 1,5 tỷ: GTGT theo NQ204? TNCN theo NQ43? Khoản nền tảng giữ lại có được trừ?',
  'GTGT 75 triệu, TNCN sau giảm 7 triệu.'), false);
assert.equal(validation.canUseVerifiedAnswer('Chỉ hỏi GTGT được giảm, không hỏi TNCN.',
  'GTGT 15 triệu. TNCN trước ưu đãi 2,5 triệu, TNCN sau giảm 1,75 triệu.'), false);
assert.equal(validation.canUseVerifiedAnswer('Doanh thu 3,5 tỷ gồm 2 tỷ bán hàng và 1,5 tỷ dịch vụ; có được áp phương pháp khác nhau từng mảng?',
  'Với doanh thu dịch vụ 1,5 tỷ đồng, TNCN sau giảm 7 triệu.'), false);
const unsupportedCosts = answer('Hộ có doanh thu 4 tỷ, báo chi phí 3 tỷ nhưng không có chứng từ. Có thể coi ngay thu nhập tính thuế 1 tỷ?');
assert.match(unsupportedCosts, /Chưa thể coi/);
assert.match(unsupportedCosts, /chứng từ/);
assert.doesNotMatch(unsupportedCosts, /119\.000\.000|170\.000\.000/);
const aggregateMethod = answer('Doanh thu 3,5 tỷ gồm 2 tỷ bán hàng và 1,5 tỷ dịch vụ; có được áp phương pháp khác nhau từng mảng?');
assert.match(aggregateMethod, /3\.500\.000\.000/);
assert.match(aggregateMethod, /17%/);
assert.match(aggregateMethod, /không tách từng mảng/);
const rateOnly = answer('Doanh thu 49,9 tỷ, thu nhập tính thuế hợp lệ 1 tỷ; hỏi chỉ thuế suất TNCN, không hỏi tiền.');
assert.match(rateOnly, /17%/);
assert.doesNotMatch(rateOnly, /170\.000\.000/);
assert.equal(answer('Doanh thu 50 tỷ 1 đồng và thu nhập tính thuế 2 tỷ; so với đúng 50 tỷ.'), undefined);
const refundQuestion = 'TikTok đã trừ 10% trên hoa hồng 30 triệu, tôi còn lương công ty. Có hoàn được không và có cộng lương?';
const refundAnswer = answer(refundQuestion);
assert.deepEqual(scope.resolveAnswerScope([], refundQuestion, now).years, [2026]);
assert.doesNotMatch(refundAnswer, /năm 2025/);
assert.match(refundAnswer, /Không cộng tiền lương công ty vào doanh thu kinh doanh/);
assert.match(refundAnswer, /chứng từ/);
assert.match(refundAnswer, /không mặc định hoàn toàn bộ/);
assert.doesNotMatch(refundAnswer, /5%|1,5 triệu|năm trước/);
assert.equal(answer(refundQuestion.replace('TikTok', 'Năm 2025 TikTok')), undefined);
const unrelatedSources = validation.validateLegalCitations('Xét giảm TNCN?', 'Căn cứ Nghị quyết 43/2026/QH16.',
  ['Nghị quyết 204/2025/QH15', 'Khoản 1 Điều 1 Nghị quyết 43/2026/QH16'], scope.resolveAnswerScope([], 'Năm 2026', now));
assert.deepEqual(unrelatedSources.citations, ['Khoản 1 Điều 1 Nghị quyết 43/2026/QH16']);
const citedSource = validation.validateLegalCitations('Xét giảm TNCN?', 'Không đủ điều kiện.\n\nCăn cứ pháp lý:\nKhoản 1 Điều 1 Nghị quyết 43/2026/QH16',
  ['Nghị quyết 204/2025/QH15'], scope.resolveAnswerScope([], 'Năm 2026', now));
assert.deepEqual(citedSource.citations, ['Khoản 1 Điều 1 Nghị quyết 43/2026/QH16']);
const invoiceWithoutExplicitThreshold = validation.validateLegalCitations('Hộ vượt mốc doanh thu giữa năm, cần dữ liệu gì để tính hạn đăng ký HĐĐT?',
  'Hạn 30 ngày kể từ cuối kỳ có doanh thu lũy kế trên 01 tỷ. Điều 9, Nghị định 141/2026/NĐ-CP.',
  ['Điều 9, Nghị định 141/2026/NĐ-CP'], scope.resolveAnswerScope([], 'Năm 2026', now));
assert.match(invoiceWithoutExplicitThreshold.answer, /Khoản 2 Điều 1 Nghị định 141\/2026/);
assert.doesNotMatch(invoiceWithoutExplicitThreshold.answer, /Điều 9, Nghị định 141/);

const t84 = answer('Năm 2026 bán tạp hóa doanh thu 1,5 tỷ, tỷ lệ GTGT 1%. Giả định hàng hóa đủ điều kiện giảm GTGT 20% theo Nghị quyết 204/2025, tính thuế GTGT bao nhiêu?');
assert.match(t84, /0,8%/);
assert.match(t84, /12\.000\.000 đồng/);
const g004 = answer('Bán hàng thuộc diện được giảm, doanh thu 1,5 tỷ năm 2026; tỷ lệ GTGT gốc 1%. Tính sau giảm.');
assert.match(g004, /12\.000\.000 đồng/);
const g005 = answer('Dịch vụ sửa máy tính 1,5 tỷ, GTGT gốc 5%; nếu đủ điều kiện theo NQ204 thì tính bao nhiêu?');
assert.match(g005, /4%/);
assert.match(g005, /60\.000\.000 đồng/);

const t86 = answer('Tôi là cá nhân cư trú năm 2026 có doanh thu 3.000.000.001 đồng, thu nhập tính thuế hợp lệ 400 triệu đồng. TNCN sau giảm 30% theo Nghị quyết 43 là bao nhiêu?');
assert.match(t86, /3\.000\.000\.001 đồng/);
assert.match(t86, /17%/);
assert.match(t86, /47\.600\.000 đồng/);
const g010 = answer('Doanh thu 3 tỷ 1 đồng, thu nhập tính thuế hợp lệ 400 triệu, cá nhân cư trú. Tính TNCN sau giảm NQ43.');
assert.match(g010, /3\.000\.000\.001 đồng/);
assert.match(g010, /47\.600\.000 đồng/);
const overReliefCap = answer('Năm 2026 cá nhân cư trú doanh thu 10.000.000.001 đồng, thu nhập tính thuế 400 triệu. Thuế suất 17% và giảm NQ43 thế nào?');
assert.match(overReliefCap, /không được giảm 30%/);
assert.match(overReliefCap, /68\.000\.000 đồng/);
assert.doesNotMatch(overReliefCap, /47\.600\.000 đồng/);
assert.doesNotMatch(t86, /TNCN\s*=.*0,5%/);
assert.equal(engine.formatRevenue(3_000_000_001), '3.000.000.001 đồng');
assert.equal(engine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 3_000_000_000 }).pitRate, 0.005);
assert.equal(engine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 3_000_000_001 }).pitRate, 0.17);
assert.equal(engine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 3_000_000_000, pitMethod: 'INCOME_EXPENSE', taxableIncomeVnd: 400_000_000 }).pitRate, 0.15);
assert.equal(engine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 50_000_000_001, taxableIncomeVnd: 400_000_000 }).pitRate, 0.20);

const t91 = answer('Năm 2026 doanh thu hoa hồng TikTok 500 triệu, TikTok giữ lại dòng tax 5 triệu. Doanh thu là bao nhiêu và tax đó chắc là TNCN đã nộp thay không?');
assert.match(t91, /500 triệu đồng/);
assert.match(t91, /chưa đủ/);
assert.match(t91, /chứng từ/);

const t95 = answer('Năm 2026 vợ chồng làm affiliate độc lập, mỗi người 600 triệu doanh thu. Có cộng gộp không, nếu một người đứng tên hộ thì sao?');
assert.match(t95, /mỗi người 600 triệu/);
assert.match(t95, /đứng tên hộ/);

const t98 = answer('Năm 2026 vượt 1 tỷ, thời hạn đăng ký hóa đơn điện tử 30 ngày căn cứ điều khoản nào?');
assert.match(t98, /30 ngày/);
assert.match(t98, /khoản 2 Điều 1 Nghị định 141\/2026/);
assert.match(t98, /khoản 5 Điều 8 Nghị định 68\/2026/);
assert.doesNotMatch(t98, /Điều 9 Nghị định 141/);
const g025 = answer('Hộ kinh doanh vượt mốc doanh thu 1 tỷ năm 2026; hạn đăng ký hóa đơn điện tử và căn cứ điều khoản?');
assert.match(g025, /30 ngày kể từ ngày cuối cùng của kỳ tính thuế/);
assert.match(g025, /năm trước có doanh thu không quá 1 tỷ/);
assert.match(g025, /khoản 2 Điều 1 Nghị định 141\/2026/);
const g125 = answer('Hộ đạt doanh thu trên 1 tỷ ở năm 2025; hỏi năm 2026 có nghĩa vụ HĐĐT gì theo quy định mới.');
assert.ok(g125, JSON.stringify(scope.resolveAnswerScope([], 'Hộ đạt doanh thu trên 1 tỷ ở năm 2025; hỏi năm 2026 có nghĩa vụ HĐĐT gì theo quy định mới.', now)));
assert.match(g125, /điểm a khoản 5 Điều 8/);
assert.match(g125, /Không áp nhánh 30 ngày/);
const g131 = answer('AI tìm thấy bản dự thảo nghị định và văn bản đã ban hành khác nội dung; câu trả lời được dùng bản nào?');
assert.match(g131, /bản dự thảo chỉ là nội dung dự kiến/);
assert.doesNotMatch(g131, /Nghị quyết 43\/2026/);
const g025Citation = validation.validateLegalCitations('Hộ kinh doanh vượt mốc doanh thu 1 tỷ năm 2026; hạn đăng ký hóa đơn điện tử và căn cứ điều khoản?',
  'Hạn là 30 ngày kể từ cuối kỳ. Căn cứ pháp lý: Điều 9, Nghị định 141/2026/NĐ-CP.',
  ['Điều 9, Nghị định 141/2026/NĐ-CP'], scope.resolveAnswerScope([], 'Năm 2026', now));
assert.doesNotMatch(g025Citation.answer, /Điều 9, Nghị định 141/);
assert.match(g025Citation.answer, /Khoản 2 Điều 1 Nghị định 141\/2026/);
assert.doesNotMatch(g025Citation.citations.join(' '), /Điều 9, Nghị định 141/);
const duplicateCitation = validation.validateLegalCitations('Năm 2026 vượt 1 tỷ, hạn đăng ký hóa đơn điện tử?',
  'Hóa đơn điện tử đăng ký trong 30 ngày. Điều 9, Nghị định 141/2026/NĐ-CP. Khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP sửa đổi khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP.',
  [], scope.resolveAnswerScope([], 'Năm 2026', now));
assert.doesNotMatch(duplicateCitation.answer, /Điều 9, Nghị định 141/);
assert.equal((duplicateCitation.answer.match(/Khoản 2 Điều 1 Nghị định 141\/2026/g) || []).length, 1);
const citationCheck = validation.validateLegalCitations('Năm 2026 vượt 1 tỷ, HĐĐT phải đăng ký trong bao lâu?',
  'Hóa đơn điện tử đăng ký trong 30 ngày, Điều 9 Nghị định 141/2026/NĐ-CP.',
  ['Điều 9 Nghị định 141/2026/NĐ-CP'], scope.resolveAnswerScope([], 'Năm 2026', now));
assert.match(citationCheck.answer, /Khoản 2 Điều 1 Nghị định 141\/2026/);
assert.doesNotMatch(citationCheck.answer, /Điều 9 Nghị định 141/);
assert.deepEqual(validation.missingAnswerIntents('TikTok giữ tax 5 triệu; doanh thu và tax là TNCN không?', 'Doanh thu 500 triệu.'), ['pit', 'platform_withholding']);

const t100 = answer('Năm 2026 doanh thu 3 tỷ + 1 đồng, có thể vẫn dùng TNCN 0,5% không? Thuế suất nào?');
assert.match(t100, /3\.000\.000\.001 đồng/);
assert.match(t100, /17%/);
assert.doesNotMatch(t100, /cung cấp luật/);

const nq43Boundary = 'Một cá nhân cư trú có tổng doanh thu kinh doanh năm 2026 đúng bằng 10 tỷ đồng; một cá nhân khác có doanh thu 10 tỷ đồng cộng thêm 1 đồng. Chỉ xét đến chính sách giảm 30% thuế thu nhập cá nhân (TNCN) theo Nghị quyết 43/2026.';
assert.equal(answer(nq43Boundary), undefined, 'Do not preempt the dedicated 10-billion relief answer');
console.log('T84 T86 T91 T95 T98 T100 and boundary isolation passed');
