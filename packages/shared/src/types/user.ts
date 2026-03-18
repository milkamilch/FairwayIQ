export type GolferLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO';

export interface User {
  id: string;
  email: string;
  name: string;
  handicap: number | null;
  level: GolferLevel;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  handicap?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}
