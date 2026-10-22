import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Coins,
  ArrowRight,
  CheckCircle2,
  LogIn,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TAX_ONLINE_GIF } from '../features/registration/data/taxOnlineSteps';

interface RegistrationConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  creditsCost?: number;
  kind?: 'household' | 'individual' | null;
}

export const RegistrationConfirmModal: React.FC<RegistrationConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  creditsCost = 10,
  kind = null,
}) => {
  const { user, isAuthenticated, openAuthModal, openDepositModal, consumeCredits } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const currentCredits = user?.credits ?? 0;
  const hasEnoughCredits = isAuthenticated && currentCredits >= creditsCost;
  const guideName = kind === 'household' ? 'Hộ kinh doanh' : 'Cá nhân kinh doanh';
  const guideFullName = kind === 'household'
    ? 'Đăng ký thành lập Hộ kinh doanh'
    : 'Đăng ký Thuế Cá nhân kinh doanh';

  const handleAgree = async () => {
    setErrorMessage('');

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (currentCredits < creditsCost) {
      openDepositModal();
      return;
    }

    setIsProcessing(true);
    try {
      const note = `unlock_guide_${kind || 'general'}`;
      const res = await consumeCredits(creditsCost, note);
      if (res.success) {
        setIsProcessing(false);
        onConfirm();
      } else {
        setIsProcessing(false);
        setErrorMessage(res.error || 'Không thể trừ lượt hỏi. Vui lòng kiểm tra lại tài khoản.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Đã xảy ra lỗi khi xác nhận giao dịch.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 z-10"
        >
          {/* Top Banner Gradient */}
          <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          {/* Close Button */}
          <button
            onClick={onCancel}
            aria-label="Đóng popup"
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="p-6 sm:p-8">
            {/* Header with Icon and Badge */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                <FileText size={24} className="stroke-[2.2]" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <Sparkles size={12} className="text-emerald-500" />
                  <span>MỞ KHÓA HƯỚNG DẪN 2026</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  {guideFullName}
                </h2>
              </div>
            </div>

            <a href={TAX_ONLINE_GIF} target="_blank" rel="noreferrer" className="mb-5 block rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <strong className="block text-sm">▶ Xem GIF hướng dẫn đăng ký thuế online · 17 bước</strong>
              <span className="block text-xs mt-1">Xem ảnh hướng dẫn trước khi mở hồ sơ. Không trừ lượt hỏi khi xem GIF.</span>
            </a>
            {/* Core Question Highlight Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Coins size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-emerald-950 leading-snug">
                    Bạn có đồng ý trừ {creditsCost} lượt hỏi để mở khóa hướng dẫn {guideName} không?
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-800/90 mt-1.5 leading-relaxed">
                    <strong>Chỉ mua 1 lần cho tài khoản này</strong>. Sau khi mở khóa, các lần sau vào lại hoặc tạo lại hồ sơ {guideName} sẽ không bị trừ thêm lượt.
                  </p>
                </div>
              </div>
            </div>

            {/* Value checklist */}
            <div className="space-y-2.5 mb-6 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Trợ lý thông minh hướng dẫn từng bước theo Thông tư 90/2026 & NĐ 168/2025</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Tự động tra cứu và gợi ý 495 mã ngành kinh doanh VSIC 2025 chuẩn QĐ 36/2025</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Điền và xuất file in hoàn chỉnh <strong>.docx & .html</strong> sẵn sàng đi nộp</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Hướng dẫn đối soát và kê khai online trên Cổng Dịch vụ công Quốc gia</span>
              </div>
            </div>

            {/* Account Credits Status */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-6">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-600 font-medium">Tình trạng tài khoản:</span>
                {!isAuthenticated ? (
                  <span className="font-semibold text-amber-600">Chưa đăng nhập</span>
                ) : (
                  <span className="font-semibold text-slate-900">
                    SĐT: {user?.phone} · Còn <strong className="text-emerald-600">{currentCredits}</strong> lượt
                  </span>
                )}
              </div>

              {isAuthenticated && !hasEnoughCredits && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>
                    Bạn đang thiếu {creditsCost - currentCredits} lượt hỏi. Vui lòng nạp thêm để tiếp tục.
                  </span>
                </div>
              )}

              {errorMessage && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isProcessing}
                className="w-full sm:w-1/3 order-2 sm:order-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-sm transition-all text-center"
              >
                Hủy / Quay lại
              </button>

              <button
                type="button"
                onClick={handleAgree}
                disabled={isProcessing}
                className="w-full sm:w-2/3 order-1 sm:order-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang xử lý trừ lượt...</span>
                  </>
                ) : !isAuthenticated ? (
                  <>
                    <LogIn size={16} />
                    <span>Đăng nhập để tiếp tục</span>
                  </>
                ) : !hasEnoughCredits ? (
                  <>
                    <CreditCard size={16} />
                    <span>Nạp thêm lượt hỏi (+{creditsCost - currentCredits})</span>
                  </>
                ) : (
                  <>
                    <span>Đồng ý (-{creditsCost} lượt)</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {/* Privacy notice */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>Dữ liệu biểu mẫu lưu trữ an toàn trong phiên trình duyệt</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RegistrationConfirmModal;
