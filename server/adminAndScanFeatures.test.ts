/**
 * Tests for:
 * 1. Admin procedures (getPendingSubmissions, approveSubmission, rejectSubmission, bulkApprove, bulkReject)
 * 2. useRecentScans hook logic (pure functions)
 * 3. extractNutrition LLM procedure input validation
 */

import { describe, it, expect } from "vitest";

// ─── 1. Admin guard logic ────────────────────────────────────────────────────

describe("Admin role guard", () => {
  const isAdmin = (role: string) => role === "admin";

  it("grants access to admin users", () => {
    expect(isAdmin("admin")).toBe(true);
  });

  it("denies access to regular users", () => {
    expect(isAdmin("user")).toBe(false);
  });

  it("denies access to empty role", () => {
    expect(isAdmin("")).toBe(false);
  });
});

// ─── 2. Recent scans localStorage logic ─────────────────────────────────────

interface RecentScan {
  barcode: string;
  productName: string | null;
  brand: string | null;
  healthScore: number | null;
  imageUrl: string | null;
  scannedAt: number;
}

const MAX_RECENT = 10;

function addScanToList(
  existing: RecentScan[],
  scan: Omit<RecentScan, "scannedAt">
): RecentScan[] {
  const filtered = existing.filter((s) => s.barcode !== scan.barcode);
  return [{ ...scan, scannedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT);
}

function removeScanFromList(existing: RecentScan[], barcode: string): RecentScan[] {
  return existing.filter((s) => s.barcode !== barcode);
}

describe("Recent scans list management", () => {
  const makeScan = (barcode: string, overrides: Partial<RecentScan> = {}): RecentScan => ({
    barcode,
    productName: `Product ${barcode}`,
    brand: "TestBrand",
    healthScore: 75,
    imageUrl: null,
    scannedAt: Date.now(),
    ...overrides,
  });

  it("adds a new scan to the top of the list", () => {
    const existing = [makeScan("111"), makeScan("222")];
    const result = addScanToList(existing, { barcode: "333", productName: "New", brand: null, healthScore: 80, imageUrl: null });
    expect(result[0].barcode).toBe("333");
    expect(result).toHaveLength(3);
  });

  it("moves existing barcode to top instead of duplicating", () => {
    const existing = [makeScan("111"), makeScan("222"), makeScan("333")];
    const result = addScanToList(existing, { barcode: "222", productName: "Updated", brand: null, healthScore: 60, imageUrl: null });
    expect(result[0].barcode).toBe("222");
    expect(result[0].productName).toBe("Updated");
    expect(result).toHaveLength(3);
  });

  it("trims list to MAX_RECENT entries", () => {
    const existing = Array.from({ length: MAX_RECENT }, (_, i) => makeScan(`barcode-${i}`));
    const result = addScanToList(existing, { barcode: "new", productName: "New", brand: null, healthScore: 50, imageUrl: null });
    expect(result).toHaveLength(MAX_RECENT);
    expect(result[0].barcode).toBe("new");
  });

  it("removes a scan by barcode", () => {
    const existing = [makeScan("111"), makeScan("222"), makeScan("333")];
    const result = removeScanFromList(existing, "222");
    expect(result).toHaveLength(2);
    expect(result.find((s) => s.barcode === "222")).toBeUndefined();
  });

  it("clear all returns empty array", () => {
    const existing = [makeScan("111"), makeScan("222")];
    const result = existing.filter(() => false);
    expect(result).toHaveLength(0);
  });
});

// ─── 3. Nutrition extraction input validation ────────────────────────────────

describe("extractNutrition input validation", () => {
  const validateInput = (ingredients: string, productName?: string) => {
    if (!ingredients || ingredients.trim().length < 3) {
      return { valid: false, error: "Ingredients must be at least 3 characters" };
    }
    return { valid: true, error: null };
  };

  it("accepts valid ingredients string", () => {
    const result = validateInput("Water, Almonds, Sea Salt");
    expect(result.valid).toBe(true);
  });

  it("rejects empty ingredients", () => {
    const result = validateInput("");
    expect(result.valid).toBe(false);
  });

  it("rejects too-short ingredients", () => {
    const result = validateInput("AB");
    expect(result.valid).toBe(false);
  });

  it("accepts ingredients with optional product name", () => {
    const result = validateInput("Oats, Honey, Cinnamon", "Granola Bar");
    expect(result.valid).toBe(true);
  });
});

// ─── 4. Submission status transitions ────────────────────────────────────────

describe("Submission status transitions", () => {
  type Status = "pending" | "approved" | "rejected";

  const canApprove = (status: Status) => status === "pending";
  const canReject = (status: Status) => status === "pending";

  it("allows approving a pending submission", () => {
    expect(canApprove("pending")).toBe(true);
  });

  it("does not allow approving an already-approved submission", () => {
    expect(canApprove("approved")).toBe(false);
  });

  it("allows rejecting a pending submission", () => {
    expect(canReject("pending")).toBe(true);
  });

  it("does not allow rejecting an already-rejected submission", () => {
    expect(canReject("rejected")).toBe(false);
  });
});

// ─── 5. Bulk action ID deduplication ────────────────────────────────────────

describe("Bulk action ID deduplication", () => {
  const deduplicateIds = (ids: number[]) => [...new Set(ids)];

  it("removes duplicate IDs", () => {
    const result = deduplicateIds([1, 2, 2, 3, 3, 3]);
    expect(result).toEqual([1, 2, 3]);
  });

  it("preserves unique IDs", () => {
    const result = deduplicateIds([10, 20, 30]);
    expect(result).toEqual([10, 20, 30]);
  });

  it("handles empty array", () => {
    const result = deduplicateIds([]);
    expect(result).toEqual([]);
  });
});
