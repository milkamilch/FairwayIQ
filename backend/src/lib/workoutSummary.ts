import { TrainingCategory } from '@prisma/client';

export interface WorkoutSummary {
  highlights: string[];   // Was gut lief (2–3 Punkte)
  focusPoints: string[];  // Worauf du achten solltest (1–2 Punkte)
  nextTip: string;        // Tipp für die nächste Einheit
  mood: 'excellent' | 'good' | 'okay' | 'tough';
}

export interface DrillPerformance {
  drillName: string;
  hits: number;
  attempts: number;
}

interface SessionContext {
  feeling: number;       // 1–5
  difficulty: number;    // 1–5
  focus: TrainingCategory;
  drillCount: number;
  sessionNumber: number; // Wie viele Sessions insgesamt
  prevAvgDifficulty: number | null;
  notes?: string;
  drillResults?: DrillPerformance[];
}

// ── Kategorie-spezifische Inhalte ──────────────────────────────────────
const CATEGORY_HIGHLIGHTS: Record<TrainingCategory, string[]> = {
  PUTTING: [
    'Jede Putt-Einheit verbessert dein Gefühl für die Putterface',
    'Wiederholung auf dem Grün baut unbewusstes Muskelgedächtnis auf',
    'Regelmäßiges Putten ist der schnellste Weg zur Handicap-Verbesserung',
    'Konsistenz im Putting-Rhythmus zahlt sich im Spiel direkt aus',
  ],
  SHORT_GAME: [
    'Das Kurzspiel entscheidet mehr Löcher als jeder andere Schläger',
    'Chip-Präzision kommt ausschließlich durch Wiederholung — du bist auf dem richtigen Weg',
    'Jede Up-&-Down-Chance, die du nutzt, spart einen Schlag',
    'Kurzspiel-Training zeigt die schnellsten Score-Verbesserungen',
  ],
  IRON_PLAY: [
    'Konsistenter Treffpunkt ist die Basis für verlässliche Distanzen',
    'Eisenspiel-Training verbessert direkt deine GIR-Quote',
    'Präzises Eisenspiel öffnet mehr Birdie-Chancen',
    'Divot-Kontrolle und Ball-first-Contact werden mit jeder Einheit besser',
  ],
  DRIVING: [
    'Mehr Fairways treffen beginnt mit dem richtigen Tempo-Training',
    'Ein zuverlässiger Driver nimmt Druck von allen anderen Schlägen',
    'Schlägerkopfgeschwindigkeit ist trainierbar — du investierst richtig',
    'Kontrollierter Drive ins Fairway schlägt weiter immer Rough',
  ],
  COURSE_MANAGEMENT: [
    'Strategisches Denken wird zu einem echten Vorteil gegenüber Mitspielern',
    'Platzmanagement ist mentale Stärke — du entwickelst sie aktiv',
    'Jede Entscheidungsübung schärft deinen Instinkt auf dem Platz',
    'Die besten Golfer spielen smart, nicht hart',
  ],
  MENTAL_GAME: [
    'Mentale Stärke unterscheidet Spieler auf gleichem technischem Niveau',
    'Routine und Visualisierung werden mit jeder Einheit stabiler',
    'Du investierst in etwas, das kaum jemand systematisch trainiert',
    'Druck-Resilienz ist eine Fähigkeit — keine Charaktereigenschaft',
  ],
};

const CATEGORY_FOCUS: Record<TrainingCategory, string[]> = {
  PUTTING: [
    'Achte beim nächsten Putt bewusst auf einen gleichmäßigen Rückschwung',
    'Prüfe ob du den Putter auf der richtigen Bahn durch den Ball führst',
    'Schenke dem Lesevorgang mehr Aufmerksamkeit — Schrägen oft unterschätzt',
    'Rhythmus vor Kraft: lass den Pendel gleichmäßig arbeiten',
  ],
  SHORT_GAME: [
    'Definiere vor jedem Chip immer zuerst die Landezone — nicht die Fahne anvisieren',
    'Commitment ist entscheidend: kein halbherziger Chip',
    'Achte auf ruhige Handgelenke während des gesamten Schwungs',
    'Schlägerwahl bewusst treffen: so wenig Loft wie möglich',
  ],
  IRON_PLAY: [
    'Kontrolliere ob du konsequent Ball-first triffst und dann Divot nimmst',
    'Überprüfe deine Ausrichtung — häufigste Ursache für Fehler nach rechts oder links',
    'Achte auf Gewichtsverlagerung: beim Impact 80% auf dem vorderen Fuß',
    'Halte den Schläger locker — Verkrampfung kostet Konsistenz',
  ],
  DRIVING: [
    'Tempo ist wichtiger als Kraft — langsamer zurück, schneller durch den Ball',
    'Prüfe deine Tee-Höhe: Mitte des Balls sollte auf Höhe der Schlägeroberkante sein',
    'Visualisiere immer zuerst das Ziel-Fairway, bevor du aufstellst',
    'Bei Schwäche nach links: Körperrotation zu früh — Hüfte zu lang offen halten',
  ],
  COURSE_MANAGEMENT: [
    'Frage dich vor jedem Schlag: was ist der smarteste Weg zum Ziel?',
    'Risiko nur wenn der potenzielle Gewinn klar größer ist als der Verlust',
    'Definiere vor jedem Loch einen konkreten Plan — kein Improvisieren',
    'Bogey akzeptieren ist oft schlauer als Doppel-Bogey riskieren',
  ],
  MENTAL_GAME: [
    'Beobachte deinen inneren Dialog — ersetze "nicht" durch positives Bild',
    'Nutze nach schlechten Schlägen konsequent deine Reset-Routine',
    'Fokus auf Prozess: Was war dein Ziel? Hast du es ausgeführt?',
    'Vertrauen ist eine Entscheidung — treffe sie vor jedem Schlag bewusst',
  ],
};

const CATEGORY_TIPS: Record<TrainingCategory, string[]> = {
  PUTTING: [
    'Probiere beim nächsten Mal den Uhr-Drill: 8 Putts aus 1m um das Loch',
    'Übe das nächste Mal mit geschlossenen Augen um dein Distanzgefühl zu schärfen',
    'Lege beim nächsten Mal zwei Tees als Tor und trainiere deine Putterbahn',
    'Messe beim nächsten Mal deine 3-Putt-Quote — das zeigt deinen wahren Fortschritt',
  ],
  SHORT_GAME: [
    'Übe beim nächsten Mal von 5 verschiedenen Lagen — Vielfalt macht dich flexibler',
    'Versuche beim nächsten Mal den Bump-and-Run mit einem 7er Eisen statt Wedge',
    'Arbeite beim nächsten Mal gezielt an Bunkerchips — oft der größte Score-Killer',
    'Zähle beim nächsten Mal deine Up-&-Down-Quote — Ziel: 50%',
  ],
  IRON_PLAY: [
    'Mache beim nächsten Mal den Halbschwung-Drill für mehr Konsistenz',
    'Übe beim nächsten Mal deine Wedge-Distanzen systematisch: 50%, 75%, 100%',
    'Arbeite beim nächsten Mal an einem Schusstyp: Draw oder Fade gezielt üben',
    'Notiere beim nächsten Mal deinen Divot — zeigt dir, wo dein Low-Point ist',
  ],
  DRIVING: [
    'Teste beim nächsten Mal verschiedene Tee-Höhen und beobachte den Flug',
    'Übe beim nächsten Mal den 3-1-Tempo-Drill: langsam zurück, schnell durch',
    'Schlage beim nächsten Mal 10 Bälle nur auf ein imaginäres 10m-Fairway',
    'Probiere beim nächsten Mal Choke-Down: 5cm tiefer greifen für mehr Kontrolle',
  ],
  COURSE_MANAGEMENT: [
    'Erstelle beim nächsten Platzbesuch eine eigene Lochkarte mit Distanzen',
    'Spiele beim nächsten Mal 9 Löcher mit dem Ziel nur auf sichere Zonen zu spielen',
    'Schreibe vor der nächsten Runde einen konkreten Plan für 3 schwierige Löcher',
    'Übe beim nächsten Mal deine Pre-Shot-Routine: immer gleich, in 25 Sekunden',
  ],
  MENTAL_GAME: [
    'Bestimme vor der nächsten Runde 3 Cue-Worte und nutze sie konsequent',
    'Spiele beim nächsten Mal 9 Löcher "process only" — ignoriere bewusst den Score',
    'Übe beim nächsten Mal die Atemübung nach jedem schlechten Schlag',
    'Visualisiere beim nächsten Mal jeden Schlag 10 Sekunden vor der Ausführung',
  ],
};

// ── Hauptfunktion ──────────────────────────────────────────────────────
export function generateWorkoutSummary(ctx: SessionContext): WorkoutSummary {
  const { feeling, difficulty, focus, drillCount, sessionNumber, prevAvgDifficulty, drillResults } = ctx;

  // Mood
  const mood: WorkoutSummary['mood'] =
    feeling >= 4 && difficulty <= 3 ? 'excellent' :
    feeling >= 4 || (feeling >= 3 && difficulty <= 3) ? 'good' :
    feeling >= 3 ? 'okay' : 'tough';

  const highlights: string[] = [];
  const focusPoints: string[] = [];

  // ── Drill-Performance auswerten ────────────────────────────────────
  const trackedDrills = (drillResults ?? []).filter((r) => r.attempts > 0);
  const drillRates = trackedDrills.map((r) => ({ ...r, rate: r.hits / r.attempts }));

  let bestDrill: (typeof drillRates)[0] | null = null;
  let worstDrill: (typeof drillRates)[0] | null = null;
  let avgRate: number | null = null;

  if (drillRates.length > 0) {
    bestDrill = drillRates.reduce((a, b) => (a.rate >= b.rate ? a : b));
    worstDrill = drillRates.reduce((a, b) => (a.rate <= b.rate ? a : b));
    avgRate = drillRates.reduce((s, r) => s + r.rate, 0) / drillRates.length;
  }

  // ── Highlights ─────────────────────────────────────────────────────
  // 1. Feeling-basiert
  if (feeling === 5) {
    highlights.push('Du warst heute in einem fantastischen Flow — solche Einheiten prägen das Muskelgedächtnis am stärksten');
  } else if (feeling === 4) {
    highlights.push('Du warst fokussiert und energiegeladen — genau das richtige Mindset für effektives Training');
  } else if (feeling === 3) {
    highlights.push('Auch eine solide Einheit ohne Hochgefühl bringt dich weiter — Konsistenz schlägt Motivation');
  } else {
    highlights.push('Dass du trotz schwierigem Tag durchgezogen hast, zeigt mentale Stärke — das ist echtes Training');
  }

  // 2. Drill-Performance (wenn vorhanden) oder Difficulty-basiert
  if (bestDrill && bestDrill.rate >= 0.7) {
    const pct = Math.round(bestDrill.rate * 100);
    highlights.push(`Beim „${bestDrill.drillName}" hast du ${bestDrill.hits}/${bestDrill.attempts} Treffer erzielt (${pct}%) — starke Leistung!`);
  } else if (avgRate !== null) {
    const pct = Math.round(avgRate * 100);
    const trackedCount = drillRates.length;
    highlights.push(`Durchschnittliche Trefferquote: ${pct}% über ${trackedCount} getrackte${trackedCount === 1 ? '' : 'n'} Übung${trackedCount === 1 ? '' : 'en'}`);
  } else if (difficulty >= 4) {
    highlights.push(`Du hast dich heute wirklich gefordert — anspruchsvolles Training mit ${drillCount} Übungen schafft die größten Fortschritte`);
  } else if (difficulty === 3) {
    highlights.push(`Das Niveau war heute genau im optimalen Bereich — du hast alle ${drillCount} Übungen im idealen Lernfenster absolviert`);
  } else {
    highlights.push(`Du hast die Inhalte heute souverän gemeistert — ${drillCount} Übungen mit voller Kontrolle`);
  }

  // 3. Kategorie-spezifisch + Session-Nummer
  const catHighlights = CATEGORY_HIGHLIGHTS[focus];
  const catIndex = (sessionNumber - 1) % catHighlights.length;
  highlights.push(catHighlights[catIndex]);

  // ── Fokuspunkte ────────────────────────────────────────────────────
  const catFocus = CATEGORY_FOCUS[focus];

  // 1. Drill mit niedrigster Quote hervorheben (wenn vorhanden und unter 50%)
  if (worstDrill && worstDrill.rate < 0.5 && worstDrill.attempts >= 3) {
    const pct = Math.round(worstDrill.rate * 100);
    focusPoints.push(`„${worstDrill.drillName}" lag bei ${worstDrill.hits}/${worstDrill.attempts} Treffern (${pct}%) — beim nächsten Mal gezielt daran ansetzen`);
  } else if (difficulty >= 4) {
    focusPoints.push('Tempo vor Präzision: wenn etwas zu schwer fühlt, gehe kurz einen Schritt zurück und baue Konsistenz auf');
  } else if (difficulty <= 2) {
    focusPoints.push('Die Übungen lagen heute in deiner Komfortzone — beim nächsten Mal gerne mit mehr Fokus auf Präzision oder Druckbedingungen üben');
  }

  // 2. Kategorie-spezifischer Tipp
  const focusIndex = sessionNumber % catFocus.length;
  focusPoints.push(catFocus[focusIndex]);

  // 3. Pattern-Erkennung: Vergleich mit Durchschnitt
  if (prevAvgDifficulty !== null && focusPoints.length < 2) {
    if (difficulty > prevAvgDifficulty + 1) {
      focusPoints.push('Diese Einheit war spürbar anspruchsvoller als dein Durchschnitt — achte auf ausreichende Erholung');
    } else if (difficulty < prevAvgDifficulty - 1) {
      focusPoints.push('Diese Einheit war leichter als gewohnt — beim nächsten Mal wieder etwas anspruchsvoller angehen');
    }
  }

  // Maximal 2 Fokuspunkte
  const finalFocusPoints = focusPoints.slice(0, 2);

  // ── Nächster Tipp ──────────────────────────────────────────────────
  // Wenn eine konkrete Übung schwächelt, direkt darauf hinweisen
  let nextTip: string;
  if (worstDrill && worstDrill.rate < 0.5 && worstDrill.attempts >= 3) {
    nextTip = `Starte die nächste Einheit mit „${worstDrill.drillName}" — wiederholtes Üben der schwächsten Übung bringt den größten Fortschritt`;
  } else {
    const tipPool = CATEGORY_TIPS[focus];
    nextTip = tipPool[sessionNumber % tipPool.length];
  }

  return { highlights, focusPoints: finalFocusPoints, nextTip, mood };
}
