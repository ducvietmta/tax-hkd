const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict'),crypto=require('node:crypto');
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
const {CANONICAL_CHUNKS,matchRoute}=load('worker/src/ragEngine.ts');
const {retrieve,buildContext}=load('worker/src/retriever.ts');
const {resolveAnswerScope}=load('worker/src/answerScope.ts');
const {understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts');
const {trustedSource}=load('worker/src/recognition/trustedEvidence.ts');
const manifest=JSON.parse(fs.readFileSync('rag_data/sources/7404-2026/manifest.json','utf8'));
const meta=JSON.parse(fs.readFileSync('worker/src/kb/chunkMeta.json','utf8'));
for(let n=173;n<=196;n++){
 const ref=`16.${n}`,card=CANONICAL_CHUNKS.find(c=>c.ref_id===ref);assert(card&&trustedSource(card));
 assert(card.text.includes('Chỉ áp dụng phần liên quan HKD và CNKD'));
 const source=manifest.find(d=>d.source_url===meta[ref].source_links[0].source_url);assert(source);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public'+source.source_url)).digest('hex'),source.sha256);
 assert.equal(meta[ref].source_document_sha256,source.sha256);
 const paras=new Map(fs.readFileSync(source.extracted_path,'utf8').trim().split(/\r?\n/).map(l=>{const m=/^P(\d+): (.*)$/.exec(l);return [Number(m[1]),m[2]];}));
 for(const [start,end]of meta[ref].source_paragraph_ranges)for(let p=start;p<=end;p++)if(paras.has(p))assert(card.text.includes(`P${String(p).padStart(3,'0')}: ${paras.get(p)}`));
}
const cases=[
 ['HKD bản scan có thay bản sao điện tử được không năm 2026?',174,'PORTAL_TROUBLESHOOTING'],
 ['CNKD miễn thuế số nhỏ 50.000 đồng trong năm 2026?',177,'TAXPAYER_RIGHTS'],
 ['CNKD hoàn nộp thừa GTGT TNCN năm 2026 có cần hồ sơ riêng?',180,'TAX_PAYMENT_RECONCILIATION'],
 ['Hộ nấu rượu mua tem điện tử rượu năm 2026 có cần xuất trình giấy phép?',183,'OTHER'],
 ['HKD sản xuất bị mất cháy tem phải làm gì năm 2026?',184,'OTHER'],
 ['CNKD dịch vụ làm thủ tục thuế năm 2026 cần 36 tháng công tác không?',185,'OTHER'],
 ['HKD làm dịch vụ thuế cập nhật kiến thức 24 giờ năm 2026 ra sao?',186,'OTHER'],
 ['HKD bán nhiều gian hàng doanh thu đa kênh năm 2026 cộng thế nào?',189,'REVENUE_OWNERSHIP'],
 ['HKD phí vận chuyển thu hộ cấn trừ COD có ghi doanh thu năm 2026?',193,'REVENUE_COMPOSITION'],
 ['Hộ bán hàng nhiều tài khoản ngân hàng phải thông báo năm 2026?',195,'OTHER'],
];
for(const [q,n,topic]of cases){
 const ref=`16.${n}`;assert(matchRoute(q).refs.includes(ref),'Route '+ref);
 const scope=resolveAnswerScope([],q,new Date('2026-10-26'));
 const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER',secondaryIntents:[],incomeTypes:['BUSINESS_GENERAL'],topic,answerPurpose:'PROCEDURE',subjectContext:'INDIVIDUAL_ACTIVITY'};
 const frame=understandClassifiedQuery(q,scope,[],semantic),plan=buildRetrievalPlan(frame);
 const results=retrieve(q,6,scope,plan).results;
 assert(results.some(r=>r.chunk.ref_id===ref),`Top6 omitted ${ref}: `+results.map(r=>r.chunk.ref_id));
 assert(buildContext(results,q,18000,scope).includedRefs.includes(ref),'Packed context '+ref);
}
const imported=CANONICAL_CHUNKS.filter(c=>Number(c.ref_id?.split('.')[1])>=173&&Number(c.ref_id?.split('.')[1])<=196);
for(const c of imported){
 assert(!c.text.includes('P151: Không phụ thuộc việc đã đăng ký'),'Unresolved classification must not become rule');
 assert(!c.text.includes('P493:'),'Conflicting invoice deadline must not become rule');
 assert(!c.text.includes('P518:'),'Unbounded 17% must not become rule');
 assert(!c.text.includes('PHẦN IV. DOANH NGHIỆP KHI KHAI, QUYẾT TOÁN THUẾ TNDN'));
}
console.log('PASS: 24 scoped source cards, five source hashes, exact paragraph fidelity, 10 retrieval/context cases and excluded ambiguities.');
