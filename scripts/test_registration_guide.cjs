const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const source=fs.readFileSync('src/features/registration/data/smartGuide.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};new Function('module','exports',compiled)(mod,mod.exports);
const {buildRegistrationGuide:build,readGuideSaved:read}=mod.exports;
const solo={goal:'new',founder:'self',submission:'online'};
assert.equal(build(solo).length,5);
assert(!build(solo).flatMap(s=>s.tasks).some(t=>t.id==='family-authority'));
assert(build({...solo,founder:'family'}).flatMap(s=>s.tasks).some(t=>t.id==='family-authority'));
assert.match(build({...solo,submission:'counter'}).find(s=>s.id==='submit').description,/cấp xã/);
assert.match(build(solo).find(s=>s.id==='submit').description,/Cổng Dịch vụ công/);
assert.equal(build({...solo,goal:'unsure'}).length,0,'Do not prescribe a legal path for someone unsure about eligibility');
assert(!build({...solo,goal:'existing'}).some(s=>s.id==='submit'),'Existing households must not be sent to create another household');
assert.equal(read('bad JSON'),null);
assert.equal(read(JSON.stringify({version:2,profile:{...solo,goal:'fake'}})),null);
const restore=read(JSON.stringify({version:2,profile:solo,activeStep:'unknown',checked:['identity','identity','family-authority','unknown',123]}));
assert.deepEqual(restore.checked,['identity']);assert.equal(restore.activeStep,'info');
assert.equal(read(JSON.stringify({version:2,profile:solo,activeStep:'prepare',checked:['identity']})).activeStep,'prepare');
const legalIds=new Set(JSON.parse(fs.readFileSync('src/data/legalDocuments.json','utf8')).map(d=>d.id));
for(const goal of ['new','existing'])for(const founder of ['self','family'])for(const submission of ['online','counter','undecided']){
 const steps=build({goal,founder,submission});assert.equal(new Set(steps.map(s=>s.id)).size,steps.length);
 for(const step of steps)assert(legalIds.has(step.source),step.source);
}
console.log('PASS: 12 personalized routes, family-only documents, existing/uncertain branches, safe resume and legal document references. Model API calls: 0.');
// Render the actual page for first visit and restored journeys. This checks
// content/branches, not browser layout or real pointer interactions.
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const page=fs.readFileSync('src/features/registration/RegistrationPage.tsx','utf8');
const pageCode=ts.transpileModule(page,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const pageMod={exports:{}};
const icons=new Proxy({}, {get:()=>()=>React.createElement('svg',{'aria-hidden':true})});
new Function('require','module','exports',pageCode)(id=>id.includes('smartGuide')?mod.exports:id.includes('PdfViewerModal')?{PdfViewerModal:()=>null}:id==='lucide-react'?icons:require(id),pageMod,pageMod.exports);
const originalStorage=global.localStorage;
try{
 global.localStorage={getItem:()=>null};
 const render=()=>renderToStaticMarkup(React.createElement(pageMod.exports.default,{onOpenAIChat(){}}));
 assert.match(render(),/Bạn đang cần làm gì/);assert.doesNotMatch(render(),/Chatbot Tư vấn Đăng ký/);
 global.localStorage={getItem:()=>JSON.stringify({version:2,profile:{...solo,founder:'family'},activeStep:'prepare',checked:['application']})};
 const family=render();assert.match(family,/Văn bản ủy quyền một thành viên/);assert.match(family,/checked=""/);
 global.localStorage={getItem:()=>JSON.stringify({version:2,profile:solo,activeStep:'prepare',checked:[]})};
 assert.doesNotMatch(render(),/Văn bản ủy quyền một thành viên/);
 global.localStorage={getItem:()=>JSON.stringify({version:2,profile:{...solo,goal:'existing'},activeStep:'existing-info',checked:[]})};
 assert.match(render(),/Kiểm tra thông tin hộ đã đăng ký/);assert.doesNotMatch(render(),/Chốt thông tin sẽ đăng ký/);
 global.localStorage={getItem:()=>JSON.stringify({version:2,profile:{...solo,goal:'unsure'},activeStep:'',checked:[]})};
 assert.match(render(),/Làm rõ trước khi chuẩn bị hồ sơ/);assert.doesNotMatch(render(),/Việc cần chuẩn bị/);
 global.localStorage={getItem(){throw Error('blocked')}};
 assert.match(render(),/Bạn đang cần làm gì/);
 console.log('PASS: actual React page rendering for fresh/family/solo/existing/uncertain journeys and unavailable storage. Browser layout not exercised.');
}finally{global.localStorage=originalStorage;}
