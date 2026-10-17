import { useState, lazy, Suspense } from 'react';
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
import { AuthProvider } from './context/AuthContext';
import { useHashRoute } from './features/registration/hooks/useHashRoute';
import type { ChatHistoryItem } from './services/api';

const RegistrationPage = lazy(() => import('./features/registration/RegistrationPage'));

function MainApp() {
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [initialAIChatQuery, setInitialAIChatQuery] = useState('');
  const [resumeTurn, setResumeTurn] = useState<ChatHistoryItem | null>(null);
  const { isRegRoute } = useHashRoute();

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
    <div className="relative min-h-screen text-slate-900 selection:bg-emerald-600 selection:text-white flex flex-col justify-between">
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
                Đang mở hướng dẫn đăng ký kinh doanh…
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

            <TechShowcase />

            <Reveal>
              <SmartCapabilities />
            </Reveal>

            <Reveal>
              <TaxCalculatorInteractive />
            </Reveal>

            <Reveal>
              <LegalKnowledgeBase onOpenAIChat={handleOpenAIChat} />
            </Reveal>
          </>
        )}
      </main>

      <Footer />

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
