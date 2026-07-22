/**
 * EatVera — Dairy & Eggs Guide Page
 * Design: Clean, light, organic aesthetic
 * Colors: Warm white bg, sage green accents, soft card shadows
 * Typography: DM Sans
 */
import ProductImage from "@/components/ProductImage";
import { useLocation } from "wouter";
import { useState } from "react";
import PriceRangeFilter, { type PriceRange, matchesPriceRange, isBestValue } from "@/components/PriceRangeFilter";
import {
  ALL_DAIRY,
  DAIRY_CATEGORIES,
  DAIRY_QUALITY_TIER_CONFIG,
  getDairyColor,
  type DairyEntry,
  type DairyQualityTier,
} from "@/lib/dairyDatabase";
import { X, ChevronDown, ChevronUp, Milk, Egg, Info, CheckCircle, AlertTriangle , ArrowLeft } from "lucide-react";
import { GuideHero } from "@/components/GuideHero";

const TIER_ORDER: DairyQualityTier[] = ["elite", "good", "average", "poor", "avoid"];

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const color = getDairyColor(score);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8f5e9" strokeWidth={5} />
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

function DairyCard({ item, onClick }: { item: DairyEntry; onClick: () => void }) {
  const tier = DAIRY_QUALITY_TIER_CONFIG[item.qualityTier];
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm border border-stone-100 hover:shadow-md hover:border-green-200 transition-all duration-200 group"
    >
      <div className="flex items-start gap-3">
        <ProductImage barcode={item.barcode} name={item.name} brand={item.brand} imageUrl={item.imageUrl} category="Dairy" size={52} />
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
            {item.grassFed && (
              <span className="text-xs bg-green-50 text-[#145A3A] border border-green-200 rounded-full px-2 py-0.5">🌿 Grass-Fed</span>
            )}
            {item.pastureRaised && (
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">🐄 Pasture-Raised</span>
            )}
            {item.organic && (
              <span className="text-xs bg-lime-50 text-lime-700 border border-lime-200 rounded-full px-2 py-0.5">✓ Organic</span>
            )}
            {item.milkType && item.milkType !== "N/A" && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">{item.milkType} Milk</span>
            )}
            {item.ultraPasteurized && (
              <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5">⚠ Ultra-Pasteurized</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function DairyModal({ item, onClose }: { item: DairyEntry; onClose: () => void }) {
  const tier = DAIRY_QUALITY_TIER_CONFIG[item.qualityTier];
  const color = getDairyColor(item.score);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Product Image */}
        <div className="w-full h-44 bg-stone-50 flex items-center justify-center overflow-hidden">
          <ProductImage barcode={item.barcode} name={item.name} brand={item.brand} imageUrl={item.imageUrl} category="Dairy" size={160} className="!w-full !h-full !rounded-none" />
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
          {/* Attributes */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Grass-Fed", value: item.grassFed },
              { label: "Pasture-Raised", value: item.pastureRaised },
              { label: "Organic", value: item.organic },
              { label: "Hormone-Free", value: item.hormoneFree },
              { label: "Antibiotic-Free", value: item.antibioticFree },
              { label: "Ultra-Pasteurized", value: item.ultraPasteurized, inverted: true },
            ].filter(a => a.value !== undefined).map((attr) => (
              <div key={attr.label} className={`flex items-center gap-2 p-2 rounded-xl text-sm ${
                (attr.inverted ? !attr.value : attr.value) ? "bg-green-50 text-[#145A3A]" : "bg-red-50 text-red-600"
              }`}>
                {(attr.inverted ? !attr.value : attr.value) ? "✓" : "✗"} {attr.label}
              </div>
            ))}
          </div>

          {/* Milk Type */}
          {item.milkType && item.milkType !== "N/A" && (
            <div className="bg-blue-50 rounded-xl p-3 text-sm">
              <span className="font-semibold text-blue-800">Milk Protein Type: </span>
              <span className="text-blue-700">{item.milkType}</span>
              {item.milkType === "A2" && (
                <p className="text-blue-600 text-xs mt-1">A2 beta-casein is easier to digest and less inflammatory than A1.</p>
              )}
            </div>
          )}

          {/* Certifications */}
          {item.certifications.length > 0 && (
            <div>
              <h4 className="font-semibold text-stone-700 text-sm mb-2">Certifications</h4>
              <div className="flex flex-wrap gap-2">
                {item.certifications.map((c) => (
                  <span key={c} className="text-xs bg-green-50 text-[#145A3A] border border-green-200 rounded-full px-3 py-1">{c}</span>
                ))}
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
              <h4 className="font-semibold text-stone-700 text-sm mb-2">Nutrition Highlights</h4>
              <div className="grid grid-cols-3 gap-2">
                {item.nutrients.calories !== undefined && (
                  <div className="bg-stone-50 rounded-xl p-2 text-center">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Calories</p>
                    <p className="font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100">{item.nutrients.calories}</p>
                  </div>
                )}
                {item.nutrients.protein !== undefined && (
                  <div className="bg-stone-50 rounded-xl p-2 text-center">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Protein</p>
                    <p className="font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100">{item.nutrients.protein}g</p>
                  </div>
                )}
                {item.nutrients.fat !== undefined && (
                  <div className="bg-stone-50 rounded-xl p-2 text-center">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Fat</p>
                    <p className="font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100">{item.nutrients.fat}g</p>
                  </div>
                )}
                {item.nutrients.calcium !== undefined && (
                  <div className="bg-stone-50 rounded-xl p-2 text-center">
                    <p className="text-xs text-stone-500 dark:text-stone-400">Calcium</p>
                    <p className="font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100">{item.nutrients.calcium}mg</p>
                  </div>
                )}
                {item.nutrients.vitaminK2 && (
                  <div className="bg-green-50 rounded-xl p-2 text-center">
                    <p className="text-xs text-[#0B3D2E]">Vitamin K2</p>
                    <p className="font-bold text-[#145A3A]">✓</p>
                  </div>
                )}
                {item.nutrients.CLA && (
                  <div className="bg-green-50 rounded-xl p-2 text-center">
                    <p className="text-xs text-[#0B3D2E]">CLA</p>
                    <p className="font-bold text-[#145A3A]">✓</p>
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

          {/* Barcode */}
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

export default function DairyGuidePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTier, setActiveTier] = useState<DairyQualityTier | "all">("all");
  const [selected, setSelected] = useState<DairyEntry | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set(["elite", "good"]));
  const [priceRange, setPriceRange] = useState<PriceRange>("all");

  const filtered = ALL_DAIRY.filter((item) => {
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    const matchTier = activeTier === "all" || item.qualityTier === activeTier;
    const matchPrice = matchesPriceRange(item.averagePrice, priceRange);
    return matchSearch && matchCat && matchTier && matchPrice;
  });

  const byTier = TIER_ORDER.reduce<Record<string, DairyEntry[]>>((acc, t) => {
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

  return (
    <div className="ec-page-bg">
      <GuideHero imageUrl="/manus-storage/dairy_806c4508.jpg" />
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
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Milk size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Dairy & Eggs Guide</h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">{ALL_DAIRY.length} products · A1/A2, pasture-raised, hormone-free ratings</p>
            </div>
          </div>
          {/* Search */}
          <input
            type="text"
            placeholder="Search dairy, eggs, butter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
          />
        </div>
        {/* Price range filter */}
        <div className="max-w-2xl mx-auto px-4 pb-2">
          <PriceRangeFilter value={priceRange} onChange={setPriceRange} accentColor="#0B3D2E" />
        </div>

        {/* Category filter */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {DAIRY_CATEGORIES.map((cat) => (
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
        {/* Tier filter */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveTier("all")}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                activeTier === "all" ? "bg-stone-800 text-white border-stone-800" : "bg-white dark:bg-stone-800 text-stone-600 border-stone-200"
              }`}
            >
              All Tiers
            </button>
            {TIER_ORDER.map((t) => {
              const cfg = DAIRY_QUALITY_TIER_CONFIG[t];
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
        </div>
      </div>

      {/* Info Banner */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex gap-2">
          <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>A2 milk</strong> contains only A2 beta-casein protein, which is easier to digest. Most US dairy contains A1 protein. <strong>Pasture-raised</strong> dairy has significantly higher CLA, omega-3, and vitamin K2 than conventional.
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-28">
        {TIER_ORDER.map((tier) => {
          const items = byTier[tier];
          if (!items || items.length === 0) return null;
          const cfg = DAIRY_QUALITY_TIER_CONFIG[tier];
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
                  <span className="text-xs text-stone-400">{cfg.score}</span>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-stone-400 dark:text-stone-500" /> : <ChevronDown size={16} className="text-stone-400 dark:text-stone-500" />}
              </button>
              {isExpanded && (
                <div className="grid grid-cols-1 gap-2 p-3 bg-white dark:bg-stone-800">
                  {items.map((item) => (
                    <DairyCard key={item.id} item={item} onClick={() => setSelected(item)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Egg size={40} className="mx-auto text-stone-300 mb-3" />
            <p className="text-stone-400 font-medium">No products found</p>
            <p className="text-stone-300 text-sm mt-1">Try a different search or filter</p>
          </div>
        )}
      </div>

      {selected && <DairyModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
