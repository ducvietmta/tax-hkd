#!/usr/bin/env node
/** Offline component contracts. No provider output or legal prose is certified. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..');
const sourcePath = path.join(ROOT,'tests/fixtures/tax-hkd-191.json');
const source = fs.readFileSync(sourcePath,'utf8');
const suite = JSON.parse(source);
const { specs, version, labelSource } = require('../tests/offline/tax-hkd-191.spec.cjs');
const onlyArg = process.argv.find(v=>v.startsWith('--ids='));
const selected = onlyArg ? new Set(onlyArg.slice(6).split(',').map(s=>s.trim())) : null;
if (process.argv.slice(2).some(v=>!v.startsWith('--ids='))) throw new Error('Only --ids=G001,G196 is supported; network mode does not exist.');
if (selected) for (const id of selected) assert.ok(suite.cases.some(c=>c.id===id),`Unknown case: ${id}`);

let networkAttempts=0;
const denyNetwork = () => { networkAttempts++; throw new Error('OFFLINE_NETWORK_FORBIDDEN'); };
const originalFetch = global.fetch;
global.fetch = denyNetwork;
const originals=[];
for (const [name, keys] of [['node:http',['request','get']],['node:https',['request','get']],['node:net',['connect','createConnection']]]) {
  const mod=require(name);
  for (const key of keys) { originals.push([mod,key,mod[key]]); mod[key]=denyNetwork; }
}
const modules=new Map();
function load(relative) {
  let file=path.resolve(ROOT,relative);
  if (!fs.existsSync(file)) file += '.ts';
  if (modules.has(file)) return modules.get(file);
  if (file.endsWith('.json')) {
    const data=JSON.parse(fs.readFileSync(file,'utf8'));
    return {default:data,...data};
  }
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};modules.set(file,mod.exports);
  new Function('require','module','exports',code)(id=>id.startsWith('node:')?require(id):load(path.resolve(path.dirname(file),id)),mod,mod.exports);
  modules.set(file,mod.exports);return mod.exports;
}
const scopeMod=load('shared/taxScope.ts');
const understand=load('worker/src/decision/understandQuery.ts');
const planMod=load('worker/src/decision/retrievalPlan.ts');
const retriever=load('worker/src/retriever.ts');
const convo=load('worker/src/conversation.ts');
const evaluator=load('worker/src/rules/evaluator.ts');
const renderer=load('worker/src/decision/render.ts');
const validation=load('worker/src/answerValidation.ts');
const providerMod=load('worker/src/decision/jevProvider.ts');
const gateMod=load('worker/src/decision/evidenceGate.ts');
const kb=load('worker/src/ragEngine.ts');

assert.equal(suite.cases.length,191);
assert.equal(new Set(suite.cases.map(c=>c.id)).size,191);
assert.equal(suite.cases.filter(c=>c.enabled).length,191);
assert.equal(Object.keys(specs).length,191);
const moneyValues = text => {
  const f=text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  const values=[...f.matchAll(/(?<!\d)\d{1,3}(?:[.,]\d{3}){2,}(?!\d)/g)].map(m=>Number(m[0].replace(/[.,]/g,'')));
  for (const m of f.matchAll(/(\d+(?:[.,]\d+)?)\s*(ty|trieu)\b/g)) values.push(Math.round(Number(m[1].replace(',','.'))*(m[2]==='ty'?1e9:1e6)));
  return values;
};
async function runCase(c) {
  const spec=specs[c.id];
  const sourceCase=c;
  const effectiveInput=spec.inputFrom?suite.cases.find(x=>x.id===spec.inputFrom).input:spec.input||c.input;
  c={...c,input:effectiveInput,enabled:spec.enabled??c.enabled};
  const result={id:c.id,title:c.title,enabled:c.enabled,status:'SKIPPED_DISABLED',checks:[],
    untested:['live_semantic_classification','generated_answer_semantics','live_provider_availability'],
    answerOrigin:c.provenance?.answer_origin || 'original_user_supplied_reference',
    input:c.input,expected:c.expected,sourceEnabled:sourceCase.enabled,
    ...(sourceCase.input!==c.input?{sourceInput:sourceCase.input}:{}),
    ...(spec.activationReason?{activationReason:spec.activationReason}:{})};
  if (!c.enabled) { result.reason='Disabled in original 200-case export; not re-enabled.'; return result; }
  async function check(layer,label,fn) {
    try { const detail=await fn(); result.checks.push({layer,label,passed:true,...(detail===undefined?{}:{detail})}); }
    catch(e) { result.checks.push({layer,label,passed:false,error:e.message}); }
  }
  const rawScope=scopeMod.resolveAnswerScope(c.input.history,c.input.message,new Date(`${c.context.system_date}T05:00:00+07:00`));
  if (spec.scopeYears) await check('period','resolve actual question period',()=>assert.deepEqual([...rawScope.years].sort(),[...spec.scopeYears].sort()));
  // Supplied period/labels are intentionally mocked, just as provider output is.
  const scope={...rawScope,years:spec.years || [2026]};
  const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['UNKNOWN'],
    revenueContext:'UNSPECIFIED',taxFocus:'unspecified',vatRelief:'UNKNOWN',...spec.semantic};
  const frame=understand.understandClassifiedQuery(c.input.message,scope,c.input.history,semantic);
  result.fixture={labelSource,semantic,years:scope.years};
  if (spec.facts) for (const [key,expected] of Object.entries(spec.facts)) await check('fact_extraction',key,()=>{
    assert.deepEqual(frame.facts[key] ?? null,expected);return {expected,actual:frame.facts[key]??null};
  });
  const plan=planMod.buildRetrievalPlan(frame);
  const query=convo.buildConversationRetrievalQuery(c.input.history,c.input.message,scope.years);
  const retrieved=retriever.retrieve(query,8,scope,plan);
  const refs=retrieved.results.map(r=>r.chunk.ref_id);
  await check('retrieval','relevant tax evidence retrieved with fixture labels',()=>{
    assert.ok(spec.evidenceAny.some(r=>refs.includes(r)),`Expected one of [${spec.evidenceAny}], got [${refs}]`);
    return {expectedAny:spec.evidenceAny,actualRefs:refs};
  });
  if (c.input.history.length) await check('conversation','normalization retains current message and history',()=>{
    assert.deepEqual(convo.normalizeConversationHistory(c.input.history),c.input.history);
    assert.ok(query.includes(c.input.message),'Current correction must remain in retrieval query');
    return {historyTurns:c.input.history.length,note:'Does not certify a model merged the corrected facts.'};
  });
  if(spec.queryIncludes||spec.queryExcludes)await check('conversation','retain inherited facts while replacing period',()=>{
    for(const text of spec.queryIncludes||[])assert.ok(query.includes(text),`Lost inherited fact: ${text}`);
    for(const text of spec.queryExcludes||[])assert.ok(!query.includes(text),`Retained superseded period: ${text}`);
  });
  if(spec.evidenceGate)await check('evidence_gate','exclude documents outside the requested business period',()=>{
    const rule=spec.evidenceGate;
    const chunks=[...rule.accept,...rule.reject].map(ref=>{
      const chunk=kb.CANONICAL_CHUNKS.find(c=>c.ref_id===ref);assert.ok(chunk,`Missing fixture source: ${ref}`);return chunk;
    });
    const gated=gateMod.filterAndGateEvidence(chunks,{...frame,tax_period:{...frame.tax_period,years:rule.years}});
    const passed=gated.passedChunks.map(c=>c.ref_id);
    for(const ref of rule.accept)assert.ok(passed.includes(ref),`Dropped applicable evidence ${ref}`);
    for(const ref of rule.reject)assert.ok(!passed.includes(ref),`Accepted wrong-period evidence ${ref}`);
    return{years:rule.years,accepted:passed};
  });
  for (const [index,s] of (spec.scenarios||[]).entries()) await check('rules_engine',`scenario ${index+1}`,()=>{
    const scenarioFrame={...frame,tax_period:{...frame.tax_period,years:[s.year || scope.years[0]]},
      residency:{...frame.residency,value:s.resident || 'RESIDENT'},
      income_type:[{value:semantic.incomeTypes[0]==='UNKNOWN'?'GOODS_SALES':semantic.incomeTypes[0],confidence:1,source:'llm'}],
      facts:{revenue_basis:'ANNUAL',...s.facts},semantic:{...frame.semantic,taxFocus:semantic.taxFocus}};
    const actual=evaluator.evaluateDecisionFrame(scenarioFrame);
    for (const [key,expected] of Object.entries(s.expected)) assert.equal(actual[key],expected,`${key}: expected ${expected}, got ${actual[key]}`);
    let response;
    if (s.render) {
      response=renderer.renderDeterministicAnswer(actual,scenarioFrame).response;
      const amounts=moneyValues(response);
      for (const expected of s.requiredAmounts) assert.ok(amounts.includes(expected),`Rendered answer missing ${expected}`);
      assert.equal(validation.canUseVerifiedAnswer(c.input.message,response,semantic.taxFocus,semantic),true);
    }
    return {injectedFacts:s.facts,residencyFixture:scenarioFrame.residency.value,incomeTypeFixture:scenarioFrame.income_type[0].value,
      syntheticIncome:!!s.syntheticIncome,syntheticRevenue:!!s.syntheticRevenue,
      expected:s.expected,actual:Object.fromEntries(Object.keys(s.expected).map(k=>[k,actual[k]])),...(response?{response}:{})};
  });
  if (spec.coverageMutation) await check('answer_guard','reject deliberately incomplete answer',()=>{
    const actual=validation.missingAnswerIntents(c.input.message,spec.coverageMutation.answer,semantic);
    for (const issue of spec.coverageMutation.missing) assert.ok(actual.includes(issue),`Missing guard issue: ${issue}; got ${actual}`);
    assert.equal(validation.canUseVerifiedAnswer(c.input.message,spec.coverageMutation.answer,semantic.taxFocus,semantic),false);
    return {candidate:spec.coverageMutation.answer,issues:actual};
  });
  if (spec.citationMutation) await check('citation_validator','preserve original claim for semantic review without fabricating a citation',()=>{
    const bad='Hộ vượt 1 tỷ cần đăng ký hóa đơn điện tử trong 30 ngày theo Điều 9 Nghị định 141/2026/NĐ-CP.';
    const corrected=validation.validateLegalCitations(c.input.message,bad,['Điều 9 Nghị định 141/2026/NĐ-CP'],scope,retrieved.results.map(r=>r.chunk));
    assert.equal(corrected.answer,bad);
    assert(!corrected.citations.some(c=>c.includes('Khoản 2 Điều 1')));
  });
  if (spec.reviewCheck) await check('review_contract','propagate mocked reviewer rejection for required business condition',async()=>{
    const provider=new providerMod.QuyetDecisionProvider('OFFLINE_DUMMY');
    // Mock the typed decision transport, not the law or the answer. No fetch.
    provider.ask=async(state,questions)=>{
      assert.ok(questions[spec.reviewCheck],`Missing reviewer contract ${spec.reviewCheck}`);
      return Object.fromEntries(Object.keys(questions).map(key=>[key,{type:'choice',confidence:.99,
        choice:key===spec.reviewCheck?'INCOMPLETE':({facts:'FAITHFUL',evidence:'SUPPORTED',missing_fact:'NONE',safe_fact:'NONE'}[key]||'COMPLETE')} ]));
    };
    const issues=await provider.reviewAnswer(c.input.message,'Bản nháp cố ý thiếu điều kiện nghiệp vụ.', 'Bằng chứng kiểm thử.',c.input.history,semantic);
    assert.ok(issues.includes(`${spec.reviewCheck}:INCOMPLETE`));
  });
  result.status=result.checks.some(c=>!c.passed)?'FAIL_OFFLINE':'PASS_OFFLINE';
  result.coverageLayers=[...new Set(result.checks.map(c=>c.layer))];
  return result;
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function main() {
  const results=[];
  for (const c of suite.cases.filter(c=>!selected||selected.has(c.id))) {
    try { results.push(await runCase(c)); }
    catch(e) { results.push({id:c.id,title:c.title,status:'FAIL_OFFLINE',checks:[{layer:'harness',passed:false,error:e.stack}]}); }
  }
  const counts=Object.fromEntries(['PASS_OFFLINE','FAIL_OFFLINE','SKIPPED_DISABLED'].map(status=>[status,results.filter(r=>r.status===status).length]));
  const retrievalOnly=results.filter(r=>r.status!=='SKIPPED_DISABLED'&&r.coverageLayers?.length===1&&r.coverageLayers[0]==='retrieval').length;
  const layers={};for(const r of results)for(const c of r.checks){layers[c.layer]??={passed:0,failed:0};layers[c.layer][c.passed?'passed':'failed']++;}
  const report={schemaVersion:'1.0',suiteId:suite.suite_id,specVersion:version,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),
    ranAt:new Date().toISOString(),fixedDate:suite.test_context.system_date,networkAttempts,apiCalls:0,selection:selected?[...selected]:null,
    counts,layers,coverage:{retrievalOnly,withAdditionalChecks:results.filter(r=>r.status!=='SKIPPED_DISABLED').length-retrievalOnly},limitations:['PASS_OFFLINE only covers the listed code checks; it is not a score for a generated legal answer.',
      'Classification, business period and complex scenario facts are explicit fixtures, not actual model outputs.',
      'Narrative cases may test retrieval only. No offline semantic legal judge is claimed.',
      '70 added answers retain their proposed/unapproved provenance. Nine cases were removed; IDs of the 191 remaining cases are unchanged.'],results};
  const out=path.join(ROOT,'outputs/tests/offline-200');fs.mkdirSync(out,{recursive:true});
  const enabledCount=suite.cases.filter(c=>specs[c.id].enabled??c.enabled).length;
  fs.writeFileSync(path.join(out,'test-cases.json'),JSON.stringify({...suite,source_enabled:suite.enabled,enabled:enabledCount,disabled:suite.total-enabledCount,
    offline_definition:{version,labelSource,networkAllowed:false,liveModelTested:false},
    cases:suite.cases.map(c=>({...c,source_enabled:c.enabled,enabled:specs[c.id].enabled??c.enabled,
      ...(specs[c.id].enabled?{disabled_reason:null}:{}),offline:specs[c.id]}))},null,2));
  const reportName=selected?`report-${[...selected].join('-')}`:'report';
  fs.writeFileSync(path.join(out,reportName+'.json'),JSON.stringify(report,null,2));
  const rows=results.map(r=>`<details class="${r.status}"><summary>${esc(r.id)} · ${esc(r.title)} <b>${esc(r.status)}</b></summary><p>${esc(r.input?.message)}</p><p><strong>Các phần đã kiểm:</strong> ${esc((r.coverageLayers||[]).join(', '))}</p>${r.checks.map(c=>`<p class="${c.passed?'ok':'bad'}">${c.passed?'✓':'✗'} ${esc(c.layer)} — ${esc(c.label||'')} ${esc(c.error||'')}</p>`).join('')}<p><strong>Đáp án tham chiếu (không được chấm tự động):</strong> ${esc(r.expected?.reference_answer)}</p><p>${esc(r.reason||'Không gọi mô hình để phân loại hoặc sinh đáp án trong lượt chạy này.')}</p></details>`).join('');
  fs.writeFileSync(path.join(out,reportName+'.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><title>TAX-HKD · ${suite.total} ca offline</title><style>body{font:16px/1.6 system-ui;background:#f3f6fa;color:#183044;max-width:1120px;margin:40px auto;padding:0 20px}h1{font-size:28px}.notice,details{background:white;padding:18px;border:1px solid #d8e2ea;border-radius:12px;margin:12px 0}summary{cursor:pointer}summary b{float:right;font-size:13px}.FAIL_OFFLINE{border-color:#e88b8b}.bad{color:#ad172d}.ok{color:#14664a}.SKIPPED_DISABLED{opacity:.65}p{overflow-wrap:anywhere}</style><h1>${suite.total} ca kiểm thử offline TAX-HKD</h1><div class="notice"><b>Đạt offline: ${counts.PASS_OFFLINE} · Lỗi offline: ${counts.FAIL_OFFLINE} · Đã tắt: ${counts.SKIPPED_DISABLED}</b><p>Gọi API: 0 · Lần thử truy cập mạng: ${networkAttempts} · Ngày nghiệp vụ cố định: ${esc(report.fixedDate)}</p><p><strong>${retrievalOnly} ca chỉ kiểm tra retrieval; ${report.coverage.withAdditionalChecks} ca có thêm kiểm tra khác.</strong></p><p>Đây là kiểm thử các thành phần code. Không phải xác nhận mô hình đã trả lời đúng ${suite.total} câu. Mỗi ca chỉ được xác nhận ở những phần liệt kê bên dưới. 70 đáp án mới vẫn là bản đề xuất.</p></div>${rows}</html>`);
  console.log(JSON.stringify({counts,layers,coverage:report.coverage,apiCalls:0,networkAttempts,report:path.relative(ROOT,path.join(out,reportName+'.html'))},null,2));
  for(const r of results.filter(r=>r.status==='FAIL_OFFLINE'))console.error(`${r.id}: ${r.checks.filter(c=>!c.passed).map(c=>c.layer+': '+c.error).join(' | ')}`);
  if(counts.FAIL_OFFLINE||networkAttempts)process.exitCode=1;
}
main().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(()=>{
  global.fetch=originalFetch;for(const [mod,key,original]of originals)mod[key]=original;
});
