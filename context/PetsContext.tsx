// context/PetsContext.tsx (Kurşun Geçirmez Sürüm)

import type { Pet } from '@/components/PetCard';
import { supabase } from '@/supabase';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
interface IPetsContext {
  pets: Pet[];
  loading: boolean;
  fetchPets: () => Promise<void>;
  addPet: (pet: Omit<Pet, 'id' | 'created_at' | 'contactName' | 'owner_id'>) => Promise<any>;
  updatePet: (petId: number, updatedData: Partial<Pet>) => Promise<any>;
  deletePet: (pet: Pet) => Promise<any>;
}

export const PetsContext = createContext<IPetsContext>({
  pets: [],
  loading: true,
  fetchPets: async () => {},
  addPet: async () => {},
  updatePet: async () => {},
  deletePet: async () => {},
});

export const PetsProvider = ({ children }: { children: ReactNode }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth(); 

  // Realtime dinleyici (Aynı)
  useEffect(() => {
    if (user && profile) {
      setLoading(true);
      fetchPets(); 
      const channel = supabase.channel('public:pets')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pets' },
          (payload) => {
            console.log('Pets tablosunda değişiklik algılandı, liste yenileniyor...');
            fetchPets();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    } else if (!user) {
      setPets([]);
      setLoading(false);
    }
  }, [user, profile]);

  // Tüm ilanları çeken fonksiyon
  const fetchPets = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select(`*, owner:profiles (display_name, photo_url)`)
        .order('created_at', { ascending: false }); 

      if (error) throw error;

      if (data) {
        // --- GÜÇLENDİRİLMİŞ DÜZELTME ---
        const formattedPets = data.map((pet: any) => {
          
          let gallery: string[] = []; // Boş bir galeri dizisi oluştur
          const rawGallery = pet.image_gallery; // e.g., "{url1,url2}" VEYA null VEYA ['url1']

          // 1. İdeal durum: Veri zaten bir diziyse (Array)
          if (Array.isArray(rawGallery) && rawGallery.length > 0) {
            gallery = rawGallery;
          
          // 2. Olası durum: Veri "{url1,url2}" gibi bir metin (string) ise
          } else if (typeof rawGallery === 'string' && rawGallery.startsWith('{') && rawGallery.endsWith('}')) {
            if (rawGallery === '{}') { // Boş galeri metni
              gallery = [];
            } else {
              // Metni "temizle" (parantezleri kaldır), tırnakları kaldır ve virgülle ayır
              gallery = rawGallery
                .substring(1, rawGallery.length - 1) // { } kaldır
                .replace(/"/g, '') // " tırnakları kaldır
                .split(','); // , ile ayır
            }
          
          // 3. Geriye dönük uyumluluk: Galeri hala boşsa ve eski 'image_url' varsa
          } else if (pet.image_url) {
            gallery = [pet.image_url];
          }
          
          // 4. 'pet' nesnesindeki 'image_gallery'yi DİZİ haliyle değiştir
          return {
            ...pet,
            image_gallery: gallery, 
            contactName: pet.owner?.display_name || 'Bilinmeyen',
          };
        }) as Pet[];
        // --- DÜZELTME BİTTİ ---
        
        setPets(formattedPets);
      }
    } catch (error: any) {
      console.error("Supabase ilanları çekerken hata:", error.message);
      Alert.alert("Hata", "İlanlar yüklenemedi.");
    } finally {
      setLoading(false); 
    }
  };
  
  // addPet, deletePet, updatePet (Aynı, değişiklik yok)
  // ... (Fonksiyonların geri kalanı aynı)
  const addPet = async (petToAdd: Omit<Pet, 'id' | 'created_at' | 'contactName' | 'owner_id'>) => {
    if (!user) throw new Error("İlan eklemek için giriş yapılmalı.");
    const newPetData = { ...petToAdd, owner_id: user.id, created_at: new Date().toISOString() };
    const { error } = await supabase.from('pets').insert([newPetData]);
    if (error) throw error;
  };
  
  const deletePet = async (petToDelete: Pet) => {
    if (!petToDelete.id) throw new Error("İlan ID'si bulunamadı.");
    try {
      const { error: dbError } = await supabase.from('pets').delete().eq('id', petToDelete.id);
      if (dbError) throw dbError; 
      // Not: Galerideki TÜM fotoları silmek için 'petToDelete.image_gallery'yi dönmek gerekir.
      if (petToDelete.image_url && petToDelete.image_url.includes('supabase')) {
        const pathParts = petToDelete.image_url.split('/pet-images/');
        if (pathParts.length > 1) {
          const filePath = pathParts[1];
          await supabase.storage.from('pet-images').remove([filePath]);
        }
      }
    } catch (error) { console.error("İlan silinirken hata:", error); throw new Error("İlan silinemedi."); }
  };

  const updatePet = async (petId: number, updatedData: Partial<Pet>) => {
    const { error } = await supabase.from('pets').update(updatedData).eq('id', petId);
    if (error) throw error; 
  };


  return (
    <PetsContext.Provider 
      value={{ pets, loading, fetchPets, addPet, deletePet, updatePet }}
    >
      {children}
    </PetsContext.Provider>
  );
};