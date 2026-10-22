/** Offline provenance export; mentions/configuration never imply legal approval. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),ts=require('typescript');
const out=path.resolve('outputs/legal-assurance'),root=process.cwd();
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const source=fs.readFileSync('worker/src/ragEngine.ts','utf8'),moduleRef={exports:{}};
new Function('module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(moduleRef,moduleRef.exports);
const chunks=moduleRef.exports.CANONICAL_CHUNKS,meta=JSON.parse(fs.readFileSync('worker/src/kb/chunkMeta.json','utf8'));
const catalogue=JSON.parse(fs.readFileSync('src/data/legalDocuments.json','utf8'));
const external=JSON.parse(fs.readFileSync('worker/src/kb/sourceDocuments.json','utf8')).documents;
const docs=[...catalogue,...external];
const legalRelations=JSON.parse(fs.readFileSync('worker/src/kb/legalRelations.json','utf8')).relations;
const sets=fs.readdirSync('worker/src/rules/rulesets').filter(file=>file.endsWith('.json')).sort().map(file=>JSON.parse(fs.readFileSync(`worker/src/rules/rulesets/${file}`,'utf8')));
const id=(kind,key)=>`urn:taxhkd:${kind}:${encodeURIComponent(key)}`;
const fold=value=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,'');
const nodes=[],edges=[],warnings=[],impact={};
const addEdge=(from,relation,to)=>edges.push({from,relation,to});
const documentNodes=new Map();
for(const doc of docs){
 const sourceUrl=doc.downloadUrl||doc.source_url;
 const isExternal=doc.access==='EXTERNAL_PRIMARY_SOURCE';
 const local=typeof sourceUrl==='string'&&sourceUrl.startsWith('/documents/')?path.resolve('public',`.${sourceUrl}`):null;
 const contained=local&&local.startsWith(path.join(root,'public','documents')+path.sep);
 const exists=contained&&fs.existsSync(local);
 const node={'@id':id('document',doc.id),'@type':'tax:Document','tax:documentId':doc.id,'tax:label':doc.code,
  'tax:documentType':doc.category,'tax:catalogueDate':doc.date,'tax:dateMeaning':'CATALOGUE_ONLY_NOT_VERIFIED_EFFECTIVE_DATE',
  'tax:sourceURL':sourceUrl,'tax:sourceType':doc.source_type||'LOCAL_CATALOGUED_DOCUMENT',
  'tax:localFile':isExternal?null:sourceUrl,'tax:filePresent':isExternal?null:!!exists,...(exists?{'tax:fileSha256':hash(fs.readFileSync(local))}:{})};
 nodes.push(node);documentNodes.set(doc.id,node);impact[doc.id]={chunk_refs:[],rulesets:[],citation_slots:[]};
 if(!exists&&!isExternal)warnings.push({code:'MISSING_SOURCE_FILE',document_id:doc.id});
}
for(const chunk of [...chunks].sort((a,b)=>(a.ref_id||a.id).localeCompare(b.ref_id||b.id))){
 const ref=chunk.ref_id||chunk.id,m=meta[ref],nodeId=id('chunk',ref);
 nodes.push({'@id':nodeId,'@type':'tax:KnowledgeChunk','tax:refId':ref,'tax:sourceFile':chunk.file,'tax:label':chunk.section,
  'tax:contentSha256':hash(chunk.text),'tax:reviewStatus':m?.legal_status||'UNKNOWN',
  'tax:appliesFromYear':m?.applies_from_year??null,'tax:appliesToYear':m?.applies_to_year??null});
 if(!m||m.id!==chunk.id)warnings.push({code:'CHUNK_METADATA_IDENTITY',ref});
 let mentions=0;
 for(const doc of docs){
  // Match a published document identifier, never a user question or case ID.
  const token=doc.code.match(/\d+\/(?:19|20)\d{2}\/[^\s,;]+/)?.[0]||doc.code.match(/\d+\/[\p{L}][\p{L}\d-]+/u)?.[0];
  if(token&&fold(chunk.text).includes(fold(token))){addEdge(nodeId,'tax:mentionsDocument',id('document',doc.id));impact[doc.id].chunk_refs.push(ref);mentions++;}
 }
 let linked=0;
 if(m?.source_links?.length){
  if(m.source_link_review?.content_sha256!==hash(chunk.text))throw Error(`Stale source review: ${ref}`);
  for(const [index,link]of m.source_links.entries()){
   if(!documentNodes.has(link.doc_id)||!link.locator||!link.scope||!link.source_url)throw Error(`Invalid source link ${ref}/${index}`);
   const lid=id('source-link',`${ref}/${link.doc_id}/${index}`);
   nodes.push({'@id':lid,'@type':'tax:ScopedSourceLink','tax:locator':link.locator,'tax:supportScope':link.scope,
    'tax:sourceType':link.source_type,'prov:hadPrimarySource':{'@id':link.source_url},
    'tax:sourceCheckedOn':m.source_link_review.checked_on,'tax:reviewedContentSha256':m.source_link_review.content_sha256,
    'tax:reviewStatus':m.source_link_review.status,'tax:coverage':m.source_link_review.coverage,
    'tax:limits':m.source_link_review.limits,'tax:appliesFromYear':link.applies_from_year??null,'tax:appliesToYear':link.applies_to_year??null});
   addEdge(nodeId,'tax:hasScopedSourceLink',lid);addEdge(lid,'tax:refersToDocument',id('document',link.doc_id));
   impact[link.doc_id].chunk_refs.push(ref);linked++;
  }
 }
 if(!mentions&&!linked)warnings.push({code:'NO_CATALOGUED_DOCUMENT_MENTION',ref});
 for(const related of new Set(chunk.text.match(/\b16\.\d+\b/g)||[])){
  if(related!==ref&&chunks.some(other=>other.ref_id===related))addEdge(nodeId,'tax:mentionsChunk',id('chunk',related));
 }
}
for(const ruleset of sets){
 const sid=id('ruleset',ruleset.ruleset_id);
 nodes.push({'@id':sid,'@type':'tax:Ruleset','tax:version':ruleset.version,'tax:label':ruleset.name,
  'tax:contentSha256':hash(JSON.stringify(ruleset)),'tax:taxYearRange':ruleset.tax_year_range,
  'tax:configuredFrom':ruleset.effective_from,'tax:configuredTo':ruleset.effective_to});
 for(const previous of ruleset.supersedes||[])addEdge(sid,'tax:declaredSupersedesRuleset',id('ruleset',previous));
 for(const [slot,citation]of Object.entries(ruleset.citations)){
  const cid=id('citation',`${ruleset.ruleset_id}/${slot}`);
  nodes.push({'@id':cid,'@type':'tax:ConfiguredCitation','tax:slot':slot,'tax:article':citation.article||'',
   'tax:clause':citation.clause||'','tax:point':citation.point||'','tax:reviewStatus':'CONFIGURED_NOT_INDEPENDENTLY_VERIFIED'});
  addEdge(sid,'tax:declaresCitation',cid);
  if(documentNodes.has(citation.doc_id)){
   addEdge(cid,'tax:refersToDocument',id('document',citation.doc_id));
   impact[citation.doc_id].rulesets.push(ruleset.ruleset_id);impact[citation.doc_id].citation_slots.push(`${ruleset.ruleset_id}.${slot}`);
  }else warnings.push({code:'UNKNOWN_RULESET_DOCUMENT',ruleset:ruleset.ruleset_id,slot,document_id:citation.doc_id});
 }
 const walk=(value,prefix)=>{
  for(const [key,child]of Object.entries(value||{})){
   const parameterPath=prefix?`${prefix}.${key}`:key;
   if(child&&typeof child==='object'){walk(child,parameterPath);continue;}
   if(typeof child!=='number')continue;
   const pid=id('parameter',`${ruleset.ruleset_id}/${parameterPath}`);
   nodes.push({'@id':pid,'@type':'tax:ConfiguredParameter','tax:path':parameterPath,'tax:value':child,'tax:unit':parameterPath.endsWith('_vnd')?'VND':parameterPath.endsWith('_year')?'YEAR':'RATIO','tax:reviewStatus':'CONFIGURED_NOT_INDEPENDENTLY_VERIFIED'});
   addEdge(sid,'tax:hasParameter',pid);
   let slot;
   if(parameterPath==='thresholds.exemption_annual_vnd')slot='exemption';
   else if(parameterPath==='thresholds.relief_max_revenue_vnd'||parameterPath.includes('nq43_'))slot='pit_relief';
   else if(parameterPath.includes('nq204_'))slot='vat_relief';
   else if(parameterPath.endsWith('.vat_rate'))slot='vat_rates';
   else if(parameterPath.startsWith('pit_income_rates.')||parameterPath.startsWith('thresholds.income_method_')||parameterPath.endsWith('.pit_rate'))slot=ruleset.citations.pit_law?'pit_law':'amendment';
   if(slot&&ruleset.citations[slot])addEdge(pid,'tax:configuredCitation',id('citation',`${ruleset.ruleset_id}/${slot}`));
  }
 };
 for(const area of ['thresholds','rates','pit_income_rates','relief_policies'])walk(ruleset[area],area);
}
for(const entry of Object.values(impact)){entry.rulesets=[...new Set(entry.rulesets)].sort();entry.chunk_refs=[...new Set(entry.chunk_refs)].sort();entry.citation_slots.sort();}
const provisionIds=new Set();
const provision=ref=>{
 if(!documentNodes.has(ref.doc_id))throw Error(`Unknown relation document ${ref.doc_id}`);
 const pid=id('provision',`${ref.doc_id}/${ref.article}/${ref.clause||''}`);
 if(!provisionIds.has(pid)){
  provisionIds.add(pid);nodes.push({'@id':pid,'@type':'tax:Provision','tax:article':ref.article,'tax:clause':ref.clause||''});
  addEdge(pid,'tax:partOf',id('document',ref.doc_id));
 }
 return pid;
};
for(const relation of legalRelations){
 if(relation.relation!=='AMENDS_PROVISION'||!relation.source_url.startsWith('https://'))throw Error('Unsupported/unsourced legal relation');
 const from=provision(relation.source),to=provision(relation.target);
 addEdge(from,'tax:amendsProvision',to);
 nodes.push({'@id':id('relation',relation.id),'@type':'tax:SourcedLegalRelation',
  'tax:sourceProvision':{'@id':from},'tax:targetProvision':{'@id':to},'tax:relation':relation.relation,
  'prov:hadPrimarySource':{'@id':relation.source_url},'tax:sourceCheckedOn':relation.source_checked_on,
  'tax:reviewStatus':relation.review_status,'tax:summary':relation.summary});
}
const identities=new Set(nodes.map(node=>node['@id']));
for(const edge of edges)if(!identities.has(edge.from)||!identities.has(edge.to))throw Error(`Dangling edge ${JSON.stringify(edge)}`);
if(identities.size!==nodes.length)throw Error('Duplicate graph node identity');
for(const edge of edges){const node=nodes.find(n=>n['@id']===edge.from);(node[edge.relation]??=[]).push({'@id':edge.to});}
const graph={'@context':{tax:'https://tax-hkd.pages.dev/ns#',prov:'http://www.w3.org/ns/prov#'},'@graph':nodes};
const manifest={schema:'taxhkd-provenance-v1',graph_sha256:hash(JSON.stringify(graph)),chunks:chunks.length,documents:docs.length,catalogued_documents:catalogue.length,additional_source_documents:external.length,scoped_source_chunks:chunks.filter(c=>meta[c.ref_id]?.source_links?.length).length,scoped_source_links:nodes.filter(n=>n['@type']==='tax:ScopedSourceLink').length,rulesets:sets.length,nodes:nodes.length,edges:edges.length,provision_relations:legalRelations.length,
 limitations:['Document mentions are not proof of legal support.','Catalogue dates are not verified legal effective dates.','Local SHA-256 values detect content changes; they do not verify authenticity or digital signatures.','Citation clauses require independent legal review.','No automatic document amendment/repeal relation is inferred.'],warnings};
fs.mkdirSync(out,{recursive:true});
for(const [name,value]of Object.entries({'graph.jsonld':graph,'manifest.json':manifest,'impact.json':impact}))fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2));
console.log(JSON.stringify({chunks:manifest.chunks,documents:manifest.documents,rulesets:manifest.rulesets,nodes:manifest.nodes,edges:manifest.edges,warnings:warnings.length,graph_sha256:manifest.graph_sha256}));
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const tests=fs.existsSync(path.join(out,'tests.json'))?JSON.parse(fs.readFileSync(path.join(out,'tests.json'),'utf8')):null;
const html=`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TaxHKD · Kiểm chứng và nguồn</title><style>body{font:15px/1.65 system-ui;color:#16263b;background:#f2f6fa;margin:0}main{max-width:1050px;margin:40px auto;padding:24px}h1{font-size:30px;line-height:1.2}h2{font-size:20px;margin-top:32px}a{color:#047857}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.card,section{background:white;border:1px solid #dde6ee;border-radius:16px;padding:20px;margin:12px 0}.card strong{display:block;font-size:28px;color:#047857}table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left;vertical-align:top}.scroll{overflow:auto}.note{background:#fff9e9;border:1px solid #f5d78b;padding:16px;border-radius:12px}code{overflow-wrap:anywhere}li{margin:8px 0}</style><main><p>TaxHKD · Nền tảng kiểm chứng v2.8 · 20/10/2026</p><h1>Nguồn rõ ràng, kiểm tra từng kết luận</h1><p>Báo cáo kỹ thuật tại máy. Kết quả dưới đây không phải chứng nhận tính đúng pháp luật hay chứng minh hình thức.</p><div class="cards"><div class="card"><strong>${chunks.length}</strong>Mục kiến thức có định danh</div><div class="card"><strong>${docs.length}</strong>Tài liệu trong danh mục</div><div class="card"><strong>${nodes.length} / ${edges.length}</strong>Nút / quan hệ đồ thị</div><div class="card"><strong>${tests?.arithmetic_samples||'Chưa chạy'}</strong>Mẫu kiểm tra bất biến tính toán</div></div><section><h2>Đã thay đổi trong luồng trả lời</h2><ul><li>Đính kèm trạng thái nguồn và khoảng năm áp dụng cho từng đoạn bằng chứng.</li><li>Kiểm tra định danh, ánh xạ yêu cầu và kỳ của kết luận bằng code, độc lập với model.</li><li>Chỉ tái dùng phê duyệt nếu dấu vân tay câu hỏi, lịch sử, dữ kiện và bằng chứng không đổi.</li><li>Không phát hành toàn đáp án khi reviewer báo thiếu ý/chưa đủ căn cứ; giữ riêng phần được kiểm chứng.</li><li>Không coi thiếu doanh thu là 0 hoặc thiếu kỳ là 2026; kiểm tra cân đối GTGT, TNCN và tổng thuế trước khi trả kết quả.</li><li>Khóa cache gắn cả nội dung bộ quy tắc, không chỉ số phiên bản khai báo.</li></ul></section><section><h2>Đồ thị nguồn có thể xuất và kiểm toán</h2><p>Mục kiến thức → văn bản được nhắc tới; bộ quy tắc → tham số → viện dẫn cấu hình → tài liệu. Có quan hệ tham chiếu giữa các mục kiến thức. Không tự suy quan hệ sửa đổi/bãi bỏ văn bản hoặc tự xác minh điều khoản.</p><p><a href="graph.jsonld">Đồ thị JSON-LD</a> · <a href="manifest.json">Manifest và SHA-256</a> · <a href="impact.json">Tra cứu ảnh hưởng khi thay tài liệu</a> · <a href="tests.json">Kết quả kiểm thử</a></p><p>SHA-256: <code>${manifest.graph_sha256}</code></p></section><div class="note"><strong>${warnings.length} mục chưa liên kết trực tiếp với mã tài liệu trong danh mục.</strong> Đây là khoảng trống liên kết máy đọc được, không tự chứng minh mục đó sai hoặc không có căn cứ. Ngày ở danh mục văn bản chưa được coi là ngày hiệu lực đã xác minh.</div><section><h2>Hàng đợi hoàn thiện liên kết nguồn</h2><div class="scroll"><table><thead><tr><th>Mục</th><th>Nội dung</th><th>Việc còn lại</th></tr></thead><tbody>${warnings.map(w=>`<tr><td>${esc(w.ref||w.document_id||'')}</td><td>${esc(chunks.find(c=>c.ref_id===w.ref)?.section||w.code)}</td><td>Đối chiếu và gắn đúng văn bản, điều/khoản; không tự nâng trạng thái xác minh.</td></tr>`).join('')}</tbody></table></div></section><section><h2>Giới hạn kiểm định</h2><p>${tests?`${tests.arithmetic_samples} mẫu tính toán và ${tests.metamorphic_vat_checks} phép đổi thu nhập để kiểm tra bất biến cơ sở GTGT. Các model trong kiểm thử được mô phỏng; không gọi API thật.`:'Chưa có báo cáo kiểm thử.'} Kiểm thử thành phần không tương đương chấm đáp án LLM đầu cuối. Chưa triển khai Catala/SMT, chưa có chứng minh hình thức. JSON-LD là bản xuất đồ thị, chưa vận hành Neo4j/triple store hoặc GraphRAG.</p></section></main></html>`;
const reviewedTable=`<section><h2>Đã bổ sung liên kết nguồn cho ${manifest.scoped_source_chunks} mục</h2><p>${manifest.scoped_source_links} liên kết có phạm vi hỗ trợ, vị trí đối chiếu và dấu vân tay nội dung. Nguồn ngoài danh mục là văn bản hoặc nguồn công khai riêng, không giả lập thành tệp PDF đã lưu. Liên kết nguồn không tự chứng nhận mọi câu trong chunk.</p><div class="scroll"><table><thead><tr><th>Mục kiến thức</th><th>Nguồn / vị trí / phạm vi hỗ trợ</th><th>Giới hạn</th></tr></thead><tbody>${chunks.filter(c=>meta[c.ref_id]?.source_links?.length).map(c=>{const m=meta[c.ref_id];return `<tr><td>${esc(c.section)}</td><td>${m.source_links.map(s=>`<p><a href="${esc(s.source_url.startsWith('/')?'../../public'+s.source_url:s.source_url)}">${esc(s.code)}</a><br>${esc(s.locator)}<br>${esc(s.scope)}</p>`).join('')}</td><td>${esc(m.source_link_review.limits)}</td></tr>`;}).join('')}</tbody></table></div></section>`;
fs.writeFileSync(path.join(out,'report.html'),html.replace('</main>',reviewedTable+'</main>'));
