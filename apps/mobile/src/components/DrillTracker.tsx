import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { useTheme } from '../lib/theme';

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
  const c = useTheme();
  return (
    <View className="flex-1 items-center">
      <Text className="text-ink-muted text-xs uppercase tracking-widest mb-2">{label}</Text>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.bgBorder }}
          onPress={() => onChange(Math.max(min, value - 1))}
          hitSlop={8}
        >
          <Ionicons name="remove" size={16} color={value > min ? c.inkSecondary : c.bgBorder} />
        </TouchableOpacity>
        <Text className="text-3xl font-black w-12 text-center" style={{ color }}>{value}</Text>
        <TouchableOpacity
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.bgBorder }}
          onPress={() => onChange(Math.min(max, value + 1))}
          hitSlop={8}
        >
          <Ionicons name="add" size={16} color={value < max ? c.inkSecondary : c.bgBorder} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Mini-Sparkline (SVG-frei, rein View-basiert) ───────────────────────
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 0.01);

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
              backgroundColor: isLast ? '#FF6535' : '#FF653540',
            }}
          />
        );
      })}
    </View>
  );
}

// ── Haupt-Komponente ───────────────────────────────────────────────────
export function DrillTracker({ drillId, userPlanId, dayNumber }: Props) {
  const c = useTheme();
  const [mode, setMode] = useState<'simple' | 'detailed'>('simple');
  const [hits, setHits] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [history, setHistory] = useState<DrillResultEntry[]>([]);
  const [stats, setStats] = useState<DrillStats | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const setHitsSafe = (v: number) => setHits(attempts > 0 ? Math.min(v, attempts) : v);
  const setAttemptsSafe = (v: number) => {
    setAttempts(v);
    setHits((h) => Math.min(h, v));
  };

  const rate = attempts > 0 ? hits / attempts : 0;
  const pct = Math.round(rate * 100);
  const rateColor = rate >= 0.8 ? '#FF6535' : rate >= 0.5 ? '#f59e0b' : '#f97316';

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
      const payload = mode === 'simple'
        ? { hits: 1, attempts: 1, userPlanId, dayNumber }
        : { hits, attempts: attempts || 1, userPlanId, dayNumber };
      await api.post(`/training/drills/${drillId}/result`, payload);
      setSaved(true);
      await fetchHistory();
    } catch {}
    setSaving(false);
  };

  const sparkData = history.map((r) => r.hits / r.attempts);

  return (
    <View
      className="mt-3 rounded-xl overflow-hidden"
      style={{ borderWidth: 1, borderColor: c.bgBorder, backgroundColor: c.bgSurface }}
    >
      {/* Header mit Modus-Toggle */}
      <View
        className="px-4 py-2.5 flex-row items-center justify-between"
        style={{ backgroundColor: c.bgCard, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="stats-chart-outline" size={13} color="#FF6535" />
          <Text className="text-neon-green text-xs font-bold uppercase tracking-widest">Ergebnis erfassen</Text>
        </View>
        <TouchableOpacity
          onPress={() => { setMode((m) => m === 'simple' ? 'detailed' : 'simple'); setSaved(false); }}
          className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ backgroundColor: c.bgElevated }}
        >
          <Ionicons name={mode === 'detailed' ? 'list-outline' : 'calculator-outline'} size={11} color={c.inkMuted} />
          <Text className="text-ink-muted" style={{ fontSize: 10 }}>
            {mode === 'simple' ? 'Treffer zählen' : 'Einfach'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="p-4 gap-4">
        {mode === 'simple' ? (
          /* ── Einfacher Modus: nur Abgeschlossen ── */
          <View className="items-center gap-2 py-2">
            <Text className="text-ink-muted text-xs text-center">
              Übung abgeschlossen? Tippe auf Speichern.
            </Text>
            <Text className="text-ink-muted text-xs text-center" style={{ fontSize: 10 }}>
              Zum Zählen von Treffern → "Treffer zählen"
            </Text>
          </View>
        ) : (
          /* ── Detaillierter Modus: Treffer / Versuche ── */
          <>
            <View className="flex-row items-start">
              <Stepper value={hits} min={0} max={attempts > 0 ? attempts : 999} onChange={setHitsSafe} label="Treffer" color={attempts > 0 ? rateColor : c.inkSecondary} />
              <View className="w-px bg-bg-border mx-2 self-stretch" />
              <Stepper value={attempts} min={0} max={200} onChange={setAttemptsSafe} label="Versuche" color={c.inkSecondary} />
            </View>

            {attempts > 0 && (
              <View>
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-ink-muted text-xs">Trefferquote</Text>
                  <Text className="text-sm font-bold" style={{ color: rateColor }}>{pct}%</Text>
                </View>
                <View className="bg-bg-elevated rounded-full h-2 overflow-hidden">
                  <View className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: rateColor }} />
                </View>
              </View>
            )}
          </>
        )}

        {/* Save Button */}
        <TouchableOpacity
          className="rounded-xl py-3 items-center flex-row justify-center gap-2"
          style={{
            backgroundColor: saved ? c.neonGreen20 : '#FF6535',
            borderWidth: saved ? 1 : 0,
            borderColor: saved ? '#FF6535' : 'transparent',
          }}
          onPress={handleSave}
          disabled={saving || saved}
        >
          {saving
            ? <ActivityIndicator size="small" color={saved ? '#FF6535' : '#0A0A0A'} />
            : <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={16} color={saved ? '#FF6535' : '#0A0A0A'} />
          }
          <Text className="text-sm font-bold" style={{ color: saved ? '#FF6535' : '#0A0A0A' }}>
            {saved ? 'Gespeichert' : mode === 'simple' ? 'Abgeschlossen' : 'Ergebnis speichern'}
          </Text>
        </TouchableOpacity>

        {/* Historie */}
        {loadingHistory ? (
          <ActivityIndicator size="small" color={c.bgBorder} />
        ) : history.length > 0 ? (
          <View
            className="rounded-xl p-3"
            style={{ backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.bgBorder }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-ink-secondary text-xs font-semibold">Dein Fortschritt</Text>
              <Text className="text-ink-muted text-xs">{history.length} Einheit{history.length !== 1 ? 'en' : ''}</Text>
            </View>

            <Sparkline data={sparkData} />

            {stats && (
              <View className="flex-row gap-3 mt-3">
                <View className="flex-1 items-center">
                  <Text className="text-ink-muted text-xs mb-0.5">Bestleistung</Text>
                  <Text className="text-ink-primary font-bold text-sm">{Math.round(stats.bestRate * 100)}%</Text>
                </View>
                <View className="w-px bg-bg-border" />
                <View className="flex-1 items-center">
                  <Text className="text-ink-muted text-xs mb-0.5">Letztes Mal</Text>
                  <Text className="text-ink-primary font-bold text-sm">{Math.round(stats.lastRate * 100)}%</Text>
                </View>
                <View className="w-px bg-bg-border" />
                <View className="flex-1 items-center">
                  <Text className="text-ink-muted text-xs mb-0.5">Trend</Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons
                      name={stats.trend > 0.02 ? 'trending-up' : stats.trend < -0.02 ? 'trending-down' : 'remove'}
                      size={14}
                      color={stats.trend > 0.02 ? '#FF6535' : stats.trend < -0.02 ? '#f97316' : c.inkMuted}
                    />
                    <Text
                      className="font-bold text-sm"
                      style={{ color: stats.trend > 0.02 ? '#FF6535' : stats.trend < -0.02 ? '#f97316' : c.inkMuted }}
                    >
                      {stats.trend > 0 ? '+' : ''}{Math.round(stats.trend * 100)}%
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View className="mt-3 gap-1">
              {history.slice(-3).reverse().map((r, i) => {
                const isSimple = r.hits === 1 && r.attempts === 1;
                const r_rate = Math.round((r.hits / r.attempts) * 100);
                const date = new Date(r.createdAt);
                const label = i === 0 ? 'Zuletzt' : date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                return (
                  <View key={r.id} className="flex-row items-center justify-between">
                    <Text className="text-ink-muted text-xs w-16">{label}</Text>
                    {isSimple ? (
                      <View className="flex-1 mx-3 items-start">
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="checkmark-circle" size={12} color="#FF6535" />
                          <Text className="text-xs font-semibold" style={{ color: '#FF6535' }}>Abgeschlossen</Text>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View className="flex-1 mx-3 bg-bg-elevated rounded-full h-1.5 overflow-hidden">
                          <View
                            className="h-1.5 rounded-full"
                            style={{ width: `${r_rate}%`, backgroundColor: r_rate >= 80 ? '#FF6535' : r_rate >= 50 ? '#f59e0b' : '#f97316' }}
                          />
                        </View>
                        <Text className="text-xs font-semibold w-14 text-right" style={{ color: r_rate >= 80 ? '#FF6535' : c.inkSecondary }}>
                          {r.hits}/{r.attempts} ({r_rate}%)
                        </Text>
                      </>
                    )}
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
