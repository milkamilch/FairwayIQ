import { create } from 'zustand';
import { TrainingPlan, UserTrainingPlan } from '@fairwayiq/shared';
import { api } from '../lib/api';

export interface WorkoutSummary {
  highlights: string[];
  focusPoints: string[];
  nextTip: string;
  mood: 'excellent' | 'good' | 'okay' | 'tough';
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'sessions' | 'streak' | 'performance' | 'variety';
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  isNewDay: boolean;
}

interface TrainingState {
  plans: TrainingPlan[];
  activePlan: UserTrainingPlan | null;
  isLoading: boolean;

  fetchPlans: () => Promise<void>;
  fetchActivePlan: () => Promise<void>;
  startPlan: (planId: string) => Promise<void>;
  completeDay: (dayNumber: number, feedback: { feeling: number; difficulty: number; notes?: string }) => Promise<{ adaptation: { direction: 'harder' | 'easier' | null; message: string }; summary: WorkoutSummary | null; streak: StreakData; newBadges: BadgeDefinition[] }>;
}

export const useTrainingStore = create<TrainingState>((set) => ({
  plans: [],
  activePlan: null,
  isLoading: false,

  fetchPlans: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<TrainingPlan[]>('/training/plans');
      set({ plans: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchActivePlan: async () => {
    try {
      const { data } = await api.get<UserTrainingPlan>('/training/my-plan');
      set({ activePlan: data });
    } catch {
      set({ activePlan: null });
    }
  },

  startPlan: async (planId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post<UserTrainingPlan>(`/training/plans/${planId}/start`);
      set({ activePlan: data, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('Plan konnte nicht gestartet werden');
    }
  },

  completeDay: async (dayNumber, feedback) => {
    try {
      const { data } = await api.post<{
        updated: any;
        sessionLog: any;
        adaptation: { direction: 'harder' | 'easier' | null; message: string };
        summary: WorkoutSummary | null;
        streak: StreakData;
        newBadges: BadgeDefinition[];
      }>('/training/my-plan/complete-day', { dayNumber, ...feedback });
      set((state) => ({
        activePlan: state.activePlan ? { ...state.activePlan, ...data.updated } : null,
      }));
      return { adaptation: data.adaptation, summary: data.summary, streak: data.streak, newBadges: data.newBadges ?? [] };
    } catch {
      throw new Error('Tag konnte nicht abgeschlossen werden');
    }
  },
}));
