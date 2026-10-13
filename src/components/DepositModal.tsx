import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, QrCode, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PricingPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  desc: string;
}

const PACKAGES: PricingPackage[] = [
  {
    id: 'starter',
    name: 'Gói Cơ Bản',
    credits: 10,
    price: 49000,
    originalPrice: 79000,
    desc: 'Phù hợp người bán mới cần tra cứu nhanh mức thuế và thuế suất.',
  },
  {
    id: 'pro',
    name: 'Gói Chuyên Nghiệp',
    credits: 30,
    price: 99000,
    originalPrice: 169000,
    popular: true,
    desc: 'Dành cho chủ shop TikTok/Shopee rà soát thường xuyên & tính hồ sơ.',
  },
  {
    id: 'unlimited',
    name: 'Gói Doanh Nhân',
    credits: 100,
    price: 249000,
    originalPrice: 450000,
    desc: 'Dành cho chuỗi cửa hàng, quản lý nhiều ngành nghề và dòng tiền lớn.',
  },
];

export const DepositModal: React.FC = () => {
  const { isDepositModalOpen, closeDepositModal, user, addCredits } = useAuth();
  const [selectedPkg, setSelectedPkg] = useState<PricingPackage>(PACKAGES[1]);
  const [paymentStep, setPaymentStep] = useState<'select' | 'qr'>('select');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isDepositModalOpen) return null;

  const formatVND = (num: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  const handleStartPayment = () => {
    setPaymentStep('qr');
  };

  const handleConfirmPaid = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      addCredits(selectedPkg.credits, selectedPkg.price);

      setTimeout(() => {
        setIsSuccess(false);
        setPaymentStep('select');
        closeDepositModal();
      }, 1600);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500" />

        {/* Close Button */}
        <button
          onClick={closeDepositModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-3">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-[22px] font-extrabold text-slate-900 tracking-tight">
              {paymentStep === 'select' ? 'Nạp thêm lượt hỏi AI' : 'Thanh toán chuyển khoản VietQR'}
            </h3>
            <p className="mt-1 text-[13px] sm:text-[14px] text-slate-500">
              {user
                ? `Số điện thoại: ${user.phone} • Hiện có: ${user.credits} lượt hỏi`
                : 'Nâng cấp lượt hỏi không giới hạn cùng trợ lý thuế'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {paymentStep === 'select' ? (
              <motion.div
                key="packages"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {/* Packages list */}
                <div className="space-y-3">
                  {PACKAGES.map((pkg) => {
                    const isSelected = selectedPkg.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkg(pkg)}
                        className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {pkg.popular && (
                          <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
                            Phổ biến nhất
                          </span>
                        )}

                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[15px] text-slate-900">{pkg.name}</span>
                              <span className="text-[12px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                +{pkg.credits} lượt hỏi
                              </span>
                            </div>
                            <p className="text-[12px] text-slate-500 mt-0.5">{pkg.desc}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[16px] font-extrabold text-slate-900 font-mono">
                            {formatVND(pkg.price)}
                          </div>
                          {pkg.originalPrice && (
                            <div className="text-[11px] text-slate-400 line-through font-mono">
                              {formatVND(pkg.originalPrice)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Continue button */}
                <button
                  type="button"
                  onClick={handleStartPayment}
                  className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-bold text-[15px] py-3.5 px-5 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <span>Thanh toán {formatVND(selectedPkg.price)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="qr"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 text-center"
              >
                {/* QR Code Box */}
                <div className="mx-auto max-w-xs p-5 bg-slate-50 border-2 border-dashed border-emerald-300 rounded-3xl">
                  {/* Simulated VietQR graphic */}
                  <div className="relative mx-auto w-48 h-48 bg-white rounded-2xl p-3 shadow-inner flex flex-col items-center justify-center border border-slate-200">
                    <QrCode className="w-36 h-36 text-slate-800" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shadow">
                        TAX
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-[13px] font-bold text-slate-800">
                    Quét mã qua app Ngân hàng / MoMo
                  </div>
                  <div className="text-[12px] text-emerald-700 font-bold mt-0.5">
                    Số tiền: {formatVND(selectedPkg.price)} (+{selectedPkg.credits} lượt)
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Nội dung CK: <strong className="text-slate-700 font-mono">TAX {user?.phone || '0988123456'}</strong>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentStep('select')}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-[13px] hover:bg-slate-50 transition-colors"
                  >
                    Chọn gói khác
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing || isSuccess}
                    onClick={handleConfirmPaid}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-[13px] py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                        <span>Đang xác nhận…</span>
                      </>
                    ) : isSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Thành công!</span>
                      </>
                    ) : (
                      <span>Đã chuyển khoản xong</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Safe badge */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Kích hoạt tự động ngay sau khi chuyển khoản. Hỗ trợ hoàn tiền nếu không hài lòng.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
