/**
 * RULESET REGISTRY
 *
 * Quản lý và tra cứu bộ quy tắc thuế theo năm tính thuế.
 * Thay thế toàn bộ các số hardcode trong codebase.
 */

import type { TaxRuleset } from './types';
import ruleset2026Json from './rulesets/hkd_2026.json';
import ruleset2025Json from './rulesets/hkd_2025.json';

const ruleset2026 = ruleset2026Json as unknown as TaxRuleset;
const ruleset2025 = ruleset2025Json as unknown as TaxRuleset;

export const RULESET_REGISTRY: Record<string, TaxRuleset> = {
  HKD_2026: ruleset2026,
  HKD_2025: ruleset2025,
};

export const CURRENT_RULESET_VERSION = `${ruleset2026.ruleset_id}_${ruleset2026.version}`;

/**
 * Tra cứu Ruleset phù hợp theo năm tính thuế
 */
export function getRulesetForYear(year: number): TaxRuleset {
  if (year >= 2026) {
    return ruleset2026;
  }
  return ruleset2025;
}
