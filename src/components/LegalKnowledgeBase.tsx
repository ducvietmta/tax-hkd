import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, Search, Sparkles, X, Eye, ExternalLink, FileSearch } from 'lucide-react';
import legalDocsRaw from '../data/legalDocuments.json';

interface LegalDoc {
  id: string;
  code: string;
  title: string;
  issuer: string;
  date: string;
  category: string;
  fileName: string;
  fileSize: string;
  downloadUrl: string;
}

const LEGAL_DOCS: LegalDoc[] = legalDocsRaw as LegalDoc[];

const QUICK_SEARCH_CHIPS = [
  'Nghị định 141',
  'Nghị quyết 43',
  'Công văn 311',
  'Thông tư 88',
  'Nghị định 123',
  'Thông tư 40',
  'Thông tư 86',
  'Hóa đơn điện tử',
  'BHXH',
];

interface LegalKnowledgeBaseProps {
  onOpenAIChat?: (query: string) => void;
}

export const LegalKnowledgeBase: React.FC<LegalKnowledgeBaseProps> = ({ onOpenAIChat }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewingDoc, setViewingDoc] = useState<LegalDoc | null>(null);

  // Close viewer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewingDoc) {
        setViewingDoc(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingDoc]);

  // Prevent background scroll when viewing document
  useEffect(() => {
    if (viewingDoc) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [viewingDoc]);

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
    <section id="legal-base" className="py-14 md:py-20 bg-slate-50/70 border-t border-slate-200/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header gọn gàng */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-emerald-700 text-[12px] font-extrabold tracking-widest uppercase mb-3 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200/70 shadow-xs">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>KHO VĂN BẢN GỐC PHÁP LUẬT THUẾ HKD</span>
          </div>
          <h2 className="text-[26px] sm:text-[36px] font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
            Thư viện Thông tư & Nghị định Thuế HKD <br className="hidden sm:inline" />
            <span className="text-emerald-700">được AI cập nhật mới nhất</span>
          </h2>
          <p className="text-slate-500 text-[14px] sm:text-[15px] max-w-xl mx-auto">
            Gõ tên hoặc số hiệu để xem trực tiếp 59 văn bản PDF gốc (Luật, Nghị định, Thông tư, Công văn) phục vụ hộ & cá nhân kinh doanh.
          </p>
        </div>

        {/* Thanh tìm kiếm trực quan - Gõ đến đâu hiện đến đấy */}
        <div className="relative mb-4">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              aria-label="Tìm kiếm văn bản pháp luật"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên hoặc số hiệu văn bản (ví dụ: 141, Thông tư 40, 311, BHXH, hóa đơn...)"
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

        {/* Các gợi ý tìm kiếm nhanh bằng 1 chạm */}
        <div className="flex items-center gap-1.5 flex-wrap mb-6 text-xs text-slate-500 px-1">
          <span className="font-semibold text-slate-600 shrink-0">Gợi ý nhanh:</span>
          {QUICK_SEARCH_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setSearchTerm(chip)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200/90 rounded-lg text-slate-600 transition-all font-medium shadow-2xs cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Trạng thái 1: Khi chưa nhập từ khóa -> Không show tài liệu ra, giữ trang gọn gàng */}
        {!hasSearch && (
          <div className="bg-white/80 rounded-2xl border border-dashed border-slate-300/80 p-8 sm:p-10 text-center transition-all">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3.5 border border-emerald-100">
              <FileSearch className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Gõ số hiệu hoặc tên văn bản để bắt đầu tra cứu
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
              Hệ thống sẽ tự động lọc tức thì trong kho 59 văn bản pháp luật thuế HKD mới nhất và cho phép bạn xem tài liệu gốc trực tiếp trên trình duyệt.
            </p>
          </div>
        )}

        {/* Trạng thái 2: Khi người dùng gõ từ khóa -> Gõ đến đâu show ra đến đấy */}
        {hasSearch && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
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

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {filteredLaws.length > 0 ? (
                filteredLaws.map((law) => (
                  <div
                    key={law.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-50/40 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[12px] font-bold text-emerald-700 font-mono bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                          {law.code}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {law.category}
                        </span>
                        <span className="text-[12px] text-slate-400 font-medium">
                          {law.issuer} • {law.date}
                        </span>
                      </div>
                      <p className="text-[14px] sm:text-[15px] font-semibold text-slate-800 group-hover:text-emerald-950 transition-colors line-clamp-2">
                        {law.title}
                      </p>
                    </div>

                    {/* Các nút hành động: Xem trực tiếp & Hỏi AI */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => setViewingDoc(law)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 transition-all shadow-2xs cursor-pointer"
                        title={`Xem trực tiếp toàn văn ${law.code}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem văn bản</span>
                      </button>

                      {onOpenAIChat && (
                        <button
                          type="button"
                          onClick={() => onOpenAIChat(`Tư vấn chi tiết các quy định của ${law.code} đối với hộ kinh doanh`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
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
                <div className="py-12 px-4 text-center text-slate-500 text-[14px]">
                  Không tìm thấy tài liệu phù hợp với từ khóa <span className="font-semibold text-slate-700">"{searchTerm}"</span>.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL XEM TRỰC TIẾP VĂN BẢN PDF */}
      {viewingDoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in"
          onClick={() => setViewingDoc(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-5xl h-[92vh] sm:h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {viewingDoc.code}
                  </span>
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    {viewingDoc.issuer} • {viewingDoc.date}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {viewingDoc.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onOpenAIChat && (
                  <button
                    type="button"
                    onClick={() => {
                      const code = viewingDoc.code;
                      setViewingDoc(null);
                      onOpenAIChat(`Tư vấn chi tiết các quy định của ${code} đối với hộ kinh doanh`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/80 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Hỏi AI về văn bản này</span>
                    <span className="sm:hidden">Hỏi AI</span>
                  </button>
                )}

                <a
                  href={viewingDoc.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors"
                  title="Mở toàn màn hình tab mới"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors"
                  title="Đóng cửa sổ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Khung iframe xem PDF trực tiếp trên trình duyệt */}
            <div className="flex-1 bg-slate-100 relative">
              <iframe
                src={`${viewingDoc.downloadUrl}#toolbar=1`}
                className="w-full h-full border-0"
                title={viewingDoc.title}
              />
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
