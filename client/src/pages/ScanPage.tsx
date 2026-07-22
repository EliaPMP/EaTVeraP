/**
 * EatVera ScanPage — v3 Premium Redesign
 * Design: iOS-first, minimal, instant-feel scanner
 * - New hero: "Know exactly what's in your food in 2 seconds."
 * - Full-screen scanner with light/dark mode fix
 * - Smooth scan animation + Analyzing overlay
 * - Results overlay directly on food image with big score + quality tags
 */
import { useState, useEffect, useRef } from "react";
import {
  Camera, Search, Hash, X, Loader2, Package, Beef, Fish,
  ScanLine, AlertCircle, History, Trash2, Zap, ChevronRight,
  Leaf, ShieldCheck, Sparkles,
} from "lucide-react";
import { shouldShowAlternatives } from "@/lib/alternativesEngine";
import { toast } from "sonner";
import BarcodeScanner from "@/components/BarcodeScanner";
import ProductResult from "@/pages/ProductResult";
import { searchProducts } from "@/lib/foodApi";
import type { FoodProduct } from "@/lib/foodApi";
import { analyzeIngredients, analyzeMeatProduct } from "@/lib/ingredientAnalysis";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRecentScans } from "@/hooks/useRecentScans";
import { OasisProductCard } from "@/components/OasisProductCard";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

/**
 * Normalize nutritionFacts from DB to canonical _100g keys.
 */
function normalizeNutriments(raw: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  const num = (v: unknown) => (v !== undefined && v !== null && !isNaN(Number(v)) ? Number(v) : undefined);
  for (const [k, v] of Object.entries(raw)) {
    if (k.endsWith("_100g")) {
      const n = num(v);
      if (n !== undefined) out[k] = n;
    }
  }
  const legacyMap: Record<string, string> = {
    calories: "energy-kcal_100g",
    protein: "proteins_100g",
    carbs: "carbohydrates_100g",
    fat: "fat_100g",
    fiber: "fiber_100g",
    sugar: "sugars_100g",
    sodium: "sodium_100g",
    calcium: "calcium_100g",
    iron: "iron_100g",
    potassium: "potassium_100g",
  };
  for (const [legacyKey, canonicalKey] of Object.entries(legacyMap)) {
    if (out[canonicalKey] === undefined) {
      const n = num(raw[legacyKey]);
      if (n !== undefined) out[canonicalKey] = n;
    }
  }
  return out;
}

const SOURCE_LABELS: Record<string, string> = {
  openfoodfacts: "Open Food Facts",
  usda: "USDA",
  "usda-sr": "USDA SR",
  estimated: "Estimated",
  database: "EatVera Database",
  external_api: "External API",
};

// ── Score ring (large, animated) ──────────────────────────────────────────────
function ScoreRingLarge({ score, size = 80 }: { score: number; size?: number }) {
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#4ade80" : score >= 40 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-bold leading-none" style={{ color, fontSize: size * 0.28, fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.03em" }}>{score}</span>
        <span className="text-white/40 font-medium" style={{ fontSize: size * 0.10 }}>/100</span>
      </div>
    </div>
  );
}

// ── Small score circle for recent scans ───────────────────────────────────────
function ScoreCircle({ score, size = 44 }: { score: number; size?: number }) {
  const sw = 3.5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#0B3D2E" : score >= 40 ? "#d97706" : "#dc2626";
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7e5e4" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute font-bold text-xs" style={{ color, fontFamily: "'DM Mono', monospace" }}>{score}</span>
    </div>
  );
}

// ── Quality tag chip ──────────────────────────────────────────────────────────
function QualityTag({ label, type }: { label: string; type: "warn" | "good" | "bad" | "info" }) {
  const styles = {
    warn: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
    good: { bg: "rgba(74,222,128,0.15)", color: "#4ade80", border: "rgba(74,222,128,0.3)" },
    bad:  { bg: "rgba(248,113,113,0.15)", color: "#f87171", border: "rgba(248,113,113,0.3)" },
    info: { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)", border: "rgba(255,255,255,0.15)" },
  }[type];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: styles.bg, color: styles.color, border: `1px solid ${styles.border}` }}
    >
      {label}
    </span>
  );
}

// ── Analyzing overlay ─────────────────────────────────────────────────────────
function AnalyzingOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: "rgba(5,18,10,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", animation: "analyzeFadeIn 0.22s ease-out both" }}
    >
      {/* Pulsing ring */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute w-24 h-24 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(78,184,122,0.18) 0%, transparent 70%)",
            animation: "analyzePulse 1.4s ease-in-out infinite",
          }}
        />
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)",
            border: "1px solid rgba(78,184,122,0.35)",
            boxShadow: "0 0 24px rgba(78,184,122,0.25)",
          }}
        >
          <Leaf size={24} style={{ color: "#4db87a" }} />
        </div>
      </div>

      {/* Dots */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-white font-semibold text-lg" style={{ letterSpacing: "-0.02em" }}>Analyzing…</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "#4db87a",
                animation: `analyzeDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Checking ingredients & nutrition</p>
      </div>

      <style>{`
        @keyframes analyzeFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes analyzePulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.35); opacity: 1; }
        }
        @keyframes analyzeDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Soft chime helper ────────────────────────────────────────────────────────
function playResultChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    // Two-tone ascending chime: C5 → E5
    const tones = [523.25, 659.25];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
    setTimeout(() => ctx.close(), 700);
  } catch {
    // Audio not available — silent fail
  }
}

// ── Instant result overlay (shown on top of food image) ───────────────────────
function ResultOverlay({
  product,
  onViewFull,
  onDismiss,
  onAddToLog,
}: {
  product: FoodProduct;
  onViewFull: () => void;
  onDismiss: () => void;
  onAddToLog: () => void;
}) {
  const analysis = product.meatGrade
    ? analyzeMeatProduct(product.ingredients, product.meatGrade)
    : analyzeIngredients(product.ingredients);

  // Haptic + chime on mount
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate(60);
    playResultChime();
  }, []);

  // Swipe-down to dismiss
  const touchStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) setDragY(dy);
  };
  const handleTouchEnd = () => {
    if (dragY > 80) { onDismiss(); }
    setDragY(0);
    touchStartY.current = null;
  };

  const [logAdded, setLogAdded] = useState(false);

  const cal = product.nutriments?.["energy-kcal_100g"];
  const protein = product.nutriments?.["proteins_100g"];
  const carbs = product.nutriments?.["carbohydrates_100g"];
  const fat = product.nutriments?.["fat_100g"];

  // Build quality tags from analysis flags
  const tags: Array<{ label: string; type: "warn" | "good" | "bad" | "info" }> = [];
  const hasSeedOil = analysis.flags.some(f =>
    f.category === "seed_oil" || f.name.toLowerCase().includes("oil")
  );
  const hasUltraProcessed = analysis.flags.some(f =>
    f.category === "ultra_processed" || f.category === "processing"
  );
  const hasArtificialAdditives = analysis.flags.some(f =>
    f.category === "artificial" || f.category === "additive"
  );
  const hasGoodProtein = protein !== undefined && protein >= 15;
  const hasGoodFiber = (product.nutriments?.["fiber_100g"] ?? 0) >= 5;

  if (hasSeedOil) tags.push({ label: "⚠️ High in seed oils", type: "warn" });
  if (hasUltraProcessed) tags.push({ label: "❌ Highly processed", type: "bad" });
  if (hasArtificialAdditives) tags.push({ label: "⚠️ Artificial additives", type: "warn" });
  if (hasGoodProtein) tags.push({ label: "🔥 Good for muscle gain", type: "good" });
  if (hasGoodFiber) tags.push({ label: "✅ High fiber", type: "good" });
  if (analysis.score >= 80) tags.push({ label: "✅ Clean ingredients", type: "good" });
  if (analysis.score < 30) tags.push({ label: "❌ Poor quality", type: "bad" });

  const scoreColor = analysis.score >= 70 ? "#4ade80" : analysis.score >= 40 ? "#fbbf24" : "#f87171";
  const scoreLabel = analysis.score >= 80 ? "Excellent" : analysis.score >= 60 ? "Good" : analysis.score >= 40 ? "Fair" : "Poor";

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col"
      style={{
        background: "#050f09",
        animation: dragY > 0 ? "none" : "overlaySlideUp 0.38s cubic-bezier(0.32,0.72,0,1) both",
        transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
        opacity: dragY > 0 ? Math.max(0.4, 1 - dragY / 280) : undefined,
        transition: dragY > 0 ? "none" : "transform 0.3s ease, opacity 0.3s ease",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag handle pill */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full z-20" style={{ background: "rgba(255,255,255,0.22)" }} />
      {/* Food image (full bleed, faded at bottom) */}
      <div className="relative flex-1 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.85) saturate(1.1)" }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a1a10 0%, #0d2218 100%)" }}>
            <Package size={64} style={{ color: "rgba(255,255,255,0.08)" }} />
          </div>
        )}

        {/* Top gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(5,15,9,0.55) 0%, transparent 35%, transparent 45%, rgba(5,15,9,0.92) 75%, rgba(5,15,9,1) 100%)" }}
        />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-14 pb-4 z-10">
          <button
            onClick={onDismiss}
            className="w-10 h-10 rounded-[13px] flex items-center justify-center"
            style={{
              background: "rgba(5,15,9,0.65)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <X size={16} className="text-white" />
          </button>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: "rgba(5,15,9,0.65)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {product.dataSource ? SOURCE_LABELS[product.dataSource] ?? product.dataSource : "EatVera"}
          </div>
        </div>

        {/* Score + product name overlay at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 z-10">
          <div className="flex items-end gap-4 mb-4">
            <ScoreRingLarge score={analysis.score} size={88} />
            <div className="flex-1 min-w-0 pb-1">
              <p className="text-white font-bold text-xl leading-tight mb-0.5" style={{ letterSpacing: "-0.02em" }}>
                {product.name}
              </p>
              {product.brand && (
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{product.brand}</p>
              )}
              <span
                className="inline-block mt-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: `${scoreColor}20`, color: scoreColor, border: `1px solid ${scoreColor}40` }}
              >
                {scoreLabel}
              </span>
            </div>
          </div>

          {/* Quality tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tags.slice(0, 4).map((t, i) => (
                <QualityTag key={i} label={t.label} type={t.type} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom panel */}
      <div
        className="flex-shrink-0 px-5 pt-4 pb-10"
        style={{ background: "#050f09" }}
      >
        {/* Macros row */}
        {(cal !== undefined || protein !== undefined) && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Cal", value: cal !== undefined ? Math.round(cal) : null, unit: "kcal" },
              { label: "Protein", value: protein !== undefined ? Math.round(protein) : null, unit: "g" },
              { label: "Carbs", value: carbs !== undefined ? Math.round(carbs) : null, unit: "g" },
              { label: "Fat", value: fat !== undefined ? Math.round(fat) : null, unit: "g" },
            ].map(({ label, value, unit }) => (
              <div
                key={label}
                className="rounded-2xl p-3 text-center"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-[10px] font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
                {value !== null ? (
                  <p className="font-bold text-sm text-white" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}>
                    {value}<span className="text-[9px] font-normal ml-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{unit}</span>
                  </p>
                ) : (
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>—</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-2.5 mb-0">
          {/* Add to Calorie Log */}
          <button
            onClick={() => { if (!logAdded) { onAddToLog(); setLogAdded(true); } }}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
            style={{
              background: logAdded ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.08)",
              border: logAdded ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.1)",
              color: logAdded ? "#4ade80" : "rgba(255,255,255,0.75)",
              letterSpacing: "-0.01em",
            }}
          >
            {logAdded ? (
              <><ShieldCheck size={15} /> Added!</>
            ) : (
              <><Sparkles size={15} /> Add to Log</>
            )}
          </button>
          {/* View Full Analysis */}
          <button
            onClick={onViewFull}
            className="flex-[2] py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #0B3D2E 0%, #1a7048 100%)",
              boxShadow: "0 4px 24px rgba(11,61,46,0.4)",
              letterSpacing: "-0.01em",
            }}
          >
            View Full Analysis
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ScanPage() {
  // Deep link: /scan?barcode=xxx&score=NN auto-triggers lookup on mount
  const [deepLinkScore, setDeepLinkScore] = useState<number | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deepBarcode = params.get("barcode");
    const deepScore = params.get("score");
    if (deepBarcode) {
      setLastScannedBarcode(deepBarcode);
      setBarcodeToLookup(deepBarcode);
      if (deepScore) setDeepLinkScore(Number(deepScore));
      const url = new URL(window.location.href);
      url.searchParams.delete("barcode");
      url.searchParams.delete("score");
      window.history.replaceState({}, "", url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [scanning, setScanning] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("autoCamera") === "true";
  });

  // Clean up autoCamera param from URL after mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoCamera") === "true") {
      const url = new URL(window.location.href);
      url.searchParams.delete("autoCamera");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const [scanLabelMode, setScanLabelMode] = useState(false);
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [mode, setMode] = useState<"scan" | "search" | "barcode">("scan");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState("");
  const [barcodeToLookup, setBarcodeToLookup] = useState<string | null>(null);
  const [submitData, setSubmitData] = useState({
    productName: "", brand: "", category: "", imageUrl: "", ingredients: "",
  });
  const [isExtractingNutrition, setIsExtractingNutrition] = useState(false);
  const [extractedNutrition, setExtractedNutrition] = useState<{
    calories: number; protein: number; carbs: number; fat: number;
    fiber: number; sugar: number; sodium: number;
    confidence: "high" | "medium" | "low"; notes: string;
  } | null>(null);

  const { recentScans, addScan, removeScan, clearAll } = useRecentScans();
  const { theme, toggleTheme } = useTheme();

  const { data: barcodeResult, isLoading: isBarcodeLookupLoading } = trpc.barcode.lookupByBarcode.useQuery(
    { barcode: barcodeToLookup! },
    { enabled: !!barcodeToLookup }
  );

  const submitMutation = trpc.barcode.submitProductInfo.useMutation();
  const extractNutritionMutation = trpc.barcode.extractNutrition.useMutation();

  // Handle barcode lookup result → show overlay first
  useEffect(() => {
    if (barcodeResult && barcodeToLookup) {
      if (barcodeResult.found && barcodeResult.product) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = barcodeResult.product as any;
        const analysis = analyzeIngredients(
          Array.isArray(p.ingredients) ? p.ingredients.join(", ") : ""
        );
        const foodProduct: FoodProduct = {
          barcode: barcodeToLookup,
          name: p.productName || "Unknown Product",
          brand: p.brand || "",
          category: p.category || "",
          ingredients: Array.isArray(p.ingredients) ? p.ingredients.join(", ") : (p.ingredients || ""),
          imageUrl: p.imageUrl || "",
          nutriments: normalizeNutriments((p.nutritionFacts as Record<string, unknown>) || {}),
          dataSource: barcodeResult.source as any,
          additives: p.additives || p.harmfulIngredients || [],
          allergens: p.allergens || [],
          labels: p.labels || [],
          novaGroup: p.novaGroup ?? undefined,
          nutriScore: p.nutriScore ?? undefined,
          servingSize: p.servingSize ? String(p.servingSize) : undefined,
          servingUnit: p.servingUnit ?? undefined,
        };
        // Go directly to ProductResult — no intermediate overlay
        // If a score was passed via deep link (e.g. from homepage cards), use it
        const finalProduct: FoodProduct = deepLinkScore != null
          ? { ...foodProduct, precomputedScore: deepLinkScore }
          : foodProduct;
        setProduct(finalProduct);
        setDeepLinkScore(null); // consume it
        setBarcodeInput("");
        addScan({
          barcode: barcodeToLookup,
          productName: p.productName || null,
          brand: p.brand || null,
          healthScore: deepLinkScore ?? analysis.score,
          imageUrl: p.imageUrl || null,
        });
        setBarcodeToLookup(null);
      } else {
        setShowSubmitDialog(true);
        toast.info("Product not found. Please help us add it!");
        setBarcodeToLookup(null);
      }
    }
  }, [barcodeResult, barcodeToLookup, addScan]);

  const handleBarcodeDetected = (barcode: string) => {
    setScanning(false);
    setLastScannedBarcode(barcode);
    setBarcodeToLookup(barcode);
  };

  const handleBarcodeManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    setLastScannedBarcode(barcodeInput.trim());
    setBarcodeToLookup(barcodeInput.trim());
  };

  const handleReScan = (barcode: string) => {
    setLastScannedBarcode(barcode);
    setBarcodeToLookup(barcode);
  };

  const handleExtractNutrition = async () => {
    if (!submitData.ingredients.trim()) { toast.error("Please enter ingredients first"); return; }
    setIsExtractingNutrition(true);
    try {
      const result = await extractNutritionMutation.mutateAsync({
        ingredients: submitData.ingredients,
        productName: submitData.productName || undefined,
      });
      setExtractedNutrition(result.nutrition ? { ...result.nutrition, confidence: result.confidence, notes: result.notes } : null);
      toast.success(`Nutrition estimated (${result.confidence} confidence)`);
    } catch {
      toast.error("Could not extract nutrition. Please fill in manually.");
    } finally {
      setIsExtractingNutrition(false);
    }
  };

  const handleSubmitProduct = async () => {
    if (!submitData.productName.trim()) { toast.error("Product name is required"); return; }
    try {
      const nutritionFacts = extractedNutrition
        ? { calories: extractedNutrition.calories, protein: extractedNutrition.protein, carbs: extractedNutrition.carbs, fat: extractedNutrition.fat, fiber: extractedNutrition.fiber, sugar: extractedNutrition.sugar, sodium: extractedNutrition.sodium }
        : undefined;
      await submitMutation.mutateAsync({
        barcode: lastScannedBarcode,
        productName: submitData.productName || undefined,
        brand: submitData.brand || undefined,
        category: submitData.category || undefined,
        imageUrl: submitData.imageUrl || undefined,
        ingredients: submitData.ingredients ? submitData.ingredients.split(",").map(i => i.trim()) : undefined,
        nutritionFacts,
      });
      toast.success("Thank you! Your product info has been submitted for review.");
      setShowSubmitDialog(false);
      setSubmitData({ productName: "", brand: "", category: "", imageUrl: "", ingredients: "" });
      setExtractedNutrition(null);
    } catch {
      toast.error("Error submitting product info. Please try again.");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchProducts(searchQuery);
      if (results.length === 0) toast.info("No products found. Try a different search term.");
      setSearchResults(results);
    } catch {
      toast.error("Error searching products");
    } finally {
      setSearching(false);
    }
  };

  // ── Render: label scan mode ──────────────────────────────────────────────
  if (product && scanLabelMode) {
    return (
      <BarcodeScanner
        onDetected={() => setScanLabelMode(false)}
        onClose={() => setScanLabelMode(false)}
        initialMode="label"
      />
    );
  }

  // ── Render: full product result ──────────────────────────────────────────
  if (product) {
    return (
      <ProductResult
        product={product}
        onBack={() => setProduct(null)}
        onScanLabel={() => setScanLabelMode(true)}
        onScanAgain={() => { setProduct(null); setScanning(true); }}
      />
    );
  }

  // ── Render: analyzing overlay ────────────────────────────────────────────
  if (isBarcodeLookupLoading) {
    return <AnalyzingOverlay />;
  }

  // ── Render: full-screen scanner ──────────────────────────────────────────
  if (scanning) {
    return (
      <BarcodeScanner
        onDetected={handleBarcodeDetected}
        onClose={() => setScanning(false)}
      />
    );
  }

  // ── Render: main page ────────────────────────────────────────────────────
  const isDark = theme === "dark";

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: isDark ? "#0d1a14" : "#fafaf8" }}
    >
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden px-6 pt-14 pb-10"
        style={{
          background: isDark
            ? "linear-gradient(160deg, #061A12 0%, #0B3D2E 60%, #0d2218 100%)"
            : "linear-gradient(160deg, #0B3D2E 0%, #145A3A 60%, #1a7048 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(63,163,77,0.18) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(78,184,122,0.12) 0%, transparent 70%)" }} />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-14 right-5 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={15} className="text-white" /> : <Moon size={15} className="text-white" />}
        </button>

        {/* Headline */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Leaf size={14} className="text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>EatVera</span>
          </div>
          <h1
            className="text-white font-bold leading-tight mb-2"
            style={{ fontSize: "clamp(22px, 6vw, 28px)", letterSpacing: "-0.03em" }}
          >
            Know exactly what's<br />in your food in 2 seconds.
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            Scan any food to see calories, macros, and how clean it really is.
          </p>
        </div>

        {/* Big scan button */}
        <button
          onClick={() => setScanning(true)}
          className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-bold text-base transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1.5px solid rgba(255,255,255,0.28)",
            color: "white",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18)",
            letterSpacing: "-0.01em",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #3FA34D 0%, #2e9e5e 100%)",
              boxShadow: "0 4px 14px rgba(63,163,77,0.5)",
              animation: "scanBtnPulse 2.5s ease-in-out infinite",
            }}
          >
            <Camera size={20} className="text-white" />
          </div>
          <span>Scan a Product</span>
          <ChevronRight size={18} style={{ color: "rgba(255,255,255,0.6)" }} />
        </button>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { value: "3M+", label: "Products" },
            { value: "1–100", label: "Quality Score" },
            { value: "200+", label: "Harmful Flags" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="font-bold text-white text-base" style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em" }}>{value}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mode tabs ── */}
      <div className="flex gap-2 px-4 mb-5 mt-5 overflow-x-auto">
        {[
          { id: "scan", label: "Camera", icon: Camera },
          { id: "barcode", label: "Barcode", icon: Hash },
          { id: "search", label: "Search", icon: Search },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id as "scan" | "search" | "barcode")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all"
            style={
              mode === id
                ? { background: "#0B3D2E", color: "white", boxShadow: "0 2px 8px rgba(11,61,46,0.3)" }
                : isDark
                  ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }
                  : { background: "white", color: "#57534e", border: "1px solid #e7e5e4" }
            }
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Camera mode — tap-to-open card ── */}
      {mode === "scan" && (
        <div className="px-4 mb-5">
          <button
            onClick={() => setScanning(true)}
            className="w-full py-10 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98]"
            style={
              isDark
                ? { background: "rgba(255,255,255,0.04)", border: "2px dashed rgba(255,255,255,0.12)" }
                : { background: "#f0faf2", border: "2px dashed #b8e8be" }
            }
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: isDark ? "rgba(63,163,77,0.15)" : "#DCF4DF",
                boxShadow: isDark ? "0 0 20px rgba(63,163,77,0.2)" : "none",
              }}
            >
              <ScanLine size={26} style={{ color: isDark ? "#4db87a" : "#0B3D2E" }} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm" style={{ color: isDark ? "rgba(255,255,255,0.85)" : "#1a2e22" }}>
                Tap to open scanner
              </p>
              <p className="text-xs mt-0.5" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#78716c" }}>
                Point camera at any product barcode
              </p>
            </div>
          </button>
        </div>
      )}

      {/* ── Barcode input mode ── */}
      {mode === "barcode" && (
        <div className="px-4 mb-5">
          <form onSubmit={handleBarcodeManual} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter barcode number…"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isBarcodeLookupLoading} className="bg-[#0B3D2E] hover:bg-[#145A3A]">
              {isBarcodeLookupLoading ? <Loader2 className="animate-spin" size={16} /> : <Hash size={16} />}
            </Button>
          </form>
        </div>
      )}

      {/* ── Search mode ── */}
      {mode === "search" && (
        <div className="px-4 mb-5">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={searching} className="bg-[#0B3D2E] hover:bg-[#145A3A]">
              {searching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setProduct(p); }}
                  className="w-full ec-card p-3 flex items-center gap-3 text-left hover:shadow-md transition-shadow"
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "#f5f5f4" }}>
                      <Package size={20} className="text-stone-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 text-sm truncate">{p.name}</p>
                    <p className="text-stone-400 text-xs truncate">{p.brand}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Recent scans ── */}
      {recentScans.length > 0 && (
        <div className="px-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History size={14} style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#a8a29e" }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#a8a29e" }}>
                Recent Scans
              </span>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Clear scan history? This cannot be undone.")) clearAll();
              }}
              className="text-[11px] text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <Trash2 size={11} />
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {recentScans.map((scan) => {
              const scoreColor = scan.healthScore !== null
                ? scan.healthScore >= 80 ? "#145A3A"
                  : scan.healthScore >= 60 ? "#0B3D2E"
                  : scan.healthScore >= 40 ? "#d97706"
                  : scan.healthScore >= 20 ? "#ea580c"
                  : "#dc2626"
                : "#a8a29e";
              return (
                <div key={scan.barcode} className="relative">
                  <OasisProductCard
                    name={scan.productName || "Unknown Product"}
                    brand={scan.brand || scan.barcode}
                    imageUrl={scan.imageUrl ?? undefined}
                    score={scan.healthScore ?? 0}
                    scoreColor={scoreColor}
                    onClick={() => handleReScan(scan.barcode)}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeScan(scan.barcode); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 dark:bg-stone-700/80 text-stone-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm"
                  >
                    <X size={11} />
                  </button>
                  {isBarcodeLookupLoading && barcodeToLookup === scan.barcode && (
                    <div className="absolute inset-0 rounded-2xl bg-white/70 dark:bg-stone-800/70 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-[#0B3D2E]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Submit product dialog ── */}
      <Dialog open={showSubmitDialog} onOpenChange={(open) => {
        setShowSubmitDialog(open);
        if (!open) setExtractedNutrition(null);
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-600" />
              Help Us Add This Product
            </DialogTitle>
            <DialogDescription>
              Barcode {lastScannedBarcode} not found. Please provide product details so we can add it to our database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Product Name *</label>
              <Input placeholder="e.g., Organic Almond Milk" value={submitData.productName}
                onChange={(e) => setSubmitData({ ...submitData, productName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Brand</label>
              <Input placeholder="e.g., Blue Diamond" value={submitData.brand}
                onChange={(e) => setSubmitData({ ...submitData, brand: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
              <Input placeholder="e.g., Beverages, Dairy, Snacks" value={submitData.category}
                onChange={(e) => setSubmitData({ ...submitData, category: e.target.value })} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-stone-700">Ingredients (comma-separated)</label>
                <button
                  type="button"
                  onClick={handleExtractNutrition}
                  disabled={isExtractingNutrition || !submitData.ingredients.trim()}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                    submitData.ingredients.trim() ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : "bg-stone-100 text-stone-400 cursor-not-allowed"
                  }`}
                >
                  {isExtractingNutrition ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                  AI Extract Nutrition
                </button>
              </div>
              <Textarea placeholder="e.g., Water, Almonds, Sea Salt" value={submitData.ingredients}
                onChange={(e) => setSubmitData({ ...submitData, ingredients: e.target.value })} rows={3} />
            </div>

            {extractedNutrition && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={13} className="text-purple-600" />
                  <p className="text-xs font-semibold text-purple-700">
                    AI Nutrition Estimate
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                      extractedNutrition.confidence === "high" ? "bg-[#DCF4DF] text-[#145A3A]"
                        : extractedNutrition.confidence === "medium" ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {extractedNutrition.confidence} confidence
                    </span>
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "Cal", value: extractedNutrition.calories, unit: "kcal" },
                    { label: "Protein", value: extractedNutrition.protein, unit: "g" },
                    { label: "Carbs", value: extractedNutrition.carbs, unit: "g" },
                    { label: "Fat", value: extractedNutrition.fat, unit: "g" },
                  ].map(({ label, value, unit }) => (
                    <div key={label} className="bg-card rounded-lg p-1.5 text-center border border-purple-100">
                      <p className="text-[9px] text-stone-400">{label}</p>
                      <p className="text-xs font-bold text-stone-800">{value.toFixed(0)}{unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowSubmitDialog(false); setExtractedNutrition(null); }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmitProduct} disabled={submitMutation.isPending} className="flex-1 bg-[#0B3D2E] hover:bg-[#145A3A]">
                {submitMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Animations */}
      <style>{`
        @keyframes overlaySlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scanBtnPulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(63,163,77,0.5); }
          50% { box-shadow: 0 4px 24px rgba(63,163,77,0.75), 0 0 0 6px rgba(63,163,77,0.12); }
        }
      `}</style>
    </div>
  );
}
