import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';

// ── Typen ──────────────────────────────────────────────────────────────
interface DrillResultEntry {
  id: string;
  hits: number;
  attempts: number;
  createdAt: string;
}

interface DrillStats {
  totalSessions: number;
  bestRate: number;
  lastRate: number;
  trend: number;
}

interface Props {
  drillId: string;
  userPlanId?: string;
  dayNumber?: number;
}

// ── Stepper ────────────────────────────────────────────────────────────
function Stepper({
  value, min, max, onChange, label, color,
}: {
  value: number; min: number; max: number;
  onChange: (v: number) => void; label: string; color: string;
}) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-ink-muted text-xs uppercase tracking-widest mb-2">{label}</Text>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: '#14141f', borderWidth: 1, borderColor: '#252535' }}
          onPress={() => onChange(Math.max(min, value - 1))}
          hitSlop={8}
        >
          <Ionicons name="remove" size={16} color={value > min ? '#8888aa' : '#252535'} />
        </TouchableOpacity>
        <Text className="text-3xl font-bold w-12 text-center" style={{ color }}>{value}</Text>
        <TouchableOpacity
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: '#14141f', borderWidth: 1, borderColor: '#252535' }}
          onPress={() => onChange(Math.min(max, value + 1))}
          hitSlop={8}
        >
          <Ionicons name="add" size={16} color={value < max ? '#8888aa' : '#252535'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Mini-Sparkline (SVG-frei, rein View-basiert) ───────────────────────
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 0.01);
  const barW = Math.floor(100 / data.length);

  return (
    <View className="flex-row items-end gap-0.5" style={{ height: 28, width: '100%' }}>
      {data.map((v, i) => {
        const isLast = i === data.length - 1;
        const height = Math.max(4, Math.round((v / max) * 28));
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height,
              borderRadius: 2,
              backgroundColor: isLast ? '#00e87a' : '#00e87a40',
            }}
          />
        );
      })}
    </View>
  );
}

// ── Haupt-Komponente ───────────────────────────────────────────────────
export function DrillTracker({ drillId, userPlanId, dayNumber }: Props) {
  const [hits, setHits] = useState(0);
  const [attempts, setAttempts] = useState(10);
  const [history, setHistory] = useState<DrillResultEntry[]>([]);
  const [stats, setStats] = useState<DrillStats | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Hits nie > Attempts
  const setHitsSafe = (v: number) => setHits(Math.min(v, attempts));
  const setAttemptsSafe = (v: number) => {
    setAttempts(v);
    setHits((h) => Math.min(h, v));
  };

  const rate = attempts > 0 ? hits / attempts : 0;
  const pct = Math.round(rate * 100);

  const rateColor = rate >= 0.8 ? '#00e87a' : rate >= 0.5 ? '#f59e0b' : '#f97316';

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get<{ results: DrillResultEntry[]; stats: DrillStats | null }>(
        `/training/drills/${drillId}/results`,
      );
      setHistory(data.results);
      setStats(data.stats);
    } catch {}
    setLoadingHistory(false);
  }, [drillId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      await api.post(`/training/drills/${drillId}/result`, {
        hits,
        attempts,
        userPlanId,
        dayNumber,
      });
      setSaved(true);
      await fetchHistory();
    } catch {}
    setSaving(false);
  };

  const sparkData = history.map((r) => r.hits / r.attempts);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <View
      className="mt-3 rounded-xl overflow-hidden"
      style={{ borderWidth: 1, borderColor: '#252535', backgroundColor: '#0f0f1a' }}
    >
      {/* Header */}
      <View
        className="px-4 py-2.5 flex-row items-center gap-2"
        style={{ backgroundColor: '#14141f', borderBottomWidth: 1, borderBottomColor: '#252535' }}
      >
        <Ionicons name="stats-chart-outline" size={13} color="#00e87a" />
        <Text className="text-neon-green text-xs font-bold uppercase tracking-widest">Treffer erfassen</Text>
      </View>

      <View className="p-4 gap-4">
        {/* Stepper Row */}
        <View className="flex-row items-start">
          <Stepper
            value={hits}
            min={0}
            max={attempts}
            onChange={setHitsSafe}
            label="Treffer"
            color={rateColor}
          />
          <View className="w-px bg-bg-border mx-2 self-stretch" />
          <Stepper
            value={attempts}
            min={1}
            max={100}
            onChange={setAttemptsSafe}
            label="Versuche"
            color="#8888aa"
          />
        </View>

        {/* Rate Indicator */}
        <View>
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-ink-muted text-xs">Trefferquote</Text>
            <Text className="text-sm font-bold" style={{ color: rateColor }}>{pct}%</Text>
          </View>
          <View className="bg-bg-elevated rounded-full h-2 overflow-hidden">
            <View
              className="h-2 rounded-full"
              style={{ width: `${pct}%`, backgroundColor: rateColor }}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="rounded-xl py-3 items-center flex-row justify-center gap-2"
          style={{
            backgroundColor: saved ? '#00e87a20' : '#00e87a',
            borderWidth: saved ? 1 : 0,
            borderColor: saved ? '#00e87a' : 'transparent',
          }}
          onPress={handleSave}
          disabled={saving || saved}
        >
          {saving
            ? <ActivityIndicator size="small" color={saved ? '#00e87a' : '#07070f'} />
            : <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={16} color={saved ? '#00e87a' : '#07070f'} />
          }
          <Text
            className="text-sm font-bold"
            style={{ color: saved ? '#00e87a' : '#07070f' }}
          >
            {saved ? 'Gespeichert' : 'Ergebnis speichern'}
          </Text>
        </TouchableOpacity>

        {/* Historie */}
        {loadingHistory ? (
          <ActivityIndicator size="small" color="#252535" />
        ) : history.length > 0 ? (
          <View
            className="rounded-xl p-3"
            style={{ backgroundColor: '#14141f', borderWidth: 1, borderColor: '#252535' }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-ink-secondary text-xs font-semibold">Dein Fortschritt</Text>
              <Text className="text-ink-muted text-xs">{history.length} Einheit{history.length !== 1 ? 'en' : ''}</Text>
            </View>

            {/* Sparkline */}
            <Sparkline data={sparkData} />

            {/* Stats Row */}
            {stats && (
              <View className="flex-row gap-3 mt-3">
                <View className="flex-1 items-center">
                  <Text className="text-ink-muted text-xs mb-0.5">Bestleistung</Text>
                  <Text className="text-ink-primary font-bold text-sm">
                    {Math.round(stats.bestRate * 100)}%
                  </Text>
                </View>
                <View className="w-px bg-bg-border" />
                <View className="flex-1 items-center">
                  <Text className="text-ink-muted text-xs mb-0.5">Letztes Mal</Text>
                  <Text className="text-ink-primary font-bold text-sm">
                    {Math.round(stats.lastRate * 100)}%
                  </Text>
                </View>
                <View className="w-px bg-bg-border" />
                <View className="flex-1 items-center">
                  <Text className="text-ink-muted text-xs mb-0.5">Trend</Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons
                      name={stats.trend > 0.02 ? 'trending-up' : stats.trend < -0.02 ? 'trending-down' : 'remove'}
                      size={14}
                      color={stats.trend > 0.02 ? '#00e87a' : stats.trend < -0.02 ? '#f97316' : '#44445a'}
                    />
                    <Text
                      className="font-bold text-sm"
                      style={{ color: stats.trend > 0.02 ? '#00e87a' : stats.trend < -0.02 ? '#f97316' : '#44445a' }}
                    >
                      {stats.trend > 0 ? '+' : ''}{Math.round(stats.trend * 100)}%
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Last sessions mini-list */}
            <View className="mt-3 gap-1">
              {history.slice(-3).reverse().map((r, i) => {
                const r_rate = Math.round((r.hits / r.attempts) * 100);
                const date = new Date(r.createdAt);
                const label = i === 0 ? 'Zuletzt' : date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                return (
                  <View key={r.id} className="flex-row items-center justify-between">
                    <Text className="text-ink-muted text-xs w-16">{label}</Text>
                    <View className="flex-1 mx-3 bg-bg-elevated rounded-full h-1.5 overflow-hidden">
                      <View
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${r_rate}%`,
                          backgroundColor: r_rate >= 80 ? '#00e87a' : r_rate >= 50 ? '#f59e0b' : '#f97316',
                        }}
                      />
                    </View>
                    <Text className="text-xs font-semibold w-14 text-right" style={{ color: r_rate >= 80 ? '#00e87a' : '#8888aa' }}>
                      {r.hits}/{r.attempts} ({r_rate}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View className="items-center py-2">
            <Text className="text-ink-muted text-xs">Noch keine Einträge — speichere dein erstes Ergebnis!</Text>
          </View>
        )}
      </View>
    </View>
  );
}
