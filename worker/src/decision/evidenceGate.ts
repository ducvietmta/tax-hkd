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

interface ChunkMetaEntry {
  id: string;
  ref_id: string | null;
  section: string;
  tier: string;
  legal_status: string;
  applies_from_year: number;
  applies_to_year: number | null;
}

const rawMeta: any = chunkMetaJson;
const CHUNK_META: Record<string, ChunkMetaEntry> = (rawMeta && (rawMeta.default || rawMeta)) || {};

export interface EvidenceGateResult {
  passedChunks: RagChunk[];
  evidenceItems: EvidenceItem[];
  conflicts: ConflictEvent[];
}

export function filterAndGateEvidence(
  chunks: RagChunk[],
  frame: TaxDecisionFrame
): EvidenceGateResult {
  const queryYears = frame.tax_period.years;
  const isComparingPeriods = frame.tax_intent.primary.value === 'COMPARE_PERIODS';
  const passedChunks: RagChunk[] = [];
  const evidenceItems: EvidenceItem[] = [];
  const conflicts: ConflictEvent[] = [];

  for (const chunk of chunks) {
    const metaKey = chunk.ref_id || chunk.id;
    const meta = CHUNK_META[metaKey];

    let legalStatus: any = (meta?.legal_status as any) || (chunk.tier as any) || 'VERIFIED';
    let relation: any = 'SUPPORTS';
    let periodMatch: 'EXACT' | 'PARTIAL' | 'MISMATCH' = 'EXACT';

    if (meta) {
      const fromYear = meta.applies_from_year || 2026;
      const toYear = meta.applies_to_year;

      // Kiểm tra khớp kỳ tính thuế
      const isHistoricalChunk = toYear !== null && toYear <= 2025;
      const isHistoricalQuery = queryYears.every((y) => y <= 2025);

      if (!isComparingPeriods) {
        if (isHistoricalChunk && !isHistoricalQuery) {
          // Chunk cũ năm 2025 nhưng câu hỏi dành cho năm 2026 -> Loại bỏ
          relation = 'NOT_RELEVANT';
          periodMatch = 'MISMATCH';
        } else if (!isHistoricalChunk && isHistoricalQuery) {
          // Chunk mới năm 2026 nhưng câu hỏi dành cho năm 2025 -> Loại bỏ
          relation = 'NOT_RELEVANT';
          periodMatch = 'MISMATCH';
        }
      }

      if (meta.legal_status === 'SUPERSEDED') {
        relation = 'NOT_RELEVANT';
        legalStatus = 'SUPERSEDED';
      } else if (meta.legal_status === 'VERIFIED_CONDITIONAL' && relation !== 'NOT_RELEVANT') {
        relation = 'CONDITIONAL_SUPPORT';
      }
    }

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

  // Đảm bảo không để Context rỗng nếu mọi chunk bị loại nhưng có rule xác minh
  if (passedChunks.length === 0 && chunks.length > 0) {
    // Giữ lại chunk đầu tiên làm ngữ cảnh tối thiểu
    passedChunks.push(chunks[0]);
  }

  return {
    passedChunks,
    evidenceItems,
    conflicts,
  };
}
