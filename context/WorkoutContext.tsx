import * as Haptics from "expo-haptics";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ActiveExercise, ActiveWorkout, Exercise, SetData } from "@/types";

interface WorkoutContextType {
  activeWorkout: ActiveWorkout | null;
  elapsedSeconds: number;
  startWorkout: (
    name: string,
    templateId?: string,
    exercises?: ActiveExercise[]
  ) => void;
  cancelWorkout: () => void;
  finishWorkout: () => ActiveWorkout;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  updateSet: (
    exerciseId: string,
    setIndex: number,
    field: keyof Pick<SetData, "reps" | "weight">,
    value: string
  ) => void;
  toggleSetComplete: (exerciseId: string, setIndex: number) => void;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(
    null
  );
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  function startWorkout(
    name: string,
    templateId?: string,
    exercises?: ActiveExercise[]
  ) {
    setActiveWorkout({
      name,
      templateId,
      startedAt: Date.now(),
      exercises: exercises ?? [],
    });
    setElapsedSeconds(0);
    setIsRunning(true);
  }

  function cancelWorkout() {
    setActiveWorkout(null);
    setIsRunning(false);
    setElapsedSeconds(0);
  }

  function finishWorkout(): ActiveWorkout {
    const workout = activeWorkout!;
    setActiveWorkout(null);
    setIsRunning(false);
    setElapsedSeconds(0);
    return workout;
  }

  function addExercise(exercise: Exercise) {
    const newEx: ActiveExercise = {
      id: genId(),
      exercise,
      sets: [{ reps: "10", weight: "0", completed: false }],
    };
    setActiveWorkout((prev) =>
      prev ? { ...prev, exercises: [...prev.exercises, newEx] } : prev
    );
  }

  function removeExercise(exerciseId: string) {
    setActiveWorkout((prev) =>
      prev
        ? {
            ...prev,
            exercises: prev.exercises.filter((e) => e.id !== exerciseId),
          }
        : prev
    );
  }

  function addSet(exerciseId: string) {
    setActiveWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((e) => {
          if (e.id !== exerciseId) return e;
          const last = e.sets[e.sets.length - 1];
          return {
            ...e,
            sets: [
              ...e.sets,
              {
                reps: last?.reps ?? "10",
                weight: last?.weight ?? "0",
                completed: false,
              },
            ],
          };
        }),
      };
    });
  }

  function removeSet(exerciseId: string, setIndex: number) {
    setActiveWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((e) => {
          if (e.id !== exerciseId) return e;
          const sets = [...e.sets];
          sets.splice(setIndex, 1);
          return { ...e, sets };
        }),
      };
    });
  }

  function updateSet(
    exerciseId: string,
    setIndex: number,
    field: keyof Pick<SetData, "reps" | "weight">,
    value: string
  ) {
    setActiveWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((e) => {
          if (e.id !== exerciseId) return e;
          return {
            ...e,
            sets: e.sets.map((s, i) =>
              i === setIndex ? { ...s, [field]: value } : s
            ),
          };
        }),
      };
    });
  }

  function toggleSetComplete(exerciseId: string, setIndex: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((e) => {
          if (e.id !== exerciseId) return e;
          return {
            ...e,
            sets: e.sets.map((s, i) =>
              i === setIndex ? { ...s, completed: !s.completed } : s
            ),
          };
        }),
      };
    });
  }

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        elapsedSeconds,
        startWorkout,
        cancelWorkout,
        finishWorkout,
        addExercise,
        removeExercise,
        addSet,
        removeSet,
        updateSet,
        toggleSetComplete,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx)
    throw new Error("useWorkout must be used within WorkoutProvider");
  return ctx;
}
