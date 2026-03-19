import { useColorScheme } from 'react-native';

// ── Color palettes ─────────────────────────────────────────────────────
const DARK = {
  bgBase:     '#07070f',
  bgSurface:  '#0f0f1a',
  bgCard:     '#14141f',
  bgElevated: '#1c1c2e',
  bgBorder:   '#252535',

  inkPrimary:   '#f0f0ff',
  inkSecondary: '#8888aa',
  inkMuted:     '#44445a',

  // Accent — same in both modes
  neonGreen:  '#00e87a',
  neonGreen12: '#00e87a1f',  // ~12% opacity
  neonGreen20: '#00e87a33',  // ~20% opacity
  neonGreen30: '#00e87a4d',  // ~30% opacity

  // Input / chip backgrounds
  chipBg: '#14141f',
} as const;

const LIGHT = {
  bgBase:     '#f5f5fd',
  bgSurface:  '#ededf8',
  bgCard:     '#ffffff',
  bgElevated: '#f0f0fa',
  bgBorder:   '#ddddf0',

  inkPrimary:   '#07070f',
  inkSecondary: '#4a4a72',
  inkMuted:     '#8888aa',

  // Accent — same in both modes
  neonGreen:  '#00e87a',
  neonGreen12: '#00e87a1f',
  neonGreen20: '#00e87a33',
  neonGreen30: '#00e87a4d',

  // Input / chip backgrounds
  chipBg: '#f0f0fa',
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
