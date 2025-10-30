// firebase.ts (GÜNCELLENMİŞ HALİ)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions'; // 1. YENİLİK
import { deleteObject, getStorage, ref } from 'firebase/storage';
import { firebaseConfig } from './firebaseConfig';

// ... (app, db, auth, storage tanımlamaları aynı) ...
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const storage = getStorage(app);

// 2. YENİLİK: Functions servisini başlat ve dışa aktar
export const functions = getFunctions(app); 
// 3. YENİLİK: httpsCallable fonksiyonunu da kolay erişim için dışa aktar
export { deleteObject, httpsCallable, ref };
