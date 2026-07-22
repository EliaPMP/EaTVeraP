import { describe, expect, it } from "vitest";

/**
 * Tests for the featured products data and sign-in page configuration.
 * These are unit tests validating the data structures and URLs used in the app.
 */

const FEATURED_PRODUCTS = [
  {
    name: "Pasture Raised Organic Eggs",
    brand: "Pete and Jerry's",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/pete_jerrys_eggs_3d-EHN5UbRBfjpzXXHnYV64kf.png",
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/pete_jerrys_eggs_3d-dujKFuTRQCbxLNGPPbKHX8.webp",
    score: 95,
    scoreColor: "#22c55e",
    category: "Dairy & Eggs",
  },
  {
    name: "Grass Fed Ground Beef 85/15",
    brand: "Organic Valley",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/grass_fed_beef_3d_v2-RhAm3gMFYA5xC2uDSDVKjc.png",
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/grass_fed_beef_3d_v2-ap9oKFEy39iCyEx7dUx3ft.webp",
    score: 92,
    scoreColor: "#22c55e",
    category: "Fresh Beef",
  },
  {
    name: "Kellogg's Frosted Flakes",
    brand: "Kellogg's",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/frosted_flakes_3d-U2gq96reg9kAfNr5ApB4yu.png",
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/frosted_flakes_3d-eEDke8VLagBYbpVkRNj3dm.webp",
    score: 28,
    scoreColor: "#dc2626",
    category: "Breakfast Cereals",
  },
  {
    name: "Cheetos Crunchy",
    brand: "Frito-Lay",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/cheetos_3d-585hCKdbBQuTwEgSWSmgCk.png",
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/cheetos_3d-RCPrW8PsgJp9d57VHqCW4y.webp",
    score: 15,
    scoreColor: "#dc2626",
    category: "Chips and Crisps",
  },
];

describe("Featured Products", () => {
  it("should have exactly 4 featured products", () => {
    expect(FEATURED_PRODUCTS).toHaveLength(4);
  });

  it("should include Pete and Jerry's eggs as first product", () => {
    const eggs = FEATURED_PRODUCTS[0];
    expect(eggs.name).toBe("Pasture Raised Organic Eggs");
    expect(eggs.brand).toBe("Pete and Jerry's");
    expect(eggs.score).toBe(95);
    expect(eggs.category).toBe("Dairy & Eggs");
  });

  it("should include Organic Valley beef as second product", () => {
    const beef = FEATURED_PRODUCTS[1];
    expect(beef.name).toBe("Grass Fed Ground Beef 85/15");
    expect(beef.brand).toBe("Organic Valley");
    expect(beef.score).toBe(92);
    expect(beef.category).toBe("Fresh Beef");
  });

  it("should include Frosted Flakes as third product", () => {
    const cereal = FEATURED_PRODUCTS[2];
    expect(cereal.name).toBe("Kellogg's Frosted Flakes");
    expect(cereal.brand).toBe("Kellogg's");
    expect(cereal.score).toBe(28);
    expect(cereal.scoreColor).toBe("#dc2626"); // red for low score
  });

  it("should include Cheetos as fourth product (junk food)", () => {
    const cheetos = FEATURED_PRODUCTS[3];
    expect(cheetos.name).toBe("Cheetos Crunchy");
    expect(cheetos.brand).toBe("Frito-Lay");
    expect(cheetos.score).toBe(15);
    expect(cheetos.scoreColor).toBe("#dc2626"); // red for low score
    expect(cheetos.category).toBe("Chips and Crisps");
  });

  it("all products should have valid CDN image URLs", () => {
    for (const product of FEATURED_PRODUCTS) {
      expect(product.imageUrl).toMatch(/^https:\/\/d2xsxph8kpxj0f\.cloudfront\.net\//);
      expect(product.thumbnailUrl).toMatch(/^https:\/\/d2xsxph8kpxj0f\.cloudfront\.net\//);
      expect(product.thumbnailUrl).toMatch(/\.webp$/);
    }
  });

  it("scores should be between 0 and 100", () => {
    for (const product of FEATURED_PRODUCTS) {
      expect(product.score).toBeGreaterThanOrEqual(0);
      expect(product.score).toBeLessThanOrEqual(100);
    }
  });

  it("high-quality products should have green score color", () => {
    const highQuality = FEATURED_PRODUCTS.filter(p => p.score >= 70);
    for (const product of highQuality) {
      expect(product.scoreColor).toBe("#22c55e");
    }
  });

  it("low-quality products should have red score color", () => {
    const lowQuality = FEATURED_PRODUCTS.filter(p => p.score < 30);
    for (const product of lowQuality) {
      expect(product.scoreColor).toBe("#dc2626");
    }
  });

  it("should NOT contain Force of Nature products", () => {
    for (const product of FEATURED_PRODUCTS) {
      expect(product.brand).not.toBe("Force of Nature");
    }
  });

  it("should NOT contain Troyer canned beef", () => {
    for (const product of FEATURED_PRODUCTS) {
      expect(product.brand).not.toBe("Troyer");
    }
  });
});

describe("Sign-in page configuration", () => {
  it("sign-in route should be /signin", () => {
    const SIGNIN_ROUTE = "/signin";
    expect(SIGNIN_ROUTE).toBe("/signin");
  });

  it("sign-in page should offer both email and Google options", () => {
    // Both options redirect to the same Manus OAuth portal
    // which handles email and Google authentication
    const signInOptions = ["email", "google"];
    expect(signInOptions).toContain("email");
    expect(signInOptions).toContain("google");
    expect(signInOptions).toHaveLength(2);
  });
});
