/**
 * EatVera — Vegetable Guide Page
 * Design: Organic Modernism — light, clean, health-forward
 * EWG pesticide data, organic vs conventional scores, detailed modals
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, X, ChevronDown, ChevronUp, Info, Leaf, AlertTriangle, CheckCircle, ShieldCheck , ArrowLeft } from "lucide-react";
import { GuideHero } from "@/components/GuideHero";
import {
  ALL_VEGETABLES, VEG_CATEGORIES, VEG_QUALITY_TIER_CONFIG, VEG_DB_STATS,
  getVegColor, getVegDisplayScore,
  type VegetableEntry, type VegetableQualityTier, type VegCategory, type EWGStatus
} from "@/lib/vegetableDatabase";

const EWG_CONFIG: Record<EWGStatus, { label: string; color: string; bg: string }> = {
  "dirty-dozen":   { label: "Dirty Dozen",   color: "#dc2626", bg: "#fee2e2" },
  "clean-fifteen": { label: "Clean 15",      color: "#145A3A", bg: "#dcf4dc" },
  "moderate":      { label: "Moderate",      color: "#d97706", bg: "#fef3c7" },
  "clean":         { label: "Clean",         color: "#0B3D2E", bg: "#f0faf0" },
};

function ScoreRing({ score, color, size = 52 }: { score: number; color: string; size?: number }) {
  const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7e5e4" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute font-bold text-center" style={{ color, fontSize: size * 0.25, fontFamily: "'DM Mono', monospace" }}>
        {score}
      </div>
    </div>
  );
}

function EWGBadge({ status }: { status: EWGStatus }) {
  const c = EWG_CONFIG[status];
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

function VegetableCard({ entry, organic, onClick }: { entry: VegetableEntry; organic: boolean; onClick: () => void }) {
  const score = getVegDisplayScore(entry, organic);
  const color = getVegColor(entry.tier);
  const tierCfg = VEG_QUALITY_TIER_CONFIG[entry.tier];

  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-stone-800 dark:bg-stone-900 rounded-2xl p-4 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all text-left w-full"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden mt-0.5" style={{ background: "#f5f5f4" }}>
          {entry.imageUrl ? (
            <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" loading="eager" />
          ) : (
            <span className="text-2xl">{entry.emoji}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-800 dark:text-stone-100 dark:text-stone-100 text-sm leading-tight mb-1">{entry.name}</p>
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <EWGBadge status={entry.ewgStatus} />
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: tierCfg.bg, color: tierCfg.color }}>
              {tierCfg.label}
            </span>
          </div>
          <p className="text-[10px] text-stone-400 leading-tight line-clamp-2">{entry.buyTip}</p>
        </div>
        <ScoreRing score={score} color={color} size={48} />
      </div>
    </button>
  );
}

function VegetableDetailModal({ entry, organic, onClose }: { entry: VegetableEntry; organic: boolean; onClose: () => void }) {
  const score = getVegDisplayScore(entry, organic);
  const color = getVegColor(entry.tier);
  const tierCfg = VEG_QUALITY_TIER_CONFIG[entry.tier];
  const ewgCfg = EWG_CONFIG[entry.ewgStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
      <div className="bg-white dark:bg-stone-800 dark:bg-stone-900 rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 border-b border-stone-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden" style={{ background: "#f5f5f4" }}>
              {entry.imageUrl ? (
                <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" loading="eager" />
              ) : (
                <span className="text-4xl">{entry.emoji}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-stone-800 dark:text-stone-100 dark:text-stone-100 dark:text-stone-100 text-lg leading-tight mb-1">{entry.name}</h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                <EWGBadge status={entry.ewgStatus} />
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: tierCfg.bg, color: tierCfg.color }}>
                  {tierCfg.label}
                </span>
                <span className="text-[9px] text-stone-400 font-mono">{entry.category}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Score comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 border text-center" style={{ background: organic ? "#f0faf0" : "#f5f5f4", borderColor: organic ? "#b8e8b8" : "#e7e5e4" }}>
              <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Conventional</div>
              <div className="font-bold text-2xl font-mono" style={{ color: getVegColor(entry.tier) }}>{entry.conventionalScore}</div>
              <div className="text-[10px] text-stone-400 mt-1">{entry.conventionalScore >= 70 ? "Generally safe" : entry.conventionalScore >= 50 ? "Some concern" : "High risk"}</div>
            </div>
            <div className="rounded-2xl p-4 border text-center" style={{ background: "#f0faf0", borderColor: "#b8e8b8" }}>
              <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Organic</div>
              <div className="font-bold text-2xl font-mono" style={{ color: "#145A3A" }}>{entry.organicScore}</div>
              <div className="text-[10px] text-stone-400 mt-1">+{entry.organicScore - entry.conventionalScore} pts cleaner</div>
            </div>
          </div>

          {/* EWG Status */}
          <div className="rounded-2xl p-4 border" style={{ background: ewgCfg.bg, borderColor: `${ewgCfg.color}30` }}>
            <div className="flex items-center gap-2 mb-1.5">
              {entry.ewgStatus === "dirty-dozen" ? <AlertTriangle size={14} style={{ color: ewgCfg.color }} /> : <ShieldCheck size={14} style={{ color: ewgCfg.color }} />}
              <span className="font-semibold text-sm" style={{ color: ewgCfg.color }}>EWG: {ewgCfg.label}</span>
              {entry.pesticidesFound && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: `${ewgCfg.color}20`, color: ewgCfg.color }}>
                  {entry.pesticidesFound} pesticides found
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{entry.buyTip}</p>
          </div>

          {/* Concerns */}
          {entry.concerns.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Concerns</p>
              <div className="space-y-1.5">
                {entry.concerns.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-300">
                    <AlertTriangle size={11} className="flex-shrink-0 mt-0.5 text-amber-500" />
                    {c}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Health Benefits</p>
            <div className="space-y-1.5">
              {entry.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-300">
                  <CheckCircle size={11} className="flex-shrink-0 mt-0.5" style={{ color: "#0B3D2E" }} />
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Key Nutrients */}
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Key Nutrients</p>
            <div className="flex flex-wrap gap-1.5">
              {entry.keyNutrients.map((n, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#f0faf0", color: "#145A3A" }}>
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* Serving idea */}
          <div className="rounded-2xl p-4" style={{ background: "var(--background)", border: "1px solid #e7e5e4" }}>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1.5">Serving Idea</p>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">🍽️ {entry.servingIdea}</p>
          </div>

          {/* Nutrition */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 text-center bg-stone-50 border border-stone-100">
              <div className="font-bold text-lg font-mono text-stone-700">{entry.calories100g}</div>
              <div className="text-[9px] text-stone-400">kcal / 100g</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "#f0faf0", border: "1px solid #b8e8b8" }}>
              <div className="font-bold text-lg font-mono" style={{ color: "#145A3A" }}>{entry.nutritionHighlights.length}</div>
              <div className="text-[9px] text-stone-400">nutrition highlights</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VegetableGuidePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<VegCategory | "All">("All");
  const [selectedTier, setSelectedTier] = useState<VegetableQualityTier | "All">("All");
  const [organic, setOrganic] = useState(false);
  const [selectedVeg, setSelectedVeg] = useState<VegetableEntry | null>(null);
  const [showEWGInfo, setShowEWGInfo] = useState(false);

  const filtered = useMemo(() => {
    return ALL_VEGETABLES.filter((v) => {
      if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.category.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCategory !== "All" && v.category !== selectedCategory) return false;
      if (selectedTier !== "All" && v.tier !== selectedTier) return false;
      return true;
    }).sort((a, b) => getVegDisplayScore(b, organic) - getVegDisplayScore(a, organic));
  }, [search, selectedCategory, selectedTier, organic]);

  return (
    <div className="ec-page-bg pb-24">
      <GuideHero imageUrl="/manus-storage/vegetables_v2_39ff353e.jpg" />
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocation("/explore")}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} className="text-stone-600" />
            </button>
            <h1 className="font-bold text-2xl text-stone-800 dark:text-stone-100" style={{ letterSpacing: "-0.02em" }}>Vegetable Guide</h1>
          </div>
          <button
            onClick={() => setOrganic(!organic)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
            style={organic ? { background: "#0B3D2E", color: "white" } : { background: "#f0faf0", color: "#0B3D2E", border: "1px solid #b8e8b8" }}
          >
            <Leaf size={12} />
            {organic ? "Organic" : "Conventional"}
          </button>
        </div>
        <p className="text-stone-400 dark:text-stone-500 text-sm">{VEG_DB_STATS.total} vegetables · EWG pesticide data</p>
      </div>

      {/* Stats row */}
      <div className="flex gap-2.5 px-4 mb-4 overflow-x-auto scrollbar-hide">
        {[
          { label: "Total", value: VEG_DB_STATS.total, color: "#0B3D2E" },
          { label: "Dirty Dozen", value: VEG_DB_STATS.dirtyDozen, color: "#dc2626" },
          { label: "Clean 15", value: VEG_DB_STATS.cleanFifteen, color: "#145A3A" },
          { label: "Categories", value: VEG_DB_STATS.categories, color: "#d97706" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex-shrink-0 bg-white dark:bg-stone-800 rounded-2xl px-4 py-3 border border-stone-100 text-center min-w-[70px]">
            <div className="font-bold text-lg font-mono" style={{ color }}>{value}</div>
            <div className="text-[9px] text-stone-400 uppercase tracking-widest">{label}</div>
          </div>
        ))}
      </div>

      {/* EWG Info Banner */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setShowEWGInfo(!showEWGInfo)}
          className="w-full rounded-2xl p-3.5 flex items-center gap-3 text-left transition-all"
          style={{ background: "#f0faf0", border: "1px solid #b8e8b8" }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#dcf4dc" }}>
            <Info size={14} style={{ color: "#0B3D2E" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-700">About EWG Pesticide Ratings</p>
            <p className="text-[10px] text-stone-400">Tap to learn about the Dirty Dozen & Clean Fifteen</p>
          </div>
          {showEWGInfo ? <ChevronUp size={14} className="text-stone-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-stone-400 flex-shrink-0" />}
        </button>
        {showEWGInfo && (
          <div className="mt-2 rounded-2xl p-4 bg-white dark:bg-stone-800 border border-stone-100 text-xs text-stone-600 dark:text-stone-300 leading-relaxed space-y-2">
            <p><strong>Dirty Dozen:</strong> The 12 most pesticide-contaminated vegetables and fruits, tested by the Environmental Working Group (EWG) annually. Always buy organic for these.</p>
            <p><strong>Clean Fifteen:</strong> The 15 least contaminated produce items. Conventional is generally safe for these.</p>
            <p><strong>Pesticide Score:</strong> Conventional scores reflect pesticide residue risk. Organic scores reflect the same vegetable grown without synthetic pesticides — typically 20-60 points higher.</p>
            <p className="text-stone-400">Data source: EWG Shopper's Guide to Pesticides in Produce 2024.</p>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vegetables..."
            className="ec-input pl-10"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 px-4 mb-2 overflow-x-auto scrollbar-hide">
        {(["All", ...VEG_CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat as VegCategory | "All")}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={selectedCategory === cat
              ? { background: "#0B3D2E", color: "white" }
              : { background: "#f5f5f4", color: "#78716c" }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tier filter */}
      <div className="flex gap-1.5 px-4 mb-4 overflow-x-auto scrollbar-hide">
        {(["All", "elite", "excellent", "good", "fair", "caution", "avoid"] as const).map((tier) => {
          const cfg = tier === "All" ? null : VEG_QUALITY_TIER_CONFIG[tier];
          return (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all capitalize"
              style={selectedTier === tier
                ? { background: cfg?.color || "#0B3D2E", color: "white" }
                : { background: "#f5f5f4", color: "#78716c" }
              }
            >
              {tier === "All" ? "All Tiers" : cfg?.label}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
            {filtered.length} vegetables {organic ? "(organic scores)" : "(conventional scores)"}
          </span>
          {(selectedCategory !== "All" || selectedTier !== "All" || search) && (
            <button
              onClick={() => { setSelectedCategory("All"); setSelectedTier("All"); setSearch(""); }}
              className="text-[10px] text-stone-400 hover:text-stone-600 flex items-center gap-1"
            >
              <X size={10} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Vegetable grid */}
      <div className="px-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-400 dark:text-stone-500 text-sm">No vegetables match your filters</p>
          </div>
        ) : (
          filtered.map((veg) => (
            <VegetableCard
              key={veg.id}
              entry={veg}
              organic={organic}
              onClick={() => setSelectedVeg(veg)}
            />
          ))
        )}
      </div>

      {/* Detail modal */}
      {selectedVeg && (
        <VegetableDetailModal
          entry={selectedVeg}
          organic={organic}
          onClose={() => setSelectedVeg(null)}
        />
      )}
    </div>
  );
}
