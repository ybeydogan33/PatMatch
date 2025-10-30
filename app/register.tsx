// app/register.tsx (YENİ DOSYA)

import { useAuth } from '@/context/AuthContext';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth(); // Bu sefer 'register' fonksiyonunu çek
  const router = useRouter(); // Kayıt olduktan sonra login'e yönlendirmek için

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    setLoading(true);
    try {
      // Firebase register fonksiyonunu çağır
      await register(email, password);
      Alert.alert('Kayıt Başarılı', 'Giriş ekranına yönlendiriliyorsunuz.');
      router.replace('/login'); // Kayıt olunca login'e at
    } catch (error: any) {
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

// Stiller (Login ile aynı)
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