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

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(diff: number) {
  if (diff <= -2) return '#a855f7';
  if (diff === -1) return '#FF6535';
  if (diff === 0)  return '#6ee7b7';
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

// ── Mini Stepper ───────────────────────────────────────────────────────────────

function MiniStepper({ value, onDec, onInc, min = 0 }: {
  value: number; onDec: () => void; onInc: () => void; min?: number;
}) {
  const c = useTheme();
  return (
    <View className="flex-row items-center gap-2">
      <TouchableOpacity
        onPress={onDec}
        disabled={value <= min}
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: c.bgElevated, opacity: value <= min ? 0.4 : 1 }}
      >
        <Ionicons name="remove" size={16} color={c.inkSecondary} />
      </TouchableOpacity>
      <Text className="font-bold text-xl text-ink-primary" style={{ minWidth: 24, textAlign: 'center' }}>
        {value}
      </Text>
      <TouchableOpacity
        onPress={onInc}
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: c.bgElevated }}
      >
        <Ionicons name="add" size={16} color={c.inkSecondary} />
      </TouchableOpacity>
    </View>
  );
}

// ── Bool Toggle ────────────────────────────────────────────────────────────────

function BoolToggle({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  const c = useTheme();
  return (
    <View className="flex-row gap-1.5">
      {([true, false] as const).map((v) => {
        const active = value === v;
        const color = v ? '#00e87a' : '#ef4444';
        return (
          <TouchableOpacity
            key={String(v)}
            onPress={() => onChange(v)}
            className="w-10 h-8 rounded-lg items-center justify-center"
            style={{
              backgroundColor: active ? color + '25' : c.bgElevated,
              borderWidth: 1,
              borderColor: active ? color : 'transparent',
            }}
          >
            <Ionicons
              name={v ? 'checkmark' : 'close'}
              size={16}
              color={active ? color : c.inkMuted}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Round Summary Modal ────────────────────────────────────────────────────────

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
          <Text style={{ fontSize: 12, color: c.inkMuted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>
            {courseName}
          </Text>
          <Text style={{ fontSize: 72, fontWeight: '900', color: data.scoreToPar === 0 ? c.inkPrimary : scoreColor(data.scoreToPar), textAlign: 'center', lineHeight: 80 }}>
            {scoreDiff(data.scoreToPar)}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: c.inkSecondary, textAlign: 'center', marginBottom: 28 }}>
            {data.gross} {t('liveRound.summary.gross')}
          </Text>

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

// ── Hole Tab ───────────────────────────────────────────────────────────────────

function HoleTab({ num, par, strokes, isActive, onPress }: {
  num: number; par: number; strokes: number; isActive: boolean; onPress: () => void;
}) {
  const c = useTheme();
  const diff = strokes - par;
  const dotColor = scoreColor(diff);
  const isDefault = strokes === par; // not yet changed from default

  return (
    <TouchableOpacity
      onPress={onPress}
      className="items-center py-2 px-1"
      style={{ minWidth: 36 }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: isActive ? '800' : '500',
          color: isActive ? '#FF6535' : c.inkSecondary,
        }}
      >
        {num}
      </Text>
      {/* Score dot */}
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          marginTop: 3,
          backgroundColor: isDefault ? c.bgBorder : dotColor,
          opacity: isActive ? 1 : 0.7,
        }}
      />
      {/* Active underline */}
      {isActive && (
        <View
          style={{ position: 'absolute', bottom: 0, left: 4, right: 4, height: 2, backgroundColor: '#FF6535', borderRadius: 1 }}
        />
      )}
    </TouchableOpacity>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

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
      strokeIndex: h.strokeIndex ?? h.number,
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
    if (idx < 0 || idx >= scores.length) return;
    setActiveHole(idx);
    holeTabsRef.current?.scrollTo({ x: Math.max(0, (idx - 3) * 38), animated: true });
  };

  const grossTotal = scores.reduce((s, h) => s + h.strokes, 0);
  const parTotal   = scores.reduce((s, h) => s + h.par, 0);
  const totalPutts = scores.reduce((s, h) => s + h.putts, 0);
  const totalStableford = scores.reduce((s, h) => {
    const extra = courseHandicap != null ? extraStrokes(courseHandicap, h.strokeIndex) : 0;
    return s + stablefordPoints(h.strokes, h.par, extra);
  }, 0);
  const netTotal = grossTotal - (courseHandicap ?? 0);

  const cur = scores[activeHole];
  const curDiff     = cur ? cur.strokes - cur.par : 0;
  const curExtra    = (courseHandicap != null && cur) ? extraStrokes(courseHandicap, cur.strokeIndex) : 0;
  const curSbf      = cur ? stablefordPoints(cur.strokes, cur.par, curExtra) : 0;
  const scoreDiffTotal = grossTotal - parTotal;

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

      const firHoles = scores.filter((s) => s.par !== 3).length;
      const fir      = scores.filter((s) => s.par !== 3 && s.fairwayHit === true).length;
      const gir      = scores.filter((s) => s.greenInRegulation).length;
      const putts    = scores.reduce((acc, s) => acc + s.putts, 0);
      const gross    = scores.reduce((acc, s) => acc + s.strokes, 0);
      const par      = scores.reduce((acc, s) => acc + s.par, 0);
      const stableford = scores.reduce((acc, s) => {
        const extra = courseHandicap != null ? extraStrokes(courseHandicap, s.strokeIndex) : 0;
        return acc + stablefordPoints(s.strokes, s.par, extra);
      }, 0);

      const countDiff = (min: number, max: number) =>
        scores.filter((s) => s.strokes - s.par >= min && s.strokes - s.par <= max).length;

      const breakdown = [
        { label: t('liveRound.summary.eagle'),  count: scores.filter((s) => s.strokes - s.par <= -2).length, color: '#a855f7' },
        { label: t('liveRound.summary.birdie'), count: countDiff(-1, -1), color: '#FF6535' },
        { label: t('liveRound.summary.par'),    count: countDiff(0, 0),   color: '#6ee7b7' },
        { label: t('liveRound.summary.bogey'),  count: countDiff(1, 1),   color: '#f59e0b' },
        { label: t('liveRound.summary.double'), count: countDiff(2, 2),   color: '#ef4444' },
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
      t('liveRound.finishMsg', { gross: grossTotal, diff: scoreDiff(scoreDiffTotal) }),
      [
        { text: t('liveRound.abandon'), style: 'cancel' },
        { text: t('common.save'), onPress: save },
      ],
    );
  };

  // ── Course Selection ─────────────────────────────────────────────────────────
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
                    {course.slope  ? ` · Slope ${course.slope}`  : ''}
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

  // ── Playing View ─────────────────────────────────────────────────────────────
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

      {/* ── Header ── */}
      <View
        className="flex-row items-center px-4 py-3 gap-3"
        style={{ borderBottomWidth: 1, borderBottomColor: c.bgBorder }}
      >
        <TouchableOpacity
          onPress={() => Alert.alert(t('liveRound.abandonTitle'), t('liveRound.abandonMsg'), [
            { text: t('liveRound.keepPlaying'), style: 'cancel' },
            { text: t('liveRound.abandon'), style: 'destructive', onPress: () => router.back() },
          ])}
        >
          <Ionicons name="close" size={22} color={c.inkSecondary} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-ink-primary font-bold text-sm" numberOfLines={1}>
            {selectedCourse?.name}
          </Text>
          <Text className="text-ink-muted text-xs">{selectedCourse?.location}</Text>
        </View>
        <TouchableOpacity
          onPress={confirmFinish}
          className="px-4 py-2 rounded-xl"
          style={{ backgroundColor: '#FF6535' }}
        >
          <Text className="font-black text-sm" style={{ color: '#0A0A0A' }}>
            {t('liveRound.done')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Hole Tabs ── */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: c.bgBorder, backgroundColor: c.bgCard }}>
        <ScrollView
          ref={holeTabsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {scores.map((s, i) => (
            <HoleTab
              key={i}
              num={s.holeNumber}
              par={s.par}
              strokes={s.strokes}
              isActive={i === activeHole}
              onPress={() => goToHole(i)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Active Hole ── */}
      <View className="flex-1 px-4" style={{ paddingBottom: bottom > 0 ? bottom : 16 }}>

        {/* Hole info strip */}
        <View className="flex-row items-center justify-between py-4">
          <View>
            <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">
              {t('liveRound.hole')} {cur.holeNumber}
            </Text>
            <View className="flex-row items-baseline gap-2 mt-0.5">
              <Text className="text-ink-primary font-black text-3xl">Par {cur.par}</Text>
              <Text className="text-ink-muted text-sm">{cur.distanceMeters} m</Text>
            </View>
            <Text className="text-ink-muted text-xs mt-0.5">
              SI {cur.strokeIndex}
              {courseHandicap != null && curExtra > 0 ? ` · +${curExtra} Vorgabe` : ''}
            </Text>
          </View>

          {/* Score badge */}
          <View className="items-center gap-1">
            <View
              className="w-20 h-20 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: curDiff === 0 ? c.bgCard : scoreColor(curDiff) + '20',
                borderWidth: 2,
                borderColor: curDiff === 0 ? c.bgBorder : scoreColor(curDiff),
              }}
            >
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: '900',
                  color: curDiff === 0 ? c.inkPrimary : scoreColor(curDiff),
                  lineHeight: 40,
                }}
              >
                {cur.strokes}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: curDiff === 0 ? c.inkMuted : scoreColor(curDiff),
                }}
              >
                {scoreDiff(curDiff)}
              </Text>
            </View>
            {courseHandicap != null && (
              <Text className="text-xs font-bold" style={{ color: '#FF6535' }}>
                {curSbf} Pt.
              </Text>
            )}
          </View>
        </View>

        {/* ── Strokes stepper ── */}
        <View
          className="rounded-2xl items-center justify-center mb-3"
          style={{ backgroundColor: c.bgCard, flex: 1 }}
        >
          <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-5">
            {t('liveRound.strokes')}
          </Text>
          <View className="flex-row items-center justify-between w-full px-8">
            <TouchableOpacity
              onPress={() => cur.strokes > 1 && update('strokes', cur.strokes - 1)}
              disabled={cur.strokes <= 1}
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: c.bgElevated, opacity: cur.strokes <= 1 ? 0.4 : 1 }}
            >
              <Ionicons name="remove" size={30} color={c.inkSecondary} />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 96,
                fontWeight: '900',
                color: curDiff === 0 ? c.inkPrimary : scoreColor(curDiff),
                lineHeight: 104,
              }}
            >
              {cur.strokes}
            </Text>

            <TouchableOpacity
              onPress={() => update('strokes', cur.strokes + 1)}
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: c.bgElevated }}
            >
              <Ionicons name="add" size={30} color={c.inkSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats grid ── */}
        <View
          className="rounded-2xl px-5 py-4 mb-3"
          style={{ backgroundColor: c.bgCard }}
        >
          <View className="flex-row">
            <View className="flex-1 items-center gap-2">
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-wider">
                {t('liveRound.putts')}
              </Text>
              <MiniStepper
                value={cur.putts}
                onDec={() => cur.putts > 0 && update('putts', cur.putts - 1)}
                onInc={() => update('putts', cur.putts + 1)}
              />
            </View>
            <View style={{ width: 1, backgroundColor: c.bgBorder, marginVertical: 4 }} />
            <View className="flex-1 items-center gap-2">
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-wider">
                {t('liveRound.penalties')}
              </Text>
              <MiniStepper
                value={cur.penalties}
                onDec={() => cur.penalties > 0 && update('penalties', cur.penalties - 1)}
                onInc={() => update('penalties', cur.penalties + 1)}
              />
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: c.bgBorder, marginVertical: 14 }} />

          <View className="flex-row">
            {cur.par !== 3 ? (
              <View className="flex-1 items-center gap-2">
                <Text className="text-ink-muted text-xs font-bold uppercase tracking-wider">
                  {t('liveRound.fairway')}
                </Text>
                <BoolToggle value={cur.fairwayHit} onChange={(v) => update('fairwayHit', v)} />
              </View>
            ) : (
              <View className="flex-1 items-center gap-2">
                <Text className="text-ink-muted text-xs font-bold uppercase tracking-wider">
                  {t('liveRound.fairway')}
                </Text>
                <Text className="text-ink-muted text-xs">Par 3</Text>
              </View>
            )}
            <View style={{ width: 1, backgroundColor: c.bgBorder, marginVertical: 4 }} />
            <View className="flex-1 items-center gap-2">
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-wider">
                {t('liveRound.gir')}
              </Text>
              <BoolToggle value={cur.greenInRegulation} onChange={(v) => update('greenInRegulation', v)} />
            </View>
          </View>
        </View>

        {/* ── Running totals ── */}
        <View
          className="rounded-2xl px-3 py-3 mb-3 flex-row"
          style={{ backgroundColor: c.bgElevated }}
        >
          {[
            { label: t('liveRound.gross'), value: String(grossTotal), sub: scoreDiff(scoreDiffTotal), subColor: scoreDiffTotal === 0 ? c.inkMuted : scoreColor(scoreDiffTotal) },
            courseHandicap != null
              ? { label: t('liveRound.net'), value: String(netTotal), sub: `HCP ${courseHandicap}`, subColor: c.inkMuted }
              : null,
            { label: t('liveRound.stableford'), value: String(totalStableford), sub: t('liveRound.points'), subColor: c.inkMuted },
            { label: t('liveRound.putts'), value: String(totalPutts), sub: t('liveRound.total'), subColor: c.inkMuted },
          ].filter(Boolean).map((s) => s && (
            <View key={s.label} className="flex-1 items-center">
              <Text style={{ fontSize: 9, color: c.inkMuted, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {s.label}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: c.inkPrimary }}>
                {s.value}
              </Text>
              <Text style={{ fontSize: 10, color: s.subColor, fontWeight: '600' }}>
                {s.sub}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Navigation ── */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => goToHole(activeHole - 1)}
            disabled={activeHole === 0}
            className="flex-1 py-4 rounded-xl items-center flex-row justify-center gap-2"
            style={{ backgroundColor: c.bgCard, opacity: activeHole === 0 ? 0.4 : 1 }}
          >
            <Ionicons name="chevron-back" size={16} color={c.inkSecondary} />
            <Text className="text-ink-secondary font-semibold text-sm">
              {activeHole > 0 ? `${t('liveRound.hole')} ${activeHole}` : '—'}
            </Text>
          </TouchableOpacity>

          {activeHole < scores.length - 1 ? (
            <TouchableOpacity
              onPress={() => goToHole(activeHole + 1)}
              className="flex-1 py-4 rounded-xl items-center flex-row justify-center gap-2"
              style={{ backgroundColor: '#FF6535' }}
            >
              <Text style={{ color: '#0A0A0A', fontWeight: '800', fontSize: 14 }}>
                {t('liveRound.hole')} {activeHole + 2}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#0A0A0A" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={confirmFinish}
              disabled={saving}
              className="flex-1 py-4 rounded-xl items-center"
              style={{ backgroundColor: '#FF6535' }}
            >
              {saving
                ? <ActivityIndicator color="#0A0A0A" />
                : <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 14 }}>{t('liveRound.finishRound')}</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
