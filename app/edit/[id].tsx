// app/edit/[id].tsx (TEMİZLENMİŞ HALİ - Yapay Zeka kaldırıldı)

import { useAuth } from '@/context/AuthContext';
import { PetsContext } from '@/context/PetsContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

const breedData = {
  kedi: ['Tekir', 'Siyam', 'Sarman', 'British Shorthair', 'Scottish Fold', 'Van Kedisi', 'Diğer...'],
  kopek: ['Alman Kurdu', 'Golden Retriever', 'Terrier', 'Pug', 'Fransız Bulldog', 'Labrador', 'Diğer...']
};

export default function EditPetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { pets, updatePet } = useContext(PetsContext); 
  const { id } = useLocalSearchParams();
  const petToEdit = pets.find(p => p.id === id);

  // --- Form State'leri ---
  const [name, setName] = useState('');
  const [animalType, setAnimalType] = useState<'kedi' | 'kopek' | null>(null);
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [purpose, setPurpose] =useState<'sahiplenme' | 'ciftlestirme'>('sahiplenme');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null); 
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const isLoading = loadingMessage !== null;

  // AI state'i KALDIRILDI
  
  // ... (useEffect, pickImage, uploadImageAsync, handleSubmit fonksiyonları aynı,
  // SADECE handleSubmit içinden AI mantığı kaldırıldı) ...
  
  useEffect(() => {
    if (petToEdit) {
      setName(petToEdit.name || '');
      setAnimalType(petToEdit.animalType || null);
      setBreed(petToEdit.breed || '');
      setAge(petToEdit.age ? petToEdit.age.toString() : '');
      setPurpose(petToEdit.type || 'sahiplenme');
      setDescription(petToEdit.description || '');
      setImageUri(petToEdit.imageUrl || null);
      setLocation(petToEdit.location || '');
    }
  }, [petToEdit]); 
  
  const pickImage = async () => { /* ... (kod aynı) ... */ };
  const uploadImageAsync = async (uri: string, userId: string) => { /* ... (kod aynı) ... */ };
  const handleSubmit = async () => { /* ... (kod aynı, AI mantığı yok) ... */ };

  
  if (!petToEdit) {
    return ( <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}> <ActivityIndicator size="large" color="#F97316" /> <Text>İlan bilgileri yükleniyor...</Text> </SafeAreaView> );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* ... (Ad, Tür, Cins, Amaç, Yaş, Konum alanları aynı) ... */}
        
        <Text style={styles.label}>Açıklama *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline 
          numberOfLines={4}
          placeholder="Evcil hayvanınızı tanımlayın..." // Placeholder güncellendi
          value={description}
          onChangeText={setDescription} 
          disabled={isLoading}
        />
        
        {/* YAPAY ZEKA BUTONU BURADAN KALDIRILDI */}

        {/* Fotoğraf Alanı (Güncellenebilir) */}
        <Text style={styles.label}>Fotoğraf (Değiştirmek için dokunun)</Text>
        <TouchableOpacity style={styles.imageUploadArea} onPress={pickImage} disabled={isLoading}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <Text>Fotoğraf Yok</Text>
          )}
        </TouchableOpacity>

        {/* Kaydet / İptal Butonları */}
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

// Stiller
const styles = StyleSheet.create({
  // ... (Tüm stillerinizi koruyun) ...
  // Lütfen 'aiButton', 'aiButtonText' ve 'aiButtonDisabled' stillerini SİLİN.
  
  // ... (Geri kalan tüm stiller aynı) ...
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