// app/register.tsx (GÜNCELLENMİŞ HALİ - Kullanıcı Adı eklendi)

import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase';
import { Link, useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

export default function RegisterScreen() {
  // 1. YENİLİK: 'displayName' (Kullanıcı Adı) state'i eklendi
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth(); 
  const router = useRouter(); 

  const handleRegister = async () => {
    // 2. YENİLİK: 'displayName' doğrulamaya eklendi
    if (!email || !password || !displayName) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await register(email, password);
      
      if (userCredential && userCredential.user) {
        const user = userCredential.user;
        const userDocRef = doc(db, 'users', user.uid);
        
        // 3. YENİLİK: Firestore'a 'displayName' kaydediliyor
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: displayName, // E-posta yerine formdan gelen adı kaydet
          // Varsayılan profil resmini de bu addan oluştur
          photoURL: `https://ui-avatars.com/api/?name=${displayName.replace(' ', '+')}&background=random`
        });
      }

      Alert.alert('Kayıt Başarılı', 'Giriş ekranına yönlendiriliyorsunuz.');
      router.replace('/login');
      
    } catch (error: any) {
      // ... (hata yönetimi aynı) ...
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Hata', 'Bu e-posta adresi zaten kullanılıyor.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Hata', 'Şifre çok zayıf. En az 6 karakter olmalı.');
      } else {
        Alert.alert('Hata', 'Kayıt olurken bir hata oluştu: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Kayıt Ol</Text>
      
      {/* 4. YENİLİK: Kullanıcı Adı TextInput'u eklendi */}
      <TextInput
        style={styles.input}
        placeholder="Kullanıcı Adı"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="E-posta"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre (en az 6 karakter)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator size="large" color="#F97316" style={{ marginVertical: 20 }} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Kayıt Ol</Text>
        </TouchableOpacity>
      )}

      <Link href="/login" asChild>
        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>Zaten hesabınız var mı? Giriş Yapın</Text>
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}

// ... (Stiller aynı) ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#F97316',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: '#F97316',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});