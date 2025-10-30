// components/PetCard.tsx (GÜNCELLENMİŞ HALİ - handleEdit eklendi)

import { PetsContext } from '@/context/PetsContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router'; // 1. YENİLİK: useRouter
import React, { useContext } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Pet arayüzü
export interface Pet {
  id?: string;
  userId: string;
  name: string;
  animalType: 'kedi' | 'kopek';
  breed: string;
  age: number;
  description: string;
  contactName: string; // Bu, ilan sahibinin e-postası
  type: 'sahiplenme' | 'ciftlestirme';
  imageUrl?: string;
  createdAt?: any;
  location?: string; // 1. YENİLİK: Konum alanı eklendi
}

export interface PetCardProps {
  pet: Pet;
  showAdminControls?: boolean;
}

const PetCard: React.FC<PetCardProps> = ({ pet, showAdminControls = false }) => {
  const isSahiplenme = pet.type === 'sahiplenme';
  const { deletePet } = useContext(PetsContext);
  const router = useRouter(); // 2. YENİLİK: router'ı tanımla

  // Silme fonksiyonu
  const handleDelete = () => {
    Alert.alert(
      "İlanı Sil",
      `'${pet.name}' adlı ilanı kalıcı olarak silmek istediğinizden emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deletePet(pet);
            } catch (error) {
              Alert.alert("Hata", "İlan silinirken bir sorun oluştu.");
            }
          }
        }
      ]
    );
  };

  // 3. YENİLİK: Düzenleme fonksiyonu
  const handleEdit = () => {
    if (!pet.id) return;
    router.push(`/edit/${pet.id}`); // Düzenleme sayfasına yönlendir
  };

  return (
    // 'Link' kartın tamamını sarmaya devam ediyor
    <Link href={`/pet/${pet.id}`} asChild>
      <TouchableOpacity style={styles.card}>
        {/* Badge ve Image kısımları */}
        <View style={[
          styles.badge, 
          isSahiplenme ? styles.badgeSahiplenme : styles.badgeCiftlestirme
        ]}>
          <Text style={styles.badgeText}>
            {isSahiplenme ? 'Sahiplenme' : 'Çiftleştirme'}
          </Text>
        </View>
        {pet.imageUrl ? (
          <Image source={{ uri: pet.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder} />
        )}
        
        {/* İçerik Alanı */}
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{pet.name}</Text>
            {/* Admin Kontrolleri (Sil/Düzenle) */}
            {showAdminControls && (
              <View style={styles.adminControls}>
                {/* 4. YENİLİK: 'handleEdit' fonksiyonunu 'onPress'e bağla */}
                <TouchableOpacity 
                  style={styles.adminButton} 
                  onPress={(e) => {
                    e.preventDefault(); // Ana Link'e (detay sayfasına) gitmeyi engelle
                    handleEdit(); // Düzenleme fonksiyonunu çalıştır
                  }}
                >
                  <Ionicons name="pencil" size={18} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.adminButton} 
                  onPress={(e) => {
                    e.preventDefault(); // Ana Link'e gitmeyi engelle
                    handleDelete(); 
                  }}
                >
                  <Ionicons name="trash" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={styles.cardSubtitle}>{pet.breed}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {pet.description}
          </Text>
          <Text style={styles.cardAge}>Yaş: {pet.age} yıl</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

// Stiller
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeSahiplenme: { backgroundColor: 'rgba(46, 204, 113, 0.9)' },
  badgeCiftlestirme: { backgroundColor: 'rgba(52, 152, 219, 0.9)' },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardImage: {
    height: 180,
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    height: 180,
    backgroundColor: '#e0e0e0',
  },
  contentContainer: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
  },
  adminControls: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  adminButton: {
    padding: 5,
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
    lineHeight: 20,
  },
  cardAge: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
});

export default PetCard;