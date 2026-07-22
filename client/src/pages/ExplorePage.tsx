/**
 * ExplorePage — All food category guides in one hub
 * Design: Apple/Headspace minimal — clean photo cards, large titles, subtle depth
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import {
  Search, Clock, Sun, Moon, ArrowLeft,
  Apple, Beef, Cookie, Carrot, Milk, Utensils,
  Droplets, Wheat, Coffee, Snowflake, Pill,
  Baby, Wine, PawPrint, Store, IceCreamCone, FlaskConical,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { hapticLight } from "@/lib/haptic";

interface CategoryCard {
  path: string;
  label: string;
  tagline: string;
  imageUrl: string;
  count: number;
  Icon: React.ElementType;
  /** Dominant color for icon badge background */
  iconBg: string;
  /** Overlay gradient — stronger at bottom for text legibility */
  overlay: string;
}

const CATEGORIES: CategoryCard[] = [
  {
    path: "/stores",
    label: "Store Guide",
    tagline: "13 US grocery chains rated",
    imageUrl: "/manus-storage/stores_2fb644ec.jpg",
    count: 13,
    Icon: Store,
    iconBg: "rgba(37,99,235,0.85)",
    overlay: "linear-gradient(to top, rgba(5,15,45,0.90) 0%, rgba(5,15,45,0.30) 50%, rgba(5,15,45,0.10) 100%)",
  },
  {
    path: "/fruits",
    label: "Fruits",
    tagline: "Dirty Dozen & Clean Fifteen",
    imageUrl: "/manus-storage/fruits_v2_8701e70b.jpg",
    count: 67,
    Icon: Apple,
    iconBg: "rgba(34,197,94,0.85)",
    overlay: "linear-gradient(to top, rgba(5,30,15,0.88) 0%, rgba(5,30,15,0.30) 50%, rgba(5,30,15,0.10) 100%)",
  },
  {
    path: "/meats",
    label: "Meats",
    tagline: "Beef, chicken, pork & seafood",
    imageUrl: "/manus-storage/meats_v2_c0fc2ecd.jpg",
    count: 68,
    Icon: Beef,
    iconBg: "rgba(220,38,38,0.85)",
    overlay: "linear-gradient(to top, rgba(50,5,5,0.90) 0%, rgba(50,5,5,0.30) 50%, rgba(50,5,5,0.10) 100%)",
  },
  {
    path: "/snacks",
    label: "Snacks",
    tagline: "Chips, bars & packaged snacks",
    imageUrl: "/manus-storage/snacks_37e2d5ca.jpg",
    count: 64,
    Icon: Cookie,
    iconBg: "rgba(217,119,6,0.85)",
    overlay: "linear-gradient(to top, rgba(50,25,0,0.90) 0%, rgba(50,25,0,0.30) 50%, rgba(50,25,0,0.10) 100%)",
  },
  {
    path: "/vegetables",
    label: "Vegetables",
    tagline: "Organic vs conventional",
    imageUrl: "/manus-storage/vegetables_v2_39ff353e.jpg",
    count: 51,
    Icon: Carrot,
    iconBg: "rgba(22,163,74,0.85)",
    overlay: "linear-gradient(to top, rgba(5,40,15,0.90) 0%, rgba(5,40,15,0.30) 50%, rgba(5,40,15,0.10) 100%)",
  },
  {
    path: "/dairy",
    label: "Dairy & Eggs",
    tagline: "A2 milk & pasture-raised",
    imageUrl: "/manus-storage/dairy_806c4508.jpg",
    count: 39,
    Icon: Milk,
    iconBg: "rgba(37,99,235,0.85)",
    overlay: "linear-gradient(to top, rgba(5,20,55,0.90) 0%, rgba(5,20,55,0.30) 50%, rgba(5,20,55,0.10) 100%)",
  },
  {
    path: "/condiments",
    label: "Condiments",
    tagline: "Oils, dressings & sauces",
    imageUrl: "/manus-storage/condiments_v2_069f4e55.jpg",
    count: 36,
    Icon: Utensils,
    iconBg: "rgba(194,65,12,0.85)",
    overlay: "linear-gradient(to top, rgba(50,15,0,0.90) 0%, rgba(50,15,0,0.30) 50%, rgba(50,15,0,0.10) 100%)",
  },
  {
    path: "/water",
    label: "Water",
    tagline: "Bottled, filtered & tap",
    imageUrl: "/manus-storage/water_2d9e880a.jpg",
    count: 31,
    Icon: Droplets,
    iconBg: "rgba(3,105,161,0.85)",
    overlay: "linear-gradient(to top, rgba(0,20,50,0.90) 0%, rgba(0,20,50,0.30) 50%, rgba(0,20,50,0.10) 100%)",
  },
  {
    path: "/grains",
    label: "Bread & Grains",
    tagline: "Bread, pasta & cereals",
    imageUrl: "/manus-storage/grains_aa64360e.jpg",
    count: 66,
    Icon: Wheat,
    iconBg: "rgba(161,98,7,0.85)",
    overlay: "linear-gradient(to top, rgba(45,20,0,0.90) 0%, rgba(45,20,0,0.30) 50%, rgba(45,20,0,0.10) 100%)",
  },
  {
    path: "/beverages",
    label: "Beverages",
    tagline: "Juices, sodas & energy drinks",
    imageUrl: "/manus-storage/beverages_v2_bfb4388f.jpg",
    count: 53,
    Icon: Coffee,
    iconBg: "rgba(109,40,217,0.85)",
    overlay: "linear-gradient(to top, rgba(30,5,55,0.90) 0%, rgba(30,5,55,0.30) 50%, rgba(30,5,55,0.10) 100%)",
  },
  {
    path: "/frozen",
    label: "Frozen Foods",
    tagline: "Meals, veggies & convenience",
    imageUrl: "/manus-storage/frozen_8bbcf686.jpg",
    count: 37,
    Icon: Snowflake,
    iconBg: "rgba(14,116,144,0.85)",
    overlay: "linear-gradient(to top, rgba(0,25,40,0.90) 0%, rgba(0,25,40,0.30) 50%, rgba(0,25,40,0.10) 100%)",
  },
  {
    path: "/supplements",
    label: "Supplements",
    tagline: "Protein, vitamins & pre-workout",
    imageUrl: "/manus-storage/supplements_d407d976.jpg",
    count: 42,
    Icon: Pill,
    iconBg: "rgba(67,56,202,0.85)",
    overlay: "linear-gradient(to top, rgba(20,10,55,0.90) 0%, rgba(20,10,55,0.30) 50%, rgba(20,10,55,0.10) 100%)",
  },
  {
    path: "/baby-kids",
    label: "Baby & Kids",
    tagline: "Baby food & kids' snacks",
    imageUrl: "/manus-storage/baby-kids_v3_81e9cd4a.webp",
    count: 35,
    Icon: Baby,
    iconBg: "rgba(190,24,93,0.85)",
    overlay: "linear-gradient(to top, rgba(55,5,30,0.90) 0%, rgba(55,5,30,0.30) 50%, rgba(55,5,30,0.10) 100%)",
  },
  {
    path: "/alcohol",
    label: "Alcohol",
    tagline: "Spirits, wines & beers",
    imageUrl: "/manus-storage/alcohol_2b128bd3.jpg",
    count: 30,
    Icon: Wine,
    iconBg: "rgba(126,34,206,0.85)",
    overlay: "linear-gradient(to top, rgba(35,5,50,0.90) 0%, rgba(35,5,50,0.30) 50%, rgba(35,5,50,0.10) 100%)",
  },
  {
    path: "/ice-cream",
    label: "Ice Cream",
    tagline: "Grass-fed, organic & clean pints",
    imageUrl: "/manus-storage/icecream-category_5814d61f.jpg",
    count: 25,
    Icon: IceCreamCone,
    iconBg: "rgba(219,39,119,0.85)",
    overlay: "linear-gradient(to top, rgba(55,5,30,0.90) 0%, rgba(55,5,30,0.30) 50%, rgba(55,5,30,0.10) 100%)",
  },
  {
    path: "/petcare",
    label: "Pet Care",
    tagline: "Dog & cat food quality",
    imageUrl: "/manus-storage/petcare_v2_6ecce63f.jpg",
    count: 37,
    Icon: PawPrint,
    iconBg: "rgba(5,150,105,0.85)",
    overlay: "linear-gradient(to top, rgba(5,30,20,0.90) 0%, rgba(5,30,20,0.30) 50%, rgba(5,30,20,0.10) 100%)",
  },
];

const TOTAL_PRODUCTS = CATEGORIES.reduce((sum, c) => sum + c.count, 0);
const RECENTLY_VIEWED_KEY = "ec_recently_viewed";
const MAX_RECENT = 4;

function loadRecentlyViewed(): string[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecentlyViewed(paths: string[]) {
  try {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(paths));
  } catch {}
}

/** Small pill used in the Recently Viewed strip */
function RecentPill({ cat, onClick }: { cat: CategoryCard; onClick: () => void }) {
  const { Icon } = cat;
  return (
    <Link href={cat.path}>
      <div
        onClick={onClick}
        className="relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform duration-150 flex items-center gap-2.5 px-3"
        style={{
          width: 130,
          height: 64,
          boxShadow: "0 4px 16px rgba(0,0,0,0.20)",
        }}
      >
        {/* Photo bg */}
        <img
          src={cat.imageUrl}
          alt={cat.label}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.55) saturate(1.1)" }}
          loading="eager"
          fetchPriority="high"
        />
        {/* Overlay */}
        <div className="absolute inset-0" style={{ background: cat.overlay }} />
        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: cat.iconBg, backdropFilter: "blur(4px)" }}
          >
            <Icon size={13} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-[12px] leading-tight" style={{ letterSpacing: "-0.01em" }}>
              {cat.label}
            </p>
            <p className="text-white/60 text-[9px]">{cat.count} items</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Full-width featured card for Store Guide — wider, taller, with a prominent badge and CTA */
function FeaturedStoreCard({ cat, onClick }: { cat: CategoryCard; onClick: () => void }) {
  const { Icon } = cat;
  return (
    <Link href={cat.path}>
      <div
        onClick={onClick}
        className="relative rounded-[22px] overflow-hidden cursor-pointer active:scale-[0.98] hover:scale-[1.02] transition-all duration-200 ease-out w-full"
        style={{
          height: 140,
          boxShadow: "0 12px 40px rgba(0,0,0,0.22), 0 2px 10px rgba(0,0,0,0.12)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 24px 56px rgba(0,0,0,0.32), 0 8px 20px rgba(0,0,0,0.18)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.22), 0 2px 10px rgba(0,0,0,0.12)";
        }}
      >
        {/* Photo background */}
        <img
          src={cat.imageUrl}
          alt={cat.label}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.65) saturate(1.1)" }}
          loading="eager"
          fetchPriority="high"
        />

        {/* Gradient overlay — left-to-right for wide layout */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(5,20,50,0.92) 0%, rgba(5,20,50,0.55) 55%, rgba(5,20,50,0.10) 100%)",
          }}
        />

        {/* Subtle top vignette */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, transparent 40%)" }}
        />

        {/* Content — horizontal layout */}
        <div className="relative z-10 flex items-center justify-between h-full px-5">
          {/* Left: icon + text */}
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: cat.iconBg,
                boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
              }}
            >
              <Icon size={22} className="text-white" />
            </div>
            <div>
              {/* Featured badge */}
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.85)" }}
                >
                  Featured
                </span>
              </div>
              <h3
                className="font-bold text-white"
                style={{ fontSize: 20, letterSpacing: "-0.03em", textShadow: "0 1px 10px rgba(0,0,0,0.5)" }}
              >
                {cat.label}
              </h3>
              <p
                className="text-white/65 mt-0.5"
                style={{ fontSize: 12, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
              >
                {cat.tagline}
              </p>
            </div>
          </div>

          {/* Right: CTA arrow */}
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.20)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Full-size card — clean photo bg, strong bottom overlay, large title, icon badge */
function CategoryGridCard({ cat, onClick }: { cat: CategoryCard; onClick: () => void }) {
  const { Icon } = cat;
  return (
    <Link href={cat.path}>
      <div
        onClick={onClick}
        className="relative rounded-[22px] overflow-hidden cursor-pointer active:scale-[0.97] hover:scale-[1.03] transition-all duration-200 ease-out"
        style={{
          height: 168,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 48px rgba(0,0,0,0.28), 0 6px 16px rgba(0,0,0,0.16)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)";
        }}
      >
        {/* Photo background */}
        <img
          src={cat.imageUrl}
          alt={cat.label}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.75) saturate(1.05)" }}
          loading="eager"
          fetchPriority="high"
        />

        {/* Strong bottom-to-top gradient for text legibility */}
        <div className="absolute inset-0" style={{ background: cat.overlay }} />

        {/* Subtle top vignette so icon badge is readable */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 40%)" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-3.5">
          {/* Top: icon badge only — no text label */}
          <div className="flex justify-end">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center"
              style={{
                background: cat.iconBg,
                boxShadow: "0 2px 8px rgba(0,0,0,0.30)",
              }}
            >
              <Icon size={15} className="text-white" />
            </div>
          </div>

          {/* Bottom: title + tagline */}
          <div>
            <h3
              className="font-bold text-white leading-tight"
              style={{ fontSize: 17, letterSpacing: "-0.03em", textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            >
              {cat.label}
            </h3>
            <p
              className="text-white/65 mt-0.5 leading-snug"
              style={{ fontSize: 11, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
            >
              {cat.tagline}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

const SCROLL_KEY = "ec_explore_scroll";

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [recentPaths, setRecentPaths] = useState<string[]>(() => loadRecentlyViewed());
  const { theme, toggleTheme } = useTheme();
  const restoredRef = useRef(false);

  // Restore scroll position on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved && !restoredRef.current) {
      restoredRef.current = true;
      const y = parseInt(saved, 10);
      // Use requestAnimationFrame to ensure DOM has rendered
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
      });
    }
  }, []);

  // Save scroll position continuously so it's always up to date
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    saveRecentlyViewed(recentPaths);
  }, [recentPaths]);

  const handleCategoryClick = useCallback((path: string) => {
    const current = loadRecentlyViewed();
    const without = current.filter((p) => p !== path);
    const updated = [path, ...without].slice(0, MAX_RECENT);
    saveRecentlyViewed(updated);
    setRecentPaths(updated);
  }, []);

  const recentCategories = recentPaths
    .map((p) => CATEGORIES.find((c) => c.path === p))
    .filter(Boolean) as CategoryCard[];

  const handleClearHistory = useCallback(() => {
    saveRecentlyViewed([]);
    setRecentPaths([]);
  }, []);

  const filtered = search.trim()
    ? CATEGORIES.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.tagline.toLowerCase().includes(search.toLowerCase())
      )
    : CATEGORIES;

  const isDark = theme === "dark";

  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: isDark ? "#0d1a14" : "#f2f2f0" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(135deg, #0B3D2E 0%, #145A3A 100%)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => { hapticLight(); window.history.back(); }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1
              className="font-bold text-2xl text-white"
              style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.025em" }}
            >
              Explore
            </h1>
            <p className="text-green-200/80 text-[13px] mt-0.5">
              {TOTAL_PRODUCTS}+ products · {CATEGORIES.length} categories
            </p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={16} className="text-white" /> : <Moon size={16} className="text-white" />}
        </button>
      </div>

      {/* Search bar */}
      <div className="px-4 mt-4 mb-5">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: isDark ? "#6b7280" : "#9ca3af" }}
          />
          <input
            type="text"
            placeholder="Search guides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30"
            style={{
              background: isDark ? "rgba(255,255,255,0.07)" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
              color: isDark ? "#f3f4f6" : "#1c1c1e",
              boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
            }}
          />
        </div>
      </div>

      {/* Recently Viewed */}
      {!search.trim() && recentCategories.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between px-5 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Clock size={11} style={{ color: isDark ? "#6b7280" : "#9ca3af" }} />
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: isDark ? "#6b7280" : "#9ca3af" }}
              >
                Recent
              </span>
            </div>
            <button
              onClick={handleClearHistory}
              className="text-[11px] font-medium transition-colors"
              style={{ color: isDark ? "#6b7280" : "#9ca3af" }}
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-1">
            {recentCategories.map((cat) => (
              <RecentPill key={cat.path} cat={cat} onClick={() => handleCategoryClick(cat.path)} />
            ))}
          </div>
        </div>
      )}

      {/* Category grid */}
      <div className="px-4">
        {!search.trim() && (
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3 px-0.5"
            style={{ color: isDark ? "#6b7280" : "#9ca3af" }}
          >
            All Guides
          </p>
        )}
        {filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: isDark ? "#6b7280" : "#9ca3af" }}>
            <Search size={28} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium text-sm">No guides found</p>
            <p className="text-xs mt-1 opacity-70">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {filtered.map((cat) =>
              cat.path === "/stores" ? (
                <div key={cat.path} className="col-span-2">
                  <FeaturedStoreCard cat={cat} onClick={() => handleCategoryClick(cat.path)} />
                </div>
              ) : (
                <CategoryGridCard
                  key={cat.path}
                  cat={cat}
                  onClick={() => handleCategoryClick(cat.path)}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {filtered.length > 0 && (
        <p
          className="text-center text-[11px] mt-6 mb-2 px-4"
          style={{ color: isDark ? "#4b5563" : "#9ca3af" }}
        >
          Ratings based on ingredients, sourcing & processing quality
        </p>
      )}
    </div>
  );
}
