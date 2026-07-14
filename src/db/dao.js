// Data Access Object — all CRUD operations for TrueFit
import { getDatabase } from './database';
import { generateId } from '../utils/calculations';

// Allowed columns for dynamic updates (Bug #15: SQL injection prevention)
const ALLOWED_LOG_SET_COLUMNS = ['weight', 'reps', 'rpe', 'set_number'];
const ALLOWED_PROGRAM_EXERCISE_COLUMNS = ['target_sets', 'target_reps_min', 'target_reps_max', 'target_weight', 'notes', 'sort_order'];
const ALLOWED_WORKOUT_LOG_COLUMNS = ['bodyweight', 'overall_notes', 'date'];

// ===========================
// EXERCISES
// ===========================

export async function getAllExercises() {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM exercises ORDER BY muscle_group, name');
  return rows.map(r => ({ ...r, secondary_muscles: JSON.parse(r.secondary_muscles || '[]') }));
}

export async function getExercisesByMuscle(muscleGroup) {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM exercises WHERE muscle_group = ? ORDER BY name',
    [muscleGroup]
  );
  return rows.map(r => ({ ...r, secondary_muscles: JSON.parse(r.secondary_muscles || '[]') }));
}

export async function getExerciseById(id) {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM exercises WHERE id = ?', [id]);
  if (row) row.secondary_muscles = JSON.parse(row.secondary_muscles || '[]');
  return row;
}

export async function addCustomExercise(exercise) {
  const db = await getDatabase();
  const id = exercise.id || generateId();
  await db.runAsync(
    'INSERT INTO exercises (id, name, muscle_group, secondary_muscles, category, equipment, default_increment) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, exercise.name, exercise.muscle_group, JSON.stringify(exercise.secondary_muscles || []), exercise.category || 'compound', exercise.equipment || 'barbell', exercise.default_increment || 2.5]
  );
  return id;
}

// ===========================
// PROGRAMS
// ===========================

export async function getAllPrograms() {
  const db = await getDatabase();
  return db.getAllAsync('SELECT * FROM programs ORDER BY created_at DESC');
}

export async function getActiveProgram() {
  const db = await getDatabase();
  return db.getFirstAsync('SELECT * FROM programs WHERE is_active = 1');
}

export async function getProgramById(id) {
  const db = await getDatabase();
  return db.getFirstAsync('SELECT * FROM programs WHERE id = ?', [id]);
}

export async function createProgram(name) {
  const db = await getDatabase();
  const id = generateId();
  await db.runAsync(
    'INSERT INTO programs (id, name, is_active, created_at) VALUES (?, ?, 0, ?)',
    [id, name, new Date().toISOString()]
  );
  return id;
}

export async function updateProgramName(id, name) {
  const db = await getDatabase();
  await db.runAsync('UPDATE programs SET name = ? WHERE id = ?', [name, id]);
}

export async function setActiveProgram(id) {
  const db = await getDatabase();
  await db.runAsync('UPDATE programs SET is_active = 0');
  await db.runAsync('UPDATE programs SET is_active = 1 WHERE id = ?', [id]);
}

export async function deleteProgram(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM programs WHERE id = ?', [id]);
}

// ===========================
// PROGRAM DAYS
// ===========================

export async function getProgramDays(programId) {
  const db = await getDatabase();
  return db.getAllAsync(
    'SELECT * FROM program_days WHERE program_id = ? ORDER BY day_index',
    [programId]
  );
}

export async function addProgramDay(programId, name, dayIndex) {
  const db = await getDatabase();
  const id = generateId();
  await db.runAsync(
    'INSERT INTO program_days (id, program_id, day_index, name) VALUES (?, ?, ?, ?)',
    [id, programId, dayIndex, name]
  );
  return id;
}

export async function updateProgramDay(id, name) {
  const db = await getDatabase();
  await db.runAsync('UPDATE program_days SET name = ? WHERE id = ?', [name, id]);
}

export async function deleteProgramDay(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM program_days WHERE id = ?', [id]);
}

// ===========================
// PROGRAM EXERCISES
// ===========================

export async function getProgramExercises(dayId) {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT pe.*, e.name as exercise_name, e.muscle_group, e.secondary_muscles, e.category, e.equipment, e.default_increment
     FROM program_exercises pe
     JOIN exercises e ON pe.exercise_id = e.id
     WHERE pe.day_id = ?
     ORDER BY pe.sort_order`,
    [dayId]
  );
}

export async function addProgramExercise(dayId, exerciseId, data = {}) {
  const db = await getDatabase();
  const id = generateId();
  const maxOrder = await db.getFirstAsync(
    'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM program_exercises WHERE day_id = ?',
    [dayId]
  );
  await db.runAsync(
    'INSERT INTO program_exercises (id, day_id, exercise_id, target_sets, target_reps_min, target_reps_max, target_weight, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, dayId, exerciseId, data.target_sets || 3, data.target_reps_min || 6, data.target_reps_max || 12, data.target_weight || 0, data.notes || '', (maxOrder?.max_order ?? -1) + 1]
  );
  return id;
}

export async function updateProgramExercise(id, data) {
  const db = await getDatabase();
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    if (!ALLOWED_PROGRAM_EXERCISE_COLUMNS.includes(key)) continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE program_exercises SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteProgramExercise(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM program_exercises WHERE id = ?', [id]);
}

export async function reorderProgramExercises(dayId, orderedIds) {
  const db = await getDatabase();
  for (let i = 0; i < orderedIds.length; i++) {
    await db.runAsync(
      'UPDATE program_exercises SET sort_order = ? WHERE id = ? AND day_id = ?',
      [i, orderedIds[i], dayId]
    );
  }
}

// ===========================
// WORKOUT LOGS
// ===========================

export async function getWorkoutLogs(limit = 50) {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT wl.*, pd.name as day_name, p.name as program_name
     FROM workout_logs wl
     LEFT JOIN program_days pd ON wl.day_id = pd.id
     LEFT JOIN programs p ON wl.program_id = p.id
     ORDER BY wl.date DESC
     LIMIT ?`,
    [limit]
  );
}

export async function getWorkoutLogsByDateRange(startDate, endDate) {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT wl.*, pd.name as day_name, p.name as program_name
     FROM workout_logs wl
     LEFT JOIN program_days pd ON wl.day_id = pd.id
     LEFT JOIN programs p ON wl.program_id = p.id
     WHERE wl.date >= ? AND wl.date <= ?
     ORDER BY wl.date DESC`,
    [startDate, endDate]
  );
}

export async function getWorkoutLogById(id) {
  const db = await getDatabase();
  return db.getFirstAsync(
    `SELECT wl.*, pd.name as day_name, p.name as program_name
     FROM workout_logs wl
     LEFT JOIN program_days pd ON wl.day_id = pd.id
     LEFT JOIN programs p ON wl.program_id = p.id
     WHERE wl.id = ?`,
    [id]
  );
}

export async function getLastWorkoutForDay(dayId) {
  const db = await getDatabase();
  return db.getFirstAsync(
    'SELECT * FROM workout_logs WHERE day_id = ? ORDER BY date DESC LIMIT 1',
    [dayId]
  );
}

export async function createWorkoutLog(data) {
  const db = await getDatabase();
  const id = generateId();
  await db.runAsync(
    'INSERT INTO workout_logs (id, program_id, day_id, date, bodyweight, overall_notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, data.program_id, data.day_id, data.date, data.bodyweight || null, data.overall_notes || '', new Date().toISOString()]
  );
  return id;
}

export async function updateWorkoutLog(id, data) {
  const db = await getDatabase();
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    if (!ALLOWED_WORKOUT_LOG_COLUMNS.includes(key)) continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE workout_logs SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteWorkoutLog(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM workout_logs WHERE id = ?', [id]);
}

// ===========================
// LOG EXERCISES
// ===========================

export async function getLogExercises(logId) {
  const db = await getDatabase();
  const exercises = await db.getAllAsync(
    `SELECT le.*, e.name as exercise_name, e.muscle_group, e.secondary_muscles, e.category, e.equipment, e.default_increment
     FROM log_exercises le
     JOIN exercises e ON le.exercise_id = e.id
     WHERE le.log_id = ?
     ORDER BY le.sort_order`,
    [logId]
  );

  // Attach sets to each exercise
  for (const ex of exercises) {
    ex.secondary_muscles = JSON.parse(ex.secondary_muscles || '[]');
    ex.sets = await db.getAllAsync(
      'SELECT * FROM log_sets WHERE log_exercise_id = ? ORDER BY set_number',
      [ex.id]
    );
  }

  return exercises;
}

export async function addLogExercise(logId, data) {
  const db = await getDatabase();
  const id = generateId();
  await db.runAsync(
    'INSERT INTO log_exercises (id, log_id, exercise_id, target_sets, target_reps_min, target_reps_max, target_weight, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, logId, data.exercise_id, data.target_sets, data.target_reps_min, data.target_reps_max, data.target_weight, data.notes || '', data.sort_order || 0]
  );
  return id;
}

export async function updateLogExerciseNotes(id, notes) {
  const db = await getDatabase();
  await db.runAsync('UPDATE log_exercises SET notes = ? WHERE id = ?', [notes, id]);
}

// ===========================
// LOG SETS
// ===========================

export async function addLogSet(logExerciseId, setNumber, weight, reps, rpe = null) {
  const db = await getDatabase();
  const id = generateId();
  // Bug #16: Bounds validation
  const safeWeight = Math.max(0, Math.min(weight || 0, 1000));
  const safeReps = Math.max(0, Math.min(Math.round(reps || 0), 200));
  await db.runAsync(
    'INSERT INTO log_sets (id, log_exercise_id, set_number, weight, reps, rpe) VALUES (?, ?, ?, ?, ?, ?)',
    [id, logExerciseId, setNumber, safeWeight, safeReps, rpe]
  );
  return id;
}

export async function updateLogSet(id, data) {
  const db = await getDatabase();
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    if (!ALLOWED_LOG_SET_COLUMNS.includes(key)) continue;
    // Bug #16: Bounds validation
    let safeValue = value;
    if (key === 'weight') safeValue = Math.max(0, Math.min(value || 0, 1000));
    if (key === 'reps') safeValue = Math.max(0, Math.min(Math.round(value || 0), 200));
    fields.push(`${key} = ?`);
    values.push(safeValue);
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE log_sets SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteLogSet(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM log_sets WHERE id = ?', [id]);
}

// ===========================
// PERSONAL RECORDS
// ===========================

export async function getPersonalRecords(exerciseId = null) {
  const db = await getDatabase();
  if (exerciseId) {
    return db.getAllAsync(
      'SELECT pr.*, e.name as exercise_name FROM personal_records pr JOIN exercises e ON pr.exercise_id = e.id WHERE pr.exercise_id = ? ORDER BY pr.date DESC',
      [exerciseId]
    );
  }
  return db.getAllAsync(
    'SELECT pr.*, e.name as exercise_name FROM personal_records pr JOIN exercises e ON pr.exercise_id = e.id ORDER BY pr.date DESC'
  );
}

export async function getLatestPR(exerciseId, type = 'estimated_1rm') {
  const db = await getDatabase();
  return db.getFirstAsync(
    'SELECT * FROM personal_records WHERE exercise_id = ? AND type = ? ORDER BY value DESC LIMIT 1',
    [exerciseId, type]
  );
}

export async function getRecentPRs(limit = 5) {
  const db = await getDatabase();
  return db.getAllAsync(
    'SELECT pr.*, e.name as exercise_name FROM personal_records pr JOIN exercises e ON pr.exercise_id = e.id ORDER BY pr.date DESC LIMIT ?',
    [limit]
  );
}

export async function addPersonalRecord(data) {
  const db = await getDatabase();
  const id = generateId();
  await db.runAsync(
    'INSERT INTO personal_records (id, exercise_id, type, value, reps, estimated_1rm, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, data.exercise_id, data.type, data.value, data.reps || null, data.estimated_1rm || null, data.date]
  );
  return id;
}

// ===========================
// EXERCISE HISTORY (for ghost data)
// ===========================

export async function getExerciseHistory(exerciseId, limit = 8) {
  const db = await getDatabase();
  const logs = await db.getAllAsync(
    `SELECT le.*, wl.date, wl.id as log_id
     FROM log_exercises le
     JOIN workout_logs wl ON le.log_id = wl.id
     WHERE le.exercise_id = ?
     ORDER BY wl.date DESC
     LIMIT ?`,
    [exerciseId, limit]
  );

  for (const log of logs) {
    log.sets = await db.getAllAsync(
      'SELECT * FROM log_sets WHERE log_exercise_id = ? ORDER BY set_number',
      [log.id]
    );
  }

  return logs;
}

export async function getLastPerformance(exerciseId, excludeLogId = null, dayId = null, beforeDate = null) {
  const db = await getDatabase();
  let query = `
    SELECT le.*, wl.date
    FROM log_exercises le
    JOIN workout_logs wl ON le.log_id = wl.id
    WHERE le.exercise_id = ?
  `;
  const params = [exerciseId];

  if (excludeLogId) {
    query += ` AND wl.id != ?`;
    params.push(excludeLogId);
  }

  if (dayId) {
    query += ` AND wl.day_id = ?`;
    params.push(dayId);
  }

  if (beforeDate) {
    query += ` AND wl.date <= ?`;
    params.push(beforeDate);
  }

  query += ` ORDER BY wl.date DESC LIMIT 1`;

  let lastLog = await db.getFirstAsync(query, params);

  // Fallback to universal history if no day-specific history is found
  if (!lastLog && dayId) {
    let fallbackQuery = `
      SELECT le.*, wl.date
      FROM log_exercises le
      JOIN workout_logs wl ON le.log_id = wl.id
      WHERE le.exercise_id = ?
    `;
    const fallbackParams = [exerciseId];
    if (excludeLogId) {
      fallbackQuery += ` AND wl.id != ?`;
      fallbackParams.push(excludeLogId);
    }
    if (beforeDate) {
      fallbackQuery += ` AND wl.date <= ?`;
      fallbackParams.push(beforeDate);
    }
    fallbackQuery += ` ORDER BY wl.date DESC LIMIT 1`;
    lastLog = await db.getFirstAsync(fallbackQuery, fallbackParams);
  }

  if (!lastLog) return null;

  lastLog.sets = await db.getAllAsync(
    'SELECT * FROM log_sets WHERE log_exercise_id = ? ORDER BY set_number',
    [lastLog.id]
  );

  return lastLog;
}

// ===========================
// SETTINGS
// ===========================

export async function getSetting(key) {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function getAllSettings() {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM settings');
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function setSetting(key, value) {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, String(value)]
  );
}

// ===========================
// STATS / AGGREGATES
// ===========================

export async function getWeeklyWorkoutCount(startDate, endDate) {
  const db = await getDatabase();
  const result = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM workout_logs WHERE date >= ? AND date <= ?',
    [startDate, endDate]
  );
  return result?.count || 0;
}

export async function getTotalWorkoutCount() {
  const db = await getDatabase();
  const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM workout_logs');
  return result?.count || 0;
}

export async function getWorkoutDates(startDate, endDate) {
  const db = await getDatabase();
  return db.getAllAsync(
    'SELECT DISTINCT date FROM workout_logs WHERE date >= ? AND date <= ? ORDER BY date',
    [startDate, endDate]
  );
}

/**
 * Get all log exercises with their sets for a date range (for volume analysis, fatigue, etc.)
 */
export async function getFullLogDataByDateRange(startDate, endDate) {
  const db = await getDatabase();
  const logs = await db.getAllAsync(
    'SELECT * FROM workout_logs WHERE date >= ? AND date <= ? ORDER BY date',
    [startDate, endDate]
  );

  for (const log of logs) {
    log.exercises = await db.getAllAsync(
      `SELECT le.*, e.name as exercise_name, e.muscle_group, e.secondary_muscles, e.category, e.equipment
       FROM log_exercises le
       JOIN exercises e ON le.exercise_id = e.id
       WHERE le.log_id = ?
       ORDER BY le.sort_order`,
      [log.id]
    );
    for (const ex of log.exercises) {
      ex.secondary_muscles = JSON.parse(ex.secondary_muscles || '[]');
      ex.sets = await db.getAllAsync(
        'SELECT * FROM log_sets WHERE log_exercise_id = ? ORDER BY set_number',
        [ex.id]
      );
    }
  }

  return logs;
}

/**
 * Export all data as a JSON object
 */
export async function exportAllData() {
  const db = await getDatabase();
  const exercises = await db.getAllAsync('SELECT * FROM exercises');
  const programs = await db.getAllAsync('SELECT * FROM programs');
  const programDays = await db.getAllAsync('SELECT * FROM program_days');
  const programExercises = await db.getAllAsync('SELECT * FROM program_exercises');
  const workoutLogs = await db.getAllAsync('SELECT * FROM workout_logs');
  const logExercises = await db.getAllAsync('SELECT * FROM log_exercises');
  const logSets = await db.getAllAsync('SELECT * FROM log_sets');
  const personalRecords = await db.getAllAsync('SELECT * FROM personal_records');
  const settings = await db.getAllAsync('SELECT * FROM settings');

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    programs,
    programDays,
    programExercises,
    workoutLogs,
    logExercises,
    logSets,
    personalRecords,
    settings,
  };
}
