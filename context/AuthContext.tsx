// context/AuthContext.tsx (GÜNCELLENMİŞ HALİ - Kullanıcı Profili (userProfile) eklendi)

import { auth, db } from '@/firebase';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'; // 1. YENİLİK: 'doc' eklendi
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// 2. YENİLİK: Firestore'daki 'users' koleksiyonu için tip
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

// Context'in tutacağı değerlerin arayüzü
interface IAuthContext {
  user: User | null; // Firebase Auth objesi
  userProfile: UserProfile | null; // 3. YENİLİK: Firestore'daki profil objesi
  loading: boolean;
  totalUnreadCount: number; 
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
}

// Auth Context'i oluştur
export const AuthContext = createContext<IAuthContext>({
  user: null,
  userProfile: null, // 4. YENİLİK: Varsayılan değer
  loading: true,
  totalUnreadCount: 0,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // 5. YENİLİK
  const [loading, setLoading] = useState(true);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Auth durumunu VE Kullanıcı Profilini VE Okunmamış Mesajları dinle
  useEffect(() => {
    let unsubscribeProfile: () => void = () => {};
    let unsubscribeChats: () => void = () => {};

    // Auth dinleyicisi
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser); 
      
      if (authUser) { // Kullanıcı giriş yaptıysa
        setLoading(true); // Profil ve sohbetler yüklenene kadar bekle

        // 6. YENİLİK: Kullanıcının profil belgesini dinle
        const userDocRef = doc(db, 'users', authUser.uid);
        unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data() as UserProfile); // Profil state'ini güncelle
          } else {
            setUserProfile(null); // (Kayıt olurken hata olduysa)
          }
        });

        // 7. YENİLİK: Okunmamış sohbetleri dinle (aynı)
        const chatsRef = collection(db, 'chats');
        const unreadQuery = query(
          chatsRef,
          where('users', 'array-contains', authUser.uid),
          where(`readStatus.${authUser.uid}`, '>', 0)
        );
        unsubscribeChats = onSnapshot(unreadQuery, (snapshot) => {
          let totalCount = 0;
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.readStatus && data.readStatus[authUser.uid]) {
              totalCount += data.readStatus[authUser.uid];
            }
          });
          setTotalUnreadCount(totalCount);
          setLoading(false); // Her şey yüklendi
        });

      } else { // Kullanıcı çıkış yaptıysa
        setUserProfile(null); // Profil state'ini temizle
        setTotalUnreadCount(0);
        setLoading(false);
      }
    });

    // Component kapandığında tüm dinleyicileri kapat
    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
      unsubscribeChats();
    };
  }, []); // Sadece bir kez çalışır

  // ... (login, register, logout fonksiyonları aynı) ...
  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  const register = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };
  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    userProfile, // 8. YENİLİK: 'userProfile'ı provider'a ekle
    loading,
    totalUnreadCount,
    login,
    register,
    logout
  };

  if (loading) {
    return null; 
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};