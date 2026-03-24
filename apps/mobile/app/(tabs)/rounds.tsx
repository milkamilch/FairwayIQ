import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../src/lib/api';
import { useTheme } from '../../src/lib/theme';
import { Round } from '@fairwayiq/shared';
import { RoundShareCard, ShareTemplate } from '../../src/components/RoundShareCard';

function scoreColor(diff: number) {
  if (diff <= -2) return '#a855f7';
  if (diff === -1) return '#FF6535';
  if (diff === 0) return '#6ee7b7';
  if (diff === 1) return '#f59e0b';
  return '#ef4444';
}


export default function RoundsScreen() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [shareRound, setShareRound] = useState<Round | null>(null);
  const [template, setTemplate] = useState<ShareTemplate>('dark');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<View>(null);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const c = useTheme();

  const fetchRounds = async () => {
    try { const { data } = await api.get<Round[]>('/rounds'); setRounds(data); } catch {}
  };

  useEffect(() => { fetchRounds(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchRounds(); setRefreshing(false); };

  const openShareModal = (round: Round) => {
    setTemplate('dark');
    setBgImage(null);
    setShareRound(round);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setBgImage(result.assets[0].uri);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Runde teilen' });
    } catch {}
    setSharing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <View className="px-5 pt-6 pb-4 flex-row items-end justify-between">
        <View>
          <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-1">{t('rounds.sectionLabel')}</Text>
          <Text className="text-ink-primary text-3xl font-black">{t('rounds.title')}</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ backgroundColor: '#FF653520' }}
          onPress={() => router.push('/live-round' as any)}
        >
          <Ionicons name="golf-outline" size={16} color="#FF6535" />
          <Text className="text-neon-green text-xs font-bold">{t('rounds.liveRound')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6535" />}
      >
        {rounds.length === 0 ? (
          <View className="items-center py-16 gap-3">
            <Ionicons name="stats-chart-outline" size={48} color={c.bgBorder} />
            <Text className="text-ink-secondary font-semibold">{t('rounds.noRounds')}</Text>
            <Text className="text-ink-muted text-sm text-center">{t('rounds.noRoundsHint')}</Text>
            <TouchableOpacity className="mt-2 px-6 py-3 rounded-2xl" style={{ backgroundColor: '#FF653520' }} onPress={() => router.push('/live-round' as any)}>
              <Text className="text-neon-green font-semibold text-sm">{t('rounds.startRound')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          rounds.map((round) => {
            const totalStrokes = round.scores?.reduce((s, h) => s + h.strokes, 0) ?? 0;
            const totalPar = round.scores?.reduce((s, h) => s + h.par, 0) ?? 72;
            const diff = totalStrokes - totalPar;
            const putts = round.scores?.reduce((s, h) => s + h.putts, 0) ?? 0;
            const gir = round.scores?.filter((h) => h.greenInRegulation).length ?? 0;
            const fir = round.scores?.filter((h) => h.fairwayHit === true).length ?? 0;
            const firTotal = round.scores?.filter((h) => h.fairwayHit !== null).length ?? 0;
            return (
              <View key={round.id} className="bg-bg-card rounded-2xl mb-3 overflow-hidden">
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => router.push(`/scorecard/${round.id}` as any)}
                >
                  <View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                      <Text className="text-ink-primary font-black text-base" numberOfLines={1}>{(round as any).course?.name ?? round.courseName ?? '—'}</Text>
                      <Text className="text-ink-muted text-xs mt-1">
                        {new Date(round.date).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <View className="items-end">
                        <Text className="text-4xl font-black" style={{ color: scoreColor(diff) }}>{totalStrokes}</Text>
                        <Text className="text-sm font-bold" style={{ color: scoreColor(diff) }}>
                          {diff === 0 ? 'EVEN' : diff > 0 ? `+${diff}` : String(diff)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => openShareModal(round)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: c.bgElevated,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="share-outline" size={18} color={c.inkMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View className="px-5 py-3 bg-bg-elevated flex-row gap-5 flex-wrap">
                    {[
                      { label: 'PUTTS', value: String(putts) },
                      { label: 'GIR', value: `${gir}/18` },
                      { label: 'FIR', value: `${fir}/${firTotal}` },
                      round.handicapDifferential != null ? { label: 'DIFF', value: String(round.handicapDifferential) } : null,
                    ].filter(Boolean).map((s) => s && (
                      <View key={s.label} className="flex-row items-center gap-1.5">
                        <Text className="text-ink-muted text-xs font-bold">{s.label}</Text>
                        <Text className="text-ink-primary text-xs font-black">{s.value}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View className="h-8" />
      </ScrollView>

      {/* Share preview Modal */}
      <Modal
        visible={shareRound !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShareRound(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
            <TouchableOpacity onPress={() => setShareRound(null)}>
              <Ionicons name="close" size={22} color={c.inkMuted} />
            </TouchableOpacity>
            <Text style={{ color: c.inkPrimary, fontWeight: '700', fontSize: 15 }}>Runde teilen</Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Template switcher */}
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 16 }}>
            {([
              { key: 'dark',    icon: 'moon-outline',    label: 'Dark' },
              { key: 'photo',   icon: 'image-outline',   label: 'Foto' },
              { key: 'minimal', icon: 'sunny-outline',   label: 'Minimal' },
            ] as { key: ShareTemplate; icon: any; label: string }[]).map((tpl) => (
              <TouchableOpacity
                key={tpl.key}
                onPress={() => setTemplate(tpl.key)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: template === tpl.key ? '#FF6535' : c.bgBorder,
                  backgroundColor: template === tpl.key ? c.neonGreen12 : c.bgCard,
                }}
              >
                <Ionicons name={tpl.icon} size={14} color={template === tpl.key ? '#FF6535' : c.inkMuted} />
                <Text style={{ color: template === tpl.key ? '#FF6535' : c.inkMuted, fontWeight: '700', fontSize: 12 }}>
                  {tpl.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Photo picker button (only for photo template) */}
          {template === 'photo' && (
            <TouchableOpacity
              onPress={pickImage}
              style={{
                marginHorizontal: 20,
                marginTop: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: c.bgCard,
                borderWidth: 1,
                borderColor: bgImage ? '#FF653540' : c.bgBorder,
                borderStyle: 'dashed',
              }}
            >
              <Ionicons name={bgImage ? 'checkmark-circle-outline' : 'add-circle-outline'} size={18} color={bgImage ? '#FF6535' : c.inkMuted} />
              <Text style={{ color: bgImage ? '#FF6535' : c.inkMuted, fontSize: 13, fontWeight: '600' }}>
                {bgImage ? 'Foto ändern' : 'Hintergrundfoto wählen'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Card preview */}
          <ScrollView
            contentContainerStyle={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {shareRound && (
              <RoundShareCard
                ref={cardRef}
                round={shareRound}
                template={template}
                backgroundImage={bgImage}
              />
            )}
          </ScrollView>

          {/* Share button */}
          <View style={{ padding: 20, paddingBottom: 12 }}>
            <TouchableOpacity
              onPress={handleShare}
              disabled={sharing}
              style={{
                backgroundColor: sharing ? '#FF653560' : '#FF6535',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {sharing
                ? <ActivityIndicator color="#0A0A0A" />
                : <>
                    <Ionicons name="share-outline" size={18} color="#0A0A0A" />
                    <Text style={{ color: '#0A0A0A', fontWeight: '800', letterSpacing: 0.5 }}>TEILEN</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
