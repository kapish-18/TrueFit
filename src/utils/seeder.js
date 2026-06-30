import { getDatabase } from '../db/database';
import { generateId } from './calculations';
import { 
  getActiveProgram, 
  getProgramDays, 
  getProgramExercises, 
  createWorkoutLog, 
  addLogExercise, 
  addLogSet 
} from '../db/dao';

export async function seedMockData() {
  const program = await getActiveProgram();
  if (!program) {
    throw new Error("You must create and activate a program first!");
  }

  const days = await getProgramDays(program.id);
  if (days.length === 0) {
    throw new Error("Your active program must have at least one day and exercises!");
  }

  // Load exercises for each day
  let hasExercises = false;
  for (const day of days) {
    day.exercises = await getProgramExercises(day.id);
    if (day.exercises.length > 0) hasExercises = true;
  }

  if (!hasExercises) {
    throw new Error("Please add exercises to your program days before generating data.");
  }

  const now = new Date();
  
  // Generate 8 weeks of data
  // We'll simulate 3 workouts a week for the active program
  for (let week = 8; week >= 0; week--) {
    for (let d = 0; d < days.length; d++) {
      const day = days[d];
      
      // Calculate date: e.g. 8 weeks ago + (d * 2) days
      const workoutDate = new Date(now);
      workoutDate.setDate(now.getDate() - (week * 7) + (d * 2));
      
      // Skip if it's in the future
      if (workoutDate > now) continue;

      const dateStr = workoutDate.toISOString().split('T')[0];

      const logId = await createWorkoutLog({
        program_id: program.id,
        day_id: day.id,
        date: dateStr,
        bodyweight: 80,
      });

      // Progressive overload logic based on weeks ago
      // Start lighter, get heavier. 8 weeks ago = 70% of target weight. Today = 100%.
      const progressFactor = 1 - (week * 0.04); 

      for (let i = 0; i < day.exercises.length; i++) {
        const ex = day.exercises[i];
        
        const logExId = await addLogExercise(logId, {
          exercise_id: ex.exercise_id,
          target_sets: ex.target_sets || 3,
          target_reps_min: ex.target_reps_min || 8,
          target_reps_max: ex.target_reps_max || 12,
          target_weight: ex.target_weight || 0,
          sort_order: i,
        });

        const setsCount = ex.target_sets || 3;
        for (let s = 1; s <= setsCount; s++) {
          const baseWeight = ex.target_weight > 0 ? ex.target_weight : 40;
          const calculatedWeight = baseWeight * progressFactor;
          let weight = Math.round(calculatedWeight / 2.5) * 2.5; 
          
          if (weight < 0) weight = 0;
          
          const min = ex.target_reps_min || 8;
          const max = ex.target_reps_max || 12;
          let reps;

          // Create realistic variety based on exercise index to test the engine's different recommendations
          if (i % 3 === 0) {
            // Case 1: Successfully progressed reps over weeks, hitting max reps today -> Should trigger "Increase Weight"
            reps = Math.min(max, min + Math.floor((8 - week) / 2));
          } else if (i % 3 === 1) {
            // Case 2: Just meeting minimum reps -> Should trigger "Aim for more reps"
            reps = min;
          } else {
            // Case 3: Failing the last set due to fatigue -> Should trigger "Maintain or Reduce"
            reps = s === setsCount ? Math.max(1, min - 2) : min;
          }
          
          await addLogSet(logExId, s, weight, reps, null);
        }
      }
    }
  }
  
  return true;
}
