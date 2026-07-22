/**
 * EatVera — Fruit Guide Page
 * Design: Clean, light, organic — warm whites, sage greens, DM Sans typography
 * Shows all US grocery store fruits with EWG pesticide data, quality tiers, organic toggle
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { GuideHero } from "@/components/GuideHero";
import {
  ALL_FRUITS,
  FRUIT_CATEGORIES,
  FRUIT_QUALITY_TIER_CONFIG,
  FRUIT_DB_STATS,
  getFruitColor,
  getFruitDisplayScore,
  type FruitEntry,
  type FruitQualityTier,
} from "@/lib/fruitDatabase";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Leaf,
  Search,
  ShieldCheck,
  X,
  Info,
  Droplets,
  ArrowLeft } from "lucide-react";

// Fruit emoji map
const FRUIT_EMOJI: Record<string, string> = {
  strawberry: "🍓",
  "spinach-fruit": "🫐",
  raspberries: "🫐",
  blackberries: "🫐",
  cranberries: "🍒",
  acai: "🫐",
  "goji-berries": "🍒",
  oranges: "🍊",
  grapefruit: "🍊",
  lemons: "🍋",
  limes: "🍋",
  clementines: "🍊",
  "blood-orange": "🍊",
  avocado: "🥑",
  mango: "🥭",
  pineapple: "🍍",
  papaya: "🍈",
  banana: "🍌",
  kiwi: "🥝",
  coconut: "🥥",
  guava: "🍈",
  "dragon-fruit": "🐉",
  "passion-fruit": "🍈",
  peaches: "🍑",
  nectarines: "🍑",
  cherries: "🍒",
  plums: "🍑",
  apricots: "🍑",
  apples: "🍎",
  pears: "🍐",
  quince: "🍐",
  watermelon: "🍉",
  cantaloupe: "🍈",
  honeydew: "🍈",
  "grapes-red": "🍇",
  "grapes-green": "🍇",
  "medjool-dates": "🌴",
  raisins: "🍇",
  "dried-apricots": "🍑",
  prunes: "🫐",
  "dried-cranberries": "🍒",
  "canned-peaches": "🥫",
  "canned-pineapple": "🥫",
  "frozen-mixed-berries": "🧊",
  "fruit-cups": "🥤",
  applesauce: "🥫",
  pomegranate: "🍎",
  fig: "🍈",
  lychee: "🍒",
  starfruit: "⭐",
  jackfruit: "🍈",
  durian: "🌵",
  persimmon: "🍊",
  tamarind: "🌿",
  kumquat: "🍊",
};

function ScoreRing({ score, color, size = 52 }: { score: number; color: string; size?: number }) {
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

function EWGBadge({ status }: { status: FruitEntry["ewgStatus"] }) {
  if (status === "dirty-dozen") {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#fee2e2", color: "#dc2626" }}>
        ⚠ Dirty Dozen
      </span>
    );
  }
  if (status === "clean-fifteen") {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#f0faf0", color: "#145A3A" }}>
        ✓ Clean 15
      </span>
    );
  }
  return null;
}

function FruitCard({ entry, organic, onSelect }: { entry: FruitEntry; organic: boolean; onSelect: (e: FruitEntry) => void }) {
  const score = getFruitDisplayScore(entry, organic);
  const color = getFruitColor(score);
  const tier = FRUIT_QUALITY_TIER_CONFIG[entry.qualityTier];
  const emoji = FRUIT_EMOJI[entry.id] || "🍎";

  return (
    <button
      onClick={() => onSelect(entry)}
      className="w-full text-left rounded-2xl border bg-white dark:bg-stone-800 dark:bg-stone-800 p-3.5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
      style={{ borderColor: "#e7e5e4" }}
    >
      <div className="flex items-start gap-3">
        {/* Image + Score */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden"
            style={{ background: "#f5f5f4" }}>
            {entry.imageUrl ? (
              <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" loading="eager" />
            ) : (
              emoji
            )}
          </div>
          <ScoreRing score={score} color={color} size={40} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="font-semibold text-stone-800 dark:text-stone-100 dark:text-stone-100 text-sm leading-tight">{entry.name}</p>
              <p className="text-stone-400 dark:text-stone-500 dark:text-stone-400 text-xs mt-0.5">{entry.category}</p>
            </div>
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
              style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}
            >
              {tier.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 mt-1.5">
            <EWGBadge status={entry.ewgStatus} />
            {entry.organicAvailable && organic && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#f0faf0", color: "#145A3A" }}>
                Organic Available
              </span>
            )}
            {entry.nutritionHighlights.slice(0, 1).map((h) => (
              <span key={h} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium text-stone-500" style={{ background: "#f5f5f4" }}>
                {h}
              </span>
            ))}
          </div>

          <p className="text-xs text-stone-400 mt-1.5 line-clamp-1">{entry.buyTip.split(".")[0]}.</p>
        </div>
      </div>
    </button>
  );
}

function FruitDetailModal({ entry, organic, onClose }: { entry: FruitEntry; organic: boolean; onClose: () => void }) {
  const score = getFruitDisplayScore(entry, organic);
  const color = getFruitColor(score);
  const tier = FRUIT_QUALITY_TIER_CONFIG[entry.qualityTier];
  const emoji = FRUIT_EMOJI[entry.id] || "🍎";
  const [showNutrition, setShowNutrition] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-stone-800"
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden" style={{ background: "#f5f5f4" }}>
            {entry.imageUrl ? (
              <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" loading="eager" />
            ) : (
              emoji
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100 text-base leading-tight">{entry.name}</h2>
            <p className="text-stone-400 dark:text-stone-500 dark:text-stone-400 text-xs mt-0.5">{entry.category} · {entry.season}</p>
          </div>
          <div className="flex flex-col items-center gap-1 mr-2">
            <ScoreRing score={score} color={color} size={48} />
            <span className="text-[9px] text-stone-400">{organic ? "organic" : "conventional"}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Tier + EWG status */}
          <div className="rounded-2xl p-4" style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: tier.color, color: "white" }}>
                {tier.label}
              </span>
              <EWGBadge status={entry.ewgStatus} />
              {entry.ewgRank && (
                <span className="text-[10px] font-semibold text-stone-500">EWG Rank #{entry.ewgRank}</span>
              )}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: tier.color }}>
              {organic
                ? `Organic score: ${entry.organicScore}/100. ${entry.organicAvailable ? "Organic is widely available." : "Organic may be harder to find."}`
                : `Conventional score: ${entry.conventionalScore}/100. ${entry.ewgStatus === "dirty-dozen" ? "This fruit is on the EWG Dirty Dozen — buy organic." : entry.ewgStatus === "clean-fifteen" ? "This fruit is on the EWG Clean Fifteen — conventional is safe." : "Moderate pesticide concern."}`}
            </p>
          </div>

          {/* Pesticide info */}
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Pesticide Info</p>
            <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: entry.ewgStatus === "dirty-dozen" ? "#fff5f5" : "#f0faf0", border: `1px solid ${entry.ewgStatus === "dirty-dozen" ? "#fca5a5" : "#b8e8b8"}` }}>
              <AlertTriangle size={12} style={{ color: entry.ewgStatus === "dirty-dozen" ? "#dc2626" : "#0B3D2E" }} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed" style={{ color: entry.ewgStatus === "dirty-dozen" ? "#dc2626" : "#145A3A" }}>
                {entry.pesticides}
              </p>
            </div>
          </div>

          {/* Buy tip */}
          <div className="rounded-2xl p-3" style={{ background: "#f0faf0", border: "1px solid #b8e8b8" }}>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={12} style={{ color: "#0B3D2E" }} />
              <span className="text-xs font-semibold text-stone-700">Buy Tip</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{entry.buyTip}</p>
          </div>

          {/* Benefits */}
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Health Benefits</p>
            <div className="space-y-1.5">
              {entry.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-300">
                  <CheckCircle size={11} style={{ color: "#0B3D2E" }} className="flex-shrink-0 mt-0.5" />
                  {b}
                </div>
              ))}
            </div>
          </div>

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

          {/* Nutrition highlights */}
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Nutrition Highlights</p>
            <div className="flex flex-wrap gap-1.5">
              {entry.nutritionHighlights.map((h) => (
                <span key={h} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "#f0faf0", color: "#145A3A", border: "1px solid #b8e8b8" }}>
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Nutrition facts toggle */}
          <div>
            <button
              onClick={() => setShowNutrition(!showNutrition)}
              className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2 hover:text-stone-700 transition-colors"
            >
              Nutrition Facts (per 100g)
              {showNutrition ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showNutrition && (
              <div className="rounded-xl overflow-hidden border border-stone-100">
                {[
                  ["Calories", entry.nutrients.calories, "kcal"],
                  ["Carbohydrates", entry.nutrients.carbs, "g"],
                  ["Fiber", entry.nutrients.fiber, "g"],
                  ["Sugar", entry.nutrients.sugar, "g"],
                  ["Protein", entry.nutrients.protein, "g"],
                  ["Vitamin C", entry.nutrients.vitaminC, "mg"],
                  ["Potassium", entry.nutrients.potassium, "mg"],
                ].map(([label, val, unit], i) => {
                  if (val === undefined || val === null) return null;
                  return (
                    <div key={String(label)} className={`flex justify-between px-3 py-2 text-xs ${i % 2 === 0 ? "bg-card" : "bg-muted/30"}`}>
                      <span className="text-stone-500">{label}</span>
                      <span className="font-semibold text-stone-700 font-mono">{val}{unit}</span>
                    </div>
                  );
                })}
                {entry.nutrients.antioxidants && (
                  <div className="px-3 py-2 text-xs bg-white dark:bg-stone-800">
                    <span className="text-stone-500">Key Antioxidants</span>
                    <p className="text-stone-600 font-medium mt-0.5">{entry.nutrients.antioxidants}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sourcing */}
          <div className="flex items-start gap-2 text-xs text-stone-500 dark:text-stone-400">
            <Leaf size={12} style={{ color: "#0B3D2E" }} className="flex-shrink-0 mt-0.5" />
            <p><span className="font-semibold">Origin:</span> {entry.origin}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FruitGuidePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTier, setActiveTier] = useState<string>("all");
  const [organic, setOrganic] = useState(false);
  const [sortBy, setSortBy] = useState<"score" | "name" | "tier">("score");
  const [selectedEntry, setSelectedEntry] = useState<FruitEntry | null>(null);
  const [showEWGInfo, setShowEWGInfo] = useState(false);

  const TIER_FILTERS = [
    { id: "all", label: "All" },
    { id: "excellent", label: "Excellent" },
    { id: "good", label: "Good" },
    { id: "caution", label: "Buy Organic" },
    { id: "avoid", label: "Avoid Conv." },
  ];

  const filtered = useMemo(() => {
    let list = ALL_FRUITS;

    if (activeCategory !== "all") {
      list = list.filter((f) => f.category === activeCategory);
    }

    if (activeTier !== "all") {
      list = list.filter((f) => f.qualityTier === activeTier);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.nutritionHighlights.some((h) => h.toLowerCase().includes(q)) ||
          f.benefits.some((b) => b.toLowerCase().includes(q))
      );
    }

    if (sortBy === "score") {
      list = [...list].sort((a, b) => getFruitDisplayScore(b, organic) - getFruitDisplayScore(a, organic));
    } else if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "tier") {
      const tierOrder: Record<string, number> = { excellent: 0, good: 1, caution: 2, avoid: 3 };
      list = [...list].sort((a, b) => tierOrder[a.qualityTier] - tierOrder[b.qualityTier]);
    }

    return list;
  }, [search, activeCategory, activeTier, sortBy, organic]);

  return (
    <div className="ec-page-bg pb-24">
      <GuideHero imageUrl="/manus-storage/fruits_v2_8701e70b.jpg" />
      {/* Header */}
      <div className="sticky top-0 z-10 ec-sticky-header backdrop-blur">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <button
              onClick={() => setLocation("/explore")}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 transition-colors flex-shrink-0 mr-1"
            >
              <ArrowLeft size={18} className="text-stone-600" />
            </button>
            <h1 className="font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100 dark:text-stone-100 text-lg leading-tight">Fruit Guide</h1>
              <p className="text-stone-400 dark:text-stone-500 dark:text-stone-400 text-xs">{ALL_FRUITS.length} fruits · EWG pesticide data</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Organic toggle */}
              <button
                onClick={() => setOrganic(!organic)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={organic
                  ? { background: "#0B3D2E", color: "white" }
                  : { background: "#f5f5f4", color: "#78716c", border: "1px solid #e7e5e4" }
                }
              >
                <Leaf size={11} />
                {organic ? "Organic" : "Conventional"}
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "score" | "name" | "tier")}
                className="text-xs text-stone-600 dark:text-stone-300 bg-stone-100 rounded-lg px-2 py-1.5 border-none outline-none"
              >
                <option value="score">Score</option>
                <option value="tier">Tier</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search fruits, nutrients, benefits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:bg-stone-800 text-stone-700 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-green-400 dark:focus:border-green-600 focus:bg-white dark:bg-stone-800 dark:focus:bg-stone-700 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {FRUIT_CATEGORIES.map((cat) => (
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

        {/* Tier filter */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {TIER_FILTERS.map((t) => {
            const config = t.id !== "all" ? FRUIT_QUALITY_TIER_CONFIG[t.id as FruitQualityTier] : null;
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

      {/* EWG Info Banner */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => setShowEWGInfo(!showEWGInfo)}
          className="w-full rounded-2xl p-3.5 text-left transition-all"
          style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info size={14} style={{ color: "#d97706" }} />
              <span className="text-xs font-semibold text-orange-800">EWG Dirty Dozen & Clean Fifteen</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#fee2e2", color: "#dc2626" }}>
                {FRUIT_DB_STATS.dirtyDozen} fruits
              </span>
            </div>
            {showEWGInfo ? <ChevronUp size={14} className="text-orange-600" /> : <ChevronDown size={14} className="text-orange-600" />}
          </div>
          {showEWGInfo && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-orange-700 leading-relaxed">
                The <strong>Environmental Working Group (EWG)</strong> tests thousands of produce samples annually for pesticide residues. The <strong>Dirty Dozen</strong> are the 12 most contaminated fruits and vegetables — always buy organic. The <strong>Clean Fifteen</strong> have the lowest pesticide loads — conventional is safe.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="rounded-xl p-2.5" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
                  <p className="text-[9px] font-bold text-red-700 uppercase tracking-wide mb-1">⚠ Dirty Dozen (Buy Organic)</p>
                  <p className="text-[10px] text-red-600">Strawberries, Spinach, Kale, Peaches, Pears, Nectarines, Apples, Grapes, Bell Peppers, Cherries, Blueberries, Green Beans</p>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: "#f0faf0", border: "1px solid #b8e8b8" }}>
                  <p className="text-[9px] font-bold text-[#145A3A] uppercase tracking-wide mb-1">✓ Clean Fifteen (Conventional OK)</p>
                  <p className="text-[10px] text-[#0B3D2E]">Avocados, Sweet Corn, Pineapple, Onions, Papaya, Frozen Peas, Asparagus, Honeydew, Kiwi, Cabbage, Mushrooms, Mangoes, Sweet Potatoes, Watermelon, Carrots</p>
                </div>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 px-4 py-3">
        {[
          { label: "Total", value: FRUIT_DB_STATS.total, color: "#0B3D2E" },
          { label: "Excellent", value: FRUIT_DB_STATS.excellent, color: "#145A3A" },
          { label: "Buy Organic", value: FRUIT_DB_STATS.caution + FRUIT_DB_STATS.avoid, color: "#d97706" },
          { label: "Clean 15", value: FRUIT_DB_STATS.cleanFifteen, color: "#0B3D2E" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-2.5 text-center bg-white dark:bg-stone-800 border border-stone-100">
            <div className="font-bold text-base font-mono" style={{ color }}>{value}</div>
            <div className="text-[9px] text-stone-400 font-semibold uppercase tracking-wide mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Organic toggle explanation */}
      <div className="px-4 mb-3">
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: organic ? "#f0faf0" : "#f5f5f4", border: `1px solid ${organic ? "#b8e8b8" : "#e7e5e4"}` }}>
          <Droplets size={12} style={{ color: organic ? "#0B3D2E" : "#78716c" }} />
          <p className="text-xs" style={{ color: organic ? "#145A3A" : "#78716c" }}>
            {organic
              ? "Showing organic scores — pesticide concerns eliminated. Tap any fruit for details."
              : "Showing conventional scores. Tap the 'Conventional' button above to see organic scores."}
          </p>
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 mb-3">
        <p className="text-xs text-stone-400">
          Showing <span className="font-semibold text-stone-600">{filtered.length}</span> fruits
          {search && <> matching "<span className="font-semibold text-stone-600">{search}</span>"</>}
        </p>
      </div>

      {/* Fruit Grid */}
      <div className="px-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-3">🍎</span>
            <p className="text-stone-400 dark:text-stone-500 text-sm font-medium">No fruits found</p>
            <p className="text-stone-300 text-xs mt-1">Try a different search or category</p>
          </div>
        ) : (
          filtered.map((entry) => (
            <FruitCard key={entry.id} entry={entry} organic={organic} onSelect={setSelectedEntry} />
          ))
        )}
      </div>

      {/* Bottom info */}
      <div className="px-4 mt-8 pb-4">
        <div className="rounded-2xl p-4" style={{ background: "#f0faf0", border: "1px solid #b8e8b8" }}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} style={{ color: "#0B3D2E" }} />
            <span className="text-xs font-semibold text-stone-700">About Our Fruit Ratings</span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Scores are based on EWG pesticide residue data (2024 Dirty Dozen/Clean Fifteen), USDA Pesticide Data Program findings, nutritional density, antioxidant content, and farming practices. Organic scores assume certified USDA organic. Conventional scores reflect typical grocery store produce.
          </p>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <FruitDetailModal entry={selectedEntry} organic={organic} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}
