/**
 * EatVera — Condiments & Oils Guide Page
 * Design: Clean, light, organic aesthetic
 * Colors: Warm white bg, sage green accents, amber warnings for seed oils
 */
import ProductImage from "@/components/ProductImage";
import { useLocation } from "wouter";
import { useState } from "react";
import PriceRangeFilter, { type PriceRange, matchesPriceRange, isBestValue } from "@/components/PriceRangeFilter";
import {
  ALL_CONDIMENTS,
  CONDIMENT_CATEGORIES,
  CONDIMENT_QUALITY_TIER_CONFIG,
  getCondimentColor,
  type CondimentEntry,
  type CondimentQualityTier,
} from "@/lib/condimentsDatabase";
import { X, ChevronDown, ChevronUp, Flame, AlertTriangle, CheckCircle, Info, Droplets , ArrowLeft } from "lucide-react";
import { GuideHero } from "@/components/GuideHero";

const TIER_ORDER: CondimentQualityTier[] = ["elite", "good", "average", "poor", "avoid"];

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const color = getCondimentColor(score);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f5f5f4" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize={size * 0.22} fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
}

function CondimentCard({ item, onClick }: { item: CondimentEntry; onClick: () => void }) {
  const tier = CONDIMENT_QUALITY_TIER_CONFIG[item.qualityTier];
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm border border-stone-100 hover:shadow-md hover:border-green-200 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <ProductImage barcode={item.barcode} name={item.name} brand={item.brand} imageUrl={item.imageUrl} category="Condiment" size={52} />
        <ScoreRing score={item.score} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-stone-800 dark:text-stone-100 dark:text-stone-100 text-sm leading-tight line-clamp-2">{item.name}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{item.brand}</p>
              {item.averagePrice !== undefined && (
                <p className="text-xs font-bold mt-0.5" style={{ color: "#145A3A" }}>
                  ${item.averagePrice.toFixed(2)} <span className="font-normal text-stone-400">est.</span>
                  {isBestValue(item.score, item.averagePrice) && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "#dcf4dc", color: "#145A3A" }}>⭐ Best Value</span>
                  )}
                </p>
              )}
            </div>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ color: tier.color, backgroundColor: tier.bg, border: `1px solid ${tier.border}` }}
            >
              {tier.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {item.hasSeedOils && (
              <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5">⚠ Seed Oils</span>
            )}
            {item.hasHFCS && (
              <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5">⚠ HFCS</span>
            )}
            {!item.hasSeedOils && !item.hasHFCS && (
              <span className="text-xs bg-green-50 text-[#145A3A] border border-green-200 rounded-full px-2 py-0.5">✓ Clean</span>
            )}
            {item.organic && (
              <span className="text-xs bg-lime-50 text-lime-700 border border-lime-200 rounded-full px-2 py-0.5">✓ Organic</span>
            )}
            {item.coldPressed && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">Cold-Pressed</span>
            )}
            {item.smokePoint && (
              <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5">🔥 {item.smokePoint}°F</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function CondimentModal({ item, onClose }: { item: CondimentEntry; onClose: () => void }) {
  const tier = CONDIMENT_QUALITY_TIER_CONFIG[item.qualityTier];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Product Image */}
        <div className="w-full h-44 bg-stone-50 flex items-center justify-center overflow-hidden">
          <ProductImage barcode={item.barcode} name={item.name} brand={item.brand} imageUrl={item.imageUrl} category="Condiment" size={160} className="!w-full !h-full !rounded-none" />
        </div>
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-start gap-4">
          <ScoreRing score={item.score} size={72} />
          <div className="flex-1">
            <h3 className="font-bold text-stone-900 text-lg leading-tight">{item.name}</h3>
            <p className="text-stone-500 text-sm mt-0.5">{item.brand} · {item.category}</p>
            <span
              className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ color: tier.color, backgroundColor: tier.bg, border: `1px solid ${tier.border}` }}
            >
              {tier.label} Quality
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
            <X size={18} className="text-stone-400 dark:text-stone-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Key Flags */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Seed Oils", value: !item.hasSeedOils, trueLabel: "No Seed Oils", falseLabel: "Contains Seed Oils" },
              { label: "HFCS", value: !item.hasHFCS, trueLabel: "No HFCS", falseLabel: "Contains HFCS" },
              { label: "Organic", value: item.organic, trueLabel: "USDA Organic", falseLabel: "Not Organic" },
              { label: "Non-GMO", value: item.nonGMO, trueLabel: "Non-GMO", falseLabel: "GMO Risk" },
              { label: "Artificial", value: !item.hasArtificialIngredients, trueLabel: "No Artificial Ingredients", falseLabel: "Artificial Ingredients" },
              ...(item.coldPressed !== undefined ? [{ label: "Extraction", value: item.coldPressed, trueLabel: "Cold-Pressed", falseLabel: "Solvent-Extracted" }] : []),
            ].map((attr) => (
              <div key={attr.label} className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium ${
                attr.value ? "bg-green-50 text-[#145A3A]" : "bg-red-50 text-red-600"
              }`}>
                {attr.value ? "✓" : "✗"} {attr.value ? attr.trueLabel : attr.falseLabel}
              </div>
            ))}
          </div>

          {/* Smoke Point for oils */}
          {item.smokePoint && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
              <Flame size={20} className="text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">Smoke Point: {item.smokePoint}°F</p>
                <p className="text-xs text-orange-600 mt-0.5">
                  {item.smokePoint >= 450 ? "Excellent for high-heat cooking" :
                   item.smokePoint >= 375 ? "Good for medium-high heat" :
                   "Best for low-heat or finishing"}
                </p>
              </div>
            </div>
          )}

          {/* Benefits */}
          {item.benefits.length > 0 && (
            <div>
              <h4 className="font-semibold text-stone-700 text-sm mb-2 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-[#0B3D2E]" /> Why It's Good
              </h4>
              <ul className="space-y-1">
                {item.benefits.map((b) => (
                  <li key={b} className="text-sm text-stone-600 dark:text-stone-300 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concerns */}
          {item.concerns.length > 0 && (
            <div>
              <h4 className="font-semibold text-stone-700 text-sm mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-500" /> Concerns
              </h4>
              <ul className="space-y-1">
                {item.concerns.map((c) => (
                  <li key={c} className="text-sm text-stone-600 dark:text-stone-300 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ingredients */}
          {item.ingredients && (
            <div>
              <h4 className="font-semibold text-stone-700 text-sm mb-2">Ingredients</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 rounded-xl p-3 leading-relaxed">{item.ingredients}</p>
            </div>
          )}

          {/* Nutrition */}
          {item.nutrients && (
            <div>
              <h4 className="font-semibold text-stone-700 text-sm mb-2">Nutrition (per serving)</h4>
              <div className="grid grid-cols-3 gap-2">
                {item.nutrients.calories !== undefined && (
                  <div className="bg-stone-50 rounded-xl p-2 text-center">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Calories</p>
                    <p className="font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100">{item.nutrients.calories}</p>
                  </div>
                )}
                {item.nutrients.fat !== undefined && (
                  <div className="bg-stone-50 rounded-xl p-2 text-center">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Fat</p>
                    <p className="font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100">{item.nutrients.fat}g</p>
                  </div>
                )}
                {item.nutrients.sodium !== undefined && (
                  <div className="bg-stone-50 rounded-xl p-2 text-center">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Sodium</p>
                    <p className="font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100">{item.nutrients.sodium}mg</p>
                  </div>
                )}
                {item.nutrients.sugar !== undefined && (
                  <div className={`rounded-xl p-2 text-center ${item.nutrients.sugar > 8 ? "bg-red-50" : "bg-stone-50"}`}>
                    <p className={`text-xs ${item.nutrients.sugar > 8 ? "text-red-500" : "text-stone-500"}`}>Sugar</p>
                    <p className={`font-bold ${item.nutrients.sugar > 8 ? "text-red-700" : "text-stone-800 dark:text-stone-100"}`}>{item.nutrients.sugar}g</p>
                  </div>
                )}
                {item.nutrients.omega6 && (
                  <div className={`rounded-xl p-2 text-center ${item.nutrients.omega6.includes("High") || item.nutrients.omega6.includes("Very High") ? "bg-red-50" : "bg-green-50"}`}>
                    <p className={`text-xs ${item.nutrients.omega6.includes("High") ? "text-red-500" : "text-[#0B3D2E]"}`}>Omega-6</p>
                    <p className={`font-bold text-xs ${item.nutrients.omega6.includes("High") ? "text-red-700" : "text-[#145A3A]"}`}>{item.nutrients.omega6}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Buy Tip */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">💡 Buy Tip</p>
            <p className="text-sm text-amber-800">{item.buyTip}</p>
          </div>

          {item.barcode && (
            <div className="text-center">
              <p className="text-xs text-stone-400">Barcode: <span className="font-mono">{item.barcode}</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CondimentsGuidePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTier, setActiveTier] = useState<CondimentQualityTier | "all">("all");
  const [selected, setSelected] = useState<CondimentEntry | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set(["elite", "good"]));
  const [seedOilOnly, setSeedOilOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<PriceRange>("all");

  const filtered = ALL_CONDIMENTS.filter((item) => {
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    const matchTier = activeTier === "all" || item.qualityTier === activeTier;
    const matchSeedOil = !seedOilOnly || item.hasSeedOils;
    const matchPrice = matchesPriceRange(item.averagePrice, priceRange);
    return matchSearch && matchCat && matchTier && matchSeedOil && matchPrice;
  });

  const byTier = TIER_ORDER.reduce<Record<string, CondimentEntry[]>>((acc, t) => {
    acc[t] = filtered.filter((i) => i.qualityTier === t);
    return acc;
  }, {});

  const toggleTier = (t: string) => {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const seedOilCount = ALL_CONDIMENTS.filter((i) => i.hasSeedOils).length;

  return (
    <div className="ec-page-bg">
      <GuideHero imageUrl="/manus-storage/condiments_v2_069f4e55.jpg" />
      {/* Header */}
      <div className="ec-sticky-header sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setLocation("/explore")}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} className="text-stone-600" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Droplets size={20} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Condiments & Oils</h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">{ALL_CONDIMENTS.length} products · Seed oil & HFCS detection</p>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search ketchup, mayo, oils..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
          />
        </div>
        {/* Category filter */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CONDIMENT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  activeCategory === cat.id
                    ? "bg-[#0B3D2E] text-white border-green-600"
                    : "bg-white dark:bg-stone-800 text-stone-600 border-stone-200 hover:border-green-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        {/* Price range filter */}
        <div className="max-w-2xl mx-auto px-4 pb-2">
          <PriceRangeFilter value={priceRange} onChange={setPriceRange} accentColor="#b45309" />
        </div>

        {/* Tier filter + seed oil toggle */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
            <button
              onClick={() => setActiveTier("all")}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                activeTier === "all" ? "bg-stone-800 text-white border-stone-800" : "bg-white dark:bg-stone-800 text-stone-600 border-stone-200"
              }`}
            >
              All
            </button>
            {TIER_ORDER.map((t) => {
              const cfg = CONDIMENT_QUALITY_TIER_CONFIG[t];
              return (
                <button
                  key={t}
                  onClick={() => setActiveTier(activeTier === t ? "all" : t)}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
                  style={
                    activeTier === t
                      ? { backgroundColor: cfg.color, color: "#fff", borderColor: cfg.color }
                      : { backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }
                  }
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setSeedOilOnly(!seedOilOnly)}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              seedOilOnly ? "bg-red-600 text-white border-red-600" : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            ⚠ Seed Oils ({seedOilCount})
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex gap-2">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-relaxed">
            <strong>Seed oils</strong> (canola, soybean, sunflower, corn, safflower) are the most common hidden ingredient in condiments. They are high in omega-6 linoleic acid and oxidize easily, promoting inflammation. <strong>HFCS</strong> is the second biggest concern.
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-28">
        {TIER_ORDER.map((tier) => {
          const items = byTier[tier];
          if (!items || items.length === 0) return null;
          const cfg = CONDIMENT_QUALITY_TIER_CONFIG[tier];
          const isExpanded = expandedTiers.has(tier);
          return (
            <div key={tier} className="rounded-2xl overflow-hidden border" style={{ borderColor: cfg.border }}>
              <button
                onClick={() => toggleTier(tier)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                style={{ backgroundColor: cfg.bg }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: cfg.border, color: cfg.color }}>
                    {items.length} products
                  </span>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-stone-400 dark:text-stone-500" /> : <ChevronDown size={16} className="text-stone-400 dark:text-stone-500" />}
              </button>
              {isExpanded && (
                <div className="grid grid-cols-1 gap-2 p-3 bg-white dark:bg-stone-800">
                  {items.map((item) => (
                    <CondimentCard key={item.id} item={item} onClick={() => setSelected(item)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Droplets size={40} className="mx-auto text-stone-300 mb-3" />
            <p className="text-stone-400 font-medium">No products found</p>
            <p className="text-stone-300 text-sm mt-1">Try a different search or filter</p>
          </div>
        )}
      </div>

      {selected && <CondimentModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
