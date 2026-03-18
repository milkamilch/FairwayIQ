import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrainingStore } from '../../src/store/trainingStore';
import { TrainingPlan, TrainingDay } from '@fairwayiq/shared';

const categoryLabels: Record<string, string> = {
  PUTTING: 'Putting',
  SHORT_GAME: 'Kurzspiel',
  IRON_PLAY: 'Eisenspiel',
  DRIVING: 'Driver',
  COURSE_MANAGEMENT: 'Platzmanagement',
  MENTAL_GAME: 'Mental',
};

const levelMeta: Record<string, { label: string; color: string }> = {
  BEGINNER:     { label: 'ANFÄNGER',      color: '#00e87a' },
  INTERMEDIATE: { label: 'FORTGESCHRITTEN', color: '#f59e0b' },
  ADVANCED:     { label: 'GEÜBT',         color: '#f97316' },
  PRO:          { label: 'PRO',           color: '#a855f7' },
};

function PlanCard({ plan, isActive, onStart }: { plan: TrainingPlan; isActive: boolean; onStart: () => void }) {
  const meta = levelMeta[plan.targetLevel];
  return (
    <View className="bg-bg-card border border-bg-border rounded-xl overflow-hidden mb-3">
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <Text className="text-ink-primary font-bold text-base flex-1 mr-3">{plan.name}</Text>
          <View className="px-2 py-0.5 rounded" style={{ backgroundColor: meta.color + '20', borderWidth: 1, borderColor: meta.color + '60' }}>
            <Text className="text-xs font-bold" style={{ color: meta.color }}>{meta.label}</Text>
          </View>
        </View>
        <Text className="text-ink-secondary text-sm leading-5">{plan.description}</Text>
        <View className="flex-row gap-4 mt-3">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="calendar-outline" size={12} color="#8888aa" />
            <Text className="text-ink-secondary text-xs">{plan.durationWeeks} Wochen</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="layers-outline" size={12} color="#8888aa" />
            <Text className="text-ink-secondary text-xs">{plan.days.length} Trainingstage</Text>
          </View>
        </View>
      </View>

      {isActive ? (
        <View className="px-4 py-3 border-t border-bg-border flex-row items-center gap-2" style={{ backgroundColor: '#00e87a10' }}>
          <View className="w-1.5 h-1.5 rounded-full bg-neon-green" />
          <Text className="text-neon-green text-xs font-bold tracking-wider">AKTIVER PLAN</Text>
        </View>
      ) : (
        <TouchableOpacity className="px-4 py-3 border-t border-bg-border" onPress={onStart}>
          <Text className="text-neon-green text-sm font-semibold">Plan starten →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ActivePlanView({ activePlan }: { activePlan: NonNullable<ReturnType<typeof useTrainingStore>['activePlan']> }) {
  const { completeDay } = useTrainingStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const progress = activePlan.completedDays.length / activePlan.plan.days.length;
  const currentDay = activePlan.plan.days.find((d) => d.dayNumber === activePlan.currentDay);

  const handleCompleteDay = () => {
    Alert.alert('Tag abschließen', `"${currentDay?.title}" abgeschlossen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Abschließen', onPress: async () => {
        try { await completeDay(activePlan.currentDay); }
        catch { Alert.alert('Fehler', 'Konnte nicht gespeichert werden'); }
      }},
    ]);
  };

  return (
    <View className="gap-4">
      {/* Plan Header */}
      <View className="bg-bg-card border border-bg-border rounded-xl p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Aktiver Plan</Text>
            <Text className="text-ink-primary font-bold text-base mt-0.5">{activePlan.plan.name}</Text>
          </View>
          <Text className="text-neon-green text-2xl font-bold">{Math.round(progress * 100)}%</Text>
        </View>
        <View className="bg-bg-elevated rounded-full h-1 overflow-hidden mb-1">
          <View className="bg-neon-green h-1 rounded-full" style={{ width: `${progress * 100}%` }} />
        </View>
        <Text className="text-ink-muted text-xs mt-1">
          {activePlan.completedDays.length} / {activePlan.plan.days.length} Tage
        </Text>
      </View>

      {/* Heutiger Tag */}
      {currentDay && (
        <View className="bg-bg-card border border-neon-green rounded-xl overflow-hidden" style={{ borderWidth: 1 }}>
          <View className="px-4 py-3 border-b border-bg-border flex-row items-center justify-between">
            <View>
              <Text className="text-neon-green text-xs font-bold uppercase tracking-widest">Tag {currentDay.dayNumber}</Text>
              <Text className="text-ink-primary font-bold text-base">{currentDay.title}</Text>
            </View>
            <View className="items-end">
              <Text className="text-ink-secondary text-xs">{categoryLabels[currentDay.focus]}</Text>
              <Text className="text-ink-secondary text-xs">{currentDay.totalMinutes} Min</Text>
            </View>
          </View>

          {currentDay.drills.map((dd: any) => (
            <TouchableOpacity
              key={dd.id}
              className="border-b border-bg-border"
              onPress={() => setExpanded(expanded === dd.id ? null : dd.id)}
            >
              <View className="flex-row items-center justify-between px-4 py-3">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-7 h-7 rounded-lg bg-bg-elevated items-center justify-center">
                    <Ionicons name="barbell-outline" size={14} color="#00e87a" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink-primary text-sm font-medium">{dd.drill?.name ?? '—'}</Text>
                    <Text className="text-ink-muted text-xs">{dd.drill?.duration} Min</Text>
                  </View>
                </View>
                <Ionicons name={expanded === dd.id ? 'chevron-up' : 'chevron-down'} size={14} color="#44445a" />
              </View>

              {expanded === dd.id && dd.drill && (
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
                </View>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity className="mx-4 my-4 rounded-xl py-3.5 items-center" style={{ backgroundColor: '#00e87a' }} onPress={handleCompleteDay}>
            <Text className="text-bg-base font-bold tracking-wide">TRAINING ABGESCHLOSSEN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Plan Übersicht */}
      <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Übersicht</Text>
      {activePlan.plan.days.map((day: TrainingDay) => {
        const done = activePlan.completedDays.includes(day.dayNumber);
        const isCurrent = day.dayNumber === activePlan.currentDay;
        return (
          <View
            key={day.id}
            className="flex-row items-center gap-3 py-3 px-3 rounded-xl"
            style={{
              backgroundColor: done ? '#00e87a10' : isCurrent ? '#14141f' : '#0f0f1a',
              borderWidth: 1,
              borderColor: isCurrent ? '#00e87a40' : '#252535',
              marginBottom: 4,
            }}
          >
            <View
              className="w-7 h-7 rounded-full items-center justify-center"
              style={{ backgroundColor: done ? '#00e87a' : isCurrent ? '#00e87a20' : '#14141f' }}
            >
              {done
                ? <Ionicons name="checkmark" size={14} color="#07070f" />
                : <Text className="text-xs font-bold" style={{ color: isCurrent ? '#00e87a' : '#44445a' }}>{day.dayNumber}</Text>
              }
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium" style={{ color: done || isCurrent ? '#f0f0ff' : '#44445a' }}>{day.title}</Text>
              <Text className="text-xs" style={{ color: '#44445a' }}>{categoryLabels[day.focus]} · {day.totalMinutes} Min</Text>
            </View>
            {isCurrent && <View className="w-1.5 h-1.5 rounded-full bg-neon-green" />}
          </View>
        );
      })}
    </View>
  );
}

export default function TrainingScreen() {
  const { plans, activePlan, fetchPlans, fetchActivePlan, startPlan } = useTrainingStore();
  const [tab, setTab] = useState<'active' | 'plans'>('active');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => { await Promise.all([fetchPlans(), fetchActivePlan()]); };
  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleStart = (planId: string) => {
    Alert.alert('Plan starten', activePlan ? 'Aktueller Plan wird beendet. Fortfahren?' : 'Diesen Plan starten?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Starten', onPress: () => startPlan(planId) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <View className="px-5 pt-4 pb-4">
        <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Training</Text>
        <Text className="text-ink-primary text-2xl font-bold mt-0.5">Trainingsplan</Text>
        <View className="flex-row mt-4 bg-bg-elevated rounded-xl p-1">
          {(['active', 'plans'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              className="flex-1 py-2.5 rounded-lg items-center"
              style={{ backgroundColor: tab === t ? '#1c1c2e' : 'transparent' }}
              onPress={() => setTab(t)}
            >
              <Text
                className="text-xs font-bold tracking-wider"
                style={{ color: tab === t ? '#00e87a' : '#44445a' }}
              >
                {t === 'active' ? 'MEIN PLAN' : 'ALLE PLÄNE'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00e87a" />}
      >
        {tab === 'active' ? (
          activePlan ? (
            <ActivePlanView activePlan={activePlan} />
          ) : (
            <View className="items-center py-16 gap-3">
              <Ionicons name="fitness-outline" size={48} color="#252535" />
              <Text className="text-ink-secondary font-semibold">Kein aktiver Plan</Text>
              <Text className="text-ink-muted text-sm text-center">Starte einen Plan um dein Training zu tracken</Text>
              <TouchableOpacity
                className="mt-2 px-6 py-3 rounded-xl border border-neon-green"
                onPress={() => setTab('plans')}
              >
                <Text className="text-neon-green font-semibold text-sm">Pläne entdecken →</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} isActive={activePlan?.plan.id === plan.id} onStart={() => handleStart(plan.id)} />
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
