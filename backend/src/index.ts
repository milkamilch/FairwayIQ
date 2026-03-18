import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { trainingRouter } from './routes/training';
import { courseRouter } from './routes/course';
import { roundRouter } from './routes/round';
import { progressRouter } from './routes/progress';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.use('/api/auth', authRouter);
app.use('/api/training', trainingRouter);
app.use('/api/courses', courseRouter);
app.use('/api/rounds', roundRouter);
app.use('/api/progress', progressRouter);

app.listen(PORT, () => {
  console.log(`FairwayIQ Backend running on port ${PORT}`);
});
