/**
 * EatVera Food API Service — v2
 * Multi-source barcode lookup strategy:
 * 1. Open Food Facts (primary) — 3M+ packaged products worldwide
 * 2. USDA FoodData Central (fallback) — US branded + SR Legacy including beef/meat
 * 3. Random-weight barcode handler — fresh meat/produce (prefix 020-029)
 * 4. PLU code lookup for fresh fruits and vegetables
 */
import { ALL_FRUITS } from "./fruitDatabase";
import { ALL_VEGETABLES } from "./vegetableDatabase";
import { ALL_SNACKS } from "./snackDatabase";
import { ALL_GRAINS } from "./grainsDatabase";
import { ALL_BEVERAGES } from "./beveragesDatabase";
import { ALL_FROZEN } from "./frozenDatabase";
import { ALL_SUPPLEMENTS } from "./supplementDatabase";
import { ALL_BABY_KIDS } from "./babyKidsDatabase";

export interface FoodProduct {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  ingredients: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  quantity?: string;
  nutriments: Record<string, number>;
  nutriScore?: string;
  novaGroup?: number;
  dataSource: "openfoodfacts" | "usda" | "usda-sr" | "estimated";
  fdcId?: number;
  servingSize?: string;
  servingUnit?: string;
  allergens?: string[];
  labels?: string[];
  additives?: string[];
  extendedNutrients?: ExtendedNutrient[];
  meatGrade?: MeatGrade;
  isRandomWeight?: boolean;
  averagePrice?: number; // USD retail average
  /** Optional pre-computed score — when set, ProductResult uses this instead of recalculating from ingredients */
  precomputedScore?: number;
}

export interface ExtendedNutrient {
  id: number;
  name: string;
  number: string;
  unit: string;
  value: number;
  percentDailyValue?: number;
}

export interface MeatGrade {
  usdaGrade?: string;
  type: string;
  cut?: string;
  isGrassFed?: boolean;
  isOrganic?: boolean;
  isAntibiotic?: boolean;
  qualityNotes: string[];
}

interface LookupResult {
  success: boolean;
  product?: FoodProduct;
  error?: string;
}

const USDA_API_KEY = "DEMO_KEY";
const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

function isRandomWeightBarcode(barcode: string): boolean {
  return /^02\d{11}$/.test(barcode);
}

export function detectMeatType(name: string, category: string, ingredients: string): MeatGrade | undefined {
  const text = `${name} ${category} ${ingredients}`.toLowerCase();
  const meatTypes = [
    { keywords: ["beef", "steak", "ground beef", "brisket", "ribeye", "sirloin", "chuck", "round", "tenderloin", "t-bone", "strip", "angus", "wagyu", "hamburger"], type: "Beef" },
    { keywords: ["chicken", "poultry", "hen", "broiler", "roaster", "rotisserie"], type: "Chicken" },
    { keywords: ["pork", "bacon", "ham", "sausage", "salami", "pepperoni", "prosciutto", "chorizo", "bratwurst", "kielbasa"], type: "Pork" },
    { keywords: ["turkey", "gobbler"], type: "Turkey" },
    { keywords: ["lamb", "mutton"], type: "Lamb" },
    { keywords: ["salmon", "tuna", "tilapia", "cod", "halibut", "shrimp", "crab", "lobster", "fish", "seafood", "sardine", "anchovy", "mahi", "trout", "catfish"], type: "Seafood" },
    { keywords: ["bison", "buffalo"], type: "Bison" },
    { keywords: ["venison", "deer"], type: "Venison" },
    { keywords: ["duck", "goose"], type: "Duck/Poultry" },
    { keywords: ["veal"], type: "Veal" },
  ];
  for (const mt of meatTypes) {
    if (mt.keywords.some((k) => text.includes(k))) {
      const isGrassFed = text.includes("grass-fed") || text.includes("grass fed") || text.includes("pasture");
      const isOrganic = text.includes("organic");
      const isAntibiotic = text.includes("antibiotic") || text.includes("no antibiotics");
      let usdaGrade: string | undefined;
      if (text.includes("prime")) usdaGrade = "Prime";
      else if (text.includes("choice")) usdaGrade = "Choice";
      else if (text.includes("select")) usdaGrade = "Select";
      const cuts = ["ribeye", "sirloin", "tenderloin", "brisket", "chuck", "round", "t-bone", "strip", "flank", "skirt", "short rib", "loin", "rib", "shoulder", "breast", "thigh", "wing", "drumstick"];
      const cut = cuts.find((c) => text.includes(c));
      const qualityNotes: string[] = [];
      if (isGrassFed) qualityNotes.push("Grass-fed — higher omega-3, CLA content");
      if (isOrganic) qualityNotes.push("Certified organic — no synthetic hormones or pesticides");
      if (isAntibiotic) qualityNotes.push("No antibiotics — better for gut microbiome");
      if (usdaGrade === "Prime") qualityNotes.push("USDA Prime — highest marbling, top quality");
      else if (usdaGrade === "Choice") qualityNotes.push("USDA Choice — good quality, widely available");
      else if (usdaGrade === "Select") qualityNotes.push("USDA Select — leaner, less tender");
      return { type: mt.type, usdaGrade, cut, isGrassFed, isOrganic, isAntibiotic, qualityNotes };
    }
  }
  return undefined;
}

function parseUsdaNutrients(foodNutrients: any[]): { nutriments: Record<string, number>; extended: ExtendedNutrient[] } {
  const nutriments: Record<string, number> = {};
  const extended: ExtendedNutrient[] = [];
  const NUTRIENT_MAP: Record<string, string> = {
    "208": "energy-kcal_100g", "203": "proteins_100g", "204": "fat_100g",
    "205": "carbohydrates_100g", "269": "sugars_100g", "291": "fiber_100g",
    "307": "sodium_100g", "601": "cholesterol_100g", "605": "trans-fat_100g",
    "606": "saturated-fat_100g", "645": "monounsaturated-fat_100g", "646": "polyunsaturated-fat_100g",
    "301": "calcium_100g", "303": "iron_100g", "304": "magnesium_100g",
    "305": "phosphorus_100g", "306": "potassium_100g", "309": "zinc_100g",
    "312": "copper_100g", "315": "manganese_100g", "317": "selenium_100g",
    "318": "vitamin-a_100g", "401": "vitamin-c_100g", "324": "vitamin-d_100g",
    "323": "vitamin-e_100g", "430": "vitamin-k_100g", "404": "vitamin-b1_100g",
    "405": "vitamin-b2_100g", "406": "vitamin-b3_100g", "410": "vitamin-b5_100g",
    "415": "vitamin-b6_100g", "417": "folate_100g", "418": "vitamin-b12_100g",
    "421": "choline_100g", "539": "added-sugars_100g",
  };
  for (const n of foodNutrients) {
    const num = String(n.nutrientNumber || n.number || "");
    const val = n.value ?? n.amount ?? 0;
    const unit = (n.unitName || n.unit || "G").toUpperCase();
    let convertedVal = val;
    if ((num === "307" || num === "301" || num === "303" || num === "304" || num === "305" || num === "306" || num === "309") && unit === "MG") {
      convertedVal = val / 1000;
    }
    if (num === "317" && unit === "UG") convertedVal = val / 1000000;
    const key = NUTRIENT_MAP[num];
    if (key && convertedVal !== undefined) nutriments[key] = convertedVal;
    if (n.nutrientName || n.name) {
      extended.push({ id: n.nutrientId || n.id || 0, name: n.nutrientName || n.name, number: num, unit, value: val, percentDailyValue: n.percentDailyValue });
    }
  }
  return { nutriments, extended };
}

/**
 * Fetch only the image URL for a product from Open Food Facts.
 * Returns undefined if not found or on error. Used to enrich internal-DB products.
 */
async function fetchOFFImage(barcode: string): Promise<{ imageUrl?: string; thumbnailUrl?: string } | undefined> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=image_front_url,image_front_small_url,image_url`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { "User-Agent": "EatVera/2.0" } });
    if (!res.ok) return undefined;
    const data = await res.json();
    if (data.status === 0 || !data.product) return undefined;
    const p = data.product;
    const imageUrl = p.image_front_url || p.image_url;
    const thumbnailUrl = p.image_front_small_url || p.image_url;
    if (!imageUrl) return undefined;
    return { imageUrl, thumbnailUrl };
  } catch { return undefined; }
}

async function lookupOpenFoodFacts(barcode: string): Promise<LookupResult> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,categories,ingredients_text,nutriments,nutriscore_grade,nova_group,image_url,image_front_url,image_front_small_url,quantity,allergens_tags,labels_tags,countries_tags,additives_tags,serving_size`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "EatVera/2.0" } });
    if (!res.ok) return { success: false, error: "Network error" };
    const data = await res.json();
    if (data.status === 0 || !data.product) return { success: false, error: "Not in Open Food Facts" };
    const p = data.product;
    const name = p.product_name || "";
    const brand = p.brands || "";
    if (!name && !brand) return { success: false, error: "Incomplete product data" };
    const meatGrade = detectMeatType(name, p.categories || "", p.ingredients_text || "");
    return {
      success: true,
      product: {
        barcode, name, brand,
        category: p.categories || "",
        ingredients: p.ingredients_text || "",
        imageUrl: p.image_front_url || p.image_url,
        thumbnailUrl: p.image_front_small_url || p.image_url,
        quantity: p.quantity,
        nutriments: p.nutriments || {},
        nutriScore: p.nutriscore_grade?.toUpperCase(),
        novaGroup: p.nova_group,
        dataSource: "openfoodfacts",
        servingSize: p.serving_size,
        allergens: (p.allergens_tags || []).map((a: string) => a.replace("en:", "")),
        labels: (p.labels_tags || []).map((l: string) => l.replace("en:", "")),
        additives: (p.additives_tags || []).map((a: string) => a.replace("en:", "")),
        meatGrade,
      },
    };
  } catch { return { success: false, error: "Open Food Facts timeout" }; }
}

async function lookupUSDA(barcode: string): Promise<LookupResult> {
  try {
    const searchUrl = `${USDA_BASE}/foods/search?query=${barcode}&api_key=${USDA_API_KEY}&pageSize=5`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { success: false, error: "USDA API error" };
    const data = await res.json();
    if (!data.foods || data.foods.length === 0) return { success: false, error: "Not in USDA database" };
    const exactMatch = data.foods.find((f: any) => f.gtinUpc === barcode);
    const food = exactMatch || data.foods[0];
    const { nutriments, extended } = parseUsdaNutrients(food.foodNutrients || []);
    const name = food.description || "";
    const brand = food.brandName || food.brandOwner || "";
    const category = food.foodCategory || food.brandedFoodCategory || "";
    const ingredients = food.ingredients || "";
    return {
      success: true,
      product: {
        barcode, name, brand, category, ingredients,
        quantity: food.packageWeight,
        nutriments, extendedNutrients: extended,
        dataSource: "usda", fdcId: food.fdcId,
        servingSize: food.servingSize ? `${food.servingSize}` : undefined,
        servingUnit: food.servingSizeUnit,
        meatGrade: detectMeatType(name, category, ingredients),
      },
    };
  } catch { return { success: false, error: "USDA lookup failed" }; }
}

async function lookupRandomWeightItem(barcode: string): Promise<LookupResult> {
  const deptCode = barcode[1];
  const deptMap: Record<string, string> = { "2": "Beef", "3": "Produce", "4": "Deli Meat", "5": "Seafood", "6": "Bakery", "7": "Cheese" };
  const dept = deptMap[deptCode] || "Fresh Item";
  try {
    const searchUrl = `${USDA_BASE}/foods/search?query=${encodeURIComponent(dept)}&api_key=${USDA_API_KEY}&dataType=SR%20Legacy,Foundation&pageSize=3`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      if (data.foods && data.foods.length > 0) {
        const food = data.foods[0];
        const { nutriments, extended } = parseUsdaNutrients(food.foodNutrients || []);
        const name = food.description || dept;
        return {
          success: true,
          product: {
            barcode, name: `Fresh ${dept} (Store-Weighed)`, brand: "Store Brand",
            category: dept, ingredients: dept,
            nutriments, extendedNutrients: extended,
            dataSource: "usda-sr", fdcId: food.fdcId, isRandomWeight: true,
            meatGrade: detectMeatType(name, dept, ""),
          },
        };
      }
    }
  } catch {}
  return {
    success: true,
    product: {
      barcode, name: `Fresh ${dept} (Store-Weighed)`, brand: "Store Brand",
      category: dept, ingredients: dept, nutriments: {},
      dataSource: "estimated", isRandomWeight: true,
      meatGrade: ["Beef", "Deli Meat"].includes(dept) ? { type: dept, qualityNotes: ["Fresh store-weighed item — check label for details"] } : undefined,
    },
  };
}

export async function lookupBarcode(barcode: string): Promise<LookupResult> {
  const cleanBarcode = barcode.replace(/\D/g, "");
  if (!cleanBarcode || cleanBarcode.length < 6) return { success: false, error: "Invalid barcode format" };

  // ── PLU code lookup for fresh produce (4-5 digit codes) ──────────────────
  if (cleanBarcode.length >= 4 && cleanBarcode.length <= 5) {
    const pluResult = lookupByPLU(cleanBarcode);
    if (pluResult.success) return pluResult;
  }

  // ── Grains barcode lookup ────────────────────────────────────────────────
  const grainMatch = ALL_GRAINS.find((g) => g.barcode === cleanBarcode);
  if (grainMatch) {
    const imgs = await fetchOFFImage(cleanBarcode);
    return {
      success: true,
      product: {
        barcode: cleanBarcode,
        name: grainMatch.name,
        brand: grainMatch.brand,
        category: `Bread & Grains — ${grainMatch.category}`,
        ingredients: grainMatch.ingredients || "",
        imageUrl: imgs?.imageUrl,
        thumbnailUrl: imgs?.thumbnailUrl,
        nutriments: {
          "energy-kcal_100g": grainMatch.nutrients?.calories || 0,
          "carbohydrates_100g": grainMatch.nutrients?.carbs || 0,
          "fiber_100g": grainMatch.nutrients?.fiber || 0,
          "sugars_100g": grainMatch.nutrients?.sugar || 0,
          "proteins_100g": grainMatch.nutrients?.protein || 0,
          "sodium_100g": (grainMatch.nutrients?.sodium || 0) / 1000,
        },
        dataSource: "estimated" as const,
        labels: [
          ...(grainMatch.isOrganic ? ["organic"] : []),
          ...(grainMatch.isWholeGrain ? ["whole-grain"] : []),
          ...(grainMatch.isGlutenFree ? ["gluten-free"] : []),
          ...(grainMatch.hasSeedOils ? ["contains-seed-oils"] : []),
          ...(grainMatch.hasHFCS ? ["contains-hfcs"] : []),
          ...(grainMatch.hasEnrichedFlour ? ["enriched-flour"] : []),
        ],
      },
    };
  }

  // ── Beverages lookup ─────────────────────────────────────────────────────
  const bevMatch = ALL_BEVERAGES.find((b) => b.barcode === cleanBarcode);
  if (bevMatch) {
    const imgs = await fetchOFFImage(cleanBarcode);
    return {
      success: true,
      product: {
        barcode: cleanBarcode,
        name: bevMatch.name,
        brand: bevMatch.brand,
        category: "Beverages",
        ingredients: bevMatch.ingredients || "",
        imageUrl: imgs?.imageUrl,
        thumbnailUrl: imgs?.thumbnailUrl,
        nutriments: {
          "energy-kcal": bevMatch.nutrients?.calories || 0,
          sugars: bevMatch.nutrients?.sugar || 0,
          sodium: (bevMatch.nutrients?.sodium || 0) / 1000,
        },
        dataSource: "estimated" as const,
        labels: [
          ...(bevMatch.isOrganic ? ["Organic"] : []),
          ...(bevMatch.isSugarFree ? ["Sugar-Free"] : []),
          ...(bevMatch.isNaturallySweetened ? ["Naturally Sweetened"] : []),
        ],
        additives: [
          ...(bevMatch.hasHFCS ? ["High Fructose Corn Syrup"] : []),
          ...(bevMatch.hasArtificialSweeteners ? ["Artificial Sweeteners"] : []),
          ...(bevMatch.hasArtificialColors ? ["Artificial Colors"] : []),
          ...(bevMatch.hasSodiumBenzoate ? ["Sodium Benzoate"] : []),
        ],
      },
    };
  }

  // ── Frozen foods lookup ───────────────────────────────────────────────────
  const frozenMatch = ALL_FROZEN.find((f) => f.barcode === cleanBarcode);
  if (frozenMatch) {
    const imgs = await fetchOFFImage(cleanBarcode);
    return {
      success: true,
      product: {
        barcode: cleanBarcode,
        name: frozenMatch.name,
        brand: frozenMatch.brand,
        category: "Frozen Foods",
        ingredients: frozenMatch.ingredients || "",
        imageUrl: imgs?.imageUrl,
        thumbnailUrl: imgs?.thumbnailUrl,
        nutriments: {
          "energy-kcal": frozenMatch.nutrients?.calories || 0,
          fat: frozenMatch.nutrients?.fat || 0,
          carbohydrates: frozenMatch.nutrients?.carbs || 0,
          proteins: frozenMatch.nutrients?.protein || 0,
          sodium: (frozenMatch.nutrients?.sodium || 0) / 1000,
        },
        novaGroup: frozenMatch.novaGroup,
        dataSource: "estimated" as const,
        labels: [
          ...(frozenMatch.isOrganic ? ["Organic"] : []),
          ...(frozenMatch.isGlutenFree ? ["Gluten-Free"] : []),
        ],
        additives: [
          ...(frozenMatch.hasSeedOils ? ["Seed Oils"] : []),
          ...(frozenMatch.hasPreservatives ? ["Preservatives"] : []),
          ...(frozenMatch.hasArtificialColors ? ["Artificial Colors"] : []),
        ],
      },
    };
  }

  // ── Supplements lookup ────────────────────────────────────────────────────
  const suppMatch = ALL_SUPPLEMENTS.find((s) => s.barcode === cleanBarcode);
  if (suppMatch) {
    const imgs = await fetchOFFImage(cleanBarcode);
    return {
      success: true,
      product: {
        barcode: cleanBarcode,
        name: suppMatch.name,
        brand: suppMatch.brand,
        category: `Supplement — ${suppMatch.category}`,
        ingredients: suppMatch.ingredients || "",
        imageUrl: imgs?.imageUrl,
        thumbnailUrl: imgs?.thumbnailUrl,
        nutriments: {
          "energy-kcal": suppMatch.nutrients?.calories || 0,
          proteins: suppMatch.nutrients?.protein || 0,
          carbohydrates: suppMatch.nutrients?.carbs || 0,
          fat: suppMatch.nutrients?.fat || 0,
          sodium: (suppMatch.nutrients?.sodium || 0) / 1000,
        },
        dataSource: "estimated" as const,
        labels: [
          ...(suppMatch.isThirdPartyTested ? ["Third-Party Tested"] : []),
        ],
        additives: [
          ...(suppMatch.hasArtificialSweeteners ? ["Artificial Sweeteners"] : []),
          ...(suppMatch.hasSeedOilDerived ? ["Seed Oil Derived"] : []),
          ...(suppMatch.hasArtificialColors ? ["Artificial Colors"] : []),
        ],
      },
    };
  }

  // ── Baby & Kids lookup ────────────────────────────────────────────────────
  const babyMatch = ALL_BABY_KIDS.find((b) => b.barcode === cleanBarcode);
  if (babyMatch) {
    const imgs = await fetchOFFImage(cleanBarcode);
    return {
      success: true,
      product: {
        barcode: cleanBarcode,
        name: babyMatch.name,
        brand: babyMatch.brand,
        category: `Baby & Kids — ${babyMatch.category}`,
        ingredients: babyMatch.ingredients || "",
        imageUrl: imgs?.imageUrl,
        thumbnailUrl: imgs?.thumbnailUrl,
        nutriments: {},
        dataSource: "estimated" as const,
        labels: [
          ...(babyMatch.isOrganic ? ["Organic"] : []),
          ...(babyMatch.isNonGMO ? ["Non-GMO"] : []),
          ...(babyMatch.isLowHeavyMetals ? ["Low Heavy Metals"] : []),
        ],
        additives: [
          ...(babyMatch.hasHeavyMetalRisk ? ["Heavy Metal Risk"] : []),
          ...(babyMatch.hasAddedSugars ? ["Added Sugars"] : []),
          ...(babyMatch.hasArtificialColors ? ["Artificial Colors"] : []),
        ],
      },
    };
  }

  // ── Snacks lookup ─────────────────────────────────────────────────────────
  const snackMatch = ALL_SNACKS.find((s) => s.barcode === cleanBarcode);
  if (snackMatch) {
    const imgs = await fetchOFFImage(cleanBarcode);
    return {
      success: true,
      product: {
        barcode: cleanBarcode,
        name: snackMatch.name,
        brand: snackMatch.brand,
        category: `Snack — ${snackMatch.category}`,
        ingredients: snackMatch.ingredients,
        imageUrl: imgs?.imageUrl,
        thumbnailUrl: imgs?.thumbnailUrl,
        nutriments: snackMatch.nutriments,
        dataSource: "estimated",
        labels: snackMatch.certifications,
        servingSize: snackMatch.servingSize,
      },
    };
  }

  if (isRandomWeightBarcode(cleanBarcode)) return lookupRandomWeightItem(cleanBarcode);
  const offResult = await lookupOpenFoodFacts(cleanBarcode);
  if (offResult.success && offResult.product) {
    const hasNutrients = Object.keys(offResult.product.nutriments).length > 3;
    if (!hasNutrients) {
      const usdaResult = await lookupUSDA(cleanBarcode);
      if (usdaResult.success && usdaResult.product) {
        return { success: true, product: { ...offResult.product, nutriments: usdaResult.product.nutriments, extendedNutrients: usdaResult.product.extendedNutrients, fdcId: usdaResult.product.fdcId } };
      }
    }
    return offResult;
  }
  const usdaResult = await lookupUSDA(cleanBarcode);
  if (usdaResult.success) return usdaResult;
  return { success: false, error: "Product not found. Try searching by name instead." };
}

/**
 * Look up a fresh produce item by its IFPS PLU code.
 * Returns a FoodProduct built from the fruit or vegetable database.
 */
export function lookupByPLU(plu: string): LookupResult {

  // Search fruits
  const fruit = ALL_FRUITS.find((f) => f.pluCodes.includes(plu));
  if (fruit) {
    return {
      success: true,
      product: {
        barcode: plu,
        name: fruit.name,
        brand: fruit.organicAvailable && plu.startsWith("9") ? "Organic" : "Fresh Produce",
        category: `Fruit — ${fruit.category}`,
        ingredients: fruit.name,
        nutriments: {
          "energy-kcal_100g": fruit.nutrients.calories ?? 0,
          "carbohydrates_100g": fruit.nutrients.carbs ?? 0,
          "fiber_100g": fruit.nutrients.fiber ?? 0,
          "sugars_100g": fruit.nutrients.sugar ?? 0,
          "proteins_100g": fruit.nutrients.protein ?? 0,
          "vitamin-c_100g": (fruit.nutrients.vitaminC ?? 0) / 1000,
          "potassium_100g": (fruit.nutrients.potassium ?? 0) / 1000,
        },
        dataSource: "estimated",
        labels: [
          fruit.ewgStatus === "dirty-dozen" ? "EWG Dirty Dozen" : fruit.ewgStatus === "clean-fifteen" ? "EWG Clean Fifteen" : "",
          fruit.organicAvailable ? "Organic Available" : "",
        ].filter(Boolean),
      },
    };
  }

  // Search vegetables
  const veg = ALL_VEGETABLES.find((v) => v.pluCodes.includes(plu));
  if (veg) {
    return {
      success: true,
      product: {
        barcode: plu,
        name: veg.name,
        brand: plu.startsWith("9") ? "Organic" : "Fresh Produce",
        category: `Vegetable — ${veg.category}`,
        ingredients: veg.name,
        nutriments: {
          "energy-kcal_100g": veg.calories100g,
        },
        dataSource: "estimated",
        labels: [
          veg.ewgStatus === "dirty-dozen" ? "EWG Dirty Dozen" : veg.ewgStatus === "clean-fifteen" ? "EWG Clean Fifteen" : "",
        ].filter(Boolean),
      },
    };
  }

  return { success: false, error: "PLU code not found in produce database" };
}

export async function searchProducts(query: string): Promise<FoodProduct[]> {
  const results: FoodProduct[] = [];
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=code,product_name,brands,categories,ingredients_text,nutriments,nutriscore_grade,nova_group,image_front_small_url,quantity`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { "User-Agent": "EatVera/2.0" } });
    if (res.ok) {
      const data = await res.json();
      for (const p of (data.products || []).slice(0, 8)) {
        if (!p.product_name) continue;
        results.push({
          barcode: p.code, name: p.product_name, brand: p.brands || "",
          category: p.categories || "", ingredients: p.ingredients_text || "",
          thumbnailUrl: p.image_front_small_url, nutriments: p.nutriments || {},
          nutriScore: p.nutriscore_grade?.toUpperCase(), novaGroup: p.nova_group,
          dataSource: "openfoodfacts", quantity: p.quantity,
          meatGrade: detectMeatType(p.product_name, p.categories || "", p.ingredients_text || ""),
        });
      }
    }
  } catch {}
  if (results.length < 3) {
    try {
      const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&api_key=${USDA_API_KEY}&pageSize=6&dataType=Branded,SR%20Legacy,Foundation`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const data = await res.json();
        for (const food of (data.foods || []).slice(0, 5)) {
          const name = food.description || "";
          if (!name || results.some((r) => r.name.toLowerCase() === name.toLowerCase())) continue;
          const { nutriments, extended } = parseUsdaNutrients(food.foodNutrients || []);
          results.push({
            barcode: food.gtinUpc || String(food.fdcId), name,
            brand: food.brandName || food.brandOwner || "",
            category: food.foodCategory || "", ingredients: food.ingredients || "",
            nutriments, extendedNutrients: extended,
            dataSource: "usda", fdcId: food.fdcId, quantity: food.packageWeight,
            meatGrade: detectMeatType(name, food.foodCategory || "", food.ingredients || ""),
          });
        }
      }
    } catch {}
  }
  return results;
}

// ============================================================
// FORCE OF NATURE MEATS — Full Product Database
// All products: 100% regenerative, grass-fed/finished, no antibiotics,
// no hormones, no fillers, no seed oils. Sourced from regenerative farms.
// ============================================================
export const FORCE_OF_NATURE_PRODUCTS: FoodProduct[] = [
  {
    barcode: "850026076001",
    name: "Regenerative Ground Beef 85/15",
    brand: "Force of Nature",
    category: "Ground Beef",
    ingredients: "GRASS-FED GRASS-FINISHED BEEF.",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/ground_beef_pkg-n8BfnDsZYZAqbMMfsGHTtq.png",
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/ground_beef_pkg-m9YREX76rTdhgXCmT6dnTJ.webp",
    nutriments: {
      "energy-kcal_100g": 215, "proteins_100g": 17.9, "fat_100g": 15,
      "saturated-fat_100g": 6.0, "monounsaturated-fat_100g": 6.5, "polyunsaturated-fat_100g": 0.5,
      "carbohydrates_100g": 0, "sugars_100g": 0, "sodium_100g": 0.075,
      "cholesterol_100g": 0.07, "iron_100g": 0.0025, "zinc_100g": 0.0044,
      "potassium_100g": 0.31, "vitamin-b12_100g": 0.0000024,
    },
    novaGroup: 1,
    dataSource: "usda",
    labels: ["regenerative", "grass-fed", "grass-finished", "no-antibiotics", "no-hormones"],
    meatGrade: {
      type: "Beef", isGrassFed: true, isOrganic: false, isAntibiotic: true,
      qualityNotes: [
        "100% grass-fed and grass-finished — highest omega-3 and CLA content",
        "Regenerative agriculture — improves soil health and sequesters carbon",
        "No antibiotics ever — supports healthy gut microbiome",
        "No added hormones — clean hormonal profile",
        "Single ingredient: beef — zero fillers, binders, or additives",
      ],
    },
  },
  {
    barcode: "850026076018",
    name: "Regenerative Ground Beef 80/20",
    brand: "Force of Nature",
    category: "Ground Beef",
    ingredients: "GRASS-FED GRASS-FINISHED BEEF.",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/force_nature_8020-hkwNJoLwQXixGfBzXKUY49.png",
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/force_nature_8020-DEZfTpsqhbBKPynYuV65Qd.webp",
    nutriments: {
      "energy-kcal_100g": 254, "proteins_100g": 17.2, "fat_100g": 20,
      "saturated-fat_100g": 8.0, "monounsaturated-fat_100g": 8.8, "polyunsaturated-fat_100g": 0.7,
      "carbohydrates_100g": 0, "sugars_100g": 0, "sodium_100g": 0.075,
      "cholesterol_100g": 0.078, "iron_100g": 0.0022, "zinc_100g": 0.0040,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "grass-fed", "grass-finished", "no-antibiotics"],
    meatGrade: {
      type: "Beef", isGrassFed: true, isAntibiotic: true,
      qualityNotes: [
        "100% grass-fed and grass-finished — richer flavor, higher fat",
        "Regenerative sourced — verified regenerative farm network",
        "No antibiotics, no hormones, no fillers",
        "Higher fat content — great for burgers and meatballs",
      ],
    },
  },
  {
    barcode: "850026076025",
    name: "Regenerative Beef Ancestral Blend",
    brand: "Force of Nature",
    category: "Ground Beef",
    ingredients: "GRASS-FED GRASS-FINISHED BEEF, BEEF HEART, BEEF LIVER, BEEF KIDNEY.",
    nutriments: {
      "energy-kcal_100g": 195, "proteins_100g": 19.5, "fat_100g": 12,
      "saturated-fat_100g": 5.0, "carbohydrates_100g": 0.5, "sugars_100g": 0,
      "sodium_100g": 0.08, "cholesterol_100g": 0.12, "iron_100g": 0.006,
      "zinc_100g": 0.0055, "vitamin-b12_100g": 0.000015, "vitamin-a_100g": 0.0005,
      "potassium_100g": 0.35,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "grass-fed", "grass-finished", "nose-to-tail", "organ-meat"],
    meatGrade: {
      type: "Beef", isGrassFed: true, isAntibiotic: true,
      qualityNotes: [
        "Ancestral blend: muscle meat + heart + liver + kidney — maximum nutrient density",
        "Liver: nature's multivitamin — extremely high in B12, vitamin A, iron",
        "Heart: highest natural CoQ10 source — supports cardiovascular health",
        "Kidney: rich in selenium, B12, and riboflavin",
        "Nose-to-tail eating — honors the whole animal, zero waste",
        "Regenerative grass-fed and grass-finished",
      ],
    },
  },
  {
    barcode: "850026076032",
    name: "Regenerative Ground Bison",
    brand: "Force of Nature",
    category: "Ground Bison",
    ingredients: "GRASS-FED GRASS-FINISHED BISON.",
    nutriments: {
      "energy-kcal_100g": 146, "proteins_100g": 20.2, "fat_100g": 7.2,
      "saturated-fat_100g": 2.8, "monounsaturated-fat_100g": 2.9, "polyunsaturated-fat_100g": 0.5,
      "carbohydrates_100g": 0, "sugars_100g": 0, "sodium_100g": 0.057,
      "cholesterol_100g": 0.062, "iron_100g": 0.003, "zinc_100g": 0.0042,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "grass-fed", "grass-finished", "no-antibiotics"],
    meatGrade: {
      type: "Bison", isGrassFed: true, isAntibiotic: true,
      qualityNotes: [
        "100% grass-fed and grass-finished bison — leaner than beef with excellent nutrient profile",
        "Bison are never raised in feedlots — always pasture-raised",
        "Higher iron and zinc than conventional beef",
        "Regenerative sourced — restores native grassland ecosystems",
        "No antibiotics, no hormones, no additives",
      ],
    },
  },
  {
    barcode: "850026076049",
    name: "Regenerative Bison Ancestral Blend",
    brand: "Force of Nature",
    category: "Ground Bison",
    ingredients: "GRASS-FED GRASS-FINISHED BISON, BISON HEART, BISON LIVER.",
    nutriments: {
      "energy-kcal_100g": 155, "proteins_100g": 21.0, "fat_100g": 7.5,
      "saturated-fat_100g": 3.0, "carbohydrates_100g": 0.3, "sugars_100g": 0,
      "sodium_100g": 0.065, "cholesterol_100g": 0.1, "iron_100g": 0.007,
      "zinc_100g": 0.005, "vitamin-b12_100g": 0.000012, "vitamin-a_100g": 0.0004,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "grass-fed", "grass-finished", "nose-to-tail"],
    meatGrade: {
      type: "Bison", isGrassFed: true, isAntibiotic: true,
      qualityNotes: [
        "Bison ancestral blend: muscle + heart + liver — exceptional nutrient density",
        "Bison liver: extremely high in B12, copper, and folate",
        "Bison heart: rich in CoQ10, B vitamins, and collagen",
        "Leaner than beef ancestral blend — ideal for those watching fat intake",
        "Regenerative sourced — supports Great Plains ecosystem restoration",
      ],
    },
  },
  {
    barcode: "850026076056",
    name: "Regenerative Ground Venison",
    brand: "Force of Nature",
    category: "Ground Venison",
    ingredients: "GRASS-FED FREE-RANGE VENISON.",
    nutriments: {
      "energy-kcal_100g": 120, "proteins_100g": 22.2, "fat_100g": 3.2,
      "saturated-fat_100g": 1.3, "carbohydrates_100g": 0, "sugars_100g": 0,
      "sodium_100g": 0.054, "cholesterol_100g": 0.085, "iron_100g": 0.0038,
      "zinc_100g": 0.0027,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "free-range", "wild-harvested", "no-antibiotics"],
    meatGrade: {
      type: "Venison", isGrassFed: true, isAntibiotic: true,
      qualityNotes: [
        "Free-range venison — one of the leanest, most nutrient-dense proteins available",
        "Wild-harvested or ranch-raised — never confined or grain-fed",
        "Extremely lean — only 3.2g fat per 100g",
        "High in iron and B12 — excellent for energy and blood health",
        "No antibiotics, no hormones — completely clean protein",
      ],
    },
  },
  {
    barcode: "850026076063",
    name: "Regenerative Ground Wild Boar",
    brand: "Force of Nature",
    category: "Ground Wild Boar",
    ingredients: "FREE-RANGE WILD BOAR.",
    nutriments: {
      "energy-kcal_100g": 122, "proteins_100g": 21.5, "fat_100g": 3.3,
      "saturated-fat_100g": 1.1, "carbohydrates_100g": 0, "sugars_100g": 0,
      "sodium_100g": 0.05, "cholesterol_100g": 0.07, "iron_100g": 0.0015,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "free-range", "wild-harvested"],
    meatGrade: {
      type: "Pork", isGrassFed: true, isAntibiotic: true,
      qualityNotes: [
        "Wild boar — naturally free-range, forages on natural diet",
        "Leaner than commercial pork — less fat, more protein",
        "No antibiotics, no hormones — wild animal",
        "Unique flavor profile — richer and more complex than farmed pork",
      ],
    },
  },
  {
    barcode: "850026076070",
    name: "Regenerative Ground Elk",
    brand: "Force of Nature",
    category: "Ground Elk",
    ingredients: "FREE-RANGE ELK.",
    nutriments: {
      "energy-kcal_100g": 111, "proteins_100g": 22.8, "fat_100g": 1.9,
      "saturated-fat_100g": 0.7, "carbohydrates_100g": 0, "sugars_100g": 0,
      "sodium_100g": 0.052, "cholesterol_100g": 0.073, "iron_100g": 0.003,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "free-range", "wild-harvested"],
    meatGrade: {
      type: "Venison", isGrassFed: true, isAntibiotic: true,
      qualityNotes: [
        "Elk: one of the leanest red meats available — only 1.9g fat per 100g",
        "Free-range and wild-harvested — natural diet, no confinement",
        "Extremely high protein — 22.8g per 100g",
        "No antibiotics, no hormones — completely natural",
      ],
    },
  },
  {
    barcode: "850026076087",
    name: "Regenerative Beef Burger Patties",
    brand: "Force of Nature",
    category: "Beef Burgers",
    ingredients: "GRASS-FED GRASS-FINISHED BEEF.",
    nutriments: {
      "energy-kcal_100g": 254, "proteins_100g": 17.2, "fat_100g": 20,
      "saturated-fat_100g": 8.0, "carbohydrates_100g": 0, "sugars_100g": 0,
      "sodium_100g": 0.075, "cholesterol_100g": 0.078,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "grass-fed", "grass-finished"],
    meatGrade: {
      type: "Beef", isGrassFed: true, isAntibiotic: true,
      qualityNotes: [
        "Pre-formed grass-fed grass-finished burger patties",
        "Single ingredient — just beef, no fillers or binders",
        "No soy, no gluten, no seed oils",
        "Regenerative sourced",
      ],
    },
  },
  {
    barcode: "850026076094",
    name: "Regenerative Beef + Bison Blend",
    brand: "Force of Nature",
    category: "Ground Meat Blend",
    ingredients: "GRASS-FED GRASS-FINISHED BEEF, GRASS-FED GRASS-FINISHED BISON.",
    nutriments: {
      "energy-kcal_100g": 185, "proteins_100g": 19.0, "fat_100g": 11.5,
      "saturated-fat_100g": 4.5, "carbohydrates_100g": 0, "sugars_100g": 0,
      "sodium_100g": 0.065, "cholesterol_100g": 0.07, "iron_100g": 0.0028,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "grass-fed", "grass-finished"],
    meatGrade: {
      type: "Beef", isGrassFed: true, isAntibiotic: true,
      qualityNotes: [
        "Beef and bison blend — best of both worlds",
        "Bison adds extra leanness and iron to the beef",
        "Both grass-fed and grass-finished",
        "Regenerative sourced — dual species grazing benefits ecosystem",
      ],
    },
  },
  {
    barcode: "850026076100",
    name: "Regenerative Ground Chicken",
    brand: "Force of Nature",
    category: "Ground Chicken",
    ingredients: "PASTURE-RAISED CHICKEN.",
    nutriments: {
      "energy-kcal_100g": 143, "proteins_100g": 17.4, "fat_100g": 8.1,
      "saturated-fat_100g": 2.2, "carbohydrates_100g": 0, "sugars_100g": 0,
      "sodium_100g": 0.077, "cholesterol_100g": 0.088,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "pasture-raised", "no-antibiotics"],
    meatGrade: {
      type: "Chicken", isGrassFed: false, isAntibiotic: true,
      qualityNotes: [
        "Pasture-raised chicken — access to outdoors, natural foraging",
        "No antibiotics, no hormones",
        "Regenerative sourced — chickens improve soil fertility",
        "Higher omega-3 than conventional chicken",
      ],
    },
  },
  {
    barcode: "850026076117",
    name: "Regenerative Chicken Ancestral Blend",
    brand: "Force of Nature",
    category: "Ground Chicken",
    ingredients: "PASTURE-RAISED CHICKEN, CHICKEN HEART, CHICKEN LIVER.",
    nutriments: {
      "energy-kcal_100g": 148, "proteins_100g": 18.5, "fat_100g": 8.0,
      "saturated-fat_100g": 2.3, "carbohydrates_100g": 0.5, "sugars_100g": 0,
      "sodium_100g": 0.08, "cholesterol_100g": 0.15, "iron_100g": 0.004,
      "vitamin-a_100g": 0.0003, "vitamin-b12_100g": 0.000008,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "pasture-raised", "nose-to-tail"],
    meatGrade: {
      type: "Chicken", isGrassFed: false, isAntibiotic: true,
      qualityNotes: [
        "Chicken ancestral blend: muscle + heart + liver",
        "Chicken liver: rich in retinol (vitamin A), B12, and folate",
        "Chicken heart: natural CoQ10 and taurine source",
        "Pasture-raised — natural foraging diet",
        "No antibiotics, no hormones, no fillers",
      ],
    },
  },
  {
    barcode: "850026076124",
    name: "Regenerative Beef Stew Meat",
    brand: "Force of Nature",
    category: "Beef Stew",
    ingredients: "GRASS-FED GRASS-FINISHED BEEF.",
    nutriments: {
      "energy-kcal_100g": 143, "proteins_100g": 21.4, "fat_100g": 6.0,
      "saturated-fat_100g": 2.4, "carbohydrates_100g": 0, "sugars_100g": 0,
      "sodium_100g": 0.06, "cholesterol_100g": 0.065, "iron_100g": 0.002,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "grass-fed", "grass-finished"],
    meatGrade: {
      type: "Beef", isGrassFed: true, isAntibiotic: true, cut: "chuck",
      qualityNotes: [
        "Chuck cut — ideal for slow cooking, stews, and braises",
        "Grass-fed and grass-finished — rich in omega-3 and CLA",
        "No antibiotics, no hormones",
        "Single ingredient: beef",
      ],
    },
  },
  {
    barcode: "850026076131",
    name: "Regenerative Beef Tallow",
    brand: "Force of Nature",
    category: "Cooking Fat",
    ingredients: "GRASS-FED GRASS-FINISHED BEEF TALLOW.",
    nutriments: {
      "energy-kcal_100g": 902, "proteins_100g": 0, "fat_100g": 100,
      "saturated-fat_100g": 49.8, "monounsaturated-fat_100g": 41.8,
      "polyunsaturated-fat_100g": 4.0, "carbohydrates_100g": 0,
      "cholesterol_100g": 0.109,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "grass-fed", "grass-finished", "no-seed-oils"],
    meatGrade: {
      type: "Beef", isGrassFed: true, isAntibiotic: true,
      qualityNotes: [
        "Pure grass-fed beef tallow — the traditional cooking fat",
        "Extremely stable at high heat — does not oxidize like seed oils",
        "Rich in fat-soluble vitamins A, D, E, and K2",
        "High in stearic acid — a heart-neutral saturated fat",
        "Zero seed oils, zero additives — single ingredient",
        "Ideal replacement for canola, vegetable, and soybean oils",
      ],
    },
  },
  {
    barcode: "850026076148",
    name: "Regenerative Beef Bone Broth",
    brand: "Force of Nature",
    category: "Bone Broth",
    ingredients: "GRASS-FED GRASS-FINISHED BEEF BONES, FILTERED WATER, APPLE CIDER VINEGAR, SEA SALT.",
    nutriments: {
      "energy-kcal_100g": 20, "proteins_100g": 4.5, "fat_100g": 0.5,
      "saturated-fat_100g": 0.2, "carbohydrates_100g": 0.5, "sugars_100g": 0,
      "sodium_100g": 0.18, "calcium_100g": 0.012,
    },
    novaGroup: 1, dataSource: "usda",
    labels: ["regenerative", "grass-fed", "collagen-rich"],
    meatGrade: {
      type: "Beef", isGrassFed: true, isAntibiotic: true,
      qualityNotes: [
        "Made from grass-fed grass-finished beef bones",
        "Rich in collagen, gelatin, and glycine — supports gut and joint health",
        "Apple cider vinegar helps extract minerals from bones",
        "No artificial flavors, no MSG, no preservatives",
        "Slow-simmered for maximum nutrient extraction",
      ],
    },
  },
];

export const DEMO_PRODUCTS: FoodProduct[] = [
  {
    barcode: "0038000845031", name: "Kellogg's Frosted Flakes", brand: "Kellogg's",
    category: "Breakfast Cereals",
    ingredients: "MILLED CORN, SUGAR, MALT FLAVOR, CONTAINS 2% OR LESS OF SALT. VITAMINS AND MINERALS: NIACINAMIDE, REDUCED IRON, VITAMIN B6, RIBOFLAVIN (VITAMIN B2), THIAMIN HYDROCHLORIDE (VITAMIN B1), FOLIC ACID, VITAMIN D3, VITAMIN B12.",
    nutriments: { "energy-kcal_100g": 370, "proteins_100g": 4.3, "carbohydrates_100g": 88, "sugars_100g": 37, "fat_100g": 0.4, "fiber_100g": 1.3, "sodium_100g": 0.55 },
    nutriScore: "C", novaGroup: 4, dataSource: "openfoodfacts",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/frosted_flakes_pkg-SGjkSfxZqd2W4grZ73GP5P.png",
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/frosted_flakes_pkg-UbZ3K3Edtq5388GDPV5TNr.webp",
  },
  {
    barcode: "049646990108", name: "Canned Beef", brand: "Troyer",
    category: "Canned Meat", ingredients: "BEEF, SALT.",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/ground_beef_pkg-n8BfnDsZYZAqbMMfsGHTtq.png",
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/ground_beef_pkg-m9YREX76rTdhgXCmT6dnTJ.webp",
    nutriments: { "energy-kcal_100g": 152, "proteins_100g": 23.5, "fat_100g": 6.9, "saturated-fat_100g": 4.8, "carbohydrates_100g": 0, "sugars_100g": 0, "sodium_100g": 0.25, "cholesterol_100g": 0.062, "iron_100g": 0.005 },
    novaGroup: 2, dataSource: "usda",
    meatGrade: { type: "Beef", qualityNotes: ["Minimally processed — beef and salt only", "Good protein source — 23.5g per 100g"] },
  },
  {
    barcode: "016000275287", name: "Cheerios", brand: "General Mills",
    category: "Breakfast Cereals",
    ingredients: "WHOLE GRAIN OATS, MODIFIED CORN STARCH, SUGAR, SALT, TRIPOTASSIUM PHOSPHATE, WHEAT STARCH, VITAMIN E (MIXED TOCOPHEROLS) ADDED TO PRESERVE FRESHNESS.",
    nutriments: { "energy-kcal_100g": 375, "proteins_100g": 12.5, "carbohydrates_100g": 73, "sugars_100g": 4.4, "fat_100g": 6.7, "fiber_100g": 10, "sodium_100g": 0.4 },
    nutriScore: "B", novaGroup: 3, dataSource: "openfoodfacts",
    imageUrl: "https://images.openfoodfacts.org/images/products/001/600/027/5287/front_en.8.400.jpg",
    thumbnailUrl: "https://images.openfoodfacts.org/images/products/001/600/027/5287/front_en.8.200.jpg",
  },
  {
    barcode: "0085239012154", name: "Organic Grass-Fed Ground Beef 85/15", brand: "Laura's Lean",
    category: "Fresh Beef", ingredients: "ORGANIC GRASS-FED BEEF.",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/lauras_lean_pkg-9D7oXHsunCXA5U6Vyv7dwY.png",
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/lauras_lean_pkg-2o7omf4VaNk2xLtYQCVx3s.webp",
    nutriments: { "energy-kcal_100g": 215, "proteins_100g": 17.9, "fat_100g": 15, "saturated-fat_100g": 6, "carbohydrates_100g": 0, "sugars_100g": 0, "sodium_100g": 0.075, "cholesterol_100g": 0.07, "iron_100g": 0.002, "zinc_100g": 0.0044 },
    novaGroup: 1, dataSource: "usda",
    meatGrade: { type: "Beef", isGrassFed: true, isOrganic: true, qualityNotes: ["Grass-fed — higher omega-3, CLA content", "Certified organic — no synthetic hormones", "Minimal processing — pure beef"] },
  },
  {
    barcode: "021130126026", name: "Doritos Nacho Cheese", brand: "Frito-Lay",
    category: "Chips and Crisps",
    ingredients: "CORN, VEGETABLE OIL (CORN, CANOLA, AND/OR SUNFLOWER OIL), MALTODEXTRIN (MADE FROM CORN), SALT, CHEDDAR CHEESE (MILK, CHEESE CULTURES, SALT, ENZYMES), WHEY, MONOSODIUM GLUTAMATE, BUTTERMILK, ROMANO CHEESE, WHEY PROTEIN CONCENTRATE, ONION POWDER, CORN FLOUR, NATURAL AND ARTIFICIAL FLAVOR, DEXTROSE, TOMATO POWDER, LACTOSE, SPICES, ARTIFICIAL COLOR (YELLOW 6, YELLOW 5, RED 40), LACTIC ACID, CITRIC ACID, SUGAR, GARLIC POWDER, DISODIUM INOSINATE, DISODIUM GUANYLATE.",
    nutriments: { "energy-kcal_100g": 500, "proteins_100g": 6.3, "carbohydrates_100g": 63, "sugars_100g": 1.9, "fat_100g": 25, "saturated-fat_100g": 3.8, "sodium_100g": 0.75, "fiber_100g": 3.8 },
    nutriScore: "D", novaGroup: 4, dataSource: "openfoodfacts",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/doritos_pkg-CQk9tvc95G346faxk8f2mU.png",
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/doritos_pkg-CQUdk3ipjz2XFTE4XJCgGP.webp",
  },
  {
    barcode: "0011110874931", name: "Wild Caught Atlantic Salmon Fillet", brand: "Simple Truth",
    category: "Fresh Seafood", ingredients: "ATLANTIC SALMON.",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/salmon_pkg-9S5f6p8fZmDcZCsRQwfMat.png",
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663567385354/4uoCTYmfUzQmw7bDcZPddF/salmon_pkg-gDjF9t2VM67Cj2MPVdrF3o.webp",
    nutriments: { "energy-kcal_100g": 208, "proteins_100g": 20, "fat_100g": 13, "saturated-fat_100g": 3, "carbohydrates_100g": 0, "sugars_100g": 0, "sodium_100g": 0.059, "cholesterol_100g": 0.063, "polyunsaturated-fat_100g": 3.9 },
    novaGroup: 1, dataSource: "usda",
    meatGrade: { type: "Seafood", qualityNotes: ["Wild-caught — higher omega-3 DHA/EPA", "No additives — pure fish"] },
  },
];
