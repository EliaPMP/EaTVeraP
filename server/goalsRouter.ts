import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { nutritionGoals } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Nutrition Goals router
 * Lets authenticated users set, update, and delete personal daily nutrient targets.
 * Goals are stored per-user in the nutritionGoals table.
 */
export const goalsRouter = router({
  /**
   * Get all goals for the current user
   */
  getGoals: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    const db = await getDb();
    if (!db) return [];

    const goals = await db
      .select()
      .from(nutritionGoals)
      .where(eq(nutritionGoals.userId, ctx.user.id));

    return goals;
  }),

  /**
   * Set (upsert) a goal for a specific nutrient.
   * If a goal for this nutrientKey already exists, it will be updated.
   */
  setGoal: protectedProcedure
    .input(
      z.object({
        nutrientKey: z.string().min(1).max(64),
        nutrientLabel: z.string().min(1).max(128),
        targetType: z.enum(["min", "max"]),
        targetValue: z.number().int().min(0).max(100000),
        unit: z.string().min(1).max(16).default("g"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if goal already exists for this user + nutrientKey
      const existing = await db
        .select({ id: nutritionGoals.id })
        .from(nutritionGoals)
        .where(
          and(
            eq(nutritionGoals.userId, ctx.user.id),
            eq(nutritionGoals.nutrientKey, input.nutrientKey)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(nutritionGoals)
          .set({
            nutrientLabel: input.nutrientLabel,
            targetType: input.targetType,
            targetValue: input.targetValue,
            unit: input.unit,
          })
          .where(eq(nutritionGoals.id, existing[0].id));
        return { success: true, action: "updated" as const };
      }

      await db.insert(nutritionGoals).values({
        userId: ctx.user.id,
        nutrientKey: input.nutrientKey,
        nutrientLabel: input.nutrientLabel,
        targetType: input.targetType,
        targetValue: input.targetValue,
        unit: input.unit,
      });

      return { success: true, action: "created" as const };
    }),

  /**
   * Delete a single goal by ID (must belong to the current user)
   */
  deleteGoal: protectedProcedure
    .input(z.object({ goalId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .delete(nutritionGoals)
        .where(
          and(
            eq(nutritionGoals.id, input.goalId),
            eq(nutritionGoals.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Clear all goals for the current user
   */
  clearGoals: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    await db.delete(nutritionGoals).where(eq(nutritionGoals.userId, ctx.user.id));

    return { success: true };
  }),
});
