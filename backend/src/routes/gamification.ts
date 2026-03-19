import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { BADGES, BADGE_MAP } from '../lib/gamification';

export const gamificationRouter = Router();
gamificationRouter.use(authMiddleware);

// GET Gamification-Status (Streak + Badges + Tagessziel)
gamificationRouter.get('/status', async (req: AuthRequest, res: Response) => {
  const [streak, earnedBadges, totalSessions, activePlan] = await Promise.all([
    prisma.userStreak.findUnique({ where: { userId: req.userId! } }),
    prisma.userBadge.findMany({ where: { userId: req.userId! }, orderBy: { earnedAt: 'desc' } }),
    prisma.trainingSessionLog.count({ where: { userId: req.userId! } }),
    prisma.userTrainingPlan.findFirst({
      where: { userId: req.userId!, isActive: true },
      select: { completedDays: true, currentDay: true, plan: { select: { days: { select: { dayNumber: true } } } } },
    }),
  ]);

  // Tagessziel: Heutiges Training abgeschlossen?
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySession = await prisma.trainingSessionLog.findFirst({
    where: { userId: req.userId!, createdAt: { gte: todayStart } },
  });

  const dailyGoal = {
    completed: !!todaySession,
    currentDay: activePlan?.currentDay ?? null,
    totalDays: activePlan?.plan.days.length ?? null,
    hasActivePlan: !!activePlan,
  };

  // Alle Badges mit earned-Status anreichern
  const earnedSet = new Set(earnedBadges.map((b) => b.badgeId));
  const earnedMap = Object.fromEntries(earnedBadges.map((b) => [b.badgeId, b.earnedAt]));

  const allBadges = BADGES.map((badge) => ({
    ...badge,
    earned: earnedSet.has(badge.id),
    earnedAt: earnedMap[badge.id] ?? null,
  }));

  res.json({
    streak: streak ?? { currentStreak: 0, longestStreak: 0, lastTrainedAt: null },
    badges: allBadges,
    totalSessions,
    dailyGoal,
  });
});
