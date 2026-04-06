"use server";

import { db } from "@/lib/db";
import { athlete, hrZones } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calculateKarvonenZones } from "@/lib/training/zones";

export async function recalculateZones() {
  const [a] = await db.select().from(athlete).limit(1);
  if (!a?.maxHr || !a?.restingHr) return null;

  await db.delete(hrZones).where(eq(hrZones.athleteId, a.id));

  const zones = calculateKarvonenZones(a.maxHr, a.restingHr);
  const now = new Date().toISOString();

  for (const zone of zones) {
    await db.insert(hrZones).values({
      athleteId: a.id,
      zoneNumber: zone.zoneNumber,
      name: zone.name,
      minHr: zone.minHr,
      maxHr: zone.maxHr,
      description: zone.description,
      calculatedAt: now,
    });
  }

  revalidatePath("/plan");
  revalidatePath("/settings");
  return zones;
}
