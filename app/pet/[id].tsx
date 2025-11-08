import { useAuth } from '@/context/AuthContext';
import { PetsContext } from '@/context/PetsContext';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function PetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { pets } = useContext(PetsContext);
  const { user } = useAuth();

  const pet = pets.find((p) => p.id === Number(id));
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const handleStartChat = async () => {
    if (!user || !pet) return;
    if (user.id === pet.owner_id) {
      Alert.alert('Bu sizin ilanınız', 'Kendi ilanınız için sohbet başlatamazsınız.');
      return;
    }
    try {
      const { data: chatId, error } = await supabase.rpc('create_or_get_chat', {
        user_1: user.id,
        user_2: pet.owner_id,
      });
      if (error) throw error;
      router.push(`/chat/${chatId}`);
    } catch (error: any) {
      console.error('Sohbet başlatılırken hata:', error.message);
      Alert.alert('Hata', 'Sohbet odası oluşturulamadı: ' + error.message);
    }
  };

  if (!pet) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Hata' }} />
        <Text style={styles.name}>İlan Bulunamadı</Text>
      </SafeAreaView>
    );
  }

  // ✅ image_gallery güvenli parse (her senaryoyu yakalar)
  let parsedGallery: string[] = [];

  try {
    if (pet.image_gallery) {
      // Eğer zaten array ise
      if (Array.isArray(pet.image_gallery)) {
        parsedGallery = pet.image_gallery;
      }
      // Eğer string olarak geldiyse ama JSON değilse (örneğin tek URL)
      else if (
        typeof pet.image_gallery === 'string' &&
        !pet.image_gallery.trim().startsWith('[')
      ) {
        parsedGallery = [pet.image_gallery];
      }
      // Eğer string JSON dizisiyse
      else if (typeof pet.image_gallery === 'string') {
        parsedGallery = JSON.parse(pet.image_gallery);
      }
    }
  } catch (error) {
    console.log('image_gallery parse error:', error);
    parsedGallery = [];
  }

  // ✅ Tüm fotoğrafları birleştir
  const allPhotos = parsedGallery.length
    ? parsedGallery
    : pet.image_url
    ? [pet.image_url]
    : [];

  console.log('✅ photoGallery:', allPhotos);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: pet.name,
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#F97316" />
              <Text style={styles.backButtonText}>Geri</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView>
        {/* --- Fotoğraf Galerisi --- */}
        <View style={styles.galleryContainer}>
          <FlatList
            ref={flatListRef}
            data={allPhotos}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.image}
                onError={(e) =>
                  console.warn('Resim yüklenemedi:', e.nativeEvent.error)
                }
              />
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          />

          {/* --- Slider Noktaları --- */}
          {allPhotos.length > 1 && (
            <View style={styles.pagination}>
              {allPhotos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* --- İlan Bilgileri --- */}
        <View style={styles.contentContainer}>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.breed}>
            {pet.breed} ({pet.animal_type === 'kedi' ? 'Kedi' : 'Köpek'})
          </Text>

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

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={20} color="#555" />
            <Text style={styles.locationText}>
              {pet.location || 'Konum belirtilmemiş'}
            </Text>
          </View>

          <Text style={styles.descriptionHeader}>Açıklama</Text>
          <Text style={styles.description}>{pet.description}</Text>

          {user && user.id !== pet.owner_id && (
            <TouchableOpacity style={styles.contactButton} onPress={handleStartChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
              <Text style={styles.contactButtonText}>
                {pet.contactName} ile İletişime Geç
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Stiller ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingLeft: 0 },
  backButtonText: { color: '#F97316', fontSize: 17 },
  galleryContainer: { width, height: 300 },
  image: { width, height: 300, resizeMode: 'cover' },
  pagination: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    opacity: 0.4,
    marginHorizontal: 4,
  },
  paginationDotActive: { opacity: 1 },
  contentContainer: { padding: 20 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  breed: {
    fontSize: 18,
    color: '#666',
    marginBottom: 15,
    textTransform: 'capitalize',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '48%',
  },
  infoLabel: { fontSize: 12, color: '#888', fontWeight: 'bold' },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    fontWeight: '500',
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
