import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';

function passwordStrength(pwd: string): 0 | 1 | 2 | 3 | 4 {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s as 0 | 1 | 2 | 3 | 4;
}

const STRENGTH_COLOR = ['#333', '#ef4444', '#f59e0b', '#22c55e', '#00e87a'] as const;

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [handicap, setHandicap] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const { register, isLoading } = useAuthStore();
  const { t } = useTranslation();

  const pwStrength = passwordStrength(password);

  const handleRegister = async () => {
    if (!name || !email || !password) { Alert.alert(t('common.error'), t('auth.register.requiredFields')); return; }
    if (password.length < 8) { Alert.alert(t('common.error'), t('auth.register.passwordTooShort')); return; }
    if (password !== confirmPassword) { Alert.alert(t('common.error'), t('auth.register.passwordMismatch')); return; }
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
        <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6" style={{ backgroundColor: '#FF653520' }}>
          <Ionicons name="mail-outline" size={40} color="#FF6535" />
        </View>
        <Text className="text-ink-primary text-3xl font-black text-center mb-3">
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
          className="rounded-2xl py-4 px-8 items-center bg-bg-card w-full"
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text className="text-ink-primary font-bold text-base">{t('auth.register.pendingLogin')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const inputStyle = "bg-bg-card text-ink-primary rounded-2xl px-4 py-4 text-base";
  const labelStyle = "text-ink-muted text-xs font-bold uppercase tracking-widest mb-2";

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-bg-base">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">

          <View className="mb-10">
            <Text className="text-ink-muted text-xs font-bold uppercase tracking-widest mb-2">FairwayIQ</Text>
            <Text className="text-ink-primary text-4xl font-black">{t('auth.register.title')}</Text>
            <Text className="text-ink-secondary text-base mt-2">{t('auth.register.subtitle')}</Text>
          </View>

          <View className="gap-4">
            {/* Name */}
            <View>
              <Text className={labelStyle}>{t('auth.register.nameLabel')}</Text>
              <TextInput
                className={inputStyle}
                placeholder={t('auth.register.namePlaceholder')}
                placeholderTextColor="#444444"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Email */}
            <View>
              <Text className={labelStyle}>{t('auth.register.emailLabel')}</Text>
              <TextInput
                className={inputStyle}
                placeholder={t('auth.register.emailPlaceholder')}
                placeholderTextColor="#444444"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <View>
              <Text className={labelStyle}>{t('auth.register.passwordLabel')}</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  className={inputStyle}
                  style={{ paddingRight: 48 }}
                  placeholder="••••••••"
                  placeholderTextColor="#444444"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  secureTextEntry={!showPw}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPw((v) => !v)}
                  style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}
                >
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
                </TouchableOpacity>
              </View>
              {/* Password strength bar */}
              {password.length > 0 && (
                <View style={{ marginTop: 8, gap: 6 }}>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <View
                        key={i}
                        style={{
                          flex: 1, height: 3, borderRadius: 2,
                          backgroundColor: i <= pwStrength ? STRENGTH_COLOR[pwStrength] : '#333',
                        }}
                      />
                    ))}
                  </View>
                  <Text style={{ fontSize: 11, color: STRENGTH_COLOR[pwStrength], fontWeight: '600' }}>
                    {[
                      t('auth.register.pwWeak'),
                      t('auth.register.pwWeak'),
                      t('auth.register.pwFair'),
                      t('auth.register.pwGood'),
                      t('auth.register.pwStrong'),
                    ][pwStrength]}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View>
              <Text className={labelStyle}>{t('auth.register.confirmPasswordLabel')}</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  className={inputStyle}
                  style={{ paddingRight: 48, borderWidth: confirmPassword.length > 0 ? 1.5 : 0, borderColor: confirmPassword.length > 0 ? (confirmPassword === password ? '#22c55e' : '#ef4444') : 'transparent' }}
                  placeholder="••••••••"
                  placeholderTextColor="#444444"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  secureTextEntry={!showConfirmPw}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPw((v) => !v)}
                  style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}
                >
                  <Ionicons name={showConfirmPw ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
                </TouchableOpacity>
                {confirmPassword.length > 0 && (
                  <View style={{ position: 'absolute', right: 44, top: 0, bottom: 0, justifyContent: 'center' }}>
                    <Ionicons
                      name={confirmPassword === password ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={confirmPassword === password ? '#22c55e' : '#ef4444'}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Handicap */}
            <View>
              <Text className={labelStyle}>{t('auth.register.handicapLabel')}</Text>
              <TextInput
                className={inputStyle}
                placeholder="18.0"
                placeholderTextColor="#444444"
                keyboardType="decimal-pad"
                autoComplete="off"
                textContentType="none"
                value={handicap}
                onChangeText={setHandicap}
              />
            </View>

            {handicap === '' && (
              <View className="flex-row items-center gap-2 px-3 py-2.5 rounded-xl bg-bg-elevated">
                <Text className="text-neon-green text-xs">ⓘ</Text>
                <Text className="text-ink-secondary text-xs">{t('auth.register.handicapHint')}</Text>
              </View>
            )}

            <TouchableOpacity
              className="rounded-2xl py-4 items-center mt-2"
              style={{ backgroundColor: '#FF6535', opacity: isLoading ? 0.6 : 1 }}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text className="text-white font-black text-base tracking-wide">
                {isLoading ? t('auth.register.registering') : t('auth.register.registerButton')}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-bg-border" />
            <Text className="text-ink-muted text-xs px-4">{t('auth.register.alreadyRegistered')}</Text>
            <View className="flex-1 h-px bg-bg-border" />
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className="rounded-2xl py-4 items-center bg-bg-card">
              <Text className="text-ink-primary font-bold text-base">{t('auth.register.loginLink')}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
