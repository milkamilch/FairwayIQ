import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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
  if (diff === -1) return '#FF6535';
  if (diff === 0)  return '#FFFFFF';
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
  const c = useTheme();
  const btnSize = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const textSize = size === 'lg' ? 40 : size === 'sm' ? 20 : 28;
  const iconSize = size === 'lg' ? 28 : size === 'sm' ? 16 : 20;
  return (
    <View className="flex-row items-center justify-center gap-4">
      <TouchableOpacity
        className={`${btnSize} rounded-full bg-bg-elevated border border-bg-border items-center justify-center`}
        onPress={onDec}
      >
        <Ionicons name="remove" size={iconSize} color="#8A8A8A" />
      </TouchableOpacity>
      <Text style={{ fontSize: textSize, fontWeight: 'bold', color: color ?? c.inkPrimary, width: 52, textAlign: 'center' }}>
        {value}
      </Text>
      <TouchableOpacity
        className={`${btnSize} rounded-full bg-bg-elevated border border-bg-border items-center justify-center`}
        onPress={onInc}
      >
        <Ionicons name="add" size={iconSize} color="#8A8A8A" />
      </TouchableOpacity>
    </View>
  );
}

// ── YesNo Toggle ──────────────────────────────────────────────────────
function YesNoToggle({ value, onTrue, onFalse }: {
  value: boolean | null; onTrue: () => void; onFalse: () => void;
}) {
  const { t } = useTranslation();
  const c = useTheme();
  return (
    <View className="flex-row gap-2">
      {([true, false] as const).map((v) => (
        <TouchableOpacity
          key={String(v)}
          className="flex-1 py-2.5 rounded-xl items-center"
          style={{
            backgroundColor: value === v ? (v ? '#FF653520' : '#ef444420') : c.bgElevated,
            borderWidth: 1,
            borderColor: value === v ? (v ? '#FF6535' : '#ef4444') : c.bgBorder,
          }}
          onPress={v ? onTrue : onFalse}
        >
          <Text className="font-bold text-sm" style={{ color: value === v ? (v ? '#FF6535' : '#ef4444') : c.inkMuted }}>
            {v ? t('liveRound.yes') : t('liveRound.no')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Round Summary Modal ───────────────────────────────────────────────
interface SummaryData {
  gross: number;
  scoreToPar: number;
  putts: number;
  gir: number;
  fir: number;
  firHoles: number;
  stableford: number;
  courseHandicap: number | null;
  breakdown: { label: string; count: number; color: string }[];
}

function RoundSummaryModal({ data, courseName, onDone }: {
  data: SummaryData; courseName: string; onDone: () => void;
}) {
  const { t } = useTranslation();
  const c = useTheme();
  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView className="flex-1 bg-bg-base">
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingTop: 36, paddingBottom: 40 }}>
          {/* Course name */}
          <Text style={{ fontSize: 12, color: c.inkMuted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>
            {courseName}
          </Text>
          {/* Big score */}
          <Text style={{ fontSize: 72, fontWeight: '900', color: data.scoreToPar === 0 ? c.inkPrimary : scoreColor(data.scoreToPar), textAlign: 'center', lineHeight: 80 }}>
            {scoreDiff(data.scoreToPar)}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: c.inkSecondary, textAlign: 'center', marginBottom: 28 }}>
            {data.gross} {t('liveRound.summary.gross')}
          </Text>

          {/* Score breakdown */}
          <Text style={{ fontSize: 11, color: c.inkMuted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
            {t('liveRound.summary.breakdown')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {data.breakdown.map((b) => b.count > 0 && (
              <View key={b.label} style={{ flex: 1, minWidth: 80, backgroundColor: b.color + '15', borderRadius: 14, borderWidth: 1, borderColor: b.color + '40', padding: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: b.color }}>{b.count}</Text>
                <Text style={{ fontSize: 11, color: b.color, fontWeight: '600', marginTop: 2 }}>{b.label}</Text>
              </View>
            ))}
          </View>

          {/* Key stats */}
          <Text style={{ fontSize: 11, color: c.inkMuted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
            {t('liveRound.summary.stats')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
            {[
              { label: t('liveRound.summary.putts'), value: String(data.putts), sub: t('liveRound.summary.perHole', { n: (data.putts / 18).toFixed(1) }) },
              { label: t('liveRound.summary.gir'), value: `${data.gir}/18`, sub: `${Math.round(data.gir / 18 * 100)}%` },
              { label: t('liveRound.summary.fir'), value: `${data.fir}/${data.firHoles}`, sub: data.firHoles > 0 ? `${Math.round(data.fir / data.firHoles * 100)}%` : '—' },
              ...(data.stableford > 0 ? [{ label: 'Stableford', value: String(data.stableford), sub: t('liveRound.points') }] : []),
            ].map((s) => (
              <View key={s.label} style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 14, padding: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 9, color: c.inkMuted, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>{s.label}</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: c.inkPrimary, marginTop: 2 }}>{s.value}</Text>
                <Text style={{ fontSize: 10, color: c.inkMuted, marginTop: 1 }}>{s.sub}</Text>
              </View>
            ))}
          </View>

          {/* Handicap info */}
          {data.courseHandicap != null && (
            <View style={{ backgroundColor: '#FF653515', borderRadius: 14, borderWidth: 1, borderColor: '#FF653540', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <Ionicons name="golf-outline" size={24} color="#FF6535" />
              <View>
                <Text style={{ fontSize: 12, color: '#FF6535', fontWeight: '700' }}>{t('liveRound.summary.courseHcp')}</Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#FF6535' }}>{data.courseHandicap}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Done button */}
        <View style={{ padding: 20, paddingBottom: 32 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#FF6535', borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
            onPress={onDone}
          >
            <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 16 }}>{t('liveRound.summary.done')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────
export default function LiveRoundScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const c = useTheme();
  const { user } = useAuthStore();
  const { bottom } = useSafeAreaInsets();

  const [step, setStep] = useState<'select' | 'playing'>('select');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [scores, setScores] = useState<HoleEntry[]>([]);
  const [activeHole, setActiveHole] = useState(0);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const holeTabsRef = useRef<ScrollView>(null);

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

      // Build summary data
      const firHoles = scores.filter((s) => s.par !== 3).length;
      const fir = scores.filter((s) => s.par !== 3 && s.fairwayHit === true).length;
      const gir = scores.filter((s) => s.greenInRegulation).length;
      const putts = scores.reduce((acc, s) => acc + s.putts, 0);
      const gross = scores.reduce((acc, s) => acc + s.strokes, 0);
      const par = scores.reduce((acc, s) => acc + s.par, 0);
      const stableford = scores.reduce((acc, s) => {
        const extra = courseHandicap != null ? extraStrokes(courseHandicap, s.strokeIndex) : 0;
        return acc + stablefordPoints(s.strokes, s.par, extra);
      }, 0);

      const countDiff = (min: number, max: number) =>
        scores.filter((s) => s.strokes - s.par >= min && s.strokes - s.par <= max).length;

      const breakdown = [
        { label: t('liveRound.summary.eagle'), count: scores.filter((s) => s.strokes - s.par <= -2).length, color: '#a855f7' },
        { label: t('liveRound.summary.birdie'), count: countDiff(-1, -1), color: '#FF6535' },
        { label: t('liveRound.summary.par'), count: countDiff(0, 0), color: '#8A8A8A' },
        { label: t('liveRound.summary.bogey'), count: countDiff(1, 1), color: '#f59e0b' },
        { label: t('liveRound.summary.double'), count: countDiff(2, 2), color: '#ef4444' },
        { label: t('liveRound.summary.triple'), count: scores.filter((s) => s.strokes - s.par >= 3).length, color: '#dc2626' },
      ];

      setSummary({ gross, scoreToPar: gross - par, putts, gir, fir, firHoles, stableford, courseHandicap, breakdown });
    } catch {
      Alert.alert(t('common.error'), t('liveRound.cannotSave'));
    }
    setSaving(false);
  };

  const confirmFinish = () => {
    Alert.alert(
      t('liveRound.finishTitle'),
      t('liveRound.finishMsg', { gross: grossTotal, diff: scoreDiff(grossTotal - parTotal) }),
      [
        { text: t('liveRound.abandon'), style: 'cancel' },
        { text: t('common.save'), onPress: save },
      ],
    );
  };

  // ── Course Selection ────────────────────────────────────────────────
  if (step === 'select') {
    return (
      <SafeAreaView className="flex-1 bg-bg-base">
        <View className="flex-row items-center px-5 py-4 border-b border-bg-border gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={c.inkSecondary} />
          </TouchableOpacity>
          <Text className="text-ink-primary font-bold text-lg flex-1">{t('liveRound.selectCourse')}</Text>
        </View>
        {loadingCourses ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#FF6535" />
          </View>
        ) : courses.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 px-8">
            <Ionicons name="map-outline" size={48} color={c.bgBorder} />
            <Text className="text-ink-secondary font-semibold text-center">{t('liveRound.noCourses')}</Text>
            <Text className="text-ink-muted text-sm text-center">{t('liveRound.noCoursesHint')}</Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-5 pt-4">
            {courses.map((course) => (
              <TouchableOpacity
                key={course.id}
                className="bg-bg-card rounded-2xl px-4 py-4 mb-3 flex-row items-center justify-between"
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
      {summary && (
        <RoundSummaryModal
          data={summary}
          courseName={selectedCourse?.name ?? ''}
          onDone={() => router.back()}
        />
      )}
      {/* Header */}
      <View className="px-4 pt-3 pb-2 border-b border-bg-border">
        <View className="flex-row items-center gap-3 mb-2">
          <TouchableOpacity onPress={() => Alert.alert(t('liveRound.abandonTitle'), t('liveRound.abandonMsg'), [
            { text: t('liveRound.keepPlaying'), style: 'cancel' },
            { text: t('liveRound.abandon'), style: 'destructive', onPress: () => router.back() },
          ])}>
            <Ionicons name="close" size={22} color={c.inkSecondary} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-ink-primary font-bold" numberOfLines={1}>{selectedCourse?.name}</Text>
            <Text className="text-ink-muted text-xs">{selectedCourse?.location}</Text>
          </View>
          <TouchableOpacity
            className="px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: '#FF653520', borderWidth: 1, borderColor: '#FF6535' }}
            onPress={confirmFinish}
          >
            <Text className="text-neon-green text-xs font-bold">{t('liveRound.done')}</Text>
          </TouchableOpacity>
        </View>

        {/* Running Stats */}
        <View className="flex-row gap-3">
          {[
            { label: t('liveRound.gross'), value: String(grossTotal), sub: scoreDiff(grossTotal - parTotal), subColor: scoreColor(grossTotal - parTotal) },
            courseHandicap != null
              ? { label: t('liveRound.net'), value: String(netTotal), sub: `HCP ${courseHandicap}`, subColor: c.inkMuted }
              : null,
            { label: t('liveRound.stableford'), value: String(totalStableford), sub: t('liveRound.points'), subColor: c.inkMuted },
            { label: t('liveRound.putts'), value: String(totalPutts), sub: t('liveRound.total'), subColor: c.inkMuted },
          ].filter(Boolean).map((s) => s && (
            <View key={s.label} className="flex-1 bg-bg-card rounded-lg px-2 py-1.5 items-center">
              <Text style={{ fontSize: 9, color: c.inkMuted, fontWeight: '700', letterSpacing: 0.8 }}>{s.label}</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.inkPrimary }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: s.subColor }}>{s.sub}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Vertical Scorecard */}
      <ScrollView
        style={{ maxHeight: 210, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* Header row */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
          <Text style={{ width: 28, fontSize: 9, fontWeight: '700', color: c.inkMuted, letterSpacing: 0.6 }}>#</Text>
          <Text style={{ width: 36, fontSize: 9, fontWeight: '700', color: c.inkMuted, letterSpacing: 0.6 }}>PAR</Text>
          <Text style={{ width: 36, fontSize: 9, fontWeight: '700', color: c.inkMuted, letterSpacing: 0.6 }}>SI</Text>
          <Text style={{ flex: 1, fontSize: 9, fontWeight: '700', color: c.inkMuted, letterSpacing: 0.6, textAlign: 'center' }}>SCORE</Text>
          <Text style={{ width: 40, fontSize: 9, fontWeight: '700', color: c.inkMuted, letterSpacing: 0.6, textAlign: 'center' }}>±</Text>
          {courseHandicap != null && <Text style={{ width: 36, fontSize: 9, fontWeight: '700', color: c.inkMuted, letterSpacing: 0.6, textAlign: 'center' }}>SBF</Text>}
        </View>
        {/* Hole rows */}
        {scores.map((s, i) => {
          const d = s.strokes - s.par;
          const isActive = i === activeHole;
          const scoreCol = d === 0 ? c.inkPrimary : scoreColor(d);
          const extra = courseHandicap != null ? extraStrokes(courseHandicap, s.strokeIndex) : 0;
          const pts = courseHandicap != null ? stablefordPoints(s.strokes, s.par, extra) : null;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => goToHole(i)}
              style={{
                flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8,
                backgroundColor: isActive ? '#FF653312' : 'transparent',
                borderLeftWidth: 3,
                borderLeftColor: isActive ? '#FF6535' : 'transparent',
              }}
            >
              <Text style={{ width: 28, fontSize: 13, fontWeight: isActive ? '700' : '400', color: isActive ? '#FF6535' : c.inkMuted }}>{i + 1}</Text>
              <Text style={{ width: 36, fontSize: 13, color: c.inkMuted }}>{s.par}</Text>
              <Text style={{ width: 36, fontSize: 13, color: c.inkMuted }}>{s.strokeIndex}</Text>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: 'bold', color: scoreCol, textAlign: 'center' }}>{s.strokes}</Text>
              <Text style={{ width: 40, fontSize: 13, color: scoreCol, textAlign: 'center' }}>{scoreDiff(d)}</Text>
              {pts != null && (
                <Text style={{ width: 36, fontSize: 13, color: pts >= 2 ? '#FF6535' : pts === 1 ? c.inkSecondary : c.inkMuted, textAlign: 'center' }}>{pts}</Text>
              )}
            </TouchableOpacity>
          );
        })}
        {/* Total row */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.bgBorder }}>
          <Text style={{ width: 28, fontSize: 12, fontWeight: '700', color: c.inkMuted }}>∑</Text>
          <Text style={{ width: 36, fontSize: 12, fontWeight: '700', color: c.inkMuted }}>{parTotal}</Text>
          <Text style={{ width: 36, fontSize: 12, color: c.inkMuted }}>—</Text>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '900', color: (grossTotal - parTotal) === 0 ? c.inkPrimary : scoreColor(grossTotal - parTotal), textAlign: 'center' }}>{grossTotal}</Text>
          <Text style={{ width: 40, fontSize: 13, fontWeight: '700', color: (grossTotal - parTotal) === 0 ? c.inkPrimary : scoreColor(grossTotal - parTotal), textAlign: 'center' }}>{scoreDiff(grossTotal - parTotal)}</Text>
          {courseHandicap != null && <Text style={{ width: 36, fontSize: 13, fontWeight: '700', color: '#FF6535', textAlign: 'center' }}>{totalStableford}</Text>}
        </View>
      </ScrollView>

      {/* Active Hole Entry */}
      <View className="flex-1 px-4" style={{ justifyContent: 'space-between', paddingTop: 12, paddingBottom: bottom > 0 ? bottom : 16 }}>
        {/* Hole Info */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-ink-secondary text-xs font-bold uppercase tracking-widest">
              {t('liveRound.hole')} {cur.holeNumber} · SI {cur.strokeIndex}
            </Text>
            <Text className="text-ink-primary font-bold text-xl">Par {cur.par}</Text>
            <Text className="text-ink-muted text-xs">{cur.distanceMeters} m</Text>
          </View>
          <View className="items-center gap-1">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{ backgroundColor: (curDiff === 0 ? c.bgBorder : scoreColor(curDiff)) + '30', borderWidth: 1, borderColor: (curDiff === 0 ? c.bgBorder : scoreColor(curDiff)) + '80' }}
            >
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: curDiff === 0 ? c.inkPrimary : scoreColor(curDiff) }}>{cur.strokes}</Text>
            </View>
            {courseHandicap != null && (
              <Text className="text-xs font-bold" style={{ color: '#FF6535' }}>
                {curExtra > 0 ? `+${curExtra} SI` : ''} {curStableford}pt
              </Text>
            )}
          </View>
        </View>

        {/* Strokes */}
        <View>
          <Text className="text-ink-secondary text-xs font-bold uppercase tracking-widest mb-2 text-center">{t('liveRound.strokes')}</Text>
          <Stepper
            value={cur.strokes}
            onDec={() => cur.strokes > 1 && update('strokes', cur.strokes - 1)}
            onInc={() => update('strokes', cur.strokes + 1)}
            color={curDiff === 0 ? c.inkPrimary : scoreColor(curDiff)}
            size="lg"
          />
        </View>

        {/* Putts */}
        <View>
          <Text className="text-ink-secondary text-xs font-bold uppercase tracking-widest mb-2 text-center">{t('liveRound.putts')}</Text>
          <Stepper
            value={cur.putts}
            onDec={() => cur.putts > 0 && update('putts', cur.putts - 1)}
            onInc={() => update('putts', cur.putts + 1)}
            size="md"
          />
        </View>

        {/* FIR / GIR */}
        <View className="gap-2">
          {cur.par !== 3 && (
            <View>
              <Text className="text-ink-secondary text-xs font-bold uppercase tracking-widest mb-1.5">{t('liveRound.fairwayQuestion')}</Text>
              <YesNoToggle
                value={cur.fairwayHit}
                onTrue={() => update('fairwayHit', true)}
                onFalse={() => update('fairwayHit', false)}
              />
            </View>
          )}
          <View>
            <Text className="text-ink-secondary text-xs font-bold uppercase tracking-widest mb-1.5">{t('liveRound.girQuestion')}</Text>
            <YesNoToggle
              value={cur.greenInRegulation}
              onTrue={() => update('greenInRegulation', true)}
              onFalse={() => update('greenInRegulation', false)}
            />
          </View>
        </View>

        {/* Penalties + Navigation */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between px-2">
            <Text className="text-ink-secondary text-xs font-bold uppercase tracking-widest">{t('liveRound.penalties')}</Text>
            <Stepper
              value={cur.penalties}
              onDec={() => cur.penalties > 0 && update('penalties', cur.penalties - 1)}
              onInc={() => update('penalties', cur.penalties + 1)}
              size="sm"
            />
          </View>
          <View className="flex-row gap-3">
            {activeHole > 0 && (
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center border border-bg-border"
                onPress={() => goToHole(activeHole - 1)}
              >
                <Text className="text-ink-secondary font-semibold text-sm">{t('liveRound.prevHole', { n: activeHole })}</Text>
              </TouchableOpacity>
            )}
            {activeHole < scores.length - 1 ? (
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: '#FF6535' }}
                onPress={() => goToHole(activeHole + 1)}
              >
                <Text style={{ color: '#0A0A0A', fontWeight: 'bold', fontSize: 14 }}>
                  {t('liveRound.nextHole', { n: activeHole + 2 })}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: '#FF6535' }}
                onPress={confirmFinish}
                disabled={saving}
              >
                <Text style={{ color: '#0A0A0A', fontWeight: 'bold', fontSize: 14 }}>
                  {saving ? t('liveRound.saving') : t('liveRound.finishRound')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
