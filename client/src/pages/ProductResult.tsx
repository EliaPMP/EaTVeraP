/**
 * EatVera ProductResult — v2 Clean & Vital
 * Design: Organic Modernism — light, airy, health-forward
 * Full stats: USDA nutrients, meat grading, extended nutrient panel, data source badge
 */
import { useState, useEffect } from "react";
import { useScanHistory } from "@/hooks/useScanHistory";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowLeft, Package, AlertTriangle, CheckCircle, Leaf, Zap,
  ExternalLink, Database, Award, Beef, Fish, FlaskConical,
  ChevronDown, ChevronUp, Info, ShieldCheck, ArrowLeftRight, Settings, Heart, ScanLine
} from "lucide-react";
import { analyzeIngredients, analyzeMeatProduct, analyzeNutrition } from "@/lib/ingredientAnalysis";
import { isScannerMuted } from "@/hooks/useScannerMute";
import NutritionLabelCanvas from "@/components/NutritionLabelCanvas";
import type { FoodProduct, ExtendedNutrient } from "@/lib/foodApi";
import { findAlternatives, shouldShowAlternatives, getAlternativesMessage, type Alternative } from "@/lib/alternativesEngine";
import { useDietFilters } from "@/contexts/DietFiltersContext";
import { Sparkles, ArrowRight, Bookmark } from "lucide-react";
import { useSavedSwaps } from "@/hooks/useSavedSwaps";
import { useTheme } from "@/contexts/ThemeContext";
import ProductImageSuggest from "@/components/ProductImageSuggest";

interface ProductResultProps {
  product: FoodProduct;
  onBack: () => void;
  /** Optional: pre-slot the product into the compare page */
  onCompare?: (product: FoodProduct) => void;
  /** Optional: open the scanner in Food Label mode to cross-check the printed label */
  onScanLabel?: () => void;
  /** Optional: close the result and immediately re-open the barcode scanner */
  onScanAgain?: () => void;
}

const NOVA_LABELS: Record<number, { label: string; color: string; bg: string; desc: string }> = {
  1: { label: "Unprocessed", color: "#145A3A", bg: "#f0faf0", desc: "Unprocessed or minimally processed foods — fresh meat, eggs, vegetables, fruits, plain milk" },
  2: { label: "Culinary", color: "#0B3D2E", bg: "#f0faf0", desc: "Processed culinary ingredients — oils, butter, flour, salt, sugar used in cooking" },
  3: { label: "Processed", color: "#d97706", bg: "#fffbf0", desc: "Processed foods — canned vegetables, salted nuts, cured meats, cheese, beer, wine" },
  4: { label: "Ultra-Processed", color: "#dc2626", bg: "#fff5f5", desc: "Ultra-processed food and drink products — soft drinks, chips, packaged snacks, fast food" },
};

const NUTRISCORE_COLORS: Record<string, { color: string; bg: string }> = {
  A: { color: "#145A3A", bg: "#f0faf0" },
  B: { color: "#0B3D2E", bg: "#dcf4dc" },
  C: { color: "#d97706", bg: "#fef3c7" },
  D: { color: "#ea580c", bg: "#fff7ed" },
  E: { color: "#dc2626", bg: "#fee2e2" },
};

const SOURCE_INFO: Record<string, { label: string; color: string }> = {
  openfoodfacts: { label: "Open Food Facts", color: "#0B3D2E" },
  usda: { label: "USDA FoodData Central", color: "#145A3A" },
  "usda-sr": { label: "USDA SR Legacy", color: "#145A3A" },
  estimated: { label: "Estimated", color: "#d97706" },
};

const NUTRIENT_GROUPS: { label: string; keys: { key: string; label: string; unit: string; warnHigh?: number; goodLow?: number }[] }[] = [
  {
    label: "Macronutrients",
    keys: [
      { key: "energy-kcal_100g", label: "Calories", unit: "kcal", warnHigh: 500 },
      { key: "proteins_100g", label: "Protein", unit: "g", goodLow: 15 },
      { key: "fat_100g", label: "Total Fat", unit: "g" },
      { key: "saturated-fat_100g", label: "Saturated Fat", unit: "g", warnHigh: 10 },
      { key: "monounsaturated-fat_100g", label: "Monounsaturated Fat", unit: "g" },
      { key: "polyunsaturated-fat_100g", label: "Polyunsaturated Fat", unit: "g" },
      { key: "trans-fat_100g", label: "Trans Fat", unit: "g", warnHigh: 0.1 },
      { key: "cholesterol_100g", label: "Cholesterol", unit: "mg" },
      { key: "carbohydrates_100g", label: "Carbohydrates", unit: "g" },
      { key: "sugars_100g", label: "Total Sugars", unit: "g", warnHigh: 20 },
      { key: "added-sugars_100g", label: "Added Sugars", unit: "g", warnHigh: 10 },
      { key: "fiber_100g", label: "Dietary Fiber", unit: "g", goodLow: 5 },
      { key: "sodium_100g", label: "Sodium", unit: "mg", warnHigh: 0.6 },
    ],
  },
  {
    label: "Minerals",
    keys: [
      { key: "calcium_100g", label: "Calcium", unit: "mg" },
      { key: "iron_100g", label: "Iron", unit: "mg", goodLow: 0.002 },
      { key: "magnesium_100g", label: "Magnesium", unit: "mg" },
      { key: "phosphorus_100g", label: "Phosphorus", unit: "mg" },
      { key: "potassium_100g", label: "Potassium", unit: "mg", goodLow: 0.3 },
      { key: "zinc_100g", label: "Zinc", unit: "mg", goodLow: 0.003 },
      { key: "selenium_100g", label: "Selenium", unit: "µg" },
    ],
  },
  {
    label: "Vitamins",
    keys: [
      { key: "vitamin-a_100g", label: "Vitamin A", unit: "µg" },
      { key: "vitamin-c_100g", label: "Vitamin C", unit: "mg" },
      { key: "vitamin-d_100g", label: "Vitamin D", unit: "µg" },
      { key: "vitamin-b12_100g", label: "Vitamin B12", unit: "µg", goodLow: 0.000001 },
      { key: "vitamin-b6_100g", label: "Vitamin B6", unit: "mg" },
      { key: "folate_100g", label: "Folate (B9)", unit: "µg" },
    ],
  },
];

/**
 * Daily Value reference amounts (per 2,000 kcal diet, FDA 2020 standards).
 * Values are stored in the same unit as the canonical _100g keys (i.e. g/100g for most,
 * except sodium/cholesterol which are in g but displayed as mg).
 */
const DAILY_VALUES: Record<string, number> = {
  "energy-kcal_100g": 2000,          // kcal
  "fat_100g": 78,                     // g
  "saturated-fat_100g": 20,           // g
  "trans-fat_100g": 2.2,              // g (no official DV; WHO <1% energy ≈ 2.2g)
  "cholesterol_100g": 0.3,            // g → 300 mg
  "carbohydrates_100g": 275,          // g
  "fiber_100g": 28,                   // g
  "sugars_100g": 50,                  // g
  "added-sugars_100g": 50,            // g
  "proteins_100g": 50,                // g
  "sodium_100g": 2.3,                 // g → 2300 mg
  "calcium_100g": 1.3,                // g → 1300 mg
  "iron_100g": 0.018,                 // g → 18 mg
  "magnesium_100g": 0.42,             // g → 420 mg
  "phosphorus_100g": 1.25,            // g → 1250 mg
  "potassium_100g": 4.7,              // g → 4700 mg
  "zinc_100g": 0.011,                 // g → 11 mg
  "selenium_100g": 0.000055,          // g → 55 µg
  "vitamin-a_100g": 0.0009,           // g → 900 µg RAE
  "vitamin-c_100g": 0.09,             // g → 90 mg
  "vitamin-d_100g": 0.00002,          // g → 20 µg
  "vitamin-b12_100g": 0.0000024,      // g → 2.4 µg
  "vitamin-b6_100g": 0.0017,          // g → 1.7 mg
  "folate_100g": 0.00040,             // g → 400 µg DFE
  "vitamin-e_100g": 0.015,            // g → 15 mg
  "vitamin-k_100g": 0.00012,          // g → 120 µg
};

/** Nutrients where high DV% is bad (red) rather than good */
const HIGH_IS_BAD = new Set(["saturated-fat_100g", "trans-fat_100g", "cholesterol_100g", "sodium_100g", "added-sugars_100g"]);

function getDVPercent(key: string, value100g: number, servingFactor: number): number | null {
  const dv = DAILY_VALUES[key];
  if (!dv) return null;
  const servingValue = value100g * servingFactor;
  return Math.round((servingValue / dv) * 100);
}

/**
 * Parse a serving size string to grams.
 * Handles numeric strings ("30", "28.35") and common unit strings ("1 cup", "2 tbsp", etc.).
 * Returns null when the value cannot be resolved to grams.
 */
function parseServingGrams(servingSize: string | null | undefined): number | null {
  if (!servingSize) return null;
  const str = String(servingSize).trim();
  // Direct numeric
  const direct = parseFloat(str);
  if (!isNaN(direct) && direct > 0) return direct;
  // "X unit" patterns — extract leading number and convert common units
  const match = str.match(/^([\d.]+)\s*([a-zA-Z]+)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (isNaN(num) || num <= 0) return null;
  const unitToGrams: Record<string, number> = {
    g: 1, gram: 1, grams: 1,
    kg: 1000, kilogram: 1000, kilograms: 1000,
    oz: 28.35, ounce: 28.35, ounces: 28.35,
    lb: 453.6, pound: 453.6, pounds: 453.6,
    ml: 1, milliliter: 1, milliliters: 1, millilitre: 1, millilitres: 1,
    l: 1000, liter: 1000, liters: 1000, litre: 1000, litres: 1000,
    cup: 240, cups: 240,
    tbsp: 15, tablespoon: 15, tablespoons: 15,
    tsp: 5, teaspoon: 5, teaspoons: 5,
    fl: 30, // fl oz
  };
  const factor = unitToGrams[unit];
  return factor ? num * factor : null;
}

function formatNutrientValue(key: string, raw: number): string {
  if (["sodium_100g", "calcium_100g", "iron_100g", "magnesium_100g", "phosphorus_100g", "potassium_100g", "zinc_100g"].includes(key)) {
    return (raw * 1000).toFixed(1);
  }
  if (["selenium_100g", "vitamin-a_100g", "vitamin-d_100g", "folate_100g", "vitamin-b12_100g"].includes(key)) {
    return (raw * 1000000).toFixed(2);
  }
  if (key.startsWith("vitamin-") || key === "choline_100g") {
    return (raw * 1000).toFixed(2);
  }
  if (key === "cholesterol_100g") return (raw * 1000).toFixed(1);
  return raw.toFixed(1);
}

interface GoalIndicator {
  nutrientKey: string;
  targetType: "min" | "max";
  targetValue: number;
  unit: string;
}

function NutrientRow({ k, label, unit, value, warnHigh, goodLow, servingFactor, goal }: {
  k: string; label: string; unit: string; value: number;
  warnHigh?: number; goodLow?: number; servingFactor: number;
  goal?: GoalIndicator;
}) {
  // value is always the _100g value; servingFactor converts to per-serving for display
  const displayValue = value * servingFactor;
  const isHigh = warnHigh !== undefined && displayValue > warnHigh;
  const isGood = goodLow !== undefined && displayValue >= goodLow;
  const dvPct = getDVPercent(k, value, servingFactor);
  // Color thresholds per spec:
  // Bad nutrients: red >40%, amber 20-40%, neutral otherwise
  // Good nutrients: green >=20%, amber 10-19%, neutral otherwise
  const dvColor = dvPct === null ? null
    : HIGH_IS_BAD.has(k)
      ? dvPct > 40 ? "#dc2626" : dvPct >= 20 ? "#d97706" : "#78716c"
      : dvPct >= 20 ? "#145A3A" : dvPct >= 10 ? "#d97706" : "#78716c";

  // Goal indicator: check if this product's per-100g value meets/exceeds the user's daily goal
  // We compare the displayed value against the goal target as a daily-total approximation
  let goalIcon: React.ReactNode = null;
  let goalRowBg: string | undefined;
  if (goal) {
    const rawVal = parseFloat(formatNutrientValue(k, value * servingFactor).replace(/,/g, ""));
    if (goal.targetType === "max") {
      // Lower is better
      const pctOfGoal = (rawVal / goal.targetValue) * 100;
      if (pctOfGoal <= 20) {
        // Well within limit — green check
        goalIcon = <span title={`Goal: stay under ${goal.targetValue}${goal.unit}/day (${Math.round(pctOfGoal)}% of limit)`} className="text-[9px] font-bold px-1 rounded" style={{ background: "#dcfce7", color: "#145A3A" }}>✓</span>;
        goalRowBg = "rgba(220,252,231,0.35)";
      } else if (pctOfGoal > 50) {
        // Over half the daily limit — red warning
        goalIcon = <span title={`Goal: stay under ${goal.targetValue}${goal.unit}/day (${Math.round(pctOfGoal)}% of limit)`} className="text-[9px] font-bold px-1 rounded" style={{ background: "#fee2e2", color: "#dc2626" }}>!</span>;
        goalRowBg = "rgba(254,226,226,0.35)";
      } else {
        // 20–50% of limit — amber caution
        goalIcon = <span title={`Goal: stay under ${goal.targetValue}${goal.unit}/day (${Math.round(pctOfGoal)}% of limit)`} className="text-[9px] font-bold px-1 rounded" style={{ background: "#fef9c3", color: "#a16207" }}>~</span>;
        goalRowBg = "rgba(254,249,195,0.35)";
      }
    } else {
      // Higher is better (min goal)
      const pctOfGoal = (rawVal / goal.targetValue) * 100;
      if (pctOfGoal >= 20) {
        // Good contribution — green check
        goalIcon = <span title={`Goal: reach ${goal.targetValue}${goal.unit}/day (${Math.round(pctOfGoal)}% of target)`} className="text-[9px] font-bold px-1 rounded" style={{ background: "#dcfce7", color: "#145A3A" }}>✓</span>;
        goalRowBg = "rgba(220,252,231,0.35)";
      } else if (pctOfGoal >= 5) {
        // Small contribution — amber
        goalIcon = <span title={`Goal: reach ${goal.targetValue}${goal.unit}/day (${Math.round(pctOfGoal)}% of target)`} className="text-[9px] font-bold px-1 rounded" style={{ background: "#fef9c3", color: "#a16207" }}>~</span>;
        goalRowBg = "rgba(254,249,195,0.35)";
      } else {
        // Very low contribution — red
        goalIcon = <span title={`Goal: reach ${goal.targetValue}${goal.unit}/day (${Math.round(pctOfGoal)}% of target)`} className="text-[9px] font-bold px-1 rounded" style={{ background: "#fee2e2", color: "#dc2626" }}>!</span>;
        goalRowBg = "rgba(254,226,226,0.35)";
      }
    }
  }

  return (
    <div
      className="flex items-center justify-between py-2.5 border-b border-stone-50 last:border-0 gap-2 -mx-4 px-4 rounded"
      style={goalRowBg ? { background: goalRowBg } : undefined}
    >
      <span className="text-xs text-muted-foreground flex-shrink min-w-0 truncate max-w-[110px]">{label}</span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className={`font-mono-data text-sm font-semibold${!isHigh && !isGood ? " text-foreground" : ""}`}
          style={{ color: isHigh ? "#dc2626" : isGood ? "#145A3A" : undefined }}
        >
          {formatNutrientValue(k, displayValue)}
        </span>
        <span className="font-mono-data text-[10px] text-muted-foreground w-6">{unit}</span>
        {isHigh && <AlertTriangle size={10} className="text-red-500" />}
        {isGood && <CheckCircle size={10} style={{ color: "#0B3D2E" }} />}
        {goalIcon}
        {dvPct !== null && (
          <span
            className="font-mono-data text-[10px] font-semibold w-10 text-right"
            style={{ color: dvColor ?? "#78716c" }}
          >
            {dvPct}%
          </span>
        )}
      </div>
    </div>
  );
}

function NutrientGroup({ group, nutriments, servingFactor, goals }: {
  group: typeof NUTRIENT_GROUPS[0];
  nutriments: Record<string, number>;
  servingFactor: number;
  goals?: GoalIndicator[];
}) {
  const [expanded, setExpanded] = useState(true);
  const rows = group.keys.filter(({ key }) => nutriments[key] !== undefined);
  if (rows.length === 0) return null;
  const goalMap = new Map((goals || []).map(g => [g.nutrientKey, g]));
  return (
    <div className="bg-card dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 overflow-hidden mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
      >
        <span className="ec-section-label">{group.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-stone-400 font-mono-data">{rows.length} values</span>
          {expanded ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-1">
          {rows.map(({ key, label, unit, warnHigh, goodLow }) => (
            <NutrientRow
              key={key} k={key} label={label} unit={unit}
              value={nutriments[key]} warnHigh={warnHigh} goodLow={goodLow}
              servingFactor={servingFactor}
              goal={goalMap.get(key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExtendedNutrientPanel({ nutrients }: { nutrients: ExtendedNutrient[] }) {
  const [expanded, setExpanded] = useState(false);
  const extra = nutrients.filter(n => n.value > 0 && n.name).slice(0, 40);
  if (extra.length === 0) return null;
  return (
    <div className="bg-card dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 overflow-hidden mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
      >
        <span className="ec-section-label">Full USDA Nutrient Report</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold" style={{ color: "#0B3D2E", fontFamily: "'DM Mono', monospace" }}>{extra.length} nutrients</span>
          {expanded ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-2">
          {extra.map((n, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
              <span className="text-xs text-muted-foreground">{n.name}</span>
              <span className="font-mono-data text-xs text-foreground">
                {n.value.toFixed(2)} {n.unit}
                {n.percentDailyValue ? <span className="text-muted-foreground ml-1">({n.percentDailyValue}% DV)</span> : null}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FlagCard({ flag }: { flag: ReturnType<typeof analyzeIngredients>["flags"][0] }) {
  const configs = {
    critical: { border: "#fca5a5", color: "#dc2626", label: "Critical", darkBg: "rgba(220,38,38,0.08)" },
    warning: { border: "#fed7aa", color: "#ea580c", label: "Warning", darkBg: "rgba(234,88,12,0.08)" },
    caution: { border: "#fde68a", color: "#d97706", label: "Caution", darkBg: "rgba(217,119,6,0.08)" },
    good: { border: "#b8e8b8", color: "#145A3A", label: "Good", darkBg: "rgba(20,90,58,0.12)" },
    excellent: { border: "#86d086", color: "#145A3A", label: "Excellent", darkBg: "rgba(20,90,58,0.12)" },
  };
  const c = configs[flag.severity] || configs.caution;
  return (
    <div className="rounded-2xl p-3.5 border" style={{ borderColor: c.border }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${c.color}15` }}>
          {flag.severity === "critical" || flag.severity === "warning"
            ? <AlertTriangle size={15} style={{ color: c.color }} />
            : flag.severity === "good" || flag.severity === "excellent"
            ? <CheckCircle size={15} style={{ color: c.color }} />
            : <Info size={15} style={{ color: c.color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-foreground text-sm">{flag.name}</span>
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${c.color}18`, color: c.color }}>
              {c.label}
            </span>
            <span className="text-[9px] text-muted-foreground font-mono-data">{flag.category}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{flag.reason}</p>
        </div>
      </div>
    </div>
  );
}

function AlternativesPanel({
  alternatives,
  message,
  scannedProductName,
  scannedProductScore,
}: {
  alternatives: Alternative[];
  message: string;
  scannedProductName: string;
  scannedProductScore: number;
}) {
  const { isSaved, toggle } = useSavedSwaps();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  if (alternatives.length === 0) return null;

  function scoreColor(s: number) {
    if (s >= 80) return isDark ? "#4ade80" : "#145A3A";
    if (s >= 65) return isDark ? "#86efac" : "#3FA34D";
    if (s >= 45) return isDark ? "#fbbf24" : "#d97706";
    return isDark ? "#f87171" : "#dc2626";
  }
  function scoreBg(s: number) {
    if (s >= 80) return isDark ? "#0f2a1e" : "#e8f9ee";
    if (s >= 65) return isDark ? "#0f2a1e" : "#f0faf2";
    if (s >= 45) return isDark ? "#2a1f0a" : "#fffbf0";
    return isDark ? "#2a0f0f" : "#fff5f5";
  }

  return (
    <div
      className="mb-3 overflow-hidden"
      style={{
        borderRadius: 20,
        border: isDark ? "1px solid #1e4a32" : "1px solid #c8ecd4",
        background: isDark
          ? "linear-gradient(160deg, #0d2318 0%, #0f2a1e 100%)"
          : "linear-gradient(160deg, #f4fdf6 0%, #edf9f1 100%)",
        boxShadow: isDark
          ? "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 4px 20px rgba(11,61,46,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom: isDark ? "1px solid #1e4a32" : "1px solid #d8f0df" }}
      >
        <div
          className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #0B3D2E, #1A7048)",
            boxShadow: "0 2px 8px rgba(11,61,46,0.3)",
          }}
        >
          <Sparkles size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-bold leading-none"
            style={{ color: isDark ? "#86efac" : "#0B3D2E", fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Healthier Alternatives
          </p>
          <p className="text-[10px] mt-0.5 leading-tight" style={{ color: isDark ? "#5a9a72" : "#4a7c5e" }}>{message}</p>
        </div>
        <div
          className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase"
          style={{ background: "#0B3D2E", color: "white" }}
        >
          {alternatives.length} found
        </div>
      </div>

      {/* Cards */}
      <div className="p-3 space-y-2.5">
        {alternatives.map((alt, idx) => (
          <div
            key={alt.id}
            className="flex items-center gap-3"
            style={{
              background: isDark ? "#142b1e" : "white",
              borderRadius: 14,
              padding: "10px 12px",
              border: isDark ? "1px solid #1e4a32" : "1px solid #e8f4ec",
              boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(11,61,46,0.06)",
            }}
          >
            {/* Rank + product image */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: isDark ? "#0f2a1e" : "#f0faf2", color: isDark ? "#4ade80" : "#145A3A" }}
              >
                {idx + 1}
              </div>
              {alt.image ? (
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ background: isDark ? "#0f2a1e" : "#f5f5f4" }}>
                  <img src={alt.image} alt={alt.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="text-lg leading-none">
                  {alt.emoji || (alt.type === "meat" ? "🥩" : alt.type === "fruit" ? "🍎" : "📦")}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-bold leading-tight truncate"
                style={{ color: isDark ? "#e8f4ec" : "#1a1a1a", letterSpacing: "-0.01em" }}
              >
                {alt.name}
              </p>
              <p className="text-[10px] font-medium" style={{ color: isDark ? "#6b9a7a" : "#6b7280" }}>{alt.brand}</p>
              <p
                className="text-[10px] mt-1 leading-snug"
                style={{ color: isDark ? "#4ade80" : "#145A3A" }}
              >
                {alt.reason}
              </p>
              {alt.certifications && alt.certifications.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {alt.certifications.slice(0, 2).map((cert) => (
                    <span
                      key={cert}
                      className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: isDark ? "#0f2a1e" : "#e8f9ee", color: isDark ? "#4ade80" : "#0B3D2E" }}
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Score ring + Save button */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{
                  background: scoreBg(alt.score),
                  border: `2px solid ${scoreColor(alt.score)}`,
                  boxShadow: `0 2px 8px ${scoreColor(alt.score)}30`,
                }}
              >
                <span
                  className="text-sm font-bold font-mono-data"
                  style={{ color: scoreColor(alt.score) }}
                >
                  {alt.score}
                </span>
              </div>
              <span className="text-[8px] font-medium" style={{ color: isDark ? "#5a7a6a" : "#9ca3af" }}>/100</span>
              {/* Save for Later */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(alt, scannedProductName, scannedProductScore);
                }}
                aria-label={isSaved(alt.id) ? "Remove from saved" : "Save for later"}
                className="flex flex-col items-center gap-0.5 transition-all active:scale-90"
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                <Bookmark
                  size={16}
                  style={{
                    color: isSaved(alt.id) ? (isDark ? "#4ade80" : "#0B3D2E") : "#9ca3af",
                    fill: isSaved(alt.id) ? (isDark ? "#4ade80" : "#0B3D2E") : "none",
                    transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                    transform: isSaved(alt.id) ? "scale(1.15)" : "scale(1)",
                  }}
                />
                <span
                  className="text-[8px] font-semibold"
                  style={{ color: isSaved(alt.id) ? (isDark ? "#4ade80" : "#0B3D2E") : "#9ca3af" }}
                >
                  {isSaved(alt.id) ? "Saved" : "Save"}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductResult({ product, onBack, onScanLabel, onScanAgain }: ProductResultProps) {
  const [, navigate] = useLocation();
  const [isFavorited, setIsFavorited] = useState(false);

  // Defensive normalization: allergens and labels may arrive as strings (e.g. from localStorage)
  const safeAllergens: string[] = Array.isArray(product.allergens)
    ? product.allergens
    : typeof product.allergens === "string" && (product.allergens as string).trim()
      ? (product.allergens as string).split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean)
      : [];
  const safeLabels: string[] = Array.isArray(product.labels)
    ? product.labels
    : typeof product.labels === "string" && (product.labels as string).trim()
      ? (product.labels as string).split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean)
      : [];

  // Auth state (must come before mutations that depend on user)
  const { user } = useAuth();

  // Server-side scan recording
  const addScanMutation = trpc.userFeatures.addScan.useMutation();
  // Server-side favorite toggle
  const addFavoriteMutation = trpc.userFeatures.addFavorite.useMutation();
  const removeFavoriteMutation = trpc.userFeatures.removeFavorite.useMutation();
  // Check if already favorited
  const { data: favoriteStatus } = trpc.userFeatures.isFavorite.useQuery(
    { barcode: product.barcode || "" },
    { enabled: !!user && !!product.barcode }
  );

  const handleCompare = () => {
    // Store product A in sessionStorage so CompareProductsPage can pick it up
    try {
      sessionStorage.setItem("eatclean_compare_a", JSON.stringify(product));
    } catch {}
    navigate("/compare");
  };
  const rawAnalysis = product.meatGrade
    ? analyzeMeatProduct(product.ingredients, product.meatGrade)
    : analyzeIngredients(product.ingredients);
  // Use precomputedScore when provided (e.g. from homepage cards) so the score
  // shown in the detail view matches what was shown on the card.
  const analysis = (() => {
    if (product.precomputedScore == null) return rawAnalysis;
    const s = product.precomputedScore;
    const color = s >= 80 ? "#145A3A" : s >= 60 ? "#d97706" : s >= 40 ? "#ea580c" : "#dc2626";
    const grade = s >= 80 ? "A" : s >= 60 ? "B" : s >= 40 ? "C" : s >= 20 ? "D" : "F";
    const label = s >= 80 ? "Excellent" : s >= 60 ? "Good" : s >= 40 ? "Fair" : "Poor";
    // Rebuild summary string with the correct precomputed score
    const criticalCount = rawAnalysis.flags.filter(f => f.severity === "critical").length;
    const warningCount = rawAnalysis.flags.filter(f => f.severity === "warning").length;
    const positives = rawAnalysis.positives || [];
    let summary = "";
    if (s >= 80) summary = `This product scores ${s}/100 — a clean choice with ${positives.length > 0 ? positives.length + " beneficial ingredient(s)" : "minimal harmful additives"}.`;
    else if (s >= 60) summary = `This product scores ${s}/100. Generally acceptable, but contains ${warningCount + criticalCount} ingredient(s) worth monitoring.`;
    else if (s >= 40) summary = `This product scores ${s}/100. Contains ${criticalCount} concerning ingredient(s). Consider cleaner alternatives.`;
    else if (s >= 20) summary = `This product scores ${s}/100. Contains ${criticalCount} harmful ingredient(s) including potential seed oils or artificial additives. Not recommended for regular consumption.`;
    else summary = `This product scores ${s}/100. Heavily processed with ${criticalCount} critical ingredients. This product should be avoided.`;
    return { ...rawAnalysis, score: s, color, grade, label, summary };
  })();
  const nutritionAnalysis = analyzeNutrition(product.nutriments);
  const [activeTab, setActiveTab] = useState<"overview" | "ingredients" | "nutrition">("overview");
  const [nutritionView, setNutritionView] = useState<"per100g" | "perServing">("per100g");

  // Fetch user's nutrition goals for goal indicators in the Nutrition tab
  const { data: userGoals = [] } = trpc.goals.getGoals.useQuery(undefined, {
    enabled: !!user,
  });
  const alternatives = shouldShowAlternatives(analysis.score)
    ? findAlternatives(product, analysis.score, 3)
    : [];

  // Record this scan in local history (localStorage)
  const { addScan } = useScanHistory();
  // Diet filter auto-highlighting
  const { checkIngredients, activeFilters } = useDietFilters();
  const dietConflicts = checkIngredients(product.ingredients || "");

  // Haptic + chime feedback on fresh scan (only when opened from scanner, not from history)
  // Chime pitch varies by grade: A/B → C5+E5 (bright), C → G4+B4 (neutral), D/F → D4+F4 (low)
  useEffect(() => {
    if (!onScanAgain) return; // only fire for fresh scans
    if (isScannerMuted()) return; // respect user mute preference
    try { navigator.vibrate?.(60); } catch { /* ignore */ }
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      // Pick tone pair by grade
      const grade = analysis.grade;
      const tones: [number, number] =
        grade === "A" || grade === "B" ? [523.25, 659.25] :  // C5 → E5 (bright, clean)
        grade === "C"                  ? [392.00, 493.88] :  // G4 → B4 (neutral, mild)
                                         [293.66, 349.23];   // D4 → F4 (low, warning)
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.4);
      });
      setTimeout(() => ctx.close(), 700);
    } catch { /* Audio not available */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync favorite status from server
  useEffect(() => {
    if (favoriteStatus !== undefined) {
      setIsFavorited(favoriteStatus.isFavorite);
    }
  }, [favoriteStatus]);

  useEffect(() => {
    // Record in localStorage history
    addScan(product, analysis.score, analysis.grade);
    // Record in server-side history if logged in
    if (user) {
      addScanMutation.mutate({
        barcode: product.barcode,
        productName: product.name,
        brand: product.brand,
        imageUrl: product.imageUrl,
        healthScore: analysis.score,
        grade: analysis.grade,
        category: product.category,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.barcode || product.name]);

  const handleToggleFavorite = () => {
    if (!user) {
      navigate("/scan");
      return;
    }
    if (isFavorited) {
      setIsFavorited(false);
      removeFavoriteMutation.mutate({ barcode: product.barcode });
    } else {
      setIsFavorited(true);
      addFavoriteMutation.mutate({
        barcode: product.barcode,
        productName: product.name,
        brand: product.brand,
        imageUrl: product.imageUrl,
        healthScore: analysis.score,
        grade: analysis.grade,
        category: product.category,
      });
    }
  };

  // Price lookup — skip API call if product already has a pre-set averagePrice
  const { data: priceApiData } = trpc.price.getAveragePrice.useQuery(
    { barcode: product.barcode || "", category: product.category, name: product.name },
    { enabled: !product.averagePrice && !!(product.barcode || product.name), staleTime: 1000 * 60 * 10 }
  );
  // Prefer the pre-set price (from homepage cards / guide pages), fall back to live API data
  const priceData = product.averagePrice != null
    ? { price: product.averagePrice, source: "estimate" as const, dataPoints: 0 }
    : priceApiData;

  const criticalFlags = analysis.flags.filter((f) => f.severity === "critical");
  const warningFlags = analysis.flags.filter((f) => f.severity === "warning");
  const cautionFlags = analysis.flags.filter((f) => f.severity === "caution");
  const novaInfo = product.novaGroup ? NOVA_LABELS[product.novaGroup] : null;
  const sourceInfo = SOURCE_INFO[product.dataSource] || SOURCE_INFO.estimated;
  const hasSeedOils = analysis.flags.some((f) => f.category === "Seed Oil") || dietConflicts.some(d => d.id === "no_seed_oils");
  const hasNitrates = analysis.flags.some((f) => f.name.toLowerCase().includes("nitrate") || f.name.toLowerCase().includes("nitrite"));
  const totalNutrients = Object.keys(product.nutriments).filter(k => product.nutriments[k] !== undefined).length;

  // Score color
  const scoreColor = analysis.color;
  const size = 100;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (analysis.score / 100) * circumference;

  return (
    <div className="ec-page-bg pb-24">
      {/* Header — Scout-style clean branded bar */}
      <div
        className="sticky top-0 z-10 bg-background/95 backdrop-blur-md"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          {/* Centered EatVera branding */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0B3D2E, #145A3A)" }}>
              <Leaf size={14} className="text-white" />
            </div>
            <span className="font-bold text-lg text-foreground" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.03em" }}>EatVera</span>
          </div>

          <div className="flex items-center gap-1">
            {onScanAgain && (
              <button
                onClick={onScanAgain}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #0B3D2E, #145A3A)" }}
                title="Scan another product"
              >
                <ScanLine size={13} />
                Scan
              </button>
            )}
            <button
              onClick={handleToggleFavorite}
              className="p-2 rounded-xl transition-colors"
              title={isFavorited ? "Remove from favorites" : "Save to favorites"}
              style={{ color: isFavorited ? "#ff6b6b" : "var(--muted-foreground)" }}
            >
              <Heart size={18} fill={isFavorited ? "#ff6b6b" : "none"} />
            </button>
            <button
              onClick={handleCompare}
              className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
              title="Compare with another product"
            >
              <ArrowLeftRight size={16} />
            </button>
          </div>
        </div>
        {/* Score accent line */}
        <div
          className="h-[2px] w-full transition-colors duration-300 animate-[accentPulse_1s_ease-in-out]"
          style={{ background: scoreColor }}
        />
      </div>

      {/* Product Hero */}
      <div className="px-4 pt-5 pb-3">
        <div className="ec-card p-4">
          {/* Large Product Image */}
          {product.imageUrl ? (
            <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 flex items-center justify-center" style={{ background: "var(--muted)" }}>
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain p-3"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.classList.add("fallback-icon"); }}
              />
            </div>
          ) : (
            <div className="mb-4">
              <ProductImageSuggest barcode={product.barcode ?? ""} productName={product.name} />
            </div>
          )}

          {/* Product Info */}
          <div className="mb-4">
            <h2 className="font-bold text-foreground text-lg leading-tight mb-1" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.025em" }}>{product.name}</h2>
            <p className="text-muted-foreground text-sm mb-2.5 font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>{product.brand}</p>
            <div className="flex flex-wrap gap-1.5">
              {product.quantity && (
                <span className="text-[10px] text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-medium tracking-wide">{product.quantity}</span>
              )}
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-medium tracking-wide flex items-center gap-1" style={{ color: sourceInfo.color, background: `${sourceInfo.color}12` }}>
                <Database size={8} />{sourceInfo.label}
              </span>
              {product.isRandomWeight && (
                <span className="text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-medium tracking-wide">Store-Weighed</span>
              )}
            </div>
          </div>

          {/* Score + Summary */}
          <div className="flex items-center gap-4 p-3 rounded-2xl" style={{ background: `${scoreColor}08`, border: `1px solid ${scoreColor}20` }}>
            {/* Score ring */}
            <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
              <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e7e5e4" strokeWidth={strokeWidth} />
                <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={scoreColor} strokeWidth={strokeWidth}
                  strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
              </svg>
              <div className="absolute text-center">
                <div className="font-bold text-2xl leading-none" style={{ color: scoreColor, fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.03em" }}>{analysis.score}</div>
                <div className="text-[9px] font-semibold mt-0.5" style={{ color: scoreColor }}>{analysis.grade}</div>
              </div>
            </div>

            <div className="flex-1">
              <p className="font-semibold text-sm mb-1" style={{ color: scoreColor }}>{analysis.label}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{analysis.summary}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {hasSeedOils && (
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fee2e2", color: "#dc2626" }}>⚠ Seed Oils</span>
                )}
                {hasNitrates && (
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fff7ed", color: "#ea580c" }}>⚠ Nitrates</span>
                )}
                {product.meatGrade?.isGrassFed && (
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#dcf4dc", color: "#145A3A" }}>✓ Grass-Fed</span>
                )}
                {product.meatGrade?.isOrganic && (
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#dcf4dc", color: "#145A3A" }}>✓ Organic</span>
                )}
              </div>
            </div>
          </div>

          {/* Price */}
          {priceData && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xl font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}>
                ${priceData.price.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground font-medium">avg price</span>
              {product.nutriments && product.nutriments["serving_size_g"] && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    ${(priceData.price / (product.nutriments["serving_size_g"] / 100)).toFixed(2)}/serving
                  </span>
                </>
              )}
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center p-2.5 rounded-xl bg-muted">
              <div className="font-bold text-base" style={{ color: analysis.flags.length > 0 ? "#dc2626" : "#0B3D2E", fontFamily: "'DM Sans', sans-serif" }}>
                {analysis.flags.length}
              </div>
              <div className="ec-section-label">Flags</div>
            </div>
            {product.nutriScore && (() => {
              const ns = NUTRISCORE_COLORS[product.nutriScore] || { color: "#78716c", bg: "#f5f5f4" };
              return (
                <div className="text-center p-2.5 rounded-xl" style={{ background: ns.bg }}>
                  <div className="font-bold text-base" style={{ color: ns.color, fontFamily: "'DM Sans', sans-serif" }}>{product.nutriScore}</div>
                  <div className="ec-section-label">Nutri-Score</div>
                </div>
              );
            })()}
            {novaInfo && (
              <div className="text-center p-2.5 rounded-xl" style={{ background: novaInfo.bg }}>
                <div className="font-bold text-base" style={{ color: novaInfo.color, fontFamily: "'DM Sans', sans-serif" }}>{product.novaGroup}</div>
                <div className="ec-section-label">NOVA</div>
              </div>
            )}
            <div className="text-center p-2.5 rounded-xl bg-muted">
              <div className="font-bold text-base text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>{totalNutrients}</div>
              <div className="ec-section-label">Nutrients</div>
            </div>
          </div>

          {/* Macro Summary Strip — visible when nutrition data is available */}
          {(() => {
            const n = product.nutriments;
            const cal = n["energy-kcal_100g"];
            const prot = n["proteins_100g"];
            const carb = n["carbohydrates_100g"];
            const fat = n["fat_100g"];
            const fiber = n["fiber_100g"];
            const sodium = n["sodium_100g"];
            const hasMacros = cal !== undefined || prot !== undefined || carb !== undefined || fat !== undefined;
            if (!hasMacros) return null;
            const macros = [
              { label: "Cal", value: cal !== undefined ? Math.round(cal) : null, unit: "kcal", color: "#d97706" },
              { label: "Protein", value: prot !== undefined ? prot.toFixed(1) : null, unit: "g", color: "#0B3D2E" },
              { label: "Carbs", value: carb !== undefined ? carb.toFixed(1) : null, unit: "g", color: "#d97706" },
              { label: "Fat", value: fat !== undefined ? fat.toFixed(1) : null, unit: "g", color: "#78716c" },
              { label: "Fiber", value: fiber !== undefined ? fiber.toFixed(1) : null, unit: "g", color: "#0B3D2E" },
              { label: "Sodium", value: sodium !== undefined ? Math.round(sodium * 1000) : null, unit: "mg", color: "#78716c" },
            ].filter(m => m.value !== null);
            return (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="ec-section-label">Nutrition per 100g</span>
                  <button
                    onClick={() => setActiveTab("nutrition")}
                    className="text-[10px] font-semibold flex items-center gap-1"
                    style={{ color: "#0B3D2E" }}
                  >
                    Full panel →
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {macros.map(({ label, value, unit, color }) => (
                    <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: `${color}06`, border: `1px solid ${color}12` }}>
                      <div className="font-bold text-sm leading-none" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>{value}<span className="text-[9px] font-normal ml-0.5 text-muted-foreground">{unit}</span></div>
                      <div className="text-[10px] font-medium text-muted-foreground mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Force of Nature Special Banner */}
      {product.brand === "Force of Nature" && (
        <div className="px-4 mb-3">
          <div className="rounded-2xl p-4 border" style={{ background: "linear-gradient(135deg, #f0faf0, #e8f7e8)", borderColor: "#86d086" }}>
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} style={{ color: "#145A3A" }} />
              <span className="font-bold text-foreground text-sm">Force of Nature Meats</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#0B3D2E", color: "white" }}>TOP RATED</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              Force of Nature sources 100% regenerative, grass-fed and grass-finished meats from a verified network of regenerative farms. Every product is free of antibiotics, hormones, fillers, and seed oils.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Regenerative", "Grass-Fed", "Grass-Finished", "No Antibiotics", "No Hormones", "No Fillers", "No Seed Oils"].map(tag => (
                <span key={tag} className="ec-badge-green">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Meat Quality Card */}
      {product.meatGrade && (
        <div className="px-4 mb-3">
          <div className="ec-card p-4">
            <div className="flex items-center gap-2 mb-3">
              {product.meatGrade.type === "Seafood" ? <Fish size={16} style={{ color: "#0B3D2E" }} /> : <Beef size={16} style={{ color: "#0B3D2E" }} />}
              <span className="font-semibold text-foreground text-sm">{product.meatGrade.type} Quality Profile</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: "Type", value: product.meatGrade.type },
                { label: "Cut", value: product.meatGrade.cut || "—" },
                { label: "USDA Grade", value: product.meatGrade.usdaGrade || "—" },
                { label: "Grass-Fed", value: product.meatGrade.isGrassFed ? "✓ Yes" : "Not Labeled" },
                { label: "Organic", value: product.meatGrade.isOrganic ? "✓ Yes" : "Not Labeled" },
                { label: "No Antibiotics", value: product.meatGrade.isAntibiotic ? "✓ Yes" : "Not Labeled" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl p-2.5 ec-page-bg">
                  <div className="ec-section-label mb-0.5">{label}</div>
                  <div className="text-xs font-semibold text-foreground">{value}</div>
                </div>
              ))}
            </div>
            {product.meatGrade.qualityNotes.length > 0 && (
              <div className="space-y-1.5">
                {product.meatGrade.qualityNotes.map((note, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Leaf size={11} style={{ color: "#0B3D2E" }} className="flex-shrink-0 mt-0.5" />
                    {note}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border px-4 mb-4 ec-sticky-header sticky top-[57px] z-9">
        {(["overview", "ingredients", "nutrition"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 font-mono-data text-xs tracking-widest uppercase transition-colors ${
              activeTab === tab ? "ec-tab-active" : "ec-tab-inactive"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-3 fade-in">
            {/* Seed Oil Warning */}
            {hasSeedOils && (
              <div className="ec-warning-banner">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={18} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-700 text-sm mb-1">Seed Oils Detected</h3>
                    <p className="text-red-600/70 text-xs leading-relaxed">
                      This product contains industrially processed seed oils high in omega-6 linoleic acid. Research links excessive omega-6 to chronic inflammation and metabolic dysfunction.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Diet Filter Conflicts Banner */}
            {dietConflicts.length > 0 && (
              <div className="rounded-2xl p-4 border" style={{ background: "#faf5ff", borderColor: "#c4b5fd" }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Settings size={16} className="text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-violet-700 text-sm mb-1.5">Your Diet Filter Alerts</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {dietConflicts.map((cfg) => (
                        <span key={cfg.id} className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {cfg.emoji} {cfg.label}
                        </span>
                      ))}
                    </div>
                    <p className="text-violet-600/70 text-xs mt-1.5 leading-relaxed">
                      This product contains ingredients that conflict with your personal diet preferences.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Nitrate Warning */}
            {hasNitrates && (
              <div className="rounded-2xl p-4 border" style={{ background: "#fff7ed", borderColor: "#fed7aa" }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <FlaskConical size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-orange-700 text-sm mb-1">Sodium Nitrate/Nitrite Detected</h3>
                    <p className="text-orange-600/70 text-xs leading-relaxed">
                      Nitrates in processed meats form N-nitrosamines when cooked at high heat — potent carcinogens. The WHO/IARC classifies processed meats as Group 1 carcinogens.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Critical */}
            {criticalFlags.length > 0 && (
              <div>
                <div className="ec-section-label mb-2">{criticalFlags.length} Critical Issue{criticalFlags.length !== 1 ? "s" : ""}</div>
                <div className="space-y-2">{criticalFlags.map((f, i) => <FlagCard key={i} flag={f} />)}</div>
              </div>
            )}

            {/* Warnings */}
            {warningFlags.length > 0 && (
              <div>
                <div className="ec-section-label mb-2">{warningFlags.length} Warning{warningFlags.length !== 1 ? "s" : ""}</div>
                <div className="space-y-2">{warningFlags.map((f, i) => <FlagCard key={i} flag={f} />)}</div>
              </div>
            )}

            {/* Cautions */}
            {cautionFlags.length > 0 && (
              <div>
                <div className="ec-section-label mb-2">{cautionFlags.length} Caution{cautionFlags.length !== 1 ? "s" : ""}</div>
                <div className="space-y-2">{cautionFlags.map((f, i) => <FlagCard key={i} flag={f} />)}</div>
              </div>
            )}

            {/* Positives */}
            {analysis.positives.length > 0 && (
              <div>
                <div className="ec-section-label mb-2">{analysis.positives.length} Clean Ingredient{analysis.positives.length !== 1 ? "s" : ""}</div>
                <div className="grid grid-cols-2 gap-2">
                  {analysis.positives.map((ing, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2 border" style={{ borderColor: "#b8e8b8" }}>
                      <Leaf size={12} style={{ color: "#0B3D2E" }} className="flex-shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate">{ing}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clean bill */}
            {analysis.flags.length === 0 && (
              <div className="ec-good-banner text-center py-6">
                <ShieldCheck size={36} style={{ color: "#0B3D2E" }} className="mx-auto mb-2" />
                <h3 className="font-bold text-foreground text-sm mb-1">Clean Product</h3>
                <p className="text-muted-foreground text-xs">No harmful ingredients detected. This is a clean choice.</p>
              </div>
            )}

            {/* Nutrition concerns */}
            {nutritionAnalysis.concerns.length > 0 && (
              <div className="ec-card p-4">
                <div className="ec-section-label mb-2">Nutritional Concerns</div>
                {nutritionAnalysis.concerns.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-600 mb-1.5">
                    <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
                    {c}
                  </div>
                ))}
              </div>
            )}

            {/* Nutrition positives */}
            {nutritionAnalysis.positives.length > 0 && (
              <div className="ec-card p-4">
                <div className="ec-section-label mb-2">Nutritional Highlights</div>
                {nutritionAnalysis.positives.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs mb-1.5" style={{ color: "#145A3A" }}>
                    <CheckCircle size={11} className="flex-shrink-0 mt-0.5" />
                    {p}
                  </div>
                ))}
              </div>
            )}

            {/* Healthier Alternatives */}
            {alternatives.length > 0 && (
              <AlternativesPanel
                alternatives={alternatives}
                message={getAlternativesMessage(analysis.score)}
                scannedProductName={product.name}
                scannedProductScore={analysis.score}
              />
            )}

            {/* NOVA */}
            {novaInfo && (
              <div className="ec-card p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap size={14} style={{ color: novaInfo.color }} />
                  <span className="font-semibold text-sm" style={{ color: novaInfo.color }}>
                    NOVA {product.novaGroup} — {novaInfo.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{novaInfo.desc}</p>
              </div>
            )}

            {/* Allergens */}
            {safeAllergens.length > 0 && (
              <div className="ec-card p-4">
                <div className="ec-section-label mb-2">Allergens</div>
                <div className="flex flex-wrap gap-1.5">
                  {safeAllergens.map((a, i) => (
                    <span key={i} className="ec-badge-amber">{a.replace(/-/g, " ").toUpperCase()}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Labels */}
            {safeLabels.length > 0 && (
              <div className="ec-card p-4">
                <div className="ec-section-label mb-2">Certifications</div>
                <div className="flex flex-wrap gap-1.5">
                  {safeLabels.map((l, i) => (
                    <span key={i} className="ec-badge-green">{l.replace(/-/g, " ").toUpperCase()}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INGREDIENTS */}
        {activeTab === "ingredients" && (
          <div className="fade-in">
            {product.ingredients ? (
              <>
                <div className="ec-card p-4 mb-3">
                  <div className="ec-section-label mb-2">Full Ingredients List</div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-mono-data">{product.ingredients}</p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                    <span className="text-[10px] text-muted-foreground font-mono-data">{product.ingredients.split(/[,;]/).length} ingredients</span>
                    <span className="text-[10px] text-muted-foreground font-mono-data">{analysis.flags.length} flagged</span>
                    <span className="text-[10px] text-muted-foreground font-mono-data">{analysis.positives.length} clean</span>
                  </div>
                </div>

                {product.additives && product.additives.length > 0 && (
                  <div className="ec-card p-4 mb-3" style={{ borderColor: "#fed7aa" }}>
                    <div className="ec-section-label mb-2" style={{ color: "#ea580c" }}>E-Numbers / Additives ({product.additives.length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.additives.map((a, i) => (
                        <span key={i} className="ec-badge-amber">{a.replace("en:", "").toUpperCase()}</span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.flags.length > 0 && (
                  <div>
                    <div className="ec-section-label mb-2">Flagged Ingredients ({analysis.flags.length})</div>
                    <div className="space-y-2">
                      {analysis.flags.map((f, i) => <FlagCard key={i} flag={f} />)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Package size={32} className="text-muted-foreground opacity-40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No ingredient data available</p>
                {product.isRandomWeight && (
                  <p className="text-muted-foreground opacity-60 text-xs mt-1">Fresh/whole food — no ingredient list required</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* NUTRITION */}
        {activeTab === "nutrition" && (
          <div className="fade-in">
            {/* Serving toggle + DV% legend */}
            {(() => {
              const servingGrams = parseServingGrams(product.servingSize);
              const hasServing = servingGrams !== null && servingGrams > 0;
              return (
                <div className="ec-card p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {hasServing && (
                        <>
                          <button
                            onClick={() => setNutritionView("per100g")}
                            className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
                              nutritionView === "per100g"
                                ? "text-white"
                                : "text-muted-foreground bg-muted"
                            }`}
                            style={nutritionView === "per100g" ? { background: "#0B3D2E" } : {}}
                          >
                            Per 100g
                          </button>
                          <button
                            onClick={() => setNutritionView("perServing")}
                            className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
                              nutritionView === "perServing"
                                ? "text-white"
                                : "text-muted-foreground bg-muted"
                            }`}
                            style={nutritionView === "perServing" ? { background: "#0B3D2E" } : {}}
                          >
                            Per Serving ({servingGrams}g)
                          </button>
                        </>
                      )}
                      {!hasServing && (
                        <span className="text-xs font-semibold text-foreground">Per 100g</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono-data">% Daily Value</span>
                  </div>
                  {hasServing && nutritionView === "perServing" && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Serving: {product.servingSize}{product.servingUnit ? ` ${product.servingUnit}` : ""}
                    </p>
                  )}
                </div>
              );
            })()}

             {Object.keys(product.nutriments).length > 0 ? (
              <>
                {(() => {
                  const servingGrams = parseServingGrams(product.servingSize);
                  const servingFactor = nutritionView === "perServing" && servingGrams ? servingGrams / 100 : 1;
                  return NUTRIENT_GROUPS.map((group) => (
                    <NutrientGroup key={group.label} group={group} nutriments={product.nutriments} servingFactor={servingFactor} goals={userGoals as GoalIndicator[]} />
                  ));
                })()}
                {product.extendedNutrients && <ExtendedNutrientPanel nutrients={product.extendedNutrients} />}
                {product.fdcId && (
                  <a
                    href={`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${product.fdcId}/nutrients`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-mono-data mt-3 transition-colors"
                    style={{ color: "#0B3D2E" }}
                  >
                    <ExternalLink size={10} />
                    View full USDA nutrient report (FDC ID: {product.fdcId})
                  </a>
                )}
                {/* FDA-style shareable label */}
                {(() => {
                  const servingGrams = parseServingGrams(product.servingSize);
                  const sf = nutritionView === "perServing" && servingGrams ? servingGrams / 100 : 1;
                  const lbl = nutritionView === "perServing" && servingGrams
                    ? `Per Serving (${servingGrams}g)`
                    : "Per 100g";
                  return (
                    <div className="mt-4">
                      <p className="ec-section-label mb-2">Shareable Label</p>
                      <NutritionLabelCanvas product={product} servingFactor={sf} servingLabel={lbl} />
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="text-center py-10">
                <Package size={32} className="text-muted-foreground opacity-40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-semibold mb-1">No nutrition data available</p>
                <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto mb-4">
                  This product has no nutrition facts on record. If you have the ingredient list,
                  you can get an AI-estimated nutrition breakdown.
                </p>
                {product.ingredients && (
                  <button
                    onClick={() => setActiveTab("overview")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: "linear-gradient(135deg, #0B3D2E, #3FA34D)", color: "white" }}
                  >
                    <Sparkles size={13} />
                    Get AI Nutrition Estimate
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scan Again shortcut — re-open scanner for consecutive scanning */}
      {onScanAgain && (
        <div className="mx-4 mt-4 mb-2">
          <button
            onClick={onScanAgain}
            className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #1a5c38 0%, #0B3D2E 100%)",
              boxShadow: "0 4px 20px rgba(11,61,46,0.30)",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <ScanLine size={18} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-white text-sm leading-tight">Scan Again</p>
              <p className="text-green-200 text-xs mt-0.5 leading-snug">
                Scan another product instantly
              </p>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5 2l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Scan Label shortcut — cross-check printed label against database data */}
      {onScanLabel && (
        <div className="mx-4 mt-4 mb-2">
          <button
            onClick={onScanLabel}
            className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #0B3D2E 0%, #1a5c38 50%, #2e9e5e 100%)",
              boxShadow: "0 4px 20px rgba(11,61,46,0.30)",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <FlaskConical size={18} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-white text-sm leading-tight">Scan Label</p>
              <p className="text-green-200 text-xs mt-0.5 leading-snug">
                Compare with the actual printed label
              </p>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5 2l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Attribution */}
      <div className="px-4 mt-6 pb-2">
        {product.dataSource === "openfoodfacts" && (
          <a href={`https://world.openfoodfacts.org/product/${product.barcode}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-stone-400 hover:text-stone-600 transition-colors font-mono-data mb-1">
            <ExternalLink size={10} /> View on Open Food Facts
          </a>
        )}
        {(product.dataSource === "usda" || product.dataSource === "usda-sr") && product.fdcId && (
          <a href={`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${product.fdcId}/nutrients`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-stone-400 hover:text-stone-600 transition-colors font-mono-data mb-1">
            <ExternalLink size={10} /> View on USDA FoodData Central
          </a>
        )}
        <p className="text-[9px] text-stone-300 font-mono-data">EatVera uses Open Food Facts (CC BY-SA) and USDA FoodData Central.</p>
      </div>



      {/* Disclaimer */}
      <div className="mx-4 mb-6 rounded-2xl p-4 border" style={{ background: "rgba(11,61,46,0.04)", borderColor: "rgba(11,61,46,0.12)" }}>
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(11,61,46,0.1)" }}>
            <Info size={12} style={{ color: "#0B3D2E" }} />
          </div>
          <div>
            <p className="text-[10px] font-semibold mb-0.5" style={{ color: "#0B3D2E" }}>Informational Only — Not Medical Advice</p>
            <p className="text-[10px] leading-relaxed text-stone-500 dark:text-stone-400">
              EatVera scores are based on ingredient quality, processing level, and nutritional data. They are intended for general informational purposes only and do not constitute medical, dietary, or health advice. Always consult a qualified healthcare professional before making changes to your diet. Individual nutritional needs vary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
