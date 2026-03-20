import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const clubsRouter = Router();
clubsRouter.use(authMiddleware);

const clubSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['DRIVER', 'FAIRWAY_WOOD', 'HYBRID', 'IRON', 'WEDGE', 'PUTTER']),
  distanceM: z.number().int().min(1).max(400).optional().nullable(),
});

clubsRouter.get('/', async (req: AuthRequest, res: Response) => {
  const clubs = await prisma.club.findMany({
    where: { userId: req.userId! },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
  res.json(clubs);
});

clubsRouter.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = clubSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() });
    return;
  }
  const club = await prisma.club.create({
    data: { userId: req.userId!, ...parsed.data },
  });
  res.status(201).json(club);
});

clubsRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = clubSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.club.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Schläger nicht gefunden' }); return; }

  const club = await prisma.club.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(club);
});

clubsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.club.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Schläger nicht gefunden' }); return; }
  await prisma.club.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
