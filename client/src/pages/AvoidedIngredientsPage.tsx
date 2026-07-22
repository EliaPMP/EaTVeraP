/**
 * AvoidedIngredientsPage — Manage personal ingredient avoidance list
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ShieldAlert, Plus, Trash2, ArrowLeft, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const COMMON_AVOIDANCES = [
  "High Fructose Corn Syrup", "Canola Oil", "Soybean Oil", "Corn Oil",
  "Sunflower Oil", "MSG", "Aspartame", "Sucralose", "Red 40", "Yellow 5",
  "Yellow 6", "Blue 1", "Carrageenan", "BHA", "BHT", "TBHQ",
  "Sodium Nitrate", "Sodium Nitrite", "Partially Hydrogenated Oil",
  "Titanium Dioxide", "Potassium Bromate", "Brominated Vegetable Oil",
];

export default function AvoidedIngredientsPage() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [newIngredient, setNewIngredient] = useState("");
  const [newReason, setNewReason] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const bgStyle = isDark ? "#0f1a14" : "#fafaf8";
  const cardStyle = isDark ? "#1a2e1f" : "#ffffff";
  const borderStyle = isDark ? "#2a3d2f" : "#f0ede8";
  const textPrimary = isDark ? "#f0f7f4" : "#1c1917";
  const textSecondary = isDark ? "#9ca3af" : "#78716c";

  const { data: avoided = [], isLoading, refetch } = trpc.userFeatures.getAvoidedIngredients.useQuery(
    undefined,
    { enabled: !!user }
  );

  const addMutation = trpc.userFeatures.addAvoidedIngredient.useMutation({
    onSuccess: () => {
      setNewIngredient("");
      setNewReason("");
      setShowAddForm(false);
      refetch();
    },
    onError: (err) => {
      if (err.message.includes("10001") || err.message.toLowerCase().includes("login")) {
        toast.error("Sign in to save avoided ingredients across devices.");
      } else {
        toast.error("Failed to add ingredient. Please try again.");
      }
    },
  });

  const removeMutation = trpc.userFeatures.removeAvoidedIngredient.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => {
      if (err.message.includes("10001") || err.message.toLowerCase().includes("login")) {
        toast.error("Sign in to manage your avoided ingredients.");
      } else {
        toast.error("Failed to remove ingredient.");
      }
    },
  });

  const handleAdd = () => {
    if (!newIngredient.trim()) return;
    addMutation.mutate({ ingredient: newIngredient.trim(), reason: newReason.trim() || undefined });
  };

  const handleQuickAdd = (ingredient: string) => {
    if (avoided.some(a => a.ingredient.toLowerCase() === ingredient.toLowerCase())) return;
    addMutation.mutate({ ingredient });
  };

  if (loading) {
    return (
      <div className="ec-page-bg min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0B3D2E] border-t-transparent animate-spin" />
      </div>
    );
  }

  // No sign-in required — all users can access avoided ingredients

  return (
    <div className="ec-page-bg min-h-screen pb-24" style={{ background: bgStyle }}>
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ background: "linear-gradient(135deg, #0B3D2E 0%, #145A3A 100%)" }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/scan")} className="p-2 rounded-xl text-white/80 hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-white text-base flex-1">Avoided Ingredients</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="p-2 rounded-xl text-white/80 hover:bg-white/10 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Info banner */}
        <div className="rounded-2xl p-4 border" style={{ background: isDark ? "#1a2e1f" : "#f0faf0", borderColor: isDark ? "#2a4a30" : "#b8e8b8" }}>
          <p className="text-xs leading-relaxed" style={{ color: textSecondary }}>
            Ingredients on this list will be <strong style={{ color: textPrimary }}>highlighted in red</strong> on every product you scan. This helps you quickly spot products that contain ingredients you want to avoid.
          </p>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="rounded-2xl p-4 border" style={{ background: cardStyle, borderColor: borderStyle }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm" style={{ color: textPrimary }}>Add Ingredient</span>
              <button onClick={() => setShowAddForm(false)} style={{ color: textSecondary }}>
                <X size={16} />
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. High Fructose Corn Syrup"
              value={newIngredient}
              onChange={e => setNewIngredient(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm mb-2 outline-none border"
              style={{ background: isDark ? "#0f1a14" : "#f9f8f6", borderColor: borderStyle, color: textPrimary }}
            />
            <input
              type="text"
              placeholder="Reason (optional)"
              value={newReason}
              onChange={e => setNewReason(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm mb-3 outline-none border"
              style={{ background: isDark ? "#0f1a14" : "#f9f8f6", borderColor: borderStyle, color: textPrimary }}
            />
            <button
              onClick={handleAdd}
              disabled={!newIngredient.trim() || addMutation.isPending}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-50"
              style={{ background: "#0B3D2E" }}
            >
              {addMutation.isPending ? "Adding..." : "Add to List"}
            </button>
          </div>
        )}

        {/* Current list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-[#0B3D2E] border-t-transparent animate-spin" />
          </div>
        ) : avoided.length > 0 ? (
          <div>
            <p className="ec-section-label mb-2">Your List ({avoided.length})</p>
            <div className="space-y-2">
              {avoided.map(item => (
                <div
                  key={item.id}
                  className="rounded-2xl p-3.5 flex items-center gap-3 border"
                  style={{ background: cardStyle, borderColor: borderStyle }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#fee2e2" }}>
                    <ShieldAlert size={14} style={{ color: "#dc2626" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm capitalize" style={{ color: textPrimary }}>{item.ingredient}</p>
                    {item.reason && <p className="text-xs truncate" style={{ color: textSecondary }}>{item.reason}</p>}
                  </div>
                  <button
                    onClick={() => removeMutation.mutate({ id: item.id })}
                    className="p-2 rounded-xl transition-colors flex-shrink-0"
                    style={{ color: textSecondary }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: textSecondary }}>No avoided ingredients yet. Add some below or use the quick-add list.</p>
          </div>
        )}

        {/* Quick-add common avoidances */}
        <div>
          <p className="ec-section-label mb-2">Quick Add — Common Avoidances</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_AVOIDANCES.map(ingredient => {
              const isAdded = avoided.some(a => a.ingredient.toLowerCase() === ingredient.toLowerCase());
              return (
                <button
                  key={ingredient}
                  onClick={() => !isAdded && handleQuickAdd(ingredient)}
                  className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
                  style={{
                    background: isAdded ? (isDark ? "#1a2e1f" : "#f0faf0") : (isDark ? "#1a2e1f" : "#ffffff"),
                    borderColor: isAdded ? "#0B3D2E" : borderStyle,
                    color: isAdded ? "#0B3D2E" : textSecondary,
                    opacity: isAdded ? 0.7 : 1,
                  }}
                >
                  {isAdded ? "✓ " : "+ "}{ingredient}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
