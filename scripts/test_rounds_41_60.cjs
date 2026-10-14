const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relativePath, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    id => {
      if (!(id in dependencies)) throw new Error(`Unexpected import ${id}`);
      return dependencies[id];
    }, module, module.exports,
  );
  return module.exports;
}

const conversation = load('worker/src/conversation.ts');
const textUtils = load('worker/src/utils/text.ts');
const sectorIntent = load('worker/src/sectorIntent.ts', { './utils/text': textUtils });
const scope = load('worker/src/answerScope.ts', { './conversation': conversation, './utils/text': textUtils });
const taxEngine = load('worker/src/taxEngine.ts');
const relief = load('worker/src/reliefEligibilityAnswer.ts');
const business = load('worker/src/businessTaxAnswer.ts', { './taxEngine': taxEngine, './utils/text': textUtils, './sectorIntent': sectorIntent });
const guard = load('worker/src/taxAnswerGuard.ts', { './taxEngine': taxEngine, './utils/text': textUtils, './sectorIntent': sectorIntent });
const now = new Date('2026-10-14T05:00:00Z');
const answer = question => business.answerVerifiedBusinessTax(question, scope.resolveAnswerScope([], question, now));

const nq43BoundaryQuestion = 'Một cá nhân cư trú có tổng doanh thu kinh doanh năm 2026 đúng bằng 10 tỷ đồng; một cá nhân khác có doanh thu 10 tỷ đồng cộng thêm 1 đồng. Chỉ xét đến chính sách giảm 30% thuế thu nhập cá nhân (TNCN) theo Nghị quyết 43/2026. Trường hợp nào đủ điều kiện, và liệu doanh thu từ 5 cửa hàng có được cộng gộp ở cấp độ cá nhân hay không? Lưu ý không nhầm lẫn giữa mức 10 tỷ đồng này với ngưỡng miễn thuế 1 tỷ đồng.';
const nq43BoundaryScope = scope.resolveAnswerScope([], nq43BoundaryQuestion, now);
const nq43BoundaryAnswer = relief.answerVerifiedReliefEligibility(nq43BoundaryQuestion, nq43BoundaryScope);
assert.ok(nq43BoundaryAnswer, 'Exact 10 billion boundary question should use the verified answer');
assert.match(nq43BoundaryAnswer.response, /10\.000\.000\.000 đồng.*đáp ứng/);
assert.match(nq43BoundaryAnswer.response, /10\.000\.000\.001 đồng.*không đủ điều kiện/);
assert.match(nq43BoundaryAnswer.response, /5 cửa hàng.*cộng doanh thu/);
assert.match(nq43BoundaryAnswer.response, /không phải ngưỡng 1 tỷ/);
assert.equal(guard.guardTaxAnswer(nq43BoundaryQuestion, nq43BoundaryScope, ['16.99'], 'Câu trả lời giả lập').reason, null);
const oneBillionQuestion = 'Doanh thu bán hàng năm 2026 vượt ngưỡng 1 tỷ đúng 1 đồng, tính thuế?';
assert.equal(guard.guardTaxAnswer(oneBillionQuestion, scope.resolveAnswerScope([], oneBillionQuestion, now), ['16.99'], '').reason, 'one_dong_threshold_rounding');
const vatReliefQuestion = 'Tôi cung cấp dịch vụ sửa chữa máy vi tính, không bán lẻ tạp hóa, doanh thu 1,5 tỷ năm 2026, thuế GTGT theo tỷ lệ 5%. Nghị quyết 204/2025/QH15 có thể giảm mức tỷ lệ GTGT của tôi xuống 4% hay không? Cần xác định điều kiện gì? Nghị quyết 43/2026/QH16 có giảm GTGT không? Không đổi thành ngành bán lẻ.';
const vatReliefAnswer = answer(vatReliefQuestion);
assert.ok(vatReliefAnswer, 'Exact MCP question should use a verified answer');
assert.equal(vatReliefAnswer.facts.activityType, 'service');
assert.match(vatReliefAnswer.response, /5% còn 4%/);
assert.match(vatReliefAnswer.response, /60\.000\.000 đồng/);
assert.match(vatReliefAnswer.response, /75\.000\.000 đồng/);
assert.match(vatReliefAnswer.response, /không giảm thuế GTGT/);
assert.doesNotMatch(vatReliefAnswer.response, /GTGT: 1%|TNCN sau giảm: 1\.750\.000/);
assert.equal(guard.guardTaxAnswer(vatReliefQuestion, scope.resolveAnswerScope([], vatReliefQuestion, now), ['16.99', '16.50'], 'Câu trả lời giả lập').reason, null);

const repairParaphrases = [
  'Năm 2026 tôi làm dịch vụ sửa chữa, doanh thu 1,5 tỷ, thuế GTGT và TNCN bao nhiêu?',
  'Tiệm sửa máy tính doanh thu 1.5 tỷ năm 2026, phải nộp thuế gì?',
  'Cá nhân cư trú sửa chữa năm 2026 doanh thu 1,5 tỷ: TNCN cuối cùng?',
  'Dịch vụ sửa máy tính năm 2026 đạt 1,5 tỷ doanh thu, thuế sau giảm 30%?',
  'Tôi sửa chữa năm 2026, doanh thu 1,5 tỷ; kế toán bảo TNCN 30 triệu, đúng không?',
  'Năm 2026 doanh thu 1,5 tỷ từ dịch vụ sửa chữa. TNCN trước ưu đãi 10 triệu hay cuối cùng 7 triệu?',
];
for (const question of repairParaphrases) {
  const result = answer(question);
  assert.ok(result, question);
  assert.match(result.response, /75\.000\.000 đồng/);
  assert.match(result.response, /10\.000\.000 đồng/);
  assert.match(result.response, /7\.000\.000 đồng/);
  assert.match(result.response, /Nghị quyết 43\/2026\/QH16/);
}

const retailParaphrases = [
  'Cá nhân cư trú bán hàng hóa năm 2026 doanh thu 1,01 tỷ: TNCN bao nhiêu?',
  'Tạp hóa doanh thu 1.01 tỷ năm 2026, thuế TNCN sau giảm 30%?',
  'Năm 2026 bán lẻ doanh thu 1,01 tỷ; có phải TNCN là 3.535.000 đồng?',
  'Năm 2026 doanh thu 1,01 tỷ bán hàng, phải nộp GTGT và TNCN bao nhiêu?',
  'Người cư trú năm 2026 phân phối hàng hóa doanh thu 1,01 tỷ, tính thuế?'
];
for (const question of retailParaphrases) {
  const result = answer(question);
  assert.ok(result, question);
  assert.match(result.response, /50\.000 đồng/);
  assert.match(result.response, /35\.000 đồng/);
  assert.doesNotMatch(result.response, /3\.535\.000 đồng/);
}

const mixedParaphrases = [
  'Năm 2026 tôi vừa bán hàng 800 triệu và làm dịch vụ sửa chữa 350 triệu, tính thuế TNCN thế nào?',
  'Bán lẻ 800 triệu, sửa chữa 350 triệu trong năm 2026: TNCN sau giảm bao nhiêu?',
  'Cá nhân cư trú năm 2026 có hàng hóa 800 triệu và sửa máy 350 triệu, thuế cuối cùng?',
  'Sửa xe doanh thu 350 triệu và bán hàng 800 triệu năm 2026, khấu trừ 1 tỷ thế nào?',
  'Năm 2026, doanh thu bán hàng 800tr; doanh thu dịch vụ sửa chữa 350tr. Thuế TNCN?',
];
for (const question of mixedParaphrases) {
  const result = answer(question);
  assert.ok(result, question);
  assert.match(result.response, /750\.000 đồng/);
  assert.match(result.response, /525\.000 đồng/);
  assert.match(result.response, /một lần trong năm/);
}

const laterYear = answer('Năm 2027 tôi sửa máy tính doanh thu 1,5 tỷ, có được giảm TNCN không? Năm 2028 thì sao?');
assert.ok(laterYear);
assert.match(laterYear.response, /7\.000\.000 đồng/);
assert.match(laterYear.response, /không tự áp dụng mức giảm này cho năm 2028/);

const nonresident = answer('Cá nhân không cư trú sửa chữa năm 2026 doanh thu 1,5 tỷ, giảm TNCN 30% không?');
assert.equal(nonresident, null);

assert.equal(answer('Năm 2025 tôi sửa chữa doanh thu 1,5 tỷ, có được giảm 30% không?'), null);
assert.equal(answer('Năm 2026 tôi có lương và sửa chữa doanh thu 1,5 tỷ, tính thuế?'), null);
assert.equal(answer('Năm 2026 dịch vụ sửa chữa tính theo lợi nhuận, doanh thu 1,5 tỷ, TNCN?'), null);
assert.equal(answer('Năm 2026 sửa chữa doanh thu 1,5 tỷ hoặc 2 tỷ, thuế bao nhiêu?'), null);
assert.equal(taxEngine.calculateTax({ taxYear: 2028, activityType: 'service', grossRevenueVnd: 1_500_000_000 }).status, 'NEEDS_LEGAL_REVIEW');

console.log('Rounds 41–60: verified single-sector, mixed-sector, 2027 boundary and ambiguity regression checks passed.');
