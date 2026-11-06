import {useEffect,useRef,useState} from 'react';
import {X,Send,BookOpen,RefreshCw} from 'lucide-react';
import {auth} from '../services/firebase';
import {useAuth} from '../context/AuthContext';
import {answerDisplayText} from '../services/answerDisplay';
type Turn={role:'user'|'assistant';content:string};
type Info={ready:boolean;version?:string;sections:{id:string;title:string}[]};
export default function DocumentChat({document,onClose}:{document:{id:string;code:string;title:string};onClose:()=>void}){
 const {user,openAuthModal,syncCredits,openDepositModal}=useAuth();
 const [info,setInfo]=useState<Info|null>(null),[input,setInput]=useState(''),[turns,setTurns]=useState<Turn[]>([]),[busy,setBusy]=useState(false),[draft,setDraft]=useState(''),[error,setError]=useState(''),[section,setSection]=useState('');
 const [preview,setPreview]=useState<{title:string;text:string}|null>(null);
 const abort=useRef<AbortController|null>(null),end=useRef<HTMLDivElement|null>(null);
 const storageKey=`tax_document_reader_${user?.phone||'anonymous'}_${document.id}_${info?.version||''}`;
 useEffect(()=>{const controller=new AbortController();setPreview(null);setInfo(null);setTurns([]);setError('');setDraft('');setBusy(false);setSection('');abort.current?.abort();
 fetch(`/api/document-chat?documentId=${encodeURIComponent(document.id)}`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Không tải được trạng thái tài liệu.');return r.json();}).then(setInfo).catch(e=>{if(!controller.signal.aborted)setError(e.message);});
 return()=>{controller.abort();abort.current?.abort();};},[document.id]);
 useEffect(()=>{abort.current?.abort();setBusy(false);setDraft('');try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'[]');setTurns(Array.isArray(saved)?saved.filter(t=>['user','assistant'].includes(t.role)&&typeof t.content==='string'):[]);}catch{setTurns([]);}},[storageKey]);
 useEffect(()=>{end.current?.scrollIntoView({block:'end'});},[turns,draft,error]);
 async function source(id:string){try{const r=await fetch(`/api/document-chat?documentId=${encodeURIComponent(document.id)}&sectionId=${encodeURIComponent(id)}`);if(!r.ok)throw Error('Không tải được nguồn.');setPreview(await r.json());}catch{setError('Không tải được mục nguồn.');}}
 function render(text:string){return answerDisplayText(text).split(/(\[S\d+\])/g).map((part,i)=>/^\[S\d+\]$/.test(part)?<button key={i} onClick={()=>void source(part.slice(1,-1))} className="mx-1 rounded bg-emerald-50 px-1 text-emerald-800 underline">{part}</button>:part);}
 async function send(question=input){
 if(busy||!question.trim()||!info?.ready)return;
 if(!auth.currentUser){openAuthModal();return;}
 if(question.length>2000){setError('Câu hỏi tối đa 2.000 ký tự.');return;}
 const controller=new AbortController();abort.current=controller;setBusy(true);setError('');setDraft('');setInput('');let answer='',completed=false;
 try{
 const response=await fetch('/api/document-chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${await auth.currentUser.getIdToken()}`},body:JSON.stringify({documentId:document.id,documentVersion:info.version,sectionId:section||undefined,message:question,history:turns}),signal:controller.signal});
 if(!response.ok){const data=await response.json();if(data.requireDeposit)openDepositModal();throw Error(data.error||'Không thể đọc tài liệu.');}
 if(!response.body)throw Error('Không nhận được luồng trả lời.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
 const event=(line:string)=>{if(!line.startsWith('data:'))return;const data=line.slice(5).trim();if(!data||data==='[DONE]')return;const value=JSON.parse(data);
 if(typeof value.remainingCredits==='number')syncCredits(value.remainingCredits);
 if(value.type==='error')throw Error(value.error||'Luồng bị gián đoạn.');
 if(value.type==='delta'){answer+=value.delta||'';setDraft(answer);}
 if(value.type==='done'){if(typeof value.fullText!=='string'||!value.fullText.trim())throw Error('Đáp án rỗng.');answer=value.fullText;completed=true;}};
 try{while(true){const part=await reader.read();buffer+=decoder.decode(part.value,{stream:!part.done});let index;while((index=buffer.indexOf('\n'))>=0){event(buffer.slice(0,index).replace(/\r$/,''));buffer=buffer.slice(index+1);}if(part.done)break;}if(buffer.trim())event(buffer);}finally{reader.releaseLock();}
 if(!completed)throw Error('Câu trả lời chưa hoàn tất. Vui lòng thử lại.');
 if(controller.signal.aborted)return;
 const next:Turn[]=[...turns,{role:'user',content:question},{role:'assistant',content:answer}];setTurns(next);try{sessionStorage.setItem(storageKey,JSON.stringify(next));}catch{}
 }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Không thể kết nối.');}
 finally{if(abort.current===controller){setBusy(false);setDraft('');abort.current=null;}}
 }
 return <section className="flex h-full min-h-0 flex-col" aria-label="Trợ lý đọc tài liệu">
 <header className="flex items-center gap-3 border-b bg-slate-900 p-4 text-white"><BookOpen size={20}/><div className="min-w-0 flex-1"><h3 className="font-bold">Hiểu tài liệu cùng AI</h3><p className="truncate text-xs text-slate-300">{document.code}</p></div><button onClick={onClose} aria-label="Đóng trợ lý" className="p-2"><X size={18}/></button></header>
 <div className="flex-1 overflow-y-auto p-4 space-y-4">
 {!info&&!error&&<p role="status">Đang kiểm tra nội dung tài liệu…</p>}
 {info&&!info.ready&&<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6"><strong>Nội dung AI đang được chuẩn bị</strong><p>Tài liệu này chưa được bổ sung file Markdown cho trợ lý. Bạn vẫn có thể đọc bản gốc bên cạnh.</p></div>}
 {info?.ready&&<><p className="text-sm leading-6 text-slate-600">Hỏi về nội dung, điều kiện, ngoại lệ hoặc yêu cầu ví dụ dễ hiểu. AI chỉ đọc tài liệu này. Mỗi câu trả lời hoàn tất sử dụng 1 lượt.</p>
 <label className="block text-xs font-semibold">Phạm vi đọc<select value={section} onChange={e=>setSection(e.target.value)} disabled={busy} className="mt-1 w-full rounded-lg border p-2 text-sm"><option value="">Toàn tài liệu</option>{info.sections.map(s=><option key={s.id} value={s.id}>{s.id} · {s.title}</option>)}</select></label>
 {!turns.length&&<div className="flex flex-wrap gap-2">{['Tóm tắt nội dung chính thật dễ hiểu','Những điều kiện và ngoại lệ nào cần lưu ý?','Cho ví dụ minh họa các điểm quan trọng'].map(q=><button key={q} disabled={busy} onClick={()=>void send(q)} className="rounded-xl border border-emerald-200 p-2 text-left text-sm text-emerald-800">{q}</button>)}</div>}
 {turns.map((t,i)=><article key={i} className={`rounded-2xl p-3 text-sm leading-7 whitespace-pre-wrap break-words ${t.role==='user'?'bg-emerald-50':'border bg-white'}`}><strong className="block text-xs text-slate-500">{t.role==='user'?'Bạn':'Trợ lý tài liệu'}</strong>{render(t.content)}</article>)}
 {busy&&<article aria-live="polite" className="whitespace-pre-wrap text-sm leading-7">{render(draft||'Đang đọc và giải thích tài liệu…')}</article>}
 {turns.length>0&&<button disabled={busy} onClick={()=>{setTurns([]);sessionStorage.removeItem(storageKey);}} className="flex items-center gap-2 text-xs text-slate-500"><RefreshCw size={14}/>Hội thoại mới</button>}
 {info.sections.length>0&&<details className="text-xs text-slate-500"><summary>Mục nguồn trong tài liệu</summary>{info.sections.map(s=><button key={s.id} className="block p-1 text-left" disabled={busy} onClick={()=>{setSection(s.id);setInput(`Giải thích mục ${s.title} dễ hiểu hơn.`);}}>[{s.id}] {s.title}</button>)}</details>}
 </>}
 {preview&&<aside className="rounded-xl border bg-slate-50 p-3 text-sm"><button onClick={()=>setPreview(null)} className="float-right p-1" aria-label="Đóng đoạn nguồn"><X size={14}/></button><strong>{preview.title}</strong><p className="mt-2 whitespace-pre-wrap leading-6">{preview.text}</p></aside>}
 {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div ref={end}/></div>
 <form onSubmit={e=>{e.preventDefault();void send();}} className="border-t bg-white p-3"><textarea aria-label="Câu hỏi về tài liệu" value={input} onChange={e=>setInput(e.target.value)} disabled={!info?.ready||busy} placeholder="Bạn muốn hiểu phần nào trong tài liệu?" maxLength={2000} rows={2} className="w-full resize-none rounded-xl border p-3 text-sm disabled:bg-slate-50"/><div className="mt-2 flex justify-between items-center"><span className="text-xs text-slate-500">{user?`${user.credits} lượt`:'Đăng nhập để hỏi AI'}</span><button type="submit" disabled={busy||!info?.ready||!input.trim()} className="flex gap-2 items-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"><Send size={15}/>Gửi</button></div></form>
 </section>;
}
