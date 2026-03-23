import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const courseRouter = Router();

courseRouter.use(authMiddleware);

const hazardSchema = z.object({
  type: z.enum(['WATER', 'BUNKER', 'OB', 'ROUGH', 'TREES']),
  description: z.string(),
  position: z.enum(['LEFT', 'RIGHT', 'CENTER', 'LONG', 'SHORT']),
});

const holeSchema = z.object({
  number: z.number().int().min(1).max(18),
  par: z.number().int().min(3).max(5),
  strokeIndex: z.number().int().min(1).max(18),
  distanceMeters: z.number().int().positive(),
  hazards: z.array(hazardSchema).optional().default([]),
});

const teeSchema = z.object({
  name: z.string().min(1),
  color: z.enum(['yellow', 'blue', 'red', 'white']),
  rating: z.number().optional(),
  slope: z.number().optional(),
  distances: z.record(z.string(), z.number()).optional(),
});

const courseSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  isPublic: z.boolean().optional().default(false),
  rating: z.number().optional(),
  slope: z.number().optional(),
  holes: z.array(holeSchema).length(18),
  tees: z.array(teeSchema).optional().default([]),
});

// GET eigene Plätze des Users
courseRouter.get('/', async (req: AuthRequest, res: Response) => {
  const courses = await prisma.course.findMany({
    where: { createdBy: req.userId! },
    include: {
      holes: { orderBy: { number: 'asc' } },
      tees: { orderBy: { name: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(courses);
});

// GET /courses/api-search?q= — sucht live in der Golf Course API
courseRouter.get('/api-search', async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 2) { res.json([]); return; }

  const apiKey = process.env.GOLF_COURSE_API_KEY;
  if (!apiKey) { res.status(503).json({ error: 'Golf Course API nicht konfiguriert' }); return; }

  let apiRes: globalThis.Response;
  try {
    apiRes = await fetch(
      `https://api.golfcourseapi.com/v1/search?search_query=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Key ${apiKey}` } },
    );
  } catch {
    res.status(502).json({ error: 'Golf Course API nicht erreichbar' });
    return;
  }

  if (!apiRes.ok) { res.status(502).json({ error: 'Golf Course API nicht erreichbar' }); return; }

  const data: any = await apiRes.json();
  const courses = (data.courses ?? []).slice(0, 15).map((c: any) => {
    const allTees = [...(c.tees?.male ?? []), ...(c.tees?.female ?? [])];
    const tee = allTees.find((t: any) => t.holes?.length >= 9) ?? allTees[0] ?? null;
    const locationParts = [c.location?.city, c.location?.state, c.location?.country].filter(Boolean);
    return {
      apiId: String(c.id),
      name: c.course_name && c.course_name !== c.club_name
        ? `${c.club_name} – ${c.course_name}`
        : c.club_name,
      location: locationParts.join(', ') || c.location?.address || '',
      totalPar: tee?.par_total ?? 72,
      rating: tee?.course_rating ?? null,
      slope: tee?.slope_rating ?? null,
      hasHoles: (tee?.holes?.length ?? 0) >= 9,
      rawTee: tee, // nur für POST /from-api genutzt
    };
  });

  res.json(courses);
});

// POST /courses/from-api — ausgewählten API-Platz beim User speichern
courseRouter.post('/from-api', async (req: AuthRequest, res: Response) => {
  const { apiId } = req.body;
  if (!apiId) { res.status(400).json({ error: 'apiId fehlt' }); return; }

  // Schon beim User gespeichert?
  const existing = await prisma.course.findFirst({
    where: { apiId: String(apiId), createdBy: req.userId! },
    include: { holes: { orderBy: { number: 'asc' }, include: { hazards: true, strategy: true } } },
  });
  if (existing) { res.json(existing); return; }

  const apiKey = process.env.GOLF_COURSE_API_KEY;
  if (!apiKey) { res.status(503).json({ error: 'Golf Course API nicht konfiguriert' }); return; }

  let detail: any;
  try {
    const apiRes = await fetch(
      `https://api.golfcourseapi.com/v1/courses/${apiId}`,
      { headers: { Authorization: `Key ${apiKey}` } },
    );
    if (!apiRes.ok) { res.status(502).json({ error: 'Platz konnte nicht von der API geladen werden' }); return; }
    const raw = await apiRes.json() as any;
    // API gibt entweder direkt das Objekt oder unter einem 'course'-Key zurück
    detail = raw.course ?? raw;
    console.log('[from-api] API response keys:', Object.keys(detail));
    console.log('[from-api] club_name:', detail.club_name, '| course_name:', detail.course_name);
  } catch {
    res.status(502).json({ error: 'Golf Course API nicht erreichbar' }); return;
  }

  const allTees = [...(detail.tees?.male ?? []), ...(detail.tees?.female ?? [])];
  const priority = ['white', 'yellow', 'gelb', 'weiß', 'blue'];
  const tee = allTees.find((t: any) =>
    priority.some((p) => t.tee_name?.toLowerCase().includes(p)) && t.holes?.length >= 9
  ) ?? allTees.find((t: any) => t.holes?.length >= 9) ?? null;

  const locationParts = [detail.location?.city, detail.location?.state, detail.location?.country].filter(Boolean);
  const name = detail.course_name && detail.course_name !== detail.club_name
    ? `${detail.club_name} – ${detail.course_name}` : detail.club_name;

  try {
    const course = await prisma.course.create({
      data: {
        apiId: String(detail.id),
        name,
        location: locationParts.join(', ') || detail.location?.address || '',
        totalPar: tee?.par_total ?? 72,
        rating: tee?.course_rating ?? null,
        slope: tee?.slope_rating ?? null,
        holesImported: (tee?.holes?.length ?? 0) >= 9,
        createdBy: req.userId!,
        ...(tee?.holes?.length >= 9 ? {
          holes: {
            create: tee.holes.map((h: any, i: number) => ({
              number: i + 1,
              par: h.par,
              strokeIndex: h.handicap ?? 0,
              distanceMeters: Math.round((h.yardage ?? 0) * 0.9144),
            })),
          },
        } : {}),
      },
      include: { holes: { orderBy: { number: 'asc' }, include: { hazards: true, strategy: true } } },
    });
    res.status(201).json(course);
  } catch (err: any) {
    console.error('[from-api] DB error:', err.message);
    res.status(500).json({ error: 'Platz konnte nicht gespeichert werden' });
  }
});

// GET einzelner Platz
courseRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const course = await prisma.course.findFirst({
    where: { id: req.params.id, createdBy: req.userId! },
    include: {
      holes: {
        orderBy: { number: 'asc' },
        include: { hazards: true, strategy: true },
      },
      tees: { orderBy: { name: 'asc' } },
    },
  });

  if (!course) { res.status(404).json({ error: 'Platz nicht gefunden' }); return; }
  res.json(course);
});

// POST neuen Platz anlegen
courseRouter.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = courseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() });
    return;
  }

  const { holes, tees, ...courseData } = parsed.data;
  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);

  const course = await prisma.course.create({
    data: {
      ...courseData,
      totalPar,
      createdBy: req.userId!,
      holes: {
        create: holes.map((hole) => ({
          number: hole.number,
          par: hole.par,
          strokeIndex: hole.strokeIndex,
          distanceMeters: hole.distanceMeters,
          hazards: {
            create: hole.hazards.map((h) => ({
              type: h.type,
              description: h.description,
              position: h.position,
            })),
          },
        })),
      },
      ...(tees.length > 0 && {
        tees: {
          create: tees.map((tee) => ({
            name: tee.name,
            color: tee.color,
            rating: tee.rating ?? null,
            slope: tee.slope ?? null,
            distances: tee.distances ?? Prisma.JsonNull,
          })),
        },
      }),
    },
    include: {
      holes: { include: { hazards: true, strategy: true } },
      tees: { orderBy: { name: 'asc' } },
    },
  });

  res.status(201).json(course);
});

// PUT Strategie für ein Loch speichern
courseRouter.put('/:courseId/holes/:holeNumber/strategy', async (req: AuthRequest, res: Response) => {
  const strategySchema = z.object({
    recommendedClub: z.string(),
    shotShape: z.enum(['STRAIGHT', 'FADE', 'DRAW']),
    aimPoint: z.string(),
    avoidance: z.string(),
    notes: z.string(),
  });

  const parsed = strategySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Eingabe' });
    return;
  }

  const hole = await prisma.hole.findFirst({
    where: {
      number: parseInt(req.params.holeNumber),
      courseId: req.params.courseId,
      course: { createdBy: req.userId! },
    },
  });

  if (!hole) { res.status(404).json({ error: 'Loch nicht gefunden' }); return; }

  const strategy = await prisma.holeStrategy.upsert({
    where: { holeId: hole.id },
    update: parsed.data,
    create: { ...parsed.data, holeId: hole.id },
  });

  res.json(strategy);
});

// DELETE Platz löschen
courseRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const course = await prisma.course.findFirst({
    where: { id: req.params.id, createdBy: req.userId! },
  });

  if (!course) { res.status(404).json({ error: 'Platz nicht gefunden' }); return; }

  await prisma.course.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
