import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Zap, ArrowRight, ShieldCheck,
  Copy, Download, ArrowLeft, Building2, CreditCard, RefreshCw,
  Lock, Clock, Phone, MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CloudflareApi } from '../services/api';

// Tạm khóa tính năng nạp lượt câu hỏi trong thời gian hoàn tất thủ tục thông báo website với Bộ Công Thương.
// Sau khi Bộ Công Thương xét duyệt xong, đổi thành false để mở lại thanh toán bình thường.
export const IS_PAYMENT_LOCKED = true;

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

// Cấu hình tài khoản MBBank nhận tiền liên kết SePay Live
const BANK_CONFIG = {
  bankId: 'MB',
  bankName: 'MBBank (Ngân hàng TMCP Quân đội)',
  accountNo: '9594180624',
  accountName: 'TRAN DUC VIET',
  pattern: 'SP-LIVE-TD295786',
};

export const DepositModal: React.FC = () => {
  const { isDepositModalOpen, closeDepositModal, user, refreshCredits } = useAuth();
  const [selectedPkg, setSelectedPkg] = useState<PricingPackage>(PACKAGES[1]);
  const [paymentStep, setPaymentStep] = useState<'select' | 'qr'>('select');
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const initialCreditsRef = useRef<number>(user?.credits ?? 0);

  const formatVND = (num: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  const transferPhone = user?.phone ? user.phone.replace(/\s+/g, '') : '0965999594';
  const transferContent = `${BANK_CONFIG.pattern} TAX ${transferPhone}`;

  // Link ảnh VietQR chuẩn Napas 247 tự động điền số tiền và nội dung
  const vietQrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-compact2.png?amount=${selectedPkg.price}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  // Ghi nhận số dư ban đầu khi chuyển sang bước quét QR
  useEffect(() => {
    if (paymentStep === 'qr') {
      initialCreditsRef.current = user?.credits ?? 0;
    }
  }, [paymentStep, user?.credits]);

  // Polling tự động kiểm tra biến động số dư SePay mỗi 2 giây
  useEffect(() => {
    let interval: any;
    if (isDepositModalOpen && paymentStep === 'qr' && !isSuccess && !IS_PAYMENT_LOCKED) {
      interval = setInterval(async () => {
        try {
          const res = await CloudflareApi.checkPaymentStatus(transferPhone);
          if (res.success && typeof res.credits === 'number') {
            if (res.credits > initialCreditsRef.current) {
              setIsSuccess(true);
              // Kích hoạt cập nhật số dư hiển thị
              await refreshCredits();
              setTimeout(() => {
                setIsSuccess(false);
                setPaymentStep('select');
                closeDepositModal();
              }, 2200);
            }
          }
        } catch {
          // Bỏ qua lỗi mạng chập chờn
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDepositModalOpen, paymentStep, isSuccess, transferPhone, refreshCredits, closeDepositModal]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleStartPayment = () => {
    setPaymentStep('qr');
  };

  if (!isDepositModalOpen) return null;

  if (IS_PAYMENT_LOCKED) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top border accent */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-500" />

          {/* Close Button */}
          <button
            onClick={closeDepositModal}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8 text-center space-y-5">
            {/* Lock Icon */}
            <div className="mx-auto w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-md">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Tạm dừng nạp phí · Đang thông báo Bộ Công Thương</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Tính năng Nạp lượt hỏi đang tạm đóng
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Để tuân thủ đầy đủ quy định của <strong>Nghị định 52/2013/NĐ-CP</strong> và <strong>Nghị định 85/2021/NĐ-CP</strong>, website đang trong quá trình thực hiện thủ tục thông báo website thương mại điện tử bán hàng với <strong>Bộ Công Thương</strong>.
              </p>
            </div>

            {/* Free Experience Note */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-left space-y-2 text-xs sm:text-sm text-emerald-950">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Trải nghiệm hoàn toàn miễn phí</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Trong thời gian này, bạn vẫn được sử dụng <strong>3 lượt hỏi AI miễn phí</strong> được tặng khi đăng nhập bằng số điện thoại để tra cứu và tính toán thuế.
              </p>
              {user && (
                <div className="pt-1 text-xs text-slate-600">
                  Tài khoản của bạn ({user.phone}) hiện có: <strong className="text-emerald-700 font-extrabold">{user.credits} lượt hỏi</strong>.
                </div>
              )}
            </div>

            {/* Need More Assistance Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs text-slate-600">
              <p className="leading-relaxed">
                Nếu bạn cần thêm lượt hỏi để tra cứu công việc kinh doanh gấp, vui lòng liên hệ Admin để được <strong>hỗ trợ cấp thêm lượt hỏi hoàn toàn miễn phí</strong>:
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <a
                  href="https://zalo.me/0965999594"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Nhắn Zalo: 0965.999.594</span>
                </a>
                <a
                  href="tel:0965999594"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Gọi hotline</span>
                </a>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={closeDepositModal}
                className="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                Đã hiểu và quay lại
              </button>
            </div>

            {/* Safe badge */}
            <div className="pt-1 text-[11px] text-slate-400">
              <span>Hệ thống thanh toán tự động sẽ mở lại ngay sau khi hoàn tất thủ tục Bộ Công Thương.</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500" />

        {/* Close Button */}
        <button
          onClick={closeDepositModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
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
                className="space-y-4"
              >
                {/* Back to package selection */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPaymentStep('select')}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-600 hover:text-emerald-600 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Đổi gói khác ({selectedPkg.name})</span>
                  </button>
                  <span className="text-[14px] font-extrabold text-emerald-700 font-mono">
                    {formatVND(selectedPkg.price)}
                  </span>
                </div>

                {/* Real-time Webhook Pulse Status Banner */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[12px] font-bold text-emerald-900">
                      Tự động kích hoạt trong 1-3 giây qua SePay MBBank
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    Auto-check
                  </span>
                </div>

                {/* Real VietQR Display */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 sm:p-5 bg-slate-50 border border-emerald-200 rounded-3xl">
                  {/* VietQR Image */}
                  <div className="shrink-0 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <img
                      src={vietQrUrl}
                      alt="Mã VietQR thanh toán MBBank"
                      className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-xl mx-auto"
                      loading="eager"
                    />
                    <div className="mt-1.5 text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Quét bằng mọi App Ngân hàng</span>
                    </div>
                  </div>

                  {/* Transfer Details Card */}
                  <div className="flex-1 w-full space-y-2 text-[13px]">
                    {/* Bank Name */}
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-[11px] text-slate-400 font-medium">Ngân hàng</div>
                          <div className="font-bold text-slate-900">{BANK_CONFIG.bankName}</div>
                        </div>
                      </div>
                    </div>

                    {/* Account Number */}
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-[11px] text-slate-400 font-medium">Số tài khoản</div>
                          <div className="font-mono font-extrabold text-slate-900 text-[15px] tracking-wide">
                            {BANK_CONFIG.accountNo}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_CONFIG.accountNo, 'stk')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[12px] font-bold flex items-center gap-1 transition-colors"
                      >
                        {copiedField === 'stk' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Account Name */}
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Chủ tài khoản</div>
                        <div className="font-bold text-slate-900">{BANK_CONFIG.accountName}</div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Số tiền thanh toán</div>
                        <div className="font-mono font-extrabold text-emerald-700 text-[15px]">
                          {formatVND(selectedPkg.price)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(String(selectedPkg.price), 'amount')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[12px] font-bold flex items-center gap-1 transition-colors"
                      >
                        {copiedField === 'amount' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-2.5 bg-amber-50/90 rounded-xl border border-amber-200 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-amber-800 font-bold">Nội dung chuyển khoản (bắt buộc)</div>
                        <div className="font-mono font-extrabold text-slate-900 text-[14px]">
                          {transferContent}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(transferContent, 'content')}
                        className="px-2.5 py-1 rounded-lg bg-amber-200/70 hover:bg-amber-200 text-amber-900 text-[12px] font-bold flex items-center gap-1 transition-colors"
                      >
                        {copiedField === 'content' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[12px] text-slate-600 leading-relaxed">
                  <strong className="text-slate-800 font-bold block mb-0.5">💡 Cách chuyển khoản:</strong>
                  Mở App Ngân hàng quét mã QR trên (thông tin và số tiền tự điền). Sau khi hoàn tất chuyển khoản, hệ thống SePay tự động phát hiện và cộng lượt hỏi ngay lập tức!
                </div>

                {/* Real-time Listening Banner */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <div>
                      <div className="text-[13px] font-bold text-emerald-950 flex items-center gap-2">
                        <span>Đang tự động kiểm tra giao dịch</span>
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        Khi chuyển khoản thành công, hệ thống tự động cộng lượt và đóng cửa sổ này.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Lưu ảnh QR & Đóng */}
                <div className="flex gap-3 pt-1">
                  <a
                    href={vietQrUrl}
                    download={`VietQR_TAX_${selectedPkg.id}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[13px] transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>Lưu ảnh mã VietQR</span>
                  </a>

                  <button
                    type="button"
                    onClick={closeDepositModal}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] transition-colors"
                  >
                    <span>Để sau / Đóng</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Safe badge */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Xác thực tự động bởi SePay Gateway · Bảo mật thông tin giao dịch.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
