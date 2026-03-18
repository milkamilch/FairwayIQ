import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/lib/api';

const levelMeta: Record<string, { label: string; color: string; range: string }> = {
  BEGINNER:     { label: 'ANFÄNGER',       color: '#00e87a', range: 'HCP > 24' },
  INTERMEDIATE: { label: 'FORTGESCHRITTEN', color: '#f59e0b', range: 'HCP 13–24' },
  ADVANCED:     { label: 'GEÜBT',          color: '#f97316', range: 'HCP 5–12' },
  PRO:          { label: 'PRO',            color: '#a855f7', range: 'HCP < 5' },
};

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [handicap, setHandicap] = useState(user?.handicap?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const meta = levelMeta[user?.level ?? 'BEGINNER'];

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/me', { name: name.trim(), handicap: handicap ? parseFloat(handicap) : undefined });
      updateUser(data);
      setEditing(false);
    } catch { Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden'); }
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Abmelden', style: 'destructive', onPress: logout },
    ]);
  };

  const inputStyle = "bg-bg-elevated border border-bg-border text-ink-primary rounded-xl px-4 py-3 text-sm";
  const labelStyle = "text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2";

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <View className="px-5 pt-4 pb-4">
        <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">Account</Text>
        <Text className="text-ink-primary text-2xl font-bold mt-0.5">Profil</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Player Card */}
        <View className="bg-bg-card border border-bg-border rounded-xl p-5 mb-4">
          <View className="flex-row items-center gap-4">
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center"
              style={{ backgroundColor: meta.color + '15', borderWidth: 1, borderColor: meta.color + '40' }}
            >
              <Text className="text-2xl">⛳</Text>
            </View>
            <View className="flex-1">
              {editing ? (
                <TextInput
                  className="text-ink-primary font-bold text-lg border-b border-bg-border pb-1"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
              ) : (
                <Text className="text-ink-primary font-bold text-lg">{user?.name}</Text>
              )}
              <Text className="text-ink-muted text-xs mt-0.5">{user?.email}</Text>
            </View>
            <View className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: meta.color + '15', borderWidth: 1, borderColor: meta.color + '40' }}>
              <Text className="text-xs font-bold tracking-wider" style={{ color: meta.color }}>{meta.label}</Text>
            </View>
          </View>
        </View>

        {/* Handicap */}
        <View className="bg-bg-card border border-bg-border rounded-xl p-5 mb-4">
          <Text className={labelStyle}>Handicap</Text>
          {editing ? (
            <TextInput
              className={inputStyle}
              placeholder="z.B. 18.0"
              placeholderTextColor="#44445a"
              keyboardType="decimal-pad"
              value={handicap}
              onChangeText={setHandicap}
            />
          ) : (
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-ink-primary text-4xl font-bold">
                  {user?.handicap !== null && user?.handicap !== undefined ? user.handicap : '—'}
                </Text>
                <Text className="text-ink-muted text-xs mt-1">{meta.range}</Text>
              </View>
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ borderWidth: 2, borderColor: meta.color + '60', backgroundColor: meta.color + '10' }}
              >
                <Text className="font-bold text-xl" style={{ color: meta.color }}>
                  {user?.handicap !== null && user?.handicap !== undefined ? user.handicap : '?'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        {editing ? (
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center border border-bg-border"
              onPress={() => { setEditing(false); setName(user?.name ?? ''); setHandicap(user?.handicap?.toString() ?? ''); }}
            >
              <Text className="text-ink-secondary font-semibold text-sm">Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center"
              style={{ backgroundColor: '#00e87a', opacity: saving ? 0.6 : 1 }}
              onPress={handleSave}
              disabled={saving}
            >
              <Text className="text-bg-base font-bold text-sm">{saving ? 'SPEICHERN...' : 'SPEICHERN'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="bg-bg-card border border-bg-border rounded-xl px-4 py-4 mb-3 flex-row items-center gap-3"
            onPress={() => setEditing(true)}
          >
            <View className="w-8 h-8 rounded-lg bg-bg-elevated items-center justify-center">
              <Ionicons name="pencil-outline" size={16} color="#8888aa" />
            </View>
            <Text className="text-ink-primary font-medium flex-1">Profil bearbeiten</Text>
            <Ionicons name="chevron-forward" size={14} color="#44445a" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="bg-bg-card border rounded-xl px-4 py-4 flex-row items-center gap-3 mb-8"
          style={{ borderColor: '#ef444430' }}
          onPress={handleLogout}
        >
          <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: '#ef444415' }}>
            <Ionicons name="log-out-outline" size={16} color="#ef4444" />
          </View>
          <Text className="text-red-400 font-medium flex-1">Abmelden</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
