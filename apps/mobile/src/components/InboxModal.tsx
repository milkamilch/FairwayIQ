import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useTheme } from '../lib/theme';

type GolferLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO';

interface FriendRequest {
  id: string;
  name: string;
  handicap: number | null;
  level: GolferLevel;
  homeClub: string | null;
  friendshipId: string;
}

const LEVEL_COLOR: Record<GolferLevel, string> = {
  BEGINNER:     '#FF6535',
  INTERMEDIATE: '#f59e0b',
  ADVANCED:     '#f97316',
  PRO:          '#a855f7',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export function InboxModal({ visible, onClose, onCountChange }: Props) {
  const { t } = useTranslation();
  const c = useTheme();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<FriendRequest[]>('/social/requests');
      setRequests(data);
      onCountChange?.(data.length);
    } catch {} finally { setLoading(false); }
  }, [onCountChange]);

  useEffect(() => { if (visible) load(); }, [visible]);

  const accept = async (req: FriendRequest) => {
    try {
      await api.put(`/social/request/${req.friendshipId}/accept`);
      load();
    } catch { Alert.alert(t('common.error'), t('social.friends.cannotAccept')); }
  };

  const decline = async (req: FriendRequest) => {
    try {
      await api.delete(`/social/friends/${req.friendshipId}`);
      load();
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
          borderBottomWidth: 1, borderBottomColor: c.bgBorder,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>
              {t('inbox.sectionLabel')}
            </Text>
            <Text style={{ color: c.inkPrimary, fontSize: 26, fontWeight: '900' }}>{t('inbox.title')}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: c.bgElevated, borderRadius: 20 }}>
            <Ionicons name="close" size={18} color={c.inkSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {/* Friend Requests */}
          <Text style={{
            color: c.inkMuted, fontSize: 11, fontWeight: '700',
            letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
          }}>
            {t('inbox.friendRequests')}{requests.length > 0 ? ` (${requests.length})` : ''}
          </Text>

          {loading ? (
            <ActivityIndicator color="#FF6535" style={{ marginTop: 40 }} />
          ) : requests.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 52, gap: 10 }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#FF653515', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-done-outline" size={32} color="#FF6535" />
              </View>
              <Text style={{ color: c.inkSecondary, fontWeight: '700', fontSize: 16 }}>{t('inbox.allClear')}</Text>
              <Text style={{ color: c.inkMuted, fontSize: 13, textAlign: 'center' }}>{t('inbox.noRequests')}</Text>
            </View>
          ) : (
            requests.map((req) => {
              const color = LEVEL_COLOR[req.level] ?? LEVEL_COLOR['BEGINNER'];
              const initials = req.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <View key={req.friendshipId} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: c.bgCard, borderRadius: 18,
                  padding: 14, marginBottom: 10,
                  borderWidth: 1, borderColor: c.bgBorder,
                }}>
                  {/* Avatar */}
                  <View style={{
                    width: 48, height: 48, borderRadius: 24,
                    backgroundColor: color + '20', borderWidth: 1.5, borderColor: color + '60',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color }}>{initials}</Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.inkPrimary, fontWeight: '700', fontSize: 15 }}>{req.name}</Text>
                    <Text style={{ color: c.inkMuted, fontSize: 12, marginTop: 2 }}>
                      {req.handicap != null ? `HCP ${req.handicap}` : t('social.friends.noHcp')}
                      {req.homeClub ? ` · ${req.homeClub}` : ''}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => accept(req)}
                      style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 11, backgroundColor: '#FF6535' }}
                    >
                      <Text style={{ color: '#0A0A0A', fontSize: 13, fontWeight: '800' }}>{t('social.friends.accept')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => decline(req)}
                      style={{
                        width: 38, height: 38, borderRadius: 11,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.bgBorder,
                      }}
                    >
                      <Ionicons name="close" size={16} color={c.inkMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Hook: fetch pending count (for badges)
export async function fetchInboxCount(): Promise<number> {
  try {
    const { data } = await api.get<{ id: string }[]>('/social/requests');
    return data.length;
  } catch { return 0; }
}
