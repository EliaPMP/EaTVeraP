/**
 * EatVera GlobalBackground
 * Dark forest green in dark mode, warm off-white in light mode
 */
import { useTheme } from "@/contexts/ThemeContext";

export default function GlobalBackground() {
  const { theme } = useTheme();
  return (
    <div
      className="fixed inset-0 -z-10 transition-colors duration-300"
      style={{
        background: theme === "dark"
          ? "linear-gradient(135deg, #1f4d2f 0%, #2d5f3f 50%, #1a3d28 100%)"
          : "linear-gradient(135deg, #fafaf8 0%, #f5f5f0 100%)",
      }}
    />
  );
}
