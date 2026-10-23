import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import data from '../../shared/websitePolicies.json';
export type PolicyType='privacy'|'complaints'|'pricing'|'payment'|'terms'|'refund';
interface PolicyModalProps {isOpen:boolean;onClose:()=>void;initialPolicy?:PolicyType}
export const PolicyModal:React.FC<PolicyModalProps>=({isOpen,onClose,initialPolicy='privacy'})=>{
 const [active,setActive]=useState<PolicyType>(initialPolicy);
 useEffect(()=>{setActive(initialPolicy);},[initialPolicy,isOpen]);
 useEffect(()=>{if(!isOpen)return;const handle=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle);},[isOpen,onClose]);
 if(!isOpen)return null;
 const policy=data.policies.find(p=>p.id===active)||data.policies[0],file=`${String(policy.number).padStart(2,'0')}-${policy.id}`;
 return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-3 sm:p-6" onClick={onClose}>
  <section role="dialog" aria-modal="true" aria-labelledby="policy-title" onClick={e=>e.stopPropagation()} className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
   <header className="flex items-center justify-between border-b p-4 sm:px-6"><div><h2 className="font-bold text-slate-900">Chính sách TAX-HKD</h2><p className="text-xs text-slate-500">Cập nhật 23/10/2026 · Dịch vụ số trực tuyến</p></div><button type="button" aria-label="Đóng chính sách" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={20}/></button></header>
   <div className="min-h-0 overflow-y-auto sm:flex">
    <nav aria-label="Sáu chính sách" className="grid shrink-0 grid-cols-2 gap-1 border-b bg-slate-50 p-3 sm:w-64 sm:grid-cols-1 sm:content-start sm:border-b-0 sm:border-r">{data.policies.map(p=><a key={p.id} href={'#/'+p.slug} aria-current={active===p.id?'page':undefined} onClick={()=>setActive(p.id as PolicyType)} className={`rounded-lg px-3 py-2.5 text-xs leading-5 ${active===p.id?'bg-emerald-100 font-semibold text-emerald-900':'text-slate-600 hover:bg-white'}`}>{p.number}. {p.title}</a>)}</nav>
    <article className="min-w-0 space-y-5 p-5 text-sm leading-7 text-slate-700 sm:p-8">
     <h1 id="policy-title" className="text-xl font-bold leading-8 text-slate-900">{policy.number}. {policy.title}</h1>
     <p className="text-xs text-slate-500">Chủ sở hữu: {data.operator.name} · {data.operator.email} · {data.operator.phone}</p>
     <div className="flex flex-wrap gap-3 text-xs font-semibold text-emerald-800"><a download href={`/policies/${file}.pdf`} className="inline-flex items-center gap-1.5"><Download size={15}/>Tải PDF</a><a download href={`/policies/${file}.docx`}>Tải Word</a><a href={`/policies/${file}.html`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5"><ExternalLink size={15}/>Mở trang riêng</a><a download href="/policies/TAX-HKD-6-chinh-sach.zip">Tải cả 6 chính sách</a></div>
     {policy.sections.map((section,i)=><section key={section.heading} className="space-y-2"><h2 className="font-bold text-slate-900">{i+1}. {section.heading}</h2>{section.paragraphs.map((p,j)=><p key={j}>{p}</p>)}</section>)}
    </article>
   </div>
  </section>
 </div>;
};
