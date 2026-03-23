import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '../src/lib/api';
import { useTheme } from '../src/lib/theme';

// ── Types ─────────────────────────────────────────────────────────────
type ClubType = 'DRIVER' | 'FAIRWAY_WOOD' | 'HYBRID' | 'IRON' | 'WEDGE' | 'PUTTER';

interface Club {
  id: string;
  name: string;
  type: ClubType;
  distanceM: number | null;
}

// ── Club type metadata ────────────────────────────────────────────────
const TYPE_META: Record<ClubType, { icon: string; suggestions: string[] }> = {
  DRIVER:       { icon: '🏌️', suggestions: ['Driver'] },
  FAIRWAY_WOOD: { icon: '🌳', suggestions: ['3er Holz', '5er Holz', '7er Holz'] },
  HYBRID:       { icon: '⚡', suggestions: ['2er Hybrid', '3er Hybrid', '4er Hybrid', '5er Hybrid'] },
  IRON:         { icon: '🔩', suggestions: ['3er Eisen', '4er Eisen', '5er Eisen', '6er Eisen', '7er Eisen', '8er Eisen', '9er Eisen'] },
  WEDGE:        { icon: '🎯', suggestions: ['PW', 'GW (50°)', 'SW (54°)', 'LW (58°)', 'LW (60°)'] },
  PUTTER:       { icon: '🏁', suggestions: ['Putter'] },
};

const TYPE_ORDER: ClubType[] = ['DRIVER', 'FAIRWAY_WOOD', 'HYBRID', 'IRON', 'WEDGE', 'PUTTER'];

// ── Add/Edit Modal ────────────────────────────────────────────────────
function ClubModal({
  club, onClose, onSaved,
}: {
  club?: Club;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const c = useTheme();
  const [type, setType] = useState<ClubType>(club?.type ?? 'IRON');
  const [name, setName] = useState(club?.name ?? '');
  const [distance, setDistance] = useState(club?.distanceM?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const meta = TYPE_META[type];
  const isEdit = !!club;

  const save = async () => {
    if (!name.trim()) { Alert.alert(t('bag.nameMissing'), t('bag.nameMissingMsg')); return; }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        distanceM: distance ? parseInt(distance, 10) : null,
      };
      if (isEdit) {
        await api.put(`/clubs/${club.id}`, payload);
      } else {
        await api.post('/clubs', payload);
      }
      onSaved();
      onClose();
    } catch {
      Alert.alert(t('common.error'), t('bag.cannotSave'));
    }
    setSaving(false);
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingVertical: 16,
          borderBottomWidth: 1, borderBottomColor: c.bgBorder,
        }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: c.inkSecondary, fontSize: 14 }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={{ color: c.inkPrimary, fontWeight: 'bold' }}>
            {isEdit ? t('bag.modal.editTitle') : t('bag.modal.addTitle')}
          </Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color="#FF6535" />
              : <Text style={{ color: '#FF6535', fontWeight: 'bold', fontSize: 14 }}>{t('common.save')}</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }}>
          {/* Type Picker */}
          <View>
            <Text style={{ color: c.inkSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
              {t('bag.modal.type')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TYPE_ORDER.map((clubType) => {
                const m = TYPE_META[clubType];
                const active = clubType === type;
                return (
                  <TouchableOpacity
                    key={clubType}
                    onPress={() => { setType(clubType); setName(''); }}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: active ? '#FF653520' : c.bgCard,
                      borderWidth: 1,
                      borderColor: active ? '#FF6535' : c.bgBorder,
                    }}
                  >
                    <Text style={{ color: active ? '#FF6535' : c.inkSecondary, fontWeight: '600', fontSize: 13 }}>
                      {m.icon} {t(`bag.types.${clubType}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Name */}
          <View>
            <Text style={{ color: c.inkSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              {t('bag.modal.name')}
            </Text>
            <TextInput
              style={{
                backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.bgBorder,
                borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                color: c.inkPrimary, fontSize: 15,
              }}
              placeholder={t('bag.modal.namePlaceholder')}
              placeholderTextColor={c.inkMuted}
              value={name}
              onChangeText={setName}
            />
            {/* Suggestions */}
            {meta.suggestions.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}
                contentContainerStyle={{ gap: 6 }}>
                {meta.suggestions.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setName(s)}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                      backgroundColor: name === s ? '#FF653520' : c.bgCard,
                      borderWidth: 1,
                      borderColor: name === s ? '#FF6535' : c.bgBorder,
                    }}
                  >
                    <Text style={{ color: name === s ? '#FF6535' : c.inkMuted, fontSize: 12 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Distance */}
          <View>
            <Text style={{ color: c.inkSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              {t('bag.modal.distance')}
            </Text>
            <TextInput
              style={{
                backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.bgBorder,
                borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                color: c.inkPrimary, fontSize: 15,
              }}
              placeholder={t('bag.modal.distancePlaceholder')}
              placeholderTextColor={c.inkMuted}
              keyboardType="number-pad"
              value={distance}
              onChangeText={setDistance}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────
export default function BagScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useTheme();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editClub, setEditClub] = useState<Club | null>(null);

  const loadClubs = useCallback(async () => {
    try {
      const { data } = await api.get<Club[]>('/clubs');
      setClubs(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadClubs(); }, []);

  const deleteClub = (club: Club) => {
    Alert.alert(t('bag.deleteTitle'), t('bag.deleteMsg', { name: club.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.remove'), style: 'destructive', onPress: async () => {
          try { await api.delete(`/clubs/${club.id}`); loadClubs(); }
          catch { Alert.alert(t('common.error'), t('bag.cannotDelete')); }
        },
      },
    ]);
  };

  const grouped = TYPE_ORDER
    .map((type) => ({ type, clubs: clubs.filter((c) => c.type === type) }))
    .filter((g) => g.clubs.length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={c.inkSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {t('bag.sectionLabel')}
          </Text>
          <Text style={{ color: c.inkPrimary, fontSize: 22, fontWeight: 'bold' }}>{t('bag.title')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAdd(true)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
            backgroundColor: '#FF653520', borderWidth: 1, borderColor: '#FF6535',
          }}
        >
          <Ionicons name="add" size={16} color="#FF6535" />
          <Text style={{ color: '#FF6535', fontSize: 12, fontWeight: 'bold' }}>{t('bag.addButton')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#FF6535" />
        </View>
      ) : clubs.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="golf-outline" size={48} color={c.inkMuted} />
          <Text style={{ color: c.inkSecondary, fontWeight: '600', fontSize: 16 }}>{t('bag.empty')}</Text>
          <Text style={{ color: c.inkMuted, fontSize: 14, textAlign: 'center' }}>{t('bag.emptyHint')}</Text>
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            style={{
              marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
              borderRadius: 12, backgroundColor: '#FF653520',
              borderWidth: 1, borderColor: '#FF6535',
            }}
          >
            <Text style={{ color: '#FF6535', fontWeight: 'bold' }}>{t('bag.addFirst')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {grouped.map(({ type, clubs: typeClubs }) => {
            const meta = TYPE_META[type];
            return (
              <View key={type} style={{ marginTop: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Text style={{ fontSize: 14 }}>{meta.icon}</Text>
                  <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    {t(`bag.types.${type}`)}
                  </Text>
                </View>
                <View style={{ backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.bgBorder, overflow: 'hidden' }}>
                  {typeClubs.map((club, idx) => (
                    <View
                      key={club.id}
                      style={{
                        flexDirection: 'row', alignItems: 'center',
                        paddingHorizontal: 16, paddingVertical: 14,
                        borderTopWidth: idx > 0 ? 1 : 0,
                        borderTopColor: c.bgBorder,
                      }}
                    >
                      <Text style={{ color: c.inkPrimary, fontWeight: '600', fontSize: 15, flex: 1 }}>
                        {club.name}
                      </Text>
                      {club.distanceM != null && (
                        <View style={{
                          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
                          backgroundColor: '#FF653520', marginRight: 12,
                        }}>
                          <Text style={{ color: '#FF6535', fontWeight: 'bold', fontSize: 13 }}>
                            {club.distanceM} m
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => setEditClub(club)}
                        style={{ padding: 6, marginRight: 4 }}
                      >
                        <Ionicons name="pencil-outline" size={16} color={c.inkMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteClub(club)} style={{ padding: 6 }}>
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {showAdd && (
        <ClubModal onClose={() => setShowAdd(false)} onSaved={loadClubs} />
      )}
      {editClub && (
        <ClubModal club={editClub} onClose={() => setEditClub(null)} onSaved={loadClubs} />
      )}
    </SafeAreaView>
  );
}
