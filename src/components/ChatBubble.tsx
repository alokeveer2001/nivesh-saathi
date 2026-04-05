import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Props { text: string; isBot: boolean; isTyping?: boolean; }

export default function ChatBubble({ text, isBot, isTyping }: Props) {
  const { C, isDark } = useTheme();

  const avatarBg = isDark ? '#1E1E28' : '#F0F1F5';
  const botBubbleBg = isDark ? '#18181F' : '#F0F1F5';
  const botTextColor = isDark ? '#E5E5EA' : '#1A1A2E';
  const dotsColor = isDark ? '#6B7280' : '#9CA3AF';

  if (isTyping) {
    return (
      <View style={[st.row, st.botRow]}>
        <View style={[st.avatar, { backgroundColor: avatarBg }]}><Text style={{ fontSize: 12 }}>✨</Text></View>
        <View style={[st.bubble, st.botBubble, { backgroundColor: botBubbleBg }]}><Text style={[st.dots, { color: dotsColor }]}>●  ●  ●</Text></View>
      </View>
    );
  }
  return (
    <View style={[st.row, isBot ? st.botRow : st.userRow]}>
      {isBot && <View style={[st.avatar, { backgroundColor: avatarBg }]}><Text style={{ fontSize: 12 }}>✨</Text></View>}
      <View style={[st.bubble, isBot ? [st.botBubble, { backgroundColor: botBubbleBg }] : st.userBubble]}>
        <Text style={[st.text, isBot ? { color: botTextColor } : st.userText]}>{text}</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 3, paddingHorizontal: 14 },
  botRow: { justifyContent: 'flex-start', marginRight: 36 },
  userRow: { justifyContent: 'flex-end', marginLeft: 36 },
  avatar: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 6, marginTop: 2 },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '88%' },
  botBubble: { borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: '#6C63FF', borderTopRightRadius: 4 },
  text: { fontSize: 14, lineHeight: 20, ...Platform.select({ android: { lineHeight: 21 } }) },
  userText: { color: '#FFF' },
  dots: { fontSize: 13, letterSpacing: 2 },
});

