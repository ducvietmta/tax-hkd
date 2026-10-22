import React, { useState, useMemo } from 'react';
import { BookOpen, Search, X, Eye, FileSearch, Sparkles } from 'lucide-react';
import legalDocsRaw from '../data/legalDocuments.json';
import { PdfViewerModal, type LegalDoc } from './PdfViewerModal';

const LEGAL_DOCS: LegalDoc[] = legalDocsRaw as LegalDoc[];

const QUICK_SEARCH_CHIPS = [
  'Nghị định 141',
  'Nghị quyết 43',
  'Nghị quyết 204',
  'Thông tư 152',
  'Nghị định 254',
  'Nghị định 252',
  'Thông tư 90',
  'Hóa đơn điện tử',
  'BHXH',
];

interface LegalKnowledgeBaseProps {
  onOpenAIChat?: (query: string) => void;
}

export const LegalKnowledgeBase: React.FC<LegalKnowledgeBaseProps> = ({ onOpenAIChat }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewingDoc, setViewingDoc] = useState<LegalDoc | null>(null);

  const filteredLaws = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return LEGAL_DOCS.filter((law) => {
      const matchCode = law.code.toLowerCase().includes(term);
      const matchTitle = law.title.toLowerCase().includes(term);
      const matchIssuer = law.issuer.toLowerCase().includes(term);
      const matchCategory = law.category.toLowerCase().includes(term);
      return matchCode || matchTitle || matchIssuer || matchCategory;
    });
  }, [searchTerm]);

  const hasSearch = searchTerm.trim().length > 0;

  return (
    <section id="legal-base" className="py-10 md:py-16 bg-slate-50/70 border-t border-slate-200/60">
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6">
        
        {/* Header gọn gàng */}
        <div className="text-center mb-5 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-emerald-700 text-[10.5px] sm:text-[12px] font-extrabold tracking-widest uppercase mb-2 sm:mb-3 bg-emerald-50 px-3 py-1 sm:px-3.5 sm:py-1 rounded-full border border-emerald-200/70 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            <span>KHO VĂN BẢN GỐC PHÁP LUẬT THUẾ HKD</span>
          </div>
          <h2 className="text-[20px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
            <span className="md:hidden">Thư viện văn bản</span>
            <span className="hidden md:inline">Thư viện Thông tư & Nghị định Thuế HKD <br />
            <span className="text-emerald-700">tra cứu theo văn bản và kỳ áp dụng</span></span>
          </h2>
          <p className="text-slate-500 text-[12.5px] sm:text-[14.5px] max-w-xl mx-auto leading-relaxed">
            Gõ tên hoặc số hiệu để xem {LEGAL_DOCS.length} văn bản gốc. Thư viện giữ cả văn bản cũ để đối chiếu kỳ trước; cần đọc cùng văn bản sửa đổi, thay thế và quy định chuyển tiếp.
          </p>
        </div>

        {/* Thanh tìm kiếm trực quan - Gõ đến đâu hiện đến đấy */}
        <div className="relative mb-3.5 sm:mb-4">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 sm:left-4 pointer-events-none" />
            <input
              type="text"
              aria-label="Tìm kiếm văn bản pháp luật"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên hoặc số hiệu (ví dụ: 141, Thông tư 90, 254, BHXH, hóa đơn...)"
              className="w-full bg-white border border-slate-300 rounded-xl sm:rounded-2xl pl-10 sm:pl-12 pr-9 sm:pr-10 py-2.5 sm:py-3.5 text-[13.5px] sm:text-[15px] text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Các gợi ý tìm kiếm nhanh bằng 1 chạm */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mb-4 sm:mb-6 text-[11px] sm:text-xs text-slate-500 px-0.5">
          <span className="font-semibold text-slate-600 shrink-0">Gợi ý nhanh:</span>
          {QUICK_SEARCH_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setSearchTerm(chip)}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200/90 rounded-lg text-slate-600 transition-all font-medium shadow-2xs cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Trạng thái 1: Khi chưa nhập từ khóa -> Không show tài liệu ra, giữ trang gọn gàng */}
        {!hasSearch && (
          <div className="bg-white/80 rounded-2xl border border-dashed border-slate-300/80 p-5 sm:p-10 text-center transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2.5 sm:mb-3.5 border border-emerald-100">
              <FileSearch className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-[14px] sm:text-base font-bold text-slate-800 mb-1">
              Gõ số hiệu hoặc tên văn bản để tra cứu
            </h3>
            <p className="text-slate-500 text-[12px] sm:text-sm max-w-md mx-auto leading-relaxed">
              Hệ thống lọc tức thì trong kho 59 văn bản pháp luật thuế HKD mới nhất và cho phép xem văn bản gốc trực tiếp.
            </p>
          </div>
        )}

        {/* Trạng thái 2: Khi người dùng gõ từ khóa -> Gõ đến đâu show ra đến đấy */}
        {hasSearch && (
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between text-[11.5px] sm:text-xs text-slate-500 px-1">
              <span>
                Tìm thấy <strong className="text-emerald-700 font-bold">{filteredLaws.length}</strong> văn bản phù hợp
              </span>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 underline font-medium"
              >
                Đóng danh sách
              </button>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {filteredLaws.length > 0 ? (
                filteredLaws.map((law) => (
                  <div
                    key={law.id}
                    className="p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:bg-emerald-50/40 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                        <span className="text-[11px] sm:text-[12px] font-bold text-emerald-700 font-mono bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md">
                          {law.code}
                        </span>
                        <span className="text-[10.5px] sm:text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                          {law.category}
                        </span>
                        <span className="text-[11px] sm:text-[12px] text-slate-400 font-medium">
                          {law.issuer} • {law.date}
                        </span>
                      </div>
                      <p className="text-[13px] sm:text-[14.5px] font-semibold text-slate-800 group-hover:text-emerald-950 transition-colors line-clamp-2 leading-snug">
                        {law.title}
                      </p>
                    </div>

                    {/* Các nút hành động: Xem trực tiếp & Hỏi AI */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => setViewingDoc(law)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-[11.5px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 transition-all shadow-2xs cursor-pointer"
                        title={`Xem trực tiếp toàn văn ${law.code}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem văn bản</span>
                      </button>

                      {onOpenAIChat && (
                        <button
                          type="button"
                          onClick={() => onOpenAIChat(`Tư vấn chi tiết các quy định của ${law.code} đối với hộ kinh doanh`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-[11.5px] sm:text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
                          title="Đặt câu hỏi với AI về văn bản này"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Hỏi AI</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Không tìm thấy văn bản phù hợp với từ khóa "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Trình xem PDF modal dùng chung */}
      <PdfViewerModal
        doc={viewingDoc}
        onClose={() => setViewingDoc(null)}
        onOpenAIChat={onOpenAIChat}
      />
    </section>
  );
};
