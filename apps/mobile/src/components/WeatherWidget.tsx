import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../lib/theme';

// ── Open-Meteo Typen ───────────────────────────────────────────────────
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
}

// ── Wetter-Zustands-Mapping ────────────────────────────────────────────
const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Klarer Himmel',       icon: '☀️' },
  1:  { label: 'Überwiegend klar',    icon: '🌤️' },
  2:  { label: 'Teilweise bewölkt',   icon: '⛅' },
  3:  { label: 'Bedeckt',             icon: '☁️' },
  45: { label: 'Nebel',               icon: '🌫️' },
  48: { label: 'Raureif-Nebel',       icon: '🌫️' },
  51: { label: 'Leichter Nieselregen', icon: '🌦️' },
  53: { label: 'Nieselregen',         icon: '🌦️' },
  55: { label: 'Starker Nieselregen', icon: '🌧️' },
  61: { label: 'Leichter Regen',      icon: '🌧️' },
  63: { label: 'Regen',               icon: '🌧️' },
  65: { label: 'Starker Regen',       icon: '🌧️' },
  71: { label: 'Leichter Schnee',     icon: '🌨️' },
  73: { label: 'Schnee',              icon: '❄️' },
  75: { label: 'Starker Schnee',      icon: '❄️' },
  80: { label: 'Regenschauer',        icon: '🌦️' },
  81: { label: 'Regenschauer',        icon: '🌧️' },
  82: { label: 'Starke Schauer',      icon: '🌧️' },
  95: { label: 'Gewitter',            icon: '⛈️' },
  96: { label: 'Gewitter mit Hagel',  icon: '⛈️' },
  99: { label: 'Schweres Gewitter',   icon: '⛈️' },
};

function getWmo(code: number) {
  return WMO_CODES[code] ?? { label: 'Unbekannt', icon: '🌡️' };
}

// ── Spielempfehlung ────────────────────────────────────────────────────
type PlayRating = 'perfect' | 'good' | 'fair' | 'tough' | 'nogo';

interface PlayRecommendation {
  rating: PlayRating;
  label: string;
  color: string;
  icon: string;
  tips: string[];
}

function getPlayRecommendation(
  windKmh: number,
  gustKmh: number,
  precipitation: number,
  weatherCode: number,
  tempC: number,
): PlayRecommendation {
  const tips: string[] = [];

  // Absolute no-go conditions
  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
    return {
      rating: 'nogo',
      label: 'Nicht spielen',
      color: '#ef4444',
      icon: '⚡',
      tips: ['Gewitter — bitte den Platz sofort verlassen', 'Blitzgefahr auf dem Golfplatz'],
    };
  }
  if (windKmh > 50 || gustKmh > 65) {
    return {
      rating: 'nogo',
      label: 'Nicht spielen',
      color: '#ef4444',
      icon: '🌬️',
      tips: ['Orkanartige Winde machen das Spiel gefährlich', 'Bäume und Äste können ein Risiko darstellen'],
    };
  }
  if (precipitation > 5) {
    return {
      rating: 'nogo',
      label: 'Nicht spielen',
      color: '#ef4444',
      icon: '🌊',
      tips: ['Starkregen — Spielfeldbedingungen nicht sicher', 'Platz wahrscheinlich gesperrt'],
    };
  }

  // Tough conditions
  if (windKmh > 35 || precipitation > 2.5 || [65, 73, 75, 82].includes(weatherCode)) {
    if (windKmh > 35) tips.push('Deutlich mehr Schläger nehmen, niedrige Flugbahn wählen');
    if (windKmh > 35) tips.push('Gegen den Wind: 20-30% mehr Distanz einkalkulieren');
    if (precipitation > 2.5) tips.push('Regenhandschuh und wasserdichte Kleidung unbedingt notwendig');
    if (precipitation > 2.5) tips.push('Ball hält weniger, Greens spielen langsamer');
    return { rating: 'tough', label: 'Schwierige Bedingungen', color: '#f97316', icon: '🌧️', tips };
  }

  // Fair conditions
  if (windKmh > 20 || precipitation > 0.5 || [3, 45, 48, 55, 61, 63, 71, 80, 81].includes(weatherCode)) {
    if (windKmh > 20) tips.push(`Wind ${Math.round(windKmh)} km/h — 1-2 Schläger mehr nehmen`);
    if (windKmh > 20) tips.push('Seitenwind: Ball in die Windrichtung aimsn');
    if (precipitation > 0.5) tips.push('Regenhandschuh bereithalten');
    if (tempC < 10) tips.push('Kühle Temperaturen: mehr Aufwärmen, Ball fliegt kürzer');
    return { rating: 'fair', label: 'Spielbar', color: '#f59e0b', icon: '⛅', tips };
  }

  // Good conditions
  if (windKmh > 10 || tempC < 8) {
    if (windKmh > 10) tips.push(`Leichter Wind ${Math.round(windKmh)} km/h — kaum Einfluss`);
    if (tempC < 8) tips.push('Kühl — Ball fliegt ca. 5% kürzer, gut aufwärmen');
    return { rating: 'good', label: 'Gute Bedingungen', color: '#00e87a', icon: '🌤️', tips };
  }

  // Perfect
  tips.push('Ideale Bedingungen für dein bestes Spiel');
  if (tempC > 18 && tempC < 28) tips.push('Optimale Temperatur für maximale Flexibilität');
  return { rating: 'perfect', label: 'Perfekte Bedingungen', color: '#00e87a', icon: '☀️', tips };
}

// ── Wind-Richtungs-Pfeil ───────────────────────────────────────────────
function windDirLabel(deg: number): string {
  const dirs = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// ── Haupt-Komponente ───────────────────────────────────────────────────
export function WeatherWidget() {
  const c = useTheme();
  const [weather, setWeather] = useState<OpenMeteoResponse['current'] | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Standortzugriff verweigert');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      // Reverse geocoding für Ortsname
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        setLocationName(place?.city ?? place?.subregion ?? place?.region ?? null);
      } catch {}

      // Open-Meteo API — kostenlos, kein API-Key
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weathercode` +
        `&wind_speed_unit=kmh&timezone=auto`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Wetterdaten nicht verfügbar');
      const data: OpenMeteoResponse = await res.json();
      setWeather(data.current);
    } catch (e: any) {
      setError('Wetter konnte nicht geladen werden');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View className="bg-bg-card border border-bg-border rounded-xl p-4 flex-row items-center gap-3">
        <ActivityIndicator size="small" color="#00e87a" />
        <Text className="text-ink-muted text-sm">Wetter wird geladen…</Text>
      </View>
    );
  }

  if (error || !weather) {
    return (
      <TouchableOpacity
        className="bg-bg-card border border-bg-border rounded-xl p-4 flex-row items-center gap-3"
        onPress={loadWeather}
      >
        <Ionicons name="cloud-offline-outline" size={20} color={c.inkMuted} />
        <View className="flex-1">
          <Text className="text-ink-muted text-sm">{error ?? 'Kein Wetter'}</Text>
          <Text className="text-neon-green text-xs mt-0.5">Erneut versuchen →</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const wmo = getWmo(weather.weathercode);
  const rec = getPlayRecommendation(
    weather.wind_speed_10m,
    weather.wind_gusts_10m,
    weather.precipitation,
    weather.weathercode,
    weather.temperature_2m,
  );

  return (
    <TouchableOpacity
      className="rounded-xl overflow-hidden"
      style={{ borderWidth: 1, borderColor: c.bgBorder }}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.9}
    >
      {/* Main Row */}
      <View
        className="p-4"
        style={{ backgroundColor: c.bgCard }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="partly-sunny-outline" size={14} color={c.inkMuted} />
            <Text className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">
              Wetter{locationName ? ` · ${locationName}` : ''}
            </Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={c.inkMuted} />
        </View>

        <View className="flex-row items-center gap-4">
          {/* Temp + Condition */}
          <View className="flex-row items-center gap-3">
            <Text style={{ fontSize: 36 }}>{wmo.icon}</Text>
            <View>
              <Text className="text-ink-primary font-bold" style={{ fontSize: 28, lineHeight: 32 }}>
                {Math.round(weather.temperature_2m)}°
              </Text>
              <Text className="text-ink-muted text-xs">
                gefühlt {Math.round(weather.apparent_temperature)}°
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
                  ? ` (Böen ${Math.round(weather.wind_gusts_10m)})`
                  : ''}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="water-outline" size={13} color={c.inkMuted} />
              <Text className="text-ink-secondary text-xs">
                {weather.precipitation > 0
                  ? `${weather.precipitation} mm/h`
                  : 'Kein Niederschlag'}
              </Text>
            </View>
            <Text className="text-ink-muted text-xs">{wmo.label}</Text>
          </View>

          {/* Spielampel */}
          <View
            className="px-3 py-2 rounded-xl items-center"
            style={{ backgroundColor: rec.color + '20' }}
          >
            <Text style={{ fontSize: 18 }}>{rec.icon}</Text>
            <Text className="text-xs font-bold mt-0.5" style={{ color: rec.color }} numberOfLines={2}>
              {rec.rating === 'perfect' ? 'Ideal' :
               rec.rating === 'good' ? 'Gut' :
               rec.rating === 'fair' ? 'OK' :
               rec.rating === 'tough' ? 'Schwer' : 'Stop'}
            </Text>
          </View>
        </View>
      </View>

      {/* Expanded: Recommendation Detail */}
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
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: rec.color }}
            />
            <Text className="font-bold text-sm" style={{ color: rec.color }}>{rec.label}</Text>
          </View>

          {/* Tips */}
          {rec.tips.map((tip, i) => (
            <View key={i} className="flex-row items-start gap-2.5">
              <Ionicons name="golf-outline" size={13} color={rec.color} style={{ marginTop: 2 }} />
              <Text className="text-ink-secondary text-sm leading-5 flex-1">{tip}</Text>
            </View>
          ))}

          {/* Refresh */}
          <TouchableOpacity
            className="flex-row items-center gap-1.5 mt-1"
            onPress={(e) => { e.stopPropagation(); loadWeather(); }}
          >
            <Ionicons name="refresh-outline" size={12} color={c.inkMuted} />
            <Text className="text-ink-muted text-xs">Aktualisieren</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}
