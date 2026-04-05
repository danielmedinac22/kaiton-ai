import { streamText, convertToModelMessages } from "ai";
import { db } from "@/lib/db";
import {
  athlete,
  hrZones,
  workoutLog,
  trainingPlan,
  trainingPlanWorkout,
} from "@/lib/db/schema";
import { desc, eq, gte } from "drizzle-orm";
import { getAIModel } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { createCoachTools } from "@/lib/ai/tools";
import { format, addDays, differenceInWeeks, parseISO } from "date-fns";

export async function POST(request: Request) {
  const { messages } = await request.json();

  // Load athlete context
  const [athleteData] = await db.select().from(athlete).limit(1);
  if (!athleteData) {
    return new Response("No athlete profile found", { status: 400 });
  }

  // Load zones
  const zones = await db
    .select()
    .from(hrZones)
    .where(eq(hrZones.athleteId, athleteData.id));

  // Load recent workouts (14 days)
  const since = format(addDays(new Date(), -14), "yyyy-MM-dd");
  const recentWorkouts = await db
    .select()
    .from(workoutLog)
    .where(gte(workoutLog.date, since))
    .orderBy(desc(workoutLog.date));

  // Load active plan status
  let activePlan: {
    name: string;
    totalWeeks: number;
    currentWeek: number;
    phase: string;
    completionPct: number;
  } | null = null;

  const [plan] = await db
    .select()
    .from(trainingPlan)
    .where(eq(trainingPlan.status, "active"))
    .limit(1);

  if (plan) {
    const planWorkouts = await db
      .select()
      .from(trainingPlanWorkout)
      .where(eq(trainingPlanWorkout.planId, plan.id));

    const completed = planWorkouts.filter((w) => w.completed).length;
    const currentWeek = Math.min(
      differenceInWeeks(new Date(), parseISO(plan.startDate)) + 1,
      plan.totalWeeks
    );

    const phases: { phase: string; startWeek: number; endWeek: number }[] =
      JSON.parse(plan.phaseStructure);
    const currentPhase =
      phases.find(
        (p) => currentWeek >= p.startWeek && currentWeek <= p.endWeek
      )?.phase ?? "base";

    activePlan = {
      name: plan.name,
      totalWeeks: plan.totalWeeks,
      currentWeek,
      phase: currentPhase,
      completionPct:
        planWorkouts.length > 0
          ? Math.round((completed / planWorkouts.length) * 100)
          : 0,
    };
  }

  const systemPrompt = buildSystemPrompt({
    name: athleteData.name,
    age: athleteData.age,
    experienceLevel: athleteData.experienceLevel,
    restingHr: athleteData.restingHr,
    maxHr: athleteData.maxHr,
    weeklyKmCurrent: athleteData.weeklyKmCurrent,
    goalRaceDistance: athleteData.goalRaceDistance,
    goalRaceName: athleteData.goalRaceName,
    goalRaceDate: athleteData.goalRaceDate,
    goalRaceTime: athleteData.goalRaceTime,
    language: athleteData.language,
    zones: zones.map((z) => ({
      zoneNumber: z.zoneNumber,
      name: z.name,
      minHr: z.minHr,
      maxHr: z.maxHr,
    })),
    recentWorkouts: recentWorkouts.map((w) => ({
      date: w.date,
      type: w.type,
      distanceKm: w.distanceKm,
      durationMinutes: w.durationMinutes,
      rpe: w.rpe,
      notes: w.notes,
    })),
    activePlan,
  });

  const model = getAIModel(
    athleteData.aiProvider,
    athleteData.aiApiKey,
    athleteData.aiModel
  );

  const tools = createCoachTools();

  // Convert UI messages to model messages for streamText
  const modelMessages = await convertToModelMessages(messages, { tools });

  const result = streamText({
    model,
    system: systemPrompt,
    messages: modelMessages,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
