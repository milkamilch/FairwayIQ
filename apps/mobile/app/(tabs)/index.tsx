import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';
import { useTrainingStore } from '../../src/store/trainingStore';
import { api } from '../../src/lib/api';
import { WeatherWidget } from '../../src/components/WeatherWidget';
import { useTheme } from '../../src/lib/theme';
import { InboxModal, fetchInboxCount } from '../../src/components/InboxModal';
import { ScoreTrendChart } from '../../src/components/ScoreTrendChart';

interface Stats {
  rounds: number;
  avgScore: number | null;
  bestScore: number | null;
  avgPutts: number | null;
  fairwayAvg: number | null;
  girAvg: number | null;
}

function scoreDiff(n: number) {
  if (n < 0) return String(n);
  if (n === 0) return 'E';
  return `+${n}`;
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View className="flex-1 bg-bg-card rounded-2xl p-4">
      <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-1">{label}</Text>
      <Text className="text-ink-primary text-2xl font-black">{value}</Text>
      {sub && <Text className="text-ink-muted text-xs mt-1">{sub}</Text>}
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { activePlan, fetchActivePlan } = useTrainingStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [inboxCount, setInboxCount] = useState(0);
  const router = useRouter();
  const { t } = useTranslation();
  const c = useTheme();

  const loadData = async () => {
    await fetchActivePlan();
    try {
      const { data } = await api.get<Stats>('/rounds/stats/overview');
      setStats(data);
    } catch {}
    setInboxCount(await fetchInboxCount());
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <InboxModal
        visible={inboxOpen}
        onClose={() => setInboxOpen(false)}
        onCountChange={setInboxCount}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6535" />}
      >
        {/* Header */}
        <View className="px-5 pt-6 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-1">{t('dashboard.sectionLabel')}</Text>
              <Text className="text-ink-primary text-3xl font-black">{user?.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View className="items-end gap-1.5">
                <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: '#FF653520' }}>
                  <Text className="text-neon-green text-xs font-bold tracking-wider">
                    {t(`dashboard.level.${user?.level ?? 'BEGINNER'}`)}
                  </Text>
                </View>
                {user?.handicap !== null && user?.handicap !== undefined && (
                  <Text className="text-ink-secondary text-sm font-semibold">HCP {user.handicap}</Text>
                )}
              </View>
              {/* Inbox Bell */}
              <TouchableOpacity
                onPress={() => setInboxOpen(true)}
                style={{ position: 'relative', padding: 6 }}
              >
                <Ionicons name="notifications-outline" size={24} color={c.inkSecondary} />
                {inboxCount > 0 && (
                  <View style={{
                    position: 'absolute', top: 2, right: 2,
                    minWidth: 16, height: 16, borderRadius: 8,
                    backgroundColor: '#FF6535',
                    alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 3,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', lineHeight: 14 }}>
                      {inboxCount > 9 ? '9+' : inboxCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="px-5 gap-5 pb-8">
          {/* Wetter-Widget */}
          <WeatherWidget />

          {/* Stats Grid */}
          {stats && stats.rounds > 0 ? (
            <View className="gap-3">
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">{t('dashboard.performance')}</Text>
              <View className="flex-row gap-3">
                <StatTile label={t('dashboard.stats.rounds')} value={String(stats.rounds)} />
                <StatTile
                  label={t('dashboard.stats.avgScore')}
                  value={stats.avgScore !== null ? scoreDiff(Math.round(stats.avgScore)) : '—'}
                  sub={t('dashboard.lastN')}
                />
                <StatTile
                  label={t('dashboard.stats.best')}
                  value={stats.bestScore !== null ? scoreDiff(stats.bestScore) : '—'}
                />
              </View>
              <View className="flex-row gap-3">
                <StatTile label={t('dashboard.stats.avgPutts')} value={stats.avgPutts !== null ? String(stats.avgPutts) : '—'} />
                <StatTile label="FIR" value={stats.fairwayAvg !== null ? `${stats.fairwayAvg}%` : '—'} />
                <StatTile label="GIR" value={stats.girAvg !== null ? `${stats.girAvg}%` : '—'} />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              className="bg-bg-card rounded-2xl p-5 items-center gap-3"
              onPress={() => router.push('/(tabs)/rounds')}
            >
              <Ionicons name="stats-chart-outline" size={32} color={c.inkMuted} />
              <Text className="text-ink-secondary text-sm">{t('dashboard.noRounds')}</Text>
              <Text className="text-neon-green text-sm font-bold">{t('dashboard.startRound')}</Text>
            </TouchableOpacity>
          )}

          {/* Score-Trend Chart */}
          {stats && stats.rounds >= 2 && (
            <ScoreTrendChart />
          )}

          {/* Aktiver Trainingsplan */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">{t('dashboard.trainingPlan')}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/training')}>
                <Text className="text-neon-green text-xs font-bold">{t('dashboard.viewAll')}</Text>
              </TouchableOpacity>
            </View>

            {activePlan ? (
              <TouchableOpacity
                className="bg-bg-card rounded-2xl p-5"
                onPress={() => router.push('/(tabs)/training')}
              >
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1">
                    <Text className="text-ink-primary font-black text-base">{activePlan.plan.name}</Text>
                    <Text className="text-ink-secondary text-xs mt-1">
                      {t('dashboard.day')} {activePlan.currentDay} / {activePlan.plan.days.length}
                    </Text>
                  </View>
                  <Text className="text-neon-green text-xl font-black">
                    {Math.round((activePlan.completedDays.length / activePlan.plan.days.length) * 100)}%
                  </Text>
                </View>
                <View className="bg-bg-elevated rounded-full h-2 overflow-hidden mb-3">
                  <View
                    className="bg-neon-green h-2 rounded-full"
                    style={{ width: `${(activePlan.completedDays.length / activePlan.plan.days.length) * 100}%` }}
                  />
                </View>
                <Text className="text-ink-secondary text-xs font-medium">
                  {activePlan.plan.days.find(d => d.dayNumber === activePlan.currentDay)?.title ?? t('dashboard.completed')}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="bg-bg-card rounded-2xl p-5 items-center gap-3"
                onPress={() => router.push('/(tabs)/training')}
              >
                <Ionicons name="fitness-outline" size={32} color={c.inkMuted} />
                <Text className="text-neon-green text-sm font-bold">{t('dashboard.startTraining')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Actions */}
          <View className="gap-3">
            <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">{t('dashboard.quickAccess')}</Text>
            <View className="gap-2">
              {[
                { label: t('dashboard.quickActions.newRound'), sub: t('dashboard.quickActions.newRoundSub'), icon: 'stats-chart', route: '/(tabs)/rounds' },
                { label: t('dashboard.quickActions.addCourse'), sub: t('dashboard.quickActions.addCourseSub'), icon: 'map-outline', route: '/(tabs)/courses' },
                { label: t('dashboard.quickActions.trainingToday'), sub: activePlan ? activePlan.plan.days.find(d => d.dayNumber === activePlan.currentDay)?.title ?? '—' : t('dashboard.noActivePlan'), icon: 'fitness-outline', route: '/(tabs)/training' },
                { label: t('dashboard.quickActions.community'), sub: t('dashboard.quickActions.communitySub'), icon: 'people-outline', route: '/(tabs)/social' },
                { label: t('dashboard.quickActions.progress'), sub: t('dashboard.quickActions.progressSub'), icon: 'analytics-outline', route: '/progress' },
                { label: t('dashboard.quickActions.rules'), sub: t('dashboard.quickActions.rulesSub'), icon: 'book-outline', route: '/rules' },
              ].map((a) => (
                <TouchableOpacity
                  key={a.label}
                  className="bg-bg-card rounded-2xl px-4 py-4 flex-row items-center gap-3"
                  onPress={() => router.push(a.route as any)}
                >
                  <View className="w-10 h-10 rounded-xl bg-bg-elevated items-center justify-center">
                    <Ionicons name={a.icon as any} size={20} color="#FF6535" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink-primary font-bold text-sm">{a.label}</Text>
                    <Text className="text-ink-muted text-xs mt-0.5">{a.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={c.inkMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
