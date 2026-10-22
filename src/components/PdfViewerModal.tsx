import React, { useEffect, useRef, useState, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Download, FileText, Building2, CalendarDays, LoaderCircle, ArrowUpRight, Sparkles } from 'lucide-react';
import legalDocsRaw from '../data/legalDocuments.json';
const AIChatModal = React.lazy(() => import('./AIChatModal').then(m => ({ default: m.AIChatModal })));

const PdfDocumentViewer = React.lazy(() => import('./PdfDocumentViewer'));

export interface LegalDoc {
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

const ALL_DOCS: LegalDoc[] = legalDocsRaw as LegalDoc[];

interface PdfViewerModalProps {
  doc?: LegalDoc | null;
  docId?: string | null;
  onClose: () => void;
  onOpenAIChat?: (query: string) => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  doc: propDoc,
  docId,
  onClose,
}) => {
  const closeViewerRef = useRef<HTMLButtonElement>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);

  // Resolve document either from propDoc or by looking up docId
  const viewingDoc = propDoc || (docId ? ALL_DOCS.find((d) => d.id === docId) : null);

  useEffect(() => {
    setChatOpen(false);
    setChatStarted(false);
  }, [viewingDoc?.id]);

  const openChat = () => {
    setChatStarted(true);
    setChatOpen(true);
  };

  // Close viewer on ESC key
  useEffect(() => {
    if (!viewingDoc) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (chatOpen) setChatOpen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingDoc, onClose, chatOpen]);

  // Lock body scroll and focus close button when modal opens
  useEffect(() => {
    if (viewingDoc) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      setTimeout(() => closeViewerRef.current?.focus(), 50);
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [viewingDoc]);

  if (!viewingDoc) return null;

  return createPortal(
    (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-viewer-title"
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center sm:p-4 lg:p-6 animate-fade-in"
        onClick={onClose}
      >
        <div
          className="w-full h-[100dvh] sm:h-[min(94dvh,1100px)] max-w-[1500px] bg-white sm:rounded-[24px] flex flex-col overflow-hidden shadow-[0_32px_100px_rgba(0,0,0,0.38)] ring-1 ring-white/15"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="shrink-0 bg-slate-950 text-white border-b border-white/10">
            <div className="min-h-[72px] px-4 sm:px-6 flex items-center gap-3 sm:gap-5">
              <div className="hidden sm:flex w-10 h-10 rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20 items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="min-w-0 flex-1 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">Văn bản gốc</span>
                  <span className="w-1 h-1 rounded-full bg-slate-500" aria-hidden="true" />
                  <span className="text-[11px] text-slate-400">PDF</span>
                </div>
                <h4 id="pdf-viewer-title" className="text-sm sm:text-base font-semibold leading-snug truncate" title={viewingDoc.title}>
                  {viewingDoc.code}
                  <span className="font-normal text-slate-300"> · {viewingDoc.title}</span>
                </h4>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={viewingDoc.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-semibold text-slate-100 hover:bg-white/10 border border-white/15 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"
                  aria-label="Mở PDF trong tab mới"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden md:inline">Mở tab mới</span>
                </a>
                <button
                  ref={closeViewerRef}
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 cursor-pointer"
                  aria-label="Đóng trình xem PDF"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </header>

          <div className="relative flex-1 min-h-0 flex flex-col lg:flex-row bg-slate-100">
            <aside className={`${chatOpen ? 'hidden xl:flex' : 'hidden lg:flex'} w-[288px] shrink-0 flex-col border-r border-slate-200 bg-white px-6 py-7 overflow-y-auto`}>
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 mb-6 ring-1 ring-emerald-100">
                <FileText className="w-6 h-6" aria-hidden="true" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Đang xem tài liệu</span>
              <h5 className="text-lg font-bold leading-snug text-slate-900 mb-2">{viewingDoc.code}</h5>
              <p className="text-sm leading-relaxed text-slate-600 mb-7">{viewingDoc.title}</p>
              <div className="space-y-4 py-5 border-y border-slate-100 text-sm">
                <div className="flex gap-3 text-slate-600">
                  <Building2 className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                  <span>{viewingDoc.issuer}</span>
                </div>
                <div className="flex gap-3 text-slate-600">
                  <CalendarDays className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                  <span>{viewingDoc.date}</span>
                </div>
                <div className="flex gap-3 text-slate-600">
                  <FileText className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                  <span>{viewingDoc.category} · {viewingDoc.fileSize}</span>
                </div>
              </div>
              <div className="mt-auto pt-7 space-y-2.5">
                <button
                  type="button"
                  onClick={openChat}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" /> {chatOpen ? 'Đang hỏi AI' : 'Hỏi AI về văn bản'}
                </button>
                <a
                  href={viewingDoc.downloadUrl}
                  download={viewingDoc.fileName}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-4 h-4" aria-hidden="true" /> Tải bản PDF
                </a>
              </div>
            </aside>

            <div className="lg:hidden shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 bg-white border-b border-slate-200">
              <span className="min-w-0 truncate text-xs font-medium text-slate-600">
                {viewingDoc.issuer} · {viewingDoc.date} · {viewingDoc.fileSize}
              </span>
              <button type="button" onClick={openChat} className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700" aria-label="Hỏi AI về văn bản">
                <Sparkles className="w-4 h-4" aria-hidden="true" /> Hỏi AI
              </button>
              <a
                href={viewingDoc.downloadUrl}
                download={viewingDoc.fileName}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"
                aria-label="Tải bản PDF"
              >
                <Download className="w-4 h-4" aria-hidden="true" /> Tải về
              </a>
            </div>

            <div className={`${chatOpen ? 'hidden lg:block' : ''} relative flex-1 min-w-0 min-h-0 bg-slate-200/70 lg:p-4 xl:p-6`}>
              <div className="w-full h-full bg-white lg:rounded-xl overflow-hidden lg:shadow-[0_8px_30px_rgba(15,23,42,0.13)] lg:ring-1 lg:ring-slate-900/5">
                <Suspense
                  fallback={
                    <div role="status" className="h-full flex items-center justify-center gap-3 text-sm text-slate-500">
                      <LoaderCircle className="h-6 w-6 animate-spin text-emerald-600" />
                      Đang mở trình xem…
                    </div>
                  }
                >
                  <PdfDocumentViewer key={viewingDoc.id} url={viewingDoc.downloadUrl} title={viewingDoc.title} />
                </Suspense>
              </div>
            </div>
            {chatStarted && (
              <div className={`${chatOpen ? '' : 'hidden'} absolute inset-0 z-20 lg:static lg:inset-auto lg:w-[390px] xl:w-[420px] lg:shrink-0 min-h-0 border-l border-slate-200 bg-white shadow-[-10px_0_30px_rgba(15,23,42,0.08)]`}>
                <Suspense fallback={<p role="status" className="p-4 text-sm text-slate-500">Đang mở trợ lý…</p>}><AIChatModal
                  key={viewingDoc.id}
                  isOpen
                  onClose={() => setChatOpen(false)}
                  initialQuery={`Tư vấn chi tiết các quy định của ${viewingDoc.code} đối với hộ kinh doanh`}
                  embeddedDocument={{ id: viewingDoc.id, code: viewingDoc.code, title: viewingDoc.title }}
                /></Suspense>
              </div>
            )}
          </div>

          <footer className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-t border-slate-200 bg-white text-[11px] sm:text-xs text-slate-500">
            <span className="truncate">Bản PDF gốc · Chuyển trang và phóng to ngay tại đây.</span>
            <a
              href={viewingDoc.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Không xem được? Mở trực tiếp <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </footer>
        </div>
      </div>
    ),
    document.body
  );
};
