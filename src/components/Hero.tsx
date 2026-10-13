import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Search, ArrowRight, CheckCircle2, Copy, BookOpen, Radio, Sparkles,
  ShoppingBag, Home, Receipt, BrainCircuit, Check, Zap, PlusCircle,
} from 'lucide-react';
import { parseTaxResponse } from '../services/museBridge';
import { CloudflareApi } from '../services/api';
import { RetrievalTrace, type RetrievalTraceData } from './RetrievalTrace';
import { useAuth } from '../context/AuthContext';

interface HeroProps {
  onOpenConsultation: () => void;
  onOpenAIChat: (query?: string) => void;
  onContinueAIChat: (message: string, response: string) => void;
}

interface TaxResult {
  query: string;
  answer: string;
  reasoning?: string;
  legalBasis: string;
  retrieval?: RetrievalTraceData;
  reasoningSummary?: string;
  fresh: boolean;
  successful?: boolean;
}

const DEFAULT_RESULT: TaxResult = {
  query: 'Tra cứu quy định thuế cho hộ và cá nhân kinh doanh',
  answer: 'Nhập câu hỏi để hệ thống tìm căn cứ liên quan và trả lời theo từng trường hợp cụ thể.',
  legalBasis: '',
  fresh: false,
};

const PLACEHOLDERS = [
  'Bán hàng Shopee doanh thu 800 triệu có phải nộp thuế không?',
  'Ngưỡng miễn thuế 1 tỷ/năm năm 2026 áp dụng như thế nào?',
  'Doanh thu vượt 1 tỷ thì sàn TMĐT khấu trừ thuế ra sao?',
  'Cho thuê căn hộ 15 triệu/tháng có thuộc diện miễn thuế dưới 1 tỷ không?',
  'Làm KOC, affiliate hoa hồng trên 1 tỷ kê khai thuế thế nào?',
];

function useTypingPlaceholder(list: string[], active: boolean) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!active) {
      setText('');
      return;
    }
    let i = 0;
    let c = 0;
    let deleting = false;
    let timer: number;
    const tick = () => {
      const full = list[i];
      if (!deleting) {
        c++;
        setText(full.slice(0, c));
        if (c === full.length) {
          deleting = true;
          timer = window.setTimeout(tick, 1600);
          return;
        }
        timer = window.setTimeout(tick, 42);
      } else {
        c--;
        setText(full.slice(0, c));
        if (c === 0) {
          deleting = false;
          i = (i + 1) % list.length;
        }
        timer = window.setTimeout(tick, 20);
      }
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [list, active]);
  return text;
}

const FLOATING = [
  { icon: ShoppingBag, label: 'Shopee · TikTok Shop', value: '1.5%', pos: 'left-[-2%] top-[8%]', rot: '-6deg', delay: '0s', color: 'from-emerald-400 to-teal-500' },
  { icon: Home, label: 'Cho thuê tài sản', value: '10%', pos: 'right-[-1%] top-[2%]', rot: '5deg', delay: '1.2s', color: 'from-cyan-400 to-sky-500' },
  { icon: Receipt, label: 'Hóa đơn điện tử', value: 'e-Invoice', pos: 'right-[3%] top-[62%]', rot: '-4deg', delay: '2.1s', color: 'from-indigo-400 to-violet-500' },
];

export const Hero: React.FC<HeroProps> = ({ onOpenConsultation, onContinueAIChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelStatus, setModelStatus] = useState<'searching' | 'generating' | 'thinking'>('searching');
  const [copied, setCopied] = useState(false);
  const [focused, setFocused] = useState(false);
  const { user, isAuthenticated, consumeCredit, openAuthModal, openDepositModal } = useAuth();
  const [currentResult, setCurrentResult] = useState<TaxResult>(DEFAULT_RESULT);

  const placeholder = useTypingPlaceholder(PLACEHOLDERS, !searchQuery && !focused && !isSearching && !isStreaming);

  // 3D tilt cho thẻ kết quả
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [2.5, -2.5]), { stiffness: 140, damping: 18 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-2.5, 2.5]), { stiffness: 140, damping: 18 });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query || isSearching || isStreaming) return;

    // Check credits and authentication
    if (!consumeCredit()) {
      return;
    }

    setIsSearching(true);
    setIsStreaming(false);
    setModelStatus('searching');
    setCurrentResult({
      query,
      answer: '',
      legalBasis: '',
      fresh: true,
    });

    // 1. GỌI TRỰC TIẾP CLOUDFLARE RAG + WORKERS AI BACKEND VỚI STREAM REALTIME
    let requestError = 'Không thể tra cứu căn cứ lúc này. Vui lòng thử lại sau.';
    try {
      let streamedAnswer = '';
      let legalStr = '';

      const cfRes = await CloudflareApi.askTaxAIStream(
        query,
        user?.phone,
        undefined,
        undefined,
        (delta) => {
          streamedAnswer += delta;
          setIsSearching(false);
          setIsStreaming(true);

          const parsed = parseTaxResponse(streamedAnswer);
          setCurrentResult((prev) => ({
            ...prev,
            query,
            answer: parsed.answer || streamedAnswer,
            legalBasis: legalStr,
            fresh: true,
          }));
        },
        (meta) => {
          if (meta.retrieval) {
            setCurrentResult((prev) => ({ ...prev, retrieval: meta.retrieval }));
          }
          if (meta.citations && meta.citations.length > 0) {
            const cleanCitations = meta.citations
              .filter((c: string) => !/^16\.\d+/i.test(c) && !/VERIFIED|CONTROL/i.test(c))
              .map((c: string) => `• ${c}`);
            if (cleanCitations.length > 0) {
              legalStr = cleanCitations.join('\n');
              setCurrentResult((prev) => ({ ...prev, legalBasis: legalStr }));
            }
          }
        },
        (status) => setModelStatus(status),
        (delta) => setCurrentResult((prev) => ({
          ...prev,
          reasoningSummary: (prev.reasoningSummary || '') + delta,
        }))
      );

      if (cfRes.success && streamedAnswer) {
        setCurrentResult((prev) => ({ ...prev, successful: true }));
        setIsSearching(false);
        setIsStreaming(false);

        // Lưu câu hỏi vào cache lịch sử của tài khoản khách hàng
        if (user?.phone) {
          try {
            const cacheKey = `tax_chat_history_${user.phone}`;
            const existingStr = localStorage.getItem(cacheKey);
            const list = existingStr ? JSON.parse(existingStr) : [];
            const newItem = {
              id: `chat_${Date.now()}`,
              message: query,
              response: streamedAnswer,
              source: cfRes.source || 'Muse Spark 1.3 (Meta AI)',
              created_at: new Date().toISOString(),
            };
            const updated = [newItem, ...list.filter((x: any) => x.message !== query)].slice(0, 50);
            localStorage.setItem(cacheKey, JSON.stringify(updated));
          } catch {}
        }
        return;
      }
      requestError = cfRes.error || requestError;
    } catch {
      requestError = 'Không thể kết nối với dịch vụ tra cứu. Vui lòng thử lại sau.';
    }
    setCurrentResult({ query, answer: requestError, legalBasis: '', fresh: true });
    setIsSearching(false);
    setIsStreaming(false);
  };

  const handleCopy = () => {
    const fullText = `CÂU HỎI:\n${currentResult.query}\n\nNỘI DUNG TRẢ LỜI:\n${currentResult.answer}\n\nCĂN CỨ PHÁP LÝ:\n${currentResult.legalBasis}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const words = ['Tra cứu', '&', 'Tính', 'thuế'];

  return (
    <section id="ai-assistant" className="relative pt-28 pb-20 md:pt-40 md:pb-28">
      <div className="relative max-w-[1000px] mx-auto px-4 sm:px-6 w-full">

        {/* Floating tech chips */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          {FLOATING.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.2, type: 'spring', stiffness: 120 }}
              className={`absolute ${f.pos}`}
            >
              <div
                className="glass flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 shadow-floating"
                style={{ ['--r' as string]: f.rot, animation: `float-y 6s ease-in-out ${f.delay} infinite` }}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-md`}>
                  <f.icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-left leading-tight">
                  <span className="block text-[11px] font-medium text-slate-500">{f.label}</span>
                  <span className="block text-[15px] font-extrabold text-slate-900">{f.value}</span>
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Header */}
        <div className="relative text-center max-w-2xl mx-auto mb-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass inline-flex items-center gap-2 text-emerald-800 px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider mb-6 shadow-clean"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span>Trợ lý tra cứu thuế HKD</span>
          </motion.div>

          <h1 className="text-[40px] sm:text-[58px] font-extrabold tracking-tight leading-[1.05] mb-5">
            {words.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.1 + i * 0.09, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block mr-3 text-slate-900"
              >
                {w}
              </motion.span>
            ))}
            <br />
            <motion.span
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.55, duration: 0.7 }}
              className="text-shimmer inline-block pb-1"
            >
              Hộ & Cá nhân kinh doanh
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-[15px] sm:text-[17px] text-slate-600 leading-relaxed"
          >
            Hỏi bằng ngôn ngữ tự nhiên, nhận câu trả lời kèm <strong className="text-slate-900">căn cứ pháp lý</strong> chuẩn Nghị định 141/2026/NĐ-CP & Luật 48/2024/QH15 (ngưỡng miễn thuế 1 tỷ đồng/năm).
          </motion.p>
        </div>

        {/* Search with animated glow border */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="glow-wrap mb-4 max-w-[820px] mx-auto"
        >
          <div className="flex items-center gap-3 bg-white rounded-[1.1rem] pl-4 pr-2 py-2">
            <Search className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
            <input
              type="text"
              aria-label="Nhập câu hỏi tra cứu thuế"
              value={searchQuery}
              maxLength={300}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder || 'Nhập câu hỏi về thuế...'}
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-[15px] sm:text-[17px] focus:outline-none font-medium py-3"
            />
            <motion.button
              type="submit"
              disabled={isSearching}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="relative overflow-hidden inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold text-[14px] px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/30 flex-shrink-0 disabled:opacity-80"
            >
              {isSearching ? (
                <>
                  <BrainCircuit className="w-4 h-4 animate-pulse" />
                  <span>Đang phân tích</span>
                </>
              ) : (
                <>
                  <span>Tra cứu</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </motion.form>

        {/* Credit status banner */}
        <div className="mb-10 flex items-center justify-center gap-2 text-[12px] sm:text-[13px]">
          {isAuthenticated && user ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold shadow-xs">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Tài khoản: <strong>{user.phone}</strong> • Còn <strong>{user.credits} lượt hỏi</strong>
              </span>
              <button
                onClick={openDepositModal}
                className="ml-1 inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-950 font-bold underline"
              >
                <span>Nạp thêm</span>
                <PlusCircle className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 hover:bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 font-medium transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Đăng ký SĐT nhận ngay <strong className="text-emerald-700 font-bold">3 lượt hỏi miễn phí</strong>
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>

        {/* Result card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 1200 }}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            mx.set((e.clientX - r.left) / r.width - 0.5);
            my.set((e.clientY - r.top) / r.height - 0.5);
          }}
          onMouseLeave={() => {
            mx.set(0);
            my.set(0);
          }}
          className="glass rounded-3xl p-6 sm:p-8 shadow-floating space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="font-bold text-[14px] text-slate-800">Câu hỏi tra cứu</span>
            </div>
            <button
              onClick={handleCopy}
              className="text-[12px] text-slate-600 hover:text-emerald-700 bg-white/70 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép kết quả'}</span>
            </button>
          </div>

          <h3 className="text-[17px] sm:text-[20px] font-bold text-slate-900 leading-snug">{currentResult.query}</h3>

          <div className="space-y-4">
            <div className="bg-white/80 border border-slate-200/80 p-5 rounded-2xl space-y-2.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[13px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Nội dung trả lời</span>
                </div>
                {isStreaming && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>Đang truyền luồng realtime</span>
                  </span>
                )}
              </div>

              {isSearching && !currentResult.answer ? (
                <div className="py-4 flex items-center gap-2.5 text-[14px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping shrink-0" />
                  <span className="font-semibold text-emerald-800">
                    {modelStatus === 'thinking'
                      ? 'Model đang suy luận để tổng hợp câu trả lời...'
                      : modelStatus === 'generating'
                        ? 'Model đang tạo câu trả lời...'
                        : 'Đang tra cứu căn cứ pháp lý...'}
                  </span>
                </div>
              ) : (
                <div className="text-[14px] sm:text-[15.5px] text-slate-800 leading-relaxed whitespace-pre-line font-medium min-h-[50px]">
                  {currentResult.answer}
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-emerald-600 animate-pulse align-middle rounded-xs" />
                  )}
                </div>
              )}
            </div>

            {currentResult.legalBasis && !isSearching && (
              <div className="bg-gradient-to-br from-emerald-50/80 to-cyan-50/60 border border-emerald-200/70 p-5 rounded-2xl space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-[13px]">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Căn cứ pháp lý</span>
                </div>
                <div className="text-[13px] sm:text-[14px] text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                  {currentResult.legalBasis}
                </div>
              </div>
            )}
            <RetrievalTrace
              trace={currentResult.retrieval}
              summary={currentResult.reasoningSummary}
              live={isSearching}
              expanded={isSearching || isStreaming}
            />
          </div>

          <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[12px]">
            <span className="text-slate-500">Thông tin mang tính tham khảo theo quy định pháp luật hiện hành</span>
            {currentResult.successful && (
              <button
                onClick={() => onContinueAIChat(currentResult.query, currentResult.answer)}
                className="text-emerald-700 hover:text-emerald-800 font-bold"
              >
                Hỏi tiếp về câu này →
              </button>
            )}
            <button
              onClick={onOpenConsultation}
              className="group text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
            >
              <span>Cần tư vấn hồ sơ cụ thể?</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
