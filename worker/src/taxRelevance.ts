import type { ConversationTurn } from './conversation';
import { QuyetDecisionProvider, type TaxRelevance } from './decision/quyetProvider';

export async function resolveTaxRelevance(
  message: string,
  history: ConversationTurn[],
  apiKey?: string,
  endpoint?: string,
  modelName?: string
): Promise<TaxRelevance> {
  const started = Date.now();
  const provider = apiKey ? new QuyetDecisionProvider(apiKey, endpoint, 30000, modelName) : null;
  const result = provider
    ? await provider.classifyTaxRelevance(message, history)
    : 'UNAVAILABLE';
  console.log('[TAX_SCOPE]', JSON.stringify({ model: provider?.name || 'none', result,
    durationMs: Date.now() - started, degraded: result === 'UNAVAILABLE', configured: !!apiKey }));
  // Only IN_SCOPE may reach retrieval/generation. A provider failure is not a scope judgment.
  return result;
}
