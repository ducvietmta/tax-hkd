const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const m={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('src/services/answerDisplay.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports);
const display=m.exports.answerDisplayText;
assert.equal(display('**Lưu ý**: giữ chứng từ [S12].'),'Lưu ý: giữ chứng từ [S12].');
assert.equal(display('*Ví dụ giả định*: 2 * 3 = 6.'),'Ví dụ giả định: 2 * 3 = 6.');
assert.equal(display('* Giữ chứng từ\n* Đối chiếu [S2]'),'- Giữ chứng từ\n- Đối chiếu [S2]');
for(const text of ['2 * 3 = 6; 10% [S1]','a*b*c','Điều 3*; nguồn [S123].','| Kỳ | Thuế |\n| 2026 | 10% |'])assert.equal(display(text),text);
console.log('PASS answer display: emphasis removed, citations/arithmetic/tables and literal footnote marks preserved.');
