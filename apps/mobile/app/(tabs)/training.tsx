import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTrainingStore } from '../../src/store/trainingStore';
import { useTheme } from '../../src/lib/theme';
import { TrainingPlan, TrainingDay, UserTrainingPlan } from '@fairwayiq/shared';
import { AssessmentModal } from '../../src/components/AssessmentModal';
import { SessionFeedbackModal, FeedbackResult } from '../../src/components/SessionFeedbackModal';
import { DrillTracker } from '../../src/components/DrillTracker';
import { api } from '../../src/lib/api';

const categoryColors: Record<string, string> = {
  PUTTING: '#6ee7b7',
  SHORT_GAME: '#FF6535',
  IRON_PLAY: '#60a5fa',
  DRIVING: '#f59e0b',
  COURSE_MANAGEMENT: '#a78bfa',
  MENTAL_GAME: '#f472b6',
};

const difficultyColors: Record<string, string> = {
  EASY: '#FF6535',
  MEDIUM: '#f59e0b',
  HARD: '#f97316',
};

interface LibraryDrill {
  id: string;
  name: string;
  description: string;
  duration: number;
  category: string;
  difficulty: string;
  tips: string[];
  canDoAtHome: boolean;
}

function LibraryDrillCard({ drill }: { drill: LibraryDrill }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const catColor = categoryColors[drill.category] ?? '#8A8A8A';
  const diffColor = difficultyColors[drill.difficulty] ?? '#8A8A8A';
  const c = useTheme();

  return (
    <View className="bg-bg-card rounded-2xl mb-3 overflow-hidden">
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.8}>
        <View className="p-4">
          <View className="flex-row items-start justify-between gap-2 mb-2">
            <Text className="text-ink-primary font-bold text-sm flex-1 leading-5">{drill.name}</Text>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={c.inkMuted} />
          </View>
          <View className="flex-row gap-2 flex-wrap">
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: catColor + '20' }}>
              <Text className="text-xs font-semibold" style={{ color: catColor }}>{t(`training.category.${drill.category}`)}</Text>
            </View>
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: diffColor + '20' }}>
              <Text className="text-xs font-semibold" style={{ color: diffColor }}>{t(`training.difficulty.${drill.difficulty}`)}</Text>
            </View>
            <View className="px-2 py-0.5 rounded-full bg-bg-elevated">
              <Text className="text-ink-muted text-xs">{drill.duration} {t('training.library.min')}</Text>
            </View>
            {drill.canDoAtHome && (
              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FF653520' }}>
                <Text className="text-xs font-semibold" style={{ color: '#FF6535' }}>{t('training.library.atHome')}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View className="px-4 pb-4 border-t border-bg-border">
          <Text className="text-ink-secondary text-sm leading-6 mt-3">{drill.description}</Text>

          {drill.tips.length > 0 && (
            <View className="mt-4 gap-2">
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">{t('training.library.tips')}</Text>
              {drill.tips.map((tip, i) => (
                <View key={i} className="flex-row items-start gap-2">
                  <Text style={{ color: catColor }} className="text-xs mt-0.5">▸</Text>
                  <Text className="text-ink-secondary text-xs flex-1 leading-5">{tip}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            className="mt-4 flex-row items-center gap-2 py-2.5 px-3 rounded-xl border"
            style={{
              borderColor: showTracker ? '#FF6535' : c.bgBorder,
              backgroundColor: showTracker ? c.neonGreen12 : c.bgCard,
            }}
            onPress={() => setShowTracker((v) => !v)}
          >
            <Ionicons name="stats-chart-outline" size={14} color={showTracker ? '#FF6535' : c.inkMuted} />
            <Text className="text-xs font-semibold" style={{ color: showTracker ? '#FF6535' : c.inkSecondary }}>
              {showTracker ? t('training.library.hideHits') : t('training.library.trackHits')}
            </Text>
          </TouchableOpacity>

          {showTracker && <DrillTracker drillId={drill.id} />}
        </View>
      )}
    </View>
  );
}

const ALL_CATEGORIES = ['PUTTING', 'SHORT_GAME', 'IRON_PLAY', 'DRIVING', 'COURSE_MANAGEMENT', 'MENTAL_GAME'];
const ALL_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

function LibraryTab() {
  const { t } = useTranslation();
  const c = useTheme();
  const [drills, setDrills] = useState<LibraryDrill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);
  const [homeOnly, setHomeOnly] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDrills = useCallback(async (q: string, cat: string | null, diff: string | null, home: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.append('search', q.trim());
      if (cat) params.append('category', cat);
      if (diff) params.append('difficulty', diff);
      if (home) params.append('home', 'true');
      const { data } = await api.get<LibraryDrill[]>(`/training/library?${params.toString()}`);
      setDrills(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDrills(search, activeCategory, activeDifficulty, homeOnly);
  }, [activeCategory, activeDifficulty, homeOnly]);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDrills(text, activeCategory, activeDifficulty, homeOnly);
    }, 350);
  };

  const grouped = drills.reduce<Record<string, LibraryDrill[]>>((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {});

  return (
    <View className="flex-1">
      {/* Search Bar */}
      <View className="mx-5 mb-2 flex-row items-center bg-bg-elevated border border-bg-border rounded-xl px-3 gap-2">
        <Ionicons name="search-outline" size={16} color={c.inkMuted} />
        <TextInput
          className="flex-1 py-3 text-ink-primary text-sm"
          placeholder={t('training.library.searchPlaceholder')}
          placeholderTextColor={c.inkMuted}
          value={search}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); fetchDrills('', activeCategory, activeDifficulty, homeOnly); }}>
            <Ionicons name="close-circle" size={16} color={c.inkMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category + Home Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, height: 34, marginBottom: 6 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}>
        {ALL_CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          const color = categoryColors[cat];
          return (
            <TouchableOpacity
              key={cat}
              className="px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: active ? color : color + '15',
                borderWidth: 1,
                borderColor: active ? color : color + '40',
              }}
              onPress={() => setActiveCategory(active ? null : cat)}
            >
              <Text className="text-xs font-semibold" style={{ color: active ? '#0A0A0A' : color }}>
                {t(`training.category.${cat}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          className="px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: homeOnly ? '#FF6535' : '#FF653515',
            borderWidth: 1,
            borderColor: homeOnly ? '#FF6535' : '#FF653540',
          }}
          onPress={() => setHomeOnly((v) => !v)}
        >
          <Text className="text-xs font-semibold" style={{ color: homeOnly ? '#0A0A0A' : '#FF6535' }}>
            {t('training.library.atHome')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Difficulty Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, height: 34, marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}>
        {ALL_DIFFICULTIES.map((diff) => {
          const active = activeDifficulty === diff;
          const color = difficultyColors[diff];
          return (
            <TouchableOpacity
              key={diff}
              className="px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: active ? color + '30' : c.bgElevated,
                borderWidth: 1,
                borderColor: active ? color : c.bgBorder,
              }}
              onPress={() => setActiveDifficulty(active ? null : diff)}
            >
              <Text className="text-xs font-semibold" style={{ color: active ? color : c.inkMuted }}>
                {t(`training.difficulty.${diff}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color="#FF6535" className="mt-8" />
        ) : drills.length === 0 ? (
          <View className="items-center py-16 gap-3">
            <Ionicons name="search-outline" size={48} color={c.inkMuted} />
            <Text className="text-ink-secondary font-semibold">{t('training.library.noResults')}</Text>
            <Text className="text-ink-muted text-sm text-center">{t('training.library.noResultsSub')}</Text>
          </View>
        ) : activeCategory || search ? (
          <>
            <Text className="text-ink-muted text-xs mb-3">{drills.length}</Text>
            {drills.map((d) => <LibraryDrillCard key={d.id} drill={d} />)}
          </>
        ) : (
          Object.entries(grouped).map(([cat, catDrills]) => (
            <View key={cat} className="mb-2">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[cat] }} />
                <Text className="text-ink-secondary text-xs font-bold uppercase tracking-widest">
                  {t(`training.category.${cat}`)}
                </Text>
                <Text className="text-ink-muted text-xs">({catDrills.length})</Text>
              </View>
              {catDrills.map((d) => <LibraryDrillCard key={d.id} drill={d} />)}
            </View>
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}

function PlanCard({ plan, isActive, onStart }: { plan: TrainingPlan; isActive: boolean; onStart: () => void }) {
  const { t } = useTranslation();
  const levelColors: Record<string, string> = {
    BEGINNER: '#FF6535', INTERMEDIATE: '#f59e0b', ADVANCED: '#f97316', PRO: '#a855f7',
  };
  const color = levelColors[plan.targetLevel] ?? '#FF6535';
  return (
    <View className="bg-bg-card rounded-2xl overflow-hidden mb-3">
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <Text className="text-ink-primary font-bold text-base flex-1 mr-3">{plan.name}</Text>
          <View className="px-2 py-0.5 rounded" style={{ backgroundColor: color + '20', borderWidth: 1, borderColor: color + '60' }}>
            <Text className="text-xs font-bold" style={{ color }}>{t(`training.level.${plan.targetLevel}`)}</Text>
          </View>
        </View>
        <Text className="text-ink-secondary text-sm leading-5">{plan.description}</Text>
        <View className="flex-row gap-4 mt-3">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="calendar-outline" size={12} color="#8A8A8A" />
            <Text className="text-ink-secondary text-xs">{plan.durationWeeks} {t('training.weeks')}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="layers-outline" size={12} color="#8A8A8A" />
            <Text className="text-ink-secondary text-xs">{plan.days.length} {t('training.trainingDays')}</Text>
          </View>
        </View>
      </View>

      {isActive ? (
        <View className="px-4 py-3 border-t border-bg-border flex-row items-center gap-2" style={{ backgroundColor: '#FF653510' }}>
          <View className="w-1.5 h-1.5 rounded-full bg-neon-green" />
          <Text className="text-neon-green text-xs font-bold tracking-wider">{t('training.activePlanLabel')}</Text>
        </View>
      ) : (
        <TouchableOpacity className="px-4 py-3 border-t border-bg-border" onPress={onStart}>
          <Text className="text-neon-green text-sm font-semibold">{t('training.planStart')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ActivePlanView({ activePlan }: { activePlan: UserTrainingPlan & { plan: TrainingPlan & { days: (TrainingDay & { drills: any[] })[] } } }) {
  const { t } = useTranslation();
  const { completeDay } = useTrainingStore();
  const c = useTheme();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const progress = activePlan.completedDays.length / activePlan.plan.days.length;
  const currentDay = activePlan.plan.days.find((d) => d.dayNumber === activePlan.currentDay);

  const handleSubmitFeedback = async (feedback: FeedbackResult) => {
    return completeDay(activePlan.currentDay, feedback);
  };

  return (
    <View className="gap-4">
      {/* Plan Header */}
      <View className="bg-bg-card rounded-2xl p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-ink-secondary text-xs font-bold uppercase tracking-widest">{t('training.activePlan')}</Text>
            <Text className="text-ink-primary font-bold text-base mt-0.5">{activePlan.plan.name}</Text>
          </View>
          <Text className="text-neon-green text-3xl font-black">{Math.round(progress * 100)}%</Text>
        </View>
        <View className="bg-bg-elevated rounded-full h-1 overflow-hidden mb-1">
          <View className="bg-neon-green h-1 rounded-full" style={{ width: `${progress * 100}%` }} />
        </View>
        <Text className="text-ink-muted text-xs mt-1">
          {activePlan.completedDays.length} / {activePlan.plan.days.length} {t('training.days')}
        </Text>
      </View>

      {/* Heutiger Tag */}
      {currentDay && (
        <View className="bg-bg-card border border-neon-green rounded-xl overflow-hidden" style={{ borderWidth: 1 }}>
          <View className="px-4 py-3 border-b border-bg-border flex-row items-center justify-between">
            <View>
              <Text className="text-neon-green text-xs font-bold uppercase tracking-widest">{t('feedback.day')} {currentDay.dayNumber}</Text>
              <Text className="text-ink-primary font-bold text-base">{currentDay.title}</Text>
            </View>
            <View className="items-end">
              <Text className="text-ink-secondary text-xs">{t(`training.category.${currentDay.focus}`)}</Text>
              <Text className="text-ink-secondary text-xs">{currentDay.totalMinutes} {t('training.library.min')}</Text>
            </View>
          </View>

          {currentDay.drills.map((dd: any) => {
            const ddKey = dd.drillId ?? dd.drill?.id ?? String(dd.order);
            return (
            <TouchableOpacity
              key={ddKey}
              className="border-b border-bg-border"
              onPress={() => setExpanded(expanded === ddKey ? null : ddKey)}
            >
              <View className="flex-row items-center justify-between px-4 py-3">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-7 h-7 rounded-lg bg-bg-elevated items-center justify-center">
                    <Ionicons name="barbell-outline" size={14} color="#FF6535" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink-primary text-sm font-medium">{dd.drill?.name ?? '—'}</Text>
                    <Text className="text-ink-muted text-xs">{dd.drill?.duration} {t('training.library.min')}</Text>
                  </View>
                </View>
                <Ionicons name={expanded === ddKey ? 'chevron-up' : 'chevron-down'} size={14} color={c.inkMuted} />
              </View>

              {expanded === ddKey && dd.drill && (
                <View className="px-4 pb-4 bg-bg-elevated">
                  <Text className="text-ink-secondary text-sm leading-5">{dd.drill.description}</Text>
                  {dd.drill.tips?.length > 0 && (
                    <View className="mt-3 gap-1.5">
                      {dd.drill.tips.map((tip: string, i: number) => (
                        <View key={i} className="flex-row items-start gap-2">
                          <Text className="text-neon-green text-xs mt-0.5">▸</Text>
                          <Text className="text-ink-secondary text-xs flex-1 leading-4">{tip}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <DrillTracker
                    drillId={dd.drill.id}
                    userPlanId={activePlan.id}
                    dayNumber={currentDay?.dayNumber}
                  />
                </View>
              )}
            </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            className="mx-4 my-4 rounded-xl py-3.5 items-center"
            style={{ backgroundColor: '#FF6535' }}
            onPress={() => setShowFeedback(true)}
          >
            <Text className="text-bg-base font-bold tracking-wide">{t('training.trainingDone')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {showFeedback && currentDay && (
        <SessionFeedbackModal
          dayTitle={currentDay.title}
          dayNumber={currentDay.dayNumber}
          totalMinutes={currentDay.totalMinutes}
          onSubmit={handleSubmitFeedback}
          onClose={() => setShowFeedback(false)}
        />
      )}

      {/* Plan Übersicht */}
      <Text className="text-ink-secondary text-xs font-bold uppercase tracking-widest">{t('training.overview')}</Text>
      {activePlan.plan.days.map((day: TrainingDay) => {
        const done = activePlan.completedDays.includes(day.dayNumber);
        const isCurrent = day.dayNumber === activePlan.currentDay;
        return (
          <View
            key={day.id}
            className="flex-row items-center gap-3 py-3 px-3 rounded-xl"
            style={{
              backgroundColor: done ? c.neonGreen12 : isCurrent ? c.bgCard : c.bgSurface,
              borderWidth: 1,
              borderColor: isCurrent ? '#FF653540' : c.bgBorder,
              marginBottom: 4,
            }}
          >
            <View
              className="w-7 h-7 rounded-full items-center justify-center"
              style={{ backgroundColor: done ? '#FF6535' : isCurrent ? c.neonGreen20 : c.bgElevated }}
            >
              {done
                ? <Ionicons name="checkmark" size={14} color="#0A0A0A" />
                : <Text className="text-xs font-bold" style={{ color: isCurrent ? '#FF6535' : c.inkMuted }}>{day.dayNumber}</Text>
              }
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium" style={{ color: done || isCurrent ? c.inkPrimary : c.inkMuted }}>{day.title}</Text>
              <Text className="text-xs" style={{ color: c.inkMuted }}>{t(`training.category.${day.focus}`)} · {day.totalMinutes} {t('training.library.min')}</Text>
            </View>
            {isCurrent && <View className="w-1.5 h-1.5 rounded-full bg-neon-green" />}
          </View>
        );
      })}
    </View>
  );
}

// ── Plan Schedule Modal ───────────────────────────────────────────────────────

const WEEKDAY_LABELS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

function PlanScheduleModal({ visible, planId, userPlanId, hasActivePlan, onClose, onStarted, startPlan }: {
  visible: boolean;
  planId: string;
  userPlanId?: string;
  hasActivePlan: boolean;
  onClose: () => void;
  onStarted: () => void;
  startPlan: (planId: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const c = useTheme();

  const [weekdays, setWeekdays] = useState<number[]>([0, 2, 4]); // Mon, Wed, Fri
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    if (visible) {
      setWeekdays([0, 2, 4]);
      const d = new Date(); d.setHours(0, 0, 0, 0);
      setStartDate(d);
    }
  }, [visible]);

  const toggleDay = (i: number) => {
    setWeekdays((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort((a, b) => a - b),
    );
  };

  const handleConfirm = async () => {
    if (weekdays.length === 0) return;
    setScheduling(true);
    try {
      let planUserId = userPlanId;
      if (!planUserId) {
        // Preset plan: start it first, then get the new userPlan id
        await startPlan(planId);
        planUserId = useTrainingStore.getState().activePlan?.id;
      }

      if (planUserId) {
        await api.post('/calendar/schedule-plan', {
          userPlanId: planUserId,
          startDate: startDate.toISOString(),
          weekdays,
        });
      }

      onStarted();
      onClose();
    } catch {
      Alert.alert(t('common.error'));
    } finally {
      setScheduling(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.bgBase }}>
        <View className="px-5 pt-12 pb-4 flex-row items-center gap-3">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={c.inkPrimary} />
          </TouchableOpacity>
          <Text className="text-ink-primary text-lg font-bold flex-1">
            {t('training.scheduleTitle')}
          </Text>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {hasActivePlan && (
            <View
              className="rounded-xl p-3 mb-5 flex-row items-start gap-2"
              style={{ backgroundColor: '#f59e0b20', borderWidth: 1, borderColor: '#f59e0b40' }}
            >
              <Ionicons name="warning-outline" size={16} color="#f59e0b" style={{ marginTop: 1 }} />
              <Text className="text-xs flex-1 leading-4" style={{ color: '#f59e0b' }}>
                {t('training.confirmReplace')}
              </Text>
            </View>
          )}

          {/* Weekday picker */}
          <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-3">
            {t('training.scheduleWeekdays')}
          </Text>
          <View className="flex-row gap-2 mb-6 flex-wrap">
            {WEEKDAY_LABELS_DE.map((label, i) => {
              const active = weekdays.includes(i);
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => toggleDay(i)}
                  className="w-11 h-11 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: active ? '#FF6535' : c.bgCard,
                    borderWidth: 1,
                    borderColor: active ? '#FF6535' : c.bgBorder,
                  }}
                >
                  <Text
                    className="text-sm font-bold"
                    style={{ color: active ? '#fff' : c.inkSecondary }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Start date */}
          <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-2">
            {t('training.scheduleStartDate')}
          </Text>
          <View className="bg-bg-card rounded-xl flex-row items-center justify-between px-4 py-3 mb-8">
            <TouchableOpacity onPress={() => setStartDate((d) => addDays(d, -1))}>
              <Ionicons name="chevron-back" size={20} color={c.inkMuted} />
            </TouchableOpacity>
            <Text className="text-ink-primary font-semibold text-sm">
              {startDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <TouchableOpacity onPress={() => setStartDate((d) => addDays(d, 1))}>
              <Ionicons name="chevron-forward" size={20} color={c.inkMuted} />
            </TouchableOpacity>
          </View>

          {weekdays.length > 0 && (
            <View className="bg-bg-card rounded-xl p-4 mb-6">
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-1">
                {t('training.scheduleInfo')}
              </Text>
              <Text className="text-ink-secondary text-sm leading-5">
                {WEEKDAY_LABELS_DE.filter((_, i) => weekdays.includes(i)).join(', ')} ·{' '}
                {weekdays.length}× pro Woche
              </Text>
            </View>
          )}
        </ScrollView>

        <View className="px-5 pb-10 pt-3">
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={scheduling || weekdays.length === 0}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: weekdays.length > 0 ? '#FF6535' : c.bgBorder }}
          >
            {scheduling
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-black tracking-wider text-base">
                  {t('training.startPlan').toUpperCase()}
                </Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function TrainingScreen() {
  const { t } = useTranslation();
  const c = useTheme();
  const { plans, activePlan, fetchPlans, fetchActivePlan, startPlan } = useTrainingStore();
  const [tab, setTab] = useState<'active' | 'plans' | 'library'>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [streak, setStreak] = useState(0);
  const [scheduleModal, setScheduleModal] = useState<{ planId: string; userPlanId?: string } | null>(null);

  const loadData = async () => {
    await Promise.all([fetchPlans(), fetchActivePlan()]);
    try {
      const { data } = await api.get<{ streak: { currentStreak: number } }>('/gamification/status');
      setStreak(data.streak.currentStreak);
    } catch {}
  };
  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleStart = (planId: string) => {
    setScheduleModal({ planId });
  };

  const tabLabels: Record<string, string> = {
    active: t('training.tabActive'),
    plans: t('training.tabPlans'),
    library: t('training.tabLibrary'),
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <View className="px-5 pt-6 pb-4">
        <View className="flex-row items-start justify-between mb-5">
          <View>
            <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-1">{t('training.sectionLabel')}</Text>
            <Text className="text-ink-primary text-3xl font-black">{t('training.title')}</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="w-9 h-9 rounded-2xl items-center justify-center"
              style={{ backgroundColor: c.bgElevated }}
              onPress={() => router.push('/calendar' as any)}
            >
              <Ionicons name="calendar-outline" size={18} color={c.inkSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ backgroundColor: streak > 0 ? '#f9730320' : c.bgElevated }}
              onPress={() => router.push('/challenges' as any)}
            >
              <Ionicons name={streak > 0 ? 'flame-outline' : 'golf-outline'} size={16} color={streak > 0 ? '#f97316' : c.inkMuted} />
              <Text className="font-black text-sm" style={{ color: streak > 0 ? '#f97316' : c.inkMuted }}>
                {streak > 0 ? `${streak}` : '0'}
              </Text>
              <Ionicons name="trophy-outline" size={14} color={streak > 0 ? '#f97316' : c.inkMuted} />
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-row bg-bg-elevated rounded-2xl p-1">
          {(['active', 'plans', 'library'] as const).map((t_key) => (
            <TouchableOpacity
              key={t_key}
              className="flex-1 py-2.5 rounded-xl items-center"
              style={{ backgroundColor: tab === t_key ? '#FF653520' : 'transparent' }}
              onPress={() => setTab(t_key)}
            >
              <Text
                className="text-xs font-black tracking-wider"
                style={{ color: tab === t_key ? '#FF6535' : c.inkMuted }}
              >
                {tabLabels[t_key]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === 'library' ? (
        <LibraryTab />
      ) : tab === 'active' ? (
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6535" />}
        >
          {activePlan ? (
            <ActivePlanView activePlan={activePlan} />
          ) : (
            <View className="gap-4 py-8">
              <TouchableOpacity
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: '#FF6535' }}
                onPress={() => setShowAssessment(true)}
              >
                <View className="p-5">
                  <View className="flex-row items-center gap-3 mb-2">
                    <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: '#0A0A0A30' }}>
                      <Ionicons name="analytics-outline" size={20} color="#0A0A0A" />
                    </View>
                    <Text className="text-bg-base font-bold text-base">{t('training.createPlanCard')}</Text>
                  </View>
                  <Text className="text-bg-base text-sm leading-5" style={{ opacity: 0.75 }}>
                    {t('training.createPlanDesc')}
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-3">
                    <Ionicons name="time-outline" size={13} color="#0A0A0A" style={{ opacity: 0.6 }} />
                    <Text className="text-bg-base text-xs" style={{ opacity: 0.6 }}>{t('training.createPlanTime')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <View className="flex-row items-center gap-3">
                <View className="flex-1 h-px bg-bg-border" />
                <Text className="text-ink-muted text-xs uppercase tracking-widest">{t('common.or')}</Text>
                <View className="flex-1 h-px bg-bg-border" />
              </View>
              <TouchableOpacity
                className="py-3 rounded-2xl bg-bg-card items-center"
                onPress={() => setTab('plans')}
              >
                <Text className="text-ink-secondary text-sm font-semibold">{t('training.choosePreset')}</Text>
              </TouchableOpacity>
            </View>
          )}
          <View className="h-8" />
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6535" />}
        >
          <TouchableOpacity
            className="rounded-xl mb-4 border overflow-hidden"
            style={{ borderColor: '#FF653540', backgroundColor: '#FF653508' }}
            onPress={() => setShowAssessment(true)}
          >
            <View className="p-4 flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: '#FF653520' }}>
                <Ionicons name="analytics-outline" size={18} color="#FF6535" />
              </View>
              <View className="flex-1">
                <Text className="text-ink-primary font-bold text-sm">{t('training.createPersonalPlan')}</Text>
                <Text className="text-ink-muted text-xs mt-0.5">{t('training.createPersonalPlanSub')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#FF6535" />
            </View>
          </TouchableOpacity>
          <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-3">{t('training.presetPlans')}</Text>
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} isActive={activePlan?.plan.id === plan.id} onStart={() => handleStart(plan.id)} />
          ))}
          <View className="h-8" />
        </ScrollView>
      )}

      {showAssessment && (
        <AssessmentModal
          onClose={() => setShowAssessment(false)}
          onDone={async (userPlanId) => {
            setShowAssessment(false);
            await loadData();
            setTab('active');
            if (userPlanId) {
              const plan = useTrainingStore.getState().activePlan;
              setScheduleModal({ planId: plan?.plan.id ?? '', userPlanId });
            }
          }}
        />
      )}

      {scheduleModal && (
        <PlanScheduleModal
          visible={!!scheduleModal}
          planId={scheduleModal.planId}
          userPlanId={scheduleModal.userPlanId ?? (activePlan?.plan.id === scheduleModal.planId ? activePlan?.id : undefined)}
          hasActivePlan={!!activePlan && activePlan.plan.id !== scheduleModal.planId && !scheduleModal.userPlanId}
          onClose={() => setScheduleModal(null)}
          onStarted={async () => { await loadData(); setTab('active'); }}
          startPlan={startPlan}
        />
      )}
    </SafeAreaView>
  );
}
