import { Router, Response, Request } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { uploadToR2, deleteFromR2 } from '../lib/r2';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const swingsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files allowed'));
  },
});

// ── POST /swings  ─────────────────────────────────────────────────────────
// Upload video, create SwingAnalysis record, kick off ML analysis async.
swingsRouter.post('/', authMiddleware, upload.single('video'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Keine Videodatei hochgeladen' });
    return;
  }

  const ext = req.file.mimetype.split('/')[1] ?? 'mp4';
  const key = `swings/${req.userId}/${randomUUID()}.${ext}`;

  let videoUrl: string;
  try {
    videoUrl = await uploadToR2(key, req.file.buffer, req.file.mimetype);
  } catch (err) {
    console.error('[swings] R2 upload failed:', err);
    res.status(502).json({ error: 'Video-Upload fehlgeschlagen' });
    return;
  }

  const swing = await prisma.swingAnalysis.create({
    data: { userId: req.userId!, videoUrl, status: 'PROCESSING' },
  });

  // Fire-and-forget: trigger ML service
  const mlUrl = process.env.ML_SERVICE_URL ?? 'http://swing-ml:8000';
  const callbackUrl = `${process.env.APP_URL}/api/swings/webhook`;
  axios
    .post(`${mlUrl}/analyze`, { swingId: swing.id, videoUrl, callbackUrl })
    .catch((e) => console.error('[swings] ML trigger failed:', e.message));

  res.status(201).json(swing);
});

// ── GET /swings  ──────────────────────────────────────────────────────────
swingsRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const swings = await prisma.swingAnalysis.findMany({
    where:   { userId: req.userId! },
    include: { feedback: { orderBy: { type: 'asc' } } },
    orderBy: { createdAt: 'desc' },
    take:    50,
  });
  res.json(swings);
});

// ── GET /swings/:id  ──────────────────────────────────────────────────────
swingsRouter.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const swing = await prisma.swingAnalysis.findFirst({
    where:   { id: req.params.id, userId: req.userId! },
    include: { feedback: { orderBy: { type: 'asc' } } },
  });
  if (!swing) {
    res.status(404).json({ error: 'Nicht gefunden' });
    return;
  }
  res.json(swing);
});

// ── DELETE /swings/:id  ───────────────────────────────────────────────────
swingsRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const swing = await prisma.swingAnalysis.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!swing) {
    res.status(404).json({ error: 'Nicht gefunden' });
    return;
  }

  // Delete from R2 (extract key from URL)
  try {
    const key = new URL(swing.videoUrl).pathname.slice(1);
    await deleteFromR2(key);
  } catch {
    // Non-fatal: continue to delete DB record
  }

  await prisma.swingAnalysis.delete({ where: { id: swing.id } });
  res.json({ ok: true });
});

// ── POST /swings/webhook  (called by ML service, no auth) ─────────────────
swingsRouter.post('/webhook', async (req: Request, res: Response) => {
  const { secret, swingId, failed, overallScore, phases, metrics, feedback } = req.body;

  if (secret !== process.env.ML_WEBHOOK_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (failed) {
    await prisma.swingAnalysis.update({
      where: { id: swingId },
      data:  { status: 'FAILED' },
    });
    res.json({ ok: true });
    return;
  }

  await prisma.$transaction([
    prisma.swingAnalysis.update({
      where: { id: swingId },
      data:  { status: 'COMPLETED', overallScore, phases, metrics },
    }),
    ...(feedback ?? []).map((f: {
      category: string; type: string; message: string;
      metric?: string; actual?: number; target?: number;
    }) =>
      prisma.swingFeedback.create({
        data: { swingId, ...f },
      }),
    ),
  ]);

  res.json({ ok: true });
});
