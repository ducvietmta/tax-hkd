/**
 * EVIDENCE GATE
 *
 * Kiểm tra tính hợp lệ và quan hệ chứng cứ TRƯỚC KHI nạp vào Context của LLM.
 * Ngăn chặn tuyệt đối việc chunk văn bản cũ (2025) lọt vào trả lời cho năm 2026
 * và ngược lại.
 */

import type { RagChunk } from '../ragEngine';
import type { TaxDecisionFrame, EvidenceItem, ConflictEvent } from './types';
import chunkMetaJson from '../kb/chunkMeta.json';
import { periodFits } from '../kb/periodApplicability';

interface ChunkMetaEntry {
  id: string;
  ref_id: string | null;
  section: string;
  tier: string;
  legal_status: string;
  applies_from_year: number;
  applies_to_year: number | null;
  effective_from?:string;
  effective_to?:string;
}

const rawMeta: any = chunkMetaJson;
const CHUNK_META: Record<string, ChunkMetaEntry> = (rawMeta && (rawMeta.default || rawMeta)) || {};

export interface EvidenceGateResult {
  passedChunks: RagChunk[];
  evidenceItems: EvidenceItem[];
  conflicts: ConflictEvent[];
}

/** Subject scope is source metadata, not an inference from question words. */
export function isSubjectCompatible(chunk:RagChunk,frame:TaxDecisionFrame):boolean{
  const context=frame.semantic?.subjectContext&&frame.semantic.subjectContext!=='UNKNOWN'?frame.semantic.subjectContext:
    frame.semantic?.registrationStatus==='DIRECT_TAX_ONLY'?'INDIVIDUAL_ACTIVITY':undefined;
  return !chunk.subject_scope?.length||!context||
    chunk.subject_scope.includes(context)||frame.semantic?.registrationStatus==='HOUSEHOLD_REGISTERED';
}

export function filterAndGateEvidence(
  chunks: RagChunk[],
  frame: TaxDecisionFrame
): EvidenceGateResult {
  const queryYears = frame.tax_period.years;
  const passedChunks: RagChunk[] = [];
  const evidenceItems: EvidenceItem[] = [];
  const conflicts: ConflictEvent[] = [];

  for (const chunk of chunks) {
    const metaKey = chunk.ref_id || chunk.id;
    const meta = CHUNK_META[metaKey];

    let legalStatus: any = (meta?.legal_status as any) || 'VERIFIED_CONDITIONAL';
    let relation: any = 'SUPPORTS';
    let periodMatch: 'EXACT' | 'PARTIAL' | 'MISMATCH' = 'EXACT';

    if (meta) {
      // Year-level metadata cannot establish day-level applicability. Keep the
      // evidence conditional so semantic review must read transition clauses.
      if(frame.tax_period.event_date&&!meta.effective_from)periodMatch='PARTIAL';
      // Year-level metadata cannot establish day-level applicability. Keep the
      // evidence conditional so semantic review must read transition clauses.
      if(frame.tax_period.event_date&&!meta.effective_from)periodMatch='PARTIAL';

      // Kiểm tra khớp kỳ tính thuế
      if (queryYears.length && !periodFits(meta,frame.tax_period)) {
        relation = 'NOT_RELEVANT';
        periodMatch = 'MISMATCH';
      }

      if (['SUPERSEDED', 'EXPIRED', 'NOT_YET_EFFECTIVE'].includes(meta.legal_status)) {
        relation = 'NOT_RELEVANT';
        legalStatus = meta.legal_status;
      } else if (meta.legal_status === 'VERIFIED_CONDITIONAL' && relation !== 'NOT_RELEVANT') {
        relation = 'CONDITIONAL_SUPPORT';
      }
    } else {
      relation = 'CONDITIONAL_SUPPORT';
      periodMatch = 'PARTIAL';
    }

    if(!isSubjectCompatible(chunk,frame))relation='NOT_RELEVANT';
    const item: EvidenceItem = {
      ref_id: chunk.ref_id || chunk.id,
      chunk_id: chunk.id,
      legal_status: legalStatus,
      evidence_relation: relation,
      period_match: periodMatch,
      via: 'bm25',
      score: 1.0,
    };

    evidenceItems.push(item);

    // Chỉ đưa vào Context LLM nếu chứng cứ không bị đánh dấu NOT_RELEVANT
    if (relation !== 'NOT_RELEVANT') {
      passedChunks.push(chunk);
    }
  }

  return {
    passedChunks,
    evidenceItems,
    conflicts,
  };
}
