import React from 'react';
import { FileText, ArrowUpRight } from 'lucide-react';
import type { LegalRef } from '../types';

interface LegalRefChipsProps {
  legalRefs: LegalRef[];
  onSelectDocId: (docId: string) => void;
}

export const LegalRefChips: React.FC<LegalRefChipsProps> = ({ legalRefs, onSelectDocId }) => {
  if (!legalRefs || legalRefs.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <FileText className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
        <span>Căn cứ pháp lý gốc (Xem trực tiếp):</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {legalRefs.map((ref, idx) => {
          const isClickable = Boolean(ref.docId);
          return (
            <button
              key={`${ref.label}-${idx}`}
              type="button"
              disabled={!isClickable}
              onClick={() => {
                if (ref.docId) {
                  onSelectDocId(ref.docId);
                }
              }}
              title={ref.note ? `${ref.label} (${ref.note}) - Nhấn để xem tài liệu PDF gốc` : `${ref.label} - Nhấn để xem tài liệu PDF gốc`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isClickable
                  ? 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 shadow-2xs cursor-pointer group'
                  : 'bg-slate-100 text-slate-500 border border-slate-200 cursor-default'
              }`}
            >
              <span className="font-bold text-emerald-700">{ref.label}</span>
              {ref.note && <span className="text-slate-400 font-normal">· {ref.note}</span>}
              {isClickable && (
                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
