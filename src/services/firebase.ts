import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB-3k_bKLb9OLAhZmauQDIkTaxmjJs-k0Q",
  authDomain: "tax-hkd.firebaseapp.com",
  projectId: "tax-hkd",
  storageBucket: "tax-hkd.firebasestorage.app",
  messagingSenderId: "142838463167",
  appId: "1:142838463167:web:c52215062d92cb79eb640a",
  measurementId: "G-8KCFTBGWK3",
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Language set to Vietnamese
auth.languageCode = 'vi';

export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
