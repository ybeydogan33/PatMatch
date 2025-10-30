// context/PetsContext.tsx (GÜNCELLENMİŞ HALİ - updatePet eklendi)

import type { Pet } from '@/components/PetCard';
import { db, deleteObject, ref, storage } from '@/firebase';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc // 1. YENİLİK: updateDoc
} from 'firebase/firestore';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

// Context arayüzümüz
interface IPetsContext {
  pets: Pet[];
  addPet: (pet: Pet) => Promise<any>;
  deletePet: (pet: Pet) => Promise<void>;
  updatePet: (petId: string, updatedData: Partial<Pet>) => Promise<void>; // 2. YENİLİK
  loading: boolean;
}

export const PetsContext = createContext<IPetsContext>({
  pets: [],
  addPet: async () => {},
  deletePet: async () => {},
  updatePet: async () => {}, // 3. YENİLİK
  loading: true,
});

// Provider bileşenimiz
export const PetsProvider = ({ children }: { children: ReactNode }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); 

  // Veritabanını dinleyen useEffect (Aynı)
  useEffect(() => {
    if (!user) {
      setPets([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const petCollectionRef = collection(db, 'pets');
    const q = query(petCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const petsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pet[];
      
      setPets(petsData);
      setLoading(false);
    }, (error) => {
      console.error("İlanları çekerken hata: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 'addPet' fonksiyonu (Aynı)
  const addPet = async (petToAdd: Pet) => {
    const petCollectionRef = collection(db, 'pets');
    return addDoc(petCollectionRef, {
      ...petToAdd,
      createdAt: Timestamp.now()
    });
  };
  
  // 'deletePet' fonksiyonu (Aynı)
  const deletePet = async (petToDelete: Pet) => {
    // ... (silme mantığı aynı) ...
    if (!petToDelete.id) return;
    try {
      const petDocRef = doc(db, 'pets', petToDelete.id);
      await deleteDoc(petDocRef);
      if (petToDelete.imageUrl && petToDelete.imageUrl.includes('firebasestorage')) {
        const imageRef = ref(storage, petToDelete.imageUrl);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.error("İlan silinirken hata:", error);
      throw new Error("İlan silinemedi.");
    }
  };

  // 4. YENİLİK: 'updatePet' fonksiyonu
  const updatePet = async (petId: string, updatedData: Partial<Pet>) => {
    try {
      const petDocRef = doc(db, 'pets', petId);
      // Not: Şimdilik sadece metin güncellemeyi yapıyoruz.
      // Fotoğraf güncelleme daha karmaşıktır (Adım 5'te yapılabilir).
      await updateDoc(petDocRef, updatedData);
    } catch (error) {
      console.error("İlan güncellenirken hata:", error);
      throw new Error("İlan güncellenemedi.");
    }
  };


  return (
    <PetsContext.Provider value={{ pets, addPet, deletePet, updatePet, loading }}>
      {children}
    </PetsContext.Provider>
  );
};