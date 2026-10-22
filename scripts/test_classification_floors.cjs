/**
 * SÀN TIN CẬY PHÂN LOẠI + RÀNG BUỘC API QUYET
 *
 * 1. Nhãn điều khiển pipeline (taxpayer/topic/revenue_context) phải có sàn độ
 *    tin cậy: dưới sàn thì hạ về giá trị trung tính, không được ghim evidence
 *    theo topic sai hay mở khóa template tính thuế theo phân loại không chắc.
 * 2. Bảo vệ ràng buộc API Quyet: System One chỉ nhận 2–10 lựa chọn mỗi câu hỏi
 *    (chữ A–J). Mọi câu hỏi sinh ra (kể cả nhánh review có safe_fact) phải nằm
 *    trong khung này, nếu không API trả 422 và toàn bộ pipeline mất phân loại.
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
      if (!(id in dependencies)) {
 if(id==='../kb/periodApplicability')return loadModule('worker/src/kb/periodApplicability.ts');
 if(id.endsWith('/scopeAssessment'))return loadModule('worker/src/decision/scopeAssessment.ts');
 throw new Error(`Unexpected import: ${id}`);
}
      return dependencies[id];
    },
    module, module.exports,
  );
  return module.exports;
}

const labels = loadModule('worker/src/decision/labels.ts');
const reviewIntegrity = loadModule('worker/src/decision/reviewIntegrity.ts');
const claimGrounding = loadModule('worker/src/decision/claimGrounding.ts',{'./reviewIntegrity':reviewIntegrity});
const { JevDecisionProvider, QuyetDecisionProvider } = loadModule('worker/src/decision/jevProvider.ts', {
  './labels': labels, './claimGrounding': claimGrounding,
  './reviewIntegrity': reviewIntegrity, './registrationScope':loadModule('worker/src/decision/registrationScope.ts'),
});

/** Provider stub: trả lời mọi câu hỏi bằng lựa chọn cuối, độ tin cậy cấu hình được. */
class StubProvider extends QuyetDecisionProvider {
  constructor(confidence, overrides = {}) {
    super('stub');
    this.confidence = confidence;
    this.overrides = overrides;
    this.lastQuestions = null;
  }
  async ask(_state, questions) {
    this.lastQuestions = questions;
    const answers = {};
    for (const [key, q] of Object.entries(questions)) {
      if (q.type === 'noul') { answers[key] = { type: 'noul', noul: this.confidence }; continue; }
      const choices = Object.keys(q.criteria);
      const choice = this.overrides[key] || choices[choices.length - 1];
      assert.ok(choices.includes(choice), `stub answer ${key}=${choice} phải nằm trong criteria`);
      answers[key] = { type: 'choice', choice, confidence: this.confidence };
    }
    // ask() ở prod đã unwrap data.answers — stub trả map trần y như tầng đó.
    return answers;
  }
}

/** Kiểm 2 ≤ số lựa chọn ≤ 10 cho mọi câu hỏi choice; trả về mức tối đa gặp. */
function assertOptionBounds(questions) {
  let maxOptions = 0;
  for (const [key, q] of Object.entries(questions)) {
    if (q.type !== 'choice') continue;
    const count = Object.keys(q.criteria).length;
    maxOptions = Math.max(maxOptions, count);
    assert.ok(count >= 2, `${key} cần tối thiểu 2 lựa chọn`);
    assert.ok(count <= 10, `${key} vượt hạn chế Quyet 2–10 lựa chọn (A–J): ${count}`);
  }
  return maxOptions;
}

const eightYears = 'Năm 2018, 2019, 2020, 2021, 2022, 2023, 2024 và 2025 tôi nộp thuế thế nào?';
// Lưu ý: keys '2018'…'2025' là integer-like nên JS luôn liệt kê trước các key
// chuỗi trong criteria — không thể dựa "key cuối" để nhắc năm cụ thể.
const overridesLabelled = {
  taxpayer: 'HOUSEHOLD_BUSINESS', topic: 'TAX_AMOUNT', revenue_context: 'ACTUAL_YEAR', tax_period: '2025',
};
const overridesGeneric = {
  taxpayer: 'HOUSEHOLD_BUSINESS', topic: 'TAX_AMOUNT', revenue_context: 'ACTUAL_YEAR',
};

async function main() {
  // 1. Nhãn tự tin được giữ nguyên; ràng buộc 2–10 lựa chọn đúng cả trường hợp
  // tax_period nhờ tới 8 năm được nhắc trong câu hỏi (CURRENT + MULTIPLE + 8 = 10).
  const boundsProvider = new StubProvider(0.95, overridesLabelled);
  const confident = await boundsProvider.classifyBusiness(eightYears);
  assert.equal(confident.taxpayer, 'HOUSEHOLD_BUSINESS');
  assert.equal(confident.topic, 'TAX_AMOUNT');
  assert.equal(confident.revenueContext, 'ACTUAL_YEAR');
  assert.deepEqual(confident.taxYears, [2025]);
  assert.equal(assertOptionBounds(boundsProvider.lastQuestions), 10,
    'phải có câu hỏi chạm đúng trần 10 lựa chọn để test có ý nghĩa');

  // 2. Dưới sàn 0.6: taxpayer/topic/revenue_context bị hạ về trung tính,
  // pipeline đi đường RAG + review thay vì template xác định theo nhãn thiếu căn cứ.
  const low = new StubProvider(0.4, overridesGeneric);
  const lowResult = await low.classifyBusiness('Doanh thu 2 tỷ tháng 10 năm 2026');
  assert.equal(lowResult.taxpayer, 'UNKNOWN', 'taxpayer dưới sàn không mở khóa template HKD/CNKD');
  assert.equal(lowResult.topic, 'OTHER', 'topic dưới sàn không ghim evidence theo topic');
  assert.equal(lowResult.revenueContext, 'UNSPECIFIED', 'ACTUAL_YEAR dưới sàn không mở khóa template lịch sử');
  assert.equal(lowResult.confidence?.taxpayer, 0.4, 'giữ độ tin cậy thô để quan trắc');

  // 3. Nhãn an toàn sẵn (chặn template) giữ nguyên ngay cả khi tin cậy thấp.
  const lowSafe = await new StubProvider(0.4, {
    taxpayer: 'HOUSEHOLD_BUSINESS', topic: 'REVENUE_THRESHOLD', revenue_context: 'PARTIAL_PERIOD',
  }).classifyBusiness('Doanh thu quý này 2 tỷ');
  assert.equal(lowSafe.revenueContext, 'PARTIAL_PERIOD', 'nhãn chặn an toàn không bị nâng nhãn');
  assert.equal(lowSafe.topic, 'OTHER');

  // 4. Ranh giới sàn: đúng 0.6 thì giữ nhãn.
  const boundary = await new StubProvider(0.6, overridesGeneric)
    .classifyBusiness('Doanh thu 2 tỷ năm 2026');
  assert.equal(boundary.taxpayer, 'HOUSEHOLD_BUSINESS');
  assert.equal(boundary.topic, 'TAX_AMOUNT');
  assert.equal(boundary.revenueContext, 'ACTUAL_YEAR');

  // 5. Nhánh review cũng phải nằm trong khung 2–10 lựa chọn. Đáp án 12 đoạn để
  // xác minh safe_fact bị giới hạn (NONE + 8 đoạn = 9, không hơn).
  const reviewProvider = new StubProvider(0.95);
  const reviewAnswer = Array.from({ length: 12 }, (_, i) => `Đoạn dữ kiện minh họa ${i + 1}.`)
    .join('\n\n');
  const issues = await reviewProvider.reviewAnswer('Doanh thu 2 tỷ tính thuế thế nào?',
    reviewAnswer, 'Bằng chứng minh họa.', [],
    { topic: 'TAX_AMOUNT', primaryIntent: 'TAX_CALCULATION', secondaryIntents: [], incomeTypes: [] });
  assert.notEqual(issues, null, 'review stub phải trả về danh sách issues hợp lệ');
  assert.ok(assertOptionBounds(reviewProvider.lastQuestions) <= 10,
    'câu hỏi review vượt khung 2–10 lựa chọn');

  console.log('Classification confidence floors passed.');
}

main().catch((e) => { console.error(e); process.exit(1); });
