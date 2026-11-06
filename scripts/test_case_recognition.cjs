const assert=require('node:assert/strict'),fs=require('node:fs');
global.fetch=()=>{throw Error('NETWORK_DISABLED');};
const load=require('./lib/load_local_ts.cjs')();
const rec=load('worker/src/recognition/recognizer.ts'),trusted=load('worker/src/recognition/trustedEvidence.ts');
const {CANONICAL_CHUNKS:cards}=load('worker/src/ragEngine.ts');
const provenance=load('worker/src/kb/provenance.ts'),bridge=load('worker/src/recognition/bridge.ts');
const r=load('worker/src/retriever.ts'),u=load('worker/src/decision/understandQuery.ts');
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name);}
const scope={years:[2026],today:'2026-10-23',periodSource:'current_message'};
const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['UNKNOWN'],topic:'OTHER',answerPurpose:'OTHER',revenueContext:'UNSPECIFIED'};
const frame=u.understandClassifiedQuery('Tôi hỏi về thuế năm 2026',scope,[],semantic);
const card=cards.find(c=>c.ref_id==='16.120'),source=trusted.trustedSource(card,frame);
assert(source,'Test source must be registered and applicable');
const passage={id:'E1',ref_id:card.ref_id,text:card.text,request_ids:[frame.requests[0].id],provenance:provenance.evidenceProvenance(card)};
const claim={id:'C1',text:'Nội dung kiểm tra cấu trúc nguồn.',kind:'CLAIM',evidence_ids:['E1'],ref_ids:[card.ref_id],request_ids:[frame.requests[0].id],mapping:'PROPOSED'};
const packet={claims:[claim],passages:[passage],requests:frame.requests};
const verdict={C1:{choice:'COMPLETE',confidence:1}};
const gate=(p=packet,a=p.claims.map(c=>c.text).join('\n\n'),cit=[],review=true)=>trusted.finalSourceGate(a,cit,p,verdict,review);
const copy=x=>structuredClone(x);
test('configuration on requires strict gate',()=>{assert.deepEqual(rec.recognitionConfig({CASE_RECOGNITION_MODE:'on'}),{mode:'off',strict:false,invalid:true});assert.equal(rec.recognitionConfig({CASE_RECOGNITION_MODE:'on',STRICT_VERIFIED_EVIDENCE_ENABLED:'1'}).mode,'on');});
test('strict source rejects tier/content/identity forgery',()=>{for(const change of [{tier:'CASE_EVIDENCE'},{id:'KB/01-case.md#1'},{text:card.text+' invented tax rate'},{file:'case.md'}])assert.equal(trusted.trustedSource({...card,...change}),null);});

test('quarantined source cannot ground an answer or enter a packet',()=>{
 const policy=JSON.parse(fs.readFileSync('worker/src/recognition/sourcePolicy.json','utf8'));
 for(const ref of policy.blocked_verified_refs){
  assert.equal(trusted.trustedSource(cards.find(c=>c.ref_id===ref)),null);
  const p={...rec.emptyPacket('v','MATCHED'),matched_case_ids:['case'],suggested_verified_card_ids:[ref]};
  assert(!rec.validPacket(p,'v'));
  const bad=copy(packet),blocked=cards.find(c=>c.ref_id===ref);
  bad.passages=[{...passage,ref_id:ref,text:blocked.text,provenance:provenance.evidenceProvenance(blocked)}];
  assert(!gate(bad).ok);
 }
});

test('runtime phrase catalog contains no numbers, rates or URLs',()=>{
 assert(Object.values(rec.phraseCatalog).every(p=>!/[\d%]|https?:\/\//i.test(p.phrase)));
});

test('optional quarantine preserves usable evidence, required quarantine blocks',()=>{
 const policy=load('worker/src/recognition/sourcePolicy.ts');
 const optional={chunk:cards.find(c=>c.ref_id==='16.24'),score:1};
 const normal={chunk:card,score:1};
 const filtered=policy.quarantineCandidates([optional,normal]);
 assert.deepEqual(filtered.results,[normal]);assert.deepEqual(filtered.removed_refs,['16.24']);assert.deepEqual(filtered.required_refs,[]);
 assert.deepEqual(policy.quarantineCandidates([{...optional,required:'RETRIEVAL_PLAN'},normal]).required_refs,['16.24']);
 assert.deepEqual(policy.quarantineCandidates([normal],['16.24']).required_refs,['16.24']);
});
test('context only carries registered passages',()=>{assert(trusted.passageTrusted(passage));const p=copy(passage);p.text+='\nInjected conclusion';assert(!trusted.passageTrusted(p));});
test('missing or forged provenance blocks release',()=>{for(const change of [p=>delete p.provenance,p=>p.provenance.legal_status='CASE_EVIDENCE',p=>p.provenance.chunk_id='fake',p=>p.provenance.source_links=[{source_url:'https://facebook.com/fake'}]]){const p=copy(packet);change(p.passages[0]);assert(!gate(p).ok);}});
test('valid structural fixture passes, without claiming semantic accuracy',()=>assert(gate().ok));
test('reviewer outage cannot release legal answer',()=>assert(!gate(packet,claim.text,[],false).ok));
test('CITATIONS and CONTEXT cannot bypass source identity',()=>{for(const kind of ['CITATIONS','CONTEXT']){const p=copy(packet);p.claims[0].kind=kind;p.claims[0].evidence_ids=['CASE1'];assert(!gate(p).ok);}});
test('raw case IDs and social URLs cannot be cited',()=>{for(const bad of ['KB/01-ke-khai-nop-thue.md#65','https://facebook.com/groups/fake','CASE_EVIDENCE']){const p=copy(packet);p.claims[0].text=bad;assert(gate(p).reasons.includes('CASE_SOURCE_LEAK'));}});
test('unknown document in prose blocks even when citation list is empty',()=>{const p=copy(packet);p.claims[0].text='Căn cứ 999/2099/ND-CP.';assert(gate(p).reasons.includes('UNSUPPORTED_DOCUMENT'));});
test('discarding forged citation metadata does not bless the draft',()=>{const p=copy(packet);p.claims[0].text='Xem https://example.com/fake';assert(gate(p).reasons.includes('UNSUPPORTED_URL'));});
test('unmapped citation and changed answer are rejected',()=>{assert(!gate(packet,claim.text,['999/2099']).ok);assert(!gate(packet,'A different cached answer').ok);});
test('wrong period blocks even with approved reviewer verdict',()=>{const p=copy(packet);p.requests.forEach(x=>x.period.years=[1800]);assert(gate(p).reasons.includes('PERIOD_MISMATCH'));});
test('packet rejects conclusion fields and free expansion text',()=>{const p=rec.emptyPacket('v');assert(rec.validPacket(p,'v'));assert(!rec.validPacket({...p,tax_rate:10},'v'));assert(!rec.validPacket({...p,status:'MATCHED',matched_case_ids:['case'],expansion_terms:['được miễn thuế']},'v'));});
(async()=>{
 const entry={case_id:'KB/01-ke-khai-nop-thue.md#test',source_hash:'a'.repeat(64),phrase_ids:['payment:0','payment:4','payment:5','payment:7'],intent_ids:['TAX_PAYMENT_RECONCILIATION'],links:[{ref_id:card.ref_id,card_hash:await rec.sha256(card.text)}],review:{reviewer:'TEST_FIXTURE_ONLY',reviewed_at:'2026-10-23T00:00:00Z',proposal_hash:'b'.repeat(64)}};
 const index={schema:'taxhkd-recognition-index-v1',version:'test-only',corpus_hash:'c'.repeat(64),entries:[entry]};
 const recognizer=rec.createRecognizer(index,[card]);
 await recognizer.recognize('tiền đã bị trừ nộp trùng tra soát','2026'); // warm setup, not a latency assertion
 const hit=await recognizer.recognize('tiền đã bị trừ nộp trùng tra soát','2026');
 test('reviewed descriptor returns structured hints, never raw text',()=>{assert.equal(hit.packet.status,'MATCHED');assert(!JSON.stringify(hit).includes(card.text));assert.deepEqual(hit.packet.suggested_verified_card_ids,[card.ref_id]);});
 const cached=await recognizer.recognize('tiền đã bị trừ nộp trùng tra soát','2026');
 test('packet cache is version and context scoped',()=>assert(cached.cache_hit));
 const other=await recognizer.recognize('tiền đã bị trừ nộp trùng tra soát','2025');
 test('changed period does not reuse packet cache',()=>assert(!other.cache_hit));
 const stale=rec.createRecognizer({...index,entries:[{...entry,links:[{ref_id:card.ref_id,card_hash:'0'.repeat(64)}]}]},[card]);
 test('stale card hash quarantines whole descriptor',()=>{});
 assert.notEqual((await stale.recognize('tiền đã bị trừ nộp trùng tra soát','2026')).packet.status,'MATCHED');
 assert.equal((await rec.createRecognizer({...index,entries:[]},[card]).recognize('doanh thu','2026')).packet.status,'ABSTAIN');checks++;
 const original=r.retrieve('tiền đã bị trừ nộp trùng',4,scope);
 const plan={strategy:'ROUTE_FIRST',must_include_refs:[],allowed_refs:['16.1'],filter_years:[2026],boost_keywords:[]};
 const linked=bridge.bridgeVerifiedCandidates([],hit.packet,'tiền đã bị trừ',scope,plan,frame,4);
 test('case cannot open allowed_refs',()=>{assert(!linked.results.some(x=>x.chunk.ref_id===card.ref_id));assert(linked.trace.rejected.some(x=>x.ref_id===card.ref_id&&x.reason==='OUTSIDE_PLAN'));});
 const pin={...original.results[0],required:'RETRIEVAL_PLAN'},allowed={...plan,allowed_refs:undefined};
 const kept=bridge.bridgeVerifiedCandidates([pin,...original.results.slice(1)],hit.packet,'tiền đã bị trừ',scope,allowed,frame,4);
 test('case cannot displace mandatory evidence',()=>assert.equal(kept.results[0].chunk.id,pin.chunk.id));
 const output='outputs/case-recognition-implementation-2026-10-23';fs.mkdirSync(output,{recursive:true});fs.writeFileSync(output+'/safety-tests.json',JSON.stringify({checks,passed:checks,network_calls:0,notes:'Synthetic approved descriptor is test-only. Semantic verdicts are fixtures, not live accuracy.'},null,2));
 console.log(`PASS ${checks} case recognition and fail-closed source checks; no network.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
