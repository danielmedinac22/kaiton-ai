import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { athlete } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const [a] = await db.select().from(athlete).limit(1);
  if (!a) return NextResponse.json({ error: "No athlete" }, { status: 400 });

  await db
    .update(athlete)
    .set({
      stravaAccessToken: null,
      stravaRefreshToken: null,
      stravaTokenExpiresAt: null,
      stravaAthleteId: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(athlete.id, a.id));

  return NextResponse.json({ ok: true });
}
