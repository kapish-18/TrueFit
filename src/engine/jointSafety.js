// Joint Safety Guardrail
// Warns about unsafe weight jumps

/**
 * Validate a weight change for safety
 * @param {number} lastWeight - Weight from last session
 * @param {number} newWeight - Proposed new weight
 * @param {string} category - 'compound' or 'isolation'
 * @param {string} exerciseName - Exercise name for context
 * @returns {Object} Safety assessment
 */
export function validateWeightJump(lastWeight, newWeight, category = 'compound', exerciseName = '') {
  if (!lastWeight || lastWeight <= 0 || !newWeight || newWeight <= 0) {
    return { safe: true, level: 'ok', message: null };
  }

  const change = newWeight - lastWeight;
  const percentChange = (change / lastWeight) * 100;

  // Thresholds differ for compound vs isolation
  const warningThreshold = category === 'compound' ? 10 : 5;
  const dangerThreshold = category === 'compound' ? 20 : 10;

  if (percentChange <= 0) {
    // Weight decrease — always safe
    return { safe: true, level: 'ok', message: null, percentChange };
  }

  if (percentChange > dangerThreshold) {
    const safeMax = Math.round(lastWeight * (1 + warningThreshold / 200) * 10) / 10;
    return {
      safe: false,
      level: 'danger',
      message: `⚠️ ${Math.round(percentChange)}% increase is very risky. Recommended max: ${safeMax}kg (+${Math.round(warningThreshold / 2)}%).`,
      percentChange: Math.round(percentChange * 10) / 10,
      recommendedMax: safeMax,
      lastWeight,
      newWeight,
    };
  }

  if (percentChange > warningThreshold) {
    const safeIncrease = category === 'compound' ? '2.5–5%' : '2.5%';
    const safeWeight = Math.round(lastWeight * 1.05 * 10) / 10;
    return {
      safe: false,
      level: 'warning',
      message: `⚠️ ${Math.round(percentChange)}% increase may raise injury risk. Recommended: ${safeIncrease} (${safeWeight}kg).`,
      percentChange: Math.round(percentChange * 10) / 10,
      recommendedMax: safeWeight,
      lastWeight,
      newWeight,
    };
  }

  return {
    safe: true,
    level: 'ok',
    message: null,
    percentChange: Math.round(percentChange * 10) / 10,
  };
}

/**
 * Get the safe weight range for an exercise based on last performance
 * @param {number} lastWeight - Last used weight
 * @param {string} category - compound or isolation
 * @param {number} defaultIncrement - Exercise's default increment
 * @returns {Object} { min, recommended, max }
 */
export function getSafeWeightRange(lastWeight, category = 'compound', defaultIncrement = 2.5) {
  if (!lastWeight || lastWeight <= 0) {
    return { min: 0, recommended: 0, max: 0 };
  }

  const maxPercent = category === 'compound' ? 0.10 : 0.05;

  return {
    min: Math.max(0, Math.round((lastWeight * 0.85) * 10) / 10),
    recommended: Math.round((lastWeight + defaultIncrement) * 10) / 10,
    max: Math.round((lastWeight * (1 + maxPercent)) * 10) / 10,
  };
}
