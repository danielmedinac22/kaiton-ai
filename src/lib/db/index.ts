import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "kaiton.db");

function createDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });

  // Auto-create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS athlete (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      experience_level TEXT NOT NULL DEFAULT 'intermediate',
      resting_hr INTEGER,
      max_hr INTEGER,
      weekly_km_current REAL,
      goal_race_distance TEXT,
      goal_race_distance_km REAL,
      goal_race_name TEXT,
      goal_race_date TEXT,
      goal_race_time TEXT,
      pr_5k TEXT,
      pr_10k TEXT,
      pr_half TEXT,
      pr_marathon TEXT,
      ai_provider TEXT NOT NULL DEFAULT 'openai',
      ai_api_key TEXT NOT NULL,
      ai_model TEXT NOT NULL DEFAULT 'gpt-5.4-mini',
      language TEXT NOT NULL DEFAULT 'es',
      strava_client_id TEXT,
      strava_client_secret TEXT,
      strava_access_token TEXT,
      strava_refresh_token TEXT,
      strava_token_expires_at INTEGER,
      strava_athlete_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      distance_km REAL,
      duration_minutes REAL,
      avg_hr INTEGER,
      max_hr INTEGER,
      rpe INTEGER NOT NULL,
      avg_pace TEXT,
      notes TEXT,
      feeling TEXT,
      planned_workout_id INTEGER,
      strava_activity_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS training_plan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      goal_race_distance TEXT,
      goal_race_date TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_weeks INTEGER NOT NULL,
      phase_structure TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS training_plan_workout (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES training_plan(id),
      week_number INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      date TEXT NOT NULL,
      phase TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_distance_km REAL,
      target_duration_minutes REAL,
      target_hr_zone TEXT,
      target_pace TEXT,
      target_rpe INTEGER,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_workout_id INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hr_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      athlete_id INTEGER NOT NULL REFERENCES athlete(id),
      zone_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      min_hr INTEGER NOT NULL,
      max_hr INTEGER NOT NULL,
      description TEXT,
      calculated_at TEXT NOT NULL
    );
  `);

  // Migrations for existing DBs — add Strava columns if missing
  const migrations = [
    "ALTER TABLE athlete ADD COLUMN strava_client_id TEXT",
    "ALTER TABLE athlete ADD COLUMN strava_client_secret TEXT",
    "ALTER TABLE athlete ADD COLUMN strava_access_token TEXT",
    "ALTER TABLE athlete ADD COLUMN strava_refresh_token TEXT",
    "ALTER TABLE athlete ADD COLUMN strava_token_expires_at INTEGER",
    "ALTER TABLE athlete ADD COLUMN strava_athlete_id INTEGER",
    "ALTER TABLE workout_log ADD COLUMN strava_activity_id TEXT",
  ];
  for (const sql of migrations) {
    try { sqlite.exec(sql); } catch { /* column already exists */ }
  }

  return db;
}

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDb> | undefined;
};

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
