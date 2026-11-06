import policy from './sourcePolicy.json';
const blocked = new Set<string>(policy.blocked_verified_refs);
export const RECOGNITION_SOURCE_POLICY_VERSION = policy.version;
export function isBlockedVerifiedRef(ref:string):boolean { return blocked.has(ref); }
export function quarantineCandidates<T extends {chunk:{ref_id?:string|null;id:string};required?:unknown}>(rows:T[],requiredRefs:string[]=[]):{results:T[];removed_refs:string[];required_refs:string[]} {
  const removed=rows.filter(r=>isBlockedVerifiedRef(r.chunk.ref_id||r.chunk.id));
  return {results:rows.filter(r=>!isBlockedVerifiedRef(r.chunk.ref_id||r.chunk.id)),
    removed_refs:[...new Set(removed.map(r=>r.chunk.ref_id||r.chunk.id))],
    required_refs:[...new Set([...removed.filter(r=>r.required).map(r=>r.chunk.ref_id||r.chunk.id),...requiredRefs.filter(isBlockedVerifiedRef)])]};
}
