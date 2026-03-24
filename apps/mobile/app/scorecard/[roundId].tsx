import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/lib/api';
import { useTheme } from '../../src/lib/theme';
import { Round, HoleScore } from '@fairwayiq/shared';

// ── Constants ──────────────────────────────────────────────────────────
const LABEL_W = 62;
const CELL_W  = 38;
const ROW_H   = 38;

// ── Score styling (semantic — stays fixed regardless of theme) ─────────
type ScoreType = 'eagle' | 'birdie' | 'par' | 'bogey' | 'double' | 'triple';

function getScoreType(strokes: number, par: number): ScoreType {
  const diff = strokes - par;
  if (diff <= -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0)  return 'par';
  if (diff === 1)  return 'bogey';
  if (diff === 2)  return 'double';
  return 'triple';
}

const SCORE_STYLE: Record<ScoreType, { bg: string; border: string; text: string; shape: 'circle' | 'dbl-circle' | 'square' | 'dbl-square' | 'none' }> = {
  eagle:  { bg: '#a855f720', border: '#a855f7', text: '#a855f7', shape: 'dbl-circle' },
  birdie: { bg: '#FF653520', border: '#FF6535', text: '#FF6535', shape: 'circle' },
  par:    { bg: 'transparent', border: 'transparent', text: '#6ee7b7', shape: 'none' },
  bogey:  { bg: '#f59e0b15', border: '#f59e0b', text: '#f59e0b', shape: 'square' },
  double: { bg: '#ef444420', border: '#ef4444', text: '#ef4444', shape: 'dbl-square' },
  triple: { bg: '#ef444430', border: '#ef4444', text: '#ef4444', shape: 'dbl-square' },
};

function ScoreCell({ strokes, par }: { strokes: number; par: number }) {
  const type = getScoreType(strokes, par);
  const s = SCORE_STYLE[type];
  const sz = CELL_W - 8;

  if (s.shape === 'none') {
    return (
      <View style={{ width: CELL_W, height: ROW_H, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: s.text, fontSize: 13, fontWeight: '800' }}>{strokes}</Text>
      </View>
    );
  }
  if (s.shape === 'circle') {
    return (
      <View style={{ width: CELL_W, height: ROW_H, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: sz, height: sz, borderRadius: sz / 2, backgroundColor: s.bg, borderWidth: 1.5, borderColor: s.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: s.text, fontSize: 13, fontWeight: '800' }}>{strokes}</Text>
        </View>
      </View>
    );
  }
  if (s.shape === 'dbl-circle') {
    return (
      <View style={{ width: CELL_W, height: ROW_H, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: sz + 4, height: sz + 4, borderRadius: (sz + 4) / 2, borderWidth: 1, borderColor: s.border + '60', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: sz - 2, height: sz - 2, borderRadius: (sz - 2) / 2, backgroundColor: s.bg, borderWidth: 1.5, borderColor: s.border, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: s.text, fontSize: 12, fontWeight: '800' }}>{strokes}</Text>
          </View>
        </View>
      </View>
    );
  }
  if (s.shape === 'dbl-square') {
    return (
      <View style={{ width: CELL_W, height: ROW_H, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: sz + 4, height: sz + 4, borderWidth: 1, borderColor: s.border + '60', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: sz - 2, height: sz - 2, backgroundColor: s.bg, borderWidth: 1.5, borderColor: s.border, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: s.text, fontSize: 12, fontWeight: '800' }}>{strokes}</Text>
          </View>
        </View>
      </View>
    );
  }
  // square (bogey)
  return (
    <View style={{ width: CELL_W, height: ROW_H, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: sz, height: sz, backgroundColor: s.bg, borderWidth: 1.5, borderColor: s.border, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: s.text, fontSize: 13, fontWeight: '800' }}>{strokes}</Text>
      </View>
    </View>
  );
}

function LabelCell({ label, highlight }: { label: string; highlight?: boolean }) {
  const c = useTheme();
  return (
    <View style={{ width: LABEL_W, height: ROW_H, justifyContent: 'center', paddingLeft: 4 }}>
      <Text style={{ color: highlight ? '#FF6535' : c.inkSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>{label}</Text>
    </View>
  );
}

function DataCell({ value, muted }: { value: string | number; muted?: boolean }) {
  const c = useTheme();
  return (
    <View style={{ width: CELL_W, height: ROW_H, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: muted ? c.inkMuted : c.inkSecondary, fontSize: 13, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function IconCell({ value }: { value: boolean | null }) {
  const c = useTheme();
  if (value === null) {
    return (
      <View style={{ width: CELL_W, height: ROW_H, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.bgBorder, fontSize: 14 }}>—</Text>
      </View>
    );
  }
  return (
    <View style={{ width: CELL_W, height: ROW_H, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={value ? 'checkmark-circle' : 'close-circle'} size={16} color={value ? '#6ee7b7' : '#ef444460'} />
    </View>
  );
}

function TotalCell({ value, color, bold }: { value: string | number; color?: string; bold?: boolean }) {
  const c = useTheme();
  return (
    <View style={{ width: CELL_W + 6, height: ROW_H, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bgSurface }}>
      <Text style={{ color: color ?? c.inkPrimary, fontSize: 13, fontWeight: bold ? '900' : '700' }}>{value}</Text>
    </View>
  );
}

function RowDivider() {
  const c = useTheme();
  return <View style={{ height: 1, backgroundColor: c.bgBorder }} />;
}

// ── Nine-hole table section ────────────────────────────────────────────
function NineHoleTable({ holes, label }: { holes: HoleScore[]; label: string }) {
  const c = useTheme();
  const totalStrokes = holes.reduce((s, h) => s + h.strokes, 0);
  const totalPar     = holes.reduce((s, h) => s + h.par, 0);
  const totalPutts   = holes.reduce((s, h) => s + h.putts, 0);
  const totalGIR     = holes.filter((h) => h.greenInRegulation).length;
  const totalFIR     = holes.filter((h) => h.fairwayHit === true).length;
  const totalFIRPoss = holes.filter((h) => h.fairwayHit !== null).length;
  const diff         = totalStrokes - totalPar;
  const diffColor    = diff < 0 ? '#FF6535' : diff === 0 ? '#6ee7b7' : diff <= 4 ? '#f59e0b' : '#ef4444';

  const rows = [
    { label: 'LOCH',  render: (h: HoleScore) => <DataCell key={h.id} value={h.holeNumber} muted />,              total: <TotalCell value={label} bold /> },
    { label: 'PAR',   render: (h: HoleScore) => <DataCell key={h.id} value={h.par} muted />,                     total: <TotalCell value={totalPar} /> },
    { label: 'SCORE', render: (h: HoleScore) => <ScoreCell key={h.id} strokes={h.strokes} par={h.par} />,        total: <TotalCell value={totalStrokes} color={diffColor} bold /> },
    { label: 'PUTTS', render: (h: HoleScore) => <DataCell key={h.id} value={h.putts} />,                         total: <TotalCell value={totalPutts} /> },
    { label: 'GIR',   render: (h: HoleScore) => <IconCell key={h.id} value={h.greenInRegulation} />,             total: <TotalCell value={`${totalGIR}/${holes.length}`} /> },
    { label: 'FIR',   render: (h: HoleScore) => <IconCell key={h.id} value={h.fairwayHit} />,                    total: <TotalCell value={totalFIRPoss > 0 ? `${totalFIR}/${totalFIRPoss}` : '—'} /> },
  ];

  return (
    <View>
      {rows.map((row, ri) => (
        <View key={row.label}>
          <View style={{ flexDirection: 'row' }}>
            <LabelCell label={row.label} highlight={row.label === 'SCORE'} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={false}>
              <View style={{ flexDirection: 'row' }}>
                {holes.map((h) => row.render(h))}
                {row.total}
              </View>
            </ScrollView>
          </View>
          {ri < rows.length - 1 && <RowDivider />}
        </View>
      ))}
    </View>
  );
}

function Legend() {
  const c = useTheme();
  const items = [
    { label: 'Eagle',        color: '#a855f7', shape: 'dbl-circle' as const },
    { label: 'Birdie',       color: '#FF6535', shape: 'circle'     as const },
    { label: 'Par',          color: '#6ee7b7', shape: 'none'       as const },
    { label: 'Bogey',        color: '#f59e0b', shape: 'square'     as const },
    { label: 'Doppel-Bogey', color: '#ef4444', shape: 'dbl-square' as const },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {item.shape === 'none'
            ? <Text style={{ color: item.color, fontSize: 13, fontWeight: '800', width: 10, textAlign: 'center' }}>·</Text>
            : <View style={{ width: 10, height: 10, borderRadius: item.shape.includes('circle') ? 5 : 0, backgroundColor: item.color + '30', borderWidth: 1.5, borderColor: item.color }} />
          }
          <Text style={{ color: c.inkSecondary, fontSize: 11 }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────
export default function ScorecardScreen() {
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { i18n } = useTranslation();
  const c = useTheme();

  useEffect(() => {
    api.get<Round>(`/rounds/${roundId}`)
      .then(({ data }) => setRound(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roundId]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FF6535" />
      </SafeAreaView>
    );
  }

  if (!round) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.inkSecondary }}>Runde nicht gefunden.</Text>
      </SafeAreaView>
    );
  }

  const scores    = [...(round.scores ?? [])].sort((a, b) => a.holeNumber - b.holeNumber);
  const front9    = scores.filter((h) => h.holeNumber <= 9);
  const back9     = scores.filter((h) => h.holeNumber >= 10);
  const totalStrokes = scores.reduce((s, h) => s + h.strokes, 0);
  const totalPar     = scores.reduce((s, h) => s + h.par, 0);
  const totalDiff    = totalStrokes - totalPar;
  const courseName   = (round as any).course?.name ?? round.courseName ?? '—';

  const diffColor =
    totalDiff < 0 ? '#FF6535' :
    totalDiff === 0 ? '#6ee7b7' :
    totalDiff <= 4 ? '#f59e0b' : '#ef4444';
  const diffLabel = totalDiff === 0 ? 'EVEN' : totalDiff > 0 ? `+${totalDiff}` : String(totalDiff);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.inkMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 18 }} numberOfLines={1}>{courseName}</Text>
          <Text style={{ color: c.inkMuted, fontSize: 12, marginTop: 2 }}>
            {new Date(round.date).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: diffColor, fontWeight: '900', fontSize: 28, lineHeight: 30 }}>{totalStrokes}</Text>
          <Text style={{ color: diffColor, fontWeight: '700', fontSize: 13 }}>{diffLabel}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Scorecard table */}
        <View style={{ backgroundColor: c.bgSurface, marginHorizontal: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.bgBorder }}>
          {/* Column header row */}
          <View style={{ backgroundColor: c.bgCard, flexDirection: 'row', paddingLeft: LABEL_W }}>
            {scores.map((h) => (
              <View key={h.id} style={{ width: CELL_W, alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ color: c.inkMuted, fontSize: 9, fontWeight: '700' }}>{h.holeNumber}</Text>
              </View>
            ))}
            <View style={{ width: CELL_W + 6, backgroundColor: c.bgCard }} />
          </View>
          <RowDivider />

          {front9.length > 0 && (
            <>
              <NineHoleTable holes={front9} label="OUT" />
              <RowDivider />
            </>
          )}

          {back9.length > 0 && (
            <>
              <View style={{ height: 6, backgroundColor: c.bgBase }} />
              <NineHoleTable holes={back9} label="IN" />
              <RowDivider />
            </>
          )}

          {/* Total row */}
          {front9.length > 0 && back9.length > 0 && (
            <View style={{ flexDirection: 'row', backgroundColor: c.bgCard }}>
              <LabelCell label="TOTAL" highlight />
              <TotalCell value={totalStrokes} color={diffColor} bold />
              <TotalCell value={diffLabel} color={diffColor} />
            </View>
          )}
        </View>

        <Legend />

        {/* Summary stats */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 12, paddingTop: 8 }}>
          {[
            { label: 'Putts gesamt',    value: String(scores.reduce((s, h) => s + h.putts, 0)) },
            { label: 'GIR',             value: `${scores.filter((h) => h.greenInRegulation).length}/${scores.length}` },
            { label: 'FIR',             value: (() => { const t = scores.filter((h) => h.fairwayHit !== null); return t.length > 0 ? `${scores.filter((h) => h.fairwayHit === true).length}/${t.length}` : '—'; })() },
            ...(round.handicapDifferential != null ? [{ label: 'Handicap Diff.', value: String(round.handicapDifferential) }] : []),
            ...(round.courseHandicap     != null ? [{ label: 'Course HCP',     value: String(round.courseHandicap)     }] : []),
            { label: 'Vorder 9', value: String(front9.reduce((s, h) => s + h.strokes, 0)) },
            { label: 'Hinter 9', value: String(back9.reduce((s, h) => s + h.strokes, 0)) },
          ].map((stat) => (
            <View key={stat.label} style={{ backgroundColor: c.bgCard, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: c.bgBorder, minWidth: '44%', flex: 1 }}>
              <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 18 }}>{stat.value}</Text>
              <Text style={{ color: c.inkMuted, fontSize: 11, marginTop: 2, fontWeight: '600' }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {round.notes && (
          <View style={{ marginHorizontal: 12, marginTop: 10, backgroundColor: c.bgCard, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.bgBorder }}>
            <Text style={{ color: c.inkMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 }}>NOTIZEN</Text>
            <Text style={{ color: c.inkSecondary, fontSize: 13, lineHeight: 20 }}>{round.notes}</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
