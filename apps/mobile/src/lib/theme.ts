import { useColorScheme } from 'react-native';

// ── Color palettes ─────────────────────────────────────────────────────
const DARK = {
  bgBase:     '#0A0A0A',
  bgSurface:  '#111111',
  bgCard:     '#1A1A1A',
  bgElevated: '#242424',
  bgBorder:   '#2E2E2E',

  inkPrimary:   '#FFFFFF',
  inkSecondary: '#8A8A8A',
  inkMuted:     '#444444',

  // Accent — same in both modes
  neonGreen:   '#FF6535',
  neonGreen12: '#FF653520',  // ~12% opacity
  neonGreen20: '#FF653533',  // ~20% opacity
  neonGreen30: '#FF65354D',  // ~30% opacity

  // Input / chip backgrounds
  chipBg: '#1A1A1A',
} as const;

const LIGHT = {
  bgBase:     '#F9F9F9',
  bgSurface:  '#F0F0F0',
  bgCard:     '#FFFFFF',
  bgElevated: '#F5F5F5',
  bgBorder:   '#E8E8E8',

  inkPrimary:   '#0A0A0A',
  inkSecondary: '#555555',
  inkMuted:     '#AAAAAA',

  // Accent — same in both modes
  neonGreen:   '#FF6535',
  neonGreen12: '#FF653520',
  neonGreen20: '#FF653533',
  neonGreen30: '#FF65354D',

  // Input / chip backgrounds
  chipBg: '#F5F5F5',
} as const;

export interface ThemeColors {
  bgBase: string;
  bgSurface: string;
  bgCard: string;
  bgElevated: string;
  bgBorder: string;
  inkPrimary: string;
  inkSecondary: string;
  inkMuted: string;
  neonGreen: string;
  neonGreen12: string;
  neonGreen20: string;
  neonGreen30: string;
  chipBg: string;
}

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DARK : LIGHT;
}
