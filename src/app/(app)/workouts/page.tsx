export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { workoutLog } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { WorkoutForm } from "@/components/history/workout-form";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

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
}
