"use client";

import { useState } from "react";
import { Plus, Loader2, X, Download, Activity } from "lucide-react";
import { logWorkout } from "@/lib/actions/workouts";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export type LatestStravaActivity = {
  id: number;
  name: string;
  distanceKm: number;
  durationMinutes: number;
  date: string;
  pace: string;
  avgHr: number | null;
  maxHr: number | null;
  type: string;
};

const WORKOUT_TYPES = [
  { value: "easy", label: "Easy Run" },
  { value: "tempo", label: "Tempo" },
  { value: "intervals", label: "Intervalos" },
  { value: "long_run", label: "Largo" },
  { value: "recovery", label: "Recuperacion" },
  { value: "race", label: "Carrera" },
  { value: "cross_training", label: "Cross Training" },
  { value: "rest", label: "Descanso" },
];

const FEELINGS = [
  { value: "great", label: "Genial" },
  { value: "good", label: "Bien" },
  { value: "ok", label: "Normal" },
  { value: "tired", label: "Cansado" },
  { value: "exhausted", label: "Agotado" },
];

export function WorkoutForm({ plannedWorkoutId, latestStrava }: { plannedWorkoutId?: number; latestStrava?: LatestStravaActivity | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importingStrava, setImportingStrava] = useState(false);
  const [stravaImported, setStravaImported] = useState(false);
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    type: "easy",
    distanceKm: "",
    durationMinutes: "",
    avgHr: "",
    rpe: "5",
    notes: "",
    feeling: "good",
  });

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await logWorkout({
        date: form.date,
        type: form.type,
        distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        avgHr: form.avgHr ? Number(form.avgHr) : undefined,
        rpe: Number(form.rpe),
        notes: form.notes || undefined,
        feeling: form.feeling || undefined,
        plannedWorkoutId,
      });
      setOpen(false);
      router.refresh();
    } catch (e) {
      console.error("Failed to log workout:", e);
    } finally {
      setLoading(false);
    }
  };

  const STRAVA_TYPE_MAP: Record<string, string> = {
    Run: "easy", VirtualRun: "easy", Trail: "long_run",
    Walk: "recovery", Race: "race", Hike: "long_run",
  };

  const handleStravaImport = async () => {
    if (!latestStrava) return;
    setImportingStrava(true);
    try {
      await logWorkout({
        date: latestStrava.date,
        type: STRAVA_TYPE_MAP[latestStrava.type] ?? "easy",
        distanceKm: latestStrava.distanceKm,
        durationMinutes: latestStrava.durationMinutes,
        avgHr: latestStrava.avgHr ?? undefined,
        maxHr: latestStrava.maxHr ?? undefined,
        rpe: 5,
        avgPace: latestStrava.pace !== "-" ? latestStrava.pace : undefined,
        notes: `Importado de Strava: ${latestStrava.name}`,
        stravaActivityId: latestStrava.id.toString(),
      });
      setStravaImported(true);
      router.refresh();
    } catch (e) {
      console.error("Strava import failed:", e);
    } finally {
      setImportingStrava(false);
    }
  };

  const inputClass =
    "w-full bg-[#011208] ring-1 ring-[#3c4a42]/15 focus:ring-[#5af0b3]/40 rounded-lg py-3 px-4 text-[#d0e8d6] text-sm outline-none transition-all placeholder:text-[#85948b]";
  const selectClass =
    "w-full bg-[#011208] ring-1 ring-[#3c4a42]/15 focus:ring-[#5af0b3]/40 rounded-lg py-3 px-4 text-[#d0e8d6] text-sm outline-none transition-all appearance-none";
  const labelClass =
    "text-[11px] font-semibold uppercase tracking-[0.2em] text-[#85948b]";

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-full border border-[#5af0b3]/40 text-[#5af0b3] text-xs font-semibold uppercase tracking-wider hover:bg-[#5af0b3]/10 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Registrar
        </button>

        {latestStrava && !stravaImported && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#2a2010] border border-[#ffccad]/20 max-w-[280px]">
            <Activity className="h-3.5 w-3.5 text-[#f0925a] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#ffccad] font-semibold truncate">{latestStrava.name}</p>
              <p className="text-[10px] text-[#85948b]">{latestStrava.distanceKm} km — {latestStrava.pace}/km</p>
            </div>
            <button
              onClick={handleStravaImport}
              disabled={importingStrava}
              className="px-2.5 py-1 rounded-full btn-gradient-warm text-[10px] font-bold shrink-0 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1"
            >
              {importingStrava ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Importar
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-[#1a2e22] rounded-t-3xl md:rounded-3xl p-6 max-h-[85vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">Registrar entrenamiento</h3>
              <button onClick={() => setOpen(false)} className="text-[#85948b] hover:text-[#d0e8d6]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Fecha</label>
              <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className={inputClass} />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Tipo</label>
              <select value={form.type} onChange={(e) => update("type", e.target.value)} className={selectClass}>
                {WORKOUT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelClass}>Distancia (km)</label>
                <input type="number" step="0.1" value={form.distanceKm} onChange={(e) => update("distanceKm", e.target.value)} placeholder="10.0" className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Duracion (min)</label>
                <input type="number" value={form.durationMinutes} onChange={(e) => update("durationMinutes", e.target.value)} placeholder="60" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelClass}>FC Promedio</label>
                <input type="number" value={form.avgHr} onChange={(e) => update("avgHr", e.target.value)} placeholder="145" className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>RPE (1-10)</label>
                <input type="number" min="1" max="10" value={form.rpe} onChange={(e) => update("rpe", e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Como te sentiste?</label>
              <select value={form.feeling} onChange={(e) => update("feeling", e.target.value)} className={selectClass}>
                {FEELINGS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Notas</label>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Como fue el entrenamiento?"
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full btn-gradient py-3 rounded-full font-bold text-sm shadow-lg shadow-[#5af0b3]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
