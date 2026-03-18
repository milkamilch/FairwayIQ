import { TrainingCategory, TrainingDifficulty } from '@prisma/client';

// ── Assessment Antworten ──────────────────────────────────────────────
export interface AssessmentAnswers {
  // Allgemein
  weeklyHours: number;           // 1 | 2 | 4 | 6 | 8+
  mainGoal: 'handicap' | 'consistency' | 'enjoyment' | 'compete';

  // Putting
  puttsPerRound: number;         // z.B. 32
  shortPuttConfidence: number;   // 1-5 (1=sehr unsicher, 5=sehr sicher)
  puttingMiss: 'distance' | 'line' | 'both' | 'none';

  // Kurzspiel
  upAndDownPercent: number;      // 0-100
  bunkerConfidence: number;      // 1-5
  chippingMiss: 'thin' | 'fat' | 'direction' | 'none';

  // Eisenspiel
  girPercent: number;            // 0-100
  ironConsistency: number;       // 1-5
  ironMiss: 'left' | 'right' | 'short' | 'long' | 'inconsistent';

  // Driver
  firPercent: number;            // 0-100
  driverConfidence: number;      // 1-5
  driverMiss: 'left' | 'right' | 'slice' | 'hook' | 'distance' | 'none';

  // Platzmanagement
  knowsDistances: number;        // 1-5
  playsStrategically: number;    // 1-5

  // Mental
  handlesPressure: number;       // 1-5
  recoversFromBadHoles: number;  // 1-5
}

// ── Kategorie-Scores berechnen (0–100, niedriger = schwächer) ─────────
export interface CategoryScores {
  putting: number;
  shortGame: number;
  ironPlay: number;
  driving: number;
  courseManagement: number;
  mentalGame: number;
}

export function calculateScores(a: AssessmentAnswers): CategoryScores {
  // Putting: Benchmark ~30 Putts/Runde für Handicap-Spieler
  const puttScore =
    Math.min(100, Math.max(0,
      (30 - Math.max(0, a.puttsPerRound - 28)) / 14 * 40 +  // Putts pro Runde (40%)
      (a.shortPuttConfidence / 5) * 35 +                     // Kurze Putts (35%)
      (a.puttingMiss === 'none' ? 25 : a.puttingMiss === 'distance' ? 15 : 5) // Fehlertyp (25%)
    ));

  // Kurzspiel
  const shortGameScore =
    Math.min(100, Math.max(0,
      (a.upAndDownPercent / 50) * 45 +                       // Up&Down Quote (45%)
      (a.bunkerConfidence / 5) * 30 +                        // Bunker (30%)
      (a.chippingMiss === 'none' ? 25 : a.chippingMiss === 'direction' ? 15 : 5) // (25%)
    ));

  // Eisenspiel
  const ironScore =
    Math.min(100, Math.max(0,
      (a.girPercent / 60) * 50 +                             // GIR (50%)
      (a.ironConsistency / 5) * 35 +                         // Konsistenz (35%)
      (a.ironMiss === 'inconsistent' ? 0 : 15)               // Fehlertyp (15%)
    ));

  // Driver
  const drivingScore =
    Math.min(100, Math.max(0,
      (a.firPercent / 65) * 50 +                             // FIR (50%)
      (a.driverConfidence / 5) * 35 +                        // Selbstvertrauen (35%)
      (a.driverMiss === 'none' ? 15 : a.driverMiss === 'distance' ? 10 : 5)
    ));

  // Platzmanagement
  const cmScore =
    Math.min(100, Math.max(0,
      (a.knowsDistances / 5) * 50 +
      (a.playsStrategically / 5) * 50
    ));

  // Mental
  const mentalScore =
    Math.min(100, Math.max(0,
      (a.handlesPressure / 5) * 50 +
      (a.recoversFromBadHoles / 5) * 50
    ));

  return {
    putting: Math.round(puttScore),
    shortGame: Math.round(shortGameScore),
    ironPlay: Math.round(ironScore),
    driving: Math.round(drivingScore),
    courseManagement: Math.round(cmScore),
    mentalGame: Math.round(mentalScore),
  };
}

// ── Drills-Bibliothek pro Kategorie ──────────────────────────────────
const DRILLS: Record<string, { name: string; description: string; duration: number; difficulty: TrainingDifficulty; tips: string[] }[]> = {
  PUTTING: [
    { name: '1-Meter Sicherheitstraining', description: 'Lochen 10 Bälle hintereinander von 1 Meter. Erst wenn alle 10 drin sind, weitermachen. Entwickelt Routine und Selbstvertrauen.', duration: 15, difficulty: 'EASY', tips: ['Augen über dem Ball', 'Gleicher Rhythmus bei jedem Putt', 'Putter-Face checken'] },
    { name: 'Distanz-Putting Gate', description: 'Lege zwei Tees als Tor (Putter-Breite). Putte 10 Bälle von 3, 6, 9 Metern durch das Tor. Trainiert geradlinigen Durchschwung.', duration: 20, difficulty: 'MEDIUM', tips: ['Pendelbewegung aus Schultern', 'Kopf ruhig bis nach dem Kontakt', 'Durch den Ball schwingen'] },
    { name: 'Lag Putting Challenge', description: 'Putte von 10+ Metern mit dem Ziel: Ball stoppt in einem 60cm Kreis ums Loch. Keine Dreiputts mehr.', duration: 20, difficulty: 'MEDIUM', tips: ['Distanz ist wichtiger als Linie', 'Großzügige Rückschwung-Länge', 'Tempo gleichmäßig halten'] },
    { name: 'Runden-Simulation', description: 'Spiele 9 imaginäre Löcher auf dem Putting-Green. Immer 2 Putts Ziel. Führe eine "Runde" mit Ergebnis.', duration: 25, difficulty: 'HARD', tips: ['Pre-Putt Routine einhalten', 'Grün vor jedem Putt lesen', 'Mentale Reset-Routine'] },
    { name: 'Kurze Putts unter Druck', description: 'Stelle 5 Bälle in 1.5m Abstand rund ums Loch. Lochen alle 5 ohne Fehler — sonst von vorne. Trainiert Druckresistenz.', duration: 15, difficulty: 'HARD', tips: ['Routine genauso wie auf dem Platz', 'Atmen vor dem Schlag', 'Auf den Prozess konzentrieren'] },
  ],
  SHORT_GAME: [
    { name: 'Landing Zone Chip', description: 'Markiere einen Landepunkt. Chippe 20 Bälle auf diesen Punkt. Zähle Treffer. Trainiert präzisen Kontaktpunkt.', duration: 20, difficulty: 'EASY', tips: ['Gewicht auf dem linken Bein', 'Hände führen den Schläger', 'Keine Handgelenk-Aktion'] },
    { name: 'Up & Down Parcours', description: 'Spiele 9 verschiedene Lagen rund ums Grün. Immer Chip + Putt. Zähle deine Up&Down-Quote.', duration: 30, difficulty: 'MEDIUM', tips: ['Beste Linie zum Einlochen wählen', 'Chip vor Pitch wenn möglich', 'Landepunkt visualisieren'] },
    { name: 'Bunker Explosions-Drill', description: 'Schreibe ein X in den Sand direkt hinter dem Ball. Schlage das X weg — nicht den Ball. 15 Wiederholungen.', duration: 20, difficulty: 'MEDIUM', tips: ['Offene Schlägerfläche', '2cm hinter dem Ball einsteigen', 'Sand wegschlagen, nicht scoopen'] },
    { name: 'Flop Shot Training', description: 'Übe Flop Shots über ein Hindernis (Tasche, Schirm). Ball soll weich landen und stoppen.', duration: 20, difficulty: 'HARD', tips: ['Sehr offene Schlägerfläche', 'Schnelle Schlägergeschwindigkeit', 'Unter den Ball gleiten'] },
    { name: 'Distance Control Pitching', description: 'Markiere Ziele auf 20, 40, 60, 80 Meter. Schlage je 5 Bälle auf jedes Ziel. Trainiert Distanzgefühl.', duration: 30, difficulty: 'MEDIUM', tips: ['Schläger-Länge = Distanz-Kontrolle', 'Gleicher Rhythmus bei allen', 'Vorderhand führt durch'] },
  ],
  IRON_PLAY: [
    { name: 'Divot-Board Übung', description: 'Lege ein Handtuch hinter den Ball. Schlage ohne das Handtuch zu treffen — trainiert abwärts-Treffer.', duration: 20, difficulty: 'EASY', tips: ['Ball vorne in der Stance', 'Hände vor dem Ball beim Impact', 'Divot nach dem Ball'] },
    { name: 'Gate Drill', description: 'Lege zwei Tees links und rechts des Balls als "Tor". Swing durch das Tor ohne Tees zu berühren. Korrigiert In-to-Out/Out-to-In Fehler.', duration: 25, difficulty: 'MEDIUM', tips: ['Innere Bahn für Draw', 'Äußere Bahn für Fade', 'Bewusstes Pfad-Training'] },
    { name: 'One-Club Challenge', description: 'Spiele 30 Minuten nur mit einem Eisen (7er). Übe verschiedene Schlagarten: hoch, niedrig, fade, draw.', duration: 30, difficulty: 'MEDIUM', tips: ['Ball-Position variieren', 'Hände für Trajektorie nutzen', 'Gleicher Rhythmus immer'] },
    { name: 'Ziel-Session mit Stats', description: 'Schlage 40 Bälle mit 3 verschiedenen Eisen auf definierte Ziele. Tracke: Treffer innerhalb 10m-Kreis.', duration: 35, difficulty: 'MEDIUM', tips: ['Pre-Shot Routine für jeden Schlag', 'Ausrichtung mit Stangen', 'Abweichung notieren'] },
    { name: 'Konsistenz-Block', description: '50 Bälle mit 7er Eisen, Fokus auf identischen Kontakt. Kein Ziel — nur Qualität.', duration: 30, difficulty: 'EASY', tips: ['Gleicher Aufbau immer', 'Tempo nie ändern', 'Ballkontakt > Distanz'] },
  ],
  DRIVING: [
    { name: 'Tee-Höhe Experiment', description: 'Schlage je 10 Bälle mit 3 verschiedenen Tee-Höhen. Finde deine optimale Tee-Höhe für Kontrolle und Distanz.', duration: 20, difficulty: 'EASY', tips: ['Äquator auf Schläger-Oberkante', 'Aufwärts-Treffer anstreben', 'Weiter Tee = mehr Distanz'] },
    { name: 'Fairway-Simulation', description: 'Markiere ein "Fairway" auf der Range (zwei Stangen, 30m breit). Schlage 15 Drives. Zähle Treffer.', duration: 25, difficulty: 'MEDIUM', tips: ['Ziel wählen vor dem Aufbau', 'Nicht auf Distanz optimieren', 'Kontrolle > Kraft'] },
    { name: '3/4 Swing Drill', description: 'Übe Driver mit 3/4 Schwung. Ziel: maximale Kontrolle. Danach vollen Schwung mit gleichem Rhythm.', duration: 25, difficulty: 'EASY', tips: ['Kontrolle durch Tempo', 'Balance bis zum Ende', 'Gleicher Abschluss'] },
    { name: 'Driver Shape Training', description: 'Wechsle bewusst zwischen Fade und Draw: je 5 Bälle. Trainiert Schlägerweg-Kontrolle.', duration: 30, difficulty: 'HARD', tips: ['Fade: Schlägerfläche offen', 'Draw: Schlägerfläche zu', 'Körperrotation betonen'] },
  ],
  COURSE_MANAGEMENT: [
    { name: 'Distanz-Audit', description: 'Schlage je 10 Bälle mit jedem Schläger. Notiere die Durchschnittsdistanz (nicht die beste!). Erstelle deine persönliche Distanz-Karte.', duration: 50, difficulty: 'EASY', tips: ['Gute Treffer messen, nicht Tops', 'Windkorrektur notieren', 'Realistisch bleiben'] },
    { name: 'Strategie-Übung am Platz', description: 'Spiele 9 Löcher mit dem Ziel: NIE auf Gefahren spielen. Immer sicherer Bereich. Tracke dein Ergebnis vs. normales Spiel.', duration: 120, difficulty: 'MEDIUM', tips: ['Bogey als gutes Ergebnis sehen', 'Niemals auf Wasser spielen', 'Lay-up wenn unsicher'] },
    { name: 'Shot-Clock Training', description: 'Schlage 30 Bälle mit maximal 30 Sekunden Pre-Shot Routine. Entwickelt Entscheidungssicherheit.', duration: 25, difficulty: 'MEDIUM', tips: ['Entscheid hinter dem Ball', 'Einmal festlegen, nicht ändern', 'Routine in 20 Sek.'] },
  ],
  MENTAL_GAME: [
    { name: 'Visualisierungs-Session', description: 'Vor jedem Schlag auf der Range: 10 Sekunden Visualisierung. Stelle dir den perfekten Flug vor. Erst dann schlagen.', duration: 20, difficulty: 'EASY', tips: ['Flugkurve klar sehen', 'Körpergefühl einbeziehen', 'Positives Bild halten'] },
    { name: 'Reset-Routine entwickeln', description: 'Nach jedem schlechten Schlag auf der Range: 3 Atemzüge, 1 Schritt zurück, Schläger absetzen. Dann: "Nächster Schlag."', duration: 15, difficulty: 'EASY', tips: ['Physischer Reset-Trigger', 'Vergangenheit loslassen', 'Fokus auf nächsten Schlag'] },
    { name: 'Druck-Simulation', description: 'Letzter Ball des Trainings: imaginäre 1000€ Wette auf diesen Schlag. Führe volle Pre-Shot Routine aus. Wie gehst du damit um?', duration: 10, difficulty: 'HARD', tips: ['Routine ist der Anker', 'Konsequenzen ignorieren', 'Vertrauen in Training'] },
    { name: 'Par-3 Spiel', description: 'Spiele 9 Par-3 Löcher mit einer Regel: jede Entscheidung binnen 20 Sek. Keine Zweifler.', duration: 60, difficulty: 'MEDIUM', tips: ['Schnelle Entscheidung = bessere Entscheidung', 'Commitment über Perfektion', 'Ergebnis akzeptieren'] },
  ],
};

// ── Plan-Struktur generieren ─────────────────────────────────────────
export interface GeneratedDay {
  dayNumber: number;
  title: string;
  focus: TrainingCategory;
  totalMinutes: number;
  drills: typeof DRILLS[string];
}

export interface GeneratedPlan {
  name: string;
  description: string;
  durationWeeks: number;
  days: GeneratedDay[];
  scores: CategoryScores;
  weaknesses: string[];
  strengths: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  putting: 'Putting',
  shortGame: 'Kurzspiel',
  ironPlay: 'Eisenspiel',
  driving: 'Driver',
  courseManagement: 'Platzmanagement',
  mentalGame: 'Mental',
};

const CATEGORY_TO_ENUM: Record<string, TrainingCategory> = {
  putting: 'PUTTING',
  shortGame: 'SHORT_GAME',
  ironPlay: 'IRON_PLAY',
  driving: 'DRIVING',
  courseManagement: 'COURSE_MANAGEMENT',
  mentalGame: 'MENTAL_GAME',
};

const DAY_TITLES: Record<string, string[]> = {
  PUTTING: ['Putting-Präzision', 'Distanz-Kontrolle', 'Putting unter Druck'],
  SHORT_GAME: ['Kurzspiel-Grundlagen', 'Up & Down Training', 'Bunker & Flop'],
  IRON_PLAY: ['Konsistenz am Eisen', 'Eisenspiel-Kontrolle', 'Ziel-Präzision'],
  DRIVING: ['Driver-Kontrolle', 'Fairway-Training', 'Schlag-Form'],
  COURSE_MANAGEMENT: ['Distanz-Audit', 'Strategie am Platz', 'Shot-Entscheidungen'],
  MENTAL_GAME: ['Mentale Grundlagen', 'Routine & Fokus', 'Druck-Training'],
};

export function generatePlan(answers: AssessmentAnswers, scores: CategoryScores): GeneratedPlan {
  // Schwächen sortieren (niedrigster Score = größte Schwäche)
  const sorted = Object.entries(scores).sort(([, a], [, b]) => a - b);
  const weaknesses = sorted.slice(0, 3).map(([k]) => CATEGORY_LABELS[k]);
  const strengths = sorted.slice(-2).map(([k]) => CATEGORY_LABELS[k]);

  // Trainingstage/Woche basierend auf verfügbarer Zeit
  const daysPerWeek = answers.weeklyHours <= 2 ? 2 : answers.weeklyHours <= 4 ? 3 : 4;
  const planWeeks = 6;
  const totalDays = daysPerWeek * planWeeks;

  // Gewichtung: schwächere Kategorien bekommen mehr Tage
  const weights = sorted.map(([key, score]) => ({ key, weight: Math.max(5, 100 - score) }));
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0);

  // Tage pro Kategorie berechnen
  const daysPerCategory = weights.map(({ key, weight }) => ({
    key,
    days: Math.max(1, Math.round((weight / totalWeight) * totalDays)),
  }));

  // Tage generieren
  const days: GeneratedDay[] = [];
  let dayCounter = 1;

  // Über 6 Wochen verteilen — reihum nach Gewichtung
  const schedule: string[] = [];
  while (schedule.length < totalDays) {
    for (const { key, days: count } of daysPerCategory) {
      const alreadyScheduled = schedule.filter((k) => k === key).length;
      const targetForThisRound = Math.ceil(count / planWeeks);
      for (let i = 0; i < targetForThisRound && schedule.length < totalDays; i++) {
        schedule.push(key);
      }
    }
  }

  // Shuffle für Abwechslung (kein Fisher-Yates, deterministisch)
  const shuffled = schedule.slice(0, totalDays);
  for (let i = 1; i < shuffled.length; i++) {
    if (shuffled[i] === shuffled[i - 1] && i + 1 < shuffled.length) {
      [shuffled[i], shuffled[i + 1]] = [shuffled[i + 1], shuffled[i]];
    }
  }

  // Difficulty-Progression über Wochen
  const getDifficulty = (week: number): TrainingDifficulty => {
    if (week <= 2) return 'EASY';
    if (week <= 4) return 'MEDIUM';
    return 'HARD';
  };

  const categoryDrillIndex: Record<string, number> = {};

  for (let i = 0; i < shuffled.length; i++) {
    const categoryKey = shuffled[i];
    const week = Math.floor(i / daysPerWeek) + 1;
    const difficulty = getDifficulty(week);
    const enumKey = CATEGORY_TO_ENUM[categoryKey];
    const drillPool = DRILLS[enumKey] ?? [];

    if (!categoryDrillIndex[categoryKey]) categoryDrillIndex[categoryKey] = 0;

    // 2-3 Drills pro Tag, passend zur Schwierigkeit und Fortschritt
    const targetDifficulties: TrainingDifficulty[] = week <= 2
      ? ['EASY', 'EASY', 'MEDIUM']
      : week <= 4
      ? ['EASY', 'MEDIUM', 'MEDIUM']
      : ['MEDIUM', 'HARD', 'HARD'];

    const selectedDrills = targetDifficulties
      .map((d) => drillPool.find((dr) => dr.difficulty === d) ?? drillPool[0])
      .filter((dr, idx, arr) => arr.findIndex((d) => d.name === dr.name) === idx)
      .slice(0, 2);

    const titleIdx = Math.min(Math.floor(i / daysPerWeek), (DAY_TITLES[enumKey]?.length ?? 1) - 1);
    const title = DAY_TITLES[enumKey]?.[titleIdx] ?? CATEGORY_LABELS[categoryKey];
    const totalMinutes = selectedDrills.reduce((s, d) => s + d.duration, 0);

    days.push({
      dayNumber: dayCounter++,
      title,
      focus: enumKey,
      totalMinutes,
      drills: selectedDrills,
    });
  }

  // Plan-Name und Beschreibung basierend auf Schwächen
  const top2 = weaknesses.slice(0, 2).join(' & ');
  const goalLabel = {
    handicap: 'Handicap-Verbesserung',
    consistency: 'mehr Konstanz',
    enjoyment: 'mehr Spaß am Spiel',
    compete: 'Wettkampf-Vorbereitung',
  }[answers.mainGoal];

  return {
    name: `Persönlicher Plan — ${top2}`,
    description: `Individuell erstellt für dein Ziel: ${goalLabel}. Fokus auf deine größten Schwächen (${weaknesses.join(', ')}), mit gezieltem Aufbau über 6 Wochen.`,
    durationWeeks: planWeeks,
    days,
    scores,
    weaknesses,
    strengths,
  };
}
