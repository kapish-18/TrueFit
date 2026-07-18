// Workout Store — Zustand
// Manages current logging session state
import { create } from 'zustand';
import {
  createWorkoutLog, addLogExercise, addLogSet, updateLogSet, deleteLogSet,
  updateLogExerciseNotes, updateWorkoutLog, getLogExercises,
  getWorkoutLogById, deleteWorkoutLog, getLastPerformance
} from '../db/dao';
import { detectPRs } from '../engine/prDetector';
import { getOverloadRecommendation } from '../engine/progressiveOverload';
import { getToday } from '../utils/date';

export const useWorkoutStore = create((set, get) => ({
  currentLogId: null,
  currentDayId: null,
  currentLogDate: null,
  isDeload: false,
  exercises: [],
  bodyweight: null,
  overallNotes: '',
  isSaving: false,
  newPRs: [],

  /**
   * Start a new workout log from a program day
   */
  startWorkout: async (programId, dayId, dayExercises, isDeload = false, logDate = getToday()) => {
    const logId = await createWorkoutLog({
      program_id: programId,
      day_id: dayId,
      date: logDate,
      overall_notes: isDeload ? '[DELOAD]' : '',
    });

    const exercises = [];

    for (let i = 0; i < dayExercises.length; i++) {
      let ex = { ...dayExercises[i] };
      let prefillWeight = 0;
      let prefillReps = 0;

      if (isDeload) {
        // Fetch actual last performance to base the deload off the real weights lifted, not the template 0
        const ghost = await getLastPerformance(ex.exercise_id, null, dayId);
        let maxGhostWeight = 0;
        let ghostSetsCount = ex.target_sets || 3;
        
        if (ghost && ghost.sets && ghost.sets.length > 0) {
           maxGhostWeight = Math.max(...ghost.sets.map(s => s.weight || 0));
           ghostSetsCount = ghost.sets.length;
        }
        
        const baseWeight = Math.max(maxGhostWeight, ex.target_weight || 0);
        
        // Apply 35% reduction mathematically
        const deloadedWeight = Math.round((baseWeight * 0.65) / 2.5) * 2.5;
        
        ex.target_weight = deloadedWeight;
        ex.target_sets = Math.max(1, ghostSetsCount - 1);
        
        prefillWeight = deloadedWeight;
        prefillReps = ex.target_reps_min || 8;
      } else {
        // Normal Workout: Use progressive overload engine to set the target weight and prefill
        const ghost = await getLastPerformance(ex.exercise_id, null, dayId);
        if (ghost && ghost.sets && ghost.sets.length > 0) {
          const maxGhostWeight = Math.max(...ghost.sets.map(s => s.weight || 0));
          const rec = getOverloadRecommendation(ghost, {
            target_sets: ex.target_sets,
            target_reps_min: ex.target_reps_min,
            target_reps_max: ex.target_reps_max,
            target_weight: ex.target_weight,
          }, ex.default_increment || 2.5);

          // Save the recommended weight so the UI stops showing "-"
          ex.target_weight = rec.recommendedWeight >= 0 ? rec.recommendedWeight : maxGhostWeight;
          if (rec.recommendedSets) ex.target_sets = rec.recommendedSets;
          
          prefillWeight = ex.target_weight;
          prefillReps = rec.recommendedRepsMin || ex.target_reps_min || 8;
        } else {
          // Absolute first time doing this exercise
          prefillWeight = ex.target_weight || 0;
          prefillReps = ex.target_reps_min || 8;
        }
      }

      const logExId = await addLogExercise(logId, {
        exercise_id: ex.exercise_id,
        target_sets: ex.target_sets,
        target_reps_min: ex.target_reps_min,
        target_reps_max: ex.target_reps_max,
        target_weight: ex.target_weight,
        notes: ex.notes || '',
        sort_order: i,
      });

      // Pre-create empty sets
      const sets = [];
      for (let s = 0; s < (ex.target_sets || 3); s++) {
        const setId = await addLogSet(logExId, s + 1, prefillWeight, prefillReps);
        sets.push({
          id: setId,
          log_exercise_id: logExId,
          set_number: s + 1,
          weight: prefillWeight,
          reps: prefillReps,
          rpe: null,
        });
      }

      exercises.push({
        id: logExId,
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name || ex.name,
        muscle_group: ex.muscle_group,
        secondary_muscles: ex.secondary_muscles || [],
        category: ex.category,
        equipment: ex.equipment,
        default_increment: ex.default_increment,
        target_sets: ex.target_sets,
        target_reps_min: ex.target_reps_min,
        target_reps_max: ex.target_reps_max,
        target_weight: ex.target_weight,
        notes: ex.notes || '',
        sets,
      });
    }

    set({
      currentLogId: logId,
      currentDayId: dayId,
      currentLogDate: getToday(),
      isDeload,
      exercises,
      bodyweight: null,
      overallNotes: isDeload ? '[DELOAD]' : '',
      newPRs: [],
    });

    return logId;
  },

  /**
   * Load an existing workout log for editing
   */
  loadWorkout: async (logId) => {
    const log = await getWorkoutLogById(logId);
    if (!log) return;

    const exercises = await getLogExercises(logId);

    set({
      currentLogId: logId,
      currentDayId: log.day_id,
      currentLogDate: log.date,
      isDeload: (log.overall_notes || '').includes('[DELOAD]'),
      exercises,
      bodyweight: log.bodyweight,
      overallNotes: log.overall_notes || '',
      newPRs: [],
    });
  },

  /**
   * Update a specific set's data
   */
  updateSet: async (logExerciseId, setId, data) => {
    await updateLogSet(setId, data);

    set(state => ({
      exercises: state.exercises.map(ex => {
        if (ex.id !== logExerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map(s =>
            s.id === setId ? { ...s, ...data } : s
          ),
        };
      }),
    }));
  },

  /**
   * Add a new set to an exercise
   */
  addSet: async (logExerciseId) => {
    const state = get();
    const exercise = state.exercises.find(e => e.id === logExerciseId);
    if (!exercise) return;

    const existingSets = exercise.sets || [];
    const lastSet = existingSets[existingSets.length - 1];
    const prefillWeight = lastSet?.weight || 0;
    const prefillReps = lastSet?.reps || 0;

    const newSetNumber = existingSets.length + 1;
    const setId = await addLogSet(logExerciseId, newSetNumber, prefillWeight, prefillReps);

    set(state => ({
      exercises: state.exercises.map(ex => {
        if (ex.id !== logExerciseId) return ex;
        return {
          ...ex,
          sets: [...(ex.sets || []), {
            id: setId,
            log_exercise_id: logExerciseId,
            set_number: newSetNumber,
            weight: prefillWeight,
            reps: prefillReps,
            rpe: null,
          }],
        };
      }),
    }));
  },

  /**
   * Delete a set from an exercise
   */
  deleteSet: async (logExerciseId, setId) => {
    await deleteLogSet(setId);

    set(state => ({
      exercises: state.exercises.map(ex => {
        if (ex.id !== logExerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.filter(s => s.id !== setId),
        };
      }),
    }));
  },

  /**
   * Update exercise notes
   */
  updateExerciseNotes: async (logExerciseId, notes) => {
    await updateLogExerciseNotes(logExerciseId, notes);
    set(state => ({
      exercises: state.exercises.map(ex =>
        ex.id === logExerciseId ? { ...ex, notes } : ex
      ),
    }));
  },

  /**
   * Set bodyweight
   */
  setBodyweight: (weight) => set({ bodyweight: weight }),

  /**
   * Set overall notes
   */
  setOverallNotes: (notes) => set({ overallNotes: notes }),

  /**
   * Save/finalize the workout and detect PRs
   */
  saveWorkout: async () => {
    const state = get();
    if (!state.currentLogId) return [];

    set({ isSaving: true });

    try {
      // Update the log with bodyweight and notes
      await updateWorkoutLog(state.currentLogId, {
        bodyweight: state.bodyweight,
        overall_notes: state.overallNotes,
      });

      // Detect PRs
      const prs = await detectPRs(state.exercises);

      set({ newPRs: prs, isSaving: false });
      return prs;
    } catch (e) {
      console.error('Failed to save workout:', e);
      set({ isSaving: false });
      return [];
    }
  },

  /**
   * Delete the current workout log
   */
  deleteCurrentWorkout: async () => {
    const state = get();
    if (state.currentLogId) {
      await deleteWorkoutLog(state.currentLogId);
    }
    set({
      currentLogId: null,
      currentDayId: null,
      isDeload: false,
      exercises: [],
      bodyweight: null,
      overallNotes: '',
      newPRs: [],
    });
  },

  /**
   * Clear current session
   */
  clearSession: () => set({
    currentLogId: null,
    currentDayId: null,
    isDeload: false,
    exercises: [],
    bodyweight: null,
    overallNotes: '',
    newPRs: [],
  }),
}));
