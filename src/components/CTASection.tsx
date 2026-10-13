import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CTASectionProps {
  onOpenConsultation: () => void;
  onOpenAIChat: (query?: string) => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onOpenConsultation, onOpenAIChat }) => {
  return (
    <section className="py-16 sm:py-24 bg-white relative overflow-hidden">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-8 sm:p-14 md:p-16 overflow-hidden shadow-xl text-white">
          
          {/* Subtle Ambient Shapes */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wide uppercase">
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>TRỢ LÝ AI THUẾ HỘ KINH DOANH MIỄN PHÍ</span>
            </div>

            <h2 className="text-[30px] sm:text-[42px] md:text-[48px] font-extrabold tracking-tight leading-[1.1]">
              Kê khai đúng hạn, tối ưu thuế <br />
              và an tâm phát triển kinh doanh
            </h2>

            <p className="text-[16px] sm:text-[17px] text-emerald-50 leading-relaxed max-w-2xl font-normal">
              Tham gia cùng hơn 25.000+ chủ shop TikTok Shop, Shopee và hộ kinh doanh đã sử dụng TaxHKD để tính thuế và tránh rủi ro xử phạt.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onOpenAIChat()}
                className="group inline-flex items-center gap-2.5 bg-white hover:bg-slate-50 text-emerald-800 font-extrabold text-[15px] px-8 py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-md"
              >
                <span>Mở Chat AI Thuế ngay</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onOpenConsultation}
                className="inline-flex items-center gap-2 bg-emerald-800/80 hover:bg-emerald-900 text-white font-bold text-[15px] px-7 py-3.5 rounded-xl border border-white/20 transition-colors"
              >
                <span>Tư vấn hồ sơ 1-1 với Chuyên gia</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
