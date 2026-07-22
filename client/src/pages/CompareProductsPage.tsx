/**
 * EatVera — Product Comparison Mode v2
 * Design: Premium visual comparison with real product images
 * - Full-bleed hero with large product images + score rings
 * - Dramatic VS divider with winner crown
 * - Visual nutrition bars (relative fill)
 * - Expanded product pool from all databases
 * - Polished product picker with images
 */

import { useState, useMemo } from "react";
import {
  Search, X, Plus, ArrowLeftRight, CheckCircle, AlertTriangle,
  Info, Package, Beef, Fish, Share2, Copy, Check, ArrowLeft,
  Crown, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { hapticLight } from "@/lib/haptic";
import { toast } from "sonner";
import { DEMO_PRODUCTS, FORCE_OF_NATURE_PRODUCTS, type FoodProduct } from "@/lib/foodApi";
import { analyzeIngredients, analyzeMeatProduct, type NutritionAnalysis } from "@/lib/ingredientAnalysis";
import { ALL_MEAT_BRANDS } from "@/lib/meatDatabase";
import { ALL_SNACKS } from "@/lib/snackDatabase";
import { ALL_GRAINS } from "@/lib/grainsDatabase";
import { ALL_ICE_CREAM } from "@/lib/iceCreamDatabase";
import { ALL_BEVERAGES } from "@/lib/beveragesDatabase";
import { ALL_SUPPLEMENTS } from "@/lib/supplementDatabase";
import { ALL_FROZEN } from "@/lib/frozenDatabase";

// ─── Unified product pool from all databases ─────────────────────────────────
function buildProductPool(): FoodProduct[] {
  const snackProducts: FoodProduct[] = ALL_SNACKS.map((s) => ({
    barcode: s.barcode || s.upc || `snack-${s.id}`,
    name: s.name,
    brand: s.brand,
    category: `Snacks — ${s.category}`,
    ingredients: s.ingredients,
    imageUrl: s.imageUrl,
    nutriments: s.nutriments || {},
    dataSource: "estimated" as const,
    labels: s.certifications,
    servingSize: s.servingSize,
  }));

  const grainsProducts: FoodProduct[] = ALL_GRAINS.map((g) => ({
    barcode: g.barcode || `grain-${g.id}`,
    name: g.name,
    brand: g.brand,
    category: `Bread & Grains — ${g.category}`,
    ingredients: g.ingredients || "",
    imageUrl: g.imageUrl,
    nutriments: g.nutrients ? ({
      "energy-kcal_100g": g.nutrients.calories || 0,
      "carbohydrates_100g": g.nutrients.carbs || 0,
      "fiber_100g": g.nutrients.fiber || 0,
      "sugars_100g": g.nutrients.sugar || 0,
      "proteins_100g": g.nutrients.protein || 0,
      "sodium_100g": (g.nutrients.sodium || 0) / 1000,
    } as Record<string, number>) : {} as Record<string, number>,
    dataSource: "estimated" as const,
  }));

  const iceCreamProducts: FoodProduct[] = ALL_ICE_CREAM.map((ic) => ({
    barcode: ic.barcode || `icecream-${ic.id}`,
    name: ic.name,
    brand: ic.brand,
    category: `Ice Cream — ${ic.category}`,
    ingredients: ic.ingredients || "",
    imageUrl: ic.imageUrl,
    nutriments: ic.nutrients ? ({
      "energy-kcal_100g": ic.nutrients.calories || 0,
      "fat_100g": ic.nutrients.fat || 0,
      "saturated-fat_100g": ic.nutrients.saturatedFat || 0,
      "sugars_100g": ic.nutrients.sugar || 0,
      "proteins_100g": ic.nutrients.protein || 0,
    } as Record<string, number>) : {} as Record<string, number>,
    dataSource: "estimated" as const,
  }));

  const beverageProducts: FoodProduct[] = ALL_BEVERAGES.map((b) => ({
    barcode: b.barcode || `bev-${b.id}`,
    name: b.name,
    brand: b.brand,
    category: `Beverages — ${b.category}`,
    ingredients: b.ingredients || "",
    imageUrl: b.imageUrl,
    nutriments: b.nutrients ? ({
      "energy-kcal_100g": b.nutrients.calories || 0,
      "sugars_100g": b.nutrients.sugar || 0,
      "sodium_100g": (b.nutrients.sodium || 0) / 1000,
    } as Record<string, number>) : {} as Record<string, number>,
    dataSource: "estimated" as const,
  }));

  const supplementProducts: FoodProduct[] = ALL_SUPPLEMENTS.map((s) => ({
    barcode: s.barcode || `supp-${s.id}`,
    name: s.name,
    brand: s.brand,
    category: `Supplements — ${s.category}`,
    ingredients: s.ingredients || "",
    imageUrl: s.imageUrl,
    nutriments: s.nutrients ? ({
      "energy-kcal_100g": s.nutrients.calories || 0,
      "proteins_100g": s.nutrients.protein || 0,
      "carbohydrates_100g": s.nutrients.carbs || 0,
      "fat_100g": s.nutrients.fat || 0,
      "sodium_100g": (s.nutrients.sodium || 0) / 1000,
    } as Record<string, number>) : {} as Record<string, number>,
    dataSource: "estimated" as const,
  }));

  const frozenProducts: FoodProduct[] = ALL_FROZEN.map((f) => ({
    barcode: f.barcode || `frozen-${f.id}`,
    name: f.name,
    brand: f.brand,
    category: `Frozen — ${f.category}`,
    ingredients: f.ingredients || "",
    imageUrl: f.imageUrl,
    nutriments: f.nutrients ? ({
      "energy-kcal_100g": f.nutrients.calories || 0,
      "fat_100g": f.nutrients.fat || 0,
      "sodium_100g": (f.nutrients.sodium || 0) / 1000,
      "proteins_100g": f.nutrients.protein || 0,
      "carbohydrates_100g": f.nutrients.carbs || 0,
    } as Record<string, number>) : {} as Record<string, number>,
    dataSource: "estimated" as const,
  }));

  const meatProducts: FoodProduct[] = ALL_MEAT_BRANDS.map((b) => ({
    barcode: b.barcode || `meat-${b.name.replace(/\s+/g, '-').toLowerCase()}`,
    name: b.name,
    brand: b.brand,
    category: `Meats — ${b.category}`,
    ingredients: b.ingredients,
    nutriments: b.nutriments || {},
    dataSource: "estimated" as const,
    meatGrade: b.meatGrade,
    labels: b.labels,
    imageUrl: undefined,
  }));

  return [
    ...snackProducts,
    ...grainsProducts,
    ...iceCreamProducts,
    ...beverageProducts,
    ...supplementProducts,
    ...frozenProducts,
    ...meatProducts,
    ...FORCE_OF_NATURE_PRODUCTS,
    ...DEMO_PRODUCTS,
  ];
}

const ALL_PRODUCTS = buildProductPool();

// ─── Suggested comparison pairs (use product IDs from pool) ──────────────────
const SUGGESTED_PAIRS: { labelA: string; labelB: string; label: string; emoji: string; findA: (p: FoodProduct) => boolean; findB: (p: FoodProduct) => boolean }[] = [
  {
    label: "Clean Chips vs Ruffles",
    emoji: "🥔",
    labelA: "Jackson's Sweet Potato",
    labelB: "Ruffles Original",
    findA: (p) => p.name.includes("Jackson") && p.category.includes("Snack"),
    findB: (p) => p.name.includes("Ruffles"),
  },
  {
    label: "Ezekiel vs Wonder Bread",
    emoji: "🍞",
    labelA: "Ezekiel Sprouted",
    labelB: "Wonder Classic White",
    findA: (p) => p.name.includes("Sprouted Grain Bread") && p.brand.includes("Food for Life"),
    findB: (p) => p.name.includes("Classic White") && p.brand.includes("Wonder"),
  },
  {
    label: "OLIPOP vs Coca-Cola",
    emoji: "🥤",
    labelA: "OLIPOP Vintage Cola",
    labelB: "Coca-Cola Classic",
    findA: (p) => p.name.includes("Vintage Cola"),
    findB: (p) => p.name.includes("Coca-Cola Classic"),
  },
  {
    label: "Clean Protein vs Muscle Milk",
    emoji: "💪",
    labelA: "Naked Whey",
    labelB: "Muscle Milk Pro",
    findA: (p) => p.name.includes("Naked Whey"),
    findB: (p) => p.name.includes("Pro Series Protein"),
  },
  {
    label: "Ice Cream for Bears vs Great Value",
    emoji: "🍦",
    labelA: "Bears Queen Bean",
    labelB: "Great Value Vanilla",
    findA: (p) => p.name.includes("Queen") && p.brand.includes("Bears"),
    findB: (p) => p.name.includes("Vanilla Flavored") && p.brand.includes("Great Value"),
  },
  {
    label: "Almonds vs Oreos",
    emoji: "🍪",
    labelA: "Blue Diamond Almonds",
    labelB: "Oreo Cookies",
    findA: (p) => p.name.includes("Blue Diamond Almonds"),
    findB: (p) => p.name.includes("Oreo Original"),
  },
];

// ─── Nutrition keys to compare ────────────────────────────────────────────────
const COMPARE_NUTRIENTS: { key: string; label: string; unit: string; lowerIsBetter?: boolean; max: number }[] = [
  { key: "energy-kcal_100g", label: "Calories", unit: "kcal", max: 600 },
  { key: "proteins_100g", label: "Protein", unit: "g", max: 50 },
  { key: "fat_100g", label: "Total Fat", unit: "g", max: 60 },
  { key: "saturated-fat_100g", label: "Saturated Fat", unit: "g", lowerIsBetter: true, max: 30 },
  { key: "carbohydrates_100g", label: "Carbs", unit: "g", max: 80 },
  { key: "sugars_100g", label: "Sugars", unit: "g", lowerIsBetter: true, max: 60 },
  { key: "fiber_100g", label: "Fiber", unit: "g", max: 20 },
  { key: "sodium_100g", label: "Sodium", unit: "mg", lowerIsBetter: true, max: 1 },
];

function formatNutrient(key: string, raw: number): string {
  if (key === "sodium_100g") return (raw * 1000).toFixed(0);
  return raw.toFixed(1);
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const sw = size > 70 ? 7 : 5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-bold leading-none" style={{ color, fontSize: size * 0.26, fontFamily: "'DM Mono', monospace" }}>{score}</div>
        <div className="leading-none mt-0.5" style={{ fontSize: size * 0.12, color: "rgba(0,0,0,0.35)" }}>/ 100</div>
      </div>
    </div>
  );
}

// ─── Product Image ────────────────────────────────────────────────────────────
function ProductImage({ product, size = 64, className = "" }: { product: FoodProduct; size?: number; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = product.imageUrl || product.thumbnailUrl;

  if (imgSrc && !imgError) {
    return (
      <img
        src={imgSrc}
        alt={product.name}
        className={`object-contain rounded-xl ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback icon
  const Icon = product.meatGrade?.type === "Beef" || product.meatGrade?.type === "Bison" ? Beef
    : product.meatGrade?.type === "Seafood" ? Fish
    : Package;

  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-700 ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon size={size * 0.4} className="text-stone-300 dark:text-stone-500" />
    </div>
  );
}

// ─── Share Button ─────────────────────────────────────────────────────────────
function ShareButton({ productA, productB, scoreA, scoreB, winner }: {
  productA: FoodProduct; productB: FoodProduct;
  scoreA: number; scoreB: number; winner: "A" | "B" | "tie";
}) {
  const [copied, setCopied] = useState(false);

  const text = [
    `🔬 EatVera Product Comparison`,
    ``,
    `🅰 ${productA.name} (${productA.brand}) — Score: ${scoreA}/100`,
    `🅱 ${productB.name} (${productB.brand}) — Score: ${scoreB}/100`,
    ``,
    winner !== "tie"
      ? `✅ Winner: ${winner === "A" ? productA.name : productB.name} (+${Math.abs(scoreA - scoreB)} pts)`
      : `🤝 It's a tie!`,
    ``,
    `Scanned with EatVera — Know what's in your food.`,
  ].join("\n");

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "EatVera Comparison", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Comparison copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleShare}
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
        style={{ background: "linear-gradient(135deg, #0B3D2E, #145A3A)" }}
      >
        <Share2 size={15} />
        Share
      </button>
      <button
        onClick={handleCopy}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all border ${
          copied
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-600"
        }`}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  );
}

// ─── Flag Severity Config ─────────────────────────────────────────────────────
const FLAG_CONFIG: Record<string, { bg: string; border: string; color: string }> = {
  critical: { bg: "#fff5f5", border: "#fca5a5", color: "#dc2626" },
  warning:  { bg: "#fff7ed", border: "#fed7aa", color: "#ea580c" },
  caution:  { bg: "#fffbf0", border: "#fde68a", color: "#d97706" },
  good:     { bg: "#f0faf0", border: "#b8e8b8", color: "#145A3A" },
  excellent:{ bg: "#f0faf0", border: "#86d086", color: "#3FA34D" },
};

// ─── Comparison View ──────────────────────────────────────────────────────────
function ComparisonView({
  productA, productB, analysisA, analysisB,
  onClearA, onClearB,
}: {
  productA: FoodProduct; productB: FoodProduct;
  analysisA: NutritionAnalysis; analysisB: NutritionAnalysis;
  onClearA: () => void; onClearB: () => void;
}) {
  const [showNutrition, setShowNutrition] = useState(true);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showFlags, setShowFlags] = useState(true);

  const winner = analysisA.score > analysisB.score ? "A" : analysisB.score > analysisA.score ? "B" : "tie";
  const scoreDiff = Math.abs(analysisA.score - analysisB.score);

  const allFlagNames = Array.from(new Set([
    ...analysisA.flags.map((f) => f.name),
    ...analysisB.flags.map((f) => f.name),
  ]));

  const nutriRows = COMPARE_NUTRIENTS.filter(
    ({ key }) => productA.nutriments[key] !== undefined || productB.nutriments[key] !== undefined
  );

  return (
    <div className="space-y-4">
      {/* ── Hero Comparison Header ── */}
      <div
        className="rounded-3xl overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #0B3D2E 0%, #145A3A 50%, #1a6b45 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full opacity-10" style={{ background: "white" }} />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-10" style={{ background: "white" }} />
        </div>

        <div className="relative p-4">
          {/* Product A vs Product B */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
            {/* Product A */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div
                  className="rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{ width: 76, height: 76, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
                >
                  <ProductImage product={productA} size={68} />
                </div>
                {winner === "A" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                    <Crown size={12} className="text-yellow-900" />
                  </div>
                )}
                <button
                  onClick={onClearA}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
                >
                  <X size={9} className="text-white" />
                </button>
              </div>
              <ScoreRing score={analysisA.score} color={winner === "A" ? "#FFD700" : "rgba(255,255,255,0.9)"} size={72} />
              <div className="text-center">
                <p className="text-white font-semibold text-xs leading-tight line-clamp-2 text-center">{productA.name}</p>
                <p className="text-white/60 text-[10px] mt-0.5">{productA.brand}</p>
              </div>
            </div>

            {/* VS Divider */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                <span className="text-white font-black text-xs">VS</span>
              </div>
              {winner !== "tie" && (
                <div className="flex flex-col items-center">
                  <div
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,215,0,0.2)", color: "#FFD700" }}
                  >
                    +{scoreDiff}
                  </div>
                </div>
              )}
            </div>

            {/* Product B */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div
                  className="rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{ width: 76, height: 76, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
                >
                  <ProductImage product={productB} size={68} />
                </div>
                {winner === "B" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                    <Crown size={12} className="text-yellow-900" />
                  </div>
                )}
                <button
                  onClick={onClearB}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
                >
                  <X size={9} className="text-white" />
                </button>
              </div>
              <ScoreRing score={analysisB.score} color={winner === "B" ? "#FFD700" : "rgba(255,255,255,0.9)"} size={72} />
              <div className="text-center">
                <p className="text-white font-semibold text-xs leading-tight line-clamp-2 text-center">{productB.name}</p>
                <p className="text-white/60 text-[10px] mt-0.5">{productB.brand}</p>
              </div>
            </div>
          </div>

          {/* Winner Banner */}
          <div className="mt-4 rounded-2xl py-2.5 px-4 text-center" style={{ background: "rgba(255,255,255,0.1)" }}>
            {winner !== "tie" ? (
              <p className="text-white text-xs font-semibold">
                <Crown size={11} className="inline mr-1 text-yellow-400" />
                {winner === "A" ? productA.name : productB.name} wins by{" "}
                <span className="text-yellow-400">{scoreDiff} points</span>
              </p>
            ) : (
              <p className="text-white text-xs font-semibold">🤝 It's a tie! Both score equally.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Share ── */}
      <ShareButton
        productA={productA} productB={productB}
        scoreA={analysisA.score} scoreB={analysisB.score}
        winner={winner}
      />

      {/* ── Nutrition Visual Bars ── */}
      {nutriRows.length > 0 && (
        <div className="bg-card rounded-3xl border border-stone-100 dark:border-stone-700 overflow-hidden">
          <button
            onClick={() => setShowNutrition(!showNutrition)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: "#3FA34D" }} />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">Nutrition Comparison</span>
            </div>
            {showNutrition ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
          </button>

          {showNutrition && (
            <div className="px-4 pb-4 space-y-3">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 pb-1 border-b border-stone-100 dark:border-stone-700">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Nutrient</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold w-16 text-center">A</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold w-16 text-center">B</span>
              </div>

              {nutriRows.map(({ key, label, unit, lowerIsBetter, max }) => {
                const valA = productA.nutriments[key];
                const valB = productB.nutriments[key];
                const hasA = valA !== undefined;
                const hasB = valB !== undefined;
                let aBetter = false;
                let bBetter = false;
                if (hasA && hasB) {
                  if (lowerIsBetter) { aBetter = valA < valB; bBetter = valB < valA; }
                  else { aBetter = valA > valB; bBetter = valB > valA; }
                }
                const maxVal = Math.max(valA || 0, valB || 0, max * 0.1);
                const barA = hasA ? Math.min((valA / maxVal) * 100, 100) : 0;
                const barB = hasB ? Math.min((valB / maxVal) * 100, 100) : 0;
                const colorA = aBetter ? "#3FA34D" : bBetter ? "#dc2626" : "#94a3b8";
                const colorB = bBetter ? "#3FA34D" : aBetter ? "#dc2626" : "#94a3b8";

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">{label}</span>
                      <div className="flex gap-3">
                        <span className="text-xs font-mono font-semibold w-16 text-center" style={{ color: colorA }}>
                          {hasA ? `${formatNutrient(key, valA)}${unit}` : "—"}
                          {aBetter && <span className="ml-0.5 text-[9px]">✓</span>}
                        </span>
                        <span className="text-xs font-mono font-semibold w-16 text-center" style={{ color: colorB }}>
                          {hasB ? `${formatNutrient(key, valB)}${unit}` : "—"}
                          {bBetter && <span className="ml-0.5 text-[9px]">✓</span>}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-700 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barA}%`, background: colorA }} />
                      </div>
                      <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-700 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barB}%`, background: colorB }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Ingredient Flags ── */}
      <div className="bg-card rounded-3xl border border-stone-100 dark:border-stone-700 overflow-hidden">
        <button
          onClick={() => setShowFlags(!showFlags)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: "#d97706" }} />
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">Ingredient Flags</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-500">{allFlagNames.length}</span>
          </div>
          {showFlags ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
        </button>

        {showFlags && (
          <div className="px-3 pb-3 space-y-1.5">
            {/* Column labels */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 pb-1 px-1">
              <span className="text-[10px] text-stone-400 uppercase tracking-widest">Flag</span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest w-8 text-center">A</span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest w-8 text-center">B</span>
            </div>
            {allFlagNames.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-3">No flags detected in either product</p>
            ) : (
              allFlagNames.map((name) => {
                const flagA = analysisA.flags.find((f) => f.name === name);
                const flagB = analysisB.flags.find((f) => f.name === name);
                const severity = (flagA || flagB)!.severity;
                const cfg = FLAG_CONFIG[severity] || FLAG_CONFIG.caution;
                const Icon = severity === "critical" || severity === "warning" ? AlertTriangle
                  : severity === "good" || severity === "excellent" ? CheckCircle
                  : Info;
                return (
                  <div
                    key={name}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl px-3 py-2 border"
                    style={{ background: cfg.bg, borderColor: cfg.border }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon size={11} style={{ color: cfg.color }} />
                      <span className="text-[11px] font-medium" style={{ color: cfg.color }}>{name}</span>
                    </div>
                    <div className="w-8 flex justify-center">
                      {flagA
                        ? <CheckCircle size={14} style={{ color: cfg.color }} />
                        : <div className="w-3.5 h-3.5 rounded-full bg-stone-200 dark:bg-stone-600" />}
                    </div>
                    <div className="w-8 flex justify-center">
                      {flagB
                        ? <CheckCircle size={14} style={{ color: cfg.color }} />
                        : <div className="w-3.5 h-3.5 rounded-full bg-stone-200 dark:bg-stone-600" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Ingredients ── */}
      <div className="bg-card rounded-3xl border border-stone-100 dark:border-stone-700 overflow-hidden">
        <button
          onClick={() => setShowIngredients(!showIngredients)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
        >
          <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">Ingredients</span>
          {showIngredients ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
        </button>
        {showIngredients && (
          <div className="grid grid-cols-2 divide-x divide-stone-100 dark:divide-stone-700 pb-3">
            {[{ product: productA, label: "A", color: analysisA.color }, { product: productB, label: "B", color: analysisB.color }].map(({ product, label, color }) => (
              <div key={label} className="px-3 pt-1">
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color }}>{label}</p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed">
                  {product.ingredients || "No ingredients data available."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-2">
        {[{ analysis: analysisA, label: "A", product: productA }, { analysis: analysisB, label: "B", product: productB }].map(({ analysis, label, product }) => (
          <div
            key={label}
            className="rounded-2xl p-3.5 border"
            style={{ borderColor: `${analysis.color}30`, background: `${analysis.color}08` }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: analysis.color }}>{label}</span>
              <span className="text-[9px] font-semibold" style={{ color: analysis.color }}>{analysis.grade}</span>
            </div>
            <p className="text-[10px] text-stone-600 dark:text-stone-300 leading-relaxed">{analysis.summary}</p>
            <div className="mt-2 space-y-1">
              {analysis.positives.slice(0, 2).map((p, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px] text-stone-500 dark:text-stone-400">
                  <CheckCircle size={9} className="flex-shrink-0 mt-0.5" style={{ color: "#3FA34D" }} />
                  {p}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Product Picker ───────────────────────────────────────────────────────────
function ProductPicker({ slot, onSelect }: { slot: 1 | 2; onSelect: (p: FoodProduct) => void }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) {
      // Show products with images first
      const withImages = ALL_PRODUCTS.filter((p) => p.imageUrl || p.thumbnailUrl).slice(0, 12);
      return withImages;
    }
    const q = query.toLowerCase();
    return ALL_PRODUCTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [query]);

  const slotColor = slot === 1 ? "#145A3A" : "#2563eb";

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 border-b border-stone-100 dark:border-stone-700">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ background: slotColor }}
          >
            {slot === 1 ? "A" : "B"}
          </div>
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
            {slot === 1 ? "Choose Product A" : "Choose Product B"}
          </p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, brand, or category..."
            className="w-full pl-8 pr-8 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-green-400 focus:bg-white dark:focus:bg-stone-700 transition-all"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
              <X size={12} />
            </button>
          )}
        </div>
        {!query && (
          <p className="text-[10px] text-stone-400 mt-1.5 px-1">Showing products with images · search to find more</p>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {results.map((p) => {
          const hasImg = !!(p.imageUrl || p.thumbnailUrl);
          return (
            <button
              key={p.barcode}
              onClick={() => onSelect(p)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-700/60 transition-colors text-left"
            >
              {hasImg ? (
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                  <ProductImage product={p} size={44} />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center flex-shrink-0">
                  <Package size={18} className="text-stone-300 dark:text-stone-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate leading-tight">{p.name}</p>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate">{p.brand}</p>
                <p className="text-[9px] text-stone-300 dark:text-stone-600 truncate">{p.category}</p>
              </div>
            </button>
          );
        })}
        {results.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-stone-400">No products found</p>
            <p className="text-xs text-stone-300 mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CompareProductsPage() {
  const [productA, setProductA] = useState<FoodProduct | null>(() => {
    try {
      const stored = sessionStorage.getItem("eatclean_compare_a");
      if (stored) {
        sessionStorage.removeItem("eatclean_compare_a");
        return JSON.parse(stored) as FoodProduct;
      }
    } catch {}
    return null;
  });
  const [productB, setProductB] = useState<FoodProduct | null>(null);
  const [pickingSlot, setPickingSlot] = useState<1 | 2 | null>(null);

  const analysisA = useMemo(() => {
    if (!productA) return null;
    return productA.meatGrade
      ? analyzeMeatProduct(productA.ingredients, productA.meatGrade)
      : analyzeIngredients(productA.ingredients);
  }, [productA]);

  const analysisB = useMemo(() => {
    if (!productB) return null;
    return productB.meatGrade
      ? analyzeMeatProduct(productB.ingredients, productB.meatGrade)
      : analyzeIngredients(productB.ingredients);
  }, [productB]);

  const handleSelect = (p: FoodProduct) => {
    if (pickingSlot === 1) setProductA(p);
    else if (pickingSlot === 2) setProductB(p);
    setPickingSlot(null);
  };

  const handleSwap = () => {
    const temp = productA;
    setProductA(productB);
    setProductB(temp);
  };

  // Picker modal
  if (pickingSlot !== null) {
    return (
      <div className="ec-page-bg fixed inset-0 z-50 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 dark:border-stone-700 bg-card">
          <button
            onClick={() => setPickingSlot(null)}
            className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          >
            <X size={18} />
          </button>
          <h2 className="font-semibold text-stone-800 dark:text-stone-100 text-sm">
            {pickingSlot === 1 ? "Choose Product A" : "Choose Product B"}
          </h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ProductPicker slot={pickingSlot} onSelect={handleSelect} />
        </div>
      </div>
    );
  }

  return (
    <div className="ec-page-bg pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => { hapticLight(); window.history.back(); }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: "rgba(11,61,46,0.08)", border: "1px solid rgba(11,61,46,0.12)" }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} style={{ color: "#0B3D2E" }} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <ArrowLeftRight size={18} style={{ color: "#3FA34D" }} />
              <h1 className="font-bold text-2xl text-stone-800 dark:text-stone-100" style={{ letterSpacing: "-0.02em" }}>Compare</h1>
            </div>
            <p className="text-stone-400 dark:text-stone-500 text-xs mt-0.5">Side-by-side product analysis</p>
          </div>
        </div>

        {/* Product Selector Cards */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Slot A */}
          <button
            onClick={() => setPickingSlot(1)}
            className="rounded-2xl border-2 transition-all text-left overflow-hidden"
            style={{ borderColor: productA ? (analysisA?.color || "#3FA34D") : "#e7e5e4", borderStyle: productA ? "solid" : "dashed" }}
          >
            {productA && analysisA ? (
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: analysisA.color }}>A</span>
                  <span className="text-[9px] font-semibold" style={{ color: analysisA.color }}>{analysisA.grade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ProductImage product={productA} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 leading-tight line-clamp-2">{productA.name}</p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">{productA.brand}</p>
                  </div>
                </div>
                <div className="mt-2 font-bold font-mono text-xl" style={{ color: analysisA.color }}>{analysisA.score}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-5 gap-2 bg-stone-50 dark:bg-stone-800/50">
                <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                  <Plus size={18} className="text-stone-400 dark:text-stone-500" />
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-500 font-medium">Add Product A</p>
              </div>
            )}
          </button>

          {/* Slot B */}
          <button
            onClick={() => setPickingSlot(2)}
            className="rounded-2xl border-2 transition-all text-left overflow-hidden"
            style={{ borderColor: productB ? (analysisB?.color || "#2563eb") : "#e7e5e4", borderStyle: productB ? "solid" : "dashed" }}
          >
            {productB && analysisB ? (
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: analysisB.color }}>B</span>
                  <span className="text-[9px] font-semibold" style={{ color: analysisB.color }}>{analysisB.grade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ProductImage product={productB} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 leading-tight line-clamp-2">{productB.name}</p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">{productB.brand}</p>
                  </div>
                </div>
                <div className="mt-2 font-bold font-mono text-xl" style={{ color: analysisB.color }}>{analysisB.score}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-5 gap-2 bg-stone-50 dark:bg-stone-800/50">
                <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                  <Plus size={18} className="text-stone-400 dark:text-stone-500" />
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-500 font-medium">Add Product B</p>
              </div>
            )}
          </button>
        </div>

        {/* Swap button */}
        {productA && productB && (
          <button
            onClick={handleSwap}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: "rgba(20,90,58,0.08)", color: "#145A3A", border: "1px solid rgba(20,90,58,0.15)" }}
          >
            <ArrowLeftRight size={13} />
            Swap A ↔ B
          </button>
        )}
      </div>

      {/* Empty state + Suggested comparisons */}
      {(!productA || !productB) && (
        <div className="px-4">
          {/* Suggested comparisons */}
          <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3 px-1">
            Suggested Comparisons
          </p>
          <div className="space-y-2">
            {SUGGESTED_PAIRS.map(({ label, emoji, findA, findB }) => {
              const pA = ALL_PRODUCTS.find(findA);
              const pB = ALL_PRODUCTS.find(findB);
              if (!pA || !pB) return null;
              const aScore = analyzeIngredients(pA.ingredients).score;
              const bScore = analyzeIngredients(pB.ingredients).score;
              const aColor = aScore >= 80 ? "#145A3A" : aScore >= 60 ? "#3FA34D" : aScore >= 40 ? "#d97706" : "#dc2626";
              const bColor = bScore >= 80 ? "#145A3A" : bScore >= 60 ? "#3FA34D" : bScore >= 40 ? "#d97706" : "#dc2626";

              return (
                <button
                  key={label}
                  onClick={() => { setProductA(pA); setProductB(pB); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-card border border-stone-100 dark:border-stone-700 hover:border-stone-200 dark:hover:border-stone-600 transition-all text-left active:scale-98"
                >
                  {/* Product A image */}
                  <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                    <ProductImage product={pA} size={44} />
                  </div>

                  {/* Center info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-200 truncate">{label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono font-bold" style={{ color: aColor }}>{aScore}</span>
                      <span className="text-[9px] text-stone-300">vs</span>
                      <span className="text-[10px] font-mono font-bold" style={{ color: bColor }}>{bScore}</span>
                    </div>
                  </div>

                  {/* Product B image */}
                  <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                    <ProductImage product={pB} size={44} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison results */}
      {productA && productB && analysisA && analysisB && (
        <div className="px-4">
          <ComparisonView
            productA={productA}
            productB={productB}
            analysisA={analysisA}
            analysisB={analysisB}
            onClearA={() => setProductA(null)}
            onClearB={() => setProductB(null)}
          />
          <button
            onClick={() => { setProductA(null); setProductB(null); }}
            className="w-full mt-4 py-2.5 rounded-xl text-xs font-medium transition-all border bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800"
          >
            Clear Comparison
          </button>
        </div>
      )}
    </div>
  );
}
