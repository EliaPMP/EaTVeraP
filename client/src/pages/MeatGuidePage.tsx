/**
 * EatVera — Meat Guide Page
 * Design: Clean, light, organic — warm whites, sage greens, DM Sans typography
 * Shows all US grocery store meat brands with quality tiers, sourcing info, and ratings
 */

import ProductImage from "@/components/ProductImage";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import PriceRangeFilter, { type PriceRange, matchesPriceRange, isBestValue } from "@/components/PriceRangeFilter";
import { GuideHero } from "@/components/GuideHero";
import {
  ALL_MEAT_BRANDS,
  MEAT_CATEGORIES,
  QUALITY_TIER_CONFIG,
  getMeatScore,
  getMeatColor,
  type MeatBrandEntry,
} from "@/lib/meatDatabase";
import {
  AlertTriangle,
  Award,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Leaf,
  Search,
  ShieldCheck,
  X,
  ArrowLeft } from "lucide-react";

interface MeatCardProps {
  entry: MeatBrandEntry;
  onSelect: (entry: MeatBrandEntry) => void;
}

function ScoreRing({ score, color, size = 48 }: { score: number; color: string; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e7e5e4" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="font-bold leading-none" style={{ color, fontSize: size * 0.28 }}>{score}</div>
      </div>
    </div>
  );
}

function MeatCard({ entry, onSelect }: MeatCardProps) {
  const score = getMeatScore(entry);
  const color = getMeatColor(entry);
  const tier = QUALITY_TIER_CONFIG[entry.qualityTier];

  return (
    <button
      onClick={() => onSelect(entry)}
      className="w-full text-left rounded-2xl border bg-white dark:bg-stone-800 p-3.5 hover:shadow-md dark:hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
      style={{ borderColor: "#e7e5e4" }}
    >
      <div className="flex items-start gap-3">
        <ProductImage barcode={entry.barcode} name={entry.name} brand={entry.brand} imageUrl={entry.imageUrl} category="Meat" size={52} />
        <ScoreRing score={score} color={color} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm leading-tight line-clamp-2">{entry.name}</p>
              <p className="text-stone-400 dark:text-stone-500 text-xs mt-0.5">{entry.brand}</p>
              {entry.averagePrice !== undefined && (
                <p className="text-xs font-bold mt-0.5" style={{ color: "#145A3A" }}>
                  ${entry.averagePrice.toFixed(2)} <span className="font-normal text-stone-400">est.</span>
                  {isBestValue(getMeatScore(entry), entry.averagePrice) && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "#dcf4dc", color: "#145A3A" }}>⭐ Best Value</span>
                  )}
                </p>
              )}
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
              style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}
            >
              {tier.label}
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mb-2">{entry.sourcing}</p>
          <div className="flex flex-wrap gap-1">
            {entry.labels?.slice(0, 3).map((l) => (
              <span key={l} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: "#f0faf0", color: "#145A3A" }}>
                {l.replace(/-/g, " ")}
              </span>
            ))}
            {entry.concerns.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: "#fff7ed", color: "#ea580c" }}>
                {entry.concerns.length} concern{entry.concerns.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function MeatDetailModal({ entry, onClose }: { entry: MeatBrandEntry; onClose: () => void }) {
  const score = getMeatScore(entry);
  const color = getMeatColor(entry);
  const tier = QUALITY_TIER_CONFIG[entry.qualityTier];
  const [showNutrition, setShowNutrition] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white"
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {/* Hero Product Image */}
        <div className="w-full h-44 bg-stone-50 flex items-center justify-center overflow-hidden">
          <ProductImage barcode={entry.barcode} name={entry.name} brand={entry.brand} imageUrl={entry.imageUrl} category="Meat" size={160} className="!w-full !h-full !rounded-none" />
        </div>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
          <ScoreRing score={score} color={color} size={56} />
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-stone-800 text-base leading-tight">{entry.name}</h2>
            <p className="text-stone-400 text-xs mt-0.5">{entry.brand} · {entry.category}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Tier badge + why score */}
          <div className="rounded-2xl p-4" style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: tier.color, color: "white" }}>
                {tier.label} Quality
              </span>
              <span className="text-xs font-bold font-mono-data" style={{ color }}>Score: {score}/100</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: tier.color }}>{entry.whyScore}</p>
          </div>

          {/* Force of Nature badge */}
          {entry.brand === "Force of Nature" && (
            <div className="rounded-2xl p-3 flex items-center gap-2" style={{ background: "#f0faf0", border: "1px solid #86d086" }}>
              <Award size={16} style={{ color: "#145A3A" }} />
              <span className="text-xs font-semibold text-stone-700">Force of Nature — Top Rated Regenerative Brand</span>
            </div>
          )}

          {/* Sourcing */}
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Sourcing</p>
            <div className="flex items-start gap-2 text-sm text-stone-700">
              <Leaf size={14} style={{ color: "#0B3D2E" }} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{entry.sourcing}</p>
            </div>
          </div>

          {/* Labels */}
          {entry.labels && entry.labels.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Certifications & Attributes</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.labels.map((l) => (
                  <span key={l} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "#f0faf0", color: "#145A3A", border: "1px solid #b8e8b8" }}>
                    ✓ {l.replace(/-/g, " ").toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meat quality notes */}
          {entry.meatGrade?.qualityNotes && entry.meatGrade.qualityNotes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Quality Notes</p>
              <div className="space-y-1.5">
                {entry.meatGrade.qualityNotes.map((note, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                    <CheckCircle size={11} style={{ color: "#0B3D2E" }} className="flex-shrink-0 mt-0.5" />
                    {note}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concerns */}
          {entry.concerns.length > 0 && (
            <div className="rounded-2xl p-3" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-widest mb-2">Concerns</p>
              <div className="space-y-1.5">
                {entry.concerns.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-orange-700">
                    <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
                    {c}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients */}
          {entry.ingredients && (
            <div>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-2">Ingredients</p>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-mono bg-stone-50 dark:bg-stone-700 rounded-xl p-3">{entry.ingredients}</p>
            </div>
          )}

          {/* Nutrition toggle */}
          {Object.keys(entry.nutriments).length > 0 && (
            <div>
              <button
                onClick={() => setShowNutrition(!showNutrition)}
                className="flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-2 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
              >
                Nutrition Facts (per 100g)
                {showNutrition ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showNutrition && (
                <div className="rounded-xl overflow-hidden border border-stone-100 dark:border-stone-700">
                  {Object.entries(entry.nutriments).map(([key, val], i) => {
                    if (val === undefined) return null;
                    const label = key.replace(/_100g$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                    const display = typeof val === "number"
                      ? val > 1 ? `${val.toFixed(1)}g` : `${(val * 1000).toFixed(1)}mg`
                      : val;
                    return (
                      <div key={key} className={`flex justify-between px-3 py-2 text-xs ${i % 2 === 0 ? "bg-card dark:bg-stone-700" : "bg-muted/30 dark:bg-stone-800/50"}`}>
                        <span className="text-stone-500 dark:text-stone-400">{label}</span>
                        <span className="font-semibold text-stone-700 dark:text-stone-300 font-mono">{display}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MeatGuidePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTier, setActiveTier] = useState<string>("all");
  const [selectedEntry, setSelectedEntry] = useState<MeatBrandEntry | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "name" | "tier">("score");
  const [priceRange, setPriceRange] = useState<PriceRange>("all");

  const TIER_FILTERS = [
    { id: "all", label: "All" },
    { id: "elite", label: "Elite" },
    { id: "premium", label: "Premium" },
    { id: "good", label: "Good" },
    { id: "average", label: "Average" },
    { id: "poor", label: "Poor/Avoid" },
  ];

  const filtered = useMemo(() => {
    let list = ALL_MEAT_BRANDS;

    // Category filter
    if (activeCategory !== "all") {
      const catMap: Record<string, string[]> = {
        beef: ["Beef", "Ground Beef", "Processed Beef", "American Wagyu Beef", "Wagyu Beef"],
        chicken: ["Chicken", "Chicken Breast", "Whole Chicken", "Processed Chicken", "Eggs"],
        pork: ["Pork", "Bacon", "Ground Pork", "Deli Pepperoni"],
        turkey: ["Turkey", "Turkey Breast", "Whole Turkey", "Ground Turkey", "Deli Turkey"],
        lamb: ["Lamb", "Ground Lamb", "Lamb Chops", "Lamb Rack"],
        bison: ["Bison", "Ground Bison"],
        seafood: ["Seafood", "Wild Salmon", "Farmed Salmon", "Canned Tuna", "Wild Shrimp", "Farmed Shrimp"],
        deli: ["Deli Turkey", "Deli Ham", "Deli Pepperoni"],
        specialty: ["American Wagyu Beef", "Wagyu Beef", "Butter"],
      };
      const cats = catMap[activeCategory] || [];
      list = list.filter((e) => cats.includes(e.category));
    }

    // Tier filter
    if (activeTier !== "all") {
      if (activeTier === "poor") {
        list = list.filter((e) => e.qualityTier === "poor" || e.qualityTier === "avoid");
      } else {
        list = list.filter((e) => e.qualityTier === activeTier);
      }
    }

    // Price filter
    list = list.filter((e) => matchesPriceRange(e.averagePrice, priceRange));

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.brand.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.sourcing.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === "score") list = [...list].sort((a, b) => getMeatScore(b) - getMeatScore(a));
    else if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "tier") {
      const tierOrder = { elite: 0, premium: 1, good: 2, average: 3, poor: 4, avoid: 5 };
      list = [...list].sort((a, b) => tierOrder[a.qualityTier] - tierOrder[b.qualityTier]);
    }

    return list;
  }, [search, activeCategory, activeTier, sortBy, priceRange]);

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_MEAT_BRANDS.forEach((e) => {
      counts[e.qualityTier] = (counts[e.qualityTier] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="ec-page-bg pb-24">
      <GuideHero imageUrl="/manus-storage/meats_v2_c0fc2ecd.jpg" />
      {/* Header */}
      <div className="sticky top-0 z-10 ec-sticky-header backdrop-blur">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLocation("/explore")}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 transition-colors flex-shrink-0"
                >
                  <ArrowLeft size={18} className="text-stone-600" />
                </button>
                <h1 className="font-bold text-stone-800 dark:text-stone-100 text-lg leading-tight">Meat Guide</h1>
              </div>
              <p className="text-stone-400 dark:text-stone-500 text-xs">{ALL_MEAT_BRANDS.length} products across {MEAT_CATEGORIES.length - 1} categories</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-stone-400 dark:text-stone-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "score" | "name" | "tier")}
                className="text-xs text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-700 rounded-lg px-2 py-1.5 border-none outline-none"
              >
                <option value="score">Sort: Score</option>
                <option value="tier">Sort: Tier</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
            <input
              type="text"
              placeholder="Search brands, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-green-400 dark:focus:border-green-600 focus:bg-white dark:focus:bg-stone-700 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-400">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {MEAT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                style={
                  activeCategory === cat.id
                    ? { background: "#0B3D2E", color: "white" }
                    : { background: "#f5f5f4", color: "#78716c" }
                }
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price range filter */}
        <div className="px-4 pb-2">
          <PriceRangeFilter value={priceRange} onChange={setPriceRange} accentColor="#0B3D2E" />
        </div>

        {/* Tier filter */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {TIER_FILTERS.map((t) => {
            const config = t.id !== "all" ? QUALITY_TIER_CONFIG[t.id === "poor" ? "poor" : (t.id as keyof typeof QUALITY_TIER_CONFIG)] : null;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTier(t.id)}
                className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full font-semibold transition-all"
                style={
                  activeTier === t.id
                    ? { background: config?.color || "#1c1917", color: "white" }
                    : { background: config?.bg || "#f5f5f4", color: config?.color || "#78716c", border: `1px solid ${config?.border || "#e7e5e4"}` }
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quality Tier Legend */}
      <div className="px-4 pt-4 pb-3">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(QUALITY_TIER_CONFIG).map(([key, cfg]) => (
            <div key={key} className="rounded-xl p-2.5 text-center" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="font-bold text-sm font-mono" style={{ color: cfg.color }}>{cfg.score}</div>
              <div className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: cfg.color }}>{cfg.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 mb-3">
        <p className="text-xs text-stone-400">
          Showing <span className="font-semibold text-stone-600">{filtered.length}</span> products
          {search && <> matching "<span className="font-semibold text-stone-600">{search}</span>"</>}
        </p>
      </div>

      {/* Product Grid */}
      <div className="px-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search size={32} className="text-stone-300 mx-auto mb-3" />
            <p className="text-stone-400 text-sm font-medium">No products found</p>
            <p className="text-stone-300 text-xs mt-1">Try a different search or category</p>
          </div>
        ) : (
          filtered.map((entry) => (
            <MeatCard key={entry.barcode} entry={entry} onSelect={setSelectedEntry} />
          ))
        )}
      </div>

      {/* Bottom info */}
      <div className="px-4 mt-8 pb-4">
        <div className="rounded-2xl p-4" style={{ background: "#f0faf0", border: "1px solid #b8e8b8" }}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} style={{ color: "#0B3D2E" }} />
            <span className="text-xs font-semibold text-stone-700">About Our Ratings</span>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            Scores are based on sourcing transparency, antibiotic and hormone use policies, ingredient cleanliness, processing level (NOVA 1-4), animal welfare certifications, and third-party certifications (USDA Organic, American Grassfed, Animal Welfare Approved). Data sourced from USDA, brand websites, Consumer Reports, and peer-reviewed research.
          </p>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <MeatDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}
