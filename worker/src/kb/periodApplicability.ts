export interface EffectiveInterval {
 applies_from_year?:number|null; applies_to_year?:number|null;
 effective_from?:string|null; effective_to?:string|null;
}
export interface ObligationPeriod { years:number[]; event_date?:string }
/** Effective dates concern the legal provision, never the source publication. */
export function periodFits(source:EffectiveInterval,period:ObligationPeriod):boolean {
 if(!period.years.length)return true;
 const valid=(d:string)=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
 if(source.effective_from&&!valid(source.effective_from)||source.effective_to&&!valid(source.effective_to))return false;
 const from=source.effective_from||`${source.applies_from_year??0}-01-01`;
 const to=source.effective_to||(source.applies_to_year==null?'9999-12-31':`${source.applies_to_year}-12-31`);
 if(period.event_date){
  if(!valid(period.event_date)||!period.years.includes(Number(period.event_date.slice(0,4))))return false;
  return period.event_date>=from&&period.event_date<=to;
 }
 return period.years.some(y=>`${y}-12-31`>=from&&`${y}-01-01`<=to);
}
