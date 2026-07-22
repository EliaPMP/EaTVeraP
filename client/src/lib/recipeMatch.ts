/**
 * recipeMatch.ts — Matches AI meal suggestions to real recipes in the database
 * Uses keyword matching on name + ingredients to find the closest recipe.
 */
import { ALL_RECIPES, type Recipe } from "./recipeDatabase";

interface MealSuggestion {
  name: string;
  description: string;
  keyIngredients: string[];
  macros: { protein: number; carbs: number; fat: number };
  estimatedCalories: number;
}

/**
 * Score how well a recipe matches a suggestion.
 * Higher score = better match.
 */
function matchScore(recipe: Recipe, suggestion: MealSuggestion): number {
  let score = 0;

  // Name word overlap (most important)
  const suggWords = suggestion.name.toLowerCase().split(/\s+/);
  const recipeWords = recipe.name.toLowerCase().split(/\s+/);
  for (const word of suggWords) {
    if (word.length < 3) continue; // skip short words like "a", "of", "with"
    if (recipeWords.some(rw => rw.includes(word) || word.includes(rw))) {
      score += 10;
    }
  }

  // Ingredient overlap
  const recipeIngredients = recipe.ingredients.map(i => i.item.toLowerCase()).join(" ");
  for (const ing of suggestion.keyIngredients) {
    const ingLower = ing.toLowerCase();
    if (recipeIngredients.includes(ingLower)) {
      score += 5;
    }
    // Partial match (e.g., "chicken" matches "chicken breasts")
    const ingWords = ingLower.split(/\s+/);
    for (const w of ingWords) {
      if (w.length >= 4 && recipeIngredients.includes(w)) {
        score += 2;
      }
    }
  }

  // Description word overlap
  const descWords = suggestion.description.toLowerCase().split(/\s+/);
  const recipeDesc = recipe.description.toLowerCase();
  for (const word of descWords) {
    if (word.length >= 5 && recipeDesc.includes(word)) {
      score += 1;
    }
  }

  // Calorie proximity bonus (within 150 kcal = +3, within 300 = +1)
  const calDiff = Math.abs(recipe.nutrition.calories - suggestion.estimatedCalories);
  if (calDiff < 150) score += 3;
  else if (calDiff < 300) score += 1;

  // Protein proximity bonus
  const protDiff = Math.abs(recipe.nutrition.protein - suggestion.macros.protein);
  if (protDiff < 10) score += 2;

  return score;
}

export interface MatchedRecipe {
  recipe: Recipe;
  score: number;
}

/**
 * Find the best matching recipe for a given meal suggestion.
 * Returns null if no recipe scores above the minimum threshold.
 */
export function findMatchingRecipe(
  suggestion: MealSuggestion,
  excludeIds: string[] = []
): MatchedRecipe | null {
  const MIN_SCORE = 5; // Minimum score to consider a match

  let best: MatchedRecipe | null = null;

  for (const recipe of ALL_RECIPES) {
    if (excludeIds.includes(recipe.id)) continue;

    const score = matchScore(recipe, suggestion);
    if (score >= MIN_SCORE && (!best || score > best.score)) {
      best = { recipe, score };
    }
  }

  return best;
}

/**
 * Find matching recipes for multiple suggestions, ensuring no duplicates.
 */
export function findMatchingRecipes(
  suggestions: MealSuggestion[]
): (MatchedRecipe | null)[] {
  const usedIds: string[] = [];
  const results: (MatchedRecipe | null)[] = [];

  for (const suggestion of suggestions) {
    const match = findMatchingRecipe(suggestion, usedIds);
    if (match) {
      usedIds.push(match.recipe.id);
    }
    results.push(match);
  }

  return results;
}
