const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
function load(file,deps={}){
  let source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  source=source.replace(/^const API_BASE = .*;$/m,"const API_BASE = ''; ");
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;
  const m={exports:{}};
  new Function('require','module','exports',code)(id=>{
    if(!(id in deps)){if(id==='../../shared/conversationHistory')return load('shared/conversationHistory.ts');throw new Error(`Unexpected test dependency ${id}`);}return deps[id];
  },m,m.exports);return m.exports;
}
const parser=load('src/services/museBridge.ts',{'./guard':{}});
const {parseTaxResponse}=parser;
const condition='Khoản 1 Điều 6: chỉ tính khoản chi thực tế liên quan kinh doanh và đủ hồ sơ.';
const body=`Bạn cần kiểm tra chi phí.\n${condition}\nKhông tự lấy số dư ngân hàng làm thu nhập tính thuế.`;
for(const text of [body,'Điều 7: cần giữ nguyên điều kiện.\nNghị định áp dụng theo kỳ được hỏi.',
  'Căn cứ vào hồ sơ, chưa thể chốt số thuế.\nCần đối soát chứng từ.',
  'Nội dung có dấu phân cách --- và BẮT BUỘC giữ điều kiện: không được bỏ đoạn trước.']){
  assert.equal(parseTaxResponse(text).answer,text);assert.equal(parseTaxResponse(text).legalBasis,'');
}
for(const heading of ['Căn cứ pháp lý:','## Cơ sở pháp lý','**Căn cứ pháp lý:**','Văn bản áp dụng:']){
  const parsed=parseTaxResponse(`${body}\n\n${heading}\nĐiều 7 — chỉ áp dụng khi đủ điều kiện.`);
  assert.equal(parsed.answer,body);assert.match(parsed.legalBasis,/chỉ áp dụng khi đủ điều kiện/);
}
assert.equal(parseTaxResponse('Kết luận.\nCăn cứ pháp lý: Điều 7.').legalBasis,'Điều 7.');

const progressLabels=load('shared/chatProgress.ts');
const api=load('src/services/api.ts',{'./firebase':{auth:{currentUser:null}},'../../shared/chatProgress':progressLabels}).CloudflareApi;
const event=value=>'data: '+(typeof value==='string'?value:JSON.stringify(value))+'\n\n';
const originalFetch=global.fetch;
async function readStream(text,chunkSizes){
  const bytes=new TextEncoder().encode(text),deltas=[],progress=[];
  let offset=0,index=0,cancelled=false;
  global.fetch=async()=>new Response(new ReadableStream({
    pull(controller){
      if(offset>=bytes.length){controller.close();return;}
      const count=chunkSizes?.[index++%chunkSizes.length]||bytes.length;
      controller.enqueue(bytes.slice(offset,offset+count));offset+=count;
    },cancel(){cancelled=true;},
  }),{headers:{'Content-Type':'text/event-stream'}});
  try{
    const result=await api.askTaxAIStream('Câu hỏi',undefined,undefined,[],d=>deltas.push(d),undefined,undefined,undefined,p=>progress.push(p));
    return{...result,deltas:deltas.join(''),progress,cancelled};
  }finally{global.fetch=originalFetch;}
}
// Minimal hook/element harness drives the actual component event handlers.
// No DOM layout, effects, real React renderer, authentication or API is claimed.
function componentHarness(file,name,props,service){
  const slots=[];let cursor=0,tree;
  const react={
    createElement(type,attrs,...children){return{type,props:{...attrs,children}};},
    useState(initial){const key=cursor++;if(!(key in slots))slots[key]=typeof initial==='function'?initial():initial;
      return[slots[key],value=>{slots[key]=typeof value==='function'?value(slots[key]):value;}];},
    useRef(initial){const key=cursor++;if(!(key in slots))slots[key]={current:initial};return slots[key];},
    useEffect(){},
  };
  const auth={user:{phone:'offline-test',uid:'offline-uid',credits:10},isAuthenticated:true,
    consumeCredit:()=>true,openDepositModal(){},openAuthModal(){},syncCredits(){}};
  const deps={react:{default:react,...react},'framer-motion':{motion:new Proxy({},{get:(_,key)=>`motion.${String(key)}`}),AnimatePresence:'presence',
    useMotionValue:()=>0,useSpring:()=>0,useTransform:()=>0},
    'lucide-react':new Proxy({},{get:()=> 'icon'}),
    '../services/api':{CloudflareApi:service},'../services/museBridge':parser,
    '../features/registration/data/taxRegistration':load('shared/taxRegistrationWorkflow.ts'),
    '../context/AuthContext':{useAuth:()=>auth},'./RetrievalTrace':{RetrievalTrace:'retrieval-trace'},
    './AnswerProgress':{AnswerProgress:'answer-progress',appendProgress:(steps,p)=>steps.some(s=>s.stage===p.stage)?steps:[...steps,p]},
    '../services/conversation':load('src/services/conversation.ts')};
  const Component=load(file,deps)[name];
  const visit=(node,predicate)=>{
    if(Array.isArray(node)){for(const child of node){const found=visit(child,predicate);if(found)return found;}return;}
    if(!node||typeof node!=='object')return;
    if(predicate(node))return node;return visit(node.props?.children,predicate);
  };
  const texts=node=>Array.isArray(node)?node.map(texts).join(' '):node&&typeof node==='object'?texts(node.props?.children):String(node??'');
  const render=()=>{cursor=0;tree=Component(props);return tree;};render();
  return{render,text:()=>texts(tree),find:predicate=>visit(tree,predicate),slots};
}
async function componentCase(kind,mode){
  const store=new Map();
  const savedStorage=global.localStorage;
  global.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};
  const canonical=`${body}\n\nCăn cứ pháp lý:\nĐiều 7 — điều kiện pháp lý phải được giữ khi hỏi tiếp.`;
  let continued;
  const service={askTaxAIStream:async(_q,_phone,_file,_history,onDelta,onMeta)=>{
    onMeta?.({source:'Nguồn kiểm thử hoàn tất',citations:['Điều 7']});
    if(mode!=='done_only')onDelta('Nội dung tạm chưa đầy đủ.');
    return mode==='interrupted'?{success:false,response:'',error:'Luồng bị ngắt.'}:{success:true,response:canonical,source:'Nguồn kiểm thử hoàn tất'};
  }};
  try{
    const isHero=kind==='Hero';
    const h=componentHarness(isHero?'src/components/Hero.tsx':'src/components/AIChatModal.tsx',kind,
      isHero?{onOpenConsultation(){},onContinueAIChat:(question,response)=>{continued={question,response};}}:{isOpen:true,onClose(){}},service);
    const input=h.find(n=>n.type===(isHero?'textarea':'input'));
    input.props.onChange({target:{value:'Câu hỏi kiểm thử'}});h.render();
    await h.find(n=>n.type==='form'||n.type==='motion.form').props.onSubmit({preventDefault(){}});
    await Promise.resolve();await Promise.resolve();h.render();
    if(mode==='interrupted'){
      if(isHero)assert.equal(h.find(n=>n.type==='button'&&String(n.props.children).includes('Hỏi tiếp')),undefined);
      else{
        const messages=h.slots.find(s=>Array.isArray(s)&&s.some(m=>m.sender==='user'));
        assert.ok(messages.filter(m=>m.sender==='ai'&&m.id!=='m1').every(m=>!m.contextual));
        assert.match(h.text(),/gián đoạn/);
      }
      assert.equal(store.size,0,'Partial answer must not be saved as completed history');
    }else{
      assert.ok(h.text().includes(condition),`${kind}: lost substantive condition`);
      assert.ok(h.text().includes('điều kiện pháp lý phải được giữ'),`${kind}: lost legal section content`);
      assert.ok(!h.text().includes('Nội dung tạm chưa đầy đủ'),`${kind}: final response must replace deltas`);
      const saved=JSON.parse(store.get('tax_chat_history_offline-test'));
      assert.equal(saved[0].response,canonical);
      if(isHero){
        const button=h.find(n=>n.type==='button'&&String(n.props.children).includes('Hỏi tiếp'));
        assert.ok(button);button.props.onClick();assert.equal(continued.response,canonical);
      }else{
        const messages=h.slots.find(s=>Array.isArray(s)&&s.some(m=>m.sender==='user'));
        assert.ok(messages.some(m=>m.sender==='ai'&&m.text===canonical&&m.contextual));
      }
    }
  }finally{global.localStorage=savedStorage;}
}
async function componentProgressCase(kind){
  let finish;
  const service={askTaxAIStream:async(_q,_p,_f,_h,_delta,_meta,_status,_summary,notify)=>{
    notify({stage:'classifying'});notify({stage:'retrieving'});
    return new Promise(resolve=>{finish=resolve;});
  }};
  const hero=kind==='Hero';
  const h=componentHarness(hero?'src/components/Hero.tsx':'src/components/AIChatModal.tsx',kind,
    hero?{onOpenConsultation(){},onContinueAIChat(){}}:{isOpen:true,onClose(){}},service);
  h.find(n=>n.type===(hero?'textarea':'input')).props.onChange({target:{value:'Hỏi thủ tục thuế'}});h.render();
  const pending=h.find(n=>n.type==='form'||n.type==='motion.form').props.onSubmit({preventDefault(){}});
  h.render();const progress=h.find(n=>n.type==='answer-progress');
  assert.deepEqual(progress?.props.steps,[{stage:'connecting'},{stage:'classifying'},{stage:'retrieving'}],`${kind}: show progress while answer is pending`);
  finish({success:false,response:'',error:'Luồng bị ngắt.'});await pending;
}
async function main(){
  const beforeGuideFetch=global.fetch;
  try {
    let wire;
    global.fetch=async(url,init)=>{wire={url,body:JSON.parse(init.body)};return new Response(event({type:'done',fullText:'Điền hoạt động thực tế.'})+event('[DONE]'));};
    const context={section:3,text:'III.4 · Ngành nghề kinh doanh'};
    const result=await api.askTaxAIStream('Ô này điền gì?',undefined,undefined,[],()=>{},undefined,undefined,undefined,undefined,'tax_registration',context);
    assert(result.success);assert.equal(wire.url,'/api/registration-guide/chat');assert.deepEqual(wire.body.panelContext,context);assert(!('workflow' in wire.body));
    await api.askTaxAIStream('Hỏi kiến thức thuế',undefined,undefined,[],()=>{});
    assert.equal(wire.url,'/api/chat');assert(!('panelContext' in wire.body));
  } finally {global.fetch=beforeGuideFetch;}
  let registrationRequest;
  const guided=componentHarness('src/components/AIChatModal.tsx','AIChatModal',{isOpen:true,onClose(){},registrationGuide:true,registrationPanelTitle:'Điền tờ khai',getRegistrationContext:()=>({section:3,text:'III.4 · Ngành nghề kinh doanh'})},{askTaxAIStream:async(...args)=>{
    registrationRequest=args;return {success:true,response:'Bạn đang cung cấp dịch vụ cụ thể nào?'};
  }});
  const rawActivity='Tôi sửa máy tính tại nhà khách hàng, chưa đăng ký thuế kinh doanh.';
  guided.find(n=>n.type==='input').props.onChange({target:{value:rawActivity}});guided.render();
  await guided.find(n=>n.type==='form').props.onSubmit({preventDefault(){}});await Promise.resolve();guided.render();
  assert.equal(registrationRequest[0],rawActivity,'Keep actual activity separate from instructions and industry evidence');
  assert.equal(registrationRequest[9],'tax_registration');
  assert.deepEqual(registrationRequest[10],{section:3,text:'III.4 · Ngành nghề kinh doanh'});
  assert(registrationRequest[11] instanceof AbortSignal);
  assert(!guided.find(n=>n.props?.role==='dialog'),'Guide chat must remain inside its page');
  assert.match(guided.text(),/Cùng chuẩn bị hồ sơ/);
  console.log('PASS registration chat: raw user input, explicit workflow, inline output, shared auth/credit/stream client.');
  for(const kind of ['Hero','AIChatModal'])await componentProgressCase(kind);
  const progressResult=await readStream(event({type:'progress',stage:'classifying',thoughts:'must not forward'})+event({type:'progress',stage:'private_thoughts'})+event({type:'done',fullText:'Xong.'}),[1,4]);
  assert.deepEqual(progressResult.progress,[{stage:'connecting'},{stage:'classifying'}]);
  assert.equal(progressResult.response,'Xong.');
  const final='Đáp án đầy đủ, giữ đúng dấu tiếng Việt và điều kiện.';
  const normal=event({type:'meta',source:'Nguồn cuối',remainingCredits:8})+event({type:'delta',delta:'Nội dung tạm.'})+event({type:'done',fullText:final,remainingCredits:7})+event('[DONE]');
  for(const chunks of [[1],[2,5,3],[13,1,8],[65536]]){
    const r=await readStream(normal,chunks);assert.equal(r.success,true);assert.equal(r.response,final);assert.equal(r.remainingCredits,7);assert.equal(r.source,'Nguồn cuối');
  }
  for(const incomplete of [
    event({type:'delta',delta:'Một phần đáp án.'}),
    event({type:'delta',delta:'Một phần đáp án.'})+event('[DONE]'),
    event({type:'delta',delta:'Một phần đáp án.'})+'data: {"type":"done","fullText":"bị cắt',
    event({type:'done'}),event({type:'done',fullText:''}),
    event({type:'delta',delta:'Một phần đáp án.'})+event({type:'error',error:'Lỗi tổng hợp'}),
  ]){const r=await readStream(incomplete,[3,1,9]);assert.equal(r.success,false);assert.equal(r.response,'');assert.ok(r.error);}
  const doneOnly=await readStream(event({type:'done',fullText:final}).trimEnd(),[1,7]);
  assert.equal(doneOnly.success,true);assert.equal(doneOnly.response,final);assert.equal(doneOnly.deltas,'');
  const crlf=await readStream(normal.replace(/\n/g,'\r\n'),[1,2]);assert.equal(crlf.response,final);
  const multiline=await readStream('data: {\n'+'data: "type":"done",\n'+'data: "fullText":"Đáp án hợp lệ."}\n\n',[2]);
  assert.equal(multiline.success,true);assert.equal(multiline.response,'Đáp án hợp lệ.');
  try{
    let pulls=0;
    global.fetch=async()=>new Response(new ReadableStream({pull(controller){
      if(pulls++===0)controller.enqueue(new TextEncoder().encode(event({type:'delta',delta:'Bản nháp chưa hoàn tất.'})));
      else controller.error(new Error('Connection interrupted'));
    }}));
    const interrupted=await api.askTaxAIStream('Câu hỏi',undefined,undefined,[],()=>{});
    assert.equal(interrupted.success,false);assert.equal(interrupted.response,'');
    let cancelled=false;
    global.fetch=async()=>new Response(new ReadableStream({
      start(controller){controller.enqueue(new TextEncoder().encode(normal));},
      cancel(){cancelled=true;},
    }));
    const terminal=await api.askTaxAIStream('Câu hỏi',undefined,undefined,[],()=>{});
    assert.equal(terminal.response,final);assert.equal(cancelled,true,'Final marker must release a still-open connection');
  }finally{global.fetch=originalFetch;}
  for(const entry of ['Hero','AIChatModal'])for(const mode of ['corrected_final','done_only','interrupted'])await componentCase(entry,mode);
  console.log('Chat client regressions passed: conditions retained, raw handoff/history, canonical final UI, strict SSE completion, chunked UTF-8, errors, EOF and both entry points. Real API calls: 0.');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(()=>{global.fetch=originalFetch;});
