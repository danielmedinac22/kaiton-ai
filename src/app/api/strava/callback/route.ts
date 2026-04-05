import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { athlete } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStravaCredentials, exchangeStravaToken } from "@/lib/strava";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/strava?error=auth", url.origin));
  }

  const creds = await getStravaCredentials();
  if (!creds) {
    return NextResponse.redirect(new URL("/strava?error=no-config", url.origin));
  }

  const [a] = await db.select().from(athlete).limit(1);
  if (!a) {
    return NextResponse.redirect(new URL("/strava?error=auth", url.origin));
  }

  try {
    const tokens = await exchangeStravaToken(creds.clientId, creds.clientSecret, code);

    await db
      .update(athlete)
      .set({
        stravaAccessToken: tokens.accessToken,
        stravaRefreshToken: tokens.refreshToken,
        stravaTokenExpiresAt: tokens.expiresAt,
        stravaAthleteId: tokens.athleteId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(athlete.id, a.id));

    return NextResponse.redirect(new URL("/strava", url.origin));
  } catch (err) {
    console.error("Strava callback error:", err);
    return NextResponse.redirect(new URL("/strava?error=auth", url.origin));
  }
}
