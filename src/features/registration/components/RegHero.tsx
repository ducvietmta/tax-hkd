import { Sparkles, ShieldCheck, ArrowRight, HelpCircle, Home, ChevronRight } from 'lucide-react';

interface RegHeroProps {
  onStartQuiz: () => void;
  onOpenAIChat?: (query: string) => void;
  onBackToHome: () => void;
}

export const RegHero: React.FC<RegHeroProps> = ({
  onStartQuiz,
  onOpenAIChat,
  onBackToHome,
}) => {
  return (
    <div className="relative pt-24 pb-12 sm:pt-28 sm:pb-16 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
          <button
            type="button"
            onClick={onBackToHome}
            className="hover:text-emerald-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold">Hướng dẫn đăng ký HKD</span>
        </nav>

        {/* Hero Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-extrabold text-emerald-800 tracking-wider uppercase mb-4 shadow-2xs">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>HƯỚNG DẪN THỦ TỤC ĐĂNG KÝ 2026</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4">
          Đăng ký Hộ & Cá nhân Kinh doanh <br className="hidden sm:inline" />
          <span className="text-emerald-700">chuẩn xác từng bước theo luật mới</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed mb-6 font-medium">
          Hệ thống hướng dẫn thông minh giúp bạn chọn đúng hình thức (Cá nhân KD, Hộ kinh doanh hay Gian hàng TMĐT), chuẩn bị đủ hồ sơ, và hoàn thành thủ tục thuế mà không lo bị phạt.
        </p>

        {/* 2026 Policy Badges */}
        <div className="flex flex-wrap items-center gap-2.5 mb-8 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Bãi bỏ Lệ phí môn bài từ 01/01/2026
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Ngưỡng miễn thuế 1 tỷ/năm (NĐ 141/2026)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Tích hợp số CCCD 12 số & Mã 888 TMĐT
          </span>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStartQuiz}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Chatbot tư vấn đăng ký kinh doanh</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onOpenAIChat && (
            <button
              type="button"
              onClick={() => onOpenAIChat('Tư vấn cho tôi các bước đăng ký Hộ kinh doanh hoặc cá nhân kinh doanh mới nhất năm 2026')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 font-bold text-sm transition-all shadow-xs cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span>Hỏi đáp thuế với AI chuyên sâu</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
