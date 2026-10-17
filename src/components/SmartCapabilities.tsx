import { Store, Shield, Smartphone, FileSpreadsheet, Sparkles, CheckCircle2 } from 'lucide-react';

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
    <section id="capabilities" className="py-10 md:py-20 bg-white border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-3.5 sm:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10.5px] sm:text-[12px] font-extrabold text-emerald-800 tracking-wide uppercase mb-2 sm:mb-3">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            <span>GIẢI PHÁP THUẾ DÀNH CHO HỘ KINH DOANH</span>
          </div>
          <h2 className="text-[22px] sm:text-[34px] font-extrabold text-slate-900 tracking-tight leading-tight mb-2 sm:mb-3">
            Đơn giản hóa toàn bộ nghĩa vụ thuế <br className="hidden sm:inline" />
            cho người kinh doanh tự do & chủ hộ
          </h2>
          <p className="text-[13px] sm:text-[15px] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Không cần kế toán phức tạp, AI của TaxHKD giúp bạn làm chủ toàn bộ quy định thuế và tối ưu chi phí hợp pháp.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
          {CAPABILITIES.map((cap, idx) => (
            <div
              key={idx}
              className="bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 p-4 sm:p-7 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-soft group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-105 transition-transform shadow-xs">
                  {cap.icon}
                </div>

                <h3 className="text-[16px] sm:text-[20px] font-bold text-slate-900 tracking-tight mb-1 group-hover:text-emerald-700 transition-colors leading-snug">
                  {cap.title}
                </h3>
                <p className="text-[12px] sm:text-[13px] font-bold text-emerald-700 mb-2 sm:mb-3">
                  {cap.subtitle}
                </p>

                <p className="text-[12.5px] sm:text-[14px] text-slate-600 leading-relaxed mb-3 sm:mb-5 font-medium">
                  {cap.description}
                </p>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-slate-200 space-y-2 sm:space-y-2.5">
                {cap.highlights.map((h, hIdx) => (
                  <div key={hIdx} className="flex items-center gap-2 sm:gap-2.5 text-[12px] sm:text-[13px] text-slate-700 font-semibold leading-snug">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
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
