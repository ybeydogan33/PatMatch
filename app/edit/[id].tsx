// app/edit/[id].tsx (TAM VE DÜZELTİLMİŞ HALİ - FormData ile Yükleme)

import type { Pet } from '@/components/PetCard';
import { useAuth } from '@/context/AuthContext';
import { PetsContext } from '@/context/PetsContext';
import { supabase } from '@/supabase';
import { Picker } from '@react-native-picker/picker'; // Eski (çirkin) Picker
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
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
// 1. YENİLİK: 'expo-file-system' ve 'base-64' importlarını SİLDİK.

const breedData = {
  kedi: ['Tekir', 'Siyam', 'Sarman', 'British Shorthair', 'Scottish Fold', 'Van Kedisi', 'Diğer...'],
  kopek: ['Alman Kurdu', 'Golden Retriever', 'Terrier', 'Pug', 'Fransız Bulldog', 'Labrador', 'Diğer...']
};

export default function EditPetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { pets, updatePet } = useContext(PetsContext); 
  const { id } = useLocalSearchParams();
  const petToEdit = pets.find(p => p.id === Number(id));

  // --- Form State'leri ---
  const [name, setName] = useState('');
  const [animalType, setAnimalType] = useState<'kedi' | 'kopek' | null>(null);
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [purpose, setPurpose] = useState<'sahiplenme' | 'ciftlestirme'>('sahiplenme');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null); // Bu, yeni seçilen veya mevcut olan URI
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const isLoading = loadingMessage !== null;

  // Veri yüklendiğinde state'leri doldur
  useEffect(() => {
    if (petToEdit) {
      setName(petToEdit.name || '');
      setAnimalType(petToEdit.animal_type || null);
      setBreed(petToEdit.breed || '');
      setAge(petToEdit.age ? petToEdit.age.toString() : '');
      setPurpose(petToEdit.type || 'sahiplenme');
      setDescription(petToEdit.description || '');
      setImageUri(petToEdit.image_url || null);
      setLocation(petToEdit.location || ''); 
    }
  }, [petToEdit]); 

  // Fotoğraf seçme (TAM HALİ)
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin Gerekli', '...'); return; }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled) { setImageUri(result.assets[0].uri); }
  };
  
  // 2. DÜZELTME: Fotoğrafı 'FormData' kullanarak yükleme
  const uploadImageAsync = async (uri: string, userId: string): Promise<string> => {
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`; 
      const mimeType = `image/${fileExt === 'png' ? 'png' : 'jpeg'}`;

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: mimeType,
      } as any);

      const { data, error } = await supabase.storage
        .from('pet-images')
        .upload(filePath, formData, {
          upsert: true, // Düzenleme olduğu için 'true'
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('pet-images')
        .getPublicUrl(filePath);
        
      return publicUrl;
      
    } catch (error) {
      console.error("Supabase yükleme hatası (FormData):", error);
      throw error;
    }
  };

  // Değişiklikleri Kaydetme (TAM HALİ)
  const handleSubmit = async () => { 
    if (!user || !petToEdit?.id) {
      Alert.alert('Hata', 'İlan bilgileri bulunamadı.');
      return;
    }
    
    if (!name || !animalType || !breed || !age || !description || !location) {
      Alert.alert('Hata', 'Lütfen * ile işaretli zorunlu alanları doldurun.');
      return;
    }
    
    setLoadingMessage("Değişiklikler Kaydediliyor...");

    try {
      const updatedData: Partial<Pet> = { 
        name: name,
        animal_type: animalType,
        breed: breed,
        age: parseInt(age) || 0,
        description: description,
        type: purpose,
        location: location,
      };

      // FOTOĞRAF GÜNCELLEME KONTROLÜ
      if (imageUri && imageUri !== petToEdit.image_url) {
        setLoadingMessage("Yeni Fotoğraf Yükleniyor...");
        const newPermanentUrl = await uploadImageAsync(imageUri, user.id);
        updatedData.image_url = newPermanentUrl; 

        if (petToEdit.image_url && petToEdit.image_url.includes('supabase')) {
          const pathParts = petToEdit.image_url.split('/pet-images/');
          if (pathParts.length > 1) {
            const oldFilePath = pathParts[1];
            // Eski fotoğrafı sil (Hata verirse önemli değil)
            try {
              await supabase.storage.from('pet-images').remove([oldFilePath]);
            } catch (e) {
              console.warn("Eski fotoğraf silinemedi:", e);
            }
          }
        }
      }

      setLoadingMessage("Veritabanı Güncelleniyor...");
      await updatePet(Number(petToEdit.id), updatedData); 
      
      setLoadingMessage(null); 
      router.back(); 

    } catch (error: any) {
      setLoadingMessage(null); 
      console.error("İlan güncellenirken hata:", error.message);
      Alert.alert('Hata', 'İlan güncellenirken bir sorun oluştu.');
    }
  };
  
  if (!petToEdit) {
    return ( <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}> <ActivityIndicator size="large" color="#F97316" /> <Text>İlan bilgileri yükleniyor...</Text> </SafeAreaView> );
  }

  // JSX ARAYÜZÜ (TAM HALİ)
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
        
        <Text style={styles.label}>Fotoğraf (Değiştirmek için dokunun)</Text>
        <TouchableOpacity style={styles.imageUploadArea} onPress={pickImage} disabled={isLoading}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <Text>Fotoğraf Yok</Text>
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
                <Text style={styles.loadingText}>{loadingMessage || 'Kaydediliyor...'}</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Değişiklikleri Kaydet</Text>
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