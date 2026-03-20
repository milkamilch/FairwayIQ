import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';
import { useTheme } from '../../src/lib/theme';
import { api } from '../../src/lib/api';

interface Stats {
  rounds: number;
  bestScore: number | null;
  avgScore: number | null;
}

type GoalType = 'HCP_TARGET' | 'ROUNDS_COUNT' | 'SCORE_TARGET' | 'CUSTOM';

interface UserGoal {
  id: string;
  type: GoalType;
  title: string;
  targetValue: number | null;
  deadline: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
}

const GOAL_TYPE_META: Record<GoalType, { icon: string }> = {
  HCP_TARGET:   { icon: '🏆' },
  ROUNDS_COUNT: { icon: '⛳' },
  SCORE_TARGET: { icon: '🎯' },
  CUSTOM:       { icon: '✨' },
};

const levelMeta: Record<string, { color: string; icon: string }> = {
  BEGINNER:     { color: '#00e87a', icon: '🌱' },
  INTERMEDIATE: { color: '#f59e0b', icon: '⚡' },
  ADVANCED:     { color: '#f97316', icon: '🔥' },
  PRO:          { color: '#a855f7', icon: '💎' },
};

function scoreDiff(n: number) {
  if (n < 0) return String(n);
  if (n === 0) return 'E';
  return `+${n}`;
}

const labelStyle = "text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2";

// ── Add Goal Modal ─────────────────────────────────────────────────
function AddGoalModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const c = useTheme();
  const [type, setType] = useState<GoalType>('HCP_TARGET');
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) { Alert.alert(t('profile.goals.titleMissing'), t('profile.goals.titleMissingMsg')); return; }
    setSaving(true);
    try {
      await api.post('/goals', {
        type,
        title: title.trim(),
        targetValue: targetValue ? parseFloat(targetValue.replace(',', '.')) : null,
      });
      onSaved();
      onClose();
    } catch { Alert.alert(t('common.error'), t('profile.goals.cannotSave')); }
    setSaving(false);
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingVertical: 16,
          borderBottomWidth: 1, borderBottomColor: c.bgBorder,
        }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: c.inkSecondary, fontSize: 14 }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={{ color: c.inkPrimary, fontWeight: 'bold' }}>{t('profile.goals.newGoal')}</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color="#00e87a" />
              : <Text style={{ color: '#00e87a', fontWeight: 'bold', fontSize: 14 }}>{t('common.save')}</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }}>
          {/* Type Picker */}
          <View>
            <Text style={{ color: c.inkSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
              {t('profile.goals.goalType')}
            </Text>
            <View style={{ gap: 8 }}>
              {(Object.entries(GOAL_TYPE_META) as [GoalType, typeof GOAL_TYPE_META[GoalType]][]).map(([goalType, m]) => (
                <TouchableOpacity
                  key={goalType}
                  onPress={() => { setType(goalType); setTitle(''); setTargetValue(''); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    padding: 14, borderRadius: 14,
                    backgroundColor: type === goalType ? '#00e87a10' : c.bgCard,
                    borderWidth: 1.5,
                    borderColor: type === goalType ? '#00e87a' : c.bgBorder,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{m.icon}</Text>
                  <Text style={{ color: type === goalType ? '#00e87a' : c.inkPrimary, fontWeight: '600', fontSize: 14 }}>
                    {t(`profile.goals.types.${goalType}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title */}
          <View>
            <Text style={{ color: c.inkSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              {t('profile.goals.description')}
            </Text>
            <TextInput
              style={{
                backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.bgBorder,
                borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                color: c.inkPrimary, fontSize: 15,
              }}
              placeholder={t(`profile.goals.placeholders.${type}`)}
              placeholderTextColor={c.inkMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Target Value */}
          {type !== 'CUSTOM' && (
            <View>
              <Text style={{ color: c.inkSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                {t('profile.goals.targetValue')}{t(`profile.goals.units.${type}`) ? ` (${t(`profile.goals.units.${type}`)})` : ''}
              </Text>
              <TextInput
                style={{
                  backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.bgBorder,
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                  color: c.inkPrimary, fontSize: 15,
                }}
                placeholder={type === 'HCP_TARGET' ? '15.0' : type === 'ROUNDS_COUNT' ? '30' : '90'}
                placeholderTextColor={c.inkMuted}
                keyboardType="decimal-pad"
                value={targetValue}
                onChangeText={setTargetValue}
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const { t, i18n } = useTranslation();
  const c = useTheme();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [handicap, setHandicap] = useState(user?.handicap?.toString() ?? '');
  const [homeClub, setHomeClub] = useState(user?.homeClub ?? '');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);

  const loadGoals = async () => {
    try { const { data } = await api.get<UserGoal[]>('/goals'); setGoals(data); } catch {}
  };

  useEffect(() => {
    api.get<Stats>('/rounds/stats/overview').then(({ data }) => setStats(data)).catch(() => {});
    loadGoals();
  }, []);

  const meta = levelMeta[user?.level ?? 'BEGINNER'];

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/me', {
        name: name.trim(),
        handicap: handicap ? parseFloat(handicap.replace(',', '.')) : undefined,
        homeClub: homeClub.trim() || null,
      });
      updateUser(data);
      setEditing(false);
    } catch { Alert.alert(t('common.error'), t('profile.cannotSave')); }
    setSaving(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setName(user?.name ?? '');
    setHandicap(user?.handicap?.toString() ?? '');
    setHomeClub(user?.homeClub ?? '');
  };

  const handleLogout = () => {
    Alert.alert(t('profile.logoutTitle'), t('profile.logoutMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: logout },
    ]);
  };

  const toggleGoal = async (goal: UserGoal) => {
    try {
      await api.put(`/goals/${goal.id}`, { isCompleted: !goal.isCompleted });
      loadGoals();
    } catch {}
  };

  const deleteGoal = (goal: UserGoal) => {
    Alert.alert(t('profile.goals.deleteTitle'), t('profile.goals.deleteMsg', { title: goal.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        try { await api.delete(`/goals/${goal.id}`); loadGoals(); } catch {}
      }},
    ]);
  };

  // Progress for typed goals
  const goalProgress = (goal: UserGoal): { current: number | null; pct: number } => {
    if (goal.targetValue == null) return { current: null, pct: 0 };
    if (goal.type === 'HCP_TARGET' && user?.handicap != null) {
      const start = user.handicap;
      const current = user.handicap;
      const pct = Math.max(0, Math.min(100, ((start - current) / (start - goal.targetValue)) * 100));
      return { current: user.handicap, pct: isFinite(pct) ? pct : 0 };
    }
    if (goal.type === 'ROUNDS_COUNT' && stats?.rounds != null) {
      return { current: stats.rounds, pct: Math.min(100, (stats.rounds / goal.targetValue) * 100) };
    }
    if (goal.type === 'SCORE_TARGET' && stats?.bestScore != null) {
      return { current: stats.bestScore, pct: 0 };
    }
    return { current: null, pct: 0 };
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">{t('profile.sectionLabel')}</Text>
          <Text className="text-ink-primary text-2xl font-bold mt-0.5">{t('profile.title')}</Text>
        </View>
        {!editing ? (
          <TouchableOpacity
            className="flex-row items-center gap-2 px-3 py-2 rounded-xl border border-bg-border"
            style={{ backgroundColor: '#14141f' }}
            onPress={() => setEditing(true)}
          >
            <Ionicons name="pencil-outline" size={14} color="#8888aa" />
            <Text className="text-ink-secondary text-xs font-semibold">{t('profile.editButton')}</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row gap-2">
            <TouchableOpacity className="px-3 py-2 rounded-xl border border-bg-border" onPress={cancelEdit}>
              <Text className="text-ink-secondary text-xs font-semibold">{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-2 rounded-xl"
              style={{ backgroundColor: saving ? '#00e87a60' : '#00e87a' }}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#07070f" />
                : <Text className="text-bg-base text-xs font-bold">{t('common.save')}</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

        {/* ── Player Card ─────────────────────────────────────────── */}
        <View
          className="rounded-2xl p-5 mb-4 overflow-hidden"
          style={{ backgroundColor: c.bgCard, borderWidth: 1, borderColor: meta.color + '30' }}
        >
          {/* Level glow accent */}
          <View
            className="absolute top-0 right-0 w-32 h-32 rounded-full"
            style={{ backgroundColor: meta.color + '08', transform: [{ translateX: 40 }, { translateY: -40 }] }}
          />

          <View className="flex-row items-center gap-4 mb-4">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{ backgroundColor: meta.color + '20', borderWidth: 1.5, borderColor: meta.color + '40' }}
            >
              <Text style={{ fontSize: 28 }}>{meta.icon}</Text>
            </View>
            <View className="flex-1">
              {editing ? (
                <TextInput
                  className="text-ink-primary font-bold text-xl pb-1 border-b border-bg-border"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
              ) : (
                <Text className="text-ink-primary font-bold text-xl">{user?.name}</Text>
              )}
              <Text className="text-ink-muted text-xs mt-1">{user?.email}</Text>
            </View>
          </View>

          {/* Level Badge + Member Since */}
          <View className="flex-row items-center justify-between">
            <View
              className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
              style={{ backgroundColor: meta.color + '20', borderWidth: 1, borderColor: meta.color + '50' }}
            >
              <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
              <Text className="text-xs font-bold tracking-wider" style={{ color: meta.color }}>
                {t(`profile.level.${user?.level ?? 'BEGINNER'}`)}
              </Text>
              <Text className="text-xs" style={{ color: meta.color + 'aa' }}>
                · {t(`profile.levelRange.${user?.level ?? 'BEGINNER'}`)}
              </Text>
            </View>
            {user?.createdAt && (
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="calendar-outline" size={11} color="#44445a" />
                <Text className="text-ink-muted text-xs">
                  {t('profile.since')} {new Date(user.createdAt).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Stats Row ────────────────────────────────────────────── */}
        <View className="flex-row gap-3 mb-4">
          {/* Handicap */}
          <View className="flex-1 bg-bg-card border border-bg-border rounded-xl p-4 items-center">
            {editing ? (
              <>
                <Text className={`${labelStyle} text-center`}>HCP</Text>
                <TextInput
                  className="text-ink-primary font-bold text-2xl text-center w-full"
                  placeholder="18.0"
                  placeholderTextColor="#44445a"
                  keyboardType="decimal-pad"
                  value={handicap}
                  onChangeText={setHandicap}
                />
              </>
            ) : (
              <>
                <Text className="text-ink-muted text-xs font-semibold uppercase tracking-widest mb-1">{t('profile.handicapLabel')}</Text>
                <Text className="text-ink-primary font-bold text-3xl">
                  {user?.handicap !== null && user?.handicap !== undefined
                    ? user.handicap % 1 === 0 ? String(user.handicap) : user.handicap.toFixed(1)
                    : '—'}
                </Text>
                <TouchableOpacity onPress={() => router.push('/progress')}>
                  <Text className="text-neon-green text-xs mt-1">{t('profile.handicapHistory')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Best Score */}
          <View className="flex-1 bg-bg-card border border-bg-border rounded-xl p-4 items-center">
            <Text className="text-ink-muted text-xs font-semibold uppercase tracking-widest mb-1">{t('profile.bestScore')}</Text>
            <Text className="text-ink-primary font-bold text-3xl">
              {stats?.bestScore !== null && stats?.bestScore !== undefined ? scoreDiff(stats.bestScore) : '—'}
            </Text>
            <Text className="text-ink-muted text-xs mt-1">
              {stats?.rounds ? `${stats.rounds} ${t('dashboard.stats.rounds')}` : t('profile.noRounds')}
            </Text>
          </View>

          {/* Avg Score */}
          <View className="flex-1 bg-bg-card border border-bg-border rounded-xl p-4 items-center">
            <Text className="text-ink-muted text-xs font-semibold uppercase tracking-widest mb-1">{t('profile.avgScore')}</Text>
            <Text className="text-ink-primary font-bold text-3xl">
              {stats?.avgScore !== null && stats?.avgScore !== undefined ? scoreDiff(Math.round(stats.avgScore)) : '—'}
            </Text>
            <Text className="text-ink-muted text-xs mt-1">{t('profile.lastN')}</Text>
          </View>
        </View>

        {/* ── Details ──────────────────────────────────────────────── */}
        <View className="bg-bg-card border border-bg-border rounded-xl overflow-hidden mb-4">
          {/* Home Club */}
          <View className="px-4 py-3.5 flex-row items-center gap-3 border-b border-bg-border">
            <View className="w-8 h-8 rounded-lg bg-bg-elevated items-center justify-center">
              <Ionicons name="flag-outline" size={16} color="#8888aa" />
            </View>
            <View className="flex-1">
              <Text className="text-ink-muted text-xs mb-0.5">{t('profile.homeClub')}</Text>
              {editing ? (
                <TextInput
                  className="text-ink-primary text-sm"
                  placeholder={t('profile.homeClubPlaceholder')}
                  placeholderTextColor="#44445a"
                  value={homeClub}
                  onChangeText={setHomeClub}
                />
              ) : (
                <Text className="text-ink-primary text-sm">
                  {user?.homeClub || <Text className="text-ink-muted">{t('profile.homeClubEmpty')}</Text>}
                </Text>
              )}
            </View>
            {!editing && (
              <Ionicons name="chevron-forward" size={12} color="#252535" />
            )}
          </View>

          {/* E-Mail */}
          <View className="px-4 py-3.5 flex-row items-center gap-3 border-b border-bg-border">
            <View className="w-8 h-8 rounded-lg bg-bg-elevated items-center justify-center">
              <Ionicons name="mail-outline" size={16} color="#8888aa" />
            </View>
            <View className="flex-1">
              <Text className="text-ink-muted text-xs mb-0.5">{t('profile.email')}</Text>
              <Text className="text-ink-primary text-sm">{user?.email}</Text>
            </View>
          </View>

          {/* Member Since */}
          <View className="px-4 py-3.5 flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-lg bg-bg-elevated items-center justify-center">
              <Ionicons name="time-outline" size={16} color="#8888aa" />
            </View>
            <View className="flex-1">
              <Text className="text-ink-muted text-xs mb-0.5">{t('profile.memberSince')}</Text>
              <Text className="text-ink-primary text-sm">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })
                  : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Goals ────────────────────────────────────────────────── */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">{t('profile.goals.title')}</Text>
            <TouchableOpacity onPress={() => setShowAddGoal(true)}>
              <Text className="text-neon-green text-xs font-semibold">{t('profile.goals.add')}</Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <TouchableOpacity
              className="bg-bg-card border border-bg-border rounded-xl p-5 items-center gap-2"
              onPress={() => setShowAddGoal(true)}
            >
              <Text style={{ fontSize: 24 }}>🎯</Text>
              <Text className="text-ink-secondary text-sm">{t('profile.goals.noGoals')}</Text>
              <Text className="text-neon-green text-sm font-semibold">{t('profile.goals.setFirst')}</Text>
            </TouchableOpacity>
          ) : (
            <View className="gap-2">
              {goals.map((goal) => {
                const goalMeta = GOAL_TYPE_META[goal.type];
                const { current, pct } = goalProgress(goal);
                return (
                  <View
                    key={goal.id}
                    className="bg-bg-card border border-bg-border rounded-xl overflow-hidden"
                    style={{ opacity: goal.isCompleted ? 0.6 : 1 }}
                  >
                    <View className="px-4 py-3 flex-row items-start gap-3">
                      <TouchableOpacity onPress={() => toggleGoal(goal)} className="mt-0.5">
                        <View
                          className="w-5 h-5 rounded-full border-2 items-center justify-center"
                          style={{ borderColor: goal.isCompleted ? '#00e87a' : c.bgBorder, backgroundColor: goal.isCompleted ? '#00e87a' : 'transparent' }}
                        >
                          {goal.isCompleted && <Ionicons name="checkmark" size={11} color="#07070f" />}
                        </View>
                      </TouchableOpacity>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-1.5 mb-0.5">
                          <Text style={{ fontSize: 12 }}>{goalMeta.icon}</Text>
                          <Text className="text-ink-muted text-xs">{t(`profile.goals.types.${goal.type}`)}</Text>
                        </View>
                        <Text className="text-ink-primary text-sm font-semibold" style={{ textDecorationLine: goal.isCompleted ? 'line-through' : 'none' }}>
                          {goal.title}
                        </Text>
                        {goal.targetValue != null && current != null && !goal.isCompleted && (
                          <Text className="text-ink-muted text-xs mt-1">
                            {t('profile.goals.current')}: {goal.type === 'HCP_TARGET' ? `HCP ${current}` : `${current} ${t(`profile.goals.units.${goal.type}`)}`}
                            {' · '}{t('profile.goals.targetValue')}: {goal.targetValue} {t(`profile.goals.units.${goal.type}`)}
                          </Text>
                        )}
                        {goal.deadline && (
                          <Text className="text-ink-muted text-xs mt-0.5">
                            {t('profile.goals.deadline')}: {new Date(goal.deadline).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Text>
                        )}
                        {goal.targetValue != null && pct > 0 && !goal.isCompleted && (
                          <View className="mt-2 bg-bg-elevated rounded-full h-1.5 overflow-hidden">
                            <View className="h-1.5 rounded-full bg-neon-green" style={{ width: `${pct}%` }} />
                          </View>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => deleteGoal(goal)} className="p-1">
                        <Ionicons name="close-outline" size={16} color={c.inkMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Links ────────────────────────────────────────────────── */}
        <View className="gap-2 mb-8">
          <TouchableOpacity
            className="bg-bg-card border border-bg-border rounded-xl px-4 py-3.5 flex-row items-center gap-3"
            onPress={() => router.push('/bag' as any)}
          >
            <View className="w-8 h-8 rounded-lg bg-bg-elevated items-center justify-center">
              <Text style={{ fontSize: 16 }}>🏌️</Text>
            </View>
            <View className="flex-1">
              <Text className="text-ink-primary font-medium text-sm">{t('profile.links.bag')}</Text>
              <Text className="text-ink-muted text-xs">{t('profile.links.bagSub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#44445a" />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-bg-card border border-bg-border rounded-xl px-4 py-3.5 flex-row items-center gap-3"
            onPress={() => router.push('/wearables' as any)}
          >
            <View className="w-8 h-8 rounded-lg bg-bg-elevated items-center justify-center">
              <Text style={{ fontSize: 16 }}>⌚</Text>
            </View>
            <View className="flex-1">
              <Text className="text-ink-primary font-medium text-sm">{t('profile.links.wearables')}</Text>
              <Text className="text-ink-muted text-xs">{t('profile.links.wearablesSub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#44445a" />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-bg-card border border-bg-border rounded-xl px-4 py-3.5 flex-row items-center gap-3"
            onPress={() => router.push('/progress')}
          >
            <View className="w-8 h-8 rounded-lg bg-bg-elevated items-center justify-center">
              <Ionicons name="analytics-outline" size={16} color="#00e87a" />
            </View>
            <View className="flex-1">
              <Text className="text-ink-primary font-medium text-sm">{t('profile.links.progress')}</Text>
              <Text className="text-ink-muted text-xs">{t('profile.links.progressSub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#44445a" />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-bg-card border rounded-xl px-4 py-3.5 flex-row items-center gap-3"
            style={{ borderColor: '#ef444430' }}
            onPress={handleLogout}
          >
            <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: '#ef444415' }}>
              <Ionicons name="log-out-outline" size={16} color="#ef4444" />
            </View>
            <Text className="text-red-400 font-medium flex-1 text-sm">{t('profile.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showAddGoal && (
        <AddGoalModal onClose={() => setShowAddGoal(false)} onSaved={loadGoals} />
      )}
    </SafeAreaView>
  );
}
