export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { workoutLog } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { WorkoutForm } from "@/components/history/workout-form";
import { WorkoutCard } from "@/components/history/workout-card";

export default async function WorkoutsPage() {
  const workouts = await db.select().from(workoutLog).orderBy(desc(workoutLog.date)).limit(100);

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-6">
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
          {workouts.map((w) => (
            <WorkoutCard
              key={w.id}
              id={w.id}
              date={w.date}
              type={w.type}
              distanceKm={w.distanceKm}
              durationMinutes={w.durationMinutes}
              avgHr={w.avgHr}
              rpe={w.rpe}
              feeling={w.feeling}
              notes={w.notes}
              stravaActivityId={w.stravaActivityId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
