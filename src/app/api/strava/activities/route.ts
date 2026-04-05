import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workoutLog } from "@/lib/db/schema";
import { getValidStravaToken, getStravaActivities, metersPerSecToPace } from "@/lib/strava";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const perPage = parseInt(url.searchParams.get("per_page") || "20");

  const accessToken = await getValidStravaToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Strava no conectado" }, { status: 401 });
  }

  try {
    const activities = await getStravaActivities(accessToken, page, perPage);

    // Get already imported IDs
    const imported = await db
      .select({ stravaActivityId: workoutLog.stravaActivityId })
      .from(workoutLog);
    const importedIds = new Set(
      imported.map((w) => w.stravaActivityId).filter((id): id is string => id !== null)
    );

    const mapped = activities.map((act) => ({
      id: act.id,
      name: act.name,
      type: act.type,
      sportType: act.sport_type,
      date: act.start_date_local.split("T")[0],
      dateFormatted: act.start_date_local,
      distanceKm: Math.round((act.distance / 1000) * 100) / 100,
      durationMinutes: Math.round(act.moving_time / 60),
      pace: metersPerSecToPace(act.average_speed),
      avgHr: act.average_heartrate ? Math.round(act.average_heartrate) : null,
      maxHr: act.max_heartrate ? Math.round(act.max_heartrate) : null,
      elevationGain: Math.round(act.total_elevation_gain),
      imported: importedIds.has(act.id.toString()),
    }));

    return NextResponse.json({ activities: mapped, page, perPage });
  } catch (err) {
    console.error("Strava activities error:", err);
    return NextResponse.json({ error: "Error obteniendo actividades" }, { status: 500 });
  }
}
