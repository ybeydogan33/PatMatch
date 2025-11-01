// app/chat/[chatId].tsx (RLS uyumlu ve güncel)

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
  id: number;
  content: string;
  sender_id: string;
  created_at: string;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { chatId } = useLocalSearchParams(); 
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);

  // Mesajları çek ve diğer kullanıcıyı al
  useEffect(() => {
    if (!chatId || !user) return;
    const currentChatId = chatId as string;

    const fetchOtherUser = async () => {
      const { data, error } = await supabase.rpc('get_other_participant', {
        p_chat_id: currentChatId,
        p_user_id: user.id
      });
      if (error) {
        console.error('Diğer kullanıcı alınamadı:', error);
      } else {
        setOtherUserId(data[0]?.other_user_id ?? null);
      }
    };

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', currentChatId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Mesajlar çekilirken hata:', error);
      } else {
        setMessages(data as Message[]);
      }
      setLoading(false);
    };

    const markAsRead = async () => {
      if (!otherUserId) return;
      await supabase.rpc('mark_chat_as_read', {
        chat_id_input: currentChatId,
        user_id_input: user.id
      });
    };

    fetchOtherUser().then(fetchMessages).then(markAsRead);

    // Realtime listener
    const channel = supabase.channel(`messages_${currentChatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${currentChatId}` },
        (payload) => {
          setMessages(currentMessages => [payload.new as Message, ...currentMessages]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user, otherUserId]);

  // Yeni mesaj gönderme
  const handleSend = async () => {
    if (!newMessage.trim() || !user || !chatId || !otherUserId) {
      if (!otherUserId) Alert.alert("Hata", "Diğer kullanıcı bilgisi yüklenemedi, tekrar deneyin.");
      return;
    }

    const trimmedMessage = newMessage.trim();
    const currentChatId = chatId as string;
    setNewMessage('');

    try {
      // 1️⃣ Mesaj ekle
      const { error: msgError } = await supabase
        .from('messages')
        .insert({ content: trimmedMessage, sender_id: user.id, chat_id: currentChatId });
      if (msgError) throw msgError;

      // 2️⃣ Chat tablosunu güncelle (son mesaj ve okunmadı sayacı)
      const { error: chatError } = await supabase.rpc('update_chat_on_new_message', {
        chat_id_input: currentChatId,
        last_message_input: trimmedMessage,
        unread_user_id_input: otherUserId
      });
      if (chatError) throw chatError;

    } catch (error: any) {
      console.error("Mesaj gönderilirken hata:", error);
      Alert.alert("Hata", "Mesaj gönderilemedi: " + error.message);
      setNewMessage(trimmedMessage);
    }
  };

  // Mesaj balonlarını render et
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?.id;
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>
          {item.content}
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
      <Stack.Screen 
        options={{ 
          title: 'Sohbet', 
          headerBackTitle: 'Mesajlar',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/(tabs)/messages')}>
              <View style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#F97316" />
                <Text style={styles.backButtonText}>Mesajlar</Text>
              </View>
            </TouchableOpacity>
          )
        }} 
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
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
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBF5' },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingLeft: 0 },
  backButtonText: { color: '#F97316', fontSize: 17 },
  messageList: { flex: 1, paddingHorizontal: 10 },
  messageContainer: { padding: 12, borderRadius: 18, marginVertical: 4, maxWidth: '80%' },
  myMessageContainer: { backgroundColor: '#F97316', alignSelf: 'flex-end' },
  otherMessageContainer: { backgroundColor: '#E5E5E5', alignSelf: 'flex-start' },
  myMessageText: { color: '#fff', fontSize: 16 },
  otherMessageText: { color: '#000', fontSize: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#ddd', backgroundColor: '#fff' },
  textInput: { flex: 1, height: 40, borderColor: '#ddd', borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, backgroundColor: '#F0F0F0', marginRight: 10, fontSize: 16 },
  sendButton: { backgroundColor: '#F97316', borderRadius: 50, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
});
