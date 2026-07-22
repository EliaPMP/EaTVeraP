/**
 * NutritionLabelCanvas
 * Renders an FDA-style Nutrition Facts panel to an HTML canvas and provides
 * Share (Web Share API) and Download (PNG) buttons.
 *
 * Design follows the 2020 FDA Nutrition Facts label format.
 */

import { useEffect, useRef, useState } from "react";
import { Share2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FoodProduct } from "@/lib/foodApi";
import QRCode from "qrcode";

interface Props {
  product: FoodProduct;
  servingFactor?: number; // 1 = per 100g, or servingGrams/100 for per-serving
  servingLabel?: string;  // e.g. "Per 100g" or "Per Serving (30g)"
}

// FDA 2020 label nutrient order (only show what's available)
const LABEL_NUTRIENTS: { key: string; label: string; unit: string; indent?: boolean; bold?: boolean; dvKey?: string }[] = [
  { key: "energy-kcal_100g",       label: "Calories",            unit: "kcal", bold: true },
  { key: "fat_100g",               label: "Total Fat",           unit: "g",    bold: true,   dvKey: "fat" },
  { key: "saturated-fat_100g",     label: "Saturated Fat",       unit: "g",    indent: true, dvKey: "saturatedFat" },
  { key: "trans-fat_100g",         label: "Trans Fat",           unit: "g",    indent: true },
  { key: "cholesterol_100g",       label: "Cholesterol",         unit: "mg",   bold: true,   dvKey: "cholesterol" },
  { key: "sodium_100g",            label: "Sodium",              unit: "mg",   bold: true,   dvKey: "sodium" },
  { key: "carbohydrates_100g",     label: "Total Carbohydrate",  unit: "g",    bold: true,   dvKey: "carbs" },
  { key: "fiber_100g",             label: "Dietary Fiber",       unit: "g",    indent: true, dvKey: "fiber" },
  { key: "sugars_100g",            label: "Total Sugars",        unit: "g",    indent: true },
  { key: "proteins_100g",          label: "Protein",             unit: "g",    bold: true },
  { key: "vitamin-d_100g",         label: "Vitamin D",           unit: "µg",   dvKey: "vitaminD" },
  { key: "calcium_100g",           label: "Calcium",             unit: "mg",   dvKey: "calcium" },
  { key: "iron_100g",              label: "Iron",                unit: "mg",   dvKey: "iron" },
  { key: "potassium_100g",         label: "Potassium",           unit: "mg",   dvKey: "potassium" },
];

// FDA 2020 daily values
const DV: Record<string, number> = {
  fat: 78, saturatedFat: 20, cholesterol: 300, sodium: 2300,
  carbs: 275, fiber: 28, vitaminD: 20, calcium: 1300, iron: 18, potassium: 4700,
};

function formatVal(key: string, val: number): string {
  if (key === "energy-kcal_100g") return Math.round(val).toString();
  if (key === "cholesterol_100g" || key === "sodium_100g" || key === "potassium_100g" ||
      key === "calcium_100g" || key === "iron_100g") return Math.round(val * 1000).toString();
  if (key === "vitamin-d_100g") return (val * 1000).toFixed(1);
  return val.toFixed(1);
}

async function drawLabel(canvas: HTMLCanvasElement, product: FoodProduct, servingFactor: number, servingLabel: string) {
  const W = 360;
  const ctx = canvas.getContext("2d")!;

  // Collect rows that have data
  const rows = LABEL_NUTRIENTS.filter(n => {
    const raw = product.nutriments?.[n.key];
    return raw !== undefined && raw !== null;
  });

  // Calculate canvas height dynamically
  const headerH = 140;
  const rowH = 26;
  const footerH = 90;
  const brandingH = 50; // EatVera branding + QR code footer
  const H = headerH + rows.length * rowH + footerH + brandingH;
  canvas.width = W;
  canvas.height = H;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Outer border
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  let y = 14;

  // Title
  ctx.fillStyle = "#000";
  ctx.font = "bold 36px 'Arial Black', Arial, sans-serif";
  ctx.fillText("Nutrition Facts", 12, y + 32);
  y += 44;

  // Thick rule
  ctx.fillStyle = "#000";
  ctx.fillRect(8, y, W - 16, 8);
  y += 14;

  // Serving info
  ctx.font = "13px Arial, sans-serif";
  ctx.fillStyle = "#000";
  ctx.fillText(servingLabel, 8, y + 12);
  y += 18;
  if (product.servingSize) {
    ctx.fillText(`Serving size  ${product.servingSize}${product.servingUnit ? " " + product.servingUnit : ""}`, 8, y + 12);
    y += 18;
  }

  // Medium rule
  ctx.fillStyle = "#000";
  ctx.fillRect(8, y, W - 16, 5);
  y += 8;

  // "Amount per serving" label
  ctx.font = "bold 11px Arial, sans-serif";
  ctx.fillText("Amount per serving", 8, y + 11);
  y += 14;

  // Calories row (big)
  const calRow = rows.find(r => r.key === "energy-kcal_100g");
  if (calRow) {
    const calVal = (product.nutriments[calRow.key] ?? 0) * servingFactor;
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillText("Calories", 8, y + 22);
    ctx.font = "bold 38px Arial, sans-serif";
    const calStr = Math.round(calVal).toString();
    const calW = ctx.measureText(calStr).width;
    ctx.fillText(calStr, W - 16 - calW, y + 28);
    y += 36;
  }

  // Thick rule
  ctx.fillStyle = "#000";
  ctx.fillRect(8, y, W - 16, 5);
  y += 8;

  // % DV header
  ctx.font = "bold 10px Arial, sans-serif";
  ctx.fillStyle = "#000";
  ctx.fillText("% Daily Value*", W - 110, y + 10);
  y += 14;

  // Nutrient rows (skip calories since already shown)
  const nonCalRows = rows.filter(r => r.key !== "energy-kcal_100g");
  for (const row of nonCalRows) {
    const raw = product.nutriments[row.key] ?? 0;
    const displayVal = raw * servingFactor;
    const valStr = formatVal(row.key, displayVal);

    // Thin rule
    ctx.fillStyle = "#ccc";
    ctx.fillRect(row.indent ? 20 : 8, y, W - (row.indent ? 28 : 16), 1);
    y += 1;

    // Label
    ctx.fillStyle = "#000";
    if (row.bold) {
      ctx.font = "bold 12px Arial, sans-serif";
    } else {
      ctx.font = "12px Arial, sans-serif";
    }
    const labelX = row.indent ? 24 : 8;
    ctx.fillText(row.label, labelX, y + 18);

    // Value + unit
    ctx.font = "12px Arial, sans-serif";
    const valUnit = `${valStr}${row.unit}`;
    const valW = ctx.measureText(valUnit).width;

    // DV%
    let dvStr = "";
    if (row.dvKey && DV[row.dvKey]) {
      // Convert to same unit as DV
      let dvVal = displayVal;
      if (row.unit === "mg") dvVal = raw * servingFactor * 1000;
      if (row.unit === "µg") dvVal = raw * servingFactor * 1000;
      const pct = Math.round((dvVal / DV[row.dvKey]) * 100);
      dvStr = `${pct}%`;
    }

    if (dvStr) {
      const dvW = ctx.measureText(dvStr).width;
      ctx.font = "bold 12px Arial, sans-serif";
      ctx.fillText(dvStr, W - 16 - dvW, y + 18);
      ctx.font = "12px Arial, sans-serif";
      ctx.fillText(valUnit, W - 16 - dvW - 8 - valW, y + 18);
    } else {
      ctx.fillText(valUnit, W - 16 - valW, y + 18);
    }

    y += rowH;
  }

  // Thick rule
  ctx.fillStyle = "#000";
  ctx.fillRect(8, y, W - 16, 5);
  y += 10;

  // Footer footnote
  ctx.font = "10px Arial, sans-serif";
  ctx.fillStyle = "#000";
  const footnote = "* The % Daily Value (DV) tells you how much a nutrient in a serving";
  const footnote2 = "  of food contributes to a daily diet. 2,000 calories a day is used";
  const footnote3 = "  for general nutrition advice.";
  ctx.fillText(footnote, 8, y + 10);
  ctx.fillText(footnote2, 8, y + 22);
  ctx.fillText(footnote3, 8, y + 34);
  y += 44;

  // Product name footer
  ctx.font = "bold 10px Arial, sans-serif";
  ctx.fillStyle = "#555";
  const nameStr = `${product.name}${product.brand ? " · " + product.brand : ""}`;
  ctx.fillText(nameStr.slice(0, 52), 8, y + 10);
  y += 16;

  // ── EatVera Branding Footer ──────────────────────────────────────────────
  // Thin separator
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(8, y, W - 16, 1);
  y += 8;

  // Leaf icon (drawn as a simple SVG-like path on canvas)
  const leafX = 10;
  const leafY = y + 2;
  const leafSize = 16;
  ctx.fillStyle = "#0B3D2E";
  ctx.beginPath();
  // Simple leaf shape: ellipse rotated 45°
  ctx.save();
  ctx.translate(leafX + leafSize / 2, leafY + leafSize / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.scale(1, 0.6);
  ctx.arc(0, 0, leafSize / 2, 0, Math.PI * 2);
  ctx.restore();
  ctx.fill();
  // Stem
  ctx.strokeStyle = "#0B3D2E";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leafX + leafSize / 2, leafY + leafSize);
  ctx.lineTo(leafX + leafSize / 2, leafY + leafSize + 3);
  ctx.stroke();

  // "EatVera" text
  ctx.fillStyle = "#0B3D2E";
  ctx.font = "bold 12px Arial, sans-serif";
  ctx.fillText("EatVera", leafX + leafSize + 4, y + 13);

  // Tagline
  ctx.fillStyle = "#9ca3af";
  ctx.font = "9px Arial, sans-serif";
  ctx.fillText("Know what you eat", leafX + leafSize + 4, y + 24);

  // QR code — links to the product scan page with barcode pre-filled
  try {
    const qrUrl = product.barcode
      ? `${window.location.origin}/scan?barcode=${encodeURIComponent(product.barcode)}`
      : window.location.href;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 40,
      margin: 0,
      color: { dark: "#374151", light: "#ffffff" },
    });
    const qrImg = new Image();
    await new Promise<void>((resolve) => {
      qrImg.onload = () => resolve();
      qrImg.src = qrDataUrl;
    });
    const qrSize = 40;
    ctx.drawImage(qrImg, W - 16 - qrSize, y, qrSize, qrSize);
    // "Scan to view" label
    ctx.fillStyle = "#9ca3af";
    ctx.font = "8px Arial, sans-serif";
    const scanLabel = "Scan to view";
    const scanW = ctx.measureText(scanLabel).width;
    ctx.fillText(scanLabel, W - 16 - qrSize + (qrSize - scanW) / 2, y + qrSize + 10);
  } catch {
    // QR generation failed — skip silently
  }
}

export default function NutritionLabelCanvas({ product, servingFactor = 1, servingLabel = "Per 100g" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    drawLabel(canvasRef.current, product, servingFactor, servingLabel).catch(console.error);
  }, [product, servingFactor, servingLabel]);

  const getBlob = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      if (!canvasRef.current) return reject(new Error("Canvas not ready"));
      canvasRef.current.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create image"));
      }, "image/png");
    });

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await getBlob();
      const file = new File([blob], `${product.name || "nutrition"}-label.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${product.name} — Nutrition Facts` });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      // User cancelled share — ignore
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await getBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${product.name || "nutrition"}-label.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const hasNutrition = product.nutriments && Object.keys(product.nutriments).length > 0;
  if (!hasNutrition) return null;

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: "100%",
          borderRadius: "8px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
          border: "1px solid #e7e5e4",
        }}
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center gap-1.5 text-xs"
        >
          {sharing ? <Loader2 size={12} className="animate-spin" /> : <Share2 size={12} />}
          Share
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 text-xs"
        >
          {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          Download PNG
        </Button>
      </div>
    </div>
  );
}
