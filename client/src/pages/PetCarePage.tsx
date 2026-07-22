/**
 * Pet Care Guide Page
 * Dog & cat food quality ratings — dry, wet, and treats
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, ChevronDown, ChevronUp, PawPrint, AlertTriangle, CheckCircle, X, ArrowLeft } from "lucide-react";
import { ALL_PET_PRODUCTS, PET_CATEGORIES, type PetProduct } from "@/lib/petCareDatabase";
import { GuideHero } from "@/components/GuideHero";

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const size = 48;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e7e5e4" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute font-bold text-xs" style={{ color, fontFamily: "'DM Mono', monospace" }}>
        {score}
      </span>
    </div>
  );
}

function GradeBadge({ grade, color }: { grade: string; color: string }) {
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
      style={{ background: `${color}18`, color }}
    >
      {grade}
    </span>
  );
}

function PriceTag({ price }: { price: string }) {
  return (
    <span className="text-[10px] font-mono text-stone-400">{price}</span>
  );
}

function ProductCard({ product }: { product: PetProduct }) {
  const [expanded, setExpanded] = useState(false);

  const categoryLabel = PET_CATEGORIES.find(c => c.key === product.category)?.label ?? product.category;

  return (
    <div className="rounded-2xl border border-stone-100 bg-white dark:bg-stone-800 overflow-hidden mb-2.5">
      {/* Header row */}
      <div className="flex items-center">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded(!expanded)}
          onKeyDown={(e) => e.key === "Enter" && setExpanded(!expanded)}
          className="flex-1 p-3.5 flex items-center gap-3 cursor-pointer"
        >
          {/* Product image */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: "#f5f5f4" }}>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain p-0.5"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <PawPrint size={20} className="text-stone-300" />
            )}
          </div>
          <ScoreCircle score={product.score} color={product.color} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <GradeBadge grade={product.grade} color={product.color} />
              <PriceTag price={product.priceRange} />
              <span className="text-[10px] text-stone-300">·</span>
              <span className="text-[10px] text-stone-400">{categoryLabel}</span>
            </div>
            <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm leading-tight truncate">{product.name}</p>
            <p className="text-xs text-stone-400 truncate">{product.brand}</p>
          </div>
          {expanded ? <ChevronUp size={14} className="text-stone-300 flex-shrink-0" /> : <ChevronDown size={14} className="text-stone-300 flex-shrink-0" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3.5 pb-3.5 border-t border-stone-50 space-y-3">
          {/* Protein source */}
          <div className="mt-3">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Protein Source</p>
            <p className="text-xs text-stone-700">{product.proteinSource}</p>
          </div>

          {/* Main ingredients */}
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Top Ingredients</p>
            <div className="flex flex-wrap gap-1.5">
              {product.mainIngredients.map((ing, i) => (
                <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                  {i + 1}. {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Red flags */}
          {product.redFlags.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <AlertTriangle size={10} /> Red Flags
              </p>
              <div className="space-y-1">
                {product.redFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <X size={10} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-red-600">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Green flags */}
          {product.greenFlags.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#0B3D2E] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CheckCircle size={10} /> What's Good
              </p>
              <div className="space-y-1">
                {product.greenFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <CheckCircle size={10} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-[#145A3A]">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="rounded-xl p-2.5" style={{ background: "#f0fdf4" }}>
            <p className="text-xs text-green-800 leading-relaxed">{product.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PetCarePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score" | "name">("score");
  const [petFilter, setPetFilter] = useState<"all" | "dog" | "cat">("all");

  const filtered = useMemo(() => {
    let list = [...ALL_PET_PRODUCTS];

    if (petFilter !== "all") {
      list = list.filter(p => p.petType === petFilter || p.petType === "both");
    }

    if (activeCategory !== "all") {
      list = list.filter(p => p.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.proteinSource.toLowerCase().includes(q) ||
        p.mainIngredients.some(i => i.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => sortBy === "score" ? b.score - a.score : a.name.localeCompare(b.name));
    return list;
  }, [search, activeCategory, sortBy, petFilter]);

  const stats = useMemo(() => {
    const base = ALL_PET_PRODUCTS;
    return {
      total: base.length,
      aGrade: base.filter(p => p.score >= 85).length,
      fGrade: base.filter(p => p.score < 40).length,
    };
  }, []);

  // Visible categories depend on pet filter
  const visibleCategories = useMemo(() => {
    if (petFilter === "dog") {
      return PET_CATEGORIES.filter(c => c.key === "all" || c.key.startsWith("dog"));
    }
    if (petFilter === "cat") {
      return PET_CATEGORIES.filter(c => c.key === "all" || c.key.startsWith("cat"));
    }
    return PET_CATEGORIES;
  }, [petFilter]);

  return (
    <div className="ec-page-bg pb-28">
      <GuideHero imageUrl="/manus-storage/petcare_v2_6ecce63f.jpg" />
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        {/* Back arrow */}
        <button
          onClick={() => setLocation("/explore")}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors mb-3"
          aria-label="Back to Explore"
        >
          <ArrowLeft size={16} className="text-stone-600 dark:text-stone-300" />
        </button>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
            <PawPrint size={16} className="text-white" />
          </div>
          <h1 className="font-bold text-xl text-stone-800 dark:text-stone-100" style={{ letterSpacing: "-0.02em" }}>Pet Care Guide</h1>
        </div>
        <p className="text-xs text-stone-400 ml-10">Dog & cat food quality ratings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 px-4 mb-4">
        {[
          { value: stats.total, label: "Products", color: "#7c3aed" },
          { value: stats.aGrade, label: "Grade A", color: "#145A3A" },
          { value: stats.fGrade, label: "Avoid", color: "#dc2626" },
        ].map(({ value, label, color }) => (
          <div key={label} className="rounded-2xl bg-white dark:bg-stone-800 border border-stone-100 text-center py-3 px-2">
            <div className="font-bold text-lg" style={{ color, fontFamily: "'DM Mono', monospace" }}>{value}</div>
            <div className="text-[10px] text-stone-400 font-medium uppercase tracking-wider mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Pet type toggle */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 bg-stone-100 rounded-2xl p-1">
          {(["all", "dog", "cat"] as const).map(type => (
            <button
              key={type}
              onClick={() => { setPetFilter(type); setActiveCategory("all"); }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
                petFilter === type
                  ? "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 shadow-sm"
                  : "text-stone-500"
              }`}
            >
              {type === "all" ? "All Pets" : type === "dog" ? "🐶 Dogs" : "🐱 Cats"}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 px-3 py-2.5">
          <Search size={14} className="text-stone-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search brand, protein, ingredient…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm text-stone-700 placeholder-stone-300 bg-transparent outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-stone-300 hover:text-stone-500">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="px-4 mb-3 overflow-x-auto">
        <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
          {visibleCategories.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === key
                  ? "text-white"
                  : "bg-white dark:bg-stone-800 border border-stone-200 text-stone-600"
              }`}
              style={activeCategory === key ? { background: "#7c3aed" } : {}}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between px-4 mb-3">
        <p className="text-xs text-stone-400">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-2">
          {(["score", "name"] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                sortBy === s ? "bg-stone-800 text-white" : "bg-white dark:bg-stone-800 border border-stone-200 text-stone-500"
              }`}
            >
              {s === "score" ? "Best First" : "A–Z"}
            </button>
          ))}
        </div>
      </div>

      {/* Product list */}
      <div className="px-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#f3e8ff" }}>
              <PawPrint size={28} style={{ color: "#7c3aed" }} />
            </div>
            <h3 className="font-bold text-stone-700 text-base mb-2">No products found</h3>
            <p className="text-stone-400 text-sm">Try a different search or category</p>
          </div>
        ) : (
          filtered.map(product => <ProductCard key={product.id} product={product} />)
        )}
      </div>

      {/* Info box */}
      <div className="mx-4 mt-4 rounded-2xl p-4 border border-amber-100" style={{ background: "#fffbf0" }}>
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-700 mb-1">Rating Criteria</p>
            <p className="text-[11px] text-amber-600 leading-relaxed">
              Scores are based on protein source quality, filler content (corn, wheat, soy), preservatives (BHA/BHT/ethoxyquin), artificial colors, by-product meal specificity, and overall ingredient transparency. Always consult your vet for dietary changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
