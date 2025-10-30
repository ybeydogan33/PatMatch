// app/_layout.tsx (GÜNCELLENMİŞ HALİ - 'profile/edit' eklendi)

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PetsProvider } from '@/context/PetsContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';

function RootLayoutNav() {
  const { user } = useAuth(); 
  const segments = useSegments(); 
  const router = useRouter(); 

  useEffect(() => {
    // Yönlendirme mantığı
    const inAuthPages = segments.includes('login') || segments.includes('register');
    if (!user && !inAuthPages) {
      router.replace('/login');
    } 
    else if (user && (inAuthPages || segments.length === 0)) {
      router.replace('/(tabs)');
    }
  }, [user, segments]); 

  // STACK TANIMI
  return (
    <Stack>
      {/* 1. Ana Uygulama (Sekmeler) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* 2. İlan Detay */}
      <Stack.Screen 
        name="pet/[id]" 
        options={{ headerTitle: "", headerBackTitle: "Geri" }}
      />
      
      {/* 3. İlan Ekleme Modalı */}
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

      {/* 4. Sohbet Ekranı */}
      <Stack.Screen 
        name="chat/[chatId]" 
        options={{ title: 'Sohbet', headerBackTitle: 'Mesajlar' }} 
      />

      {/* 5. İlan Düzenleme Ekranı */}
      <Stack.Screen 
        name="edit/[id]" 
        options={{ 
          presentation: 'modal',
          headerTitle: 'İlanı Düzenle',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          ),
        }} 
      />

      {/* 6. YENİ EKRAN: Profili Düzenleme Ekranı
          Bu da bir modal olarak açılacak */}
      <Stack.Screen
        name="profile/edit" // 'app/profile/edit.tsx' dosyasına karşılık gelir
        options={{
          presentation: 'modal',
          headerTitle: 'Profili Düzenle',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* 7. Auth Ekranları (Login/Register) */}
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
    </Stack>
  );
}

// Ana giriş noktası
export default function RootLayout() {
  return (
    <AuthProvider>
      <PetsProvider>
        <RootLayoutNav />
      </PetsProvider>
    </AuthProvider>
  );
}