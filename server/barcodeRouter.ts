import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { cachedProducts, userSubmittedProducts } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";

/**
 * Barcode scanner router
 * Handles product lookup with database caching, user submissions, admin review,
 * and LLM-powered nutrition extraction.
 */
export const barcodeRouter = router({
  /**
   * Lookup a product by barcode
   * Flow: Check DB cache → Fetch from external API → Save to DB
   */
  lookupByBarcode: publicProcedure
    .input(z.object({ barcode: z.string().min(1) }))
    .query(async ({ input: { barcode } }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const cached = await db.select().from(cachedProducts).where(eq(cachedProducts.barcode, barcode)).limit(1);
      const cachedProduct = cached.length > 0 ? cached[0] : null;

      if (cachedProduct) {
        const rawNutrition = cachedProduct.nutritionFacts ? JSON.parse(cachedProduct.nutritionFacts) : {};
        // Normalize legacy keys (calories, protein, carbs…) to canonical _100g keys
        const normalizeNutriments = (raw: Record<string, unknown>): Record<string, number> => {
          const out: Record<string, number> = {};
          const num = (v: unknown) => (v !== undefined && v !== null && !isNaN(Number(v)) ? Number(v) : undefined);
          for (const [k, v] of Object.entries(raw)) {
            if (k.endsWith("_100g")) { const n = num(v); if (n !== undefined) out[k] = n; }
          }
          const legacyMap: Record<string, string> = {
            calories: "energy-kcal_100g", protein: "proteins_100g", carbs: "carbohydrates_100g",
            fat: "fat_100g", fiber: "fiber_100g", sugar: "sugars_100g",
            sodium: "sodium_100g", calcium: "calcium_100g", iron: "iron_100g", potassium: "potassium_100g",
          };
          for (const [lk, ck] of Object.entries(legacyMap)) {
            if (out[ck] === undefined) { const n = num(raw[lk]); if (n !== undefined) out[ck] = n; }
          }
          return out;
        };
        return {
          found: true,
          source: "database",
          product: {
            barcode: cachedProduct.barcode,
            productName: cachedProduct.productName,
            brand: cachedProduct.brand,
            category: cachedProduct.category,
            imageUrl: cachedProduct.imageUrl,
            ingredients: cachedProduct.ingredients ? JSON.parse(cachedProduct.ingredients) : [],
            nutritionFacts: normalizeNutriments(rawNutrition),
            healthScore: cachedProduct.healthScore,
            harmfulIngredients: cachedProduct.harmfulIngredients ? JSON.parse(cachedProduct.harmfulIngredients) : [],
            aiAnalysis: cachedProduct.aiAnalysis ? JSON.parse(cachedProduct.aiAnalysis) : {},
            // Persisted metadata fields (new columns — may be null for old cache rows)
            servingSize: cachedProduct.servingSize ?? null,
            servingUnit: cachedProduct.servingUnit ?? null,
            allergens: cachedProduct.allergens ? JSON.parse(cachedProduct.allergens) : [],
            labels: cachedProduct.labels ? JSON.parse(cachedProduct.labels) : [],
            additives: cachedProduct.harmfulIngredients ? JSON.parse(cachedProduct.harmfulIngredients) : [],
            novaGroup: cachedProduct.novaGroup ?? null,
            nutriScore: cachedProduct.nutriScore ?? null,
          },
        };
      }

      // Fetch from external API (Open Food Facts)
      try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);

        if (!response.ok || response.status === 404) {
          return {
            found: false,
            source: "not_found",
            product: null,
            message: "Product not found in any database. You can submit the product info.",
          };
        }

        const data = await response.json();

        if (!data.product) {
          return {
            found: false,
            source: "not_found",
            product: null,
            message: "Product data incomplete. You can submit the product info.",
          };
        }

        const product = data.product;

        // Truncate category to prevent DB overflow
        const rawCategory: string = product.categories || "";
        const truncatedCategory = rawCategory.length > 500 ? rawCategory.substring(0, 500) : rawCategory;

        // Build canonical nutriments map from Open Food Facts data
        // ProductResult expects keys in the form "energy-kcal_100g", "proteins_100g", etc.
        const n = product.nutriments || {};
        const canonicalNutriments: Record<string, number> = {};
        const addIfDefined = (key: string, val: unknown) => {
          if (val !== undefined && val !== null && !isNaN(Number(val))) {
            canonicalNutriments[key] = Number(val);
          }
        };
        // Macros
        addIfDefined("energy-kcal_100g", n["energy-kcal_100g"] ?? n["energy-kcal"]);
        addIfDefined("proteins_100g", n["proteins_100g"] ?? n["proteins"]);
        addIfDefined("fat_100g", n["fat_100g"] ?? n["fat"]);
        addIfDefined("saturated-fat_100g", n["saturated-fat_100g"] ?? n["saturated-fat"]);
        addIfDefined("monounsaturated-fat_100g", n["monounsaturated-fat_100g"] ?? n["monounsaturated-fat"]);
        addIfDefined("polyunsaturated-fat_100g", n["polyunsaturated-fat_100g"] ?? n["polyunsaturated-fat"]);
        addIfDefined("trans-fat_100g", n["trans-fat_100g"] ?? n["trans-fat"]);
        addIfDefined("cholesterol_100g", n["cholesterol_100g"] ?? n["cholesterol"]);
        addIfDefined("carbohydrates_100g", n["carbohydrates_100g"] ?? n["carbohydrates"]);
        addIfDefined("sugars_100g", n["sugars_100g"] ?? n["sugars"]);
        addIfDefined("added-sugars_100g", n["added-sugars_100g"] ?? n["added-sugars"]);
        addIfDefined("fiber_100g", n["fiber_100g"] ?? n["fiber"]);
        addIfDefined("sodium_100g", n["sodium_100g"] ?? n["sodium"]);
        addIfDefined("salt_100g", n["salt_100g"] ?? n["salt"]);
        // Minerals
        addIfDefined("calcium_100g", n["calcium_100g"] ?? n["calcium"]);
        addIfDefined("iron_100g", n["iron_100g"] ?? n["iron"]);
        addIfDefined("magnesium_100g", n["magnesium_100g"] ?? n["magnesium"]);
        addIfDefined("phosphorus_100g", n["phosphorus_100g"] ?? n["phosphorus"]);
        addIfDefined("potassium_100g", n["potassium_100g"] ?? n["potassium"]);
        addIfDefined("zinc_100g", n["zinc_100g"] ?? n["zinc"]);
        addIfDefined("selenium_100g", n["selenium_100g"] ?? n["selenium"]);
        // Vitamins
        addIfDefined("vitamin-a_100g", n["vitamin-a_100g"] ?? n["vitamin-a"]);
        addIfDefined("vitamin-c_100g", n["vitamin-c_100g"] ?? n["vitamin-c"]);
        addIfDefined("vitamin-d_100g", n["vitamin-d_100g"] ?? n["vitamin-d"]);
        addIfDefined("vitamin-b12_100g", n["vitamin-b12_100g"] ?? n["vitamin-b12"]);
        addIfDefined("vitamin-b6_100g", n["vitamin-b6_100g"] ?? n["vitamin-b6"]);
        addIfDefined("folate_100g", n["folate_100g"] ?? n["folate"]);
        addIfDefined("vitamin-e_100g", n["vitamin-e_100g"] ?? n["vitamin-e"]);
        addIfDefined("vitamin-k_100g", n["vitamin-k_100g"] ?? n["vitamin-k"]);

        // Serving size
        const servingSize = product.serving_size || product.serving_quantity || null;
        const servingUnit = product.serving_size_unit || null;

        // Allergens
        const allergens: string[] = product.allergens_tags
          ? product.allergens_tags.map((a: string) => a.replace("en:", ""))
          : [];

        // Labels / certifications
        const labels: string[] = product.labels_tags
          ? product.labels_tags.map((l: string) => l.replace("en:", ""))
          : [];

        // Additives
        const additives: string[] = product.additives_tags
          ? product.additives_tags.map((a: string) => a.replace("en:", ""))
          : [];

        // NOVA & Nutriscore
        const novaGroup: number | null = product.nova_group ? Number(product.nova_group) : null;
        const nutriScore: string | null = product.nutriscore_grade ? product.nutriscore_grade.toUpperCase() : null;

        // Full product payload (stored in DB and returned to client)
        const fullProductPayload = {
          barcode,
          productName: product.product_name || null,
          brand: product.brands || null,
          category: truncatedCategory || null,
          imageUrl: product.image_url || null,
          ingredients: product.ingredients_text ? [product.ingredients_text] : [],
          nutritionFacts: canonicalNutriments,
          servingSize,
          servingUnit,
          allergens,
          labels,
          additives,
          novaGroup,
          nutriScore,
          healthScore: Math.round((product.nutriscore_score || 0) * 10) || 50,
          harmfulIngredients: additives,
          aiAnalysis: {
            summary: "Product from Open Food Facts API",
            warnings: [],
          },
        };

        const cachedData = {
          barcode,
          productName: fullProductPayload.productName,
          brand: fullProductPayload.brand,
          category: fullProductPayload.category,
          imageUrl: fullProductPayload.imageUrl,
          ingredients: JSON.stringify(fullProductPayload.ingredients),
          nutritionFacts: JSON.stringify(fullProductPayload.nutritionFacts),
          healthScore: fullProductPayload.healthScore,
          harmfulIngredients: JSON.stringify(fullProductPayload.harmfulIngredients),
          aiAnalysis: JSON.stringify(fullProductPayload.aiAnalysis),
          source: "external_api",
          // New metadata columns
          allergens: JSON.stringify(fullProductPayload.allergens),
          labels: JSON.stringify(fullProductPayload.labels),
          novaGroup: fullProductPayload.novaGroup,
          nutriScore: fullProductPayload.nutriScore,
          servingSize: fullProductPayload.servingSize ? String(fullProductPayload.servingSize) : null,
          servingUnit: fullProductPayload.servingUnit ?? null,
        };

        await db.insert(cachedProducts).values(cachedData).catch((err) => {
          console.warn("Duplicate barcode insert (race condition):", err);
        });

        return {
          found: true,
          source: "external_api",
          product: fullProductPayload,
        };
      } catch (error) {
        console.error("Error fetching from external API:", error);
        return {
          found: false,
          source: "api_error",
          product: null,
          message: "Error fetching product data. Please try again.",
        };
      }
    }),

  /**
   * Submit product info for a barcode that has no data
   */
  submitProductInfo: protectedProcedure
    .input(
      z.object({
        barcode: z.string().min(1),
        productName: z.string().optional(),
        brand: z.string().optional(),
        category: z.string().optional(),
        imageUrl: z.string().url().optional(),
        ingredients: z.array(z.string()).optional(),
        nutritionFacts: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input: { barcode, productName, brand, category, imageUrl, ingredients, nutritionFacts }, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const existingResult = await db.select().from(cachedProducts).where(eq(cachedProducts.barcode, barcode)).limit(1);
      if (existingResult.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Product already exists in database" });
      }

      await db.insert(userSubmittedProducts).values({
        barcode,
        productName: productName || null,
        brand: brand || null,
        category: category || null,
        imageUrl: imageUrl || null,
        ingredients: ingredients ? JSON.stringify(ingredients) : null,
        nutritionFacts: nutritionFacts ? JSON.stringify(nutritionFacts) : null,
        status: "pending",
        submittedBy: ctx.user.id,
      });

      return { success: true, message: "Thank you! Your product info has been submitted for review." };
    }),

  /**
   * Get user's own submitted products
   */
  getUserSubmissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const submissions = await db.select().from(userSubmittedProducts).where(eq(userSubmittedProducts.submittedBy, ctx.user.id));

    return submissions.map((s) => ({
      ...s,
      ingredients: s.ingredients ? JSON.parse(s.ingredients) : [],
      nutritionFacts: s.nutritionFacts ? JSON.parse(s.nutritionFacts) : {},
    }));
  }),

  /**
   * Admin: Get submissions, optionally filtered by status (defaults to pending)
   */
  getPendingSubmissions: adminProcedure
    .input(z.object({ status: z.enum(["pending", "approved", "rejected", "all"]).default("pending") }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const statusFilter = input?.status ?? "pending";

      const allRows = await db
        .select()
        .from(userSubmittedProducts)
        .orderBy(userSubmittedProducts.createdAt);

      const rows = statusFilter === "all"
        ? allRows
        : allRows.filter((s) => s.status === statusFilter);

      return rows.map((s) => ({
        ...s,
        ingredients: s.ingredients ? JSON.parse(s.ingredients) : [],
        nutritionFacts: s.nutritionFacts ? JSON.parse(s.nutritionFacts) : {},
      }));
    }),

  /**
   * Admin: Approve a single submission
   */
  approveSubmission: adminProcedure
    .input(z.object({ submissionId: z.number() }))
    .mutation(async ({ input: { submissionId } }) => {

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const submissionResult = await db.select().from(userSubmittedProducts).where(eq(userSubmittedProducts.id, submissionId)).limit(1);
      const submission = submissionResult[0];

      if (!submission) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });

      await db.insert(cachedProducts).values({
        barcode: submission.barcode,
        productName: submission.productName,
        brand: submission.brand,
        category: submission.category,
        imageUrl: submission.imageUrl,
        ingredients: submission.ingredients,
        nutritionFacts: submission.nutritionFacts,
        healthScore: 50,
        harmfulIngredients: JSON.stringify([]),
        aiAnalysis: JSON.stringify({ summary: "Product submitted by user", warnings: [] }),
        source: "user_submitted",
      }).catch(() => {
        // Product may already exist — still mark as approved
      });

      await db.update(userSubmittedProducts).set({ status: "approved" as const }).where(eq(userSubmittedProducts.id, submissionId));

      return { success: true, message: "Submission approved and added to database" };
    }),

  /**
   * Admin: Reject a single submission
   */
  rejectSubmission: adminProcedure
    .input(z.object({ submissionId: z.number(), notes: z.string().optional() }))
    .mutation(async ({ input: { submissionId, notes } }) => {

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(userSubmittedProducts).set({ status: "rejected" as const, notes: notes || null }).where(eq(userSubmittedProducts.id, submissionId));

      return { success: true, message: "Submission rejected" };
    }),

  /**
   * Admin: Bulk approve multiple submissions
   */
  bulkApprove: adminProcedure
    .input(z.object({ submissionIds: z.array(z.number()).min(1) }))
    .mutation(async ({ input: { submissionIds } }) => {

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const submissions = await db.select().from(userSubmittedProducts).where(inArray(userSubmittedProducts.id, submissionIds));

      // Insert all into cachedProducts (ignore duplicates)
      for (const submission of submissions) {
        await db.insert(cachedProducts).values({
          barcode: submission.barcode,
          productName: submission.productName,
          brand: submission.brand,
          category: submission.category,
          imageUrl: submission.imageUrl,
          ingredients: submission.ingredients,
          nutritionFacts: submission.nutritionFacts,
          healthScore: 50,
          harmfulIngredients: JSON.stringify([]),
          aiAnalysis: JSON.stringify({ summary: "Product submitted by user", warnings: [] }),
          source: "user_submitted",
        }).catch(() => {});
      }

      await db.update(userSubmittedProducts).set({ status: "approved" as const }).where(inArray(userSubmittedProducts.id, submissionIds));

      return { success: true, approved: submissions.length };
    }),

  /**
   * Admin: Bulk reject multiple submissions
   */
  bulkReject: adminProcedure
    .input(z.object({ submissionIds: z.array(z.number()).min(1), notes: z.string().optional() }))
    .mutation(async ({ input: { submissionIds, notes } }) => {

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(userSubmittedProducts)
        .set({ status: "rejected" as const, notes: notes || null })
        .where(inArray(userSubmittedProducts.id, submissionIds));

      return { success: true, rejected: submissionIds.length };
    }),

  /**
   * LLM-powered nutrition extraction from ingredient list
   * Estimates calories, protein, carbs, fat, and fiber from raw ingredients text
   */
  extractNutrition: protectedProcedure
    .input(
      z.object({
        ingredients: z.string().min(3),
        productName: z.string().optional(),
        servingSize: z.string().optional(),
      })
    )
    .mutation(async ({ input: { ingredients, productName, servingSize } }) => {
      const systemPrompt = `You are a nutrition expert and food scientist. Given a list of ingredients, estimate the nutrition facts per serving. Be conservative and realistic. Return only valid JSON.`;

      const userPrompt = `Product: ${productName || "Unknown product"}
Serving size: ${servingSize || "1 serving (approx 100g)"}
Ingredients: ${ingredients}

Estimate the nutrition facts per serving. Consider typical proportions of each ingredient.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "nutrition_estimate",
            strict: true,
            schema: {
              type: "object",
              properties: {
                calories: { type: "number", description: "Estimated calories per serving (kcal)" },
                protein: { type: "number", description: "Estimated protein per serving (grams)" },
                carbs: { type: "number", description: "Estimated total carbohydrates per serving (grams)" },
                fat: { type: "number", description: "Estimated total fat per serving (grams)" },
                fiber: { type: "number", description: "Estimated dietary fiber per serving (grams)" },
                sugar: { type: "number", description: "Estimated sugars per serving (grams)" },
                sodium: { type: "number", description: "Estimated sodium per serving (mg)" },
                confidence: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                  description: "Confidence level of the estimate based on ingredient detail"
                },
                notes: { type: "string", description: "Brief note about the estimate or any caveats" },
              },
              required: ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "confidence", "notes"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "LLM did not return nutrition data" });
      }

      const parsed = typeof content === "string" ? JSON.parse(content) : content;

      return {
        success: true,
        nutrition: {
          calories: parsed.calories as number,
          protein: parsed.protein as number,
          carbs: parsed.carbs as number,
          fat: parsed.fat as number,
          fiber: parsed.fiber as number,
          sugar: parsed.sugar as number,
          sodium: parsed.sodium as number,
        },
        confidence: parsed.confidence as "high" | "medium" | "low",
        notes: parsed.notes as string,
      };
    }),

  /**
   * Admin: Backfill metadata for cached rows where allergens IS NULL
   * Re-fetches Open Food Facts for each row and updates the new metadata columns.
   * Returns a progress summary.
   */
  backfillMetadata: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }))
    .mutation(async ({ input: { limit } }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Find rows missing allergens (proxy for missing metadata)
      const rows = await db
        .select({ id: cachedProducts.id, barcode: cachedProducts.barcode })
        .from(cachedProducts)
        .where(eq(cachedProducts.allergens, null as unknown as string))
        .limit(limit);

      if (rows.length === 0) return { success: true, updated: 0, failed: 0, remaining: 0 };

      let updated = 0;
      let failed = 0;

      for (const row of rows) {
        try {
          const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${row.barcode}.json`);
          if (!res.ok) { failed++; continue; }
          const data = await res.json();
          const p = data?.product;
          if (!p) { failed++; continue; }

          const n = p.nutriments || {};
          const addN = (key: string, val: unknown) => {
            if (val !== undefined && val !== null && !isNaN(Number(val))) return Number(val);
            return undefined;
          };
          const canonicalNutriments: Record<string, number> = {};
          const pairs: [string, unknown][] = [
            ["energy-kcal_100g", n["energy-kcal_100g"] ?? n["energy-kcal"]],
            ["proteins_100g", n["proteins_100g"] ?? n["proteins"]],
            ["fat_100g", n["fat_100g"] ?? n["fat"]],
            ["saturated-fat_100g", n["saturated-fat_100g"] ?? n["saturated-fat"]],
            ["carbohydrates_100g", n["carbohydrates_100g"] ?? n["carbohydrates"]],
            ["sugars_100g", n["sugars_100g"] ?? n["sugars"]],
            ["fiber_100g", n["fiber_100g"] ?? n["fiber"]],
            ["sodium_100g", n["sodium_100g"] ?? n["sodium"]],
            ["calcium_100g", n["calcium_100g"] ?? n["calcium"]],
            ["iron_100g", n["iron_100g"] ?? n["iron"]],
            ["potassium_100g", n["potassium_100g"] ?? n["potassium"]],
            ["vitamin-c_100g", n["vitamin-c_100g"] ?? n["vitamin-c"]],
            ["vitamin-d_100g", n["vitamin-d_100g"] ?? n["vitamin-d"]],
          ];
          for (const [k, v] of pairs) {
            const num = addN(k, v);
            if (num !== undefined) canonicalNutriments[k] = num;
          }

          const allergens: string[] = (p.allergens_tags || []).map((a: string) => a.replace("en:", ""));
          const labels: string[] = (p.labels_tags || []).map((l: string) => l.replace("en:", ""));
          const novaGroup: number | null = p.nova_group ? Number(p.nova_group) : null;
          const nutriScore: string | null = p.nutriscore_grade ? p.nutriscore_grade.toUpperCase() : null;
          const servingSize = p.serving_size || p.serving_quantity || null;
          const servingUnit = p.serving_size_unit || null;

          await db.update(cachedProducts).set({
            nutritionFacts: JSON.stringify(canonicalNutriments),
            allergens: JSON.stringify(allergens),
            labels: JSON.stringify(labels),
            novaGroup,
            nutriScore,
            servingSize: servingSize ? String(servingSize) : null,
            servingUnit: servingUnit ?? null,
          }).where(eq(cachedProducts.id, row.id));

          updated++;
          // Small delay to avoid rate-limiting Open Food Facts
          await new Promise(r => setTimeout(r, 150));
        } catch {
          failed++;
        }
      }

      // Count remaining rows still needing backfill
      const remaining = await db
        .select({ id: cachedProducts.id })
        .from(cachedProducts)
        .where(eq(cachedProducts.allergens, null as unknown as string));

      return { success: true, updated, failed, remaining: remaining.length };
    }),
});
