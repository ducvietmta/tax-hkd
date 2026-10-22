import { INDUSTRY_REFERENCE, REGISTRATION_SOURCES } from '../../../shared/taxRegistrationWorkflow';
import vsic from './data/vsic2025.json';
import { TAX_ONLINE_STEPS, TAX_APP_STEPS } from './data/taxOnlineSteps';

export type RegistrationKind = 'household' | 'individual';
export type SubmissionChannel = 'online' | 'app' | 'counter';
export type Answers = Record<string, string>;
export interface WizardState { answers: Answers; current: number; confirmed: string[] }
export interface QuestionOption {
  value: string;
  label: string;
  detail?: string;
  locked?: boolean;
  badge?: string;
}
export interface Question {
  id: string; title: string; help: string; section: string;
  type?: 'text' | 'date' | 'email' | 'tel' | 'industry' | 'confirm'; optional?: boolean;
  options?: readonly QuestionOption[];
}
export const WIZARD_VERSION = '2026-10-20.1';
export const SOURCES = {
  tax: REGISTRATION_SOURCES[0].url, industry: REGISTRATION_SOURCES[1].url,
  household: 'https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-168-2025-nd-cp-ve-dang-ky-doanh-nghiep-119250702175708554.htm',
  householdForm: 'https://vanban.chinhphu.vn/?classid=1&docid=214411&pageid=27160&typegroupid=6',
  householdAmendment: 'https://chinhphu.vn/?classid=1&docid=218986&pageid=27160',
  formAmendment: 'https://chinhphu.vn/?docid=219269&pageid=27160',
  onlineHousehold: 'https://dangkykinhdoanh.gov.vn/vn/tin-tuc/611/6558/huong-dan-su-dung-he-thong-thong-tin-dang-ky-ho-kinh-doanh-tren-moi-truong-dien-tu.aspx',
};
export const COMPARISON = [
  { title: 'Hộ kinh doanh', text: 'Đăng ký thành lập hộ kinh doanh; một cá nhân hoặc các thành viên hộ gia đình có thể thành lập. Làm tại cơ quan đăng ký kinh doanh cấp xã nơi đặt trụ sở, có liên thông đăng ký thuế. Chủ hộ và thành viên theo trường hợp chịu trách nhiệm bằng toàn bộ tài sản; không phải doanh nghiệp có tư cách pháp nhân.' },
  { title: 'Cá nhân kinh doanh', text: 'Ở đây là đăng ký thuế trực tiếp cho cá nhân thuộc đối tượng áp dụng. Đây là khái niệm quản lý thuế, không phải một giấy phép kinh doanh thứ hai để tùy chọn thay đăng ký hộ. Một người kinh doanh hoặc bán online không tự động được miễn đăng ký hộ.' },
];
export const INDUSTRY_CATALOG = {
  version: vsic.version, effectiveFrom: vsic.effectiveFrom, source: vsic.source,
  coverage: `${vsic.rows.length} mã ngành cấp 4 từ cổng đăng ký kinh doanh, theo QĐ36/2025.`,
  rows: vsic.rows.map(row => {
    const reference=INDUSTRY_REFERENCE.find(item=>item[0]===row.code);
    return {...row,code5:reference?.[1],page:reference?.[3]};
  }),
};
export function fold(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim(); }
/** A catalogue search, never a legal or semantic classifier. The user confirms the code. */
export function searchIndustries(query: string) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return INDUSTRY_CATALOG.rows.filter(row => words.every(word => fold(`${row.code} ${row.code5} ${row.name}`).includes(word)));
}
const yesNo = [{ value: 'yes', label: 'Có' }, { value: 'no', label: 'Không' }] as const;
export function questions(a: Answers): Question[] {
  const q: Question[] = [
    { id: 'kind', section: 'Chọn thủ tục', title: 'Bạn muốn chuẩn bị thủ tục nào?', help: 'Chọn thủ tục phù hợp; mở phần phân biệt bên dưới nếu cần. Lựa chọn này không phải kết luận rằng bạn được miễn đăng ký hộ.', options: [{ value: 'household', label: 'Hộ kinh doanh', detail: 'Đăng ký thành lập hộ và liên thông thuế', locked: true, badge: 'Sắp ra mắt' }, { value: 'individual', label: 'Cá nhân kinh doanh', detail: 'Đăng ký thuế trực tiếp với cơ quan thuế' }] },
    {
      id: 'channel',
      section: 'Cách nộp',
      title: a.kind === 'individual'
        ? 'Bạn muốn nộp online qua Web hay qua App?'
        : 'Bạn muốn nộp online hay trực tiếp?',
      help: a.kind === 'individual'
        ? 'TAX HKD hỗ trợ 2 kênh nộp online chính thức: qua Web (Dịch Vụ Công Thuế Nhà Nước) hoặc qua App (eTax Mobile trên điện thoại).'
        : 'Online: tự xác thực và nộp trên cổng chính thức, theo phương thức cổng hỗ trợ. Trực tiếp: chuẩn bị bản giấy, ký và mang đến nơi tiếp nhận.',
      options: a.kind === 'individual'
        ? [
            { value: 'online', label: 'Nộp online qua Web', detail: 'Dịch Vụ Công Thuế Nhà Nước (dichvucong.gdt.gov.vn/tthc/homelogin) qua VNeID' },
            { value: 'app', label: 'Nộp online qua App', detail: 'Ứng dụng eTax Mobile của Tổng cục Thuế trên iOS/Android qua VNeID' },
          ]
        : [
            { value: 'online', label: 'Nộp online', detail: 'Cổng dịch vụ công đăng ký kinh doanh' },
            { value: 'counter', label: 'Nộp trực tiếp', detail: 'UBND cấp xã/huyện nơi đặt trụ sở' },
          ],
    },
  ];
  if (!a.kind || !a.channel) return q;
  if (isQuickOnlineRegistration(a)) return [...q,
    {id:'activity',section:'Ngành nghề',title:'Bạn muốn đăng ký ngành nghề gì?',help:'Mô tả công việc thực tế, sản phẩm hoặc dịch vụ bạn cung cấp. AI chỉ dùng mô tả này để gợi ý mã trong danh mục đã lưu.'},
    {id:'industry',section:'Mã ngành',title:'Kiểm tra mã ngành được gợi ý.',help:'Xác nhận mã phù hợp với hoạt động thực tế hoặc sửa mô tả nếu chưa đúng.',type:'industry'},
    {id:'finish',section:a.channel==='app'?'Mở App eTax Mobile':'Mở cổng đăng ký',title:a.channel==='app'?'Bạn có thể tiếp tục trên ứng dụng eTax Mobile.':'Bạn có thể tiếp tục trên cổng chính thức.',help:a.channel==='app'?'Mã ngành là thông tin để đối chiếu khi kê khai. Bạn mở ứng dụng eTax Mobile để đăng nhập và nộp hồ sơ; website này không gửi hồ sơ thay bạn.':'Mã ngành chỉ là thông tin để đối chiếu khi kê khai. Bạn tự đăng nhập, điền và nộp hồ sơ trên cổng; website này chưa gửi hồ sơ thay bạn.',type:'confirm'},
  ];
  q.push({ id: 'scope', section: 'Đúng trường hợp', title: 'Bạn đang đăng ký mới hay đã đăng ký hoạt động này?', help: 'Wizard này chuẩn bị hồ sơ đăng ký mới. Nếu đã có đăng ký kinh doanh/thuế cho hoạt động này, cần làm thủ tục thay đổi, không tạo hồ sơ đăng ký trùng.', options: [{ value: 'new', label: 'Đăng ký mới', detail: 'Có MST từ tiền lương vẫn có thể cần bổ sung hoạt động kinh doanh' }, { value: 'existing', label: 'Đã đăng ký hoạt động này' }] });
  if (a.scope === 'existing') return [...q, { id: 'existingHelp', section: 'Thủ tục thay đổi', title: 'Bạn cần hướng dẫn thay đổi thông tin.', help: 'Giữ đăng ký hiện có và kiểm tra thủ tục thay đổi tương ứng. Không nộp hồ sơ đăng ký mới hoặc xin mã số thuế cá nhân thứ hai.', type: 'confirm' }];
  q.push({ id: 'identityScope', section: 'Đúng biểu mẫu', title: 'Bạn là công dân Việt Nam có số định danh và dữ liệu dân cư?', help: 'Các trường điền sẵn trong luồng này áp dụng cho trường hợp này. Trường hợp khác cần biểu mẫu và giấy tờ định danh tương ứng.', options: yesNo });
  if (a.identityScope === 'no') return [...q, { id: 'specialHelp', section: 'Hồ sơ riêng', title: 'Trường hợp của bạn cần nhánh định danh khác.', help: 'Đối chiếu hồ sơ với cơ quan tiếp nhận; không dùng mẫu điền sẵn dành cho công dân có dữ liệu dân cư. Bạn vẫn tải được mẫu gốc bên cạnh.', type: 'confirm' }];
  if (a.kind === 'household') q.push({ id: 'founder', section: 'Chủ thể thành lập', title: 'Ai cùng thành lập hộ kinh doanh?', help: 'Một cá nhân vẫn có thể thành lập hộ kinh doanh. Hộ do các thành viên gia đình thành lập cần thêm thông tin và văn bản ủy quyền theo trường hợp.', options: [{ value: 'solo', label: 'Một cá nhân' }, { value: 'family', label: 'Các thành viên gia đình' }] });
  q.push(
    { id: 'province', section: 'Nơi đăng ký', title: 'Bạn đăng ký tại tỉnh hoặc thành phố nào?', help: 'Ghi tên đơn vị hành chính hiện tại nơi đặt trụ sở; nhánh thuế không có địa điểm cố định dùng nơi cư trú.' },
    { id: 'commune', section: 'Nơi đăng ký', title: 'Xã, phường hoặc đặc khu nào?', help: 'Ghi theo địa chỉ hành chính hiện tại. Cần tra địa chỉ cơ quan trên cổng chính thức, không tự suy địa chỉ từ tên xã.' },
    { id: 'fixed', section: 'Nơi đăng ký', title: 'Bạn có kinh doanh tại địa điểm cố định không?', help: 'Làm online hay đến nhà khách hàng chưa đủ để kết luận không có trụ sở cố định.', options: yesNo },
    { id: 'activity', section: 'Ngành nghề', title: 'Bạn thực tế sẽ bán hàng hoặc làm dịch vụ gì?', help: 'Nêu rõ sản phẩm, dịch vụ và cách nhận tiền. Ví dụ: sửa máy tính cho khách, có bán riêng phụ tùng hay không. Không chỉ ghi “online” hoặc tên nền tảng.' },
    { id: 'industry', section: 'Ngành nghề', title: 'Xác nhận mã ngành được gợi ý.', help: 'AI dùng mô tả của bạn để chọn trong danh mục đã lưu. Kiểm tra mã và tên ngành trước khi xác nhận; nếu chưa rõ, bổ sung thông tin hoặc chọn lại từ danh mục.', type: 'industry' },
  );
  if (a.kind === 'individual') q.push({ id: 'rentalOnly', section: 'Nơi đăng ký', title: 'Bạn chỉ có hoạt động cho thuê bất động sản?', help: 'Trường hợp này nơi nộp gắn với bất động sản, khác quy tắc trụ sở/nơi cư trú thông thường.', options: yesNo });
  q.push({ id: 'details', section: 'Thông tin hồ sơ', title: a.channel === 'counter' ? 'Chuẩn bị thông tin để điền hồ sơ in.' : 'Chuẩn bị thông tin trước khi mở cổng.', help: 'Nhập trong các ô ngay bên dưới. Dữ liệu chỉ giữ trong phiên trên thiết bị, không gửi tới mô hình AI. Không nhập mật khẩu, OTP hoặc PIN.', type: 'confirm' });
  if (a.channel === 'online' && a.kind === 'individual') {
    q.push(...TAX_ONLINE_STEPS.map((step,index):Question => ({...step,section:`Web DVC ${index+1}/17`,type:step.id==='receipt'?undefined:'confirm',...(step.id==='receipt'?{options:[{value:'received',label:'Đã có biên nhận'},{value:'pending',label:'Chưa có / cổng lỗi'}]}:{})})));
  } else if (a.channel === 'app' && a.kind === 'individual') {
    q.push(...TAX_APP_STEPS.map((step,index):Question => ({...step,section:`App eTax ${index+1}/${TAX_APP_STEPS.length}`,type:'confirm'})));
  } else if (a.channel === 'online') q.push(
    { id: 'login', section: 'Đăng nhập', title: 'Mở cổng và tự đăng nhập.', help: 'Kiểm tra đúng tên miền chính thức. Thông tin xác thực chỉ nhập trên cổng. Chọn “Đã thực hiện” khi bạn đã đăng nhập được.', type: 'confirm' },
    { id: 'procedure', section: 'Chọn thủ tục', title: 'Chọn đúng thủ tục và cơ quan tiếp nhận.', help: a.kind === 'household' ? 'Tìm đăng ký thành lập hộ kinh doanh và địa phương nơi đặt trụ sở. Đọc hướng dẫn đang được cổng công bố.' : 'Tìm đăng ký thuế lần đầu cho hộ gia đình, cá nhân kinh doanh đăng ký trực tiếp với cơ quan thuế. Nếu đã có MST, đối chiếu việc bổ sung hoạt động, không xin MST thứ hai.', type: 'confirm' },
    { id: 'declare', section: 'Kê khai', title: 'Điền các thông tin đã chuẩn bị và kiểm tra lại.', help: 'Đối chiếu từng chỉ tiêu bên cạnh với màn hình thật; không đoán ý nghĩa trường nếu cổng đã đổi. Với 03-ĐKT, ngành nghề là hoạt động thực tế; mã quản lý thuế không phải mã VSIC.', type: 'confirm' },
    { id: 'attachments', section: 'Đính kèm', title: 'Đính kèm đúng giấy tờ được yêu cầu.', help: 'Chỉ tải các giấy tờ áp dụng cho hồ sơ của bạn. Không mặc định mọi người đều phải nộp bản sao căn cước; xem yêu cầu khai thác dữ liệu và thành phần hồ sơ hiện hành.', type: 'confirm' },
    { id: 'submit', section: 'Xác thực và nộp', title: 'Kiểm tra toàn bộ hồ sơ trước khi tự nộp trên cổng.', help: 'Đọc cam kết, xác thực/ký theo phương thức cổng hỗ trợ, nộp lệ phí nếu áp dụng. Website này không tự ký hay gửi hồ sơ thay bạn.', type: 'confirm' },
    { id: 'receipt', section: 'Biên nhận', title: 'Bạn đã nhận được mã hồ sơ hoặc giấy tiếp nhận chưa?', help: 'Chỉ đánh dấu khi cổng thực sự cấp biên nhận. Nếu lỗi/bảo trì, lưu nháp tại cổng nếu có và quay lại; không đánh dấu đã nộp.', options: [{ value: 'received', label: 'Đã có biên nhận' }, { value: 'pending', label: 'Chưa có / cổng lỗi' }] },
  );
  q.push({ id: 'finish', section: 'Hoàn tất chuẩn bị', title: (a.channel === 'online' || a.channel === 'app') ? 'Theo dõi hồ sơ và nhận kết quả.' : 'Kiểm tra, tải hồ sơ và chuẩn bị đi nộp.', help: 'Giữ hồ sơ, biên nhận và thông báo bổ sung. Hoàn tất hướng dẫn trên website không đồng nghĩa cơ quan đã chấp thuận đăng ký.', type: 'confirm' });
  return q;
}
export function initialWizard(): WizardState { return { answers: {}, current: 0, confirmed: [] }; }
export function isQuickOnlineRegistration(a: Answers) { return a.kind==='individual' && ['online','app'].includes(a.channel); }
export function selectedIndustryRows(a:Answers){
  let codes:unknown;
  try{codes=JSON.parse(a.industryCodes||'null');}catch{}
  const selected=Array.isArray(codes)&&codes.length<=8?codes:[a.industry];
  return [...new Set(selected)].flatMap(code=>{const row=INDUSTRY_CATALOG.rows.find(item=>item.code===code);return row?[row]:[];});
}
export function validateAnswer(q: Question, value: string): string | null {
  const v = value.trim();
  if (!v && !q.optional) return 'Bạn cần bổ sung mục này trước khi tiếp tục.';
  if (v.length > 1200) return 'Vui lòng rút gọn còn tối đa 1.200 ký tự.';
  if (q.options && !q.options.some(o => o.value === v)) return 'Hãy chọn một trong các lựa chọn đang hiển thị.';
  if (q.type === 'industry' && !INDUSTRY_CATALOG.rows.some(r => r.code === v)) return 'Mã chưa có trong danh mục đã đối chiếu. Hãy mở nguồn chính thức; hệ thống không tự đoán mã.';
  return null;
}
export function answerQuestion(state: WizardState, value: string): WizardState {
  const list = questions(state.answers), q = list[state.current];
  if (!q || validateAnswer(q, value)) return state;
  const changed = state.answers[q.id] !== value.trim();
  const answers = { ...state.answers, [q.id]: value.trim() };
  if (changed && q.id === 'activity') {delete answers.industry;delete answers.industryCodes;}
  // Keep reusable answers, but require explicit reconfirmation of every later step.
  let confirmed = changed ? state.confirmed.filter(id => list.findIndex(x => x.id === id) < state.current) : state.confirmed;
  confirmed = [...new Set([...confirmed, q.id])];
  const nextList = questions(answers);
  return { answers, confirmed, current: Math.min(state.current + 1, nextList.length - 1) };
}
export function recipient(a: Answers): string {
  const area = [a.commune, a.province].filter(Boolean).join(', ');
  if (a.kind === 'household') return `Cơ quan đăng ký kinh doanh cấp xã nơi đặt trụ sở${area ? ` (${area})` : ''}. Kiểm tra địa chỉ và giờ tiếp nhận trên cổng địa phương.`;
  if (a.rentalOnly === 'yes') return 'Thuế cơ sở nơi có bất động sản cho thuê; nhiều bất động sản ở các nơi khác nhau được lựa chọn một trong các nơi có bất động sản. Đối chiếu địa bàn cụ thể trước khi nộp.';
  return `Thuế cơ sở ${a.fixed === 'no' ? 'nơi cư trú' : 'nơi đặt trụ sở chính'}${area ? ` (${area})` : ''}. Tra địa chỉ tiếp nhận chính thức trước khi đi.`;
}
export function portal(a: Answers) {
  if (a.kind === 'household') return 'https://dichvucong.gov.vn/';
  if (a.channel === 'app') return 'https://canhan.gdt.gov.vn';
  return 'https://dichvucong.gdt.gov.vn/tthc/homelogin';
}
export interface DetailField { id: string; label: string; help: string; optional?: boolean; type?: string }
export function detailFields(a: Answers): DetailField[] {
  const count=Math.max(2,Math.min(10,Number(a.memberCount)||2));
  return [
    { id: 'fullName', label: 'Họ và tên', help: 'Ghi IN HOA, đúng dữ liệu căn cước.' },
    { id: 'birthDate', label: 'Ngày sinh', help: 'Đối chiếu căn cước/dữ liệu dân cư.', type: 'date' },
    { id: 'personalId', label: 'Số định danh cá nhân', help: '12 chữ số trên căn cước; chỉ xử lý trên thiết bị.', type: 'text' },
    ...(a.kind === 'household' ? [{ id: 'gender', label: 'Giới tính', help: 'Ghi đúng thông tin định danh.' }] : []),
    { id: 'phone', label: 'Điện thoại liên hệ', help: 'Số đang dùng để nhận thông báo.', optional: true, type: 'tel' },
    { id: 'email', label: 'Email', help: 'Email bạn theo dõi; để trống nếu không có.', optional: true, type: 'email' },
    { id: 'businessName', label: a.kind === 'household' ? 'Tên hộ kinh doanh bằng tiếng Việt' : 'Tên cửa hàng / thương hiệu (nếu có)', help: a.kind === 'household' ? 'Gồm “Hộ kinh doanh” và tên riêng; kiểm tra tên không trùng, đáp ứng quy định.' : 'Tên hoạt động thực tế; không tự đặt tên để điền đủ ô.', optional: a.kind !== 'household' },
    { id: 'street', label: 'Số nhà, đường / thôn, tổ', help: a.fixed === 'no' ? 'Ghi nơi cư trú khi không có địa điểm kinh doanh cố định.' : 'Ghi địa chỉ trụ sở thực tế; riêng cho thuê bất động sản ghi địa chỉ tài sản.' },
    { id: 'noticeStreet', label: 'Địa chỉ nhận thông báo khác: số nhà / đường', help: 'Chỉ điền khi khác trụ sở; các mục xã và tỉnh phía dưới phải điền cùng.', optional: true },
    { id: 'noticeCommune', label: 'Xã / phường nhận thông báo khác', help: 'Để trống nếu không có địa chỉ nhận thông báo riêng.', optional: true },
    { id: 'noticeProvince', label: 'Tỉnh / thành phố nhận thông báo khác', help: 'Để trống nếu không có địa chỉ nhận thông báo riêng.', optional: true },
    { id: 'startDate', label: 'Ngày bắt đầu hoạt động', help: a.kind === 'household' ? 'Nếu dự kiến từ ngày được cấp giấy chứng nhận thì để trống.' : 'Ngày bắt đầu hoạt động thực tế, không tự lấy ngày hôm nay.', optional: a.kind === 'household', type: 'date' },
    ...(a.kind === 'individual' ? [
      { id: 'previousId', label: 'Số định danh đã cấp trước đó', help: 'Chỉ điền nếu được xác lập lại số định danh.', optional: true },
      { id: 'personalAccount', label: 'Số tài khoản cá nhân', help: 'Kê khai theo I.7; để trống nếu không có.', optional: true },
      { id: 'personalAccountOwner', label: 'Tên chủ tài khoản cá nhân', help: 'Đúng tên tại ngân hàng.', optional: true },
      { id: 'personalBank', label: 'Tên ngân hàng cá nhân', help: 'Ghi tương ứng tài khoản ở trên.', optional: true },
      { id: 'businessAccount', label: 'Số tài khoản kinh doanh', help: 'Kê khai theo III.6; để trống nếu không có.', optional: true },
      { id: 'businessAccountOwner', label: 'Tên chủ tài khoản kinh doanh', help: 'Đúng tên tại ngân hàng.', optional: true },
      { id: 'businessBank', label: 'Tên ngân hàng kinh doanh', help: 'Ghi tương ứng tài khoản ở trên.', optional: true },
    ] : [
      { id: 'capital', label: 'Vốn kinh doanh (VNĐ)', help: 'Tổng vốn thực tế đăng ký, ghi bằng số.', type: 'text' },
      { id: 'capitalWords', label: 'Vốn kinh doanh bằng chữ', help: 'Ghi đúng số tiền phía trên, đơn vị đồng.' },
      { id: 'workers', label: 'Tổng số lao động dự kiến', help: 'Ghi số người theo thực tế, không tự đặt số.' },
      ...(a.founder==='family' ? [
        {id:'memberCount',label:'Tổng số thành viên cùng thành lập (gồm chủ hộ)',help:'Từ 2 đến 10 thành viên trong luồng này. Chủ hộ được lấy từ thông tin đã điền.'},
        ...Array.from({length:count-1},(_,i)=>[
          {id:`member${i+1}Name`,label:`Thành viên ${i+2}: họ tên`,help:'Đúng dữ liệu căn cước; không ghi lại chủ hộ.'},
          {id:`member${i+1}BirthDate`,label:`Thành viên ${i+2}: ngày sinh`,help:'Đối chiếu dữ liệu dân cư.',type:'date'},
          {id:`member${i+1}Id`,label:`Thành viên ${i+2}: số định danh`,help:'12 chữ số; chỉ giữ trên thiết bị.'},
          {id:`member${i+1}Gender`,label:`Thành viên ${i+2}: giới tính`,help:'Đúng dữ liệu định danh. Các thành viên ký tại bảng thành viên khi in.'},
        ]).flat(),
      ] : []),
    ]),
  ];
}
export function detailErrors(a: Answers): string[] {
  const errors = detailFields(a).filter(f => !f.optional && !a[f.id]?.trim()).map(f => `Thiếu ${f.label.toLowerCase()}.`);
  if (a.personalId && !/^\d{12}$/.test(a.personalId)) errors.push('Số định danh phải gồm 12 chữ số.');
  if (a.previousId && !/^\d{12}$/.test(a.previousId)) errors.push('Số định danh trước đây phải gồm 12 chữ số.');
  if (a.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) errors.push('Email chưa đúng định dạng.');
  if ([a.noticeStreet,a.noticeCommune,a.noticeProvince].some(Boolean) && ![a.noticeStreet,a.noticeCommune,a.noticeProvince].every(Boolean)) errors.push('Địa chỉ nhận thông báo riêng cần đủ số nhà/đường, xã/phường và tỉnh.');
  for (const prefix of ['personal','business']) if ([a[`${prefix}Account`],a[`${prefix}AccountOwner`],a[`${prefix}Bank`]].some(Boolean) && ![a[`${prefix}Account`],a[`${prefix}AccountOwner`],a[`${prefix}Bank`]].every(Boolean)) errors.push('Thông tin tài khoản cần đủ số tài khoản, chủ tài khoản và ngân hàng.');
  for (const id of ['birthDate', 'startDate']) if (a[id]) {
    const d = new Date(a[id]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a[id]) || !Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== a[id]) errors.push('Ngày không hợp lệ.');
    if (id === 'birthDate' && d.getTime() > Date.now()) errors.push('Ngày sinh không thể nằm trong tương lai.');
  }
  if (a.kind === 'household' && a.capital && !/^\d+$/.test(a.capital)) errors.push('Vốn bằng số chỉ gồm chữ số, không có dấu phân cách.');
  if (a.kind === 'household' && a.workers && !/^\d+$/.test(a.workers)) errors.push('Số lao động phải là số nguyên không âm.');
  if (a.kind === 'household' && a.businessName && !/^ho kinh doanh\s+\S/.test(fold(a.businessName))) errors.push('Tên bằng tiếng Việt cần gồm “Hộ kinh doanh” và tên riêng của hộ.');
  if(a.founder==='family'){
    if(!/^(?:[2-9]|10)$/.test(a.memberCount||''))errors.push('Số thành viên cần từ 2 đến 10; trường hợp nhiều hơn cần mở rộng mẫu gốc.');
    const ids=[a.personalId];
    for(let i=1;i<Math.min(10,Number(a.memberCount)||2);i++){
      const id=a[`member${i}Id`],date=a[`member${i}BirthDate`];
      if(id&&!/^\d{12}$/.test(id))errors.push(`Số định danh thành viên ${i+1} cần đủ 12 chữ số.`);
      if(id&&ids.includes(id))errors.push('Thành viên không được trùng số định danh.');
      ids.push(id);
      if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(new Date(date).getTime())||new Date(date).toISOString().slice(0,10)!==date||new Date(date).getTime()>Date.now()))errors.push(`Ngày sinh thành viên ${i+1} không hợp lệ.`);
    }
  }
  return errors;
}
