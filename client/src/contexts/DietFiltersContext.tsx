/**
 * EatVera — Personal Diet Filters Context
 * Stores user dietary preferences in localStorage
 * Provides auto-highlighting of relevant flags across all pages
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type DietFilter =
  | "no_seed_oils"
  | "no_hfcs"
  | "no_artificial"
  | "organic_only"
  | "carnivore"
  | "gluten_free"
  | "dairy_free"
  | "no_sugar"
  | "non_gmo"
  | "no_preservatives"
  | "no_msg"
  | "keto";

export interface DietFilterConfig {
  id: DietFilter;
  label: string;
  emoji: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  /** Ingredient keywords that trigger a flag for this filter */
  flagKeywords: string[];
}

export const DIET_FILTER_CONFIGS: DietFilterConfig[] = [
  {
    id: "no_seed_oils",
    label: "No Seed Oils",
    emoji: "🚫",
    description: "Flag canola, soybean, sunflower, safflower, corn, cottonseed, grapeseed, and rice bran oils",
    color: "#dc2626",
    bg: "#fff5f5",
    border: "#fca5a5",
    flagKeywords: ["canola oil", "soybean oil", "sunflower oil", "safflower oil", "corn oil", "cottonseed oil", "grapeseed oil", "rice bran oil", "vegetable oil", "rapeseed oil"],
  },
  {
    id: "no_hfcs",
    label: "No HFCS",
    emoji: "🍬",
    description: "Flag High Fructose Corn Syrup in any product",
    color: "#ea580c",
    bg: "#fff7f0",
    border: "#fed7aa",
    flagKeywords: ["high fructose corn syrup", "hfcs", "corn syrup"],
  },
  {
    id: "no_artificial",
    label: "No Artificial",
    emoji: "🧪",
    description: "Flag artificial colors, flavors, and preservatives",
    color: "#7c3aed",
    bg: "#faf5ff",
    border: "#c4b5fd",
    flagKeywords: ["artificial color", "artificial flavor", "red 40", "yellow 5", "yellow 6", "blue 1", "blue 2", "red 3", "caramel color", "sodium benzoate", "potassium sorbate", "bha", "bht"],
  },
  {
    id: "gluten_free",
    label: "Gluten-Free",
    emoji: "🌾",
    description: "Flag wheat, barley, rye, and gluten-containing ingredients",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
    flagKeywords: ["wheat", "barley", "rye", "gluten", "malt", "wheat flour", "enriched flour"],
  },
  {
    id: "dairy_free",
    label: "Dairy-Free",
    emoji: "🥛",
    description: "Flag milk, cheese, butter, whey, and dairy derivatives",
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#bae6fd",
    flagKeywords: ["milk", "cheese", "butter", "whey", "lactose", "casein", "cream", "dairy", "lactalbumin"],
  },
  {
    id: "non_gmo",
    label: "Non-GMO",
    emoji: "🌿",
    description: "Prefer Non-GMO Project Verified products",
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#86efac",
    flagKeywords: ["genetically modified", "gmo"],
  },
  {
    id: "no_sugar",
    label: "No Added Sugar",
    emoji: "🍭",
    description: "Flag added sugars including cane sugar, dextrose, maltose, and syrups",
    color: "#be185d",
    bg: "#fdf2f8",
    border: "#f9a8d4",
    flagKeywords: ["sugar", "cane sugar", "dextrose", "maltose", "maltodextrin", "glucose syrup", "brown sugar", "evaporated cane juice"],
  },
  {
    id: "no_preservatives",
    label: "No Preservatives",
    emoji: "🧂",
    description: "Flag sodium benzoate, potassium sorbate, TBHQ, BHA, BHT",
    color: "#0f766e",
    bg: "#f0fdfa",
    border: "#99f6e4",
    flagKeywords: ["sodium benzoate", "potassium sorbate", "tbhq", "bha", "bht", "sodium nitrate", "sodium nitrite", "calcium propionate"],
  },
  {
    id: "no_msg",
    label: "No MSG",
    emoji: "🍜",
    description: "Flag monosodium glutamate and hidden MSG sources",
    color: "#c2410c",
    bg: "#fff7ed",
    border: "#fdba74",
    flagKeywords: ["monosodium glutamate", "msg", "autolyzed yeast", "hydrolyzed protein", "yeast extract"],
  },
  {
    id: "keto",
    label: "Keto",
    emoji: "🥑",
    description: "Flag high-carb ingredients: sugars, grains, starches",
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe",
    flagKeywords: ["sugar", "wheat", "corn", "rice", "potato starch", "maltodextrin", "dextrose", "flour", "oats"],
  },
  {
    id: "carnivore",
    label: "Carnivore",
    emoji: "🥩",
    description: "Prefer animal-only products; flag plant-based fillers",
    color: "#991b1b",
    bg: "#fef2f2",
    border: "#fecaca",
    flagKeywords: ["soy", "wheat", "corn", "vegetable", "plant protein", "pea protein", "rice protein"],
  },
  {
    id: "organic_only",
    label: "Organic Only",
    emoji: "🌱",
    description: "Prefer USDA Organic certified products",
    color: "#166534",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    flagKeywords: [],
  },
];

interface DietFiltersContextValue {
  activeFilters: Set<DietFilter>;
  toggleFilter: (filter: DietFilter) => void;
  clearFilters: () => void;
  hasFilter: (filter: DietFilter) => boolean;
  checkIngredients: (ingredients: string) => DietFilterConfig[];
}

const DietFiltersContext = createContext<DietFiltersContextValue | null>(null);

const STORAGE_KEY = "eatclean_diet_filters";

export function DietFiltersProvider({ children }: { children: ReactNode }) {
  const [activeFilters, setActiveFilters] = useState<Set<DietFilter>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const arr = JSON.parse(stored) as DietFilter[];
        return new Set(arr);
      }
    } catch {}
    return new Set();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(activeFilters)));
  }, [activeFilters]);

  const toggleFilter = (filter: DietFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };

  const clearFilters = () => setActiveFilters(new Set());

  const hasFilter = (filter: DietFilter) => activeFilters.has(filter);

  const checkIngredients = (ingredients: string): DietFilterConfig[] => {
    if (!ingredients || activeFilters.size === 0) return [];
    const lower = ingredients.toLowerCase();
    return DIET_FILTER_CONFIGS.filter((cfg) => {
      if (!activeFilters.has(cfg.id)) return false;
      return cfg.flagKeywords.some((kw) => lower.includes(kw));
    });
  };

  return (
    <DietFiltersContext.Provider value={{ activeFilters, toggleFilter, clearFilters, hasFilter, checkIngredients }}>
      {children}
    </DietFiltersContext.Provider>
  );
}

export function useDietFilters() {
  const ctx = useContext(DietFiltersContext);
  if (!ctx) throw new Error("useDietFilters must be used within DietFiltersProvider");
  return ctx;
}
