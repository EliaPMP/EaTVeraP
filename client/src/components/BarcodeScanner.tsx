/**
 * EatVera BarcodeScanner — v7
 *
 * New in v7:
 *  - Haptic feedback: navigator.vibrate(40) on barcode detection
 *  - Pinch-to-zoom (CSS scale 1×–5×) with iOS-style zoom pill toast (1.5s)
 *  - Food Label full result page: score ring, ingredient breakdown, share card
 *  - "View Full Analysis" button in flags panel opens full result page
 *
 * Retained from v6:
 *  - Real Leaf logo mark, Playfair Display wordmark, NO "Pro" badge
 *  - Deep forest gradient header, glassmorphic close/torch buttons
 *  - Shimmer accent line, tap-to-focus ring, 4K camera constraints
 *  - Barcode / Food Label toggle pill
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { Zap, ZapOff, ScanLine, FlaskConical, Camera, Leaf, ChevronLeft, Share2, Download, Volume2, VolumeX } from "lucide-react";
import { useScannerMute } from "@/hooks/useScannerMute";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
  /** Pre-set the scanner mode (default: "barcode") */
  initialMode?: ScanMode;
}

type ScanState = "initializing" | "scanning" | "detected" | "error";
type ScanMode = "barcode" | "label";
type LabelView = "camera" | "result";

interface FocusPoint { x: number; y: number; id: number }

interface LabelResult {
  flags: Array<{ name: string; severity: string; reason: string; category: string }>;
  ingredientQuality: string;
  rawIngredientText: string;
  ingredientsDetected: boolean;
  score?: number;
}

const GREEN_GLOW = "#4db87a";
const GREEN_BRIGHT = "#2e9e5e";

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, color, size = 96 }: { score: number; color: string; size?: number }) {
  const sw = 7;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute font-bold"
        style={{ color, fontSize: size * 0.22, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em" }}
      >
        {score}
      </span>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function qualityStyle(q: string) {
  if (q === "good")     return { color: "#4ade80", bg: "rgba(74,222,128,0.12)", label: "Clean Ingredients", score: 82 };
  if (q === "moderate") return { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", label: "Some Concerns",     score: 55 };
  if (q === "poor")     return { color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "Poor Quality",      score: 28 };
  return { color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.06)", label: "Label Not Found", score: 0 };
}
function severityColor(s: string) {
  if (s === "high")     return "#f87171";
  if (s === "moderate") return "#fbbf24";
  return "rgba(255,255,255,0.45)";
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BarcodeScanner({ onDetected, onClose, initialMode = "barcode" }: BarcodeScannerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const torchTrackRef = useRef<MediaStreamTrack | null>(null);

  // Pinch-to-zoom
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const zoomPillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showZoomPill, setShowZoomPill] = useState(false);

  const [scanState, setScanState] = useState<ScanState>("initializing");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>(initialMode);
  const [torchOn, setTorchOn] = useState(false);
  const { muted, toggleMute } = useScannerMute();
  const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null);
  const [labelCapturing, setLabelCapturing] = useState(false);
  const [labelResult, setLabelResult] = useState<LabelResult | null>(null);
  const [labelView, setLabelView] = useState<LabelView>("camera");

  const analyzePhotoMutation = trpc.calorie.analyzePhoto.useMutation();

  // ── Stop ZXing reader ─────────────────────────────────────────────────────
  const stopReader = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (readerRef.current) {
      try { BrowserMultiFormatReader.releaseAllStreams(); } catch { /* ignore */ }
      readerRef.current = null;
    }
  }, []);

  const stopAll = useCallback(() => {
    stopReader();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, [stopReader]);

  // ── Barcode mode ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (scanMode !== "barcode") return;
    if (!videoRef.current) return;
    const videoEl = videoRef.current;
    firedRef.current = false;
    setScanState("initializing");
    setZoomLevel(1);

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    let active = true;

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment", width: { ideal: 3840 }, height: { ideal: 2160 } } },
        videoEl,
        (result, err) => {
          if (!active) return;
          if (result) {
            const text = result.getText();
            if (!text || firedRef.current) return;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              if (!active || firedRef.current) return;
              firedRef.current = true;
              setScanState("detected");
              // Haptic feedback
              try { navigator.vibrate?.(40); } catch { /* ignore */ }
              stopReader(); onDetected(text);
            }, 80);
          } else if (err && !(err instanceof NotFoundException)) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("notallowed")) {
              active = false; setScanState("error");
              setErrorMsg("Camera permission denied. Please allow camera access and try again.");
            } else if (msg.toLowerCase().includes("notfound") || msg.toLowerCase().includes("no camera")) {
              active = false; setScanState("error");
              setErrorMsg("No camera found. Please use a device with a camera.");
            }
          }
        }
      )
      .then(() => {
        if (active) {
          setScanState("scanning");
          if (videoEl.srcObject instanceof MediaStream) {
            streamRef.current = videoEl.srcObject;
            const track = videoEl.srcObject.getVideoTracks()[0];
            if (track) torchTrackRef.current = track;
          }
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : String(err);
        setScanState("error");
        if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("notallowed")) {
          setErrorMsg("Camera permission denied. Please allow camera access and try again.");
        } else if (msg.toLowerCase().includes("notfound") || msg.toLowerCase().includes("no camera")) {
          setErrorMsg("No camera found on this device.");
        } else {
          setErrorMsg("Could not start camera. Please try again.");
        }
      });

    return () => { active = false; stopReader(); };
  }, [scanMode, onDetected, stopReader]);

  // ── Label mode ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (scanMode !== "label") return;
    if (!videoRef.current) return;
    const videoEl = videoRef.current;
    let active = true;
    setScanState("initializing");
    setLabelResult(null);
    setLabelView("camera");
    setZoomLevel(1);

    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 3840 },
        height: { ideal: 2160 },
        // @ts-ignore
        advanced: [{ focusMode: "continuous", exposureMode: "continuous", whiteBalanceMode: "continuous" }],
      },
    }).then(stream => {
      if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      if (track) torchTrackRef.current = track;
      videoEl.srcObject = stream;
      videoEl.play().catch(() => {});
      setScanState("scanning");
    }).catch(err => {
      if (!active) return;
      const msg = err instanceof Error ? err.message : String(err);
      setScanState("error");
      setErrorMsg(msg.toLowerCase().includes("permission") ? "Camera permission denied." : "Could not start camera. Please try again.");
    });

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [scanMode]);

  // ── Torch ─────────────────────────────────────────────────────────────────
  const toggleTorch = useCallback(async () => {
    const track = torchTrackRef.current;
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch { /* not supported */ }
  }, [torchOn]);

  // ── Pinch-to-zoom ─────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartZoomRef.current = zoomLevel;
    }
  }, [zoomLevel]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / pinchStartDistRef.current;
      const newZoom = Math.min(5, Math.max(1, pinchStartZoomRef.current * scale));
      setZoomLevel(newZoom);
      setShowZoomPill(true);
      if (zoomPillTimerRef.current) clearTimeout(zoomPillTimerRef.current);
      zoomPillTimerRef.current = setTimeout(() => setShowZoomPill(false), 1500);
      if (videoRef.current) {
        videoRef.current.style.transform = `scale(${newZoom})`;
        videoRef.current.style.transformOrigin = "center center";
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    pinchStartDistRef.current = null;
  }, []);

  // ── Tap-to-focus ──────────────────────────────────────────────────────────
  const handleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // Skip if multi-touch (pinch)
    if ("touches" in e && (e as React.TouchEvent).touches.length > 1) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let clientX: number, clientY: number;
    if ("changedTouches" in e) {
      const t = (e as React.TouchEvent).changedTouches[0];
      if (!t) return;
      clientX = t.clientX; clientY = t.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setFocusPoint({ x, y, id: Date.now() });
    setTimeout(() => setFocusPoint(null), 1200);
    const track = torchTrackRef.current;
    if (track) {
      try {
        track.applyConstraints({
          advanced: [{ pointsOfInterest: [{ x: x / rect.width, y: y / rect.height }] } as MediaTrackConstraintSet],
        });
      } catch { /* not supported */ }
    }
  }, []);

  // ── Capture label photo ───────────────────────────────────────────────────
  const captureLabel = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setLabelCapturing(true);
    setLabelResult(null);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setLabelCapturing(false); return; }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    try {
      const result = await analyzePhotoMutation.mutateAsync({
        imageDataUrl: dataUrl,
        mealContext: "ingredient label scan",
      });
      const ia = result.ingredientAnalysis as LabelResult | undefined;
      const qs = qualityStyle(ia?.ingredientQuality ?? "unknown");
      setLabelResult({
        flags: ia?.flags ?? [],
        ingredientQuality: ia?.ingredientQuality ?? "unknown",
        rawIngredientText: ia?.rawIngredientText ?? "",
        ingredientsDetected: ia?.ingredientsDetected ?? false,
        score: qs.score,
      });
    } catch {
      setLabelResult({ flags: [], ingredientQuality: "unknown", rawIngredientText: "", ingredientsDetected: false, score: 0 });
    } finally {
      setLabelCapturing(false);
    }
  }, [analyzePhotoMutation]);

  // ── Share / download label result ─────────────────────────────────────────
  const handleShareResult = useCallback(async () => {
    if (!labelResult) return;
    const qs = qualityStyle(labelResult.ingredientQuality);
    const text = `EatVera Label Scan\nIngredient Quality: ${qs.label}\nScore: ${qs.score}/100\n\nFlags:\n${
      labelResult.flags.map(f => `• ${f.name} (${f.severity}): ${f.reason}`).join("\n")
    }`;
    if (navigator.share) {
      try { await navigator.share({ title: "EatVera Label Analysis", text }); } catch { /* cancelled */ }
    } else {
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "eatvera-label-analysis.txt"; a.click();
      URL.revokeObjectURL(url);
    }
  }, [labelResult]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const isDetected = scanState === "detected";
  const isError = scanState === "error";
  const isInit = scanState === "initializing";
  const isScanning = scanState === "scanning";

  // ── Full result page ──────────────────────────────────────────────────────
  if (labelView === "result" && labelResult) {
    const qs = qualityStyle(labelResult.ingredientQuality);
    const score = labelResult.score ?? qs.score;
    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={{ background: "#0a1a0f" }}>
        {/* Shimmer accent */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 1, zIndex: 20,
          background: "linear-gradient(90deg, transparent 0%, rgba(78,184,122,0.45) 25%, rgba(167,243,208,0.75) 50%, rgba(78,184,122,0.45) 75%, transparent 100%)",
          pointerEvents: "none",
        }} />

        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 pt-14 pb-4"
          style={{ background: "linear-gradient(180deg, rgba(5,18,10,0.97) 0%, rgba(5,18,10,0.85) 80%, transparent 100%)" }}
        >
          <button
            onClick={() => setLabelView("camera")}
            className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all active:scale-90"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 100%)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14)",
            }}
          >
            <ChevronLeft size={18} className="text-white" />
          </button>

          <div className="flex items-center gap-2.5">
            <div
              className="relative flex items-center justify-center flex-shrink-0"
              style={{
                width: 40, height: 40, borderRadius: 13,
                background: "linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)",
                border: "1px solid rgba(255,255,255,0.22)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.16)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <Leaf size={18} className="text-white" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: 13, background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.14) 0%, transparent 65%)" }} />
            </div>
            <div>
              <span className="block font-bold text-white leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, letterSpacing: "-0.01em", textShadow: "0 1px 6px rgba(0,0,0,0.45)" }}>
                EatVera
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <FlaskConical size={8} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                <span className="text-[9px] font-semibold uppercase" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Label Analysis
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleShareResult}
            className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all active:scale-90"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 100%)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14)",
            }}
          >
            <Share2 size={15} className="text-white" />
          </button>
        </div>

        {/* Score ring hero */}
        <div className="flex flex-col items-center pt-4 pb-8 px-6">
          <ScoreRing score={score} color={qs.color} size={120} />
          <div className="mt-4 text-center">
            <span
              className="inline-block text-sm font-bold px-4 py-1.5 rounded-full"
              style={{ background: qs.bg, color: qs.color, border: `1px solid ${qs.color}30` }}
            >
              {qs.label}
            </span>
          </div>
          {labelResult.ingredientsDetected && labelResult.rawIngredientText && (
            <p className="mt-3 text-xs text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.3)", maxWidth: 300 }}>
              {labelResult.rawIngredientText.slice(0, 120)}{labelResult.rawIngredientText.length > 120 ? "…" : ""}
            </p>
          )}
        </div>

        {/* Ingredient flags */}
        <div className="px-5 pb-16">
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            Ingredient Flags
          </p>

          {!labelResult.ingredientsDetected ? (
            <div
              className="rounded-2xl p-5 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                No ingredient label was detected. Try pointing the camera directly at the ingredients list.
              </p>
            </div>
          ) : labelResult.flags.length === 0 ? (
            <div
              className="rounded-2xl p-5 flex items-center gap-3"
              style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(74,222,128,0.15)" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3.5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: "#4ade80" }}>No concerning ingredients detected</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {labelResult.flags.map((flag, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-2xl"
                  style={{
                    background: `${severityColor(flag.severity)}08`,
                    border: `1px solid ${severityColor(flag.severity)}20`,
                  }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: severityColor(flag.severity) }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-white truncate">{flag.name}</p>
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 uppercase"
                        style={{
                          background: `${severityColor(flag.severity)}18`,
                          color: severityColor(flag.severity),
                          letterSpacing: "0.06em",
                        }}
                      >
                        {flag.severity}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{flag.reason}</p>
                    {flag.category && (
                      <p className="text-[10px] mt-1 font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>{flag.category}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => { setLabelResult(null); setLabelView("camera"); }}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #1a5c38 0%, #2e9e5e 100%)",
                color: "white",
                boxShadow: "0 4px 16px rgba(46,158,94,0.35)",
              }}
            >
              <Camera size={14} />
              Scan Again
            </button>
            <button
              onClick={handleShareResult}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Camera view ───────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#000" }}
      onTouchStart={(e) => { handleTouchStart(e); if (e.touches.length === 1) handleTap(e); }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
    >
      {/* Live camera feed — full bleed behind everything */}
      {!isError && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay playsInline muted
          style={{ filter: "brightness(1.2) contrast(1.04) saturate(1.06)" }}
        />
      )}
      <canvas ref={canvasRef} className="hidden" />

      {/* Layered vignette — very light so camera is clearly visible */}
      {!isError && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 72% 68% at 50% 50%, transparent 0%, rgba(0,0,0,0.08) 58%, rgba(0,0,0,0.42) 100%)"
        }} />
      )}

      {/* Top gradient — deep forest matching calorie scanner */}
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
        height: 140, zIndex: 5,
        background: "linear-gradient(180deg, rgba(7,31,23,0.88) 0%, rgba(11,61,46,0.55) 60%, transparent 100%)"
      }} />

      {/* Subtle top shimmer accent line — matching calorie scanner */}
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
        height: 1, zIndex: 20,
        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 70%, transparent 100%)"
      }} />

      {/* ── Header — overlaid on camera ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-14 pb-2">
        {/* Close */}
        <button
          onClick={() => { stopAll(); onClose(); }}
          className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all active:scale-90"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 100%)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        {/* EatVera wordmark — matches homepage logo color */}
        <div className="flex items-center gap-2.5">
          <div
            className="relative flex items-center justify-center flex-shrink-0"
            style={{
              width: 40, height: 40, borderRadius: 13,
              background: "linear-gradient(135deg, #0B3D2E, #145A3A)",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <Leaf size={18} className="text-white" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))" }} />
          </div>
          <div>
            <span
              className="block font-bold leading-none"
              style={{ fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif", fontSize: 18, letterSpacing: "-0.01em", color: "white", textShadow: "0 1px 6px rgba(0,0,0,0.45)" }}
            >
              EatVera
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {scanMode === "barcode"
                ? <ScanLine size={8} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                : <FlaskConical size={8} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
              }
              <span className="text-[9px] font-semibold uppercase" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                {scanMode === "barcode" ? "Barcode Scanner" : "Label Scanner"}
              </span>
            </div>
          </div>
        </div>

        {/* Right controls: mute + torch */}
        <div className="flex items-center gap-2">
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            title={muted ? "Sound off — tap to unmute" : "Sound on — tap to mute"}
            className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all active:scale-90"
            style={{
              background: muted
                ? "linear-gradient(145deg, rgba(255,80,80,0.22) 0%, rgba(255,60,60,0.12) 100%)"
                : "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 100%)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: muted
                ? "1px solid rgba(255,80,80,0.35)"
                : "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14)",
            }}
          >
            {muted
              ? <VolumeX size={16} style={{ color: "rgba(255,120,120,0.9)" }} />
              : <Volume2 size={16} style={{ color: "rgba(255,255,255,0.75)" }} />
            }
          </button>

          {/* Torch */}
          <button
            onClick={toggleTorch}
            className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all active:scale-90"
            style={{
              background: torchOn
                ? "linear-gradient(145deg, rgba(255,220,0,0.28) 0%, rgba(255,180,0,0.18) 100%)"
                : "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 100%)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: torchOn ? "1px solid rgba(255,220,0,0.45)" : "1px solid rgba(255,255,255,0.18)",
              boxShadow: torchOn
                ? "0 0 20px rgba(255,210,0,0.35), inset 0 1px 0 rgba(255,255,255,0.14)"
                : "0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14)",
            }}
          >
            <Zap size={16} fill={torchOn ? "#fbbf24" : "none"} style={{ color: torchOn ? "#fbbf24" : "rgba(255,255,255,0.75)" }} />
          </button>
        </div>
      </div>

      {/* Mode toggle pill */}
      <div className="relative z-10 flex justify-center pb-4">
        <div
          className="flex items-center p-1 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            border: "1px solid rgba(255,255,255,0.11)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          }}
        >
          {(["barcode", "label"] as ScanMode[]).map(m => (
            <button
              key={m}
              onClick={() => {
                if (m === scanMode) return;
                stopAll();
                setLabelResult(null);
                setLabelView("camera");
                setScanMode(m);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-semibold transition-all"
              style={
                scanMode === m
                  ? { background: "linear-gradient(135deg, #1a5c38 0%, #2e9e5e 100%)", color: "white", boxShadow: "0 2px 10px rgba(46,158,94,0.4)", letterSpacing: "0.01em" }
                  : { color: "rgba(255,255,255,0.45)", letterSpacing: "0.01em" }
              }
            >
              {m === "barcode" ? <ScanLine size={11} /> : <FlaskConical size={11} />}
              {m === "barcode" ? "Barcode" : "Food Label"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Viewfinder area ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        {isError ? (
          <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "rgba(220,38,38,0.10)", border: "1px solid rgba(220,38,38,0.18)" }}>
              <ZapOff size={30} className="text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-base mb-2" style={{ color: "white" }}>Camera Access Required</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{errorMsg}</p>
            </div>
            <button onClick={onClose} className="px-8 py-3.5 rounded-2xl font-semibold text-sm text-white" style={{ background: "linear-gradient(135deg, #1a5c38, #2e9e5e)", boxShadow: "0 4px 16px rgba(46,158,94,0.35)" }}>
              Go Back
            </button>
          </div>
        ) : (
          <>

            {/* Barcode viewfinder */}
            {scanMode === "barcode" && (
              <div className="relative">
                <div
                  className="relative"
                  style={{
                    width: "74vw", maxWidth: 320, aspectRatio: "3/2",
                  }}
                >
                  {[
                    { pos: "top-0 left-0", borders: "border-t-2 border-l-2 rounded-tl-2xl" },
                    { pos: "top-0 right-0", borders: "border-t-2 border-r-2 rounded-tr-2xl" },
                    { pos: "bottom-0 left-0", borders: "border-b-2 border-l-2 rounded-bl-2xl" },
                    { pos: "bottom-0 right-0", borders: "border-b-2 border-r-2 rounded-br-2xl" },
                  ].map(({ pos, borders }, i) => (
                    <div key={i} className={`absolute w-10 h-10 ${pos} ${borders} transition-all duration-200`} style={{ borderColor: isDetected ? GREEN_GLOW : "rgba(255,255,255,0.88)", boxShadow: isDetected ? `0 0 14px ${GREEN_GLOW}90` : "none" }} />
                  ))}

                  {/* Subtle inner glow border */}
                  <div className="absolute inset-0" style={{ borderRadius: 4, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }} />

                  {isInit && (
                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.15)" }}>
                      <div className="flex gap-1.5">
                        {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: GREEN_BRIGHT, animationDelay: `${i*0.15}s`, animationDuration: "0.8s" }} />)}
                      </div>
                    </div>
                  )}
                  {isDetected && (
                    <div className="absolute inset-0 rounded-2xl" style={{ background: "rgba(78,184,122,0.16)", border: `2px solid ${GREEN_GLOW}`, animation: "pulse 0.2s ease-out" }} />
                  )}
                </div>
              </div>
            )}

            {/* Label viewfinder */}
            {scanMode === "label" && (
              <div className="relative">
                <div className="relative" style={{ width: "82vw", maxWidth: 360, aspectRatio: "3/4" }}>
                  {[
                    { pos: "top-0 left-0", borders: "border-t-2 border-l-2 rounded-tl-2xl" },
                    { pos: "top-0 right-0", borders: "border-t-2 border-r-2 rounded-tr-2xl" },
                    { pos: "bottom-0 left-0", borders: "border-b-2 border-l-2 rounded-bl-2xl" },
                    { pos: "bottom-0 right-0", borders: "border-b-2 border-r-2 rounded-br-2xl" },
                  ].map(({ pos, borders }, i) => (
                    <div key={i} className={`absolute w-10 h-10 ${pos} ${borders}`} style={{ borderColor: "rgba(255,255,255,0.72)" }} />
                  ))}
                </div>
              </div>
            )}

          </>
        )}
      </div>

      {/* Tap-to-focus ring */}
      {focusPoint && (
        <div
          key={focusPoint.id}
          className="pointer-events-none absolute focus-ring-animate z-20"
          style={{ left: focusPoint.x - 36, top: focusPoint.y - 36, width: 72, height: 72, borderRadius: 10, border: "2px solid #fbbf24", boxShadow: "0 0 10px rgba(251,191,36,0.55)" }}
        />
      )}

      {/* Zoom pill */}
      {showZoomPill && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20" style={{ animation: "zoomPillFade 1.5s ease-out forwards", marginTop: -60 }}>
          <div
            className="flex items-center gap-2 rounded-[14px]"
            style={{
              padding: "8px 16px",
              background: "linear-gradient(145deg, rgba(7,31,23,0.82) 0%, rgba(11,61,46,0.72) 100%)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.22)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="5.5" cy="5.5" r="4" stroke="rgba(255,255,255,0.75)" strokeWidth="1.3"/>
              <line x1="8.8" y1="8.8" x2="12" y2="12" stroke="rgba(255,255,255,0.75)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span className="text-white font-bold text-sm leading-none" style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}>
              {zoomLevel.toFixed(1)}×
            </span>
          </div>
        </div>
      )}

      {/* ── Bottom area ── */}
      <div
        className="relative z-10 px-6 pb-12 pt-6 flex flex-col items-center gap-4"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)" }}
      >
        {scanMode === "barcode" ? (
          isInit ? (
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Starting camera…</p>
          ) : isDetected ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: GREEN_BRIGHT, boxShadow: `0 0 16px ${GREEN_BRIGHT}80` }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="font-semibold text-sm text-white">Barcode detected!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <p className="font-medium text-sm" style={{ color: "rgba(255,255,255,0.78)" }}>Point camera at barcode</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Hold steady · Pinch to zoom · Scans instantly</p>
            </div>
          )
        ) : (
          <>
            {!labelResult ? (
              <>
                <p className="text-sm font-medium text-center" style={{ color: "rgba(255,255,255,0.62)" }}>
                  {isInit ? "Starting camera…" : "Frame the ingredient list, then tap Analyze"}
                </p>
                <button
                  onClick={e => { e.stopPropagation(); captureLabel(); }}
                  disabled={labelCapturing || isInit}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    background: labelCapturing ? "rgba(46,158,94,0.35)" : "linear-gradient(135deg, #1a5c38 0%, #2e9e5e 100%)",
                    boxShadow: "0 4px 20px rgba(46,158,94,0.38)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {labelCapturing ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Analyzing…</>
                  ) : (
                    <><Camera size={15} />Analyze Label</>
                  )}
                </button>
              </>
            ) : (
              <div
                className="w-full rounded-2xl p-4 max-h-56 overflow-y-auto"
                style={{
                  background: "rgba(5,18,10,0.92)",
                  border: "1px solid rgba(78,184,122,0.18)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
                onClick={e => e.stopPropagation()}
              >
                {(() => {
                  const qs = qualityStyle(labelResult.ingredientQuality);
                  return (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: qs.bg, color: qs.color, border: `1px solid ${qs.color}30` }}>
                        {qs.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLabelView("result")}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                          style={{ background: "rgba(78,184,122,0.12)", color: "#4ade80", border: "1px solid rgba(78,184,122,0.2)" }}
                        >
                          View Full Analysis
                        </button>
                        <button onClick={() => setLabelResult(null)} className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                          Rescan
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {!labelResult.ingredientsDetected ? (
                  <p className="text-xs text-center py-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                    No ingredient label detected. Try pointing the camera directly at the ingredients list.
                  </p>
                ) : labelResult.flags.length === 0 ? (
                  <p className="text-xs font-semibold" style={{ color: "#4db87a" }}>✓ No concerning ingredients detected</p>
                ) : (
                  <div className="space-y-2">
                    {labelResult.flags.slice(0, 4).map((flag, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl" style={{ background: `${severityColor(flag.severity)}0d`, border: `1px solid ${severityColor(flag.severity)}22` }}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: severityColor(flag.severity) }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{flag.name}</p>
                          <p className="text-[10px] leading-relaxed mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{flag.reason}</p>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 uppercase" style={{ background: `${severityColor(flag.severity)}18`, color: severityColor(flag.severity), letterSpacing: "0.05em" }}>
                          {flag.severity}
                        </span>
                      </div>
                    ))}
                    {labelResult.flags.length > 4 && (
                      <button onClick={() => setLabelView("result")} className="w-full text-center text-xs font-semibold py-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        +{labelResult.flags.length - 4} more — View Full Analysis
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Animations */}
      <style>{`

        @keyframes focusRingIn {
          0%   { transform: scale(1.4); opacity: 0; }
          20%  { transform: scale(1.0); opacity: 1; }
          80%  { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0; }
        }
        .focus-ring-animate {
          animation: focusRingIn 1.2s ease forwards;
        }
        @keyframes zoomPillFade {
          0%   { opacity: 0; transform: translateX(-50%) scale(0.9); }
          10%  { opacity: 1; transform: translateX(-50%) scale(1.0); }
          70%  { opacity: 1; transform: translateX(-50%) scale(1.0); }
          100% { opacity: 0; transform: translateX(-50%) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
