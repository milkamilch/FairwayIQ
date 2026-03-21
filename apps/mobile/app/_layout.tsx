import '../global.css';
import '../src/i18n';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { vars } from 'nativewind';
import { useAuthStore } from '../src/store/authStore';

// ── Theme-Variablen (werden von allen Tailwind-Klassen via var(--*) aufgelöst)
const DARK_VARS = vars({
  '--color-bg-base':     '#0A0A0A',
  '--color-bg-surface':  '#111111',
  '--color-bg-card':     '#1A1A1A',
  '--color-bg-elevated': '#242424',
  '--color-bg-border':   '#2E2E2E',
  '--color-ink-primary':   '#FFFFFF',
  '--color-ink-secondary': '#8A8A8A',
  '--color-ink-muted':     '#444444',
});

const LIGHT_VARS = vars({
  '--color-bg-base':     '#F9F9F9',
  '--color-bg-surface':  '#F0F0F0',
  '--color-bg-card':     '#FFFFFF',
  '--color-bg-elevated': '#F5F5F5',
  '--color-bg-border':   '#E8E8E8',
  '--color-ink-primary':   '#0A0A0A',
  '--color-ink-secondary': '#555555',
  '--color-ink-muted':     '#AAAAAA',
});

export default function RootLayout() {
  const { isInitialized, user, initialize } = useAuthStore();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, user]);

  if (!isInitialized) return null;

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={[{ flex: 1 }, colorScheme === 'dark' ? DARK_VARS : LIGHT_VARS]}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </>
  );
}
