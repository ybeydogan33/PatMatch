// app/(tabs)/messages.tsx (GÜNCELLENMİŞ HALİ - Okunmadı UI Eklendi)

import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 1. YENİLİK: 'readStatus' arayüzü eklendi
interface ChatRoom {
  id: string;
  users: string[];
  userNames: { [key: string]: string };
  lastMessage: string;
  lastTimestamp: any;
  readStatus: { [key: string]: number }; // örn: { userA: 0, userB: 2 }
}

export default function MessagesScreen() {
  const { user } = useAuth(); // Artık totalUnreadCount'u buradan da alabiliriz
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // (AuthContext'in yaptığı sorgunun aynısı, ama bu TÜM sohbetleri getirir)
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef, 
      where('users', 'array-contains', user.uid),
      orderBy('lastTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms: ChatRoom[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatRoom[];
      
      setChatRooms(rooms);
      setLoading(false);
    }, (error) => {
      console.error("Sohbetleri çekerken hata: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sohbet listesindeki her bir satırı render et
  const renderChatItem = ({ item }: { item: ChatRoom }) => {
    if (!user) return null;

    const otherUserId = item.users.find(uid => uid !== user.uid);
    const otherUserName = (otherUserId && item.userNames) ? item.userNames[otherUserId] : 'Bilinmeyen';
    const profileInitial = otherUserName ? otherUserName.charAt(0).toUpperCase() : '?';

    // 2. YENİLİK: Okunmamış mesaj sayısını ve durumunu hesapla
    const unreadCount = (item.readStatus && item.readStatus[user.uid]) ? item.readStatus[user.uid] : 0;
    const isUnread = unreadCount > 0;

    return (
      <TouchableOpacity 
        style={styles.chatItem} 
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profileInitial}</Text>
        </View>
        <View style={styles.chatContent}>
          {/* 3. YENİLİK: Koşullu 'bold' stil */}
          <Text style={[styles.chatName, isUnread && styles.unreadText]}>
            {otherUserName}
          </Text>
          <Text style={[styles.chatLastMessage, isUnread && styles.unreadText]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
        {/* 4. YENİLİK: Okunmadıysa bildirim sayacını göster */}
        {isUnread && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    // ... (Loading ekranı aynı) ...
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ... (Geri kalan JSX aynı) ... */}
      <Text style={styles.headerTitle}>Mesajlarım</Text>
      <FlatList
        data={chatRooms}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Henüz hiç sohbetiniz yok.</Text>
            <Text style={styles.emptySubText}>Bir ilandan "İletişime Geç" butonuna basarak sohbet başlatabilirsiniz.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// Stiller
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBF5',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  list: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#888',
  },
  chatContent: {
    flex: 1, // Alanı doldur
    marginRight: 10, // Bildirim noktası için yer aç
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    textTransform: 'capitalize',
  },
  chatLastMessage: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  // 5. YENİ STİLLER
  unreadText: {
    fontWeight: '900', // Daha kalın
    color: '#000', // Siyah
  },
  badgeContainer: {
    backgroundColor: '#F97316', // Turuncu
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // ... (emptyContainer stilleri aynı) ...
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
});