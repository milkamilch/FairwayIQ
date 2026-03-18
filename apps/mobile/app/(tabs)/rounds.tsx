import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';
import { Round, Course } from '@fairwayiq/shared';

function scoreColor(diff: number) {
  if (diff <= -2) return '#a855f7';
  if (diff === -1) return '#00e87a';
  if (diff === 0) return '#f0f0ff';
  if (diff === 1) return '#f59e0b';
  return '#ef4444';
}

function scoreLabel(diff: number) {
  if (diff <= -2) return 'EAGLE';
  if (diff === -1) return 'BIRDIE';
  if (diff === 0) return 'PAR';
  if (diff === 1) return 'BOGEY';
  if (diff === 2) return 'DBL';
  return `+${diff}`;
}

interface HoleEntry {
  holeNumber: number; par: number; strokes: number;
  putts: number; fairwayHit: boolean | null; greenInRegulation: boolean; penalties: number;
}

function NewRoundModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [scores, setScores] = useState<HoleEntry[]>([]);
  const [currentHole, setCurrentHole] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get<Course[]>('/courses').then(({ data }) => setCourses(data)); }, []);

  const selectCourse = (course: Course) => {
    setSelectedCourse(course);
    const holes = (course as any).holes ?? Array.from({ length: 18 }, (_, i) => ({ number: i + 1, par: 4 }));
    setScores(holes.map((h: any) => ({
      holeNumber: h.number, par: h.par, strokes: h.par,
      putts: 2, fairwayHit: null, greenInRegulation: false, penalties: 0,
    })));
  };

  const update = (field: keyof HoleEntry, value: any) => {
    setScores((prev) => prev.map((s, i) => i === currentHole ? { ...s, [field]: value } : s));
  };

  const save = async () => {
    if (!selectedCourse) return;
    setSaving(true);
    try {
      await api.post('/rounds', { courseId: selectedCourse.id, date: new Date().toISOString(), scores });
      onSaved(); onClose();
    } catch { Alert.alert('Fehler', 'Runde konnte nicht gespeichert werden'); }
    setSaving(false);
  };

  const cur = scores[currentHole];
  const diff = cur ? cur.strokes - cur.par : 0;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-bg-base">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-bg-border">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-ink-secondary text-sm">Abbrechen</Text>
          </TouchableOpacity>
          <Text className="text-ink-primary font-bold">Neue Runde</Text>
          {!selectedCourse || currentHole < scores.length - 1
            ? <View className="w-16" />
            : <TouchableOpacity onPress={save} disabled={saving}>
                <Text className="text-neon-green font-bold text-sm">{saving ? '...' : 'Speichern'}</Text>
              </TouchableOpacity>
          }
        </View>

        {!selectedCourse ? (
          <ScrollView className="flex-1 px-5 pt-5">
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-3">Platz wählen</Text>
            {courses.length === 0 ? (
              <View className="items-center py-10">
                <Text className="text-ink-muted text-sm">Keine Plätze vorhanden.</Text>
                <Text className="text-ink-muted text-xs mt-1">Füge zuerst einen Platz hinzu.</Text>
              </View>
            ) : (
              courses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  className="bg-bg-card border border-bg-border rounded-xl px-4 py-4 mb-3 flex-row items-center justify-between"
                  onPress={() => selectCourse(c)}
                >
                  <View>
                    <Text className="text-ink-primary font-semibold">{c.name}</Text>
                    <Text className="text-ink-muted text-xs">{c.location} · Par {c.totalPar}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#44445a" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        ) : cur ? (
          <View className="flex-1">
            {/* Hole Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-bg-border py-2 px-3">
              {scores.map((s, i) => {
                const d = s.strokes - s.par;
                return (
                  <TouchableOpacity
                    key={i}
                    className="w-9 h-9 rounded-lg items-center justify-center mx-0.5"
                    style={{
                      backgroundColor: i === currentHole ? '#00e87a' : '#14141f',
                      borderWidth: 1,
                      borderColor: i === currentHole ? '#00e87a' : scoreColor(d) + '60',
                    }}
                    onPress={() => setCurrentHole(i)}
                  >
                    <Text className="text-xs font-bold" style={{ color: i === currentHole ? '#07070f' : scoreColor(d) }}>{i + 1}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <ScrollView className="flex-1 px-5">
              <View className="py-5 gap-6">
                {/* Score */}
                <View>
                  <View className="flex-row items-center justify-between mb-4">
                    <View>
                      <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Loch {cur.holeNumber}</Text>
                      <Text className="text-ink-primary font-bold text-lg">Par {cur.par}</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-3xl font-bold" style={{ color: scoreColor(diff) }}>{cur.strokes}</Text>
                      <Text className="text-xs font-bold tracking-widest" style={{ color: scoreColor(diff) }}>
                        {scoreLabel(diff)}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-center gap-6">
                    <TouchableOpacity
                      className="w-14 h-14 rounded-full bg-bg-elevated border border-bg-border items-center justify-center"
                      onPress={() => cur.strokes > 1 && update('strokes', cur.strokes - 1)}
                    >
                      <Ionicons name="remove" size={26} color="#8888aa" />
                    </TouchableOpacity>
                    <View className="w-16 h-16 rounded-2xl items-center justify-center border" style={{ borderColor: scoreColor(diff) + '60', backgroundColor: scoreColor(diff) + '10' }}>
                      <Text className="text-4xl font-bold" style={{ color: scoreColor(diff) }}>{cur.strokes}</Text>
                    </View>
                    <TouchableOpacity
                      className="w-14 h-14 rounded-full bg-bg-elevated border border-bg-border items-center justify-center"
                      onPress={() => update('strokes', cur.strokes + 1)}
                    >
                      <Ionicons name="add" size={26} color="#8888aa" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Putts */}
                <View>
                  <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-3">Putts</Text>
                  <View className="flex-row items-center justify-center gap-6">
                    <TouchableOpacity
                      className="w-11 h-11 rounded-full bg-bg-elevated border border-bg-border items-center justify-center"
                      onPress={() => cur.putts > 0 && update('putts', cur.putts - 1)}
                    >
                      <Ionicons name="remove" size={18} color="#8888aa" />
                    </TouchableOpacity>
                    <Text className="text-ink-primary text-4xl font-bold w-12 text-center">{cur.putts}</Text>
                    <TouchableOpacity
                      className="w-11 h-11 rounded-full bg-bg-elevated border border-bg-border items-center justify-center"
                      onPress={() => update('putts', cur.putts + 1)}
                    >
                      <Ionicons name="add" size={18} color="#8888aa" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* FIR / GIR */}
                <View className="gap-3">
                  {cur.par !== 3 && (
                    <View>
                      <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2">Fairway getroffen?</Text>
                      <View className="flex-row gap-2">
                        {([true, false] as const).map((v) => (
                          <TouchableOpacity key={String(v)} className="flex-1 py-3 rounded-xl items-center"
                            style={{ backgroundColor: cur.fairwayHit === v ? (v ? '#00e87a20' : '#ef444420') : '#14141f', borderWidth: 1, borderColor: cur.fairwayHit === v ? (v ? '#00e87a' : '#ef4444') : '#252535' }}
                            onPress={() => update('fairwayHit', v)}
                          >
                            <Text className="font-bold text-sm" style={{ color: cur.fairwayHit === v ? (v ? '#00e87a' : '#ef4444') : '#44445a' }}>
                              {v ? 'JA' : 'NEIN'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                  <View>
                    <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2">Grün in Regulation (GIR)?</Text>
                    <View className="flex-row gap-2">
                      {([true, false] as const).map((v) => (
                        <TouchableOpacity key={String(v)} className="flex-1 py-3 rounded-xl items-center"
                          style={{ backgroundColor: cur.greenInRegulation === v ? (v ? '#00e87a20' : '#ef444420') : '#14141f', borderWidth: 1, borderColor: cur.greenInRegulation === v ? (v ? '#00e87a' : '#ef4444') : '#252535' }}
                          onPress={() => update('greenInRegulation', v)}
                        >
                          <Text className="font-bold text-sm" style={{ color: cur.greenInRegulation === v ? (v ? '#00e87a' : '#ef4444') : '#44445a' }}>
                            {v ? 'JA' : 'NEIN'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Nav */}
                <View className="flex-row gap-3">
                  {currentHole > 0 && (
                    <TouchableOpacity className="flex-1 py-3.5 rounded-xl items-center border border-bg-border" onPress={() => setCurrentHole(currentHole - 1)}>
                      <Text className="text-ink-secondary font-semibold text-sm">← Zurück</Text>
                    </TouchableOpacity>
                  )}
                  {currentHole < scores.length - 1 ? (
                    <TouchableOpacity className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: '#00e87a' }} onPress={() => setCurrentHole(currentHole + 1)}>
                      <Text className="text-bg-base font-bold text-sm">Nächstes Loch →</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: '#00e87a' }} onPress={save} disabled={saving}>
                      <Text className="text-bg-base font-bold text-sm">{saving ? 'SPEICHERN...' : 'RUNDE ABSCHLIESSEN ✓'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

export default function RoundsScreen() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [showNewRound, setShowNewRound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRounds = async () => {
    try { const { data } = await api.get<Round[]>('/rounds'); setRounds(data); } catch {}
  };

  useEffect(() => { fetchRounds(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchRounds(); setRefreshing(false); };

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <View className="px-5 pt-4 pb-4 flex-row items-end justify-between">
        <View>
          <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Runden</Text>
          <Text className="text-ink-primary text-2xl font-bold mt-0.5">Score History</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl border border-neon-green"
          style={{ backgroundColor: '#00e87a15' }}
          onPress={() => setShowNewRound(true)}
        >
          <Ionicons name="add" size={16} color="#00e87a" />
          <Text className="text-neon-green text-xs font-bold">NEUE RUNDE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00e87a" />}
      >
        {rounds.length === 0 ? (
          <View className="items-center py-16 gap-3">
            <Ionicons name="stats-chart-outline" size={48} color="#252535" />
            <Text className="text-ink-secondary font-semibold">Noch keine Runden</Text>
            <Text className="text-ink-muted text-sm text-center">Erfasse deine erste Runde</Text>
            <TouchableOpacity className="mt-2 px-6 py-3 rounded-xl border border-neon-green" style={{ backgroundColor: '#00e87a15' }} onPress={() => setShowNewRound(true)}>
              <Text className="text-neon-green font-semibold text-sm">Runde starten →</Text>
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
              <View key={round.id} className="bg-bg-card border border-bg-border rounded-xl mb-3 overflow-hidden">
                <View className="p-4 flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-ink-primary font-bold">{(round as any).course?.name ?? round.courseName ?? '—'}</Text>
                    <Text className="text-ink-muted text-xs mt-0.5">
                      {new Date(round.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-3xl font-bold" style={{ color: scoreColor(diff) }}>{totalStrokes}</Text>
                    <Text className="text-xs font-bold" style={{ color: scoreColor(diff) }}>
                      {diff === 0 ? 'EVEN' : diff > 0 ? `+${diff}` : String(diff)}
                    </Text>
                  </View>
                </View>
                <View className="px-4 py-3 border-t border-bg-border flex-row gap-4">
                  {[
                    { label: 'PUTTS', value: String(putts) },
                    { label: 'GIR', value: `${gir}/18` },
                    { label: 'FIR', value: `${fir}/${firTotal}` },
                  ].map((s) => (
                    <View key={s.label} className="flex-row items-center gap-1.5">
                      <Text className="text-ink-muted text-xs">{s.label}</Text>
                      <Text className="text-ink-secondary text-xs font-bold">{s.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}
        <View className="h-8" />
      </ScrollView>

      {showNewRound && <NewRoundModal onClose={() => setShowNewRound(false)} onSaved={fetchRounds} />}
    </SafeAreaView>
  );
}
