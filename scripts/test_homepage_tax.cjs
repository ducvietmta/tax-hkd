const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync('src/services/homepageTaxEstimate.ts', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const m = { exports: {} };
new Function('exports', 'module', code)(m.exports, m);
const calc = m.exports.estimateHomepageTax;
// Financial regressions: bases must stay independent and exact boundaries matter.
for (const r of [0, 500_000_000, 1_000_000_000]) {
  assert.equal(calc(r, .01, .005, false, false, true).total, 0);
}
const retail = calc(1_500_000_000, .01, .005, false, true, true);
assert.equal(retail.vat, 12_000_000);
assert.equal(retail.pitBefore, 2_500_000);
assert.equal(retail.pit, 1_750_000);
assert.equal(retail.total, 13_750_000);
assert.equal(calc(1_500_000_000, .01, .005, false, false, true).vat, 15_000_000);
assert.equal(calc(3_000_000_000, .01, .005, false, false, true).pit, 7_000_000);
const above = calc(3_000_000_001, .01, .005, false, false, true);
assert.equal(above.pit, null); assert.equal(above.total, null);
const repair = calc(4_000_000_000, .05, .02, false, true, true);
assert.equal(repair.vat, 160_000_000); assert.equal(repair.pit, null);
// Property rental keeps its own method above 3bn, and no VAT reduction.
const rental = calc(4_000_000_000, .05, .05, true, true, true);
assert.equal(rental.vat, 200_000_000); assert.equal(rental.pit, 105_000_000);
assert.equal(calc(10_000_000_000, .05, .05, true, false, true).pit, 315_000_000);
assert.equal(calc(10_000_000_001, .05, .05, true, false, true).pit, 450_000_000.05);
assert.equal(calc(1_500_000_000, .05, .05, false, true, true).pit, 17_500_000);
// All corrected document references must still open the original local file.
const docs = JSON.parse(fs.readFileSync('src/data/legalDocuments.json', 'utf8'));
const corrections = require('./homepage-legal-corrections.json');
for (const [id, expected] of Object.entries(corrections)) {
  const doc = docs.find(d => d.id === id); assert.ok(doc, id);
  for (const [key, value] of Object.entries(expected)) assert.equal(doc[key], value, id);
  assert.ok(fs.existsSync('public' + doc.downloadUrl), doc.downloadUrl);
}
console.log('PASS homepage: tax bases, 1bn/3bn/10bn boundaries, independent reductions, rental and document links (offline).');
