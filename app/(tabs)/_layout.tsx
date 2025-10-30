// app/(tabs)/_layout.tsx dosyasının yeni içeriği

import { FontAwesome } from '@expo/vector-icons'; // İkonları kullanmak için
import { Tabs } from 'expo-router';
import React from 'react';

// Bu fonksiyon, alttaki sekme çubuğunu (Tab Bar) yönetir
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // Aktif olan sekmenin rengini (turuncu) ayarlıyoruz
        tabBarActiveTintColor: '#F97316', 
        // Pasif olan sekmenin rengi
        tabBarInactiveTintColor: '#888',
        // Sekme çubuğunun arkaplan rengi
        tabBarStyle: {
          backgroundColor: '#ffffff',
        },
        // ÖNEMLİ: Ekranların üst kısmındaki varsayılan başlığı (header) gizliyoruz.
        // Çünkü biz kendi başlığımızı (örn: "Hayatınıza Patili Bir Dost Katın")
        // index.tsx içinde kendimiz ekledik.
        headerShown: false, 
      }}
    >
      {/* 1. Sekme: Ana Sayfa */}
      <Tabs.Screen
        // 'name' özelliği, dosya adıyla eşleşmeli (index.tsx)
        name="index" 
        options={{
          // Sekmede görünecek isim
          title: 'Ana Sayfa', 
          // Sekme ikonu
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
        }}
      />

      {/* 2. Sekme: Profil */}
      <Tabs.Screen
        // 'name' özelliği, dosya adıyla eşleşmeli (explore.tsx)
        name="explore" 
        options={{
          // explore.tsx dosyasını 'Profil' ekranı olarak kullanacağız
          title: 'Profil', 
          // Sekme ikonu
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}