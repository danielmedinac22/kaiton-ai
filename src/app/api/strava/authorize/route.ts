import { NextResponse } from "next/server";
import { getStravaCredentials, getStravaAuthUrl } from "@/lib/strava";

export async function GET(request: Request) {
  const creds = await getStravaCredentials();
  if (!creds) {
    return NextResponse.json(
      { error: "Strava no configurado. Agrega STRAVA_CLIENT_ID y STRAVA_CLIENT_SECRET en .env.local" },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/strava/callback`;
  const authUrl = getStravaAuthUrl(creds.clientId, redirectUri);

  return NextResponse.redirect(authUrl);
}
