import React from 'react';
import { Clock, Banknote } from 'lucide-react';

interface CostTimeBadgeProps {
  fee?: string;
  duration?: string;
}

export const CostTimeBadge: React.FC<CostTimeBadgeProps> = ({ fee, duration }) => {
  if (!fee && !duration) return null;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {duration && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
          <span>Thời hạn: <strong className="font-bold text-blue-800">{duration}</strong></span>
        </div>
      )}
      {fee && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-2xs">
          <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>Lệ phí: <strong className="font-bold text-emerald-900">{fee}</strong></span>
        </div>
      )}
    </div>
  );
};
