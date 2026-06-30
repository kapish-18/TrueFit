// Weekly Report Generator
// Summarizes weekly training with actionable insights

import { analyzeWeeklyVolume, getMuscleImbalances, getTotalWeeklyVolume } from './volumeAnalyzer';
import { getRecentPRs, getWeeklyWorkoutCount } from '../db/dao';
import { getWeekStart, getToday } from '../utils/date';

/**
 * Generate a weekly training report
 * @param {Array} thisWeekLogs - This week's workout logs (with exercises and sets)
 * @param {Array} lastWeekLogs - Last week's workout logs
 * @param {number} fatigueScore - Current fatigue score
 * @returns {Object} Weekly report
 */
export function generateWeeklyReport(thisWeekLogs, lastWeekLogs, fatigueScore = 0) {
  const highlights = [];
  const warnings = [];
  const recommendations = [];

  // Workout count
  const workoutsThisWeek = thisWeekLogs.length;
  const workoutsLastWeek = lastWeekLogs.length;

  if (workoutsThisWeek > 0) {
    highlights.push({
      icon: '✅',
      text: `${workoutsThisWeek} workout${workoutsThisWeek !== 1 ? 's' : ''} completed`,
    });
  }

  if (workoutsThisWeek < workoutsLastWeek && workoutsLastWeek > 0) {
    warnings.push({
      icon: '⚠',
      text: `Fewer workouts than last week (${workoutsThisWeek} vs ${workoutsLastWeek})`,
    });
  }

  // Volume comparison
  const thisWeekVolume = getTotalWeeklyVolume(thisWeekLogs);
  const lastWeekVolume = getTotalWeeklyVolume(lastWeekLogs);

  if (thisWeekVolume.totalVolume > lastWeekVolume.totalVolume && lastWeekVolume.totalVolume > 0) {
    const increase = Math.round(
      ((thisWeekVolume.totalVolume - lastWeekVolume.totalVolume) / lastWeekVolume.totalVolume) * 100
    );
    if (increase > 0) {
      highlights.push({
        icon: '📈',
        text: `Total volume increased ${increase}%`,
      });
    }
  } else if (thisWeekVolume.totalVolume < lastWeekVolume.totalVolume * 0.85 && lastWeekVolume.totalVolume > 0) {
    warnings.push({
      icon: '📉',
      text: 'Total volume decreased significantly',
    });
  }

  // Volume analysis
  const volumeAnalysis = analyzeWeeklyVolume(thisWeekLogs);
  const imbalances = getMuscleImbalances(volumeAnalysis);

  if (imbalances.underTrained.length > 0) {
    warnings.push({
      icon: '⚠',
      text: `${imbalances.underTrained.map(v => v.label).join(', ')} volume is below optimal`,
    });
  }

  if (imbalances.overTrained.length > 0) {
    warnings.push({
      icon: '⚠',
      text: `${imbalances.overTrained.map(v => v.label).join(', ')} volume is very high`,
    });
  }

  // Fatigue-based recommendation
  if (fatigueScore > 70) {
    recommendations.push('Consider maintaining weights next week instead of increasing.');
  } else if (fatigueScore > 50) {
    recommendations.push('Monitor recovery. Increase volume cautiously.');
  } else if (workoutsThisWeek >= 3) {
    recommendations.push('Good recovery levels. You can push for progression next week.');
  }

  // Weight increase tracking
  const weightIncreases = findWeightIncreases(thisWeekLogs, lastWeekLogs);
  for (const inc of weightIncreases) {
    highlights.push({
      icon: '✅',
      text: `${inc.exerciseName} increased ${inc.increase}kg`,
    });
  }

  return {
    weekStart: getWeekStart(),
    workoutsCompleted: workoutsThisWeek,
    totalSets: thisWeekVolume.totalSets,
    totalVolume: thisWeekVolume.totalVolume,
    highlights,
    warnings,
    recommendations,
    volumeAnalysis,
    fatigueScore,
  };
}

/**
 * Find exercises where weight increased compared to last week
 */
function findWeightIncreases(thisWeekLogs, lastWeekLogs) {
  const increases = [];

  // Build map of last week's max weights per exercise
  const lastWeekMaxes = {};
  for (const log of lastWeekLogs) {
    for (const ex of log.exercises || []) {
      const maxWeight = (ex.sets || []).reduce((max, s) => Math.max(max, s.weight || 0), 0);
      if (!lastWeekMaxes[ex.exercise_id] || maxWeight > lastWeekMaxes[ex.exercise_id].weight) {
        lastWeekMaxes[ex.exercise_id] = { weight: maxWeight, name: ex.exercise_name };
      }
    }
  }

  // Compare this week
  for (const log of thisWeekLogs) {
    for (const ex of log.exercises || []) {
      const maxWeight = (ex.sets || []).reduce((max, s) => Math.max(max, s.weight || 0), 0);
      const lastWeek = lastWeekMaxes[ex.exercise_id];

      if (lastWeek && maxWeight > lastWeek.weight) {
        increases.push({
          exerciseId: ex.exercise_id,
          exerciseName: ex.exercise_name,
          lastWeight: lastWeek.weight,
          newWeight: maxWeight,
          increase: Math.round((maxWeight - lastWeek.weight) * 10) / 10,
        });
      }
    }
  }

  return increases;
}
