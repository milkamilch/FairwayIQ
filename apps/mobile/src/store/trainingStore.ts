import { create } from 'zustand';
import { TrainingPlan, UserTrainingPlan } from '@fairwayiq/shared';
import { api } from '../lib/api';

interface TrainingState {
  plans: TrainingPlan[];
  activePlan: UserTrainingPlan | null;
  isLoading: boolean;

  fetchPlans: () => Promise<void>;
  fetchActivePlan: () => Promise<void>;
  startPlan: (planId: string) => Promise<void>;
  completeDay: (dayNumber: number) => Promise<void>;
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

  completeDay: async (dayNumber) => {
    try {
      const { data } = await api.post('/training/my-plan/complete-day', { dayNumber });
      set((state) => ({
        activePlan: state.activePlan ? { ...state.activePlan, ...data } : null,
      }));
    } catch {
      throw new Error('Tag konnte nicht abgeschlossen werden');
    }
  },
}));
