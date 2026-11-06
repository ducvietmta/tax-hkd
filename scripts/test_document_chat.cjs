/* Offline behavior checks: citation integrity and evidence routing invariance. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const modules=new Map();
function load(file){
 file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';
 if(modules.has(file))return modules.get(file);
 if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}
 const m={exports:{}};modules.set(file,m.exports);
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);
 modules.set(file,m.exports);return m.exports;
}

const fixture={id:'doc-test',title:'Tài liệu kiểm thử',code:'TEST',version:'v1',sections:[{id:'S1',title:'Nguyên tắc',text:`# Nguyên tắc
Nội dung và điều kiện.`},{id:'S2',title:'Ngoại lệ',text:`## Ngoại lệ
Ngoại lệ cần giữ.`}]};
modules.set(path.resolve('worker/src/data/documentLibrary.json'),{default:[fixture]});
let authenticated=true,credits=3,calls=0,mode='ok';
modules.set(path.resolve('worker/src/firebaseAuth.ts'),{verifiedFirebasePhone:async()=>authenticated?'0900000000':null});
modules.set(path.resolve('worker/src/rateLimit.ts'),{isChatRateLimited:async()=>false});
const {handleDocumentChat}=load('worker/src/documentChat.ts');const {documentContext}=load('worker/src/documentLibrary.ts');
const DB={prepare(sql){return{bind(){return{first:async()=>{if(sql.includes('credits - 1'))return credits>0?{credits:--credits}:null;if(sql.includes('credits + 1'))return{credits:++credits};return null;},run:async()=>({})}}}}};
const env={DB,MUSE_API_KEY:'MOCK_ONLY'};const tasks=[];const ctx={waitUntil:p=>tasks.push(p)};
global.fetch=async(_url,opts)=>{calls++;const b=JSON.parse(opts.body);assert.equal(b.store,false);assert(b.instructions.includes('trợ lý đọc hiểu'));assert(b.input.at(-1).content[0].text.includes('Ngoại lệ'));if(mode==='failure')return new Response('error',{status:503});return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:mode==='invalid'?'Nguồn sai [S999]':'Giải thích rõ điều kiện và ngoại lệ [S1] [S2].'}]}]});};
const req=(body)=>new Request('https://local/api/document-chat',{method:'POST',body:JSON.stringify(body)});
const body={documentId:'doc-test',documentVersion:'v1',message:'Giải thích giúp tôi',history:[]};
(async()=>{
let r=await handleDocumentChat(new Request('https://local/api/document-chat?documentId=missing'),env,ctx,new Headers());assert.equal((await r.json()).ready,false);
authenticated=false;r=await handleDocumentChat(req(body),env,ctx,new Headers());assert.equal(r.status,401);authenticated=true;
for(const extra of [{documentId:'missing'},{documentVersion:'v0'}]){r=await handleDocumentChat(req({...body,...extra}),env,ctx,new Headers());assert.equal(r.status,409);}assert.equal(calls,0);assert.equal(credits,3);
r=await handleDocumentChat(req(body),env,ctx,new Headers());let text=await r.text();await Promise.all(tasks);assert(text.includes('"type":"done"'));assert.equal(credits,2);assert.equal(calls,1);
for(mode of ['failure','invalid']){r=await handleDocumentChat(req(body),env,ctx,new Headers());text=await r.text();await Promise.all(tasks);assert(text.includes('"type":"error"'));assert(!text.includes('"type":"done"'));assert.equal(credits,2);}
assert.equal(documentContext({...fixture,sections:[{id:'S1',title:'long',text:'a'.repeat(81000)}]},'summary'),null);
const fs2=require('node:fs'),os=require('node:os'),cp=require('node:child_process');const temp=fs2.mkdtempSync(path.join(os.tmpdir(),'document-reader-test-'));try{for(const dir of ['document_library','src/data','worker/src/data'])fs2.mkdirSync(path.join(temp,dir),{recursive:true});fs2.writeFileSync(path.join(temp,'src/data/legalDocuments.json'),JSON.stringify([{id:'d',title:'Doc',code:'D'}]));fs2.writeFileSync(path.join(temp,'document_library/d.md'),`# Heading

Body.

## Exception

Keep exception.`);cp.execFileSync(process.execPath,[path.resolve('scripts/build_document_library.cjs')],{cwd:temp});const built=JSON.parse(fs2.readFileSync(path.join(temp,'worker/src/data/documentLibrary.json'),'utf8'));assert.equal(built[0].sections.length,2);assert(built[0].sections[1].text.includes('Keep exception'));}finally{fs2.rmSync(temp,{recursive:true,force:true});}
console.log('PASS document reader: Markdown build, document/version scope, auth, missing MD no calls/charge, independent prompt, stream completion, model/source failures refunded, long document no silent truncation. Mock API only.');
})().catch(e=>{console.error(e);process.exitCode=1});
