// app/chat/[chatId].tsx (DÜZELTİLMİŞ HALİ - getDoc import eklendi)

import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
    addDoc,
    collection,
    doc,
    getDoc // DÜZELTME: 'getDoc' buraya eklendi
    ,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Mesaj objesinin veri tipi
interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { chatId } = useLocalSearchParams(); 
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);

  // Mesajları dinle VE sohbeti "okundu" olarak işaretle
  useEffect(() => {
    if (!chatId || !user) return;

    const currentChatId = chatId as string;

    // Sohbeti "okundu" olarak işaretle (Sayacı sıfırla)
    const markAsRead = async () => {
      try {
        const chatDocRef = doc(db, 'chats', currentChatId);
        
        // Diğer kullanıcının kim olduğunu bulmak için dökümanı bir kez oku
        const chatDoc = await getDoc(chatDocRef); // 'getDoc' artık tanınıyor
        if(chatDoc.exists()) {
          const data = chatDoc.data();
          if (data && data.users) {
            const users = data.users as string[];
            setOtherUserId(users.find(uid => uid !== user.uid) || null);
          }
          
          // Kendi okunmamış sayacımı sıfırla
          // Sadece sayaç 0'dan büyükse güncelleme yap (gereksiz yazmayı önle)
          const userReadStatusKey = `readStatus.${user.uid}`;
          if (data && data.readStatus && data.readStatus[user.uid] > 0) {
            await updateDoc(chatDocRef, {
              [userReadStatusKey]: 0
            });
          }
        }
      } catch (error) {
        console.error("Sohbeti okundu olarak işaretlerken hata:", error);
      }
    };
    
    markAsRead(); // Ekran açılır açılmaz çalıştır

    // Mesajları dinlemeye başla
    const messagesRef = collection(db, 'chats', currentChatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map(doc => ({
        id: doc.id, ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Mesajları dinlerken hata: ", error);
      setLoading(false);
      Alert.alert("Hata", "Mesajlar yüklenemedi.");
    });

    return () => unsubscribe();
  }, [chatId, user]);


  // Mesaj Gönderme (Karşı tarafın sayacını artır)
  const handleSend = async () => {
    if (newMessage.trim() === '' || !user || !chatId || !otherUserId) {
      if (!otherUserId) {
        console.warn("Diğer kullanıcı ID'si henüz yüklenmedi, gönderme işlemi iptal edildi.");
      }
      return;
    }

    const currentChatId = chatId as string;
    const messagesRef = collection(db, 'chats', currentChatId, 'messages');
    const chatDocRef = doc(db, 'chats', currentChatId);
    const trimmedMessage = newMessage.trim();

    try {
      // 1. Yeni mesajı 'messages' alt koleksiyonuna ekle
      await addDoc(messagesRef, {
        text: trimmedMessage,
        senderId: user.uid,
        timestamp: serverTimestamp() 
      });
      
      // 2. Ana 'chats' dökümanını güncelle
      const otherUserReadStatusKey = `readStatus.${otherUserId}`;
      await updateDoc(chatDocRef, {
        lastMessage: trimmedMessage,
        lastTimestamp: serverTimestamp(),
        [otherUserReadStatusKey]: increment(1) // Karşı tarafın sayacını +1 yap
      });

      setNewMessage(''); // Mesaj kutusunu temizle
    } catch (error) {
      console.error("Mesaj gönderilirken hata:", error);
      Alert.alert("Hata", "Mesaj gönderilemedi.");
    }
  };

  // Mesaj baloncuğunu render etme
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.uid;
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>
          {item.text}
        </Text>
      </View>
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
      <Stack.Screen options={{ title: 'Sohbet', headerBackTitle: 'Mesajlar' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          inverted 
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'flex-end',
          }}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Mesaj yaz..."
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 18,
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessageContainer: {
    backgroundColor: '#F97316',
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    backgroundColor: '#E5E5E5',
    alignSelf: 'flex-start',
  },
  myMessageText: {
    color: '#fff',
    fontSize: 16,
  },
  otherMessageText: {
    color: '#000',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#F97316',
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});