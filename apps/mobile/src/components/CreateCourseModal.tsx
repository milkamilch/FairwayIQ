import { useState, useCallback } from 'react';
import {
  View, Text, Modal, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchGolfCourses, OsmCourse } from '../lib/osmCourseSearch';
import { api } from '../lib/api';

interface HoleSetup {
  number: number;
  par: 3 | 4 | 5;
  distanceMeters: number;
  strokeIndex: number;
}

function buildDefaultHoles(): HoleSetup[] {
  // Standard-Pars für einen typischen Par-72 Platz
  const defaultPars: (3 | 4 | 5)[] = [4,4,3,4,4,5,3,4,5, 4,3,4,5,4,4,3,5,4];
  return Array.from({ length: 18 }, (_, i) => ({
    number: i + 1,
    par: defaultPars[i],
    distanceMeters: defaultPars[i] === 3 ? 150 : defaultPars[i] === 4 ? 360 : 490,
    strokeIndex: i + 1,
  }));
}

// ── Schritt 1: Suche ────────────────────────────────────────────────
function SearchStep({
  onSelect,
  onManual,
}: {
  onSelect: (course: OsmCourse) => void;
  onManual: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OsmCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const found = await searchGolfCourses(query.trim());
      setResults(found);
    } catch {
      Alert.alert('Fehler', 'Suche fehlgeschlagen. Prüfe deine Internetverbindung.');
    }
    setLoading(false);
  }, [query]);

  return (
    <View className="flex-1">
      <Text className="text-ink-secondary text-xs font-bold uppercase tracking-widest mb-3">
        Platz suchen
      </Text>

      {/* Suchfeld */}
      <View className="flex-row gap-2 mb-4">
        <TextInput
          className="flex-1 bg-bg-elevated border border-bg-border text-ink-primary rounded-xl px-4 py-3 text-sm"
          placeholder="z.B. Golf Hamburg, Gut Kaden..."
          placeholderTextColor="#444444"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity
          className="w-12 rounded-xl items-center justify-center"
          style={{ backgroundColor: '#FF6535' }}
          onPress={search}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#0A0A0A" />
            : <Ionicons name="search" size={18} color="#0A0A0A" />
          }
        </TouchableOpacity>
      </View>

      {/* Ergebnisse */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && (
          <View className="items-center py-8">
            <ActivityIndicator color="#FF6535" />
            <Text className="text-ink-muted text-sm mt-3">Suche auf OpenStreetMap...</Text>
          </View>
        )}

        {!loading && searched && results.length === 0 && (
          <View className="items-center py-8 gap-2">
            <Ionicons name="search-outline" size={32} color="#2E2E2E" />
            <Text className="text-ink-secondary text-sm">Keine Ergebnisse für "{query}"</Text>
            <Text className="text-ink-muted text-xs text-center">
              Versuche einen kürzeren Begriff oder gib den Platz manuell ein
            </Text>
          </View>
        )}

        {results.map((course) => (
          <TouchableOpacity
            key={course.id}
            className="bg-bg-card rounded-2xl px-4 py-4 mb-2 flex-row items-center gap-3"
            onPress={() => onSelect(course)}
          >
            <View className="w-9 h-9 rounded-lg bg-bg-elevated items-center justify-center">
              <Ionicons name="flag-outline" size={16} color="#FF6535" />
            </View>
            <View className="flex-1">
              <Text className="text-ink-primary font-semibold text-sm">{course.name}</Text>
              <Text className="text-ink-muted text-xs mt-0.5">{course.location}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#444444" />
          </TouchableOpacity>
        ))}

        {/* Manuell anlegen */}
        <TouchableOpacity
          className="border border-dashed border-bg-border rounded-xl px-4 py-4 mt-2 flex-row items-center gap-3"
          onPress={onManual}
        >
          <View className="w-9 h-9 rounded-lg bg-bg-elevated items-center justify-center">
            <Ionicons name="add" size={16} color="#8A8A8A" />
          </View>
          <View>
            <Text className="text-ink-secondary font-medium text-sm">Manuell anlegen</Text>
            <Text className="text-ink-muted text-xs">Platz nicht gefunden?</Text>
          </View>
        </TouchableOpacity>
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}

// ── Schritt 2: Loch-Setup ────────────────────────────────────────────
function HoleSetupStep({
  courseName,
  courseLocation,
  onNameChange,
  onLocationChange,
  holes,
  onHoleChange,
  onSave,
  saving,
}: {
  courseName: string;
  courseLocation: string;
  onNameChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  holes: HoleSetup[];
  onHoleChange: (index: number, field: 'par' | 'distanceMeters', value: number) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const totalPar = holes.reduce((s, h) => s + h.par, 0);
  const inputStyle = "bg-bg-elevated border border-bg-border text-ink-primary rounded-xl px-4 py-3 text-sm";
  const labelStyle = "text-ink-secondary text-xs font-bold uppercase tracking-widest mb-2";

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Platz-Info */}
      <View className="gap-4 mb-6">
        <View>
          <Text className={labelStyle}>Platzname</Text>
          <TextInput className={inputStyle} value={courseName} onChangeText={onNameChange} placeholderTextColor="#444444" />
        </View>
        <View>
          <Text className={labelStyle}>Standort</Text>
          <TextInput className={inputStyle} value={courseLocation} onChangeText={onLocationChange} placeholderTextColor="#444444" />
        </View>
      </View>

      {/* Löcher */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className={labelStyle + ' mb-0'}>18 Löcher</Text>
        <View className="px-2 py-1 rounded-lg bg-bg-elevated">
          <Text className="text-neon-green text-xs font-bold">Par {totalPar}</Text>
        </View>
      </View>

      {/* Vorder- und Hinterneun */}
      {[{ label: 'VORDERNEUN', range: [0, 9] }, { label: 'HINTERNEUN', range: [9, 18] }].map(({ label, range }) => (
        <View key={label} className="bg-bg-card rounded-2xl overflow-hidden mb-3">
          <View className="px-4 py-2 bg-bg-elevated border-b border-bg-border flex-row justify-between items-center">
            <Text className="text-ink-secondary text-xs font-bold tracking-widest">{label}</Text>
            <Text className="text-ink-muted text-xs">
              Par {holes.slice(range[0], range[1]).reduce((s, h) => s + h.par, 0)}
            </Text>
          </View>

          {holes.slice(range[0], range[1]).map((hole, relIdx) => {
            const idx = range[0] + relIdx;
            return (
              <View key={hole.number} className="flex-row items-center px-4 py-2.5 border-b border-bg-border">
                {/* Lochnummer */}
                <View className="w-7 h-7 rounded-lg bg-bg-elevated items-center justify-center mr-3">
                  <Text className="text-ink-muted text-xs font-bold">{hole.number}</Text>
                </View>

                {/* Par Buttons */}
                <View className="flex-row gap-1.5 mr-4">
                  {([3, 4, 5] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      className="w-9 h-8 rounded-lg items-center justify-center"
                      style={{
                        backgroundColor: hole.par === p ? '#FF6535' : '#242424',
                        borderWidth: 1,
                        borderColor: hole.par === p ? '#FF6535' : '#2E2E2E',
                      }}
                      onPress={() => onHoleChange(idx, 'par', p)}
                    >
                      <Text className="text-xs font-bold" style={{ color: hole.par === p ? '#0A0A0A' : '#8A8A8A' }}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Distanz */}
                <View className="flex-1 flex-row items-center gap-1">
                  <TextInput
                    className="flex-1 bg-bg-elevated border border-bg-border text-ink-primary rounded-lg px-2 py-1.5 text-xs text-center"
                    value={String(hole.distanceMeters)}
                    onChangeText={(v) => onHoleChange(idx, 'distanceMeters', parseInt(v) || 0)}
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                  <Text className="text-ink-muted text-xs">m</Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <TouchableOpacity
        className="rounded-xl py-4 items-center mb-8"
        style={{ backgroundColor: '#FF6535', opacity: saving ? 0.6 : 1 }}
        onPress={onSave}
        disabled={saving}
      >
        <Text className="text-bg-base font-bold tracking-wide">
          {saving ? 'SPEICHERN...' : 'PLATZ ANLEGEN'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Haupt-Modal ──────────────────────────────────────────────────────
export function CreateCourseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<'search' | 'setup'>('search');
  const [courseName, setCourseName] = useState('');
  const [courseLocation, setCourseLocation] = useState('');
  const [holes, setHoles] = useState<HoleSetup[]>(buildDefaultHoles());
  const [saving, setSaving] = useState(false);

  const handleSelect = (course: OsmCourse) => {
    setCourseName(course.name);
    setCourseLocation(course.location);
    setStep('setup');
  };

  const handleManual = () => {
    setCourseName('');
    setCourseLocation('');
    setStep('setup');
  };

  const updateHole = (index: number, field: 'par' | 'distanceMeters', value: number) => {
    setHoles((prev) => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const handleSave = async () => {
    if (!courseName.trim()) { Alert.alert('Fehler', 'Bitte einen Platznamen eingeben'); return; }
    setSaving(true);
    try {
      await api.post('/courses', {
        name: courseName.trim(),
        location: courseLocation.trim() || 'Unbekannt',
        holes: holes.map((h) => ({
          number: h.number,
          par: h.par,
          strokeIndex: h.strokeIndex,
          distanceMeters: h.distanceMeters,
          hazards: [],
        })),
      });
      onCreated();
      onClose();
    } catch {
      Alert.alert('Fehler', 'Platz konnte nicht gespeichert werden');
    }
    setSaving(false);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-bg-base">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-bg-border">
          <TouchableOpacity onPress={step === 'search' ? onClose : () => setStep('search')}>
            {step === 'search'
              ? <Text className="text-ink-secondary text-sm">Abbrechen</Text>
              : <View className="flex-row items-center gap-1">
                  <Ionicons name="arrow-back" size={16} color="#8A8A8A" />
                  <Text className="text-ink-secondary text-sm">Zurück</Text>
                </View>
            }
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-ink-primary font-bold">Neuer Platz</Text>
            <Text className="text-ink-muted text-xs">
              {step === 'search' ? 'Schritt 1/2 · Suche' : 'Schritt 2/2 · Löcher'}
            </Text>
          </View>
          <View className="w-16" />
        </View>

        <View className="flex-1 px-5 pt-5">
          {step === 'search' ? (
            <SearchStep onSelect={handleSelect} onManual={handleManual} />
          ) : (
            <HoleSetupStep
              courseName={courseName}
              courseLocation={courseLocation}
              onNameChange={setCourseName}
              onLocationChange={setCourseLocation}
              holes={holes}
              onHoleChange={updateHole}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
