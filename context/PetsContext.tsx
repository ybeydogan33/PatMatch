// context/PetsContext.tsx

import type { Pet } from '@/components/PetCard'; // PetCard'dan aldığımız tip
import React, { createContext, ReactNode, useState } from 'react';

// Global depomuzda ne tutulacak
interface IPetsContext {
  pets: Pet[];
  addPet: (pet: Pet) => void;
}

// Context'i oluşturuyoruz
export const PetsContext = createContext<IPetsContext>({
  pets: [],
  addPet: () => {},
});

// Örnek veriyi index.tsx'ten buraya taşıdık ve {pet: ...} sarmalayıcısını kaldırdık
const INITIAL_PETS: Pet[] = [
  {
    id: '1',
    name: 'Fıstık',
    breed: 'Tekir',
    age: 2,
    description: 'Fıstık, enerjik ve oyuncu bir Tekir. Yeni ailesini arıyor. Apartman hayatına uygun, sevecen bir dost.',
    contactName: 'Ayşe Yılmaz',
    type: 'sahiplenme',
    imageUrl: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '2',
    name: 'Max',
    breed: 'Alman Kurdu',
    age: 4,
    description: 'Max, eğitimli ve sadık bir Alman Kurdu. Aktif bir aile için harika bir koruyucu ve dost olacaktır.',
    contactName: 'Ahmet Çelik',
    type: 'sahiplenme',
    imageUrl: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '3',
    name: 'Paşa',
    breed: 'Golden Retriever',
    age: 3,
    description: 'Paşa, safkan ve sağlıklı bir Golden Retriever. Soyunu devam ettirmek için uygun bir eş arıyor.',
    contactName: 'Mehmet Kaya',
    type: 'ciftlestirme',
    imageUrl: 'https://images.pexels.com/photos/1458916/pexels-photo-1458916.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  }
];

// Bu, uygulamamızı saracak olan 'Sağlayıcı' bileşendir
export const PetsProvider = ({ children }: { children: ReactNode }) => {
  // Pet listesinin asıl state'i (durumu) burada tutulacak.
  const [pets, setPets] = useState<Pet[]>(INITIAL_PETS);

  // Yeni pet ekleme fonksiyonu
  const addPet = (petToAdd: Pet) => {
    // Yeni pet'i listenin başına ekleyip state'i güncelliyoruz
    setPets(prevPets => [petToAdd, ...prevPets]);
  };

  // Depomuzu (pets listesi ve addPet fonksiyonu) alt bileşenlere sunuyoruz
  return (
    <PetsContext.Provider value={{ pets, addPet }}>
      {children}
    </PetsContext.Provider>
  );
};