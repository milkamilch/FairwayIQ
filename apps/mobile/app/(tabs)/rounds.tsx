import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/lib/api';
import { useTheme } from '../../src/lib/theme';
import { Round } from '@fairwayiq/shared';

function scoreColor(diff: number) {
  if (diff <= -2) return '#a855f7';
  if (diff === -1) return '#FF6535';
  if (diff === 0) return '#6ee7b7';
  if (diff === 1) return '#f59e0b';
  return '#ef4444';
}


export default function RoundsScreen() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const c = useTheme();

  const fetchRounds = async () => {
    try { const { data } = await api.get<Round[]>('/rounds'); setRounds(data); } catch {}
  };

  useEffect(() => { fetchRounds(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchRounds(); setRefreshing(false); };

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <View className="px-5 pt-6 pb-4 flex-row items-end justify-between">
        <View>
          <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-1">{t('rounds.sectionLabel')}</Text>
          <Text className="text-ink-primary text-3xl font-black">{t('rounds.title')}</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ backgroundColor: '#FF653520' }}
          onPress={() => router.push('/live-round' as any)}
        >
          <Ionicons name="golf-outline" size={16} color="#FF6535" />
          <Text className="text-neon-green text-xs font-bold">{t('rounds.liveRound')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6535" />}
      >
        {rounds.length === 0 ? (
          <View className="items-center py-16 gap-3">
            <Ionicons name="stats-chart-outline" size={48} color={c.bgBorder} />
            <Text className="text-ink-secondary font-semibold">{t('rounds.noRounds')}</Text>
            <Text className="text-ink-muted text-sm text-center">{t('rounds.noRoundsHint')}</Text>
            <TouchableOpacity className="mt-2 px-6 py-3 rounded-2xl" style={{ backgroundColor: '#FF653520' }} onPress={() => router.push('/live-round' as any)}>
              <Text className="text-neon-green font-semibold text-sm">{t('rounds.startRound')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          rounds.map((round) => {
            const totalStrokes = round.scores?.reduce((s, h) => s + h.strokes, 0) ?? 0;
            const totalPar = round.scores?.reduce((s, h) => s + h.par, 0) ?? 72;
            const diff = totalStrokes - totalPar;
            const putts = round.scores?.reduce((s, h) => s + h.putts, 0) ?? 0;
            const gir = round.scores?.filter((h) => h.greenInRegulation).length ?? 0;
            const fir = round.scores?.filter((h) => h.fairwayHit === true).length ?? 0;
            const firTotal = round.scores?.filter((h) => h.fairwayHit !== null).length ?? 0;
            return (
              <View key={round.id} className="bg-bg-card rounded-2xl mb-3 overflow-hidden">
                <View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
                  <View className="flex-1 mr-4">
                    <Text className="text-ink-primary font-black text-base" numberOfLines={1}>{(round as any).course?.name ?? round.courseName ?? '—'}</Text>
                    <Text className="text-ink-muted text-xs mt-1">
                      {new Date(round.date).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-4xl font-black" style={{ color: scoreColor(diff) }}>{totalStrokes}</Text>
                    <Text className="text-sm font-bold" style={{ color: scoreColor(diff) }}>
                      {diff === 0 ? 'EVEN' : diff > 0 ? `+${diff}` : String(diff)}
                    </Text>
                  </View>
                </View>
                <View className="px-5 py-3 bg-bg-elevated flex-row gap-5 flex-wrap">
                  {[
                    { label: 'PUTTS', value: String(putts) },
                    { label: 'GIR', value: `${gir}/18` },
                    { label: 'FIR', value: `${fir}/${firTotal}` },
                    round.handicapDifferential != null ? { label: 'DIFF', value: String(round.handicapDifferential) } : null,
                  ].filter(Boolean).map((s) => s && (
                    <View key={s.label} className="flex-row items-center gap-1.5">
                      <Text className="text-ink-muted text-xs font-bold">{s.label}</Text>
                      <Text className="text-ink-primary text-xs font-black">{s.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}
        <View className="h-8" />
      </ScrollView>

    </SafeAreaView>
  );
}
