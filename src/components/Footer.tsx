import React from 'react';
import { Store, ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative mt-20 border-t border-slate-200/80 bg-white/70 backdrop-blur-md text-[14px] text-slate-600 py-14">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Col 1: Brand */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Store className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-[20px] text-slate-900 tracking-tight">
                Tax<span className="text-shimmer">HKD</span>
              </span>
            </div>
            <p className="text-[14px] text-slate-600 leading-relaxed max-w-sm font-normal">
              Trợ lý AI Tư vấn Thuế chuyên sâu dành riêng cho Hộ kinh doanh, Cá nhân kinh doanh online (TikTok Shop, Shopee) và người có thu nhập từ cho thuê tài sản.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200/70 text-[12px] font-semibold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cập nhật Nghị định 141/2026/NĐ-CP (Ngưỡng miễn thuế 1 tỷ)</span>
            </div>
          </div>

          {/* Col 2: Tính năng */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-[15px]">Công cụ Tra cứu</h4>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#ai-assistant" className="hover:text-emerald-600 transition-colors">Tra cứu thuế TikTok Shop</a></li>
              <li><a href="#ai-assistant" className="hover:text-emerald-600 transition-colors">Thuế bán hàng Shopee/Lazada</a></li>
              <li><a href="#tax-calculator" className="hover:text-emerald-600 transition-colors">Tính thuế Cho thuê nhà</a></li>
              <li><a href="#tax-calculator" className="hover:text-emerald-600 transition-colors">Tính thuế KOC & Affiliate</a></li>
              <li><a href="#risk-audit" className="hover:text-emerald-600 transition-colors">Rà soát chênh lệch dòng tiền</a></li>
            </ul>
          </div>

          {/* Col 3: Văn bản */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-[15px]">Quy định Pháp lý</h4>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#legal-base" className="text-slate-700 hover:text-emerald-600 transition-colors font-medium">Nghị định 141/2026/NĐ-CP (Mới nhất)</a></li>
              <li><a href="#legal-base" className="text-slate-700 hover:text-emerald-600 transition-colors font-medium">Nghị định 68/2026/NĐ-CP</a></li>
              <li><a href="#legal-base" className="text-slate-700 hover:text-emerald-600 transition-colors font-medium">Luật Thuế GTGT 48/2024/QH15</a></li>
              <li><a href="#legal-base" className="text-slate-700 hover:text-emerald-600 transition-colors font-medium">Thông tư 40/2021/TT-BTC</a></li>
              <li><a href="#legal-base" className="text-slate-700 hover:text-emerald-600 transition-colors font-medium">Nghị định 91/2022/NĐ-CP</a></li>
              <li><a href="#legal-base" className="text-slate-700 hover:text-emerald-600 transition-colors font-medium">Nghị định 123/2020/NĐ-CP</a></li>
            </ul>
          </div>

          {/* Col 4: Dịch vụ công */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-[15px]">Cổng Thuế Điện Tử</h4>
            <ul className="space-y-2 text-[13px]">
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
        <div className="pt-6 border-t border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>© 2026 TaxHKD Platform. Thiết kế hiện đại trên nền AI GovTech.</span>
          </div>
          <p className="max-w-xl text-center md:text-right font-normal">
            *Lưu ý: TaxHKD là nền tảng AI hỗ trợ tra cứu và tính toán nghĩa vụ thuế cho Hộ & Cá nhân kinh doanh. Vui lòng đối chiếu với Thông tư gốc hoặc cán bộ thuế phụ trách khi lập tờ khai chính thức.
          </p>
        </div>
      </div>
    </footer>
  );
};
