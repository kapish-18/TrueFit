// Fatigue Engine
// Estimates recovery needs from training load and overload history

import { exerciseVolume } from '../utils/calculations';
import { FATIGUE_LEVELS } from '../utils/constants';

/**
 * Calculate fatigue score (0-100)
 * @param {Array} weeklyLogs - Array of week data, each with workout logs (last 4-6 weeks)
 * @returns {Object} Fatigue analysis
 */
export function calculateFatigueScore(weeklyLogs) {
  if (!weeklyLogs || weeklyLogs.length === 0) {
    return {
      score: 0,
      level: 'Low',
      color: FATIGUE_LEVELS.LOW.color,
      factors: {},
      recommendation: 'Start training to build your fatigue profile.',
    };
  }

  const factors = {
    volumeTrend: calculateVolumeTrendScore(weeklyLogs),
    overloadWeeks: calculateOverloadWeeksScore(weeklyLogs),
    compoundFrequency: calculateCompoundFrequencyScore(weeklyLogs),
    trainingFrequency: calculateTrainingFrequencyScore(weeklyLogs),
  };

  // Weighted score
  const score = Math.min(100, Math.round(
    factors.volumeTrend * 0.35 +
    factors.overloadWeeks * 0.25 +
    factors.compoundFrequency * 0.20 +
    factors.trainingFrequency * 0.20
  ));

  const level = score <= FATIGUE_LEVELS.LOW.max ? 'Low'
    : score <= FATIGUE_LEVELS.MEDIUM.max ? 'Medium'
    : 'High';

  const color = score <= FATIGUE_LEVELS.LOW.max ? FATIGUE_LEVELS.LOW.color
    : score <= FATIGUE_LEVELS.MEDIUM.max ? FATIGUE_LEVELS.MEDIUM.color
    : FATIGUE_LEVELS.HIGH.color;

  return {
    score,
    level,
    color,
    factors,
    recommendation: getRecommendation(score, level, factors),
  };
}

/**
 * Volume trend score (0-100)
 * Higher if volume has been consistently increasing
 */
function calculateVolumeTrendScore(weeklyLogs) {
  if (weeklyLogs.length < 2) return 20;

  const weeklyVolumes = weeklyLogs.map(week => {
    let totalVolume = 0;
    for (const log of week.logs) {
      for (const ex of log.exercises || []) {
        totalVolume += exerciseVolume(ex.sets || []);
      }
    }
    return totalVolume;
  });

  // Find the first week with actual volume to ignore preceding empty weeks (new user scenario)
  const firstActiveIndex = weeklyVolumes.findIndex(v => v > 0);
  if (firstActiveIndex === -1 || firstActiveIndex === weeklyVolumes.length - 1) {
    // No volume history yet
    return 20;
  }

  const activeVolumes = weeklyVolumes.slice(firstActiveIndex);

  let increasingWeeks = 0;
  for (let i = 1; i < activeVolumes.length; i++) {
    if (activeVolumes[i] > activeVolumes[i - 1] * 0.98) {
      increasingWeeks++;
    }
  }

  const avgVolume = activeVolumes.reduce((a, b) => a + b, 0) / activeVolumes.length;
  const currentVolume = activeVolumes[activeVolumes.length - 1] || 0;
  const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;

  return Math.min(100, Math.round(
    (increasingWeeks / Math.max(activeVolumes.length - 1, 1)) * 50 +
    Math.max(0, (volumeRatio - 1)) * 100
  ));
}

/**
 * Consecutive overload weeks score (0-100)
 */
function calculateOverloadWeeksScore(weeklyLogs) {
  if (weeklyLogs.length < 2) return 10;

  let consecutiveOverload = 0;

  for (let i = weeklyLogs.length - 1; i >= 1; i--) {
    const currentVol = getWeekTotalVolume(weeklyLogs[i]);
    const prevVol = getWeekTotalVolume(weeklyLogs[i - 1]);

    if (prevVol === 0) break;

    if (currentVol > prevVol * 0.95) {
      consecutiveOverload++;
    } else {
      break;
    }
  }

  // Scale: 1 week = 10, 3 weeks = 40, 5 weeks = 70, 7+ weeks = 100
  return Math.min(100, consecutiveOverload * 15);
}

/**
 * Heavy compound frequency score (0-100)
 */
function calculateCompoundFrequencyScore(weeklyLogs) {
  const recentWeek = weeklyLogs[weeklyLogs.length - 1];
  if (!recentWeek || !recentWeek.logs) return 0;

  let compoundSets = 0;
  let totalSets = 0;

  for (const log of recentWeek.logs) {
    for (const ex of log.exercises || []) {
      const sets = ex.sets?.length || 0;
      totalSets += sets;
      if (ex.category === 'compound') {
        compoundSets += sets;
      }
    }
  }

  if (totalSets === 0) return 0;
  const ratio = compoundSets / totalSets;

  // High compound ratio = more fatigue
  return Math.min(100, Math.round(ratio * 80 + (compoundSets > 30 ? 20 : 0)));
}

/**
 * Training frequency score (0-100)
 */
function calculateTrainingFrequencyScore(weeklyLogs) {
  const recentWeek = weeklyLogs[weeklyLogs.length - 1];
  if (!recentWeek) return 0;

  const daysTrainedThisWeek = recentWeek.logs?.length || 0;

  // Scale: 1-2 days = low, 3-4 = moderate, 5+ = high
  if (daysTrainedThisWeek <= 2) return 15;
  if (daysTrainedThisWeek <= 3) return 30;
  if (daysTrainedThisWeek <= 4) return 50;
  if (daysTrainedThisWeek <= 5) return 70;
  return 90;
}

function getWeekTotalVolume(weekData) {
  let total = 0;
  for (const log of weekData.logs || []) {
    for (const ex of log.exercises || []) {
      total += exerciseVolume(ex.sets || []);
    }
  }
  return total;
}

function getRecommendation(score, level, factors) {
  if (score <= 30) {
    return 'Fatigue is low. You have room to push harder.';
  }
  if (score <= 50) {
    return 'Moderate fatigue. Continue training but monitor recovery.';
  }
  if (score <= 70) {
    return 'Fatigue is building. Consider reducing volume or intensity soon.';
  }
  if (score <= 85) {
    return 'High fatigue. A deload week is recommended within the next 1-2 weeks.';
  }
  return 'Very high fatigue. Take a deload week to recover and prevent injury.';
}

/**
 * Organize workout logs into weekly buckets
 * @param {Array} logs - All workout logs with exercises and sets
 * @param {number} weeks - Number of weeks to look back
 * @returns {Array} Array of { weekStart, logs }
 */
export function organizeByWeek(logs, weeks = 6) {
  const weekBuckets = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day + (day === 0 ? -6 : 1) - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];

    const weekLogs = logs.filter(l => l.date >= startStr && l.date <= endStr);

    weekBuckets.push({
      weekStart: startStr,
      weekEnd: endStr,
      logs: weekLogs,
    });
  }

  return weekBuckets;
}
