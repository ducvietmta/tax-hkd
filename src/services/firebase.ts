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
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAAhaEd907jtHHCVJRUrJQ_6HuaNwC8ZnA",
  authDomain: "tax-hkd-7a2bb.firebaseapp.com",
  projectId: "tax-hkd-7a2bb",
  storageBucket: "tax-hkd-7a2bb.firebasestorage.app",
  messagingSenderId: "429004919774",
  appId: "1:429004919774:web:0b95ff179eff1f8be5c34f",
  measurementId: "G-VXZWX5VQJS",
};

// Khởi tạo Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Khởi tạo Firebase Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

auth.languageCode = 'vi';

export {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  increment,
};

export type { FirebaseUser, ConfirmationResult };
