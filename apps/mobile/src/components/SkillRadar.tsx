import { View, Text } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';

const CATEGORIES = [
  { key: 'putting',        label: 'Putting' },
  { key: 'shortGame',      label: 'Kurzspiel' },
  { key: 'ironPlay',       label: 'Eisen' },
  { key: 'driving',        label: 'Driver' },
  { key: 'courseManagement', label: 'Platz' },
  { key: 'mentalGame',     label: 'Mental' },
] as const;

const N = CATEGORIES.length;
const LEVELS = [20, 40, 60, 80, 100];

function polar(cx: number, cy: number, r: number, angleOffset: number, index: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2 + angleOffset;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

interface Props {
  scores: Record<string, number>;
  size?: number;
  previous?: Record<string, number> | null;
}

export function SkillRadar({ scores, size = 280, previous }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const labelR = size * 0.46;
  const angleOffset = 0;

  // Polygon points for a score set
  const toPoints = (vals: number[]) =>
    vals
      .map((v, i) => {
        const r = (Math.max(0, Math.min(100, v)) / 100) * maxR;
        const p = polar(cx, cy, r, angleOffset, i, N);
        return `${p.x},${p.y}`;
      })
      .join(' ');

  const currentVals = CATEGORIES.map((c) => scores[c.key] ?? 0);
  const prevVals = previous ? CATEGORIES.map((c) => previous[c.key] ?? 0) : null;

  return (
    <View style={{ width: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background grid rings */}
        {LEVELS.map((lvl) => {
          const r = (lvl / 100) * maxR;
          const pts = Array.from({ length: N }, (_, i) => {
            const p = polar(cx, cy, r, angleOffset, i, N);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <Polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="#252535"
              strokeWidth={1}
            />
          );
        })}

        {/* Axis lines */}
        {CATEGORIES.map((_, i) => {
          const outer = polar(cx, cy, maxR, angleOffset, i, N);
          return (
            <Line
              key={i}
              x1={cx} y1={cy}
              x2={outer.x} y2={outer.y}
              stroke="#252535"
              strokeWidth={1}
            />
          );
        })}

        {/* Previous scores (ghost) */}
        {prevVals && (
          <Polygon
            points={toPoints(prevVals)}
            fill="#8888aa18"
            stroke="#8888aa"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        )}

        {/* Current scores */}
        <Polygon
          points={toPoints(currentVals)}
          fill="#00e87a20"
          stroke="#00e87a"
          strokeWidth={2}
        />

        {/* Score dots */}
        {currentVals.map((v, i) => {
          const r = (Math.max(0, Math.min(100, v)) / 100) * maxR;
          const p = polar(cx, cy, r, angleOffset, i, N);
          return (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill="#00e87a" />
          );
        })}

        {/* Labels */}
        {CATEGORIES.map((cat, i) => {
          const p = polar(cx, cy, labelR, angleOffset, i, N);
          const score = Math.round(currentVals[i]);
          // Anchor: left side → start, right side → end, top/bottom → middle
          const angle = (360 * i) / N - 90;
          const anchor = angle > 10 && angle < 170 ? 'start' : angle > 190 && angle < 350 ? 'end' : 'middle';
          return (
            <SvgText
              key={cat.key}
              x={p.x}
              y={p.y}
              textAnchor={anchor}
              alignmentBaseline="middle"
              fontSize={10}
              fill="#8888aa"
              fontWeight="600"
            >
              {cat.label} {score}
            </SvgText>
          );
        })}

        {/* Level labels (20, 40, ...) on top axis */}
        {LEVELS.map((lvl) => {
          const r = (lvl / 100) * maxR;
          const p = polar(cx, cy, r, angleOffset, 0, N);
          return (
            <SvgText
              key={lvl}
              x={p.x + 4}
              y={p.y}
              fontSize={8}
              fill="#44445a"
              alignmentBaseline="middle"
            >
              {lvl}
            </SvgText>
          );
        })}
      </Svg>

      {/* Legend */}
      {previous && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 16, height: 2, backgroundColor: '#00e87a' }} />
            <Text style={{ color: '#8888aa', fontSize: 11 }}>Aktuell</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 16, height: 2, backgroundColor: '#8888aa', borderStyle: 'dashed', borderBottomWidth: 1, borderColor: '#8888aa' }} />
            <Text style={{ color: '#8888aa', fontSize: 11 }}>Vorheriges Assessment</Text>
          </View>
        </View>
      )}
    </View>
  );
}
