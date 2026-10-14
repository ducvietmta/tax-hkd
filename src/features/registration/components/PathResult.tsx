import React from 'react';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  Banknote,
  Store,
  UserCheck,
  ShoppingBag,
} from 'lucide-react';
import type { PathId, RegPath } from '../types';
import { REG_PATHS } from '../data/paths';
import type { PathDecision } from '../data/quiz';

interface PathResultProps {
  decision: PathDecision;
  onStartPath: (pathId: PathId) => void;
  onSelectOtherPath: (pathId: PathId) => void;
  onRetakeQuiz: () => void;
}

const PATH_ICONS: Record<PathId, React.ReactNode> = {
  individual: <UserCheck className="w-6 h-6 text-emerald-600" />,
  household: <Store className="w-6 h-6 text-emerald-600" />,
  platform: <ShoppingBag className="w-6 h-6 text-emerald-600" />,
};

export const PathResult: React.FC<PathResultProps> = ({
  decision,
  onStartPath,
  onSelectOtherPath,
  onRetakeQuiz,
}) => {
  const currentPath: RegPath = REG_PATHS[decision.pathId];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Result Card */}
      <div className="rounded-3xl bg-white border border-emerald-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-emerald-800 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>KẾT QUẢ TƯ VẤN MÔ HÌNH</span>
          </div>

          <button
            type="button"
            onClick={onRetakeQuiz}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Trả lời lại</span>
          </button>
        </div>

        {/* Title & Tagline */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            {PATH_ICONS[decision.pathId]}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              {decision.badge}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {currentPath.name}
            </h3>
            <p className="text-sm sm:text-[15px] text-slate-600 mt-1">
              {currentPath.tagline}
            </p>
          </div>
        </div>

        {/* Reason */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tại sao mô hình này phù hợp với bạn?
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            {decision.reason}
          </p>
        </div>

        {/* Highlights */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Điểm cốt lõi cần biết
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {decision.highlights.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700 leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fee & Time Badges */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="inline-flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl font-medium">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Thời gian xử lý: <strong className="text-slate-900">{currentPath.estimatedTotalTime}</strong></span>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl font-medium">
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span>Chi phí dự kiến: <strong className="text-slate-900">{currentPath.estimatedFee}</strong></span>
          </div>
        </div>

        {/* CTA to start */}
        <button
          type="button"
          onClick={() => onStartPath(decision.pathId)}
          className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <span>Bắt đầu xem hướng dẫn từng bước ngay</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Switch to other paths */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Hoặc bạn muốn tham khảo lộ trình khác?
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(['individual', 'household', 'platform'] as PathId[]).map((pid) => {
            const p = REG_PATHS[pid];
            const isCurrent = pid === decision.pathId;
            return (
              <button
                key={pid}
                type="button"
                onClick={() => onSelectOtherPath(pid)}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-medium'
                }`}
              >
                <div className="text-xs font-bold truncate">{p.shortName}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{p.estimatedTotalTime}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
