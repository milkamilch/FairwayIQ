import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/lib/api';
import { useTheme } from '../../src/lib/theme';

// ── Types ─────────────────────────────────────────────────────────────
type GolferLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO';

interface FriendUser {
  id: string; name: string; handicap: number | null; level: GolferLevel; homeClub: string | null;
  friendshipId: string;
}

interface SearchUser {
  id: string; name: string; handicap: number | null; level: GolferLevel; homeClub: string | null;
  friendshipId: string | null;
  friendshipStatus: 'PENDING' | 'ACCEPTED' | null;
  isSender: boolean;
}

interface LeaderboardEntry {
  id: string; rank: number; name: string; handicap: number | null; level: GolferLevel;
  rounds: number; avgScore: number | null; bestScore: number | null; isMe: boolean;
}

interface FeedEntry {
  id: string; date: string;
  user: { id: string; name: string; level: GolferLevel; handicap: number | null };
  course: { id: string; name: string; location: string };
  gross: number; scoreToPar: number; putts: number; gir: number;
}

// ── Helpers ───────────────────────────────────────────────────────────
const LEVEL_META: Record<GolferLevel, { iconName: string; color: string }> = {
  BEGINNER:     { iconName: 'leaf-outline',    color: '#FF6535' },
  INTERMEDIATE: { iconName: 'flash-outline',   color: '#f59e0b' },
  ADVANCED:     { iconName: 'flame-outline',   color: '#f97316' },
  PRO:          { iconName: 'diamond-outline', color: '#a855f7' },
};

function scoreDiff(n: number) {
  if (n < 0) return String(n);
  if (n === 0) return 'E';
  return `+${n}`;
}

function scoreColor(d: number) {
  if (d <= -1) return '#FF6535';
  if (d === 0)  return '#FFFFFF';
  if (d === 1)  return '#f59e0b';
  return '#ef4444';
}

function timeAgo(iso: string, lang: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  if (h < 1) return rtf.format(-Math.floor(diff / 60_000), 'minute');
  if (h < 24) return rtf.format(-h, 'hour');
  if (d < 7) return rtf.format(-d, 'day');
  return new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short' });
}

const TABS = [
  { key: 'feed',    icon: 'newspaper-outline' },
  { key: 'ranking', icon: 'podium-outline' },
  { key: 'friends', icon: 'people-outline' },
] as const;
type TabKey = typeof TABS[number]['key'];

// ── Avatar ─────────────────────────────────────────────────────────────
function Avatar({ name, level, size = 40 }: { name: string; level: GolferLevel; size?: number }) {
  const c = useTheme();
  const meta = LEVEL_META[level];
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: meta.color + '20',
       borderColor: meta.color + '60',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.36, fontWeight: 'bold', color: meta.color }}>{initials}</Text>
    </View>
  );
}

// ── Feed Tab ──────────────────────────────────────────────────────────
function FeedTab({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  const { t, i18n } = useTranslation();
  const c = useTheme();
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const { data } = await api.get<FeedEntry[]>('/social/feed'); setFeed(data); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (refreshing) load(); }, [refreshing]);

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#FF6535" />
    </View>
  );

  if (feed.length === 0) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 }}>
      <Ionicons name="golf-outline" size={40} color={c.inkMuted} />
      <Text style={{ color: c.inkSecondary, fontWeight: '600', fontSize: 16 }}>{t('social.feed.empty')}</Text>
      <Text style={{ color: c.inkMuted, fontSize: 14, textAlign: 'center' }}>{t('social.feed.emptyHint')}</Text>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6535" />}
    >
      {feed.map((entry) => (
        <View key={entry.id} style={{
          backgroundColor: c.bgCard, borderRadius: 16,
          overflow: 'hidden',
        }}>
          {/* User row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
            <Avatar name={entry.user.name} level={entry.user.level} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.inkPrimary, fontWeight: '700', fontSize: 14 }}>{entry.user.name}</Text>
              <Text style={{ color: c.inkMuted, fontSize: 12 }}>
                {entry.course.name} · {timeAgo(entry.date, i18n.language)}
              </Text>
            </View>
            {/* Score badge */}
            <View style={{
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
              backgroundColor: scoreColor(entry.scoreToPar) + '18',
              borderWidth: 1, borderColor: scoreColor(entry.scoreToPar) + '60',
            }}>
              <Text style={{ color: scoreColor(entry.scoreToPar), fontWeight: 'bold', fontSize: 18 }}>
                {entry.gross}
              </Text>
              <Text style={{ color: scoreColor(entry.scoreToPar), fontSize: 10, fontWeight: '700', textAlign: 'center' }}>
                {scoreDiff(entry.scoreToPar)}
              </Text>
            </View>
          </View>
          {/* Stats row */}
          <View style={{
            flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.bgBorder,
            paddingHorizontal: 14, paddingVertical: 10, gap: 20,
          }}>
            {[
              { label: 'PUTTS', value: String(entry.putts) },
              { label: 'GIR', value: `${entry.gir}/18` },
              { label: 'HCP', value: entry.user.handicap != null ? String(entry.user.handicap) : '—' },
            ].map((s) => (
              <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={{ color: c.inkMuted, fontSize: 10 }}>{s.label}</Text>
                <Text style={{ color: c.inkSecondary, fontSize: 11, fontWeight: 'bold' }}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ── Ranking Tab ───────────────────────────────────────────────────────
function RankingTab({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  const { t } = useTranslation();
  const c = useTheme();
  const [scope, setScope] = useState<'global' | 'friends'>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s: 'global' | 'friends') => {
    setLoading(true);
    try { const { data } = await api.get<LeaderboardEntry[]>(`/social/leaderboard?scope=${s}`); setEntries(data); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(scope); }, [scope]);
  useEffect(() => { if (refreshing) load(scope); }, [refreshing]);

  const rankColor = (rank: number) => {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return c.inkMuted;
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Scope toggle */}
      <View style={{ flexDirection: 'row', margin: 16, backgroundColor: c.bgCard, borderRadius: 12, padding: 4 }}>
        {([
          { key: 'global', iconName: 'earth-outline' },
          { key: 'friends', iconName: 'people-outline' },
        ] as const).map((s) => (
          <TouchableOpacity
            key={s.key}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center', gap: 5,
              backgroundColor: scope === s.key ? '#FF6535' : 'transparent',
            }}
            onPress={() => setScope(s.key)}
          >
            <Ionicons name={s.iconName} size={13} color={scope === s.key ? '#FFFFFF' : c.inkMuted} />
            <Text style={{ color: scope === s.key ? '#FFFFFF' : c.inkMuted, fontWeight: '700', fontSize: 12 }}>
              {t(`social.ranking.${s.key}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#FF6535" />
        </View>
      ) : entries.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Text style={{ color: c.inkMuted, fontSize: 14 }}>
            {scope === 'friends' ? t('social.ranking.noFriendsHcp') : t('social.ranking.noEntries')}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6535" />}
        >
          {/* Header row */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text style={{ width: 36, color: c.inkMuted, fontSize: 10, fontWeight: '700' }}>#</Text>
            <Text style={{ flex: 1, color: c.inkMuted, fontSize: 10, fontWeight: '700' }}>{t('social.ranking.player')}</Text>
            <Text style={{ width: 44, color: c.inkMuted, fontSize: 10, fontWeight: '700', textAlign: 'center' }}>HCP</Text>
            <Text style={{ width: 44, color: c.inkMuted, fontSize: 10, fontWeight: '700', textAlign: 'center' }}>Ø</Text>
            <Text style={{ width: 44, color: c.inkMuted, fontSize: 10, fontWeight: '700', textAlign: 'center' }}>BEST</Text>
          </View>

          {entries.map((entry) => (
            <View
              key={entry.id}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 12, paddingVertical: 12,
                marginBottom: 6, borderRadius: 14,
                backgroundColor: entry.isMe ? '#FF653510' : c.bgCard,
                
                
              }}
            >
              {/* Rank */}
              <View style={{ width: 36, alignItems: 'center' }}>
                {entry.rank <= 3 ? (
                  <Ionicons
                    name="medal-outline"
                    size={18}
                    color={entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : '#cd7f32'}
                  />
                ) : (
                  <Text style={{ color: rankColor(entry.rank), fontWeight: 'bold', fontSize: 14 }}>
                    {entry.rank}
                  </Text>
                )}
              </View>

              {/* Player */}
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar name={entry.name} level={entry.level} size={32} />
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: c.inkPrimary, fontWeight: '700', fontSize: 14 }}>
                      {entry.name}
                    </Text>
                    {entry.isMe && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: '#FF653525' }}>
                        <Text style={{ color: '#FF6535', fontSize: 9, fontWeight: '700' }}>{t('social.ranking.me')}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name={LEVEL_META[entry.level].iconName as any} size={11} color={LEVEL_META[entry.level].color} />
                    <Text style={{ color: c.inkMuted, fontSize: 11 }}>{entry.rounds} {t('social.ranking.rounds')}</Text>
                  </View>
                </View>
              </View>

              {/* Stats */}
              <Text style={{ width: 44, color: '#FF6535', fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>
                {entry.handicap != null ? entry.handicap : '—'}
              </Text>
              <Text style={{ width: 44, color: entry.avgScore != null ? scoreColor(Math.round(entry.avgScore)) : c.inkMuted, fontWeight: '600', fontSize: 13, textAlign: 'center' }}>
                {entry.avgScore != null ? scoreDiff(Math.round(entry.avgScore)) : '—'}
              </Text>
              <Text style={{ width: 44, color: entry.bestScore != null ? scoreColor(entry.bestScore) : c.inkMuted, fontWeight: '600', fontSize: 13, textAlign: 'center' }}>
                {entry.bestScore != null ? scoreDiff(entry.bestScore) : '—'}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ── Friends Tab ───────────────────────────────────────────────────────
function FriendsTab({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  const { t } = useTranslation();
  const c = useTheme();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        api.get<FriendUser[]>('/social/friends'),
        api.get<FriendUser[]>('/social/requests'),
      ]);
      setFriends(friendsRes.data);
      setRequests(requestsRes.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (refreshing) load(); }, [refreshing]);

  const onSearch = (q: string) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try { const { data } = await api.get<SearchUser[]>(`/social/search?q=${encodeURIComponent(q)}`); setSearchResults(data); }
      catch {} finally { setSearching(false); }
    }, 400);
  };

  const sendRequest = async (userId: string) => {
    try {
      await api.post('/social/request', { userId });
      Alert.alert(t('social.friends.sent'), t('social.friends.sentMsg'));
      setSearchQuery('');
      setSearchResults([]);
      load();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.response?.data?.error ?? t('social.friends.cannotSend'));
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    try { await api.put(`/social/request/${friendshipId}/accept`); load(); }
    catch { Alert.alert(t('common.error'), t('social.friends.cannotAccept')); }
  };

  const removeFriend = (friend: FriendUser) => {
    Alert.alert(t('social.friends.removeTitle', { name: friend.name }), t('social.friends.removeMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.remove'), style: 'destructive', onPress: async () => {
        try { await api.delete(`/social/friends/${friend.friendshipId}`); load(); }
        catch {}
      }},
    ]);
  };

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#FF6535" />
    </View>
  );

  const showSearch = searchQuery.length >= 2;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6535" />}
    >
      {/* Search */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: c.bgElevated, borderRadius: 14,
        
        paddingHorizontal: 14, paddingVertical: 12,
      }}>
        <Ionicons name="search-outline" size={16} color={c.inkMuted} />
        <TextInput
          style={{ flex: 1, color: c.inkPrimary, fontSize: 15 }}
          placeholder={t('social.friends.searchPlaceholder')}
          placeholderTextColor={c.inkMuted}
          value={searchQuery}
          onChangeText={onSearch}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {searching && <ActivityIndicator size="small" color="#FF6535" />}
        {searchQuery.length > 0 && !searching && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
            <Ionicons name="close-circle" size={16} color={c.inkMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results */}
      {showSearch && (
        <View>
          <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            {t('social.friends.searchResults')}
          </Text>
          {searchResults.length === 0 && !searching ? (
            <Text style={{ color: c.inkMuted, fontSize: 14 }}>{t('social.friends.noResults')}</Text>
          ) : (
            searchResults.map((u) => (
              <View key={u.id} style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: c.bgCard, borderRadius: 14,
                
                padding: 12, marginBottom: 8,
              }}>
                <Avatar name={u.name} level={u.level} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.inkPrimary, fontWeight: '700' }}>{u.name}</Text>
                  <Text style={{ color: c.inkMuted, fontSize: 12 }}>
                    {u.handicap != null ? `HCP ${u.handicap}` : t('social.friends.noHcp')}{u.homeClub ? ` · ${u.homeClub}` : ''}
                  </Text>
                </View>
                {u.friendshipStatus === 'ACCEPTED' ? (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FF653520' }}>
                    <Text style={{ color: '#FF6535', fontSize: 12, fontWeight: '700' }}>{t('social.friends.isFriend')}</Text>
                  </View>
                ) : u.friendshipStatus === 'PENDING' ? (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: c.bgElevated }}>
                    <Text style={{ color: c.inkMuted, fontSize: 12 }}>
                      {u.isSender ? t('social.friends.pending') : t('social.friends.request')}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => sendRequest(u.id)}
                    style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#FF653520', borderWidth: 1, borderColor: '#FF6535' }}
                  >
                    <Text style={{ color: '#FF6535', fontSize: 12, fontWeight: '700' }}>{t('social.friends.addFriend')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      )}

      {/* Pending Requests */}
      {!showSearch && requests.length > 0 && (
        <View>
          <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            {t('social.friends.requests', { count: requests.length })}
          </Text>
          {requests.map((req) => (
            <View key={req.friendshipId} style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: c.bgCard, borderRadius: 14,
              
              padding: 12, marginBottom: 8,
            }}>
              <Avatar name={req.name} level={req.level} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.inkPrimary, fontWeight: '700' }}>{req.name}</Text>
                <Text style={{ color: c.inkMuted, fontSize: 12 }}>
                  {req.handicap != null ? `HCP ${req.handicap}` : t('social.friends.noHcp')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => acceptRequest(req.friendshipId)}
                style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#FF6535', marginRight: 6 }}
              >
                <Text style={{ color: '#0A0A0A', fontSize: 12, fontWeight: '700' }}>{t('social.friends.accept')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => removeFriend(req)}
                style={{ padding: 6 }}
              >
                <Ionicons name="close-outline" size={20} color={c.inkMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Friends List */}
      {!showSearch && (
        <View>
          <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            {t('social.friends.friendsList')}{friends.length > 0 ? ` (${friends.length})` : ''}
          </Text>
          {friends.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
              <Ionicons name="people-outline" size={40} color={c.inkMuted} />
              <Text style={{ color: c.inkSecondary, fontWeight: '600' }}>{t('social.friends.noFriends')}</Text>
              <Text style={{ color: c.inkMuted, fontSize: 14, textAlign: 'center' }}>{t('social.friends.noFriendsHint')}</Text>
            </View>
          ) : (
            friends.map((friend) => (
              <View key={friend.id} style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: c.bgCard, borderRadius: 14,
                
                padding: 12, marginBottom: 8,
              }}>
                <Avatar name={friend.name} level={friend.level} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.inkPrimary, fontWeight: '700', fontSize: 15 }}>{friend.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name={LEVEL_META[friend.level].iconName as any} size={12} color={LEVEL_META[friend.level].color} />
                    <Text style={{ color: c.inkMuted, fontSize: 12 }}>
                      {friend.handicap != null ? `HCP ${friend.handicap}` : t('social.friends.noHcp')}
                      {friend.homeClub ? ` · ${friend.homeClub}` : ''}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removeFriend(friend)} style={{ padding: 8 }}>
                  <Ionicons name="person-remove-outline" size={18} color={c.inkMuted} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────
export default function SocialScreen() {
  const { t } = useTranslation();
  const c = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 4 }}>
        <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
          {t('social.sectionLabel')}
        </Text>
        <Text style={{ color: c.inkPrimary, fontSize: 30, fontWeight: '900' }}>{t('social.title')}</Text>
      </View>

      {/* Internal Tab Bar */}
      <View style={{
        flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
        backgroundColor: c.bgElevated, marginHorizontal: 16, marginVertical: 12, borderRadius: 16,
      }}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 5, paddingVertical: 8, borderRadius: 12,
                backgroundColor: active ? '#FF653520' : 'transparent',
              }}
            >
              <Ionicons name={tab.icon as any} size={14} color={active ? '#FF6535' : c.inkMuted} />
              <Text style={{ fontSize: 12, fontWeight: '900', color: active ? '#FF6535' : c.inkMuted }}>
                {t(`social.tabs.${tab.key}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      {activeTab === 'feed'    && <FeedTab    refreshing={refreshing} onRefresh={onRefresh} />}
      {activeTab === 'ranking' && <RankingTab refreshing={refreshing} onRefresh={onRefresh} />}
      {activeTab === 'friends' && <FriendsTab refreshing={refreshing} onRefresh={onRefresh} />}
    </SafeAreaView>
  );
}
