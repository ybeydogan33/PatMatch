// app/modal.tsx (FOTOĞRAF YÜKLEME EKLENMİŞ HALİ)

import type { Pet } from '@/components/PetCard';
import { PetsContext } from '@/context/PetsContext';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
  Alert,
  Image // 1. YENİLİK: Image bileşenini import ettik (önizleme için)
  ,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// 2. YENİLİK: Image Picker kütüphanesini import ettik
import * as ImagePicker from 'expo-image-picker';

const breedData = {
  kedi: ['Tekir', 'Siyam', 'Sarman', 'British Shorthair', 'Scottish Fold', 'Van Kedisi', 'Diğer...'],
  kopek: ['Alman Kurdu', 'Golden Retriever', 'Terrier', 'Pug', 'Fransız Bulldog', 'Labrador', 'Diğer...']
};

export default function ModalScreen() {
  const router = useRouter();
  const { addPet } = useContext(PetsContext);

  // --- Form State'leri ---
  const [name, setName] = useState('');
  const [animalType, setAnimalType] = useState<'kedi' | 'kopek' | null>(null);
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [purpose, setPurpose] = useState<'sahiplenme'>('sahiplenme');
  const [description, setDescription] = useState('');
  // 3. YENİLİK: Seçilen resmin dosya yolunu (URI) tutmak için state
  const [imageUri, setImageUri] = useState<string | null>(null);
  // -------------------------

  // 4. YENİLİK: Galeriden resim seçme fonksiyonu
  const pickImage = async () => {
    // Galeriyi açmadan önce izin istememiz gerekiyor
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Üzgünüz, fotoğraf yüklemek için galeri iznine ihtiyacımız var.');
      return;
    }

    // Galeriyi aç
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Sadece resimler
      allowsEditing: true, // Kullanıcıya resmi kırpma/döndürme imkanı ver
      aspect: [4, 3], // 4:3 en boy oranı
      quality: 0.8, // Resim kalitesi (dosya boyutunu küçültür)
    });

    if (!result.canceled) {
      // 'assets' dizisindeki ilk (ve tek) resmi al
      setImageUri(result.assets[0].uri);
    }
  };


  const handleSubmit = () => {
    // 5. YENİLİK: Doğrulamaya 'imageUri' eklendi
    if (!name || !animalType || !breed || !age || !description || !imageUri) {
      Alert.alert('Hata', 'Lütfen fotoğraf dahil tüm * ile işaretli zorunlu alanları doldurun.');
      return;
    }

    const newPet: Pet = {
      id: Date.now().toString(),
      name: name,
      animalType: animalType,
      breed: breed,
      age: parseInt(age) || 0,
      description: description,
      contactName: 'Yavuz', 
      type: purpose,
      // 6. YENİLİK: imageUrl'i yer tutucu yerine seçilen resimle (imageUri) doldur
      imageUrl: imageUri 
    };

    addPet(newPet);
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* ... (Adı, Hayvan Türü, Cins, Amaç, Yaş, Konum alanları aynı) ... */}
        
        {/* Evcil Hayvan Adı */}
        <Text style={styles.label}>Evcil Hayvanın Adı *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        {/* Hayvan Türü Seçici (Kedi/Köpek) */}
        <Text style={styles.label}>Hayvan Türü *</Text>
        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={[styles.selectorButton, animalType === 'kedi' && styles.selectorActive]}
            onPress={() => { setAnimalType('kedi'); setBreed(breedData.kedi[0]); }}
          >
            <Text style={[styles.selectorText, animalType === 'kedi' && styles.selectorTextActive]}>Kedi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectorButton, animalType === 'kopek' && styles.selectorActive]}
            onPress={() => { setAnimalType('kopek'); setBreed(breedData.kopek[0]); }}
          >
            <Text style={[styles.selectorText, animalType === 'kopek' && styles.selectorTextActive]}>Köpek</Text>
          </TouchableOpacity>
        </View>

        {/* Koşullu Cins (Tür) Seçici (Picker) */}
        {animalType && (
          <>
            <Text style={styles.label}>Cins *</Text>
            <View style={styles.pickerContainer}> 
              <Picker
                selectedValue={breed}
                onValueChange={(itemValue) => setBreed(itemValue)}
                style={styles.picker}
              >
                {breedData[animalType].map((b) => (
                  <Picker.Item key={b} label={b} value={b} />
                ))}
              </Picker>
            </View>
          </>
        )}

        {/* Amaç Seçici (Sahiplenme/Çiftleştirme) */}
        <Text style={styles.label}>Amaç *</Text>
        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={[styles.selectorButton, purpose === 'sahiplenme' && styles.selectorActive]}
            onPress={() => setPurpose('sahiplenme')}
          >
            <Text style={[styles.selectorText, purpose === 'sahiplenme' && styles.selectorTextActive]}>Sahiplendirme</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectorButton, purpose === 'ciftlestirme' && styles.selectorActive]}
            onPress={() => setPurpose('ciftlestirme')}
          >
            <Text style={[styles.selectorText, purpose === 'ciftlestirme' && styles.selectorTextActive]}>Çiftleştirme</Text>
          </TouchableOpacity>
        </View>

        {/* Yaş ve Konum Alanları */}
        <Text style={styles.label}>Yaş (yıl) *</Text>
        <TextInput 
          style={styles.input} 
          keyboardType="numeric"
          value={age}
          onChangeText={setAge} 
        />
        <Text style={styles.label}>Konum</Text>
        <TextInput 
          style={styles.input}
          value={location}
          onChangeText={setLocation} 
        />
        
        {/* Açıklama Alanı */}
        <Text style={styles.label}>Açıklama *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline 
          numberOfLines={4}
          placeholder="Evcil hayvanınızı tanımlayın..."
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription} 
        />

        {/* ... (AI Butonu aynı) ... */}
        <TouchableOpacity style={styles.aiButton}>
          <Ionicons name="sparkles-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.aiButtonText}>Yapay Zeka ile Oluştur</Text>
        </TouchableOpacity>


        {/* 7. YENİLİK: Fotoğraf Yükleme Bölümü (Güncellendi) */}
        <Text style={styles.label}>Fotoğraf *</Text>
        {/* Butonun 'onPress'ine 'pickImage' fonksiyonunu ekledik */}
        <TouchableOpacity style={styles.imageUploadArea} onPress={pickImage}>
          {imageUri ? (
            // Eğer resim seçildiyse: Önizlemeyi göster
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            // Eğer resim seçilmediyse: Yükleme ikonunu göster
            <>
              <Ionicons name="cloud-upload-outline" size={30} color="#888" />
              <Text style={styles.imageUploadText}>Fotoğraf Seçmek İçin Dokunun</Text>
              <Text style={styles.imageUploadHint}>PNG, JPG - 10MB'a kadar</Text>
            </>
          )}
        </TouchableOpacity>


        {/* Kaydet / İptal Butonları */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Evcil Hayvan Ekle</Text>
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
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  selectorButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectorActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  selectorText: {
    fontSize: 16,
    color: '#555',
    fontWeight: 'bold',
  },
  selectorTextActive: {
    color: '#fff',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    height: Platform.OS === 'ios' ? 120 : 50,
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 120 : 50,
    width: '100%',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  aiButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imageUploadArea: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    marginBottom: 20,
    height: 200, // Önizleme için sabit bir yükseklik
  },
  imageUploadText: {
    fontSize: 15,
    color: '#555',
    marginTop: 8,
  },
  imageUploadHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  // 8. YENİLİK: Resim önizlemesi için stil
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '48%',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#F97316',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '48%',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});