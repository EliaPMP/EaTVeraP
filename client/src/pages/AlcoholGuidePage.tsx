/**
 * EatVera Alcohol Guide Page
 *
 * Comprehensive guide to spirits, wines, beers, and cocktails with quality ratings.
 * Users can search, filter by type, and view detailed health metrics for each drink.
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, Filter, Wine, Beer, Droplets, Flame, ArrowLeft } from "lucide-react";
import {
  ALL_ALCOHOL,
  ALL_SPIRITS,
  ALL_WINES,
  ALL_BEERS,
  ALL_COCKTAILS,
  searchAlcohol,
  filterByType,
  type AlcoholProduct,
} from "@/lib/alcoholDatabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuideHero } from "@/components/GuideHero";

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const size = 48;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e7e5e4" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute font-bold text-xs" style={{ color, fontFamily: "'DM Mono', monospace" }}>
        {score}
      </span>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#0B3D2E";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#dc2626";
}

function AlcoholCard({ product }: { product: AlcoholProduct }) {
  const [expanded, setExpanded] = useState(false);
  const color = getScoreColor(product.qualityScore);

  const typeIcons: Record<string, React.ReactNode> = {
    spirit: <Droplets size={16} />,
    wine: <Wine size={16} />,
    beer: <Beer size={16} />,
    cocktail: <Flame size={16} />,
    cider: <Beer size={16} />,
    liqueur: <Droplets size={16} />,
  };

  return (
    <div
      className="border border-stone-200 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Product Image */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: "#f5f5f4" }}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" loading="eager" />
          ) : (
            <div className="text-stone-400">{typeIcons[product.type]}</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm truncate">{product.name}</h3>
          </div>
          <p className="text-stone-400 text-xs mb-2">{product.category}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded">{product.abv}% ABV</span>
            <span className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded">{product.caloriesPerServing} cal</span>
            <span className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded">{product.sugarPerServing}g sugar</span>
          </div>
        </div>
        <ScoreCircle score={product.qualityScore} color={color} />
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-stone-200 space-y-3">
          <div>
            <p className="text-xs font-semibold text-stone-600 mb-1">Quality: {product.scoreLabel}</p>
            <p className="text-xs text-stone-600">{product.healthNotes}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-stone-50 p-2 rounded">
              <p className="text-stone-500 font-mono">Serving</p>
              <p className="font-semibold text-stone-800 dark:text-stone-100">{product.servingSize}</p>
            </div>
            <div className="bg-stone-50 p-2 rounded">
              <p className="text-stone-500 font-mono">Carbs</p>
              <p className="font-semibold text-stone-800 dark:text-stone-100">{product.carbs}g</p>
            </div>
          </div>

          {product.additives.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-600 mb-1">Additives:</p>
              <div className="flex flex-wrap gap-1">
                {product.additives.map((additive, i) => (
                  <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    {additive}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.hasArtificialSweeteners && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-700 font-semibold">⚠️ Contains artificial sweeteners</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AlcoholGuidePage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);

  const filtered = useMemo(() => {
    let results = ALL_ALCOHOL;

    if (searchQuery) {
      results = searchAlcohol(searchQuery);
    }

    if (selectedType) {
      results = results.filter((a) => a.type === selectedType);
    }

    results = results.filter((a) => a.qualityScore >= minScore);

    return results.sort((a, b) => b.qualityScore - a.qualityScore);
  }, [searchQuery, selectedType, minScore]);

  const typeOptions = [
    { key: "spirit", label: "Spirits", count: ALL_SPIRITS.length },
    { key: "wine", label: "Wines", count: ALL_WINES.length },
    { key: "beer", label: "Beers", count: ALL_BEERS.length },
    { key: "cocktail", label: "Cocktails", count: ALL_COCKTAILS.length },
  ];

  return (
    <div className="ec-page-bg pb-24">
      <GuideHero imageUrl="/manus-storage/alcohol_2b128bd3.jpg" />
      {/* Header */}
      <div className="sticky top-0 z-10 ec-sticky-header px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setLocation("/explore")}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <ArrowLeft size={18} className="text-stone-600" />
          </button>
          <h1 className="font-bold text-xl text-stone-800 dark:text-stone-100">Alcohol Guide</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-3 text-stone-400" />
          <Input
            placeholder="Search spirits, wines, beers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(null)}
            className="whitespace-nowrap"
          >
            All ({ALL_ALCOHOL.length})
          </Button>
          {typeOptions.map((opt) => (
            <Button
              key={opt.key}
              variant={selectedType === opt.key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(opt.key)}
              className="whitespace-nowrap"
            >
              {opt.label} ({opt.count})
            </Button>
          ))}
        </div>

        {/* Quality Score Filter */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-stone-600">Min Quality Score</label>
            <span className="text-xs font-mono text-stone-800 dark:text-stone-100">{minScore}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-500 text-sm">No drinks match your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-stone-500 font-mono uppercase tracking-wider">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </p>
            {filtered.map((product) => (
              <AlcoholCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-6 border-t border-stone-200 bg-white dark:bg-stone-800">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm mb-3">Quality Score Guide</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full" style={{ background: "#0B3D2E" }} />
            <p className="text-xs text-stone-600">80–100: Premium (clean, minimal additives)</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full" style={{ background: "#eab308" }} />
            <p className="text-xs text-stone-600">60–79: Good (moderate quality)</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full" style={{ background: "#f97316" }} />
            <p className="text-xs text-stone-600">40–59: Fair (higher sugar/additives)</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full" style={{ background: "#dc2626" }} />
            <p className="text-xs text-stone-600">1–39: Poor (high sugar, many additives)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
