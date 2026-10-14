import React, { useState } from 'react';
import { ChevronDown, HelpCircle, FileText } from 'lucide-react';
import { REG_FAQS, type RegFAQItem } from '../data/faq';

interface RegFAQProps {
  onSelectDocId: (docId: string) => void;
}

export const RegFAQ: React.FC<RegFAQProps> = ({ onSelectDocId }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Giải đáp Thắc mắc Thường gặp (FAQ)
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Các điểm mấu chốt về pháp lý và chính sách thuế HKD năm 2026
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {REG_FAQS.map((item: RegFAQItem, idx: number) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="py-4 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full text-left flex items-start justify-between gap-3 cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                    {item.question}
                  </h4>
                </div>

                <div
                  className={`w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-transform shrink-0 ${
                    isOpen ? 'rotate-180 text-emerald-600 bg-emerald-50' : ''
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="mt-3 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
                  <p>{item.answer}</p>
                  {item.legalDocId && (
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectDocId(item.legalDocId!)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Xem văn bản luật đối chiếu</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
