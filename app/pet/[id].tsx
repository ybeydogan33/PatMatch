// app/pet/[id].tsx (YENİ DOSYA - İLAN DETAY SAYFASI)

import { PetsContext } from '@/context/PetsContext'; // Global depomuz
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function PetDetailScreen() {
  const router = useRouter(); // Geri gitmek için (kullanmayabiliriz ama iyi)
  
  // 1. URL'den [id] parametresini alıyoruz
  const { id } = useLocalSearchParams(); 
  
  // 2. Global pet listesini alıyoruz
  const { pets } = useContext(PetsContext);

  // 3. O 'id'ye sahip olan pet'i buluyoruz
  const pet = pets.find(p => p.id === id);

  // 4. Eğer pet bulunamazsa (örn: eski link)
  if (!pet) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Hata" }} />
        <Text style={styles.name}>İlan Bulunamadı</Text>
        <Text>Bu ilan yayından kaldırılmış veya yanlış bir linke tıklamış olabilirsiniz.</Text>
      </SafeAreaView>
    );
  }
  
  // 5. Pet bulunduysa, sayfa başlığını onun adıyla güncelliyoruz
  return (
    <SafeAreaView style={styles.container}>
      {/* Bu sayfanın başlığını dinamik olarak pet'in adıyla ayarla */}
      <Stack.Screen options={{ title: pet.name, headerTitleAlign: 'center' }} />
      
      <ScrollView>
        {/* Büyük Resim */}
        <Image source={{ uri: pet.imageUrl }} style={styles.image} />
        
        <View style={styles.contentContainer}>
          {/* İsim ve Cins */}
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.breed}>{pet.breed} ({pet.animalType === 'kedi' ? 'Kedi' : 'Köpek'})</Text>
          
          {/* Hızlı Bilgiler (Yaş, Amaç) */}
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
          
          {/* Tam Açıklama */}
          <Text style={styles.descriptionHeader}>Açıklama</Text>
          <Text style={styles.description}>{pet.description}</Text>
          
          {/* İletişime Geç Butonu */}
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
            <Text style={styles.contactButtonText}>{pet.contactName} ile İletişime Geç</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Stiller
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  breed: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textTransform: 'capitalize', // İlk harfi büyük yapar
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '45%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  descriptionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24, // Okunabilirlik için satır aralığı
    marginBottom: 30,
  },
  contactButton: {
    backgroundColor: '#F97316', // Turuncu
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },
});