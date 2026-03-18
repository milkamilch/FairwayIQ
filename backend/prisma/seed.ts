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
