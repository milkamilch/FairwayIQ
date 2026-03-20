import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const wearablesRouter = Router();
wearablesRouter.use(authMiddleware);

type Provider = 'APPLE_HEALTH' | 'GARMIN';

const VALID_PROVIDERS: Provider[] = ['APPLE_HEALTH', 'GARMIN'];

// GET /wearables/connections — alle verbundenen Geräte des Users
wearablesRouter.get('/connections', async (req: AuthRequest, res: Response) => {
  const connections = await prisma.wearableConnection.findMany({
    where: { userId: req.userId! },
  });
  res.json(connections);
});

// POST /wearables/:provider/connect — Gerät verbinden
// Body für GARMIN: { accessToken, refreshToken, garminUserId }
// Body für APPLE_HEALTH: {} (nur Flag setzen, HealthKit-Daten kommen per sync)
wearablesRouter.post('/:provider/connect', async (req: AuthRequest, res: Response) => {
  const provider = req.params.provider.toUpperCase() as Provider;
  if (!VALID_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: 'Ungültiger Provider. Erlaubt: APPLE_HEALTH, GARMIN' });
  }

  const { accessToken, refreshToken, garminUserId } = req.body;

  const connection = await prisma.wearableConnection.upsert({
    where: { userId_provider: { userId: req.userId!, provider } },
    create: {
      userId: req.userId!,
      provider,
      accessToken: accessToken ?? null,
      refreshToken: refreshToken ?? null,
      garminUserId: garminUserId ?? null,
    },
    update: {
      accessToken: accessToken ?? undefined,
      refreshToken: refreshToken ?? undefined,
      garminUserId: garminUserId ?? undefined,
      connectedAt: new Date(),
    },
  });

  res.json(connection);
});

// DELETE /wearables/:provider — Gerät trennen
wearablesRouter.delete('/:provider', async (req: AuthRequest, res: Response) => {
  const provider = req.params.provider.toUpperCase() as Provider;
  if (!VALID_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: 'Ungültiger Provider' });
  }

  await prisma.wearableConnection.deleteMany({
    where: { userId: req.userId!, provider },
  });

  res.json({ success: true });
});

// POST /wearables/:provider/sync — Sync-Daten vom Gerät speichern
// Body: { steps?, heartRate?, calories?, activeMinutes?, date? }
wearablesRouter.post('/:provider/sync', async (req: AuthRequest, res: Response) => {
  const provider = req.params.provider.toUpperCase() as Provider;
  if (!VALID_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: 'Ungültiger Provider' });
  }

  const { steps, heartRate, calories, activeMinutes } = req.body;

  const existing = await prisma.wearableConnection.findUnique({
    where: { userId_provider: { userId: req.userId!, provider } },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Gerät nicht verbunden' });
  }

  const updated = await prisma.wearableConnection.update({
    where: { userId_provider: { userId: req.userId!, provider } },
    data: {
      lastSyncAt: new Date(),
      syncData: { steps, heartRate, calories, activeMinutes },
    },
  });

  res.json(updated);
});

// GET /wearables/garmin/auth-url — Garmin OAuth-URL generieren
// In der Produktion: Garmin Consumer Key + HMAC-SHA1-Signatur für OAuth 1.0a
// Hier: Struktur vorhanden, Token aus Umgebungsvariablen
wearablesRouter.get('/garmin/auth-url', async (_req: AuthRequest, res: Response) => {
  const GARMIN_CONSUMER_KEY = process.env.GARMIN_CONSUMER_KEY;
  const GARMIN_CALLBACK_URL = process.env.GARMIN_CALLBACK_URL ?? 'fairwayiq://wearables/garmin/callback';

  if (!GARMIN_CONSUMER_KEY) {
    // Noch nicht konfiguriert — gibt Demo-Hinweis zurück
    return res.json({
      configured: false,
      message: 'Garmin-API noch nicht konfiguriert. Bitte GARMIN_CONSUMER_KEY in .env setzen.',
    });
  }

  // Garmin OAuth 1.0a Request Token Endpoint
  res.json({
    configured: true,
    authUrl: `https://connect.garmin.com/oauthConfirm?oauth_callback=${encodeURIComponent(GARMIN_CALLBACK_URL)}&oauth_consumer_key=${GARMIN_CONSUMER_KEY}`,
  });
});
