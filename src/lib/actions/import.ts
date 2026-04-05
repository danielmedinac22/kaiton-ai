"use server";

import { db } from "@/lib/db";
import {
  athlete,
  workoutLog,
  trainingPlan,
  trainingPlanWorkout,
  hrZones,
  chatHistory,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ExportedData = {
  version: string;
  data: {
    athlete: Record<string, unknown> | null;
    workouts: Record<string, unknown>[];
    trainingPlans: Record<string, unknown>[];
    trainingPlanWorkouts: Record<string, unknown>[];
    hrZones: Record<string, unknown>[];
    chatHistory: Record<string, unknown>[];
  };
};

export async function importAllData(exported: ExportedData) {
  const d = exported.data;

  // Clear existing data (order matters for FK constraints)
  const [existing] = await db.select().from(athlete).limit(1);
  if (existing) {
    await db.delete(chatHistory);
    await db.delete(hrZones);
    await db.delete(trainingPlanWorkout);
    await db.delete(trainingPlan);
    await db.delete(workoutLog);
    await db.delete(athlete);
  }

  // Import athlete
  if (d.athlete) {
    const { id, ...rest } = d.athlete;
    await db.insert(athlete).values(rest as typeof athlete.$inferInsert);
  }

  // Import workouts
  for (const w of d.workouts ?? []) {
    const { id, ...rest } = w;
    await db.insert(workoutLog).values(rest as typeof workoutLog.$inferInsert);
  }

  // Import training plans
  for (const p of d.trainingPlans ?? []) {
    const { id, ...rest } = p;
    await db
      .insert(trainingPlan)
      .values(rest as typeof trainingPlan.$inferInsert);
  }

  // Import plan workouts
  for (const pw of d.trainingPlanWorkouts ?? []) {
    const { id, ...rest } = pw;
    await db
      .insert(trainingPlanWorkout)
      .values(rest as typeof trainingPlanWorkout.$inferInsert);
  }

  // Import HR zones
  for (const z of d.hrZones ?? []) {
    const { id, ...rest } = z;
    await db.insert(hrZones).values(rest as typeof hrZones.$inferInsert);
  }

  // Import chat history
  for (const c of d.chatHistory ?? []) {
    const { id, ...rest } = c;
    await db
      .insert(chatHistory)
      .values(rest as typeof chatHistory.$inferInsert);
  }

  revalidatePath("/");
  revalidatePath("/workouts");
  revalidatePath("/plan");
  revalidatePath("/settings");

  return { ok: true };
}
