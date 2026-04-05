"use server";

import { db } from "@/lib/db";
import { athlete, hrZones } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calculateKarvonenZones } from "@/lib/training/zones";

export async function getAthlete() {
  const [data] = await db.select().from(athlete).limit(1);
  return data ?? null;
}

export async function updateAthlete(
  updates: Record<string, unknown>
) {
  const [current] = await db.select().from(athlete).limit(1);
  if (!current) return null;

  // Filter out undefined values and cast for drizzle
  const cleanUpdates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) cleanUpdates[key] = value;
  }

  await db
    .update(athlete)
    .set(cleanUpdates as typeof athlete.$inferInsert)
    .where(eq(athlete.id, current.id));

  // Recalculate zones if HR values changed
  const newMaxHr = (updates.maxHr as number | undefined) ?? current.maxHr;
  const newRestingHr = (updates.restingHr as number | undefined) ?? current.restingHr;
  if (
    newMaxHr &&
    newRestingHr &&
    (updates.maxHr !== undefined || updates.restingHr !== undefined)
  ) {
    await db.delete(hrZones).where(eq(hrZones.athleteId, current.id));
    const zones = calculateKarvonenZones(newMaxHr, newRestingHr);
    const now = new Date().toISOString();
    for (const zone of zones) {
      await db.insert(hrZones).values({
        athleteId: current.id,
        zoneNumber: zone.zoneNumber,
        name: zone.name,
        minHr: zone.minHr,
        maxHr: zone.maxHr,
        description: zone.description,
        calculatedAt: now,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/history");

  const [updated] = await db.select().from(athlete).limit(1);
  return updated;
}
