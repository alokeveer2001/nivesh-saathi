import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'dark' | 'light';

interface ThemeColors {
  bg: string;
  surface: string;
  elevated: string;
  input: string;
  primary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  text: string;
  textSec: string;
  textMuted: string;
  border: string;
  borderActive: string;
  overlay: string;
  // Tab bar
  tabBg: string;
  tabBorder: string;
  // Stack bg (for Android back flash fix)
  stackBg: string;
}

const DARK: ThemeColors = {
  bg: '#0B0B0F', surface: '#111118', elevated: '#18181F', input: '#1E1E28',
  primary: '#6C63FF', accent: '#F59E0B', success: '#34D399', error: '#F87171', warning: '#FBBF24',
  text: '#F0F0F5', textSec: '#9CA3AF', textMuted: '#6B7280',
  border: 'rgba(255,255,255,0.06)', borderActive: 'rgba(108,99,255,0.3)',
  overlay: 'rgba(0,0,0,0.6)',
  tabBg: '#111118', tabBorder: 'rgba(255,255,255,0.06)',
  stackBg: '#0B0B0F',
};

const LIGHT: ThemeColors = {
  bg: '#F8F9FC', surface: '#FFFFFF', elevated: '#FFFFFF', input: '#F0F1F5',
  primary: '#6C63FF', accent: '#F59E0B', success: '#10B981', error: '#EF4444', warning: '#F59E0B',
  text: '#1A1A2E', textSec: '#6B7280', textMuted: '#9CA3AF',
  border: '#E5E7EB', borderActive: 'rgba(108,99,255,0.2)',
  overlay: 'rgba(0,0,0,0.4)',
  tabBg: '#FFFFFF', tabBorder: '#E5E7EB',
  stackBg: '#F8F9FC',
};

interface ThemeContextType {
  mode: ThemeMode;
  C: ThemeColors;
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark', C: DARK, isDark: true, toggle: () => {},
});

const THEME_KEY = '@nivesh_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(v => {
      if (v === 'light' || v === 'dark') setMode(v);
    });
  }, []);

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    AsyncStorage.setItem(THEME_KEY, next);
  };

  const C = mode === 'dark' ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ mode, C, isDark: mode === 'dark', toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

