import { PrismaClient, GolferLevel, TrainingCategory, TrainingDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding training plans...');

  // Beginner Plan
  await prisma.trainingPlan.upsert({
    where: { id: 'plan-beginner-1' },
    update: {},
    create: {
      id: 'plan-beginner-1',
      name: 'Golf Grundlagen',
      description: 'Der perfekte Einstieg für Anfänger. Fokus auf solide Grundlagen, Regelkenntnisse und erste Schlagtechnik.',
      targetLevel: GolferLevel.BEGINNER,
      durationWeeks: 6,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1,
            title: 'Putting Basics',
            focus: TrainingCategory.PUTTING,
            totalMinutes: 45,
            drills: {
              create: [
                {
                  order: 1,
                  drill: {
                    create: {
                      name: '1-Meter Putt',
                      description: 'Putte 10 Bälle von 1 Meter. Fokus auf ruhige Standfläche und gerades Durchschwingen.',
                      duration: 15,
                      category: TrainingCategory.PUTTING,
                      difficulty: TrainingDifficulty.EASY,
                      tips: ['Augen über dem Ball', 'Schulterrotation, keine Handgelenke', 'Gleichmäßiger Rhythmus'],
                    },
                  },
                },
                {
                  order: 2,
                  drill: {
                    create: {
                      name: '3-Meter Distanz-Putting',
                      description: 'Lege 5 Bälle in 3 Meter Abstand und versuche, alle einzulochen. Dann 5 Meter.',
                      duration: 20,
                      category: TrainingCategory.PUTTING,
                      difficulty: TrainingDifficulty.EASY,
                      tips: ['Lies das Grün vor jedem Putt', 'Routine entwickeln', 'Atemübung vor dem Schlag'],
                    },
                  },
                },
                {
                  order: 3,
                  drill: {
                    create: {
                      name: 'Lag Putting',
                      description: 'Putte von 10 Metern mit dem Ziel, den Ball innerhalb eines 1-Meter Kreises um das Loch zu stoppen.',
                      duration: 10,
                      category: TrainingCategory.PUTTING,
                      difficulty: TrainingDifficulty.MEDIUM,
                      tips: ['Distanz vor Linie', 'Großer Schwung für lange Putts', 'Nicht einlochen wollen, sondern ankern'],
                    },
                  },
                },
              ],
            },
          },
          {
            dayNumber: 2,
            title: 'Short Game Einführung',
            focus: TrainingCategory.SHORT_GAME,
            totalMinutes: 50,
            drills: {
              create: [
                {
                  order: 1,
                  drill: {
                    create: {
                      name: 'Chip & Run',
                      description: 'Chippe 20 Bälle auf ein Grün mit einem 7er Eisen. Ziel: Ball landet 1/3 auf dem Grün, rollt 2/3.',
                      duration: 25,
                      category: TrainingCategory.SHORT_GAME,
                      difficulty: TrainingDifficulty.EASY,
                      tips: ['Gewicht auf linkem Bein', 'Hände vor dem Ball', 'Kurzer, kontrollierter Schwung'],
                    },
                  },
                },
                {
                  order: 2,
                  drill: {
                    create: {
                      name: 'Sand Bunker Basics',
                      description: 'Übe den Bunker-Explosionsschlag: Schlage 2 cm hinter den Ball, nicht auf den Ball.',
                      duration: 25,
                      category: TrainingCategory.SHORT_GAME,
                      difficulty: TrainingDifficulty.MEDIUM,
                      tips: ['Offene Schlägerfläche', 'Offener Stand', 'Sand wegschlagen, nicht den Ball'],
                    },
                  },
                },
              ],
            },
          },
          {
            dayNumber: 3,
            title: 'Eisenspiel',
            focus: TrainingCategory.IRON_PLAY,
            totalMinutes: 60,
            drills: {
              create: [
                {
                  order: 1,
                  drill: {
                    create: {
                      name: 'Halber Schwung 9er Eisen',
                      description: 'Schlage 30 Bälle mit halbem Schwung. Fokus auf sauberen Kontakt, nicht Distanz.',
                      duration: 30,
                      category: TrainingCategory.IRON_PLAY,
                      difficulty: TrainingDifficulty.EASY,
                      tips: ['Divot nach dem Ball', 'Gleichgewicht bis zum Ende', 'Hüfte dreht durch'],
                    },
                  },
                },
                {
                  order: 2,
                  drill: {
                    create: {
                      name: 'Zielübung mit Stangen',
                      description: 'Lege zwei Ausrichtstangen. Schlage 20 Bälle mit 7er Eisen auf ein Ziel 150m entfernt.',
                      duration: 30,
                      category: TrainingCategory.IRON_PLAY,
                      difficulty: TrainingDifficulty.MEDIUM,
                      tips: ['Immer von hinten ausrichten', 'Körper parallel zur Ziellinie', 'Pre-Shot Routine'],
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Intermediate Plan
  await prisma.trainingPlan.upsert({
    where: { id: 'plan-intermediate-1' },
    update: {},
    create: {
      id: 'plan-intermediate-1',
      name: 'Handicap Breaker',
      description: 'Für Golfer mit HCP 18-28. Gezieltes Verbessern der Schwachstellen und Platzmanagement.',
      targetLevel: GolferLevel.INTERMEDIATE,
      durationWeeks: 8,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1,
            title: 'Platzmanagement',
            focus: TrainingCategory.COURSE_MANAGEMENT,
            totalMinutes: 45,
            drills: {
              create: [
                {
                  order: 1,
                  drill: {
                    create: {
                      name: 'Club Selection Drill',
                      description: 'Schlage je 10 Bälle mit 5 verschiedenen Schlägern. Notiere die Durchschnittsdistanz für jeden.',
                      duration: 45,
                      category: TrainingCategory.COURSE_MANAGEMENT,
                      difficulty: TrainingDifficulty.MEDIUM,
                      tips: ['Ehrlich mit Distanzen sein', 'Gute Treffer, nicht Bestweite', 'Windkorrektur einplanen'],
                    },
                  },
                },
              ],
            },
          },
          {
            dayNumber: 2,
            title: 'Short Game Finesse',
            focus: TrainingCategory.SHORT_GAME,
            totalMinutes: 60,
            drills: {
              create: [
                {
                  order: 1,
                  drill: {
                    create: {
                      name: 'Up & Down Challenge',
                      description: 'Spiele 18 Up & Downs von verschiedenen Lagen rund um das Grün. Zähle deine Erfolgsquote.',
                      duration: 60,
                      category: TrainingCategory.SHORT_GAME,
                      difficulty: TrainingDifficulty.MEDIUM,
                      tips: ['Plane den Landepunkt', 'Wähle den Chip vor dem Pitch', 'Ruhige Hände'],
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Advanced Plan
  await prisma.trainingPlan.upsert({
    where: { id: 'plan-advanced-1' },
    update: {},
    create: {
      id: 'plan-advanced-1',
      name: 'Single Digit HCP',
      description: 'Für Golfer mit HCP 9-18. Technische Feinheiten, mentale Stärke und Wettbewerbsvorbereitung.',
      targetLevel: GolferLevel.ADVANCED,
      durationWeeks: 10,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1,
            title: 'Mentales Spiel',
            focus: TrainingCategory.MENTAL_GAME,
            totalMinutes: 40,
            drills: {
              create: [
                {
                  order: 1,
                  drill: {
                    create: {
                      name: 'Pre-Shot Routine Perfektionieren',
                      description: 'Führe 50 Schläge mit einer festen, identischen Pre-Shot Routine durch. Zeitmessung: max 30 Sekunden.',
                      duration: 40,
                      category: TrainingCategory.MENTAL_GAME,
                      difficulty: TrainingDifficulty.MEDIUM,
                      tips: ['Gleiche Routine bei jedem Schlag', 'Ziel visualisieren', 'Commit to the shot'],
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // ── Übungsbibliothek ────────────────────────────────────────────────
  console.log('Seeding drill library...');

  const libraryDrills: {
    id: string;
    name: string;
    description: string;
    duration: number;
    category: TrainingCategory;
    difficulty: TrainingDifficulty;
    tips: string[];
  }[] = [
    // ── PUTTING ───────────────────────────────────────────────────────
    {
      id: 'lib-putt-01',
      name: 'Tor-Drill',
      description: 'Zwei Tees werden ca. 5 cm links und rechts des Balls gesteckt, sodass ein enges Tor entsteht. Der Putter muss beim Durchschwingen das Tor passieren, ohne die Tees zu berühren. Dieser Drill schult präzise Schlagbahn und Mittelkontakt – beides entscheidend für gerades Putten. Starte mit kurzen Putts (1 m), steigere die Distanz bis auf 3 m.',
      duration: 15,
      category: 'PUTTING',
      difficulty: 'EASY',
      tips: [
        'Putter-Kopf muss das Tor exakt mittig passieren',
        'Tees erst schmal setzen (6 cm), dann enger (4 cm) für mehr Präzision',
        'Auf gleichmäßigen Rückschwung und Durchschwung achten',
        'Körper und Kopf während des Schlags ruhig halten',
      ],
    },
    {
      id: 'lib-putt-02',
      name: 'Uhr-Drill',
      description: 'Markiere 8 Positionen um das Loch in ca. 1 m Abstand wie Ziffern einer Uhr (12, 1:30, 3, 4:30, 6, 7:30, 9, 10:30 Uhr). Putte von jeder Position je einen Ball. Das Ziel ist, alle 8 Putts zu versenken. Dieser Drill trainiert das Lesen von Schrägen aus allen Richtungen und baut Selbstvertrauen für Kurzputts auf.',
      duration: 20,
      category: 'PUTTING',
      difficulty: 'MEDIUM',
      tips: [
        'Lies jede Schräge neu – wiederhole nicht einfach den letzten Schlag',
        'Markiere Startpositionen mit Tees für Wiederholbarkeit',
        'Steigere auf 2 m Abstand, wenn alle 8 aus 1 m gelingen',
        'Notiere Trefferzahl für jede Session',
      ],
    },
    {
      id: 'lib-putt-03',
      name: 'Leitern-Drill',
      description: 'Lege 5 Tees in einer Linie in Abständen von je 1 m (also bei 1 m, 2 m, 3 m, 4 m, 5 m) hinter dem Loch. Putte von 10 m Entfernung und versuche, jeden Ball im Bereich der Leiter (zwischen dem ersten und letzten Tee) zu stoppen. Trainiert Distanzkontrolle und das Gefühl für Langputts – der häufigste Grund für 3-Putts.',
      duration: 20,
      category: 'PUTTING',
      difficulty: 'MEDIUM',
      tips: [
        'Fokussiere auf konstante Pendelbewegung, nicht auf Kraft',
        'Rückschwung-Länge bestimmt die Distanz – nicht der Krafteinsatz',
        'Augen über dem Ball positionieren',
        'Atme vor dem Schlag tief aus um Spannung zu lösen',
      ],
    },
    {
      id: 'lib-putt-04',
      name: '100-Putts-Challenge',
      description: 'Stecke einen Tee 80 cm vom Loch entfernt. Putte 100 Putts hintereinander von dieser Distanz. Ziel ist, alle 100 zu versenken. Triffst du einen Fehler, fängst du von vorne an (oder zählst Serienrekord). Dieser Drill ist ein Klassiker der Profis – er baut Routine, Druck-Resistenz und absolute Grundsicherheit auf kurzen Putts auf.',
      duration: 30,
      category: 'PUTTING',
      difficulty: 'HARD',
      tips: [
        'Wähle eine leicht gerade Linie für den Einstieg',
        'Routine: Anvisieren, 2 Probeschwünge, putten – immer gleich',
        'Mental: jeden Putt einzeln angehen, nicht an die Zahl denken',
        'Bei Misserfolg Ursache analysieren: Linie oder Distanz?',
      ],
    },
    {
      id: 'lib-putt-05',
      name: 'Ein-Hand-Putten',
      description: 'Putte nur mit der führenden Hand (links für Rechtshänder). Starte mit kurzen 1-m-Putts und steigere die Distanz. Dieser Drill erzwingt eine korrekte Handhaltung, schult das Gefühl der Führungshand und zeigt deutlich, ob der Schwung von der richtigen Hand geführt wird.',
      duration: 15,
      category: 'PUTTING',
      difficulty: 'MEDIUM',
      tips: [
        'Griff locker halten – keine weiße Knöchel',
        'Der Ellbogen bleibt nah am Körper',
        'Vergleiche danach mit beidhändigem Putten – das Gefühl übertragen',
        'Auch mit der anderen Hand üben für symmetrisches Gefühl',
      ],
    },
    {
      id: 'lib-putt-06',
      name: 'Augen-geschlossen-Drill',
      description: 'Putte aus ca. 1,5 m mit geschlossenen Augen. Schätze vor dem Schlag die Linie und Kraft, dann führe den Schlag aus. Öffne die Augen erst nach dem Einlochen (oder Verfehlen). Trainiert das kinästhetische Gefühl, Distanzkontrolle und verhindert das "Hinterherschalten" des Kopfes.',
      duration: 15,
      category: 'PUTTING',
      difficulty: 'MEDIUM',
      tips: [
        'Richte dich sorgfältig aus, bevor du die Augen schließt',
        'Höre auf das "Klick" des Putters am Ball',
        'Ideal als Warmup-Drill vor einer Runde',
        'Starte mit geraden Putts, nicht mit Kurven',
      ],
    },
    {
      id: 'lib-putt-07',
      name: 'Metronom-Drill',
      description: 'Verwende eine Metronom-App (60–70 BPM). Jeder Takt entspricht Rückschwung oder Durchschwung. Das Metronom erzwingt einen gleichmäßigen Rhythmus und eliminiert das häufige Problem eines zu schnellen oder unrhythmischen Durchschwungs.',
      duration: 15,
      category: 'PUTTING',
      difficulty: 'EASY',
      tips: [
        '60 BPM: Rückschwung auf Beat 1, Durchschwung auf Beat 2',
        'Fange mit kurzen Putts an, steigere die Distanz',
        'Rhythmus ist wichtiger als Stärke',
        'Übertrage den Rhythmus auf das Spiel auf dem Platz',
      ],
    },
    {
      id: 'lib-putt-08',
      name: 'Breakputt-Analyse',
      description: 'Suche auf dem Übungsgrün 3 verschiedene Breakputts (links-brechend, rechts-brechend, stark brechend) aus je 3–5 m. Lies jede Linie, bestimme einen "Eintrittspunkt" und putte 5 Bälle auf dieselbe Stelle. Trainiert systematisch das Lesen von Schrägen – die wichtigste Fähigkeit für gutes Putten.',
      duration: 25,
      category: 'PUTTING',
      difficulty: 'HARD',
      tips: [
        'Lies den Putt immer von unterhalb des Lochs – beste Perspektive',
        'Bestimme einen Punkt ca. 30 cm vor dem Ball als Ziellinie',
        'Schräge übertreiben sich bei langsamen Bällen – Mut zur Linie',
        'Wind und Grasstruktur (Grain) berücksichtigen',
      ],
    },
    {
      id: 'lib-putt-09',
      name: 'Strecken-Drill (5–10–15–20 m)',
      description: 'Putte von 4 verschiedenen Distanzen (5, 10, 15, 20 m) je 3 Bälle zum Loch. Ziel: alle Bälle stoppen zwischen Loch und 60 cm dahinter – kein Putt soll kurz bleiben, keiner mehr als 60 cm überlaufen. Trainiert Distanzkontrolle über alle gängigen Langputtdistanzen.',
      duration: 20,
      category: 'PUTTING',
      difficulty: 'HARD',
      tips: [
        'Visualisiere die Ballgeschwindigkeit, nicht die Kraft',
        'Triff den Sweetspot für konsistente Rollweite',
        'Notiere, ob du eher zu kurz oder zu weit puttest',
        'Greens-Stimpmeter berücksichtigen (schnellere Greens = weniger Kraft)',
      ],
    },
    {
      id: 'lib-putt-10',
      name: 'Druckputt-Drill',
      description: 'Baue künstlichen Druck auf: Putte 5 Bälle aus 1,5 m. Erst wenn alle 5 drin sind, darfst du aufhören. Bei einem Fehler beginnst du neu. Simuliert das Druckgefühl beim Einlochen kurzer Birdie- oder Bogey-Rettungsputts im Spiel.',
      duration: 15,
      category: 'PUTTING',
      difficulty: 'HARD',
      tips: [
        'Denke laut, was du mit jedem Putt vorhast',
        'Gleichmäßige Pre-Putt-Routine auch unter Druck beibehalten',
        'Nutze Visualisierung: Ball fällt ins Loch',
        'Analyse: Warum schlägst du unter Druck anders?',
      ],
    },

    // ── SHORT GAME ────────────────────────────────────────────────────
    {
      id: 'lib-short-01',
      name: 'Landezone-Drill',
      description: 'Lege ein Handtuch oder markiere eine Zone ca. 1–2 m vor dir als Landezone. Chippe von 10–15 m Entfernung und versuche, den Ball konsistent in der Landezone landen zu lassen. Dieser Drill trainiert das entscheidende Prinzip guten Chippings: erst Landezone definieren, dann Schlag ausführen.',
      duration: 20,
      category: 'SHORT_GAME',
      difficulty: 'EASY',
      tips: [
        'Landezone immer auf dem Grün wählen, nicht davor',
        'Je weicher der Boden, desto weiter vorne die Landezone',
        'Schlägerauswahl beeinflusst den Roll nach dem Landen',
        'Landezone → Roll-Verhältnis: 8er Eisen = 1:3, Sand Wedge = 1:1',
      ],
    },
    {
      id: 'lib-short-02',
      name: 'Bump & Run',
      description: 'Chipse von 15–20 m mit einem kurzen Eisen (7 oder 8er) mit einem flachen, niedrigen Schlag. Ball landet kurz auf dem Grün und rollt zur Fahne. Trainiert den kontrollierten Bump & Run – besonders wertvoll bei Gegenwind, festem Boden und einfachen Anlagen ohne Hindernisse.',
      duration: 20,
      category: 'SHORT_GAME',
      difficulty: 'EASY',
      tips: [
        'Ball weit hinten in der Stance (rechter Fuß)',
        'Gewicht auf dem linken Fuß – ca. 70%',
        'Kleiner, kontrollierbarer Schwung – Körper führt',
        'Schläger bleibt niedrig nach dem Treff',
      ],
    },
    {
      id: 'lib-short-03',
      name: 'Up & Down Challenge',
      description: 'Lege 10 Bälle an 10 verschiedenen Positionen rund ums Grün (unterschiedliche Distanzen, Lagen, Winkel). Versuche, von jeder Position in maximal 2 Schlägen (Chip + Putt) einzulochen. Zähle deine Up & Downs. Dieser Drill simuliert reale Spielsituationen und trainiert Entscheidungsfindung.',
      duration: 30,
      category: 'SHORT_GAME',
      difficulty: 'MEDIUM',
      tips: [
        'Wähle für jede Position den richtigen Schläger – kein Einheitsschläger',
        'Lies das Grün für jeden Chip vorher',
        'Sei realistisch: Anlage mit Bunker = anderer Chip als freie Anlage',
        'Ziel: 5 von 10 Up & Downs = sehr gutes Kurzspiel',
      ],
    },
    {
      id: 'lib-short-04',
      name: 'Handtuch-Drill (Handgelenk-Kontrolle)',
      description: 'Klemme ein gefaltetes Handtuch unter deinen linken Armbeuge (Rechtshänder). Chippe 20 Bälle, ohne dass das Handtuch fällt. Das verhindert den häufigsten Fehler beim Chippen: "Chicken Wing" (das Abwinkeln des Ellbogens beim Durchschwung).',
      duration: 15,
      category: 'SHORT_GAME',
      difficulty: 'EASY',
      tips: [
        'Handtuch fällt = Chicken Wing passiert',
        'Halte den linken Arm (Rechtshänder) gestreckt durch den Schlag',
        'Übertrage das Gefühl ins echte Spiel',
        'Druckkontrolle: Handtuch fest genug halten, aber nicht verkrampfen',
      ],
    },
    {
      id: 'lib-short-05',
      name: 'Lob-Shot-Kontrolle',
      description: 'Trainiere den Lob-Shot mit dem Lob-Wedge (60°) aus 15–20 m. Ziel: Ball hoch in die Luft, minimaler Roll. Lege eine Box oder ein Handtuch ca. 2 m hinter die Fahne – der Ball soll vor der Box landen und stoppen. Trainiert den Hochball für enge Liegen, Bunkerkanten und weiche Greens.',
      duration: 20,
      category: 'SHORT_GAME',
      difficulty: 'HARD',
      tips: [
        'Clubface öffnen (zeigt zur Decke), Griff nach links drehen',
        'Stance offen – Körper zeigt links der Fahne',
        'Schwung entlang der Körperlinie – nicht zur Fahne',
        'Durch den Ball schwingen – nie nachlassen',
      ],
    },
    {
      id: 'lib-short-06',
      name: 'Bunker-Grundtechnik (Splash Shot)',
      description: 'Trainiere den Standard-Bunkerschlag aus einem mittleren Bunker (5–15 m zur Fahne). Zeichne eine Linie im Sand 5 cm hinter dem Ball. Ziel: Schläger schlägt hinter der Linie in den Sand und schöpft den Ball auf das Grün. Wiederhole 20 Mal und zähle, wie oft der Ball das Grün trifft.',
      duration: 25,
      category: 'SHORT_GAME',
      difficulty: 'MEDIUM',
      tips: [
        'Clubface weit öffnen (zeigt gen Himmel)',
        'Stance offen, Gewicht links, Ball weit vorne in der Stance',
        'Schwung nach außen – folgt der Körperlinie',
        'Entscheide: "Ich schlage Sand, nicht Ball"',
        'Durchschwingen erzwingen – häufigster Fehler ist Abbremsen',
      ],
    },
    {
      id: 'lib-short-07',
      name: 'Bunker-Distanzkontrolle',
      description: 'Schieße aus demselben Bunker je 5 Bälle auf 3 verschiedene Distanzen: 8 m, 15 m, 25 m. Markiere jede Zielzone mit Tees. Trainiert die Distanzkontrolle im Bunker – häufig vernachlässigt, obwohl Bunker unterschiedliche Schlaghärten erfordern.',
      duration: 25,
      category: 'SHORT_GAME',
      difficulty: 'HARD',
      tips: [
        'Kurze Distanzen: mehr Sandvolumen (weiter hinter Ball eintauchen)',
        'Lange Distanzen: weniger Sand, schnellerer Schwung',
        'Clubface immer offen halten',
        'Stand und Sandtiefe immer gleich – nur Schwunggröße ändert sich',
      ],
    },
    {
      id: 'lib-short-08',
      name: 'Rough-Chip-Training',
      description: 'Lege 10 Bälle in langes Gras (5–8 cm) in verschiedenen Abständen zum Grün (5–20 m). Ziele ist Up & Down mit verschiedenen Schlägern zu üben. Rough-Liegen erfordern andere Technik als Fairway-Chips: Das Gras wickelt sich um den Hosel und schließt den Clubface.',
      duration: 25,
      category: 'SHORT_GAME',
      difficulty: 'HARD',
      tips: [
        'Clubface leicht öffnen – kompensiert Schließen durch Rough',
        'Steilerer Schwung – Schläger geht direkt auf den Ball',
        'Lob-Wedge im tiefen Rough bevorzugen',
        'Weniger Roll erwarten – Rough nimmt Spin vom Ball',
      ],
    },
    {
      id: 'lib-short-09',
      name: 'Todesring-Drill (Circle of Death)',
      description: 'Platziere 8–12 Bälle im Kreis um die Fahne, je 1,5 m entfernt. Chippe alle Bälle von außen in Richtung Loch – Ziel ist Up & Down (Chip + ein Putt). Zähle die Treffer. Legendärer Wettkampf-Simulationsdrills der Tour-Spieler, der Präzision unter Druck trainiert.',
      duration: 30,
      category: 'SHORT_GAME',
      difficulty: 'HARD',
      tips: [
        'Verschiedene Schläger für verschiedene Lagen verwenden',
        'Kein Zeitdruck – jede Position sorgfältig analysieren',
        'Ziel für Anfänger: 4/8, für Fortgeschrittene: 6/8, für Profis: 8/8',
        'Regelmäßig messen – Fortschritt zeigt sich über Wochen',
      ],
    },
    {
      id: 'lib-short-10',
      name: 'Flop-Over-Obstacle',
      description: 'Platziere ein Hindernis (Schläger-Bag, Karton) zwischen Ball und Fahne. Die einzige Möglichkeit die Fahne zu erreichen ist ein hoher Lob-Shot über das Hindernis. Zwingt zur korrekten Lob-Technik, da ein normaler Chip im Hindernis endet.',
      duration: 20,
      category: 'SHORT_GAME',
      difficulty: 'HARD',
      tips: [
        'Hindernis zunächst niedrig (Schläger-Bag), später höher wählen',
        'Commitment zum Schlag – keine Halbherzigkeit',
        'Sand-Wedge oder Lob-Wedge je nach Höhenbedarf',
        'Distanz zum Grün beachten: Lob fällt fast senkrecht',
      ],
    },

    // ── IRON PLAY ─────────────────────────────────────────────────────
    {
      id: 'lib-iron-01',
      name: 'Divot-Drill',
      description: 'Schlage Eisen-Schläge von Gras (oder Matte) und beachte den Divot. Das Divot muss vor dem Ballstandort entstehen (Ball zuerst, dann Boden). Zeichne einen Strich in die Matte und platziere den Ball auf dem Strich. Der Divot soll hinter dem Strich enden. Trainiert den entscheidenden "Ball-first Contact".',
      duration: 20,
      category: 'IRON_PLAY',
      difficulty: 'EASY',
      tips: [
        'Divot zeigt nach vorne = Hände sind beim Impact vor dem Ball (korrekt)',
        'Divot zeigt gerade = Hände auf Höhe des Balls (akzeptabel)',
        'Kein Divot oder dahinter = Ball wird nicht richtig getroffen',
        'Richtung des Divots zeigt Schwungbahn an',
      ],
    },
    {
      id: 'lib-iron-02',
      name: 'Alignment-Stick-Drill',
      description: 'Lege zwei Ausrichtstäbe parallel auf den Boden: einen auf der Ziellinie, einen parallel dazu als Standbegrenzung. Übe 30 Schläge und kontrolliere nach jedem, ob du auf Linie gestanden hast. Ausrichtung ist der häufigste technische Fehler – viele Spieler stehen unbewusst nach rechts oder links offen.',
      duration: 20,
      category: 'IRON_PLAY',
      difficulty: 'EASY',
      tips: [
        'Ausrichtstäbe zeigen Parallel-Links zur Fahnen-Linie',
        'Stab für Füße, Hüfte UND Schultern prüfen',
        'Regelmäßig mit einem Partner oder Spiegel überprüfen lassen',
        'Ausrichtung auf dem Platz: Zwischenziel 1–2 m vor dem Ball wählen',
      ],
    },
    {
      id: 'lib-iron-03',
      name: 'Halbschwung-Konsistenz',
      description: 'Schlage 30 Bälle mit einem Halbschwung (Schläger-Schaft bei P6: horizontal in der Rückschwungphase). Fokus auf Treffpräzision, nicht Distanz. Etwa 70–75% der vollen Distanz sind zu erwarten. Trainiert kontrollierten Kontakt, Rhythmus und Wiederholbarkeit – Basis für den vollen Schwung.',
      duration: 20,
      category: 'IRON_PLAY',
      difficulty: 'EASY',
      tips: [
        'Gewichtsverlagerung trotz kleinem Schwung nicht vergessen',
        'Follow-Through immer ausführen – nie abbrechen',
        'Ideal für Distanz-Wedge-Schläge zwischen den Schlägern',
        'Treff kontrollieren: Ball fliegt gerade → korrekte Schwungbahn',
      ],
    },
    {
      id: 'lib-iron-04',
      name: '9-Schuss-Drill',
      description: 'Schlage je 3 Bälle mit 9 verschiedenen Schusstypen: Low-Draw, Straight-Draw, High-Draw, Low-Straight, Straight, High-Straight, Low-Fade, Straight-Fade, High-Fade. Zwingt zur bewussten Körper- und Schwungkontrolle und entwickelt ein vollständiges Shot-Repertoire wie es Tour-Spieler täglich üben.',
      duration: 40,
      category: 'IRON_PLAY',
      difficulty: 'HARD',
      tips: [
        'Draw: Clubface leicht geschlossen, Stance leicht nach rechts',
        'Fade: Clubface leicht offen, Stance leicht nach links',
        'Hoch: Ball weiter vorne in der Stance, aktives Release',
        'Flach: Hände vorn, Gewicht links, Punch-Finish',
      ],
    },
    {
      id: 'lib-iron-05',
      name: 'Punch-Shot-Training',
      description: 'Übe den Punch-Shot: kurzer, flacher Schlag mit abgebremsten Follow-Through. Ball weit hinten in der Stance (rechter Fuß), Hände weit vor dem Ball. Schlag mit 70% Kraft und stoppe den Schläger bei etwa Hüfthöhe. Unverzichtbar bei Wind und engen Fairways.',
      duration: 20,
      category: 'IRON_PLAY',
      difficulty: 'MEDIUM',
      tips: [
        'Hände bleiben nach dem Impact vor dem Kopf des Schlägers',
        'Körperrotation limitiert, aber nicht null',
        'Weniger Loft durch Ballposition + Handposition',
        'Ideal mit 5–7er Eisen – 10–15% weniger Distanz als normal',
      ],
    },
    {
      id: 'lib-iron-06',
      name: 'Distanz-Wedge-Kontrolle',
      description: 'Übe mit Pitching Wedge, Gap Wedge und Sand Wedge je 10 Schläge mit 50%, 75% und 100% Schwung. Das ergibt 9 Distanzen. Messe die Landepunkte. Ziel: alle 9 Distanzen exakt reproduzieren. Tour-Spieler kennen ihre Wedge-Distanzen auf den Meter genau.',
      duration: 35,
      category: 'IRON_PLAY',
      difficulty: 'MEDIUM',
      tips: [
        'Nutze eine App oder Rangefinder zum Messen',
        'Schreibe alle 9 Distanzen auf und lerne sie auswendig',
        'Bedingungen notieren: Wind, Temperatur, Höhenlage',
        'Konsistenz wichtiger als Maximaldistanz',
      ],
    },
    {
      id: 'lib-iron-07',
      name: 'Low-Point-Kontrolle',
      description: 'Klebe ein Klebeband auf die Mattenbahn (oder streue Kreide auf Gras). Schlage 20 Schläge und markiere, wo der Schläger den Boden trifft. Die Markierung sollte konsequent 3–5 cm vor dem Ball entstehen. Trainiert den Low Point des Schwungs – zentrales Element konsistenten Eisenspiels.',
      duration: 25,
      category: 'IRON_PLAY',
      difficulty: 'MEDIUM',
      tips: [
        'Low Point zu weit hinten = Fat-Schläge',
        'Kein Bodenkontakt = Thin-Schläge oder Toppen',
        'Gewicht beim Impact ca. 80% auf dem linken Fuß',
        'Hips drehen durch den Impact – nicht "sitzen bleiben"',
      ],
    },
    {
      id: 'lib-iron-08',
      name: 'Ballposition-Experiment',
      description: 'Schlage dasselbe Eisen (7er) von 5 verschiedenen Ballpositionen: weit rechts, mittig-rechts, Mitte, mittig-links, weit links. Beobachte, wie sich Flugbahn, Höhe und Richtung verändern. Vertieft das Verständnis über den Einfluss der Ballposition auf den Schuss.',
      duration: 25,
      category: 'IRON_PLAY',
      difficulty: 'MEDIUM',
      tips: [
        'Weit rechts: niedriger Flug, mehr Backspin, weniger Distanz',
        'Mitte: Standard-Kontrolle, gutes Gleichgewicht',
        'Weit links: höherer Flug, Draw-Tendenz, mehr Distanz',
        'Notiere "ideale" Position für jeden Schläger',
      ],
    },

    // ── DRIVING ───────────────────────────────────────────────────────
    {
      id: 'lib-drive-01',
      name: 'Tee-Höhen-Experiment',
      description: 'Schlage 10 Bälle mit niedrigem Tee (1 cm), 10 mit mittlerem Tee (2,5 cm) und 10 mit hohem Tee (4 cm). Vergleiche Flugbahn, Spin, Distanz und Richtung. Viele Golfer haben ein nicht-optimales Tee für ihren Schwung. Die ideale Tee-Höhe zeigt den unteren Rand des Drivers auf Ballmitte.',
      duration: 30,
      category: 'DRIVING',
      difficulty: 'EASY',
      tips: [
        'Hohes Tee begünstigt Aufwärts-Impact (positiver Anstellwinkel)',
        'Niedriges Tee erhöht Spin und Kontrolle, verringert Distanz',
        'Notiere maximale Carry-Distanz je Tee-Höhe',
        'Ideale Tee-Höhe: Mitte des Balls auf Höhe der Schläger-Oberkante',
      ],
    },
    {
      id: 'lib-drive-02',
      name: '3-1-Tempo-Drill',
      description: 'Schwingt mit einem 3:1 Verhältnis von Rückschwung zu Durchschwung. Wenn der Rückschwung 3 Sekunden dauert, soll der Durchschwung 1 Sekunde dauern. Schlage 20 Bälle mit diesem bewusst langsamen Tempo. Tempo ist der häufigste Fehler beim Driver – zu schnell = Kontrollverlust.',
      duration: 20,
      category: 'DRIVING',
      difficulty: 'EASY',
      tips: [
        'Laut zählen: "Eins, Zwei, Drei – Schlag"',
        'Der langsame Rückschwung erzeugt automatisch mehr Coiling',
        'Übertreibe das Tempo zunächst ins Extreme',
        'Auf dem Platz: Denke "langsam hinten, schnell nach vorn"',
      ],
    },
    {
      id: 'lib-drive-03',
      name: 'Draw/Fade-Training',
      description: 'Schlage abwechselnd je 5 Bälle als gezielten Draw (leichte Rechtskurve für Linkshänder) und 5 als Fade. Dazwischen je 5 gerade Schläge. Trainiert die bewusste Kontrolle über die Schlagform – entscheidend für das Umgehen von Hindernissen.',
      duration: 30,
      category: 'DRIVING',
      difficulty: 'HARD',
      tips: [
        'Draw: Clubface bei Adress leicht geschlossen, Stance nach rechts zeigen',
        'Fade: Clubface leicht offen, Stance nach links offen',
        'Schwung immer entlang der Stance-Linie',
        'Clubface-Richtung beim Impact bestimmt Startrichtung des Balls',
      ],
    },
    {
      id: 'lib-drive-04',
      name: 'Schritt-Drill (Step Drill)',
      description: 'Stelle die Füße eng zusammen (Absätze berühren sich) und schlage mit Driver. Der enge Stand erzwingt eine korrekte Gewichtsverlagerung – ohne diese verlierst du das Gleichgewicht. Besonders wirkungsvoll für Spieler, die "über dem Ball sitzen" und zu wenig Körperrotation haben.',
      duration: 20,
      category: 'DRIVING',
      difficulty: 'MEDIUM',
      tips: [
        'Starte mit 60% Kraft – Gleichgewicht zuerst',
        'Fühle, wie das Gewicht in den Rückschwung und wieder nach vorn verlagert',
        'Füße zusammen eliminiert laterale Bewegung',
        'Übertrage das Körper-Gefühl auf normalen breiten Stand',
      ],
    },
    {
      id: 'lib-drive-05',
      name: 'Split-Hand-Drill',
      description: 'Greife den Driver mit 20 cm Abstand zwischen den Händen (Hand-Splitting). Schlage 10 Bälle mit dieser Griffposition. Der Abstand macht es unmöglich, mit den Händen den Schläger zu steuern – die Rotation des Körpers muss die Arbeit übernehmen.',
      duration: 20,
      category: 'DRIVING',
      difficulty: 'MEDIUM',
      tips: [
        'Obere Hand oben, untere Hand 20 cm tiefer',
        'Keine Kraft in den Händen – Körper schwingt durch',
        'Gefühl übertragen: normaler Griff mit Körper-Dominanz',
        'Ideal um "Over-the-Top" Bewegungen zu eliminieren',
      ],
    },
    {
      id: 'lib-drive-06',
      name: 'Treffpunkt-Training (Face Impact)',
      description: 'Klebe ein Blatt Papier oder nutze Impact-Spray auf dem Driverface. Schlage 10 Bälle und analysiere die Treffpunkte. Bälle vom Heel faden, vom Toe ziehen, vom Sweet Spot fliegen gerade. Optimaler Impact ist leicht oberhalb der Mitte des Faces.',
      duration: 20,
      category: 'DRIVING',
      difficulty: 'MEDIUM',
      tips: [
        'Impact-Spray ist am präzisesten – günstig im Golfshop',
        'Heel-Treffer: Stand zu nah am Ball, oder Over-the-Top',
        'Toe-Treffer: Stand zu weit, oder Arme ziehen sich ein',
        'Konstant gleiche Stelle = konstante Schlagweite',
      ],
    },
    {
      id: 'lib-drive-07',
      name: 'Engpass-Training',
      description: 'Stecke zwei Ausrichtstäbe oder Schirmständer in den Boden, sodass ein 5 m breites "Fairway-Tor" entsteht. Abstand: 30–40 m entfernt. Schlage 10 Bälle und zähle, wie viele das Tor passieren. Trainiert Kontrolle und simuliert reale Fairway-Breiten.',
      duration: 25,
      category: 'DRIVING',
      difficulty: 'MEDIUM',
      tips: [
        'Starte mit einem 10 m breiten Tor, enge es schrittweise',
        'Visualisierung: Stelle dir das Fairway deines Heimatplatzes vor',
        'Fehler-Analyse: Welche Seite wird öfter verfehlt?',
        'Konsistenz > Distanz – lieber 220 m im Fairway als 250 m im Rough',
      ],
    },
    {
      id: 'lib-drive-08',
      name: 'Choke-Down-Kontrolle',
      description: 'Greife den Driver 5–7 cm tiefer als normal (Choke Down). Schlage 15 Bälle. Du verlierst ca. 10–15 m Distanz, gewinnst aber erheblich an Kontrolle und Präzision. Ideal als Strategie auf engen Loch oder bei Stress.',
      duration: 20,
      category: 'DRIVING',
      difficulty: 'EASY',
      tips: [
        'Choke Down erzeugt effektiv kürzere Schläger = mehr Kontrolle',
        'Beim Putten oder kurzen Eisen genauso anwendbar',
        'Swing-Tempo kann etwas erhöht werden um Distanz zu kompensieren',
        'Auf Loch mit OB: Sicherheit schlägt Distanz immer',
      ],
    },

    // ── COURSE MANAGEMENT ─────────────────────────────────────────────
    {
      id: 'lib-mgmt-01',
      name: 'Distanz-Mapping',
      description: 'Gehe auf deinen Heimatplatz und messe systematisch Distanzen zu Checkpoints: Bunker-Vorderkante/-Hinterkante, Wasserhindernis, Grün-Vorder-/-Mitte-/-Hinterkante, gefährliche Bereiche. Zeichne eigene Loch-Karten. Profigolfer kennen jeden Meter ihrer Plätze – das beginnt mit diesem Drill.',
      duration: 60,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'MEDIUM',
      tips: [
        'App wie Arccos, Garmin oder Shot Scope kann helfen',
        'Für jeden Abschlag: was ist die maximale sichere Distanz?',
        'Notiere Carry- und Roll-Distanzen getrennt',
        'Überprüfe Karte nach jeder Runde und ergänze sie',
      ],
    },
    {
      id: 'lib-mgmt-02',
      name: 'Wind-Kalkulation',
      description: 'Lerne die Faustregel: Bei Gegenwind 10% Distanz pro Windstärke addieren, bei Rückenwind 10% subtrahieren. Übe das auf dem Übungsplatz: bestimme vor jedem Schlag die Windrichtung und berechne die benötigte Distanzanpassung. Notiere die Ergebnisse.',
      duration: 30,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'MEDIUM',
      tips: [
        'Grashalme in die Luft werfen zeigt Windrichtung präzise',
        'Seitenwind lenkt Bälle mit Spin stärker ab',
        'Bei starkem Gegenwind: flacherer Schlag (Punch) reduziert Einfluss',
        'Links/Rechts Wind: Schlag-Startlinie entsprechend anpassen',
      ],
    },
    {
      id: 'lib-mgmt-03',
      name: 'Risikoanalyse-Training',
      description: 'Gehe mental 18 Löcher deines Heimatplatzes durch. Entscheide für jedes Loch: Was ist der "sichere Plan" und was ist der "aggressive Plan"? Wann lohnt sich welcher? Schreibe einen konkreten Spielplan auf. Strategisches Denken vor der Runde reduziert impulsive Entscheidungen im Spiel.',
      duration: 45,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'EASY',
      tips: [
        '"Risiko nur wenn Gewinn > Verlust" – sei objektiv',
        'Stärken nutzen: Chip besser als Sand? Weg vom Bunker spielen',
        'Plane für schlechte Schläge: Was ist der beste Ausweg?',
        'Faustregel: Bogey ist oft besser als Risiko-Double',
      ],
    },
    {
      id: 'lib-mgmt-04',
      name: 'Zwischenziel-Aiming',
      description: 'Übe, ein Zwischenziel 1–2 m vor dem Ball auf der Ziellinie auszumachen (Grasfleck, Divot) und den Schläger darauf auszurichten, statt auf die weit entfernte Fahne. Dieses Verfahren wird von über 90% der Tour-Spieler genutzt und ist deutlich präziser als langes Anvisieren.',
      duration: 20,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'EASY',
      tips: [
        'Zwischenziel hinter dem Ball wählen (von hinten stehend)',
        'Zuerst Schläger auf Zwischenziel ausrichten, dann Stance aufbauen',
        'Zwischenziel NICHT ändern nach Stance-Einnahme',
        'Funktioniert für alle Schläger, auch beim Putten',
      ],
    },
    {
      id: 'lib-mgmt-05',
      name: 'Pre-Shot-Routine aufbauen',
      description: 'Entwickle eine feste Pre-Shot-Routine in 3–5 Schritten: 1) Analyse (Distanz, Wind, Lage), 2) Visualisierung (Ball-Flugbahn), 3) Probeschwung, 4) Ausrichten, 5) Schlagen. Übe die Routine auf dem Übungsplatz mit Stopper – sie soll 20–30 Sekunden dauern und immer gleich sein.',
      duration: 30,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'EASY',
      tips: [
        'Routine darf nicht länger als 30 Sekunden sein',
        'Jeder Schritt hat eine Aufgabe – kein Nachdenken nach Einleitung',
        'Routine ist der Übergang von Analyse zu Vertrauen',
        'Tour-Spieler: Routine bricht nie – auch bei schlechten Schlägen',
      ],
    },
    {
      id: 'lib-mgmt-06',
      name: 'Schlägerwahl-Übung',
      description: 'Übe auf dem Übungsgrün: Für 10 verschiedene Chip-Lagen um das Grün (unterschiedliche Abstände, Hindernisse, Hanglagen) wähle den "richtigen" Schläger anhand der Faustregel "so wenig Loft wie möglich". Dokumentiere deine Wahl und das Ergebnis.',
      duration: 30,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'MEDIUM',
      tips: [
        'Frei bahn ohne Hindernis + fester Boden: 7–8er, viel Roll',
        'Bunker oder Hanglage im Weg: mehr Loft notwendig',
        'Weiches Grün: mehr Loft, Ball stoppt schnell',
        'Vertraue deiner Stärken: nimm den Schläger, mit dem du sicher bist',
      ],
    },

    // ── MENTAL GAME ───────────────────────────────────────────────────
    {
      id: 'lib-mental-01',
      name: 'Visualisierungs-Training',
      description: 'Stehe vor jedem Übungs-Schlag für 10 Sekunden still und visualisiere den Schlag exakt: Flugbahn, Kurve, Landepunkt, Roll. Schließe dabei die Augen. Schlage erst, wenn das Bild klar ist. Visualisierung aktiviert dasselbe neuronale Netzwerk wie das echte Schlagen – Tour-Spieler nutzen sie als Standard.',
      duration: 20,
      category: 'MENTAL_GAME',
      difficulty: 'EASY',
      tips: [
        'Bild so konkret wie möglich: Farbe des Balls, Geräusche, Gefühl',
        'Nicht das Schwingen visualisieren – die Flugbahn des Balls',
        'Negative Bilder (Bunker, Wasser) sofort durch Positives ersetzen',
        'Mit der Zeit: Visualisierung in 3–5 Sekunden abrufbar',
      ],
    },
    {
      id: 'lib-mental-02',
      name: 'Atemübung nach Fehler',
      description: 'Nach jedem schlechten Schlag übe folgende Reset-Routine: 1) Ärger kurz zulassen (max. 5 Sekunden), 2) Tief einatmen (4 Sek.), halten (2 Sek.), ausatmen (6 Sek.), 3) Einen positiven Gedanken über den nächsten Schlag, 4) Schritt nach vorne = mentaler Neustart. Trainiert Resilienz im Spiel.',
      duration: 15,
      category: 'MENTAL_GAME',
      difficulty: 'EASY',
      tips: [
        'Ärger unterdrücken funktioniert nicht – kurz rauslassen ist gesünder',
        'Atempause ist physiologisch wirksam: senkt Herzrate messbar',
        'Physischer "Reset-Schritt" verankert den mentalen Neustart',
        'Nach 3 schlechten Löchern: Runde neu beginnen ab jetzt',
      ],
    },
    {
      id: 'lib-mental-03',
      name: 'Prozess-Fokus-Training',
      description: 'Spiele 9 Löcher mit dem einzigen Ziel, deinen Prozess (Routine, Visualisierung, Ausrichtung) perfekt auszuführen – egal welches Ergebnis. Schreibe nach jedem Loch: "Prozess eingehalten? Ja/Nein". Ignoriere Score bewusst. Trainiert Ergebnis-Loslassen und Fokus auf Kontrollierbares.',
      duration: 120,
      category: 'MENTAL_GAME',
      difficulty: 'MEDIUM',
      tips: [
        'Bewerte nur deinen Prozess, nie das Ergebnis',
        'Guter Prozess bei schlechtem Ergebnis = Erfolg',
        '"Score-blindes" Golfen reduziert Druck enorm',
        'Daten zeigen: Prozess-Fokus verbessert langfristig den Score',
      ],
    },
    {
      id: 'lib-mental-04',
      name: 'Drucksimulation',
      description: 'Simuliere Druck beim Üben: Bestimme eine Aufgabe ("10 Putts aus 1,5 m, alle rein") und setze einen "Einsatz" (Putzen der Wagen, eine Runde Getränke). Das Wissen, dass ein Versagen Konsequenzen hat, aktiviert dieselben Mechanismen wie echte Wettbewerbs-Situationen.',
      duration: 20,
      category: 'MENTAL_GAME',
      difficulty: 'HARD',
      tips: [
        'Einsatz muss real und bedeutungsvoll sein – sonst kein Effekt',
        'Beobachte: Wie verändert sich deine Routine unter Druck?',
        'Training unter Druck > entspanntes Üben für Wettkampf-Vorbereitung',
        'Steigere Schwierigkeit und Einsatz schrittweise',
      ],
    },
    {
      id: 'lib-mental-05',
      name: 'Positive Selbstgespräche',
      description: 'Definiere 3 persönliche "Cue-Worte" für dein Spiel (z.B. "Smooth", "Trust", "Commit"). Schreibe sie auf eine Karte. Nutze je eines vor jedem Schlag als mentalen Anker. Trainiert die Kontrolle des inneren Dialogs – entscheidend für Konsistenz unter Druck.',
      duration: 15,
      category: 'MENTAL_GAME',
      difficulty: 'EASY',
      tips: [
        'Cue-Worte müssen für dich persönlich bedeutungsvoll sein',
        '"Smooth" für Tempo, "Trust" für Vertrauen, "See it" für Visualisierung',
        'Worte auf Scorekarte schreiben – sichtbare Erinnerung',
        'Negativ-Stopp: jedes "Nicht-..." durch positives Wort ersetzen',
      ],
    },
    {
      id: 'lib-mental-06',
      name: 'Einloch-Meisterschaft',
      description: 'Wähle ein schwieriges Loch auf deinem Platz. Spiele es alleine 3-mal hintereinander mit je einer Ball-Runde. Nach jeder Runde analysiere: Was lief gut? Was würdest du anders machen? Intensives Wiederholungsspiel auf einem Loch entwickelt tiefe Lochkenntnis und mentale Robustheit.',
      duration: 60,
      category: 'MENTAL_GAME',
      difficulty: 'MEDIUM',
      tips: [
        'Wähle ein Loch, das dir regelmäßig Probleme bereitet',
        'Führe Protokoll über Schläge, Entscheidungen und Gedanken',
        'Verändere Strategie im 2. und 3. Durchgang bewusst',
        'Frage: "Was wäre mein Plan mit einem Schlag Vorgabe?"',
      ],
    },
    {
      id: 'lib-mental-07',
      name: 'Routine-Stresstest',
      description: 'Gehe auf den Übungsplatz und übe unter selbst auferlegtem Zeitdruck: Du hast 20 Sekunden pro Schlag (Stoppuhr). Lege Schlägerauswahl, Ausrichten und Schlag in dieses Fenster. Trainiert das Abrufen einer effizienten Routine unter simuliertem Druck wie beim Turnier.',
      duration: 25,
      category: 'MENTAL_GAME',
      difficulty: 'MEDIUM',
      tips: [
        'Uhr sichtbar aufstellen oder Wecker nutzen',
        'Routine priorisieren: Ausrichtung > Probeschwung > Schlag',
        'Zeitdruck deckt auf, welche Routine-Teile wirklich wichtig sind',
        'Ziel: Routine unabhängig von verfügbarer Zeit gleich gut ausführen',
      ],
    },
  ];

  for (const drill of libraryDrills) {
    await prisma.trainingDrill.upsert({
      where: { id: drill.id },
      update: {
        name: drill.name,
        description: drill.description,
        duration: drill.duration,
        category: drill.category,
        difficulty: drill.difficulty,
        tips: drill.tips,
        isLibrary: true,
      },
      create: {
        id: drill.id,
        name: drill.name,
        description: drill.description,
        duration: drill.duration,
        category: drill.category,
        difficulty: drill.difficulty,
        tips: drill.tips,
        isLibrary: true,
      },
    });
  }

  console.log(`Seeded ${libraryDrills.length} library drills.`);

  // ── Heimübungen (Home Drills) ──────────────────────────────────────
  const homeDrills: {
    id: string; name: string; description: string; duration: number;
    category: TrainingCategory; difficulty: TrainingDifficulty; tips: string[];
  }[] = [
    // ── PUTTING ──
    {
      id: 'home-putt-01',
      name: 'Lineal-Putt (Teppich)',
      description: 'Lege ein 30 cm langes Lineal auf den Teppich. Putte mit deinem Putter so, dass der Schläger das Lineal die gesamte Durchschwungphase lang berührt. Wiederhole 20 Mal.',
      duration: 10,
      category: TrainingCategory.PUTTING,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Der Putter-Kopf sollte das Lineal sauber abstreifen', 'Schultern rauf und runter — keine Hüftrotation', 'Pace: langsam zurück, gleich schnell durch'],
    },
    {
      id: 'home-putt-02',
      name: 'Gate-Drill (Tees als Tor)',
      description: 'Stecke zwei Tees etwas breiter als dein Putter-Kopf in einen Putting-Teppich oder Teppich. Putte durch das Tor ohne die Tees zu berühren. 15 Wiederholungen aus 1 Meter.',
      duration: 10,
      category: TrainingCategory.PUTTING,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Engere das Tor schrittweise, je besser du wirst', 'Augen über dem Ball — nicht dem Tor hinterherblicken', 'Richtungsgebend: die Schulterachse'],
    },
    {
      id: 'home-putt-03',
      name: 'Kreis-Putting (Putting-Matte)',
      description: 'Lege 6 Bälle im Kreis um das Loch deiner Putting-Matte, je 1 Meter Abstand. Versuche, alle 6 nacheinander einzulochen. Wenn du einen verpasst, beginne von vorne.',
      duration: 15,
      category: TrainingCategory.PUTTING,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Denke nicht daran, die Serie zu retten — jeden Putt einzeln spielen', 'Gleiche Routine für jeden Ball', 'Wenn du 3× in Folge alle 6 triffst, rücke auf 1,5 m vor'],
    },
    {
      id: 'home-putt-04',
      name: 'Blindfold-Putt (Gefühl für Distanz)',
      description: 'Putte auf deiner Matte mit geschlossenen Augen von 2 Metern. Versuche, den Ball so nah wie möglich ans Loch zu bringen, ohne hineinzusehen. Zähle den Rhythmus.',
      duration: 10,
      category: TrainingCategory.PUTTING,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Der Rhythmus ist wichtiger als das Ergebnis', 'Zähle "Eins-zwei" im Taktt zurück und durch', 'Öffne die Augen erst nach dem Schlag'],
    },
    {
      id: 'home-putt-05',
      name: 'Pennymünzen-Drill (Treffpräzision)',
      description: 'Lege eine Münze auf den Teppich. Versuche, den Putter immer exakt auf die Mitte der Münze zu treffen. 20 Wiederholungen. Trainiert die Präzision des Sweet-Spot-Kontakts.',
      duration: 10,
      category: TrainingCategory.PUTTING,
      difficulty: TrainingDifficulty.HARD,
      tips: ['Achte auf das Geräusch — ein sauberer Treffer klingt anders', 'Fokus: nicht auf die Münze schauen während des Schlags', 'Hilfreich: etwas Klebeband auf dem Putter-Face markieren'],
    },
    // ── SHORT GAME ──
    {
      id: 'home-short-01',
      name: 'Handtuch-Chip-Drill',
      description: 'Klemme ein gefaltetes Handtuch zwischen deine Oberarme und deinen Körper. Übe langsame Chip-Bewegungen ohne dass das Handtuch fällt. Trainiert die Körpersynchronisation.',
      duration: 10,
      category: TrainingCategory.SHORT_GAME,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Das Handtuch fällt, wenn du die Arme vom Körper trennst', 'Kleine Bewegung — der Körper dreht, die Arme bleiben nah', 'Kombiniere mit einer Chipping-Matte für echte Bälle'],
    },
    {
      id: 'home-short-02',
      name: 'Einhand-Chip-Drill',
      description: 'Chipse mit nur der führenden Hand (links bei Rechtshändern). Konzentriere dich darauf, den Schläger-Schaft zu stabilisieren. 15 Wiederholungen pro Hand.',
      duration: 12,
      category: TrainingCategory.SHORT_GAME,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Die Führungshand verhindert das Überdrehen des Handgelenks', 'Danach wechsle zur Hinterhand — spürst du den Unterschied?', 'Ziele auf ein Kissen oder ein Handtuch auf dem Boden'],
    },
    {
      id: 'home-short-03',
      name: 'Impact-Position Drill (Kissen)',
      description: 'Nimm deinen Wedge und übe die Impact-Position gegen ein festes Kissen oder einen Sandsack. Schiebe langsam durch den Impact, achte auf Vorwärtslage des Schafts und Gewicht auf dem Vorderfuß.',
      duration: 10,
      category: TrainingCategory.SHORT_GAME,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Schaft zeigt zur Hüfte — keine Löffelstellung', 'Gewicht 70/30 auf dem Vorderfuß bei Impact', 'Langsam üben, dann Geschwindigkeit steigern'],
    },
    {
      id: 'home-short-04',
      name: 'Flop-Simulation (Lobby-Technik)',
      description: 'Ohne Ball: Übe die Bewegung eines Flop-Shots im Spiegel. Besonders die offene Schlägerface-Stellung und die flache Eintreffbahn. 3 Sätze à 10 Wiederholungen.',
      duration: 10,
      category: TrainingCategory.SHORT_GAME,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Standfläche offen, Schlägerface ultra-offen', 'Schaukel den Körper — nicht die Arme dominieren lassen', 'Langsame Kontrolle beim Check des Spiegels'],
    },
    // ── IRON PLAY ──
    {
      id: 'home-iron-01',
      name: 'Spiegel-Drill (Schwungpositionen)',
      description: 'Stelle dich seitlich vor einen Spiegel. Übe deinen Schwung in 5 Stopppositionen: Adresse, P2 (Hüfthöhe), P4 (Oben), P6 (Hüfthöhe durch), P10 (Finish). Halte jede Position 3 Sekunden.',
      duration: 15,
      category: TrainingCategory.IRON_PLAY,
      difficulty: TrainingDifficulty.EASY,
      tips: ['P4 (Oben): linker Arm gestreckt, Schläger parallel zum Boden', 'P10 (Finish): Gewicht komplett auf dem Vorderfuß, Gürtelschnalle zum Ziel', 'Täglich 10 Minuten Spiegel-Arbeit = massiver Fortschritt'],
    },
    {
      id: 'home-iron-02',
      name: 'Slow-Motion Swing Drill',
      description: 'Führe deinen kompletten Schwung in 10% der normalen Geschwindigkeit aus. Konzentriere dich auf das Gefühl jeder Bewegungsphase. 20 Wiederholungen ohne Ball.',
      duration: 15,
      category: TrainingCategory.IRON_PLAY,
      difficulty: TrainingDifficulty.EASY,
      tips: ['So langsam, dass du jederzeit stoppen könntest', 'Achte auf Hüftrotation VOR der Armbewegung', 'Kombiniere mit Spiegel für maximales Feedback'],
    },
    {
      id: 'home-iron-03',
      name: 'Alignment-Stick Schwungbahn',
      description: 'Lege einen Alignment-Stick auf den Boden entlang der Zielline. Übe Schwünge so, dass du das Gefühl entwickelst, entlang dieser Linie zu schwingen. 20 Übungsschwünge.',
      duration: 12,
      category: TrainingCategory.IRON_PLAY,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Ein zweiter Stick parallel für die Fußstellung', 'Inside-Out Schwung: schlag unter dem Ziellinien-Stick hindurch', 'Outside-In korrigieren: lerne, den Stick zu greifen statt zu überqueren'],
    },
    {
      id: 'home-iron-04',
      name: 'Rumpfrotations-Drill (Körper isolieren)',
      description: 'Halte einen Schläger waagerecht vor deinen Körper auf Schulterhöhe. Rotiere Ober- und Unterkörper getrennt, Hüften 45° zurück, Schultern 90°. Dann spiegelverkehrt zum Finish.',
      duration: 10,
      category: TrainingCategory.IRON_PLAY,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Hüfte führt immer die Downswing-Bewegung', 'Knie bleiben stabil — nicht mitdrehen', 'Ziel: Trennungswinkel (X-Factor) zwischen Hüfte und Schultern spüren'],
    },
    {
      id: 'home-iron-05',
      name: 'Waggle-Entspannungs-Drill',
      description: 'Übe das Waggle (Hin- und Herbewegen des Schlägers vor dem Schlag) 10 Minuten lang. Ziel: Griffdruck locker halten, Handgelenke weich, Schultern entspannt.',
      duration: 10,
      category: TrainingCategory.IRON_PLAY,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Waggle ist Profi-Werkzeug — nicht optional', 'Wenn die Hände zittern, ist der Druck zu hoch', 'Gedanklich schon zum Ziel schauen während des Waggle'],
    },
    // ── DRIVING ──
    {
      id: 'home-drive-01',
      name: 'Tempo-Training 3:1 Rhythmus',
      description: 'Zähle beim Schwung "ein-und-zwei-UND" — drei Zählzeiten für den Backswing, eine für den Downswing. Übe 20 Schwünge ohne Ball vor dem Spiegel oder im Garten.',
      duration: 15,
      category: TrainingCategory.DRIVING,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Tour-Pros haben exakt 3:1 Rhythmus (John Novosel)', 'Kein Ball nötig — Rhythmus ist alles', 'Beim Downswing: Beschleunigung, nicht Kraft'],
    },
    {
      id: 'home-drive-02',
      name: 'Finish-Pose halten (Balance-Drill)',
      description: 'Schwinge durch und halte die Finish-Position 5 Sekunden lang. Wenn du das Gleichgewicht verlierst, war der Schwung unkontrolliert. 20 Wiederholungen.',
      duration: 10,
      category: TrainingCategory.DRIVING,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Ziel-Finish: gesamtes Gewicht auf dem Vorderfuß', 'Gürtelschnalle zeigt zum Ziel', 'Hinteres Knie berührt fast das vordere'],
    },
    {
      id: 'home-drive-03',
      name: 'Shirt-Zip Drill (Körpersynchronisation)',
      description: 'Stecke die hinteren 2/3 deines Griffendes des Schlägers unter den Arm. Mache Schwungbewegungen — wenn der Schläger rausfällt, trennen sich Arme und Körper. 15 Wiederholungen.',
      duration: 12,
      category: TrainingCategory.DRIVING,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Ein-Stück-Bewegung: Arme, Schultern und Hüfte zusammen', 'Langsam starten bis das Gefühl verinnerlicht ist', 'Besonders wichtig für Spieler die "Arms only" schwingen'],
    },
    {
      id: 'home-drive-04',
      name: 'Griffdruck-Bewusstsein (Skala 1–10)',
      description: 'Halte deinen Schläger mit Druck 10 (so fest wie möglich) und mache einen Schwung. Dann mit Druck 1. Finde deinen optimalen Griffdruck (ca. 4–5). Übe 10 Schwünge pro Druckstufe.',
      duration: 10,
      category: TrainingCategory.DRIVING,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Zu fester Grip blockiert die Handgelenksfreisetzung', 'Sam Snead: "Halte den Schläger wie einen Vogel"', 'Optimaler Druck: sicher aber locker'],
    },
    // ── MENTAL GAME ──
    {
      id: 'home-mental-01',
      name: 'Vor-Runden Visualisierung',
      description: 'Setze dich ruhig hin, schließe die Augen und visualisiere deine 18 Löcher. Stelle dir jeden Abschlag, jeden Approach und jedes Grün bildlich vor. Inkl. deinem Gefühl bei einem gelungenen Schlag.',
      duration: 20,
      category: TrainingCategory.MENTAL_GAME,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Je detaillierter, desto besser', 'Zeige dir selbst gelungene Schläge — keine Fehler', 'Nutze alle Sinne: Geräusche, Gerüche, das Gewicht des Schlägers'],
    },
    {
      id: 'home-mental-02',
      name: 'Box Breathing (4-4-4-4)',
      description: 'Atme 4 Sekunden ein, halte 4 Sekunden, atme 4 Sekunden aus, halte 4 Sekunden. 5 Zyklen. Trainiert das Nervensystem und hilft unter Druck (z.B. vor wichtigen Putts).',
      duration: 5,
      category: TrainingCategory.MENTAL_GAME,
      difficulty: TrainingDifficulty.EASY,
      tips: ['US Navy SEALs nutzen diese Technik unter extremem Stress', 'Abends üben — dann vor Runde anwenden', 'Auch nach einem Fehler sofort einsetzen'],
    },
    {
      id: 'home-mental-03',
      name: 'Pre-Shot Routine entwickeln',
      description: 'Entwickle und übe deine persönliche Pre-Shot Routine zuhause ohne Ball. Definiere: 1. Standort hinter dem Ball, 2. Ziel ausrichten, 3. Waggle, 4. Start. Timing: max. 20 Sekunden.',
      duration: 15,
      category: TrainingCategory.MENTAL_GAME,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Jeder Tour-Pro hat exakt die gleiche Routine bei jedem Schlag', 'Kürzer ist besser — max. 20 Sekunden', 'Visualisiere den Schlag als Teil der Routine'],
    },
    {
      id: 'home-mental-04',
      name: 'Positives Self-Talk Training',
      description: 'Schreibe 10 positive Formulierungen für häufige Spielsituationen auf (z.B. "Ich putte sicher auf 1 Meter"). Lies diese laut vor und visualisiere den Erfolg. Täglich 5 Minuten.',
      duration: 10,
      category: TrainingCategory.MENTAL_GAME,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Formulierungen immer positiv und in der Gegenwart', '"Ich WERDE..." → "Ich PUTZE..." (Gegenwartsform)', 'Wiederholung programmiert das Unterbewusstsein'],
    },
    {
      id: 'home-mental-05',
      name: 'Prozess-Fokus Übung',
      description: 'Schreibe nach deiner letzten Runde auf: Was war dein Prozess bei jedem Schlag? Bewerte nicht das Ergebnis (Loch/Score), sondern die Qualität deines Prozesses (Routine, Entscheidung, Ausführung).',
      duration: 20,
      category: TrainingCategory.MENTAL_GAME,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Das Ergebnis kannst du nicht kontrollieren — den Prozess schon', 'Ziel: 9 von 10 Schlägen mit gutem Prozess', 'Journaling ist das Geheimnis der Tour-Pros'],
    },
    // ── COURSE MANAGEMENT ──
    {
      id: 'home-course-01',
      name: 'Distanz-Kalkulation üben',
      description: 'Nehme eine Scorekarte deines Stammplatzes. Berechne für jedes Loch: Welcher Schläger für Abschlag? Wo landest du? Welcher Schläger für den Approach? Erstelle einen Plan für alle 18 Löcher.',
      duration: 20,
      category: TrainingCategory.COURSE_MANAGEMENT,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Plane für deine durchschnittliche Distanz — nicht die Maximaldistanz', 'Wo sind die "No-Go-Zones"? Wasser, OB, schwieriger Bunker?', 'Ein schriftlicher Plan erhöht die Umsetzungsrate massiv'],
    },
    {
      id: 'home-course-02',
      name: 'Wind-Kalkulation Tabelle',
      description: 'Erstelle eine persönliche Windkalkulations-Tabelle: Bei 10 km/h Gegenwind → 5% mehr Distanz einplanen. Bei 20 km/h → 10%. Erstelle eine Tabelle für deine häufigsten Schläger.',
      duration: 15,
      category: TrainingCategory.COURSE_MANAGEMENT,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Gegenwind vertikal multiplizieren, Rückenwind nicht überschätzen', 'Seitenwind: Ziel in den Wind anpassen, nicht den Schwung', 'Pro 10 km/h Gegenwind ca. 1 Schläger mehr'],
    },
    {
      id: 'home-course-03',
      name: 'Regelkunde (30 Minuten)',
      description: 'Lese jeden Tag 3 Golfregeln aus dem offiziellen Regelwerk (Golf Rules 2024). Mache dir Notizen zu Situationen, die dir auf dem Platz schon begegnet sind. Wissen = Schläge sparen.',
      duration: 30,
      category: TrainingCategory.COURSE_MANAGEMENT,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Fokus auf Regeln 13-19: Situationen auf dem Grün', 'Unspielbar-Liegendes-Ball-Regel auswendig kennen', 'Jeder gespart Strafschlag durch Regelkenntnis ist ein echter Schlag'],
    },
    {
      id: 'home-course-04',
      name: 'Scorekarten-Analyse (eigene Runden)',
      description: 'Analysiere die letzten 3 Scorekarten. Markiere: Wo hast du Doppelbogeys? Gibt es ein Muster (bestimmte Löcher, bestimmte Situationen, bestimmte Schläger)? Erstelle einen Verbesserungsplan.',
      duration: 20,
      category: TrainingCategory.COURSE_MANAGEMENT,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['3 Doppelbogeys = 3 Schläge über Soll — oft vermeidbar', 'Muster findest du nur durch schriftliche Analyse', 'Plane: was machst du beim nächsten Mal anders?'],
    },
  ];

  for (const drill of homeDrills) {
    await prisma.trainingDrill.upsert({
      where: { id: drill.id },
      update: {
        name: drill.name,
        description: drill.description,
        duration: drill.duration,
        category: drill.category,
        difficulty: drill.difficulty,
        tips: drill.tips,
        isLibrary: true,
        canDoAtHome: true,
      },
      create: {
        id: drill.id,
        name: drill.name,
        description: drill.description,
        duration: drill.duration,
        category: drill.category,
        difficulty: drill.difficulty,
        tips: drill.tips,
        isLibrary: true,
        canDoAtHome: true,
      },
    });
  }

  console.log(`Seeded ${homeDrills.length} home drills.`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
