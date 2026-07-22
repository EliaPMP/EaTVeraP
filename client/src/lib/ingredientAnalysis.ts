/**
 * EatVera Ingredient Analysis Engine
 * Design: Bold Brutalist Health — honest, direct, data-forward
 * 
 * Scoring system: 1-100 where higher = better quality
 * Penalties applied for harmful ingredients, bonuses for clean ones
 */

export type SeverityLevel = "critical" | "warning" | "caution" | "good" | "excellent";

export interface IngredientFlag {
  name: string;
  severity: SeverityLevel;
  reason: string;
  category: string;
  penalty: number;
}

export interface NutritionConcerns {
  concerns: string[];
  positives: string[];
}

export interface NutritionAnalysis {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  label: string;
  color: string;
  flags: IngredientFlag[];
  positives: string[];
  summary: string;
}

// ─── SEED OILS (Critical) ────────────────────────────────────────────────────
const SEED_OILS = [
  "canola oil", "rapeseed oil", "soybean oil", "soy oil",
  "corn oil", "sunflower oil", "safflower oil", "cottonseed oil",
  "grapeseed oil", "rice bran oil", "vegetable oil", "partially hydrogenated oil",
  "hydrogenated vegetable oil", "margarine", "shortening", "interesterified oil",
  "vegetable shortening",
];

const SEED_OIL_REASONS: Record<string, string> = {
  "canola oil": "Canola oil is high in omega-6 linoleic acid and processed with chemical solvents (hexane). Promotes systemic inflammation.",
  "rapeseed oil": "Rapeseed/canola oil — industrially processed, high omega-6 linoleic acid.",
  "soybean oil": "Soybean oil is the #1 most consumed seed oil in the US. Extremely high in omega-6 LA, linked to obesity and inflammation.",
  "soy oil": "Soy oil — same as soybean oil, high omega-6.",
  "corn oil": "Corn oil is highly refined, high in omega-6 linoleic acid. Oxidizes easily when heated, producing toxic aldehydes.",
  "sunflower oil": "Sunflower oil is high in omega-6 linoleic acid. Unstable at high heat, produces toxic aldehydes.",
  "safflower oil": "Safflower oil has the highest omega-6 content of any oil (~75%). Strongly pro-inflammatory.",
  "cottonseed oil": "Cottonseed oil contains gossypol (natural toxin) and high omega-6. Often partially hydrogenated.",
  "grapeseed oil": "Grapeseed oil is extremely high in omega-6 LA (70%+). Marketed as healthy but highly inflammatory.",
  "rice bran oil": "Rice bran oil is high in omega-6 and processed with hexane solvent.",
  "vegetable oil": "Generic 'vegetable oil' is typically soybean, canola, or corn oil — all inflammatory seed oils.",
  "vegetable shortening": "Vegetable shortening is partially hydrogenated seed oil — contains trans fats and high omega-6.",
  "hydrogenated vegetable oil": "Hydrogenated vegetable oil contains artificial trans fats — strongly linked to cardiovascular disease.",
  "partially hydrogenated oil": "Partially hydrogenated oils contain trans fats — the most harmful dietary fat.",
  "interesterified oil": "Interesterified oils are chemically modified fats — a trans fat replacement with similar metabolic concerns.",
  "margarine": "Margarine is made from hydrogenated or interesterified seed oils — contains trans fats and high omega-6.",
  "shortening": "Shortening is partially hydrogenated vegetable oil — high in trans fats and omega-6.",
};

// ─── ARTIFICIAL ADDITIVES (Critical) ─────────────────────────────────────────
const ARTIFICIAL_ADDITIVES = [
  "monosodium glutamate", "msg", "sodium nitrate", "sodium nitrite",
  "potassium bromate", "brominated vegetable oil", "bvo",
  "butylated hydroxyanisole", "bha", "butylated hydroxytoluene", "bht",
  "propyl gallate", "tbhq", "tertiary butylhydroquinone",
  "red 40", "red no. 40", "yellow 5", "yellow no. 5", "yellow 6", "yellow no. 6",
  "blue 1", "blue 2", "red 3", "green 3",
  "artificial color", "artificial colours", "artificial flavour", "artificial flavor",
  "artificial sweetener", "aspartame", "sucralose", "saccharin", "acesulfame potassium",
  "acesulfame k", "sodium benzoate", "potassium benzoate", "caramel color",
];

const ADDITIVE_REASONS: Record<string, string> = {
  "monosodium glutamate": "MSG is a flavor enhancer that may cause headaches, flushing, and sweating in sensitive individuals. An excitotoxin that overstimulates neurons.",
  "sodium nitrate": "Sodium nitrate in processed meats forms nitrosamines — potent carcinogens. Linked to colorectal cancer.",
  "sodium nitrite": "Sodium nitrite forms carcinogenic nitrosamines. WHO classifies processed meats as Group 1 carcinogens.",
  "potassium bromate": "Potassium bromate is a known carcinogen banned in the EU, UK, Canada, and many other countries. Still legal in the US.",
  "brominated vegetable oil": "Brominated vegetable oil (BVO) contains bromine — a toxic halogen. Banned in the EU and Japan.",
  "butylated hydroxyanisole": "BHA — possible human carcinogen (IARC Group 2B), endocrine disruptor.",
  "bha": "BHA (butylated hydroxyanisole) is a petroleum-derived preservative classified as a possible human carcinogen (IARC Group 2B).",
  "butylated hydroxytoluene": "BHT — potential carcinogen and endocrine disruptor.",
  "bht": "BHT (butylated hydroxytoluene) is structurally similar to BHA. Potential carcinogen and endocrine disruptor.",
  "tbhq": "TBHQ (tertiary butylhydroquinone) is a petroleum-derived preservative linked to immune dysfunction and potential carcinogenicity.",
  "tertiary butylhydroquinone": "TBHQ — petroleum-derived preservative with immune and carcinogenic concerns.",
  "red 40": "Red 40 (Allura Red) is a petroleum-derived dye linked to hyperactivity in children. Requires warning labels in the EU.",
  "red no. 40": "Red 40 — petroleum-derived artificial dye, EU warning label required.",
  "yellow 5": "Yellow 5 (Tartrazine) is linked to hyperactivity, allergic reactions, and potential genotoxicity.",
  "yellow no. 5": "Yellow 5 — petroleum-derived artificial dye.",
  "yellow 6": "Yellow 6 (Sunset Yellow) is linked to hyperactivity and allergic reactions.",
  "yellow no. 6": "Yellow 6 — petroleum-derived artificial dye.",
  "blue 1": "Blue 1 (Brilliant Blue) may cross the blood-brain barrier. Linked to hyperactivity in children.",
  "blue 2": "Blue 2 (Indigo Carmine) — petroleum-derived dye with potential neurotoxic effects.",
  "red 3": "Red 3 (Erythrosine) is a known thyroid carcinogen in animals. FDA banned it from cosmetics but still allows it in food.",
  "green 3": "Green 3 (Fast Green) — petroleum-derived dye, limited safety data.",
  "artificial color": "Artificial colors are petroleum-derived dyes linked to hyperactivity and allergic reactions.",
  "artificial colours": "Artificial colours — petroleum-derived dyes.",
  "artificial flavor": "Artificial flavors are synthetic chemicals that mimic natural tastes. May include up to 100 chemical compounds with limited individual safety testing.",
  "artificial flavour": "Artificial flavours — synthetic chemical mixtures with limited transparency.",
  "aspartame": "Aspartame breaks down into methanol and aspartic acid. Linked to headaches, neurological effects, and potential carcinogenicity (IARC Group 2B).",
  "sucralose": "Sucralose (Splenda) is a chlorinated sugar molecule. May disrupt gut microbiome and insulin response.",
  "saccharin": "Saccharin was once banned as a carcinogen. Still controversial — may alter gut bacteria composition.",
  "acesulfame potassium": "Acesulfame-K (Ace-K) may affect insulin response and gut microbiome. Often combined with aspartame.",
  "acesulfame k": "Acesulfame-K — artificial sweetener with potential metabolic effects.",
  "sodium benzoate": "Sodium benzoate reacts with vitamin C to form benzene — a known carcinogen. Linked to ADHD and hyperactivity.",
  "potassium benzoate": "Potassium benzoate — same concerns as sodium benzoate, forms benzene with vitamin C.",
  "caramel color": "Caramel color (especially Class III/IV) contains 4-MEI, a potential carcinogen. Found in colas and dark beverages.",
};

// ─── HIGH FRUCTOSE CORN SYRUP & SUGARS (Warning) ─────────────────────────────
const BAD_SUGARS = [
  "high fructose corn syrup", "high-fructose corn syrup", "hfcs", "corn syrup", "corn syrup solids",
  "fructose", "dextrose", "maltodextrin", "glucose syrup",
  "inverted sugar", "invert sugar syrup", "agave nectar",
  "cane sugar", "refined sugar",
];

const SUGAR_REASONS: Record<string, string> = {
  "high fructose corn syrup": "HFCS is processed almost entirely by the liver, leading to fatty liver disease, insulin resistance, and elevated triglycerides.",
  "high-fructose corn syrup": "HFCS — liver-processed fructose linked to metabolic syndrome and obesity.",
  "hfcs": "HFCS — liver-processed fructose linked to metabolic syndrome.",
  "corn syrup": "Corn syrup is pure glucose — rapidly spikes blood sugar and insulin levels.",
  "corn syrup solids": "Corn syrup solids are concentrated corn syrup — same metabolic concerns.",
  "dextrose": "Dextrose is pure glucose — high glycemic index (GI 100), rapid blood sugar spike.",
  "maltodextrin": "Maltodextrin has a higher glycemic index than table sugar (GI ~110). Rapidly raises blood glucose.",
  "glucose syrup": "Glucose syrup — rapidly absorbed simple sugar, high glycemic index.",
  "fructose": "Isolated fructose is processed exclusively by the liver — same concerns as HFCS.",
  "inverted sugar": "Inverted sugar is a 50/50 glucose/fructose mix — similar to HFCS.",
  "invert sugar syrup": "Invert sugar syrup — similar to HFCS, liver-processed fructose.",
  "agave nectar": "Agave nectar is 70-90% fructose — higher than HFCS. Marketed as healthy but highly liver-taxing.",
};

// ─── PRESERVATIVES (Caution) ─────────────────────────────────────────────────
const PRESERVATIVES = [
  "potassium sorbate", "calcium propionate",
  "sodium propionate", "sorbic acid", "benzoic acid",
  "sulfur dioxide", "sodium sulfite", "sodium metabisulfite",
  "disodium edta", "edta",
];

const PRESERVATIVE_REASONS: Record<string, string> = {
  "potassium sorbate": "Potassium sorbate may react with ascorbic acid to form genotoxic compounds. Generally considered low-risk.",
  "calcium propionate": "Calcium propionate is linked to irritability, restlessness, and sleep disturbance in children.",
  "sodium propionate": "Sodium propionate — same concerns as calcium propionate.",
  "sulfur dioxide": "Sulfur dioxide (SO2) can trigger asthma attacks and allergic reactions in sensitive individuals.",
  "sodium metabisulfite": "Sodium metabisulfite — sulfite preservative, may trigger asthma and allergic reactions.",
  "disodium edta": "Disodium EDTA is a chelating agent used as a preservative. May interfere with mineral absorption.",
  "edta": "EDTA — chelating agent preservative, may interfere with mineral absorption.",
};

// ─── TRANS FATS (Critical) ────────────────────────────────────────────────────
const TRANS_FATS = [
  "trans fat", "partially hydrogenated", "hydrogenated fat",
  "hydrogenated oil",
];

// ─── REFINED GRAINS (Warning) ───────────────────────────────────────────────
const REFINED_GRAINS = [
  "enriched flour", "bleached flour", "white flour", "refined flour",
  "enriched wheat flour", "bleached wheat flour", "degerminated corn flour",
  "corn flour", "white rice", "enriched white rice", "white bread flour",
  "enriched bleached flour",
];

// ─── ULTRA-PROCESSED MARKERS (Warning) ───────────────────────────────────────
const ULTRA_PROCESSED = [
  "modified starch", "modified corn starch", "modified food starch",
  "carrageenan", "xanthan gum", "guar gum", "locust bean gum",
  "polysorbate 80", "polysorbate 60", "soy lecithin", "sunflower lecithin",
  "mono and diglycerides", "diglycerides", "monoglycerides",
  "sodium stearoyl lactylate", "ssl", "datem", "acetylated",
  "carboxymethylcellulose", "propylene glycol", "disodium inosinate",
  "disodium guanylate", "hydrolyzed vegetable protein", "yeast extract", "autolyzed yeast",
];

const ULTRA_PROCESSED_REASONS: Record<string, string> = {
  "carrageenan": "Carrageenan is derived from red seaweed but may cause intestinal inflammation and is linked to colitis in animal studies.",
  "polysorbate 80": "Polysorbate 80 disrupts the gut mucus layer, promoting intestinal permeability and inflammation.",
  "polysorbate 60": "Polysorbate 60 — same gut-disrupting concerns as polysorbate 80.",
  "carboxymethylcellulose": "Carboxymethylcellulose (CMC) disrupts gut microbiome composition and promotes inflammation.",
  "propylene glycol": "Propylene glycol is an industrial solvent used as a food additive. May cause skin and eye irritation.",
  "disodium inosinate": "Disodium inosinate is a flavor enhancer that amplifies MSG effects. Often used alongside MSG.",
  "disodium guanylate": "Disodium guanylate — flavor enhancer, amplifies MSG. Derived from fish or yeast.",
  "hydrolyzed vegetable protein": "Hydrolyzed vegetable protein contains naturally occurring MSG and may contain other glutamates.",
  "yeast extract": "Yeast extract contains free glutamates — similar to MSG. Used as a hidden MSG source.",
  "autolyzed yeast": "Autolyzed yeast contains free glutamates — hidden MSG source.",
  "modified corn starch": "Modified corn starch — chemically altered, high glycemic index, typically GMO corn.",
  "modified food starch": "Modified food starch — chemically altered starch, high glycemic index.",
};

// ─── POSITIVE INGREDIENTS ────────────────────────────────────────────────────
const CLEAN_INGREDIENTS = [
  "olive oil", "extra virgin olive oil", "coconut oil", "avocado oil",
  "butter", "ghee", "lard", "tallow", "beef tallow",
  "whole grain", "whole wheat", "oats", "quinoa", "brown rice",
  "almonds", "walnuts", "pecans", "cashews", "macadamia",
  "chia seeds", "flaxseed", "hemp seeds",
  "spinach", "kale", "broccoli", "sweet potato",
  "blueberries", "strawberries", "raspberries",
  "turmeric", "ginger", "cinnamon", "garlic",
  "apple cider vinegar", "lemon juice",
  "sea salt", "himalayan salt",
  "honey", "maple syrup",
  "eggs", "grass-fed", "pasture-raised", "organic",
];

function normalizeIngredient(ing: string): string {
  return ing.toLowerCase().trim().replace(/[()[\]]/g, "");
}

function matchesAny(ingredient: string, list: string[]): string | null {
  const norm = normalizeIngredient(ingredient);
  for (const item of list) {
    if (norm.includes(item.toLowerCase())) return item;
  }
  return null;
}

export function analyzeIngredients(ingredientsText: string): NutritionAnalysis {
  if (!ingredientsText || ingredientsText.trim().length === 0) {
    return {
      score: 50,
      grade: "C",
      label: "Unknown",
      color: "#F4A825",
      flags: [],
      positives: [],
      summary: "No ingredient data available for this product.",
    };
  }

  // Split ingredients by comma or period
  const ingredients = ingredientsText
    .split(/[,;.]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const flags: IngredientFlag[] = [];
  const positives: string[] = [];
  let penalty = 0;
  let bonus = 0;

  // ── Sugar-as-early-ingredient penalty (sugar in top 3 = dominant ingredient)
  const first3 = ingredients.slice(0, 3).map(s => s.toLowerCase());
  const sugarKeywords = ["sugar", "high fructose corn syrup", "corn syrup", "dextrose", "fructose", "glucose"];
  const sugarInTop3 = first3.some(ing => sugarKeywords.some(kw => ing.includes(kw)));
  if (sugarInTop3) {
    penalty += 18;
    flags.push({
      name: "Sugar listed as primary ingredient",
      severity: "critical",
      reason: "Sugar appears in the first 3 ingredients, meaning it is one of the dominant components by weight. Products where sugar leads the ingredient list are nutritionally poor.",
      category: "Added Sugar",
      penalty: 18,
    });
  }

  for (const ingredient of ingredients) {
    // Check seed oils (critical -15 each, max -45)
    const seedOil = matchesAny(ingredient, SEED_OILS);
    if (seedOil) {
      const isHydro = seedOil.includes("hydrogenated") || seedOil === "margarine" || seedOil === "shortening";
      const p = isHydro ? 20 : 15;
      flags.push({
        name: ingredient.trim(),
        severity: "critical",
        reason: SEED_OIL_REASONS[seedOil] || `Seed oils like ${seedOil} are high in omega-6 linoleic acid, which promotes inflammation and oxidative stress when consumed in excess.`,
        category: "Seed Oil",
        penalty: p,
      });
      penalty = Math.min(penalty + p, 60);
      continue;
    }

    // Check trans fats (critical -20 each)
    const transFat = matchesAny(ingredient, TRANS_FATS);
    if (transFat) {
      flags.push({
        name: ingredient.trim(),
        severity: "critical",
        reason: "Trans fats are strongly linked to cardiovascular disease and are banned or restricted in many countries.",
        category: "Trans Fat",
        penalty: 20,
      });
      penalty = Math.min(penalty + 20, 60);
      continue;
    }

    // Check artificial additives (critical -10 each)
    const additive = matchesAny(ingredient, ARTIFICIAL_ADDITIVES);
    if (additive) {
      flags.push({
        name: ingredient.trim(),
        severity: "critical",
        reason: ADDITIVE_REASONS[additive] || `Artificial additives like ${additive} have been linked to hyperactivity, allergic reactions, and potential carcinogenic effects.`,
        category: "Artificial Additive",
        penalty: 10,
      });
      penalty = Math.min(penalty + 10, 40);
      continue;
    }

    // Check bad sugars (warning -8 each, HFCS -15)
    const badSugar = matchesAny(ingredient, BAD_SUGARS);
    if (badSugar) {
      const isHFCS = badSugar.includes("high fructose") || badSugar === "hfcs" || badSugar === "fructose";
      const p = isHFCS ? 15 : 8;
      flags.push({
        name: ingredient.trim(),
        severity: isHFCS ? "critical" : "warning",
        reason: SUGAR_REASONS[badSugar] || `${badSugar} causes rapid blood sugar spikes, promotes insulin resistance, and contributes to metabolic syndrome.`,
        category: "Refined Sugar",
        penalty: p,
      });
      penalty = Math.min(penalty + p, 40);
      continue;
    }

    // Check preservatives (caution -4 each)
    const preservative = matchesAny(ingredient, PRESERVATIVES);
    if (preservative) {
      flags.push({
        name: ingredient.trim(),
        severity: "caution",
        reason: PRESERVATIVE_REASONS[preservative] || `${preservative} is a synthetic preservative that may cause allergic reactions and has been studied for potential health effects.`,
        category: "Preservative",
        penalty: 5,
      });
      penalty = Math.min(penalty + 5, 25);
      continue;
    }

    // Check ultra-processed markers (caution -3 each)
    const ultraProcessed = matchesAny(ingredient, ULTRA_PROCESSED);
    if (ultraProcessed) {
      flags.push({
        name: ingredient.trim(),
        severity: "caution",
        reason: ULTRA_PROCESSED_REASONS[ultraProcessed] || `${ultraProcessed} is a marker of ultra-processed food. These ingredients are associated with poor gut health and chronic disease.`,
        category: "Ultra-Processed",
        penalty: 4,
      });
      penalty = Math.min(penalty + 4, 20);
      continue;
    }

    // Check refined grains (warning -6 each)
    const refinedGrain = matchesAny(ingredient, REFINED_GRAINS);
    if (refinedGrain) {
      flags.push({
        name: ingredient.trim(),
        severity: "warning",
        reason: `Refined/enriched grains like ${refinedGrain} have had fiber and nutrients stripped away during processing. They spike blood sugar rapidly and offer little nutritional value compared to whole grain alternatives.`,
        category: "Refined Grain",
        penalty: 6,
      });
      penalty = Math.min(penalty + 6, 24);
      continue;
    }

    // Check clean ingredients (+5 each)
    const clean = matchesAny(ingredient, CLEAN_INGREDIENTS);
    if (clean) {
      positives.push(ingredient.trim());
      bonus = Math.min(bonus + 5, 25);
    }
  }

  // Base score: start at 72 (neutral-leaning, not "good" by default)
  let score = 72 - penalty + bonus;

  // Adjust for ingredient list length (longer lists often = more processed)
  if (ingredients.length > 20) score -= 5;
  if (ingredients.length > 30) score -= 5;
  if (ingredients.length <= 5) score += 5;

  // Clamp score
  score = Math.max(1, Math.min(100, Math.round(score)));



  // Determine grade
  let grade: "A" | "B" | "C" | "D" | "F";
  let label: string;
  let color: string;

  if (score >= 80) {
    grade = "A";
    label = "Excellent";
    color = "#0B3D2E";
  } else if (score >= 65) {
    grade = "B";
    label = "Good";
    color = "#3FA34D";
  } else if (score >= 50) {
    grade = "C";
    label = "Fair";
    color = "#d97706";
  } else if (score >= 35) {
    grade = "D";
    label = "Poor";
    color = "#ea580c";
  } else {
    grade = "F";
    label = "Avoid";
    color = "#dc2626";
  }

  // Generate summary
  const criticalCount = flags.filter((f) => f.severity === "critical").length;
  const warningCount = flags.filter((f) => f.severity === "warning").length;
  let summary = "";

  if (score >= 80) {
    summary = `This product scores ${score}/100 — a clean choice with ${positives.length > 0 ? positives.length + " beneficial ingredient(s)" : "minimal harmful additives"}.`;
  } else if (score >= 65) {
    summary = `This product scores ${score}/100. Generally acceptable, but contains ${warningCount + criticalCount} ingredient(s) worth monitoring.`;
  } else if (score >= 50) {
    summary = `This product scores ${score}/100. Contains ${criticalCount} concerning ingredient(s). Consider cleaner alternatives.`;
  } else if (score >= 35) {
    summary = `This product scores ${score}/100. Contains ${criticalCount} harmful ingredient(s) including potential seed oils or artificial additives. Not recommended for regular consumption.`;
  } else {
    summary = `This product scores ${score}/100. Heavily processed with ${criticalCount} critical ingredients. This product should be avoided.`;
  }

  return { score, grade, label, color, flags, positives, summary };
}

export function analyzeMeatProduct(ingredients: string, meatGrade?: import("./foodApi").MeatGrade): NutritionAnalysis {
  const base = analyzeIngredients(ingredients);
  if (!meatGrade) return base;
  let bonus = 0;
  const bonusNotes: string[] = [];
  if (meatGrade.isGrassFed) { bonus += 10; bonusNotes.push("Grass-Fed"); }
  if (meatGrade.isOrganic) { bonus += 8; bonusNotes.push("Organic"); }
  if (meatGrade.isAntibiotic) { bonus += 5; bonusNotes.push("No Antibiotics"); }
  if (meatGrade.usdaGrade === "Prime") { bonus += 3; bonusNotes.push("USDA Prime"); }
  const newScore = Math.min(100, base.score + bonus);
  let grade: "A" | "B" | "C" | "D" | "F";
  let label: string; let color: string;
  if (newScore >= 80) { grade = "A"; label = "Excellent"; color = "#A8FF3E"; }
  else if (newScore >= 65) { grade = "B"; label = "Good"; color = "#7BC67E"; }
  else if (newScore >= 50) { grade = "C"; label = "Fair"; color = "#F4A825"; }
  else if (newScore >= 35) { grade = "D"; label = "Poor"; color = "#FF6B35"; }
  else { grade = "F"; label = "Avoid"; color = "#FF3B3B"; }
  const summary = bonusNotes.length > 0
    ? `${meatGrade.type} product with quality attributes: ${bonusNotes.join(", ")}. ${base.summary}`
    : base.summary;
  return { ...base, score: Math.round(newScore), grade, label, color, summary };
}

export function analyzeNutrition(nutriments: Record<string, number>): NutritionConcerns {
  const concerns: string[] = [];
  const positives: string[] = [];

  const sugar = nutriments["sugars_100g"] ?? nutriments["sugars"] ?? 0;
  const sodium = nutriments["sodium_100g"] ?? nutriments["sodium"] ?? 0;
  const satFat = nutriments["saturated-fat_100g"] ?? nutriments["saturated-fat"] ?? 0;
  const transFat = nutriments["trans-fat_100g"] ?? 0;
  const fiber = nutriments["fiber_100g"] ?? nutriments["fiber"] ?? 0;
  const protein = nutriments["proteins_100g"] ?? nutriments["proteins"] ?? 0;
  const calories = nutriments["energy-kcal_100g"] ?? 0;
  const iron = nutriments["iron_100g"] ?? 0;
  const zinc = nutriments["zinc_100g"] ?? 0;
  const vitB12 = nutriments["vitamin-b12_100g"] ?? 0;
  const vitD = nutriments["vitamin-d_100g"] ?? 0;
  const omega3 = nutriments["polyunsaturated-fat_100g"] ?? 0;
  const potassium = nutriments["potassium_100g"] ?? 0;
  const addedSugar = nutriments["added-sugars_100g"] ?? 0;

  if (transFat > 0.1) concerns.push(`Contains trans fats (${transFat.toFixed(1)}g/100g) — linked to cardiovascular disease`);
  if (sugar > 25) concerns.push(`Very high sugar (${sugar.toFixed(1)}g/100g) — exceeds 25% of weight`);
  else if (sugar > 15) concerns.push(`High sugar content (${sugar.toFixed(1)}g/100g)`);
  if (addedSugar > 10) concerns.push(`High added sugars (${addedSugar.toFixed(1)}g/100g)`);
  if (sodium > 0.6) concerns.push(`High sodium (${(sodium * 1000).toFixed(0)}mg/100g) — exceeds 600mg threshold`);
  else if (sodium > 0.4) concerns.push(`Moderate-high sodium (${(sodium * 1000).toFixed(0)}mg/100g)`);
  if (calories > 500) concerns.push(`Very calorie-dense (${calories} kcal/100g)`);
  if (satFat > 10) concerns.push(`Very high saturated fat (${satFat.toFixed(1)}g/100g)`);

  if (fiber >= 5) positives.push(`High fiber (${fiber.toFixed(1)}g/100g) — supports gut health`);
  else if (fiber >= 3) positives.push(`Good fiber content (${fiber.toFixed(1)}g/100g)`);
  if (protein >= 15) positives.push(`High protein (${protein.toFixed(1)}g/100g) — supports muscle and satiety`);
  else if (protein >= 8) positives.push(`Good protein content (${protein.toFixed(1)}g/100g)`);
  if (iron > 0.002) positives.push(`Good iron source (${(iron * 1000).toFixed(1)}mg/100g)`);
  if (zinc > 0.003) positives.push(`Good zinc source (${(zinc * 1000).toFixed(1)}mg/100g)`);
  if (vitB12 > 0.000001) positives.push(`Contains Vitamin B12`);
  if (vitD > 0.000002) positives.push(`Contains Vitamin D`);
  if (omega3 > 1) positives.push(`Good omega-3 source (${omega3.toFixed(1)}g/100g polyunsaturated fat)`);
  if (potassium > 0.3) positives.push(`Good potassium source (${(potassium * 1000).toFixed(0)}mg/100g)`);
  if (sodium < 0.05 && sodium >= 0) positives.push(`Very low sodium (${(sodium * 1000).toFixed(0)}mg/100g)`);

  return { concerns, positives };
}
