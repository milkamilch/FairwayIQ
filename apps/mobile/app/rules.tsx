import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../src/lib/theme';

// ── Data ─────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Chapter {
  id: string;
  icon: string;
  color: string;
  title: string;
  summary: string;
  content: string[];
  quiz: QuizQuestion[];
}

const CHAPTERS: Chapter[] = [
  {
    id: 'basics',
    icon: 'book-outline',
    color: '#3b82f6',
    title: 'Grundregeln',
    summary: 'Schlag, Ball im Spiel, Aus & verlorener Ball',
    content: [
      'EIN SCHLAG ist jede Schlagbewegung, die den Ball treffen soll. Fehlschläge (Air Shot) zählen als Schlag — auch wenn der Ball nicht getroffen wird.',
      'BALL IM SPIEL: Dein Ball ist im Spiel, sobald du auf dem Abschlag gespielt hast. Er bleibt im Spiel, bis er im Loch ist oder du eine Erleichterung nimmst.',
      'AUS (OB) ist durch weiße Pfähle oder Linien markiert. Ein Ball im Aus kostet 1 Strafschlag und Distanzverlust — du spielst nochmal vom Ort des vorigen Schlags.',
      'VERLORENER BALL: Du hast maximal 3 Minuten Zeit, deinen Ball zu suchen (seit 2019, früher 5 Min). Findest du ihn nicht, gilt er als verloren → 1 Strafschlag + Distanzverlust.',
      'PROVISORISCHER BALL: Glaubst du, dein Ball ist OB oder verloren, darfst du vor Beginn der Suche einen provisorischen Ball spielen. Findest du den Original-Ball, spiel weiter mit ihm. Findest du ihn nicht, ist der provisorische Ball im Spiel (ohne weiteren Strafschlag).',
    ],
    quiz: [
      {
        q: 'Was kostet ein Ball, der Aus (OB) geht?',
        options: ['Kein Strafschlag', '1 Strafschlag + Distanzverlust', '2 Strafschläge', 'Disqualifikation'],
        correct: 1,
        explanation: 'Ball im Aus: 1 Strafschlag mit Distanzverlust. Du spielst erneut vom Ort des vorigen Schlags.',
      },
      {
        q: 'Wie lange darf man seit 2019 nach einem Ball suchen?',
        options: ['1 Minute', '5 Minuten', '3 Minuten', '2 Minuten'],
        correct: 2,
        explanation: 'Seit der Regelrevision 2019 gilt eine Suchzeit von maximal 3 Minuten (vorher waren es 5 Minuten).',
      },
      {
        q: 'Was ist ein "Air Shot" (Fehlschlag)?',
        options: ['Zählt nicht, wenn der Ball nicht bewegt wird', 'Zählt immer als Schlag', 'Kostet 1 Strafschlag', 'Ist in Deutschland verboten'],
        correct: 1,
        explanation: 'Jede Schlagbewegung, die den Ball treffen soll, zählt als Schlag — auch ein kompletter Fehlschlag.',
      },
      {
        q: 'Wann darf man einen provisorischen Ball spielen?',
        options: ['Immer wenn man will', 'Nur im Rough', 'Wenn man glaubt, der Ball ist OB oder verloren', 'Nur auf Par 5'],
        correct: 2,
        explanation: 'Provisorischer Ball: erlaubt wenn OB oder Verlust vermutet wird — muss vor Beginn der Suche gespielt werden.',
      },
      {
        q: 'Ab wann gilt ein Ball als "im Spiel"?',
        options: ['Sobald man den Platz betritt', 'Nach dem ersten Schlag auf dem Abschlag', 'Sobald man den Abschlag verlässt', 'Ab dem ersten Putt'],
        correct: 1,
        explanation: 'Der Ball ist im Spiel sobald der erste Schlag auf dem Abschlag gespielt wurde.',
      },
    ],
  },
  {
    id: 'fairway',
    icon: 'leaf-outline',
    color: '#22c55e',
    title: 'Ball spielen wie er liegt',
    summary: 'Penalty Areas, Hemmstoffe, Unspielbar',
    content: [
      'GRUNDPRINZIP: Spiele den Ball wie er liegt. Verändere weder Ball noch Lage noch Schwungspur — das ist der Kern des Golfsports.',
      'GELBE PENALTY AREA (ehem. Wasserhindernis): Du hast 3 Optionen: Ball spielen wie er liegt (kein Strafschlag), letzten Schlag wiederholen (+1 Strafschlag), oder hinter der Markierungslinie entlang der Loch-Ball-Linie droppen (+1).',
      'ROTE PENALTY AREA: Zusätzlich zu den gelben Optionen darfst du lateral innerhalb von 2 Schlägerlängen der Eintrittsstelle droppen (+1 Strafschlag).',
      'LOSE HEMMSTOFFE (Blätter, Äste, Steine, Zapfen) dürfen überall auf dem Platz entfernt werden — AUSSER in Bunkern und Penalty Areas.',
      'UNSPIELBAR ERKLÄREN: Du kannst deinen Ball jederzeit (außer in Penalty Areas) für unspielbar erklären (+1 Strafschlag). Optionen: Letzten Schlag wiederholen, hinter der Eintrittsstelle mit Flagge im Blick droppen (beliebig weit), oder innerhalb 2 Schlägerlängen lateral droppen.',
    ],
    quiz: [
      {
        q: 'Was kostet es, einen Ball aus einer Penalty Area zu droppen?',
        options: ['Kein Strafschlag', '1 Strafschlag', '2 Strafschläge', '3 Strafschläge'],
        correct: 1,
        explanation: 'Penalty Areas (gelb und rot) kosten 1 Strafschlag für alle Dropp-Optionen (außer Ball spielen wie er liegt).',
      },
      {
        q: 'Was unterscheidet rote von gelben Penalty Areas?',
        options: ['Rote kosten mehr Strafschläge', 'Bei roten darf man lateral innerhalb 2 Schlägerlängen droppen', 'Gelbe haben keine Dropp-Option', 'Kein Unterschied'],
        correct: 1,
        explanation: 'Rote Penalty Areas erlauben zusätzlich das laterale Droppen innerhalb von 2 Schlägerlängen der Eintrittsstelle.',
      },
      {
        q: 'Wo dürfen lose Hemmstoffe (Blätter, Äste) NICHT entfernt werden?',
        options: ['Auf dem Fairway', 'Auf dem Grün', 'In Bunkern und Penalty Areas', 'Im Rough'],
        correct: 2,
        explanation: 'Lose Hemmstoffe dürfen überall entfernt werden, AUSSER in Bunkern und Penalty Areas.',
      },
      {
        q: 'Darf man die Lage des Balls vor dem Schlag verbessern?',
        options: ['Ja, immer', 'Nein, nie (Grundregel)', 'Nur auf dem Fairway', 'Nur im ersten Rough'],
        correct: 1,
        explanation: 'Grundregel: Ball spielen wie er liegt. Die Lage darf nicht verbessert werden.',
      },
      {
        q: 'Wie viele Strafschläge kostet ein für unspielbar erklärter Ball?',
        options: ['0', '1', '2', '3'],
        correct: 1,
        explanation: '1 Strafschlag. Alle Dropp-Optionen beim Unspielbar-Erklären kosten 1 Strafschlag.',
      },
    ],
  },
  {
    id: 'bunker',
    icon: 'hourglass-outline',
    color: '#f59e0b',
    title: 'Bunker-Regeln',
    summary: 'Verbote, Lose Hemmstoffe, Dropp-Optionen',
    content: [
      'VOR DEM SCHLAG verboten: Den Schläger im Bunker auf dem Sand aufsetzen ("Grunden") oder den Sand testen. Kein Übungsswing mit Bodenkontakt.',
      'LOSE HEMMSTOFFE (Blätter, Äste) dürfen im Bunker NICHT entfernt werden. Das ist eine wichtige Ausnahme zur allgemeinen Regel.',
      'ERLAUBT im Bunker: Den Bunker rechen (nach dem Schlag), natürliche Gegenstände die KEINE losen Hemmstoffe sind entfernen, Wasser aus dem Bunker schöpfen.',
      'UNSPIELBAR IM BUNKER (+1 Strafschlag): Ball nochmal von vorherigem Ort spielen, hinter Eintrittsstelle INNERHALB des Bunkers droppen, oder 2 Schlägerlängen lateral INNERHALB des Bunkers. Für 2 Strafschläge darfst du außerhalb des Bunkers hinter der Loch-Ball-Linie droppen.',
      'DROPP-TECHNIK: Ball muss aus Kniehöhe fallen gelassen werden (seit 2019). Er darf nicht gerollt oder platziert werden.',
    ],
    quiz: [
      {
        q: 'Was ist im Bunker vor dem Schlag verboten?',
        options: ['Den Schläger schwingen', 'Den Schläger auf dem Sand aufsetzen (Grunden)', 'Den Ball anschauen', 'Den Rake halten'],
        correct: 1,
        explanation: 'Im Bunker darf der Schläger den Sand vor dem Schlag nicht berühren — kein "Grunden".',
      },
      {
        q: 'Dürfen Blätter im Bunker entfernt werden?',
        options: ['Ja, immer', 'Nein, lose Hemmstoffe bleiben im Bunker', 'Nur vor dem Schlag', 'Nur nach dem Schlag'],
        correct: 1,
        explanation: 'Lose Hemmstoffe (Blätter, Äste) dürfen im Bunker NICHT entfernt werden. Das ist eine spezielle Ausnahme.',
      },
      {
        q: 'Was kostet Droppen außerhalb des Bunkers (Unspielbar-Option)?',
        options: ['1 Strafschlag', '2 Strafschläge', '0 Strafschläge', '3 Strafschläge'],
        correct: 1,
        explanation: 'Außerhalb des Bunkers droppen kostet 2 Strafschläge. Innerhalb des Bunkers nur 1.',
      },
      {
        q: 'Aus welcher Höhe muss der Ball gedroppt werden (seit 2019)?',
        options: ['Schulter', 'Hüfte', 'Knie', '1 Meter'],
        correct: 2,
        explanation: 'Seit 2019 muss aus Kniehöhe gedroppt werden (vorher war es Schulterhöhe).',
      },
      {
        q: 'Was sollte man nach dem Spielen aus dem Bunker tun?',
        options: ['Nichts', 'Den Bunker rechen', 'Dem Greenkeeper melden', 'Sand aus dem Bunker nehmen'],
        correct: 1,
        explanation: 'Den Bunker nach dem Spiel rechen — aus Etikette und oft als lokale Regel vorgeschrieben.',
      },
    ],
  },
  {
    id: 'green',
    icon: 'golf-outline',
    color: '#FF6535',
    title: 'Auf dem Grün',
    summary: 'Flagge, Putt-Reihenfolge, Markierung',
    content: [
      'FLAGGE: Du darfst die Flagge im Loch lassen, während du puttest — auch wenn der Ball dagegen trifft, gibt es keinen Strafschlag (Regel seit 2019). Du kannst sie auch entfernen oder halten lassen.',
      'BALL MARKIEREN: Vor dem Aufheben des Balls auf dem Grün musst du ihn markieren. Münze oder offiziellen Marker direkt hinter dem Ball legen, dann Ball aufheben und reinigen.',
      'SPIELREIHENFOLGE: Wer am weitesten vom Loch entfernt ist, spielt zuerst. Beim "Ready Golf" (empfohlen!) kann die Reihenfolge aufgehoben werden.',
      'ERLAUBT auf dem Grün: Grün ablesen, Spike-Marks, Pitchmarks und Schuhabdrücke auf der Putt-Linie reparieren. Sand und loser Boden darf entfernt werden.',
      'VERBOTEN: Die Putt-Linie vor dem Schlag berühren oder betreten (außer beim Markieren). Den Ball im Loch lassen, wenn er das Grün schädigt.',
    ],
    quiz: [
      {
        q: 'Darf die Flagge beim Putten im Loch bleiben?',
        options: ['Nein, muss immer entfernt werden', 'Ja, seit 2019 ist das erlaubt', 'Nur bei kurzen Putts', 'Nur im Einzel-Wettspiel'],
        correct: 1,
        explanation: 'Seit 2019: Flagge darf beim Putten im Loch bleiben. Trifft der Ball die Flagge, gibt es keinen Strafschlag.',
      },
      {
        q: 'Was musst du tun, bevor du deinen Ball auf dem Grün aufhebst?',
        options: ['Nichts', 'Den Ball markieren', 'Die Gruppe informieren', 'Den Schläger ablegen'],
        correct: 1,
        explanation: 'Pflicht: Ball markieren bevor er aufgehoben wird. Münze oder Marker direkt hinter den Ball legen.',
      },
      {
        q: 'Wer spielt auf dem Grün zuerst?',
        options: ['Der Spieler mit dem niedrigsten Handicap', 'Wer am weitesten vom Loch entfernt ist', 'Wer zuletzt am Abschlag war', 'Der Kapitän'],
        correct: 1,
        explanation: 'Grundregel: Wer am weitesten vom Loch entfernt ist, spielt zuerst.',
      },
      {
        q: 'Was darf seit 2019 auf der Putt-Linie repariert werden?',
        options: ['Nur Pitchmarks', 'Spike-Marks, Pitchmarks und Schuhabdrücke', 'Gar nichts', 'Nur Balleinschläge'],
        correct: 1,
        explanation: 'Seit 2019 dürfen Spike-Marks, Pitchmarks, Schuhabdrücke und andere Schäden auf dem Grün repariert werden.',
      },
      {
        q: 'Was passiert, wenn der gerollte Ball die Flagge trifft?',
        options: ['2 Strafschläge', '1 Strafschlag', 'Kein Strafschlag', 'Der Schlag muss wiederholt werden'],
        correct: 2,
        explanation: 'Seit 2019: Kein Strafschlag wenn der Ball die Flagge trifft. Flagge darf im Loch verbleiben.',
      },
    ],
  },
  {
    id: 'etiquette',
    icon: 'people-outline',
    color: '#8b5cf6',
    title: 'Etikette & Spielfluss',
    summary: 'Ready Golf, Platzpflege, Verhalten',
    content: [
      'SPIELTEMPO: Halte das Tempo der Gruppe vor dir. Als Faustregel gilt: max. 4 Stunden für 18 Löcher. Wenn du im Rückstand bist, hole auf — notfalls durch Ready Golf.',
      'READY GOLF: Spiele, wenn du bereit bist — nicht starr auf die formale Reihenfolge warten. Das beschleunigt das Spiel erheblich und ist im freundschaftlichen Spiel immer empfohlen.',
      'PLATZPFLEGE: Rasennarben (Divots) auf dem Fairway wieder einlegen oder mit Sand füllen. Pitchmarks auf dem Grün reparieren. Bunker nach dem Spiel rechen.',
      'STILLE UND RESPEKT: Nicht sprechen oder sich bewegen, während andere spielen. Niemals in Blickfeld oder Schlaglinie des Spielers stehen. Handy auf Lautlos.',
      'SICHERHEIT: Warte, bis die Gruppe vor dir außer Reichweite ist. Schrei "Fore!" laut, wenn ein Ball in Richtung anderer Spieler fliegt.',
    ],
    quiz: [
      {
        q: 'Was bedeutet "Ready Golf"?',
        options: ['Immer strikt Reihenfolge einhalten', 'Spiele wenn du bereit bist, egal wer "dran" ist', 'Nur für Profis', 'Nur bei Matchplay'],
        correct: 1,
        explanation: 'Ready Golf: Jeder spielt, wenn er bereit ist. Beschleunigt das Spiel enorm und ist empfohlen.',
      },
      {
        q: 'Was soll man mit einem Divot (Rasennarbe) auf dem Fairway machen?',
        options: ['Liegen lassen', 'Wieder einlegen oder mit Sand füllen', 'Dem Greenkeeper melden', 'Wegräumen'],
        correct: 1,
        explanation: 'Divots wieder einlegen oder mit Sand füllen — so kann der Rasen nachwachsen.',
      },
      {
        q: 'Wo sollte man stehen, während ein anderer Spieler schlägt?',
        options: ['Direkt hinter dem Ball', 'Seitlich oder hinter dem Spieler, außerhalb seines Blickfelds', 'Direkt vor dem Spieler', 'Egal'],
        correct: 1,
        explanation: 'Stehe seitlich oder hinter dem Spieler — nie in seinem Blickfeld oder in der Schlaglinie.',
      },
      {
        q: 'Was rufst du, wenn ein Ball in Richtung anderer Spieler fliegt?',
        options: ['Stopp!', 'Ball!', 'Fore!', 'Achtung!'],
        correct: 2,
        explanation: '"Fore!" ist der internationale Warnruf im Golf — so weit und laut wie möglich rufen.',
      },
      {
        q: 'Was ist die Richtzahl für 18 Löcher in akzeptabler Zeit?',
        options: ['6 Stunden', '3 Stunden', '4 Stunden', '2 Stunden'],
        correct: 2,
        explanation: 'Als Richtwert gelten ca. 4 Stunden für 18 Löcher. Schneller ist besser.',
      },
    ],
  },
  {
    id: 'handicap',
    icon: 'trophy-outline',
    color: '#ec4899',
    title: 'Platzreife & Handicap',
    summary: 'Stableford, Vorgabe, Brutto vs. Netto',
    content: [
      'PLATZREIFE (Deutschland): Um auf öffentlichen Plätzen spielen zu dürfen, benötigt man die Platzreife. Sie besteht aus einem Regeltest (Theorie) und einem Praxistest (9 Löcher auf dem Platz, max. 2,5 × Par).',
      'HANDICAP-INDEX: Gibt das Spielpotenzial eines Spielers an. Je niedriger, desto besser. Anfänger starten bei Handicap 54 (maximaler Wert im Welthandicapsystem WHS).',
      'BRUTTO vs. NETTO: Brutto = tatsächliche Schlagzahl. Netto = Brutto minus zugeteilte Vorgabe-Schläge. Im Nettospiel konkurrieren alle auf gleichem Niveau.',
      'STABLEFORD-ZÄHLUNG: Beliebteste Zählweise in Deutschland. Punkte relativ zum Par pro Loch: Eagle = 4 Pkt, Birdie = 3 Pkt, Par = 2 Pkt, Bogey = 1 Pkt, Doppelbogey = 0 Pkt. Mit Vorgabe erhältst du an bestimmten Löchern (per Streichindex) einen Extra-Schlag.',
      'HANDICAP-ANPASSUNG: Nach jeder Runde (in der DGV-App oder beim Club) wird das Handicap angepasst. Spielst du besser als erwartet → Handicap sinkt. Spielst du schlechter → kaum Änderung.',
    ],
    quiz: [
      {
        q: 'Was ist das maximale Handicap im Welthandicapsystem (WHS)?',
        options: ['36', '54', '18', '72'],
        correct: 1,
        explanation: 'Der maximale Handicap-Index im WHS beträgt 54. Anfänger starten meist bei 54.',
      },
      {
        q: 'Wie viele Stableford-Punkte gibt es für ein Birdie?',
        options: ['1 Punkt', '2 Punkte', '3 Punkte', '4 Punkte'],
        correct: 2,
        explanation: 'Stableford: Eagle=4, Birdie=3, Par=2, Bogey=1, Doppelbogey=0. Ziel: möglichst viele Punkte.',
      },
      {
        q: 'Was bedeutet Netto-Score?',
        options: ['Die tatsächliche Schlagzahl', 'Brutto-Score minus Handicap-Vorgabe', 'Score ohne Strafschläge', 'Der beste Score des Tages'],
        correct: 1,
        explanation: 'Netto = Brutto (tatsächliche Schläge) minus die zugeteilten Vorgabe-Schläge (Handicap).',
      },
      {
        q: 'Woraus besteht die Platzreifeprüfung?',
        options: ['Nur Regeltest', 'Nur Praxistest', 'Regeltest und Praxistest auf dem Platz', 'Nur Platzkenntnis'],
        correct: 2,
        explanation: 'Platzreife = Regeltest (Theorie) + Praxistest auf dem Platz (9 Löcher, max. 2,5 × Par).',
      },
      {
        q: 'Was passiert mit dem Handicap, wenn man besser spielt als erwartet?',
        options: ['Bleibt gleich', 'Steigt an', 'Sinkt', 'Wird auf 54 gesetzt'],
        correct: 2,
        explanation: 'Gutes Spiel → Handicap sinkt. Das Handicap soll das tatsächliche Spielniveau widerspiegeln.',
      },
    ],
  },
];

const STORE_KEY = 'rules_progress_v1';

// ── Helpers ───────────────────────────────────────────────────────────────────

function starsForScore(correct: number, total: number) {
  const pct = correct / total;
  if (pct >= 0.8) return 3;
  if (pct >= 0.6) return 2;
  if (pct >= 0.4) return 1;
  return 0;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StarRow({ stars, size = 18 }: { stars: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[0, 1, 2].map((i) => (
        <Ionicons key={i} name={i < stars ? 'star' : 'star-outline'} size={size} color="#f59e0b" />
      ))}
    </View>
  );
}

function ChapterCard({ chapter, stars, onPress }: { chapter: Chapter; stars: number; onPress: () => void }) {
  const c = useTheme();
  const done = stars > 0;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: c.bgCard,
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 10,
      }}
    >
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: chapter.color + '20', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={chapter.icon as any} size={22} color={chapter.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 15 }}>{chapter.title}</Text>
        <Text style={{ color: c.inkMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{chapter.summary}</Text>
        {done && <StarRow stars={stars} size={13} />}
      </View>
      {done
        ? <Ionicons name="checkmark-circle" size={22} color={stars === 3 ? '#22c55e' : '#f59e0b'} />
        : <Ionicons name="chevron-forward" size={16} color={c.inkMuted} />}
    </TouchableOpacity>
  );
}

// ── Quiz modal ────────────────────────────────────────────────────────────────

function QuizModal({ chapter, onClose, onFinish }: {
  chapter: Chapter;
  onClose: () => void;
  onFinish: (correct: number) => void;
}) {
  const c = useTheme();
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState<'question' | 'feedback' | 'done'>('question');

  const q = chapter.quiz[qi];

  const choose = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const ok = idx === q.correct;
    if (ok) setCorrectCount((p) => p + 1);
    setPhase('feedback');
  };

  const next = () => {
    if (qi + 1 < chapter.quiz.length) {
      setQi((p) => p + 1);
      setSelected(null);
      setPhase('question');
    } else {
      setPhase('done');
    }
  };

  const finalCorrect = phase === 'done' ? correctCount : correctCount;
  const stars = starsForScore(finalCorrect, chapter.quiz.length);

  const optionBg = (i: number) => {
    if (selected === null) return c.bgCard;
    if (i === q.correct) return '#22c55e20';
    if (i === selected && selected !== q.correct) return '#ef444420';
    return c.bgCard;
  };

  const optionBorder = (i: number) => {
    if (selected === null) return c.bgBorder;
    if (i === q.correct) return '#22c55e';
    if (i === selected && selected !== q.correct) return '#ef4444';
    return c.bgBorder;
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={c.inkMuted} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 15 }}>{chapter.title}</Text>
            {phase !== 'done' && (
              <Text style={{ color: c.inkMuted, fontSize: 12 }}>Frage {qi + 1} / {chapter.quiz.length}</Text>
            )}
          </View>
          <View style={{ width: 22 }} />
        </View>

        {phase !== 'done' ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            {/* Progress bar */}
            <View style={{ height: 4, backgroundColor: c.bgBorder, borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
              <View style={{ height: 4, width: `${((qi) / chapter.quiz.length) * 100}%` as any, backgroundColor: '#FF6535', borderRadius: 2 }} />
            </View>

            <Text style={{ color: c.inkPrimary, fontSize: 18, fontWeight: '800', lineHeight: 26, marginBottom: 24 }}>
              {q.q}
            </Text>

            <View style={{ gap: 10 }}>
              {q.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => choose(i)}
                  style={{
                    backgroundColor: optionBg(i),
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: optionBorder(i),
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c.bgElevated, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: c.inkMuted, fontWeight: '700', fontSize: 12 }}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={{ flex: 1, color: c.inkPrimary, fontSize: 14, fontWeight: '500' }}>{opt}</Text>
                  {selected !== null && i === q.correct && <Ionicons name="checkmark-circle" size={20} color="#22c55e" />}
                  {selected === i && i !== q.correct && <Ionicons name="close-circle" size={20} color="#ef4444" />}
                </TouchableOpacity>
              ))}
            </View>

            {phase === 'feedback' && (
              <View style={{ marginTop: 20, backgroundColor: selected === q.correct ? '#22c55e15' : '#ef444415', borderRadius: 14, borderWidth: 1, borderColor: selected === q.correct ? '#22c55e40' : '#ef444440', padding: 16 }}>
                <Text style={{ color: selected === q.correct ? '#22c55e' : '#ef4444', fontWeight: '800', fontSize: 13, marginBottom: 4 }}>
                  {selected === q.correct ? 'Richtig!' : 'Falsch'}
                </Text>
                <Text style={{ color: c.inkSecondary, fontSize: 13, lineHeight: 19 }}>{q.explanation}</Text>
              </View>
            )}

            {phase === 'feedback' && (
              <TouchableOpacity
                onPress={next}
                style={{ marginTop: 16, backgroundColor: '#FF6535', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 15 }}>
                  {qi + 1 < chapter.quiz.length ? 'Nächste Frage' : 'Ergebnis anzeigen'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          /* Result screen */
          <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
            <View style={{ marginBottom: 24, alignItems: 'center' }}>
              <StarRow stars={stars} size={40} />
            </View>
            <Text style={{ color: c.inkPrimary, fontSize: 36, fontWeight: '900', marginBottom: 4 }}>
              {finalCorrect}/{chapter.quiz.length}
            </Text>
            <Text style={{ color: c.inkSecondary, fontSize: 16, marginBottom: 8 }}>richtige Antworten</Text>
            <Text style={{ color: c.inkMuted, fontSize: 14, textAlign: 'center', marginBottom: 32 }}>
              {stars === 3 ? 'Ausgezeichnet! Du hast dieses Kapitel gemeistert.' : stars >= 2 ? 'Gut gemacht! Noch ein paar Wiederholungen und du bist perfekt.' : stars >= 1 ? 'Du bist auf dem richtigen Weg — üb das Kapitel nochmal.' : 'Noch etwas zu lernen — lies das Kapitel nochmal durch.'}
            </Text>
            <TouchableOpacity
              onPress={() => { onFinish(finalCorrect); onClose(); }}
              style={{ backgroundColor: '#FF6535', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 40, alignItems: 'center', width: '100%' }}
            >
              <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 16 }}>Fertig</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ── Chapter detail view ───────────────────────────────────────────────────────

function ChapterDetail({ chapter, stars, onBack, onStartQuiz }: {
  chapter: Chapter;
  stars: number;
  onBack: () => void;
  onStartQuiz: () => void;
}) {
  const c = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.bgBorder }}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={c.inkSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.inkPrimary, fontWeight: '800', fontSize: 16 }}>{chapter.title}</Text>
          <Text style={{ color: c.inkMuted, fontSize: 12 }}>{chapter.summary}</Text>
        </View>
        {stars > 0 && <StarRow stars={stars} />}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <View style={{ backgroundColor: chapter.color + '15', borderRadius: 18, borderWidth: 1, borderColor: chapter.color + '30', padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: chapter.color + '25', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={chapter.icon as any} size={20} color={chapter.color} />
          </View>
          <Text style={{ color: chapter.color, fontWeight: '700', fontSize: 13, flex: 1 }}>
            {chapter.quiz.length} Fragen im Quiz
          </Text>
        </View>

        {chapter.content.map((para, i) => {
          const bold = para.match(/^([A-ZÄÖÜ ]+):/);
          const label = bold ? bold[1] : null;
          const rest = label ? para.slice(label.length + 1).trim() : para;
          return (
            <View key={i} style={{ backgroundColor: c.bgCard, borderRadius: 14, padding: 16, marginBottom: 10 }}>
              {label && (
                <Text style={{ color: '#FF6535', fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' }}>{label}</Text>
              )}
              <Text style={{ color: c.inkSecondary, fontSize: 14, lineHeight: 21 }}>{rest}</Text>
            </View>
          );
        })}

        <TouchableOpacity
          onPress={onStartQuiz}
          style={{ backgroundColor: '#FF6535', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 12 }}
        >
          <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 16 }}>
            {stars > 0 ? 'Quiz wiederholen' : 'Quiz starten'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function RulesScreen() {
  const c = useTheme();
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Chapter | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORE_KEY).then((val) => {
      if (val) setProgress(JSON.parse(val));
    });
  }, []);

  const saveProgress = async (chapterId: string, correct: number) => {
    const updated = { ...progress, [chapterId]: correct };
    setProgress(updated);
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(updated));
  };

  const totalStars = CHAPTERS.reduce((sum, ch) => {
    const correct = progress[ch.id] ?? 0;
    return sum + starsForScore(correct, ch.quiz.length);
  }, 0);
  const maxStars = CHAPTERS.length * 3;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgBase }}>
      {selected ? (
        <>
          <ChapterDetail
            chapter={selected}
            stars={starsForScore(progress[selected.id] ?? 0, selected.quiz.length)}
            onBack={() => setSelected(null)}
            onStartQuiz={() => setQuizOpen(true)}
          />
          {quizOpen && (
            <QuizModal
              chapter={selected}
              onClose={() => setQuizOpen(false)}
              onFinish={(correct) => {
                saveProgress(selected.id, correct);
                setQuizOpen(false);
              }}
            />
          )}
        </>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color={c.inkSecondary} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Regelkunde</Text>
                <Text style={{ color: c.inkPrimary, fontSize: 28, fontWeight: '900' }}>Platzreife</Text>
              </View>
            </View>

            {/* Overall progress */}
            <View style={{ backgroundColor: c.bgCard, borderRadius: 18, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ color: c.inkSecondary, fontWeight: '700', fontSize: 14 }}>Gesamtfortschritt</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={14} color="#f59e0b" />
                  <Text style={{ color: '#f59e0b', fontWeight: '800', fontSize: 14 }}>{totalStars}/{maxStars}</Text>
                </View>
              </View>
              <View style={{ height: 6, backgroundColor: c.bgBorder, borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ height: 6, width: `${(totalStars / maxStars) * 100}%` as any, backgroundColor: totalStars === maxStars ? '#22c55e' : '#FF6535', borderRadius: 3 }} />
              </View>
              <Text style={{ color: c.inkMuted, fontSize: 12, marginTop: 8 }}>
                {CHAPTERS.filter((ch) => starsForScore(progress[ch.id] ?? 0, ch.quiz.length) > 0).length}/{CHAPTERS.length} Kapitel begonnen
              </Text>
            </View>
          </View>

          {/* Platzreife info banner */}
          <View style={{ marginHorizontal: 20, marginBottom: 20, backgroundColor: '#FF653510', borderRadius: 16, borderWidth: 1, borderColor: '#FF653530', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Ionicons name="information-circle-outline" size={20} color="#FF6535" style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, color: c.inkSecondary, fontSize: 13, lineHeight: 19 }}>
              Die Platzreifeprüfung besteht aus einem Regeltest und einem Praxistest. Lerne alle 6 Kapitel und bestehe das Quiz mit mindestens 60%.
            </Text>
          </View>

          {/* Chapters */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
            <Text style={{ color: c.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
              Kapitel
            </Text>
            {CHAPTERS.map((ch) => (
              <ChapterCard
                key={ch.id}
                chapter={ch}
                stars={starsForScore(progress[ch.id] ?? 0, ch.quiz.length)}
                onPress={() => setSelected(ch)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
