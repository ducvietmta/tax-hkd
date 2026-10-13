import {
  db,
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
} from './firebase';

export interface FirestoreUserProfile {
  uid: string;
  phone: string;
  name?: string;
  email?: string;
  credits: number;
  role: 'user' | 'vip' | 'admin';
  createdAt: any;
  updatedAt: any;
}

export interface FirestoreChatLog {
  id?: string;
  uid: string;
  phone: string;
  message: string;
  response: string;
  source?: string;
  citations?: string;
  createdAt: any;
}

export const FirestoreService = {
  // Lấy hoặc tạo mới profile người dùng theo SĐT và UID
  async getUserProfile(uid: string, phone: string, name?: string): Promise<FirestoreUserProfile> {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      return snap.data() as FirestoreUserProfile;
    }

    // Tài khoản mới được tặng 3 lượt hỏi, VIP được 1000 lượt
    const isVip = phone === '0943219594' || phone.includes('0943219594');
    const initialCredits = isVip ? 1000 : 3;

    const newProfile: FirestoreUserProfile = {
      uid,
      phone,
      name: name || (isVip ? 'Tài khoản VIP Quản trị' : `Khách hàng ${phone.slice(-4)}`),
      credits: initialCredits,
      role: isVip ? 'vip' : 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, newProfile);
    return newProfile;
  },

  // Trừ 1 credit khi hỏi AI
  async consumeCredit(uid: string): Promise<boolean> {
    const userDocRef = doc(db, 'users', uid);
    try {
      await updateDoc(userDocRef, {
        credits: increment(-1),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch {
      return false;
    }
  },

  // Nạp thêm credits
  async addCredits(uid: string, credits: number, amount: number): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      credits: increment(credits),
      updatedAt: serverTimestamp(),
    });

    // Lưu giao dịch
    await addDoc(collection(db, 'transactions'), {
      uid,
      amount,
      credits,
      status: 'completed',
      createdAt: serverTimestamp(),
    });
  },

  // Lưu lịch sử câu hỏi vào Firestore
  async saveChatLog(uid: string, phone: string, message: string, response: string, source?: string): Promise<void> {
    await addDoc(collection(db, 'chat_logs'), {
      uid,
      phone,
      message,
      response,
      source: source || 'Tax HKD AI Engine 2026',
      createdAt: serverTimestamp(),
    });
  },

  // Lấy lịch sử chat của user
  async getChatLogs(uid: string, maxItems: number = 30): Promise<FirestoreChatLog[]> {
    try {
      const q = query(
        collection(db, 'chat_logs'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(maxItems)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as FirestoreChatLog[];
    } catch {
      // Fallback nếu chưa tạo composite index trên Firestore
      const qFallback = query(
        collection(db, 'chat_logs'),
        where('uid', '==', uid),
        limit(maxItems)
      );
      const snapshotFallback = await getDocs(qFallback);
      return snapshotFallback.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as FirestoreChatLog[];
    }
  },

  // Xóa 1 log chat
  async deleteChatLog(logId: string): Promise<void> {
    await deleteDoc(doc(db, 'chat_logs', logId));
  },
};
