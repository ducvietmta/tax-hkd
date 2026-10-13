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

console.log('🧪 BẮT ĐẦU KIỂM THỬ SPEC NÂNG CẤP TAX-HKD (5 MỤC)...');

// 1. TẢI CÁC MODULE
const engine = loadModule('worker/src/ragEngine.ts');
const conversation = loadModule('worker/src/conversation.ts');
const scope = loadModule('worker/src/answerScope.ts', { './conversation': conversation });
const pendingTopics = loadModule('worker/src/pendingTopics.ts');
const taxAnswerGuard = loadModule('worker/src/taxAnswerGuard.ts');
const { retrieve, buildContext } = loadModule('worker/src/retriever.ts', {
  './ragEngine': engine,
  './answerScope': scope,
});

// ==========================================
// MỤC 1: KIỂM THỬ isOutOfScope VÀ MẪU TỪ CHỐI
// ==========================================
console.log('▶ Kiểm thử Mục 1: isOutOfScope...');
const outOfScopeQuestions = [
  'Hôm nay trời có mưa không?',
  'Cách nấu món sườn xào chua ngọt',
  'Đội bóng nào vô địch ngoại hạng Anh năm nay?',
  'Giải phương trình x^2 + 5x + 6 = 0',
  'Xin chào',
  'Hello bot!',
];

for (const q of outOfScopeQuestions) {
  assert.equal(scope.isOutOfScope(q), true, `Câu "${q}" phải là out of scope`);
}

const inScopeQuestions = [
  'thuế môn bài là gì?',
  'lệ phí môn bài HKD 2026',
  'doanh thu 800 triệu bán shopee có phải nộp thuế không?',
  'hộ kinh doanh bán tạp hóa 1.2 tỷ nộp bao nhiêu %',
  'cho thuê nhà 2 tỷ/năm tính thuế thế nào?',
  'affiliate tiktok mã số thuế 888',
];

for (const q of inScopeQuestions) {
  assert.equal(scope.isOutOfScope(q), false, `Câu "${q}" phải là in scope`);
}

// Follow-up context check
const followUpHistory = [{ role: 'user', content: 'thuế môn bài hộ kinh doanh' }];
assert.equal(scope.isOutOfScope('vậy là bao nhiêu tiền?', followUpHistory), false, 'Follow-up của câu thuế phải là in scope');
assert.equal(scope.isOutOfScope('800 triệu', followUpHistory), false, 'Dữ kiện bổ sung của câu thuế phải là in scope');

console.log('  ✅ Mục 1 PASSED: Nhận diện chính xác 100% ngoài phạm vi và trong phạm vi.');

// ==========================================
// MỤC 3: KIỂM THỬ KB LỆ PHÍ MÔN BÀI (16.97)
// ==========================================
console.log('▶ Kiểm thử Mục 3: Lệ phí môn bài KB chunk 16.97...');
const resMonBai1 = retrieve('lệ phí môn bài HKD doanh thu 400 triệu/năm 2026 bao nhiêu?', 4);
const chunk1697Found1 = resMonBai1.results.some((r) => r.chunk.ref_id === '16.97');
assert.ok(chunk1697Found1, 'Phải tìm thấy chunk 16.97 khi hỏi lệ phí môn bài 400 triệu');

const resMonBai2 = retrieve('thuế môn bài bao nhiêu', 4);
const chunk1697Found2 = resMonBai2.results.some((r) => r.chunk.ref_id === '16.97');
assert.ok(chunk1697Found2, 'Phải tìm thấy chunk 16.97 khi hỏi "thuế môn bài" (synonym match)');

const chunk1697 = resMonBai1.results.find((r) => r.chunk.ref_id === '16.97').chunk;
assert.ok(chunk1697.text.includes('Nghị định 139/2016/NĐ-CP'), 'Chunk 16.97 phải có căn cứ NĐ 139/2016');
assert.ok(chunk1697.text.includes('Nghị quyết 198/2025/QH15'), 'Chunk 16.97 phải có căn cứ chấm dứt lệ phí môn bài từ 2026');
assert.ok(chunk1697.text.includes('năm 2026 không phải nộp lệ phí môn bài'), 'Doanh thu 400 triệu trong năm 2026 phải nộp 0 đồng');
assert.ok(chunk1697.text.includes('chỉ dùng để xét nghĩa vụ phát sinh từ năm 2025 trở về trước') || chunk1697.text.includes('CHỈ cho năm 2025 trở về trước'), 'Biểu mức cũ phải được giới hạn cho năm 2025 trở về trước');
assert.ok(chunk1697.text.includes('500.000 đồng/năm'), 'Chunk 16.97 phải có mức 500.000 đồng cho bậc 300 - 500 triệu');
assert.ok(chunk1697.text.includes('1.000.000 đồng/năm'), 'Chunk 16.97 phải có mức 1.000.000 đồng');
assert.ok(chunk1697.text.includes('300.000 đồng/năm'), 'Chunk 16.97 phải có mức 300.000 đồng');
assert.ok(chunk1697.text.includes('ngày 30 tháng 01'), 'Chunk 16.97 phải có hạn 30/01');

console.log('  ✅ Mục 3 PASSED: Chunk 16.97 được truy xuất chuẩn xác cho cả "lệ phí môn bài" và "thuế môn bài".');

// ==========================================
// MỤC 4: GUARD CHO CHỦ ĐỀ PENDING
// ==========================================
console.log('▶ Kiểm thử Mục 4: Pending topic guard...');
const matched19 = pendingTopics.matchPendingTopics('Hộ vừa cho thuê nhà vừa bán cà phê, mỗi thứ 600 triệu thì tính thuế ra sao?');
assert.equal(matched19.length, 1, 'Câu red-team 19 phải match đúng 1 pending topic');
assert.equal(matched19[0].id, 'rental_business_threshold_split');
assert.ok(matched19[0].disclaimer.includes('Cách cộng/tách doanh thu cho thuê tài sản'));

const matchedRentalNormal = pendingTopics.matchPendingTopics('cho thuê nhà 2 tỷ/năm tính thuế thế nào?');
assert.equal(matchedRentalNormal.length, 0, 'Câu cho thuê nhà 2 tỷ thông thường không được match pending topic');

const matchedCombined1 = pendingTopics.matchPendingTopics('cho thuê nhà và kinh doanh bán hàng có cộng gộp xét ngưỡng 1 tỷ không?');
assert.equal(matchedCombined1.length, 1, 'Câu hỏi cộng gộp ngưỡng 1 tỷ cho thuê + bán hàng phải match');

console.log('  ✅ Mục 4 PASSED: Nhận diện chính xác topic rental_business_threshold_split mà không ảnh hưởng câu cho thuê đơn thuần.');

// ==========================================
// MỤC 5: ÉP BẢNG TỶ LỆ % THUẾ KHI HỎI BAO NHIÊU %
// ==========================================
console.log('▶ Kiểm thử Mục 5: Ép tỷ lệ % thuế (chunk 16.77)...');
const resRate1 = retrieve('HKD năm 2026 doanh thu 1.2 tỷ bán tạp hóa thì nộp những thuế gì, bao nhiêu phần trăm?', 4);
assert.equal(resRate1.results[0].chunk.ref_id, '16.77', 'Chunk đầu tiên phải là 16.77 khi hỏi bao nhiêu phần trăm bán tạp hóa');

const resRate2 = retrieve('dịch vụ cắt tóc doanh thu 1.5 tỷ thì thuế suất bao nhiêu?', 4);
assert.equal(resRate2.results[0].chunk.ref_id, '16.77', 'Chunk đầu tiên phải là 16.77 khi hỏi thuế suất dịch vụ cắt tóc');

const chunk1677 = resRate1.results[0].chunk;
assert.ok(chunk1677.text.includes('Phân phối, cung cấp hàng hóa'), '16.77 có bảng phân phối, cung cấp hàng hóa');
assert.ok(chunk1677.text.includes('1%'), '16.77 có tỷ lệ GTGT 1%');
assert.ok(chunk1677.text.includes('0,5%'), '16.77 có tỷ lệ TNCN 0.5%');

console.log('  ✅ Mục 5 PASSED: Chunk 16.77 luôn được force-add lên đầu khi hỏi bao nhiêu % / thuế suất ngành nghề.');

// Chặn câu trả lời sai đã quan sát trên fallback thật, không chỉ kiểm tra chunk được chọn.
const currentScope = scope.resolveAnswerScope([], 'HKD năm 2026 doanh thu 1.2 tỷ bán tạp hóa thì nộp những thuế gì, bao nhiêu phần trăm?', new Date('2026-10-13T05:00:00Z'));
const wrongRetail = taxAnswerGuard.guardTaxAnswer('HKD năm 2026 doanh thu 1.2 tỷ bán tạp hóa thì nộp những thuế gì, bao nhiêu phần trăm?', currentScope, ['16.77'], 'GTGT 12 triệu, TNCN = 1,2 tỷ × 0,5% = 6 triệu.');
assert.equal(wrongRetail.reason, 'retail_rate_calculation');
assert.ok(wrongRetail.answer.includes('1 triệu đồng'));
assert.ok(!wrongRetail.answer.includes('6 triệu đồng'));
assert.equal(taxAnswerGuard.guardTaxAnswer('HKD năm 2026 doanh thu 1.2 tỷ bán tạp hóa thì nộp những thuế gì, bao nhiêu phần trăm?', currentScope, [], 'Chưa có căn cứ').reason, null);

const oldScope = scope.resolveAnswerScope([], 'Năm 2024 tôi bán online doanh thu 300 triệu mà chưa kê khai, giờ phải làm sao?', new Date('2026-10-13T05:00:00Z'));
assert.equal(retrieve('Năm 2024 tôi bán online doanh thu 300 triệu mà chưa kê khai, giờ phải làm sao?', 4, oldScope).results[0].chunk.ref_id, '16.54');
const vagueOld = taxAnswerGuard.guardTaxAnswer('Năm 2024 tôi bán online doanh thu 300 triệu mà chưa kê khai, giờ phải làm sao?', oldScope, ['16.54'], 'Bạn có thể phải nộp thuế, liên hệ cơ quan thuế để biết thêm.');
assert.equal(vagueOld.reason, 'historical_threshold');
assert.ok(vagueOld.answer.includes('100 triệu đồng/năm'));
assert.ok(vagueOld.answer.includes('Không dùng ngưỡng 1 tỷ của năm 2026 để xét ngược năm 2024.'));
const invertedOld = taxAnswerGuard.guardTaxAnswer('Năm 2024 tôi bán online doanh thu 300 triệu mà chưa kê khai, giờ phải làm sao?', oldScope, ['16.54'], 'Doanh thu 300 triệu dưới 100 triệu nên không phải nộp thuế.');
assert.equal(invertedOld.reason, 'historical_threshold');
assert.ok(!invertedOld.answer.includes('300 triệu dưới 100 triệu'));

console.log('\n🎉 TOÀN BỘ 5 MỤC ĐÃ ĐƯỢC KIỂM THỬ THÀNH CÔNG VÀ CHÍNH XÁC!');
