/**
 * WeeklyGoalChart — 7-day goal consistency chart for NutritionGoalsPage
 *
 * For each active DB nutrition goal, shows a row of 7 day-dots (Mon–Sun)
 * colored green (met), amber (within 20% of target), or red (missed).
 * Totals come from the localStorage meal log via useCalorieGoals.
 */
import { useCalorieGoals } from "@/hooks/useCalorieGoals";
import { TrendingDown, TrendingUp, CalendarDays } from "lucide-react";

interface GoalRow {
  id: number;
  nutrientKey: string;
  nutrientLabel: string;
  targetType: "min" | "max";
  targetValue: number;
  unit: string;
}

interface WeeklyGoalChartProps {
  goals: GoalRow[];
}

/**
 * Maps a DB nutrient key to the corresponding field in the meal log macros.
 * The meal log only tracks calories, protein, carbs, fat, fiber, sugar.
 */
const NUTRIENT_KEY_TO_LOG_FIELD: Record<string, keyof {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}> = {
  "energy-kcal_100g": "calories",
  "proteins_100g": "protein",
  "carbohydrates_100g": "carbs",
  "fat_100g": "fat",
  "fiber_100g": "fiber",
  "sugars_100g": "sugar",
};

type DayStatus = "met" | "partial" | "missed" | "empty";

function getDayStatus(
  actual: number,
  target: number,
  type: "min" | "max",
  hasData: boolean
): DayStatus {
  if (!hasData) return "empty";
  if (type === "max") {
    if (actual <= target) return "met";
    if (actual <= target * 1.2) return "partial";
    return "missed";
  } else {
    // min goal
    if (actual >= target) return "met";
    if (actual >= target * 0.8) return "partial";
    return "missed";
  }
}

const STATUS_COLORS: Record<DayStatus, string> = {
  met: "#145A3A",
  partial: "#d97706",
  missed: "#dc2626",
  empty: "#e7e5e4",
};

const STATUS_BG: Record<DayStatus, string> = {
  met: "#dcfce7",
  partial: "#fef3c7",
  missed: "#fee2e2",
  empty: "#f5f5f4",
};

export default function WeeklyGoalChart({ goals }: WeeklyGoalChartProps) {
  const { last7Days } = useCalorieGoals();

  // Only show goals that map to a meal log field
  const trackableGoals = goals.filter((g) => NUTRIENT_KEY_TO_LOG_FIELD[g.nutrientKey]);

  if (trackableGoals.length === 0) {
    return (
      <div className="ec-card p-4 text-center">
        <CalendarDays size={28} className="mx-auto mb-2 text-stone-300" />
        <p className="text-sm text-stone-500 font-medium">No trackable goals yet</p>
        <p className="text-xs text-stone-400 mt-1 leading-relaxed">
          Add goals for calories, protein, carbs, fat, fiber, or sugar to see your 7-day consistency.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Day labels header */}
      <div className="flex items-center gap-1 px-0.5">
        <div className="w-28 flex-shrink-0" />
        {last7Days.map((day, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[9px] font-mono font-semibold text-stone-400 uppercase tracking-wider"
          >
            {day.label}
          </div>
        ))}
      </div>

      {/* One row per trackable goal */}
      {trackableGoals.map((goal) => {
        const logField = NUTRIENT_KEY_TO_LOG_FIELD[goal.nutrientKey];
        const isMax = goal.targetType === "max";

        const dayStatuses = last7Days.map((day) => {
          const hasData = day.mealCount > 0;
          // Sum the relevant macro across all meals that day
          const actual = day[logField as keyof typeof day] as number ?? 0;
          return {
            status: getDayStatus(actual, goal.targetValue, goal.targetType, hasData),
            actual,
            hasData,
          };
        });

        const metCount = dayStatuses.filter((d) => d.status === "met").length;
        const daysWithData = dayStatuses.filter((d) => d.hasData).length;
        const consistency = daysWithData > 0 ? Math.round((metCount / daysWithData) * 100) : null;

        return (
          <div key={goal.id} className="ec-card p-3">
            {/* Goal label row */}
            <div className="flex items-center gap-2 mb-2.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: isMax ? "#fee2e2" : "#dcfce7" }}
              >
                {isMax ? (
                  <TrendingDown size={12} style={{ color: "#dc2626" }} />
                ) : (
                  <TrendingUp size={12} style={{ color: "#145A3A" }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-stone-700 truncate block">{goal.nutrientLabel}</span>
                <span className="text-[10px] text-stone-400">
                  {isMax ? "≤" : "≥"} {goal.targetValue.toLocaleString()} {goal.unit}/day
                </span>
              </div>
              {consistency !== null && (
                <div
                  className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md"
                  style={{
                    color: consistency >= 80 ? "#145A3A" : consistency >= 50 ? "#d97706" : "#dc2626",
                    background: consistency >= 80 ? "#dcfce7" : consistency >= 50 ? "#fef3c7" : "#fee2e2",
                  }}
                >
                  {consistency}%
                </div>
              )}
            </div>

            {/* 7-day dot row */}
            <div className="flex items-center gap-1">
              {dayStatuses.map((ds, i) => (
                <div
                  key={i}
                  className="flex-1 h-7 rounded-lg flex items-end justify-center pb-1 relative group cursor-default"
                  style={{ background: STATUS_BG[ds.status] }}
                  title={
                    ds.hasData
                      ? `${last7Days[i].label}: ${Math.round(ds.actual).toLocaleString()} ${goal.unit} (${ds.status})`
                      : `${last7Days[i].label}: no data`
                  }
                >
                  {/* Bar fill */}
                  {ds.hasData && (
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-lg transition-all"
                      style={{
                        background: STATUS_COLORS[ds.status],
                        opacity: 0.25,
                        height: `${Math.min(100, (ds.actual / (goal.targetValue * 1.5)) * 100)}%`,
                        minHeight: "4px",
                      }}
                    />
                  )}
                  {/* Status dot */}
                  <div
                    className="w-2 h-2 rounded-full relative z-10"
                    style={{ background: STATUS_COLORS[ds.status] }}
                  />
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-2">
              {(["met", "partial", "missed"] as DayStatus[]).map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s] }} />
                  <span className="text-[9px] text-stone-400 capitalize">{s}</span>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS.empty }} />
                <span className="text-[9px] text-stone-400">No data</span>
              </div>
            </div>
          </div>
        );
      })}

      <p className="text-[10px] text-stone-400 text-center px-2">
        Based on your Calorie Scanner meal log · Only calorie-tracked nutrients shown
      </p>
    </div>
  );
}
