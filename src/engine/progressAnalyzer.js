// Progress Analyzer
// Tracks improvements in strength, volume, and consistency

import { estimate1RM, exerciseVolume } from '../utils/calculations';

/**
 * Analyze progress for a specific exercise over time
 * @param {Array} history - Exercise history (from getExerciseHistory)
 * @returns {Object} Progress analysis
 */
export function analyzeExerciseProgress(history) {
  if (!history || history.length === 0) {
    return {
      hasData: false,
      trend: 'neutral',
      e1rmTrend: [],
      volumeTrend: [],
      bestSet: null,
    };
  }

  // Calculate e1RM for each session
  const e1rmTrend = history.map(h => {
    const bestE1RM = (h.sets || []).reduce((best, s) => {
      const e1rm = estimate1RM(s.weight || 0, s.reps || 0);
      return e1rm > best ? e1rm : best;
    }, 0);

    return {
      date: h.date,
      value: bestE1RM,
    };
  }).reverse(); // oldest first

  // Volume per session
  const volumeTrend = history.map(h => ({
    date: h.date,
    value: exerciseVolume(h.sets || []),
  })).reverse();

  // Best set ever
  const bestSet = history.reduce((best, h) => {
    for (const s of h.sets || []) {
      const e1rm = estimate1RM(s.weight || 0, s.reps || 0);
      if (e1rm > (best?.e1rm || 0)) {
        best = { weight: s.weight, reps: s.reps, e1rm, date: h.date };
      }
    }
    return best;
  }, null);

  // Determine trend
  let trend = 'neutral';
  if (e1rmTrend.length >= 2) {
    const recent = e1rmTrend[e1rmTrend.length - 1].value;
    const previous = e1rmTrend[e1rmTrend.length - 2].value;
    if (recent > previous * 1.01) trend = 'improving';
    else if (recent < previous * 0.99) trend = 'declining';
  }

  return {
    hasData: true,
    trend,
    e1rmTrend,
    volumeTrend,
    bestSet,
    sessionsCount: history.length,
  };
}

/**
 * Analyze overall training consistency
 * @param {Array} weeklyData - Weekly log buckets
 * @returns {Object} Consistency metrics
 */
export function analyzeConsistency(weeklyData) {
  if (!weeklyData || weeklyData.length === 0) {
    return { currentStreak: 0, consistency: 0, weeklyWorkouts: [] };
  }

  const weeklyWorkouts = weeklyData.map(w => ({
    weekStart: w.weekStart,
    count: w.logs?.length || 0,
  }));

  // Current streak (consecutive weeks with at least 1 workout)
  let currentStreak = 0;
  for (let i = weeklyData.length - 1; i >= 0; i--) {
    if ((weeklyData[i].logs?.length || 0) > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Overall consistency (% of weeks with training)
  const weeksWithTraining = weeklyData.filter(w => (w.logs?.length || 0) > 0).length;
  const consistency = Math.round((weeksWithTraining / weeklyData.length) * 100);

  // Average workouts per week
  const avgWorkouts = Math.round(
    (weeklyData.reduce((sum, w) => sum + (w.logs?.length || 0), 0) / weeklyData.length) * 10
  ) / 10;

  return {
    currentStreak,
    consistency,
    avgWorkouts,
    weeklyWorkouts,
    totalWorkouts: weeklyData.reduce((sum, w) => sum + (w.logs?.length || 0), 0),
  };
}

/**
 * Calculate overall volume trend across weeks
 * @param {Array} weeklyData - Weekly log buckets
 * @returns {Array} Weekly total volume data points
 */
export function getVolumeTrend(weeklyData) {
  return weeklyData.map(w => {
    let totalVolume = 0;
    let totalSets = 0;

    for (const log of w.logs || []) {
      for (const ex of log.exercises || []) {
        for (const s of ex.sets || []) {
          if (s.reps > 0) {
            totalVolume += (s.weight || 0) * (s.reps || 0);
            totalSets++;
          }
        }
      }
    }

    return {
      weekStart: w.weekStart,
      totalVolume: Math.round(totalVolume),
      totalSets,
      workouts: w.logs?.length || 0,
    };
  });
}
