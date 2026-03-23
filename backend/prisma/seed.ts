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

    // ── PUTTING (weitere) ──────────────────────────────────────────────
    {
      id: 'lib-putt-11',
      name: 'Tempo-Kontrolle: Pendelmetronom',
      description: 'Schwinge den Putter wie ein Pendel mit exakt gleich langem Rück- und Durchschwung. Miss mit zwei Tees die Länge beider Seiten und mache sie identisch. 30 Putts von 3 m. Ungleichmäßiges Pendel ist eine der häufigsten Ursachen für Distanzfehler.',
      duration: 20,
      category: 'PUTTING',
      difficulty: 'EASY',
      tips: [
        'Rückschwung = Durchschwung, nicht kürzer!',
        'Kein Impuls beim Übergang – fließende Bewegung',
        'Gravitationsgesetz nutzen: kein aktiver Krafteinsatz nötig',
        'Auf kurzen Putts bewusst die Länge beider Seiten kontrollieren',
      ],
    },
    {
      id: 'lib-putt-12',
      name: 'Handhaltungs-Drill (Reverse Overlap)',
      description: 'Übe bewusst den Reverse-Overlap-Griff (linker Zeigefinger liegt über rechter Hand). Putte 20 Bälle aus 2 m und achte darauf, dass der Griff während des ganzen Schlags konstant bleibt. Ein instabiler Griff ist ein häufig übersehener Präzisionskiller.',
      duration: 15,
      category: 'PUTTING',
      difficulty: 'EASY',
      tips: [
        'Griff fest genug, dass er sich nicht dreht – aber nicht verkrampft',
        'Handgelenke bleiben passiv, Schultern führen die Bewegung',
        'Beide Daumen zeigen gerade auf den Schaft',
        'Vergleiche mit deiner normalen Griffhaltung',
      ],
    },
    {
      id: 'lib-putt-13',
      name: 'Hangputt-Mastery (Aufstieg und Abstieg)',
      description: 'Suche drei Putts auf verschiedenen Hängen: bergauf, bergab und seitlich brechend. Schlage je 5 Bälle von jeder Position aus 4 m. Dokumentiere: Wo läuft der Ball zu weit? Wo bleibt er kurz? Hänge erfordern grundlegend andere Kraftdosierung.',
      duration: 25,
      category: 'PUTTING',
      difficulty: 'MEDIUM',
      tips: [
        'Bergauf: mehr Kraft nötig, Linie ändert sich kaum',
        'Bergab: deutlich weniger Kraft, Linie bricht stark',
        'Seitlicher Hang: Eintrittspunkt viel höher als das Loch anvisieren',
        'Niemals kurz auf Bergab-Putts – rollt weit über das Loch',
      ],
    },
    {
      id: 'lib-putt-14',
      name: '3-Putt-Eliminierungs-Drill',
      description: 'Putte von 8 m mit dem Ziel, den Ball in einem 60-cm-Kreis um das Loch zu stoppen (kein Einlochen nötig). Wiederhole 15 Mal und zähle, wie oft du den Kreis triffst. Dieser Drill adressiert das häufigste Score-Killer-Problem: der 3-Putt.',
      duration: 20,
      category: 'PUTTING',
      difficulty: 'MEDIUM',
      tips: [
        'Ziel ist das Ankergebiet, nicht das Loch',
        '60 cm Kreis mit Tees markieren',
        'Fokus auf Distanz, nicht auf Richtung',
        'Wenn Distanz stimmt, liegt die Richtung meist auch richtig',
      ],
    },
    {
      id: 'lib-putt-15',
      name: 'Stochastic-Putting-Drill',
      description: 'Putte von 10 verschiedenen Positionen rund ums Loch (verschiedene Distanzen 1–5 m, verschiedene Winkel). Kein Putt von derselben Position zweimal. Zähle Made/Missed. Simuliert den echten Wechsel zwischen Variablen auf dem Platz – Greens-Lesen muss neu bei jedem Putt.',
      duration: 30,
      category: 'PUTTING',
      difficulty: 'HARD',
      tips: [
        'Lies jede Linie frisch – keine Routine aus vorherigem Putt übernehmen',
        'Vor jedem Putt 5 Sekunden für die Analyse',
        'Zähle made/missed separat nach Distanz',
        'Merke: Kurze Putts verfehlen = Linien-Problem, lange = Distanz-Problem',
      ],
    },
    {
      id: 'lib-putt-16',
      name: 'Speed-Kontrolle: Rampendrill',
      description: 'Lege einen Putter flach auf den Boden als Rampe. Rolle Bälle mit der Hand unterschiedlich stark. Beobachte, wie viel Kraft du für verschiedene Distanzen benötigst. Überträgt dieses kinästhetische Gefühl dann auf deinen Putter-Schwung.',
      duration: 15,
      category: 'PUTTING',
      difficulty: 'EASY',
      tips: [
        'Gefühl aus dem Handgelenk auf den Schulterpendel übertragen',
        'Ruhige Augen während der Schwungbewegung',
        'Distanzen mit Tees markieren zum Vergleich',
        'Ideale Ergänzung zu Tempo-Drills',
      ],
    },
    {
      id: 'lib-putt-17',
      name: 'Wedge-als-Leitschiene-Drill',
      description: 'Lege ein Wedge parallel zur Ziellinie auf den Boden, 2 cm rechts des Balls. Führe den Putter so, dass er beim Rückschwung und Durchschwung das Wedge nicht berührt. Trainiert eine gerade oder leicht bogenförmige Putterbahn.',
      duration: 15,
      category: 'PUTTING',
      difficulty: 'MEDIUM',
      tips: [
        'Wenn du das Wedge berührst, verlässt die Bahn die gewünschte Linie',
        'Innen-nach-Innen Bahn ist korrekt für ein Pendel',
        'Putter-Kopf folgt einem leichten Bogen, kein perfektes Gerade',
        'Schulterhöhe und -achse kontrollieren',
      ],
    },
    {
      id: 'lib-putt-18',
      name: 'Footprint-Putt-Drill',
      description: 'Suche eine Stelle auf dem Grün, wo ein frischer Fußabdruck leicht in den Rasen gedrückt ist. Lege den Ball hinein und putte. Der unebene Untergrund simuliert schwierige Liegeverhältnisse und trainiert den Umgang mit Unregelmäßigkeiten.',
      duration: 15,
      category: 'PUTTING',
      difficulty: 'HARD',
      tips: [
        'Etwas mehr Kraft nötig – der Abdruck bremst den Ball',
        'Ball liegt leicht tiefer = mehr Widerstand beim Abgehen',
        'Mentale Einstellung: akzeptiere, dass nicht jede Lage perfekt ist',
        'Auf Wettkampf-Greens häufiger als man denkt',
      ],
    },
    {
      id: 'lib-putt-19',
      name: 'Doppel-Ball-Drill (Ausrichtungs-Check)',
      description: 'Lege zwei Bälle direkt nebeneinander (berühren sich). Putte beide gleichzeitig. Treffen beide das Loch (oder verfehlen symmetrisch), ist deine Bahn gerade. Weichen sie auseinander, ist die Bahn schief oder der Impact ungleichmäßig.',
      duration: 15,
      category: 'PUTTING',
      difficulty: 'MEDIUM',
      tips: [
        'Beide Bälle müssen gleich weit rollen',
        'Wenn der rechte Ball vorauseilt: Bahn geht nach innen',
        'Wenn der linke vorauseilt: Bahn geht nach außen',
        'Nur mit geraden Putts üben (keine Breaks)',
      ],
    },
    {
      id: 'lib-putt-20',
      name: 'Birdie-Zone-Training (1–2 m)',
      description: 'Markiere einen Kreis von 2 m Durchmesser um das Loch. Schlage Approach-Schläge von 50 m, 100 m und 150 m. Jeder Ball in der Birdie-Zone zählt als "Birdie-Chance". Verknüpft Approach-Training mit realistischen Putt-Distanzen.',
      duration: 30,
      category: 'PUTTING',
      difficulty: 'HARD',
      tips: [
        'Birdie-Zone-Treffer als echten Erfolg werten',
        'Kombinationsübung: Approach + Putt in einer Session',
        'Verfolge Prozentsatz der Birdie-Chancen über Wochen',
        'Ziel: 30–40% aller Approaches in die 2-m-Zone',
      ],
    },

    // ── SHORT GAME (weitere) ───────────────────────────────────────────
    {
      id: 'lib-short-11',
      name: 'Texas-Wedge vom Vorgrün',
      description: 'Übe den "Texas Wedge" – putten vom Vorgrün statt chippen. Von 5–8 m außerhalb des Grüns, bei kurzem, flachem Gras, putte mit dem Putter statt dem Wedge. Trainiert die Entscheidungsfindung: Wann ist putten besser als chippen?',
      duration: 20,
      category: 'SHORT_GAME',
      difficulty: 'EASY',
      tips: [
        'Flaches, kurzes Gras: Putten ist oft zuverlässiger als Chippen',
        'Mehr Kraft nötig als auf dem Grün – Gras bremst den Ball',
        'Hindernisse zwischen Ball und Grün? Dann muss Chip her',
        'Bei Gegenwind: Putter schlägt flatter Ball, weniger Windeinfluss',
      ],
    },
    {
      id: 'lib-short-12',
      name: 'Pitch-Distanz-Leiter (10-20-30 m)',
      description: 'Pitche je 5 Bälle auf 3 verschiedene Zielzonen: 10 m, 20 m, 30 m. Markiere Zonen mit Tees. Wechsle nach jedem Schlag die Distanz (nicht alle 5 auf dieselbe Distanz). Trainiert das schnelle Anpassen der Distanzkontrolle.',
      duration: 25,
      category: 'SHORT_GAME',
      difficulty: 'MEDIUM',
      tips: [
        'Schwunggröße ändert sich – Tempo bleibt gleich',
        'Abwechseln erzwingt mehr Konzentration als Blocküben',
        'Merke: Schwung auf 9 Uhr = ca. halbe Distanz eines vollen Schwungs',
        'Landepunkt visualisieren, bevor du schlägst',
      ],
    },
    {
      id: 'lib-short-13',
      name: 'Bunker-Rake-Line-Drill',
      description: 'Ziehe eine gerade Linie in den Sand (mit Bunker-Rechen). Schlage Bunker-Schläge, bei denen der Schläger die Linie exakt auf Höhe des gedachten Ballstandorts kreuzt. Trainiert konsistenten Entry-Point im Bunker – der häufigste Fehlerort.',
      duration: 20,
      category: 'SHORT_GAME',
      difficulty: 'EASY',
      tips: [
        'Linie = Entry-Point. Immer vor der Linie einschlagen',
        'Ohne Ball üben: nur den Sandeinschlag perfektionieren',
        'Dann Ball auf die Linie legen und scharfen Entry-Point halten',
        'Überprüfe nach jedem Schlag den Sandaushub-Punkt',
      ],
    },
    {
      id: 'lib-short-14',
      name: 'Ansteigendes-Grün-Chip (Uphill)',
      description: 'Übe Chips auf ein ansteigendes Grün (Uphill). Der Ball stoppt viel schneller als auf flachem Grün – weniger Roll als gewohnt. Schlage 15 Bälle von 10 m auf ein Uphill-Grün und lerne, die Rolle neu zu kalibrieren.',
      duration: 20,
      category: 'SHORT_GAME',
      difficulty: 'MEDIUM',
      tips: [
        'Mehr Loft verwenden, da der Ball durch den Hang abgebremst wird',
        'Landezone weiter vorn wählen als auf flachem Grün',
        'Bergauf-Putts sind einfacher – Chip zur Fahne anpeilen',
        'Downhill-Approach: Gegenteil – viel mehr Roll einplanen',
      ],
    },
    {
      id: 'lib-short-15',
      name: 'Schwieriger-Lie-Drill (Abfallende Lage)',
      description: 'Trainiere Chips aus abfallender Lage (Downhill Lie): Ball liegt tiefer als die Füße. Öffne die Schulterachse parallel zum Hang, nehme mehr Loft. Schlage 15 Bälle aus dieser Lage. Eine der technisch anspruchsvollsten Short-Game-Situationen.',
      duration: 25,
      category: 'SHORT_GAME',
      difficulty: 'HARD',
      tips: [
        'Schulterachse parallel zum Hang – nicht zur Horizontalen',
        'Ball weiter hinten in der Stance für stabileren Kontakt',
        'Schlag nach unten dem Hang folgen – nicht anheben',
        'Mehr Loft: Sand-Wedge statt 9er Eisen',
      ],
    },
    {
      id: 'lib-short-16',
      name: 'Tight-Lie-Chip (sehr kurzes Gras)',
      description: 'Übe Chips von einer extrem kurzen, harten Lage (Tight Lie). Ball liegt auf Nacktboden oder sehr kurzem Gras. Dieser Chip erfordert präzisen Ball-first Contact – der häufigste Fehler ist das Drunterschieben des Schlägers.',
      duration: 20,
      category: 'SHORT_GAME',
      difficulty: 'HARD',
      tips: [
        'Ball etwas weiter hinten in der Stance (mehr Kontrolle)',
        'Hände vor dem Ball beim Impact – kein Löffelstellen',
        'Keine Angst! Tight Lies erlauben sauberen Spin',
        'Sand-Wedge ist hier oft schlechter als ein 8er Eisen',
      ],
    },
    {
      id: 'lib-short-17',
      name: 'Kurzspiel-Wettbewerb (Solitär)',
      description: 'Spiele einen 9-Loch-Wettbewerb gegen dich selbst: Von 9 verschiedenen Lagen rund ums Grün (markiere Tee-Positionen), schlage Chip + Putt und zähle Schläge. Ziel: Unter 18 Schläge (Up & Down jedes Mal). Wettbewerb gegen sich selbst steigert Konzentration massiv.',
      duration: 45,
      category: 'SHORT_GAME',
      difficulty: 'MEDIUM',
      tips: [
        'Alle 9 Positionen mit Tees markieren für Wiederholbarkeit',
        'Jede Session messen – Verbesserung über Wochen sichtbar',
        'Wähle echte Positionen, keine einfachen Lagen',
        'Analysiere: Welche Lagen kosten die meisten Schläge?',
      ],
    },
    {
      id: 'lib-short-18',
      name: 'Scramble-Simulation',
      description: 'Spiele 9 Löcher im Scramble-Format: schlage immer 2 Bälle und nehme den schlechter liegenden. Trainiert Kurzspiel aus schwierigen Lagen, da der bessere Ball bewusst nicht genutzt wird. Zwingt zu Kreativität und technischer Flexibilität.',
      duration: 90,
      category: 'SHORT_GAME',
      difficulty: 'HARD',
      tips: [
        'Wähle bewusst die schwierigere Lage',
        'Trainiere "Bad Lie Recovery" – wichtige Tour-Fähigkeit',
        'Keine Verzögerung: aus jeder Lage sofort Lösung finden',
        'Auch im Bunker: schlimmere Bunker-Lage spielen',
      ],
    },
    {
      id: 'lib-short-19',
      name: 'Spin-Kontrolle-Drill (Wedge-Technik)',
      description: 'Schlage je 10 Bälle mit maximalem Spin (kurzer, steiler Schwung, Ball stoppt sofort) und 10 mit minimalem Spin (Bump & Run). Lerne, wann du welchen Spin brauchst. Spin-Kontrolle ist das Merkmal fortgeschrittener Kurzspiel-Technik.',
      duration: 25,
      category: 'SHORT_GAME',
      difficulty: 'HARD',
      tips: [
        'Maximaler Spin: groovigester Wedge, Ball sauber, steiler Winkel',
        'Minimaler Spin: Ball weit hinten, Hände vor, abgerollte Grooves',
        'Feuchtes Gras reduziert Spin erheblich – Planung anpassen',
        'Spin hängt auch vom Grün ab: weiches Grün = mehr Stopwirkung',
      ],
    },
    {
      id: 'lib-short-20',
      name: 'Yardage-Book-Chip (Präzisions-Chip)',
      description: 'Chippe mit absolutem Präzisions-Fokus: Bestimme vor jedem Schlag exakt Landepunkt, Schläger und erwarteten Roll. Vergleiche das Ergebnis mit der Prognose. Trainiert die Fähigkeit, Chips im Kopf zu berechnen – wie es Tour-Caddies tun.',
      duration: 30,
      category: 'SHORT_GAME',
      difficulty: 'MEDIUM',
      tips: [
        'Schreibe Prognose auf: "Lande bei Flagge − 3 m, Roll 2 m rechts"',
        'Vergleiche nach 10 Chips: Wie oft war die Prognose richtig?',
        'Fehler in der Prognose = Wissenslücke in Schläger-Verhalten',
        'Präzises Planen verbessert auch die Ausführung',
      ],
    },

    // ── IRON PLAY (weitere) ────────────────────────────────────────────
    {
      id: 'lib-iron-09',
      name: 'Impact-Bag-Drill',
      description: 'Schlage mit vollem Eisen-Schwung gegen einen gefüllten Impact-Bag (oder gefüllten Rucksack). Die Bag simuliert den Impact-Moment und zeigt, ob deine Hände beim Treff vor oder hinter dem Schläger-Kopf sind. Sofortiges Feedback ohne Ball.',
      duration: 15,
      category: 'IRON_PLAY',
      difficulty: 'EASY',
      tips: [
        'Hände vor dem Bag beim Impact = korrekte Shaft-Lean',
        'Wenn der Schläger-Kopf die Bag zuerst trifft: Frühzeitiges Release',
        'Bag nach vorne schieben – nicht schlagen',
        'Ideal zum Aufwärmen vor Übungseinheiten',
      ],
    },
    {
      id: 'lib-iron-10',
      name: 'Leiternspiel mit Langen Eisen (4–7 Eisen)',
      description: 'Schlage je 5 Bälle mit 4er, 5er, 6er und 7er Eisen auf dasselbe Ziel (150 m). Beobachte die Distanzlücken zwischen den Schlägern. Ideal: ca. 10–15 m zwischen jedem Schläger. Trainiert die Kalibrierung der Schläger-Distanzen.',
      duration: 30,
      category: 'IRON_PLAY',
      difficulty: 'MEDIUM',
      tips: [
        'Notiere Carry-Distanzen (ohne Roll)',
        'Wenn Lücken zu klein sind: Schwungtempo überprüfen',
        'Lücken zu groß: möglicherweise ein Schläger überbenutzt',
        'Ehrliche Durchschnittswerte – nicht die besten Schläge',
      ],
    },
    {
      id: 'lib-iron-11',
      name: 'Towel-Under-Arms-Drill',
      description: 'Klemme ein Handtuch unter beide Achseln. Schlage 20 Eisen-Schläge ohne dass das Handtuch fällt. Verhindert das Abkippen der Arme (Flying Elbow) und fördert eine synchrone Körper-Arm-Verbindung.',
      duration: 20,
      category: 'IRON_PLAY',
      difficulty: 'EASY',
      tips: [
        'Handtuch fällt = Arme lösen sich vom Körper (Connection-Problem)',
        'Starte mit Halbschwüngen bevor du Vollschwünge versuchst',
        'Körper und Arme als Einheit bewegen',
        'Klassischer Drill aus dem Ben-Hogan-Lehrsystem',
      ],
    },
    {
      id: 'lib-iron-12',
      name: 'Pause-at-the-Top-Drill',
      description: 'Pause am oberen Umkehrpunkt des Schwungs für genau 1 Sekunde. Dann erst der Durchschwung. 20 Bälle mit dieser Methode. Trainiert Rückschwung-Vervollständigung und verhindert das Hämmern mit den Armen beim Durchschwung.',
      duration: 20,
      category: 'IRON_PLAY',
      difficulty: 'MEDIUM',
      tips: [
        'Pause erzwingt ruhigen Übergangspunkt',
        'Fühle die Zugkraft des Schlägers am oberen Punkt',
        'Initiiere den Durchschwung mit der Hüfte, nicht den Händen',
        'Ben Hogan nutzte diese Methode in seinem Training',
      ],
    },
    {
      id: 'lib-iron-13',
      name: 'Zielband-Drill (Precision Targeting)',
      description: 'Befestige zwei Stangen 5 m vor dem Startpunkt als schmales Tor (2 m breit). Schlage mit 7er und 5er Eisen durch das Tor. Trainiert präzise Schlagbahn und schult das Bewusstsein für Schussform direkt nach dem Impact.',
      duration: 25,
      category: 'IRON_PLAY',
      difficulty: 'MEDIUM',
      tips: [
        'Richtung beim Start (direkt nach Impact) ist entscheidend',
        'Tor verhindert extreme Haken und Slices in der Startrichtung',
        'Tore enger stellen bei Fortschritt',
        'Videoaufnahme von hinten für besseres Feedback',
      ],
    },
    {
      id: 'lib-iron-14',
      name: 'Schläger-gegen-Schläger-Vergleich',
      description: 'Schlage mit 6er Eisen, dann sofort mit Hybrid (gleiche Distanz). Vergleiche: Welcher Schläger gibt dir mehr Kontrolle? Welcher mehr Distanz? Diese Erkenntnis hilft bei Bag-Optimierung und Schläger-Auswahl auf dem Platz.',
      duration: 25,
      category: 'IRON_PLAY',
      difficulty: 'MEDIUM',
      tips: [
        'Gleiche Schwungtechnik bei beiden Schlägern',
        'Notiere Distanz und Konsistenz (Streuungsbreite)',
        'Hybrid: höherer Abflugwinkel, mehr Roll',
        'Long Iron: flacher, mehr Kontrollgefühl für geübte Spieler',
      ],
    },
    {
      id: 'lib-iron-15',
      name: 'Feet-Together-Iron-Drill',
      description: 'Schlage mit geschlossenen Füßen (Absätze berühren sich) 20 Bälle mit 7er Eisen. Der enge Stand erzwingt Gleichgewicht und zeigt technische Schwächen. Spieler mit zu viel Seitwärtsbewegung verlieren sofort das Gleichgewicht.',
      duration: 20,
      category: 'IRON_PLAY',
      difficulty: 'MEDIUM',
      tips: [
        'Kein Gleichgewicht → zu viel laterale Gewichtsverlagerung',
        'Körperrotation erzwungen – Schiebe-Bewegung eliminiert',
        'Starte mit 50% Kraft, steigere langsam',
        'Klassischer Drill von Hank Haney und Butch Harmon',
      ],
    },
    {
      id: 'lib-iron-16',
      name: 'Approach-Präzision (Fahnenfarben)',
      description: 'Übe gezielt auf Fahnenpositionen: vorne links, vorne rechts, hinten links, hinten rechts, Mitte. Schlage je 5 Approaches auf jede der 5 Positionen. Tour-Spieler zielen immer auf eine spezifische Fahnenposition, nie auf "das Grün".',
      duration: 35,
      category: 'IRON_PLAY',
      difficulty: 'HARD',
      tips: [
        'Verschiedene Fahnenfarben = verschiedene Positionen (rot=vorne, gelb=hinten)',
        'Vom Wind ausgehend: aggressiv oder sicher spielen?',
        'Bunker und Wasser: auf die sichere Seite des Grüns zielen',
        'Profi-Regel: Birdie ist gut, Double ist katastrophal',
      ],
    },
    {
      id: 'lib-iron-17',
      name: 'Knock-Down-Schlag (Kontrollierter Niedrigball)',
      description: 'Trainiere den Knock-Down: Ball weit hinten in der Stance, Hände weit vor dem Ball, 80% Schwung, Follow-Through unter Schulterhöhe stoppen. Schlag fliegt niedrig und hat viel Backspin. Unverzichtbar bei starkem Wind.',
      duration: 20,
      category: 'IRON_PLAY',
      difficulty: 'HARD',
      tips: [
        'Follow-Through bei Hüfthöhe anhalten',
        'Schaft bleibt durch Impact nach vorn geneigt',
        'Ball verliert 1–2 Schläger Distanz – Einplanen',
        'Ideal mit 6–8er Eisen aus dem Fairway',
      ],
    },
    {
      id: 'lib-iron-18',
      name: 'Schläger-Auswahl-Kompass',
      description: 'Erstelle deinen persönlichen Distanz-Kompass: Schlage je 10 Bälle mit jedem Schläger (PW bis 4er Eisen) und miss die Carrier-Distanz. Trage alle Werte in eine Tabelle ein. Dieses "Kompass-Wissen" ist Grundlage jeder guten Schläger-Entscheidung.',
      duration: 60,
      category: 'IRON_PLAY',
      difficulty: 'EASY',
      tips: [
        'Ehrliche Durchschnittswerte, nicht die Bestleistungen',
        'Unter verschiedenen Bedingungen messen (warm/kalt)',
        'Trage Werte in dein Handy ein – immer dabei',
        'Einmal im Monat aktualisieren – Schwung verbessert sich',
      ],
    },

    // ── DRIVING (weitere) ──────────────────────────────────────────────
    {
      id: 'lib-drive-09',
      name: 'Power-Stacking-Drill',
      description: 'Übe die korrekte Gewichtsverlagerung: Im Rückschwung 80% Gewicht auf dem Hinterfuß (Stacking), im Durchschwung vollständige Verlagerung auf den Vorderfuß. Schlage 20 Driver-Bälle mit bewusst übertriebenem Gewichtsshift.',
      duration: 20,
      category: 'DRIVING',
      difficulty: 'MEDIUM',
      tips: [
        'Fühle das Gewicht auf der Innenseite des Hinterfußes (nicht der Außenseite)',
        'Im Durchschwung: komplettes Gewicht auf dem Vorderfuß',
        'Hintere Ferse hebt sich am Finish leicht an',
        'Keine Seitwärtsbewegung – Rotation, nicht Translation',
      ],
    },
    {
      id: 'lib-drive-10',
      name: 'Hip-Bump-Drill',
      description: 'Initiiere den Downswing mit einer bewussten seitlichen Hüft-Verschiebung (Hip Bump) in Richtung Ziel, bevor die Schultern sich drehen. 20 Bälle mit übertriebener Hüft-Initiierung. Korrigiert das häufige Problem des "Over-the-Top" Schwungs.',
      duration: 20,
      category: 'DRIVING',
      difficulty: 'MEDIUM',
      tips: [
        'Hüfte leitet den Downswing – Schultern folgen',
        '"Bump" = 5 cm seitliche Verschiebung, kein übertriebenes Gleiten',
        'Hinteres Knie treibt leicht in Richtung vorderes Knie',
        'Eliminiert Over-the-Top und erzeugt Draw-Tendenz',
      ],
    },
    {
      id: 'lib-drive-11',
      name: 'Upswing-Attack-Drill',
      description: 'Trainiere bewusst einen aufsteigenden Treff-Winkel beim Driver (+3 bis +5 Grad). Tee höher stecken als gewohnt und visualisiere, unter den Ball zu schlagen. 15 Bälle mit Fokus auf Aufwärts-Impact. Erhöht Carry-Distanz erheblich.',
      duration: 20,
      category: 'DRIVING',
      difficulty: 'HARD',
      tips: [
        'Ball weiter vorne in der Stance (linke Schulter)',
        'Kopf hinter dem Ball halten beim Impact',
        'Niedrigeres Ballflug-Spin durch Aufwärts-Impact',
        'Höheres Tee erzwingt automatisch Aufwärts-Treff',
      ],
    },
    {
      id: 'lib-drive-12',
      name: 'Swing-Speed-Training (Leichter Schläger)',
      description: 'Übe mit einem leichteren Schläger (Wedge, Stab oder Speed-Trainingsstab) und maximiere die Schwunggeschwindigkeit. 20 Schwünge mit maximalem Speed. Dann sofort 10 Driver-Schwünge. Die erhöhte neuromuskuläre Aktivierung verbessert die Driver-Geschwindigkeit.',
      duration: 20,
      category: 'DRIVING',
      difficulty: 'MEDIUM',
      tips: [
        'Maximaler Speed beim leichten Schläger erzeugt "Speed Transfer"',
        'Schwingen, nicht schlagen',
        'Whoosh-Geräusch maximieren',
        'Regelmäßiges Speed-Training steigert Distanz über Monate',
      ],
    },
    {
      id: 'lib-drive-13',
      name: 'Wide-Arc-Drill (Weiter Rückschwung-Bogen)',
      description: 'Übe, den Schläger beim Rückschwung so weit wie möglich vom Körper entfernt zu halten (weiter Bogen). Schlage 15 Bälle und achte darauf, dass der Schläger-Kopf einen großen Radius zieht. Weiter Bogen = mehr Clubhead Speed.',
      duration: 20,
      category: 'DRIVING',
      difficulty: 'MEDIUM',
      tips: [
        'Linker Arm gestreckt im Rückschwung (nicht eingeknickt)',
        'Schulterdrehung erzeugt den weiten Bogen',
        'Nicht die Arme anheben – Bogen durch Rotation',
        'Weiter Bogen erhöht Schwungradius → mehr Speed',
      ],
    },
    {
      id: 'lib-drive-14',
      name: 'Fairway-Finder-Drill',
      description: 'Markiere zwei Punkte 30 m vor dem Abschlag als simuliertes Fairway (ca. 20 m breit). Schlage 15 Driver-Bälle und zähle Treffer im Fairway. Verwende dann bewusst ein 3-Holz oder langer Hybrid (engeres Fairway). Trainiert Entscheidung zwischen Distanz und Kontrolle.',
      duration: 25,
      category: 'DRIVING',
      difficulty: 'MEDIUM',
      tips: [
        'Fairway-Trefferquote zählen (%) über Wochen messen',
        '3-Holz: oft 80% Fairway vs. Driver 60% – lohnt der Unterschied?',
        'Auf engen Löchern: Sicherheit schlägt Distanz immer',
        'Tee-Shot-Fehler sind der häufigste Doppel-Bogey-Auslöser',
      ],
    },
    {
      id: 'lib-drive-15',
      name: 'Cross-Wind-Control-Drill',
      description: 'Übe bei echtem Seitenwind gezielt: Links-Seitenwind → Schlag nach rechts vom Ziel beginnen lassen. Rechts-Wind → nach links. Lernen, den Wind zu spielen statt gegen ihn. 20 Schläge mit Windeinsatz als Lernfaktor.',
      duration: 20,
      category: 'DRIVING',
      difficulty: 'HARD',
      tips: [
        'Starte den Ball in den Wind, nicht mit dem Wind',
        'Der Wind bringt ihn zurück zur Ziellinie',
        'Gegen den Wind: flachere Schläger-Loft wählen',
        'Grashalmen in die Luft werfen – Windrichtung exakt bestimmen',
      ],
    },
    {
      id: 'lib-drive-16',
      name: 'Drei-Viertel-Driver-Drill',
      description: 'Schlage mit ¾-Schwung (Rückschwung bis zu 10-Uhr-Position) mit dem Driver. Erwartet: 85–90% der vollen Distanz bei deutlich mehr Kontrolle. 15 Bälle mit ¾-Schwung. Wertvoll auf engen Bahnen oder unter Druck.',
      duration: 20,
      category: 'DRIVING',
      difficulty: 'EASY',
      tips: [
        '10-Uhr-Position: Linker Arm parallel zum Boden (Rechtshänder)',
        'Körperrotation trotzdem vollständig ausführen',
        'Mehr Kontrolle durch kürzeren Hebel',
        'Ideale Notfallstrategie bei Drucksituationen auf dem Platz',
      ],
    },
    {
      id: 'lib-drive-17',
      name: 'Tee-Shot-Strategie-Drill',
      description: 'Analysiere 9 verschiedene Tee-Shot-Szenarien (Dogleg links, Dogleg rechts, enges Fairway, Wasser rechts, Bunker links usw.) und entscheide für jedes: Schläger, Startrichtung, Ballkurve. Dann schlage diese Szenarien. Kombiniert Strategie mit Ausführung.',
      duration: 45,
      category: 'DRIVING',
      difficulty: 'HARD',
      tips: [
        'Dogleg rechts: Draw (Ball dreht nach rechts) ist optimal',
        'Wasser rechts: Starte links, lass Ball nicht zu weit drehen',
        'Engste Stellen immer auf der sicheren Seite spielen',
        'Guter Plan eliminiert Druck beim Ausführen',
      ],
    },
    {
      id: 'lib-drive-18',
      name: 'Long-Drive-Technik-Drill',
      description: 'Trainiere gezielt Distanz: Maximaler Schulterdreh (90°+), weiter Bogen, verzögertes Release (Lag halten). 15 Bälle mit vollem Tempo. Miss die Carry-Distanz. Einmal pro Woche Distanztraining erhält und verbessert Schwunggeschwindigkeit.',
      duration: 25,
      category: 'DRIVING',
      difficulty: 'HARD',
      tips: [
        'Lag halten: Schläger-Winkel zwischen Armen so lange wie möglich halten',
        'Release erst nach Hüfthöhe – "Late Hit"',
        'Körper vor dem Schläger: Hüfte dreht weiter als Hände',
        '3–5 km/h mehr Schlägerkopfgeschwindigkeit = 10–15 m mehr Distanz',
      ],
    },

    // ── COURSE MANAGEMENT (weitere) ───────────────────────────────────
    {
      id: 'lib-mgmt-07',
      name: 'Bogey-Golf-Strategie',
      description: 'Entwickle eine "Bogey-Golf-Strategie": Für jedes Loch plane einen Weg, der sicher einen Bogey ergibt, ohne Risiko. Dann berechne: Was muss ich aufgeben, um ein Par oder Birdie zu versuchen? Tour-Spieler kalkulieren Risiko/Nutzen bei jedem Schlag.',
      duration: 30,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'EASY',
      tips: [
        'Bogey-Plan eliminiert Doubles und schlimmere Zahlen',
        'Aus dem Bunker: sicher raus ist wichtiger als nah an die Fahne',
        'Faustregel: 3 Bogeys < 1 Double + 2 Pars (Mathematik des Handicaps)',
        'Auf Loch 18: Score schützen, kein Risiko',
      ],
    },
    {
      id: 'lib-mgmt-08',
      name: 'Pin-Position-Analyse',
      description: 'Lerne, Fahnen-Positionen systematisch zu bewerten: Gefährlich (Bunker/Wasser hinter Fahne) → auf die sichere Seite spielen. Neutral → auf Fahne spielen. Einfach → aggressiv attackieren. Übe das für 18 Löcher deines Heimatplatzes.',
      duration: 30,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'MEDIUM',
      tips: [
        '"Fat of the Green" = sicherste Zone in Greenmitte',
        'Gefährliche Fahnen: 5 m kurz spielen ist oft besser',
        'Nutze die Greengröße: Anpassen nach Fahnenposition',
        'Frage: "Was ist das Schlimmste, das passieren kann?"',
      ],
    },
    {
      id: 'lib-mgmt-09',
      name: 'Recovery-Schlag-Training',
      description: 'Trainiere gezielt Recovery-Schläge: aus dem Rough (hoch raus), aus Bäumen (niedrig durch Lücken), aus abfallender Lage (Hang-Anpassung). Schlage je 10 Recovery-Schläge aus typischen "Trouble"-Lagen deines Heimatplatzes.',
      duration: 40,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'HARD',
      tips: [
        'Recovery zuerst: aus dem Trouble RAUS, dann zur Fahne',
        'Niemals aus dem Rough ein heroisches Eisen versuchen',
        'Bäume: Lücke suchen statt über die Bäume versuchen',
        'Sicherer Ausweg spart im Schnitt 0,5 Schläge pro Loch',
      ],
    },
    {
      id: 'lib-mgmt-10',
      name: 'Aufschlag-Zonen-Training',
      description: 'Teile das Fairway in 3 Zonen: Zone A (ideal, beste Approach-Distanz), Zone B (akzeptabel), Zone C (gefährlich). Trainiere auf dem Übungsplatz, Drives in Zone A zu spielen statt maximale Distanz zu suchen.',
      duration: 25,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'MEDIUM',
      tips: [
        'Zone A definiert sich durch verbleibende Approach-Distanz',
        'Von Zone A: voller Approach-Schläger → Birdie-Chance',
        'Von Zone C: Schwierige Lage → oft nur Bogey-Chance',
        'Tee-Shot-Qualität korreliert direkt mit Greens in Regulation (GIR)',
      ],
    },
    {
      id: 'lib-mgmt-11',
      name: 'Layup-Präzisions-Training',
      description: 'Übe gezielte Layups: Bestimme eine "perfekte Layup-Distanz" (z.B. 80 m vor dem Grün für volle Wedge-Distanz). Schlage dann Schläge, die genau diese Distanz erzeugen – weder weiter noch kürzer. Präzise Layups erzeugen planbare Up & Downs.',
      duration: 25,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'MEDIUM',
      tips: [
        'Halber Wedge-Schwung auf 80 m besser als voller 5er Eisen auf 90 m',
        'Deine "volle Wedge-Distanz" auswendig wissen',
        'Layup-Ziel: niemals zu weit! Bunker oder Rough bitte vermeiden',
        'Planung: Wie weit ist der Layup vor dem letzten Wasserhindernis?',
      ],
    },
    {
      id: 'lib-mgmt-12',
      name: 'Golfplatz-Memory-Training',
      description: 'Gehe jeden Abend 5 Minuten durch dein Heimat-Scorecard. Zeichne in Gedanken jeden Lochverlauf, merke dir Gefahren, beste Strategien, typische Windrichtungen. Mental vertrauter Platz = weniger Überraschungen = besseres Scoring.',
      duration: 30,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'EASY',
      tips: [
        'Notiere für jedes Loch: Abschlag-Ziel, Approach-Distanz, typische Gefahren',
        'Stärken der Routine: immer gleicher Platzplan',
        'Neue Plätze: 30 Minuten Studieren vor der Runde',
        'Ein bekannter Platz spart durchschnittlich 2–3 Schläge',
      ],
    },
    {
      id: 'lib-mgmt-13',
      name: 'Schlechtes-Wetter-Strategie',
      description: 'Entwickle einen Schlechtwetter-Plan: Bei Regen und Wind werden Schläger gewechselt (+1–2 Schläger), Spin-Schläge vermieden, Greens bremsen. Trainiere an einem windigen Tag gezielt mit angepasster Strategie.',
      duration: 30,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'MEDIUM',
      tips: [
        'Regen: Griffe trocken halten, mehr Loft wählen',
        'Kälte: Ball fliegt 5–10% kürzer unter 10°C',
        'Wind: Schläger nach oben oder unten anpassen',
        'Mentally: schlechtes Wetter trifft alle gleich – nur Planung scheidet',
      ],
    },
    {
      id: 'lib-mgmt-14',
      name: 'Statistik-Analyse-Session',
      description: 'Sammle 5 Scorekarten und analysiere Statistiken: GIR (Greens in Regulation), Fairways getroffen, Putts pro Runde, Up & Down %. Identifiziere den schwächsten Bereich. Hier liegt der größte Verbesserungs-Hebel.',
      duration: 45,
      category: 'COURSE_MANAGEMENT',
      difficulty: 'EASY',
      tips: [
        'GIR unter 30%? Eisenspiel ist das Problem',
        'Putts über 32/Runde? Putting trainieren',
        'Fairways unter 50%? Driver oder Strategie anpassen',
        'Apps wie Arccos oder 18Birdies automatisieren diese Analyse',
      ],
    },

    // ── MENTAL GAME (weitere) ──────────────────────────────────────────
    {
      id: 'lib-mental-08',
      name: 'Anger-Management-Routine',
      description: 'Übe nach absichtlich schlechten Schlägen (lass einen Ball ins Rough fallen) die "10-Sekunden-Regel": Ärger für genau 10 Sekunden erlauben, dann Atemübung, dann 100% Fokus auf den nächsten Schlag. Kontrolliertes Ärger-Management ist messbar leistungsfördernd.',
      duration: 20,
      category: 'MENTAL_GAME',
      difficulty: 'MEDIUM',
      tips: [
        '10 Sekunden: alles erlaubt (Frust, Schütteln, etc.)',
        'Danach: tiefes Einatmen = physischer Reset',
        'Der nächste Schlag IST der einzige Schlag, der zählt',
        'Profis haben Fehler – was sie unterscheidet ist die Erholung',
      ],
    },
    {
      id: 'lib-mental-09',
      name: 'Focus-Keyword-Training',
      description: 'Wähle 3 Focus-Keywords für verschiedene Spielsituationen: 1 für lange Schläge, 1 für Kurzspiel, 1 für Putts. Nutze diese Keywords als mentalen "Schalter" vor jedem Schlag. Keywords verankern den Fokus und unterbrechen negative Gedanken.',
      duration: 15,
      category: 'MENTAL_GAME',
      difficulty: 'EASY',
      tips: [
        'Beispiel: "Smooth" (Drive), "Crisp" (Chip), "Roll" (Putt)',
        'Keywords müssen persönlich bedeutsam sein',
        'Notiere auf Scorecard – sichtbare Erinnerung',
        '3 Wochen konsequent nutzen bis zum Automatismus',
      ],
    },
    {
      id: 'lib-mental-10',
      name: 'Bogey-Bounce-Back-Training',
      description: 'Übe mental den "Bounce Back": Nach einem Bogey (oder schlechten Schlag) bewusst das nächste Loch als Neustart visualisieren. Trainiere, ein Par oder Birdie direkt nach einem Fehler zu spielen. Die beste Reaktion auf Fehler ist Sofort-Erholung.',
      duration: 20,
      category: 'MENTAL_GAME',
      difficulty: 'MEDIUM',
      tips: [
        'Profi-Statistik: Bounce-Back-Rate (Par/Birdie nach Bogey) unterscheidet Niveau-Spieler',
        'Fehler ist Vergangenheit – nächster Schlag ist Zukunft',
        'Ritual: Schritt vorwärts = mentaler Neustart',
        'Tracke deinen persönlichen Bounce-Back-Prozentsatz',
      ],
    },
    {
      id: 'lib-mental-11',
      name: 'Wettkampf-Simulation: Skins-Spiel',
      description: 'Spiele ein Skins-Spiel gegen Freunde oder allein (jedes Loch hat einen kleinen Einsatz). Der Druck, jedes Loch zu gewinnen, simuliert Wettkampfbedingungen. Trainiert die Fähigkeit, unter Einsatz-Druck zu presformen.',
      duration: 120,
      category: 'MENTAL_GAME',
      difficulty: 'HARD',
      tips: [
        'Einsatz gering halten – es geht um den Druck, nicht das Geld',
        'Beobachte: Wann ändert sich deine Routine unter Druck?',
        'Analysiere nach der Runde: Wo bist du verkrampft?',
        'Skins erzeugen Hole-for-Hole-Fokus – kein Schludern',
      ],
    },
    {
      id: 'lib-mental-12',
      name: 'Non-Judgmental-Observation-Drill',
      description: 'Spiele 9 Löcher ohne jedes Urteil über deine Schläge ("gut" oder "schlecht"). Beobachte nur neutral: "Ball ging rechts", "Putt war 2 m zu lang". Trainiert emotionale Distanz und verhindert, dass ein schlechter Schlag die Routine beeinflusst.',
      duration: 90,
      category: 'MENTAL_GAME',
      difficulty: 'MEDIUM',
      tips: [
        'Keine Bewertung – nur neutrale Beobachtung',
        'Scientist-Mindset: Daten sammeln, nicht urteilen',
        'Negative Sprache verboten: kein "Mist", "Idiot", "immer das gleiche"',
        'Langfristig: weniger Emotionen → konsistentere Leistung',
      ],
    },
    {
      id: 'lib-mental-13',
      name: 'Shot-Shaping-Visualization',
      description: 'Visualisiere vor jedem Schlag nicht nur die Flugbahn, sondern auch das Geräusch des Kontakts, das Gewicht des Schlägers und das Gefühl des Impact. Multi-Sense-Visualisierung ist messbar effektiver als rein visuelle Vorstellung.',
      duration: 20,
      category: 'MENTAL_GAME',
      difficulty: 'EASY',
      tips: [
        'Alle 5 Sinne aktivieren: Sehen, Hören, Fühlen, riechen (frisch gemähtes Gras!)',
        'Schlag erst ausführen, wenn das Bild vollständig ist',
        'Negative Bilder mit Handbewegung "löschen" (Jack Nicklaus-Methode)',
        'Je klarer das Bild, desto wahrscheinlicher die Ausführung',
      ],
    },
    {
      id: 'lib-mental-14',
      name: 'Turnier-Vorbereitung (Runden-Ritual)',
      description: 'Entwickle ein komplettes Wettkampf-Ritual: Ankunftszeit, Warm-Up-Sequenz (Putting, Chipping, Eisen, Driver), mentale Einstimmung. Übe dieses Ritual bei normalen Runden. Konstante Vorbereitung reduziert Turnier-Nervosität.',
      duration: 60,
      category: 'MENTAL_GAME',
      difficulty: 'MEDIUM',
      tips: [
        'Warm-Up sollte 45–60 Minuten vor dem Start beginnen',
        'Reihenfolge: kurze Putts → langes Putting → Chipping → Irons → Driver',
        'Kein "Reparatur-Warm-Up" – das letzte Bild soll positiv sein',
        'Gleiche Musik, gleicher Ablauf: Ritual schafft Sicherheit',
      ],
    },
    {
      id: 'lib-mental-15',
      name: 'Golf-Journal (Weekly Review)',
      description: 'Führe ein Golf-Journal: Notiere nach jeder Runde 3 Positives und 1 Verbesserungs-Fokus. Lies die letzten 4 Einträge vor der nächsten Runde. Regelmäßige Reflexion ist der dokumentierte Schlüssel zur mentalen Weiterentwicklung.',
      duration: 20,
      category: 'MENTAL_GAME',
      difficulty: 'EASY',
      tips: [
        'Journal handschriftlich führen – Gehirn verarbeitet es besser',
        '3 Positives zwingen dich, auch nach Misserfolgen Lernmomente zu finden',
        '1 Fokus: Konkret und handlungsorientiert ("Routine auf jedem Putt")',
        'Nach 1 Monat Journal: Muster erkennen und gezielt trainieren',
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

    // ── PUTTING (weitere Home) ──
    {
      id: 'home-putt-06',
      name: 'Teppich-Breakputt-Simulation',
      description: 'Lege ein Buch unter eine Seite deiner Putting-Matte, um einen Hang zu simulieren. Übe 15 Putts auf den Break. Trainiert das Lesen von Kurven, ohne auf das Grün zu gehen.',
      duration: 15,
      category: TrainingCategory.PUTTING,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Schätze den Break, bevor du schaust wohin der Ball läuft', 'Buch weiter unter die Matte schieben für mehr Break', 'Öffne die Augen erst nach dem Schlag'],
    },
    {
      id: 'home-putt-07',
      name: 'Lange-Distanz-Teppich-Putt',
      description: 'Putte von 4–5 Metern auf deiner Putting-Matte (oder markierter Teppichfläche) mit dem Ziel, den Ball im letzten 30 cm vor einem Marker zu stoppen. Trainiert Distanzgefühl für Langputts zuhause.',
      duration: 10,
      category: TrainingCategory.PUTTING,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Teppich bremst stärker als Grün – Kraft entsprechend erhöhen', 'Achte auf gleich langen Rück- und Durchschwung', 'Distanzgefühl ist wichtiger als Liniengefühl bei Langputts'],
    },
    {
      id: 'home-putt-08',
      name: 'Stoppuhr-Rhythmus-Drill',
      description: 'Starte eine Stoppuhr. Rückschwung bei 0, Durchschwung nach exakt 1 Sekunde. Wiederhole 20 Mal. Messung erzwingt konstanten Rhythmus und eliminiert Hetzen.',
      duration: 10,
      category: TrainingCategory.PUTTING,
      difficulty: TrainingDifficulty.EASY,
      tips: ['1 Sekunde = Standardrhythmus guter Putter', 'Zu schnell (0.5s) → Impuls statt Pendel', 'Zu langsam (2s) → Muskelspannung aufbaut sich', 'Finde deinen persönlich optimalen Rhythmus'],
    },
    {
      id: 'home-putt-09',
      name: 'Balance-Board-Putten',
      description: 'Stelle dich auf ein Balance-Board (oder ein zusammengerolltes Handtuch) und übe Putter-Bewegungen. Instabiler Untergrund erzwingt noch stabilere Körperhaltung und trainiert Gleichgewicht.',
      duration: 10,
      category: TrainingCategory.PUTTING,
      difficulty: TrainingDifficulty.HARD,
      tips: ['Ohne Bewegung zuerst: Balance finden, dann Pendel starten', 'Schulterpendel auf instabilem Untergrund schwieriger – sehr effektiv', 'Danach auf stabilem Untergrund: das Gefühl überträgt sich'],
    },
    {
      id: 'home-putt-10',
      name: 'Spiegel-Augen-Position-Check',
      description: 'Stelle einen kleinen Spiegel unter den Ball auf der Putting-Matte. Richte dich auf, bis du deine Augen direkt über dem Ball siehst. Das ist die korrekte Augenposition – die meisten Spieler stehen zu weit innen.',
      duration: 10,
      category: TrainingCategory.PUTTING,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Augen über dem Ball = korrekte Perspektive auf die Linie', 'Zu weit innen = Linie erscheint weiter links als sie ist', 'Tägliche Routine: 2 Minuten Spiegel-Check vor dem Üben'],
    },

    // ── SHORT GAME (weitere Home) ──
    {
      id: 'home-short-05',
      name: 'Wrist-Hinge-Drill (Handgelenk-Drill)',
      description: 'Halte den Wedge nur mit den Fingern der rechten Hand. Übe das Aufheben (Hinge) und Freigeben des Handgelenks. Trainiert das Gefühl für den richtigen Handgelenk-Einsatz beim Pitch-Schlag.',
      duration: 10,
      category: TrainingCategory.SHORT_GAME,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Hinge beim Rückschwung, Release beim Durchschwung', 'Kein Hinge = Topfen, zu viel = Fetten', 'Übe auch mit der linken Hand für Balance'],
    },
    {
      id: 'home-short-06',
      name: 'Chip-Impact-Kissen-Drill',
      description: 'Schlage sanft gegen ein festes Kissen mit deinem Wedge und achte auf die Haltung beim Impact: Hände vor dem Schläger, Gewicht vorne, Schaft geneigt. Wiederholen bis die Position verinnerlicht ist.',
      duration: 10,
      category: TrainingCategory.SHORT_GAME,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Kissen gibt Widerstand – wie echter Ballkontakt', 'Impact-Position mental einprägen', 'Schultern, Hüfte und Arme als Einheit'],
    },
    {
      id: 'home-short-07',
      name: 'Chipping-Matte-Präzision',
      description: 'Chipse auf einer kleinen Chipping-Matte (oder festem Teppichstück) auf ein Ziel (Glas, Schale) in 3–5 m Entfernung. Zähle Treffer von 20 Versuchen. Ideal für regelmäßiges Kontakt-Training zuhause.',
      duration: 15,
      category: TrainingCategory.SHORT_GAME,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Glas mit engem Durchmesser für mehr Präzision', 'Verschiedene Distanzen testen', 'Gleiche Landezone wie auf dem Platz visualisieren'],
    },
    {
      id: 'home-short-08',
      name: 'Open-Face-Technik üben (ohne Ball)',
      description: 'Übe die offene Schlägerface-Position (Lob-Shot-Haltung) vor dem Spiegel: Clubface zeigt zur Decke, Griff wird nach links gedreht, Stance offen. 10 Minuten täglich etabliert das motorische Programm.',
      duration: 10,
      category: TrainingCategory.SHORT_GAME,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Griff erst drehen, dann Clubface öffnen – in dieser Reihenfolge', 'Stance offen: linker Fuß zurückgezogen', 'Manche Spieler öffnen zu wenig – Spiegel zeigt die Wahrheit'],
    },
    {
      id: 'home-short-09',
      name: 'Tee-Stack-Chip (Präzisions-Drill)',
      description: 'Stecke 3 Tees in einer Reihe mit 10 cm Abstand. Chipse über das erste Tee und lande zwischen dem zweiten und dritten. Verlangt präzise Loft-Kontrolle und konsistentes Impaktniveau.',
      duration: 12,
      category: TrainingCategory.SHORT_GAME,
      difficulty: TrainingDifficulty.HARD,
      tips: ['Zu hoch → landet hinter dem dritten Tee', 'Zu flach → trifft erstes Tee', 'Übe mit verschiedenen Schlägern für verschiedene Loft-Gefühle'],
    },

    // ── IRON PLAY (weitere Home) ──
    {
      id: 'home-iron-06',
      name: 'X-Factor-Dehn-Übung',
      description: 'Halte einen Schläger auf Schulterhöhe waagerecht. Drehe die Schultern 90°, während die Hüfte nur 45° dreht. Halte 3 Sekunden. 15 Wiederholungen. Trainiert den Trennungswinkel (X-Factor), der die Schwungkraft erzeugt.',
      duration: 10,
      category: TrainingCategory.IRON_PLAY,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Je größer der X-Faktor, desto mehr gespeicherte Energie', 'Schultern ≥ 90°, Hüfte ≤ 45°', 'Langsam dehnen – keine Verletzungen'],
    },
    {
      id: 'home-iron-07',
      name: 'Gewichtsverlagerungs-Drill (Fersen-Zehen)',
      description: 'Stehe in der Adresse. Verlagere Gewicht bewusst auf die Fersen (Rückschwung-Gefühl) dann auf die Zehen (Durchschwung-Gefühl). 20 langsame Wiederholungen. Schult das Gefühl für korrekte Gewichtsverlagerung.',
      duration: 10,
      category: TrainingCategory.IRON_PLAY,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Fersen = Rückschwung-Gleichgewicht', 'Zehen-Druck = falsches Muster – Fußballen sind richtig', 'Kombiniere mit vollem Schwung im Anschluss'],
    },
    {
      id: 'home-iron-08',
      name: 'Hip-Rotation-Stretching',
      description: 'Lege deinen Schläger waagerecht in die Kniekehlen. Drehe die Hüfte ohne Schulterbeteiligung. 20 isolierte Hüft-Rotationen nach links und rechts. Trainiert die Hüftführung beim Downswing.',
      duration: 10,
      category: TrainingCategory.IRON_PLAY,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Hüfte dreht um die Wirbelsäule, nicht seitwärts', 'Schultern bleiben ruhig während Hüfte dreht', 'Täglich 5 Minuten erhöht Hüft-Mobilität signifikant'],
    },
    {
      id: 'home-iron-09',
      name: 'Follow-Through-Positions-Drill',
      description: 'Übe den perfekten Finish vor dem Spiegel: Gewicht 100% auf dem Vorderfuß, Gürtelschnalle zeigt zum Ziel, Hinterknie berührt fast das vordere, Schläger hinter dem Kopf. Halte 10 Sekunden. 15 Wiederholungen.',
      duration: 12,
      category: TrainingCategory.IRON_PLAY,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Ein guter Finish entsteht durch gute Bewegung davor', 'Gleichgewicht halten = sauberer Schwung', 'Vergleiche deinen Finish mit Profi-Videos'],
    },
    {
      id: 'home-iron-10',
      name: 'Stärkungstraining Unterarme (Griffstärke)',
      description: 'Trainiere Griffstärke mit einem Tennisball oder Stressball: 3 Sätze à 20 Wiederholungen pro Hand. Starke Unterarme verbessern Schläger-Kontrolle, Griffkonsistenz und Vibrations-Dämpfung beim Impact.',
      duration: 10,
      category: TrainingCategory.IRON_PLAY,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Nicht zu viel Kraft beim Spielen – aber Stärke als Reserve ist gut', 'Auch Handgelenk-Rotationen trainieren', 'Tägliches Grifftraining zeigt Ergebnisse nach 4 Wochen'],
    },

    // ── DRIVING (weitere Home) ──
    {
      id: 'home-drive-05',
      name: 'Coil-and-Recoil-Drill (Torso-Rotation)',
      description: 'Stehe in breitem Golf-Stand. Verschränke die Arme auf der Brust. Drehe den Torso vollständig in den Rückschwung (Coil), dann explosiv zum Finish (Recoil). 20 Wiederholungen. Trainiert die explosiven Rotationsmuskeln für den Driver.',
      duration: 10,
      category: TrainingCategory.DRIVING,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Coil: maximale Schulterdrehung, Hüfte folgt leicht', 'Recoil: Hüfte startet zuerst, Schultern folgen', 'Explosivität steigern über Wochen – Grundlage für Distanz'],
    },
    {
      id: 'home-drive-06',
      name: 'Weighted-Club-Speed-Drill',
      description: 'Hänge ein kleines Gewicht (Tuch, Socke mit Münzen) ans Griffende des Schlägers. Mache langsame Schwünge mit dem Gewicht. Das zusätzliche Gewicht am Ende trainiert Gleichgewicht und bewusste Schläger-Kontrolle.',
      duration: 12,
      category: TrainingCategory.DRIVING,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Langsame Schwünge zuerst – Gewicht erhöht Hebelkraft', 'Fühle den Schläger-Kopf durch das gesamte Schwung', 'Ohne Gewicht danach: Schläger fühlt sich "leichter" an'],
    },
    {
      id: 'home-drive-07',
      name: 'Lag-Drill (Hangelenk-Winkel halten)',
      description: 'Übe den Downswing-Lag: Beginne den Durchschwung und halte den 90°-Winkel zwischen Schaft und Unterarm so lange wie möglich. Erst kurz vor dem Impact freigeben. 15 langsame Bewegungen vor dem Spiegel.',
      duration: 15,
      category: TrainingCategory.DRIVING,
      difficulty: TrainingDifficulty.HARD,
      tips: ['Lag = gespeicherte Energie = mehr Schlägerkopfgeschwindigkeit', 'Zu frühes Freigeben = "Casting" – häufigster Distanzkiller', 'Fühle den Winkel im rechten Handgelenk (Rechtshänder)', 'Release erst bei Hüfthöhe im Downswing'],
    },
    {
      id: 'home-drive-08',
      name: 'Postur-Drill (Rücken-Winkel)',
      description: 'Stelle dich vor den Spiegel in die Adresse. Halte einen Schläger an deinen Rücken (Griff am Kopf, Schläger-Kopf nach unten). Der Schläger sollte 3 Kontaktpunkte haben: Kopf, Oberer Rücken, Steißbein. Das ist die neutrale Wirbelsäulenposition.',
      duration: 10,
      category: TrainingCategory.DRIVING,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Krummer Rücken = inkonsistente Schwungbahn', 'Oberkörper kippt aus der Hüfte, nicht dem Rücken', 'Knie leicht gebeugt für dynamische Basis'],
    },
    {
      id: 'home-drive-09',
      name: 'Squat-Move-Drill (Abwärts-Bewegung)',
      description: 'Übe die leichte Abwärtsbewegung ("Squat") zu Beginn des Downswings: Wenn der Rückschwung endet, senke dich minimal durch Kniebeugen bevor du rotierst. 20 Wiederholungen. Diese Bewegung findet sich bei fast allen langen Spielern.',
      duration: 12,
      category: TrainingCategory.DRIVING,
      difficulty: TrainingDifficulty.HARD,
      tips: ['Squat = 2–3 cm Absenkung, nicht mehr', 'Danach Hüfte explosiv nach vorn rotieren', 'Zu viel Squat = zu tief = schlechter Kontakt'],
    },

    // ── MENTAL GAME (weitere Home) ──
    {
      id: 'home-mental-06',
      name: 'Golf-Meditation (10 Minuten)',
      description: 'Setze dich ruhig hin, atme tief und konzentriere dich 10 Minuten lang ausschließlich auf das Gefühl deiner besten Schwünge. Keine Analyse – nur das Körpergefühl. Verbindet Entspannung mit positivem motorischen Gedächtnis.',
      duration: 10,
      category: TrainingCategory.MENTAL_GAME,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Beste Schläge intensiv erinnern – alle Sinne', 'Wenn Gedanken abschweifen: tief atmen und zurückkommen', 'Regelmäßige Praxis stärkt mentales Vertrauen'],
    },
    {
      id: 'home-mental-07',
      name: 'Fehleranalyse-Journal',
      description: 'Notiere nach jeder Runde die 3 Schläge, die dich am meisten Schläge gekostet haben. Analysiere NICHT die Technik, sondern die Entscheidung davor. War es ein guter Schlag-Plan? Trainiert die Entscheidungsqualität langfristig.',
      duration: 15,
      category: TrainingCategory.MENTAL_GAME,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Oft ist schlechte Entscheidung schuld, nicht schlechte Technik', '"War das das richtige Ziel für meinen Schlag?" ist die wichtigste Frage', 'Muster über 10 Einträge: gleiche Fehler = systemisches Problem'],
    },
    {
      id: 'home-mental-08',
      name: 'Ziel-Visualisierung (Season Goal)',
      description: 'Visualisiere einmal wöchentlich 10 Minuten lang dein Saisonziel (neues Handicap, erstes Turnier, bestimmter Score). So konkret wie möglich: Wo bist du? Wie fühlt es sich an? Was sagst du? Langfristige Ziele brauchen regelmäßige mentale Verankerung.',
      duration: 10,
      category: TrainingCategory.MENTAL_GAME,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Ziel SMART formulieren: spezifisch, messbar, attraktiv, realistisch, terminiert', 'Bild des Ziels als Handy-Hintergrundbild', 'Kombiniere Ziel-Visualisierung mit Affirmationen'],
    },
    {
      id: 'home-mental-09',
      name: 'Komfort-Zone-Training',
      description: 'Identifiziere 3 Schläge oder Situationen, die dir Angst machen (z.B. Putt mit Zuschauern, Abschlag auf Loch 1). Übe diese mental: Stelle dir die Situation vor, atme tief, führe den Schlag mental perfekt aus. 5 Minuten täglich.',
      duration: 10,
      category: TrainingCategory.MENTAL_GAME,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Mentales Üben schwieriger Situationen reduziert echte Angst', 'Positive Ausführung immer visualisieren, nie den Fehler', 'Körper reagiert auf mentales Bild ähnlich wie auf Realität'],
    },
    {
      id: 'home-mental-10',
      name: 'Erfolgs-Tagebuch (Positive Highlights)',
      description: 'Schreibe täglich 1–2 positive Golferlebnisse auf – egal wie klein: ein guter Putt, eine gute Entscheidung, ein tolles Gespräch. Trainiert den Fokus auf Positives und baut langfristig Selbstvertrauen und Freude am Spiel auf.',
      duration: 5,
      category: TrainingCategory.MENTAL_GAME,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Auch kleine Erfolge zählen: "Habe heute 30 min geübt"', 'Im Bett vor dem Schlafen: perfekte Wiederholung des Tages', 'Golf ist ein Spiel – Freude ist die wichtigste Ressource'],
    },

    // ── COURSE MANAGEMENT (weitere Home) ──
    {
      id: 'home-course-05',
      name: 'Schläger-Distanz-Tabelle erstellen',
      description: 'Erstelle eine persönliche Schläger-Distanz-Tabelle auf dem Handy oder einer Karte: Carry-Distanz für jeden Schläger (PW bis Driver) bei 50%, 75% und 100% Schwung. Diese Tabelle ist das wichtigste Werkzeug auf dem Platz.',
      duration: 20,
      category: TrainingCategory.COURSE_MANAGEMENT,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Ehrliche Werte – keine Wunsch-Distanzen', 'Auf dem Übungsplatz mit Rangefinder messen', 'Einmal im Monat aktualisieren'],
    },
    {
      id: 'home-course-06',
      name: 'Platz-Visualisierung (Heimplatz)',
      description: 'Visualisiere alle 18 Löcher deines Heimatplatzes: Abschlag-Position, Fairway-Verlauf, Gefahren, optimaler Approach. Erstelle eine mentale "Karte". Das vertraute Bild reduziert Stress auf dem Platz.',
      duration: 25,
      category: TrainingCategory.COURSE_MANAGEMENT,
      difficulty: TrainingDifficulty.EASY,
      tips: ['Schließe die Augen und gehe jeden Abschlag durch', 'Notiere schwierige Löcher mit konkretem Plan', 'Neue Plätze: Satellite-Ansicht vor der Runde studieren'],
    },
    {
      id: 'home-course-07',
      name: 'Regel-Quiz (Selbsttest)',
      description: 'Erstelle dir selbst 10 Regel-Fragen zu typischen Situationen (Unspielbar, Wasserhindernis, Identifikation, Grün-Privilegien). Beantworte sie ohne Nachschlagen. Überprüfe dann die richtigen Antworten. Regelkenntnis spart echte Strafschläge.',
      duration: 20,
      category: TrainingCategory.COURSE_MANAGEMENT,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Regel 17 (Wasserhindernis) und Regel 19 (unspielbar) am wichtigsten', 'R&A Rules App: kostenlose, offizielle Quelle', 'Jährlich aktualisieren – Regeln ändern sich gelegentlich'],
    },
    {
      id: 'home-course-08',
      name: 'Video-Analyse eigener Runden',
      description: 'Nimm dich bei 3 verschiedenen Schlägen pro Runde mit dem Handy auf. Analysiere zuhause: Stimmt die Ausrichtung? Wie ist die Balance? Ist die Pre-Shot-Routine gleich? Video zeigt Fehler, die du im Spiel nicht spürst.',
      duration: 30,
      category: TrainingCategory.COURSE_MANAGEMENT,
      difficulty: TrainingDifficulty.MEDIUM,
      tips: ['Von hinten (hinter der Ziellinie) und von der Seite filmen', 'Suche Muster über mehrere Videos', 'Vergleiche mit deinen besten Schlägen auf dem Übungsplatz', 'Eine gute Analyse erspart viele Fahrstunden beim Pro'],
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

  // ── Weitere Template-Pläne ─────────────────────────────────────────
  console.log('Seeding additional template plans...');

  const connect = (id: string) => ({ drill: { connect: { id } } });

  // ── BEGINNER ──────────────────────────────────────────────────────
  await prisma.trainingPlan.upsert({
    where: { id: 'plan-beginner-2' },
    update: {},
    create: {
      id: 'plan-beginner-2',
      name: 'Putting-Grundschule',
      description: 'Für absolute Anfänger: 3 Wochen reines Putting-Training. Solide Basis für das wichtigste Teilspiel im Golf – die Hälfte aller Schläge entstehen auf dem Grün.',
      targetLevel: GolferLevel.BEGINNER,
      durationWeeks: 3,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1, title: 'Putter kennenlernen', focus: TrainingCategory.PUTTING, totalMinutes: 40,
            drills: { create: [{ order: 1, ...connect('lib-putt-01') }, { order: 2, ...connect('lib-putt-07') }, { order: 3, ...connect('lib-putt-11') }] },
          },
          {
            dayNumber: 2, title: 'Distanzgefühl entwickeln', focus: TrainingCategory.PUTTING, totalMinutes: 40,
            drills: { create: [{ order: 1, ...connect('lib-putt-03') }, { order: 2, ...connect('lib-putt-16') }, { order: 3, ...connect('lib-putt-06') }] },
          },
          {
            dayNumber: 3, title: 'Kurzputts sichern', focus: TrainingCategory.PUTTING, totalMinutes: 45,
            drills: { create: [{ order: 1, ...connect('lib-putt-02') }, { order: 2, ...connect('lib-putt-12') }, { order: 3, ...connect('lib-putt-05') }] },
          },
        ],
      },
    },
  });

  await prisma.trainingPlan.upsert({
    where: { id: 'plan-beginner-3' },
    update: {},
    create: {
      id: 'plan-beginner-3',
      name: 'Short Game für Einsteiger',
      description: 'Der schnellste Weg, Schläge zu sparen: 4 Wochen Fokus auf Chip, Bunker und Kurzputts. Ideal für Golfer, die gerade mit dem Spielen beginnen.',
      targetLevel: GolferLevel.BEGINNER,
      durationWeeks: 4,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1, title: 'Chip & Run lernen', focus: TrainingCategory.SHORT_GAME, totalMinutes: 45,
            drills: { create: [{ order: 1, ...connect('lib-short-01') }, { order: 2, ...connect('lib-short-02') }, { order: 3, ...connect('lib-short-04') }] },
          },
          {
            dayNumber: 2, title: 'Bunker Basics', focus: TrainingCategory.SHORT_GAME, totalMinutes: 50,
            drills: { create: [{ order: 1, ...connect('lib-short-13') }, { order: 2, ...connect('lib-short-06') }] },
          },
          {
            dayNumber: 3, title: 'Putting Kombination', focus: TrainingCategory.PUTTING, totalMinutes: 35,
            drills: { create: [{ order: 1, ...connect('lib-putt-01') }, { order: 2, ...connect('lib-putt-16') }, { order: 3, ...connect('lib-putt-02') }] },
          },
          {
            dayNumber: 4, title: 'Up & Down erste Versuche', focus: TrainingCategory.SHORT_GAME, totalMinutes: 45,
            drills: { create: [{ order: 1, ...connect('lib-short-03') }, { order: 2, ...connect('lib-short-11') }] },
          },
        ],
      },
    },
  });

  await prisma.trainingPlan.upsert({
    where: { id: 'plan-beginner-4' },
    update: {},
    create: {
      id: 'plan-beginner-4',
      name: 'Golf ABC – Rundum-Einsteiger',
      description: 'Alle Bereiche in 6 Wochen: Eisen, Driver, Putting, Kurzspiel und Platzmanagement. Der komplette Einstiegs-Kurs für neue Golfer, die das Gesamtbild verstehen wollen.',
      targetLevel: GolferLevel.BEGINNER,
      durationWeeks: 6,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1, title: 'Eisenspiel Basics', focus: TrainingCategory.IRON_PLAY, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-iron-01') }, { order: 2, ...connect('lib-iron-02') }, { order: 3, ...connect('lib-iron-03') }] },
          },
          {
            dayNumber: 2, title: 'Driver Einführung', focus: TrainingCategory.DRIVING, totalMinutes: 50,
            drills: { create: [{ order: 1, ...connect('lib-drive-01') }, { order: 2, ...connect('lib-drive-02') }, { order: 3, ...connect('lib-drive-16') }] },
          },
          {
            dayNumber: 3, title: 'Putting Basis', focus: TrainingCategory.PUTTING, totalMinutes: 45,
            drills: { create: [{ order: 1, ...connect('lib-putt-01') }, { order: 2, ...connect('lib-putt-07') }, { order: 3, ...connect('lib-putt-16') }] },
          },
          {
            dayNumber: 4, title: 'Kurzspiel Einstieg', focus: TrainingCategory.SHORT_GAME, totalMinutes: 50,
            drills: { create: [{ order: 1, ...connect('lib-short-01') }, { order: 2, ...connect('lib-short-02') }] },
          },
          {
            dayNumber: 5, title: 'Platz verstehen', focus: TrainingCategory.COURSE_MANAGEMENT, totalMinutes: 45,
            drills: { create: [{ order: 1, ...connect('lib-mgmt-03') }, { order: 2, ...connect('lib-mgmt-04') }, { order: 3, ...connect('lib-mgmt-05') }] },
          },
        ],
      },
    },
  });

  // ── INTERMEDIATE ──────────────────────────────────────────────────
  await prisma.trainingPlan.upsert({
    where: { id: 'plan-intermediate-2' },
    update: {},
    create: {
      id: 'plan-intermediate-2',
      name: 'Eisenspiel-Boost',
      description: 'Gezieltes 6-Wochen-Programm für Golfer mit HCP 20–30: Kontakt verbessern, Ausrichtung stabilisieren, Approach-Distanzen kalibrieren. Mehr Greens in Regulation bedeutet direkt weniger Schläge.',
      targetLevel: GolferLevel.INTERMEDIATE,
      durationWeeks: 6,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1, title: 'Kontakt & Divot', focus: TrainingCategory.IRON_PLAY, totalMinutes: 55,
            drills: { create: [{ order: 1, ...connect('lib-iron-01') }, { order: 2, ...connect('lib-iron-07') }, { order: 3, ...connect('lib-iron-09') }] },
          },
          {
            dayNumber: 2, title: 'Ausrichtung & Ziel', focus: TrainingCategory.IRON_PLAY, totalMinutes: 55,
            drills: { create: [{ order: 1, ...connect('lib-iron-02') }, { order: 2, ...connect('lib-iron-13') }, { order: 3, ...connect('lib-iron-18') }] },
          },
          {
            dayNumber: 3, title: 'Approach-Präzision', focus: TrainingCategory.IRON_PLAY, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-iron-06') }, { order: 2, ...connect('lib-iron-16') }, { order: 3, ...connect('lib-iron-10') }] },
          },
          {
            dayNumber: 4, title: 'Halbschwung & Punch', focus: TrainingCategory.IRON_PLAY, totalMinutes: 45,
            drills: { create: [{ order: 1, ...connect('lib-iron-03') }, { order: 2, ...connect('lib-iron-05') }, { order: 3, ...connect('lib-iron-17') }] },
          },
          {
            dayNumber: 5, title: 'Mentale Stabilität', focus: TrainingCategory.MENTAL_GAME, totalMinutes: 40,
            drills: { create: [{ order: 1, ...connect('lib-mental-01') }, { order: 2, ...connect('lib-mental-05') }, { order: 3, ...connect('lib-mental-09') }] },
          },
        ],
      },
    },
  });

  await prisma.trainingPlan.upsert({
    where: { id: 'plan-intermediate-3' },
    update: {},
    create: {
      id: 'plan-intermediate-3',
      name: 'Short Game Masterclass',
      description: 'In 6 Wochen zum gefürchteten Kurzspieler: Chip-Varianten, Bunker-Kontrolle, Lob-Shots und Up & Down aus jeder Lage. Wer das Kurzspiel beherrscht, spart 5–8 Schläge pro Runde.',
      targetLevel: GolferLevel.INTERMEDIATE,
      durationWeeks: 6,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1, title: 'Chip-Varianten meistern', focus: TrainingCategory.SHORT_GAME, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-short-01') }, { order: 2, ...connect('lib-short-02') }, { order: 3, ...connect('lib-short-03') }] },
          },
          {
            dayNumber: 2, title: 'Bunker-Kontrolle', focus: TrainingCategory.SHORT_GAME, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-short-13') }, { order: 2, ...connect('lib-short-06') }, { order: 3, ...connect('lib-short-07') }] },
          },
          {
            dayNumber: 3, title: 'Lob & Flop', focus: TrainingCategory.SHORT_GAME, totalMinutes: 55,
            drills: { create: [{ order: 1, ...connect('lib-short-05') }, { order: 2, ...connect('lib-short-10') }, { order: 3, ...connect('lib-short-19') }] },
          },
          {
            dayNumber: 4, title: 'Putting Qualität', focus: TrainingCategory.PUTTING, totalMinutes: 50,
            drills: { create: [{ order: 1, ...connect('lib-putt-03') }, { order: 2, ...connect('lib-putt-13') }, { order: 3, ...connect('lib-putt-14') }] },
          },
          {
            dayNumber: 5, title: 'Up & Down Wettbewerb', focus: TrainingCategory.SHORT_GAME, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-short-17') }, { order: 2, ...connect('lib-short-09') }] },
          },
          {
            dayNumber: 6, title: 'Schwierige Lagen', focus: TrainingCategory.SHORT_GAME, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-short-15') }, { order: 2, ...connect('lib-short-16') }, { order: 3, ...connect('lib-short-08') }] },
          },
        ],
      },
    },
  });

  await prisma.trainingPlan.upsert({
    where: { id: 'plan-intermediate-4' },
    update: {},
    create: {
      id: 'plan-intermediate-4',
      name: 'Driver & Langspiel',
      description: '4 Wochen Fokus auf den Abschlag: mehr Fairways treffen, mehr Distanz, weniger OB. Mit besseren Tee-Shots beginnt jede gute Runde.',
      targetLevel: GolferLevel.INTERMEDIATE,
      durationWeeks: 4,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1, title: 'Tee-Shot Grundlagen', focus: TrainingCategory.DRIVING, totalMinutes: 55,
            drills: { create: [{ order: 1, ...connect('lib-drive-01') }, { order: 2, ...connect('lib-drive-02') }, { order: 3, ...connect('lib-drive-08') }] },
          },
          {
            dayNumber: 2, title: 'Körperrotation & Kraft', focus: TrainingCategory.DRIVING, totalMinutes: 55,
            drills: { create: [{ order: 1, ...connect('lib-drive-04') }, { order: 2, ...connect('lib-drive-05') }, { order: 3, ...connect('lib-drive-09') }] },
          },
          {
            dayNumber: 3, title: 'Präzision & Treffpunkt', focus: TrainingCategory.DRIVING, totalMinutes: 55,
            drills: { create: [{ order: 1, ...connect('lib-drive-06') }, { order: 2, ...connect('lib-drive-07') }, { order: 3, ...connect('lib-drive-14') }] },
          },
          {
            dayNumber: 4, title: 'Distanz & Speed', focus: TrainingCategory.DRIVING, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-drive-12') }, { order: 2, ...connect('lib-drive-13') }, { order: 3, ...connect('lib-drive-18') }] },
          },
        ],
      },
    },
  });

  await prisma.trainingPlan.upsert({
    where: { id: 'plan-intermediate-5' },
    update: {},
    create: {
      id: 'plan-intermediate-5',
      name: 'Putting-Upgrade',
      description: '5 Wochen intensives Putting für Spieler mit HCP 18–28. Von 36 auf unter 30 Putts pro Runde ist realistisch – das entspricht 6 eingesparten Schlägen.',
      targetLevel: GolferLevel.INTERMEDIATE,
      durationWeeks: 5,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1, title: 'Kurzputts unter Druck', focus: TrainingCategory.PUTTING, totalMinutes: 45,
            drills: { create: [{ order: 1, ...connect('lib-putt-02') }, { order: 2, ...connect('lib-putt-10') }, { order: 3, ...connect('lib-putt-06') }] },
          },
          {
            dayNumber: 2, title: 'Distanzkontrolle', focus: TrainingCategory.PUTTING, totalMinutes: 45,
            drills: { create: [{ order: 1, ...connect('lib-putt-09') }, { order: 2, ...connect('lib-putt-14') }, { order: 3, ...connect('lib-putt-03') }] },
          },
          {
            dayNumber: 3, title: 'Break lesen', focus: TrainingCategory.PUTTING, totalMinutes: 50,
            drills: { create: [{ order: 1, ...connect('lib-putt-08') }, { order: 2, ...connect('lib-putt-13') }, { order: 3, ...connect('lib-putt-17') }] },
          },
          {
            dayNumber: 4, title: 'Rhythmus & Tempo', focus: TrainingCategory.PUTTING, totalMinutes: 40,
            drills: { create: [{ order: 1, ...connect('lib-putt-01') }, { order: 2, ...connect('lib-putt-07') }, { order: 3, ...connect('lib-putt-05') }] },
          },
          {
            dayNumber: 5, title: 'Putting-Wettbewerb', focus: TrainingCategory.PUTTING, totalMinutes: 50,
            drills: { create: [{ order: 1, ...connect('lib-putt-15') }, { order: 2, ...connect('lib-putt-04') }, { order: 3, ...connect('lib-putt-19') }] },
          },
        ],
      },
    },
  });

  // ── ADVANCED ──────────────────────────────────────────────────────
  await prisma.trainingPlan.upsert({
    where: { id: 'plan-advanced-2' },
    update: {},
    create: {
      id: 'plan-advanced-2',
      name: 'Mental Performance',
      description: 'Für Golfer mit HCP 9–18: In 8 Wochen die mentale Stärke aufbauen, die technisch gute Spieler von wirklich konstanten Spielern unterscheidet. Visualisierung, Druck-Resilienz und Wettkampf-Routine.',
      targetLevel: GolferLevel.ADVANCED,
      durationWeeks: 8,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1, title: 'Visualisierung & Fokus', focus: TrainingCategory.MENTAL_GAME, totalMinutes: 45,
            drills: { create: [{ order: 1, ...connect('lib-mental-01') }, { order: 2, ...connect('lib-mental-13') }, { order: 3, ...connect('lib-mental-09') }] },
          },
          {
            dayNumber: 2, title: 'Drucktraining', focus: TrainingCategory.MENTAL_GAME, totalMinutes: 50,
            drills: { create: [{ order: 1, ...connect('lib-mental-04') }, { order: 2, ...connect('lib-mental-11') }, { order: 3, ...connect('lib-putt-10') }] },
          },
          {
            dayNumber: 3, title: 'Platzmanagement Strategie', focus: TrainingCategory.COURSE_MANAGEMENT, totalMinutes: 55,
            drills: { create: [{ order: 1, ...connect('lib-mgmt-01') }, { order: 2, ...connect('lib-mgmt-08') }, { order: 3, ...connect('lib-mgmt-02') }] },
          },
          {
            dayNumber: 4, title: 'Routine perfektionieren', focus: TrainingCategory.MENTAL_GAME, totalMinutes: 45,
            drills: { create: [{ order: 1, ...connect('lib-mental-05') }, { order: 2, ...connect('lib-mental-07') }, { order: 3, ...connect('lib-mental-14') }] },
          },
          {
            dayNumber: 5, title: 'Fehler-Resilienz', focus: TrainingCategory.MENTAL_GAME, totalMinutes: 50,
            drills: { create: [{ order: 1, ...connect('lib-mental-02') }, { order: 2, ...connect('lib-mental-08') }, { order: 3, ...connect('lib-mental-10') }] },
          },
        ],
      },
    },
  });

  await prisma.trainingPlan.upsert({
    where: { id: 'plan-advanced-3' },
    update: {},
    create: {
      id: 'plan-advanced-3',
      name: 'Platzmanagement Elite',
      description: '6 Wochen strategisches Denken auf dem Platz: Risikoanalyse, Fahnen-Strategie, Recovery-Schläge und statistische Selbstanalyse. Klügeres Golf schlägt mutigeres Golf.',
      targetLevel: GolferLevel.ADVANCED,
      durationWeeks: 6,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1, title: 'Strategie-Grundlagen', focus: TrainingCategory.COURSE_MANAGEMENT, totalMinutes: 50,
            drills: { create: [{ order: 1, ...connect('lib-mgmt-03') }, { order: 2, ...connect('lib-mgmt-04') }, { order: 3, ...connect('lib-mgmt-05') }] },
          },
          {
            dayNumber: 2, title: 'Fahnen & Zonen', focus: TrainingCategory.COURSE_MANAGEMENT, totalMinutes: 55,
            drills: { create: [{ order: 1, ...connect('lib-mgmt-08') }, { order: 2, ...connect('lib-mgmt-10') }, { order: 3, ...connect('lib-mgmt-06') }] },
          },
          {
            dayNumber: 3, title: 'Recovery & Trouble', focus: TrainingCategory.COURSE_MANAGEMENT, totalMinutes: 55,
            drills: { create: [{ order: 1, ...connect('lib-mgmt-09') }, { order: 2, ...connect('lib-short-15') }, { order: 3, ...connect('lib-short-16') }] },
          },
          {
            dayNumber: 4, title: 'Wind & Wetter', focus: TrainingCategory.COURSE_MANAGEMENT, totalMinutes: 45,
            drills: { create: [{ order: 1, ...connect('lib-mgmt-02') }, { order: 2, ...connect('lib-mgmt-13') }, { order: 3, ...connect('lib-drive-15') }] },
          },
          {
            dayNumber: 5, title: 'Layup & Aufschlag-Zonen', focus: TrainingCategory.COURSE_MANAGEMENT, totalMinutes: 50,
            drills: { create: [{ order: 1, ...connect('lib-mgmt-11') }, { order: 2, ...connect('lib-mgmt-07') }, { order: 3, ...connect('lib-drive-17') }] },
          },
          {
            dayNumber: 6, title: 'Statistik & Analyse', focus: TrainingCategory.COURSE_MANAGEMENT, totalMinutes: 50,
            drills: { create: [{ order: 1, ...connect('lib-mgmt-14') }, { order: 2, ...connect('lib-mgmt-12') }] },
          },
        ],
      },
    },
  });

  await prisma.trainingPlan.upsert({
    where: { id: 'plan-advanced-4' },
    update: {},
    create: {
      id: 'plan-advanced-4',
      name: 'Komplettpaket HCP unter 9',
      description: '10 Wochen All-in-One für Spieler, die den einstelligen Bereich anstreben: Hochleistungs-Putting, Wedge-Präzision, Langspiel-Optimierung und mentale Elite-Techniken.',
      targetLevel: GolferLevel.ADVANCED,
      durationWeeks: 10,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1, title: 'Wedge-Präzision', focus: TrainingCategory.SHORT_GAME, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-short-19') }, { order: 2, ...connect('lib-short-20') }, { order: 3, ...connect('lib-iron-06') }] },
          },
          {
            dayNumber: 2, title: 'Langspiel Elite', focus: TrainingCategory.DRIVING, totalMinutes: 65,
            drills: { create: [{ order: 1, ...connect('lib-drive-15') }, { order: 2, ...connect('lib-drive-17') }, { order: 3, ...connect('lib-drive-18') }] },
          },
          {
            dayNumber: 3, title: 'Putting Hochleistung', focus: TrainingCategory.PUTTING, totalMinutes: 55,
            drills: { create: [{ order: 1, ...connect('lib-putt-08') }, { order: 2, ...connect('lib-putt-15') }, { order: 3, ...connect('lib-putt-20') }] },
          },
          {
            dayNumber: 4, title: 'Eisen Elite', focus: TrainingCategory.IRON_PLAY, totalMinutes: 65,
            drills: { create: [{ order: 1, ...connect('lib-iron-04') }, { order: 2, ...connect('lib-iron-16') }, { order: 3, ...connect('lib-iron-17') }] },
          },
          {
            dayNumber: 5, title: 'Platz-Strategie', focus: TrainingCategory.COURSE_MANAGEMENT, totalMinutes: 55,
            drills: { create: [{ order: 1, ...connect('lib-mgmt-08') }, { order: 2, ...connect('lib-mgmt-09') }, { order: 3, ...connect('lib-mgmt-10') }] },
          },
          {
            dayNumber: 6, title: 'Mentale Elite', focus: TrainingCategory.MENTAL_GAME, totalMinutes: 55,
            drills: { create: [{ order: 1, ...connect('lib-mental-12') }, { order: 2, ...connect('lib-mental-13') }, { order: 3, ...connect('lib-mental-14') }] },
          },
        ],
      },
    },
  });

  // ── PRO ───────────────────────────────────────────────────────────
  await prisma.trainingPlan.upsert({
    where: { id: 'plan-pro-1' },
    update: {},
    create: {
      id: 'plan-pro-1',
      name: 'Tour Performance Training',
      description: '12 Wochen Hochleistungstraining für Spieler mit HCP unter 5: Speed-Training, Tour-Wedge-Präzision, Putting unter Druck und Turnier-Mentalität. Das Programm, das Profis nutzen.',
      targetLevel: GolferLevel.PRO,
      durationWeeks: 12,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1, title: 'Speed & Power', focus: TrainingCategory.DRIVING, totalMinutes: 70,
            drills: { create: [{ order: 1, ...connect('lib-drive-12') }, { order: 2, ...connect('lib-drive-13') }, { order: 3, ...connect('lib-drive-18') }] },
          },
          {
            dayNumber: 2, title: 'Tour Wedge', focus: TrainingCategory.SHORT_GAME, totalMinutes: 70,
            drills: { create: [{ order: 1, ...connect('lib-short-09') }, { order: 2, ...connect('lib-short-19') }, { order: 3, ...connect('lib-short-20') }] },
          },
          {
            dayNumber: 3, title: 'Tour Putting', focus: TrainingCategory.PUTTING, totalMinutes: 65,
            drills: { create: [{ order: 1, ...connect('lib-putt-04') }, { order: 2, ...connect('lib-putt-10') }, { order: 3, ...connect('lib-putt-15') }] },
          },
          {
            dayNumber: 4, title: 'Scoring Zone Eisen', focus: TrainingCategory.IRON_PLAY, totalMinutes: 70,
            drills: { create: [{ order: 1, ...connect('lib-iron-04') }, { order: 2, ...connect('lib-iron-16') }, { order: 3, ...connect('lib-iron-17') }] },
          },
          {
            dayNumber: 5, title: 'Strategie & Analyse', focus: TrainingCategory.COURSE_MANAGEMENT, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-mgmt-09') }, { order: 2, ...connect('lib-mgmt-10') }, { order: 3, ...connect('lib-mgmt-11') }] },
          },
          {
            dayNumber: 6, title: 'Pressure Performance', focus: TrainingCategory.MENTAL_GAME, totalMinutes: 65,
            drills: { create: [{ order: 1, ...connect('lib-mental-11') }, { order: 2, ...connect('lib-mental-04') }, { order: 3, ...connect('lib-mental-08') }] },
          },
          {
            dayNumber: 7, title: 'Simulation & Review', focus: TrainingCategory.COURSE_MANAGEMENT, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-mgmt-13') }, { order: 2, ...connect('lib-mgmt-14') }, { order: 3, ...connect('lib-mental-15') }] },
          },
        ],
      },
    },
  });

  await prisma.trainingPlan.upsert({
    where: { id: 'plan-pro-2' },
    update: {},
    create: {
      id: 'plan-pro-2',
      name: 'Wettkampfvorbereitung',
      description: '4 Wochen gezielte Turnier-Vorbereitung: Warm-Up-Protokoll, Druck-Simulation, Strategie-Feinschliff und mentale Wettkampf-Routine. Für Spieler, die in Turnieren ihr Bestes abrufen wollen.',
      targetLevel: GolferLevel.PRO,
      durationWeeks: 4,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1, title: 'Warm-Up Protokoll', focus: TrainingCategory.MENTAL_GAME, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-mental-14') }, { order: 2, ...connect('lib-mental-01') }, { order: 3, ...connect('lib-putt-07') }] },
          },
          {
            dayNumber: 2, title: 'Kurzspiel unter Druck', focus: TrainingCategory.SHORT_GAME, totalMinutes: 65,
            drills: { create: [{ order: 1, ...connect('lib-short-09') }, { order: 2, ...connect('lib-short-17') }, { order: 3, ...connect('lib-putt-10') }] },
          },
          {
            dayNumber: 3, title: 'Tee-Shot Kontrolle', focus: TrainingCategory.DRIVING, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-drive-03') }, { order: 2, ...connect('lib-drive-14') }, { order: 3, ...connect('lib-drive-17') }] },
          },
          {
            dayNumber: 4, title: 'Grüns lesen & Putten', focus: TrainingCategory.PUTTING, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-putt-08') }, { order: 2, ...connect('lib-putt-17') }, { order: 3, ...connect('lib-putt-15') }] },
          },
          {
            dayNumber: 5, title: 'Turnier-Simulation', focus: TrainingCategory.MENTAL_GAME, totalMinutes: 70,
            drills: { create: [{ order: 1, ...connect('lib-mental-11') }, { order: 2, ...connect('lib-mental-03') }, { order: 3, ...connect('lib-mental-12') }] },
          },
        ],
      },
    },
  });

  await prisma.trainingPlan.upsert({
    where: { id: 'plan-pro-3' },
    update: {},
    create: {
      id: 'plan-pro-3',
      name: 'Scoring: Das 9-Schuss-Arsenal',
      description: '6 Wochen für Spieler, die ihr vollständiges Shot-Repertoire entwickeln wollen: Draw/Fade, Hoch/Niedrig, Punch-Shots und kreatives Kurzspiel aus jeder Lage.',
      targetLevel: GolferLevel.PRO,
      durationWeeks: 6,
      isTemplate: true,
      days: {
        create: [
          {
            dayNumber: 1, title: '9-Schuss-Drill', focus: TrainingCategory.IRON_PLAY, totalMinutes: 70,
            drills: { create: [{ order: 1, ...connect('lib-iron-04') }, { order: 2, ...connect('lib-iron-05') }, { order: 3, ...connect('lib-iron-17') }] },
          },
          {
            dayNumber: 2, title: 'Draw & Fade Driver', focus: TrainingCategory.DRIVING, totalMinutes: 65,
            drills: { create: [{ order: 1, ...connect('lib-drive-03') }, { order: 2, ...connect('lib-drive-11') }, { order: 3, ...connect('lib-drive-10') }] },
          },
          {
            dayNumber: 3, title: 'Kreatives Kurzspiel', focus: TrainingCategory.SHORT_GAME, totalMinutes: 65,
            drills: { create: [{ order: 1, ...connect('lib-short-05') }, { order: 2, ...connect('lib-short-10') }, { order: 3, ...connect('lib-short-18') }] },
          },
          {
            dayNumber: 4, title: 'Wedge-Arsenal', focus: TrainingCategory.SHORT_GAME, totalMinutes: 65,
            drills: { create: [{ order: 1, ...connect('lib-iron-06') }, { order: 2, ...connect('lib-short-19') }, { order: 3, ...connect('lib-short-07') }] },
          },
          {
            dayNumber: 5, title: 'Knockdown & Kontrollschläge', focus: TrainingCategory.IRON_PLAY, totalMinutes: 60,
            drills: { create: [{ order: 1, ...connect('lib-iron-17') }, { order: 2, ...connect('lib-drive-16') }, { order: 3, ...connect('lib-mgmt-02') }] },
          },
        ],
      },
    },
  });

  console.log('Seeded additional template plans.');
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
