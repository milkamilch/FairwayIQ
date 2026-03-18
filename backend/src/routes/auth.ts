import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  handicap: z.number().min(-10).max(54).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() });
    return;
  }

  const { email, password, name, handicap } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'E-Mail bereits registriert' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const level = handicap === undefined
    ? 'BEGINNER'
    : handicap <= 5
    ? 'PRO'
    : handicap <= 12
    ? 'ADVANCED'
    : handicap <= 24
    ? 'INTERMEDIATE'
    : 'BEGINNER';

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name, handicap, level },
    select: { id: true, email: true, name: true, handicap: true, level: true, createdAt: true },
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' });

  res.status(201).json({ token, user });
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Eingabe' });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    return;
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' });

  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, handicap: true, level: true, createdAt: true },
  });

  if (!user) {
    res.status(404).json({ error: 'Benutzer nicht gefunden' });
    return;
  }

  res.json(user);
});

authRouter.put('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const updateSchema = z.object({
    name: z.string().min(2).optional(),
    handicap: z.number().min(-10).max(54).optional(),
  });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Eingabe' });
    return;
  }

  const { handicap, ...rest } = parsed.data;

  const level = handicap !== undefined
    ? handicap <= 5
      ? 'PRO'
      : handicap <= 12
      ? 'ADVANCED'
      : handicap <= 24
      ? 'INTERMEDIATE'
      : 'BEGINNER'
    : undefined;

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { ...rest, ...(handicap !== undefined && { handicap }), ...(level && { level }) },
    select: { id: true, email: true, name: true, handicap: true, level: true, createdAt: true },
  });

  res.json(user);
});
