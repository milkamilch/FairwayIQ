import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/lib/api';
import { useAuthStore } from '../src/store/authStore';
import { useTheme } from '../src/lib/theme';
import type { Course } from '@fairwayiq/shared';

// ── Types ─────────────────────────────────────────────────────────────
interface HoleEntry {
  holeNumber: number;
  par: number;
  strokeIndex: number;
  distanceMeters: number;
  strokes: number;
  putts: number;
  fairwayHit: boolean | null;
  greenInRegulation: boolean;
  penalties: number;
}

// ── Helpers ───────────────────────────────────────────────────────────
function scoreColor(diff: number) {
  if (diff <= -2) return '#a855f7';
  if (diff === -1) return '#00e87a';
  if (diff === 0)  return '#f0f0ff';
  if (diff === 1)  return '#f59e0b';
  return '#ef4444';
}

function scoreDiff(n: number) {
  if (n < 0) return String(n);
  if (n === 0) return 'E';
  return `+${n}`;
}

function extraStrokes(courseHandicap: number, strokeIndex: number): number {
  if (courseHandicap <= 0) return 0;
  if (courseHandicap >= strokeIndex) return 1 + Math.floor((courseHandicap - strokeIndex) / 18);
  return 0;
}

function stablefordPoints(grossStrokes: number, holePar: number, extra: number): number {
  const net = grossStrokes - extra;
  return Math.max(0, 2 - (net - holePar));
}

// ── Stepper ───────────────────────────────────────────────────────────
function Stepper({ value, onDec, onInc, color, size = 'md' }: {
  value: number; onDec: () => void; onInc: () => void;
  color?: string; size?: 'sm' | 'md' | 'lg';
}) {
  const btnSize = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const textSize = size === 'lg' ? 40 : size === 'sm' ? 20 : 28;
  const iconSize = size === 'lg' ? 28 : size === 'sm' ? 16 : 20;
  return (
    <View className="flex-row items-center justify-center gap-4">
      <TouchableOpacity
        className={`${btnSize} rounded-full bg-bg-elevated border border-bg-border items-center justify-center`}
        onPress={onDec}
      >
        <Ionicons name="remove" size={iconSize} color="#8888aa" />
      </TouchableOpacity>
      <Text style={{ fontSize: textSize, fontWeight: 'bold', color: color ?? '#f0f0ff', width: 52, textAlign: 'center' }}>
        {value}
      </Text>
      <TouchableOpacity
        className={`${btnSize} rounded-full bg-bg-elevated border border-bg-border items-center justify-center`}
        onPress={onInc}
      >
        <Ionicons name="add" size={iconSize} color="#8888aa" />
      </TouchableOpacity>
    </View>
  );
}

// ── YesNo Toggle ──────────────────────────────────────────────────────
function YesNoToggle({ value, onTrue, onFalse }: {
  value: boolean | null; onTrue: () => void; onFalse: () => void;
}) {
  return (
    <View className="flex-row gap-2">
      {([true, false] as const).map((v) => (
        <TouchableOpacity
          key={String(v)}
          className="flex-1 py-2.5 rounded-xl items-center"
          style={{
            backgroundColor: value === v ? (v ? '#00e87a20' : '#ef444420') : '#14141f',
            borderWidth: 1,
            borderColor: value === v ? (v ? '#00e87a' : '#ef4444') : '#252535',
          }}
          onPress={v ? onTrue : onFalse}
        >
          <Text className="font-bold text-sm" style={{ color: value === v ? (v ? '#00e87a' : '#ef4444') : '#44445a' }}>
            {v ? 'JA' : 'NEIN'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────
export default function LiveRoundScreen() {
  const router = useRouter();
  const c = useTheme();
  const { user } = useAuthStore();

  const [step, setStep] = useState<'select' | 'playing'>('select');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [scores, setScores] = useState<HoleEntry[]>([]);
  const [activeHole, setActiveHole] = useState(0);
  const [saving, setSaving] = useState(false);
  const holeTabsRef = useRef<ScrollView>(null);
  const tablScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    api.get<Course[]>('/courses').then(({ data }) => setCourses(data)).finally(() => setLoadingCourses(false));
  }, []);

  const courseHandicap: number | null = (() => {
    if (!selectedCourse || user?.handicap == null) return null;
    if (selectedCourse.slope && selectedCourse.rating) {
      return Math.round(user.handicap * selectedCourse.slope / 113 + (selectedCourse.rating - selectedCourse.totalPar));
    }
    return Math.round(user.handicap);
  })();

  const selectCourse = (course: Course) => {
    setSelectedCourse(course);
    const holes = course.holes?.length > 0
      ? course.holes
      : Array.from({ length: 18 }, (_, i) => ({ id: '', courseId: '', number: i + 1, par: 4, strokeIndex: i + 1, distanceMeters: 150, hazards: [] }));
    setScores(holes.map((h) => ({
      holeNumber: h.number,
      par: h.par,
      strokeIndex: h.strokeIndex ?? (h.number),
      distanceMeters: h.distanceMeters ?? 150,
      strokes: h.par,
      putts: 2,
      fairwayHit: null,
      greenInRegulation: false,
      penalties: 0,
    })));
    setActiveHole(0);
    setStep('playing');
  };

  const update = <K extends keyof HoleEntry>(field: K, value: HoleEntry[K]) => {
    setScores((prev) => prev.map((s, i) => i === activeHole ? { ...s, [field]: value } : s));
  };

  const goToHole = (idx: number) => {
    setActiveHole(idx);
    holeTabsRef.current?.scrollTo({ x: Math.max(0, idx - 3) * 40, animated: true });
  };

  const grossTotal = scores.reduce((s, h) => s + h.strokes, 0);
  const parTotal = scores.reduce((s, h) => s + h.par, 0);
  const totalPutts = scores.reduce((s, h) => s + h.putts, 0);
  const totalStableford = scores.reduce((s, h) => {
    const extra = courseHandicap != null ? extraStrokes(courseHandicap, h.strokeIndex) : 0;
    return s + stablefordPoints(h.strokes, h.par, extra);
  }, 0);
  const netTotal = grossTotal - (courseHandicap ?? 0);

  const cur = scores[activeHole];
  const curDiff = cur ? cur.strokes - cur.par : 0;
  const curExtra = (courseHandicap != null && cur) ? extraStrokes(courseHandicap, cur.strokeIndex) : 0;
  const curStableford = cur ? stablefordPoints(cur.strokes, cur.par, curExtra) : 0;

  const save = async () => {
    if (!selectedCourse) return;
    setSaving(true);
    try {
      await api.post('/rounds', {
        courseId: selectedCourse.id,
        date: new Date().toISOString(),
        scores: scores.map((s) => ({
          holeNumber: s.holeNumber,
          par: s.par,
          strokes: s.strokes,
          putts: s.putts,
          fairwayHit: s.fairwayHit,
          greenInRegulation: s.greenInRegulation,
          penalties: s.penalties,
        })),
      });
      router.back();
    } catch {
      Alert.alert('Fehler', 'Runde konnte nicht gespeichert werden');
    }
    setSaving(false);
  };

  const confirmFinish = () => {
    Alert.alert('Runde abschließen?', `Brutto: ${grossTotal} (${scoreDiff(grossTotal - parTotal)})`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Speichern', onPress: save },
    ]);
  };

  // ── Course Selection ────────────────────────────────────────────────
  if (step === 'select') {
    return (
      <SafeAreaView className="flex-1 bg-bg-base">
        <View className="flex-row items-center px-5 py-4 border-b border-bg-border gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={c.inkSecondary} />
          </TouchableOpacity>
          <Text className="text-ink-primary font-bold text-lg flex-1">Platz wählen</Text>
        </View>
        {loadingCourses ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#00e87a" />
          </View>
        ) : courses.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 px-8">
            <Ionicons name="map-outline" size={48} color={c.bgBorder} />
            <Text className="text-ink-secondary font-semibold text-center">Keine Plätze vorhanden</Text>
            <Text className="text-ink-muted text-sm text-center">Füge zuerst einen Platz im Plätze-Tab hinzu.</Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-5 pt-4">
            {courses.map((course) => (
              <TouchableOpacity
                key={course.id}
                className="bg-bg-card border border-bg-border rounded-xl px-4 py-4 mb-3 flex-row items-center justify-between"
                onPress={() => selectCourse(course)}
              >
                <View className="flex-1">
                  <Text className="text-ink-primary font-semibold">{course.name}</Text>
                  <Text className="text-ink-muted text-xs mt-0.5">
                    {course.location} · Par {course.totalPar}
                    {course.rating ? ` · Rating ${course.rating}` : ''}
                    {course.slope ? ` · Slope ${course.slope}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={c.inkMuted} />
              </TouchableOpacity>
            ))}
            <View className="h-8" />
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ── Playing View ────────────────────────────────────────────────────
  if (!cur) return null;

  return (
    <SafeAreaView className="flex-1 bg-bg-base" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-3 pb-2 border-b border-bg-border">
        <View className="flex-row items-center gap-3 mb-2">
          <TouchableOpacity onPress={() => Alert.alert('Runde abbrechen?', 'Fortschritt wird nicht gespeichert.', [
            { text: 'Weiter spielen', style: 'cancel' },
            { text: 'Abbrechen', style: 'destructive', onPress: () => router.back() },
          ])}>
            <Ionicons name="close" size={22} color={c.inkSecondary} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-ink-primary font-bold" numberOfLines={1}>{selectedCourse?.name}</Text>
            <Text className="text-ink-muted text-xs">{selectedCourse?.location}</Text>
          </View>
          <TouchableOpacity
            className="px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: '#00e87a20', borderWidth: 1, borderColor: '#00e87a' }}
            onPress={confirmFinish}
          >
            <Text className="text-neon-green text-xs font-bold">FERTIG</Text>
          </TouchableOpacity>
        </View>

        {/* Running Stats */}
        <View className="flex-row gap-3">
          {[
            { label: 'BRUTTO', value: String(grossTotal), sub: scoreDiff(grossTotal - parTotal), subColor: scoreColor(grossTotal - parTotal) },
            courseHandicap != null
              ? { label: 'NETTO', value: String(netTotal), sub: `HCP ${courseHandicap}`, subColor: c.inkMuted }
              : null,
            { label: 'STABLEFORD', value: String(totalStableford), sub: 'Punkte', subColor: c.inkMuted },
            { label: 'PUTTS', value: String(totalPutts), sub: 'gesamt', subColor: c.inkMuted },
          ].filter(Boolean).map((s) => s && (
            <View key={s.label} className="flex-1 bg-bg-card rounded-lg px-2 py-1.5 items-center">
              <Text style={{ fontSize: 9, color: c.inkMuted, fontWeight: '700', letterSpacing: 0.8 }}>{s.label}</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.inkPrimary }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: s.subColor }}>{s.sub}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Hole Tabs */}
      <ScrollView
        ref={holeTabsRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-bg-border"
        contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 8, gap: 4 }}
      >
        {scores.map((s, i) => {
          const d = s.strokes - s.par;
          const isActive = i === activeHole;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => goToHole(i)}
              style={{
                width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                backgroundColor: isActive ? '#00e87a' : '#14141f',
                borderWidth: 1,
                borderColor: isActive ? '#00e87a' : scoreColor(d) + '60',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: isActive ? '#07070f' : scoreColor(d) }}>
                {i + 1}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Scorecard Table */}
      <ScrollView
        ref={tablScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-bg-border"
        style={{ maxHeight: 130 }}
      >
        <View style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
          {/* Column header */}
          <View className="flex-row mb-1">
            <View style={{ width: 56 }}>
              <Text style={{ fontSize: 9, color: c.inkMuted, fontWeight: '700', textAlign: 'right', paddingRight: 6 }}> </Text>
            </View>
            {scores.map((s, i) => (
              <TouchableOpacity key={i} onPress={() => goToHole(i)} style={{ width: 36, alignItems: 'center' }}>
                <Text style={{
                  fontSize: 10, fontWeight: 'bold',
                  color: i === activeHole ? '#00e87a' : c.inkSecondary,
                }}>
                  {i + 1}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ width: 48, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: c.inkSecondary }}>∑</Text>
            </View>
          </View>
          {/* Rows */}
          {[
            {
              label: 'PAR',
              values: scores.map((s) => ({ v: String(s.par), color: c.inkMuted })),
              total: String(parTotal),
              totalColor: c.inkMuted,
            },
            {
              label: 'SI',
              values: scores.map((s) => ({ v: String(s.strokeIndex), color: c.inkMuted })),
              total: '—',
              totalColor: c.inkMuted,
            },
            {
              label: 'Score',
              values: scores.map((s) => {
                const d = s.strokes - s.par;
                return { v: String(s.strokes), color: scoreColor(d), bold: true };
              }),
              total: String(grossTotal),
              totalColor: scoreColor(grossTotal - parTotal),
              totalBold: true,
            },
            {
              label: '±',
              values: scores.map((s) => {
                const d = s.strokes - s.par;
                return { v: scoreDiff(d), color: scoreColor(d) };
              }),
              total: scoreDiff(grossTotal - parTotal),
              totalColor: scoreColor(grossTotal - parTotal),
              totalBold: true,
            },
            courseHandicap != null ? {
              label: 'SBF',
              values: scores.map((s) => {
                const extra = extraStrokes(courseHandicap!, s.strokeIndex);
                const pts = stablefordPoints(s.strokes, s.par, extra);
                return { v: String(pts), color: pts >= 2 ? '#00e87a' : pts === 1 ? c.inkSecondary : c.inkMuted };
              }),
              total: String(totalStableford),
              totalColor: '#00e87a',
              totalBold: true,
            } : null,
          ].filter(Boolean).map((row) => row && (
            <View key={row.label} className="flex-row items-center mb-0.5">
              <View style={{ width: 56, paddingRight: 6 }}>
                <Text style={{ fontSize: 9, color: c.inkMuted, fontWeight: '600', textAlign: 'right', letterSpacing: 0.5 }}>
                  {row.label}
                </Text>
              </View>
              {row.values.map((cell, i) => (
                <View key={i} style={{ width: 36, alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: (cell as any).bold ? 'bold' : '400',
                    color: (cell as any).color,
                    backgroundColor: i === activeHole && row.label === 'Score' ? (cell as any).color + '15' : 'transparent',
                    paddingHorizontal: 2, borderRadius: 4,
                  }}>
                    {cell.v}
                  </Text>
                </View>
              ))}
              <View style={{ width: 48, alignItems: 'center' }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: (row as any).totalBold ? 'bold' : '400',
                  color: (row as any).totalColor,
                }}>
                  {(row as any).total}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Active Hole Entry */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="pt-4 gap-5 pb-8">
          {/* Hole Info */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">
                Loch {cur.holeNumber} · SI {cur.strokeIndex}
              </Text>
              <Text className="text-ink-primary font-bold text-xl">Par {cur.par}</Text>
              <Text className="text-ink-muted text-xs">{cur.distanceMeters} m</Text>
            </View>
            <View className="items-center gap-1">
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center"
                style={{ backgroundColor: scoreColor(curDiff) + '15', borderWidth: 1, borderColor: scoreColor(curDiff) + '60' }}
              >
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: scoreColor(curDiff) }}>{cur.strokes}</Text>
              </View>
              {courseHandicap != null && (
                <Text className="text-xs font-bold" style={{ color: '#00e87a' }}>
                  {curExtra > 0 ? `+${curExtra} SI` : ''} {curStableford}pt
                </Text>
              )}
            </View>
          </View>

          {/* Strokes */}
          <View>
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-3 text-center">Schläge</Text>
            <Stepper
              value={cur.strokes}
              onDec={() => cur.strokes > 1 && update('strokes', cur.strokes - 1)}
              onInc={() => update('strokes', cur.strokes + 1)}
              color={scoreColor(curDiff)}
              size="lg"
            />
          </View>

          {/* Putts */}
          <View>
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-3 text-center">Putts</Text>
            <Stepper
              value={cur.putts}
              onDec={() => cur.putts > 0 && update('putts', cur.putts - 1)}
              onInc={() => update('putts', cur.putts + 1)}
              size="md"
            />
          </View>

          {/* FIR / GIR */}
          <View className="gap-3">
            {cur.par !== 3 && (
              <View>
                <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2">Fairway getroffen (FIR)?</Text>
                <YesNoToggle
                  value={cur.fairwayHit}
                  onTrue={() => update('fairwayHit', true)}
                  onFalse={() => update('fairwayHit', false)}
                />
              </View>
            )}
            <View>
              <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2">Grün in Regulation (GIR)?</Text>
              <YesNoToggle
                value={cur.greenInRegulation}
                onTrue={() => update('greenInRegulation', true)}
                onFalse={() => update('greenInRegulation', false)}
              />
            </View>
          </View>

          {/* Penalties */}
          <View>
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-3 text-center">Strafschläge</Text>
            <Stepper
              value={cur.penalties}
              onDec={() => cur.penalties > 0 && update('penalties', cur.penalties - 1)}
              onInc={() => update('penalties', cur.penalties + 1)}
              size="sm"
            />
          </View>

          {/* Navigation */}
          <View className="flex-row gap-3">
            {activeHole > 0 && (
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center border border-bg-border"
                onPress={() => goToHole(activeHole - 1)}
              >
                <Text className="text-ink-secondary font-semibold text-sm">← Loch {activeHole}</Text>
              </TouchableOpacity>
            )}
            {activeHole < scores.length - 1 ? (
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: '#00e87a' }}
                onPress={() => goToHole(activeHole + 1)}
              >
                <Text style={{ color: '#07070f', fontWeight: 'bold', fontSize: 14 }}>
                  Loch {activeHole + 2} →
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: '#00e87a' }}
                onPress={confirmFinish}
                disabled={saving}
              >
                <Text style={{ color: '#07070f', fontWeight: 'bold', fontSize: 14 }}>
                  {saving ? 'SPEICHERN...' : 'RUNDE ABSCHLIESSEN ✓'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
