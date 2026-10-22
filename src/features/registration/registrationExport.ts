import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { INDUSTRY_CATALOG, detailErrors, recipient, type Answers } from './wizardModel';

function escapeXml(value: string) { return value.replace(/[<>&"']/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' }[c]!)).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ''); }
function date(value: string) { const parts=value.split('-');return parts.length===3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ''; }
function memberRows(template: string,answers: Answers,html=false): string {
  const count=answers.founder==='family'?Number(answers.memberCount):1;
  const pattern=html?/<tr\b[^>]*>[\s\S]*?<\/tr>/gi:/<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g;
  return template.replace(pattern,row=>{
    if(!row.includes('{{memberName}}'))return row;
    return Array.from({length:count},(_,i)=>{
      const active=answers.founder==='family';
      const values:Answers={memberNumber:active?String(i+1):'',memberName:active?(i?answers[`member${i}Name`]:answers.fullName).toUpperCase():'',memberBirthDate:active?date(i?answers[`member${i}BirthDate`]:answers.birthDate):'',memberId:active?(i?answers[`member${i}Id`]:answers.personalId):'',memberGender:active?(i?answers[`member${i}Gender`]:answers.gender):''};
      return row.replace(/\{\{(member[a-zA-Z]+)\}\}/g,(_,id:string)=>escapeXml(values[id]||''));
    }).join('');
  });
}
function templateFields(answers: Answers): Answers {
  const errors=detailErrors(answers);
  if (errors.length) throw new Error(errors[0]);
  if (answers.scope!=='new'||answers.identityScope!=='yes') throw new Error('Unsupported application branch');
  if (!['household','individual'].includes(answers.kind)) throw new Error('Unsupported kind');
  const industry=INDUSTRY_CATALOG.rows.find(row=>row.code===answers.industry);
  if (!industry) throw new Error('Industry must be selected from verified catalogue');
  return {...answers,fullName:answers.fullName.toUpperCase(),businessName:answers.kind==='household'?answers.businessName.toUpperCase():answers.businessName||'',birthDate:date(answers.birthDate),startDate:date(answers.startDate||''),industryName:industry.name,soloMark:answers.founder==='solo'?'☒':'☐',familyMark:answers.founder==='family'?'☒':'☐',noFixedMark:answers.fixed==='no'?'☒':'☐'};
}
export function fillRegistrationTemplate(template: Uint8Array, answers: Answers): Uint8Array {
  const fields=templateFields(answers);
  const files=unzipSync(template);
  if(!files['word/document.xml'])throw new Error('Invalid official template');
  let count=0;
  for(const name of Object.keys(files))if(/^word\/.*\.xml$/.test(name)){
    const xml=memberRows(strFromU8(files[name]),answers);
    files[name]=strToU8(xml.replace(/\{\{([a-zA-Z]+)\}\}/g,(_,id:string)=>{count++;return escapeXml(fields[id]||'');}));
  }
  if(!count)throw new Error('Missing official template mappings');
  return zipSync(files,{level:6});
}
export function fillRegistrationHtml(template: string,answers: Answers): string {
  const fields=templateFields(answers);
  if(!template.includes('{{fullName}}')||/<script\b|\bon\w+\s*=/i.test(template))throw new Error('Invalid print template');
  const output=memberRows(template,answers,true).replace(/\{\{([a-zA-Z]+)\}\}/g,(_,id:string)=>escapeXml(fields[id]||''));
  const checklist=`<section style="break-before:page;page-break-before:always;font:14px/1.8 Arial,sans-serif"><h2>Phiếu chuẩn bị đi nộp</h2><p>Giữ phiếu này để đối chiếu; không dùng thay biểu mẫu đăng ký.</p><h3>Nơi tiếp nhận</h3><p>${escapeXml(recipient(answers))}</p><h3>Trước khi đi</h3><ul><li>Kiểm tra thông tin đã điền, ghi ngày và ký đúng người trên hồ sơ.</li><li>Kiểm tra địa chỉ, giờ tiếp nhận, lệ phí và thành phần hồ sơ được cơ quan công bố.</li>${answers.founder==='family'?'<li>Các thành viên ký tại bảng thành viên; chuẩn bị văn bản ủy quyền một thành viên làm chủ hộ theo quy định.</li>':''}<li>Nếu nhờ người khác nộp: chuẩn bị giấy tờ ủy quyền áp dụng cho trường hợp của bạn.</li><li>Không mặc định bản sao căn cước là bắt buộc cho mọi người đã có dữ liệu dân cư; đối chiếu yêu cầu của thủ tục.</li><li>Lưu hồ sơ, giấy tiếp nhận, thông báo bổ sung và kết quả.</li></ul></section>`;
  return output.replace(/<\/body>/i,checklist+'</body>');
}
export async function downloadRegistrationApplication(answers: Answers, format: 'html' | 'docx' = 'html') {
  const base=answers.kind==='household'?'/documents/Template-01-HKD':'/documents/Template-03-DKT';
  const path=`${base}.${format}`;
  const response=await fetch(path,{cache:'no-cache'});
  if(!response.ok)throw new Error('Template unavailable');
  const output=format==='html'?fillRegistrationHtml(await response.text(),answers):new Uint8Array(fillRegistrationTemplate(new Uint8Array(await response.arrayBuffer()),answers)).buffer;
  const blob=new Blob([output],{type:format==='html'?'text/html;charset=utf-8':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`${answers.kind==='household'?'Ho-so-dang-ky-ho-kinh-doanh':'To-khai-03-DKT'}.${format}`;
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30_000);
}
