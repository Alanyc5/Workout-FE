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
  lastUsedAt: string | null;
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  orderInExercise: number;
  weight: number;
  reps: number;
  isDeleted?: boolean;
}

export interface ExerciseWithSets extends Exercise {
  sets: WorkoutSet[];
}

export interface SessionDetail extends Session {
  exercises: ExerciseWithSets[]; // Computed or joined in frontend
  sets: WorkoutSet[]; // Raw sets
}
