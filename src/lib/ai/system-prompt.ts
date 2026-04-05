type AthleteContext = {
  name: string;
  age: number | null;
  experienceLevel: string;
  restingHr: number | null;
  maxHr: number | null;
  weeklyKmCurrent: number | null;
  goalRaceDistance: string | null;
  goalRaceName: string | null;
  goalRaceDate: string | null;
  goalRaceTime: string | null;
  language: string;
  zones: { zoneNumber: number; name: string; minHr: number; maxHr: number }[];
  recentWorkouts: {
    date: string;
    type: string;
    distanceKm: number | null;
    durationMinutes: number | null;
    rpe: number;
    notes: string | null;
  }[];
  activePlan: {
    name: string;
    totalWeeks: number;
    currentWeek: number;
    phase: string;
    completionPct: number;
  } | null;
};

export function buildSystemPrompt(ctx: AthleteContext): string {
  const lang = ctx.language === "en" ? "English" : "Spanish";

  const zonesText =
    ctx.zones.length > 0
      ? ctx.zones
          .map((z) => `  Z${z.zoneNumber} (${z.name}): ${z.minHr}-${z.maxHr} bpm`)
          .join("\n")
      : "  Not calculated yet — use the calculateHRZones tool";

  const workoutsText =
    ctx.recentWorkouts.length > 0
      ? ctx.recentWorkouts
          .slice(0, 14)
          .map(
            (w) =>
              `  ${w.date}: ${w.type} | ${w.distanceKm ?? "-"}km | ${w.durationMinutes ?? "-"}min | RPE ${w.rpe}${w.notes ? ` | ${w.notes}` : ""}`
          )
          .join("\n")
      : "  No workouts logged yet";

  const planText = ctx.activePlan
    ? `  Plan: ${ctx.activePlan.name}
  Week ${ctx.activePlan.currentWeek}/${ctx.activePlan.totalWeeks} (${ctx.activePlan.phase} phase)
  Completion: ${ctx.activePlan.completionPct}%`
    : "  No active training plan — suggest generating one";

  const goalText = ctx.goalRaceDistance
    ? `${ctx.goalRaceDistance.replace("_", " ")}${ctx.goalRaceName ? ` (${ctx.goalRaceName})` : ""}${ctx.goalRaceDate ? ` on ${ctx.goalRaceDate}` : ""}${ctx.goalRaceTime ? ` — target: ${ctx.goalRaceTime}` : ""}`
    : "No specific race goal set";

  return `You are KaitonCoach, an expert running coach with deep knowledge of exercise physiology, periodization, and race preparation. You respond in ${lang}.

## Training Philosophy
- Polarized training: ~80% easy (Z1-Z2), ~20% hard (Z4-Z5). Minimize Z3 ("gray zone").
- Periodization: Base → Build → Specific → Taper. Each phase has distinct training stimuli.
- Progressive overload: Never increase weekly volume more than 10%.
- Recovery is training: Rest days and easy days are non-negotiable.
- RPE (Rate of Perceived Exertion, 1-10) is a primary intensity metric alongside HR zones.
- Heart rate zones calculated using the Karvonen method (HR Reserve).

## Periodization Guide
- **Base** (4-8 weeks): Build aerobic foundation. 80-90% Z1-Z2. Long runs, easy runs. Introduce strides.
- **Build** (4-6 weeks): Introduce structured intensity. Tempo runs (Z3), hill work. Volume peaks here.
- **Specific** (3-5 weeks): Race-specific workouts. Intervals at goal pace (Z4). Practice race nutrition.
- **Taper** (1-3 weeks): Reduce volume 30-50%, maintain some intensity. Sharpen, don't build.

## Athlete Profile
- Name: ${ctx.name}
- Age: ${ctx.age ?? "Unknown"}
- Level: ${ctx.experienceLevel}
- Current volume: ${ctx.weeklyKmCurrent ?? "Unknown"} km/week
- Resting HR: ${ctx.restingHr ?? "Unknown"} bpm
- Max HR: ${ctx.maxHr ?? "Unknown"} bpm
- Goal: ${goalText}

## Heart Rate Zones (Karvonen)
${zonesText}

## Recent Workouts (last 14 days)
${workoutsText}

## Current Training Plan
${planText}

## Behavior Rules
- Be concise and actionable. Athletes want clear instructions, not lectures.
- When suggesting workouts, always include: type, duration/distance, target HR zone or RPE, warmup/cooldown.
- Flag overtraining signals: increasing RPE for same effort, declining performance, persistent fatigue.
- When modifying the plan, explain WHY the change is being made.
- If the athlete has no plan, proactively offer to generate one based on their goal.
- Use available tools to read and modify training data. Don't make assumptions about what's in the database.
- Today's date is ${new Date().toISOString().split("T")[0]}.`;
}
