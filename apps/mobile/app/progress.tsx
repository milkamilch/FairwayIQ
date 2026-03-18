import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../src/lib/api';
import { SkillRadar } from '../src/components/SkillRadar';

// ── Typen ──────────────────────────────────────────────────────────────
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

// ── Hilfsfunktionen ────────────────────────────────────────────────────
const FEELING_EMOJI = ['', '😓', '😕', '😊', '💪', '🔥'];
const CATEGORY_LABELS: Record<string, string> = {
  putting: 'Putting', shortGame: 'Kurzspiel', ironPlay: 'Eisenspiel',
  driving: 'Driver', courseManagement: 'Platzmanagement', mentalGame: 'Mental',
};
const CATEGORY_COLORS: Record<string, string> = {
  putting: '#6ee7b7', shortGame: '#00e87a', ironPlay: '#60a5fa',
  driving: '#f59e0b', courseManagement: '#a78bfa', mentalGame: '#f472b6',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ── Mini-Sparkline ─────────────────────────────────────────────────────
function Sparkline({ data, color = '#00e87a', height = 32 }: { data: number[]; color?: string; height?: number }) {
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

// ── Handicap-Eintrag-Modal ─────────────────────────────────────────────
function AddHandicapModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num) || num < -10 || num > 54) {
      Alert.alert('Fehler', 'Handicap muss zwischen -10 und 54 liegen');
      return;
    }
    setSaving(true);
    try {
      await api.post('/progress/handicap', { handicap: num, note: note.trim() || undefined });
      onSaved();
      onClose();
    } catch { Alert.alert('Fehler', 'Eintrag konnte nicht gespeichert werden'); }
    setSaving(false);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-bg-base">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-bg-border">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-ink-secondary text-sm">Abbrechen</Text>
          </TouchableOpacity>
          <Text className="text-ink-primary font-bold">Handicap eintragen</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            <Text className="text-neon-green font-bold text-sm">{saving ? '...' : 'Speichern'}</Text>
          </TouchableOpacity>
        </View>
        <View className="p-5 gap-5">
          <View>
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2">Aktuelles Handicap</Text>
            <TextInput
              className="bg-bg-elevated border border-bg-border text-ink-primary rounded-xl px-4 py-4 text-2xl font-bold text-center"
              placeholder="18.4"
              placeholderTextColor="#44445a"
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
          <View>
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2">Notiz (optional)</Text>
            <TextInput
              className="bg-bg-elevated border border-bg-border text-ink-primary rounded-xl px-4 py-3 text-sm"
              placeholder="z.B. nach Turnier in München"
              placeholderTextColor="#44445a"
              value={note}
              onChangeText={setNote}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── Hauptscreen ────────────────────────────────────────────────────────
export default function ProgressScreen() {
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

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 flex-row items-center gap-3 border-b border-bg-border">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#8888aa" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Analyse</Text>
          <Text className="text-ink-primary text-xl font-bold">Fortschritt</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border border-bg-border"
          style={{ backgroundColor: '#14141f' }}
        >
          <Ionicons name="logo-github" size={13} color="#44445a" />
          <Text className="text-ink-muted text-xs">Garmin-Sync: bald</Text>
        </TouchableOpacity>
      </View>

      {/* Section Tabs */}
      <View className="flex-row px-5 pt-3 pb-2 gap-2">
        {(['radar', 'handicap', 'rounds', 'training'] as const).map((s) => {
          const labels = { radar: 'Skills', handicap: 'HCP', rounds: 'Runden', training: 'Training' };
          const icons: Record<string, any> = { radar: 'radio-button-on', handicap: 'trending-down', rounds: 'golf', training: 'fitness' };
          const active = activeSection === s;
          return (
            <TouchableOpacity
              key={s}
              className="flex-1 items-center py-2 rounded-xl"
              style={{ backgroundColor: active ? '#00e87a20' : '#14141f', borderWidth: 1, borderColor: active ? '#00e87a40' : '#252535' }}
              onPress={() => setActiveSection(s)}
            >
              <Ionicons name={icons[s]} size={14} color={active ? '#00e87a' : '#44445a'} />
              <Text className="text-xs font-semibold mt-0.5" style={{ color: active ? '#00e87a' : '#44445a' }}>
                {labels[s]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#00e87a" size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00e87a" />}
        >
          {/* ── SKILL RADAR ──────────────────────────────────────────── */}
          {activeSection === 'radar' && (
            <View className="px-5 pt-4 gap-4">
              {data?.skillRadar ? (
                <>
                  <View className="bg-bg-card border border-bg-border rounded-2xl p-4">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-ink-primary font-bold">Skill-Radar</Text>
                      {data.skillHistory.length > 0 && (
                        <Text className="text-ink-muted text-xs">
                          {formatDate(data.skillHistory[data.skillHistory.length - 1].date)}
                        </Text>
                      )}
                    </View>
                    <SkillRadar scores={data.skillRadar} previous={prevScores} size={300} />
                  </View>

                  {/* Score-Balken */}
                  <View className="bg-bg-card border border-bg-border rounded-2xl p-4 gap-3">
                    <Text className="text-ink-primary font-bold mb-1">Detailwerte</Text>
                    {Object.entries(data.skillRadar)
                      .sort(([, a], [, b]) => a - b)
                      .map(([key, val]) => {
                        const color = CATEGORY_COLORS[key] ?? '#00e87a';
                        const label = CATEGORY_LABELS[key] ?? key;
                        return (
                          <View key={key}>
                            <View className="flex-row items-center justify-between mb-1">
                              <Text className="text-ink-secondary text-sm">{label}</Text>
                              <Text className="text-sm font-bold" style={{ color }}>{Math.round(val)}</Text>
                            </View>
                            <View className="bg-bg-elevated rounded-full h-2 overflow-hidden">
                              <View className="h-2 rounded-full" style={{ width: `${val}%`, backgroundColor: color }} />
                            </View>
                          </View>
                        );
                      })}
                  </View>

                  {/* Schwächen */}
                  {data.latestWeaknesses.length > 0 && (
                    <View className="bg-bg-card border border-bg-border rounded-2xl p-4">
                      <Text className="text-ink-primary font-bold mb-3">Fokus-Bereiche</Text>
                      {data.latestWeaknesses.map((w, i) => (
                        <View key={i} className="flex-row items-center gap-3 mb-2">
                          <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: '#f59e0b20' }}>
                            <Text style={{ color: '#f59e0b', fontSize: 12 }}>!</Text>
                          </View>
                          <Text className="text-ink-secondary text-sm flex-1">{CATEGORY_LABELS[w] ?? w}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Assessment-Verlauf */}
                  {data.skillHistory.length > 1 && (
                    <View className="bg-bg-card border border-bg-border rounded-2xl p-4">
                      <Text className="text-ink-primary font-bold mb-3">Assessment-Verlauf</Text>
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
                  <Ionicons name="radio-button-on-outline" size={48} color="#252535" />
                  <Text className="text-ink-secondary font-semibold">Noch kein Assessment</Text>
                  <Text className="text-ink-muted text-sm text-center">Führe ein Assessment durch um deinen Skill-Radar zu sehen</Text>
                </View>
              )}
            </View>
          )}

          {/* ── HANDICAP ─────────────────────────────────────────────── */}
          {activeSection === 'handicap' && (
            <View className="px-5 pt-4 gap-4">
              <TouchableOpacity
                className="rounded-xl py-3.5 items-center flex-row justify-center gap-2"
                style={{ backgroundColor: '#00e87a' }}
                onPress={() => setShowAddHandicap(true)}
              >
                <Ionicons name="add" size={18} color="#07070f" />
                <Text className="text-bg-base font-bold">Handicap eintragen</Text>
              </TouchableOpacity>

              {data?.handicapHistory && data.handicapHistory.length > 0 ? (
                <>
                  {/* Trend-Chart */}
                  <View className="bg-bg-card border border-bg-border rounded-2xl p-4">
                    <View className="flex-row items-start justify-between mb-4">
                      <View>
                        <Text className="text-ink-primary font-bold">HCP-Verlauf</Text>
                        <Text className="text-ink-muted text-xs">{data.handicapHistory.length} Einträge</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-3xl font-bold" style={{ color: '#00e87a' }}>
                          {data.handicapHistory[data.handicapHistory.length - 1].handicap.toFixed(1)}
                        </Text>
                        {data.handicapHistory.length >= 2 && (() => {
                          const diff = data.handicapHistory[data.handicapHistory.length - 1].handicap
                            - data.handicapHistory[data.handicapHistory.length - 2].handicap;
                          const improving = diff < 0;
                          return (
                            <View className="flex-row items-center gap-1">
                              <Ionicons name={improving ? 'trending-down' : 'trending-up'} size={12} color={improving ? '#00e87a' : '#f97316'} />
                              <Text className="text-xs font-semibold" style={{ color: improving ? '#00e87a' : '#f97316' }}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                              </Text>
                            </View>
                          );
                        })()}
                      </View>
                    </View>
                    {/* Inverted sparkline: lower = better → invert values */}
                    {data.handicapHistory.length >= 2 && (
                      <Sparkline
                        data={data.handicapHistory.map((e) => -e.handicap)}
                        color="#00e87a"
                        height={48}
                      />
                    )}
                  </View>

                  {/* Entry list */}
                  <View className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
                    {data.handicapHistory.slice().reverse().slice(0, 10).map((entry, i, arr) => {
                      const prev = arr[i + 1];
                      const diff = prev ? entry.handicap - prev.handicap : null;
                      const improving = diff !== null && diff < 0;
                      return (
                        <View
                          key={entry.id}
                          className="flex-row items-center px-4 py-3 border-b border-bg-border"
                        >
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                              <Text className="text-ink-primary font-bold text-base">{entry.handicap.toFixed(1)}</Text>
                              {diff !== null && (
                                <View className="flex-row items-center gap-0.5">
                                  <Ionicons
                                    name={improving ? 'trending-down' : diff === 0 ? 'remove' : 'trending-up'}
                                    size={11}
                                    color={improving ? '#00e87a' : diff === 0 ? '#44445a' : '#f97316'}
                                  />
                                  <Text className="text-xs" style={{ color: improving ? '#00e87a' : diff === 0 ? '#44445a' : '#f97316' }}>
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
                  <Ionicons name="trending-down-outline" size={48} color="#252535" />
                  <Text className="text-ink-secondary font-semibold">Noch keine HCP-Einträge</Text>
                  <Text className="text-ink-muted text-sm text-center">Trage dein Handicap nach jeder offiziellen Runde ein</Text>
                </View>
              )}
            </View>
          )}

          {/* ── RUNDEN ───────────────────────────────────────────────── */}
          {activeSection === 'rounds' && (
            <View className="px-5 pt-4 gap-4">
              {data?.roundHistory && data.roundHistory.length > 0 ? (
                <>
                  {/* Score-Trend */}
                  <View className="bg-bg-card border border-bg-border rounded-2xl p-4">
                    <Text className="text-ink-primary font-bold mb-1">Score-Verlauf</Text>
                    <Text className="text-ink-muted text-xs mb-4">{data.roundHistory.length} Runden</Text>
                    <Sparkline data={data.roundHistory.map((r) => -r.scoreToPar + 30)} color="#00e87a" height={48} />
                    <View className="flex-row justify-between mt-2">
                      <Text className="text-ink-muted text-xs">Beste: {Math.min(...data.roundHistory.map((r) => r.scoreToPar) ) >= 0 ? '+' : ''}{Math.min(...data.roundHistory.map((r) => r.scoreToPar))}</Text>
                      <Text className="text-ink-muted text-xs">Zuletzt: {data.roundHistory[data.roundHistory.length - 1].scoreToPar >= 0 ? '+' : ''}{data.roundHistory[data.roundHistory.length - 1].scoreToPar}</Text>
                    </View>
                  </View>

                  {/* GIR / FIR Trends */}
                  <View className="flex-row gap-3">
                    <View className="flex-1 bg-bg-card border border-bg-border rounded-2xl p-4">
                      <Text className="text-ink-secondary text-xs font-semibold mb-1">GIR</Text>
                      <Text className="text-2xl font-bold text-ink-primary">
                        {Math.round(data.roundHistory.reduce((s, r) => s + r.girPercent, 0) / data.roundHistory.length)}%
                      </Text>
                      <Text className="text-ink-muted text-xs">Ø</Text>
                      <Sparkline data={data.roundHistory.map((r) => r.girPercent)} color="#60a5fa" height={24} />
                    </View>
                    <View className="flex-1 bg-bg-card border border-bg-border rounded-2xl p-4">
                      <Text className="text-ink-secondary text-xs font-semibold mb-1">Putts/Loch</Text>
                      <Text className="text-2xl font-bold text-ink-primary">
                        {(data.roundHistory.reduce((s, r) => s + r.avgPutts, 0) / data.roundHistory.length).toFixed(1)}
                      </Text>
                      <Text className="text-ink-muted text-xs">Ø</Text>
                      <Sparkline data={data.roundHistory.map((r) => -r.avgPutts + 4)} color="#6ee7b7" height={24} />
                    </View>
                  </View>

                  {/* Runden-Liste */}
                  <View className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
                    {data.roundHistory.slice().reverse().slice(0, 8).map((r) => {
                      const color = r.scoreToPar < 0 ? '#00e87a' : r.scoreToPar === 0 ? '#f59e0b' : '#8888aa';
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
                  <Ionicons name="golf-outline" size={48} color="#252535" />
                  <Text className="text-ink-secondary font-semibold">Noch keine Runden</Text>
                  <Text className="text-ink-muted text-sm text-center">Trage Runden ein um deinen Fortschritt zu sehen</Text>
                </View>
              )}
            </View>
          )}

          {/* ── TRAINING ─────────────────────────────────────────────── */}
          {activeSection === 'training' && (
            <View className="px-5 pt-4 gap-4">
              {data?.trainingStats && data.trainingStats.totalSessions > 0 ? (
                <>
                  {/* Stats-Kacheln */}
                  <View className="flex-row gap-3">
                    <View className="flex-1 bg-bg-card border border-bg-border rounded-2xl p-4 items-center">
                      <Text className="text-3xl font-bold text-neon-green">{data.trainingStats.totalSessions}</Text>
                      <Text className="text-ink-muted text-xs mt-1">Einheiten</Text>
                    </View>
                    <View className="flex-1 bg-bg-card border border-bg-border rounded-2xl p-4 items-center">
                      <Text className="text-3xl" style={{ lineHeight: 40 }}>
                        {FEELING_EMOJI[Math.round(data.trainingStats.avgFeeling ?? 3)]}
                      </Text>
                      <Text className="text-ink-muted text-xs mt-1">Ø Gefühl</Text>
                    </View>
                    <View className="flex-1 bg-bg-card border border-bg-border rounded-2xl p-4 items-center">
                      <Text className="text-3xl font-bold" style={{ color: '#f59e0b' }}>
                        {(data.trainingStats.avgDifficulty ?? 0).toFixed(1)}
                      </Text>
                      <Text className="text-ink-muted text-xs mt-1">Ø Belastung</Text>
                    </View>
                  </View>

                  {/* Session-Timeline */}
                  <View className="bg-bg-card border border-bg-border rounded-2xl p-4">
                    <Text className="text-ink-primary font-bold mb-3">Letzte Einheiten</Text>
                    {data.trainingStats.recentSessions.map((s, i) => {
                      const diffColor = s.difficulty >= 4 ? '#f97316' : s.difficulty <= 2 ? '#22d3ee' : '#00e87a';
                      return (
                        <View key={i} className="flex-row items-center gap-3 mb-3">
                          <Text style={{ fontSize: 18 }}>{FEELING_EMOJI[s.feeling]}</Text>
                          <View className="flex-1">
                            <View className="flex-row items-center justify-between mb-1">
                              <Text className="text-ink-muted text-xs">{formatDate(s.createdAt)}</Text>
                              <Text className="text-xs font-semibold" style={{ color: diffColor }}>
                                Belastung {s.difficulty}/5
                              </Text>
                            </View>
                            <View className="flex-row gap-1">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <View
                                  key={n}
                                  className="flex-1 h-1.5 rounded-full"
                                  style={{ backgroundColor: n <= s.difficulty ? diffColor : '#252535' }}
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
                  <Ionicons name="fitness-outline" size={48} color="#252535" />
                  <Text className="text-ink-secondary font-semibold">Noch keine Trainingseinheiten</Text>
                  <Text className="text-ink-muted text-sm text-center">Schließe Trainingstage mit Feedback ab</Text>
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
