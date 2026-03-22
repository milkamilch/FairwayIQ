import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const notificationsRouter = Router();

const prefsSchema = z.object({
  pushToken:      z.string().optional().nullable(),
  notifTraining:  z.boolean().optional(),
  notifStreak:    z.boolean().optional(),
  notifWeather:   z.boolean().optional(),
  notifFriends:   z.boolean().optional(),
});

// GET /api/notifications/prefs
notificationsRouter.get('/prefs', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { pushToken: true, notifTraining: true, notifStreak: true, notifWeather: true, notifFriends: true },
  });
  res.json(user);
});

// PATCH /api/notifications/prefs
notificationsRouter.patch('/prefs', authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = prefsSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Ungültige Eingabe' }); return; }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: parsed.data,
    select: { pushToken: true, notifTraining: true, notifStreak: true, notifWeather: true, notifFriends: true },
  });
  res.json(user);
});
