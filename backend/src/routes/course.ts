import { Router, Response } from 'express';
import { z } from 'zod';
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

const courseSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  rating: z.number().optional(),
  slope: z.number().optional(),
  holes: z.array(holeSchema).length(18),
});

// GET alle Plätze des Users
courseRouter.get('/', async (req: AuthRequest, res: Response) => {
  const courses = await prisma.course.findMany({
    where: { createdBy: req.userId! },
    include: { holes: { orderBy: { number: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(courses);
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

  const { holes, ...courseData } = parsed.data;
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
    },
    include: { holes: { include: { hazards: true, strategy: true } } },
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
