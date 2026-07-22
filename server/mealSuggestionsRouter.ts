import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

export const mealSuggestionsRouter = router({
  /**
   * Given today's consumed macros and remaining calorie/macro budget,
   * suggest 3 complementary meals to balance the day.
   */
  getSuggestions: publicProcedure
    .input(
      z.object({
        consumed: z.object({
          calories: z.number(),
          protein: z.number(),
          carbs: z.number(),
          fat: z.number(),
        }),
        goals: z.object({
          dailyCalories: z.number(),
          dailyProtein: z.number(),
          dailyCarbs: z.number(),
          dailyFat: z.number(),
        }),
        lastMealName: z.string().optional(),
        mealTime: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { consumed, goals, lastMealName, mealTime } = input;

      const remaining = {
        calories: Math.max(0, goals.dailyCalories - consumed.calories),
        protein: Math.max(0, goals.dailyProtein - consumed.protein),
        carbs: Math.max(0, goals.dailyCarbs - consumed.carbs),
        fat: Math.max(0, goals.dailyFat - consumed.fat),
      };

      // Determine what macro is most needed
      const proteinPct = consumed.protein / goals.dailyProtein;
      const carbsPct = consumed.carbs / goals.dailyCarbs;
      const fatPct = consumed.fat / goals.dailyFat;

      let macroFocus = "balanced";
      if (proteinPct < carbsPct && proteinPct < fatPct) macroFocus = "high-protein";
      else if (carbsPct < proteinPct && carbsPct < fatPct) macroFocus = "higher-carb";
      else if (fatPct < proteinPct && fatPct < carbsPct) macroFocus = "healthy-fat";

      const systemPrompt = `You are a professional nutritionist specializing in clean eating and whole foods.
Your goal is to suggest practical, healthy, real-food meals that complement what someone has already eaten today.
Focus on minimally processed, nutrient-dense foods. Avoid seed oils, HFCS, and ultra-processed ingredients.
Always return valid JSON.`;

      const userPrompt = `Today so far:
- Calories consumed: ${Math.round(consumed.calories)} kcal (goal: ${goals.dailyCalories} kcal)
- Protein: ${Math.round(consumed.protein)}g / ${goals.dailyProtein}g
- Carbs: ${Math.round(consumed.carbs)}g / ${goals.dailyCarbs}g  
- Fat: ${Math.round(consumed.fat)}g / ${goals.dailyFat}g
- Remaining budget: ~${Math.round(remaining.calories)} kcal
- Macro focus needed: ${macroFocus}
${lastMealName ? `- Last meal eaten: "${lastMealName}"` : ""}
${mealTime ? `- Next meal type: ${mealTime}` : ""}

Suggest 3 complementary meals that would help balance today's macros.
Each meal should be realistic, delicious, and made from whole, clean ingredients.

Return ONLY this JSON:
{
  "suggestions": [
    {
      "name": "Meal name",
      "description": "Brief 1-sentence description",
      "estimatedCalories": number,
      "macros": { "protein": number, "carbs": number, "fat": number },
      "whyThisMeal": "1 sentence explaining how it balances today's macros",
      "keyIngredients": ["ingredient1", "ingredient2", "ingredient3"],
      "prepTime": "e.g. 10 min",
      "emoji": "single emoji representing the meal"
    }
  ],
  "dailyInsight": "One sentence about today's nutrition balance"
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "meal_suggestions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      estimatedCalories: { type: "number" },
                      macros: {
                        type: "object",
                        properties: {
                          protein: { type: "number" },
                          carbs: { type: "number" },
                          fat: { type: "number" },
                        },
                        required: ["protein", "carbs", "fat"],
                        additionalProperties: false,
                      },
                      whyThisMeal: { type: "string" },
                      keyIngredients: { type: "array", items: { type: "string" } },
                      prepTime: { type: "string" },
                      emoji: { type: "string" },
                    },
                    required: [
                      "name", "description", "estimatedCalories",
                      "macros", "whyThisMeal", "keyIngredients", "prepTime", "emoji"
                    ],
                    additionalProperties: false,
                  },
                },
                dailyInsight: { type: "string" },
              },
              required: ["suggestions", "dailyInsight"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No response from AI");

      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      return {
        success: true,
        remaining,
        macroFocus,
        ...parsed,
      };
    }),
});
