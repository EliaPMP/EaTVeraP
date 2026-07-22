/**
 * EatVera — Supplement & Protein Guide Page
 * Design: Clean light aesthetic — warm white bg, sage green accents, DM Sans
 * Rates protein powders, pre-workouts, vitamins, creatine, BCAAs, omega-3, greens, collagen, probiotics
 */

import ProductImage from "@/components/ProductImage";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import PriceRangeFilter, { type PriceRange, matchesPriceRange, isBestValue } from "@/components/PriceRangeFilter";
import {
  ALL_SUPPLEMENTS,
  SUPPLEMENT_CATEGORIES,
  SUPPLEMENT_TIER_CONFIG,
  SupplementCategory,
  SupplementTier,
  SupplementEntry,
  getSupplementColor,
} from "@/lib/supplementDatabase";
import { Search, X, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Shield, FlaskConical , ArrowLeft } from "lucide-react";
import { GuideHero } from "@/components/GuideHero";

const TIER_ORDER: SupplementTier[] = ["elite", "good", "average", "poor", "avoid"];

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const color = getSupplementColor(score);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size}>
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8f0e8" strokeWidth={5} />
      {/* Progress arc — starts at top (rotate -90deg around center) */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Score text — SVG-native positioning, no CSS transform needed */}
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={size * 0.26}
        fontWeight={700}
        fontFamily="DM Sans, sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

function TierBadge({ tier }: { tier: SupplementTier }) {
  const cfg = SUPPLEMENT_TIER_CONFIG[tier];
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
      className="text-xs font-semibold px-2 py-0.5 rounded-full">
      {cfg.label}
    </span>
  );
}

function FlagDot({ active, label, color }: { active: boolean; label: string; color: string }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: `${color}15`, color, border: `1px solid ${color}40` }}>
      ⚠ {label}
    </span>
  );
}

function SupplementCard({ item, onClick }: { item: SupplementEntry; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className="bg-white dark:bg-stone-800 dark:bg-stone-900 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md active:scale-98"
      style={{ border: "1px solid #e8f0e8", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div className="flex items-start gap-3">
        <ProductImage barcode={item.barcode} name={item.name} brand={item.brand} imageUrl={item.imageUrl} category="Supplement" size={52} />
        <ScoreRing score={item.score} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#1a2e1a] text-sm leading-tight">{item.name}</p>
              <p className="text-xs text-[#6b7c6b] mt-0.5">{item.brand}</p>
              {item.averagePrice !== undefined && (
                <p className="text-xs font-bold mt-0.5" style={{ color: "#145A3A" }}>
                  ${item.averagePrice.toFixed(2)} <span className="font-normal text-gray-400">est.</span>
                  {isBestValue(item.score, item.averagePrice) && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "#dcf4dc", color: "#145A3A" }}>⭐ Best Value</span>
                  )}
                </p>
              )}
            </div>
            <TierBadge tier={item.qualityTier} />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <FlagDot active={item.hasSucralose || item.hasAcesulfameK} label="Artificial Sweeteners" color="#dc6803" />
            <FlagDot active={item.hasSeedOilDerived} label="Seed Oil Derived" color="#dc2626" />
            <FlagDot active={item.hasProprietary} label="Proprietary Blend" color="#d97706" />
            <FlagDot active={item.hasArtificialColors} label="Artificial Dyes" color="#9333ea" />
            <FlagDot active={item.hasHeavyMetalRisk} label="Heavy Metal Risk" color="#dc2626" />
            {item.isThirdPartyTested && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#f0faf0", color: "#145A3A", border: "1px solid #b8e8b8" }}>
                ✓ {item.testingCert}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SupplementModal({ item, onClose }: { item: SupplementEntry; onClose: () => void }) {
  const cfg = SUPPLEMENT_TIER_CONFIG[item.qualityTier];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-stone-800 rounded-t-3xl max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }}
        onClick={e => e.stopPropagation()}>
        {/* Hero Product Image */}
        <div className="w-full h-44 bg-stone-50 flex items-center justify-center overflow-hidden">
          <ProductImage barcode={item.barcode} name={item.name} brand={item.brand} imageUrl={item.imageUrl} category="Supplement" size={160} className="!w-full !h-full !rounded-none" />
        </div>
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: "#e8f0e8" }}>
          <div className="flex items-start gap-4">
            <ScoreRing score={item.score} size={64} />
            <div className="flex-1">
              <h2 className="font-bold text-[#1a2e1a] text-lg leading-tight">{item.name}</h2>
              <p className="text-sm text-[#6b7c6b] mt-0.5">{item.brand}</p>
              <div className="flex items-center gap-2 mt-2">
                <TierBadge tier={item.qualityTier} />
                <span className="text-xs text-[#6b7c6b] capitalize">{item.category === "preworkout" ? "Pre-Workout" : item.category}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:bg-stone-700">
              <X size={18} className="text-[#6b7c6b]" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Certifications */}
          {item.isThirdPartyTested && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#f0faf0", border: "1px solid #b8e8b8" }}>
              <Shield size={18} className="text-[#145A3A]" />
              <div>
                <p className="text-sm font-semibold text-[#145A3A]">Third-Party Tested</p>
                <p className="text-xs text-[#2d5a2d]">{item.testingCert}</p>
              </div>
            </div>
          )}

          {/* Quality Flags */}
          {(item.hasSucralose || item.hasAcesulfameK || item.hasAspartame || item.hasMaltodextrin ||
            item.hasProprietary || item.hasSoyLecithin || item.hasSeedOilDerived ||
            item.hasArtificialColors || item.hasHeavyMetalRisk) && (
            <div>
              <h3 className="font-semibold text-[#1a2e1a] text-sm mb-2 flex items-center gap-2">
                <AlertTriangle size={14} className="text-[#dc6803]" /> Quality Concerns
              </h3>
              <div className="space-y-1.5">
                {item.hasSucralose && <div className="text-sm text-[#dc6803] flex items-center gap-2">⚠ Contains sucralose (artificial sweetener)</div>}
                {item.hasAcesulfameK && <div className="text-sm text-[#dc6803] flex items-center gap-2">⚠ Contains acesulfame potassium (Ace-K)</div>}
                {item.hasAspartame && <div className="text-sm text-[#dc6803] flex items-center gap-2">⚠ Contains aspartame</div>}
                {item.hasMaltodextrin && <div className="text-sm text-[#d97706] flex items-center gap-2">⚠ Contains maltodextrin (filler)</div>}
                {item.hasProprietary && <div className="text-sm text-[#d97706] flex items-center gap-2">⚠ Proprietary blend — doses hidden</div>}
                {item.hasSoyLecithin && <div className="text-sm text-[#d97706] flex items-center gap-2">⚠ Contains soy lecithin</div>}
                {item.hasSeedOilDerived && <div className="text-sm text-[#dc2626] flex items-center gap-2">⚠ Contains seed oil-derived ingredients</div>}
                {item.hasArtificialColors && <div className="text-sm text-[#9333ea] flex items-center gap-2">⚠ Contains artificial dyes (FD&C colors)</div>}
                {item.hasHeavyMetalRisk && <div className="text-sm text-[#dc2626] flex items-center gap-2">⚠ Heavy metal contamination risk (plant proteins)</div>}
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

          {/* Nutrition */}
          {item.nutrients && (
            <div>
              <h3 className="font-semibold text-[#1a2e1a] text-sm mb-2">Nutrition per Serving ({item.servingSize})</h3>
              <div className="grid grid-cols-3 gap-2">
                {item.nutrients.calories !== undefined && (
                  <div className="text-center p-2 rounded-xl" style={{ background: "#f8faf8" }}>
                    <p className="text-lg font-bold text-[#1a2e1a]">{item.nutrients.calories}</p>
                    <p className="text-xs text-[#6b7c6b]">Calories</p>
                  </div>
                )}
                {item.nutrients.protein !== undefined && (
                  <div className="text-center p-2 rounded-xl" style={{ background: "#f8faf8" }}>
                    <p className="text-lg font-bold text-[#1a2e1a]">{item.nutrients.protein}g</p>
                    <p className="text-xs text-[#6b7c6b]">Protein</p>
                  </div>
                )}
                {item.nutrients.carbs !== undefined && (
                  <div className="text-center p-2 rounded-xl" style={{ background: "#f8faf8" }}>
                    <p className="text-lg font-bold text-[#1a2e1a]">{item.nutrients.carbs}g</p>
                    <p className="text-xs text-[#6b7c6b]">Carbs</p>
                  </div>
                )}
                {item.nutrients.fat !== undefined && (
                  <div className="text-center p-2 rounded-xl" style={{ background: "#f8faf8" }}>
                    <p className="text-lg font-bold text-[#1a2e1a]">{item.nutrients.fat}g</p>
                    <p className="text-xs text-[#6b7c6b]">Fat</p>
                  </div>
                )}
                {item.nutrients.sodium !== undefined && (
                  <div className="text-center p-2 rounded-xl" style={{ background: "#f8faf8" }}>
                    <p className="text-lg font-bold text-[#1a2e1a]">{item.nutrients.sodium}mg</p>
                    <p className="text-xs text-[#6b7c6b]">Sodium</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Protein Source */}
          {item.proteinSource && (
            <div className="p-3 rounded-xl" style={{ background: "#f8faf8", border: "1px solid #e8f0e8" }}>
              <p className="text-xs text-[#6b7c6b] font-medium uppercase tracking-wide mb-1">Protein Source</p>
              <p className="text-sm text-[#1a2e1a] font-medium">{item.proteinSource}</p>
            </div>
          )}

          {/* Ingredients */}
          {item.ingredients && (
            <div>
              <h3 className="font-semibold text-[#1a2e1a] text-sm mb-2">Ingredients</h3>
              <p className="text-xs text-[#6b7c6b] leading-relaxed">{item.ingredients}</p>
            </div>
          )}

          {/* Attributes */}
          <div className="flex flex-wrap gap-2">
            {item.isOrganic && <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#f0faf0", color: "#145A3A", border: "1px solid #b8e8b8" }}>USDA Organic</span>}
            {item.isGlutenFree && <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#fff8f0", color: "#d97706", border: "1px solid #fde68a" }}>Gluten-Free</span>}
            {item.isVegan && <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#f0f8ff", color: "#2d7d9a", border: "1px solid #b8d8e8" }}>Vegan</span>}
          </div>

          {/* Buy Tip */}
          <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, #f0faf0, #e8f5e8)", border: "1px solid #b8e8b8" }}>
            <p className="text-xs font-semibold text-[#145A3A] uppercase tracking-wide mb-1">💡 EatVera Tip</p>
            <p className="text-sm text-[#2d5a2d]">{item.buyTip}</p>
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

export default function SupplementGuidePage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<SupplementCategory>("all");
  const [selectedTier, setSelectedTier] = useState<SupplementTier | "all">("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SupplementEntry | null>(null);
  const [noArtificialSweeteners, setNoArtificialSweeteners] = useState(false);
  const [noProprietaryBlends, setNoProprietaryBlends] = useState(false);
  const [thirdPartyOnly, setThirdPartyOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<PriceRange>("all");

  const filtered = useMemo(() => {
    return ALL_SUPPLEMENTS.filter(item => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (selectedTier !== "all" && item.qualityTier !== selectedTier) return false;
      if (noArtificialSweeteners && item.hasArtificialSweeteners) return false;
      if (noProprietaryBlends && item.hasProprietary) return false;
      if (thirdPartyOnly && !item.isThirdPartyTested) return false;
      if (!matchesPriceRange(item.averagePrice, priceRange)) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => b.score - a.score);
  }, [selectedCategory, selectedTier, search, noArtificialSweeteners, noProprietaryBlends, thirdPartyOnly, priceRange]);

  const stats = useMemo(() => {
    const elite = ALL_SUPPLEMENTS.filter(s => s.qualityTier === "elite" || s.qualityTier === "good").length;
    const avoid = ALL_SUPPLEMENTS.filter(s => s.qualityTier === "avoid" || s.qualityTier === "poor").length;
    const tested = ALL_SUPPLEMENTS.filter(s => s.isThirdPartyTested).length;
    return { elite, avoid, tested, total: ALL_SUPPLEMENTS.length };
  }, []);

  return (
    <div className="ec-page-bg">
      <GuideHero imageUrl="/manus-storage/supplements_d407d976.jpg" />
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ background: "var(--background)", borderBottom: "1px solid #e8f0e8" }}>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setLocation("/explore")}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} className="text-stone-600" />
          </button>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "#f0faf0" }}>
            <FlaskConical size={18} className="text-[#2d7d9a]" />
          </div>
          <div>
            <h1 className="font-bold text-[#1a2e1a] text-lg leading-none">Supplement Guide</h1>
            <p className="text-xs text-[#6b7c6b] mt-0.5">{stats.total} products rated</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aaa9a]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search supplements..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "white", border: "1px solid #e8f0e8", color: "#1a2e1a" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} className="text-[#9aaa9a]" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SUPPLEMENT_CATEGORIES.map(cat => (
            <button key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={selectedCategory === cat.id
                ? { background: "#1a2e1a", color: "white" }
                : { background: "white", color: "#6b7c6b", border: "1px solid #e8f0e8" }}>
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Price range filter */}
        <div className="pt-2">
          <PriceRangeFilter value={priceRange} onChange={setPriceRange} accentColor="#1a2e1a" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 rounded-xl bg-white dark:bg-stone-800" style={{ border: "1px solid #e8f0e8" }}>
            <p className="text-lg font-bold text-[#145A3A]">{stats.elite}</p>
            <p className="text-xs text-[#6b7c6b]">Good+</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white dark:bg-stone-800" style={{ border: "1px solid #e8f0e8" }}>
            <p className="text-lg font-bold text-[#dc2626]">{stats.avoid}</p>
            <p className="text-xs text-[#6b7c6b]">Poor/Avoid</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white dark:bg-stone-800" style={{ border: "1px solid #e8f0e8" }}>
            <p className="text-lg font-bold text-[#2d7d9a]">{stats.tested}</p>
            <p className="text-xs text-[#6b7c6b]">3rd-Party Tested</p>
          </div>
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
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={selectedTier === "all" ? { background: "#1a2e1a", color: "white" } : { background: "#f8faf8", color: "#6b7c6b", border: "1px solid #e8f0e8" }}>
                  All Tiers
                </button>
                {TIER_ORDER.map(tier => {
                  const cfg = SUPPLEMENT_TIER_CONFIG[tier];
                  return (
                    <button key={tier} onClick={() => setSelectedTier(tier)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
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
                  { label: "No Artificial Sweeteners", value: noArtificialSweeteners, set: setNoArtificialSweeteners },
                  { label: "No Proprietary Blends", value: noProprietaryBlends, set: setNoProprietaryBlends },
                  { label: "Third-Party Tested Only", value: thirdPartyOnly, set: setThirdPartyOnly },
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

        {/* Warning Banner */}
        <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: "#fffbf0", border: "1px solid #fde68a" }}>
          <AlertTriangle size={14} className="text-[#d97706] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#92400e]">
            <strong>Supplement industry is largely unregulated.</strong> Look for NSF Certified for Sport, Informed Sport, or USP Verified seals. Consult a healthcare provider before starting any supplement.
          </p>
        </div>

        {/* Results */}
        <div>
          <p className="text-xs text-[#6b7c6b] mb-3">{filtered.length} products</p>
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🔬</p>
                <p className="text-[#6b7c6b] text-sm">No supplements match your filters</p>
              </div>
            ) : (
              filtered.map(item => (
                <SupplementCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
              ))
            )}
          </div>
        </div>
      </div>

      {selectedItem && (
        <SupplementModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
