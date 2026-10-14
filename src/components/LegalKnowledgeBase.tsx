import React, { useState, useMemo } from 'react';
import { BookOpen, Search, ArrowRight, Sparkles, X } from 'lucide-react';

interface LawItem {
  code: string;
  title: string;
  issuer: string;
  effectiveDate: string;
}

const HKD_LAWS: LawItem[] = [
  {
    code: 'Nghị định 141/2026/NĐ-CP',
    title: 'Sửa đổi, bổ sung Nghị định 68/2026/NĐ-CP - Nâng ngưỡng miễn thuế HKD lên 1 tỷ đồng/năm',
    issuer: 'Chính Phủ',
    effectiveDate: '29/04/2026',
  },
  {
    code: 'Nghị quyết 43/2026/QH16',
    title: 'Giảm 30% số thuế TNCN phải nộp năm 2026–2027 cho cá nhân cư trú có doanh thu từ 1 tỷ đến 10 tỷ đồng',
    issuer: 'Quốc Hội',
    effectiveDate: '01/01/2026',
  },
  {
    code: 'Công văn 311/TCT-DNNCN',
    title: 'Quy trình cấp và quản lý mã số thuế phân loại 888 trên Cổng TMĐT qua tài khoản VNeID',
    issuer: 'Tổng Cục Thuế',
    effectiveDate: '20/01/2025',
  },
  {
    code: 'Thông tư 86/2024/TT-BTC',
    title: 'Sử dụng số định danh cá nhân (CCCD 12 số) thay thế mã số thuế từ ngày 01/07/2025',
    issuer: 'Bộ Tài Chính',
    effectiveDate: '01/07/2025',
  },
  {
    code: 'Luật Thuế GTGT 48/2024/QH15',
    title: 'Luật Thuế Giá trị gia tăng (sửa đổi) - Quy định không chịu thuế GTGT cho doanh thu từ 1 tỷ đồng trở xuống',
    issuer: 'Quốc Hội',
    effectiveDate: '01/01/2026',
  },
  {
    code: 'Luật Thuế TNCN 109/2025/QH15',
    title: 'Luật Thuế Thu nhập cá nhân mới - Bãi bỏ biểu lũy tiến cũ đối với thu nhập từ kinh doanh',
    issuer: 'Quốc Hội',
    effectiveDate: '01/01/2026',
  },
  {
    code: 'Nghị định 68/2026/NĐ-CP',
    title: 'Quy định chi tiết thi hành Luật Quản lý Thuế & Sàn TMĐT khấu trừ nộp thay thuế cho cá nhân',
    issuer: 'Chính Phủ',
    effectiveDate: '01/01/2026',
  },
  {
    code: 'Thông tư 40/2021/TT-BTC',
    title: 'Hướng dẫn thuế GTGT, TNCN và quản lý thuế đối với Hộ kinh doanh, Cá nhân kinh doanh',
    issuer: 'Bộ Tài Chính',
    effectiveDate: '01/08/2021',
  },
  {
    code: 'Thông tư 100/2021/TT-BTC',
    title: 'Sửa đổi, bổ sung Thông tư 40/2021/TT-BTC về thuế cho thuê tài sản và thời điểm xác định doanh thu',
    issuer: 'Bộ Tài Chính',
    effectiveDate: '01/01/2022',
  },
  {
    code: 'Nghị định 91/2022/NĐ-CP',
    title: 'Trách nhiệm sàn TMĐT (Shopee, TikTok Shop...) cung cấp dữ liệu định kỳ cho cơ quan thuế',
    issuer: 'Chính Phủ',
    effectiveDate: '30/10/2022',
  },
  {
    code: 'Thông tư 88/2021/TT-BTC',
    title: 'Hướng dẫn chế độ chứng từ và sổ sách kế toán đơn giản đối với Hộ kinh doanh',
    issuer: 'Bộ Tài Chính',
    effectiveDate: '01/01/2022',
  },
  {
    code: 'Nghị định 123/2020/NĐ-CP',
    title: 'Quy định áp dụng hóa đơn điện tử khởi tạo từ máy tính tiền đối với Hộ kinh doanh',
    issuer: 'Chính Phủ',
    effectiveDate: '01/07/2022',
  },
  {
    code: 'Luật Quản lý Thuế 108/2025/QH15',
    title: 'Luật Quản lý Thuế mới - Thay thế Luật 38/2019/QH14 từ 01/07/2026 (rút hạn khai bổ sung xuống 5 năm)',
    issuer: 'Quốc Hội',
    effectiveDate: '01/07/2026',
  },
];

interface LegalKnowledgeBaseProps {
  onOpenAIChat?: (query: string) => void;
}

export const LegalKnowledgeBase: React.FC<LegalKnowledgeBaseProps> = ({ onOpenAIChat }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredLaws = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return HKD_LAWS;
    return HKD_LAWS.filter((law) => {
      const matchCode = law.code.toLowerCase().includes(term);
      const matchTitle = law.title.toLowerCase().includes(term);
      const matchIssuer = law.issuer.toLowerCase().includes(term);
      return matchCode || matchTitle || matchIssuer;
    });
  }, [searchTerm]);

  return (
    <section id="legal-base" className="py-14 md:py-20 bg-slate-50/70 border-t border-slate-200/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header gọn gàng */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-emerald-700 text-[12px] font-extrabold tracking-widest uppercase mb-3 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200/70 shadow-xs">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>CƠ SỞ PHÁP LÝ THUẾ HỘ & CÁ NHÂN KINH DOANH</span>
          </div>
          <h2 className="text-[26px] sm:text-[36px] font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
            Thư viện Thông tư & Nghị định Thuế HKD <br className="hidden sm:inline" />
            <span className="text-emerald-700">được AI cập nhật mới nhất</span>
          </h2>
          <p className="text-slate-500 text-[14px] sm:text-[15px] max-w-xl mx-auto">
            Tìm kiếm nhanh các luật, thông tư, nghị định và công văn đã được huấn luyện vào hệ thống AI.
          </p>
        </div>

        {/* Thanh tìm kiếm trực quan theo tên */}
        <div className="relative mb-6">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              aria-label="Tìm kiếm văn bản pháp luật"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm tài liệu theo tên hoặc số hiệu (ví dụ: Nghị định 141, Thông tư 40, CV 311...)"
              className="w-full bg-white border border-slate-300 rounded-2xl pl-12 pr-10 py-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Danh sách văn bản dạng hàng gọn gàng, tinh giản */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredLaws.length > 0 ? (
            filteredLaws.map((law) => (
              <div
                key={law.code}
                onClick={() => onOpenAIChat?.(`Tư vấn quy định của ${law.code} đối với hộ kinh doanh`)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-50/50 transition-colors cursor-pointer group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onOpenAIChat?.(`Tư vấn quy định của ${law.code} đối với hộ kinh doanh`);
                  }
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <span className="text-[12px] font-bold text-emerald-700 font-mono bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                      {law.code}
                    </span>
                    <span className="text-[12px] text-slate-400 font-medium">
                      {law.issuer} • Hiệu lực: {law.effectiveDate}
                    </span>
                  </div>
                  <p className="text-[14px] sm:text-[15px] font-semibold text-slate-800 group-hover:text-emerald-900 transition-colors line-clamp-2 sm:line-clamp-1">
                    {law.title}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-600 text-[13px] font-semibold shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <span>Hỏi AI</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 px-4 text-center text-slate-500 text-[14px]">
              Không tìm thấy tài liệu phù hợp với từ khóa <span className="font-semibold text-slate-700">"{searchTerm}"</span>.
            </div>
          )}
        </div>

        {/* Footer ghi chú */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-slate-400 px-2">
          <span>Đang hiển thị {filteredLaws.length}/{HKD_LAWS.length} văn bản cốt lõi</span>
          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Nhấn vào văn bản để mở câu hỏi trực tiếp với AI
          </span>
        </div>

      </div>
    </section>
  );
};
