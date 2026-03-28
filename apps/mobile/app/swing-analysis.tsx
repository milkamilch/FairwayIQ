import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, Dimensions, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { api } from '../src/lib/api';
import { useTheme } from '../src/lib/theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Types ─────────────────────────────────────────────────────────────────

type SwingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface SwingFeedback {
  id:       string;
  category: string;
  type:     'POSITIVE' | 'IMPROVEMENT';
  message:  string;
  metric:   string | null;
  actual:   number | null;
  target:   number | null;
}

interface SwingMetrics {
  shoulderRotation: number;
  hipRotation:      number;
  xFactor:          number;
  spineConsistency: number;
  kneeFlexAddress:  number;
  overswing:        boolean;
  balanceFinish:    number;
}

interface SwingAnalysis {
  id:           string;
  videoUrl:     string;
  status:       SwingStatus;
  overallScore: number | null;
  metrics:      SwingMetrics | null;
  feedback:     SwingFeedback[];
  createdAt:    string;
}

// ── Metric card ────────────────────────────────────────────────────────────

const METRIC_META: Record<string, { label: string; unit: string; ideal: string; icon: string }> = {
  shoulderRotation: { label: 'Schulterdrehung', unit: '°',  ideal: '≥ 85°',  icon: 'sync-outline' },
  hipRotation:      { label: 'Hüftdrehung',     unit: '°',  ideal: '40–50°', icon: 'body-outline' },
  xFactor:          { label: 'X-Faktor',         unit: '°',  ideal: '≥ 35°',  icon: 'flash-outline' },
  spineConsistency: { label: 'Rückenwinkel',     unit: '%',  ideal: '≥ 80%',  icon: 'git-commit-outline' },
  kneeFlexAddress:  { label: 'Kniebeuge',        unit: '°',  ideal: '15–25°', icon: 'walk-outline' },
  balanceFinish:    { label: 'Balance',           unit: '%',  ideal: '≥ 75%',  icon: 'scale-outline' },
};

function MetricRow({ metricKey, value, c }: { metricKey: string; value: number | boolean; c: any }) {
  const meta = METRIC_META[metricKey];
  if (!meta) return null;
  if (typeof value === 'boolean') return null; // overswing shown in feedback only

  const display = `${(value as number).toFixed(0)}${meta.unit}`;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: c.bgElevated, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Ionicons name={meta.icon as any} size={16} color={c.inkMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.inkPrimary, fontWeight: '600', fontSize: 13 }}>{meta.label}</Text>
        <Text style={{ color: c.inkMuted, fontSize: 11, marginTop: 1 }}>Ideal: {meta.ideal}</Text>
      </View>
      <Text style={{ color: '#FF6535', fontWeight: '800', fontSize: 15 }}>{display}</Text>
    </View>
  );
}

// ── Feedback card ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  POSTURE:       'Haltung',
  BACKSWING:     'Rückschwung',
  DOWNSWING:     'Durchschwung',
  IMPACT:        'Impact',
  FOLLOWTHROUGH: 'Finish',
};

function FeedbackCard({ item, c }: { item: SwingFeedback; c: any }) {
  const isPositive = item.type === 'POSITIVE';
  return (
    <View style={{
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      backgroundColor: isPositive ? '#6ee7b715' : '#FF653510',
      borderWidth: 1,
      borderColor: isPositive ? '#6ee7b730' : '#FF653530',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Ionicons
          name={isPositive ? 'checkmark-circle' : 'arrow-up-circle'}
          size={16}
          color={isPositive ? '#6ee7b7' : '#FF6535'}
        />
        <Text style={{ color: isPositive ? '#6ee7b7' : '#FF6535', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
          {CATEGORY_LABELS[item.category] ?? item.category}
        </Text>
      </View>
      <Text style={{ color: c.inkPrimary, fontSize: 13, lineHeight: 19 }}>{item.message}</Text>
      {item.actual != null && item.target != null && (
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
          <Text style={{ color: c.inkMuted, fontSize: 11 }}>Ist: <Text style={{ color: c.inkPrimary, fontWeight: '700' }}>{item.actual.toFixed(0)}</Text></Text>
          <Text style={{ color: c.inkMuted, fontSize: 11 }}>Soll: <Text style={{ color: c.inkPrimary, fontWeight: '700' }}>{item.target.toFixed(0)}</Text></Text>
        </View>
      )}
    </View>
  );
}

// ── Score ring ─────────────────────────────────────────────────────────────

function ScoreRing({ score, c }: { score: number; c: any }) {
  const color = score >= 75 ? '#6ee7b7' : score >= 50 ? '#FF6535' : '#ef4444';
  const label = score >= 75 ? 'Stark' : score >= 50 ? 'Gut' : 'Ausbaufähig';
  return (
    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
      <View style={{
        width: 120, height: 120, borderRadius: 60,
        borderWidth: 6, borderColor: color,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: c.bgCard,
      }}>
        <Text style={{ color, fontSize: 38, fontWeight: '900' }}>{score}</Text>
      </View>
      <Text style={{ color, fontSize: 13, fontWeight: '700', marginTop: 8, letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}

// ── History list item ──────────────────────────────────────────────────────

function HistoryItem({ swing, onPress, onDelete, c }: {
  swing: SwingAnalysis; onPress: () => void; onDelete: () => void; c: any;
}) {
  const color = swing.overallScore != null
    ? (swing.overallScore >= 75 ? '#6ee7b7' : swing.overallScore >= 50 ? '#FF6535' : '#ef4444')
    : c.inkMuted;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.bgElevated, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        {swing.status === 'PROCESSING' || swing.status === 'PENDING'
          ? <ActivityIndicator size="small" color="#FF6535" />
          : swing.status === 'FAILED'
          ? <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
          : <Text style={{ color, fontWeight: '900', fontSize: 16 }}>{swing.overallScore}</Text>
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.inkPrimary, fontWeight: '700', fontSize: 13 }}>
          {swing.status === 'PROCESSING' || swing.status === 'PENDING' ? 'Wird analysiert…' :
           swing.status === 'FAILED' ? 'Analyse fehlgeschlagen' :
           `Score: ${swing.overallScore}/100`}
        </Text>
        <Text style={{ color: c.inkMuted, fontSize: 11, marginTop: 2 }}>
          {new Date(swing.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="trash-outline" size={18} color={c.inkMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

type View = 'list' | 'result';

export default function SwingAnalysisScreen() {
  const { t } = useTranslation();
  const c = useTheme();
  const router = useRouter();

  const [swings, setSwings]         = useState<SwingAnalysis[]>([]);
  const [view, setView]             = useState<View>('list');
  const [selected, setSelected]     = useState<SwingAnalysis | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [uploadPct, setUploadPct]   = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSwings = useCallback(async () => {
    try {
      const { data } = await api.get<SwingAnalysis[]>('/swings');
      setSwings(data);
      // Update selected if open
      if (selected) {
        const updated = data.find((s) => s.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch {}
  }, [selected]);

  useEffect(() => {
    fetchSwings();
  }, []);

  // Poll while any swing is still processing
  useEffect(() => {
    const hasPending = swings.some((s) => s.status === 'PROCESSING' || s.status === 'PENDING');
    if (hasPending && !pollRef.current) {
      pollRef.current = setInterval(fetchSwings, 4000);
    } else if (!hasPending && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [swings, fetchSwings]);

  const pickAndUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Berechtigung', 'Bitte erlaube den Zugriff auf deine Mediathek in den Einstellungen.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      videoMaxDuration: 30,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    setUploadPct(0);

    try {
      const formData = new FormData();
      formData.append('video', {
        uri:  asset.uri,
        name: 'swing.mp4',
        type: asset.mimeType ?? 'video/mp4',
      } as any);

      await api.post('/swings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100));
        },
      });

      await fetchSwings();
    } catch (err) {
      Alert.alert('Fehler', 'Video konnte nicht hochgeladen werden. Bitte versuche es erneut.');
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  const recordAndUpload = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Berechtigung', 'Bitte erlaube den Zugriff auf die Kamera in den Einstellungen.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 30,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    setUploadPct(0);

    try {
      const formData = new FormData();
      formData.append('video', {
        uri:  asset.uri,
        name: 'swing.mp4',
        type: asset.mimeType ?? 'video/mp4',
      } as any);

      await api.post('/swings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100));
        },
      });

      await fetchSwings();
    } catch {
      Alert.alert('Fehler', 'Video konnte nicht hochgeladen werden. Bitte versuche es erneut.');
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  const deleteSwing = (swing: SwingAnalysis) => {
    Alert.alert('Löschen', 'Analyse wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/swings/${swing.id}`);
            setSwings((prev) => prev.filter((s) => s.id !== swing.id));
            if (selected?.id === swing.id) { setSelected(null); setView('list'); }
          } catch {}
        },
      },
    ]);
  };

  const openResult = (swing: SwingAnalysis) => {
    setSelected(swing);
    setView('result');
  };

  // ── Result view ───────────────────────────────────────────────────────

  if (view === 'result' && selected) {
    return <ResultView swing={selected} c={c} onBack={() => setView('list')} />;
  }

  // ── List / upload view ─────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={c.inkPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>
            KI-Analyse
          </Text>
          <Text style={{ color: c.inkPrimary, fontSize: 24, fontWeight: '900' }}>
            Swing Analyse
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

        {/* Upload card */}
        <View style={{ backgroundColor: c.bgCard, borderRadius: 20, padding: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Ionicons name="videocam" size={20} color="#FF6535" />
            <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 15 }}>Neuen Swing analysieren</Text>
          </View>
          <Text style={{ color: c.inkMuted, fontSize: 13, lineHeight: 19, marginBottom: 16 }}>
            Lade ein Video deines Schwungs hoch (max. 30 Sek.). Die KI analysiert Haltung, Rotation und Technik.
          </Text>

          {uploading ? (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <ActivityIndicator color="#FF6535" size="large" />
              <Text style={{ color: c.inkMuted, marginTop: 8, fontSize: 13 }}>
                {uploadPct < 100 ? `Hochladen… ${uploadPct}%` : 'Analyse gestartet…'}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={recordAndUpload}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FF6535', borderRadius: 12, paddingVertical: 13 }}
              >
                <Ionicons name="camera" size={16} color="#0A0A0A" />
                <Text style={{ color: '#0A0A0A', fontWeight: '800', fontSize: 13 }}>Aufnehmen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickAndUpload}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.bgElevated, borderRadius: 12, paddingVertical: 13, borderWidth: 1, borderColor: c.bgBorder }}
              >
                <Ionicons name="images-outline" size={16} color={c.inkMuted} />
                <Text style={{ color: c.inkMuted, fontWeight: '700', fontSize: 13 }}>Mediathek</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            Für beste Ergebnisse
          </Text>
          {[
            { icon: 'sunny-outline',    text: 'Gute Beleuchtung — kein Gegenlicht' },
            { icon: 'people-outline',   text: 'Kamera seitlich auf Hüfthöhe positionieren' },
            { icon: 'time-outline',     text: 'Kompletter Schwung in einem Video (Adresse bis Finish)' },
            { icon: 'shirt-outline',    text: 'Kontrastierendes Outfit erleichtert die Pose-Erkennung' },
          ].map((tip) => (
            <View key={tip.text} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
              <Ionicons name={tip.icon as any} size={14} color="#FF6535" style={{ marginTop: 1 }} />
              <Text style={{ color: c.inkSecondary, fontSize: 12, flex: 1 }}>{tip.text}</Text>
            </View>
          ))}
        </View>

        {/* History */}
        {swings.length > 0 && (
          <>
            <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
              Meine Analysen
            </Text>
            <View style={{ backgroundColor: c.bgCard, borderRadius: 16, paddingHorizontal: 16 }}>
              {swings.map((swing) => (
                <HistoryItem
                  key={swing.id}
                  swing={swing}
                  c={c}
                  onPress={() => swing.status === 'COMPLETED' ? openResult(swing) : null}
                  onDelete={() => deleteSwing(swing)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Result view (separate component to keep VideoView lifecycle clean) ──────

function ResultView({ swing, c, onBack }: { swing: SwingAnalysis; c: any; onBack: () => void }) {
  const player = useVideoPlayer(swing.videoUrl, (p) => {
    p.loop = true;
  });

  const positive   = swing.feedback?.filter((f) => f.type === 'POSITIVE')     ?? [];
  const improvable = swing.feedback?.filter((f) => f.type === 'IMPROVEMENT')  ?? [];
  const metrics    = swing.metrics;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={c.inkPrimary} />
        </TouchableOpacity>
        <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 16, flex: 1 }}>Swing Analyse</Text>
        <Text style={{ color: c.inkMuted, fontSize: 12 }}>
          {new Date(swing.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Video player */}
        <VideoView
          player={player}
          style={{ width: SCREEN_W, height: SCREEN_W * 0.5625 }}
          allowsFullscreen
          allowsPictureInPicture
        />

        {/* Score */}
        {swing.overallScore != null && <ScoreRing score={swing.overallScore} c={c} />}

        <View style={{ paddingHorizontal: 20 }}>

          {/* Metrics grid */}
          {metrics && (
            <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
                Metriken
              </Text>
              {Object.entries(metrics)
                .filter(([k]) => k !== 'overswing')
                .map(([k, v]) => (
                  <MetricRow key={k} metricKey={k} value={v as number} c={c} />
                ))}
              {metrics.overswing && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10 }}>
                  <Ionicons name="warning-outline" size={16} color="#f59e0b" />
                  <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '600' }}>Overswing erkannt</Text>
                </View>
              )}
            </View>
          )}

          {/* Positive feedback */}
          {positive.length > 0 && (
            <>
              <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
                Stärken
              </Text>
              {positive.map((f) => <FeedbackCard key={f.id} item={f} c={c} />)}
            </>
          )}

          {/* Improvement feedback */}
          {improvable.length > 0 && (
            <View style={{ marginTop: positive.length > 0 ? 16 : 0 }}>
              <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
                Verbesserungspotenzial
              </Text>
              {improvable.map((f) => <FeedbackCard key={f.id} item={f} c={c} />)}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
