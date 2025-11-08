// app/profile/edit.tsx (ModalSelect Bileşeni İçeride)

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base-64';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  // --- GÜNCELLEME (1/5): Modal için importlar eklendi ---
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

// --- GÜNCELLEME (2/5): İl listesi import edildi ---
import { iller } from '@/constants/locationData';

// --- GÜNCELLEME (3/5): ModalSelect bileşeni 'app/modal.tsx' dosyasından kopyalandı ---
const ModalSelect = ({ visible, title, options, selectedValue, onSelect, onClose }: any) => {
  const [search, setSearch] = useState('');
  const filtered = options.filter((item: string) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Ara..."
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, item === selectedValue && styles.modalOptionSelected]}
                  onPress={() => { onSelect(item); setSearch(''); onClose(); }} // Arama metnini temizle
                >
                  <Text style={[styles.modalOptionText, item === selectedValue && styles.modalOptionTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled" // Arama yaparken listeye tıklanabilsin
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
// --- GÜNCELLEME (3/5) BİTTİ ---


export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [imageUri, setImageUri] = useState<string | null>(profile?.photo_url || null);
  const [city, setCity] = useState(profile?.city || '');
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const isLoading = loadingMessage !== null;

  // --- GÜNCELLEME (4/5): Modal state'i eklendi ---
  const [showCityModal, setShowCityModal] = useState(false);

  // ... (pickImage, uploadImageAsync, handleSave fonksiyonları aynı,
  // 'handleSave' zaten 'city' state'ini kaydediyordu, o yüzden çalışacak)
  
    // Fotoğraf seçme (TAM HALİ)
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Profil fotoğrafını değiştirmek için galeri izni gerekli.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Kare
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri); 
    }
  };

  // Fotoğrafı Supabase Storage'a 'expo-file-system' (ArrayBuffer) ile yükleme
  const uploadImageAsync = async (uri: string, userId: string): Promise<string> => {
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const filePath = `public/${userId}.${fileExt}`; // Avatars kovası için dosya yolu

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      const raw = decode(base64);
      const rawLength = raw.length;
      const array = new Uint8Array(new ArrayBuffer(rawLength));
      for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      
      const { data, error } = await supabase.storage
        .from('avatars') // Kova adı: 'avatars'
        .upload(filePath, array, { 
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
          upsert: true, // Profil fotoğrafının üzerine yaz
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      return publicUrl;
      
    } catch (error) {
      console.error("Supabase yükleme hatası:", error);
      throw error;
    }
  };

  // Değişiklikleri Kaydetme (TAM HALİ)
  const handleSave = async () => {
    if (!user || !profile) {
      Alert.alert("Hata", "Kullanıcı bulunamadı.");
      return;
    }
    
    if (displayName.trim() === '') {
      Alert.alert("Hata", "Görünen ad boş bırakılamaz.");
      return;
    }

    setLoadingMessage("Profil Güncelleniyor...");

    try {
      let newPhotoURL = profile.photo_url; // Varsayılan olarak eski URL

      if (imageUri && imageUri !== profile.photo_url) {
        setLoadingMessage("Yeni Fotoğraf Yükleniyor...");
        newPhotoURL = await uploadImageAsync(imageUri, user.id);
      }
      
      setLoadingMessage("Veritabanı Kaydediliyor...");
      
      const updates = {
        display_name: displayName.trim(),
        photo_url: newPhotoURL,
        city: city ? city.trim() : '', // 'city' state'ini kullan
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id); 
        
      if (error) throw error;
      if (refreshProfile) {
        await refreshProfile();
      }
      
      setLoadingMessage(null);
      Alert.alert("Başarı", "Profiliniz güncellendi.");
      router.back(); 

    } catch (error: any) {
      setLoadingMessage(null);
      console.error("Profil güncellenirken hata:", error.message);
      Alert.alert("Hata", "Profil güncellenirken bir sorun oluştu.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* ... (Avatar, Görünen Ad, E-posta alanları aynı) ... */}
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

        <Text style={styles.label}>Görünen Ad *</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Herkesin göreceği adınız"
          disabled={isLoading}
        />

        {/* --- GÜNCELLEME (5/5): TextInput'u Modal Butonu ile değiştir --- */}
        <Text style={styles.label}>Konum (İl)</Text>
        <TouchableOpacity 
          style={styles.pickerButton} // Stiller aşağıya eklendi
          onPress={() => setShowCityModal(true)} 
          disabled={isLoading}
        >
          <Text style={[styles.pickerButtonText, !city && styles.pickerPlaceholder]}>
            {city || 'İl Seçin...'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#888" />
        </TouchableOpacity>

        <Text style={styles.label}>E-posta (Değiştirilemez)</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={user?.email || ''}
          editable={false} 
        />
        
        {/* ... (Kaydet Butonu aynı) ... */}
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

      {/* --- GÜNCELLEME (5/5): Modal'ı JSX sonuna ekle --- */}
      <ModalSelect
        visible={showCityModal}
        title="İl Seçin"
        options={iller}
        selectedValue={city}
        onSelect={(value: string) => {
          setCity(value);
        }}
        onClose={() => setShowCityModal(false)}
      />
    </View>
  );
}

// Stiller
const styles = StyleSheet.create({
  // ... (container, scrollContent, avatar stilleri, input, vb. aynı) ...
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center', 
  },
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
  avatarPlaceholder: {},
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
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    alignSelf: 'flex-start',
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

  // --- GÜNCELLEME: modal.tsx'ten kopyalanan tüm stiller ---
  pickerButton: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50, // 'input' ile aynı
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20, // 'input' ile aynı
    width: '100%',
  },
  pickerButtonText: { 
    fontSize: 16, 
    color: '#333' 
  },
  pickerPlaceholder: { 
    color: '#888' 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'center', 
    padding: 20 
  },
  modalContainer: { 
    backgroundColor: '#FFFBF5', 
    borderRadius: 12,
    maxHeight: '80%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold',
    color: '#333',
  },
  modalOption: { 
    paddingVertical: 18, 
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f5f5f5' 
  },
  modalOptionSelected: { 
    backgroundColor: '#F97316' 
  },
  modalOptionText: { 
    fontSize: 18,
    color: '#333',
  },
  modalOptionTextSelected: { 
    color: '#fff' 
  },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    marginHorizontal: 15, 
    marginTop: 15, 
    height: 44, 
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 8, 
    fontSize: 16,
    color: '#333',
  },
});