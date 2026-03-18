import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

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

// POST Tag als abgeschlossen markieren
trainingRouter.post('/my-plan/complete-day', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ dayNumber: z.number().int().positive() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Ungültige Eingabe' }); return; }

  const { dayNumber } = parsed.data;

  const userPlan = await prisma.userTrainingPlan.findFirst({
    where: { userId: req.userId!, isActive: true },
  });

  if (!userPlan) { res.status(404).json({ error: 'Kein aktiver Trainingsplan' }); return; }

  const completedDays = Array.from(new Set([...userPlan.completedDays, dayNumber]));

  const updated = await prisma.userTrainingPlan.update({
    where: { id: userPlan.id },
    data: {
      completedDays,
      currentDay: dayNumber + 1,
    },
  });

  res.json(updated);
});
