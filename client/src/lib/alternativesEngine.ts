/**
 * EatVera — Healthier Alternatives Engine v2
 * Searches ALL curated databases (snacks, grains, dairy, condiments, frozen,
 * meat, fruit) to find genuinely better products in the same category.
 * Only shows alternatives when the scanned product scores below 70.
 */

import { type FoodProduct } from "./foodApi";
import { ALL_MEAT_BRANDS, type MeatBrandEntry } from "./meatDatabase";
import { ALL_FRUITS, getFruitDisplayScore, type FruitEntry } from "./fruitDatabase";
import { ALL_SNACKS, type SnackEntry } from "./snackDatabase";
import { ALL_GRAINS, type GrainsEntry } from "./grainsDatabase";
import { ALL_DAIRY, type DairyEntry } from "./dairyDatabase";
import { ALL_CONDIMENTS, type CondimentEntry } from "./condimentsDatabase";
import { ALL_FROZEN, type FrozenEntry } from "./frozenDatabase";
import { analyzeIngredients, analyzeMeatProduct } from "./ingredientAnalysis";

export interface Alternative {
  id: string;
  name: string;
  brand: string;
  score: number;
  category: string;
  reason: string;
  type: "packaged" | "meat" | "fruit" | "snack" | "grain" | "dairy" | "condiment" | "frozen";
  certifications?: string[];
  image?: string;
  emoji?: string;
}

// ─── Category mapping helpers ────────────────────────────────────────────────

/** Map a product name + ingredients to a snack category */
function detectSnackCategory(text: string): string | null {
  const t = text.toLowerCase();
  if (/chip|crisp|puff|tortilla chip/.test(t)) return "Chips & Crisps";
  if (/cracker|rice cake/.test(t)) return "Crackers";
  if (/cookie|brownie|wafer/.test(t)) return "Cookies & Biscuits";
  if (/candy|chocolate|gummy|lollipop|m&m|skittles|reese/.test(t)) return "Candy & Chocolate";
  if (/granola bar|protein bar|energy bar|clif|rxbar|kind bar/.test(t)) return "Granola & Bars";
  if (/popcorn/.test(t)) return "Popcorn";
  if (/nut|almond|cashew|peanut|walnut|pistachio|mixed nut/.test(t)) return "Nuts & Seeds";
  if (/jerky|meat snack|slim jim/.test(t)) return "Jerky & Meat Snacks";
  if (/trail mix|dried fruit|raisin/.test(t)) return "Trail Mix & Dried Fruit";
  if (/pretzel/.test(t)) return "Pretzels";
  if (/cheese puff|cheeto|cheese snack/.test(t)) return "Cheese Snacks";
  if (/fruit snack|fruit gummy|fruit roll/.test(t)) return "Fruit Snacks";
  if (/veggie straw|veggie chip|kale chip/.test(t)) return "Veggie Snacks";
  if (/protein snack|quest chip/.test(t)) return "Protein Snacks";
  if (/ice cream|gelato|sorbet|frozen dessert/.test(t)) return "Ice Cream & Frozen";
  return null;
}

function detectGrainCategory(text: string): string | null {
  const t = text.toLowerCase();
  if (/bread|loaf|sourdough|whole wheat bread/.test(t)) return "bread";
  if (/cereal|granola|oat|muesli|flake|corn flake|cheerio|frosted/.test(t)) return "cereal";
  if (/pasta|spaghetti|penne|fettuccine|macaroni|noodle/.test(t)) return "pasta";
  if (/cracker|rice cake|wasa/.test(t)) return "crackers";
  if (/tortilla|wrap/.test(t)) return "tortillas";
  if (/bagel/.test(t)) return "bagels";
  if (/rice|quinoa/.test(t)) return "rice";
  if (/oat|oatmeal/.test(t)) return "oats";
  return null;
}

function detectDairyCategory(text: string): string | null {
  const t = text.toLowerCase();
  if (/yogurt|yoghurt|kefir/.test(t)) return "Yogurt";
  if (/milk|dairy milk|whole milk|skim milk|2%/.test(t)) return "Milk";
  if (/cheese|cheddar|mozzarella|parmesan|brie|gouda/.test(t)) return "Cheese";
  if (/butter|ghee/.test(t)) return "Butter & Ghee";
  if (/cream|half.and.half/.test(t)) return "Cream & Half-and-Half";
  if (/egg/.test(t)) return "Eggs";
  if (/ice cream|frozen yogurt/.test(t)) return "Ice Cream & Frozen";
  if (/oat milk|almond milk|soy milk|plant.based milk|coconut milk/.test(t)) return "Plant-Based";
  return null;
}

function detectCondimentCategory(text: string): string | null {
  const t = text.toLowerCase();
  if (/ketchup|tomato sauce/.test(t)) return "Ketchup & Tomato";
  if (/mustard/.test(t)) return "Mustard";
  if (/mayo|mayonnaise/.test(t)) return "Mayonnaise";
  if (/salad dressing|ranch|caesar|vinaigrette/.test(t)) return "Salad Dressings";
  if (/bbq|barbecue sauce/.test(t)) return "BBQ Sauce";
  if (/hot sauce|sriracha|tabasco/.test(t)) return "Hot Sauce";
  if (/soy sauce|liquid aminos|tamari/.test(t)) return "Soy Sauce & Liquid Aminos";
  if (/peanut butter|almond butter|nut butter/.test(t)) return "Nut Butters";
  if (/jam|jelly|preserve|spread/.test(t)) return "Jams & Jellies";
  if (/oil|canola|vegetable oil|olive oil|avocado oil/.test(t)) return "Cooking Oils";
  return null;
}

function detectFrozenCategory(text: string): string | null {
  const t = text.toLowerCase();
  if (/pizza/.test(t)) return "pizza";
  if (/burrito|taco|enchilada/.test(t)) return "burritos";
  if (/breakfast|waffle|pancake|egg sandwich/.test(t)) return "breakfast";
  if (/ice cream|gelato|sorbet|frozen dessert/.test(t)) return "desserts";
  if (/frozen meal|frozen dinner|lean cuisine|healthy choice/.test(t)) return "meals";
  if (/frozen meat|frozen chicken|frozen beef/.test(t)) return "meats";
  if (/frozen fish|frozen shrimp|frozen seafood/.test(t)) return "seafood";
  if (/frozen vegetable|edamame|frozen broccoli/.test(t)) return "vegetables";
  return null;
}

function detectMeatCategory(text: string): string | null {
  const t = text.toLowerCase();
  if (/beef|steak|ground beef|brisket|chuck|sirloin|ribeye/.test(t)) return "beef";
  if (/chicken|poultry|breast|thigh|wing|drumstick/.test(t)) return "chicken";
  if (/pork|bacon|ham|sausage|chorizo|prosciutto|salami/.test(t)) return "pork";
  if (/turkey|ground turkey/.test(t)) return "turkey";
  if (/lamb|mutton/.test(t)) return "lamb";
  if (/bison|buffalo/.test(t)) return "bison";
  if (/fish|salmon|tuna|shrimp|cod|tilapia|halibut|sardine|crab|lobster|scallop|seafood/.test(t)) return "seafood";
  if (/deli|lunch meat|cold cut|bologna|pepperoni/.test(t)) return "deli meat";
  return null;
}

function detectFruitCategory(text: string): string | null {
  const t = text.toLowerCase();
  if (/berry|strawberry|blueberry|raspberry|blackberry|cranberry/.test(t)) return "berries";
  if (/orange|lemon|lime|grapefruit|citrus|clementine/.test(t)) return "citrus";
  if (/mango|pineapple|papaya|banana|kiwi|coconut|guava/.test(t)) return "tropical";
  if (/peach|nectarine|cherry|plum|apricot/.test(t)) return "stone fruit";
  if (/apple|pear|quince/.test(t)) return "pome fruit";
  if (/watermelon|cantaloupe|honeydew|melon/.test(t)) return "melon";
  return null;
}

// ─── Reason builders ─────────────────────────────────────────────────────────

function snackReason(entry: SnackEntry, newScore: number, oldScore: number): string {
  const diff = newScore - oldScore;
  const top = entry.positives[0] || "cleaner ingredients";
  const concern = entry.concerns[0];
  if (diff >= 40) return `+${diff} pts — ${top}. Major upgrade from ${concern ? `products with ${concern.toLowerCase()}` : "ultra-processed options"}.`;
  if (diff >= 20) return `+${diff} pts — ${top}. ${entry.certifications[0] ? entry.certifications[0] + " certified." : "No seed oils or artificial additives."}`;
  return `+${diff} pts — ${top || "cleaner formula with fewer additives"}.`;
}

function grainReason(entry: GrainsEntry, newScore: number, oldScore: number): string {
  const diff = newScore - oldScore;
  const benefits: string[] = [];
  if (!entry.hasSeedOils) benefits.push("no seed oils");
  if (!entry.hasHFCS) benefits.push("no HFCS");
  if (entry.isWholeGrain) benefits.push("100% whole grain");
  if (entry.isOrganic) benefits.push("organic");
  const top = benefits.slice(0, 2).join(", ");
  return `+${diff} pts — ${top || entry.benefits[0] || "cleaner grain formula"}.`;
}

function dairyReason(entry: DairyEntry, newScore: number, oldScore: number): string {
  const diff = newScore - oldScore;
  const highlights: string[] = [];
  if (entry.grassFed) highlights.push("grass-fed");
  if (entry.organic) highlights.push("organic");
  if (entry.pastureRaised) highlights.push("pasture-raised");
  if (entry.hormoneFree) highlights.push("hormone-free");
  const top = highlights.slice(0, 2).join(", ");
  return `+${diff} pts — ${top || entry.benefits[0] || "higher quality sourcing"}.`;
}

function condimentReason(entry: CondimentEntry, newScore: number, oldScore: number): string {
  const diff = newScore - oldScore;
  const highlights: string[] = [];
  if (!entry.hasSeedOils) highlights.push("no seed oils");
  if (!entry.hasHFCS) highlights.push("no HFCS");
  if (!entry.hasArtificialIngredients) highlights.push("no artificial ingredients");
  if (entry.organic) highlights.push("organic");
  const top = highlights.slice(0, 2).join(", ");
  return `+${diff} pts — ${top || entry.benefits[0] || "cleaner condiment formula"}.`;
}

function frozenReason(entry: FrozenEntry, newScore: number, oldScore: number): string {
  const diff = newScore - oldScore;
  const highlights: string[] = [];
  if (!entry.hasSeedOils) highlights.push("no seed oils");
  if (!entry.hasPreservatives) highlights.push("no preservatives");
  if (!entry.hasArtificialColors) highlights.push("no artificial colors");
  if (entry.isOrganic) highlights.push("organic");
  const top = highlights.slice(0, 2).join(", ");
  return `+${diff} pts — ${top || "cleaner frozen option"}.`;
}

function meatReason(brand: MeatBrandEntry, newScore: number, oldScore: number): string {
  const diff = newScore - oldScore;
  const highlights: string[] = [];
  if (brand.meatGrade?.isGrassFed) highlights.push("grass-fed");
  if (brand.meatGrade?.isOrganic) highlights.push("organic");
  if (brand.meatGrade?.isAntibiotic) highlights.push("no antibiotics");
  if (brand.labels?.includes("no-hormones")) highlights.push("no hormones");
  const top = highlights.slice(0, 2).join(", ");
  return `+${diff} pts${top ? ` — ${top}` : " — better sourcing practices"}.`;
}

function fruitReason(fruit: FruitEntry, newScore: number, oldScore: number): string {
  const diff = newScore - oldScore;
  if (fruit.ewgStatus === "clean-fifteen") {
    return `+${diff} pts — EWG Clean Fifteen, very low pesticide residue.`;
  }
  const top = fruit.nutritionHighlights.slice(0, 2).join(", ");
  return `+${diff} pts — ${top || "excellent nutritional profile"}.`;
}

// ─── Emoji helpers ────────────────────────────────────────────────────────────

function getSnackEmoji(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("chip")) return "🥨";
  if (c.includes("cookie")) return "🍪";
  if (c.includes("candy") || c.includes("chocolate")) return "🍫";
  if (c.includes("popcorn")) return "🍿";
  if (c.includes("nut")) return "🥜";
  if (c.includes("bar")) return "🍫";
  if (c.includes("cracker")) return "🧇";
  if (c.includes("ice cream") || c.includes("frozen")) return "🍦";
  return "🍬";
}

function getGrainEmoji(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("bread")) return "🍞";
  if (c.includes("cereal")) return "🥣";
  if (c.includes("pasta")) return "🍝";
  if (c.includes("cracker")) return "🧇";
  if (c.includes("tortilla")) return "🫓";
  if (c.includes("bagel")) return "🥯";
  if (c.includes("oat")) return "🌾";
  return "🌾";
}

function getDairyEmoji(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("yogurt")) return "🥛";
  if (c.includes("milk")) return "🥛";
  if (c.includes("cheese")) return "🧀";
  if (c.includes("butter") || c.includes("ghee")) return "🧈";
  if (c.includes("egg")) return "🥚";
  if (c.includes("ice cream")) return "🍦";
  return "🥛";
}

function getCondimentEmoji(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("ketchup")) return "🍅";
  if (c.includes("mustard")) return "🌭";
  if (c.includes("mayo")) return "🥚";
  if (c.includes("oil")) return "🫒";
  if (c.includes("nut butter")) return "🥜";
  if (c.includes("hot sauce")) return "🌶️";
  if (c.includes("bbq")) return "🍖";
  return "🫙";
}

function getMeatEmoji(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("beef") || t.includes("bison") || t.includes("burger")) return "🥩";
  if (t.includes("chicken") || t.includes("poultry")) return "🍗";
  if (t.includes("pork") || t.includes("bacon")) return "🥓";
  if (t.includes("turkey")) return "🦃";
  if (t.includes("fish") || t.includes("salmon") || t.includes("seafood")) return "🐟";
  if (t.includes("lamb")) return "🐑";
  return "🥩";
}

function getFruitEmoji(id: string): string {
  const map: Record<string, string> = {
    strawberry: "🍓", raspberries: "🫐", blackberries: "🫐", blueberries: "🫐",
    oranges: "🍊", lemons: "🍋", limes: "🍋", grapefruit: "🍊",
    avocado: "🥑", mango: "🥭", pineapple: "🍍", banana: "🍌", kiwi: "🥝",
    peaches: "🍑", cherries: "🍒", plums: "🍑", apricots: "🍑",
    apples: "🍎", pears: "🍐",
    watermelon: "🍉", cantaloupe: "🍈", honeydew: "🍈",
    "grapes-red": "🍇", "grapes-green": "🍇",
  };
  return map[id] || "🍎";
}

// ─── Main Engine ─────────────────────────────────────────────────────────────

export function findAlternatives(
  product: FoodProduct,
  currentScore: number,
  limit = 3
): Alternative[] {
  if (currentScore >= 70) return [];

  const name = (product.name || "").toLowerCase();
  const ingredients = (product.ingredients || "").toLowerCase();
  const category = (product.category || "").toLowerCase();
  const text = `${name} ${ingredients} ${category}`;

  const results: Alternative[] = [];

  // ── 1. Snacks ──────────────────────────────────────────────────────────────
  const snackCat = detectSnackCategory(text);
  if (snackCat && results.length < limit) {
    const snackAlts = ALL_SNACKS
      .filter((s) => s.category === snackCat && s.score > currentScore + 8)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit - results.length);

    for (const s of snackAlts) {
      results.push({
        id: `snack-${s.id}`,
        name: s.name,
        brand: s.brand,
        score: s.score,
        category: s.category,
        reason: snackReason(s, s.score, currentScore),
        type: "snack",
        certifications: s.certifications,
        image: s.imageUrl,
        emoji: getSnackEmoji(s.category),
      });
    }
  }

  // ── 2. Grains ──────────────────────────────────────────────────────────────
  const grainCat = detectGrainCategory(text);
  if (grainCat && results.length < limit) {
    const grainAlts = ALL_GRAINS
      .filter((g) => g.category === grainCat && g.score > currentScore + 8)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit - results.length);

    for (const g of grainAlts) {
      results.push({
        id: `grain-${g.id}`,
        name: g.name,
        brand: g.brand,
        score: g.score,
        category: g.category,
        reason: grainReason(g, g.score, currentScore),
        type: "grain",
        certifications: [],
        image: g.imageUrl,
        emoji: getGrainEmoji(g.category),
      });
    }
  }

  // ── 3. Dairy ───────────────────────────────────────────────────────────────
  const dairyCat = detectDairyCategory(text);
  if (dairyCat && results.length < limit) {
    const dairyAlts = ALL_DAIRY
      .filter((d) => d.category === dairyCat && d.score > currentScore + 8)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit - results.length);

    for (const d of dairyAlts) {
      results.push({
        id: `dairy-${d.id}`,
        name: d.name,
        brand: d.brand,
        score: d.score,
        category: d.category,
        reason: dairyReason(d, d.score, currentScore),
        type: "dairy",
        certifications: d.certifications,
        image: d.imageUrl,
        emoji: getDairyEmoji(d.category),
      });
    }
  }

  // ── 4. Condiments ──────────────────────────────────────────────────────────
  const condCat = detectCondimentCategory(text);
  if (condCat && results.length < limit) {
    const condAlts = ALL_CONDIMENTS
      .filter((c) => c.category === condCat && c.score > currentScore + 8)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit - results.length);

    for (const c of condAlts) {
      results.push({
        id: `condiment-${c.id}`,
        name: c.name,
        brand: c.brand,
        score: c.score,
        category: c.category,
        reason: condimentReason(c, c.score, currentScore),
        type: "condiment",
        certifications: [],
        image: c.imageUrl,
        emoji: getCondimentEmoji(c.category),
      });
    }
  }

  // ── 5. Frozen ──────────────────────────────────────────────────────────────
  const frozenCat = detectFrozenCategory(text);
  if (frozenCat && results.length < limit) {
    const frozenAlts = ALL_FROZEN
      .filter((f) => f.category === frozenCat && f.score > currentScore + 8)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit - results.length);

    for (const f of frozenAlts) {
      results.push({
        id: `frozen-${f.id}`,
        name: f.name,
        brand: f.brand,
        score: f.score,
        category: f.category,
        reason: frozenReason(f, f.score, currentScore),
        type: "frozen",
        certifications: [],
        image: f.imageUrl,
        emoji: "❄️",
      });
    }
  }

  // ── 6. Meat ────────────────────────────────────────────────────────────────
  const meatCat = detectMeatCategory(text);
  if (meatCat && results.length < limit) {
    const meatAlts = ALL_MEAT_BRANDS
      .filter((m) => {
        const mText = `${m.name} ${m.category}`.toLowerCase();
        return mText.includes(meatCat) || m.category.toLowerCase().includes(meatCat);
      })
      .map((m) => ({ brand: m, score: analyzeMeatProduct(m.ingredients, m.meatGrade).score }))
      .filter(({ score }) => score > currentScore + 8)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit - results.length);

    for (const { brand: m, score } of meatAlts) {
      results.push({
        id: `meat-${m.brand}-${m.name}`,
        name: m.name,
        brand: m.brand,
        score,
        category: m.category,
        reason: meatReason(m, score, currentScore),
        type: "meat",
        certifications: m.labels || [],
        image: m.imageUrl,
        emoji: getMeatEmoji(m.category),
      });
    }
  }

  // ── 7. Fruit ───────────────────────────────────────────────────────────────
  const fruitCat = detectFruitCategory(text);
  if (fruitCat && results.length < limit) {
    const fruitAlts = ALL_FRUITS
      .filter((f) => {
        const fCat = f.category.toLowerCase();
        return fCat.includes(fruitCat) || fruitCat.includes(fCat.split(" ")[0]);
      })
      .map((f) => ({ fruit: f, score: getFruitDisplayScore(f, false) }))
      .filter(({ score }) => score > currentScore + 8)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit - results.length);

    for (const { fruit: f, score } of fruitAlts) {
      results.push({
        id: `fruit-${f.id}`,
        name: f.name,
        brand: f.ewgStatus === "clean-fifteen" ? "Clean Fifteen ✓" : "Fresh Produce",
        score,
        category: f.category,
        reason: fruitReason(f, score, currentScore),
        type: "fruit",
        certifications: f.ewgStatus === "clean-fifteen" ? ["EWG Clean Fifteen"] : [],
        emoji: getFruitEmoji(f.id),
      });
    }
  }

  // ── 8. Broad fallback: top-rated snacks in any category ───────────────────
  if (results.length === 0) {
    // Try to find anything in the snack DB that's significantly better
    const broadSnacks = ALL_SNACKS
      .filter((s) => s.score >= 80 && s.score > currentScore + 15)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    for (const s of broadSnacks) {
      results.push({
        id: `snack-${s.id}`,
        name: s.name,
        brand: s.brand,
        score: s.score,
        category: s.category,
        reason: `+${s.score - currentScore} pts — ${s.positives[0] || "clean, minimally processed"}.`,
        type: "snack",
        certifications: s.certifications,
        image: s.imageUrl,
        emoji: getSnackEmoji(s.category),
      });
    }
  }

  // ── 9. Last-resort fallback: top-rated meat brands ────────────────────────
  if (results.length === 0) {
    const topMeats = ALL_MEAT_BRANDS
      .map((m) => ({ brand: m, score: analyzeMeatProduct(m.ingredients, m.meatGrade).score }))
      .filter(({ score }) => score >= 85)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    for (const { brand: m, score } of topMeats) {
      results.push({
        id: `meat-${m.brand}-${m.name}`,
        name: m.name,
        brand: m.brand,
        score,
        category: m.category,
        reason: `Top-rated clean protein — ${m.labels?.slice(0, 2).join(", ") || "high quality sourcing"}.`,
        type: "meat",
        certifications: m.labels || [],
        image: m.imageUrl,
        emoji: getMeatEmoji(m.category),
      });
    }
  }

  return results.slice(0, limit);
}

// ─── Score threshold helpers ──────────────────────────────────────────────────

export function shouldShowAlternatives(score: number): boolean {
  return score < 70;
}

export function getAlternativesMessage(score: number): string {
  if (score < 30) return "This product has serious quality concerns. Here are much healthier options:";
  if (score < 50) return "This product has several concerning ingredients. Consider these cleaner alternatives:";
  if (score < 60) return "This product has some issues. Here are better options in the same category:";
  return "You can do a little better. Here are some cleaner alternatives:";
}
