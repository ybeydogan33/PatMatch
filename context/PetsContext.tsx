// context/PetsContext.tsx (SON HALİ - Manuel State Güncellemesi)

import type { Pet } from '@/components/PetCard';
import { supabase } from '@/supabase';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

// Context arayüzümüz
interface IPetsContext {
  pets: Pet[];
  loading: boolean;
  fetchPets: () => Promise<void>; // 1. YENİLİK: Yenileme fonksiyonu
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

  // Veritabanından İlanları Çekme
  useEffect(() => {
    // Sadece kullanıcı giriş yaptıysa ilanları çek
    if (user && profile) {
      fetchPets();
    } else if (!user) {
      setPets([]);
      setLoading(false);
    }
    
    // 2. DÜZELTME: Anlık (Realtime) dinleyiciyi SİLDİK.
    // Bu, "race condition" (zamanlama) sorununa neden oluyordu.
    
  }, [user, profile]);

  // Tüm ilanları çeken fonksiyon
  const fetchPets = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };
  
  // Supabase'e 'addPet' (İlan Ekle)
  const addPet = async (petToAdd: Omit<Pet, 'id' | 'created_at' | 'contactName' | 'owner_id'>) => {
    if (!user) throw new Error("İlan eklemek için giriş yapılmalı.");
    
    const newPetData = {
      ...petToAdd,
      owner_id: user.id,
      created_at: new Date().toISOString()
    };
    
    // 3. YENİLİK: 'insert' komutuna '.select()' ekleyerek
    // veritabanının oluşturduğu tam 'Pet' objesini geri alıyoruz
    const { data, error } = await supabase
      .from('pets')
      .insert(newPetData)
      .select() // <-- Yeni eklenen
      .single(); // <-- Yeni eklenen
      
    if (error) throw error;
    
    // 4. YENİLİK: Listeyi manuel olarak güncelle
    // (Henüz 'owner' bilgisi yok, ama ID ve isim var)
    setPets(prevPets => [{ ...data, contactName: profile?.display_name }, ...prevPets] as Pet[]);
  };
  
  // Supabase'den 'deletePet' (İlan Sil)
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
      // 5. YENİLİK: Manuel state güncellemesini geri getirdik
      setPets(prevPets => prevPets.filter(p => p.id !== petToDelete.id));
    } catch (error) {
      console.error("İlan silinirken hata:", error);
      throw new Error("İlan silinemedi.");
    }
  };

  // Supabase'de 'updatePet' (İlan Güncelle)
  const updatePet = async (petId: number, updatedData: Partial<Pet>) => {
    const { data, error } = await supabase
      .from('pets')
      .update(updatedData)
      .eq('id', petId)
      .select() // 6. YENİLİK: Güncellenen satırı geri al
      .single();
      
    if (error) throw error;
    
    // 7. YENİLİK: Listeyi manuel olarak güncelle
    setPets(prevPets => 
      prevPets.map(p => 
        p.id === petId ? { ...p, ...data } : p // Eski 'p'yi güncellenmiş 'data' ile değiştir
      )
    );
  };

  return (
    <PetsContext.Provider 
      value={{ pets, loading, fetchPets, addPet, deletePet, updatePet }}
    >
      {children}
    </PetsContext.Provider>
  );
};