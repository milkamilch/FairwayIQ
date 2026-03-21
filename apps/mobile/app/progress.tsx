import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../src/lib/api';
import { useTheme } from '../src/lib/theme';
import { SkillRadar } from '../src/components/SkillRadar';

// ── Types ──────────────────────────────────────────────────────────────
interface HandicapEntry { id: string; handicap: number; note?: string; date: string; }
interface RoundStat { id: string; date: string; totalStrokes: number; scoreToPar: number; avgPutts: number; girPercent: number; firPercent: number | null; }
interface SessionLog { feeling: number; difficulty: number; createdAt: string; }

interface ProgressData {
  skillRadar: Record<string, number> | null;
  skillHistory: { date: string; scores: Record<string, number> }[];
  handicapHistory: HandicapEntry[];
  roundHistory: RoundStat[];
  trainingStats: { totalSessions: number; avgFeeling: number | null; avgDifficulty: number | null; recentSessions: SessionLog[] };
  latestWeaknesses: string[];
}

const FEELING_ICONS = ['', 'sad-outline', 'remove-circle-outline', 'happy-outline', 'thumbs-up-outline', 'flame-outline'] as const;
const CATEGORY_COLORS: Record<string, string> = {
  putting: '#6ee7b7', shortGame: '#FF6535', ironPlay: '#60a5fa',
  driving: '#f59e0b', courseManagement: '#a78bfa', mentalGame: '#f472b6',
};

// ── Mini-Sparkline ─────────────────────────────────────────────────────
function Sparkline({ data, color = '#FF6535', height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 2 }}>
      {data.map((v, i) => {
        const h = Math.max(4, Math.round(((v - min) / range) * height));
        const isLast = i === data.length - 1;
        return (
          <View key={i} style={{ flex: 1, height: h, borderRadius: 2, backgroundColor: isLast ? color : color + '50' }} />
        );
      })}
    </View>
  );
}

// ── Add Handicap Modal ─────────────────────────────────────────────────
function AddHandicapModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num) || num < -10 || num > 54) {
      Alert.alert(t('common.error'), t('progress.handicap.modal.invalidHcp'));
      return;
    }
    setSaving(true);
    try {
      await api.post('/progress/handicap', { handicap: num, note: note.trim() || undefined });
      onSaved();
      onClose();
    } catch { Alert.alert(t('common.error'), t('progress.handicap.modal.cannotSave')); }
    setSaving(false);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-bg-base">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-bg-border">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-ink-secondary text-sm">{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text className="text-ink-primary font-bold">{t('progress.handicap.modal.title')}</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            <Text className="text-neon-green font-bold text-sm">{saving ? '...' : t('common.save')}</Text>
          </TouchableOpacity>
        </View>
        <View className="p-5 gap-5">
          <View>
            <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-2">
              {t('progress.handicap.modal.currentHcp')}
            </Text>
            <TextInput
              className="bg-bg-elevated border border-bg-border text-ink-primary rounded-xl px-4 py-4 text-3xl font-black text-center"
              placeholder="18.4"
              placeholderTextColor="#444444"
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
          <View>
            <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-2">
              {t('progress.handicap.modal.note')}
            </Text>
            <TextInput
              className="bg-bg-elevated border border-bg-border text-ink-primary rounded-xl px-4 py-3 text-sm"
              placeholder={t('progress.handicap.modal.notePlaceholder')}
              placeholderTextColor="#444444"
              value={note}
              onChangeText={setNote}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────
export default function ProgressScreen() {
  const { t, i18n } = useTranslation();
  const c = useTheme();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddHandicap, setShowAddHandicap] = useState(false);
  const [activeSection, setActiveSection] = useState<'radar' | 'handicap' | 'rounds' | 'training'>('radar');

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get<ProgressData>('/progress/overview');
      setData(d);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const prevScores = data && data.skillHistory.length >= 2
    ? data.skillHistory[data.skillHistory.length - 2].scores
    : null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit', year: '2-digit' });

  const getCategoryLabel = (key: string) => t(`progress.categories.${key}`, { defaultValue: key });

  const sectionIcons: Record<string, any> = { radar: 'radio-button-on', handicap: 'trending-down', rounds: 'golf', training: 'fitness' };

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      {/* Header */}
      <View className="px-5 pt-6 pb-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#8A8A8A" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">{t('progress.sectionLabel')}</Text>
          <Text className="text-ink-primary text-2xl font-black">{t('progress.title')}</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-2xl"
          style={{ backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.bgBorder }}
        >
          <Ionicons name="logo-github" size={13} color={c.inkMuted} />
          <Text className="text-ink-muted text-xs">{t('progress.garminSync')}</Text>
        </TouchableOpacity>
      </View>

      {/* Section Tabs */}
      <View className="flex-row mx-5 mt-3 mb-2 bg-bg-elevated rounded-2xl p-1 gap-1">
        {(['radar', 'handicap', 'rounds', 'training'] as const).map((s) => {
          const active = activeSection === s;
          return (
            <TouchableOpacity
              key={s}
              className="flex-1 items-center py-2.5 rounded-xl"
              style={{ backgroundColor: active ? '#FF653520' : 'transparent' }}
              onPress={() => setActiveSection(s)}
            >
              <Ionicons name={sectionIcons[s]} size={14} color={active ? '#FF6535' : '#444444'} />
              <Text className="text-xs font-black mt-0.5" style={{ color: active ? '#FF6535' : '#444444' }}>
                {t(`progress.sections.${s}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FF6535" size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6535" />}
        >
          {/* ── SKILL RADAR ──────────────────────────────────────────── */}
          {activeSection === 'radar' && (
            <View className="px-5 pt-4 gap-4">
              {data?.skillRadar ? (
                <>
                  <View className="bg-bg-card rounded-2xl p-4">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-ink-primary font-bold">{t('progress.radar.title')}</Text>
                      {data.skillHistory.length > 0 && (
                        <Text className="text-ink-muted text-xs">
                          {formatDate(data.skillHistory[data.skillHistory.length - 1].date)}
                        </Text>
                      )}
                    </View>
                    <SkillRadar scores={data.skillRadar} previous={prevScores} size={300} />
                  </View>

                  {/* Score bars */}
                  <View className="bg-bg-card rounded-2xl p-4 gap-3">
                    <Text className="text-ink-primary font-bold mb-1">{t('progress.radar.details')}</Text>
                    {Object.entries(data.skillRadar)
                      .sort(([, a], [, b]) => a - b)
                      .map(([key, val]) => {
                        const color = CATEGORY_COLORS[key] ?? '#FF6535';
                        return (
                          <View key={key}>
                            <View className="flex-row items-center justify-between mb-1">
                              <Text className="text-ink-secondary text-sm">{getCategoryLabel(key)}</Text>
                              <Text className="text-sm font-bold" style={{ color }}>{Math.round(val)}</Text>
                            </View>
                            <View className="bg-bg-elevated rounded-full h-2 overflow-hidden">
                              <View className="h-2 rounded-full" style={{ width: `${val}%`, backgroundColor: color }} />
                            </View>
                          </View>
                        );
                      })}
                  </View>

                  {/* Focus areas */}
                  {data.latestWeaknesses.length > 0 && (
                    <View className="bg-bg-card rounded-2xl p-4">
                      <Text className="text-ink-primary font-bold mb-3">{t('progress.radar.focusAreas')}</Text>
                      {data.latestWeaknesses.map((w, i) => (
                        <View key={i} className="flex-row items-center gap-3 mb-2">
                          <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: '#f59e0b20' }}>
                            <Text style={{ color: '#f59e0b', fontSize: 12 }}>!</Text>
                          </View>
                          <Text className="text-ink-secondary text-sm flex-1">{getCategoryLabel(w)}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Assessment history */}
                  {data.skillHistory.length > 1 && (
                    <View className="bg-bg-card rounded-2xl p-4">
                      <Text className="text-ink-primary font-bold mb-3">{t('progress.radar.assessmentHistory')}</Text>
                      {data.skillHistory.slice(-5).map((entry, i) => {
                        const avg = Math.round(Object.values(entry.scores).reduce((s, v) => s + v, 0) / Object.keys(entry.scores).length);
                        return (
                          <View key={i} className="flex-row items-center gap-3 mb-2">
                            <Text className="text-ink-muted text-xs w-16">{formatDate(entry.date)}</Text>
                            <View className="flex-1 bg-bg-elevated rounded-full h-2 overflow-hidden">
                              <View className="h-2 rounded-full bg-neon-green" style={{ width: `${avg}%` }} />
                            </View>
                            <Text className="text-neon-green text-xs font-bold w-8 text-right">{avg}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              ) : (
                <View className="items-center py-16 gap-3">
                  <Ionicons name="radio-button-on-outline" size={48} color={c.bgBorder} />
                  <Text className="text-ink-secondary font-semibold">{t('progress.radar.noAssessment')}</Text>
                  <Text className="text-ink-muted text-sm text-center">{t('progress.radar.noAssessmentHint')}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── HANDICAP ─────────────────────────────────────────────── */}
          {activeSection === 'handicap' && (
            <View className="px-5 pt-4 gap-4">
              <TouchableOpacity
                className="rounded-xl py-3.5 items-center flex-row justify-center gap-2"
                style={{ backgroundColor: '#FF6535' }}
                onPress={() => setShowAddHandicap(true)}
              >
                <Ionicons name="add" size={18} color="#0A0A0A" />
                <Text className="text-bg-base font-bold">{t('progress.handicap.addButton')}</Text>
              </TouchableOpacity>

              {data?.handicapHistory && data.handicapHistory.length > 0 ? (
                <>
                  <View className="bg-bg-card rounded-2xl p-4">
                    <View className="flex-row items-start justify-between mb-4">
                      <View>
                        <Text className="text-ink-primary font-bold">{t('progress.handicap.title')}</Text>
                        <Text className="text-ink-muted text-xs">{data.handicapHistory.length} {t('progress.handicap.entries')}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-3xl font-black" style={{ color: '#FF6535' }}>
                          {data.handicapHistory[data.handicapHistory.length - 1].handicap.toFixed(1)}
                        </Text>
                        {data.handicapHistory.length >= 2 && (() => {
                          const diff = data.handicapHistory[data.handicapHistory.length - 1].handicap
                            - data.handicapHistory[data.handicapHistory.length - 2].handicap;
                          const improving = diff < 0;
                          return (
                            <View className="flex-row items-center gap-1">
                              <Ionicons name={improving ? 'trending-down' : 'trending-up'} size={12} color={improving ? '#FF6535' : '#f97316'} />
                              <Text className="text-xs font-semibold" style={{ color: improving ? '#FF6535' : '#f97316' }}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                              </Text>
                            </View>
                          );
                        })()}
                      </View>
                    </View>
                    {data.handicapHistory.length >= 2 && (
                      <Sparkline data={data.handicapHistory.map((e) => -e.handicap)} color="#FF6535" height={48} />
                    )}
                  </View>

                  <View className="bg-bg-card rounded-2xl overflow-hidden">
                    {data.handicapHistory.slice().reverse().slice(0, 10).map((entry, i, arr) => {
                      const prev = arr[i + 1];
                      const diff = prev ? entry.handicap - prev.handicap : null;
                      const improving = diff !== null && diff < 0;
                      return (
                        <View key={entry.id} className="flex-row items-center px-4 py-3 border-b border-bg-border">
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                              <Text className="text-ink-primary font-bold text-base">{entry.handicap.toFixed(1)}</Text>
                              {diff !== null && (
                                <View className="flex-row items-center gap-0.5">
                                  <Ionicons
                                    name={improving ? 'trending-down' : diff === 0 ? 'remove' : 'trending-up'}
                                    size={11}
                                    color={improving ? '#FF6535' : diff === 0 ? '#444444' : '#f97316'}
                                  />
                                  <Text className="text-xs" style={{ color: improving ? '#FF6535' : diff === 0 ? '#444444' : '#f97316' }}>
                                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                                  </Text>
                                </View>
                              )}
                            </View>
                            {entry.note && <Text className="text-ink-muted text-xs mt-0.5">{entry.note}</Text>}
                          </View>
                          <Text className="text-ink-muted text-xs">{formatDate(entry.date)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <View className="items-center py-16 gap-3">
                  <Ionicons name="trending-down-outline" size={48} color={c.bgBorder} />
                  <Text className="text-ink-secondary font-semibold">{t('progress.handicap.noEntries')}</Text>
                  <Text className="text-ink-muted text-sm text-center">{t('progress.handicap.noEntriesHint')}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── ROUNDS ───────────────────────────────────────────────── */}
          {activeSection === 'rounds' && (
            <View className="px-5 pt-4 gap-4">
              {data?.roundHistory && data.roundHistory.length > 0 ? (
                <>
                  <View className="bg-bg-card rounded-2xl p-4">
                    <Text className="text-ink-primary font-bold mb-1">{t('progress.rounds.scoreTrend')}</Text>
                    <Text className="text-ink-muted text-xs mb-4">{data.roundHistory.length} {t('progress.sections.rounds')}</Text>
                    <Sparkline data={data.roundHistory.map((r) => -r.scoreToPar + 30)} color="#FF6535" height={48} />
                    <View className="flex-row justify-between mt-2">
                      <Text className="text-ink-muted text-xs">
                        {t('progress.rounds.best')}: {Math.min(...data.roundHistory.map((r) => r.scoreToPar)) >= 0 ? '+' : ''}{Math.min(...data.roundHistory.map((r) => r.scoreToPar))}
                      </Text>
                      <Text className="text-ink-muted text-xs">
                        {t('progress.rounds.last')}: {data.roundHistory[data.roundHistory.length - 1].scoreToPar >= 0 ? '+' : ''}{data.roundHistory[data.roundHistory.length - 1].scoreToPar}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1 bg-bg-card rounded-2xl p-4">
                      <Text className="text-ink-secondary text-xs font-semibold mb-1">{t('progress.rounds.girAvg')}</Text>
                      <Text className="text-3xl font-black text-ink-primary">
                        {Math.round(data.roundHistory.reduce((s, r) => s + r.girPercent, 0) / data.roundHistory.length)}%
                      </Text>
                      <Text className="text-ink-muted text-xs">{t('progress.rounds.avg')}</Text>
                      <Sparkline data={data.roundHistory.map((r) => r.girPercent)} color="#60a5fa" height={24} />
                    </View>
                    <View className="flex-1 bg-bg-card rounded-2xl p-4">
                      <Text className="text-ink-secondary text-xs font-semibold mb-1">{t('progress.rounds.puttsPerHole')}</Text>
                      <Text className="text-3xl font-black text-ink-primary">
                        {(data.roundHistory.reduce((s, r) => s + r.avgPutts, 0) / data.roundHistory.length).toFixed(1)}
                      </Text>
                      <Text className="text-ink-muted text-xs">{t('progress.rounds.avg')}</Text>
                      <Sparkline data={data.roundHistory.map((r) => -r.avgPutts + 4)} color="#6ee7b7" height={24} />
                    </View>
                  </View>

                  <View className="bg-bg-card rounded-2xl overflow-hidden">
                    {data.roundHistory.slice().reverse().slice(0, 8).map((r) => {
                      const color = r.scoreToPar < 0 ? '#FF6535' : r.scoreToPar === 0 ? '#f59e0b' : '#8A8A8A';
                      return (
                        <View key={r.id} className="flex-row items-center px-4 py-3 border-b border-bg-border">
                          <Text className="text-ink-muted text-xs w-16">{formatDate(r.date)}</Text>
                          <View className="flex-1 flex-row gap-3 ml-2">
                            <Text className="text-ink-secondary text-xs">GIR {r.girPercent}%</Text>
                            <Text className="text-ink-secondary text-xs">{r.avgPutts.toFixed(1)} P/L</Text>
                          </View>
                          <Text className="font-bold text-sm" style={{ color }}>
                            {r.scoreToPar >= 0 ? '+' : ''}{r.scoreToPar}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <View className="items-center py-16 gap-3">
                  <Ionicons name="golf-outline" size={48} color={c.bgBorder} />
                  <Text className="text-ink-secondary font-semibold">{t('progress.rounds.noRounds')}</Text>
                  <Text className="text-ink-muted text-sm text-center">{t('progress.rounds.noRoundsHint')}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── TRAINING ─────────────────────────────────────────────── */}
          {activeSection === 'training' && (
            <View className="px-5 pt-4 gap-4">
              {data?.trainingStats && data.trainingStats.totalSessions > 0 ? (
                <>
                  <View className="flex-row gap-3">
                    <View className="flex-1 bg-bg-card rounded-2xl p-4 items-center">
                      <Text className="text-3xl font-black text-neon-green">{data.trainingStats.totalSessions}</Text>
                      <Text className="text-ink-muted text-xs mt-1">{t('progress.training.units')}</Text>
                    </View>
                    <View className="flex-1 bg-bg-card rounded-2xl p-4 items-center">
                      <Ionicons
                        name={FEELING_ICONS[Math.round(data.trainingStats.avgFeeling ?? 3)] as any}
                        size={32}
                        color="#FF6535"
                        style={{ lineHeight: 40 }}
                      />
                      <Text className="text-ink-muted text-xs mt-1">{t('progress.training.avgFeeling')}</Text>
                    </View>
                    <View className="flex-1 bg-bg-card rounded-2xl p-4 items-center">
                      <Text className="text-3xl font-black" style={{ color: '#f59e0b' }}>
                        {(data.trainingStats.avgDifficulty ?? 0).toFixed(1)}
                      </Text>
                      <Text className="text-ink-muted text-xs mt-1">{t('progress.training.avgLoad')}</Text>
                    </View>
                  </View>

                  <View className="bg-bg-card rounded-2xl p-4">
                    <Text className="text-ink-primary font-bold mb-3">{t('progress.training.recentSessions')}</Text>
                    {data.trainingStats.recentSessions.map((s, i) => {
                      const diffColor = s.difficulty >= 4 ? '#f97316' : s.difficulty <= 2 ? '#22d3ee' : '#FF6535';
                      return (
                        <View key={i} className="flex-row items-center gap-3 mb-3">
                          <Ionicons name={FEELING_ICONS[s.feeling] as any} size={20} color={c.inkSecondary} />
                          <View className="flex-1">
                            <View className="flex-row items-center justify-between mb-1">
                              <Text className="text-ink-muted text-xs">{formatDate(s.createdAt)}</Text>
                              <Text className="text-xs font-semibold" style={{ color: diffColor }}>
                                {t('progress.training.load', { value: s.difficulty })}
                              </Text>
                            </View>
                            <View className="flex-row gap-1">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <View
                                  key={n}
                                  className="flex-1 h-1.5 rounded-full"
                                  style={{ backgroundColor: n <= s.difficulty ? diffColor : c.bgBorder }}
                                />
                              ))}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <View className="items-center py-16 gap-3">
                  <Ionicons name="fitness-outline" size={48} color={c.bgBorder} />
                  <Text className="text-ink-secondary font-semibold">{t('progress.training.noSessions')}</Text>
                  <Text className="text-ink-muted text-sm text-center">{t('progress.training.noSessionsHint')}</Text>
                </View>
              )}
            </View>
          )}

          <View className="h-8" />
        </ScrollView>
      )}

      {showAddHandicap && (
        <AddHandicapModal
          onClose={() => setShowAddHandicap(false)}
          onSaved={load}
        />
      )}
    </SafeAreaView>
  );
}
