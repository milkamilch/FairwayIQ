import { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../src/lib/theme';
import { api } from '../src/lib/api';
import { registerPushToken } from '../src/lib/useNotifications';

interface NotifPrefs {
  notifTraining: boolean;
  notifStreak: boolean;
  notifWeather: boolean;
  notifFriends: boolean;
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const c = useTheme();
  const [prefs, setPrefs] = useState<NotifPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === 'granted');
      try {
        const { data } = await api.get<NotifPrefs>('/notifications/prefs');
        setPrefs(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const toggle = async (key: keyof NotifPrefs) => {
    if (!prefs) return;
    if (!permissionGranted) {
      Alert.alert(t('common.error'), t('profile.notifications.permissionDenied'));
      return;
    }
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try {
      await api.patch('/notifications/prefs', { [key]: updated[key] });
      if (updated[key]) await registerPushToken();
    } catch {
      setPrefs(prefs);
    }
  };

  const items: { key: keyof NotifPrefs; icon: string; color: string }[] = [
    { key: 'notifTraining', icon: 'barbell-outline',   color: '#FF6535' },
    { key: 'notifStreak',   icon: 'flame-outline',     color: '#f97316' },
    { key: 'notifWeather',  icon: 'partly-sunny-outline', color: '#00e87a' },
    { key: 'notifFriends',  icon: 'people-outline',    color: '#a855f7' },
  ];

  const labelKey = (key: keyof NotifPrefs) =>
    key.replace('notif', '').toLowerCase() as 'training' | 'streak' | 'weather' | 'friends';

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <View className="px-5 pt-4 pb-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={c.inkPrimary} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">{t('profile.notifications.sectionLabel')}</Text>
          <Text className="text-ink-primary text-xl font-bold mt-0.5">{t('profile.notifications.title')}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6535" className="mt-20" />
      ) : (
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {!permissionGranted && (
            <View className="bg-bg-card rounded-2xl p-4 mb-4 flex-row items-start gap-3" style={{ borderWidth: 1, borderColor: '#f59e0b40' }}>
              <Ionicons name="warning-outline" size={18} color="#f59e0b" style={{ marginTop: 1 }} />
              <Text className="text-ink-secondary text-sm flex-1 leading-5">{t('profile.notifications.permissionDenied')}</Text>
            </View>
          )}

          <View className="bg-bg-card rounded-2xl overflow-hidden mb-8">
            {items.map((item, i) => {
              const lk = labelKey(item.key);
              return (
                <View
                  key={item.key}
                  className="px-4 py-4 flex-row items-center gap-3"
                  style={{ borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: c.bgBorder }}
                >
                  <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: item.color + '20' }}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink-primary text-sm font-semibold">{t(`profile.notifications.${lk}`)}</Text>
                    <Text className="text-ink-muted text-xs mt-0.5">{t(`profile.notifications.${lk}Sub`)}</Text>
                  </View>
                  <Switch
                    value={prefs?.[item.key] ?? false}
                    onValueChange={() => toggle(item.key)}
                    trackColor={{ false: c.bgBorder, true: item.color + '60' }}
                    thumbColor={prefs?.[item.key] ? item.color : c.inkMuted}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
