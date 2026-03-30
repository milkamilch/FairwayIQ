import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { api } from '../lib/api';
import { useTheme } from '../lib/theme';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W  = SCREEN_W - 40;  // px-5 on each side
const CHART_H  = 160;
const PAD_L    = 36;
const PAD_R    = 12;
const PAD_T    = 16;
const PAD_B    = 28;
const PLOT_W   = CHART_W - PAD_L - PAD_R;
const PLOT_H   = CHART_H - PAD_T - PAD_B;

interface RoundPoint {
  date:                 string;
  scoreToPar:           number;
  courseName:           string;
  handicapDifferential: number | null;
}

interface TrendData {
  rounds:     RoundPoint[];
  movingAvg:  number[];
  handicap:   { date: string; value: number }[];
}

type Mode = 'score' | 'handicap';

function dotColor(score: number): string {
  if (score <= -2) return '#a855f7';
  if (score === -1) return '#6ee7b7';
  if (score === 0)  return '#6ee7b7';
  if (score <= 5)   return '#FF6535';
  return '#ef4444';
}

function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX  = (prev.x + curr.x) / 2;
    d += ` C${cpX.toFixed(1)},${prev.y.toFixed(1)} ${cpX.toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
  }
  return d;
}

export function ScoreTrendChart() {
  const c = useTheme();
  const [data, setData]       = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode]       = useState<Mode>('score');
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    api.get<TrendData>('/rounds/stats/trend')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={{ height: CHART_H + 48, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bgCard, borderRadius: 20 }}>
        <ActivityIndicator color="#FF6535" />
      </View>
    );
  }

  if (!data || data.rounds.length < 2) return null;

  // ── Score mode ────────────────────────────────────────────────────────
  const scores    = data.rounds.map((r) => r.scoreToPar);
  const avgLine   = data.movingAvg;
  const minScore  = Math.min(...scores, 0) - 1;
  const maxScore  = Math.max(...scores, 0) + 2;
  const scoreRange = maxScore - minScore;

  function toX(i: number, total: number): number {
    return PAD_L + (i / Math.max(total - 1, 1)) * PLOT_W;
  }
  function toY(val: number, min: number, range: number): number {
    return PAD_T + (1 - (val - min) / range) * PLOT_H;
  }

  const scorePts = scores.map((s, i) => ({ x: toX(i, scores.length), y: toY(s, minScore, scoreRange) }));
  const avgPts   = avgLine.map((s, i) => ({ x: toX(i, avgLine.length), y: toY(s, minScore, scoreRange) }));
  const parY     = toY(0, minScore, scoreRange);

  // ── Handicap mode ─────────────────────────────────────────────────────
  const hcpPoints = data.handicap;
  const hcpVals   = hcpPoints.map((h) => h.value);
  const minHcp    = Math.min(...hcpVals) - 1;
  const maxHcp    = Math.max(...hcpVals) + 1;
  const hcpRange  = Math.max(maxHcp - minHcp, 1);
  const hcpPts    = hcpVals.map((v, i) => ({ x: toX(i, hcpVals.length), y: toY(v, minHcp, hcpRange) }));

  // ── Y-axis labels ─────────────────────────────────────────────────────
  const yLabels = mode === 'score'
    ? [minScore, Math.round((minScore + maxScore) / 2), maxScore]
    : [minHcp, Math.round((minHcp + maxHcp) / 2), maxHcp];

  const activePoints = mode === 'score' ? scorePts : hcpPts;
  const activePath   = buildSmoothPath(activePoints);
  const areaPath     = activePath + ` L${activePoints[activePoints.length - 1].x.toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)} L${PAD_L.toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)} Z`;

  const selPoint = selected !== null ? activePoints[selected] : null;
  const selRound = selected !== null ? data.rounds[selected] : null;
  const selHcp   = selected !== null && mode === 'handicap' ? hcpPoints[selected] : null;

  return (
    <View style={{ backgroundColor: c.bgCard, borderRadius: 20, overflow: 'hidden' }}>
      {/* Header + mode toggle */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
        <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 13 }}>
          {mode === 'score' ? 'Score-Verlauf' : 'Handicap-Verlauf'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['score', 'handicap'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => { setMode(m); setSelected(null); }}
              style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
                backgroundColor: mode === m ? '#FF653520' : c.bgElevated,
                borderWidth: 1,
                borderColor: mode === m ? '#FF653540' : c.bgBorder,
              }}
            >
              <Text style={{ color: mode === m ? '#FF6535' : c.inkMuted, fontSize: 10, fontWeight: '700' }}>
                {m === 'score' ? 'Score' : 'HCP'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tooltip */}
      {selPoint && selRound && (
        <View style={{ marginHorizontal: 16, marginBottom: 6, padding: 8, borderRadius: 10, backgroundColor: c.bgElevated, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: c.inkSecondary, fontSize: 11, flex: 1 }} numberOfLines={1}>
            {selRound.courseName || new Date(selRound.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
          </Text>
          {mode === 'score' ? (
            <Text style={{ color: dotColor(selRound.scoreToPar), fontWeight: '900', fontSize: 13 }}>
              {selRound.scoreToPar === 0 ? 'EVEN' : selRound.scoreToPar > 0 ? `+${selRound.scoreToPar}` : String(selRound.scoreToPar)}
            </Text>
          ) : (
            <Text style={{ color: '#FF6535', fontWeight: '900', fontSize: 13 }}>
              HCP {selHcp?.value.toFixed(1)}
            </Text>
          )}
        </View>
      )}

      {/* SVG chart */}
      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor="#FF6535" stopOpacity="0.18" />
            <Stop offset="1"   stopColor="#FF6535" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Y-axis grid lines + labels */}
        {yLabels.map((v, i) => {
          const y = mode === 'score'
            ? toY(v, minScore, scoreRange)
            : toY(v, minHcp, hcpRange);
          const label = mode === 'score'
            ? (v === 0 ? 'E' : v > 0 ? `+${v}` : String(v))
            : String(v);
          return (
            <View key={i}>
              <Line x1={PAD_L} y1={y} x2={PAD_L + PLOT_W} y2={y} stroke={c.bgBorder} strokeWidth={1} strokeDasharray="3,4" />
              <SvgText x={PAD_L - 4} y={y + 4} fontSize={9} fill={c.inkMuted} textAnchor="end">{label}</SvgText>
            </View>
          );
        })}

        {/* Par line (score mode) */}
        {mode === 'score' && (
          <Line x1={PAD_L} y1={parY} x2={PAD_L + PLOT_W} y2={parY} stroke="#6ee7b740" strokeWidth={1.5} />
        )}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#area)" />

        {/* Main line */}
        <Path d={activePath} stroke="#FF6535" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Moving average (score mode only) */}
        {mode === 'score' && avgLine.length > 1 && (
          <Path
            d={buildSmoothPath(avgPts)}
            stroke="#FF653560"
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="4,3"
            strokeLinecap="round"
          />
        )}

        {/* Data points + touch targets */}
        {activePoints.map((pt, i) => {
          const score = mode === 'score' ? scores[i] : hcpVals[i];
          const color = mode === 'score' ? dotColor(scores[i]) : '#FF6535';
          return (
            <View key={i}>
              <Circle
                cx={pt.x} cy={pt.y} r={selected === i ? 5 : 3.5}
                fill={selected === i ? color : c.bgCard}
                stroke={color}
                strokeWidth={selected === i ? 0 : 2}
              />
              {/* Invisible touch target */}
              <Rect
                x={pt.x - 14} y={PAD_T} width={28} height={PLOT_H}
                fill="transparent"
                onPress={() => setSelected(selected === i ? null : i)}
              />
            </View>
          );
        })}

        {/* X-axis date labels (first, middle, last) */}
        {[0, Math.floor((activePoints.length - 1) / 2), activePoints.length - 1]
          .filter((v, i, a) => a.indexOf(v) === i && v < data.rounds.length)
          .map((i) => {
            const r = data.rounds[i];
            const label = new Date(r.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
            return (
              <SvgText key={i} x={activePoints[i].x} y={CHART_H - 4} fontSize={8} fill={c.inkMuted} textAnchor="middle">
                {label}
              </SvgText>
            );
          })}
      </Svg>

      {/* Legend */}
      {mode === 'score' && (
        <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: 16, paddingBottom: 12 }}>
          {[
            { color: '#FF6535', label: 'Verlauf', dash: false },
            { color: '#FF653560', label: 'Trend (Ø5)', dash: true },
          ].map((l) => (
            <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 18, height: 2, backgroundColor: l.color, borderStyle: l.dash ? 'dashed' : 'solid' }} />
              <Text style={{ color: c.inkMuted, fontSize: 10 }}>{l.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
