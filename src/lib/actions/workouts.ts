"use server";

import { db } from "@/lib/db";
import { workoutLog, trainingPlanWorkout } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type LogWorkoutInput = {
  date: string;
  type: string;
  distanceKm?: number;
  durationMinutes?: number;
  avgHr?: number;
  maxHr?: number;
  rpe: number;
  avgPace?: string;
  notes?: string;
  feeling?: string;
  plannedWorkoutId?: number;
  stravaActivityId?: string;
};

export async function logWorkout(input: LogWorkoutInput) {
  const [workout] = await db
    .insert(workoutLog)
    .values({
      date: input.date,
      type: input.type as "easy" | "tempo" | "intervals" | "long_run" | "recovery" | "race" | "cross_training" | "rest",
      distanceKm: input.distanceKm ?? null,
      durationMinutes: input.durationMinutes ?? null,
      avgHr: input.avgHr ?? null,
      maxHr: input.maxHr ?? null,
      rpe: input.rpe,
      avgPace: input.avgPace ?? null,
      notes: input.notes ?? null,
      feeling: (input.feeling as "great" | "good" | "ok" | "tired" | "exhausted") ?? null,
      plannedWorkoutId: input.plannedWorkoutId ?? null,
      stravaActivityId: input.stravaActivityId ?? null,
      createdAt: new Date().toISOString(),
    })
    .returning();

  // Mark planned workout as completed if linked
  if (input.plannedWorkoutId) {
    await db
      .update(trainingPlanWorkout)
      .set({ completed: true, completedWorkoutId: workout.id })
      .where(eq(trainingPlanWorkout.id, input.plannedWorkoutId));
  }

  revalidatePath("/");
  revalidatePath("/workouts");
  revalidatePath("/plan");

  return workout;
}

export async function deleteWorkout(id: number) {
  const [workout] = await db.select().from(workoutLog).where(eq(workoutLog.id, id)).limit(1);

  if (workout?.plannedWorkoutId) {
    await db
      .update(trainingPlanWorkout)
      .set({ completed: false, completedWorkoutId: null })
      .where(eq(trainingPlanWorkout.id, workout.plannedWorkoutId));
  }

  await db.delete(workoutLog).where(eq(workoutLog.id, id));
  revalidatePath("/");
  revalidatePath("/workouts");
  revalidatePath("/plan");
  revalidatePath("/strava");
}
