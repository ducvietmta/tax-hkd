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
 throw new Error(`Unexpected import: ${id}`);
}
      return dependencies[id];
    },
    module,
    module.exports,
  );
  return module.exports;
}

console.log('================================================================');
console.log('🧪 BẮT ĐẦU TEST SUITE CHO DECISION FRAME (L1 DETERMINISTIC)');
console.log('================================================================\n');

// 1. Tải các module
const labels = loadModule('worker/src/decision/labels.ts');
const factExtractor = loadModule('worker/src/decision/factExtractor.ts', {
  './types': {},
  './labels': labels,
});
const understandQueryModule = loadModule('worker/src/decision/understandQuery.ts', {
  '../answerScope': {},
  './types': {},
  './labels': labels,
  './factExtractor': factExtractor,
});
const { understandQuery } = understandQueryModule;

const scope2026 = {
  years: [2026],
  periodSource: 'current_default',
  defaultYear: 2026,
};

const scope2025 = {
  years: [2025],
  periodSource: 'current_message',
  defaultYear: 2026,
};

// 2. Chạy các test cases
let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ [${name}] PASS`);
    passed++;
  } catch (err) {
    console.error(`❌ [${name}] FAILED:`, err.message);
  }
}

// Case 1: Bán hàng 1,01 tỷ năm 2026
runTest('TC01_Retail_1_01B_2026', () => {
  const frame = understandQuery('Tôi bán hàng tạp hóa doanh thu 1,01 tỷ năm 2026 thì nộp thuế bao nhiêu?', scope2026);
  assert.equal(frame.taxpayer_type.value, 'HOUSEHOLD_BUSINESS');
  assert.ok(frame.income_type.some(t => t.value === 'GOODS_SALES'));
  assert.equal(frame.facts.revenue_vnd, 1_010_000_000);
  assert.equal(frame.facts.revenue_basis, 'ANNUAL');
  assert.equal(frame.tax_intent.primary.value, 'TAX_CALCULATION');
  assert.equal(frame.meta.layer, 'L1');
});

// Case 2: Doanh thu 1 đồng (1.000.000.001)
runTest('TC02_Boundary_One_Dong', () => {
  const frame = understandQuery('Nếu doanh thu 1.000.000.001 đồng có bị tính thuế trên toàn bộ không?', scope2026);
  assert.equal(frame.facts.revenue_vnd, 1_000_000_001);
});

// Case 3: Vượt mốc 3 tỷ (phương pháp 17%)
runTest('TC03_Over_3B_Method', () => {
  const frame = understandQuery('Doanh thu 3 tỷ + 1 đồng trên Shopee thì tính thuế TNCN theo cách nào, lợi nhuận 500 triệu?', scope2026);
  assert.equal(frame.facts.revenue_vnd, 3_000_000_001);
  assert.equal(frame.facts.taxable_income_vnd, 500_000_000);
  assert.ok(frame.income_type.some(t => t.value === 'MARKETPLACE_SALES'));
});

// Case 4: Đăng ký MST 888
runTest('TC04_Tax_Id_888', () => {
  const frame = understandQuery('Thủ tục đăng ký mã số thuế 888 cho cá nhân kinh doanh làm thế nào?', scope2026);
  assert.equal(frame.tax_intent.primary.value, 'TAX_ID_888');
});

// Case 5: Hóa đơn điện tử và hạn 30 ngày
runTest('TC05_E_Invoice', () => {
  const frame = understandQuery('Khi nào hộ kinh doanh bắt buộc dùng hóa đơn điện tử khởi tạo từ máy tính tiền và thời hạn 30 ngày?', scope2026);
  assert.equal(frame.tax_intent.primary.value, 'E_INVOICE');
});

// Case 6: Affiliate và thiếu dữ kiện (blocking)
runTest('TC06_Affiliate_Missing_Fact', () => {
  const frame = understandQuery('Làm affiliate TikTok được 50 triệu/tháng tính thuế ra sao?', scope2026);
  assert.ok(frame.income_type.some(t => t.value === 'AFFILIATE_COMMISSION'));
  assert.equal(frame.facts.revenue_basis, 'MONTHLY');
  assert.ok(frame.missing_facts.some(f => f.id === 'affiliate_nature' && f.blocking === true));
});

// Case 7: Nhiều ngành (800tr bán lẻ + 350tr dịch vụ)
runTest('TC07_Multi_Sector', () => {
  const frame = understandQuery('Hộ kinh doanh bán hàng 800 triệu và dịch vụ sửa chữa 350 triệu năm 2026', scope2026);
  assert.equal(frame.facts.activity_type, 'multi');
  assert.equal(frame.facts.revenue_vnd, 1_150_000_000);
  assert.equal(frame.facts.multi_activities?.length, 2);
});

// Case 8: So sánh 2025 vs 2026
runTest('TC08_Compare_2025_vs_2026', () => {
  const frame = understandQuery('So sánh chính sách thuế hộ kinh doanh 2025 và 2026 khác gì nhau?', scope2026);
  assert.equal(frame.tax_intent.primary.value, 'COMPARE_PERIODS');
});

// Case 9: Giảm thuế VAT NQ 204
runTest('TC09_Vat_Relief_Assumption', () => {
  const frame = understandQuery('Bán lẻ hàng hóa thuộc diện được giảm 20% mức tỷ lệ thuế GTGT theo Nghị quyết 204/2025', scope2026);
  assert.equal(frame.facts.vat_relief_assumed, true);
  assert.ok(frame.tax_intent.primary.value === 'RELIEF_REDUCTION' || frame.tax_intent.secondary.includes('RELIEF_REDUCTION'));
});

// Case 10: Quán phở (Food service)
runTest('TC10_Food_Service', () => {
  const frame = understandQuery('Tôi mở quán phở doanh thu 800 triệu/năm thì nộp thuế gì?', scope2026);
  assert.ok(frame.income_type.some(t => t.value === 'FOOD_SERVICE'));
  assert.equal(frame.taxpayer_type.value, 'HOUSEHOLD_BUSINESS');
  assert.equal(frame.facts.revenue_vnd, 800_000_000);
});

runTest('Negated_Retail_Remains_Service', () => {
  const frame = understandQuery('Tôi cung cấp dịch vụ sửa chữa máy vi tính, không bán lẻ tạp hóa, doanh thu 1,5 tỷ năm 2026.', scope2026);
  assert.equal(frame.income_type[0].value, 'SERVICE');
  assert.ok(!frame.income_type.some(item => item.value === 'GOODS_SALES'));
  assert.equal(frame.facts.revenue_vnd, 1_500_000_000);
});

runTest('Ten_Billion_And_One_Dong', () => {
  const frame = understandQuery('Một cá nhân cư trú doanh thu 10 tỷ cộng thêm 1 đồng năm 2026', scope2026);
  assert.equal(frame.facts.revenue_vnd, 10_000_000_001);
  assert.equal(frame.residency.value, 'RESIDENT');
});

runTest('Platform_Tax_Amount_Is_Not_Revenue', () => {
  const frame = understandQuery('TikTok báo hoa hồng 500 triệu, giữ 5 triệu ghi “tax”. Doanh thu tính thuế bao nhiêu và 5 triệu đã là TNCN nộp thay chưa?', scope2026);
  assert.equal(frame.facts.revenue_vnd, 500_000_000);
});
runTest('Written_One_Dong_And_Unknown_Residency', () => {
  const frame = understandQuery('Doanh thu 3 tỷ lẻ một đồng năm 2026, tính TNCN theo phương pháp nào?', scope2026);
  assert.equal(frame.facts.revenue_vnd, 3_000_000_001);
  assert.equal(frame.residency.value, 'UNKNOWN');
  assert.equal(frame.facts.is_resident, null);
});
runTest('Unsupported_Cost_Is_Not_Taxable_Income', () => {
  const frame = understandQuery('Hộ có doanh thu 4 tỷ, báo chi phí 3 tỷ nhưng không có chứng từ. Có thể coi ngay thu nhập tính thuế 1 tỷ?', scope2026);
  assert.equal(frame.facts.taxable_income_vnd, undefined);
});

console.log('\n================================================================');
console.log(`📊 TỔNG KẾT: ${passed}/${total} TEST CASES PASSED (${((passed / total) * 100).toFixed(1)}%)`);
console.log('================================================================');

if (passed !== total) process.exit(1);
