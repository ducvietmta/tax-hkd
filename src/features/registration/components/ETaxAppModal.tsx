import { Smartphone, QrCode, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { ETAX_LINKS } from '../etaxDeepLink';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ETaxAppModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
    ETAX_LINKS.universalRedirect
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Smartphone size={14} />
            <span>Ứng dụng eTax Mobile</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            Mở hoặc Cài đặt trên Điện thoại
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Quét mã QR bằng Camera điện thoại (iPhone hoặc Android) để mở hoặc cài đặt ứng dụng chính thức từ Tổng cục Thuế.
          </p>
        </div>

        {/* QR Code Card */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
          <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-100">
            <img
              src={qrImageUrl}
              alt="Mã QR mở eTax Mobile"
              width={180}
              height={180}
              className="rounded-lg object-contain"
            />
          </div>
          <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-slate-700">
            <QrCode size={14} className="text-emerald-600" />
            <span>Quét bằng Camera điện thoại</span>
          </span>
        </div>

        {/* Direct Store Links */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={ETAX_LINKS.appStore}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>App Store (iOS)</span>
              <ExternalLink size={12} />
            </a>
            <a
              href={ETAX_LINKS.googlePlay}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Google Play</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <a
            href={ETAX_LINKS.webPortal}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-emerald-800 hover:text-emerald-900 hover:underline"
          >
            <span>Dùng trên máy tính: Mở Cổng Thuế Điện Tử (canhan.gdt.gov.vn)</span>
            <ExternalLink size={11} />
          </a>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
          <span>Ứng dụng chính thức Tổng cục Thuế Việt Nam · Đăng nhập bảo mật qua VNeID.</span>
        </div>
      </div>
    </div>
  );
}
