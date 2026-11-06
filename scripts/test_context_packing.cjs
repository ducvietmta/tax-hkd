const fs=require('fs');const base=fs.readFileSync('scripts/test_required_evidence.cjs','utf8');eval(base.slice(0,base.indexOf('const c=JSON'))+`
const q='tôi làm affiliate phải đóng những thuế gì',s={...scope.resolveAnswerScope([],q),years:[2026]};
for(const topic of ['TAX_AMOUNT','PLATFORM_WITHHOLDING','OTHER']){
 const f=understand.understandClassifiedQuery(q,s,[],{taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['AFFILIATE_COMMISSION'],topic,subjectContext:'INDIVIDUAL_ACTIVITY',revenueContext:'UNSPECIFIED',taxFocus:'unspecified',answerPurpose:'OTHER',calculationShape:'SINGLE'});
 const p=planner.buildRetrievalPlan(f),r=retrieval.retrieve(q,6,s,p);
 const c=retrieval.buildReviewContext(r.results,q,8569,14569,s);
 assert.deepEqual(c.missingRequiredRefs,[],topic);assert(c.text.length<=15369);
}
const hit=(ref,len,required)=>({chunk:{id:ref,ref_id:ref,file:'test',section:'test',tier:'VERIFIED',text:'x'.repeat(len),evidence_mode:'COMPLETE_RULE'},score:1,viaRoute:false,required});
const rows=[hit('alpha',3000,'RETRIEVAL_PLAN'),hit('beta',3000,'RETRIEVAL_PLAN'),hit('optional',1000)];
const compact=retrieval.buildReviewContext(rows,'',4000,8000,s);
assert.deepEqual(compact.includedRefs,['alpha','beta','optional']);assert.deepEqual(compact.missingRequiredRefs,[]);
const impossible=retrieval.buildReviewContext([hit('oversize',20000,'DOCUMENT_REFERENCE')],'',4000,8000,s);
assert.deepEqual(impossible.missingRequiredRefs,['oversize']);assert(!impossible.text,'Never truncate an indivisible rule');
const dated=hit('dated',20000,'RETRIEVAL_PLAN');dated.chunk.context_passage='x'.repeat(300);dated.chunk.context_passage_period={applies_from_year:2026,applies_to_year:2026};
const past=retrieval.buildReviewContext([dated],'',4000,8000,{...s,years:[2025]});assert.deepEqual(past.missingRequiredRefs,['dated'],'Inapplicable dated excerpts stay excluded');
const small=[hit('small',100,'RETRIEVAL_PLAN'),hit('also-small',100)];
assert.deepEqual(retrieval.buildReviewContext(small,'',4000,8000,s),retrieval.buildContext(small,'',4000,s),'Keep normal prompts unchanged');
console.log('PASS adaptive evidence packing: three semantic labels, opaque refs, required-first packing, query-specific lead preservation, bounded growth, oversized rules still blocked. No API.');
`);
