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

// ── Types ─────────────────────────────────────────────────────────────────────

interface Player { id: string; name: string; color: string; }
type GameView = 'home' | 'wheel' | 'bingo' | 'closest' | 'survivor' | 'dart' | 'par' | 'longdrive' | 'speed';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORE_CLUBS   = 'games_clubs_v2';
const STORE_TARGETS = 'games_targets_v2';
const STORE_PLAYERS = 'games_players_v1';

const DEFAULT_CLUBS = [
  'Driver', '3 Holz', '5 Holz', '4 Eisen', '5 Eisen',
  '6 Eisen', '7 Eisen', '8 Eisen', '9 Eisen', 'PW', 'SW', 'Putter',
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
const PLAYER_COLORS = [
  '#FF6535', '#3b82f6', '#22c55e', '#a855f7',
  '#f59e0b', '#ec4899', '#14b8a6', '#ef4444',
];

const BINGO_WINS = [
  [0,1,2],[3,4,5],[6,7,8],   // rows
  [0,3,6],[1,4,7],[2,5,8],   // cols
  [0,4,8],[2,4,6],           // diags
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ── SVG Wheel helpers ─────────────────────────────────────────────────────────

function toXY(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function slicePath(cx: number, cy: number, r: number, s: number, e: number) {
  const a = toXY(cx, cy, r, s), b = toXY(cx, cy, r, e);
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${e-s>180?1:0} 1 ${b.x} ${b.y} Z`;
}

// ── Spinning Wheel (target only) ──────────────────────────────────────────────

function SpinWheel({ items, size, spinValue }: { items: string[]; size: number; spinValue: Animated.Value }) {
  const r = size / 2, cx = r, cy = r, n = items.length;
  const rotateDeg = spinValue.interpolate({ inputRange:[0,360], outputRange:['0deg','360deg'], extrapolate:'extend' });
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ zIndex: 10, marginBottom: -8 }}>
        <View style={{ width:0, height:0, borderLeftWidth:8, borderRightWidth:8, borderBottomWidth:16, borderLeftColor:'transparent', borderRightColor:'transparent', borderBottomColor:'#FF6535' }} />
      </View>
      <View style={{ width: size, height: size, borderRadius: size/2, overflow: 'hidden' }}>
        <Animated.View style={{ transform:[{ rotate: rotateDeg }] }}>
          <Svg width={size} height={size}>
            {n === 0 ? <Circle cx={cx} cy={cy} r={r} fill="#2E2E2E" /> :
              items.map((item, i) => {
                const deg = 360/n, mid = (i+0.5)*deg, tp = toXY(cx,cy,r*0.62,mid);
                const lbl = item.length > 8 ? item.slice(0,7)+'…' : item;
                return (
                  <G key={i}>
                    <Path d={slicePath(cx,cy,r,i*deg,(i+1)*deg)} fill={SLICE_COLORS[i%SLICE_COLORS.length]} stroke="#00000015" strokeWidth={0.5} />
                    <SvgText x={tp.x} y={tp.y} fontSize={n>8?7:9} fontWeight="700" fill="#FFFFFF" textAnchor="middle" alignmentBaseline="middle" transform={`rotate(${mid-90},${tp.x},${tp.y})`}>{lbl}</SvgText>
                  </G>
                );
              })}
            <Circle cx={cx} cy={cy} r={r*0.13} fill="#FFFFFF" opacity={0.9} />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

// ── Edit List Modal ───────────────────────────────────────────────────────────

function EditModal({ visible, title, items, onClose, onSave }: { visible: boolean; title: string; items: string[]; onClose: () => void; onSave: (items: string[]) => void }) {
  const c = useTheme();
  const [list, setList] = useState<string[]>([]);
  const [input, setInput] = useState('');
  useEffect(() => { if (visible) { setList([...items]); setInput(''); } }, [visible]);
  const add = () => { const t = input.trim(); if (!t) return; if (list.includes(t)) { Alert.alert('','Bereits vorhanden'); return; } setList(p=>[...p,t]); setInput(''); };
  const remove = (i: number) => { if (list.length<=2){Alert.alert('','Mindestens 2 benötigt');return;} setList(p=>p.filter((_,j)=>j!==i)); };
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex:1, backgroundColor:c.bgBase }}>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:14, borderBottomWidth:1, borderBottomColor:c.bgBorder }}>
          <TouchableOpacity onPress={onClose}><Text style={{ color:c.inkSecondary, fontSize:15 }}>Abbrechen</Text></TouchableOpacity>
          <Text style={{ color:c.inkPrimary, fontWeight:'800', fontSize:16 }}>{title}</Text>
          <TouchableOpacity onPress={()=>{onSave(list);onClose();}}><Text style={{ color:'#FF6535', fontWeight:'800', fontSize:15 }}>Speichern</Text></TouchableOpacity>
        </View>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:20, paddingVertical:14, borderBottomWidth:1, borderBottomColor:c.bgBorder }}>
          <TextInput style={{ flex:1, backgroundColor:c.bgCard, color:c.inkPrimary, borderRadius:12, paddingHorizontal:14, paddingVertical:11, fontSize:15 }} placeholder="Hinzufügen..." placeholderTextColor={c.inkMuted} value={input} onChangeText={setInput} onSubmitEditing={add} returnKeyType="done" />
          <TouchableOpacity onPress={add} style={{ backgroundColor:'#FF6535', borderRadius:12, width:44, height:44, alignItems:'center', justifyContent:'center' }}><Ionicons name="add" size={22} color="#0A0A0A" /></TouchableOpacity>
        </View>
        <FlatList data={list} keyExtractor={(_,i)=>String(i)} renderItem={({item,index})=>(
          <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingVertical:13, borderBottomWidth:1, borderBottomColor:c.bgBorder }}>
            <View style={{ width:10, height:10, borderRadius:5, backgroundColor:SLICE_COLORS[index%SLICE_COLORS.length], marginRight:14 }} />
            <Text style={{ flex:1, color:c.inkPrimary, fontSize:15 }}>{item}</Text>
            <TouchableOpacity onPress={()=>remove(index)} hitSlop={{top:10,bottom:10,left:10,right:10}}><Ionicons name="close-circle" size={20} color="#ef4444" /></TouchableOpacity>
          </View>
        )} />
      </SafeAreaView>
    </Modal>
  );
}

// ── Player Manager ────────────────────────────────────────────────────────────

function PlayerManager({ players, setPlayers }: { players: Player[]; setPlayers: (p: Player[]) => void }) {
  const c = useTheme();
  const [input, setInput] = useState('');
  const add = () => {
    const name = input.trim();
    if (!name) return;
    if (players.find(p=>p.name.toLowerCase()===name.toLowerCase())) return;
    if (players.length >= 8) { Alert.alert('','Maximal 8 Spieler'); return; }
    setPlayers([...players, { id: Date.now().toString(), name, color: PLAYER_COLORS[players.length % PLAYER_COLORS.length] }]);
    setInput('');
  };
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
        Spieler ({players.length})
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {players.map(p => (
          <TouchableOpacity
            key={p.id}
            onPress={() => setPlayers(players.filter(x => x.id !== p.id))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: p.color + '20', borderWidth: 1, borderColor: p.color + '50' }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
            <Text style={{ color: p.color, fontWeight: '700', fontSize: 13 }}>{p.name}</Text>
            <Ionicons name="close" size={12} color={p.color} />
          </TouchableOpacity>
        ))}
        {players.length === 0 && (
          <Text style={{ color: c.inkMuted, fontSize: 13, fontStyle: 'italic' }}>Noch keine Spieler — füge welche hinzu</Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          style={{ flex: 1, backgroundColor: c.bgCard, color: c.inkPrimary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 }}
          placeholder="Name eingeben..."
          placeholderTextColor={c.inkMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={add} style={{ backgroundColor: '#FF6535', borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="person-add-outline" size={18} color="#0A0A0A" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Game: Wheel ───────────────────────────────────────────────────────────────

function WheelGame({ players, clubs, targets, onBack }: { players: Player[]; clubs: string[]; targets: string[]; onBack: () => void }) {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const wheelSize = Math.min(Math.floor((width - 56) * 0.55), 200);
  const spinValue  = useRef(new Animated.Value(0)).current;
  const totalRef   = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [assignments, setAssignments] = useState<{ player: Player; club: string }[] | null>(null);
  const [target, setTarget]     = useState('');
  const resultScale = useRef(new Animated.Value(0)).current;

  const roll = () => {
    if (spinning) return;
    setSpinning(true);
    setAssignments(null);
    resultScale.setValue(0);

    const targetIdx = Math.floor(Math.random() * targets.length);
    const targetItem = targets[targetIdx];
    const sliceDeg = 360 / targets.length;
    const center = (targetIdx + 0.5) * sliceDeg;
    const targetMod = (360 - center % 360 + 360) % 360;
    const currentMod = totalRef.current % 360;
    let delta = (targetMod - currentMod + 360) % 360;
    if (delta < 30) delta += 360;
    const newTotal = totalRef.current + delta + 360 * (Math.floor(Math.random() * 4) + 4);

    Animated.timing(spinValue, { toValue: newTotal, duration: 3200, easing: Easing.out(Easing.bezier(0.15,0.85,0.25,1.0)), useNativeDriver: true }).start(() => {
      totalRef.current = newTotal;
      const shuffled = shuffle(clubs);
      const assigned = players.length > 0
        ? players.map((p, i) => ({ player: p, club: shuffled[i % shuffled.length] }))
        : [{ player: { id:'solo', name:'Du', color:'#FF6535' }, club: pick(clubs) }];
      setTarget(targetItem);
      setAssignments(assigned);
      setSpinning(false);
      Animated.spring(resultScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
        <TouchableOpacity onPress={onBack}><Ionicons name="arrow-back" size={22} color={c.inkSecondary} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 18 }}>Glücksrad</Text>
          <Text style={{ color: c.inkMuted, fontSize: 12 }}>{players.length > 0 ? `${players.length} Spieler` : 'Solo'} · Ziel-Rad</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center', gap: 20 }}>
        <SpinWheel items={targets} size={wheelSize} spinValue={spinValue} />
        <TouchableOpacity onPress={roll} disabled={spinning} style={{ backgroundColor: spinning ? '#FF653560' : '#FF6535', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 48, alignItems: 'center' }}>
          <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 20 }}>{spinning ? 'DREHT...' : 'ROLLEN!'}</Text>
        </TouchableOpacity>

        {assignments && (
          <Animated.View style={{ width: '100%', transform: [{ scale: resultScale }] }}>
            <View style={{ backgroundColor: c.bgCard, borderRadius: 18, overflow: 'hidden' }}>
              <View style={{ height: 4, backgroundColor: '#FF6535' }} />
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Ionicons name="flag-outline" size={16} color="#FF6535" />
                  <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>Gemeinsames Ziel</Text>
                </View>
                <Text style={{ color: c.inkPrimary, fontSize: 22, fontWeight: '900', marginBottom: 16, textAlign: 'center' }}>{target}</Text>
                <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Schläger-Zuteilung</Text>
                {assignments.map(({ player: pl, club }) => (
                  <View key={pl.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: pl.color + '25', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: pl.color, fontWeight: '900', fontSize: 13 }}>{pl.name[0].toUpperCase()}</Text>
                    </View>
                    <Text style={{ flex: 1, color: c.inkPrimary, fontWeight: '700', fontSize: 15 }}>{pl.name}</Text>
                    <View style={{ backgroundColor: pl.color + '15', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 }}>
                      <Text style={{ color: pl.color, fontWeight: '800', fontSize: 14 }}>{club}</Text>
                    </View>
                  </View>
                ))}
                <TouchableOpacity onPress={roll} disabled={spinning} style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="refresh-outline" size={15} color="#FF6535" />
                  <Text style={{ color: '#FF6535', fontWeight: '700', fontSize: 14 }}>Neue Runde</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
        {!assignments && !spinning && (
          <Text style={{ color: c.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            Drücke ROLLEN! — das Rad wählt ein Ziel,{'\n'}jeder Spieler bekommt einen anderen Schläger.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Game: Bingo ───────────────────────────────────────────────────────────────

function BingoGame({ clubs, targets, onBack }: { clubs: string[]; targets: string[]; onBack: () => void }) {
  const c = useTheme();

  const makeGrid = () => {
    const challenges: string[] = [];
    const cl = shuffle(clubs), tg = shuffle(targets);
    for (let i = 0; i < 9; i++) challenges.push(`${cl[i % cl.length]}\n${tg[i % tg.length]}`);
    return shuffle(challenges).map(ch => ({ challenge: ch, marked: false }));
  };

  const [cells, setCells] = useState(makeGrid);
  const [winner, setWinner] = useState(false);

  const toggle = (i: number) => {
    if (winner) return;
    const next = cells.map((c2, j) => j === i ? { ...c2, marked: !c2.marked } : c2);
    setCells(next);
    const won = BINGO_WINS.some(line => line.every(pos => next[pos].marked));
    if (won) setWinner(true);
  };

  const reset = () => { setCells(makeGrid()); setWinner(false); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
        <TouchableOpacity onPress={onBack}><Ionicons name="arrow-back" size={22} color={c.inkSecondary} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 18 }}>Shot Bingo</Text>
          <Text style={{ color: c.inkMuted, fontSize: 12 }}>Tippe eine Zeile, Spalte oder Diagonale ab!</Text>
        </View>
        <TouchableOpacity onPress={reset} style={{ backgroundColor: c.bgCard, borderRadius: 10, padding: 8 }}>
          <Ionicons name="refresh-outline" size={18} color="#FF6535" />
        </TouchableOpacity>
      </View>

      {winner && (
        <View style={{ backgroundColor: '#22c55e15', borderWidth: 1, borderColor: '#22c55e40', margin: 16, borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', gap: 12 }}>
          <Ionicons name="trophy-outline" size={28} color="#22c55e" />
          <View>
            <Text style={{ color: '#22c55e', fontWeight: '900', fontSize: 18 }}>BINGO!</Text>
            <Text style={{ color: c.inkSecondary, fontSize: 13 }}>Alle Felder einer Linie getroffen!</Text>
          </View>
          <TouchableOpacity onPress={reset} style={{ marginLeft: 'auto' as any, backgroundColor: '#22c55e', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Neu</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {cells.map((cell, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => toggle(i)}
              style={{
                width: '31%',
                aspectRatio: 1,
                borderRadius: 14,
                backgroundColor: cell.marked ? '#FF653520' : c.bgCard,
                borderWidth: 2,
                borderColor: cell.marked ? '#FF6535' : c.bgBorder,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
              }}
            >
              {cell.marked && <Ionicons name="checkmark-circle" size={18} color="#FF6535" style={{ position: 'absolute', top: 4, right: 4 }} />}
              <Text style={{ color: cell.marked ? '#FF6535' : c.inkSecondary, fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 14 }}>
                {cell.challenge}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ color: c.inkMuted, fontSize: 12, textAlign: 'center', marginTop: 16 }}>
          Tippe ein Feld wenn du den Schlag getroffen hast.{'\n'}Reihe, Spalte oder Diagonale = BINGO!
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Game: Closest to the Pin ──────────────────────────────────────────────────

function ClosestGame({ players, targets, onBack }: { players: Player[]; targets: string[]; onBack: () => void }) {
  const c = useTheme();
  const effectivePlayers = players.length >= 2 ? players : [
    { id:'p1', name:'Spieler 1', color: PLAYER_COLORS[0] },
    { id:'p2', name:'Spieler 2', color: PLAYER_COLORS[1] },
  ];
  const [scores, setScores] = useState<Record<string, number>>(Object.fromEntries(effectivePlayers.map(p=>[p.id,0])));
  const [round, setRound] = useState(1);
  const [target, setTarget] = useState(() => pick(targets));
  const [roundWinner, setRoundWinner] = useState<string|null>(null);
  const ROUNDS = 5;

  const awardPoint = (playerId: string) => {
    const next = { ...scores, [playerId]: scores[playerId] + 1 };
    setScores(next);
    setRoundWinner(playerId);
  };

  const nextRound = () => {
    setRound(r => r + 1);
    setTarget(pick(targets));
    setRoundWinner(null);
  };

  const totalWinner = round > ROUNDS
    ? effectivePlayers.reduce((a,b) => scores[a.id] >= scores[b.id] ? a : b)
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
        <TouchableOpacity onPress={onBack}><Ionicons name="arrow-back" size={22} color={c.inkSecondary} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 18 }}>Closest to Pin</Text>
          <Text style={{ color: c.inkMuted, fontSize: 12 }}>Runde {Math.min(round, ROUNDS)} / {ROUNDS}</Text>
        </View>
        <TouchableOpacity onPress={() => { setScores(Object.fromEntries(effectivePlayers.map(p=>[p.id,0]))); setRound(1); setTarget(pick(targets)); setRoundWinner(null); }} style={{ backgroundColor: c.bgCard, borderRadius: 10, padding: 8 }}>
          <Ionicons name="refresh-outline" size={18} color="#FF6535" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* Target */}
        <View style={{ backgroundColor: '#FF653515', borderRadius: 16, borderWidth: 1, borderColor: '#FF653530', padding: 16, alignItems: 'center' }}>
          <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Ziel dieser Runde</Text>
          <Text style={{ color: '#FF6535', fontSize: 24, fontWeight: '900' }}>{target}</Text>
        </View>

        {/* Game over */}
        {totalWinner && (
          <View style={{ backgroundColor: '#22c55e15', borderRadius: 16, borderWidth: 1, borderColor: '#22c55e40', padding: 16, alignItems: 'center', gap: 6 }}>
            <Ionicons name="trophy-outline" size={32} color="#22c55e" />
            <Text style={{ color: '#22c55e', fontWeight: '900', fontSize: 20 }}>{totalWinner.name} gewinnt!</Text>
            <Text style={{ color: c.inkMuted, fontSize: 13 }}>{scores[totalWinner.id]} Punkte</Text>
          </View>
        )}

        {/* Round winner prompt */}
        {round <= ROUNDS && !roundWinner && (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
            <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>Wer war am nächsten dran?</Text>
            {effectivePlayers.map(p => (
              <TouchableOpacity key={p.id} onPress={() => awardPoint(p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: p.color+'20', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: p.color, fontWeight: '900', fontSize: 14 }}>{p.name[0]}</Text>
                </View>
                <Text style={{ flex: 1, color: c.inkPrimary, fontWeight: '700', fontSize: 16 }}>{p.name}</Text>
                <Ionicons name="flag-outline" size={20} color={p.color} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {roundWinner && round <= ROUNDS && (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 }}>
            <Ionicons name="star" size={28} color="#f59e0b" />
            <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 18 }}>{effectivePlayers.find(p=>p.id===roundWinner)?.name} punktet!</Text>
            <TouchableOpacity onPress={nextRound} style={{ marginTop: 8, backgroundColor: '#FF6535', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 }}>
              <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 15 }}>{round < ROUNDS ? 'Nächste Runde' : 'Ergebnis'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scoreboard */}
        <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
          <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Punkte</Text>
          {[...effectivePlayers].sort((a,b)=>scores[b.id]-scores[a.id]).map((p,i) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <Text style={{ color: c.inkMuted, fontWeight: '700', fontSize: 13, width: 20 }}>#{i+1}</Text>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.color }} />
              <Text style={{ flex: 1, color: c.inkPrimary, fontWeight: '700', fontSize: 14 }}>{p.name}</Text>
              <Text style={{ color: p.color, fontWeight: '900', fontSize: 18 }}>{scores[p.id]}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Game: Survivor ────────────────────────────────────────────────────────────

function SurvivorGame({ players, clubs, targets, onBack }: { players: Player[]; clubs: string[]; targets: string[]; onBack: () => void }) {
  const c = useTheme();
  const effectivePlayers = players.length >= 2 ? players : [
    { id:'p1', name:'Spieler 1', color: PLAYER_COLORS[0] },
    { id:'p2', name:'Spieler 2', color: PLAYER_COLORS[1] },
    { id:'p3', name:'Spieler 3', color: PLAYER_COLORS[2] },
  ];

  const [alive, setAlive] = useState<Player[]>(effectivePlayers);
  const [eliminated, setEliminated] = useState<Player[]>([]);
  const [challenge, setChallenge] = useState(() => `${pick(clubs)} → ${pick(targets)}`);
  const [hits, setHits] = useState<Record<string, boolean | null>>(Object.fromEntries(effectivePlayers.map(p=>[p.id,null])));
  const [roundDone, setRoundDone] = useState(false);

  const toggle = (id: string) => {
    if (roundDone) return;
    setHits(h => ({ ...h, [id]: h[id] === true ? false : true }));
  };

  const confirmRound = () => {
    const misses = alive.filter(p => hits[p.id] !== true);
    if (misses.length === alive.length) { Alert.alert('','Alle haben getroffen! Nochmal versuchen.'); return; }
    const newAlive = alive.filter(p => hits[p.id] === true);
    const newElim  = misses;
    setEliminated(e => [...e, ...newElim]);
    setAlive(newAlive);
    setRoundDone(true);
  };

  const nextRound = () => {
    const newHits = Object.fromEntries(alive.map(p=>[p.id,null]));
    setHits(newHits);
    setChallenge(`${pick(clubs)} → ${pick(targets)}`);
    setRoundDone(false);
  };

  const reset = () => {
    setAlive(effectivePlayers);
    setEliminated([]);
    setHits(Object.fromEntries(effectivePlayers.map(p=>[p.id,null])));
    setChallenge(`${pick(clubs)} → ${pick(targets)}`);
    setRoundDone(false);
  };

  const winner = alive.length === 1 ? alive[0] : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
        <TouchableOpacity onPress={onBack}><Ionicons name="arrow-back" size={22} color={c.inkSecondary} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 18 }}>Survivor</Text>
          <Text style={{ color: c.inkMuted, fontSize: 12 }}>{alive.length} übrig · Wer trifft, bleibt!</Text>
        </View>
        <TouchableOpacity onPress={reset} style={{ backgroundColor: c.bgCard, borderRadius: 10, padding: 8 }}>
          <Ionicons name="refresh-outline" size={18} color="#FF6535" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* Challenge */}
        <View style={{ backgroundColor: '#FF653515', borderRadius: 16, borderWidth: 1, borderColor: '#FF653530', padding: 16, alignItems: 'center' }}>
          <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Challenge</Text>
          <Text style={{ color: '#FF6535', fontSize: 20, fontWeight: '900', textAlign: 'center' }}>{challenge}</Text>
        </View>

        {/* Winner */}
        {winner && (
          <View style={{ backgroundColor: '#22c55e15', borderRadius: 16, borderWidth: 1, borderColor: '#22c55e40', padding: 20, alignItems: 'center', gap: 8 }}>
            <Ionicons name="trophy-outline" size={40} color="#22c55e" />
            <Text style={{ color: '#22c55e', fontWeight: '900', fontSize: 24 }}>{winner.name}</Text>
            <Text style={{ color: c.inkMuted, fontSize: 14 }}>ist der letzte Überlebende!</Text>
            <TouchableOpacity onPress={reset} style={{ marginTop: 8, backgroundColor: '#22c55e', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Neu starten</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active players */}
        {!winner && (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
            <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Im Spiel</Text>
            {alive.map(p => {
              const h = hits[p.id];
              return (
                <TouchableOpacity key={p.id} onPress={() => toggle(p.id)} disabled={roundDone} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: p.color+'20', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: p.color, fontWeight: '900', fontSize: 14 }}>{p.name[0]}</Text>
                  </View>
                  <Text style={{ flex: 1, color: c.inkPrimary, fontWeight: '700', fontSize: 16 }}>{p.name}</Text>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: h === true ? '#22c55e20' : h === false ? '#ef444420' : c.bgElevated, borderWidth: 1, borderColor: h === true ? '#22c55e' : h === false ? '#ef4444' : c.bgBorder, alignItems: 'center', justifyContent: 'center' }}>
                    {h === true && <Ionicons name="checkmark" size={20} color="#22c55e" />}
                    {h === false && <Ionicons name="close" size={20} color="#ef4444" />}
                    {h === null && <Ionicons name="help-outline" size={16} color={c.inkMuted} />}
                  </View>
                </TouchableOpacity>
              );
            })}
            {!roundDone ? (
              <TouchableOpacity onPress={confirmRound} style={{ marginTop: 14, backgroundColor: '#FF6535', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 16 }}>Runde auswerten</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={nextRound} style={{ marginTop: 14, backgroundColor: '#FF6535', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 16 }}>Nächste Challenge</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Eliminated */}
        {eliminated.length > 0 && (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
            <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Ausgeschieden</Text>
            {eliminated.map(p => (
              <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                <Ionicons name="close-circle" size={18} color="#ef4444" />
                <Text style={{ color: c.inkMuted, fontWeight: '600', fontSize: 14, textDecorationLine: 'line-through' }}>{p.name}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Game: Ziel-Dart ───────────────────────────────────────────────────────────
// Dartboard-style scoring: each player rates their shot 0–3 points per round

const DART_ZONES = [
  { label: 'Bullseye', sub: 'Perfekter Treffer', pts: 3, color: '#22c55e', icon: 'radio-button-on-outline' },
  { label: 'Getroffen', sub: 'Sauber auf dem Ziel', pts: 2, color: '#3b82f6', icon: 'radio-button-off-outline' },
  { label: 'Nah dran', sub: 'Fast dabei', pts: 1, color: '#f59e0b', icon: 'ellipse-outline' },
  { label: 'Daneben', sub: 'Kein Treffer', pts: 0, color: '#ef4444', icon: 'close-circle-outline' },
];

function DartGame({ players, clubs, targets, onBack }: { players: Player[]; clubs: string[]; targets: string[]; onBack: () => void }) {
  const c = useTheme();
  const effectivePlayers = players.length >= 1 ? players : [{ id: 'p1', name: 'Du', color: PLAYER_COLORS[0] }];
  const ROUNDS = 5;

  const [round, setRound]   = useState(1);
  const [pIdx, setPIdx]     = useState(0); // current player index
  const [challenge, setCh]  = useState(() => `${pick(clubs)} → ${pick(targets)}`);
  const [scores, setScores] = useState<Record<string, number>>(Object.fromEntries(effectivePlayers.map(p => [p.id, 0])));
  const [roundScores, setRS] = useState<Record<string, number>>({}); // current round
  const [phase, setPhase]   = useState<'playing' | 'roundEnd' | 'gameEnd'>('playing');

  const currentPlayer = effectivePlayers[pIdx];

  const rate = (pts: number) => {
    const next = { ...roundScores, [currentPlayer.id]: pts };
    setRS(next);
    if (pIdx + 1 < effectivePlayers.length) {
      setPIdx(pIdx + 1);
    } else {
      // All players rated — end of round
      const nextScores = { ...scores };
      Object.entries(next).forEach(([id, p]) => { nextScores[id] = (nextScores[id] ?? 0) + p; });
      setScores(nextScores);
      setPhase(round >= ROUNDS ? 'gameEnd' : 'roundEnd');
    }
  };

  const nextRound = () => {
    setRound(r => r + 1);
    setPIdx(0);
    setRS({});
    setCh(`${pick(clubs)} → ${pick(targets)}`);
    setPhase('playing');
  };

  const reset = () => {
    setRound(1); setPIdx(0); setRS({});
    setCh(`${pick(clubs)} → ${pick(targets)}`);
    setScores(Object.fromEntries(effectivePlayers.map(p => [p.id, 0])));
    setPhase('playing');
  };

  const sorted = [...effectivePlayers].sort((a, b) => scores[b.id] - scores[a.id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
        <TouchableOpacity onPress={onBack}><Ionicons name="arrow-back" size={22} color={c.inkSecondary} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 18 }}>Ziel-Dart</Text>
          <Text style={{ color: c.inkMuted, fontSize: 12 }}>Runde {Math.min(round, ROUNDS)} / {ROUNDS} · {phase === 'playing' ? currentPlayer.name + ' ist dran' : 'Rundenende'}</Text>
        </View>
        <TouchableOpacity onPress={reset} style={{ backgroundColor: c.bgCard, borderRadius: 10, padding: 8 }}><Ionicons name="refresh-outline" size={18} color="#FF6535" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        {/* Challenge */}
        <View style={{ backgroundColor: '#FF653515', borderRadius: 16, borderWidth: 1, borderColor: '#FF653530', padding: 16, alignItems: 'center' }}>
          <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Aufgabe</Text>
          <Text style={{ color: '#FF6535', fontSize: 20, fontWeight: '900', textAlign: 'center' }}>{challenge}</Text>
        </View>

        {phase === 'playing' && (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: currentPlayer.color + '25', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: currentPlayer.color, fontWeight: '900', fontSize: 15 }}>{currentPlayer.name[0]}</Text>
              </View>
              <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 16 }}>{currentPlayer.name} — wie war der Schlag?</Text>
            </View>
            {DART_ZONES.map(z => (
              <TouchableOpacity key={z.pts} onPress={() => rate(z.pts)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
                <Ionicons name={z.icon as any} size={26} color={z.color} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.inkPrimary, fontWeight: '700', fontSize: 15 }}>{z.label}</Text>
                  <Text style={{ color: c.inkMuted, fontSize: 12 }}>{z.sub}</Text>
                </View>
                <View style={{ backgroundColor: z.color + '20', borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: z.color, fontWeight: '900', fontSize: 16 }}>{z.pts}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {(phase === 'roundEnd' || phase === 'gameEnd') && (
          <>
            <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
              <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Diese Runde</Text>
              {effectivePlayers.map(p => (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
                  <Text style={{ flex: 1, color: c.inkPrimary, fontSize: 14 }}>{p.name}</Text>
                  <Text style={{ color: DART_ZONES.find(z => z.pts === roundScores[p.id])?.color ?? c.inkMuted, fontWeight: '800', fontSize: 16 }}>+{roundScores[p.id] ?? 0}</Text>
                </View>
              ))}
            </View>
            {phase === 'gameEnd' ? (
              <View style={{ backgroundColor: '#22c55e15', borderRadius: 16, borderWidth: 1, borderColor: '#22c55e40', padding: 16, alignItems: 'center', gap: 6 }}>
                <Ionicons name="trophy-outline" size={32} color="#22c55e" />
                <Text style={{ color: '#22c55e', fontWeight: '900', fontSize: 20 }}>{sorted[0].name} gewinnt!</Text>
                <Text style={{ color: c.inkMuted, fontSize: 14 }}>{scores[sorted[0].id]} Punkte gesamt</Text>
                <TouchableOpacity onPress={reset} style={{ marginTop: 8, backgroundColor: '#22c55e', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 10 }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Neu</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={nextRound} style={{ backgroundColor: '#FF6535', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 16 }}>Nächste Runde</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Scoreboard */}
        <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
          <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Gesamtpunkte</Text>
          {sorted.map((p, i) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <Text style={{ color: c.inkMuted, fontWeight: '700', fontSize: 13, width: 20 }}>#{i + 1}</Text>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
              <Text style={{ flex: 1, color: c.inkPrimary, fontWeight: '700', fontSize: 14 }}>{p.name}</Text>
              <Text style={{ color: p.color, fontWeight: '900', fontSize: 18 }}>{scores[p.id]}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Game: Par Challenge ───────────────────────────────────────────────────────
// Random target with a "par" (shots expected). Count actual shots → Stableford points.

const PAR_POINTS = [
  { diff: -2, label: 'Eagle', pts: 4, color: '#a855f7' },
  { diff: -1, label: 'Birdie', pts: 3, color: '#FF6535' },
  { diff:  0, label: 'Par',    pts: 2, color: '#22c55e' },
  { diff:  1, label: 'Bogey',  pts: 1, color: '#f59e0b' },
  { diff:  2, label: 'Double', pts: 0, color: '#ef4444' },
];

function ParGame({ players, clubs, targets, onBack }: { players: Player[]; clubs: string[]; targets: string[]; onBack: () => void }) {
  const c = useTheme();
  const effectivePlayers = players.length >= 1 ? players : [{ id: 'p1', name: 'Du', color: PLAYER_COLORS[0] }];
  const ROUNDS = 5;

  const newChallenge = () => ({
    club: pick(clubs),
    target: pick(targets),
    par: Math.floor(Math.random() * 3) + 1, // par 1, 2, or 3
  });

  const [round, setRound]     = useState(1);
  const [pIdx, setPIdx]       = useState(0);
  const [ch, setCh]           = useState(newChallenge);
  const [scores, setScores]   = useState<Record<string, number>>(Object.fromEntries(effectivePlayers.map(p => [p.id, 0])));
  const [phase, setPhase]     = useState<'playing' | 'roundEnd' | 'gameEnd'>('playing');
  const [roundPts, setRoundPts] = useState<Record<string, { shots: number; pts: number }>>({});

  const currentPlayer = effectivePlayers[pIdx];

  const recordShots = (shots: number) => {
    const diff = shots - ch.par;
    const clamped = Math.max(-2, Math.min(2, diff));
    const entry = PAR_POINTS.find(p => p.diff === clamped)!;
    const next = { ...roundPts, [currentPlayer.id]: { shots, pts: entry.pts } };
    setRoundPts(next);
    if (pIdx + 1 < effectivePlayers.length) {
      setPIdx(pIdx + 1);
    } else {
      const nextScores = { ...scores };
      Object.entries(next).forEach(([id, v]) => { nextScores[id] = (nextScores[id] ?? 0) + v.pts; });
      setScores(nextScores);
      setPhase(round >= ROUNDS ? 'gameEnd' : 'roundEnd');
    }
  };

  const nextRound = () => {
    setRound(r => r + 1); setPIdx(0); setRoundPts({}); setCh(newChallenge()); setPhase('playing');
  };

  const reset = () => {
    setRound(1); setPIdx(0); setRoundPts({}); setCh(newChallenge());
    setScores(Object.fromEntries(effectivePlayers.map(p => [p.id, 0]))); setPhase('playing');
  };

  const sorted = [...effectivePlayers].sort((a, b) => scores[b.id] - scores[a.id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
        <TouchableOpacity onPress={onBack}><Ionicons name="arrow-back" size={22} color={c.inkSecondary} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 18 }}>Par Challenge</Text>
          <Text style={{ color: c.inkMuted, fontSize: 12 }}>Runde {Math.min(round, ROUNDS)} / {ROUNDS}{phase === 'playing' ? ` · ${currentPlayer.name}` : ''}</Text>
        </View>
        <TouchableOpacity onPress={reset} style={{ backgroundColor: c.bgCard, borderRadius: 10, padding: 8 }}><Ionicons name="refresh-outline" size={18} color="#FF6535" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        {/* Challenge with par */}
        <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>Aufgabe</Text>
            <View style={{ backgroundColor: '#22c55e20', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ color: '#22c55e', fontWeight: '900', fontSize: 14 }}>PAR {ch.par}</Text>
            </View>
          </View>
          <Text style={{ color: c.inkPrimary, fontSize: 20, fontWeight: '900' }}>{ch.club}</Text>
          <Text style={{ color: c.inkMuted, fontSize: 14, marginTop: 2 }}>Ziel: {ch.target}</Text>
        </View>

        {phase === 'playing' && (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: currentPlayer.color + '25', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: currentPlayer.color, fontWeight: '900', fontSize: 15 }}>{currentPlayer.name[0]}</Text>
              </View>
              <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 15 }}>{currentPlayer.name} — wie viele Schläge?</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[1, 2, 3, 4, 5].map(n => {
                const diff = n - ch.par;
                const entry = PAR_POINTS.find(p => p.diff === Math.max(-2, Math.min(2, diff)));
                return (
                  <TouchableOpacity key={n} onPress={() => recordShots(n)} style={{ flex: 1, minWidth: 54, backgroundColor: c.bgElevated, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: c.bgBorder }}>
                    <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 22 }}>{n}</Text>
                    {entry && <Text style={{ color: entry.color, fontSize: 9, fontWeight: '800' }}>{n <= ch.par + 2 ? entry.label : 'Triple+'}</Text>}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity onPress={() => recordShots(ch.par + 3)} style={{ flex: 1, minWidth: 54, backgroundColor: '#ef444415', borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: '#ef444430' }}>
                <Text style={{ color: '#ef4444', fontWeight: '900', fontSize: 22 }}>6+</Text>
                <Text style={{ color: '#ef4444', fontSize: 9, fontWeight: '800' }}>0 Pkt</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(phase === 'roundEnd' || phase === 'gameEnd') && (
          <>
            <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
              <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Runden-Ergebnis</Text>
              {effectivePlayers.map(p => {
                const rv = roundPts[p.id];
                const label = rv ? PAR_POINTS.find(pp => pp.pts === rv.pts)?.label : '—';
                const color = rv ? PAR_POINTS.find(pp => pp.pts === rv.pts)?.color : c.inkMuted;
                return (
                  <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
                    <Text style={{ flex: 1, color: c.inkPrimary, fontSize: 14 }}>{p.name}</Text>
                    <Text style={{ color: color ?? c.inkMuted, fontSize: 12, fontWeight: '700', marginRight: 6 }}>{rv ? `${rv.shots} Schlag${rv.shots !== 1 ? 'e' : ''} · ${label}` : '—'}</Text>
                    <Text style={{ color: color ?? c.inkMuted, fontWeight: '900', fontSize: 16 }}>+{rv?.pts ?? 0}</Text>
                  </View>
                );
              })}
            </View>
            {phase === 'gameEnd' ? (
              <View style={{ backgroundColor: '#22c55e15', borderRadius: 16, borderWidth: 1, borderColor: '#22c55e40', padding: 16, alignItems: 'center', gap: 6 }}>
                <Ionicons name="trophy-outline" size={32} color="#22c55e" />
                <Text style={{ color: '#22c55e', fontWeight: '900', fontSize: 20 }}>{sorted[0].name} gewinnt!</Text>
                <Text style={{ color: c.inkMuted, fontSize: 14 }}>{scores[sorted[0].id]} Stableford-Punkte</Text>
                <TouchableOpacity onPress={reset} style={{ marginTop: 8, backgroundColor: '#22c55e', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 10 }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Neu</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={nextRound} style={{ backgroundColor: '#FF6535', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 16 }}>Nächste Runde</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
          <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Stableford-Stand</Text>
          {sorted.map((p, i) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <Text style={{ color: c.inkMuted, fontWeight: '700', fontSize: 13, width: 20 }}>#{i + 1}</Text>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
              <Text style={{ flex: 1, color: c.inkPrimary, fontWeight: '700', fontSize: 14 }}>{p.name}</Text>
              <Text style={{ color: p.color, fontWeight: '900', fontSize: 18 }}>{scores[p.id]}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Game: Long Drive ──────────────────────────────────────────────────────────
// Random club, vote who drove furthest each round, 5 rounds

function LongDriveGame({ players, clubs, onBack }: { players: Player[]; clubs: string[]; onBack: () => void }) {
  const c = useTheme();
  const effectivePlayers = players.length >= 2 ? players : [
    { id: 'p1', name: 'Spieler 1', color: PLAYER_COLORS[0] },
    { id: 'p2', name: 'Spieler 2', color: PLAYER_COLORS[1] },
  ];
  const ROUNDS = 5;
  const [round, setRound]   = useState(1);
  const [club, setClub]     = useState(() => pick(clubs));
  const [scores, setScores] = useState<Record<string, number>>(Object.fromEntries(effectivePlayers.map(p => [p.id, 0])));
  const [winner, setWinner] = useState<string | null>(null);
  const [done, setDone]     = useState(false);

  const award = (id: string) => {
    const next = { ...scores, [id]: scores[id] + 1 };
    setScores(next);
    setWinner(id);
  };

  const nextRound = () => {
    if (round >= ROUNDS) { setDone(true); return; }
    setRound(r => r + 1);
    setClub(pick(clubs));
    setWinner(null);
  };

  const reset = () => {
    setRound(1); setClub(pick(clubs)); setWinner(null); setDone(false);
    setScores(Object.fromEntries(effectivePlayers.map(p => [p.id, 0])));
  };

  const sorted = [...effectivePlayers].sort((a, b) => scores[b.id] - scores[a.id]);
  const champion = done ? sorted[0] : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
        <TouchableOpacity onPress={onBack}><Ionicons name="arrow-back" size={22} color={c.inkSecondary} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 18 }}>Long Drive</Text>
          <Text style={{ color: c.inkMuted, fontSize: 12 }}>Runde {Math.min(round, ROUNDS)} / {ROUNDS} · Wer kommt am weitesten?</Text>
        </View>
        <TouchableOpacity onPress={reset} style={{ backgroundColor: c.bgCard, borderRadius: 10, padding: 8 }}><Ionicons name="refresh-outline" size={18} color="#FF6535" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        {/* Club */}
        <View style={{ backgroundColor: '#3b82f615', borderRadius: 16, borderWidth: 1, borderColor: '#3b82f630', padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#3b82f6', fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Schläger</Text>
          <Text style={{ color: c.inkPrimary, fontSize: 26, fontWeight: '900' }}>{club}</Text>
          <Text style={{ color: c.inkMuted, fontSize: 12, marginTop: 4 }}>Alle spielen den gleichen Schläger</Text>
        </View>

        {champion ? (
          <View style={{ backgroundColor: '#22c55e15', borderRadius: 16, borderWidth: 1, borderColor: '#22c55e40', padding: 20, alignItems: 'center', gap: 8 }}>
            <Ionicons name="trophy-outline" size={40} color="#22c55e" />
            <Text style={{ color: '#22c55e', fontWeight: '900', fontSize: 24 }}>{champion.name}</Text>
            <Text style={{ color: c.inkMuted, fontSize: 14 }}>{scores[champion.id]} Runden gewonnen</Text>
            <TouchableOpacity onPress={reset} style={{ marginTop: 8, backgroundColor: '#22c55e', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Neu</Text>
            </TouchableOpacity>
          </View>
        ) : !winner ? (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
            <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>Wer hat am weitesten geschlagen?</Text>
            {effectivePlayers.map(p => (
              <TouchableOpacity key={p.id} onPress={() => award(p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: p.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: p.color, fontWeight: '900', fontSize: 14 }}>{p.name[0]}</Text>
                </View>
                <Text style={{ flex: 1, color: c.inkPrimary, fontWeight: '700', fontSize: 16 }}>{p.name}</Text>
                <Ionicons name="arrow-forward-circle-outline" size={24} color={p.color} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 }}>
            <Ionicons name="rocket-outline" size={32} color="#3b82f6" />
            <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 18 }}>{effectivePlayers.find(p => p.id === winner)?.name} gewinnt die Runde!</Text>
            <TouchableOpacity onPress={nextRound} style={{ marginTop: 8, backgroundColor: '#FF6535', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 }}>
              <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 15 }}>{round < ROUNDS ? 'Nächste Runde' : 'Endergebnis'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
          <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Siege</Text>
          {sorted.map((p, i) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <Text style={{ color: c.inkMuted, fontWeight: '700', fontSize: 13, width: 20 }}>#{i + 1}</Text>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
              <Text style={{ flex: 1, color: c.inkPrimary, fontWeight: '700', fontSize: 14 }}>{p.name}</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {Array.from({ length: scores[p.id] }).map((_, j) => (
                  <Ionicons key={j} name="star" size={14} color="#f59e0b" />
                ))}
                {Array.from({ length: ROUNDS - scores[p.id] }).map((_, j) => (
                  <Ionicons key={`e${j}`} name="star-outline" size={14} color={c.bgBorder} />
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Game: Speed Challenge ─────────────────────────────────────────────────────
// 10 rapid-fire club+target challenges per player, tap Hit or Miss, score = hits

function SpeedGame({ players, clubs, targets, onBack }: { players: Player[]; clubs: string[]; targets: string[]; onBack: () => void }) {
  const c = useTheme();
  const effectivePlayers = players.length >= 1 ? players : [{ id: 'p1', name: 'Du', color: PLAYER_COLORS[0] }];
  const TOTAL = 10;

  const makeChallenge = () => `${pick(clubs)} → ${pick(targets)}`;

  const [pIdx, setPIdx]       = useState(0);
  const [qi, setQi]           = useState(0);
  const [challenge, setCh]    = useState(makeChallenge);
  const [scores, setScores]   = useState<Record<string, number>>(Object.fromEntries(effectivePlayers.map(p => [p.id, 0])));
  const [phase, setPhase]     = useState<'intro' | 'playing' | 'playerDone' | 'gameEnd'>('intro');
  const flashAnim             = useRef(new Animated.Value(1)).current;

  const flash = (color: string) => {
    flashAnim.setValue(0);
    Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const answer = (hit: boolean) => {
    if (hit) {
      flash('#22c55e');
      setScores(s => ({ ...s, [effectivePlayers[pIdx].id]: s[effectivePlayers[pIdx].id] + 1 }));
    } else {
      flash('#ef4444');
    }
    if (qi + 1 >= TOTAL) {
      if (pIdx + 1 < effectivePlayers.length) {
        setPhase('playerDone');
      } else {
        setPhase('gameEnd');
      }
    } else {
      setQi(q => q + 1);
      setCh(makeChallenge());
    }
  };

  const nextPlayer = () => {
    setPIdx(p => p + 1);
    setQi(0);
    setCh(makeChallenge());
    setPhase('intro');
  };

  const reset = () => {
    setPIdx(0); setQi(0); setCh(makeChallenge()); setPhase('intro');
    setScores(Object.fromEntries(effectivePlayers.map(p => [p.id, 0])));
  };

  const currentPlayer = effectivePlayers[pIdx];
  const sorted = [...effectivePlayers].sort((a, b) => scores[b.id] - scores[a.id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
        <TouchableOpacity onPress={onBack}><Ionicons name="arrow-back" size={22} color={c.inkSecondary} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 18 }}>Speed Challenge</Text>
          <Text style={{ color: c.inkMuted, fontSize: 12 }}>
            {phase === 'playing' ? `${currentPlayer.name} · ${qi + 1} / ${TOTAL}` : phase === 'gameEnd' ? 'Spiel beendet' : currentPlayer.name + ' ist dran'}
          </Text>
        </View>
        <TouchableOpacity onPress={reset} style={{ backgroundColor: c.bgCard, borderRadius: 10, padding: 8 }}><Ionicons name="refresh-outline" size={18} color="#FF6535" /></TouchableOpacity>
      </View>

      <View style={{ flex: 1, padding: 20, gap: 16 }}>
        {phase === 'intro' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: currentPlayer.color + '25', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: currentPlayer.color, fontWeight: '900', fontSize: 28 }}>{currentPlayer.name[0]}</Text>
            </View>
            <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 24 }}>{currentPlayer.name}</Text>
            <Text style={{ color: c.inkMuted, fontSize: 14, textAlign: 'center' }}>
              {TOTAL} Challenges nacheinander.{'\n'}Schlag ausführen → Treffer oder Verfehlt tippen.
            </Text>
            <TouchableOpacity onPress={() => setPhase('playing')} style={{ backgroundColor: '#FF6535', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 48 }}>
              <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 18 }}>LOS!</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'playing' && (
          <>
            {/* Progress bar */}
            <View style={{ height: 5, backgroundColor: c.bgBorder, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ height: 5, width: `${(qi / TOTAL) * 100}%` as any, backgroundColor: '#FF6535', borderRadius: 3 }} />
            </View>

            {/* Challenge card */}
            <Animated.View style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 20, padding: 24, alignItems: 'center', justifyContent: 'center', opacity: flashAnim }}>
              <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Challenge {qi + 1}</Text>
              <Text style={{ color: c.inkPrimary, fontSize: 26, fontWeight: '900', textAlign: 'center', lineHeight: 34 }}>{challenge}</Text>
              <Text style={{ color: c.inkMuted, fontSize: 13, marginTop: 12 }}>Führe den Schlag aus, dann tippe:</Text>
            </Animated.View>

            {/* Hit / Miss buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => answer(false)} style={{ flex: 1, backgroundColor: '#ef444415', borderRadius: 18, paddingVertical: 22, alignItems: 'center', borderWidth: 2, borderColor: '#ef444440' }}>
                <Ionicons name="close" size={32} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontWeight: '900', fontSize: 16, marginTop: 4 }}>Verfehlt</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => answer(true)} style={{ flex: 1, backgroundColor: '#22c55e15', borderRadius: 18, paddingVertical: 22, alignItems: 'center', borderWidth: 2, borderColor: '#22c55e40' }}>
                <Ionicons name="checkmark" size={32} color="#22c55e" />
                <Text style={{ color: '#22c55e', fontWeight: '900', fontSize: 16, marginTop: 4 }}>Treffer!</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {phase === 'playerDone' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Text style={{ color: c.inkPrimary, fontWeight: '900', fontSize: 20 }}>{currentPlayer.name} fertig!</Text>
            <Text style={{ color: '#FF6535', fontSize: 40, fontWeight: '900' }}>{scores[currentPlayer.id]} / {TOTAL}</Text>
            <Text style={{ color: c.inkMuted, fontSize: 14 }}>Treffer</Text>
            <TouchableOpacity onPress={nextPlayer} style={{ marginTop: 12, backgroundColor: '#FF6535', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40 }}>
              <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 16 }}>Nächster Spieler</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'gameEnd' && (
          <ScrollView>
            <View style={{ backgroundColor: '#22c55e15', borderRadius: 16, borderWidth: 1, borderColor: '#22c55e40', padding: 20, alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Ionicons name="trophy-outline" size={36} color="#22c55e" />
              <Text style={{ color: '#22c55e', fontWeight: '900', fontSize: 22 }}>{sorted[0].name} gewinnt!</Text>
              <Text style={{ color: c.inkMuted, fontSize: 14 }}>{scores[sorted[0].id]} / {TOTAL} Treffer</Text>
              <TouchableOpacity onPress={reset} style={{ marginTop: 8, backgroundColor: '#22c55e', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 10 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Nochmal</Text>
              </TouchableOpacity>
            </View>
            <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16 }}>
              <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Ergebnis</Text>
              {sorted.map((p, i) => (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
                  <Text style={{ color: c.inkMuted, fontWeight: '700', fontSize: 13, width: 20 }}>#{i + 1}</Text>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
                  <Text style={{ flex: 1, color: c.inkPrimary, fontWeight: '700', fontSize: 14 }}>{p.name}</Text>
                  <Text style={{ color: p.color, fontWeight: '900', fontSize: 16 }}>{scores[p.id]}/{TOTAL}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Home Screen ───────────────────────────────────────────────────────────────

const GAME_CARDS = [
  { id: 'wheel'     as GameView, icon: 'dice-outline',        color: '#FF6535', title: 'Glücksrad',       desc: 'Jeder bekommt einen anderen Schläger, gemeinsames Ziel' },
  { id: 'bingo'     as GameView, icon: 'grid-outline',        color: '#3b82f6', title: 'Shot Bingo',      desc: '3×3 Karte mit Schlag-Challenges, erste Linie gewinnt' },
  { id: 'closest'   as GameView, icon: 'flag-outline',        color: '#22c55e', title: 'Closest to Pin',  desc: '5 Runden, wer kommt dem Ziel am nächsten? Punkte sammeln' },
  { id: 'survivor'  as GameView, icon: 'flame-outline',       color: '#ef4444', title: 'Survivor',        desc: 'Challenge, wer trifft bleibt — wer verfehlt scheidet aus' },
  { id: 'dart'      as GameView, icon: 'radio-button-on-outline', color: '#a855f7', title: 'Ziel-Dart',   desc: 'Schläge bewerten: Bullseye, Treffer, Nah dran, Daneben — Punkte sammeln' },
  { id: 'par'       as GameView, icon: 'golf-outline',        color: '#14b8a6', title: 'Par Challenge',   desc: 'Zufälliges Ziel mit Par — Stableford-Punkte für Schläge bis zum Treffer' },
  { id: 'longdrive' as GameView, icon: 'rocket-outline',      color: '#6366f1', title: 'Long Drive',      desc: 'Zufälliger Schläger, alle schlagen — wer am weitesten kommt gewinnt die Runde' },
  { id: 'speed'     as GameView, icon: 'flash-outline',       color: '#f59e0b', title: 'Speed Challenge', desc: '10 zufällige Aufgaben pro Spieler — schnell ausführen und werten' },
];

export default function GamesScreen() {
  const c = useTheme();
  const [view, setView] = useState<GameView>('home');
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs,   setClubs]   = useState<string[]>(DEFAULT_CLUBS);
  const [targets, setTargets] = useState<string[]>(DEFAULT_TARGETS);
  const [editClubs,   setEditClubs]   = useState(false);
  const [editTargets, setEditTargets] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORE_CLUBS).then(v   => { if (v) setClubs(JSON.parse(v)); });
    SecureStore.getItemAsync(STORE_TARGETS).then(v => { if (v) setTargets(JSON.parse(v)); });
    SecureStore.getItemAsync(STORE_PLAYERS).then(v => { if (v) setPlayers(JSON.parse(v)); });
  }, []);

  const savePlayers = async (p: Player[]) => {
    setPlayers(p);
    await SecureStore.setItemAsync(STORE_PLAYERS, JSON.stringify(p));
  };

  if (view === 'wheel')    return <WheelGame    players={players} clubs={clubs}   targets={targets} onBack={()=>setView('home')} />;
  if (view === 'bingo')    return <BingoGame    clubs={clubs}   targets={targets} onBack={()=>setView('home')} />;
  if (view === 'closest')  return <ClosestGame  players={players} targets={targets} onBack={()=>setView('home')} />;
  if (view === 'survivor') return <SurvivorGame players={players} clubs={clubs} targets={targets} onBack={()=>setView('home')} />;
  if (view === 'dart')      return <DartGame      players={players} clubs={clubs} targets={targets} onBack={()=>setView('home')} />;
  if (view === 'par')       return <ParGame       players={players} clubs={clubs} targets={targets} onBack={()=>setView('home')} />;
  if (view === 'longdrive') return <LongDriveGame players={players} clubs={clubs} onBack={()=>setView('home')} />;
  if (view === 'speed')     return <SpeedGame     players={players} clubs={clubs} targets={targets} onBack={()=>setView('home')} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <View>
            <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>Driving Range</Text>
            <Text style={{ color: c.inkPrimary, fontSize: 30, fontWeight: '900' }}>Spiele</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => setEditClubs(true)} style={{ backgroundColor: c.bgCard, borderRadius: 10, padding: 9 }}>
              <Ionicons name="golf-outline" size={17} color={c.inkSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditTargets(true)} style={{ backgroundColor: c.bgCard, borderRadius: 10, padding: 9 }}>
              <Ionicons name="flag-outline" size={17} color={c.inkSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Players */}
        <PlayerManager players={players} setPlayers={savePlayers} />

        {/* Game cards */}
        <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Spiele wählen</Text>
        <View style={{ gap: 10 }}>
          {GAME_CARDS.map(g => (
            <TouchableOpacity
              key={g.id}
              onPress={() => setView(g.id)}
              style={{ backgroundColor: c.bgCard, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: g.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={g.icon as any} size={24} color={g.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 16 }}>{g.title}</Text>
                <Text style={{ color: c.inkMuted, fontSize: 12, marginTop: 2, lineHeight: 17 }}>{g.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.inkMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* List stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <TouchableOpacity onPress={() => setEditClubs(true)} style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="golf-outline" size={15} color={c.inkMuted} />
            <Text style={{ color: c.inkMuted, fontSize: 12, flex: 1 }}>{clubs.length} Schläger</Text>
            <Ionicons name="pencil-outline" size={13} color="#FF6535" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditTargets(true)} style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="flag-outline" size={15} color={c.inkMuted} />
            <Text style={{ color: c.inkMuted, fontSize: 12, flex: 1 }}>{targets.length} Ziele</Text>
            <Ionicons name="pencil-outline" size={13} color="#FF6535" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EditModal visible={editClubs}   title="Schläger bearbeiten" items={clubs}   onClose={() => setEditClubs(false)}   onSave={async (l) => { setClubs(l);   await SecureStore.setItemAsync(STORE_CLUBS,   JSON.stringify(l)); }} />
      <EditModal visible={editTargets} title="Ziele bearbeiten"    items={targets} onClose={() => setEditTargets(false)} onSave={async (l) => { setTargets(l); await SecureStore.setItemAsync(STORE_TARGETS, JSON.stringify(l)); }} />
    </SafeAreaView>
  );
}
