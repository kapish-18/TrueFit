// Exercise seed data — ~85 common exercises
// Each exercise has: id, name, muscle_group, secondary_muscles, category, equipment, default_increment

export const EXERCISE_SEED = [
  // === CHEST ===
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', muscle_group: 'chest', secondary_muscles: ['triceps', 'shoulders'], category: 'compound', equipment: 'barbell', default_increment: 2.5 },
  { id: 'incline-barbell-bench', name: 'Incline Barbell Bench Press', muscle_group: 'chest', secondary_muscles: ['triceps', 'shoulders'], category: 'compound', equipment: 'barbell', default_increment: 2.5 },
  { id: 'decline-bench-press', name: 'Decline Bench Press', muscle_group: 'chest', secondary_muscles: ['triceps', 'shoulders'], category: 'compound', equipment: 'barbell', default_increment: 2.5 },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', muscle_group: 'chest', secondary_muscles: ['triceps', 'shoulders'], category: 'compound', equipment: 'dumbbell', default_increment: 2.0 },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', muscle_group: 'chest', secondary_muscles: ['triceps', 'shoulders'], category: 'compound', equipment: 'dumbbell', default_increment: 2.0 },
  { id: 'decline-db-press', name: 'Decline Dumbbell Press', muscle_group: 'chest', secondary_muscles: ['triceps', 'shoulders'], category: 'compound', equipment: 'dumbbell', default_increment: 2.0 },
  { id: 'machine-chest-press', name: 'Machine Chest Press', muscle_group: 'chest', secondary_muscles: ['triceps', 'shoulders'], category: 'compound', equipment: 'machine', default_increment: 2.5 },
  { id: 'cable-flye', name: 'Cable Flye', muscle_group: 'chest', secondary_muscles: [], category: 'isolation', equipment: 'cable', default_increment: 2.5 },
  { id: 'pec-deck', name: 'Pec Deck', muscle_group: 'chest', secondary_muscles: [], category: 'isolation', equipment: 'machine', default_increment: 2.5 },
  { id: 'dips-chest', name: 'Dips (Chest)', muscle_group: 'chest', secondary_muscles: ['triceps', 'shoulders'], category: 'compound', equipment: 'bodyweight', default_increment: 2.5 },
  { id: 'push-up', name: 'Push-Up', muscle_group: 'chest', secondary_muscles: ['triceps', 'shoulders', 'core'], category: 'compound', equipment: 'bodyweight', default_increment: 0 },

  // === BACK ===
  { id: 'barbell-row', name: 'Barbell Row', muscle_group: 'back', secondary_muscles: ['biceps', 'forearms'], category: 'compound', equipment: 'barbell', default_increment: 2.5 },
  { id: 'deadlift', name: 'Deadlift', muscle_group: 'back', secondary_muscles: ['hamstrings', 'glutes', 'traps', 'forearms'], category: 'compound', equipment: 'barbell', default_increment: 5.0 },
  { id: 'pull-up', name: 'Pull-Up', muscle_group: 'back', secondary_muscles: ['biceps', 'forearms'], category: 'compound', equipment: 'bodyweight', default_increment: 2.5 },
  { id: 'chin-up', name: 'Chin-Up', muscle_group: 'back', secondary_muscles: ['biceps', 'forearms'], category: 'compound', equipment: 'bodyweight', default_increment: 2.5 },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscle_group: 'back', secondary_muscles: ['biceps'], category: 'compound', equipment: 'cable', default_increment: 2.5 },
  { id: 'seated-cable-row', name: 'Seated Cable Row', muscle_group: 'back', secondary_muscles: ['biceps', 'forearms'], category: 'compound', equipment: 'cable', default_increment: 2.5 },
  { id: 'single-arm-cable-row', name: 'Single Arm Cable Row', muscle_group: 'back', secondary_muscles: ['biceps', 'forearms'], category: 'compound', equipment: 'cable', default_increment: 2.5 },
  { id: 'dumbbell-row', name: 'Dumbbell Row', muscle_group: 'back', secondary_muscles: ['biceps', 'forearms'], category: 'compound', equipment: 'dumbbell', default_increment: 2.0 },
  { id: 't-bar-row', name: 'T-Bar Row', muscle_group: 'back', secondary_muscles: ['biceps', 'forearms'], category: 'compound', equipment: 'barbell', default_increment: 2.5 },
  { id: 'pendlay-row', name: 'Pendlay Row', muscle_group: 'back', secondary_muscles: ['biceps', 'forearms'], category: 'compound', equipment: 'barbell', default_increment: 2.5 },
  { id: 'chest-supported-row', name: 'Chest Supported Row', muscle_group: 'back', secondary_muscles: ['biceps'], category: 'compound', equipment: 'dumbbell', default_increment: 2.0 },
  { id: 'meadows-row', name: 'Meadows Row', muscle_group: 'back', secondary_muscles: ['biceps', 'forearms'], category: 'compound', equipment: 'barbell', default_increment: 2.5 },
  { id: 'straight-arm-pulldown', name: 'Straight Arm Pulldown', muscle_group: 'back', secondary_muscles: [], category: 'isolation', equipment: 'cable', default_increment: 2.5 },

  // === SHOULDERS ===
  { id: 'overhead-press', name: 'Overhead Press', muscle_group: 'shoulders', secondary_muscles: ['triceps'], category: 'compound', equipment: 'barbell', default_increment: 2.5 },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', muscle_group: 'shoulders', secondary_muscles: ['triceps'], category: 'compound', equipment: 'dumbbell', default_increment: 2.0 },
  { id: 'smith-shoulder-press', name: 'Smith Machine Shoulder Press', muscle_group: 'shoulders', secondary_muscles: ['triceps'], category: 'compound', equipment: 'smith-machine', default_increment: 2.5 },
  { id: 'lateral-raise', name: 'Lateral Raise', muscle_group: 'shoulders', secondary_muscles: [], category: 'isolation', equipment: 'dumbbell', default_increment: 1.0 },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', muscle_group: 'shoulders', secondary_muscles: [], category: 'isolation', equipment: 'cable', default_increment: 1.0 },
  { id: 'machine-lateral-raise', name: 'Machine Lateral Raise', muscle_group: 'shoulders', secondary_muscles: [], category: 'isolation', equipment: 'machine', default_increment: 2.5 },
  { id: 'rear-delt-flye', name: 'Rear Delt Flye', muscle_group: 'shoulders', secondary_muscles: ['traps'], category: 'isolation', equipment: 'dumbbell', default_increment: 1.0 },
  { id: 'face-pull', name: 'Face Pull', muscle_group: 'shoulders', secondary_muscles: ['traps'], category: 'isolation', equipment: 'cable', default_increment: 2.5 },
  { id: 'arnold-press', name: 'Arnold Press', muscle_group: 'shoulders', secondary_muscles: ['triceps'], category: 'compound', equipment: 'dumbbell', default_increment: 2.0 },
  { id: 'upright-row', name: 'Upright Row', muscle_group: 'shoulders', secondary_muscles: ['traps'], category: 'compound', equipment: 'barbell', default_increment: 2.5 },

  // === QUADRICEPS ===
  { id: 'barbell-squat', name: 'Barbell Squat', muscle_group: 'quadriceps', secondary_muscles: ['glutes', 'hamstrings', 'core'], category: 'compound', equipment: 'barbell', default_increment: 2.5 },
  { id: 'front-squat', name: 'Front Squat', muscle_group: 'quadriceps', secondary_muscles: ['glutes', 'core'], category: 'compound', equipment: 'barbell', default_increment: 2.5 },
  { id: 'smith-squat', name: 'Smith Machine Squat', muscle_group: 'quadriceps', secondary_muscles: ['glutes', 'hamstrings'], category: 'compound', equipment: 'smith-machine', default_increment: 5.0 },
  { id: 'leg-press', name: 'Leg Press', muscle_group: 'quadriceps', secondary_muscles: ['glutes'], category: 'compound', equipment: 'machine', default_increment: 5.0 },
  { id: 'leg-extension', name: 'Leg Extension', muscle_group: 'quadriceps', secondary_muscles: [], category: 'isolation', equipment: 'machine', default_increment: 2.5 },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', muscle_group: 'quadriceps', secondary_muscles: ['glutes', 'hamstrings'], category: 'compound', equipment: 'dumbbell', default_increment: 2.0 },
  { id: 'hack-squat', name: 'Hack Squat', muscle_group: 'quadriceps', secondary_muscles: ['glutes'], category: 'compound', equipment: 'machine', default_increment: 5.0 },
  { id: 'goblet-squat', name: 'Goblet Squat', muscle_group: 'quadriceps', secondary_muscles: ['glutes', 'core'], category: 'compound', equipment: 'dumbbell', default_increment: 2.0 },
  { id: 'walking-lunge', name: 'Walking Lunge', muscle_group: 'quadriceps', secondary_muscles: ['glutes', 'hamstrings'], category: 'compound', equipment: 'dumbbell', default_increment: 2.0 },
  { id: 'sissy-squat', name: 'Sissy Squat', muscle_group: 'quadriceps', secondary_muscles: [], category: 'isolation', equipment: 'bodyweight', default_increment: 0 },

  // === HAMSTRINGS ===
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscle_group: 'hamstrings', secondary_muscles: ['glutes', 'back'], category: 'compound', equipment: 'barbell', default_increment: 2.5 },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl', muscle_group: 'hamstrings', secondary_muscles: [], category: 'isolation', equipment: 'machine', default_increment: 2.5 },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', muscle_group: 'hamstrings', secondary_muscles: [], category: 'isolation', equipment: 'machine', default_increment: 2.5 },
  { id: 'single-leg-curl', name: 'Single Leg Curl', muscle_group: 'hamstrings', secondary_muscles: [], category: 'isolation', equipment: 'machine', default_increment: 2.5 },
  { id: 'db-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', muscle_group: 'hamstrings', secondary_muscles: ['glutes', 'back'], category: 'compound', equipment: 'dumbbell', default_increment: 2.0 },
  { id: 'nordic-curl', name: 'Nordic Hamstring Curl', muscle_group: 'hamstrings', secondary_muscles: [], category: 'isolation', equipment: 'bodyweight', default_increment: 0 },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', muscle_group: 'hamstrings', secondary_muscles: ['glutes', 'back', 'quadriceps'], category: 'compound', equipment: 'barbell', default_increment: 5.0 },

  // === GLUTES ===
  { id: 'hip-thrust', name: 'Hip Thrust', muscle_group: 'glutes', secondary_muscles: ['hamstrings'], category: 'compound', equipment: 'barbell', default_increment: 5.0 },
  { id: 'cable-pull-through', name: 'Cable Pull-Through', muscle_group: 'glutes', secondary_muscles: ['hamstrings'], category: 'isolation', equipment: 'cable', default_increment: 2.5 },
  { id: 'glute-bridge', name: 'Glute Bridge', muscle_group: 'glutes', secondary_muscles: ['hamstrings'], category: 'isolation', equipment: 'barbell', default_increment: 5.0 },

  // === BICEPS ===
  { id: 'barbell-curl', name: 'Barbell Curl', muscle_group: 'biceps', secondary_muscles: ['forearms'], category: 'isolation', equipment: 'barbell', default_increment: 2.5 },
  { id: 'ez-bar-curl', name: 'EZ Bar Curl', muscle_group: 'biceps', secondary_muscles: ['forearms'], category: 'isolation', equipment: 'ez-bar', default_increment: 2.5 },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', muscle_group: 'biceps', secondary_muscles: ['forearms'], category: 'isolation', equipment: 'dumbbell', default_increment: 1.0 },
  { id: 'hammer-curl', name: 'Hammer Curl', muscle_group: 'biceps', secondary_muscles: ['forearms'], category: 'isolation', equipment: 'dumbbell', default_increment: 1.0 },
  { id: 'incline-db-curl', name: 'Incline Dumbbell Curl', muscle_group: 'biceps', secondary_muscles: [], category: 'isolation', equipment: 'dumbbell', default_increment: 1.0 },
  { id: 'cable-curl', name: 'Cable Curl', muscle_group: 'biceps', secondary_muscles: ['forearms'], category: 'isolation', equipment: 'cable', default_increment: 2.5 },
  { id: 'bayesian-curl', name: 'Bayesian Cable Curl', muscle_group: 'biceps', secondary_muscles: [], category: 'isolation', equipment: 'cable', default_increment: 1.0 },
  { id: 'preacher-curl', name: 'Preacher Curl', muscle_group: 'biceps', secondary_muscles: [], category: 'isolation', equipment: 'ez-bar', default_increment: 2.5 },
  { id: 'concentration-curl', name: 'Concentration Curl', muscle_group: 'biceps', secondary_muscles: [], category: 'isolation', equipment: 'dumbbell', default_increment: 1.0 },

  // === TRICEPS ===
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscle_group: 'triceps', secondary_muscles: [], category: 'isolation', equipment: 'cable', default_increment: 2.5 },
  { id: 'overhead-tricep-ext', name: 'Overhead Tricep Extension', muscle_group: 'triceps', secondary_muscles: [], category: 'isolation', equipment: 'cable', default_increment: 2.5 },
  { id: 'skull-crusher', name: 'Skull Crusher', muscle_group: 'triceps', secondary_muscles: [], category: 'isolation', equipment: 'ez-bar', default_increment: 2.5 },
  { id: 'close-grip-bench', name: 'Close Grip Bench Press', muscle_group: 'triceps', secondary_muscles: ['chest'], category: 'compound', equipment: 'barbell', default_increment: 2.5 },
  { id: 'dips-triceps', name: 'Dips (Triceps)', muscle_group: 'triceps', secondary_muscles: ['chest', 'shoulders'], category: 'compound', equipment: 'bodyweight', default_increment: 2.5 },
  { id: 'kickback', name: 'Tricep Kickback', muscle_group: 'triceps', secondary_muscles: [], category: 'isolation', equipment: 'dumbbell', default_increment: 1.0 },
  { id: 'diamond-push-up', name: 'Diamond Push-Up', muscle_group: 'triceps', secondary_muscles: ['chest', 'shoulders'], category: 'compound', equipment: 'bodyweight', default_increment: 0 },

  // === TRAPS ===
  { id: 'barbell-shrug', name: 'Barbell Shrug', muscle_group: 'traps', secondary_muscles: [], category: 'isolation', equipment: 'barbell', default_increment: 5.0 },
  { id: 'dumbbell-shrug', name: 'Dumbbell Shrug', muscle_group: 'traps', secondary_muscles: [], category: 'isolation', equipment: 'dumbbell', default_increment: 2.0 },

  // === FOREARMS ===
  { id: 'wrist-curl', name: 'Wrist Curl', muscle_group: 'forearms', secondary_muscles: [], category: 'isolation', equipment: 'barbell', default_increment: 1.0 },
  { id: 'reverse-curl', name: 'Reverse Curl', muscle_group: 'forearms', secondary_muscles: ['biceps'], category: 'isolation', equipment: 'barbell', default_increment: 2.5 },

  // === CALVES ===
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', muscle_group: 'calves', secondary_muscles: [], category: 'isolation', equipment: 'machine', default_increment: 5.0 },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscle_group: 'calves', secondary_muscles: [], category: 'isolation', equipment: 'machine', default_increment: 2.5 },
  { id: 'leg-press-calf-raise', name: 'Leg Press Calf Raise', muscle_group: 'calves', secondary_muscles: [], category: 'isolation', equipment: 'machine', default_increment: 5.0 },

  // === CORE ===
  { id: 'plank', name: 'Plank', muscle_group: 'core', secondary_muscles: [], category: 'isolation', equipment: 'bodyweight', default_increment: 0 },
  { id: 'cable-crunch', name: 'Cable Crunch', muscle_group: 'core', secondary_muscles: [], category: 'isolation', equipment: 'cable', default_increment: 2.5 },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscle_group: 'core', secondary_muscles: [], category: 'isolation', equipment: 'bodyweight', default_increment: 0 },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', muscle_group: 'core', secondary_muscles: [], category: 'isolation', equipment: 'other', default_increment: 0 },
  { id: 'russian-twist', name: 'Russian Twist', muscle_group: 'core', secondary_muscles: [], category: 'isolation', equipment: 'dumbbell', default_increment: 1.0 },
  { id: 'decline-crunch', name: 'Decline Crunch', muscle_group: 'core', secondary_muscles: [], category: 'isolation', equipment: 'bodyweight', default_increment: 0 },
  { id: 'pallof-press', name: 'Pallof Press', muscle_group: 'core', secondary_muscles: [], category: 'isolation', equipment: 'cable', default_increment: 2.5 },
  { id: 'woodchop', name: 'Cable Woodchop', muscle_group: 'core', secondary_muscles: ['shoulders'], category: 'isolation', equipment: 'cable', default_increment: 2.5 },
  { id: 'dead-bug', name: 'Dead Bug', muscle_group: 'core', secondary_muscles: [], category: 'isolation', equipment: 'bodyweight', default_increment: 0 },
];

/**
 * Seed the exercise library into the database.
 * Uses INSERT OR IGNORE so new exercises are added without overwriting existing ones.
 * This means existing users automatically get newly added exercises on app update.
 */
export async function seedExercises(db) {
  const stmt = await db.prepareAsync(
    'INSERT OR IGNORE INTO exercises (id, name, muscle_group, secondary_muscles, category, equipment, default_increment) VALUES ($id, $name, $muscleGroup, $secondaryMuscles, $category, $equipment, $defaultIncrement)'
  );

  try {
    for (const ex of EXERCISE_SEED) {
      await stmt.executeAsync({
        $id: ex.id,
        $name: ex.name,
        $muscleGroup: ex.muscle_group,
        $secondaryMuscles: JSON.stringify(ex.secondary_muscles),
        $category: ex.category,
        $equipment: ex.equipment,
        $defaultIncrement: ex.default_increment,
      });
    }
  } finally {
    await stmt.finalizeAsync();
  }
}

/**
 * Seed default settings (only if empty)
 */
export async function seedSettings(db) {
  const existing = await db.getFirstAsync('SELECT COUNT(*) as count FROM settings');
  if (existing.count > 0) return;

  const defaults = [
    ['weight_unit', 'kg'],
    ['deload_frequency', '6'],
    ['fatigue_threshold', '70'],
  ];

  for (const [key, value] of defaults) {
    await db.runAsync(
      'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  }
}
