import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const progressRouter = Router();
progressRouter.use(authMiddleware);

// GET Gesamtübersicht: Skill-Scores + Handicap-Verlauf + Rundenstatistiken
progressRouter.get('/overview', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const [assessments, handicapEntries, rounds, sessionLogs] = await Promise.all([
    prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, scores: true, weaknesses: true, createdAt: true },
    }),
    prisma.handicapEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.round.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      include: { scores: true },
    }),
    prisma.trainingSessionLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Aktuelle Skill-Scores (letztes Assessment)
  const latestAssessment = assessments[assessments.length - 1] ?? null;
  const skillRadar = latestAssessment
    ? (latestAssessment.scores as Record<string, number>)
    : null;

  // Skill-Verlauf (alle Assessments mit Datum)
  const skillHistory = assessments.map((a) => ({
    date: a.createdAt,
    scores: a.scores as Record<string, number>,
  }));

  // Handicap-Verlauf
  const handicapHistory = handicapEntries.map((e) => ({
    id: e.id,
    handicap: e.handicap,
    note: e.note,
    date: e.createdAt,
  }));

  // Rundenstatistiken: Score-Durchschnitt über die Zeit
  const roundHistory = rounds.map((r) => {
    const totalStrokes = r.scores.reduce((s, h) => s + h.strokes, 0);
    const totalPar = r.scores.reduce((s, h) => s + h.par, 0);
    const totalPutts = r.scores.reduce((s, h) => s + h.putts, 0);
    const gir = r.scores.filter((h) => h.greenInRegulation).length;
    const fir = r.scores.filter((h) => h.fairwayHit === true).length;
    const fairwayHoles = r.scores.filter((h) => h.fairwayHit !== null).length;
    return {
      id: r.id,
      date: r.date,
      totalStrokes,
      scoreToPar: totalStrokes - totalPar,
      avgPutts: totalPutts / r.scores.length,
      girPercent: Math.round((gir / r.scores.length) * 100),
      firPercent: fairwayHoles > 0 ? Math.round((fir / fairwayHoles) * 100) : null,
    };
  });

  // Trainingsstatistiken
  const trainingStats = {
    totalSessions: sessionLogs.length,
    avgFeeling: sessionLogs.length
      ? sessionLogs.reduce((s, l) => s + l.feeling, 0) / sessionLogs.length
      : null,
    avgDifficulty: sessionLogs.length
      ? sessionLogs.reduce((s, l) => s + l.difficulty, 0) / sessionLogs.length
      : null,
    recentSessions: sessionLogs.slice(-10).reverse(),
  };

  res.json({
    skillRadar,
    skillHistory,
    handicapHistory,
    roundHistory,
    trainingStats,
    latestWeaknesses: latestAssessment?.weaknesses ?? [],
  });
});

// POST neuen Handicap-Eintrag
progressRouter.post('/handicap', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    handicap: z.number().min(-10).max(54),
    note: z.string().max(200).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Ungültige Eingabe' }); return; }

  const entry = await prisma.handicapEntry.create({
    data: {
      userId: req.userId!,
      handicap: parsed.data.handicap,
      note: parsed.data.note,
    },
  });

  // User-Handicap auch aktualisieren
  await prisma.user.update({
    where: { id: req.userId! },
    data: { handicap: parsed.data.handicap },
  });

  res.status(201).json(entry);
});

// DELETE Handicap-Eintrag
progressRouter.delete('/handicap/:id', async (req: AuthRequest, res: Response) => {
  const entry = await prisma.handicapEntry.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!entry) { res.status(404).json({ error: 'Eintrag nicht gefunden' }); return; }
  await prisma.handicapEntry.delete({ where: { id: entry.id } });
  res.status(204).send();
});
