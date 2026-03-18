export type HazardType = 'WATER' | 'BUNKER' | 'OB' | 'ROUGH' | 'TREES';

export type ShotShape = 'STRAIGHT' | 'FADE' | 'DRAW';

export interface Hazard {
  id: string;
  type: HazardType;
  description: string;
  position: 'LEFT' | 'RIGHT' | 'CENTER' | 'LONG' | 'SHORT';
}

export interface HoleStrategy {
  id: string;
  holeId: string;
  recommendedClub: string;
  shotShape: ShotShape;
  aimPoint: string;
  avoidance: string;
  notes: string;
}

export interface Hole {
  id: string;
  courseId: string;
  number: number;
  par: number;
  strokeIndex: number;
  distanceMeters: number;
  hazards: Hazard[];
  strategy?: HoleStrategy;
}

export interface Course {
  id: string;
  name: string;
  location: string;
  holes: Hole[];
  totalPar: number;
  rating?: number;
  slope?: number;
  createdBy: string;
  createdAt: string;
}

export interface CourseInput {
  name: string;
  location: string;
  holes: Omit<Hole, 'id' | 'courseId'>[];
}
