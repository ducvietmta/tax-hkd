import React from 'react';
import { Store, ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative mt-10 sm:mt-20 border-t border-slate-200/80 bg-white/70 backdrop-blur-md text-[13px] sm:text-[14px] text-slate-600 py-8 sm:py-14">
      <div className="max-w-[1200px] mx-auto px-3.5 sm:px-8 space-y-6 sm:space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12">
          
          {/* Col 1: Brand */}
          <div className="sm:col-span-2 space-y-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="font-extrabold text-[18px] sm:text-[20px] text-slate-900 tracking-tight">
                Tax<span className="text-shimmer">HKD</span>
              </span>
            </div>
            <p className="text-[12.5px] sm:text-[14px] text-slate-600 leading-relaxed max-w-sm font-normal">
              Trợ lý AI Tư vấn Thuế chuyên sâu dành riêng cho Hộ kinh doanh, Cá nhân kinh doanh online (TikTok Shop, Shopee) và người có thu nhập từ cho thuê tài sản.
            </p>
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200/70 text-[11px] sm:text-[12px] font-semibold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Cập nhật Nghị định 141/2026/NĐ-CP (Ngưỡng 1 tỷ)</span>
            </div>
          </div>

          {/* Col 2: Tính năng */}
          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-bold text-slate-900 text-[13.5px] sm:text-[15px]">Công cụ Tra cứu</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[12.5px] sm:text-[13px]">
              <li><a href="#ai-assistant" className="hover:text-emerald-600 transition-colors">Tra cứu thuế TikTok Shop</a></li>
              <li><a href="#ai-assistant" className="hover:text-emerald-600 transition-colors">Thuế bán hàng Shopee/Lazada</a></li>
              <li><a href="#tax-calculator" className="hover:text-emerald-600 transition-colors">Tính thuế Cho thuê nhà</a></li>
              <li><a href="#tax-calculator" className="hover:text-emerald-600 transition-colors">Tính thuế KOC & Affiliate</a></li>
              <li><a href="#/dang-ky" className="hover:text-emerald-600 transition-colors">Hướng dẫn Đăng ký HKD 2026</a></li>
            </ul>
          </div>

          {/* Col 3: Văn bản */}
          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-bold text-slate-900 text-[13.5px] sm:text-[15px]">Quy định Pháp lý</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[12.5px] sm:text-[13px]">
              <li><a href="#legal-base" className="text-slate-700 hover:text-emerald-600 transition-colors font-medium">Nghị định 141/2026/NĐ-CP</a></li>
              <li><a href="#legal-base" className="text-slate-700 hover:text-emerald-600 transition-colors font-medium">Nghị định 68/2026/NĐ-CP</a></li>
              <li><a href="#legal-base" className="text-slate-700 hover:text-emerald-600 transition-colors font-medium">Luật Thuế GTGT 48/2024/QH15</a></li>
              <li><a href="#legal-base" className="text-slate-700 hover:text-emerald-600 transition-colors font-medium">Nghị quyết 43/2026/QH16</a></li>
              <li><a href="#legal-base" className="text-slate-700 hover:text-emerald-600 transition-colors font-medium">Nghị định 252/2026/NĐ-CP</a></li>
              <li><a href="#legal-base" className="text-slate-700 hover:text-emerald-600 transition-colors font-medium">Nghị định 254/2026/NĐ-CP</a></li>
            </ul>
          </div>

          {/* Col 4: Dịch vụ công */}
          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-bold text-slate-900 text-[13.5px] sm:text-[15px]">Cổng Thuế Điện Tử</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[12.5px] sm:text-[13px]">
              <li>
                <a href="https://canhan.gdt.gov.vn" target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors flex items-center gap-1 font-medium">
                  <span>Thuế điện tử Cá nhân (eTax)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a href="https://thuedientu.gdt.gov.vn" target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors flex items-center gap-1 font-medium">
                  <span>Cổng Tổng cục Thuế</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a href="https://dichvucong.gov.vn" target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors flex items-center gap-1 font-medium">
                  <span>Cổng DVC Quốc gia</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="pt-4 sm:pt-6 border-t border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 text-[11px] sm:text-[12px] text-slate-500">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
            <span>© 2026 TaxHKD Platform. AI GovTech cho Hộ kinh doanh.</span>
          </div>
          <p className="max-w-xl text-center md:text-right font-normal">
            *Lưu ý: TaxHKD hỗ trợ tra cứu và tính toán nghĩa vụ thuế cho Hộ & Cá nhân kinh doanh. Vui lòng đối chiếu với Thông tư gốc khi lập tờ khai chính thức.
          </p>
        </div>
      </div>
    </footer>
  );
};
