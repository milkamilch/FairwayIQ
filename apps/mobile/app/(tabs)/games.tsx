import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput, ScrollView,
  Animated, Easing, useWindowDimensions, Alert, FlatList,
} from 'react-native';
import Svg, { Path, Circle, Text as SvgText, G } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../src/lib/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORE_CLUBS   = 'games_clubs_v2';
const STORE_TARGETS = 'games_targets_v2';

const DEFAULT_CLUBS = [
  'Driver', '3 Holz', '5 Holz', '4 Eisen', '6 Eisen',
  '7 Eisen', '8 Eisen', '9 Eisen', 'PW', 'SW', 'Putter',
];
const DEFAULT_TARGETS = [
  'Max. Weite', 'Ziel 50m', 'Ziel 75m', 'Ziel 100m',
  'Ziel 125m', 'Ziel 150m', 'Halbschwung', 'Draw', 'Fade', 'Chip',
];

const SLICE_COLORS = [
  '#FF6535', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#14b8a6', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#ef4444', '#84cc16',
];

// ── SVG helpers ───────────────────────────────────────────────────────────────

function toXY(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180; // -90 → 0° at top
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = toXY(cx, cy, r, startDeg);
  const e = toXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

// ── Spinning Wheel ────────────────────────────────────────────────────────────

function SpinWheel({
  items, size, spinning, spinValue, label,
}: {
  items: string[]; size: number; spinning: boolean;
  spinValue: Animated.Value; label: string;
}) {
  const c = useTheme();
  const r = size / 2;
  const cx = r;
  const cy = r;
  const n = items.length;

  const rotateDeg = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: c.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </Text>

      {/* Pointer triangle */}
      <View style={{ zIndex: 10, marginBottom: -8 }}>
        <View style={{ width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 16, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#FF6535' }} />
      </View>

      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', elevation: 4 }}>
        <Animated.View style={{ transform: [{ rotate: rotateDeg }] }}>
          <Svg width={size} height={size}>
            {n === 0 ? (
              <Circle cx={cx} cy={cy} r={r} fill={c.bgCard} />
            ) : (
              items.map((item, i) => {
                const sliceDeg = 360 / n;
                const startDeg = i * sliceDeg;
                const endDeg   = (i + 1) * sliceDeg;
                const midDeg   = (startDeg + endDeg) / 2;
                const color    = SLICE_COLORS[i % SLICE_COLORS.length];
                const textR    = r * 0.62;
                const textPos  = toXY(cx, cy, textR, midDeg);
                const maxChars = n > 8 ? 6 : 9;
                const label_   = item.length > maxChars ? item.slice(0, maxChars - 1) + '…' : item;
                const fontSize = n > 10 ? 7 : n > 6 ? 8 : 10;
                return (
                  <G key={i}>
                    <Path d={slicePath(cx, cy, r, startDeg, endDeg)} fill={color} stroke="#00000020" strokeWidth={0.5} />
                    <SvgText
                      x={textPos.x}
                      y={textPos.y}
                      fontSize={fontSize}
                      fontWeight="700"
                      fill="#FFFFFF"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      transform={`rotate(${midDeg - 90}, ${textPos.x}, ${textPos.y})`}
                    >
                      {label_}
                    </SvgText>
                  </G>
                );
              })
            )}
            {/* Center cap */}
            <Circle cx={cx} cy={cy} r={r * 0.14} fill="#FFFFFF" opacity={0.9} />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

// ── Edit List Modal ───────────────────────────────────────────────────────────

function EditModal({
  visible, title, items, onClose, onSave,
}: {
  visible: boolean; title: string;
  items: string[]; onClose: () => void;
  onSave: (items: string[]) => void;
}) {
  const c = useTheme();
  const [list, setList] = useState<string[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (visible) { setList([...items]); setInput(''); }
  }, [visible]);

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (list.includes(trimmed)) { Alert.alert('', 'Bereits vorhanden'); return; }
    setList((p) => [...p, trimmed]);
    setInput('');
  };

  const remove = (idx: number) => {
    if (list.length <= 2) { Alert.alert('', 'Mindestens 2 Einträge benötigt'); return; }
    setList((p) => p.filter((_, i) => i !== idx));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: c.inkSecondary, fontSize: 15 }}>Abbrechen</Text>
          </TouchableOpacity>
          <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 16 }}>{title}</Text>
          <TouchableOpacity onPress={() => { onSave(list); onClose(); }}>
            <Text style={{ color: '#FF6535', fontWeight: '800', fontSize: 15 }}>Speichern</Text>
          </TouchableOpacity>
        </View>

        {/* Add item */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
          <TextInput
            style={{ flex: 1, backgroundColor: c.bgCard, color: c.inkPrimary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 }}
            placeholder="Neuen Eintrag hinzufügen..."
            placeholderTextColor={c.inkMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={add}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={add}
            style={{ backgroundColor: '#FF6535', borderRadius: 12, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="add" size={22} color="#0A0A0A" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={list}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item, index }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length], marginRight: 14 }} />
              <Text style={{ flex: 1, color: c.inkPrimary, fontSize: 15 }}>{item}</Text>
              <TouchableOpacity onPress={() => remove(index)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function GamesScreen() {
  const c = useTheme();
  const { width } = useWindowDimensions();

  const [clubs,   setClubs]   = useState<string[]>(DEFAULT_CLUBS);
  const [targets, setTargets] = useState<string[]>(DEFAULT_TARGETS);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ club: string; target: string } | null>(null);
  const [editClubs,   setEditClubs]   = useState(false);
  const [editTargets, setEditTargets] = useState(false);

  const clubSpin   = useRef(new Animated.Value(0)).current;
  const targetSpin = useRef(new Animated.Value(0)).current;
  const clubTotal   = useRef(0);
  const targetTotal = useRef(0);
  const resultScale = useRef(new Animated.Value(0)).current;

  // Wheel size: two wheels side by side with 16px gap and 20px horizontal padding
  const wheelSize = Math.min(Math.floor((width - 40 - 16) / 2), 180);

  // Load saved lists
  useEffect(() => {
    SecureStore.getItemAsync(STORE_CLUBS).then((v) => {
      if (v) setClubs(JSON.parse(v));
    });
    SecureStore.getItemAsync(STORE_TARGETS).then((v) => {
      if (v) setTargets(JSON.parse(v));
    });
  }, []);

  const saveClubs = async (list: string[]) => {
    setClubs(list);
    await SecureStore.setItemAsync(STORE_CLUBS, JSON.stringify(list));
  };

  const saveTargets = async (list: string[]) => {
    setTargets(list);
    await SecureStore.setItemAsync(STORE_TARGETS, JSON.stringify(list));
  };

  const calcTarget = (
    spinVal: Animated.Value, totalRef: React.MutableRefObject<number>,
    n: number, winnerIdx: number,
  ) => {
    const sliceDeg = 360 / n;
    const winnerCenter = (winnerIdx + 0.5) * sliceDeg;
    const targetMod = (360 - winnerCenter % 360 + 360) % 360;
    const currentMod = totalRef.current % 360;
    let delta = (targetMod - currentMod + 360) % 360;
    if (delta < 30) delta += 360;
    const extraSpins = Math.floor(Math.random() * 4) + 4;
    const newTotal = totalRef.current + delta + 360 * extraSpins;
    return { newTotal, anim: Animated.timing(spinVal, {
      toValue: newTotal,
      duration: 3200 + Math.random() * 800,
      easing: Easing.out(Easing.bezier(0.15, 0.85, 0.25, 1.0)),
      useNativeDriver: true,
    }) };
  };

  const spin = () => {
    if (spinning || clubs.length < 2 || targets.length < 2) return;
    setSpinning(true);
    setResult(null);
    resultScale.setValue(0);

    const clubIdx   = Math.floor(Math.random() * clubs.length);
    const targetIdx = Math.floor(Math.random() * targets.length);

    const { newTotal: clubNew,   anim: clubAnim   } = calcTarget(clubSpin,   clubTotal,   clubs.length,   clubIdx);
    const { newTotal: targetNew, anim: targetAnim } = calcTarget(targetSpin, targetTotal, targets.length, targetIdx);

    Animated.parallel([clubAnim, targetAnim]).start(() => {
      clubTotal.current   = clubNew;
      targetTotal.current = targetNew;
      setSpinning(false);
      setResult({ club: clubs[clubIdx], target: targets[targetIdx] });
      Animated.spring(resultScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>Driving Range</Text>
            <Text style={{ color: c.inkPrimary, fontSize: 30, fontWeight: '900' }}>Spiele</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setEditClubs(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.bgCard, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
            >
              <Ionicons name="golf-outline" size={14} color="#FF6535" />
              <Text style={{ color: c.inkSecondary, fontSize: 12, fontWeight: '700' }}>Schläger</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditTargets(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.bgCard, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
            >
              <Ionicons name="flag-outline" size={14} color="#FF6535" />
              <Text style={{ color: c.inkSecondary, fontSize: 12, fontWeight: '700' }}>Ziele</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wheels */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, paddingHorizontal: 20, marginBottom: 28 }}>
          <SpinWheel items={clubs}   size={wheelSize} spinning={spinning} spinValue={clubSpin}   label="Schläger" />
          <SpinWheel items={targets} size={wheelSize} spinning={spinning} spinValue={targetSpin} label="Ziel" />
        </View>

        {/* DREHEN button */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={spin}
            disabled={spinning}
            style={{
              backgroundColor: spinning ? '#FF653560' : '#FF6535',
              borderRadius: 18,
              paddingVertical: 20,
              alignItems: 'center',
              shadowColor: '#FF6535',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: spinning ? 0 : 0.4,
              shadowRadius: 12,
              elevation: spinning ? 0 : 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="dice-outline" size={26} color="#0A0A0A" />
              <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 22, letterSpacing: 1 }}>
                {spinning ? 'DREHT...' : 'DREHEN!'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Result card */}
        {result && (
          <Animated.View style={{ paddingHorizontal: 20, transform: [{ scale: resultScale }] }}>
            <View style={{ backgroundColor: c.bgCard, borderRadius: 20, overflow: 'hidden' }}>
              <View style={{ height: 4, backgroundColor: '#FF6535' }} />
              <View style={{ padding: 20 }}>
                <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14, textAlign: 'center' }}>
                  Deine Aufgabe
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1, backgroundColor: c.bgElevated, borderRadius: 14, padding: 14, alignItems: 'center' }}>
                    <Ionicons name="golf-outline" size={20} color="#FF6535" style={{ marginBottom: 6 }} />
                    <Text style={{ color: c.inkMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Schläger</Text>
                    <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 18, textAlign: 'center' }}>{result.club}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={22} color={c.inkMuted} />
                  <View style={{ flex: 1, backgroundColor: c.bgElevated, borderRadius: 14, padding: 14, alignItems: 'center' }}>
                    <Ionicons name="flag-outline" size={20} color="#3b82f6" style={{ marginBottom: 6 }} />
                    <Text style={{ color: c.inkMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Ziel</Text>
                    <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 18, textAlign: 'center' }}>{result.target}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={spin}
                  disabled={spinning}
                  style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}
                >
                  <Ionicons name="refresh-outline" size={15} color="#FF6535" />
                  <Text style={{ color: '#FF6535', fontWeight: '700', fontSize: 14 }}>Nochmal drehen</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Hint when no result yet */}
        {!result && !spinning && (
          <View style={{ paddingHorizontal: 20, alignItems: 'center', marginTop: 4 }}>
            <Text style={{ color: c.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              Drücke DREHEN! — das Rad wählt zufällig{'\n'}einen Schläger und ein Ziel für euch aus.
            </Text>
          </View>
        )}

        {/* Item count hint */}
        <View style={{ paddingHorizontal: 20, marginTop: 24, flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="golf-outline" size={16} color={c.inkMuted} />
            <Text style={{ color: c.inkMuted, fontSize: 12 }}>{clubs.length} Schläger</Text>
            <TouchableOpacity onPress={() => setEditClubs(true)} style={{ marginLeft: 'auto' as any }}>
              <Ionicons name="pencil-outline" size={14} color="#FF6535" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="flag-outline" size={16} color={c.inkMuted} />
            <Text style={{ color: c.inkMuted, fontSize: 12 }}>{targets.length} Ziele</Text>
            <TouchableOpacity onPress={() => setEditTargets(true)} style={{ marginLeft: 'auto' as any }}>
              <Ionicons name="pencil-outline" size={14} color="#FF6535" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <EditModal
        visible={editClubs}
        title="Schläger bearbeiten"
        items={clubs}
        onClose={() => setEditClubs(false)}
        onSave={saveClubs}
      />
      <EditModal
        visible={editTargets}
        title="Ziele bearbeiten"
        items={targets}
        onClose={() => setEditTargets(false)}
        onSave={saveTargets}
      />
    </SafeAreaView>
  );
}
