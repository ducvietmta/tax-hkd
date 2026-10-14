import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle, Minus, Plus, RotateCcw } from 'lucide-react';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerSrc;

interface PdfDocumentViewerProps {
  url: string;
  title: string;
}

export default function PdfDocumentViewer({ url, title }: PdfDocumentViewerProps) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [status, setStatus] = useState<'loading' | 'rendering' | 'ready' | 'error'>('loading');
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const task = getDocument({ url });
    let active = true;
    setDocument(null);
    setPageNumber(1);
    setZoom(1);
    setStatus('loading');

    task.promise.then(
      (pdf) => {
        if (active) setDocument(pdf);
      },
      () => {
        if (active) setStatus('error');
      },
    );

    return () => {
      active = false;
      void task.destroy();
    };
  }, [url]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(Math.max(0, entry.contentRect.width - 32));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!document || !containerWidth || !canvasRef.current) return;
    let active = true;
    let renderTask: RenderTask | undefined;
    setStatus('rendering');

    void document.getPage(pageNumber).then(async (page) => {
      if (!active || !canvasRef.current) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = (containerWidth / baseViewport.width) * zoom;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport,
        transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
      });
      await renderTask.promise;
      if (active) setStatus('ready');
    }).catch((error: unknown) => {
      if (active && !(error instanceof Error && error.name === 'RenderingCancelledException')) {
        setStatus('error');
      }
    });

    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [document, pageNumber, zoom, containerWidth]);

  const totalPages = document?.numPages ?? 0;
  const changeZoom = (amount: number) => setZoom((current) => Math.min(2, Math.max(0.75, Math.round((current + amount) * 100) / 100)));

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-200/70">
      <div className="shrink-0 flex min-h-12 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-5 text-slate-700">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setPageNumber((n) => Math.max(1, n - 1))} disabled={pageNumber <= 1} aria-label="Trang trước" className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-[82px] text-center text-xs font-semibold tabular-nums">{totalPages ? `${pageNumber} / ${totalPages}` : 'Đang tải'}</span>
          <button type="button" onClick={() => setPageNumber((n) => Math.min(totalPages, n + 1))} disabled={!totalPages || pageNumber >= totalPages} aria-label="Trang sau" className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.75} aria-label="Thu nhỏ" className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed"><Minus className="h-4 w-4" /></button>
          <span className="min-w-[38px] text-center text-xs font-semibold tabular-nums">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= 2} aria-label="Phóng to" className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed"><Plus className="h-4 w-4" /></button>
          <button type="button" onClick={() => setZoom(1)} disabled={zoom === 1} aria-label="Vừa khung" className="hidden sm:inline-flex rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed"><RotateCcw className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={viewportRef} className="relative min-h-0 flex-1 overflow-auto overscroll-contain p-4 sm:p-6">
        <div className="relative mx-auto w-fit min-w-0 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5">
          <canvas ref={canvasRef} role="img" aria-label={`${title}, trang ${pageNumber} trên ${totalPages || 'đang tải'}`} className="block max-w-none" />
          {status === 'error' && (
            <div role="alert" className="absolute inset-0 min-h-72 max-w-sm p-6 flex flex-col items-center justify-center bg-white text-center">
              <p className="font-semibold text-slate-800">Không thể hiển thị PDF trong trang</p>
              <p className="mt-2 text-sm text-slate-500">Bạn có thể dùng nút “Mở tab mới” hoặc tải tài liệu để xem trực tiếp.</p>
            </div>
          )}
          {(status === 'loading' || status === 'rendering') && (
            <div role="status" aria-live="polite" className="absolute inset-0 min-h-72 flex flex-col items-center justify-center gap-3 bg-white text-slate-500">
              <LoaderCircle className="h-7 w-7 animate-spin text-emerald-600" aria-hidden="true" />
              <span className="text-sm font-medium">Đang mở văn bản PDF…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
