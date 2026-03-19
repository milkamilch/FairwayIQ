import { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutSummary, BadgeDefinition, StreakData } from '../store/trainingStore';
import { useTheme } from '../lib/theme';

// ── Typen ──────────────────────────────────────────────────────────────
export interface FeedbackResult {
  feeling: number;
  difficulty: number;
  notes?: string;
}

export interface AdaptationSuggestion {
  direction: 'harder' | 'easier' | null;
  message: string;
}

interface Props {
  dayTitle: string;
  dayNumber: number;
  totalMinutes: number;
  onSubmit: (feedback: FeedbackResult) => Promise<{ adaptation: AdaptationSuggestion; summary: WorkoutSummary | null; streak: StreakData; newBadges: BadgeDefinition[] }>;
  onClose: () => void;
}

// ── Feeling-Skala (emoji + label) ──────────────────────────────────────
const FEELINGS = [
  { value: 1, emoji: '😓', label: 'Schlecht' },
  { value: 2, emoji: '😕', label: 'Mäßig' },
  { value: 3, emoji: '😊', label: 'Okay' },
  { value: 4, emoji: '💪', label: 'Gut' },
  { value: 5, emoji: '🔥', label: 'Großartig' },
] as const;

// ── Belastungs-Skala ────────────────────────────────────────────────────
const DIFFICULTIES = [
  { value: 1, label: 'Zu leicht', sublabel: 'Kaum Anstrengung', color: '#22d3ee' },
  { value: 2, label: 'Leicht', sublabel: 'Etwas Anstrengung', color: '#6ee7b7' },
  { value: 3, label: 'Perfekt', sublabel: 'Genau richtig', color: '#00e87a' },
  { value: 4, label: 'Anspruchsvoll', sublabel: 'Spürbar fordernd', color: '#f59e0b' },
  { value: 5, label: 'Zu schwer', sublabel: 'Sehr erschöpfend', color: '#f97316' },
] as const;

// ── Mood-Metadaten ──────────────────────────────────────────────────────
const MOOD_META: Record<WorkoutSummary['mood'], { emoji: string; label: string; color: string }> = {
  excellent: { emoji: '🔥', label: 'Ausgezeichnete Einheit!', color: '#00e87a' },
  good:      { emoji: '💪', label: 'Starkes Training!',       color: '#6ee7b7' },
  okay:      { emoji: '😊', label: 'Solide Einheit',          color: '#f59e0b' },
  tough:     { emoji: '😓', label: 'Harter Tag — gut gemacht!', color: '#f97316' },
};

// ── Haupt-Komponente ───────────────────────────────────────────────────
export function SessionFeedbackModal({ dayTitle, dayNumber, totalMinutes, onSubmit, onClose }: Props) {
  const [feeling, setFeeling] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'feedback' | 'summary' | 'badges' | 'adaptation'>('feedback');
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [adaptation, setAdaptation] = useState<AdaptationSuggestion | null>(null);
  const [newBadges, setNewBadges] = useState<BadgeDefinition[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const c = useTheme();

  const selectedFeeling = FEELINGS.find((f) => f.value === feeling)!;
  const selectedDifficulty = DIFFICULTIES.find((d) => d.value === difficulty)!;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await onSubmit({ feeling, difficulty, notes: notes.trim() || undefined });
      setSummary(result.summary);
      setAdaptation(result.adaptation);
      setNewBadges(result.newBadges ?? []);
      setStreak(result.streak ?? null);
      if (result.summary) {
        setStep('summary');
      } else if ((result.newBadges ?? []).length > 0) {
        setStep('badges');
      } else if (result.adaptation.direction !== null) {
        setStep('adaptation');
      } else {
        onClose();
      }
    } catch {
      onClose();
    }
    setLoading(false);
  };

  const handleSummaryNext = () => {
    if (newBadges.length > 0) {
      setStep('badges');
    } else if (adaptation?.direction !== null) {
      setStep('adaptation');
    } else {
      onClose();
    }
  };

  const handleBadgesNext = () => {
    if (adaptation?.direction !== null) {
      setStep('adaptation');
    } else {
      onClose();
    }
  };

  // ── Adaptation Screen ───────────────────────────────────────────────
  if (step === 'adaptation' && adaptation) {
    const isHarder = adaptation.direction === 'harder';
    return (
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <SafeAreaView className="flex-1 bg-bg-base items-center justify-center px-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: isHarder ? '#00e87a20' : '#f59e0b20' }}
          >
            <Text style={{ fontSize: 40 }}>{isHarder ? '🚀' : '🎯'}</Text>
          </View>

          <Text className="text-ink-primary font-bold text-xl text-center mb-3">
            {isHarder ? 'Bereit für mehr?' : 'Kurs anpassen'}
          </Text>
          <Text className="text-ink-secondary text-sm text-center leading-6 mb-8">
            {adaptation.message}
          </Text>

          <View className="w-full gap-3">
            <TouchableOpacity
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: isHarder ? '#00e87a' : '#f59e0b' }}
              onPress={onClose}
            >
              <Text className="text-bg-base font-bold">
                {isHarder ? 'Ja, intensiver bitte!' : 'Ja, etwas leichter'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="rounded-xl py-4 items-center border border-bg-border" onPress={onClose}>
              <Text className="text-ink-secondary font-semibold">Nein, Plan beibehalten</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // ── Badge Unlock Screen ─────────────────────────────────────────────
  if (step === 'badges' && newBadges.length > 0) {
    return (
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <SafeAreaView className="flex-1 bg-bg-base">
          <View className="px-5 py-4 border-b border-bg-border flex-row items-center justify-between">
            <View className="w-16" />
            <Text className="text-ink-primary font-bold">Badge verdient!</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={c.inkMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Text style={{ fontSize: 56, marginBottom: 12 }}>🏅</Text>
            <Text className="text-ink-primary font-bold text-2xl text-center mb-2">
              {newBadges.length === 1 ? 'Neuer Badge!' : `${newBadges.length} neue Badges!`}
            </Text>
            <Text className="text-ink-secondary text-sm text-center mb-8">
              {newBadges.length === 1 ? 'Du hast eine neue Auszeichnung erhalten.' : 'Du hast neue Auszeichnungen erhalten.'}
            </Text>

            {/* Badge cards */}
            <View className="w-full gap-4">
              {newBadges.map((badge) => (
                <View
                  key={badge.id}
                  className="rounded-2xl p-5 flex-row items-center gap-4"
                  style={{ backgroundColor: badge.color + '15', borderWidth: 1, borderColor: badge.color + '40' }}
                >
                  <View
                    className="w-16 h-16 rounded-2xl items-center justify-center shrink-0"
                    style={{ backgroundColor: badge.color + '25' }}
                  >
                    <Text style={{ fontSize: 32 }}>{badge.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-base" style={{ color: badge.color }}>{badge.name}</Text>
                    <Text className="text-ink-secondary text-sm mt-1 leading-5">{badge.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Streak bonus */}
            {streak && streak.currentStreak > 1 && (
              <View
                className="w-full mt-4 rounded-xl px-4 py-3 flex-row items-center gap-3"
                style={{ backgroundColor: '#f9730315', borderWidth: 1, borderColor: '#f9730330' }}
              >
                <Text style={{ fontSize: 24 }}>🔥</Text>
                <View>
                  <Text className="font-bold text-sm" style={{ color: '#f97316' }}>{streak.currentStreak}-Tage-Streak!</Text>
                  <Text className="text-ink-muted text-xs">Weiter so — du bist auf einem guten Weg.</Text>
                </View>
              </View>
            )}

            <View className="h-8" />
          </ScrollView>

          <View className="px-5 pb-4 border-t border-bg-border pt-4">
            <TouchableOpacity
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: '#00e87a' }}
              onPress={handleBadgesNext}
            >
              <Text className="text-bg-base font-bold tracking-wide">
                {adaptation?.direction !== null ? 'WEITER' : 'FERTIG'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // ── Summary Screen ──────────────────────────────────────────────────
  if (step === 'summary' && summary) {
    const mood = MOOD_META[summary.mood];
    return (
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <SafeAreaView className="flex-1 bg-bg-base">
          {/* Header */}
          <View className="px-5 py-4 border-b border-bg-border flex-row items-center justify-between">
            <View className="w-16" />
            <View className="items-center">
              <Text className="text-ink-primary font-bold">Einheiten-Analyse</Text>
              <Text className="text-ink-muted text-xs">Tag {dayNumber} · {totalMinutes} Min</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={c.inkMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
            {/* Mood Banner */}
            <View
              className="rounded-2xl p-5 items-center"
              style={{ backgroundColor: mood.color + '12', borderWidth: 1, borderColor: mood.color + '30' }}
            >
              <Text style={{ fontSize: 48, marginBottom: 8 }}>{mood.emoji}</Text>
              <Text className="font-bold text-xl text-center" style={{ color: mood.color }}>{mood.label}</Text>
              <Text className="text-ink-secondary text-sm text-center mt-1">{dayTitle}</Text>
            </View>

            {/* Was gut lief */}
            <View className="bg-bg-card border border-bg-border rounded-xl p-4 gap-3">
              <View className="flex-row items-center gap-2 mb-1">
                <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: '#00e87a20' }}>
                  <Ionicons name="checkmark" size={14} color="#00e87a" />
                </View>
                <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Was gut lief</Text>
              </View>
              {summary.highlights.map((h, i) => (
                <View key={i} className="flex-row items-start gap-3">
                  <View className="w-5 h-5 rounded-full items-center justify-center mt-0.5 shrink-0" style={{ backgroundColor: '#00e87a15' }}>
                    <Text style={{ color: '#00e87a', fontSize: 10 }}>✓</Text>
                  </View>
                  <Text className="text-ink-primary text-sm leading-5 flex-1">{h}</Text>
                </View>
              ))}
            </View>

            {/* Worauf du achten solltest */}
            {summary.focusPoints.length > 0 && (
              <View className="bg-bg-card border border-bg-border rounded-xl p-4 gap-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: '#f59e0b20' }}>
                    <Ionicons name="eye-outline" size={14} color="#f59e0b" />
                  </View>
                  <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Worauf du achten solltest</Text>
                </View>
                {summary.focusPoints.map((fp, i) => (
                  <View key={i} className="flex-row items-start gap-3">
                    <View className="w-5 h-5 rounded-full items-center justify-center mt-0.5 shrink-0" style={{ backgroundColor: '#f59e0b15' }}>
                      <Ionicons name="arrow-forward" size={10} color="#f59e0b" />
                    </View>
                    <Text className="text-ink-secondary text-sm leading-5 flex-1">{fp}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tipp für die nächste Einheit */}
            <View
              className="rounded-xl p-4"
              style={{ backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.bgBorder }}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="bulb-outline" size={16} color="#a78bfa" />
                <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a78bfa' }}>Tipp für die nächste Einheit</Text>
              </View>
              <Text className="text-ink-secondary text-sm leading-5">{summary.nextTip}</Text>
            </View>

            <View className="h-4" />
          </ScrollView>

          {/* CTA */}
          <View className="px-5 pb-4 border-t border-bg-border pt-4">
            <TouchableOpacity
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: '#00e87a' }}
              onPress={handleSummaryNext}
            >
              <Text className="text-bg-base font-bold tracking-wide">
                {adaptation?.direction !== null ? 'WEITER' : 'FERTIG'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // ── Feedback Screen ─────────────────────────────────────────────────
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-bg-base">
        {/* Header */}
        <View className="px-5 py-4 border-b border-bg-border flex-row items-center justify-between">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-ink-secondary text-sm">Überspringen</Text>
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-ink-primary font-bold">Training abgeschlossen</Text>
            <Text className="text-ink-muted text-xs">Tag {dayNumber} · {totalMinutes} Min</Text>
          </View>
          <View className="w-16" />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, gap: 28 }}>
          {/* Checkmark Banner */}
          <View
            className="rounded-2xl p-5 items-center"
            style={{ backgroundColor: '#00e87a12', borderWidth: 1, borderColor: '#00e87a30' }}
          >
            <View
              className="w-14 h-14 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: '#00e87a' }}
            >
              <Ionicons name="checkmark" size={30} color="#07070f" />
            </View>
            <Text className="text-ink-primary font-bold text-base">{dayTitle}</Text>
            <Text className="text-ink-secondary text-xs mt-1">erfolgreich trainiert</Text>
          </View>

          {/* Feeling */}
          <View>
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-4">
              Wie hast du dich gefühlt?
            </Text>
            <View className="flex-row justify-between gap-2">
              {FEELINGS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  className="flex-1 items-center rounded-xl py-3"
                  style={{
                    backgroundColor: feeling === f.value ? c.neonGreen20 : c.bgCard,
                    borderWidth: 1,
                    borderColor: feeling === f.value ? '#00e87a' : c.bgBorder,
                  }}
                  onPress={() => setFeeling(f.value)}
                >
                  <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
                  <Text
                    className="text-xs mt-1 font-semibold"
                    style={{ color: feeling === f.value ? '#00e87a' : c.inkMuted }}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Difficulty / Belastung */}
          <View>
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-4">
              Wie anspruchsvoll war es?
            </Text>

            {/* Visual slider row */}
            <View className="flex-row gap-1.5 mb-3">
              {DIFFICULTIES.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  className="flex-1 h-10 rounded-lg items-center justify-center"
                  style={{
                    backgroundColor: difficulty >= d.value ? d.color + '30' : c.bgCard,
                    borderWidth: 1,
                    borderColor: difficulty === d.value ? d.color : c.bgBorder,
                  }}
                  onPress={() => setDifficulty(d.value)}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: difficulty >= d.value ? d.color : c.inkMuted }}
                  >
                    {d.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selected label */}
            <View className="flex-row items-center gap-2">
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedDifficulty.color }}
              />
              <Text className="text-sm font-semibold" style={{ color: selectedDifficulty.color }}>
                {selectedDifficulty.label}
              </Text>
              <Text className="text-ink-muted text-xs">— {selectedDifficulty.sublabel}</Text>
            </View>
          </View>

          {/* Notes */}
          <View>
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-3">
              Notizen (optional)
            </Text>
            <TextInput
              className="bg-bg-elevated border border-bg-border text-ink-primary rounded-xl px-4 py-3 text-sm"
              style={{ minHeight: 80, textAlignVertical: 'top' }}
              placeholder="Was lief gut? Was war schwierig?"
              placeholderTextColor="#44445a"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* Stats preview */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-bg-card border border-bg-border rounded-xl p-3 items-center">
              <Text className="text-2xl mb-1">{selectedFeeling.emoji}</Text>
              <Text className="text-ink-muted text-xs">Gefühl</Text>
              <Text className="text-ink-primary text-sm font-semibold">{selectedFeeling.label}</Text>
            </View>
            <View className="flex-1 bg-bg-card border border-bg-border rounded-xl p-3 items-center">
              <Text className="text-2xl font-bold mb-1" style={{ color: selectedDifficulty.color }}>
                {difficulty}/5
              </Text>
              <Text className="text-ink-muted text-xs">Belastung</Text>
              <Text className="text-ink-primary text-sm font-semibold">{selectedDifficulty.label}</Text>
            </View>
          </View>

          <View className="h-4" />
        </ScrollView>

        {/* Submit */}
        <View className="px-5 pb-4 border-t border-bg-border pt-4">
          <TouchableOpacity
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: loading ? '#00e87a60' : '#00e87a' }}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#07070f" />
              : <Text className="text-bg-base font-bold tracking-wide">SPEICHERN</Text>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
