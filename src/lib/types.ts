export interface Session {
  id: string;
  userId: string;
  startAt: string;
  endAt: string | null;
  note: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  type: 'strength' | 'cardio';
  lastUsedAt: string | null;
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  orderInExercise: number;
  weight: number;
  reps: number;
  unit: 'kg' | 'lb';
  duration: number | null;
  isDeleted?: boolean;
}

export interface ExerciseWithSets extends Exercise {
  sets: WorkoutSet[];
  note: string | null;
}

export interface SessionDetail extends Session {
  exercises: ExerciseWithSets[]; // Computed or joined in frontend
  sets: WorkoutSet[]; // Raw sets
}
