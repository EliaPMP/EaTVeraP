/**
 * fitnessRouter — EatVera Fitness Feature
 * Handles exercise logs, step logs, and AI-powered workout description parsing.
 *
 * Read queries (getLogs, getSteps, getWeightLogs, estimateCardio, estimateWeightlifting)
 * use publicProcedure and return empty data for unauthenticated users.
 * Write mutations (logExercise, deleteLog, logSteps, logWeight, deleteWeightLog,
 * parseWorkoutDescription) still require auth via protectedProcedure.
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { fitnessLogs, stepLogs, bodyWeightLogs } from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ── Calorie estimation helpers ─────────────────────────────────────────────────
const CARDIO_METS: Record<string, number> = {
  walking: 3.5, jogging: 7.0, running: 9.8, sprinting: 14.0,
  cycling: 7.5, swimming: 8.0, hiit: 10.0, rowing: 7.0,
  elliptical: 5.0, jump_rope: 11.0, stair_climbing: 8.0,
  yoga: 2.5, pilates: 3.0, dancing: 5.0, boxing: 9.0,
  basketball: 6.5, soccer: 7.0, tennis: 7.0,
};

function estimateCardioCalories(activity: string, durationMin: number): number {
  const key = activity.toLowerCase().replace(/\s+/g, "_");
  const met = CARDIO_METS[key] ?? 6.0;
  return Math.round(met * 70 * (durationMin / 60));
}

function estimateWeightliftingCalories(durationMin: number, intensity: string): number {
  const mets: Record<string, number> = { low: 3.0, moderate: 5.0, high: 7.0 };
  return Math.round((mets[intensity] ?? 5.0) * 70 * (durationMin / 60));
}

function stepsToCalories(steps: number): number {
  return Math.round(steps * 0.04);
}

// ── Router ─────────────────────────────────────────────────────────────────────
export const fitnessRouter = router({
  /** Log a new exercise entry */
  logExercise: protectedProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        type: z.enum(["cardio", "weightlifting", "described", "manual"]),
        name: z.string().min(1).max(255),
        durationMin: z.number().int().min(1).max(600).optional(),
        caloriesBurned: z.number().int().min(0).max(9999),
        distanceKm: z.number().min(0).max(1000).optional(),
        sets: z.number().int().min(1).max(100).optional(),
        reps: z.number().int().min(1).max(1000).optional(),
        weightKg: z.number().min(0).max(500).optional(),
        notes: z.string().max(2000).optional(),
        intensity: z.enum(["low", "moderate", "high"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [result] = await db.insert(fitnessLogs).values({
        userId: ctx.user.id,
        date: input.date,
        type: input.type,
        name: input.name,
        durationMin: input.durationMin ?? null,
        caloriesBurned: input.caloriesBurned,
        distanceKm: input.distanceKm != null ? Math.round(input.distanceKm * 1000) : null,
        sets: input.sets ?? null,
        reps: input.reps ?? null,
        weightKg: input.weightKg != null ? Math.round(input.weightKg * 1000) : null,
        notes: input.notes ?? null,
        intensity: input.intensity ?? null,
      });
      return { success: true, id: (result as any).insertId as number };
    }),

  /** Get exercise logs for a date range — returns [] for unauthenticated users */
  getLogs: publicProcedure
    .input(
      z.object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) return [];
      const db = await getDb();
      if (!db) return [];
      const logs = await db
        .select()
        .from(fitnessLogs)
        .where(
          and(
            eq(fitnessLogs.userId, ctx.user.id),
            gte(fitnessLogs.date, input.startDate),
            lte(fitnessLogs.date, input.endDate)
          )
        )
        .orderBy(desc(fitnessLogs.createdAt));
      return logs.map((l) => ({
        ...l,
        distanceKm: l.distanceKm != null ? l.distanceKm / 1000 : null,
        weightKg: l.weightKg != null ? l.weightKg / 1000 : null,
      }));
    }),

  /** Delete an exercise log entry */
  deleteLog: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(fitnessLogs)
        .where(and(eq(fitnessLogs.id, input.id), eq(fitnessLogs.userId, ctx.user.id)));
      return { success: true };
    }),

  /** Estimate calories for a cardio activity — public, no auth needed */
  estimateCardio: publicProcedure
    .input(
      z.object({
        activity: z.string(),
        durationMin: z.number().int().min(1).max(600),
      })
    )
    .query(({ input }) => {
      return { calories: estimateCardioCalories(input.activity, input.durationMin) };
    }),

  /** Estimate calories for a weightlifting session — public, no auth needed */
  estimateWeightlifting: publicProcedure
    .input(
      z.object({
        durationMin: z.number().int().min(1).max(600),
        intensity: z.enum(["low", "moderate", "high"]),
      })
    )
    .query(({ input }) => {
      return { calories: estimateWeightliftingCalories(input.durationMin, input.intensity) };
    }),

  /** AI-parse a free-text workout description and return structured data + calorie estimate */
  parseWorkoutDescription: protectedProcedure
    .input(z.object({ description: z.string().min(5).max(2000) }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a fitness expert. Parse the user's workout description and return a JSON object with: name (string, short workout name), durationMin (integer or null), caloriesBurned (integer estimate for 70kg person), intensity (low|moderate|high), notes (string, brief summary). Be concise and accurate.",
          },
          { role: "user", content: input.description },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "workout_parse",
            strict: true,
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                durationMin: { type: ["integer", "null"] },
                caloriesBurned: { type: "integer" },
                intensity: { type: "string", enum: ["low", "moderate", "high"] },
                notes: { type: "string" },
              },
              required: ["name", "durationMin", "caloriesBurned", "intensity", "notes"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices?.[0]?.message?.content;
      try {
        return JSON.parse(typeof content === "string" ? content : JSON.stringify(content)) as {
          name: string;
          durationMin: number | null;
          caloriesBurned: number;
          intensity: "low" | "moderate" | "high";
          notes: string;
        };
      } catch {
        return { name: "Workout", durationMin: null, caloriesBurned: 200, intensity: "moderate" as const, notes: input.description };
      }
    }),

  /** Log or update step count for a date */
  logSteps: protectedProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        steps: z.number().int().min(0).max(100000),
        distanceM: z.number().int().min(0).optional(),
        source: z.enum(["manual", "healthkit", "pedometer"]).default("manual"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const existing = await db
        .select({ id: stepLogs.id })
        .from(stepLogs)
        .where(and(eq(stepLogs.userId, ctx.user.id), eq(stepLogs.date, input.date)))
        .limit(1);

      const calories = stepsToCalories(input.steps);

      if (existing.length > 0) {
        await db
          .update(stepLogs)
          .set({
            steps: input.steps,
            distanceM: input.distanceM ?? null,
            caloriesBurned: calories,
            source: input.source,
          })
          .where(eq(stepLogs.id, existing[0].id));
        return { success: true, id: existing[0].id };
      } else {
        const [result] = await db.insert(stepLogs).values({
          userId: ctx.user.id,
          date: input.date,
          steps: input.steps,
          distanceM: input.distanceM ?? null,
          caloriesBurned: calories,
          source: input.source,
        });
        return { success: true, id: (result as any).insertId as number };
      }
    }),

  /** Get step logs for a date range — returns [] for unauthenticated users */
  getSteps: publicProcedure
    .input(
      z.object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) return [];
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(stepLogs)
        .where(
          and(
            eq(stepLogs.userId, ctx.user.id),
            gte(stepLogs.date, input.startDate),
            lte(stepLogs.date, input.endDate)
          )
        )
        .orderBy(desc(stepLogs.createdAt));
    }),

  /** Log a body weight entry */
  logWeight: protectedProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        weightRaw: z.string().min(1).max(16), // e.g. "72.5"
        unit: z.enum(["kg", "lbs"]),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const parsedValue = parseFloat(input.weightRaw);
      // Convert to kg for internal storage (2 decimal precision)
      const weightKg = input.unit === "lbs"
        ? Math.round(parsedValue * 0.453592 * 100) / 100
        : parsedValue;
      // Upsert: delete existing entry for this date then insert
      await db.delete(bodyWeightLogs).where(
        and(eq(bodyWeightLogs.userId, ctx.user.id), eq(bodyWeightLogs.date, input.date))
      );
      const [row] = await db.insert(bodyWeightLogs).values({
        userId: ctx.user.id,
        date: input.date,
        weightKg: Math.round(weightKg * 100), // store as integer (kg × 100, e.g. 77.11 → 7711)
        weightRaw: input.weightRaw,            // store the ORIGINAL user input (e.g. "170")
        unit: input.unit,
        notes: input.notes ?? null,
      });
      return { id: (row as any).insertId as number };
    }),

  /** Get body weight logs for a date range — returns [] for unauthenticated users */
  getWeightLogs: publicProcedure
    .input(
      z.object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) return [];
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(bodyWeightLogs)
        .where(
          and(
            eq(bodyWeightLogs.userId, ctx.user.id),
            gte(bodyWeightLogs.date, input.startDate),
            lte(bodyWeightLogs.date, input.endDate)
          )
        )
        .orderBy(desc(bodyWeightLogs.date));
    }),

  /** Delete a body weight log entry */
  deleteWeightLog: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(bodyWeightLogs).where(
        and(eq(bodyWeightLogs.id, input.id), eq(bodyWeightLogs.userId, ctx.user.id))
      );
      return { success: true };
    }),

  /** Edit a body weight log entry (update weightRaw, unit, date) */
  editWeightLog: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        weightRaw: z.string().min(1).max(16),
        unit: z.enum(["kg", "lbs"]),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const parsedValue = parseFloat(input.weightRaw);
      const weightKg = input.unit === "lbs"
        ? Math.round(parsedValue * 0.453592 * 100) / 100
        : parsedValue;
      await db
        .update(bodyWeightLogs)
        .set({
          date: input.date,
          weightRaw: input.weightRaw,
          weightKg: Math.round(weightKg * 100),
          unit: input.unit,
          notes: input.notes ?? null,
        })
        .where(
          and(eq(bodyWeightLogs.id, input.id), eq(bodyWeightLogs.userId, ctx.user.id))
        );
      return { success: true };
    }),

  /** Get ALL body weight logs for the authenticated user (no date filter) */
  getAllWeightLogs: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(bodyWeightLogs)
        .where(eq(bodyWeightLogs.userId, ctx.user.id))
        .orderBy(desc(bodyWeightLogs.date));
    }),

  // AI-powered calorie & macro goal suggestion
  suggestGoals: publicProcedure
    .input(z.object({
      currentWeight: z.number().positive(),
      targetWeight: z.number().positive(),
      unit: z.enum(["kg", "lbs"]),
      activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
      goal: z.enum(["lose", "maintain", "gain"]),
    }))
    .mutation(async ({ input }) => {
      const weightInKg = input.unit === "lbs"
        ? input.currentWeight * 0.453592
        : input.currentWeight;
      const targetInKg = input.unit === "lbs"
        ? input.targetWeight * 0.453592
        : input.targetWeight;

      const activityLabels: Record<string, string> = {
        sedentary: "sedentary (desk job, no exercise)",
        light: "lightly active (1-3 days/week exercise)",
        moderate: "moderately active (3-5 days/week exercise)",
        active: "very active (6-7 days/week hard exercise)",
        very_active: "extra active (physical job + daily training)",
      };

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a certified nutritionist. Respond ONLY with valid JSON matching the schema. No markdown, no explanation.",
          },
          {
            role: "user",
            content: `Calculate daily calorie and macro targets for this person:
- Current weight: ${weightInKg.toFixed(1)} kg
- Target weight: ${targetInKg.toFixed(1)} kg
- Activity level: ${activityLabels[input.activityLevel]}
- Goal: ${input.goal} weight

Respond with JSON: { "dailyCalories": number, "dailyProtein": number, "dailyCarbs": number, "dailyFat": number, "explanation": string }
All macros in grams. Calories as integer. Explanation max 1 sentence.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "goal_suggestion",
            strict: true,
            schema: {
              type: "object",
              properties: {
                dailyCalories: { type: "integer" },
                dailyProtein: { type: "integer" },
                dailyCarbs: { type: "integer" },
                dailyFat: { type: "integer" },
                explanation: { type: "string" },
              },
              required: ["dailyCalories", "dailyProtein", "dailyCarbs", "dailyFat", "explanation"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      return parsed as {
        dailyCalories: number;
        dailyProtein: number;
        dailyCarbs: number;
        dailyFat: number;
        explanation: string;
      };
    }),
});


