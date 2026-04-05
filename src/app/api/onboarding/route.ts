import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { athlete, hrZones } from "@/lib/db/schema";
import {
  calculateKarvonenZones,
  estimateMaxHr,
} from "@/lib/training/zones";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const maxHr =
      body.maxHr && Number(body.maxHr) > 0
        ? Number(body.maxHr)
        : body.age && Number(body.age) > 0
          ? estimateMaxHr(Number(body.age))
          : null;

    const restingHr =
      body.restingHr && Number(body.restingHr) > 0
        ? Number(body.restingHr)
        : null;

    const now = new Date().toISOString();

    // Insert athlete
    const [newAthlete] = await db
      .insert(athlete)
      .values({
        name: body.name,
        age: body.age ? Number(body.age) : null,
        experienceLevel: body.experienceLevel || "intermediate",
        restingHr,
        maxHr,
        weeklyKmCurrent: body.weeklyKmCurrent
          ? Number(body.weeklyKmCurrent)
          : null,
        goalRaceDistance: body.goalRaceDistance || null,
        goalRaceName: body.goalRaceName || null,
        goalRaceDate: body.goalRaceDate || null,
        goalRaceTime: body.goalRaceTime || null,
        aiProvider: body.aiProvider || "openai",
        aiApiKey: body.aiApiKey,
        aiModel: body.aiModel || "gpt-5.4-mini",
        language: body.language || "es",
        stravaClientId: body.stravaClientId || null,
        stravaClientSecret: body.stravaClientSecret || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Calculate HR zones if we have the data
    if (maxHr && restingHr) {
      const zones = calculateKarvonenZones(maxHr, restingHr);
      for (const zone of zones) {
        await db.insert(hrZones).values({
          athleteId: newAthlete.id,
          zoneNumber: zone.zoneNumber,
          name: zone.name,
          minHr: zone.minHr,
          maxHr: zone.maxHr,
          description: zone.description,
          calculatedAt: now,
        });
      }
    }

    // Set onboarded cookie
    const response = NextResponse.json({ ok: true });
    response.cookies.set("kaiton-onboarded", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });

    return response;
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Error al guardar el perfil" },
      { status: 500 }
    );
  }
}
