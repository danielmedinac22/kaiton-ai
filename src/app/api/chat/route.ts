import { generateText, stepCountIs } from "ai";
import { db } from "@/lib/db";
import {
  athlete,
  hrZones,
  workoutLog,
  trainingPlan,
  trainingPlanWorkout,
  chatHistory,
} from "@/lib/db/schema";
import { desc, eq, gte } from "drizzle-orm";
import { getAIModel } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { createCoachTools } from "@/lib/ai/tools";
import { format, addDays, differenceInWeeks, parseISO } from "date-fns";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage: string = body.message ?? "";

    if (!userMessage.trim()) {
      return NextResponse.json({ error: "Mensaje vacio" }, { status: 400 });
    }

    const [athleteData] = await db.select().from(athlete).limit(1);
    if (!athleteData) {
      return NextResponse.json({ error: "No hay perfil" }, { status: 400 });
    }

    // Load context
    const zones = await db
      .select()
      .from(hrZones)
      .where(eq(hrZones.athleteId, athleteData.id));

    const since = format(addDays(new Date(), -14), "yyyy-MM-dd");
    const recentWorkouts = await db
      .select()
      .from(workoutLog)
      .where(gte(workoutLog.date, since))
      .orderBy(desc(workoutLog.date));

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
        phases.find((p) => currentWeek >= p.startWeek && currentWeek <= p.endWeek)
          ?.phase ?? "base";

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

    // Load recent chat history for context
    const history = await db
      .select()
      .from(chatHistory)
      .orderBy(desc(chatHistory.createdAt))
      .limit(20);

    const historyMessages = history
      .reverse()
      .map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      }));

    // Build messages: history + new user message
    const allMessages = [
      ...historyMessages,
      { role: "user" as const, content: userMessage },
    ];

    // Save user message to history
    await db.insert(chatHistory).values({
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    });

    // Generate with multi-step tool use
    const tools = createCoachTools();
    const result = await generateText({
      model,
      system: systemPrompt,
      messages: allMessages,
      tools,
      stopWhen: stepCountIs(5),
    });

    const responseText = result.text || "No pude generar una respuesta.";

    // Save assistant response to history
    await db.insert(chatHistory).values({
      role: "assistant",
      content: responseText,
      createdAt: new Date().toISOString(),
    });

    // Report which tools were used
    const toolsUsed = result.steps
      ?.flatMap((s: { toolCalls?: { toolName: string }[] }) => s.toolCalls?.map((tc) => tc.toolName) ?? [])
      ?? [];

    return NextResponse.json({
      text: responseText,
      toolsUsed: [...new Set(toolsUsed)],
    });
  } catch (error) {
    console.error("Chat error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
