/**
 * workoutRouter — EatVera Advanced AI Fitness System
 * Handles AI-generated workout programs, session tracking, and adaptive coaching.
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { workoutPrograms, workoutSessions } from "../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ── Exercise substitute map ────────────────────────────────────────────────────
const EXERCISE_SUBSTITUTES: Record<string, string[]> = {
  "Running": ["Cycling", "Incline Walking", "Rowing", "Boxing", "Jump Rope"],
  "Bench Press": ["Push-ups", "Dumbbell Press", "Cable Fly", "Dips"],
  "Squat": ["Goblet Squat", "Leg Press", "Bulgarian Split Squat", "Box Squat"],
  "Deadlift": ["Romanian Deadlift", "Trap Bar Deadlift", "Good Mornings", "Kettlebell Swing"],
  "Pull-up": ["Lat Pulldown", "Assisted Pull-up", "Inverted Row", "Dumbbell Row"],
  "Overhead Press": ["Dumbbell Shoulder Press", "Arnold Press", "Landmine Press", "Pike Push-up"],
  "Barbell Row": ["Dumbbell Row", "Cable Row", "T-Bar Row", "Chest-Supported Row"],
  "Lunges": ["Step-ups", "Reverse Lunges", "Walking Lunges", "Split Squat"],
  "Jump Rope": ["Shadow Boxing", "Cycling", "High Knees", "Jumping Jacks"],
  "Cycling": ["Elliptical", "Rowing", "Swimming", "Incline Walking"],
  "Swimming": ["Rowing", "Cycling", "Elliptical", "Water Aerobics"],
  "HIIT": ["Tabata", "Circuit Training", "Kettlebell Swings", "Battle Ropes"],
  "Plank": ["Dead Bug", "Bird Dog", "Ab Wheel", "Hollow Hold"],
  "Hip Thrust": ["Glute Bridge", "Cable Kickback", "Donkey Kick", "Romanian Deadlift"],
  "Dips": ["Bench Dips", "Close-Grip Push-up", "Tricep Pushdown", "Overhead Extension"],
  "Leg Curl": ["Nordic Curl", "Romanian Deadlift", "Swiss Ball Curl", "Glute-Ham Raise"],
  "Leg Extension": ["Terminal Knee Extension", "Wall Sit", "Step-up", "Sissy Squat"],
  "Calf Raise": ["Jump Rope", "Stair Climbing", "Seated Calf Raise", "Donkey Calf Raise"],
  "Bicep Curl": ["Hammer Curl", "Incline Curl", "Cable Curl", "Resistance Band Curl"],
  "Tricep Extension": ["Skull Crusher", "Tricep Dip", "Close-Grip Bench", "Kickback"],
};

function getSubstitutes(exerciseName: string): string[] {
  const key = Object.keys(EXERCISE_SUBSTITUTES).find(
    k => k.toLowerCase() === exerciseName.toLowerCase() ||
         exerciseName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? EXERCISE_SUBSTITUTES[key] : ["Alternative exercise", "Bodyweight variation"];
}

// ── Workout Router ─────────────────────────────────────────────────────────────
export const workoutRouter = router({

  /** Generate a personalized multi-week AI workout program */
  generateProgram: protectedProcedure
    .input(z.object({
      goal: z.enum(["muscle_gain", "weight_loss", "endurance", "athletic_performance", "body_recomposition"]),
      fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]),
      daysPerWeek: z.number().int().min(2).max(6),
      totalWeeks: z.number().int().min(4).max(16).default(8),
      ageYears: z.number().int().min(13).max(90).optional(),
      weightLbs: z.number().positive().optional(),
      heightInches: z.number().positive().optional(),
      availableEquipment: z.array(z.string()).optional(),
      injuries: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const equipmentList = input.availableEquipment?.length
        ? input.availableEquipment.join(", ")
        : "full gym (barbells, dumbbells, cables, machines)";

      const goalDescriptions: Record<string, string> = {
        muscle_gain: "maximize muscle hypertrophy and strength gains",
        weight_loss: "burn fat while preserving muscle mass",
        endurance: "build cardiovascular endurance and stamina",
        athletic_performance: "improve speed, power, agility, and overall athleticism",
        body_recomposition: "simultaneously lose fat and build muscle",
      };

      const prompt = `Create a ${input.totalWeeks}-week workout program for a ${input.fitnessLevel} level person.
Goal: ${goalDescriptions[input.goal]}
Days per week: ${input.daysPerWeek}
Available equipment: ${equipmentList}
${input.ageYears ? `Age: ${input.ageYears} years` : ""}
${input.weightLbs ? `Weight: ${input.weightLbs} lbs` : ""}
${input.injuries ? `Injuries/limitations: ${input.injuries}` : "No injuries"}

Create a progressive overload program where intensity increases week over week.
Include warmup (5-10 min), main workout, and cooldown/stretching (5-10 min) for each session.
Each exercise must include sets, reps (or duration), rest time, and estimated calories burned.
Include targeted muscle groups and difficulty level for each workout day.

Return a JSON program with this exact structure:
{
  "programName": string,
  "description": string,
  "weeks": [
    {
      "weekNumber": number,
      "theme": string,
      "days": [
        {
          "dayNumber": number,
          "name": string,
          "targetMuscles": string[],
          "estimatedDurationMin": number,
          "estimatedCalories": number,
          "difficultyLevel": "easy"|"moderate"|"hard"|"intense",
          "warmup": [{"name": string, "durationMin": number, "description": string}],
          "exercises": [
            {
              "name": string,
              "sets": number,
              "reps": string,
              "restSec": number,
              "weightNote": string,
              "targetMuscle": string,
              "estimatedCalories": number,
              "tips": string
            }
          ],
          "cooldown": [{"name": string, "durationMin": number, "description": string}]
        }
      ]
    }
  ]
}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an elite certified personal trainer and strength coach. Generate detailed, scientifically-backed workout programs. Always apply progressive overload principles. Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "workout_program",
            strict: false,
            schema: {
              type: "object",
              properties: {
                programName: { type: "string" },
                description: { type: "string" },
                weeks: { type: "array" },
              },
              required: ["programName", "description", "weeks"],
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content;
      let programData: any;
      try {
        programData = typeof content === "string" ? JSON.parse(content) : content;
      } catch {
        throw new Error("Failed to parse AI program response");
      }

      // Deactivate existing active programs
      await db.update(workoutPrograms)
        .set({ isActive: 0 })
        .where(and(eq(workoutPrograms.userId, ctx.user.id), eq(workoutPrograms.isActive, 1)));

      // Save new program
      const [result] = await db.insert(workoutPrograms).values({
        userId: ctx.user.id,
        goal: input.goal,
        fitnessLevel: input.fitnessLevel,
        daysPerWeek: input.daysPerWeek,
        totalWeeks: input.totalWeeks,
        currentWeek: 1,
        programJson: JSON.stringify(programData),
        isActive: 1,
      });

      return {
        id: (result as any).insertId as number,
        program: programData,
      };
    }),

  /** Get the active workout program for the current user */
  getActiveProgram: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) return null;
      const db = await getDb();
      if (!db) return null;
      const [program] = await db
        .select()
        .from(workoutPrograms)
        .where(and(eq(workoutPrograms.userId, ctx.user.id), eq(workoutPrograms.isActive, 1)))
        .orderBy(desc(workoutPrograms.createdAt))
        .limit(1);
      if (!program) return null;
      return {
        ...program,
        programData: JSON.parse(program.programJson),
      };
    }),

  /** Update the current week of a program (advance progression) */
  advanceWeek: protectedProcedure
    .input(z.object({ programId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [program] = await db
        .select()
        .from(workoutPrograms)
        .where(and(eq(workoutPrograms.id, input.programId), eq(workoutPrograms.userId, ctx.user.id)))
        .limit(1);
      if (!program) throw new Error("Program not found");
      const newWeek = Math.min(program.currentWeek + 1, program.totalWeeks);
      await db.update(workoutPrograms)
        .set({ currentWeek: newWeek })
        .where(eq(workoutPrograms.id, input.programId));
      return { currentWeek: newWeek };
    }),

  /** Archive / delete a program */
  archiveProgram: protectedProcedure
    .input(z.object({ programId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(workoutPrograms)
        .set({ isActive: 0 })
        .where(and(eq(workoutPrograms.id, input.programId), eq(workoutPrograms.userId, ctx.user.id)));
      return { success: true };
    }),

  /** Log a completed workout session */
  logSession: protectedProcedure
    .input(z.object({
      programId: z.number().int().optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      weekNumber: z.number().int().optional(),
      dayNumber: z.number().int().optional(),
      workoutName: z.string().min(1).max(255),
      exercisesJson: z.string(),
      durationMin: z.number().int().min(1).max(600).optional(),
      caloriesBurned: z.number().int().min(0).max(9999).optional(),
      notes: z.string().max(2000).optional(),
      rating: z.number().int().min(1).max(5).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [result] = await db.insert(workoutSessions).values({
        userId: ctx.user.id,
        programId: input.programId ?? null,
        date: input.date,
        weekNumber: input.weekNumber ?? null,
        dayNumber: input.dayNumber ?? null,
        workoutName: input.workoutName,
        exercisesJson: input.exercisesJson,
        durationMin: input.durationMin ?? null,
        caloriesBurned: input.caloriesBurned ?? null,
        notes: input.notes ?? null,
        rating: input.rating ?? null,
      });
      return { success: true, id: (result as any).insertId as number };
    }),

  /** Get workout sessions for a date range */
  getSessions: publicProcedure
    .input(z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) return [];
      const db = await getDb();
      if (!db) return [];
      const sessions = await db
        .select()
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.userId, ctx.user.id),
            gte(workoutSessions.date, input.startDate),
            lte(workoutSessions.date, input.endDate)
          )
        )
        .orderBy(desc(workoutSessions.createdAt));
      return sessions.map(s => ({
        ...s,
        exercises: JSON.parse(s.exercisesJson || "[]"),
      }));
    }),

  /** Delete a workout session */
  deleteSession: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(workoutSessions)
        .where(and(eq(workoutSessions.id, input.id), eq(workoutSessions.userId, ctx.user.id)));
      return { success: true };
    }),

  /** Get exercise substitutes for a given exercise name */
  getSubstitutes: publicProcedure
    .input(z.object({ exerciseName: z.string() }))
    .query(({ input }) => {
      return { substitutes: getSubstitutes(input.exerciseName) };
    }),

  /** AI-powered adaptive recommendation based on recent performance */
  getAdaptiveRecommendation: protectedProcedure
    .input(z.object({
      programId: z.number().int(),
      recentSessions: z.array(z.object({
        date: z.string(),
        workoutName: z.string(),
        rating: z.number().optional(),
        completed: z.boolean().optional(),
      })),
      missedDays: z.number().int().min(0),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a personal trainer AI. Provide brief, actionable adaptive coaching advice based on workout performance data. Be encouraging and specific. Max 3 sentences.",
          },
          {
            role: "user",
            content: `Recent workout data:
- Missed days this week: ${input.missedDays}
- Recent sessions: ${JSON.stringify(input.recentSessions.slice(0, 5))}
- Average rating: ${input.recentSessions.filter(s => s.rating).reduce((sum, s) => sum + (s.rating || 0), 0) / Math.max(1, input.recentSessions.filter(s => s.rating).length)}

Provide adaptive coaching advice. Should I increase intensity, maintain current level, or take a recovery day?`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "adaptive_recommendation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommendation: { type: "string", enum: ["increase_intensity", "maintain", "recovery_day", "catch_up"] },
                message: { type: "string" },
                tip: { type: "string" },
              },
              required: ["recommendation", "message", "tip"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices?.[0]?.message?.content;
      try {
        return typeof content === "string" ? JSON.parse(content) : content;
      } catch {
        return { recommendation: "maintain", message: "Keep up the great work!", tip: "Stay consistent and trust the process." };
      }
    }),

  /** Get all unique exercise names that have been tracked with weight data */
  getTrackedExercises: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) return [];
      const db = await getDb();
      if (!db) return [];
      const sessions = await db
        .select({ exercisesJson: workoutSessions.exercisesJson })
        .from(workoutSessions)
        .where(eq(workoutSessions.userId, ctx.user.id));

      const exerciseSet = new Set<string>();
      for (const session of sessions) {
        try {
          const exercises = JSON.parse(session.exercisesJson || "[]") as Array<{
            name: string; weight?: number; completed?: boolean;
          }>;
          for (const e of exercises) {
            if (e.completed && e.weight && e.weight > 0 && e.name) {
              exerciseSet.add(e.name);
            }
          }
        } catch { /* skip */ }
      }
      return Array.from(exerciseSet).sort();
    }),

  /** Full AI coaching analysis — sends last 14 days of sessions to LLM */
  getAICoaching: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];

      const sessions = await db
        .select()
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.userId, ctx.user.id),
            gte(workoutSessions.date, fourteenDaysAgo),
            lte(workoutSessions.date, today)
          )
        )
        .orderBy(desc(workoutSessions.createdAt));

      // Build a summary of exercise performance
      const exerciseSummary: Record<string, { dates: string[]; maxWeights: number[]; totalSets: number }> = {};
      let totalSessions = sessions.length;
      let totalCalories = 0;
      let totalDuration = 0;
      let avgRating = 0;
      let ratingCount = 0;

      for (const session of sessions) {
        if (session.caloriesBurned) totalCalories += session.caloriesBurned;
        if (session.durationMin) totalDuration += session.durationMin;
        if (session.rating) { avgRating += session.rating; ratingCount++; }

        try {
          const exercises = JSON.parse(session.exercisesJson || "[]") as Array<{
            name: string; sets: number; reps: number; weight?: number; completed?: boolean;
          }>;
          for (const e of exercises) {
            if (!e.completed) continue;
            if (!exerciseSummary[e.name]) exerciseSummary[e.name] = { dates: [], maxWeights: [], totalSets: 0 };
            exerciseSummary[e.name].dates.push(session.date);
            exerciseSummary[e.name].maxWeights.push(e.weight || 0);
            exerciseSummary[e.name].totalSets += e.sets || 0;
          }
        } catch { /* skip */ }
      }

      const avgRatingFinal = ratingCount > 0 ? (avgRating / ratingCount).toFixed(1) : "N/A";

      // Identify stalled exercises (no weight increase in last 3 sessions)
      const stalledExercises: string[] = [];
      const progressingExercises: string[] = [];
      for (const [name, data] of Object.entries(exerciseSummary)) {
        if (data.maxWeights.length >= 3) {
          const recent = data.maxWeights.slice(-3);
          const isStalled = recent.every(w => w === recent[0]);
          const isProgressing = recent[recent.length - 1] > recent[0];
          if (isStalled && recent[0] > 0) stalledExercises.push(name);
          if (isProgressing) progressingExercises.push(name);
        }
      }

      const prompt = `You are an expert personal trainer AI. Analyze this athlete's last 14 days of workout data and provide personalized coaching advice.

Workout Summary (last 14 days):
- Total sessions completed: ${totalSessions}
- Total calories burned: ${totalCalories}
- Total workout time: ${totalDuration} minutes
- Average session rating: ${avgRatingFinal}/5
- Exercises showing progress (weight increased): ${progressingExercises.slice(0, 5).join(", ") || "None yet"}
- Exercises that may be stalled (no weight change): ${stalledExercises.slice(0, 5).join(", ") || "None"}
- Top tracked exercises: ${Object.keys(exerciseSummary).slice(0, 8).join(", ") || "None logged yet"}

Provide specific, actionable coaching advice covering:
1. Overall assessment of their training consistency and intensity
2. Specific recommendations for stalled exercises (progressive overload tips)
3. Recovery and fatigue management advice based on session frequency
4. One concrete goal for the next 7 days

Be encouraging, specific, and use real numbers from their data.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert personal trainer providing data-driven coaching. Be specific, encouraging, and actionable. Use the athlete's actual data in your advice." },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ai_coaching_report",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallAssessment: { type: "string" },
                intensityRecommendation: { type: "string", enum: ["increase", "maintain", "deload", "recovery"] },
                strengthAdvice: { type: "string" },
                recoveryAdvice: { type: "string" },
                weekGoal: { type: "string" },
                exercisesToSwap: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      current: { type: "string" },
                      suggested: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["current", "suggested", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["overallAssessment", "intensityRecommendation", "strengthAdvice", "recoveryAdvice", "weekGoal", "exercisesToSwap"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content;
      try {
        const parsed = typeof content === "string" ? JSON.parse(content) : content;
        return { ...parsed, sessionCount: totalSessions, stalledExercises, progressingExercises };
      } catch {
        return {
          overallAssessment: "Keep up the great work! Consistency is the key to long-term progress.",
          intensityRecommendation: "maintain" as const,
          strengthAdvice: "Focus on progressive overload — add 5 lbs to your main lifts each week.",
          recoveryAdvice: "Aim for 7-9 hours of sleep and consider a deload week every 4-6 weeks.",
          weekGoal: "Complete all scheduled workouts this week with full focus on form.",
          exercisesToSwap: [],
          sessionCount: totalSessions,
          stalledExercises,
          progressingExercises,
        };
      }
    }),

  /** Get strength progression data for a specific exercise */
  getStrengthProgression: publicProcedure
    .input(z.object({ exerciseName: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) return [];
      const db = await getDb();
      if (!db) return [];
      // Get all sessions and filter exercises client-side (JSON column)
      const sessions = await db
        .select()
        .from(workoutSessions)
        .where(eq(workoutSessions.userId, ctx.user.id))
        .orderBy(workoutSessions.date);

      const progression: Array<{ date: string; maxWeight: number; totalVolume: number }> = [];
      for (const session of sessions) {
        try {
          const exercises = JSON.parse(session.exercisesJson || "[]") as Array<{
            name: string; sets: number; reps: number; weight: number; completed: boolean;
          }>;
          const matching = exercises.filter(
            e => e.name.toLowerCase().includes(input.exerciseName.toLowerCase()) && e.completed
          );
          if (matching.length > 0) {
            const maxWeight = Math.max(...matching.map(e => e.weight || 0));
            const totalVolume = matching.reduce((sum, e) => sum + (e.sets || 0) * (e.reps || 0) * (e.weight || 0), 0);
            progression.push({ date: session.date, maxWeight, totalVolume });
          }
        } catch {
          // skip malformed
        }
      }
      return progression;
    }),

  /** Get the most recent logged weights per exercise for a given workout name */
  getLastWeightsForWorkout: publicProcedure
    .input(z.object({ workoutName: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) return {};
      const db = await getDb();
      if (!db) return {};
      // Fetch the most recent session matching this workout name
      const sessions = await db
        .select({ exercisesJson: workoutSessions.exercisesJson })
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.userId, ctx.user.id),
            eq(workoutSessions.workoutName, input.workoutName)
          )
        )
        .orderBy(desc(workoutSessions.createdAt))
        .limit(1);
      if (sessions.length === 0) return {};
      try {
        const exercises = JSON.parse(sessions[0].exercisesJson || "[]") as Array<{
          name: string;
          loggedSets?: Array<{ reps: number; weight: number; completed: boolean }>;
          weight?: number;
        }>;
        // Build a map: exerciseName -> array of per-set weights from last session
        const result: Record<string, number[]> = {};
        for (const ex of exercises) {
          if (ex.name) {
            if (ex.loggedSets && ex.loggedSets.length > 0) {
              result[ex.name] = ex.loggedSets.map(s => s.weight ?? 0);
            } else if (typeof ex.weight === "number") {
              result[ex.name] = [ex.weight];
            }
          }
        }
        return result;
      } catch {
        return {};
      }
    }),
});
