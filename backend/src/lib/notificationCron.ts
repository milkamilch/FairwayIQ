import cron from 'node-cron';
import { prisma } from './prisma';
import { sendPush } from './pushNotifications';

const TRAINING_MESSAGES = [
  { title: '🏌️ Zeit zum Trainieren!', body: 'Dein heutiges Training wartet auf dich.' },
  { title: '⛳ Bleib dran!', body: 'Kurz trainieren heute? Dein Handicap dankt es dir.' },
  { title: '🎯 Tagesübung', body: 'Mach heute einen Schritt Richtung deinem Ziel.' },
];

const STREAK_MESSAGES = [
  { title: '🔥 Streak in Gefahr!', body: 'Trainiere heute noch, um deinen Streak zu halten.' },
  { title: '⚡ Nicht aufhören!', body: 'Du hast heute noch nicht trainiert — bleib am Ball!' },
];

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function startNotificationCron() {
  // Trainings-Erinnerung täglich 18:00 Uhr
  cron.schedule('0 18 * * *', async () => {
    try {
      const users = await prisma.user.findMany({
        where: { notifTraining: true, pushToken: { not: null } },
        select: { pushToken: true },
      });
      const tokens = users.map((u) => u.pushToken!);
      if (tokens.length === 0) return;
      const msg = randomOf(TRAINING_MESSAGES);
      await sendPush(tokens, msg.title, msg.body);
      console.log(`[cron] Training reminder sent to ${tokens.length} users`);
    } catch (err) {
      console.error('[cron] Training reminder error:', err);
    }
  });

  // Streak-Erinnerung täglich 20:00 Uhr — nur wenn heute noch kein Training
  cron.schedule('0 20 * * *', async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const users = await prisma.user.findMany({
        where: {
          notifStreak: true,
          pushToken: { not: null },
          streak: { currentStreak: { gt: 0 } },
        },
        select: {
          pushToken: true,
          sessionLogs: {
            where: { createdAt: { gte: today } },
            take: 1,
            select: { id: true },
          },
        },
      });

      const tokens = users
        .filter((u) => u.sessionLogs.length === 0)
        .map((u) => u.pushToken!);

      if (tokens.length === 0) return;
      const msg = randomOf(STREAK_MESSAGES);
      await sendPush(tokens, msg.title, msg.body);
      console.log(`[cron] Streak reminder sent to ${tokens.length} users`);
    } catch (err) {
      console.error('[cron] Streak reminder error:', err);
    }
  });
}
