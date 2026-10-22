const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(file,deps={}){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(id=>Object.hasOwn(deps,id)?deps[id]:require(id),m,m.exports);return m.exports;}
const data=load('shared/taxRegistrationWorkflow.ts');
const taxOnline=load('src/features/registration/data/taxOnlineSteps.ts');
const model=load('src/features/registration/wizardModel.ts',{'../../../shared/taxRegistrationWorkflow':data,'./data/taxOnlineSteps':taxOnline,'./data/vsic2025.json':{default:JSON.parse(fs.readFileSync('src/features/registration/data/vsic2025.json','utf8'))}});
const industryContext=load('src/features/registration/RegistrationIndustryContext.tsx');
const onlineGuide=load('src/features/registration/TaxOnlineGuide.tsx',{'./RegistrationIndustryContext':industryContext,'./data/taxOnlineSteps':taxOnline,'lucide-react':new Proxy({},{get:()=>()=>React.createElement('svg')})});
const appGuide=load('src/features/registration/TaxAppGuide.tsx',{'./RegistrationIndustryContext':industryContext,'./data/taxOnlineSteps':taxOnline,'lucide-react':new Proxy({},{get:()=>()=>React.createElement('svg')})});
const exporter=load('src/features/registration/registrationExport.ts',{'./wizardModel':model});
const mockup=load('src/features/registration/PortalMockup.tsx',{'lucide-react':new Proxy({},{get:()=>()=>React.createElement('svg')})});
const {strFromU8,unzipSync}=require('fflate');
const safe={kind:'individual',channel:'counter',scope:'new',identityScope:'yes',province:'Hà Nội',commune:'Phường mẫu',fixed:'yes',activity:'Sửa máy tính',industry:'9510',rentalOnly:'no',fullName:'NGUYỄN VĂN A',gender:'Nam',birthDate:'1990-01-02',personalId:'000000000001',street:'ĐỊA CHỈ MẪU KHÔNG CÓ THẬT',startDate:'2026-10-17',businessName:'HỘ KINH DOANH MẪU KIỂM THỬ',capital:'10000000',capitalWords:'Mười triệu đồng',workers:'1',founder:'solo'};
let apiCalls=0;global.fetch=()=>{apiCalls++;throw new Error('No API permitted');};
function run(kind,channel){
 let s=model.initialWizard();let count=0;
 while(count++<60){
   const q=model.questions(s.answers)[s.current];if(q.id==='finish')break;
   if(q.id==='details')s={...s,answers:{...s.answers,...Object.fromEntries(model.detailFields({...safe,kind,channel}).map(f=>[f.id,safe[f.id]||'']))}};
   const value=q.id==='kind'?kind:q.id==='channel'?channel:q.id==='receipt'?'received':q.type==='confirm'?'confirmed':safe[q.id]||'';
   assert.equal(model.validateAnswer(q,value),null,`${kind}/${channel}: ${q.id}`);
   const n=model.answerQuestion(s,value);assert.notDeepEqual(n,s);s=n;
 }
 assert(count<60,'No loops');assert.equal(model.questions(s.answers)[s.current].id,'finish');
 if(!model.isQuickOnlineRegistration(s.answers))assert.equal(model.detailErrors(s.answers).length,0);
 else assert(!Object.hasOwn(s.answers,'personalId'),'Quick online flow never collects identity fields');
 for(const id of model.questions(s.answers).slice(0,-1).map(q=>q.id))assert(s.confirmed.includes(id),id);
 return s;
}
const cases=[];
for(const [kind,channel] of [['household','online'],['household','counter'],['individual','online'],['individual','app']]){
 const s=run(kind,channel);cases.push(s);
 assert.equal(s.answers.kind,kind);assert.equal(s.answers.channel,channel);
 assert.equal(model.questions(s.answers).some(q=>q.id==='receipt'),kind==='household'&&channel==='online');
 // Template generation remains tested separately with explicit synthetic data;
 // quick online conversations no longer ask for these form fields.
 const templateAnswers=model.isQuickOnlineRegistration(s.answers)?{...safe,...s.answers}:s.answers;
 const doc=exporter.fillRegistrationTemplate(new Uint8Array(fs.readFileSync(`public/documents/${kind==='household'?'Template-01-HKD':'Template-03-DKT'}.docx`)),templateAnswers);
 const entries=unzipSync(doc),xml=strFromU8(entries['word/document.xml']);
 assert(xml.includes(safe.personalId));assert(xml.includes(safe.street));assert(xml.includes('NGUYỄN VĂN A'));assert(!xml.includes('{{'));
 assert(xml.includes(kind==='household'?'GIẤY ĐỀ NGHỊ ĐĂNG KÝ HỘ KINH DOANH':'TỜ KHAI ĐĂNG KÝ THUẾ'));
 assert(!xml.includes(kind==='household'?'ĐĂNG KÝ THAY ĐỔI NỘI DUNG ĐĂNG KÝ HỘ KINH DOANH':'HỘ KINH DOANH MẪU KIỂM THỬ|||'));
 if(channel==='counter'||(kind==='individual'&&channel==='online'))fs.writeFileSync(`outputs/registration-wizard/qa-${kind}.docx`,doc);
 const htmlTemplate=fs.readFileSync(`public/documents/${kind==='household'?'Template-01-HKD':'Template-03-DKT'}.html`,'utf8');
 const html=exporter.fillRegistrationHtml(htmlTemplate,templateAnswers);
 assert(!html.includes('{{'));assert(html.includes(safe.personalId));assert(html.includes('size:A4'));assert(!/src="(?!data:)/.test(html));
 assert(!/<img\b/i.test(html),'Legacy VML shapes must not become black rectangles on HTML print');
 if(channel==='counter'||(kind==='individual'&&channel==='online'))fs.writeFileSync(`outputs/registration-wizard/qa-${kind}.html`,html);
}
assert.equal(apiCalls,0,'Deterministic wizard state and document generation do not call APIs');
assert.equal(taxOnline.TAX_ONLINE_STEPS.length,17);
assert.equal(new Set(taxOnline.TAX_ONLINE_STEPS.map(s=>s.id)).size,17);
for(let i=1;i<=17;i++)assert(fs.statSync(`public${taxOnline.TAX_ONLINE_MEDIA}/scene_${String(i).padStart(2,'0')}.png`).size>1000);
assert.match(fs.readFileSync(`public${taxOnline.TAX_ONLINE_GIF}`).subarray(0,6).toString(),/^GIF8[79]a$/);
assert.deepEqual(model.questions({...safe,channel:'online'}).map(q=>q.id),['kind','channel','activity','industry','finish']);
assert.equal(taxOnline.taxOnlineStepIndex('portalOtp'),15);
assert.equal(taxOnline.TAX_APP_STEPS.length,11);
assert.equal(new Set(taxOnline.TAX_APP_STEPS.map(s=>s.id)).size,11);
for(const step of taxOnline.TAX_APP_STEPS)assert(fs.statSync(`public${taxOnline.TAX_APP_MEDIA}/${step.file}`).size>1000);
assert.deepEqual(model.questions({...safe,channel:'app'}).map(q=>q.id),['kind','channel','activity','industry','finish']);
assert.equal(taxOnline.taxAppStepIndex('appSubmit'),10);
assert.notEqual(model.validateAnswer({id:'channel',options:model.questions({kind:'individual'}).find(q=>q.id==='channel').options},'counter'),null,'Direct counter submission is removed for individual');
assert.equal(model.searchIndustries('sua chua may tinh')[0].code,'9510');
assert.equal(model.searchIndustries('9510')[0].code,'9510');
assert.equal(model.searchIndustries('quang cao')[0].code,'7310');
assert.equal(model.INDUSTRY_CATALOG.rows.length,495);
for(const [code,,name] of data.INDUSTRY_REFERENCE)assert.equal(model.INDUSTRY_CATALOG.rows.find(row=>row.code===code).name,name,'Official catalogue matches independently read appendix');
assert.equal(model.searchIndustries('affiliate').length,0,'Do not guess a code from platform activity label');
assert.equal(model.validateAnswer({id:'industry',type:'industry'},'888')!==null,true);
assert.equal(model.validateAnswer({id:'kind',options:[{value:'household'}]},'other')!==null,true);
const kindOptions=model.questions({}).find(q=>q.id==='kind').options;
assert.equal(kindOptions.find(o=>o.value==='household').locked,true);
assert.equal(kindOptions.find(o=>o.value==='household').badge,'Sắp ra mắt');
assert.equal(model.detailErrors({...safe,personalId:'123'}).some(x=>x.includes('12 chữ số')),true);
assert.equal(model.detailErrors({...safe,noticeStreet:'x'}).some(x=>x.includes('Địa chỉ nhận')),true);
assert.equal(model.detailErrors({...safe,personalAccount:'x'}).some(x=>x.includes('tài khoản')),true);
assert.equal(model.detailErrors({...safe,birthDate:'2026-02-31'}).some(x=>x.includes('Ngày không')),true);
const malicious={...safe,fullName:'A <w:r> & " B'};
const escaped=strFromU8(unzipSync(exporter.fillRegistrationTemplate(new Uint8Array(fs.readFileSync('public/documents/Template-03-DKT.docx')),malicious))['word/document.xml']);
assert(escaped.includes('&lt;W:R&gt; &amp; &quot;'));assert(!escaped.includes('A <W:R>'));
assert.throws(()=>exporter.fillRegistrationTemplate(new Uint8Array(fs.readFileSync('public/documents/Template-03-DKT.docx')),{...safe,scope:'existing'}));
for(const count of [2,10]){
 const family={...safe,kind:'household',founder:'family',memberCount:String(count)};
 for(let i=1;i<count;i++){family[`member${i}Name`]=`THÀNH VIÊN MẪU ${i+1}`;family[`member${i}BirthDate`]='1990-01-02';family[`member${i}Id`]=String(i+1).padStart(12,'0');family[`member${i}Gender`]='Nữ';}
 assert.equal(model.detailErrors(family).length,0);
 const doc=exporter.fillRegistrationTemplate(new Uint8Array(fs.readFileSync('public/documents/Template-01-HKD.docx')),family);
 const xml=strFromU8(unzipSync(doc)['word/document.xml']);assert(xml.includes(String(count).padStart(12,'0')));assert(!xml.includes('{{member'));
 const html=exporter.fillRegistrationHtml(fs.readFileSync('public/documents/Template-01-HKD.html','utf8'),family);assert(html.includes(String(count).padStart(12,'0')));assert(html.includes('Phiếu chuẩn bị đi nộp'));
 if(count===2){fs.writeFileSync('outputs/registration-wizard/qa-family.docx',doc);fs.writeFileSync('outputs/registration-wizard/qa-family.html',html);}
 assert(model.detailErrors({...family,member1Id:family.personalId}).some(x=>x.includes('trùng')));
}
let back={...cases[0],current:1};const changed=model.answerQuestion(back,'counter');
assert.equal(changed.answers.fullName,safe.fullName);assert.equal(changed.answers.industry,'9510');assert(!changed.confirmed.includes('details'));assert(!changed.confirmed.includes('receipt'));assert(!model.questions(changed.answers).some(q=>q.id==='receipt'));
assert.equal(model.questions({...safe,scope:'existing'}).at(-1).id,'existingHelp');
assert.equal(model.questions({...safe,identityScope:'no'}).at(-1).id,'specialHelp');
const uiSource=fs.readFileSync('src/features/registration/RegistrationWizard.tsx','utf8');
// Both channels and fullscreen guidance must reuse only explicitly confirmed
// values. These checks verify coverage/data flow, not a legal exemption classifier.
const selectedGuideIndustries=[{code:'0111',name:'Trồng lúa'},{code:'4790',name:'Hoạt động dịch vụ trung gian bán lẻ'}];
for(const [Guide,steps] of [[onlineGuide.default,['portalEligibility','portalBusiness']],[appGuide.default,['appEligibilityScope','appSubmit']]]){
 for(const step of steps){
  const html=renderToStaticMarkup(React.createElement(Guide,{step,industries:selectedGuideIndustries,industryConfirmed:true}));
  for(const industry of selectedGuideIndustries){assert(html.includes(industry.code));assert(html.includes(industry.name));}
  if(step.includes('Eligibility')){assert(html.includes('Gợi ý chọn nhóm 2'));assert(html.includes('bắt buộc đăng ký hộ kinh doanh hoặc doanh nghiệp'));assert(html.includes('chưa xác nhận bạn được miễn đăng ký hộ chỉ từ mã ngành'));assert(!html.includes('<strong>Nhóm 1:</strong>'));}
  else assert(html.includes('không tự thêm số 0 hay tiền tố'));
  const unconfirmed=renderToStaticMarkup(React.createElement(Guide,{step,industries:[{code:'9999',name:'UNCONFIRMED_SENTINEL'}],industryConfirmed:false}));
  assert(!unconfirmed.includes('UNCONFIRMED_SENTINEL'));
 }
}
assert(!/localStorage|sessionStorage|CloudflareApi|askTaxAIStream/.test(uiSource),'Personal form data must remain in memory, separate from tax chat');
for(const s of [model.initialWizard(),...cases,...cases.filter(state=>!model.isQuickOnlineRegistration(state.answers)).map(state=>({...state,current:model.questions(state.answers).findIndex(q=>q.id==='details')}))]){
 let hook=0;
 const deps={react:{...React,useState:initial=>hook++===0?[s,()=>{}]:[typeof initial==='function'?initial():initial,()=>{}],useRef:()=>({current:null}),useEffect:()=>{}},'lucide-react':new Proxy({},{get:()=>()=>React.createElement('svg')}),'./industrySuggestion':{createIndustryRequest:()=>({cancel(){},run(){throw Error('SSR must not call model');}})},'./wizardModel':model,'./PortalMockup':mockup,'./TaxOnlineGuide':onlineGuide,'./TaxAppGuide':appGuide,'./data/taxOnlineSteps':taxOnline,'./registrationWizard.css':{}};
 const page=load('src/features/registration/RegistrationWizard.tsx',deps).default;
 const html=renderToStaticMarkup(React.createElement(page,{}));
 assert(html.includes('Hội thoại đăng ký'));assert(!html.includes('Bước hiện tại'));assert(!html.includes('rw-guide'));
 if(s.current===0&&!s.answers.kind)assert(html.includes('Sắp ra mắt'),'Household option must display Sắp ra mắt badge');
 if(model.isQuickOnlineRegistration(s.answers)&&model.questions(s.answers)[s.current].id==='finish'){assert(html.includes('https://dichvucong.gdt.gov.vn/tthc/homelogin'));assert(html.includes('Dịch Vụ Công Thuế Nhà Nước'));assert(html.includes('target="_blank"'));assert(html.includes('9510'));assert(!html.includes('detail-personalId'));assert(!html.includes('Đã hoàn thành các bước hướng dẫn'));}
 if(model.questions(s.answers)[s.current].id==='details')assert(html.includes('id="detail-personalId"'),'Form must remain available inside the conversation');
 assert.equal(html.includes('Hình ảnh cổng trực tuyến'),s.answers.channel==='online'||s.answers.channel==='app');
 if(s.answers.channel==='online'&&s.answers.kind==='household')assert(html.includes('Không phải screenshot cổng thực tế'));
 if(s.answers.channel==='online'&&s.answers.kind==='individual'){assert(html.includes('scene_01.png'));assert(html.includes('Xem GIF toàn bộ 17 bước'));assert(!html.includes('<img src="'+taxOnline.TAX_ONLINE_GIF),'GIF is loaded on demand');}
 if(s.answers.channel==='app'&&s.answers.kind==='individual'){assert(html.includes('eTax Mobile'));assert(html.includes('TỔNG CỤC THUẾ'));}
}
// Companion guide ("ĐI CÙNG MÀN HÌNH") only appears AFTER industry code is confirmed
for(const channel of ['online','app']){
 for(const currentStep of [2, 3]){ // activity (2) and industry (3)
  const beforeConfirm = { answers: { kind: 'individual', channel, activity: 'Sửa máy tính', ...(currentStep===3?{industry:'9510'}:{}) }, current: currentStep, confirmed: currentStep===3?['kind','channel','activity']:['kind','channel'] };
  let hook=0;
  const deps={react:{...React,useState:initial=>hook++===0?[beforeConfirm,()=>{}]:[typeof initial==='function'?initial():initial,()=>{}],useRef:()=>({current:null}),useEffect:()=>{}},'lucide-react':new Proxy({},{get:()=>()=>React.createElement('svg')}),'./industrySuggestion':{createIndustryRequest:()=>({cancel(){},run(){}})},'./wizardModel':model,'./PortalMockup':mockup,'./TaxOnlineGuide':onlineGuide,'./TaxAppGuide':appGuide,'./data/taxOnlineSteps':taxOnline,'./registrationWizard.css':{}};
  const page=load('src/features/registration/RegistrationWizard.tsx',deps).default;
  const html=renderToStaticMarkup(React.createElement(page,{}));
  assert(!html.includes('Hình ảnh cổng trực tuyến'), `Companion guide must NOT show at step ${currentStep} before industry confirmation (${channel})`);
  assert(!html.includes('ĐI CÙNG MÀN HÌNH'), `Companion banner must NOT show at step ${currentStep} before industry confirmation (${channel})`);
  assert(!html.includes('rw-images'), `rw-images column must NOT render at step ${currentStep} before industry confirmation (${channel})`);
 }
}
console.log('PASS: four journeys (household online/counter, individual online/app), direct counter removed for individual, zero API calls, return/edit invalidation, preserved fields, unsupported paths, catalogue lookup, required data validation, official template mapping, XML escaping, responsive panel render, companion guide only shown after industry confirmation.');
