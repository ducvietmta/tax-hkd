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

global.fetch=()=>{throw Error('NETWORK_FORBIDDEN')};
const {CANONICAL_CHUNKS}=load('worker/src/ragEngine.ts'),{retrieve,buildContext}=load('worker/src/retriever.ts'),{resolveAnswerScope}=load('worker/src/answerScope.ts'),{understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts'),{buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts'),{supportDirectory}=load('worker/src/supportDirectory.ts');
const cases=[
['Hồ sơ đăng ký bị từ chối giấy tờ đính kèm không hợp lệ nhưng không có ô tải tệp.','16.157'],
['Đăng nhập VNeID quét QR rồi quay về cổng thuế báo hết phiên.','16.158'],
['Không nhận OTP xác nhận ngân hàng khi nộp tiền thuế.','16.159'],
['Tệp XML báo lỗi schema và sai mẫu khi nộp tờ khai từ HTKK.','16.162'],
['eSigner USB Token mới gia hạn chứng thư số vẫn lỗi khi ký.','16.163'],
['Nộp thuế eTax Mobile ngân hàng đã trừ tiền muốn tra soát chứng từ.','16.164'],
['Theo dõi hồ sơ hoàn thuế bị yêu cầu bổ sung, đã OTP có phải hoàn xong chưa?','16.165'],
['Liên hệ Thuế cơ sở theo email bị từ chối hồ sơ, không biết hỏi nội dung gì.','16.169']];
for(const [q,ref]of cases){const scope=resolveAnswerScope([],q,new Date('2026-10-23'));const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'PORTAL_TROUBLESHOOTING',secondaryIntents:[],incomeTypes:['UNKNOWN'],topic:'PORTAL_TROUBLESHOOTING',answerPurpose:'TROUBLESHOOTING'};const frame=understandClassifiedQuery(q,scope,[],semantic),plan=buildRetrievalPlan(frame);assert(plan.allowed_refs.includes(ref));assert(!plan.must_include_refs.includes(ref),'Guidance must rank by relevance, not all be forced');const results=retrieve(q,6,scope,plan).results;assert(results.some(r=>r.chunk.ref_id===ref),q+' missing '+ref+' '+results.map(r=>r.chunk.ref_id));const context=buildContext(results,q,9000,scope);assert(context.includedRefs.includes(ref),'Context omitted '+ref);}
for(let n=157;n<=172;n++){const c=CANONICAL_CHUNKS.find(c=>c.ref_id==='16.'+n);assert(c);assert(c.text.includes('chưa kiểm tra giao diện live'));assert(c.evidence_mode==='COMPLETE_RULE');}
assert.equal(supportDirectory(['Thuế cơ sở 25']).status,'NEEDS_LOCALITY');const directory=supportDirectory(['Thuế cơ sở 25 Hà Nội']);assert.notEqual(directory.status,'NEEDS_LOCALITY');assert(directory.offices.every(o=>o.unit.toLowerCase().includes('hà nội')));
console.log('PASS: 16 bounded operational guides; 8 question -> semantic candidate family -> top6 retrieval -> context; no forced per-question answer; directory locality isolation. No API calls.');
