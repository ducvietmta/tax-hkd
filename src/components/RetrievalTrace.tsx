import React from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';

export interface RetrievalTraceData {
  method: string;
  evidence: { title: string; conditional: boolean }[];
}

export const RetrievalTrace: React.FC<{ trace?: RetrievalTraceData; summary?: string; live?: boolean; expanded?: boolean }> = ({ trace, summary, live, expanded }) => {
  if (!trace && !summary) return null;

  return (
    <details open={expanded ? true : undefined} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-[13px] text-slate-700">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
        <BookOpen className="h-4 w-4 text-emerald-600" />
        Quá trình xử lý câu hỏi
        <ChevronDown className="ml-auto h-4 w-4" />
      </summary>
      <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 leading-relaxed">
        {trace && <p>Đã tìm bằng {trace.method} trong kho tri thức đã xác minh.</p>}
        {trace && trace.evidence.length > 0 ? (
          <>
            <p>Đưa {trace.evidence.length} đoạn liên quan vào ngữ cảnh trả lời:</p>
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
        <p className="text-slate-500">Nội dung trên là dấu vết tra cứu và tóm tắt do model cung cấp, không phải suy luận nội bộ nguyên văn.</p>
      </div>
    </details>
  );
};
