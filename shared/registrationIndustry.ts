import catalogue from '../src/features/registration/data/vsic2025.json';

export const INDUSTRY_VERSION = catalogue.version;
export const INDUSTRY_ROWS = catalogue.rows;
export const INDUSTRY_CLARIFICATIONS = {
  UNSUPPORTED_PROPERTY_RENTAL: 'Tạm thời chưa hỗ trợ hướng dẫn đăng ký cho hoạt động cho thuê bất động sản trong luồng này. Bạn có thể tiếp tục trên Cổng Dịch vụ công Quốc gia.',
  CLARIFY_ACTIVITY: 'Bạn trực tiếp làm công việc gì và khách hàng trả tiền cho phần việc nào? Hãy mô tả sản phẩm hoặc dịch vụ cụ thể.',
  CLARIFY_GOODS: 'Bạn bán hoặc sản xuất sản phẩm cụ thể nào? Bạn tự sản xuất, bán buôn hay bán lẻ cho người sử dụng?',
  CLARIFY_MAIN: 'Bạn hãy mô tả rõ phần việc còn chưa xác định: bạn trực tiếp sản xuất, bán hàng, cung cấp dịch vụ hay nhận hoa hồng? Bạn có thể đăng ký nhiều hoạt động; không cần bỏ bớt ngành để chọn một ngành duy nhất.',
  UNSUPPORTED: 'Chưa xác định được mã phù hợp từ danh mục. Bạn hãy mô tả rõ hoạt động thực tế hoặc đối chiếu danh mục chính thức bên dưới.',
} as const;
export type IndustryClarificationReason = keyof typeof INDUSTRY_CLARIFICATIONS;
export interface IndustryChoice { code:string; name:string; confidence:number }
export type IndustrySuggestion =
  | { status: 'suggested'; code: string; name: string; confidence: number; version: string; industries?:IndustryChoice[] }
  | { status: 'clarify'; reason: keyof typeof INDUSTRY_CLARIFICATIONS; question: string; version: string };

/** Both browser and Worker reject invented codes, names and malformed model output. */
export function validateIndustrySuggestion(value: unknown): value is IndustrySuggestion {
  const v = value as IndustrySuggestion | null;
  if (!v || v.version !== INDUSTRY_VERSION) return false;
  const validChoice=(c:IndustryChoice)=>!!c&&typeof c==='object'&&Number.isFinite(c.confidence)&&c.confidence>=.8&&c.confidence<=1&&INDUSTRY_ROWS.some(row=>row.code===c.code&&row.name===c.name);
  if (v.status === 'suggested') return validChoice(v) && (v.industries===undefined || (Array.isArray(v.industries)
    && v.industries.length>0 && v.industries.length<=8 && v.industries.every(validChoice)
    && new Set(v.industries.map(c=>c.code)).size===v.industries.length
    && v.industries[0].code===v.code && v.industries[0].confidence===v.confidence));
  return v.status === 'clarify' && Object.hasOwn(INDUSTRY_CLARIFICATIONS, v.reason)
    && INDUSTRY_CLARIFICATIONS[v.reason] === v.question;
}
