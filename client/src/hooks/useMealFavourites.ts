/**
 * useMealFavourites — manages a list of starred/favourite meals in localStorage.
 * Favourite entries can come from calorie scan results or AI meal suggestions.
 */
import { useState, useCallback } from "react";

export interface FavouriteMeal {
  id: string;
  name: string;
  emoji?: string;
  source: "scan" | "suggestion";
  imageUrl?: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  keyIngredients?: string[];
  qualityScore?: number;
  starredAt: string;
  // For re-logging: store original analysis if from scan
  originalAnalysis?: unknown;
}

const FAVOURITES_KEY = "eatclean-meal-favourites";

function loadFavourites(): FavouriteMeal[] {
  try {
    const stored = localStorage.getItem(FAVOURITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavourites(favs: FavouriteMeal[]) {
  try {
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favs));
  } catch {}
}

export function useMealFavourites() {
  const [favourites, setFavourites] = useState<FavouriteMeal[]>(() => loadFavourites());

  const addFavourite = useCallback((meal: Omit<FavouriteMeal, "id" | "starredAt">) => {
    const newFav: FavouriteMeal = {
      ...meal,
      id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      starredAt: new Date().toISOString(),
    };
    setFavourites(prev => {
      const updated = [newFav, ...prev];
      saveFavourites(updated);
      return updated;
    });
    return newFav.id;
  }, []);

  const removeFavourite = useCallback((id: string) => {
    setFavourites(prev => {
      const updated = prev.filter(f => f.id !== id);
      saveFavourites(updated);
      return updated;
    });
  }, []);

  const isFavourite = useCallback(
    (name: string) => favourites.some(f => f.name.toLowerCase() === name.toLowerCase()),
    [favourites]
  );

  const toggleFavourite = useCallback(
    (meal: Omit<FavouriteMeal, "id" | "starredAt">) => {
      const existing = favourites.find(f => f.name.toLowerCase() === meal.name.toLowerCase());
      if (existing) {
        removeFavourite(existing.id);
        return false;
      } else {
        addFavourite(meal);
        return true;
      }
    },
    [favourites, addFavourite, removeFavourite]
  );

  return { favourites, addFavourite, removeFavourite, isFavourite, toggleFavourite };
}
