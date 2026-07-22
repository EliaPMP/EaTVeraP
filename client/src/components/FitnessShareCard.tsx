/**
 * FitnessShareCard — branded weekly fitness summary share card
 *
 * Format: 9:16 Story (1080×1920) — EatVera deep-forest premium style
 * Shows: step ring, calories burned, top exercise, weight change
 * Export: PNG download + Web Share API
 */
import { useState, useCallback } from "react";
import { X, Share2, Download, Loader2 } from "lucide-react";

export interface FitnessWeekData {
  weekLabel: string;          // e.g. "Apr 28 – May 4"
  totalSteps: number;
  stepGoal: number;           // daily goal × 7
  totalCaloriesBurned: number;
  topExercise: string | null; // most-logged exercise name
  topExerciseCount: number;
  weightChange: number | null; // kg, negative = loss
  weightUnit: "kg" | "lbs";
  currentWeight: number | null; // kg
  avgDailyCups?: number;       // average cups/day this week
  waterGoalCups?: number;      // daily cup goal
}

interface FitnessShareCardProps {
  data: FitnessWeekData;
  onClose: () => void;
}

// ─── Canvas helpers ────────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawEatVeraLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const x = cx - size / 2, y = cy - size / 2;
  const r = size * 0.22;
  ctx.save();
  roundRect(ctx, x, y, size, size, r);
  const bg = ctx.createRadialGradient(cx, cy - size * 0.1, 0, cx, cy, size * 0.7);
  bg.addColorStop(0, "#1a7048");
  bg.addColorStop(1, "#0B3D2E");
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = "rgba(74,222,128,0.35)";
  ctx.lineWidth = size * 0.03;
  roundRect(ctx, x, y, size, size, r);
  ctx.stroke();
  const sc = size / 32;
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  ctx.fillStyle = "#3FA34D";
  ctx.beginPath();
  ctx.moveTo(16, 6);
  ctx.bezierCurveTo(16, 6, 26, 8, 26, 18);
  ctx.bezierCurveTo(26, 24, 20, 27, 16, 27);
  ctx.bezierCurveTo(16, 27, 16, 18, 10, 14);
  ctx.bezierCurveTo(10, 14, 14, 14, 16, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#0B3D2E";
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(16, 26);
  ctx.bezierCurveTo(16, 26, 16, 16, 22, 11);
  ctx.stroke();
  ctx.restore();
}

function drawStepRing(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  steps: number, weeklyGoal: number, strokeW: number
) {
  const pct = Math.min(steps / Math.max(weeklyGoal, 1), 1);
  const start = -Math.PI / 2;
  const end = start + 2 * Math.PI * pct;

  // Track bg
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(34,197,94,0.12)";
  ctx.lineWidth = strokeW;
  ctx.stroke();

  // Glow layer
  ctx.save();
  ctx.shadowColor = "rgba(34,197,94,0.55)";
  ctx.shadowBlur = 48;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, end);
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = strokeW + 6;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();

  // Solid ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, end);
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = strokeW;
  ctx.lineCap = "round";
  ctx.stroke();
}

// ─── Main renderer ─────────────────────────────────────────────────────────────
async function renderFitnessStory(data: FitnessWeekData): Promise<string> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#071810");
  bgGrad.addColorStop(0.45, "#0a1e12");
  bgGrad.addColorStop(1, "#071810");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Decorative radial glow top-right
  const glow1 = ctx.createRadialGradient(W * 0.85, H * 0.08, 0, W * 0.85, H * 0.08, 520);
  glow1.addColorStop(0, "rgba(34,197,94,0.12)");
  glow1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  // Decorative radial glow bottom-left
  const glow2 = ctx.createRadialGradient(W * 0.15, H * 0.85, 0, W * 0.15, H * 0.85, 480);
  glow2.addColorStop(0, "rgba(26,112,72,0.14)");
  glow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid texture
  ctx.save();
  ctx.globalAlpha = 0.025;
  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  // ── Logo + brand header ──
  const LOGO_SIZE = 80;
  const HEADER_Y = 120;
  drawEatVeraLogo(ctx, 80 + LOGO_SIZE / 2, HEADER_Y, LOGO_SIZE);

  ctx.font = "bold 52px 'Arial', sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText("EatVera", 80 + LOGO_SIZE + 24, HEADER_Y + 10);

  ctx.font = "28px 'Arial', sans-serif";
  ctx.fillStyle = "rgba(74,222,128,0.7)";
  ctx.fillText("Weekly Fitness Summary", 80 + LOGO_SIZE + 24, HEADER_Y + 52);

  // Week label pill
  const pillText = data.weekLabel;
  ctx.font = "bold 26px 'Arial', sans-serif";
  const pillW = ctx.measureText(pillText).width + 48;
  const pillX = W - 80 - pillW;
  const pillY = HEADER_Y - 22;
  roundRect(ctx, pillX, pillY, pillW, 44, 22);
  ctx.fillStyle = "rgba(34,197,94,0.15)";
  ctx.fill();
  ctx.strokeStyle = "rgba(34,197,94,0.35)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, pillX, pillY, pillW, 44, 22);
  ctx.stroke();
  ctx.fillStyle = "#4ade80";
  ctx.textAlign = "center";
  ctx.fillText(pillText, pillX + pillW / 2, pillY + 30);

  // ── Separator ──
  const SEP_Y = HEADER_Y + 90;
  const sepGrad = ctx.createLinearGradient(80, 0, W - 80, 0);
  sepGrad.addColorStop(0, "rgba(74,222,128,0)");
  sepGrad.addColorStop(0.3, "rgba(74,222,128,0.4)");
  sepGrad.addColorStop(0.7, "rgba(74,222,128,0.4)");
  sepGrad.addColorStop(1, "rgba(74,222,128,0)");
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, SEP_Y); ctx.lineTo(W - 80, SEP_Y);
  ctx.stroke();

  // ── Step Ring (hero element) ──
  const RING_CY = SEP_Y + 380;
  const RING_CX = W / 2;
  const RING_R = 270;
  const RING_SW = 28;
  drawStepRing(ctx, RING_CX, RING_CY, RING_R, data.totalSteps, data.stepGoal, RING_SW);

  // Step count inside ring
  const stepsDisplay = data.totalSteps >= 1000
    ? `${(data.totalSteps / 1000).toFixed(1)}k`
    : String(data.totalSteps);

  ctx.textAlign = "center";
  ctx.font = "bold 110px 'Arial', sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(stepsDisplay, RING_CX, RING_CY + 36);

  ctx.font = "bold 36px 'Arial', sans-serif";
  ctx.fillStyle = "rgba(74,222,128,0.75)";
  ctx.fillText("STEPS THIS WEEK", RING_CX, RING_CY + 90);

  const weeklyGoalDisplay = data.stepGoal >= 1000
    ? `${(data.stepGoal / 1000).toFixed(0)}k goal`
    : `${data.stepGoal} goal`;
  const pctDisplay = `${Math.round((data.totalSteps / Math.max(data.stepGoal, 1)) * 100)}%`;
  ctx.font = "30px 'Arial', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText(`${pctDisplay} of ${weeklyGoalDisplay}`, RING_CX, RING_CY - RING_R - 24);

  // ── Stats cards row ──
  const CARD_Y = RING_CY + RING_R + 70;
  const CARD_H = 200;
  const CARD_W = (W - 80 * 2 - 24) / 2;
  const CARD_R = 32;

  // Calories card
  {
    const cx = 80;
    roundRect(ctx, cx, CARD_Y, CARD_W, CARD_H, CARD_R);
    const cg = ctx.createLinearGradient(cx, CARD_Y, cx, CARD_Y + CARD_H);
    cg.addColorStop(0, "rgba(249,115,22,0.18)");
    cg.addColorStop(1, "rgba(249,115,22,0.06)");
    ctx.fillStyle = cg;
    ctx.fill();
    ctx.strokeStyle = "rgba(249,115,22,0.3)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx, CARD_Y, CARD_W, CARD_H, CARD_R);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = "24px 'Arial', sans-serif";
    ctx.fillStyle = "rgba(249,115,22,0.7)";
    ctx.fillText("🔥  CALORIES BURNED", cx + 32, CARD_Y + 52);

    ctx.font = "bold 72px 'Arial', sans-serif";
    ctx.fillStyle = "#fb923c";
    ctx.fillText(data.totalCaloriesBurned.toLocaleString(), cx + 32, CARD_Y + 140);

    ctx.font = "26px 'Arial', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText("kcal", cx + 32, CARD_Y + 178);
  }

  // Weight change card
  {
    const cx = 80 + CARD_W + 24;
    const wc = data.weightChange;
    const hasWeight = wc !== null;
    const wcColor = !hasWeight ? "#6b7280" : wc! < 0 ? "#22c55e" : wc! > 0 ? "#ef4444" : "#6b7280";
    const wcBgColor = !hasWeight ? "rgba(107,114,128,0.12)" : wc! < 0 ? "rgba(34,197,94,0.18)" : wc! > 0 ? "rgba(239,68,68,0.18)" : "rgba(107,114,128,0.12)";
    const wcBorderColor = !hasWeight ? "rgba(107,114,128,0.3)" : wc! < 0 ? "rgba(34,197,94,0.3)" : wc! > 0 ? "rgba(239,68,68,0.3)" : "rgba(107,114,128,0.3)";

    roundRect(ctx, cx, CARD_Y, CARD_W, CARD_H, CARD_R);
    const cg2 = ctx.createLinearGradient(cx, CARD_Y, cx, CARD_Y + CARD_H);
    cg2.addColorStop(0, wcBgColor);
    cg2.addColorStop(1, wcBgColor.replace(/[\d.]+\)$/, "0.04)"));
    ctx.fillStyle = cg2;
    ctx.fill();
    ctx.strokeStyle = wcBorderColor;
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx, CARD_Y, CARD_W, CARD_H, CARD_R);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = "24px 'Arial', sans-serif";
    ctx.fillStyle = `${wcColor}b0`;
    ctx.fillText("⚖️  WEIGHT CHANGE", cx + 32, CARD_Y + 52);

    if (hasWeight) {
      const wcInUnit = data.weightUnit === "lbs"
        ? Math.round(wc! * 2.20462 * 10) / 10
        : wc!;
      const wcStr = `${wc! > 0 ? "+" : ""}${wcInUnit}`;
      ctx.font = "bold 72px 'Arial', sans-serif";
      ctx.fillStyle = wcColor;
      ctx.fillText(wcStr, cx + 32, CARD_Y + 140);
      ctx.font = "26px 'Arial', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillText(data.weightUnit, cx + 32, CARD_Y + 178);
    } else {
      ctx.font = "bold 42px 'Arial', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillText("Not tracked", cx + 32, CARD_Y + 130);
    }
  }

  // ── Top exercise banner ──
  const EX_Y = CARD_Y + CARD_H + 40;
  const EX_H = 140;
  roundRect(ctx, 80, EX_Y, W - 160, EX_H, 32);
  const exGrad = ctx.createLinearGradient(80, EX_Y, W - 80, EX_Y);
  exGrad.addColorStop(0, "rgba(168,85,247,0.18)");
  exGrad.addColorStop(0.5, "rgba(168,85,247,0.10)");
  exGrad.addColorStop(1, "rgba(59,130,246,0.18)");
  ctx.fillStyle = exGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(168,85,247,0.3)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 80, EX_Y, W - 160, EX_H, 32);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "26px 'Arial', sans-serif";
  ctx.fillStyle = "rgba(192,132,252,0.75)";
  ctx.fillText("🏆  TOP EXERCISE", 120, EX_Y + 50);

  const exName = data.topExercise ?? "No exercises logged";
  ctx.font = "bold 48px 'Arial', sans-serif";
  ctx.fillStyle = "#e9d5ff";
  // Truncate if too long
  let displayEx = exName;
  while (ctx.measureText(displayEx).width > W - 160 - 240 && displayEx.length > 4) {
    displayEx = displayEx.slice(0, -1);
  }
  if (displayEx !== exName) displayEx += "…";
  ctx.fillText(displayEx, 120, EX_Y + 108);

  if (data.topExercise && data.topExerciseCount > 1) {
    ctx.font = "28px 'Arial', sans-serif";
    ctx.fillStyle = "rgba(192,132,252,0.5)";
    ctx.textAlign = "right";
    ctx.fillText(`${data.topExerciseCount}× this week`, W - 120, EX_Y + 108);
  }

  // ── Hydration row ──
  const HYD_Y = EX_Y + EX_H + 28;
  const HYD_H = 100;
  if (data.avgDailyCups !== undefined && data.avgDailyCups > 0) {
    roundRect(ctx, 80, HYD_Y, W - 160, HYD_H, 28);
    const hydGrad = ctx.createLinearGradient(80, HYD_Y, W - 80, HYD_Y);
    hydGrad.addColorStop(0, "rgba(59,130,246,0.18)");
    hydGrad.addColorStop(1, "rgba(59,130,246,0.06)");
    ctx.fillStyle = hydGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(59,130,246,0.3)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, 80, HYD_Y, W - 160, HYD_H, 28);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = "24px 'Arial', sans-serif";
    ctx.fillStyle = "rgba(96,165,250,0.75)";
    ctx.fillText("\uD83D\uDCA7  HYDRATION AVG", 120, HYD_Y + 42);

    ctx.font = "bold 44px 'Arial', sans-serif";
    ctx.fillStyle = "#93c5fd";
    const hydStr = `${data.avgDailyCups.toFixed(1)} cups/day`;
    ctx.fillText(hydStr, 120, HYD_Y + 86);

    if (data.waterGoalCups) {
      const hydPct = Math.round((data.avgDailyCups / data.waterGoalCups) * 100);
      ctx.textAlign = "right";
      ctx.font = "28px 'Arial', sans-serif";
      ctx.fillStyle = hydPct >= 100 ? "rgba(34,197,94,0.7)" : "rgba(96,165,250,0.5)";
      ctx.fillText(`${hydPct}% of goal`, W - 120, HYD_Y + 86);
    }
  }

  // ── Motivational tagline ──
  const TAG_Y = (data.avgDailyCups !== undefined && data.avgDailyCups > 0 ? HYD_Y + HYD_H : EX_Y + EX_H) + 60;
  const pct = Math.round((data.totalSteps / Math.max(data.stepGoal, 1)) * 100);
  const taglines = [
    pct >= 100 ? "Goal crushed. Week won. 💪" : null,
    pct >= 80 ? "Almost there — keep pushing!" : null,
    pct >= 50 ? "Halfway and moving strong." : null,
    "Every step counts. Keep going.",
  ];
  const tagline = taglines.find(t => t !== null) ?? "Every step counts.";

  ctx.textAlign = "center";
  ctx.font = "italic 38px 'Arial', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText(tagline, W / 2, TAG_Y);

  // ── Footer ──
  const FOOTER_Y = H - 120;
  const footerSepGrad = ctx.createLinearGradient(80, 0, W - 80, 0);
  footerSepGrad.addColorStop(0, "rgba(74,222,128,0)");
  footerSepGrad.addColorStop(0.3, "rgba(74,222,128,0.3)");
  footerSepGrad.addColorStop(0.7, "rgba(74,222,128,0.3)");
  footerSepGrad.addColorStop(1, "rgba(74,222,128,0)");
  ctx.strokeStyle = footerSepGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, FOOTER_Y - 24); ctx.lineTo(W - 80, FOOTER_Y - 24);
  ctx.stroke();

  drawEatVeraLogo(ctx, W / 2 - 120, FOOTER_Y + 20, 44);
  ctx.textAlign = "left";
  ctx.font = "bold 34px 'Arial', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("EatVera", W / 2 - 120 + 32, FOOTER_Y + 28);
  ctx.font = "24px 'Arial', sans-serif";
  ctx.fillStyle = "rgba(74,222,128,0.55)";
  ctx.fillText("Know what you eat", W / 2 - 120 + 32, FOOTER_Y + 58);

  return canvas.toDataURL("image/png");
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function FitnessShareCard({ data, onClose }: FitnessShareCardProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const url = await renderFitnessStory(data);
      setPreview(url);
    } catch (e) {
      console.error("FitnessShareCard render error:", e);
    } finally {
      setGenerating(false);
    }
  }, [data]);

  // Auto-generate on mount
  useState(() => { generate(); });

  async function handleShare() {
    if (!preview) return;
    setSharing(true);
    try {
      const blob = await (await fetch(preview)).blob();
      const file = new File([blob], "eatvera-fitness-week.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Weekly Fitness Summary — EatVera" });
      } else {
        handleDownload();
      }
    } catch { /* cancelled */ } finally {
      setSharing(false);
    }
  }

  function handleDownload() {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    a.download = "eatvera-fitness-week.png";
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
        <div>
          <h2 className="font-bold text-white text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Weekly Summary Card</h2>
          <p className="text-green-400/60 text-xs mt-0.5">Share to Instagram Stories</p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <X size={16} className="text-white/70" />
        </button>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center px-4 pb-4">
        {generating ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 size={32} className="animate-spin text-green-400" />
            <p className="text-white/50 text-sm">Generating your card…</p>
          </div>
        ) : preview ? (
          <img
            src={preview}
            alt="Weekly fitness summary"
            className="rounded-2xl shadow-2xl"
            style={{ maxHeight: "65vh", width: "auto", maxWidth: "100%" }}
          />
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 px-5 pb-10 pt-3 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={handleShare}
          disabled={!preview || sharing}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #0B3D2E, #2e9e5e)", color: "white", boxShadow: "0 4px 20px rgba(46,158,94,0.35)" }}
        >
          {sharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
          {sharing ? "Sharing…" : "Share to Stories"}
        </button>
        <button
          onClick={handleDownload}
          disabled={!preview}
          className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Download size={16} /> Download PNG
        </button>
      </div>
    </div>
  );
}
