import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAAhaEd907jtHHCVJRUrJQ_6HuaNwC8ZnA",
  authDomain: "tax-hkd-7a2bb.firebaseapp.com",
  projectId: "tax-hkd-7a2bb",
  storageBucket: "tax-hkd-7a2bb.firebasestorage.app",
  messagingSenderId: "429004919774",
  appId: "1:429004919774:web:0b95ff179eff1f8be5c34f",
  measurementId: "G-VXZWX5VQJS",
};

// Khởi tạo Firebase App chỉ để phục vụ Phone OTP SMS
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Khởi tạo Firebase Auth (chỉ dùng xác thực số điện thoại)
export const auth = getAuth(app);
auth.languageCode = 'vi';

export {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
};

export type { FirebaseUser, ConfirmationResult };
