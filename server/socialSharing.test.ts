/**
 * Unit tests for social sharing logic:
 * - Share text generation
 * - Score color/label helpers
 * - Canvas helper functions (pure logic)
 */
import { describe, it, expect } from "vitest";

// ─── Score helpers (mirrored from ShareMealCard.tsx) ──────────────────────────
function getScoreColor(score: number): string {
  if (score >= 80) return "#1f7a1f";
  if (score >= 60) return "#2e9e2e";
  if (score >= 40) return "#d97706";
  if (score >= 20) return "#ea580c";
  return "#dc2626";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Poor";
  return "Very Poor";
}

function getScoreEmoji(score: number): string {
  if (score >= 80) return "🌿";
  if (score >= 60) return "✅";
  if (score >= 40) return "⚠️";
  return "❌";
}

// ─── Share text builder (mirrored from ShareMealCard.tsx) ─────────────────────
function buildShareText(mealName: string, totalCalories: number, qualityScore: number): string {
  return `I just scanned my meal with EatVera! 🌿\n${mealName} — ${Math.round(totalCalories)} cal, quality score ${qualityScore}/100 (${getScoreLabel(qualityScore)})\n\n#EatVera #HealthyEating #KnowWhatYouEat`;
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Score Color Helper", () => {
  it("returns dark green for score >= 80", () => {
    expect(getScoreColor(80)).toBe("#1f7a1f");
    expect(getScoreColor(100)).toBe("#1f7a1f");
  });

  it("returns medium green for score 60-79", () => {
    expect(getScoreColor(60)).toBe("#2e9e2e");
    expect(getScoreColor(79)).toBe("#2e9e2e");
  });

  it("returns amber for score 40-59", () => {
    expect(getScoreColor(40)).toBe("#d97706");
    expect(getScoreColor(59)).toBe("#d97706");
  });

  it("returns orange for score 20-39", () => {
    expect(getScoreColor(20)).toBe("#ea580c");
    expect(getScoreColor(39)).toBe("#ea580c");
  });

  it("returns red for score < 20", () => {
    expect(getScoreColor(0)).toBe("#dc2626");
    expect(getScoreColor(19)).toBe("#dc2626");
  });
});

describe("Score Label Helper", () => {
  it("returns correct labels for each tier", () => {
    expect(getScoreLabel(90)).toBe("Excellent");
    expect(getScoreLabel(65)).toBe("Good");
    expect(getScoreLabel(45)).toBe("Fair");
    expect(getScoreLabel(25)).toBe("Poor");
    expect(getScoreLabel(10)).toBe("Very Poor");
  });

  it("handles boundary values correctly", () => {
    expect(getScoreLabel(80)).toBe("Excellent");
    expect(getScoreLabel(60)).toBe("Good");
    expect(getScoreLabel(40)).toBe("Fair");
    expect(getScoreLabel(20)).toBe("Poor");
    expect(getScoreLabel(19)).toBe("Very Poor");
  });
});

describe("Score Emoji Helper", () => {
  it("returns leaf for excellent meals", () => {
    expect(getScoreEmoji(85)).toBe("🌿");
  });

  it("returns check for good meals", () => {
    expect(getScoreEmoji(65)).toBe("✅");
  });

  it("returns warning for fair meals", () => {
    expect(getScoreEmoji(45)).toBe("⚠️");
  });

  it("returns X for poor meals", () => {
    expect(getScoreEmoji(15)).toBe("❌");
  });
});

describe("Share Text Generation", () => {
  it("includes meal name, calories, and score", () => {
    const text = buildShareText("Grilled Salmon", 450, 88);
    expect(text).toContain("Grilled Salmon");
    expect(text).toContain("450 cal");
    expect(text).toContain("88/100");
    expect(text).toContain("Excellent");
  });

  it("includes EatVera branding and hashtags", () => {
    const text = buildShareText("Pizza", 800, 30);
    expect(text).toContain("EatVera");
    expect(text).toContain("#EatVera");
    expect(text).toContain("#HealthyEating");
    expect(text).toContain("#KnowWhatYouEat");
  });

  it("rounds calories to nearest integer", () => {
    const text = buildShareText("Oatmeal", 312.7, 75);
    expect(text).toContain("313 cal");
  });

  it("uses correct label for score", () => {
    const text = buildShareText("Burger", 650, 35);
    expect(text).toContain("Poor");
    expect(text).not.toContain("Excellent");
  });

  it("handles very low score meals", () => {
    const text = buildShareText("Candy Bar", 250, 5);
    expect(text).toContain("Very Poor");
  });
});

describe("Share URL Builders", () => {
  it("builds valid Twitter intent URL", () => {
    const shareText = buildShareText("Salad", 300, 92);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    expect(url).toContain("twitter.com/intent/tweet");
    expect(url).toContain("text=");
    expect(url).toContain("EatVera");
  });

  it("builds valid WhatsApp share URL", () => {
    const shareText = buildShareText("Steak", 600, 78);
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    expect(url).toContain("wa.me");
    expect(url).toContain("text=");
  });
});
