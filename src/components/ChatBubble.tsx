import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface ChatBubbleProps {
  text: string;
  isBot: boolean;
  isTyping?: boolean;
}

export default function ChatBubble({ text, isBot, isTyping }: ChatBubbleProps) {
  if (isTyping) {
    return (
      <View style={[styles.row, styles.botRow]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>✨</Text>
        </View>
        <View style={[styles.bubble, styles.botBubble]}>
          <Text style={styles.typingDots}>●  ●  ●</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, isBot ? styles.botRow : styles.userRow]}>
      {isBot && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>✨</Text>
        </View>
      )}
      <View style={[styles.bubble, isBot ? styles.botBubble : styles.userBubble]}>
        <Text style={[styles.text, isBot ? styles.botText : styles.userText]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 14,
  },
  botRow: {
    justifyContent: 'flex-start',
    marginRight: 40,
  },
  userRow: {
    justifyContent: 'flex-end',
    marginLeft: 40,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#EEF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  avatarText: {
    fontSize: 14,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
  },
  botBubble: {
    backgroundColor: '#F0F1F8',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#1A1F71',
    borderTopRightRadius: 4,
  },
  text: {
    fontSize: 14.5,
    lineHeight: 21,
    ...Platform.select({
      android: { lineHeight: 22 },
    }),
  },
  botText: {
    color: '#1A1A2E',
  },
  userText: {
    color: '#FFFFFF',
  },
  typingDots: {
    color: '#9CA3AF',
    fontSize: 14,
    letterSpacing: 2,
  },
});

