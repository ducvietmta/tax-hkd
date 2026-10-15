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
  syncCredits: (newCredits: number) => void;
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

  // Lắng nghe trạng thái đăng nhập Firebase Phone Auth & đồng bộ với Cloudflare D1.
  // Server là nguồn duy nhất cho role/credits — client không tự suy luận VIP.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.phoneNumber) {
        const localPhone = cleanPhoneForDisplay(fbUser.phoneNumber);

        // Tạo/lấy session người dùng từ Cloudflare D1 Backend
        try {
          const sessionRes = await CloudflareApi.createSession();
          if (sessionRes.success && sessionRes.user) {
            setUser({
              uid: fbUser.uid,
              phone: localPhone,
              name: sessionRes.user.name || `Khách hàng ${localPhone.slice(-4)}`,
              credits: sessionRes.user.credits ?? 3,
              role: (sessionRes.user.role as any) || 'user',
              registeredAt: new Date().toISOString(),
            });
            return;
          }
        } catch (err) {
          console.warn('Lỗi kết nối Cloudflare D1 session:', err);
        }

        // Fallback an toàn khi chưa lấy được session: role user thường, 0 lượt
        // để không vô tình cấp quyền VIP phía client.
        setUser({
          uid: fbUser.uid,
          phone: localPhone,
          name: `Khách hàng ${localPhone.slice(-4)}`,
          credits: 0,
          role: 'user',
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
      if (!fbUser.phoneNumber) {
        return { success: false, error: 'Tài khoản chưa có số điện thoại xác thực.' };
      }
      const phone = cleanPhoneForDisplay(fbUser.phoneNumber);

      // 1. Phản hồi giao diện ngay với quyền thường; server sẽ trả role/credits chuẩn.
      setUser({
        uid: fbUser.uid,
        phone,
        name: fbUser.displayName || `Khách hàng ${phone.slice(-4)}`,
        credits: 0,
        role: 'user',
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
      setIsAuthModalOpen(true);
      return false;
    }

    if (user.credits <= 0) {
      setIsDepositModalOpen(true);
      return false;
    }

    // Trừ 1 lượt tạm thời trên UI; Cloudflare Worker backend sẽ trừ chính xác nguyên tử trong DB
    setUser((prev) => (prev ? { ...prev, credits: Math.max(0, prev.credits - 1) } : null));
    return true;
  };

  const syncCredits = (newCredits: number) => {
    setUser((prev) => (prev ? { ...prev, credits: Math.max(0, newCredits) } : null));
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
        syncCredits,
        refreshCredits,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        openDepositModal: () => setIsDepositModalOpen(true),
        closeDepositModal: () => setIsDepositModalOpen(false),
        isAuthModalOpen,
        isDepositModalOpen,
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
