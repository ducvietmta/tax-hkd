import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';

interface PortalLinkProps {
  where?: {
    label: string;
    url: string;
    note?: string;
  };
}

export const PortalLink: React.FC<PortalLinkProps> = ({ where }) => {
  if (!where || !where.url) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cổng dịch vụ công / Hệ thống chính thống</div>
          <div className="text-sm font-bold text-slate-900">{where.label}</div>
          {where.note && <div className="text-xs text-slate-500">{where.note}</div>}
        </div>
      </div>

      <a
        href={where.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
        aria-label={`Mở cổng ${where.label} trong tab mới`}
      >
        <span>Truy cập Cổng</span>
        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
      </a>
    </div>
  );
};
