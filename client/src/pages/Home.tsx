/**
 * EatVera Home Page — v3 Scanner-First
 * Design: Premium Wellness — scanner is the hero, minimal clutter
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ScanLine, Leaf, AlertTriangle, TrendingUp, Zap, ChevronRight,
  Beef, Moon, Sun, Flame, ArrowLeftRight, Compass, Sparkles, Store
} from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { OasisProductCard } from "@/components/OasisProductCard";
import { useAuth } from "@/_core/hooks/useAuth";
import { User } from "lucide-react";
import { setSelectedProduct } from "@/pages/ProductDetailPage";
import type { FoodProduct } from "@/lib/foodApi";
import { ALL_SNACKS } from "@/lib/snackDatabase";
import { ALL_GRAINS } from "@/lib/grainsDatabase";
import { ALL_DAIRY } from "@/lib/dairyDatabase";
import { ArrowRight } from "lucide-react";

const DAILY_TIPS = [
  {
    title: 'Avoid the "Hateful Eight" Seed Oils',
    body: "Canola, corn, cottonseed, soy, sunflower, safflower, grapeseed, and rice bran oils are the most inflammatory fats in the modern diet. Check every label.",
    icon: AlertTriangle,
    color: "#dc2626",
  },
  {
    title: "Shop the Perimeter",
    body: "The healthiest foods in any grocery store are on the outer edges — produce, meat, dairy. The center aisles are where ultra-processed foods live.",
    icon: Leaf,
    color: "#145A3A",
  },
  {
    title: "The 5-Ingredient Rule",
    body: "If a product has more than 5 ingredients, or contains ingredients you can't pronounce, put it back. Real food doesn't need a chemistry lab.",
    icon: Zap,
    color: "#d97706",
  },
  {
    title: "Read Ingredients, Not Marketing",
    body: '"Natural," "Healthy," and "Organic" on the front label mean nothing. The truth is in the ingredients list. Always flip the package.',
    icon: TrendingUp,
    color: "#145A3A",
  },
];

const QUICK_LINKS = [
  { href: "/explore", icon: Compass, label: "Explore", color: "#0B3D2E" },
  { href: "/compare", icon: ArrowLeftRight, label: "Compare", color: "#2563eb" },
  { href: "/calories", icon: Flame, label: "Calories", color: "#dc2626" },
  { href: "/meats", icon: Beef, label: "Meats", color: "#0B3D2E" },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const {} = useAuth();
  const [tipIndex] = useState(() => Math.floor(Math.random() * DAILY_TIPS.length));
  const tip = DAILY_TIPS[tipIndex];
  const TipIcon = tip.icon;

  // Preload carousel images for instant display
  useEffect(() => {
    const carouselImages = [
      "/manus-storage/stores_2fb644ec.jpg",
      "/manus-storage/body-benefits_v2_d981ac82.jpg",
      "/manus-storage/baby-kids_v3_81e9cd4a.webp",
      "/manus-storage/petcare_v2_6ecce63f.jpg",
      "/manus-storage/recipes_v2_7e33b26c.jpg",
    ];
    carouselImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // What's New dot indicators
  const [whatsNewActiveIdx, setWhatsNewActiveIdx] = useState(0);
  const whatsNewScrollRef = useRef<HTMLDivElement>(null);
  const handleWhatsNewScroll = useCallback(() => {
    const el = whatsNewScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    // If scrolled to the end (within 10px tolerance), select last dot
    if (maxScroll - el.scrollLeft < 10) {
      setWhatsNewActiveIdx(4);
      return;
    }
    // Each card is w-40 (160px) + gap-3 (12px) = 172px per card
    const cardWidth = 172;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setWhatsNewActiveIdx(Math.min(4, Math.max(0, idx)));
  }, []);
  const scrollWhatsNewTo = useCallback((idx: number) => {
    const el = whatsNewScrollRef.current;
    if (!el) return;
    const cardWidth = 172;
    el.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
    setWhatsNewActiveIdx(idx);
  }, []);

  const featuredProducts: (FoodProduct & { score: number; scoreColor: string })[] = [
    {
      barcode: "demo-deep-ghee",
      name: "Pure Ghee",
      brand: "Deep",
      imageUrl: "/manus-storage/deep_pure_ghee_e9a34e75.png",
      thumbnailUrl: "/manus-storage/deep_pure_ghee_e9a34e75.png",
      category: "Dairy & Fats",
      ingredients: "Clarified Butter (Cow Milk)",
      quantity: "28 oz",
      dataSource: "estimated" as const,
      nutriments: {
        "energy-kcal_100g": 900,
        "fat_100g": 100,
        "saturated-fat_100g": 62,
        "carbohydrates_100g": 0,
        "sugars_100g": 0,
        "proteins_100g": 0,
        "sodium_100g": 0,
        "fiber_100g": 0,
      },
      novaGroup: 1,
      nutriScore: "A",
      allergens: ["milk"],
      labels: ["Gluten-Free", "Lactose-Free"],
      averagePrice: 8.99,
      score: 91,
      scoreColor: "#22c55e",
    },
    {
      barcode: "demo-ribeye-steak",
      name: "Grass-Fed Beef Ribeye Steak",
      brand: "Butcher's Specialty (Lidl)",
      imageUrl: "/manus-storage/burchers_ribeye_steak_b6db4364.png",
      thumbnailUrl: "/manus-storage/burchers_ribeye_steak_b6db4364.png",
      category: "Fresh Beef",
      ingredients: "100% Grass-Fed Beef",
      quantity: "~1 lb",
      dataSource: "estimated" as const,
      nutriments: {
        "energy-kcal_100g": 271,
        "fat_100g": 19,
        "saturated-fat_100g": 8,
        "carbohydrates_100g": 0,
        "sugars_100g": 0,
        "proteins_100g": 26,
        "sodium_100g": 0.06,
        "fiber_100g": 0,
      },
      novaGroup: 1,
      nutriScore: "A",
      allergens: [],
      labels: ["Grass-Fed", "No Antibiotics", "No Added Hormones"],
      averagePrice: 12.99,
      score: 88,
      scoreColor: "#22c55e",
    },
    {
      barcode: "016000275287",
      name: "Cinnamon Toast Crunch",
      brand: "General Mills",
      imageUrl: "/manus-storage/cinnamon_toast_crunch_c48a1c18.png",
      thumbnailUrl: "/manus-storage/cinnamon_toast_crunch_c48a1c18.png",
      category: "Breakfast Cereals",
      ingredients: "Whole Grain Wheat, Sugar, Rice Flour, Canola Oil, Fructose, Maltodextrin, Dextrose, Salt, Cinnamon, Trisodium Phosphate, Soy Lecithin, Caramel Color, Natural Flavor",
      quantity: "12 oz",
      dataSource: "estimated" as const,
      nutriments: {
        "energy-kcal_100g": 393,
        "fat_100g": 8,
        "saturated-fat_100g": 1,
        "carbohydrates_100g": 77,
        "sugars_100g": 30,
        "proteins_100g": 6,
        "sodium_100g": 0.5,
        "fiber_100g": 3,
      },
      novaGroup: 4,
      nutriScore: "D",
      allergens: ["wheat", "soy"],
      labels: [],
      averagePrice: 4.49,
      score: 22,
      scoreColor: "#dc2626",
    },
    {
      barcode: "demo-family-farmstead-milk",
      name: "A2 Whole Milk",
      brand: "Family Farmstead",
      imageUrl: "/manus-storage/milk-family-farmstead_a0679f75.png",
      thumbnailUrl: "/manus-storage/milk-family-farmstead_a0679f75.png",
      category: "Dairy",
      ingredients: "Whole Milk (A2 Protein)",
      quantity: "64 fl oz (1,893 ml)",
      dataSource: "estimated" as const,
      nutriments: {
        "energy-kcal_100g": 61,
        "fat_100g": 3.3,
        "saturated-fat_100g": 1.9,
        "carbohydrates_100g": 4.8,
        "sugars_100g": 4.8,
        "proteins_100g": 3.2,
        "sodium_100g": 0.044,
        "fiber_100g": 0,
      },
      novaGroup: 1,
      nutriScore: "A",
      allergens: ["Milk"],
      labels: ["A2 Protein", "Grass-Fed", "No rBST", "Organic"],
      averagePrice: 8.99,
      score: 94,
      scoreColor: "#22c55e",
    },
  ];

  return (
    <div className="ec-page-bg pb-24">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #0B3D2E, #145A3A)" }}
          >
            <Leaf size={15} className="text-white" />
          </div>
          <div>
            <span
              className="font-bold text-2xl text-stone-800 dark:text-white leading-none"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}
            >
              EatVera
            </span>
            <p className="text-xs text-stone-400 dark:text-stone-500 leading-none mt-0.5">Know what you eat</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark'
              ? <Sun size={18} className="text-amber-400" />
              : <Moon size={18} className="text-stone-500" />}
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Settings"
          >
            <User size={18} className="text-[#0B3D2E] dark:text-green-400" />
          </button>
        </div>
      </div>

      {/* ── Hero Scanner Card ── */}
      <div className="px-4 mb-5">
        <div
          className="relative overflow-hidden rounded-3xl cursor-pointer group"
          style={{
            background: "linear-gradient(145deg, #0B3D2E 0%, #145A3A 55%, #1A7048 100%)",
            boxShadow: "0 12px 40px rgba(11,61,46,0.35)",
            minHeight: 200,
          }}
          onClick={() => navigate("/scan")}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-10"
            style={{ background: "white", transform: "translate(35%, -35%)" }} />
          <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full opacity-8"
            style={{ background: "white", transform: "translate(-25%, 35%)" }} />

          <div className="relative p-7">
            {/* Scanner icon */}
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-5 group-hover:bg-white/25 transition-all">
              <ScanLine size={32} className="text-white" />
            </div>

            <p className="text-green-200 text-[10px] font-mono-data tracking-widest uppercase mb-2">
              Tap to scan
            </p>
            <h2
              className="text-white font-bold text-3xl leading-tight mb-4"
              style={{ letterSpacing: "-0.02em", fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Know What's<br />In Your Food
            </h2>

            <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-2xl px-5 py-3 w-fit group-hover:bg-white/30 transition-all">
              <span className="text-white font-semibold text-sm">Scan a Product</span>
              <ChevronRight size={16} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Links ── */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_LINKS.map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href}>
              <div className="ec-card flex flex-col items-center py-3 px-2 gap-1.5 cursor-pointer hover:shadow-md transition-all">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={17} style={{ color }} />
                </div>
                <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 text-center leading-tight">
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── What's New ── */}
      <div className="px-4 mb-5">
        <div className="ec-section-label mb-3 px-1">What's New</div>
        <div
          ref={whatsNewScrollRef}
          onScroll={handleWhatsNewScroll}
          className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
        >
          {/* 1 — Recipes */}
          <Link href="/recipes">
            <div className="group flex-shrink-0 w-40 h-28 rounded-2xl overflow-hidden relative cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200 snap-start">
              <img src="/manus-storage/recipes_v2_7e33b26c.jpg" alt="Recipes" className="absolute inset-0 w-full h-full object-cover transition-[filter] duration-200 group-hover:brightness-[0.7]" style={{ filter: "brightness(0.55) saturate(1.1)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />
              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xs">🍳</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-white/70 text-[9px] font-mono-data tracking-widest uppercase mb-0.5">New</div>
                <h4 className="font-bold text-white text-sm leading-tight">Recipes</h4>
                <p className="text-white/70 text-[10px] mt-0.5">Clean eating made easy</p>
              </div>
            </div>
          </Link>
          {/* 2 — Body Benefits */}
          <Link href="/body-benefits">
            <div className="group flex-shrink-0 w-40 h-28 rounded-2xl overflow-hidden relative cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200 snap-start">
              <img src="/manus-storage/body-benefits_v2_d981ac82.jpg" alt="Body Benefits" className="absolute inset-0 w-full h-full object-cover transition-[filter] duration-200 group-hover:brightness-[0.7]" style={{ filter: "brightness(0.55) saturate(1.1)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />
              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Zap size={12} className="text-white" />
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-white/70 text-[9px] font-mono-data tracking-widest uppercase mb-0.5">New</div>
                <h4 className="font-bold text-white text-sm leading-tight">Body Benefits</h4>
                <p className="text-white/70 text-[10px] mt-0.5">Foods that heal & fuel</p>
              </div>
            </div>
          </Link>
          {/* 3 — Baby & Kids */}
          <Link href="/baby-kids">
            <div className="group flex-shrink-0 w-40 h-28 rounded-2xl overflow-hidden relative cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200 snap-start">
              <img src="/manus-storage/baby-kids_v3_81e9cd4a.webp" alt="Baby & Kids" className="absolute inset-0 w-full h-full object-cover transition-[filter] duration-200 group-hover:brightness-[0.7]" style={{ filter: "brightness(0.55) saturate(1.1)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />
              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xs">👶</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-white/70 text-[9px] font-mono-data tracking-widest uppercase mb-0.5">New</div>
                <h4 className="font-bold text-white text-sm leading-tight">Baby & Kids</h4>
                <p className="text-white/70 text-[10px] mt-0.5">Safe foods for little ones</p>
              </div>
            </div>
          </Link>
          {/* 4 — Pet Care */}
          <Link href="/petcare">
            <div className="group flex-shrink-0 w-40 h-28 rounded-2xl overflow-hidden relative cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200 snap-start">
              <img src="/manus-storage/petcare_v2_6ecce63f.jpg" alt="Pet Care" className="absolute inset-0 w-full h-full object-cover transition-[filter] duration-200 group-hover:brightness-[0.7]" style={{ filter: "brightness(0.55) saturate(1.1)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />
              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xs">🐾</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-white/70 text-[9px] font-mono-data tracking-widest uppercase mb-0.5">New</div>
                <h4 className="font-bold text-white text-sm leading-tight">Pet Care</h4>
                <p className="text-white/70 text-[10px] mt-0.5">Dog & cat food rated</p>
              </div>
            </div>
          </Link>
          {/* 5 — Store Guide */}
          <Link href="/stores">
            <div className="group flex-shrink-0 w-40 h-28 rounded-2xl overflow-hidden relative cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200 snap-start">
              <img src="/manus-storage/stores_2fb644ec.jpg" alt="Store Guide" className="absolute inset-0 w-full h-full object-cover transition-[filter] duration-200 group-hover:brightness-[0.7]" style={{ filter: "brightness(0.55) saturate(1.1)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />
              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Store size={12} className="text-white" />
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-white/70 text-[9px] font-mono-data tracking-widest uppercase mb-0.5">New</div>
                <h4 className="font-bold text-white text-sm leading-tight">Store Guide</h4>
                <p className="text-white/70 text-[10px] mt-0.5">13 US chains rated</p>
              </div>
            </div>
          </Link>
        </div>
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <button
              key={i}
              onClick={() => scrollWhatsNewTo(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: whatsNewActiveIdx === i ? 20 : 6,
                height: 6,
                background: whatsNewActiveIdx === i
                  ? (isDark ? "#3FA34D" : "#0B3D2E")
                  : (isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)"),
              }}
              aria-label={`Go to card ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Daily Tip ── */}
      <div className="px-4 mb-5">
        <div className="ec-section-label mb-2 px-1">Today's Tip</div>
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: theme === 'dark' ? '#1c2a22' : '#F0FAF2',
            borderColor: theme === 'dark' ? '#2d4a38' : '#B8E8BE',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${tip.color}18` }}
            >
              <TipIcon size={18} style={{ color: tip.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm mb-1">{tip.title}</h3>
              <p className="text-stone-500 dark:text-stone-400 text-xs leading-relaxed">{tip.body}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Example Products ── */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="ec-section-label">Example Products</div>
          <button
            onClick={() => navigate("/scan")}
            className="text-xs text-[#145A3A] dark:text-[#3FA34D] font-semibold flex items-center gap-1"
          >
            Scan yours <ChevronRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {featuredProducts.map((p, i) => (
            <OasisProductCard
              key={i}
              name={p.name}
              brand={p.brand}
              imageUrl={p.imageUrl}
              thumbnailUrl={p.thumbnailUrl}
              score={p.score}
              scoreColor={p.scoreColor}
              category={p.category}
              averagePrice={p.averagePrice}
              priceSource="estimate"
              onClick={() => {
                // Strip the extra UI-only fields, but keep score as precomputedScore
                const { score, scoreColor: _sc, ...rest } = p;
                const product: FoodProduct = { ...rest, precomputedScore: score };
                setSelectedProduct(product);
                navigate("/product-detail");
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Healthier Alternatives Showcase ── */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="ec-section-label">Common Swaps</div>
          <button
            onClick={() => navigate("/scan")}
            className="text-xs font-semibold flex items-center gap-1"
            style={{ color: "#145A3A" }}
          >
            Scan to compare <ChevronRight size={12} />
          </button>
        </div>
        <div
          className="overflow-hidden"
          style={{
            borderRadius: 20,
            border: isDark ? "1px solid #1e4a32" : "1px solid #c8ecd4",
            background: isDark
              ? "linear-gradient(160deg, #0d2318 0%, #0f2a1e 100%)"
              : "linear-gradient(160deg, #f4fdf6 0%, #edf9f1 100%)",
            boxShadow: isDark
              ? "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)"
              : "0 4px 20px rgba(11,61,46,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 pt-4 pb-3"
            style={{ borderBottom: isDark ? "1px solid #1e4a32" : "1px solid #d8f0df" }}
          >
            <div
              className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #0B3D2E, #1A7048)",
                boxShadow: "0 2px 8px rgba(11,61,46,0.3)",
              }}
            >
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="flex-1">
              <p
                className="text-sm font-bold leading-none"
                style={{ color: isDark ? "#86efac" : "#0B3D2E", fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Healthier Alternatives
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: isDark ? "#5a9a72" : "#4a7c5e" }}>Real swaps for common products</p>
            </div>
          </div>

          {/* Swap rows */}
          <div className="p-3 space-y-2">
            {([
              {
                bad:  { name: "Jif Creamy Peanut Butter",         brand: "Jif",              score: 57, img: "/manus-storage/jif_creamy_pb_4bbfc707.jpg",        barcode: "0051500255162", flags: ["Sugar as main ingredient", "Hydrogenated fat"] },
                good: { name: "Justin's Classic Peanut Butter",   brand: "Justin's",         score: 91, img: "/manus-storage/justins_classic_pb_da867e8b.jpg",  barcode: "855188003004",  positives: ["Dry-roasted peanuts", "No seed oils"] },
                reason: "Dry-roasted peanuts only, no palm oil",
              },
              {
                bad:  { name: "Lay's Classic Potato Chips",        brand: "Frito-Lay",        score: 47, img: "/manus-storage/lays_classic_chips_b228fe7f.jpg",   barcode: "0028400199148", flags: ["Seed oil", "Canola + soybean oil"] },
                good: { name: "Siete Grain Free Tortilla Chips",   brand: "Siete Family Foods", score: 88, img: "/manus-storage/siete_grain_free_chips_f471db46.jpg", barcode: "0851769007010", positives: ["Avocado oil", "3 ingredients"] },
                reason: "Avocado oil, 3 clean ingredients",
              },
              {
                bad:  { name: "Yoplait Original Strawberry",       brand: "Yoplait",          score: 47, img: "/manus-storage/yoplait_strawberry_da2fccc6.jpg",  barcode: "070470003009",  flags: ["Carmine dye", "Sugar in top 3", "Modified starch"] },
                good: { name: "Stonyfield Organic Plain",          brand: "Stonyfield",       score: 85, img: "/manus-storage/stonyfield_plain_b629aa2b.jpg",  barcode: "0052159000011", positives: ["Organic milk", "No added sugar"] },
                reason: "Organic, no artificial flavors",
              },
            ]).map((swap, i) => (
              <div
                key={i}
                className="flex items-center gap-2"
                style={{
                  background: isDark ? "#142b1e" : "white",
                  borderRadius: 14,
                  padding: "10px 12px",
                  border: isDark ? "1px solid #1e4a32" : "1px solid #e8f4ec",
                  boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(11,61,46,0.06)",
                }}
              >
                {/* Bad product — tappable: navigates to /scan?barcode=XXX */}
                <button
                  className="flex items-center gap-2 flex-1 min-w-0 text-left group active:scale-95 transition-transform"
                  onClick={() => navigate(`/scan?barcode=${swap.bad.barcode}&score=${swap.bad.score}`)}
                  title={`Scan ${swap.bad.name} to verify`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden"
                    style={{ background: isDark ? "#2a0f0f" : "#fff5f5", border: isDark ? "1px solid #7f1d1d" : "1px solid #fca5a5" }}
                  >
                    <img src={swap.bad.img} alt={swap.bad.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold truncate" style={{ color: isDark ? "#e8f4ec" : "#1a1a1a" }}>{swap.bad.name}</p>
                    <p className="text-[9px]" style={{ color: isDark ? "#6b9a7a" : "#9ca3af" }}>{swap.bad.brand}</p>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: isDark ? "#2a0f0f" : "#fee2e2", color: isDark ? "#f87171" : "#dc2626" }}
                      >
                        {swap.bad.score}/100
                      </span>
                      <ChevronRight size={9} style={{ color: isDark ? "#f87171" : "#dc2626", flexShrink: 0 }} />
                    </div>
                    {/* Inline flag chips */}
                    <div className="flex flex-wrap gap-0.5">
                      {swap.bad.flags.slice(0, 2).map((flag: string) => (
                        <span
                          key={flag}
                          className="text-[8px] font-medium px-1 py-0.5 rounded"
                          style={{ background: isDark ? "#3b1515" : "#fef2f2", color: isDark ? "#fca5a5" : "#b91c1c" }}
                        >
                          ⚠ {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>

                {/* Arrow */}
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #0B3D2E, #1A7048)", boxShadow: "0 2px 6px rgba(11,61,46,0.3)" }}
                >
                  <ArrowRight size={12} className="text-white" />
                </div>

                {/* Good product — tappable: navigates to /scan?barcode=XXX */}
                <button
                  className="flex items-center gap-2 flex-1 min-w-0 text-left group active:scale-95 transition-transform"
                  onClick={() => navigate(`/scan?barcode=${swap.good.barcode}&score=${swap.good.score}`)}
                  title={`View ${swap.good.name}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden"
                    style={{ background: isDark ? "#0f2a1e" : "#f0faf2", border: isDark ? "1px solid #1e5c32" : "1px solid #86d086" }}
                  >
                    <img src={swap.good.img} alt={swap.good.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold truncate" style={{ color: isDark ? "#e8f4ec" : "#1a1a1a" }}>{swap.good.name}</p>
                    <p className="text-[9px]" style={{ color: isDark ? "#6b9a7a" : "#9ca3af" }}>{swap.good.brand}</p>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: isDark ? "#0f2a1e" : "#e8f9ee", color: isDark ? "#4ade80" : "#145A3A" }}
                      >
                        {swap.good.score}/100
                      </span>
                      <ChevronRight size={9} style={{ color: isDark ? "#4ade80" : "#145A3A", flexShrink: 0 }} />
                    </div>
                    {/* Inline positive chips */}
                    <div className="flex flex-wrap gap-0.5">
                      {swap.good.positives.slice(0, 2).map((pos: string) => (
                        <span
                          key={pos}
                          className="text-[8px] font-medium px-1 py-0.5 rounded"
                          style={{ background: isDark ? "#0a2218" : "#f0fdf4", color: isDark ? "#86efac" : "#166534" }}
                        >
                          ✓ {pos}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-4 pb-4">
            <button
              onClick={() => navigate("/scan")}
              className="w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #0B3D2E, #1A7048)",
                color: "white",
                boxShadow: "0 4px 12px rgba(11,61,46,0.25)",
              }}
            >
              <ScanLine size={14} />
              Scan a product to find your alternatives
            </button>
          </div>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="px-4 mb-6">
        <p className="text-center text-[10px] text-stone-400 dark:text-stone-600 leading-relaxed">
          Scores are informational only and not medical advice.
          Always consult a healthcare professional for dietary guidance.
        </p>
      </div>

    </div>
  );
}
