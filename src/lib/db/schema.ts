import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const athlete = sqliteTable("athlete", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  age: integer("age"),
  experienceLevel: text("experience_level", {
    enum: ["beginner", "intermediate", "advanced", "elite"],
  })
    .notNull()
    .default("intermediate"),
  restingHr: integer("resting_hr"),
  maxHr: integer("max_hr"),
  weeklyKmCurrent: real("weekly_km_current"),
  goalRaceDistance: text("goal_race_distance", {
    enum: ["5k", "10k", "half_marathon", "marathon", "ultra", "custom"],
  }),
  goalRaceDistanceKm: real("goal_race_distance_km"),
  goalRaceName: text("goal_race_name"),
  goalRaceDate: text("goal_race_date"),
  goalRaceTime: text("goal_race_time"),
  pr5k: text("pr_5k"),
  pr10k: text("pr_10k"),
  prHalf: text("pr_half"),
  prMarathon: text("pr_marathon"),
  aiProvider: text("ai_provider", {
    enum: ["openai", "anthropic"],
  })
    .notNull()
    .default("openai"),
  aiApiKey: text("ai_api_key").notNull(),
  aiModel: text("ai_model").notNull().default("gpt-5.4-mini"),
  language: text("language", { enum: ["es", "en"] })
    .notNull()
    .default("es"),
  // Strava integration
  stravaClientId: text("strava_client_id"),
  stravaClientSecret: text("strava_client_secret"),
  stravaAccessToken: text("strava_access_token"),
  stravaRefreshToken: text("strava_refresh_token"),
  stravaTokenExpiresAt: integer("strava_token_expires_at"),
  stravaAthleteId: integer("strava_athlete_id"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const workoutLog = sqliteTable("workout_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  type: text("type", {
    enum: [
      "easy",
      "tempo",
      "intervals",
      "long_run",
      "recovery",
      "race",
      "cross_training",
      "rest",
    ],
  }).notNull(),
  distanceKm: real("distance_km"),
  durationMinutes: real("duration_minutes"),
  avgHr: integer("avg_hr"),
  maxHr: integer("max_hr"),
  rpe: integer("rpe").notNull(),
  avgPace: text("avg_pace"),
  notes: text("notes"),
  feeling: text("feeling", {
    enum: ["great", "good", "ok", "tired", "exhausted"],
  }),
  plannedWorkoutId: integer("planned_workout_id"),
  stravaActivityId: text("strava_activity_id"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const trainingPlan = sqliteTable("training_plan", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  goalRaceDistance: text("goal_race_distance"),
  goalRaceDate: text("goal_race_date"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalWeeks: integer("total_weeks").notNull(),
  phaseStructure: text("phase_structure").notNull(), // JSON
  status: text("status", {
    enum: ["active", "completed", "abandoned"],
  })
    .notNull()
    .default("active"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const trainingPlanWorkout = sqliteTable("training_plan_workout", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: integer("plan_id")
    .notNull()
    .references(() => trainingPlan.id),
  weekNumber: integer("week_number").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 1=Monday, 7=Sunday
  date: text("date").notNull(),
  phase: text("phase", {
    enum: ["base", "build", "specific", "taper"],
  }).notNull(),
  type: text("type", {
    enum: [
      "easy",
      "tempo",
      "intervals",
      "long_run",
      "recovery",
      "race",
      "cross_training",
      "rest",
    ],
  }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetDistanceKm: real("target_distance_km"),
  targetDurationMinutes: real("target_duration_minutes"),
  targetHrZone: text("target_hr_zone"),
  targetPace: text("target_pace"),
  targetRpe: integer("target_rpe"),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  completedWorkoutId: integer("completed_workout_id"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const chatHistory = sqliteTable("chat_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const hrZones = sqliteTable("hr_zones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  athleteId: integer("athlete_id")
    .notNull()
    .references(() => athlete.id),
  zoneNumber: integer("zone_number").notNull(), // 1-5
  name: text("name").notNull(),
  minHr: integer("min_hr").notNull(),
  maxHr: integer("max_hr").notNull(),
  description: text("description"),
  calculatedAt: text("calculated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
