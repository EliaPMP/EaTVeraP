/**
 * EatVera Calorie Scanner — Cal AI-style food photo analysis
 * Take a photo of any meal → AI returns exact calories + macros
 */
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Camera, Upload, Zap, RefreshCw, ChevronDown, ChevronUp,
  Flame, Beef, Wheat, Droplets, Leaf, AlertTriangle, Star,
  Clock, Trash2, Info, CheckCircle, XCircle, Minus, Heart, Share2,
  Sun, Moon, FlaskConical, Download, FileDown, Images
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import DailyCalorieProgress from "@/components/DailyCalorieProgress";
import { useAuth } from "@/_core/hooks/useAuth";
import MealSuggestions from "@/components/MealSuggestions";
import { useStreakBadges } from "@/hooks/useStreakBadges";
import { useMealFavourites } from "@/hooks/useMealFavourites";
import type { FavouriteMeal } from "@/hooks/useMealFavourites";
import ShareMealCard from "@/components/ShareMealCard";
import NutritionGoalProgress from "@/components/NutritionGoalProgress";
import WeeklyReportCard from "@/components/WeeklyReportCard";

// ─── Types ───────────────────────────────────────────────────────────────────
interface IngredientFlag {
  name: string;
  category: "seed_oil" | "artificial_color" | "preservative" | "sweetener" | "msg" | "carrageenan" | "hfcs" | "other";
  severity: "high" | "moderate" | "low";
  reason: string;
}

interface IngredientAnalysis {
  ingredientsDetected: boolean;
  rawIngredientText: string;
  flags: IngredientFlag[];
  ingredientQuality: "good" | "moderate" | "poor" | "unknown";
  imageQualityOk: boolean;
  retakePrompt?: string;
}

interface MealAnalysis {
  mealName: string;
  confidence: "high" | "medium" | "low";
  totalCalories: number;
  servingDescription: string;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  items: Array<{
    name: string;
    estimatedAmount: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  qualityScore: number;
  qualityNotes: string[];
  healthTip: string;
  warnings: string[];
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface MealLogEntry {
  id: string;
  imageUrl: string;
  analysis: MealAnalysis;
  ingredientAnalysis?: IngredientAnalysis | null;
  analyzedAt: string;
  mealType?: MealType;
}

// ─── Score color helpers ──────────────────────────────────────────────────────
function getScoreColor(score: number) {
  if (score >= 75) return "#0B3D2E";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}
function getScoreBg(score: number) {
  if (score >= 75) return "#f0fdf4";
  if (score >= 50) return "#fffbeb";
  return "#fef2f2";
}
function getScoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Avoid";
}

// ─── Score Ring (light-mode card style, matches mockup) ──────────────────────
function ScoreRing({ score, confidence }: { score: number; confidence?: "high" | "medium" | "low" }) {
  const [animatedOffset, setAnimatedOffset] = useState<number | null>(null);
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  useEffect(() => {
    setAnimatedOffset(circumference);
    const t = setTimeout(() => setAnimatedOffset(targetOffset), 80);
    return () => clearTimeout(t);
  }, [score, circumference, targetOffset]);

  const currentOffset = animatedOffset ?? circumference;

  const confConfig = confidence === "high"
    ? { label: "High Confidence", color: "#0B3D2E", bg: "#f0fdf4" }
    : confidence === "medium"
    ? { label: "Med Confidence", color: "#d97706", bg: "#fffbeb" }
    : { label: "Low Confidence", color: "#dc2626", bg: "#fef2f2" };

  return (
    <div
      className="rounded-2xl p-3 flex flex-col items-center bg-white dark:bg-zinc-900"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)", minWidth: 120 }}
    >
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
          <circle
            cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={currentOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="font-bold leading-none" style={{ color, fontFamily: "'DM Mono', monospace", fontSize: 28 }}>{score}</div>
          <div className="text-[10px] font-semibold text-muted-foreground">/100</div>
          <div className="text-[11px] font-bold mt-0.5" style={{ color }}>{label}</div>
        </div>
      </div>
      {confidence && (
        <div
          className="mt-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{ background: confConfig.bg, color: confConfig.color }}
        >
          <CheckCircle size={10} />
          {confConfig.label}
        </div>
      )}
    </div>
  );
}

// ─── Macro Bar ────────────────────────────────────────────────────────────────
function MacroBar({ label, value, unit, color, max }: {
  label: string; value: number; unit: string; color: string; max: number;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className="text-xs font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
          {Math.round(value)}{unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Confidence Badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const config = {
    high: { label: "High Confidence", color: "#0B3D2E", bg: "#f0fdf4", icon: CheckCircle },
    medium: { label: "Medium Confidence", color: "#d97706", bg: "#fffbeb", icon: Minus },
    low: { label: "Low Confidence", color: "#dc2626", bg: "#fef2f2", icon: XCircle },
  }[confidence];
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ background: config.bg, color: config.color }}>
      <Icon size={12} />
      {config.label}
    </div>
  );
}

// ─── Ingredient Flag Category Labels ───────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<IngredientFlag["category"], string> = {
  seed_oil: "Seed Oil",
  artificial_color: "Artificial Color",
  preservative: "Preservative",
  sweetener: "Artificial Sweetener",
  msg: "MSG / Flavor Enhancer",
  carrageenan: "Carrageenan",
  hfcs: "High Fructose Corn Syrup",
  other: "Controversial Additive",
};

function getSeverityStyle(severity: IngredientFlag["severity"]) {
  if (severity === "high") return { bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.25)", badge: "#dc2626", badgeBg: "rgba(220,38,38,0.12)", dot: "#dc2626" };
  if (severity === "moderate") return { bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.25)", badge: "#d97706", badgeBg: "rgba(217,119,6,0.12)", dot: "#d97706" };
  return { bg: "rgba(100,116,139,0.06)", border: "rgba(100,116,139,0.2)", badge: "#64748b", badgeBg: "rgba(100,116,139,0.1)", dot: "#64748b" };
}

function getQualityStyle(quality: IngredientAnalysis["ingredientQuality"]) {
  if (quality === "good") return { color: "#0B3D2E", bg: "rgba(11,61,46,0.08)", label: "Clean Ingredients" };
  if (quality === "moderate") return { color: "#d97706", bg: "rgba(217,119,6,0.08)", label: "Some Concerns" };
  if (quality === "poor") return { color: "#dc2626", bg: "rgba(220,38,38,0.08)", label: "Poor Quality" };
  return { color: "#64748b", bg: "rgba(100,116,139,0.08)", label: "Label Not Found" };
}

// ─── Ingredient Flags Panel ───────────────────────────────────────────────────────────────────
function IngredientFlagsPanel({ ingredientAnalysis, onRetake }: {
  ingredientAnalysis: IngredientAnalysis;
  onRetake: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const quality = getQualityStyle(ingredientAnalysis.ingredientQuality);

  // Poor image quality — show retake prompt
  if (!ingredientAnalysis.imageQualityOk && ingredientAnalysis.retakePrompt) {
    return (
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-4 border" style={{ background: "rgba(217,119,6,0.06)", borderColor: "rgba(217,119,6,0.25)" }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(217,119,6,0.15)" }}>
              <Camera size={15} style={{ color: "#d97706" }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold mb-1" style={{ color: "#d97706" }}>Ingredient Label Unreadable</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{ingredientAnalysis.retakePrompt}</p>
              <button
                onClick={onRetake}
                className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(217,119,6,0.15)", color: "#d97706" }}
              >
                Retake Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No ingredient label in image (meal photo)
  if (!ingredientAnalysis.ingredientsDetected) {
    return (
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-3.5 border border-border ec-card">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
              <Info size={13} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">No Ingredient Label Detected</p>
              <p className="text-[10px] text-muted-foreground">Scan a packaged product to analyze additives</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const flagCount = ingredientAnalysis.flags.length;

  // No flags — show clean badge
  if (flagCount === 0) {
    return (
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-3.5 border flex items-center gap-3" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(11,61,46,0.1)" }}>
            <CheckCircle size={15} style={{ color: "#0B3D2E" }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#0B3D2E" }}>Clean Ingredients</p>
            <p className="text-[10px] text-muted-foreground">No concerning additives detected</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-4">
      {/* Expandable detail header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full rounded-2xl p-3.5 border flex items-center justify-between mb-2"
        style={{ background: "#fffbeb", borderColor: "#fde68a" }}
      >
        <div className="flex items-center gap-2">
          <Info size={14} style={{ color: "#d97706" }} />
          <span className="text-xs font-semibold" style={{ color: "#92400e" }}>See ingredient details ({flagCount})</span>
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: "#d97706" }} /> : <ChevronDown size={14} style={{ color: "#d97706" }} />}
      </button>

      {/* Expanded flag detail list */}
      {expanded && (
        <div className="space-y-2">
          {ingredientAnalysis.flags.map((flag, i) => {
            const style = getSeverityStyle(flag.severity);
            return (
              <div
                key={i}
                className="rounded-2xl p-3.5 border"
                style={{ background: style.bg, borderColor: style.border }}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: style.dot }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-bold text-foreground">{flag.name}</span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ color: style.badge, background: style.badgeBg }}
                      >
                        {CATEGORY_LABELS[flag.category]}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{flag.reason}</p>
                  </div>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase flex-shrink-0"
                    style={{ color: style.badge, background: style.badgeBg }}
                  >
                    {flag.severity}
                  </span>
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-muted-foreground px-1">
            ℹ️ For informational purposes only. Not medical advice.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Save to Photos helper ────────────────────────────────────────────────────
async function saveToPhotos(meal: MealAnalysis, imageUrl: string) {
  try {
    // Dynamically import renderSquareCard logic via ShareMealCard canvas
    // We use the same canvas approach: load the meal image, draw a clean card, download
    const { default: html2canvas } = await import("html2canvas");
    const el = document.getElementById("calorie-result-card");
    if (!el) { toast.error("Could not capture card"); return; }
    const canvas = await html2canvas(el, {
      useCORS: true,
      allowTaint: false,
      scale: 2,
      backgroundColor: null,
      logging: false,
    });
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `eatvera-${meal.mealName.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
    toast.success("Saved to Photos!", { description: "Your meal card has been downloaded." });
  } catch {
    toast.error("Could not save image. Try the Share button instead.");
  }
}

// ─── Analyzing Overlay (inline Cal AI-style) ──────────────────────────────────────────────
const ANALYZE_STEPS = [
  { icon: "🔍", text: "Identifying ingredients..." },
  { icon: "🥦", text: "Recognising food items..." },
  { icon: "⚖️", text: "Estimating portion sizes..." },
  { icon: "🔥", text: "Calculating calories..." },
  { icon: "📊", text: "Computing macros..." },
  { icon: "✨", text: "Finalising results..." },
];

function AnalyzingOverlay({ capturedImage }: { capturedImage: string | null }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [stepVisible, setStepVisible] = useState(true);

  // Cycle through analysis steps
  useEffect(() => {
    const interval = setInterval(() => {
      setStepVisible(false);
      setTimeout(() => {
        setStepIdx(i => (i + 1) % ANALYZE_STEPS.length);
        setStepVisible(true);
      }, 300);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const step = ANALYZE_STEPS[stepIdx];

  return (
    <div className="px-4 pb-6">
      {/* Image card with centered loading circle */}
      <div
        className="relative w-full overflow-hidden rounded-3xl mb-4"
        style={{
          aspectRatio: "4/3",
          boxShadow: "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
        }}
      >
        {/* Food photo */}
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Analyzing meal"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-900" />
        )}

        {/* Dark overlay so the loader pops */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.38)" }}
        />

        {/* Centered loading circle with EatVera leaf */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
            {/* Outer spinning arc */}
            <svg
              width="88"
              height="88"
              viewBox="0 0 88 88"
              className="absolute inset-0"
              style={{ animation: "analyzeSpinOuter 1.4s linear infinite" }}
            >
              <circle
                cx="44" cy="44" r="38"
                fill="none"
                stroke="rgba(74,222,128,0.18)"
                strokeWidth="3"
              />
              <circle
                cx="44" cy="44" r="38"
                fill="none"
                stroke="url(#spinGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="72 167"
              />
              <defs>
                <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0" />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity="1" />
                </linearGradient>
              </defs>
            </svg>
            {/* Inner counter-spinning arc */}
            <svg
              width="68"
              height="68"
              viewBox="0 0 68 68"
              className="absolute"
              style={{ animation: "analyzeSpinInner 2s linear infinite" }}
            >
              <circle
                cx="34" cy="34" r="28"
                fill="none"
                stroke="rgba(74,222,128,0.12)"
                strokeWidth="2"
              />
              <circle
                cx="34" cy="34" r="28"
                fill="none"
                stroke="rgba(74,222,128,0.55)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="30 146"
              />
            </svg>
            {/* Center badge — frosted glass with leaf */}
            <div
              className="relative z-10 flex items-center justify-center rounded-full"
              style={{
                width: 52,
                height: 52,
                background: "linear-gradient(145deg, rgba(15,74,55,0.92) 0%, rgba(31,122,31,0.88) 100%)",
                boxShadow: "0 0 0 1.5px rgba(74,222,128,0.35), 0 4px 20px rgba(13,61,40,0.7), inset 0 1px 0 rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                animation: "analyzeLeafPulse 2s ease-in-out infinite",
              }}
            >
              <Leaf size={22} className="text-white" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }} />
            </div>
          </div>
        </div>

        {/* Analysing badge at top */}
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.8)", animation: "analyzeDot 1.2s ease-in-out infinite" }}
          />
          <span className="text-[11px] font-semibold text-white" style={{ letterSpacing: "0.02em" }}>Analysing</span>
        </div>
      </div>

      {/* Status card */}
      <div
        className="rounded-2xl px-4 py-4 mb-3"
        style={{
          background: "linear-gradient(135deg, #0d3d28 0%, #1a5c38 100%)",
          boxShadow: "0 4px 20px rgba(13,61,40,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Cycling step */}
        <div
          className="flex items-center gap-3 mb-3"
          style={{ transition: "opacity 0.3s ease", opacity: stepVisible ? 1 : 0 }}
        >
          <span style={{ fontSize: 20 }}>{step.icon}</span>
          <span className="text-sm font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>
            {step.text}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
          <div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #22c55e, #4ade80)",
              animation: "analyzeProgress 8s linear forwards",
              boxShadow: "0 0 8px rgba(74,222,128,0.5)",
            }}
          />
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {ANALYZE_STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === stepIdx ? 16 : 5,
                height: 5,
                background: i === stepIdx ? "#4ade80" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Hint */}
      <p className="text-center text-[11px] text-muted-foreground" style={{ letterSpacing: "0.02em" }}>
        Usually takes 5–10 seconds
      </p>

      <style>{`
        @keyframes analyzeSpinOuter {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes analyzeSpinInner {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes analyzeLeafPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 1.5px rgba(74,222,128,0.35), 0 4px 20px rgba(13,61,40,0.7); }
          50% { transform: scale(1.06); box-shadow: 0 0 0 3px rgba(74,222,128,0.5), 0 4px 28px rgba(13,61,40,0.85); }
        }
        @keyframes analyzeDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
        @keyframes analyzeProgress {
          0%   { width: 0%; }
          100% { width: 90%; }
        }
      `}</style>
    </div>
  );
}

// ─── Analysis Result Card ───────────────────────────────────────────────────────────────────
function AnalysisResult({
  analysis, imageUrl, ingredientAnalysis, onSave, onRetake, onShare
}: {
  analysis: MealAnalysis;
  imageUrl: string;
  ingredientAnalysis?: IngredientAnalysis | null;
  onSave: () => void;
  onRetake: () => void;
  onShare: () => void;
}) {
  const [showItems, setShowItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const scoreColor = getScoreColor(analysis.qualityScore);

  const handleSaveToPhotos = async () => {
    setSaving(true);
    await saveToPhotos(analysis, imageUrl);
    setSaving(false);
  };

  return (
    <div
      className="pb-8"
      style={{ animation: "resultSlideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both" }}
    >
      <style>{`
        @keyframes resultSlideUp {
          from {
            opacity: 0;
            transform: translateY(32px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      {/* ── Main Result Card (white, clean, matches mockup) ── */}
      <div
        id="calorie-result-card"
        className="mx-3 mb-5 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)" }}
      >
        {/* ── Top branding bar ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
            <Leaf size={13} className="text-green-900 dark:text-green-300" />
            <span className="text-[12px] font-bold text-green-900 dark:text-green-300">EatVera</span>
          </div>
          <span className="text-[12px] font-medium text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>

        {/* ── Food photo with gradient fade + score card overlay ── */}
        <div className="relative mx-3 rounded-2xl overflow-hidden" style={{ height: 260 }}>
          {!heroLoaded && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}
          <img
            src={imageUrl}
            alt="Analyzed meal"
            className="w-full h-full object-cover"
            style={{ opacity: heroLoaded ? 1 : 0, transition: "opacity 0.4s ease" }}
            onLoad={() => setHeroLoaded(true)}
          />
          {/* Bottom gradient fade — theme-aware */}
          <div
            className="absolute inset-0 pointer-events-none photo-gradient-fade"
          />
          {/* Score circle card — bottom right, overlaid on photo */}
          <div className="absolute bottom-3 right-3">
            <ScoreRing score={analysis.qualityScore} confidence={analysis.confidence} />
          </div>
        </div>

        {/* ── Meal info below photo ── */}
        <div className="px-4 pt-3 pb-2">
          <p className="text-[11px] font-medium text-muted-foreground">I just scanned my meal</p>
          <h2
            className="font-bold leading-tight mt-0.5 mb-3 text-foreground"
            style={{ fontSize: 22, letterSpacing: "-0.02em" }}
          >
            {analysis.mealName}
          </h2>
          {/* Calorie row */}
          <div className="flex items-baseline gap-2 mb-4">
            <Flame size={18} style={{ color: "#f97316" }} />
            <span
              className="font-bold leading-none text-green-900 dark:text-green-300"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 44, letterSpacing: "-0.04em" }}
            >
              {analysis.totalCalories}
            </span>
            <span className="text-base font-medium text-muted-foreground">calories</span>
          </div>
        </div>

        {/* ── Macro cards row ── */}
        <div className="grid grid-cols-3 gap-2.5 px-4 pb-4">
          {[
            { label: "Protein", value: analysis.macros.protein, color: "#3b82f6", icon: Beef },
            { label: "Carbs", value: analysis.macros.carbs, color: "#f59e0b", icon: Wheat },
            { label: "Fat", value: analysis.macros.fat, color: "#ef4444", icon: Droplets },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl py-3 px-2 text-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
            >
              <Icon size={14} style={{ color }} className="mx-auto mb-1" />
              <div
                className="font-bold leading-none"
                style={{ color, fontFamily: "'DM Mono', monospace", fontSize: 20 }}
              >
                {Math.round(value)}<span className="text-[11px] font-medium">g</span>
              </div>
              <div className="text-[10px] font-medium mt-1 text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Flagged Ingredients (pill chips) ── */}
        {ingredientAnalysis && ingredientAnalysis.ingredientsDetected && ingredientAnalysis.flags.length > 0 && (
          <div className="mx-4 mb-4 rounded-2xl p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} style={{ color: "#d97706" }} />
              <span className="text-sm font-bold text-foreground">Flagged Ingredients</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {ingredientAnalysis.flags.map((flag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 text-gray-700 dark:text-gray-200"
                >
                  {flag.name}
                </span>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              These ingredients may not align with your health goals.<br />
              Tap any ingredient to learn more.
            </p>
          </div>
        )}

        {/* ── EatVera footer ── */}
        <div
          className="flex items-center justify-center gap-1.5 py-3 mx-4 mb-4 rounded-xl bg-gray-50 dark:bg-zinc-800"
        >
          <Leaf size={11} className="text-green-900 dark:text-green-400" />
          <span className="text-[10px] font-medium text-muted-foreground">Scanned with EatVera · Know what you eat</span>
        </div>
      </div>

      {/* Detailed macro bars — below the card */}
      <div className="px-4 mb-4">
        <div className="ec-card rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Macronutrient Detail</div>
          <MacroBar label="Protein" value={analysis.macros.protein} unit="g" color="#dc2626" max={60} />
          <MacroBar label="Carbohydrates" value={analysis.macros.carbs} unit="g" color="#d97706" max={150} />
          <MacroBar label="Fat" value={analysis.macros.fat} unit="g" color="#2563eb" max={80} />
          <MacroBar label="Fiber" value={analysis.macros.fiber} unit="g" color="#0B3D2E" max={30} />
          <MacroBar label="Sugar" value={analysis.macros.sugar} unit="g" color="#db2777" max={60} />
        </div>
      </div>

      {/* Food Items Breakdown */}
      {analysis.items.length > 0 && (
        <div className="px-4 mb-4">
          <button
            onClick={() => setShowItems(!showItems)}
            className="w-full ec-card rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <Leaf size={14} className="text-muted-foreground" />
              </div>
              <span className="font-semibold text-foreground text-sm">
                {analysis.items.length} Food Item{analysis.items.length !== 1 ? "s" : ""} Detected
              </span>
            </div>
            {showItems ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </button>
          {showItems && (
            <div className="mt-2 ec-card rounded-2xl overflow-hidden">
              {analysis.items.map((item, i) => (
                <div
                  key={i}
                  className={`p-3.5 flex items-center justify-between ${i < analysis.items.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.estimatedAmount}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">P: {Math.round(item.protein)}g</span>
                      <span className="text-[10px] text-muted-foreground">C: {Math.round(item.carbs)}g</span>
                      <span className="text-[10px] text-muted-foreground">F: {Math.round(item.fat)}g</span>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {item.calories}
                    </div>
                    <div className="text-[10px] text-muted-foreground">kcal</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quality Notes */}
      {analysis.qualityNotes.length > 0 && (
        <div className="px-4 mb-4">
          <div className="rounded-2xl p-4 border" style={{ background: getScoreBg(analysis.qualityScore), borderColor: `${scoreColor}30` }}>
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} style={{ color: scoreColor }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: scoreColor }}>Quality Notes</span>
            </div>
            <ul className="space-y-1">
              {analysis.qualityNotes.map((note, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="mt-0.5 text-muted-foreground">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Ingredient Flags Panel */}
      {ingredientAnalysis && (
        <IngredientFlagsPanel
          ingredientAnalysis={ingredientAnalysis}
          onRetake={onRetake}
        />
      )}

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <div className="px-4 mb-4">
          <div className="rounded-2xl p-4 border" style={{ borderColor: "rgba(220,38,38,0.3)", background: "rgba(220,38,38,0.06)" }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-500">Warnings</span>
            </div>
            <ul className="space-y-1">
              {analysis.warnings.map((w, i) => (
                <li key={i} className="text-xs text-red-400 dark:text-red-400 flex items-start gap-1.5">
                  <span className="mt-0.5">⚠</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Health Tip */}
      {analysis.healthTip && (
        <div className="px-4 mb-5">
          <div className="rounded-2xl p-4 border" style={{ borderColor: "rgba(20,90,58,0.3)", background: "rgba(20,90,58,0.06)" }}>
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(20,90,58,0.15)" }}>
                <Zap size={13} style={{ color: "#2e9e2e" }} />
              </div>
              <div>
                <div className="text-xs font-bold mb-1" style={{ color: "#2e9e2e" }}>Health Tip</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{analysis.healthTip}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* What to Eat Next — Meal Suggestions */}
      <MealSuggestions lastMealName={analysis.mealName} />

      {/* Action Buttons */}
      <div className="px-4 flex gap-3 mb-3">
        <button
          onClick={onSave}
          className="flex-1 py-3.5 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #145A3A, #0B3D2E)" }}
        >
          <CheckCircle size={16} />
          Save to Log
        </button>
        <button
          onClick={onRetake}
          className="flex-1 py-3.5 rounded-2xl font-semibold text-sm text-foreground border border-border flex items-center justify-center gap-2 ec-card"
        >
          <RefreshCw size={16} />
          Retake
        </button>
      </div>
      {/* Save to Photos + Share row */}
      <div className="px-4 flex gap-3">
        <button
          onClick={handleSaveToPhotos}
          disabled={saving}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border border-border ec-card text-foreground hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {saving ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
          {saving ? "Saving..." : "Save to Photos"}
        </button>
        <button
          onClick={onShare}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border border-border ec-card text-foreground hover:opacity-80 transition-opacity"
        >
          <Share2 size={15} />
          Share Score
        </button>
      </div>
    </div>
  );
}

// ─── Meal Log Entry Card ─────────────────────────────────────────────────────
const MEAL_TAG_META: Record<MealType, { emoji: string; label: string; color: string }> = {
  breakfast: { emoji: "🌅", label: "Breakfast", color: "#f97316" },
  lunch:     { emoji: "☀️",  label: "Lunch",     color: "#eab308" },
  dinner:    { emoji: "🌙", label: "Dinner",    color: "#6366f1" },
  snack:     { emoji: "🍎", label: "Snack",     color: "#0B3D2E" },
};

function MealLogCard({ entry, onDelete, onStar, isStarred, onShare, onChangeTag, highlighted, cardRef }: {
  entry: MealLogEntry;
  onDelete: () => void;
  onStar: () => void;
  isStarred: boolean;
  onShare: () => void;
  onChangeTag?: (newType: MealType) => void;
  highlighted?: boolean;
  cardRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [showTagPicker, setShowTagPicker] = useState(false);
  const scoreColor = getScoreColor(entry.analysis.qualityScore);
  const time = new Date(entry.analyzedAt).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true
  });
  const tagMeta = entry.mealType ? MEAL_TAG_META[entry.mealType] : null;

  // Swipe-to-delete
  const swipeStartX = useRef<number | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const DELETE_THRESHOLD = 80;

  const handleSwipeTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    setSwiping(true);
  };
  const handleSwipeTouchMove = (e: React.TouchEvent) => {
    if (swipeStartX.current === null) return;
    const dx = e.touches[0].clientX - swipeStartX.current;
    if (dx < 0) setSwipeX(Math.max(dx, -120));
  };
  const handleSwipeTouchEnd = () => {
    setSwiping(false);
    if (swipeX <= -DELETE_THRESHOLD) {
      // Animate out then delete
      setSwipeX(-400);
      setTimeout(() => onDelete(), 280);
    } else {
      setSwipeX(0);
    }
    swipeStartX.current = null;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Red delete zone (revealed on swipe) */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center"
        style={{
          width: 80,
          background: "linear-gradient(135deg, #dc2626, #ef4444)",
          borderRadius: "0 16px 16px 0",
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <Trash2 size={18} className="text-white" />
          <span className="text-white text-[9px] font-bold">Delete</span>
        </div>
      </div>

      {/* Card — slides left on swipe */}
      <div
        ref={cardRef as React.RefObject<HTMLDivElement>}
        onTouchStart={handleSwipeTouchStart}
        onTouchMove={handleSwipeTouchMove}
        onTouchEnd={handleSwipeTouchEnd}
        className="ec-card rounded-2xl p-3.5 relative"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? "none" : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
          zIndex: 1,
          outline: highlighted ? "2px solid #4ade80" : "none",
          outlineOffset: 2,
          boxShadow: highlighted ? "0 0 16px rgba(74,222,128,0.35)" : undefined,
        }}
      >
      <div className="flex items-center gap-3">
        <img
          src={entry.imageUrl}
          alt={entry.analysis.mealName}
          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{entry.analysis.mealName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
              {entry.analysis.totalCalories} kcal
            </span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground">{time}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground">P: {Math.round(entry.analysis.macros.protein)}g</span>
            <span className="text-[10px] text-muted-foreground">C: {Math.round(entry.analysis.macros.carbs)}g</span>
            <span className="text-[10px] text-muted-foreground">F: {Math.round(entry.analysis.macros.fat)}g</span>
          </div>
          {/* Editable meal tag badge */}
          {onChangeTag && (
            <button
              onClick={() => setShowTagPicker(v => !v)}
              className="mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full transition-all active:scale-95"
              style={{
                background: tagMeta ? `${tagMeta.color}18` : "var(--muted)",
                border: `1px solid ${tagMeta ? `${tagMeta.color}40` : "var(--border)"}`,
              }}
            >
              <span className="text-[10px]">{tagMeta ? tagMeta.emoji : "🏷️"}</span>
              <span
                className="text-[10px] font-semibold"
                style={{ color: tagMeta ? tagMeta.color : "var(--muted-foreground)" }}
              >
                {tagMeta ? tagMeta.label : "Tag meal"}
              </span>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ opacity: 0.5 }}>
                <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: scoreColor, background: `${scoreColor}15` }}>
            {entry.analysis.qualityScore}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onStar} className="transition-colors">
              <Heart size={14} className={isStarred ? "fill-red-400 text-red-400" : "text-stone-300 hover:text-red-300"} />
            </button>
            <button onClick={onShare} className="text-stone-300 hover:text-blue-400 transition-colors">
              <Share2 size={14} />
            </button>
            <button onClick={onDelete} className="text-stone-300 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Inline tag picker */}
      {showTagPicker && onChangeTag && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Change meal type</p>
          <div className="flex gap-2">
            {(Object.entries(MEAL_TAG_META) as [MealType, typeof MEAL_TAG_META[MealType]][]).map(([type, meta]) => (
              <button
                key={type}
                onClick={() => { onChangeTag(type); setShowTagPicker(false); }}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all active:scale-95"
                style={{
                  background: entry.mealType === type ? `${meta.color}20` : "var(--muted)",
                  border: `1.5px solid ${entry.mealType === type ? meta.color : "transparent"}`,
                }}
              >
                <span className="text-base">{meta.emoji}</span>
                <span
                  className="text-[9px] font-bold"
                  style={{ color: entry.mealType === type ? meta.color : "var(--muted-foreground)" }}
                >
                  {meta.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// ─── Streak Indicator (header badge) ────────────────────────────────────────
function StreakIndicator() {
  const { streakInfo } = useStreakBadges();
  if (streakInfo.currentStreak === 0) return null;
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{ background: "#fff7ed", border: "1.5px solid #fed7aa" }}
    >
      <Flame size={13} style={{ color: "#f97316" }} />
      <span className="text-xs font-bold" style={{ color: "#c2410c", fontFamily: "'DM Mono', monospace" }}>
        {streakInfo.currentStreak}
      </span>
      <span className="text-[10px] text-orange-400">day streak</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CalorieScannerPage() {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<"idle" | "camera" | "preview" | "analyzing" | "result">(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("autoCamera") === "true" ? "camera" : "idle";
  });

  // Clean up autoCamera param from URL after mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoCamera") === "true") {
      const url = new URL(window.location.href);
      url.searchParams.delete("autoCamera");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mealContext, setMealContext] = useState("");
  const [analysisResult, setAnalysisResult] = useState<{ analysis: MealAnalysis; imageUrl: string; ingredientAnalysis?: IngredientAnalysis | null } | null>(null);
  const [mealLog, setMealLog] = useState<MealLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem("eatclean-meal-log");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"scan" | "log" | "favourites">("scan");
  const [highlightMealId, setHighlightMealId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightCardRef = useRef<HTMLDivElement | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEntry, setShareEntry] = useState<MealLogEntry | null>(null);
  // Recent scans — persisted separately, shown in idle Scan tab
  const [recentScans, setRecentScans] = useState<MealLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem("eatclean-recent-scans");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [showMealTagSelector, setShowMealTagSelector] = useState(false);
  const [pendingMealType, setPendingMealType] = useState<MealType>("snack");
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [torchOn, setTorchOn] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [photoQualityHint, setPhotoQualityHint] = useState<"dark" | "bright" | null>(null);
  const [showZoomPill, setShowZoomPill] = useState(false);
  const zoomPillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tap-to-focus indicator state
  const [focusIndicator, setFocusIndicator] = useState<{ x: number; y: number; key: number } | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const { favourites, isFavourite, toggleFavourite } = useMealFavourites();

  // Streak milestone toast
  const [streakToast, setStreakToast] = useState<{ streak: number; emoji: string; label: string } | null>(null);
  const streakToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const STREAK_MILESTONES: Record<number, { emoji: string; label: string }> = {
    3:  { emoji: "🌱", label: "3-Day Streak!" },
    7:  { emoji: "🌿", label: "Week Warrior!" },
    14: { emoji: "🌳", label: "Two-Week Champion!" },
    30: { emoji: "💎", label: "Monthly Legend!" },
  };

  // Logo mount animation + staggered text reveal
  const [logoVisible, setLogoVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  useEffect(() => {
    // Reset both on every mount
    setLogoVisible(false);
    setTextVisible(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLogoVisible(true);
        // Text staggered 60ms after logo starts
        setTimeout(() => setTextVisible(true), 60);
      });
    });
    return () => cancelAnimationFrame(t);
  }, []);

  // Deep-link: /calories?date=YYYY-MM-DD&meal=ID — opens log tab on a specific date and highlights the meal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deepDate = params.get("date");
    const deepMeal = params.get("meal");
    if (deepDate || deepMeal) {
      if (deepDate) {
        const d = new Date(deepDate + "T00:00:00");
        if (!isNaN(d.getTime())) setSelectedDate(d);
      }
      setActiveTab("log");
      if (deepMeal) {
        setHighlightMealId(deepMeal);
        // Clear highlight after 3s
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => setHighlightMealId(null), 3000);
      }
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("date");
      url.searchParams.delete("meal");
      window.history.replaceState({}, "", url.toString());
    }
    return () => { if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to highlighted card when it mounts
  useEffect(() => {
    if (highlightMealId && highlightCardRef.current) {
      setTimeout(() => {
        highlightCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [highlightMealId, activeTab]);

  // Spring-tap state for date pills: tracks which index is being "sprung"
  const [springIdx, setSpringIdx] = useState<number | null>(null);
  const handleDatePillTap = (day: Date, i: number) => {
    setSpringIdx(i);
    setSelectedDate(day);
    setTimeout(() => setSpringIdx(null), 350);
  };

  // Contextual greeting
  const contextualGreeting = (() => {
    const h = new Date().getHours();
    const greeting = h < 5 ? "Late night" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night";
    const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${greeting} · ${dateStr}`;
  })();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraFileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Pinch-to-zoom handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartZoomRef.current = zoomLevel;
    }
  }, [zoomLevel]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / pinchStartDistRef.current;
      const newZoom = Math.min(4, Math.max(1, pinchStartZoomRef.current * scale));
      setZoomLevel(newZoom);
      // Show zoom pill and auto-hide after 1s
      setShowZoomPill(true);
      if (zoomPillTimerRef.current) clearTimeout(zoomPillTimerRef.current);
      zoomPillTimerRef.current = setTimeout(() => setShowZoomPill(false), 1500);
      // Apply zoom via CSS transform on the video element
      if (videoRef.current) {
        videoRef.current.style.transform = `scale(${newZoom})`;
        videoRef.current.style.transformOrigin = "center center";
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    pinchStartDistRef.current = null;
  }, []);

  // Tap-to-focus: show iOS-style animated focus square at tap/click point
  const handleVideoTap = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    // Ignore multi-touch (pinch gesture)
    if ('touches' in e && (e as React.TouchEvent).changedTouches.length !== 1) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('changedTouches' in e) {
      const touch = (e as React.TouchEvent).changedTouches[0];
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    // Show focus indicator
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    setFocusIndicator({ x, y, key: Date.now() });
    focusTimerRef.current = setTimeout(() => setFocusIndicator(null), 1200);
    // Attempt hardware focus via ImageCapture API if available
    if (videoRef.current?.srcObject) {
      try {
        const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
        if (track && 'getCapabilities' in track) {
          const caps = (track as any).getCapabilities();
          if (caps?.focusMode?.includes('manual') || caps?.pointsOfInterest) {
            const xNorm = clientX / window.innerWidth;
            const yNorm = clientY / window.innerHeight;
            (track as any).applyConstraints({ advanced: [{ pointsOfInterest: [{ x: xNorm, y: yNorm }], focusMode: 'manual' }] }).catch(() => {});
          }
        }
      } catch { /* not supported on this device */ }
    }
  }, []);

  const analyzeMutation = trpc.calorie.analyzePhoto.useMutation();

  // Fitness integration — today's calories burned for Net Calories widget
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todayFitnessLogs = trpc.fitness.getLogs.useQuery(
    { startDate: todayStr, endDate: todayStr }
  );
  const todayStepLogs = trpc.fitness.getSteps.useQuery(
    { startDate: todayStr, endDate: todayStr }
  );
  const todayCaloriesBurned = useMemo(() => {
    const ex = (todayFitnessLogs.data ?? []).reduce((s, l) => s + (l.caloriesBurned ?? 0), 0);
    const st = (todayStepLogs.data ?? []).reduce((s, l) => s + (l.caloriesBurned ?? 0), 0);
    return ex + st;
  }, [todayFitnessLogs.data, todayStepLogs.data]);

  // Save meal log to localStorage whenever it changes.
  // Also dispatch a synthetic "storage" event so same-tab listeners
  // (useCalorieGoals, DailyCalorieProgress) update immediately without
  // requiring a page navigation — the native storage event only fires cross-tab.
  useEffect(() => {
    localStorage.setItem("eatclean-meal-log", JSON.stringify(mealLog));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "eatclean-meal-log",
        newValue: JSON.stringify(mealLog),
        storageArea: localStorage,
      })
    );
  }, [mealLog]);

  // Save recent scans to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("eatclean-recent-scans", JSON.stringify(recentScans));
  }, [recentScans]);

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width:  { ideal: 3840, min: 1280 },
          height: { ideal: 2160, min: 720 },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          advanced: [{ focusMode: "continuous", exposureMode: "continuous", whiteBalanceMode: "continuous" }] as any,
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setCameraError("Camera access denied. Please allow camera access or upload a photo instead.");
      setMode("idle");
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Toggle flashlight (torch)
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const newTorchState = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: newTorchState } as any] });
      setTorchOn(newTorchState);
    } catch {
      toast.info("Flashlight not supported on this device");
    }
  }, [torchOn]);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(30);
    // Shutter click sound via Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx2 = new AudioCtx();
        // Short mechanical click: brief noise burst + quick decay
        const bufferSize = ctx2.sampleRate * 0.04; // 40ms
        const buffer = ctx2.createBuffer(1, bufferSize, ctx2.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 4);
        }
        const source = ctx2.createBufferSource();
        source.buffer = buffer;
        // High-pass filter to make it crisp
        const filter = ctx2.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 1800;
        const gainNode = ctx2.createGain();
        gainNode.gain.value = 0.55;
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx2.destination);
        source.start();
        source.onended = () => ctx2.close();
      }
    } catch {
      // Audio not available — silent fail
    }
    // Trigger shutter flash
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    // Photo quality analysis — check brightness via pixel sampling
    try {
      const sampleCtx = canvas.getContext("2d");
      if (sampleCtx) {
        const sampleW = Math.min(canvas.width, 80);
        const sampleH = Math.min(canvas.height, 80);
        const imgData = sampleCtx.getImageData(
          Math.floor((canvas.width - sampleW) / 2),
          Math.floor((canvas.height - sampleH) / 2),
          sampleW, sampleH
        );
        let totalBrightness = 0;
        const pixels = imgData.data.length / 4;
        for (let p = 0; p < imgData.data.length; p += 4) {
          // Perceived luminance
          totalBrightness += 0.299 * imgData.data[p] + 0.587 * imgData.data[p + 1] + 0.114 * imgData.data[p + 2];
        }
        const avgBrightness = totalBrightness / pixels; // 0–255
        if (avgBrightness < 45) {
          setPhotoQualityHint("dark");
        } else if (avgBrightness > 220) {
          setPhotoQualityHint("bright");
        } else {
          setPhotoQualityHint(null);
        }
      }
    } catch {
      setPhotoQualityHint(null);
    }
    stopCamera();
    setMode("preview");
  }, [stopCamera]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedImage(dataUrl);
      setMode("preview");
    };
    reader.readAsDataURL(file);
  }, []);

  // Analyze the photo
  const analyzePhoto = useCallback(async () => {
    if (!capturedImage) return;
    setMode("analyzing");
    try {
      const result = await analyzeMutation.mutateAsync({
        imageDataUrl: capturedImage,
        mealContext: mealContext || undefined,
      });
      const newResult = {
        analysis: result.analysis as MealAnalysis,
        imageUrl: result.imageUrl || capturedImage,
        ingredientAnalysis: result.ingredientAnalysis as IngredientAnalysis | null,
      };
      setAnalysisResult(newResult);
      // Auto-save to recent scans immediately (survives navigation)
      const recentEntry: MealLogEntry = {
        id: `recent-${Date.now()}`,
        imageUrl: newResult.imageUrl,
        analysis: newResult.analysis,
        ingredientAnalysis: newResult.ingredientAnalysis,
        analyzedAt: new Date().toISOString(),
      };
      setRecentScans(prev => [recentEntry, ...prev].slice(0, 5));
      setMode("result");
    } catch (err) {
      console.error("Analysis failed:", err);
      setCameraError("Analysis failed. Please try again with a clearer photo.");
      setMode("preview");
    }
  }, [capturedImage, mealContext, analyzeMutation]);

  // Show meal tag selector before saving
  const saveToLog = useCallback(() => {
    if (!analysisResult) return;
    // Auto-suggest meal type based on time of day
    const hour = new Date().getHours();
    const suggested: MealType = hour < 10 ? "breakfast" : hour < 14 ? "lunch" : hour < 18 ? "snack" : "dinner";
    setPendingMealType(suggested);
    setShowMealTagSelector(true);
  }, [analysisResult]);

  // Actually commit to log after tag selection
  const commitToLog = useCallback((mealType: MealType) => {
    if (!analysisResult) return;
    const entry: MealLogEntry = {
      id: Date.now().toString(),
      imageUrl: analysisResult.imageUrl,
      analysis: analysisResult.analysis,
      ingredientAnalysis: analysisResult.ingredientAnalysis,
      analyzedAt: new Date().toISOString(),
      mealType,
    };
    setMealLog(prev => {
      const updated = [entry, ...prev].slice(0, 50);
      // Compute streak after adding the new entry
      const daySet = new Set(updated.map(e => new Date(e.analyzedAt).toDateString()));
      const todayStr = new Date().toDateString();
      let streak = 0;
      const checkDate = new Date();
      if (!daySet.has(todayStr)) checkDate.setDate(checkDate.getDate() - 1);
      while (daySet.has(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      // Fire toast only if this is a milestone and today was just logged for the first time
      const wasLoggedToday = prev.some(e => new Date(e.analyzedAt).toDateString() === todayStr);
      if (!wasLoggedToday && streak in STREAK_MILESTONES) {
        const milestone = STREAK_MILESTONES[streak];
        if (streakToastTimerRef.current) clearTimeout(streakToastTimerRef.current);
        setStreakToast({ streak, ...milestone });
        streakToastTimerRef.current = setTimeout(() => setStreakToast(null), 3800);
      }
      return updated;
    });
    setShowMealTagSelector(false);
    setActiveTab("log");
    setMode("idle");
    setAnalysisResult(null);
    setCapturedImage(null);
    setMealContext("");
  }, [analysisResult, STREAK_MILESTONES]);

  // Retake
  const retake = useCallback(() => {
    setMode("idle");
    setAnalysisResult(null);
    setCapturedImage(null);
    setMealContext("");
    stopCamera();
  }, [stopCamera]);

  // Auto-start camera if mode was initialized as "camera" from autoCamera param
  useEffect(() => {
    if (mode === "camera" && !streamRef.current) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  // Daily totals from log — filtered by selectedDate
  const todayEntries = mealLog.filter(e => {
    const entryDate = new Date(e.analyzedAt);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === selectedDate.getTime();
  });
  const todayCalories = todayEntries.reduce((sum, e) => sum + e.analysis.totalCalories, 0);
  const todayProtein = todayEntries.reduce((sum, e) => sum + e.analysis.macros.protein, 0);
  const todayCarbs = todayEntries.reduce((sum, e) => sum + e.analysis.macros.carbs, 0);
  const todayFat = todayEntries.reduce((sum, e) => sum + e.analysis.macros.fat, 0);

  // Date strip helpers
  const DAY_ABBREVS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dateStripDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + i); // 3 before today, today, 3 after
    return d;
  });
  const isSelectedDay = (d: Date) => d.getTime() === selectedDate.getTime();
  const isToday = (d: Date) => d.getTime() === today.getTime();
  const hasEntriesOnDay = (d: Date) => mealLog.some(e => {
    const ed = new Date(e.analyzedAt); ed.setHours(0, 0, 0, 0);
    return ed.getTime() === d.getTime();
  });

  return (
    <div className="ec-page-bg pb-24">
      {/* Header — Premium redesign */}
      <div
        className="sticky top-0 z-20"
        style={{
          background: "linear-gradient(160deg, #071f17 0%, #0B3D2E 45%, #0f4a37 100%)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
        {/* Subtle top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 70%, transparent 100%)" }}
        />

        <div className="px-5 pt-12 pb-4">
          <div className="flex items-center justify-between">
            {/* Left: logo + wordmark + page title */}
            <div className="flex items-center gap-3">
              {/* Logo mark — animated on mount */}
              <div
                className="relative flex items-center justify-center flex-shrink-0"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  background: "linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                  // Scale-in + fade animation
                  opacity: logoVisible ? 1 : 0,
                  transform: logoVisible ? "scale(1)" : "scale(0.6)",
                  transition: "opacity 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                <Leaf size={19} className="text-white" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }} />
                {/* Subtle inner glow */}
                <div
                  className="absolute inset-0 rounded-[13px]"
                  style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12) 0%, transparent 65%)" }}
                />
              </div>

              {/* Text stack — staggered fade-up */}
              <div
                style={{
                  opacity: textVisible ? 1 : 0,
                  transform: textVisible ? "translateY(0px)" : "translateY(8px)",
                  transition: "opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {/* Brand name */}
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="font-bold text-white"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 18,
                      letterSpacing: "-0.01em",
                      textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    EatVera
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest"
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      letterSpacing: "0.14em",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Pro
                  </span>
                </div>
                {/* Page subtitle — contextual greeting */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Flame size={9} style={{ color: "#f97316", flexShrink: 0 }} />
                  <span
                    className="text-[10px] font-semibold"
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      letterSpacing: "0.04em",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {contextualGreeting}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: streak + theme toggle */}
            <div className="flex items-center gap-2">
              <StreakIndicator />
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center transition-all active:scale-95"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={14} className="text-white" /> : <Moon size={14} className="text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Strip removed */}
      <div style={{ display: "none" }}>
        {/* Month + year label */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em" }}
          >
            {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          {/* Total calories for selected day */}
          <span
            className="text-xs font-bold"
            style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'DM Mono', monospace" }}
          >
            {todayCalories > 0 ? `${todayCalories} kcal` : ""}
          </span>
        </div>

        {/* Day pills */}
        <div
          className="flex gap-1.5 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: 2 }}
        >
          {dateStripDays.map((day, i) => {
            const selected = isSelectedDay(day);
            const todayDay = isToday(day);
            const hasDot = hasEntriesOnDay(day);
            const dayCalories = mealLog
              .filter(e => { const ed = new Date(e.analyzedAt); ed.setHours(0,0,0,0); return ed.getTime() === day.getTime(); })
              .reduce((s, e) => s + e.analysis.totalCalories, 0);
            return (
              <button
                key={i}
                onClick={() => handleDatePillTap(day, i)}
                className="flex flex-col items-center flex-shrink-0 relative"
                style={{
                  minWidth: 44,
                  padding: "6px 4px 7px",
                  borderRadius: 14,
                  // Spring tap: compress then spring back
                  transform: springIdx === i ? "scale(0.88)" : "scale(1)",
                  transition: springIdx === i
                    ? "transform 0.08s ease-in"
                    : "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  background: selected
                    ? "rgba(255,255,255,0.15)"
                    : "transparent",
                  border: selected
                    ? "1.5px solid rgba(255,255,255,0.35)"
                    : "1.5px solid transparent",
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

                {/* Date number */}
                <div className="relative flex items-center justify-center" style={{ width: 32, height: 32 }}>
                  {/* Today ring */}
                  {todayDay && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        border: selected ? "2px solid rgba(255,255,255,0.7)" : "2px solid rgba(255,255,255,0.45)",
                        boxShadow: selected ? "0 0 0 3px rgba(255,255,255,0.08)" : "none",
                      }}
                    />
                  )}
                  {/* Selected fill */}
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
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Entry dot — compact indicator only */}
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

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex rounded-xl bg-muted p-1">
          <button
            onClick={() => setActiveTab("scan")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "scan" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Scan
          </button>
          <button
            onClick={() => setActiveTab("log")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "log" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {`Log${mealLog.length > 0 ? ` (${mealLog.length})` : ""}`}
          </button>
          <button
            onClick={() => setActiveTab("favourites")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1 ${
              activeTab === "favourites" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Heart size={12} className={activeTab === "favourites" ? "fill-red-400 text-red-400" : ""} />
            {`Saved${favourites.length > 0 ? ` (${favourites.length})` : ""}`}
          </button>
        </div>
      </div>

      {/* ── SCAN TAB ── */}
      {activeTab === "scan" && (
        <>
          {/* Camera View — Premium full-screen */}
          {mode === "camera" && (
            <div
              className="fixed inset-0 z-50 flex flex-col"
              style={{ background: "#000" }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => { handleTouchEnd(); handleVideoTap(e); }}
              onClick={handleVideoTap}
            >
              {/* Live camera feed */}
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted style={{ filter: "brightness(1.2) contrast(1.04) saturate(1.06)" }} />
              <canvas ref={canvasRef} className="hidden" />

              {/* Shutter flash */}
              {shutterFlash && (
                <div className="absolute inset-0 z-[60] bg-white pointer-events-none" style={{ animation: "shutterFlash 0.25s ease-out forwards" }} />
              )}

              {/* Layered vignette — lighter so feed is clearly visible */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse 72% 68% at 50% 50%, transparent 0%, rgba(0,0,0,0.08) 58%, rgba(0,0,0,0.52) 100%)"
              }} />
              {/* Tap-to-focus indicator — iOS-style animated square */}
              {focusIndicator && (
                <div
                  key={focusIndicator.key}
                  className="absolute pointer-events-none"
                  style={{
                    left: focusIndicator.x,
                    top: focusIndicator.y,
                    transform: "translate(-50%, -50%)",
                    zIndex: 20,
                    animation: "focusRingAnim 1.2s ease-out forwards",
                  }}
                >
                  <div style={{
                    width: 72,
                    height: 72,
                    border: "1.5px solid rgba(255,220,80,0.92)",
                    borderRadius: 6,
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.2), 0 0 14px rgba(255,220,80,0.3)",
                    position: "relative",
                  }}>
                    <div style={{ position: "absolute", top: -1, left: -1, width: 14, height: 14, borderTop: "2.5px solid rgba(255,220,80,1)", borderLeft: "2.5px solid rgba(255,220,80,1)", borderRadius: "4px 0 0 0" }} />
                    <div style={{ position: "absolute", top: -1, right: -1, width: 14, height: 14, borderTop: "2.5px solid rgba(255,220,80,1)", borderRight: "2.5px solid rgba(255,220,80,1)", borderRadius: "0 4px 0 0" }} />
                    <div style={{ position: "absolute", bottom: -1, left: -1, width: 14, height: 14, borderBottom: "2.5px solid rgba(255,220,80,1)", borderLeft: "2.5px solid rgba(255,220,80,1)", borderRadius: "0 0 0 4px" }} />
                    <div style={{ position: "absolute", bottom: -1, right: -1, width: 14, height: 14, borderBottom: "2.5px solid rgba(255,220,80,1)", borderRight: "2.5px solid rgba(255,220,80,1)", borderRadius: "0 0 4px 0" }} />
                  </div>
                </div>
              )}
              {/* Top gradient — deep forest matching the page header */}
              <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
                height: 140,
                background: "linear-gradient(180deg, rgba(7,31,23,0.88) 0%, rgba(11,61,46,0.55) 60%, transparent 100%)"
              }} />
              {/* Subtle top shimmer accent line matching page header */}
              <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
                height: 1,
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 70%, transparent 100%)"
              }} />

              {/* ── TOP BAR — matching EatVera Pro header style ── */}
              <div className="relative z-10 flex items-center justify-between px-5 pt-14 pb-2">
                {/* Close — glassmorphic pill */}
                <button
                  onClick={() => { stopCamera(); setMode("idle"); }}
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all active:scale-90"
                  style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 100%)",
                    backdropFilter: "blur(16px) saturate(180%)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.14)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1L11 11M11 1L1 11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* EatVera Pro wordmark — matches page header exactly */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="relative flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: "linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Leaf size={17} className="text-white" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }} />
                    {/* Inner glow matching header logo */}
                    <div className="absolute inset-0 rounded-[12px]" style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12) 0%, transparent 65%)" }} />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className="font-bold text-white leading-none"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, letterSpacing: "-0.01em", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
                      >
                        EatVera
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase"
                        style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Pro
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Flame size={8} style={{ color: "#f97316", flexShrink: 0 }} />
                      <span className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif" }}>Calorie Scanner</span>
                    </div>
                  </div>
                </div>

                {/* Torch — fixed lightning bolt using Zap icon, proper active state */}
                <button
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all active:scale-90"
                  style={{
                    background: torchOn
                      ? "linear-gradient(145deg, rgba(255,220,0,0.28) 0%, rgba(255,180,0,0.18) 100%)"
                      : "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 100%)",
                    backdropFilter: "blur(16px) saturate(180%)",
                    border: torchOn ? "1px solid rgba(255,220,0,0.5)" : "1px solid rgba(255,255,255,0.22)",
                    boxShadow: torchOn
                      ? "0 0 18px rgba(255,220,0,0.35), inset 0 1px 0 rgba(255,255,255,0.14)"
                      : "0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.14)",
                  }}
                  onClick={toggleTorch}
                >
                  <Zap
                    size={17}
                    fill={torchOn ? "#ffe600" : "none"}
                    stroke={torchOn ? "#ffe600" : "rgba(255,255,255,0.9)"}
                    strokeWidth={2}
                  />
                </button>
              </div>

              {/* ── VIEWFINDER ── */}
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center">

                {/* Hint text ABOVE viewfinder */}
                <p
                  className="text-center mb-5 font-medium"
                  style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Frame your meal within the guide
                </p>

                {/* Viewfinder box */}
                <div className="relative" style={{ width: "76vw", height: "76vw", maxWidth: 340, maxHeight: 340 }}>

                  {/* Outer dark mask — top */}
                  {/* Corner brackets — premium thin gold-tinted */}
                  {[
                    { top: 0, left: 0, borderTop: true, borderLeft: true, br: "10px 0 0 0" },
                    { top: 0, right: 0, borderTop: true, borderRight: true, br: "0 10px 0 0" },
                    { bottom: 0, left: 0, borderBottom: true, borderLeft: true, br: "0 0 0 10px" },
                    { bottom: 0, right: 0, borderBottom: true, borderRight: true, br: "0 0 10px 0" },
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        width: 28, height: 28,
                        top: c.top, bottom: c.bottom, left: c.left, right: c.right,
                        borderTop: c.borderTop ? "2px solid rgba(255,255,255,0.9)" : undefined,
                        borderBottom: c.borderBottom ? "2px solid rgba(255,255,255,0.9)" : undefined,
                        borderLeft: c.borderLeft ? "2px solid rgba(255,255,255,0.9)" : undefined,
                        borderRight: c.borderRight ? "2px solid rgba(255,255,255,0.9)" : undefined,
                        borderRadius: c.br,
                        filter: "drop-shadow(0 0 4px rgba(255,255,255,0.35))",
                      }}
                    />
                  ))}

                  {/* Subtle inner glow border */}
                  <div
                    className="absolute inset-0"
                    style={{
                      borderRadius: 4,
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
                    }}
                  />


                  {/* Center crosshair dot */}
                  <div
                    className="absolute"
                    style={{
                      width: 5, height: 5,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.55)",
                      top: "50%", left: "50%",
                      transform: "translate(-50%, -50%)",
                      boxShadow: "0 0 6px 2px rgba(255,255,255,0.2)",
                    }}
                  />
                </div>

                {/* Zoom pill — iOS-style toast that appears during pinch */}
                {showZoomPill && (
                  <div
                    className="mt-5 flex items-center justify-center"
                    style={{ pointerEvents: "none", animation: "zoomPillFade 1.5s ease-out forwards" }}
                  >
                    <div
                      className="flex items-center gap-2 rounded-[14px]"
                      style={{
                        padding: "8px 16px",
                        background: "linear-gradient(145deg, rgba(7,31,23,0.82) 0%, rgba(11,61,46,0.72) 100%)",
                        backdropFilter: "blur(20px) saturate(180%)",
                        border: "1px solid rgba(255,255,255,0.22)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
                      }}
                    >
                      {/* Magnifier icon */}
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <circle cx="5.5" cy="5.5" r="4" stroke="rgba(255,255,255,0.75)" strokeWidth="1.3"/>
                        <line x1="8.8" y1="8.8" x2="12" y2="12" stroke="rgba(255,255,255,0.75)" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      <span
                        className="text-white font-bold text-sm leading-none"
                        style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
                      >
                        {zoomLevel.toFixed(1)}×
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── BOTTOM CAPTURE BAR ── */}
              <div
                className="relative z-10 pb-12 pt-6"
                style={{
                  background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 70%, transparent 100%)",
                }}
              >
                <div className="flex items-center justify-center gap-10">

                  {/* Library button */}
                  <button
                    onClick={() => cameraFileInputRef.current?.click()}
                    className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="3"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21,15 16,10 5,21"/>
                      </svg>
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>Library</span>
                  </button>

                  {/* Hidden file input */}
                  <input
                    ref={cameraFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const dataUrl = ev.target?.result as string;
                        setCapturedImage(dataUrl);
                        stopCamera();
                        setMode("preview");
                      };
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />

                  {/* Shutter button — premium ring design */}
                  <button
                    onClick={capturePhoto}
                    className="relative flex items-center justify-center transition-transform active:scale-90"
                    style={{ width: 80, height: 80 }}
                  >
                    {/* Outer ring */}
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        border: "2px solid rgba(255,255,255,0.55)",
                        boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.5)",
                      }}
                    />
                    {/* Inner button */}
                    <div
                      className="rounded-full"
                      style={{
                        width: 62, height: 62,
                        background: "linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(230,230,230,1) 100%)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.3)",
                      }}
                    />
                  </button>

                  {/* Spacer to balance */}
                  <div className="flex flex-col items-center gap-1.5 opacity-0 pointer-events-none">
                    <div className="w-12 h-12" />
                    <span className="text-[10px]">·</span>
                  </div>
                </div>

                {/* Pinch-to-zoom hint */}
                <p
                  className="text-center mt-4"
                  style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Pinch to zoom
                </p>
              </div>

              {/* Keyframes */}
              <style>{`
                @keyframes focusRingAnim {
                  0%   { opacity: 0; transform: translate(-50%, -50%) scale(1.4); }
                  12%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                  75%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                }
                @keyframes zoomPillFade {
                  0%   { opacity: 0; transform: scale(0.82) translateY(4px); }
                  8%   { opacity: 1; transform: scale(1) translateY(0); }
                  72%  { opacity: 1; transform: scale(1) translateY(0); }
                  100% { opacity: 0; transform: scale(0.9) translateY(-2px); }
                }

                @keyframes shutterFlash {
                  0%   { opacity: 0.85; }
                  100% { opacity: 0; }
                }
              `}</style>
            </div>
          )}

          {/* Preview Mode — Premium review screen */}
          {mode === "preview" && capturedImage && (
            <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000" }}>
              {/* Full-screen captured image */}
              <img src={capturedImage} alt="Captured meal" className="absolute inset-0 w-full h-full object-cover" />

              {/* Multi-layer gradient overlays */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 0%, rgba(0,0,0,0.12) 55%, rgba(0,0,0,0.65) 100%)"
              }} />
              <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
                height: 140,
                background: "linear-gradient(180deg, rgba(7,31,23,0.88) 0%, rgba(11,61,46,0.55) 60%, transparent 100%)"
              }} />
              <div className="absolute inset-x-0 bottom-0 h-64 pointer-events-none" style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)"
              }} />

              {/* Top bar — EatVera Pro header style, matching camera view */}
              {/* Shimmer accent line */}
              <div className="absolute inset-x-0 top-0 z-10 pointer-events-none" style={{
                height: 1,
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 70%, transparent 100%)"
              }} />
              <div className="relative z-10 flex items-center justify-between px-5 pt-14 pb-2">
                {/* Back — glassmorphic pill */}
                <button
                  onClick={retake}
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all active:scale-90"
                  style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 100%)",
                    backdropFilter: "blur(16px) saturate(180%)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.14)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 2L4 7L9 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {/* EatVera Pro wordmark — identical to camera view top bar */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="relative flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: "linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Leaf size={17} className="text-white" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }} />
                    <div className="absolute inset-0 rounded-[12px]" style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12) 0%, transparent 65%)" }} />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className="font-bold text-white leading-none"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, letterSpacing: "-0.01em", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
                      >
                        EatVera
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase"
                        style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Pro
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Flame size={8} style={{ color: "#f97316", flexShrink: 0 }} />
                      <span className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif" }}>Review Photo</span>
                    </div>
                  </div>
                </div>
                {/* Spacer to balance the back button */}
                <div className="w-11" />
              </div>
              {/* Spacer */}
              <div className="flex-1" />

              {/* Bottom panel */}
              <div
                className="relative z-10 px-5 pb-12 pt-6"
                style={{
                  background: "rgba(5,15,10,0.75)",
                  backdropFilter: "blur(32px) saturate(180%)",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                {/* Section label */}
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em" }}
                >
                  Add context
                </p>

                {/* Context input */}
                <div className="mb-5">
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <input
                      type="text"
                      value={mealContext}
                      onChange={e => setMealContext(e.target.value)}
                      placeholder="e.g. large portion, restaurant meal, homemade..."
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                </div>

                {/* Photo quality hint */}
                {photoQualityHint && (
                  <div
                    className="mb-4 rounded-xl p-3 flex items-center gap-2.5"
                    style={{
                      background: photoQualityHint === "dark" ? "rgba(251,191,36,0.12)" : "rgba(251,191,36,0.12)",
                      border: "1px solid rgba(251,191,36,0.28)",
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{photoQualityHint === "dark" ? "🌑" : "☀️"}</span>
                    <p className="text-xs font-medium" style={{ color: "rgba(251,191,36,0.9)" }}>
                      {photoQualityHint === "dark"
                        ? "Photo looks dark — try better lighting for more accurate results."
                        : "Photo looks overexposed — try reducing glare for better accuracy."
                      }
                    </p>
                  </div>
                )}

                {cameraError && (
                  <div className="mb-4 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2" style={{ background: "rgba(220,38,38,0.18)", border: "1px solid rgba(220,38,38,0.28)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {cameraError}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  {/* Primary: Analyze */}
                  <button
                    onClick={analyzePhoto}
                    className="flex-1 py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
                    style={{
                      background: "linear-gradient(135deg, #c41e1e 0%, #e85d04 100%)",
                      boxShadow: "0 4px 24px rgba(200,30,30,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
                      letterSpacing: "0.01em",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <Zap size={15} style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4))" }} />
                    Analyze Calories
                  </button>

                  {/* Secondary: Retake */}
                  <button
                    onClick={retake}
                    className="px-5 py-4 rounded-2xl font-semibold text-sm transition-all active:scale-[0.97]"
                    style={{
                      background: "rgba(255,255,255,0.09)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "rgba(255,255,255,0.75)",
                      backdropFilter: "blur(8px)",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Retake
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analyzing State — dark full-screen */}
          {mode === "analyzing" && (
            <AnalyzingOverlay capturedImage={capturedImage} />
          )}

          {/* Result */}
          {mode === "result" && analysisResult && (
            <AnalysisResult
              analysis={analysisResult.analysis}
              imageUrl={analysisResult.imageUrl}
              ingredientAnalysis={analysisResult.ingredientAnalysis}
              onSave={saveToLog}
              onRetake={retake}
              onShare={() => setShowShareModal(true)}
            />
          )}

          {/* Share Modal */}
          {showShareModal && (() => {
            // Determine source: new scan result or a log entry
            const src = shareEntry
              ? { analysis: shareEntry.analysis, imageUrl: shareEntry.imageUrl }
              : analysisResult;
            if (!src) return null;
            return (
              <ShareMealCard
                meal={{
                  mealName: src.analysis.mealName,
                  totalCalories: src.analysis.totalCalories,
                  qualityScore: src.analysis.qualityScore,
                  macros: {
                    protein: src.analysis.macros.protein,
                    carbs: src.analysis.macros.carbs,
                    fat: src.analysis.macros.fat,
                  },
                  imageUrl: src.imageUrl,
                  warnings: src.analysis.warnings,
                }}
                onClose={() => { setShowShareModal(false); setShareEntry(null); }}
              />
            );
          })()}

          {/* Idle State — Scan Options */}
          {mode === "idle" && (
            <div className="px-4">
              {/* How It Works */}
              <div className="ec-card rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={14} className="text-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">How It Works</span>
                </div>
                {[
                  { step: "1", text: "Take a photo or upload an image of your meal" },
                  { step: "2", text: "AI identifies every food item and estimates portions" },
                  { step: "3", text: "Get exact calories, macros, and a quality score" },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-3 mb-2 last:mb-0">
                    <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {step}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              {/* Action Buttons — below how it works */}
              {cameraError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600">
                  {cameraError}
                </div>
              )}
              <div className="flex items-center gap-3 mb-5">
                {/* Take a Photo — cream with green border */}
                <button
                  onClick={startCamera}
                  className="flex-1 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
                  style={{
                    background: "#3A7D5A",
                    border: "2px solid #ffffff",
                    color: "#ffffff",
                    boxShadow: "0 2px 12px rgba(58,125,90,0.25)",
                  }}
                >
                  <Camera size={20} style={{ color: "#ffffff" }} />
                  Take a Photo
                </button>
                {/* Gallery icon button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-[0.97]"
                  style={{
                    background: "#145A3A",
                    border: "2px solid #ffffff",
                    color: "#ffffff",
                    boxShadow: "0 2px 12px rgba(11,61,46,0.20)",
                  }}
                  aria-label="Upload from gallery"
                >
                  <Images size={22} style={{ color: "#ffffff" }} />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Recent Scans */}
              {recentScans.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent Scans</span>
                    <button
                      onClick={() => setRecentScans([])}
                      className="text-[11px] font-semibold text-red-400 hover:text-red-500 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {recentScans.map(scan => (
                      <div
                        key={scan.id}
                        className="ec-card rounded-2xl p-3 flex items-center gap-3 relative cursor-pointer active:scale-[0.98] transition-transform"
                        onClick={() => {
                          setAnalysisResult({
                            analysis: scan.analysis,
                            imageUrl: scan.imageUrl,
                            ingredientAnalysis: scan.ingredientAnalysis,
                          });
                          setMode("result");
                        }}
                      >
                        {/* Thumbnail */}
                        {scan.imageUrl ? (
                          <img
                            src={scan.imageUrl}
                            alt={scan.analysis.mealName}
                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-2xl">
                            🍽️
                          </div>
                        )}
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{scan.analysis.mealName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold" style={{ color: getScoreColor(scan.analysis.qualityScore), fontFamily: "'DM Mono', monospace" }}>
                              {scan.analysis.totalCalories} kcal
                            </span>
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ color: getScoreColor(scan.analysis.qualityScore), background: `${getScoreColor(scan.analysis.qualityScore)}18` }}
                            >
                              {scan.analysis.qualityScore}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(scan.analyzedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                            {" · "}
                            {new Date(scan.analyzedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        {/* Dismiss × */}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setRecentScans(prev => prev.filter(s => s.id !== scan.id));
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-red-100 hover:text-red-500 transition-colors flex-shrink-0"
                          aria-label="Remove"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}





              {/* Example meals */}
              <div className="mt-5">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Works great with</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { emoji: "🥗", label: "Salads" },
                    { emoji: "🍝", label: "Pasta" },
                    { emoji: "🥩", label: "Meat" },
                    { emoji: "🍱", label: "Bowls" },
                    { emoji: "🥪", label: "Sandwiches" },
                    { emoji: "🍳", label: "Breakfast" },
                  ].map(({ emoji, label }) => (
                    <div key={label} className="ec-card rounded-xl p-2.5 text-center">
                      <div className="text-xl mb-1">{emoji}</div>
                      <div className="text-[10px] text-muted-foreground font-medium">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

          {/* ── LOG TAB ── */}
          {activeTab === "log" && (
            <div className="px-4">
              {mealLog.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-muted">
                    <Clock size={28} className="text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-2">No Meals Logged Yet</h3>
                  <p className="text-muted-foreground text-sm">Scan your first meal to start tracking</p>
                  <button
                    onClick={() => setActiveTab("scan")}
                    className="mt-4 px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
                    style={{ background: "linear-gradient(135deg, #dc2626, #f97316)" }}
                  >
                    Scan a Meal
                  </button>
                </div>
              ) : (
                <>
                  {/* Weekly Report Card */}
                  <WeeklyReportCard mealLog={mealLog} />
                  {/* Daily Calorie Progress (compact) */}
                  <DailyCalorieProgress compact />
                  {/* Nutrition Goal Progress */}
                  <NutritionGoalProgress />

                  {/* Weekly stacked bar chart */}
                  {(() => {
                    const CHART_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
                    const CHART_COLORS: Record<MealType, string> = {
                      breakfast: "#f97316",
                      lunch: "#eab308",
                      dinner: "#6366f1",
                      snack: "#0B3D2E",
                    };
                    const CHART_LABELS: Record<MealType, string> = {
                      breakfast: "Breakfast",
                      lunch: "Lunch",
                      dinner: "Dinner",
                      snack: "Snack",
                    };
                    // Build 7-day data (last 7 days ending today)
                    const chartToday = new Date(); chartToday.setHours(0,0,0,0);
                    const chartDays = Array.from({ length: 7 }, (_, i) => {
                      const d = new Date(chartToday);
                      d.setDate(chartToday.getDate() - 6 + i);
                      return d;
                    });
                    const chartData = chartDays.map(d => {
                      const dayEntries = mealLog.filter(e => {
                        const ed = new Date(e.analyzedAt); ed.setHours(0,0,0,0);
                        return ed.getTime() === d.getTime();
                      });
                      const byType: Record<MealType, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
                      dayEntries.forEach(e => {
                        if (e.mealType) byType[e.mealType] += e.analysis.totalCalories;
                        else byType.snack += e.analysis.totalCalories; // untagged → snack bucket
                      });
                      const total = Object.values(byType).reduce((s, v) => s + v, 0);
                      return { day: d, byType, total };
                    });
                    const maxCal = Math.max(...chartData.map(d => d.total), 500);
                    const hasAnyData = chartData.some(d => d.total > 0);
                    if (!hasAnyData) return null;

                    return (
                      <div className="ec-card rounded-2xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-foreground uppercase tracking-wider">7-Day Breakdown</span>
                          {/* Legend */}
                          <div className="flex items-center gap-2">
                            {CHART_MEAL_TYPES.filter(mt => chartData.some(d => d.byType[mt] > 0)).map(mt => (
                              <div key={mt} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[mt] }} />
                                <span className="text-[9px] text-muted-foreground">{CHART_LABELS[mt].slice(0,3)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bars */}
                        <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                          {chartData.map(({ day, byType, total }, i) => {
                            const isSelected = day.getTime() === selectedDate.getTime();
                            const isChartToday = day.getTime() === chartToday.getTime();
                            const barH = total > 0 ? Math.max(6, (total / maxCal) * 72) : 0;
                            // Stack segments from bottom
                            let accum = 0;
                            const segments = CHART_MEAL_TYPES.map(mt => {
                              const h = total > 0 ? (byType[mt] / maxCal) * 72 : 0;
                              const seg = { mt, h, y: accum };
                              accum += h;
                              return seg;
                            }).filter(s => s.h > 0);

                            return (
                              <button
                                key={i}
                                onClick={() => setSelectedDate(day)}
                                className="flex-1 flex flex-col items-center gap-1 group"
                              >
                                {/* Bar container */}
                                <div
                                  className="w-full relative flex flex-col-reverse rounded-lg overflow-hidden transition-all duration-200"
                                  style={{
                                    height: 72,
                                    background: "var(--muted)",
                                    border: isSelected ? "1.5px solid var(--foreground)" : "1.5px solid transparent",
                                    opacity: total === 0 ? 0.35 : 1,
                                  }}
                                >
                                  {segments.map(({ mt, h }) => (
                                    <div
                                      key={mt}
                                      style={{
                                        height: h,
                                        background: CHART_COLORS[mt],
                                        flexShrink: 0,
                                        transition: "height 0.4s ease",
                                      }}
                                    />
                                  ))}
                                </div>
                                {/* Day label */}
                                <span
                                  className="text-[9px] font-bold"
                                  style={{
                                    color: isSelected ? "var(--foreground)" : isChartToday ? "var(--foreground)" : "var(--muted-foreground)",
                                    fontFamily: "'DM Sans', sans-serif",
                                  }}
                                >
                                  {["S","M","T","W","T","F","S"][day.getDay()]}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Calorie axis hint */}
                        <div className="flex justify-between mt-1">
                          <span className="text-[9px] text-muted-foreground">0</span>
                          <span className="text-[9px] text-muted-foreground">{maxCal >= 1000 ? `${(maxCal/1000).toFixed(1)}k` : maxCal} kcal</span>
                        </div>
                      </div>
                    );
                  })()}

              {/* Meal log for selected date, grouped by meal type */}
              {(() => {
                const MEAL_TYPE_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
                const MEAL_TYPE_LABELS: Record<MealType, string> = {
                  breakfast: "Breakfast",
                  lunch: "Lunch",
                  dinner: "Dinner",
                  snack: "Snack",
                };
                const MEAL_TYPE_EMOJIS: Record<MealType, string> = {
                  breakfast: "🌅",
                  lunch: "☀️",
                  dinner: "🌙",
                  snack: "🍎",
                };
                const MEAL_TYPE_COLORS: Record<MealType, string> = {
                  breakfast: "#f97316",
                  lunch: "#eab308",
                  dinner: "#6366f1",
                  snack: "#0B3D2E",
                };

                // Show selected date label
                const selectedDateStr = selectedDate.toDateString();
                const todayStr = new Date().toDateString();
                const dateLabel = selectedDateStr === todayStr ? "Today" : selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

                // Filter entries for selected date
                const dayEntries = mealLog.filter(e => {
                  const ed = new Date(e.analyzedAt); ed.setHours(0, 0, 0, 0);
                  return ed.getTime() === selectedDate.getTime();
                });

                if (dayEntries.length === 0) {
                  return (
                    <div className="text-center py-10">
                      <div className="text-3xl mb-2">📭</div>
                      <p className="text-sm text-muted-foreground font-medium">{dateLabel} — No meals logged</p>
                    </div>
                  );
                }

                // Group by meal type
                const grouped: Partial<Record<MealType | "untagged", MealLogEntry[]>> = {};
                dayEntries.forEach(entry => {
                  const key = entry.mealType ?? "untagged";
                  if (!grouped[key]) grouped[key] = [];
                  grouped[key]!.push(entry);
                });

                // Daily totals by meal type
                const mealTypeTotals = MEAL_TYPE_ORDER.map(mt => ({
                  type: mt,
                  calories: (grouped[mt] ?? []).reduce((s, e) => s + e.analysis.totalCalories, 0),
                  count: (grouped[mt] ?? []).length,
                })).filter(m => m.count > 0);

                return (
                  <>
                    {/* Date label + Export CSV */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{dateLabel}</div>
                      <button
                        onClick={() => {
                          const rows: string[] = [
                            ["Date", "Time", "Meal Type", "Meal Name", "Calories", "Protein (g)", "Carbs (g)", "Fat (g)", "Fiber (g)", "Sugar (g)", "Quality Score", "Confidence", "Health Tip", "Warnings"].join(",")
                          ];
                          const sorted = [...mealLog].sort((a, b) => new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime());
                          sorted.forEach(e => {
                            const d = new Date(e.analyzedAt);
                            const dateStr = d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
                            const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                            const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
                            rows.push([
                              esc(dateStr), esc(timeStr), esc(e.mealType ?? "untagged"),
                              esc(e.analysis.mealName), e.analysis.totalCalories,
                              e.analysis.macros.protein, e.analysis.macros.carbs,
                              e.analysis.macros.fat, e.analysis.macros.fiber,
                              e.analysis.macros.sugar, e.analysis.qualityScore,
                              esc(e.analysis.confidence), esc(e.analysis.healthTip ?? ""),
                              esc((e.analysis.warnings ?? []).join("; ")),
                            ].join(","));
                          });
                          const csv = rows.join("\n");
                          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `eatvera-meal-log-${new Date().toISOString().slice(0,10)}.csv`;
                          a.click();
                          setTimeout(() => URL.revokeObjectURL(url), 5000);
                          toast.success(`Exported ${sorted.length} meal${sorted.length !== 1 ? "s" : ""} to CSV`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all active:scale-95"
                        style={{
                          background: "rgba(11,61,46,0.08)",
                          border: "1px solid rgba(11,61,46,0.18)",
                          color: "#0B3D2E",
                        }}
                      >
                        <FileDown size={12} />
                        Export CSV
                      </button>
                    </div>

                    {/* Per-meal-type calorie goal rings */}
                    {mealTypeTotals.length > 0 && (() => {
                      // Read daily calorie goal from localStorage (same key as useCalorieGoals)
                      let dailyGoal = 2000;
                      try {
                        const stored = localStorage.getItem("eatclean-calorie-goals");
                        if (stored) dailyGoal = JSON.parse(stored).dailyCalories ?? 2000;
                      } catch {}
                      const totalDayCalories = mealTypeTotals.reduce((s, m) => s + m.calories, 0);

                      return (
                        <div className="ec-card rounded-2xl p-4 mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Meal Breakdown</span>
                            <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                              {totalDayCalories} / {dailyGoal} kcal
                            </span>
                          </div>
                          <div className="flex gap-3 justify-around">
                            {mealTypeTotals.map(({ type, calories }) => {
                              const pct = Math.min(calories / dailyGoal, 1);
                              const color = MEAL_TYPE_COLORS[type];
                              const size = 68;
                              const stroke = 6;
                              const r = (size - stroke) / 2;
                              const circ = 2 * Math.PI * r;
                              const offset = circ - pct * circ;
                              const pctLabel = Math.round((calories / dailyGoal) * 100);
                              return (
                                <div key={type} className="flex flex-col items-center gap-1.5">
                                  {/* SVG ring */}
                                  <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                                    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                                      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
                                      <circle
                                        cx={size/2} cy={size/2} r={r} fill="none"
                                        stroke={color}
                                        strokeWidth={stroke}
                                        strokeDasharray={circ}
                                        strokeDashoffset={offset}
                                        strokeLinecap="round"
                                        style={{ transition: "stroke-dashoffset 0.8s ease" }}
                                      />
                                    </svg>
                                    <div className="absolute text-center">
                                      <div className="font-bold leading-none" style={{ fontSize: 13, color, fontFamily: "'DM Mono', monospace" }}>
                                        {pctLabel}%
                                      </div>
                                    </div>
                                  </div>
                                  {/* Label */}
                                  <div className="text-center">
                                    <div className="text-[10px] font-bold" style={{ color }}>
                                      {MEAL_TYPE_EMOJIS[type]} {MEAL_TYPE_LABELS[type]}
                                    </div>
                                    <div className="text-[9px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                                      {calories} kcal
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Stacked progress bar */}
                          <div className="mt-4">
                            <div className="h-2 rounded-full overflow-hidden flex" style={{ background: "var(--muted)" }}>
                              {mealTypeTotals.map(({ type, calories }) => (
                                <div
                                  key={type}
                                  style={{
                                    width: `${Math.min((calories / dailyGoal) * 100, 100)}%`,
                                    background: MEAL_TYPE_COLORS[type],
                                    transition: "width 0.6s ease",
                                    flexShrink: 0,
                                  }}
                                />
                              ))}
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[9px] text-muted-foreground">0</span>
                              <span className="text-[9px] text-muted-foreground">{dailyGoal} kcal goal</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Entries grouped by meal type */}
                    {MEAL_TYPE_ORDER.map(mt => {
                      const entries = grouped[mt];
                      if (!entries || entries.length === 0) return null;
                      return (
                        <div key={mt} className="mb-4">
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <span className="text-sm">{MEAL_TYPE_EMOJIS[mt]}</span>
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: MEAL_TYPE_COLORS[mt] }}>{MEAL_TYPE_LABELS[mt]}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{entries.reduce((s, e) => s + e.analysis.totalCalories, 0)} kcal</span>
                          </div>
                          <div className="space-y-2">
                            {entries.map(entry => (
                              <MealLogCard
                                key={entry.id}
                                entry={entry}
                                highlighted={highlightMealId === entry.id}
                                cardRef={highlightMealId === entry.id ? highlightCardRef : undefined}
                                onDelete={() => setMealLog(prev => prev.filter(e => e.id !== entry.id))}
                                onShare={() => { setShareEntry(entry); setShowShareModal(true); }}
                                isStarred={isFavourite(entry.analysis.mealName)}
                                onChangeTag={(newType) => setMealLog(prev => prev.map(e => e.id === entry.id ? { ...e, mealType: newType } : e))}
                                onStar={() => toggleFavourite({
                                  name: entry.analysis.mealName,
                                  source: "scan",
                                  imageUrl: entry.imageUrl,
                                  calories: entry.analysis.totalCalories,
                                  macros: {
                                    protein: entry.analysis.macros.protein,
                                    carbs: entry.analysis.macros.carbs,
                                    fat: entry.analysis.macros.fat,
                                  },
                                  qualityScore: entry.analysis.qualityScore,
                                  originalAnalysis: entry.analysis,
                                })}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Untagged entries */}
                    {grouped["untagged"] && grouped["untagged"]!.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Other</span>
                        </div>
                        <div className="space-y-2">
                          {grouped["untagged"]!.map(entry => (
                            <MealLogCard
                              key={entry.id}
                              entry={entry}
                              highlighted={highlightMealId === entry.id}
                              cardRef={highlightMealId === entry.id ? highlightCardRef : undefined}
                              onDelete={() => setMealLog(prev => prev.filter(e => e.id !== entry.id))}
                              onShare={() => { setShareEntry(entry); setShowShareModal(true); }}
                              isStarred={isFavourite(entry.analysis.mealName)}
                              onChangeTag={(newType) => setMealLog(prev => prev.map(e => e.id === entry.id ? { ...e, mealType: newType } : e))}
                              onStar={() => toggleFavourite({
                                name: entry.analysis.mealName,
                                source: "scan",
                                imageUrl: entry.imageUrl,
                                calories: entry.analysis.totalCalories,
                                macros: {
                                  protein: entry.analysis.macros.protein,
                                  carbs: entry.analysis.macros.carbs,
                                  fat: entry.analysis.macros.fat,
                                },
                                qualityScore: entry.analysis.qualityScore,
                                originalAnalysis: entry.analysis,
                              })}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              <button
                onClick={() => {
                  if (confirm("Clear all meal log entries?")) {
                    setMealLog([]);
                  }
                }}
                className="w-full py-3 rounded-xl text-sm text-red-400 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 font-medium mt-2"
              >
                Clear All Logs
              </button>
            </>
          )}
        </div>
      )}

      {/* ── FAVOURITES TAB ── */}
      {activeTab === "favourites" && (
        <div className="px-4">
          {favourites.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(220,38,38,0.08)" }}>
                <Heart size={28} className="text-red-300" />
              </div>
              <h3 className="font-bold text-foreground text-base mb-2">No Saved Meals Yet</h3>
              <p className="text-muted-foreground text-sm">Tap the heart icon on any logged meal to save it here</p>
              <button
                onClick={() => setActiveTab("log")}
                className="mt-4 px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #dc2626, #f97316)" }}
              >
                View Meal Log
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-3">Saved Meals</p>
              {favourites.map(fav => (
                <div key={fav.id} className="ec-card rounded-2xl p-3.5 flex items-center gap-3">
                  {fav.imageUrl ? (
                    <img src={fav.imageUrl} alt={fav.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl bg-muted">
                      {fav.emoji || "🍽️"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{fav.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {Math.round(fav.calories)} kcal
                      </span>
                      {fav.qualityScore && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ color: getScoreColor(fav.qualityScore), background: `${getScoreColor(fav.qualityScore)}15` }}
                        >
                          {fav.qualityScore}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">P: {Math.round(fav.macros.protein)}g</span>
                      <span className="text-[10px] text-muted-foreground">C: {Math.round(fav.macros.carbs)}g</span>
                      <span className="text-[10px] text-muted-foreground">F: {Math.round(fav.macros.fat)}g</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] text-muted-foreground">
                        Saved {new Date(fav.starredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                        {fav.source}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        // Re-log: create a new meal log entry from this favourite
                        const newEntry = {
                          id: Date.now().toString(),
                          imageUrl: fav.imageUrl || "",
                          analysis: (fav.originalAnalysis as MealAnalysis | undefined) || {
                            mealName: fav.name,
                            confidence: "medium" as const,
                            totalCalories: fav.calories,
                            servingDescription: "1 serving",
                            macros: { protein: fav.macros.protein, carbs: fav.macros.carbs, fat: fav.macros.fat, fiber: 0, sugar: 0 },
                            items: [],
                            qualityScore: fav.qualityScore || 70,
                            qualityNotes: [],
                            healthTip: "",
                            warnings: [],
                          },
                          analyzedAt: new Date().toISOString(),
                        };
                        setMealLog(prev => [newEntry, ...prev].slice(0, 50));
                        setActiveTab("log");
                      }}
                      className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #dc2626, #f97316)" }}
                    >
                      + Log
                    </button>
                    <button
                      onClick={() => toggleFavourite(fav)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Heart size={14} className="fill-red-400 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meal Tag Selector Modal */}
      {showMealTagSelector && analysisResult && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div
            className="w-full max-w-md rounded-t-3xl p-6 pb-10"
            style={{ background: "var(--background)", boxShadow: "0 -8px 40px rgba(0,0,0,0.25)" }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />

            {/* Meal image + name */}
            <div className="flex items-center gap-3 mb-5">
              <img
                src={analysisResult.imageUrl}
                alt={analysisResult.analysis.mealName}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
              <div>
                <p className="font-bold text-foreground text-sm">{analysisResult.analysis.mealName}</p>
                <p className="text-xs text-muted-foreground">{analysisResult.analysis.totalCalories} kcal</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-foreground mb-3">Tag this meal as...</p>

            {/* Meal type buttons */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {([
                { type: "breakfast" as MealType, emoji: "🌅", label: "Breakfast", color: "#f97316", bg: "rgba(249,115,22,0.1)" },
                { type: "lunch" as MealType, emoji: "☀️", label: "Lunch", color: "#eab308", bg: "rgba(234,179,8,0.1)" },
                { type: "dinner" as MealType, emoji: "🌙", label: "Dinner", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
                { type: "snack" as MealType, emoji: "🍎", label: "Snack", color: "#0B3D2E", bg: "rgba(11,61,46,0.1)" },
              ] as Array<{ type: MealType; emoji: string; label: string; color: string; bg: string }>).map(({ type, emoji, label, color, bg }) => (
                <button
                  key={type}
                  onClick={() => { setPendingMealType(type); commitToLog(type); }}
                  className="rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-95"
                  style={{
                    background: pendingMealType === type ? color : bg,
                    border: `2px solid ${pendingMealType === type ? color : "transparent"}`,
                  }}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span
                    className="font-bold text-sm"
                    style={{ color: pendingMealType === type ? "white" : color }}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* Skip / cancel */}
            <button
              onClick={() => setShowMealTagSelector(false)}
              className="w-full py-3 rounded-xl text-sm font-medium text-muted-foreground border border-border"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Streak milestone toast */}
      {streakToast && (
        <div
          className="fixed left-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl"
          style={{
            bottom: 96,
            background: "linear-gradient(135deg, #071f17 0%, #0B3D2E 100%)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
            animation: "streakToastIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          {/* Confetti canvas */}
          <StreakConfetti />
          {/* Emoji */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            {streakToast.emoji}
          </div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {streakToast.label}
            </p>
            <p className="text-green-300 text-[11px] font-medium mt-0.5">
              {streakToast.streak} days in a row — keep it up!
            </p>
          </div>
          {/* Dismiss */}
          <button
            onClick={() => setStreakToast(null)}
            className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bounce animation + streak toast */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes streakToastIn {
          from { opacity: 0; transform: translateY(24px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Streak Confetti ─────────────────────────────────────────────────────────
function StreakConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const COLORS = ["#4ade80", "#86efac", "#fbbf24", "#f9a8d4", "#a5f3fc", "#ffffff"];
    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.5,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * -4 - 1,
      size: Math.random() * 5 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      alpha: 1,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.rotation += p.rotSpeed;
        p.alpha -= 0.018;
        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
          ctx.restore();
        }
      }
      if (alive) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full rounded-2xl pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
