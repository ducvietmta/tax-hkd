import {officeCandidates} from './taxOfficeLookup';
const fold=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
/** Contact candidates are server-side data, not evidence establishing a legal conclusion. */
export function supportDirectory(answers:string[]){
 const query=' '+fold(answers.join(' '))+' ';
 const pool=officeCandidates(answers);
 const localized=pool.filter(office=>{
  const region=fold(office.unit).replace(/^(?:chi cuc thue|thue)\s*(?:tinh|tp|thanh pho)?\s*/,'').trim();
  return region.length>2&&query.includes(' '+region+' ');
 });
 if(!localized.length)return {status:'NEEDS_LOCALITY',message:'Cho biết tên Thuế cơ sở và tỉnh/thành ghi trong thông báo để tìm đúng đầu mối.',offices:[]};
 const unique=[...new Map(localized.map(o=>[o.id,o])).values()];
 if(unique.length!==1)return {status:'AMBIGUOUS',message:'Có nhiều đơn vị phù hợp. Cần xác nhận tên hoặc số Thuế cơ sở.',offices:unique.slice(0,6).map(o=>({id:o.id,name:o.name,unit:o.unit,contacts:[]}))};
 return {status:'MATCHED',message:'Liên hệ tham khảo từ danh bạ đã lưu; cần đối chiếu với đơn vị trên thông báo. Chưa xác minh lại tính cập nhật của liên hệ.',offices:unique};
}
