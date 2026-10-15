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
const scope = load('worker/src/answerScope.ts', { './conversation': conversation, './utils/text': textUtils });
const engine = load('worker/src/taxEngine.ts');
const priority = load('worker/src/priorityTaxAnswer.ts', { './taxEngine': engine });
const validation = load('worker/src/answerValidation.ts');
const now = new Date('2026-10-14T05:00:00Z');
const answer = q => priority.answerPriorityTax(q, scope.resolveAnswerScope([], q, now))?.response;

const t84 = answer('Năm 2026 bán tạp hóa doanh thu 1,5 tỷ, tỷ lệ GTGT 1%. Giả định hàng hóa đủ điều kiện giảm GTGT 20% theo Nghị quyết 204/2025, tính thuế GTGT bao nhiêu?');
assert.match(t84, /0,8%/);
assert.match(t84, /12\.000\.000 đồng/);
const g004 = answer('Bán hàng thuộc diện được giảm, doanh thu 1,5 tỷ năm 2026; tỷ lệ GTGT gốc 1%. Tính sau giảm.');
assert.match(g004, /12\.000\.000 đồng/);

const t86 = answer('Tôi là cá nhân cư trú năm 2026 có doanh thu 3.000.000.001 đồng, thu nhập tính thuế hợp lệ 400 triệu đồng. TNCN sau giảm 30% theo Nghị quyết 43 là bao nhiêu?');
assert.match(t86, /3\.000\.000\.001 đồng/);
assert.match(t86, /17%/);
assert.match(t86, /47\.600\.000 đồng/);
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
