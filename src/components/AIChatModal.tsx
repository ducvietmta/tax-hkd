import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, User, ShieldCheck, RefreshCw, Radio, Zap, PlusCircle,
  FileText, Sparkles, BookOpen, Bot, HelpCircle,
  Copy, Check, ArrowUpRight
} from 'lucide-react';
import { CloudflareApi, type ChatHistoryItem } from '../services/api';
import { selectConversationHistory } from '../services/conversation';
import { parseTaxResponse } from '../services/museBridge';
import { AnswerProgress, appendProgress } from './AnswerProgress';
import type { ChatProgress } from '../../shared/chatProgress';
import { useAuth } from '../context/AuthContext';
import { RetrievalTrace, type RetrievalTraceData } from './RetrievalTrace';
import { REGISTRATION_PROMPTS, REGISTRATION_WELCOME } from '../features/registration/data/taxRegistration';
import type { RegistrationPanelContext } from '../../shared/registrationAdvisor';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  resumeTurn?: ChatHistoryItem | null;
  embeddedDocument?: { id: string; code: string; title: string };
  registrationGuide?: boolean;
  getRegistrationContext?: () => RegistrationPanelContext;
  registrationPanelTitle?: string;
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
  contextual?: boolean;
}

const WELCOME_MESSAGE: Message = {
  id: 'm1',
  sender: 'ai',
  text: 'Chào bạn! Mình có thể giúp bạn tìm hiểu về thuế hộ kinh doanh, bán hàng trên sàn và hóa đơn. Bạn cứ hỏi theo trường hợp của mình nhé.',
  source: 'Hệ thống tra cứu thuế',
  timestamp: 'Vừa xong',
};

function keepConversation(messages: Message[]): Message[] {
  const turns = messages.filter((message) => message.id !== 'm1');
  return turns.length <= 40 ? turns : [...turns.slice(0, 2), ...turns.slice(-38)];
}

const QUICK_PROMPTS = [
  'Bán Shopee dưới 1 tỷ/năm 2026 có nộp thuế không?',
  'Affiliate hoa hồng Shopee có cần đăng ký mã ngành 888?',
  'Cho thuê nhà 15 triệu/tháng tính thuế ra sao?',
  'Kê khai hóa đơn điện tử máy tính tiền thế nào?',
];

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, initialQuery, resumeTurn, embeddedDocument, registrationGuide = false, getRegistrationContext, registrationPanelTitle }) => {
  const inline = !!embeddedDocument || registrationGuide;
  const { user, isAuthenticated, consumeCredit, openDepositModal, openAuthModal, syncCredits } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const [modelStatus, setModelStatus] = useState<'searching' | 'generating' | 'thinking'>('searching');
  const [pendingTrace, setPendingTrace] = useState<RetrievalTraceData>();
  const [pendingReasoningSummary, setPendingReasoningSummary] = useState('');
  const [progressSteps, setProgressSteps] = useState<ChatProgress[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const registrationRequestRef = useRef<AbortController | null>(null);
  const handledInitialRef = useRef<string | null>(null);
  const pendingAuthQuestionRef = useRef<string | null>(null);
  const storageKey = registrationGuide ? `tax_registration_chat_v1_${user?.uid || user?.phone || 'anonymous'}` : embeddedDocument
    ? `tax_document_chat_${user?.phone || 'anonymous'}_${embeddedDocument.id}`
    : `tax_active_chat_${user?.phone || 'anonymous'}`;
  const welcomeMessage = registrationGuide
    ? { ...WELCOME_MESSAGE, text: REGISTRATION_WELCOME, source: 'Hướng dẫn đăng ký thuế trực tiếp' }
    : embeddedDocument
    ? { ...WELCOME_MESSAGE, text: `Đang trao đổi về ${embeddedDocument.code}. Bạn có thể hỏi chi tiết và đối chiếu câu trả lời với PDF bên cạnh.` }
    : WELCOME_MESSAGE;

  useEffect(()=>()=>{if(registrationGuide) registrationRequestRef.current?.abort();},[registrationGuide]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      const turns = Array.isArray(parsed) ? parsed.filter((item): item is Message =>
        item && (item.sender === 'user' || item.sender === 'ai') &&
        typeof item.id === 'string' && typeof item.text === 'string' && item.id !== 'm1'
      ) : [];
      const restored = keepConversation(turns);
      setMessages([welcomeMessage, ...restored]);
    } catch {
      setMessages([welcomeMessage]);
    }
    setLoadedStorageKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(keepConversation(messages)));
    } catch {}
  }, [messages, loadedStorageKey, storageKey]);

  useEffect(() => {
    if (!isOpen) {
      handledInitialRef.current = null;
      return;
    }
    if (loadedStorageKey !== storageKey) return;
    const initialId = resumeTurn ? `resume:${resumeTurn.id}` : initialQuery?.trim() ? `query:${initialQuery}` : null;
    if (!initialId || handledInitialRef.current === initialId) return;
    if (embeddedDocument && messages.some((message) => message.contextual)) {
      handledInitialRef.current = initialId;
      return;
    }
    if (inline && initialQuery && !isAuthenticated) {
      setInputVal(initialQuery);
      return;
    }
    handledInitialRef.current = initialId;
    if (resumeTurn) {
      setMessages([welcomeMessage, {
        id: `history-user-${resumeTurn.id}`,
        sender: 'user',
        text: resumeTurn.message,
        timestamp: 'Lịch sử',
        contextual: true,
      }, {
        id: `history-ai-${resumeTurn.id}`,
        sender: 'ai',
        text: resumeTurn.response,
        source: resumeTurn.source,
        timestamp: 'Lịch sử',
        contextual: true,
      }]);
    } else if (initialQuery && initialQuery.trim()) {
      const question = pendingAuthQuestionRef.current || initialQuery;
      pendingAuthQuestionRef.current = null;
      handleUserSend(question);
    }
  }, [initialQuery, isOpen, resumeTurn, loadedStorageKey, isAuthenticated, embeddedDocument, messages]);

  useEffect(() => {
    if (inline && messageListRef.current) {
      messageListRef.current.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
    } else chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaitingForAnswer]);

  if (!isOpen) return null;

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUserSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    if (!user || !isAuthenticated) {
      if (inline) { pendingAuthQuestionRef.current = text; setInputVal(text); }
      openAuthModal();
      return;
    }

    if (user.credits <= 0) {
      openDepositModal();
      return;
    }

    // Check credits and authentication
    if (!consumeCredit()) {
      return;
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      contextual: true,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);
    setIsWaitingForAnswer(true);
    setModelStatus('searching');
    setPendingTrace(undefined);
    setPendingReasoningSummary('');
    setProgressSteps([{ stage: 'connecting' }]);

    // Chỉ hiển thị câu trả lời từ backend RAG; không tự dựng kết luận thuế khi lỗi.
    const aiMsgId = `ai-${Date.now()}`;
    let hasCreatedAiMsg = false;
    let retrievalCitations: string[] = [];
    let retrievalTrace: RetrievalTraceData | undefined;
    let reasoningSummary = '';
    let requestError = 'Không thể tra cứu căn cứ lúc này. Vui lòng thử lại sau.';
    try {
      const conversation = selectConversationHistory(messages);
      const history = conversation;
      const requestAbort = registrationGuide ? new AbortController() : undefined;
      if (requestAbort) registrationRequestRef.current = requestAbort;

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
              source: registrationGuide ? 'Trợ lý đăng ký riêng · Muse Spark 1.3' : 'Quy chuẩn Pháp luật Thuế 2026',
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
          if (typeof meta.remainingCredits === 'number') {
            syncCredits(meta.remainingCredits);
          }
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
        },
        (progress) => setProgressSteps(prev => appendProgress(prev, progress)),
        registrationGuide ? 'tax_registration' : undefined,
        registrationGuide ? getRegistrationContext?.() : undefined,
        requestAbort?.signal,
      );

      if (typeof cfRes.remainingCredits === 'number') {
        syncCredits(cfRes.remainingCredits);
      }

      if (cfRes.success && cfRes.response.trim()) {
        registrationRequestRef.current = null;
        // The finalized answer is authoritative, even if no delta arrived or
        // it corrects/replaces the text shown while the request was pending.
        setMessages((prev) => hasCreatedAiMsg
          ? prev.map((m) => m.id === aiMsgId ? { ...m, text: cfRes.response,
              source: cfRes.source || m.source, contextual: true } : m)
          : [...prev, { id: aiMsgId, sender: 'ai', text: cfRes.response,
              source: cfRes.source, citations: retrievalCitations, retrieval: retrievalTrace,
              reasoningSummary, contextual: true,
              timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }]);
        setIsTyping(false);
        setIsWaitingForAnswer(false);
        if (!registrationGuide && (user?.phone || user?.uid)) {
          try {
            const cacheKey = `tax_chat_history_${user.phone || user.uid}`;
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
      if (!cfRes.success) {
        if (cfRes.requireLogin) {
          openAuthModal();
        } else if (cfRes.requireDeposit) {
          openDepositModal();
        }
      }
      requestError = cfRes.error || requestError;
      if (registrationGuide && typeof cfRes.remainingCredits !== 'number') syncCredits(user.credits);
    } catch {
      requestError = 'Không thể kết nối với dịch vụ tra cứu. Vui lòng thử lại sau.';
    }
    if (hasCreatedAiMsg) {
      setMessages((prev) => prev.map((m) => m.id === aiMsgId
        ? { ...m, text: `${m.text}\n\n[Câu trả lời bị gián đoạn: ${requestError}]`, contextual: false }
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
    registrationRequestRef.current = null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUserSend(inputVal);
  };

  const renderMessageContent = (text: string, citations: string[] = []) => {
    const parsed = parseTaxResponse(text);
    const legalBasis = parsed.legalBasis || citations.join('; ');
    return (
      <div>
        <p className="whitespace-pre-line leading-relaxed">{parsed.answer}</p>
        {legalBasis && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[12px] text-emerald-950">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Căn cứ tìm thấy trong kho tri thức</span>
            </div>
            <p className="whitespace-pre-line text-emerald-900 leading-snug">{legalBasis}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className={inline ? 'h-full min-h-0 w-full flex' : 'fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-5 bg-slate-900/60 backdrop-blur-md'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={inline
            ? 'relative w-full h-full min-h-0 bg-white flex flex-col overflow-hidden'
            : 'mobile-chat-dialog relative w-full sm:max-w-3xl h-[100dvh] sm:h-[680px] sm:max-h-[92vh] bg-white rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-200/90 flex flex-col overflow-hidden'}
          role={inline ? undefined : 'dialog'}
          aria-modal={inline ? undefined : true}
          aria-label={inline ? undefined : 'Trợ lý AI Pháp lý Thuế'}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header cao cấp */}
          <div className={`relative bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white border-b border-emerald-500/20 flex items-center justify-between shrink-0 shadow-sm ${embeddedDocument ? 'px-3 py-3 gap-2' : 'px-3.5 sm:px-6 py-2.5 sm:py-4'}`}>
            {/* Ambient glow phía sau header */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2.5 sm:gap-3.5 relative z-10 min-w-0 flex-1">
              <div className={`relative ${embeddedDocument ? 'hidden' : ''}`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[2px] shadow-lg shadow-emerald-500/20">
                  <div className="w-full h-full bg-slate-900 rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse" />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={`font-extrabold text-white tracking-tight truncate ${inline ? 'text-xs sm:text-sm' : 'text-[14px] sm:text-[16px]'}`}>{registrationGuide ? 'Cùng chuẩn bị hồ sơ của bạn' : 'Trợ lý AI Pháp lý Thuế'}</span>
                  <span className={`${inline ? 'hidden' : 'hidden sm:inline-flex'} items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300`}>
                    <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                    JEV-1.0-Large Decision AI
                  </span>
                </div>
                <div className="text-[11px] sm:text-[12px] text-slate-300 flex items-center gap-1.5 min-w-0">
                  {registrationGuide ? <span>Đăng ký thuế trực tiếp · Cá nhân kinh doanh</span> : embeddedDocument ? (
                    <span className="text-emerald-300 font-medium truncate" title={embeddedDocument.title}>{embeddedDocument.code}</span>
                  ) : (
                    <><span>Tư vấn HKD & Cá nhân KD</span><span className="hidden sm:inline text-slate-500">·</span><span className="hidden sm:inline text-emerald-400/90 font-medium">Nghị định 141/2026/NĐ-CP</span></>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 relative z-10">
              {isAuthenticated && user ? (
                <button
                  onClick={openDepositModal}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 rounded-xl text-[11px] sm:text-[12px] font-bold transition-all shadow-xs backdrop-blur-xs"
                >
                  <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                  <span>{embeddedDocument ? user.credits : `${user.credits} lượt`}</span>
                  {!embeddedDocument && <PlusCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 ml-0.5" />}
                </button>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 rounded-xl text-[11px] sm:text-[12px] font-bold transition-all shadow-xs backdrop-blur-xs"
                >
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                  <span className={embeddedDocument ? 'sr-only' : 'text-[11px] sm:text-xs'}>Đăng nhập</span>
                </button>
              )}

              {!registrationGuide && <button
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label={embeddedDocument ? 'Quay lại PDF' : 'Đóng cửa sổ'}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>}
            </div>
          </div>

          {/* Quick prompt suggestions strip */}
          {registrationGuide && <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-xs leading-5 text-emerald-900">
            <span className="font-semibold">Đang xem: {registrationPanelTitle || 'Hướng dẫn đăng ký'}</span>
            <div className="mt-1 flex flex-wrap gap-2">
              <button type="button" disabled={isTyping} onClick={()=>setInputVal('Hướng dẫn tôi làm mục đang xem, từng bước một.')} className="min-h-8 rounded-lg border border-emerald-200 bg-white px-2 font-medium disabled:opacity-50">Hướng dẫn mục này</button>
              <button type="button" disabled={isTyping} onClick={()=>setInputVal('Tôi đã làm xong bước vừa hướng dẫn. Tôi cần làm gì tiếp theo?')} className="min-h-8 rounded-lg border border-emerald-200 bg-white px-2 font-medium disabled:opacity-50">Tôi đã xong, bước tiếp?</button>
            </div>
          </div>}
          <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border-b border-slate-200/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 sm:gap-2 text-[11.5px] sm:text-[12px] shrink-0">
            {messages.some((message) => message.contextual) && (
              <button
                type="button"
                onClick={() => { setMessages([welcomeMessage]); setInputVal(''); }}
                disabled={isTyping}
                className="whitespace-nowrap px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold disabled:opacity-50"
              >
                Mới
              </button>
            )}
            <span className="text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1 text-[10.5px] sm:text-[11px] uppercase tracking-wider pl-1">
              {embeddedDocument ? <><BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" /> Hỏi {embeddedDocument.code}</> : <><HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" /> {registrationGuide ? 'Ví dụ:' : 'Gợi ý:'}</>}
            </span>
            {!embeddedDocument && (registrationGuide ? REGISTRATION_PROMPTS : QUICK_PROMPTS).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (registrationGuide) { setInputVal(prompt); return; }
                  if (!user || !isAuthenticated) {
                    openAuthModal();
                    return;
                  }
                  handleUserSend(prompt);
                }}
                disabled={isTyping}
                className="whitespace-nowrap px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 font-medium transition-all shadow-2xs text-[11px] sm:text-[12px] flex items-center gap-1 disabled:opacity-50"
              >
                <span>{registrationGuide ? ['Tôi làm affiliate', 'Tôi sửa máy tính', 'Đã có MST tiền lương'][idx] : prompt}</span>
                <ArrowUpRight className="w-3 h-3 opacity-60" />
              </button>
            ))}
          </div>

          {/* Messages Container với nền grid mềm */}
          <div ref={messageListRef} className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 space-y-3.5 sm:space-y-5 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40" aria-label={registrationGuide ? 'Hội thoại hướng dẫn đăng ký thuế' : undefined}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 sm:gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-emerald-600/20">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[88%] sm:max-w-[78%] rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-[13px] sm:text-[14px] leading-relaxed transition-all ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs shadow-md shadow-emerald-700/15 font-medium'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-card'
                  }`}
                >
                  {/* Copy button ẩn hiện khi hover */}
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.text)}
                    className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-xs ${
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
                  <div className="pr-5 sm:pr-6">
                    {msg.sender === 'ai' ? renderMessageContent(msg.text, msg.citations) : <p className="whitespace-pre-line">{msg.text}</p>}
                  </div>
                  {msg.sender === 'ai' && !registrationGuide && <div className="mt-2.5 sm:mt-3"><RetrievalTrace trace={msg.retrieval} summary={msg.reasoningSummary} /></div>}

                  {/* Attachment if present */}
                  {msg.fileAttachment && (
                    <div className="mt-2.5 sm:mt-3 p-2 sm:p-2.5 bg-emerald-950/20 backdrop-blur-xs rounded-xl border border-emerald-400/30 flex items-center gap-2 text-[11.5px] sm:text-[12px]">
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate flex-1 font-mono">{msg.fileAttachment.name}</span>
                      <span className="text-[9.5px] sm:text-[10px] bg-emerald-900/60 px-1.5 sm:px-2 py-0.5 rounded font-bold text-emerald-200">R2</span>
                    </div>
                  )}

                  {/* Nguồn căn cứ / Footer thẻ AI */}
                  {msg.sender === 'ai' && (
                    <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] sm:text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-emerald-700 font-semibold truncate">
                        <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{msg.source || 'Căn cứ pháp luật Việt Nam'}</span>
                        {(msg.source?.includes('JEV') || msg.source?.includes('Quyet')) && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9.5px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-300 shrink-0 ml-1">
                            JEV-1.0
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-medium shrink-0 ml-1.5 sm:ml-2">{msg.timestamp}</span>
                    </div>
                  )}

                  {msg.sender === 'user' && (
                    <div className="mt-1 text-right text-[9.5px] sm:text-[10px] text-emerald-100/90 font-medium">
                      {msg.timestamp}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                )}
              </div>
            ))}

            {isWaitingForAnswer && (
              <div className="space-y-2" role="status" aria-live="polite">
                {registrationGuide ? <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><RefreshCw size={15} className="animate-spin"/>Đang hướng dẫn bạn làm bước này…</div> : progressSteps.length > 0 ? <AnswerProgress steps={progressSteps} /> : <>
                <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-[12px] sm:text-[13px] bg-white border border-slate-200 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl sm:rounded-3xl rounded-tl-xs shadow-card">
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-emerald-600" />
                  <span className="font-medium">
                    {modelStatus === 'thinking'
                      ? 'Model đang suy luận để tổng hợp...'
                      : modelStatus === 'generating'
                        ? 'Model đang tạo câu trả lời...'
                        : 'Đang phân loại nghĩa vụ & tra cứu luật...'}
                  </span>
                </div>
                </div>
                <RetrievalTrace trace={pendingTrace} summary={pendingReasoningSummary} live expanded />
                </>}
              </div>
            )}
            {!registrationGuide && !isTyping && progressSteps.length > 0 && messages[messages.length - 1]?.contextual && (
              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer py-2">Xem các bước xử lý câu vừa hỏi</summary>
                <AnswerProgress steps={progressSteps} complete />
              </details>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar hiện đại, bo viền mượt */}
          <div className="p-2 sm:p-4 bg-white border-t border-slate-200/90 shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 hover:bg-slate-50/90 focus-within:bg-white border border-slate-300 focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/15 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 transition-all">
              <input
                type="text"
                aria-label="Nhập câu hỏi cho trợ lý AI"
                value={inputVal}
                maxLength={registrationGuide ? 1200 : 2000}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={registrationGuide ? 'Mô tả công việc bạn muốn làm…' : embeddedDocument ? `Hỏi về ${embeddedDocument.code}...` : user ? "Hỏi về thuế Shopee, TikTok, cho thuê nhà, ngưỡng 1 tỷ..." : "Đăng nhập SĐT để tra cứu và hỏi đáp thuế..."}
                className="min-w-0 flex-1 bg-transparent px-2 py-3 sm:py-2 text-base sm:text-[14px] text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none"
              />

              <button
                type="submit"
                aria-label="Gửi câu hỏi"
                disabled={!inputVal.trim() || isTyping}
                className="h-11 sm:h-10 px-3 sm:px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 text-white font-semibold rounded-lg sm:rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1 sm:gap-1.5 focus:outline-none text-[12px] sm:text-[13px]"
              >
                <span>Gửi</span>
                <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
              </button>
            </form>
            <div className="mt-1 sm:mt-2 text-center text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Tra cứu từ kho tri thức; kiểm tra lại văn bản gốc trước khi áp dụng.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

