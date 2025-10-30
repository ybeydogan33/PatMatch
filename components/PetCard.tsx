// components/PetCard.tsx (TIKLANABİLİR HALİ)

import type { Pet } from '@/components/PetCard'; // Bu satırı taşıdık
import { Link } from 'expo-router'; // 1. YENİLİK: Expo Router'dan Link import edildi
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Pet arayüzü
export interface Pet {
  id: string;
  name: string;
  animalType: 'kedi' | 'kopek';
  breed: string;
  age: number;
  description: string;
  contactName: string;
  type: 'sahiplenme' | 'ciftlestirme';
  imageUrl?: string;
}

export interface PetCardProps {
  pet: Pet;
}

const PetCard: React.FC<PetCardProps> = ({ pet }) => {
  const isSahiplenme = pet.type === 'sahiplenme';

  return (
    // 2. YENİLİK: Kartı 'Link' bileşeni ile sardık.
    // 'href' prop'u, /pet/[id] formatına uygun dinamik bir yol oluşturur.
    // 'asChild', Link'in stil için altındaki bileşeni (TouchableOpacity) kullanmasını sağlar.
    <Link href={`/pet/${pet.id}`} asChild>
      {/* 3. YENİLİK: Dış 'View' bileşenini 'TouchableOpacity' yaptık
          (dokunma efektini daha iyi alması için) */}
      <TouchableOpacity style={styles.card}>
        {/* Etiket (Sahiplenme veya Çiftleştirme) */}
        <View style={[
          styles.badge, 
          isSahiplenme ? styles.badgeSahiplenme : styles.badgeCiftlestirme
        ]}>
          <Text style={styles.badgeText}>
            {isSahiplenme ? 'Sahiplenme' : 'Çiftleştirme'}
          </Text>
        </View>
        
        {/* Görsel Alanı */}
        {pet.imageUrl ? (
          <Image source={{ uri: pet.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder} />
        )}
        
        {/* İçerik Alanı */}
        <Text style={styles.cardTitle}>{pet.name}</Text>
        <Text style={styles.cardSubtitle}>{pet.breed}</Text>
        {/* Açıklamayı 2 satırla sınırlayalım (Detay sayfasında tamamı görünecek) */}
        <Text style={styles.cardDescription} numberOfLines={2}>
          {pet.description}
        </Text>
        <Text style={styles.cardAge}>Yaş: {pet.age} yıl</Text>
        
        {/* İletişim Butonu (Bunu artık detay sayfasında yapacağız) */}
        {/* <TouchableOpacity style={styles.cardButton}>
          <Text style={styles.cardButtonText}>{pet.contactName} ile İletişime Geç</Text>
        </TouchableOpacity> */}
        {/* 4. YENİLİK: Kartın altındaki butonu kaldırdık,
            çünkü artık kartın tamamı bir buton/link. */}
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
    // padding: 12, // Padding'i kaldırdık, görsel kenarlara yayılsın
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden', // Resmin yuvarlak köşelerden taşmasını engelle
  },
  badge: {
    position: 'absolute',
    top: 12, // Padding'i kaldırdığımız için ayarladık
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeSahiplenme: {
    backgroundColor: 'rgba(46, 204, 113, 0.9)', // Yeşil
  },
  badgeCiftlestirme: {
    backgroundColor: 'rgba(52, 152, 219, 0.9)', // Mavi
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardImage: {
    height: 180,
    // borderRadius: 8, // Üst köşeleri yuvarlatmaya gerek kalmadı
    marginBottom: 0,
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    height: 180,
    backgroundColor: '#e0e0e0',
    // borderRadius: 8,
    marginBottom: 0,
  },
  // 5. YENİLİK: İçerik için yeni bir 'contentContainer' stili
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    paddingHorizontal: 12, // İçeriğin padding'i
    paddingTop: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  cardAge: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
});

export default PetCard;