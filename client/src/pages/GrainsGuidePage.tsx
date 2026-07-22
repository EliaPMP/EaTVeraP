/**
 * EatVera — Bread & Grains Guide Page
 * Design: Organic Modernism — warm whites, earthy wheat tones
 * Highlights seed oils, HFCS, enriched flour, and whole grain content
 */
import ProductImage from "@/components/ProductImage";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { GuideHero } from "@/components/GuideHero";
import {
  ArrowLeft, Search, X, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, Info, Wheat, Filter, ShieldCheck
} from "lucide-react";
import {
  ALL_GRAINS,
  GRAINS_CATEGORIES,
  GRAINS_QUALITY_TIER_CONFIG,
  getGrainsColor,
  type GrainsEntry,
  type GrainsCategory,
  type GrainsQualityTier,
} from "@/lib/grainsDatabase";

const TIER_ORDER: GrainsQualityTier[] = ["elite", "good", "average", "poor", "avoid"];

function ScoreBadge({ score }: { score: number }) {
  const color = getGrainsColor(score);
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border-2"
      style={{ borderColor: color, color, background: color + "15" }}
    >
      {score}
    </div>
  );
}

function FlagBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}

function ProductModal({ entry, onClose }: { entry: GrainsEntry; onClose: () => void }) {
  const tierConfig = GRAINS_QUALITY_TIER_CONFIG[entry.qualityTier];
  const scoreColor = getGrainsColor(entry.score);

  // Lock body scroll when modal is open
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl overflow-y-auto animate-in slide-in-from-bottom duration-300"
        style={{ background: "var(--background)", maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle + Close button */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 pt-3 pb-1 rounded-t-3xl" style={{ background: "var(--background)" }}>
          <div className="flex-1" />
          <div className="w-10 h-1 rounded-full" style={{ background: "#d1d5db" }} />
          <div className="flex-1 flex justify-end">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
              aria-label="Close"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
        {/* Hero Product Image */}
        <div className="w-full h-44 bg-stone-50 dark:bg-stone-700 flex items-center justify-center overflow-hidden">
          <ProductImage barcode={entry.barcode} name={entry.name} brand={entry.brand} imageUrl={entry.imageUrl} category="Grain" size={160} className="!w-full !h-full !rounded-none" />
        </div>
        {/* Header */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs font-mono-data text-gray-400 uppercase tracking-widest mb-1">{entry.brand}</p>
              <h2 className="font-bold text-gray-900 dark:text-stone-100 text-lg leading-tight">{entry.name}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ color: tierConfig.color, background: tierConfig.bg, border: `1px solid ${tierConfig.border}` }}
                >
                  {tierConfig.label}
                </span>
                {entry.isOrganic && <FlagBadge label="Organic" color="#145A3A" bg="#f0faf0" />}
                {entry.isGlutenFree && <FlagBadge label="Gluten-Free" color="#0369a1" bg="#f0f9ff" />}
                {entry.isWholeGrain && <FlagBadge label="Whole Grain" color="#d97706" bg="#fffbf0" />}
              </div>
            </div>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0"
              style={{ background: scoreColor + "15", color: scoreColor, border: `2px solid ${scoreColor}` }}
            >
              {entry.score}
            </div>
          </div>
        </div>

        <div className="px-5 pb-8 space-y-5">
          {/* Key Flags */}
          <div className="rounded-2xl p-4" style={{ background: "#f5f5f0" }}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Key Flags</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Seed Oils", value: entry.hasSeedOils, bad: true },
                { label: "HFCS", value: entry.hasHFCS, bad: true },
                { label: "Enriched Flour", value: entry.hasEnrichedFlour, bad: true },
                { label: "Whole Grain", value: entry.isWholeGrain, bad: false },
                { label: "Organic", value: entry.isOrganic, bad: false },
                { label: "Gluten-Free", value: entry.isGlutenFree, bad: false },
              ].map(flag => (
                <div key={flag.label} className="flex items-center gap-2">
                  {flag.bad ? (
                    flag.value
                      ? <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                      : <CheckCircle size={14} className="text-[#0B3D2E] flex-shrink-0" />
                  ) : (
                    flag.value
                      ? <CheckCircle size={14} className="text-[#0B3D2E] flex-shrink-0" />
                      : <X size={14} className="text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`text-xs ${flag.bad ? (flag.value ? "text-red-600 font-semibold" : "text-[#145A3A]") : (flag.value ? "text-[#145A3A] font-semibold" : "text-gray-400")}`}>
                    {flag.label}
                  </span>
                </div>
              ))}
            </div>
            {entry.wholeGrainPercent !== undefined && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Whole Grain Content</span>
                  <span className="font-semibold" style={{ color: entry.wholeGrainPercent >= 80 ? "#145A3A" : entry.wholeGrainPercent >= 50 ? "#d97706" : "#dc2626" }}>
                    {entry.wholeGrainPercent}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${entry.wholeGrainPercent}%`,
                      background: entry.wholeGrainPercent >= 80 ? "#145A3A" : entry.wholeGrainPercent >= 50 ? "#d97706" : "#dc2626"
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Concerns */}
          {entry.concerns.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "#fff5f5", border: "1px solid #fca5a5" }}>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <AlertTriangle size={12} /> Concerns
              </p>
              <ul className="space-y-1.5">
                {entry.concerns.map((c, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {entry.benefits.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "#f0faf0", border: "1px solid #b8e8b8" }}>
              <p className="text-xs font-semibold text-[#145A3A] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CheckCircle size={12} /> Benefits
              </p>
              <ul className="space-y-1.5">
                {entry.benefits.map((b, i) => (
                  <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Buy Tip */}
          <div className="rounded-2xl p-4" style={{ background: "#fffbf0", border: "1px solid #fde68a" }}>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Info size={12} /> EatVera Tip
            </p>
            <p className="text-sm text-amber-900">{entry.buyTip}</p>
          </div>

          {/* Nutrition */}
          {entry.nutrients && (
            <div className="rounded-2xl p-4" style={{ background: "#f5f5f0" }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Nutrition (per serving)</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Calories", value: entry.nutrients.calories, unit: "" },
                  { label: "Carbs", value: entry.nutrients.carbs, unit: "g" },
                  { label: "Fiber", value: entry.nutrients.fiber, unit: "g" },
                  { label: "Sugar", value: entry.nutrients.sugar, unit: "g" },
                  { label: "Protein", value: entry.nutrients.protein, unit: "g" },
                  { label: "Sodium", value: entry.nutrients.sodium, unit: "mg" },
                ].filter(n => n.value !== undefined).map(n => (
                  <div key={n.label} className="text-center">
                    <p className="text-base font-bold text-gray-900 dark:text-stone-100">{n.value}{n.unit}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{n.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients */}
          {entry.ingredients && (
            <div className="rounded-2xl p-4" style={{ background: "#f5f5f0" }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Ingredients</p>
              <p className="text-xs text-gray-600 leading-relaxed font-mono-data">{entry.ingredients}</p>
            </div>
          )}

          {/* Barcode */}
          {entry.barcode && (
            <div className="text-center">
              <p className="text-[10px] text-gray-400 font-mono-data">Barcode: {entry.barcode}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GrainsCard({ entry, onClick }: { entry: GrainsEntry; onClick: () => void }) {
  const tierConfig = GRAINS_QUALITY_TIER_CONFIG[entry.qualityTier];
  return (
    <div
      className="rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
      style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <ProductImage barcode={entry.barcode} name={entry.name} brand={entry.brand} imageUrl={entry.imageUrl} category="Grain" size={48} />
        <ScoreBadge score={entry.score} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono-data text-gray-400 uppercase tracking-widest truncate">{entry.brand}</p>
          <p className="font-semibold text-gray-900 dark:text-stone-100 text-sm leading-tight truncate">{entry.name}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: tierConfig.color, background: tierConfig.bg }}
            >
              {tierConfig.label}
            </span>
            {entry.hasSeedOils && <FlagBadge label="Seed Oils" color="#dc2626" bg="#fff5f5" />}
            {entry.hasHFCS && <FlagBadge label="HFCS" color="#dc2626" bg="#fff5f5" />}
            {entry.hasEnrichedFlour && <FlagBadge label="Enriched Flour" color="#ea580c" bg="#fff7ed" />}
            {entry.isOrganic && <FlagBadge label="Organic" color="#145A3A" bg="#f0faf0" />}
            {entry.isWholeGrain && !entry.hasSeedOils && !entry.hasHFCS && <FlagBadge label="Whole Grain" color="#d97706" bg="#fffbf0" />}
          </div>
        </div>
        <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
}

export default function GrainsGuidePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<GrainsCategory | "all">("all");
  const [activeTier, setActiveTier] = useState<GrainsQualityTier | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [seedOilOnly, setSeedOilOnly] = useState(false);
  const [hfcsOnly, setHfcsOnly] = useState(false);
  const [enrichedOnly, setEnrichedOnly] = useState(false);
  const [wholeGrainOnly, setWholeGrainOnly] = useState(false);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [glutenFreeOnly, setGlutenFreeOnly] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<GrainsEntry | null>(null);
  const [expandedTier, setExpandedTier] = useState<GrainsQualityTier | null>("elite");

  const filtered = useMemo(() => {
    return ALL_GRAINS.filter(e => {
      if (activeCategory !== "all" && e.category !== activeCategory) return false;
      if (activeTier !== "all" && e.qualityTier !== activeTier) return false;
      if (seedOilOnly && !e.hasSeedOils) return false;
      if (hfcsOnly && !e.hasHFCS) return false;
      if (enrichedOnly && !e.hasEnrichedFlour) return false;
      if (wholeGrainOnly && !e.isWholeGrain) return false;
      if (organicOnly && !e.isOrganic) return false;
      if (glutenFreeOnly && !e.isGlutenFree) return false;
      if (search) {
        const q = search.toLowerCase();
        return e.name.toLowerCase().includes(q) || e.brand.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeCategory, activeTier, seedOilOnly, hfcsOnly, enrichedOnly, wholeGrainOnly, organicOnly, glutenFreeOnly, search]);

  const grouped = useMemo(() => {
    const map: Partial<Record<GrainsQualityTier, GrainsEntry[]>> = {};
    for (const tier of TIER_ORDER) {
      const items = filtered.filter(e => e.qualityTier === tier);
      if (items.length > 0) map[tier] = items;
    }
    return map;
  }, [filtered]);

  const stats = useMemo(() => ({
    total: ALL_GRAINS.length,
    seedOilCount: ALL_GRAINS.filter(e => e.hasSeedOils).length,
    hfcsCount: ALL_GRAINS.filter(e => e.hasHFCS).length,
    enrichedCount: ALL_GRAINS.filter(e => e.hasEnrichedFlour).length,
    eliteCount: ALL_GRAINS.filter(e => e.qualityTier === "elite" || e.qualityTier === "good").length,
  }), []);

  return (
    <div className="ec-page-bg pb-24">
      <GuideHero imageUrl="/manus-storage/grains_aa64360e.jpg" />
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ background: "var(--background)", borderBottom: "1px solid #e8e8e4" }}>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setLocation("/")}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#f0f0ec" }}
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 dark:text-stone-100 text-lg leading-tight">Bread & Grains Guide</h1>
            <p className="text-xs text-gray-500">{stats.total} products rated</p>
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: showFilters ? "#145A3A" : "#f0f0ec" }}
          >
            <Filter size={16} style={{ color: showFilters ? "#fff" : "#374151" }} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search bread, pasta, cereals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "#f0f0ec", color: "#1a1a1a" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Banner */}
      <div className="px-4 pt-4 pb-2">
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #92400e, #d97706)", boxShadow: "0 4px 20px rgba(146,64,14,0.2)" }}>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-white font-bold text-lg">{stats.total}</p>
              <p className="text-amber-100 text-[10px] uppercase tracking-wide">Products</p>
            </div>
            <div>
              <p className="text-red-200 font-bold text-lg">{stats.seedOilCount}</p>
              <p className="text-amber-100 text-[10px] uppercase tracking-wide">Seed Oils</p>
            </div>
            <div>
              <p className="text-red-200 font-bold text-lg">{stats.hfcsCount}</p>
              <p className="text-amber-100 text-[10px] uppercase tracking-wide">HFCS</p>
            </div>
            <div>
              <p className="text-green-200 font-bold text-lg">{stats.eliteCount}</p>
              <p className="text-amber-100 text-[10px] uppercase tracking-wide">Clean</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-4 pb-3">
          <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Quick Filters</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { label: "🚫 Has Seed Oils", active: seedOilOnly, toggle: () => setSeedOilOnly(v => !v) },
                { label: "🚫 Has HFCS", active: hfcsOnly, toggle: () => setHfcsOnly(v => !v) },
                { label: "🚫 Enriched Flour", active: enrichedOnly, toggle: () => setEnrichedOnly(v => !v) },
                { label: "✅ Whole Grain", active: wholeGrainOnly, toggle: () => setWholeGrainOnly(v => !v) },
                { label: "🌿 Organic", active: organicOnly, toggle: () => setOrganicOnly(v => !v) },
                { label: "🌾 Gluten-Free", active: glutenFreeOnly, toggle: () => setGlutenFreeOnly(v => !v) },
              ].map(f => (
                <button
                  key={f.label}
                  onClick={f.toggle}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                  style={{
                    background: f.active ? "#145A3A" : "#f0f0ec",
                    color: f.active ? "#fff" : "#374151",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Quality Tier</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTier("all")}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                style={{ background: activeTier === "all" ? "#145A3A" : "#f0f0ec", color: activeTier === "all" ? "#fff" : "#374151" }}
              >
                All Tiers
              </button>
              {TIER_ORDER.map(tier => {
                const cfg = GRAINS_QUALITY_TIER_CONFIG[tier];
                return (
                  <button
                    key={tier}
                    onClick={() => setActiveTier(tier)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                    style={{
                      background: activeTier === tier ? cfg.color : cfg.bg,
                      color: activeTier === tier ? "#fff" : cfg.color,
                      border: `1px solid ${cfg.border}`,
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="px-4 pb-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {GRAINS_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: activeCategory === cat.id ? "#145A3A" : "#f0f0ec",
                color: activeCategory === cat.id ? "#fff" : "#374151",
              }}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 space-y-4">
        {search || activeTier !== "all" || seedOilOnly || hfcsOnly || enrichedOnly || wholeGrainOnly || organicOnly || glutenFreeOnly ? (
          // Flat list when filtering
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Wheat size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No products match your filters</p>
              </div>
            ) : (
              filtered.map(entry => (
                <GrainsCard key={entry.id} entry={entry} onClick={() => setSelectedEntry(entry)} />
              ))
            )}
          </div>
        ) : (
          // Grouped by tier
          TIER_ORDER.map(tier => {
            const items = grouped[tier];
            if (!items) return null;
            const cfg = GRAINS_QUALITY_TIER_CONFIG[tier];
            const isExpanded = expandedTier === tier;
            return (
              <div key={tier}>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-2 transition-all"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  onClick={() => setExpandedTier(isExpanded ? null : tier)}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} style={{ color: cfg.color }} />
                    <span className="font-bold text-sm" style={{ color: cfg.color }}>{cfg.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: cfg.color, color: "#fff" }}>
                      {items.length}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp size={16} style={{ color: cfg.color }} /> : <ChevronDown size={16} style={{ color: cfg.color }} />}
                </button>
                {isExpanded && (
                  <div className="space-y-2">
                    {items.map(entry => (
                      <GrainsCard key={entry.id} entry={entry} onClick={() => setSelectedEntry(entry)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {selectedEntry && (
        <ProductModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}
