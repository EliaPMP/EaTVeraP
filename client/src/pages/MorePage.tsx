/**
 * Explore Page — Ultra-Premium Redesign
 * Three large featured cards (Explore Guides, Recipes, Fitness Tracker)
 * + categorized tool sections with cinematic depth
 */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  Search, Sun, Moon as MoonIcon, ChevronRight, Sparkles,
  Leaf, Dumbbell, Heart, Brain, Star,
  Flame, ShoppingCart, Utensils, Activity,
  Scale, BookOpen, Filter, Bookmark,
  ArrowLeftRight, History, AlertCircle,
  Settings, User, Target, Droplets,
  Moon, Zap, Shield, Eye,
  Apple, Beef, Fish, Cookie, Milk,
  Wheat, Snowflake, Baby, PawPrint,
  ChefHat, Map, BarChart3, ScanLine,
  X,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

// ── User profile for personalization ────────────────────────────────────────
function getMainGoal(): string {
  try {
    const raw = localStorage.getItem("eatclean-body-profile");
    if (!raw) return "";
    const p = JSON.parse(raw);
    return p.mainGoal || p.archetype || "";
  } catch { return ""; }
}

// ── Featured cards data ──────────────────────────────────────────────────────
const FEATURED_CARDS = [
  {
    id: "explore-guides",
    label: "EXPLORE GUIDES",
    title: "Food Discovery Hub",
    subtitle: "14 categories • 3,000+ products rated",
    description: "Fruits, meats, snacks, dairy, grains, beverages and more — every food scored and explained.",
    cta: "Browse Guides",
    path: "/explore",
    gradient: "linear-gradient(135deg, #0a2e1a 0%, #0f4a28 40%, #1a6b3a 80%, #22863a 100%)",
    glowColor: "rgba(34,134,58,0.5)",
    accentColor: "#4ade80",
    badgeColor: "rgba(74,222,128,0.2)",
    badgeBorder: "rgba(74,222,128,0.4)",
    graphic: "guides",
  },
  {
    id: "recipes",
    label: "RECIPES",
    title: "Clean Meal Library",
    subtitle: "40+ recipes • 9 categories",
    description: "High-protein, low-carb, muscle building — every recipe scored for clean ingredients.",
    cta: "View Recipes",
    path: "/recipes",
    gradient: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4a 40%, #3d2060 80%, #4a2575 100%)",
    glowColor: "rgba(139,92,246,0.45)",
    accentColor: "#c4b5fd",
    badgeColor: "rgba(196,181,253,0.15)",
    badgeBorder: "rgba(196,181,253,0.35)",
    graphic: "recipes",
  },
  {
    id: "fitness",
    label: "FITNESS TRACKER",
    title: "AI Workout Logger",
    subtitle: "AI-powered • Real-time tracking",
    description: "Log workouts, track calories burned, and get AI-personalized programs tailored to your goals.",
    cta: "Open Tracker",
    path: "/fitness",
    gradient: "linear-gradient(135deg, #0a1a2e 0%, #0f2d4a 40%, #1a4060 80%, #1e4d75 100%)",
    glowColor: "rgba(59,130,246,0.45)",
    accentColor: "#93c5fd",
    badgeColor: "rgba(147,197,253,0.15)",
    badgeBorder: "rgba(147,197,253,0.35)",
    graphic: "fitness",
  },
];

// ── Tool sections ────────────────────────────────────────────────────────────
const TOOL_SECTIONS = [
  {
    id: "discovery",
    title: "Discovery",
    icon: Map,
    color: "#fbbf24",
    items: [
      { icon: Eye, label: "Explore Guides", desc: "14 food categories, 3,000+ products", path: "/explore", color: "#4ade80", badge: null },
      { icon: ShoppingCart, label: "Store Guide", desc: "Best grocery stores & what to buy", path: "/stores", color: "#60a5fa", badge: null },
      { icon: Sparkles, label: "Recommended For You", desc: "AI picks based on your goals", path: "/explore", color: "#c4b5fd", badge: "AI" },
    ],
  },
  {
    id: "nutrition",
    title: "Nutrition",
    icon: Leaf,
    color: "#4ade80",
    items: [
      { icon: ChefHat, label: "Recipes", desc: "Clean meals aligned with your goals", path: "/recipes", color: "#c4b5fd", badge: null },
      { icon: Brain, label: "Body Benefits", desc: "Foods for brain, heart, gut & more", path: "/body-benefits", color: "#f9a8d4", badge: "New" },
      { icon: Target, label: "Nutrition Goals", desc: "Set daily macro & calorie targets", path: "/goals", color: "#4ade80", badge: null },
      { icon: BookOpen, label: "Learn", desc: "Understand ingredients & labels", path: "/learn", color: "#fbbf24", badge: null },
      { icon: Filter, label: "Diet Filters", desc: "Keto, paleo, vegan & more", path: "/filters", color: "#60a5fa", badge: null },
    ],
  },
  {
    id: "food-tools",
    title: "Food Tools",
    icon: ScanLine,
    color: "#60a5fa",
    items: [
      { icon: ArrowLeftRight, label: "Compare", desc: "Side-by-side product comparison", path: "/compare", color: "#60a5fa", badge: null },
      { icon: Bookmark, label: "Favorites", desc: "Your saved clean products", path: "/favorites", color: "#f9a8d4", badge: null },
      { icon: ArrowLeftRight, label: "Saved Swaps", desc: "Healthier alternatives you've saved", path: "/saved-swaps", color: "#fbbf24", badge: null },
      { icon: History, label: "Scan History", desc: "Products you've previously scanned", path: "/history", color: "#a78bfa", badge: null },
      { icon: AlertCircle, label: "Avoided Ingredients", desc: "Your personal ingredient blocklist", path: "/avoided", color: "#f87171", badge: null },
    ],
  },
  {
    id: "wellness",
    title: "Wellness",
    icon: Heart,
    color: "#f9a8d4",
    items: [
      { icon: Leaf, label: "Natural Recovery", desc: "Science-backed remedies for 13 conditions", path: "/natural-recovery", color: "#4ade80", badge: null },
      { icon: Dumbbell, label: "Fitness Tracker", desc: "AI workout programs & session logs", path: "/fitness", color: "#93c5fd", badge: "AI" },
      { icon: Target, label: "Edit Body Goals", desc: "Update your fitness & body targets", path: "/onboarding", color: "#fbbf24", badge: null },
    ],
  },
  {
    id: "account",
    title: "Settings & Account",
    icon: Settings,
    color: "rgba(255,255,255,0.4)",
    items: [
      { icon: Settings, label: "Settings", desc: "App preferences & notifications", path: "/settings", color: "rgba(255,255,255,0.5)", badge: null },
      { icon: User, label: "Account", desc: "Profile & subscription", path: "/account", color: "rgba(255,255,255,0.5)", badge: null },
    ],
  },
];

// ── Recommended cards ────────────────────────────────────────────────────────
const ALL_RECOMMENDED = [
  { icon: Moon, label: "Sleep Quality", desc: "Improve sleep & recovery", path: "/natural-recovery#insomnia", color: "#818cf8", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.25)" },
  { icon: Droplets, label: "Hydration", desc: "Drink more water today", path: "/natural-recovery", color: "#38bdf8", bg: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.22)" },
  { icon: Zap, label: "Stress Relief", desc: "Calm your nervous system", path: "/natural-recovery#stress", color: "#c4b5fd", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.25)" },
  { icon: Flame, label: "Fat Burning", desc: "Foods that boost metabolism", path: "/body-benefits", color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.22)" },
  { icon: Dumbbell, label: "Muscle Growth", desc: "High-protein meal plans", path: "/recipes", color: "#4ade80", bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.22)" },
  { icon: Shield, label: "Immunity Boost", desc: "Foods that fight illness", path: "/natural-recovery", color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.22)" },
  { icon: Brain, label: "Brain Health", desc: "Sharpen focus & memory", path: "/body-benefits/brain", color: "#f9a8d4", bg: "rgba(249,168,212,0.12)", border: "rgba(249,168,212,0.22)" },
  { icon: Heart, label: "Heart Health", desc: "Protect your cardiovascular system", path: "/body-benefits/heart", color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.22)" },
];

function getRecommended(goal: string) {
  if (goal === "lose_fat" || goal === "weight_loss") return [ALL_RECOMMENDED[3], ALL_RECOMMENDED[0], ALL_RECOMMENDED[2], ALL_RECOMMENDED[1]];
  if (goal === "build_muscle" || goal === "muscle_building") return [ALL_RECOMMENDED[4], ALL_RECOMMENDED[3], ALL_RECOMMENDED[6], ALL_RECOMMENDED[5]];
  if (goal === "performance") return [ALL_RECOMMENDED[4], ALL_RECOMMENDED[3], ALL_RECOMMENDED[0], ALL_RECOMMENDED[6]];
  return [ALL_RECOMMENDED[0], ALL_RECOMMENDED[2], ALL_RECOMMENDED[4], ALL_RECOMMENDED[7]];
}

// ── Graphic components ───────────────────────────────────────────────────────
function GuidesGraphic() {
  // Real Unsplash food thumbnails for each category
  const foods = [
    { img: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=80&h=80&fit=crop&auto=format", label: "Fruits", score: 94, color: "#4ade80" },
    { img: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=80&h=80&fit=crop&auto=format", label: "Meats", score: 88, color: "#f87171" },
    { img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=80&h=80&fit=crop&auto=format", label: "Seafood", score: 91, color: "#60a5fa" },
    { img: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=80&h=80&fit=crop&auto=format", label: "Snacks", score: 72, color: "#fbbf24" },
    { img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=80&h=80&fit=crop&auto=format", label: "Dairy", score: 85, color: "#e2e8f0" },
    { img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=80&h=80&fit=crop&auto=format", label: "Grains", score: 79, color: "#d97706" },
  ];
  return (
    <div className="relative flex-shrink-0" style={{ width: 138, height: 128 }}>
      <div className="absolute inset-0 grid grid-cols-3 gap-1.5 p-1">
        {foods.map(({ img, label, score, color }) => (
          <div
            key={label}
            className="relative flex flex-col items-center justify-end overflow-hidden rounded-xl"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <img src={img} alt={label} className="absolute inset-0 w-full h-full object-cover opacity-80" style={{ borderRadius: 11 }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)", borderRadius: 11 }} />
            <div className="relative z-10 pb-0.5 text-center">
              <div style={{ fontSize: 9.5, fontWeight: 800, color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: 6.5, color: "rgba(255,255,255,0.55)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.1 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 50%, rgba(74,222,128,0.06) 0%, transparent 70%)", borderRadius: 12 }} />
    </div>
  );
}

function RecipesGraphic() {
  const recipes = [
    {
      img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=120&h=80&fit=crop&auto=format",
      name: "Salmon Bowl",
      protein: "42g",
      cal: 420,
      tag: "High Protein",
      tagColor: "#f97316",
    },
    {
      img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=120&h=80&fit=crop&auto=format",
      name: "Green Power Salad",
      protein: "18g",
      cal: 290,
      tag: "Weight Loss",
      tagColor: "#4ade80",
    },
  ];
  return (
    <div className="relative flex-shrink-0" style={{ width: 138, height: 128 }}>
      <div className="flex flex-col gap-1.5 p-1 h-full justify-center">
        {recipes.map(({ img, name, protein, cal, tag, tagColor }) => (
          <div
            key={name}
            className="relative overflow-hidden rounded-xl flex items-end"
            style={{ height: 52, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <img src={img} alt={name} className="absolute inset-0 w-full h-full object-cover opacity-75" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 100%)" }} />
            <div className="relative z-10 flex items-center justify-between w-full px-2 pb-1.5">
              <div>
                <div style={{ fontSize: 8.5, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.2 }}>{name}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span style={{ fontSize: 7, padding: "0px 4px", borderRadius: 4, background: `${tagColor}25`, border: `1px solid ${tagColor}40`, color: tagColor, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{tag}</span>
                </div>
              </div>
              <div className="text-right">
                <div style={{ fontSize: 10, fontWeight: 800, color: "#c4b5fd", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{protein}</div>
                <div style={{ fontSize: 6.5, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace" }}>protein</div>
                <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.45)", fontFamily: "'DM Mono', monospace", marginTop: 1 }}>{cal} cal</div>
              </div>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-center rounded-lg py-1" style={{ background: "rgba(196,181,253,0.1)", border: "1px solid rgba(196,181,253,0.2)" }}>
          <span style={{ fontSize: 8, color: "#c4b5fd", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>+ 38 more clean recipes →</span>
        </div>
      </div>
    </div>
  );
}

function FitnessGraphic() {
  const chartPoints = [22, 38, 30, 52, 44, 60, 55, 72, 68, 80];
  const maxVal = 85;
  const w = 100;
  const h = 36;
  const pts = chartPoints.map((v, i) => {
    const x = (i / (chartPoints.length - 1)) * w;
    const y = h - (v / maxVal) * h;
    return `${x},${y}`;
  }).join(" ");
  const fillPts = `0,${h} ${pts} ${w},${h}`;
  return (
    <div className="relative flex-shrink-0" style={{ width: 138, height: 128 }}>
      <div className="flex flex-col h-full justify-center gap-1.5 p-1">
        {/* Watch face */}
        <div
          className="mx-auto flex flex-col items-center justify-center rounded-[18px] relative overflow-hidden"
          style={{
            width: 78, height: 86,
            background: "linear-gradient(160deg, #0a1a2e 0%, #0f2d4a 50%, #1a3d5c 100%)",
            border: "2px solid rgba(147,197,253,0.3)",
            boxShadow: "0 0 24px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Screen reflection */}
          <div className="absolute top-0 left-0 right-0 h-8 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, transparent 100%)", borderRadius: "18px 18px 0 0" }} />
          <div style={{ fontSize: 6.5, color: "rgba(147,197,253,0.55)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 1 }}>Active Cal</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#93c5fd", fontFamily: "'DM Mono', monospace", lineHeight: 1, letterSpacing: "-0.03em" }}>548</div>
          <div style={{ fontSize: 6.5, color: "rgba(147,197,253,0.4)", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>kcal</div>
          <svg width={58} height={22} viewBox={`0 0 ${w} ${h}`}>
            <defs>
              <linearGradient id="fitAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={fillPts} fill="url(#fitAreaGrad)" />
            <polyline points={pts} fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* Side button */}
          <div className="absolute right-0 top-1/3" style={{ width: 3, height: 18, background: "rgba(147,197,253,0.25)", borderRadius: "0 2px 2px 0", transform: "translateX(2px)" }} />
        </div>
        {/* Stats row */}
        <div className="flex gap-1 justify-center">
          {[
            { label: "Steps", value: "8.2k", color: "#4ade80" },
            { label: "Min", value: "42", color: "#f97316" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center rounded-lg px-2 py-1" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 6.5, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Featured Card ────────────────────────────────────────────────────────────
function FeaturedCard({ card, isActive }: { card: typeof FEATURED_CARDS[0]; isActive: boolean }) {
  const [, navigate] = useLocation();
  return (
    <div
      onClick={() => navigate(card.path)}
      className="relative overflow-hidden cursor-pointer select-none"
      style={{
        borderRadius: 22,
        background: card.gradient,
        border: `1px solid ${card.badgeBorder}`,
        boxShadow: isActive ? `0 8px 40px ${card.glowColor}, 0 2px 8px rgba(0,0,0,0.4)` : "0 4px 20px rgba(0,0,0,0.3)",
        minHeight: 170,
        transition: "box-shadow 0.3s ease",
      }}
    >
      {/* Ambient glow blob */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -30, right: -20, width: 160, height: 160, borderRadius: "50%",
          background: `radial-gradient(circle, ${card.glowColor} 0%, transparent 70%)`,
        }}
      />
      {/* Grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")", borderRadius: 22 }}
      />

      <div className="relative flex items-stretch p-4 gap-3" style={{ zIndex: 1 }}>
        {/* Left: text content */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                style={{
                  fontSize: 8.5, fontWeight: 700, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: card.accentColor,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {card.label}
              </span>
              {card.id === "fitness" && (
                <span
                  style={{
                    fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 6,
                    background: card.badgeColor, border: `1px solid ${card.badgeBorder}`,
                    color: card.accentColor, fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  AI
                </span>
              )}
            </div>
            <h3
              style={{
                fontSize: 20, fontWeight: 800, color: "rgba(255,255,255,0.95)",
                fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.03em",
                lineHeight: 1.15, marginBottom: 6,
              }}
            >
              {card.title}
            </h3>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.45, fontFamily: "'DM Sans', sans-serif" }}>
              {card.description}
            </p>
          </div>
          <div className="mt-3">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.9)", fontFamily: "'DM Sans', sans-serif" }}>
                {card.cta}
              </span>
              <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.7)" }} />
            </div>
          </div>
        </div>

        {/* Right: graphic */}
        <div className="flex items-center justify-center flex-shrink-0">
          {card.graphic === "guides" && <GuidesGraphic />}
          {card.graphic === "recipes" && <RecipesGraphic />}
          {card.graphic === "fitness" && <FitnessGraphic />}
        </div>
      </div>
    </div>
  );
}

// ── Tool Row Item ────────────────────────────────────────────────────────────
function ToolRow({ item, isLast }: { item: typeof TOOL_SECTIONS[0]["items"][0]; isLast: boolean }) {
  const [, navigate] = useLocation();
  const Icon = item.icon;
  return (
    <div
      onClick={() => navigate(item.path)}
      className="flex items-center gap-3.5 cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        padding: "13px 16px",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* Icon chip */}
      <div
        className="flex items-center justify-center flex-shrink-0 rounded-[14px]"
        style={{
          width: 44, height: 44,
          background: `linear-gradient(135deg, ${item.color}22 0%, ${item.color}0f 100%)`,
          border: `1px solid ${item.color}30`,
          boxShadow: `0 2px 12px ${item.color}18`,
        }}
      >
        <Icon size={19} style={{ color: item.color }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: 14.5, fontWeight: 600, color: "rgba(255,255,255,0.88)",
              fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em",
            }}
          >
            {item.label}
          </span>
          {item.badge && (
            <span
              style={{
                fontSize: 8.5, fontWeight: 700, padding: "1px 6px", borderRadius: 5,
                background: item.badge === "AI" ? "rgba(196,181,253,0.18)" : "rgba(74,222,128,0.15)",
                border: item.badge === "AI" ? "1px solid rgba(196,181,253,0.3)" : "1px solid rgba(74,222,128,0.3)",
                color: item.badge === "AI" ? "#c4b5fd" : "#4ade80",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {item.badge}
            </span>
          )}
        </div>
        <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 1, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.3 }}>
          {item.desc}
        </p>
      </div>

      <ChevronRight size={15} style={{ color: "rgba(255,255,255,0.18)", flexShrink: 0 }} />
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function MorePage() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [activeFeatured, setActiveFeatured] = useState(0);
  // slideDir: "left" = new card enters from right, "right" = enters from left
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");
  const [isAnimating, setIsAnimating] = useState(false);
  const goal = getMainGoal();
  const recommended = getRecommended(goal);
  const { theme, toggleTheme } = useTheme();

  // Slide to a specific card index with direction
  const goToCard = (next: number, dir: "left" | "right") => {
    if (isAnimating) return;
    setSlideDir(dir);
    setIsAnimating(true);
    setActiveFeatured(next);
    setTimeout(() => setIsAnimating(false), 380);
  };

  // Touch swipe state for featured cards
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) {
        goToCard((activeFeatured + 1) % FEATURED_CARDS.length, "left");
      } else {
        goToCard((activeFeatured - 1 + FEATURED_CARDS.length) % FEATURED_CARDS.length, "right");
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Auto-rotate featured cards every 5s (always left direction)
  useEffect(() => {
    const t = setInterval(() => {
      goToCard((activeFeatured + 1) % FEATURED_CARDS.length, "left");
    }, 5000);
    return () => clearInterval(t);
  }, [activeFeatured, isAnimating]);

  // Search filtering
  const allItems = TOOL_SECTIONS.flatMap(s => s.items.map(i => ({ ...i, section: s.title })));
  const filteredItems = query.trim()
    ? allItems.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.desc.toLowerCase().includes(query.toLowerCase()) ||
        i.section.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: "linear-gradient(180deg, #030d06 0%, #050f08 25%, #07160c 55%, #091c10 100%)" }}
    >
      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute"
          style={{
            top: "5%", left: "10%", width: 350, height: 350, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(22,163,74,0.06) 0%, transparent 65%)",
            willChange: "transform",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "40%", right: "-8%", width: 280, height: 280, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: "15%", left: "-5%", width: 320, height: 320, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 65%)",
          }}
        />
        {/* Subtle top aurora */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: 200,
            background: "linear-gradient(180deg, rgba(22,163,74,0.07) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* ── Hero Header ── */}
      <div
        className="relative px-5 pt-14 pb-5"
        style={{ zIndex: 1 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1
              style={{
                fontSize: 38, fontWeight: 900, color: "rgba(255,255,255,0.96)",
                fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.04em",
                lineHeight: 1.05, marginBottom: 6,
              }}
            >
              Explore
            </h1>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.38)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>
              Discover tools for nutrition, recovery,{"\n"}fitness &amp; wellness.
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-full"
            style={{
              width: 42, height: 42, marginTop: 4,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              transition: "all 0.2s ease",
            }}
          >
            {theme === "dark" ? (
              <Sun size={17} style={{ color: "rgba(255,255,255,0.7)" }} />
            ) : (
              <MoonIcon size={17} style={{ color: "rgba(255,255,255,0.7)" }} />
            )}
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="px-4 pb-5" style={{ position: "relative", zIndex: 1 }}>
        <div
          className="flex items-center gap-3 rounded-2xl px-4"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(16px)",
            height: 48,
          }}
        >
          <Search size={16} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search features, guides, tools..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 14, color: "rgba(255,255,255,0.78)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
            </button>
          )}
        </div>
      </div>

      {/* ── Search Results ── */}
      {filteredItems && (
        <div className="px-4 pb-4" style={{ position: "relative", zIndex: 1 }}>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8" style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
              No results for "{query}"
            </div>
          ) : (
            <div
              className="overflow-hidden"
              style={{
                borderRadius: 18,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
              }}
            >
              {filteredItems.map((item, i) => (
                <ToolRow key={item.path + i} item={item} isLast={i === filteredItems.length - 1} />
              ))}
            </div>
          )}
        </div>
      )}

      {!filteredItems && (
        <>
          {/* ── FEATURED section ── */}
          <div className="px-4 pb-4" style={{ position: "relative", zIndex: 1 }}>
            <div className="flex items-center gap-2 mb-3">
              <span
                style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                Featured
              </span>
            </div>

            {/* Featured card — swipeable with slide animation */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: "pan-y", overflow: "hidden", borderRadius: 20 }}
            >
              <div
                key={activeFeatured}
                style={{
                  animation: isAnimating
                    ? `featured-slide-${slideDir} 0.36s cubic-bezier(0.25, 0.46, 0.45, 0.94) both`
                    : undefined,
                  willChange: "transform",
                }}
              >
                <FeaturedCard card={FEATURED_CARDS[activeFeatured]} isActive={true} />
              </div>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {FEATURED_CARDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToCard(i, i > activeFeatured ? "left" : "right")}
                  style={{
                    width: i === activeFeatured ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === activeFeatured ? "#4ade80" : "rgba(255,255,255,0.15)",
                    transition: "all 0.3s ease",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Tool Sections ── */}
          {TOOL_SECTIONS.map(section => {
            const SectionIcon = section.icon;
            return (
              <div key={section.id} className="px-4 pb-5" style={{ position: "relative", zIndex: 1 }}>
                {/* Section header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center rounded-lg"
                      style={{
                        width: 24, height: 24,
                        background: `${section.color}18`,
                        border: `1px solid ${section.color}28`,
                      }}
                    >
                      <SectionIcon size={12} style={{ color: section.color }} />
                    </div>
                    <span
                      style={{
                        fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.82)",
                        fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em",
                      }}
                    >
                      {section.title}
                    </span>
                  </div>
                </div>

                {/* Items card */}
                <div
                  className="overflow-hidden"
                  style={{
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.035)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
                  }}
                >
                  {section.items.map((item, i) => (
                    <ToolRow key={`${section.id}-${item.label}`} item={item} isLast={i === section.items.length - 1} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* ── Recommended For You ── */}
          <div className="pb-4" style={{ position: "relative", zIndex: 1 }}>
            <div className="flex items-center justify-between px-4 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: "#fbbf24" }} />
                <span
                  style={{
                    fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.82)",
                    fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em",
                  }}
                >
                  Recommended For You
                </span>
              </div>
              <button
                onClick={() => navigate("/explore")}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 3 }}
              >
                See all <ChevronRight size={12} />
              </button>
            </div>

            <div
              className="flex gap-3 px-4"
              style={{ overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
            >
              {recommended.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    onClick={() => navigate(card.path)}
                    className="flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
                    style={{
                      width: 130,
                      borderRadius: 16,
                      background: card.bg,
                      border: `1px solid ${card.border}`,
                      padding: "14px 12px",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-xl mb-2.5"
                      style={{
                        width: 36, height: 36,
                        background: `${card.color}20`,
                        border: `1px solid ${card.color}30`,
                      }}
                    >
                      <Icon size={16} style={{ color: card.color }} />
                    </div>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em", marginBottom: 3 }}>
                      {card.label}
                    </p>
                    <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.35 }}>
                      {card.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 pt-2 pb-4" style={{ position: "relative", zIndex: 1 }}>
            <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginBottom: 16 }} />
            <p style={{ textAlign: "center", fontSize: 10.5, color: "rgba(255,255,255,0.12)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
              EatVera · Know What You Eat
            </p>
          </div>
        </>
      )}
    </div>
  );
}
