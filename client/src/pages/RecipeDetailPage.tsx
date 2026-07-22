/**
 * RecipeDetailPage — Full recipe view
 * Ingredients · Step-by-step · Nutrition facts · Cost per serving · Save
 * Design: Dark forest green, premium, immersive
 */
import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Clock, ChefHat, Bookmark, BookmarkCheck,
  Flame, Dumbbell, Wheat, Droplets, Users, DollarSign,
  CheckCircle2, Circle, Leaf, AlertCircle,
} from "lucide-react";
import { ALL_RECIPES, type Recipe } from "@/lib/recipeDatabase";
import { useSavedRecipes } from "@/hooks/useSavedRecipes";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(mins: number): string {
  if (mins === 0) return "No cook";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function difficultyColor(d: Recipe["difficulty"]): string {
  return d === "Easy" ? "#22c55e" : d === "Medium" ? "#eab308" : "#ef4444";
}

// ─── Nutrition Row ────────────────────────────────────────────────────────────

function NutritionRow({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color }}>
        {value}{unit}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isSaved, toggleSave } = useSavedRecipes();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"ingredients" | "steps" | "nutrition">("ingredients");

  const recipe = useMemo(
    () => ALL_RECIPES.find(r => r.id === params.id),
    [params.id]
  );

  if (!recipe) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "#050e07" }}
      >
        <AlertCircle size={40} style={{ color: "rgba(255,255,255,0.3)" }} />
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Recipe not found</p>
        <button
          className="px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
          onClick={() => navigate("/recipes")}
        >
          Back to Recipes
        </button>
      </div>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;
  const saved = isSaved(recipe.id);

  const toggleStep = (step: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });
  };

  const progressPct = recipe.steps.length > 0
    ? Math.round((completedSteps.size / recipe.steps.length) * 100)
    : 0;

  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: "linear-gradient(180deg, #050e07 0%, #071a0e 40%, #0a1f12 100%)" }}
    >
      {/* Hero image */}
      <div className="relative" style={{ height: 300 }}>
        <img
          src={recipe.imageUrl}
          alt={recipe.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlays */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(5,14,7,1) 100%)" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, transparent 60%, rgba(0,0,0,0.5) 100%)" }}
        />

        {/* Back button */}
        <button
          className="absolute top-12 left-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
          onClick={() => navigate("/recipes")}
        >
          <ArrowLeft size={18} className="text-white" />
        </button>

        {/* Save button */}
        <button
          className="absolute top-12 right-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: saved ? "rgba(34,197,94,0.9)" : "rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
            transition: "background 0.2s ease",
          }}
          onClick={() => toggleSave(recipe.id)}
        >
          {saved
            ? <BookmarkCheck size={18} className="text-white" />
            : <Bookmark size={18} className="text-white" />
          }
        </button>
      </div>

      {/* Content */}
      <div className="px-5 -mt-6 relative" style={{ zIndex: 1 }}>
        {/* Category badge */}
        <div
          className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold mb-3"
          style={{
            background: "rgba(34,197,94,0.15)",
            color: "#22c55e",
            border: "1px solid rgba(34,197,94,0.25)",
          }}
        >
          {recipe.category}
        </div>

        {/* Title */}
        <h1
          className="font-bold text-2xl leading-tight mb-2"
          style={{ color: "white", letterSpacing: "-0.02em" }}
        >
          {recipe.name}
        </h1>
        <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
          {recipe.description}
        </p>

        {/* Quick stats row */}
        <div
          className="grid grid-cols-4 gap-2 p-4 rounded-2xl mb-5"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {[
            { icon: Clock, label: "Total", value: formatTime(totalTime), color: "rgba(255,255,255,0.7)" },
            { icon: Clock, label: "Prep", value: formatTime(recipe.prepTime), color: "rgba(255,255,255,0.7)" },
            { icon: Users, label: "Serves", value: `${recipe.servings}`, color: "rgba(255,255,255,0.7)" },
            { icon: DollarSign, label: "/serving", value: `$${recipe.costPerServing.toFixed(2)}`, color: "#22c55e" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon size={14} style={{ color: "rgba(255,255,255,0.35)" }} />
              <span className="text-sm font-bold" style={{ color }}>{value}</span>
              <span className="text-[9px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Macro highlights */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: "Calories", value: recipe.nutrition.calories, unit: "", icon: Flame, color: "#f97316" },
            { label: "Protein", value: recipe.nutrition.protein, unit: "g", icon: Dumbbell, color: "#22c55e" },
            { label: "Carbs", value: recipe.nutrition.carbs, unit: "g", icon: Wheat, color: "#eab308" },
            { label: "Fat", value: recipe.nutrition.fat, unit: "g", icon: Droplets, color: "#60a5fa" },
          ].map(({ label, value, unit, icon: Icon, color }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl"
              style={{
                background: `${color}12`,
                border: `1px solid ${color}25`,
              }}
            >
              <Icon size={14} style={{ color }} />
              <span className="text-base font-bold" style={{ color }}>{value}{unit}</span>
              <span className="text-[9px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {recipe.tags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Leaf size={8} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Difficulty + cooking progress */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ChefHat size={14} style={{ color: difficultyColor(recipe.difficulty) }} />
            <span className="text-sm font-medium" style={{ color: difficultyColor(recipe.difficulty) }}>
              {recipe.difficulty}
            </span>
          </div>
          {completedSteps.size > 0 && (
            <div className="flex items-center gap-2">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ width: 80, background: "rgba(255,255,255,0.1)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progressPct}%`, background: "#22c55e" }}
                />
              </div>
              <span className="text-xs" style={{ color: "#22c55e" }}>{progressPct}%</span>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div
          className="flex rounded-2xl p-1 mb-5"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {(["ingredients", "steps", "nutrition"] as const).map(tab => (
            <button
              key={tab}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all"
              style={{
                background: activeTab === tab ? "rgba(34,197,94,0.2)" : "transparent",
                color: activeTab === tab ? "#22c55e" : "rgba(255,255,255,0.4)",
                border: activeTab === tab ? "1px solid rgba(34,197,94,0.3)" : "1px solid transparent",
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Ingredients tab ── */}
        {activeTab === "ingredients" && (
          <div>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
              Ingredients for {recipe.servings} serving{recipe.servings > 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}
                  >
                    <span className="text-[9px] font-bold" style={{ color: "#22c55e" }}>{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {ing.amount}{" "}
                    </span>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {ing.item}
                    </span>
                    {ing.note && (
                      <span className="text-xs ml-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                        ({ing.note})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Steps tab ── */}
        {activeTab === "steps" && (
          <div>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
              Tap a step to mark it complete
            </p>
            <div className="space-y-3">
              {recipe.steps.map(step => {
                const done = completedSteps.has(step.step);
                return (
                  <div
                    key={step.step}
                    className="flex gap-4 p-4 rounded-2xl cursor-pointer transition-all"
                    style={{
                      background: done ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)",
                      border: done ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                    onClick={() => toggleStep(step.step)}
                  >
                    {/* Step number / check */}
                    <div className="flex-shrink-0 mt-0.5">
                      {done
                        ? <CheckCircle2 size={22} style={{ color: "#22c55e" }} />
                        : (
                          <div
                            className="w-[22px] h-[22px] rounded-full flex items-center justify-center"
                            style={{
                              background: "rgba(255,255,255,0.08)",
                              border: "1.5px solid rgba(255,255,255,0.2)",
                            }}
                          >
                            <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
                              {step.step}
                            </span>
                          </div>
                        )
                      }
                    </div>

                    <div className="flex-1">
                      <h4
                        className="font-semibold text-sm mb-1"
                        style={{
                          color: done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.9)",
                          textDecoration: done ? "line-through" : "none",
                        }}
                      >
                        {step.title}
                      </h4>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.55)" }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tips */}
            {recipe.tips && (
              <div
                className="mt-5 p-4 rounded-2xl"
                style={{
                  background: "rgba(234,179,8,0.08)",
                  border: "1px solid rgba(234,179,8,0.2)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-base">💡</span>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#eab308" }}>Pro Tip</p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {recipe.tips}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Completion celebration */}
            {completedSteps.size === recipe.steps.length && recipe.steps.length > 0 && (
              <div
                className="mt-5 p-5 rounded-2xl text-center"
                style={{
                  background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))",
                  border: "1px solid rgba(34,197,94,0.3)",
                }}
              >
                <div className="text-3xl mb-2">🎉</div>
                <p className="font-bold text-base mb-1" style={{ color: "#22c55e" }}>Recipe Complete!</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Enjoy your {recipe.name}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Nutrition tab ── */}
        {activeTab === "nutrition" && (
          <div>
            <div
              className="p-4 rounded-2xl mb-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                Nutrition Facts
              </p>
              <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                Per serving · {recipe.servings} serving{recipe.servings > 1 ? "s" : ""} total
              </p>

              {/* Calories highlight */}
              <div
                className="flex items-center justify-between p-3 rounded-xl mb-3"
                style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}
              >
                <span className="font-bold text-base" style={{ color: "rgba(255,255,255,0.9)" }}>Calories</span>
                <span className="font-bold text-2xl" style={{ color: "#f97316" }}>{recipe.nutrition.calories}</span>
              </div>

              <NutritionRow label="Protein" value={recipe.nutrition.protein} unit="g" color="#22c55e" />
              <NutritionRow label="Total Carbohydrates" value={recipe.nutrition.carbs} unit="g" color="#eab308" />
              <NutritionRow label="Dietary Fiber" value={recipe.nutrition.fiber} unit="g" color="#84cc16" />
              <NutritionRow label="Total Sugars" value={recipe.nutrition.sugar} unit="g" color="#fb923c" />
              <NutritionRow label="Total Fat" value={recipe.nutrition.fat} unit="g" color="#60a5fa" />
              <NutritionRow label="Sodium" value={recipe.nutrition.sodium} unit="mg" color="#a78bfa" />
            </div>

            {/* Cost breakdown */}
            <div
              className="p-4 rounded-2xl"
              style={{
                background: "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.15)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={14} style={{ color: "#22c55e" }} />
                <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>Cost Estimate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Per serving</span>
                <span className="text-lg font-bold" style={{ color: "#22c55e" }}>
                  ${recipe.costPerServing.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Total ({recipe.servings} servings)
                </span>
                <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                  ${(recipe.costPerServing * recipe.servings).toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                * Estimated based on average US grocery prices. Actual cost may vary.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
