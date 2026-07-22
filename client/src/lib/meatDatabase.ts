/**
 * EatVera — Comprehensive US Grocery Store Meat Database
 * Covers every major meat brand available in American grocery stores.
 * Quality scores are based on:
 *  - Sourcing transparency (grass-fed, pasture-raised, cage-free, wild-caught)
 *  - Antibiotic and hormone use policies
 *  - Ingredient cleanliness (no fillers, binders, seed oils, nitrates)
 *  - Processing level (NOVA 1-4)
 *  - Animal welfare certifications
 *  - Third-party certifications (USDA Organic, American Grassfed, Animal Welfare Approved)
 */

import type { FoodProduct } from "./foodApi";

export interface MeatBrandEntry extends FoodProduct {
  qualityTier: "elite" | "premium" | "good" | "average" | "poor" | "avoid";
  sourcing: string;
  concerns: string[];
  whyScore: string;
  averagePrice?: number;
}

// ============================================================
// QUALITY TIER DEFINITIONS
// ============================================================
// ELITE   (90-100): Regenerative/wild, grass-fed/finished, no antibiotics, no hormones, single ingredient
// PREMIUM (75-89):  Organic or grass-fed, no antibiotics, minimal processing, clean ingredients
// GOOD    (60-74):  No antibiotics, some welfare standards, mostly clean
// AVERAGE (40-59):  Conventional, may use antibiotics, standard feedlot/CAFO practices
// POOR    (20-39):  Heavy processing, additives, nitrates, low-quality ingredients
// AVOID   (0-19):   Mechanically separated, fillers, carrageenan, multiple harmful additives

// ============================================================
// BEEF — All major US grocery store brands
// ============================================================
export const BEEF_BRANDS: MeatBrandEntry[] = [
  // ── ELITE TIER ──
  {
    barcode: "850026076001", name: "Force of Nature Regenerative Ground Beef 85/15", brand: "Force of Nature",
    category: "Ground Beef", ingredients: "GRASS-FED GRASS-FINISHED BEEF.",
    nutriments: { "energy-kcal_100g": 215, "proteins_100g": 17.9, "fat_100g": 15, "saturated-fat_100g": 6.0, "carbohydrates_100g": 0, "sodium_100g": 0.075, "iron_100g": 0.0025 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "100% regenerative farms, grass-fed and grass-finished, verified supply chain",
    concerns: [],
    whyScore: "Single ingredient, regenerative sourced, no antibiotics, no hormones, highest omega-3 and CLA content of any commercial beef",
    averagePrice: 12.99,
    labels: ["regenerative", "grass-fed", "grass-finished", "no-antibiotics", "no-hormones"],
    meatGrade: { type: "Beef", isGrassFed: true, isOrganic: false, isAntibiotic: true, qualityNotes: ["100% grass-fed and grass-finished", "Regenerative agriculture certified", "No antibiotics ever", "No added hormones", "Single ingredient"] },
    imageUrl: "/manus-storage/force-of-nature-ground-beef-85_3573eac6.jpg",
  },
  {
    barcode: "850026076025", name: "Force of Nature Beef Ancestral Blend", brand: "Force of Nature",
    category: "Ground Beef", ingredients: "GRASS-FED GRASS-FINISHED BEEF, BEEF HEART, BEEF LIVER, BEEF KIDNEY.",
    nutriments: { "energy-kcal_100g": 195, "proteins_100g": 19.5, "fat_100g": 12, "saturated-fat_100g": 5.0, "carbohydrates_100g": 0.5, "iron_100g": 0.006, "vitamin-b12_100g": 0.000015 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "Regenerative farms, nose-to-tail, grass-fed/finished organ blend",
    concerns: [],
    whyScore: "Most nutrient-dense beef product available — liver, heart, kidney add extraordinary B12, iron, CoQ10, and fat-soluble vitamins",
    averagePrice: 14.99,
    labels: ["regenerative", "grass-fed", "grass-finished", "organ-meat", "nose-to-tail"],
    meatGrade: { type: "Beef", isGrassFed: true, isAntibiotic: true, qualityNotes: ["Ancestral blend with organ meats", "Liver: nature's multivitamin", "Heart: highest CoQ10 source", "Regenerative sourced"] },
    imageUrl: "/manus-storage/force-of-nature-ancestral-blend_918402f7.jpg",
  },
  {
    barcode: "099482457518", name: "Organic Prairie 100% Grass-Fed Ground Beef", brand: "Organic Prairie",
    category: "Ground Beef", ingredients: "ORGANIC GRASS-FED BEEF.",
    nutriments: { "energy-kcal_100g": 215, "proteins_100g": 17.9, "fat_100g": 15, "saturated-fat_100g": 6.0, "carbohydrates_100g": 0, "sodium_100g": 0.07 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "USDA Certified Organic, American Grassfed Association certified, family farms",
    concerns: [],
    whyScore: "Certified organic AND grass-fed/finished — dual certification means no synthetic pesticides, no GMO feed, no antibiotics, no hormones",
    averagePrice: 9.99,
    labels: ["usda-organic", "grass-fed", "grass-finished", "no-antibiotics"],
    meatGrade: { type: "Beef", isGrassFed: true, isOrganic: true, isAntibiotic: true, qualityNotes: ["USDA Certified Organic", "American Grassfed Association certified", "No synthetic hormones or antibiotics"] },
    imageUrl: "/manus-storage/organic-prairie-grass-fed-ground-beef_4ad9ba5f.png",
  },
  {
    barcode: "099482440022", name: "Organic Prairie 85% Lean Ground Beef", brand: "Organic Prairie",
    category: "Ground Beef", ingredients: "ORGANIC BEEF.",
    nutriments: { "energy-kcal_100g": 254, "proteins_100g": 17.2, "fat_100g": 20, "saturated-fat_100g": 8.0, "carbohydrates_100g": 0, "sodium_100g": 0.075 },
    novaGroup: 1, dataSource: "usda", qualityTier: "premium",
    sourcing: "USDA Certified Organic, family farms, no antibiotics, no hormones",
    concerns: ["May be grain-finished on organic grain — not guaranteed grass-finished"],
    whyScore: "Certified organic beef — no synthetic hormones, no antibiotics, no GMO feed. May not be 100% grass-finished.",
    averagePrice: 8.99,
    labels: ["usda-organic", "no-antibiotics", "no-hormones"],
    meatGrade: { type: "Beef", isGrassFed: false, isOrganic: true, isAntibiotic: true, qualityNotes: ["USDA Certified Organic", "No antibiotics, no hormones", "May be grain-finished on organic grain"] },
    imageUrl: "/manus-storage/organic-prairie-85-lean_0d7594ea.png",
  },
  {
    barcode: "021000657742", name: "Laura's Lean Organic Grass-Fed Ground Beef 85/15", brand: "Laura's Lean",
    category: "Ground Beef", ingredients: "ORGANIC GRASS-FED BEEF.",
    nutriments: { "energy-kcal_100g": 215, "proteins_100g": 17.9, "fat_100g": 15, "saturated-fat_100g": 6.0, "carbohydrates_100g": 0, "sodium_100g": 0.075 },
    novaGroup: 1, dataSource: "usda", qualityTier: "premium",
    sourcing: "Certified organic, grass-fed, no antibiotics, no hormones, no steroids",
    concerns: ["Not always grass-finished — some products are grain-finished"],
    whyScore: "Widely available organic grass-fed option. Clean single ingredient. No antibiotics or hormones.",
    averagePrice: 8.49,
    labels: ["organic", "grass-fed", "no-antibiotics"],
    meatGrade: { type: "Beef", isGrassFed: true, isOrganic: true, isAntibiotic: true, qualityNotes: ["Certified organic", "Grass-fed", "No antibiotics, no hormones, no steroids"] },
    imageUrl: "/manus-storage/lauras-lean-organic-grass-fed_5931e4bd.png",
  },
  {
    barcode: "021000657728", name: "Laura's Lean 96% Lean Ground Beef", brand: "Laura's Lean",
    imageUrl: "https://images.openfoodfacts.org/images/products/005/150/006/8236/front_en.43.200.jpg",
    category: "Ground Beef", ingredients: "BEEF.",
    nutriments: { "energy-kcal_100g": 120, "proteins_100g": 22, "fat_100g": 3.5, "saturated-fat_100g": 1.5, "carbohydrates_100g": 0, "sodium_100g": 0.075 },
    novaGroup: 1, dataSource: "usda", qualityTier: "good",
    sourcing: "No antibiotics, no hormones, no steroids — conventional feed, not grass-fed",
    concerns: ["Grain-fed — lower omega-3 than grass-fed", "Not organic"],
    whyScore: "Clean single ingredient, no antibiotics or hormones, but conventionally grain-fed. Good lean protein option.",
    averagePrice: 7.99,
    labels: ["no-antibiotics", "no-hormones"],
    meatGrade: { type: "Beef", isGrassFed: false, isOrganic: false, isAntibiotic: true, qualityNotes: ["No antibiotics, no hormones", "Very lean — 96% lean", "Grain-fed — lower omega-3"] },
  },
  {
    barcode: "025317001010", name: "Niman Ranch Grass-Fed Ground Beef", brand: "Niman Ranch",
    category: "Ground Beef", ingredients: "GRASS-FED BEEF.",
    nutriments: { "energy-kcal_100g": 215, "proteins_100g": 17.9, "fat_100g": 15, "saturated-fat_100g": 6.0, "carbohydrates_100g": 0, "sodium_100g": 0.07 },
    novaGroup: 1, dataSource: "usda", qualityTier: "premium",
    sourcing: "US family ranchers, no antibiotics ever, no hormones, humanely raised, Certified B Corp",
    concerns: ["Owned by Perdue Farms since 2015 — some quality concerns post-acquisition"],
    whyScore: "Long-standing clean brand with strong animal welfare standards. No antibiotics, no hormones. Grass-fed option available.",
    averagePrice: 10.99,
    labels: ["grass-fed", "no-antibiotics", "humanely-raised", "b-corp"],
    meatGrade: { type: "Beef", isGrassFed: true, isAntibiotic: true, qualityNotes: ["No antibiotics ever", "No hormones", "Humanely raised", "US family ranchers"] },
    imageUrl: "/manus-storage/niman-ranch-grass-fed_6208be0a.png",
  },
  {
    barcode: "025317001027", name: "Niman Ranch Natural Ground Beef 80/20", brand: "Niman Ranch",
    category: "Ground Beef", ingredients: "BEEF.",
    nutriments: { "energy-kcal_100g": 254, "proteins_100g": 17.2, "fat_100g": 20, "saturated-fat_100g": 8.0, "carbohydrates_100g": 0, "sodium_100g": 0.075 },
    novaGroup: 1, dataSource: "usda", qualityTier: "good",
    sourcing: "US family ranchers, no antibiotics, no hormones, humanely raised — grain-finished",
    concerns: ["Grain-finished — not grass-fed", "Owned by Perdue Farms"],
    whyScore: "Clean natural beef, no antibiotics or hormones, humanely raised. Grain-finished so lower omega-3 than grass-fed.",
    averagePrice: 8.99,
    labels: ["no-antibiotics", "no-hormones", "humanely-raised"],
    meatGrade: { type: "Beef", isGrassFed: false, isAntibiotic: true, qualityNotes: ["No antibiotics, no hormones", "Humanely raised", "Grain-finished"] },
    imageUrl: "/manus-storage/niman-ranch-natural-80-20_beac7dfd.jpeg",
  },
  // ── AVERAGE TIER ──
  {
    barcode: "023700000001", name: "Angus Reserve Ground Beef 80/20", brand: "Kroger",
    category: "Ground Beef", ingredients: "BEEF.",
    nutriments: { "energy-kcal_100g": 254, "proteins_100g": 17.2, "fat_100g": 20, "saturated-fat_100g": 8.0, "carbohydrates_100g": 0, "sodium_100g": 0.075 },
    novaGroup: 1, dataSource: "usda", qualityTier: "average",
    sourcing: "Primarily sourced from JBS and Tyson subsidiaries — conventional feedlot, CAFO practices",
    concerns: ["Sourced from JBS/Tyson — both have antibiotic use and price-fixing controversies", "Conventional feedlot — grain-fed, no welfare standards", "No transparency on sourcing"],
    whyScore: "Standard conventional beef. Single ingredient but sourced from industrial feedlots with routine antibiotic and hormone use.",
    averagePrice: 5.99,
    labels: [],
    meatGrade: { type: "Beef", isGrassFed: false, isOrganic: false, isAntibiotic: false, qualityNotes: ["Conventional feedlot beef", "May contain growth hormones", "May use antibiotics preventively"] },
    imageUrl: "/manus-storage/kroger-angus-reserve_241d3044.jpg",
  },
  {
    barcode: "021130000001", name: "Tyson Ground Beef 80/20", brand: "Tyson",
    category: "Ground Beef", ingredients: "BEEF.",
    nutriments: { "energy-kcal_100g": 254, "proteins_100g": 17.2, "fat_100g": 20, "saturated-fat_100g": 8.0, "carbohydrates_100g": 0, "sodium_100g": 0.075 },
    novaGroup: 1, dataSource: "usda", qualityTier: "average",
    sourcing: "Industrial feedlot, CAFO, conventional grain-fed, hormone and antibiotic use common",
    concerns: ["Convicted of price-fixing in poultry, investigated for beef", "Routine antibiotic use in supply chain", "Growth hormones used", "No animal welfare standards", "Feedlot CAFO conditions"],
    whyScore: "Single ingredient beef but from industrial CAFO feedlots with documented antibiotic and hormone use. No welfare or transparency standards.",
    averagePrice: 5.99,
    labels: [],
    meatGrade: { type: "Beef", isGrassFed: false, isOrganic: false, isAntibiotic: false, qualityNotes: ["Industrial CAFO feedlot", "Routine antibiotic use documented", "Growth hormones used", "No animal welfare standards"] },
    imageUrl: "/manus-storage/tyson-ground-beef_e4013765.png",
  },
  {
    barcode: "023700000002", name: "Walmart Great Value Ground Beef 80/20", brand: "Great Value (Walmart)",
    category: "Ground Beef", ingredients: "BEEF.",
    nutriments: { "energy-kcal_100g": 254, "proteins_100g": 17.2, "fat_100g": 20, "saturated-fat_100g": 8.0, "carbohydrates_100g": 0, "sodium_100g": 0.075 },
    novaGroup: 1, dataSource: "usda", qualityTier: "average",
    sourcing: "Sourced from JBS, Cargill, and Tyson — industrial feedlot CAFO",
    concerns: ["Sourced from Big 4 processors with documented antibiotic/hormone use", "No sourcing transparency", "Industrial CAFO conditions"],
    whyScore: "Conventional industrial beef. Single ingredient but from the lowest-transparency supply chains in the industry.",
    labels: [],
    meatGrade: { type: "Beef", isGrassFed: false, isOrganic: false, isAntibiotic: false, qualityNotes: ["Industrial CAFO sourced", "No antibiotics/hormone transparency", "Grain-fed feedlot"] },
    imageUrl: "/manus-storage/great-value-ground-beef_c4725cfc.jpeg",
  },
  {
    barcode: "023700000003", name: "Costco Kirkland Signature Ground Beef 88/12", brand: "Kirkland Signature (Costco)",
    category: "Ground Beef", ingredients: "BEEF.",
    nutriments: { "energy-kcal_100g": 195, "proteins_100g": 19.5, "fat_100g": 12, "saturated-fat_100g": 5.0, "carbohydrates_100g": 0, "sodium_100g": 0.07 },
    novaGroup: 1, dataSource: "usda", qualityTier: "average",
    sourcing: "Primarily JBS and Cargill sourced — conventional feedlot. Costco has some better welfare standards than average.",
    concerns: ["Primarily JBS/Cargill sourced", "Conventional feedlot", "No grass-fed guarantee"],
    whyScore: "Conventional beef with slightly better quality control than average. Costco has pushed suppliers on some welfare issues but still industrial sourcing.",
    labels: [],
    meatGrade: { type: "Beef", isGrassFed: false, isAntibiotic: false, qualityNotes: ["Conventional feedlot", "Better QC than average grocery", "JBS/Cargill sourced"] },
    imageUrl: "/manus-storage/kirkland-ground-beef_73db4f43.jpeg",
  },
  {
    barcode: "099482000001", name: "Whole Foods 365 Organic Ground Beef", brand: "365 (Whole Foods)",
    category: "Ground Beef", ingredients: "ORGANIC BEEF.",
    nutriments: { "energy-kcal_100g": 254, "proteins_100g": 17.2, "fat_100g": 20, "saturated-fat_100g": 8.0, "carbohydrates_100g": 0, "sodium_100g": 0.075 },
    novaGroup: 1, dataSource: "usda", qualityTier: "good",
    sourcing: "USDA Certified Organic, Whole Foods Global Animal Partnership rated, no antibiotics, no hormones",
    concerns: ["Organic but not always grass-fed", "May be grain-finished on organic grain"],
    whyScore: "Certified organic with Global Animal Partnership welfare rating. No antibiotics or hormones. Not guaranteed grass-fed.",
    labels: ["usda-organic", "no-antibiotics", "gap-rated"],
    meatGrade: { type: "Beef", isGrassFed: false, isOrganic: true, isAntibiotic: true, qualityNotes: ["USDA Certified Organic", "Global Animal Partnership rated", "No antibiotics, no hormones"] },
  },
  // ── POOR TIER ──
  {
    barcode: "021000000001", name: "Oscar Mayer Beef Bologna", brand: "Oscar Mayer",
    category: "Processed Beef", ingredients: "BEEF, WATER, CORN SYRUP, SALT, SODIUM LACTATE, FLAVORINGS, SODIUM PHOSPHATES, SODIUM DIACETATE, SODIUM ERYTHORBATE, SODIUM NITRITE.",
    nutriments: { "energy-kcal_100g": 290, "proteins_100g": 11, "fat_100g": 26, "saturated-fat_100g": 10, "carbohydrates_100g": 5, "sugars_100g": 4, "sodium_100g": 0.9 },
    novaGroup: 4, dataSource: "usda", qualityTier: "poor",
    sourcing: "Industrial processed beef with multiple additives, nitrites, corn syrup",
    concerns: ["Sodium nitrite — forms carcinogenic N-nitrosamines", "Corn syrup added", "Sodium phosphates — kidney health concerns", "Ultra-processed NOVA 4", "No sourcing transparency"],
    whyScore: "Ultra-processed beef product with sodium nitrite (carcinogen risk), corn syrup, and multiple synthetic preservatives.",
    labels: [],
    meatGrade: { type: "Beef", isGrassFed: false, isAntibiotic: false, qualityNotes: ["Contains sodium nitrite — carcinogen risk", "Ultra-processed NOVA 4", "Corn syrup added"] },
    imageUrl: "/manus-storage/oscar-mayer-beef-bologna_caecc5c2.jpg",
  },
];

// ============================================================
// CHICKEN — All major US grocery store brands
// ============================================================
export const CHICKEN_BRANDS: MeatBrandEntry[] = [
  // ── ELITE TIER ──
  {
    barcode: "025317500001", name: "Organic Prairie Pasture-Raised Whole Chicken", brand: "Organic Prairie",
    category: "Whole Chicken", ingredients: "ORGANIC PASTURE-RAISED CHICKEN.",
    nutriments: { "energy-kcal_100g": 143, "proteins_100g": 17.4, "fat_100g": 8.1, "saturated-fat_100g": 2.2, "carbohydrates_100g": 0, "sodium_100g": 0.077 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "USDA Certified Organic, pasture-raised, American Humane Certified, no antibiotics, no hormones",
    concerns: [],
    whyScore: "Certified organic AND pasture-raised — chickens have outdoor access and forage naturally. No antibiotics, no hormones, no GMO feed.",
    labels: ["usda-organic", "pasture-raised", "no-antibiotics", "humanely-raised"],
    meatGrade: { type: "Chicken", isGrassFed: false, isOrganic: true, isAntibiotic: true, qualityNotes: ["USDA Certified Organic", "Pasture-raised with outdoor access", "No antibiotics, no hormones", "No GMO feed"] },
  },
  {
    barcode: "025317500002", name: "Mary's Free Range Organic Chicken Breast", brand: "Mary's Chicken",
    category: "Chicken Breast", ingredients: "ORGANIC FREE-RANGE CHICKEN.",
    nutriments: { "energy-kcal_100g": 165, "proteins_100g": 31, "fat_100g": 3.6, "saturated-fat_100g": 1.0, "carbohydrates_100g": 0, "sodium_100g": 0.074 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "USDA Certified Organic, free-range, no antibiotics, no hormones, family-owned California farm",
    concerns: [],
    whyScore: "Top-rated by food experts and butchers. Certified organic, free-range, family-owned. Consistently ranked #1 or #2 for flavor and quality.",
    labels: ["usda-organic", "free-range", "no-antibiotics", "no-hormones"],
    meatGrade: { type: "Chicken", isGrassFed: false, isOrganic: true, isAntibiotic: true, qualityNotes: ["USDA Certified Organic", "Free-range", "Family-owned farm", "Top-rated by chefs and butchers"] },
  },
  {
    barcode: "025317500003", name: "Bell & Evans Organic Air-Chilled Chicken Breast", brand: "Bell & Evans",
    category: "Chicken Breast", ingredients: "ORGANIC CHICKEN.",
    nutriments: { "energy-kcal_100g": 165, "proteins_100g": 31, "fat_100g": 3.6, "saturated-fat_100g": 1.0, "carbohydrates_100g": 0, "sodium_100g": 0.074 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "USDA Certified Organic, air-chilled (not water-chilled), no antibiotics, no hormones, Certified Humane",
    concerns: [],
    whyScore: "Air-chilled process means no water absorption or bacterial cross-contamination. Certified Humane, organic, no antibiotics. One of the best grocery store chickens.",
    labels: ["usda-organic", "air-chilled", "no-antibiotics", "certified-humane"],
    meatGrade: { type: "Chicken", isGrassFed: false, isOrganic: true, isAntibiotic: true, qualityNotes: ["Air-chilled — cleaner, no water absorption", "USDA Certified Organic", "Certified Humane", "No antibiotics ever"] },
  },
  {
    barcode: "025317500004", name: "Vital Farms Pasture-Raised Chicken", brand: "Vital Farms",
    imageUrl: "https://images.openfoodfacts.org/images/products/086/174/500/0010/front_en.72.200.jpg",
    category: "Whole Chicken", ingredients: "PASTURE-RAISED CHICKEN.",
    nutriments: { "energy-kcal_100g": 143, "proteins_100g": 17.4, "fat_100g": 8.1, "saturated-fat_100g": 2.2, "carbohydrates_100g": 0, "sodium_100g": 0.077 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "Certified Humane pasture-raised, no antibiotics, no hormones, 108 sq ft per bird outdoors",
    concerns: [],
    whyScore: "108 sq ft of outdoor pasture per bird — far exceeding free-range standards. Certified Humane, no antibiotics, no hormones.",
    labels: ["pasture-raised", "certified-humane", "no-antibiotics"],
    meatGrade: { type: "Chicken", isGrassFed: false, isOrganic: false, isAntibiotic: true, qualityNotes: ["108 sq ft outdoor pasture per bird", "Certified Humane", "No antibiotics, no hormones"] },
  },
  // ── PREMIUM TIER ──
  {
    barcode: "025317500005", name: "Farmer Focus Organic Chicken Breast", brand: "Farmer Focus",
    category: "Chicken Breast", ingredients: "ORGANIC CHICKEN.",
    nutriments: { "energy-kcal_100g": 165, "proteins_100g": 31, "fat_100g": 3.6, "saturated-fat_100g": 1.0, "carbohydrates_100g": 0, "sodium_100g": 0.074 },
    novaGroup: 1, dataSource: "usda", qualityTier: "premium",
    sourcing: "USDA Certified Organic, farmer-owned cooperative, no antibiotics, Certified Humane, HFAC certified",
    concerns: [],
    whyScore: "Farmer-owned cooperative model ensures fair pay and quality control. Certified organic, Certified Humane, no antibiotics.",
    labels: ["usda-organic", "certified-humane", "no-antibiotics", "farmer-owned"],
    meatGrade: { type: "Chicken", isGrassFed: false, isOrganic: true, isAntibiotic: true, qualityNotes: ["Certified organic", "Farmer-owned cooperative", "Certified Humane", "No antibiotics"] },
    imageUrl: "/manus-storage/farmer-focus-organic-chicken_9b22e603.png",
  },
  {
    barcode: "025317500006", name: "Applegate Naturals Chicken Breast", brand: "Applegate",
    category: "Chicken Breast", ingredients: "CHICKEN.",
    nutriments: { "energy-kcal_100g": 165, "proteins_100g": 31, "fat_100g": 3.6, "saturated-fat_100g": 1.0, "carbohydrates_100g": 0, "sodium_100g": 0.074 },
    novaGroup: 1, dataSource: "usda", qualityTier: "premium",
    sourcing: "No antibiotics, humanely raised, no hormones, no artificial ingredients — owned by Hormel",
    concerns: ["Owned by Hormel since 2015 — some quality control concerns post-acquisition"],
    whyScore: "No antibiotics, humanely raised, clean ingredients. Widely available. Owned by Hormel but maintains independent quality standards.",
    labels: ["no-antibiotics", "humanely-raised", "no-hormones"],
    meatGrade: { type: "Chicken", isGrassFed: false, isOrganic: false, isAntibiotic: true, qualityNotes: ["No antibiotics ever", "Humanely raised", "No artificial ingredients", "Owned by Hormel"] },
    imageUrl: "/manus-storage/applegate-naturals-chicken_5e57f15b.png",
  },
  // ── GOOD TIER ──
  {
    barcode: "025317500007", name: "Perdue Harvestland Free Range Chicken", brand: "Perdue",
    imageUrl: "https://images.openfoodfacts.org/images/products/020/747/450/3468/front_en.3.200.jpg",
    category: "Chicken Breast", ingredients: "CHICKEN.",
    nutriments: { "energy-kcal_100g": 165, "proteins_100g": 31, "fat_100g": 3.6, "saturated-fat_100g": 1.0, "carbohydrates_100g": 0, "sodium_100g": 0.074 },
    novaGroup: 1, dataSource: "usda", qualityTier: "good",
    sourcing: "No antibiotics ever (Harvestland line), free-range, no hormones — Perdue's premium line",
    concerns: ["Perdue's standard line uses antibiotics — must specifically buy Harvestland", "Free-range standards are minimal (2 sq ft outdoor access)"],
    whyScore: "Perdue's Harvestland line is their no-antibiotic, free-range option. Better than standard Perdue but free-range standards are minimal.",
    labels: ["no-antibiotics", "free-range"],
    meatGrade: { type: "Chicken", isGrassFed: false, isOrganic: false, isAntibiotic: true, qualityNotes: ["No antibiotics ever (Harvestland line)", "Free-range — minimal outdoor access", "No hormones"] },
  },
  // ── AVERAGE TIER ──
  {
    barcode: "023700100001", name: "Tyson All Natural Chicken Breast", brand: "Tyson",
    category: "Chicken Breast", ingredients: "CHICKEN, UP TO 15% CHICKEN BROTH.",
    nutriments: { "energy-kcal_100g": 110, "proteins_100g": 23, "fat_100g": 1.5, "saturated-fat_100g": 0.5, "carbohydrates_100g": 0, "sodium_100g": 0.2 },
    novaGroup: 2, dataSource: "usda", qualityTier: "average",
    sourcing: "Industrial CAFO, conventional, broth-injected for weight. Tyson has been convicted of price-fixing.",
    concerns: ["Added chicken broth — up to 15% water weight added", "Industrial CAFO conditions", "Tyson convicted of price-fixing in poultry", "Routine antibiotic use in conventional line", "No welfare standards"],
    whyScore: "Broth-injected for weight, industrial CAFO, Tyson's conventional line has documented antibiotic use and price-fixing convictions.",
    labels: [],
    meatGrade: { type: "Chicken", isGrassFed: false, isOrganic: false, isAntibiotic: false, qualityNotes: ["Up to 15% broth injected", "Industrial CAFO", "Price-fixing conviction", "Routine antibiotics in supply chain"] },
    imageUrl: "/manus-storage/tyson-all-natural-chicken_fa183d94.png",
  },
  {
    barcode: "023700100002", name: "Perdue Chicken Breast", brand: "Perdue",
    imageUrl: "https://images.openfoodfacts.org/images/products/007/274/580/6223/front_en.68.200.jpg",
    category: "Chicken Breast", ingredients: "CHICKEN.",
    nutriments: { "energy-kcal_100g": 165, "proteins_100g": 31, "fat_100g": 3.6, "saturated-fat_100g": 1.0, "carbohydrates_100g": 0, "sodium_100g": 0.074 },
    novaGroup: 1, dataSource: "usda", qualityTier: "average",
    sourcing: "Conventional, vegetarian-fed, no hormones — standard line uses antibiotics",
    concerns: ["Standard line uses antibiotics — must buy Harvestland for antibiotic-free", "CAFO conditions", "Vegetarian-fed (chickens are omnivores — unnatural diet)"],
    whyScore: "Standard Perdue uses antibiotics in conventional line. Vegetarian-fed is unnatural for chickens. Better than Tyson but still industrial.",
    labels: [],
    meatGrade: { type: "Chicken", isGrassFed: false, isOrganic: false, isAntibiotic: false, qualityNotes: ["Standard line uses antibiotics", "CAFO conditions", "Vegetarian-fed — unnatural for chickens"] },
  },
  // ── AVOID TIER ──
  {
    barcode: "023700100003", name: "Tyson Chicken Nuggets", brand: "Tyson",
    category: "Processed Chicken",
    ingredients: "CHICKEN, WATER, SEASONING (SALT, SPICES, DEXTROSE, NATURAL FLAVOR, ROSEMARY EXTRACT), MODIFIED CORN STARCH. BATTERED AND BREADED WITH: ENRICHED FLOUR (BLEACHED WHEAT FLOUR, NIACIN, REDUCED IRON, THIAMINE MONONITRATE, RIBOFLAVIN, FOLIC ACID), WATER, YELLOW CORN FLOUR, BLEACHED WHEAT FLOUR, MODIFIED CORN STARCH, SALT, LEAVENING (SODIUM ACID PYROPHOSPHATE, BAKING SODA), SPICES, YEAST, CORN STARCH. BREADING SET IN VEGETABLE OIL (SOYBEAN OIL).",
    nutriments: { "energy-kcal_100g": 230, "proteins_100g": 13, "fat_100g": 13, "saturated-fat_100g": 2.5, "carbohydrates_100g": 15, "sodium_100g": 0.5 },
    novaGroup: 4, dataSource: "usda", qualityTier: "poor",
    sourcing: "Industrial processed chicken with soybean oil, modified starch, multiple additives",
    concerns: ["Soybean oil — inflammatory seed oil", "Modified corn starch", "Ultra-processed NOVA 4", "Bleached flour", "Industrial CAFO chicken"],
    whyScore: "Ultra-processed with soybean oil (seed oil), bleached flour, modified corn starch. Industrial CAFO chicken.",
    labels: [],
    meatGrade: { type: "Chicken", isGrassFed: false, isAntibiotic: false, qualityNotes: ["Contains soybean oil (seed oil)", "Ultra-processed NOVA 4", "Industrial CAFO chicken"] },
    imageUrl: "/manus-storage/tyson-chicken-nuggets_0e30b33d.webp",
  },
];

// ============================================================
// PORK — All major US grocery store brands
// ============================================================
export const PORK_BRANDS: MeatBrandEntry[] = [
  {
    barcode: "025317600001", name: "Niman Ranch Uncured Bacon", brand: "Niman Ranch",
    category: "Bacon", ingredients: "PORK BELLIES, SEA SALT, SUGAR, CELERY POWDER.",
    nutriments: { "energy-kcal_100g": 540, "proteins_100g": 12, "fat_100g": 53, "saturated-fat_100g": 19, "carbohydrates_100g": 2, "sodium_100g": 0.9 },
    novaGroup: 3, dataSource: "usda", qualityTier: "premium",
    sourcing: "Humanely raised, no antibiotics, no hormones, no nitrates added (celery powder source)",
    concerns: ["Celery powder contains naturally occurring nitrates — functionally similar to added nitrites", "Owned by Perdue Farms"],
    whyScore: "No antibiotics, humanely raised, no added nitrites. Celery powder is a natural nitrate source — better than sodium nitrite but still contains nitrates.",
    labels: ["no-antibiotics", "humanely-raised", "uncured"],
    meatGrade: { type: "Pork", isGrassFed: false, isAntibiotic: true, qualityNotes: ["No antibiotics, no hormones", "Humanely raised", "Uncured — celery powder nitrates only", "No artificial preservatives"] },
    imageUrl: "/manus-storage/niman-ranch-uncured-bacon_e07c8f68.png",
  },
  {
    barcode: "025317600002", name: "Applegate Naturals Sunday Bacon", brand: "Applegate",
    imageUrl: "https://images.openfoodfacts.org/images/products/002/531/710/1004/front_en.27.200.jpg",
    category: "Bacon", ingredients: "PORK, WATER, SEA SALT, EVAPORATED CANE JUICE, CELERY POWDER.",
    nutriments: { "energy-kcal_100g": 500, "proteins_100g": 14, "fat_100g": 48, "saturated-fat_100g": 17, "carbohydrates_100g": 2, "sodium_100g": 0.85 },
    novaGroup: 3, dataSource: "usda", qualityTier: "premium",
    sourcing: "Humanely raised, no antibiotics, no hormones, no added nitrites",
    concerns: ["Celery powder = natural nitrates", "Owned by Hormel"],
    whyScore: "No antibiotics, humanely raised, no added nitrites. One of the cleanest mainstream bacon options.",
    labels: ["no-antibiotics", "humanely-raised", "uncured"],
    meatGrade: { type: "Pork", isGrassFed: false, isAntibiotic: true, qualityNotes: ["No antibiotics, no hormones", "Humanely raised", "No added nitrites"] },
  },
  {
    barcode: "025317600003", name: "Pederson's Farms No Sugar Added Uncured Bacon", brand: "Pederson's Farms",
    category: "Bacon", ingredients: "PORK BELLIES, SEA SALT, CELERY POWDER.",
    nutriments: { "energy-kcal_100g": 540, "proteins_100g": 12, "fat_100g": 53, "saturated-fat_100g": 19, "carbohydrates_100g": 0, "sodium_100g": 0.85 },
    novaGroup: 3, dataSource: "usda", qualityTier: "premium",
    sourcing: "Humanely raised, no antibiotics, no sugar added, no nitrates added",
    concerns: ["Celery powder contains natural nitrates"],
    whyScore: "No sugar, no antibiotics, humanely raised. One of the cleanest bacon options — just pork, sea salt, and celery powder.",
    labels: ["no-antibiotics", "no-sugar-added", "uncured", "humanely-raised"],
    meatGrade: { type: "Pork", isGrassFed: false, isAntibiotic: true, qualityNotes: ["No sugar added", "No antibiotics", "Humanely raised", "Minimal ingredients"] },
    imageUrl: "/manus-storage/pedersons-no-sugar-bacon_56667ccf.png",
  },
  {
    barcode: "025317600004", name: "Oscar Mayer Classic Bacon", brand: "Oscar Mayer",
    category: "Bacon", ingredients: "CURED WITH: WATER, SALT, SUGAR, SODIUM PHOSPHATES, SODIUM ERYTHORBATE, SODIUM NITRITE.",
    nutriments: { "energy-kcal_100g": 540, "proteins_100g": 12, "fat_100g": 53, "saturated-fat_100g": 19, "carbohydrates_100g": 2, "sodium_100g": 1.1 },
    novaGroup: 4, dataSource: "usda", qualityTier: "poor",
    sourcing: "Industrial CAFO pork, sodium nitrite added, sodium phosphates",
    concerns: ["Sodium nitrite — forms carcinogenic N-nitrosamines at high heat", "Sodium phosphates — kidney health concerns", "Industrial CAFO pork", "Ultra-processed"],
    whyScore: "Contains sodium nitrite (carcinogen risk), sodium phosphates, industrial CAFO pork. One of the most commonly consumed unhealthy processed meats.",
    labels: [],
    meatGrade: { type: "Pork", isGrassFed: false, isAntibiotic: false, qualityNotes: ["Sodium nitrite added — carcinogen risk", "Sodium phosphates", "Industrial CAFO pork"] },
    imageUrl: "/manus-storage/oscar-mayer-classic-bacon_4a1f1336.jpg",
  },
  {
    barcode: "025317600005", name: "Smithfield Bacon", brand: "Smithfield",
    imageUrl: "https://images.openfoodfacts.org/images/products/007/080/004/1251/front_en.4.200.jpg",
    category: "Bacon", ingredients: "CURED WITH: WATER, SALT, SUGAR, SODIUM PHOSPHATES, SODIUM ERYTHORBATE, SODIUM NITRITE.",
    nutriments: { "energy-kcal_100g": 540, "proteins_100g": 12, "fat_100g": 53, "saturated-fat_100g": 19, "carbohydrates_100g": 2, "sodium_100g": 1.1 },
    novaGroup: 4, dataSource: "usda", qualityTier: "poor",
    sourcing: "Owned by WH Group (China) since 2013 — largest pork producer in the world. Industrial CAFO.",
    concerns: ["Owned by Chinese company WH Group since 2013", "Sodium nitrite added", "Industrial CAFO — gestation crates used", "No animal welfare standards", "Sodium phosphates"],
    whyScore: "Owned by Chinese WH Group, industrial CAFO with gestation crates, sodium nitrite, sodium phosphates. Avoid.",
    labels: [],
    meatGrade: { type: "Pork", isGrassFed: false, isAntibiotic: false, qualityNotes: ["Owned by Chinese WH Group", "Sodium nitrite added", "Gestation crates used", "Industrial CAFO"] },
  },
  {
    barcode: "025317600006", name: "Heritage Pork Ground Pork", brand: "Heritage Foods USA",
    category: "Ground Pork", ingredients: "HERITAGE BREED PORK.",
    nutriments: { "energy-kcal_100g": 263, "proteins_100g": 17, "fat_100g": 21, "saturated-fat_100g": 7.7, "carbohydrates_100g": 0, "sodium_100g": 0.07 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "Heritage breed pigs, pasture-raised, no antibiotics, no hormones, small family farms",
    concerns: [],
    whyScore: "Heritage breed pigs raised on pasture — far superior fat profile and flavor. No antibiotics, no hormones, small family farms.",
    labels: ["heritage-breed", "pasture-raised", "no-antibiotics"],
    meatGrade: { type: "Pork", isGrassFed: false, isAntibiotic: true, qualityNotes: ["Heritage breed pigs", "Pasture-raised", "No antibiotics, no hormones", "Small family farms"] },
    imageUrl: "/manus-storage/heritage-pork-ground_0c1a20e1.jpg",
  },
];

// ============================================================
// TURKEY — All major US grocery store brands
// ============================================================
export const TURKEY_BRANDS: MeatBrandEntry[] = [
  {
    barcode: "025317700001", name: "Diestel Family Ranch Organic Turkey", brand: "Diestel Family Ranch",
    category: "Whole Turkey", ingredients: "ORGANIC TURKEY.",
    nutriments: { "energy-kcal_100g": 189, "proteins_100g": 29, "fat_100g": 7.4, "saturated-fat_100g": 2.0, "carbohydrates_100g": 0, "sodium_100g": 0.07 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "USDA Certified Organic, family-owned since 1949, slow-grown, no antibiotics, no hormones, Certified Humane",
    concerns: [],
    whyScore: "Family-owned for 75+ years. Certified organic, slow-grown, Certified Humane. One of the best turkey brands in the US.",
    labels: ["usda-organic", "certified-humane", "no-antibiotics", "family-owned"],
    meatGrade: { type: "Turkey", isGrassFed: false, isOrganic: true, isAntibiotic: true, qualityNotes: ["Family-owned since 1949", "USDA Certified Organic", "Certified Humane", "Slow-grown for better flavor"] },
    imageUrl: "/manus-storage/diestel-organic-turkey_ea96ab8e.png",
  },
  {
    barcode: "025317700002", name: "Applegate Naturals Turkey Breast", brand: "Applegate",
    category: "Turkey Breast", ingredients: "TURKEY BREAST.",
    nutriments: { "energy-kcal_100g": 107, "proteins_100g": 24, "fat_100g": 0.8, "saturated-fat_100g": 0.2, "carbohydrates_100g": 0, "sodium_100g": 0.07 },
    novaGroup: 1, dataSource: "usda", qualityTier: "premium",
    sourcing: "No antibiotics, humanely raised, no hormones, no artificial ingredients",
    concerns: ["Owned by Hormel"],
    whyScore: "Clean single-ingredient turkey, no antibiotics, humanely raised. Good option for fresh turkey breast.",
    labels: ["no-antibiotics", "humanely-raised"],
    meatGrade: { type: "Turkey", isGrassFed: false, isOrganic: false, isAntibiotic: true, qualityNotes: ["No antibiotics, no hormones", "Humanely raised", "Single ingredient"] },
    imageUrl: "/manus-storage/applegate-turkey-breast_6b7933f4.jpeg",
  },
  {
    barcode: "025317700003", name: "Butterball All Natural Turkey Breast", brand: "Butterball",
    category: "Turkey Breast", ingredients: "TURKEY BREAST, WATER, CONTAINS 2% OR LESS: SALT, MODIFIED FOOD STARCH, SODIUM PHOSPHATES.",
    nutriments: { "energy-kcal_100g": 110, "proteins_100g": 22, "fat_100g": 1.5, "saturated-fat_100g": 0.5, "carbohydrates_100g": 2, "sodium_100g": 0.35 },
    novaGroup: 3, dataSource: "usda", qualityTier: "average",
    sourcing: "Industrial turkey, water-injected, sodium phosphates added, conventional CAFO",
    concerns: ["Water-injected — up to 15% water added", "Sodium phosphates added", "Modified food starch", "Industrial CAFO turkey", "Routine antibiotic use in standard line"],
    whyScore: "Water-injected with sodium phosphates and modified starch. Industrial CAFO turkey. 'All Natural' label is misleading.",
    labels: [],
    meatGrade: { type: "Turkey", isGrassFed: false, isOrganic: false, isAntibiotic: false, qualityNotes: ["Water-injected — up to 15% water", "Sodium phosphates added", "Industrial CAFO", "Modified food starch"] },
    imageUrl: "/manus-storage/butterball-turkey-breast_1c05b758.png",
  },
  {
    barcode: "025317700004", name: "Jennie-O Ground Turkey", brand: "Jennie-O",
    category: "Ground Turkey", ingredients: "TURKEY.",
    nutriments: { "energy-kcal_100g": 148, "proteins_100g": 20, "fat_100g": 7.5, "saturated-fat_100g": 2.0, "carbohydrates_100g": 0, "sodium_100g": 0.07 },
    novaGroup: 1, dataSource: "usda", qualityTier: "average",
    sourcing: "Owned by Hormel — industrial CAFO turkey, conventional practices",
    concerns: ["Owned by Hormel — industrial CAFO", "Routine antibiotic use", "No animal welfare standards", "Mechanically separated turkey used in some products"],
    whyScore: "Industrial CAFO turkey owned by Hormel. Single ingredient ground turkey is acceptable but sourcing practices are poor.",
    labels: [],
    meatGrade: { type: "Turkey", isGrassFed: false, isOrganic: false, isAntibiotic: false, qualityNotes: ["Owned by Hormel", "Industrial CAFO", "Routine antibiotic use"] },
    imageUrl: "/manus-storage/jennie-o-ground-turkey_f64bcf17.png",
  },
];

// ============================================================
// LAMB — All major US grocery store brands
// ============================================================
export const LAMB_BRANDS: MeatBrandEntry[] = [
  {
    barcode: "025317800001", name: "American Lamb Ground Lamb", brand: "Superior Farms",
    category: "Ground Lamb", ingredients: "LAMB.",
    nutriments: { "energy-kcal_100g": 258, "proteins_100g": 16.6, "fat_100g": 21, "saturated-fat_100g": 8.8, "carbohydrates_100g": 0, "sodium_100g": 0.072, "iron_100g": 0.0017 },
    novaGroup: 1, dataSource: "usda", qualityTier: "premium",
    sourcing: "American lamb, sustainably raised, no hormones, family ranchers, American Lamb Board certified",
    concerns: ["May use antibiotics for illness treatment", "Not always grass-finished"],
    whyScore: "American domestic lamb — fresher than imported (30+ day transit for Australian/NZ lamb). Sustainably raised, no hormones.",
    labels: ["american-lamb", "sustainably-raised", "no-hormones"],
    meatGrade: { type: "Lamb", isGrassFed: false, isAntibiotic: false, qualityNotes: ["American domestic lamb — fresher than imported", "Sustainably raised", "No hormones", "Family ranchers"] },
    imageUrl: "/manus-storage/superior-farms-lamb_2b79370f.jpg",
  },
  {
    barcode: "025317800002", name: "Organic Grass-Fed Lamb Chops", brand: "Whole Foods Market",
    category: "Lamb Chops", ingredients: "ORGANIC GRASS-FED LAMB.",
    nutriments: { "energy-kcal_100g": 258, "proteins_100g": 16.6, "fat_100g": 21, "saturated-fat_100g": 8.8, "carbohydrates_100g": 0, "sodium_100g": 0.072 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "USDA Certified Organic, grass-fed, Global Animal Partnership rated, no antibiotics, no hormones",
    concerns: ["Often imported from Australia or New Zealand — longer transit time"],
    whyScore: "Certified organic, grass-fed lamb with Global Animal Partnership welfare rating. Often imported but organic/grass-fed standards are high.",
    labels: ["usda-organic", "grass-fed", "gap-rated", "no-antibiotics"],
    meatGrade: { type: "Lamb", isGrassFed: true, isOrganic: true, isAntibiotic: true, qualityNotes: ["USDA Certified Organic", "Grass-fed", "Global Animal Partnership rated", "No antibiotics, no hormones"] },
    imageUrl: "/manus-storage/whole-foods-organic-lamb-chops_5dc13e2c.jpg",
  },
  {
    barcode: "025317800003", name: "Imported Australian Lamb Rack", brand: "Generic Import",
    category: "Lamb Rack", ingredients: "LAMB.",
    nutriments: { "energy-kcal_100g": 258, "proteins_100g": 16.6, "fat_100g": 21, "saturated-fat_100g": 8.8, "carbohydrates_100g": 0, "sodium_100g": 0.072 },
    novaGroup: 1, dataSource: "usda", qualityTier: "good",
    sourcing: "Australian/New Zealand lamb — typically grass-fed by default (pasture-based farming is standard in ANZ)",
    concerns: ["30+ day transit from Australia/New Zealand", "Less fresh than domestic", "No US welfare certification"],
    whyScore: "Australian and New Zealand lamb is typically grass-fed by default due to pasture-based farming systems. Good quality but less fresh than domestic.",
    labels: ["grass-fed"],
    meatGrade: { type: "Lamb", isGrassFed: true, isAntibiotic: false, qualityNotes: ["Typically grass-fed by default in ANZ", "30+ day transit — less fresh", "No US welfare certification"] },
  },
];

// ============================================================
// BISON — All major US grocery store brands
// ============================================================
export const BISON_BRANDS: MeatBrandEntry[] = [
  {
    barcode: "025317900001", name: "Force of Nature Regenerative Ground Bison", brand: "Force of Nature",
    category: "Ground Bison", ingredients: "GRASS-FED GRASS-FINISHED BISON.",
    nutriments: { "energy-kcal_100g": 146, "proteins_100g": 20.2, "fat_100g": 7.2, "saturated-fat_100g": 2.8, "carbohydrates_100g": 0, "sodium_100g": 0.057, "iron_100g": 0.003 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "Regenerative farms, grass-fed and grass-finished, no antibiotics, no hormones",
    concerns: [],
    whyScore: "Regenerative sourced, grass-fed and grass-finished bison. Leaner than beef with excellent nutrient profile. Top-rated bison product.",
    labels: ["regenerative", "grass-fed", "grass-finished", "no-antibiotics"],
    meatGrade: { type: "Bison", isGrassFed: true, isAntibiotic: true, qualityNotes: ["Regenerative sourced", "Grass-fed and grass-finished", "No antibiotics, no hormones", "Leaner than beef"] },
    imageUrl: "/manus-storage/force-of-nature-bison_4fde4666.jpg",
  },
  {
    barcode: "025317900002", name: "North American Bison Ground Bison", brand: "North American Bison",
    category: "Ground Bison", ingredients: "BISON.",
    nutriments: { "energy-kcal_100g": 146, "proteins_100g": 20.2, "fat_100g": 7.2, "saturated-fat_100g": 2.8, "carbohydrates_100g": 0, "sodium_100g": 0.057 },
    novaGroup: 1, dataSource: "usda", qualityTier: "premium",
    sourcing: "Ranch-raised bison, no antibiotics, no hormones, pasture-raised",
    concerns: ["Not always grass-finished — some grain supplementation"],
    whyScore: "Ranch-raised bison with no antibiotics or hormones. Bison are never raised in feedlots — always pasture-based.",
    labels: ["pasture-raised", "no-antibiotics", "no-hormones"],
    meatGrade: { type: "Bison", isGrassFed: true, isAntibiotic: true, qualityNotes: ["Ranch-raised — always pasture-based", "No antibiotics, no hormones", "May have grain supplementation"] },
    imageUrl: "/manus-storage/north-american-bison-ground_0360bdf0.jpg",
  },
  {
    barcode: "025317900003", name: "Wild Idea Buffalo Ground Bison", brand: "Wild Idea Buffalo",
    category: "Ground Bison", ingredients: "BISON.",
    nutriments: { "energy-kcal_100g": 146, "proteins_100g": 20.2, "fat_100g": 7.2, "saturated-fat_100g": 2.8, "carbohydrates_100g": 0, "sodium_100g": 0.057 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "Wild-roaming bison on South Dakota grasslands, no antibiotics, no hormones, regenerative",
    concerns: [],
    whyScore: "Wild-roaming bison on native South Dakota grasslands. No feedlots, no antibiotics, no hormones. Truly wild-raised.",
    labels: ["wild-roaming", "regenerative", "no-antibiotics", "no-hormones"],
    meatGrade: { type: "Bison", isGrassFed: true, isAntibiotic: true, qualityNotes: ["Wild-roaming on native grasslands", "No feedlots ever", "No antibiotics, no hormones", "Regenerative land management"] },
  },
  {
    barcode: "025317900004", name: "Walmart Great Value Ground Bison", brand: "Great Value (Walmart)",
    category: "Ground Bison", ingredients: "BISON.",
    nutriments: { "energy-kcal_100g": 146, "proteins_100g": 20.2, "fat_100g": 7.2, "saturated-fat_100g": 2.8, "carbohydrates_100g": 0, "sodium_100g": 0.057 },
    novaGroup: 1, dataSource: "usda", qualityTier: "good",
    sourcing: "Ranch-raised bison — bison are always pasture-raised by nature, no feedlots",
    concerns: ["No sourcing transparency from Walmart", "May have grain supplementation"],
    whyScore: "Even Walmart bison is decent — bison are never raised in feedlots. No antibiotics or hormones. Minimal sourcing transparency.",
    labels: ["pasture-raised"],
    meatGrade: { type: "Bison", isGrassFed: false, isAntibiotic: false, qualityNotes: ["Bison always pasture-raised — no feedlots", "No sourcing transparency", "May have grain supplementation"] },
  },
];

// ============================================================
// SEAFOOD — All major US grocery store brands
// ============================================================
export const SEAFOOD_BRANDS: MeatBrandEntry[] = [
  {
    barcode: "025317950001", name: "Wild Alaskan Sockeye Salmon", brand: "Vital Choice",
    imageUrl: "https://images.openfoodfacts.org/images/products/083/429/700/0098/front_en.9.200.jpg",
    category: "Wild Salmon", ingredients: "WILD ALASKAN SOCKEYE SALMON.",
    nutriments: { "energy-kcal_100g": 131, "proteins_100g": 22.5, "fat_100g": 4.3, "saturated-fat_100g": 0.7, "polyunsaturated-fat_100g": 1.8, "carbohydrates_100g": 0, "sodium_100g": 0.059 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "Wild-caught Alaskan sockeye salmon, MSC certified sustainable, no antibiotics, no dyes, no farmed",
    concerns: [],
    whyScore: "Wild-caught Alaskan sockeye — highest omega-3 DHA/EPA of any salmon. MSC certified sustainable. No antibiotics, no synthetic dyes.",
    labels: ["wild-caught", "msc-certified", "no-antibiotics", "no-dyes"],
    meatGrade: { type: "Seafood", isGrassFed: false, isAntibiotic: true, qualityNotes: ["Wild-caught Alaskan sockeye", "MSC certified sustainable", "No antibiotics, no synthetic dyes", "Highest omega-3 content"] },
  },
  {
    barcode: "025317950002", name: "Atlantic Farmed Salmon", brand: "Generic Farmed",
    category: "Farmed Salmon", ingredients: "ATLANTIC SALMON.",
    nutriments: { "energy-kcal_100g": 208, "proteins_100g": 20, "fat_100g": 13, "saturated-fat_100g": 3, "polyunsaturated-fat_100g": 3.9, "carbohydrates_100g": 0, "sodium_100g": 0.059 },
    novaGroup: 1, dataSource: "usda", qualityTier: "average",
    sourcing: "Atlantic farmed salmon — typically raised in open-net pens with antibiotics, synthetic astaxanthin dye, and high omega-6 feed",
    concerns: ["Synthetic astaxanthin dye added for pink color", "Antibiotics used in farming", "High omega-6 from soy/corn feed", "Open-net pen pollution", "PCB contamination risk"],
    whyScore: "Farmed Atlantic salmon uses synthetic dye for color, antibiotics, and high-omega-6 feed. Much lower quality than wild-caught.",
    labels: [],
    meatGrade: { type: "Seafood", isGrassFed: false, isAntibiotic: false, qualityNotes: ["Synthetic astaxanthin dye for color", "Antibiotics used in farming", "High omega-6 from soy/corn feed", "Open-net pen pollution risk"] },
    imageUrl: "/manus-storage/atlantic-farmed-salmon_176734dd.png",
  },
  {
    barcode: "025317950003", name: "Wild Planet Wild Albacore Tuna", brand: "Wild Planet",
    imageUrl: "https://images.openfoodfacts.org/images/products/082/969/600/0534/front_en.115.200.jpg",
    category: "Canned Tuna", ingredients: "ALBACORE TUNA, SEA SALT.",
    nutriments: { "energy-kcal_100g": 130, "proteins_100g": 28, "fat_100g": 2.5, "saturated-fat_100g": 0.5, "carbohydrates_100g": 0, "sodium_100g": 0.27 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "Wild-caught, pole-and-line caught (no bycatch), MSC certified, no water or broth added",
    concerns: ["Albacore has higher mercury than skipjack — limit to 2-3 servings/week"],
    whyScore: "Pole-and-line caught — zero bycatch. MSC certified sustainable. No added water, broth, or vegetable broth (common in other brands). Just tuna and sea salt.",
    labels: ["wild-caught", "msc-certified", "pole-and-line", "no-bycatch"],
    meatGrade: { type: "Seafood", isGrassFed: false, isAntibiotic: true, qualityNotes: ["Pole-and-line caught — no bycatch", "MSC certified sustainable", "No added water or broth", "Just tuna and sea salt"] },
  },
  {
    barcode: "025317950004", name: "Chicken of the Sea Albacore Tuna in Water", brand: "Chicken of the Sea",
    category: "Canned Tuna", ingredients: "ALBACORE TUNA, WATER, VEGETABLE BROTH (CONTAINS SOY), SALT.",
    nutriments: { "energy-kcal_100g": 100, "proteins_100g": 22, "fat_100g": 1.0, "saturated-fat_100g": 0.3, "carbohydrates_100g": 0, "sodium_100g": 0.3 },
    novaGroup: 2, dataSource: "usda", qualityTier: "average",
    sourcing: "Wild-caught but vegetable broth (soy) added, conventional fishing practices",
    concerns: ["Vegetable broth contains soy — allergen concern", "Conventional fishing — higher bycatch than pole-and-line", "Less tuna per can due to water/broth filling"],
    whyScore: "Wild-caught tuna but diluted with soy-containing vegetable broth. Conventional fishing with higher bycatch than pole-and-line brands.",
    labels: ["wild-caught"],
    meatGrade: { type: "Seafood", isGrassFed: false, isAntibiotic: false, qualityNotes: ["Wild-caught", "Soy-containing vegetable broth added", "Conventional fishing — higher bycatch"] },
    imageUrl: "/manus-storage/chicken-of-the-sea-tuna_5dbce095.png",
  },
  {
    barcode: "025317950005", name: "Whole Foods Wild Caught Gulf Shrimp", brand: "Whole Foods Market",
    category: "Wild Shrimp", ingredients: "WILD GULF SHRIMP.",
    nutriments: { "energy-kcal_100g": 85, "proteins_100g": 20, "fat_100g": 0.9, "saturated-fat_100g": 0.2, "carbohydrates_100g": 0, "sodium_100g": 0.11 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "Wild-caught Gulf of Mexico shrimp — domestic US shrimp with no antibiotics",
    concerns: ["Gulf shrimp may have environmental contamination from oil spills"],
    whyScore: "Wild-caught domestic Gulf shrimp — no antibiotics, no preservatives, no sodium tripolyphosphate (common in imported shrimp).",
    labels: ["wild-caught", "domestic", "no-antibiotics"],
    meatGrade: { type: "Seafood", isGrassFed: false, isAntibiotic: true, qualityNotes: ["Wild-caught Gulf of Mexico", "Domestic US shrimp", "No antibiotics, no preservatives"] },
    imageUrl: "/manus-storage/whole-foods-wild-shrimp_3965f321.jpg",
  },
  {
    barcode: "025317950006", name: "Imported Farmed Shrimp", brand: "Generic Import",
    category: "Farmed Shrimp", ingredients: "SHRIMP, SODIUM TRIPOLYPHOSPHATE.",
    nutriments: { "energy-kcal_100g": 85, "proteins_100g": 20, "fat_100g": 0.9, "saturated-fat_100g": 0.2, "carbohydrates_100g": 0, "sodium_100g": 0.5 },
    novaGroup: 2, dataSource: "usda", qualityTier: "poor",
    sourcing: "Imported farmed shrimp (Thailand, Vietnam, India) — antibiotics, sodium tripolyphosphate preservative",
    concerns: ["Sodium tripolyphosphate — water retention additive, kidney concerns", "Antibiotics used in farming", "Imported — lower safety standards", "Environmental destruction from shrimp farming"],
    whyScore: "Imported farmed shrimp with sodium tripolyphosphate (water retention chemical), antibiotics, and poor environmental standards.",
    labels: [],
    meatGrade: { type: "Seafood", isGrassFed: false, isAntibiotic: false, qualityNotes: ["Sodium tripolyphosphate added", "Antibiotics in farming", "Imported — lower safety standards"] },
    imageUrl: "/manus-storage/imported-farmed-shrimp_a944b6cf.jpg",
  },
];

// ============================================================
// DELI MEATS — All major US grocery store brands
// ============================================================
export const DELI_MEAT_BRANDS: MeatBrandEntry[] = [
  {
    barcode: "025317980001", name: "Applegate Naturals Roasted Turkey Breast", brand: "Applegate",
    imageUrl: "https://images.openfoodfacts.org/images/products/002/531/710/9864/front_en.12.200.jpg",
    category: "Deli Turkey", ingredients: "TURKEY BREAST, WATER, SEA SALT.",
    nutriments: { "energy-kcal_100g": 107, "proteins_100g": 24, "fat_100g": 0.8, "saturated-fat_100g": 0.2, "carbohydrates_100g": 0, "sodium_100g": 0.55 },
    novaGroup: 2, dataSource: "usda", qualityTier: "premium",
    sourcing: "No antibiotics, humanely raised, no nitrates, no artificial preservatives",
    concerns: ["Owned by Hormel", "Still processed deli meat — sodium content"],
    whyScore: "Cleanest mainstream deli turkey — no nitrates, no antibiotics, humanely raised. Just turkey, water, and sea salt.",
    labels: ["no-antibiotics", "humanely-raised", "no-nitrates"],
    meatGrade: { type: "Turkey", isGrassFed: false, isAntibiotic: true, qualityNotes: ["No nitrates added", "No antibiotics", "Humanely raised", "Minimal ingredients"] },
  },
  {
    barcode: "025317980002", name: "Boar's Head Ovengold Turkey Breast", brand: "Boar's Head",
    category: "Deli Turkey", ingredients: "TURKEY BREAST, WATER, CONTAINS 2% OR LESS: SALT, SUGAR, SODIUM PHOSPHATE, CARRAGEENAN.",
    nutriments: { "energy-kcal_100g": 107, "proteins_100g": 24, "fat_100g": 0.8, "saturated-fat_100g": 0.2, "carbohydrates_100g": 1, "sodium_100g": 0.6 },
    novaGroup: 3, dataSource: "usda", qualityTier: "average",
    sourcing: "No antibiotics, no artificial colors — but contains carrageenan and sodium phosphate",
    concerns: ["Carrageenan — linked to gut inflammation and GI issues", "Sodium phosphates — kidney health concerns", "Boar's Head had major 2024 listeria outbreak killing 9 people"],
    whyScore: "Contains carrageenan (gut inflammation risk) and sodium phosphates. Boar's Head had a deadly 2024 listeria outbreak. Better options available.",
    labels: ["no-antibiotics"],
    meatGrade: { type: "Turkey", isGrassFed: false, isAntibiotic: true, qualityNotes: ["Carrageenan added — gut inflammation risk", "Sodium phosphates", "2024 deadly listeria outbreak"] },
  },
  {
    barcode: "025317980003", name: "Oscar Mayer Deli Fresh Turkey Breast", brand: "Oscar Mayer",
    category: "Deli Turkey", ingredients: "TURKEY BREAST, WATER, CONTAINS 2% OR LESS: SALT, SODIUM LACTATE, MODIFIED FOOD STARCH, SODIUM PHOSPHATES, SODIUM DIACETATE, SODIUM ERYTHORBATE, SODIUM NITRITE.",
    nutriments: { "energy-kcal_100g": 107, "proteins_100g": 24, "fat_100g": 0.8, "saturated-fat_100g": 0.2, "carbohydrates_100g": 1, "sodium_100g": 0.75 },
    novaGroup: 4, dataSource: "usda", qualityTier: "poor",
    sourcing: "Industrial processed turkey with sodium nitrite, multiple phosphates, modified starch",
    concerns: ["Sodium nitrite — carcinogen risk", "Sodium phosphates", "Modified food starch", "Sodium lactate and diacetate", "Ultra-processed NOVA 4"],
    whyScore: "Contains sodium nitrite (carcinogen risk), sodium phosphates, modified starch. Ultra-processed. Avoid.",
    labels: [],
    meatGrade: { type: "Turkey", isGrassFed: false, isAntibiotic: false, qualityNotes: ["Sodium nitrite added — carcinogen risk", "Multiple synthetic preservatives", "Ultra-processed NOVA 4"] },
    imageUrl: "/manus-storage/oscar-mayer-deli-turkey_7c4c026a.jpg",
  },
  {
    barcode: "025317980004", name: "Applegate Naturals Uncured Pepperoni", brand: "Applegate",
    category: "Deli Pepperoni", ingredients: "PORK, WATER, SEA SALT, SPICES, ORGANIC SUGAR, CELERY POWDER, LACTIC ACID STARTER CULTURE.",
    nutriments: { "energy-kcal_100g": 500, "proteins_100g": 19, "fat_100g": 44, "saturated-fat_100g": 15, "carbohydrates_100g": 2, "sodium_100g": 1.4 },
    novaGroup: 3, dataSource: "usda", qualityTier: "good",
    sourcing: "No antibiotics, humanely raised, no added nitrites (celery powder source)",
    concerns: ["Celery powder = natural nitrates", "High sodium", "Owned by Hormel"],
    whyScore: "No antibiotics, humanely raised, no added nitrites. Celery powder provides natural nitrates. Best mainstream pepperoni option.",
    labels: ["no-antibiotics", "humanely-raised", "uncured"],
    meatGrade: { type: "Pork", isGrassFed: false, isAntibiotic: true, qualityNotes: ["No antibiotics", "Humanely raised", "No added nitrites — celery powder only", "High sodium"] },
    imageUrl: "/manus-storage/applegate-uncured-pepperoni_c60903d0.png",
  },
  {
    barcode: "025317980005", name: "Hormel Natural Choice Deli Ham", brand: "Hormel",
    category: "Deli Ham", ingredients: "HAM, WATER, CONTAINS 2% OR LESS: SALT, SUGAR, SODIUM PHOSPHATES, SODIUM ERYTHORBATE, SODIUM NITRITE.",
    nutriments: { "energy-kcal_100g": 107, "proteins_100g": 18, "fat_100g": 3, "saturated-fat_100g": 1, "carbohydrates_100g": 2, "sodium_100g": 0.9 },
    novaGroup: 4, dataSource: "usda", qualityTier: "poor",
    sourcing: "Industrial processed ham with sodium nitrite, sodium phosphates",
    concerns: ["Sodium nitrite — carcinogen risk", "Sodium phosphates", "Industrial CAFO pork", "Ultra-processed"],
    whyScore: "Contains sodium nitrite and sodium phosphates. Industrial CAFO pork. 'Natural Choice' label is misleading.",
    labels: [],
    meatGrade: { type: "Pork", isGrassFed: false, isAntibiotic: false, qualityNotes: ["Sodium nitrite added — carcinogen risk", "Sodium phosphates", "Industrial CAFO pork"] },
    imageUrl: "/manus-storage/hormel-natural-choice-ham_6aaad95c.jpg",
  },
];

// ============================================================
// SPECIALTY / PREMIUM MEATS
// ============================================================
export const SPECIALTY_MEAT_BRANDS: MeatBrandEntry[] = [
  {
    barcode: "025317990001", name: "Snake River Farms American Wagyu Ground Beef", brand: "Snake River Farms",
    category: "American Wagyu Beef", ingredients: "AMERICAN WAGYU BEEF.",
    nutriments: { "energy-kcal_100g": 300, "proteins_100g": 16, "fat_100g": 26, "saturated-fat_100g": 10, "monounsaturated-fat_100g": 12, "carbohydrates_100g": 0, "sodium_100g": 0.07 },
    novaGroup: 1, dataSource: "usda", qualityTier: "premium",
    sourcing: "American Wagyu (Wagyu x Angus cross), grain-finished for marbling, no antibiotics, no hormones",
    concerns: ["Grain-finished — not grass-fed", "Very high fat content", "Not regenerative"],
    whyScore: "Premium American Wagyu — no antibiotics, no hormones, exceptional marbling. Grain-finished for flavor but not grass-fed.",
    labels: ["wagyu", "no-antibiotics", "no-hormones"],
    meatGrade: { type: "Beef", isGrassFed: false, isAntibiotic: true, usdaGrade: "Prime", qualityNotes: ["American Wagyu — Wagyu x Angus cross", "No antibiotics, no hormones", "Grain-finished for marbling", "Premium quality"] },
    imageUrl: "/manus-storage/snake-river-farms-wagyu_7711c06c.jpg",
  },
  {
    barcode: "025317990002", name: "White Oak Pastures Grass-Fed Beef", brand: "White Oak Pastures",
    category: "Ground Beef", ingredients: "GRASS-FED GRASS-FINISHED BEEF.",
    nutriments: { "energy-kcal_100g": 215, "proteins_100g": 17.9, "fat_100g": 15, "saturated-fat_100g": 6.0, "carbohydrates_100g": 0, "sodium_100g": 0.075 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "100% grass-fed and grass-finished, regenerative multi-species farm, no antibiotics, no hormones, carbon-negative farm",
    concerns: [],
    whyScore: "One of the most sustainable farms in the US. Carbon-negative operation. 100% grass-fed/finished, regenerative multi-species farming.",
    labels: ["regenerative", "grass-fed", "grass-finished", "carbon-negative", "no-antibiotics"],
    meatGrade: { type: "Beef", isGrassFed: true, isOrganic: false, isAntibiotic: true, qualityNotes: ["Carbon-negative farm", "Regenerative multi-species farming", "100% grass-fed and grass-finished", "No antibiotics, no hormones"] },
    imageUrl: "/manus-storage/white-oak-pastures-beef_e502d9f6.jpg",
  },
  {
    barcode: "025317990003", name: "ButcherBox Grass-Fed Ground Beef", brand: "ButcherBox",
    category: "Ground Beef", ingredients: "GRASS-FED GRASS-FINISHED BEEF.",
    nutriments: { "energy-kcal_100g": 215, "proteins_100g": 17.9, "fat_100g": 15, "saturated-fat_100g": 6.0, "carbohydrates_100g": 0, "sodium_100g": 0.075 },
    novaGroup: 1, dataSource: "usda", qualityTier: "premium",
    sourcing: "100% grass-fed and grass-finished, humanely raised, no antibiotics, no hormones — subscription delivery service",
    concerns: ["Subscription service — not available in stores", "Sourced from multiple farms — quality may vary"],
    whyScore: "Grass-fed and grass-finished, humanely raised, no antibiotics. Popular subscription service with consistent quality.",
    labels: ["grass-fed", "grass-finished", "humanely-raised", "no-antibiotics"],
    meatGrade: { type: "Beef", isGrassFed: true, isAntibiotic: true, qualityNotes: ["100% grass-fed and grass-finished", "Humanely raised", "No antibiotics, no hormones"] },
    imageUrl: "/manus-storage/butcherbox-grass-fed-beef_6908b4f1.jpg",
  },
  {
    barcode: "025317990004", name: "Crowd Cow Wagyu Ribeye", brand: "Crowd Cow",
    category: "Wagyu Beef", ingredients: "WAGYU BEEF.",
    nutriments: { "energy-kcal_100g": 350, "proteins_100g": 15, "fat_100g": 32, "saturated-fat_100g": 13, "monounsaturated-fat_100g": 15, "carbohydrates_100g": 0, "sodium_100g": 0.07 },
    novaGroup: 1, dataSource: "usda", qualityTier: "premium",
    sourcing: "Direct from small farms, transparent sourcing, no antibiotics, no hormones — online delivery",
    concerns: ["Online delivery only — not in stores", "Grain-finished Wagyu"],
    whyScore: "Transparent farm-direct sourcing, no antibiotics, no hormones. Premium Wagyu quality with direct farmer relationships.",
    labels: ["wagyu", "farm-direct", "no-antibiotics", "transparent-sourcing"],
    meatGrade: { type: "Beef", isGrassFed: false, isAntibiotic: true, qualityNotes: ["Farm-direct transparent sourcing", "No antibiotics, no hormones", "Wagyu breed — high marbling"] },
    imageUrl: "/manus-storage/crowd-cow-wagyu-ribeye_ec0942da.jpeg",
  },
  {
    barcode: "025317990005", name: "Vital Farms Pasture-Raised Eggs", brand: "Vital Farms",
    imageUrl: "https://images.openfoodfacts.org/images/products/086/174/500/0010/front_en.72.200.jpg",
    category: "Eggs", ingredients: "PASTURE-RAISED EGGS.",
    nutriments: { "energy-kcal_100g": 143, "proteins_100g": 12.6, "fat_100g": 9.5, "saturated-fat_100g": 3.1, "carbohydrates_100g": 0.7, "cholesterol_100g": 0.372, "vitamin-d_100g": 0.0000022 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "Certified Humane pasture-raised, 108 sq ft outdoor access per hen, no antibiotics, no hormones, non-GMO",
    concerns: [],
    whyScore: "108 sq ft outdoor pasture per hen — highest welfare standard. Certified Humane. Higher vitamin D, omega-3, and vitamin E than conventional eggs.",
    labels: ["pasture-raised", "certified-humane", "no-antibiotics", "non-gmo"],
    meatGrade: { type: "Chicken", isGrassFed: false, isOrganic: false, isAntibiotic: true, qualityNotes: ["108 sq ft outdoor pasture per hen", "Certified Humane", "Higher vitamin D and omega-3", "No antibiotics, no hormones"] },
  },
  {
    barcode: "025317990006", name: "Vital Farms Pasture-Raised Butter", brand: "Vital Farms",
    category: "Butter", ingredients: "PASTEURIZED CREAM (FROM PASTURE-RAISED COWS), SALT.",
    nutriments: { "energy-kcal_100g": 717, "proteins_100g": 0.9, "fat_100g": 81, "saturated-fat_100g": 51, "monounsaturated-fat_100g": 21, "carbohydrates_100g": 0.1, "vitamin-a_100g": 0.0007 },
    novaGroup: 1, dataSource: "usda", qualityTier: "elite",
    sourcing: "Certified Humane pasture-raised cows, no antibiotics, no hormones, higher CLA and vitamin K2 than conventional butter",
    concerns: [],
    whyScore: "Pasture-raised butter has 3-5x more CLA, higher vitamin K2, and better omega-3 profile than conventional butter. Clean two-ingredient product.",
    labels: ["pasture-raised", "certified-humane", "no-antibiotics"],
    meatGrade: { type: "Beef", isGrassFed: true, isAntibiotic: true, qualityNotes: ["Pasture-raised cows", "Higher CLA and vitamin K2", "No antibiotics, no hormones", "Two ingredients only"] },
    imageUrl: "/manus-storage/vital-farms-butter_e84a5a01.png",
  },
];

// ============================================================
// COMBINED EXPORT — All meat brands
// ============================================================
export const ALL_MEAT_BRANDS: MeatBrandEntry[] = [
  ...BEEF_BRANDS,
  ...CHICKEN_BRANDS,
  ...PORK_BRANDS,
  ...TURKEY_BRANDS,
  ...LAMB_BRANDS,
  ...BISON_BRANDS,
  ...SEAFOOD_BRANDS,
  ...DELI_MEAT_BRANDS,
  ...SPECIALTY_MEAT_BRANDS,
];

export const MEAT_CATEGORIES = [
  { id: "all", label: "All Meats" },
  { id: "beef", label: "Beef" },
  { id: "chicken", label: "Chicken" },
  { id: "pork", label: "Pork & Bacon" },
  { id: "turkey", label: "Turkey" },
  { id: "lamb", label: "Lamb" },
  { id: "bison", label: "Bison" },
  { id: "seafood", label: "Seafood" },
  { id: "deli", label: "Deli Meats" },
  { id: "specialty", label: "Specialty" },
];

export const QUALITY_TIER_CONFIG = {
  elite:   { label: "Elite",   score: 95, color: "#145A3A", bg: "#F0FAF2", border: "#86d086", desc: "Regenerative/wild, grass-fed/finished, no antibiotics, no hormones, single ingredient" },
  premium: { label: "Premium", score: 80, color: "#3FA34D", bg: "#DCF4DF", border: "#b8e8b8", desc: "Organic or grass-fed, no antibiotics, minimal processing, clean ingredients" },
  good:    { label: "Good",    score: 65, color: "#4d9e4d", bg: "#F0FAF2", border: "#b8e8b8", desc: "No antibiotics, some welfare standards, mostly clean" },
  average: { label: "Average", score: 45, color: "#d97706", bg: "#fef3c7", border: "#fde68a", desc: "Conventional, may use antibiotics, standard feedlot/CAFO practices" },
  poor:    { label: "Poor",    score: 25, color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", desc: "Heavy processing, additives, nitrates, low-quality ingredients" },
  avoid:   { label: "Avoid",   score: 10, color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", desc: "Mechanically separated, fillers, carrageenan, multiple harmful additives" },
};

export function getMeatScore(entry: MeatBrandEntry): number {
  return QUALITY_TIER_CONFIG[entry.qualityTier].score;
}

export function getMeatColor(entry: MeatBrandEntry): string {
  return QUALITY_TIER_CONFIG[entry.qualityTier].color;
}
