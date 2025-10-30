// app/(tabs)/explore.tsx (PROFİL SAYFASI - DİNAMİK HALİ)

import type { Pet } from '@/components/PetCard'; // Tipleri alıyoruz
import PetCard from '@/components/PetCard'; // Kart bileşenimizi tekrar kullanıyoruz
import { PetsContext } from '@/context/PetsContext'; // 1. Global depomuzu import ettik
import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useMemo } from 'react'; // useContext ve useMemo eklendi
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// 2. YENİLİK: Sahte MY_DUMMY_PETS verisini sildik.

export default function ProfileScreen() {
  
  // 3. YENİLİK: Global 'pets' listesini depodan çekiyoruz
  const { pets } = useContext(PetsContext);

  // 4. YENİLİK: Giriş yapmış kullanıcıyı simüle ediyoruz
  // (Bu bilgiyi modal.tsx'te 'contactName' olarak sabit kodlamıştık)
  const currentUser = 'Yavuz';

  // 5. YENİLİK: Sadece "Yavuz"a ait olan ilanları filtreliyoruz
  const myPets = useMemo(() => {
    // Sadece contactName'i 'Yavuz' olanları filtrele
    return pets.filter(pet => pet.contactName === currentUser);
  }, [pets, currentUser]); // 'pets' listesi değiştiğinde bu filtre yeniden çalışır

  
  // FlatList için render fonksiyonu
  const renderMyPetCard = ({ item }: { item: Pet }) => (
    <PetCard pet={item} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        // 6. YENİLİK: data'yı sahte veriden 'myPets' dizisine çevirdik
        data={myPets} 
        renderItem={renderMyPetCard}
        keyExtractor={(item: Pet) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        
        // Listenin üst kısmı (Profil Bilgileri ve Butonlar)
        ListHeaderComponent={
          <>
            {/* Profil Başlık Alanı */}
            <View style={styles.profileHeader}>
              <Image
                style={styles.profileImage}
                // Şimdilik yer tutucu bir görsel
                source={{ uri: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png' }} 
              />
              {/* Ekran görüntünüzden yola çıkarak "Yavuz" adını kullanıyoruz */}
              <Text style={styles.profileName}>Yavuz</Text>
              <Text style={styles.profileEmail}>yavuz@mail.com</Text>
            </View>
            
            {/* Menü Butonları */}
            <TouchableOpacity style={styles.menuButton}>
              <Ionicons name="person-outline" size={20} color="#333" />
              <Text style={styles.menuButtonText}>Profili Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <Ionicons name="settings-outline" size={20} color="#333" />
              <Text style={styles.menuButtonText}>Ayarlar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuButton, styles.logoutButton]}>
              <Ionicons name="log-out-outline" size={20} color="#D9534F" />
              <Text style={[styles.menuButtonText, styles.logoutButtonText]}>Çıkış Yap</Text>
            </TouchableOpacity>
            
            {/* İlanlarım Başlığı */}
            <Text style={styles.listHeader}>İlanlarım ({myPets.length})</Text>
          </>
        }
        
        // 7. YENİLİK: Bu bileşen artık tam dinamik!
        // 'myPets' dizisi boşsa (hiç ilanı yoksa) otomatik olarak gösterilecek
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

// Stiller
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  list: {
    paddingHorizontal: 16,
  },
  // Profil Başlık Stilleri
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  profileEmail: {
    fontSize: 16,
    color: '#888',
  },
  // Menü Buton Stilleri
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 10,
  },
  menuButtonText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  logoutButton: {
    borderColor: '#D9534F',
  },
  logoutButtonText: {
    color: '#D9534F',
  },
  // İlanlarım Başlığı
  listHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 20,
  },
  // Boş Liste Stilleri
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