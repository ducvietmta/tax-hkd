import type { ConversationTurn } from './conversation';
import { QuyetDecisionProvider, type TaxRelevance } from './decision/quyetProvider';

export async function resolveTaxRelevance(message: string, history: ConversationTurn[], apiKey?: string): Promise<TaxRelevance> {
  const started = Date.now();
  const result = apiKey
    ? await new QuyetDecisionProvider(apiKey).classifyTaxRelevance(message, history)
    : 'UNAVAILABLE';
  console.log('[TAX_SCOPE]', JSON.stringify({ model: 'Quyet-1.0-Large', result,
    durationMs: Date.now() - started, degraded: result === 'UNAVAILABLE', configured: !!apiKey }));
  // Only IN_SCOPE may reach retrieval/generation. A provider failure is not a scope judgment.
  return result;
}
