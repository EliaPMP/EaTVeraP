/**
 * EatVera Water Guide Page
 *
 * Comprehensive guide to bottled waters, water filters, and tap water sources.
 * Users can search, filter by type, and view detailed quality metrics for each water.
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, Droplets, Filter , ArrowLeft } from "lucide-react";
import {
  ALL_WATERS,
  ALL_BOTTLED,
  ALL_SPARKLING,
  ALL_FILTERED,
  ALL_TAP,
  searchWater,
  getScoreColor,
  type WaterProduct,
  type WaterType,
} from "@/lib/waterDatabase";
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

const TYPE_ICONS: Record<WaterType, React.ReactNode> = {
  bottled: <Droplets size={15} />,
  sparkling: <Droplets size={15} />,
  filtered: <Filter size={15} />,
  tap: <Droplets size={15} />,
};

const TYPE_COLORS: Record<WaterType, string> = {
  bottled: "#0ea5e9",
  sparkling: "#6366f1",
  filtered: "#10b981",
  tap: "#64748b",
};

function WaterCard({ product }: { product: WaterProduct }) {
  const [expanded, setExpanded] = useState(false);
  const color = getScoreColor(product.qualityScore);
  const typeColor = TYPE_COLORS[product.type];

  const mineralEntries = Object.entries(product.minerals).filter(([, v]) => v !== undefined && v > 0);

  return (
    <div
      className="border border-stone-200 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all bg-white dark:bg-stone-800"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        {product.imageUrl && (
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-stone-400" style={{ color: typeColor }}>{TYPE_ICONS[product.type]}</div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 dark:text-stone-100 text-sm leading-tight">{product.name}</h3>
          </div>
          <p className="text-stone-400 dark:text-stone-500 dark:text-stone-400 text-xs mb-2">{product.brand} · {product.country}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
              style={{ background: `${typeColor}18`, color: typeColor }}
            >
              {product.type}
            </span>
            <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded">pH {product.ph}</span>
            <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded">TDS {product.tds} ppm</span>
          </div>
        </div>
        <ScoreCircle score={product.qualityScore} color={color} />
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
          {/* Source */}
          <div>
            <p className="text-xs font-semibold text-stone-600 mb-1">Source</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">{product.source}</p>
          </div>

          {/* Health Notes */}
          <div>
            <p className="text-xs font-semibold text-stone-600 mb-1">Quality: {product.scoreLabel}</p>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{product.healthNotes}</p>
          </div>

          {/* Minerals */}
          {mineralEntries.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-600 mb-2">Mineral Content (mg/L)</p>
              <div className="grid grid-cols-3 gap-1.5">
                {mineralEntries.map(([key, val]) => (
                  <div key={key} className="bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-blue-500 font-medium capitalize">{key}</p>
                    <p className="text-xs font-bold text-blue-800">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contaminants Removed (for filters/tap) */}
          {product.contaminants.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-600 mb-1">
                {product.type === "filtered" ? "Contaminants Removed:" : "Contaminants Detected:"}
              </p>
              <div className="flex flex-wrap gap-1">
                {product.contaminants.map((c, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-0.5 rounded ${
                      product.type === "filtered"
                        ? "bg-[#DCF4DF] text-[#145A3A]"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {product.certifications.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-600 mb-1">Certifications:</p>
              <div className="flex flex-wrap gap-1">
                {product.certifications.map((cert, i) => (
                  <span key={i} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Plastic Type */}
          {product.plasticType && (
            <div className="bg-stone-50 rounded-lg p-2">
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Container: <span className="text-stone-700">{product.plasticType}</span></p>
            </div>
          )}

          {/* Warnings */}
          {product.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              {product.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-800">⚠️ {w}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WaterGuidePage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<WaterType | null>(null);
  const [minScore, setMinScore] = useState(0);

  const filtered = useMemo(() => {
    let results = ALL_WATERS;

    if (searchQuery) {
      results = searchWater(searchQuery);
    }

    if (selectedType) {
      results = results.filter(w => w.type === selectedType);
    }

    results = results.filter(w => w.qualityScore >= minScore);

    return results.sort((a, b) => b.qualityScore - a.qualityScore);
  }, [searchQuery, selectedType, minScore]);

  const typeOptions = [
    { key: "bottled" as WaterType, label: "Bottled", count: ALL_BOTTLED.length },
    { key: "sparkling" as WaterType, label: "Sparkling", count: ALL_SPARKLING.length },
    { key: "filtered" as WaterType, label: "Filters", count: ALL_FILTERED.length },
    { key: "tap" as WaterType, label: "Tap Water", count: ALL_TAP.length },
  ];

  return (
    <div className="ec-page-bg pb-24">
      <GuideHero imageUrl="/manus-storage/water_2d9e880a.jpg" />
      {/* Header */}
      <div className="sticky top-0 z-10 ec-sticky-header px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setLocation("/explore")}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} className="text-stone-600" />
          </button>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0ea5e9, #38bdf8)" }}>
            <Droplets size={16} className="text-white" />
          </div>
          <h1 className="font-bold text-xl text-stone-800 dark:text-stone-100">Water Guide</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-3 text-stone-400" />
          <Input
            placeholder="Search waters, filters, cities..."
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
            All ({ALL_WATERS.length})
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
          <div className="flex items-center justify-between mb-1.5">
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
            <Droplets size={32} className="mx-auto text-stone-300 mb-3" />
            <p className="text-stone-500 text-sm">No waters match your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-stone-500 dark:text-stone-400 font-mono uppercase tracking-wider">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </p>
            {filtered.map((product) => (
              <WaterCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-6 border-t border-stone-200 bg-white dark:bg-stone-800">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100 dark:text-stone-100 text-sm mb-3">Quality Score Guide</h3>
        <div className="space-y-2">
          {[
            { color: "#0B3D2E", label: "85–100: Excellent (pure, well-mineralized, clean source)" },
            { color: "#eab308", label: "70–84: Good (safe, minor concerns)" },
            { color: "#f97316", label: "50–69: Fair (meets standards, but filtered recommended)" },
            { color: "#dc2626", label: "1–49: Poor (multiple contaminants or concerns)" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: color }} />
              <p className="text-xs text-stone-600 dark:text-stone-300">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-stone-100">
          <p className="text-xs font-semibold text-stone-600 mb-2">Key Metrics</p>
          <div className="space-y-1.5">
            <p className="text-xs text-stone-500 dark:text-stone-400"><span className="font-medium text-stone-700">pH:</span> Ideal range 6.5–8.5. Below 6.5 is acidic; above 8.5 is alkaline.</p>
            <p className="text-xs text-stone-500 dark:text-stone-400"><span className="font-medium text-stone-700">TDS:</span> Total Dissolved Solids (ppm). Natural spring water: 50–500 ppm. RO water: &lt;10 ppm.</p>
            <p className="text-xs text-stone-500 dark:text-stone-400"><span className="font-medium text-stone-700">Minerals:</span> Calcium and magnesium are beneficial. Sodium should be low (&lt;20 mg/L).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
