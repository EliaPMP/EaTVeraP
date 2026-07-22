import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { ingredientScanCache } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface IngredientFlag {
  name: string;
  category: "seed_oil" | "artificial_color" | "preservative" | "sweetener" | "msg" | "carrageenan" | "hfcs" | "other";
  severity: "high" | "moderate" | "low";
  reason: string;
}

export interface IngredientAnalysis {
  ingredientsDetected: boolean;
  rawIngredientText: string;
  flags: IngredientFlag[];
  ingredientQuality: "good" | "moderate" | "poor" | "unknown";
  imageQualityOk: boolean;
  retakePrompt?: string; // set when imageQualityOk is false
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 64);
}

// ─── Ingredient analysis via LLM vision ──────────────────────────────────────
async function analyzeIngredientLabel(imageUrl: string): Promise<IngredientAnalysis> {
  const db = await getDb();
  const urlHash = hashUrl(imageUrl);

  // Check cache first
  const cached = db ? await db
    .select()
    .from(ingredientScanCache)
    .where(eq(ingredientScanCache.imageUrlHash, urlHash))
    .limit(1) : [];

  if (cached.length > 0) {
    const row = cached[0];
    return {
      ingredientsDetected: row.ingredientsDetected === 1,
      rawIngredientText: row.rawIngredientText ?? "",
      flags: row.flaggedIngredients ? JSON.parse(row.flaggedIngredients) : [],
      ingredientQuality: row.ingredientQuality,
      imageQualityOk: row.imageQualityOk === 1,
      retakePrompt: row.imageQualityOk === 0
        ? "Image quality is too low to read the ingredient label. Please retake the photo with better lighting and hold the camera steady."
        : undefined,
    };
  }

  const systemPrompt = `You are an expert food safety analyst specializing in ingredient label analysis.
Your job is to:
1. Detect if an ingredient label is visible in the image using OCR
2. Extract the raw ingredient text if visible
3. Identify and flag harmful or controversial additives
4. Assess overall ingredient quality

FLAGGED INGREDIENT CATEGORIES (detect any of these):
- seed_oil: canola oil, corn oil, cottonseed oil, soybean oil, sunflower oil, safflower oil, grapeseed oil, rice bran oil, vegetable oil (unspecified), partially hydrogenated oils
- artificial_color: Red 40, Red 3, Yellow 5, Yellow 6, Blue 1, Blue 2, Green 3, any FD&C colors, caramel color (class III or IV)
- preservative: sodium benzoate, potassium sorbate, BHA, BHT, TBHQ, sodium nitrate, sodium nitrite, sulfites, propyl gallate
- sweetener: aspartame, sucralose, saccharin, acesulfame potassium (Ace-K), neotame, advantame, stevia (note as low concern)
- msg: monosodium glutamate, MSG, yeast extract, autolyzed yeast, hydrolyzed protein
- carrageenan: carrageenan, Irish moss extract
- hfcs: high fructose corn syrup, HFCS, corn syrup solids (note if high on ingredient list)
- other: titanium dioxide, carboxymethylcellulose (CMC), polysorbate 80, maltodextrin (if first 3 ingredients), brominated vegetable oil, propylene glycol

SEVERITY LEVELS:
- high: well-documented health concerns (seed oils, artificial colors, HFCS, BHA/BHT/TBHQ, sodium nitrate)
- moderate: some evidence of concern (MSG, carrageenan, most preservatives, artificial sweeteners)
- low: minor or context-dependent concern (stevia, maltodextrin in small amounts)

IMPORTANT: Do NOT make medical claims. Use informational language like "associated with", "some studies suggest", "may cause in sensitive individuals".
If the image is blurry, too dark, or the ingredient label is not readable, set imageQualityOk to false.
If the image shows a meal/food (not a packaged product label), set ingredientsDetected to false.`;

  const userPrompt = `Analyze this image for ingredient label content.

Return ONLY a JSON object with this exact structure:
{
  "ingredientsDetected": boolean (true if an ingredient label text is visible and readable),
  "imageQualityOk": boolean (false if image is too blurry/dark to read labels),
  "rawIngredientText": string (the OCR-extracted ingredient text, or "" if not detected),
  "flags": [
    {
      "name": string (exact ingredient name as it appears),
      "category": "seed_oil" | "artificial_color" | "preservative" | "sweetener" | "msg" | "carrageenan" | "hfcs" | "other",
      "severity": "high" | "moderate" | "low",
      "reason": string (brief informational explanation, no medical claims, max 80 chars)
    }
  ],
  "ingredientQuality": "good" | "moderate" | "poor" | "unknown"
}

ingredientQuality guide:
- "good": no flags or only low-severity flags, short ingredient list, recognizable whole food ingredients
- "moderate": 1-2 moderate flags or preservatives, some processed ingredients
- "poor": any high-severity flags (seed oils, artificial colors, HFCS), or 3+ moderate flags
- "unknown": ingredient label not visible or image is a meal photo`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "high" },
          },
          { type: "text", text: userPrompt },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ingredient_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            ingredientsDetected: { type: "boolean" },
            imageQualityOk: { type: "boolean" },
            rawIngredientText: { type: "string" },
            flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: {
                    type: "string",
                    enum: ["seed_oil", "artificial_color", "preservative", "sweetener", "msg", "carrageenan", "hfcs", "other"],
                  },
                  severity: { type: "string", enum: ["high", "moderate", "low"] },
                  reason: { type: "string" },
                },
                required: ["name", "category", "severity", "reason"],
                additionalProperties: false,
              },
            },
            ingredientQuality: {
              type: "string",
              enum: ["good", "moderate", "poor", "unknown"],
            },
          },
          required: ["ingredientsDetected", "imageQualityOk", "rawIngredientText", "flags", "ingredientQuality"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from ingredient analysis model");

  let parsed: IngredientAnalysis;
  try {
    parsed = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    throw new Error("Failed to parse ingredient analysis response");
  }

  // Persist to cache
  try {
    if (!db) throw new Error('no db');
    await db.insert(ingredientScanCache).values({
      imageUrlHash: urlHash,
      imageUrl,
      ingredientsDetected: parsed.ingredientsDetected ? 1 : 0,
      rawIngredientText: parsed.rawIngredientText || null,
      flaggedIngredients: JSON.stringify(parsed.flags),
      ingredientQuality: parsed.ingredientQuality,
      imageQualityOk: parsed.imageQualityOk ? 1 : 0,
    });
  } catch {
    // Cache insert failure is non-fatal
  }

  return {
    ...parsed,
    retakePrompt: !parsed.imageQualityOk
      ? "Image quality is too low to read the ingredient label. Please retake the photo with better lighting and hold the camera steady."
      : undefined,
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const calorieRouter = router({
  /**
   * Analyze a food photo using AI vision.
   * Returns calorie + macro breakdown AND ingredient label analysis (if visible).
   * Both analyses run in parallel for speed.
   */
  analyzePhoto: publicProcedure
    .input(
      z.object({
        imageDataUrl: z.string().min(10), // base64 data URL
        mealContext: z.string().optional(), // optional user hint e.g. "large portion"
      })
    )
    .mutation(async ({ input }) => {
      const { imageDataUrl, mealContext } = input;

      // Upload image to S3 once — reuse URL for both analyses
      let imageUrl: string;
      try {
        const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
        const mimeMatch = imageDataUrl.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const buffer = Buffer.from(base64Data, "base64");
        const result = await storagePut(
          `calorie-scans/meal-${Date.now()}.jpg`,
          buffer,
          mimeType
        );
        imageUrl = result.url;
      } catch {
        imageUrl = imageDataUrl;
      }

      const systemPrompt = `You are a professional nutritionist and food recognition AI. 
Your job is to analyze food photos and provide accurate calorie and macro estimates.
Be specific about what you see, estimate portion sizes based on visual cues (plate size, utensils, etc.), 
and provide realistic nutritional data. Always respond in the exact JSON format requested.
If you cannot identify the food clearly, make your best educated guess and note the uncertainty.`;

      const userPrompt = `Analyze this food photo and provide a detailed nutritional breakdown.
${mealContext ? `User context: "${mealContext}"` : ""}

Return ONLY a JSON object with this exact structure:
{
  "mealName": "Brief descriptive name of the meal",
  "confidence": "high" | "medium" | "low",
  "totalCalories": number,
  "servingDescription": "e.g., 1 plate, 2 slices, 1 bowl",
  "macros": {
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams),
    "fiber": number (grams),
    "sugar": number (grams)
  },
  "items": [
    {
      "name": "Food item name",
      "estimatedAmount": "e.g., 150g, 1 cup, 2 slices",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ],
  "qualityScore": number (1-100, based on ingredient quality, processing level, nutrient density),
  "qualityNotes": ["Brief note about food quality"],
  "healthTip": "One actionable tip about this meal",
  "warnings": ["Any concerns like seed oils, high sugar, ultra-processed ingredients"]
}`;

      // Run calorie analysis and ingredient analysis in parallel
      const [calorieResponse, ingredientAnalysis] = await Promise.allSettled([
        invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
                { type: "text", text: userPrompt },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "meal_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  mealName: { type: "string" },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                  totalCalories: { type: "number" },
                  servingDescription: { type: "string" },
                  macros: {
                    type: "object",
                    properties: {
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" },
                      fiber: { type: "number" },
                      sugar: { type: "number" },
                    },
                    required: ["protein", "carbs", "fat", "fiber", "sugar"],
                    additionalProperties: false,
                  },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        estimatedAmount: { type: "string" },
                        calories: { type: "number" },
                        protein: { type: "number" },
                        carbs: { type: "number" },
                        fat: { type: "number" },
                      },
                      required: ["name", "estimatedAmount", "calories", "protein", "carbs", "fat"],
                      additionalProperties: false,
                    },
                  },
                  qualityScore: { type: "number" },
                  qualityNotes: { type: "array", items: { type: "string" } },
                  healthTip: { type: "string" },
                  warnings: { type: "array", items: { type: "string" } },
                },
                required: [
                  "mealName", "confidence", "totalCalories", "servingDescription",
                  "macros", "items", "qualityScore", "qualityNotes", "healthTip", "warnings",
                ],
                additionalProperties: false,
              },
            },
          },
        }),
        analyzeIngredientLabel(imageUrl),
      ]);

      // Parse calorie analysis (required)
      if (calorieResponse.status === "rejected") {
        throw new Error("Calorie analysis failed. Please try again with a clearer photo.");
      }
      const content = calorieResponse.value.choices[0]?.message?.content;
      if (!content) throw new Error("No response from AI vision model");
      let parsedCalorie: any;
      try {
        parsedCalorie = typeof content === "string" ? JSON.parse(content) : content;
      } catch {
        throw new Error("Failed to parse AI response as JSON");
      }

      // Ingredient analysis is optional — don't fail if it errors
      const parsedIngredients: IngredientAnalysis | null =
        ingredientAnalysis.status === "fulfilled" ? ingredientAnalysis.value : null;

      return {
        success: true,
        imageUrl,
        analysis: parsedCalorie,
        ingredientAnalysis: parsedIngredients,
        analyzedAt: new Date().toISOString(),
      };
    }),

  // ── Weekly report tip ──────────────────────────────────────────────────
  weeklyTip: publicProcedure
    .input(
      z.object({
        avgQualityScore: z.number(),
        totalCalories: z.number(),
        totalMeals: z.number(),
        mostLoggedMealType: z.string(),
        topWarnings: z.array(z.string()),
        weekLabel: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { avgQualityScore, totalCalories, totalMeals, mostLoggedMealType, topWarnings, weekLabel } = input;
      const systemPrompt = `You are EatVera, a friendly nutrition coach. Generate a single concise, actionable improvement tip (1-2 sentences, max 200 characters) based on the user's weekly eating summary. Be specific, positive, and practical.`;
      const userPrompt = `Week: ${weekLabel}\nAverage food quality score: ${avgQualityScore}/100\nTotal calories logged: ${totalCalories} kcal across ${totalMeals} meals\nMost logged meal type: ${mostLoggedMealType}\nTop ingredient concerns: ${topWarnings.length > 0 ? topWarnings.slice(0, 3).join(", ") : "none"}\n\nGive one specific, actionable tip to improve next week.`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      const rawContent = response.choices[0]?.message?.content;
      const tip = (typeof rawContent === "string" ? rawContent.trim() : null) ?? "Focus on whole foods and minimize ultra-processed snacks this week.";
      return { tip, weekLabel };
    }),
});
