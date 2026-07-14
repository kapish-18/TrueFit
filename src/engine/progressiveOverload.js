// Progressive Overload Advisor
// Recommends next workout weights/reps based on recent performance

import { estimate1RM, evaluatePerformance, recommendedWeight } from '../utils/calculations';

/**
 * Generate progressive overload recommendation for an exercise
 * @param {Object} lastPerformance - Last workout data (from getLastPerformance)
 * @param {Object} currentTarget - Current program targets { target_sets, target_reps_min, target_reps_max, target_weight }
 * @param {number} defaultIncrement - Exercise's default weight increment
 * @returns {Object} Recommendation
 */
export function getOverloadRecommendation(lastPerformance, currentTarget, defaultIncrement = 2.5) {
  if (!lastPerformance || !lastPerformance.sets || lastPerformance.sets.length === 0) {
    return {
      type: 'first_time',
      message: 'First time logging this exercise. Start with a comfortable weight.',
      recommendedWeight: currentTarget.target_weight || 0,
      recommendedRepsMin: currentTarget.target_reps_min,
      recommendedRepsMax: currentTarget.target_reps_max,
      recommendedSets: currentTarget.target_sets,
      confidence: 'low',
    };
  }

  const { sets } = lastPerformance;
  const targetRepsMin = lastPerformance.target_reps_min || currentTarget.target_reps_min || 6;
  const targetRepsMax = lastPerformance.target_reps_max || currentTarget.target_reps_max || 12;

  // Bug #9: When target_weight is null/undefined (not 0), use the average weight from last session
  // as the implicit target. 0 is a valid target for bodyweight exercises.
  const avgWeightFromSets = Math.round(sets.reduce((sum, s) => sum + (s.weight || 0), 0) / sets.length * 10) / 10;
  const targetWeight = lastPerformance.target_weight ?? currentTarget.target_weight ?? avgWeightFromSets;

  const performance = evaluatePerformance(sets, targetRepsMin, targetRepsMax, targetWeight);

  // Find the best set (highest weight × reps)
  const bestSet = sets.reduce((best, s) => {
    const vol = (s.weight || 0) * (s.reps || 0);
    const bestVol = (best.weight || 0) * (best.reps || 0);
    return vol > bestVol ? s : best;
  }, sets[0]);

  // Average reps achieved
  const avgReps = Math.round(sets.reduce((sum, s) => sum + (s.reps || 0), 0) / sets.length);
  const avgWeight = Math.round(sets.reduce((sum, s) => sum + (s.weight || 0), 0) / sets.length * 10) / 10;

  // Check if ALL sets hit max reps (needed for weight increase decision)
  const allSetsMaxed = sets.every(s => (s.reps || 0) >= targetRepsMax);

  switch (performance) {
    case 'exceeded':
      // All sets hit max reps at target weight → increase weight
      return {
        type: 'increase_weight',
        message: `All sets hit ${targetRepsMax} reps. Increase weight by ${defaultIncrement}kg.`,
        recommendedWeight: recommendedWeight(avgWeight, defaultIncrement),
        recommendedRepsMin: targetRepsMin,
        recommendedRepsMax: targetRepsMax,
        recommendedSets: currentTarget.target_sets,
        lastPerformance: { weight: avgWeight, reps: avgReps },
        confidence: 'high',
      };

    case 'met':
      // All sets hit min reps but NOT max → aim for more reps
      return {
        type: 'increase_reps',
        message: `Good work! Aim for ${targetRepsMax} reps at ${avgWeight}kg before increasing weight.`,
        recommendedWeight: avgWeight,
        recommendedRepsMin: Math.min(avgReps + 1, targetRepsMax),
        recommendedRepsMax: targetRepsMax,
        recommendedSets: currentTarget.target_sets,
        lastPerformance: { weight: avgWeight, reps: avgReps },
        confidence: 'high',
      };

    case 'partial':
      // Some sets hit, some didn't → repeat same weight
      return {
        type: 'maintain',
        message: `Partially hit target. Repeat ${avgWeight}kg and aim for consistency.`,
        recommendedWeight: avgWeight,
        recommendedRepsMin: targetRepsMin,
        recommendedRepsMax: targetRepsMax,
        recommendedSets: currentTarget.target_sets,
        lastPerformance: { weight: avgWeight, reps: avgReps },
        confidence: 'medium',
      };

    case 'below_weight': {
      // Weight is below target but reps are solid
      if (allSetsMaxed) {
        // All sets hit max reps → OK to increase weight toward target
        const nextWeight = Math.min(
          recommendedWeight(avgWeight, defaultIncrement),
          targetWeight
        );
        return {
          type: 'increase_weight',
          message: `All sets hit ${targetRepsMax} reps at ${avgWeight}kg! Increase to ${nextWeight}kg.`,
          recommendedWeight: nextWeight,
          recommendedRepsMin: targetRepsMin,
          recommendedRepsMax: targetRepsMax,
          recommendedSets: currentTarget.target_sets,
          lastPerformance: { weight: avgWeight, reps: avgReps },
          confidence: 'high',
        };
      } else {
        // Reps haven't maxed out yet → push for more reps first
        return {
          type: 'increase_reps',
          message: `Aim for ${targetRepsMax} reps at ${avgWeight}kg before increasing weight.`,
          recommendedWeight: avgWeight,
          recommendedRepsMin: Math.min(avgReps + 1, targetRepsMax),
          recommendedRepsMax: targetRepsMax,
          recommendedSets: currentTarget.target_sets,
          lastPerformance: { weight: avgWeight, reps: avgReps },
          confidence: 'high',
        };
      }
    }

    case 'failed':
    default: {
      // Didn't meet minimum → consider reducing (but not to the same weight)
      const reducedWeight = Math.round((avgWeight * 0.9) / defaultIncrement) * defaultIncrement;
      const shouldReduce = reducedWeight < avgWeight && avgWeight > 0;

      if (shouldReduce) {
        return {
          type: 'reduce',
          message: `Target not reached. Consider reducing to ${reducedWeight}kg.`,
          recommendedWeight: Math.max(reducedWeight, 0),
          recommendedRepsMin: targetRepsMin,
          recommendedRepsMax: targetRepsMax,
          recommendedSets: currentTarget.target_sets,
          alternatives: [
            {
              type: 'maintain',
              message: `Or keep ${avgWeight}kg and focus on form.`,
              weight: avgWeight,
              repsMin: targetRepsMin,
              repsMax: targetRepsMax,
            },
          ],
          lastPerformance: { weight: avgWeight, reps: avgReps },
          confidence: 'medium',
        };
      } else {
        // Weight is already low or 0 — just maintain and focus on form/reps
        return {
          type: 'maintain',
          message: `Keep at ${avgWeight}kg and focus on hitting ${targetRepsMin}+ reps with good form.`,
          recommendedWeight: avgWeight,
          recommendedRepsMin: targetRepsMin,
          recommendedRepsMax: targetRepsMax,
          recommendedSets: currentTarget.target_sets,
          lastPerformance: { weight: avgWeight, reps: avgReps },
          confidence: 'medium',
        };
      }
    }
  }
}

/**
 * Check if an exercise is plateaued (3+ weeks with no progression)
 * @param {Array} history - Exercise history (from getExerciseHistory)
 * @returns {Object} Plateau analysis
 */
export function detectPlateau(history) {
  if (!history || history.length < 3) {
    return { isPlateau: false, weeks: 0 };
  }

  // Check last 3 sessions for estimated 1RM trend
  const e1rms = history.slice(0, 3).map(h => {
    if (!h.sets || h.sets.length === 0) return 0;
    const best = h.sets.reduce((b, s) => {
      const e1rm = estimate1RM(s.weight, s.reps);
      return e1rm > b ? e1rm : b;
    }, 0);
    return best;
  });

  // If e1RM hasn't improved in 3 sessions
  const noImprovement = e1rms[0] <= e1rms[1] && e1rms[1] <= e1rms[2];

  return {
    isPlateau: noImprovement,
    weeks: noImprovement ? 3 : 0,
    recentE1RMs: e1rms,
    suggestion: noImprovement
      ? 'Consider changing rep ranges, adding volume, or taking a deload week.'
      : null,
  };
}
