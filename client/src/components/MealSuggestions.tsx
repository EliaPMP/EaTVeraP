/**
 * MealSuggestions — "What to Eat Next" panel
 * Shown after a meal is analyzed in CalorieScannerPage.
 * Calls AI to suggest 3 complementary meals based on remaining macro budget.
 * Matches suggestions to real recipes from the database for images and navigation.
 */
import { useState, useEffect, useMemo } from "react";
import { Zap, Clock, ChevronRight, Lightbulb, RefreshCw, Heart, UtensilsCrossed } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCalorieGoals } from "@/hooks/useCalorieGoals";
import { useMealFavourites } from "@/hooks/useMealFavourites";
import { findMatchingRecipes, type MatchedRecipe } from "@/lib/recipeMatch";

interface MealSuggestion {
  name: string;
  description: string;
  estimatedCalories: number;
  macros: { protein: number; carbs: number; fat: number };
  whyThisMeal: string;
  keyIngredients: string[];
  prepTime: string;
  emoji: string;
}

function SuggestionCard({
  suggestion,
  matchedRecipe,
}: {
  suggestion: MealSuggestion;
  matchedRecipe: MatchedRecipe | null;
}) {
  const [, navigate] = useLocation();
  const { isFavourite, toggleFavourite } = useMealFavourites();
  const starred = isFavourite(suggestion.name);

  const handleCardClick = () => {
    if (matchedRecipe) {
      navigate(`/recipes/${matchedRecipe.recipe.id}`);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Main card row */}
      <div className="flex items-center">
        {/* Clickable area — navigates to recipe */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleCardClick}
          onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
          className="flex-1 p-3.5 flex items-center gap-3 text-left cursor-pointer"
        >
          {/* Image or fallback */}
          <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden bg-stone-100">
            {matchedRecipe ? (
              <img
                src={matchedRecipe.recipe.imageUrl}
                alt={matchedRecipe.recipe.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {suggestion.emoji}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-stone-800 text-sm truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {matchedRecipe ? matchedRecipe.recipe.name : suggestion.name}
            </p>
            <p className="text-xs text-stone-400 truncate mt-0.5">
              {suggestion.description}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-orange-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                ~{matchedRecipe ? matchedRecipe.recipe.nutrition.calories : suggestion.estimatedCalories} kcal
              </span>
              <span className="text-[10px] text-stone-300">·</span>
              <span className="text-[10px] text-stone-400">
                P: {Math.round(matchedRecipe ? matchedRecipe.recipe.nutrition.protein : suggestion.macros.protein)}g
              </span>
              <span className="text-[10px] text-stone-400">
                C: {Math.round(matchedRecipe ? matchedRecipe.recipe.nutrition.carbs : suggestion.macros.carbs)}g
              </span>
              <span className="text-[10px] text-stone-400">
                F: {Math.round(matchedRecipe ? matchedRecipe.recipe.nutrition.fat : suggestion.macros.fat)}g
              </span>
            </div>
            {matchedRecipe && (
              <div className="flex items-center gap-1.5 mt-1">
                <Clock size={9} className="text-stone-300" />
                <span className="text-[10px] text-stone-400">
                  {matchedRecipe.recipe.prepTime + matchedRecipe.recipe.cookTime} min
                </span>
                <span className="text-[10px] text-stone-300">·</span>
                <span className="text-[10px] text-stone-400">
                  {matchedRecipe.recipe.difficulty}
                </span>
              </div>
            )}
          </div>

          {/* Arrow indicator for navigation */}
          {matchedRecipe && (
            <ChevronRight size={14} className="text-stone-300 flex-shrink-0" />
          )}
        </div>

        {/* Heart button — outside the clickable div */}
        <button
          onClick={() => toggleFavourite({
            name: suggestion.name,
            emoji: suggestion.emoji,
            source: "suggestion",
            calories: suggestion.estimatedCalories,
            macros: suggestion.macros,
            keyIngredients: suggestion.keyIngredients,
          })}
          className="p-3 transition-colors flex-shrink-0"
          aria-label={starred ? "Remove from favourites" : "Save to favourites"}
        >
          <Heart size={13} className={starred ? "fill-red-400 text-red-400" : "text-stone-300 hover:text-red-300"} />
        </button>
      </div>

      {/* Why this meal — subtle bottom bar */}
      {suggestion.whyThisMeal && (
        <div className="px-3.5 pb-3 border-t border-stone-50">
          <div className="flex items-start gap-2 mt-2.5 rounded-xl p-2.5" style={{ background: "#f0fdf4" }}>
            <Lightbulb size={11} className="text-[#0B3D2E] mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-green-800 leading-relaxed">{suggestion.whyThisMeal}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface MealSuggestionsProps {
  lastMealName?: string;
}

export default function MealSuggestions({ lastMealName }: MealSuggestionsProps) {
  const { goals, todayTotals } = useCalorieGoals();
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [dailyInsight, setDailyInsight] = useState("");
  const [macroFocus, setMacroFocus] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [, navigate] = useLocation();

  const mutation = trpc.mealSuggestions.getSuggestions.useMutation();

  const getMealTime = (): "breakfast" | "lunch" | "dinner" | "snack" => {
    const hour = new Date().getHours();
    if (hour < 10) return "breakfast";
    if (hour < 14) return "lunch";
    if (hour < 19) return "dinner";
    return "snack";
  };

  const fetchSuggestions = async () => {
    try {
      const result = await mutation.mutateAsync({
        consumed: {
          calories: todayTotals.calories,
          protein: todayTotals.protein,
          carbs: todayTotals.carbs,
          fat: todayTotals.fat,
        },
        goals: {
          dailyCalories: goals.dailyCalories,
          dailyProtein: goals.dailyProtein,
          dailyCarbs: goals.dailyCarbs,
          dailyFat: goals.dailyFat,
        },
        lastMealName,
        mealTime: getMealTime(),
      });
      setSuggestions(result.suggestions as MealSuggestion[]);
      setDailyInsight(result.dailyInsight);
      setMacroFocus(result.macroFocus);
      setHasLoaded(true);
    } catch (err) {
      console.error("Failed to get meal suggestions:", err);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Match suggestions to real recipes
  const matchedRecipes = useMemo(() => {
    if (suggestions.length === 0) return [];
    return findMatchingRecipes(suggestions);
  }, [suggestions]);

  const macroFocusLabel: Record<string, string> = {
    "high-protein": "High-Protein Focus",
    "higher-carb": "Carb-Replenishing Focus",
    "healthy-fat": "Healthy-Fat Focus",
    "balanced": "Balanced Macros",
  };

  return (
    <div className="px-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#DCF4DF] flex items-center justify-center">
            <Zap size={13} className="text-[#145A3A]" />
          </div>
          <div>
            <h3 className="font-bold text-stone-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>What to Eat Next</h3>
            {macroFocus && (
              <p className="text-[10px] text-stone-400">{macroFocusLabel[macroFocus] || macroFocus}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {hasLoaded && (
            <button
              onClick={() => navigate("/recipes")}
              className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 transition-colors"
              aria-label="View all recipes"
            >
              <UtensilsCrossed size={13} />
            </button>
          )}
          {hasLoaded && (
            <button
              onClick={fetchSuggestions}
              disabled={mutation.isPending}
              className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={mutation.isPending ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>

      {mutation.isPending && !hasLoaded && (
        <div className="rounded-2xl border border-stone-100 bg-white p-5 text-center">
          <div className="flex justify-center gap-1 mb-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-green-400"
                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <p className="text-xs text-stone-400">Finding recipes for your macros...</p>
        </div>
      )}

      {mutation.isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center">
          <p className="text-xs text-red-500 mb-2">Could not load suggestions</p>
          <button
            onClick={fetchSuggestions}
            className="text-xs font-semibold text-red-600 underline"
          >
            Try again
          </button>
        </div>
      )}

      {hasLoaded && (
        <>
          {/* Daily insight */}
          {dailyInsight && (
            <div className="rounded-xl p-3 mb-3 flex items-start gap-2" style={{ background: "#fffbf0", border: "1px solid #fde68a" }}>
              <Lightbulb size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">{dailyInsight}</p>
            </div>
          )}

          {/* Suggestion cards with real recipe images */}
          <div className="space-y-2.5">
            {suggestions.map((s, i) => (
              <SuggestionCard
                key={i}
                suggestion={s}
                matchedRecipe={matchedRecipes[i] || null}
              />
            ))}
          </div>

          {/* View all recipes CTA */}
          <button
            onClick={() => navigate("/recipes")}
            className="w-full mt-3 py-2.5 rounded-xl border border-stone-100 bg-white text-center text-xs font-semibold text-[#145A3A] hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <UtensilsCrossed size={12} />
            Browse All Recipes
          </button>
        </>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
