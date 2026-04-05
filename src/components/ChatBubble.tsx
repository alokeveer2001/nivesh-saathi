import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface Props { text: string; isBot: boolean; isTyping?: boolean; }

export default function ChatBubble({ text, isBot, isTyping }: Props) {
  if (isTyping) {
    return (
      <View style={[st.row, st.botRow]}>
        <View style={st.avatar}><Text style={{ fontSize: 12 }}>✨</Text></View>
        <View style={[st.bubble, st.botBubble]}><Text style={st.dots}>●  ●  ●</Text></View>
      </View>
    );
  }
  return (
    <View style={[st.row, isBot ? st.botRow : st.userRow]}>
      {isBot && <View style={st.avatar}><Text style={{ fontSize: 12 }}>✨</Text></View>}
      <View style={[st.bubble, isBot ? st.botBubble : st.userBubble]}>
        <Text style={[st.text, isBot ? st.botText : st.userText]}>{text}</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 3, paddingHorizontal: 14 },
  botRow: { justifyContent: 'flex-start', marginRight: 36 },
  userRow: { justifyContent: 'flex-end', marginLeft: 36 },
  avatar: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#1E1E28', justifyContent: 'center', alignItems: 'center', marginRight: 6, marginTop: 2 },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '88%' },
  botBubble: { backgroundColor: '#18181F', borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: '#6C63FF', borderTopRightRadius: 4 },
  text: { fontSize: 14, lineHeight: 20, ...Platform.select({ android: { lineHeight: 21 } }) },
  botText: { color: '#E5E5EA' },
  userText: { color: '#FFF' },
  dots: { color: '#6B7280', fontSize: 13, letterSpacing: 2 },
});

