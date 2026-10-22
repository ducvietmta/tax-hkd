import { useState, useEffect, lazy, Suspense } from 'react';
import { MobileNavigation, type MobileSection } from './components/MobileNavigation';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TechShowcase } from './components/TechShowcase';
import { TaxCalculatorInteractive } from './components/TaxCalculatorInteractive';
import { SmartCapabilities } from './components/SmartCapabilities';
import { LegalKnowledgeBase } from './components/LegalKnowledgeBase';
import { Footer } from './components/Footer';
import { AIChatModal } from './components/AIChatModal';
import { ConsultationModal } from './components/ConsultationModal';
import { AuthModal } from './components/AuthModal';
import { DepositModal } from './components/DepositModal';
import { AuroraBackground } from './components/AuroraBackground';
import { Reveal } from './components/Reveal';
import { HistoryModal } from './components/HistoryModal';
import { PolicyModal, type PolicyType } from './components/PolicyModal';
import { AuthProvider } from './context/AuthContext';
import { useHashRoute } from './features/registration/hooks/useHashRoute';
import type { ChatHistoryItem } from './services/api';

const RegistrationPage = lazy(() => import('./features/registration/TaxRegistrationPage'));

function MainApp() {
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState<PolicyType>('privacy');
  const [initialAIChatQuery, setInitialAIChatQuery] = useState('');
  const [resumeTurn, setResumeTurn] = useState<ChatHistoryItem | null>(null);
  const { isRegRoute, hash } = useHashRoute();
  const mobileSection: MobileSection = hash === '#tax-calculator' ? 'calculator' : hash === '#legal-base' ? 'library' : 'ask';

  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash;
      if (h === '#/chinh-sach-bao-mat' || h === '#/privacy') {
        setActivePolicy('privacy');
        setIsPolicyOpen(true);
        document.title = 'Chính sách bảo mật thông tin — TaxHKD (thuehkd.com)';
      } else if (h === '#/dieu-khoan-su-dung' || h === '#/terms') {
        setActivePolicy('terms');
        setIsPolicyOpen(true);
        document.title = 'Điều khoản dịch vụ & Quy chế hoạt động — TaxHKD';
      } else if (h === '#/chinh-sach-thanh-toan' || h === '#/payment') {
        setActivePolicy('payment');
        setIsPolicyOpen(true);
        document.title = 'Chính sách thanh toán — TaxHKD';
      } else if (h === '#/chinh-sach-hoan-tien' || h === '#/refund') {
        setActivePolicy('refund');
        setIsPolicyOpen(true);
        document.title = 'Chính sách hoàn tiền & Giải quyết khiếu nại — TaxHKD';
      } else if (isRegRoute) {
        document.title = 'Hướng dẫn Kê khai & Đăng ký Thuế Hộ kinh doanh (Mẫu 03-ĐKT) — TaxHKD';
      } else {
        document.title = 'TaxHKD — Trợ lý AI Tra cứu & Tính thuế Hộ kinh doanh, Cá nhân kinh doanh 2026';
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isRegRoute]);
  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [hash]);

  const handleOpenAIChat = (query?: string) => {
    setResumeTurn(null);
    setInitialAIChatQuery(query || '');
    setIsAIChatOpen(true);
  };

  const handleContinueChat = (turn: ChatHistoryItem) => {
    setInitialAIChatQuery('');
    setResumeTurn(turn);
    setIsAIChatOpen(true);
  };

  return (
    <div className="mobile-app-shell relative min-h-screen text-slate-900 selection:bg-emerald-600 selection:text-white flex flex-col justify-between">
      <AuroraBackground />

      <Header
        onOpenConsultation={() => setIsConsultationOpen(true)}
        onOpenAIChat={handleOpenAIChat}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <main className="flex-grow">
        {isRegRoute ? (
          <Suspense
            fallback={
              <div className="min-h-screen pt-32 flex items-center justify-center text-sm font-semibold text-slate-500">
                Đang mở hướng dẫn đăng ký thuế…
              </div>
            }
          >
            <RegistrationPage
              onOpenAIChat={handleOpenAIChat}
              onOpenConsultation={() => setIsConsultationOpen(true)}
            />
          </Suspense>
        ) : (
          <>
            <div className={`mobile-panel ${mobileSection === 'ask' ? 'mobile-panel-active' : ''}`}>
            <Hero
              onOpenConsultation={() => setIsConsultationOpen(true)}
              onOpenAIChat={handleOpenAIChat}
              onContinueAIChat={(message, response) =>
                handleContinueChat({
                  id: `hero-${Date.now()}`,
                  message,
                  response,
                  created_at: new Date().toISOString(),
                })
              }
            />
            </div>

            <div className="hidden md:block">
            <TechShowcase />

            <Reveal>
              <SmartCapabilities />
            </Reveal>
            </div>

            <div className={`mobile-panel ${mobileSection === 'calculator' ? 'mobile-panel-active' : ''}`}>
              <TaxCalculatorInteractive />
            </div>

            <div className={`mobile-panel ${mobileSection === 'library' ? 'mobile-panel-active' : ''}`}>
              <LegalKnowledgeBase onOpenAIChat={handleOpenAIChat} />
            </div>
          </>
        )}
      </main>

      <div className="hidden md:block">
        <Footer onOpenPolicy={(policy) => { setActivePolicy(policy); setIsPolicyOpen(true); }} />
      </div>
      <div className="md:hidden px-4 pb-5 text-center text-[11px] text-slate-500 space-y-1.5">
        <div className="flex items-center justify-center gap-2 flex-wrap text-emerald-800 font-semibold">
          <button type="button" onClick={() => { setActivePolicy('privacy'); setIsPolicyOpen(true); }} className="hover:underline">Bảo mật</button>
          <span>·</span>
          <button type="button" onClick={() => { setActivePolicy('terms'); setIsPolicyOpen(true); }} className="hover:underline">Điều khoản</button>
          <span>·</span>
          <button type="button" onClick={() => { setActivePolicy('payment'); setIsPolicyOpen(true); }} className="hover:underline">Thanh toán</button>
          <span>·</span>
          <button type="button" onClick={() => { setActivePolicy('refund'); setIsPolicyOpen(true); }} className="hover:underline">Hoàn tiền</button>
        </div>
        <p className="text-slate-400">thuehkd.com © 2026 · AI GovTech cho Hộ kinh doanh</p>
      </div>
      {!isAIChatOpen && !isHistoryOpen && !isConsultationOpen && (
        <MobileNavigation active={isRegRoute ? null : mobileSection} onHistory={() => setIsHistoryOpen(true)} />
      )}

      {/* Interactive AI Chat Modal */}
      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => {
          setIsAIChatOpen(false);
          setInitialAIChatQuery('');
          setResumeTurn(null);
        }}
        initialQuery={initialAIChatQuery}
        resumeTurn={resumeTurn}
      />

      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
      />

      {/* Auth & OTP Login Modal */}
      <AuthModal />

      {/* Deposit & Recharge Credits Modal */}
      <DepositModal />

      {/* History Modal for Questions & Answers */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectQuery={handleContinueChat}
      />

      {/* Legally Compliant Policy Modal (BCT) */}
      <PolicyModal
        isOpen={isPolicyOpen}
        onClose={() => {
          setIsPolicyOpen(false);
          const h = window.location.hash;
          if (['#/chinh-sach-bao-mat', '#/dieu-khoan-su-dung', '#/chinh-sach-thanh-toan', '#/chinh-sach-hoan-tien', '#/privacy', '#/terms', '#/payment', '#/refund'].includes(h)) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
        initialPolicy={activePolicy}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
