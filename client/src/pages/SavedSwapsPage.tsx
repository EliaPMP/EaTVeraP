/**
 * SavedSwapsPage — view and manage bookmarked healthier alternatives.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Bookmark, Trash2, ChevronRight, Sparkles } from "lucide-react";
import { useSavedSwaps } from "@/hooks/useSavedSwaps";
import { useTheme } from "@/contexts/ThemeContext";

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function scoreColor(s: number) {
  if (s >= 80) return "#145A3A";
  if (s >= 65) return "#3FA34D";
  if (s >= 45) return "#d97706";
  return "#dc2626";
}
function scoreBg(s: number) {
  if (s >= 80) return "#e8f9ee";
  if (s >= 65) return "#f0faf2";
  if (s >= 45) return "#fffbf0";
  return "#fff5f5";
}

export default function SavedSwapsPage() {
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const { swaps, remove, clearAll } = useSavedSwaps();
  const [confirmClear, setConfirmClear] = useState(false);

  const isDark = theme === "dark";
  const bg = isDark ? "#0f1a14" : "#f7faf8";
  const cardBg = isDark ? "#1a2b22" : "white";
  const cardBorder = isDark ? "#2d4a38" : "#e8f4ec";
  const textPrimary = isDark ? "#e8f4ec" : "#1a1a1a";
  const textMuted = isDark ? "#7aad8a" : "#6b7280";

  return (
    <div className="min-h-screen pb-24" style={{ background: bg }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: "linear-gradient(135deg, #071f17 0%, #0f4a37 100%)",
          boxShadow: "0 2px 16px rgba(11,61,46,0.3)",
        }}
      >
        {/* Shimmer accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }}
        />
        <div className="flex items-center gap-3 px-4 pt-12 pb-4">
          <button
            onClick={() => navigate(-1 as unknown as string)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex-1">
            <p
              className="text-lg font-bold text-white leading-none"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Saved Swaps
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              {swaps.length} {swaps.length === 1 ? "alternative" : "alternatives"} bookmarked
            </p>
          </div>
          {swaps.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all active:scale-95"
              style={{ background: "rgba(220,38,38,0.2)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.3)" }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {swaps.length === 0 && (
        <div className="flex flex-col items-center justify-center px-8 pt-20 text-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
            style={{ background: "linear-gradient(135deg, #0B3D2E, #1A7048)", boxShadow: "0 8px 24px rgba(11,61,46,0.25)" }}
          >
            <Bookmark size={32} className="text-white" />
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: textPrimary, fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            No saved swaps yet
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: textMuted }}>
            When you scan a product and see healthier alternatives, tap the{" "}
            <strong>Save</strong> button on any card to bookmark it here.
          </p>
          <button
            onClick={() => navigate("/scan")}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #0B3D2E, #1A7048)", boxShadow: "0 4px 16px rgba(11,61,46,0.3)" }}
          >
            <Sparkles size={16} />
            Scan a product
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Swap cards */}
      {swaps.length > 0 && (
        <div className="px-4 pt-4 space-y-3">
          {swaps.map(({ alt, scannedProductName, scannedProductScore, savedAt }) => (
            <div
              key={alt.id}
              className="overflow-hidden"
              style={{
                borderRadius: 18,
                border: `1px solid ${cardBorder}`,
                background: cardBg,
                boxShadow: "0 2px 12px rgba(11,61,46,0.07)",
              }}
            >
              {/* Context banner */}
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ background: isDark ? "#0f2a1e" : "#f0faf4", borderBottom: `1px solid ${cardBorder}` }}
              >
                <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: "#4a7c5e" }}>
                  Better than
                </span>
                <span
                  className="text-[10px] font-bold truncate flex-1"
                  style={{ color: textPrimary }}
                >
                  {scannedProductName}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "#fee2e2", color: "#dc2626" }}
                >
                  {scannedProductScore}/100
                </span>
              </div>

              {/* Main card */}
              <div className="flex items-center gap-3 p-3">
                {/* Emoji */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: isDark ? "#1a3326" : "#f0faf2", border: `1px solid ${cardBorder}` }}
                >
                  {alt.emoji || (alt.type === "meat" ? "🥩" : alt.type === "fruit" ? "🍎" : "📦")}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight truncate" style={{ color: textPrimary }}>
                    {alt.name}
                  </p>
                  <p className="text-[10px]" style={{ color: textMuted }}>{alt.brand}</p>
                  <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "#145A3A" }}>
                    {alt.reason}
                  </p>
                  {alt.certifications && alt.certifications.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {alt.certifications.slice(0, 2).map((cert) => (
                        <span
                          key={cert}
                          className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "#e8f9ee", color: "#0B3D2E" }}
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[9px] mt-1" style={{ color: textMuted }}>
                    Saved {timeAgo(savedAt)}
                  </p>
                </div>

                {/* Score ring + remove */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{
                      background: scoreBg(alt.score),
                      border: `2px solid ${scoreColor(alt.score)}`,
                      boxShadow: `0 2px 8px ${scoreColor(alt.score)}30`,
                    }}
                  >
                    <span className="text-sm font-bold font-mono-data" style={{ color: scoreColor(alt.score) }}>
                      {alt.score}
                    </span>
                  </div>
                  <button
                    onClick={() => remove(alt.id)}
                    aria-label="Remove saved swap"
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{ background: "#fee2e2", border: "none", cursor: "pointer" }}
                  >
                    <Trash2 size={12} style={{ color: "#dc2626" }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm clear dialog */}
      {confirmClear && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setConfirmClear(false)}
        >
          <div
            className="w-full max-w-sm mx-4 mb-8 rounded-3xl p-6"
            style={{ background: cardBg, boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold mb-1" style={{ color: textPrimary, fontFamily: "'Playfair Display', Georgia, serif" }}>
              Clear all saved swaps?
            </h3>
            <p className="text-sm mb-5" style={{ color: textMuted }}>
              This will remove all {swaps.length} bookmarked alternatives. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: isDark ? "#2d4a38" : "#f0faf4", color: textPrimary, border: `1px solid ${cardBorder}` }}
              >
                Cancel
              </button>
              <button
                onClick={() => { clearAll(); setConfirmClear(false); }}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
                style={{ background: "#dc2626", boxShadow: "0 4px 12px rgba(220,38,38,0.3)" }}
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
