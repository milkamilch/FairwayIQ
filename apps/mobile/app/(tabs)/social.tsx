import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
const LEVEL_META: Record<GolferLevel, { icon: string; color: string; short: string }> = {
  BEGINNER:     { icon: '🌱', color: '#00e87a', short: 'ANF' },
  INTERMEDIATE: { icon: '⚡', color: '#f59e0b', short: 'FORT' },
  ADVANCED:     { icon: '🔥', color: '#f97316', short: 'GEÜ' },
  PRO:          { icon: '💎', color: '#a855f7', short: 'PRO' },
};

function scoreDiff(n: number) {
  if (n < 0) return String(n);
  if (n === 0) return 'E';
  return `+${n}`;
}

function scoreColor(d: number) {
  if (d <= -1) return '#00e87a';
  if (d === 0)  return '#f0f0ff';
  if (d === 1)  return '#f59e0b';
  return '#ef4444';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1) return 'Gerade eben';
  if (h < 24) return `vor ${h}h`;
  if (d < 7) return `vor ${d}d`;
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

// ── Avatar ─────────────────────────────────────────────────────────────
function Avatar({ name, level, size = 40 }: { name: string; level: GolferLevel; size?: number }) {
  const c = useTheme();
  const meta = LEVEL_META[level];
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: meta.color + '20',
      borderWidth: 1.5, borderColor: meta.color + '60',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.36, fontWeight: 'bold', color: meta.color }}>{initials}</Text>
    </View>
  );
}

// ── Tab Bar ───────────────────────────────────────────────────────────
const TABS = [
  { key: 'feed',      label: 'Feed',       icon: 'newspaper-outline' },
  { key: 'ranking',   label: 'Rangliste',  icon: 'podium-outline' },
  { key: 'friends',   label: 'Freunde',    icon: 'people-outline' },
] as const;
type TabKey = typeof TABS[number]['key'];

// ── Feed Tab ──────────────────────────────────────────────────────────
function FeedTab({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
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
      <ActivityIndicator color="#00e87a" />
    </View>
  );

  if (feed.length === 0) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 }}>
      <Text style={{ fontSize: 40 }}>⛳</Text>
      <Text style={{ color: c.inkSecondary, fontWeight: '600', fontSize: 16 }}>Noch keine Aktivität</Text>
      <Text style={{ color: c.inkMuted, fontSize: 14, textAlign: 'center' }}>
        Füge Freunde hinzu, um ihre Runden hier zu sehen.
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00e87a" />}
    >
      {feed.map((entry) => {
        const meta = LEVEL_META[entry.user.level];
        return (
          <View key={entry.id} style={{
            backgroundColor: c.bgCard, borderRadius: 16,
            borderWidth: 1, borderColor: c.bgBorder, overflow: 'hidden',
          }}>
            {/* User row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
              <Avatar name={entry.user.name} level={entry.user.level} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.inkPrimary, fontWeight: '700', fontSize: 14 }}>{entry.user.name}</Text>
                <Text style={{ color: c.inkMuted, fontSize: 12 }}>
                  {entry.course.name} · {timeAgo(entry.date)}
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
        );
      })}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ── Ranking Tab ───────────────────────────────────────────────────────
function RankingTab({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
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
      <View style={{ flexDirection: 'row', margin: 16, backgroundColor: c.bgCard, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: c.bgBorder }}>
        {(['global', 'friends'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center',
              backgroundColor: scope === s ? '#00e87a' : 'transparent',
            }}
            onPress={() => setScope(s)}
          >
            <Text style={{ color: scope === s ? '#07070f' : c.inkMuted, fontWeight: '700', fontSize: 12 }}>
              {s === 'global' ? '🌍 Global' : '👥 Freunde'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#00e87a" />
        </View>
      ) : entries.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Text style={{ color: c.inkMuted, fontSize: 14 }}>
            {scope === 'friends' ? 'Noch keine Freunde mit HCP' : 'Keine Einträge'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00e87a" />}
        >
          {/* Header row */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text style={{ width: 36, color: c.inkMuted, fontSize: 10, fontWeight: '700' }}>#</Text>
            <Text style={{ flex: 1, color: c.inkMuted, fontSize: 10, fontWeight: '700' }}>SPIELER</Text>
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
                backgroundColor: entry.isMe ? '#00e87a10' : c.bgCard,
                borderWidth: 1.5,
                borderColor: entry.isMe ? '#00e87a50' : c.bgBorder,
              }}
            >
              {/* Rank */}
              <View style={{ width: 36, alignItems: 'center' }}>
                {entry.rank <= 3 ? (
                  <Text style={{ fontSize: 18 }}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                  </Text>
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
                      <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: '#00e87a25' }}>
                        <Text style={{ color: '#00e87a', fontSize: 9, fontWeight: '700' }}>DU</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: c.inkMuted, fontSize: 11 }}>
                    {LEVEL_META[entry.level].icon} {entry.rounds} Runden
                  </Text>
                </View>
              </View>

              {/* Stats */}
              <Text style={{ width: 44, color: '#00e87a', fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>
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
  const c = useTheme();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

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
      Alert.alert('Gesendet!', 'Freundschaftsanfrage wurde gesendet.');
      setSearchQuery('');
      setSearchResults([]);
      load();
    } catch (e: any) {
      Alert.alert('Fehler', e?.response?.data?.error ?? 'Anfrage konnte nicht gesendet werden.');
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    try { await api.put(`/social/request/${friendshipId}/accept`); load(); }
    catch { Alert.alert('Fehler', 'Konnte nicht akzeptiert werden.'); }
  };

  const removeFriend = (friend: FriendUser) => {
    Alert.alert(`${friend.name} entfernen?`, 'Diese Person aus deiner Freundesliste entfernen?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Entfernen', style: 'destructive', onPress: async () => {
        try { await api.delete(`/social/friends/${friend.friendshipId}`); load(); }
        catch {}
      }},
    ]);
  };

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#00e87a" />
    </View>
  );

  const showSearch = searchQuery.length >= 2;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00e87a" />}
    >
      {/* Search */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: c.bgElevated, borderRadius: 14,
        borderWidth: 1, borderColor: c.bgBorder,
        paddingHorizontal: 14, paddingVertical: 12,
      }}>
        <Ionicons name="search-outline" size={16} color={c.inkMuted} />
        <TextInput
          style={{ flex: 1, color: c.inkPrimary, fontSize: 15 }}
          placeholder="Name oder E-Mail suchen…"
          placeholderTextColor={c.inkMuted}
          value={searchQuery}
          onChangeText={onSearch}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {searching && <ActivityIndicator size="small" color="#00e87a" />}
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
            Suchergebnisse
          </Text>
          {searchResults.length === 0 && !searching ? (
            <Text style={{ color: c.inkMuted, fontSize: 14 }}>Keine Ergebnisse gefunden.</Text>
          ) : (
            searchResults.map((u) => (
              <View key={u.id} style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: c.bgCard, borderRadius: 14,
                borderWidth: 1, borderColor: c.bgBorder,
                padding: 12, marginBottom: 8,
              }}>
                <Avatar name={u.name} level={u.level} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.inkPrimary, fontWeight: '700' }}>{u.name}</Text>
                  <Text style={{ color: c.inkMuted, fontSize: 12 }}>
                    {u.handicap != null ? `HCP ${u.handicap}` : 'Kein HCP'}{u.homeClub ? ` · ${u.homeClub}` : ''}
                  </Text>
                </View>
                {u.friendshipStatus === 'ACCEPTED' ? (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#00e87a20' }}>
                    <Text style={{ color: '#00e87a', fontSize: 12, fontWeight: '700' }}>✓ Freund</Text>
                  </View>
                ) : u.friendshipStatus === 'PENDING' ? (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: c.bgElevated }}>
                    <Text style={{ color: c.inkMuted, fontSize: 12 }}>{u.isSender ? 'Ausstehend' : 'Anfrage'}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => sendRequest(u.id)}  // pass email — actually we need email
                    style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#00e87a20', borderWidth: 1, borderColor: '#00e87a' }}
                  >
                    <Text style={{ color: '#00e87a', fontSize: 12, fontWeight: '700' }}>+ Hinzufügen</Text>
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
            Anfragen ({requests.length})
          </Text>
          {requests.map((req) => (
            <View key={req.friendshipId} style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: c.bgCard, borderRadius: 14,
              borderWidth: 1.5, borderColor: '#00e87a40',
              padding: 12, marginBottom: 8,
            }}>
              <Avatar name={req.name} level={req.level} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.inkPrimary, fontWeight: '700' }}>{req.name}</Text>
                <Text style={{ color: c.inkMuted, fontSize: 12 }}>
                  {req.handicap != null ? `HCP ${req.handicap}` : 'Kein HCP'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => acceptRequest(req.friendshipId)}
                style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#00e87a', marginRight: 6 }}
              >
                <Text style={{ color: '#07070f', fontSize: 12, fontWeight: '700' }}>Annehmen</Text>
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
            Freunde{friends.length > 0 ? ` (${friends.length})` : ''}
          </Text>
          {friends.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
              <Text style={{ fontSize: 40 }}>👥</Text>
              <Text style={{ color: c.inkSecondary, fontWeight: '600' }}>Noch keine Freunde</Text>
              <Text style={{ color: c.inkMuted, fontSize: 14, textAlign: 'center' }}>
                Suche nach anderen Spielern um sie hinzuzufügen.
              </Text>
            </View>
          ) : (
            friends.map((friend) => (
              <View key={friend.id} style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: c.bgCard, borderRadius: 14,
                borderWidth: 1, borderColor: c.bgBorder,
                padding: 12, marginBottom: 8,
              }}>
                <Avatar name={friend.name} level={friend.level} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.inkPrimary, fontWeight: '700', fontSize: 15 }}>{friend.name}</Text>
                  <Text style={{ color: c.inkMuted, fontSize: 12 }}>
                    {LEVEL_META[friend.level].icon}
                    {friend.handicap != null ? ` HCP ${friend.handicap}` : ' Kein HCP'}
                    {friend.homeClub ? ` · ${friend.homeClub}` : ''}
                  </Text>
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
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
        <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          Community
        </Text>
        <Text style={{ color: c.inkPrimary, fontSize: 24, fontWeight: 'bold' }}>Social</Text>
      </View>

      {/* Internal Tab Bar */}
      <View style={{
        flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
        borderBottomWidth: 1, borderBottomColor: c.bgBorder,
      }}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 5, paddingVertical: 8, borderRadius: 10,
                backgroundColor: active ? '#00e87a20' : 'transparent',
                borderWidth: 1,
                borderColor: active ? '#00e87a' : 'transparent',
              }}
            >
              <Ionicons name={tab.icon as any} size={14} color={active ? '#00e87a' : c.inkMuted} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#00e87a' : c.inkMuted }}>
                {tab.label}
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
