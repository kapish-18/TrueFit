// Muscle group constants and utility mappings

export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'quadriceps', 'hamstrings',
  'glutes', 'biceps', 'triceps', 'forearms', 'calves',
  'core', 'traps',
];

export const MUSCLE_GROUP_LABELS = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  quadriceps: 'Quadriceps',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  calves: 'Calves',
  core: 'Core',
  traps: 'Traps',
};

// Optimal weekly set ranges per muscle group (research-backed)
export const OPTIMAL_VOLUME = {
  chest:      { min: 10, max: 20 },
  back:       { min: 10, max: 20 },
  shoulders:  { min: 8, max: 16 },
  quadriceps: { min: 10, max: 20 },
  hamstrings: { min: 8, max: 16 },
  glutes:     { min: 8, max: 16 },
  biceps:     { min: 8, max: 14 },
  triceps:    { min: 8, max: 14 },
  forearms:   { min: 4, max: 10 },
  calves:     { min: 8, max: 16 },
  core:       { min: 6, max: 14 },
  traps:      { min: 6, max: 12 },
};

export const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'cable', 'machine',
  'bodyweight', 'ez-bar', 'kettlebell', 'smith-machine',
  'band', 'other',
];

export const SPLIT_TEMPLATES = [
  {
    id: 'ppl',
    name: 'Push Pull Legs',
    days: [
      { name: 'Push', defaultExercises: ['barbell-bench-press', 'overhead-press', 'incline-db-press', 'lateral-raise', 'tricep-pushdown'] },
      { name: 'Pull', defaultExercises: ['barbell-row', 'lat-pulldown', 'face-pull', 'barbell-curl', 'hammer-curl'] },
      { name: 'Legs', defaultExercises: ['barbell-squat', 'leg-press', 'romanian-deadlift', 'leg-extension', 'standing-calf-raise'] },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper Lower',
    days: [
      { name: 'Upper', defaultExercises: ['barbell-bench-press', 'barbell-row', 'overhead-press', 'lat-pulldown', 'barbell-curl'] },
      { name: 'Lower', defaultExercises: ['barbell-squat', 'romanian-deadlift', 'leg-press', 'seated-leg-curl', 'standing-calf-raise'] },
    ],
  },
  {
    id: 'upper-lower-4',
    name: '4-Day Upper Lower',
    days: [
      { name: 'Upper A', defaultExercises: ['barbell-bench-press', 'barbell-row', 'lateral-raise', 'tricep-pushdown'] },
      { name: 'Lower A', defaultExercises: ['barbell-squat', 'romanian-deadlift', 'standing-calf-raise'] },
      { name: 'Upper B', defaultExercises: ['overhead-press', 'lat-pulldown', 'incline-db-press', 'barbell-curl'] },
      { name: 'Lower B', defaultExercises: ['leg-press', 'lying-leg-curl', 'seated-calf-raise'] },
    ],
  },
  {
    id: 'bro-split',
    name: 'Bro Split',
    days: [
      { name: 'Chest', defaultExercises: ['barbell-bench-press', 'incline-db-press', 'cable-flye'] },
      { name: 'Back', defaultExercises: ['deadlift', 'barbell-row', 'lat-pulldown'] },
      { name: 'Shoulders', defaultExercises: ['overhead-press', 'lateral-raise', 'face-pull'] },
      { name: 'Legs', defaultExercises: ['barbell-squat', 'leg-press', 'romanian-deadlift'] },
      { name: 'Arms', defaultExercises: ['barbell-curl', 'skull-crusher', 'hammer-curl', 'tricep-pushdown'] },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body',
    days: [
      { name: 'Full Body A', defaultExercises: ['barbell-squat', 'barbell-bench-press', 'barbell-row'] },
      { name: 'Full Body B', defaultExercises: ['deadlift', 'overhead-press', 'lat-pulldown'] },
      { name: 'Full Body C', defaultExercises: ['leg-press', 'incline-db-press', 'seated-cable-row'] },
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    days: [],
  },
];

// Default settings
export const DEFAULTS = {
  weightUnit: 'kg',
  deloadFrequency: 6,        // weeks
  fatigueThreshold: 70,      // score 0-100
  defaultIncrement: 2.5,     // kg
  deloadWeightReduction: 0.35, // 35%
  deloadSetReduction: 1,
};

// Fatigue level thresholds
export const FATIGUE_LEVELS = {
  LOW: { max: 40, label: 'Low', color: '#10b981' },
  MEDIUM: { max: 70, label: 'Medium', color: '#f59e0b' },
  HIGH: { max: 100, label: 'High', color: '#ef4444' },
};
