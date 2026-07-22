/**
 * SplashScreen — Branded first-load screen
 * Shows a full-screen dark forest green splash with the leaf logo and EatVera wordmark.
 * Auto-dismisses after 1.5s. Uses sessionStorage so it only shows once per browser session.
 */
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";

const SPLASH_KEY = "ec_splash_shown";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"visible" | "fading">("visible");

  useEffect(() => {
    // Start fade-out after 1.4s, call onDone after fade completes (300ms)
    const fadeTimer = setTimeout(() => setPhase("fading"), 1400);
    const doneTimer = setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "1");
      onDone();
    }, 1700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(160deg, #0B3D2E 0%, #145A3A 55%, #0d4a32 100%)",
        opacity: phase === "fading" ? 0 : 1,
        transition: "opacity 0.3s ease-out",
      }}
    >
      {/* Decorative background circles */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
        style={{ background: "white", transform: "translate(40%, -40%)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
        style={{ background: "white", transform: "translate(-30%, 30%)" }}
      />

      {/* Logo mark */}
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          border: "1.5px solid rgba(255,255,255,0.25)",
          animation: "splashPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
      >
        <Leaf size={36} className="text-white" />
      </div>

      {/* Wordmark */}
      <h1
        className="text-white font-bold text-4xl tracking-tight mb-2"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          letterSpacing: "-0.02em",
          animation: "splashFadeUp 0.5s 0.15s ease-out both",
        }}
      >
        EatVera
      </h1>

      {/* Tagline */}
      <p
        className="text-green-200 text-sm font-medium tracking-wide"
        style={{ animation: "splashFadeUp 0.5s 0.3s ease-out both" }}
      >
        Know what you eat
      </p>

      {/* Bottom loading bar */}
      <div
        className="absolute bottom-16 w-16 h-0.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.2)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "rgba(255,255,255,0.7)",
            animation: "splashBar 1.4s linear forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes splashPop {
          from { transform: scale(0.7); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes splashFadeUp {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes splashBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}

/** Returns true if the splash screen should be shown this session */
export function shouldShowSplash(): boolean {
  return !sessionStorage.getItem(SPLASH_KEY);
}
