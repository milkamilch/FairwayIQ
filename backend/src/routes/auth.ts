import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendVerificationEmail } from '../lib/mailer';

const uploadDir = path.join(__dirname, '../../../uploads/avatars');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

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

  const emailVerificationToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name, handicap, level, emailVerificationToken },
    select: { id: true, email: true, name: true },
  });

  try {
    await sendVerificationEmail(email, name, emailVerificationToken);
  } catch (err) {
    console.error('Mail-Versand fehlgeschlagen:', err);
  }

  res.status(201).json({ pending: true, email: user.email });
});

authRouter.post('/resend-verification', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: 'E-Mail fehlt' }); return; }

  const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });

  // Wenn User nicht existiert oder bereits verifiziert: trotzdem 200 zurückgeben (kein Info-Leak)
  if (user && !user.emailVerified) {
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: token },
    });
    try {
      await sendVerificationEmail(user.email, user.name, token);
    } catch (err) {
      console.error('Mail-Versand fehlgeschlagen:', err);
    }
  }

  res.json({ ok: true });
});

authRouter.get('/verify-email', async (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;
  if (!token) {
    res.status(400).send(verifyPage('error', 'Kein Token angegeben.'));
    return;
  }

  const user = await prisma.user.findUnique({ where: { emailVerificationToken: token } });
  if (!user) {
    res.status(400).send(verifyPage('error', 'Ungültiger oder bereits verwendeter Link.'));
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationToken: null },
  });

  res.send(verifyPage('success', `Hallo ${user.name}, deine E-Mail wurde bestätigt. Du kannst die App jetzt öffnen und dich einloggen.`));
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

  if (!user.emailVerified) {
    res.status(403).json({ error: 'EMAIL_NOT_VERIFIED' });
    return;
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' });

  const { password: _, emailVerificationToken: __, emailVerified: ___, ...userWithoutSecrets } = user;
  res.json({ token, user: userWithoutSecrets });
});

authRouter.post('/me/avatar', authMiddleware, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }

  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { avatarUrl: true } });
  if (user?.avatarUrl) {
    const old = path.join(__dirname, '../../../', user.avatarUrl.replace(/^\//, ''));
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { avatarUrl },
    select: { id: true, email: true, name: true, handicap: true, level: true, homeClub: true, avatarUrl: true, createdAt: true },
  });
  res.json(updated);
});

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, handicap: true, level: true, homeClub: true, avatarUrl: true, createdAt: true },
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
    homeClub: z.string().max(100).optional().nullable(),
  });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Eingabe' });
    return;
  }

  const { handicap, homeClub, ...rest } = parsed.data;

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
    data: {
      ...rest,
      ...(handicap !== undefined && { handicap }),
      ...(level && { level }),
      ...(homeClub !== undefined && { homeClub }),
    },
    select: { id: true, email: true, name: true, handicap: true, level: true, homeClub: true, avatarUrl: true, createdAt: true },
  });

  res.json(user);
});

function verifyPage(type: 'success' | 'error', message: string) {
  const color = type === 'success' ? '#00e87a' : '#ef4444';
  const icon = type === 'success' ? '✓' : '✗';
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FairwayIQ – E-Mail Bestätigung</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#07070f;font-family:sans-serif;color:#f0f0ff}
.card{background:#0e0e1a;border:1px solid #1e1e2e;border-radius:16px;padding:40px 32px;max-width:400px;text-align:center}
.icon{font-size:48px;color:${color};margin-bottom:16px}
h1{margin:0 0 12px;font-size:22px;color:${color}}
p{color:#8888aa;margin:0;line-height:1.6}</style>
</head>
<body><div class="card"><div class="icon">${icon}</div><h1>FairwayIQ</h1><p>${message}</p></div></body>
</html>`;
}
