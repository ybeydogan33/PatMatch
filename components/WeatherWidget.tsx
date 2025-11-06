// components/ProfileWeather.tsx
// Bu bileşen, sadece profil sayfasında metin olarak hava durumunu göstermek içindir.

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

// API Anahtarınızı buraya yapıştırın
const API_KEY = 'e1b78b35a8484217955cb04d153a940d'; // Sizin sağladığınız anahtar

interface ProfileWeatherProps {
  city: string | null | undefined;
}

const ProfileWeather: React.FC<ProfileWeatherProps> = ({ city }) => {
  const router = useRouter();
  const [temperature, setTemperature] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!city) {
      setLoading(false);
      setError(false);
      return; // Şehir yoksa API isteği yapma
    }

    const fetchWeather = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=tr`
        );
        if (!response.ok) throw new Error('Hata');
        
        const data = await response.json();
        setTemperature(`${Math.round(data.main.temp)}°C`);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city]); // 'city' değiştiğinde çalışır

  // 1. Durum: Şehir girilmemişse (İsteğiniz: "Giriniz yazsın")
  if (!city) {
    return (
      <TouchableOpacity onPress={() => router.push('/profile/edit')}>
        <Text style={styles.baseText}>
          Konum: 
          <Text style={styles.promptText}> Girmek için dokunun</Text>
        </Text>
      </TouchableOpacity>
    );
  }

  // 2. Durum: Şehir var, veri yükleniyor
  if (loading) {
    return (
      <Text style={styles.baseText}>
        Konum: {city}{' '}
        <ActivityIndicator size="small" color="#888" />
      </Text>
    );
  }

  // 3. Durum: Şehir var, hata oluştu (API anahtarı yanlış, il bulunamadı vb.)
  if (error) {
    return (
      <Text style={styles.baseText}>
        Konum: {city}
        <Text style={styles.errorText}> (Hava durumu alınamadı)</Text>
      </Text>
    );
  }

  // 4. Durum: Başarılı (İsteğiniz: "yanda derecesi gözüksün")
  return (
    <Text style={styles.baseText}>
      Konum: {city}{' '}
      <Text style={styles.tempText}>{temperature}</Text>
    </Text>
  );
};

const styles = StyleSheet.create({
  baseText: {
    fontSize: 16,
    color: '#888',
  },
  promptText: {
    color: '#007AFF', // Tıklanabilir olduğunu belirten mavi renk
    textDecorationLine: 'underline',
  },
  tempText: {
    fontWeight: 'bold',
    color: '#333', // Derece daha belirgin olsun
  },
  errorText: {
    color: '#D9534F', // Hata kırmızısı
    fontStyle: 'italic',
  },
});

export default ProfileWeather;