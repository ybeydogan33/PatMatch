// context/AuthContext.tsx — GÜNCELLENMİŞ (Supabase + refreshProfile destekli)

import { supabase } from '@/supabase';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Firestore'daki 'users' koleksiyonu için tip
export interface UserProfile {
  id: string; // uuid
  display_name: string;
  email: string;
  photo_url: string;
  city?: string; // ✅ city alanı da eklendi (isteğe bağlı)
}

interface IAuthContext {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  totalUnreadCount: number;
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string, displayName: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile?: () => Promise<void>; // ✅ eklendi
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
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Profil verisini Supabase'den çeken fonksiyon
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && status !== 406) throw error;
      if (data) setProfile(data as UserProfile);
    } catch (error) {
      console.error('Profil çekilirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 refreshProfile — Dışarıdan manuel çağrılabilir versiyonu
  const refreshProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      if (data) setProfile(data as UserProfile);
    } catch (error) {
      console.error('Profil yenileme hatası:', error);
    }
  };

  // 🔹 Supabase Auth dinleyicisi
  useEffect(() => {
    setLoading(true);

    // 1️⃣ Mevcut oturumu al
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2️⃣ Auth durum değişimlerini dinle
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Cleanup
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 🔹 Auth işlemleri
  const login = async (email: string, pass: string) => {
    return supabase.auth.signInWithPassword({ email, password: pass });
  };

  const register = async (email: string, pass: string, displayName: string) => {
    return supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          display_name: displayName,
          photo_url: `https://ui-avatars.com/api/?name=${displayName.replace(' ', '+')}&background=random`,
        },
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // 🔹 Context değerleri
  const value = {
    user,
    profile,
    session,
    loading,
    totalUnreadCount: 0,
    login,
    register,
    logout,
    refreshProfile, // ✅ export edildi
  };

  if (loading) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
