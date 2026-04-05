/**
 * Theme-aware style overrides.
 *
 * Since screens use StyleSheet.create with hardcoded dark colors,
 * this hook provides override styles that can be spread onto Views/Texts
 * to make them respond to the current theme.
 */
import { useTheme } from '../context/ThemeContext';
import { Platform } from 'react-native';

export function useThemedStyles() {
  const { C, isDark, mode } = useTheme();

  return {
    C,
    isDark,
    statusBarStyle: (isDark ? 'light' : 'dark') as 'light' | 'dark',
    // Container
    containerBg: { backgroundColor: C.bg },
    // Cards
    cardBg: { backgroundColor: C.surface, borderColor: C.border },
    elevatedBg: { backgroundColor: C.elevated, borderColor: C.border },
    inputBg: { backgroundColor: C.input, borderColor: C.border, color: C.text },
    // Text
    textPrimary: { color: C.text },
    textSecondary: { color: C.textSec },
    textMuted: { color: C.textMuted },
    // Borders
    borderColor: { borderColor: C.border },
    // Modal
    modalBg: { backgroundColor: C.overlay },
    modalSheet: { backgroundColor: C.elevated },
    // Chips
    chipBg: { backgroundColor: C.input, borderColor: C.border },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    // Buttons
    btnSecBg: { backgroundColor: C.input, borderColor: C.border },
    // Header gradient
    headerGradient: isDark ? ['#0B0B0F', '#111118'] as const : ['#F8F9FC', '#FFFFFF'] as const,
    // Tab bar
    tabBarStyle: {
      backgroundColor: C.tabBg,
      borderTopColor: C.tabBorder,
    },
  };
}

