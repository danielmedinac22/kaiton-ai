"use client";

import { useState } from "react";
import { Trash2, Loader2, Activity } from "lucide-react";
import { deleteWorkout } from "@/lib/actions/workouts";
import { useRouter } from "next/navigation";
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
  tired: { label: "Cansado", color: "bg-[#2a2010] text-[#ffccad]" },
  exhausted: { label: "Agotado", color: "bg-[#93000a]/20 text-[#ffb4ab]" },
};

const TYPE_BORDER: Record<string, string> = {
  easy: "border-[#5af0b3]/20",
  tempo: "border-[#f0d85a]/40",
  intervals: "border-[#f0925a]/40",
  long_run: "border-[#ffccad]/40",
  recovery: "border-[#5af0b3]/20",
  race: "border-[#f05a5a]/40",
  cross_training: "border-[#85948b]/30",
  rest: "border-[#3c4a42]/30",
};

type WorkoutCardProps = {
  id: number;
  date: string;
  type: string;
  distanceKm: number | null;
  durationMinutes: number | null;
  avgHr: number | null;
  rpe: number;
  feeling: string | null;
  notes: string | null;
  stravaActivityId: string | null;
};

export function WorkoutCard(props: WorkoutCardProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const feeling = props.feeling ? FEELING_BADGES[props.feeling] : null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteWorkout(props.id);
      router.refresh();
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div
      className={`bg-[#1a2e22] rounded-3xl p-6 border-l-4 ${TYPE_BORDER[props.type] ?? "border-[#5af0b3]/20"} hover:bg-[#293e31] transition-all group relative`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-base">
              {TYPE_LABELS[props.type] ?? props.type}
            </span>
            {feeling && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${feeling.color}`}>
                {feeling.label}
              </span>
            )}
            {props.stravaActivityId && (
              <span className="px-2 py-0.5 rounded-full bg-[#f0925a]/15 text-[#f0925a] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                <Activity className="h-2.5 w-2.5" />
                Strava
              </span>
            )}
          </div>
          <p className="text-xs text-[#85948b]">
            {format(parseISO(props.date), "EEEE d MMM yyyy", { locale: es })}
          </p>
          {props.notes && (
            <p className="text-xs text-[#bbcac0]/70 mt-1 italic">{props.notes}</p>
          )}
        </div>
        <div className="flex items-start gap-3">
          <div className="text-right space-y-1">
            {props.distanceKm && (
              <p className="font-heading font-extrabold text-xl tracking-tighter">
                {props.distanceKm}
                <span className="text-xs font-normal text-[#85948b] ml-0.5">km</span>
              </p>
            )}
            {props.durationMinutes && (
              <p className="text-xs text-[#bbcac0]">{props.durationMinutes} min</p>
            )}
            <p className="text-[11px] text-[#85948b]">
              RPE {props.rpe}{props.avgHr ? ` / ${props.avgHr} bpm` : ""}
            </p>
          </div>

          {/* Delete button */}
          {confirming ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-full bg-[#93000a]/20 text-[#ffb4ab] text-[10px] font-bold uppercase tracking-widest hover:bg-[#93000a]/40 active:scale-95 transition-all flex items-center gap-1"
              >
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Borrar"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-2 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#85948b] hover:text-[#d0e8d6] transition-all"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-full text-[#85948b] hover:text-[#ffb4ab] hover:bg-[#93000a]/10 active:scale-95 transition-all shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
