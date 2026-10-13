import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Phone, KeyRound, ArrowRight, ShieldCheck, Sparkles, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '../services/firebase';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, loginUserDirect } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    let timer: any;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Dọn dẹp reCAPTCHA khi đóng modal
  useEffect(() => {
    if (!isAuthModalOpen) {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
        recaptchaVerifierRef.current = null;
      }
      setStep('phone');
      setPhone('');
      setOtp('');
      setError('');
      setConfirmationResult(null);
      document.getElementById('firebase-recaptcha-wrapper')?.remove();
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // Chuẩn hóa định dạng SĐT quốc tế cho Firebase (+84...)
  const formatPhoneForFirebase = (raw: string): string => {
    const cleaned = raw.trim().replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.startsWith('+84')) return cleaned;
    if (cleaned.startsWith('84')) return `+${cleaned}`;
    if (cleaned.startsWith('0')) return `+84${cleaned.slice(1)}`;
    return `+84${cleaned}`;
  };

  const getCleanLocalPhone = (raw: string): string => {
    const cleaned = raw.trim().replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.startsWith('+84')) return `0${cleaned.slice(3)}`;
    if (cleaned.startsWith('84')) return `0${cleaned.slice(2)}`;
    return cleaned;
  };

  const createFreshRecaptchaVerifier = () => {
    // 1. Dọn dẹp verifier cũ nếu có
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {}
      recaptchaVerifierRef.current = null;
    }

    // 2. Tìm hoặc tạo mới dynamic container ngoài document body
    let container = document.getElementById('firebase-recaptcha-wrapper');
    if (container) {
      container.remove();
    }
    container = document.createElement('div');
    container.id = 'firebase-recaptcha-wrapper';
    document.body.appendChild(container);

    const verifier = new RecaptchaVerifier(auth, container, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        setError('reCAPTCHA đã hết hạn, vui lòng gửi lại mã.');
      },
    });

    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const localPhone = getCleanLocalPhone(phone);
    const phoneRegex = /^0[35789]\d{8}$/;
    if (!phoneRegex.test(localPhone)) {
      setError('Số điện thoại không đúng định dạng Việt Nam (10 số, ví dụ: 0988 123 456).');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Tạo mới reCAPTCHA Verifier sạch sẽ
      const appVerifier = createFreshRecaptchaVerifier();
      const formattedPhone = formatPhoneForFirebase(phone);

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      setCountdown(60);
    } catch (err: any) {
      console.error('Firebase Phone Auth error detail:', err);
      // Reset recaptcha verifier on error so subsequent attempts start fresh
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
        recaptchaVerifierRef.current = null;
      }
      const dynContainer = document.getElementById('firebase-recaptcha-wrapper');
      if (dynContainer) dynContainer.remove();
      
      let errorMsg = 'Chưa thể gửi SMS OTP từ Firebase.';
      if (err?.code === 'auth/unauthorized-domain') {
        errorMsg = 'Tên miền chưa được thêm vào Firebase. Vui lòng thêm "tax-hkd.pages.dev" vào mục Authorized Domains trên Firebase Console.';
      } else if (err?.code === 'auth/quota-exceeded') {
        errorMsg = 'Hạn mức gửi SMS của Firebase tạm thời vượt quá giới hạn.';
      } else if (err?.code === 'auth/invalid-phone-number') {
        errorMsg = 'Số điện thoại không đúng chuẩn quốc tế.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        errorMsg = 'Bạn chưa Bật (Enable) tính năng Phone trong Sign-in method trên Firebase Console.';
      } else if (err?.code === 'auth/captcha-check-failed') {
        errorMsg = 'Kiểm tra reCAPTCHA thất bại. Vui lòng thử lại.';
      } else if (err?.code === 'auth/billing-not-enabled') {
        errorMsg = 'Google Cloud Billing của dự án chưa hoạt động để gửi SMS. Hãy kiểm tra phương thức thanh toán trong tài khoản Billing đã liên kết với tax-hkd (auth/billing-not-enabled).';
      } else if (err?.message) {
        errorMsg = `${err.message} (${err.code || 'error'})`;
      }

      setError(errorMsg);

    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!confirmationResult) {
        setError('Vui lòng yêu cầu gửi mã OTP trước.');
        return;
      }
      await confirmationResult.confirm(otp.trim());
      const res = await loginUserDirect();
      if (res.success) closeAuthModal();
      else setError(res.error || 'Đăng nhập thất bại.');
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      if (err?.code === 'auth/invalid-verification-code') {
        setError('Mã OTP không chính xác. Vui lòng kiểm tra lại tin nhắn SMS.');
      } else if (err?.code === 'auth/code-expired') {
        setError('Mã OTP đã hết hạn, vui lòng gửi lại mã mới.');
      } else {
        setError(err.message || 'Xác thực OTP thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setIsLoading(true);

    try {
      const appVerifier = createFreshRecaptchaVerifier();
      const formattedPhone = formatPhoneForFirebase(phone);
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setCountdown(60);
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi lại mã SMS. Vui lòng thử lại.');
      setConfirmationResult(null);
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch {}
        recaptchaVerifierRef.current = null;
      }
      document.getElementById('firebase-recaptcha-wrapper')?.remove();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-3">
              {step === 'phone' ? <Phone className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
            </div>
            <h3 className="text-[22px] font-extrabold text-slate-900 tracking-tight">
              {step === 'phone' ? 'Đăng nhập / Đăng ký' : 'Xác thực mã OTP'}
            </h3>
            <p className="mt-1 text-[13px] sm:text-[14px] text-slate-500">
              {step === 'phone'
                ? 'Nhận ngay 3 lượt hỏi AI tư vấn thuế miễn phí khi xác thực SĐT'
                : `Mã xác thực SMS đã được gửi tới ${phone}`}
            </p>
          </div>

          {/* Reward Badge */}
          {step === 'phone' && (
            <div className="mb-6 flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-[12px] font-medium leading-relaxed">
                Xác thực số điện thoại an toàn qua <strong className="font-extrabold text-emerald-700">Firebase Google Auth</strong>, bảo mật tuyệt đối.
              </div>
            </div>
          )}

          {/* Error notice */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-[13px] text-rose-700 font-medium flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Step 1: Input Phone Form */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="auth-phone-input" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  Số điện thoại di động
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-[14px] font-bold text-slate-400">
                    +84
                  </span>
                  <input
                    id="auth-phone-input"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0988 123 456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-14 pr-4 py-3 text-[15px] text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-[14px] py-3.5 px-5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Đang gửi mã SMS...</span>
                  </>
                ) : (
                  <>
                    <span>Nhận mã OTP qua SMS</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP Form */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="auth-otp-input" className="text-[13px] font-bold text-slate-700">
                    Nhập mã 6 chữ số từ SMS
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setConfirmationResult(null); }}
                    className="text-[12px] font-semibold text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                  >
                    Đổi số điện thoại
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" aria-hidden="true" />
                  <input
                    id="auth-otp-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Nhập 6 số trong SMS"
                    className="w-full tracking-widest text-center bg-slate-50 border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-[18px] text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                  />
                </div>

              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-[14px] py-3.5 px-5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Xác nhận & Bắt đầu</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={countdown > 0}
                  onClick={handleResend}
                  className={`text-[12px] font-semibold ${
                    countdown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-emerald-600 hover:underline'
                  }`}
                >
                  {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Gửi lại mã SMS'}
                </button>
              </div>
            </form>
          )}

          {/* Privacy Note */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Xác thực bởi Google Firebase Auth & Bảo mật theo chuẩn eTax.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

