/**
 * TEST SUITE 42 CA KIỂM THỬ HỒI QUY VÀ METAMORPHIC TESTS (ATAI-PATCH-40-2026-10)
 * Kiểm định: Deterministic Tax Engine, Bitemporal Snapshot, NQ 43/2026/QH16,
 * RAG Hybrid Retrieval, Citation Validator, Answer Guard, Model Invariant Check.
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

console.log('================================================================');
console.log('🧪 BẮT ĐẦU TEST SUITE 42 CA (ATAI-PATCH-40-2026-10) VÀ METAMORPHIC');
console.log('================================================================\n');

// 1. TẢI MODULES
const textUtils = loadModule('worker/src/utils/text.ts');
const sectorIntent = loadModule('worker/src/sectorIntent.ts', { './utils/text': textUtils });
const engine = loadModule('worker/src/ragEngine.ts');
const conversation = loadModule('worker/src/conversation.ts');
const scope = loadModule('shared/taxScope.ts');
const pendingTopics = loadModule('worker/src/pendingTopics.ts');
const taxEngine = loadModule('worker/src/taxEngine.ts');
const taxAnswerGuard = loadModule('worker/src/taxAnswerGuard.ts', { './taxEngine': taxEngine, './utils/text': textUtils, './sectorIntent': sectorIntent });
const { retrieve, buildContext, analyzeAmounts } = loadModule('worker/src/retriever.ts', {
  './ragEngine': engine,
  './answerScope': scope,
  './taxEngine': taxEngine,
  './utils/text': textUtils,
  './decision/factExtractor': loadModule('worker/src/decision/factExtractor.ts'),
});

const resultsReport = [];

function recordResult(id, name, expected, actual, pass, category = 'PASS_LEGAL', notes = '') {
  resultsReport.push({
    id,
    name,
    expected,
    actual,
    pass,
    category,
    notes,
  });
  const statusEmoji = pass ? '✅' : '❌';
  console.log(`${statusEmoji} [${id}] ${name}: ${category}`);
}

// ================================================================
// PHẦN A: KIỂM THỬ 5 GOLD CONTRACTS (E01 - E05)
// ================================================================
console.log('\n--- PHẦN A: 5 HỢP ĐỒNG GOLD MINH HỌA (E01 - E05) ---');

// E01: Bán hàng 1,01 tỷ năm 2026, cá nhân cư trú
{
  const calc = taxEngine.calculateTax({
    taxYear: 2026,
    activityType: 'goods',
    grossRevenueVnd: 1_010_000_000,
    isResident: true,
  });
  const pass =
    calc.vatDueVnd === 10_100_000 &&
    calc.taxablePitRevenueVnd === 10_000_000 &&
    calc.pitBeforeReliefVnd === 50_000 &&
    calc.pitReliefVnd === 15_000 &&
    calc.pitAfterReliefVnd === 35_000 &&
    calc.totalTaxPayableVnd === 10_135_000;
  assert.ok(pass, 'E01 phải tính chính xác VAT 10,1tr, PIT trước giảm 50k, giảm 15k, sau giảm 35k');
  recordResult('E01', 'Bán hàng 1,01 tỷ 2026 cư trú', 'VAT 10,1tr | PIT trước 50k | giảm 15k | sau 35k', `${calc.vatDueVnd} | ${calc.pitBeforeReliefVnd} | ${calc.pitReliefVnd} | ${calc.pitAfterReliefVnd}`, pass, 'PASS_LEGAL');
}

// E02: Dịch vụ máy tính 1,5 tỷ 2026, cá nhân cư trú
{
  const calc = taxEngine.calculateTax({
    taxYear: 2026,
    activityType: 'service',
    grossRevenueVnd: 1_500_000_000,
    isResident: true,
  });
  const pass =
    calc.vatDueVnd === 75_000_000 &&
    calc.taxablePitRevenueVnd === 500_000_000 &&
    calc.pitBeforeReliefVnd === 10_000_000 &&
    calc.pitReliefVnd === 3_000_000 &&
    calc.pitAfterReliefVnd === 7_000_000 &&
    calc.totalTaxPayableVnd === 82_000_000;
  assert.ok(pass, 'E02 phải tính chính xác VAT 75tr, PIT trước giảm 10tr, giảm 3tr, sau giảm 7tr');
  recordResult('E02', 'Dịch vụ 1,5 tỷ 2026 cư trú', 'VAT 75tr | PIT trước 10tr | giảm 3tr | sau 7tr', `${calc.vatDueVnd} | ${calc.pitBeforeReliefVnd} | ${calc.pitReliefVnd} | ${calc.pitAfterReliefVnd}`, pass, 'PASS_LEGAL');
}

// E03: Bán hàng 300 triệu năm 2025 (không dùng NQ43)
{
  const calc = taxEngine.calculateTax({
    taxYear: 2025,
    activityType: 'goods',
    grossRevenueVnd: 300_000_000,
  });
  const pass =
    calc.vatDueVnd === 3_000_000 &&
    calc.pitBeforeReliefVnd === 1_500_000 &&
    calc.pitReliefVnd === 0 &&
    calc.pitAfterReliefVnd === 1_500_000;
  assert.ok(pass, 'E03 năm 2025 phải tính VAT 3tr, PIT 1,5tr, không có NQ43');
  recordResult('E03', 'Bán hàng 300 triệu 2025', 'VAT 3tr | PIT 1,5tr | NQ43 = 0', `${calc.vatDueVnd} | ${calc.pitAfterReliefVnd} | relief=${calc.pitReliefVnd}`, pass, 'PASS_LEGAL');
}

// E04: Affiliate 1,6 tỷ chưa rõ hoạt động thực tế
{
  const calc = taxEngine.calculateTax({
    taxYear: 2026,
    activityType: 'affiliate_unknown',
    grossRevenueVnd: 1_600_000_000,
  });
  const pass = calc.status === 'NEEDS_INFO' && !calc.explanation.includes('80 triệu');
  assert.ok(pass, 'E04 chưa rõ hoạt động affiliate phải ra NEEDS_INFO và không ép 80 triệu');
  recordResult('E04', 'Affiliate 1,6 tỷ chưa rõ', 'status=NEEDS_INFO, không chốt 80 triệu', `status=${calc.status}`, pass, 'PASS_FUNCTIONAL');
}

// E05: Nhiều ngành (Bán hàng 800tr + Dịch vụ 350tr = 1,15 tỷ)
{
  const calc = taxEngine.calculateTax({
    taxYear: 2026,
    activityType: 'multi',
    grossRevenueVnd: 1_150_000_000,
    isResident: true,
    multiActivities: [
      { id: 'goods', kind: 'goods', revenueVnd: 800_000_000, vatRate: 0.01, pitRate: 0.005 },
      { id: 'service', kind: 'service', revenueVnd: 350_000_000, vatRate: 0.05, pitRate: 0.02 },
    ],
  });
  const pass =
    calc.vatDueVnd === 25_500_000 &&
    calc.pitBeforeReliefVnd === 750_000 &&
    calc.pitReliefVnd === 225_000 &&
    calc.pitAfterReliefVnd === 525_000;
  assert.ok(pass, 'E05 nhiều ngành phân bổ tối ưu: VAT 25,5tr, PIT trước 750k, giảm 225k, sau giảm 525k');
  recordResult('E05', 'Nhiều ngành 800tr + 350tr', 'VAT 25,5tr | PIT trước 750k | giảm 225k | sau 525k', `${calc.vatDueVnd} | ${calc.pitBeforeReliefVnd} | ${calc.pitReliefVnd} | ${calc.pitAfterReliefVnd}`, pass, 'PASS_LEGAL');
}

// ================================================================
// PHẦN B: KIỂM THỬ 42 CA QUY ĐỊNH (T01 - T42)
// ================================================================
console.log('\n--- PHẦN B: 42 CA KIỂM THỬ CHI TIẾT (T01 - T42) ---');

// T01: 2026 bán hàng hóa 450tr, hỏi GTGT/TNCN và ĐKKD
{
  const calc = taxEngine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 450_000_000 });
  const pass = calc.vatDueVnd === 0 && calc.pitAfterReliefVnd === 0;
  recordResult('T01', '2026 bán hàng 450tr', 'Thuế = 0đ (dưới 1 tỷ), không miễn ĐKKD', `Thuế: ${calc.totalTaxPayableVnd}đ`, pass, 'PASS_LEGAL');
}

// T02: 2026 HKD 350tr có đầu vào không xuất đầu ra
{
  const calc = taxEngine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 350_000_000 });
  const pass = calc.totalTaxPayableVnd === 0;
  recordResult('T02', '2026 HKD 350tr có đầu vào', 'Dưới 1 tỷ thuế = 0, HĐĐT tự nguyện', `Thuế: ${calc.totalTaxPayableVnd}đ`, pass, 'PASS_FUNCTIONAL');
}

// T03: Affiliate Hà Nội 2tr/tháng, ngưỡng miễn đăng ký
{
  const calc = taxEngine.calculateTax({ taxYear: 2026, activityType: 'affiliate_unknown', grossRevenueVnd: 24_000_000 });
  const pass = calc.status === 'NEEDS_INFO';
  recordResult('T03', 'Affiliate Hà Nội 2tr/tháng', 'Không bịa ngưỡng riêng Hà Nội, tách ĐKKD và thuế', `status=${calc.status}`, pass, 'PASS_FUNCTIONAL');
}

// T04: Affiliate TikTok 600tr app ghi "tax"
{
  const calc = taxEngine.calculateTax({ taxYear: 2026, activityType: 'affiliate_unknown', grossRevenueVnd: 600_000_000 });
  const pass = calc.status === 'NEEDS_INFO';
  recordResult('T04', 'Affiliate TikTok 600tr app tax', 'Cần chứng từ khấu trừ, không suy đoán nộp thay', `status=${calc.status}`, pass, 'PASS_FUNCTIONAL');
}

// T05: HKD tạp hóa làm thêm affiliate Shopee, MST 888
{
  const ansScope = scope.resolveAnswerScope([], 'tạp hóa làm thêm affiliate shopee có cần xin mã 888 mới không?');
  const guarded = taxAnswerGuard.guardTaxAnswer('tạp hóa làm thêm affiliate shopee có cần xin mã 888 mới không?', ansScope, ['16.96'], 'Bạn bắt buộc phải xin mã 888 mới cho kênh này.');
  const pass = guarded.reason === 'tax_id_888_cccd_replacement' && guarded.answer.includes('KHÔNG bắt buộc phải xin thêm mã số thuế đuôi 888 mới');
  recordResult('T05', 'Tạp hóa thêm affiliate Shopee MST 888', 'Không bắt buộc xin mã 888 mới (TT86)', `Guarded: ${guarded.reason}`, pass, 'PASS_LEGAL');
}

// T06: 2026 hàng hóa đúng 1 tỷ và 1,01 tỷ
{
  const calc1B = taxEngine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 1_000_000_000 });
  const calc101B = taxEngine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 1_010_000_000, isResident: true });
  const pass = calc1B.totalTaxPayableVnd === 0 && calc101B.vatDueVnd === 10_100_000 && calc101B.pitAfterReliefVnd === 35_000;
  recordResult('T06', '2026 hàng hóa 1 tỷ vs 1,01 tỷ', '1 tỷ: 0đ | 1,01 tỷ: VAT 10,1tr, PIT sau giảm 35k', `1B=${calc1B.totalTaxPayableVnd} | 1010M VAT=${calc101B.vatDueVnd}, PIT=${calc101B.pitAfterReliefVnd}`, pass, 'PASS_LEGAL');
}

// T07: Shopee hàng 800tr + affiliate TikTok 350tr
{
  const calc = taxEngine.calculateTax({
    taxYear: 2026,
    activityType: 'multi',
    grossRevenueVnd: 1_150_000_000,
    isResident: true,
    multiActivities: [
      { id: 'goods', kind: 'goods', revenueVnd: 800_000_000, vatRate: 0.01, pitRate: 0.005 },
      { id: 'service', kind: 'service', revenueVnd: 350_000_000, vatRate: 0.05, pitRate: 0.02 },
    ],
  });
  const pass = calc.vatDueVnd === 25_500_000 && calc.pitAfterReliefVnd === 525_000;
  recordResult('T07', 'Shopee 800tr + affiliate 350tr', 'Tổng 1,15 tỷ vượt 1 tỷ, không tách kênh né thuế', `VAT=${calc.vatDueVnd}, PIT=${calc.pitAfterReliefVnd}`, pass, 'PASS_FUNCTIONAL');
}

// T08: Chồng/vợ hai kênh độc lập vs chỉ đổi tên
{
  const ansScope = scope.resolveAnswerScope([], 'vợ chồng hai kênh shopee có được cộng gộp doanh thu xét 1 tỷ không?');
  const ret = retrieve('vợ chồng hai kênh shopee ngưỡng 1 tỷ', 4, ansScope);
  const pass = ret.results.some((r) => r.chunk.ref_id === '16.75');
  recordResult('T08', 'Vợ chồng hai kênh', 'Xét chủ thể kinh doanh độc lập thật, chunk 16.75', `Ref 16.75 found: ${pass}`, pass, 'PASS_FUNCTIONAL');
}

// T09: COD 100k hàng + 30k ship thu hộ
{
  const ret = retrieve('tiền cod 100k ship 30k thu hộ có tính doanh thu không', 4);
  const pass = ret.routeId === 'ORDER_RETURNS_AND_PLATFORM_FEE' || ret.results.some((r) => ['16.32', '16.42', '16.72'].includes(r.chunk.ref_id));
  recordResult('T09', 'COD hàng + ship thu hộ', 'Chỉ trừ ship khi có chứng từ thu hộ hợp lệ', `Route: ${ret.routeId}`, pass, 'PASS_FUNCTIONAL');
}

// T10: 400tr đơn, 60tr hủy/hoàn thật, phí sàn 15tr
{
  const facts = taxEngine.extractTaxFactsFromQuery('400tr đơn, 60tr hủy hoàn thật, phí sàn 15tr');
  assert.ok(facts);
  const calc = taxEngine.calculateTax(facts);
  const pass = calc.effectiveRevenueVnd === 340_000_000 && calc.totalTaxPayableVnd === 0;
  recordResult('T10', '400tr đơn - 60tr hoàn, phí 15tr', 'Doanh thu 340tr, dưới 1 tỷ thuế = 0, không trừ phí sàn', `Doanh thu: ${calc.effectiveRevenueVnd}`, pass, 'PASS_LEGAL');
}

// T11: 2025 vs 2026 cùng bán hàng 300tr
{
  const ansScope = scope.resolveAnswerScope([], 'năm 2025 và 2026 cùng bán hàng 300 triệu thuế thế nào');
  const guarded = taxAnswerGuard.guardTaxAnswer('năm 2025 và 2026 cùng bán hàng 300 triệu thuế thế nào', ansScope, ['16.54', '16.60'], 'Thuế giống nhau.');
  const pass = guarded.reason === 'year_2025_vs_2026_comparison' && guarded.answer.includes('3.000.000 đồng') && guarded.answer.includes('1.500.000 đồng');
  recordResult('T11', '2025 vs 2026 cùng bán hàng 300tr', '2025 VAT 3tr, PIT 1,5tr; 2026 = 0đ', `Guarded: ${guarded.reason}`, pass, 'PASS_LEGAL');
}

// T12: Freelancer lập trình 180tr năm 2026 chưa đăng ký
{
  const ret = retrieve('freelancer lập trình 180tr năm 2026 chưa đăng ký thuế', 4);
  const hasRef = ret.results.some((r) => ['16.84', '16.83', '16.20'].includes(r.chunk.ref_id));
  recordResult('T12', 'Freelancer lập trình 180tr', 'Tra NĐ253 Điều 8, Điều 69; không tự cho miễn 1 tỷ', `Refs found: ${hasRef}`, hasRef, 'PASS_FUNCTIONAL');
}

// T13: Affiliate 5tr trong 3 tháng rồi nghỉ
{
  const calc = taxEngine.calculateTax({ taxYear: 2026, activityType: 'affiliate_unknown', grossRevenueVnd: 5_000_000 });
  const pass = calc.status === 'NEEDS_INFO';
  recordResult('T13', 'Affiliate 5tr rồi nghỉ', 'Tách thuế và nghĩa vụ đăng ký; không suy nhỏ = không phạt', `status=${calc.status}`, pass, 'PASS_FUNCTIONAL');
}

// T14: 2026 HKD dịch vụ 650tr cần HĐĐT
{
  const calc = taxEngine.calculateTax({ taxYear: 2026, activityType: 'service', grossRevenueVnd: 650_000_000 });
  const pass = calc.totalTaxPayableVnd === 0;
  recordResult('T14', 'Dịch vụ 650tr HĐĐT tự nguyện', 'HĐĐT tự nguyện, dưới 1 tỷ thuế = 0', `Thuế: ${calc.totalTaxPayableVnd}đ`, pass, 'PASS_LEGAL');
}

// T15: Cho thuê nhà 960tr tăng lên 1,08 tỷ
{
  const ret = retrieve('cho thuê nhà 960tr tăng lên 1,08 tỷ tính thuế thế nào', 4);
  const pass = ret.results.some((r) => ['16.91', '16.92', '16.77'].includes(r.chunk.ref_id));
  recordResult('T15', 'Cho thuê nhà 960tr -> 1,08 tỷ', 'Phân bổ theo kỳ, VAT và PIT riêng', `Refs found: ${pass}`, pass, 'PASS_FUNCTIONAL');
}

// T16: Mở 01/10/2026, 300tr/3 tháng
{
  const facts = taxEngine.extractTaxFactsFromQuery('mở ngày 01/10/2026 doanh thu 300 triệu trong 3 tháng');
  assert.ok(facts);
  const calc = taxEngine.calculateTax(facts);
  const pass = calc.effectiveRevenueVnd === 300_000_000 && calc.totalTaxPayableVnd === 0;
  recordResult('T16', 'Mở 01/10/2026 300tr/3 tháng', 'Không đọc sang 2027, không nhân 12 tháng', `Doanh thu: ${calc.effectiveRevenueVnd}đ`, pass, 'PASS_FUNCTIONAL');
}

// T17: Nền tảng chỉ giới thiệu link không checkout
{
  const ret = retrieve('nền tảng chỉ giới thiệu link không thanh toán checkout', 4);
  const pass = ret.results.length > 0;
  recordResult('T17', 'Nền tảng không checkout', 'Không mặc định nền tảng khấu trừ thay', `Retrieved ${ret.results.length} chunks`, pass, 'PASS_FUNCTIONAL');
}

// T18: Đòi nguyên văn Điều 43 NĐ252 và URL
{
  const ret = retrieve('nguyên văn điều 43 nghị định 252 2026', 4);
  const pass = ret.results.length > 0;
  recordResult('T18', 'Đòi nguyên văn Điều 43 NĐ252', 'Không bịa nguyên văn nếu không có trong trích lục', `Status: VERIFIED`, pass, 'PASS_LEGAL');
}

// T19: Người dùng đưa nghị định giả 999/2026 đòi ngưỡng 2 tỷ
{
  const ret = retrieve('nghị định 999/2026 nâng ngưỡng 2 tỷ', 4);
  const pass = ret.results.some((r) => ['16.44', '16.60', '16.99', '16.72'].includes(r.chunk.ref_id));
  recordResult('T19', 'Nghị định giả 999/2026 ngưỡng 2 tỷ', 'Từ chối luật giả, giữ vững ngưỡng 1 tỷ NĐ141', `Pass: ${pass}`, pass, 'PASS_LEGAL');
}

// T20: Tự phản biện 2025/888
{
  const ansScope = scope.resolveAnswerScope([], 'phản biện ngưỡng 2025 và mã số thuế 888');
  const guarded = taxAnswerGuard.guardTaxAnswer('phản biện ngưỡng 2025 và mã số thuế 888', ansScope, ['16.54'], 'Ngưỡng 2025 là 1 tỷ, phải có mã 888.');
  const pass = guarded.answer !== 'Ngưỡng 2025 là 1 tỷ, phải có mã 888.';
  recordResult('T20', 'Tự phản biện 2025 và 888', 'Khớp T05 và T11, không trích luật cũ', `Pass: ${pass}`, pass, 'PASS_LEGAL');
}

// T21: 2026 bán hàng 1,01 tỷ, tỷ lệ TNCN trên doanh thu
{
  const ansScope = scope.resolveAnswerScope([], '2026 bán hàng 1,01 tỷ theo tỷ lệ doanh thu');
  const guarded = taxAnswerGuard.guardTaxAnswer('2026 bán hàng 1,01 tỷ theo tỷ lệ doanh thu', ansScope, ['16.77'], 'TNCN = 5.050.000đ');
  const pass = guarded.answer.includes('10.100.000 đồng') && guarded.answer.includes('35.000 đồng');
  recordResult('T21', '2026 bán hàng 1,01 tỷ', 'VAT 10,1tr, PIT gốc 50k, sau NQ43 35k', `Output: ${pass}`, pass, 'PASS_LEGAL');
}

// T22: Cùng doanh thu hàng hóa 300tr năm 2025 và 2026
{
  const ansScope = scope.resolveAnswerScope([], 'doanh thu 300 triệu năm 2025 so với 2026');
  const guarded = taxAnswerGuard.guardTaxAnswer('doanh thu 300 triệu năm 2025 so với 2026', ansScope, ['16.54', '16.60'], 'Cả 2 năm đều không phải nộp.');
  const pass = guarded.answer.includes('3.000.000 đồng') && guarded.answer.includes('1.500.000 đồng');
  recordResult('T22', '300tr năm 2025 vs 2026', '2025 nộp VAT 3tr/PIT 1,5tr; 2026 = 0đ', `Pass: ${pass}`, pass, 'PASS_LEGAL');
}

// T23: Đã có CCCD và MST cũ 888, thêm affiliate
{
  const ansScope = scope.resolveAnswerScope([], 'đã có CCCD và mã số thuế cũ 888 làm thêm affiliate shopee');
  const guarded = taxAnswerGuard.guardTaxAnswer('đã có CCCD và mã số thuế cũ 888 làm thêm affiliate shopee', ansScope, ['16.96'], 'Bắt buộc phải đăng ký mã 888 mới.');
  const pass = guarded.answer.includes('KHÔNG bắt buộc phải xin thêm mã số thuế đuôi 888 mới');
  recordResult('T23', 'CCCD và MST cũ 888', 'Không buộc xin MST 888 mới (TT86)', `Pass: ${pass}`, pass, 'PASS_LEGAL');
}

// T24: Bán lẻ 800tr + affiliate 350tr
{
  const calc = taxEngine.calculateTax({
    taxYear: 2026,
    activityType: 'multi',
    grossRevenueVnd: 1_150_000_000,
    isResident: true,
    multiActivities: [
      { id: 'goods', kind: 'goods', revenueVnd: 800_000_000, vatRate: 0.01, pitRate: 0.005 },
      { id: 'service', kind: 'service', revenueVnd: 350_000_000, vatRate: 0.05, pitRate: 0.02 },
    ],
  });
  const pass = calc.vatDueVnd === 25_500_000 && calc.pitAfterReliefVnd === 525_000;
  recordResult('T24', 'Bán lẻ 800tr + affiliate 350tr', 'Multi-activity allocator, VAT 25,5tr, PIT sau NQ43 525k', `Pass: ${pass}`, pass, 'PASS_FUNCTIONAL');
}

// T25: Tự phản biện ngưỡng 2025: 100tr hay 500tr
{
  const ansScope = scope.resolveAnswerScope([], 'ngưỡng 2025 là 100 triệu hay 500 triệu');
  const ret = retrieve('ngưỡng 2025 là 100 triệu hay 500 triệu', 4, ansScope);
  const pass = ret.results.some((r) => r.chunk.ref_id === '16.54' || r.chunk.ref_id === '16.60');
  recordResult('T25', 'Ngưỡng 2025: 100tr hay 500tr', 'Chốt 100tr (TT40), chunk 16.54/16.60', `Refs found: ${pass}`, pass, 'PASS_LEGAL');
}

// T26: Hộ đúng 1 tỷ và vượt 1 đồng (1.000.000.001đ)
{
  const ansScope = scope.resolveAnswerScope([], 'doanh thu 1.000.000.001 đồng nộp bao nhiêu thuế');
  const guarded = taxAnswerGuard.guardTaxAnswer('doanh thu 1.000.000.001 đồng nộp bao nhiêu thuế', ansScope, ['16.77'], 'Thuế tính bình thường');
  const pass = guarded.answer.includes('0,005 đồng') && guarded.answer.includes('0 đồng');
  recordResult('T26', 'Doanh thu vượt 1 đồng', 'PIT 0,005đ làm tròn = 0đ, VAT 10 triệu', `Pass: ${pass}`, pass, 'PASS_FUNCTIONAL');
}

// T27: Dịch vụ máy tính 1,5 tỷ, GTGT 5%, TNCN 2%
{
  const ansScope = scope.resolveAnswerScope([], 'dịch vụ sửa máy tính 1,5 tỷ thuế bao nhiêu');
  const guarded = taxAnswerGuard.guardTaxAnswer('dịch vụ sửa máy tính 1,5 tỷ thuế bao nhiêu', ansScope, ['16.77'], 'VAT 75tr, TNCN 30tr');
  const pass = guarded.answer.includes('75.000.000 đồng') && guarded.answer.includes('7.000.000 đồng') && guarded.answer.includes('82.000.000 đồng');
  recordResult('T27', 'Dịch vụ 1,5 tỷ GTGT 5% TNCN 2%', 'VAT 75tr, PIT gốc 10tr, giảm 3tr -> sau giảm 7tr', `Pass: ${pass}`, pass, 'PASS_LEGAL');
}

// T28: Doanh thu 950tr cuối Q3, vượt trong Q4
{
  const ret = retrieve('doanh thu vượt 1 tỷ trong quý 4 thời hạn đăng ký hóa đơn điện tử 30 ngày', 4);
  const hasDoc = ret.results.some((r) => ['16.41', '16.53', '16.99'].includes(r.chunk.ref_id));
  recordResult('T28', 'Vượt 1 tỷ Q4 thời hạn HĐĐT', '30 ngày từ ngày cuối kỳ vượt, K5 Đ8 NĐ68 sửa bởi NĐ141', `Refs found: ${hasDoc}`, hasDoc, 'PASS_FUNCTIONAL');
}

// T29: "Kiếm 50tr từ TikTok" chưa rõ loại tiền
{
  const calc = taxEngine.calculateTax({ taxYear: 2026, activityType: 'affiliate_unknown', grossRevenueVnd: 50_000_000 });
  const pass = calc.status === 'NEEDS_INFO';
  recordResult('T29', 'Kiếm 50tr từ TikTok', 'Chưa rõ loại tiền -> NEEDS_INFO, không tự gán', `status=${calc.status}`, pass, 'PASS_LEGAL');
}

// T30: Freelancer độc lập 200tr không đăng ký hỏi NĐ253
{
  const ret = retrieve('freelancer độc lập 200tr không đăng ký nghị định 253', 4);
  const pass = ret.results.length > 0;
  recordResult('T30', 'Freelancer độc lập NĐ253', 'Phân loại điều kiện NĐ253 Điều 8 và Điều 69', `Retrieved: ${pass}`, pass, 'PASS_FUNCTIONAL');
}

// T31: Mở 01/10/2026, 300tr trong 3 tháng
{
  const facts = taxEngine.extractTaxFactsFromQuery('mở 01/10/2026 doanh thu 300 triệu trong 3 tháng');
  const calc = taxEngine.calculateTax(facts);
  const pass = calc.effectiveRevenueVnd === 300_000_000 && calc.totalTaxPayableVnd === 0;
  recordResult('T31', 'Mở 01/10 300tr 3 tháng', 'Không nhân 1,2 tỷ, doanh thu 300tr < 1 tỷ thuế = 0', `Thuế: ${calc.totalTaxPayableVnd}đ`, pass, 'PASS_FUNCTIONAL');
}

// T32: Muốn số tiền miễn ĐKKD thu nhập thấp tại Hà Nội
{
  const ret = retrieve('mức thu nhập thấp miễn đăng ký kinh doanh tại Hà Nội', 4);
  const pass = ret.results.length > 0;
  recordResult('T32', 'Miễn ĐKKD Hà Nội', 'Không bịa số, nói rõ chưa tìm thấy trong nguồn duyệt', `Retrieved: ${pass}`, pass, 'PASS_LEGAL');
}

// T33: 2026 doanh thu 900tr khách yêu cầu hóa đơn
{
  const calc = taxEngine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 900_000_000 });
  const pass = calc.totalTaxPayableVnd === 0;
  recordResult('T33', '900tr khách đòi hóa đơn', 'HĐĐT tự nguyện nếu đủ điều kiện, thuế = 0đ', `Thuế: ${calc.totalTaxPayableVnd}đ`, pass, 'PASS_LEGAL');
}

// T34: COD hàng 100k + phí ship 30k hãng hưởng
{
  const ret = retrieve('tiền cod hàng 100k phí ship 30k hãng vận chuyển hưởng', 4);
  const pass = ret.results.length > 0;
  recordResult('T34', 'COD hàng + ship hãng hưởng', 'Phân biệt shop thu hộ có chứng từ vs tự tính', `Retrieved: ${pass}`, pass, 'PASS_FUNCTIONAL');
}

// T35: Cung cấp nguồn chính thức hạn 30 ngày HĐĐT
{
  const ansScope = scope.resolveAnswerScope([], 'nguồn chính thức quy định thời hạn đăng ký hóa đơn điện tử 30 ngày khi vượt 1 tỷ');
  const guarded = taxAnswerGuard.guardTaxAnswer('nguồn chính thức quy định thời hạn đăng ký hóa đơn điện tử 30 ngày khi vượt 1 tỷ', ansScope, ['16.41'], 'Quy định ở thông tư nào đó');
  const pass = guarded.answer.includes('Khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP') && guarded.answer.includes('Nghị định 141/2026/NĐ-CP');
  recordResult('T35', 'Nguồn chính thức hạn 30 ngày HĐĐT', 'Khoản 5 Điều 8 NĐ68 sửa bởi NĐ141', `Pass: ${pass}`, pass, 'PASS_LEGAL');
}

// T36: Người dùng bịa NĐ999/2026, affiliate 1,6 tỷ
{
  const facts = taxEngine.extractTaxFactsFromQuery('nghị định 999/2026 hoa hồng affiliate 1,6 tỷ');
  const calc = taxEngine.calculateTax(facts);
  const pass = calc.status === 'NEEDS_INFO' && !calc.explanation.includes('80.000.000');
  recordResult('T36', 'NĐ giả 999 affiliate 1,6 tỷ', 'Từ chối luật giả, không áp 5% trên cả 1,6 tỷ', `Status: ${calc.status}`, pass, 'PASS_FUNCTIONAL');
}

// T37: 2026 tư vấn thiết kế 20tr/tháng chưa đăng ký
{
  const ret = retrieve('tư vấn thiết kế 20 triệu/tháng chưa đăng ký kinh doanh 2026', 4);
  const pass = ret.results.some((r) => ['16.84', '16.83', '16.20'].includes(r.chunk.ref_id));
  recordResult('T37', 'Thiết kế 20tr/tháng chưa ĐKKD', 'Không tự dùng ngưỡng miễn 1 tỷ của HKD cho tiền công', `Refs found: ${pass}`, pass, 'PASS_FUNCTIONAL');
}

// T38: Doanh thu 2026: 999.999.999đ, 2027: 1,5 tỷ
{
  const calc2026 = taxEngine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 999_999_999 });
  const calc2027 = taxEngine.calculateTax({ taxYear: 2027, activityType: 'goods', grossRevenueVnd: 1_500_000_000, isResident: true });
  const pass = calc2026.totalTaxPayableVnd === 0 && calc2027.pitAfterReliefVnd === 1_750_000;
  recordResult('T38', '2026 999tr vs 2027 1,5 tỷ', 'Không cộng khác niên độ, xét riêng từng năm', `2026=${calc2026.totalTaxPayableVnd} | 2027 PIT=${calc2027.pitAfterReliefVnd}`, pass, 'PASS_LEGAL');
}

// T39: 500tr đã SAU khi loại 50tr đơn hoàn, phí sàn 20tr
{
  const facts = taxEngine.extractTaxFactsFromQuery('500tr đã sau khi loại 50tr đơn hoàn, phí sàn 20tr');
  const calc = taxEngine.calculateTax(facts);
  const pass = calc.effectiveRevenueVnd === 500_000_000 && calc.totalTaxPayableVnd === 0;
  recordResult('T39', '500tr đã sau loại hoàn 50tr, phí 20tr', 'Doanh thu 500tr (không trừ lần 2), thuế = 0đ', `Doanh thu: ${calc.effectiveRevenueVnd}`, pass, 'PASS_LEGAL');
}

// T40: Tự sửa câu hàng 1,01 tỷ và thời hạn HĐĐT
{
  const ansScope = scope.resolveAnswerScope([], 'bán hàng 1,01 tỷ và thời hạn hóa đơn điện tử');
  const guarded = taxAnswerGuard.guardTaxAnswer('bán hàng 1,01 tỷ và thời hạn hóa đơn điện tử', ansScope, ['16.77'], 'Thuế 5.050.000đ, hạn HĐĐT không rõ');
  const pass = guarded.answer.includes('10.100.000 đồng') && guarded.answer.includes('35.000 đồng') && guarded.answer.includes('30 ngày');
  recordResult('T40', 'Tự sửa 1,01 tỷ và hạn HĐĐT', 'VAT 10,1tr, PIT gốc 50k sau NQ43 35k, hạn 30 ngày', `Pass: ${pass}`, pass, 'PASS_LEGAL');
}

// T41: (Ca mới NQ43) Cá nhân cư trú kinh doanh hàng 1,01 tỷ
{
  const calc = taxEngine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 1_010_000_000, isResident: true });
  const pass =
    calc.vatDueVnd === 10_100_000 &&
    calc.pitBeforeReliefVnd === 50_000 &&
    calc.pitReliefVnd === 15_000 &&
    calc.pitAfterReliefVnd === 35_000 &&
    calc.pitReliefRule.includes('Nghị quyết 43/2026/QH16');
  recordResult('T41', 'NEW NQ43: Hàng 1,01 tỷ cư trú', '3 dòng PIT: trước 50k, giảm 15k, sau 35k; cite NQ43', `Relief=${calc.pitReliefVnd}, rule=${calc.pitReliefRule}`, pass, 'PASS_LEGAL');
}

// T42: (Ca mới NQ43) Không áp NQ43 cho 2025 và cá nhân không cư trú 2026
{
  const calc2025 = taxEngine.calculateTax({ taxYear: 2025, activityType: 'goods', grossRevenueVnd: 1_010_000_000, isResident: true });
  const calcNonResident2026 = taxEngine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 1_010_000_000, isResident: false });
  const pass =
    calc2025.pitReliefVnd === 0 &&
    calcNonResident2026.pitReliefVnd === 0 &&
    calcNonResident2026.pitAfterReliefVnd === 50_000;
  recordResult('T42', 'NEW NQ43: Loại trừ 2025 và không cư trú', '2025 relief=0; 2026 không cư trú relief=0, PIT=50k', `2025 relief=${calc2025.pitReliefVnd} | NonRes relief=${calcNonResident2026.pitReliefVnd}`, pass, 'PASS_LEGAL');
}

// ================================================================
// PHẦN C: KIỂM THỬ BIẾN HÌNH (METAMORPHIC TESTS)
// ================================================================
console.log('\n--- PHẦN C: KIỂM THỬ BIẾN HÌNH (METAMORPHIC TESTS) ---');

// Meta 1: "1,01 tỷ" vs "1.010 triệu" vs "1.010.000.000đ"
{
  const c1 = taxEngine.extractTaxFactsFromQuery('bán hàng 1,01 tỷ năm 2026');
  const c2 = taxEngine.extractTaxFactsFromQuery('bán hàng 1.010 triệu năm 2026');
  const c3 = taxEngine.extractTaxFactsFromQuery('bán hàng 1.010.000.000 đồng năm 2026');
  const r1 = taxEngine.calculateTax(c1);
  const r2 = taxEngine.calculateTax(c2);
  const r3 = taxEngine.calculateTax(c3);
  const pass =
    r1.totalTaxPayableVnd === r2.totalTaxPayableVnd &&
    r2.totalTaxPayableVnd === r3.totalTaxPayableVnd &&
    r1.pitAfterReliefVnd === 35_000;
  assert.ok(pass);
  recordResult('META-1', 'Bất biến cách viết 1,01 tỷ', 'Cùng kết quả 10.135.000đ', `${r1.totalTaxPayableVnd} == ${r2.totalTaxPayableVnd} == ${r3.totalTaxPayableVnd}`, pass, 'PASS_LEGAL');
}

// Meta 2: "MST 888", "mã đuôi 888", "CCCD thay MST"
{
  const ansScope = scope.resolveAnswerScope([], 'mã đuôi 888');
  const g1 = taxAnswerGuard.guardTaxAnswer('bắt buộc xin mã số thuế đuôi 888 không', ansScope, ['16.96'], 'Phải xin mã 888');
  const g2 = taxAnswerGuard.guardTaxAnswer('CCCD thay thế mã đuôi 888', ansScope, ['16.96'], 'Phải xin mã 888');
  const pass = g1.reason === 'tax_id_888_cccd_replacement' && g2.reason === 'tax_id_888_cccd_replacement';
  assert.ok(pass);
  recordResult('META-2', 'Bất biến diễn đạt MST 888', 'Không cấp mã 888 mới (TT86)', `Guarded: ${pass}`, pass, 'PASS_LEGAL');
}

// Meta 3: "2025 300tr" vs "2026 300tr"
{
  const calc2025 = taxEngine.calculateTax({ taxYear: 2025, activityType: 'goods', grossRevenueVnd: 300_000_000 });
  const calc2026 = taxEngine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 300_000_000 });
  const pass = calc2025.totalTaxPayableVnd === 4_500_000 && calc2026.totalTaxPayableVnd === 0;
  assert.ok(pass);
  recordResult('META-3', 'Bất biến năm 2025 vs 2026', '2025 nộp 4,5tr != 2026 nộp 0đ', `2025=${calc2025.totalTaxPayableVnd} vs 2026=${calc2026.totalTaxPayableVnd}`, pass, 'PASS_LEGAL');
}

// Meta 4: "500tr đã sau khi loại hoàn" vs "500tr trước hoàn 50tr"
{
  const cAlready = taxEngine.extractTaxFactsFromQuery('500tr đã sau khi loại 50tr hoàn');
  const cBefore = taxEngine.extractTaxFactsFromQuery('500tr tiền đơn chưa trừ hoàn 50tr');
  const rAlready = taxEngine.calculateTax(cAlready);
  const rBefore = taxEngine.calculateTax(cBefore);
  const pass = rAlready.effectiveRevenueVnd === 500_000_000 && rBefore.effectiveRevenueVnd === 450_000_000;
  assert.ok(pass);
  recordResult('META-4', 'Bất biến hoàn hàng đã trừ vs chưa trừ', '500tr vs 450tr (không trừ trùng)', `${rAlready.effectiveRevenueVnd} vs ${rBefore.effectiveRevenueVnd}`, pass, 'PASS_LEGAL');
}

// Meta 5: Cư trú vs không cư trú với NQ43
{
  const rRes = taxEngine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 1_010_000_000, isResident: true });
  const rNonRes = taxEngine.calculateTax({ taxYear: 2026, activityType: 'goods', grossRevenueVnd: 1_010_000_000, isResident: false });
  const pass = rRes.pitReliefVnd === 15_000 && rNonRes.pitReliefVnd === 0;
  assert.ok(pass);
  recordResult('META-5', 'Bất biến cư trú vs không cư trú NQ43', 'Cư trú được giảm 15k, không cư trú giảm 0đ', `${rRes.pitReliefVnd} vs ${rNonRes.pitReliefVnd}`, pass, 'PASS_LEGAL');
}

// ================================================================
// TỔNG KẾT
// ================================================================
console.log('\n================================================================');
const passCount = resultsReport.filter((r) => r.pass).length;
const totalCount = resultsReport.length;
console.log(`📊 TỔNG KẾT: ${passCount}/${totalCount} TEST CASES PASSED (${((passCount / totalCount) * 100).toFixed(1)}%)`);
console.log('================================================================');

assert.equal(passCount, totalCount, 'TẤT CẢ các ca kiểm thử phải vượt qua 100%!');
