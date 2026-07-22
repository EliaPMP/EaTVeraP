/**
 * useSavedRecipes — localStorage-based recipe favorites
 */
import { useState, useCallback } from "react";

const STORAGE_KEY = "ec_saved_recipes";

function loadSaved(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function persist(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export function useSavedRecipes() {
  const [savedIds, setSavedIds] = useState<string[]>(() => loadSaved());

  const saveRecipe = useCallback((id: string) => {
    setSavedIds(prev => {
      if (prev.includes(id)) return prev;
      const next = [id, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const unsaveRecipe = useCallback((id: string) => {
    setSavedIds(prev => {
      const next = prev.filter(i => i !== id);
      persist(next);
      return next;
    });
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSavedIds(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [id, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  return { savedIds, saveRecipe, unsaveRecipe, toggleSave, isSaved };
}
