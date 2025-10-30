// app/pet/[id].tsx (GÜNCELLENMİŞ HALİ - readStatus eklendi)

import { useAuth } from '@/context/AuthContext';
import { PetsContext } from '@/context/PetsContext';
import { db } from '@/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
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

export default function PetDetailScreen() {
  const router = useRouter(); 
  const { id } = useLocalSearchParams(); 
  const { pets } = useContext(PetsContext);
  const { user } = useAuth(); 

  const pet = pets.find(p => p.id === id);

  const handleStartChat = async () => {
    if (!user || !pet) return;

    if (user.uid === pet.userId) {
      Alert.alert("Bu sizin ilanınız", "Kendi ilanınız için sohbet başlatamazsınız.");
      return;
    }

    try {
      const chatsRef = collection(db, 'chats');
      
      const q = query(chatsRef, where('users', 'array-contains', user.uid));
      const querySnapshot = await getDocs(q);

      let existingChat = null;
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.users.includes(pet.userId)) {
          existingChat = { id: doc.id, ...data };
        }
      });

      if (existingChat) {
        router.push(`/chat/${existingChat.id}`);
      } else {
        // 1. YENİLİK: Yeni sohbet odası oluştururken readStatus ekliyoruz
        const newChatRef = await addDoc(chatsRef, {
          users: [user.uid, pet.userId], 
          userNames: { 
            [user.uid]: user.email?.split('@')[0],
            [pet.userId]: pet.contactName.split('@')[0]
          },
          lastMessage: "Sohbet başlatıldı.",
          lastTimestamp: serverTimestamp(),
          // Her iki kullanıcı için de okunmamış mesaj sayacını 0'da başlat
          readStatus: {
            [user.uid]: 0,
            [pet.userId]: 0
          }
        });
        
        router.push(`/chat/${newChatRef.id}`);
      }
    } catch (error) {
      console.error("Sohbet başlatılırken hata:", error);
      Alert.alert("Hata", "Sohbet odası oluşturulamadı.");
    }
  };

  if (!pet) {
    // ... (Hata ekranı aynı) ...
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Hata" }} />
        <Text style={styles.name}>İlan Bulunamadı</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* ... (Geri kalan JSX kodları aynı) ... */}
      <Stack.Screen options={{ title: pet.name, headerTitleAlign: 'center' }} />
      <ScrollView>
        <Image source={{ uri: pet.imageUrl }} style={styles.image} />
        <View style={styles.contentContainer}>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.breed}>{pet.breed} ({pet.animalType === 'kedi' ? 'Kedi' : 'Köpek'})</Text>
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
          {user && user.uid !== pet.userId && (
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

// ... (Stiller aynı) ...
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
    textTransform: 'capitalize',
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
    lineHeight: 24,
    marginBottom: 30,
  },
  contactButton: {
    backgroundColor: '#F97316',
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