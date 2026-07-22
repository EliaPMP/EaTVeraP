/**
 * EatVera — Scan History Page
 * Design: Organic Modernism — light, clean, health-forward
 * Shows personal scan log, average score, streaks, and category breakdown
 */

import { useState, useMemo } from "react";
import {
  BarChart2, Trash2, X, TrendingUp, TrendingDown, Minus,
  Calendar, Award, ShieldCheck, AlertTriangle, Package,
  Beef, Fish, ChevronRight, Flame, ClipboardList, Lightbulb, Target, Share2, ArrowLeft
} from "lucide-react";
import { hapticLight } from "@/lib/haptic";
import WeeklySummaryCard from "@/components/WeeklySummaryCard";
import { useScanHistory, type ScanRecord } from "@/hooks/useScanHistory";
import DailyCalorieProgress from "@/components/DailyCalorieProgress";
import WeeklyNutritionReport from "@/components/WeeklyNutritionReport";
import StreakBadgesCard from "@/components/StreakBadgesCard";
import ProductResult from "@/pages/ProductResult";
import type { FoodProduct } from "@/lib/foodApi";
import { OasisProductCard } from "@/components/OasisProductCard";

function ScoreRing({ score, color, size = 48 }: { score: number; color: string; size?: number }) {
  const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7e5e4" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute font-bold text-center" style={{ color, fontSize: size * 0.27, fontFamily: "'DM Mono', monospace" }}>
        {score}
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#145A3A";
  if (score >= 60) return "#0B3D2E";
  if (score >= 40) return "#d97706";
  if (score >= 20) return "#ea580c";
  return "#dc2626";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Poor";
  return "Avoid";
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function HistoryCard({ record, onSelect, onRemove }: {
  record: ScanRecord;
  onSelect: (p: FoodProduct) => void;
  onRemove: (id: string) => void;
}) {
  const color = getScoreColor(record.score);
  const p = record.product;

  return (
    <div className="relative">
      <OasisProductCard
        name={p.name}
        brand={p.brand || p.category}
        imageUrl={p.imageUrl}
        thumbnailUrl={p.thumbnailUrl}
        score={record.score}
        scoreColor={color}
        category={p.category || p.meatGrade?.type}
        onClick={() => onSelect(p)}
      />
      {/* Time badge */}
      <div className="absolute top-2 left-2 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
        {formatTimeAgo(record.scannedAt)}
      </div>
      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(record.id); }}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 dark:bg-stone-700/80 text-stone-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm"
        title="Remove"
      >
        <X size={11} />
      </button>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-stone-100 dark:border-stone-700 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold uppercase tracking-widest">{label}</span>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          {icon}
        </div>
      </div>
      <div className="font-bold text-2xl font-mono" style={{ color }}>{value}</div>
      {sub && <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-tight">{sub}</p>}
    </div>
  );
}

// ─── Weekly Report Card Component ───────────────────────────────────────────
function WeeklyReportCard({ history, stats }: { history: ScanRecord[]; stats: ReturnType<typeof computeStatsLocal> }) {
  const weekData = useMemo(() => {
    const now = new Date();
    const days: { label: string; date: string; scans: ScanRecord[]; avg: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toDateString();
      const dayScans = history.filter(r => new Date(r.scannedAt).toDateString() === dateStr);
      const avg = dayScans.length > 0 ? Math.round(dayScans.reduce((a, r) => a + r.score, 0) / dayScans.length) : 0;
      days.push({
        label: i === 0 ? "Today" : i === 1 ? "Yest" : d.toLocaleDateString("en-US", { weekday: "short" }),
        date: dateStr,
        scans: dayScans,
        avg,
      });
    }
    return days;
  }, [history]);

  const weekScans = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return history.filter(r => new Date(r.scannedAt) >= weekAgo);
  }, [history]);

  // Most scanned category this week
  const topCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    for (const r of weekScans) {
      const cat = r.product.category || "Other";
      cats[cat] = (cats[cat] || 0) + 1;
    }
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? sorted[0][0] : null;
  }, [weekScans]);

  // Personalized tip
  const tip = useMemo(() => {
    const wAvg = stats.weeklyAvg;
    const poorItems = weekScans.filter(r => r.score < 40);
    const SEED_OIL_TERMS = ["canola oil", "soybean oil", "sunflower oil", "corn oil", "cottonseed oil", "safflower oil", "vegetable oil"];
    const seedOilItems = weekScans.filter(r => {
      const ing = (r.product.ingredients || "").toLowerCase();
      return SEED_OIL_TERMS.some(t => ing.includes(t));
    });
    if (seedOilItems.length > 2) return `You scanned ${seedOilItems.length} products with seed oils this week. Try swapping to avocado oil or tallow-based alternatives.`;
    if (poorItems.length > 2) return `${poorItems.length} of your scans this week scored below 40. Check the Healthier Alternatives on each product to find better options.`;
    if (wAvg >= 75) return `Great week! Your average of ${wAvg} puts you in the top tier. Keep choosing whole, minimally processed foods.`;
    if (wAvg >= 55) return `Solid week with a ${wAvg} average. Try replacing one processed snack per day with a whole food option to push above 70.`;
    if (wAvg > 0) return `Your weekly average is ${wAvg}. Focus on reducing seed oils and ultra-processed foods — check the Learn tab for guidance.`;
    return "Scan some products this week to get your personalized weekly report!";
  }, [stats.weeklyAvg, weekScans]);

  if (weekScans.length === 0) return null;

  const maxBar = Math.max(...weekData.map(d => d.avg), 1);

  return (
    <div className="px-4 mb-4">
      <div className="bg-card rounded-2xl border border-stone-100 dark:border-stone-700 overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-stone-50 dark:border-stone-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-green-50 dark:bg-green-900/20">
                <ClipboardList size={14} style={{ color: "#3FA34D" }} />
              </div>
              <span className="font-bold text-stone-800 dark:text-stone-100 text-sm">Weekly Report Card</span>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full" style={{ background: getScoreColor(stats.weeklyAvg) + "15", color: getScoreColor(stats.weeklyAvg) }}>
              {stats.weeklyAvg} avg
            </span>
          </div>
        </div>

        {/* Bar chart — 7 day scores */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold uppercase tracking-widest mb-3">7-Day Score Trend</p>
          <div className="flex items-end gap-1.5 h-16">
            {weekData.map(day => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md transition-all" style={{
                  height: day.avg > 0 ? `${(day.avg / maxBar) * 52}px` : "4px",
                  background: day.avg > 0 ? getScoreColor(day.avg) : "#e7e5e4",
                  minHeight: "4px",
                  opacity: day.avg > 0 ? 1 : 0.4,
                }} />
                <span className="text-[9px] text-stone-400 dark:text-stone-500 font-medium">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-stone-50 dark:divide-stone-700/50 border-t border-stone-50 dark:border-stone-700/50">
          <div className="px-3 py-3 text-center">
            <div className="text-base font-bold font-mono" style={{ color: getScoreColor(stats.weeklyAvg) }}>{stats.weeklyAvg}</div>
            <div className="text-[10px] text-stone-400 dark:text-stone-500">Week Avg</div>
          </div>
          <div className="px-3 py-3 text-center">
            <div className="text-base font-bold font-mono text-stone-700 dark:text-stone-200">{weekScans.length}</div>
            <div className="text-[10px] text-stone-400 dark:text-stone-500">Scans</div>
          </div>
          <div className="px-3 py-3 text-center">
            <div className="text-base font-bold font-mono text-stone-700 dark:text-stone-200 truncate text-xs">{topCategory || "—"}</div>
            <div className="text-[10px] text-stone-400 dark:text-stone-500">Top Category</div>
          </div>
        </div>

        {/* Personalized tip */}
        <div className="mx-4 mb-4 mt-1 rounded-xl p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <Lightbulb size={14} className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{tip}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function computeStatsLocal(history: ScanRecord[]) {
  if (history.length === 0) return { weeklyAvg: 0, totalScans: 0, averageScore: 0, bestScore: 0, worstScore: 0, cleanCount: 0, cautionCount: 0, poorCount: 0, currentStreak: 0 };
  const scores = history.map(r => r.score);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekRecords = history.filter(r => new Date(r.scannedAt) >= weekAgo);
  return {
    totalScans: history.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    bestScore: Math.max(...scores),
    worstScore: Math.min(...scores),
    cleanCount: scores.filter(s => s >= 70).length,
    cautionCount: scores.filter(s => s >= 40 && s < 70).length,
    poorCount: scores.filter(s => s < 40).length,
    currentStreak: 0,
    weeklyAvg: weekRecords.length > 0 ? Math.round(weekRecords.reduce((a, r) => a + r.score, 0) / weekRecords.length) : 0,
  };
}

export default function ScanHistoryPage() {
  const { history, stats, clearHistory, removeRecord } = useScanHistory();
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const [filter, setFilter] = useState<"all" | "clean" | "caution" | "poor">("all");

  if (selectedProduct) {
    return <ProductResult product={selectedProduct} onBack={() => setSelectedProduct(null)} />;
  }

  const filtered = history.filter((r) => {
    if (filter === "clean") return r.score >= 70;
    if (filter === "caution") return r.score >= 40 && r.score < 70;
    if (filter === "poor") return r.score < 40;
    return true;
  });

  // Group by date
  const grouped: { date: string; records: ScanRecord[] }[] = [];
  for (const record of filtered) {
    const dateStr = new Date(record.scannedAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const existing = grouped.find((g) => g.date === dateStr);
    if (existing) existing.records.push(record);
    else grouped.push({ date: dateStr, records: [record] });
  }

  const trendIcon = stats.weeklyAvg > stats.averageScore
    ? <TrendingUp size={14} style={{ color: "#145A3A" }} />
    : stats.weeklyAvg < stats.averageScore
    ? <TrendingDown size={14} style={{ color: "#dc2626" }} />
    : <Minus size={14} className="text-stone-400" />;

  return (
    <div className="ec-page-bg pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => { hapticLight(); window.history.back(); }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: "rgba(11,61,46,0.08)", border: "1px solid rgba(11,61,46,0.12)" }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} style={{ color: "#0B3D2E" }} />
          </button>
          <div className="flex-1" />
          {history.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWeeklySummary(true)}
                className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 transition-colors px-3 py-1.5 rounded-xl hover:bg-green-50"
                title="Share weekly summary"
              >
                <Share2 size={13} />
                Share
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50"
              >
                <Trash2 size={13} />
                Clear
              </button>
            </div>
          )}
        </div>
        <div className="mb-1">
          <h1 className="font-bold text-2xl text-stone-800 dark:text-stone-100" style={{ letterSpacing: "-0.02em" }}>
            Scan History
          </h1>
        </div>
        <p className="text-stone-400 dark:text-stone-500 text-sm">
          {stats.totalScans > 0 ? `${stats.totalScans} products scanned` : "No scans yet — start scanning!"}
        </p>
      </div>

      {history.length === 0 ? (
        /* Empty state */
        <div className="px-5 py-16 text-center">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0faf0, #dcf4dc)" }}>
            <BarChart2 size={36} style={{ color: "#0B3D2E" }} />
          </div>
          <h2 className="font-bold text-stone-700 dark:text-stone-200 text-lg mb-2">No scans yet</h2>
          <p className="text-stone-400 dark:text-stone-500 text-sm leading-relaxed max-w-xs mx-auto">
            Scan your first product to start tracking your food quality. Your history will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="px-4 mb-4 grid grid-cols-2 gap-2.5">
            <StatCard
              label="Avg Score"
              value={stats.averageScore}
              sub={`${stats.weeklyAvg > 0 ? `This week: ${stats.weeklyAvg}` : "Scan more to see weekly avg"}`}
              color={getScoreColor(stats.averageScore)}
              icon={<BarChart2 size={14} style={{ color: getScoreColor(stats.averageScore) }} />}
            />
            <StatCard
              label="Streak"
              value={`${stats.currentStreak}d`}
              sub={stats.currentStreak > 0 ? "Consecutive days scanning" : "Scan today to start a streak"}
              color="#d97706"
              icon={<Flame size={14} style={{ color: "#d97706" }} />}
            />
            <StatCard
              label="Best Scan"
              value={stats.bestScore}
              sub="Highest quality product"
              color="#145A3A"
              icon={<Award size={14} style={{ color: "#145A3A" }} />}
            />
            <StatCard
              label="Total Scans"
              value={stats.totalScans}
              sub={`${stats.cleanCount} clean · ${stats.cautionCount} caution · ${stats.poorCount} poor`}
              color="#0B3D2E"
              icon={<Calendar size={14} style={{ color: "#0B3D2E" }} />}
            />
          </div>

          {/* Quality breakdown bar */}
          <div className="px-4 mb-4">
            <div className="bg-card rounded-2xl p-4 border border-stone-100 dark:border-stone-700">
              <p className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold uppercase tracking-widest mb-3">Quality Breakdown</p>
              <div className="flex rounded-xl overflow-hidden h-3 mb-2">
                {stats.cleanCount > 0 && (
                  <div style={{ width: `${(stats.cleanCount / stats.totalScans) * 100}%`, background: "#0B3D2E" }} />
                )}
                {stats.cautionCount > 0 && (
                  <div style={{ width: `${(stats.cautionCount / stats.totalScans) * 100}%`, background: "#d97706" }} />
                )}
                {stats.poorCount > 0 && (
                  <div style={{ width: `${(stats.poorCount / stats.totalScans) * 100}%`, background: "#dc2626" }} />
                )}
              </div>
              <div className="flex gap-4">
                {[
                  { label: "Clean (70+)", count: stats.cleanCount, color: "#0B3D2E" },
                  { label: "Caution (40-69)", count: stats.cautionCount, color: "#d97706" },
                  { label: "Poor (<40)", count: stats.poorCount, color: "#dc2626" },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-[10px] text-stone-500 dark:text-stone-400">{label}: <span className="font-semibold" style={{ color }}>{count}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly trend */}
          {stats.weeklyAvg > 0 && (
            <div className="px-4 mb-4">
              <div className="rounded-2xl p-3.5 flex items-center gap-3"
                style={{ background: stats.weeklyAvg >= stats.averageScore ? "#f0faf0" : "#fff7ed", border: `1px solid ${stats.weeklyAvg >= stats.averageScore ? "#b8e8b8" : "#fed7aa"}` }}>
                {trendIcon}
                <p className="text-xs font-medium" style={{ color: stats.weeklyAvg >= stats.averageScore ? "#145A3A" : "#d97706" }}>
                  {stats.weeklyAvg >= stats.averageScore
                    ? `Your food quality is improving! This week's avg: ${stats.weeklyAvg} vs all-time: ${stats.averageScore}`
                    : `This week's avg (${stats.weeklyAvg}) is below your all-time avg (${stats.averageScore}). Try some cleaner options!`}
                </p>
              </div>
            </div>
          )}

          {/* ─── STREAK & BADGES ─── */}
          <StreakBadgesCard />

          {/* ─── DAILY CALORIE PROGRESS ─── */}
          <div className="px-4">
            <DailyCalorieProgress compact />
          </div>

          {/* ─── WEEKLY REPORT CARD ─── */}
          <WeeklyReportCard history={history} stats={stats} />

          {/* ─── WEEKLY NUTRITION REPORT (calorie scanner data) ─── */}
          <WeeklyNutritionReport />

          {/* Filter tabs */}
          <div className="flex gap-1.5 px-4 mb-3 overflow-x-auto scrollbar-hide">
            {([
              { id: "all", label: `All (${history.length})` },
              { id: "clean", label: `Clean (${stats.cleanCount})`, color: "#0B3D2E" },
              { id: "caution", label: `Caution (${stats.cautionCount})`, color: "#d97706" },
              { id: "poor", label: `Poor (${stats.poorCount})`, color: "#dc2626" },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filter === id ? "" : "bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400"}`}
                style={filter === id ? { background: "#0B3D2E", color: "white" } : {}}
              >
                {label}
              </button>
            ))}
          </div>

          {/* History list grouped by date */}
          <div className="px-4 space-y-4">
            {grouped.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-stone-400 dark:text-stone-500 text-sm">No scans match this filter</p>
              </div>
            ) : (
              grouped.map(({ date, records }) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={11} className="text-stone-300" />
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">{date}</span>
                    <div className="flex-1 h-px bg-stone-100 dark:bg-stone-700" />
                    <span className="text-[10px] text-stone-300 dark:text-stone-600 font-mono">
                      avg {Math.round(records.reduce((a, r) => a + r.score, 0) / records.length)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {records.map((record) => (
                      <HistoryCard
                        key={record.id}
                        record={record}
                        onSelect={setSelectedProduct}
                        onRemove={removeRecord}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Weekly Summary modal */}
      {showWeeklySummary && (
        <WeeklySummaryCard
          stats={{
            weeklyAvg: stats.weeklyAvg,
            totalScans: stats.totalScans,
            totalCalories: 2500,
            avgProtein: 120,
            avgCarbs: 280,
            avgFat: 85,
            bestMeal: history.length > 0 ? { name: history.reduce((a, b) => a.score > b.score ? a : b).product.name, score: stats.bestScore } : null,
            worstMeal: history.length > 0 ? { name: history.reduce((a, b) => a.score < b.score ? a : b).product.name, score: stats.worstScore } : null,
            currentStreak: stats.currentStreak,
            dailyScores: (() => {
              const days: number[] = [];
              for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                d.setHours(0, 0, 0, 0);
                const dateStr = d.toDateString();
                const dayScans = history.filter(r => new Date(r.scannedAt).toDateString() === dateStr);
                const avg = dayScans.length > 0 ? Math.round(dayScans.reduce((a, r) => a + r.score, 0) / dayScans.length) : 0;
                days.push(avg);
              }
              return days;
            })()
          }}
          onClose={() => setShowWeeklySummary(false)}
        />
      )}

      {/* Clear confirm modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="bg-card rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
              <Trash2 size={24} style={{ color: "#dc2626" }} />
            </div>
            <h3 className="font-bold text-stone-800 dark:text-stone-100 text-base mb-2">Clear History?</h3>
            <p className="text-stone-400 dark:text-stone-500 text-sm mb-5">This will permanently delete all {stats.totalScans} scan records. This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => { clearHistory(); setShowClearConfirm(false); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: "#dc2626" }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
