/**
 * WeeklyNutritionReport — extends the Scan History page with calorie scanner data
 * Shows: 7-day calorie bar chart, macro split donut, avg daily calories,
 * best meal quality score, worst meal quality score.
 */
import { useCalorieGoals } from "@/hooks/useCalorieGoals";
import { Flame, Beef, Wheat, Droplets, Star, TrendingUp, TrendingDown } from "lucide-react";

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function MacroDonut({
  protein, carbs, fat,
}: {
  protein: number; carbs: number; fat: number;
}) {
  const total = protein + carbs + fat;
  if (total === 0) {
    return (
      <div className="w-24 h-24 rounded-full border-4 border-stone-100 flex items-center justify-center">
        <span className="text-[10px] text-stone-300 text-center">No data</span>
      </div>
    );
  }

  const size = 96;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  const segments = [
    { value: protein, color: "#dc2626", label: "Protein" },
    { value: carbs, color: "#d97706", label: "Carbs" },
    { value: fat, color: "#2563eb", label: "Fat" },
  ];

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const dashArray = circ * pct;
    const dashOffset = circ - cumulative * circ;
    cumulative += pct;
    return { ...seg, pct, dashArray, dashOffset };
  });

  // Calorie contribution per gram
  const proteinCal = Math.round((protein * 4 / (protein * 4 + carbs * 4 + fat * 9)) * 100);
  const carbsCal = Math.round((carbs * 4 / (protein * 4 + carbs * 4 + fat * 9)) * 100);
  const fatCal = Math.round((fat * 9 / (protein * 4 + carbs * 4 + fat * 9)) * 100);

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f5f5f4" strokeWidth={stroke} />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              strokeDasharray={`${arc.dashArray} ${circ - arc.dashArray}`}
              strokeDashoffset={arc.dashOffset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[10px] text-stone-400 font-medium">Macros</div>
            <div className="text-xs font-bold text-stone-700">Split</div>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {[
          { label: "Protein", pct: proteinCal, grams: Math.round(protein / 7), color: "#dc2626", icon: Beef },
          { label: "Carbs", pct: carbsCal, grams: Math.round(carbs / 7), color: "#d97706", icon: Wheat },
          { label: "Fat", pct: fatCal, grams: Math.round(fat / 7), color: "#2563eb", icon: Droplets },
        ].map(({ label, pct, grams, color, icon: Icon }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
              <Icon size={9} style={{ color }} />
            </div>
            <span className="text-[10px] text-stone-500 w-10">{label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-[10px] font-bold text-stone-600 w-8 text-right" style={{ fontFamily: "'DM Mono', monospace" }}>
              {pct}%
            </span>
          </div>
        ))}
        <div className="text-[9px] text-stone-300 mt-1">avg/day · 7-day period</div>
      </div>
    </div>
  );
}

// ─── 7-Day Calorie Bar Chart ──────────────────────────────────────────────────
function CalorieBarChart({
  days, goal,
}: {
  days: Array<{ label: string; calories: number; mealCount: number }>;
  goal: number;
}) {
  const maxCal = Math.max(...days.map((d) => d.calories), goal, 1);

  return (
    <div>
      <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-3">
        7-Day Calorie Intake
      </p>
      <div className="flex items-end gap-1.5 h-20 relative">
        {/* Goal line */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-orange-300"
          style={{ bottom: `${(goal / maxCal) * 72}px` }}
        />
        {days.map((day, i) => {
          const height = day.calories > 0 ? Math.max((day.calories / maxCal) * 72, 4) : 4;
          const isToday = i === days.length - 1;
          const isOver = day.calories > goal;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md transition-all relative"
                style={{
                  height: `${height}px`,
                  background: day.calories === 0
                    ? "#e7e5e4"
                    : isOver ? "#dc2626" : isToday ? "#f97316" : "#fb923c",
                  opacity: day.calories === 0 ? 0.4 : 1,
                }}
              />
              <span className={`text-[9px] font-medium ${isToday ? "text-orange-500 font-bold" : "text-stone-400"}`}>
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-[9px] text-stone-400">Calories</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 border-t border-dashed border-orange-300" />
          <span className="text-[9px] text-stone-400">Goal ({goal} kcal)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[9px] text-stone-400">Over goal</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WeeklyNutritionReport() {
  const {
    goals,
    last7Days,
    weeklyAvgCalories,
    weeklyTotalMacros,
    bestMeal,
    worstMeal,
    allWeeklyEntries,
  } = useCalorieGoals();

  if (allWeeklyEntries.length === 0) return null;

  const daysWithData = last7Days.filter((d) => d.calories > 0).length;
  const avgVsGoal = weeklyAvgCalories - goals.dailyCalories;
  const isUnder = avgVsGoal <= 0;

  return (
    <div className="px-4 mb-4">
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-stone-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "#fff7ed" }}>
                <Flame size={14} style={{ color: "#f97316" }} />
              </div>
              <span className="font-bold text-stone-800 text-sm">Weekly Nutrition</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: isUnder ? "#f0fdf4" : "#fef2f2", color: isUnder ? "#0B3D2E" : "#dc2626" }}>
              {isUnder ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
              {weeklyAvgCalories} kcal avg
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-stone-50 border-b border-stone-50">
          <div className="px-3 py-3 text-center">
            <div className="text-base font-bold font-mono text-orange-500">{weeklyAvgCalories}</div>
            <div className="text-[10px] text-stone-400">Avg kcal/day</div>
          </div>
          <div className="px-3 py-3 text-center">
            <div className="text-base font-bold font-mono text-stone-700">{allWeeklyEntries.length}</div>
            <div className="text-[10px] text-stone-400">Meals logged</div>
          </div>
          <div className="px-3 py-3 text-center">
            <div className="text-base font-bold font-mono text-stone-700">{daysWithData}/7</div>
            <div className="text-[10px] text-stone-400">Days tracked</div>
          </div>
        </div>

        {/* Calorie bar chart */}
        <div className="px-4 pt-4 pb-3 border-b border-stone-50">
          <CalorieBarChart
            days={last7Days.map((d) => ({
              label: d.label,
              calories: d.calories,
              mealCount: d.mealCount,
            }))}
            goal={goals.dailyCalories}
          />
        </div>

        {/* Macro donut */}
        <div className="px-4 pt-4 pb-3 border-b border-stone-50">
          <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-3">
            Weekly Macro Split
          </p>
          <MacroDonut
            protein={weeklyTotalMacros.protein}
            carbs={weeklyTotalMacros.carbs}
            fat={weeklyTotalMacros.fat}
          />
        </div>

        {/* Best / Worst meal */}
        {(bestMeal || worstMeal) && (
          <div className="px-4 pt-3 pb-4">
            <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-2">
              Meal Quality Highlights
            </p>
            <div className="space-y-2">
              {bestMeal && (
                <div className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: "#f0fdf4" }}>
                  <img
                    src={bestMeal.imageUrl}
                    alt={bestMeal.analysis.mealName}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Star size={10} className="text-[#0B3D2E]" />
                      <span className="text-[10px] font-bold text-[#145A3A] uppercase tracking-wider">Best Meal</span>
                    </div>
                    <p className="text-xs font-semibold text-stone-700 truncate">{bestMeal.analysis.mealName}</p>
                    <p className="text-[10px] text-stone-400">{bestMeal.analysis.totalCalories} kcal</p>
                  </div>
                  <div className="text-sm font-bold" style={{ color: "#0B3D2E", fontFamily: "'DM Mono', monospace" }}>
                    {bestMeal.analysis.qualityScore}
                  </div>
                </div>
              )}
              {worstMeal && worstMeal.id !== bestMeal?.id && (
                <div className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: "#fef2f2" }}>
                  <img
                    src={worstMeal.imageUrl}
                    alt={worstMeal.analysis.mealName}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <TrendingDown size={10} className="text-red-500" />
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Needs Work</span>
                    </div>
                    <p className="text-xs font-semibold text-stone-700 truncate">{worstMeal.analysis.mealName}</p>
                    <p className="text-[10px] text-stone-400">{worstMeal.analysis.totalCalories} kcal</p>
                  </div>
                  <div className="text-sm font-bold" style={{ color: "#dc2626", fontFamily: "'DM Mono', monospace" }}>
                    {worstMeal.analysis.qualityScore}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
