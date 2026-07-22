/**
 * OasisProductCard — Oasis-style product card
 * Large product image centered, name below, score dot + number at bottom
 * White card, clean minimal layout
 */
import { useState } from "react";
import { Package, Beef, Fish, Leaf, Cookie, Milk, Apple } from "lucide-react";

interface OasisProductCardProps {
  name: string;
  brand?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  score: number;
  scoreColor: string;
  category?: string;
  averagePrice?: number;
  priceSource?: "live" | "estimate";
  onClick?: () => void;
  className?: string;
}

function CategoryIcon({ category, size = 40 }: { category?: string; size?: number }) {
  const cat = (category || "").toLowerCase();
  const cls = "text-stone-300 dark:text-stone-500";
  if (cat.includes("beef") || cat.includes("bison") || cat.includes("pork") || cat.includes("lamb")) {
    return <Beef size={size} className={cls} />;
  }
  if (cat.includes("seafood") || cat.includes("fish") || cat.includes("salmon") || cat.includes("tuna")) {
    return <Fish size={size} className={cls} />;
  }
  if (cat.includes("fruit") || cat.includes("produce") || cat.includes("vegetable")) {
    return <Apple size={size} className={cls} />;
  }
  if (cat.includes("dairy") || cat.includes("milk") || cat.includes("cheese") || cat.includes("yogurt")) {
    return <Milk size={size} className={cls} />;
  }
  if (cat.includes("cereal") || cat.includes("snack") || cat.includes("chip") || cat.includes("cookie")) {
    return <Cookie size={size} className={cls} />;
  }
  if (cat.includes("organic") || cat.includes("natural") || cat.includes("supplement")) {
    return <Leaf size={size} className={cls} />;
  }
  return <Package size={size} className={cls} />;
}

export function OasisProductCard({
  name,
  brand,
  imageUrl,
  thumbnailUrl,
  score,
  scoreColor,
  category,
  averagePrice,
  priceSource,
  onClick,
  className = "",
}: OasisProductCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Prefer webp thumbnail (faster), fall back to full imageUrl
  const img = !imgFailed ? (thumbnailUrl || imageUrl) : undefined;

  return (
    <div
      className={`bg-white dark:bg-stone-800 rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform duration-150 ${className}`}
      style={{
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
      onClick={onClick}
    >
      {/* Product image area */}
      <div
        className="w-full relative flex items-center justify-center bg-stone-50 dark:bg-stone-700"
        style={{ height: 88, padding: "10px" }}
      >
        {img ? (
          <>
            {/* Loading skeleton */}
            {!imgLoaded && (
              <div className="absolute inset-0 bg-stone-100 dark:bg-stone-700 animate-pulse rounded-t-2xl" />
            )}
            <img
              src={img}
              alt={name}
              className="w-full h-full object-contain relative z-10"
              style={{ maxHeight: 68, opacity: imgLoaded ? 1 : 0, transition: "opacity 0.2s ease" }}
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                // If thumbnail failed, try the full imageUrl as fallback
                if (img === thumbnailUrl && imageUrl && imageUrl !== thumbnailUrl) {
                  setImgFailed(false);
                  // Force re-render with imageUrl only by clearing thumbnail
                } else {
                  setImgFailed(true);
                }
              }}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1">
            <CategoryIcon category={category} size={44} />
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="px-2.5 pt-2 pb-2.5">
        <p className="font-semibold text-stone-800 dark:text-stone-100 text-xs leading-tight line-clamp-2 mb-0.5">
          {name}
        </p>
        {brand && (
          <p className="text-stone-400 dark:text-stone-500 text-[10px] truncate mb-1.5">{brand}</p>
        )}

        {/* Score row */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: scoreColor }}
          />
          <span
            className="font-bold text-sm"
            style={{ color: scoreColor, fontFamily: "'DM Mono', monospace" }}
          >
            {score}
          </span>
          <span className="text-stone-400 dark:text-stone-500 text-xs">/100</span>
        </div>

        {/* Price row */}
        {averagePrice !== undefined && (
          <div className="flex items-center gap-1 mt-1.5">
            <span className="font-bold text-xs font-mono-data" style={{ color: "#145A3A" }}>
              ${averagePrice.toFixed(2)}
            </span>
            {priceSource === "estimate" && (
              <span className="text-[9px] text-stone-400 dark:text-stone-500">est.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
