import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const goalsRouter = Router();
goalsRouter.use(authMiddleware);

const goalSchema = z.object({
  type: z.enum(['HCP_TARGET', 'ROUNDS_COUNT', 'SCORE_TARGET', 'CUSTOM']),
  title: z.string().min(1).max(100),
  targetValue: z.number().optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
});

goalsRouter.get('/', async (req: AuthRequest, res: Response) => {
  const goals = await prisma.userGoal.findMany({
    where: { userId: req.userId! },
    orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
  });
  res.json(goals);
});

goalsRouter.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() });
    return;
  }
  const { deadline, ...rest } = parsed.data;
  const goal = await prisma.userGoal.create({
    data: {
      userId: req.userId!,
      ...rest,
      ...(deadline ? { deadline: new Date(deadline) } : {}),
    },
  });
  res.status(201).json(goal);
});

goalsRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  const updateSchema = goalSchema.partial().extend({
    isCompleted: z.boolean().optional(),
  });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.userGoal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Ziel nicht gefunden' }); return; }

  const { deadline, isCompleted, ...rest } = parsed.data;
  const goal = await prisma.userGoal.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
      ...(isCompleted !== undefined ? {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      } : {}),
    },
  });
  res.json(goal);
});

goalsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.userGoal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Ziel nicht gefunden' }); return; }
  await prisma.userGoal.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
