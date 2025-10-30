// app/(tabs)/_layout.tsx (GÜNCELLENMİŞ HALİ - Sekme Bildirimi Eklendi)

import { useAuth } from '@/context/AuthContext'; // 1. YENİLİK: AuthContext'i import ettik
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
  // 2. YENİLİK: Global okunmamış sayısını aldık
  const { totalUnreadCount } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#ffffff',
        },
        headerShown: false, 
      }}
    >
      {/* 1. Sekme: Ana Sayfa (index.tsx) */}
      <Tabs.Screen
        name="index" 
        options={{
          title: 'Ana Sayfa', 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 2. Sekme: Mesajlar (messages.tsx) */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar', 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
          // 3. YENİLİK: Sekme bildirimi (badge)
          tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
          // 4. YENİLİK: Bildirim rengi
          tabBarBadgeStyle: { 
            backgroundColor: '#F97316', 
            color: '#fff',
            fontSize: 12,
          }
        }}
      />

      {/* 3. Sekme: Profil (explore.tsx) */}
      <Tabs.Screen
        name="explore" 
        options={{
          title: 'Profil', 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}