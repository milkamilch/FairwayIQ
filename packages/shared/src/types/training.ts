import { GolferLevel } from './user';

export type TrainingCategory = 'PUTTING' | 'SHORT_GAME' | 'IRON_PLAY' | 'DRIVING' | 'COURSE_MANAGEMENT' | 'MENTAL_GAME';

export type TrainingDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface TrainingDrill {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  category: TrainingCategory;
  difficulty: TrainingDifficulty;
  videoUrl?: string;
  tips: string[];
}

export interface TrainingDay {
  id: string;
  dayNumber: number;
  title: string;
  focus: TrainingCategory;
  drills: TrainingDrill[];
  totalMinutes: number;
}

export interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  targetLevel: GolferLevel;
  durationWeeks: number;
  days: TrainingDay[];
  createdAt: string;
  isTemplate: boolean;
}

export interface UserTrainingPlan {
  id: string;
  userId: string;
  planId: string;
  plan: TrainingPlan;
  startDate: string;
  currentDay: number;
  completedDays: number[];
  isActive: boolean;
}
