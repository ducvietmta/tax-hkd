const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

console.log('================================================================');
console.log('🔍 LINT RULESETS: KIỂM ĐỊNH TÍNH NHẤT QUÁN CÁC BỘ QUY TẮC THUẾ');
console.log('================================================================\n');

const rulesetsDir = path.join(__dirname, '../worker/src/rules/rulesets');
const files = fs.readdirSync(rulesetsDir).filter(f => f.endsWith('.json'));
const legalDocuments = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/legalDocuments.json'), 'utf8'));
const knownDocuments = new Set(legalDocuments.map(document => document.id));
const loadedRulesets = [];

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
    assert.ok(content.tax_year_range[0] <= content.tax_year_range[1], `${file}: khoảng năm không hợp lệ`);
    assert.ok(!content.effective_to || content.effective_from <= content.effective_to, `${file}: khoảng hiệu lực không hợp lệ`);
    assert.ok(content.citations.exemption && content.citations.vat_rates, `${file}: thiếu căn cứ cho ngưỡng hoặc tỷ lệ GTGT`);
    if (content.relief_policies?.nq43_pit_reduction_rate) {
      assert.ok(content.citations.pit_relief, `${file}: thiếu căn cứ ưu đãi TNCN`);
    }
    if (content.relief_policies?.nq204_vat_reduction_rate) {
      assert.ok(content.citations.vat_relief, `${file}: thiếu căn cứ ưu đãi GTGT`);
    }
    for (const [key, citation] of Object.entries(content.citations)) {
      assert.ok(knownDocuments.has(citation.doc_id), `${file} ${key}: doc_id không có trong legalDocuments.json`);
      assert.ok(citation.article && citation.name, `${file} ${key}: thiếu điều/khoản hoặc tên văn bản`);
    }

    for (const [key, rate] of Object.entries(content.rates)) {
      assert.ok(rate.vat_rate >= 0 && rate.vat_rate <= 1, `${file} rate ${key}: vat_rate không hợp lệ`);
      assert.ok(rate.pit_rate >= 0 && rate.pit_rate <= 1, `${file} rate ${key}: pit_rate không hợp lệ`);
    }

    console.log(`✅ [${file}] HỢP LỆ (ID: ${content.ruleset_id}, Version: ${content.version})`);
    loadedRulesets.push(content);
    passed++;
  } catch (err) {
    console.error(`❌ [${file}] LỖI:`, err.message);
  }
}

for (let i = 0; i < loadedRulesets.length; i++) {
  for (let j = i + 1; j < loadedRulesets.length; j++) {
    const a = loadedRulesets[i], b = loadedRulesets[j];
    const overlap = a.tax_year_range[0] <= b.tax_year_range[1] && b.tax_year_range[0] <= a.tax_year_range[1];
    assert.ok(!overlap || a.supersedes?.includes(b.ruleset_id) || b.supersedes?.includes(a.ruleset_id),
      `${a.ruleset_id} và ${b.ruleset_id} có kỳ chồng lấn nhưng không khai báo supersedes`);
  }
}

console.log('\n================================================================');
console.log(`📊 TỔNG KẾT: ${passed}/${total} RULESETS HỢP LỆ`);
console.log('================================================================');

if (passed !== total) process.exit(1);
