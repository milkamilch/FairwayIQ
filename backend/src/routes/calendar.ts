import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/calendar?from=2026-03-01&to=2026-03-31
router.get('/', async (req, res) => {
  const userId = (req as AuthRequest).userId!;
  const { from, to } = req.query;

  try {
    const where: any = { userId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }

    const trainings = await prisma.scheduledTraining.findMany({
      where,
      include: {
        drillSet: {
          include: { items: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json(trainings);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/calendar
router.post('/', async (req, res) => {
  const userId = (req as AuthRequest).userId!;
  const { date, title, category, drillSetId, notes } = req.body;

  if (!date || !title) {
    return res.status(400).json({ error: 'date and title required' });
  }

  try {
    const training = await prisma.scheduledTraining.create({
      data: {
        userId,
        date: new Date(date),
        title,
        category: category ?? null,
        drillSetId: drillSetId ?? null,
        notes: notes ?? null,
      },
      include: {
        drillSet: { include: { items: true } },
      },
    });

    res.status(201).json(training);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/calendar/:id
router.put('/:id', async (req, res) => {
  const userId = (req as AuthRequest).userId!;
  const { id } = req.params;
  const { date, title, category, drillSetId, notes, completed, calendarEventId } = req.body;

  try {
    const existing = await prisma.scheduledTraining.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const training = await prisma.scheduledTraining.update({
      where: { id },
      data: {
        ...(date !== undefined && { date: new Date(date) }),
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(drillSetId !== undefined && { drillSetId }),
        ...(notes !== undefined && { notes }),
        ...(calendarEventId !== undefined && { calendarEventId }),
        ...(completed !== undefined && {
          completed,
          completedAt: completed ? new Date() : null,
        }),
      },
      include: {
        drillSet: { include: { items: true } },
      },
    });

    res.json(training);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/calendar/:id
router.delete('/:id', async (req, res) => {
  const userId = (req as AuthRequest).userId!;
  const { id } = req.params;

  try {
    const existing = await prisma.scheduledTraining.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await prisma.scheduledTraining.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/calendar/drillsets — presets + user custom sets
router.get('/drillsets', async (req, res) => {
  const userId = (req as AuthRequest).userId!;

  try {
    const sets = await prisma.drillSet.findMany({
      where: {
        OR: [{ isPreset: true }, { userId }],
      },
      include: { items: true },
      orderBy: [{ isPreset: 'desc' }, { createdAt: 'asc' }],
    });

    res.json(sets);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/calendar/drillsets
router.post('/drillsets', async (req, res) => {
  const userId = (req as AuthRequest).userId!;
  const { name, category, color, items } = req.body;

  if (!name) return res.status(400).json({ error: 'name required' });

  try {
    const set = await prisma.drillSet.create({
      data: {
        userId,
        name,
        category: category ?? null,
        color: color ?? '#FF6535',
        isPreset: false,
        items: items
          ? {
              create: (items as any[]).map((item: any, idx: number) => ({
                customName: item.customName ?? null,
                drillId: item.drillId ?? null,
                durationMin: item.durationMin ?? 10,
                order: idx,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    res.status(201).json(set);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/calendar/schedule-plan
// Body: { userPlanId, startDate, weekdays: number[] }  (0=Mon … 6=Sun)
router.post('/schedule-plan', async (req, res) => {
  const userId = (req as AuthRequest).userId!;
  const { userPlanId, startDate, weekdays } = req.body as {
    userPlanId: string;
    startDate: string;
    weekdays: number[];
  };

  if (!userPlanId || !startDate || !weekdays?.length) {
    return res.status(400).json({ error: 'userPlanId, startDate and weekdays required' });
  }

  try {
    const userPlan = await prisma.userTrainingPlan.findFirst({
      where: { id: userPlanId, userId },
      include: { plan: { include: { days: { orderBy: { dayNumber: 'asc' } } } } },
    });

    if (!userPlan) return res.status(404).json({ error: 'Plan not found' });

    // Sort weekdays ascending (0=Mon … 6=Sun)
    const sortedWeekdays = [...weekdays].sort((a, b) => a - b);

    // Build calendar dates for each plan day
    // weekdays map to actual calendar dates starting from startDate
    const base = new Date(startDate);
    base.setHours(0, 0, 0, 0);

    // Find the first occurrence of each weekday on or after startDate
    const getNextWeekday = (from: Date, weekday: number): Date => {
      const d = new Date(from);
      // weekday 0=Mon, JS getDay 1=Mon
      const jsDay = weekday === 6 ? 0 : weekday + 1;
      const diff = (jsDay - d.getDay() + 7) % 7;
      d.setDate(d.getDate() + diff);
      return d;
    };

    const days = userPlan.plan.days;
    const entries: { date: Date; title: string; category: string }[] = [];
    let slotIndex = 0;

    for (const day of days) {
      const weekSlot = slotIndex % sortedWeekdays.length;
      const weekOffset = Math.floor(slotIndex / sortedWeekdays.length);
      const targetWeekday = sortedWeekdays[weekSlot];

      let date: Date;
      if (slotIndex === 0) {
        date = getNextWeekday(base, targetWeekday);
      } else {
        // Calculate date relative to first date of this week-slot cycle
        const firstInCycle = getNextWeekday(base, sortedWeekdays[0]);
        firstInCycle.setDate(firstInCycle.getDate() + weekOffset * 7);
        date = getNextWeekday(firstInCycle, targetWeekday);
        if (date < firstInCycle) date.setDate(date.getDate() + 7);
      }

      entries.push({ date, title: day.title, category: day.focus });
      slotIndex++;
    }

    // Remove existing auto-scheduled entries for this plan (if rescheduling)
    // Then create new ones
    const created = await prisma.$transaction(
      entries.map((e) =>
        prisma.scheduledTraining.create({
          data: {
            userId,
            date: e.date,
            title: e.title,
            category: e.category as any,
          },
        }),
      ),
    );

    res.status(201).json({ count: created.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/calendar/drillsets/:id
router.delete('/drillsets/:id', async (req, res) => {
  const userId = (req as AuthRequest).userId!;
  const { id } = req.params;

  try {
    const existing = await prisma.drillSet.findFirst({
      where: { id, userId, isPreset: false },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await prisma.drillSet.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
