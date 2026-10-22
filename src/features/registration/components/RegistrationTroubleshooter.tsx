import { useState } from 'react';
import { Search, Wrench, Copy } from 'lucide-react';
import { auth } from '../../../services/firebase';

const issues = [
  { id: 'attachment', title: 'Giấy tờ đính kèm không hợp lệ nhưng không có ô tải tệp', tags: 'hồ sơ trả lại từ chối tài liệu', steps: ['Mở chi tiết thông báo trả hồ sơ, lưu nguyên văn lý do và mã hồ sơ. Thông báo chung chưa đủ để xác định giấy tờ nào sai.', 'Kiểm tra lại thủ tục, đối tượng và hình thức tự khai/khai thay đã chọn. Đối chiếu với hồ sơ thực tế; không đổi đối tượng chỉ để xuất hiện ô tải tệp.', 'Nếu đúng luồng mà vẫn không có ô đính kèm: chụp màn hình bước kê khai và thông báo, đề nghị cơ quan tiếp nhận chỉ rõ tên giấy tờ, nội dung sai và vị trí bổ sung.', 'Chỉ sửa theo hướng dẫn cụ thể của cơ quan tiếp nhận; kiểm tra trạng thái hồ sơ trước khi tạo hồ sơ mới.'], draft: 'Kính gửi cơ quan tiếp nhận hồ sơ,\nHồ sơ mã […] nhận thông báo: “Thông tin giấy tờ đính kèm không hợp lệ”. Tuy nhiên, tại bước kê khai của thủ tục […] không có mục tải tệp đính kèm. Kính đề nghị Quý cơ quan trả lời cụ thể giấy tờ hoặc trường thông tin nào chưa hợp lệ, nội dung cần sửa và cách bổ sung trên hệ thống. Tôi gửi kèm ảnh thông báo và màn hình kê khai để đối chiếu.\nTrân trọng.' },
  { id: 'identity', title: 'Thông tin căn cước, họ tên hoặc ngày sinh không khớp', tags: 'vneid định danh đăng nhập', steps: ['Đối chiếu thông tin hiển thị với giấy tờ và tài khoản định danh của chính người đăng ký.', 'Nếu ô cho phép sửa, nhập đúng thông tin thực tế rồi kiểm tra lại. Nếu ô bị khóa hoặc lấy tự động, ghi lại tên trường bị sai.', 'Liên hệ hỗ trợ của cổng hoặc cơ quan tiếp nhận để được hướng dẫn cập nhật nguồn dữ liệu. Không dùng tài khoản người khác để thay thế.'] },
  { id: 'otp', title: 'Không nhận được OTP hoặc mã hết hạn', tags: 'email sms điện thoại xác thực', steps: ['Đọc trên màn hình xem mã được gửi tới email hay số điện thoại nào; kiểm tra hộp thư rác nếu nhận qua email.', 'Chờ hết thời gian đếm ngược rồi dùng nút gửi lại nếu cổng cho phép. Nhập mã mới nhất, không dùng mã từ lần gửi trước.', 'Nếu vẫn không nhận được, kiểm tra thông tin liên hệ và liên hệ hỗ trợ trên cổng. Không gửi mật khẩu hay OTP cho người hỗ trợ.'] },
  { id: 'industry', title: 'Không tìm thấy mã ngành hoặc gợi ý ngành chưa đúng', tags: 'ngành nghề danh mục mã số', steps: ['Mô tả cụ thể sản phẩm/dịch vụ, bán lẻ hay bán buôn, tự bán hay nhận hoa hồng. Nếu có nhiều hoạt động, liệt kê riêng từng hoạt động.', 'Đối chiếu cả tên ngành và mô tả hoạt động, không chọn chỉ vì mã có số gần giống.', 'Nếu danh mục trên cổng khác với gợi ý, lưu tên và mã đang hiển thị để hỏi cơ quan tiếp nhận; không tự thay bằng ngành không phù hợp.'] },
  { id: 'submitted', title: 'Bấm nộp bị treo hoặc chưa biết hồ sơ đã gửi chưa', tags: 'trắng lỗi mạng thành công gửi lại', steps: ['Mở mục tra cứu hồ sơ và kiểm tra thông báo/email xác nhận trước khi bấm nộp lần nữa.', 'Nếu đã có mã hồ sơ, lưu mã và theo dõi trạng thái; thông báo tiếp nhận chưa đồng nghĩa hồ sơ đã được chấp thuận.', 'Nếu chưa có dấu vết tiếp nhận, lưu nội dung đã nhập và ảnh lỗi, kiểm tra kết nối rồi đăng nhập lại. Nếu lỗi lặp lại, gửi thời điểm thao tác và thông báo lỗi cho bộ phận hỗ trợ.'] },
  { id: 'tax-id', title: 'Hệ thống báo đã có mã số thuế hoặc đã đăng ký', tags: 'trùng mã 888 tồn tại cá nhân hộ', steps: ['Kiểm tra thông tin mã số thuế và trạng thái đăng ký đang có, thay vì tạo hồ sơ mới ngay.', 'Ghi rõ bạn đã có mã số thuế cá nhân, đăng ký thuế cho hoạt động kinh doanh hay giấy chứng nhận đăng ký hộ. Đây là các thông tin cần phân biệt.', 'Cung cấp tình trạng hiện tại và mục đích thay đổi cho cơ quan tiếp nhận để được hướng dẫn chọn thủ tục phù hợp. Không tự kết luận phải đăng ký lại chỉ từ thông báo trùng.'] },
];
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();

function AttachmentRejectionGuide() {
  const [office, setOffice] = useState('');
  const [confirmedOffice, setConfirmedOffice] = useState('');
  const [unknown, setUnknown] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [question, setQuestion] = useState('Email yêu cầu bạn liên hệ Thuế cơ sở nào?');
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function sendAnswer() {
    if(busy || !office.trim())return;
    setBusy(true);setError('');setConfirmedOffice('');setCopyStatus('');
    const next=[...answers,office.trim()];
    try {
      const token=await auth.currentUser?.getIdToken();
      if(!token)throw Error('Vui lòng đăng nhập để AI xác định cơ quan thuế.');
      const response=await fetch('/api/registration-guide/office',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({answers:next}),signal:AbortSignal.timeout(30000)});
      const result=await response.json();if(!response.ok)throw Error(result.error||'Chưa xác định được cơ quan.');
      setAnswers(next);setOffice('');setUnknown(false);
      if(result.status==='matched'){setConfirmedOffice(result.office.name);setEmail(result.office.email);}
      else if(result.status==='clarify')setQuestion(result.question);
      else setQuestion('Cơ quan này chưa có trong danh bạ hệ thống. Bạn hãy liên hệ theo thông tin ở email. Có thể nhập lại tên cơ quan và địa phương nếu cần đối chiếu.');
    }catch(e){setError(e instanceof Error?e.message:'AI tạm thời chưa sẵn sàng.');}
    finally{setBusy(false);}
  }
  const draft = `Kính gửi ${confirmedOffice},\nHồ sơ đăng ký thuế mã […] nhận thông báo: “Thông tin giấy tờ đính kèm không hợp lệ/không khớp đúng với tờ khai/văn bản đề nghị của NNT”.\nKính đề nghị Quý cơ quan cho biết cụ thể giấy tờ hoặc trường thông tin nào không hợp lệ, nội dung nào không khớp và cần sửa thành thông tin gì; đồng thời hướng dẫn cách bổ sung, điều chỉnh và nộp lại hồ sơ theo thông báo. Nếu thủ tục không hiển thị mục tải tệp đính kèm, đề nghị hướng dẫn vị trí hoặc phương thức bổ sung phù hợp.\nTôi sẽ cung cấp mã hồ sơ, thông báo và ảnh màn hình bước kê khai để đối chiếu.\nTrân trọng.`;
  return <div className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
    <p className="text-xs font-semibold text-emerald-700">Trợ lý AI · Tìm cơ quan trong danh bạ</p>
    {answers.map((answer,i)=><p key={i} className="rounded-lg bg-white p-2 text-sm">Bạn: {answer}</p>)}
    <p className="text-sm font-semibold">{question}</p>
    <p className="text-xs leading-relaxed text-slate-600">Xem dòng “Nếu có vướng mắc… hoặc liên hệ với…” ở cuối email. Nhập đầy đủ tên cơ quan và tỉnh/thành phố được ghi trong email.</p>
    <form onSubmit={e => { e.preventDefault(); void sendAnswer(); }} className="flex flex-wrap gap-2">
      <input aria-label="Thuế cơ sở được nhắc trong email" disabled={busy} maxLength={600} value={office} onChange={e => { setOffice(e.target.value); setConfirmedOffice(''); setCopyStatus(''); setUnknown(false); }} placeholder="Tên Thuế cơ sở và tỉnh/thành phố" className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm" />
      <button type="submit" disabled={!office.trim() || busy || answers.length>=6} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy?'AI đang đối chiếu…':'Gửi cho AI'}</button>
    </form>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {answers.length>0 && <button type="button" disabled={busy} onClick={()=>{setAnswers([]);setConfirmedOffice('');setOffice('');setQuestion('Email yêu cầu bạn liên hệ Thuế cơ sở nào?');setError('');setCopyStatus('');}} className="text-xs underline">Bắt đầu lại</button>}
    <button type="button" onClick={() => { setUnknown(true); setConfirmedOffice(''); setCopyStatus(''); }} className="text-xs font-semibold text-emerald-800 underline">Tôi không thấy tên cơ quan trong email</button>
    <div aria-live="polite">
      {unknown && <p className="mt-3 text-sm leading-relaxed">Mở toàn bộ email hoặc thông báo đính kèm để xem phần liên hệ cuối trang. Nếu vẫn không có tên, hãy kiểm tra cơ quan tiếp nhận trong mục tra cứu hồ sơ hoặc dùng kênh hỗ trợ trên cổng đã nộp. Chưa đủ thông tin để xác định Thuế cơ sở phụ trách.</p>}
      {confirmedOffice && <div className="mt-3 space-y-3 text-sm leading-relaxed">
        <p className="rounded-lg bg-white p-3"><strong>Cơ quan trong danh bạ: {confirmedOffice}</strong><br />{email ? <>Email: <a className="underline" href={`mailto:${email}`}>{email}</a></> : 'Email liên hệ: Đang chờ bổ sung vào danh bạ hệ thống. Hiện dùng thông tin liên hệ trong email thông báo.'}</p>
        <p>Bạn hãy liên hệ <strong>{confirmedOffice}</strong> theo địa chỉ hoặc kênh liên hệ ghi trong email. Cung cấp mã hồ sơ và hỏi rõ giấy tờ/trường thông tin nào không hợp lệ hoặc không khớp. Thông báo này chưa cho biết chính xác lỗi nằm ở đâu.</p>
        <p>Nếu không có mục đính kèm, nói rõ điều này và gửi ảnh màn hình cho cơ quan tiếp nhận. Sau khi được làm rõ, bổ sung hoặc điều chỉnh và nộp lại theo hướng dẫn trong thông báo.</p>
        <h3 className="font-semibold">Nội dung đề nghị gửi tới cơ quan thuế</h3>
        <p className="whitespace-pre-wrap rounded-lg bg-white p-3">{draft}</p>
        <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(draft); setCopyStatus('Đã sao chép. Điền mã hồ sơ vào […] trước khi gửi.'); } catch { setCopyStatus('Bạn có thể chọn và sao chép nội dung ở trên.'); } }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-white"><Copy size={16} />Sao chép nội dung</button>
        <p role="status" className="text-xs">{copyStatus}</p>
      </div>}
    </div>
  </div>;
}

export default function RegistrationTroubleshooter() {
  const [query, setQuery] = useState('');
  const matches = issues.filter(item => normalize(item.title + ' ' + item.tags + (item.id === 'attachment' ? ' không khớp tờ khai văn bản đề nghị 03-ĐK-TCT' : '')).includes(normalize(query.trim())));
  return <details className="mb-6 rounded-2xl border border-amber-200 bg-white shadow-sm">
    <summary className="flex cursor-pointer items-center gap-3 p-4 sm:p-5 focus-visible:outline-emerald-600">
      <Wrench className="shrink-0 text-amber-600" size={22} />
      <span className="flex-1"><strong className="block text-sm sm:text-base">Bạn đang gặp lỗi khi đăng ký?</strong><span className="text-xs text-slate-500">6 tình huống thường gặp · Cách kiểm tra và xử lý</span></span>
      <span className="text-xs font-semibold text-emerald-700">Xem hướng dẫn</span>
    </summary>
    <div className="border-t border-slate-100 p-4 sm:p-5">
      <label className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3"><Search size={18} className="text-slate-400" /><input aria-label="Tìm lỗi đăng ký" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm lỗi: đính kèm, OTP, mã ngành…" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" /></label>
      <p className="mb-4 text-xs leading-relaxed text-slate-500">Chọn tình huống gần với thông báo bạn nhận được. Các bước dưới đây giúp kiểm tra lỗi; nguyên nhân hồ sơ bị trả lại cần được cơ quan tiếp nhận xác nhận.</p>
      <div className="space-y-2">{matches.map(item => <details key={item.id} className="rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">{item.id === 'attachment' ? 'Thông tin giấy tờ đính kèm không hợp lệ / không khớp tờ khai' : item.title}</summary>
        {item.id === 'attachment' ? <AttachmentRejectionGuide /> : <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-600">{item.steps.map(step => <li key={step}>{step}</li>)}</ol>}
      </details>)}</div>
      {!matches.length && <p className="rounded-xl bg-slate-50 p-4 text-sm">Chưa có tình huống phù hợp. Thử từ khóa ngắn hơn hoặc chuẩn bị thông tin bên dưới để gửi cơ quan tiếp nhận.</p>}
      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed"><strong>Khi cần hỗ trợ, chuẩn bị:</strong> tên thủ tục, kênh Web/App, bước đang làm, nguyên văn thông báo, mã hồ sơ (nếu có) và ảnh màn hình. Che thông tin cá nhân khi chia sẻ công khai. Gửi qua kênh hỗ trợ hiển thị trên cổng hoặc cơ quan tiếp nhận hồ sơ.</div>
    </div>
  </details>;
}
