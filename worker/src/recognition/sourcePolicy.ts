export function quarantineCandidates<T>(
  results: T[],
  _requiredRefs: string[],
): { results: T[]; removed_refs: string[]; required_refs: string[] } {
  return {
    results,
    removed_refs: [],
    required_refs: [],
  };
}
