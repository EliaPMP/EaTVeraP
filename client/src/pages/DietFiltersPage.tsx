/**
 * EatVera — Personal Diet Filters Page
 * Design: Clean, organic aesthetic — full dark mode support
 */
import { useDietFilters, DIET_FILTER_CONFIGS, type DietFilter } from "@/contexts/DietFiltersContext";
import { Settings, CheckCircle, Info, ArrowLeft } from "lucide-react";
import { hapticLight } from "@/lib/haptic";

export default function DietFiltersPage() {
  const { activeFilters, toggleFilter, clearFilters } = useDietFilters();

  return (
    <div className="ec-page-bg">
      {/* Header */}
      <div className="ec-sticky-header sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { hapticLight(); window.history.back(); }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                style={{ background: "rgba(11,61,46,0.08)", border: "1px solid rgba(11,61,46,0.12)" }}
                aria-label="Go back"
              >
                <ArrowLeft size={18} style={{ color: "#0B3D2E" }} />
              </button>
              <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                <Settings size={20} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Diet Filters</h1>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {activeFilters.size === 0
                    ? "No filters active"
                    : `${activeFilters.size} filter${activeFilters.size > 1 ? "s" : ""} active`}
                </p>
              </div>
            </div>
            {activeFilters.size > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-600 hover:border-red-200 dark:hover:border-red-700"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-28 space-y-4">
        {/* Info */}
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-2xl p-3 flex gap-2">
          <Info size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
            Active filters will <strong>automatically highlight matching concerns</strong> on every product scan, search result, and guide page. Your preferences are saved locally.
          </p>
        </div>

        {/* Active Filters Summary */}
        {activeFilters.size > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-stone-100 dark:border-stone-700 shadow-sm">
            <h3 className="font-semibold text-stone-700 dark:text-stone-200 text-sm mb-3">Active Filters</h3>
            <div className="flex flex-wrap gap-2">
              {DIET_FILTER_CONFIGS.filter((cfg) => activeFilters.has(cfg.id)).map((cfg) => (
                <button
                  key={cfg.id}
                  onClick={() => toggleFilter(cfg.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
                  style={{ backgroundColor: cfg.color, color: "#fff", borderColor: cfg.color }}
                >
                  {cfg.emoji} {cfg.label} ×
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Filters */}
        <div className="space-y-2">
          <h3 className="font-semibold text-stone-700 dark:text-stone-200 text-sm px-1">All Dietary Preferences</h3>
          {DIET_FILTER_CONFIGS.map((cfg) => {
            const isActive = activeFilters.has(cfg.id);
            return (
              <button
                key={cfg.id}
                onClick={() => toggleFilter(cfg.id as DietFilter)}
                className={`w-full text-left rounded-2xl p-4 border transition-all duration-200 flex items-center gap-4 ${
                  isActive
                    ? "shadow-md"
                    : "bg-card border-stone-100 dark:border-stone-700 hover:border-stone-200 dark:hover:border-stone-600 shadow-sm"
                }`}
                style={isActive ? { backgroundColor: cfg.bg, borderColor: cfg.border } : {}}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${!isActive ? "bg-stone-100 dark:bg-stone-700" : ""}`}
                  style={isActive ? { backgroundColor: cfg.color } : {}}
                >
                  {cfg.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm">{cfg.label}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">{cfg.description}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isActive ? "border-transparent" : "border-stone-300 dark:border-stone-600"
                  }`}
                  style={isActive ? { backgroundColor: cfg.color } : {}}
                >
                  {isActive && <CheckCircle size={14} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* How it works */}
        <div className="bg-stone-50 dark:bg-stone-800/60 rounded-2xl p-4 border border-stone-100 dark:border-stone-700">
          <h3 className="font-semibold text-stone-700 dark:text-stone-200 text-sm mb-2">How Filters Work</h3>
          <ul className="space-y-2 text-xs text-stone-500 dark:text-stone-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>When you scan or search a product, any ingredients matching your active filters will be <strong className="text-stone-700 dark:text-stone-200">highlighted in red</strong> on the result page.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Guide pages (Meats, Fruits, Vegetables, Snacks, Dairy, Condiments) will show a <strong className="text-stone-700 dark:text-stone-200">filter alert banner</strong> on products that conflict with your preferences.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Your preferences are <strong className="text-stone-700 dark:text-stone-200">saved locally</strong> on your device and persist between sessions.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
