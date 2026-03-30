import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  Modal, TextInput, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../src/lib/api';
import { useTheme } from '../src/lib/theme';
import { SkillRadar } from '../src/components/SkillRadar';

const SCREEN_W = Dimensions.get('window').width;

// ── Types ──────────────────────────────────────────────────────────────
interface HandicapEntry { id: string; handicap: number; note?: string; date: string; }
interface RoundStat { id: string; date: string; totalStrokes: number; scoreToPar: number; avgPutts: number; girPercent: number; firPercent: number | null; }
interface SessionLog { feeling: number; difficulty: number; createdAt: string; }

interface RoundDifferential { date: string; value: number; }

interface ProgressData {
  skillRadar: Record<string, number> | null;
  skillHistory: { date: string; scores: Record<string, number> }[];
  handicapHistory: HandicapEntry[];
  roundHistory: RoundStat[];
  trainingStats: { totalSessions: number; avgFeeling: number | null; avgDifficulty: number | null; recentSessions: SessionLog[] };
  latestWeaknesses: string[];
  whsIndex: number | null;
  roundDifferentials: RoundDifferential[];
}

// ── Handicap SVG Chart ─────────────────────────────────────────────────
function HandicapChart({ entries, diffs, c }: {
  entries: HandicapEntry[];
  diffs:   RoundDifferential[];
  c:       any;
}) {
  const [mode, setMode] = useState<'manual' | 'diffs'>('manual');
  const data: { label: string; value: number }[] = mode === 'manual'
    ? entries.map((e) => ({ label: new Date(e.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }), value: e.handicap }))
    : diffs.map((d)  => ({ label: new Date(d.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }), value: d.value }));

  if (data.length < 2) return null;

  const W = SCREEN_W - 40;
  const H = 130;
  const PL = 32, PR = 8, PT = 12, PB = 24;
  const PW = W - PL - PR;
  const PH = H - PT - PB;

  const vals  = data.map((d) => d.value);
  const minV  = Math.min(...vals) - 0.5;
  const maxV  = Math.max(...vals) + 0.5;
  const range = Math.max(maxV - minV, 1);

  const toX = (i: number) => PL + (i / Math.max(data.length - 1, 1)) * PW;
  const toY = (v: number) => PT + (1 - (v - minV) / range) * PH;

  const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));

  let linePath = '';
  pts.forEach((p, i) => {
    if (i === 0) { linePath += `M${p.x.toFixed(1)},${p.y.toFixed(1)}`; return; }
    const prev = pts[i - 1];
    const cpX  = (prev.x + p.x) / 2;
    linePath += ` C${cpX.toFixed(1)},${prev.y.toFixed(1)} ${cpX.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  });
  const areaPath = linePath + ` L${pts[pts.length - 1].x.toFixed(1)},${PT + PH} L${PL},${PT + PH} Z`;

  const yMid   = (minV + maxV) / 2;
  const yLabels = [maxV, yMid, minV];

  // improving = handicap going down
  const improving = vals[vals.length - 1] < vals[0];
  const lineColor = improving ? '#6ee7b7' : '#f97316';

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginBottom: 8 }}>
        {[['manual', 'Manuell'], ['diffs', 'Differenziale']] .map(([m, label]) => (
          <TouchableOpacity key={m} onPress={() => setMode(m as any)}
            style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
              backgroundColor: mode === m ? '#FF653520' : c.bgElevated,
              borderWidth: 1, borderColor: mode === m ? '#FF653540' : c.bgBorder }}>
            <Text style={{ color: mode === m ? '#FF6535' : c.inkMuted, fontSize: 10, fontWeight: '700' }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="hcpGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.2" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {yLabels.map((v, i) => {
          const y = toY(v);
          return (
            <View key={i}>
              <Line x1={PL} y1={y} x2={PL + PW} y2={y} stroke={c.bgBorder} strokeWidth={1} strokeDasharray="3,4" />
              <SvgText x={PL - 4} y={y + 4} fontSize={9} fill={c.inkMuted} textAnchor="end">{v.toFixed(1)}</SvgText>
            </View>
          );
        })}
        <Path d={areaPath} fill="url(#hcpGrad)" />
        <Path d={linePath}  stroke={lineColor} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3} fill={i === pts.length - 1 ? lineColor : c.bgCard} stroke={lineColor} strokeWidth={1.5} />
        ))}
        {[0, Math.floor((pts.length - 1) / 2), pts.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
          <SvgText key={i} x={pts[i].x} y={H - 4} fontSize={8} fill={c.inkMuted} textAnchor="middle">{data[i].label}</SvgText>
        ))}
      </Svg>
    </View>
  );
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
              <Ionicons name={sectionIcons[s]} size={14} color={active ? '#FF6535' : c.inkMuted} />
              <Text className="text-xs font-black mt-0.5" style={{ color: active ? '#FF6535' : c.inkMuted }}>
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

              {/* WHS Index Card */}
              {data?.whsIndex != null && (
                <View style={{ backgroundColor: c.bgCard, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
                      WHS Handicap Index
                    </Text>
                    <Text style={{ color: '#FF6535', fontSize: 40, fontWeight: '900', lineHeight: 44 }}>
                      {data.whsIndex.toFixed(1)}
                    </Text>
                    <Text style={{ color: c.inkMuted, fontSize: 11, marginTop: 2 }}>
                      Berechnet aus {data.roundDifferentials.length} Runden
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#FF653515', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="golf" size={24} color="#FF6535" />
                    </View>
                    <Text style={{ color: c.inkMuted, fontSize: 9, fontWeight: '700' }}>OFFIZ. INDEX</Text>
                  </View>
                </View>
              )}

              {/* Chart */}
              {((data?.handicapHistory?.length ?? 0) >= 2 || (data?.roundDifferentials?.length ?? 0) >= 2) && (
                <View style={{ backgroundColor: c.bgCard, borderRadius: 20, padding: 16 }}>
                  <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 13, marginBottom: 12 }}>
                    Entwicklung
                  </Text>
                  <HandicapChart
                    entries={data?.handicapHistory ?? []}
                    diffs={data?.roundDifferentials ?? []}
                    c={c}
                  />
                </View>
              )}

              <TouchableOpacity
                className="rounded-xl py-3.5 items-center flex-row justify-center gap-2"
                style={{ backgroundColor: '#FF6535' }}
                onPress={() => setShowAddHandicap(true)}
              >
                <Ionicons name="add" size={18} color="#0A0A0A" />
                <Text className="text-bg-base font-bold">{t('progress.handicap.addButton')}</Text>
              </TouchableOpacity>

              {data?.handicapHistory && data.handicapHistory.length > 0 ? (
                <View className="bg-bg-card rounded-2xl overflow-hidden">
                  <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
                    <Text style={{ color: c.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      Manuelle Einträge
                    </Text>
                  </View>
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
                                  color={improving ? '#6ee7b7' : diff === 0 ? c.inkMuted : '#f97316'}
                                />
                                <Text className="text-xs" style={{ color: improving ? '#6ee7b7' : diff === 0 ? c.inkMuted : '#f97316' }}>
                                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                                </Text>
                              </View>
                            )}
                          </View>
                          {entry.note && <Text className="text-ink-muted text-xs mt-0.5">{entry.note}</Text>}
                        </View>
                        <Text className="text-ink-muted text-xs mr-3">{formatDate(entry.date)}</Text>
                        <TouchableOpacity
                          onPress={() => Alert.alert(
                            'Eintrag löschen',
                            `Handicap ${entry.handicap.toFixed(1)} wirklich löschen?`,
                            [
                              { text: 'Abbrechen', style: 'cancel' },
                              { text: 'Löschen', style: 'destructive', onPress: async () => {
                                try {
                                  await api.delete(`/progress/handicap/${entry.id}`);
                                  load();
                                } catch {}
                              }},
                            ]
                          )}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={15} color={c.inkMuted} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View className="items-center py-12 gap-3">
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
