/* Analysis harness only. Never deployed. No question/answer data reaches a network. */
const fs=require('fs'),path=require('path'),ts=require('typescript'),crypto=require('crypto');
const originalDir='outputs/prompt-replay-210-2026-10-22';
const dir=process.argv[2]||originalDir,selected=process.argv[3]?.split(',');
const cases=JSON.parse(fs.readFileSync(originalDir+'/questions-only.json','utf8')).filter(c=>!selected||selected.includes(c.id));
if(dir===originalDir&&fs.existsSync(dir+'/answer-freeze.json'))throw Error('Frozen original replay must not be overwritten; supply a new output directory.');
const native=require('./fixtures/jev_native.cjs'),cache=new Map();
cache.set(path.resolve('worker/src/firebaseAuth.ts'),{verifiedFirebasePhone:async()=> '0900000000'});
function load(file){file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}const m={exports:{}};cache.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);cache.set(file,m.exports);return m.exports;}
// Manual experiment design, kept outside production. Labels are approximations,
// not claimed to be the output of the live stochastic classifier.
function labels(id){const n=Number(id.slice(1));const l={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['GOODS_SALES'],topic:'REVENUE_THRESHOLD',answerPurpose:'OTHER',revenueContext:'ACTUAL_YEAR',taxFocus:'unspecified',calculationShape:'SINGLE'};
 if(n<=214||[331,335,367,379,380].includes(n))Object.assign(l,{topic:'INVOICE_CORRECTION',primaryIntent:'E_INVOICE',answerPurpose:'PROCEDURE',invoicePeriod:n===207||n===331?'H1_2026':'H2_2026'});
 if([209,210,212,214,385,390].includes(n))Object.assign(l,{topic:'INVOICE_REGISTRATION',primaryIntent:'E_INVOICE',answerPurpose:'ELIGIBILITY'});
 if(n>=215&&n<=226||n===364||n===372)Object.assign(l,{topic:'TAX_AMOUNT',primaryIntent:'TAX_CALCULATION',answerPurpose:'CALCULATION',taxFocus:'vat'});
 if(n>=227&&n<=238||[288,290,294,295,296,303,304,306,386,387,388,389,392].includes(n))Object.assign(l,{topic:[236,304].includes(n)?'REVENUE_TIMING':'REVENUE_COMPOSITION'});
 if(n>=239&&n<=250||[338,345,349,350,363,368,369,370,391].includes(n))Object.assign(l,{topic:'TAX_AMOUNT',primaryIntent:'TAX_CALCULATION',answerPurpose:'CALCULATION',taxFocus:'pit'});
 if([239,245,249,338,368].includes(n))l.calculationShape='METHOD_COMPARISON';
 if(n>=251&&n<=260||n>=315&&n<=322||n===347)Object.assign(l,{topic:'BUSINESS_EXPENSES',primaryIntent:'OTHER_TAX',answerPurpose:'ELIGIBILITY',taxFocus:'pit'});
 if(n>=261&&n<=280||[346,371,377,378,400].includes(n))Object.assign(l,{topic:n>=273?'REVENUE_OWNERSHIP':'REVENUE_THRESHOLD',policyFocus:'PIT_RELIEF',primaryIntent:'RELIEF_REDUCTION',answerPurpose:'ELIGIBILITY',taxFocus:'pit'});
 if(n>=281&&n<=289||[340,360,362].includes(n))l.topic='REVENUE_OWNERSHIP';
 if(n>=291&&n<=298||n===342||n===365||n>=401&&n<=410)Object.assign(l,{topic:'PLATFORM_WITHHOLDING',primaryIntent:'PLATFORM_WITHHOLDING'});
 if(n>=299&&n<=306||[249,336,353,362,383,384,401,402,404,405,406,409,410].includes(n))l.incomeTypes=['AFFILIATE_COMMISSION'];
 if([300,403].includes(n))l.incomeTypes=['WAGE_SALARY'];
 if([366,408].includes(n))l.incomeTypes=['UNKNOWN'];
 if(n>=307&&n<=314||n>=351&&n<=361||[337,381,382].includes(n))Object.assign(l,{topic:'TAX_REGISTRATION_CHANGE',primaryIntent:'REGISTRATION',answerPurpose:'PROCEDURE',subjectContext:'INDIVIDUAL_ACTIVITY'});
 if([308,309,312,314,352,354,357,359,361].includes(n))Object.assign(l,{topic:'BUSINESS_REGISTRATION',subjectContext:'HOUSEHOLD_FORM',registrationStatus:[359].includes(n)?'UNKNOWN':'HOUSEHOLD_REGISTERED'});
 if([307,337,351,356,381,382].includes(n))l.registrationStatus='DIRECT_TAX_ONLY';
 if([310,313,355].includes(n))l.topic='REGISTRATION_REQUIREMENTS';
 if(n>=323&&n<=332||[333,334,343,344,348,375,376].includes(n))l.topic=[328,329].includes(n)?'REVENUE_TIMING':'REVENUE_THRESHOLD';
 if([336,369,383,384].includes(n))Object.assign(l,{topic:'TAX_AMOUNT',primaryIntent:'TAX_CALCULATION',answerPurpose:'CALCULATION',taxFocus:'pit',policyFocus:'PIT_RELIEF'});
 if(n>=385&&n<=392)l.revenueContext=[385,388,390].includes(n)?'PARTIAL_PERIOD':'ACTUAL_YEAR';
 if(n>=393&&n<=399)l.topic='OTHER';
 if([216,218,225,245,258,369].includes(n))l.incomeTypes=['SERVICE'];
 if([217,219,220].includes(n))l.incomeTypes=['SERVICE'];
 if([221,224,226,250,285,364].includes(n))l.incomeTypes=['GOODS_SALES','SERVICE'];
 if([210,280,339,385,388,390].includes(n))l.revenueContext='PARTIAL_PERIOD';
 if([232,233,234,235,238].includes(n))l.revenueContext='TRANSACTION';
 if([299,300,366].includes(n))l.topic='PLATFORM_WITHHOLDING';
 if([301,302].includes(n))Object.assign(l,{topic:'TAX_AMOUNT',primaryIntent:'TAX_CALCULATION',taxFocus:'pit',answerPurpose:'CALCULATION'});
 if(n===331)Object.assign(l,{topic:'INVOICE_CORRECTION',primaryIntent:'E_INVOICE',invoicePeriod:'H1_2026',answerPurpose:'PROCEDURE'});
 return l;}
const {handleChat}=load('worker/src/routeChat.ts'),{PIPELINE_VERSION}=load('worker/src/buildInfo.ts');
const originalFetch=global.fetch,log=console.log;let nativeCalls=0,generationInterceptions=0;
const events=[];console.log=(...a)=>events.push(a.join(' '));console.warn=console.log;console.error=console.log;
global.caches={default:{match:async()=>undefined,put:async()=>{}}};
(async()=>{const manifest=[];fs.mkdirSync(dir+'/prompts',{recursive:true});
 for(const c of cases){const classification=labels(c.id),requests=[],pending=[];
  global.fetch=async(url,init)=>{const body=JSON.parse(init.body);if(String(url).includes('systemone')){nativeCalls++;return Response.json(native(body,'IN_SCOPE',classification));}
   if(String(url)!=='https://api.meta.ai/v1/responses')throw Error('NETWORK_FORBIDDEN '+url);
   generationInterceptions++;requests.push(body);return Response.json({output:[{type:'message',content:[{text:'OFFLINE_CAPTURE_SENTINEL: this is not an answer and must never be scored.'}]}]});};
  try{const res=await handleChat(new Request('https://test.local/api/chat?nocache=1',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'offline-'+c.id},body:JSON.stringify(c.input)}),{FPT_AI_KEY:'OFFLINE_FIXTURE',MUSE_API_KEY:'OFFLINE_FIXTURE',DECISION_MODE:'audit'}, {waitUntil:p=>pending.push(p)},new Headers());const body=await res.json();await Promise.allSettled(pending);
   const capture={id:c.id,pipelineVersion:PIPELINE_VERSION,mode:'LOCAL_APPROXIMATE_CLASSIFICATION_NO_DENSE_API',classification,input:c.input,requests,sourceTrace:body.retrieval||null,preGenerationResponse:requests.length?null:body.response};
   fs.writeFileSync(`${dir}/prompts/${c.id}.json`,JSON.stringify(capture,null,2));manifest.push({id:c.id,captured:requests.length>0,refs:body.retrieval?.decision?.sourceCoverage?.provided||body.matchedRefs||[],hash:requests[0]?crypto.createHash('sha256').update(JSON.stringify(requests[0])).digest('hex'):null,preGenerationResponse:capture.preGenerationResponse,error:body.error});
  }catch(e){manifest.push({id:c.id,captured:false,error:e.message});}
 }
 fs.writeFileSync(dir+'/capture-manifest.json',JSON.stringify({pipelineVersion:PIPELINE_VERSION,networkCalls:0,mockedNativeCalls:nativeCalls,interceptedGenerationRequests:generationInterceptions,limitations:['Classifier labels manually approximated, not production labels.','No Cloudflare dense search, provider generation, or real legal reviewer.','Prompts captured from actual local handleChat; sentinel is never an actual answer.'],cases:manifest},null,2));
 fs.writeFileSync(dir+'/capture-events.log',events.join('\n'));log(JSON.stringify({total:manifest.length,captured:manifest.filter(x=>x.captured).length,notCaptured:manifest.filter(x=>!x.captured),networkCalls:0}));
})().catch(e=>{log(e.stack);process.exitCode=1;}).finally(()=>{global.fetch=originalFetch;});
