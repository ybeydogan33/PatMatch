// app/_layout.tsx (DÜZELTİLMİŞ HALİ)

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PetsProvider } from '@/context/PetsContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';

// Bu bileşen, Context'lere erişmek için sarmalayıcıların *içinde* olmalı
function RootLayoutNav() {
  const { user } = useAuth(); // Auth durumunu al
  const segments = useSegments(); // Hangi sayfada olduğumuzu bilmek için (örn: ['login'])
  const router = useRouter(); // Yönlendirme yapmak için

  useEffect(() => {
    
    // 1. DÜZELTME: Artık (auth) grubu değil, direkt sayfa isimlerini kontrol ediyoruz
    const inAuthPages = segments.includes('login') || segments.includes('register');

    // 2. DÜZELTME: YÖNLENDİRME MANTIĞI
    
    // Kullanıcı giriş yapmamışsa (user null ise) VE
    // şu anda 'login' veya 'register' sayfalarında DEĞİLSE,
    // onu 'login' ekranına at.
    if (!user && !inAuthPages) {
      router.replace('/login');
    } 
    // Kullanıcı giriş yapmışsa (user var ise) VE
    // şu anda 'login' veya 'register' sayfasındaysa (veya ana dizindeyse)
    // onu ana sayfaya '(tabs)' at.
    else if (user && (inAuthPages || segments.length === 0)) {
      router.replace('/(tabs)');
    }
  }, [user, segments]); // user veya segment değiştiğinde bu kontrolü yap

  // STACK TANIMI (Aynı kaldı)
  return (
    <Stack>
      {/* (tabs) (Ana Uygulama) ekranları. */}
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      {/* İlan Detay Sayfası (Dinamik) */}
      <Stack.Screen 
        name="pet/[id]" 
        options={{
          headerTitle: "", 
          headerBackTitle: "Geri",
        }}
      />
      
      {/* İlan Ekleme Modalı */}
      <Stack.Screen 
        name="modal" 
        options={{ 
          presentation: 'modal',
          headerTitle: 'Yeni Evcil Hayvan Ekle',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Auth ekranları (Aynı kaldı) */}
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
    </Stack>
  );
}

// Bu, uygulamamızın ana giriş noktasıdır (Aynı kaldı)
export default function RootLayout() {
  return (
    <AuthProvider>
      <PetsProvider>
        <RootLayoutNav />
      </PetsProvider>
    </AuthProvider>
  );
}