// app/profile/edit.tsx (TAM VE DÜZELTİLMİŞ SUPABASE SÜRÜMÜ)

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
  const { user, profile } = useAuth(); 

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [imageUri, setImageUri] = useState<string | null>(profile?.photo_url || null);
  
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const isLoading = loadingMessage !== null;

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
        // (Not: Supabase 'upsert: true' kullandığı için eski fotoğrafı silmemize gerek yok, üzerine yazar)
      }
      
      setLoadingMessage("Veritabanı Kaydediliyor...");
      
      const updates = {
        display_name: displayName.trim(),
        photo_url: newPhotoURL,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id); 
        
      if (error) throw error;
      
      setLoadingMessage(null);
      Alert.alert("Başarılı", "Profiliniz güncellendi.");
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

        <Text style={styles.label}>E-posta (Değiştirilemez)</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={user?.email || ''}
          editable={false} 
        />

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

// Stiller (TAM HALİ)
const styles = StyleSheet.create({
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
});