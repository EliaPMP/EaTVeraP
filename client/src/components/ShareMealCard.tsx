/**
 * ShareMealCard — premium shareable card for a meal analysis.
 *
 * Formats:
 *   • 9:16 Story  (1080×1920): Photo top, deep-forest text panel bottom.
 *   • 1:1 Square  (1080×1080): Photo left, text right, macro strip bottom.
 *   • Sticker     (400×400):   Compact score ring + meal name + logo.
 *
 * Extras:
 *   • Custom caption editor — user note rendered above footer.
 *   • Animated GIF export   — score ring animates 0→score over 2s.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import {
  X, Share2, Twitter, MessageCircle, Copy, Check,
  Download, LayoutTemplate, Pencil, Sticker, Film, ImageDown,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface ShareMealData {
  mealName: string;
  totalCalories: number;
  qualityScore: number;
  macros: { protein: number; carbs: number; fat: number };
  imageUrl?: string;
  warnings?: string[];
}

interface ShareMealCardProps {
  meal: ShareMealData;
  onClose: () => void;
}

type CardFormat = "stories" | "square" | "sticker";

// ─── Score helpers ────────────────────────────────────────────────────────────
function getScoreColor(s: number) {
  if (s >= 80) return "#22c55e";
  if (s >= 60) return "#84cc16";
  if (s >= 40) return "#f59e0b";
  if (s >= 20) return "#f97316";
  return "#ef4444";
}
function getScoreGlow(s: number) {
  if (s >= 80) return "rgba(34,197,94,0.6)";
  if (s >= 60) return "rgba(132,204,22,0.6)";
  if (s >= 40) return "rgba(245,158,11,0.6)";
  if (s >= 20) return "rgba(249,115,22,0.6)";
  return "rgba(239,68,68,0.6)";
}
function getScoreLabel(s: number) {
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  if (s >= 20) return "Poor";
  return "Very Poor";
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (ctx.measureText(t + "…").width > maxWidth && t.length > 0) t = t.slice(0, -1);
  return t + "…";
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

function drawScoreRing(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  score: number, scoreColor: string, glowColor: string, strokeW: number,
  partial?: number  // 0-1 override for animation
) {
  const pct = partial !== undefined ? partial : score / 100;
  const start = -Math.PI / 2;
  const end = start + 2 * Math.PI * pct;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = strokeW;
  ctx.stroke();
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.strokeStyle = scoreColor;
  ctx.lineWidth = strokeW + 4;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.strokeStyle = scoreColor;
  ctx.lineWidth = strokeW;
  ctx.lineCap = "round";
  ctx.stroke();
}

// ─── 9:16 Stories renderer ───────────────────────────────────────────────────
async function renderStoriesCard(
  meal: ShareMealData,
  mealImageUrl?: string,
  caption?: string,
  partial?: number
): Promise<string> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const scoreColor = getScoreColor(meal.qualityScore);
  const glowColor  = getScoreGlow(meal.qualityScore);
  const scoreLabel = getScoreLabel(meal.qualityScore);
  const PHOTO_H = 1020;
  const PANEL_Y = PHOTO_H;

  ctx.fillStyle = "#071810";
  ctx.fillRect(0, 0, W, H);

  let photoLoaded = false;
  if (mealImageUrl) {
    try {
      const img = await loadImage(mealImageUrl);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, PHOTO_H); ctx.clip();
      const scale = Math.max(W / img.width, PHOTO_H / img.height);
      const sw = W / scale, sh = PHOTO_H / scale;
      const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, PHOTO_H);
      ctx.restore();
      photoLoaded = true;
    } catch { /* skip */ }
  }
  if (!photoLoaded) {
    const fb = ctx.createLinearGradient(0, 0, 0, PHOTO_H);
    fb.addColorStop(0, "#0a2318"); fb.addColorStop(1, "#0d2e1e");
    ctx.fillStyle = fb; ctx.fillRect(0, 0, W, PHOTO_H);
    ctx.save(); ctx.globalAlpha = 0.08;
    drawEatVeraLogo(ctx, W / 2, PHOTO_H / 2, 320);
    ctx.globalAlpha = 1; ctx.restore();
  }

  const fadeH = 220;
  const fade = ctx.createLinearGradient(0, PHOTO_H - fadeH, 0, PHOTO_H + 40);
  fade.addColorStop(0, "rgba(7,24,16,0)");
  fade.addColorStop(0.6, "rgba(7,24,16,0.75)");
  fade.addColorStop(1, "rgba(7,24,16,1)");
  ctx.fillStyle = fade; ctx.fillRect(0, PHOTO_H - fadeH, W, fadeH + 40);

  const panelBg = ctx.createLinearGradient(0, PANEL_Y, 0, H);
  panelBg.addColorStop(0, "#071810"); panelBg.addColorStop(0.5, "#0a1e12"); panelBg.addColorStop(1, "#071810");
  ctx.fillStyle = panelBg; ctx.fillRect(0, PANEL_Y, W, H - PANEL_Y);

  const glow2 = ctx.createRadialGradient(W * 0.3, PANEL_Y + 200, 0, W * 0.3, PANEL_Y + 200, 600);
  glow2.addColorStop(0, "rgba(26,112,72,0.18)"); glow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow2; ctx.fillRect(0, PANEL_Y, W, H - PANEL_Y);

  const sepGrad = ctx.createLinearGradient(0, 0, W, 0);
  sepGrad.addColorStop(0, "rgba(74,222,128,0)");
  sepGrad.addColorStop(0.3, scoreColor + "cc");
  sepGrad.addColorStop(0.7, scoreColor + "cc");
  sepGrad.addColorStop(1, "rgba(74,222,128,0)");
  ctx.fillStyle = sepGrad; ctx.fillRect(0, PANEL_Y, W, 2.5);

  // Branding
  const LOGO_SIZE = 88, LOGO_CX = 72 + LOGO_SIZE / 2, LOGO_CY = PANEL_Y + 72 + LOGO_SIZE / 2;
  drawEatVeraLogo(ctx, LOGO_CX, LOGO_CY, LOGO_SIZE);
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "bold 52px 'Georgia', 'Times New Roman', serif";
  ctx.fillText("EatVera", LOGO_CX + LOGO_SIZE / 2 + 20, LOGO_CY + 16);
  ctx.fillStyle = "rgba(74,222,128,0.65)";
  ctx.font = "26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("Know what you eat", LOGO_CX + LOGO_SIZE / 2 + 20, LOGO_CY + 52);
  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.font = "26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "right"; ctx.fillText(dateStr, W - 72, LOGO_CY + 16); ctx.textAlign = "left";

  const divY = PANEL_Y + 188;
  const divGrad = ctx.createLinearGradient(72, 0, W - 72, 0);
  divGrad.addColorStop(0, "rgba(255,255,255,0.12)");
  divGrad.addColorStop(0.5, "rgba(255,255,255,0.06)");
  divGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = divGrad; ctx.fillRect(72, divY, W - 144, 1);

  const cX = 72, cW = W - 144;
  const RING_R = 130, RING_CX = W - 72 - RING_R;
  const NAME_Y = divY + 60, nameMaxW = RING_CX - RING_R - cX - 40;

  ctx.fillStyle = "rgba(74,222,128,0.55)";
  ctx.font = "600 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("MEAL ANALYSIS", cX, NAME_Y);

  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "bold 68px 'Georgia', 'Times New Roman', serif";
  const words = meal.mealName.split(" ");
  let line1 = "", line2 = "", building = "";
  for (const w of words) {
    const test = building ? building + " " + w : w;
    if (ctx.measureText(test).width > nameMaxW && building) { line1 = building; building = w; }
    else building = test;
  }
  if (!line1) line1 = building; else line2 = building;
  ctx.fillText(truncateText(ctx, line1, nameMaxW), cX, NAME_Y + 82);
  if (line2) ctx.fillText(truncateText(ctx, line2, nameMaxW), cX, NAME_Y + 162);

  const ringCY = NAME_Y + (line2 ? 120 : 80);
  drawScoreRing(ctx, RING_CX, ringCY, RING_R, meal.qualityScore, scoreColor, glowColor, 18, partial);
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "bold 70px 'Courier New', monospace";
  ctx.textAlign = "center";
  const displayScore = partial !== undefined ? Math.round(partial * meal.qualityScore) : meal.qualityScore;
  ctx.fillText(String(displayScore), RING_CX, ringCY + 26);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("/ 100", RING_CX, ringCY + 62);
  ctx.fillStyle = scoreColor;
  ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(scoreLabel.toUpperCase(), RING_CX, ringCY + 100);
  ctx.textAlign = "left";

  const calY = NAME_Y + (line2 ? 230 : 160);
  ctx.save();
  ctx.shadowColor = scoreColor; ctx.shadowBlur = 48;
  ctx.fillStyle = scoreColor;
  ctx.font = "bold 148px 'Courier New', monospace";
  ctx.fillText(String(Math.round(meal.totalCalories)), cX, calY);
  ctx.restore();
  ctx.fillStyle = "rgba(255,255,255,0.30)";
  ctx.font = "32px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("CALORIES", cX, calY + 48);

  const macroY = calY + 100;
  const macros = [
    { label: "Protein", value: `${Math.round(meal.macros.protein)}g`, color: "#60a5fa" },
    { label: "Carbs",   value: `${Math.round(meal.macros.carbs)}g`,   color: "#fbbf24" },
    { label: "Fat",     value: `${Math.round(meal.macros.fat)}g`,     color: "#f87171" },
  ];
  const mW = (cW - 40) / 3, mH = 130;
  macros.forEach((m, i) => {
    const mx = cX + i * (mW + 20), my = macroY;
    const cg = ctx.createLinearGradient(mx, my, mx, my + mH);
    cg.addColorStop(0, "rgba(255,255,255,0.09)"); cg.addColorStop(1, "rgba(255,255,255,0.03)");
    ctx.fillStyle = cg; roundRect(ctx, mx, my, mW, mH, 24); ctx.fill();
    ctx.strokeStyle = `${m.color}55`; ctx.lineWidth = 1.5;
    roundRect(ctx, mx, my, mW, mH, 24); ctx.stroke();
    const acc = ctx.createLinearGradient(mx, my, mx + mW, my);
    acc.addColorStop(0, m.color + "dd"); acc.addColorStop(1, m.color + "22");
    ctx.fillStyle = acc; roundRect(ctx, mx, my, mW, 5, 5); ctx.fill();
    ctx.fillStyle = m.color; ctx.font = "bold 56px 'Courier New', monospace";
    ctx.fillText(m.value, mx + 22, my + 80);
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.font = "24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(m.label.toUpperCase(), mx + 22, my + 112);
  });

  const statusY = macroY + mH + 60;
  const warnings = meal.warnings?.slice(0, 2) || [];
  if (warnings.length > 0) {
    ctx.fillStyle = "rgba(252,165,165,0.10)";
    roundRect(ctx, cX, statusY - 36, cW, warnings.length * 48 + 84, 20); ctx.fill();
    ctx.strokeStyle = "rgba(252,165,165,0.22)"; ctx.lineWidth = 1.5;
    roundRect(ctx, cX, statusY - 36, cW, warnings.length * 48 + 84, 20); ctx.stroke();
    ctx.fillStyle = "#fca5a5"; ctx.font = "bold 30px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText("⚠  Flagged Ingredients", cX + 24, statusY + 6);
    ctx.fillStyle = "rgba(255,255,255,0.40)";
    ctx.font = "24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    warnings.forEach((w, i) => ctx.fillText(truncateText(ctx, `· ${w}`, cW - 48), cX + 24, statusY + 52 + i * 48));
  } else {
    ctx.fillStyle = "rgba(34,197,94,0.10)";
    roundRect(ctx, cX, statusY - 36, cW, 76, 20); ctx.fill();
    ctx.strokeStyle = "rgba(34,197,94,0.28)"; ctx.lineWidth = 1.5;
    roundRect(ctx, cX, statusY - 36, cW, 76, 20); ctx.stroke();
    ctx.fillStyle = "#86efac"; ctx.font = "bold 30px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText("✓  Clean — no harmful ingredients detected", cX + 24, statusY + 8);
  }

  // Caption above footer
  if (caption && caption.trim()) {
    const capY = H - 130;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "italic 32px 'Georgia', 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.fillText(truncateText(ctx, `"${caption.trim()}"`, W - 144), W / 2, capY);
    ctx.textAlign = "left";
  }

  const barGrad = ctx.createLinearGradient(0, 0, W, 0);
  barGrad.addColorStop(0, scoreColor + "00");
  barGrad.addColorStop(0.25, scoreColor);
  barGrad.addColorStop(0.75, scoreColor);
  barGrad.addColorStop(1, scoreColor + "00");
  ctx.fillStyle = barGrad; ctx.fillRect(0, H - 10, W, 10);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.font = "26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center"; ctx.fillText("EatVera · Know what you eat", W / 2, H - 36); ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

// ─── 1:1 Square renderer ─────────────────────────────────────────────────────
async function renderSquareCard(
  meal: ShareMealData,
  mealImageUrl?: string,
  caption?: string,
  partial?: number
): Promise<string> {
  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const scoreColor = getScoreColor(meal.qualityScore);
  const glowColor  = getScoreGlow(meal.qualityScore);
  const scoreLabel = getScoreLabel(meal.qualityScore);

  const MACRO_H = 120;
  const CONTENT_H = H - MACRO_H;
  const PHOTO_PAD = 40;
  const PHOTO_W = Math.round(W * 0.42);
  const PHOTO_H = CONTENT_H - PHOTO_PAD * 2;
  const TEXT_X = PHOTO_PAD + PHOTO_W + 48;
  const TEXT_W = W - TEXT_X - PHOTO_PAD;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#071810"); bg.addColorStop(0.5, "#0a1e12"); bg.addColorStop(1, "#071810");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W * 0.7, H * 0.4, 0, W * 0.7, H * 0.4, 500);
  glow2.addColorStop(0, "rgba(26,112,72,0.15)"); glow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow2; ctx.fillRect(0, 0, W, H);

  let photoLoaded = false;
  if (mealImageUrl) {
    try {
      const img = await loadImage(mealImageUrl);
      ctx.save();
      roundRect(ctx, PHOTO_PAD, PHOTO_PAD, PHOTO_W, PHOTO_H, 36); ctx.clip();
      const scale = Math.max(PHOTO_W / img.width, PHOTO_H / img.height);
      const sw = PHOTO_W / scale, sh = PHOTO_H / scale;
      const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, PHOTO_PAD, PHOTO_PAD, PHOTO_W, PHOTO_H);
      ctx.restore();
      photoLoaded = true;
    } catch { /* skip */ }
  }
  if (!photoLoaded) {
    const fb = ctx.createLinearGradient(PHOTO_PAD, PHOTO_PAD, PHOTO_PAD, PHOTO_PAD + PHOTO_H);
    fb.addColorStop(0, "#0a2318"); fb.addColorStop(1, "#0d2e1e");
    ctx.fillStyle = fb; ctx.fillRect(PHOTO_PAD, PHOTO_PAD, PHOTO_W, PHOTO_H);
    ctx.save(); ctx.globalAlpha = 0.12;
    drawEatVeraLogo(ctx, PHOTO_PAD + PHOTO_W / 2, PHOTO_PAD + PHOTO_H / 2, 180);
    ctx.globalAlpha = 1; ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 2;
  roundRect(ctx, PHOTO_PAD, PHOTO_PAD, PHOTO_W, PHOTO_H, 36); ctx.stroke();
  ctx.restore();
  const photoFade = ctx.createLinearGradient(PHOTO_PAD + PHOTO_W - 80, 0, PHOTO_PAD + PHOTO_W + 20, 0);
  photoFade.addColorStop(0, "rgba(7,24,16,0)"); photoFade.addColorStop(1, "rgba(7,24,16,0.85)");
  ctx.fillStyle = photoFade;
  roundRect(ctx, PHOTO_PAD, PHOTO_PAD, PHOTO_W, PHOTO_H, 36); ctx.fill();

  const sepX = PHOTO_PAD + PHOTO_W + 24;
  const sepGrad = ctx.createLinearGradient(0, PHOTO_PAD + 60, 0, CONTENT_H - 60);
  sepGrad.addColorStop(0, "rgba(74,222,128,0)");
  sepGrad.addColorStop(0.3, scoreColor + "55");
  sepGrad.addColorStop(0.7, scoreColor + "55");
  sepGrad.addColorStop(1, "rgba(74,222,128,0)");
  ctx.fillStyle = sepGrad; ctx.fillRect(sepX, PHOTO_PAD + 60, 1.5, CONTENT_H - 120);

  const LOGO_SIZE = 72, LOGO_CX = TEXT_X + LOGO_SIZE / 2, LOGO_CY = PHOTO_PAD + LOGO_SIZE / 2;
  drawEatVeraLogo(ctx, LOGO_CX, LOGO_CY, LOGO_SIZE);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "bold 42px 'Georgia', 'Times New Roman', serif";
  ctx.fillText("EatVera", LOGO_CX + LOGO_SIZE / 2 + 16, LOGO_CY + 14);
  ctx.fillStyle = "rgba(74,222,128,0.60)";
  ctx.font = "20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("Know what you eat", LOGO_CX + LOGO_SIZE / 2 + 16, LOGO_CY + 40);

  const RING_R = 110, RING_CX = TEXT_X + TEXT_W / 2;
  const RING_CY = LOGO_CY + LOGO_SIZE / 2 + 32 + RING_R + 16;
  drawScoreRing(ctx, RING_CX, RING_CY, RING_R, meal.qualityScore, scoreColor, glowColor, 16, partial);
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "bold 64px 'Courier New', monospace";
  ctx.textAlign = "center";
  const displayScore = partial !== undefined ? Math.round(partial * meal.qualityScore) : meal.qualityScore;
  ctx.fillText(String(displayScore), RING_CX, RING_CY + 24);
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.font = "22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("/ 100", RING_CX, RING_CY + 56);
  ctx.fillStyle = scoreColor;
  ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(scoreLabel.toUpperCase(), RING_CX, RING_CY + 90);
  ctx.textAlign = "left";

  const nameY = RING_CY + RING_R + 56;
  ctx.fillStyle = "rgba(74,222,128,0.55)";
  ctx.font = "600 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center"; ctx.fillText("MEAL ANALYSIS", RING_CX, nameY); ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "bold 52px 'Georgia', 'Times New Roman', serif";
  const words2 = meal.mealName.split(" ");
  let l1 = "", l2 = "", bld = "";
  for (const w of words2) {
    const test = bld ? bld + " " + w : w;
    if (ctx.measureText(test).width > TEXT_W + 20 && bld) { l1 = bld; bld = w; }
    else bld = test;
  }
  if (!l1) l1 = bld; else l2 = bld;
  ctx.textAlign = "center";
  ctx.fillText(truncateText(ctx, l1, TEXT_W + 20), RING_CX, nameY + 62);
  if (l2) ctx.fillText(truncateText(ctx, l2, TEXT_W + 20), RING_CX, nameY + 120);
  ctx.textAlign = "left";

  const calY = nameY + (l2 ? 158 : 100);
  ctx.save();
  ctx.shadowColor = scoreColor; ctx.shadowBlur = 40;
  ctx.fillStyle = scoreColor; ctx.font = "bold 100px 'Courier New', monospace";
  ctx.textAlign = "center"; ctx.fillText(String(Math.round(meal.totalCalories)), RING_CX, calY); ctx.restore();
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.font = "26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center"; ctx.fillText("CALORIES", RING_CX, calY + 40); ctx.textAlign = "left";

  // Caption
  if (caption && caption.trim()) {
    const capY = calY + 80;
    ctx.fillStyle = "rgba(255,255,255,0.50)";
    ctx.font = "italic 28px 'Georgia', 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.fillText(truncateText(ctx, `"${caption.trim()}"`, TEXT_W + 20), RING_CX, capY);
    ctx.textAlign = "left";
  }

  const macros2 = [
    { label: "Protein", value: `${Math.round(meal.macros.protein)}g`, color: "#60a5fa" },
    { label: "Carbs",   value: `${Math.round(meal.macros.carbs)}g`,   color: "#fbbf24" },
    { label: "Fat",     value: `${Math.round(meal.macros.fat)}g`,     color: "#f87171" },
  ];
  const STRIP_Y = H - MACRO_H - 8;
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  roundRect(ctx, 0, STRIP_Y, W, MACRO_H + 8, 0); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, STRIP_Y); ctx.lineTo(W, STRIP_Y); ctx.stroke();
  const mW2 = W / 3;
  macros2.forEach((m, i) => {
    const mx = i * mW2;
    if (i > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mx, STRIP_Y + 16); ctx.lineTo(mx, H - 16); ctx.stroke();
    }
    const acc = ctx.createLinearGradient(mx, STRIP_Y, mx + mW2, STRIP_Y);
    acc.addColorStop(0, m.color + "cc"); acc.addColorStop(1, m.color + "22");
    ctx.fillStyle = acc; ctx.fillRect(mx, STRIP_Y, mW2, 3);
    ctx.fillStyle = m.color; ctx.font = "bold 44px 'Courier New', monospace";
    ctx.textAlign = "center"; ctx.fillText(m.value, mx + mW2 / 2, STRIP_Y + 66);
    ctx.fillStyle = "rgba(255,255,255,0.30)";
    ctx.font = "20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(m.label.toUpperCase(), mx + mW2 / 2, STRIP_Y + 96);
    ctx.textAlign = "left";
  });

  const barGrad = ctx.createLinearGradient(0, 0, W, 0);
  barGrad.addColorStop(0, scoreColor + "00");
  barGrad.addColorStop(0.25, scoreColor);
  barGrad.addColorStop(0.75, scoreColor);
  barGrad.addColorStop(1, scoreColor + "00");
  ctx.fillStyle = barGrad; ctx.fillRect(0, H - 8, W, 8);

  return canvas.toDataURL("image/png");
}

// ─── Sticker renderer (400×400) ──────────────────────────────────────────────
async function renderStickerCard(
  meal: ShareMealData,
  caption?: string,
  partial?: number
): Promise<string> {
  const W = 400, H = 400;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const scoreColor = getScoreColor(meal.qualityScore);
  const glowColor  = getScoreGlow(meal.qualityScore);
  const scoreLabel = getScoreLabel(meal.qualityScore);

  // Background
  roundRect(ctx, 0, 0, W, H, 48);
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, "#0d2e1e"); bg.addColorStop(1, "#071810");
  ctx.fillStyle = bg; ctx.fill();

  // Outer glow ring (decorative)
  ctx.save();
  ctx.shadowColor = scoreColor; ctx.shadowBlur = 60;
  ctx.strokeStyle = scoreColor + "22"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 170, 0, 2 * Math.PI); ctx.stroke();
  ctx.restore();

  // Score ring
  const RING_R = 110, RING_CX = W / 2, RING_CY = H / 2 - 20;
  drawScoreRing(ctx, RING_CX, RING_CY, RING_R, meal.qualityScore, scoreColor, glowColor, 14, partial);

  // Score number
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "bold 72px 'Courier New', monospace";
  ctx.textAlign = "center";
  const displayScore = partial !== undefined ? Math.round(partial * meal.qualityScore) : meal.qualityScore;
  ctx.fillText(String(displayScore), RING_CX, RING_CY + 26);
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.font = "18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("/ 100", RING_CX, RING_CY + 54);
  ctx.fillStyle = scoreColor;
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(scoreLabel.toUpperCase(), RING_CX, RING_CY + 82);

  // Meal name below ring
  const mealNameY = RING_CY + RING_R + 36;
  ctx.fillStyle = "rgba(255,255,255,0.80)";
  ctx.font = "bold 22px 'Georgia', 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.fillText(truncateText(ctx, meal.mealName, W - 60), RING_CX, mealNameY);

  // Caption if provided
  if (caption && caption.trim()) {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "italic 16px 'Georgia', 'Times New Roman', serif";
    ctx.fillText(truncateText(ctx, `"${caption.trim()}"`, W - 80), RING_CX, mealNameY + 28);
  }

  // EatVera logo + name at top
  const LOGO_SIZE = 36, LOGO_CX2 = W / 2 - 52, LOGO_CY2 = 32;
  drawEatVeraLogo(ctx, LOGO_CX2, LOGO_CY2, LOGO_SIZE);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "bold 24px 'Georgia', 'Times New Roman', serif";
  ctx.textAlign = "left";
  ctx.fillText("EatVera", LOGO_CX2 + LOGO_SIZE / 2 + 8, LOGO_CY2 + 9);
  ctx.textAlign = "left";

  // Bottom accent bar
  const barGrad = ctx.createLinearGradient(0, 0, W, 0);
  barGrad.addColorStop(0, scoreColor + "00");
  barGrad.addColorStop(0.3, scoreColor);
  barGrad.addColorStop(0.7, scoreColor);
  barGrad.addColorStop(1, scoreColor + "00");
  ctx.fillStyle = barGrad; ctx.fillRect(0, H - 6, W, 6);

  return canvas.toDataURL("image/png");
}

// ─── GIF export using canvas frames ──────────────────────────────────────────
async function generateAnimatedGif(
  meal: ShareMealData,
  format: CardFormat,
  caption: string,
  mealImageUrl?: string
): Promise<Blob> {
  // We generate 30 frames over 2 seconds (60ms each) animating 0→score
  // Then encode as APNG-like sequence using canvas frames bundled as WebM via MediaRecorder
  const FRAMES = 30;
  const FRAME_MS = 67; // ~15fps

  // Pick canvas size based on format
  const W = format === "sticker" ? 400 : 1080;
  const H = format === "stories" ? 1920 : format === "sticker" ? 400 : 1080;

  const offscreen = document.createElement("canvas");
  offscreen.width = W; offscreen.height = H;

  // Collect frames as PNG data URLs
  const frameDataUrls: string[] = [];
  for (let f = 0; f <= FRAMES; f++) {
    // Ease-out cubic
    const t = f / FRAMES;
    const eased = 1 - Math.pow(1 - t, 3);
    let dataUrl: string;
    if (format === "stories") {
      dataUrl = await renderStoriesCard(meal, mealImageUrl, caption, eased);
    } else if (format === "square") {
      dataUrl = await renderSquareCard(meal, mealImageUrl, caption, eased);
    } else {
      dataUrl = await renderStickerCard(meal, caption, eased);
    }
    frameDataUrls.push(dataUrl);
  }

  // Encode as animated WebP using MediaRecorder on a canvas stream
  // Fallback: if MediaRecorder not available, return last frame as PNG blob
  const streamCanvas = document.createElement("canvas");
  streamCanvas.width = W; streamCanvas.height = H;
  const sCtx = streamCanvas.getContext("2d")!;

  const chunks: Blob[] = [];
  let stream: MediaStream;
  try {
    stream = (streamCanvas as any).captureStream(15);
  } catch {
    // Fallback: just return the final frame as a PNG
    const res = await fetch(frameDataUrls[frameDataUrls.length - 1]);
    return await res.blob();
  }

  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : MediaRecorder.isTypeSupported("video/webm")
    ? "video/webm"
    : null;

  if (!mimeType) {
    const res = await fetch(frameDataUrls[frameDataUrls.length - 1]);
    return await res.blob();
  }

  const recorder = new MediaRecorder(stream, { mimeType });
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  return new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.start();

    let fi = 0;
    function drawNextFrame() {
      if (fi >= frameDataUrls.length) {
        recorder.stop();
        return;
      }
      const img = new Image();
      img.onload = () => {
        sCtx.clearRect(0, 0, W, H);
        sCtx.drawImage(img, 0, 0, W, H);
        fi++;
        setTimeout(drawNextFrame, FRAME_MS);
      };
      img.src = frameDataUrls[fi];
    }
    drawNextFrame();
  });
}

// ─── Share Modal Component ────────────────────────────────────────────────────
export default function ShareMealCard({ meal, onClose }: ShareMealCardProps) {
  const [format, setFormat] = useState<CardFormat>("stories");
  const [squareDataUrl, setSquareDataUrl]   = useState<string | null>(null);
  const [storiesDataUrl, setStoriesDataUrl] = useState<string | null>(null);
  const [stickerDataUrl, setStickerDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [copied, setCopied]         = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [savedToPhotos, setSavedToPhotos] = useState(false);
  const [gifExporting, setGifExporting] = useState(false);
  const [caption, setCaption]       = useState("");
  const [editingCaption, setEditingCaption] = useState(false);
  const captionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { theme } = useTheme();

  const scoreColor = getScoreColor(meal.qualityScore);

  // Re-render cards when caption changes (debounced 600ms)
  const regenerate = useCallback((cap: string) => {
    setGenerating(true);
    Promise.all([
      renderStoriesCard(meal, meal.imageUrl, cap),
      renderSquareCard(meal, meal.imageUrl, cap),
      renderStickerCard(meal, cap),
    ]).then(([st, sq, sk]) => {
      setStoriesDataUrl(st);
      setSquareDataUrl(sq);
      setStickerDataUrl(sk);
      setGenerating(false);
    }).catch(() => setGenerating(false));
  }, [meal]);

  useEffect(() => { regenerate(caption); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCaptionChange = (val: string) => {
    setCaption(val);
    if (captionDebounceRef.current) clearTimeout(captionDebounceRef.current);
    captionDebounceRef.current = setTimeout(() => regenerate(val), 600);
  };

  const cardDataUrl =
    format === "square" ? squareDataUrl :
    format === "sticker" ? stickerDataUrl :
    storiesDataUrl;

  const shareText = `I just scanned my meal with EatVera! 🌿\n${meal.mealName} — ${Math.round(meal.totalCalories)} cal, quality score ${meal.qualityScore}/100 (${getScoreLabel(meal.qualityScore)})${caption ? `\n"${caption}"` : ""}\n\n#EatVera #HealthyEating #KnowWhatYouEat`;

  const handleNativeShare = useCallback(async () => {
    if (!cardDataUrl || !navigator.share) return;
    try {
      const res = await fetch(cardDataUrl);
      const blob = await res.blob();
      const fname = `eatvera-${format}-${meal.mealName.replace(/\s+/g, "-").toLowerCase()}.png`;
      await navigator.share({ title: `My EatVera Score: ${meal.qualityScore}/100`, text: shareText, files: [new File([blob], fname, { type: "image/png" })] });
    } catch { /* cancelled */ }
  }, [cardDataUrl, shareText, meal.qualityScore, meal.mealName, format]);

  const handleTwitter  = useCallback(() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer"), [shareText]);
  const handleWhatsApp = useCallback(() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer"), [shareText]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(shareText); }
    catch { const el = document.createElement("textarea"); el.value = shareText; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, [shareText]);

  const handleDownload = useCallback(() => {
    if (!cardDataUrl) return;
    setDownloading(true);
    const a = document.createElement("a");
    a.href = cardDataUrl;
    a.download = `eatvera-${format}-${meal.mealName.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
    setTimeout(() => setDownloading(false), 1800);
  }, [cardDataUrl, meal.mealName, format]);

  const handleGifExport = useCallback(async () => {
    setGifExporting(true);
    try {
      const blob = await generateAnimatedGif(meal, format, caption, meal.imageUrl);
      const ext = blob.type.includes("webm") ? "webm" : "png";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `eatvera-animated-${format}.${ext}`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch { /* skip */ }
    setGifExporting(false);
  }, [meal, format, caption]);

  // Save to Photos — uses Web Share API with files on mobile (triggers native Save to Photos),
  // falls back to a regular download link on desktop.
  const handleSaveToPhotos = useCallback(async () => {
    if (!cardDataUrl) return;
    const fname = `eatvera-${format}-${meal.mealName.replace(/\s+/g, "-").toLowerCase()}.png`;
    // On mobile browsers that support sharing files, trigger native save-to-photos flow
    if (navigator.canShare && navigator.share) {
      try {
        const res = await fetch(cardDataUrl);
        const blob = await res.blob();
        const file = new File([blob], fname, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "EatVera Score Card" });
          setSavedToPhotos(true);
          setTimeout(() => setSavedToPhotos(false), 2000);
          return;
        }
      } catch { /* user cancelled or not supported */ }
    }
    // Fallback: standard download (browser will save to Downloads/Photos)
    const a = document.createElement("a");
    a.href = cardDataUrl;
    a.download = fname;
    a.click();
    setSavedToPhotos(true);
    setTimeout(() => setSavedToPhotos(false), 2000);
  }, [cardDataUrl, meal.mealName, format]);

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const FORMATS: { key: CardFormat; label: string }[] = [
    { key: "stories", label: "9:16 Story" },
    { key: "square",  label: "1:1 Square" },
    { key: "sticker", label: "Sticker" },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h2 className="text-white font-bold text-lg" style={{ letterSpacing: "-0.02em" }}>Share Your Score</h2>
          <p className="text-white/40 text-xs mt-0.5">Premium shareable card</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <X size={18} className="text-white/70" />
        </button>
      </div>

      {/* Format switcher */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0">
        <div className="flex rounded-2xl p-1 gap-1"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {FORMATS.map(({ key, label }) => (
            <button key={key} onClick={() => setFormat(key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: format === key ? scoreColor : "transparent",
                color: format === key ? "white" : "rgba(255,255,255,0.45)",
                boxShadow: format === key ? `0 4px 16px ${scoreColor}50` : "none",
              }}>
              {key === "sticker" ? <Sticker size={13} /> : <LayoutTemplate size={13} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Caption editor */}
      <div className="px-5 pb-3 flex-shrink-0">
        {editingCaption ? (
          <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <Pencil size={14} className="text-white/40 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={caption}
              onChange={(e) => handleCaptionChange(e.target.value)}
              onBlur={() => setEditingCaption(false)}
              placeholder='Add a personal note… e.g. "Post-workout lunch 💪"'
              maxLength={80}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/25"
            />
            <span className="text-white/20 text-[10px] flex-shrink-0">{caption.length}/80</span>
          </div>
        ) : (
          <button onClick={() => setEditingCaption(true)}
            className="w-full flex items-center gap-2 rounded-2xl px-4 py-2.5 text-left transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Pencil size={14} className="text-white/30 flex-shrink-0" />
            <span className="text-white/30 text-sm italic flex-1 truncate">
              {caption || 'Add a personal note… e.g. "Post-workout lunch 💪"'}
            </span>
            {caption && <span className="text-white/20 text-[10px] flex-shrink-0">tap to edit</span>}
          </button>
        )}
      </div>

      {/* Card preview */}
      <div className="flex-1 mx-5 mb-3 rounded-3xl overflow-hidden flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", minHeight: 260 }}>
        {generating ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full"
                  style={{ background: scoreColor, animation: `ecShareBounce 1.2s ${i * 0.2}s infinite`, opacity: 0.6 }} />
              ))}
            </div>
            <p className="text-white/30 text-xs">Generating premium card…</p>
          </div>
        ) : cardDataUrl ? (
          <div className="relative flex items-center justify-center h-full w-full p-3">
            <img src={cardDataUrl} alt="Share card"
              className="rounded-2xl object-contain"
              style={{
                maxHeight: "100%", maxWidth: "100%",
                width: format === "stories" ? "auto" : "100%",
                boxShadow: `0 0 60px ${scoreColor}25, 0 20px 60px rgba(0,0,0,0.6)`,
                border: "1px solid rgba(255,255,255,0.07)",
              }} />
            <div className="absolute top-5 right-5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white/50 bg-black/50 backdrop-blur-sm">
              {format === "stories" ? "9:16 · Story" : format === "square" ? "1:1 · Square" : "400×400 · Sticker"}
            </div>
          </div>
        ) : (
          <p className="text-white/40 text-sm text-center px-6">Could not generate card.</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-8 pt-2 flex-shrink-0">
        {/* Primary row: Save to Photos (prominent) + Animated */}
        <div className="flex gap-2 mb-2">
          {cardDataUrl && (
            <button onClick={handleSaveToPhotos}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all"
              style={{
                background: savedToPhotos ? "#22c55e" : scoreColor,
                color: "white",
                boxShadow: savedToPhotos ? "0 4px 16px rgba(34,197,94,0.45)" : `0 4px 16px ${scoreColor}50`,
                transform: savedToPhotos ? "scale(0.97)" : "scale(1)",
                transition: "all 0.2s ease",
              }}>
              {savedToPhotos ? <Check size={16} /> : <ImageDown size={16} />}
              {savedToPhotos ? "Saved to Photos!" : "Save to Photos"}
            </button>
          )}
          <button onClick={handleGifExport}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all"
            style={{
              width: 112,
              flexShrink: 0,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: gifExporting ? scoreColor : "white"
            }}>
            <Film size={16} />
            {gifExporting ? "…" : "Animated"}
          </button>
        </div>
        {/* Secondary row: Download PNG + Share */}
        <div className="flex gap-2 mb-3">
          {cardDataUrl && (
            <button onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-medium text-xs transition-all"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: downloading ? "#22c55e" : "rgba(255,255,255,0.65)" }}>
              <Download size={14} />
              {downloading ? "Saved!" : "Download PNG"}
            </button>
          )}
          {hasNativeShare && (
            <button onClick={handleNativeShare}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-medium text-xs"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)" }}>
              <Share2 size={14} />
              Share
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: <Twitter size={16} className="text-white" />, label: "Twitter",  fn: handleTwitter  },
            { icon: <MessageCircle size={16} className="text-white" />, label: "WhatsApp", fn: handleWhatsApp },
            { icon: copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-white" />, label: copied ? "Copied!" : "Copy Text", fn: handleCopy },
          ].map(({ icon, label, fn }) => (
            <button key={label} onClick={fn}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {icon}
              <span className="text-[10px] text-white/50 font-medium">{label}</span>
            </button>
          ))}
        </div>
        <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-white/35 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Caption Preview</p>
          <p className="text-white/60 text-xs leading-relaxed">{shareText}</p>
        </div>
      </div>
      <style>{`
        @keyframes ecShareBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
