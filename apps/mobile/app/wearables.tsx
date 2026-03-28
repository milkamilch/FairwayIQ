import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, Platform,
} from 'react-native';

// HealthKit ist nur auf iOS verfügbar — try/catch verhindert Fehler falls nicht installiert
let AppleHealthKit: typeof import('react-native-health').default | null = null;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-health') as typeof import('react-native-health');
    AppleHealthKit = mod.default;
  } catch {}
}

const HEALTH_PERMISSIONS = Platform.OS === 'ios' && AppleHealthKit
  ? ({
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.AppleExerciseTime,
        ],
        write: [],
      },
    } as Parameters<typeof AppleHealthKit.initHealthKit>[0])
  : null;

interface HealthMetrics {
  steps: number;
  heartRate: number;
  calories: number;
  activeMinutes: number;
}

function readAppleHealthData(): Promise<HealthMetrics> {
  return new Promise((resolve, reject) => {
    if (!AppleHealthKit || !HEALTH_PERMISSIONS) {
      reject(new Error('HealthKit nicht verfügbar'));
      return;
    }

    AppleHealthKit.initHealthKit(HEALTH_PERMISSIONS, (initErr) => {
      if (initErr) { reject(initErr); return; }

      const hk = AppleHealthKit!;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = today.toISOString();
      const endDate = new Date().toISOString();

      const result: HealthMetrics = { steps: 0, heartRate: 0, calories: 0, activeMinutes: 0 };
      let pending = 4;
      const done = () => { if (--pending === 0) resolve(result); };

      hk.getStepCount({ date: startDate }, (_err, res) => {
        if (!_err && res?.value) result.steps = Math.round(res.value);
        done();
      });

      hk.getHeartRateSamples(
        { startDate, endDate, limit: 10, ascending: false },
        (_err, samples) => {
          if (!_err && samples?.length) {
            const avg = samples.reduce((s, r) => s + r.value, 0) / samples.length;
            result.heartRate = Math.round(avg);
          }
          done();
        },
      );

      hk.getActiveEnergyBurned({ startDate, endDate }, (_err, samples) => {
        if (!_err && samples?.length) {
          result.calories = Math.round(samples.reduce((s, r) => s + r.value, 0));
        }
        done();
      });

      hk.getAppleExerciseTime({ startDate, endDate }, (_err, samples) => {
        if (!_err && samples?.length) {
          result.activeMinutes = Math.round(samples.reduce((s, r) => s + r.value, 0));
        }
        done();
      });
    });
  });
}
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../src/lib/theme';
import { api } from '../src/lib/api';

type Provider = 'APPLE_HEALTH';

interface SyncData {
  steps?: number;
  heartRate?: number;
  calories?: number;
  activeMinutes?: number;
}

interface WearableConnection {
  id: string;
  provider: Provider;
  connectedAt: string;
  lastSyncAt: string | null;
  syncData: SyncData | null;
}

interface MetricTileProps {
  iconName: string;
  label: string;
  value: string | number;
  unit: string;
  color: string;
  c: ReturnType<typeof useTheme>;
}

function MetricTile({ iconName, label, value, unit, color, c }: MetricTileProps) {
  return (
    <View style={{
      flex: 1, backgroundColor: c.bgElevated, borderRadius: 12,
      padding: 12, alignItems: 'center', gap: 4,
      borderWidth: 1, borderColor: c.bgBorder,
    }}>
      <Ionicons name={iconName as any} size={18} color={color} />
      <Text style={{ color, fontWeight: '700', fontSize: 18 }}>{value}</Text>
      <Text style={{ color: c.inkMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{unit}</Text>
      <Text style={{ color: c.inkSecondary, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

interface DeviceCardProps {
  provider: Provider;
  connection: WearableConnection | null;
  onConnect: (provider: Provider) => void;
  onDisconnect: (provider: Provider) => void;
  onSync: (provider: Provider) => void;
  loading: boolean;
  c: ReturnType<typeof useTheme>;
  t: ReturnType<typeof useTranslation>['t'];
  lang: string;
}

function DeviceCard({ provider, connection, onConnect, onDisconnect, onSync, loading, c, t, lang }: DeviceCardProps) {
  const isConnected = !!connection;

  const meta = { name: 'Apple Health', iconName: 'heart-outline', color: '#ff3b30', desc: t('wearables.devices.appleDesc') };

  const formatDate = (iso: string | null) => {
    if (!iso) return t('wearables.never');
    const d = new Date(iso);
    return d.toLocaleDateString(lang, { day: 'numeric', month: 'short' }) +
      ' ' + d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={{
      backgroundColor: c.bgCard, borderRadius: 18,
      borderWidth: 1.5, borderColor: isConnected ? meta.color + '40' : c.bgBorder,
      overflow: 'hidden', marginBottom: 12,
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 16,
        borderBottomWidth: isConnected ? 1 : 0, borderBottomColor: c.bgBorder,
      }}>
        <View style={{
          width: 48, height: 48, borderRadius: 14,
          backgroundColor: meta.color + '15', borderWidth: 1.5, borderColor: meta.color + '40',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={meta.iconName as any} size={24} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: c.inkPrimary, fontWeight: '700', fontSize: 16 }}>{meta.name}</Text>
            {isConnected && (
              <View style={{
                paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100,
                backgroundColor: '#FF653520', borderWidth: 1, borderColor: '#FF653550',
              }}>
                <Text style={{ color: '#FF6535', fontSize: 10, fontWeight: '700' }}>{t('wearables.connected')}</Text>
              </View>
            )}
            {Platform.OS !== 'ios' && (
              <View style={{
                paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100,
                backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.bgBorder,
              }}>
                <Text style={{ color: c.inkMuted, fontSize: 10, fontWeight: '600' }}>{t('wearables.iosOnly')}</Text>
              </View>
            )}
          </View>
          <Text style={{ color: c.inkSecondary, fontSize: 12, marginTop: 2 }}>{meta.desc}</Text>
        </View>
      </View>

      {/* Connected: metrics + last sync */}
      {isConnected && connection.syncData && (
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
            {t('wearables.lastSync')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {connection.syncData.steps != null && (
              <MetricTile iconName="footsteps-outline" label={t('wearables.metrics.steps')} value={connection.syncData.steps.toLocaleString(lang)} unit={t('wearables.metrics.stepsUnit')} color={meta.color} c={c} />
            )}
            {connection.syncData.heartRate != null && (
              <MetricTile iconName="heart-outline" label={t('wearables.metrics.heartRate')} value={connection.syncData.heartRate} unit={t('wearables.metrics.heartRateUnit')} color="#ef4444" c={c} />
            )}
            {connection.syncData.calories != null && (
              <MetricTile iconName="flame-outline" label={t('wearables.metrics.calories')} value={connection.syncData.calories} unit={t('wearables.metrics.caloriesUnit')} color="#f97316" c={c} />
            )}
            {connection.syncData.activeMinutes != null && (
              <MetricTile iconName="flash-outline" label={t('wearables.metrics.activeMinutes')} value={connection.syncData.activeMinutes} unit={t('wearables.metrics.activeMinutesUnit')} color="#a855f7" c={c} />
            )}
          </View>
        </View>
      )}

      {isConnected && (
        <Text style={{ color: c.inkMuted, fontSize: 11, paddingHorizontal: 16, paddingBottom: 12, marginTop: 4 }}>
          {t('wearables.lastSynced', { date: formatDate(connection.lastSyncAt) })}
        </Text>
      )}

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 8, padding: 16, paddingTop: isConnected ? 0 : 16 }}>
        {!isConnected ? (
          <TouchableOpacity
            onPress={() => onConnect(provider)}
            disabled={loading || Platform.OS !== 'ios'}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
              backgroundColor: Platform.OS !== 'ios' ? c.bgElevated : meta.color,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{
                  fontWeight: '700', fontSize: 14,
                  color: Platform.OS !== 'ios' ? c.inkMuted : '#fff',
                }}>
                  {Platform.OS !== 'ios' ? t('wearables.iphoneOnly') : t('wearables.connect')}
                </Text>
            }
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => onSync(provider)}
              disabled={loading}
              style={{
                flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center',
                backgroundColor: meta.color + '15', borderWidth: 1.5, borderColor: meta.color + '50',
                flexDirection: 'row', justifyContent: 'center', gap: 6,
              }}
            >
              {loading
                ? <ActivityIndicator size="small" color={meta.color} />
                : <>
                    <Ionicons name="refresh-outline" size={15} color={meta.color} />
                    <Text style={{ color: meta.color, fontWeight: '600', fontSize: 13 }}>{t('wearables.sync')}</Text>
                  </>
              }
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDisconnect(provider)}
              style={{
                paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12,
                backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.bgBorder,
              }}
            >
              <Ionicons name="unlink-outline" size={16} color={c.inkMuted} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

export default function WearablesScreen() {
  const { t, i18n } = useTranslation();
  const c = useTheme();
  const router = useRouter();
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

  const loadConnections = async () => {
    try {
      const { data } = await api.get<WearableConnection[]>('/wearables/connections');
      setConnections(data);
    } catch {}
  };

  useEffect(() => { loadConnections(); }, []);

  const getConnection = (p: Provider) => connections.find((c) => c.provider === p) ?? null;

  const handleConnect = async (provider: Provider) => {
    setLoadingProvider(provider);
    try {
      if (provider === 'APPLE_HEALTH') {
        // HealthKit-Berechtigungen anfragen, dann Backend-Verbindung speichern
        await new Promise<void>((resolve, reject) => {
          if (!AppleHealthKit || !HEALTH_PERMISSIONS) { reject(new Error('HealthKit nicht verfügbar')); return; }
          AppleHealthKit.initHealthKit(HEALTH_PERMISSIONS, (err) => {
            if (err) reject(err); else resolve();
          });
        });
      }
      await api.post(`/wearables/${provider.toLowerCase()}/connect`, {});
      await loadConnections();
      if (provider === 'APPLE_HEALTH') {
        Alert.alert(t('wearables.appleConnectedTitle'), t('wearables.appleConnectedMsg'), [{ text: t('common.ok') }]);
      }
    } catch {
      Alert.alert(t('common.error'), t('wearables.connectFailed'));
    }
    setLoadingProvider(null);
  };

  const handleDisconnect = (provider: Provider) => {
    const name = 'Apple Health';
    Alert.alert(
      t('wearables.disconnectTitle', { name }),
      t('wearables.disconnectMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('wearables.disconnect'), style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/wearables/${provider.toLowerCase()}`);
              await loadConnections();
            } catch { Alert.alert(t('common.error'), t('wearables.disconnectFailed')); }
          },
        },
      ]
    );
  };

  const handleSync = async (provider: Provider) => {
    setLoadingProvider(provider);
    try {
      let syncData: { steps?: number; heartRate?: number; calories?: number; activeMinutes?: number };

      syncData = await readAppleHealthData();

      await api.post(`/wearables/${provider.toLowerCase()}/sync`, syncData);
      await loadConnections();
    } catch {
      Alert.alert(t('common.error'), t('wearables.syncFailed'));
    }
    setLoadingProvider(null);
  };

  const syncItems = [
    { iconName: 'footsteps-outline', color: '#007cc3', titleKey: 'wearables.syncItems.steps',        descKey: 'wearables.syncItems.stepsDesc' },
    { iconName: 'heart-outline',     color: '#ef4444', titleKey: 'wearables.syncItems.heartRate',    descKey: 'wearables.syncItems.heartRateDesc' },
    { iconName: 'flame-outline',     color: '#f97316', titleKey: 'wearables.syncItems.calories',     descKey: 'wearables.syncItems.caloriesDesc' },
    { iconName: 'timer-outline',     color: '#a855f7', titleKey: 'wearables.syncItems.activeMinutes', descKey: 'wearables.syncItems.activeMinutesDesc' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: c.bgBorder,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={c.inkPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.inkSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {t('wearables.sectionLabel')}
          </Text>
          <Text style={{ color: c.inkPrimary, fontSize: 22, fontWeight: '800' }}>{t('wearables.title')}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

        <DeviceCard
          provider="APPLE_HEALTH"
          connection={getConnection('APPLE_HEALTH')}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onSync={handleSync}
          loading={loadingProvider === 'APPLE_HEALTH'}
          c={c}
          t={t}
          lang={i18n.language}
        />

        {/* What gets synced */}
        <View style={{
          backgroundColor: c.bgCard, borderRadius: 16,
          borderWidth: 1, borderColor: c.bgBorder, padding: 16, marginTop: 4,
        }}>
          <Text style={{ color: c.inkSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 }}>
            {t('wearables.whatSyncs')}
          </Text>
          {syncItems.map((item) => (
            <View key={item.titleKey} style={{ flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
              <Ionicons name={item.iconName as any} size={20} color={item.color} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.inkPrimary, fontWeight: '600', fontSize: 13 }}>{t(item.titleKey)}</Text>
                <Text style={{ color: c.inkSecondary, fontSize: 12, marginTop: 1 }}>{t(item.descKey)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
