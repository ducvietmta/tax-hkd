import metadata from './chunkMeta.json';
import type { RagChunk } from '../ragEngine';

export interface ScopedSourceLink {
  doc_id:string; code:string; locator:string; scope:string; source_url:string; source_type:string;
  applies_from_year?:number; applies_to_year?:number;
}
export interface EvidenceProvenance {
  schema: 'taxhkd-evidence-v1';
  chunk_id: string;
  ref_id: string;
  metadata_state: 'REGISTERED' | 'MISSING' | 'IDENTITY_MISMATCH';
  legal_status: string;
  applies_from_year: number | null;
  applies_to_year: number | null;
  effective_from?:string;
  effective_to?:string;
  source_links?:ScopedSourceLink[];
  source_link_review?:{checked_on:string;content_sha256:string;status:string;coverage:string;limits:string};
}
/** Metadata is a recorded review state, not a new certification of the law. */
export function evidenceProvenance(chunk:RagChunk):EvidenceProvenance {
  const ref=chunk.ref_id||chunk.id;
  const table=(metadata as any).default||metadata;
  const meta=table[ref];
  return {schema:'taxhkd-evidence-v1',chunk_id:chunk.id,ref_id:ref,
    metadata_state:!meta?'MISSING':meta.id===chunk.id?'REGISTERED':'IDENTITY_MISMATCH',
    legal_status:meta?.legal_status||'UNKNOWN',applies_from_year:meta?.applies_from_year??null,
    applies_to_year:meta?.applies_to_year??null,
    ...(meta?.effective_from?{effective_from:meta.effective_from}:{}),
    ...(meta?.effective_to?{effective_to:meta.effective_to}:{}),
    ...(meta?.id===chunk.id&&meta.source_links?.length?{
      source_links:meta.source_links,source_link_review:meta.source_link_review,
    }: {})};
}
