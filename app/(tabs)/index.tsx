// app/(tabs)/index.tsx (ARAMA ÇUBUĞU EKLENMİŞ HALİ)

import type { Pet } from '@/components/PetCard';
import PetCard from '@/components/PetCard';
import { PetsContext } from '@/context/PetsContext';
import { Link } from 'expo-router';
import React, { useContext, useMemo, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

type AnimalFilter = 'tümü' | 'kedi' | 'kopek';
type PurposeFilter = 'tümü' | 'sahiplenme' | 'ciftlestirme';

// Anasayfa Ekranımız
export default function HomeScreen() {
  const { pets } = useContext(PetsContext);

  // Filtre state'leri
  const [animalFilter, setAnimalFilter] = useState<AnimalFilter>('tümü');
  const [purposeFilter, setPurposeFilter] = useState<PurposeFilter>('tümü');
  
  // 1. YENİLİK: Arama çubuğu metnini tutmak için state
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrelenmiş listeyi hesaplamak için useMemo
  const filteredPets = useMemo(() => {
    let tempPets = pets; // Tam listeyle başla

    // A. Hayvan türüne göre filtrele
    if (animalFilter !== 'tümü') {
      tempPets = tempPets.filter(pet => pet.animalType === animalFilter);
    }

    // B. Amaca göre filtrele
    if (purposeFilter !== 'tümü') {
      tempPets = tempPets.filter(pet => pet.type === purposeFilter);
    }

    // 3. YENİLİK: Arama çubuğuna (searchQuery) göre filtrele
    if (searchQuery.trim() !== '') {
      const lowerCaseQuery = searchQuery.toLowerCase().trim();
      tempPets = tempPets.filter(pet => 
        // pet.name içinde arama metni VARSA VEYA
        pet.name.toLowerCase().includes(lowerCaseQuery) ||
        // pet.breed (cins) içinde arama metni VARSA
        pet.breed.toLowerCase().includes(lowerCaseQuery)
      );
    }

    return tempPets; // Filtrelenmiş listeyi döndür
    
  // 4. YENİLİK: 'searchQuery' state'ini bağımlılık dizisine ekledik
  }, [pets, animalFilter, purposeFilter, searchQuery]); 


  // FlatList'in render fonksiyonu
  const renderPetCard = ({ item }: { item: Pet }) => (
    <PetCard pet={item} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredPets} // FlatList her zaman filtrelenmiş veriyi kullanır
        renderItem={renderPetCard}
        keyExtractor={(item: Pet) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        
        // ListHeaderComponent (Başlık, Arama, Filtreler vb.)
        ListHeaderComponent={
          <>
            {/* Başlık ve Alt Başlık */}
            <Text style={styles.headerTitle}>Hayatınıza Patili Bir Dost Katın</Text>
            <Text style={styles.subHeader}>Yeni dostunuzu bulun veya sevimli evcil hayvanınız için bir eş arayın.</Text>

            {/* 5. YENİLİK: Arama çubuğunu 'searchQuery' state'ine bağladık */}
            <TextInput
              style={styles.searchBar}
              placeholder="İsim veya cinse göre ara..."
              placeholderTextColor="#888"
              value={searchQuery} // Değeri state'ten alır
              onChangeText={setSearchQuery} // Yazıldıkça state'i günceller
            />

            {/* Filtreler Bölümü (Değişiklik yok) */}
            <View style={styles.filterSection}>
              <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Hayvan:</Text>
                <TouchableOpacity 
                  style={[styles.filterButton, animalFilter === 'tümü' && styles.activeFilter]}
                  onPress={() => setAnimalFilter('tümü')}
                >
                  <Text style={[styles.filterText, animalFilter === 'tümü' && styles.activeFilterText]}>Tümü</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, animalFilter === 'kopek' && styles.activeFilter]}
                  onPress={() => setAnimalFilter('kopek')}
                >
                  <Text style={[styles.filterText, animalFilter === 'kopek' && styles.activeFilterText]}>Köpekler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, animalFilter === 'kedi' && styles.activeFilter]}
                  onPress={() => setAnimalFilter('kedi')}
                >
                  <Text style={[styles.filterText, animalFilter === 'kedi' && styles.activeFilterText]}>Kediler</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Amaç:</Text>
                <TouchableOpacity 
                  style={[styles.filterButton, purposeFilter === 'tümü' && styles.activeFilter]}
                  onPress={() => setPurposeFilter('tümü')}
                >
                  <Text style={[styles.filterText, purposeFilter === 'tümü' && styles.activeFilterText]}>Tümü</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, purposeFilter === 'sahiplenme' && styles.activeFilter]}
                  onPress={() => setPurposeFilter('sahiplenme')}
                >
                  <Text style={[styles.filterText, purposeFilter === 'sahiplenme' && styles.activeFilterText]}>Sahiplenme</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, purposeFilter === 'ciftlestirme' && styles.activeFilter]}
                  onPress={() => setPurposeFilter('ciftlestirme')}
                >
                  <Text style={[styles.filterText, purposeFilter === 'ciftlestirme' && styles.activeFilterText]}>Çiftleştirme</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* İlan Ekle Butonu */}
            <Link href="/modal" asChild>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>Yeni Evcil Hayvan Ekle</Text>
              </TouchableOpacity>
            </Link>

            {/* İlanlar Başlığı */}
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

// Stiller (Değişiklik yok)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  list: {
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    color: '#333',
  },
  subHeader: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  searchBar: {
    height: 48,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap', 
  },
  filterLabel: {
    marginRight: 10,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#555',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterText: {
    color: '#555',
  },
  activeFilter: {
    backgroundColor: '#F97316', 
    borderColor: '#F97316',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#F97316',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
});