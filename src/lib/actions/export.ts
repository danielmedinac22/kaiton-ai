"use server";

import { db } from "@/lib/db";
import { athlete, workoutLog, trainingPlan, trainingPlanWorkout, hrZones, chatHistory } from "@/lib/db/schema";

export async function exportAllData() {
  const athletes = await db.select().from(athlete);
  const workouts = await db.select().from(workoutLog);
  const plans = await db.select().from(trainingPlan);
  const planWorkouts = await db.select().from(trainingPlanWorkout);
  const zones = await db.select().from(hrZones);
  const chats = await db.select().from(chatHistory);

  return {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    data: {
      athlete: athletes[0] ?? null,
      workouts,
      trainingPlans: plans,
      trainingPlanWorkouts: planWorkouts,
      hrZones: zones,
      chatHistory: chats,
    },
  };
}
