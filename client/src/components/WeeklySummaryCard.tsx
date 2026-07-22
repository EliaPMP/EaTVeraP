/**
 * WeeklySummaryCard — generates a beautiful shareable PNG for weekly nutrition progress.
 * Shows: total calories, average macros, best/worst meals, 7-day trend, and streak badges.
 * Supports Stories (1080×1920) format with theme-aware rendering.
 */
import { useState, useCallback, useEffect } from "react";
import { X, Share2, Twitter, MessageCircle, Copy, Check, Download, LayoutTemplate } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface WeeklyStats {
  weeklyAvg: number;
  totalScans: number;
  totalCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  bestMeal: { name: string; score: number } | null;
  worstMeal: { name: string; score: number } | null;
  currentStreak: number;
  dailyScores: number[]; // 7 days
}

interface WeeklySummaryCardProps {
  stats: WeeklyStats;
  onClose: () => void;
}

// ─── Score helpers ────────────────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#84cc16";
  if (score >= 40) return "#f59e0b";
  if (score >= 20) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Poor";
  return "Very Poor";
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (ctx.measureText(truncated + "…").width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}

// ─── Draw score ring ──────────────────────────────────────────────────────────
function drawScoreRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  score: number,
  color: string,
  stroke: number
) {
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  // Background circle
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = stroke;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Score circle with glow
  ctx.shadowColor = color + "80";
  ctx.shadowBlur = 20;
  ctx.strokeStyle = color;
  ctx.lineWidth = stroke;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (score / 100) * Math.PI * 2);
  ctx.stroke();
  ctx.shadowColor = "transparent";
}

// ─── Weekly Summary canvas renderer (1080×1920) ──────────────────────────────
async function renderWeeklySummaryCard(stats: WeeklyStats, isDark = true): Promise<string> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const scoreColor = getScoreColor(stats.weeklyAvg);
  const scoreLabel = getScoreLabel(stats.weeklyAvg);

  // ── Theme-aware color palette ─────────────────────────────────────────────
  const textPrimary = isDark ? "rgba(255,255,255,0.95)" : "rgba(15,15,15,0.95)";
  const textSecondary = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,15,15,0.5)";
  const brandingPillBg = isDark ? "rgba(255,255,255,0.12)" : "rgba(11,61,46,0.10)";
  const brandingPillBorder = isDark ? "rgba(255,255,255,0.22)" : "rgba(11,61,46,0.25)";
  const brandingText = isDark ? "white" : "#0B3D2E";
  const footerText = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.4)";
  const panelGradStart = isDark ? "rgba(0,0,0,0)" : "rgba(255,255,255,0)";
  const panelGradMid1 = isDark ? "rgba(8,8,8,0.65)" : "rgba(247,245,240,0.75)";
  const panelGradMid2 = isDark ? "rgba(8,8,8,0.88)" : "rgba(247,245,240,0.92)";
  const panelGradEnd = isDark ? "rgba(5,5,5,0.98)" : "rgba(247,245,240,0.99)";
  const cardBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const cardBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  // ── Background ──────────────────────────────────────────────────────────────
  const fallbackBg = ctx.createLinearGradient(0, 0, 0, H);
  if (isDark) {
    fallbackBg.addColorStop(0, "#0f0f0f");
    fallbackBg.addColorStop(0.5, "#1a1a1a");
    fallbackBg.addColorStop(1, "#111111");
  } else {
    fallbackBg.addColorStop(0, "#f7f5f0");
    fallbackBg.addColorStop(0.5, "#f0ede8");
    fallbackBg.addColorStop(1, "#ebe8e2");
  }
  ctx.fillStyle = fallbackBg;
  ctx.fillRect(0, 0, W, H);

  // ── Top vignette ────────────────────────────────────────────────────────────
  const topVignette = ctx.createLinearGradient(0, 0, 0, 500);
  topVignette.addColorStop(0, "rgba(0,0,0,0.80)");
  topVignette.addColorStop(0.6, "rgba(0,0,0,0.35)");
  topVignette.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topVignette;
  ctx.fillRect(0, 0, W, 500);

  // ── Bottom content panel ─────────────────────────────────────────────────────
  const panelH = 1100;
  const panelY = H - panelH;

  const panelGrad = ctx.createLinearGradient(0, panelY, 0, H);
  panelGrad.addColorStop(0, panelGradStart);
  panelGrad.addColorStop(0.08, panelGradMid1);
  panelGrad.addColorStop(0.25, panelGradMid2);
  panelGrad.addColorStop(1, panelGradEnd);
  ctx.fillStyle = panelGrad;
  ctx.fillRect(0, panelY - 60, W, panelH + 60);

  // ── Top branding ────────────────────────────────────────────────────────────
  ctx.fillStyle = brandingPillBg;
  roundRect(ctx, 52, 68, 380, 76, 38);
  ctx.fill();
  ctx.strokeStyle = brandingPillBorder;
  ctx.lineWidth = 1.5;
  roundRect(ctx, 52, 68, 380, 76, 38);
  ctx.stroke();

  ctx.fillStyle = brandingText;
  ctx.font = "bold 40px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("📊 Weekly Summary", 78, 118);

  // Date top-right
  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  ctx.fillStyle = textSecondary;
  ctx.font = "30px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(dateStr, W - 52, 116);
  ctx.textAlign = "left";

  // ── Content area ────────────────────────────────────────────────────────────
  const contentX = 64;
  const contentW = W - 128;

  // ── Weekly average + score ring ──────────────────────────────────────────────
  let y = panelY + 48;

  ctx.fillStyle = textSecondary;
  ctx.font = "28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("This week's average", contentX, y);

  // Score ring on the right
  const ringCX = W - 140;
  const ringCY = y + 60;
  const ringR = 110;
  drawScoreRing(ctx, ringCX, ringCY, ringR, stats.weeklyAvg, scoreColor, 14);

  ctx.fillStyle = textPrimary;
  ctx.font = "bold 56px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(String(stats.weeklyAvg), ringCX, ringCY + 18);
  ctx.fillStyle = textSecondary;
  ctx.font = "22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("/ 100", ringCX, ringCY + 50);
  ctx.fillStyle = scoreColor;
  ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(scoreLabel, ringCX, ringCY + 82);
  ctx.textAlign = "left";

  // ── Stats row ────────────────────────────────────────────────────────────────
  y = ringCY + 140;

  const stats_data = [
    { label: "Total Scans", value: stats.totalScans, color: "#60a5fa" },
    { label: "Total Calories", value: Math.round(stats.totalCalories), color: "#f97316" },
    { label: "Streak", value: stats.currentStreak, color: "#ec4899" },
  ];

  const statW = (contentW - 40) / 3;
  stats_data.forEach((s, i) => {
    const sx = contentX + i * (statW + 20);

    // Card background
    ctx.fillStyle = cardBg;
    roundRect(ctx, sx, y, statW, 100, 16);
    ctx.fill();
    ctx.strokeStyle = cardBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, sx, y, statW, 100, 16);
    ctx.stroke();

    // Value
    ctx.fillStyle = s.color;
    ctx.font = "bold 44px 'Courier New', monospace";
    ctx.fillText(String(s.value), sx + 16, y + 60);

    // Label
    ctx.fillStyle = textSecondary;
    ctx.font = "24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(s.label, sx + 16, y + 88);
  });

  // ── 7-day trend bars ─────────────────────────────────────────────────────────
  y += 120;

  ctx.fillStyle = textSecondary;
  ctx.font = "26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("7-Day Trend", contentX, y);

  y += 40;

  const maxScore = Math.max(...stats.dailyScores, 1);
  const barW = (contentW - 60) / 7;
  const barH = 80;

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  stats.dailyScores.forEach((score, i) => {
    const bx = contentX + i * (barW + 8);
    const bh = score > 0 ? (score / maxScore) * barH : 4;
    const by = y + barH - bh;

    // Bar
    ctx.fillStyle = score > 0 ? getScoreColor(score) : "rgba(255,255,255,0.1)";
    roundRect(ctx, bx, by, barW, bh, 6);
    ctx.fill();

    // Day label
    ctx.fillStyle = textSecondary;
    ctx.font = "20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(dayLabels[i], bx + barW / 2, y + barH + 28);
    ctx.textAlign = "left";
  });

  // ── Macros ──────────────────────────────────────────────────────────────────
  y += barH + 60;

  ctx.fillStyle = textSecondary;
  ctx.font = "26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("Weekly Averages", contentX, y);

  y += 40;

  const macros = [
    { label: "Protein", value: `${Math.round(stats.avgProtein)}g`, color: "#60a5fa" },
    { label: "Carbs", value: `${Math.round(stats.avgCarbs)}g`, color: "#fbbf24" },
    { label: "Fat", value: `${Math.round(stats.avgFat)}g`, color: "#f87171" },
  ];

  macros.forEach((m, i) => {
    const mx = contentX + i * (statW + 20);

    ctx.fillStyle = cardBg;
    roundRect(ctx, mx, y, statW, 100, 16);
    ctx.fill();
    ctx.strokeStyle = cardBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, mx, y, statW, 100, 16);
    ctx.stroke();

    ctx.fillStyle = m.color;
    ctx.font = "bold 44px 'Courier New', monospace";
    ctx.fillText(m.value, mx + 16, y + 60);

    ctx.fillStyle = textSecondary;
    ctx.font = "24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(m.label, mx + 16, y + 88);
  });

  // ── Best/Worst meals ────────────────────────────────────────────────────────
  y += 120;

  if (stats.bestMeal) {
    ctx.fillStyle = "#86efac";
    ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText("✅ Best Meal", contentX, y);
    ctx.fillStyle = textPrimary;
    ctx.font = "24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(truncateText(ctx, stats.bestMeal.name, contentW - 60), contentX, y + 36);
    y += 60;
  }

  if (stats.worstMeal) {
    ctx.fillStyle = "#fca5a5";
    ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText("⚠️ Lowest Score", contentX, y);
    ctx.fillStyle = textPrimary;
    ctx.font = "24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(truncateText(ctx, stats.worstMeal.name, contentW - 60), contentX, y + 36);
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = footerText;
  ctx.font = "26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Tracked with EatVera · Know what you eat", W / 2, H - 56);
  ctx.textAlign = "left";

  // Bottom accent bar
  const accentBar = ctx.createLinearGradient(0, 0, W, 0);
  accentBar.addColorStop(0, scoreColor + "00");
  accentBar.addColorStop(0.3, scoreColor);
  accentBar.addColorStop(0.7, scoreColor);
  accentBar.addColorStop(1, scoreColor + "00");
  ctx.fillStyle = accentBar;
  ctx.fillRect(0, H - 10, W, 10);

  return canvas.toDataURL("image/png");
}

// ─── Share Modal Component ────────────────────────────────────────────────────
export default function WeeklySummaryCard({ stats, onClose }: WeeklySummaryCardProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    let cancelled = false;
    setGenerating(true);

    renderWeeklySummaryCard(stats, isDark).then((url) => {
      if (!cancelled) {
        setDataUrl(url);
        setGenerating(false);
      }
    }).catch(() => {
      if (!cancelled) setGenerating(false);
    });

    return () => { cancelled = true; };
  }, [stats, isDark]);

  const shareText = `My weekly nutrition summary with EatVera! 📊\nAverage score: ${stats.weeklyAvg}/100 · ${stats.totalScans} scans · ${Math.round(stats.totalCalories)} calories\n\n#EatVera #HealthyEating #WeeklyProgress`;

  const handleNativeShare = useCallback(async () => {
    if (!dataUrl) return;
    if (navigator.share) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "weekly-summary.png", { type: "image/png" });
        await navigator.share({
          title: "EatVera Weekly Summary",
          text: shareText,
          files: [file],
        });
      } catch { /* dismissed */ }
    }
  }, [dataUrl, shareText]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareText]);

  const handleDownload = useCallback(() => {
    if (!dataUrl) return;
    setDownloading(true);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `eatvera-weekly-${new Date().toISOString().split("T")[0]}.png`;
    link.click();
    setTimeout(() => setDownloading(false), 500);
  }, [dataUrl]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900">
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">Weekly Summary</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
            <X size={24} />
          </button>
        </div>

        {/* Preview */}
        <div className="p-6 bg-stone-50 dark:bg-zinc-800/50">
          {generating ? (
            <div className="w-full aspect-[9/16] bg-stone-200 dark:bg-zinc-700 rounded-xl animate-pulse flex items-center justify-center">
              <div className="text-stone-400">Generating...</div>
            </div>
          ) : dataUrl ? (
            <img src={dataUrl} alt="Weekly Summary" className="w-full rounded-xl shadow-lg" />
          ) : null}
        </div>

        {/* Actions */}
        <div className="p-6 space-y-3 border-t border-stone-200 dark:border-zinc-800">
          <button
            onClick={handleNativeShare}
            disabled={!dataUrl || generating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-stone-300 text-white font-semibold rounded-xl transition-colors"
          >
            <Share2 size={18} />
            Share
          </button>

          <button
            onClick={handleDownload}
            disabled={!dataUrl || generating || downloading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-300 text-white font-semibold rounded-xl transition-colors"
          >
            <Download size={18} />
            {downloading ? "Downloading..." : "Download"}
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-200 hover:bg-stone-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-stone-900 dark:text-white font-semibold rounded-xl transition-colors"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? "Copied!" : "Copy Text"}
          </button>
        </div>
      </div>
    </div>
  );
}
