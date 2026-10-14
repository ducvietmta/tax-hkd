import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProgressSummaryProps {
  totalSteps: number;
  completedCount: number;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  totalSteps,
  completedCount,
  onPrev,
  onNext,
  isFirst,
  isLast,
}) => {
  const percent = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tiến độ hoàn thành hồ sơ
          </div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            Đã hoàn thành <strong className="text-emerald-700">{completedCount}</strong> / {totalSteps} bước ({percent}%)
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isFirst}
            onClick={onPrev}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Trước</span>
          </button>

          <button
            type="button"
            disabled={isLast}
            onClick={onNext}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
          >
            <span>Tiếp theo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
