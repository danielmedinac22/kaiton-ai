export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { trainingPlan, trainingPlanWorkout } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { WorkoutRow } from "@/components/plan/workout-row";
import type { WorkoutSegment } from "@/lib/types";

export default async function PlanPage() {
  const [activePlan] = await db.select().from(trainingPlan).where(eq(trainingPlan.status, "active")).limit(1);

  let planWorkouts: (typeof trainingPlanWorkout.$inferSelect)[] = [];
  if (activePlan) {
    planWorkouts = await db.select().from(trainingPlanWorkout)
      .where(eq(trainingPlanWorkout.planId, activePlan.id))
      .orderBy(trainingPlanWorkout.date);
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-4">
      <div>
        <h2 className="font-heading font-extrabold text-xl tracking-tight">
          Plan de Entrenamiento
        </h2>
        <p className="text-xs text-[#85948b] mt-0.5">
          Tu plan activo y entrenamientos programados
        </p>
      </div>

      {activePlan ? (
        <>
          <div className="bg-[#1a2e22] rounded-3xl p-6 space-y-2">
            <h3 className="font-heading font-extrabold text-lg tracking-tight">
              {activePlan.name}
            </h3>
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
                <div className="space-y-1">
                  {ww.map((w) => {
                    const segments: WorkoutSegment[] = w.segments
                      ? JSON.parse(w.segments)
                      : [];
                    return (
                      <WorkoutRow
                        key={w.id}
                        date={format(parseISO(w.date), "EEE d", { locale: es })}
                        title={w.title}
                        completed={w.completed}
                        targetDistanceKm={w.targetDistanceKm}
                        targetHrZone={w.targetHrZone}
                        targetRpe={w.targetRpe}
                        segments={segments}
                      />
                    );
                  })}
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
}
