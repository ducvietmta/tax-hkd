import { Store, Shield, Smartphone, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface CapabilityItem {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
}

const CAPABILITIES: CapabilityItem[] = [
  {
    icon: <Store className="w-6 h-6 text-emerald-600" />,
    title: 'Tự động tính thuế TMĐT (TikTok / Shopee)',
    subtitle: 'Tách cơ sở tính GTGT và TNCN theo hoạt động',
    description: 'Xác định doanh thu trước phí sàn, phương pháp TNCN theo dải doanh thu và điều kiện giảm thuế. Không dùng một tỷ lệ gộp cố định cho mọi người bán.',
    highlights: ['Đối soát số sàn đã khấu trừ, nộp thay', 'Kiểm tra ngưỡng doanh thu 1 tỷ/năm theo NĐ 141/2026', 'Cơ chế quản lý thuế sàn theo NĐ 252/2026'],
  },
  {
    icon: <Smartphone className="w-6 h-6 text-blue-600" />,
    title: 'Hướng dẫn nộp thuế qua eTax Mobile',
    subtitle: 'Nộp thuế trực tiếp 24/7 chỉ với vài thao tác',
    description: 'AI hướng dẫn từng bước liên kết tài khoản ngân hàng, tra cứu thông báo thuế và nhận biên lai điện tử hợp lệ ngay trên ứng dụng eTax Mobile.',
    highlights: ['Liên kết tài khoản VNeID Mức 2', 'Nộp tiền thuế online không cần đi lại', 'Lưu trữ chứng từ điện tử an toàn'],
  },
  {
    icon: <Shield className="w-6 h-6 text-amber-600" />,
    title: 'Rà soát Chênh lệch Dòng tiền & Doanh thu',
    subtitle: 'Phát hiện sớm rủi ro bị gửi giấy mời làm việc',
    description: 'Đối chiếu dòng tiền ngân hàng với doanh thu đã kê khai; phân biệt doanh thu kinh doanh với tiền vay, chuyển khoản nội bộ và giao dịch cá nhân.',
    highlights: ['Phân loại giao dịch kinh doanh và cá nhân', 'Rà soát phương pháp kê khai đang áp dụng', 'Chuẩn bị hồ sơ giải trình với cơ quan thuế'],
  },
  {
    icon: <FileSpreadsheet className="w-6 h-6 text-purple-600" />,
    title: 'Hồ sơ Hoàn thuế & Quyết toán Affiliate/KOC',
    subtitle: 'Kiểm tra chứng từ trước khi xác định nộp thừa',
    description: 'Phân biệt thu nhập kinh doanh với tiền lương, tiền công; xác minh loại thuế đã khấu trừ và số đã nộp. Chỉ xem xét hoàn hoặc bù trừ khi đủ hồ sơ và xác định có khoản nộp thừa.',
    highlights: ['Đối soát doanh thu hoa hồng, không lấy GMV', 'Không tự quy khoản giữ lại 10% thành thuế đã nộp', 'Hướng dẫn hồ sơ hoàn hoặc bù trừ đúng loại thuế'],
  },
];

export const SmartCapabilities: React.FC = () => {
  return (
    <section id="capabilities" className="py-12 md:py-24 bg-slate-50/50 border-t border-b border-slate-200/80">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-1 rounded-full text-[11px] sm:text-[12px] font-semibold text-slate-800 tracking-wide uppercase mb-3 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>NGHIỆP VỤ THUẾ TRỌNG ĐIỂM</span>
          </div>
          <h2 className="text-[24px] sm:text-[36px] font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            Đơn giản hóa toàn bộ nghĩa vụ thuế <br className="hidden sm:inline" />
            cho người kinh doanh tự do &amp; chủ hộ
          </h2>
          <p className="text-[14px] sm:text-[16px] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            AI của TaxHKD giúp bạn bóc tách số liệu, đối chiếu căn cứ pháp lý và thực hiện nghĩa vụ thuế chính xác, hợp pháp.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {CAPABILITIES.map((cap, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 hover:border-slate-300 p-5 sm:p-8 rounded-2xl sm:rounded-3xl transition-all duration-200 shadow-2xs hover:shadow-xs group flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 sm:mb-6 shadow-2xs">
                  {cap.icon}
                </div>

                <h3 className="text-[17px] sm:text-[20px] font-bold text-slate-900 tracking-tight mb-1.5 leading-snug">
                  {cap.title}
                </h3>
                <p className="text-[12.5px] sm:text-[13.5px] font-semibold text-emerald-800 mb-3 sm:mb-4">
                  {cap.subtitle}
                </p>

                <p className="text-[13.5px] sm:text-[14.5px] text-slate-600 leading-relaxed mb-4 sm:mb-6 font-normal">
                  {cap.description}
                </p>
              </div>

              <div className="pt-3.5 sm:pt-4 border-t border-slate-100 space-y-2 sm:space-y-2.5">
                {cap.highlights.map((h, hIdx) => (
                  <div key={hIdx} className="flex items-center gap-2 sm:gap-2.5 text-[12.5px] sm:text-[13px] text-slate-700 font-medium leading-snug">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
