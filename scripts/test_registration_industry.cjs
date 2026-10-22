const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();
function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);
 if(file.endsWith('.json'))return {default:JSON.parse(fs.readFileSync(file,'utf8'))};
 const m={exports:{}};cache.set(file,m.exports);
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id+(id.endsWith('.json')?'':'.ts'))):require(id),m,m.exports);
 return m.exports;
}
const shared=load('shared/registrationIndustry.ts');
const {handleRegistrationIndustry:handle}=load('worker/src/registrationIndustry.ts');
const client=load('src/features/registration/industrySuggestion.ts');
const model=load('src/features/registration/wizardModel.ts');
const original=global.fetch;
let limited=false,dbError=false,calls=[],reply={status:'suggested',code:'9510',confidence:.95},modelStatus='completed',modelHttp=200,rawText=null,throwModel=false;
const env={MUSE_API_KEY:'offline-muse-fixture',JEV_API_KEY:'must-not-be-used',DB:{prepare(sql){
 assert(sql.includes('INSERT INTO registration_industry_limits')&&sql.includes('< 12')&&sql.includes('< 500')&&sql.includes('RETURNING id'));
 return {bind(...values){
   assert.equal(values.length,2);assert.equal(values[0],values[1]);assert(!values[0].includes('127.0.0.1'));
   return {async first(){if(dbError)throw Error('DB down');return limited?null:{id:1};}};
 }};
}}};
const req=(body={activity:'Tôi sửa máy tính cho khách tại nhà',clarifications:[]},method='POST')=>new Request('https://test/api/registration-guide/industry',{method,headers:{'Content-Type':'application/json','CF-Connecting-IP':'127.0.0.1'},...(method==='POST'?{body:JSON.stringify(body)}:{})});
global.fetch=async(url,init)=>{
 assert.equal(url,'https://api.meta.ai/v1/responses','Registration code selection must only call Muse');
 assert.equal(init.headers.Authorization,'Bearer offline-muse-fixture');
 const body=JSON.parse(init.body);calls.push({url,body});
 if(throwModel)throw new DOMException('Fixture timeout','TimeoutError');
 return Response.json({status:modelStatus,output:[{type:'message',content:[{type:'output_text',text:rawText??JSON.stringify(reply)}]}]},{status:modelHttp});
};
(async()=>{
 let r=await handle(req(),env,new Headers());assert.equal(r.status,200);const good=await r.json();
 assert.equal(good.code,'9510');assert.equal(good.name,shared.INDUSTRY_ROWS.find(r=>r.code==='9510').name);assert(shared.validateIndustrySuggestion(good));
 assert.equal(calls.length,1);assert.equal(calls[0].body.model,'muse-spark-1.3-contributor');assert.equal(calls[0].body.stream,false);
 for(const row of shared.INDUSTRY_ROWS)assert(calls[0].body.instructions.includes(`${row.code}: ${row.name}`),'Full catalogue remains visible to Muse');
 assert.equal(shared.INDUSTRY_ROWS.length,495);assert.equal(calls[0].body.input.length,1);
 assert.deepEqual(Object.keys(JSON.parse(calls[0].body.input[0].content[0].text)).sort(),['activity','clarifications']);
 assert.equal((await handle(req({...{activity:'x',clarifications:[]},personalId:'secret'}),env,new Headers())).status,400);
 assert.equal((await handle(req({activity:'x',clarifications:['a','b','c','d']}),env,new Headers())).status,400);
 assert.equal((await handle(req({activity:'x'.repeat(1201),clarifications:[]}),env,new Headers())).status,400);
 assert.equal((await handle(req({},'GET'),env,new Headers())).status,405);
 assert.equal((await handle(req(),{},new Headers())).status,503);
 assert.equal((await handle(req(),{...env,MUSE_API_KEY:undefined},new Headers())).status,503,'Never fall back to Jev when Muse is missing');
 limited=true;assert.equal((await handle(req(),env,new Headers())).status,429);limited=false;
 dbError=true;assert.equal((await handle(req(),env,new Headers())).status,503);dbError=false;
 assert.equal(calls.length,1,'Invalid/limited requests must never reach model');
 for(const reason of Object.keys(shared.INDUSTRY_CLARIFICATIONS)){
   reply={status:'clarify',reason};const value=await(await handle(req(),env,new Headers())).json();assert.equal(value.status,'clarify');assert.equal(value.reason,reason);assert(shared.validateIndustrySuggestion(value));
 }
 reply={status:'suggested',code:'9510',confidence:.5};assert.equal((await(await handle(req(),env,new Headers())).json()).status,'clarify');
 reply={status:'suggested',code:'9510',confidence:.95,name:'Invented name'};
 assert.equal((await(await handle(req(),env,new Headers())).json()).name,good.name,'Use canonical label rather than model-generated name');
 for(const bad of [{status:'suggested',code:'888',confidence:.99},{status:'text',code:'9510',confidence:.99},{status:'suggested',code:'9510',confidence:2},{status:'suggested',code:9510,confidence:.99},{status:'clarify',reason:'MADE_UP_REASON'}]){
   reply=bad;assert.equal((await handle(req(),env,new Headers())).status,503);
 }
 reply={status:'suggested',code:'9510',confidence:.95};
 rawText='```json\n'+JSON.stringify(reply)+'\n```';assert.equal((await(await handle(req(),env,new Headers())).json()).code,'9510');
 rawText='not JSON';assert.equal((await handle(req(),env,new Headers())).status,503);rawText=null;
 modelStatus='incomplete';assert.equal((await handle(req(),env,new Headers())).status,503);modelStatus='completed';
 modelHttp=429;assert.equal((await handle(req(),env,new Headers())).status,503);modelHttp=200;
 throwModel=true;assert.equal((await handle(req(),env,new Headers())).status,503);throwModel=false;
 reply={status:'suggested',code:'0111',confidence:.96};
 const rice=await(await handle(req({activity:'Tôi có nhiều hoạt động nông nghiệp và mua bán',clarifications:['trồng lúa'],clarificationReasons:['CLARIFY_MAIN']}),env,new Headers())).json();
 assert.equal(rice.code,'0111');assert.equal(rice.name,'Trồng lúa');
 const dialogue=calls.at(-1).body.input;
 assert.deepEqual(dialogue.map(t=>t.role),['user','assistant','user']);
 assert.equal(dialogue[1].content[0].text,shared.INDUSTRY_CLARIFICATIONS.CLARIFY_MAIN);
 assert.equal(dialogue[2].content[0].text,'trồng lúa','Latest answer must be replayed as a user response, not buried in initial description');
 assert.equal((await handle(req({activity:'x',clarifications:['y'],clarificationReasons:[]}),env,new Headers())).status,400);
 assert.equal((await handle(req({activity:'x',clarifications:['y'],clarificationReasons:['INJECTED_QUESTION']}),env,new Headers())).status,400);
 reply={status:'suggested',industries:[{code:'0111',confidence:.97},{code:'4790',confidence:.91}]};
 const multiple=await(await handle(req({activity:'Trồng lúa và tiếp thị liên kết',clarifications:[]}),env,new Headers())).json();
 assert.deepEqual(multiple.industries.map(item=>item.code),['0111','4790']);assert(shared.validateIndustrySuggestion(multiple));
 assert(!shared.validateIndustrySuggestion({...multiple,industries:[multiple.industries[0],{...multiple.industries[1],name:'invented'}]}));
 assert(!shared.validateIndustrySuggestion({...multiple,industries:[multiple.industries[0],{code:'9999',name:'invented',confidence:.9}]}));
 reply={status:'suggested',industries:[{code:'0111',confidence:.97},{code:'0111',confidence:.95}]};
 assert.equal((await(await handle(req(),env,new Headers())).json()).industries.length,1,'Deduplicate identical catalogue codes');
 reply={status:'suggested',industries:[]};assert.equal((await handle(req(),env,new Headers())).status,503);
 assert(!shared.validateIndustrySuggestion({...good,name:'Invented label'}));assert(!shared.validateIndustrySuggestion({...good,version:'old'}));
 const controller=new AbortController();let outbound;
 global.fetch=async(_,init)=>{outbound=JSON.parse(init.body);return Response.json(good);};
 await client.suggestIndustry('Sửa máy tính',[],controller.signal);assert.deepEqual(outbound,{activity:'Sửa máy tính',clarifications:[]});
 global.fetch=async()=>Response.json({...good,name:'wrong'});await assert.rejects(()=>client.suggestIndustry('x',[],controller.signal));
 // A late reply from an earlier description must not overwrite a newer one.
 let pending=[];global.fetch=(_,init)=>new Promise(resolve=>pending.push({resolve,signal:init.signal}));
 const gate=client.createIndustryRequest(),applied=[];
 const first=gate.run('old',[],x=>applied.push(['old',x]));
 const second=gate.run('new',[],x=>applied.push(['new',x]));assert(pending[0].signal.aborted);
 pending[1].resolve(Response.json(good));await second;pending[0].resolve(Response.json(good));await first;assert.deepEqual(applied.map(x=>x[0]),['new']);
 const third=gate.run('cancel',[],()=>applied.push(['cancel']));gate.cancel();pending[2].resolve(Response.json(good));await third;assert.equal(applied.length,1);
 const old={answers:{kind:'individual',channel:'online',activity:'old',industry:'9510'},confirmed:['kind','channel','activity','industry','details'],current:0};
 old.current=model.questions(old.answers).findIndex(q=>q.id==='activity');
 const changed=model.answerQuestion(old,'new');assert.equal(changed.answers.industry,undefined);assert(!changed.confirmed.includes('industry'));assert.equal(model.questions(changed.answers)[changed.current].id,'industry');
 const ui=fs.readFileSync('src/features/registration/RegistrationWizard.tsx','utf8');assert(ui.includes('Đúng hoạt động của tôi, xác nhận'));assert(ui.includes("confirmed: s.confirmed.filter(id => id !== 'industry')"));
 // Exercise actual component handlers: submit activity -> prefill -> explicit confirm.
 const React=require('react');let hooks=[],cursor=0,callback,requestCount=0,lastFollowups,lastReasons;
 const initial={answers:{kind:'individual',channel:'online',scope:'new',identityScope:'yes',province:'Hà Nội',commune:'Phường mẫu',fixed:'yes'},confirmed:['kind','channel','scope','identityScope','province','commune','fixed'],current:0};
 initial.current=model.questions(initial.answers).findIndex(q=>q.id==='activity');hooks[0]=initial;hooks[1]='Tôi sửa máy tính cho khách';
 const ReactShim={...React,useState(init){const slot=cursor++;if(!(slot in hooks))hooks[slot]=typeof init==='function'?init():init;return [hooks[slot],next=>{hooks[slot]=typeof next==='function'?next(hooks[slot]):next;}];},useRef(){const slot=cursor++;return hooks[slot]??=( {current:null} );},useEffect(){}};
 const deps={react:ReactShim,'lucide-react':new Proxy({},{get:()=>()=>null}),'./PortalMockup':{default:()=>null},'./TaxOnlineGuide':{default:()=>null},'./TaxAppGuide':{default:()=>null},'./data/taxOnlineSteps':load('src/features/registration/data/taxOnlineSteps.ts'),'./wizardModel':model,'./registrationWizard.css':{},'./industrySuggestion':{createIndustryRequest:()=>({cancel(){},run(activity,followups,apply,reasons){requestCount++;assert.equal(activity,hooks[0].answers.activity);callback=apply;lastFollowups=followups;lastReasons=reasons;}})}};
 const m={exports:{}};new Function('require','module','exports',ts.transpileModule(ui,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(id=>Object.hasOwn(deps,id)?deps[id]:require(id),m,m.exports);
 const render=()=>{cursor=0;return m.exports.default({});};
 function nodes(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(nodes)];}
 let tree=render();nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.equal(requestCount,1);assert.equal(model.questions(hooks[0].answers)[hooks[0].current].id,'industry');assert(!hooks[0].confirmed.includes('industry'));
 callback(good);assert.equal(hooks[0].answers.industry,'9510');assert(!hooks[0].confirmed.includes('industry'),'Prefill never confirms on behalf of user');
 tree=render();const confirm=nodes(tree).find(n=>n.type==='button'&&n.props.children==='Đúng hoạt động của tôi, xác nhận');assert(confirm);confirm.props.onClick();
 assert(hooks[0].confirmed.includes('industry'));assert.notEqual(model.questions(hooks[0].answers)[hooks[0].current].id,'industry');assert.equal(requestCount,1,'Rendering and confirmation do not call model again');
 hooks[0]={...hooks[0],current:model.questions(hooks[0].answers).findIndex(q=>q.id==='industry')};
 callback({status:'clarify',reason:'UNSUPPORTED_PROPERTY_RENTAL',question:shared.INDUSTRY_CLARIFICATIONS.UNSUPPORTED_PROPERTY_RENTAL,version:shared.INDUSTRY_VERSION});
 tree=render();assert(!nodes(tree).some(n=>n.type==='form'),'Rental notice must not trigger more questions');
 assert(nodes(tree).some(n=>n.type==='a'&&n.props.href==='https://dichvucong.gdt.gov.vn/tthc/homelogin'&&n.props.target==='_blank'),'Rental notice offers official tax portal');
 assert(!nodes(tree).some(n=>n.type==='button'&&n.props.children==='Đúng hoạt động của tôi, xác nhận'),'Do not offer a code after unsupported rental result');
 callback({status:'clarify',reason:'CLARIFY_MAIN',question:shared.INDUSTRY_CLARIFICATIONS.CLARIFY_MAIN,version:shared.INDUSTRY_VERSION});
 tree=render();nodes(tree).find(n=>n.type==='textarea'&&n.props.id==='rw-clarification').props.onChange({target:{value:'trồng lúa'}});
 tree=render();nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.deepEqual(lastFollowups,['trồng lúa']);assert.deepEqual(lastReasons,['CLARIFY_MAIN']);
 callback(rice);tree=render();assert.equal(hooks[0].answers.industry,'0111');
 const riceConfirm=nodes(tree).find(n=>n.type==='button'&&n.props.children==='Đúng hoạt động của tôi, xác nhận');assert(riceConfirm);riceConfirm.props.onClick();
 assert.equal(model.questions(hooks[0].answers)[hooks[0].current].id,'finish');
 hooks[0]={...hooks[0],current:model.questions(hooks[0].answers).findIndex(q=>q.id==='industry')};
 callback(multiple);tree=render();assert.deepEqual(JSON.parse(hooks[0].answers.industryCodes),['0111','4790']);
 const confirmMultiple=nodes(tree).find(n=>n.type==='button'&&n.props.children==='Xác nhận các mã ngành này');assert(confirmMultiple);confirmMultiple.props.onClick();
 assert.equal(model.questions(hooks[0].answers)[hooks[0].current].id,'finish');assert.deepEqual(model.selectedIndustryRows(hooks[0].answers).map(r=>r.code),['0111','4790']);
 const changedMultiple=model.answerQuestion({...hooks[0],current:model.questions(hooks[0].answers).findIndex(q=>q.id==='activity')},'Mô tả mới');assert.equal(changedMultiple.answers.industryCodes,undefined);
 console.log('PASS: Muse Responses only, full 495-code catalogue, no Jev fallback; clarification/rental/low-confidence; completed JSON and fenced JSON; invalid output/timeout/429; privacy and rate limits; stale/cancelled replies; explicit confirmation. Live API calls: 0.');
})().finally(()=>{global.fetch=original;}).catch(e=>{console.error(e);process.exitCode=1;});
