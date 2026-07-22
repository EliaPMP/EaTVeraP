/**
 * EatVera — Baby & Kids Food Guide Page
 * Design: Clean light aesthetic — warm white bg, sage green accents, DM Sans
 * Covers: formula, purees, pouches, cereals, snacks, meals, drinks, toddler
 */

import ProductImage from "@/components/ProductImage";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import {
  ALL_BABY_KIDS,
  BABY_KIDS_CATEGORIES,
  BABY_KIDS_TIER_CONFIG,
  BabyKidsCategory,
  BabyKidsTier,
  BabyKidsEntry,
  getBabyKidsColor,
} from "@/lib/babyKidsDatabase";
import { Search, X, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Baby , ArrowLeft } from "lucide-react";
import { GuideHero } from "@/components/GuideHero";

const TIER_ORDER: BabyKidsTier[] = ["elite", "good", "average", "poor", "avoid"];

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const color = getBabyKidsColor(score);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8f0e8" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        color, fontSize: size * 0.26, fontWeight: 700, fontFamily: "DM Sans, sans-serif",
        lineHeight: 1,
      }}>
        {score}
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: BabyKidsTier }) {
  const cfg = BABY_KIDS_TIER_CONFIG[tier];
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
      className="text-xs font-semibold px-2 py-0.5 rounded-full">{cfg.label}</span>
  );
}

function BabyKidsCard({ item, onClick }: { item: BabyKidsEntry; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className="bg-white dark:bg-stone-800 dark:bg-stone-900 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md"
      style={{ border: "1px solid #e8f0e8", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div className="flex items-start gap-3">
        <ProductImage barcode={item.barcode} name={item.name} brand={item.brand} imageUrl={item.imageUrl} category="Baby & Kids" size={52} />
        <ScoreRing score={item.score} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#1a2e1a] text-sm leading-tight">{item.name}</p>
              <p className="text-xs text-[#6b7c6b] mt-0.5">{item.brand} · {item.ageRange}</p>
            </div>
            <TierBadge tier={item.qualityTier} />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {item.hasHeavyMetalRisk && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#fff5f5", color: "#dc2626", border: "1px solid #fca5a5" }}>
                ⚠ Heavy Metals
              </span>
            )}
            {item.hasAddedSugars && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#fff7ed", color: "#dc6803", border: "1px solid #fed7aa" }}>
                ⚠ Added Sugar
              </span>
            )}
            {item.hasArtificialColors && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#faf5ff", color: "#9333ea", border: "1px solid #d8b4fe" }}>
                ⚠ Artificial Dyes
              </span>
            )}
            {item.isOrganic && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f0faf0", color: "#145A3A", border: "1px solid #b8e8b8" }}>
                ✓ Organic
              </span>
            )}
            {item.isLowHeavyMetals && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f0f8ff", color: "#2d7d9a", border: "1px solid #b8d8e8" }}>
                ✓ Low Heavy Metals
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BabyKidsModal({ item, onClose }: { item: BabyKidsEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-stone-800 rounded-t-3xl max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }}
        onClick={e => e.stopPropagation()}>
        {/* Hero Product Image */}
        <div className="w-full h-44 bg-stone-50 flex items-center justify-center overflow-hidden">
          <ProductImage barcode={item.barcode} name={item.name} brand={item.brand} imageUrl={item.imageUrl} category="Baby & Kids" size={160} className="!w-full !h-full !rounded-none" />
        </div>
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: "#e8f0e8" }}>
          <div className="flex items-start gap-4">
            <ScoreRing score={item.score} size={64} />
            <div className="flex-1">
              <h2 className="font-bold text-[#1a2e1a] text-lg leading-tight">{item.name}</h2>
              <p className="text-sm text-[#6b7c6b] mt-0.5">{item.brand}</p>
              <p className="text-xs text-[#9aaa9a] mt-0.5">Age: {item.ageRange}</p>
              <div className="flex items-center gap-2 mt-2">
                <TierBadge tier={item.qualityTier} />
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:bg-stone-700">
              <X size={18} className="text-[#6b7c6b]" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Heavy Metal Warning */}
          {item.hasHeavyMetalRisk && item.heavyMetalDetails && (
            <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: "#fff5f5", border: "1px solid #fca5a5" }}>
              <AlertTriangle size={16} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#dc2626]">Heavy Metal Risk</p>
                <p className="text-xs text-[#7f1d1d] mt-0.5">{item.heavyMetalDetails}</p>
              </div>
            </div>
          )}

          {/* Concerns */}
          {item.concerns.length > 0 && (
            <div>
              <h3 className="font-semibold text-[#1a2e1a] text-sm mb-2 flex items-center gap-2">
                <AlertTriangle size={14} className="text-[#dc6803]" /> Concerns
              </h3>
              <div className="space-y-1.5">
                {item.concerns.map((c, i) => (
                  <div key={i} className="text-sm text-[#92400e] flex items-start gap-2">
                    <span className="text-[#dc6803] mt-0.5">⚠</span> {c}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          {item.benefits.length > 0 && (
            <div>
              <h3 className="font-semibold text-[#1a2e1a] text-sm mb-2 flex items-center gap-2">
                <CheckCircle size={14} className="text-[#145A3A]" /> Benefits
              </h3>
              <div className="space-y-1.5">
                {item.benefits.map((b, i) => (
                  <div key={i} className="text-sm text-[#2d5a2d] flex items-start gap-2">
                    <span className="text-[#145A3A] mt-0.5">✓</span> {b}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attributes */}
          <div className="flex flex-wrap gap-2">
            {item.isOrganic && <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#f0faf0", color: "#145A3A", border: "1px solid #b8e8b8" }}>USDA Organic</span>}
            {item.isNonGMO && <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#f0f8ff", color: "#2d7d9a", border: "1px solid #b8d8e8" }}>Non-GMO</span>}
            {item.isLowHeavyMetals && <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#f0faf0", color: "#145A3A", border: "1px solid #b8e8b8" }}>✓ Low Heavy Metals</span>}
          </div>

          {/* Ingredients */}
          {item.ingredients && (
            <div>
              <h3 className="font-semibold text-[#1a2e1a] text-sm mb-2">Ingredients</h3>
              <p className="text-xs text-[#6b7c6b] leading-relaxed">{item.ingredients}</p>
            </div>
          )}

          {/* Parent Tip */}
          <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, #f0faf0, #e8f5e8)", border: "1px solid #b8e8b8" }}>
            <p className="text-xs font-semibold text-[#145A3A] uppercase tracking-wide mb-1">👶 Parent Tip</p>
            <p className="text-sm text-[#2d5a2d]">{item.parentTip}</p>
          </div>

          {/* Barcode */}
          {item.barcode && (
            <div className="text-center">
              <p className="text-xs text-[#9aaa9a]">Barcode: <span className="font-mono">{item.barcode}</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BabyKidsGuidePage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<BabyKidsCategory>("all");
  const [selectedTier, setSelectedTier] = useState<BabyKidsTier | "all">("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BabyKidsEntry | null>(null);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [lowHeavyMetalsOnly, setLowHeavyMetalsOnly] = useState(false);
  const [noAddedSugarsOnly, setNoAddedSugarsOnly] = useState(false);
  const [noArtificialColors, setNoArtificialColors] = useState(false);

  const filtered = useMemo(() => {
    return ALL_BABY_KIDS.filter(item => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (selectedTier !== "all" && item.qualityTier !== selectedTier) return false;
      if (organicOnly && !item.isOrganic) return false;
      if (lowHeavyMetalsOnly && item.hasHeavyMetalRisk) return false;
      if (noAddedSugarsOnly && item.hasAddedSugars) return false;
      if (noArtificialColors && item.hasArtificialColors) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => b.score - a.score);
  }, [selectedCategory, selectedTier, search, organicOnly, lowHeavyMetalsOnly, noAddedSugarsOnly, noArtificialColors]);

  const stats = useMemo(() => {
    const safe = ALL_BABY_KIDS.filter(s => s.qualityTier === "elite" || s.qualityTier === "good").length;
    const avoid = ALL_BABY_KIDS.filter(s => s.qualityTier === "avoid").length;
    const heavyMetal = ALL_BABY_KIDS.filter(s => s.hasHeavyMetalRisk).length;
    return { safe, avoid, heavyMetal, total: ALL_BABY_KIDS.length };
  }, []);

  return (
    <div className="ec-page-bg">
      <GuideHero imageUrl="/manus-storage/baby-kids_v3_81e9cd4a.webp" />
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ background: "var(--background)", borderBottom: "1px solid #e8f0e8" }}>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setLocation("/explore")}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} className="text-stone-600" />
          </button>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#fff0f5" }}>
            <Baby size={18} className="text-[#e05a8a]" />
          </div>
          <div>
            <h1 className="font-bold text-[#1a2e1a] text-lg leading-none">Baby & Kids Guide</h1>
            <p className="text-xs text-[#6b7c6b] mt-0.5">{stats.total} products rated for safety</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aaa9a]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search baby & kids food..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "white", border: "1px solid #e8f0e8", color: "#1a2e1a" }} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} className="text-[#9aaa9a]" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {BABY_KIDS_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={selectedCategory === cat.id
                ? { background: "#1a2e1a", color: "white" }
                : { background: "white", color: "#6b7c6b", border: "1px solid #e8f0e8" }}>
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 rounded-xl bg-white dark:bg-stone-800" style={{ border: "1px solid #e8f0e8" }}>
            <p className="text-lg font-bold text-[#145A3A]">{stats.safe}</p>
            <p className="text-xs text-[#6b7c6b]">Safe Picks</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white dark:bg-stone-800" style={{ border: "1px solid #e8f0e8" }}>
            <p className="text-lg font-bold text-[#dc2626]">{stats.avoid}</p>
            <p className="text-xs text-[#6b7c6b]">Avoid</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white dark:bg-stone-800" style={{ border: "1px solid #e8f0e8" }}>
            <p className="text-lg font-bold text-[#dc6803]">{stats.heavyMetal}</p>
            <p className="text-xs text-[#6b7c6b]">Heavy Metal Risk</p>
          </div>
        </div>

        {/* Heavy Metal Alert */}
        <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: "#fff5f5", border: "1px solid #fca5a5" }}>
          <AlertTriangle size={14} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#7f1d1d]">
            <strong>2021 Congressional Report:</strong> Found arsenic, lead, cadmium, and mercury in major baby food brands including Gerber, Beech-Nut, and Happy Baby. Avoid rice cereal and root vegetable purees from non-tested brands.
          </p>
        </div>

        {/* Filters Toggle */}
        <button onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-stone-800 text-sm font-medium"
          style={{ border: "1px solid #e8f0e8", color: "#1a2e1a" }}>
          <span>Filters & Quality Tier</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showFilters && (
          <div className="bg-white dark:bg-stone-800 dark:bg-stone-900 rounded-2xl p-4 space-y-4" style={{ border: "1px solid #e8f0e8" }}>
            {/* Tier Filter */}
            <div>
              <p className="text-xs font-semibold text-[#6b7c6b] uppercase tracking-wide mb-2">Quality Tier</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedTier("all")}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={selectedTier === "all" ? { background: "#1a2e1a", color: "white" } : { background: "#f8faf8", color: "#6b7c6b", border: "1px solid #e8f0e8" }}>
                  All Tiers
                </button>
                {TIER_ORDER.map(tier => {
                  const cfg = BABY_KIDS_TIER_CONFIG[tier];
                  return (
                    <button key={tier} onClick={() => setSelectedTier(tier)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                      style={selectedTier === tier ? { background: cfg.color, color: "white" } : { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Filters */}
            <div>
              <p className="text-xs font-semibold text-[#6b7c6b] uppercase tracking-wide mb-2">Quick Filters</p>
              <div className="space-y-2">
                {[
                  { label: "Organic Only", value: organicOnly, set: setOrganicOnly },
                  { label: "No Heavy Metal Risk", value: lowHeavyMetalsOnly, set: setLowHeavyMetalsOnly },
                  { label: "No Added Sugars", value: noAddedSugarsOnly, set: setNoAddedSugarsOnly },
                  { label: "No Artificial Colors", value: noArtificialColors, set: setNoArtificialColors },
                ].map(f => (
                  <label key={f.label} className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => f.set(!f.value)}
                      className="w-5 h-5 rounded flex items-center justify-center transition-all"
                      style={{ background: f.value ? "#1a2e1a" : "white", border: `2px solid ${f.value ? "#1a2e1a" : "#d0d8d0"}` }}>
                      {f.value && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-[#1a2e1a]">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div>
          <p className="text-xs text-[#6b7c6b] mb-3">{filtered.length} products</p>
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">👶</p>
                <p className="text-[#6b7c6b] text-sm">No products match your filters</p>
              </div>
            ) : (
              filtered.map(item => (
                <BabyKidsCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
              ))
            )}
          </div>
        </div>
      </div>

      {selectedItem && (
        <BabyKidsModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
