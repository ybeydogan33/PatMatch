// firebase.ts (YENİ DOSYA)

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Auth (Giriş) servislerini React Native'e özel kalıcı depolama ile kurmak için:
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

// 1. Adımda oluşturduğumuz konfigürasyon dosyamız
import { firebaseConfig } from './firebaseConfig';

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Firestore (Veritabanı) servisini başlat
export const db = getFirestore(app);

// Auth (Kullanıcı Girişi) servisini başlat
// Not: Burada 'getAuth' yerine 'initializeAuth' kullanıyoruz
// ve 'persistence' (kalıcılık) olarak AsyncStorage'ı belirtiyoruz.
// Bu, Expo Go'da giriş bilgilerinin saklanması için kritiktir.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// 'app'i de dışa aktarmak isterseniz (genelde gerekmez)
// export { app, db, auth };