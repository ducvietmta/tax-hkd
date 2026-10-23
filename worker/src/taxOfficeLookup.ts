import directory from '../../shared/taxOfficeDirectory.json';
import retainedData from './data/taxDirectoryRecords.json';
export const taxOffices=directory.offices;
const fold=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
interface RetainedRecord { id:string;raw:{name?:string|null;unit?:string|null;email?:string|null;phone?:string|null;n_phone_variants?:number;source_files?:string[];subsections?:string[]}; }
const retained=retainedData as unknown as RetainedRecord[];
// Build the name index once per Worker isolate. The full export never enters a model prompt.
const nameIndex=retained.map(row=>({row,name:fold(row.raw.name||''),region:fold(row.raw.unit||'').replace(/^(?:chi cuc thue|thue)\s*(?:tinh|tp|thanh pho)?\s*/,'')}))
 .filter(r=>r.name.length>2&&/[a-z]/.test(r.name)&&!/[0-9]/.test(r.name));
export function contactCandidates(answers:string[]){
 const query=' '+fold(answers.join(' '))+' ',tokens=new Set(query.trim().split(' '));
 // A person's name may itself contain a province name; it is not a locality confirmation.
 const fullName=nameIndex.filter(r=>query.includes(' '+r.name+' ')).sort((a,b)=>b.name.length-a.name.length)[0]?.name;
 const localityQuery=fullName?query.replace(' '+fullName+' ',' '):query;
 const regions=nameIndex.filter(r=>r.region&&localityQuery.includes(' '+r.region+' '));
 const pool=regions.length?regions:nameIndex;
 return pool.map(item=>{
  const words=[...new Set(item.name.split(' '))];
  const exact=query.includes(' '+item.name+' ');
  const regionWords=new Set(item.region.split(' '));
  const hits=words.filter(w=>tokens.has(w)&&!regionWords.has(w)).length;
  const agency=/^(?:(?:chi )?cuc thue|thue)\b/.test(item.name);
  return {item,score:exact?100+words.length:!agency&&hits>=2?hits/words.length:0};
 }).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,24).map(({item})=>{
  const {id,raw}=item.row,email=(raw.email||'').trim(),phone=(raw.phone||'').trim();
  const validEmail=/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)?email:null;
  const validPhone=(raw.n_phone_variants||0)<=1&&/^(?:0\d{8,10}|\+84\d{9,10})$/.test(phone.replace(/[\s().-]/g,''))?phone:null;
  return {id,name:raw.name||'',unit:raw.unit||'',aliases:[],email:validEmail,recordType:'CONTACT' as const,
   responsibilityKnown:false,contacts:validEmail||validPhone?[{email:validEmail,phone:validPhone,sourceFiles:raw.source_files||[]}]:[]};
 });
}
export function directoryCandidates(answers:string[]){
 const contacts=contactCandidates(answers);
 if(contacts.length&&contacts.every(c=>! /^(?:(?:chi )?cuc thue|thue)\b/.test(fold(c.name))))return contacts;
 return [...contacts,...officeCandidates(answers)];
}
/** Retrieval only: the model still resolves identity or asks for clarification. */
export function officeCandidates(answers:string[]){
 const query=' '+fold(answers.join(' '))+' ';
 const regions=taxOffices.filter(o=>{
  const region=fold(o.unit).replace(/^(?:chi cuc thue|thue)\s*(?:tinh|tp|thanh pho)?\s*/,'');
  return !!region&&query.includes(' '+region+' ');
 });
 const pool=regions.length?regions:taxOffices;
 const numbers=new Set((query.match(/\b\d+\b/g)||[]).map(Number));
 const numbered=pool.filter(o=>{const n=o.id.match(/-co-so-(\d+)$/);return n&&numbers.has(Number(n[1]));});
 return numbered.length?numbered:pool;
}
