/**
 * User Features Router
 * Handles server-side scan history, product favorites, and avoided ingredients.
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { scanHistory, productFavorites, avoidedIngredients } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const MAX_SCAN_HISTORY = 200;

export const userFeaturesRouter = router({
  // ─── SCAN HISTORY ──────────────────────────────────────────────────────────

  /** Record a product scan (called from ProductResult on mount) */
  addScan: protectedProcedure
    .input(z.object({
      barcode: z.string().optional(),
      productName: z.string(),
      brand: z.string().optional(),
      imageUrl: z.string().optional(),
      healthScore: z.number().int().min(0).max(100),
      grade: z.string().max(2),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Insert the scan record
      await db.insert(scanHistory).values({
        userId: ctx.user.id,
        barcode: input.barcode,
        productName: input.productName,
        brand: input.brand,
        imageUrl: input.imageUrl,
        healthScore: input.healthScore,
        grade: input.grade,
        category: input.category,
      });
      // Trim to MAX_SCAN_HISTORY: delete oldest records beyond the cap
      const allScans = await db
        .select({ id: scanHistory.id })
        .from(scanHistory)
        .where(eq(scanHistory.userId, ctx.user.id))
        .orderBy(desc(scanHistory.scannedAt));
      if (allScans.length > MAX_SCAN_HISTORY) {
        const toDelete = allScans.slice(MAX_SCAN_HISTORY).map(s => s.id);
        for (const id of toDelete) {
          await db.delete(scanHistory).where(
            and(eq(scanHistory.id, id), eq(scanHistory.userId, ctx.user.id))
          );
        }
      }
      return { success: true };
    }),

  /** Get the user's scan history (most recent first) */
  getScanHistory: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const records = await db
        .select()
        .from(scanHistory)
        .where(eq(scanHistory.userId, ctx.user.id))
        .orderBy(desc(scanHistory.scannedAt))
        .limit(input.limit);
      return records;
    }),

  /** Delete a single scan record */
  deleteScan: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(scanHistory).where(
        and(eq(scanHistory.id, input.id), eq(scanHistory.userId, ctx.user.id))
      );
      return { success: true };
    }),

  /** Clear all scan history for the user */
  clearScanHistory: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(scanHistory).where(eq(scanHistory.userId, ctx.user.id));
      return { success: true };
    }),

  // ─── FAVORITES ─────────────────────────────────────────────────────────────

  /** Add a product to favorites */
  addFavorite: protectedProcedure
    .input(z.object({
      barcode: z.string().optional(),
      productName: z.string(),
      brand: z.string().optional(),
      imageUrl: z.string().optional(),
      healthScore: z.number().int().min(0).max(100),
      grade: z.string().max(2),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Upsert: if barcode exists for this user, update; otherwise insert
      if (input.barcode) {
        const existing = await db
          .select({ id: productFavorites.id })
          .from(productFavorites)
          .where(and(
            eq(productFavorites.userId, ctx.user.id),
            eq(productFavorites.barcode, input.barcode)
          ))
          .limit(1);
        if (existing.length > 0) {
          return { success: true, alreadySaved: true };
        }
      }
      await db.insert(productFavorites).values({
        userId: ctx.user.id,
        barcode: input.barcode,
        productName: input.productName,
        brand: input.brand,
        imageUrl: input.imageUrl,
        healthScore: input.healthScore,
        grade: input.grade,
        category: input.category,
      });
      return { success: true, alreadySaved: false };
    }),

  /** Remove a product from favorites by barcode */
  removeFavorite: protectedProcedure
    .input(z.object({ barcode: z.string().optional(), id: z.number().int().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      if (input.id) {
        await db.delete(productFavorites).where(
          and(eq(productFavorites.id, input.id), eq(productFavorites.userId, ctx.user.id))
        );
      } else if (input.barcode) {
        await db.delete(productFavorites).where(
          and(eq(productFavorites.barcode, input.barcode), eq(productFavorites.userId, ctx.user.id))
        );
      }
      return { success: true };
    }),

  /** Get all favorites for the user */
  getFavorites: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      return db
        .select()
        .from(productFavorites)
        .where(eq(productFavorites.userId, ctx.user.id))
        .orderBy(desc(productFavorites.savedAt));
    }),

  /** Check if a product is favorited (by barcode) */
  isFavorite: protectedProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db
        .select({ id: productFavorites.id })
        .from(productFavorites)
        .where(and(
          eq(productFavorites.userId, ctx.user.id),
          eq(productFavorites.barcode, input.barcode)
        ))
        .limit(1);
      return { isFavorite: result.length > 0 };
    }),

  // ─── AVOIDED INGREDIENTS ───────────────────────────────────────────────────

  /** Add an ingredient to the avoided list */
  addAvoidedIngredient: protectedProcedure
    .input(z.object({
      ingredient: z.string().min(1).max(255),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Check for duplicate
      const existing = await db
        .select({ id: avoidedIngredients.id })
        .from(avoidedIngredients)
        .where(and(
          eq(avoidedIngredients.userId, ctx.user.id),
          eq(avoidedIngredients.ingredient, input.ingredient.toLowerCase().trim())
        ))
        .limit(1);
      if (existing.length > 0) {
        return { success: true, alreadyAdded: true };
      }
      await db.insert(avoidedIngredients).values({
        userId: ctx.user.id,
        ingredient: input.ingredient.toLowerCase().trim(),
        reason: input.reason,
      });
      return { success: true, alreadyAdded: false };
    }),

  /** Remove an avoided ingredient */
  removeAvoidedIngredient: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(avoidedIngredients).where(
        and(eq(avoidedIngredients.id, input.id), eq(avoidedIngredients.userId, ctx.user.id))
      );
      return { success: true };
    }),

  /** Get all avoided ingredients for the user */
  getAvoidedIngredients: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      return db
        .select()
        .from(avoidedIngredients)
        .where(eq(avoidedIngredients.userId, ctx.user.id))
        .orderBy(desc(avoidedIngredients.createdAt));
    }),
});
