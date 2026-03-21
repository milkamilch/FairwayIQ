import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/theme';

// ── Open-Meteo Types ───────────────────────────────────────────────────
interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    precipitation: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    wind_direction_10m: number;
    weathercode: number;
  };
  daily: {
    sunrise: string[];
    sunset: string[];
  };
}

// ── WMO code icons (Ionicons names) ───────────────────────────────────
const WMO_ICONS: Record<number, string> = {
  0: 'sunny-outline', 1: 'partly-sunny-outline', 2: 'partly-sunny-outline', 3: 'cloudy-outline',
  45: 'cloud-outline', 48: 'cloud-outline',
  51: 'rainy-outline', 53: 'rainy-outline', 55: 'rainy-outline',
  61: 'rainy-outline', 63: 'rainy-outline', 65: 'rainy-outline',
  71: 'snow-outline', 73: 'snow-outline', 75: 'snow-outline',
  80: 'rainy-outline', 81: 'rainy-outline', 82: 'rainy-outline',
  95: 'thunderstorm-outline', 96: 'thunderstorm-outline', 99: 'thunderstorm-outline',
};

type PlayRating = 'perfect' | 'good' | 'fair' | 'tough' | 'nogo';

interface PlayRecommendation {
  rating: PlayRating;
  labelKey: string; // key for full label (in expanded view)
  color: string;
  iconName: string;
  tipKeys: string[];
  tipValues?: Record<string, string | number>[];
}

function formatTime(isoDatetime: string): string {
  return isoDatetime.slice(11, 16);
}

function isNight(sunriseIso: string, sunsetIso: string): boolean {
  const now = new Date();
  return now < new Date(sunriseIso) || now > new Date(sunsetIso);
}

function getPlayRecommendation(
  windKmh: number,
  gustKmh: number,
  precipitation: number,
  weatherCode: number,
  tempC: number,
  dark: boolean,
): PlayRecommendation {
  if (dark) {
    return {
      rating: 'nogo',
      labelKey: 'weather.dark',
      color: '#6366f1',
      iconName: 'moon-outline',
      tipKeys: ['weatherPlay.tips.darkLight', 'weatherPlay.tips.darkOnly'],
    };
  }
  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
    return {
      rating: 'nogo',
      labelKey: 'weatherPlay.labels.nogo',
      color: '#ef4444',
      iconName: 'thunderstorm-outline',
      tipKeys: ['weatherPlay.tips.thunderAlert', 'weatherPlay.tips.lightningRisk'],
    };
  }
  if (windKmh > 50 || gustKmh > 65) {
    return {
      rating: 'nogo',
      labelKey: 'weatherPlay.labels.nogo',
      color: '#ef4444',
      iconName: 'cloudy-outline',
      tipKeys: ['weatherPlay.tips.orkanicWind', 'weatherPlay.tips.treeRisk'],
    };
  }
  if (precipitation > 5) {
    return {
      rating: 'nogo',
      labelKey: 'weatherPlay.labels.nogo',
      color: '#ef4444',
      iconName: 'rainy-outline',
      tipKeys: ['weatherPlay.tips.heavyRain', 'weatherPlay.tips.courseClosed'],
    };
  }
  if (windKmh > 35 || precipitation > 2.5 || [65, 73, 75, 82].includes(weatherCode)) {
    const keys: string[] = [];
    const vals: Record<string, string | number>[] = [];
    if (windKmh > 35) { keys.push('weatherPlay.tips.moreClubs'); vals.push({}); }
    if (windKmh > 35) { keys.push('weatherPlay.tips.windDistance'); vals.push({}); }
    if (precipitation > 2.5) { keys.push('weatherPlay.tips.rainGear'); vals.push({}); }
    if (precipitation > 2.5) { keys.push('weatherPlay.tips.slowGreens'); vals.push({}); }
    return { rating: 'tough', labelKey: 'weatherPlay.labels.tough', color: '#f97316', iconName: 'rainy-outline', tipKeys: keys, tipValues: vals };
  }
  if (windKmh > 20 || precipitation > 0.5 || [3, 45, 48, 55, 61, 63, 71, 80, 81].includes(weatherCode)) {
    const keys: string[] = [];
    const vals: Record<string, string | number>[] = [];
    if (windKmh > 20) { keys.push('weatherPlay.tips.windEffect'); vals.push({ value: Math.round(windKmh) }); }
    if (windKmh > 20) { keys.push('weatherPlay.tips.crosswindAim'); vals.push({}); }
    if (precipitation > 0.5) { keys.push('weatherPlay.tips.rainGlove'); vals.push({}); }
    if (tempC < 10) { keys.push('weatherPlay.tips.coldWarm'); vals.push({}); }
    return { rating: 'fair', labelKey: 'weatherPlay.labels.fair', color: '#f59e0b', iconName: 'partly-sunny-outline', tipKeys: keys, tipValues: vals };
  }
  if (windKmh > 10 || tempC < 8) {
    const keys: string[] = [];
    const vals: Record<string, string | number>[] = [];
    if (windKmh > 10) { keys.push('weatherPlay.tips.lightWind'); vals.push({ value: Math.round(windKmh) }); }
    if (tempC < 8) { keys.push('weatherPlay.tips.coldShort'); vals.push({}); }
    return { rating: 'good', labelKey: 'weatherPlay.labels.good', color: '#FF6535', iconName: 'partly-sunny-outline', tipKeys: keys, tipValues: vals };
  }
  return {
    rating: 'perfect',
    labelKey: 'weatherPlay.labels.perfect',
    color: '#FF6535',
    iconName: 'sunny-outline',
    tipKeys: ['weatherPlay.tips.idealConditions', tempC > 18 && tempC < 28 ? 'weatherPlay.tips.optimalTemp' : ''].filter(Boolean),
  };
}

function windDirLabel(deg: number): string {
  const dirs = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// ── Main Component ─────────────────────────────────────────────────────
export function WeatherWidget() {
  const { t } = useTranslation();
  const c = useTheme();
  const [weather, setWeather] = useState<OpenMeteoResponse['current'] | null>(null);
  const [sunrise, setSunrise] = useState<string | null>(null);
  const [sunset, setSunset] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { loadWeather(); }, []);

  const loadWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(t('weather.noPermission'));
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        setLocationName(place?.city ?? place?.subregion ?? place?.region ?? null);
      } catch {}
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weathercode` +
        `&daily=sunrise,sunset` +
        `&wind_speed_unit=kmh&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data: OpenMeteoResponse = await res.json();
      setWeather(data.current);
      setSunrise(data.daily.sunrise[0] ?? null);
      setSunset(data.daily.sunset[0] ?? null);
    } catch {
      setError(t('weather.cannotLoad'));
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View className="bg-bg-card rounded-2xl p-4 flex-row items-center gap-3">
        <ActivityIndicator size="small" color="#FF6535" />
        <Text className="text-ink-muted text-sm">{t('weather.loading')}</Text>
      </View>
    );
  }

  if (error || !weather) {
    return (
      <TouchableOpacity
        className="bg-bg-card rounded-2xl p-4 flex-row items-center gap-3"
        onPress={loadWeather}
      >
        <Ionicons name="cloud-offline-outline" size={20} color={c.inkMuted} />
        <View className="flex-1">
          <Text className="text-ink-muted text-sm">{error ?? t('weather.noWeather')}</Text>
          <Text className="text-neon-green text-xs mt-0.5">{t('weather.retry')}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const wmoIcon = WMO_ICONS[weather.weathercode] ?? 'thermometer-outline';
  const wmoLabel = t(`weather.conditions.${weather.weathercode}`, { defaultValue: t('weather.unknown') });
  const dark = sunrise && sunset ? isNight(sunrise, sunset) : false;
  const rec = getPlayRecommendation(
    weather.wind_speed_10m,
    weather.wind_gusts_10m,
    weather.precipitation,
    weather.weathercode,
    weather.temperature_2m,
    dark,
  );

  return (
    <TouchableOpacity
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: c.bgCard }}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.9}
    >
      {/* Main Row */}
      <View className="p-4" style={{ backgroundColor: c.bgCard }}>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="partly-sunny-outline" size={14} color={c.inkMuted} />
            <Text className="text-ink-secondary text-xs font-bold uppercase tracking-widest">
              {t('weather.label')}{locationName ? ` · ${locationName}` : ''}
            </Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={c.inkMuted} />
        </View>

        <View className="flex-row items-center gap-4">
          {/* Temp + Condition */}
          <View className="flex-row items-center gap-3">
            <Ionicons name={wmoIcon as any} size={36} color={c.inkPrimary} />
            <View>
              <Text className="text-ink-primary font-bold" style={{ fontSize: 28, lineHeight: 32 }}>
                {Math.round(weather.temperature_2m)}°
              </Text>
              <Text className="text-ink-muted text-xs">
                {t('weather.feelsLike')} {Math.round(weather.apparent_temperature)}°
              </Text>
            </View>
          </View>

          {/* Wind + Rain */}
          <View className="flex-1 gap-1.5">
            <View className="flex-row items-center gap-2">
              <Ionicons name="compass-outline" size={13} color={c.inkMuted} />
              <Text className="text-ink-secondary text-xs">
                {Math.round(weather.wind_speed_10m)} km/h {windDirLabel(weather.wind_direction_10m)}
                {weather.wind_gusts_10m > weather.wind_speed_10m + 5
                  ? ` (${t('weatherPlay.gusts', { value: Math.round(weather.wind_gusts_10m) })})`
                  : ''}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="water-outline" size={13} color={c.inkMuted} />
              <Text className="text-ink-secondary text-xs">
                {weather.precipitation > 0
                  ? `${weather.precipitation} mm/h`
                  : t('weather.noPrecipitation')}
              </Text>
            </View>
            {sunrise && sunset ? (
              <View className="flex-row items-center gap-2">
                <Ionicons name="sunny-outline" size={11} color={c.inkMuted} />
                <Text className="text-ink-muted text-xs">
                  {formatTime(sunrise)} · {formatTime(sunset)}
                  {dark ? `  · ${t('weather.dark')}` : ''}
                </Text>
              </View>
            ) : (
              <Text className="text-ink-muted text-xs">{wmoLabel}</Text>
            )}
          </View>

          {/* Play rating badge */}
          <View
            className="px-3 py-2 rounded-xl items-center"
            style={{ backgroundColor: rec.color + '20' }}
          >
            <Ionicons name={rec.iconName as any} size={18} color={rec.color} />
            <Text className="text-xs font-bold mt-0.5" style={{ color: rec.color }} numberOfLines={2}>
              {t(`weather.ratings.${rec.rating}`)}
            </Text>
          </View>
        </View>
      </View>

      {/* Expanded Detail */}
      {expanded && (
        <View
          style={{
            backgroundColor: rec.color + '0d',
            borderTopWidth: 1,
            borderTopColor: c.bgBorder,
            padding: 16,
            gap: 10,
          }}
        >
          {/* Rating Header */}
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: rec.color }} />
            <Text className="font-bold text-sm" style={{ color: rec.color }}>{t(rec.labelKey)}</Text>
          </View>

          {/* Sunrise / Sunset */}
          {sunrise && sunset && (
            <View style={{
              flexDirection: 'row', gap: 16, paddingVertical: 8,
              borderTopWidth: 1, borderTopColor: c.bgBorder,
              borderBottomWidth: 1, borderBottomColor: c.bgBorder,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sunny-outline" size={16} color="#f59e0b" />
                <View>
                  <Text style={{ color: c.inkMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('weather.sunrise')}</Text>
                  <Text style={{ color: c.inkPrimary, fontWeight: '700', fontSize: 15 }}>{formatTime(sunrise)}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="moon-outline" size={16} color="#f97316" />
                <View>
                  <Text style={{ color: c.inkMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('weather.sunset')}</Text>
                  <Text style={{ color: c.inkPrimary, fontWeight: '700', fontSize: 15 }}>{formatTime(sunset)}</Text>
                </View>
              </View>
              {dark && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="moon-outline" size={16} color="#6366f1" />
                  <View>
                    <Text style={{ color: c.inkMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('weather.status')}</Text>
                    <Text style={{ color: '#6366f1', fontWeight: '700', fontSize: 15 }}>{t('weather.dark')}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Tips */}
          {rec.tipKeys.map((key, i) => (
            <View key={i} className="flex-row items-start gap-2.5">
              <Ionicons name="golf-outline" size={13} color={rec.color} style={{ marginTop: 2 }} />
              <Text className="text-ink-secondary text-sm leading-5 flex-1">
                {t(key, rec.tipValues?.[i] ?? {})}
              </Text>
            </View>
          ))}

          {/* Refresh */}
          <TouchableOpacity
            className="flex-row items-center gap-1.5 mt-1"
            onPress={(e) => { e.stopPropagation(); loadWeather(); }}
          >
            <Ionicons name="refresh-outline" size={12} color={c.inkMuted} />
            <Text className="text-ink-muted text-xs">{t('weather.refresh')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}
