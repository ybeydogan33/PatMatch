// app/pet/[id].tsx (GÜNCELLENMİŞ HALİ - Manuel Geri Butonu Eklendi)

import { useAuth } from '@/context/AuthContext';
import { PetsContext } from '@/context/PetsContext';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// Firebase importları SİLİNDİ

export default function PetDetailScreen() {
  const router = useRouter(); // 1. YENİLİK: 'router'ı tanımladık
  const { id } = useLocalSearchParams(); 
  const { pets } = useContext(PetsContext); 
  const { user } = useAuth(); 

  const pet = pets.find(p => p.id === Number(id));

  // Sohbet Başlatma Fonksiyonu (Aynı)
  const handleStartChat = async () => {
    if (!user || !pet) return;
    if (user.id === pet.owner_id) {
      Alert.alert("Bu sizin ilanınız", "Kendi ilanınız için sohbet başlatamazsınız.");
      return;
    }
    try {
      const { data: chatId, error } = await supabase.rpc('create_or_get_chat', {
        user_1: user.id,
        user_2: pet.owner_id
      });
      if (error) throw error;
      router.push(`/chat/${chatId}`);
    } catch (error: any) {
      console.error("Sohbet başlatılırken hata:", error.message);
      Alert.alert("Hata", "Sohbet odası oluşturulamadı: " + error.message);
    }
  };


  if (!pet) {
    // ... (Hata ekranı aynı) ...
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* 2. YENİLİK: 'headerLeft' (manuel geri butonu) eklendi */}
      <Stack.Screen 
        options={{ 
          title: pet.name, 
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#F97316" />
              {/* 'Geri' yazısı yerine 'Profil' yazabiliriz, ancak bu daha karmaşık */}
              <Text style={styles.backButtonText}>Geri</Text>
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView>
        <Image source={{ uri: pet.image_url }} style={styles.image} />
        
        <View style={styles.contentContainer}>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.breed}>{pet.breed} ({pet.animal_type === 'kedi' ? 'Kedi' : 'Köpek'})</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>YAŞ</Text>
              <Text style={styles.infoValue}>{pet.age} yıl</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>AMAÇ</Text>
              <Text style={styles.infoValue}>
                {pet.type === 'sahiplenme' ? 'Sahiplenme' : 'Çiftleştirme'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.descriptionHeader}>Açıklama</Text>
          <Text style={styles.description}>{pet.description}</Text>
          
          {/* İletişime Geç Butonu (Aynı) */}
          {user && user.id !== pet.owner_id && (
            <TouchableOpacity style={styles.contactButton} onPress={handleStartChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
              <Text style={styles.contactButtonText}>{pet.contactName} ile İletişime Geç</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Stiller
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  // 3. YENİ STİLLER:
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 0,
  },
  backButtonText: {
    color: '#F97316',
    fontSize: 17,
  },
  // ---
  image: { width: '100%', height: 300, resizeMode: 'cover' },
  contentContainer: { padding: 20 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  breed: { fontSize: 18, color: '#666', marginBottom: 20, textTransform: 'capitalize' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  infoBox: { backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 10, padding: 15, alignItems: 'center', width: '45%' },
  infoLabel: { fontSize: 12, color: '#888', fontWeight: 'bold' },
  infoValue: { fontSize: 16, color: '#333', fontWeight: 'bold', textTransform: 'capitalize' },
  descriptionHeader: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  description: { fontSize: 16, color: '#555', lineHeight: 24, marginBottom: 30 },
  contactButton: { backgroundColor: '#F97316', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 12 },
  contactButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
});