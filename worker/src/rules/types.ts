/**
 * RULESET TYPES
 */

export interface ActivityRate {
  vat_rate: number;
  pit_rate: number;
  description: string;
}

export interface CitationRef {
  doc_id: string;
  name: string;
  article?: string;
  clause?: string;
  point?: string;
}

export interface TaxRuleset {
  ruleset_id: string;
  version: string;
  name: string;
  effective_from: string;
  effective_to: string | null;
  tax_year_range: [number, number];
  supersedes: string[];
  thresholds: {
    exemption_annual_vnd: number;
    income_method_mandatory_vnd?: number | null;
    income_method_tier2_vnd?: number | null;
    relief_max_revenue_vnd?: number | null;
  };
  rates: Record<string, ActivityRate>;
  pit_income_rates?: {
    tier1_voluntary?: number;
    tier2_mandatory?: number;
    tier3_high?: number;
  };
  relief_policies?: {
    nq43_pit_reduction_rate?: number;
    nq204_vat_reduction_rate?: number;
    nq204_vat_last_year?: number;
    note?: string;
  };
  citations: Record<string, CitationRef>;
}
