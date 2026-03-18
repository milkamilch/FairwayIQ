import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handicap, setHandicap] = useState('');
  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !email || !password) { Alert.alert('Fehler', 'Name, E-Mail und Passwort sind Pflichtfelder'); return; }
    if (password.length < 8) { Alert.alert('Fehler', 'Passwort muss mindestens 8 Zeichen haben'); return; }
    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password, handicap: handicap ? parseFloat(handicap) : undefined });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        Alert.alert('Fehler', 'Diese E-Mail ist bereits registriert.');
      } else if (!err?.response) {
        Alert.alert('Verbindungsfehler', `Backend nicht erreichbar.\nURL: ${process.env.EXPO_PUBLIC_API_URL}\n\nLäuft das Backend? Ist die IP korrekt?`);
      } else {
        Alert.alert('Fehler', err?.response?.data?.error ?? 'Registrierung fehlgeschlagen.');
      }
    }
  };

  const fields = [
    { label: 'NAME', placeholder: 'Max Mustermann', value: name, setter: setName, secure: false, keyboard: 'default' as const },
    { label: 'E-MAIL', placeholder: 'deine@email.de', value: email, setter: setEmail, secure: false, keyboard: 'email-address' as const },
    { label: 'PASSWORT', placeholder: '••••••••', value: password, setter: setPassword, secure: true, keyboard: 'default' as const },
    { label: 'HANDICAP (OPTIONAL)', placeholder: '18.0', value: handicap, setter: setHandicap, secure: false, keyboard: 'decimal-pad' as const },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-bg-base">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">

          <View className="mb-10">
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2">FairwayIQ</Text>
            <Text className="text-ink-primary text-3xl font-bold">Account erstellen</Text>
            <Text className="text-ink-secondary text-sm mt-1">Starte deine Performance-Journey</Text>
          </View>

          <View className="gap-4">
            {fields.map((f) => (
              <View key={f.label}>
                <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2">{f.label}</Text>
                <TextInput
                  className="bg-bg-card border border-bg-border text-ink-primary rounded-xl px-4 py-4 text-base"
                  placeholder={f.placeholder}
                  placeholderTextColor="#44445a"
                  keyboardType={f.keyboard}
                  autoCapitalize="none"
                  secureTextEntry={f.secure}
                  value={f.value}
                  onChangeText={f.setter}
                />
              </View>
            ))}

            {handicap === '' && (
              <View className="flex-row items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated border border-bg-border">
                <Text className="text-neon-green text-xs">ⓘ</Text>
                <Text className="text-ink-secondary text-xs">Kein Handicap → Eingestufter als Anfänger</Text>
              </View>
            )}

            <TouchableOpacity
              className="rounded-xl py-4 items-center mt-2"
              style={{ backgroundColor: '#00e87a', opacity: isLoading ? 0.6 : 1 }}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text className="text-bg-base font-bold text-base tracking-wide">
                {isLoading ? 'ERSTELLEN...' : 'ACCOUNT ERSTELLEN'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-bg-border" />
            <Text className="text-ink-muted text-xs px-3">BEREITS REGISTRIERT?</Text>
            <View className="flex-1 h-px bg-bg-border" />
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className="rounded-xl py-4 items-center border border-bg-border">
              <Text className="text-ink-primary font-semibold text-base">Anmelden</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
