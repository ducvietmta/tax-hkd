import { useEffect, useState } from 'react';
import { Check, Clock3, LoaderCircle } from 'lucide-react';
import { CHAT_PROGRESS_LABELS, type ChatProgress } from '../../shared/chatProgress';

export function AnswerProgress({ steps, complete = false }: { steps: ChatProgress[]; complete?: boolean }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (complete || !steps.length) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [complete, steps.length]);
  if (!steps.length) return null;
  const current = steps[steps.length - 1];
  const end = complete ? current.receivedAt ?? now : now;
  const seconds = Math.max(0, Math.floor((end - (steps[0].receivedAt ?? now)) / 1000));
  const duration = seconds < 60 ? `${seconds} giây` : `${Math.floor(seconds / 60)} phút ${seconds % 60} giây`;
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm" aria-busy={!complete}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-2 font-medium text-emerald-800">
          {!complete && <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
          {complete ? 'Các bước đã xử lý' : 'Tiến trình trực tiếp'}
        </span>
        <span className="inline-flex items-center gap-1.5 tabular-nums text-slate-500" aria-live="off">
          <Clock3 aria-hidden className="h-3.5 w-3.5" />{duration}
        </span>
      </div>
      {!complete && <p className="mb-3 font-semibold text-emerald-900" role="status" aria-live="polite" aria-atomic="true">
        {CHAT_PROGRESS_LABELS[current.stage]}…
      </p>}
      <ol className="space-y-2 text-xs text-slate-600">
        {steps.map(({stage}, i) => <li key={`${i}-${stage}`} className="flex items-center gap-2" aria-current={!complete && i === steps.length - 1 ? 'step' : undefined}>
          {!complete && i === steps.length - 1 ? <LoaderCircle aria-hidden className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-600" /> : <Check aria-hidden className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
          <span>{CHAT_PROGRESS_LABELS[stage]}</span>
        </li>)}
      </ol>
    </div>
  );
}

export function appendProgress(steps: ChatProgress[], progress: ChatProgress) {
  // A second review after repair is a real new milestone. Only coalesce
  // consecutive duplicates, so the current stage never gets stuck on repair.
  return steps.at(-1)?.stage === progress.stage ? steps : [...steps, { ...progress, receivedAt: Date.now() }];
}
