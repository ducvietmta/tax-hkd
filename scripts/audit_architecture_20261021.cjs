/* Local reproductions of audit findings; no model calls or legal assertions. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();
function load(file){
 file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';
 if(cache.has(file))return cache.get(file);
 if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}
 const m={exports:{}};cache.set(file,m.exports);
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);
 cache.set(file,m.exports);return m.exports;
}
global.fetch=()=>{throw Error('NETWORK_FORBIDDEN');};
const conversation=load('worker/src/conversation.ts'),retriever=load('worker/src/retriever.ts');
const validation=load('worker/src/answerValidation.ts'),understand=load('worker/src/decision/understandQuery.ts');
const {JevDecisionProvider}=load('worker/src/decision/jevProvider.ts');
const scope={years:[2026],today:'2026-10-21',periodSource:'current_message'};
const findings=[];
const long='Thông tin hoạt động. '.repeat(60)+' Tôi không cư trú; không tính GTGT.';
const normalized=conversation.normalizeConversationHistory([{role:'user',content:long}]);
assert(!normalized[0].content.includes('không cư trú'));
findings.push({id:'history_truncation',originalLength:long.length,retainedLength:normalized[0].content.length,lost:'Tôi không cư trú; không tính GTGT.'});
const provider=new JevDecisionProvider('offline');
const providerState=provider.state('Vậy tính lại giúp tôi',[{role:'user',content:'a'.repeat(810)+' Chỉ tính TNCN.'}]);
assert(!providerState.history[0].content.includes('TNCN'));
findings.push({id:'classifier_history_truncation',retainedLength:providerState.history[0].content.length});
function hit(ref,text,purpose){return {score:1,chunk:{id:ref,ref_id:ref,file:'audit',section:'audit',tier:'VERIFIED',text,...(purpose?{purpose_passages:{DEFINITION:text}}:{})}};}
const original='Ví dụ minh họa: doanh thu 16.5 triệu đồng.';
const context=retriever.buildContext([hit('audit-decimal',original)],'doanh thu',6500,scope);
assert(!context.passages[0].text.includes('16.5'));
findings.push({id:'decimal_deleted',before:original,after:context.passages[0].text});
const definition=retriever.buildContext([hit('definition','Định nghĩa chủ thể.',true),hit('exception','Điều kiện ngoại lệ cần xét.')],'giải thích',6500,scope,'DEFINITION');
assert.deepEqual(definition.includedRefs,['definition']);
findings.push({id:'purpose_discards_other_sources',inputRefs:['definition','exception'],outputRefs:definition.includedRefs});
const semantic={topic:'TAX_AMOUNT',taxFocus:'both',primaryIntent:'TAX_CALCULATION',secondaryIntents:[],incomeTypes:['SERVICE'],calculationShape:'SINGLE',methodContext:'UNSPECIFIED'};
const question='Tính riêng GTGT và TNCN cho doanh thu 4 tỷ.';
const incomplete='GTGT: cơ sở doanh thu 4 tỷ đồng. TNCN phải nộp 85 triệu đồng.';
const missing=validation.missingAnswerIntents(question,incomplete,semantic);
assert.deepEqual(missing,[]);
assert.equal(validation.canUseVerifiedAnswer(question,incomplete,'both',semantic),true);
findings.push({id:'basis_mistaken_for_tax_amount',question,answer:incomplete,missing,templateGateAllows:true,note:'Gate reproduction only; not an end-to-end generated answer.'});
const frame={tax_intent:{primary:{value:'TAX_CALCULATION'},secondary:[]},tax_period:{years:[2026]},taxpayer_type:{value:'INDIVIDUAL_BUSINESS'},income_type:[],facts:{},semantic:{taxFocus:'pit',calculationShape:'SCENARIOS'}};
const requests=understand.buildSubrequests(frame);
assert.equal(requests.length,1);
findings.push({id:'scenario_not_structured',requests,note:'Same intent/focus collapses to one request; no independent scenario facts or coverage contract.'});
fs.mkdirSync('outputs/architecture-audit-2026-10-21',{recursive:true});
fs.writeFileSync('outputs/architecture-audit-2026-10-21/reproductions.json',JSON.stringify({apiCalls:0,findings},null,2));
console.log(JSON.stringify({reproduced:findings.length,apiCalls:0,findings},null,2));
