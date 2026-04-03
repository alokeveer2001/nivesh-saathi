import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/colors';
import { useUser } from '../context/UserContext';
import ChatBubble from '../components/ChatBubble';
import { ChatMessage } from '../types';
import { getAIResponseAsync } from '../services/aiService';
import { getApiKey } from '../services/apiKeyStore';
import { generateId } from '../utils/helpers';

export default function ChatScreen() {
  const { user, investments, buckets, goals } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    'SIP kaise start karun?',
    'Tax kaise bachaye?',
    'Emergency fund banao',
    'Mera plan review karo',
  ]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Conversation history for OpenAI context
  const conversationRef = useRef<{ role: string; content: string }[]>([]);

  useEffect(() => {
    checkApiKey();
    const welcomeMsg: ChatMessage = {
      id: generateId(),
      text: `Hey ${user?.name || 'Dost'}! 👋\n\nMain hoon aapka Nivesh Saathi — aapka personal AI money advisor.\n\nKuch bhi pucho investing, saving, tax ya goals ke baare mein!`,
      isBot: true,
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
  }, []);

  const checkApiKey = async () => {
    const key = await getApiKey();
    setHasApiKey(!!key);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const trimmed = text.trim();

    const userMsg: ChatMessage = {
      id: generateId(),
      text: trimmed,
      isBot: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Add to conversation history
    conversationRef.current.push({ role: 'user', content: trimmed });

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await getAIResponseAsync(trimmed, user, conversationRef.current, {
        investments, buckets, goals,
      });

      // Add bot response to history
      conversationRef.current.push({ role: 'assistant', content: response.text });

      const botMsg: ChatMessage = {
        id: generateId(),
        text: response.text,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMsg]);
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: generateId(),
        text: 'Oops, kuch gadbad ho gayi! Phir se try karo 🙏',
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }

    setIsTyping(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={['#0F0F1E', '#1A1F71']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarEmoji}>✨</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Nivesh Saathi AI</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, hasApiKey && styles.statusDotActive]} />
              <Text style={styles.headerSubtitle}>
                {hasApiKey ? 'GPT-4o powered' : 'Smart offline mode'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              text={msg.text}
              isBot={msg.isBot}
            />
          ))}

          {isTyping && (
            <ChatBubble text="" isBot={true} isTyping={true} />
          )}

          <View style={{ height: 8 }} />
        </ScrollView>

        {/* Suggestions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsContainer}
          contentContainerStyle={styles.suggestionsContent}
          keyboardShouldPersistTaps="handled"
        >
          {suggestions.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestionChip}
              onPress={() => sendMessage(s)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Kuch bhi pucho..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isTyping) && styles.sendDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isTyping}
          >
            <LinearGradient
              colors={inputText.trim() && !isTyping ? ['#1A1F71', '#3F51B5'] : ['#D1D5DB', '#D1D5DB']}
              style={styles.sendGradient}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarEmoji: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7280',
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  suggestionsContainer: {
    maxHeight: 44,
    backgroundColor: '#FAFBFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
  },
  suggestionsContent: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 6,
  },
  suggestionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5FA',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: '#1A1A2E',
    maxHeight: 100,
    lineHeight: 20,
  },
  sendButton: {
    marginLeft: 8,
    marginBottom: 2,
  },
  sendDisabled: {
    opacity: 1,
  },
  sendGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

