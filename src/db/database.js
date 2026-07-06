// SQLite database initialization and migrations
import * as SQLite from 'expo-sqlite';

let dbPromise = null;

/**
 * Get or create the database instance (promise-based singleton to prevent race conditions)
 */
export async function getDatabase() {
  if (!dbPromise) {
    dbPromise = initDatabase();
  }
  return dbPromise;
}

async function initDatabase() {
  const db = await SQLite.openDatabaseAsync('truefit.db');

  // Enable WAL mode for better performance
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await runMigrations(db);
  return db;
}

/**
 * Run all database migrations
 */
async function runMigrations(database) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      secondary_muscles TEXT DEFAULT '[]',
      category TEXT NOT NULL DEFAULT 'compound',
      equipment TEXT DEFAULT 'barbell',
      default_increment REAL DEFAULT 2.5
    );

    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS program_days (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL,
      day_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS program_exercises (
      id TEXT PRIMARY KEY,
      day_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      target_sets INTEGER DEFAULT 3,
      target_reps_min INTEGER DEFAULT 6,
      target_reps_max INTEGER DEFAULT 12,
      target_weight REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (day_id) REFERENCES program_days(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      program_id TEXT,
      day_id TEXT,
      date TEXT NOT NULL,
      bodyweight REAL,
      overall_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS log_exercises (
      id TEXT PRIMARY KEY,
      log_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      target_sets INTEGER,
      target_reps_min INTEGER,
      target_reps_max INTEGER,
      target_weight REAL,
      notes TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (log_id) REFERENCES workout_logs(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    CREATE TABLE IF NOT EXISTS log_sets (
      id TEXT PRIMARY KEY,
      log_exercise_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      weight REAL DEFAULT 0,
      reps INTEGER DEFAULT 0,
      rpe REAL,
      FOREIGN KEY (log_exercise_id) REFERENCES log_exercises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      reps INTEGER,
      estimated_1rm REAL,
      date TEXT NOT NULL,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(date);
    CREATE INDEX IF NOT EXISTS idx_workout_logs_program ON workout_logs(program_id);
    CREATE INDEX IF NOT EXISTS idx_log_exercises_log ON log_exercises(log_id);
    CREATE INDEX IF NOT EXISTS idx_log_exercises_exercise ON log_exercises(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_log_sets_exercise ON log_sets(log_exercise_id);
    CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_program_days_program ON program_days(program_id);
    CREATE INDEX IF NOT EXISTS idx_program_exercises_day ON program_exercises(day_id);
  `);
}

/**
 * Close the database connection
 */
export async function closeDatabase() {
  if (dbPromise) {
    const db = await dbPromise;
    await db.closeAsync();
    dbPromise = null;
  }
}
