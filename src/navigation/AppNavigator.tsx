import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useUser } from '../context/UserContext';

import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import GoalsScreen from '../screens/GoalsScreen';
import ChatScreen from '../screens/ChatScreen';
import GardenScreen from '../screens/GardenScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SIPCalculatorScreen from '../screens/SIPCalculatorScreen';
import LearnScreen from '../screens/LearnScreen';
import InsightsScreen from '../screens/InsightsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 82 : 66,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎯" label="Goals" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Saathi"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="✨" label="Saathi" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧠" label="Insights" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="SIPCalculator"
        component={SIPCalculatorScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Learn"
        component={LearnScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Garden"
        component={GardenScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingEmoji}>✨</Text>
        <Text style={styles.loadingTitle}>Nivesh Saathi</Text>
        <Text style={styles.loadingSubtitle}>AI-powered investing</Text>
        <ActivityIndicator size="small" color="#1A1F71" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user && user.onboardingComplete ? <AppStack /> : <OnboardingScreen />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 20,
    opacity: 0.4,
  },
  tabEmojiActive: {
    opacity: 1,
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#1A1F71',
    fontWeight: '700',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFF',
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  loadingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1F71',
    letterSpacing: -0.5,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

