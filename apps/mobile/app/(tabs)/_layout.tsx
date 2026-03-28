import { useColorScheme } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const isDark = useColorScheme() === 'dark';
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#111111' : '#FFFFFF',
          borderTopColor: isDark ? '#2E2E2E' : '#E8E8E8',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: bottom > 0 ? bottom : 8,
          height: 52 + (bottom > 0 ? bottom : 8),
        },
        tabBarActiveTintColor: '#FF6535',
        tabBarInactiveTintColor: isDark ? '#444444' : '#AAAAAA',
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="pulse" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: t('tabs.training'),
          tabBarIcon: ({ color, size }) => <Ionicons name="fitness" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: t('tabs.courses'),
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rounds"
        options={{
          title: t('tabs.rounds'),
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: t('tabs.social'),
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: t('tabs.games'),
          tabBarIcon: ({ color, size }) => <Ionicons name="dice-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
