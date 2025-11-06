import type { Pet } from '@/components/PetCard';
import { ilceler, iller } from '@/constants/locationData';
import { useAuth } from '@/context/AuthContext';
import { PetsContext } from '@/context/PetsContext';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
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
import { SafeAreaView } from 'react-native-safe-area-context';

const breedData = {
  kedi: ['Tekir', 'Siyam', 'Sarman', 'British Shorthair', 'Scottish Fold', 'Van Kedisi', 'Diğer...'],
  kopek: ['Alman Kurdu', 'Golden Retriever', 'Terrier', 'Pug', 'Fransız Bulldog', 'Labrador', 'Diğer...']
};

const ModalSelect = ({ visible, title, options, selectedValue, onSelect, onClose }: any) => {
  const [search, setSearch] = useState('');
  const filtered = options.filter((item: string) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
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
                  onPress={() => { onSelect(item); onClose(); }}
                >
                  <Text style={[styles.modalOptionText, item === selectedValue && styles.modalOptionTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default function EditPetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { pets, updatePet } = useContext(PetsContext);

  const petToEdit = pets.find(p => p.id === Number(id));

  // --- Form State'leri ---
  const [name, setName] = useState('');
  const [animalType, setAnimalType] = useState<'kedi' | 'kopek' | null>(null);
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState<'sahiplenme' | 'ciftlestirme'>('sahiplenme');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [selectedIl, setSelectedIl] = useState<string | null>(null);
  const [selectedIlce, setSelectedIlce] = useState<string | null>(null);

  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const isLoading = loadingMessage !== null;

  const [showBreedModal, setShowBreedModal] = useState(false);
  const [showIlModal, setShowIlModal] = useState(false);
  const [showIlceModal, setShowIlceModal] = useState(false);

  // Pet verisi yüklendiğinde state'leri doldur
  useEffect(() => {
    if (!petToEdit) return;

    setName(petToEdit.name || '');
    setAnimalType(petToEdit.animal_type || null);
    setBreed(petToEdit.breed || '');
    setAge(petToEdit.age?.toString() || '');
    setDescription(petToEdit.description || '');
    setPurpose(petToEdit.type || 'sahiplenme');
    setImageUri(petToEdit.image_url || '');

    if (petToEdit.location) {
      const parts = petToEdit.location.split(', ');
      if (parts.length === 2) {
        setSelectedIlce(parts[0]);
        setSelectedIl(parts[1]);
      } else if (parts.length === 1) {
        setSelectedIl(parts[0]);
      }
    }
  }, [petToEdit]);

  // Fotoğraf seç
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('İzin Gerekli', 'Fotoğraf yüklemek için galeri iznine ihtiyacımız var.');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // Supabase'e yükleme
  const uploadImageAsync = async (uri: string, userId: string): Promise<string> => {
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const raw = atob(base64);
    const array = new Uint8Array(new ArrayBuffer(raw.length));
    for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i);
    const { error } = await supabase.storage.from('pet-images').upload(filePath, array, { contentType: `image/${fileExt}`, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('pet-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Değişiklikleri kaydet
  const handleSubmit = async () => {
    if (!petToEdit || !user) return;

    if (!name || !animalType || !breed || !age || !description || !selectedIl || !selectedIlce) {
      return Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
    }

    setLoadingMessage('Güncelleniyor...');

    try {
      const updatedData: Partial<Pet> = {
        name,
        animal_type: animalType,
        breed,
        age: parseInt(age) || 0,
        type: purpose,
        description,
        location: `${selectedIlce}, ${selectedIl}`,
      };

      if (imageUri && imageUri !== petToEdit.image_url) {
        setLoadingMessage('Yeni Fotoğraf Yükleniyor...');
        const newUrl = await uploadImageAsync(imageUri, user.id);
        updatedData.image_url = newUrl;

        if (petToEdit.image_url?.includes('supabase')) {
          const pathParts = petToEdit.image_url.split('/pet-images/');
          if (pathParts.length > 1) {
            await supabase.storage.from('pet-images').remove([pathParts[1]]);
          }
        }
      }

      await updatePet(Number(petToEdit.id), updatedData);
      setLoadingMessage(null);
      router.back();
    } catch (error: any) {
      console.error('Hata:', error);
      setLoadingMessage(null);
      Alert.alert('Hata', 'Güncelleme sırasında bir sorun oluştu.');
    }
  };

  if (!petToEdit) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text>İlan bilgileri yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Evcil Hayvanın Adı *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} editable={!isLoading} />

        <Text style={styles.label}>Hayvan Türü *</Text>
        <View style={styles.selectorRow}>
          {(['kedi','kopek'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.selectorButton, animalType === type && styles.selectorActive]}
              onPress={() => { setAnimalType(type); setBreed(''); }}
              disabled={isLoading}
            >
              <Text style={[styles.selectorText, animalType === type && styles.selectorTextActive]}>
                {type === 'kedi' ? 'Kedi' : 'Köpek'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {animalType && (
          <>
            <Text style={styles.label}>Cins *</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowBreedModal(true)}>
              <Text style={[styles.pickerButtonText, !breed && styles.pickerPlaceholder]}>{breed || 'Cins Seçin...'}</Text>
              <Ionicons name="chevron-down" size={20} color="#888" />
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.label}>Amaç *</Text>
        <View style={styles.selectorRow}>
          {(['sahiplenme','ciftlestirme'] as const).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.selectorButton, purpose === p && styles.selectorActive]}
              onPress={() => setPurpose(p)}
              disabled={isLoading}
            >
              <Text style={[styles.selectorText, purpose === p && styles.selectorTextActive]}>
                {p==='sahiplenme' ? 'Sahiplendirme' : 'Çiftleştirme'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Yaş (yıl) *</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} editable={!isLoading} />

        <Text style={styles.label}>Konum *</Text>
        <View style={styles.selectorRow}>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowIlModal(true)}>
            <Text style={[styles.pickerButtonText, !selectedIl && styles.pickerPlaceholder]}>{selectedIl || 'İl Seçin...'}</Text>
            <Ionicons name="chevron-down" size={20} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pickerButton, !selectedIl && styles.pickerButtonDisabled]} onPress={() => setShowIlceModal(true)} disabled={!selectedIl}>
            <Text style={[styles.pickerButtonText, !selectedIlce && styles.pickerPlaceholder]}>{selectedIlce || 'İlçe Seçin...'}</Text>
            <Ionicons name="chevron-down" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Açıklama *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline numberOfLines={4} value={description} onChangeText={setDescription} editable={!isLoading}
        />

        <Text style={styles.label}>Fotoğraf</Text>
        <TouchableOpacity style={styles.imageUploadArea} onPress={pickImage} disabled={isLoading}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.imagePreview} /> : <Text>Fotoğraf Yok</Text>}
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
            ) : <Text style={styles.submitButtonText}>Değişiklikleri Kaydet</Text>}
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
        visible={showIlModal}
        title="İl Seçin"
        options={iller}
        selectedValue={selectedIl}
        onSelect={(il: string) => { setSelectedIl(il); setSelectedIlce(null); }}
        onClose={() => setShowIlModal(false)}
      />

      <ModalSelect
        visible={showIlceModal}
        title="İlçe Seçin"
        options={selectedIl ? ilceler[selectedIl] : []}
        selectedValue={selectedIlce}
        onSelect={setSelectedIlce}
        onClose={() => setShowIlceModal(false)}
      />
    </View>
  );
}

// Stil
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5', paddingTop: Platform.OS==='android'?StatusBar.currentHeight:0 },
  scrollContent: { padding: 20 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, height: 48, fontSize: 16, color: '#333', marginBottom: 10 },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top', marginBottom: 15 },
  selectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  selectorButton: { flex: 1, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginHorizontal: 4 },
  selectorActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  selectorText: { fontSize: 16, color: '#555', fontWeight: 'bold' },
  selectorTextActive: { color: '#fff' },
  pickerButton: { flex:1, backgroundColor:'#fff', borderColor:'#ddd', borderWidth:1, borderRadius:8, paddingHorizontal:15, height:48, flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  pickerButtonDisabled: { backgroundColor:'#f5f5ff', borderColor:'#eee' },
  pickerButtonText:{ fontSize:16,color:'#333' },
  pickerPlaceholder:{ color:'#888' },
  imageUploadArea:{ backgroundColor:'#fff', borderColor:'#ddd', borderWidth:1, borderStyle:'dashed', borderRadius:8, alignItems:'center', justifyContent:'center', paddingVertical:30, marginBottom:20, height:200 },
  imagePreview:{ width:'100%', height:'100%', borderRadius:8, resizeMode:'cover' },
  buttonRow:{ flexDirection:'row', justifyContent:'space-between', marginTop:20 },
  cancelButton:{ backgroundColor:'#e0e0e0', padding:15, borderRadius:8, alignItems:'center', width:'48%' },
  cancelButtonText:{ color:'#555', fontWeight:'bold', fontSize:16 },
  submitButton:{ backgroundColor:'#F97316', padding:15, borderRadius:8, alignItems:'center', width:'48%' },
  submitButtonText:{ color:'#fff', fontWeight:'bold', fontSize:16 },
  submitButtonDisabled:{ backgroundColor:'#F97316', opacity:0.7 },
  loadingRow:{ flexDirection:'row', alignItems:'center', justifyContent:'center' },
  loadingText:{ color:'#fff', fontWeight:'bold', fontSize:16 },
  loadingContainer:{ flex:1, justifyContent:'center', alignItems:'center' },

  modalOverlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.3)', justifyContent:'center' },
  modalContainer:{ backgroundColor:'#FFFBF5', marginHorizontal:20, borderRadius:8, maxHeight:'80%' },
  modalHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:15, borderBottomWidth:1, borderBottomColor:'#eee' },
  modalTitle:{ fontSize:18,fontWeight:'bold' },
  modalOption:{ padding:15, borderBottomWidth:1, borderBottomColor:'#f5f5f5' },
  modalOptionSelected:{ backgroundColor:'#F97316' },
  modalOptionText:{ fontSize:16 },
  modalOptionTextSelected:{ color:'#fff', fontWeight:'bold' },
  searchBox:{ flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:8, paddingHorizontal:10, margin:10, height:40 },
  searchInput:{ flex:1, marginLeft:5, fontSize:16 },
});
