/**
 * EatVera — Snacks Guide Page
 * Design: Clean, light, organic aesthetic
 * Palette: Warm white #fafaf8, sage green #3d7a3d, amber warning tones
 * Typography: DM Sans (body), DM Mono (scores/data)
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import ProductImage from "@/components/ProductImage";
import {
  ALL_SNACKS,
  SNACK_CATEGORIES,
  SNACK_TIER_CONFIG,
  SNACK_DB_STATS,
  getSnackColor,
  type SnackEntry,
  type SnackCategory,
  type SnackTier,
} from "@/lib/snackDatabase";
import PriceRangeFilter, { type PriceRange, matchesPriceRange, isBestValue } from "@/components/PriceRangeFilter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GuideHero } from "@/components/GuideHero";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Cookie,
  Star,
  ShoppingBag,
  ArrowLeft } from "lucide-react";

// ─── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = getSnackColor(score);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={4}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
      />
      <text
        x={size / 2} y={size / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: `${size / 2}px ${size / 2}px`, fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: size < 50 ? 11 : 14, fill: color }}
      >
        {score}
      </text>
    </svg>
  );
}

// ─── Tier badge ────────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: SnackTier }) {
  const cfg = SNACK_TIER_CONFIG[tier];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {tier === "elite" && <Star size={10} />}
      {tier === "avoid" && <AlertTriangle size={10} />}
      {cfg.label}
    </span>
  );
}

// ─── Snack card ────────────────────────────────────────────────────────────────
function SnackCard({ snack, onClick }: { snack: SnackEntry; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-stone-800 rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-green-200 transition-all duration-200 group"
    >
      <div className="flex items-start gap-3">
        <ProductImage barcode={snack.barcode} name={snack.name} brand={snack.brand} imageUrl={snack.imageUrl} category={snack.category} size={52} />
        <div className="flex-shrink-0 mt-0.5">
          <ScoreRing score={snack.score} size={52} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="font-semibold text-gray-900 dark:text-stone-100 text-sm leading-tight line-clamp-2 group-hover:text-[#145A3A] transition-colors">
                {snack.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{snack.brand}</p>
              {snack.averagePrice !== undefined && (
                <p className="text-xs font-bold mt-0.5" style={{ color: "#145A3A" }}>
                  ${snack.averagePrice.toFixed(2)} <span className="font-normal text-gray-400">est.</span>
                  {isBestValue(snack.score, snack.averagePrice) && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "#dcf4dc", color: "#145A3A" }}>⭐ Best Value</span>
                  )}
                </p>
              )}
            </div>
            <TierBadge tier={snack.tier} />
          </div>
          <p className="text-xs text-gray-400 mb-2">{snack.category}</p>
          {snack.concerns.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {snack.concerns.slice(0, 2).map((c, i) => (
                <span key={i} className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full border border-red-100">
                  ⚠ {c.split(" — ")[0]}
                </span>
              ))}
              {snack.concerns.length > 2 && (
                <span className="text-xs text-gray-400">+{snack.concerns.length - 2} more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Detail modal ──────────────────────────────────────────────────────────────
function SnackModal({ snack, onClose }: { snack: SnackEntry; onClose: () => void }) {
  const cfg = SNACK_TIER_CONFIG[snack.tier];
  const [showNutrition, setShowNutrition] = useState(false);

  const nutrients = [
    { label: "Calories", key: "energy-kcal_100g", unit: "kcal" },
    { label: "Total Fat", key: "fat_100g", unit: "g" },
    { label: "Saturated Fat", key: "saturated-fat_100g", unit: "g" },
    { label: "Trans Fat", key: "trans-fat_100g", unit: "g" },
    { label: "Carbohydrates", key: "carbohydrates_100g", unit: "g" },
    { label: "Sugars", key: "sugars_100g", unit: "g" },
    { label: "Fiber", key: "fiber_100g", unit: "g" },
    { label: "Protein", key: "proteins_100g", unit: "g" },
    { label: "Sodium", key: "sodium_100g", unit: "g" },
  ];

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-800 rounded-3xl">
      {/* Hero Product Image */}
      <div className="w-full h-44 bg-stone-50 dark:bg-stone-700 flex items-center justify-center overflow-hidden rounded-t-3xl">
        <ProductImage barcode={snack.barcode} name={snack.name} brand={snack.brand} imageUrl={snack.imageUrl} category={snack.category} size={160} className="!w-full !h-full !rounded-none" />
      </div>
      <DialogHeader>
        <div className="flex items-start gap-4 mb-2">
          <ScoreRing score={snack.score} size={72} />
          <div className="flex-1">
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-stone-100 leading-tight">
              {snack.name}
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-0.5">{snack.brand}</p>
            <div className="flex items-center gap-2 mt-2">
              <TierBadge tier={snack.tier} />
              <span className="text-xs text-gray-400">{snack.category}</span>
            </div>
          </div>
        </div>
      </DialogHeader>

      {/* Why this score */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: cfg.color }}>
          Why this score
        </p>
        <p className="text-sm text-gray-700">{snack.whyScore}</p>
      </div>

      {/* Concerns */}
      {snack.concerns.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2 flex items-center gap-1">
            <AlertTriangle size={12} /> Concerns ({snack.concerns.length})
          </p>
          <div className="space-y-1.5">
            {snack.concerns.map((c, i) => (
              <div key={i} className="flex items-start gap-2 bg-red-50 rounded-xl px-3 py-2">
                <span className="text-red-400 mt-0.5 flex-shrink-0">⚠</span>
                <p className="text-sm text-red-700">{c}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positives */}
      {snack.positives.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#145A3A] mb-2 flex items-center gap-1">
            <CheckCircle size={12} /> Positives ({snack.positives.length})
          </p>
          <div className="space-y-1.5">
            {snack.positives.map((p, i) => (
              <div key={i} className="flex items-start gap-2 bg-green-50 rounded-xl px-3 py-2">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                <p className="text-sm text-green-800">{p}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients */}
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1">
          <Info size={12} /> Ingredients
        </p>
        <p className="text-sm text-gray-600 bg-gray-50 dark:bg-stone-800 rounded-xl p-3 leading-relaxed font-mono text-xs">
          {snack.ingredients}
        </p>
      </div>

      {/* Certifications */}
      {snack.certifications.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Certifications</p>
          <div className="flex flex-wrap gap-1.5">
            {snack.certifications.map((cert, i) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                ✓ {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition */}
      <div>
        <button
          onClick={() => setShowNutrition(!showNutrition)}
          className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2"
        >
          <span>Nutrition per 100g</span>
          {showNutrition ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showNutrition && (
          <div className="bg-gray-50 dark:bg-stone-800 rounded-xl overflow-hidden">
            {nutrients.filter(n => snack.nutriments[n.key] !== undefined).map((n, i) => (
              <div key={i} className={`flex justify-between px-3 py-2 text-sm ${i % 2 === 0 ? "bg-card" : "bg-muted/30"}`}>
                <span className="text-gray-600">{n.label}</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-stone-100">
                  {snack.nutriments[n.key]?.toFixed(1)}{n.unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Serving size */}
      <p className="text-xs text-gray-400 mt-3 text-center">Serving size: {snack.servingSize}</p>
    </DialogContent>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function SnacksGuidePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SnackCategory | "All">("All");
  const [selectedTier, setSelectedTier] = useState<SnackTier | "All">("All");
  const [selectedSnack, setSelectedSnack] = useState<SnackEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<PriceRange>("all");

  const filtered = useMemo(() => {
    return ALL_SNACKS.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.ingredients.toLowerCase().includes(q);
      const matchCategory = selectedCategory === "All" || s.category === selectedCategory;
      const matchTier = selectedTier === "All" || s.tier === selectedTier;
      const matchPrice = matchesPriceRange(s.averagePrice, priceRange);
      return matchSearch && matchCategory && matchTier && matchPrice;
    });
  }, [search, selectedCategory, selectedTier, priceRange]);

  // Group by category for display
  const grouped = useMemo(() => {
    if (selectedCategory !== "All") {
      return { [selectedCategory]: filtered };
    }
    const groups: Record<string, SnackEntry[]> = {};
    for (const snack of filtered) {
      if (!groups[snack.category]) groups[snack.category] = [];
      groups[snack.category].push(snack);
    }
    return groups;
  }, [filtered, selectedCategory]);

  const tiers: (SnackTier | "All")[] = ["All", "elite", "good", "average", "poor", "avoid"];

  return (
    <div className="ec-page-bg pb-24">
      <GuideHero imageUrl="/manus-storage/snacks_37e2d5ca.jpg" />
      {/* Header */}
      <div className="ec-sticky-header sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setLocation("/explore")}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} className="text-stone-600" />
            </button>
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <Cookie size={18} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-stone-100">Snacks Guide</h1>
              <p className="text-xs text-gray-500">{SNACK_DB_STATS.total} products across {SNACK_DB_STATS.categories} categories</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="ml-auto flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 dark:bg-stone-700 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
            >
              Filter {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search snacks, brands, ingredients..."
              className="pl-9 bg-gray-50 dark:bg-stone-800 border-gray-200 rounded-xl text-sm h-9"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Price range filter */}
          <div className="mt-3">
            <PriceRangeFilter value={priceRange} onChange={setPriceRange} accentColor="#b45309" />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 space-y-2">
              {/* Tier filter */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">Quality Tier</p>
                <div className="flex flex-wrap gap-1.5">
                  {tiers.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`text-xs px-3 py-1 rounded-full border transition-all ${
                        selectedTier === tier
                          ? "bg-green-700 text-white border-green-700"
                          : "bg-white dark:bg-stone-800 text-gray-600 border-gray-200 hover:border-green-300"
                      }`}
                    >
                      {tier === "All" ? "All Tiers" : SNACK_TIER_CONFIG[tier].label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Category filter */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">Category</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className={`text-xs px-3 py-1 rounded-full border transition-all ${
                      selectedCategory === "All"
                        ? "bg-green-700 text-white border-green-700"
                        : "bg-white dark:bg-stone-800 text-gray-600 border-gray-200 hover:border-green-300"
                    }`}
                  >
                    All Categories
                  </button>
                  {SNACK_CATEGORIES.map((cat) => {
                    const count = ALL_SNACKS.filter((s) => s.category === cat).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${
                          selectedCategory === cat
                            ? "bg-green-700 text-white border-green-700"
                            : "bg-white dark:bg-stone-800 text-gray-600 border-gray-200 hover:border-green-300"
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="grid grid-cols-5 gap-2">
          {(["elite", "good", "average", "poor", "avoid"] as SnackTier[]).map((tier) => {
            const cfg = SNACK_TIER_CONFIG[tier];
            const count = ALL_SNACKS.filter((s) => s.tier === tier).length;
            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(selectedTier === tier ? "All" : tier)}
                className="rounded-xl p-2 text-center transition-all hover:scale-105"
                style={{ background: selectedTier === tier ? cfg.bg : "white", border: `1px solid ${selectedTier === tier ? cfg.border : "#e5e7eb"}` }}
              >
                <p className="text-lg font-bold font-mono" style={{ color: cfg.color }}>{count}</p>
                <p className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-2xl mx-auto px-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No snacks found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search or filter</p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, snacks]) => (
            <div key={category} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{category}</h2>
                <span className="text-xs text-gray-400">{snacks.length} products</span>
              </div>
              <div className="space-y-2">
                {snacks
                  .sort((a, b) => b.score - a.score)
                  .map((snack) => (
                    <SnackCard key={snack.id} snack={snack} onClick={() => setSelectedSnack(snack)} />
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selectedSnack} onOpenChange={() => setSelectedSnack(null)}>
        {selectedSnack && <SnackModal snack={selectedSnack} onClose={() => setSelectedSnack(null)} />}
      </Dialog>
    </div>
  );
}
