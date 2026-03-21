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
        <View className="mb-14">
          <View className="w-14 h-14 rounded-2xl items-center justify-center mb-5" style={{ backgroundColor: '#FF653520' }}>
            <Text style={{ fontSize: 28 }}>⛳</Text>
          </View>
          <Text className="text-ink-primary text-4xl font-black tracking-tight">FairwayIQ</Text>
          <Text className="text-ink-secondary text-base mt-2">{t('auth.login.tagline')}</Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-2">{t('auth.login.emailLabel')}</Text>
            <TextInput
              className="bg-bg-card text-ink-primary rounded-2xl px-4 py-4 text-base"
              placeholder={t('auth.login.emailPlaceholder')}
              placeholderTextColor="#444444"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View>
            <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-2">{t('auth.login.passwordLabel')}</Text>
            <TextInput
              className="bg-bg-card text-ink-primary rounded-2xl px-4 py-4 text-base"
              placeholder="••••••••"
              placeholderTextColor="#444444"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            className="rounded-2xl py-4 items-center mt-2"
            style={{ backgroundColor: '#FF6535', opacity: isLoading ? 0.6 : 1 }}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-white font-black text-base tracking-wide">
              {isLoading ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-px bg-bg-border" />
          <Text className="text-ink-muted text-xs px-4">{t('auth.login.noAccount')}</Text>
          <View className="flex-1 h-px bg-bg-border" />
        </View>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity className="rounded-2xl py-4 items-center bg-bg-card">
            <Text className="text-ink-primary font-bold text-base">{t('auth.login.register')}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
