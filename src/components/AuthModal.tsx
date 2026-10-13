import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Phone, KeyRound, ArrowRight, ShieldCheck, Sparkles, RefreshCw,
  CheckCircle2, AlertCircle, Info, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '../services/firebase';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, loginWithVerifiedUser } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Đếm ngược thời gian gửi lại OTP
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Dọn dẹp reCAPTCHA khi đóng modal hoặc unmount
  useEffect(() => {
    if (!isAuthModalOpen) {
      cleanupRecaptcha();
      setStep('phone');
      setPhone('');
      setOtp('');
      setError('');
      setConfirmationResult(null);
    }
    return () => {
      cleanupRecaptcha();
    };
  }, [isAuthModalOpen]);

  const cleanupRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (err) {
        console.warn('Lỗi dọn dẹp verifier:', err);
      }
      recaptchaVerifierRef.current = null;
    }
    const container = document.getElementById('firebase-recaptcha-wrapper');
    if (container) {
      container.remove();
    }
  };

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

  // Tạo reCAPTCHA verifier mới trên DOM container độc lập
  const createFreshRecaptchaVerifier = () => {
    cleanupRecaptcha();

    const container = document.createElement('div');
    container.id = 'firebase-recaptcha-wrapper';
    document.body.appendChild(container);

    const verifier = new RecaptchaVerifier(auth, container, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA xác minh thành công
      },
      'expired-callback': () => {
        setError('Phiên reCAPTCHA đã hết hạn, vui lòng nhấn gửi lại mã.');
      },
    });

    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  // Thông báo lỗi thân thiện tiếng Việt theo mã lỗi Firebase Auth
  const mapFirebaseError = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code === 'auth/invalid-phone-number') {
      return 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng 10 chữ số (VD: 0943219594).';
    }
    if (code === 'auth/missing-phone-number') {
      return 'Vui lòng nhập số điện thoại.';
    }
    if (code === 'auth/quota-exceeded') {
      return 'Dự án đã sử dụng hết hạn mức SMS hôm nay. Mẹo: Hãy thêm số này vào "Phone numbers for testing" trong Firebase Console để đăng nhập miễn phí không giới hạn.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Phương thức Phone Auth chưa được bật trong Firebase Console (Vào Authentication > Sign-in method > Phone > Bật Enable).';
    }
    if (code === 'auth/unauthorized-domain') {
      return `Tên miền (${window.location.hostname}) chưa được thêm vào Authorized Domains trong Firebase Console.`;
    }
    if (code === 'auth/too-many-requests') {
      return 'Quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau vài phút hoặc dùng số thử nghiệm cấu hình sẵn.';
    }
    if (code === 'auth/captcha-check-failed') {
      return 'Xác thực reCAPTCHA không thành công. Vui lòng thử lại.';
    }
    if (code === 'auth/invalid-verification-code') {
      return 'Mã OTP không chính xác. Vui lòng kiểm tra lại tin nhắn SMS.';
    }
    if (code === 'auth/code-expired') {
      return 'Mã OTP đã hết hạn. Vui lòng nhấn "Gửi lại mã SMS".';
    }
    if (message.includes('Identity Platform') || code === 'auth/billing-not-enabled') {
      return 'Firebase yêu cầu kích hoạt Identity Platform / gói trả phí để gửi SMS quốc tế thật. Mẹo: Bạn có thể thêm số điện thoại này vào mục "Phone numbers for testing" trong Firebase Console để nhận mã tức thì!';
    }
    return message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  };

  // Bước 1: Gửi OTP qua Firebase
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const localPhone = getCleanLocalPhone(phone);
    const phoneRegex = /^0[35789]\d{8}$/;
    if (!phoneRegex.test(localPhone)) {
      setError('Số điện thoại không đúng định dạng Việt Nam (10 số, ví dụ: 0943 219 594).');
      return;
    }

    setIsLoading(true);

    try {
      const appVerifier = createFreshRecaptchaVerifier();
      const formattedPhone = formatPhoneForFirebase(phone);

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      setCountdown(60);
    } catch (err: any) {
      console.error('Firebase Phone Auth error:', err);
      cleanupRecaptcha();
      setError(mapFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 2: Xác minh mã OTP 6 số
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    if (!confirmationResult) {
      setError('Phiên xác thực đã hết hạn. Vui lòng nhấn gửi lại mã.');
      setStep('phone');
      return;
    }

    setIsLoading(true);

    try {
      const credential = await confirmationResult.confirm(cleanOtp);
      if (credential.user) {
        await loginWithVerifiedUser(credential.user);
        closeAuthModal();
      } else {
        setError('Không thể lấy thông tin tài khoản người dùng.');
      }
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      setError(mapFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isLoading) return;
    await handleSendOtp();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Accent Bar */}
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
            {/* Header Title */}
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-3">
                {step === 'phone' ? <Phone className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
              </div>
              <h3 className="text-[22px] font-extrabold text-slate-900 tracking-tight">
                {step === 'phone' ? 'Đăng nhập bằng Số điện thoại' : 'Xác thực mã OTP Firebase'}
              </h3>
              <p className="mt-1 text-[13px] sm:text-[14px] text-slate-500">
                {step === 'phone'
                  ? 'Mã OTP SMS sẽ được gửi trực tiếp qua Firebase Authentication'
                  : `Mã xác thực đã được gửi tới ${phone}`}
              </p>
            </div>

            {/* Benefit Banner */}
            {step === 'phone' && (
              <div className="mb-5 flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-[12px] font-medium leading-relaxed">
                  Xác thực trực tiếp bằng <strong className="font-extrabold text-emerald-700">Firebase Phone OTP</strong>. Tặng ngay 3 lượt hỏi AI tư vấn thuế, lưu trữ an toàn trên Cloud Firestore!
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-[13px] text-rose-700 font-medium flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="leading-snug">{error}</div>
              </motion.div>
            )}

            {/* Step 1: Input Phone */}
            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="auth-phone-input" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                    Số điện thoại di động
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5 text-slate-500 font-bold text-[14px] pointer-events-none">
                      <span className="text-[15px]">🇻🇳</span>
                      <span>+84</span>
                    </div>
                    <input
                      id="auth-phone-input"
                      type="tel"
                      required
                      autoFocus
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0943 219 594"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-20 pr-4 py-3 text-[15px] text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-[14px] py-3.5 px-5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-75 focus-visible:outline-none"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang gửi mã OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Gửi mã xác thực OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Testing Note Helper */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[12px] text-slate-500 flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    Nếu bạn đã cấu hình số điện thoại thử nghiệm trong Firebase Console (vd: <span className="font-semibold text-slate-700">+84943219594</span> với mã OTP kiểm tra), bạn có thể đăng nhập ngay mà không cần chờ SMS nhà mạng.
                  </div>
                </div>
              </form>
            )}

            {/* Step 2: Input OTP */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="auth-otp-input" className="text-[13px] font-bold text-slate-700">
                      Nhập mã 6 chữ số OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('phone');
                        setConfirmationResult(null);
                        setError('');
                      }}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Đổi số khác</span>
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      id="auth-otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      autoFocus
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="------"
                      className="w-full tracking-[0.4em] text-center bg-slate-50 border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-[20px] text-slate-900 font-extrabold focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
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
                      <span>Đang kiểm tra mã...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác nhận mã & Đăng nhập</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    disabled={countdown > 0 || isLoading}
                    onClick={handleResend}
                    className={`text-[12px] font-semibold transition-colors ${
                      countdown > 0 || isLoading
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-emerald-600 hover:underline'
                    }`}
                  >
                    {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Chưa nhận được mã? Gửi lại SMS'}
                  </button>
                </div>
              </form>
            )}

            {/* Privacy Footer */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Xác thực bởi Google Firebase Auth & đồng bộ Cloud Firestore.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
