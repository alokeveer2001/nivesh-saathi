/**
 * Nivesh Saathi — Premium Dark Theme
 *
 * Deep charcoal backgrounds with soft glowing accents.
 * Minimal, subtle, high-contrast where it matters.
 */

export const Colors = {
  // Core
  primary: '#6C63FF',         // Soft indigo
  primaryLight: '#8B85FF',
  primaryDark: '#4F46E5',
  primaryMuted: 'rgba(108,99,255,0.15)',

  // Accent
  accent: '#F59E0B',          // Warm amber
  accentLight: '#FBBF24',
  accentMuted: 'rgba(245,158,11,0.12)',

  // Bucket colors
  safePocket: '#34D399',
  safePocketLight: 'rgba(52,211,153,0.12)',
  growthPocket: '#FBBF24',
  growthPocketLight: 'rgba(251,191,36,0.12)',
  opportunityPocket: '#F472B6',
  opportunityPocketLight: 'rgba(244,114,182,0.12)',

  // Backgrounds — layered dark
  bg: '#0B0B0F',              // deepest
  bgElevated: '#111118',      // cards
  bgSurface: '#18181F',       // raised surfaces
  bgInput: '#1E1E28',         // inputs, wells
  bgHover: '#22222E',         // pressed states

  // Text
  textPrimary: '#F0F0F5',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#000000',

  // Borders
  border: 'rgba(255,255,255,0.06)',
  borderLight: 'rgba(255,255,255,0.04)',
  borderActive: 'rgba(108,99,255,0.3)',

  // Status
  success: '#34D399',
  successMuted: 'rgba(52,211,153,0.12)',
  warning: '#FBBF24',
  warningMuted: 'rgba(251,191,36,0.12)',
  error: '#F87171',
  errorMuted: 'rgba(248,113,113,0.12)',
  info: '#60A5FA',
  infoMuted: 'rgba(96,165,250,0.12)',

  // Misc
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.6)',

  // Legacy compat
  background: '#0B0B0F',
  surface: '#111118',
  surfaceElevated: '#18181F',
  textLight: '#6B7280',
  chatBotBubble: '#18181F',
  chatUserBubble: '#6C63FF',
  chatBotText: '#F0F0F5',
  chatUserText: '#FFFFFF',
  gardenGround: '#2D1F0E',
  gardenSky: '#0B0B0F',
  gardenGreen: '#34D399',
};

export const Gradients = {
  primary: ['#6C63FF', '#4F46E5'] as const,
  header: ['#0B0B0F', '#111118', '#18181F'] as const,
  card: ['#111118', '#18181F'] as const,
  safe: ['#34D399', '#10B981'] as const,
  growth: ['#FBBF24', '#F59E0B'] as const,
  opportunity: ['#F472B6', '#EC4899'] as const,
  dark: ['#0B0B0F', '#111118'] as const,
  accent: ['#F59E0B', '#D97706'] as const,
};

