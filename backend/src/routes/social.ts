import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const socialRouter = Router();
socialRouter.use(authMiddleware);

// ── Helpers ───────────────────────────────────────────────────────────
const USER_PUBLIC = {
  id: true, name: true, handicap: true, level: true, homeClub: true,
} as const;

function calcStats(scores: { strokes: number; par: number; putts: number; greenInRegulation: boolean; fairwayHit: boolean | null }[]) {
  const gross = scores.reduce((s, h) => s + h.strokes, 0);
  const par = scores.reduce((s, h) => s + h.par, 0);
  return { gross, scoreToPar: gross - par, putts: scores.reduce((s, h) => s + h.putts, 0) };
}

// ── Search users ──────────────────────────────────────────────────────
socialRouter.get('/search', async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 2) { res.json([]); return; }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: req.userId! } },
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
      ],
    },
    select: USER_PUBLIC,
    take: 20,
  });

  // Attach friendship status for each result
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: req.userId!, addresseeId: { in: users.map((u) => u.id) } },
        { addresseeId: req.userId!, requesterId: { in: users.map((u) => u.id) } },
      ],
    },
  });

  const result = users.map((u) => {
    const fs = friendships.find((f) =>
      (f.requesterId === req.userId && f.addresseeId === u.id) ||
      (f.addresseeId === req.userId && f.requesterId === u.id),
    );
    return { ...u, friendshipId: fs?.id ?? null, friendshipStatus: fs?.status ?? null, isSender: fs?.requesterId === req.userId };
  });

  res.json(result);
});

// ── Get friends ───────────────────────────────────────────────────────
socialRouter.get('/friends', async (req: AuthRequest, res: Response) => {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: req.userId! }, { addresseeId: req.userId! }],
    },
    include: {
      requester: { select: USER_PUBLIC },
      addressee: { select: USER_PUBLIC },
    },
    orderBy: { createdAt: 'desc' },
  });

  const friends = friendships.map((f) => {
    const friend = f.requesterId === req.userId ? f.addressee : f.requester;
    return { friendshipId: f.id, ...friend };
  });

  res.json(friends);
});

// ── Get pending requests (incoming) ──────────────────────────────────
socialRouter.get('/requests', async (req: AuthRequest, res: Response) => {
  const requests = await prisma.friendship.findMany({
    where: { addresseeId: req.userId!, status: 'PENDING' },
    include: { requester: { select: USER_PUBLIC } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(requests.map((r) => ({ friendshipId: r.id, createdAt: r.createdAt, ...r.requester })));
});

// ── Send friend request ───────────────────────────────────────────────
socialRouter.post('/request', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    email: z.string().email().optional(),
    userId: z.string().optional(),
  }).refine((d) => d.email || d.userId, { message: 'email oder userId erforderlich' });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Ungültige Eingabe' }); return; }
  const { email, userId } = parsed.data;

  const target = await (email
    ? prisma.user.findUnique({ where: { email }, select: USER_PUBLIC })
    : prisma.user.findUnique({ where: { id: userId! }, select: USER_PUBLIC }));
  if (!target) { res.status(404).json({ error: 'Benutzer nicht gefunden' }); return; }
  if (target.id === req.userId) { res.status(400).json({ error: 'Du kannst dich nicht selbst hinzufügen' }); return; }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: req.userId!, addresseeId: target.id },
        { requesterId: target.id, addresseeId: req.userId! },
      ],
    },
  });
  if (existing) {
    res.status(409).json({ error: existing.status === 'ACCEPTED' ? 'Bereits befreundet' : 'Anfrage bereits gesendet oder ausstehend' });
    return;
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId: req.userId!, addresseeId: target.id },
    include: { addressee: { select: USER_PUBLIC } },
  });

  res.status(201).json({ friendshipId: friendship.id, ...friendship.addressee });
});

// ── Accept friend request ─────────────────────────────────────────────
socialRouter.put('/request/:id/accept', async (req: AuthRequest, res: Response) => {
  const friendship = await prisma.friendship.findFirst({
    where: { id: req.params.id, addresseeId: req.userId!, status: 'PENDING' },
  });
  if (!friendship) { res.status(404).json({ error: 'Anfrage nicht gefunden' }); return; }

  const updated = await prisma.friendship.update({
    where: { id: req.params.id },
    data: { status: 'ACCEPTED' },
    include: { requester: { select: USER_PUBLIC } },
  });
  res.json({ friendshipId: updated.id, ...updated.requester });
});

// ── Decline / remove friendship ───────────────────────────────────────
socialRouter.delete('/friends/:id', async (req: AuthRequest, res: Response) => {
  const friendship = await prisma.friendship.findFirst({
    where: {
      id: req.params.id,
      OR: [{ requesterId: req.userId! }, { addresseeId: req.userId! }],
    },
  });
  if (!friendship) { res.status(404).json({ error: 'Nicht gefunden' }); return; }
  await prisma.friendship.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ── Leaderboard ───────────────────────────────────────────────────────
socialRouter.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  const scope = req.query.scope === 'friends' ? 'friends' : 'global';

  let userIds: string[] | undefined;
  if (scope === 'friends') {
    const friendships = await prisma.friendship.findMany({
      where: { status: 'ACCEPTED', OR: [{ requesterId: req.userId! }, { addresseeId: req.userId! }] },
    });
    userIds = [
      req.userId!,
      ...friendships.map((f) => f.requesterId === req.userId ? f.addresseeId : f.requesterId),
    ];
  }

  const users = await prisma.user.findMany({
    where: userIds ? { id: { in: userIds } } : {},
    select: {
      ...USER_PUBLIC,
      rounds: {
        select: { scores: { select: { strokes: true, par: true } } },
        orderBy: { date: 'desc' },
        take: 20,
      },
    },
    take: scope === 'global' ? 50 : undefined,
  });

  const ranked = users
    .map((u) => {
      const roundStats = u.rounds.map((r) => {
        const gross = r.scores.reduce((s, h) => s + h.strokes, 0);
        const par = r.scores.reduce((s, h) => s + h.par, 0);
        return gross - par;
      });
      const avgScore = roundStats.length > 0 ? roundStats.reduce((a, b) => a + b, 0) / roundStats.length : null;
      const bestScore = roundStats.length > 0 ? Math.min(...roundStats) : null;
      return {
        id: u.id,
        name: u.name,
        handicap: u.handicap,
        level: u.level,
        homeClub: u.homeClub,
        rounds: u.rounds.length,
        avgScore: avgScore != null ? Math.round(avgScore * 10) / 10 : null,
        bestScore,
        isMe: u.id === req.userId,
      };
    })
    .sort((a, b) => {
      // Sort by HCP asc (lower = better), then by avgScore
      if (a.handicap != null && b.handicap != null) return a.handicap - b.handicap;
      if (a.handicap != null) return -1;
      if (b.handicap != null) return 1;
      return 0;
    })
    .map((u, i) => ({ ...u, rank: i + 1 }));

  res.json(ranked);
});

// ── View user profile (respects privacy) ─────────────────────────────
socialRouter.get('/users/:userId', async (req: AuthRequest, res: Response) => {
  const targetId = req.params.userId;
  const requesterId = req.userId!;

  const PROFILE_SELECT = {
    id: true, name: true, level: true, homeClub: true, handicap: true,
    profileVisibility: true, showHandicap: true, showStats: true, showGoals: true,
  } as const;

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: PROFILE_SELECT });
  if (!target) { res.status(404).json({ error: 'User not found' }); return; }

  const isSelf = targetId === requesterId;

  if (!isSelf && target.profileVisibility !== 'PUBLIC') {
    if (target.profileVisibility === 'PRIVATE') {
      res.json({ id: target.id, name: target.name, level: target.level, homeClub: null, isPrivate: true });
      return;
    }
    // FRIENDS
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId, addresseeId: targetId },
          { requesterId: targetId, addresseeId: requesterId },
        ],
      },
    });
    if (!friendship) {
      res.json({ id: target.id, name: target.name, level: target.level, homeClub: null, isPrivate: true });
      return;
    }
  }

  const response: Record<string, unknown> = {
    id: target.id,
    name: target.name,
    level: target.level,
    homeClub: target.homeClub,
    isPrivate: false,
  };

  if (isSelf || target.showHandicap) response.handicap = target.handicap;

  if (isSelf || target.showStats) {
    const rounds = await prisma.round.findMany({
      where: { userId: targetId },
      include: { scores: { select: { strokes: true, par: true } } },
      orderBy: { date: 'desc' },
      take: 20,
    });
    const diffs = rounds
      .map((r) => {
        const gross = r.scores.reduce((s, h) => s + h.strokes, 0);
        const par = r.scores.reduce((s, h) => s + h.par, 0);
        return gross - par;
      })
      .filter((d) => isFinite(d));
    response.stats = {
      rounds: rounds.length,
      bestScore: diffs.length > 0 ? Math.min(...diffs) : null,
      avgScore: diffs.length > 0 ? Math.round((diffs.reduce((a, b) => a + b, 0) / diffs.length) * 10) / 10 : null,
    };
  }

  if (isSelf || target.showGoals) {
    response.goals = await prisma.userGoal.findMany({
      where: { userId: targetId, isCompleted: false },
      select: { id: true, type: true, title: true, targetValue: true, deadline: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  res.json(response);
});

// ── Friends' activity feed ────────────────────────────────────────────
socialRouter.get('/feed', async (req: AuthRequest, res: Response) => {
  const friendships = await prisma.friendship.findMany({
    where: { status: 'ACCEPTED', OR: [{ requesterId: req.userId! }, { addresseeId: req.userId! }] },
  });
  const friendIds = friendships.map((f) => f.requesterId === req.userId ? f.addresseeId : f.requesterId);
  const feedUserIds = [req.userId!, ...friendIds];

  const rounds = await prisma.round.findMany({
    where: { userId: { in: feedUserIds } },
    include: {
      user: { select: { id: true, name: true, level: true, handicap: true } },
      course: { select: { id: true, name: true, location: true } },
      scores: { select: { strokes: true, par: true, putts: true, greenInRegulation: true, fairwayHit: true } },
    },
    orderBy: { date: 'desc' },
    take: 30,
  });

  const feed = rounds.map((r) => {
    const s = calcStats(r.scores);
    const gir = r.scores.filter((h) => h.greenInRegulation).length;
    return {
      id: r.id,
      date: r.date,
      user: r.user,
      course: r.course,
      gross: s.gross,
      scoreToPar: s.scoreToPar,
      putts: s.putts,
      gir,
    };
  });

  res.json(feed);
});
