import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Layers,
  AlertCircle,
  Lock,
  Smartphone,
} from 'lucide-react';
import PortalMockup from './PortalMockup';
import RegistrationTroubleshooter from './components/RegistrationTroubleshooter';
import TaxOnlineGuide from './TaxOnlineGuide';
import TaxAppGuide from './TaxAppGuide';
import { openETaxMobileApp } from './etaxDeepLink';
import ETaxAppModal from './components/ETaxAppModal';
import { TAX_ONLINE_GIF } from './data/taxOnlineSteps';
import { createIndustryRequest } from './industrySuggestion';
import type { IndustrySuggestion, IndustryClarificationReason } from '../../../shared/registrationIndustry';
import {
  COMPARISON,
  SOURCES,
  WIZARD_VERSION,
  answerQuestion,
  detailErrors,
  detailFields,
  initialWizard,
  isQuickOnlineRegistration,
  portal,
  questions,
  recipient,
  selectedIndustryRows,
  validateAnswer,
} from './wizardModel';
import './registrationWizard.css';

interface Props {
  onOpenAIChat?: (query: string) => void;
  onOpenConsultation?: () => void;
  onRequestNewGuide?: () => void;
  onBeforeSelectKind?: (kind: 'household' | 'individual') => boolean;
  confirmedKindTrigger?: { kind: 'household' | 'individual'; key: number } | null;
}

export default function RegistrationWizard({
  onOpenAIChat,
  onOpenConsultation,
  onRequestNewGuide,
  onBeforeSelectKind,
  confirmedKindTrigger,
}: Props) {
  const [state, setState] = useState(initialWizard);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [tries, setTries] = useState(0);
  const [mobileTab, setMobileTab] = useState<'chat' | 'image'>('chat');
  const [showRestart, setShowRestart] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const activeRef = useRef<HTMLHeadingElement>(null);
  const industryRequest = useRef<ReturnType<typeof createIndustryRequest> | null>(null);
  if (!industryRequest.current) industryRequest.current = createIndustryRequest();
  const [suggestion, setSuggestion] = useState<IndustrySuggestion | null>(null);
  const [suggesting, setSuggesting] = useState(false), [suggestError, setSuggestError] = useState(false);
  const [clarifications, setClarifications] = useState<string[]>([]), [clarifyDraft, setClarifyDraft] = useState('');
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const clarificationReasons=useRef<IndustryClarificationReason[]>([]);
  useEffect(() => () => industryRequest.current?.cancel(), []);

  useEffect(() => {
    if (confirmedKindTrigger?.kind) {
      send(confirmedKindTrigger.kind, true);
    }
  }, [confirmedKindTrigger?.key]);

  const a = state.answers;
  const list = questions(a);
  const q = list[state.current];
  const selectedIndustries=selectedIndustryRows(a);
  const formErrors = detailErrors(a);
  const online = a.channel === 'online' || a.channel === 'app';
  const quickOnline = isQuickOnlineRegistration(a);
  const showCompanionGuide = online && state.confirmed.includes('industry') && !['kind', 'channel', 'activity', 'industry'].includes(q.id);
  const rentalUnavailable = suggestion?.status==='clarify' && suggestion.reason==='UNSUPPORTED_PROPERTY_RENTAL';
  const blocked = ['existingHelp', 'specialHelp'].includes(q.id);
  const previousQuestion = useRef(q.id);
  useEffect(() => {
    if (previousQuestion.current !== q.id && window.matchMedia('(max-width: 1023px)').matches) {
      activeRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    previousQuestion.current = q.id;
  }, [q.id]);


  function move(index: number) {
    industryRequest.current?.cancel(); setSuggesting(false);
    setState((s) => ({ ...s, current: index }));
    setDraft('');
    setError('');
    setTries(0);
    setExportError('');
    setMobileTab('chat');
    activeRef.current?.focus();
  }

  function recommend(activity: string, followups: string[] = [], reasons:IndustryClarificationReason[]=[]) {
    setSuggesting(true); setSuggestError(false); setSuggestion(null); setClarifyDraft('');
    void industryRequest.current!.run(activity, followups, result => {
      setSuggesting(false); setSuggestion(result); setSuggestError(!result);
      if (result?.status === 'suggested') {
        // Prefill only. The user must still confirm the industry step.
        setState(s => s.answers.activity === activity ? {
          ...s, answers: { ...s.answers, industry: result.code,industryCodes:JSON.stringify((result.industries||[result]).map(item=>item.code)) },
          confirmed: s.confirmed.filter(id => id !== 'industry'),
        } : s);
      }
    },reasons);
  }

  function submitClarification(){
    if(!clarifyDraft.trim()||suggestion?.status!=='clarify')return;
    const next=[...clarifications,clarifyDraft.trim()];
    const reasons=[...clarificationReasons.current,suggestion.reason];
    clarificationReasons.current=reasons;setClarifications(next);
    recommend(a.activity,next,reasons);
  }

  function confirmIndustries(codes:string[]){
    if(!codes.length)return;
    setState(s=>({...s,answers:{...s.answers,industryCodes:JSON.stringify(codes)}}));
    send(codes[0]);
  }

  function send(value: string, bypassIntercept = false) {
    if (q.id === 'kind' && value === 'household' && !bypassIntercept) {
      return;
    }
    if (q.id === 'kind' && !bypassIntercept && onBeforeSelectKind) {
      const allowed = onBeforeSelectKind(value as 'household' | 'individual');
      if (!allowed) return;
    }
    const problem = validateAnswer(q, value);
    if (problem) {
      setError(problem);
      setTries((t) => Math.min(t + 1, 2));
      return;
    }
    if (q.id === 'details' && !online && formErrors.length) {
      setError(formErrors[0]);
      setTries((t) => Math.min(t + 1, 2));
      setMobileTab('chat');
      return;
    }
    if (q.id === 'receipt' && value === 'pending') {
      setState((s) => ({
        ...s,
        answers: { ...s.answers, receipt: 'pending' },
        confirmed: s.confirmed.filter((id) => !['receipt', 'finish'].includes(id)),
      }));
      setError(a.kind === 'household' ? 'Chưa có biên nhận thì chưa đánh dấu đã nộp. Lưu bản nháp trên cổng nếu có, thử lại sau hoặc đổi sang nộp trực tiếp.' : 'Chưa có biên nhận thì chưa đánh dấu đã nộp. Lưu bản nháp trên cổng/app nếu có, thử lại sau hoặc đổi kênh Web/App.');
      return;
    }
    industryRequest.current?.cancel(); setSuggesting(false);
    setState((s) => answerQuestion(s, value));
    setDraft('');
    setError('');
    setTries(0);
    setExportError('');
    setMobileTab('chat');
    if (q.id === 'activity') {
      clarificationReasons.current=[];
      setClarifications([]); setSuggestion(null);
      setState(s => ({ ...s, answers: { ...s.answers, industry: '' }, confirmed: s.confirmed.filter(id => id !== 'industry') }));
      recommend(value.trim());
    }
  }

  function field(id: string, value: string) {
    setState((s) => ({
      ...s,
      answers: { ...s.answers, [id]: value },
      confirmed: s.confirmed.filter(
        (key) => !['details', 'declare', 'attachments', 'submit', 'receipt', 'finish'].includes(key)
      ),
    }));
    setExportError('');
  }

  const history = list.slice(0, state.current).filter((item) => state.confirmed.includes(item.id));
  const source = a.kind === 'household' ? SOURCES.household : SOURCES.tax;

  async function downloadApplication(format: 'html' | 'docx' = 'html') {
    setExportError('');
    if (formErrors.length) {
      setExportError(formErrors[0]);
      return;
    }
    if (!list.filter((item) => !['finish'].includes(item.id)).every((item) => state.confirmed.includes(item.id))) {
      setExportError('Hãy xác nhận lại các bước đã thay đổi trước khi xuất hồ sơ.');
      return;
    }
    setExporting(true);
    try {
      const { downloadRegistrationApplication } = await import('./registrationExport');
      await downloadRegistrationApplication(a, format);
    } catch {
      setExportError('Chưa tạo được hồ sơ. Dữ liệu vẫn còn trong phiên này; thử lại hoặc tải mẫu gốc bên cạnh.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="registration-wizard relative min-h-screen pt-24 sm:pt-32 pb-20 text-slate-900">
      <div className="rw-shell">
        {/* Breadcrumb Back */}
        <a
          href="#"
          className="rw-back inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Trang chủ</span>
        </a>

        {/* Heading & Trust Badge */}
        <header className="rw-heading flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold tracking-wide uppercase mb-3">
              <Sparkles size={14} className="text-emerald-500" />
              <span>HƯỚNG DẪN ĐĂNG KÝ 2026</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              <span className="sm:hidden">Hướng dẫn đăng ký</span>
              <span className="hidden sm:inline">
              Từng bước,{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                đến đúng hồ sơ.
              </span>
              </span>
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Chọn cách đăng ký. Chuẩn bị thông tin. Điền biểu mẫu chuẩn xác và làm theo hướng dẫn chi tiết từng bước.
            </p>
          </div>

          {a.kind ? (
            <div className="hidden sm:flex items-center gap-3 bg-white/80 backdrop-blur-md border border-emerald-200/80 rounded-2xl p-3.5 px-4 shadow-sm shrink-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">
                  {a.kind === 'household' ? 'Hộ kinh doanh đã mở khóa' : 'Cá nhân kinh doanh đã mở khóa'}
                </div>
                <div className="text-[11px] text-slate-500">Mua 1 lần · Dùng mãi mãi cho tài khoản này · Dữ liệu bảo mật</div>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3.5 px-4 shadow-sm shrink-0">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">Chuẩn bị hồ sơ chuẩn 2026</div>
                <div className="text-[11px] text-slate-500">Chọn thủ tục để bắt đầu · Tải .docx/.html · Dữ liệu bảo mật</div>
              </div>
            </div>
          )}
        </header>

        <a href={TAX_ONLINE_GIF} target="_blank" rel="noreferrer" className="hidden sm:flex mb-6 flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
          <div><span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Mới · Hướng dẫn 2 kênh Web &amp; App eTax Mobile</span><h2 className="text-sm font-bold mt-1">Đăng ký thuế cá nhân kinh doanh online</h2><p className="text-xs mt-1">TAX HKD hỗ trợ 2 kênh nộp online chính thức: qua Web (Dịch Vụ Công Thuế Nhà Nước) hoặc qua App (eTax Mobile trên điện thoại).</p></div>
          <span className="shrink-0 rounded-xl bg-emerald-700 px-4 py-3 text-xs font-bold text-white">▶ Xem ảnh &amp; GIF 17 bước ↗</span>
        </a>

        <RegistrationTroubleshooter />

        {/* Active Procedure Status Bar */}
        <div className="rw-status flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm mb-6">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span>
              {a.kind === 'household'
                ? 'Hộ kinh doanh'
                : a.kind === 'individual'
                ? 'Cá nhân kinh doanh'
                : 'Chọn thủ tục của bạn'}
              {a.channel && ` · ${a.channel === 'app' ? 'Nộp Online qua App eTax Mobile' : online ? 'Nộp Online qua cổng' : 'Nộp Trực tiếp tại cơ quan'}`}
            </span>
          </div>

          <button
            onClick={() => setShowRestart(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition-all border border-slate-200/60 hover:border-rose-200"
          >
            <RotateCcw size={13} />
            <span>Làm lại</span>
          </button>
        </div>

        {/* Restart Confirmation Alert */}
        {showRestart && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs sm:text-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>Bắt đầu lại sẽ tạo hồ sơ mới và áp dụng xác nhận lượt hỏi.</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  industryRequest.current?.cancel();setSuggesting(false);setSuggestion(null);setSuggestError(false);setClarifications([]);setClarifyDraft('');
                  setState(initialWizard());
                  setDraft('');
                  setError('');
                  setTries(0);
                  setExportError('');
                  setShowRestart(false);
                  onRequestNewGuide?.();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                Xóa và làm lại
              </button>
              <button
                onClick={() => setShowRestart(false)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-amber-300 text-amber-800 font-semibold text-xs transition-all"
              >
                Giữ hồ sơ hiện tại
              </button>
            </div>
          </div>
        )}

        {/* Mobile Navigation Tabs */}
        {showCompanionGuide && (
          <nav
            className="rw-tabs flex lg:hidden p-1 bg-slate-200/70 backdrop-blur-md rounded-2xl gap-1 mb-6"
            aria-label="Các vùng hướng dẫn"
          >
            {[
              ['chat', 'Hỏi đáp'],
              ['image', 'Hình ảnh'],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={mobileTab === id}
                onClick={() => setMobileTab(id as 'chat' | 'image')}
                className={`flex-1 min-h-[42px] rounded-xl text-xs font-bold transition-all ${
                  mobileTab === id
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        )}

        {/* Responsive Grid Columns */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start`}>
          {/* COLUMN 1: Hội thoại đăng ký (Chat) */}
          <section
            className={`rw-card rw-chat ${
              showCompanionGuide ? 'lg:col-span-5' : 'lg:col-span-12 max-w-4xl mx-auto w-full'
            } ${mobileTab === 'chat' || !showCompanionGuide ? 'block' : 'hidden lg:block'}`}
            aria-label="Hội thoại đăng ký"
          >
            {/* Card Header */}
            <div className="rw-chat-heading px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 via-teal-50/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
                  <Sparkles size={18} />
                </div>
                <div>
                  <strong className="text-sm sm:text-base font-bold text-slate-900 block">Trợ lý đăng ký</strong>
                  <small className="text-[11px] sm:text-xs text-slate-500 block">Hỏi từng bước · Bạn luôn có thể chỉnh sửa</small>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Bước {state.current + 1}</span>
              </div>
            </div>

            {/* Conversation Flow */}
            <div className="rw-conversation p-4 sm:p-6 space-y-5">
              {/* Intro message */}
              <div className="hidden sm:block p-4 rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-200/60 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-sm">
                Chào bạn! Mình sẽ cùng bạn chuẩn bị hồ sơ đăng ký kinh doanh và thuế. Mỗi lần chỉ cần chọn hoặc trả lời một việc đơn giản.
              </div>

              {/* History Summary Collapsible */}
              {history.length > 0 && (
                <details className="group border border-slate-200/80 rounded-2xl p-3 sm:p-4 bg-white/70 backdrop-blur-sm text-xs text-slate-600 transition-all">
                  <summary className="font-bold text-slate-800 cursor-pointer flex items-center justify-between">
                    <span>{history.length} câu đã trả lời · Xem và chỉnh sửa</span>
                    <ChevronRight size={14} className="group-open:rotate-90 transition-transform text-slate-400" />
                  </summary>
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    {history.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50/80 hover:bg-emerald-50/50 transition-colors">
                        <span className="text-[11px] sm:text-xs text-slate-700 font-medium truncate flex-1">{item.title}</span>
                        <button
                          onClick={() => move(list.findIndex((x) => x.id === item.id))}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-emerald-700 text-[11px] font-bold hover:border-emerald-300 shrink-0 shadow-2xs"
                        >
                          <span className="max-w-[120px] truncate">
                            {item.options?.find((o) => o.value === a[item.id])?.label ||
                              (item.id === 'industry'
                                ? selectedIndustries.map(item=>`${item.code} · ${item.name}`).join('; ')
                                : item.type === 'confirm'
                                ? 'Đã xác nhận'
                                : a[item.id])}
                          </span>
                          <span className="text-slate-400 text-[10px]">Sửa</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Current Question Block */}
              <div
                key={q.id}
                className="rw-question p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border border-emerald-200/80 shadow-sm animate-in fade-in duration-200"
                aria-live="polite"
              >
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                  <Layers size={12} />
                  <span>{q.section}</span>
                </div>
                <h2 ref={activeRef} tabIndex={-1} className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug focus:outline-none">
                  {q.title}
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">{q.help}</p>
                {showCompanionGuide && a.kind==='individual' && (
                  <button type="button" className="lg:hidden mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800" onClick={()=>setMobileTab('image')}>
                    Xem {a.channel === 'app' ? 'mô phỏng App' : 'ảnh hướng dẫn và GIF'} →
                  </button>
                )}

                {q.id === 'kind' && (
                  <details className="rw-comparison mt-4 pt-3.5 border-t border-emerald-200/70 space-y-2">
                    <summary className="cursor-pointer text-sm font-bold text-emerald-800 py-2">Phân biệt hai hình thức đăng ký</summary>
                    {COMPARISON.map((c) => (
                      <div key={c.title} className="text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-emerald-100/80 shadow-2xs">
                        <strong className="text-slate-900 font-bold block mb-0.5">{c.title}:</strong>
                        <span>{c.text}</span>
                      </div>
                    ))}
                  </details>
                )}
              </div>

              {/* Answer Input / Choices Area */}
              <div className="pt-1" key={`answer-${q.id}`}>
                {/* 1. Multiple choice options */}
                {q.options ? (
                  <div className="space-y-3">
                    {q.options.map((option) => {
                      const isLocked = Boolean(option.locked);
                      const isSelected = a[q.id] === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={isLocked}
                          onClick={() => {
                            if (isLocked) return;
                            send(option.value);
                          }}
                          aria-disabled={isLocked}
                          className={`group relative w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                            isLocked
                              ? 'bg-slate-50/90 border-slate-200/90 text-slate-400 cursor-not-allowed opacity-75 select-none'
                              : isSelected
                              ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm cursor-pointer'
                              : 'bg-white/90 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 hover:shadow-sm cursor-pointer'
                          }`}
                        >
                          {/* Corner lock icon & "Sắp ra mắt" badge */}
                          {isLocked && (
                            <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100/90 border border-amber-300/80 text-amber-900 text-[10.5px] sm:text-[11px] font-extrabold tracking-wide uppercase shadow-2xs">
                              <Lock size={12} className="text-amber-700 shrink-0" />
                              <span>{option.badge || 'Sắp ra mắt'}</span>
                            </div>
                          )}

                          <div className={isLocked ? 'pr-24 sm:pr-28' : ''}>
                            <div className="flex items-center gap-2">
                              <span
                                className={`block text-xs sm:text-sm font-bold transition-colors ${
                                  isLocked
                                    ? 'text-slate-600'
                                    : isSelected
                                    ? 'text-emerald-950 font-extrabold'
                                    : 'text-slate-900 group-hover:text-emerald-800'
                                }`}
                              >
                                {option.label}
                              </span>
                            </div>
                            {option.detail && (
                              <small
                                className={`block text-[11px] sm:text-xs mt-1 leading-normal ${
                                  isLocked ? 'text-slate-400' : 'text-slate-500'
                                }`}
                              >
                                {option.detail}
                              </small>
                            )}
                          </div>

                          {!isLocked && (
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                              }`}
                            >
                              <ChevronRight size={16} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : q.type === 'industry' && rentalUnavailable ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-4">
                    <p className="text-sm leading-relaxed text-amber-950">{suggestion.question}</p>
                    <a href={a.kind === 'individual' ? 'https://dichvucong.gdt.gov.vn/tthc/homelogin' : 'https://dichvucong.gov.vn/'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white">{a.kind === 'individual' ? 'Dịch Vụ Công Thuế Nhà Nước' : 'Mở Cổng Dịch vụ công Quốc gia'}<ExternalLink size={16}/></a>
                    <button type="button" className="text-xs underline" onClick={()=>move(list.findIndex(item=>item.id==='activity'))}>Sửa mô tả ngành nghề</button>
                  </div>
                ) : q.type === 'industry' ? (
                  /* 2. Industry Suggestion (AI-only, clean & focused) */
                  <div className="space-y-4">
                    {suggesting && (
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-5 text-sm text-emerald-900 flex items-center gap-3" role="status">
                        <Sparkles size={18} className="text-emerald-600 animate-spin shrink-0" />
                        <span>AI đang đối chiếu mô tả hoạt động với danh mục mã ngành…</span>
                      </div>
                    )}
                    {!suggesting && suggestion?.status==='suggested' && (
                      <article className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-5 space-y-4 shadow-sm animate-in fade-in">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                          <Sparkles size={12} />
                          <span>AI GỢI Ý MÃ NGÀNH · CHỜ BẠN XÁC NHẬN</span>
                        </div>
                        <div className="space-y-2">
                          {(suggestion.industries||[suggestion]).map(item=>(
                            <div key={item.code} className="p-3 bg-white rounded-xl border border-emerald-200/80 flex items-start gap-3 shadow-2xs">
                              <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-1 rounded-lg shrink-0">
                                {item.code}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm text-slate-900 leading-snug">{item.name}</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Mã ngành cấp 4 theo Quyết định 36/2025/QĐ-TTg</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Gợi ý dựa trên hoạt động bạn mô tả. Bạn hãy kiểm tra tên ngành và bấm xác nhận để tiếp tục.
                        </p>
                        <div className="pt-1 flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm py-3 px-4 shadow-sm transition-all cursor-pointer"
                            onClick={()=>confirmIndustries((suggestion.industries||[suggestion]).map(item=>item.code))}
                          >
                            {(suggestion.industries?.length||1)>1?'Xác nhận các mã ngành này':'Đúng hoạt động của tôi, xác nhận'}
                          </button>
                          <button
                            type="button"
                            className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                            onClick={()=>move(list.findIndex(item=>item.id==='activity'))}
                          >
                            Sửa mô tả hoạt động
                          </button>
                        </div>

                        {a.channel === 'app' && (
                          <div className="mt-2 pt-3 border-t border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/80 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs sm:text-sm">
                                <Smartphone size={15} className="text-emerald-700 shrink-0" />
                                <span>Đăng ký qua App eTax Mobile</span>
                              </div>
                              <p className="text-[11px] text-slate-600">
                                Mở app eTax Mobile trên điện thoại để nộp hồ sơ trực tiếp với mã ngành này.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                confirmIndustries((suggestion.industries || [suggestion]).map(item => item.code));
                                openETaxMobileApp(() => setIsAppModalOpen(true));
                              }}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                            >
                              <Smartphone size={14} />
                              <span>Mở App eTax ngay ↗</span>
                            </button>
                          </div>
                        )}
                      </article>
                    )}
                    {!suggesting && suggestion?.status==='clarify' && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 space-y-4">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
                          <p className="text-sm font-semibold text-amber-950 leading-relaxed">{suggestion.question}</p>
                        </div>
                        {clarifications.map((text,index)=>(
                          <div key={index} className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                            <strong>Đã bổ sung:</strong> {text}
                          </div>
                        ))}
                        {clarifications.length<3 ? (
                          <form className="space-y-3 pt-1" onSubmit={e=>{e.preventDefault();submitClarification();}}>
                            <label htmlFor="rw-clarification" className="block text-xs font-bold text-slate-800">
                              Bổ sung thêm thông tin để AI chọn chính xác:
                            </label>
                            <textarea
                              className="w-full bg-white rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none"
                              id="rw-clarification"
                              value={clarifyDraft}
                              onChange={e=>setClarifyDraft(e.target.value)}
                              placeholder="Ví dụ: tôi bán lẻ trực tiếp cho khách, có nhận giao hàng..."
                              maxLength={1200}
                              rows={3}
                            />
                            <div className="flex items-center gap-2">
                              <button
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 px-4 disabled:opacity-50 transition-colors"
                                disabled={!clarifyDraft.trim()}
                                type="submit"
                              >
                                Gợi ý lại
                              </button>
                              <button
                                type="button"
                                className="text-xs text-slate-600 hover:text-slate-900 underline py-2 px-3"
                                onClick={()=>move(list.findIndex(item=>item.id==='activity'))}
                              >
                                Viết lại mô tả khác
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-emerald-800 font-bold underline"
                            onClick={()=>move(list.findIndex(item=>item.id==='activity'))}
                          >
                            Viết lại mô tả ban đầu rõ hơn
                          </button>
                        )}
                      </div>
                    )}
                    {!suggesting && (suggestError || !suggestion) && (
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3">
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {suggestError
                            ? 'AI chưa gợi ý được lúc này. Bạn có thể thử lại hoặc chỉnh sửa mô tả hoạt động.'
                            : 'Bạn có thể yêu cầu AI gợi ý mã ngành cho hoạt động vừa mô tả.'}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 px-4 transition-colors"
                            onClick={()=>recommend(a.activity,clarifications,clarificationReasons.current)}
                          >
                            Gợi ý mã ngành
                          </button>
                          <button
                            type="button"
                            className="text-xs text-slate-600 hover:text-slate-900 underline py-2 px-3"
                            onClick={()=>move(list.findIndex(item=>item.id==='activity'))}
                          >
                            Sửa mô tả
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Chỉ mô tả hoạt động được gửi để đối chiếu mã ngành.</span>
                      <a href={SOURCES.industry} target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1">
                        Tra cứu QĐ 36/2025/QĐ-TTg <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ) : q.type === 'confirm' ? (
                  /* 3. Confirm / Finish / Details */
                  <div className="space-y-4">
                    {!quickOnline && ['details','finish'].includes(q.id) && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed space-y-2">
                      <p><strong>Nơi tiếp nhận:</strong> {recipient(a)}</p>
                      {online && (
                        a.channel === 'app' ? (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => openETaxMobileApp(() => setIsAppModalOpen(true))}
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                            >
                              <Smartphone size={14} />
                              <span>Mở ứng dụng eTax Mobile ngay ↗</span>
                            </button>
                          </div>
                        ) : (
                          <a href={portal(a)} target="_blank" rel="noreferrer" className="block font-bold text-emerald-700 underline">
                            {a.kind === 'individual' ? 'Mở Cổng Dịch Vụ Công Thuế Nhà Nước ↗' : 'Mở cổng nộp hồ sơ chính thức ↗'}
                          </a>
                        )
                      )}
                      <a href={a.kind==='household'?'/documents/Mau-01-HKD-TT68-2025.docx':'/documents/Mau-03-DKT-TT90-2026.doc'} download className="block text-emerald-700 underline">Tải biểu mẫu gốc</a>
                      <a href={source} target="_blank" rel="noreferrer" className="block text-slate-500 underline">Nguồn hướng dẫn · {WIZARD_VERSION}</a>
                    </div>}
                  {/* Form fields stay in the conversation after removing the middle column. */}
                  {['details', 'declare'].includes(q.id) && (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3.5">
                      <h3 className="text-xs font-bold text-slate-900">
                        {q.id === 'declare' ? 'Đối chiếu thông tin đã chuẩn bị' : 'Điền thông tin hồ sơ'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {online
                          ? 'Nộp online: Có thể điền trực tiếp trên cổng; thông tin dưới đây để bạn rà soát.'
                          : 'Chỉ điền dữ liệu thật khi bạn chuẩn bị hồ sơ của chính mình.'}
                      </p>
                      <div className="space-y-3">
                        {detailFields(a).map((f) => (
                          <label key={f.id} htmlFor={`detail-${f.id}`} className="block">
                            <span className="block text-xs font-semibold text-slate-700 mb-1">
                              {f.label}
                              {!f.optional && <b className="text-rose-500" aria-label="bắt buộc trên hồ sơ"> *</b>}
                            </span>
                            <input
                              id={`detail-${f.id}`}
                              value={a[f.id] || ''}
                              onChange={(e) => field(f.id, e.target.value)}
                              type={f.type || 'text'}
                              autoComplete="off"
                              maxLength={/personalId|previousId|^member\d+Id$/.test(f.id) ? 12 : 500}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                            />
                            <small className="block text-[10px] text-slate-400 mt-1">{f.help}</small>
                          </label>
                        ))}
                      </div>
                      {a.founder === 'family' && (
                        <p className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-900 text-xs leading-relaxed">
                          Bản in có bảng danh sách thành viên. Các thành viên cần kiểm tra và ký tại bảng; chuẩn bị thêm văn bản ủy quyền cho một thành viên làm chủ hộ.
                        </p>
                      )}
                    </div>
                  )}

                    {q.id === 'details' && (
                      <>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {online
                            ? 'Có thể điền trực tiếp trên cổng dịch vụ công; các ô tại đây để bạn chuẩn bị sẵn, không bắt buộc nhập lại hai lần.'
                            : formErrors.length
                            ? `${formErrors.length} mục cần bổ sung hoặc chỉnh sửa trước khi xác nhận.`
                            : 'Đã điền các trường bắt buộc. Vui lòng rà soát rồi bấm xác nhận bên dưới.'}
                        </p>
                      </>
                    )}

                    {q.id === 'finish' ? (
                      <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 text-center space-y-4 shadow-sm">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                          <Check size={28} />
                        </div>
                        <div>
                          <strong className="text-lg sm:text-xl font-extrabold text-slate-900 block">
                            {quickOnline ? 'Đã xác nhận mã ngành' : online ? 'Đã hoàn thành các bước hướng dẫn' : 'Hồ sơ đã sẵn sàng để kiểm tra'}
                          </strong>
                          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                            {quickOnline ? 'Tiếp tục kê khai trên cổng chính thức. Chưa có hồ sơ nào được gửi từ website này.' : online
                              ? 'Theo dõi mã hồ sơ trên cổng; kiểm tra thông báo tiếp nhận và yêu cầu bổ sung nếu có.'
                              : 'Kiểm tra kỹ thông tin đã điền, tải bản in A4 về in và ký tên. Lưu ý không ký thay người khác.'}
                          </p>
                        </div>

                        {quickOnline && <div className="space-y-4 text-left">
                          <div className="rounded-xl border border-emerald-200 bg-white p-4"><p className="text-xs text-slate-500">Các mã ngành đã chọn</p>{selectedIndustries.map(item=><strong key={item.code} className="block mt-1 text-sm text-emerald-900">{item.code} · {item.name}</strong>)}<p className="text-xs text-slate-600 mt-2">{a.activity}</p></div>
                          {a.channel === 'app' ? (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={() => openETaxMobileApp(() => setIsAppModalOpen(true))}
                                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-5 py-4 text-sm font-bold text-white shadow-md transition-all active:scale-98 cursor-pointer"
                              >
                                <Smartphone size={18} />
                                <span>Mở ứng dụng eTax Mobile ngay ↗</span>
                              </button>
                              <p className="text-xs text-center text-slate-500">
                                Chạm để mở trực tiếp ứng dụng eTax Mobile trên điện thoại (hoặc quét mã QR trên máy tính).
                              </p>
                            </div>
                          ) : (
                            <a href={a.kind === 'individual' ? 'https://dichvucong.gdt.gov.vn/tthc/homelogin' : 'https://dichvucong.gov.vn/'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-4 text-sm font-bold text-white transition-colors">
                              <span>{a.kind === 'individual' ? 'Dịch Vụ Công Thuế Nhà Nước' : 'Mở Cổng Dịch vụ công Quốc gia'}</span>
                              <ExternalLink size={16}/>
                            </a>
                          )}
                        </div>}

                        {!online && (
                          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                              disabled={exporting}
                              onClick={() => downloadApplication('html')}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                            >
                              <Download size={16} />
                              <span>{exporting ? 'Đang tạo file…' : 'Tải bản in A4 (.html)'}</span>
                            </button>
                            <button
                              disabled={exporting}
                              onClick={() => downloadApplication('docx')}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                            >
                              <span>Tải bản Word (.docx)</span>
                            </button>
                          </div>
                        )}
                        {!online && (
                          <p className="text-[11px] text-slate-500">
                            Mẹo: Mở file HTML bằng trình duyệt rồi chọn In / Lưu thành PDF khổ A4. Kiểm tra và ký trước khi mang đi nộp.
                          </p>
                        )}
                        {exportError && (
                          <p role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                            {exportError}
                          </p>
                        )}
                      </div>
                    ) : (
                      !blocked && (
                        <button
                          onClick={() => send('confirmed')}
                          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                        >
                          <span>{q.id === 'details' ? 'Xác nhận thông tin và tiếp tục' : 'Đã thực hiện, tiếp tục'}</span>
                          <ArrowRight size={16} />
                        </button>
                      )
                    )}

                    {blocked && (
                      <a
                        href={source}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all"
                      >
                        <span>Xem đúng thủ tục quy định</span>
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                ) : (
                  /* 4. Text input fallback */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      send(draft || a[q.id] || '');
                    }}
                    className="space-y-3"
                  >
                    <label htmlFor="rw-answer-input" className="block text-xs sm:text-sm font-bold text-slate-800">
                      Câu trả lời của bạn
                    </label>
                    <textarea
                      id="rw-answer-input"
                      key={q.id}
                      value={draft || ''}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={a[q.id] ? `Đã lưu: ${a[q.id]}. Nhập để sửa hoặc giữ nguyên.` : 'Nhập câu trả lời của bạn tại đây…'}
                      rows={3}
                      maxLength={1200}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                    >
                      <span>{a[q.id] && !draft ? 'Giữ nguyên và tiếp tục' : 'Tiếp tục'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>
                )}

                {/* Validation Error Message */}
                {error && (
                  <p role="alert" className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed animate-in fade-in">
                    {error}
                  </p>
                )}
                {tries >= 2 && (
                  <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                    Gợi ý: Đối chiếu thẻ Căn cước, giấy tờ địa điểm kinh doanh và hướng dẫn của mục đang điền.
                  </p>
                )}
              </div>
            </div>

            {/* Chat Footer */}
            <footer className="px-5 py-3.5 sm:px-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
              <button
                disabled={state.current === 0}
                onClick={() => move(state.current - 1)}
                className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-emerald-700 disabled:opacity-40 disabled:hover:text-slate-600 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Quay lại câu trước</span>
              </button>
              <span className="text-[11px] text-slate-400">Dữ liệu chỉ giữ trong phiên này</span>
            </footer>
          </section>

          {/* COLUMN 3: Hình ảnh cổng trực tuyến (Mockup) */}
          {showCompanionGuide && (
            <aside
              className={`rw-card rw-images lg:col-span-7 ${mobileTab === 'image' ? 'block' : 'hidden lg:block'}`}
              aria-label="Hình ảnh cổng trực tuyến"
            >
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 via-teal-50/30 to-transparent flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100/80 text-teal-800 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                    <Layers size={12} className="text-teal-600" />
                    <span>ĐI CÙNG MÀN HÌNH</span>
                  </div>
                  <h2 className="text-base sm:text-xl font-extrabold text-slate-900 leading-snug">{q.section}</h2>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-slate-200/80 text-xs font-bold text-emerald-800 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{a.channel === 'app' ? 'Hướng dẫn App eTax Mobile' : 'Hướng dẫn trực tuyến'}</span>
                </div>
              </div>

              {a.kind === 'individual' ? (
                a.channel === 'app' ? (
                  <TaxAppGuide step={q.id} industries={selectedIndustries} industryConfirmed={state.confirmed.includes('industry')} />
                ) : (
                  <TaxOnlineGuide step={q.id} industries={selectedIndustries} industryConfirmed={state.confirmed.includes('industry')} />
                )
              ) : (
                <PortalMockup step={q.id} answers={a} />
              )}

              {a.kind === 'household' && (
                <div className="px-5 py-2">
                  <a
                    className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                    href={SOURCES.onlineHousehold}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>Hướng dẫn trên cổng ĐKKD quốc gia</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              <div className="m-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-amber-900 text-xs leading-relaxed space-y-1">
                <h3 className="font-bold flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-600" />
                  <span>Nếu cổng bảo trì hoặc báo lỗi</span>
                </h3>
                <p className="text-[11px] text-amber-800">
                  Lưu nháp tại cổng nếu có; giữ dữ liệu đang nhập tại tab này. Chưa có biên nhận thì chưa xác nhận đã nộp. Bạn có thể quay lại bước nộp hồ sơ để đổi phương thức nộp phù hợp.
                </p>
              </div>
            </aside>
          )}
        </div>

        {/* Global Page Footer within Wizard */}
        <footer className="mt-10 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>AI chỉ nhận mô tả hoạt động và câu làm rõ để gợi ý mã ngành. Các ô thông tin hồ sơ chỉ giữ trên thiết bị.</span>
          </div>
          <div className="flex items-center gap-4">
            {onOpenAIChat && (
              <button
                onClick={() => onOpenAIChat('Tôi có câu hỏi nghiệp vụ thuế ngoài hướng dẫn đăng ký.')}
                className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
              >
                Hỏi kiến thức thuế ↗
              </button>
            )}
            {onOpenConsultation && (
              <button
                onClick={onOpenConsultation}
                className="text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Cần chuyên viên hỗ trợ
              </button>
            )}
          </div>
        </footer>
        <ETaxAppModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />
      </div>
    </div>
  );
}
