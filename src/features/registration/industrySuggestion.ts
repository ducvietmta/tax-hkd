import { validateIndustrySuggestion, type IndustrySuggestion, type IndustryClarificationReason } from '../../../shared/registrationIndustry';

export async function suggestIndustry(activity: string, clarifications: string[], signal: AbortSignal, clarificationReasons: IndustryClarificationReason[] = []): Promise<IndustrySuggestion> {
  // Deliberately whitelist these two fields: never serialize the wizard answers.
  const response = await fetch('/api/registration-guide/industry', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activity, clarifications, ...(clarificationReasons.length?{clarificationReasons}:{}) }), signal,
  });
  const result: unknown = await response.json();
  if (!response.ok || !validateIndustrySuggestion(result)) throw new Error('INDUSTRY_UNAVAILABLE');
  return result;
}

/** Cancel/stale-result protection when editing, restarting or leaving the wizard. */
export function createIndustryRequest() {
  let generation = 0, controller: AbortController | undefined;
  return {
    cancel() { generation++; controller?.abort(); },
    async run(activity: string, clarifications: string[], apply: (result: IndustrySuggestion | null) => void, clarificationReasons: IndustryClarificationReason[] = []) {
      const current = ++generation; controller?.abort(); const active = new AbortController(); controller = active;
      // Muse has a 25s server deadline; allow time for admission and transport.
      const timer = setTimeout(() => active.abort(), 32000);
      try {
        const result = await suggestIndustry(activity, clarifications, active.signal, clarificationReasons);
        if (current === generation) apply(result);
      } catch { if (current === generation) apply(null); }
      finally { clearTimeout(timer); }
    },
  };
}
