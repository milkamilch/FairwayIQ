import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, LoginInput, RegisterInput } from '@fairwayiq/shared';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        const { data } = await api.get<User>('/auth/me');
        set({ user: data, token, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      await SecureStore.deleteItemAsync('auth_token');
      set({ user: null, token: null, isInitialized: true });
    }
  },

  login: async (input) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post<{ token: string; user: User }>('/auth/login', input);
      await SecureStore.setItemAsync('auth_token', data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (input) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post<{ token: string; user: User }>('/auth/register', input);
      await SecureStore.setItemAsync('auth_token', data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ user: null, token: null });
  },

  updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
}));
