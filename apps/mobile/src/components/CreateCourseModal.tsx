import { useState, useCallback } from 'react';
import {
  View, Text, Modal, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchGolfCourses, OsmCourse } from '../lib/osmCourseSearch';
import { api } from '../lib/api';

// ── Typen ────────────────────────────────────────────────────────────
interface HoleSetup {
  number: number;
  par: 3 | 4 | 5;
  distanceMeters: number;
  strokeIndex: number;
}

type TeeColor = 'yellow' | 'blue' | 'red' | 'white';

interface TeeSetup {
  color: TeeColor;
  name: string;
  rating: string;
  slope: string;
  distances: Record<number, string>; // holeNumber → meters
}

const TEE_OPTIONS: { color: TeeColor; label: string; hex: string }[] = [
  { color: 'yellow', label: 'Gelb',  hex: '#EAB308' },
  { color: 'blue',   label: 'Blau',  hex: '#3B82F6' },
  { color: 'red',    label: 'Rot',   hex: '#EF4444' },
  { color: 'white',  label: 'Weiß',  hex: '#E5E7EB' },
];

function buildDefaultHoles(): HoleSetup[] {
  const defaultPars: (3 | 4 | 5)[] = [4,4,3,4,4,5,3,4,5, 4,3,4,5,4,4,3,5,4];
  return Array.from({ length: 18 }, (_, i) => ({
    number: i + 1,
    par: defaultPars[i],
    distanceMeters: defaultPars[i] === 3 ? 150 : defaultPars[i] === 4 ? 360 : 490,
    strokeIndex: i + 1,
  }));
}

function buildDefaultTee(color: TeeColor, holes: HoleSetup[]): TeeSetup {
  const meta = TEE_OPTIONS.find((t) => t.color === color)!;
  const distScale = color === 'blue' ? 1.05 : color === 'white' ? 1.1 : color === 'red' ? 0.9 : 1;
  return {
    color,
    name: meta.label,
    rating: '',
    slope: '',
    distances: Object.fromEntries(
      holes.map((h) => [h.number, String(Math.round(h.distanceMeters * distScale))])
    ),
  };
}

// ── Schritt 1: Suche ──────────────────────────────────────────────────
function SearchStep({ onSelect, onManual }: {
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
      Alert.alert('Fehler', 'Suche fehlgeschlagen.');
    }
    setLoading(false);
  }, [query]);

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#8A8A8A', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
        Platz suchen
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TextInput
          style={{ flex: 1, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2E2E2E', color: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 }}
          placeholder="z.B. Golf Hamburg, Gut Kaden..."
          placeholderTextColor="#444444"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity
          style={{ width: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF6535' }}
          onPress={search}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#0A0A0A" />
            : <Ionicons name="search" size={18} color="#0A0A0A" />
          }
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!loading && searched && results.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
            <Ionicons name="search-outline" size={32} color="#2E2E2E" />
            <Text style={{ color: '#8A8A8A', fontSize: 13 }}>Keine Ergebnisse für „{query}"</Text>
          </View>
        )}
        {results.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={{ backgroundColor: '#111111', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            onPress={() => onSelect(course)}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="flag-outline" size={16} color="#FF6535" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>{course.name}</Text>
              <Text style={{ color: '#555555', fontSize: 12, marginTop: 2 }}>{course.location}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#444444" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: '#2E2E2E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          onPress={onManual}
        >
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={16} color="#8A8A8A" />
          </View>
          <View>
            <Text style={{ color: '#8A8A8A', fontWeight: '500', fontSize: 14 }}>Manuell anlegen</Text>
            <Text style={{ color: '#444444', fontSize: 12 }}>Platz nicht gefunden?</Text>
          </View>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Schritt 2: Info + Tees ────────────────────────────────────────────
function InfoStep({
  courseName, courseLocation, isPublic, activeTees, holes,
  onNameChange, onLocationChange, onPublicChange,
  onToggleTee, onTeeFieldChange, onTeeDistanceChange,
  onNext, onHoleChange,
}: {
  courseName: string;
  courseLocation: string;
  isPublic: boolean;
  activeTees: TeeSetup[];
  holes: HoleSetup[];
  onNameChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onPublicChange: (v: boolean) => void;
  onToggleTee: (color: TeeColor) => void;
  onTeeFieldChange: (color: TeeColor, field: 'rating' | 'slope', value: string) => void;
  onTeeDistanceChange: (color: TeeColor, holeNumber: number, value: string) => void;
  onNext: () => void;
  onHoleChange: (index: number, field: 'par' | 'distanceMeters', value: number) => void;
}) {
  const inputStyle = { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2E2E2E', color: '#FFFFFF' as const, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 };
  const labelStyle = { color: '#8A8A8A', fontSize: 11, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 8 };
  const totalPar = holes.reduce((s, h) => s + h.par, 0);

  // Aktiver Tee für Distanz-Eingabe
  const [activeTeeTab, setActiveTeeTab] = useState<TeeColor | null>(activeTees[0]?.color ?? null);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Platz-Info */}
      <View style={{ gap: 16, marginBottom: 24 }}>
        <View>
          <Text style={labelStyle}>Platzname</Text>
          <TextInput style={inputStyle} value={courseName} onChangeText={onNameChange} placeholderTextColor="#444444" placeholder="z.B. GC München" />
        </View>
        <View>
          <Text style={labelStyle}>Standort</Text>
          <TextInput style={inputStyle} value={courseLocation} onChangeText={onLocationChange} placeholderTextColor="#444444" placeholder="Stadt, Land" />
        </View>

        {/* Öffentlich */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111111', borderRadius: 12, borderWidth: 1, borderColor: '#2E2E2E', paddingHorizontal: 16, paddingVertical: 14 }}>
          <View>
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Platz veröffentlichen</Text>
            <Text style={{ color: '#555555', fontSize: 12, marginTop: 2 }}>Für alle FairwayIQ-Nutzer sichtbar</Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={onPublicChange}
            trackColor={{ false: '#2E2E2E', true: '#FF653560' }}
            thumbColor={isPublic ? '#FF6535' : '#555555'}
          />
        </View>
      </View>

      {/* Tee-Auswahl */}
      <View style={{ marginBottom: 24 }}>
        <Text style={labelStyle}>Abschlagpositionen</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {TEE_OPTIONS.map((opt) => {
            const isActive = activeTees.some((t) => t.color === opt.color);
            return (
              <TouchableOpacity
                key={opt.color}
                onPress={() => onToggleTee(opt.color)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', gap: 4,
                  backgroundColor: isActive ? opt.hex + '25' : '#1A1A1A',
                  borderWidth: 1.5,
                  borderColor: isActive ? opt.hex : '#2E2E2E',
                }}
              >
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: opt.hex }} />
                <Text style={{ color: isActive ? opt.hex : '#555555', fontSize: 11, fontWeight: '700' }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CR / Slope pro Tee */}
        {activeTees.length > 0 && (
          <View style={{ gap: 10 }}>
            {activeTees.map((tee) => {
              const meta = TEE_OPTIONS.find((o) => o.color === tee.color)!;
              return (
                <View key={tee.color} style={{ backgroundColor: '#111111', borderRadius: 12, borderWidth: 1, borderColor: meta.hex + '40', padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: meta.hex }} />
                    <Text style={{ color: meta.hex, fontWeight: '700', fontSize: 13 }}>{tee.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#555555', fontSize: 10, fontWeight: '600', marginBottom: 4 }}>COURSE RATING</Text>
                      <TextInput
                        style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2E2E2E', color: '#FFFFFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 }}
                        value={tee.rating}
                        onChangeText={(v) => onTeeFieldChange(tee.color, 'rating', v)}
                        keyboardType="decimal-pad"
                        placeholder="71.5"
                        placeholderTextColor="#444444"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#555555', fontSize: 10, fontWeight: '600', marginBottom: 4 }}>SLOPE</Text>
                      <TextInput
                        style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2E2E2E', color: '#FFFFFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 }}
                        value={tee.slope}
                        onChangeText={(v) => onTeeFieldChange(tee.color, 'slope', v)}
                        keyboardType="number-pad"
                        placeholder="125"
                        placeholderTextColor="#444444"
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Löcher */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={labelStyle}>18 Löcher</Text>
        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#1A1A1A' }}>
          <Text style={{ color: '#FF6535', fontSize: 11, fontWeight: '700' }}>Par {totalPar}</Text>
        </View>
      </View>

      {/* Tee-Tab für Distanzen */}
      {activeTees.length > 1 && (
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setActiveTeeTab(null)}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: activeTeeTab === null ? '#FF6535' : '#1A1A1A', borderWidth: 1, borderColor: activeTeeTab === null ? '#FF6535' : '#2E2E2E' }}
          >
            <Text style={{ color: activeTeeTab === null ? '#0A0A0A' : '#8A8A8A', fontSize: 11, fontWeight: '700' }}>Standard</Text>
          </TouchableOpacity>
          {activeTees.map((tee) => {
            const meta = TEE_OPTIONS.find((o) => o.color === tee.color)!;
            const isSelected = activeTeeTab === tee.color;
            return (
              <TouchableOpacity
                key={tee.color}
                onPress={() => setActiveTeeTab(tee.color)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: isSelected ? meta.hex + '25' : '#1A1A1A', borderWidth: 1, borderColor: isSelected ? meta.hex : '#2E2E2E' }}
              >
                <Text style={{ color: isSelected ? meta.hex : '#8A8A8A', fontSize: 11, fontWeight: '700' }}>{tee.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Vorder- und Hinterneun */}
      {([{ label: 'VORDERNEUN', range: [0, 9] }, { label: 'HINTERNEUN', range: [9, 18] }] as const).map(({ label, range }) => (
        <View key={label} style={{ backgroundColor: '#111111', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#2E2E2E', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#8A8A8A', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>{label}</Text>
            <Text style={{ color: '#555555', fontSize: 11 }}>
              Par {holes.slice(range[0], range[1]).reduce((s, h) => s + h.par, 0)}
            </Text>
          </View>

          {holes.slice(range[0], range[1]).map((hole, relIdx) => {
            const idx = range[0] + relIdx;
            const activeTeeData = activeTeeTab ? activeTees.find((t) => t.color === activeTeeTab) : null;
            const displayDist = activeTeeData
              ? (activeTeeData.distances[hole.number] ?? String(hole.distanceMeters))
              : String(hole.distanceMeters);

            return (
              <View key={hole.number} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ color: '#555555', fontSize: 11, fontWeight: '700' }}>{hole.number}</Text>
                </View>

                {/* Par Buttons */}
                <View style={{ flexDirection: 'row', gap: 6, marginRight: 14 }}>
                  {([3, 4, 5] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => onHoleChange(idx, 'par', p)}
                      style={{ width: 34, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: hole.par === p ? '#FF6535' : '#242424', borderWidth: 1, borderColor: hole.par === p ? '#FF6535' : '#2E2E2E' }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: hole.par === p ? '#0A0A0A' : '#555555' }}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Distanz */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <TextInput
                    style={{ flex: 1, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: activeTeeData ? (TEE_OPTIONS.find((o) => o.color === activeTeeTab)?.hex ?? '#2E2E2E') + '60' : '#2E2E2E', color: '#FFFFFF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 12, textAlign: 'center' }}
                    value={displayDist}
                    onChangeText={(v) => {
                      if (activeTeeData) {
                        onTeeDistanceChange(activeTeeData.color, hole.number, v);
                      } else {
                        onHoleChange(idx, 'distanceMeters', parseInt(v) || 0);
                      }
                    }}
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                  <Text style={{ color: '#555555', fontSize: 11 }}>m</Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <TouchableOpacity
        style={{ borderRadius: 12, paddingVertical: 16, alignItems: 'center', backgroundColor: '#FF6535', marginBottom: 32 }}
        onPress={onNext}
      >
        <Text style={{ color: '#0A0A0A', fontWeight: '700', letterSpacing: 0.5 }}>PLATZ ANLEGEN</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Haupt-Modal ──────────────────────────────────────────────────────
export function CreateCourseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<'search' | 'setup'>('search');
  const [courseName, setCourseName] = useState('');
  const [courseLocation, setCourseLocation] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [holes, setHoles] = useState<HoleSetup[]>(buildDefaultHoles());
  const [activeTees, setActiveTees] = useState<TeeSetup[]>([]);
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

  const toggleTee = (color: TeeColor) => {
    setActiveTees((prev) => {
      const exists = prev.some((t) => t.color === color);
      if (exists) return prev.filter((t) => t.color !== color);
      return [...prev, buildDefaultTee(color, holes)];
    });
  };

  const updateTeeField = (color: TeeColor, field: 'rating' | 'slope', value: string) => {
    setActiveTees((prev) => prev.map((t) => t.color === color ? { ...t, [field]: value } : t));
  };

  const updateTeeDistance = (color: TeeColor, holeNumber: number, value: string) => {
    setActiveTees((prev) => prev.map((t) =>
      t.color === color ? { ...t, distances: { ...t.distances, [holeNumber]: value } } : t
    ));
  };

  const handleSave = async () => {
    if (!courseName.trim()) { Alert.alert('Fehler', 'Bitte einen Platznamen eingeben'); return; }
    setSaving(true);
    try {
      await api.post('/courses', {
        name: courseName.trim(),
        location: courseLocation.trim() || 'Unbekannt',
        isPublic,
        holes: holes.map((h) => ({
          number: h.number,
          par: h.par,
          strokeIndex: h.strokeIndex,
          distanceMeters: h.distanceMeters,
          hazards: [],
        })),
        tees: activeTees.map((t) => ({
          name: t.name,
          color: t.color,
          rating: t.rating ? parseFloat(t.rating) : undefined,
          slope: t.slope ? parseInt(t.slope) : undefined,
          distances: Object.fromEntries(
            Object.entries(t.distances).map(([k, v]) => [k, parseInt(v) || 0])
          ),
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' }}>
          <TouchableOpacity onPress={step === 'search' ? onClose : () => setStep('search')}>
            {step === 'search'
              ? <Text style={{ color: '#8A8A8A', fontSize: 14 }}>Abbrechen</Text>
              : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="arrow-back" size={16} color="#8A8A8A" />
                  <Text style={{ color: '#8A8A8A', fontSize: 14 }}>Zurück</Text>
                </View>
            }
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Neuer Platz</Text>
            <Text style={{ color: '#555555', fontSize: 11 }}>
              {step === 'search' ? 'Schritt 1/2 · Suche' : 'Schritt 2/2 · Details'}
            </Text>
          </View>
          {step === 'setup' ? (
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#FF6535" />
                : <Text style={{ color: '#FF6535', fontWeight: '700', fontSize: 14 }}>Speichern</Text>
              }
            </TouchableOpacity>
          ) : (
            <View style={{ width: 64 }} />
          )}
        </View>

        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
          {step === 'search' ? (
            <SearchStep onSelect={handleSelect} onManual={handleManual} />
          ) : (
            <InfoStep
              courseName={courseName}
              courseLocation={courseLocation}
              isPublic={isPublic}
              activeTees={activeTees}
              holes={holes}
              onNameChange={setCourseName}
              onLocationChange={setCourseLocation}
              onPublicChange={setIsPublic}
              onToggleTee={toggleTee}
              onTeeFieldChange={updateTeeField}
              onTeeDistanceChange={updateTeeDistance}
              onHoleChange={updateHole}
              onNext={handleSave}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
