/**
 * BackHeader — reusable page header with back arrow.
 * Drop this at the top of any page that needs a back navigation button.
 * Supports an optional right-side slot for actions (e.g. share, edit buttons).
 */
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { hapticLight } from "@/lib/haptic";

interface BackHeaderProps {
  /** Page title shown in the center */
  title: string;
  /** Optional subtitle shown below the title */
  subtitle?: string;
  /** Override the back destination (default: window.history.back()) */
  backTo?: string;
  /** Optional right-side slot for action buttons */
  right?: React.ReactNode;
  /** Background style — "transparent" (default) or "solid" */
  variant?: "transparent" | "solid";
}

export function BackHeader({
  title,
  subtitle,
  backTo,
  right,
  variant = "transparent",
}: BackHeaderProps) {
  const [, navigate] = useLocation();

  const handleBack = () => {
    hapticLight();
    if (backTo) {
      navigate(backTo);
    } else {
      window.history.back();
    }
  };

  const isSolid = variant === "solid";

  return (
    <div
      className="flex items-center gap-3 px-4 pt-14 pb-4"
      style={
        isSolid
          ? { background: "rgba(10,34,24,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }
          : {}
      }
    >
      {/* Back button */}
      <button
        onClick={handleBack}
        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        aria-label="Go back"
      >
        <ArrowLeft size={18} className="text-white" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1
          className="font-bold text-white text-lg leading-tight truncate"
          style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/40 text-xs mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {/* Right slot */}
      {right ? (
        <div className="flex-shrink-0">{right}</div>
      ) : (
        <div className="w-10" /> // spacer to keep title centered
      )}
    </div>
  );
}
