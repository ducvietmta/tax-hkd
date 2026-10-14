const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

console.log('================================================================');
console.log('🔍 LINT RULESETS: KIỂM ĐỊNH TÍNH NHẤT QUÁN CÁC BỘ QUY TẮC THUẾ');
console.log('================================================================\n');

const rulesetsDir = path.join(__dirname, '../worker/src/rules/rulesets');
const files = fs.readdirSync(rulesetsDir).filter(f => f.endsWith('.json'));

let total = 0;
let passed = 0;

for (const file of files) {
  total++;
  const filePath = path.join(rulesetsDir, file);
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    assert.ok(content.ruleset_id, `${file}: thiếu ruleset_id`);
    assert.ok(content.version, `${file}: thiếu version`);
    assert.ok(content.effective_from, `${file}: thiếu effective_from`);
    assert.ok(Array.isArray(content.tax_year_range), `${file}: tax_year_range phải là mảng [min, max]`);
    assert.ok(content.thresholds.exemption_annual_vnd > 0, `${file}: exemption_annual_vnd phải > 0`);
    assert.ok(content.rates, `${file}: thiếu rates`);
    assert.ok(content.citations, `${file}: thiếu citations`);

    for (const [key, rate] of Object.entries(content.rates)) {
      assert.ok(rate.vat_rate >= 0 && rate.vat_rate <= 1, `${file} rate ${key}: vat_rate không hợp lệ`);
      assert.ok(rate.pit_rate >= 0 && rate.pit_rate <= 1, `${file} rate ${key}: pit_rate không hợp lệ`);
    }

    console.log(`✅ [${file}] HỢP LỆ (ID: ${content.ruleset_id}, Version: ${content.version})`);
    passed++;
  } catch (err) {
    console.error(`❌ [${file}] LỖI:`, err.message);
  }
}

console.log('\n================================================================');
console.log(`📊 TỔNG KẾT: ${passed}/${total} RULESETS HỢP LỆ`);
console.log('================================================================');

if (passed !== total) process.exit(1);
