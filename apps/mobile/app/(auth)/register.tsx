import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handicap, setHandicap] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const { register, isLoading } = useAuthStore();
  const { t } = useTranslation();

  const handleRegister = async () => {
    if (!name || !email || !password) { Alert.alert(t('common.error'), t('auth.register.requiredFields')); return; }
    if (password.length < 8) { Alert.alert(t('common.error'), t('auth.register.passwordTooShort')); return; }
    try {
      const result = await register({ name: name.trim(), email: email.trim().toLowerCase(), password, handicap: handicap ? parseFloat(handicap) : undefined });
      setPendingEmail(result.email);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        Alert.alert(t('common.error'), t('auth.register.emailTaken'));
      } else if (!err?.response) {
        Alert.alert(t('common.connectionError'), t('common.backendUnreachable', { url: process.env.EXPO_PUBLIC_API_URL }));
      } else {
        Alert.alert(t('common.error'), err?.response?.data?.error ?? t('auth.register.failed'));
      }
    }
  };

  if (pendingEmail) {
    return (
      <View className="flex-1 bg-bg-base items-center justify-center px-8">
        <View className="w-20 h-20 rounded-2xl bg-neon-glow border border-neon-green items-center justify-center mb-6">
          <Ionicons name="mail-outline" size={40} color="#00e87a" />
        </View>
        <Text className="text-ink-primary text-2xl font-bold text-center mb-3">
          {t('auth.register.pendingTitle')}
        </Text>
        <Text className="text-ink-secondary text-sm text-center mb-2">
          {t('auth.register.pendingSubtitle')}
        </Text>
        <Text className="text-neon-green font-bold text-base text-center mb-6">{pendingEmail}</Text>
        <Text className="text-ink-muted text-sm text-center leading-6 mb-10">
          {t('auth.register.pendingHint')}
        </Text>
        <TouchableOpacity
          className="rounded-xl py-4 px-8 items-center border border-bg-border w-full"
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text className="text-ink-primary font-semibold text-base">{t('auth.register.pendingLogin')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fields = [
    { label: t('auth.register.nameLabel'), placeholder: t('auth.register.namePlaceholder'), value: name, setter: setName, secure: false, keyboard: 'default' as const },
    { label: t('auth.register.emailLabel'), placeholder: t('auth.register.emailPlaceholder'), value: email, setter: setEmail, secure: false, keyboard: 'email-address' as const },
    { label: t('auth.register.passwordLabel'), placeholder: '••••••••', value: password, setter: setPassword, secure: true, keyboard: 'default' as const },
    { label: t('auth.register.handicapLabel'), placeholder: '18.0', value: handicap, setter: setHandicap, secure: false, keyboard: 'decimal-pad' as const },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-bg-base">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">

          <View className="mb-10">
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2">FairwayIQ</Text>
            <Text className="text-ink-primary text-3xl font-bold">{t('auth.register.title')}</Text>
            <Text className="text-ink-secondary text-sm mt-1">{t('auth.register.subtitle')}</Text>
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
                <Text className="text-ink-secondary text-xs">{t('auth.register.handicapHint')}</Text>
              </View>
            )}

            <TouchableOpacity
              className="rounded-xl py-4 items-center mt-2"
              style={{ backgroundColor: '#00e87a', opacity: isLoading ? 0.6 : 1 }}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text className="text-bg-base font-bold text-base tracking-wide">
                {isLoading ? t('auth.register.registering') : t('auth.register.registerButton')}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-bg-border" />
            <Text className="text-ink-muted text-xs px-3">{t('auth.register.alreadyRegistered')}</Text>
            <View className="flex-1 h-px bg-bg-border" />
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className="rounded-xl py-4 items-center border border-bg-border">
              <Text className="text-ink-primary font-semibold text-base">{t('auth.register.loginLink')}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
