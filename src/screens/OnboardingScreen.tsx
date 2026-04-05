import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { useUser } from '../context/UserContext';
import { OnboardingStep, GoalType, RiskLevel, UserProfile } from '../types';
import { parseAmount, formatFullCurrency } from '../utils/helpers';
import { getBucketExplanation } from '../services/aiService';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  options?: { label: string; value: string }[];
}

export default function OnboardingScreen() {
  const { setUser } = useUser();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [userData, setUserData] = useState<Partial<UserProfile>>({});
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Start conversation
    setTimeout(() => {
      addBotMessage(
        `${Strings.onboarding.welcome}\n\n${Strings.onboarding.welcomeSub}`,
      );
      setTimeout(() => {
        addBotMessage(Strings.onboarding.askName);
        setShowInput(true);
        setStep('name');
      }, 1200);
    }, 600);
  }, []);

  const addBotMessage = (text: string, options?: { label: string; value: string }[]) => {
    const msg: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      isBot: true,
      options,
    };
    setMessages(prev => [...prev, msg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const addUserMessage = (text: string) => {
    const msg: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      isBot: false,
    };
    setMessages(prev => [...prev, msg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    processInput(text);
  };

  const handleOptionSelect = (value: string, label: string) => {
    addUserMessage(label);
    setShowInput(false);

    if (step === 'goal') {
      const goalMap: Record<string, GoalType> = {
        house: 'house', education: 'education', car: 'car',
        travel: 'travel', emergency: 'emergency', wealth: 'wealth',
      };
      const goal = goalMap[value] || 'wealth';
      setUserData(prev => ({ ...prev, primaryGoal: goal }));

      setTimeout(() => {
        addBotMessage(Strings.onboarding.askRisk, [
          { label: '🛡️ Safe - Paisa safe rahe', value: 'safe' },
          { label: '⚖️ Balanced - Thoda risk ok', value: 'balanced' },
          { label: '🚀 Aggressive - Zyada return!', value: 'aggressive' },
        ]);
        setStep('risk');
      }, 800);
    } else if (step === 'risk') {
      const riskLevel = value as RiskLevel;
      const finalData = { ...userData, riskLevel };
      setUserData(finalData);

      setTimeout(() => {
        const investable = Math.max(0, (finalData.monthlyIncome || 0) - (finalData.monthlyExpense || 0));
        const explanation = getBucketExplanation(riskLevel, investable);
        addBotMessage(explanation);

        setTimeout(() => {
          addBotMessage(
            Strings.onboarding.planReady(finalData.name || 'Dost'),
            [{ label: '🚀 Chalein Dashboard pe!', value: 'done' }]
          );
          setStep('plan_ready');
        }, 1500);
      }, 800);
    } else if (step === 'plan_ready') {
      // Complete onboarding
      const finalUser: UserProfile = {
        name: userData.name || 'User',
        age: userData.age || 25,
        monthlyIncome: userData.monthlyIncome || 30000,
        monthlyExpense: userData.monthlyExpense || 20000,
        primaryGoal: userData.primaryGoal || 'wealth',
        riskLevel: userData.riskLevel || 'balanced',
        onboardingComplete: true,
      };
      setUser(finalUser);
    }
  };

  const processInput = (text: string) => {
    addUserMessage(text);
    setShowInput(false);

    switch (step) {
      case 'name': {
        const name = text.split(' ')[0]; // First name
        setUserData(prev => ({ ...prev, name }));
        setTimeout(() => {
          addBotMessage(Strings.onboarding.greetUser(name));
          setTimeout(() => {
            addBotMessage(Strings.onboarding.askAge);
            setShowInput(true);
            setStep('age');
          }, 800);
        }, 600);
        break;
      }
      case 'age': {
        const age = parseInt(text) || 25;
        setUserData(prev => ({ ...prev, age }));
        setTimeout(() => {
          addBotMessage(Strings.onboarding.askIncome);
          setShowInput(true);
          setStep('income');
        }, 600);
        break;
      }
      case 'income': {
        const income = parseAmount(text);
        setUserData(prev => ({ ...prev, monthlyIncome: income }));
        setTimeout(() => {
          addBotMessage(
            `${formatFullCurrency(income)}/month - noted! ✅\n\n${Strings.onboarding.askExpense}`
          );
          setShowInput(true);
          setStep('expense');
        }, 600);
        break;
      }
      case 'expense': {
        const expense = parseAmount(text);
        const income = userData.monthlyIncome || 30000;
        const investable = Math.max(0, income - expense);
        setUserData(prev => ({ ...prev, monthlyExpense: expense }));
        setTimeout(() => {
          addBotMessage(
            `Great! Aapke paas invest karne ke liye har mahine ${formatFullCurrency(investable)} hai! 🎉\n\nAb batayiye...`
          );
          setTimeout(() => {
            addBotMessage(Strings.onboarding.askGoal, [
              { label: '🏠 Ghar khareedna', value: 'house' },
              { label: '🎓 Bachche ki padhai', value: 'education' },
              { label: '🚗 Gaadi lena', value: 'car' },
              { label: '✈️ Holiday trip', value: 'travel' },
              { label: '🛡️ Emergency fund', value: 'emergency' },
              { label: '📈 Paisa grow karna', value: 'wealth' },
            ]);
            setStep('goal');
          }, 1000);
        }, 600);
        break;
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0B0B0F', '#111118']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🤝 Nivesh Saathi</Text>
        <Text style={styles.headerSubtitle}>Aapka AI Money Buddy</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <Animated.View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.isBot ? styles.botRow : styles.userRow,
                { opacity: fadeAnim },
              ]}
            >
              {msg.isBot && (
                <View style={styles.avatar}>
                  <Text style={styles.avatarEmoji}>🤖</Text>
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  msg.isBot ? styles.botBubble : styles.userBubble,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    msg.isBot ? styles.botText : styles.userText,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            </Animated.View>
          ))}

          {/* Option buttons */}
          {messages.length > 0 &&
            messages[messages.length - 1].options && (
              <View style={styles.optionsContainer}>
                {messages[messages.length - 1].options!.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.optionButton}
                    onPress={() => handleOptionSelect(opt.value, opt.label)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.optionText}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
        </ScrollView>

        {showInput && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type karo..."
              placeholderTextColor={Colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              autoFocus
              keyboardType={
                step === 'age' || step === 'income' || step === 'expense'
                  ? 'numeric'
                  : 'default'
              }
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Text style={styles.sendText}>→</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 18,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textOnPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 3,
  },
  chatArea: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 20,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: 14,
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.chatBotBubble,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  botBubble: {
    backgroundColor: Colors.chatBotBubble,
    borderTopLeftRadius: 6,
  },
  userBubble: {
    backgroundColor: Colors.chatUserBubble,
    borderTopRightRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  botText: {
    color: Colors.chatBotText,
  },
  userText: {
    color: Colors.chatUserText,
  },
  optionsContainer: {
    paddingHorizontal: 58,
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendText: {
    fontSize: 20,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
});

