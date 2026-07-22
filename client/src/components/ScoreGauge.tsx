/**
 * EatVera ScoreGauge Component
 * Design: Bold Brutalist Health — score is the hero, displayed dramatically
 */
import { useEffect, useState } from "react";

interface ScoreGaugeProps {
  score: number;
  grade: string;
  label: string;
  color: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export default function ScoreGauge({
  score,
  grade,
  label,
  color,
  size = "lg",
  animate = true,
}: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const [progress, setProgress] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) return;
    const duration = 1200;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(eased * score);
      setDisplayScore(current);
      setProgress(current);
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [score, animate]);

  const radius = size === "lg" ? 54 : size === "md" ? 40 : 28;
  const strokeWidth = size === "lg" ? 8 : size === "md" ? 6 : 4;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  const svgSize = (radius + strokeWidth) * 2 + 4;
  const center = svgSize / 2;

  const textSize = size === "lg" ? "text-5xl" : size === "md" ? "text-3xl" : "text-xl";
  const gradeSize = size === "lg" ? "text-lg" : size === "md" ? "text-sm" : "text-xs";
  const labelSize = size === "lg" ? "text-xs" : "text-[10px]";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          className="rotate-[-90deg]"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: animate ? "none" : "stroke-dashoffset 0.3s ease",
              filter: `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
        </svg>

        {/* Score text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono-data font-semibold leading-none ${textSize}`}
            style={{ color }}
          >
            {displayScore}
          </span>
          <span
            className={`font-mono-data font-medium leading-none mt-0.5 ${gradeSize}`}
            style={{ color: `${color}cc` }}
          >
            /{100}
          </span>
        </div>
      </div>

      {/* Grade badge */}
      <div
        className={`px-3 py-0.5 rounded font-semibold tracking-widest uppercase ${gradeSize}`}
        style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
      >
        {grade} — {label}
      </div>
    </div>
  );
}
