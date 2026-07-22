/**
 * Body Benefits Database
 * Educational data on which foods support different body systems.
 * Each category has top foods with images, key nutrients, explanations,
 * and links to EatVera's food database.
 */

export interface BodyBenefitNutrient {
  name: string;
  why: string;
  amount?: string; // e.g. "per 100g"
}

export interface BodyBenefitFood {
  id: string;
  name: string;
  imageUrl: string;
  tagline: string;           // Short punchy benefit
  explanation: string;       // 2-3 sentence science-backed explanation
  keyNutrients: BodyBenefitNutrient[];
  servingSuggestion: string; // How to eat it for max benefit
  dbPath?: string;           // Link to EatVera database page (e.g. /fruits, /meats)
  dbLabel?: string;          // Label for the database link button
  score: number;             // 1-10 benefit score for this system
}

export interface BodyBenefitCategory {
  id: string;
  name: string;
  tagline: string;
  description: string;
  emoji: string;
  gradient: string;
  glowColor: string;
  accentColor: string;
  bodyPart: string;          // Anatomical label shown on card
  foods: BodyBenefitFood[];
  quickTip: string;          // One-liner tip shown at top of detail page
}

export const BODY_BENEFITS: BodyBenefitCategory[] = [
  // ── Brain Health ────────────────────────────────────────────────────────────
  {
    id: "brain",
    name: "Brain Health",
    tagline: "Sharpen focus, memory & mood",
    description: "The brain is 60% fat and runs on glucose — the foods you eat directly shape your cognition, memory, and mental clarity. These are the top foods backed by neuroscience.",
    emoji: "🧠",
    gradient: "linear-gradient(145deg, #0d1a3a 0%, #1a2d6b 55%, #2040a0 100%)",
    glowColor: "rgba(32,64,160,0.5)",
    accentColor: "#6b8ef5",
    bodyPart: "Cognitive Function",
    quickTip: "Eat oily fish 2–3× per week — DHA is the primary structural fat in brain neurons.",
    foods: [
      {
        id: "brain-salmon",
        name: "Wild Salmon",
        imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80",
        tagline: "The #1 brain food",
        explanation: "Wild salmon is loaded with DHA omega-3, the primary structural fat in brain neurons. Studies show DHA supplementation improves memory, reduces brain fog, and lowers risk of Alzheimer's by up to 47%. The astaxanthin in salmon also crosses the blood-brain barrier to reduce neuroinflammation.",
        keyNutrients: [
          { name: "DHA Omega-3", why: "Primary structural fat in neurons; improves memory and reduces inflammation", amount: "2.2g per 100g" },
          { name: "EPA Omega-3", why: "Reduces neuroinflammation and supports mood regulation", amount: "0.6g per 100g" },
          { name: "Astaxanthin", why: "Potent antioxidant that crosses the blood-brain barrier", amount: "0.4mg per 100g" },
          { name: "Vitamin B12", why: "Essential for myelin sheath production; deficiency causes brain fog", amount: "3.2µg per 100g" },
        ],
        servingSuggestion: "4–6 oz grilled or baked 2–3× per week. Avoid frying — heat destroys omega-3s.",
        dbPath: "/meats",
        dbLabel: "View in Meat & Seafood Guide",
        score: 10,
      },
      {
        id: "brain-blueberries",
        name: "Wild Blueberries",
        imageUrl: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600&q=80",
        tagline: "Memory-boosting antioxidants",
        explanation: "Blueberries contain flavonoids called anthocyanins that accumulate in brain regions associated with learning and memory. A Harvard study found women who ate blueberries regularly delayed cognitive aging by 2.5 years. They also increase BDNF — the brain's growth hormone.",
        keyNutrients: [
          { name: "Anthocyanins", why: "Accumulate in hippocampus; directly improve memory formation", amount: "163mg per 100g" },
          { name: "Pterostilbene", why: "More bioavailable than resveratrol; crosses blood-brain barrier easily" },
          { name: "Vitamin C", why: "Protects neurons from oxidative stress", amount: "9.7mg per 100g" },
          { name: "BDNF Stimulants", why: "Compounds that increase Brain-Derived Neurotrophic Factor" },
        ],
        servingSuggestion: "1 cup fresh or frozen daily. Frozen wild blueberries have higher anthocyanin content than fresh farmed.",
        dbPath: "/fruits",
        dbLabel: "View in Fruit Guide",
        score: 9,
      },
      {
        id: "brain-walnuts",
        name: "Walnuts",
        imageUrl: "/manus-storage/7lALpblHjCFA_421bc940.jpg",
        tagline: "Nature's brain-shaped superfood",
        explanation: "Walnuts are the only nut with significant ALA omega-3, which converts to DHA in the brain. They contain neuroprotective compounds including vitamin E, folate, and melatonin. UCLA research showed that walnut consumers scored significantly higher on cognitive tests.",
        keyNutrients: [
          { name: "ALA Omega-3", why: "Plant-based omega-3 that partially converts to brain-essential DHA", amount: "9g per 28g" },
          { name: "Vitamin E (γ-tocopherol)", why: "Protects neuronal membranes from oxidative damage", amount: "0.7mg per 28g" },
          { name: "Polyphenols", why: "Reduce neuroinflammation and improve signaling between neurons" },
          { name: "Melatonin", why: "Supports circadian rhythm and sleep quality, which consolidates memory" },
        ],
        servingSuggestion: "A small handful (7 whole walnuts) daily as a snack. Eat raw — roasting reduces omega-3 content.",
        dbPath: "/snacks",
        dbLabel: "View in Snacks Guide",
        score: 9,
      },
      {
        id: "brain-eggs",
        name: "Pasture-Raised Eggs",
        imageUrl: "https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=600&q=80",
        tagline: "Choline powerhouse for memory",
        explanation: "Eggs are the richest dietary source of choline, which your brain uses to produce acetylcholine — the neurotransmitter responsible for memory and learning. Studies show 90% of Americans are choline-deficient. Pasture-raised eggs have 2× more omega-3 than conventional.",
        keyNutrients: [
          { name: "Choline", why: "Precursor to acetylcholine, the memory and learning neurotransmitter", amount: "147mg per egg" },
          { name: "Lutein & Zeaxanthin", why: "Carotenoids that accumulate in brain tissue and improve processing speed" },
          { name: "Vitamin B12", why: "Prevents brain shrinkage and cognitive decline", amount: "0.6µg per egg" },
          { name: "Phosphatidylserine", why: "Phospholipid that maintains fluidity of brain cell membranes" },
        ],
        servingSuggestion: "2–3 whole eggs daily. The yolk contains all the brain nutrients — don't discard it.",
        dbPath: "/meats",
        dbLabel: "View in Meat Guide",
        score: 9,
      },
      {
        id: "brain-dark-chocolate",
        name: "Dark Chocolate (85%+)",
        imageUrl: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80",
        tagline: "Mood & focus in every bite",
        explanation: "Dark chocolate (85%+) contains flavanols that increase cerebral blood flow by up to 8%, directly improving attention and processing speed. It also triggers endorphin and serotonin release. The theobromine provides a smooth, sustained energy boost without the crash of caffeine.",
        keyNutrients: [
          { name: "Cocoa Flavanols", why: "Increase cerebral blood flow and improve working memory", amount: "~200mg per 30g" },
          { name: "Theobromine", why: "Mild stimulant that improves focus without anxiety", amount: "~200mg per 30g" },
          { name: "Magnesium", why: "Regulates NMDA receptors critical for learning and memory", amount: "64mg per 30g" },
          { name: "Phenylethylamine", why: "Triggers endorphin release and elevates mood" },
        ],
        servingSuggestion: "1–2 squares (15–30g) of 85%+ dark chocolate daily. Higher cacao = more flavanols, less sugar.",
        dbPath: "/snacks",
        dbLabel: "View in Snacks Guide",
        score: 8,
      },
      {
        id: "brain-avocado",
        name: "Avocado",
        imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80",
        tagline: "Healthy fats for sharp thinking",
        explanation: "Avocados are rich in oleic acid (the same fat as olive oil) which forms the myelin sheath that insulates nerve fibers — essential for fast neural transmission. They're also high in lutein, which research links to better cognitive function and academic performance.",
        keyNutrients: [
          { name: "Oleic Acid (Omega-9)", why: "Forms myelin sheath around neurons for faster signal transmission", amount: "9.8g per 100g" },
          { name: "Lutein", why: "Accumulates in brain tissue; associated with better cognitive performance" },
          { name: "Folate (B9)", why: "Reduces homocysteine, a compound that damages brain blood vessels", amount: "81µg per 100g" },
          { name: "Vitamin K", why: "Supports sphingolipid synthesis in brain cell membranes", amount: "21µg per 100g" },
        ],
        servingSuggestion: "Half an avocado daily. Pair with eggs or salmon to boost absorption of fat-soluble brain nutrients.",
        dbPath: "/vegetables",
        dbLabel: "View in Vegetable Guide",
        score: 8,
      },
    ],
  },

  // ── Heart Health ─────────────────────────────────────────────────────────────
  {
    id: "heart",
    name: "Heart Health",
    tagline: "Protect your most vital muscle",
    description: "Cardiovascular disease is the #1 cause of death globally, yet it's largely preventable through diet. These foods are proven to lower inflammation, improve cholesterol ratios, and strengthen your heart.",
    emoji: "❤️",
    gradient: "linear-gradient(145deg, #3a0a0a 0%, #6b1212 55%, #a01a1a 100%)",
    glowColor: "rgba(160,26,26,0.5)",
    accentColor: "#f87171",
    bodyPart: "Cardiovascular System",
    quickTip: "Extra virgin olive oil daily cuts heart attack risk by 30% — use it as your primary cooking fat.",
    foods: [
      {
        id: "heart-olive-oil",
        name: "Extra Virgin Olive Oil",
        imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
        tagline: "The Mediterranean heart shield",
        explanation: "The PREDIMED trial — the largest dietary intervention study ever — found that EVOO reduced major cardiovascular events by 30%. Its oleocanthal acts like ibuprofen to reduce arterial inflammation, while oleic acid raises HDL (good) cholesterol and lowers oxidized LDL.",
        keyNutrients: [
          { name: "Oleocanthal", why: "Natural anti-inflammatory that inhibits COX enzymes like ibuprofen" },
          { name: "Oleic Acid", why: "Raises HDL, lowers oxidized LDL, reduces arterial inflammation", amount: "73g per 100ml" },
          { name: "Polyphenols (Hydroxytyrosol)", why: "Prevent LDL oxidation — the key step in plaque formation" },
          { name: "Vitamin E", why: "Antioxidant that protects arterial walls from free radical damage", amount: "14mg per 100ml" },
        ],
        servingSuggestion: "2–4 tablespoons daily. Use for low-heat cooking and salad dressings. Buy cold-pressed, dark-bottled EVOO.",
        dbPath: "/condiments",
        dbLabel: "View in Condiments Guide",
        score: 10,
      },
      {
        id: "heart-fatty-fish",
        name: "Sardines",
        imageUrl: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=600&q=80",
        tagline: "The most underrated heart food",
        explanation: "Sardines are the most nutrient-dense heart food per dollar. They're loaded with EPA+DHA omega-3s that lower triglycerides by up to 30%, reduce blood pressure, and prevent arrhythmias. Because they're small fish, they accumulate almost no mercury.",
        keyNutrients: [
          { name: "EPA + DHA", why: "Lower triglycerides 30%, reduce blood pressure, prevent arrhythmias", amount: "1.5g per 100g" },
          { name: "CoQ10", why: "Powers the mitochondria in heart muscle cells", amount: "~5mg per 100g" },
          { name: "Selenium", why: "Antioxidant that protects heart tissue from oxidative stress", amount: "52µg per 100g" },
          { name: "Vitamin D", why: "Deficiency linked to 2× higher heart disease risk", amount: "4.8µg per 100g" },
        ],
        servingSuggestion: "2–3 cans per week. Choose sardines in olive oil or water, not vegetable oil.",
        dbPath: "/meats",
        dbLabel: "View in Seafood Guide",
        score: 10,
      },
      {
        id: "heart-pomegranate",
        name: "Pomegranate",
        imageUrl: "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=600&q=80",
        tagline: "Reverses arterial plaque",
        explanation: "Pomegranate is one of the only foods shown to actually reverse arterial plaque. A landmark study found that pomegranate juice reduced carotid artery thickness by 30% in 1 year. Its punicalagins are the most potent antioxidants found in any food — 3× more than red wine.",
        keyNutrients: [
          { name: "Punicalagins", why: "Most potent antioxidants known; reduce LDL oxidation and arterial plaque" },
          { name: "Punicic Acid", why: "Unique omega-5 fatty acid with potent anti-inflammatory effects" },
          { name: "Nitrates", why: "Convert to nitric oxide, relaxing blood vessels and lowering blood pressure" },
          { name: "Anthocyanins", why: "Strengthen arterial walls and reduce inflammation markers" },
        ],
        servingSuggestion: "4 oz (120ml) of 100% pomegranate juice daily, or eat the seeds. Avoid sweetened versions.",
        dbPath: "/fruits",
        dbLabel: "View in Fruit Guide",
        score: 9,
      },
      {
        id: "heart-beets",
        name: "Beets",
        imageUrl: "https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=600&q=80",
        tagline: "Natural blood pressure reducer",
        explanation: "Beets are exceptionally high in dietary nitrates, which the body converts to nitric oxide — a molecule that relaxes and dilates blood vessels. Studies show beet juice can lower systolic blood pressure by 4–10 mmHg within hours, comparable to some medications.",
        keyNutrients: [
          { name: "Dietary Nitrates", why: "Convert to nitric oxide, dilating blood vessels and lowering BP", amount: "250mg per 100g" },
          { name: "Betaine", why: "Reduces homocysteine, a key risk factor for heart disease", amount: "128mg per 100g" },
          { name: "Betalains", why: "Pigments with potent anti-inflammatory and antioxidant properties" },
          { name: "Folate (B9)", why: "Lowers homocysteine and supports red blood cell production", amount: "109µg per 100g" },
        ],
        servingSuggestion: "1 medium beet or 8 oz beet juice 3–4× per week. Roasting preserves more nutrients than boiling.",
        dbPath: "/vegetables",
        dbLabel: "View in Vegetable Guide",
        score: 8,
      },
    ],
  },

  // ── Muscle Growth ────────────────────────────────────────────────────────────
  {
    id: "muscle",
    name: "Muscle Growth",
    tagline: "Build lean mass & recover faster",
    description: "Muscle protein synthesis requires the right amino acids at the right times. These foods provide complete proteins, anabolic cofactors, and recovery nutrients to maximize your training results.",
    emoji: "💪",
    gradient: "linear-gradient(145deg, #1a0a2e 0%, #2d1a52 55%, #4a2880 100%)",
    glowColor: "rgba(74,40,128,0.5)",
    accentColor: "#a78bfa",
    bodyPart: "Skeletal Muscle",
    quickTip: "Consume 0.7–1g of protein per pound of bodyweight daily, spread across 4–5 meals for maximum muscle protein synthesis.",
    foods: [
      {
        id: "muscle-beef",
        name: "Grass-Fed Beef",
        imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80",
        tagline: "The complete muscle-building protein",
        explanation: "Grass-fed beef has the highest leucine content of any whole food — leucine is the amino acid that directly activates mTOR, the master switch for muscle protein synthesis. It also contains creatine (the most studied muscle supplement), zinc for testosterone, and iron for oxygen delivery to muscles.",
        keyNutrients: [
          { name: "Leucine", why: "Directly activates mTOR — the master switch for muscle protein synthesis", amount: "2.8g per 100g" },
          { name: "Creatine", why: "Replenishes ATP for explosive strength; equivalent to ~5g creatine supplement", amount: "~0.5g per 100g" },
          { name: "Zinc", why: "Required for testosterone production and protein synthesis", amount: "4.8mg per 100g" },
          { name: "Heme Iron", why: "Most bioavailable form of iron; delivers oxygen to working muscles", amount: "2.6mg per 100g" },
        ],
        servingSuggestion: "4–8 oz of 80/20 or leaner ground beef or steak 4–5× per week. Choose grass-fed for better omega-3 ratio.",
        dbPath: "/meats",
        dbLabel: "View in Meat Guide",
        score: 10,
      },
      {
        id: "muscle-eggs",
        name: "Whole Eggs",
        imageUrl: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80",
        tagline: "Nature's perfect protein package",
        explanation: "Whole eggs have a Protein Digestibility Corrected Amino Acid Score (PDCAAS) of 1.0 — the maximum possible. Post-workout studies show whole eggs stimulate 40% more muscle protein synthesis than egg whites alone, because the yolk's fat and micronutrients amplify the anabolic response.",
        keyNutrients: [
          { name: "Complete Amino Acid Profile", why: "All 9 essential amino acids in near-perfect ratios for human muscle" },
          { name: "Leucine", why: "1.1g per egg — directly triggers muscle protein synthesis", amount: "1.1g per egg" },
          { name: "Choline", why: "Supports acetylcholine for muscle contraction and nerve signaling", amount: "147mg per egg" },
          { name: "Vitamin D", why: "Deficiency reduces muscle strength and increases injury risk", amount: "1.1µg per egg" },
        ],
        servingSuggestion: "3–5 whole eggs daily. Post-workout scramble with whole eggs + extra whites is optimal.",
        dbPath: "/meats",
        dbLabel: "View in Meat Guide",
        score: 10,
      },
      {
        id: "muscle-greek-yogurt",
        name: "Greek Yogurt",
        imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
        tagline: "Slow-release casein for overnight gains",
        explanation: "Greek yogurt contains both whey (fast-absorbing) and casein (slow-absorbing) proteins, making it ideal before bed. Casein forms a gel in the stomach and releases amino acids over 7–8 hours, preventing muscle breakdown during sleep. Studies show pre-sleep protein increases overnight muscle protein synthesis by 22%.",
        keyNutrients: [
          { name: "Casein Protein", why: "Slow-digesting protein that prevents overnight muscle catabolism" },
          { name: "Whey Protein", why: "Fast-absorbing protein that spikes amino acids for immediate synthesis" },
          { name: "Calcium", why: "Required for muscle contraction; deficiency causes cramps", amount: "111mg per 100g" },
          { name: "Probiotics", why: "Improve protein absorption by up to 20% through gut health" },
        ],
        servingSuggestion: "1 cup (200g) before bed or post-workout. Choose full-fat, plain Greek yogurt — avoid flavored versions with added sugar.",
        dbPath: "/dairy",
        dbLabel: "View in Dairy Guide",
        score: 9,
      },
      {
        id: "muscle-tart-cherry",
        name: "Tart Cherry Juice",
        imageUrl: "https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=600&q=80",
        tagline: "Fastest muscle recovery food",
        explanation: "Tart cherry juice is the most evidence-backed food for exercise recovery. Studies show it reduces muscle soreness by 22%, strength loss by 18%, and inflammation markers by 25% after intense exercise. It's used by elite athletes including marathon runners and NFL players.",
        keyNutrients: [
          { name: "Anthocyanins", why: "Inhibit COX-1 and COX-2 enzymes — same mechanism as ibuprofen", amount: "~80mg per 240ml" },
          { name: "Melatonin", why: "Improves sleep quality for overnight muscle repair", amount: "~0.1mg per 240ml" },
          { name: "Quercetin", why: "Reduces exercise-induced oxidative stress and inflammation" },
          { name: "Potassium", why: "Prevents muscle cramps and supports electrolyte balance", amount: "330mg per 240ml" },
        ],
        servingSuggestion: "8 oz (240ml) of 100% tart cherry juice twice daily on training days — morning and post-workout.",
        dbPath: "/beverages",
        dbLabel: "View in Beverages Guide",
        score: 9,
      },
    ],
  },

  // ── Gut Health ───────────────────────────────────────────────────────────────
  {
    id: "gut",
    name: "Gut Health",
    tagline: "Your second brain — heal it first",
    description: "70% of your immune system lives in your gut. The gut-brain axis means your microbiome directly affects your mood, energy, and cognition. These foods feed beneficial bacteria and repair the gut lining.",
    emoji: "🌿",
    gradient: "linear-gradient(145deg, #0a2e14 0%, #0f4020 55%, #145c2e 100%)",
    glowColor: "rgba(20,92,46,0.5)",
    accentColor: "#4ade80",
    bodyPart: "Digestive System",
    quickTip: "Aim for 30 different plant foods per week — diversity of plants = diversity of beneficial gut bacteria.",
    foods: [
      {
        id: "gut-kefir",
        name: "Kefir",
        imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80",
        tagline: "The most potent probiotic food",
        explanation: "Kefir contains 30–50 different probiotic strains — far more than yogurt's typical 2–7. A Stanford study found kefir was more effective than a high-fiber diet at increasing microbiome diversity. It also contains kefiran, a unique polysaccharide that directly repairs the gut lining.",
        keyNutrients: [
          { name: "Probiotic Strains (30–50)", why: "Diverse bacteria colonize the gut and crowd out harmful pathogens" },
          { name: "Kefiran", why: "Unique polysaccharide that repairs intestinal lining and reduces permeability" },
          { name: "Tryptophan", why: "Precursor to serotonin — 90% of which is produced in the gut", amount: "0.1g per 100ml" },
          { name: "Calcium & Magnesium", why: "Support smooth muscle contractions for healthy gut motility" },
        ],
        servingSuggestion: "1 cup (240ml) daily, ideally in the morning on an empty stomach. Start with 4 oz and increase gradually.",
        dbPath: "/dairy",
        dbLabel: "View in Dairy Guide",
        score: 10,
      },
      {
        id: "gut-sauerkraut",
        name: "Sauerkraut",
        imageUrl: "https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=600&q=80",
        tagline: "Fermented fiber + live cultures",
        explanation: "Raw sauerkraut contains billions of Lactobacillus bacteria per gram — more than most probiotic supplements. The fermentation process also pre-digests the cabbage, making its nutrients more bioavailable. Glucosinolates in cabbage convert to compounds that protect the gut lining from cancer.",
        keyNutrients: [
          { name: "Lactobacillus Bacteria", why: "Dominant probiotic species that acidify the gut and prevent pathogen growth" },
          { name: "Glucosinolates", why: "Convert to isothiocyanates that protect gut cells from DNA damage" },
          { name: "Vitamin C", why: "Preserved through fermentation; supports gut immune cells", amount: "14.7mg per 100g" },
          { name: "Short-Chain Fatty Acids", why: "Feed colonocytes (gut lining cells) and reduce inflammation" },
        ],
        servingSuggestion: "2–4 tablespoons daily with meals. Must be raw/unpasteurized — pasteurization kills the beneficial bacteria.",
        dbPath: "/vegetables",
        dbLabel: "View in Vegetable Guide",
        score: 9,
      },
      {
        id: "gut-garlic",
        name: "Raw Garlic",
        imageUrl: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80",
        tagline: "Prebiotic powerhouse",
        explanation: "Garlic is one of the richest sources of inulin and fructooligosaccharides (FOS) — prebiotic fibers that selectively feed Bifidobacterium and Lactobacillus. Allicin, formed when garlic is crushed, is a potent antimicrobial that kills harmful bacteria without affecting beneficial strains.",
        keyNutrients: [
          { name: "Inulin & FOS", why: "Prebiotic fibers that selectively feed beneficial Bifidobacterium", amount: "9–16g per 100g" },
          { name: "Allicin", why: "Antimicrobial compound that kills pathogens without harming good bacteria" },
          { name: "Quercetin", why: "Reduces gut inflammation and strengthens intestinal tight junctions" },
          { name: "Selenium", why: "Antioxidant that protects gut lining from oxidative damage", amount: "14µg per 100g" },
        ],
        servingSuggestion: "2–4 raw cloves daily. Crush or mince and let sit 10 minutes before eating to maximize allicin formation.",
        dbPath: "/vegetables",
        dbLabel: "View in Vegetable Guide",
        score: 9,
      },
      {
        id: "gut-bone-broth",
        name: "Bone Broth",
        imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80",
        tagline: "Gut lining repair in a cup",
        explanation: "Bone broth is rich in gelatin, which breaks down into glycine and proline in the gut — amino acids that directly repair the intestinal lining and reduce leaky gut. Studies show glycine supplementation reduces intestinal permeability markers by 50% and decreases systemic inflammation.",
        keyNutrients: [
          { name: "Gelatin/Collagen", why: "Breaks down to glycine and proline that repair intestinal tight junctions" },
          { name: "Glycine", why: "Reduces intestinal permeability and systemic inflammation", amount: "~3g per cup" },
          { name: "Glutamine", why: "Primary fuel source for intestinal epithelial cells", amount: "~1g per cup" },
          { name: "Minerals (Ca, Mg, P)", why: "Bioavailable minerals that support gut muscle contractions" },
        ],
        servingSuggestion: "1–2 cups daily, ideally first thing in the morning. Choose organic, grass-fed bone broth.",
        dbPath: "/meats",
        dbLabel: "View in Meat Guide",
        score: 8,
      },
    ],
  },

  // ── Sleep ────────────────────────────────────────────────────────────────────
  {
    id: "sleep",
    name: "Sleep",
    tagline: "Eat your way to deeper sleep",
    description: "Sleep is when your body repairs, consolidates memory, and regulates hormones. Certain foods contain natural sleep-promoting compounds that work with your circadian rhythm — no melatonin pills needed.",
    emoji: "🌙",
    gradient: "linear-gradient(145deg, #0d0a2e 0%, #1a1452 55%, #251e80 100%)",
    glowColor: "rgba(37,30,128,0.5)",
    accentColor: "#818cf8",
    bodyPart: "Circadian Rhythm",
    quickTip: "Avoid eating within 3 hours of bedtime — digestion raises core body temperature, which delays sleep onset.",
    foods: [
      {
        id: "sleep-tart-cherry",
        name: "Tart Cherry Juice",
        imageUrl: "https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=600&q=80",
        tagline: "The only food with natural melatonin",
        explanation: "Tart cherries are one of the only foods with measurable melatonin content. A clinical trial found that tart cherry juice increased sleep time by 84 minutes and improved sleep efficiency by 6%. It also contains tryptophan and anthocyanins that reduce the inflammation that disrupts sleep.",
        keyNutrients: [
          { name: "Melatonin", why: "Directly signals the brain to initiate sleep; synchronizes circadian rhythm", amount: "~0.1mg per 240ml" },
          { name: "Tryptophan", why: "Precursor to serotonin and melatonin production", amount: "~6mg per 240ml" },
          { name: "Anthocyanins", why: "Reduce inflammation that disrupts sleep architecture" },
          { name: "Potassium & Magnesium", why: "Relax muscles and reduce nighttime cramps" },
        ],
        servingSuggestion: "8 oz (240ml) of 100% tart cherry juice 1–2 hours before bed. Avoid sweetened versions.",
        dbPath: "/beverages",
        dbLabel: "View in Beverages Guide",
        score: 10,
      },
      {
        id: "sleep-kiwi",
        name: "Kiwi",
        imageUrl: "https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=600&q=80",
        tagline: "The sleep study winner",
        explanation: "A 4-week study found that eating 2 kiwis one hour before bed improved sleep onset by 35%, total sleep time by 13%, and sleep efficiency by 5%. Kiwis are exceptionally high in serotonin precursors and folate — folate deficiency is strongly linked to insomnia.",
        keyNutrients: [
          { name: "Serotonin Precursors", why: "Kiwi contains compounds that raise brain serotonin, which converts to melatonin" },
          { name: "Folate (B9)", why: "Deficiency linked to insomnia; folate regulates sleep-related gene expression", amount: "25µg per kiwi" },
          { name: "Vitamin C", why: "Reduces oxidative stress that disrupts sleep quality", amount: "64mg per kiwi" },
          { name: "Actinidin", why: "Unique enzyme that improves protein digestion, reducing nighttime discomfort" },
        ],
        servingSuggestion: "2 kiwis, 1 hour before bed. Eat the skin too — it contains 3× more fiber and antioxidants.",
        dbPath: "/fruits",
        dbLabel: "View in Fruit Guide",
        score: 9,
      },
      {
        id: "sleep-magnesium-foods",
        name: "Pumpkin Seeds",
        imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?w=600&q=80",
        tagline: "Magnesium for deep, restorative sleep",
        explanation: "Pumpkin seeds are the richest food source of magnesium — a mineral that activates the parasympathetic nervous system and GABA receptors to calm the brain before sleep. 75% of Americans are magnesium deficient, which is strongly linked to insomnia and restless sleep.",
        keyNutrients: [
          { name: "Magnesium", why: "Activates GABA receptors that calm the nervous system for sleep", amount: "168mg per 28g" },
          { name: "Tryptophan", why: "Highest tryptophan content of any seed; precursor to melatonin", amount: "0.6g per 28g" },
          { name: "Zinc", why: "Works with magnesium to regulate melatonin production", amount: "2.2mg per 28g" },
          { name: "Glycine", why: "Amino acid that lowers core body temperature, a key sleep trigger" },
        ],
        servingSuggestion: "1 oz (28g) of raw pumpkin seeds as an evening snack, 1–2 hours before bed.",
        dbPath: "/snacks",
        dbLabel: "View in Snacks Guide",
        score: 9,
      },
      {
        id: "sleep-chamomile",
        name: "Chamomile Tea",
        imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=80",
        tagline: "Ancient sleep remedy, modern proof",
        explanation: "Chamomile contains apigenin, a flavonoid that binds to GABA-A receptors in the brain — the same receptors targeted by benzodiazepine sleep medications, but without the dependency. A clinical trial found chamomile tea significantly improved sleep quality and reduced nighttime waking.",
        keyNutrients: [
          { name: "Apigenin", why: "Binds GABA-A receptors to reduce anxiety and promote sleep onset" },
          { name: "Bisabolol", why: "Anti-inflammatory compound that reduces physical tension before sleep" },
          { name: "Luteolin", why: "Flavonoid with mild sedative properties" },
          { name: "Glycine (trace)", why: "Lowers core body temperature, signaling the brain to initiate sleep" },
        ],
        servingSuggestion: "1–2 cups of strong chamomile tea 30–60 minutes before bed. Steep for 5+ minutes for maximum apigenin extraction.",
        dbPath: "/beverages",
        dbLabel: "View in Beverages Guide",
        score: 8,
      },
    ],
  },

  // ── Testosterone Support ─────────────────────────────────────────────────────
  {
    id: "testosterone",
    name: "Testosterone",
    tagline: "Natural hormone optimization",
    description: "Testosterone is the master hormone for energy, libido, muscle mass, and confidence in both men and women. These foods provide the raw materials and cofactors your body needs to produce optimal levels naturally.",
    emoji: "⚡",
    gradient: "linear-gradient(145deg, #2a1a0a 0%, #4a2e10 55%, #7a4a18 100%)",
    glowColor: "rgba(122,74,24,0.5)",
    accentColor: "#fbbf24",
    bodyPart: "Endocrine System",
    quickTip: "Dietary fat is the direct precursor to testosterone — low-fat diets consistently lower testosterone by 10–15%.",
    foods: [
      {
        id: "test-oysters",
        name: "Oysters",
        imageUrl: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80",
        tagline: "Nature's testosterone superfood",
        explanation: "Oysters contain more zinc per serving than any other food — 6 oysters provide 32mg, over 3× the daily requirement. Zinc is the rate-limiting mineral for testosterone synthesis: studies show zinc supplementation in deficient men raises testosterone by 74% in 6 months. Oysters also contain D-aspartic acid, which stimulates LH release to signal testosterone production.",
        keyNutrients: [
          { name: "Zinc", why: "Rate-limiting mineral for testosterone synthesis; deficiency causes low T", amount: "32mg per 6 oysters" },
          { name: "D-Aspartic Acid", why: "Amino acid that stimulates LH release, signaling testosterone production" },
          { name: "Selenium", why: "Antioxidant that protects Leydig cells (testosterone-producing cells)", amount: "54µg per 6 oysters" },
          { name: "Vitamin D", why: "Deficiency linked to 30% lower testosterone; acts as a steroid hormone", amount: "3.8µg per 6 oysters" },
        ],
        servingSuggestion: "6 raw or steamed oysters 2–3× per week. Avoid fried — heat destroys zinc bioavailability.",
        dbPath: "/meats",
        dbLabel: "View in Seafood Guide",
        score: 10,
      },
      {
        id: "test-eggs",
        name: "Pasture-Raised Eggs",
        imageUrl: "https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=600&q=80",
        tagline: "Cholesterol is testosterone's raw material",
        explanation: "Testosterone is synthesized from cholesterol — and egg yolks are one of the richest dietary sources of cholesterol. Studies show men who eat whole eggs have higher testosterone levels than those who eat egg whites only. The saturated fat in yolks is also required for testosterone production.",
        keyNutrients: [
          { name: "Cholesterol", why: "Direct precursor molecule for testosterone biosynthesis", amount: "186mg per egg" },
          { name: "Saturated Fat", why: "Required for steroidogenesis — the process of making steroid hormones", amount: "1.6g per egg" },
          { name: "Vitamin D", why: "Steroid hormone that directly upregulates testosterone production", amount: "1.1µg per egg" },
          { name: "Zinc", why: "Cofactor for testosterone synthesis enzymes", amount: "0.6mg per egg" },
        ],
        servingSuggestion: "3–5 whole eggs daily. The yolk is essential — egg whites alone do not support testosterone.",
        dbPath: "/meats",
        dbLabel: "View in Meat Guide",
        score: 9,
      },
      {
        id: "test-pomegranate",
        name: "Pomegranate",
        imageUrl: "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=600&q=80",
        tagline: "Raises T and lowers cortisol",
        explanation: "A clinical study found that drinking pomegranate juice daily for 2 weeks increased salivary testosterone by 24% and reduced cortisol (the testosterone-blocking stress hormone) by 16%. Pomegranate's ellagitannins also inhibit aromatase — the enzyme that converts testosterone to estrogen.",
        keyNutrients: [
          { name: "Ellagitannins", why: "Inhibit aromatase enzyme, preventing testosterone-to-estrogen conversion" },
          { name: "Punicalagins", why: "Reduce cortisol, which blocks testosterone production when elevated" },
          { name: "Nitrates", why: "Improve blood flow to reproductive organs via nitric oxide" },
          { name: "Vitamin C", why: "Reduces oxidative stress in Leydig cells that produce testosterone" },
        ],
        servingSuggestion: "4 oz (120ml) of 100% pomegranate juice daily. Consistent daily use produces the best hormonal effects.",
        dbPath: "/fruits",
        dbLabel: "View in Fruit Guide",
        score: 9,
      },
      {
        id: "test-brazil-nuts",
        name: "Brazil Nuts",
        imageUrl: "https://images.unsplash.com/photo-1604542031658-5799ca5d7936?w=600&q=80",
        tagline: "2 nuts = your daily selenium",
        explanation: "Brazil nuts are the richest food source of selenium by far — just 2 nuts provide 200% of the daily requirement. Selenium is critical for testosterone production: it's concentrated in the testes and is required for sperm production. Studies show selenium supplementation raises testosterone in deficient men.",
        keyNutrients: [
          { name: "Selenium", why: "Concentrated in testes; essential for testosterone and sperm production", amount: "96µg per nut" },
          { name: "Magnesium", why: "Inhibits SHBG (sex hormone binding globulin), freeing more testosterone", amount: "107mg per 28g" },
          { name: "Zinc", why: "Cofactor for testosterone synthesis and sperm motility", amount: "1.2mg per 28g" },
          { name: "Healthy Fats", why: "Provide raw material for steroid hormone synthesis" },
        ],
        servingSuggestion: "2–3 Brazil nuts daily. Do not exceed 6 per day — selenium toxicity is possible at high doses.",
        dbPath: "/snacks",
        dbLabel: "View in Snacks Guide",
        score: 8,
      },
    ],
  },

  // ── Bone Health ──────────────────────────────────────────────────────────────
  {
    id: "bone",
    name: "Bone Health",
    tagline: "Build density, prevent fractures",
    description: "Bones are living tissue that constantly remodel. Peak bone density is set by age 30, but you can maintain and even improve density at any age with the right nutrients. These foods work synergistically to build strong, resilient bones.",
    emoji: "🦴",
    gradient: "linear-gradient(145deg, #1a1a2e 0%, #2a2a52 55%, #3a3a80 100%)",
    glowColor: "rgba(58,58,128,0.5)",
    accentColor: "#c4b5fd",
    bodyPart: "Skeletal System",
    quickTip: "Vitamin D3 and K2 must be taken together — D3 increases calcium absorption, K2 directs it into bones instead of arteries.",
    foods: [
      {
        id: "bone-sardines",
        name: "Canned Sardines (with bones)",
        imageUrl: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=600&q=80",
        tagline: "Eat the bones — they're the point",
        explanation: "Canned sardines with soft, edible bones are the most bioavailable source of calcium in the food supply — more than milk, because the calcium is in a matrix with protein and phosphorus that mirrors the composition of human bone. One can provides 35% of daily calcium needs.",
        keyNutrients: [
          { name: "Calcium (from bones)", why: "Most bioavailable food calcium; in a protein-phosphorus matrix like human bone", amount: "351mg per can" },
          { name: "Vitamin D", why: "Essential for calcium absorption — without it, only 10–15% of calcium is absorbed", amount: "4.8µg per can" },
          { name: "Phosphorus", why: "Works with calcium in a 1:1 ratio to form hydroxyapatite (bone mineral)", amount: "451mg per can" },
          { name: "Omega-3 (EPA+DHA)", why: "Reduce osteoclast activity (bone breakdown) and promote bone formation" },
        ],
        servingSuggestion: "1 can of sardines with bones 3–4× per week. Mash the bones into the fish — they're soft and flavorless.",
        dbPath: "/meats",
        dbLabel: "View in Seafood Guide",
        score: 10,
      },
      {
        id: "bone-leafy-greens",
        name: "Kale & Collard Greens",
        imageUrl: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80",
        tagline: "Plant calcium + bone-building K2",
        explanation: "Dark leafy greens are rich in calcium, vitamin K1, and magnesium — three nutrients essential for bone density. Vitamin K1 activates osteocalcin, the protein that binds calcium into bone matrix. Kale has more bioavailable calcium than milk (40% vs 32% absorption rate).",
        keyNutrients: [
          { name: "Calcium", why: "40% absorption rate — higher than milk; essential for bone mineralization", amount: "150mg per 100g" },
          { name: "Vitamin K1", why: "Activates osteocalcin, the protein that incorporates calcium into bone", amount: "817µg per 100g" },
          { name: "Magnesium", why: "Required for vitamin D activation and calcium incorporation into bone", amount: "47mg per 100g" },
          { name: "Boron", why: "Trace mineral that reduces calcium excretion and activates vitamin D" },
        ],
        servingSuggestion: "2+ cups of cooked kale or collards daily. Cooking increases calcium bioavailability by reducing oxalates.",
        dbPath: "/vegetables",
        dbLabel: "View in Vegetable Guide",
        score: 9,
      },
      {
        id: "bone-prunes",
        name: "Prunes (Dried Plums)",
        imageUrl: "/manus-storage/0O4i6yIj21eT_1c90baa9.jpg",
        tagline: "The only food proven to reverse bone loss",
        explanation: "Prunes are the only food with clinical evidence of actually reversing bone loss. A 12-month study found that eating 5–6 prunes daily prevented bone loss in postmenopausal women as effectively as hormone therapy. They contain unique polyphenols that inhibit osteoclasts (bone-destroying cells) and stimulate osteoblasts (bone-building cells).",
        keyNutrients: [
          { name: "Polyphenols (Chlorogenic Acid)", why: "Inhibit osteoclasts and stimulate osteoblast activity — unique to prunes" },
          { name: "Boron", why: "Reduces calcium and magnesium excretion; activates vitamin D", amount: "0.8mg per 100g" },
          { name: "Vitamin K1", why: "Activates bone matrix proteins", amount: "59µg per 100g" },
          { name: "Potassium", why: "Neutralizes metabolic acid that would otherwise dissolve bone mineral", amount: "732mg per 100g" },
        ],
        servingSuggestion: "5–6 prunes daily (about 50g). Consistent daily intake is key — the bone benefits require 3+ months.",
        dbPath: "/fruits",
        dbLabel: "View in Fruit Guide",
        score: 9,
      },
    ],
  },

  // ── Eye Health ───────────────────────────────────────────────────────────────
  {
    id: "eye",
    name: "Eye Health",
    tagline: "Protect your vision for life",
    description: "The retina is the most metabolically active tissue in the body per unit area. It's highly vulnerable to oxidative damage from blue light and UV radiation. These foods provide the specific carotenoids and antioxidants that protect and maintain sharp vision.",
    emoji: "👁️",
    gradient: "linear-gradient(145deg, #0a1a2e 0%, #102a4a 55%, #1a4070 100%)",
    glowColor: "rgba(26,64,112,0.5)",
    accentColor: "#38bdf8",
    bodyPart: "Visual System",
    quickTip: "Lutein and zeaxanthin must come from food — your body cannot synthesize them. Eat eggs and leafy greens daily.",
    foods: [
      {
        id: "eye-eggs",
        name: "Egg Yolks",
        imageUrl: "https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=600&q=80",
        tagline: "The best source of eye-protecting carotenoids",
        explanation: "Egg yolks contain lutein and zeaxanthin in a fat matrix that makes them 3× more bioavailable than the same compounds in vegetables. These carotenoids accumulate in the macula (the central retina) and act as internal sunglasses, filtering blue light and UV radiation that cause macular degeneration.",
        keyNutrients: [
          { name: "Lutein", why: "Accumulates in macula; filters blue light and UV that damage photoreceptors", amount: "0.2mg per yolk" },
          { name: "Zeaxanthin", why: "Concentrated in the fovea (sharpest vision area); prevents macular degeneration", amount: "0.2mg per yolk" },
          { name: "Vitamin A (Retinol)", why: "Required for rhodopsin production — the pigment that enables night vision", amount: "75µg per yolk" },
          { name: "Zinc", why: "Transports vitamin A from liver to retina; deficiency causes night blindness", amount: "0.6mg per yolk" },
        ],
        servingSuggestion: "2–3 whole eggs daily. The fat in the yolk is essential for lutein/zeaxanthin absorption.",
        dbPath: "/meats",
        dbLabel: "View in Meat Guide",
        score: 10,
      },
      {
        id: "eye-kale",
        name: "Kale & Spinach",
        imageUrl: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80",
        tagline: "Highest lutein content of any food",
        explanation: "Kale and spinach contain more lutein per gram than any other food. Studies show people with the highest lutein intake have a 43% lower risk of macular degeneration. The zeaxanthin in spinach is the specific isomer that concentrates in the fovea for maximum visual acuity.",
        keyNutrients: [
          { name: "Lutein", why: "Highest food source; 43% lower AMD risk with high intake", amount: "11.9mg per 100g (kale)" },
          { name: "Zeaxanthin", why: "Concentrates in fovea for sharp central vision", amount: "2.6mg per 100g (spinach)" },
          { name: "Vitamin C", why: "Protects lens from oxidative damage that causes cataracts", amount: "120mg per 100g (kale)" },
          { name: "Beta-Carotene", why: "Converts to vitamin A for night vision and photoreceptor maintenance" },
        ],
        servingSuggestion: "2 cups of cooked kale or spinach daily. Pair with olive oil or eggs to absorb fat-soluble carotenoids.",
        dbPath: "/vegetables",
        dbLabel: "View in Vegetable Guide",
        score: 10,
      },
      {
        id: "eye-bilberries",
        name: "Bilberries & Blueberries",
        imageUrl: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600&q=80",
        tagline: "Night vision and retinal protection",
        explanation: "Bilberries were used by WWII RAF pilots to improve night vision. Their anthocyanins regenerate rhodopsin (the night vision pigment) faster after light exposure and strengthen the capillaries that supply the retina. Studies show bilberry extract reduces eye fatigue from screen use by 30%.",
        keyNutrients: [
          { name: "Anthocyanins", why: "Regenerate rhodopsin for better night vision and reduce retinal oxidation" },
          { name: "Pterostilbene", why: "Crosses blood-retinal barrier to protect photoreceptors from oxidative damage" },
          { name: "Vitamin C", why: "Maintains collagen in the eye's connective tissue and reduces cataract risk", amount: "9.7mg per 100g" },
          { name: "Resveratrol", why: "Inhibits abnormal blood vessel growth that causes wet macular degeneration" },
        ],
        servingSuggestion: "1 cup of fresh or frozen blueberries daily. Wild blueberries have 2× more anthocyanins than cultivated.",
        dbPath: "/fruits",
        dbLabel: "View in Fruit Guide",
        score: 9,
      },
      {
        id: "eye-carrots",
        name: "Carrots",
        imageUrl: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&q=80",
        tagline: "Beta-carotene for night vision",
        explanation: "The 'carrots improve eyesight' claim is actually true — for night vision. Beta-carotene converts to vitamin A (retinol), which is required to produce rhodopsin, the pigment in rod cells that enables low-light vision. Vitamin A deficiency is the leading cause of preventable blindness worldwide.",
        keyNutrients: [
          { name: "Beta-Carotene", why: "Converts to vitamin A; required for rhodopsin (night vision pigment) production", amount: "8.3mg per 100g" },
          { name: "Lutein & Zeaxanthin", why: "Protect macula from blue light and UV damage", amount: "0.26mg per 100g" },
          { name: "Vitamin C", why: "Antioxidant that protects the lens from UV-induced oxidation", amount: "5.9mg per 100g" },
          { name: "Potassium", why: "Maintains intraocular pressure and reduces glaucoma risk", amount: "320mg per 100g" },
        ],
        servingSuggestion: "1 medium carrot daily, cooked with a fat source. Beta-carotene absorption increases 6× when cooked vs raw.",
        dbPath: "/vegetables",
        dbLabel: "View in Vegetable Guide",
        score: 8,
      },
    ],
  },
];

/** Get a category by ID */
export function getBodyBenefitCategory(id: string): BodyBenefitCategory | undefined {
  return BODY_BENEFITS.find(c => c.id === id);
}

/** Get a specific food within a category */
export function getBodyBenefitFood(categoryId: string, foodId: string): BodyBenefitFood | undefined {
  const cat = getBodyBenefitCategory(categoryId);
  return cat?.foods.find(f => f.id === foodId);
}
