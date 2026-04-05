import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  workoutLog,
  trainingPlan,
  trainingPlanWorkout,
  hrZones,
  athlete,
} from "@/lib/db/schema";
import { desc, eq, gte } from "drizzle-orm";
import { calculateKarvonenZones } from "@/lib/training/zones";
import {
  addDays,
  format,
  getISODay,
  differenceInWeeks,
  parseISO,
} from "date-fns";

export function createCoachTools() {
  return {
    getRecentWorkouts: tool({
      description:
        "Get the athlete's recent logged workouts. Use this to analyze training load, patterns, and compliance.",
      inputSchema: z.object({
        days: z
          .number()
          .min(1)
          .max(365)
          .default(14)
          .describe("Number of days to look back"),
      }),
      execute: async ({ days }) => {
        const since = format(addDays(new Date(), -days), "yyyy-MM-dd");
        const workouts = await db
          .select()
          .from(workoutLog)
          .where(gte(workoutLog.date, since))
          .orderBy(desc(workoutLog.date));
        return {
          count: workouts.length,
          workouts: workouts.map((w) => ({
            date: w.date,
            type: w.type,
            distanceKm: w.distanceKm,
            durationMinutes: w.durationMinutes,
            avgHr: w.avgHr,
            rpe: w.rpe,
            feeling: w.feeling,
            notes: w.notes,
          })),
        };
      },
    }),

    getCurrentPlanStatus: tool({
      description:
        "Get the current active training plan status including completion percentage and upcoming workouts.",
      inputSchema: z.object({}),
      execute: async () => {
        const [plan] = await db
          .select()
          .from(trainingPlan)
          .where(eq(trainingPlan.status, "active"))
          .limit(1);

        if (!plan) {
          return { hasPlan: false as const, message: "No active training plan found" };
        }

        const allWorkouts = await db
          .select()
          .from(trainingPlanWorkout)
          .where(eq(trainingPlanWorkout.planId, plan.id));

        const completed = allWorkouts.filter((w) => w.completed).length;
        const today = format(new Date(), "yyyy-MM-dd");
        const upcoming = allWorkouts
          .filter((w) => w.date >= today && !w.completed)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 7);

        const currentWeek =
          differenceInWeeks(new Date(), parseISO(plan.startDate)) + 1;

        return {
          hasPlan: true as const,
          plan: {
            name: plan.name,
            totalWeeks: plan.totalWeeks,
            currentWeek: Math.min(currentWeek, plan.totalWeeks),
            completionPct:
              allWorkouts.length > 0
                ? Math.round((completed / allWorkouts.length) * 100)
                : 0,
          },
          upcoming: upcoming.map((w) => ({
            date: w.date,
            type: w.type,
            title: w.title,
            description: w.description,
            targetHrZone: w.targetHrZone,
            targetRpe: w.targetRpe,
            targetDistanceKm: w.targetDistanceKm,
            targetDurationMinutes: w.targetDurationMinutes,
          })),
        };
      },
    }),

    calculateHRZones: tool({
      description:
        "Calculate heart rate training zones using the Karvonen method. Updates the stored zones.",
      inputSchema: z.object({
        maxHr: z.number().min(100).max(230).describe("Maximum heart rate"),
        restingHr: z
          .number()
          .min(30)
          .max(100)
          .describe("Resting heart rate"),
      }),
      execute: async ({ maxHr, restingHr }) => {
        const zones = calculateKarvonenZones(maxHr, restingHr);
        const [athleteData] = await db.select().from(athlete).limit(1);
        if (!athleteData) return { error: "No athlete found" };

        await db.delete(hrZones).where(eq(hrZones.athleteId, athleteData.id));
        const now = new Date().toISOString();
        for (const zone of zones) {
          await db.insert(hrZones).values({
            athleteId: athleteData.id,
            zoneNumber: zone.zoneNumber,
            name: zone.name,
            minHr: zone.minHr,
            maxHr: zone.maxHr,
            description: zone.description,
            calculatedAt: now,
          });
        }

        await db
          .update(athlete)
          .set({ maxHr, restingHr, updatedAt: now })
          .where(eq(athlete.id, athleteData.id));

        return {
          zones: zones.map(
            (z) =>
              `Z${z.zoneNumber} (${z.name}): ${z.minHr}-${z.maxHr} bpm — ${z.description}`
          ),
        };
      },
    }),

    generateTrainingPlan: tool({
      description:
        "Generate a periodized training plan based on the athlete's goal, current fitness, and available time. This creates a full multi-week plan with daily workouts.",
      inputSchema: z.object({
        startDate: z
          .string()
          .describe("Plan start date in YYYY-MM-DD format"),
        totalWeeks: z
          .number()
          .min(4)
          .max(52)
          .describe("Total weeks for the plan"),
        weeklyRunDays: z
          .number()
          .min(3)
          .max(7)
          .default(5)
          .describe("Number of running days per week"),
        plan: z.array(
          z.object({
            weekNumber: z.number(),
            phase: z.enum(["base", "build", "specific", "taper"]),
            workouts: z.array(
              z.object({
                dayOfWeek: z
                  .number()
                  .min(1)
                  .max(7)
                  .describe("1=Monday, 7=Sunday"),
                type: z.enum([
                  "easy",
                  "tempo",
                  "intervals",
                  "long_run",
                  "recovery",
                  "race",
                  "cross_training",
                  "rest",
                ]),
                title: z.string(),
                description: z.string(),
                targetDistanceKm: z.number().nullable(),
                targetDurationMinutes: z.number().nullable(),
                targetHrZone: z.string().nullable(),
                targetRpe: z.number().min(1).max(10).nullable(),
              })
            ),
          })
        ),
      }),
      execute: async ({ startDate, totalWeeks, plan: weeklyPlan }) => {
        const [athleteData] = await db.select().from(athlete).limit(1);
        if (!athleteData) return { error: "No athlete found" };

        await db
          .update(trainingPlan)
          .set({ status: "abandoned" })
          .where(eq(trainingPlan.status, "active"));

        const start = parseISO(startDate);
        const endDate = format(
          addDays(start, totalWeeks * 7 - 1),
          "yyyy-MM-dd"
        );

        const phases = weeklyPlan.reduce(
          (acc, week) => {
            const existing = acc.find((p) => p.phase === week.phase);
            if (existing) {
              existing.endWeek = week.weekNumber;
            } else {
              acc.push({
                phase: week.phase,
                startWeek: week.weekNumber,
                endWeek: week.weekNumber,
              });
            }
            return acc;
          },
          [] as { phase: string; startWeek: number; endWeek: number }[]
        );

        const [newPlan] = await db
          .insert(trainingPlan)
          .values({
            name: `Plan ${athleteData.goalRaceDistance?.replace("_", " ") ?? "running"} — ${totalWeeks} semanas`,
            goalRaceDistance: athleteData.goalRaceDistance,
            goalRaceDate: athleteData.goalRaceDate,
            startDate,
            endDate,
            totalWeeks,
            phaseStructure: JSON.stringify(phases),
            status: "active",
            createdAt: new Date().toISOString(),
          })
          .returning();

        let workoutCount = 0;
        for (const week of weeklyPlan) {
          for (const workout of week.workouts) {
            const weekStart = addDays(start, (week.weekNumber - 1) * 7);
            const startDayOfWeek = getISODay(weekStart);
            const dayOffset = workout.dayOfWeek - startDayOfWeek;
            const workoutDate = addDays(
              weekStart,
              dayOffset >= 0 ? dayOffset : dayOffset + 7
            );

            await db.insert(trainingPlanWorkout).values({
              planId: newPlan.id,
              weekNumber: week.weekNumber,
              dayOfWeek: workout.dayOfWeek,
              date: format(workoutDate, "yyyy-MM-dd"),
              phase: week.phase,
              type: workout.type,
              title: workout.title,
              description: workout.description,
              targetDistanceKm: workout.targetDistanceKm,
              targetDurationMinutes: workout.targetDurationMinutes,
              targetHrZone: workout.targetHrZone,
              targetRpe: workout.targetRpe,
              sortOrder: workoutCount,
            });
            workoutCount++;
          }
        }

        return {
          success: true,
          planId: newPlan.id,
          name: newPlan.name,
          totalWeeks,
          totalWorkouts: workoutCount,
          phases: phases.map(
            (p) => `${p.phase}: weeks ${p.startWeek}-${p.endWeek}`
          ),
        };
      },
    }),

    adjustPlan: tool({
      description:
        "Modify specific upcoming workouts in the active training plan. Use this to adjust intensity, swap workout types, or add rest days.",
      inputSchema: z.object({
        changes: z.array(
          z.object({
            date: z
              .string()
              .describe("Date of workout to modify (YYYY-MM-DD)"),
            type: z
              .enum([
                "easy",
                "tempo",
                "intervals",
                "long_run",
                "recovery",
                "race",
                "cross_training",
                "rest",
              ])
              .nullable()
              .describe("New workout type, or null to keep current"),
            title: z
              .string()
              .nullable()
              .describe("New title, or null to keep"),
            description: z
              .string()
              .nullable()
              .describe("New description, or null to keep"),
            targetRpe: z
              .number()
              .min(1)
              .max(10)
              .nullable()
              .describe("New target RPE, or null to keep"),
            reason: z.string().describe("Why this change is being made"),
          })
        ),
      }),
      execute: async ({ changes }) => {
        const results = [];
        for (const change of changes) {
          const [existing] = await db
            .select()
            .from(trainingPlanWorkout)
            .where(eq(trainingPlanWorkout.date, change.date))
            .limit(1);

          if (!existing) {
            results.push({ date: change.date, status: "not found" });
            continue;
          }

          const updates: Record<string, unknown> = {};
          if (change.type !== null) updates.type = change.type;
          if (change.title !== null) updates.title = change.title;
          if (change.description !== null)
            updates.description = change.description;
          if (change.targetRpe !== null) updates.targetRpe = change.targetRpe;

          if (Object.keys(updates).length > 0) {
            await db
              .update(trainingPlanWorkout)
              .set(updates)
              .where(eq(trainingPlanWorkout.id, existing.id));
          }

          results.push({
            date: change.date,
            status: "updated",
            reason: change.reason,
          });
        }
        return { changes: results };
      },
    }),
  };
}
