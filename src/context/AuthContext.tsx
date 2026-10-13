import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  onAuthStateChanged,
  signOut,
  FirebaseUser,
} from '../services/firebase';
import { CloudflareApi } from '../services/api';

export interface UserAccount {
  uid: string;
  phone: string;
  email?: string;
  name?: string;
  credits: number;
  role: 'user' | 'vip' | 'admin';
  registeredAt: string;
}

interface AuthContextType {
  user: UserAccount | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  loginWithVerifiedUser: (fbUser: FirebaseUser) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  consumeCredit: () => boolean;
  refreshCredits: () => Promise<number | null>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openDepositModal: () => void;
  closeDepositModal: () => void;
  isAuthModalOpen: boolean;
  isDepositModalOpen: boolean;
  guestCredits: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const cleanPhoneForDisplay = (rawPhone: string): string => {
  const clean = rawPhone.trim().replace(/\s+/g, '').replace(/-/g, '');
  if (clean.startsWith('+84')) return `0${clean.slice(3)}`;
  if (clean.startsWith('84')) return `0${clean.slice(2)}`;
  return clean;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
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

  // Lắng nghe trạng thái đăng nhập Firebase Phone Auth & đồng bộ với Cloudflare D1
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.phoneNumber) {
        const localPhone = cleanPhoneForDisplay(fbUser.phoneNumber);
        const isVip = localPhone === '0943219594' || localPhone.includes('0943219594');

        // Tạo/lấy session người dùng từ Cloudflare D1 Backend
        try {
          const sessionRes = await CloudflareApi.createSession();
          if (sessionRes.success && sessionRes.user) {
            setUser({
              uid: fbUser.uid,
              phone: localPhone,
              name: sessionRes.user.name || `Khách hàng ${localPhone.slice(-4)}`,
              credits: sessionRes.user.credits ?? (isVip ? 1000 : 3),
              role: (sessionRes.user.role as any) || (isVip ? 'vip' : 'user'),
              registeredAt: new Date().toISOString(),
            });
            return;
          }
        } catch (err) {
          console.warn('Lỗi kết nối Cloudflare D1 session:', err);
        }

        // Fallback profile nếu chưa kết nối D1
        setUser({
          uid: fbUser.uid,
          phone: localPhone,
          name: isVip ? 'Tài khoản VIP Quản trị' : `Khách hàng ${localPhone.slice(-4)}`,
          credits: isVip ? 1000 : 3,
          role: isVip ? 'vip' : 'user',
          registeredAt: new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithVerifiedUser = async (fbUser: FirebaseUser): Promise<{ success: boolean; error?: string }> => {
    try {
      const phone = fbUser.phoneNumber ? cleanPhoneForDisplay(fbUser.phoneNumber) : '0943219594';
      const isVip = phone === '0943219594' || phone.includes('0943219594');

      // 1. Phản hồi giao diện ngay lập tức
      setUser({
        uid: fbUser.uid,
        phone,
        name: fbUser.displayName || `Khách hàng ${phone.slice(-4)}`,
        credits: isVip ? 1000 : 3,
        role: isVip ? 'vip' : 'user',
        registeredAt: new Date().toISOString(),
      });
      setIsAuthModalOpen(false);

      // 2. Đồng bộ ngầm với Cloudflare D1 backend
      CloudflareApi.createSession()
        .then((res) => {
          if (res.success && res.user) {
            setUser((prev) => (prev ? {
              ...prev,
              name: res.user?.name || prev.name,
              credits: res.user?.credits ?? prev.credits,
              role: (res.user?.role as any) || prev.role,
            } : null));
          }
        })
        .catch((err) => {
          console.warn('Lỗi đồng bộ Cloudflare D1:', err);
        });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi đăng nhập' };
    }
  };

  const logout = () => {
    void signOut(auth);
    setUser(null);
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

    // Trừ 1 lượt cục bộ
    setUser((prev) => (prev ? { ...prev, credits: prev.credits - 1 } : null));

    // Đồng bộ Cloudflare D1
    if (user.phone) {
      CloudflareApi.consumeCredit(user.phone).catch(() => {});
    }
    return true;
  };

  const refreshCredits = async (): Promise<number | null> => {
    if (!user?.phone) return null;
    const result = await CloudflareApi.createSession();
    if (!result.success || result.user?.phone !== user.phone || typeof result.user.credits !== 'number') return null;
    setUser((prev) => (prev?.phone === user.phone ? { ...prev, credits: result.user!.credits } : prev));
    return result.user.credits;
  };

  useEffect(() => {
    if (!user?.phone) return;
    const phone = user.phone;
    const syncWhenVisible = async () => {
      if (document.visibilityState !== 'visible') return;
      const result = await CloudflareApi.createSession();
      if (result.success && result.user?.phone === phone && typeof result.user.credits === 'number') {
        setUser((prev) => (prev?.phone === phone ? { ...prev, credits: result.user!.credits } : prev));
      }
    };
    window.addEventListener('focus', syncWhenVisible);
    document.addEventListener('visibilitychange', syncWhenVisible);
    return () => {
      window.removeEventListener('focus', syncWhenVisible);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, [user?.phone]);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        loginWithVerifiedUser,
        logout,
        consumeCredit,
        refreshCredits,
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
