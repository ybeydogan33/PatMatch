// app/_layout.tsx

import { PetsProvider } from '@/context/PetsContext'; // Oluşturduğumuz Provider
import { Ionicons } from '@expo/vector-icons'; // Kapatma ikonu için
import { Stack, useRouter } from 'expo-router'; // useRouter eklendi
import React from 'react';
import { TouchableOpacity } from 'react-native'; // Kapatma butonu için

// Bu, uygulamamızın ana giriş noktasıdır
export default function RootLayout() {
  const router = useRouter(); // Kapatma butonu için router'ı burada tanımlıyoruz

  return (
    // 1. Tüm uygulamayı PetsProvider ile sarıyoruz
    <PetsProvider>
      {/* 2. Stack Navigator, (tabs) ve modal ekranlarını yönetir */}
      <Stack>
        {/* (tabs) ekran grubu (Ana Sayfa, Profil) */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} // (tabs)'ın kendi başlığı (header) var, bunu gizle
        />
        {/* Modal ekranımız */}
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal',
            // Modal'ın başlık ve kapatma butonunu buradan yönetiyoruz
            headerTitle: 'Yeni Evcil Hayvan Ekle',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            ),
          }}
        />
      </Stack>
    </PetsProvider>
  );
}