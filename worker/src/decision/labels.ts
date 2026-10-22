/**
 * TAX CLASSIFICATION LABELS REGISTRY
 * 
 * 4 Lớp nhãn theo Architecture Blueprint (§3):
 * - S (Semantic): Phân loại ngữ nghĩa, xác suất. KHÔNG được mang kết luận pháp lý.
 * - F (Fact/Derived): Dữ kiện số và trạng thái suy ra xác định từ ruleset.
 * - L (Legal Status): Trạng thái hiệu lực và quan hệ chứng cứ.
 * - V (Verified Decision): Kết luận nghĩa vụ thuế (chỉ sinh bởi Rules Engine kèm rule_id + citation).
 */

// --- LỚP S: SEMANTIC LABELS ---

export const TAXPAYER_TYPES = [
  'HOUSEHOLD_BUSINESS',    // Hộ kinh doanh (HKD)
  'INDIVIDUAL_BUSINESS',   // Cá nhân kinh doanh (CNKD)
  'INDIVIDUAL_EMPLOYEE',   // Cá nhân làm công ăn lương
  'ENTERPRISE',            // Doanh nghiệp
  'PLATFORM_OPERATOR',     // Tổ chức vận hành sàn TMĐT
  'UNKNOWN',
] as const;
export type TaxpayerType = typeof TAXPAYER_TYPES[number];

export const RESIDENCIES = [
  'RESIDENT',              // Cá nhân cư trú
  'NON_RESIDENT',          // Cá nhân không cư trú
  'UNKNOWN',
] as const;
export type Residency = typeof RESIDENCIES[number];

export const INCOME_TYPES = [
  'GOODS_SALES',           // Bán buôn, bán lẻ hàng hóa
  'SERVICE',               // Dịch vụ chung, xây dựng không bao thầu NVL
  'FOOD_SERVICE',          // Dịch vụ ăn uống
  'PROPERTY_RENTAL',       // Cho thuê tài sản (nhà, xe, mặt bằng)
  'MARKETPLACE_SALES',     // Bán hàng trên sàn thương mại điện tử
  'AFFILIATE_COMMISSION',  // Hoa hồng tiếp thị liên kết (Affiliate)
  'CONTENT_ADS',           // Quảng cáo nội dung số (YouTube, Facebook, TikTok)
  'FREELANCE_SERVICE',     // Dịch vụ tự do (lập trình, thiết kế, tư vấn)
  'WAGE_SALARY',           // Tiền lương, tiền công
  'OTHER',                 // Thu nhập khác
  'UNKNOWN',
] as const;
export type IncomeType = typeof INCOME_TYPES[number];

export const TAX_INTENTS = [
  'REGISTRATION',          // Đăng ký thuế, thành lập HKD/CNKD
  'TAX_ID_888',            // Mã số thuế 888 (định danh 14 số)
  'SYSTEM_REGISTRATION',   // Nhóm A: Thủ tục đăng ký trên hệ thống điện tử (TK thuế điện tử, HĐĐT, NPT, TK ngân hàng...)
  'PORTAL_TROUBLESHOOTING',// Nhóm B: Gỡ lỗi khi dùng hệ thống web/app thuế (đăng nhập, CKS, nộp tờ khai, eTax Mobile...)
  'TAX_SOFTWARE_SYSTEM',   // Nhóm C: Giải đáp về phần mềm/hệ thống cơ quan thuế (thuedientu, canhan, canhantmdt, eTax Mobile, HTKK...)
  'DECLARATION_FILING',    // Kê khai thuế, thời hạn nộp tờ khai
  'TAX_CALCULATION',       // Tính số thuế phải nộp (số tiền, thuế suất)
  'EXEMPTION_ELIGIBILITY', // Ngưỡng miễn thuế, điều kiện không phải nộp
  'E_INVOICE',             // Hóa đơn điện tử, máy tính tiền, thời hạn 30 ngày
  'ACCOUNTING_BOOKS',      // Chế độ kế toán, sổ sách, chứng từ
  'PENALTY',               // Xử phạt chậm nộp, trốn thuế, không đăng ký
  'REFUND',                // Hoàn thuế, bù trừ thuế
  'PLATFORM_WITHHOLDING',  // Sàn TMĐT khấu trừ/nộp thay
  'RELIEF_REDUCTION',      // Giảm thuế (NQ43/2026, NQ204/2025, v.v.)
  'LICENSE_FEE',           // Lệ phí môn bài
  'STATUS_CHANGE',         // Thay đổi thông tin, tạm ngừng, giải thể
  'PROCEDURE_HOWTO',       // Hướng dẫn thủ tục, cổng dịch vụ công
  'LEGAL_TEXT_LOOKUP',     // Tra cứu văn bản pháp luật, nghị định, thông tư
  'COMPARE_PERIODS',       // So sánh chính sách các năm (2025 vs 2026)
  'OTHER_TAX',             // Câu hỏi thuế khác
  'OUT_OF_SCOPE',          // Ngoài phạm vi
] as const;
export type TaxIntent = typeof TAX_INTENTS[number];

export type AbcCategory = 'A' | 'B' | 'C' | null;

export const ABC_REGISTRATION_TOPICS = [
  'BUSINESS_CESSATION',
  'SYSTEM_REGISTRATION',
  'BUSINESS_REGISTRATION',
  'TAX_REGISTRATION',
  'REGISTRATION_COMPARISON',
  'REGISTRATION_REQUIREMENTS',
  'INVOICE_REGISTRATION',
] as const;

export function resolveAbcCategory(topic?: string, primaryIntent?: TaxIntent, secondaryIntents: TaxIntent[] = []): AbcCategory {
  if (topic === 'PORTAL_TROUBLESHOOTING' || primaryIntent === 'PORTAL_TROUBLESHOOTING' || secondaryIntents.includes('PORTAL_TROUBLESHOOTING')) {
    return 'B';
  }
  if (topic === 'TAX_SOFTWARE_SYSTEM' || primaryIntent === 'TAX_SOFTWARE_SYSTEM' || secondaryIntents.includes('TAX_SOFTWARE_SYSTEM')) {
    return 'C';
  }
  if (
    (topic && (ABC_REGISTRATION_TOPICS as readonly string[]).includes(topic)) ||
    primaryIntent === 'SYSTEM_REGISTRATION' ||
    primaryIntent === 'REGISTRATION' ||
    primaryIntent === 'TAX_ID_888' ||
    secondaryIntents.includes('SYSTEM_REGISTRATION')
  ) {
    return 'A';
  }
  return null;
}

export const TAX_CATEGORIES = [
  'VAT',                   // Thuế Giá trị gia tăng
  'PIT',                   // Thuế Thu nhập cá nhân
  'CIT',                   // Thuế Thu nhập doanh nghiệp
  'LICENSE_FEE',           // Lệ phí môn bài
  'ADMIN_PENALTY',         // Xử phạt vi phạm hành chính thuế
  'TAX_ADMIN',             // Quản lý thuế (thủ tục, hóa đơn, sổ sách)
  'SOCIAL_INSURANCE',      // BHXH (nếu liên quan)
  'NONE',
] as const;
export type TaxCategory = typeof TAX_CATEGORIES[number];

export const CONVERSATION_ACTS = [
  'NEW_QUESTION',          // Câu hỏi chủ đề mới
  'FOLLOW_UP_FACT',        // Bổ sung dữ kiện cho câu hỏi trước ("còn nếu 800tr?")
  'CORRECTION',            // Tự đính chính ("ý mình là năm 2025")
  'TOPIC_SWITCH',          // Chuyển chủ đề trong hội thoại
] as const;
export type ConversationAct = typeof CONVERSATION_ACTS[number];

export const JURISDICTIONS = [
  'NATIONAL',              // Toàn quốc (văn bản trung ương)
  'LOCAL',                 // Địa phương (Hà Nội, TP.HCM, v.v.)
  'UNKNOWN',
] as const;
export type JurisdictionType = typeof JURISDICTIONS[number];

// --- LỚP F: FACT & DERIVED LABELS ---

export const REVENUE_BASES = [
  'ANNUAL',                // Doanh thu năm
  'MONTHLY',               // Doanh thu tháng
  'QUARTERLY',             // Doanh thu quý
  'UNSPECIFIED',           // Chưa rõ kỳ (không tự động nhân 12)
] as const;
export type RevenueBasis = typeof REVENUE_BASES[number];

export const REVENUE_BANDS = [
  'BELOW_EXEMPTION',       // Dưới ngưỡng miễn thuế
  'AT_EXEMPTION',          // Đúng bằng ngưỡng
  'ABOVE_EXEMPTION',       // Trên ngưỡng miễn thuế
  'ABOVE_3B',              // Trên 3 tỷ (phương pháp thu nhập tính thuế 17%)
  'ABOVE_50B',             // Trên 50 tỷ
  'UNKNOWN',
] as const;
export type RevenueBand = typeof REVENUE_BANDS[number];

export const RISK_LEVELS = [
  'LOW',                   // An toàn, dữ kiện rõ, đã xác minh
  'MEDIUM',                // Thiếu dữ kiện phụ hoặc retriever dùng fallback
  'HIGH',                  // Doanh thu sát ngưỡng, năm lịch sử, chạm vùng xám
  'CRITICAL',              // Xử phạt, mâu thuẫn chứng cứ chưa giải quyết, ngoài phạm vi
] as const;
export type RiskLevel = typeof RISK_LEVELS[number];

export const RETRIEVAL_STRATEGIES = [
  'ROUTE_FIRST',           // Ưu tiên theo route đã cấu hình
  'BM25_ONLY',             // Truy xuất BM25 thuần túy
  'BM25_MULTI_QUERY',      // Nhiều biến thể query
  'PINNED_REFS',           // Ghim tài liệu bắt buộc theo rule
  'HYBRID_VECTOR',         // Vector search kết hợp BM25 (dự phòng)
] as const;
export type RetrievalStrategy = typeof RETRIEVAL_STRATEGIES[number];

// --- LỚP L: LEGAL STATUS LABELS ---

export const LEGAL_STATUSES = [
  'VERIFIED',              // Đã xác minh có hiệu lực
  'VERIFIED_CONDITIONAL',  // Đã xác minh kèm điều kiện áp dụng
  'PENDING',               // Chủ đề chưa ngã ngũ, đang chờ hướng dẫn
  'SUPERSEDED',            // Đã bị thay thế bởi văn bản mới hơn
  'NOT_YET_EFFECTIVE',     // Chưa có hiệu lực thi hành
  'EXPIRED',               // Hết hiệu lực
  'NO_BASIS',              // Không tìm thấy căn cứ pháp lý
] as const;
export type LegalStatus = typeof LEGAL_STATUSES[number];

export const EVIDENCE_RELATIONS = [
  'SUPPORTS',              // Ủng hộ trực tiếp kết luận
  'CONDITIONAL_SUPPORT',   // Ủng hộ nhưng có điều kiện kèm theo
  'CONTRADICTS',           // Mâu thuẫn với kết luận hoặc chứng cứ khác
  'SUPERSEDES',            // Thay thế chứng cứ cũ hơn
  'CONTEXT_ONLY',          // Chỉ cung cấp bối cảnh nền
  'NOT_RELEVANT',          // Lệch kỳ hoặc không liên quan
] as const;
export type EvidenceRelation = typeof EVIDENCE_RELATIONS[number];

// --- LỚP V: VERIFIED DECISION LABELS ---

export const DECISION_STATUSES = [
  'ANSWERABLE_VERIFIED',      // Đủ dữ kiện, đã tính/chốt chính xác bằng Rules Engine
  'ANSWERABLE_WITH_EVIDENCE', // Đủ chứng cứ RAG để trả lời tổng hợp
  'CONDITIONAL',              // Trả lời theo các kịch bản/điều kiện
  'NEEDS_INFO',               // Thiếu dữ kiện chặn (blocking fact) -> cần hỏi lại 1 câu
  'NEEDS_LEGAL_REVIEW',       // Xung đột pháp lý hoặc kỳ chưa hỗ trợ -> khuyến cáo rà soát
  'OUT_OF_SCOPE',             // Ngoài phạm vi tư vấn thuế HKD/CNKD
  'NO_BASIS',                 // Không đủ cơ sở pháp lý để khẳng định
] as const;
export type DecisionStatus = typeof DECISION_STATUSES[number];
