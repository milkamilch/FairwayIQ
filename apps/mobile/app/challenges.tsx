import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../src/lib/api';
import { useTheme } from '../src/lib/theme';
import { BadgeDefinition } from '../src/store/trainingStore';

// ── API Response Types ──────────────────────────────────────────────────
interface GamificationStatus {
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastTrainedAt: string | null;
  };
  badges: (BadgeDefinition & { earned: boolean; earnedAt: string | null })[];
  totalSessions: number;
  dailyGoal: {
    completed: boolean;
    currentDay: number | null;
    totalDays: number | null;
    hasActivePlan: boolean;
  };
}

const CATEGORY_ORDER = ['sessions', 'streak', 'performance', 'variety'];

// ── Streak Days Display ─────────────────────────────────────────────────
function StreakDots({ count }: { count: number }) {
  const { t } = useTranslation();
  const c = useTheme();
  // German abbreviation keys (Mo=Monday, Di=Tuesday, ...) matching i18n keys
  const dayKeys = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <View className="flex-row gap-1.5 mt-3">
      {dayKeys.map((key, i) => {
        const daysAgo = (todayIdx - i + 7) % 7;
        const active = daysAgo < count;
        const isToday = i === todayIdx;
        return (
          <View key={key} className="flex-1 items-center gap-1">
            <View
              className="w-full rounded-md"
              style={{
                height: 6,
                backgroundColor: active ? '#f97316' : c.bgBorder,
                opacity: isToday && !active ? 0.5 : 1,
              }}
            />
            <Text
              className="text-xs"
              style={{ color: isToday ? '#f97316' : c.inkMuted, fontWeight: isToday ? '700' : '400' }}
            >
              {t(`challenges.days.${key}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Badge Card ──────────────────────────────────────────────────────────
function BadgeCard({ badge }: { badge: BadgeDefinition & { earned: boolean; earnedAt: string | null } }) {
  const c = useTheme();
  return (
    <View
      className="rounded-xl p-3 items-center gap-1.5"
      style={{
        backgroundColor: badge.earned ? badge.color + '15' : c.bgSurface,
        borderWidth: 1,
        borderColor: badge.earned ? badge.color + '40' : c.bgBorder,
        opacity: badge.earned ? 1 : 0.6,
        width: '30%',
      }}
    >
      <View
        className="w-12 h-12 rounded-xl items-center justify-center"
        style={{ backgroundColor: badge.earned ? badge.color + '20' : c.bgElevated }}
      >
        {badge.earned ? (
          <Ionicons name={badge.icon as any} size={24} color={badge.color} />
        ) : (
          <Ionicons name="lock-closed" size={20} color={c.bgBorder} />
        )}
      </View>
      <Text
        className="text-xs font-semibold text-center leading-4"
        style={{ color: badge.earned ? badge.color : c.inkSecondary }}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
    </View>
  );
}

export default function ChallengesScreen() {
  const { t } = useTranslation();
  const c = useTheme();
  const [status, setStatus] = useState<GamificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<GamificationStatus>('/gamification/status')
      .then(({ data }) => setStatus(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const earnedCount = status?.badges.filter((b) => b.earned).length ?? 0;
  const totalBadges = status?.badges.length ?? 0;

  const grouped = status?.badges.reduce<Record<string, typeof status.badges>>((acc, b) => {
    if (!acc[b.category]) acc[b.category] = [];
    acc[b.category].push(b);
    return acc;
  }, {}) ?? {};

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      {/* Header */}
      <View className="px-5 pt-4 pb-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={c.inkPrimary} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">{t('challenges.sectionLabel')}</Text>
          <Text className="text-ink-primary text-2xl font-black mt-0.5">{t('challenges.title')}</Text>
        </View>
        <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: c.neonGreen20, borderWidth: 1, borderColor: c.neonGreen20 }}>
          <Text className="text-neon-green text-xs font-bold">{earnedCount}/{totalBadges}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6535" className="mt-20" />
      ) : !status ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-ink-muted">{t('common.noData')}</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

          {/* Daily Goal */}
          <View
            className="rounded-2xl p-4 mb-4"
            style={{
              backgroundColor: status.dailyGoal.completed ? c.neonGreen12 : c.bgCard,
              borderWidth: 1,
              borderColor: status.dailyGoal.completed ? c.neonGreen20 : c.bgBorder,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: status.dailyGoal.completed ? '#FF6535' : c.bgElevated }}
                >
                  <Ionicons
                    name={status.dailyGoal.completed ? 'checkmark' : 'golf-outline'}
                    size={20}
                    color={status.dailyGoal.completed ? '#0A0A0A' : c.inkMuted}
                  />
                </View>
                <View>
                  <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">{t('challenges.dailyGoal')}</Text>
                  <Text className="text-ink-primary font-bold mt-0.5">
                    {status.dailyGoal.completed
                      ? t('challenges.trainedToday')
                      : status.dailyGoal.hasActivePlan
                        ? t('challenges.dayPending', { day: status.dailyGoal.currentDay })
                        : t('challenges.noActivePlan')}
                  </Text>
                </View>
              </View>
              {!status.dailyGoal.completed && status.dailyGoal.hasActivePlan && (
                <TouchableOpacity onPress={() => router.back()}>
                  <Text className="text-neon-green text-sm font-semibold">{t('challenges.goTraining')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {status.dailyGoal.hasActivePlan && status.dailyGoal.totalDays && (
              <View className="mt-3">
                <View className="rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: c.bgElevated }}>
                  <View
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${((status.dailyGoal.currentDay ?? 1) - 1) / status.dailyGoal.totalDays * 100}%`,
                      backgroundColor: '#FF6535',
                    }}
                  />
                </View>
                <Text className="text-ink-muted text-xs mt-1">
                  {t('challenges.daysOf', { current: (status.dailyGoal.currentDay ?? 1) - 1, total: status.dailyGoal.totalDays })}
                </Text>
              </View>
            )}
          </View>

          {/* Streak Card */}
          <View
            className="rounded-2xl p-4 mb-4"
            style={{
              backgroundColor: status.streak.currentStreak > 0 ? '#f9730312' : c.bgCard,
              borderWidth: 1,
              borderColor: status.streak.currentStreak > 0 ? '#f9730330' : c.bgBorder,
            }}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">{t('challenges.streakLabel')}</Text>
              <Text className="text-xs" style={{ color: '#f59e0b' }}>
                {t('challenges.longestStreak', { days: status.streak.longestStreak })}
              </Text>
            </View>
            <View className="flex-row items-end gap-2">
              <Text
                className="font-bold"
                style={{
                  fontSize: 48,
                  color: status.streak.currentStreak > 0 ? '#f97316' : c.inkMuted,
                  lineHeight: 56,
                }}
              >
                {status.streak.currentStreak}
              </Text>
              <Text className="text-ink-secondary text-base mb-2">
                {t('challenges.daysInRow', {
                  count: status.streak.currentStreak,
                  plural: status.streak.currentStreak === 1 ? '' : 's',
                })}
              </Text>
              {status.streak.currentStreak > 0 && (
                <Ionicons name="flame-outline" size={28} color="#f97316" style={{ marginBottom: 4 }} />
              )}
            </View>
            <StreakDots count={Math.min(status.streak.currentStreak, 7)} />
          </View>

          {/* Stats Row */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-bg-card rounded-2xl p-4 items-center">
              <Text className="text-neon-green font-bold text-2xl">{status.totalSessions}</Text>
              <Text className="text-ink-muted text-xs mt-1">{t('challenges.sessions')}</Text>
            </View>
            <View className="flex-1 bg-bg-card rounded-2xl p-4 items-center">
              <Text className="font-bold text-2xl" style={{ color: '#f59e0b' }}>{earnedCount}</Text>
              <Text className="text-ink-muted text-xs mt-1">{t('challenges.badgesEarned')}</Text>
            </View>
            <View className="flex-1 bg-bg-card rounded-2xl p-4 items-center">
              <Text className="font-bold text-2xl" style={{ color: '#a78bfa' }}>{status.streak.longestStreak}</Text>
              <Text className="text-ink-muted text-xs mt-1">{t('challenges.bestStreak')}</Text>
            </View>
          </View>

          {/* Badge Grid by Category */}
          {CATEGORY_ORDER.map((cat) => {
            const badges = grouped[cat];
            if (!badges?.length) return null;
            return (
              <View key={cat} className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">
                    {t(`challenges.categories.${cat}`)}
                  </Text>
                  <Text className="text-ink-muted text-xs">
                    {badges.filter((b) => b.earned).length}/{badges.length}
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {badges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </View>
              </View>
            );
          })}

          <View className="h-8" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
