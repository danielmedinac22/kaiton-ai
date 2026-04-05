export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { athlete, workoutLog, trainingPlan, trainingPlanWorkout, hrZones } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { WorkoutForm } from "@/components/history/workout-form";
import { SettingsForm } from "@/components/history/settings-form";
import { ExportButton } from "@/components/history/export-button";
import { ImportButton } from "@/components/history/import-button";
import { HistoryTabs } from "@/components/history/history-tabs";
import { StravaBrowser } from "@/components/history/strava-browser";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  easy: "Easy Run", tempo: "Tempo", intervals: "Intervalos",
  long_run: "Long Run", recovery: "Recovery Walk", race: "Carrera",
  cross_training: "Cross Training", rest: "Descanso",
};

const FEELING_BADGES: Record<string, { label: string; color: string }> = {
  great: { label: "Excelente", color: "bg-[#5af0b3] text-[#003825]" },
  good: { label: "Bien", color: "bg-[#1c503a] text-[#5af0b3]" },
  ok: { label: "Normal", color: "bg-[#293e31] text-[#bbcac0]" },
  tired: { label: "Cansado", color: "bg-[#293e31] text-[#ffccad]" },
  exhausted: { label: "Agotado", color: "bg-[#93000a]/20 text-[#ffb4ab]" },
};

export default async function HistoryPage() {
  const [athleteData] = await db.select().from(athlete).limit(1);
  const workouts = await db.select().from(workoutLog).orderBy(desc(workoutLog.date)).limit(100);

  const [activePlan] = await db.select().from(trainingPlan).where(eq(trainingPlan.status, "active")).limit(1);
  let planWorkouts: (typeof trainingPlanWorkout.$inferSelect)[] = [];
  if (activePlan) {
    planWorkouts = await db.select().from(trainingPlanWorkout)
      .where(eq(trainingPlanWorkout.planId, activePlan.id))
      .orderBy(trainingPlanWorkout.date);
  }

  const zones = athleteData
    ? await db.select().from(hrZones).where(eq(hrZones.athleteId, athleteData.id)).orderBy(hrZones.zoneNumber)
    : [];

  // Render tab contents as server components, pass to client tabs
  const workoutsContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-extrabold text-xl tracking-tight">
            Historial
          </h2>
          <p className="text-xs text-[#85948b] mt-0.5">
            Tu progreso en los ultimos 30 dias
          </p>
        </div>
        <WorkoutForm />
      </div>

      {workouts.length === 0 ? (
        <div className="bg-[#1a2e22] rounded-3xl p-8 text-center text-sm text-[#85948b]">
          No hay entrenamientos registrados. Registra tu primer entrenamiento o pidele al coach que genere tu plan.
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => {
            const feeling = w.feeling ? FEELING_BADGES[w.feeling] : null;
            return (
              <div
                key={w.id}
                className="bg-[#1a2e22] rounded-3xl p-6 border-l-4 border-[#5af0b3]/20 hover:bg-[#293e31] transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-extrabold text-base">
                        {TYPE_LABELS[w.type] ?? w.type}
                      </span>
                      {feeling && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${feeling.color}`}>
                          {feeling.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#85948b]">
                      {format(parseISO(w.date), "EEEE d MMM yyyy", { locale: es })}
                    </p>
                    {w.notes && (
                      <p className="text-xs text-[#bbcac0]/70 mt-1 italic">{w.notes}</p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    {w.distanceKm && (
                      <p className="font-heading font-extrabold text-xl tracking-tighter">
                        {w.distanceKm}
                        <span className="text-xs font-normal text-[#85948b] ml-0.5">km</span>
                      </p>
                    )}
                    {w.durationMinutes && (
                      <p className="text-xs text-[#bbcac0]">{w.durationMinutes} min</p>
                    )}
                    <p className="text-[11px] text-[#85948b]">
                      RPE {w.rpe}{w.avgHr ? ` / ${w.avgHr} bpm` : ""}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const planContent = (
    <div className="space-y-4">
      {activePlan ? (
        <>
          <div className="bg-[#1a2e22] rounded-3xl p-6 space-y-2">
            <h2 className="font-heading font-extrabold text-lg tracking-tight">
              {activePlan.name}
            </h2>
            <p className="text-xs text-[#85948b]">
              {activePlan.startDate} a {activePlan.endDate} — {activePlan.totalWeeks} semanas
            </p>
            <p className="text-xs text-[#bbcac0]">
              Completados: {planWorkouts.filter((w) => w.completed).length} / {planWorkouts.length}
            </p>
          </div>

          {(() => {
            const byWeek = new Map<number, (typeof trainingPlanWorkout.$inferSelect)[]>();
            for (const w of planWorkouts) {
              const list = byWeek.get(w.weekNumber) ?? [];
              list.push(w);
              byWeek.set(w.weekNumber, list);
            }
            return Array.from(byWeek.entries()).map(([weekNum, ww]) => (
              <div key={weekNum} className="bg-[#102418] rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-sm">Semana {weekNum}</span>
                  <span className="px-3 py-1 rounded-full bg-[#1c503a] text-[#5af0b3] text-[10px] font-bold uppercase tracking-widest">
                    {ww[0]?.phase}
                  </span>
                </div>
                <div className="space-y-2">
                  {ww.map((w) => (
                    <div key={w.id} className="flex items-center justify-between py-1.5 text-sm">
                      <div className="flex items-center gap-2.5">
                        {w.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-[#5af0b3]" strokeWidth={2} />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-[#3c4a42]" />
                        )}
                        <span className="text-[11px] text-[#85948b] w-12">
                          {format(parseISO(w.date), "EEE d", { locale: es })}
                        </span>
                        <span className={w.completed ? "text-[#85948b] line-through" : "text-[#d0e8d6]"}>
                          {w.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-[#85948b]">
                        {w.targetDistanceKm && <span>{w.targetDistanceKm} km</span>}
                        {w.targetHrZone && <span>{w.targetHrZone}</span>}
                        {w.targetRpe && <span>RPE {w.targetRpe}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </>
      ) : (
        <div className="bg-[#1a2e22] rounded-3xl p-8 text-center text-sm text-[#85948b]">
          No hay un plan activo. Ve al Coach y pidele que genere tu plan.
        </div>
      )}
    </div>
  );

  const settingsContent = (
    <div className="space-y-4">
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

  const isStravaConnected = !!(athleteData?.stravaAccessToken);
  const hasStravaCreds = !!(
    (process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET) ||
    (athleteData?.stravaClientId && athleteData?.stravaClientSecret)
  );
  const stravaContent = (
    <StravaBrowser
      isConnected={isStravaConnected}
      hasCredentials={hasStravaCreds}
    />
  );

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      <HistoryTabs
        workoutsContent={workoutsContent}
        planContent={planContent}
        stravaContent={stravaContent}
        settingsContent={settingsContent}
      />
    </div>
  );
}
