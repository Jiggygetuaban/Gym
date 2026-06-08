import { Exercise } from "@/types";

export const EXERCISES: Exercise[] = [
  // Chest
  { id: "bench-press", name: "Bench Press", category: "Chest", equipment: "Barbell" },
  { id: "incline-bench-press", name: "Incline Bench Press", category: "Chest", equipment: "Barbell" },
  { id: "decline-bench-press", name: "Decline Bench Press", category: "Chest", equipment: "Barbell" },
  { id: "dumbbell-flyes", name: "Dumbbell Flyes", category: "Chest", equipment: "Dumbbell" },
  { id: "cable-crossover", name: "Cable Crossover", category: "Chest", equipment: "Cable" },
  { id: "push-ups", name: "Push-Ups", category: "Chest", equipment: "Bodyweight" },
  { id: "chest-dips", name: "Chest Dips", category: "Chest", equipment: "Bodyweight" },

  // Back
  { id: "deadlift", name: "Deadlift", category: "Back", equipment: "Barbell" },
  { id: "pull-ups", name: "Pull-Ups", category: "Back", equipment: "Bodyweight" },
  { id: "lat-pulldown", name: "Lat Pulldown", category: "Back", equipment: "Cable" },
  { id: "bent-over-row", name: "Bent-Over Row", category: "Back", equipment: "Barbell" },
  { id: "seated-cable-row", name: "Seated Cable Row", category: "Back", equipment: "Cable" },
  { id: "t-bar-row", name: "T-Bar Row", category: "Back", equipment: "Machine" },
  { id: "single-arm-row", name: "Single Arm Row", category: "Back", equipment: "Dumbbell" },

  // Shoulders
  { id: "overhead-press", name: "Overhead Press", category: "Shoulders", equipment: "Barbell" },
  { id: "dumbbell-shoulder-press", name: "Dumbbell Shoulder Press", category: "Shoulders", equipment: "Dumbbell" },
  { id: "lateral-raises", name: "Lateral Raises", category: "Shoulders", equipment: "Dumbbell" },
  { id: "front-raises", name: "Front Raises", category: "Shoulders", equipment: "Dumbbell" },
  { id: "rear-delt-flyes", name: "Rear Delt Flyes", category: "Shoulders", equipment: "Dumbbell" },
  { id: "arnold-press", name: "Arnold Press", category: "Shoulders", equipment: "Dumbbell" },
  { id: "face-pulls", name: "Face Pulls", category: "Shoulders", equipment: "Cable" },

  // Biceps
  { id: "barbell-curl", name: "Barbell Curl", category: "Biceps", equipment: "Barbell" },
  { id: "dumbbell-curl", name: "Dumbbell Curl", category: "Biceps", equipment: "Dumbbell" },
  { id: "hammer-curl", name: "Hammer Curl", category: "Biceps", equipment: "Dumbbell" },
  { id: "preacher-curl", name: "Preacher Curl", category: "Biceps", equipment: "Barbell" },
  { id: "cable-curl", name: "Cable Curl", category: "Biceps", equipment: "Cable" },
  { id: "concentration-curl", name: "Concentration Curl", category: "Biceps", equipment: "Dumbbell" },

  // Triceps
  { id: "tricep-pushdown", name: "Tricep Pushdown", category: "Triceps", equipment: "Cable" },
  { id: "skull-crushers", name: "Skull Crushers", category: "Triceps", equipment: "Barbell" },
  { id: "tricep-dips", name: "Tricep Dips", category: "Triceps", equipment: "Bodyweight" },
  { id: "close-grip-bench", name: "Close Grip Bench", category: "Triceps", equipment: "Barbell" },
  { id: "overhead-tricep-ext", name: "Overhead Tricep Extension", category: "Triceps", equipment: "Dumbbell" },

  // Legs
  { id: "squat", name: "Squat", category: "Legs", equipment: "Barbell" },
  { id: "leg-press", name: "Leg Press", category: "Legs", equipment: "Machine" },
  { id: "romanian-deadlift", name: "Romanian Deadlift", category: "Legs", equipment: "Barbell" },
  { id: "leg-extension", name: "Leg Extension", category: "Legs", equipment: "Machine" },
  { id: "leg-curl", name: "Leg Curl", category: "Legs", equipment: "Machine" },
  { id: "calf-raise", name: "Calf Raise", category: "Legs", equipment: "Machine" },
  { id: "lunge", name: "Lunge", category: "Legs", equipment: "Bodyweight" },
  { id: "hack-squat", name: "Hack Squat", category: "Legs", equipment: "Machine" },
  { id: "front-squat", name: "Front Squat", category: "Legs", equipment: "Barbell" },

  // Core
  { id: "plank", name: "Plank", category: "Core", equipment: "Bodyweight" },
  { id: "crunches", name: "Crunches", category: "Core", equipment: "Bodyweight" },
  { id: "leg-raises", name: "Leg Raises", category: "Core", equipment: "Bodyweight" },
  { id: "russian-twist", name: "Russian Twist", category: "Core", equipment: "Bodyweight" },
  { id: "cable-crunch", name: "Cable Crunch", category: "Core", equipment: "Cable" },
  { id: "ab-rollout", name: "Ab Rollout", category: "Core", equipment: "Equipment" },

  // Cardio
  { id: "running", name: "Running", category: "Cardio", equipment: "None" },
  { id: "rowing", name: "Rowing Machine", category: "Cardio", equipment: "Machine" },
  { id: "cycling", name: "Cycling", category: "Cardio", equipment: "Machine" },
  { id: "jump-rope", name: "Jump Rope", category: "Cardio", equipment: "Equipment" },
];

export const CATEGORIES = [...new Set(EXERCISES.map((e) => e.category))];
