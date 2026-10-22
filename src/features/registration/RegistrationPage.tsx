import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCheck, ChevronDown, ExternalLink, FileText, HelpCircle, ListChecks, MessageCircle, RotateCcw, ShieldCheck, Sparkles, Store, Users } from 'lucide-react';
import { PdfViewerModal } from '../../components/PdfViewerModal';
import { buildRegistrationGuide, GUIDE_STORAGE_KEY, readGuideSaved, type GuideProfile, type GuideSaved, type RegistrationGoal } from './data/smartGuide';

interface Props { onOpenAIChat?:(query:string)=>void; onOpenConsultation?:()=>void }
const defaultProfile:GuideProfile={goal:'new',founder:'self',submission:'online'};
function loadSaved(){try{return readGuideSaved(localStorage.getItem(GUIDE_STORAGE_KEY));}catch{return null;}}
const primary='inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700';

export default function RegistrationPage({onOpenAIChat,onOpenConsultation}:Props){
  const [saved]=useState(loadSaved);
  const [profile,setProfile]=useState<GuideProfile>(saved?.profile||defaultProfile);
  const [screen,setScreen]=useState<'questions'|'guide'>(saved?'guide':'questions');
  const [question,setQuestion]=useState(0);
  const [checked,setChecked]=useState<string[]>(saved?.checked||[]);
  const [activeId,setActiveId]=useState(saved?.activeStep||'');
  const [docId,setDocId]=useState<string|null>(null);
  const [situation,setSituation]=useState(''),[area,setArea]=useState('');
  const [saveUnavailable,setSaveUnavailable]=useState(false);
  const cardRef=useRef<HTMLElement>(null),headingRef=useRef<HTMLHeadingElement>(null);
  const steps=buildRegistrationGuide(profile);
  const activeIndex=Math.max(0,steps.findIndex(step=>step.id===activeId)),current=steps[activeIndex];
  const isDone=(id:string)=>{const step=steps.find(s=>s.id===id);return !!step&&step.tasks.every(t=>checked.includes(t.id));};
  const completed=steps.filter(step=>isDone(step.id)).length,allDone=steps.length>0&&completed===steps.length;
  useEffect(()=>{
    if(screen!=='guide')return;
    const value:GuideSaved={version:2,profile,checked,activeStep:current?.id||''};
    try{localStorage.setItem(GUIDE_STORAGE_KEY,JSON.stringify(value));setSaveUnavailable(false);}catch{setSaveUnavailable(true);}
  },[screen,profile,checked,current?.id]);
  const openStep=(id:string)=>{setActiveId(id);requestAnimationFrame(()=>{cardRef.current?.scrollIntoView({behavior:'smooth',block:'start'});headingRef.current?.focus({preventScroll:true});});};
  const chooseGoal=(goal:RegistrationGoal)=>{setProfile(p=>({...p,goal}));if(goal==='new')setQuestion(1);else{setChecked([]);setActiveId('');setScreen('guide');}};
  const begin=()=>{const plan=buildRegistrationGuide(profile),allowed=new Set(plan.flatMap(s=>s.tasks.map(t=>t.id)));setChecked(p=>p.filter(id=>allowed.has(id)));setActiveId(plan[0]?.id||'');setScreen('guide');};
  const edit=()=>{setQuestion(0);setScreen('questions');};
  const ask=()=>onOpenAIChat?.(`Tôi đang dùng hướng dẫn đăng ký hộ kinh doanh. ${profile.goal==='existing'?'Tôi đã có hộ.':profile.goal==='new'?`Tôi muốn đăng ký hộ do ${profile.founder==='self'?'một cá nhân':'các thành viên hộ gia đình'} thành lập, dự định ${profile.submission==='online'?'nộp trực tuyến':profile.submission==='counter'?'nộp tại bộ phận tiếp nhận':'chưa chọn cách nộp'}.`:'Tôi chưa rõ hoạt động của mình cần đăng ký hộ hay đăng ký thuế.'} ${area.trim()?`Địa phương: ${area.trim()}.`:''} ${situation.trim()?`Hoạt động: ${situation.trim()}.`:''} ${current?`Tôi đang ở bước “${current.title}”. Cần lưu ý gì để làm đúng?`:'Hãy xác định những dữ kiện còn thiếu trước khi kết luận tôi cần đăng ký gì; không suy miễn đăng ký chỉ vì doanh thu thấp hoặc bán online.'} Trả lời ngắn theo quy định hiện hành, phân biệt đăng ký hộ với đăng ký thuế.`);

  return <div className="min-h-screen bg-[#f5f8f7] pb-24 pt-20 sm:pt-28">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <a href="#" className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm text-slate-500 hover:text-emerald-700"><ArrowLeft size={15}/> Trang chủ</a>
      <header className="mb-7 flex items-start justify-between gap-4 sm:mb-10">
        <div><p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700"><Store size={15}/> Bắt đầu kinh doanh</p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">Đăng ký hộ kinh doanh,<br/><span className="text-emerald-700">từng việc một.</span></h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">Chọn tình huống của bạn. Nhận lộ trình rõ ràng và chỉ chuẩn bị những gì cần thiết.</p></div>
        <div className="hidden rounded-2xl border border-emerald-100 bg-white p-5 text-emerald-600 sm:block"><ListChecks size={35} strokeWidth={1.5}/></div>
      </header>

      {screen==='questions'?<section aria-label="Tìm lộ trình đăng ký" className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">
        <div className="mb-6 flex justify-between gap-3 text-xs"><span className="font-semibold text-emerald-700">{question===0?'Bắt đầu từ tình huống của bạn':`Câu ${question+1} / 3`}</span><span className="text-slate-400">Không cần đăng nhập</span></div>
        <div className="mb-7 flex gap-1.5" aria-hidden="true">{[0,1,2].map(i=><span key={i} className={`h-1 flex-1 rounded-full ${i<=question?'bg-emerald-500':'bg-slate-100'}`}/>)}</div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{question===0?'Bạn đang cần làm gì?':question===1?'Ai sẽ thành lập hộ kinh doanh?':'Bạn muốn nộp hồ sơ bằng cách nào?'}</h2>
        <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">{question===0?'Không cần biết trước tên thủ tục hay mã số hồ sơ.':question===1?'Thông tin này giúp chọn đúng giấy tờ, tránh chuẩn bị thừa.':'Bạn có thể thay đổi sau. Cách tiếp nhận cụ thể theo địa phương.'}</p>
        <div className="space-y-3">
          {question===0&&<>
            <Choice title="Tôi muốn đăng ký hộ mới" description="Chuẩn bị hồ sơ và theo dõi từ đầu đến khi nhận kết quả." icon={<Store size={20}/>} onClick={()=>chooseGoal('new')}/>
            <Choice title="Tôi đã có hộ kinh doanh" description="Kiểm tra thông tin thuế và những việc cần làm tiếp." icon={<CheckCheck size={20}/>} onClick={()=>chooseGoal('existing')}/>
            <Choice title="Tôi chưa biết có cần đăng ký hộ không" description="Làm rõ trường hợp trước khi chọn thủ tục." icon={<HelpCircle size={20}/>} onClick={()=>chooseGoal('unsure')}/>
          </>}
          {question===1&&<>
            <Choice title="Một mình tôi" description="Hộ do một cá nhân thành lập." selected={profile.founder==='self'} icon={<Store size={20}/>} onClick={()=>{setProfile(p=>({...p,founder:'self'}));setQuestion(2);}}/>
            <Choice title="Các thành viên trong gia đình" description="Có thêm giấy tờ ủy quyền thành viên làm chủ hộ." selected={profile.founder==='family'} icon={<Users size={20}/>} onClick={()=>{setProfile(p=>({...p,founder:'family'}));setQuestion(2);}}/>
          </>}
          {question===2&&<>
            {([['online','Nộp trực tuyến','Chuẩn bị hồ sơ điện tử, theo dõi qua cổng dịch vụ công.'],['counter','Đến bộ phận tiếp nhận','Kiểm tra nơi tiếp nhận và chuẩn bị hồ sơ theo địa phương.'],['undecided','Tôi chưa chọn','Xem lộ trình trước, chọn cách nộp sau.']] as const).map(([value,title,description])=><Choice key={value} title={title} description={description} selected={profile.submission===value} icon={<FileText size={20}/>} onClick={()=>setProfile(p=>({...p,submission:value}))}/>)}
            <button type="button" onClick={begin} className={`${primary} mt-4 w-full`}>Xem lộ trình của tôi <ArrowRight size={17}/></button>
          </>}
        </div>
        {question>0&&<button type="button" onClick={()=>setQuestion(q=>q-1)} className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm text-slate-500"><ArrowLeft size={15}/> Quay lại</button>}
        {saved&&<button type="button" onClick={()=>{setProfile(saved.profile);setScreen('guide');}} className="mt-5 block min-h-10 text-sm font-semibold text-emerald-700">Tiếp tục lộ trình đã lưu</button>}
      </section>:profile.goal==='unsure'?<section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <HelpCircle className="mb-4 text-emerald-600" size={30}/><h2 className="text-2xl font-bold">Làm rõ trước khi chuẩn bị hồ sơ</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">Đăng ký hộ kinh doanh và đăng ký thuế là hai việc khác nhau. Bán online, không có cửa hàng hoặc doanh thu thấp chưa đủ để kết luận được miễn đăng ký hộ.</p>
        <label className="mt-6 block text-sm font-semibold" htmlFor="guide-activity">Bạn kinh doanh gì, thường xuyên hay thời vụ?</label>
        <textarea id="guide-activity" rows={3} maxLength={1000} value={situation} onChange={e=>setSituation(e.target.value)} placeholder="Ví dụ: Làm affiliate tại nhà, nhận hoa hồng hằng tháng…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/>
        <label className="mt-4 block text-sm font-semibold" htmlFor="guide-area">Tỉnh/thành phố <span className="font-normal text-slate-400">(nếu biết)</span></label>
        <input id="guide-area" maxLength={100} value={area} onChange={e=>setArea(e.target.value)} placeholder="Nơi dự định kinh doanh" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"/>
        {onOpenAIChat&&<button type="button" onClick={ask} className={`${primary} mt-5 w-full`}><Sparkles size={17}/> Hỏi AI về trường hợp của tôi</button>}
        <button type="button" onClick={edit} className="mt-4 min-h-10 text-sm font-semibold text-slate-500">Quay lại chọn tình huống</button>
      </section>:<>
        <section aria-label="Lộ trình của bạn" className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <div><p className="text-sm font-bold">{profile.goal==='existing'?'Tiếp tục với hộ đã đăng ký':`Hộ do ${profile.founder==='self'?'một cá nhân':'gia đình'} thành lập`}</p><p className="mt-1 text-xs text-slate-500">{completed}/{steps.length} bước đã chuẩn bị · {saveUnavailable?'Tiến độ chỉ giữ trong phiên này':'Tự lưu trên thiết bị này'}</p></div>
          <button type="button" onClick={edit} aria-label="Đổi thông tin" className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700"><RotateCcw size={14}/><span className="hidden sm:inline">Đổi thông tin</span><span className="sm:hidden">Sửa</span></button>
        </section>
        <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-7">
          <nav aria-label="Các bước đăng ký" className="flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-28 lg:flex-col lg:overflow-visible">
            {steps.map((step,index)=><button key={step.id} type="button" aria-current={current?.id===step.id?'step':undefined} onClick={()=>openStep(step.id)} className={`flex min-h-12 shrink-0 items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm lg:gap-3 lg:px-4 ${current?.id===step.id?'border-emerald-200 bg-emerald-50 font-bold text-emerald-800':'border-transparent text-slate-500 hover:bg-white'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${isDone(step.id)||current?.id===step.id?'bg-emerald-600 text-white':'bg-white text-slate-500'}`}>{isDone(step.id)?<Check size={14}/>:index+1}</span>{step.short}</button>)}
          </nav>
          <div className="min-w-0 space-y-5">
            {current&&<section ref={cardRef} aria-label="Bước đang xem" className="scroll-mt-28 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-5 sm:p-8"><p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">Bước {activeIndex+1} / {steps.length}</p>
                <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold leading-tight tracking-tight outline-none">{current.title}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{current.description}</p>
                <div className="mt-7 space-y-3" aria-label="Việc cần chuẩn bị">{current.tasks.map(task=><label key={task.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${checked.includes(task.id)?'border-emerald-200 bg-emerald-50/60':'border-slate-200 hover:border-emerald-200'}`}><input type="checkbox" checked={checked.includes(task.id)} onChange={()=>setChecked(p=>p.includes(task.id)?p.filter(id=>id!==task.id):[...p,task.id])} className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600"/><span><span className="block text-sm font-semibold leading-6 text-slate-800">{task.label}</span>{task.note&&<span className="mt-1 block text-xs leading-5 text-slate-500">{task.note}</span>}</span></label>)}</div>
                {current.link&&<a href={current.link.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-emerald-700">{current.link.label}<ExternalLink size={14}/></a>}
                <details className="mt-5 border-t border-slate-100 pt-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-slate-600">Điều cần lưu ý ở bước này <ChevronDown size={15}/></summary><p className="mt-3 text-sm leading-6 text-slate-500">{current.tip}</p><button type="button" onClick={()=>setDocId(current.source)} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-emerald-700"><FileText size={14}/> Xem văn bản liên quan</button></details>
                {onOpenAIChat&&<button type="button" onClick={ask} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-700"><MessageCircle size={16}/> Tôi cần giải thích thêm bước này</button>}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-8"><button type="button" disabled={activeIndex===0} onClick={()=>openStep(steps[activeIndex-1].id)} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-slate-500 disabled:opacity-30"><ArrowLeft size={15}/> Trước</button>{activeIndex<steps.length-1?<button type="button" onClick={()=>openStep(steps[activeIndex+1].id)} className={primary}>Bước tiếp theo <ArrowRight size={15}/></button>:<span className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><ShieldCheck size={17}/>{allDone?'Đã đánh dấu đủ các việc':'Bạn đang ở bước cuối'}</span>}</div>
            </section>}
            {allDone&&<div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><h3 className="font-bold text-emerald-900">Bạn đã đánh dấu hoàn tất lộ trình</h3><p className="mt-2 text-sm leading-6 text-emerald-800">Kết quả đăng ký và quyền hoạt động vẫn căn cứ hồ sơ, thông báo của cơ quan có thẩm quyền và điều kiện ngành nghề.</p></div>}
            <p className="px-1 text-xs leading-5 text-slate-400">Có thể xem trước bước sau mà không cần đánh dấu đã làm. Dấu tích chỉ ghi nhận tiến độ của bạn.</p>
          </div>
        </div>
      </>}
      <section className="mx-auto mt-10 max-w-3xl border-t border-slate-200 pt-6"><h2 className="mb-3 text-sm font-bold text-slate-700">Biết thêm khi cần</h2>
        {[
          ['Bán online có phải là một loại đăng ký riêng?','Kênh bán hàng không phải một loại giấy phép thay cho hộ kinh doanh. Phân biệt đăng ký hộ với đăng ký thuế và phần nghĩa vụ sàn thực hiện thay.'],
          ['Lệ phí và thời gian có giống nhau ở mọi nơi?','Lệ phí, miễn/giảm và cách tiếp nhận theo quy định địa phương. Thời gian giải quyết không bao gồm mọi tình huống cần sửa, bổ sung hồ sơ.'],
          ['Tôi chưa rõ có phải đăng ký hộ không.','Cần biết hoạt động thực tế và trường hợp miễn đăng ký theo quy định. Chọn “Tôi chưa biết có cần đăng ký hộ không” để làm rõ.'],
        ].map(([title,body])=><details key={title} className="rounded-xl px-2 py-3"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-600">{title}<ChevronDown size={15} className="shrink-0"/></summary><p className="mt-3 text-sm leading-6 text-slate-500">{body}</p></details>)}
        {onOpenConsultation&&<button type="button" onClick={onOpenConsultation} className="mt-4 min-h-11 text-sm font-semibold text-emerald-700">Trao đổi với chuyên gia <ArrowRight size={14} className="ml-1 inline"/></button>}
        <p className="pt-5 text-xs leading-5 text-slate-400">Theo Nghị định 168/2025, các sửa đổi liên quan và Thông tư 90/2026 về đăng ký thuế. Kiểm tra hướng dẫn tiếp nhận tại địa phương khi nộp.</p>
      </section>
    </div>
    <PdfViewerModal docId={docId} onClose={()=>setDocId(null)} onOpenAIChat={onOpenAIChat}/>
  </div>;
}
function Choice({title,description,icon,selected,onClick}:{title:string;description:string;icon:ReactNode;selected?:boolean;onClick:()=>void}){
  return <button type="button" onClick={onClick} aria-pressed={selected} className={`group flex min-h-20 w-full items-center gap-4 rounded-2xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${selected?'border-emerald-400 bg-emerald-50':'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold leading-6 text-slate-800">{title}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span></span>{selected?<Check size={18} className="shrink-0 text-emerald-600"/>:<ArrowRight size={17} className="shrink-0 text-slate-300 group-hover:text-emerald-600"/>}</button>;
}
