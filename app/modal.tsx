// app/modal.tsx (TAM VE DÜZELTİLMİŞ SUPABASE SÜRÜMÜ)

import { useAuth } from '@/context/AuthContext';
import { PetsContext } from '@/context/PetsContext';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // Eski (çirkin) Picker
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
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

// 1. DOĞRU İMPORTLAR:
import { decode } from 'base-64'; // base-64 paketinden 'decode'
import * as FileSystem from 'expo-file-system/legacy';

const breedData = {
  kedi: ['Tekir', 'Siyam', 'Sarman', 'British Shorthair', 'Scottish Fold', 'Van Kedisi', 'Diğer...'],
  kopek: ['Alman Kurdu', 'Golden Retriever', 'Terrier', 'Pug', 'Fransız Bulldog', 'Labrador', 'Diğer...']
};

export default function ModalScreen() {
  const router = useRouter();
  const { addPet } = useContext(PetsContext); 
  const { user } = useAuth(); 

  // --- Form State'leri ---
  const [name, setName] = useState('');
  const [animalType, setAnimalType] = useState<'kedi' | 'kopek' | null>(null);
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [purpose, setPurpose] = useState<'sahiplenme'>('sahiplenme');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const isLoading = loadingMessage !== null;
  
  // Fotoğraf seçme (TAM HALİ)
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Üzgünüz, fotoğraf yüklemek için galeri iznine ihtiyacımız var.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [4, 3], 
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };
  
  // 2. DÜZELTME: Fotoğrafı Supabase Storage'a 'expo-file-system' (ArrayBuffer) ile yükleme
  const uploadImageAsync = async (uri: string, userId: string): Promise<string> => {
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`; 

      // 1. Dosyayı base64 olarak oku
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64", // 'EncodingType.Base64' yerine
      });

      // 2. base64'ü Supabase'in beklediği ArrayBuffer'a çevir
      const raw = decode(base64);
      const rawLength = raw.length;
      const array = new Uint8Array(new ArrayBuffer(rawLength));
      for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      
      // 3. Supabase Storage'a yükle ('pet-images' kovasına)
      const { data, error } = await supabase.storage
        .from('pet-images')
        .upload(filePath, array, { // 'array' (ArrayBuffer)
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
          upsert: false,
        });

      if (error) throw error;

      // 4. Yüklenen dosyanın kalıcı URL'ini al
      const { data: { publicUrl } } = supabase.storage
        .from('pet-images')
        .getPublicUrl(filePath);
        
      return publicUrl;
      
    } catch (error) {
      console.error("Supabase yükleme hatası:", error);
      throw error;
    }
  };

  // Formu gönderme (TAM HALİ)
  const handleSubmit = async () => { 
    if (!user) {
      Alert.alert('Hata', 'İlan eklemek için giriş yapmış olmalısınız.');
      return;
    }
    
    if (!name || !animalType || !breed || !age || !description || !imageUri || !location) {
      Alert.alert('Hata', 'Lütfen konum dahil tüm * ile işaretli zorunlu alanları doldurun.');
      return;
    }
    
    try {
      setLoadingMessage("Fotoğraf Yükleniyor...");
      const permanentImageUrl = await uploadImageAsync(imageUri, user.id);

      setLoadingMessage("İlan Kaydediliyor...");

      const newPet = { 
        name: name,
        animal_type: animalType,
        breed: breed,
        age: parseInt(age) || 0,
        description: description,
        type: purpose,
        image_url: permanentImageUrl,
        location: location,
      };

      await addPet(newPet as any); 
      setLoadingMessage(null); 
      router.back(); 

    } catch (error: any) {
      setLoadingMessage(null); 
      console.error("İlan eklenirken hata:", error.message);
      Alert.alert('Hata', 'İlan eklenirken bir sorun oluştu: ' + error.message);
    }
  };
  

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <Text style={styles.label}>Evcil Hayvanın Adı *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} disabled={isLoading} />

        <Text style={styles.label}>Hayvan Türü *</Text>
        <View style={styles.selectorRow}>
          <TouchableOpacity style={[styles.selectorButton, animalType === 'kedi' && styles.selectorActive]} onPress={() => { setAnimalType('kedi'); setBreed(breedData.kedi[0]); }} disabled={isLoading}>
            <Text style={[styles.selectorText, animalType === 'kedi' && styles.selectorTextActive]}>Kedi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.selectorButton, animalType === 'kopek' && styles.selectorActive]} onPress={() => { setAnimalType('kopek'); setBreed(breedData.kopek[0]); }} disabled={isLoading}>
            <Text style={[styles.selectorText, animalType === 'kopek' && styles.selectorTextActive]}>Köpek</Text>
          </TouchableOpacity>
        </View>
        
        {animalType && (
          <>
            <Text style={styles.label}>Cins *</Text>
            <View style={styles.pickerContainer}> 
              <Picker
                selectedValue={breed}
                onValueChange={(itemValue) => setBreed(itemValue)}
                style={styles.picker}
                enabled={!isLoading}
              >
                {breedData[animalType].map((b) => (
                  <Picker.Item key={b} label={b} value={b} />
                ))}
              </Picker>
            </View>
          </>
        )}

        <Text style={styles.label}>Amaç *</Text>
        <View style={styles.selectorRow}>
          <TouchableOpacity style={[styles.selectorButton, purpose === 'sahiplenme' && styles.selectorActive]} onPress={() => setPurpose('sahiplenme')} disabled={isLoading}>
            <Text style={[styles.selectorText, purpose === 'sahiplenme' && styles.selectorTextActive]}>Sahiplendirme</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.selectorButton, purpose === 'ciftlestirme' && styles.selectorActive]} onPress={() => setPurpose('ciftlestirme')} disabled={isLoading}>
            <Text style={[styles.selectorText, purpose === 'ciftlestirme' && styles.selectorTextActive]}>Çiftleştirme</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Yaş (yıl) *</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} disabled={isLoading} />
        
        <Text style={styles.label}>Konum *</Text>
        <TextInput 
          style={styles.input} 
          value={location} 
          onChangeText={setLocation} 
          placeholder="örn: Kadıköy, İstanbul"
          disabled={isLoading} 
        />
        
        <Text style={styles.label}>Açıklama *</Text>
        <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={4} placeholder="Evcil hayvanınızı tanımlayın..." value={description} onChangeText={setDescription} disabled={isLoading} />
        
        <Text style={styles.label}>Fotoğraf *</Text>
        <TouchableOpacity style={styles.imageUploadArea} onPress={pickImage} disabled={isLoading}>
          {imageUri ? ( <Image source={{ uri: imageUri }} style={styles.imagePreview} /> ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={30} color="#888" />
              <Text style={styles.imageUploadText}>Fotoğraf Seçmek İçin Dokunun</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isLoading}>
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingText}>{loadingMessage}</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Evcil Hayvan Ekle</Text>
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
  container: { flex: 1, backgroundColor: '#FFFBF5', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  scrollContent: { padding: 20 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 48, fontSize: 16, color: '#333', marginBottom: 10 },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top', marginBottom: 15 },
  selectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  selectorButton: { flex: 1, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginHorizontal: 4 },
  selectorActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  selectorText: { fontSize: 16, color: '#555', fontWeight: 'bold' },
  selectorTextActive: { color: '#fff' },
  pickerContainer: { backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, justifyContent: 'center', height: Platform.OS === 'ios' ? 120 : 50, marginBottom: 10, overflow: 'hidden' },
  picker: { height: Platform.OS === 'ios' ? 120 : 50, width: '100%' },
  imageUploadArea: { backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 30, marginBottom: 20, height: 200 },
  imageUploadText: { fontSize: 15, color: '#555', marginTop: 8 },
  imageUploadHint: { fontSize: 12, color: '#888', marginTop: 4 },
  imagePreview: { width: '100%', height: '100%', borderRadius: 8, resizeMode: 'cover' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelButton: { backgroundColor: '#e0e0e0', padding: 15, borderRadius: 8, alignItems: 'center', width: '48%' },
  cancelButtonText: { color: '#555', fontWeight: 'bold', fontSize: 16 },
  submitButton: { backgroundColor: '#F97316', padding: 15, borderRadius: 8, alignItems: 'center', width: '48%' },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  submitButtonDisabled: { backgroundColor: '#F97316', opacity: 0.7 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
});