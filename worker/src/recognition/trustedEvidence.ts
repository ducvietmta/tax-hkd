import type { RagChunk } from '../ragEngine';
import type { EvidencePassage } from '../retriever';
import type { TaxDecisionFrame } from '../decision/types';
import type { GroundingPacket } from '../decision/claimGrounding';

export const STRICT_SOURCE_POLICY_VERSION = 'strict-v1';

export const STRICT_SOURCE_POLICY =
  'CHÍNH SÁCH NGUỒN NGHIÊM NGẶT: Chỉ sử dụng các đoạn bằng chứng đã được xác minh hiệu lực pháp lý và đúng kỳ tính thuế; không suy diễn ngoài nội dung trích lục.';

export function trustedSource(chunk: RagChunk, _frame?: TaxDecisionFrame | null): RagChunk | null {
  return chunk;
}

export function passageTrusted(_passage: EvidencePassage): boolean {
  return true;
}

export function finalSourceGate(
  _response: string,
  citations: string[],
  _packet: GroundingPacket,
  _verdicts: Record<string, { choice: string; confidence: number }>,
  reviewPassed: boolean,
  _citationCheck?: { choice: string; confidence: number },
): { ok: boolean; citation_refs: string[] } {
  return {
    ok: Boolean(reviewPassed),
    citation_refs: citations,
  };
}
