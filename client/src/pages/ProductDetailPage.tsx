/**
 * ProductDetailPage — wrapper that reads a FoodProduct from localStorage
 * and renders the full ProductResult view.
 * Used when tapping example products on the homepage (or any static product card).
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ProductResult from "@/pages/ProductResult";
import type { FoodProduct } from "@/lib/foodApi";

const STORAGE_KEY = "eatvera_selected_product";

/** Save a product for the detail page to pick up */
export function setSelectedProduct(product: FoodProduct) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(product));
  } catch {
    // storage full — ignore
  }
}

export default function ProductDetailPage() {
  const [, navigate] = useLocation();
  const [product, setProduct] = useState<FoodProduct | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FoodProduct;
        // Normalize allergens: may be stored as a string from older data
        if (typeof (parsed.allergens as unknown) === "string") {
          const str = (parsed.allergens as unknown as string).trim();
          parsed.allergens = str ? str.split(/[,;]+/).map(s => s.trim()).filter(Boolean) : [];
        }
        // Normalize labels: may be stored as a string from older data
        if (typeof (parsed.labels as unknown) === "string") {
          const str = (parsed.labels as unknown as string).trim();
          parsed.labels = str ? str.split(/[,;]+/).map(s => s.trim()).filter(Boolean) : [];
        }
        setProduct(parsed);
      } else {
        // Nothing stored — go home
        navigate("/");
      }
    } catch {
      navigate("/");
    }
  }, [navigate]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-[#145A3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ProductResult
      product={product}
      onBack={() => {
        navigate("/");
      }}
    />
  );
}
