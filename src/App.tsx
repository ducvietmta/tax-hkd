import { useState, useEffect, lazy, Suspense, type ReactNode } from 'react';
import { MobileNavigation, type MobileSection } from './components/MobileNavigation';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TechShowcase } from './components/TechShowcase';
import { TaxCalculatorInteractive } from './components/TaxCalculatorInteractive';
import { SmartCapabilities } from './components/SmartCapabilities';
import { LegalKnowledgeBase } from './components/LegalKnowledgeBase';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { DepositModal } from './components/DepositModal';
import { AuroraBackground } from './components/AuroraBackground';
import { Reveal } from './components/Reveal';
import websitePolicies from '../shared/websitePolicies.json';
import type { PolicyType } from './components/PolicyModal';
import { AuthProvider } from './context/AuthContext';
import { useHashRoute } from './features/registration/hooks/useHashRoute';
import type { ChatHistoryItem } from './services/api';

const RegistrationPage = lazy(() => import('./features/registration/TaxRegistrationPage'));
const AIChatModal = lazy(() => import('./components/AIChatModal').then(m => ({ default: m.AIChatModal })));
const ConsultationModal = lazy(() => import('./components/ConsultationModal').then(m => ({ default: m.ConsultationModal })));
const HistoryModal = lazy(() => import('./components/HistoryModal').then(m => ({ default: m.HistoryModal })));
const PolicyModal = lazy(() => import('./components/PolicyModal').then(m => ({ default: m.PolicyModal })));

// Load on first use, then retain the mounted component and its conversation state.
function OnDemand({ active, children }: { active: boolean; children: ReactNode }) {
  const [visited, setVisited] = useState(active);
  useEffect(() => { if (active) setVisited(true); }, [active]);
  return active || visited ? <Suspense fallback={active ? <div role="status" className="fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm text-white shadow-lg">Đang mở…</div> : null}>{children}</Suspense> : null;
}

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
      const policy = websitePolicies.policies.find(p=>h==='#/'+p.slug||h==='#/'+p.id);
      if (policy) {
        setActivePolicy(policy.id as PolicyType);
        setIsPolicyOpen(true);
        document.title = policy.title + ' — TAX-HKD';
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
      <OnDemand active={isAIChatOpen}><AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => {
          setIsAIChatOpen(false);
          setInitialAIChatQuery('');
          setResumeTurn(null);
        }}
        initialQuery={initialAIChatQuery}
        resumeTurn={resumeTurn}
      /></OnDemand>

      {/* Consultation Modal */}
      <OnDemand active={isConsultationOpen}><ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
      /></OnDemand>

      {/* Auth & OTP Login Modal */}
      <AuthModal />

      {/* Deposit & Recharge Credits Modal */}
      <DepositModal />

      {/* History Modal for Questions & Answers */}
      <OnDemand active={isHistoryOpen}><HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectQuery={handleContinueChat}
      /></OnDemand>

      {/* Legally Compliant Policy Modal (BCT) */}
      <OnDemand active={isPolicyOpen}><PolicyModal
        isOpen={isPolicyOpen}
        onClose={() => {
          setIsPolicyOpen(false);
          const h = window.location.hash;
          if (websitePolicies.policies.some(p=>h==='#/'+p.slug||h==='#/'+p.id)) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
        initialPolicy={activePolicy}
      /></OnDemand>
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
