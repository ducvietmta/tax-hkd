import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, User, ShieldCheck, RefreshCw, Radio, Zap, PlusCircle,
  FileText, Sparkles, BookOpen, Bot, HelpCircle,
  Copy, Check, ArrowUpRight
} from 'lucide-react';
import { CloudflareApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RetrievalTrace, type RetrievalTraceData } from './RetrievalTrace';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  reasoning?: string;
  retrieval?: RetrievalTraceData;
  reasoningSummary?: string;
  source?: string;
  citations?: string[];
  timestamp: string;
  fileAttachment?: {
    name: string;
    url?: string;
  };
}

const QUICK_PROMPTS = [
  'Bán Shopee dưới 1 tỷ/năm 2026 có nộp thuế không?',
  'Affiliate hoa hồng Shopee có cần đăng ký mã ngành 888?',
  'Cho thuê nhà 15 triệu/tháng tính thuế ra sao?',
  'Kê khai hóa đơn điện tử máy tính tiền thế nào?',
];

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, initialQuery }) => {
  const { user, isAuthenticated, consumeCredit, openDepositModal, openAuthModal, guestCredits } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý AI Pháp lý Thuế Hộ kinh doanh & Cá nhân kinh doanh, sẵn sàng giải đáp mọi thắc mắc về thuế sàn TMĐT, cho thuê tài sản, hóa đơn điện tử theo quy định mới nhất 2026.',
      source: 'Hệ thống tra cứu thuế',
      timestamp: 'Vừa xong',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const [modelStatus, setModelStatus] = useState<'searching' | 'generating' | 'thinking'>('searching');
  const [pendingTrace, setPendingTrace] = useState<RetrievalTraceData>();
  const [pendingReasoningSummary, setPendingReasoningSummary] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleUserSend(initialQuery);
    }
  }, [initialQuery, isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaitingForAnswer]);

  if (!isOpen) return null;

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUserSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    // Check credits and authentication
    if (!consumeCredit()) {
      return;
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);
    setIsWaitingForAnswer(true);
    setModelStatus('searching');
    setPendingTrace(undefined);
    setPendingReasoningSummary('');

    // Chỉ hiển thị câu trả lời từ backend RAG; không tự dựng kết luận thuế khi lỗi.
    const aiMsgId = `ai-${Date.now()}`;
    let hasCreatedAiMsg = false;
    let retrievalCitations: string[] = [];
    let retrievalTrace: RetrievalTraceData | undefined;
    let reasoningSummary = '';
    let requestError = 'Không thể tra cứu căn cứ lúc này. Vui lòng thử lại sau.';
    try {
      const history = messages
        .filter((m) => m.text && (m.sender === 'user' || m.sender === 'ai'))
        .slice(-4)
        .map((m) => ({ role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.text }));

      const cfRes = await CloudflareApi.askTaxAIStream(
        text,
        user?.phone,
        undefined,
        history,
        (delta) => {
          setIsWaitingForAnswer(false);
          if (!hasCreatedAiMsg) {
            hasCreatedAiMsg = true;
            const newAiMsg: Message = {
              id: aiMsgId,
              sender: 'ai',
              text: delta,
              source: 'Quy chuẩn Pháp luật Thuế 2026',
              citations: retrievalCitations,
              retrieval: retrievalTrace,
              reasoningSummary,
              timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, newAiMsg]);
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? { ...m, text: m.text + delta } : m))
            );
          }
        },
        (meta) => {
          retrievalCitations = meta.citations || [];
          retrievalTrace = meta.retrieval;
          setPendingTrace(meta.retrieval);
          if (meta.source || meta.citations || meta.retrieval) {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? {
                ...m,
                source: meta.source || m.source,
                citations: retrievalCitations,
                retrieval: retrievalTrace,
              } : m))
            );
          }
        },
        (status) => setModelStatus(status),
        (delta) => {
          reasoningSummary += delta;
          setPendingReasoningSummary(reasoningSummary);
          if (hasCreatedAiMsg) {
            setMessages((prev) => prev.map((m) => m.id === aiMsgId
              ? { ...m, reasoningSummary }
              : m));
          }
        }
      );

      if (cfRes.success && hasCreatedAiMsg) {
        setIsTyping(false);
        setIsWaitingForAnswer(false);
        if (user?.phone) {
          try {
            const cacheKey = `tax_chat_history_${user.phone}`;
            const existingStr = localStorage.getItem(cacheKey);
            const list = existingStr ? JSON.parse(existingStr) : [];
            const newItem = {
              id: `chat_${Date.now()}`,
              message: text,
              response: cfRes.response,
              source: cfRes.source || 'Quy chuẩn Pháp luật Thuế 2026',
              created_at: new Date().toISOString(),
            };
            const updated = [newItem, ...list.filter((x: any) => x.message !== text)].slice(0, 50);
            localStorage.setItem(cacheKey, JSON.stringify(updated));
          } catch {}
        }
        return;
      }
      requestError = cfRes.error || requestError;
    } catch {
      requestError = 'Không thể kết nối với dịch vụ tra cứu. Vui lòng thử lại sau.';
    }
    if (hasCreatedAiMsg) {
      setMessages((prev) => prev.map((m) => m.id === aiMsgId
        ? { ...m, text: `${m.text}\n\n[Câu trả lời bị gián đoạn: ${requestError}]` }
        : m));
    } else {
      setMessages((prev) => [...prev, {
        id: aiMsgId,
        sender: 'ai',
        text: requestError,
        source: 'Thông báo hệ thống',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
    setIsTyping(false);
    setIsWaitingForAnswer(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUserSend(inputVal);
  };

  const renderMessageContent = (text: string, citations: string[] = []) => {
    const mainContent = text.replace(/(?:^|\n)\s*(?:Căn cứ|Căn cứ pháp lý|Văn bản áp dụng):[\s\S]*$/i, '').trim();
    return (
      <div>
        <p className="whitespace-pre-line leading-relaxed">{mainContent}</p>
        {citations.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[12px] text-emerald-950">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Căn cứ tìm thấy trong kho tri thức</span>
            </div>
            <p className="whitespace-pre-line text-emerald-900 leading-snug">{citations.join('; ')}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl h-[680px] max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header cao cấp */}
          <div className="relative px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white border-b border-emerald-500/20 flex items-center justify-between shrink-0 shadow-sm">
            {/* Ambient glow phía sau header */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3.5 relative z-10">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[2px] shadow-lg shadow-emerald-500/20">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[16px] text-white tracking-tight">Trợ lý AI Pháp lý Thuế</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                    <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                    Chuyên sâu 2026
                  </span>
                </div>
                <div className="text-[12px] text-slate-300 flex items-center gap-1.5">
                  <span>Tư vấn HKD & Cá nhân kinh doanh</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-emerald-400/90 font-medium">Nghị định 141/2026/NĐ-CP</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              {isAuthenticated && user ? (
                <button
                  onClick={openDepositModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 rounded-xl text-[12px] font-bold transition-all shadow-xs backdrop-blur-xs"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{user.credits} lượt hỏi</span>
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
                </button>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 rounded-xl text-[12px] font-bold transition-all shadow-xs backdrop-blur-xs"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hỏi thử: {guestCredits} lượt</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick prompt suggestions strip */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 overflow-x-auto no-scrollbar flex items-center gap-2 text-[12px] shrink-0">
            <span className="text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1 text-[11px] uppercase tracking-wider pl-1">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" /> Gợi ý:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleUserSend(prompt)}
                disabled={isTyping}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 font-medium transition-all shadow-2xs text-[12px] flex items-center gap-1 disabled:opacity-50"
              >
                <span>{prompt}</span>
                <ArrowUpRight className="w-3 h-3 opacity-60" />
              </button>
            ))}
          </div>

          {/* Messages Container với nền grid mềm */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-emerald-600/20">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 sm:p-5 text-[14px] leading-relaxed transition-all ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs shadow-md shadow-emerald-700/15 font-medium'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-card'
                  }`}
                >
                  {/* Copy button ẩn hiện khi hover */}
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.text)}
                    className={`absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-xs ${
                      msg.sender === 'user'
                        ? 'text-white/80 hover:bg-white/20'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                    title="Sao chép nội dung"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Body message */}
                  <div className="pr-6">
                    {msg.sender === 'ai' ? renderMessageContent(msg.text, msg.citations) : <p className="whitespace-pre-line">{msg.text}</p>}
                  </div>
                  {msg.sender === 'ai' && <div className="mt-3"><RetrievalTrace trace={msg.retrieval} summary={msg.reasoningSummary} /></div>}

                  {/* Attachment if present */}
                  {msg.fileAttachment && (
                    <div className="mt-3 p-2.5 bg-emerald-950/20 backdrop-blur-xs rounded-xl border border-emerald-400/30 flex items-center gap-2 text-[12px]">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate flex-1 font-mono">{msg.fileAttachment.name}</span>
                      <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded font-bold text-emerald-200">R2 Storage</span>
                    </div>
                  )}

                  {/* Nguồn căn cứ / Footer thẻ AI */}
                  {msg.sender === 'ai' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold truncate">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{msg.source || 'Căn cứ pháp luật Việt Nam'}</span>
                      </div>
                      <span className="text-slate-400 font-medium shrink-0 ml-2">{msg.timestamp}</span>
                    </div>
                  )}

                  {msg.sender === 'user' && (
                    <div className="mt-1 text-right text-[10px] text-emerald-100/90 font-medium">
                      {msg.timestamp}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}

            {isWaitingForAnswer && (
              <div className="space-y-2" role="status" aria-live="polite">
                <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-[13px] bg-white border border-slate-200 px-4 py-3 rounded-3xl rounded-tl-xs shadow-card">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span className="font-medium">
                    {modelStatus === 'thinking'
                      ? 'Model đang suy luận để tổng hợp câu trả lời...'
                      : modelStatus === 'generating'
                        ? 'Model đang tạo câu trả lời...'
                        : 'Đang tra cứu căn cứ pháp lý...'}
                  </span>
                </div>
                </div>
                <RetrievalTrace trace={pendingTrace} summary={pendingReasoningSummary} live expanded />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar hiện đại, bo viền mượt */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-50/90 focus-within:bg-white border border-slate-300 focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/15 rounded-2xl p-1.5 transition-all">
              <input
                type="text"
                aria-label="Nhập câu hỏi cho trợ lý AI"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Hỏi về thuế Shopee, TikTok, cho thuê nhà, ngưỡng 1 tỷ..."
                className="flex-1 bg-transparent px-2 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none"
              />

              <button
                type="submit"
                aria-label="Gửi câu hỏi"
                disabled={!inputVal.trim() || isTyping}
                className="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 focus:outline-none text-[13px]"
              >
                <span>Gửi</span>
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </form>
            <div className="mt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Tra cứu từ kho tri thức; kiểm tra lại văn bản gốc trước khi áp dụng.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

