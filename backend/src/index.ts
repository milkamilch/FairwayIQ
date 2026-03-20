import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { trainingRouter } from './routes/training';
import { courseRouter } from './routes/course';
import { roundRouter } from './routes/round';
import { progressRouter } from './routes/progress';
import { gamificationRouter } from './routes/gamification';
import { clubsRouter } from './routes/clubs';
import { goalsRouter } from './routes/goals';
import { socialRouter } from './routes/social';
import { wearablesRouter } from './routes/wearables';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:8081'];

app.use(cors({
  origin: (origin, callback) => {
    // Native mobile apps haben kein origin (undefined)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.use('/api/auth', authRouter);
app.use('/api/training', trainingRouter);
app.use('/api/courses', courseRouter);
app.use('/api/rounds', roundRouter);
app.use('/api/progress', progressRouter);
app.use('/api/gamification', gamificationRouter);
app.use('/api/clubs', clubsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/social', socialRouter);
app.use('/api/wearables', wearablesRouter);

app.listen(PORT, () => {
  console.log(`FairwayIQ Backend running on port ${PORT}`);
});
