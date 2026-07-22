/**
 * EatVera IngredientFlag Component
 * Design: Bold Brutalist Health — ingredient flags are stark and direct
 */
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import type { IngredientFlag as IFlag } from "@/lib/ingredientAnalysis";

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    color: "#FF3B3B",
    bg: "rgba(255, 59, 59, 0.08)",
    border: "#FF3B3B",
    label: "CRITICAL",
  },
  warning: {
    icon: AlertCircle,
    color: "#FF6B35",
    bg: "rgba(255, 107, 53, 0.08)",
    border: "#FF6B35",
    label: "WARNING",
  },
  caution: {
    icon: Info,
    color: "#F4A825",
    bg: "rgba(244, 168, 37, 0.08)",
    border: "#F4A825",
    label: "CAUTION",
  },
  good: {
    icon: CheckCircle,
    color: "#7BC67E",
    bg: "rgba(123, 198, 126, 0.08)",
    border: "#7BC67E",
    label: "GOOD",
  },
  excellent: {
    icon: CheckCircle,
    color: "#A8FF3E",
    bg: "rgba(168, 255, 62, 0.08)",
    border: "#A8FF3E",
    label: "EXCELLENT",
  },
};

interface IngredientFlagProps {
  flag: IFlag;
  index?: number;
}

export default function IngredientFlagCard({ flag, index = 0 }: IngredientFlagProps) {
  const config = SEVERITY_CONFIG[flag.severity];
  const Icon = config.icon;
  const delay = Math.min(index * 0.08, 0.5);

  return (
    <div
      className="rounded p-3 slide-up opacity-0"
      style={{
        backgroundColor: config.bg,
        borderLeft: `3px solid ${config.border}`,
        animationDelay: `${delay}s`,
        animationFillMode: "forwards",
      }}
    >
      <div className="flex items-start gap-3">
        <Icon size={16} style={{ color: config.color, flexShrink: 0, marginTop: 2 }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono-data text-xs font-medium text-white/90 truncate">
              {flag.name}
            </span>
            <span
              className="font-mono-data text-[10px] font-semibold tracking-widest px-1.5 py-0.5 rounded-sm"
              style={{
                color: config.color,
                backgroundColor: `${config.border}20`,
              }}
            >
              {config.label}
            </span>
            <span
              className="font-mono-data text-[10px] text-white/40 tracking-wider"
            >
              {flag.category}
            </span>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">{flag.reason}</p>
        </div>
      </div>
    </div>
  );
}
