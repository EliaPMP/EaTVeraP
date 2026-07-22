/**
 * EatVera — Beverages Guide Page
 * Design: Clean light theme — warm white bg, sage green accents, DM Sans typography
 * Shows juices, sodas, sports drinks, energy drinks, teas, coffee, waters, plant milks
 * with quality tiers, HFCS/sweetener/color flags, and detailed product modals
 */

import ProductImage from "@/components/ProductImage";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GlassWater, Search, X, AlertTriangle, CheckCircle, Info, ShoppingCart
, ArrowLeft } from "lucide-react";
import PriceRangeFilter, { type PriceRange, matchesPriceRange, isBestValue } from "@/components/PriceRangeFilter";
import { GuideHero } from "@/components/GuideHero";
import {
  ALL_BEVERAGES, BEVERAGE_CATEGORIES, BEVERAGE_QUALITY_TIER_CONFIG,
  getBeverageColor, type BeverageEntry, type BeverageCategory, type BeverageQualityTier
} from "@/lib/beveragesDatabase";

const TIER_ORDER: BeverageQualityTier[] = ["elite", "good", "average", "poor", "avoid"];

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = getBeverageColor(score);
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8ede8" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={4}
        strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle"
        fontSize={size > 50 ? 14 : 11} fontWeight="700" fill={color} fontFamily="DM Sans, sans-serif">
        {score}
      </text>
    </svg>
  );
}

function ProductModal({ product, onClose }: { product: BeverageEntry; onClose: () => void }) {
  const tier = BEVERAGE_QUALITY_TIER_CONFIG[product.qualityTier];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white dark:bg-stone-800 dark:bg-stone-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Hero Product Image */}
        <div className="w-full h-44 bg-stone-50 dark:bg-stone-700 flex items-center justify-center overflow-hidden rounded-t-3xl">
          <ProductImage barcode={product.barcode} name={product.name} brand={product.brand} imageUrl={product.imageUrl} category="Beverage" size={160} className="!w-full !h-full !rounded-none" />
        </div>
        {/* Header */}
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                  {tier.label}
                </span>
                {product.isOrganic && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-[#145A3A] border border-green-200">Organic</span>}
                {product.isSugarFree && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Sugar-Free</span>}
                {product.isNaturallySweetened && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Naturally Sweetened</span>}
              </div>
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100 leading-tight">{product.name}</h2>
              <p className="text-sm text-stone-500 mt-0.5">{product.brand}</p>
            </div>
            <div className="flex items-center gap-3">
              <ScoreRing score={product.score} size={64} />
              <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
                <X size={20} className="text-stone-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Flags */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "HFCS / Corn Syrup", bad: product.hasHFCS },
              { label: "Artificial Sweeteners", bad: product.hasArtificialSweeteners },
              { label: "Artificial Colors", bad: product.hasArtificialColors },
              { label: "Artificial Flavors", bad: product.hasArtificialFlavors },
              { label: "Sodium Benzoate", bad: product.hasSodiumBenzoate },
              { label: "Phosphoric Acid", bad: product.hasPhosphoricAcid },
            ].map(flag => (
              <div key={flag.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${flag.bad ? "bg-red-50 text-red-700" : "bg-green-50 text-[#145A3A]"}`}>
                {flag.bad ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                {flag.label}
              </div>
            ))}
          </div>

          {/* Nutrition */}
          {product.nutrients && (
            <div>
              <h3 className="text-sm font-semibold text-stone-700 mb-2">Nutrition per serving {product.servingSize && <span className="text-stone-400 font-normal">({product.servingSize})</span>}</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Calories", value: product.nutrients.calories, unit: "" },
                  { label: "Sugar", value: product.nutrients.sugar, unit: "g" },
                  { label: "Sodium", value: product.nutrients.sodium, unit: "mg" },
                  { label: "Caffeine", value: product.nutrients.caffeine, unit: "mg" },
                ].filter(n => n.value !== undefined).map(n => (
                  <div key={n.label} className="bg-stone-50 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100">{n.value}{n.unit}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">{n.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concerns */}
          {product.concerns.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Concerns
              </h3>
              <ul className="space-y-1.5">
                {product.concerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {product.benefits.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#145A3A] mb-2 flex items-center gap-1.5">
                <CheckCircle size={14} /> Benefits
              </h3>
              <ul className="space-y-1.5">
                {product.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#145A3A]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ingredients */}
          {product.ingredients && (
            <div>
              <h3 className="text-sm font-semibold text-stone-700 mb-2">Ingredients</h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 rounded-lg p-3">{product.ingredients}</p>
            </div>
          )}

          {/* Buy Tip */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <ShoppingCart size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800 mb-1">Buy Tip</p>
                <p className="text-sm text-amber-700">{product.buyTip}</p>
              </div>
            </div>
          </div>

          {product.barcode && (
            <p className="text-xs text-stone-400 text-center">UPC: {product.barcode}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProductCard({ product, onClick }: { product: BeverageEntry; onClick: () => void }) {
  const tier = BEVERAGE_QUALITY_TIER_CONFIG[product.qualityTier];
  return (
    <motion.button
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 p-4 shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <ProductImage barcode={product.barcode} name={product.name} brand={product.brand} imageUrl={product.imageUrl} category="Beverage" size={52} />
        <ScoreRing score={product.score} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
              {tier.label}
            </span>
            {product.isOrganic && <span className="text-xs text-[#0B3D2E] font-medium">🌿 Organic</span>}
            {product.isSugarFree && <span className="text-xs text-blue-600 font-medium">Sugar-Free</span>}
          </div>
          <p className="font-semibold text-stone-800 dark:text-stone-100 dark:text-stone-100 text-sm leading-tight truncate">{product.name}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">{product.brand}</p>
          {product.averagePrice !== undefined && (
            <p className="text-xs font-bold mt-0.5" style={{ color: "#145A3A" }}>
              ${product.averagePrice.toFixed(2)} <span className="font-normal text-stone-400">est.</span>
              {isBestValue(product.score, product.averagePrice) && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "#dcf4dc", color: "#145A3A" }}>⭐ Best Value</span>
              )}
            </p>
          )}
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {product.hasHFCS && <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full">⚠ HFCS</span>}
            {product.hasArtificialSweeteners && <span className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded-full">⚠ Artificial Sweeteners</span>}
            {product.hasArtificialColors && <span className="text-xs px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded-full">⚠ Artificial Colors</span>}
            {product.hasSodiumBenzoate && <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full">⚠ Sodium Benzoate</span>}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default function BeveragesGuidePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<BeverageCategory>("all");
  const [tierFilter, setTierFilter] = useState<BeverageQualityTier | "all">("all");
  const [hfcsOnly, setHfcsOnly] = useState(false);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [selected, setSelected] = useState<BeverageEntry | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRange>("all");

  const filtered = useMemo(() => {
    return ALL_BEVERAGES.filter(p => {
      if (category !== "all" && p.category !== category) return false;
      if (tierFilter !== "all" && p.qualityTier !== tierFilter) return false;
      if (hfcsOnly && !p.hasHFCS) return false;
      if (organicOnly && !p.isOrganic) return false;
      if (!matchesPriceRange(p.averagePrice, priceRange)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => b.score - a.score);
  }, [search, category, tierFilter, hfcsOnly, organicOnly, priceRange]);

  const stats = useMemo(() => ({
    avg: Math.round(ALL_BEVERAGES.reduce((s, p) => s + p.score, 0) / ALL_BEVERAGES.length),
    hfcs: ALL_BEVERAGES.filter(p => p.hasHFCS).length,
    artificialSweeteners: ALL_BEVERAGES.filter(p => p.hasArtificialSweeteners).length,
    elite: ALL_BEVERAGES.filter(p => p.qualityTier === "elite" || p.qualityTier === "good").length,
  }), []);

  return (
    <div className="ec-page-bg">
      <GuideHero imageUrl="/manus-storage/beverages_v2_bfb4388f.jpg" />
      {/* Header */}
      <div className="sticky top-0 z-30 ec-sticky-header shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setLocation("/explore")}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} className="text-stone-600" />
            </button>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #e0f4ff 0%, #c8e8ff 100%)" }}>
              <GlassWater size={20} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100">Beverages Guide</h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">{ALL_BEVERAGES.length} drinks rated — HFCS, sweeteners & more</p>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: "Avg Score", value: stats.avg, color: "#2d7d9a" },
              { label: "With HFCS", value: stats.hfcs, color: "#dc2626" },
              { label: "Artif. Sweet.", value: stats.artificialSweeteners, color: "#dc6803" },
              { label: "Good+", value: stats.elite, color: "#145A3A" },
            ].map(s => (
              <div key={s.label} className="bg-stone-50 rounded-xl p-2 text-center">
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-stone-500 dark:text-stone-400 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search beverages..."
              className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-stone-400 dark:text-stone-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {BEVERAGE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                category === cat.id
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-white dark:bg-stone-800 text-stone-600 border border-stone-200 hover:border-blue-300"
              }`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Price range filter */}
        <PriceRangeFilter value={priceRange} onChange={setPriceRange} accentColor="#2d7d9a" />

        {/* Tier filter + toggles */}
        <div className="flex gap-2 flex-wrap">
          {(["all", ...TIER_ORDER] as const).map(t => {
            const cfg = t === "all" ? null : BEVERAGE_QUALITY_TIER_CONFIG[t];
            return (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  tierFilter === t
                    ? "bg-stone-800 text-white border-stone-800"
                    : "bg-white dark:bg-stone-800 text-stone-600 border-stone-200 hover:border-stone-400"
                }`}
                style={tierFilter === t && cfg ? { background: cfg.color, borderColor: cfg.color } : {}}
              >
                {t === "all" ? "All Tiers" : cfg!.label}
              </button>
            );
          })}
          <button
            onClick={() => setHfcsOnly(!hfcsOnly)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              hfcsOnly ? "bg-red-600 text-white border-red-600" : "bg-white dark:bg-stone-800 text-stone-600 border-stone-200"
            }`}
          >
            ⚠ HFCS
          </button>
          <button
            onClick={() => setOrganicOnly(!organicOnly)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              organicOnly ? "bg-[#0B3D2E] text-white border-green-600" : "bg-white dark:bg-stone-800 text-stone-600 border-stone-200"
            }`}
          >
            🌿 Organic Only
          </button>
        </div>

        {/* Results */}
        <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">{filtered.length} beverages</div>
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map(product => (
              <motion.div key={product.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ProductCard product={product} onClick={() => setSelected(product)} />
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-stone-400">
              <GlassWater size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No beverages found</p>
            </div>
          )}
        </div>

        {/* Beverage tips */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mt-4">
          <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
            <Info size={16} /> Beverage Rules
          </h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />Water is always the best choice — sparkling water with no additives is an excellent soda alternative</li>
            <li className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />Fruit juice is not the same as eating fruit — it removes fiber and concentrates sugar, spiking blood sugar</li>
            <li className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />Diet sodas with aspartame or sucralose may disrupt gut microbiome and insulin response despite zero calories</li>
            <li className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />Sodium benzoate + vitamin C can form benzene (a carcinogen) — avoid drinks with both ingredients</li>
            <li className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />Energy drinks with 200mg+ caffeine are linked to cardiovascular stress — limit to one per day maximum</li>
          </ul>
        </div>
      </div>

      <AnimatePresence>
        {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
