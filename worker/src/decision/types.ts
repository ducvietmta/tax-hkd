/**
 * DECISION SYSTEM TYPE DEFINITIONS
 */

import type {
  TaxpayerType,
  Residency,
  IncomeType,
  TaxIntent,
  TaxCategory,
  ConversationAct,
  JurisdictionType,
  RevenueBasis,
  RevenueBand,
  RiskLevel,
  RetrievalStrategy,
  LegalStatus,
  EvidenceRelation,
  DecisionStatus,
} from './labels';

export type ValueSource = 'user_text' | 'history' | 'default' | 'inferred' | 'llm';

export interface Provenance<T> {
  value: T;
  confidence: number; // 0.0 - 1.0
  source: ValueSource;
  span?: string;      // Trích đoạn câu hỏi làm căn cứ trích xuất
}

export interface TaxPeriodFrame {
  years: number[];
  source: 'current_message' | 'user_history' | 'current_default';
  granularity: 'YEAR' | 'QUARTER' | 'MONTH' | 'EVENT_DATE';
  event_date?: string; // YYYY-MM-DD nếu người dùng nêu rõ ngày mở cửa/phát sinh
  is_historical: boolean;
  is_future_unsupported: boolean;
}

export interface MultiActivityItem {
  id: string;
  kind: 'goods' | 'service' | 'rental' | 'other';
  revenueVnd: number;
  vatRate?: number;
  pitRate?: number;
}

export interface TaxFactsFrame {
  revenue_vnd?: number;
  revenue_basis: RevenueBasis;
  taxable_income_vnd?: number;      // Thu nhập tính thuế (đối với phương pháp thu nhập)
  refund_deducted_vnd?: number;     // Tiền đơn hoàn đã trừ
  platform_fee_vnd?: number;        // Phí sàn
  shipping_cod_vnd?: number;        // Tiền thu hộ / ship
  is_resident: boolean | null;
  activity_type?: string;
  multi_activities?: MultiActivityItem[];
  vat_relief_assumed?: boolean;     // Người dùng giả định đủ điều kiện giảm VAT
}

export interface MissingFact {
  id: string;
  blocking: boolean;                // Nếu true: không thể chốt thuế, phải chuyển sang NEEDS_INFO
  ask: string;                     // Câu hỏi ngắn gọn để làm rõ dữ kiện
}

/**
 * Đầu ra của bước understandQuery (L1/L2)
 */
export interface TaxDecisionFrame {
  semantic?: { topic?: string; revenueContext?: string };
  schema_version: '1.0';
  tax_period: TaxPeriodFrame;
  taxpayer_type: Provenance<TaxpayerType>;
  residency: Provenance<Residency>;
  conversation_act: Provenance<ConversationAct>;
  jurisdiction: Provenance<JurisdictionType> & { province?: string };
  income_type: Array<Provenance<IncomeType>>;
  business_sector: Array<Provenance<string>>; // ID nhóm ngành từ ruleset
  tax_intent: {
    primary: Provenance<TaxIntent>;
    secondary: TaxIntent[];
  };
  tax_category: TaxCategory[];
  facts: TaxFactsFrame;
  missing_facts: MissingFact[];
  meta: {
    layer: 'L1' | 'L2' | 'PROVIDER';
    confidence: number;
    degraded: boolean;
    l2_used: boolean;
    latency_ms: number;
  };
}

export interface RetrievalPlan {
  semantic_topic?: string;
  allowed_refs?: string[];
  strategy: RetrievalStrategy;
  must_include_refs: string[];     // Các ref_id bắt buộc theo rule
  filter_years: number[];          // Chỉ lấy tài liệu đúng kỳ này
  filter_taxpayer_types?: TaxpayerType[];
  filter_intents?: TaxIntent[];
  boost_keywords: string[];
}

export interface ConflictEvent {
  code: 'CONFLICT_RULE_VS_EVIDENCE' | 'CONFLICT_EVIDENCE' | 'CONFLICT_PERIOD';
  description: string;
  source_a: string;
  source_b: string;
}

export interface RuleOutcome {
  rule_id: string;
  ruleset_version: string;
  outcome_code: string;
  amounts_vnd?: Record<string, number>;
  params_used: Record<string, { value: number | string | boolean; param_ref: string }>;
  citations: Array<{ doc_id: string; article?: string; clause?: string; point?: string }>;
  status: 'ANSWERED' | 'NEEDS_INFO' | 'NEEDS_LEGAL_REVIEW';
  explanation_template_id?: string;
}

export interface EvidenceItem {
  ref_id: string;
  chunk_id: string;
  legal_status: LegalStatus;
  evidence_relation: EvidenceRelation;
  period_match: 'EXACT' | 'PARTIAL' | 'MISMATCH';
  via: 'bm25' | 'route' | 'pinned' | 'vector';
  score: number;
}

/**
 * Đầu ra của Orchestrator: chứa toàn bộ quyết định có cấu trúc
 */
export interface StructuredDecision {
  schema_version: '1.0';
  frame: TaxDecisionFrame;
  decision_status: DecisionStatus;
  risk_level: RiskLevel;
  rule_outcomes: RuleOutcome[];
  evidence: EvidenceItem[];
  retrieval_plan: RetrievalPlan;
  allowed_claims: {
    numbers_vnd: number[];
    rates: number[];
    years: number[];
    documents: string[];
  };
  forbidden_claims: string[];
  must_cover_intents: string[];
  conflicts: ConflictEvent[];
  ask_user?: { question: string; reason_fact_id: string };
}

/**
 * Interface cho các Decision Model Provider (Quyet-1.0-Large, Workers AI, v.v.)
 */
export interface DecisionModelProvider {
  name: string;
  classifyIntent(text: string): Promise<{ intent: TaxIntent; confidence: number }>;
  classifyTaxpayer(text: string): Promise<{ taxpayer: TaxpayerType; confidence: number }>;
  classifyIncome(text: string): Promise<{ income: IncomeType; confidence: number }>;
}
