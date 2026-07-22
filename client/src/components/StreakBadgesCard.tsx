/**
 * StreakBadgesCard — displays current streak, longest streak,
 * and achievement badges grid on the History page.
 */
import { useState } from "react";
import { Flame, Trophy, Calendar, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { useStreakBadges, type Badge } from "@/hooks/useStreakBadges";

const TIER_COLORS: Record<Badge["tier"], { bg: string; border: string; text: string }> = {
  bronze: { bg: "#fef3c7", border: "#fcd34d", text: "#92400e" },
  silver: { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" },
  gold: { bg: "#fefce8", border: "#fde047", text: "#713f12" },
  platinum: { bg: "#f0f9ff", border: "#7dd3fc", text: "#0c4a6e" },
};

function BadgeTile({ badge }: { badge: Badge }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tier = TIER_COLORS[badge.tier];

  return (
    <div className="relative">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className="w-full flex flex-col items-center gap-1 p-2 rounded-2xl transition-all"
        style={{
          background: badge.unlocked ? tier.bg : "#f5f5f4",
          border: `1.5px solid ${badge.unlocked ? tier.border : "#e7e5e4"}`,
          opacity: badge.unlocked ? 1 : 0.55,
        }}
      >
        <div className="text-2xl leading-none" style={{ filter: badge.unlocked ? "none" : "grayscale(1)" }}>
          {badge.unlocked ? badge.emoji : <Lock size={18} className="text-stone-300 mt-1" />}
        </div>
        <span
          className="text-[9px] font-bold text-center leading-tight line-clamp-2"
          style={{ color: badge.unlocked ? tier.text : "#a8a29e" }}
        >
          {badge.name}
        </span>
      </button>

      {showTooltip && (
        <div
          className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 rounded-xl p-2.5 shadow-lg text-center"
          style={{ background: "white", border: "1px solid #e7e5e4" }}
        >
          <div className="text-2xl mb-1">{badge.emoji}</div>
          <p className="text-xs font-bold text-stone-700 mb-0.5">{badge.name}</p>
          <p className="text-[10px] text-stone-500 leading-snug">{badge.description}</p>
          {badge.unlocked && badge.unlockedAt && (
            <p className="text-[9px] text-stone-300 mt-1">
              {new Date(badge.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          )}
          {!badge.unlocked && (
            <p className="text-[9px] text-stone-400 mt-1 font-medium">🔒 Not yet unlocked</p>
          )}
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-1 right-1.5 text-stone-300 text-xs"
          >✕</button>
        </div>
      )}
    </div>
  );
}

export default function StreakBadgesCard() {
  const { streakInfo, badges, unlockedCount } = useStreakBadges();
  const [showAll, setShowAll] = useState(false);

  const displayBadges = showAll ? badges : badges.slice(0, 8);

  return (
    <div className="px-4 mb-4">
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-stone-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "#fff7ed" }}>
                <Trophy size={14} style={{ color: "#f97316" }} />
              </div>
              <span className="font-bold text-stone-800 text-sm">Streaks & Badges</span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
              {unlockedCount}/{badges.length} unlocked
            </span>
          </div>
        </div>

        {/* Streak stats */}
        <div className="grid grid-cols-3 divide-x divide-stone-50 border-b border-stone-50">
          <div className="px-3 py-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Flame size={14} className={streakInfo.currentStreak > 0 ? "text-orange-500" : "text-stone-300"} />
              <span
                className="text-lg font-bold"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  color: streakInfo.currentStreak > 0 ? "#f97316" : "#a8a29e",
                }}
              >
                {streakInfo.currentStreak}
              </span>
            </div>
            <div className="text-[10px] text-stone-400">Current Streak</div>
            {streakInfo.loggedToday && (
              <div className="text-[9px] text-[#0B3D2E] font-semibold mt-0.5">✓ Logged today</div>
            )}
          </div>
          <div className="px-3 py-3 text-center">
            <div className="text-lg font-bold text-stone-700" style={{ fontFamily: "'DM Mono', monospace" }}>
              {streakInfo.longestStreak}
            </div>
            <div className="text-[10px] text-stone-400">Best Streak</div>
          </div>
          <div className="px-3 py-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Calendar size={12} className="text-stone-400" />
              <span className="text-lg font-bold text-stone-700" style={{ fontFamily: "'DM Mono', monospace" }}>
                {streakInfo.totalDaysLogged}
              </span>
            </div>
            <div className="text-[10px] text-stone-400">Days Logged</div>
          </div>
        </div>

        {/* Streak flame bar */}
        {streakInfo.currentStreak > 0 && (
          <div className="px-4 py-2 border-b border-stone-50">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {Array.from({ length: Math.min(streakInfo.currentStreak, 14) }, (_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: `hsl(${30 + i * 3}, 90%, ${60 - i * 1.5}%)` }}
                >
                  🔥
                </div>
              ))}
              {streakInfo.currentStreak > 14 && (
                <span className="text-[10px] text-stone-400 ml-1 flex-shrink-0">
                  +{streakInfo.currentStreak - 14} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Badges grid */}
        <div className="px-4 pt-3 pb-4">
          <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-3">Achievements</p>
          <div className="grid grid-cols-4 gap-2">
            {displayBadges.map(badge => (
              <BadgeTile key={badge.id} badge={badge} />
            ))}
          </div>

          {badges.length > 8 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 py-2 rounded-xl text-xs font-semibold text-stone-500 bg-stone-50 flex items-center justify-center gap-1 hover:bg-stone-100 transition-colors"
            >
              {showAll ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show all {badges.length} badges</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
