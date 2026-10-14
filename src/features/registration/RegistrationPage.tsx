import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  RotateCcw,
  Store,
  UserCheck,
  ShoppingBag,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { PathId, RegPath, RegStep } from './types';
import { REG_PATHS } from './data/paths';
import { REG_STEPS } from './data/steps';
import type { PathDecision } from './data/quiz';
import { useRegistrationState } from './hooks/useRegistrationState';
import { useHashRoute } from './hooks/useHashRoute';
import { RegHero } from './components/RegHero';
import { SituationQuiz } from './components/SituationQuiz';
import { PathResult } from './components/PathResult';
import { StepRail } from './components/StepRail';
import { StepCard } from './components/StepCard';
import { ProgressSummary } from './components/ProgressSummary';
import { RegFAQ } from './components/RegFAQ';
import { PdfViewerModal } from '../../components/PdfViewerModal';

interface RegistrationPageProps {
  onOpenAIChat?: (query: string) => void;
  onOpenConsultation?: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({
  onOpenAIChat,
  onOpenConsultation,
}) => {
  const {
    state,
    setPath,
    setQuizAnswer,
    resetQuiz,
    setStep,
    toggleStepDone,
    toggleDocChecked,
    resetAll,
  } = useRegistrationState();

  const { pathParam, stepParam, navigateTo } = useHashRoute();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [quizDecision, setQuizDecision] = useState<PathDecision | null>(null);
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false);
  const wizardTopRef = useRef<HTMLDivElement>(null);

  // Sync route query params if user visited #/dang-ky?path=household
  useEffect(() => {
    if (pathParam && ['individual', 'household', 'platform'].includes(pathParam)) {
      if (state.pathId !== pathParam) {
        const p = REG_PATHS[pathParam];
        const initialStep = stepParam && p.stepIds.includes(stepParam) ? stepParam : p.stepIds[0];
        setPath(pathParam as PathId, initialStep);
        setIsQuizActive(false);
      }
    }
  }, [pathParam, stepParam, state.pathId, setPath]);

  // Current active path & steps
  const activePathId: PathId = state.pathId || 'household';
  const currentPath: RegPath = REG_PATHS[activePathId];
  const steps: RegStep[] = useMemo(() => {
    return currentPath.stepIds.map((id) => REG_STEPS[id]).filter(Boolean);
  }, [currentPath]);

  // Active step ID fallback
  const activeStepId = state.currentStepId && currentPath.stepIds.includes(state.currentStepId)
    ? state.currentStepId
    : currentPath.stepIds[0];

  const currentStep = REG_STEPS[activeStepId] || steps[0];
  const currentStepIndex = steps.findIndex((s) => s.id === activeStepId);

  // Completion calculation
  const completedCount = steps.filter((s) => state.doneSteps.includes(s.id)).length;
  const isAllStepsCompleted = completedCount === steps.length && steps.length > 0;

  // Handlers
  const handleStartQuiz = () => {
    setQuizDecision(null);
    setIsQuizActive(true);
    resetQuiz();
    setTimeout(() => {
      wizardTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleFinishQuiz = (decision: PathDecision) => {
    setQuizDecision(decision);
  };

  const handleSelectPathAndStart = (pathId: PathId) => {
    const p = REG_PATHS[pathId];
    setPath(pathId, p.stepIds[0]);
    setIsQuizActive(false);
    setQuizDecision(null);
    navigateTo(`#/dang-ky?path=${pathId}`);
    setTimeout(() => {
      wizardTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectStep = (stepId: string) => {
    setStep(stepId);
    navigateTo(`#/dang-ky?path=${activePathId}&step=${stepId}`);
    setTimeout(() => {
      wizardTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      handleSelectStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      handleSelectStep(steps[currentStepIndex + 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* 1. Hero Section */}
      <RegHero
        onStartQuiz={handleStartQuiz}
        onOpenAIChat={onOpenAIChat}
        onBackToHome={() => navigateTo('#')}
      />

      <div ref={wizardTopRef} className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-10">
        {/* 2. Situation Quiz or Path Result View */}
        {isQuizActive && (
          <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs">
            {quizDecision ? (
              <PathResult
                decision={quizDecision}
                onStartPath={handleSelectPathAndStart}
                onSelectOtherPath={handleSelectPathAndStart}
                onRetakeQuiz={handleStartQuiz}
              />
            ) : (
              <SituationQuiz
                answers={state.quizAnswers}
                onAnswer={setQuizAnswer}
                onFinishQuiz={handleFinishQuiz}
                onReset={handleStartQuiz}
              />
            )}
          </section>
        )}

        {/* 3. Main Wizard Mode */}
        {!isQuizActive && (
          <section className="space-y-6">
            {/* Path Selection Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['household', 'platform', 'individual'] as PathId[]).map((pid) => {
                  const p = REG_PATHS[pid];
                  const isActive = pid === activePathId;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => handleSelectPathAndStart(pid)}
                      className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-transparent text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {pid === 'household' ? (
                          <Store className="w-4 h-4" />
                        ) : pid === 'platform' ? (
                          <ShoppingBag className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold truncate">{p.shortName}</div>
                        <div
                          className={`text-[11px] truncate ${
                            isActive ? 'text-emerald-100' : 'text-slate-500'
                          }`}
                        >
                          {p.estimatedFee}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Path description summary bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-600 shadow-2xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Đang xem: <strong className="font-bold text-slate-900">{currentPath.name}</strong> · {currentPath.tagline}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  className="font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Trắc nghiệm lại</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={resetAll}
                  className="font-semibold text-slate-400 hover:text-slate-600 cursor-pointer inline-flex items-center gap-1"
                  title="Đặt lại toàn bộ tiến độ và checklist"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Làm lại từ đầu</span>
                </button>
              </div>
            </div>

            {/* Two-Column Wizard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Step Rail */}
              <div className="lg:col-span-4 space-y-4">
                <StepRail
                  steps={steps}
                  currentStepId={activeStepId}
                  doneStepIds={state.doneSteps}
                  onSelectStep={handleSelectStep}
                />
              </div>

              {/* Right Column: StepCard + Progress Summary */}
              <div className="lg:col-span-8 space-y-6">
                <StepCard
                  step={currentStep}
                  stepIndex={currentStepIndex}
                  totalSteps={steps.length}
                  isDone={state.doneSteps.includes(activeStepId)}
                  checkedDocIds={state.checkedDocs}
                  onToggleDone={() => toggleStepDone(activeStepId)}
                  onToggleDoc={toggleDocChecked}
                  onSelectDocId={(docId) => setSelectedDocId(docId)}
                  onOpenAIChat={onOpenAIChat}
                />

                <ProgressSummary
                  totalSteps={steps.length}
                  completedCount={completedCount}
                  onPrev={handlePrevStep}
                  onNext={handleNextStep}
                  isFirst={currentStepIndex === 0}
                  isLast={currentStepIndex === steps.length - 1}
                />

                {/* Final Completion Congratulations Card */}
                {isAllStepsCompleted && (
                  <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white space-y-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">
                          Chúc mừng bạn
                        </span>
                        <h4 className="text-xl sm:text-2xl font-black">
                          Bạn đã hoàn thành đủ các bước hồ sơ!
                        </h4>
                      </div>
                    </div>

                    <p className="text-sm text-emerald-50 leading-relaxed max-w-xl">
                      Cơ sở của bạn đã sẵn sàng đi vào hoạt động chính thức. Đừng quên đối chiếu doanh thu với ngưỡng 1 tỷ đồng/năm để hưởng trọn vẹn chính sách miễn thuế theo Nghị định 141/2026/NĐ-CP.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <a
                        href="#tax-calculator"
                        onClick={() => navigateTo('#tax-calculator')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors shadow-xs"
                      >
                        <Calculator className="w-4 h-4 text-emerald-600" />
                        <span>Dự tính số thuế phát sinh</span>
                      </a>

                      {onOpenConsultation && (
                        <button
                          type="button"
                          onClick={onOpenConsultation}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 text-white border border-white/20 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <CalendarDays className="w-4 h-4 text-emerald-300" />
                          <span>Đặt lịch tư vấn chuyên gia 1-1</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 4. FAQ Section */}
        <RegFAQ onSelectDocId={(docId) => setSelectedDocId(docId)} />

        {/* 5. Legal Disclaimer Notice */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-100/80 border border-slate-200 text-center text-xs text-slate-500 leading-relaxed max-w-3xl mx-auto space-y-1">
          <p className="font-semibold text-slate-700">Miễn trừ trách nhiệm & Lưu ý pháp lý:</p>
          <p>
            Nội dung hướng dẫn được TaxHKD rà soát và đối chiếu căn cứ theo các văn bản quy phạm pháp luật hiện hành của Nước CHXHCN Việt Nam (Nghị định 168/2025/NĐ-CP, Nghị định 141/2026/NĐ-CP, Thông tư 86/2024/TT-BTC, Công văn 311/TCT-DNNCN). Quy định cụ thể về biểu mẫu và tiếp nhận hồ sơ có thể có hướng dẫn chi tiết theo từng địa phương. Vui lòng đối chiếu với Chi cục Thuế và cơ quan ĐKKD có thẩm quyền khi thực hiện thủ tục.
          </p>
        </div>
      </div>

      {/* 6. Modal xem tài liệu PDF gốc dùng chung */}
      <PdfViewerModal
        docId={selectedDocId}
        onClose={() => setSelectedDocId(null)}
        onOpenAIChat={onOpenAIChat}
      />
    </div>
  );
};

export default RegistrationPage;
