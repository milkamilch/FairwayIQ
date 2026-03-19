import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { useTrainingStore } from '../../src/store/trainingStore';
import { api } from '../../src/lib/api';
import { WeatherWidget } from '../../src/components/WeatherWidget';

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
    <View className="flex-1 bg-bg-card border border-bg-border rounded-xl p-3">
      <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-1">{label}</Text>
      <Text className="text-ink-primary text-2xl font-bold">{value}</Text>
      {sub && <Text className="text-ink-muted text-xs mt-0.5">{sub}</Text>}
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { activePlan, fetchActivePlan } = useTrainingStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    await fetchActivePlan();
    try {
      const { data } = await api.get<Stats>('/rounds/stats/overview');
      setStats(data);
    } catch {}
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const levelLabel: Record<string, string> = {
    BEGINNER: 'ANFÄNGER', INTERMEDIATE: 'FORTGESCHRITTEN', ADVANCED: 'GEÜBT', PRO: 'PRO',
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00e87a" />}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Dashboard</Text>
              <Text className="text-ink-primary text-2xl font-bold mt-0.5">{user?.name}</Text>
            </View>
            <View className="items-end gap-1">
              <View className="px-2 py-1 rounded bg-neon-glow border border-neon-green">
                <Text className="text-neon-green text-xs font-bold tracking-wider">
                  {levelLabel[user?.level ?? 'BEGINNER']}
                </Text>
              </View>
              {user?.handicap !== null && user?.handicap !== undefined && (
                <Text className="text-ink-secondary text-xs">HCP {user.handicap}</Text>
              )}
            </View>
          </View>
        </View>

        <View className="px-5 gap-4 pb-8">
          {/* Wetter-Widget */}
          <View>
            <WeatherWidget />
          </View>

          {/* Stats Grid */}
          {stats && stats.rounds > 0 ? (
            <View>
              <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-3">Performance</Text>
              <View className="flex-row gap-2 mb-2">
                <StatTile label="Runden" value={String(stats.rounds)} />
                <StatTile
                  label="Ø Score"
                  value={stats.avgScore !== null ? scoreDiff(Math.round(stats.avgScore)) : '—'}
                  sub="letzten 20"
                />
                <StatTile
                  label="Best"
                  value={stats.bestScore !== null ? scoreDiff(stats.bestScore) : '—'}
                />
              </View>
              <View className="flex-row gap-2">
                <StatTile label="Ø Putts" value={stats.avgPutts !== null ? String(stats.avgPutts) : '—'} />
                <StatTile label="FIR" value={stats.fairwayAvg !== null ? `${stats.fairwayAvg}%` : '—'} />
                <StatTile label="GIR" value={stats.girAvg !== null ? `${stats.girAvg}%` : '—'} />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              className="bg-bg-card border border-bg-border rounded-xl p-5 items-center gap-2"
              onPress={() => router.push('/(tabs)/rounds')}
            >
              <Ionicons name="stats-chart-outline" size={28} color="#44445a" />
              <Text className="text-ink-secondary text-sm">Erste Runde erfassen um Stats zu sehen</Text>
              <Text className="text-neon-green text-sm font-semibold">Runde starten →</Text>
            </TouchableOpacity>
          )}

          {/* Aktiver Trainingsplan */}
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Trainingsplan</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/training')}>
                <Text className="text-neon-green text-xs font-semibold">Alle ansehen →</Text>
              </TouchableOpacity>
            </View>

            {activePlan ? (
              <TouchableOpacity
                className="bg-bg-card border border-bg-border rounded-xl p-4"
                onPress={() => router.push('/(tabs)/training')}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-ink-primary font-bold">{activePlan.plan.name}</Text>
                    <Text className="text-ink-secondary text-xs mt-0.5">
                      Tag {activePlan.currentDay} / {activePlan.plan.days.length}
                    </Text>
                  </View>
                  <Text className="text-neon-green text-sm font-bold">
                    {Math.round((activePlan.completedDays.length / activePlan.plan.days.length) * 100)}%
                  </Text>
                </View>
                {/* Progress Bar */}
                <View className="bg-bg-elevated rounded-full h-1.5 overflow-hidden">
                  <View
                    className="bg-neon-green h-1.5 rounded-full"
                    style={{ width: `${(activePlan.completedDays.length / activePlan.plan.days.length) * 100}%` }}
                  />
                </View>
                <Text className="text-neon-dim text-xs mt-3 font-medium">
                  → {activePlan.plan.days.find(d => d.dayNumber === activePlan.currentDay)?.title ?? 'Abgeschlossen'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="bg-bg-card border border-bg-border rounded-xl p-5 items-center gap-2"
                onPress={() => router.push('/(tabs)/training')}
              >
                <Ionicons name="fitness-outline" size={28} color="#44445a" />
                <Text className="text-neon-green text-sm font-semibold">Trainingsplan starten →</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Actions */}
          <View>
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-3">Schnellzugriff</Text>
            <View className="gap-2">
              {[
                { label: 'Neue Runde', sub: 'Score erfassen', icon: 'stats-chart', route: '/(tabs)/rounds' },
                { label: 'Platz hinzufügen', sub: 'Strategie hinterlegen', icon: 'map-outline', route: '/(tabs)/courses' },
                { label: 'Training heute', sub: activePlan ? activePlan.plan.days.find(d => d.dayNumber === activePlan.currentDay)?.title ?? '—' : 'Kein aktiver Plan', icon: 'fitness-outline', route: '/(tabs)/training' },
                { label: 'Fortschritt', sub: 'Skill-Radar & HCP-Verlauf', icon: 'analytics-outline', route: '/progress' },
              ].map((a) => (
                <TouchableOpacity
                  key={a.label}
                  className="bg-bg-card border border-bg-border rounded-xl px-4 py-3 flex-row items-center gap-3"
                  onPress={() => router.push(a.route as any)}
                >
                  <View className="w-9 h-9 rounded-lg bg-bg-elevated items-center justify-center">
                    <Ionicons name={a.icon as any} size={18} color="#00e87a" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink-primary font-semibold text-sm">{a.label}</Text>
                    <Text className="text-ink-muted text-xs">{a.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#44445a" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
