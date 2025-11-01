// app/(tabs)/index.tsx (SUPABASE SÜRÜMÜ)

import type { Pet } from '@/components/PetCard';
import PetCard from '@/components/PetCard';
import { PetsContext } from '@/context/PetsContext'; // Yeni PetsContext
import { Link } from 'expo-router';
import React, { useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Firebase importları SİLİNDİ

type AnimalFilter = 'tümü' | 'kedi' | 'kopek';
type PurposeFilter = 'tümü' | 'sahiplenme' | 'ciftlestirme';

export default function HomeScreen() {
  // 1. YENİLİK: 'pets' VE 'loading' durumunu context'ten al
  const { pets, loading } = useContext(PetsContext);

  const [animalFilter, setAnimalFilter] = useState<AnimalFilter>('tümü');
  const [purposeFilter, setPurposeFilter] = useState<PurposeFilter>('tümü');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPets = useMemo(() => {
    let tempPets = pets; 

    // A. Hayvan türüne göre filtrele
    if (animalFilter !== 'tümü') {
      // 2. YENİLİK: 'pet.animalType' yerine 'pet.animal_type'
      tempPets = tempPets.filter(pet => pet.animal_type === animalFilter);
    }

    // B. Amaca göre filtrele (Bu alan adı aynı kalmıştı)
    if (purposeFilter !== 'tümü') {
      tempPets = tempPets.filter(pet => pet.type === purposeFilter);
    }

    // C. Arama çubuğuna göre filtrele (Aynı)
    if (searchQuery.trim() !== '') {
      const lowerCaseQuery = searchQuery.toLowerCase().trim();
      tempPets = tempPets.filter(pet => 
        pet.name.toLowerCase().includes(lowerCaseQuery) ||
        pet.breed.toLowerCase().includes(lowerCaseQuery)
      );
    }

    return tempPets;
  }, [pets, animalFilter, purposeFilter, searchQuery]); 


  const renderPetCard = ({ item }: { item: Pet }) => (
    <PetCard pet={item} />
  );

  // 3. YENİLİK: Veri yüklenirken yükleme göstergesi
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredPets} 
        renderItem={renderPetCard}
        // 4. YENİLİK: 'id' artık 'number' olduğu için 'toString()'
        keyExtractor={(item: Pet) => item.id.toString()}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* ... (Başlık, Alt Başlık, Arama Çubuğu, Filtreler, İlan Ekle Butonu aynı) ... */}
            {/* (Kopyalıyorum) */}
            <Text style={styles.headerTitle}>Hayatınıza Patili Bir Dost Katın</Text>
            <Text style={styles.subHeader}>Yeni dostunuzu bulun veya sevimli evcil hayvanınız için bir eş arayın.</Text>
            <TextInput style={styles.searchBar} placeholder="İsim veya cinse göre ara..." value={searchQuery} onChangeText={setSearchQuery} />
            <View style={styles.filterSection}>
              <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Hayvan:</Text>
                <TouchableOpacity style={[styles.filterButton, animalFilter === 'tümü' && styles.activeFilter]} onPress={() => setAnimalFilter('tümü')}>
                  <Text style={[styles.filterText, animalFilter === 'tümü' && styles.activeFilterText]}>Tümü</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, animalFilter === 'kopek' && styles.activeFilter]} onPress={() => setAnimalFilter('kopek')}>
                  <Text style={[styles.filterText, animalFilter === 'kopek' && styles.activeFilterText]}>Köpekler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, animalFilter === 'kedi' && styles.activeFilter]} onPress={() => setAnimalFilter('kedi')}>
                  <Text style={[styles.filterText, animalFilter === 'kedi' && styles.activeFilterText]}>Kediler</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Amaç:</Text>
                <TouchableOpacity style={[styles.filterButton, purposeFilter === 'tümü' && styles.activeFilter]} onPress={() => setPurposeFilter('tümü')}>
                  <Text style={[styles.filterText, purposeFilter === 'tümü' && styles.activeFilterText]}>Tümü</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, purposeFilter === 'sahiplenme' && styles.activeFilter]} onPress={() => setPurposeFilter('sahiplenme')}>
                  <Text style={[styles.filterText, purposeFilter === 'sahiplenme' && styles.activeFilterText]}>Sahiplenme</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, purposeFilter === 'ciftlestirme' && styles.activeFilter]} onPress={() => setPurposeFilter('ciftlestirme')}>
                  <Text style={[styles.filterText, purposeFilter === 'ciftlestirme' && styles.activeFilterText]}>Çiftleştirme</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Link href="/modal" asChild>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>Yeni Evcil Hayvan Ekle</Text>
              </TouchableOpacity>
            </Link>
            <Text style={styles.listHeader}>Öne Çıkan İlanlar</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bu filtrelere uygun ilan bulunamadı.</Text>
            <Text style={styles.emptySubText}>Arama metninizi veya filtrelerinizi değiştirmeyi deneyin.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ... (Stiller aynı, 'loadingContainer' eklendi) ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginTop: 20, color: '#333' },
  subHeader: { fontSize: 14, textAlign: 'center', color: '#666', marginBottom: 20, paddingHorizontal: 20 },
  searchBar: { height: 48, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, fontSize: 16, marginBottom: 20 },
  filterSection: { marginBottom: 10 },
  filterContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' },
  filterLabel: { marginRight: 10, fontWeight: 'bold', fontSize: 16, color: '#555' },
  filterButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  filterText: { color: '#555' },
  activeFilter: { backgroundColor: '#F97316', borderColor: '#F97316' },
  activeFilterText: { color: '#fff', fontWeight: 'bold' },
  addButton: { backgroundColor: '#F97316', padding: 15, borderRadius: 12, alignItems: 'center', marginVertical: 20 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listHeader: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 20, marginTop: 30 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#666' },
  emptySubText: { fontSize: 14, color: '#888', marginTop: 5 },
});