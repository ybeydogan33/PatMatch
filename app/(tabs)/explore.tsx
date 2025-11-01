// app/(tabs)/explore.tsx (SUPABASE SÜRÜMÜ)

import type { Pet } from '@/components/PetCard';
import PetCard from '@/components/PetCard';
import { useAuth } from '@/context/AuthContext'; // Yeni AuthContext
import { PetsContext } from '@/context/PetsContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { pets, loading: petsLoading } = useContext(PetsContext);
  
  // 1. YENİLİK: 'userProfile' yerine 'profile', 'authLoading' yerine 'loading'
  const { user, profile, logout, loading: authLoading } = useAuth();

  // 2. YENİLİK: Filtrelemeyi 'pet.owner_id' (SQL) ve 'user.id' (Supabase) ile yap
  const myPets = useMemo(() => {
    if (!user) return []; 
    return pets.filter(pet => pet.owner_id === user.id);
  }, [pets, user]); 

  
  // Yükleme durumu (Profilin yüklenmesini bekle)
  if (petsLoading || authLoading || !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    );
  }
  
  const renderMyPetCard = ({ item }: { item: Pet }) => (
    <PetCard pet={item} showAdminControls={true} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={myPets}
        renderItem={renderMyPetCard}
        keyExtractor={(item: Pet) => item.id.toString()} // 'id' artık 'number'
        style={styles.list}
        showsVerticalScrollIndicator={false}
        
        ListHeaderComponent={
          <>
            <View style={styles.profileHeader}>
              {/* 3. YENİLİK: 'profile.photo_url' (SQL) */}
              <Image
                style={styles.profileImage}
                source={{ uri: profile.photo_url || 'https://via.placeholder.com/100' }} 
              />
              {/* 4. YENİLİK: 'profile.display_name' (SQL) */}
              <Text style={styles.profileName}>{profile.display_name}</Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => router.push('/profile/edit')} // Bu zaten doğruydu
            >
              <Ionicons name="person-outline" size={20} color="#333" />
              <Text style={styles.menuButtonText}>Profili Düzenle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.menuButton, styles.logoutButton]} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color="#D9534F" />
              <Text style={[styles.menuButtonText, styles.logoutButtonText]}>Çıkış Yap</Text>
            </TouchableOpacity>
            
            <Text style={styles.listHeader}>İlanlarım ({myPets.length})</Text>
          </>
        }
        
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz hiç ilan eklememişsiniz.</Text>
            <Text style={styles.emptySubText}>Ana sayfadan yeni ilan ekleyebilirsiniz.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ... (Stiller aynı) ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16 },
  profileHeader: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  profileImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e0e0e0', marginBottom: 10 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#333', textTransform: 'capitalize' },
  profileEmail: { fontSize: 16, color: '#888' },
  menuButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, borderColor: '#ddd', borderWidth: 1, marginBottom: 10 },
  menuButtonText: { fontSize: 16, marginLeft: 15, color: '#333' },
  logoutButton: { borderColor: '#D9534F' },
  logoutButtonText: { color: '#D9534F' },
  listHeader: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 30 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 10 },
  emptySubText: { fontSize: 14, color: '#888', marginTop: 5, textAlign: 'center' },
});