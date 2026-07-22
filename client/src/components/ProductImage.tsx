/**
 * ProductImage — lazy-loads a real product photo via the server-side image proxy.
 * The proxy tries barcode lookup first, then name+brand search as fallback.
 * Falls back to a category icon if no image is available.
 * Caches results in a module-level Map so repeated renders don't re-fetch.
 */
import { useState, useEffect } from "react";
import { Package, Beef, Fish, Apple, Milk, Wheat, Snowflake, Baby, Dumbbell, Wine, Carrot, Droplets } from "lucide-react";

// Module-level cache: cacheKey → image URL (or null if not found)
const imageCache = new Map<string, string | null>();

interface ProductImageProps {
  barcode?: string;
  name?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;       // pre-fetched URL (skips fetch if provided)
  thumbnailUrl?: string;
  size?: number;           // px, default 44
  className?: string;
}

function CategoryIcon({ category, name, size }: { category?: string; name?: string; size: number }) {
  const text = `${category ?? ""} ${name ?? ""}`.toLowerCase();
  const iconSize = Math.round(size * 0.45);
  const cls = "text-stone-300";
  if (text.includes("beef") || text.includes("steak") || text.includes("bison") || text.includes("meat")) return <Beef size={iconSize} className={cls} />;
  if (text.includes("fish") || text.includes("seafood") || text.includes("salmon") || text.includes("tuna")) return <Fish size={iconSize} className={cls} />;
  if (text.includes("fruit") || text.includes("apple") || text.includes("berry")) return <Apple size={iconSize} className={cls} />;
  if (text.includes("vegetable") || text.includes("veg") || text.includes("carrot")) return <Carrot size={iconSize} className={cls} />;
  if (text.includes("dairy") || text.includes("milk") || text.includes("cheese") || text.includes("yogurt")) return <Milk size={iconSize} className={cls} />;
  if (text.includes("grain") || text.includes("bread") || text.includes("wheat") || text.includes("cereal")) return <Wheat size={iconSize} className={cls} />;
  if (text.includes("frozen")) return <Snowflake size={iconSize} className={cls} />;
  if (text.includes("baby") || text.includes("kids") || text.includes("infant")) return <Baby size={iconSize} className={cls} />;
  if (text.includes("supplement") || text.includes("protein") || text.includes("vitamin")) return <Dumbbell size={iconSize} className={cls} />;
  if (text.includes("alcohol") || text.includes("wine") || text.includes("beer") || text.includes("spirit")) return <Wine size={iconSize} className={cls} />;
  if (text.includes("water") || text.includes("beverage") || text.includes("drink")) return <Droplets size={iconSize} className={cls} />;
  return <Package size={iconSize} className={cls} />;
}

export default function ProductImage({
  barcode,
  name,
  brand,
  category,
  imageUrl,
  thumbnailUrl,
  size = 44,
  className = "",
}: ProductImageProps) {
  const preferredUrl = thumbnailUrl || imageUrl;
  const [url, setUrl] = useState<string | null>(preferredUrl ?? null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If we already have a URL passed in, use it
    if (preferredUrl) {
      setUrl(preferredUrl);
      return;
    }

    // Need at least a barcode or name to fetch
    if (!barcode && !name) return;

    // Build stable cache key
    const cacheKey = barcode || `name:${name}:${brand ?? ""}`;

    // Check module-level cache first
    if (imageCache.has(cacheKey)) {
      setUrl(imageCache.get(cacheKey) ?? null);
      return;
    }

    // Build proxy URL — pass barcode + name + brand for best results
    const params = new URLSearchParams();
    if (barcode) params.set("barcode", barcode);
    if (name) params.set("name", name);
    if (brand) params.set("brand", brand);

    const controller = new AbortController();
    fetch(`/api/image-proxy?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: { url: string | null }) => {
        const found = data.url ?? null;
        imageCache.set(cacheKey, found);
        setUrl(found);
      })
      .catch(() => {
        // Silently fail — show category icon
      });

    return () => controller.abort();
  }, [barcode, name, brand, preferredUrl]);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: 10,
    background: "#f5f5f4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  };

  return (
    <div style={containerStyle} className={className}>
      {url && !error ? (
        <img
          src={url}
          alt={name ?? "Product"}
          style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }}
          onError={() => setError(true)}
          loading="lazy"
        />
      ) : (
        <CategoryIcon category={category} name={name} size={size} />
      )}
    </div>
  );
}
