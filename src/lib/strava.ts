import { db } from "@/lib/db";
import { athlete } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_URL = "https://www.strava.com/api/v3";

/** Get Strava credentials from env vars (primary) or DB (fallback) */
export async function getStravaCredentials(): Promise<{
  clientId: string;
  clientSecret: string;
} | null> {
  // Env vars take priority
  if (process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET) {
    return {
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
    };
  }

  // Fallback to DB
  const [a] = await db.select().from(athlete).limit(1);
  if (a?.stravaClientId && a?.stravaClientSecret) {
    return { clientId: a.stravaClientId, clientSecret: a.stravaClientSecret };
  }

  return null;
}

export function getStravaAuthUrl(clientId: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "activity:read_all",
    approval_prompt: "auto",
  });
  return `${STRAVA_AUTH_URL}?${params}`;
}

export async function exchangeStravaToken(
  clientId: string,
  clientSecret: string,
  code: string
) {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Strava token exchange failed: ${err}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresAt: data.expires_at as number,
    athleteId: data.athlete?.id as number,
  };
}

export async function refreshStravaToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
) {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error("Strava token refresh failed");

  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresAt: data.expires_at as number,
  };
}

/** Ensure we have a valid access token, refreshing if needed */
export async function getValidStravaToken(): Promise<string | null> {
  const [a] = await db.select().from(athlete).limit(1);
  if (!a?.stravaAccessToken || !a?.stravaRefreshToken) return null;

  const now = Math.floor(Date.now() / 1000);
  if (a.stravaTokenExpiresAt && a.stravaTokenExpiresAt - now > 60) {
    return a.stravaAccessToken;
  }

  // Need refresh
  const creds = await getStravaCredentials();
  if (!creds) return null;

  try {
    const refreshed = await refreshStravaToken(
      creds.clientId,
      creds.clientSecret,
      a.stravaRefreshToken
    );
    await db
      .update(athlete)
      .set({
        stravaAccessToken: refreshed.accessToken,
        stravaRefreshToken: refreshed.refreshToken,
        stravaTokenExpiresAt: refreshed.expiresAt,
      })
      .where(eq(athlete.id, a.id));
    return refreshed.accessToken;
  } catch {
    return null;
  }
}

export type StravaActivity = {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
};

export async function getStravaActivities(
  accessToken: string,
  page: number = 1,
  perPage: number = 30
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  const res = await fetch(`${STRAVA_API_URL}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    const retry = await fetch(
      `${STRAVA_API_URL}/athlete/activities?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!retry.ok) throw new Error("Strava rate limited");
    return retry.json();
  }

  if (!res.ok) throw new Error(`Strava API error: ${res.status}`);
  return res.json();
}

export function mapStravaType(
  type: string
): "easy" | "tempo" | "intervals" | "long_run" | "recovery" | "race" | "cross_training" | "rest" {
  const t = type.toLowerCase();
  if (t.includes("race")) return "race";
  if (t.includes("trail") || t.includes("hike")) return "long_run";
  if (t === "run" || t === "virtualrun") return "easy";
  if (t === "walk") return "recovery";
  return "cross_training";
}

export function metersPerSecToPace(mps: number): string {
  if (mps <= 0) return "-";
  const secPerKm = 1000 / mps;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}
