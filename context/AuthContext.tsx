// context/AuthContext.tsx (YENİ DOSYA)

import { auth } from '@/firebase'; // firebase.ts'ten auth objemizi alıyoruz
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Context'in tutacağı değerlerin arayüzü
interface IAuthContext {
  user: User | null; // Giriş yapan kullanıcı (veya null)
  loading: boolean;
  // Fonksiyonlar
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
}

// Auth Context'i oluştur
export const AuthContext = createContext<IAuthContext>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

// Bu, AuthContext'i kullanan bileşenler için bir yardımcı (custom hook)
export const useAuth = () => {
  return useContext(AuthContext);
};

// Bu, _layout.tsx'te uygulamayı saracak olan Provider bileşeni
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // useEffect ile Firebase'in auth durumunu dinliyoruz
  useEffect(() => {
    // onAuthStateChanged, kullanıcı giriş yaptığında, çıkış yaptığında
    // veya uygulama ilk açıldığında (AsyncStorage'dan veriyi okuduğunda)
    // otomatik olarak tetiklenir.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // Kullanıcıyı state'e ata
      setLoading(false); // Yükleme bitti
    });

    // Component unmount olduğunda (kapandığında) dinleyiciyi kapat
    return () => unsubscribe();
  }, []); // Sadece bir kez çalışır

  // Giriş Yap fonksiyonu
  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  // Kayıt Ol fonksiyonu
  const register = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  // Çıkış Yap fonksiyonu
  const logout = () => {
    return signOut(auth);
  };

  // Context'in 'value' prop'u ile tüm bu değerleri alt bileşenlere sun
  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  // Yükleme devam ederken (auth durumu kontrol edilirken) hiçbir şey gösterme
  // Bu, ekranın "titremesini" (login -> anasayfa -> login) engeller
  if (loading) {
    return null; // Veya bir yükleme ekranı (ActivityIndicator) gösterebilirsiniz
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};