import { describe, it, expect } from "vitest";

// We need to test the recipe database module
// Since it's a client-side module, we'll import it directly
import { ALL_RECIPES, getFeaturedRecipe, getRecommendedRecipes, searchRecipes } from "../client/src/lib/recipeDatabase";

describe("Recipe Database", () => {
  it("should contain at least 50 recipes", () => {
    expect(ALL_RECIPES.length).toBeGreaterThanOrEqual(50);
  });

  it("should have 57 recipes total after expansion", () => {
    expect(ALL_RECIPES.length).toBe(57);
  });

  it("should have unique IDs for all recipes", () => {
    const ids = ALL_RECIPES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid image URLs for all recipes (no unsplash broken URLs)", () => {
    const brokenPatterns = [
      "photo-1563379091339", // old shrimp stir-fry broken URL
      "photo-1551782450-a2132b4ba21d", // old turkey wrap wrong URL
    ];
    for (const recipe of ALL_RECIPES) {
      expect(recipe.imageUrl).toBeTruthy();
      for (const pattern of brokenPatterns) {
        expect(recipe.imageUrl).not.toContain(pattern);
      }
    }
  });

  it("should have the fixed shrimp stir-fry image", () => {
    const shrimp = ALL_RECIPES.find((r) => r.id === "shrimp-stir-fry");
    expect(shrimp).toBeDefined();
    expect(shrimp!.imageUrl).toContain("/manus-storage/shrimp-stir-fry");
  });

  it("should have the fixed turkey wrap image", () => {
    const wrap = ALL_RECIPES.find((r) => r.id === "turkey-avocado-wrap");
    expect(wrap).toBeDefined();
    expect(wrap!.imageUrl).toContain("/manus-storage/turkey-avocado-wrap");
  });

  it("should include new smoothie recipes", () => {
    const smoothies = ALL_RECIPES.filter(
      (r) =>
        r.name.toLowerCase().includes("smoothie") ||
        r.name.toLowerCase().includes("acai")
    );
    expect(smoothies.length).toBeGreaterThanOrEqual(4);
  });

  it("should include new snack recipes", () => {
    const newSnackIds = [
      "trail-mix-energy-bars",
      "crispy-roasted-chickpeas",
      "caprese-skewers",
      "stuffed-mushrooms",
      "banana-oat-muffins",
    ];
    for (const id of newSnackIds) {
      const recipe = ALL_RECIPES.find((r) => r.id === id);
      expect(recipe).toBeDefined();
    }
  });

  it("should include new quick dinner recipes", () => {
    const newDinnerIds = [
      "chicken-taco-bowl",
      "sheet-pan-salmon-veggies",
      "one-pot-veggie-pasta",
      "teriyaki-chicken-bowl",
      "sweet-potato-black-bean-tacos",
      "coconut-curry-lentil-soup",
      "turkey-meatballs-marinara",
      "tofu-veggie-stir-fry",
      "grilled-steak-arugula-salad",
      "avocado-cucumber-sushi",
      "quinoa-stuffed-sweet-potato",
    ];
    for (const id of newDinnerIds) {
      const recipe = ALL_RECIPES.find((r) => r.id === id);
      expect(recipe).toBeDefined();
    }
  });

  it("should have valid nutrition data for all new recipes", () => {
    const newIds = [
      "green-detox-smoothie",
      "mango-tropical-smoothie",
      "blueberry-protein-smoothie",
      "acai-bowl",
      "trail-mix-energy-bars",
      "crispy-roasted-chickpeas",
      "chicken-taco-bowl",
      "sheet-pan-salmon-veggies",
      "one-pot-veggie-pasta",
      "teriyaki-chicken-bowl",
      "turkey-meatballs-marinara",
    ];
    for (const id of newIds) {
      const recipe = ALL_RECIPES.find((r) => r.id === id);
      expect(recipe).toBeDefined();
      expect(recipe!.nutrition.calories).toBeGreaterThan(0);
      expect(recipe!.nutrition.protein).toBeGreaterThanOrEqual(0);
      expect(recipe!.nutrition.carbs).toBeGreaterThanOrEqual(0);
      expect(recipe!.nutrition.fat).toBeGreaterThanOrEqual(0);
    }
  });

  it("getFeaturedRecipe should return a recipe", () => {
    const recipe = getFeaturedRecipe();
    expect(recipe).toBeDefined();
    expect(recipe.id).toBeTruthy();
    expect(recipe.name).toBeTruthy();
  });

  it("getRecommendedRecipes should return recipes matching goals", () => {
    const results = getRecommendedRecipes(["high_protein"], 6);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(6);
    for (const r of results) {
      expect(r.goalAlignment).toContain("high_protein");
    }
  });

  it("searchRecipes should find new recipes by name", () => {
    const results = searchRecipes("teriyaki");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.id === "teriyaki-chicken-bowl")).toBe(true);
  });

  it("searchRecipes should find recipes by ingredient", () => {
    const results = searchRecipes("chickpeas");
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("all recipes should have required fields", () => {
    for (const recipe of ALL_RECIPES) {
      expect(recipe.id).toBeTruthy();
      expect(recipe.name).toBeTruthy();
      expect(recipe.description).toBeTruthy();
      expect(recipe.category).toBeTruthy();
      expect(recipe.imageUrl).toBeTruthy();
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
      expect(recipe.goalAlignment.length).toBeGreaterThan(0);
    }
  });
});
