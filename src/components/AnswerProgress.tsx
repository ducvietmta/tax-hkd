import { Check, LoaderCircle } from 'lucide-react';
import { CHAT_PROGRESS_LABELS, type ChatProgress } from '../../shared/chatProgress';

export function AnswerProgress({ steps, complete = false }: { steps: ChatProgress[]; complete?: boolean }) {
  if (!steps.length) return null;
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm">
      {!complete && <p className="mb-3 font-semibold text-emerald-900" role="status" aria-live="polite">
        {CHAT_PROGRESS_LABELS[steps[steps.length - 1].stage]}…
      </p>}
      <ol className="space-y-2 text-xs text-slate-600">
        {steps.map(({stage}, i) => <li key={stage} className="flex items-center gap-2">
          {!complete && i === steps.length - 1 ? <LoaderCircle aria-hidden className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-600" /> : <Check aria-hidden className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
          <span>{CHAT_PROGRESS_LABELS[stage]}</span>
        </li>)}
      </ol>
    </div>
  );
}

export function appendProgress(steps: ChatProgress[], progress: ChatProgress) {
  return steps.some(step => step.stage === progress.stage) ? steps : [...steps, progress];
}
