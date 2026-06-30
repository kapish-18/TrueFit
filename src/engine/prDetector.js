// PR Detector
// Automatically identifies new personal records

import { estimate1RM } from '../utils/calculations';
import { getLatestPR, addPersonalRecord } from '../db/dao';
import { getToday } from '../utils/date';

/**
 * Check for new PRs after a workout is logged
 * @param {Array} logExercises - Logged exercises with their sets
 * @returns {Array} Array of new PRs detected
 */
export async function detectPRs(logExercises) {
  const newPRs = [];

  for (const ex of logExercises) {
    if (!ex.sets || ex.sets.length === 0) continue;

    // Check each set for potential PRs
    for (const set of ex.sets) {
      if (!set.weight || set.weight <= 0 || !set.reps || set.reps <= 0) continue;

      // Check weight PR (heaviest weight at any reps)
      const weightPR = await checkWeightPR(ex.exercise_id, set.weight, set.reps);
      if (weightPR) {
        newPRs.push({
          ...weightPR,
          exerciseName: ex.exercise_name,
        });
      }

      // Check estimated 1RM PR
      const e1rmPR = await checkE1RMPR(ex.exercise_id, set.weight, set.reps);
      if (e1rmPR) {
        newPRs.push({
          ...e1rmPR,
          exerciseName: ex.exercise_name,
        });
      }
    }

    // Check rep PR (most reps at a given weight)
    const bestRepSet = ex.sets.reduce((best, s) => {
      if ((s.reps || 0) > (best.reps || 0)) return s;
      return best;
    }, ex.sets[0]);

    if (bestRepSet?.reps > 0) {
      const repPR = await checkRepPR(ex.exercise_id, bestRepSet.weight, bestRepSet.reps);
      if (repPR) {
        newPRs.push({
          ...repPR,
          exerciseName: ex.exercise_name,
        });
      }
    }
  }

  return newPRs;
}

async function checkWeightPR(exerciseId, weight, reps) {
  const currentPR = await getLatestPR(exerciseId, 'weight');

  if (!currentPR || weight > currentPR.value) {
    const id = await addPersonalRecord({
      exercise_id: exerciseId,
      type: 'weight',
      value: weight,
      reps: reps,
      estimated_1rm: estimate1RM(weight, reps),
      date: getToday(),
    });

    return {
      id,
      type: 'weight',
      value: weight,
      reps,
      previousBest: currentPR?.value || null,
      improvement: currentPR ? weight - currentPR.value : null,
    };
  }

  return null;
}

async function checkE1RMPR(exerciseId, weight, reps) {
  const e1rm = estimate1RM(weight, reps);
  const currentPR = await getLatestPR(exerciseId, 'estimated_1rm');

  if (!currentPR || e1rm > currentPR.value) {
    const id = await addPersonalRecord({
      exercise_id: exerciseId,
      type: 'estimated_1rm',
      value: e1rm,
      reps: reps,
      estimated_1rm: e1rm,
      date: getToday(),
    });

    return {
      id,
      type: 'estimated_1rm',
      value: e1rm,
      reps,
      previousBest: currentPR?.value || null,
      improvement: currentPR ? Math.round((e1rm - currentPR.value) * 10) / 10 : null,
    };
  }

  return null;
}

async function checkRepPR(exerciseId, weight, reps) {
  const currentPR = await getLatestPR(exerciseId, 'reps');

  if (!currentPR || reps > currentPR.value) {
    const id = await addPersonalRecord({
      exercise_id: exerciseId,
      type: 'reps',
      value: reps,
      reps: reps,
      estimated_1rm: estimate1RM(weight, reps),
      date: getToday(),
    });

    return {
      id,
      type: 'reps',
      value: reps,
      weight,
      previousBest: currentPR?.value || null,
      improvement: currentPR ? reps - currentPR.value : null,
    };
  }

  return null;
}
