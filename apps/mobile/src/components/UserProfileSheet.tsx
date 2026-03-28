import { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useTheme } from '../lib/theme';

type GolferLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO';

const LEVEL_META: Record<GolferLevel, { iconName: string; color: string }> = {
  BEGINNER:     { iconName: 'leaf-outline',    color: '#FF6535' },
  INTERMEDIATE: { iconName: 'flash-outline',   color: '#f59e0b' },
  ADVANCED:     { iconName: 'flame-outline',   color: '#f97316' },
  PRO:          { iconName: 'diamond-outline', color: '#a855f7' },
};

const GOAL_ICON: Record<string, string> = {
  HCP_TARGET:   'trophy-outline',
  ROUNDS_COUNT: 'golf-outline',
  SCORE_TARGET: 'flag-outline',
  CUSTOM:       'star-outline',
};

interface UserProfile {
  id: string;
  name: string;
  level: GolferLevel;
  homeClub: string | null;
  isPrivate: boolean;
  handicap?: number | null;
  stats?: { rounds: number; bestScore: number | null; avgScore: number | null };
  goals?: { id: string; type: string; title: string; targetValue: number | null; deadline: string | null }[];
}

interface Props {
  userId: string;
  friendshipId?: string;
  onClose: () => void;
  onFriendRemoved?: () => void;
}

function scoreDiff(n: number) {
  if (n < 0) return String(n);
  if (n === 0) return 'E';
  return `+${n}`;
}

export function UserProfileSheet({ userId, friendshipId, onClose, onFriendRemoved }: Props) {
  const { t, i18n } = useTranslation();
  const c = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<UserProfile>(`/social/users/${userId}`)
      .then(({ data }) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleRemoveFriend = () => {
    if (!friendshipId) return;
    Alert.alert(
      t('social.friends.removeTitle', { name: profile?.name ?? '' }),
      t('social.friends.removeMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'), style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/social/friends/${friendshipId}`);
              onFriendRemoved?.();
              onClose();
            } catch {}
          },
        },
      ],
    );
  };

  const meta = profile ? (LEVEL_META[profile.level] ?? LEVEL_META['BEGINNER']) : LEVEL_META['BEGINNER'];
  const initials = profile
    ? profile.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

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
            <Ionicons name="close-outline" size={24} color={c.inkSecondary} />
          </TouchableOpacity>
          <Text style={{ color: c.inkPrimary, fontWeight: 'bold', fontSize: 16 }}>
            {t('social.userProfile.title')}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#FF6535" />
          </View>
        ) : !profile ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 }}>
            <Ionicons name="alert-circle-outline" size={40} color={c.inkMuted} />
            <Text style={{ color: c.inkMuted, fontSize: 14 }}>{t('social.userProfile.noData')}</Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
            {/* Avatar + Name */}
            <View style={{
              backgroundColor: c.bgCard, borderRadius: 20, padding: 20,
              alignItems: 'center', gap: 12,
            }}>
              <View style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: meta.color + '20',
                borderWidth: 2, borderColor: meta.color + '60',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 26, fontWeight: 'bold', color: meta.color }}>{initials}</Text>
              </View>
              <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 22 }}>{profile.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
                  backgroundColor: meta.color + '20',
                }}>
                  <Ionicons name={meta.iconName as any} size={12} color={meta.color} />
                  <Text style={{ color: meta.color, fontWeight: '700', fontSize: 11 }}>
                    {t(`profile.level.${profile.level}`)}
                  </Text>
                </View>
                {profile.handicap != null && (
                  <Text style={{ color: c.inkSecondary, fontWeight: '600', fontSize: 13 }}>
                    HCP {profile.handicap}
                  </Text>
                )}
              </View>
              {profile.homeClub && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="flag-outline" size={13} color={c.inkMuted} />
                  <Text style={{ color: c.inkMuted, fontSize: 13 }}>{profile.homeClub}</Text>
                </View>
              )}
            </View>

            {/* Private notice */}
            {profile.isPrivate ? (
              <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 20, alignItems: 'center', gap: 8 }}>
                <Ionicons name="lock-closed-outline" size={28} color={c.inkMuted} />
                <Text style={{ color: c.inkMuted, fontSize: 14, textAlign: 'center' }}>
                  {t('social.userProfile.private')}
                </Text>
              </View>
            ) : (
              <>
                {/* Stats */}
                {profile.stats && (
                  <View>
                    <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
                      Performance
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {[
                        { label: t('dashboard.stats.rounds'), value: String(profile.stats.rounds) },
                        { label: t('dashboard.stats.best'), value: profile.stats.bestScore != null ? scoreDiff(profile.stats.bestScore) : '—' },
                        { label: t('dashboard.stats.avgScore'), value: profile.stats.avgScore != null ? scoreDiff(Math.round(profile.stats.avgScore)) : '—' },
                      ].map((s) => (
                        <View key={s.label} style={{
                          flex: 1, backgroundColor: c.bgCard, borderRadius: 14,
                          padding: 14, alignItems: 'center',
                        }}>
                          <Text style={{ color: c.inkMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                            {s.label}
                          </Text>
                          <Text style={{ color: c.inkPrimary, fontSize: 20, fontWeight: '900' }}>{s.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Goals */}
                {profile.goals && profile.goals.length > 0 && (
                  <View>
                    <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
                      {t('profile.goals.title')}
                    </Text>
                    <View style={{ gap: 8 }}>
                      {profile.goals.map((goal) => (
                        <View key={goal.id} style={{
                          backgroundColor: c.bgCard, borderRadius: 14,
                          flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                        }}>
                          <View style={{
                            width: 36, height: 36, borderRadius: 10,
                            backgroundColor: c.bgElevated,
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Ionicons name={(GOAL_ICON[goal.type] ?? 'star-outline') as any} size={16} color="#FF6535" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: c.inkPrimary, fontWeight: '600', fontSize: 14 }}>{goal.title}</Text>
                            {goal.deadline && (
                              <Text style={{ color: c.inkMuted, fontSize: 12, marginTop: 2 }}>
                                {t('profile.goals.deadline')}: {new Date(goal.deadline).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Remove Friend */}
            {friendshipId && (
              <TouchableOpacity
                onPress={handleRemoveFriend}
                style={{
                  backgroundColor: '#ef444415', borderRadius: 14,
                  flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                }}
              >
                <Ionicons name="person-remove-outline" size={18} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 14 }}>
                  {t('social.userProfile.removeFriend')}
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
