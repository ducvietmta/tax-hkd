import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, Menu, X, Calculator, Search, Store, Sparkles, User, Zap, LogOut, PlusCircle, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenConsultation: () => void;
  onOpenAIChat: (query?: string) => void;
  onOpenHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenConsultation, onOpenAIChat, onOpenHistory }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, openAuthModal, openDepositModal, logout } = useAuth();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3 shadow-sm'
          : 'bg-white/80 backdrop-blur-sm border-b border-slate-100 py-4'
      }`}
    >
      <motion.div
        style={{ scaleX: progress }}
        className="absolute bottom-0 left-0 right-0 h-[2px] origin-left bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500"
      />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[19px] tracking-tight text-slate-900">
                Tax<span className="text-emerald-600">HKD</span>
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Hộ & Cá nhân KD
              </span>
            </div>
          </div>
        </a>

        {/* Minimal Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-[14px] font-semibold text-slate-600">
          <a
            href="#ai-assistant"
            className="hover:text-emerald-600 transition-colors flex items-center gap-1"
          >
            <Search className="w-4 h-4 text-emerald-600" />
            <span>Tra cứu AI</span>
          </a>
          <a
            href="#tax-calculator"
            className="hover:text-emerald-600 transition-colors flex items-center gap-1"
          >
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>Tính thuế nhanh</span>
          </a>
          <a
            href="#risk-audit"
            className="hover:text-emerald-600 transition-colors"
          >
            <span>Rà soát dòng tiền</span>
          </a>
          <a
            href="#legal-base"
            className="hover:text-emerald-600 transition-colors"
          >
            <span>Thư viện luật</span>
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {/* User Credits & Auth status */}
          {isAuthenticated && user ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                {/* History button shortcut */}
                {onOpenHistory && (
                  <button
                    onClick={onOpenHistory}
                    className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-[12px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs"
                    title="Xem lịch sử câu hỏi"
                  >
                    <History className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden lg:inline">Lịch sử</span>
                  </button>
                )}

                {/* Credit balance badge */}
                <button
                  onClick={openDepositModal}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 text-emerald-800 text-[12px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{user.credits} lượt hỏi</span>
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                </button>

                {/* Account button */}
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[12px] font-bold px-3 py-1.5 rounded-xl transition-all max-w-[140px]"
                >
                  <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="truncate">{user.name || user.email?.split('@')[0] || user.phone || 'Tài khoản'}</span>
                </button>
              </div>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 text-[13px] animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="pb-2.5 mb-2 border-b border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">Tài khoản</div>
                    <div className="font-bold text-slate-800 truncate">{user.email || user.phone}</div>
                    <div className="text-[12px] text-emerald-700 font-semibold mt-0.5">
                      Số dư: {user.credits} lượt hỏi AI
                    </div>
                  </div>

                  {onOpenHistory && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenHistory();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold transition-colors"
                    >
                      <History className="w-4 h-4 text-emerald-600" />
                      <span>Lịch sử câu hỏi & tư vấn</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      openDepositModal();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 font-bold transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Nạp thêm lượt hỏi</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[13px] font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đăng nhập (Nhận 3 lượt)</span>
            </button>
          )}

          <button
            onClick={() => onOpenAIChat()}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-bold px-4 py-2 rounded-xl transition-all"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Hỏi AI Thuế</span>
          </button>

          <button
            onClick={onOpenConsultation}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
          >
            <span>Tư vấn 1-1</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-5 py-4 space-y-3 shadow-lg">
          {/* User Info on Mobile */}
          {isAuthenticated && user ? (
            <div className="space-y-2">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{user.phone}</div>
                  <div className="text-xs text-emerald-700 font-bold">Còn lại: {user.credits} lượt hỏi</div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openDepositModal();
                  }}
                  className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                >
                  Nạp thêm
                </button>
              </div>
              {onOpenHistory && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenHistory();
                  }}
                  className="w-full py-2 bg-white text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <History className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lịch sử câu hỏi & tư vấn</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openAuthModal();
              }}
              className="w-full py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Đăng nhập (Tặng 3 lượt hỏi)</span>
            </button>
          )}

          <a
            href="#ai-assistant"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-800 py-1"
          >
            Tra cứu thuế AI
          </a>
          <a
            href="#tax-calculator"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-800 py-1"
          >
            Tính thuế nhanh
          </a>
          <a
            href="#risk-audit"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-800 py-1"
          >
            Rà soát dòng tiền
          </a>
          <a
            href="#legal-base"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-800 py-1"
          >
            Thư viện luật 2026
          </a>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAIChat();
              }}
              className="w-full py-2 bg-slate-100 text-slate-800 font-bold rounded-xl text-sm"
            >
              Hỏi AI Thuế
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConsultation();
              }}
              className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm"
            >
              Tư vấn 1-1
            </button>
            {isAuthenticated && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full py-2 text-rose-600 text-xs font-semibold"
              >
                Đăng xuất tài khoản
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
