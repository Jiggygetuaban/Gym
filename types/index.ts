export interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
}

export interface SetData {
  reps: string;
  weight: string;
  completed: boolean;
}

export interface ActiveExercise {
  id: string;
  exercise: Exercise;
  sets: SetData[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: ActiveExercise[];
  createdAt: number;
}

export interface WorkoutSession {
  id: string;
  name: string;
  templateId?: string;
  startedAt: number;
  finishedAt: number;
  duration: number;
  exercises: ActiveExercise[];
  totalVolume: number;
}

export interface ActiveWorkout {
  name: string;
  templateId?: string;
  startedAt: number;
  exercises: ActiveExercise[];
}
