// Deload Planner
// Recommends recovery weeks after sustained overload

import { DEFAULTS } from '../utils/constants';

/**
 * Check if a deload is recommended
 * @param {Array} weeklyLogs - Weekly log buckets (from organizeByWeek)
 * @param {number} deloadFrequency - Weeks between deloads (default 6)
 * @returns {Object} Deload recommendation
 */
export function checkDeloadNeeded(weeklyLogs, deloadFrequency = DEFAULTS.deloadFrequency, activeDaysCount = 0) {
  if (!weeklyLogs || weeklyLogs.length === 0) {
    return {
      needed: false,
      urgency: 'none',
      weeksUntilRecommended: deloadFrequency,
      message: 'Start training to build deload recommendations.',
    };
  }

  // Count consecutive weeks with training (non-empty weeks)
  let consecutiveTrainingWeeks = 0;
  for (let i = weeklyLogs.length - 1; i >= 0; i--) {
    const weekLogs = weeklyLogs[i].logs || [];
    
    if (activeDaysCount > 0 && weekLogs.length > 0) {
      const deloadCount = weekLogs.filter(l => (l.overall_notes || '').includes('[DELOAD]')).length;
      if (deloadCount >= activeDaysCount) {
        break;
      }
    }

    if (weekLogs.length > 0) {
      consecutiveTrainingWeeks++;
    } else {
      break;
    }
  }

  // Check for volume increases (overload weeks)
  let overloadWeeks = 0;
  for (let i = weeklyLogs.length - 1; i >= 1; i--) {
    const currentVol = getWeekVolume(weeklyLogs[i]);
    const prevVol = getWeekVolume(weeklyLogs[i - 1]);

    if (currentVol > prevVol * 0.95 && currentVol > 0) {
      overloadWeeks++;
    } else {
      break;
    }
  }

  const weeksUntilRecommended = Math.max(0, deloadFrequency - consecutiveTrainingWeeks);

  if (consecutiveTrainingWeeks >= deloadFrequency + 2) {
    return {
      needed: true,
      urgency: 'high',
      consecutiveWeeks: consecutiveTrainingWeeks,
      overloadWeeks,
      weeksUntilRecommended: 0,
      message: `You've trained ${consecutiveTrainingWeeks} consecutive weeks. A deload is strongly recommended.`,
      prescription: getDeloadPrescription(),
    };
  }

  if (consecutiveTrainingWeeks >= deloadFrequency) {
    return {
      needed: true,
      urgency: 'medium',
      consecutiveWeeks: consecutiveTrainingWeeks,
      overloadWeeks,
      weeksUntilRecommended: 0,
      message: `Week ${consecutiveTrainingWeeks} of training. Consider a deload this week.`,
      prescription: getDeloadPrescription(),
    };
  }

  if (consecutiveTrainingWeeks >= deloadFrequency - 1) {
    return {
      needed: false,
      urgency: 'upcoming',
      consecutiveWeeks: consecutiveTrainingWeeks,
      overloadWeeks,
      weeksUntilRecommended: 1,
      message: `Deload recommended next week (week ${deloadFrequency}).`,
    };
  }

  return {
    needed: false,
    urgency: 'none',
    consecutiveWeeks: consecutiveTrainingWeeks,
    overloadWeeks,
    weeksUntilRecommended,
    message: weeksUntilRecommended > 0
      ? `${weeksUntilRecommended} weeks until next recommended deload.`
      : 'Training cycle on track.',
  };
}

/**
 * Get deload prescription
 */
function getDeloadPrescription() {
  return {
    weightReduction: DEFAULTS.deloadWeightReduction,
    setReduction: DEFAULTS.deloadSetReduction,
    description: `Reduce weight by ${DEFAULTS.deloadWeightReduction * 100}% and drop ${DEFAULTS.deloadSetReduction} set per exercise.`,
    tips: [
      'Focus on form and mind-muscle connection',
      'Keep intensity low — RPE 5-6',
      'Maintain training frequency but reduce volume',
      'Prioritize sleep and nutrition this week',
    ],
  };
}

function getWeekVolume(weekData) {
  let total = 0;
  for (const log of weekData.logs || []) {
    for (const ex of log.exercises || []) {
      for (const s of ex.sets || []) {
        total += (s.weight || 0) * (s.reps || 0);
      }
    }
  }
  return total;
}

/**
 * Apply deload to a program day's exercises
 * @param {Array} exercises - Program exercises
 * @returns {Array} Deloaded exercise targets
 */
export function applyDeload(exercises) {
  return exercises.map(ex => ({
    ...ex,
    target_weight: Math.round((ex.target_weight || 0) * (1 - DEFAULTS.deloadWeightReduction) * 10) / 10,
    target_sets: Math.max(1, (ex.target_sets || 3) - DEFAULTS.deloadSetReduction),
    isDeload: true,
  }));
}
