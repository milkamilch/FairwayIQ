import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/lib/api';

interface Stats {
  rounds: number;
  bestScore: number | null;
  avgScore: number | null;
}

const levelMeta: Record<string, { label: string; color: string; range: string; icon: string }> = {
  BEGINNER:     { label: 'ANFÄNGER',       color: '#00e87a', range: 'HCP > 24',   icon: '🌱' },
  INTERMEDIATE: { label: 'FORTGESCHRITTEN', color: '#f59e0b', range: 'HCP 13–24', icon: '⚡' },
  ADVANCED:     { label: 'GEÜBT',          color: '#f97316', range: 'HCP 5–12',   icon: '🔥' },
  PRO:          { label: 'PRO',            color: '#a855f7', range: 'HCP < 5',    icon: '💎' },
};

function formatMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

function scoreDiff(n: number) {
  if (n < 0) return String(n);
  if (n === 0) return 'E';
  return `+${n}`;
}

const inputStyle = "bg-bg-elevated border border-bg-border text-ink-primary rounded-xl px-4 py-3 text-sm";
const labelStyle = "text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2";

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [handicap, setHandicap] = useState(user?.handicap?.toString() ?? '');
  const [homeClub, setHomeClub] = useState(user?.homeClub ?? '');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<Stats>('/rounds/stats/overview').then(({ data }) => setStats(data)).catch(() => {});
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
    } catch { Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden'); }
    setSaving(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setName(user?.name ?? '');
    setHandicap(user?.handicap?.toString() ?? '');
    setHomeClub(user?.homeClub ?? '');
  };

  const handleLogout = () => {
    Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Abmelden', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Account</Text>
          <Text className="text-ink-primary text-2xl font-bold mt-0.5">Profil</Text>
        </View>
        {!editing ? (
          <TouchableOpacity
            className="flex-row items-center gap-2 px-3 py-2 rounded-xl border border-bg-border"
            style={{ backgroundColor: '#14141f' }}
            onPress={() => setEditing(true)}
          >
            <Ionicons name="pencil-outline" size={14} color="#8888aa" />
            <Text className="text-ink-secondary text-xs font-semibold">Bearbeiten</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row gap-2">
            <TouchableOpacity className="px-3 py-2 rounded-xl border border-bg-border" onPress={cancelEdit}>
              <Text className="text-ink-secondary text-xs font-semibold">Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-2 rounded-xl"
              style={{ backgroundColor: saving ? '#00e87a60' : '#00e87a' }}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#07070f" />
                : <Text className="text-bg-base text-xs font-bold">Speichern</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

        {/* ── Player Card ─────────────────────────────────────────── */}
        <View
          className="rounded-2xl p-5 mb-4 overflow-hidden"
          style={{ backgroundColor: '#14141f', borderWidth: 1, borderColor: meta.color + '30' }}
        >
          {/* Level glow accent */}
          <View
            className="absolute top-0 right-0 w-32 h-32 rounded-full"
            style={{ backgroundColor: meta.color + '08', transform: [{ translateX: 40 }, { translateY: -40 }] }}
          />

          <View className="flex-row items-center gap-4 mb-4">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{ backgroundColor: meta.color + '15', borderWidth: 1.5, borderColor: meta.color + '40' }}
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
              <Text className="text-xs font-bold tracking-wider" style={{ color: meta.color }}>{meta.label}</Text>
              <Text className="text-xs" style={{ color: meta.color + 'aa' }}>· {meta.range}</Text>
            </View>
            {user?.createdAt && (
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="calendar-outline" size={11} color="#44445a" />
                <Text className="text-ink-muted text-xs">seit {formatMemberSince(user.createdAt)}</Text>
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
                <Text className="text-ink-muted text-xs font-semibold uppercase tracking-widest mb-1">Handicap</Text>
                <Text className="text-ink-primary font-bold text-3xl">
                  {user?.handicap !== null && user?.handicap !== undefined
                    ? user.handicap % 1 === 0 ? String(user.handicap) : user.handicap.toFixed(1)
                    : '—'}
                </Text>
                <TouchableOpacity onPress={() => router.push('/progress')}>
                  <Text className="text-neon-green text-xs mt-1">Verlauf →</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Bester Score */}
          <View className="flex-1 bg-bg-card border border-bg-border rounded-xl p-4 items-center">
            <Text className="text-ink-muted text-xs font-semibold uppercase tracking-widest mb-1">Bester Score</Text>
            <Text className="text-ink-primary font-bold text-3xl">
              {stats?.bestScore !== null && stats?.bestScore !== undefined ? scoreDiff(stats.bestScore) : '—'}
            </Text>
            <Text className="text-ink-muted text-xs mt-1">
              {stats?.rounds ? `${stats.rounds} Runden` : 'Noch keine'}
            </Text>
          </View>

          {/* Ø Score */}
          <View className="flex-1 bg-bg-card border border-bg-border rounded-xl p-4 items-center">
            <Text className="text-ink-muted text-xs font-semibold uppercase tracking-widest mb-1">Ø Score</Text>
            <Text className="text-ink-primary font-bold text-3xl">
              {stats?.avgScore !== null && stats?.avgScore !== undefined ? scoreDiff(Math.round(stats.avgScore)) : '—'}
            </Text>
            <Text className="text-ink-muted text-xs mt-1">letzte 20</Text>
          </View>
        </View>

        {/* ── Details ──────────────────────────────────────────────── */}
        <View className="bg-bg-card border border-bg-border rounded-xl overflow-hidden mb-4">
          {/* Heimatclub */}
          <View className="px-4 py-3.5 flex-row items-center gap-3 border-b border-bg-border">
            <View className="w-8 h-8 rounded-lg bg-bg-elevated items-center justify-center">
              <Ionicons name="flag-outline" size={16} color="#8888aa" />
            </View>
            <View className="flex-1">
              <Text className="text-ink-muted text-xs mb-0.5">Heimatclub</Text>
              {editing ? (
                <TextInput
                  className="text-ink-primary text-sm"
                  placeholder="z.B. GC München Eichenried"
                  placeholderTextColor="#44445a"
                  value={homeClub}
                  onChangeText={setHomeClub}
                />
              ) : (
                <Text className="text-ink-primary text-sm">
                  {user?.homeClub || <Text className="text-ink-muted">Noch nicht eingetragen</Text>}
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
              <Text className="text-ink-muted text-xs mb-0.5">E-Mail</Text>
              <Text className="text-ink-primary text-sm">{user?.email}</Text>
            </View>
          </View>

          {/* Mitglied seit */}
          <View className="px-4 py-3.5 flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-lg bg-bg-elevated items-center justify-center">
              <Ionicons name="time-outline" size={16} color="#8888aa" />
            </View>
            <View className="flex-1">
              <Text className="text-ink-muted text-xs mb-0.5">Mitglied seit</Text>
              <Text className="text-ink-primary text-sm">
                {user?.createdAt ? formatMemberSince(user.createdAt) : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Links ────────────────────────────────────────────────── */}
        <View className="gap-2 mb-8">
          <TouchableOpacity
            className="bg-bg-card border border-bg-border rounded-xl px-4 py-3.5 flex-row items-center gap-3"
            onPress={() => router.push('/progress')}
          >
            <View className="w-8 h-8 rounded-lg bg-bg-elevated items-center justify-center">
              <Ionicons name="analytics-outline" size={16} color="#00e87a" />
            </View>
            <View className="flex-1">
              <Text className="text-ink-primary font-medium text-sm">Fortschritt & Skill-Radar</Text>
              <Text className="text-ink-muted text-xs">HCP-Verlauf, Skill-Analyse</Text>
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
            <Text className="text-red-400 font-medium flex-1 text-sm">Abmelden</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
