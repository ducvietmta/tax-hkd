import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, History, MessageSquare, Clock, Trash2, Copy, Check, ExternalLink,
  ChevronRight, Sparkles, BookOpen, User, RefreshCw
} from 'lucide-react';
import { CloudflareApi, ChatHistoryItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery?: (turn: ChatHistoryItem) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onSelectQuery }) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ChatHistoryItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState<boolean>(false);

  // Tải lịch sử khi mở modal hoặc đổi user từ Cloudflare D1
  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userKey = user.phone || user.uid || 'guest';
      const cacheKey = `tax_chat_history_${userKey}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setHistory(JSON.parse(cached));
        } catch {}
      }

      // Tải từ Cloudflare D1
      if (user.phone) {
        const res = await CloudflareApi.getChatHistory(user.phone);
        if (res.success && res.history) {
          setHistory(res.history);
          localStorage.setItem(cacheKey, JSON.stringify(res.history));
        }
      }
    } catch {
      // Giữ cache cũ
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated && user) {
        fetchHistory();
      } else {
        setHistory([]);
      }
      setSelectedItem(null);
    }
  }, [isOpen, isAuthenticated, user]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.phone) return;
    setDeletingId(id);
    try {
      await CloudflareApi.deleteChatHistory(user.phone, id);
      setHistory((prev) => {
        const next = prev.filter((item) => item.id !== id);
        localStorage.setItem(`tax_chat_history_${user.phone}`, JSON.stringify(next));
        return next;
      });
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!user?.phone || history.length === 0) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử câu hỏi không?')) return;
    setIsDeletingAll(true);
    try {
      await CloudflareApi.deleteChatHistory(user.phone);
      setHistory([]);
      setSelectedItem(null);
      localStorage.removeItem(`tax_chat_history_${user.phone}`);
    } catch {
      // ignore
    } finally {
      setIsDeletingAll(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
                  <span>Lịch sử câu hỏi & tư vấn</span>
                  {history.length > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {history.length} câu hỏi
                    </span>
                  )}
                </h3>
                <p className="text-[12px] text-slate-500">
                  {isAuthenticated && user
                    ? `Lưu tự động trong tài khoản ${user.phone}`
                    : 'Đăng nhập để xem lịch sử câu hỏi'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && history.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll}
                  className="text-[12px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa tất cả</span>
                </button>
              )}

              {isAuthenticated && (
                <button
                  onClick={fetchHistory}
                  disabled={loading}
                  className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Làm mới"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {!isAuthenticated ? (
              // Chưa đăng nhập
              <div className="flex-1 p-10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
                  <User className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h4 className="text-[17px] font-bold text-slate-900">Vui lòng đăng nhập tài khoản</h4>
                  <p className="text-[13px] text-slate-600">
                    Mọi câu hỏi và nội dung tư vấn thuế AI sẽ được tự động lưu lại vào tài khoản số điện thoại của bạn để tra cứu bất cứ lúc nào.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    openAuthModal();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] px-6 py-2.5 rounded-xl shadow-md transition-all"
                >
                  Đăng nhập / Đăng ký ngay
                </button>
              </div>
            ) : loading && history.length === 0 ? (
              // Loading state
              <div className="flex-1 p-12 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-[14px] font-semibold text-slate-600">Đang tải lịch sử câu hỏi...</span>
              </div>
            ) : history.length === 0 ? (
              // Empty state
              <div className="flex-1 p-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[15px] font-bold text-slate-800">Chưa có câu hỏi nào được lưu</h4>
                  <p className="text-[13px] text-slate-500 max-w-sm">
                    Khi bạn đặt câu hỏi ở khung tra cứu AI hoặc Chat trực tiếp, lịch sử sẽ tự động hiển thị tại đây.
                  </p>
                </div>
              </div>
            ) : (
              // Split View: Danh sách câu hỏi bên trái, Chi tiết câu trả lời bên phải
              <>
                {/* Danh sách câu hỏi */}
                <div className={`w-full md:w-5/12 border-r border-slate-200 overflow-y-auto p-4 space-y-2.5 ${selectedItem ? 'hidden md:block' : 'block'}`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Các câu hỏi gần đây ({history.length})
                  </div>
                  {history.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`group relative p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[13.5px] font-bold line-clamp-2 ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                            {item.message}
                          </p>
                          <button
                            onClick={(e) => handleDeleteOne(item.id, e)}
                            disabled={deletingId === item.id}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all shrink-0"
                            title="Xóa câu hỏi này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-emerald-600 translate-x-1' : 'text-slate-300'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chi tiết câu trả lời */}
                <div className={`flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50 flex flex-col ${selectedItem ? 'block' : 'hidden md:flex'}`}>
                  {selectedItem ? (
                    <div className="space-y-4">
                      {/* Mobile back button */}
                      <button
                        onClick={() => setSelectedItem(null)}
                        className="md:hidden flex items-center gap-1 text-[13px] font-semibold text-emerald-700 mb-2"
                      >
                        ← Quay lại danh sách
                      </button>

                      {/* Question box */}
                      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-[12px] text-slate-500">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            Câu hỏi của bạn
                          </span>
                          <span>{formatDate(selectedItem.created_at)}</span>
                        </div>
                        <h4 className="text-[15px] sm:text-[16px] font-bold text-slate-900 leading-snug">
                          {selectedItem.message}
                        </h4>
                      </div>

                      {/* AI Answer box */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <Sparkles className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[13px] font-bold text-emerald-900">
                              Câu trả lời từ AI
                            </span>
                            {selectedItem.source && (
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                {selectedItem.source}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleCopy(selectedItem.id, selectedItem.response)}
                            className="text-[12px] font-semibold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
                          >
                            {copiedId === selectedItem.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Đã sao chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Sao chép</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="text-[14px] sm:text-[15px] text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                          {selectedItem.response}
                        </div>

                        {onSelectQuery && (
                          <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                              onClick={() => {
                                onSelectQuery(selectedItem);
                                onClose();
                              }}
                              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors"
                            >
                              <span>Tư vấn tiếp từ câu này</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-300" />
                      <p className="text-[13px]">Chọn một câu hỏi ở danh sách bên trái để xem lại nội dung tư vấn chi tiết</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
