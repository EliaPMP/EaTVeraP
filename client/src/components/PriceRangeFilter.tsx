/**
 * PriceRangeFilter — reusable price range filter row for guide pages
 * Provides "All / Under $5 / $5–$10 / $10+" tabs
 */

export type PriceRange = "all" | "under5" | "5to10" | "over10";

export const PRICE_RANGE_LABELS: Record<PriceRange, string> = {
  all: "All Prices",
  under5: "Under $5",
  "5to10": "$5–$10",
  over10: "$10+",
};

export const PRICE_RANGES: PriceRange[] = ["all", "under5", "5to10", "over10"];

/** Returns true if the item's price matches the selected range.
 *  Items with no price always pass through (shown in all ranges). */
export function matchesPriceRange(price: number | undefined, range: PriceRange): boolean {
  if (range === "all") return true;
  if (price == null) return true; // no price data — show in all ranges
  if (range === "under5") return price < 5;
  if (range === "5to10") return price >= 5 && price <= 10;
  if (range === "over10") return price > 10;
  return true;
}

/** Returns true if the item qualifies for "Best Value" badge:
 *  score >= 80 AND price <= 5 (and price must be set) */
export function isBestValue(score: number, price: number | undefined): boolean {
  return score >= 80 && price != null && price <= 5;
}

interface PriceRangeFilterProps {
  value: PriceRange;
  onChange: (range: PriceRange) => void;
  accentColor?: string; // active tab bg color, defaults to green
}

export default function PriceRangeFilter({ value, onChange, accentColor = "#145A3A" }: PriceRangeFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {PRICE_RANGES.map(range => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            value === range
              ? "text-white shadow-sm"
              : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-600 hover:border-stone-400"
          }`}
          style={value === range ? { background: accentColor, borderColor: accentColor } : {}}
        >
          {PRICE_RANGE_LABELS[range]}
        </button>
      ))}
    </div>
  );
}
