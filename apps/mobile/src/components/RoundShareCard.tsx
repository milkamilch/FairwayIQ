import { forwardRef } from 'react';
import { View, Text, Image, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Round } from '@fairwayiq/shared';

export type ShareTemplate = 'dark' | 'photo' | 'minimal';

function scoreColor(diff: number, dark = true) {
  if (diff <= -2) return '#a855f7';
  if (diff === -1) return '#FF6535';
  if (diff === 0) return dark ? '#6ee7b7' : '#059669';
  if (diff === 1) return '#f59e0b';
  return '#ef4444';
}

function scoreToPar(diff: number): string {
  if (diff === 0) return 'EVEN';
  return diff > 0 ? `+${diff}` : String(diff);
}

interface Props {
  round: Round;
  template: ShareTemplate;
  backgroundImage?: string | null; // URI for photo template
}

// ── Shared data helper ─────────────────────────────────────────────────
function useRoundData(round: Round) {
  const totalStrokes = round.scores?.reduce((s, h) => s + h.strokes, 0) ?? 0;
  const totalPar = round.scores?.reduce((s, h) => s + h.par, 0) ?? 72;
  const diff = totalStrokes - totalPar;
  const putts = round.scores?.reduce((s, h) => s + h.putts, 0) ?? 0;
  const gir = round.scores?.filter((h) => h.greenInRegulation).length ?? 0;
  const fir = round.scores?.filter((h) => h.fairwayHit === true).length ?? 0;
  const firTotal = round.scores?.filter((h) => h.fairwayHit !== null).length ?? 0;
  const holeCount = round.scores?.length ?? 18;
  const courseName = (round as any).course?.name ?? round.courseName ?? '—';
  const date = new Date(round.date).toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const stats = [
    { label: 'PUTTS', value: String(putts) },
    { label: 'GIR', value: `${gir}/${holeCount}` },
    { label: 'FIR', value: `${fir}/${firTotal}` },
    ...(round.handicapDifferential != null ? [{ label: 'DIFF', value: String(round.handicapDifferential) }] : []),
  ];
  return { totalStrokes, diff, courseName, date, stats, holeCount };
}

// ── Template: Dark ─────────────────────────────────────────────────────
function DarkCard({ round }: { round: Round }) {
  const { totalStrokes, diff, courseName, date, stats, holeCount } = useRoundData(round);
  const color = scoreColor(diff);
  return (
    <View style={{ width: 360, backgroundColor: '#0D0D0D', borderRadius: 24, overflow: 'hidden' }}>
      <View style={{ height: 4, backgroundColor: color }} />
      <View style={{ padding: 28 }}>
        {/* Logo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#FF653520', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Ionicons name="golf-outline" size={18} color="#FF6535" />
          </View>
          <Text style={{ color: '#FF6535', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>FairwayIQ</Text>
        </View>
        {/* Course + date */}
        <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 22, lineHeight: 28, marginBottom: 4 }} numberOfLines={2}>{courseName}</Text>
        <Text style={{ color: '#555555', fontSize: 12, marginBottom: 32 }}>{date}</Text>
        {/* Score */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 32, gap: 16 }}>
          <Text style={{ color, fontWeight: '900', fontSize: 88, lineHeight: 84 }}>{totalStrokes}</Text>
          <View style={{ paddingBottom: 8 }}>
            <Text style={{ color, fontWeight: '800', fontSize: 28, lineHeight: 32 }}>{scoreToPar(diff)}</Text>
            <Text style={{ color: '#555555', fontSize: 12, marginTop: 4 }}>{holeCount === 9 ? '9 Löcher' : '18 Löcher'}</Text>
          </View>
        </View>
        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#1E1E1E', marginBottom: 24 }} />
        {/* Stats */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {stats.map((s) => (
            <View key={s.label} style={{ alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 18 }}>{s.value}</Text>
              <Text style={{ color: '#555555', fontSize: 10, fontWeight: '700', marginTop: 3, letterSpacing: 1 }}>{s.label}</Text>
            </View>
          ))}
        </View>
        {/* Footer */}
        <View style={{ marginTop: 28, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="earth-outline" size={12} color="#333333" />
          <Text style={{ color: '#333333', fontSize: 11, fontWeight: '600' }}>fairwayiq.app</Text>
        </View>
      </View>
    </View>
  );
}

// ── Template: Photo Overlay ────────────────────────────────────────────
function PhotoCard({ round, backgroundImage }: { round: Round; backgroundImage?: string | null }) {
  const { totalStrokes, diff, courseName, date, stats } = useRoundData(round);
  const color = scoreColor(diff);

  const placeholder = !backgroundImage;

  return (
    <View style={{ width: 360, height: 560, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1A1A1A' }}>
      {/* Background */}
      {backgroundImage ? (
        <Image
          source={{ uri: backgroundImage }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="image-outline" size={48} color="#333" />
          <Text style={{ color: '#444', fontSize: 13, marginTop: 8 }}>Foto wählen</Text>
        </View>
      )}

      {/* Top gradient overlay */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 120,
        background: 'transparent',
        // Simple dark fade at top for branding
        backgroundColor: 'rgba(0,0,0,0.45)',
      }} />

      {/* Bottom gradient overlay */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 280,
        backgroundColor: 'rgba(0,0,0,0.78)',
      }} />

      {/* Top: branding */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', padding: 20, gap: 8 }}>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FF6535', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="golf-outline" size={15} color="#0A0A0A" />
        </View>
        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 }}>FairwayIQ</Text>
      </View>

      {/* Bottom: stats overlay */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 28 }}>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>
          {date.toUpperCase()}
        </Text>
        <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 20, lineHeight: 24, marginBottom: 16 }} numberOfLines={1}>
          {courseName}
        </Text>

        {/* Score row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 20, gap: 12 }}>
          <Text style={{ color, fontWeight: '900', fontSize: 72, lineHeight: 68 }}>{totalStrokes}</Text>
          <Text style={{ color, fontWeight: '800', fontSize: 24, lineHeight: 28, paddingBottom: 6 }}>{scoreToPar(diff)}</Text>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 20 }}>
          {stats.map((s) => (
            <View key={s.label}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>{s.label}</Text>
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15, marginTop: 1 }}>{s.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── Template: Minimal ──────────────────────────────────────────────────
function MinimalCard({ round }: { round: Round }) {
  const { totalStrokes, diff, courseName, date, stats, holeCount } = useRoundData(round);
  const color = scoreColor(diff, false);
  return (
    <View style={{ width: 360, backgroundColor: '#FAFAFA', borderRadius: 24, overflow: 'hidden', padding: 28 }}>
      {/* Logo */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FF6535', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="golf-outline" size={14} color="#FFFFFF" />
          </View>
          <Text style={{ color: '#FF6535', fontWeight: '800', fontSize: 13 }}>FairwayIQ</Text>
        </View>
        <Text style={{ color: '#AAAAAA', fontSize: 11 }}>{holeCount === 9 ? '9 Löcher' : '18 Löcher'}</Text>
      </View>

      {/* Score + par */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: '#111111', fontWeight: '900', fontSize: 72, lineHeight: 72 }}>{totalStrokes}</Text>
        <View style={{
          paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50,
          backgroundColor: color + '18',
        }}>
          <Text style={{ color, fontWeight: '900', fontSize: 22 }}>{scoreToPar(diff)}</Text>
        </View>
      </View>

      {/* Course */}
      <Text style={{ color: '#111111', fontWeight: '800', fontSize: 18, marginBottom: 2 }} numberOfLines={1}>{courseName}</Text>
      <Text style={{ color: '#AAAAAA', fontSize: 12, marginBottom: 24 }}>{date}</Text>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: '#EBEBEB', marginBottom: 20 }} />

      {/* Stats */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {stats.map((s) => (
          <View key={s.label} style={{ alignItems: 'center' }}>
            <Text style={{ color: '#111111', fontWeight: '800', fontSize: 16 }}>{s.value}</Text>
            <Text style={{ color: '#AAAAAA', fontSize: 10, fontWeight: '700', marginTop: 3, letterSpacing: 1 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Ionicons name="earth-outline" size={11} color="#CCCCCC" />
        <Text style={{ color: '#CCCCCC', fontSize: 11, fontWeight: '600' }}>fairwayiq.app</Text>
      </View>
    </View>
  );
}

// ── Main export ────────────────────────────────────────────────────────
export const RoundShareCard = forwardRef<View, Props>(({ round, template, backgroundImage }, ref) => {
  return (
    <View ref={ref} collapsable={false}>
      {template === 'dark' && <DarkCard round={round} />}
      {template === 'photo' && <PhotoCard round={round} backgroundImage={backgroundImage} />}
      {template === 'minimal' && <MinimalCard round={round} />}
    </View>
  );
});
