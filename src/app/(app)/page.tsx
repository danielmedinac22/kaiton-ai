export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { athlete, workoutLog, trainingPlan, trainingPlanWorkout } from "@/lib/db/schema";
import { WorkoutForm, type LatestStravaActivity } from "@/components/history/workout-form";
import { getValidStravaToken, getStravaActivities, metersPerSecToPace } from "@/lib/strava";
import { eq, gte, desc } from "drizzle-orm";
import { format, addDays, startOfWeek, differenceInCalendarDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Activity, Target, Flame, Calendar, ChevronRight, CheckCircle2 } from "lucide-react";
import { estimatePacePerZone } from "@/lib/training/pace-zones";
import type { WorkoutSegment } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  easy: "Easy Run", tempo: "Tempo", intervals: "Intervalos",
  long_run: "Largo", recovery: "Recuperacion", race: "Carrera",
  cross_training: "Cross Training", rest: "Descanso",
};

export default async function DashboardPage() {
  const [a] = await db.select().from(athlete).limit(1);
  if (!a) return null;

  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const weekWorkouts = await db.select().from(workoutLog).where(gte(workoutLog.date, weekStart));
  const weeklyKm = weekWorkouts.reduce((s, w) => s + (w.distanceKm ?? 0), 0);

  const recentWorkouts = await db.select().from(workoutLog).orderBy(desc(workoutLog.date)).limit(60);
  const workoutDates = new Set(recentWorkouts.map((w) => w.date));
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = format(addDays(new Date(), -i), "yyyy-MM-dd");
    if (workoutDates.has(d)) streak++;
    else if (i > 0) break;
  }

  const allWorkouts = await db.select({ id: workoutLog.id }).from(workoutLog);

  const [activePlan] = await db.select().from(trainingPlan).where(eq(trainingPlan.status, "active")).limit(1);

  let todayPlanned: typeof trainingPlanWorkout.$inferSelect | null = null;
  let upcoming: (typeof trainingPlanWorkout.$inferSelect)[] = [];

  if (activePlan) {
    const [tw] = await db.select().from(trainingPlanWorkout)
      .where(eq(trainingPlanWorkout.date, today)).limit(1);
    todayPlanned = tw ?? null;
    upcoming = await db.select().from(trainingPlanWorkout)
      .where(gte(trainingPlanWorkout.date, today))
      .orderBy(trainingPlanWorkout.date).limit(6);
  }

  const paceZones = estimatePacePerZone({
    pr5k: a.pr5k,
    pr10k: a.pr10k,
    prHalf: a.prHalf,
    prMarathon: a.prMarathon,
    goalRaceTime: a.goalRaceTime,
    goalRaceDistance: a.goalRaceDistance,
  });

  // Fetch latest unimported Strava activity
  let latestStrava: LatestStravaActivity | null = null;
  try {
    const token = await getValidStravaToken();
    if (token) {
      const activities = await getStravaActivities(token, 1, 1);
      if (activities.length > 0) {
        const act = activities[0];
        const importedIds = new Set(
          (await db.select({ sid: workoutLog.stravaActivityId }).from(workoutLog))
            .map((w) => w.sid)
            .filter((id): id is string => id !== null)
        );
        if (!importedIds.has(act.id.toString())) {
          latestStrava = {
            id: act.id,
            name: act.name,
            distanceKm: Math.round((act.distance / 1000) * 100) / 100,
            durationMinutes: Math.round(act.moving_time / 60),
            date: act.start_date_local.split("T")[0],
            pace: metersPerSecToPace(act.average_speed),
            avgHr: act.average_heartrate ? Math.round(act.average_heartrate) : null,
            maxHr: act.max_heartrate ? Math.round(act.max_heartrate) : null,
            type: act.type,
          };
        }
      }
    }
  } catch {
    // Strava fetch failed — just skip the quick import
  }

  const daysUntilRace = a.goalRaceDate
    ? differenceInCalendarDays(parseISO(a.goalRaceDate), new Date()) : null;

  let currentPhase: string | null = null;
  if (activePlan) {
    const phases: { phase: string; startWeek: number; endWeek: number }[] = JSON.parse(activePlan.phaseStructure);
    const wk = Math.floor(differenceInCalendarDays(new Date(), parseISO(activePlan.startDate)) / 7) + 1;
    currentPhase = phases.find((p) => wk >= p.startWeek && wk <= p.endWeek)?.phase ?? null;
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
    const ds = format(d, "yyyy-MM-dd");
    return { label: format(d, "EEE", { locale: es }), date: ds, done: workoutDates.has(ds), isToday: ds === today };
  });

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-extrabold text-2xl tracking-tight">
            Hola, {a.name}
          </h1>
          <p className="text-sm text-[#85948b] mt-1">
            {daysUntilRace !== null && daysUntilRace > 0
              ? `${daysUntilRace} dias para tu carrera`
              : daysUntilRace === 0 ? "Dia de carrera!" : "Sin carrera programada"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentPhase && (
            <span className="px-3 py-1 rounded-full border border-[#5af0b3]/40 text-[#5af0b3] text-[10px] font-bold uppercase tracking-widest">
              {currentPhase}
            </span>
          )}
          <WorkoutForm latestStrava={latestStrava} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Activity, label: "KM SEMANA", value: weeklyKm.toFixed(1), sub: "km", color: "text-[#5af0b3]", bg: "bg-[#102418]" },
          { icon: Target, label: "META", value: a.goalRaceDistance?.replace("_", " ") ?? "-", sub: "", color: "text-[#ffccad]", bg: "bg-[#2a2010]" },
          { icon: Flame, label: "RACHA", value: `${streak}`, sub: "dias", color: "text-[#f0d85a]", bg: "bg-[#2a2510]" },
          { icon: Calendar, label: "TOTAL", value: `${allWorkouts.length}`, sub: "", color: "text-[#5af0b3]", bg: "bg-[#102418]" },
        ].map((s) => (
          <div key={s.label} className="bg-[#1a2e22] rounded-3xl p-5 space-y-3">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon className={`h-5 w-5 ${s.color}`} strokeWidth={1.5} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#85948b]">
              {s.label}
            </p>
            <p className="font-heading font-extrabold text-2xl tracking-tighter text-[#d0e8d6]">
              {s.value}
              {s.sub && <span className="text-sm font-normal text-[#85948b] ml-1">{s.sub}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Week Overview */}
      <div className="bg-[#102418] rounded-[2rem] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#85948b] mb-4">
          Esta semana
        </p>
        <div className="flex justify-between">
          {weekDays.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-2">
              <span className={`text-[10px] uppercase tracking-wider ${d.isToday ? "text-[#5af0b3] font-bold" : "text-[#85948b]"}`}>
                {d.label}
              </span>
              {d.done ? (
                <div className="w-8 h-8 rounded-full bg-[#5af0b3] flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-[#003825]" strokeWidth={2.5} />
                </div>
              ) : d.isToday ? (
                <div className="w-8 h-8 rounded-full border-2 border-[#5af0b3] ring-4 ring-[#5af0b3]/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#5af0b3] animate-pulse" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1a2e22]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Today's Workout */}
      <div className="bg-[#1a2e22] rounded-3xl p-6 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#85948b]">
          Entrenamiento de hoy
        </p>
        {todayPlanned ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading font-extrabold text-lg tracking-tight">
                  {todayPlanned.title}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-[#bbcac0]">
                  <span>{TYPE_LABELS[todayPlanned.type] ?? todayPlanned.type}</span>
                  {todayPlanned.targetDistanceKm && <span>{todayPlanned.targetDistanceKm} km</span>}
                  {todayPlanned.targetHrZone && <span>{todayPlanned.targetHrZone}</span>}
                  {todayPlanned.targetRpe && <span>RPE {todayPlanned.targetRpe}</span>}
                </div>
              </div>
              {todayPlanned.completed ? (
                <span className="px-3 py-1 rounded-full bg-[#1c503a] text-[#5af0b3] text-[10px] font-bold uppercase tracking-widest">
                  Listo
                </span>
              ) : (
                <WorkoutForm plannedWorkoutId={todayPlanned.id} />
              )}
            </div>
            {todayPlanned.description && (
              <p className="text-sm text-[#bbcac0] leading-relaxed">
                {todayPlanned.description}
              </p>
            )}
            {(() => {
              const segments: WorkoutSegment[] = todayPlanned.segments
                ? JSON.parse(todayPlanned.segments)
                : [];
              if (segments.length === 0) return null;
              const zoneColors: Record<string, string> = {
                Z1: "bg-[#5af0b3]/20 text-[#5af0b3]",
                Z2: "bg-[#5af0b3]/30 text-[#5af0b3]",
                Z3: "bg-[#f0d85a]/20 text-[#f0d85a]",
                Z4: "bg-[#f0925a]/20 text-[#f0925a]",
                Z5: "bg-[#f05a5a]/20 text-[#f05a5a]",
              };
              return (
                <div className="space-y-1.5 pt-1">
                  {segments.map((seg, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#bbcac0]">{seg.name}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[#85948b]">{seg.durationMinutes} min</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${zoneColors[seg.zone] ?? "bg-[#293e31] text-[#bbcac0]"}`}>
                          {seg.zone}
                        </span>
                        {paceZones?.[seg.zone] && (
                          <span className="text-[10px] text-[#85948b] font-mono">
                            {paceZones[seg.zone].minPace}-{paceZones[seg.zone].maxPace}/km
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        ) : activePlan ? (
          <p className="text-sm text-[#85948b]">Dia de descanso.</p>
        ) : (
          <p className="text-sm text-[#85948b]">
            No tienes un plan. Pidele al{" "}
            <Link href="/coach" className="text-[#5af0b3] hover:underline">Coach</Link>{" "}
            que genere uno.
          </p>
        )}
      </div>

      {/* Upcoming */}
      {upcoming.filter((w) => w.date !== today).length > 0 && (
        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#85948b]">
            Proximos entrenamientos
          </p>
          <div className="space-y-2">
            {upcoming
              .filter((w) => w.date !== today)
              .slice(0, 5)
              .map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between bg-[#102418] rounded-2xl px-5 py-3.5"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#85948b] w-12 shrink-0">
                      {format(parseISO(w.date), "EEE d", { locale: es })}
                    </span>
                    <span className="text-sm font-semibold">{w.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#85948b]">
                    {w.targetDistanceKm && <span>{w.targetDistanceKm} km</span>}
                    {w.targetRpe && <span>RPE {w.targetRpe}</span>}
                    {w.completed && <CheckCircle2 className="h-3.5 w-3.5 text-[#5af0b3]" />}
                  </div>
                </div>
              ))}
          </div>
          <Link
            href="/plan"
            className="flex items-center gap-1 text-xs text-[#5af0b3] hover:underline"
          >
            Ver plan completo <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
