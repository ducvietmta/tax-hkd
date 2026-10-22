import fs from 'node:fs/promises';
const baseFile='rag_data/rag-kb-export-2026-10-12/chunks.jsonl';
const extraFile='rag_data/semantic-topic-supplements.json';
const metaFile='worker/src/kb/chunkMeta.json';
const base=(await fs.readFile(baseFile,'utf8')).trim().split(/\r?\n/).map(JSON.parse);
const extra=JSON.parse(await fs.readFile(extraFile,'utf8'));
const meta=JSON.parse(await fs.readFile(metaFile,'utf8'));
const mixed=extra.find(c=>c.ref_id==='16.108');
if(!mixed)throw Error('Missing subject source');
const sections=['[HỒ SƠ VÀ THỜI HẠN ĐĂNG KÝ HỘ KINH DOANH]','[MỞ THÊM ĐỊA ĐIỂM KINH DOANH]','[TẠM NGỪNG KINH DOANH]'];
const paragraphs=mixed.text.split('\n');
const moved=paragraphs.filter(p=>sections.some(header=>p.startsWith(header)));
const householdId='KB/semantic-topic-supplements#household-form-procedures';
const existingHousehold=extra.find(c=>c.ref_id==='16.155');
if(existingHousehold&&existingHousehold.id!==householdId)throw Error('Ref conflict');
if(!moved.length&&!existingHousehold)throw Error('No procedure text to preserve');
mixed.text=paragraphs.filter(p=>!sections.some(header=>p.startsWith(header))).join('\n');
if(!mixed.text.startsWith('[RANH GIỚI ÁP DỤNG]'))mixed.text='[RANH GIỚI ÁP DỤNG] Nội dung định nghĩa và thủ tục thuế trực tiếp không chứng minh người hỏi đã thành lập hộ. Phần thủ tục riêng của hình thức hộ được lưu riêng; chỉ áp khi đúng trạng thái hoặc người hỏi đang muốn thành lập hộ.\n'+mixed.text;
mixed.evidence_mode='COMPLETE_RULE';
const definitions=mixed.text.split('\n').filter(p=>p.startsWith('[KHÁI NIỆM]')||p.startsWith('[PHÂN BIỆT CHỦ THỂ]')||p.startsWith('[LUỒNG THỦ TỤC]')).join('\n');
mixed.purpose_passages={...(mixed.purpose_passages||{}),DEFINITION:definitions};
const nd='https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-168-2025-nd-cp-ve-dang-ky-doanh-nghiep-119250702175708554.htm';
const tax='https://xaydungchinhsach.chinhphu.vn/chinh-sach-thue-gia-tri-gia-tang-thue-thu-nhap-ca-nhan-cac-khoan-thue-khac-119260316093129828.htm';
const multi='https://baochinhphu.vn/ke-khai-thue-doi-voi-ca-nhan-kinh-doanh-da-linh-vuc-102260929171744114.htm';
const boundaryText=[
 '[RANH GIỚI KHÁI NIỆM] Cá nhân kinh doanh nhận diện một người có hoạt động kinh doanh trong quản lý thuế; hộ kinh doanh là hình thức đăng ký. Hai khái niệm không đồng nghĩa, cũng không loại trừ nhau hoàn toàn: cá nhân có thể là chủ hộ. Không phân biệt bằng làm một mình hay cùng gia đình.',
 '[TRẠNG THÁI CHƯA XÁC NHẬN] Tự gọi cá nhân kinh doanh, có mã thuế hoặc đăng ký thuế trực tiếp chưa chứng minh đã có hộ; chưa có hộ cũng chưa chứng minh được miễn đăng ký. Nếu thủ tục phụ thuộc hình thức, cần làm rõ đã có giấy chứng nhận hộ hay chỉ đăng ký thuế. Câu hỏi định nghĩa và phần thuế chung không cần chặn để hỏi hồ sơ.',
 '[PHẠM VI QUY TẮC RIÊNG] Khoản 1 Điều 83 Nghị định 168/2025/NĐ-CP giới hạn số hộ được đăng ký, không đặt giới hạn một ngành hay một hoạt động của mọi cá nhân kinh doanh. Khi chưa rõ hình thức, không dùng quy tắc riêng này để kết luận người hỏi bị cấm thêm ngành/địa điểm. Điều 82 và khoản 1 Điều 85 phân biệt việc thành lập hộ với thủ tục thuế.',
 '[PHÂN NHÁNH THỦ TỤC] Hướng dẫn của Thuế Hà Nội: khi hoạt động bổ sung thuộc diện không phải đăng ký hộ, người nộp thuế điều chỉnh/bổ sung thông tin đăng ký thuế bằng Mẫu 08-MST ban hành kèm Thông tư 90/2026/TT-BTC với cơ quan thuế quản lý trực tiếp. Nếu hoạt động mới phải đăng ký hộ thì thực hiện nhánh đăng ký hộ; thay đổi ngành của hộ đã có giấy là nhánh riêng. Không tự xác nhận hoạt động được miễn đăng ký hộ chỉ từ cách tự xưng.',
 '[NGUỒN VÀ GIỚI HẠN] Đối chiếu 21/10/2026: khoản 1 Điều 4 Nghị định 68/2026/NĐ-CP chỉ dùng cho phạm vi chủ thể, không dùng mức doanh thu cũ trong bài giới thiệu. '+tax+' ; Điều 82, khoản 1 Điều 83, khoản 1 Điều 85 Nghị định 168/2025/NĐ-CP: '+nd+' ; hướng dẫn phân nhánh thủ tục của Thuế Hà Nội, không mở rộng thành kết luận miễn đăng ký cho mọi người: '+multi,
].join('\n');
function upsert(chunk){const i=extra.findIndex(c=>c.ref_id===chunk.ref_id);if(i>=0){if(extra[i].id!==chunk.id)throw Error('Ref conflict '+chunk.ref_id);extra[i]=chunk;}else extra.push(chunk);meta[chunk.ref_id]={id:chunk.id,ref_id:chunk.ref_id,section:chunk.section,tier:chunk.tier,legal_status:'VERIFIED_CONDITIONAL',applies_from_year:2026,applies_to_year:null};}
upsert({id:'KB/semantic-topic-supplements#business-subject-boundary',ref_id:'16.154',file:'KB/semantic-topic-supplements',section:'16.154. Ranh giới cá nhân kinh doanh và hộ kinh doanh; xác nhận trạng thái trước khi áp thủ tục',tier:'VERIFIED_CONDITIONAL',evidence_mode:'COMPLETE_RULE',text:boundaryText,
 retrieval_facets:{topics:['TAX_REGISTRATION','BUSINESS_REGISTRATION','REGISTRATION_COMPARISON','REGISTRATION_REQUIREMENTS','TAX_REGISTRATION_CHANGE'],subject_contexts:['INDIVIDUAL_ACTIVITY','COMPARISON']},purpose_passages:{DEFINITION:boundaryText.split('\n').slice(0,2).join('\n')}});
upsert({id:householdId,ref_id:'16.155',file:'KB/semantic-topic-supplements',section:'16.155. Hồ sơ, địa điểm và tạm ngừng: thủ tục riêng của hình thức hộ kinh doanh',tier:'VERIFIED_CONDITIONAL',evidence_mode:'COMPLETE_RULE',subject_scope:['HOUSEHOLD_FORM','COMPARISON'],
 text:existingHousehold?.text||'[PHẠM VI] Chỉ dùng cho người đang hỏi thành lập/hoạt động dưới hình thức hộ hoặc đã xác nhận có hộ; không tự áp cho người chỉ tự nhận cá nhân kinh doanh.\n'+moved.join('\n'),
 retrieval_facets:{subject_contexts:['HOUSEHOLD_FORM'],answer_purposes:['PROCEDURE','ELIGIBILITY','OTHER']}});
const single=base.find(c=>c.ref_id==='16.7');single.subject_scope=['HOUSEHOLD_FORM','COMPARISON'];
if(!single.text.startsWith('[PHẠM VI CHỦ THỂ]'))single.text='[PHẠM VI CHỦ THỂ] Quy tắc sau thuộc hình thức hộ kinh doanh; không biến người chỉ tự nhận cá nhân kinh doanh thành người đã thành lập hộ. Chưa rõ trạng thái thì cần xác minh trước khi kết luận riêng cho họ.\n'+single.text;
await fs.writeFile(baseFile,base.map(c=>JSON.stringify(c)).join('\n')+'\n');
await fs.writeFile(extraFile,JSON.stringify(extra,null,2)+'\n');
await fs.writeFile(metaFile,JSON.stringify(meta,null,2)+'\n');
console.log('Added subject boundary; separated household procedures; preserved original legal text and unknown registration state.');
