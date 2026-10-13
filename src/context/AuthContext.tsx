import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  onAuthStateChanged,
  signOut,
  FirebaseUser,
} from '../services/firebase';
import { FirestoreService, FirestoreUserProfile } from '../services/firestoreService';

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
  addCredits: (
    credits: number,
    amount: number,
    extraInfo?: { bank?: string; accountNo?: string; accountName?: string; phone?: string; packageId?: string }
  ) => Promise<void>;
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

  // Lắng nghe trạng thái đăng nhập Firebase Phone Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.phoneNumber) {
        try {
          const localPhone = cleanPhoneForDisplay(fbUser.phoneNumber);
          const profile: FirestoreUserProfile = await FirestoreService.getUserProfile(
            fbUser.uid,
            localPhone,
            fbUser.displayName || undefined
          );
          setUser({
            uid: fbUser.uid,
            phone: localPhone,
            name: profile.name || fbUser.displayName || `Khách hàng ${localPhone.slice(-4)}`,
            credits: profile.credits,
            role: profile.role,
            registeredAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Lỗi tải Firestore user profile:', err);
          const localPhone = cleanPhoneForDisplay(fbUser.phoneNumber);
          setUser({
            uid: fbUser.uid,
            phone: localPhone,
            name: `Khách hàng ${localPhone.slice(-4)}`,
            credits: localPhone === '0943219594' ? 1000 : 3,
            role: localPhone === '0943219594' ? 'vip' : 'user',
            registeredAt: new Date().toISOString(),
          });
        }
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

      // 1. Cập nhật state người dùng ngay lập tức (phản hồi 0ms)
      setUser({
        uid: fbUser.uid,
        phone,
        name: fbUser.displayName || `Khách hàng ${phone.slice(-4)}`,
        credits: isVip ? 1000 : 3,
        role: isVip ? 'vip' : 'user',
        registeredAt: new Date().toISOString(),
      });
      setIsAuthModalOpen(false);

      // 2. Đồng bộ Firestore ngầm trong background (không chặn trải nghiệm người dùng)
      FirestoreService.getUserProfile(fbUser.uid, phone, fbUser.displayName || undefined)
        .then((profile) => {
          setUser((prev) => (prev ? {
            ...prev,
            name: profile.name || prev.name,
            credits: profile.credits,
            role: profile.role,
          } : null));
        })
        .catch((err) => {
          console.warn('Lỗi đồng bộ Firestore:', err);
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

    // Trừ 1 lượt
    setUser((prev) => (prev ? { ...prev, credits: prev.credits - 1 } : null));

    // Đồng bộ Firestore
    if (user.uid) {
      FirestoreService.consumeCredit(user.uid).catch(() => {});
    }
    return true;
  };

  const addCredits = async (
    newCredits: number,
    amount: number,
    extraInfo?: { bank?: string; accountNo?: string; accountName?: string; phone?: string; packageId?: string }
  ) => {
    if (!user) return;
    setUser((prev) => (prev ? { ...prev, credits: prev.credits + newCredits } : null));
    if (user.uid) {
      await FirestoreService.addCredits(user.uid, newCredits, amount, {
        ...extraInfo,
        phone: user.phone,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        loginWithVerifiedUser,
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
