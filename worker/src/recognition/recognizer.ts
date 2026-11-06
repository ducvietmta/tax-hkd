export const RECOGNITION_POLICY_VERSION = 'rec-v1';

export interface RecognitionPacket {
  recognition_version: string;
  status: 'NO_MATCH' | 'MATCHED';
  matched_case_ids: string[];
  inferred_intents: string[];
  suggested_verified_card_ids: string[];
  expansion_phrase_ids?: string[];
}

export interface RecognitionResult {
  packet: RecognitionPacket;
  reason: string;
  matches: Array<{ case_id: string; score: number }>;
  cache_hit: boolean;
  duration_ms: number;
}

export interface RecognitionSettings {
  mode: 'off' | 'shadow' | 'on';
  strict: boolean;
  invalid: boolean;
}

export function recognitionConfig(env: any): RecognitionSettings {
  const rawMode = String(env?.CASE_RECOGNITION_MODE ?? 'off').toLowerCase().trim();
  const validModes = new Set(['off', 'shadow', 'on']);
  const invalid = Boolean(env?.CASE_RECOGNITION_MODE) && !validModes.has(rawMode);
  const mode = (validModes.has(rawMode) ? rawMode : 'off') as 'off' | 'shadow' | 'on';
  const strict = env?.STRICT_SOURCE_POLICY === '1' || env?.STRICT_SOURCE_POLICY === 'true';
  return { mode, strict, invalid };
}

export function expansionPhraseIds(packet: RecognitionPacket): string[] {
  return packet.expansion_phrase_ids || [];
}

export const caseRecognizer = {
  version: '1.0.0',
  async recognize(_query: string, _metaJson: string, enabled: boolean): Promise<RecognitionResult> {
    return {
      packet: {
        recognition_version: '1.0.0',
        status: 'NO_MATCH',
        matched_case_ids: [],
        inferred_intents: [],
        suggested_verified_card_ids: [],
        expansion_phrase_ids: [],
      },
      reason: enabled ? 'no_verified_case_match' : 'disabled',
      matches: [],
      cache_hit: false,
      duration_ms: 0,
    };
  },
};
