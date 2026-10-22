import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, CreditCard, RotateCcw, Copy, Check } from 'lucide-react';

export type PolicyType = 'privacy' | 'terms' | 'payment' | 'refund';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPolicy?: PolicyType;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  onClose,
  initialPolicy = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<PolicyType>(initialPolicy);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialPolicy) {
      setActiveTab(initialPolicy);
    }
  }, [initialPolicy, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const tabs = [
    { id: 'privacy' as PolicyType, label: 'Chính sách bảo mật', icon: ShieldCheck, hash: '#/chinh-sach-bao-mat' },
    { id: 'terms' as PolicyType, label: 'Điều khoản dịch vụ', icon: FileText, hash: '#/dieu-khoan-su-dung' },
    { id: 'payment' as PolicyType, label: 'Chính sách thanh toán', icon: CreditCard, hash: '#/chinh-sach-thanh-toan' },
    { id: 'refund' as PolicyType, label: 'Hoàn tiền & Khiếu nại', icon: RotateCcw, hash: '#/chinh-sach-hoan-tien' },
  ];

  const handleCopyLink = () => {
    const currentTab = tabs.find(t => t.id === activeTab);
    const url = `${window.location.origin}/${currentTab?.hash || '#/chinh-sach-bao-mat'}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Quy định & Chính sách Pháp lý
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tuân thủ Nghị định 52/2013/NĐ-CP &amp; Nghị định 85/2021/NĐ-CP của Bộ Công Thương
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Sao chép link nộp Bộ Công Thương"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? 'Đã sao chép link' : 'Sao chép link'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs Bar */}
            <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      window.location.hash = tab.hash;
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Policy Content Body */}
            <div className="p-5 sm:p-8 overflow-y-auto max-h-[calc(90vh-170px)] space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
              
              {/* 1. CHÍNH SÁCH BẢO MẬT */}
              {activeTab === 'privacy' && (
                <article className="space-y-6 animate-in fade-in duration-200">
                  <header className="border-b border-slate-100 pb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                      Điều 68 - 73 Nghị định 52/2013/NĐ-CP &amp; Nghị định 13/2023/NĐ-CP
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
                      Chính sách Bảo mật Thông tin Cá nhân
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Cập nhật lần cuối: Năm 2026 · Áp dụng cho toàn bộ người dùng website thuehkd.com
                    </p>
                  </header>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">1. Mục đích thu thập thông tin</h3>
                    <p>
                      TaxHKD (thuehkd.com) thu thập thông tin cá nhân của người dùng nhằm các mục đích chính đáng sau:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Xác thực danh tính và hỗ trợ đăng nhập an toàn thông qua mã OTP gửi đến Số điện thoại.</li>
                      <li>Lưu trữ số lượt hỏi AI, lịch sử tra cứu câu hỏi và giải đáp nghĩa vụ thuế cho chính tài khoản người dùng.</li>
                      <li>Đối soát giao dịch thanh toán nạp lượt hỏi tự động qua hệ thống mã QR chuyển khoản.</li>
                      <li>Hỗ trợ, giải đáp thắc mắc và tiếp nhận yêu cầu tư vấn 1-1 từ khách hàng khi được yêu cầu.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">2. Phạm vi thu thập thông tin</h3>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li><strong>Thông tin tài khoản:</strong> Số điện thoại di động người dùng sử dụng để nhận mã OTP đăng nhập.</li>
                      <li><strong>Thông tin tra cứu:</strong> Nội dung câu hỏi liên quan đến doanh thu, ngành nghề, thuế khoán hoặc thuế TMĐT mà người dùng nhập vào hệ thống.</li>
                      <li><strong>Dữ liệu giao dịch:</strong> Mã đơn hàng, số tiền thanh toán, thời gian giao dịch qua cổng đối soát ngân hàng SePay.</li>
                      <li>
                        <strong>Bảo mật biểu mẫu đăng ký kinh doanh:</strong> Khi sử dụng công cụ chuẩn bị tờ khai Mẫu 03-ĐKT hoặc Giấy đề nghị ĐKKD, các thông tin (họ tên, số CCCD, địa chỉ kinh doanh) được xử lý trực tiếp trên thiết bị (in-memory) trong phiên làm việc, <em>không bao giờ được gửi vào mô hình AI công khai và không lưu trữ vĩnh viễn trên máy chủ</em>.
                      </li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">3. Phạm vi sử dụng thông tin</h3>
                    <p>
                      Thông tin thu thập chỉ được sử dụng trong phạm vi nội bộ hệ thống TaxHKD nhằm phục vụ việc cung cấp dịch vụ tra cứu và tư vấn thuế cho khách hàng. TaxHKD cam kết:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Không bán, chia sẻ hoặc tiết lộ thông tin cá nhân của người dùng cho bất kỳ bên thứ ba nào vì mục đích thương mại.</li>
                      <li>Chỉ cung cấp thông tin cho cơ quan Nhà nước có thẩm quyền khi có văn bản yêu cầu chính thức theo đúng trình tự pháp luật Việt Nam.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">4. Thời gian lưu trữ thông tin</h3>
                    <p>
                      Thông tin tài khoản và số lượt hỏi của khách hàng được lưu trữ bảo mật trên cơ sở dữ liệu đám mây mã hóa trong suốt thời gian tài khoản hoạt động. Người dùng có quyền yêu cầu xóa toàn bộ lịch sử tra cứu hoặc thông tin tài khoản bất kỳ lúc nào bằng cách liên hệ bộ phận hỗ trợ của TaxHKD.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">5. Đơn vị thu thập và quản lý thông tin</h3>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                      <p><strong>Đơn vị chủ quản:</strong> Nền tảng TaxHKD (thuehkd.com)</p>
                      <p><strong>Hotline / Zalo hỗ trợ:</strong> 0965.999.594</p>
                      <p><strong>Email tiếp nhận:</strong> contact@thuehkd.com</p>
                      <p><strong>Hạ tầng lưu trữ:</strong> Hệ thống máy chủ Cloudflare Edge mã hóa tiêu chuẩn SSL/TLS 256-bit.</p>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">6. Quyền của người dùng đối với dữ liệu cá nhân</h3>
                    <p>
                      Người dùng có toàn quyền kiểm tra, xem lại lịch sử câu hỏi tại mục "Lịch sử tra cứu", hoặc gửi yêu cầu đính chính, xóa dữ liệu cá nhân bằng cách gửi email về <strong>contact@thuehkd.com</strong>. Yêu cầu sẽ được xử lý trong vòng 48 giờ làm việc.
                    </p>
                  </section>
                </article>
              )}

              {/* 2. ĐIỀU KHOẢN DỊCH VỤ */}
              {activeTab === 'terms' && (
                <article className="space-y-6 animate-in fade-in duration-200">
                  <header className="border-b border-slate-100 pb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                      Quy chế Hoạt động Website TMĐT Bán hàng
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
                      Điều khoản Dịch vụ &amp; Quy chế Hoạt động
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Áp dụng cho mọi cá nhân, hộ kinh doanh và tổ chức truy cập dịch vụ trên thuehkd.com
                    </p>
                  </header>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">1. Chấp thuận điều khoản</h3>
                    <p>
                      Khi truy cập, đăng nhập hoặc thực hiện thanh toán mua gói lượt hỏi trên website thuehkd.com, người dùng được xem là đã đọc, hiểu rõ và đồng ý tuân thủ toàn bộ các điều khoản được quy định tại đây.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">2. Phạm vi và Bản chất dịch vụ</h3>
                    <p>
                      TaxHKD là giải pháp công nghệ trực tuyến (GovTech AI) hỗ trợ người nộp thuế:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Tra cứu kiến thức pháp luật thuế theo các văn bản hiện hành (Luật Quản lý thuế, Luật Thuế GTGT 48/2024/QH15, Nghị định 141/2026/NĐ-CP, Nghị định 68/2026/NĐ-CP, Thông tư 40/2021/TT-BTC...).</li>
                      <li>Ước tính số thuế phải nộp cho Hộ kinh doanh khoán, cá nhân bán hàng online trên TikTok Shop, Shopee, Lazada và người cho thuê bất động sản.</li>
                      <li>Cung cấp quy trình tương tác từng bước hướng dẫn kê khai đăng ký thuế trực tiếp trên Cổng Dịch vụ công của Tổng cục Thuế và ứng dụng eTax Mobile.</li>
                    </ul>
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed font-medium">
                      ⚠️ <strong>Tuyên bố miễn trừ trách nhiệm:</strong> Mọi thông tin do AI giải đáp và số liệu tính toán mang tính chất tham khảo, hướng dẫn nghiệp vụ ban đầu có trích dẫn văn bản luật. TaxHKD không phải Cơ quan Thuế và không nộp hồ sơ thay người nộp thuế. Người nộp thuế chịu trách nhiệm tự kiểm tra và đối chiếu khi lập tờ khai nộp thuế chính thức.
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">3. Quyền và Trách nhiệm của Khách hàng</h3>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Sử dụng số điện thoại chính chủ để đăng nhập và bảo quản thiết bị nhận mã OTP.</li>
                      <li>Được hưởng đầy đủ số lượt hỏi AI và các tính năng tương ứng với gói dịch vụ đã mua.</li>
                      <li>Không sử dụng công cụ để thực hiện các hành vi gian lận trốn thuế, phát tán thông tin sai lệch hoặc can thiệp phá hoại máy chủ website.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">4. Quyền và Trách nhiệm của TaxHKD</h3>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Duy trì hoạt động ổn định của hệ thống website và đảm bảo tính sẵn sàng của trợ lý AI.</li>
                      <li>Thường xuyên cập nhật các văn bản luật, thông tư và nghị định mới nhất của Chính phủ và Bộ Tài chính vào kho tri thức pháp lý.</li>
                      <li>Hỗ trợ kỹ thuật, bù lượt hỏi cho khách hàng nếu xảy ra lỗi kỹ thuật gián đoạn từ phía máy chủ TaxHKD.</li>
                    </ul>
                  </section>
                </article>
              )}

              {/* 3. CHÍNH SÁCH THANH TOÁN */}
              {activeTab === 'payment' && (
                <article className="space-y-6 animate-in fade-in duration-200">
                  <header className="border-b border-slate-100 pb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                      Quy trình Giao dịch Trực tuyến
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
                      Chính sách Thanh toán
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Minh bạch · Tự động hóa 100% · Không qua trung gian thanh toán thu phí ẩn
                    </p>
                  </header>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">1. Bảng giá và Đồng tiền thanh toán</h3>
                    <p>
                      Mọi gói lượt hỏi và dịch vụ trên TaxHKD được niêm yết công khai bằng đơn vị tiền tệ <strong>Việt Nam Đồng (VNĐ)</strong>. Khách hàng đăng ký tài khoản lần đầu được tặng ngay 3 lượt hỏi AI miễn phí để trải nghiệm chất lượng câu trả lời.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">2. Phương thức thanh toán</h3>
                    <p>
                      TaxHKD áp dụng hình thức thanh toán trực tuyến: <strong>Chuyển khoản Ngân hàng qua Mã chuẩn VietQR</strong> được tích hợp tự động qua cổng đối soát SePay Gateway. Khách hàng có thể sử dụng bất kỳ ứng dụng ngân hàng nào (Vietcombank, MBBank, Techcombank, BIDV, VPBank, TPBank...) hoặc ví điện tử hỗ trợ quét mã VietQR để thanh toán.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">3. Quy trình thực hiện thanh toán</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2">1</span>
                        <strong className="block text-slate-900 text-xs mb-1">Chọn gói lượt hỏi</strong>
                        <p className="text-[11px] text-slate-500">Bấm nút "Nạp lượt hỏi" trên thanh điều hướng hoặc góc tài khoản.</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2">2</span>
                        <strong className="block text-slate-900 text-xs mb-1">Quét mã VietQR</strong>
                        <p className="text-[11px] text-slate-500">Mở App ngân hàng quét mã QR có sẵn số tiền và nội dung chuyển khoản duy nhất.</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2">3</span>
                        <strong className="block text-slate-900 text-xs mb-1">Xác nhận chuyển</strong>
                        <p className="text-[11px] text-slate-500">Kiểm tra thông tin và thực hiện chuyển tiền (giữ nguyên cú pháp).</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2">4</span>
                        <strong className="block text-slate-900 text-xs mb-1">Cộng lượt tức thì</strong>
                        <p className="text-[11px] text-slate-500">Hệ thống tự động ghi nhận và cộng lượt hỏi vào tài khoản trong 5 - 30 giây.</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">4. Bảo mật an toàn giao dịch</h3>
                    <p>
                      TaxHKD tuyệt đối không lưu trữ thông tin thẻ thanh toán, mật khẩu hoặc mã OTP ngân hàng của khách hàng. Toàn bộ thao tác chuyển khoản được thực hiện trên ứng dụng ngân hàng bảo mật của chính quý khách.
                    </p>
                  </section>
                </article>
              )}

              {/* 4. HOÀN TIỀN & KHIẾU NẠI */}
              {activeTab === 'refund' && (
                <article className="space-y-6 animate-in fade-in duration-200">
                  <header className="border-b border-slate-100 pb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                      Bảo vệ Quyền lợi Người tiêu dùng
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
                      Chính sách Hoàn tiền &amp; Giải quyết Khiếu nại
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Cam kết minh bạch · Xử lý khiếu nại nhanh chóng trong vòng 4 - 24 giờ
                    </p>
                  </header>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">1. Quy định hoàn tiền và bù lượt hỏi</h3>
                    <p>
                      Do đặc thù là dịch vụ công nghệ số tiêu dùng theo lượt hỏi, TaxHKD không áp dụng chính sách hoàn tiền đối với các lượt hỏi đã được người dùng sử dụng thành công và nhận được câu trả lời.
                    </p>
                    <p className="font-semibold text-slate-800">TaxHKD cam kết hoàn tiền 100% hoặc cộng bù lượt hỏi trong các trường hợp:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Khách hàng đã chuyển khoản thành công nhưng hệ thống mạng bị nghẽn khiến số lượt hỏi chưa được cộng vào tài khoản sau 15 phút.</li>
                      <li>Khách hàng chuyển khoản nhầm số tiền hoặc chuyển thừa so với giá trị gói: TaxHKD sẽ hoàn trả lại số tiền thừa trong 24 giờ làm việc.</li>
                      <li>Hệ thống AI gặp sự cố kỹ thuật máy chủ không thể phản hồi câu hỏi: Lượt hỏi sẽ được hoàn trả lại ngay lập tức vào tài khoản người dùng.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">2. Quy trình tiếp nhận &amp; Xử lý khiếu nại</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-slate-600">
                      <li>
                        <strong>Bước 1 - Gửi yêu cầu:</strong> Khách hàng liên hệ qua Hotline/Zalo: <strong>0965.999.594</strong> hoặc gửi email về <strong>contact@thuehkd.com</strong>. Cung cấp Số điện thoại tài khoản và Ảnh chụp màn hình biên lai chuyển tiền thành công.
                      </li>
                      <li>
                        <strong>Bước 2 - Đối soát &amp; Phản hồi:</strong> Bộ phận Chăm sóc khách hàng TaxHKD kiểm tra dữ liệu giao dịch trên cổng SePay và phản hồi xác nhận cho khách hàng trong vòng <strong>tối đa 4 giờ làm việc</strong>.
                      </li>
                      <li>
                        <strong>Bước 3 - Khắc phục:</strong> Kích hoạt cộng bù lượt hỏi ngay lập tức hoặc chuyển khoản hoàn tiền vào số tài khoản ngân hàng của khách hàng trong vòng <strong>24 - 48 giờ làm việc</strong>.
                      </li>
                    </ol>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">3. Cơ chế giải quyết tranh chấp</h3>
                    <p>
                      TaxHKD luôn đề cao tinh thần thiện chí, lắng nghe và thương lượng nhằm đem lại trải nghiệm tốt nhất cho người nộp thuế. Mọi tranh chấp phát sinh trong quá trình sử dụng dịch vụ trước hết sẽ được giải quyết thông qua thương lượng hòa giải giữa hai bên.
                    </p>
                  </section>
                </article>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Nền tảng TaxHKD · Bản quyền thuộc thuehkd.com © 2026</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng chính sách
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
