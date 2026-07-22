/**
 * EatVera — Progress Page v8
 *
 * Changes from v7:
 *  - X delete buttons on guest (localStorage) weight entries
 *  - 30-day SVG weight trend chart below entries
 *  - Tappable custom step goal (stored in localStorage)
 */
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCalorieGoals } from "@/hooks/useCalorieGoals";
import { useStreakBadges } from "@/hooks/useStreakBadges";
import { useWeightLog } from "@/hooks/useWeightLog";
import { getBodyProfile } from "@/pages/OnboardingPage";
import { calculatePersonalizedGoals } from "@/lib/calorieCalculator";
import { toast } from "sonner";
import {
  Flame, Target, Scale, Plus, Trash2,
  Sparkles, ChevronRight, Dumbbell, ArrowRight,
  Brain, RefreshCw, Footprints, Zap,
  Check, Loader2, X, ChevronDown, Pencil, User,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Exercise catalogue with emojis
// ─────────────────────────────────────────────────────────────────────────────
const EXERCISES: { emoji: string; name: string; category: string }[] = [
  // Cardio
  { emoji: "🏃", name: "Running", category: "Cardio" },
  { emoji: "🚶", name: "Walking", category: "Cardio" },
  { emoji: "🚴", name: "Cycling / Biking", category: "Cardio" },
  { emoji: "🏊", name: "Swimming", category: "Cardio" },
  { emoji: "🚣", name: "Rowing", category: "Cardio" },
  { emoji: "🪢", name: "Jump Rope", category: "Cardio" },
  { emoji: "🔄", name: "Elliptical", category: "Cardio" },
  { emoji: "🪜", name: "Stair Climbing", category: "Cardio" },
  { emoji: "⚡", name: "HIIT", category: "Cardio" },
  { emoji: "🥊", name: "Kickboxing", category: "Cardio" },
  // Low Impact
  { emoji: "🧘", name: "Yoga", category: "Low Impact" },
  { emoji: "🤸", name: "Pilates", category: "Low Impact" },
  { emoji: "🙆", name: "Stretching", category: "Low Impact" },
  { emoji: "☯️", name: "Tai Chi", category: "Low Impact" },
  { emoji: "🩰", name: "Barre", category: "Low Impact" },
  // Strength
  { emoji: "🏋️", name: "Weight Training", category: "Strength" },
  { emoji: "🔥", name: "CrossFit", category: "Strength" },
  { emoji: "💪", name: "Bodyweight Training", category: "Strength" },
  { emoji: "🏆", name: "Powerlifting", category: "Strength" },
  { emoji: "🤼", name: "Calisthenics", category: "Strength" },
  // Sports
  { emoji: "🏀", name: "Basketball", category: "Sports" },
  { emoji: "⚽", name: "Soccer", category: "Sports" },
  { emoji: "🎾", name: "Tennis", category: "Sports" },
  { emoji: "🏐", name: "Volleyball", category: "Sports" },
  { emoji: "⛳", name: "Golf", category: "Sports" },
  { emoji: "🥋", name: "Martial Arts", category: "Sports" },
  { emoji: "🥊", name: "Boxing", category: "Sports" },
  { emoji: "🏈", name: "Football", category: "Sports" },
  { emoji: "⚾", name: "Baseball", category: "Sports" },
  { emoji: "🏒", name: "Hockey", category: "Sports" },
  // Outdoor
  { emoji: "🥾", name: "Hiking", category: "Outdoor" },
  { emoji: "🧗", name: "Rock Climbing", category: "Outdoor" },
  { emoji: "⛷️", name: "Skiing", category: "Outdoor" },
  { emoji: "🏂", name: "Snowboarding", category: "Outdoor" },
  { emoji: "🏄", name: "Surfing", category: "Outdoor" },
  { emoji: "🛶", name: "Kayaking", category: "Outdoor" },
  // Dance & Fun
  { emoji: "💃", name: "Dancing", category: "Dance & Fun" },
  { emoji: "🎵", name: "Zumba", category: "Dance & Fun" },
  { emoji: "🚵", name: "Spinning", category: "Dance & Fun" },
  { emoji: "🤾", name: "Aerobics", category: "Dance & Fun" },
];

const CATEGORIES = ["Cardio", "Low Impact", "Strength", "Sports", "Outdoor", "Dance & Fun"];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().split("T")[0]; }
function firstName(n?: string | null) { return n ? n.split(" ")[0] : ""; }
function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night";
}

// ── WeekHeatmap sub-component ───────────────────────────────────────────────────────────────────
interface WeekDay {
  label: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  mealCount: number;
  avgQuality: number;
  entries?: Array<{
    id: string;
    analysis: { mealName: string; totalCalories: number; qualityScore: number };
    analyzedAt: string;
    mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  }>;
}

const MEAL_SLOTS: Array<{ key: "breakfast" | "lunch" | "dinner" | "snack"; label: string; emoji: string; hour: number }> = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅", hour: 8 },
  { key: "lunch",     label: "Lunch",     emoji: "☀️",  hour: 12 },
  { key: "dinner",   label: "Dinner",    emoji: "🌙", hour: 18 },
  { key: "snack",    label: "Snacks",    emoji: "🍎", hour: 15 },
];

function getMealSlot(entry: { analyzedAt: string; mealType?: string }): "breakfast" | "lunch" | "dinner" | "snack" {
  if (entry.mealType === "breakfast" || entry.mealType === "lunch" || entry.mealType === "dinner" || entry.mealType === "snack") {
    return entry.mealType;
  }
  const h = new Date(entry.analyzedAt).getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 19) return "dinner";
  return "snack";
}

function WeekHeatmap({ days, calGoal, protGoal = 150, carbGoal = 200, fatGoal = 65, fiberGoal = 28, sugarGoal = 50 }: { days: WeekDay[]; calGoal: number; protGoal?: number; carbGoal?: number; fatGoal?: number; fiberGoal?: number; sugarGoal?: number }) {
  const [, navigate] = useLocation();
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null);
  const [visibleDayIdx, setVisibleDayIdx] = useState<number | null>(null); // stays set during exit animation
  const [isClosing, setIsClosing] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIdxRef = useRef<number | null>(null);

  // Animate-out then unmount
  const dismissPanel = useCallback(() => {
    setIsClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setActiveDayIdx(null);
      setVisibleDayIdx(null);
      setIsClosing(false);
    }, 280); // matches pillFadeOut duration
  }, []);

  // Switch to a different day while panel is open — cross-fade the inner content
  const switchDay = useCallback((newIdx: number) => {
    if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    pendingIdxRef.current = newIdx;
    setIsSwapping(true); // fade-out current content
    swapTimerRef.current = setTimeout(() => {
      setVisibleDayIdx(pendingIdxRef.current);
      setActiveDayIdx(pendingIdxRef.current);
      setIsSwapping(false); // fade-in new content
    }, 140); // half of 280ms cross-fade
  }, []);

  // Keep visibleDayIdx in sync when opening fresh
  useEffect(() => {
    if (activeDayIdx !== null && !isSwapping) {
      setVisibleDayIdx(activeDayIdx);
      setIsClosing(false);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    }
  }, [activeDayIdx, isSwapping]);

  // Swipe-down to dismiss
  const panelRef = useRef<HTMLDivElement>(null);
  const swipeTouchStartY = useRef<number | null>(null);
  const handlePanelTouchStart = (e: React.TouchEvent) => {
    swipeTouchStartY.current = e.touches[0].clientY;
  };
  const handlePanelTouchEnd = (e: React.TouchEvent) => {
    if (swipeTouchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - swipeTouchStartY.current;
    if (dy > 40) dismissPanel(); // swipe down ≥40px dismisses
    swipeTouchStartY.current = null;
  };
  const todayNotLogged = days[6].mealCount === 0;
  const maxCal = Math.max(...days.map(d => d.calories), calGoal * 0.1);
  const BAR_MAX_H = 28;

  const activeDay = visibleDayIdx !== null ? days[visibleDayIdx] : null;

  // Group active day entries by meal slot
  const mealGroups = activeDay?.entries
    ? MEAL_SLOTS.map(slot => ({
        ...slot,
        items: (activeDay.entries ?? []).filter(e => getMealSlot(e) === slot.key),
      }))
    : [];

  return (
    <div style={{ borderTop: "1px solid rgba(74,222,128,0.08)", marginTop: 14, paddingTop: 14, paddingBottom: 4 }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "center", marginBottom: 10 }}>This Week</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "flex-end" }}>
        {days.map((day, i) => {
          const isToday = i === 6;
          const logged = day.mealCount > 0;
          const quality = day.avgQuality;
          const dotColor = logged
            ? quality >= 80 ? "#4ade80"
              : quality >= 60 ? "#86efac"
              : quality >= 40 ? "#fbbf24"
              : "#fb923c"
            : "rgba(255,255,255,0.08)";
          const glowColor = logged
            ? quality >= 80 ? "rgba(74,222,128,0.5)"
              : quality >= 60 ? "rgba(134,239,172,0.4)"
              : quality >= 40 ? "rgba(251,191,36,0.4)"
              : "rgba(251,146,60,0.4)"
            : "transparent";
          const barH = logged ? Math.max(3, Math.round((day.calories / maxCal) * BAR_MAX_H)) : 2;
          const isActive = activeDayIdx === i;
          return (
            <div key={i}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative", cursor: logged ? "pointer" : "default" }}
              onClick={() => {
                if (isActive) { dismissPanel(); return; }
                if (activeDayIdx !== null) { switchDay(i); } // panel open — cross-fade
                else { setActiveDayIdx(i); } // panel closed — open fresh
              }}>
              {/* Dot */}
              <div style={{
                width: isToday ? 14 : 11, height: isToday ? 14 : 11,
                borderRadius: "50%",
                background: dotColor,
                boxShadow: logged ? `0 0 ${isActive ? 14 : 8}px ${glowColor}` : "none",
                border: isToday ? "2px solid rgba(255,255,255,0.35)" : isActive ? `2px solid ${dotColor}` : "none",
                transition: "all 0.25s ease",
                transform: isActive ? "scale(1.25)" : "scale(1)",
              }} />
              {/* Calorie bar */}
              <div style={{ width: 4, height: BAR_MAX_H, display: "flex", alignItems: "flex-end" }}>
                <div style={{
                  width: 4, height: barH, borderRadius: 2,
                  background: logged ? dotColor : "rgba(255,255,255,0.06)",
                  opacity: logged ? (isActive ? 1 : 0.65) : 1,
                  boxShadow: logged && isActive ? `0 0 6px ${glowColor}` : "none",
                  transition: "all 0.3s ease",
                }} />
              </div>
              {/* Day label */}
              <p style={{
                fontSize: 9,
                fontWeight: isToday ? 700 : 500,
                color: isToday ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.28)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}>{day.label.slice(0, 1)}</p>
            </div>
          );
        })}
      </div>

      {/* Meal breakdown panel — slides in below the circles */}
      <div style={{
        overflow: "hidden",
        maxHeight: activeDay && activeDay.mealCount > 0 ? 480 : 0,
        opacity: activeDay && activeDay.mealCount > 0 ? 1 : 0,
        transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
        marginTop: activeDay && activeDay.mealCount > 0 ? 12 : 0,
        pointerEvents: isClosing ? "none" : undefined,
      }}>
        {activeDay && activeDay.mealCount > 0 && (
          <div
            ref={panelRef}
            onTouchStart={handlePanelTouchStart}
            onTouchEnd={handlePanelTouchEnd}
            style={{
              background: "rgba(6,21,16,0.55)",
              border: "1px solid rgba(74,222,128,0.12)",
              borderRadius: 14,
              padding: "12px 12px 8px",
              animation: isClosing ? "pillFadeOut 0.28s ease both" : undefined,
            }}
          >
            {/* Swipe handle */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <div style={{ width: 32, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
            </div>
            {/* Inner content — fades during day swap */}
            <div style={{
              opacity: isSwapping ? 0 : 1,
              transform: isSwapping ? "translateY(4px)" : "translateY(0)",
              transition: "opacity 0.14s ease, transform 0.14s ease",
            }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}>
                {activeDay.label} — {activeDay.calories} kcal
              </p>
              <button
                onClick={dismissPanel}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "rgba(255,255,255,0.35)", fontSize: 14, lineHeight: 1 }}
              >✕</button>
            </div>
            {/* Macro pill row */}
            {(activeDay.protein != null || activeDay.carbs != null || activeDay.fat != null) && (
              <div style={{ display: "flex", gap: 5, marginBottom: 10, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: 2 }}>
                {[
                  { label: "P", value: Math.round(activeDay.protein ?? 0), goal: protGoal, color: "#dc2626", bg: "rgba(220,38,38,0.15)" },
                  { label: "C", value: Math.round(activeDay.carbs ?? 0), goal: carbGoal, color: "#d97706", bg: "rgba(217,119,6,0.15)" },
                  { label: "F", value: Math.round(activeDay.fat ?? 0), goal: fatGoal, color: "#2563eb", bg: "rgba(37,99,235,0.15)" },
                  { label: "Fib", value: Math.round(activeDay.fiber ?? 0), goal: fiberGoal, color: "#16a34a", bg: "rgba(22,163,74,0.15)" },
                  { label: "Sug", value: Math.round(activeDay.sugar ?? 0), goal: sugarGoal, color: "#a855f7", bg: "rgba(168,85,247,0.15)", invert: true },
                ].map(({ label, value, goal, color, bg, invert = false }, pillIdx) => {
                  const pct = goal > 0 ? Math.min(Math.round((value / goal) * 100), 999) : 0;
                  const fillPct = Math.min(pct, 100);
                  // For sugar: lower is better — invert the color logic
                  const pctColor = invert
                    ? (pct <= 60 ? "#4ade80" : pct <= 90 ? "#fbbf24" : "#f87171")
                    : (pct >= 80 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "rgba(255,255,255,0.35)");
                  return (
                    <div key={label} style={{
                      display: "flex", flexDirection: "column",
                      padding: "4px 8px 5px", borderRadius: 12,
                      background: bg, border: `1px solid ${color}44`,
                      minWidth: 60, flexShrink: 0,
                      animation: "pillFadeIn 0.3s ease both",
                      animationDelay: `${pillIdx * 50}ms`,
                    }}>
                      {/* Label + value + % */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                        <span style={{ fontSize: 8, fontWeight: 800, color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "'DM Mono', monospace" }}>{value}g</span>
                        <span style={{ fontSize: 9, color: pctColor, fontFamily: "'DM Mono', monospace", marginLeft: "auto" }}>{pct}%</span>
                      </div>
                      {/* Animated progress bar */}
                      <div style={{ height: 2, borderRadius: 1, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${fillPct}%`,
                          borderRadius: 1,
                          background: pctColor,
                          boxShadow: `0 0 4px ${pctColor}88`,
                          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Meal slots */}
            {mealGroups.map((slot, slotIdx) => (
              <div key={slot.key} style={{
                marginBottom: 8,
                animation: "pillFadeIn 0.3s ease both",
                animationDelay: `${(5 + slotIdx) * 50}ms`,
              }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.30)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                  {slot.emoji} {slot.label}
                </p>
                {slot.items.length === 0 ? (
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", paddingLeft: 4, fontStyle: "italic" }}>Nothing logged</p>
                ) : (
                  slot.items.map(item => {
                    const qs = item.analysis.qualityScore;
                    const dotColor = qs >= 75 ? "#4ade80" : qs >= 50 ? "#fbbf24" : "#f87171";
                    const dateStr = new Date(item.analyzedAt).toISOString().split("T")[0];
                    return (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/calories?date=${dateStr}&meal=${item.id}`)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "4px 6px", borderRadius: 8,
                        background: "rgba(255,255,255,0.04)",
                        marginBottom: 3,
                        width: "100%",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    >
                      {/* Quality dot */}
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0, marginRight: 6, boxShadow: `0 0 5px ${dotColor}88` }} />
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.70)", flex: 1, marginRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.analysis.mealName}
                      </p>
                      <p style={{ fontSize: 10, fontWeight: 600, color: "#4ade80", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                        {item.analysis.totalCalories} kcal
                      </p>
                    </button>
                    );
                  })
                )}
              </div>
            ))}
            </div>{/* end inner content swap wrapper */}
          </div>
        )}
      </div>

      {/* Log today CTA */}
      {todayNotLogged && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
          <Link href="/calories">
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.11)",
              borderRadius: 24,
              padding: "6px 16px",
              cursor: "pointer",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.60)", letterSpacing: "0.02em" }}>Log a meal today</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

/** Returns a label like "Dawn in 2h" for the next sky period */
function getNextPeriodLabel(now: Date): string {
  const h = now.getHours();
  const m = now.getMinutes();
  // Period boundaries (hour at which each period starts)
  const periods: { name: string; startH: number }[] = [
    { name: "Dawn",      startH: 5  },
    { name: "Morning",   startH: 7  },
    { name: "Midday",    startH: 10 },
    { name: "Afternoon", startH: 14 },
    { name: "Dusk",      startH: 17 },
    { name: "Evening",   startH: 20 },
    { name: "Night",     startH: 24 }, // wraps to midnight
  ];
  const next = periods.find(p => p.startH > h) ?? { name: "Dawn", startH: 29 }; // 29 = 5 + 24
  const minutesUntil = (next.startH - h) * 60 - m;
  const hoursUntil = Math.floor(minutesUntil / 60);
  const minsRem = minutesUntil % 60;
  if (hoursUntil >= 1) {
    return `${next.name} in ${hoursUntil}h${minsRem > 0 ? ` ${minsRem}m` : ""}`;
  }
  return `${next.name} in ${minsRem}m`;
}

/** Returns sky palette based on current hour for cinematic time-of-day tinting */
function getSkyPalette(h: number): {
  skyGradient: string;
  showStars: boolean;
  showMoon: boolean;
  showSun: boolean;
  sunColor: string;
  auroraColor1: string;
  auroraColor2: string;
  periodKey: string; // used as React key for crossfade
} {
  if (h < 5) {
    return {
      skyGradient: "linear-gradient(to bottom, #010a05 0%, #020e08 30%, #041408 60%, #071a0e 100%)",
      showStars: true, showMoon: true, showSun: false, sunColor: "",
      auroraColor1: "rgba(74,222,128,0.025)", auroraColor2: "rgba(56,189,248,0.02)",
      periodKey: "night",
    };
  } else if (h < 7) {
    return {
      skyGradient: "linear-gradient(to bottom, #1a0a02 0%, #3d1a06 20%, #6b2d0a 40%, #0d2e1a 70%, #0a2818 100%)",
      showStars: true, showMoon: true, showSun: false, sunColor: "",
      auroraColor1: "rgba(251,146,60,0.04)", auroraColor2: "rgba(253,186,116,0.025)",
      periodKey: "dawn",
    };
  } else if (h < 10) {
    return {
      skyGradient: "linear-gradient(to bottom, #0d2010 0%, #1a3d1a 25%, #1e4a1e 55%, #0d2e18 100%)",
      showStars: false, showMoon: false, showSun: true, sunColor: "rgba(253,224,71,0.22)",
      auroraColor1: "rgba(253,224,71,0.03)", auroraColor2: "rgba(134,239,172,0.025)",
      periodKey: "morning",
    };
  } else if (h < 14) {
    return {
      skyGradient: "linear-gradient(to bottom, #0a2414 0%, #143d20 30%, #1a4a22 60%, #0f3018 100%)",
      showStars: false, showMoon: false, showSun: true, sunColor: "rgba(253,224,71,0.18)",
      auroraColor1: "rgba(74,222,128,0.03)", auroraColor2: "rgba(134,239,172,0.02)",
      periodKey: "midday",
    };
  } else if (h < 17) {
    return {
      skyGradient: "linear-gradient(to bottom, #0c2010 0%, #163820 30%, #1c4220 60%, #0e2e18 100%)",
      showStars: false, showMoon: false, showSun: true, sunColor: "rgba(251,191,36,0.20)",
      auroraColor1: "rgba(251,191,36,0.025)", auroraColor2: "rgba(74,222,128,0.025)",
      periodKey: "afternoon",
    };
  } else if (h < 20) {
    return {
      skyGradient: "linear-gradient(to bottom, #1a0d04 0%, #3d1a08 20%, #5c2a0a 38%, #1a2e12 65%, #0a2010 100%)",
      showStars: false, showMoon: false, showSun: true, sunColor: "rgba(251,146,60,0.28)",
      auroraColor1: "rgba(251,146,60,0.04)", auroraColor2: "rgba(248,113,113,0.025)",
      periodKey: "dusk",
    };
  } else {
    return {
      skyGradient: "linear-gradient(to bottom, #020810 0%, #040e14 25%, #061410 55%, #081a10 100%)",
      showStars: true, showMoon: true, showSun: false, sunColor: "",
      auroraColor1: "rgba(74,222,128,0.025)", auroraColor2: "rgba(99,102,241,0.02)",
      periodKey: "evening",
    };
  }
}
function scoreColor(s: number) {
  if (s >= 80) return "#4ade80";
  if (s >= 60) return "#86efac";
  if (s >= 40) return "#fbbf24";
  return "#f87171";
}

/**
 * Convert a DB weight log row to a display value in the requested unit.
 * Server stores:
 *   weightKg  — integer, kg × 100 (e.g. 77.11 kg → 7711)
 *   weightRaw — original user input string (e.g. "170" for lbs, "72.5" for kg)
 *   unit      — "lbs" | "kg"
 *
 * We always use weightKg / 100 as the canonical kg value for math,
 * and fall back to weightRaw only when it matches the requested unit.
 */
function rowToKg(entry: { weightKg: number; weightRaw: string; unit: string }): number {
  // weightKg is stored as kg × 100 (integer). Divide to get real kg.
  const kgFromStored = entry.weightKg / 100;
  if (kgFromStored > 0) return kgFromStored;
  // Legacy fallback: old rows had weightKg as whole-number kg
  if (entry.unit === "kg") {
    const v = parseFloat(entry.weightRaw);
    if (!isNaN(v) && v > 0) return v;
  } else {
    const lbs = parseFloat(entry.weightRaw);
    if (!isNaN(lbs) && lbs > 0) return lbs * 0.453592;
  }
  return entry.weightKg; // last resort (old whole-kg storage)
}

function rowToDisplayValue(entry: { weightKg: number; weightRaw: string; unit: string }, preferredUnit: "kg" | "lbs"): number {
  // If the stored unit matches preferred unit AND weightRaw is the original input, use it directly
  if (entry.unit === preferredUnit) {
    const v = parseFloat(entry.weightRaw);
    if (!isNaN(v) && v > 0) return Math.round(v * 10) / 10;
  }
  // Otherwise convert from canonical kg
  const kg = rowToKg(entry);
  if (preferredUnit === "lbs") return Math.round(kg * 2.20462 * 10) / 10;
  return Math.round(kg * 10) / 10;
}

/** @deprecated use rowToDisplayValue — kept for the "lbs" default display path */
function rowToLbs(entry: { weightKg: number; weightRaw: string; unit: string }): number {
  return rowToDisplayValue(entry, "lbs");
}

// ─────────────────────────────────────────────────────────────────────────────
// Bubble Tile
// ─────────────────────────────────────────────────────────────────────────────
function BubbleTile({
  icon: Icon, label, value, unit, color, glowColor, pct,
}: {
  icon: React.ElementType; label: string; value: string | number; unit: string;
  color: string; glowColor: string; pct?: number;
}) {
  const SIZE = 108;
  const STROKE = 5;
  const r = (SIZE - STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const filled = pct != null ? Math.min(1, Math.max(0, pct)) : 0;
  const targetOffset = circ - filled * circ;

  // Mount animation: start at full circumference (empty), animate to target after 80ms
  const [animatedOffset, setAnimatedOffset] = useState<number>(circ);
  useEffect(() => {
    setAnimatedOffset(circ);
    const t = setTimeout(() => setAnimatedOffset(targetOffset), 80);
    return () => clearTimeout(t);
  }, [circ, targetOffset]);

  const glowId = `bt-glow-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative flex items-center justify-center"
        style={{ width: SIZE, height: SIZE }}>

        {/* Frosted glass disc */}
        <div className="absolute inset-0 rounded-full"
          style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(12px)" }} />
        <svg width={SIZE} height={SIZE} style={{ position: "absolute", transform: "rotate(-90deg)", overflow: "visible" }}>
          <defs>
            <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Background track with subtle inner-shadow effect via two circles */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={STROKE} />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={STROKE + 1} opacity="0.5" />
          {/* Colored arc with neon glow */}
          {filled > 0 && (
            <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none"
              stroke={color} strokeWidth={STROKE}
              strokeDasharray={circ} strokeDashoffset={animatedOffset}
              strokeLinecap="round"
              filter={`url(#${glowId})`}
              style={{ transition: "stroke-dashoffset 1.0s cubic-bezier(0.34,1.1,0.64,1)" }} />
          )}
        </svg>
        <div className="relative z-10 flex flex-col items-center gap-0.5">
          <Icon size={14} style={{ color, opacity: 0.85 }} />
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 19, fontWeight: 700, color: "white", lineHeight: 1, letterSpacing: "-0.03em" }}>
            {typeof value === "number" && value > 999 ? value.toLocaleString() : value}
          </p>
          <p style={{ fontSize: 8, color: "rgba(255,255,255,0.38)", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center", maxWidth: 72, lineHeight: 1.3 }}>{unit}</p>
        </div>
      </div>
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Glass Card
// ─────────────────────────────────────────────────────────────────────────────
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[32px] px-5 py-7 ${className}`}
      style={{
        background: "rgba(255,255,255,0.075)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 4px 32px rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.08) inset",
      }}>
      {children}
    </div>
  );
}

function SLabel({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.32)", letterSpacing: "0.20em", textTransform: "uppercase", padding: "0 4px 14px" }}>
      {children}
    </p>
  );
}

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
          {value}<span style={{ color: "rgba(255,255,255,0.25)" }}>/{goal}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dark Calorie Bar Chart
// ─────────────────────────────────────────────────────────────────────────────
function DarkCalorieBarChart({ days, goal }: { days: Array<{ label: string; calories: number; mealCount: number; isToday: boolean }>; goal: number }) {
  const maxCal = Math.max(...days.map(d => d.calories), goal, 1);
  const barH = 64;
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>7-Day Calorie Intake</p>
      <div className="flex items-end gap-1.5 relative" style={{ height: barH + 20 }}>
        {/* Goal line */}
        <div className="absolute left-0 right-0" style={{ bottom: 20 + (goal / maxCal) * barH, borderTop: "1px dashed rgba(251,146,60,0.5)" }} />
        {days.map((day, i) => {
          const h = day.calories > 0 ? Math.max((day.calories / maxCal) * barH, 4) : 3;
          const isOver = day.calories > goal;
          const bg = day.calories === 0 ? "rgba(255,255,255,0.07)" : isOver ? "#f87171" : day.isToday ? "#fb923c" : "rgba(251,146,60,0.55)";
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1" style={{ height: barH + 20, justifyContent: "flex-end" }}>
              <div className="w-full rounded-t-lg transition-all" style={{ height: h, background: bg }} />
              <p style={{ fontSize: 9, color: day.isToday ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)", fontWeight: day.isToday ? 700 : 400 }}>{day.label}</p>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ background: "#fb923c" }} />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Calories</span>
        </div>
        <div className="flex items-center gap-1">
          <div style={{ width: 14, borderTop: "1px dashed rgba(251,146,60,0.5)" }} />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Goal ({goal} kcal)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ background: "#f87171" }} />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Over goal</span>
        </div>
      </div>
    </div>
  );
}

function DarkAreaChart({ data, color = "#4ade80" }: { data: { value: number; label: string; isToday: boolean }[]; color?: string }) {
  const W = 320; const H = 88; const PX = 10; const PY = 10;
  const vals = data.map(d => d.value);
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals.filter(v => v > 0), max);
  const range = Math.max(max - min * 0.92, 1);
  const toX = (i: number) => PX + (i / Math.max(data.length - 1, 1)) * (W - PX * 2);
  const toY = (v: number) => H - PY - ((v - min * 0.92) / range) * (H - PY * 2);
  const pts = data.map((d, i) => ({ x: toX(i), y: d.value > 0 ? toY(d.value) : H - PY }));
  let path = ""; let area = "";
  if (pts.length > 1) {
    path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cp = 0.4;
      const dx = pts[i].x - pts[i - 1].x;
      path += ` C ${pts[i - 1].x + dx * cp} ${pts[i - 1].y}, ${pts[i].x - dx * cp} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }
    area = `${path} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;
  }
  const hasData = vals.some(v => v > 0);
  const gradId = `dg${color.replace(/[^a-z0-9]/gi, "")}`;
  const glowId = `glow${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <div>
      {hasData ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 88, overflow: "visible" }} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="55%" stopColor={color} stopOpacity="0.10" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <filter id={glowId} x="-20%" y="-60%" width="140%" height="220%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {area && <path d={area} fill={`url(#${gradId})`} />}
          {path && <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`} opacity="0.95" />}
          {data.map((d, i) => d.value > 0 && (
            <g key={i}>
              {d.isToday && <circle cx={toX(i)} cy={toY(d.value)} r={9} fill={color} opacity="0.12" />}
              <circle cx={toX(i)} cy={toY(d.value)} r={d.isToday ? 4 : 2.5}
                fill={d.isToday ? "white" : color}
                stroke={d.isToday ? color : "rgba(255,255,255,0.25)"}
                strokeWidth={d.isToday ? "1.5" : "1"}
                opacity={d.isToday ? 1 : 0.75} />
            </g>
          ))}
        </svg>
      ) : (
        <div className="flex items-center justify-center" style={{ height: 88 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)" }}>No data yet</p>
        </div>
      )}
      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <p key={i} className="flex-1 text-center"
            style={{ fontSize: 8.5, color: d.isToday ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)", fontWeight: d.isToday ? 700 : 400, letterSpacing: "0.02em" }}>
            {d.label}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// iOS-friendly Exercise Picker
// ─────────────────────────────────────────────────────────────────────────────
function ExercisePicker({ selected, onSelect }: { selected: string; onSelect: (name: string) => void }) {
  const [activeCategory, setActiveCategory] = useState("Cardio");
  const filtered = EXERCISES.filter(e => e.category === activeCategory);
  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: activeCategory === cat ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.06)",
              color: activeCategory === cat ? "#c4b5fd" : "rgba(255,255,255,0.45)",
              border: `1px solid ${activeCategory === cat ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.08)"}`,
              WebkitTapHighlightColor: "transparent",
            }}>
            {cat}
          </button>
        ))}
      </div>
      {/* Exercise grid */}
      <div className="grid grid-cols-3 gap-2">
        {filtered.map(ex => {
          const isSelected = selected === ex.name;
          return (
            <button key={ex.name} onClick={() => onSelect(ex.name)}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all"
              style={{
                background: isSelected ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${isSelected ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.08)"}`,
                WebkitTapHighlightColor: "transparent",
                transform: isSelected ? "scale(0.97)" : "scale(1)",
              }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{ex.emoji}</span>
              <p style={{ fontSize: 10, fontWeight: 500, color: isSelected ? "#c4b5fd" : "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 1.3 }}>
                {ex.name}
              </p>
              {isSelected && <Check size={10} style={{ color: "#a78bfa" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HeroFlipCard — hero frosted shelf with bubble tiles (front) + goal progress (back)
// ─────────────────────────────────────────────────────────────────────────────
function HeroFlipCard({
  todaySteps, stepGoal,
  todayBurned, calGoal, burnGoal,
  todayTotals, remaining,
  todayFiber, todaySugar,
  fiberGoal, sugarGoal,
  protGoal, carbGoal, fatGoal,
  netCalories, last7Days,
  onEditGoals,
}: {
  todaySteps: number; stepGoal: number;
  todayBurned: number; calGoal: number; burnGoal: number;
  todayTotals: { calories: number; protein: number; carbs: number; fat: number };
  remaining: { calories: number; protein: number; carbs: number; fat: number };
  todayFiber: number; todaySugar: number;
  fiberGoal: number; sugarGoal: number;
  protGoal: number; carbGoal: number; fatGoal: number;
  netCalories: number;
  last7Days: WeekDay[];
  onEditGoals: () => void;
}) {
  // Macro expand state for Cal Eaten bubble
  const [macroExpanded, setMacroExpanded] = useState(false);

  // Persistent flip state
  const [flipped, setFlipped] = useState<boolean>(() => {
    try { return localStorage.getItem("eatvera-hero-flipped") === "1"; } catch { return false; }
  });

  const handleFlip = useCallback(() => {
    setFlipped(v => {
      const next = !v;
      try { localStorage.setItem("eatvera-hero-flipped", next ? "1" : "0"); } catch {}
      return next;
    });
  }, []);

  const goalRows = [
    { label: "Calories", unit: "kcal", consumed: Math.round(todayTotals.calories), goal: calGoal, remaining: Math.round(remaining.calories), color: "#4ade80", isMax: true },
    { label: "Protein",  unit: "g",    consumed: Math.round(todayTotals.protein),  goal: protGoal, remaining: Math.round(remaining.protein),  color: "#a78bfa", isMax: false },
    { label: "Carbs",    unit: "g",    consumed: Math.round(todayTotals.carbs),    goal: carbGoal, remaining: Math.round(remaining.carbs),    color: "#60a5fa", isMax: true },
    { label: "Fat",      unit: "g",    consumed: Math.round(todayTotals.fat),      goal: fatGoal,  remaining: Math.round(remaining.fat),      color: "#fb923c", isMax: true },
    { label: "Fiber",    unit: "g",    consumed: Math.round(todayFiber),           goal: fiberGoal, remaining: Math.max(0, fiberGoal - Math.round(todayFiber)), color: "#34d399", isMax: false },
    { label: "Sugar",    unit: "g",    consumed: Math.round(todaySugar),           goal: sugarGoal, remaining: Math.max(0, sugarGoal - Math.round(todaySugar)), color: "#f472b6", isMax: true },
  ];

  // Confetti when all 6 goals are met and card is flipped to back
  const allGoalsMet = goalRows.every(m => {
    const isOver = m.consumed > m.goal;
    const isMinGoal = !m.isMax;
    if (isMinGoal) return isOver || m.consumed >= m.goal;
    return !isOver && m.consumed >= m.goal;
  });
  const confettiFiredRef = useRef(false);
  useEffect(() => {
    if (flipped && allGoalsMet && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ["#4ade80", "#a78bfa", "#60a5fa", "#fb923c", "#34d399", "#f472b6"] });
    }
    if (!flipped) confettiFiredRef.current = false;
  }, [flipped, allGoalsMet]);

  const isDeficit = netCalories <= 0;
  const netAbs = Math.abs(netCalories);
  const netColor = isDeficit ? "#4ade80" : "#f87171";
  const netGlow = isDeficit ? "#22c55e" : "#ef4444";
  const netLabel = isDeficit ? "Calorie Deficit ✓" : "Calorie Surplus";
  const netPct = calGoal > 0 ? Math.min(1, netAbs / calGoal) : 0;

  const shelfStyle: React.CSSProperties = {
    background: "rgba(6,21,16,0.30)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    borderRadius: 28,
    border: "1px solid rgba(74,222,128,0.10)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
    padding: "20px 8px 16px",
  };

  // ── FRONT content (always rendered for natural height) ──────────────────────
  const frontContent = (
    <div style={{ ...shelfStyle }}>

      {/* Header row: Today label + Edit Goals button */}
      <div className="flex items-center justify-between px-2 mb-3">
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Today</p>
        <button
          onClick={onEditGoals}
          className="flex items-center gap-1.5 focus:outline-none"
          style={{
            background: "rgba(74,222,128,0.12)",
            border: "1px solid rgba(74,222,128,0.28)",
            borderRadius: 20,
            padding: "4px 10px",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <Pencil size={9} style={{ color: "#4ade80" }} />
          <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 600, letterSpacing: "0.04em" }}>Edit Goals</span>
        </button>
      </div>

      {/* Row 1: Steps, Cal Burned, Cal Eaten */}
      <div className="flex items-start justify-around mb-3">
        <BubbleTile icon={Footprints} label="Steps Today"
          value={todaySteps} unit={`/ ${stepGoal.toLocaleString()}`}
          color="#60a5fa" glowColor="#3b82f6" pct={todaySteps / stepGoal} />
        <BubbleTile icon={Flame} label="Cal Burned"
          value={todayBurned} unit={`/ ${burnGoal.toLocaleString()} kcal`}
          color="#fb923c" glowColor="#f97316" pct={todayBurned / Math.max(1, burnGoal)} />
        {/* Cal Eaten — tappable to expand macro circles */}
        <button
          onClick={() => setMacroExpanded(v => !v)}
          className="flex flex-col items-center gap-2.5 focus:outline-none"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <div className="relative flex items-center justify-center" style={{ width: 108, height: 108 }}>
            {/* Frosted glass disc */}
            <div className="absolute inset-0 rounded-full"
              style={{ background: "rgba(255,255,255,0.055)", border: macroExpanded ? "1.5px solid rgba(74,222,128,0.45)" : "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(12px)", transition: "border 0.25s ease" }} />
            <svg width={108} height={108} style={{ position: "absolute", transform: "rotate(-90deg)", overflow: "visible" }}>
              <defs>
                <filter id="bt-glow-calEaten" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <circle cx={54} cy={54} r={51} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5} />
              <circle cx={54} cy={54} r={51} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={6} opacity="0.5" />
              {(todayTotals.calories / calGoal) > 0 && (
                <circle cx={54} cy={54} r={51} fill="none"
                  stroke="#4ade80" strokeWidth={5}
                  strokeDasharray={2 * Math.PI * 51}
                  strokeDashoffset={2 * Math.PI * 51 * (1 - Math.min(1, todayTotals.calories / calGoal))}
                  strokeLinecap="round"
                  filter="url(#bt-glow-calEaten)"
                  style={{ transition: "stroke-dashoffset 1.0s cubic-bezier(0.34,1.1,0.64,1)" }} />
              )}
            </svg>
            <div className="relative z-10 flex flex-col items-center gap-0.5">
              <Zap size={14} style={{ color: "#4ade80", opacity: 0.85 }} />
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 19, fontWeight: 700, color: "white", lineHeight: 1, letterSpacing: "-0.03em" }}>
                {todayTotals.calories > 999 ? todayTotals.calories.toLocaleString() : todayTotals.calories}
              </p>
              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.38)", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center", maxWidth: 72, lineHeight: 1.3 }}>{`/ ${calGoal}`}</p>
            </div>
            {/* Expand indicator chevron */}
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full"
              style={{
                width: 18, height: 18,
                background: macroExpanded ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.08)",
                border: macroExpanded ? "1px solid rgba(74,222,128,0.5)" : "1px solid rgba(255,255,255,0.15)",
                transition: "all 0.25s ease",
              }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"
                style={{ transform: macroExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}
              >
                <path d="M1 2.5L4 5.5L7 2.5" stroke={macroExpanded ? "#4ade80" : "rgba(255,255,255,0.5)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <p style={{ fontSize: 10, color: macroExpanded ? "#4ade80" : "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", transition: "color 0.25s ease" }}>Cal Eaten</p>
        </button>
      </div>

      {/* Macro circles — drop down when Cal Eaten is tapped */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: macroExpanded ? 160 : 0,
          opacity: macroExpanded ? 1 : 0,
          marginBottom: macroExpanded ? 16 : 0,
          transition: "max-height 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease, margin-bottom 0.4s ease",
        }}
      >
        <div
          className="flex items-start justify-around pt-2 pb-1 px-2 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(74,222,128,0.12)",
          }}
        >
          {/* Protein */}
          {[{
            label: "Protein", value: Math.round(todayTotals.protein), goal: protGoal, color: "#a78bfa", glowColor: "#8b5cf6",
          }, {
            label: "Carbs", value: Math.round(todayTotals.carbs), goal: carbGoal, color: "#60a5fa", glowColor: "#3b82f6",
          }, {
            label: "Fat", value: Math.round(todayTotals.fat), goal: fatGoal, color: "#fb923c", glowColor: "#f97316",
          }].map(({ label, value, goal, color, glowColor }) => {
            const pct = Math.min(1, Math.max(0, value / Math.max(1, goal)));
            const SIZE = 80;
            const STROKE = 4;
            const r = (SIZE - STROKE) / 2;
            const circ = 2 * Math.PI * r;
            const glowId = `macro-glow-${label.toLowerCase()}`;
            return (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
                  <div className="absolute inset-0 rounded-full"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }} />
                  <svg width={SIZE} height={SIZE} style={{ position: "absolute", transform: "rotate(-90deg)", overflow: "visible" }}>
                    <defs>
                      <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <circle cx={SIZE/2} cy={SIZE/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={STROKE} />
                    {pct > 0 && (
                      <circle cx={SIZE/2} cy={SIZE/2} r={r} fill="none"
                        stroke={color} strokeWidth={STROKE}
                        strokeDasharray={circ} strokeDashoffset={macroExpanded ? circ * (1 - pct) : circ}
                        strokeLinecap="round"
                        filter={`url(#${glowId})`}
                        style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.34,1.1,0.64,1) 0.15s" }} />
                    )}
                  </svg>
                  <div className="relative z-10 flex flex-col items-center gap-0">
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 700, color: "white", lineHeight: 1, letterSpacing: "-0.03em" }}>{value}</p>
                    <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", textTransform: "uppercase" }}>/ {goal}g</p>
                  </div>
                </div>
                <p style={{ fontSize: 9, color, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
              </div>
            );
          })}
        </div>
      </div>
      {/* Net Calories */}
      {(todayTotals.calories > 0 || todayBurned > 0) && (
        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
              <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${netGlow}22 0%, transparent 70%)`, filter: "blur(8px)" }} />
              <svg width={88} height={88} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
                <circle cx={44} cy={44} r={36} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5} />
                <circle cx={44} cy={44} r={36} fill="none" stroke={netColor} strokeWidth={5}
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - netPct)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
              </svg>
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <ArrowRight size={13} style={{ color: netColor, transform: isDeficit ? "rotate(180deg)" : "none" }} />
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 17, fontWeight: 700, color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {netAbs > 999 ? `${(netAbs / 1000).toFixed(1)}k` : netAbs}
                </p>
                <p style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em", textTransform: "uppercase" }}>kcal net</p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: netColor, fontWeight: 600, letterSpacing: "0.02em" }}>{netLabel}</p>
          </div>
        </div>
      )}
      {/* 7-day heatmap */}
      <WeekHeatmap days={last7Days} calGoal={calGoal} protGoal={protGoal} carbGoal={carbGoal} fatGoal={fatGoal} fiberGoal={fiberGoal} sugarGoal={sugarGoal} />
    </div>
  );

  // ── BACK content ────────────────────────────────────────────────────────────
  const backContent = (
    <div style={{ ...shelfStyle, padding: "20px 16px 20px" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}>
            {allGoalsMet ? "🎉 All Goals Met Today!" : "Daily Goal Progress"}
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>← Tap to go back</p>
        </div>
        <div className="flex items-center justify-center rounded-xl"
          style={{ width: 30, height: 30, background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.20)" }}>
          <Target size={13} style={{ color: "#4ade80" }} />
        </div>
      </div>

      {/* Goal rows */}
      <div className="space-y-3.5">
        {goalRows.map(m => {
          const isOver = m.consumed > m.goal;
          const overBy = isOver ? m.consumed - m.goal : 0;
          const isGoalMet = !isOver && m.consumed >= m.goal;
          const pct = m.goal > 0 ? Math.min(1, m.consumed / m.goal) : 0;
          const isMinGoal = !m.isMax;
          const barColor = isOver
            ? (isMinGoal ? "#4ade80" : "#f87171")
            : isGoalMet ? "#4ade80" : m.color;
          return (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{m.label}</span>
                  {(isGoalMet || (isMinGoal && isOver)) && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.15)", borderRadius: 6, padding: "1px 6px" }}>✓ Goal met!</span>
                  )}
                  {isOver && !isMinGoal && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,0.12)", borderRadius: 6, padding: "1px 6px" }}>Over</span>
                  )}
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600 }}>
                  {isOver && !isMinGoal ? (
                    <span style={{ color: "#f87171" }}>+{overBy}{m.unit} over</span>
                  ) : isGoalMet || (isMinGoal && isOver) ? (
                    <span style={{ color: "#4ade80" }}>{m.consumed}/{m.goal}{m.unit}</span>
                  ) : (
                    <span style={{ color: m.color }}>{m.remaining}{m.unit} left</span>
                  )}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div className="h-full rounded-full" style={{
                  width: `${pct * 100}%`,
                  background: barColor,
                  boxShadow: `0 0 6px ${barColor}66`,
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", marginTop: 3, textAlign: "right" }}>
                {isMinGoal ? "Min" : "Max"} goal: {m.goal}{m.unit}
              </p>
            </div>
          );
        })}
      </div>

      {/* Log food CTA */}
      <Link href="/calories">
        <div className="mt-5 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl cursor-pointer"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)" }}
          onClick={e => e.stopPropagation()}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#4ade80" }}>Log More Food</p>
          <ChevronRight size={12} style={{ color: "#4ade80" }} />
        </div>
      </Link>
    </div>
  );

  return (
    <div
      className="relative z-10 px-5 mb-0 mt-4"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* No-flip wrapper */}
      <div>
        {frontContent}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
// MacroFlipCard — tap to flip between "consumed today" and "remaining to goal"
// ─────────────────────────────────────────────────────────────────────────────
function MacroFlipCard({
  todayTotals, remaining, calGoal, protGoal, carbGoal, fatGoal, todayScore,
}: {
  todayTotals: { calories: number; protein: number; carbs: number; fat: number };
  remaining: { calories: number; protein: number; carbs: number; fat: number };
  calGoal: number; protGoal: number; carbGoal: number; fatGoal: number;
  todayScore: number;
}) {
  const [flipped, setFlipped] = useState(false);

  const macros = [
    { label: "Calories", unit: "kcal", consumed: Math.round(todayTotals.calories), goal: calGoal, remaining: Math.round(remaining.calories), color: "#4ade80" },
    { label: "Protein",  unit: "g",    consumed: Math.round(todayTotals.protein),  goal: protGoal, remaining: Math.round(remaining.protein),  color: "#a78bfa" },
    { label: "Carbs",    unit: "g",    consumed: Math.round(todayTotals.carbs),    goal: carbGoal, remaining: Math.round(remaining.carbs),    color: "#60a5fa" },
    { label: "Fat",      unit: "g",    consumed: Math.round(todayTotals.fat),      goal: fatGoal,  remaining: Math.round(remaining.fat),      color: "#fb923c" },
  ];

  return (
    <div className="px-4 mb-6">
      <SLabel>Today's Nutrition</SLabel>
      {/* Flip container — perspective wrapper */}
      <div
        style={{ perspective: 1200, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
        onClick={() => setFlipped(v => !v)}
      >
        <div
          style={{
            position: "relative",
            transformStyle: "preserve-3d",
            transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ── FRONT: Consumed today ── */}
          <div
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Macros Today</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Tap to see what's left</p>
                </div>
                <div className="flex items-center gap-2">
                  {todayScore > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                      style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.2)" }}>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: scoreColor(todayScore) }}>{todayScore}</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>score</p>
                    </div>
                  )}
                  <div className="flex items-center justify-center rounded-xl"
                    style={{ width: 30, height: 30, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <RefreshCw size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {macros.map(m => (
                  <MacroBar key={m.label} label={m.label} value={m.consumed} goal={m.goal} color={m.color} />
                ))}
              </div>
              <Link href="/calories">
                <div className="mt-4 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl cursor-pointer"
                  style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)" }}
                  onClick={e => e.stopPropagation()}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#4ade80" }}>Open Calorie Tracker</p>
                  <ChevronRight size={12} style={{ color: "#4ade80" }} />
                </div>
              </Link>
            </GlassCard>
          </div>

          {/* ── BACK: Remaining to goal ── */}
          <div
            style={{
              position: "absolute", inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Remaining to Goal</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Tap to go back</p>
                </div>
                <div className="flex items-center justify-center rounded-xl"
                  style={{ width: 30, height: 30, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <RefreshCw size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                </div>
              </div>
              <div className="space-y-3">
                {macros.map(m => {
                  const isGoalMet = m.remaining === 0;
                  const isOver = m.consumed > m.goal;
                  const overBy = isOver ? m.consumed - m.goal : 0;
                  const pct = m.goal > 0 ? Math.min(1, m.consumed / m.goal) : 0;
                  return (
                    <div key={m.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{m.label}</span>
                          {isGoalMet && !isOver && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.15)", borderRadius: 6, padding: "1px 5px" }}>✓ Goal met!</span>
                          )}
                        </div>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600 }}>
                          {isOver ? (
                            <span style={{ color: "#f87171" }}>+{overBy}{m.unit} over</span>
                          ) : isGoalMet ? (
                            <span style={{ color: "#4ade80" }}>0{m.unit} left</span>
                          ) : (
                            <span style={{ color: m.color }}>{m.remaining}{m.unit} left</span>
                          )}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{
                          width: `${pct * 100}%`,
                          background: isOver ? "#f87171" : isGoalMet ? "#4ade80" : m.color,
                        }} />
                      </div>
                      {/* Goal target label */}
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 3, textAlign: "right" }}>
                        Goal: {m.goal}{m.unit}
                      </p>
                    </div>
                  );
                })}
              </div>
              <Link href="/calories">
                <div className="mt-4 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl cursor-pointer"
                  style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)" }}
                  onClick={e => e.stopPropagation()}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#4ade80" }}>Log More Food</p>
                  <ChevronRight size={12} style={{ color: "#4ade80" }} />
                </div>
              </Link>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ProgressPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { goals, mealLog, todayEntries, todayTotals, remaining, last7Days, weeklyAvgCalories, saveGoals } = useCalorieGoals();
  const { streakInfo } = useStreakBadges();
  const { entries: localWeightEntries, latestEntry: localLatestWeight, addEntry: addLocalWeightEntry, removeEntry: removeLocalWeightEntry } = useWeightLog();
  const profile = getBodyProfile();
  const personalized = profile ? calculatePersonalizedGoals(profile) : null;

  // Stabilize todayStr so it doesn't change on every render, but DO reset
  // at midnight so fitness calories burned (and all other daily stats) reset
  // correctly when the app stays open past midnight.
  const [todayStr, setTodayStr] = useState<string>(() => todayISO());
  const now = new Date();

  // Midnight-reset effect: recalculate todayStr once per day
  useEffect(() => {
    const msUntilMidnight = () => {
      const n = new Date();
      const midnight = new Date(n);
      midnight.setHours(24, 0, 0, 0);
      return midnight.getTime() - n.getTime();
    };
    let timer: ReturnType<typeof setTimeout>;
    const scheduleReset = () => {
      timer = setTimeout(() => {
        setTodayStr(todayISO());
        scheduleReset(); // reschedule for the next midnight
      }, msUntilMidnight());
    };
    scheduleReset();
    return () => clearTimeout(timer);
  }, []);

  // ── Goals ────────────────────────────────────────────────────────────────
  const calGoal = goals.dailyCalories || personalized?.dailyCalories || 2000;
  const protGoal = goals.dailyProtein || personalized?.dailyProtein || 150;
  const carbGoal = goals.dailyCarbs || personalized?.dailyCarbs || 200;
  const fatGoal = goals.dailyFat || personalized?.dailyFat || 65;
  // Fiber & sugar from raw meal log entries
  const todayFiber = todayEntries.reduce((s, e) => s + (e.analysis.macros.fiber ?? 0), 0);
  const todaySugar = todayEntries.reduce((s, e) => s + (e.analysis.macros.sugar ?? 0), 0);
  // DB-backed fiber/sugar goals (from Nutrition Goals page) — fallback to FDA/WHO defaults
  const { data: dbNutritionGoals } = trpc.goals.getGoals.useQuery(undefined, { enabled: !!user });
  const fiberGoal = useMemo(() => {
    const dbGoal = dbNutritionGoals?.find(g => g.nutrientKey === "fiber_100g");
    return dbGoal ? dbGoal.targetValue : 28; // FDA daily value
  }, [dbNutritionGoals]);
  const sugarGoal = useMemo(() => {
    const dbGoal = dbNutritionGoals?.find(g => g.nutrientKey === "sugars_100g");
    return dbGoal ? dbGoal.targetValue : 50; // WHO recommended max added sugar
  }, [dbNutritionGoals]);

  // ── Today's food score ───────────────────────────────────────────────────
  const todayMeals = mealLog.filter(e => new Date(e.analyzedAt).toDateString() === now.toDateString());
  const todayScore = todayMeals.length > 0
    ? Math.round(todayMeals.reduce((s, e) => s + e.analysis.qualityScore, 0) / todayMeals.length)
    : 0;

  // ── Steps ────────────────────────────────────────────────────────────────
  const sevenAgo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split("T")[0]; }, []);
  const stepsQuery = trpc.fitness.getSteps.useQuery({ startDate: sevenAgo, endDate: todayStr }, { enabled: !!user });
  const logStepsMutation = trpc.fitness.logSteps.useMutation({
    onSuccess: () => { stepsQuery.refetch(); setStepsVal(""); setShowStepsForm(false); toast.success("Steps logged!"); },
    onError: e => toast.error(e.message),
  });
  const [stepsVal, setStepsVal] = useState("");
  const [stepsDate, setStepsDate] = useState(todayISO);
  const [showStepsForm, setShowStepsForm] = useState(false);

  const todayStepLog = stepsQuery.data?.find(s => s.date === todayStr);
  const todaySteps = todayStepLog?.steps ?? 0;

  // Custom step goal — stored in localStorage
  const [stepGoal, setStepGoal] = useState<number>(() => {
    try { const v = parseInt(localStorage.getItem("eatvera-step-goal") ?? "", 10); return isNaN(v) || v < 100 ? 10000 : v; } catch { return 10000; }
  });
  const [editingStepGoal, setEditingStepGoal] = useState(false);
  const [stepGoalInput, setStepGoalInput] = useState("");
  const saveStepGoal = useCallback(() => {
    const v = parseInt(stepGoalInput, 10);
    if (isNaN(v) || v < 100 || v > 100000) { toast.error("Enter a goal between 100 and 100,000 steps."); return; }
    setStepGoal(v);
    try { localStorage.setItem("eatvera-step-goal", String(v)); } catch {}
    setEditingStepGoal(false);
    setStepGoalInput("");
    toast.success(`Step goal set to ${v.toLocaleString()}!`);
  }, [stepGoalInput]);

  // ── Custom burn goal ────────────────────────────────────────────────────
  const [burnGoal, setBurnGoal] = useState<number>(() => {
    try { const v = parseInt(localStorage.getItem("eatvera-burn-goal") ?? "", 10); return isNaN(v) || v < 50 ? 0 : v; } catch { return 0; }
  });

  // ── Edit Goals Modal ────────────────────────────────────────────────────
  const [showEditGoals, setShowEditGoals] = useState(false);
  const [editGoalValues, setEditGoalValues] = useState({ calories: "", protein: "", carbs: "", fat: "", steps: "", burn: "" });
  const openEditGoals = useCallback(() => {
    const calGoalNow = goals.dailyCalories || 2000;
    setEditGoalValues({
      calories: String(calGoalNow),
      protein: String(goals.dailyProtein || 150),
      carbs: String(goals.dailyCarbs || 200),
      fat: String(goals.dailyFat || 65),
      steps: String(stepGoal),
      burn: String(burnGoal > 0 ? burnGoal : Math.round(calGoalNow * 0.3)),
    });
    setShowEditGoals(true);
  }, [goals, stepGoal, burnGoal]);
  const saveAllGoals = useCallback(() => {
    const cal = parseInt(editGoalValues.calories, 10);
    const prot = parseInt(editGoalValues.protein, 10);
    const carbs = parseInt(editGoalValues.carbs, 10);
    const fat = parseInt(editGoalValues.fat, 10);
    const steps = parseInt(editGoalValues.steps, 10);
    const burn = parseInt(editGoalValues.burn, 10);
    if (isNaN(cal) || cal < 500 || cal > 10000) { toast.error("Calories must be between 500 and 10,000."); return; }
    if (isNaN(prot) || prot < 10 || prot > 500) { toast.error("Protein must be between 10 and 500g."); return; }
    if (isNaN(carbs) || carbs < 10 || carbs > 1000) { toast.error("Carbs must be between 10 and 1,000g."); return; }
    if (isNaN(fat) || fat < 5 || fat > 500) { toast.error("Fat must be between 5 and 500g."); return; }
    if (isNaN(steps) || steps < 100 || steps > 100000) { toast.error("Steps must be between 100 and 100,000."); return; }
    if (isNaN(burn) || burn < 50 || burn > 5000) { toast.error("Cal Burned goal must be between 50 and 5,000."); return; }
    saveGoals({ dailyCalories: cal, dailyProtein: prot, dailyCarbs: carbs, dailyFat: fat });
    setStepGoal(steps);
    try { localStorage.setItem("eatvera-step-goal", String(steps)); } catch {}
    setBurnGoal(burn);
    try { localStorage.setItem("eatvera-burn-goal", String(burn)); } catch {}
    setShowEditGoals(false);
    toast.success("Goals updated!");
  }, [editGoalValues, saveGoals, setStepGoal]);

  // ── Exercise logs ────────────────────────────────────────────────────────
  const logsQuery = trpc.fitness.getLogs.useQuery({ startDate: todayStr, endDate: todayStr }, { enabled: !!user });
  const logExerciseMutation = trpc.fitness.logExercise.useMutation({
    onSuccess: () => {
      logsQuery.refetch();
      setWorkoutForm({ exercise: "", duration: "", estimatedKcal: null, estimating: false });
      setShowWorkoutForm(false);
      toast.success("Workout logged!");
    },
    onError: e => toast.error(e.message),
  });
  const deleteLogMutation = trpc.fitness.deleteLog.useMutation({ onSuccess: () => logsQuery.refetch() });
  const parseWorkoutMutation = trpc.fitness.parseWorkoutDescription.useMutation({
    onSuccess: data => setWorkoutForm(f => ({ ...f, estimatedKcal: data.caloriesBurned, estimating: false })),
    onError: () => { setWorkoutForm(f => ({ ...f, estimating: false })); toast.error("Could not estimate — try again."); },
  });

  const [workoutForm, setWorkoutForm] = useState<{
    exercise: string; duration: string; estimatedKcal: number | null; estimating: boolean;
  }>({ exercise: "", duration: "", estimatedKcal: null, estimating: false });
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [workoutHistoryTab, setWorkoutHistoryTab] = useState<"Today" | "Past 7 Days">("Today");

  const todayLogs = logsQuery.data ?? [];
  const todayBurned = todayLogs.reduce((s, l) => s + (l.caloriesBurned ?? 0), 0)
    + (todayStepLog?.caloriesBurned ?? 0);

  // Weekly workout summary
  const weeklyLogsQuery = trpc.fitness.getLogs.useQuery({ startDate: sevenAgo, endDate: todayStr }, { enabled: !!user });
  const weeklyLogs = weeklyLogsQuery.data ?? [];
  const weeklyWorkoutCount = weeklyLogs.length;
  const weeklyWorkoutKcal = weeklyLogs.reduce((s, l) => s + (l.caloriesBurned ?? 0), 0)
    + (stepsQuery.data?.reduce((s, d) => s + (d.caloriesBurned ?? 0), 0) ?? 0);

  // Net calories today
  const netCalories = todayTotals.calories - todayBurned;

  const handleEstimate = useCallback(() => {
    if (!user) { toast.error("Sign in to estimate calories."); return; }
    if (!workoutForm.exercise || !workoutForm.duration) { toast.error("Pick an exercise and duration."); return; }
    const mins = parseInt(workoutForm.duration, 10);
    if (isNaN(mins) || mins < 1) { toast.error("Enter a valid duration."); return; }
    setWorkoutForm(f => ({ ...f, estimating: true, estimatedKcal: null }));
    parseWorkoutMutation.mutate({ description: `${workoutForm.exercise} for ${mins} minutes` });
  }, [user, workoutForm.exercise, workoutForm.duration, parseWorkoutMutation]);

  const handleLogWorkout = useCallback(() => {
    if (!user) { toast.error("Sign in to log workouts."); return; }
    if (!workoutForm.estimatedKcal) return;
    logExerciseMutation.mutate({
      date: todayStr,
      type: "cardio",
      name: workoutForm.exercise,
      durationMin: parseInt(workoutForm.duration, 10),
      caloriesBurned: workoutForm.estimatedKcal,
      intensity: "moderate",
    });
  }, [user, workoutForm, todayStr, logExerciseMutation]);

  const handleLogSteps = useCallback(() => {
    const v = parseInt(stepsVal, 10);
    if (isNaN(v) || v < 0 || v > 100000) { toast.error("Enter a valid step count."); return; }
    if (!user) { toast.error("Sign in to log steps."); return; }
    logStepsMutation.mutate({ date: stepsDate, steps: v, source: "manual" });
  }, [stepsVal, stepsDate, user, logStepsMutation]);

  // ── 7-day chart data ─────────────────────────────────────────────────────
  const qualityData = useMemo(() => last7Days.map(d => ({
    label: d.label.slice(0, 1), value: d.avgQuality,
    isToday: d.dateStr === now.toDateString(),
  })), [last7Days]);

  const weeklyAvgScore = useMemo(() => {
    const active = last7Days.filter(d => d.avgQuality > 0);
    return active.length ? Math.round(active.reduce((s, d) => s + d.avgQuality, 0) / active.length) : 0;
  }, [last7Days]);
  const activeDays = last7Days.filter(d => d.mealCount > 0).length;

  // ── Weight ───────────────────────────────────────────────────────────────
  const weightStart = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 89); return d.toISOString().split("T")[0]; }, []);
  const weightQuery = trpc.fitness.getWeightLogs.useQuery(
    { startDate: weightStart, endDate: todayStr },
    { enabled: !!user }
  );
  const logWeightMutation = trpc.fitness.logWeight.useMutation({
    onSuccess: () => { weightQuery.refetch(); setWeightVal(""); setShowWeightForm(false); toast.success("Weight logged!"); },
    onError: e => toast.error(e.message),
  });
  const deleteWeightMutation = trpc.fitness.deleteWeightLog.useMutation({
    onSuccess: () => weightQuery.refetch(),
    onError: e => toast.error(e.message),
  });
  const [weightVal, setWeightVal] = useState("");
  const [weightDate, setWeightDate] = useState(todayISO);
  const [showWeightForm, setShowWeightForm] = useState(false);

  // ── Weight unit preference (kg / lbs) ────────────────────────────────────
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">(() => {
    try {
      const saved = localStorage.getItem("eatvera-weight-unit");
      return saved === "kg" ? "kg" : "lbs";
    } catch { return "lbs"; }
  });
  const toggleWeightUnit = useCallback((unit: "kg" | "lbs") => {
    setWeightUnit(unit);
    try { localStorage.setItem("eatvera-weight-unit", unit); } catch {}
    setWeightVal(""); // clear input when switching units
  }, []);

  // Sorted ascending by date
  const dbWeightLogs = useMemo(
    () => [...(weightQuery.data ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [weightQuery.data]
  );

  // Current weight in preferred unit — prefer DB (logged-in), fall back to localStorage (guest)
  const currentLbs: number | null = useMemo(() => {
    if (user && dbWeightLogs.length > 0) {
      return rowToDisplayValue(dbWeightLogs[dbWeightLogs.length - 1], weightUnit);
    }
    if (!user && localLatestWeight) {
      const lbs = localLatestWeight.weightLbs;
      return weightUnit === "kg" ? Math.round(lbs * 0.453592 * 10) / 10 : lbs;
    }
    return null;
  }, [user, dbWeightLogs, localLatestWeight, weightUnit]);

  // ── 30-day weight chart data ─────────────────────────────────────────────
  // Always use weightKg/100 (canonical kg) for Y-axis math to ensure accuracy
  // regardless of the unit the user logged in. Convert to preferred unit for display.
  const weightChartData = useMemo(() => {
    const source = user
      ? dbWeightLogs
      : localWeightEntries.map(e => ({
          date: e.date,
          weightRaw: String(e.weightLbs),
          weightKg: Math.round(e.weightLbs * 0.453592 * 100), // store as kg×100
          unit: "lbs" as const,
        }));
    if (source.length < 2) return [];
    return source.slice(-30).map((e, i, arr) => {
      // Canonical kg value from storage (weightKg is kg×100)
      const kgValue = rowToKg(e as any);
      // Convert to preferred display unit
      const displayValue = weightUnit === "lbs"
        ? Math.round(kgValue * 2.20462 * 10) / 10
        : Math.round(kgValue * 10) / 10;
      return {
        value: displayValue,          // in preferred unit (for chart Y-axis)
        kgValue,                      // canonical kg (for delta calculations)
        label: i === arr.length - 1 ? "Today" : new Date((e.date as string) + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        isLatest: i === arr.length - 1,
      };
    });
  }, [user, dbWeightLogs, localWeightEntries, weightUnit]);

  // Profile stores weights in lbs — convert to preferred unit for display
  const targetLbs = profile?.desiredWeightLbs ?? null;
  const startLbs = profile?.currentWeightLbs ?? null;
  const targetDisplay = targetLbs != null
    ? (weightUnit === "kg" ? Math.round(targetLbs * 0.453592 * 10) / 10 : targetLbs)
    : null;
  const startDisplay = startLbs != null
    ? (weightUnit === "kg" ? Math.round(startLbs * 0.453592 * 10) / 10 : startLbs)
    : null;
  const toGo = currentLbs != null && targetDisplay != null ? Math.abs(currentLbs - targetDisplay) : null;
  const weightPct = currentLbs != null && targetDisplay != null && startDisplay != null
    ? Math.min(1, Math.max(0, 1 - Math.abs(currentLbs - targetDisplay) / Math.max(0.1, Math.abs(startDisplay - targetDisplay))))
    : 0;

  // ── Weekly weight averages (this week vs last week) ──────────────────────────
  const weeklyWeightStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    // Build ISO date strings for this week (last 7 days) and last week (8-14 days ago)
    const thisWeekDates = new Set<string>();
    const lastWeekDates = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      thisWeekDates.add(d.toISOString().split("T")[0]);
    }
    for (let i = 7; i < 14; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      lastWeekDates.add(d.toISOString().split("T")[0]);
    }
    // Get kg values for each window
    const source = user
      ? dbWeightLogs
      : localWeightEntries.map(e => ({
          date: e.date,
          weightRaw: String(e.weightLbs),
          weightKg: Math.round(e.weightLbs * 0.453592 * 100),
          unit: "lbs" as const,
        }));
    const thisWeekKg = source.filter(e => thisWeekDates.has(e.date as string)).map(e => rowToKg(e as any));
    const lastWeekKg = source.filter(e => lastWeekDates.has(e.date as string)).map(e => rowToKg(e as any));
    if (thisWeekKg.length === 0) return null;
    const avgThis = thisWeekKg.reduce((s, v) => s + v, 0) / thisWeekKg.length;
    const avgLast = lastWeekKg.length > 0 ? lastWeekKg.reduce((s, v) => s + v, 0) / lastWeekKg.length : null;
    // Convert to preferred unit
    const toDisplay = (kg: number) => weightUnit === "lbs"
      ? Math.round(kg * 2.20462 * 10) / 10
      : Math.round(kg * 10) / 10;
    const avgThisDisplay = toDisplay(avgThis);
    const avgLastDisplay = avgLast != null ? toDisplay(avgLast) : null;
    const delta = avgLastDisplay != null ? Math.round(Math.abs(avgThisDisplay - avgLastDisplay) * 10) / 10 : null;
    const direction = avgLastDisplay != null
      ? avgThisDisplay < avgLastDisplay ? "down" : avgThisDisplay > avgLastDisplay ? "up" : "same"
      : null;
    return { avgThisDisplay, avgLastDisplay, delta, direction, count: thisWeekKg.length };
  }, [user, dbWeightLogs, localWeightEntries, weightUnit]);

  // ── BMI computation ───────────────────────────────────────────────────────────
  const bmiData = useMemo(() => {
    if (!profile?.heightFeet || !profile?.currentWeightLbs) return null;
    // Use latest logged weight if available, otherwise use profile weight
    const latestKg = user && dbWeightLogs.length > 0
      ? rowToKg(dbWeightLogs[dbWeightLogs.length - 1])
      : !user && localLatestWeight
      ? localLatestWeight.weightLbs * 0.453592
      : profile.currentWeightLbs * 0.453592;
    const heightCm = (profile.heightFeet * 12 + (profile.heightInches ?? 0)) * 2.54;
    if (heightCm <= 0) return null;
    const bmi = latestKg / ((heightCm / 100) ** 2);
    const bmiRounded = Math.round(bmi * 10) / 10;
    let category: string;
    let color: string;
    let pct: number; // 0-1 position on the BMI scale (15-40)
    if (bmi < 18.5) { category = "Underweight"; color = "#60a5fa"; pct = Math.max(0, (bmi - 15) / 3.5); }
    else if (bmi < 25) { category = "Normal"; color = "#4ade80"; pct = 0.2 + ((bmi - 18.5) / 6.5) * 0.3; }
    else if (bmi < 30) { category = "Overweight"; color = "#fbbf24"; pct = 0.5 + ((bmi - 25) / 5) * 0.25; }
    else { category = "Obese"; color = "#f87171"; pct = Math.min(1, 0.75 + ((bmi - 30) / 10) * 0.25); }
    return { bmi: bmiRounded, category, color, pct };
  }, [profile, user, dbWeightLogs, localLatestWeight]);

  // ── US Navy Body Fat Estimate ────────────────────────────────────────────────────────────────
  // Measurements stored in cm; user inputs in their preferred unit
  const [bfMeasurements, setBfMeasurements] = useState<{
    waist: string; neck: string; hip: string; // hip only for female
  }>(() => {
    try {
      const saved = localStorage.getItem("eatvera-bodyfat-measurements");
      return saved ? JSON.parse(saved) : { waist: "", neck: "", hip: "" };
    } catch { return { waist: "", neck: "", hip: "" }; }
  });
  const [bfUnit, setBfUnit] = useState<"cm" | "in">(() => {
    try { return localStorage.getItem("eatvera-bf-unit") === "in" ? "in" : "cm"; } catch { return "cm"; }
  });
  const [showBfForm, setShowBfForm] = useState(false);

  function saveBfMeasurements(m: typeof bfMeasurements) {
    setBfMeasurements(m);
    try { localStorage.setItem("eatvera-bodyfat-measurements", JSON.stringify(m)); } catch {}
  }

  const bodyFatData = useMemo(() => {
    if (!profile?.heightFeet) return null;
    const heightCm = (profile.heightFeet * 12 + (profile.heightInches ?? 0)) * 2.54;
    const toInch = (val: string) => {
      const v = parseFloat(val);
      if (isNaN(v) || v <= 0) return null;
      return bfUnit === "in" ? v * 2.54 : v; // always convert to cm
    };
    const waistCm = toInch(bfMeasurements.waist);
    const neckCm = toInch(bfMeasurements.neck);
    const hipCm = toInch(bfMeasurements.hip);
    const gender = profile.gender; // "male" | "female"
    if (!waistCm || !neckCm || waistCm <= neckCm) return null;
    let bf: number;
    if (gender === "female") {
      if (!hipCm) return null;
      // US Navy formula for women: 163.205 * log10(waist + hip - neck) - 97.684 * log10(height) - 78.387
      bf = 163.205 * Math.log10(waistCm + hipCm - neckCm) - 97.684 * Math.log10(heightCm) - 78.387;
    } else {
      // US Navy formula for men: 86.010 * log10(waist - neck) - 70.041 * log10(height) + 36.76
      bf = 86.010 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
    }
    if (isNaN(bf) || bf < 0 || bf > 60) return null;
    const bfRounded = Math.round(bf * 10) / 10;
    // Categories (ACE guidelines)
    let category: string;
    let color: string;
    let pct: number; // 0-1 on scale 0-50%
    if (gender === "female") {
      if (bf < 14) { category = "Essential Fat"; color = "#60a5fa"; pct = bf / 50; }
      else if (bf < 21) { category = "Athletes"; color = "#4ade80"; pct = 0.1 + (bf - 14) / 50; }
      else if (bf < 25) { category = "Fitness"; color = "#a3e635"; pct = 0.24 + (bf - 21) / 50; }
      else if (bf < 32) { category = "Acceptable"; color = "#fbbf24"; pct = 0.32 + (bf - 25) / 50; }
      else { category = "Obese"; color = "#f87171"; pct = Math.min(1, 0.46 + (bf - 32) / 50); }
    } else {
      if (bf < 6) { category = "Essential Fat"; color = "#60a5fa"; pct = bf / 50; }
      else if (bf < 14) { category = "Athletes"; color = "#4ade80"; pct = 0.06 + (bf - 6) / 50; }
      else if (bf < 18) { category = "Fitness"; color = "#a3e635"; pct = 0.22 + (bf - 14) / 50; }
      else if (bf < 25) { category = "Acceptable"; color = "#fbbf24"; pct = 0.30 + (bf - 18) / 50; }
      else { category = "Obese"; color = "#f87171"; pct = Math.min(1, 0.44 + (bf - 25) / 50); }
    }
    return { bf: bfRounded, category, color, pct };
  }, [profile, bfMeasurements, bfUnit]);

  const goalCelebrated = useRef(false);

  const fireGoalConfetti = useCallback(() => {
    if (goalCelebrated.current) return;
    goalCelebrated.current = true;
    // Reset after 10 s so it can fire again if they log again later
    setTimeout(() => { goalCelebrated.current = false; }, 10000);
    confetti({ particleCount: 160, spread: 90, origin: { y: 0.55 }, colors: ["#4ade80", "#fbbf24", "#a78bfa", "#fb923c", "#ffffff"] });
    toast.success("🎉 Goal reached! You hit your target weight!", { duration: 5000 });
  }, []);

  const handleLogWeight = useCallback(() => {
    const v = parseFloat(weightVal);
    const minVal = weightUnit === "kg" ? 20 : 44;
    const maxVal = weightUnit === "kg" ? 320 : 700;
    if (isNaN(v) || v < minVal || v > maxVal) {
      toast.error(`Enter a valid weight (${minVal}–${maxVal} ${weightUnit}).`);
      return;
    }
    // Convert to lbs for goal comparison (targetLbs is always in lbs from profile)
    const vInLbs = weightUnit === "kg" ? Math.round(v * 2.20462 * 10) / 10 : v;
    const hitGoal = targetLbs != null && Math.abs(vInLbs - targetLbs) < 0.6;
    if (user) {
      logWeightMutation.mutate({ date: weightDate, weightRaw: String(v), unit: weightUnit }, {
        onSuccess: () => { if (hitGoal) fireGoalConfetti(); }
      });
    } else {
      // Guest storage is always in lbs internally
      addLocalWeightEntry(vInLbs, weightDate);
      setWeightVal(""); setShowWeightForm(false);
      toast.success("Weight saved locally!");
      if (hitGoal) fireGoalConfetti();
    }
  }, [weightVal, weightDate, weightUnit, user, logWeightMutation, addLocalWeightEntry, targetLbs, fireGoalConfetti]);

  // ── AI coaching ──────────────────────────────────────────────────────────
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoaded, setInsightLoaded] = useState(false);
  const suggestMutation = trpc.fitness.suggestGoals.useMutation({
    onSuccess: data => { setInsight(data.explanation || "Keep logging consistently to unlock personalized insights."); setInsightLoaded(true); },
    onError: () => { setInsight("Stay consistent — every meal logged brings you closer to your goals."); setInsightLoaded(true); },
  });
  const loadInsight = useCallback(() => {
    if (!profile) return;
    const goalMap: Record<string, "lose" | "maintain" | "gain"> = {
      lose_fat: "lose", maintain_muscle_lose_weight: "lose",
      build_muscle: "gain", bulk_build_muscle: "gain",
      maintain_weight: "maintain", maintain_current: "maintain", clean_eating: "maintain",
    };
    const actMap: Record<string, "sedentary" | "light" | "moderate" | "active" | "very_active"> = {
      sedentary: "sedentary", lightly_active: "light", moderately_active: "moderate",
      very_active: "active", extremely_active: "very_active",
    };
    suggestMutation.mutate({
      currentWeight: profile.currentWeightLbs ?? 160,
      targetWeight: profile.desiredWeightLbs ?? profile.currentWeightLbs ?? 160,
      unit: "lbs",
      activityLevel: actMap[(profile as any).activityLevel ?? "moderately_active"] ?? "moderate",
      goal: goalMap[profile.mainGoal ?? "clean_eating"] ?? "maintain",
    });
  }, [profile, suggestMutation]);
  useEffect(() => {
    if (user && profile && !insightLoaded && mealLog.length > 0) loadInsight();
  }, [user, !!profile, insightLoaded, mealLog.length]); // eslint-disable-line

  const intensityColor = (i?: string | null) =>
    i === "high" ? "#f87171" : i === "moderate" ? "#fbbf24" : "#4ade80";

  const exerciseEmoji = (name: string) => EXERCISES.find(e => e.name === name)?.emoji ?? "🏃";

  // ── Time-of-day sky palette — re-evaluates every minute for live transitions ────────────────────
  const [skyPalette, setSkyPalette] = useState(() => getSkyPalette(new Date().getHours()));
  const [prevSkyPalette, setPrevSkyPalette] = useState<ReturnType<typeof getSkyPalette> | null>(null);
  const [skyFading, setSkyFading] = useState(false);
  const [nextPeriodLabel, setNextPeriodLabel] = useState(() => getNextPeriodLabel(new Date()));
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = getSkyPalette(now.getHours());
      setNextPeriodLabel(getNextPeriodLabel(now));
      setSkyPalette(prev => {
        if (prev.periodKey !== next.periodKey) {
          // Period changed — trigger crossfade
          setPrevSkyPalette(prev);
          setSkyFading(true);
          setTimeout(() => { setPrevSkyPalette(null); setSkyFading(false); }, 2200);
        }
        return next;
      });
    };
    const id = setInterval(tick, 60_000); // re-check every minute
    return () => clearInterval(id);
  }, []);

  // ── Parallax scroll ref ────────────────────────────────────────────────────────────────────
  const heroParallaxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      if (!heroParallaxRef.current) return;
      // Translate the background upward at 35% of scroll speed for subtle parallax
      const scrollY = window.scrollY;
      heroParallaxRef.current.style.transform = `translateY(${scrollY * 0.35}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen pb-28 overflow-hidden" style={{ background: "linear-gradient(170deg, #0a3828 0%, #061510 50%, #0d2e1e 100%)" }}>

      {/* ── Full-bleed cinematic hero wrapper ───────────────────────────────────────────── */}
      <div className="relative" style={{ minHeight: 290 }}>
        {/* Parallax mountain container — translates upward on scroll, taller than the hero wrapper */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          ref={heroParallaxRef}
          style={{ willChange: "transform", top: 0, left: 0, right: 0, bottom: -80 }}
        >
          {/* Sky gradient — dual-div crossfade for guaranteed silky transition */}
          {/* Layer A: previous palette fades out when period changes */}
          {prevSkyPalette && (
            <div
              key={`sky-prev-${prevSkyPalette.periodKey}`}
              style={{
                position: "absolute", inset: 0,
                background: prevSkyPalette.skyGradient,
                opacity: skyFading ? 0 : 1,
                transition: "opacity 2s ease",
              }}
            />
          )}
          {/* Layer B: new palette fades in */}
          <div
            key={`sky-${skyPalette.periodKey}`}
            style={{
              position: "absolute", inset: 0,
              background: skyPalette.skyGradient,
              opacity: skyFading ? 1 : 1,
              transition: "opacity 2s ease",
            }}
          />

          {/* Stars / subtle noise texture — only at night, dawn, evening */}
          {skyPalette.showStars && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", opacity: 0.38,
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "80px 80px, 50px 50px",
              backgroundPosition: "0 0, 40px 40px" }} />
          )}

          {/* Moon glow — only at night/dawn/evening */}
          {skyPalette.showMoon && (
            <div style={{ position: "absolute", top: -30, right: 40, width: 140, height: 140,
              background: "radial-gradient(circle, rgba(180,240,200,0.18) 0%, rgba(100,200,140,0.06) 45%, transparent 70%)",
              filter: "blur(18px)" }} />
          )}

          {/* Sun glow — only during daytime periods */}
          {skyPalette.showSun && (
            <div style={{ position: "absolute", top: -20, right: 50, width: 160, height: 160,
              background: `radial-gradient(circle, ${skyPalette.sunColor} 0%, transparent 65%)`,
              filter: "blur(22px)" }} />
          )}

          {/* ── Aurora shimmer band 1 — primary sweep ── */}
          <div
            className="aurora-shimmer"
            style={{
              position: "absolute", top: "8%", left: "-60%",
              width: "80%", height: "28%",
              background: `linear-gradient(105deg, transparent 0%, ${skyPalette.auroraColor1} 30%, ${skyPalette.auroraColor1} 50%, transparent 100%)`,
              filter: "blur(12px)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
          {/* Aurora shimmer band 2 — offset secondary sweep */}
          <div
            className="aurora-shimmer-delay"
            style={{
              position: "absolute", top: "18%", left: "-60%",
              width: "65%", height: "20%",
              background: `linear-gradient(105deg, transparent 0%, ${skyPalette.auroraColor2} 35%, ${skyPalette.auroraColor2} 55%, transparent 100%)`,
              filter: "blur(16px)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />

          {/* === MOUNTAIN LAYERS (back to front, each slightly lighter/greener) === */}
          <svg viewBox="0 0 390 340" preserveAspectRatio="xMidYMax slice"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <defs>
              {/* Atmospheric haze gradient — fades mountains into sky at ridgelines */}
              <linearGradient id="mhaze1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#041a0f" stopOpacity="0" />
                <stop offset="100%" stopColor="#041a0f" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="fogband" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d3d22" stopOpacity="0" />
                <stop offset="40%" stopColor="#0d3d22" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#0d3d22" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="fogband2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0a2e1a" stopOpacity="0" />
                <stop offset="40%" stopColor="#0a2e1a" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#0a2e1a" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Layer 1 — Distant peaks, very dark, jagged silhouette */}
            <path d="M0 340 L0 210 L18 195 L38 205 L55 178 L72 190 L88 162 L105 175 L122 148 L140 163 L158 130 L175 145 L192 112 L210 128 L228 98 L245 115 L262 88 L278 104 L295 76 L312 92 L328 68 L344 82 L360 62 L375 76 L390 70 L390 340 Z"
              fill="#071e12" />

            {/* Layer 2 — Mid-range peaks, slightly lighter, more defined ridges */}
            <path d="M0 340 L0 235 L22 220 L42 230 L62 208 L82 218 L102 195 L122 207 L142 182 L162 195 L182 168 L202 182 L222 155 L242 170 L262 148 L282 162 L302 140 L322 155 L342 135 L362 148 L390 138 L390 340 Z"
              fill="#0b2e1c" />

            {/* Atmospheric fog band between layer 2 and 3 — creates depth/haze */}
            <rect x="0" y="215" width="390" height="55" fill="url(#fogband)" />

            {/* Layer 3 — Closer ridges, medium green, smoother */}
            <path d="M0 340 L0 268 L28 255 L55 262 L82 245 L110 255 L138 238 L165 250 L192 232 L220 244 L248 228 L275 240 L302 224 L330 236 L358 222 L390 230 L390 340 Z"
              fill="#102e1e" />

            {/* Second fog band — between layer 3 and foreground */}
            <rect x="0" y="248" width="390" height="45" fill="url(#fogband2)" />

            {/* Layer 4 — Foreground hills, darkest green, very smooth */}
            <path d="M0 340 L0 295 L35 285 L75 290 L115 278 L155 286 L195 272 L235 282 L275 268 L315 278 L355 265 L390 272 L390 340 Z"
              fill="#142a1c" />
          </svg>

          {/* Atmospheric vignette — darkens edges for cinematic feel */}
          <div style={{ position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% 60%, transparent 40%, rgba(2,10,6,0.55) 100%)" }} />

          {/* Top dark overlay so text is always legible */}
          <div style={{ position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(2,10,6,0.82) 0%, rgba(4,16,10,0.55) 30%, rgba(6,21,16,0.0) 65%)" }} />

          {/* Soft green atmospheric glow — behind greeting text */}
          <div style={{ position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)",
            width: 380, height: 200,
            background: "radial-gradient(ellipse at 50% 40%, rgba(74,222,128,0.10) 0%, rgba(34,197,94,0.04) 50%, transparent 70%)",
            filter: "blur(16px)" }} />

          {/* Bottom fade — blends mountain scene seamlessly into the page background */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
            background: "linear-gradient(to top, #061510 0%, rgba(6,21,16,0.96) 20%, rgba(6,21,16,0.75) 45%, rgba(6,21,16,0.30) 70%, transparent 100%)" }} />
        </div>

        {/* Content layer above background */}
        <div className="relative z-10">


        {/* ── Header ────────────────────────────────────────────────────────────────── */}
        <div className="px-5 pt-12 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(74,222,128,0.85)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6, textShadow: "0 0 16px rgba(74,222,128,0.6)" }}>
                Your Progress
              </p>
              {/* Greeting with soft warm glow disc behind it */}
              <div className="relative">
                {/* Subtle warm glow behind the greeting text */}
                <div style={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)",
                  width: 260, height: 80,
                  background: "radial-gradient(ellipse at 20% 50%, rgba(74,222,128,0.12) 0%, transparent 65%)",
                  filter: "blur(10px)", pointerEvents: "none" }} />
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: "white", letterSpacing: "-0.02em", lineHeight: 1.1, textShadow: "0 2px 20px rgba(0,0,0,0.7), 0 0 40px rgba(0,0,0,0.4)" }}>
                  {firstName(user?.name ?? profile?.name)
                    ? <>{greeting()}, <span style={{ color: "rgba(255,255,255,0.95)" }}>{firstName(user?.name ?? profile?.name)}.</span></>
                    : <>{greeting()}.</>}
                </h1>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", marginTop: 6, letterSpacing: "0.02em" }}>
                {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              {/* next-period label removed */}
            </div>

            {/* Settings / profile button — matches Home page top-right */}
            <button
              onClick={() => navigate("/settings")}
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, marginTop: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
              title="Settings"
            >
              <User size={18} style={{ color: "rgba(255,255,255,0.80)" }} />
            </button>
          </div>
        </div>

        </div>{/* end hero content z-10 */}

        {/* Subtle divider between greeting and frosted shelf */}
        <div aria-hidden style={{ height: 1, background: "rgba(255,255,255,0.08)", marginLeft: 20, marginRight: 20, marginBottom: 0 }} />

        {/* ═══════════════════════════════════════════════════════════════════
            HERO FLIP CARD — front: bubble tiles, back: daily goal progress
        ═══════════════════════════════════════════════════════════════════ */}
        <HeroFlipCard
          todaySteps={todaySteps} stepGoal={stepGoal}
          todayBurned={todayBurned} calGoal={calGoal} burnGoal={burnGoal > 0 ? burnGoal : Math.round(calGoal * 0.3)}
          todayTotals={todayTotals} remaining={remaining}
          todayFiber={todayFiber} todaySugar={todaySugar}
          fiberGoal={fiberGoal} sugarGoal={sugarGoal}
          protGoal={protGoal} carbGoal={carbGoal} fatGoal={fatGoal}
          netCalories={netCalories} last7Days={last7Days}
          onEditGoals={openEditGoals}
        />

      </div>{/* end hero wrapper */}

      {/* All remaining content */}
      <div className="relative z-10">

      {/* ═══════════════════════════════════════════════════════════════════
          AI WORKOUT LOGGER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mb-6 mt-6">
        <SLabel>Log Workout</SLabel>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Dumbbell size={15} style={{ color: "#a78bfa" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "white" }}>AI Workout Logger</p>
            </div>
            <button onClick={() => setShowWorkoutForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(167,139,250,0.15)", color: "#c4b5fd", border: "1px solid rgba(167,139,250,0.25)", WebkitTapHighlightColor: "transparent" }}>
              {showWorkoutForm ? <X size={10} /> : <Plus size={10} />}
              {showWorkoutForm ? "Cancel" : "Add Workout"}
            </button>
          </div>

          {/* Weekly summary */}
          {weeklyWorkoutCount > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 flex-1 py-2.5 px-3 rounded-2xl"
                style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)" }}>
                <Dumbbell size={12} style={{ color: "#a78bfa" }} />
                <div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>This Week</p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 700, color: "white" }}>
                    {weeklyWorkoutCount} <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>workouts</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1 py-2.5 px-3 rounded-2xl"
                style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.15)" }}>
                <Flame size={12} style={{ color: "#fb923c" }} />
                <div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Burned</p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 700, color: "white" }}>
                    {weeklyWorkoutKcal.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>kcal</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {showWorkoutForm && (
            <div className="space-y-4 mb-4 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Exercise picker */}
              <div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                  Choose Exercise
                  {workoutForm.exercise && <span style={{ color: "#c4b5fd", marginLeft: 8 }}>✓ {workoutForm.exercise}</span>}
                </p>
                <ExercisePicker
                  selected={workoutForm.exercise}
                  onSelect={name => setWorkoutForm(f => ({ ...f, exercise: name, estimatedKcal: null }))}
                />
              </div>

              {/* Duration */}
              <div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Duration (minutes)</p>
                <div className="flex gap-2 flex-wrap mb-2">
                  {[15, 20, 30, 45, 60, 90].map(m => (
                    <button key={m} onClick={() => setWorkoutForm(f => ({ ...f, duration: String(m), estimatedKcal: null }))}
                      className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: workoutForm.duration === String(m) ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.06)",
                        color: workoutForm.duration === String(m) ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                        border: `1px solid ${workoutForm.duration === String(m) ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.08)"}`,
                        WebkitTapHighlightColor: "transparent",
                        minWidth: 48,
                      }}>
                      {m}m
                    </button>
                  ))}
                </div>
                <input type="number" inputMode="numeric" placeholder="Custom minutes…"
                  value={workoutForm.duration} onChange={e => setWorkoutForm(f => ({ ...f, duration: e.target.value, estimatedKcal: null }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
              </div>

              {/* Estimate button */}
              {!workoutForm.estimatedKcal && (
                user ? (
                  <button onClick={handleEstimate}
                    disabled={workoutForm.estimating || !workoutForm.exercise || !workoutForm.duration}
                    className="w-full rounded-2xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #A855F7)",
                      color: "white",
                      opacity: workoutForm.estimating || !workoutForm.exercise || !workoutForm.duration ? 0.45 : 1,
                      WebkitTapHighlightColor: "transparent",
                    }}>
                    {workoutForm.estimating
                      ? <><Loader2 size={14} className="animate-spin" /> Estimating with AI…</>
                      : <><Sparkles size={14} /> Estimate Calories with AI</>}
                  </button>
                ) : (
                  <div className="w-full rounded-2xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
                    style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#c4b5fd" }}>
                    <Sparkles size={14} />
                    Sign in to use AI calorie estimator
                  </div>
                )
              )}

              {/* Estimate result */}
              {workoutForm.estimatedKcal != null && (
                <div className="rounded-2xl p-4" style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p style={{ fontSize: 10, color: "#c4b5fd", letterSpacing: "0.08em", textTransform: "uppercase" }}>AI Estimate</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 700, color: "white", lineHeight: 1 }}>
                          ~{workoutForm.estimatedKcal.toLocaleString()}
                        </p>
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>kcal</p>
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                        {exerciseEmoji(workoutForm.exercise)} {workoutForm.exercise} · {workoutForm.duration} min
                      </p>
                    </div>
                    <Sparkles size={28} style={{ color: "#a78bfa" }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleLogWorkout} disabled={logExerciseMutation.isPending}
                      className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg, #145A3A, #3FA34D)", color: "white", opacity: logExerciseMutation.isPending ? 0.6 : 1, WebkitTapHighlightColor: "transparent" }}>
                      {logExerciseMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      {logExerciseMutation.isPending ? "Saving…" : "Log Workout"}
                    </button>
                    <button onClick={() => setWorkoutForm(f => ({ ...f, estimatedKcal: null }))}
                      className="px-4 rounded-xl text-sm font-medium"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", WebkitTapHighlightColor: "transparent" }}>
                      Redo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Today / Past 7 Days tab toggle */}
          {!showWorkoutForm && (
            <div className="flex gap-1.5 mb-3 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
              {(["Today", "Past 7 Days"] as const).map(tab => (
                <button key={tab} onClick={() => setWorkoutHistoryTab(tab)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: workoutHistoryTab === tab ? "rgba(167,139,250,0.25)" : "transparent",
                    color: workoutHistoryTab === tab ? "#c4b5fd" : "rgba(255,255,255,0.35)",
                    WebkitTapHighlightColor: "transparent",
                  }}>
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Workout log list */}
          {(() => {
            const displayLogs = workoutHistoryTab === "Today" ? todayLogs : weeklyLogs;
            if (displayLogs.length === 0 && !showWorkoutForm) {
              return (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "4px 0" }}>
                  {workoutHistoryTab === "Today" ? "No workouts logged today" : "No workouts logged this week"}
                </p>
              );
            }
            return displayLogs.length > 0 ? (
              <div className="space-y-2">
                {displayLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between py-2.5 px-3 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: 22 }}>{exerciseEmoji(log.name)}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "white" }}>{log.name}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                          {workoutHistoryTab === "Past 7 Days" && log.date !== todayStr
                            ? new Date(log.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · "
                            : ""}
                          {log.durationMin ? `${log.durationMin} min` : ""}
                          {log.durationMin && log.intensity ? " · " : ""}
                          {log.intensity ?? ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: "#fb923c" }}>
                        -{log.caloriesBurned}
                      </p>
                      {workoutHistoryTab === "Today" && (
                        <button onClick={() => deleteLogMutation.mutate({ id: log.id })}
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(255,255,255,0.06)", WebkitTapHighlightColor: "transparent" }}>
                          <Trash2 size={10} style={{ color: "rgba(255,255,255,0.25)" }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null;
          })()}
        </GlassCard>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STEPS
      ════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mb-6">
        <SLabel>Steps</SLabel>
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Footprints size={14} style={{ color: "#60a5fa" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Step Counter</p>
            </div>
            <button onClick={() => setShowStepsForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(96,165,250,0.15)", color: "#93c5fd", border: "1px solid rgba(96,165,250,0.25)", WebkitTapHighlightColor: "transparent" }}>
              {showStepsForm ? <X size={10} /> : <Plus size={10} />}
              {showStepsForm ? "Cancel" : "Log Steps"}
            </button>
          </div>
          <div className="flex items-end gap-4 mb-3">
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 700, color: "white", lineHeight: 1 }}>
                {todaySteps > 0 ? todaySteps.toLocaleString() : "—"}
              </p>
              {editingStepGoal ? (
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" inputMode="numeric" placeholder="e.g. 8000"
                    value={stepGoalInput} onChange={e => setStepGoalInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveStepGoal(); if (e.key === "Escape") setEditingStepGoal(false); }}
                    autoFocus
                    className="w-28 rounded-xl px-2.5 py-1.5 text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(96,165,250,0.4)", color: "white" }} />
                  <button onClick={saveStepGoal}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(96,165,250,0.2)", color: "#93c5fd", WebkitTapHighlightColor: "transparent" }}>Save</button>
                  <button onClick={() => setEditingStepGoal(false)}
                    className="px-2 py-1.5 rounded-xl text-xs"
                    style={{ color: "rgba(255,255,255,0.3)", WebkitTapHighlightColor: "transparent" }}>✕</button>
                </div>
              ) : (
                <button onClick={() => { setEditingStepGoal(true); setStepGoalInput(String(stepGoal)); }}
                  style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, WebkitTapHighlightColor: "transparent", textDecoration: "underline dotted", textDecorationColor: "rgba(255,255,255,0.15)" } as React.CSSProperties}>
                  goal {stepGoal.toLocaleString()} · tap to edit
                </button>
              )}
            </div>
            {todaySteps > 0 && (
              <div className="flex-1 mb-1">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (todaySteps / stepGoal) * 100)}%`, background: "linear-gradient(90deg, #3b82f6, #60a5fa)" }} />
                </div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                  {Math.round((todaySteps / stepGoal) * 100)}% of daily goal
                </p>
              </div>
            )}
          </div>
          {showStepsForm && (
            <div className="space-y-2 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex gap-2">
                <input type="number" inputMode="numeric" placeholder="Steps (e.g. 8500)"
                  value={stepsVal} onChange={e => setStepsVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogSteps()}
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                <input type="date" value={stepsDate} max={todayISO()}
                  onChange={e => setStepsDate(e.target.value)}
                  className="rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
              </div>
              <button onClick={handleLogSteps} disabled={logStepsMutation.isPending}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", opacity: logStepsMutation.isPending ? 0.6 : 1, WebkitTapHighlightColor: "transparent" }}>
                {logStepsMutation.isPending ? "Saving…" : "Save Steps"}
              </button>
            </div>
          )}

          {/* 7-day steps bar chart */}
          {(stepsQuery.data ?? []).length > 0 && (() => {
            const days = (() => {
              const result: { label: string; steps: number; isToday: boolean }[] = [];
              for (let i = 6; i >= 0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split("T")[0];
                const entry = (stepsQuery.data ?? []).find(s => s.date === dateStr);
                result.push({
                  label: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
                  steps: entry?.steps ?? 0,
                  isToday: i === 0,
                });
              }
              return result;
            })();
            const maxSteps = Math.max(...days.map(d => d.steps), stepGoal, 1);
            return (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Personal best chip */}
                {(() => {
                  const allSteps = (stepsQuery.data ?? []).filter(s => s.steps > 0);
                  if (allSteps.length === 0) return null;
                  const best = allSteps.reduce((a, b) => a.steps >= b.steps ? a : b);
                  const bestDate = new Date(best.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <div className="flex items-center gap-1.5 mb-3">
                      <span style={{ fontSize: 13 }}>🏆</span>
                      <p style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600 }}>
                        Best: {best.steps.toLocaleString()} steps
                      </p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>on {bestDate}</p>
                    </div>
                  );
                })()}
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>7-Day Steps</p>
                <div className="flex items-end gap-1.5" style={{ height: 56 }}>
                  {days.map((d, i) => {
                    const pct = d.steps / maxSteps;
                    const goalPct = stepGoal / maxSteps;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full relative flex items-end" style={{ height: 44 }}>
                          {/* Goal line */}
                          <div className="absolute w-full" style={{ bottom: `${goalPct * 100}%`, borderTop: "1px dashed rgba(96,165,250,0.25)" }} />
                          {/* Bar */}
                          <div className="w-full rounded-t-md transition-all" style={{
                            height: d.steps > 0 ? `${Math.max(4, pct * 100)}%` : 3,
                            background: d.isToday
                              ? "linear-gradient(180deg, #60a5fa, #3b82f6)"
                              : d.steps >= stepGoal
                                ? "rgba(74,222,128,0.5)"
                                : "rgba(96,165,250,0.25)",
                            boxShadow: d.isToday ? "0 0 8px rgba(96,165,250,0.4)" : "none",
                          }} />
                        </div>
                        <p style={{ fontSize: 8, color: d.isToday ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", fontWeight: d.isToday ? 700 : 400 }}>
                          {d.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </GlassCard>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MACROS — flip card (front: consumed, back: remaining to goal)
      ════════════════════════════════════════════════════════════════════ */}
      <MacroFlipCard
        todayTotals={todayTotals}
        remaining={remaining}
        calGoal={calGoal}
        protGoal={protGoal}
        carbGoal={carbGoal}
        fatGoal={fatGoal}
        todayScore={todayScore}
      />

      {/* ════════════════════════════════════════════════════════════════════
          THIS WEEK
      ════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mb-6">
        <SLabel>This Week</SLabel>
        <div className="flex gap-3 mb-3">
          {[
            { v: weeklyAvgScore > 0 ? String(weeklyAvgScore) : "—", l: "Avg Score", c: "#4ade80" },
            { v: weeklyAvgCalories > 0 ? String(weeklyAvgCalories) : "—", l: "Avg Cal", c: "#fb923c" },
            { v: `${activeDays}/7`, l: "Active Days", c: "#60a5fa" },
          ].map(s => (
            <div key={s.l} className="flex-1 rounded-2xl py-3 px-2 text-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.v}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 4, letterSpacing: "0.04em" }}>{s.l}</p>
            </div>
          ))}
        </div>
        <GlassCard>
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>Food Quality Trend</p>
          <DarkAreaChart data={qualityData} color="#4ade80" />
        </GlassCard>
        <div style={{ height: 12 }} />
        <GlassCard>
          <DarkCalorieBarChart
            days={last7Days.map(d => ({
              label: d.label.slice(0, 1),
              calories: d.calories,
              mealCount: d.mealCount,
              isToday: d.dateStr === now.toDateString(),
            }))}
            goal={calGoal}
          />
        </GlassCard>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STREAK
      ════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mb-6">
        <SLabel>Streak</SLabel>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame size={14} style={{ color: "#fb923c" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Daily Streak</p>
            </div>
            {streakInfo.loggedToday && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl"
                style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.2)" }}>
                <Check size={10} style={{ color: "#4ade80" }} />
                <p style={{ fontSize: 10, color: "#4ade80", fontWeight: 600 }}>Logged today</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-around mb-4">
            {[
              { v: streakInfo.currentStreak, l: "Current", c: streakInfo.currentStreak > 0 ? "#fb923c" : "rgba(255,255,255,0.2)" },
              { v: streakInfo.longestStreak, l: "Best", c: "#fbbf24" },
              { v: streakInfo.totalDaysLogged, l: "Total", c: "rgba(255,255,255,0.6)" },
            ].map(s => (
              <div key={s.l} className="flex flex-col items-center gap-1">
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.v}</p>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.l}</p>
              </div>
            ))}
          </div>
          {streakInfo.currentStreak > 0 ? (
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: Math.min(streakInfo.currentStreak, 14) }, (_, i) => (
                <div key={i} className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                  style={{ background: `rgba(251,146,60,${0.12 + i * 0.04})`, border: "1px solid rgba(251,146,60,0.2)" }}>
                  🔥
                </div>
              ))}
              {streakInfo.currentStreak > 14 && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>+{streakInfo.currentStreak - 14}</p>
                </div>
              )}
            </div>
          ) : (
            <Link href="/calories">
              <div className="flex items-center gap-2 py-3 px-4 rounded-2xl cursor-pointer"
                style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.15)" }}>
                <Flame size={13} style={{ color: "#fb923c" }} />
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Log a meal today to start your streak</p>
                <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.2)", marginLeft: "auto" }} />
              </div>
            </Link>
          )}
        </GlassCard>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          AI COACHING
      ════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mb-6">
        <SLabel>AI Coaching</SLabel>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain size={14} style={{ color: "#a78bfa" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Personalized Insight</p>
            </div>
            {profile && (
              <button onClick={loadInsight} disabled={suggestMutation.isPending}
                className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)", WebkitTapHighlightColor: "transparent" }}>
                <RefreshCw size={11} style={{ color: "#a78bfa" }} className={suggestMutation.isPending ? "animate-spin" : ""} />
              </button>
            )}
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}>
              <Sparkles size={15} className="text-white" />
            </div>
            <div className="flex-1">
              {suggestMutation.isPending ? (
                <div className="space-y-2">
                  {[90, 75, 55].map(w => (
                    <div key={w} className="h-3 rounded-full animate-pulse" style={{ width: `${w}%`, background: "rgba(255,255,255,0.08)" }} />
                  ))}
                </div>
              ) : insight ? (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.65 }}>{insight}</p>
              ) : !profile ? (
                <div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Set up your body goals to get personalized coaching.</p>
                  <Link href="/onboarding"><span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>Set up goals →</span></Link>
                </div>
              ) : (
                <button onClick={loadInsight} style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, WebkitTapHighlightColor: "transparent" } as React.CSSProperties}>
                  Generate my insight →
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          WEIGHT PROGRESS
      ════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mb-6">
        <SLabel>Body Goal</SLabel>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={14} style={{ color: "#60a5fa" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Weight Progress</p>
            </div>
            <Link href="/onboarding?edit=1">
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Edit →</span>
            </Link>
          </div>

          {/* Unit toggle pill */}
          <div className="flex items-center gap-1.5 mb-4">
            {(["lbs", "kg"] as const).map(u => (
              <button key={u} onClick={() => toggleWeightUnit(u)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: weightUnit === u ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.05)",
                  color: weightUnit === u ? "#4ade80" : "rgba(255,255,255,0.35)",
                  border: `1px solid ${weightUnit === u ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.08)"}`,
                  WebkitTapHighlightColor: "transparent",
                }}>
                {u}
              </button>
            ))}
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>preferred unit</span>
          </div>

          {/* Current vs Target */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Current</p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 30, fontWeight: 700, color: "white", lineHeight: 1 }}>
                {currentLbs != null ? currentLbs : "—"}
                <span style={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.3)" }}> {weightUnit}</span>
              </p>
            </div>
            <div className="text-right">
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Target</p>
              {targetDisplay != null ? (
                <div className="flex items-center justify-end gap-2">
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: "#4ade80", lineHeight: 1 }}>
                    {targetDisplay}
                    <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.3)" }}> {weightUnit}</span>
                  </p>
                  <Link href="/onboarding?step=9&returnTo=/progress">
                    <button
                      title="Edit goal weight"
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
                      <Pencil size={11} style={{ color: "#4ade80" }} />
                    </button>
                  </Link>
                </div>
              ) : (
                <Link href="/onboarding?step=9&returnTo=/progress">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
                    <Plus size={11} />
                    Set goal
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {toGo != null && toGo > 0.4 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Progress to goal</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{toGo.toFixed(1)} {weightUnit} to go</p>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(weightPct * 100)}%`, background: "linear-gradient(90deg, #145A3A, #4ade80)" }} />
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
                {Math.round(weightPct * 100)}% of the way there
              </p>
            </div>
          )}

          {toGo != null && toGo <= 0.4 && (
            <div className="flex items-center gap-2 py-3 px-4 rounded-2xl mb-4"
              style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <span style={{ fontSize: 16 }}>🎯</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#4ade80" }}>You've reached your weight goal!</p>
            </div>
          )}

          {/* No weight logged yet */}
          {currentLbs == null && (
            <div className="flex items-center gap-2 py-3 px-4 rounded-2xl mb-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Scale size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Log your first weight entry below</p>
            </div>
          )}

          {/* Log weight button */}
          <button onClick={() => setShowWeightForm(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium mb-3"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", WebkitTapHighlightColor: "transparent" }}>
            <Scale size={13} /> {showWeightForm ? "Cancel" : "Log Weight"}
          </button>

          {showWeightForm && (
            <div className="space-y-2 mb-3 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex gap-2">
                <input type="number" inputMode="decimal" placeholder={`Weight in ${weightUnit}`}
                  value={weightVal} onChange={e => setWeightVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogWeight()}
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                <input type="date" value={weightDate} max={todayISO()}
                  onChange={e => setWeightDate(e.target.value)}
                  className="rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
              </div>
              <button onClick={handleLogWeight}
                disabled={logWeightMutation.isPending}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #145A3A, #3FA34D)", opacity: logWeightMutation.isPending ? 0.6 : 1, WebkitTapHighlightColor: "transparent" }}>
                {logWeightMutation.isPending ? "Saving…" : "Save Weight Entry"}
              </button>
            </div>
          )}

          {/* Recent weight entries */}
          {user && dbWeightLogs.length > 0 && (
            <div className="space-y-1.5">
              {[...dbWeightLogs].reverse().slice(0, 4).map(entry => (
                <div key={entry.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 600, color: "white" }}>
                      {rowToDisplayValue(entry, weightUnit)} {weightUnit}
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                      {new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <button onClick={() => deleteWeightMutation.mutate({ id: entry.id })}
                    className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)", WebkitTapHighlightColor: "transparent" }}>
                    <Trash2 size={11} style={{ color: "rgba(255,255,255,0.25)" }} />
                  </button>
                </div>
              ))}
              {dbWeightLogs.length > 4 && (
                <Link href="/progress/weight">
                  <button className="w-full py-2 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    View all {dbWeightLogs.length} entries →
                  </button>
                </Link>
              )}
            </div>
          )}

          {/* Guest local weight entries */}
          {!user && localWeightEntries.length > 0 && (
            <div className="space-y-1.5">
              {[...localWeightEntries].reverse().slice(0, 4).map(entry => (
                <div key={entry.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 600, color: "white" }}>
                      {weightUnit === "kg" ? Math.round(entry.weightLbs * 0.453592 * 10) / 10 : entry.weightLbs} {weightUnit}
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                      {new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <button onClick={() => removeLocalWeightEntry(entry.id)}
                    className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)", WebkitTapHighlightColor: "transparent" }}>
                    <X size={11} style={{ color: "rgba(255,255,255,0.25)" }} />
                  </button>
                </div>
              ))}
              {localWeightEntries.length > 4 && (
                <Link href="/progress/weight">
                  <button className="w-full py-2 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    View all {localWeightEntries.length} entries →
                  </button>
                </Link>
              )}
            </div>
          )}

          {/* 30-day weight trend chart */}
          {weightChartData.length >= 2 && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>30-Day Trend</p>
              {(() => {
                // Use .value (in preferred unit) for Y-axis math — always accurate
                const vals = weightChartData.map(d => d.value);
                const padding = weightUnit === "kg" ? 0.5 : 1;
                const minVal = Math.min(...vals);
                const maxVal = Math.max(...vals);
                const min = minVal - padding;
                const max = maxVal + padding;
                // Chart layout: leave 28px on the left for Y-axis labels
                const W = 300; const H = 80; const PX = 6; const PY = 10;
                const LABEL_W = 28;
                const chartW = W - LABEL_W;
                const toX = (i: number) => LABEL_W + PX + (i / (weightChartData.length - 1)) * (chartW - PX * 2);
                const toY = (v: number) => H - PY - ((v - min) / Math.max(0.01, max - min)) * (H - PY * 2);
                const pts = weightChartData.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
                let path = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 1; i < pts.length; i++) {
                  const cx = (pts[i-1].x + pts[i].x) / 2;
                  path += ` C ${cx} ${pts[i-1].y}, ${cx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
                }
                const area = `${path} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`;
                const kgVals = weightChartData.map(d => d.kgValue);
                const isLosing = kgVals[kgVals.length-1] <= kgVals[0];
                const lineColor = isLosing ? "#4ade80" : "#fb923c";
                const glowColor = isLosing ? "#22c55e" : "#f97316";
                const delta = Math.abs(vals[vals.length-1] - vals[0]).toFixed(1);
                const yMax = toY(maxVal);
                const yMin = toY(minVal);
                const latestIdx = pts.length - 1;
                const latestPt = pts[latestIdx];
                return (
                  <div>
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80, overflow: "visible" }} preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={lineColor} stopOpacity="0.50" />
                          <stop offset="30%" stopColor={lineColor} stopOpacity="0.22" />
                          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                        </linearGradient>
                        {/* Neon glow filter for the line */}
                        <filter id="wglow" x="-20%" y="-80%" width="140%" height="260%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feGaussianBlur stdDeviation="1.5" result="blur2" in="SourceGraphic" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="blur2" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        {/* Shimmer animation for the latest dot */}
                        <radialGradient id="dotPulse" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={lineColor} stopOpacity="0.6">
                            <animate attributeName="stop-opacity" values="0.6;0.15;0.6" dur="2s" repeatCount="indefinite" />
                          </stop>
                          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      {/* Y-axis min/max labels */}
                      <text x={LABEL_W - 3} y={yMax + 1} textAnchor="end" fontSize="7" fill="rgba(255,255,255,0.35)" dominantBaseline="middle">{maxVal}</text>
                      <text x={LABEL_W - 3} y={yMin + 1} textAnchor="end" fontSize="7" fill="rgba(255,255,255,0.35)" dominantBaseline="middle">{minVal}</text>
                      {/* Faint horizontal guide lines */}
                      <line x1={LABEL_W} y1={yMax} x2={W} y2={yMax} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3,3" />
                      <line x1={LABEL_W} y1={yMin} x2={W} y2={yMin} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3,3" />
                      {/* Gradient fill area */}
                      <path d={area} fill="url(#wgrad)" />
                      {/* Neon glowing line */}
                      <path d={path} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" filter="url(#wglow)" opacity="0.95" />
                      {/* Latest dot with pulsing halo */}
                      <circle cx={latestPt.x} cy={latestPt.y} r={14} fill="url(#dotPulse)" />
                      <circle cx={latestPt.x} cy={latestPt.y} r={5} fill="white" stroke={glowColor} strokeWidth="2"
                        style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }} />
                      {/* Other data points */}
                      {pts.map((p, i) => i < latestIdx && (
                        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={lineColor} opacity="0.55" />
                      ))}
                    </svg>
                    <div className="flex items-center justify-between mt-1">
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{weightChartData[0].label}</p>
                      <p style={{ fontSize: 9, color: lineColor, fontWeight: 600 }}>
                        {isLosing ? `↓ ${delta} ${weightUnit} lost` : `↑ ${delta} ${weightUnit} gained`}
                      </p>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{weightChartData[weightChartData.length-1].label}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Weekly weight average tile */}
          {weeklyWeightStats && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Weekly Average</p>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: "white", lineHeight: 1 }}>
                    {weeklyWeightStats.avgThisDisplay}
                    <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.3)" }}> {weightUnit}</span>
                  </p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                    avg this week ({weeklyWeightStats.count} {weeklyWeightStats.count === 1 ? "entry" : "entries"})
                  </p>
                </div>
                {weeklyWeightStats.avgLastDisplay != null && weeklyWeightStats.delta != null && (
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: weeklyWeightStats.direction === "down" ? "#4ade80" : weeklyWeightStats.direction === "up" ? "#fb923c" : "rgba(255,255,255,0.5)",
                      }}>
                        {weeklyWeightStats.direction === "down" ? "↓" : weeklyWeightStats.direction === "up" ? "↑" : "="}
                        {weeklyWeightStats.direction !== "same" ? ` ${weeklyWeightStats.delta} ${weightUnit}` : " same"}
                      </span>
                    </div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>vs last week ({weeklyWeightStats.avgLastDisplay} {weightUnit})</p>
                  </div>
                )}
                {weeklyWeightStats.avgLastDisplay == null && (
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Log more entries to see trend</p>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          BMI CARD
      ════════════════════════════════════════════════════════════════════ */}
      {/* Always render BMI section — show setup prompt if profile incomplete */}
      {(bmiData || (!bmiData && profile)) && (
        <div className="px-4 mb-6">
          <SLabel>Body Metrics</SLabel>
          <GlassCard>
            {!bmiData ? (
              /* No height/weight in profile — prompt to set up */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "white" }}>BMI</p>
                </div>
                <Link href="/onboarding?edit=1">
                  <button className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
                    Set up profile →
                  </button>
                </Link>
              </div>
            ) : (
            <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scale size={14} style={{ color: bmiData.color }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "white" }}>BMI</p>
              </div>
              <Link href="/onboarding?edit=1">
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Update →</span>
              </Link>
            </div>

            <div className="flex items-end gap-4 mb-4">
              <div>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 36, fontWeight: 700, color: bmiData.color, lineHeight: 1 }}>
                  {bmiData.bmi}
                </p>
                <p style={{ fontSize: 11, fontWeight: 600, color: bmiData.color, marginTop: 4 }}>{bmiData.category}</p>
              </div>
              <div className="flex-1 pb-1">
                {/* BMI scale bar */}
                <div className="relative h-3 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.07)" }}>
                  {/* Colored zones */}
                  <div className="absolute inset-0 flex">
                    <div style={{ width: "14%", background: "#60a5fa", opacity: 0.4 }} />
                    <div style={{ width: "26%", background: "#4ade80", opacity: 0.4 }} />
                    <div style={{ width: "20%", background: "#fbbf24", opacity: 0.4 }} />
                    <div style={{ flex: 1, background: "#f87171", opacity: 0.4 }} />
                  </div>
                  {/* Position indicator */}
                  <div className="absolute top-0 bottom-0 w-1.5 rounded-full" style={{
                    left: `calc(${Math.round(bmiData.pct * 100)}% - 3px)`,
                    background: "white",
                    boxShadow: `0 0 6px ${bmiData.color}`,
                  }} />
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>15</span>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>18.5</span>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>25</span>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>30</span>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>40</span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
              BMI is a general indicator based on height and weight. It does not account for muscle mass, bone density, or body composition.
            </p>

            {/* Body Fat Divider */}
            <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-3">
                <p style={{ fontSize: 13, fontWeight: 600, color: "white" }}>Body Fat % (US Navy)</p>
                <button onClick={() => setShowBfForm(v => !v)}
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: showBfForm ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
                    color: showBfForm ? "#4ade80" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${showBfForm ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.1)"}`,
                  }}>
                  {showBfForm ? "Hide" : bodyFatData ? "Edit" : "Enter Measurements"}
                </button>
              </div>

              {/* Result display */}
              {bodyFatData && !showBfForm && (
                <div className="flex items-end gap-4">
                  <div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 700, color: bodyFatData.color, lineHeight: 1 }}>
                      {bodyFatData.bf}<span style={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>%</span>
                    </p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: bodyFatData.color, marginTop: 4 }}>{bodyFatData.category}</p>
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="relative h-3 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div className="absolute inset-0 flex">
                        <div style={{ width: "12%", background: "#60a5fa", opacity: 0.4 }} />
                        <div style={{ width: "16%", background: "#4ade80", opacity: 0.4 }} />
                        <div style={{ width: "8%", background: "#a3e635", opacity: 0.4 }} />
                        <div style={{ width: "14%", background: "#fbbf24", opacity: 0.4 }} />
                        <div style={{ flex: 1, background: "#f87171", opacity: 0.4 }} />
                      </div>
                      <div className="absolute top-0 bottom-0 w-1.5 rounded-full" style={{
                        left: `calc(${Math.round(bodyFatData.pct * 100)}% - 3px)`,
                        background: "white",
                        boxShadow: `0 0 6px ${bodyFatData.color}`,
                      }} />
                    </div>
                    <div className="flex justify-between">
                      {profile?.gender === "female"
                        ? ["14%", "21%", "25%", "32%", "40%+"].map(l => <span key={l} style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>{l}</span>)
                        : ["6%", "14%", "18%", "25%", "35%+"].map(l => <span key={l} style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>{l}</span>)
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Measurement form */}
              {showBfForm && (
                <div className="space-y-3">
                  {/* Unit toggle */}
                  <div className="flex gap-2 mb-1">
                    {(["cm", "in"] as const).map(u => (
                      <button key={u} onClick={() => {
                        setBfUnit(u);
                        try { localStorage.setItem("eatvera-bf-unit", u); } catch {}
                        // Convert existing values
                        const convert = (val: string) => {
                          const v = parseFloat(val);
                          if (isNaN(v) || v <= 0) return val;
                          return u === "in" ? (Math.round(v / 2.54 * 10) / 10).toString() : (Math.round(v * 2.54 * 10) / 10).toString();
                        };
                        if (u !== bfUnit) saveBfMeasurements({
                          waist: convert(bfMeasurements.waist),
                          neck: convert(bfMeasurements.neck),
                          hip: convert(bfMeasurements.hip),
                        });
                      }}
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: bfUnit === u ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)",
                          color: bfUnit === u ? "#4ade80" : "rgba(255,255,255,0.35)",
                          border: `1px solid ${bfUnit === u ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.08)"}`,
                        }}>{u}</button>
                    ))}
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", alignSelf: "center" }}>Measure at widest point</span>
                  </div>

                  {["waist", "neck", ...(profile?.gender === "female" ? ["hip"] : [])].map(field => (
                    <div key={field} className="flex items-center gap-3">
                      <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", width: 44, textTransform: "capitalize" }}>{field}</label>
                      <input
                        type="number" inputMode="decimal"
                        value={bfMeasurements[field as keyof typeof bfMeasurements]}
                        onChange={e => saveBfMeasurements({ ...bfMeasurements, [field]: e.target.value })}
                        placeholder={bfUnit === "cm" ? (field === "neck" ? "38" : field === "waist" ? "85" : "95") : (field === "neck" ? "15" : field === "waist" ? "33" : "37")}
                        className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", width: 20 }}>{bfUnit}</span>
                    </div>
                  ))}

                  {!bodyFatData && bfMeasurements.waist && bfMeasurements.neck && (
                    <p style={{ fontSize: 11, color: "rgba(248,113,113,0.7)" }}>
                      {profile?.gender === "female" && !bfMeasurements.hip
                        ? "Hip measurement required for women."
                        : "Waist must be larger than neck. Check your measurements."}
                    </p>
                  )}

                  {bodyFatData && (
                    <button onClick={() => setShowBfForm(false)}
                      className="w-full py-2 rounded-xl text-sm font-semibold"
                      style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}>
                      Done — {bodyFatData.bf}% {bodyFatData.category}
                    </button>
                  )}
                </div>
              )}

              {!bodyFatData && !showBfForm && (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                  Enter your waist and neck measurements above to estimate body fat % using the US Navy formula.
                </p>
              )}
            </div>
            </> /* end bmiData ternary Fragment */
            )}
          </GlassCard>
        </div>
      )}

      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", textAlign: "center", padding: "4px 32px 8px" }}>
        EatVera provides general wellness guidance, not medical advice.
      </p>
      </div>{/* end z-10 content wrapper */}

      {/* ── Edit Goals Modal ─────────────────────────────────────────────── */}
      {showEditGoals && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowEditGoals(false); }}
        >
          <div
            className="w-full max-w-md rounded-t-3xl"
            style={{
              background: "rgba(10,24,18,0.97)",
              border: "1px solid rgba(74,222,128,0.18)",
              borderBottom: "none",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
              animation: "slideUpModal 0.3s cubic-bezier(0.22,1,0.36,1)",
              maxHeight: "90dvh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Handle + Title — sticky header */}
            <div className="px-5 pt-5" style={{ flexShrink: 0 }}>
              <div className="flex justify-center mb-4">
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
              </div>
              <div className="flex items-center justify-between mb-5">
                <p style={{ fontSize: 16, fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}>Edit Daily Goals</p>
                <button onClick={() => setShowEditGoals(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <X size={14} style={{ color: "rgba(255,255,255,0.6)" }} />
                </button>
              </div>
            </div>
            {/* Scrollable fields */}
            <div className="px-5 overflow-y-auto" style={{ flexShrink: 1, overflowY: "auto" }}>
              <div className="space-y-3 mb-5">
                {([
                  { key: "calories" as const, label: "Calories", unit: "kcal", color: "#4ade80" },
                  { key: "protein" as const, label: "Protein", unit: "g", color: "#a78bfa" },
                  { key: "carbs" as const, label: "Carbs", unit: "g", color: "#60a5fa" },
                  { key: "fat" as const, label: "Fat", unit: "g", color: "#fb923c" },
                  { key: "steps" as const, label: "Steps", unit: "steps", color: "#60a5fa" },
                  { key: "burn" as const, label: "Cal Burned", unit: "kcal", color: "#fb923c" },
                ]).map(({ key, label, unit, color }) => (
                  <div key={key} className="flex items-center gap-3">
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500, width: 72, flexShrink: 0 }}>{label}</p>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={editGoalValues[key]}
                        onChange={e => setEditGoalValues(v => ({ ...v, [key]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") saveAllGoals(); if (e.key === "Escape") setShowEditGoals(false); }}
                        className="w-full rounded-xl px-3 py-2 text-sm font-mono focus:outline-none"
                        style={{
                          background: "rgba(255,255,255,0.07)",
                          border: `1px solid rgba(255,255,255,0.12)`,
                          color: "white",
                          fontSize: 14,
                        }}
                      />
                      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "rgba(255,255,255,0.3)", pointerEvents: "none" }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Save button — always pinned at bottom, clears the fixed bottom nav (~64px) */}
            <div className="px-5 pt-3" style={{ flexShrink: 0, paddingBottom: "max(5rem, calc(4rem + env(safe-area-inset-bottom, 0px)))" }}>
              <button
                onClick={saveAllGoals}
                className="w-full py-3 rounded-2xl font-semibold text-sm focus:outline-none"
                style={{
                  background: "linear-gradient(135deg, #1f7a1f, #2e9e2e)",
                  color: "white",
                  boxShadow: "0 4px 16px rgba(46,158,46,0.3)",
                  letterSpacing: "0.02em",
                }}
              >
                Save Goals
              </button>
            </div>
          </div>
          <style>{`@keyframes slideUpModal { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
      )}
    </div>
  );
}
