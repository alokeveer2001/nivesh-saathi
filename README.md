# 🤝 Nivesh Saathi — Aapka AI Money Buddy

> An AI-native investment companion for Bharat that makes investing as simple as chatting with a friend.

## 🎯 Problem Statement

100M+ Indians have disposable income but **don't invest** because:
- Financial jargon is scary and intimidating
- Too many choices cause **decision paralysis** (5000+ mutual funds!)
- No **personalized guidance** in their language
- Existing apps are tools, not companions

## 💡 Our Solution

**Nivesh Saathi** is a conversational AI financial companion that:
1. **Onboards via natural chat in Hinglish** — understands income, goals, risk appetite through conversation
2. **Auto-creates a personalized "Money Plan"** with 3 smart buckets
3. **Gives daily AI nudges** to build investing habits
4. **Visualizes growth as a Money Garden** 🌱 for emotional connection

## ✨ Key Features

### 🤖 Conversational Onboarding
- Chat-based setup (no boring forms!)
- Asks naturally about income, expenses, goals, risk appetite
- Generates personalized investment plan in < 2 minutes

### 🪣 3-Bucket Money System
| Bucket | Purpose | Risk | Expected Return |
|--------|---------|------|-----------------|
| 🟢 Safe Pocket | Emergency Fund, Liquid Funds | Low | ~7% p.a. |
| 🟡 Growth Pocket | SIP, Mutual Funds, Goals | Medium | ~14% p.a. |
| 🔴 Opportunity Pocket | High Growth, Stocks | High | ~20% p.a. |

Auto-allocated based on user's risk profile (Safe/Balanced/Aggressive).

### 🌱 Money Garden (Gamification)
- Each goal is a plant that grows as you invest
- Stages: 🌰 Seed → 🌱 Sprout → 🌿 Sapling → 🌳 Tree → 🌳✨ Fruit Tree
- Creates emotional connection with investments

### 💬 Goal Mitra AI Chat
- Personal AI financial advisor in Hinglish
- Answers questions about SIP, mutual funds, tax saving, market crashes
- Personalized advice based on user profile

### 💡 Smart Daily Nudges
- "Chai pe ₹30 bach gaye? Growth Pocket mein daal dein? ☕"
- Behavioral nudges that find "invisible savings"
- WhatsApp-style relatable language

### 🎯 Goal-Based Investing
- Pre-built goal templates (Ghar, Education, Car, Travel, Emergency, Wealth)
- Auto-calculates monthly SIP needed
- Visual progress tracking

## 🏗️ Tech Stack

- **Framework**: React Native + Expo (SDK 54)
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs)
- **UI**: Custom components + Expo Linear Gradient
- **State**: React Context + AsyncStorage
- **AI Engine**: Built-in Hinglish NLP response system

## 📁 Project Structure

```
src/
├── screens/
│   ├── OnboardingScreen.tsx    # Conversational chat onboarding
│   ├── HomeScreen.tsx          # Dashboard with buckets & garden
│   ├── ChatScreen.tsx          # Goal Mitra AI chat
│   ├── GoalsScreen.tsx         # Goals management
│   ├── GardenScreen.tsx        # Money Garden visualization
│   └── ProfileScreen.tsx       # User profile & settings
├── components/
│   ├── ChatBubble.tsx          # Chat message bubble
│   ├── MoneyBucketCard.tsx     # Bucket visualization card
│   ├── GoalCard.tsx            # Goal progress card
│   ├── MoneyGarden.tsx         # Garden visualization
│   └── GradientCard.tsx        # Reusable gradient card
├── navigation/
│   └── AppNavigator.tsx        # Tab navigation + auth flow
├── context/
│   └── UserContext.tsx          # Global state management
├── services/
│   └── aiService.ts            # AI response engine
├── constants/
│   ├── colors.ts               # Design system colors
│   └── strings.ts              # Hinglish strings
├── types/
│   └── index.ts                # TypeScript types
└── utils/
    └── helpers.ts              # Utility functions
```

## 🚀 How to Run

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Run on Android
npx expo start --android

# Build APK
eas build -p android --profile preview
```

## 📱 Building the APK

```bash
# Login to Expo
eas login

# Build APK
eas build -p android --profile preview

# Or build locally (needs Android SDK)
npx expo run:android
```

## 🎯 TAM Analysis

- **India's working population**: 500M+
- **Smartphone users**: 700M+
- **People with disposable income who don't invest**: ~200M
- **Target TAM**: 100M+ first-time investors from Tier 2/3 cities

## 💰 Monetization Strategy

1. **Freemium Model**: Free basic features, premium AI insights
2. **Commission on Investments**: Partner with AMCs for distribution fees
3. **Premium Subscription** (₹99/mo): Advanced AI, tax planning, portfolio rebalancing
4. **Affiliate Revenue**: Insurance, credit cards, loans cross-sell

## 🏰 Moat

1. **Hinglish AI**: First mover in conversational investing in Indian languages
2. **Behavioral Design**: Garden gamification creates habit loops
3. **Data Flywheel**: More users → better AI → better recommendations
4. **Trust Building**: Simple language builds trust with non-English speakers

## ⚠️ Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| SEBI regulatory changes | Build as advisor, not broker; partner with registered entities |
| User trust with money | Start with education + small amounts; show transparency |
| Competition from Groww/Zerodha | Focus on Tier 2/3; Hinglish-first approach |
| AI accuracy | Conservative recommendations; clear disclaimers |

---

**Built with ❤️ for Bharat** 🇮🇳

