import React, { createContext, useContext, useState, useEffect } from 'react';
import { CloudflareApi } from '../services/api';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export interface UserAccount {
  phone: string;
  name?: string;
  credits: number;
  registeredAt: string;
  transactions?: {
    id: string;
    amount: number;
    credits: number;
    date: string;
    status: 'completed' | 'pending';
  }[];
}

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  loginUserDirect: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  consumeCredit: () => boolean; // Deducts 1 credit, returns true if allowed, false if not
  addCredits: (credits: number, amount: number) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openDepositModal: () => void;
  closeDepositModal: () => void;
  isAuthModalOpen: boolean;
  isDepositModalOpen: boolean;
  guestCredits: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [guestCredits, setGuestCredits] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('tax_guest_credits');
      return saved !== null ? parseInt(saved, 10) : 20;
    } catch {
      return 20;
    }
  });

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser?.phoneNumber) {
        setUser(null);
        return;
      }
      const phone = `0${firebaseUser.phoneNumber.slice(3)}`;
      const profile = await CloudflareApi.getUserProfile(phone);
      if (profile.success && profile.user && auth.currentUser?.uid === firebaseUser.uid) {
        setUser({
          phone: profile.user.phone,
          name: profile.user.name,
          credits: profile.user.credits,
          registeredAt: new Date().toISOString(),
          transactions: profile.user.transactions || [],
        });
      }
    });
  }, []);

  const saveSession = (newUser: UserAccount | null) => setUser(newUser);

  const loginUserDirect = async (): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser?.phoneNumber) return { success: false, error: 'Chưa xác thực số điện thoại.' };
    const result = await CloudflareApi.createSession();
    if (!result.success || !result.user) return { success: false, error: result.error || 'Không thể tạo phiên đăng nhập.' };
    saveSession({
      phone: result.user.phone,
      name: result.user.name,
      credits: result.user.credits,
      registeredAt: new Date().toISOString(),
      transactions: result.user.transactions || [],
    });
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const logout = () => {
    void signOut(auth);
    saveSession(null);
  };

  const consumeCredit = (): boolean => {
    if (!user) {
      if (guestCredits > 0) {
        const next = guestCredits - 1;
        setGuestCredits(next);
        try {
          sessionStorage.setItem('tax_guest_credits', String(next));
        } catch {}
        return true;
      }
      setIsAuthModalOpen(true);
      return false;
    }

    if (user.credits <= 0) {
      setIsDepositModalOpen(true);
      return false;
    }

    const updatedUser = {
      ...user,
      credits: user.credits - 1,
    };
    saveSession(updatedUser);

    // Bất đồng bộ đồng bộ với Cloudflare D1
    CloudflareApi.consumeCredit(user.phone).catch(() => {});
    return true;
  };

  const addCredits = (newCredits: number, amount: number) => {
    if (!user) return;
    const updatedUser: UserAccount = {
      ...user,
      credits: user.credits + newCredits,
      transactions: [
        ...(user.transactions || []),
        {
          id: `TXN-${Date.now().toString().slice(-6)}`,
          amount,
          credits: newCredits,
          date: new Date().toLocaleDateString('vi-VN'),
          status: 'completed',
        },
      ],
    };
    saveSession(updatedUser);

    // Đồng bộ vào Cloudflare D1
    CloudflareApi.depositCredits(user.phone, newCredits, amount).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loginUserDirect,
        logout,
        consumeCredit,
        addCredits,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        openDepositModal: () => setIsDepositModalOpen(true),
        closeDepositModal: () => setIsDepositModalOpen(false),
        isAuthModalOpen,
        isDepositModalOpen,
        guestCredits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
