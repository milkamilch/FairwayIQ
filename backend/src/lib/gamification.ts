import { prisma } from './prisma';

// ── Badge-Definitionen ─────────────────────────────────────────────────
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'sessions' | 'streak' | 'performance' | 'variety';
}

export const BADGES: BadgeDefinition[] = [
  // Sessions
  {
    id: 'first_steps',
    name: 'Erste Schritte',
    description: 'Deine erste Trainingseinheit abgeschlossen',
    icon: '🎯',
    color: '#00e87a',
    category: 'sessions',
  },
  {
    id: 'getting_started',
    name: 'Aufgewärmt',
    description: '5 Trainingseinheiten abgeschlossen',
    icon: '⛳',
    color: '#6ee7b7',
    category: 'sessions',
  },
  {
    id: 'consistent',
    name: 'Verlässlich',
    description: '10 Trainingseinheiten abgeschlossen',
    icon: '🏅',
    color: '#f59e0b',
    category: 'sessions',
  },
  {
    id: 'dedicated',
    name: 'Hingabe',
    description: '25 Trainingseinheiten abgeschlossen',
    icon: '🏆',
    color: '#f97316',
    category: 'sessions',
  },
  // Streak
  {
    id: 'on_fire',
    name: 'On Fire',
    description: '3 Tage in Folge trainiert',
    icon: '🔥',
    color: '#f97316',
    category: 'streak',
  },
  {
    id: 'week_warrior',
    name: 'Wochenkrieger',
    description: '7 Tage in Folge trainiert',
    icon: '⚡',
    color: '#a78bfa',
    category: 'streak',
  },
  {
    id: 'month_master',
    name: 'Monatsmeister',
    description: '30 Tage in Folge trainiert',
    icon: '👑',
    color: '#fbbf24',
    category: 'streak',
  },
  // Performance
  {
    id: 'iron_will',
    name: 'Eisenwille',
    description: 'Training trotz schlechtem Tag durchgezogen',
    icon: '💪',
    color: '#60a5fa',
    category: 'performance',
  },
  {
    id: 'high_achiever',
    name: 'Spitzenleistung',
    description: '5x das Gefühl "Großartig" nach dem Training',
    icon: '🌟',
    color: '#fbbf24',
    category: 'performance',
  },
  {
    id: 'sharp_shooter',
    name: 'Scharfschütze',
    description: '90%+ Trefferquote in einer Übung erreicht',
    icon: '🎖️',
    color: '#00e87a',
    category: 'performance',
  },
  // Variety
  {
    id: 'all_rounder',
    name: 'Allrounder',
    description: 'Alle 6 Trainingskategorien absolviert',
    icon: '🌐',
    color: '#f472b6',
    category: 'variety',
  },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.id, b]));

// ── Streak aktualisieren ───────────────────────────────────────────────
export async function updateStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number; isNewDay: boolean }> {
  const streak = await prisma.userStreak.findUnique({ where: { userId } });
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!streak) {
    const created = await prisma.userStreak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastTrainedAt: now },
    });
    return { currentStreak: created.currentStreak, longestStreak: created.longestStreak, isNewDay: true };
  }

  const lastDate = streak.lastTrainedAt
    ? new Date(streak.lastTrainedAt.getFullYear(), streak.lastTrainedAt.getMonth(), streak.lastTrainedAt.getDate())
    : null;

  const daysDiff = lastDate
    ? Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  let newStreak = streak.currentStreak;
  let isNewDay = false;

  if (daysDiff === 0) {
    // Already trained today — no streak change
  } else if (daysDiff === 1) {
    // Consecutive day
    newStreak = streak.currentStreak + 1;
    isNewDay = true;
  } else {
    // Streak broken
    newStreak = 1;
    isNewDay = true;
  }

  const newLongest = Math.max(streak.longestStreak, newStreak);

  const updated = await prisma.userStreak.update({
    where: { userId },
    data: { currentStreak: newStreak, longestStreak: newLongest, lastTrainedAt: now },
  });

  return { currentStreak: updated.currentStreak, longestStreak: updated.longestStreak, isNewDay };
}

// ── Badges auswerten und vergeben ─────────────────────────────────────
export async function evaluateAndAwardBadges(
  userId: string,
  currentStreak: number,
  sessionFeelingScore: number,
): Promise<string[]> {
  // Bestehende Badges laden
  const existing = await prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } });
  const earned = new Set(existing.map((b) => b.badgeId));

  // Daten sammeln
  const [allSessions, allDrillResults] = await Promise.all([
    prisma.trainingSessionLog.findMany({
      where: { userId },
      include: { userPlan: { include: { plan: { include: { days: { select: { focus: true } } } } } } },
    }),
    prisma.drillResult.findMany({ where: { userId } }),
  ]);

  const totalSessions = allSessions.length;
  const greatFeelingCount = allSessions.filter((s) => s.feeling === 5).length;

  // Trainierte Kategorien sammeln
  const trainedCategories = new Set<string>();
  for (const session of allSessions) {
    for (const day of session.userPlan.plan.days) {
      trainedCategories.add(day.focus);
    }
  }

  const toAward: string[] = [];

  const check = (badgeId: string, condition: boolean) => {
    if (!earned.has(badgeId) && condition) {
      toAward.push(badgeId);
    }
  };

  // Sessions
  check('first_steps', totalSessions >= 1);
  check('getting_started', totalSessions >= 5);
  check('consistent', totalSessions >= 10);
  check('dedicated', totalSessions >= 25);

  // Streak
  check('on_fire', currentStreak >= 3);
  check('week_warrior', currentStreak >= 7);
  check('month_master', currentStreak >= 30);

  // Performance
  check('iron_will', sessionFeelingScore <= 2);
  check('high_achiever', greatFeelingCount >= 5);
  check('sharp_shooter', allDrillResults.some((r) => r.attempts > 0 && r.hits / r.attempts >= 0.9));

  // Variety
  check('all_rounder', trainedCategories.size >= 6);

  // Badges in DB speichern
  if (toAward.length > 0) {
    await prisma.userBadge.createMany({
      data: toAward.map((badgeId) => ({ userId, badgeId })),
      skipDuplicates: true,
    });
  }

  return toAward;
}
