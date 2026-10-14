import React from 'react';
import { Check } from 'lucide-react';
import type { RegStep } from '../types';

interface StepRailProps {
  steps: RegStep[];
  currentStepId: string;
  doneStepIds: string[];
  onSelectStep: (stepId: string) => void;
}

export const StepRail: React.FC<StepRailProps> = ({
  steps,
  currentStepId,
  doneStepIds,
  onSelectStep,
}) => {
  return (
    <>
      {/* Mobile Horizontal Scroll Rail */}
      <nav
        aria-label="Điều hướng các bước trên điện thoại"
        className="lg:hidden flex items-center gap-2 overflow-x-auto pb-3 pt-1 px-1 scrollbar-none snap-x"
      >
        {steps.map((s, idx) => {
          const isActive = s.id === currentStepId;
          const isDone = doneStepIds.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              aria-current={isActive ? 'step' : undefined}
              onClick={() => onSelectStep(s.id)}
              className={`shrink-0 snap-start inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isDone ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
              </span>
              <span className="max-w-[130px] truncate">{s.title}</span>
            </button>
          );
        })}
      </nav>

      {/* Desktop Sticky Vertical Rail */}
      <nav
        aria-label="Danh sách các bước thực hiện"
        className="hidden lg:block sticky top-24 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-1.5"
      >
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          Lộ trình từng bước
        </div>

        <ol className="space-y-1">
          {steps.map((s, idx) => {
            const isActive = s.id === currentStepId;
            const isDone = doneStepIds.includes(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={isActive ? 'step' : undefined}
                  onClick={() => onSelectStep(s.id)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-emerald-50/80 border border-emerald-200/90 shadow-2xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5 transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                        : isDone
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Bước {idx + 1}
                      </span>
                      {isDone && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                          Xong
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-xs font-bold truncate leading-snug ${
                        isActive
                          ? 'text-emerald-900'
                          : isDone
                          ? 'text-slate-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {s.title}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
