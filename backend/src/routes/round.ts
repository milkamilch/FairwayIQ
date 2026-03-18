import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const roundRouter = Router();

roundRouter.use(authMiddleware);

const holeScoreSchema = z.object({
  holeNumber: z.number().int().min(1).max(18),
  par: z.number().int().min(3).max(5),
  strokes: z.number().int().min(1).max(20),
  putts: z.number().int().min(0).max(10),
  fairwayHit: z.boolean().nullable(),
  greenInRegulation: z.boolean(),
  penalties: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

const roundSchema = z.object({
  courseId: z.string(),
  date: z.string(),
  scores: z.array(holeScoreSchema).min(1).max(18),
  weather: z.string().optional(),
  notes: z.string().optional(),
});

function calculateStats(scores: z.infer<typeof holeScoreSchema>[]) {
  const totalStrokes = scores.reduce((s, h) => s + h.strokes, 0);
  const totalPutts = scores.reduce((s, h) => s + h.putts, 0);
  const totalPar = scores.reduce((s, h) => s + h.par, 0);
  const fairwaysTotal = scores.filter((h) => h.fairwayHit !== null).length;
  const fairwaysHit = scores.filter((h) => h.fairwayHit === true).length;
  const greensInRegulation = scores.filter((h) => h.greenInRegulation).length;
  const totalPenalties = scores.reduce((s, h) => s + h.penalties, 0);

  const front = scores.filter((h) => h.holeNumber <= 9).reduce((s, h) => s + h.strokes, 0);
  const back = scores.filter((h) => h.holeNumber >= 10).reduce((s, h) => s + h.strokes, 0);

  return {
    totalStrokes,
    totalPutts,
    fairwaysHit,
    fairwaysTotal,
    greensInRegulation,
    totalPenalties,
    scoreToPar: totalStrokes - totalPar,
    frontNine: front,
    backNine: back,
  };
}

// GET alle Runden des Users
roundRouter.get('/', async (req: AuthRequest, res: Response) => {
  const rounds = await prisma.round.findMany({
    where: { userId: req.userId! },
    include: {
      scores: { orderBy: { holeNumber: 'asc' } },
      course: { select: { id: true, name: true, location: true, totalPar: true } },
    },
    orderBy: { date: 'desc' },
  });

  res.json(rounds);
});

// GET einzelne Runde
roundRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const round = await prisma.round.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: {
      scores: { orderBy: { holeNumber: 'asc' } },
      course: true,
    },
  });

  if (!round) { res.status(404).json({ error: 'Runde nicht gefunden' }); return; }
  res.json(round);
});

// POST neue Runde erfassen
roundRouter.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = roundSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() });
    return;
  }

  const { courseId, date, scores, weather, notes } = parsed.data;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) { res.status(404).json({ error: 'Platz nicht gefunden' }); return; }

  const round = await prisma.round.create({
    data: {
      userId: req.userId!,
      courseId,
      date: new Date(date),
      weather,
      notes,
      scores: {
        create: scores.map((s) => ({
          holeNumber: s.holeNumber,
          par: s.par,
          strokes: s.strokes,
          putts: s.putts,
          fairwayHit: s.fairwayHit,
          greenInRegulation: s.greenInRegulation,
          penalties: s.penalties,
          notes: s.notes,
        })),
      },
    },
    include: {
      scores: { orderBy: { holeNumber: 'asc' } },
      course: { select: { id: true, name: true, location: true, totalPar: true } },
    },
  });

  const stats = calculateStats(scores);
  res.status(201).json({ ...round, stats });
});

// GET Statistiken des Users
roundRouter.get('/stats/overview', async (req: AuthRequest, res: Response) => {
  const rounds = await prisma.round.findMany({
    where: { userId: req.userId! },
    include: { scores: true },
    orderBy: { date: 'desc' },
    take: 20,
  });

  if (rounds.length === 0) {
    res.json({ rounds: 0, avgScore: null, bestScore: null, avgPutts: null, fairwayAvg: null, girAvg: null });
    return;
  }

  const stats = rounds.map((r) => calculateStats(r.scores.map((s) => ({
    holeNumber: s.holeNumber,
    par: s.par,
    strokes: s.strokes,
    putts: s.putts,
    fairwayHit: s.fairwayHit,
    greenInRegulation: s.greenInRegulation,
    penalties: s.penalties,
  }))));

  const avgScore = stats.reduce((s, r) => s + r.scoreToPar, 0) / stats.length;
  const bestScore = Math.min(...stats.map((r) => r.scoreToPar));
  const avgPutts = stats.reduce((s, r) => s + r.totalPutts, 0) / stats.length;
  const fairwayAvg = stats.reduce((s, r) => s + (r.fairwaysTotal > 0 ? r.fairwaysHit / r.fairwaysTotal : 0), 0) / stats.length;
  const girAvg = stats.reduce((s, r) => s + r.greensInRegulation / 18, 0) / stats.length;

  res.json({
    rounds: rounds.length,
    avgScore: Math.round(avgScore * 10) / 10,
    bestScore,
    avgPutts: Math.round(avgPutts * 10) / 10,
    fairwayAvg: Math.round(fairwayAvg * 100),
    girAvg: Math.round(girAvg * 100),
  });
});

// DELETE Runde löschen
roundRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const round = await prisma.round.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });

  if (!round) { res.status(404).json({ error: 'Runde nicht gefunden' }); return; }

  await prisma.round.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
