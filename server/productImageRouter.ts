/**
 * Product Image Suggestion Router
 * Allows authenticated users to suggest images for products that have no image.
 * Images go into a pending queue and require admin approval before being applied.
 */
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { pendingProductImages, cachedProducts } from "../drizzle/schema";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const productImageRouter = router({
  /**
   * Submit a product image suggestion.
   * Accepts a base64-encoded image, uploads it to S3, and creates a pending record.
   * Requires authentication.
   */
  suggestImage: protectedProcedure
    .input(
      z.object({
        barcode: z.string().min(1).max(128),
        productName: z.string().optional(),
        /** Base64-encoded image data (without the data:image/... prefix) */
        imageBase64: z.string().min(1),
        /** MIME type of the image, e.g. "image/jpeg" */
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Check if user already has a pending suggestion for this barcode
      const existing = await db
        .select({ id: pendingProductImages.id })
        .from(pendingProductImages)
        .where(
          and(
            eq(pendingProductImages.barcode, input.barcode),
            eq(pendingProductImages.userId, ctx.user.id),
            eq(pendingProductImages.status, "pending")
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a pending image suggestion for this product.",
        });
      }

      // Decode base64 and upload to S3
      const imageBuffer = Buffer.from(input.imageBase64, "base64");
      const ext = input.mimeType.split("/")[1] || "jpg";
      const key = `product-images/suggestions/${input.barcode}-${ctx.user.id}.${ext}`;

      const { url, key: savedKey } = await storagePut(key, imageBuffer, input.mimeType);

      // Insert pending record
      await db.insert(pendingProductImages).values({
        barcode: input.barcode,
        userId: ctx.user.id,
        imageUrl: url,
        imageKey: savedKey,
        productName: input.productName ?? null,
        status: "pending",
      });

      // Notify owner
      await notifyOwner({
        title: "New Product Image Suggestion",
        content: `User ${ctx.user.name ?? ctx.user.id} submitted an image for barcode ${input.barcode}${input.productName ? ` (${input.productName})` : ""}. Review it in the Admin panel.`,
      }).catch(() => {/* non-critical */});

      return { success: true };
    }),

  /**
   * Get all pending image suggestions (admin only).
   */
  getPendingImages: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rows = await db
        .select()
        .from(pendingProductImages)
        .where(eq(pendingProductImages.status, "pending"))
        .orderBy(desc(pendingProductImages.submittedAt))
        .limit(input.limit);

      return rows;
    }),

  /**
   * Approve a pending image suggestion (admin only).
   * Copies the imageUrl to cachedProducts.imageUrl for the barcode.
   */
  approveImage: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [row] = await db
        .select()
        .from(pendingProductImages)
        .where(eq(pendingProductImages.id, input.id))
        .limit(1);

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Suggestion not found" });

      // Update the cached product's imageUrl
      await db
        .update(cachedProducts)
        .set({ imageUrl: row.imageUrl })
        .where(eq(cachedProducts.barcode, row.barcode));

      // Mark as approved
      await db
        .update(pendingProductImages)
        .set({ status: "approved", reviewedAt: new Date() })
        .where(eq(pendingProductImages.id, input.id));

      return { success: true };
    }),

  /**
   * Reject a pending image suggestion (admin only).
   */
  rejectImage: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(pendingProductImages)
        .set({ status: "rejected", reviewedAt: new Date() })
        .where(eq(pendingProductImages.id, input.id));

      return { success: true };
    }),

  /**
   * Check if the current user already has a pending suggestion for a barcode.
   */
  hasPendingSuggestion: protectedProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { hasPending: false };

      const rows = await db
        .select({ id: pendingProductImages.id })
        .from(pendingProductImages)
        .where(
          and(
            eq(pendingProductImages.barcode, input.barcode),
            eq(pendingProductImages.userId, ctx.user.id),
            eq(pendingProductImages.status, "pending")
          )
        )
        .limit(1);

      return { hasPending: rows.length > 0 };
    }),
});
