import { useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { RoundShareCard, ShareTemplate } from './RoundShareCard';
import { useTheme } from '../lib/theme';

// ── Types ──────────────────────────────────────────────────────────────
export interface LiveHoleEntry {
  holeNumber: number;
  par: number;
  strokeIndex: number;
  distanceMeters: number;
  strokes: number;
  putts: number;
  fairwayHit: boolean | null;
  greenInRegulation: boolean;
  penalties: number;
  played: boolean;
}

// ── Table constants ────────────────────────────────────────────────────
const LABEL_W = 62;
const CELL_W  = 38;
const ROW_H   = 38;

// ── Score styling (semantic — stays fixed regardless of theme) ─────────
type ScoreType = 'eagle' | 'birdie' | 'par' | 'bogey' | 'double' | 'triple';

const SCORE_STYLE: Record<ScoreType, { bg: string; border: string; text: string; shape: 'circle' | 'dbl-circle' | 'square' | 'dbl-square' | 'none' }> = {
  eagle:  { bg: '#a855f720', border: '#a855f7', text: '#a855f7', shape: 'dbl-circle' },
  birdie: { bg: '#FF653520', border: '#FF6535', text: '#FF6535', shape: 'circle' },
  par:    { bg: 'transparent', border: 'transparent', text: '#6ee7b7', shape: 'none' },
  bogey:  { bg: '#f59e0b15', border: '#f59e0b', text: '#f59e0b', shape: 'square' },
  double: { bg: '#ef444420', border: '#ef4444', text: '#ef4444', shape: 'dbl-square' },
  triple: { bg: '#ef444430', border: '#ef4444', text: '#ef4444', shape: 'dbl-square' },
};

function getScoreType(strokes: number, par: number): ScoreType {
  const d = strokes - par;
  if (d <= -2) return 'eagle';
  if (d === -1) return 'birdie';
  if (d === 0)  return 'par';
  if (d === 1)  return 'bogey';
  if (d === 2)  return 'double';
  return 'triple';
}

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

function EmptyCell() {
  const c = useTheme();
  return (
    <View style={{ width: CELL_W, height: ROW_H, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: c.bgBorder, fontSize: 13 }}>—</Text>
    </View>
  );
}

function RowDivider() {
  const c = useTheme();
  return <View style={{ height: 1, backgroundColor: c.bgBorder }} />;
}

// ── Nine-hole table section ────────────────────────────────────────────
function NineSection({ holes, label }: { holes: LiveHoleEntry[]; label: string }) {
  const played       = holes.filter((h) => h.played);
  const totalStrokes = played.reduce((s, h) => s + h.strokes, 0);
  const totalPar     = played.reduce((s, h) => s + h.par, 0);
  const totalPutts   = played.reduce((s, h) => s + h.putts, 0);
  const totalGIR     = played.filter((h) => h.greenInRegulation).length;
  const totalFIR     = played.filter((h) => h.fairwayHit === true).length;
  const totalFIRPoss = played.filter((h) => h.fairwayHit !== null).length;
  const diff         = totalStrokes - totalPar;
  const diffColor    = diff < 0 ? '#FF6535' : diff === 0 ? '#6ee7b7' : diff <= 4 ? '#f59e0b' : '#ef4444';
  const hasPlayed    = played.length > 0;

  const rows = [
    { key: 'LOCH',  render: (h: LiveHoleEntry) => <DataCell key={h.holeNumber} value={h.holeNumber} muted />,                                                          total: <TotalCell value={label} bold /> },
    { key: 'PAR',   render: (h: LiveHoleEntry) => <DataCell key={h.holeNumber} value={h.par} muted />,                                                                 total: <TotalCell value={hasPlayed ? totalPar : '—'} /> },
    { key: 'SCORE', render: (h: LiveHoleEntry) => h.played ? <ScoreCell key={h.holeNumber} strokes={h.strokes} par={h.par} /> : <EmptyCell key={h.holeNumber} />,     total: <TotalCell value={hasPlayed ? totalStrokes : '—'} color={hasPlayed ? diffColor : undefined} bold={hasPlayed} /> },
    { key: 'PUTTS', render: (h: LiveHoleEntry) => h.played ? <DataCell key={h.holeNumber} value={h.putts} /> : <EmptyCell key={h.holeNumber} />,                       total: <TotalCell value={hasPlayed ? totalPutts : '—'} /> },
    { key: 'GIR',   render: (h: LiveHoleEntry) => h.played ? <IconCell key={h.holeNumber} value={h.greenInRegulation} /> : <EmptyCell key={h.holeNumber} />,           total: <TotalCell value={hasPlayed ? `${totalGIR}/${played.length}` : '—'} /> },
    { key: 'FIR',   render: (h: LiveHoleEntry) => h.played ? <IconCell key={h.holeNumber} value={h.fairwayHit} /> : <EmptyCell key={h.holeNumber} />,                  total: <TotalCell value={hasPlayed && totalFIRPoss > 0 ? `${totalFIR}/${totalFIRPoss}` : '—'} /> },
  ];

  return (
    <View>
      {rows.map((row, ri) => (
        <View key={row.key}>
          <View style={{ flexDirection: 'row' }}>
            <LabelCell label={row.key} highlight={row.key === 'SCORE'} />
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

// ── Convert live holes to Round-compatible shape ───────────────────────
function toRoundShape(scores: LiveHoleEntry[], courseName: string) {
  return {
    id: 'live',
    userId: '',
    courseId: '',
    courseName,
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    scores: scores.map((h) => ({
      id: String(h.holeNumber),
      roundId: 'live',
      holeNumber: h.holeNumber,
      par: h.par,
      strokes: h.strokes,
      putts: h.putts,
      fairwayHit: h.fairwayHit,
      greenInRegulation: h.greenInRegulation,
      penalties: h.penalties,
    })),
    stats: {
      totalStrokes: scores.reduce((s, h) => s + h.strokes, 0),
      totalPutts: scores.reduce((s, h) => s + h.putts, 0),
      fairwaysHit: scores.filter((h) => h.fairwayHit === true).length,
      fairwaysTotal: scores.filter((h) => h.fairwayHit !== null).length,
      greensInRegulation: scores.filter((h) => h.greenInRegulation).length,
      totalPenalties: scores.reduce((s, h) => s + h.penalties, 0),
      scoreToPar: scores.reduce((s, h) => s + h.strokes - h.par, 0),
      frontNine: scores.filter((h) => h.holeNumber <= 9).reduce((s, h) => s + h.strokes, 0),
      backNine: scores.filter((h) => h.holeNumber >= 10).reduce((s, h) => s + h.strokes, 0),
    },
  } as any;
}

// ── Main modal ─────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  scores: LiveHoleEntry[];
  courseName: string;
  onClose: () => void;
}

const LEGEND = [
  { label: 'Eagle',   color: '#a855f7', shape: 'dbl-circle' as const },
  { label: 'Birdie',  color: '#FF6535', shape: 'circle'     as const },
  { label: 'Par',     color: '#6ee7b7', shape: 'none'       as const },
  { label: 'Bogey',   color: '#f59e0b', shape: 'square'     as const },
  { label: 'Doppel+', color: '#ef4444', shape: 'dbl-square' as const },
];

export function LiveScorecardModal({ visible, scores, courseName, onClose }: Props) {
  const [view, setView] = useState<'scorecard' | 'share'>('scorecard');
  const [template, setTemplate] = useState<ShareTemplate>('dark');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<View>(null);
  const c = useTheme();

  const front9 = scores.filter((h) => h.holeNumber <= 9);
  const back9  = scores.filter((h) => h.holeNumber >= 10);

  const played       = scores.filter((h) => h.played);
  const totalStrokes = played.reduce((s, h) => s + h.strokes, 0);
  const totalPar     = played.reduce((s, h) => s + h.par, 0);
  const totalDiff    = totalStrokes - totalPar;
  const diffColor    = totalDiff < 0 ? '#FF6535' : totalDiff === 0 ? '#6ee7b7' : totalDiff <= 4 ? '#f59e0b' : '#ef4444';
  const diffLabel    = totalDiff === 0 ? 'EVEN' : totalDiff > 0 ? `+${totalDiff}` : String(totalDiff);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.9 });
    if (!result.canceled && result.assets[0]) setBgImage(result.assets[0].uri);
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Runde teilen' });
    } catch {}
    setSharing(false);
  };

  const closeAndReset = () => {
    setView('scorecard');
    setBgImage(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeAndReset}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
          <TouchableOpacity
            onPress={view === 'share' ? () => setView('scorecard') : closeAndReset}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={view === 'share' ? 'arrow-back' : 'close'} size={22} color={c.inkMuted} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: c.inkPrimary, fontWeight: '700', fontSize: 15 }}>
              {view === 'share' ? 'Runde teilen' : 'Scorecard'}
            </Text>
            <Text style={{ color: c.inkMuted, fontSize: 11, marginTop: 1 }} numberOfLines={1}>{courseName}</Text>
          </View>

          {view === 'scorecard' ? (
            <TouchableOpacity
              onPress={() => setView('share')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.neonGreen12, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="share-outline" size={17} color="#FF6535" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 34 }} />
          )}
        </View>

        {/* ── Scorecard view ── */}
        {view === 'scorecard' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Score summary strip */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
              <View>
                <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>GESAMT</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                  <Text style={{ color: diffColor, fontWeight: '900', fontSize: 40, lineHeight: 44 }}>{totalStrokes}</Text>
                  <Text style={{ color: diffColor, fontWeight: '700', fontSize: 18 }}>{diffLabel}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                {[
                  { label: 'PUTTS', value: played.length > 0 ? played.reduce((s, h) => s + h.putts, 0) : '—' },
                  { label: 'GIR',   value: played.length > 0 ? `${played.filter((h) => h.greenInRegulation).length}/${played.length}` : '—' },
                ].map((s) => (
                  <View key={s.label} style={{ alignItems: 'center' }}>
                    <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 18 }}>{s.value}</Text>
                    <Text style={{ color: c.inkMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Table */}
            <View style={{ marginHorizontal: 12, backgroundColor: c.bgSurface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.bgBorder }}>
              {/* Column header */}
              <View style={{ backgroundColor: c.bgCard, flexDirection: 'row', paddingLeft: LABEL_W }}>
                {scores.map((h) => (
                  <View key={h.holeNumber} style={{ width: CELL_W, alignItems: 'center', paddingVertical: 6 }}>
                    <Text style={{ color: c.inkMuted, fontSize: 9, fontWeight: '700' }}>{h.holeNumber}</Text>
                  </View>
                ))}
                <View style={{ width: CELL_W + 6, backgroundColor: c.bgCard }} />
              </View>
              <RowDivider />

              {front9.length > 0 && (
                <>
                  <NineSection holes={front9} label="OUT" />
                  <RowDivider />
                </>
              )}

              {back9.length > 0 && (
                <>
                  <View style={{ height: 6, backgroundColor: c.bgBase }} />
                  <NineSection holes={back9} label="IN" />
                  <RowDivider />
                </>
              )}

              {front9.length > 0 && back9.length > 0 && (
                <View style={{ flexDirection: 'row', backgroundColor: c.bgCard }}>
                  <LabelCell label="TOTAL" highlight />
                  <TotalCell value={totalStrokes} color={diffColor} bold />
                  <TotalCell value={diffLabel} color={diffColor} />
                </View>
              )}
            </View>

            {/* Legend */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 14 }}>
              {LEGEND.map((item) => (
                <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  {item.shape === 'none'
                    ? <Text style={{ color: item.color, fontSize: 13, fontWeight: '800', width: 10, textAlign: 'center' }}>·</Text>
                    : <View style={{ width: 10, height: 10, borderRadius: item.shape.includes('circle') ? 5 : 0, backgroundColor: item.color + '30', borderWidth: 1.5, borderColor: item.color }} />
                  }
                  <Text style={{ color: c.inkSecondary, fontSize: 11 }}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        )}

        {/* ── Share view ── */}
        {view === 'share' && (
          <>
            {/* Template switcher */}
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 16 }}>
              {([
                { key: 'dark',    icon: 'moon-outline',  label: 'Dark' },
                { key: 'photo',   icon: 'image-outline', label: 'Foto' },
                { key: 'minimal', icon: 'sunny-outline', label: 'Minimal' },
              ] as { key: ShareTemplate; icon: any; label: string }[]).map((tpl) => (
                <TouchableOpacity
                  key={tpl.key}
                  onPress={() => setTemplate(tpl.key)}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: template === tpl.key ? '#FF6535' : c.bgBorder,
                    backgroundColor: template === tpl.key ? c.neonGreen12 : c.bgCard,
                  }}
                >
                  <Ionicons name={tpl.icon} size={14} color={template === tpl.key ? '#FF6535' : c.inkMuted} />
                  <Text style={{ color: template === tpl.key ? '#FF6535' : c.inkMuted, fontWeight: '700', fontSize: 12 }}>
                    {tpl.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Photo picker */}
            {template === 'photo' && (
              <TouchableOpacity
                onPress={pickImage}
                style={{
                  marginHorizontal: 20,
                  marginTop: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: c.bgCard,
                  borderWidth: 1,
                  borderColor: bgImage ? '#FF653540' : c.bgBorder,
                  borderStyle: 'dashed',
                }}
              >
                <Ionicons name={bgImage ? 'checkmark-circle-outline' : 'add-circle-outline'} size={18} color={bgImage ? '#FF6535' : c.inkMuted} />
                <Text style={{ color: bgImage ? '#FF6535' : c.inkMuted, fontSize: 13, fontWeight: '600' }}>
                  {bgImage ? 'Foto ändern' : 'Hintergrundfoto wählen'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Card preview */}
            <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              <RoundShareCard
                ref={cardRef}
                round={toRoundShape(played, courseName)}
                template={template}
                backgroundImage={bgImage}
              />
            </ScrollView>

            {/* Share button */}
            <View style={{ padding: 20, paddingBottom: 12 }}>
              <TouchableOpacity
                onPress={handleShare}
                disabled={sharing}
                style={{
                  backgroundColor: sharing ? '#FF653560' : '#FF6535',
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {sharing
                  ? <ActivityIndicator color="#0A0A0A" />
                  : <>
                      <Ionicons name="share-outline" size={18} color="#0A0A0A" />
                      <Text style={{ color: '#0A0A0A', fontWeight: '800', letterSpacing: 0.5 }}>TEILEN</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}
