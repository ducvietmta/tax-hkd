import { Check, ChevronRight, FileText, LockKeyhole, Upload } from 'lucide-react';
import type { Answers } from './wizardModel';

export function mockupPhase(step: string) {
  if (step === 'login') return 'login';
  if (step === 'procedure') return 'procedure';
  if (step === 'attachments') return 'attachments';
  if (step === 'submit') return 'submit';
  if (['receipt', 'finish'].includes(step)) return 'receipt';
  if (['details', 'declare'].includes(step)) return 'declare';
  return 'prepare';
}

/** An expressly labelled product illustration, never an asserted portal capture. */
export default function PortalMockup({ step, answers }: { step: string; answers: Answers }) {
  const phase = mockupPhase(step);
  const household = answers.kind === 'household';
  const formName = household ? 'Đăng ký thành lập hộ kinh doanh' : 'Đăng ký thuế trực tiếp · 03-ĐKT';

  return (
    <figure className="rw-mockup p-4 sm:p-6" aria-label={`Hình minh họa bước ${phase}`}>
      <figcaption className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
            MINH HỌA THAO TÁC CỔNG DỊCH VỤ CÔNG
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Không phải screenshot cổng thực tế. Vị trí và tên chức năng có thể khác trên cổng tùy địa phương.
        </p>
      </figcaption>

      <div className="rw-mock-browser rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="rw-mock-address flex items-center gap-2 bg-slate-100 px-4 py-2.5 border-b border-slate-200">
          <div className="flex items-center gap-1.5">
            <i className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
            <i className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            <i className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
          </div>
          <span className="flex-1 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-center gap-2 font-mono">
            <LockKeyhole size={12} className="text-emerald-600" />
            {household ? 'https://dichvucong.gov.vn' : 'https://dichvucong.gdt.gov.vn'}
          </span>
        </div>

        <div className="rw-mock-banner flex items-center gap-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4">
          <span className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center text-xs font-black shrink-0">
            DVC
          </span>
          <div>
            <b className="text-sm sm:text-base font-bold tracking-wide block">DỊCH VỤ CÔNG TRỰC TUYẾN</b>
            <small className="text-xs text-slate-400 block mt-0.5">Quy trình từng bước · Dữ liệu minh họa</small>
          </div>
        </div>

        <div className="rw-mock-content p-5 sm:p-6 bg-white min-h-[18rem]">
          {phase === 'prepare' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-800">
                <FileText className="rw-mock-icon shrink-0 text-emerald-600" size={26} />
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 m-0">Chuẩn bị trước khi mở cổng</h3>
              </div>
              <p className="text-sm text-slate-600">Rà soát sẵn các thông tin sau để điền nhanh và chính xác:</p>
              <div className="space-y-2.5">
                {['Thông tin định danh cá nhân / chủ hộ', 'Địa chỉ và ngành nghề kinh doanh thực tế', 'Giấy tờ đính kèm theo quy định từng trường hợp'].map((s, i) => (
                  <div key={s} className="rw-mock-line p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center gap-3 text-sm sm:text-base font-medium text-slate-800">
                    <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === 'login' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-800">
                <LockKeyhole className="rw-mock-icon shrink-0 text-emerald-600" size={26} />
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 m-0">Đăng nhập / Xác thực</h3>
              </div>
              <p className="text-sm sm:text-base text-slate-600">Tự thực hiện đăng nhập an toàn trên cổng chính thức:</p>
              <div className="rw-mock-input p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm sm:text-base font-medium text-slate-700">
                Phương thức xác thực: Định danh điện tử (VNeID) / Tài khoản Cổng DVC
              </div>
              <div className="rw-mock-action p-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2">
                <span>Tiếp tục trên cổng</span>
                <ChevronRight size={16} />
              </div>
              <small className="block text-xs text-slate-500 italic">
                Lưu ý: Tuyệt đối không nhập OTP, mật khẩu hay mã định danh tại TaxHKD.
              </small>
            </div>
          )}

          {phase === 'procedure' && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 m-0">Tìm đúng thủ tục đăng ký</h3>
              <div className="rw-mock-input p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm sm:text-base font-bold text-emerald-800">
                {formName}
              </div>
              <div className="rw-mock-result p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
                <FileText size={22} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <b className="text-sm sm:text-base text-slate-900 font-bold block">{formName}</b>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">Chọn địa phương và cơ quan tiếp nhận hồ sơ theo thẩm quyền.</p>
                </div>
              </div>
              <div className="rw-mock-line p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-sm sm:text-base text-slate-800 font-medium">
                <Check size={18} className="text-emerald-600 shrink-0" />
                <span>Đọc kỹ điều kiện đối tượng và thành phần hồ sơ trước khi bấm Bắt đầu</span>
              </div>
            </div>
          )}

          {phase === 'declare' && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 m-0">Kê khai thông tin hồ sơ</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  ['Họ và tên', 'Theo dữ liệu định danh công dân'],
                  ['Số định danh cá nhân', 'Tự động điền hoặc nhập số Căn cước'],
                  ['Địa chỉ kinh doanh', 'Số nhà, đường phố, phường/xã thực tế'],
                  ['Ngành nghề kinh doanh', 'Mã ngành đã xác nhận trong danh mục'],
                ].map(([label, desc], i) => (
                  <div key={label} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        {i + 1}
                      </span>
                      {label}:
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      {desc}
                    </span>
                  </div>
                ))}
              </div>
              <small className="block text-xs text-slate-400 mt-2">
                Dữ liệu chỉ minh họa thao tác, hệ thống không lưu trữ thông tin cá nhân.
              </small>
            </div>
          )}

          {phase === 'attachments' && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 m-0">Giấy tờ đính kèm hồ sơ</h3>
              <div className="rw-mock-upload p-6 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-center space-y-2">
                <Upload size={32} className="mx-auto text-emerald-600" />
                <p className="text-sm sm:text-base font-bold text-slate-900">Chỉ tải các giấy tờ mà thủ tục yêu cầu</p>
                <small className="block text-xs text-slate-500">Định dạng PDF/ảnh hợp lệ, dung lượng theo quy định của cổng.</small>
              </div>
              <div className="rw-mock-result p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <FileText size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <b className="text-sm sm:text-base text-slate-900 font-bold">Kiểm tra tài liệu trước khi gửi</b>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Hình ảnh rõ nét, đầy đủ số trang, không bị mất góc hay mờ chữ.</p>
                </div>
              </div>
            </div>
          )}

          {phase === 'submit' && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 m-0">Rà soát kỹ trước khi nộp</h3>
              <div className="space-y-2.5">
                {[
                  'Thông tin kê khai đúng thực tế và định danh',
                  'Giấy tờ đính kèm đã đủ và đúng định dạng',
                  'Đọc kỹ cam kết và tự ký số / xác thực OTP',
                  'Nộp lệ phí đăng ký (nếu thủ tục có áp dụng)',
                ].map((s, i) => (
                  <div key={s} className="rw-mock-line p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center gap-3 text-sm sm:text-base text-slate-800 font-medium">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <div className="rw-mock-action p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm">
                <span>Tự xác nhận và nộp hồ sơ trên cổng</span>
                <ChevronRight size={16} />
              </div>
            </div>
          )}

          {phase === 'receipt' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-800">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check size={24} />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 m-0">Lưu biên nhận hồ sơ</h3>
              </div>
              <div className="rw-mock-receipt p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 text-center space-y-1.5">
                <small className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                  MÃ HỒ SƠ BIÊN NHẬN (MINH HỌA)
                </small>
                <b className="text-xl sm:text-2xl font-mono font-black text-slate-900 tracking-wider block">
                  HS-XXXXXXXX
                </b>
                <p className="text-xs sm:text-sm text-slate-600">
                  Chỉ xác nhận hoàn thành khi cổng dịch vụ công đã cấp mã tiếp nhận thật.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                <ChevronRight size={16} className="text-emerald-600 shrink-0" />
                <span>Theo dõi thông báo xử lý hoặc yêu cầu sửa đổi, bổ sung trên cổng.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="rw-mock-caption mt-3 text-center text-xs text-slate-500">
        {formName} · {household ? 'Đối chiếu cổng dịch vụ công địa phương' : 'Đối chiếu hướng dẫn thủ tục trên cổng Thuế'}
      </p>
    </figure>
  );
}
