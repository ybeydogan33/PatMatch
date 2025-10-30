// app/login.tsx (YENİ DOSYA)

import { useAuth } from '@/context/AuthContext'; // Az önce oluşturduğumuz context
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // AuthContext'ten 'login' fonksiyonunu çek
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    setLoading(true);
    try {
      // Firebase login fonksiyonunu çağır
      await login(email, password);
      // Başarılı girişten sonra _layout.tsx bizi otomatik yönlendirecek
    } catch (error: any) {
      // Firebase hata kodlarına göre kullanıcı dostu mesajlar
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert('Giriş Başarısız', 'E-posta veya şifre hatalı.');
      } else {
        Alert.alert('Hata', 'Giriş yapılırken bir hata oluştu: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Giriş Yap</Text>
      
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
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Şifreyi gizler
      />

      {loading ? (
        <ActivityIndicator size="large" color="#F97316" style={{ marginVertical: 20 }} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Giriş Yap</Text>
        </TouchableOpacity>
      )}

      <Link href="/register" asChild>
        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>Hesabınız yok mu? Kayıt Olun</Text>
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}

// Stiller (Diğer dosyalardan kopyaladık)
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