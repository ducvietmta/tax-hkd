const assert = require('node:assert/strict');
const load = require('./lib/load_local_ts.cjs')();
const { searchLegalMarkdown } = load('worker/src/kb/legalMarkdownSearch.ts');

const nd68 = searchLegalMarkdown('Nghị định 68/2026 chính sách thuế hộ kinh doanh', 8);
assert(nd68.some((hit) => hit.doc_id === 'ND-68-2026-ND-CP'), 'Named document must be discoverable from Markdown');
const registration = searchLegalMarkdown('đăng ký thuế mã số thuế', 8);
assert(registration.length > 0, 'Substantive Markdown query should return source documents');
assert(registration.every((hit) => hit.doc_id && hit.section_id && hit.score > 0));
console.log(`legal Markdown search OK — named=${nd68[0].doc_id}; semantic hits=${registration.length}`);
