/**
 * FavoritesPage — Server-backed saved products list
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Heart, Trash2, ArrowLeft, Package, Search } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const size = 44;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-stone-200 dark:text-stone-700" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute font-bold text-xs font-mono-data" style={{ color }}>{score}</span>
    </div>
  );
}

function gradeColor(grade: string): string {
  if (grade === "A+" || grade === "A") return "#145A3A";
  if (grade === "B") return "#3FA34D";
  if (grade === "C") return "#d97706";
  if (grade === "D") return "#ea580c";
  return "#dc2626";
}

export default function FavoritesPage() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [search, setSearch] = useState("");

  const { data: favorites = [], isLoading, refetch } = trpc.userFeatures.getFavorites.useQuery(
    undefined,
    { enabled: !!user }
  );
  const removeMutation = trpc.userFeatures.removeFavorite.useMutation({
    onSuccess: () => refetch(),
  });

  const filtered = favorites.filter(f =>
    f.productName.toLowerCase().includes(search.toLowerCase()) ||
    (f.brand || "").toLowerCase().includes(search.toLowerCase())
  );

  const bgStyle = isDark ? "#0f1a14" : "#fafaf8";
  const cardStyle = isDark ? "#1a2e1f" : "#ffffff";
  const borderStyle = isDark ? "#2a3d2f" : "#f0ede8";
  const textPrimary = isDark ? "#f0f7f4" : "#1c1917";
  const textSecondary = isDark ? "#9ca3af" : "#78716c";

  if (loading) {
    return (
      <div className="ec-page-bg min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0B3D2E] border-t-transparent animate-spin" />
      </div>
    );
  }

  // No sign-in required — all users can access favorites

  return (
    <div className="ec-page-bg min-h-screen pb-24" style={{ background: bgStyle }}>
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ background: "linear-gradient(135deg, #0B3D2E 0%, #145A3A 100%)" }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/scan")} className="p-2 rounded-xl text-white/80 hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-white text-base flex-1">Favorites</h1>
          <span className="text-green-200 text-xs font-mono-data">{favorites.length} saved</span>
        </div>
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.12)" }}>
            <Search size={14} className="text-white/60 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search favorites..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[#0B3D2E] border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: isDark ? "#1a2e1f" : "#f0faf0" }}>
            <Heart size={28} style={{ color: "#0B3D2E" }} />
          </div>
          <h2 className="font-bold text-lg mb-2" style={{ color: textPrimary }}>
            {search ? "No matches found" : "No favorites yet"}
          </h2>
          <p className="text-sm" style={{ color: textSecondary }}>
            {search ? "Try a different search term." : "Tap the heart icon on any product page to save it here."}
          </p>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-2.5">
          {filtered.map(fav => {
            const color = gradeColor(fav.grade);
            return (
              <div
                key={fav.id}
                className="rounded-2xl p-3.5 flex items-center gap-3 border"
                style={{ background: cardStyle, borderColor: borderStyle }}
              >
                {/* Image / icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: isDark ? "#1e3020" : "#f5f5f4" }}>
                  {fav.imageUrl ? (
                    <img src={fav.imageUrl} alt={fav.productName} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Package size={20} style={{ color: textSecondary }} />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: textPrimary }}>{fav.productName}</p>
                  <p className="text-xs truncate" style={{ color: textSecondary }}>{fav.brand || "Unknown brand"}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: textSecondary }}>
                    Saved {new Date(fav.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                {/* Score */}
                <ScoreCircle score={fav.healthScore} color={color} />
                {/* Remove */}
                <button
                  onClick={() => removeMutation.mutate({ id: fav.id })}
                  className="p-2 rounded-xl transition-colors flex-shrink-0"
                  style={{ color: textSecondary }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
