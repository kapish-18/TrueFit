// Volume Analyzer
// Analyzes weekly sets per muscle group and compares to optimal ranges

import { MUSCLE_GROUPS, OPTIMAL_VOLUME, MUSCLE_GROUP_LABELS } from '../utils/constants';

/**
 * Calculate weekly volume per muscle group from workout logs
 * @param {Array} logs - Workout logs with exercises (from getFullLogDataByDateRange)
 * @returns {Array} Volume analysis per muscle group
 */
export function analyzeWeeklyVolume(logs) {
  const volumeMap = {};

  // Initialize all muscle groups
  for (const mg of MUSCLE_GROUPS) {
    volumeMap[mg] = 0;
  }

  // Count sets
  for (const log of logs) {
    for (const ex of log.exercises || []) {
      const completedSets = ex.sets?.filter(s => s.reps > 0).length || 0;

      // Primary muscle gets full credit
      if (ex.muscle_group && volumeMap[ex.muscle_group] !== undefined) {
        volumeMap[ex.muscle_group] += completedSets;
      }

      // Secondary muscles get half credit
      const secondaryMuscles = ex.secondary_muscles || [];
      for (const sm of secondaryMuscles) {
        if (volumeMap[sm] !== undefined) {
          volumeMap[sm] += completedSets * 0.5;
        }
      }
    }
  }

  // Build analysis
  const analysis = MUSCLE_GROUPS.map(mg => {
    const sets = Math.round(volumeMap[mg] * 10) / 10;
    const optimal = OPTIMAL_VOLUME[mg];
    let status, statusColor;

    if (sets === 0) {
      status = 'Not Trained';
      statusColor = 'dim';
    } else if (sets < optimal.min) {
      status = 'Needs More Volume';
      statusColor = 'warning';
    } else if (sets <= optimal.max) {
      status = 'Optimal';
      statusColor = 'success';
    } else {
      status = 'Very High';
      statusColor = 'danger';
    }

    return {
      muscleGroup: mg,
      label: MUSCLE_GROUP_LABELS[mg],
      sets,
      optimalMin: optimal.min,
      optimalMax: optimal.max,
      status,
      statusColor,
      percentage: optimal.max > 0 ? Math.round((sets / optimal.max) * 100) : 0,
    };
  });

  return analysis.sort((a, b) => b.sets - a.sets);
}

/**
 * Get muscle groups that need attention (under-trained or over-trained)
 * @param {Array} volumeAnalysis - Result from analyzeWeeklyVolume
 * @returns {Object} { underTrained: [], overTrained: [] }
 */
export function getMuscleImbalances(volumeAnalysis) {
  const underTrained = volumeAnalysis.filter(v => v.status === 'Needs More Volume' && v.sets > 0);
  const overTrained = volumeAnalysis.filter(v => v.status === 'Very High');
  const notTrained = volumeAnalysis.filter(v => v.status === 'Not Trained');

  return {
    underTrained,
    overTrained,
    notTrained,
    isBalanced: underTrained.length === 0 && overTrained.length === 0,
    recommendation: generateBalanceRecommendation(underTrained, overTrained, notTrained),
  };
}

function generateBalanceRecommendation(under, over, notTrained) {
  const recommendations = [];

  if (over.length > 0) {
    recommendations.push(
      `Consider reducing volume for ${over.map(v => v.label).join(', ')}.`
    );
  }

  if (under.length > 0) {
    recommendations.push(
      `Increase volume for ${under.map(v => v.label).join(', ')}.`
    );
  }

  if (notTrained.length > 0 && notTrained.length <= 3) {
    recommendations.push(
      `${notTrained.map(v => v.label).join(', ')} ${notTrained.length === 1 ? 'was' : 'were'} not trained this week.`
    );
  }

  if (recommendations.length === 0) {
    return 'Training volume is well balanced across all muscle groups.';
  }

  return recommendations.join(' ');
}

/**
 * Get total weekly volume (all sets across all muscles)
 */
export function getTotalWeeklyVolume(logs) {
  let totalSets = 0;
  let totalVolume = 0;

  for (const log of logs) {
    for (const ex of log.exercises || []) {
      for (const s of ex.sets || []) {
        if (s.reps > 0) {
          totalSets++;
          totalVolume += (s.weight || 0) * (s.reps || 0);
        }
      }
    }
  }

  return { totalSets, totalVolume: Math.round(totalVolume) };
}
