import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert(t('common.error'), t('auth.login.fillAllFields')); return; }
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err: any) {
      if (!err?.response) {
        Alert.alert(t('common.connectionError'), t('common.backendUnreachable', { url: process.env.EXPO_PUBLIC_API_URL }));
      } else if (err?.response?.data?.error === 'EMAIL_NOT_VERIFIED') {
        Alert.alert(t('common.error'), t('auth.login.emailNotVerified'));
      } else {
        Alert.alert(t('common.error'), t('auth.login.invalidCredentials'));
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg-base"
    >
      <View className="flex-1 justify-center px-6">

        {/* Logo */}
        <View className="mb-12">
          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-10 h-10 rounded-lg bg-neon-glow border border-neon-green items-center justify-center">
              <Text className="text-neon-green text-xl">⛳</Text>
            </View>
            <Text className="text-ink-primary text-3xl font-bold tracking-tight">FairwayIQ</Text>
          </View>
          <Text className="text-ink-secondary text-sm ml-14">{t('auth.login.tagline')}</Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2">{t('auth.login.emailLabel')}</Text>
            <TextInput
              className="bg-bg-card border border-bg-border text-ink-primary rounded-xl px-4 py-4 text-base"
              placeholder={t('auth.login.emailPlaceholder')}
              placeholderTextColor="#44445a"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View>
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest mb-2">{t('auth.login.passwordLabel')}</Text>
            <TextInput
              className="bg-bg-card border border-bg-border text-ink-primary rounded-xl px-4 py-4 text-base"
              placeholder="••••••••"
              placeholderTextColor="#44445a"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            className="rounded-xl py-4 items-center mt-2"
            style={{ backgroundColor: '#00e87a', opacity: isLoading ? 0.6 : 1 }}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-bg-base font-bold text-base tracking-wide">
              {isLoading ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-px bg-bg-border" />
          <Text className="text-ink-muted text-xs px-3">{t('auth.login.noAccount')}</Text>
          <View className="flex-1 h-px bg-bg-border" />
        </View>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity
            className="rounded-xl py-4 items-center border border-bg-border"
          >
            <Text className="text-ink-primary font-semibold text-base">{t('auth.login.register')}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
