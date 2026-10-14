import React from 'react';
import { CheckSquare, Square, FolderCheck } from 'lucide-react';
import type { RegDocument } from '../types';

interface DocChecklistProps {
  documents?: RegDocument[];
  checkedDocIds: string[];
  onToggleDoc: (docId: string) => void;
}

export const DocChecklist: React.FC<DocChecklistProps> = ({
  documents,
  checkedDocIds,
  onToggleDoc,
}) => {
  if (!documents || documents.length === 0) return null;

  const totalCount = documents.length;
  const checkedCount = documents.filter((doc) => checkedDocIds.includes(doc.id)).length;
  const isAllChecked = checkedCount === totalCount;

  return (
    <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
            Hồ sơ & Giấy tờ cần chuẩn bị
          </h4>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
            isAllChecked
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {checkedCount}/{totalCount} đã sẵn sàng
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {documents.map((doc) => {
          const isChecked = checkedDocIds.includes(doc.id);
          return (
            <label
              key={doc.id}
              className={`flex items-start gap-3 py-2.5 px-2 rounded-xl cursor-pointer transition-colors select-none ${
                isChecked ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
              }`}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => onToggleDoc(doc.id)}
                className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 rounded"
              >
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" aria-hidden="true" />
                )}
              </button>
              <div className="flex-1 text-xs sm:text-sm">
                <span
                  className={`font-medium transition-colors ${
                    isChecked ? 'text-slate-500 line-through' : 'text-slate-800'
                  }`}
                >
                  {doc.label}
                </span>
                {doc.optional && (
                  <span className="ml-2 text-[11px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    Không bắt buộc
                  </span>
                )}
                {doc.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
