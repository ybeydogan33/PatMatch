// app/modal.tsx (Çoklu Fotoğraf Sürümü)

import { ilceler, iller } from '@/constants/locationData';
import { useAuth } from '@/context/AuthContext';
import { PetsContext } from '@/context/PetsContext';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView, // ScrollView eklendi
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

const breedData = {
  kedi: ['Tekir', 'Siyam', 'Sarman', 'British Shorthair', 'Scottish Fold', 'Van Kedisi', 'Diğer...'],
  kopek: ['Alman Kurdu', 'Golden Retriever', 'Terrier', 'Pug', 'Fransız Bulldog', 'Labrador', 'Diğer...']
};

// 🔹 ModalSelect bileşeni (Arama özellikli)
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
                  onPress={() => { onSelect(item); setSearch(''); onClose(); }}
                >
                  <Text style={[styles.modalOptionText, item === selectedValue && styles.modalOptionTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
// ... (ModalSelect Bitişi)


export default function ModalScreen() {
  const router = useRouter();
  const { addPet } = useContext(PetsContext);
  const { user } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [animalType, setAnimalType] = useState<'kedi' | 'kopek' | null>(null);
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [purpose, setPurpose] = useState<'sahiplenme'>('sahiplenme');
  const [description, setDescription] = useState('');
  
  // --- YENİLİK (1/6): Tekil 'imageUri' state'ini 'imageUris' (dizi) olarak değiştirdik ---
  const [imageUris, setImageUris] = useState<string[]>([]);
  
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const isLoading = loadingMessage !== null;

  // Modal durumları
  const [showCityModal, setShowCityModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showBreedModal, setShowBreedModal] = useState(false);

  const availableDistricts = city ? ilceler[city] || [] : [];

  // --- YENİLİK (2/6): Fotoğraf seçme fonksiyonu güncellendi ---
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf yüklemek için galeri iznine ihtiyacımız var.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // allowsEditing: true, // Çoklu seçimde 'allowsEditing' kullanılamaz
      // aspect: [4, 3], // Çoklu seçimde bu da kullanılamaz
      quality: 0.7,
      allowsMultipleSelection: true, // Birden fazla seçimi etkinleştir
    });
    
    if (!result.canceled) {
      // 'result.assets' artık bir dizi
      const newUris = result.assets.map(asset => asset.uri);
      // Yeni seçilenleri mevcut listeye ekle
      setImageUris(prevUris => [...prevUris, ...newUris]);
    }
  };

  // --- YENİLİK (3/6): Seçilen bir fotoğrafı listeden kaldırma fonksiyonu ---
  const handleRemoveImage = (indexToRemove: number) => {
    setImageUris(prevUris => 
      prevUris.filter((_, index) => index !== indexToRemove)
    );
  };


  // uploadImageAsync fonksiyonu aynı (tek bir URI yükler, bu doğru)
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
          upsert: false,
        });

      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('pet-images').getPublicUrl(filePath);
      return publicUrl;
      
    } catch (error) {
      console.error("Supabase yükleme hatası (FormData):", error);
      throw error;
    }
  };

  // --- GÜNCELLEME (4/6): Form gönderme fonksiyonu güncellendi ---
  const handleSubmit = async () => {
    if (!user) return Alert.alert('Hata', 'İlan eklemek için giriş yapmalısınız.');
    // Validasyonu 'imageUris.length' olarak güncelle
    if (!name || !animalType || !breed || !age || !city || !district || !description || imageUris.length === 0)
      return Alert.alert('Hata', 'Tüm * alanları doldurun ve en az bir fotoğraf ekleyin.');

    try {
      // Yüklenecek fotoğrafların URL'lerini tutacak dizi
      const uploadedImageUrls: string[] = [];

      setLoadingMessage(`Fotoğraflar yükleniyor (0 / ${imageUris.length})`);

      // Tüm fotoğrafları tek tek yükle
      for (let i = 0; i < imageUris.length; i++) {
        const uri = imageUris[i];
        setLoadingMessage(`Fotoğraf yükleniyor (${i + 1} / ${imageUris.length})...`);
        const imageUrl = await uploadImageAsync(uri, user.id);
        uploadedImageUrls.push(imageUrl);
      }
      
      setLoadingMessage('İlan kaydediliyor...');
      
      await addPet({
        name,
        animal_type: animalType,
        breed,
        age: parseInt(age) || 0,
        type: purpose,
        description,
        // YENİ: Kapak fotoğrafı (ilk fotoğraf)
        image_url: uploadedImageUrls[0],
        // YENİ: Tüm fotoğrafların galerisi (DB'de 'image_gallery text[]' sütunu GEREKLİ)
        image_gallery: JSON.stringify(uploadedImageUrls),

        location: `${district}, ${city}`,
      } as any);
      
      setLoadingMessage(null);
      router.back();
    } catch (err: any) {
      setLoadingMessage(null);
      console.error("İlan eklenirken hata:", err.message);
      Alert.alert('Hata', 'İlan eklenirken bir sorun oluştu: ' + err.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <Text style={styles.label}>Evcil Hayvanın Adı *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Hayvan Türü *</Text>
        <View style={styles.selectorRow}>
          {['kedi', 'kopek'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.selectorButton, animalType === t && styles.selectorActive]}
              onPress={() => { setAnimalType(t as any); setBreed(''); }}
            >
              <Text style={[styles.selectorText, animalType === t && styles.selectorTextActive]}>
                {t === 'kedi' ? 'Kedi' : 'Köpek'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {animalType && (
          <>
            <Text style={styles.label}>Cins *</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowBreedModal(true)}>
              <Text style={[styles.pickerButtonText, !breed && styles.pickerPlaceholder]}>
                {breed || 'Bir cins seçin...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#888" />
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.label}>Amaç *</Text>
        <View style={styles.selectorRow}>
          {['sahiplenme', 'ciftlestirme'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.selectorButton, purpose === p && styles.selectorActive]}
              onPress={() => setPurpose(p as any)}
            >
              <Text style={[styles.selectorText, purpose === p && styles.selectorTextActive]}>
                {p === 'sahiplenme' ? 'Sahiplendirme' : 'Çiftleştirme'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Yaş *</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />

        <Text style={styles.label}>Konum *</Text>
        <View style={styles.manualLocationContainer}>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCityModal(true)}>
            <Text style={[styles.pickerButtonText, !city && styles.pickerPlaceholder]}>
              {city || 'İl Seçin...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerButton, !city && styles.pickerButtonDisabled]}
            onPress={() => setShowDistrictModal(true)}
            disabled={!city}
          >
            <Text style={[styles.pickerButtonText, !district && styles.pickerPlaceholder]}>
              {district || 'İlçe Seçin...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Açıklama *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          placeholder="Evcil hayvanınızı tanımlayın..."
        />

        {/* --- YENİLİK (5/6): Fotoğraf yükleme alanı güncellendi --- */}
        <Text style={styles.label}>Fotoğraflar *</Text>
        <ScrollView horizontal style={styles.imageScrollContainer} showsHorizontalScrollIndicator={false}>
          {/* Seçilen fotoğrafları map ile dön ve göster */}
          {imageUris.map((uri, index) => (
            <View key={index} style={styles.imageThumbnailContainer}>
              <Image source={{ uri: uri }} style={styles.imageThumbnail} />
              <TouchableOpacity 
                style={styles.removeButton} 
                onPress={() => handleRemoveImage(index)}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          
          {/* Yeni fotoğraf ekleme butonu */}
          <TouchableOpacity style={styles.addPhotoBoutton} onPress={pickImage}>
            <Ionicons name="camera" size={24} color="#555" />
            <Text style={styles.addPhotoText}>Ekle</Text>
          </TouchableOpacity>
        </ScrollView>
        {/* --- YENİLİK BİTTİ --- */}

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
              <Text style={styles.submitButtonText}>İlanı Kaydet</Text>
            )}
          </TouchableOpacity>
        </View>

        <StatusBar barStyle="dark-content" />
      </ScrollView>

      {/* Modallar */}
      <ModalSelect
        visible={showBreedModal}
        title="Cins Seçin"
        options={animalType ? breedData[animalType] : []}
        selectedValue={breed}
        onSelect={setBreed}
        onClose={() => setShowBreedModal(false)}
      />

      <ModalSelect
        visible={showCityModal}
        title="İl Seçin"
        options={iller}
        selectedValue={city}
        onSelect={(il: string) => { setCity(il); setDistrict(''); }} // İl değişince ilçeyi sıfırla
        onClose={() => setShowCityModal(false)}
      />

      <ModalSelect
        visible={showDistrictModal}
        title="İlçe Seçin"
        options={availableDistricts}
        selectedValue={district}
        onSelect={setDistrict}
        onClose={() => setShowDistrictModal(false)}
      />
    </View>
  );
}

// 🔹 Stiller
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  scrollContent: { padding: 20 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, height: 48, fontSize: 16, color: '#333', marginBottom: 10 },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12, marginBottom: 15 },
  selectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 10 },
  selectorButton: { flex: 1, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginHorizontal: 0 },
  selectorActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  selectorText: { fontSize: 16, color: '#555', fontWeight: 'bold' },
  selectorTextActive: { color: '#fff' },
  pickerButton: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flex: 1,
  },
  pickerButtonDisabled: { backgroundColor: '#f5f5ff', borderColor: '#eee' },
  pickerButtonText: { fontSize: 16, color: '#333' },
  pickerPlaceholder: { color: '#888' },
  manualLocationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  buttonRow:{ flexDirection:'row', justifyContent:'space-between', marginTop:20 },
  cancelButton:{ backgroundColor:'#e0e0e0', padding:15, borderRadius:8, alignItems:'center', width:'48%' },
  cancelButtonText:{ color:'#555', fontWeight:'bold', fontSize:16 },
  submitButton:{ backgroundColor:'#F97316', padding:15, borderRadius:8, alignItems:'center', width:'48%' },
  submitButtonText:{ color:'#fff', fontWeight:'bold', fontSize:16 },
  submitButtonDisabled:{ backgroundColor:'#F97316', opacity:0.7 },
  loadingRow:{ flexDirection:'row', alignItems:'center', justifyContent:'center' },
  loadingText:{ color:'#fff', fontWeight:'bold', fontSize:16, marginLeft: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 20 },
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  modalOption: { paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  modalOptionSelected: { backgroundColor: '#F97316' },
  modalOptionText: { fontSize: 18, color: '#333' },
  modalOptionTextSelected: { color: '#fff' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, marginHorizontal: 15, marginTop: 15, height: 44, borderWidth: 1, borderColor: '#ddd' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#333' },

  // --- YENİLİK (6/6): Çoklu fotoğraf galerisi için stiller ---
  imageScrollContainer: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  imageThumbnailContainer: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 8,
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F97316', // Turuncu
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFBF5', // Arkaplan rengi
  },
  addPhotoBoutton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  addPhotoText: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  },
});