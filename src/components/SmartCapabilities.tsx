import React from 'react';
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
    subtitle: 'Chuẩn hóa tỷ lệ 1.5% trên doanh thu thực tế',
    description: 'Hỗ trợ người bán hàng online tính chính xác số thuế phải nộp, tách biệt rõ giữa thuế GTGT (1%) và thuế TNCN (0.5%), theo dõi số thuế sàn khấu trừ nộp thay.',
    highlights: ['Đối soát chính xác theo báo cáo sàn', 'Tự động kiểm tra ngưỡng miễn thuế 1 tỷ/năm', 'Cập nhật cơ chế sàn nộp thay theo NĐ 141/2026'],
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
    title: 'Rà soát Chênh lệch Dòng tiền & Thuế khoán',
    subtitle: 'Phát hiện sớm rủi ro bị gửi giấy mời làm việc',
    description: 'Đối chiếu dòng tiền vào tài khoản ngân hàng cá nhân với mức doanh thu khoán cũ, tư vấn phương án chuyển đổi sang thuế kê khai an toàn nhất.',
    highlights: ['Phân loại giao dịch kinh doanh vs cá nhân', 'Lập phương án chuyển sang thuế kê khai', 'Chuẩn bị giải trình với Chi cục Thuế'],
  },
  {
    icon: <FileSpreadsheet className="w-6 h-6 text-purple-600" />,
    title: 'Hồ sơ Hoàn thuế & Quyết toán Affiliate/KOC',
    subtitle: 'Đòi lại tiền thuế 10% đã bị tạm giữ nộp thừa',
    description: 'Tổng hợp chứng từ khấu trừ thuế điện tử từ các mạng lưới tiếp thị và nhãn hàng, lập hồ sơ đề nghị hoàn trả khoản tiền thuế đã bị khấu trừ dư thừa.',
    highlights: ['Lập hồ sơ hoàn thuế TNCN online', 'Tối ưu mức thuế về 7% theo chuẩn HKD', 'Hỗ trợ giải trình số liệu nhanh chóng'],
  },
];

export const SmartCapabilities: React.FC = () => {
  return (
    <section id="capabilities" className="py-20 md:py-28 bg-white border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full text-[12px] font-extrabold text-emerald-800 tracking-wide uppercase mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>GIẢI PHÁP THUẾ DÀNH RIÊNG CHO HỘ KINH DOANH</span>
          </div>
          <h2 className="text-[30px] sm:text-[40px] font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            Đơn giản hóa toàn bộ nghĩa vụ thuế <br />
            cho người kinh doanh tự do & chủ hộ
          </h2>
          <p className="text-[15px] sm:text-[16px] text-slate-600 max-w-2xl mx-auto">
            Không cần kế toán phức tạp, AI của TaxHKD giúp bạn làm chủ toàn bộ quy định thuế và tối ưu chi phí hợp pháp.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {CAPABILITIES.map((cap, idx) => (
            <div
              key={idx}
              className="bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 p-8 rounded-3xl transition-all duration-300 shadow-soft group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-xs">
                  {cap.icon}
                </div>

                <h3 className="text-[20px] sm:text-[22px] font-bold text-slate-900 tracking-tight mb-1 group-hover:text-emerald-700 transition-colors">
                  {cap.title}
                </h3>
                <p className="text-[13px] font-bold text-emerald-700 mb-3">
                  {cap.subtitle}
                </p>

                <p className="text-[14px] text-slate-600 leading-relaxed mb-6 font-medium">
                  {cap.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                {cap.highlights.map((h, hIdx) => (
                  <div key={hIdx} className="flex items-center gap-2.5 text-[13px] text-slate-700 font-semibold">
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
