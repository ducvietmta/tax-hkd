import { useState, useEffect } from 'react';
import RegistrationWizard from './RegistrationWizard';
import { RegistrationConfirmModal } from '../../components/RegistrationConfirmModal';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onOpenAIChat?: (query: string) => void;
  onOpenConsultation?: () => void;
}

export default function TaxRegistrationPage(props: Props) {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [pendingKind, setPendingKind] = useState<'household' | 'individual' | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmedKindTrigger, setConfirmedKindTrigger] = useState<{
    kind: 'household' | 'individual';
    key: number;
  } | null>(null);

  const getUnlockedKinds = (): Set<string> => {
    const set = new Set<string>();
    if (user?.role === 'admin' || user?.role === 'vip') {
      set.add('household');
      set.add('individual');
    }
    if (user?.unlockedGuides) {
      for (const g of user.unlockedGuides) set.add(g);
    }
    // Entitlements come from the server session or a confirmed purchase only.
    // Old local unlock caches may contain purchases the server never accepted.
    return set;
  };

  // Nếu người dùng vừa đăng nhập sau khi đã chọn 1 hình thức
  useEffect(() => {
    if (isAuthenticated && pendingKind && !isConfirmOpen) {
      const unlocked = getUnlockedKinds();
      if (unlocked.has(pendingKind)) {
        setConfirmedKindTrigger({ kind: pendingKind, key: Date.now() });
        setPendingKind(null);
      } else {
        setIsConfirmOpen(true);
      }
    }
  }, [isAuthenticated, user?.phone, user?.uid]);

  const handleBeforeSelectKind = (kind: 'household' | 'individual'): boolean => {
    if (kind === 'household') {
      return false; // Tính năng đăng ký hộ kinh doanh tạm thời khoá, sắp ra mắt
    }
    if (!isAuthenticated) {
      setPendingKind(kind);
      openAuthModal();
      return false;
    }
    const unlocked = getUnlockedKinds();
    if (unlocked.has(kind)) {
      return true; // Đã mua trước đó cho tài khoản này -> miễn phí, đi tiếp ngay!
    }
    // Chưa mua -> bật modal xác nhận trừ 10 lượt
    setPendingKind(kind);
    setIsConfirmOpen(true);
    return false;
  };

  const handleConfirm = () => {
    if (pendingKind) {
      setConfirmedKindTrigger({ kind: pendingKind, key: Date.now() });
      setPendingKind(null);
    }
    setIsConfirmOpen(false);
  };

  const handleCancel = () => {
    setIsConfirmOpen(false);
    setPendingKind(null);
  };

  const handleRequestNewGuide = () => {
    setPendingKind(null);
    setIsConfirmOpen(false);
  };

  return (
    <>
      <RegistrationConfirmModal
        isOpen={isConfirmOpen && !!pendingKind}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        creditsCost={10}
        kind={pendingKind}
      />

      <RegistrationWizard
        {...props}
        onBeforeSelectKind={handleBeforeSelectKind}
        confirmedKindTrigger={confirmedKindTrigger}
        onRequestNewGuide={handleRequestNewGuide}
      />
    </>
  );
}
