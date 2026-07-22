/**
 * Body Benefits Page
 * Educational guide on which foods support different body systems.
 * Dark forest green theme, premium cards, smooth animations.
 */
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, ChevronRight, Zap, Star, ExternalLink,
  Sparkles, BookOpen, Info,
} from "lucide-react";
import {
  BODY_BENEFITS,
  getBodyBenefitCategory,
  type BodyBenefitCategory,
  type BodyBenefitFood,
} from "@/lib/bodyBenefitsDatabase";

// ─── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score, accentColor }: { score: number; accentColor: string }) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44` }}
    >
      <Star size={9} fill="currentColor" />
      {score}/10
    </div>
  );
}

// ─── Nutrient Pill ────────────────────────────────────────────────────────────
function NutrientPill({
  nutrient,
  accentColor,
}: {
  nutrient: { name: string; why: string; amount?: string };
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left rounded-xl p-3 transition-all"
      style={{
        background: open ? `${accentColor}18` : "rgba(255,255,255,0.05)",
        border: `1px solid ${open ? accentColor + "44" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accentColor }} />
          <span className="text-white font-semibold text-sm truncate">{nutrient.name}</span>
          {nutrient.amount && (
            <span className="text-[10px] font-mono flex-shrink-0" style={{ color: accentColor }}>
              {nutrient.amount}
            </span>
          )}
        </div>
        <Info size={13} className="flex-shrink-0 text-white/40" />
      </div>
      {open && (
        <p className="text-white/60 text-xs leading-relaxed mt-2 pl-3.5">{nutrient.why}</p>
      )}
    </button>
  );
}

// ─── Food Detail Sheet ────────────────────────────────────────────────────────
function FoodDetailSheet({
  food,
  accentColor,
  onClose,
  onNavigate,
}: {
  food: BodyBenefitFood;
  accentColor: string;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Animate in
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transform = "translateY(100%)";
    requestAnimationFrame(() => {
      el.style.transition = "transform 0.38s cubic-bezier(0.32,0.72,0,1)";
      el.style.transform = "translateY(0)";
    });
  }, []);

  const handleClose = () => {
    const el = sheetRef.current;
    if (!el) { onClose(); return; }
    el.style.transition = "transform 0.28s cubic-bezier(0.32,0.72,0,1)";
    el.style.transform = "translateY(100%)";
    setTimeout(onClose, 280);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        ref={sheetRef}
        className="relative rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(180deg, #0a1f12 0%, #061510 100%)",
          maxHeight: "90vh",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Hero image */}
        <div className="relative h-52 overflow-hidden flex-shrink-0">
          <img
            src={food.imageUrl}
            alt={food.name}
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.75)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, #0a1f12 0%, transparent 60%)" }}
          />
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          >
            <ArrowLeft size={16} className="text-white" />
          </button>
          {/* Score badge */}
          <div className="absolute top-3 left-3">
            <ScoreBadge score={food.score} accentColor={accentColor} />
          </div>
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: accentColor }}>
              {food.tagline}
            </p>
            <h2 className="text-white font-bold text-xl leading-tight">{food.name}</h2>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 pb-8 pt-4 space-y-5">
          {/* Explanation */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={13} style={{ color: accentColor }} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
                Why It Works
              </span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">{food.explanation}</p>
          </div>

          {/* Key Nutrients */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} style={{ color: accentColor }} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
                Key Nutrients
              </span>
              <span className="text-[10px] text-white/30">(tap to expand)</span>
            </div>
            <div className="space-y-2">
              {food.keyNutrients.map(n => (
                <NutrientPill key={n.name} nutrient={n} accentColor={accentColor} />
              ))}
            </div>
          </div>

          {/* Serving suggestion */}
          <div
            className="rounded-2xl p-4"
            style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}30` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} style={{ color: accentColor }} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
                How to Eat It
              </span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">{food.servingSuggestion}</p>
          </div>

          {/* Database link */}
          {food.dbPath && food.dbLabel && (
            <button
              onClick={() => { handleClose(); setTimeout(() => onNavigate(food.dbPath!), 300); }}
              className="w-full flex items-center justify-between rounded-2xl p-4 transition-all active:scale-98"
              style={{
                background: "linear-gradient(135deg, #0f3d24, #1a5c35)",
                border: "1px solid rgba(74,222,128,0.2)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(74,222,128,0.15)" }}
                >
                  <ExternalLink size={16} className="text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">{food.dbLabel}</p>
                  <p className="text-white/50 text-xs">View ratings & more foods</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-white/40" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Food Card ────────────────────────────────────────────────────────────────
function FoodCard({
  food,
  accentColor,
  index,
  onSelect,
}: {
  food: BodyBenefitFood;
  accentColor: string;
  index: number;
  onSelect: (food: BodyBenefitFood) => void;
}) {
  return (
    <button
      onClick={() => onSelect(food)}
      className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-98"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Image */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={food.imageUrl}
          alt={food.name}
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.8)" }}
          loading="lazy"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(6,21,16,0.95) 0%, transparent 55%)" }}
        />
        <div className="absolute top-2 right-2">
          <ScoreBadge score={food.score} accentColor={accentColor} />
        </div>
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-white font-bold text-sm leading-tight">{food.name}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-xs font-semibold mb-1.5" style={{ color: accentColor }}>{food.tagline}</p>
        <p className="text-white/55 text-xs leading-relaxed line-clamp-2">{food.explanation}</p>

        {/* Top 2 nutrients */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {food.keyNutrients.slice(0, 2).map(n => (
            <span
              key={n.name}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${accentColor}18`, color: accentColor }}
            >
              {n.name}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 mt-2.5" style={{ color: accentColor }}>
          <span className="text-[11px] font-semibold">View details</span>
          <ChevronRight size={11} />
        </div>
      </div>
    </button>
  );
}

// ─── Category Detail Page ─────────────────────────────────────────────────────
function CategoryDetailPage({ category }: { category: BodyBenefitCategory }) {
  const [, navigate] = useLocation();
  const [selectedFood, setSelectedFood] = useState<BodyBenefitFood | null>(null);

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: "linear-gradient(180deg, #061510 0%, #040e0a 100%)" }}
    >
      {/* Hero */}
      <div
        className="relative px-4 pt-12 pb-8 overflow-hidden"
        style={{ background: category.gradient }}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${category.glowColor}, transparent)`,
          }}
        />

        {/* Back button */}
        <button
          onClick={() => navigate("/body-benefits")}
          className="relative flex items-center gap-2 mb-6"
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
          >
            <ArrowLeft size={16} className="text-white" />
          </div>
          <span className="text-white/60 text-sm">Body Benefits</span>
        </button>

        {/* Title */}
        <div className="relative">
          <div className="text-5xl mb-3">{category.emoji}</div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: category.accentColor }}
          >
            {category.bodyPart}
          </p>
          <h1 className="text-white font-bold text-3xl leading-tight mb-2">
            {category.name}
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">{category.description}</p>
        </div>
      </div>

      {/* Quick tip */}
      <div className="px-4 mt-4">
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{
            background: `${category.accentColor}12`,
            border: `1px solid ${category.accentColor}30`,
          }}
        >
          <Sparkles size={16} style={{ color: category.accentColor }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: category.accentColor }}
            >
              Quick Tip
            </p>
            <p className="text-white/80 text-sm leading-relaxed">{category.quickTip}</p>
          </div>
        </div>
      </div>

      {/* Top Foods */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: category.accentColor }}
          >
            Top Foods for {category.name}
          </p>
          <div
            className="h-px flex-1"
            style={{ background: `linear-gradient(to right, ${category.accentColor}40, transparent)` }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {category.foods.map((food, i) => (
            <FoodCard
              key={food.id}
              food={food}
              accentColor={category.accentColor}
              index={i}
              onSelect={setSelectedFood}
            />
          ))}
        </div>
      </div>

      {/* Food detail sheet */}
      {selectedFood && (
        <FoodDetailSheet
          food={selectedFood}
          accentColor={category.accentColor}
          onClose={() => setSelectedFood(null)}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}

// ─── Category Grid Card ───────────────────────────────────────────────────────
function CategoryCard({
  category,
  index,
  onSelect,
}: {
  category: BodyBenefitCategory;
  index: number;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(category.id)}
      className="relative overflow-hidden rounded-2xl text-left transition-all active:scale-97"
      style={{
        background: category.gradient,
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: `0 4px 24px ${category.glowColor}`,
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 100% 80% at 50% 120%, ${category.glowColor}, transparent)`,
        }}
      />

      <div className="relative p-4">
        {/* Emoji + food count */}
        <div className="flex items-start justify-between mb-3">
          <div className="text-3xl">{category.emoji}</div>
          <div
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${category.accentColor}22`, color: category.accentColor }}
          >
            {category.foods.length} foods
          </div>
        </div>

        {/* Name + tagline */}
        <h3 className="text-white font-bold text-base leading-tight mb-1">{category.name}</h3>
        <p className="text-white/55 text-xs leading-relaxed line-clamp-2">{category.tagline}</p>

        {/* CTA */}
        <div className="flex items-center gap-1 mt-3" style={{ color: category.accentColor }}>
          <span className="text-[11px] font-semibold">Explore foods</span>
          <ChevronRight size={11} />
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BodyBenefitsPage() {
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const categoryId = params?.id;

  // If a category ID is in the URL, show the detail page
  if (categoryId) {
    const category = getBodyBenefitCategory(categoryId);
    if (!category) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#061510" }}>
          <div className="text-center px-6">
            <p className="text-white/60 mb-4">Category not found.</p>
            <button
              onClick={() => navigate("/body-benefits")}
              className="text-green-400 text-sm font-semibold"
            >
              ← Back to Body Benefits
            </button>
          </div>
        </div>
      );
    }
    return <CategoryDetailPage category={category} />;
  }

  // Main grid
  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: "linear-gradient(180deg, #061510 0%, #040e0a 100%)" }}
    >
      {/* Header */}
      <div
        className="relative px-4 pt-12 pb-8 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #061510 0%, #0a2218 55%, #0f3024 100%)" }}
      >
        {/* Ambient orbs */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%)",
            transform: "translate(-30%, 30%)",
          }}
        />

        {/* Back */}
        <button
          onClick={() => navigate("/more")}
          className="relative flex items-center gap-2 mb-6"
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
          >
            <ArrowLeft size={16} className="text-white" />
          </div>
          <span className="text-white/50 text-sm">More</span>
        </button>

        {/* Title */}
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-green-400 mb-1">
            Food as Medicine
          </p>
          <h1 className="text-white font-bold text-3xl leading-tight mb-2">
            Body Benefits
          </h1>
          <p className="text-white/55 text-sm leading-relaxed">
            Discover which foods power each system in your body — backed by science, not marketing.
          </p>
        </div>

        {/* Stats row */}
        <div className="relative flex gap-3 mt-5">
          {[
            { value: "8", label: "Body Systems" },
            { value: "35+", label: "Top Foods" },
            { value: "140+", label: "Key Nutrients" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="flex-1 rounded-xl py-2.5 px-3 text-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="text-green-400 font-bold text-base" style={{ fontFamily: "'DM Mono', monospace" }}>
                {value}
              </div>
              <div className="text-white/40 text-[10px] font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Grid */}
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
            Choose a Body System
          </p>
          <div className="h-px flex-1" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.1), transparent)" }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {BODY_BENEFITS.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              index={i}
              onSelect={id => navigate(`/body-benefits/${id}`)}
            />
          ))}
        </div>
      </div>

      {/* Bottom educational note */}
      <div className="px-4 mt-6">
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <BookOpen size={14} className="text-green-400/60 flex-shrink-0 mt-0.5" />
          <p className="text-white/35 text-xs leading-relaxed">
            Information is educational and based on peer-reviewed research. Always consult a healthcare provider before making significant dietary changes, especially if you have existing health conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
