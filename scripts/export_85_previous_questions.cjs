/* Export existing questions verbatim; never execute the live MCP test runner. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const runner='scripts/test_40_mcp_regression.cjs';
const source=ts.createSourceFile(runner,fs.readFileSync(runner,'utf8'),ts.ScriptTarget.Latest,true);
let array;function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(source)==='TEST_CASES')array=node.initializer;ts.forEachChild(node,visit);}visit(source);
assert(array&&ts.isArrayLiteralExpression(array));
function stringProperty(object,key){const property=object.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(source)===key);assert(property&&ts.isStringLiteralLike(property.initializer));return property.initializer.text;}
const first=array.elements.map(e=>({id:stringProperty(e,'id'),question:stringProperty(e,'question')})).filter(c=>/^T\d{2}$/.test(c.id));
assert.equal(first.length,40);assert.deepEqual(first.map(c=>c.id),Array.from({length:40},(_,i)=>'T'+String(i+1).padStart(2,'0')));
const files=['tests/fixtures/rag-expansion-2026-10-19.json','tests/fixtures/rag-depth-2026-10-19.json'];
const second=files.flatMap(file=>JSON.parse(fs.readFileSync(file,'utf8')).map(c=>({id:c.ref,question:c.question,topic:c.topic,sourceFile:file})));
assert.equal(second.length,45);
const cases=[...first.map(c=>({...c,set:'T01–T40',sourceFile:runner})),...second.map(c=>({...c,set:'RAG-45'}))].map((c,i)=>({number:i+1,...c}));
assert.equal(cases.length,85);assert.equal(new Set(cases.map(c=>c.id)).size,85);
const dir='outputs/exports/bo-85-cau-hoi-cu-20261022';fs.mkdirSync(dir,{recursive:true});
const text=['BỘ 85 CÂU HỎI KIỂM THỬ ĐÃ CÓ','Xuất ngày 22/10/2026. Giữ nguyên nội dung câu hỏi.','', 'PHẦN 1 — T01–T40 (40 câu)','',...cases.slice(0,40).map(c=>`${c.number}. [${c.id}] ${c.question}\n`),'PHẦN 2 — BỘ RAG 45 CÂU (hóa đơn, thủ tục, quyền người nộp thuế và chi phí)','',...cases.slice(40).map(c=>`${c.number}. [${c.id}] ${c.question}\n`)].join('\r\n');
fs.writeFileSync(dir+'/85_cau_hoi.txt','\ufeff'+text,'utf8');
const result={title:'85 câu hỏi kiểm thử đã có',exportedOn:'2026-10-22',counts:{total:85,T01_T40:40,RAG_45:45},questionsVerbatim:true,includesAnswers:false,sources:[runner,...files],cases};
fs.writeFileSync(dir+'/85_cau_hoi.json',JSON.stringify(result,null,2)+'\n','utf8');
const saved=JSON.parse(fs.readFileSync(dir+'/85_cau_hoi.json','utf8'));assert.deepEqual(saved.cases.map(c=>c.question),cases.map(c=>c.question));
assert.equal((fs.readFileSync(dir+'/85_cau_hoi.txt','utf8').match(/^\d+\. \[/gm)||[]).length,85);
console.log(JSON.stringify({total:cases.length,sets:result.counts,distinctQuestionTexts:new Set(cases.map(c=>c.question)).size,files:['85_cau_hoi.txt','85_cau_hoi.json'].map(f=>path.resolve(dir,f)),apiCalls:0},null,2));
