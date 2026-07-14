// Strength training calculation utilities

/**
 * Estimate 1RM using Epley formula
 * @param {number} weight - Weight lifted
 * @param {number} reps - Reps performed (must be > 1 for estimation)
 * @returns {number} Estimated 1RM
 */
export function estimate1RM(weight, reps) {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  // Epley formula
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Calculate total volume for a set (weight × reps)
 */
export function setVolume(weight, reps) {
  return (weight || 0) * (reps || 0);
}

/**
 * Calculate total volume for an exercise's completed sets
 * @param {Array} sets - Array of { weight, reps }
 * @returns {number} Total volume
 */
export function exerciseVolume(sets) {
  return sets.reduce((total, s) => total + setVolume(s.weight, s.reps), 0);
}

/**
 * Calculate percentage change between two values
 */
export function percentChange(oldVal, newVal) {
  if (oldVal === 0) return newVal > 0 ? 100 : 0;
  return Math.round(((newVal - oldVal) / oldVal) * 100 * 10) / 10;
}

/**
 * Calculate weight increment recommendation
 * @param {number} currentWeight - Current weight
 * @param {number} defaultIncrement - Default increment for the exercise
 * @returns {number} Recommended next weight
 */
export function recommendedWeight(currentWeight, defaultIncrement = 2.5) {
  return Math.round((currentWeight + defaultIncrement) * 10) / 10;
}

/**
 * Check if all sets in a workout hit the target rep range
 * @param {Array} completedSets - Array of { weight, reps }
 * @param {number} targetRepsMin - Minimum target reps
 * @param {number} targetRepsMax - Maximum target reps
 * @param {number} targetWeight - Target weight
 * @returns {'exceeded' | 'met' | 'partial' | 'failed'}
 */
export function evaluatePerformance(completedSets, targetRepsMin, targetRepsMax, targetWeight) {
  if (!completedSets || completedSets.length === 0) return 'failed';

  const validSets = completedSets.filter(s => s.weight >= 0 && s.reps > 0);
  if (validSets.length === 0) return 'failed';

  const allHitTarget = validSets.every(
    s => s.weight >= targetWeight && s.reps >= targetRepsMin
  );
  const allExceeded = validSets.every(
    s => s.weight >= targetWeight && s.reps >= targetRepsMax
  );
  const someHit = validSets.some(
    s => s.weight >= targetWeight && s.reps >= targetRepsMin
  );

  if (allExceeded) return 'exceeded';
  if (allHitTarget) return 'met';
  if (someHit) return 'partial';

  // NEW: Check if weight is below target but reps are good
  // e.g. target 40kg×8-12, performed 37.5kg×11 — the user is progressing, not failing
  const allRepsGood = validSets.every(s => s.reps >= targetRepsMin);
  const avgWeight = validSets.reduce((sum, s) => sum + s.weight, 0) / validSets.length;
  if (allRepsGood && avgWeight < targetWeight) {
    return 'below_weight';
  }

  return 'failed';
}

/**
 * Calculate weekly set count for a muscle group
 * @param {string} muscleGroup - Target muscle group
 * @param {Array} exercises - Array of exercises with muscle mapping
 * @param {number} primaryWeight - Weight for primary muscle (default 1.0)
 * @param {number} secondaryWeight - Weight for secondary muscle (default 0.5)
 * @returns {number} Weighted set count
 */
export function calculateMuscleVolume(muscleGroup, exercises, primaryWeight = 1.0, secondaryWeight = 0.5) {
  let totalSets = 0;

  for (const ex of exercises) {
    const sets = ex.completedSets?.length || ex.targetSets || 0;

    if (ex.muscleGroup === muscleGroup) {
      totalSets += sets * primaryWeight;
    } else if (ex.secondaryMuscles?.includes(muscleGroup)) {
      totalSets += sets * secondaryWeight;
    }
  }

  return Math.round(totalSets * 10) / 10;
}

/**
 * Round weight to nearest increment
 */
export function roundToIncrement(weight, increment = 2.5) {
  return Math.round(weight / increment) * increment;
}

/**
 * Generate a UUID v4
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
