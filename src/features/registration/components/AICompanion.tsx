import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, ChevronUp, ChevronDown, Bot, ArrowRight, X } from 'lucide-react';
import type { RegStep } from '../types';

interface AICompanionProps {
  currentStep?: RegStep;
  stepIndex: number;
  totalSteps: number;
  isQuizActive: boolean;
  isAllDone: boolean;
  pathName: string;
  onOpenAIChat?: (query: string) => void;
  position?: 'floating' | 'inline';
}

const STEP_TIPS: Record<string, { speech: string; tip: string }> = {
  // Path A
  'ind-check-eligibility': {
    speech: 'Kinh doanh tự do, bán rong không mở cửa hàng được miễn đăng ký HKD nhưng bắt buộc đăng ký thuế trực tiếp bạn nhé!',
    tip: 'Theo NĐ 168/2025/NĐ-CP, bạn chỉ cần nộp Tờ khai 03-ĐK-TCT trực tuyến mà không cần giấy phép tại UBND.',
  },
  'ind-prepare-vneid': {
    speech: 'Từ 01/07/2025, số CCCD 12 số chính là Mã số thuế của bạn. Hãy đảm bảo tài khoản VNeID đã đạt Mức 2!',
    tip: 'VNeID Mức 2 giúp bạn ký số và nộp tờ khai một chạm qua Cổng Thuế điện tử mà không cần nộp giấy.',
  },
  'ind-submit-tax-reg': {
    speech: 'Đăng ký thuế lần đầu làm trực tiếp trên app eTax Mobile hoặc Cổng DVC (dichvucong.gdt.gov.vn) với mã thủ tục 1.007565 nhé!',
    tip: 'Hệ thống tự sinh tờ khai từ dữ liệu VNeID Mức 2 của bạn — không cần chuẩn bị mẫu giấy 03-ĐK-TCT.',
  },
  'ind-receive-tax-code': {
    speech: 'Sau 03 ngày làm việc bạn sẽ nhận thông báo kích hoạt MST. Hãy cài ngay ứng dụng eTax Mobile trên điện thoại.',
    tip: 'eTax Mobile giúp bạn tra cứu trạng thái mã số thuế cá nhân kinh doanh và nhận các thông báo thuế tức thì.',
  },
  'ind-post-reg-duties': {
    speech: 'Nghị định 141/2026 MIỄN 100% thuế GTGT & TNCN nếu doanh thu dưới 1 tỷ/năm! Nhớ ghi chép Sổ S1a đơn giản nhé.',
    tip: 'Nếu doanh thu vượt 1 tỷ, bạn có 30 ngày để đăng ký hóa đơn điện tử với cơ quan thuế.',
  },

  // Path B
  'hkd-choose-name-scope': {
    speech: 'Tên HKD bắt buộc gồm: "Hộ kinh doanh" + "Tên riêng". Lưu ý: Căn hộ chung cư để ở KHÔNG được đặt địa điểm kinh doanh!',
    tip: 'Hãy chuẩn bị sẵn hợp đồng thuê mặt bằng hoặc sổ đỏ của địa điểm kinh doanh cố định.',
  },
  'hkd-prepare-dossier': {
    speech: 'Một cá nhân chỉ được đứng tên duy nhất 01 Hộ kinh doanh trên toàn quốc theo Nghị định 168/2025/NĐ-CP.',
    tip: 'Tờ khai đề nghị đăng ký HKD hiện đã tích hợp sẵn thông tin đăng ký thuế một cửa.',
  },
  'hkd-submit-linked-reg': {
    speech: 'Quy trình liên thông tự động giữa ĐKKD và Thuế! Bạn hoàn toàn KHÔNG bị phạt chậm nộp thuế 10 ngày như trước.',
    tip: 'Nộp online qua Cổng Dịch vụ công Quốc gia để tiết kiệm 50% lệ phí và nhận kết quả sau 03 ngày làm việc.',
  },
  'hkd-receive-cert': {
    speech: 'Mã số hộ kinh doanh trên Giấy chứng nhận cũng chính là Mã số thuế 10 số của Hộ. Nhớ treo biển hiệu đúng luật nhé!',
    tip: 'Biển hiệu cần ghi rõ: Tên cơ quan cấp, Tên HKD, Mã số HKD, Địa chỉ và Số điện thoại liên hệ.',
  },
  'hkd-activate-tax-etax': {
    speech: 'Từ 01/01/2026 đã BÃI BỎ hoàn toàn Lệ phí môn bài! Bạn không cần nộp tờ khai hay đóng tiền môn bài hàng năm.',
    tip: 'Hãy mở tài khoản ngân hàng chính danh Hộ kinh doanh để tách bạch với chi tiêu gia đình.',
  },
  'hkd-invoices-records': {
    speech: 'Doanh thu trên 1 tỷ đồng/năm mới bắt buộc dùng Hóa đơn điện tử máy tính tiền và mở sổ sách theo Thông tư 88.',
    tip: 'Nếu dưới 1 tỷ đồng, bạn được miễn thuế hoàn toàn và chỉ cần ghi sổ theo dõi doanh thu đơn giản.',
  },

  // Path C
  'tmdt-check-model': {
    speech: 'Bán hàng trên Shopee, TikTok Shop được sàn tự động khấu trừ và nộp thay thuế GTGT 1% và TNCN 0.5%!',
    tip: 'Theo NĐ 141/2026/NĐ-CP, sàn có trách nhiệm cấp chứng từ khấu trừ thuế điện tử định kỳ cho bạn.',
  },
  'tmdt-access-portal': {
    speech: 'Truy cập đúng Cổng chính thức: canhantmdt.gdt.gov.vn của Tổng cục Thuế để đảm bảo an toàn bảo mật.',
    tip: 'Cảnh giác tuyệt đối với các website giả mạo hoặc yêu cầu cài file APK lạ vào điện thoại.',
  },
  'tmdt-vneid-login': {
    speech: 'Đăng nhập một chạm bằng app VNeID Mức 2. Mọi dữ liệu dân cư và thuế sẽ tự động đồng bộ.',
    tip: 'Mở app VNeID trên điện thoại quét mã QR trên màn hình máy tính để xác thực nhanh trong 5 giây.',
  },
  'tmdt-verify-888-case': {
    speech: 'Hệ thống tự động cấp mã định danh phân loại 888. Hãy lấy mã này cập nhật vào Seller Center của sàn nhé!',
    tip: 'Mã 888 theo Công văn 311/TCT-DNNCN là bắt buộc để khớp dữ liệu doanh thu sàn nộp thay.',
  },
  'tmdt-declare-monthly-tax': {
    speech: 'Định kỳ hàng tháng vào app eTax kiểm tra số thuế sàn đã nộp thay. Bán qua Facebook ngoài sàn mới cần tự khai!',
    tip: 'Dữ liệu sàn truyền thẳng về Tổng cục Thuế, hãy khớp đúng dòng tiền ngân hàng nhận từ sàn.',
  },
};

// SVG Animated Mascot Robot
const AIMascotAvatar: React.FC<{ size?: number; isWaving?: boolean }> = ({ size = 48 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center shrink-0 select-none"
    >
      {/* Outer Glow Ring */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 opacity-90 blur-[2px] animate-pulse" />

      {/* Robot Head Body */}
      <div className="relative w-full h-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-950 p-[2px] shadow-lg shadow-emerald-500/25 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          className="w-[85%] h-[85%] overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Antenna */}
          <line x1="50" y1="20" x2="50" y2="8" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="8" r="5" fill="#10b981">
            <animate attributeName="fill" values="#10b981;#34d399;#6ee7b7;#10b981" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Ears / Headphone */}
          <rect x="8" y="38" width="8" height="24" rx="4" fill="#059669" />
          <rect x="84" y="38" width="8" height="24" rx="4" fill="#059669" />

          {/* Face Screen */}
          <rect x="18" y="24" width="64" height="52" rx="14" fill="#0f172a" stroke="#10b981" strokeWidth="3" />

          {/* Left Eye */}
          <rect x="30" y="40" width="12" height="16" rx="6" fill="#34d399">
            <animate attributeName="height" values="16;16;3;16" keyTimes="0;0.9;0.95;1" dur="3.5s" repeatCount="indefinite" />
          </rect>
          <circle cx="33" cy="44" r="2.5" fill="#ecfdf5" />

          {/* Right Eye */}
          <rect x="58" y="40" width="12" height="16" rx="6" fill="#34d399">
            <animate attributeName="height" values="16;16;3;16" keyTimes="0;0.9;0.95;1" dur="3.5s" repeatCount="indefinite" />
          </rect>
          <circle cx="61" cy="44" r="2.5" fill="#ecfdf5" />

          {/* Smile / Mouth */}
          <path
            d="M 38 63 Q 50 71 62 63"
            stroke="#6ee7b7"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="transparent"
          />

          {/* Cheeks */}
          <circle cx="27" cy="56" r="3.5" fill="#f43f5e" opacity="0.4" />
          <circle cx="73" cy="56" r="3.5" fill="#f43f5e" opacity="0.4" />
        </svg>

        {/* Live Online Ping Badge */}
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
        </span>
      </div>
    </div>
  );
};

export const AICompanion: React.FC<AICompanionProps> = ({
  currentStep,
  stepIndex,
  totalSteps,
  isQuizActive,
  isAllDone,
  pathName,
  onOpenAIChat,
  position = 'floating',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Dynamic tip lookup
  const tipData = currentStep ? STEP_TIPS[currentStep.id] : null;

  const currentSpeech = isQuizActive
    ? 'Chào bạn! Hãy trả lời 4 câu hỏi nhanh, tôi sẽ tư vấn mô hình thuế chính xác và an toàn nhất cho bạn nhé!'
    : isAllDone
    ? 'Chúc mừng bạn! Bạn đã hoàn thành 100% các bước hồ sơ theo chuẩn quy định mới 2026!'
    : tipData?.speech || (currentStep ? currentStep.summary : 'Đang đồng hành cùng bạn thực hiện từng bước đăng ký.');

  const currentTip = tipData?.tip || (currentStep?.warnings?.[0] ? `Lưu ý: ${currentStep.warnings[0]}` : null);

  // Auto-expand speech bubble when step changes
  useEffect(() => {
    setIsExpanded(true);
  }, [currentStep?.id, isQuizActive, isAllDone]);

  // If inline position (used in sidebar rail)
  if (position === 'inline') {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-4 sm:p-5 border border-emerald-500/30 shadow-md relative overflow-hidden space-y-3.5">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          <AIMascotAvatar size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-white">
                Trợ lý AI TaxHKD
              </span>
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Sparkles className="w-2.5 h-2.5" />
                Live 2026
              </span>
            </div>
            <div className="text-[11px] text-emerald-300/90 font-medium truncate mt-0.5">
              {isQuizActive ? 'Đang tư vấn chọn mô hình' : `Đồng hành: ${pathName}`}
            </div>
          </div>
        </div>

        {/* Speech Bubble */}
        <div className="relative z-10 bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-xs text-emerald-50 leading-relaxed font-normal">
          <p>{currentSpeech}</p>
          {currentTip && (
            <p className="mt-2 pt-2 border-t border-white/10 text-[11px] text-emerald-300 font-medium">
              💡 {currentTip}
            </p>
          )}
        </div>

        {/* Action Button */}
        {onOpenAIChat && currentStep && !isQuizActive && (
          <button
            type="button"
            onClick={() => onOpenAIChat(currentStep.aiPrompt)}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer group"
          >
            <Bot className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Hỏi AI về bước này</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    );
  }

  // Floating companion (Fixed at bottom right)
  return (
    <aside
      aria-label="Trợ lý AI đồng hành"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end pointer-events-none"
    >
      <div className="pointer-events-auto max-w-[340px] sm:max-w-[380px] w-full flex flex-col items-end space-y-2">
        {/* Expanded Speech Dialog Box */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-4 sm:p-4.5 space-y-3 relative overflow-hidden ring-1 ring-slate-900/5"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 leading-tight">
                      Trợ lý AI TaxHKD
                    </h5>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {isQuizActive
                        ? 'Đang hỗ trợ bạn chọn mô hình'
                        : `Bước ${stepIndex + 1}/${totalSteps} · ${pathName}`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                  title="Thu nhỏ trợ lý"
                  aria-label="Thu nhỏ trợ lý AI"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Speech Text */}
              <div className="text-xs text-slate-700 leading-relaxed font-normal space-y-2">
                <p className="font-medium text-slate-800">
                  {currentSpeech}
                </p>
                {currentTip && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-900 font-medium leading-relaxed">
                    💡 <strong className="font-bold text-emerald-950">Mẹo nhanh:</strong> {currentTip}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {onOpenAIChat && (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep) {
                        onOpenAIChat(currentStep.aiPrompt);
                      } else {
                        onOpenAIChat('Tư vấn cho tôi các bước đăng ký Hộ kinh doanh hoặc cá nhân kinh doanh mới nhất năm 2026');
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer group"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Hỏi AI chi tiết</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Avatar Trigger Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded((prev) => !prev)}
          className="relative inline-flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-white border border-slate-200/90 shadow-xl hover:shadow-2xl transition-all cursor-pointer group ring-2 ring-emerald-500/20"
          aria-label="Bật/tắt trợ lý AI đồng hành"
        >
          <AIMascotAvatar size={42} />

          <div className="hidden sm:flex flex-col text-left pr-2">
            <span className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
              <span>Trợ lý AI</span>
              <Sparkles className="w-3 h-3 text-emerald-600" />
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {isExpanded ? 'Bấm để thu nhỏ' : 'Đang theo dõi bước'}
            </span>
          </div>

          <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-700 text-slate-500 flex items-center justify-center transition-colors mr-1">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </motion.button>
      </div>
    </aside>
  );
};
