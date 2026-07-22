/**
 * NutritionGoalProgress
 * Shows today's logged meal nutrient totals vs the user's active Nutrition Goals.
 * Reads meal totals from localStorage (useCalorieGoals) and goals from the DB (trpc.goals.getGoals).
 * Renders a compact progress card for each matching goal.
 */
import { useMemo } from "react";
import { Target, TrendingUp, TrendingDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCalorieGoals } from "@/hooks/useCalorieGoals";

// Map from DB nutrientKey → today's totals field name (only macros are tracked in meal log)
const NUTRIENT_TO_TODAY: Record<string, { label: string; unit: string; getValue: (t: ReturnType<typeof useCalorieGoals>["todayTotals"]) => number }> = {
  "proteins_100g":      { label: "Protein",    unit: "g",  getValue: t => t.protein },
  "carbohydrates_100g": { label: "Carbs",       unit: "g",  getValue: t => t.carbs },
  "fat_100g":           { label: "Fat",         unit: "g",  getValue: t => t.fat },
  "fiber_100g":         { label: "Fiber",       unit: "g",  getValue: t => 0 }, // not tracked in meal log
  "sugars_100g":        { label: "Sugar",       unit: "g",  getValue: t => 0 },
  "sodium_100g":        { label: "Sodium",      unit: "mg", getValue: t => 0 },
  "energy-kcal_100g":   { label: "Calories",    unit: "kcal", getValue: t => t.calories },
};

// Extend today's totals with fiber/sugar from the raw meal log
function useTodayExtendedTotals() {
  const { todayEntries, todayTotals } = useCalorieGoals();
  const fiber = todayEntries.reduce((s, e) => s + (e.analysis.macros.fiber ?? 0), 0);
  const sugar = todayEntries.reduce((s, e) => s + (e.analysis.macros.sugar ?? 0), 0);
  return { ...todayTotals, fiber, sugar };
}

function GoalProgressRow({
  label,
  unit,
  consumed,
  target,
  targetType,
}: {
  label: string;
  unit: string;
  consumed: number;
  target: number;
  targetType: "min" | "max";
}) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  const overTarget = consumed > target;

  // Color logic
  let barColor: string;
  let statusColor: string;
  let statusText: string;

  if (targetType === "max") {
    if (overTarget) {
      barColor = "#dc2626";
      statusColor = "#dc2626";
      statusText = `Over by ${Math.round(consumed - target)}${unit}`;
    } else if (pct >= 80) {
      barColor = "#d97706";
      statusColor = "#d97706";
      statusText = `${Math.round(target - consumed)}${unit} remaining`;
    } else {
      barColor = "#0B3D2E";
      statusColor = "#78716c";
      statusText = `${Math.round(target - consumed)}${unit} remaining`;
    }
  } else {
    // min goal — higher is better
    if (pct >= 100) {
      barColor = "#0B3D2E";
      statusColor = "#0B3D2E";
      statusText = "Goal met!";
    } else if (pct >= 50) {
      barColor = "#d97706";
      statusColor = "#d97706";
      statusText = `${Math.round(target - consumed)}${unit} to go`;
    } else {
      barColor = "#e5e7eb";
      statusColor = "#78716c";
      statusText = `${Math.round(target - consumed)}${unit} to go`;
    }
  }

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {targetType === "max"
            ? <TrendingDown size={11} style={{ color: barColor }} />
            : <TrendingUp size={11} style={{ color: barColor }} />
          }
          <span className="text-xs font-semibold text-stone-700">{label}</span>
          <span className="text-[10px] text-stone-400 font-mono">
            {targetType === "max" ? "≤" : "≥"}{Math.round(target)}{unit}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold font-mono" style={{ color: barColor }}>
            {Math.round(consumed)}{unit}
          </span>
          <span className="text-[10px]" style={{ color: statusColor }}>
            · {statusText}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: overTarget && targetType === "max"
              ? "linear-gradient(90deg, #dc2626, #f87171)"
              : barColor,
          }}
        />
      </div>
    </div>
  );
}

export default function NutritionGoalProgress() {
  const { data: goals, isLoading: goalsLoading } = trpc.goals.getGoals.useQuery(undefined);
  const todayTotals = useTodayExtendedTotals();

  // Only show goals that have a matching nutrient in the meal log
  const matchedGoals = useMemo(() => {
    if (!goals || goals.length === 0) return [];
    return goals
      .map(g => {
        const mapping = NUTRIENT_TO_TODAY[g.nutrientKey];
        if (!mapping) return null;
        const consumed = mapping.getValue(todayTotals as ReturnType<typeof useCalorieGoals>["todayTotals"]);
        // For fiber/sugar, use extended totals
        const extConsumed = g.nutrientKey === "fiber_100g"
          ? (todayTotals as any).fiber
          : g.nutrientKey === "sugars_100g"
            ? (todayTotals as any).sugar
            : consumed;
        return {
          ...g,
          label: mapping.label,
          unit: mapping.unit,
          consumed: extConsumed,
        };
      })
      .filter(Boolean) as Array<{
        id: number;
        nutrientKey: string;
        targetType: "min" | "max";
        targetValue: number;
        label: string;
        unit: string;
        consumed: number;
      }>;
  }, [goals, todayTotals]);

  if (goalsLoading) return null;

  if (!matchedGoals.length) {
    return (
      <div className="rounded-2xl border border-stone-100 bg-white p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-stone-400" />
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Nutrition Goals</span>
          </div>
        </div>
        <p className="text-xs text-stone-400 leading-relaxed">
          No nutrition goals set yet.{" "}
          <a href="/goals" className="text-[#0B3D2E] font-semibold underline">Set goals</a>
          {" "}to track your daily intake here.
        </p>
      </div>
    );
  }

  const metCount = matchedGoals.filter(g => {
    if (g.targetType === "max") return g.consumed <= g.targetValue;
    return g.consumed >= g.targetValue;
  }).length;

  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0B3D2E, #4ade80)" }}>
            <Target size={12} className="text-white" />
          </div>
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Today's Goal Progress</span>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: metCount === matchedGoals.length ? "#dcfce7" : "#f5f5f4",
            color: metCount === matchedGoals.length ? "#0B3D2E" : "#78716c",
          }}
        >
          {metCount}/{matchedGoals.length} met
        </span>
      </div>
      {matchedGoals.map(g => (
        <GoalProgressRow
          key={g.id}
          label={g.label}
          unit={g.unit}
          consumed={g.consumed}
          target={g.targetValue}
          targetType={g.targetType}
        />
      ))}
      <p className="text-[9px] text-stone-300 mt-2 text-right">
        Based on today's logged meals · <a href="/goals" className="underline">Edit goals</a>
      </p>
    </div>
  );
}
