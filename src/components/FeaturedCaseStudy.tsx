import React from 'react';
import { ArrowUpRight, CheckCircle2, Play } from 'lucide-react';

interface FeaturedCaseStudyProps {
  onOpenConsultation: () => void;
}

export const FeaturedCaseStudy: React.FC<FeaturedCaseStudyProps> = ({ onOpenConsultation }) => {
  return (
    <section id="case-study" className="py-24 md:py-36 bg-[#FAFAFA] border-y border-[#ECECEC]">
      <div className="max-w-[1360px] mx-auto px-6 sm:px-10 md:px-16">
        {/* Section Eyebrow */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 md:mb-16">
          <div>
            <span className="text-[12px] sm:text-[13px] font-bold tracking-[0.2em] text-[#6B6B6B] uppercase mb-3 block">
              FEATURED CASE STUDY
            </span>
            <h2 className="text-[32px] sm:text-[42px] md:text-[48px] font-bold tracking-tight text-[#0A0A0A] leading-tight">
              Chiến dịch Mega Live <br className="hidden sm:block" />
              Ngành Hàng Mỹ Phẩm & Chăm Sóc Da
            </h2>
          </div>
          <p className="text-[15px] text-[#6B6B6B] max-w-[340px] mt-4 sm:mt-0">
            Dữ liệu thực chiến từ chiến dịch Super Brand Day hợp tác cùng đối tác hàng đầu.
          </p>
        </div>

        {/* Featured Card */}
        <div className="bg-white rounded-3xl border border-[#ECECEC] overflow-hidden p-6 sm:p-10 md:p-14 shadow-[0_12px_40px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left: Visual / Studio Live Snapshot */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#111111] group">
              <img
                src="https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=1000&auto=format&fit=crop&q=80"
                alt="TikTok Livestream Studio Production"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Live Tag in Case Study */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FE2C55] animate-ping" />
                <span className="text-[11px] font-bold text-white tracking-wider">SUPER BRAND DAY</span>
              </div>

              {/* Studio Info Badge */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-bold">Studio 4K & Ekip 12 Chuyên Gia</div>
                    <div className="text-[11px] text-white/70">Thời lượng 8 tiếng liên tục</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#FE2C55] flex items-center justify-center text-white">
                    <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Key Verified Results */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
              <div className="grid grid-cols-2 gap-6 sm:gap-8">
                <div>
                  <div className="text-[36px] sm:text-[46px] font-bold tracking-tight text-[#0A0A0A] leading-none mb-2">
                    +285%
                  </div>
                  <div className="text-[13px] font-medium text-[#6B6B6B]">
                    Tăng trưởng doanh số so với kỳ trước
                  </div>
                </div>

                <div>
                  <div className="text-[36px] sm:text-[46px] font-bold tracking-tight text-[#FE2C55] leading-none mb-2">
                    14.2 Tỷ
                  </div>
                  <div className="text-[13px] font-medium text-[#6B6B6B]">
                    Tổng giá trị giao dịch (GMV)
                  </div>
                </div>

                <div>
                  <div className="text-[36px] sm:text-[46px] font-bold tracking-tight text-[#0A0A0A] leading-none mb-2">
                    180K+
                  </div>
                  <div className="text-[13px] font-medium text-[#6B6B6B]">
                    Lượt xem đồng thời đỉnh điểm (PCU)
                  </div>
                </div>

                <div>
                  <div className="text-[36px] sm:text-[46px] font-bold tracking-tight text-[#0A0A0A] leading-none mb-2">
                    32.4%
                  </div>
                  <div className="text-[13px] font-medium text-[#6B6B6B]">
                    Tỷ lệ chuyển đổi đơn hàng (CVR)
                  </div>
                </div>
              </div>

              {/* Execution highlights */}
              <div className="space-y-2.5 pt-4 border-t border-[#ECECEC]">
                <div className="flex items-center gap-2.5 text-[14px] text-[#0A0A0A] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#FE2C55]" />
                  <span>Kịch bản phân bổ khung giờ vàng & voucher độc quyền</span>
                </div>
                <div className="flex items-center gap-2.5 text-[14px] text-[#0A0A0A] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#FE2C55]" />
                  <span>Kết hợp 4 Top KOC & Host nội bộ thương hiệu</span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  onClick={onOpenConsultation}
                  className="group inline-flex items-center gap-2 text-[15px] font-semibold text-[#0A0A0A] hover:text-[#FE2C55] transition-colors"
                >
                  <span>Xem chi tiết giải pháp cho nhãn hàng của bạn</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal 1-line Process (Section 17) */}
        <div id="process" className="mt-20 pt-12 border-t border-[#ECECEC] text-center">
          <p className="text-[12px] font-bold tracking-[0.2em] text-[#6B6B6B] uppercase mb-4">
            QUY TRÌNH HỢP TÁC TINH GỌN
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[15px] sm:text-[17px] font-semibold text-[#0A0A0A]">
            <span className="hover:text-[#FE2C55] transition-colors">Strategy</span>
            <span className="text-[#6B6B6B]">→</span>
            <span className="hover:text-[#FE2C55] transition-colors">Production</span>
            <span className="text-[#6B6B6B]">→</span>
            <span className="hover:text-[#FE2C55] transition-colors">Live</span>
            <span className="text-[#6B6B6B]">→</span>
            <span className="text-[#FE2C55]">Optimization</span>
          </div>
        </div>
      </div>
    </section>
  );
};
