export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { athlete } from "@/lib/db/schema";
import { StravaBrowser } from "@/components/history/strava-browser";

export default async function StravaPage() {
  const [athleteData] = await db.select().from(athlete).limit(1);

  const isStravaConnected = !!(athleteData?.stravaAccessToken);
  const hasStravaCreds = !!(
    (process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET) ||
    (athleteData?.stravaClientId && athleteData?.stravaClientSecret)
  );

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="font-heading font-extrabold text-xl tracking-tight">
          Strava
        </h2>
        <p className="text-xs text-[#85948b] mt-0.5">
          Importa tus actividades desde Strava
        </p>
      </div>
      <StravaBrowser
        isConnected={isStravaConnected}
        hasCredentials={hasStravaCreds}
      />
    </div>
  );
}
