import React from 'react';
import { BookOpen, ChevronDown, Sparkles } from 'lucide-react';

export interface RetrievalTraceData {
  method: string;
  evidence: { title: string; conditional: boolean }[];
  decision?: {
    layer?: string;
    model?: string;
    taxpayer?: string;
    intent?: string;
    income?: string;
    revenueVnd?: number;
    confidence?: number;
  };
}

function formatTaxpayerLabel(val?: string) {
  if (val === 'HOUSEHOLD_BUSINESS') return 'Hộ kinh doanh cá thể';
  if (val === 'INDIVIDUAL_BUSINESS') return 'Cá nhân kinh doanh';
  if (val === 'INDIVIDUAL_EMPLOYEE') return 'Người làm công ăn lương';
  if (val === 'ENTERPRISE') return 'Doanh nghiệp / Công ty';
  return val || 'Chưa xác định';
}

function formatIntentLabel(val?: string) {
  if (val === 'TAX_CALCULATION') return 'Tính số thuế & Thuế suất';
  if (val === 'REGISTRATION') return 'Đăng ký & Mã số thuế 888';
  if (val === 'E_INVOICE') return 'Hóa đơn điện tử (HĐĐT)';
  if (val === 'DECLARATION_FILING') return 'Kê khai & Nộp tờ khai';
  if (val === 'RELIEF_REDUCTION') return 'Miễn giảm thuế (NQ 43)';
  if (val === 'PENALTY') return 'Xử phạt vi phạm';
  return val || 'Tư vấn chung';
}

function formatIncomeLabel(val?: string) {
  if (val === 'MARKETPLACE_SALES') return 'Bán hàng TMĐT (TikTok, Shopee)';
  if (val === 'GOODS_SALES') return 'Bán buôn, bán lẻ hàng hóa';
  if (val === 'FOOD_SERVICE') return 'Dịch vụ ăn uống / F&B';
  if (val === 'AFFILIATE_COMMISSION') return 'Tiếp thị liên kết (Affiliate)';
  if (val === 'PROPERTY_RENTAL') return 'Cho thuê tài sản';
  if (val === 'FREELANCE_SERVICE') return 'Dịch vụ tự do / Freelancer';
  return val || 'Hoạt động kinh doanh';
}

export const RetrievalTrace: React.FC<{ trace?: RetrievalTraceData; summary?: string; live?: boolean; expanded?: boolean }> = ({ trace, summary, live, expanded }) => {
  if (!trace && !summary) return null;

  return (
    <details open={expanded ? true : undefined} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-[13px] text-slate-700">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
        <BookOpen className="h-4 w-4 text-emerald-600" />
        Quá trình xử lý & Phân loại Decision Model
        <ChevronDown className="ml-auto h-4 w-4" />
      </summary>
      <div className="mt-3 space-y-2.5 border-t border-slate-200 pt-3 leading-relaxed">
        {/* Khung quyết định Decision Model (JEV-1.0-Large) */}
        {trace?.decision && (
          <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/80 p-3 text-xs text-slate-800 space-y-2 shadow-xs">
            <div className="flex items-center justify-between font-semibold text-emerald-950">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Decision Model: {trace.decision.model || 'JEV-1.0-Large (FPT Cloud AI)'}</span>
              </span>
              <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 tracking-wide uppercase">
                {trace.decision.layer || 'L2 Gated'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-600 border-t border-emerald-200/50">
              <div>
                <span className="font-medium text-slate-500">Chủ thể: </span>
                <span className="font-semibold text-slate-800">{formatTaxpayerLabel(trace.decision.taxpayer)}</span>
              </div>
              <div>
                <span className="font-medium text-slate-500">Mục đích: </span>
                <span className="font-semibold text-slate-800">{formatIntentLabel(trace.decision.intent)}</span>
              </div>
              {trace.decision.income && (
                <div>
                  <span className="font-medium text-slate-500">Nguồn thu: </span>
                  <span className="font-semibold text-slate-800">{formatIncomeLabel(trace.decision.income)}</span>
                </div>
              )}
              {typeof trace.decision.confidence === 'number' && (
                <div>
                  <span className="font-medium text-slate-500">Độ tin cậy: </span>
                  <span className="font-semibold text-emerald-700">{Math.round(trace.decision.confidence * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {trace && <p>Đã tìm bằng <strong>{trace.method}</strong> trong kho tri thức pháp luật thuế đã xác minh.</p>}
        {trace && trace.evidence.length > 0 ? (
          <>
            <p>Đưa {trace.evidence.length} đoạn quy định liên quan vào ngữ cảnh:</p>
            <ul className="list-disc space-y-1 pl-5">
              {trace.evidence.map((item, index) => (
                <li key={`${item.title}-${index}`}>
                  {item.title}{item.conditional ? ' — cần kiểm tra điều kiện áp dụng' : ''}
                </li>
              ))}
            </ul>
          </>
        ) : trace ? (
          <p>Chưa tìm thấy đoạn căn cứ đủ liên quan.</p>
        ) : null}
        {summary && <p aria-live={live ? 'polite' : 'off'}><strong>Tóm tắt suy luận từ model:</strong> {summary}</p>}
        <p className="text-[11px] text-slate-400">Nội dung trên là dấu vết phân loại của Quyết V1.0 Large và trích lục pháp lý đối chiếu, không phải suy luận nội bộ nguyên văn.</p>
      </div>
    </details>
  );
};
