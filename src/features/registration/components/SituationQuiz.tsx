import React, { useState } from 'react';
import {
  Store,
  Globe,
  Truck,
  ShoppingBag,
  Users,
  Layers,
  ShieldCheck,
  TrendingUp,
  Smartphone,
  CreditCard,
  HelpCircle,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { QUIZ_QUESTIONS, decidePath, type PathDecision } from '../data/quiz';
import type { QuizQuestion, QuizOption } from '../types';

interface SituationQuizProps {
  answers: Record<string, string>;
  onAnswer: (questionId: string, answerId: string) => void;
  onFinishQuiz: (decision: PathDecision) => void;
  onReset: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Store: <Store className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  Truck: <Truck className="w-5 h-5" />,
  ShoppingBag: <ShoppingBag className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Layers: <Layers className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  Smartphone: <Smartphone className="w-5 h-5" />,
  CreditCard: <CreditCard className="w-5 h-5" />,
  HelpCircle: <HelpCircle className="w-5 h-5" />,
};

export const SituationQuiz: React.FC<SituationQuizProps> = ({
  answers,
  onAnswer,
  onFinishQuiz,
  onReset,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  const question: QuizQuestion = QUIZ_QUESTIONS[currentIdx];
  const totalQuestions = QUIZ_QUESTIONS.length;
  const isLastQuestion = currentIdx === totalQuestions - 1;

  const handleSelectOption = (opt: QuizOption) => {
    const updatedAnswers = {
      ...answers,
      [question.id]: opt.id,
    };
    onAnswer(question.id, opt.id);

    if (isLastQuestion) {
      const decision = decidePath(updatedAnswers);
      onFinishQuiz(decision);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleResetQuiz = () => {
    setCurrentIdx(0);
    onReset();
  };

  const selectedAnswerId = answers[question.id];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Quiz Progress & Reset */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Tư vấn mô hình · Câu {currentIdx + 1} / {totalQuestions}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentIdx > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleResetQuiz}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Làm lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Làm lại</span>
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
          style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question Header */}
      <div className="text-center space-y-2 py-2">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {question.title}
        </h3>
        {question.subtitle && (
          <p className="text-sm sm:text-[15px] text-slate-600 max-w-xl mx-auto">
            {question.subtitle}
          </p>
        )}
      </div>

      {/* Options List */}
      <div className="grid grid-cols-1 gap-3.5 pt-2">
        {question.options.map((opt) => {
          const isSelected = selectedAnswerId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectOption(opt)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer flex items-start gap-4 group ${
                isSelected
                  ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                }`}
              >
                {opt.icon && ICON_MAP[opt.icon] ? (
                  ICON_MAP[opt.icon]
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <h4
                    className={`text-sm sm:text-base font-bold leading-snug transition-colors ${
                      isSelected ? 'text-emerald-950' : 'text-slate-900 group-hover:text-emerald-900'
                    }`}
                  >
                    {opt.label}
                  </h4>
                  {opt.badge && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  )}
                </div>

                {opt.description && (
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {opt.description}
                  </p>
                )}
              </div>

              <ArrowRight
                className={`w-4 h-4 mt-1 transition-transform shrink-0 ${
                  isSelected
                    ? 'text-emerald-700 translate-x-1'
                    : 'text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
