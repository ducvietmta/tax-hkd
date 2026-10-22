export type RegistrationGoal = 'new' | 'existing' | 'unsure';
export interface GuideProfile { goal:RegistrationGoal; founder:'self'|'family'; submission:'online'|'counter'|'undecided' }
export interface GuideTask { id:string; label:string; note?:string }
export interface GuideStep { id:string; short:string; title:string; description:string; tasks:GuideTask[]; tip:string; source:string; link?:{label:string;url:string} }
export const GUIDE_STORAGE_KEY='taxhkd.registration.guide.v2';
/** User-selected tasks, not a classifier for legal eligibility. */
export function buildRegistrationGuide(profile:GuideProfile):GuideStep[] {
  if(profile.goal==='unsure')return [];
  const after:GuideStep={id:'after',short:'Sau đăng ký',title:'Thiết lập việc cần làm sau đăng ký',description:'Đăng ký hộ, kê khai thuế và sử dụng hóa đơn là các việc khác nhau. Thực hiện nghĩa vụ phù hợp với hoạt động của bạn.',tasks:[
    {id:'after-tax',label:'Kiểm tra tài khoản thuế điện tử và thông tin liên hệ'},
    {id:'after-account',label:'Xác định tài khoản, ví dùng cho kinh doanh để thông báo đúng thủ tục'},
    {id:'after-records',label:'Xác định sổ kế toán, nghĩa vụ khai thuế và hóa đơn',note:'Xét tổng doanh thu, ngành nghề và phương pháp thuế; không đồng nhất ngưỡng thuế với điều kiện đăng ký hộ.'},
  ],tip:'Nếu bán trên sàn, đối chiếu phần sàn đã khấu trừ/nộp thay để tránh nộp trùng. Không xin mã số thuế cá nhân thứ hai chỉ vì có thêm hoạt động.',source:'TT-90-2026-TT-BTC'};
  if(profile.goal==='existing')return [
    {id:'existing-info',short:'Đối chiếu',title:'Kiểm tra thông tin hộ đã đăng ký',description:'Bắt đầu từ hồ sơ đang có, không lập hộ mới chỉ để cập nhật thuế.',tasks:[
      {id:'existing-certificate',label:'Tìm giấy chứng nhận đăng ký hộ kinh doanh đang dùng'},
      {id:'existing-identity',label:'Đối chiếu chủ hộ, địa chỉ và thông tin định danh thuế'},
      {id:'existing-status',label:'Kiểm tra thông báo nếu hộ đang tạm ngừng hoặc không hoạt động tại địa chỉ đăng ký'},
    ],tip:'Nếu thay đổi tên, chủ hộ, địa chỉ hoặc ngành nghề, xác định đúng thủ tục thay đổi trước khi nộp.',source:'ND-168-2025-ND-CP'},
    {id:'existing-tax',short:'Thuế điện tử',title:'Kiểm tra kết nối với cơ quan thuế',description:'Đối chiếu thông tin liên thông và tài khoản giao dịch thuế điện tử.',tasks:[
      {id:'existing-tax-data',label:'Kiểm tra thông tin định danh và cơ quan thuế quản lý'},
      {id:'existing-login',label:'Kiểm tra đăng nhập eTax bằng phương thức phù hợp'},
    ],tip:'Đăng nhập được không thay cho việc kiểm tra tình trạng đăng ký, nghĩa vụ thuế và thông báo của cơ quan có thẩm quyền.',source:'TT-90-2026-TT-BTC'},after,
  ];
  return [
    {id:'info',short:'Thông tin',title:'Chốt thông tin sẽ đăng ký',description:'Chuẩn bị trước để điền hồ sơ một lần, hạn chế phải sửa lại.',tasks:[
      {id:'name',label:'Chọn tên: “Hộ kinh doanh” + tên riêng',note:'Ví dụ: Hộ kinh doanh An Nhiên. Kiểm tra tên theo phạm vi quy định hiện hành.'},
      {id:'address',label:'Xác định địa chỉ trụ sở hợp pháp',note:'Ghi địa chỉ phường/xã hiện tại; kiểm tra địa điểm có được dùng để kinh doanh hay không.'},
      {id:'activity',label:'Ghi rõ hoạt động kinh doanh, vốn và thông tin chủ hộ',note:'Ngành nghề có điều kiện có thể cần giấy phép hoặc điều kiện hoạt động riêng.'},
    ],tip:'Bán online cũng cần địa chỉ trụ sở khi đăng ký hộ; không có cửa hàng không tự động được miễn đăng ký.',source:'ND-168-2025-ND-CP'},
    {id:'prepare',short:'Hồ sơ',title:'Chuẩn bị giấy tờ đúng trường hợp',description:profile.founder==='family'?'Hồ sơ của hộ do các thành viên gia đình cùng thành lập.':'Hồ sơ của hộ do một cá nhân thành lập.',tasks:[
      {id:'application',label:'Giấy đề nghị đăng ký hộ kinh doanh',note:'Dùng mẫu của thủ tục đang được cơ quan có thẩm quyền công bố.'},
      {id:'identity',label:'Sẵn sàng thông tin định danh để đối chiếu',note:'Chuẩn bị giấy tờ nếu thuộc trường hợp không khai thác được dữ liệu hoặc được yêu cầu bổ sung đúng quy định.'},
      ...(profile.founder==='family'?[{id:'family-authority',label:'Văn bản ủy quyền một thành viên làm chủ hộ',note:'Theo thành phần hồ sơ và yêu cầu chứng thực hiện hành đối với hộ do thành viên hộ gia đình thành lập.'}]:[]),
    ],tip:'Nếu nhờ người khác nộp, kiểm tra thêm hồ sơ ủy quyền. Không mặc định hợp đồng thuê nhà là thành phần bắt buộc của mọi bộ hồ sơ.',source:'ND-168-2025-ND-CP'},
    {id:'submit',short:'Nộp hồ sơ',title:profile.submission==='counter'?'Nộp tại nơi tiếp nhận hồ sơ':'Nộp hồ sơ qua kênh phù hợp',description:profile.submission==='counter'?'Tìm bộ phận tiếp nhận được địa phương công bố cho cơ quan đăng ký kinh doanh cấp xã nơi đặt trụ sở.':profile.submission==='undecided'?'Chọn nộp trực tuyến hoặc qua bộ phận tiếp nhận theo hướng dẫn địa phương nơi đặt trụ sở.':'Từ Cổng Dịch vụ công quốc gia, tìm thủ tục đăng ký hộ kinh doanh và chọn địa phương nơi đặt trụ sở.',tasks:[
      {id:'channel',label:profile.submission==='counter'?'Kiểm tra địa chỉ, giờ tiếp nhận và thành phần hồ sơ':profile.submission==='undecided'?'Kiểm tra kênh tiếp nhận tại địa phương và chọn cách nộp phù hợp':'Kiểm tra hướng dẫn nộp trực tuyến của thủ tục tại địa phương'},
      {id:'review',label:'Kiểm tra hồ sơ, xác thực và nộp lệ phí nếu có',note:'Lệ phí, miễn hoặc giảm theo quy định địa phương và hình thức nộp.'},
      {id:'receipt',label:'Lưu giấy tiếp nhận hoặc mã hồ sơ và lịch hẹn'},
    ],link:{label:'Mở Cổng Dịch vụ công quốc gia',url:'https://dichvucong.gov.vn/'},tip:profile.submission==='undecided'?'Chọn trực tuyến hoặc bộ phận tiếp nhận theo hướng dẫn địa phương. TaxHKD giúp chuẩn bị, không trực tiếp nhận hồ sơ đăng ký.':'TaxHKD giúp chuẩn bị; hồ sơ được nộp và giải quyết tại kênh chính thức.',source:'ND-168-2025-ND-CP'},
    {id:'result',short:'Nhận kết quả',title:'Theo dõi và nhận kết quả',description:'Theo dõi bằng mã hồ sơ. Nếu được yêu cầu bổ sung, sửa đúng nội dung trong thông báo.',tasks:[
      {id:'result-notice',label:'Đọc kết quả hoặc yêu cầu bổ sung của cơ quan tiếp nhận'},
      {id:'certificate',label:'Kiểm tra thông tin trên giấy chứng nhận được cấp'},
      {id:'linked',label:'Đối chiếu thông tin đăng ký thuế liên thông'},
    ],tip:'Điều 99 Nghị định 168/2025 quy định thời hạn xem xét 03 ngày làm việc kể từ ngày tiếp nhận hồ sơ. Việc bổ sung ảnh hưởng thời điểm nhận kết quả. Đăng ký hộ qua liên thông không mặc nhiên phải nộp thêm một hồ sơ đăng ký thuế lần đầu theo hạn 10 ngày.',source:'ND-168-2025-ND-CP'},after,
  ];
}
export interface GuideSaved { version:2; profile:GuideProfile; checked:string[]; activeStep:string }
export function readGuideSaved(raw:string|null):GuideSaved|null {
  try {
    const value=JSON.parse(raw||'null');
    if(value?.version!==2||!['new','existing','unsure'].includes(value.profile?.goal)||!['self','family'].includes(value.profile?.founder)||!['online','counter','undecided'].includes(value.profile?.submission))return null;
    const profile=value.profile as GuideProfile,steps=buildRegistrationGuide(profile);
    const allowed=new Set(steps.flatMap(step=>step.tasks.map(task=>task.id)));
    const checked:string[]=Array.isArray(value.checked)?value.checked.filter((id:unknown):id is string=>typeof id==='string'&&allowed.has(id)):[];
    return {version:2,profile,checked:[...new Set(checked)],activeStep:steps.some(step=>step.id===value.activeStep)?value.activeStep:steps[0]?.id||''};
  }catch{return null;}
}
