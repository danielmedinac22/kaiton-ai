export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { athlete, hrZones } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/history/settings-form";
import { ExportButton } from "@/components/history/export-button";
import { ImportButton } from "@/components/history/import-button";

export default async function SettingsPage() {
  const [athleteData] = await db.select().from(athlete).limit(1);

  const zones = athleteData
    ? await db.select().from(hrZones).where(eq(hrZones.athleteId, athleteData.id)).orderBy(hrZones.zoneNumber)
    : [];

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="font-heading font-extrabold text-xl tracking-tight">
          Configuracion
        </h2>
        <p className="text-xs text-[#85948b] mt-0.5">
          Perfil, zonas de FC, IA y datos
        </p>
      </div>

      {athleteData && (
        <SettingsForm
          athleteData={{
            ...athleteData,
            experienceLevel: athleteData.experienceLevel ?? "intermediate",
            aiProvider: athleteData.aiProvider ?? "openai",
            aiModel: athleteData.aiModel ?? "gpt-5.4-mini",
            language: athleteData.language ?? "es",
            stravaClientId: athleteData.stravaClientId ?? null,
            stravaClientSecret: athleteData.stravaClientSecret ?? null,
            stravaAthleteId: athleteData.stravaAthleteId ?? null,
            stravaAccessToken: athleteData.stravaAccessToken ?? null,
          }}
          zones={zones.map((z) => ({
            zoneNumber: z.zoneNumber,
            name: z.name,
            minHr: z.minHr,
            maxHr: z.maxHr,
          }))}
        />
      )}
      <div className="flex items-center gap-2">
        <ExportButton />
        <ImportButton />
      </div>
    </div>
  );
}
