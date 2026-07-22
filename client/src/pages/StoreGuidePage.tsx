/**
 * EatVera — Grocery Store Ratings Page
 * Design: Organic Modernism — light, clean, health-forward
 * Research-based ratings for major US grocery chains
 */

import { useState, useMemo } from "react";
import { Search, X, CheckCircle, AlertTriangle, Star, MapPin, Building2, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { hapticLight } from "@/lib/haptic";
import { GuideHero } from "@/components/GuideHero";
import {
  ALL_STORES, STORE_TIER_CONFIG, STORE_DB_STATS, SCORE_CATEGORIES,
  type StoreRating, type StoreTier, type StoreCategory
} from "@/lib/storeDatabase";

const CATEGORIES: (StoreCategory | "All")[] = ["All", "Premium", "Natural/Organic", "Conventional", "Warehouse", "Discount", "Regional"];

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono font-bold w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

function OverallRing({ score, color, size = 60 }: { score: number; color: string; size?: number }) {
  const sw = 5;
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
      <div className="absolute font-bold text-center" style={{ color, fontSize: size * 0.23, fontFamily: "'DM Mono', monospace" }}>
        {score}
      </div>
    </div>
  );
}

function openGoogleMapsSearch(storeName: string) {
  const encoded = encodeURIComponent(storeName);
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        window.open(
          `https://www.google.com/maps/search/${encoded}/@${lat},${lng},14z`,
          "_blank",
          "noopener,noreferrer"
        );
      },
      () => {
        // Fallback if user denies location
        window.open(
          `https://www.google.com/maps/search/${encoded}+near+me`,
          "_blank",
          "noopener,noreferrer"
        );
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  } else {
    // Browser doesn't support geolocation
    window.open(
      `https://www.google.com/maps/search/${encoded}+near+me`,
      "_blank",
      "noopener,noreferrer"
    );
  }
}

function StoreCard({ store, onClick }: { store: StoreRating; onClick: () => void }) {
  const tierCfg = STORE_TIER_CONFIG[store.tier];
  return (
    <div
      className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all overflow-hidden"
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
    >
      <button
        onClick={onClick}
        className="w-full p-4 text-left active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3.5">
          {/* Logo */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-stone-50 border border-stone-100 flex items-center justify-center flex-shrink-0 p-2" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-2xl leading-none">{store.emoji}</span>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm leading-tight">{store.name}</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: tierCfg.bg, color: tierCfg.color }}>
                {tierCfg.label}
              </span>
            </div>
            <p className="text-[10px] text-stone-400 mb-1.5">{store.category} · {store.storeCount}</p>
            <p className="text-xs text-stone-500 leading-tight line-clamp-2">{store.tagline}</p>
          </div>
          {/* Score */}
          <OverallRing score={store.overallScore} color={tierCfg.color} size={54} />
        </div>
      </button>
      {/* Find Near Me strip */}
      <button
        onClick={(e) => { e.stopPropagation(); hapticLight(); openGoogleMapsSearch(store.name); }}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-stone-100 text-xs font-semibold transition-colors hover:bg-stone-50 active:bg-stone-100"
        style={{ color: "#0B3D2E" }}
      >
        <MapPin size={12} />
        Find Near Me
      </button>
    </div>
  );
}

function StoreDetailModal({ store, onClose }: { store: StoreRating; onClose: () => void }) {
  const tierCfg = STORE_TIER_CONFIG[store.tier];
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
      <div className="bg-white dark:bg-stone-800 rounded-t-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 border-b border-stone-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-stone-100 flex items-center justify-center flex-shrink-0 p-2">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-4xl leading-none">{store.emoji}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-stone-800 dark:text-stone-100 text-lg leading-tight mb-1">{store.name}</h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: tierCfg.bg, color: tierCfg.color }}>
                  {tierCfg.label}
                </span>
                <span className="text-[9px] text-stone-400 font-mono">{store.category}</span>
                <span className="text-[9px] text-stone-400">·</span>
                <span className="text-[9px] text-stone-400">{store.storeCount}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Overall Score + Tagline */}
          <div className="flex items-center gap-4 rounded-2xl p-4" style={{ background: tierCfg.bg, border: `1px solid ${tierCfg.color}30` }}>
            <OverallRing score={store.overallScore} color={tierCfg.color} size={64} />
            <div>
              <div className="font-bold text-sm" style={{ color: tierCfg.color }}>Overall Score: {store.overallScore}/100</div>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{store.tagline}</p>
            </div>
          </div>

          {/* Score breakdown */}
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-3">Score Breakdown</p>
            <div className="space-y-2.5">
              {SCORE_CATEGORIES.map(({ key, label }) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-stone-600">{label}</span>
                  </div>
                  <ScoreBar value={store.scores[key]} color={store.scores[key] >= 70 ? "#0B3D2E" : store.scores[key] >= 50 ? "#d97706" : "#dc2626"} />
                </div>
              ))}
            </div>
          </div>

          {/* Verdict */}
          <div className="rounded-2xl p-4 bg-stone-50 border border-stone-100">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Our Verdict</p>
            <p className="text-xs text-stone-600 leading-relaxed">{store.overallVerdict}</p>
          </div>

          {/* Pros */}
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Pros</p>
            <div className="space-y-1.5">
              {store.pros.map((p, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                  <CheckCircle size={11} className="flex-shrink-0 mt-0.5" style={{ color: "#0B3D2E" }} />
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Cons */}
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Cons</p>
            <div className="space-y-1.5">
              {store.cons.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                  <AlertTriangle size={11} className="flex-shrink-0 mt-0.5 text-amber-500" />
                  {c}
                </div>
              ))}
            </div>
          </div>

          {/* Best For / Avoid */}
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-2xl p-3.5" style={{ background: "#f0faf0", border: "1px solid #b8e8b8" }}>
              <p className="text-[10px] font-semibold mb-2" style={{ color: "#145A3A" }}>✓ Best For</p>
              <div className="flex flex-wrap gap-1.5">
                {store.bestFor.map((item, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#dcf4dc", color: "#145A3A" }}>{item}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-3.5" style={{ background: "#fff5f5", border: "1px solid #fca5a5" }}>
              <p className="text-[10px] font-semibold mb-2 text-red-600">✗ Avoid At This Store</p>
              <div className="flex flex-wrap gap-1.5">
                {store.avoidAt.map((item, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600">{item}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Meat Notes */}
          <button
            className="w-full rounded-2xl p-4 text-left border border-stone-100 bg-white dark:bg-stone-800"
            onClick={() => setExpandedSection(expandedSection === "meat" ? null : "meat")}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-stone-700">🥩 Meat Department Notes</p>
              {expandedSection === "meat" ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
            </div>
            {expandedSection === "meat" && (
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">{store.meatNotes}</p>
            )}
          </button>

          {/* Organic Notes */}
          <button
            className="w-full rounded-2xl p-4 text-left border border-stone-100 bg-white dark:bg-stone-800"
            onClick={() => setExpandedSection(expandedSection === "organic" ? null : "organic")}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-stone-700">🌿 Organic Section Notes</p>
              {expandedSection === "organic" ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
            </div>
            {expandedSection === "organic" && (
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">{store.organicNotes}</p>
            )}
          </button>

          {/* Ownership */}
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Building2 size={12} />
            <span>{store.ownership}</span>
          </div>

          {/* Find Near Me CTA */}
          <button
            onClick={() => { hapticLight(); openGoogleMapsSearch(store.name); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #0B3D2E, #145A3A)", color: "white", boxShadow: "0 4px 16px rgba(11,61,46,0.3)" }}
          >
            <MapPin size={15} />
            Find {store.name} Near Me
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoreGuidePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory | "All">("All");
  const [selectedTier, setSelectedTier] = useState<StoreTier | "All">("All");
  const [selectedStore, setSelectedStore] = useState<StoreRating | null>(null);

  const filtered = useMemo(() => {
    return ALL_STORES.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCategory !== "All" && s.category !== selectedCategory) return false;
      if (selectedTier !== "All" && s.tier !== selectedTier) return false;
      return true;
    }).sort((a, b) => b.overallScore - a.overallScore);
  }, [search, selectedCategory, selectedTier]);

  return (
    <div className="ec-page-bg pb-24">
      <GuideHero imageUrl="/manus-storage/stores_2fb644ec.jpg" />
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => { hapticLight(); window.history.back(); }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: "rgba(11,61,46,0.08)", border: "1px solid rgba(11,61,46,0.12)" }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} style={{ color: "#0B3D2E" }} />
          </button>
        </div>
        <h1 className="font-bold text-2xl text-stone-800 dark:text-stone-100 mb-1" style={{ letterSpacing: "-0.02em" }}>Store Guide</h1>
        <p className="text-stone-400 text-sm">{ALL_STORES.length} major US grocery chains rated</p>
      </div>

      {/* Stats */}
      <div className="flex gap-2.5 px-4 mb-4 overflow-x-auto scrollbar-hide">
        {[
          { label: "Total", value: STORE_DB_STATS.total, color: "#0B3D2E" },
          { label: "Elite", value: STORE_DB_STATS.elite, color: "#145A3A" },
          { label: "Excellent", value: STORE_DB_STATS.excellent, color: "#0B3D2E" },
          { label: "Good", value: STORE_DB_STATS.good, color: "#4ade80" },
          { label: "Fair/Poor", value: STORE_DB_STATS.fair, color: "#d97706" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex-shrink-0 bg-white dark:bg-stone-800 rounded-2xl px-4 py-3 border border-stone-100 text-center min-w-[70px]">
            <div className="font-bold text-lg font-mono" style={{ color }}>{value}</div>
            <div className="text-[9px] text-stone-400 uppercase tracking-widest">{label}</div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-4 text-xs text-stone-600 leading-relaxed" style={{ background: "#f0faf0", border: "1px solid #b8e8b8" }}>
          <p className="font-semibold text-stone-700 mb-1">How We Rate Grocery Stores</p>
          <p>Scores are based on meat quality standards, organic selection, ingredient transparency, seed oil usage, private label quality, value for quality, and sourcing ethics. Data sourced from company policies, independent testing, and consumer advocacy research.</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores..."
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
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
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
        {(["All", "elite", "excellent", "good", "fair", "poor", "avoid"] as const).map((tier) => {
          const cfg = tier === "All" ? null : STORE_TIER_CONFIG[tier];
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

      {/* Results */}
      <div className="px-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-400 text-sm">No stores match your filters</p>
          </div>
        ) : (
          filtered.map((store) => (
            <StoreCard key={store.id} store={store} onClick={() => setSelectedStore(store)} />
          ))
        )}
      </div>

      {/* Detail modal */}
      {selectedStore && (
        <StoreDetailModal store={selectedStore} onClose={() => setSelectedStore(null)} />
      )}
    </div>
  );
}
