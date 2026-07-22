import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";

/**
 * Price lookup router
 * Primary: Open Food Facts Open Prices API (crowd-sourced US prices)
 * Fallback: Category-based average US retail price estimates
 */

/** Category-based average US retail price estimates (per package) */
const CATEGORY_PRICE_ESTIMATES: Record<string, number> = {
  // Beverages
  "beverages": 2.49,
  "juice": 3.99,
  "soda": 1.99,
  "water": 1.49,
  "coffee": 8.99,
  "tea": 4.99,
  "energy drink": 2.99,
  "sports drink": 1.99,
  // Snacks
  "snack": 3.49,
  "chips": 3.99,
  "crackers": 3.49,
  "cookies": 3.99,
  "candy": 2.49,
  "chocolate": 2.99,
  "popcorn": 3.49,
  "nuts": 6.99,
  "granola bar": 4.99,
  "protein bar": 2.99,
  // Dairy
  "milk": 4.49,
  "cheese": 5.99,
  "yogurt": 1.99,
  "butter": 5.49,
  "eggs": 4.99,
  "cream": 3.49,
  "ice cream": 5.99,
  "dairy": 3.99,
  // Meat
  "beef": 8.99,
  "chicken": 6.99,
  "pork": 7.49,
  "turkey": 6.99,
  "lamb": 12.99,
  "bison": 14.99,
  "seafood": 11.99,
  "fish": 9.99,
  "deli": 5.99,
  "meat": 7.99,
  // Produce
  "fruit": 2.99,
  "vegetable": 2.49,
  "salad": 3.99,
  // Grains
  "bread": 3.99,
  "cereal": 4.49,
  "pasta": 1.99,
  "rice": 2.99,
  "oats": 3.99,
  "grains": 3.49,
  "flour": 3.49,
  // Condiments & Oils
  "oil": 7.99,
  "olive oil": 9.99,
  "ketchup": 3.49,
  "mustard": 2.49,
  "mayo": 4.99,
  "sauce": 3.99,
  "dressing": 3.99,
  "vinegar": 3.49,
  "condiment": 3.99,
  // Frozen
  "frozen": 5.49,
  "frozen meal": 4.99,
  "frozen pizza": 7.99,
  "frozen vegetables": 2.99,
  // Supplements
  "supplement": 24.99,
  "protein powder": 39.99,
  "vitamin": 14.99,
  "pre-workout": 34.99,
  // Baby & Kids
  "baby food": 1.99,
  "baby": 3.99,
  // Alcohol
  "wine": 12.99,
  "beer": 9.99,
  "spirits": 24.99,
  "whiskey": 29.99,
  "vodka": 19.99,
  // Pet
  "dog food": 14.99,
  "cat food": 12.99,
  "pet": 13.99,
  // Default
  "default": 4.99,
};

function estimatePriceFromCategory(category: string, name: string): number {
  const text = `${category} ${name}`.toLowerCase();
  // Try most specific matches first
  for (const [key, price] of Object.entries(CATEGORY_PRICE_ESTIMATES)) {
    if (key !== "default" && text.includes(key)) {
      return price;
    }
  }
  return CATEGORY_PRICE_ESTIMATES["default"];
}

export const priceRouter = router({
  /**
   * Get average retail price for a product by barcode.
   * Returns live data from Open Prices API if available, otherwise a category estimate.
   */
  getAveragePrice: publicProcedure
    .input(
      z.object({
        barcode: z.string().min(1),
        category: z.string().optional(),
        name: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { barcode, category = "", name = "" } = input;

      try {
        // Fetch up to 20 USD price entries from Open Prices API
        const url = `https://prices.openfoodfacts.org/api/v1/prices?product_code=${encodeURIComponent(barcode)}&currency=USD&page_size=20`;
        const response = await fetch(url, {
          headers: { "User-Agent": "EatVera/1.0 (food health scanner)" },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          const items: Array<{ price: number; currency: string; date: string }> = data.items || [];
          const usdPrices = items
            .filter((i) => i.currency === "USD" && i.price > 0 && i.price < 500)
            .map((i) => i.price);

          if (usdPrices.length > 0) {
            // Use median to reduce outlier impact
            const sorted = [...usdPrices].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const median =
              sorted.length % 2 === 0
                ? (sorted[mid - 1] + sorted[mid]) / 2
                : sorted[mid];
            return {
              price: Math.round(median * 100) / 100,
              source: "live" as const,
              dataPoints: usdPrices.length,
            };
          }
        }
      } catch {
        // Fall through to estimate
      }

      // Fallback: category-based estimate
      const estimate = estimatePriceFromCategory(category, name);
      return {
        price: estimate,
        source: "estimate" as const,
        dataPoints: 0,
      };
    }),
});
