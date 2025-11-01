// context/PetsContext.tsx

import type { Pet } from '@/components/PetCard';
import { supabase } from '@/supabase';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

// Context tipi
interface IPetsContext {
  pets: Pet[];
  loading: boolean;
  addPet: (pet: Omit<Pet, 'id' | 'created_at' | 'contactName'>) => Promise<any>;
  updatePet: (petId: number, updatedData: Partial<Pet>) => Promise<any>;
  deletePet: (pet: Pet) => Promise<any>;
}

export const PetsContext = createContext<IPetsContext>({
  pets: [],
  loading: true,
  addPet: async () => {},
  updatePet: async () => {},
  deletePet: async () => {},
});

export const PetsProvider = ({ children }: { children: ReactNode }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  // 🔹 İlanları çek
  const fetchPets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pets')
        .select(`
          *,
          owner:profiles (
            display_name,
            photo_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedPets = data.map((pet: any) => ({
          ...pet,
          contactName: pet.owner?.display_name || 'Bilinmeyen',
          contactPhoto: pet.owner?.photo_url || null,
        })) as Pet[];

        setPets(formattedPets);
      }
    } catch (error) {
      console.error('Supabase ilanları çekerken hata:', error);
      Alert.alert('Hata', 'İlanlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 İlk yüklemede ilanları getir
  useEffect(() => {
    if (user && profile) {
      fetchPets();
    } else if (!user) {
      setPets([]);
      setLoading(false);
    }
  }, [user, profile]);

  // 🔹 Realtime (ekleme / silme / güncelleme olduğunda listeyi yenile)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:pets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pets' },
        () => {
          fetchPets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 🔹 İlan ekle
  const addPet = async (
    petToAdd: Omit<Pet, 'id' | 'created_at' | 'contactName'>
  ) => {
    if (!user) throw new Error('İlan eklemek için giriş yapılmalı.');

    const { error } = await supabase
      .from('pets')
      .insert([{ ...petToAdd, owner_id: user.id }]);

    if (error) {
      console.error('İlan eklenirken hata:', error);
      Alert.alert('Hata', 'İlan eklenirken bir sorun oluştu.');
      throw error;
    }
  };

  // 🔹 İlan sil
  const deletePet = async (petToDelete: Pet) => {
    if (!petToDelete.id) throw new Error('İlan ID’si bulunamadı.');

    const { error: dbError } = await supabase
      .from('pets')
      .delete()
      .eq('id', petToDelete.id);

    if (dbError) throw dbError;

    if (petToDelete.image_url) {
      const pathParts = petToDelete.image_url.split('/pet-images/');
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        await supabase.storage.from('pet-images').remove([filePath]);
      }
    }

    setPets((prev) => prev.filter((p) => p.id !== petToDelete.id));
  };

  // 🔹 İlan güncelle
  const updatePet = async (petId: number, updatedData: Partial<Pet>) => {
    const { error } = await supabase
      .from('pets')
      .update(updatedData)
      .eq('id', petId);

    if (error) {
      console.error('İlan güncellenirken hata:', error);
      Alert.alert('Hata', 'İlan güncellenemedi.');
      throw error;
    }
  };

  return (
    <PetsContext.Provider value={{ pets, loading, addPet, deletePet, updatePet }}>
      {children}
    </PetsContext.Provider>
  );
};
