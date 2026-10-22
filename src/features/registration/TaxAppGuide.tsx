import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Info,
  Layers,
  ShieldCheck,
  Smartphone,
  ZoomIn,
} from 'lucide-react';
import { TAX_APP_MEDIA, TAX_APP_STEPS, taxAppStepIndex } from './data/taxOnlineSteps';
import RegistrationIndustryContext, {type GuideIndustryProps} from './RegistrationIndustryContext';
import { ETAX_LINKS, openETaxMobileApp } from './etaxDeepLink';
import ETaxAppModal from './components/ETaxAppModal';

// Phân nhóm 11 bước thực tế trên app thành 4 giai đoạn logic
const STEP_PHASES = [
  { id: 'auth', name: 'Giai đoạn 1: Mở app & Chọn chế độ', range: [0, 2] },
  { id: 'procedure', name: 'Giai đoạn 2: Chọn thủ tục Đăng ký thuế', range: [3, 6] },
  { id: 'declare', name: 'Giai đoạn 3: Phân loại & Kê khai thông tin', range: [7, 9] },
  { id: 'submit', name: 'Giai đoạn 4: Ký nộp OTP & Hoàn tất', range: [10, 10] },
] as const;

interface Props extends GuideIndustryProps {
  step: string;
}

export default function TaxAppGuide({ step,industries,industryConfirmed }: Props) {
  const [index, setIndex] = useState(() => taxAppStepIndex(step));
  const [showAllSteps, setShowAllSteps] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  const handleLaunchApp = () => {
    openETaxMobileApp(() => {
      setIsAppModalOpen(true);
    });
  };

  useEffect(() => {
    setIndex(taxAppStepIndex(step));
  }, [step]);

  // Lắng nghe phím mũi tên Trái (←) và Phải (→) khi mở màn hình xem ảnh to
  useEffect(() => {
    if (!isDialogOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIndex((i) => Math.min(TAX_APP_STEPS.length - 1, i + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDialogOpen]);

  const item = TAX_APP_STEPS[index] || TAX_APP_STEPS[0];
  const image = `${TAX_APP_MEDIA}/${item.file}`;
  const percent = Math.round(((index + 1) / TAX_APP_STEPS.length) * 100);

  // Tìm giai đoạn hiện tại
  const currentPhase = STEP_PHASES.find(
    (phase) => index >= phase.range[0] && index <= phase.range[1]
  );

  const openFullscreen = () => {
    setIsDialogOpen(true);
    dialog.current?.showModal();
  };

  const closeFullscreen = () => {
    dialog.current?.close();
    setIsDialogOpen(false);
  };

  return (
    <section className="rw-tax-app" aria-label="Hướng dẫn đăng ký thuế qua App eTax Mobile bằng ảnh thực tế">
      {/* 1. Header & Step Progress */}
      <div className="rw-tax-online-heading">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="inline-flex items-center gap-2">
            <span className="rw-tax-app-badge">
              BƯỚC {index + 1} / {TAX_APP_STEPS.length}
            </span>
            {currentPhase && (
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/70">
                {currentPhase.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLaunchApp}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Chạm để mở ứng dụng eTax Mobile trên điện thoại hoặc quét QR"
            >
              <Smartphone size={13} className="text-white" />
              <span>Mở App eTax</span>
              <ExternalLink size={11} className="opacity-80" />
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-3 border border-slate-200/60">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {item.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Ảnh chụp màn hình thực tế ứng dụng eTax Mobile của Tổng cục Thuế · Chạm ảnh để phóng to.
        </p>
      </div>

      {/* 2. Main Step Instruction (Chữ to, rõ ràng, nổi bật & cân đối) */}
      <div className="my-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border border-emerald-200/90 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-sm sm:text-base mb-2.5">
          <Info size={20} className="text-emerald-700 shrink-0" />
          <span>HƯỚNG DẪN THAO TÁC TRÊN APP:</span>
        </div>
        <p className="rw-tax-online-description text-base sm:text-lg text-slate-800 leading-relaxed font-normal">
          {item.help}
        </p>

        <RegistrationIndustryContext step={item.id} industries={industries} industryConfirmed={industryConfirmed}/>
        {/* Specific quick advice & Open App Action */}
        {index === 0 && (
          <div className="mt-4 pt-3.5 border-t border-emerald-200/60 space-y-3">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <strong className="text-xs sm:text-sm text-emerald-950 font-bold">Mở ứng dụng eTax Mobile</strong>
                </div>
                <p className="text-[11px] sm:text-xs text-emerald-850">
                  Tự động bật ứng dụng trên điện thoại (hoặc quét mã QR nếu bạn đang xem trên máy tính).
                </p>
              </div>
              <button
                type="button"
                onClick={handleLaunchApp}
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Smartphone size={16} />
                <span>Chạm mở App ngay</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700">Tải app chính thức:</span>
              <a
                href={ETAX_LINKS.appStore}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <span>App Store (iOS)</span>
                <ExternalLink size={11} />
              </a>
              <a
                href={ETAX_LINKS.googlePlay}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-2xs"
              >
                <span>Google Play (Android)</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 3. Image Display with Zoom Trigger (Vertical Phone Frame Preview) */}
      <div className="my-4 flex justify-center">
        <button
          type="button"
          className="group relative cursor-zoom-in block max-w-[340px] w-full rounded-2xl overflow-hidden border border-slate-300/80 bg-slate-900 shadow-md transition-all hover:shadow-xl"
          onClick={openFullscreen}
          aria-label={`Phóng to ảnh bước ${index + 1}: ${item.title}`}
        >
          <img
            src={image}
            alt={`Bước ${index + 1}: ${item.title}`}
            loading="lazy"
            width={1170}
            height={2532}
            className="w-full h-auto object-contain transition-transform duration-200 group-hover:scale-[1.01]"
          />
          <span className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <ZoomIn size={15} className="text-emerald-400" />
              <span>Chạm để xem rõ</span>
            </span>
            <span className="text-slate-300 text-[11px] hidden sm:inline">
              Mở toàn màn hình (hỗ trợ ← →) ↗
            </span>
          </span>
        </button>
      </div>

      {/* 4. Large Navigation Buttons (Trước / Sau) */}
      <nav className="rw-tax-online-nav my-5 flex items-center justify-between gap-3" aria-label="Chuyển ảnh hướng dẫn app">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold disabled:opacity-40 disabled:hover:bg-white shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>← Ảnh trước</span>
        </button>

        <div className="px-4 py-2 text-center shrink-0">
          <span className="text-sm font-extrabold text-slate-800" aria-live="polite">
            {index + 1} / {TAX_APP_STEPS.length}
          </span>
        </div>

        <button
          type="button"
          disabled={index === TAX_APP_STEPS.length - 1}
          onClick={() => setIndex(index + 1)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold disabled:opacity-40 shadow-sm transition-all cursor-pointer"
        >
          <span>Ảnh sau →</span>
          <ArrowRight size={16} />
        </button>
      </nav>

      {/* 5. Clearly Separated Steps Overview (Lộ trình 11 bước phân theo giai đoạn) */}
      <div className="my-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setShowAllSteps(!showAllSteps)}
          className="w-full flex items-center justify-between gap-3 text-left font-bold text-slate-900 pb-2 border-b border-slate-100 cursor-pointer"
        >
          <span className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-slate-800">
            <Layers size={18} className="text-emerald-600" />
            <span>Lộ trình chi tiết 11 bước trên app eTax Mobile</span>
          </span>
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            {showAllSteps ? 'Thu gọn' : 'Xem danh sách bước'}
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${showAllSteps ? 'rotate-180' : ''}`}
            />
          </span>
        </button>

        {showAllSteps && (
          <div className="mt-4 space-y-4">
            {STEP_PHASES.map((phase) => (
              <div key={phase.id} className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  {phase.name}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {TAX_APP_STEPS.slice(phase.range[0], phase.range[1] + 1).map((s, idx) => {
                    const stepIdx = phase.range[0] + idx;
                    const isActive = stepIdx === index;
                    const isPassed = stepIdx < index;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setIndex(stepIdx)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50/90 border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                            : isPassed
                            ? 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 text-slate-700'
                            : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5 ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : isPassed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 size={14} /> : stepIdx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-xs sm:text-sm font-bold block truncate ${
                                isActive ? 'text-emerald-950 font-extrabold' : 'text-slate-800'
                              }`}
                            >
                              {s.title}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white shrink-0">
                                Đang xem
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {s.help}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick select dropdown fallback for rapid jump */}
        <label className="rw-tax-online-select mt-4 pt-3 border-t border-slate-100 block text-xs font-bold text-slate-700">
          Chuyển nhanh đến bước:
          <select
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {TAX_APP_STEPS.map((s, i) => (
              <option key={s.id} value={i}>
                Bước {i + 1}: {s.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 6. Security Note from General Department of Taxation */}
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 space-y-2 text-xs text-slate-700">
        <div className="flex items-center gap-2 text-emerald-800 font-bold">
          <ShieldCheck size={16} />
          <span>Lưu ý bảo mật từ TỔNG CỤC THUẾ</span>
        </div>
        <p className="leading-relaxed text-[11.5px] text-emerald-950">
          Chỉ cài đặt ứng dụng <strong>eTax Mobile</strong> chính thức do <strong>TỔNG CỤC THUẾ (GDT)</strong> phát hành trên App Store và Google Play. Không cài đặt từ tệp APK hoặc đường link lạ được chia sẻ qua mạng xã hội.
        </p>
      </div>

      {/* 7. High-Res Fullscreen Dialog (Ảnh điện thoại dọc cân đối, chữ to hơn 20%, hỗ trợ phím mũi tên) */}
      <dialog
        ref={dialog}
        className="rw-tax-app-dialog"
        onClose={() => setIsDialogOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeFullscreen();
        }}
      >
        {/* Dialog Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-emerald-700 uppercase tracking-wider">
                BƯỚC {index + 1} / {TAX_APP_STEPS.length}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">
                <span>Phím mũi tên:</span>
                <kbd className="px-1.5 py-0.2 bg-white border border-slate-300 rounded text-[10px] font-bold shadow-2xs">←</kbd>
                <kbd className="px-1.5 py-0.2 bg-white border border-slate-300 rounded text-[10px] font-bold shadow-2xs">→</kbd>
                <span>chuyển ảnh</span>
              </span>
            </div>
            <h4 className="text-base sm:text-xl font-extrabold text-slate-900 mt-1">{item.title}</h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-30 transition-all cursor-pointer shadow-2xs"
              title="Phím mũi tên trái ←"
            >
              <ArrowLeft size={14} />
              <span>Trước (←)</span>
            </button>
            <button
              type="button"
              disabled={index === TAX_APP_STEPS.length - 1}
              onClick={() => setIndex((i) => Math.min(TAX_APP_STEPS.length - 1, i + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-30 transition-all cursor-pointer shadow-2xs"
              title="Phím mũi tên phải →"
            >
              <span>Sau (→)</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={closeFullscreen}
              autoFocus
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all ml-1 cursor-pointer"
            >
              <span>Đóng ảnh ×</span>
            </button>
          </div>
        </div>

        {/* Dialog Image: Portrait Phone screenshot display */}
        <div className="relative flex items-center justify-center my-2">
          {/* Nút bấm chuyển ảnh nhanh bên trái */}
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="absolute left-1 sm:left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg disabled:opacity-10 disabled:cursor-not-allowed transition-all cursor-pointer backdrop-blur-xs"
            aria-label="Ảnh trước (←)"
          >
            <ArrowLeft size={20} />
          </button>

          <img
            src={image}
            alt={`Bước ${index + 1}: ${item.title}`}
            width={1170}
            height={2532}
            className="w-auto max-w-[320px] sm:max-w-[360px] max-h-[56vh] object-contain rounded-2xl border border-slate-200 shadow-md mx-auto"
          />

          {/* Nút bấm chuyển ảnh nhanh bên phải */}
          <button
            type="button"
            disabled={index === TAX_APP_STEPS.length - 1}
            onClick={() => setIndex((i) => Math.min(TAX_APP_STEPS.length - 1, i + 1))}
            className="absolute right-1 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-600/80 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg disabled:opacity-10 disabled:cursor-not-allowed transition-all cursor-pointer backdrop-blur-xs"
            aria-label="Ảnh sau (→)"
          >
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Dialog Instruction: Chữ tăng thêm 20% kích thước */}
        <RegistrationIndustryContext step={item.id} industries={industries} industryConfirmed={industryConfirmed}/>
        <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border border-emerald-200 text-emerald-950 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base uppercase tracking-wider text-emerald-900 mb-2">
            <Info size={19} className="text-emerald-700 shrink-0" />
            <span>Nội dung hướng dẫn chi tiết:</span>
          </div>
          <p className="text-[17px] sm:text-[20px] leading-[1.8] text-slate-900 font-medium">
            {item.help}
          </p>
        </div>
      </dialog>

      <ETaxAppModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
      />
    </section>
  );
}
