/** Consume native semantic verdicts, never infer verdicts from answer wording. */
export const SCOPE_CHECKS = {
  subject_applicability:'Đối chiếu chủ thể và trạng thái đăng ký thực sự được câu hỏi/lịch sử xác nhận, không tin nhãn phân loại một cách máy móc. Không tự coi người tự nhận cá nhân kinh doanh là hộ đã đăng ký, hoặc suy không có hộ là được miễn đăng ký. Không áp quy tắc, giới hạn hoặc thủ tục riêng của hình thức khi thiếu tiền đề; cần phân nhánh hoặc hỏi lại khi tiền đề ảnh hưởng kết luận. Nếu đã xác nhận thì không hỏi lại. Không coi hai cách gọi đồng nghĩa hoặc hoàn toàn loại trừ nhau chỉ vì văn bản viết gộp. Kết luận về thuế chung hay khái niệm không cần thêm câu hỏi hồ sơ nếu không phụ thuộc hình thức.',
  request_alignment: 'Đáp án giải quyết đúng yêu cầu/chính sách người dùng thực sự hỏi trong câu và lịch sử, không thay bằng chính sách khác hoặc dữ kiện phụ. Không đòi một cụm từ, số hiệu hay cách viết cố định. Câu thiếu chính sách phải được làm rõ hoặc trả theo các cách hiểu có điều kiện; không đoán từ số tiền. Không buộc nêu lại điều kiện khi người dùng đã xác nhận và chỉ hỏi phép tính.',
  fact_roles: 'Đối chiếu vai trò và mức chắc chắn của từng dữ kiện với kết luận: dự báo khác thực tế, số lũy kế khác đủ kỳ, dòng tiền khác doanh thu ghi nhận, tổng khác các phần, hủy/ghi trùng khác công nợ. Không biến ước tính hoặc dữ kiện chưa có thành bằng chứng đã thỏa điều kiện. Kết luận có điều kiện phải giữ điều kiện ở các phần liên quan. Hiểu toàn ý, không chấm dựa vào một từ phủ định hay từ nếu.',
  evidence_boundaries: 'Mỗi kết luận về nghĩa vụ/quyền lợi phải nằm trong phạm vi chủ thể, kỳ, cơ sở và điều kiện của nguồn được cung cấp. Không suy nghĩa vụ khác chỉ vì một con số hay tên chính sách xuất hiện. Không sử dụng kiến thức ngoài nguồn để tự bổ sung quy tắc. Nếu chỉ đủ căn cứ cho một tiêu chí thì phải giữ riêng tiêu chí đó, không khẳng định đủ mọi điều kiện. Không chặn cách diễn đạt tương đương hoặc ví dụ có giả định rõ.',
} as const;
export type ScopeCheck = keyof typeof SCOPE_CHECKS;
export interface ScopeAssessment {
  status:'PASS'|'REPAIR'|'UNAVAILABLE';
  issues:ScopeCheck[];
  checks:Record<string,{choice:string;confidence:number}>;
}
export function evaluateScopeAssessment(answers:Record<string,any>|null):ScopeAssessment{
  const checks:ScopeAssessment['checks']={};
  let unknown=false;
  const issues:ScopeCheck[]=[];
  for(const key of Object.keys(SCOPE_CHECKS) as ScopeCheck[]){
    const value=answers?.[key];
    if(value?.type!=='choice'||!['SUPPORTED','CONTRADICTED','INCOMPLETE','UNKNOWN'].includes(value.choice)||
      typeof value.confidence!=='number'||!Number.isFinite(value.confidence)||value.confidence<0||value.confidence>1){unknown=true;continue;}
    checks[key]={choice:value.choice,confidence:value.confidence};
    if(value.confidence<.8||value.choice==='UNKNOWN')unknown=true;
    else if(value.choice!=='SUPPORTED')issues.push(key);
  }
  return {status:issues.length?'REPAIR':unknown?'UNAVAILABLE':'PASS',issues,checks};
}
