import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';
import { Course } from '@fairwayiq/shared';
import { CreateCourseModal } from '../../src/components/CreateCourseModal';

const hazardIcons: Record<string, string> = { WATER: '💧', BUNKER: '⛱️', OB: '🚫', ROUGH: '🌿', TREES: '🌳' };

function HoleRow({ hole, onPress }: { hole: any; onPress: () => void }) {
  const hasStrategy = !!hole.strategy;
  return (
    <TouchableOpacity
      className="flex-row items-center py-3 px-4 border-b border-bg-border"
      onPress={onPress}
    >
      <View
        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
        style={{ backgroundColor: hasStrategy ? '#00e87a15' : '#14141f' }}
      >
        <Text className="text-xs font-bold" style={{ color: hasStrategy ? '#00e87a' : '#44445a' }}>
          {hole.number}
        </Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-ink-primary text-sm font-medium">Par {hole.par}</Text>
          <Text className="text-ink-muted text-xs">·</Text>
          <Text className="text-ink-muted text-xs">{hole.distanceMeters}m</Text>
          {hole.hazards?.length > 0 && (
            <Text className="text-xs">{hole.hazards.map((h: any) => hazardIcons[h.type]).join('')}</Text>
          )}
        </View>
        {hole.strategy ? (
          <Text className="text-neon-dim text-xs mt-0.5" numberOfLines={1}>
            {hole.strategy.recommendedClub} · {hole.strategy.aimPoint}
          </Text>
        ) : (
          <Text className="text-ink-muted text-xs">Strategie hinzufügen →</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={12} color="#252535" />
    </TouchableOpacity>
  );
}

function StrategyModal({ hole, courseId, onClose, onSaved }: {
  hole: any; courseId: string; onClose: () => void; onSaved: () => void;
}) {
  const [club, setClub] = useState(hole.strategy?.recommendedClub ?? '');
  const [shotShape, setShotShape] = useState<'STRAIGHT' | 'FADE' | 'DRAW'>(hole.strategy?.shotShape ?? 'STRAIGHT');
  const [aimPoint, setAimPoint] = useState(hole.strategy?.aimPoint ?? '');
  const [avoidance, setAvoidance] = useState(hole.strategy?.avoidance ?? '');
  const [notes, setNotes] = useState(hole.strategy?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!club || !aimPoint) { Alert.alert('Fehler', 'Schläger und Zielpunkt sind Pflichtfelder'); return; }
    setSaving(true);
    try {
      await api.put(`/courses/${courseId}/holes/${hole.number}/strategy`, { recommendedClub: club, shotShape, aimPoint, avoidance, notes });
      onSaved(); onClose();
    } catch { Alert.alert('Fehler', 'Strategie konnte nicht gespeichert werden'); }
    setSaving(false);
  };

  const inputStyle = "bg-bg-elevated border border-bg-border text-ink-primary rounded-xl px-4 py-3 text-sm";
  const labelStyle = "text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2";

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-bg-base">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-bg-border">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-ink-secondary text-sm">Abbrechen</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-ink-primary font-bold text-center">Loch {hole.number} Strategie</Text>
            <Text className="text-ink-muted text-xs text-center">Par {hole.par} · {hole.distanceMeters}m</Text>
          </View>
          <TouchableOpacity onPress={save} disabled={saving}>
            <Text className="text-neon-green font-bold text-sm">{saving ? '...' : 'Speichern'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-5">
          <View className="gap-5">
            <View>
              <Text className={labelStyle}>Empfohlener Schläger</Text>
              <TextInput className={inputStyle} placeholder="z.B. 7er Eisen" placeholderTextColor="#44445a" value={club} onChangeText={setClub} />
            </View>

            <View>
              <Text className={labelStyle}>Trajektorie</Text>
              <View className="flex-row gap-2">
                {(['STRAIGHT', 'FADE', 'DRAW'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    className="flex-1 py-3 rounded-xl items-center"
                    style={{
                      backgroundColor: shotShape === s ? '#00e87a' : '#14141f',
                      borderWidth: 1,
                      borderColor: shotShape === s ? '#00e87a' : '#252535',
                    }}
                    onPress={() => setShotShape(s)}
                  >
                    <Text className="text-xs font-bold" style={{ color: shotShape === s ? '#07070f' : '#8888aa' }}>
                      {{ STRAIGHT: 'GERADE', FADE: 'FADE', DRAW: 'DRAW' }[s]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className={labelStyle}>Zielpunkt</Text>
              <TextInput className={inputStyle} placeholder="z.B. Linke Seite des Fairways" placeholderTextColor="#44445a" value={aimPoint} onChangeText={setAimPoint} />
            </View>

            <View>
              <Text className={labelStyle}>Gefahren vermeiden</Text>
              <TextInput className={inputStyle} placeholder="z.B. Bunker rechts meiden" placeholderTextColor="#44445a" value={avoidance} onChangeText={setAvoidance} multiline />
            </View>

            <View>
              <Text className={labelStyle}>Notizen</Text>
              <TextInput
                className={`${inputStyle} min-h-20`}
                placeholder="Weitere Hinweise..."
                placeholderTextColor="#44445a"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedHole, setSelectedHole] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = async () => {
    try { const { data } = await api.get<Course[]>('/courses'); setCourses(data); } catch {}
  };

  const fetchCourseDetail = async (id: string) => {
    const { data } = await api.get<Course>(`/courses/${id}`);
    setSelectedCourse(data);
  };

  useEffect(() => { fetchCourses(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchCourses(); setRefreshing(false); };

  if (selectedCourse) {
    const strategyCoverage = selectedCourse.holes?.filter((h: any) => h.strategy).length ?? 0;
    return (
      <SafeAreaView className="flex-1 bg-bg-base">
        <View className="px-5 pt-4 pb-4 border-b border-bg-border">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setSelectedCourse(null)}>
              <Ionicons name="arrow-back" size={22} color="#8888aa" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-ink-primary font-bold text-lg">{selectedCourse.name}</Text>
              <Text className="text-ink-secondary text-xs">{selectedCourse.location}</Text>
            </View>
            <View className="items-end">
              <Text className="text-neon-green text-xs font-bold">{strategyCoverage}/18</Text>
              <Text className="text-ink-muted text-xs">Strategien</Text>
            </View>
          </View>
        </View>

        <ScrollView>
          <View className="bg-bg-card border border-bg-border rounded-xl mx-4 mt-4 overflow-hidden">
            <View className="flex-row px-4 py-2 bg-bg-elevated border-b border-bg-border">
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">NR</Text>
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest ml-11 flex-1">Info</Text>
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">Strategie</Text>
            </View>
            {selectedCourse.holes?.map((hole: any) => (
              <HoleRow key={hole.id} hole={hole} onPress={() => setSelectedHole(hole)} />
            ))}
          </View>
          <View className="h-8" />
        </ScrollView>

        {selectedHole && (
          <StrategyModal
            hole={selectedHole}
            courseId={selectedCourse.id}
            onClose={() => setSelectedHole(null)}
            onSaved={() => fetchCourseDetail(selectedCourse.id)}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <View className="px-5 pt-4 pb-4 flex-row items-end justify-between">
        <View>
          <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Plätze</Text>
          <Text className="text-ink-primary text-2xl font-bold mt-0.5">Platzkenntnisse</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl border border-neon-green"
          style={{ backgroundColor: '#00e87a15' }}
          onPress={() => setShowCreate(true)}
        >
          <Ionicons name="add" size={16} color="#00e87a" />
          <Text className="text-neon-green text-xs font-bold">PLATZ HINZUFÜGEN</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00e87a" />}
      >
        {courses.length === 0 ? (
          <View className="items-center py-16 gap-3">
            <Ionicons name="map-outline" size={48} color="#252535" />
            <Text className="text-ink-secondary font-semibold">Noch keine Plätze</Text>
            <Text className="text-ink-muted text-sm text-center">Füge deinen Heimatplatz hinzu und hinterlege deine Strategie</Text>
          </View>
        ) : (
          courses.map((course) => {
            const holes = (course as any).holes ?? [];
            const strategies = holes.filter((h: any) => h.strategy).length;
            return (
              <TouchableOpacity
                key={course.id}
                className="bg-bg-card border border-bg-border rounded-xl mb-3 overflow-hidden"
                onPress={() => fetchCourseDetail(course.id)}
              >
                <View className="p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-ink-primary font-bold text-base">{course.name}</Text>
                      <Text className="text-ink-secondary text-xs mt-0.5">{course.location}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-ink-secondary text-xs">Par {course.totalPar}</Text>
                      {course.rating && <Text className="text-ink-muted text-xs">CR {course.rating}</Text>}
                    </View>
                  </View>

                  {holes.length > 0 && (
                    <View className="mt-3">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-ink-muted text-xs">Strategie-Abdeckung</Text>
                        <Text className="text-xs font-semibold" style={{ color: strategies === 18 ? '#00e87a' : '#8888aa' }}>
                          {strategies}/18
                        </Text>
                      </View>
                      <View className="bg-bg-elevated rounded-full h-1 overflow-hidden">
                        <View
                          className="h-1 rounded-full"
                          style={{ width: `${(strategies / 18) * 100}%`, backgroundColor: strategies === 18 ? '#00e87a' : '#44445a' }}
                        />
                      </View>
                    </View>
                  )}
                </View>
                <View className="px-4 py-2.5 border-t border-bg-border flex-row items-center justify-between">
                  <Text className="text-neon-green text-xs font-semibold">Strategie bearbeiten</Text>
                  <Ionicons name="chevron-forward" size={12} color="#00e87a" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View className="h-8" />
      </ScrollView>

      {showCreate && (
        <CreateCourseModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchCourses}
        />
      )}
    </SafeAreaView>
  );
}
