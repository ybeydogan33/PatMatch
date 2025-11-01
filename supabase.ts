// supabase.ts (YENİ DOSYA)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; // Supabase'in React Native'de çalışması için GEREKLİ

// 1. ADIM: Sizin URL'niz
// Lütfen tırnak işaretlerinin içine Supabase API ayarlarınızdan kopyaladığınız
// "Project URL" (Proje URL'i) adresinizi yapıştırın.
const supabaseUrl = "https://ptzurroaqateqqqhvoir.supabase.co";

// 2. ADIM: Sizin 'anon' anahtarınız
// Lütfen tırnak işaretlerinin içine Supabase API ayarlarınızdan kopyaladığınız
// "anon public" (anon public) anahtarınızı yapıştırın.
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0enVycm9hcWF0ZXFxcWh2b2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4ODYwOTQsImV4cCI6MjA3NzQ2MjA5NH0.KRROWLI01bKK1aSUpgNxJsShPRU-BI7be2dYcHAYcH0";


// Supabase istemcisini (client) oluştur
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auth (Kullanıcı) bilgilerini telefonda güvenle saklamak için
    storage: AsyncStorage,
    // Otomatik olarak token'ları yenile
    autoRefreshToken: true,
    // Token'ların süresi doldu mu kontrol et
    detectSessionInUrl: false,
  },
});