import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/lib/api';
import { useTheme } from '../../src/lib/theme';
import { Course } from '@fairwayiq/shared';
import { CreateCourseModal } from '../../src/components/CreateCourseModal';

const hazardIcons: Record<string, string> = { WATER: 'water-outline', BUNKER: 'golf-outline', OB: 'warning-outline', ROUGH: 'leaf-outline', TREES: 'leaf-outline' };

function HoleRow({ hole, onPress }: { hole: any; onPress: () => void }) {
  const { t } = useTranslation();
  const c = useTheme();
  const hasStrategy = !!hole.strategy;
  return (
    <TouchableOpacity
      className="flex-row items-center py-3 px-4 border-b border-bg-border"
      onPress={onPress}
    >
      <View
        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
        style={{ backgroundColor: hasStrategy ? '#FF653515' : c.bgElevated }}
      >
        <Text className="text-xs font-bold" style={{ color: hasStrategy ? '#FF6535' : c.inkMuted }}>
          {hole.number}
        </Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-ink-primary text-sm font-medium">Par {hole.par}</Text>
          <Text className="text-ink-muted text-xs">·</Text>
          <Text className="text-ink-muted text-xs">{hole.distanceMeters}m</Text>
          {hole.hazards?.length > 0 && (
            <View className="flex-row gap-0.5">
              {hole.hazards.map((h: any, i: number) => (
                <Ionicons key={i} name={hazardIcons[h.type] as any} size={11} color={c.inkMuted} />
              ))}
            </View>
          )}
        </View>
        {hole.strategy ? (
          <Text className="text-neon-dim text-xs mt-0.5" numberOfLines={1}>
            {hole.strategy.recommendedClub} · {hole.strategy.aimPoint}
          </Text>
        ) : (
          <Text className="text-ink-muted text-xs">{t('courses.addStrategy')}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={12} color={c.inkMuted} />
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
  const { t } = useTranslation();
  const c = useTheme();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!club || !aimPoint) { Alert.alert(t('common.error'), t('courses.strategyModal.requiredFields')); return; }
    setSaving(true);
    try {
      await api.put(`/courses/${courseId}/holes/${hole.number}/strategy`, { recommendedClub: club, shotShape, aimPoint, avoidance, notes });
      onSaved(); onClose();
    } catch { Alert.alert(t('common.error'), t('courses.strategyModal.cannotSave')); }
    setSaving(false);
  };

  const inputStyle = "bg-bg-elevated border border-bg-border text-ink-primary rounded-xl px-4 py-3 text-sm";
  const labelStyle = "text-ink-muted text-xs font-bold uppercase tracking-widest mb-2";

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-bg-base">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-bg-border">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-ink-secondary text-sm">{t('common.cancel')}</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-ink-primary font-bold text-center">{t('courses.strategyModal.title', { number: hole.number })}</Text>
            <Text className="text-ink-muted text-xs text-center">Par {hole.par} · {hole.distanceMeters}m</Text>
          </View>
          <TouchableOpacity onPress={save} disabled={saving}>
            <Text className="text-neon-green font-bold text-sm">{saving ? t('common.saving') : t('common.save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-5">
          <View className="gap-5">
            <View>
              <Text className={labelStyle}>{t('courses.strategyModal.club')}</Text>
              <TextInput className={inputStyle} placeholder={t('courses.strategyModal.clubPlaceholder')} placeholderTextColor="#444444" value={club} onChangeText={setClub} />
            </View>

            <View>
              <Text className={labelStyle}>{t('courses.strategyModal.trajectory')}</Text>
              <View className="flex-row gap-2">
                {(['STRAIGHT', 'FADE', 'DRAW'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    className="flex-1 py-3 rounded-xl items-center"
                    style={{
                      backgroundColor: shotShape === s ? '#FF6535' : c.bgElevated,
                      borderWidth: 1,
                      borderColor: shotShape === s ? '#FF6535' : c.bgBorder,
                    }}
                    onPress={() => setShotShape(s)}
                  >
                    <Text className="text-xs font-bold" style={{ color: shotShape === s ? '#0A0A0A' : '#8A8A8A' }}>
                      {t(`courses.strategyModal.shotShape.${s}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className={labelStyle}>{t('courses.strategyModal.aimPoint')}</Text>
              <TextInput className={inputStyle} placeholder={t('courses.strategyModal.aimPlaceholder')} placeholderTextColor="#444444" value={aimPoint} onChangeText={setAimPoint} />
            </View>

            <View>
              <Text className={labelStyle}>{t('courses.strategyModal.avoidance')}</Text>
              <TextInput className={inputStyle} placeholder={t('courses.strategyModal.avoidPlaceholder')} placeholderTextColor="#444444" value={avoidance} onChangeText={setAvoidance} multiline />
            </View>

            <View>
              <Text className={labelStyle}>{t('courses.strategyModal.notes')}</Text>
              <TextInput
                className={`${inputStyle} min-h-20`}
                placeholder={t('courses.strategyModal.notesPlaceholder')}
                placeholderTextColor="#444444"
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

interface ApiSearchResult {
  apiId: string;
  name: string;
  location: string;
  totalPar: number;
  rating: number | null;
  slope: number | null;
  hasHoles: boolean;
}

export default function CoursesScreen() {
  const { t } = useTranslation();
  const c = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedHole, setSelectedHole] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState<string | null>(null); // apiId des gerade gespeicherten Platzes
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCourses = async () => {
    try { const { data } = await api.get<Course[]>('/courses'); setCourses(data); } catch {}
  };

  const fetchCourseDetail = async (id: string) => {
    const { data } = await api.get<Course>(`/courses/${id}`);
    setSelectedCourse(data);
  };

  useEffect(() => { fetchCourses(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchCourses(); setRefreshing(false); };

  const onSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get<ApiSearchResult[]>(`/courses/api-search?q=${encodeURIComponent(text)}`);
        setSearchResults(data);
      } catch {}
      setSearching(false);
    }, 500);
  };

  const saveFromApi = async (result: ApiSearchResult) => {
    setSaving(result.apiId);
    try {
      const { data } = await api.post<Course>('/courses/from-api', { apiId: result.apiId });
      await fetchCourses();
      setSearchQuery('');
      setSearchResults([]);
      setSelectedCourse(data);
    } catch {
      Alert.alert(t('common.error'), t('courses.cannotSave'));
    }
    setSaving(null);
  };

  if (selectedCourse) {
    const strategyCoverage = selectedCourse.holes?.filter((h: any) => h.strategy).length ?? 0;
    return (
      <SafeAreaView className="flex-1 bg-bg-base">
        <View className="px-5 pt-4 pb-4 border-b border-bg-border">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setSelectedCourse(null)}>
              <Ionicons name="arrow-back" size={22} color="#8A8A8A" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-ink-primary font-bold text-lg">{selectedCourse.name}</Text>
              <Text className="text-ink-secondary text-xs">{selectedCourse.location}</Text>
            </View>
            <View className="items-end">
              <Text className="text-neon-green text-xs font-bold">{strategyCoverage}/18</Text>
              <Text className="text-ink-muted text-xs">{t('courses.strategies')}</Text>
            </View>
          </View>
        </View>

        <ScrollView>
          <View className="bg-bg-card rounded-2xl mx-4 mt-4 overflow-hidden">
            <View className="flex-row px-4 py-2 bg-bg-elevated border-b border-bg-border">
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">{t('courses.table.nr')}</Text>
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest ml-11 flex-1">{t('courses.table.info')}</Text>
              <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">{t('courses.table.strategy')}</Text>
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
      <View className="px-5 pt-4 pb-3">
        <View className="flex-row items-end justify-between mb-4">
          <View>
            <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest">{t('courses.sectionLabel')}</Text>
            <Text className="text-ink-primary text-3xl font-black">{t('courses.title')}</Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ backgroundColor: '#FF653520' }}
            onPress={() => setShowCreate(true)}
          >
            <Ionicons name="add" size={16} color="#FF6535" />
            <Text className="text-neon-green text-xs font-bold">{t('courses.manualAdd')}</Text>
          </TouchableOpacity>
        </View>

        {/* Suchleiste */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.bgBorder,
          borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
        }}>
          <Ionicons name="search-outline" size={17} color={c.inkMuted} />
          <TextInput
            style={{ flex: 1, color: c.inkPrimary, fontSize: 15 }}
            placeholder={t('courses.searchPlaceholder')}
            placeholderTextColor={c.inkMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCorrect={false}
          />
          {searching && <ActivityIndicator size="small" color="#FF6535" />}
          {searchQuery.length > 0 && !searching && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
              <Ionicons name="close-circle" size={17} color={c.inkMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Suchergebnisse */}
        {searchResults.length > 0 && (
          <View style={{
            marginTop: 6, backgroundColor: c.bgCard,
            borderWidth: 1, borderColor: c.bgBorder, borderRadius: 14,
            overflow: 'hidden',
          }}>
            <Text style={{ color: c.inkMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.6,
              textTransform: 'uppercase', padding: 12, paddingBottom: 6 }}>
              {t('courses.apiResults', { count: searchResults.length })}
            </Text>
            <ScrollView scrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 340 }}>
            {searchResults.map((r, i) => (
              <TouchableOpacity
                key={r.apiId}
                onPress={() => saveFromApi(r)}
                disabled={saving === r.apiId}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 14, paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.bgBorder,
                  opacity: saving === r.apiId ? 0.5 : 1,
                }}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 16,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {saving === r.apiId
                    ? <ActivityIndicator size="small" color="#FF6535" />
                    : <Ionicons name="golf-outline" size={20} color="#FF6535" />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.inkPrimary, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text style={{ color: c.inkSecondary, fontSize: 12 }} numberOfLines={1}>
                    {r.location}
                    {r.rating ? ` · CR ${r.rating}` : ''}
                    {r.slope ? `/${r.slope}` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text style={{ color: c.inkSecondary, fontSize: 12 }}>Par {r.totalPar}</Text>
                  {r.hasHoles && (
                    <View style={{ backgroundColor: '#FF653520', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 }}>
                      <Text style={{ color: '#FF6535', fontSize: 9, fontWeight: '700' }}>{t('courses.holes18')}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="add-circle-outline" size={20} color="#FF6535" />
              </TouchableOpacity>
            ))}
            </ScrollView>
          </View>
        )}

        {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: c.inkMuted, fontSize: 13 }}>{t('courses.noResults', { query: searchQuery })}</Text>
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6535" />}
      >
        {courses.length === 0 && searchQuery.length === 0 ? (
          <View className="items-center py-16 gap-3">
            <Ionicons name="map-outline" size={48} color="#2E2E2E" />
            <Text className="text-ink-secondary font-semibold">{t('courses.noCourses')}</Text>
            <Text className="text-ink-muted text-sm text-center">{t('courses.noCoursesHint')}</Text>
          </View>
        ) : searchQuery.length === 0 ? (
          courses.map((course) => {
            const holes = (course as any).holes ?? [];
            const strategies = holes.filter((h: any) => h.strategy).length;
            return (
              <TouchableOpacity
                key={course.id}
                className="bg-bg-card rounded-2xl mb-3 overflow-hidden"
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
                        <Text className="text-ink-muted text-xs">{t('courses.strategyCoverage')}</Text>
                        <Text className="text-xs font-semibold" style={{ color: strategies === 18 ? '#FF6535' : '#8A8A8A' }}>
                          {strategies}/18
                        </Text>
                      </View>
                      <View className="bg-bg-elevated rounded-full h-1 overflow-hidden">
                        <View
                          className="h-1 rounded-full"
                          style={{ width: `${(strategies / 18) * 100}%`, backgroundColor: strategies === 18 ? '#FF6535' : '#444444' }}
                        />
                      </View>
                    </View>
                  )}
                </View>
                <View className="px-4 py-2.5 border-t border-bg-border flex-row items-center justify-between">
                  <Text className="text-neon-green text-xs font-semibold">{t('courses.editStrategy')}</Text>
                  <Ionicons name="chevron-forward" size={12} color="#FF6535" />
                </View>
              </TouchableOpacity>
            );
          })
        ) : null}
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
