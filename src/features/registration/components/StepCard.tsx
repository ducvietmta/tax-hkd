import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Check,
  ShieldCheck,
  ListTodo,
} from 'lucide-react';
import type { RegStep } from '../types';
import { CostTimeBadge } from './CostTimeBadge';
import { DocChecklist } from './DocChecklist';
import { PortalLink } from './PortalLink';
import { LegalRefChips } from './LegalRefChips';

interface StepCardProps {
  step: RegStep;
  stepIndex: number;
  totalSteps: number;
  isDone: boolean;
  checkedDocIds: string[];
  onToggleDone: () => void;
  onToggleDoc: (docId: string) => void;
  onSelectDocId: (docId: string) => void;
  onOpenAIChat?: (query: string) => void;
}

export const StepCard: React.FC<StepCardProps> = ({
  step,
  stepIndex,
  totalSteps,
  isDone,
  checkedDocIds,
  onToggleDone,
  onToggleDoc,
  onSelectDocId,
  onOpenAIChat,
}) => {
  return (
    <article
      aria-label={`Chi tiết bước ${stepIndex + 1}: ${step.title}`}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white shadow-xs ${
        isDone ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200/90'
      }`}
    >
      {/* Header bar */}
      <div className="p-5 sm:p-7 border-b border-slate-100 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
              {stepIndex + 1}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Bước {stepIndex + 1} / {totalSteps}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleDone}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isDone
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200'
            }`}
          >
            {isDone ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Đã xong bước này</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Đánh dấu đã xong</span>
              </>
            )}
          </button>
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {step.title}
        </h3>

        <p className="text-sm sm:text-[15px] leading-relaxed text-slate-600">
          {step.summary}
        </p>

        <CostTimeBadge fee={step.fee} duration={step.duration} />
      </div>

      {/* Main content body */}
      <div className="p-5 sm:p-7 space-y-6">
        {/* Actions list */}
        {step.actions && step.actions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                Các việc cần thực hiện
              </h4>
            </div>
            <ul className="space-y-2.5">
              {step.actions.map((act, i) => (
                <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/80">
                    {i + 1}
                  </span>
                  <span className="flex-1">{act}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Documents checklist */}
        {step.documents && step.documents.length > 0 && (
          <DocChecklist
            documents={step.documents}
            checkedDocIds={checkedDocIds}
            onToggleDoc={onToggleDoc}
          />
        )}

        {/* Warnings / Common pitfalls */}
        {step.warnings && step.warnings.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
              <span>Lưu ý quan trọng & Lỗi hay gặp</span>
            </div>
            <ul className="space-y-1.5 text-amber-900/90 pl-6 list-disc">
              {step.warnings.map((warn, i) => (
                <li key={i} className="leading-relaxed">
                  {warn}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Portal outbound link */}
        {step.where && <PortalLink where={step.where} />}

        {/* Legal reference chips */}
        {step.legalRefs && step.legalRefs.length > 0 && (
          <LegalRefChips
            legalRefs={step.legalRefs}
            onSelectDocId={onSelectDocId}
          />
        )}
      </div>

      {/* Footer action bar */}
      <div className="px-5 sm:px-7 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          <span>Đối chiếu luật mới: <strong className="font-semibold text-slate-700">{step.verifiedAt}</strong></span>
        </div>

        {onOpenAIChat && (
          <button
            type="button"
            onClick={() => onOpenAIChat(step.aiPrompt)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 font-bold transition-all shadow-2xs cursor-pointer group"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" aria-hidden="true" />
            <span>Hỏi AI về bước này</span>
          </button>
        )}
      </div>
    </article>
  );
};
