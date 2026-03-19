import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../src/lib/api';
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

const CATEGORY_LABELS: Record<string, string> = {
  sessions: 'Einheiten',
  streak: 'Streak',
  performance: 'Leistung',
  variety: 'Vielfalt',
};

const CATEGORY_ORDER = ['sessions', 'streak', 'performance', 'variety'];

// ── Streak Days Display ─────────────────────────────────────────────────
function StreakDots({ count }: { count: number }) {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const today = new Date().getDay();
  // Sunday = 0 in JS, but we want Mo=0
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <View className="flex-row gap-1.5 mt-3">
      {days.map((day, i) => {
        const daysAgo = (todayIdx - i + 7) % 7;
        const active = daysAgo < count;
        const isToday = i === todayIdx;
        return (
          <View key={day} className="flex-1 items-center gap-1">
            <View
              className="w-full rounded-md"
              style={{
                height: 6,
                backgroundColor: active ? '#f97316' : '#252535',
                opacity: isToday && !active ? 0.5 : 1,
              }}
            />
            <Text
              className="text-xs"
              style={{ color: isToday ? '#f97316' : '#44445a', fontWeight: isToday ? '700' : '400' }}
            >
              {day}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Badge Card ──────────────────────────────────────────────────────────
function BadgeCard({ badge }: { badge: BadgeDefinition & { earned: boolean; earnedAt: string | null } }) {
  return (
    <View
      className="rounded-xl p-3 items-center gap-1.5"
      style={{
        backgroundColor: badge.earned ? badge.color + '15' : '#0f0f1a',
        borderWidth: 1,
        borderColor: badge.earned ? badge.color + '40' : '#1a1a2e',
        opacity: badge.earned ? 1 : 0.5,
        width: '30%',
      }}
    >
      <View
        className="w-12 h-12 rounded-xl items-center justify-center"
        style={{ backgroundColor: badge.earned ? badge.color + '20' : '#14141f' }}
      >
        {badge.earned ? (
          <Text style={{ fontSize: 24 }}>{badge.icon}</Text>
        ) : (
          <Ionicons name="lock-closed" size={20} color="#252535" />
        )}
      </View>
      <Text
        className="text-xs font-semibold text-center leading-4"
        style={{ color: badge.earned ? badge.color : '#252535' }}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
    </View>
  );
}

export default function ChallengesScreen() {
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
          <Ionicons name="chevron-back" size={22} color="#f0f0ff" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Gamification</Text>
          <Text className="text-ink-primary text-xl font-bold mt-0.5">Challenges</Text>
        </View>
        <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#00e87a20', borderWidth: 1, borderColor: '#00e87a40' }}>
          <Text className="text-neon-green text-xs font-bold">{earnedCount}/{totalBadges}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#00e87a" className="mt-20" />
      ) : !status ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-ink-muted">Keine Daten verfügbar</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

          {/* Daily Goal */}
          <View
            className="rounded-2xl p-4 mb-4"
            style={{
              backgroundColor: status.dailyGoal.completed ? '#00e87a12' : '#14141f',
              borderWidth: 1,
              borderColor: status.dailyGoal.completed ? '#00e87a40' : '#252535',
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: status.dailyGoal.completed ? '#00e87a' : '#252535' }}
                >
                  <Ionicons
                    name={status.dailyGoal.completed ? 'checkmark' : 'golf-outline'}
                    size={20}
                    color={status.dailyGoal.completed ? '#07070f' : '#44445a'}
                  />
                </View>
                <View>
                  <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Tagesziel</Text>
                  <Text className="text-ink-primary font-bold mt-0.5">
                    {status.dailyGoal.completed
                      ? 'Heute trainiert! ✓'
                      : status.dailyGoal.hasActivePlan
                        ? `Tag ${status.dailyGoal.currentDay} ausstehend`
                        : 'Kein aktiver Plan'}
                  </Text>
                </View>
              </View>
              {!status.dailyGoal.completed && status.dailyGoal.hasActivePlan && (
                <TouchableOpacity onPress={() => router.back()}>
                  <Text className="text-neon-green text-sm font-semibold">Training →</Text>
                </TouchableOpacity>
              )}
            </View>
            {status.dailyGoal.hasActivePlan && status.dailyGoal.totalDays && (
              <View className="mt-3">
                <View className="bg-bg-elevated rounded-full h-1.5 overflow-hidden">
                  <View
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${((status.dailyGoal.currentDay ?? 1) - 1) / status.dailyGoal.totalDays * 100}%`,
                      backgroundColor: '#00e87a',
                    }}
                  />
                </View>
                <Text className="text-ink-muted text-xs mt-1">
                  {(status.dailyGoal.currentDay ?? 1) - 1} von {status.dailyGoal.totalDays} Tagen
                </Text>
              </View>
            )}
          </View>

          {/* Streak Card */}
          <View
            className="rounded-2xl p-4 mb-4"
            style={{
              backgroundColor: status.streak.currentStreak > 0 ? '#f9730312' : '#14141f',
              borderWidth: 1,
              borderColor: status.streak.currentStreak > 0 ? '#f9730330' : '#252535',
            }}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Streak</Text>
              <Text className="text-xs" style={{ color: '#f59e0b' }}>
                Längster: {status.streak.longestStreak} Tage
              </Text>
            </View>
            <View className="flex-row items-end gap-2">
              <Text className="font-bold" style={{ fontSize: 48, color: status.streak.currentStreak > 0 ? '#f97316' : '#252535', lineHeight: 56 }}>
                {status.streak.currentStreak}
              </Text>
              <Text className="text-ink-secondary text-base mb-2">
                {status.streak.currentStreak === 1 ? 'Tag' : 'Tage'} in Folge
              </Text>
              {status.streak.currentStreak > 0 && (
                <Text style={{ fontSize: 28, marginBottom: 4 }}>🔥</Text>
              )}
            </View>
            <StreakDots count={Math.min(status.streak.currentStreak, 7)} />
          </View>

          {/* Stats Row */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-bg-card border border-bg-border rounded-xl p-4 items-center">
              <Text className="text-neon-green font-bold text-2xl">{status.totalSessions}</Text>
              <Text className="text-ink-muted text-xs mt-1">Einheiten</Text>
            </View>
            <View className="flex-1 bg-bg-card border border-bg-border rounded-xl p-4 items-center">
              <Text className="font-bold text-2xl" style={{ color: '#f59e0b' }}>{earnedCount}</Text>
              <Text className="text-ink-muted text-xs mt-1">Badges verdient</Text>
            </View>
            <View className="flex-1 bg-bg-card border border-bg-border rounded-xl p-4 items-center">
              <Text className="font-bold text-2xl" style={{ color: '#a78bfa' }}>{status.streak.longestStreak}</Text>
              <Text className="text-ink-muted text-xs mt-1">Bester Streak</Text>
            </View>
          </View>

          {/* Badge Grid by Category */}
          {CATEGORY_ORDER.map((cat) => {
            const badges = grouped[cat];
            if (!badges?.length) return null;
            return (
              <View key={cat} className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">
                    {CATEGORY_LABELS[cat]}
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
