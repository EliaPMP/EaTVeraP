/**
 * WeeklyReportCard — Summary card for the Log tab
 * Shows: avg quality score, total calories, most-logged meal type, AI tip
 * Tip is cached per ISO week in localStorage and regenerated every Monday.
 */
import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Flame, Utensils, Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MealLogEntry {
  id: string;
  analysis: {
    totalCalories: number;
    qualityScore: number;
    mealName: string;
    warnings?: string[];
  };
  analyzedAt: string;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
}

interface WeekStats {
  weekLabel: string;        // e.g. "2026-W18"
  weekDisplay: string;      // e.g. "Apr 28 – May 4"
  avgQualityScore: number;
  totalCalories: number;
  totalMeals: number;
  mostLoggedMealType: string;
  topWarnings: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getISOWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMon);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatWeekDisplay(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

function getScoreColor(score: number): string {
  if (score >= 75) return "#0B3D2E";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  return "Needs Work";
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  untagged: "Untagged",
};

const MEAL_TYPE_ICONS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
  untagged: "🍽️",
};

// ─── Component ────────────────────────────────────────────────────────────────
interface WeeklyReportCardProps {
  mealLog: MealLogEntry[];
}

export default function WeeklyReportCard({ mealLog }: WeeklyReportCardProps) {
  const [stats, setStats] = useState<WeekStats | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [tipLoading, setTipLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const weeklyTipMutation = trpc.calorie.weeklyTip.useMutation();

  // ── Compute stats for the current ISO week ──────────────────────────────────
  useEffect(() => {
    const now = new Date();
    const weekLabel = getISOWeekLabel(now);
    const { start, end } = getWeekBounds(now);
    const weekDisplay = formatWeekDisplay(start, end);

    const weekEntries = mealLog.filter(e => {
      const d = new Date(e.analyzedAt);
      return d >= start && d <= end;
    });

    if (weekEntries.length === 0) {
      setStats(null);
      return;
    }

    const avgQualityScore = Math.round(
      weekEntries.reduce((s, e) => s + e.analysis.qualityScore, 0) / weekEntries.length
    );
    const totalCalories = Math.round(
      weekEntries.reduce((s, e) => s + e.analysis.totalCalories, 0)
    );
    const totalMeals = weekEntries.length;

    // Most logged meal type
    const typeCounts: Record<string, number> = {};
    weekEntries.forEach(e => {
      const key = e.mealType ?? "untagged";
      typeCounts[key] = (typeCounts[key] ?? 0) + 1;
    });
    const mostLoggedMealType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "snack";

    // Collect top warnings
    const warningCounts: Record<string, number> = {};
    weekEntries.forEach(e => {
      (e.analysis.warnings ?? []).forEach(w => {
        warningCounts[w] = (warningCounts[w] ?? 0) + 1;
      });
    });
    const topWarnings = Object.entries(warningCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([w]) => w);

    setStats({ weekLabel, weekDisplay, avgQualityScore, totalCalories, totalMeals, mostLoggedMealType, topWarnings });
  }, [mealLog]);

  // ── Load or generate AI tip ─────────────────────────────────────────────────
  const loadTip = useCallback(async (s: WeekStats, force = false) => {
    const cacheKey = `eatvera-weekly-tip-${s.weekLabel}`;
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setTip(cached);
          return;
        }
      } catch { /* ignore */ }
    }
    setTipLoading(true);
    try {
      const result = await weeklyTipMutation.mutateAsync({
        avgQualityScore: s.avgQualityScore,
        totalCalories: s.totalCalories,
        totalMeals: s.totalMeals,
        mostLoggedMealType: s.mostLoggedMealType,
        topWarnings: s.topWarnings,
        weekLabel: s.weekLabel,
      });
      setTip(result.tip);
      try { localStorage.setItem(cacheKey, result.tip); } catch { /* ignore */ }
    } catch {
      setTip("Keep logging your meals consistently — data builds better insights each week.");
    } finally {
      setTipLoading(false);
    }
  }, [weeklyTipMutation]);

  useEffect(() => {
    if (stats) loadTip(stats);
  }, [stats]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stats) return null;

  const scoreColor = getScoreColor(stats.avgQualityScore);
  const scoreLabel = getScoreLabel(stats.avgQualityScore);
  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (stats.avgQualityScore / 100) * circumference;

  return (
    <div
      className="rounded-2xl mb-4 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0B3D2E 0%, #1a5c3a 60%, #0d4a2e 100%)",
        boxShadow: "0 4px 24px rgba(11,61,46,0.22)",
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
            <TrendingUp size={14} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em" }}>
              This Week
            </div>
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'DM Mono', monospace" }}>
              {stats.weekDisplay}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
            {stats.totalMeals} meal{stats.totalMeals !== 1 ? "s" : ""}
          </span>
          {collapsed
            ? <ChevronDown size={14} className="text-white opacity-60" />
            : <ChevronUp size={14} className="text-white opacity-60" />
          }
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 px-4 pb-3">
            {/* Quality score ring */}
            <div className="flex flex-col items-center gap-1">
              <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
                <svg width={52} height={52} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={26} cy={26} r={22} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={3.5} />
                  <circle
                    cx={26} cy={26} r={22} fill="none"
                    stroke={stats.avgQualityScore >= 75 ? "#4ade80" : stats.avgQualityScore >= 50 ? "#fbbf24" : "#f87171"}
                    strokeWidth={3.5}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute font-bold text-sm text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {stats.avgQualityScore}
                </span>
              </div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>Avg Score</div>
              <div className="text-[10px] font-bold" style={{ color: stats.avgQualityScore >= 75 ? "#4ade80" : stats.avgQualityScore >= 50 ? "#fbbf24" : "#f87171" }}>
                {scoreLabel}
              </div>
            </div>

            {/* Total calories */}
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(249,115,22,0.18)" }}>
                <Flame size={18} style={{ color: "#fb923c" }} />
              </div>
              <div className="text-white font-bold text-base" style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em" }}>
                {stats.totalCalories.toLocaleString()}
              </div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>Total kcal</div>
            </div>

            {/* Most logged meal type */}
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
                {MEAL_TYPE_ICONS[stats.mostLoggedMealType] ?? "🍽️"}
              </div>
              <div className="text-white font-bold text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {MEAL_TYPE_LABELS[stats.mostLoggedMealType] ?? stats.mostLoggedMealType}
              </div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>Top Meal</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginLeft: 16, marginRight: 16 }} />

          {/* AI Tip */}
          <div className="px-4 py-3">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(255,255,255,0.12)" }}>
                <Sparkles size={12} className="text-yellow-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                  EatVera Tip for Next Week
                </div>
                {tipLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white/80 animate-spin" />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Generating your tip…</span>
                  </div>
                ) : tip ? (
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.88)", fontFamily: "'DM Sans', sans-serif" }}>
                    {tip}
                  </p>
                ) : null}
              </div>
              {/* Refresh tip button */}
              {!tipLoading && (
                <button
                  onClick={(e) => { e.stopPropagation(); loadTip(stats, true); }}
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all active:scale-90"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                  title="Regenerate tip"
                >
                  <RefreshCw size={11} className="text-white opacity-50" />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
