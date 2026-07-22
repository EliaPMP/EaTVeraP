import { describe, it, expect } from "vitest";
import { ALL_ICE_CREAM, ICE_CREAM_CATEGORIES, ICE_CREAM_QUALITY_TIER_CONFIG, getIceCreamColor } from "../client/src/lib/iceCreamDatabase";
import { ALL_CONDIMENTS } from "../client/src/lib/condimentsDatabase";

describe("Ice Cream Database", () => {
  it("should have at least 20 ice cream products", () => {
    expect(ALL_ICE_CREAM.length).toBeGreaterThanOrEqual(20);
  });

  it("should have unique IDs for all products", () => {
    const ids = ALL_ICE_CREAM.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have valid quality tiers for all products", () => {
    const validTiers = Object.keys(ICE_CREAM_QUALITY_TIER_CONFIG);
    ALL_ICE_CREAM.forEach((p) => {
      expect(validTiers).toContain(p.qualityTier);
    });
  });

  it("should have scores between 0 and 100", () => {
    ALL_ICE_CREAM.forEach((p) => {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(100);
    });
  });

  it("should have valid categories for all products", () => {
    const validCategories = ICE_CREAM_CATEGORIES.filter((c) => c.id !== "all").map((c) => c.id);
    ALL_ICE_CREAM.forEach((p) => {
      expect(validCategories).toContain(p.category);
    });
  });

  it("should have required fields for all products", () => {
    ALL_ICE_CREAM.forEach((p) => {
      expect(p.name).toBeTruthy();
      expect(p.brand).toBeTruthy();
      expect(p.buyTip).toBeTruthy();
      expect(p.benefits.length).toBeGreaterThan(0);
    });
  });

  it("should return correct colors for score ranges", () => {
    expect(getIceCreamColor(90)).toBe("#145A3A"); // elite
    expect(getIceCreamColor(70)).toBe("#3FA34D"); // good
    expect(getIceCreamColor(50)).toBe("#d97706"); // average
    expect(getIceCreamColor(30)).toBe("#ea580c"); // poor
    expect(getIceCreamColor(15)).toBe("#dc2626"); // avoid
  });

  it("should have products from multiple brands", () => {
    const brands = new Set(ALL_ICE_CREAM.map((p) => p.brand));
    expect(brands.size).toBeGreaterThanOrEqual(8);
  });

  it("should have products across multiple quality tiers", () => {
    const tiers = new Set(ALL_ICE_CREAM.map((p) => p.qualityTier));
    expect(tiers.size).toBeGreaterThanOrEqual(4);
  });

  it("should have grass-fed options available", () => {
    const grassFed = ALL_ICE_CREAM.filter((p) => p.grassFed);
    expect(grassFed.length).toBeGreaterThan(0);
  });

  it("should have organic options available", () => {
    const organic = ALL_ICE_CREAM.filter((p) => p.organic);
    expect(organic.length).toBeGreaterThan(0);
  });
});

describe("Primal Kitchen Products in Condiments Database", () => {
  const primalProducts = ALL_CONDIMENTS.filter((p) => p.brand === "Primal Kitchen");

  it("should have at least 10 Primal Kitchen products", () => {
    expect(primalProducts.length).toBeGreaterThanOrEqual(10);
  });

  it("should have no seed oils in any Primal Kitchen product", () => {
    primalProducts.forEach((p) => {
      expect(p.hasSeedOils).toBe(false);
    });
  });

  it("should have no HFCS in any Primal Kitchen product", () => {
    primalProducts.forEach((p) => {
      expect(p.hasHFCS).toBe(false);
    });
  });

  it("should have no artificial ingredients in any Primal Kitchen product", () => {
    primalProducts.forEach((p) => {
      expect(p.hasArtificialIngredients).toBe(false);
    });
  });

  it("should include various Primal Kitchen product types", () => {
    const categories = new Set(primalProducts.map((p) => p.category));
    expect(categories.size).toBeGreaterThanOrEqual(3);
  });

  it("should have Primal Kitchen buffalo sauce", () => {
    const buffalo = primalProducts.find((p) => p.id === "primal-kitchen-buffalo-sauce");
    expect(buffalo).toBeDefined();
    expect(buffalo!.score).toBeGreaterThanOrEqual(85);
  });

  it("should have Primal Kitchen avocado oil spray", () => {
    const spray = primalProducts.find((p) => p.id === "primal-kitchen-avocado-oil-spray");
    expect(spray).toBeDefined();
    expect(spray!.category).toBe("Cooking Oils");
  });

  it("should have updated total condiments count (28 original + 8 new Primal Kitchen)", () => {
    expect(ALL_CONDIMENTS.length).toBeGreaterThanOrEqual(36);
  });
});
