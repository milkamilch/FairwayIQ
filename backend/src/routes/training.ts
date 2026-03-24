import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { calculateScores, generatePlan, AssessmentAnswers } from '../lib/planGenerator';
import { generateWorkoutSummary } from '../lib/workoutSummary';
import { updateStreak, evaluateAndAwardBadges, BADGE_MAP } from '../lib/gamification';

export const trainingRouter = Router();

trainingRouter.use(authMiddleware);

// GET alle verfügbaren Template-Pläne
trainingRouter.get('/plans', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) { res.status(404).json({ error: 'Benutzer nicht gefunden' }); return; }

  const plans = await prisma.trainingPlan.findMany({
    where: { isTemplate: true },
    include: {
      days: {
        orderBy: { dayNumber: 'asc' },
        include: {
          drills: {
            orderBy: { order: 'asc' },
            include: { drill: true },
          },
        },
      },
    },
  });

  res.json(plans);
});

// GET aktiver Trainingsplan des Users
trainingRouter.get('/my-plan', async (req: AuthRequest, res: Response) => {
  const userPlan = await prisma.userTrainingPlan.findFirst({
    where: { userId: req.userId!, isActive: true },
    include: {
      plan: {
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              drills: {
                orderBy: { order: 'asc' },
                include: { drill: true },
              },
            },
          },
        },
      },
    },
  });

  if (!userPlan) {
    res.status(404).json({ error: 'Kein aktiver Trainingsplan' });
    return;
  }

  res.json(userPlan);
});

// POST Plan starten
trainingRouter.post('/plans/:planId/start', async (req: AuthRequest, res: Response) => {
  const { planId } = req.params;

  const plan = await prisma.trainingPlan.findUnique({ where: { id: planId } });
  if (!plan) { res.status(404).json({ error: 'Plan nicht gefunden' }); return; }

  // Bestehende aktive Pläne deaktivieren
  await prisma.userTrainingPlan.updateMany({
    where: { userId: req.userId!, isActive: true },
    data: { isActive: false },
  });

  const userPlan = await prisma.userTrainingPlan.upsert({
    where: { userId_planId: { userId: req.userId!, planId } },
    update: { isActive: true, currentDay: 1, completedDays: [], startDate: new Date() },
    create: {
      userId: req.userId!,
      planId,
      currentDay: 1,
      completedDays: [],
      isActive: true,
    },
    include: { plan: { include: { days: { include: { drills: { include: { drill: true } } } } } } },
  });

  res.status(201).json(userPlan);
});

// POST Tag als abgeschlossen markieren + Feedback speichern
trainingRouter.post('/my-plan/complete-day', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    dayNumber: z.number().int().positive(),
    feeling: z.number().int().min(1).max(5),      // 1=sehr schlecht … 5=großartig
    difficulty: z.number().int().min(1).max(5),    // 1=zu leicht … 5=zu schwer
    notes: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Ungültige Eingabe' }); return; }

  const { dayNumber, feeling, difficulty, notes } = parsed.data;

  const userPlan = await prisma.userTrainingPlan.findFirst({
    where: { userId: req.userId!, isActive: true },
  });
  if (!userPlan) { res.status(404).json({ error: 'Kein aktiver Trainingsplan' }); return; }

  const completedDays = Array.from(new Set([...userPlan.completedDays, dayNumber]));

  const [updated, sessionLog] = await prisma.$transaction([
    prisma.userTrainingPlan.update({
      where: { id: userPlan.id },
      data: { completedDays, currentDay: dayNumber + 1 },
    }),
    prisma.trainingSessionLog.create({
      data: {
        userId: req.userId!,
        userPlanId: userPlan.id,
        dayNumber,
        feeling,
        difficulty,
        notes,
      },
    }),
  ]);

  // Alle Session-Logs für diesen Plan (inkl. des neuen)
  const [allLogs, trainingDay, sessionDrillResults] = await Promise.all([
    prisma.trainingSessionLog.findMany({
      where: { userPlanId: userPlan.id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.trainingDay.findFirst({
      where: { planId: userPlan.planId, dayNumber },
      include: { drills: true },
    }),
    prisma.drillResult.findMany({
      where: { userPlanId: userPlan.id, dayNumber },
      include: { drill: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const sessionNumber = allLogs.length;
  const last3 = allLogs.slice(-3);

  // Adaptionsempfehlung: letzte 3 Sessions analysieren
  let adaptation: { direction: 'harder' | 'easier' | null; message: string } = {
    direction: null,
    message: '',
  };

  if (last3.length >= 3) {
    const avgDifficulty = last3.reduce((s, l) => s + l.difficulty, 0) / last3.length;
    if (avgDifficulty >= 4.2) {
      adaptation = {
        direction: 'easier',
        message: 'Die letzten Einheiten waren sehr anspruchsvoll. Möchtest du das Training etwas leichter gestalten?',
      };
    } else if (avgDifficulty <= 1.8) {
      adaptation = {
        direction: 'harder',
        message: 'Du meisterst das Training mit Leichtigkeit! Bereit für eine größere Herausforderung?',
      };
    }
  }

  // Workout-Zusammenfassung generieren
  const prevSessions = allLogs.slice(0, -1).slice(-3);
  const prevAvgDifficulty = prevSessions.length > 0
    ? prevSessions.reduce((s, l) => s + l.difficulty, 0) / prevSessions.length
    : null;

  const summary = trainingDay
    ? generateWorkoutSummary({
        feeling,
        difficulty,
        focus: trainingDay.focus,
        drillCount: trainingDay.drills.length,
        sessionNumber,
        prevAvgDifficulty,
        notes,
        drillResults: sessionDrillResults.map((r) => ({
          drillName: r.drill.name,
          hits: r.hits,
          attempts: r.attempts,
        })),
      })
    : null;

  // Streak + Badges berechnen
  const streakData = await updateStreak(req.userId!);
  const newBadgeIds = await evaluateAndAwardBadges(req.userId!, streakData.currentStreak, feeling);
  const newBadges = newBadgeIds.map((id) => BADGE_MAP[id]).filter(Boolean);

  res.json({ updated, sessionLog, adaptation, summary, streak: streakData, newBadges });
});

// GET Session-Logs des aktiven Plans
trainingRouter.get('/my-plan/logs', async (req: AuthRequest, res: Response) => {
  const userPlan = await prisma.userTrainingPlan.findFirst({
    where: { userId: req.userId!, isActive: true },
  });
  if (!userPlan) { res.status(404).json({ error: 'Kein aktiver Trainingsplan' }); return; }

  const logs = await prisma.trainingSessionLog.findMany({
    where: { userPlanId: userPlan.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json(logs);
});

// POST Assessment auswerten + Plan generieren
trainingRouter.post('/assess', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    weeklyHours: z.number().min(1).max(20),
    mainGoal: z.enum(['handicap', 'consistency', 'enjoyment', 'compete']),
    puttsPerRound: z.number().min(18).max(60),
    shortPuttConfidence: z.number().min(1).max(5),
    puttingMiss: z.enum(['distance', 'line', 'both', 'none']),
    upAndDownPercent: z.number().min(0).max(100),
    bunkerConfidence: z.number().min(1).max(5),
    chippingMiss: z.enum(['thin', 'fat', 'direction', 'none']),
    girPercent: z.number().min(0).max(100),
    ironConsistency: z.number().min(1).max(5),
    ironMiss: z.enum(['left', 'right', 'short', 'long', 'inconsistent']),
    firPercent: z.number().min(0).max(100),
    driverConfidence: z.number().min(1).max(5),
    driverMiss: z.enum(['left', 'right', 'slice', 'hook', 'distance', 'none']),
    knowsDistances: z.number().min(1).max(5),
    playsStrategically: z.number().min(1).max(5),
    handlesPressure: z.number().min(1).max(5),
    recoversFromBadHoles: z.number().min(1).max(5),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() });
    return;
  }

  const answers = parsed.data as AssessmentAnswers;
  const scores = calculateScores(answers);
  const plan = generatePlan(answers, scores);

  // Assessment speichern
  const assessment = await prisma.assessment.create({
    data: {
      userId: req.userId!,
      answers: answers as any,
      scores: scores as any,
      weaknesses: plan.weaknesses,
    },
  });

  // Trainingspläne in DB speichern
  const savedPlan = await prisma.trainingPlan.create({
    data: {
      name: plan.name,
      description: plan.description,
      targetLevel: 'INTERMEDIATE',
      durationWeeks: plan.durationWeeks,
      isTemplate: false,
      days: {
        create: plan.days.map((day) => ({
          dayNumber: day.dayNumber,
          title: day.title,
          focus: day.focus,
          totalMinutes: day.totalMinutes,
          drills: {
            create: day.drills.map((drill, order) => ({
              order,
              drill: {
                create: {
                  name: drill.name,
                  description: drill.description,
                  duration: drill.duration,
                  category: day.focus,
                  difficulty: drill.difficulty,
                  tips: drill.tips,
                },
              },
            })),
          },
        })),
      },
    },
    include: {
      days: {
        orderBy: { dayNumber: 'asc' },
        include: { drills: { include: { drill: true } } },
      },
    },
  });

  // Direkt als aktiven Plan des Users setzen
  await prisma.userTrainingPlan.updateMany({
    where: { userId: req.userId!, isActive: true },
    data: { isActive: false },
  });

  const userPlan = await prisma.userTrainingPlan.create({
    data: {
      userId: req.userId!,
      planId: savedPlan.id,
      currentDay: 1,
      completedDays: [],
      isActive: true,
    },
  });

  res.status(201).json({
    assessment: { id: assessment.id, scores, weaknesses: plan.weaknesses, strengths: plan.strengths },
    plan: savedPlan,
    userPlan,
  });
});

// POST Drill-Ergebnis speichern (Treffer/Versuche)
trainingRouter.post('/drills/:drillId/result', async (req: AuthRequest, res: Response) => {
  const { drillId } = req.params;
  const schema = z.object({
    hits: z.number().int().min(0).max(1000),
    attempts: z.number().int().min(1).max(1000),
    userPlanId: z.string().optional(),
    dayNumber: z.number().int().positive().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Ungültige Eingabe' }); return; }

  const drill = await prisma.trainingDrill.findUnique({ where: { id: drillId } });
  if (!drill) { res.status(404).json({ error: 'Übung nicht gefunden' }); return; }

  const result = await prisma.drillResult.create({
    data: {
      userId: req.userId!,
      drillId,
      hits: parsed.data.hits,
      attempts: parsed.data.attempts,
      userPlanId: parsed.data.userPlanId,
      dayNumber: parsed.data.dayNumber,
    },
  });

  res.status(201).json(result);
});

// GET Drill-Historie für einen Drill (letzten 10 Einträge)
trainingRouter.get('/drills/:drillId/results', async (req: AuthRequest, res: Response) => {
  const { drillId } = req.params;

  const results = await prisma.drillResult.findMany({
    where: { userId: req.userId!, drillId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  // Aggregierte Stats mitliefern
  const stats = results.length > 0 ? {
    totalSessions: results.length,
    bestRate: Math.max(...results.map((r) => r.hits / r.attempts)),
    lastRate: results[results.length - 1].hits / results[results.length - 1].attempts,
    trend: results.length >= 2
      ? (results[results.length - 1].hits / results[results.length - 1].attempts) -
        (results[results.length - 2].hits / results[results.length - 2].attempts)
      : 0,
  } : null;

  res.json({ results, stats });
});

// GET Übungsbibliothek mit Suche + Filter
trainingRouter.get('/library', async (req: AuthRequest, res: Response) => {
  const { search, category, difficulty } = req.query as {
    search?: string;
    category?: string;
    difficulty?: string;
  };

  const homeOnly = req.query.home === 'true';

  const drills = await prisma.trainingDrill.findMany({
    where: {
      isLibrary: true,
      ...(homeOnly ? { canDoAtHome: true } : {}),
      ...(category ? { category: category as any } : {}),
      ...(difficulty ? { difficulty: difficulty as any } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    orderBy: [
      { category: 'asc' },
      { difficulty: 'asc' },
      { name: 'asc' },
    ],
  });

  res.json(drills);
});

// GET letztes Assessment des Users
trainingRouter.get('/assessment', async (req: AuthRequest, res: Response) => {
  const assessment = await prisma.assessment.findFirst({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
  });
  if (!assessment) { res.status(404).json({ error: 'Kein Assessment vorhanden' }); return; }
  res.json(assessment);
});
