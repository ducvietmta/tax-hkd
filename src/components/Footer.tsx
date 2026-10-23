import React from 'react';
import { ExternalLink, Sparkles, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';
import websitePolicies from '../../shared/websitePolicies.json';
import type { PolicyType } from './PolicyModal';

interface FooterProps {
  onOpenPolicy?: (policy: PolicyType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPolicy }) => {
  return (
    <footer className="relative mt-10 sm:mt-20 border-t border-slate-200/80 bg-white/70 backdrop-blur-md text-[13px] sm:text-[14px] text-slate-600 py-8 sm:py-14">
      <div className="max-w-[1240px] mx-auto px-3.5 sm:px-8 space-y-8 sm:space-y-12">
        
        {/* Main Grid: 5 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-10">
          
          {/* Col 1: Brand & Business Info (2 cols) */}
          <div className="sm:col-span-2 space-y-4">
            <a href="#" className="inline-block">
              <img
                src="/images/logo-horizontal.png"
                alt="TaxHKD — Nền tảng AI Tư vấn Thuế Hộ kinh doanh thuehkd.com"
                className="h-12 sm:h-14 md:h-16 w-auto object-contain"
              />
            </a>
            <p className="text-[12.5px] sm:text-[13.5px] text-slate-600 leading-relaxed font-normal">
              Trợ lý AI Tư vấn Thuế chuyên sâu dành riêng cho Hộ kinh doanh, Cá nhân kinh doanh online (TikTok Shop, Shopee) và người có thu nhập từ cho thuê tài sản.
            </p>

            {/* Thông tin chủ sở hữu theo Điều 29 Nghị định 52/2013/NĐ-CP */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11.5px] sm:text-[12px] text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Chủ sở hữu: {websitePolicies.operator.name} · MST {websitePolicies.operator.taxId}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={13} className="text-emerald-600 shrink-0" />
                <span>Hotline / Zalo: <strong>0965.999.594</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={13} className="text-emerald-600 shrink-0" />
                <span>Email: <strong>contact@thuehkd.com</strong></span>
              </div>
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{websitePolicies.operator.address}</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200/70 text-[11px] sm:text-[12px] font-semibold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Cập nhật Nghị định 141/2026/NĐ-CP (Ngưỡng 1 tỷ)</span>
            </div>
          </div>

          {/* Col 2: Chính sách & Quy định BCT */}
          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-bold text-slate-900 text-[13.5px] sm:text-[15px] flex items-center gap-1.5">
              <span>Chính sách &amp; Quy định</span>
            </h4>
            <ul className="space-y-2 text-[12.5px] sm:text-[13px]">
              {websitePolicies.policies.map(policy=><li key={policy.id}><a href={`#/`+policy.slug} onClick={e=>{if(onOpenPolicy){e.preventDefault();window.location.hash='/'+policy.slug;onOpenPolicy(policy.id as PolicyType);}}} className="block text-left text-slate-700 hover:text-emerald-700">{policy.number}. {policy.title}</a></li>)}
            </ul>

            {/* Thông báo Bộ Công Thương Badge Note */}
            <div className="pt-2">
              <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-[10.5px] text-emerald-900 leading-snug">
                <span className="font-bold block text-emerald-800 mb-0.5">Website TMĐT Bán hàng</span>
                Đang thực hiện thủ tục với Bộ Công Thương. Thông tin chính sách được công khai để khách hàng tra cứu.
              </div>
            </div>
          </div>

          {/* Col 3: Tính năng */}
          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-bold text-slate-900 text-[13.5px] sm:text-[15px]">Công cụ Tra cứu</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[12.5px] sm:text-[13px]">
              <li><a href="#ai-assistant" className="hover:text-emerald-600 transition-colors">Tra cứu thuế TikTok Shop</a></li>
              <li><a href="#ai-assistant" className="hover:text-emerald-600 transition-colors">Thuế bán hàng Shopee/Lazada</a></li>
              <li><a href="#tax-calculator" className="hover:text-emerald-600 transition-colors">Tính thuế Cho thuê nhà</a></li>
              <li><a href="#tax-calculator" className="hover:text-emerald-600 transition-colors">Tính thuế KOC &amp; Affiliate</a></li>
              <li><a href="#/dang-ky" className="hover:text-emerald-600 transition-colors">Hướng dẫn đăng ký thuế cá nhân</a></li>
            </ul>
          </div>

          {/* Col 4: Văn bản pháp lý */}
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

          {/* Col 5: Dịch vụ công */}
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
              <li>
                <a href="http://online.gov.vn" target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors flex items-center gap-1 font-medium">
                  <span>Cổng Quản lý TMĐT (BCT)</span>
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
            <span>© 2026 TaxHKD Platform (thuehkd.com). AI GovTech cho Hộ kinh doanh.</span>
          </div>
          <p className="max-w-xl text-center md:text-right font-normal">
            *Lưu ý: TaxHKD hỗ trợ tra cứu và tính toán nghĩa vụ thuế cho Hộ &amp; Cá nhân kinh doanh. Vui lòng đối chiếu với Thông tư gốc khi lập tờ khai chính thức.
          </p>
        </div>
      </div>
    </footer>
  );
};
