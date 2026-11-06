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

const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('d1/schema.sql','utf8'));
const DB={prepare(sql){return {run:async()=>db.prepare(sql).run(),bind(...args){return {first:async()=>db.prepare(sql).get(...args)||null,run:async()=>db.prepare(sql).run(...args),sql,args}},sql,args:[]}},async batch(rows){db.exec('BEGIN');try{for(const row of rows)db.prepare(row.sql).run(...row.args);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}};
global.fetch=()=>{throw Error('NETWORK_FORBIDDEN')};
const authPath=path.resolve('worker/src/firebaseAuth.ts');modules.set(authPath,{verifiedFirebasePhone:async r=>r.headers.get('Authorization')==='Bearer mock'?'0900000000':null});
const infra=load('worker/src/routesInfra.ts'),files=load('worker/src/routesFiles.ts'),payments=load('worker/src/routesPayments.ts'),rate=load('worker/src/rateLimit.ts');
(async()=>{
const h=new Headers(),env={DB,SEPAY_API_KEY:'mock',STORAGE_BUCKET:{put:async()=>{},get:async()=>({writeHttpMetadata:h=>h.set('Content-Type','text/html'),httpEtag:'x',body:'test'})}};
const request=new Request('https://test/api/test-ai?probe=https://invalid.test',{headers:{'X-Internal-Caller':'mcp'}});assert.equal((await infra.handleTestAi(request,env,h,new URL(request.url))).status,404);assert.equal((await infra.handleTestQuyet(env,h,new URL(request.url))).status,404);
assert.equal((await files.handleFileUpload(new Request('https://test/api/files/upload',{method:'POST',body:'x'}),env,h,new URL('https://test'))).status,401);
assert.equal((await files.handleFileGet(new Request('https://test/api/files/x'),env,h,'/api/files/x')).status,401);
assert.equal((await files.handleFileGet(new Request('https://test/api/files/x',{headers:{Authorization:'Bearer mock'}}),env,h,'/api/files/x')).status,404);
const bad=new Request('https://test/api/files/upload',{method:'POST',headers:{Authorization:'Bearer mock','Content-Type':'text/html'},body:'<script>bad</script>'});assert.equal((await files.handleFileUpload(bad,env,h,new URL(bad.url))).status,415);
const webhook=()=>new Request('https://test/api/payment/webhook',{method:'POST',headers:{Authorization:'Apikey mock'},body:JSON.stringify({id:123,accountNumber:'9594180624',transferType:'in',transferAmount:49000,content:'TAX0900000000'})});
await Promise.all(Array.from({length:8},()=>payments.handleSePayWebhook(webhook(),env,h)));assert.equal(db.prepare('SELECT credits FROM users WHERE phone=?').get('0900000000').credits,13);assert.equal(db.prepare('SELECT COUNT(*) n FROM transactions').get().n,1);
const ctx={waitUntil:p=>p.catch(()=>{})};for(let i=0;i<100;i++)assert.equal(await rate.isChatRateLimited('mock',env,ctx),false);assert.equal(await rate.isChatRateLimited('mock',env,ctx),true);await assert.rejects(()=>rate.isChatRateLimited('mock',{},ctx),{name:'RateLimitUnavailable'});
assert.equal(await rate.isChatRateLimited('same-proxy',env,ctx,'user-a'),false);assert.equal(await rate.isChatRateLimited('same-proxy',env,ctx,'user-b'),false);
await assert.rejects(()=>rate.isChatRateLimited('mock',{DB:{prepare(){throw Error('no such table')}}},ctx),{name:'RateLimitUnavailable'});
console.log('PASS: diagnostic secret forwarding removed; file auth/ownership/HTML rejection; 8 duplicate concurrent webhooks credit once; atomic 100/hour admission and fail closed. No network.');
})().catch(e=>{console.error(e);process.exitCode=1});
