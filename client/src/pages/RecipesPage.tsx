/**
 * RecipesPage — EatVera Recipe Discovery
 * Featured daily banner · Category filters · Search · Recipe grid
 * Design: Dark forest green, premium, cinematic
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Search, Clock, ChefHat, Bookmark, BookmarkCheck,
  Flame, Dumbbell, Leaf, UtensilsCrossed, Coffee,
  Sun, Moon, Apple, Cookie, Zap, X, ChevronRight,
  Star
} from "lucide-react";
import {
  ALL_RECIPES,
  RECIPE_CATEGORIES,
  CATEGORY_META,
  getFeaturedRecipe,
  getRecommendedRecipes,
  searchRecipes,
  type RecipeCategory,
  type Recipe,
} from "@/lib/recipeDatabase";
import { useSavedRecipes } from "@/hooks/useSavedRecipes";

// ─── Helpers ────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#84cc16";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

function difficultyColor(d: Recipe["difficulty"]): string {
  return d === "Easy" ? "#22c55e" : d === "Medium" ? "#eab308" : "#ef4444";
}

function formatTime(mins: number): string {
  if (mins === 0) return "No cook";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const CATEGORY_ICONS: Record<RecipeCategory, React.ElementType> = {
  "High Protein":     Dumbbell,
  "Weight Loss":      Flame,
  "Muscle Building":  Zap,
  "Low Carb":         Leaf,
  "Breakfast":        Coffee,
  "Lunch":            Sun,
  "Dinner":           Moon,
  "Snacks":           Apple,
  "Healthy Desserts": Cookie,
};

// ─── Recipe Card ─────────────────────────────────────────────────────────────

function RecipeCard({
  recipe,
  onTap,
  isSaved,
  onToggleSave,
}: {
  recipe: Recipe;
  onTap: () => void;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent) => void;
}) {
  const totalTime = recipe.prepTime + recipe.cookTime;
  const meta = CATEGORY_META[recipe.category];

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onClick={onTap}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.3)";
      }}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={recipe.imageUrl}
          alt={recipe.name}
          className="w-full h-full object-cover"
          style={{ transition: "transform 0.4s ease" }}
          onMouseEnter={e => ((e.target as HTMLImageElement).style.transform = "scale(1.05)")}
          onMouseLeave={e => ((e.target as HTMLImageElement).style.transform = "scale(1)")}
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}
        />

        {/* Category badge */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-white text-[10px] font-semibold"
          style={{ background: `${meta.color}cc`, backdropFilter: "blur(8px)" }}
        >
          {recipe.category}
        </div>

        {/* Save button */}
        <button
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: isSaved ? "rgba(34,197,94,0.9)" : "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
            transition: "background 0.2s ease",
          }}
          onClick={onToggleSave}
        >
          {isSaved
            ? <BookmarkCheck size={14} className="text-white" />
            : <Bookmark size={14} className="text-white" />
          }
        </button>

        {/* Time badge on image */}
        <div
          className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-white text-[10px] font-medium"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
        >
          <Clock size={10} />
          {formatTime(totalTime)}
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5">
        <h3
          className="font-semibold text-sm leading-snug mb-1 line-clamp-2"
          style={{ color: "rgba(255,255,255,0.92)" }}
        >
          {recipe.name}
        </h3>
        <p
          className="text-xs leading-relaxed line-clamp-2 mb-3"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {recipe.description}
        </p>

        {/* Macro row */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Flame size={10} style={{ color: "#f97316" }} />
            <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>
              {recipe.nutrition.calories} cal
            </span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <span className="text-[10px] font-mono" style={{ color: "#22c55e" }}>
            {recipe.nutrition.protein}g P
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
            {recipe.nutrition.carbs}g C
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
            {recipe.nutrition.fat}g F
          </span>
        </div>

        {/* Difficulty + servings */}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-1">
            <ChefHat size={10} style={{ color: difficultyColor(recipe.difficulty) }} />
            <span className="text-[10px]" style={{ color: difficultyColor(recipe.difficulty) }}>
              {recipe.difficulty}
            </span>
          </div>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            {recipe.servings} serving{recipe.servings > 1 ? "s" : ""} · ${recipe.costPerServing.toFixed(2)}/serving
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Featured Banner ─────────────────────────────────────────────────────────

function FeaturedBanner({
  recipe,
  onTap,
  isSaved,
  onToggleSave,
}: {
  recipe: Recipe;
  onTap: () => void;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent) => void;
}) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div
      className="relative mx-4 rounded-3xl overflow-hidden cursor-pointer"
      style={{
        height: 260,
        boxShadow: "0 12px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
      }}
      onClick={onTap}
    >
      {/* Background image */}
      <img
        src={recipe.imageUrl}
        alt={recipe.name}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scale(1.02)" }}
      />

      {/* Gradient overlays */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)",
        }}
      />

      {/* Ambient green glow */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)",
          transform: "translate(20%, -20%)",
        }}
      />

      {/* Top badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[11px] font-bold tracking-wide"
          style={{ background: "rgba(34,197,94,0.9)", backdropFilter: "blur(8px)" }}
        >
          <Star size={10} fill="white" />
          RECIPE OF THE DAY
        </div>
      </div>

      {/* Save button */}
      <button
        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: isSaved ? "rgba(34,197,94,0.9)" : "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
          transition: "background 0.2s ease",
        }}
        onClick={onToggleSave}
      >
        {isSaved
          ? <BookmarkCheck size={16} className="text-white" />
          : <Bookmark size={16} className="text-white" />
        }
      </button>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div
          className="text-[10px] font-semibold tracking-widest uppercase mb-1.5"
          style={{ color: "rgba(134,239,172,0.8)" }}
        >
          {recipe.category}
        </div>
        <h2
          className="font-bold text-xl leading-tight mb-2"
          style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
        >
          {recipe.name}
        </h2>

        {/* Stats row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Flame size={12} style={{ color: "#f97316" }} />
            <span className="text-xs font-semibold text-white">{recipe.nutrition.calories} cal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Dumbbell size={12} style={{ color: "#22c55e" }} />
            <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>{recipe.nutrition.protein}g protein</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} style={{ color: "rgba(255,255,255,0.6)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{formatTime(totalTime)}</span>
          </div>
          <div className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
            <span className="text-xs font-semibold text-white">View Recipe</span>
            <ChevronRight size={12} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecipesPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | "All">("All");
  const [activeTab, setActiveTab] = useState<"all" | "saved">("all");
  const { isSaved, toggleSave, savedIds } = useSavedRecipes();

  const featuredRecipe = useMemo(() => getFeaturedRecipe(), []);

  // Read user goals from onboarding profile to power recommendations
  const userGoals = useMemo(() => {
    try {
      const raw = localStorage.getItem("eatclean-body-profile");
      if (!raw) return [];
      const profile = JSON.parse(raw) as { mainGoal?: string; archetype?: string; desiredBuild?: string };
      const goal = profile.archetype || profile.mainGoal || profile.desiredBuild || "";
      const map: Record<string, string[]> = {
        lose_fat: ["weight_loss", "low_carb"],
        slim_toned: ["weight_loss", "high_protein"],
        build_muscle: ["muscle_building", "high_protein"],
        bigger_muscular: ["muscle_building", "high_protein"],
        bulk_build_muscle: ["muscle_building", "high_protein"],
        recomp: ["high_protein", "weight_loss"],
        maintain_muscle_lose_weight: ["weight_loss", "high_protein"],
        athletic: ["high_protein", "muscle_building"],
        skinny_fat: ["muscle_building", "weight_loss"],
      };
      return map[goal] ?? ["high_protein", "weight_loss"];
    } catch {
      return ["high_protein", "weight_loss"];
    }
  }, []);

  const recommendedRecipes = useMemo(
    () => getRecommendedRecipes(userGoals, 6),
    [userGoals]
  );

  const filteredRecipes = useMemo(() => {
    let recipes = searchQuery.trim() ? searchRecipes(searchQuery) : ALL_RECIPES;
    if (activeCategory !== "All") {
      recipes = recipes.filter(r => r.category === activeCategory);
    }
    return recipes;
  }, [searchQuery, activeCategory]);

  // Saved recipes — preserve most-recently-saved order from savedIds
  const savedRecipes = useMemo(() => {
    const map = new Map(ALL_RECIPES.map(r => [r.id, r]));
    return savedIds
      .map(id => map.get(id))
      .filter((r): r is Recipe => r !== undefined);
  }, [savedIds]);

  const savedFiltered = useMemo(() => {
    if (!searchQuery.trim()) return savedRecipes;
    const q = searchQuery.toLowerCase();
    return savedRecipes.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q)) ||
        r.ingredients.some(i => i.item.toLowerCase().includes(q))
    );
  }, [savedRecipes, searchQuery]);

  const handleRecipeTap = (id: string) => navigate(`/recipes/${id}`);

  const handleToggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleSave(id);
  };

  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: "linear-gradient(180deg, #050e07 0%, #071a0e 40%, #0a1f12 100%)" }}
    >
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute rounded-full"
          style={{
            width: 500, height: 500,
            top: -100, right: -150,
            background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 400, height: 400,
            bottom: 200, left: -100,
            background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        {/* Header */}
        <div className="px-5 pt-12 pb-5">
          <div className="flex items-end justify-between mb-1">
            <div>
              <div
                className="text-[10px] font-semibold tracking-widest uppercase mb-1"
                style={{ color: "rgba(134,239,172,0.7)" }}
              >
                EatVera
              </div>
              <h1
                className="font-bold text-3xl"
                style={{
                  color: "white",
                  letterSpacing: "-0.03em",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Recipes
              </h1>
            </div>
            <div
              className="text-xs font-medium px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(34,197,94,0.12)",
                color: "rgba(134,239,172,0.8)",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              {ALL_RECIPES.length} recipes
            </div>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Clean meals that align with your goals
          </p>
        </div>

        {/* All / Saved tab switcher */}
        <div className="px-4 mb-4">
          <div
            className="flex rounded-2xl p-1"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <button
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: activeTab === "all" ? "rgba(34,197,94,0.2)" : "transparent",
                color: activeTab === "all" ? "#22c55e" : "rgba(255,255,255,0.4)",
                border: activeTab === "all" ? "1px solid rgba(34,197,94,0.3)" : "1px solid transparent",
              }}
              onClick={() => { setActiveTab("all"); setSearchQuery(""); }}
            >
              All Recipes
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: activeTab === "saved" ? "rgba(34,197,94,0.2)" : "transparent",
                color: activeTab === "saved" ? "#22c55e" : "rgba(255,255,255,0.4)",
                border: activeTab === "saved" ? "1px solid rgba(34,197,94,0.3)" : "1px solid transparent",
              }}
              onClick={() => { setActiveTab("saved"); setSearchQuery(""); setActiveCategory("All"); }}
            >
              <Bookmark size={11} />
              Saved
              {savedIds.length > 0 && (
                <span
                  className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ background: "rgba(34,197,94,0.25)", color: "#22c55e" }}
                >
                  {savedIds.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 mb-5">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Search size={16} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search recipes or ingredients..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-sm"
              style={{
                color: "rgba(255,255,255,0.85)",
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
              </button>
            )}
          </div>
        </div>

        {activeTab === "all" && (
        <>

        {/* Featured recipe banner — only when no search active */}
        {!searchQuery && activeCategory === "All" && (
          <div className="mb-6">
            <div className="px-5 mb-3">
              <span
                className="text-xs font-semibold tracking-wider uppercase"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Featured Today
              </span>
            </div>
            <FeaturedBanner
              recipe={featuredRecipe}
              onTap={() => handleRecipeTap(featuredRecipe.id)}
              isSaved={isSaved(featuredRecipe.id)}
              onToggleSave={e => handleToggleSave(e, featuredRecipe.id)}
            />
          </div>
        )}

        {/* Recommended For You — only when no search/filter active and user has goals */}
        {!searchQuery && activeCategory === "All" && recommendedRecipes.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between px-5 mb-3">
              <div>
                <span
                  className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Recommended For You
                </span>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Based on your fitness goals
                </p>
              </div>
              <button
                className="text-[11px] font-medium"
                style={{ color: "rgba(134,239,172,0.7)" }}
                onClick={() => setActiveCategory("All")}
              >
                See all
              </button>
            </div>
            <div
              className="flex gap-3 px-4 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
            >
              {recommendedRecipes.map(recipe => {
                const totalTime = recipe.prepTime + recipe.cookTime;
                const saved = isSaved(recipe.id);
                return (
                  <div
                    key={recipe.id}
                    className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer"
                    style={{
                      width: 180,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    }}
                    onClick={() => handleRecipeTap(recipe.id)}
                  >
                    <div className="relative" style={{ height: 110 }}>
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }}
                      />
                      <button
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{
                          background: saved ? "rgba(34,197,94,0.9)" : "rgba(0,0,0,0.5)",
                          backdropFilter: "blur(8px)",
                        }}
                        onClick={e => handleToggleSave(e, recipe.id)}
                      >
                        {saved
                          ? <BookmarkCheck size={10} className="text-white" />
                          : <Bookmark size={10} className="text-white" />
                        }
                      </button>
                      <div
                        className="absolute bottom-2 left-2 flex items-center gap-1"
                      >
                        <Clock size={9} style={{ color: "rgba(255,255,255,0.7)" }} />
                        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                          {formatTime(totalTime)}
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p
                        className="text-xs font-semibold leading-snug line-clamp-2 mb-1"
                        style={{ color: "rgba(255,255,255,0.88)" }}
                      >
                        {recipe.name}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Flame size={9} style={{ color: "#f97316" }} />
                        <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
                          {recipe.nutrition.calories} cal
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                        <span className="text-[9px] font-mono" style={{ color: "#22c55e" }}>
                          {recipe.nutrition.protein}g P
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category filter chips */}

        <div className="mb-5">
          <div
            className="flex gap-2 px-4 overflow-x-auto"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          >
            {/* All chip */}
            <button
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeCategory === "All"
                  ? "rgba(34,197,94,0.9)"
                  : "rgba(255,255,255,0.06)",
                color: activeCategory === "All" ? "white" : "rgba(255,255,255,0.6)",
                border: activeCategory === "All"
                  ? "1px solid rgba(34,197,94,0.5)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
              onClick={() => setActiveCategory("All")}
            >
              All
            </button>

            {RECIPE_CATEGORIES.map(cat => {
              const Icon = CATEGORY_ICONS[cat];
              const meta = CATEGORY_META[cat];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: isActive ? `${meta.color}cc` : "rgba(255,255,255,0.06)",
                    color: isActive ? "white" : "rgba(255,255,255,0.6)",
                    border: isActive
                      ? `1px solid ${meta.color}80`
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                  onClick={() => setActiveCategory(isActive ? "All" : cat)}
                >
                  <Icon size={11} />
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count */}
        <div className="px-5 mb-4">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? "s" : ""}
            {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            {searchQuery ? ` matching "${searchQuery}"` : ""}
          </span>
        </div>

        {/* Recipe grid */}
        {filteredRecipes.length > 0 ? (
          <div className="px-4 grid grid-cols-2 gap-3">
            {filteredRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onTap={() => handleRecipeTap(recipe.id)}
                isSaved={isSaved(recipe.id)}
                onToggleSave={e => handleToggleSave(e, recipe.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <UtensilsCrossed size={28} style={{ color: "rgba(255,255,255,0.3)" }} />
            </div>
            <p className="font-semibold text-base mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
              No recipes found
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Try a different search term or category
            </p>
            <button
              className="mt-4 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
              onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
            >
              Clear filters
            </button>
          </div>
        )}

        </>)}

        {/* ── SAVED TAB ────────────────────────────────────────────────── */}
        {activeTab === "saved" && (
          <div>
            {/* Saved search bar */}
            <div className="px-4 mb-4">
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Search size={16} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search saved recipes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-sm"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}>
                    <X size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
                  </button>
                )}
              </div>
            </div>

            {savedRecipes.length === 0 ? (
              /* Empty state — no saved recipes yet */
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                  style={{
                    background: "rgba(34,197,94,0.08)",
                    border: "1px solid rgba(34,197,94,0.15)",
                  }}
                >
                  <Bookmark size={32} style={{ color: "rgba(34,197,94,0.5)" }} />
                </div>
                <p className="font-bold text-lg mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                  No saved recipes yet
                </p>
                <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Tap the bookmark icon on any recipe to save it here for quick access.
                </p>
                <button
                  className="px-5 py-2.5 rounded-full text-sm font-semibold"
                  style={{
                    background: "rgba(34,197,94,0.15)",
                    color: "#22c55e",
                    border: "1px solid rgba(34,197,94,0.25)",
                  }}
                  onClick={() => setActiveTab("all")}
                >
                  Browse All Recipes
                </button>
              </div>
            ) : savedFiltered.length === 0 ? (
              /* Empty state — search returned nothing */
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                <UtensilsCrossed size={28} style={{ color: "rgba(255,255,255,0.3)" }} />
                <p className="font-semibold text-base mt-4 mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                  No matches
                </p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Try a different search term
                </p>
                <button
                  className="mt-4 px-4 py-2 rounded-full text-sm font-medium"
                  style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </button>
              </div>
            ) : (
              /* Saved recipe grid */
              <>
                <div className="px-5 mb-4">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {savedFiltered.length} saved recipe{savedFiltered.length !== 1 ? "s" : ""}
                    {searchQuery ? ` matching "${searchQuery}"` : ""}
                  </span>
                </div>
                <div className="px-4 grid grid-cols-2 gap-3">
                  {savedFiltered.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onTap={() => handleRecipeTap(recipe.id)}
                      isSaved={true}
                      onToggleSave={e => handleToggleSave(e, recipe.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
