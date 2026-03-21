import { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { useTheme } from '../lib/theme';

// ── Typen ────────────────────────────────────────────────────────────
interface Answers {
  weeklyHours: number;
  mainGoal: 'handicap' | 'consistency' | 'enjoyment' | 'compete';
  puttsPerRound: number;
  shortPuttConfidence: number;
  puttingMiss: 'distance' | 'line' | 'both' | 'none';
  upAndDownPercent: number;
  bunkerConfidence: number;
  chippingMiss: 'thin' | 'fat' | 'direction' | 'none';
  girPercent: number;
  ironConsistency: number;
  ironMiss: 'left' | 'right' | 'short' | 'long' | 'inconsistent';
  firPercent: number;
  driverConfidence: number;
  driverMiss: 'left' | 'right' | 'slice' | 'hook' | 'distance' | 'none';
  knowsDistances: number;
  playsStrategically: number;
  handlesPressure: number;
  recoversFromBadHoles: number;
}

const DEFAULT: Answers = {
  weeklyHours: 2, mainGoal: 'handicap',
  puttsPerRound: 33, shortPuttConfidence: 3, puttingMiss: 'both',
  upAndDownPercent: 25, bunkerConfidence: 2, chippingMiss: 'fat',
  girPercent: 25, ironConsistency: 3, ironMiss: 'inconsistent',
  firPercent: 45, driverConfidence: 3, driverMiss: 'slice',
  knowsDistances: 3, playsStrategically: 2,
  handlesPressure: 3, recoversFromBadHoles: 3,
};

// ── Hilfs-Komponenten ────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="mb-5">
      <Text className="text-neon-green text-xs font-bold uppercase tracking-widest mb-1">{subtitle}</Text>
      <Text className="text-ink-primary text-2xl font-black">{title}</Text>
    </View>
  );
}

function ScaleInput({ label, value, onChange, min = 1, max = 5, lowLabel, highLabel }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; lowLabel?: string; highLabel?: string;
}) {
  const c = useTheme();
  return (
    <View className="mb-5">
      <Text className="text-ink-secondary text-sm font-medium mb-3">{label}</Text>
      <View className="flex-row gap-2">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((v) => (
          <TouchableOpacity
            key={v}
            className="flex-1 h-11 rounded-xl items-center justify-center"
            style={{
              backgroundColor: value === v ? '#FF6535' : c.bgCard,
              borderWidth: 1,
              borderColor: value === v ? '#FF6535' : c.bgBorder,
            }}
            onPress={() => onChange(v)}
          >
            <Text className="font-bold text-sm" style={{ color: value === v ? '#FFFFFF' : c.inkMuted }}>
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {(lowLabel || highLabel) && (
        <View className="flex-row justify-between mt-1">
          <Text className="text-ink-muted text-xs">{lowLabel}</Text>
          <Text className="text-ink-muted text-xs">{highLabel}</Text>
        </View>
      )}
    </View>
  );
}

function ChoiceInput<T extends string>({ label, value, onChange, options }: {
  label: string; value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const c = useTheme();
  return (
    <View className="mb-5">
      <Text className="text-ink-secondary text-sm font-medium mb-3">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            className="px-4 py-2.5 rounded-xl"
            style={{
              backgroundColor: value === opt.value ? '#FF653515' : c.bgCard,
              borderWidth: 1,
              borderColor: value === opt.value ? '#FF6535' : c.bgBorder,
            }}
            onPress={() => onChange(opt.value)}
          >
            <Text
              className="text-sm font-medium"
              style={{ color: value === opt.value ? '#FF6535' : c.inkSecondary }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StepperInput({ label, value, onChange, min, max, unit, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; unit?: string; step?: number;
}) {
  return (
    <View className="mb-5">
      <Text className="text-ink-secondary text-sm font-medium mb-3">{label}</Text>
      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          className="w-11 h-11 rounded-full bg-bg-elevated border border-bg-border items-center justify-center"
          onPress={() => onChange(Math.max(min, value - step))}
        >
          <Ionicons name="remove" size={18} color="#8A8A8A" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-ink-primary text-3xl font-black">{value}</Text>
          {unit && <Text className="text-ink-muted text-xs">{unit}</Text>}
        </View>
        <TouchableOpacity
          className="w-11 h-11 rounded-full bg-bg-elevated border border-bg-border items-center justify-center"
          onPress={() => onChange(Math.min(max, value + step))}
        >
          <Ionicons name="add" size={18} color="#8A8A8A" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Schritte ─────────────────────────────────────────────────────────
const STEPS = ['general', 'putting', 'shortgame', 'iron', 'driving', 'mental', 'result'] as const;
type Step = typeof STEPS[number];

const STEP_LABELS: Record<Step, string> = {
  general: 'Allgemein', putting: 'Putting', shortgame: 'Kurzspiel',
  iron: 'Eisenspiel', driving: 'Driver', mental: 'Mental & Strategie', result: 'Auswertung',
};

// ── Ergebnis-Screen ──────────────────────────────────────────────────
function ResultScreen({ result, onClose }: { result: any; onClose: () => void }) {
  const { scores, weaknesses, strengths } = result.assessment;

  const categories = [
    { key: 'putting', label: 'Putting' },
    { key: 'shortGame', label: 'Kurzspiel' },
    { key: 'ironPlay', label: 'Eisenspiel' },
    { key: 'driving', label: 'Driver' },
    { key: 'courseManagement', label: 'Platzmanagement' },
    { key: 'mentalGame', label: 'Mental' },
  ];

  const getColor = (score: number) => {
    if (score >= 70) return '#FF6535';
    if (score >= 45) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
      <View className="py-5">
        <Text className="text-neon-green text-xs font-bold uppercase tracking-widest mb-1">Auswertung</Text>
        <Text className="text-ink-primary text-3xl font-black mb-1">Dein Spielerprofil</Text>
        <Text className="text-ink-secondary text-sm mb-6">Basierend auf deinen Antworten wurde dein Trainingsplan erstellt.</Text>

        {/* Score Bars */}
        {categories.map(({ key, label }) => {
          const score = scores[key] ?? 0;
          const color = getColor(score);
          return (
            <View key={key} className="mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-ink-secondary text-sm">{label}</Text>
                <Text className="text-sm font-bold" style={{ color }}>{score}/100</Text>
              </View>
              <View className="bg-bg-elevated rounded-full h-2 overflow-hidden">
                <View
                  className="h-2 rounded-full"
                  style={{ width: `${score}%`, backgroundColor: color }}
                />
              </View>
            </View>
          );
        })}

        {/* Schwächen & Stärken */}
        <View className="flex-row gap-3 mt-6">
          <View className="flex-1 bg-bg-card rounded-2xl p-4">
            <Text className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#ef4444' }}>
              Fokus-Bereiche
            </Text>
            {weaknesses.map((w: string) => (
              <View key={w} className="flex-row items-center gap-2 mb-1">
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                <Text className="text-ink-secondary text-xs">{w}</Text>
              </View>
            ))}
          </View>
          <View className="flex-1 bg-bg-card rounded-2xl p-4">
            <Text className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#FF6535' }}>
              Stärken
            </Text>
            {strengths.map((s: string) => (
              <View key={s} className="flex-row items-center gap-2 mb-1">
                <View className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                <Text className="text-ink-secondary text-xs">{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Plan Info */}
        <View className="bg-bg-card border border-neon-green rounded-xl p-4 mt-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="checkmark-circle" size={18} color="#FF6535" />
            <Text className="text-neon-green font-bold text-sm">Plan wurde erstellt</Text>
          </View>
          <Text className="text-ink-primary font-semibold">{result.plan.name}</Text>
          <Text className="text-ink-muted text-xs mt-1">
            {result.plan.days.length} Trainingstage · {result.plan.durationWeeks} Wochen
          </Text>
        </View>

        <TouchableOpacity
          className="rounded-xl py-4 items-center mt-5 mb-8"
          style={{ backgroundColor: '#FF6535' }}
          onPress={onClose}
        >
          <Text className="text-bg-base font-bold tracking-wide">TRAINING STARTEN</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Haupt-Modal ──────────────────────────────────────────────────────
export function AssessmentModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ ...DEFAULT });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const step = STEPS[stepIndex];
  const isLast = step === 'result';
  const progress = stepIndex / (STEPS.length - 1);

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    if (step === 'mental') {
      // Assessment absenden
      setLoading(true);
      try {
        const { data } = await api.post('/training/assess', answers);
        setResult(data);
        setStepIndex(stepIndex + 1);
      } catch (err: any) {
        Alert.alert('Fehler', err?.response?.data?.error ?? 'Auswertung fehlgeschlagen');
      }
      setLoading(false);
    } else if (step === 'result') {
      onDone();
      onClose();
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex === 0) onClose();
    else setStepIndex(stepIndex - 1);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-bg-base">
        {/* Header */}
        <View className="px-5 py-4 border-b border-bg-border">
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity onPress={handleBack} className="flex-row items-center gap-1">
              <Ionicons name="arrow-back" size={16} color="#8A8A8A" />
              <Text className="text-ink-secondary text-sm">
                {stepIndex === 0 ? 'Abbrechen' : 'Zurück'}
              </Text>
            </TouchableOpacity>
            <Text className="text-ink-muted text-xs">
              {stepIndex + 1} / {STEPS.length}
            </Text>
            <View className="w-16" />
          </View>
          {/* Progress Bar */}
          <View className="bg-bg-elevated rounded-full h-1 overflow-hidden">
            <View
              className="bg-neon-green h-1 rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </View>
        </View>

        {/* Content */}
        {step === 'result' && result ? (
          <ResultScreen result={result} onClose={() => { onDone(); onClose(); }} />
        ) : (
          <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
            {step === 'general' && (
              <>
                <SectionHeader title="Lass uns starten" subtitle="Schritt 1 — Allgemein" />
                <ChoiceInput
                  label="Wie viele Stunden pro Woche kannst du trainieren?"
                  value={String(answers.weeklyHours) as any}
                  onChange={(v) => set('weeklyHours', parseInt(v))}
                  options={[
                    { value: '1', label: '1 Std' },
                    { value: '2', label: '2 Std' },
                    { value: '4', label: '4 Std' },
                    { value: '6', label: '6 Std' },
                    { value: '8', label: '8+ Std' },
                  ]}
                />
                <ChoiceInput
                  label="Was ist dein Hauptziel?"
                  value={answers.mainGoal}
                  onChange={(v) => set('mainGoal', v)}
                  options={[
                    { value: 'handicap', label: 'Handicap verbessern' },
                    { value: 'consistency', label: 'Konstanter spielen' },
                    { value: 'compete', label: 'Wettkämpfe' },
                    { value: 'enjoyment', label: 'Mehr Spaß' },
                  ]}
                />
              </>
            )}

            {step === 'putting' && (
              <>
                <SectionHeader title="Putting" subtitle="Schritt 2 — Putting" />
                <StepperInput
                  label="Wie viele Putts machst du durchschnittlich pro Runde?"
                  value={answers.puttsPerRound}
                  onChange={(v) => set('puttsPerRound', v)}
                  min={18} max={50} unit="Putts/Runde"
                />
                <ScaleInput
                  label="Wie sicher bist du bei Putts unter 1.5 Meter?"
                  value={answers.shortPuttConfidence}
                  onChange={(v) => set('shortPuttConfidence', v)}
                  lowLabel="sehr unsicher" highLabel="sehr sicher"
                />
                <ChoiceInput
                  label="Was ist dein häufigster Fehler beim Putten?"
                  value={answers.puttingMiss}
                  onChange={(v) => set('puttingMiss', v)}
                  options={[
                    { value: 'distance', label: 'Distanz zu weit/kurz' },
                    { value: 'line', label: 'Linie falsch gelesen' },
                    { value: 'both', label: 'Beides' },
                    { value: 'none', label: 'Kein spez. Fehler' },
                  ]}
                />
              </>
            )}

            {step === 'shortgame' && (
              <>
                <SectionHeader title="Kurzspiel" subtitle="Schritt 3 — Kurzspiel" />
                <StepperInput
                  label="Wie oft gelingt dir ein Up & Down?"
                  value={answers.upAndDownPercent}
                  onChange={(v) => set('upAndDownPercent', v)}
                  min={0} max={100} unit="% der Versuche" step={5}
                />
                <ScaleInput
                  label="Wie sicher fühlst du dich im Bunker?"
                  value={answers.bunkerConfidence}
                  onChange={(v) => set('bunkerConfidence', v)}
                  lowLabel="sehr unsicher" highLabel="sehr sicher"
                />
                <ChoiceInput
                  label="Was ist dein häufigster Fehler beim Chippen?"
                  value={answers.chippingMiss}
                  onChange={(v) => set('chippingMiss', v)}
                  options={[
                    { value: 'thin', label: 'Dünn / gebladed' },
                    { value: 'fat', label: 'Fett / hinter Ball' },
                    { value: 'direction', label: 'Richtung falsch' },
                    { value: 'none', label: 'Kein spez. Fehler' },
                  ]}
                />
              </>
            )}

            {step === 'iron' && (
              <>
                <SectionHeader title="Eisenspiel" subtitle="Schritt 4 — Eisenspiel" />
                <StepperInput
                  label="Wie oft triffst du das Grün in Regulation (GIR)?"
                  value={answers.girPercent}
                  onChange={(v) => set('girPercent', v)}
                  min={0} max={100} unit="% GIR" step={5}
                />
                <ScaleInput
                  label="Wie konsistent ist dein Eisenspiel?"
                  value={answers.ironConsistency}
                  onChange={(v) => set('ironConsistency', v)}
                  lowLabel="sehr inkonsistent" highLabel="sehr konsistent"
                />
                <ChoiceInput
                  label="In welche Richtung verfehlt du das Ziel meistens?"
                  value={answers.ironMiss}
                  onChange={(v) => set('ironMiss', v)}
                  options={[
                    { value: 'left', label: 'Links' },
                    { value: 'right', label: 'Rechts' },
                    { value: 'short', label: 'Zu kurz' },
                    { value: 'long', label: 'Zu lang' },
                    { value: 'inconsistent', label: 'Unregelmäßig' },
                  ]}
                />
              </>
            )}

            {step === 'driving' && (
              <>
                <SectionHeader title="Driver & Abschlag" subtitle="Schritt 5 — Driver" />
                <StepperInput
                  label="Wie oft triffst du das Fairway (FIR)?"
                  value={answers.firPercent}
                  onChange={(v) => set('firPercent', v)}
                  min={0} max={100} unit="% FIR" step={5}
                />
                <ScaleInput
                  label="Wie selbstsicher bist du mit dem Driver?"
                  value={answers.driverConfidence}
                  onChange={(v) => set('driverConfidence', v)}
                  lowLabel="sehr unsicher" highLabel="sehr sicher"
                />
                <ChoiceInput
                  label="Was ist dein häufigster Fehler mit dem Driver?"
                  value={answers.driverMiss}
                  onChange={(v) => set('driverMiss', v)}
                  options={[
                    { value: 'slice', label: 'Slice (rechts)' },
                    { value: 'hook', label: 'Hook (links)' },
                    { value: 'left', label: 'Links (gerade)' },
                    { value: 'right', label: 'Rechts (gerade)' },
                    { value: 'distance', label: 'Zu kurz' },
                    { value: 'none', label: 'Kein Fehler' },
                  ]}
                />
              </>
            )}

            {step === 'mental' && (
              <>
                <SectionHeader title="Mental & Strategie" subtitle="Schritt 6 — Mental" />
                <ScaleInput
                  label="Wie gut kennst du deine genauen Schlägerdistanzen?"
                  value={answers.knowsDistances}
                  onChange={(v) => set('knowsDistances', v)}
                  lowLabel="kaum" highLabel="sehr genau"
                />
                <ScaleInput
                  label="Planst du deine Schläge strategisch (Lay-up, sichere Seite)?"
                  value={answers.playsStrategically}
                  onChange={(v) => set('playsStrategically', v)}
                  lowLabel="selten" highLabel="immer"
                />
                <ScaleInput
                  label="Wie gut gehst du mit Drucksituationen um?"
                  value={answers.handlesPressure}
                  onChange={(v) => set('handlesPressure', v)}
                  lowLabel="schlecht" highLabel="sehr gut"
                />
                <ScaleInput
                  label="Kannst du dich nach schlechten Löchern schnell erholen?"
                  value={answers.recoversFromBadHoles}
                  onChange={(v) => set('recoversFromBadHoles', v)}
                  lowLabel="schwer" highLabel="sehr schnell"
                />
              </>
            )}

            <View className="h-4" />
          </ScrollView>
        )}

        {/* Footer Button */}
        {step !== 'result' && (
          <View className="px-5 pb-5 pt-3 border-t border-bg-border">
            <TouchableOpacity
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: '#FF6535', opacity: loading ? 0.7 : 1 }}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#0A0A0A" />
                  <Text className="text-bg-base font-bold">PLAN WIRD ERSTELLT...</Text>
                </View>
              ) : (
                <Text className="text-bg-base font-bold tracking-wide">
                  {step === 'mental' ? 'PLAN ERSTELLEN →' : 'WEITER →'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
