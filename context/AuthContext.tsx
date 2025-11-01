// context/AuthContext.tsx (TEMİZ SUPABASE SÜRÜMÜ)

import { supabase } from '@/supabase'; // Sadece Supabase client
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Firestore'daki 'users' koleksiyonu için tip
export interface UserProfile {
  id: string; // uuid
  display_name: string;
  email: string;
  photo_url: string;
}

interface IAuthContext {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  totalUnreadCount: number; // Şimdilik 0
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string, displayName: string) => Promise<any>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<IAuthContext>({
  user: null,
  profile: null,
  session: null,
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Supabase Auth dinleyicisi
  useEffect(() => {
    setLoading(true);
    
    // 1. Mevcut oturumu (session) al
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // 2. Oturum varsa, profili al
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 3. Auth durumundaki değişiklikleri (GİRİŞ, ÇIKIŞ) dinle
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // 4. Yeni bir giriş olduysa, profili al
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null); // Çıkış yapıldıysa profili temizle
          setLoading(false);
        }
      }
    );

    // Dinleyicileri temizle
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Profili çeken fonksiyon
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`*`)
        .eq('id', userId) 
        .single(); 

      if (error && status !== 406) {
        throw error;
      }
      if (data) {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Profil çekilirken hata:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Supabase login
  const login = async (email: string, pass: string) => {
    return supabase.auth.signInWithPassword({ email, password: pass });
  };

  // Supabase register
  const register = async (email: string, pass: string, displayName: string) => {
    // (Bu, register.tsx'teki manuel 'insert' yöntemine güvenir,
    // çünkü SQL trigger'ını kaldırmıştık)
    return supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          display_name: displayName,
          photo_url: `https://ui-avatars.com/api/?name=${displayName.replace(' ', '+')}&background=random`
        }
      }
    });
  };

  // Supabase logout
  const logout = async () => {
    await supabase.auth.signOut();
  };


  const value = {
    user,
    profile, 
    session,
    loading,
    totalUnreadCount: 0, // Sohbeti bağlayana kadar 0
    login,
    register,
    logout
  };

  // Yükleme devam ederken (auth durumu kontrol edilirken) hiçbir şey gösterme
  if (loading) {
    return null; 
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};