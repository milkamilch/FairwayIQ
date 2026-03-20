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
  '--color-bg-base':     '#07070f',
  '--color-bg-surface':  '#0f0f1a',
  '--color-bg-card':     '#14141f',
  '--color-bg-elevated': '#1c1c2e',
  '--color-bg-border':   '#252535',
  '--color-ink-primary':   '#f0f0ff',
  '--color-ink-secondary': '#8888aa',
  '--color-ink-muted':     '#44445a',
});

const LIGHT_VARS = vars({
  '--color-bg-base':     '#f5f5fd',
  '--color-bg-surface':  '#ededf8',
  '--color-bg-card':     '#ffffff',
  '--color-bg-elevated': '#f0f0fa',
  '--color-bg-border':   '#ddddf0',
  '--color-ink-primary':   '#07070f',
  '--color-ink-secondary': '#4a4a72',
  '--color-ink-muted':     '#8888aa',
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
