export interface HoleScore {
  id: string;
  roundId: string;
  holeNumber: number;
  par: number;
  strokes: number;
  putts: number;
  fairwayHit: boolean | null; // null for par 3s
  greenInRegulation: boolean;
  penalties: number;
  notes?: string;
}

export interface RoundStats {
  totalStrokes: number;
  totalPutts: number;
  fairwaysHit: number;
  fairwaysTotal: number;
  greensInRegulation: number;
  totalPenalties: number;
  scoreToPar: number;
  frontNine: number;
  backNine: number;
}

export interface Round {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  date: string;
  scores: HoleScore[];
  stats: RoundStats;
  weather?: string;
  notes?: string;
  createdAt: string;
}

export interface RoundInput {
  courseId: string;
  date: string;
  scores: Omit<HoleScore, 'id' | 'roundId'>[];
  weather?: string;
  notes?: string;
}
