import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../context/UserContext';
import ChatBubble from '../components/ChatBubble';
import { ChatMessage } from '../types';
import { getAIResponseAsync } from '../services/aiService';
import { getApiKey } from '../services/apiKeyStore';
import { loadExpenses, Expense } from '../services/expenseIntelligence';
import { generateId } from '../utils/helpers';

const C = { bg: '#0B0B0F', surface: '#111118', elevated: '#18181F', input: '#1E1E28', primary: '#6C63FF', text: '#F0F0F5', textSec: '#9CA3AF', textMuted: '#6B7280', border: 'rgba(255,255,255,0.06)' };

export default function ChatScreen() {
  const { user, investments, buckets, goals } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(['Mera portfolio review karo', 'Meri spending kaise hai?', 'Market kaisa hai aaj?', 'Kya invest karun abhi?']);
  const [hasApiKey, setHasApiKey] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const conversationRef = useRef<{ role: string; content: string }[]>([]);

  useEffect(() => {
    getApiKey().then(k => setHasApiKey(!!k));
    loadExpenses().then(setExpenses);
    setMessages([{ id: generateId(), text: `Hey ${user?.name || 'Dost'}! 👋\n\nMain hoon aapka Nivesh Saathi — AI-powered money advisor.\n\nPortfolio, expenses, market — kuch bhi pucho!`, isBot: true, timestamp: new Date() }]);
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const t = text.trim();
    setMessages(p => [...p, { id: generateId(), text: t, isBot: false, timestamp: new Date() }]);
    setInputText('');
    setIsTyping(true);
    conversationRef.current.push({ role: 'user', content: t });
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await getAIResponseAsync(t, user, conversationRef.current, { investments, buckets, goals }, expenses);
      conversationRef.current.push({ role: 'assistant', content: res.text });
      setMessages(p => [...p, { id: generateId(), text: res.text, isBot: true, timestamp: new Date() }]);
      if (res.suggestions) setSuggestions(res.suggestions);
    } catch {
      setMessages(p => [...p, { id: generateId(), text: 'Oops, kuch gadbad ho gayi! Phir se try karo 🙏', isBot: true, timestamp: new Date() }]);
    }
    setIsTyping(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <View style={s.header}>
        <View style={s.headerAvatar}><Text style={{ fontSize: 16 }}>✨</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Nivesh Saathi AI</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <View style={[s.statusDot, hasApiKey && { backgroundColor: '#34D399' }]} />
            <Text style={s.headerSub}>{hasApiKey ? 'GPT-4o powered' : 'Smart offline mode'}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {messages.map(m => <ChatBubble key={m.id} text={m.text} isBot={m.isBot} />)}
          {isTyping && <ChatBubble text="" isBot isTyping />}
          <View style={{ height: 8 }} />
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sugRow} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }} keyboardShouldPersistTaps="handled">
          {suggestions.map((sg, i) => (
            <TouchableOpacity key={i} style={s.sug} onPress={() => sendMessage(sg)} activeOpacity={0.7}>
              <Text style={s.sugText}>{sg}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.inputRow}>
          <TextInput style={s.input} placeholder="Kuch bhi pucho..." placeholderTextColor="#555" value={inputText} onChangeText={setInputText} onSubmitEditing={() => sendMessage(inputText)} returnKeyType="send" multiline maxLength={500} />
          <TouchableOpacity style={[s.sendBtn, (!inputText.trim() || isTyping) && { opacity: 0.3 }]} onPress={() => sendMessage(inputText)} disabled={!inputText.trim() || isTyping}>
            <Text style={s.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border },
  headerAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.elevated, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: C.border },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.textMuted, marginRight: 5 },
  headerSub: { fontSize: 11, color: C.textMuted },
  sugRow: { maxHeight: 40, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  sug: { backgroundColor: C.surface, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: C.border },
  sugText: { fontSize: 12, color: C.textSec, fontWeight: '500' },
  inputRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 14, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: C.input, borderRadius: 20, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 8, paddingTop: Platform.OS === 'ios' ? 10 : 8, fontSize: 14, color: C.text, maxHeight: 100, lineHeight: 19, borderWidth: 1, borderColor: C.border },
  sendBtn: { marginLeft: 8, marginBottom: 1, width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  sendIcon: { fontSize: 17, fontWeight: '800', color: '#FFF' },
});

