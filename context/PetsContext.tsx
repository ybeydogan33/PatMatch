// context/PetsContext.tsx (SON HALİ - Realtime Düzeltmesi)

import type { Pet } from '@/components/PetCard';
import { supabase } from '@/supabase';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

// Context arayüzümüz
interface IPetsContext {
  pets: Pet[];
  loading: boolean;
  fetchPets: () => Promise<void>; // Yenileme fonksiyonu
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

// Provider bileşenimiz
export const PetsProvider = ({ children }: { children: ReactNode }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth(); 

  // 1. DÜZELTME: Veritabanını Sadece Bir Kez Değil, ANLIK (Realtime) Dinleme
  useEffect(() => {
    // Sadece kullanıcı giriş yaptıysa dinle
    if (user && profile) {
      setLoading(true);
      
      // 1. Başlangıç verisini çek
      fetchPets(); 

      // 2. 'pets' tablosundaki TÜM değişiklikleri (INSERT, UPDATE, DELETE) dinle
      const channel = supabase.channel('public:pets')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pets' },
          (payload) => {
            console.log('Pets tablosunda değişiklik algılandı, liste yenileniyor...');
            // Değişiklik olduğunda, listeyi en baştan, taze veriyle çek
            // Bu, 'diğer telefonun' da güncellenmesini sağlar
            fetchPets();
          }
        )
        .subscribe();
      
      // Component kapandığında dinleyiciyi kapat
      return () => {
        supabase.removeChannel(channel);
      };

    } else if (!user) {
      // Kullanıcı çıkış yaptıysa listeyi temizle
      setPets([]);
      setLoading(false);
    }
  }, [user, profile]); // Kullanıcı veya profil yüklendiğinde çalış

  // Tüm ilanları çeken fonksiyon
  const fetchPets = async () => {
    // 'loading' state'ini burada 'true' yapmıyoruz ki
    // anlık güncellemelerde (arkaplanda) ekran titremesin
    try {
      const { data, error } = await supabase
        .from('pets')
        .select(`*, owner:profiles (display_name, photo_url)`)
        .order('created_at', { ascending: false }); 

      if (error) throw error;

      if (data) {
        const formattedPets = data.map((pet: any) => ({
          ...pet,
          contactName: pet.owner?.display_name || 'Bilinmeyen',
        })) as Pet[];
        setPets(formattedPets);
      }
    } catch (error: any) {
      console.error("Supabase ilanları çekerken hata:", error.message);
      Alert.alert("Hata", "İlanlar yüklenemedi.");
    } finally {
      setLoading(false); // Sadece ilk yüklemede 'false' yap
    }
  };
  
  // 2. DÜZELTME: 'addPet' (İlan Ekle) - Manuel state güncellemesi SİLİNDİ
  const addPet = async (petToAdd: Omit<Pet, 'id' | 'created_at' | 'contactName' | 'owner_id'>) => {
    if (!user) throw new Error("İlan eklemek için giriş yapılmalı.");
    
    const newPetData = {
      ...petToAdd,
      owner_id: user.id,
      created_at: new Date().toISOString()
    };
    
    // Supabase'e ekle VE HATA VARSA Fırlat
    // 'select()'i kaldırdık, çünkü Realtime dinleyici listeyi yenileyecek.
    const { error } = await supabase.from('pets').insert([newPetData]);
    if (error) throw error;
  };
  
  // 3. DÜZELTME: 'deletePet' (İlan Sil) - Manuel state güncellemesi SİLİNDİ
  const deletePet = async (petToDelete: Pet) => {
    if (!petToDelete.id) throw new Error("İlan ID'si bulunamadı.");
    
    try {
      const { error: dbError } = await supabase
        .from('pets')
        .delete()
        .eq('id', petToDelete.id);
      if (dbError) throw dbError; 

      if (petToDelete.image_url && petToDelete.image_url.includes('supabase')) {
        const pathParts = petToDelete.image_url.split('/pet-images/');
        if (pathParts.length > 1) {
          const filePath = pathParts[1];
          await supabase.storage.from('pet-images').remove([filePath]);
        }
      }
      // 'setPets'i kaldırdık, Realtime dinleyici halledecek
    } catch (error) {
      console.error("İlan silinirken hata:", error);
      throw new Error("İlan silinemedi.");
    }
  };

  // 4. DÜZELTME: 'updatePet' (İlan Güncelle) - Manuel state güncellemesi SİLİNDİ
  const updatePet = async (petId: number, updatedData: Partial<Pet>) => {
    const { error } = await supabase
      .from('pets')
      .update(updatedData)
      .eq('id', petId);
      
    if (error) throw error; // Hata varsa fırlat
    // 'setPets'i kaldırdık, Realtime dinleyici halledecek
  };

  return (
    <PetsContext.Provider 
      value={{ pets, loading, fetchPets, addPet, deletePet, updatePet }}
    >
      {children}
    </PetsContext.Provider>
  );
};