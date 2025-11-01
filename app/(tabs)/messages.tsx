// app/(tabs)/messages.tsx (SON HALİ - 'chats' tablosunu dinler)

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<any[]>([]); // Şimdilik 'any'
  const [loading, setLoading] = useState(true);

  // 'chats' tablosunu dinle
  useEffect(() => {
    if (!user) return;

    // Başlangıçta listeyi çek
    fetchChatRooms(); 

    // 'chats' tablosunu dinle
    const channel = supabase.channel('public:chats')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', // Sadece 'UPDATE' (yeni mesaj geldi) olaylarını
          schema: 'public', 
          table: 'chats'
          // Not: Bu, 'users' dizisini (array) içeren tüm sohbetleri dinler.
          // Daha verimli bir yol, sadece 'user.id'yi dinlemektir,
          // ancak 'get_user_chats' fonksiyonu 'useFocusEffect'te zaten çalışıyor.
        },
        (payload) => {
          // Bir değişiklik olduğunda (yeni mesaj), listeyi yeniden çek
          console.log('Chats tablosunda değişiklik algılandı, liste yenileniyor...');
          fetchChatRooms();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  // Ekrana her odaklanıldığında (diğer sekmeden geri dönüldüğünde) listeyi yenile
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchChatRooms();
      }
    }, [user])
  );

  // Sohbet Odası Verisini Çeken Fonksiyon
  const fetchChatRooms = async () => {
    if (!user) return;
    setLoading(true);

    // SQL'de oluşturduğumuz 'get_user_chats' fonksiyonunu çağır
    const { data, error } = await supabase.rpc('get_user_chats', {
      p_user_id: user.id
    });

    if (error) {
      console.error("Sohbet odaları çekilirken hata:", error);
      Alert.alert("Hata", "Mesajlar yüklenemedi.");
      setChatRooms([]);
    } else {
      setChatRooms(data || []);
    }
    setLoading(false);
  };


  const renderChatItem = ({ item }: { item: any }) => {
    if (!user) return null;

    const profileInitial = item.other_user_name ? item.other_user_name.charAt(0).toUpperCase() : '?';

    return (
      <TouchableOpacity 
        style={styles.chatItem} 
        onPress={() => router.push(`/chat/${item.chat_id}`)} 
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profileInitial}</Text>
          {/* TODO: 'item.other_user_photo' ile Image eklenebilir */}
        </View>
        <View style={styles.chatContent}>
          <Text style={styles.chatName}>{item.other_user_name || 'Bilinmeyen'}</Text>
          <Text style={styles.chatLastMessage} numberOfLines={1}>
            {item.last_message_content || 'Sohbet başlatıldı...'}
          </Text>
        </View>
        {/* TODO: Okunmamış mesaj (badge) buraya eklenebilir */}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Mesajlarım</Text>
      <FlatList
        data={chatRooms}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.chat_id.toString()}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Henüz hiç sohbetiniz yok.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// Stiller
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBF5' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 10, color: '#333' },
  list: { flex: 1 },
  chatItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#888' },
  chatContent: { flex: 1 },
  chatName: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  chatLastMessage: { fontSize: 14, color: '#777', marginTop: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 10 },
});