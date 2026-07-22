/**
 * EatVera — Track Page (v3)
 * New features:
 *  - Steps / Calories Burned: tap card to enter value inline, saved to localStorage
 *  - "This Week" summary card: avg daily calories + avg quality score + trend arrows
 *  - Swipe left/right to navigate between days (updates calendar pill too)
 */
import {
  useState, useMemo, useCallback, useRef, useEffect,
} from "react";
import confetti from "canvas-confetti";
import { useLocation } from "wouter";
import { useCalorieGoals, MealLogEntry } from "@/hooks/useCalorieGoals";
import { useStreakBadges } from "@/hooks/useStreakBadges";
import { getActivity, setActivity, getWeekActivity } from "@/hooks/useActivityLog";
import {
  Flame, Plus, Camera, MoreVertical, Footprints, Zap,
  Trash2, TrendingUp, TrendingDown, Minus, Check, Leaf,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_ABBREVS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeDate(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

function buildDateStrip(centerDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(centerDate);
    d.setDate(centerDate.getDate() - 3 + i);
    return normalizeDate(d);
  });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#0B3D2E";
  if (score >= 60) return "#3FA34D";
  if (score >= 40) return "#D97706";
  return "#DC2626";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "#E8F5EC";
  if (score >= 60) return "#F0FAF0";
  if (score >= 40) return "#FFF8ED";
  return "#FEF2F2";
}

function toDateKey(d: Date): string {
  return normalizeDate(d).toISOString().slice(0, 10);
}

// ─── Circular Progress Ring ──────────────────────────────────────────────────

function CalorieRing({ progress, size = 100, goalGlow = false }: { progress: number; size?: number; goalGlow?: boolean }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.min(progress, 1) * circumference;

  const strokeColor = "#4ade80"; // mint green

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
      {goalGlow && (
        <defs>
          <filter id="ringGlow" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F0EDE8" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={strokeColor} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ filter: goalGlow ? "url(#ringGlow)" : undefined }}
      />
    </svg>
  );
}

// ─── Macro Card ─────────────────────────────────────────────────────────────

function MacroCard({ label, current, goal, color, animKey, delay = 0 }: {
  label: string; current: number; goal: number; color: string; animKey: number; delay?: number;
}) {
  const targetPct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const targetVal = Math.round(current);
  const [barWidth, setBarWidth] = useState(0);
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    setBarWidth(0);
    setDisplayVal(0);
    const timer = setTimeout(() => {
      const duration = 650;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        // ease-out-expo: extremely fast start, smooth deceleration
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setBarWidth(eased * targetPct);
        setDisplayVal(Math.round(eased * targetVal));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey, targetPct, targetVal]);

  return (
    <div
      className="flex-1 rounded-2xl p-4 min-w-0"
      style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.04)" }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-2 whitespace-nowrap" style={{ color: "rgba(0,0,0,0.4)" }}>
        {label}
      </div>
      <div className="flex items-baseline gap-0.5 mb-3 whitespace-nowrap overflow-hidden">
        <span className="font-bold" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em", fontSize: 16 }}>
          {displayVal}g
        </span>
        <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.3)" }}>/{goal}g</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: color, transition: "none" }} />
      </div>
    </div>
  );
}

// ─── Activity Card (Steps / Burned) with inline edit ────────────────────────

function ActivityCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  unit,
  onSave,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: number;
  label: string;
  unit: string;
  onSave: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(value > 0 ? String(value) : "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const confirm = () => {
    const n = Math.max(0, parseInt(draft, 10) || 0);
    onSave(n);
    setEditing(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") confirm();
    if (e.key === "Escape") setEditing(false);
  };

  return (
    <div
      className="flex-1 flex items-center rounded-2xl cursor-pointer active:scale-[0.97] transition-transform"
      style={{
        background: "white",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
        padding: "13px 12px",
        gap: 10,
      }}
      onClick={() => !editing && startEdit()}
    >
      {/* Icon in soft circle — never shrinks */}
      <div
        className="flex items-center justify-center"
        style={{ width: 36, height: 36, minWidth: 36, borderRadius: "50%", background: iconBg, flexShrink: 0 }}
      >
        <Icon size={17} style={{ color: iconColor }} strokeWidth={2} />
      </div>

      {/* Text content — grows but never clips */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ fontSize: 9, fontWeight: 600, color: "rgba(0,0,0,0.38)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3, whiteSpace: "nowrap" }}
        >
          {label}
        </div>
        {editing ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              min={0}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKey}
              style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", width: 70, background: "transparent", border: "none", outline: "none" }}
              placeholder="0"
            />
            <button
              onClick={e => { e.stopPropagation(); confirm(); }}
              style={{ width: 20, height: 20, minWidth: 20, borderRadius: "50%", background: "#0B3D2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "none", cursor: "pointer" }}
            >
              <Check size={10} color="white" />
            </button>
          </div>
        ) : value > 0 ? (
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "#1a1a1a", whiteSpace: "nowrap" }}>
            {unit === "kcal" ? `${value.toLocaleString()} kcal` : value.toLocaleString()}
          </div>
        ) : (
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400, color: "rgba(0,0,0,0.28)", whiteSpace: "nowrap" }}>
            Tap to add
          </div>
        )}
      </div>

      {/* Right indicator — always fully visible */}
      {!editing && (
        <div
          style={{
            width: 22,
            height: 22,
            minWidth: 22,
            flexShrink: 0,
            borderRadius: "50%",
            background: value > 0 ? "rgba(0,0,0,0.05)" : iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {value > 0
            ? <Check size={11} color={iconColor} strokeWidth={2.5} />
            : <Plus size={11} color={iconColor} strokeWidth={2.5} />}
        </div>
      )}
    </div>
  );
}

// ─── Trend Arrow ─────────────────────────────────────────────────────────────

function TrendBadge({ current, previous, suffix = "" }: { current: number; previous: number; suffix?: string }) {
  if (previous === 0) return null;
  const diff = current - previous;
  const pct = Math.abs(Math.round((diff / previous) * 100));
  if (pct < 2) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: "rgba(0,0,0,0.35)" }}>
        <Minus size={10} />
        Same{suffix}
      </span>
    );
  }
  const up = diff > 0;
  return (
    <span
      className="flex items-center gap-0.5 text-[10px] font-semibold"
      style={{ color: up ? "#DC2626" : "#3FA34D" }}
    >
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {pct}%{suffix}
    </span>
  );
}

// ─── Meal Card with 3-dot menu ──────────────────────────────────────────────

function MealCard({ meal, onRemove }: { meal: MealLogEntry; onRemove: () => void }) {
  const score = meal.analysis.qualityScore;
  const scoreColor = getScoreColor(score);
  const scoreBg = getScoreBg(score);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div
      className="flex items-center gap-3.5 p-3.5 rounded-2xl relative"
      style={{ background: "white", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.04)" }}
    >
      <div className="w-[56px] h-[56px] rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F5F3EE" }}>
        {meal.imageUrl ? (
          <img src={meal.imageUrl} alt={meal.analysis.mealName} className="w-full h-full object-cover" loading="eager" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera size={20} style={{ color: "rgba(0,0,0,0.15)" }} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[13px] truncate mb-0.5" style={{ color: "#1a1a1a" }}>
          {meal.analysis.mealName}
        </h4>
        <p className="text-[11px] mb-1.5" style={{ color: "rgba(0,0,0,0.45)" }}>
          {meal.analysis.totalCalories} kcal · {formatTime(meal.analyzedAt)}
        </p>
        <div className="flex gap-2">
          <span className="text-[10px] font-medium" style={{ color: "rgba(0,0,0,0.4)" }}>P {Math.round(meal.analysis.macros.protein)}g</span>
          <span className="text-[10px] font-medium" style={{ color: "rgba(0,0,0,0.4)" }}>C {Math.round(meal.analysis.macros.carbs)}g</span>
          <span className="text-[10px] font-medium" style={{ color: "rgba(0,0,0,0.4)" }}>F {Math.round(meal.analysis.macros.fat)}g</span>
        </div>
      </div>
      <div className="px-2 py-1 rounded-lg flex-shrink-0" style={{ background: scoreBg }}>
        <span className="text-xs font-bold" style={{ color: scoreColor, fontFamily: "'Inter', sans-serif" }}>
          {score}<span style={{ color: "rgba(0,0,0,0.25)", fontWeight: 400 }}>/100</span>
        </span>
      </div>
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="p-1 rounded-lg hover:bg-stone-100 transition-colors"
          style={{ color: "rgba(0,0,0,0.3)" }}
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-8 z-50 rounded-xl py-1 min-w-[120px]"
            style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(false); onRemove(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-medium hover:bg-red-50 transition-colors"
              style={{ color: "#DC2626" }}
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Track Page ─────────────────────────────────────────────────────────

export default function TrackPage() {
  const [, navigate] = useLocation();
  const { goals, mealLog, todayTotals, progress } = useCalorieGoals();
  const { streakInfo } = useStreakBadges();

  // Date navigation state
  const today = useMemo(() => normalizeDate(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(() => normalizeDate(new Date()));
  const [springIdx, setSpringIdx] = useState<number | null>(null);

  // The date strip is always centered around selectedDate
  const dateStripDays = useMemo(() => buildDateStrip(selectedDate), [selectedDate]);

  const isToday = useCallback((d: Date) => d.getTime() === today.getTime(), [today]);
  const isSelectedDay = useCallback((d: Date) => d.getTime() === selectedDate.getTime(), [selectedDate]);

  const hasEntriesOnDay = useCallback((d: Date) =>
    mealLog.some(e => normalizeDate(new Date(e.analyzedAt)).getTime() === d.getTime()),
    [mealLog]);

  // Navigate to a specific day (with spring on strip index)
  const goToDay = useCallback((day: Date, stripIndex?: number) => {
    if (stripIndex !== undefined) {
      setSpringIdx(stripIndex);
      setTimeout(() => setSpringIdx(null), 120);
    }
    setSelectedDate(normalizeDate(day));
  }, []);

  // Swipe handling
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    const dy = e.changedTouches[0].clientY - swipeStartY.current;
    swipeStartX.current = null;
    swipeStartY.current = null;
    // Only trigger if horizontal swipe dominates (dx > 40px, dy < 60px)
    if (Math.abs(dx) < 40 || Math.abs(dy) > 60) return;
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + (dx < 0 ? 1 : -1));
    goToDay(next);
  }, [selectedDate, goToDay]);

  // Entries for selected date
  const isViewingToday = selectedDate.getTime() === today.getTime();

  const selectedEntries = useMemo(() =>
    mealLog
      .filter(e => normalizeDate(new Date(e.analyzedAt)).getTime() === selectedDate.getTime())
      .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()),
    [mealLog, selectedDate]);

  const selectedTotals = useMemo(() => ({
    calories: selectedEntries.reduce((s, e) => s + e.analysis.totalCalories, 0),
    protein: selectedEntries.reduce((s, e) => s + e.analysis.macros.protein, 0),
    carbs: selectedEntries.reduce((s, e) => s + e.analysis.macros.carbs, 0),
    fat: selectedEntries.reduce((s, e) => s + e.analysis.macros.fat, 0),
  }), [selectedEntries]);

  const currentCalories = isViewingToday ? todayTotals.calories : selectedTotals.calories;
  const caloriesLeft = Math.max(0, goals.dailyCalories - currentCalories);
  const caloriePct = goals.dailyCalories > 0 ? currentCalories / goals.dailyCalories : 0;

  // Activity (steps + burned) for selected date — re-read when date changes
  const [activity, setActivityState] = useState(() => getActivity(selectedDate));
  const netCalories = Math.round(currentCalories - activity.burned);
  useEffect(() => {
    setActivityState(getActivity(selectedDate));
  }, [selectedDate]);

  const handleSaveSteps = useCallback((v: number) => {
    setActivity(selectedDate, { steps: v });
    setActivityState(getActivity(selectedDate));
  }, [selectedDate]);

  const handleSaveBurned = useCallback((v: number) => {
    setActivity(selectedDate, { burned: v });
    setActivityState(getActivity(selectedDate));
  }, [selectedDate]);

  // ── This Week summary ──────────────────────────────────────────────────────
  // Current week: Mon–Sun containing today
  const thisWeekStart = useMemo(() => {
    const d = new Date(today);
    const dow = d.getDay(); // 0=Sun
    d.setDate(d.getDate() - ((dow + 6) % 7)); // back to Monday
    return normalizeDate(d);
  }, [today]);

  const lastWeekStart = useMemo(() => {
    const d = new Date(thisWeekStart);
    d.setDate(d.getDate() - 7);
    return d;
  }, [thisWeekStart]);

  // Animation key — increments every time the page is visited to retrigger entrance animations
  const [animKey, setAnimKey] = useState(0);
  const [showNetRing, setShowNetRing] = useState(true);
  // confettiFiredRef guards within a single animation run; localStorage guards across page visits
  const confettiFiredRef = useRef(false);
  const [ringGoalReached, setRingGoalReached] = useState(false);
  const [location] = useLocation();
  useEffect(() => {
    if (location === "/track") {
      setAnimKey(k => k + 1);
    }
  }, [location]);

  // Returns today's date key (YYYY-MM-DD) for the confetti localStorage gate
  const todayConfettiKey = () => `eatclean_confetti_${toDateKey(new Date())}`;

  // Animated calorie display (count up from 0)
  const [displayCalories, setDisplayCalories] = useState(0);
  const [displayLeft, setDisplayLeft] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);
  const [ringProgress, setRingProgress] = useState(0);
  const [displayNet, setDisplayNet] = useState(0);
  const [netRingProgress, setNetRingProgress] = useState(0);

  useEffect(() => {
    setDisplayCalories(0);
    setDisplayLeft(0);
    setDisplayPct(0);
    setRingProgress(0);
    setDisplayNet(0);
    setNetRingProgress(0);
    confettiFiredRef.current = false;
    // Restore glow if goal was already reached today (without re-firing confetti)
    const alreadyFiredToday = localStorage.getItem(todayConfettiKey()) === "1";
    setRingGoalReached(alreadyFiredToday && caloriePct >= 1);
    const target = currentCalories;
    const targetPct = caloriePct;
    const targetNet = netCalories;
    const targetNetPct = goals.dailyCalories > 0 ? Math.min(1, Math.max(0, netCalories / goals.dailyCalories)) : 0;
    const duration = 500;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -14 * t);
      setDisplayCalories(Math.round(eased * target));
      setDisplayLeft(Math.round(eased * Math.max(0, goals.dailyCalories - target)));
      setDisplayPct(eased * targetPct);
      setRingProgress(eased * targetPct);
      setDisplayNet(Math.round(eased * targetNet));
      setNetRingProgress(eased * targetNetPct);
      // Fire confetti + pulse glow exactly once per day when ring first reaches/exceeds 100%
      if (!confettiFiredRef.current && eased * targetPct >= 1 && targetPct >= 1) {
        confettiFiredRef.current = true;
        setRingGoalReached(true);
        // Only launch confetti if it hasn't been fired yet today
        const key = todayConfettiKey();
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "1");
          // Defer confetti to next frame to avoid getBoundingClientRect issues in SSR/test envs
          setTimeout(() => {
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { x: 0.5, y: 0.55 },
                colors: ["#4ade80", "#22c55e", "#0B3D2E", "#fbbf24", "#ffffff"],
                scalar: 0.9,
                gravity: 1.1,
                ticks: 180,
              });
            } catch (_) {
              // confetti not available in this environment
            }
          }, 50);
        }
      }
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey, currentCalories, caloriePct, netCalories]);

  const weekStats = useMemo(() => {
    // Build per-day stacked calorie breakdown by meal type (Mon–Sun)
    const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
    const sparklineStacked = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(thisWeekStart);
      d.setDate(thisWeekStart.getDate() + i);
      const key = toDateKey(d);
      const entries = mealLog.filter(e => toDateKey(new Date(e.analyzedAt)) === key);
      const byType: Record<string, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0, other: 0 };
      entries.forEach(e => {
        const t = e.mealType && MEAL_TYPES.includes(e.mealType as typeof MEAL_TYPES[number]) ? e.mealType : "other";
        byType[t] += e.analysis.totalCalories;
      });
      return byType;
    });
    const sparklineDays = sparklineStacked.map(d => Object.values(d).reduce((s, v) => s + v, 0));

    const calcWeek = (start: Date) => {
      let totalCal = 0;
      let totalScore = 0;
      let scoreDays = 0;
      let calDays = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = toDateKey(d);
        const entries = mealLog.filter(e => toDateKey(new Date(e.analyzedAt)) === key);
        if (entries.length > 0) {
          const dayCal = entries.reduce((s, e) => s + e.analysis.totalCalories, 0);
          const dayScore = entries.reduce((s, e) => s + e.analysis.qualityScore, 0) / entries.length;
          totalCal += dayCal;
          totalScore += dayScore;
          calDays++;
          scoreDays++;
        }
      }
      return {
        avgCal: calDays > 0 ? Math.round(totalCal / calDays) : 0,
        avgScore: scoreDays > 0 ? Math.round(totalScore / scoreDays) : 0,
        days: calDays,
      };
    };
    // Build per-day burned array for net dots
    const weekActivity = getWeekActivity(thisWeekStart);
    const sparklineNet = sparklineDays.map((cal, i) => {
      const burned = weekActivity[i]?.burned ?? 0;
      return burned > 0 ? cal - burned : null; // null = no burn data
    });
    // Build date objects for each sparkline day (for navigation)
    const sparklineDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(thisWeekStart);
      d.setDate(thisWeekStart.getDate() + i);
      return normalizeDate(d);
    });
    return {
      thisWeek: calcWeek(thisWeekStart),
      lastWeek: calcWeek(lastWeekStart),
      sparkline: sparklineDays,
      sparklineStacked,
      sparklineNet,
      sparklineDates,
    };
  }, [mealLog, thisWeekStart, lastWeekStart]);

  // Remove meal
  const removeMeal = (id: string) => {
    try {
      const stored = localStorage.getItem("eatclean-meal-log");
      if (!stored) return;
      const log: MealLogEntry[] = JSON.parse(stored);
      localStorage.setItem("eatclean-meal-log", JSON.stringify(log.filter(m => m.id !== id)));
      window.location.reload();
    } catch {}
  };

  // Labels
  const dateLabel = isViewingToday
    ? "Today"
    : selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const streakText = streakInfo.currentStreak === 1 ? "1 day" : `${streakInfo.currentStreak} days`;

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: "#F7F5F0" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >

      {/* ─── Compact Dark Green Header ─────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(155deg, #071f14 0%, #0B3D2E 38%, #0f4a37 65%, #0d4232 100%)",
        borderRadius: "0 0 28px 28px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(7,31,20,0.55), 0 2px 8px rgba(0,0,0,0.25)",
      }}>
        {/* Radial glow — top-left warm accent */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -40, left: -20,
            width: 220, height: 220,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)",
          }}
        />
        {/* Radial glow — bottom-right cool accent */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: -30, right: -10,
            width: 180, height: 180,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
          }}
        />
        {/* Subtle horizontal shimmer line */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: 0, left: 0, right: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.13) 60%, transparent 100%)",
          }}
        />
        {/* Faint large leaf watermark — upper-right, barely visible */}
        <div
          className="absolute pointer-events-none select-none"
          style={{
            top: "-18px",
            right: "-24px",
            opacity: 0.04,
            transform: "rotate(18deg)",
          }}
        >
          <Leaf size={160} color="white" strokeWidth={0.8} />
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-11 pb-0">
          {/* Title — fade up on each visit */}
          <div
            key={`hdr-title-${animKey}`}
            style={{
              animation: "trackHeaderFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <div className="flex items-center gap-2">
              <Leaf size={15} color="rgba(255,255,255,0.85)" strokeWidth={2} style={{ flexShrink: 0 }} />
              <h1
                className="text-white"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 27, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, textShadow: "0 1px 12px rgba(0,0,0,0.3)" }}
              >
                {dateLabel}
              </h1>
            </div>
            <p className="text-[10px] font-semibold mt-1 ml-0.5 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.32)", letterSpacing: "0.12em" }}>
              {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Streak badge — fade up with slight delay */}
          <div
            key={`hdr-streak-${animKey}`}
            style={{
              animation: "trackHeaderFadeUp 0.45s 0.08s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
          {streakInfo.currentStreak > 0 ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: "linear-gradient(135deg, rgba(251,146,60,0.18) 0%, rgba(234,88,12,0.1) 100%)",
                border: "1px solid rgba(251,146,60,0.3)",
                boxShadow: "0 2px 8px rgba(251,146,60,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Flame size={11} style={{ color: "#fb923c", filter: "drop-shadow(0 0 3px rgba(251,146,60,0.6))" }} />
              <span className="text-[10px] font-bold" style={{ color: "#fdba74", fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em" }}>{streakText}</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Flame size={11} style={{ color: "rgba(255,255,255,0.22)" }} />
              <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.28)", fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em" }}>Start streak</span>
            </div>
          )}
          </div>
        </div>

        {/* Date Strip — matches CalorieScannerPage exactly */}
        <div className="px-4 pt-3 pb-4">
          <div
            className="flex gap-1.5 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: 2 }}
          >
            {dateStripDays.map((day, i) => {
              const selected = isSelectedDay(day);
              const todayDay = isToday(day);
              const hasDot = hasEntriesOnDay(day);
              return (
                <button
                  key={i}
                  onClick={() => goToDay(day, i)}
                  className="flex flex-col items-center flex-shrink-0 relative"
                  style={{
                    minWidth: 44,
                    padding: "6px 4px 7px",
                    borderRadius: 14,
                    transform: springIdx === i ? "scale(0.88)" : "scale(1)",
                    transition: springIdx === i
                      ? "transform 0.08s ease-in"
                      : "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    background: selected ? "rgba(255,255,255,0.15)" : "transparent",
                    border: selected ? "1.5px solid rgba(255,255,255,0.35)" : "1.5px solid transparent",
                    backdropFilter: selected ? "blur(12px)" : "none",
                    boxShadow: selected ? "0 2px 16px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.12)" : "none",
                  }}
                >
                  {/* Day abbrev */}
                  <span
                    className="text-[9px] font-bold mb-2 tracking-widest"
                    style={{
                      color: selected ? "rgba(255,255,255,0.9)" : todayDay ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.38)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {DAY_ABBREVS[day.getDay()]}
                  </span>

                  {/* Date number with today ring */}
                  <div className="relative flex items-center justify-center" style={{ width: 32, height: 32 }}>
                    {todayDay && (
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          border: selected ? "2px solid rgba(255,255,255,0.7)" : "2px solid rgba(255,255,255,0.45)",
                          boxShadow: selected ? "0 0 0 3px rgba(255,255,255,0.08)" : "none",
                        }}
                      />
                    )}
                    {selected && (
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{ background: "rgba(255,255,255,0.18)" }}
                      />
                    )}
                    <span
                      className="relative font-bold"
                      style={{
                        fontSize: 15,
                        color: selected ? "white" : todayDay ? "white" : "rgba(255,255,255,0.7)",
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Entry dot */}
                  {hasDot && (
                    <div
                      className="mt-1.5 w-1 h-1 rounded-full"
                      style={{ background: selected ? "rgba(255,255,255,0.7)" : "rgba(63,163,77,0.9)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Content ────────────────────────────────────────────────────── */}
      <div className="px-4 mt-4">

        {/* Calories Card */}
        <div className="rounded-2xl p-5 mb-3" style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div
                className="font-bold"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 38,
                  letterSpacing: "-0.06em",
                  color: "#1a1a1a",
                  lineHeight: 1,
                }}
              >
                {caloriesLeft > 0 ? displayLeft.toLocaleString() : "0"}
              </div>
              <div className="text-[11px] font-medium mt-1 mb-3" style={{ color: "rgba(0,0,0,0.4)", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>Calories left</div>
              <div className="text-[12px] font-medium mb-1.5" style={{ color: "rgba(0,0,0,0.55)" }}>
                🍽️ {displayCalories.toLocaleString()} eaten
              </div>
              <div className="text-[12px] font-medium" style={{ color: "rgba(0,0,0,0.55)" }}>
                🎯 {goals.dailyCalories.toLocaleString()} goal
              </div>
            </div>
            {/* Ring column — calorie ring with attached toggle + pop-down net ring */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ gap: 0 }}>
              {/* Calorie ring with toggle arrow glued to its bottom edge */}
              <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  {/* Pulse glow — fires once when ring hits 100% */}
                  {ringGoalReached && (
                    <div
                      key={`pulse-${animKey}`}
                      style={{
                        position: "absolute",
                        inset: -8,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(74,222,128,0.18) 0%, rgba(74,222,128,0) 65%)",
                        animation: "ringGlowPulse 0.9s cubic-bezier(0.22,1,0.36,1) forwards",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  <CalorieRing progress={ringProgress} size={130} goalGlow={ringGoalReached} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#1a1a1a",
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                      }}
                    >
                      {Math.round(displayPct * 100)}%
                    </span>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 8,
                        fontWeight: 600,
                        color: "rgba(0,0,0,0.38)",
                        letterSpacing: "0.1em",
                        lineHeight: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      of goal
                    </span>
                  </div>
                </div>

                {/* Toggle arrow — circular button with chevron, sits flush below the ring */}
                {activity.burned > 0 && (
                  <button
                    onClick={() => setShowNetRing(v => !v)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 22, height: 22, borderRadius: "50%",
                      background: "rgba(0,0,0,0.05)", border: "none", cursor: "pointer",
                      transition: "background 0.15s",
                      marginTop: 2,
                    }}
                    aria-label={showNetRing ? "Hide net calories" : "Show net calories"}
                  >
                    <svg width={12} height={12} viewBox="0 0 12 12">
                      <path
                        d={showNetRing ? "M3 4.5l3 3 3-3" : "M3 7.5l3-3 3 3"}
                        stroke="rgba(0,0,0,0.45)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Net ring — smooth slide-down transition, always mounted when burned > 0 */}
              {activity.burned > 0 && (() => {
                const DARK_PURPLE = "#5B21B6";
                const size = 72;
                const sw = 5;
                const r = (size - sw) / 2;
                const circ = 2 * Math.PI * r;
                const offset = circ - netRingProgress * circ;
                return (
                  <div
                    style={{
                      overflow: "hidden",
                      maxHeight: showNetRing ? 88 : 0,
                      opacity: showNetRing ? 1 : 0,
                      transition: "max-height 0.22s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.18s ease",
                      willChange: "max-height, opacity",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      marginTop: showNetRing ? 4 : 0,
                    }}
                  >
                    <div style={{ position: "relative", width: size, height: size }}>
                      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(91,33,182,0.12)" strokeWidth={sw} />
                        <circle
                          cx={size/2} cy={size/2} r={r} fill="none"
                          stroke={DARK_PURPLE}
                          strokeWidth={sw}
                          strokeDasharray={circ}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
                        <svg width={10} height={10} viewBox="0 0 10 10" style={{ marginBottom: 1 }}>
                          <path d="M2 5h6M6 3l2 2-2 2" stroke="rgba(0,0,0,0.35)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.02em", lineHeight: 1 }}>
                          {displayNet.toLocaleString()}
                        </span>
                        <span style={{ fontSize: 7, fontWeight: 600, color: "rgba(0,0,0,0.35)", marginTop: 2, letterSpacing: "0.04em" }}>KCAL NET</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Macro Cards */}
        <div className="flex gap-2.5 mb-3">
          <MacroCard label="Protein" current={isViewingToday ? todayTotals.protein : selectedTotals.protein} goal={goals.dailyProtein} color="#2563eb" animKey={animKey} delay={0} />
          <MacroCard label="Carbs" current={isViewingToday ? todayTotals.carbs : selectedTotals.carbs} goal={goals.dailyCarbs} color="#D97706" animKey={animKey} delay={80} />
          <MacroCard label="Fat" current={isViewingToday ? todayTotals.fat : selectedTotals.fat} goal={goals.dailyFat} color="#DC2626" animKey={animKey} delay={160} />
        </div>

        {/* Health Summary Row */}
        <div className="flex gap-2.5 mb-3">
          <ActivityCard
            icon={Footprints}
            iconBg="#F0FAF0"
            iconColor="#3FA34D"
            value={activity.steps}
            label="Steps"
            unit="steps"
            onSave={handleSaveSteps}
          />
          <ActivityCard
            icon={Zap}
            iconBg="#FFF8ED"
            iconColor="#D97706"
            value={activity.burned}
            label="Burned"
            unit="kcal"
            onSave={handleSaveBurned}
          />
        </div>

        {/* This Week Summary Card */}
        {weekStats.thisWeek.days > 0 && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: "white", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(0,0,0,0.4)" }}>
                This Week
              </span>
              <span className="text-[10px] font-medium" style={{ color: "rgba(0,0,0,0.3)" }}>
                {weekStats.thisWeek.days} day{weekStats.thisWeek.days !== 1 ? "s" : ""} logged
              </span>
            </div>

            {/* Apple-quality stacked bar chart — matching CalorieScannerPage colors */}
            <div className="flex gap-4">
              {/* Avg Calories — with chart above */}
              <div className="flex-1">
                {(() => {
                  const stacked = weekStats.sparklineStacked;
                  const bars = weekStats.sparkline;
                  const dates = weekStats.sparklineDates;
                  const maxCal = Math.max(...bars, goals.dailyCalories, 1);
                  const todayDow = (today.getDay() + 6) % 7;
                  const MEAL_COLORS: Record<string, string> = {
                    breakfast: "#f97316",
                    lunch:     "#eab308",
                    dinner:    "#6366f1",
                    snack:     "#0B3D2E",
                    other:     "#a1a1aa",
                  };
                  const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack", "other"];
                  const hasAnyData = bars.some(v => v > 0);
                  return (
                    <>
                      {/* Bar chart */}
                      <div className="flex items-end gap-1 mb-1" style={{ height: 60 }}>
                        {bars.map((total, i) => {
                          const isSelected = dates[i]?.getTime() === selectedDate.getTime();
                          const isToday = i === todayDow;
                          const segments = MEAL_ORDER.map(type => ({
                            type,
                            h: total > 0 ? ((stacked[i][type] ?? 0) / maxCal) * 48 : 0,
                          })).filter(s => s.h > 0);
                          return (
                            <button
                              key={i}
                              onClick={() => dates[i] && goToDay(dates[i])}
                              className="flex-1 flex flex-col items-center gap-1 group transition-transform duration-150 active:scale-95"
                            >
                              <div
                                className="w-full relative flex flex-col-reverse rounded overflow-hidden transition-all duration-300"
                                style={{
                                  height: 48,
                                  background: "rgba(0,0,0,0.03)",
                                  border: isSelected ? "2px solid #0B3D2E" : "2px solid transparent",
                                  opacity: total === 0 ? 0.3 : 1,
                                }}
                              >
                                {segments.map(({ type, h }) => (
                                  <div key={type} style={{ height: h, background: MEAL_COLORS[type], flexShrink: 0, transition: "height 0.4s cubic-bezier(0.4,0,0.2,1)" }} />
                                ))}
                              </div>
                              <span className="text-[9px]" style={{ color: isSelected ? "#0B3D2E" : isToday ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.3)", fontFamily: "'Inter', sans-serif", fontWeight: isSelected || isToday ? 700 : 500 }}>
                                {["M","T","W","T","F","S","S"][i]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {hasAnyData && (
                        <div className="flex justify-between mb-2 px-0.5">
                          <span className="text-[8px]" style={{ color: "rgba(0,0,0,0.2)", fontFamily: "'Inter', sans-serif" }}>0</span>
                          <span className="text-[8px]" style={{ color: "rgba(0,0,0,0.2)", fontFamily: "'Inter', sans-serif" }}>{maxCal >= 1000 ? `${(maxCal/1000).toFixed(1)}k` : maxCal}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "rgba(0,0,0,0.35)" }}>Avg Calories</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.03em" }}>
                    {weekStats.thisWeek.avgCal.toLocaleString()}
                  </span>
                  <TrendBadge current={weekStats.thisWeek.avgCal} previous={weekStats.lastWeek.avgCal} />
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "rgba(0,0,0,0.3)" }}>
                  goal {goals.dailyCalories.toLocaleString()} kcal
                </div>
              </div>

              {/* Divider */}
              <div className="w-px self-stretch" style={{ background: "rgba(0,0,0,0.06)" }} />

              {/* Avg Quality — blank space above */}
              <div className="flex-1">
                <div className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "rgba(0,0,0,0.35)" }}>Avg Quality</div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-xl font-bold"
                    style={{ color: getScoreColor(weekStats.thisWeek.avgScore), fontFamily: "'Inter', sans-serif", letterSpacing: "-0.03em" }}
                  >
                    {weekStats.thisWeek.avgScore}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(0,0,0,0.3)" }}>/100</span>
                  <TrendBadge current={weekStats.thisWeek.avgScore} previous={weekStats.lastWeek.avgScore} />
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "rgba(0,0,0,0.3)" }}>
                  food quality score
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logged Meals */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[15px]" style={{ color: "#1a1a1a" }}>
            {isViewingToday ? "Logged today" : `Logged — ${selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`}
          </h2>
          {isViewingToday && (
            <button
              onClick={() => navigate("/calories")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95"
              style={{ color: "#0B3D2E", background: "#E8F5EC" }}
            >
              <Plus size={12} />
              Add meal
            </button>
          )}
          {!isViewingToday && (
            <button
              onClick={() => navigate(`/calories?date=${toDateKey(selectedDate)}`)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95"
              style={{ color: "#0B3D2E", background: "#E8F5EC" }}
            >
              View in Calories
            </button>
          )}
        </div>

        {selectedEntries.length > 0 ? (
          <div className="space-y-2.5">
            {selectedEntries.map(meal => (
              <MealCard key={meal.id} meal={meal} onRemove={() => removeMeal(meal.id)} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl p-7 text-center"
            style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", border: "1.5px dashed rgba(0,0,0,0.08)" }}
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "#F0FAF0" }}>
              <Camera size={20} style={{ color: "#0B3D2E" }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#1a1a1a" }}>
              {isViewingToday ? "No meals logged yet" : "Nothing logged this day"}
            </p>
            <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
              {isViewingToday ? "Snap your next meal to keep the streak going." : "Meals you log will appear here."}
            </p>
            <button
                onClick={() => navigate(isViewingToday ? "/calories" : `/calories?date=${toDateKey(selectedDate)}`)}
                className="mt-4 px-5 py-2.5 rounded-full text-white text-sm font-bold transition-all active:scale-95"
                style={{ background: "#0B3D2E", boxShadow: "0 2px 12px rgba(11,61,46,0.25)" }}
              >
                {isViewingToday ? "Log a meal" : "View in Calories"}
              </button>
          </div>
        )}

        {/* Swipe hint — only shown when no meals logged */}
        {selectedEntries.length === 0 && (
          <p className="text-center text-[10px] mt-4" style={{ color: "rgba(0,0,0,0.2)" }}>
            ← Swipe to browse days →
          </p>
        )}
      </div>
    </div>
  );
}
