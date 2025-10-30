// app/profile/edit.tsx (YENİ DOSYA - Profili Düzenle Formu)

import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/firebase'; // Storage ve db'yi al
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // Fotoğraf seçici
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore'; // Döküman güncelleme
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'; // Storage fonksiyonları
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth(); // Mevcut kullanıcı ve profil bilgilerini al

  // Form state'lerini mevcut profil bilgileriyle doldur
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [imageUri, setImageUri] = useState<string | null>(userProfile?.photoURL || null);
  
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const isLoading = loadingMessage !== null;

  // Fotoğraf seçme fonksiyonu (modal.tsx'ten kopyalandı)
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Profil fotoğrafını değiştirmek için galeri izni gerekli.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Profil fotoğrafı için 1:1 (kare) oran
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri); // State'i yeni (lokal) URI ile güncelle
    }
  };

  // Yeni fotoğrafı yükleme (modal.tsx'ten kopyalandı ve dosya yolu değiştirildi)
  const uploadImageAsync = async (uri: string, userId: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    // Dosya yolu: images/avatars/kullaniciID.jpg
    const fileName = `images/avatars/${userId}.jpg`; 
    const fileRef = ref(storage, fileName);
    const snapshot = await uploadBytes(fileRef, blob);
    return await getDownloadURL(snapshot.ref);
  };


  // Değişiklikleri Kaydetme
  const handleSave = async () => {
    if (!user || !userProfile) {
      Alert.alert("Hata", "Kullanıcı bulunamadı.");
      return;
    }
    
    // Görünen ad boş olamaz
    if (displayName.trim() === '') {
      Alert.alert("Hata", "Görünen ad boş bırakılamaz.");
      return;
    }

    setLoadingMessage("Profil Güncelleniyor...");

    try {
      // Güncellenecek veriyi tutan obje
      const updates: { displayName: string; photoURL?: string } = {
        displayName: displayName.trim(),
      };
      
      // 1. Fotoğraf değişti mi kontrol et
      if (imageUri && imageUri !== userProfile.photoURL) {
        setLoadingMessage("Yeni Fotoğraf Yükleniyor...");
        
        // 1A. Yeni fotoğrafı Storage'a yükle
        const newPermanentUrl = await uploadImageAsync(imageUri, user.uid);
        updates.photoURL = newPermanentUrl; // Kalıcı URL'i güncelleme objesine ekle
        
        // 1B. Eski fotoğrafı Storage'dan sil (eğer varsayılan 'ui-avatars' değilse)
        if (userProfile.photoURL && userProfile.photoURL.includes('firebasestorage')) {
          const oldImageRef = ref(storage, userProfile.photoURL);
          try {
            await deleteObject(oldImageRef);
          } catch (deleteError) {
            console.warn("Eski profil fotoğrafı silinirken hata:", deleteError);
          }
        }
      }
      
      // 2. Firestore'daki 'users' belgesini güncelle
      setLoadingMessage("Veritabanı Kaydediliyor...");
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, updates);
      
      setLoadingMessage(null);
      Alert.alert("Başarılı", "Profiliniz güncellendi.");
      router.back(); // Modalı kapat

    } catch (error) {
      setLoadingMessage(null);
      console.error("Profil güncellenirken hata:", error);
      Alert.alert("Hata", "Profil güncellenirken bir sorun oluştu.");
    }
  };


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Fotoğraf Değiştirme Alanı */}
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={isLoading}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color="#888" />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHelperText}>Fotoğrafı değiştirmek için dokunun</Text>

        {/* Görünen Ad Alanı */}
        <Text style={styles.label}>Görünen Ad *</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Herkesin göreceği adınız"
          disabled={isLoading}
        />

        {/* E-posta Alanı (Değiştirilemez) */}
        <Text style={styles.label}>E-posta (Değiştirilemez)</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={user?.email || ''}
          editable={false} // Düzenlemeyi engelle
        />

        {/* Kaydet Butonu */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
            onPress={handleSave} 
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingText}>{loadingMessage || 'Kaydediliyor...'}</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
            )}
          </TouchableOpacity>
        </View>

        <StatusBar barStyle="dark-content" />
      </ScrollView>
    </View>
  );
}

// Stiller
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center', // İçeriği ortala
  },
  // Avatar Stilleri
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#F97316',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarPlaceholder: {
    // (Arka plan zaten container'da)
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#F97316',
    borderRadius: 15,
    padding: 6,
    borderWidth: 2,
    borderColor: '#FFFBF5',
  },
  avatarHelperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  // Form Stilleri
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    alignSelf: 'flex-start', // Etiketi sola hizala
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    width: '100%',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#888',
  },
  // Kaydet Butonu Stilleri
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#F97316',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  saveButtonDisabled: {
    backgroundColor: '#F97316',
    opacity: 0.7, 
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});