/**
 * Natural Recovery Page
 * Science-backed natural remedies for common ailments.
 * Each card shows the condition, natural remedies, and the evidence behind them.
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, ChevronDown, ChevronUp,
  Thermometer, Zap, Wind, Leaf, Brain,
  Droplets, Moon, Sun, Apple, Coffee,
  HeartPulse, BedDouble, Dumbbell, Sparkles,
  Waves, Activity, Bone, Shield,
  Search, X,
} from "lucide-react";
import { hapticLight } from "@/lib/haptic";

// ── Remedy Data ──────────────────────────────────────────────────────────────

interface Remedy {
  name: string;
  howTo: string;
}

type RemedyCategory = "All" | "Throat & Chest" | "Energy & Sleep" | "Digestion" | "Pain & Inflammation" | "Immunity" | "Skin" | "Mind";

interface RemedyCard {
  id: string;
  condition: string;
  tagline: string;
  icon: typeof Thermometer;
  gradient: string;
  glowColor: string;
  accentColor: string;
  remedies: Remedy[];
  scienceFact: string;
  whenToSeeDoctor: string;
  category: RemedyCategory;
}

const REMEDY_CARDS: RemedyCard[] = [
  {
    id: "sore-throat",
    category: "Throat & Chest" as RemedyCategory,
    condition: "Sore Throat",
    tagline: "Soothe inflammation and fight bacteria naturally",
    icon: Thermometer,
    gradient: "linear-gradient(135deg, #7c2d12 0%, #c2410c 60%, #f97316 100%)",
    glowColor: "rgba(249,115,22,0.35)",
    accentColor: "#fb923c",
    remedies: [
      {
        name: "Raw Honey",
        howTo: "1–2 tsp straight or dissolved in warm water. Take before bed or whenever irritation flares.",
      },
      {
        name: "Ginger Tea",
        howTo: "Steep 1 inch of fresh ginger in boiling water for 10 min. Add lemon and honey. Drink 2–3× daily.",
      },
      {
        name: "Warm Salt Water Gargle",
        howTo: "Dissolve ½ tsp sea salt in 8 oz warm water. Gargle for 30 seconds, spit. Repeat every 2–3 hours.",
      },
      {
        name: "Slippery Elm Lozenges",
        howTo: "Dissolve in mouth as needed. The mucilage coats and soothes the throat lining.",
      },
      {
        name: "Turmeric Milk",
        howTo: "Warm 1 cup milk (dairy or oat), stir in ½ tsp turmeric + pinch of black pepper. Drink before sleep.",
      },
    ],
    scienceFact:
      "Raw honey contains hydrogen peroxide, methylglyoxal, and bee defensin-1 — compounds with clinically proven antibacterial activity. A 2021 BMJ Evidence-Based Medicine review found honey outperformed usual care for upper respiratory symptoms including sore throat. Salt water gargling reduces osmotic pressure in throat tissues, drawing out excess fluid and pathogens.",
    whenToSeeDoctor:
      "Throat pain lasting more than 7 days, difficulty swallowing, high fever (>103°F / 39.4°C), or white patches on the tonsils.",
  },
  {
    id: "fatigue",
    category: "Energy & Sleep" as RemedyCategory,
    condition: "Fatigue",
    tagline: "Restore energy through minerals, sleep, and real food",
    icon: Zap,
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #60a5fa 100%)",
    glowColor: "rgba(37,99,235,0.35)",
    accentColor: "#93c5fd",
    remedies: [
      {
        name: "Electrolyte Replenishment",
        howTo: "Add a pinch of sea salt + squeeze of lemon to water. Or eat potassium-rich foods: banana, avocado, sweet potato.",
      },
      {
        name: "Magnesium-Rich Foods",
        howTo: "Eat pumpkin seeds, dark leafy greens, dark chocolate (85%+), or almonds daily. Magnesium supports 300+ enzymatic reactions.",
      },
      {
        name: "Consistent Sleep Schedule",
        howTo: "Wake and sleep at the same time every day — even weekends. Consistency regulates your circadian clock more than total hours.",
      },
      {
        name: "Cold Water Face Splash",
        howTo: "Splash cold water on your face for 30 seconds. Activates the diving reflex, slowing heart rate and sharpening focus.",
      },
      {
        name: "Iron + Vitamin C Pairing",
        howTo: "If iron-deficient, eat iron-rich foods (spinach, lentils, red meat) alongside vitamin C (bell pepper, citrus) to triple absorption.",
      },
    ],
    scienceFact:
      "Magnesium deficiency affects an estimated 50–80% of people in Western countries and is one of the most overlooked causes of chronic fatigue. Magnesium is required for ATP (cellular energy) synthesis — without it, mitochondria cannot produce energy efficiently. Electrolyte imbalance (particularly sodium and potassium) impairs nerve signaling, causing the heavy, sluggish feeling associated with dehydration fatigue.",
    whenToSeeDoctor:
      "Fatigue lasting more than 2 weeks with no clear cause, especially if accompanied by unexplained weight loss, night sweats, or shortness of breath.",
  },
  {
    id: "cough",
    category: "Throat & Chest" as RemedyCategory,
    condition: "Cough",
    tagline: "Calm airways, thin mucus, and reduce irritation",
    icon: Wind,
    gradient: "linear-gradient(135deg, #134e4a 0%, #0f766e 60%, #2dd4bf 100%)",
    glowColor: "rgba(20,184,166,0.35)",
    accentColor: "#5eead4",
    remedies: [
      {
        name: "Honey + Warm Water",
        howTo: "1–2 tsp raw honey in warm (not boiling) water or herbal tea. Repeat every 3–4 hours. Do not give to children under 1.",
      },
      {
        name: "Steam Inhalation",
        howTo: "Boil water, pour into a bowl, drape a towel over your head, inhale for 10–15 min. Add 2–3 drops eucalyptus oil for extra relief.",
      },
      {
        name: "Stay Hydrated",
        howTo: "Drink 8–10 glasses of water daily. Warm broths and herbal teas count. Hydration thins mucus, making it easier to clear.",
      },
      {
        name: "Thyme Tea",
        howTo: "Steep 2 tsp fresh thyme leaves in 1 cup boiling water for 10 min. Strain and drink. Thyme has antispasmodic and antimicrobial properties.",
      },
      {
        name: "Elevate Your Head at Night",
        howTo: "Use an extra pillow to keep your head elevated. Reduces post-nasal drip pooling in the throat that triggers night coughing.",
      },
    ],
    scienceFact:
      "A Cochrane review of 14 randomized trials found honey more effective than placebo and comparable to dextromethorphan (the active ingredient in most OTC cough syrups) for reducing cough frequency and severity in adults. Steam inhalation works by warming and humidifying airways, reducing the viscosity of mucus by up to 40%, which allows cilia to clear it more efficiently.",
    whenToSeeDoctor:
      "Cough lasting more than 3 weeks, coughing up blood, chest pain, or high fever. Sudden severe cough with shortness of breath requires immediate care.",
  },
  {
    id: "bloating",
    category: "Digestion" as RemedyCategory,
    condition: "Bloating",
    tagline: "Calm your gut with proven plant-based remedies",
    icon: Leaf,
    gradient: "linear-gradient(135deg, #14532d 0%, #15803d 60%, #4ade80 100%)",
    glowColor: "rgba(74,222,128,0.30)",
    accentColor: "#86efac",
    remedies: [
      {
        name: "Peppermint Tea",
        howTo: "Steep 1 peppermint tea bag or 1 tsp dried peppermint in hot water for 5–10 min. Drink after meals.",
      },
      {
        name: "Probiotics",
        howTo: "Eat fermented foods daily: plain yogurt with live cultures, kefir, sauerkraut, kimchi, or kombucha. Or take a multi-strain probiotic supplement.",
      },
      {
        name: "Fennel Seeds",
        howTo: "Chew ½ tsp fennel seeds after meals, or steep in hot water for 10 min as a tea. A traditional digestive remedy in Ayurvedic medicine.",
      },
      {
        name: "Ginger",
        howTo: "Fresh ginger tea or a small piece of raw ginger before meals. Ginger accelerates gastric emptying, reducing the time food sits in the stomach.",
      },
      {
        name: "Reduce FODMAP Triggers",
        howTo: "Common culprits: onions, garlic, beans, apples, wheat. Try eliminating one at a time for 1 week to identify your personal triggers.",
      },
    ],
    scienceFact:
      "Peppermint oil contains menthol, which activates TRPM8 cold receptors in the gut, relaxing smooth muscle and reducing intestinal spasms. A meta-analysis of 9 clinical trials (Alimentary Pharmacology & Therapeutics) found peppermint oil significantly reduced abdominal pain and bloating in IBS patients. Probiotics work by restoring the balance of gut bacteria, reducing gas-producing fermentation by pathogenic strains.",
    whenToSeeDoctor:
      "Persistent bloating lasting more than 3 weeks, bloating accompanied by blood in stool, unexplained weight loss, or severe abdominal pain.",
  },
  {
    id: "stress",
    category: "Mind" as RemedyCategory,
    condition: "Stress",
    tagline: "Reset your nervous system with movement, light, and food",
    icon: Brain,
    gradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #c4b5fd 100%)",
    glowColor: "rgba(124,58,237,0.35)",
    accentColor: "#c4b5fd",
    remedies: [
      {
        name: "20-Minute Walk (Outdoors)",
        howTo: "Walk at a comfortable pace outdoors — not on a treadmill. The combination of movement, nature, and low-level light has a measurable cortisol-lowering effect.",
      },
      {
        name: "Morning Sunlight Exposure",
        howTo: "Get 10–20 min of direct sunlight within 1 hour of waking. No sunglasses. This anchors your circadian rhythm and boosts serotonin production.",
      },
      {
        name: "Omega-3 Rich Foods",
        howTo: "Eat fatty fish (salmon, sardines, mackerel) 2–3× per week, or add 1 tbsp ground flaxseed or chia seeds to meals daily.",
      },
      {
        name: "Ashwagandha",
        howTo: "300–600 mg of KSM-66 or Sensoril extract daily with food. An adaptogen with the most clinical evidence for cortisol reduction.",
      },
      {
        name: "4-7-8 Breathing",
        howTo: "Inhale for 4 counts, hold for 7, exhale for 8. Repeat 4 cycles. Activates the parasympathetic nervous system within 60 seconds.",
      },
    ],
    scienceFact:
      "Omega-3 fatty acids (EPA and DHA) directly modulate the HPA (hypothalamic-pituitary-adrenal) axis — the body's central stress response system. A 2011 Ohio State University study found that 2.5g/day of omega-3 supplementation reduced cortisol levels by 19% and inflammatory cytokines by 14% over 12 weeks. Morning sunlight triggers a cortisol pulse that peaks at the right time, reducing the likelihood of a dysregulated stress response later in the day.",
    whenToSeeDoctor:
      "Stress that interferes with daily functioning for more than 2 weeks, panic attacks, inability to sleep, or thoughts of self-harm.",
  },
  {
    id: "headache",
    category: "Pain & Inflammation" as RemedyCategory,
    condition: "Headache",
    tagline: "Relieve tension and migraine pain without medication",
    icon: HeartPulse,
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #818cf8 100%)",
    glowColor: "rgba(99,102,241,0.35)",
    accentColor: "#a5b4fc",
    remedies: [
      {
        name: "Hydration First",
        howTo: "Drink 2 full glasses of water immediately. Dehydration is the #1 overlooked cause of headaches. Add a pinch of sea salt and lemon to replenish electrolytes.",
      },
      {
        name: "Peppermint Oil (Topical)",
        howTo: "Dilute 2–3 drops peppermint essential oil in a carrier oil (coconut or almond). Massage into temples and forehead. Avoid eyes.",
      },
      {
        name: "Magnesium Glycinate",
        howTo: "200–400 mg magnesium glycinate at the onset of a headache. For chronic sufferers, take daily as a preventive measure.",
      },
      {
        name: "Cold or Warm Compress",
        howTo: "Cold pack on the forehead/temples for tension headaches. Warm compress on the neck and shoulders for tension from tight muscles. Try both for 15 min each.",
      },
      {
        name: "Ginger Tea",
        howTo: "Steep 1 inch fresh ginger in hot water for 10 min. Drink at the first sign of a headache. Ginger inhibits prostaglandin synthesis — the same mechanism as NSAIDs.",
      },
    ],
    scienceFact:
      "Magnesium deficiency is found in up to 50% of migraine patients. A landmark study in Cephalalgia (1996) found that 600 mg/day of magnesium citrate reduced migraine frequency by 41.6% vs 15.8% in the placebo group. Peppermint oil (10% ethanol solution) applied topically was shown in a double-blind trial to be as effective as 1,000 mg acetaminophen for tension headaches, with significantly fewer side effects.",
    whenToSeeDoctor:
      "Sudden severe 'thunderclap' headache, headache with fever and stiff neck, headache after head injury, or vision changes. These may indicate a medical emergency.",
  },
  {
    id: "insomnia",
    category: "Energy & Sleep" as RemedyCategory,
    condition: "Insomnia",
    tagline: "Reset your sleep architecture with natural sleep science",
    icon: BedDouble,
    gradient: "linear-gradient(135deg, #0c1445 0%, #1e3a8a 60%, #3b82f6 100%)",
    glowColor: "rgba(59,130,246,0.30)",
    accentColor: "#93c5fd",
    remedies: [
      {
        name: "Consistent Sleep/Wake Time",
        howTo: "Set a fixed wake time — even on weekends. This is the single most powerful intervention for insomnia. Your circadian clock anchors to wake time, not bedtime.",
      },
      {
        name: "Magnesium Glycinate at Night",
        howTo: "200–400 mg magnesium glycinate 30–60 min before bed. Activates GABA receptors and lowers cortisol, easing the transition to sleep.",
      },
      {
        name: "Tart Cherry Juice",
        howTo: "8 oz of tart cherry juice (Montmorency variety) 1–2 hours before bed. One of the few foods with naturally occurring melatonin.",
      },
      {
        name: "Dim Lights 2 Hours Before Bed",
        howTo: "Switch to warm amber lighting after sunset. Avoid overhead white/blue lights. Use blue-light blocking glasses if screens are unavoidable.",
      },
      {
        name: "Cool Your Room (65–68°F / 18–20°C)",
        howTo: "Core body temperature must drop 1–3°F to initiate sleep. A cool room accelerates this. Use a fan, open a window, or lower the thermostat.",
      },
    ],
    scienceFact:
      "Tart cherry juice contains melatonin, tryptophan, and anthocyanins that collectively increase sleep time by an average of 84 minutes per night, according to a Louisiana State University study. Magnesium glycinate binds to GABA receptors in the brain — the same receptors targeted by benzodiazepines — producing a calming effect without dependency. Core body temperature drop is the primary physiological trigger for sleep onset; this is why warm baths 1–2 hours before bed paradoxically improve sleep (the subsequent cooling effect accelerates the drop).",
    whenToSeeDoctor:
      "Insomnia lasting more than 3 months, insomnia with loud snoring or gasping (possible sleep apnea), or insomnia accompanied by depression or anxiety.",
  },
  {
    id: "muscle-soreness",
    category: "Pain & Inflammation" as RemedyCategory,
    condition: "Muscle Soreness",
    tagline: "Speed recovery and reduce DOMS with food and movement",
    icon: Dumbbell,
    gradient: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #fca5a5 100%)",
    glowColor: "rgba(220,38,38,0.30)",
    accentColor: "#fca5a5",
    remedies: [
      {
        name: "Tart Cherry Juice",
        howTo: "8–12 oz of tart cherry juice twice daily (morning + evening) for 4–5 days around intense exercise. Reduces DOMS (delayed onset muscle soreness) by up to 22%.",
      },
      {
        name: "Turmeric + Black Pepper",
        howTo: "Add ½ tsp turmeric + pinch of black pepper to food or a warm drink. The piperine in black pepper increases curcumin absorption by 2,000%.",
      },
      {
        name: "Contrast Shower",
        howTo: "Alternate 2 min hot / 30 sec cold for 3 cycles. Ends on cold. Promotes blood flow and lymphatic drainage, flushing out metabolic waste from muscles.",
      },
      {
        name: "Active Recovery (Light Movement)",
        howTo: "A 20–30 min walk or gentle yoga the day after intense exercise. Light movement increases blood flow to sore muscles by 30–40% more than complete rest.",
      },
      {
        name: "Protein Within 2 Hours Post-Exercise",
        howTo: "20–40g of high-quality protein (eggs, Greek yogurt, salmon, whey) within 2 hours of training. This is the anabolic window for muscle protein synthesis.",
      },
    ],
    scienceFact:
      "DOMS (delayed onset muscle soreness) peaks 24–72 hours after exercise and is caused by microscopic tears in muscle fibers triggering an inflammatory cascade. Curcumin (turmeric's active compound) inhibits NF-κB, a master regulator of inflammation, reducing pro-inflammatory cytokines IL-6 and TNF-α. A 2015 European Journal of Applied Physiology study found curcumin supplementation reduced DOMS by 33% and improved muscle recovery markers. Tart cherry's anthocyanins inhibit COX-1 and COX-2 enzymes — the same pathway as ibuprofen — without GI side effects.",
    whenToSeeDoctor:
      "Sharp or stabbing pain during exercise (not after), swelling or bruising, pain that worsens after 7 days, or inability to bear weight on a limb.",
  },
  {
    id: "skin-inflammation",
    category: "Skin" as RemedyCategory,
    condition: "Skin Inflammation",
    tagline: "Calm eczema, acne, and redness from the inside out",
    icon: Sparkles,
    gradient: "linear-gradient(135deg, #701a75 0%, #a21caf 60%, #e879f9 100%)",
    glowColor: "rgba(168,85,247,0.30)",
    accentColor: "#e879f9",
    remedies: [
      {
        name: "Omega-3 Fatty Acids",
        howTo: "Eat fatty fish 2–3× per week (salmon, sardines, mackerel) or take 2–3g EPA+DHA daily. Omega-3s directly reduce the inflammatory prostaglandins that drive skin redness.",
      },
      {
        name: "Eliminate Seed Oils",
        howTo: "Remove canola, soy, sunflower, and corn oil from your diet. These are high in omega-6 linoleic acid, which drives systemic inflammation and worsens skin conditions.",
      },
      {
        name: "Colloidal Oatmeal (Topical)",
        howTo: "Apply colloidal oatmeal cream or an oatmeal bath soak for 15–20 min. FDA-approved for eczema and dermatitis. Reduces itching, redness, and barrier disruption.",
      },
      {
        name: "Zinc-Rich Foods",
        howTo: "Eat pumpkin seeds, oysters, beef, or chickpeas daily. Zinc regulates sebum production and has anti-inflammatory properties that help with acne and eczema.",
      },
      {
        name: "Gut Health (Probiotics)",
        howTo: "The gut-skin axis is well established. Eat fermented foods daily (yogurt, kefir, kimchi) or take a multi-strain probiotic. A healthy microbiome reduces systemic inflammation that manifests in the skin.",
      },
    ],
    scienceFact:
      "The gut-skin axis describes the bidirectional relationship between gut microbiome composition and skin health. A 2021 meta-analysis in JAMA Dermatology found that probiotic supplementation significantly reduced acne lesion counts and inflammatory markers. The omega-6:omega-3 ratio in the modern Western diet is approximately 15:1 (ideal is 4:1 or lower); this imbalance directly upregulates arachidonic acid metabolism, producing pro-inflammatory eicosanoids that worsen eczema, psoriasis, and acne. Correcting this ratio through diet is one of the most evidence-backed interventions for chronic skin inflammation.",
    whenToSeeDoctor:
      "Rapidly spreading rash, skin inflammation with fever, blistering or open sores, or skin conditions that don't respond to any treatment after 4 weeks.",
  },
  {
    id: "nausea",
    category: "Digestion" as RemedyCategory,
    condition: "Nausea",
    tagline: "Settle your stomach with time-tested natural remedies",
    icon: Waves,
    gradient: "linear-gradient(135deg, #064e3b 0%, #059669 60%, #6ee7b7 100%)",
    glowColor: "rgba(5,150,105,0.30)",
    accentColor: "#6ee7b7",
    remedies: [
      {
        name: "Fresh Ginger",
        howTo: "Chew a small piece of raw ginger, sip ginger tea, or take 250 mg ginger capsules. Repeat every 4 hours as needed. Ginger is the most evidence-backed natural anti-nausea remedy.",
      },
      {
        name: "Peppermint Tea or Oil",
        howTo: "Sip peppermint tea slowly, or inhale 1–2 drops of peppermint essential oil. The menthol relaxes the gastric muscles and reduces the urge to vomit.",
      },
      {
        name: "Acupressure (P6 Point)",
        howTo: "Press firmly on the P6 (Neiguan) point: 3 finger-widths below the wrist crease, between the two tendons. Hold for 2–3 min. Sea-Bands wristbands apply continuous pressure here.",
      },
      {
        name: "Small Bland Meals (BRAT)",
        howTo: "Eat small amounts of Bananas, Rice, Applesauce, and Toast. These are easy to digest and help settle the stomach without triggering further nausea.",
      },
      {
        name: "Cold Water Sips",
        howTo: "Sip ice-cold water in small amounts (1–2 oz every 5–10 min). Cold water reduces gastric motility and can calm the nausea reflex.",
      },
    ],
    scienceFact:
      "Ginger contains gingerols and shogaols that act on 5-HT3 receptors and the vagus nerve — the same pathway targeted by prescription anti-nausea drugs like ondansetron. A Cochrane review of 12 randomized trials found ginger significantly more effective than placebo for pregnancy-related nausea. Acupressure at the P6 point has been validated in 40+ clinical trials for post-operative and chemotherapy-induced nausea, with a 2015 Cochrane review concluding it provides clinically meaningful relief.",
    whenToSeeDoctor:
      "Nausea with severe abdominal pain, nausea lasting more than 48 hours, signs of dehydration (no urination, dry mouth, dizziness), or vomiting blood.",
  },
  {
    id: "constipation",
    category: "Digestion" as RemedyCategory,
    condition: "Constipation",
    tagline: "Restore healthy gut motility with food and hydration",
    icon: Activity,
    gradient: "linear-gradient(135deg, #78350f 0%, #d97706 60%, #fde68a 100%)",
    glowColor: "rgba(217,119,6,0.30)",
    accentColor: "#fde68a",
    remedies: [
      {
        name: "Hydration (First Priority)",
        howTo: "Drink 8–10 glasses of water daily. Dehydration is the most common cause of constipation. Start your morning with 16 oz of warm water with lemon.",
      },
      {
        name: "Ground Flaxseed",
        howTo: "Add 1–2 tbsp of ground flaxseed to oatmeal, yogurt, or smoothies daily. Provides both soluble fiber (softens stool) and insoluble fiber (adds bulk).",
      },
      {
        name: "Prunes or Prune Juice",
        howTo: "Eat 3–5 prunes or drink 4 oz of prune juice in the morning. Prunes contain sorbitol (a natural laxative) and dihydroxyphenyl isatin, which stimulates bowel contractions.",
      },
      {
        name: "Magnesium Citrate",
        howTo: "200–400 mg magnesium citrate at bedtime. Draws water into the intestines, softening stool and stimulating bowel movement by morning.",
      },
      {
        name: "Squat Position on the Toilet",
        howTo: "Use a footstool (7–9 inches) to elevate your feet while sitting on the toilet. This straightens the anorectal angle, making elimination significantly easier and more complete.",
      },
    ],
    scienceFact:
      "Prunes outperformed psyllium (the active ingredient in Metamucil) in a head-to-head randomized trial published in Alimentary Pharmacology & Therapeutics (2011), increasing stool frequency from 3 to 3.5 per week vs 2.8 for psyllium. Magnesium citrate works as an osmotic laxative — it draws water into the intestinal lumen, increasing stool volume and triggering peristalsis. The squatting position reduces the puborectalis muscle tension that creates a kink in the rectum when sitting upright, explaining why 90% of people strain less when using a footstool.",
    whenToSeeDoctor:
      "No bowel movement for more than 7 days, constipation with blood in stool, unexplained weight loss, or new constipation in someone over 50 (requires colonoscopy screening).",
  },
  {
    id: "joint-pain",
    category: "Pain & Inflammation" as RemedyCategory,
    condition: "Joint Pain",
    tagline: "Reduce inflammation and support cartilage with food",
    icon: Bone,
    gradient: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 60%, #93c5fd 100%)",
    glowColor: "rgba(29,78,216,0.30)",
    accentColor: "#93c5fd",
    remedies: [
      {
        name: "Omega-3 Fatty Acids",
        howTo: "2–3g EPA+DHA daily from fatty fish or fish oil supplements. Omega-3s directly inhibit the inflammatory cytokines (IL-1β, TNF-α) that degrade cartilage.",
      },
      {
        name: "Turmeric + Black Pepper",
        howTo: "1 tsp turmeric + pinch of black pepper in food or warm milk daily. Or take 500–1000 mg curcumin extract with piperine. The most studied natural anti-inflammatory for joints.",
      },
      {
        name: "Collagen Peptides",
        howTo: "10–15g hydrolyzed collagen peptides daily in water or coffee. Take with vitamin C (50–100 mg) to maximize collagen synthesis in cartilage.",
      },
      {
        name: "Warm Epsom Salt Soak",
        howTo: "Add 2 cups Epsom salt to a warm bath and soak for 20 min. Magnesium sulfate absorbs transdermally, reducing muscle tension around the joint and calming inflammation.",
      },
      {
        name: "Eliminate Inflammatory Foods",
        howTo: "Remove seed oils, refined sugar, and ultra-processed foods for 2 weeks. These drive systemic inflammation that worsens joint pain. Replace with whole foods, olive oil, and leafy greens.",
      },
    ],
    scienceFact:
      "A 2016 meta-analysis in PLOS ONE found that curcumin supplementation was as effective as NSAIDs (ibuprofen, diclofenac) for reducing osteoarthritis pain and improving function, with a significantly better safety profile. Collagen peptides have been shown in a 2019 British Journal of Sports Medicine study to increase collagen synthesis in cartilage by 67% when taken with vitamin C before exercise. Omega-3s reduce synovial fluid inflammation by shifting the eicosanoid balance from pro-inflammatory (from omega-6) to anti-inflammatory (from EPA/DHA).",
    whenToSeeDoctor:
      "Joint pain with swelling, redness, and warmth (possible infection or gout), sudden severe joint pain, joint pain after injury, or pain that significantly limits daily movement.",
  },
  {
    id: "low-immunity",
    category: "Immunity" as RemedyCategory,
    condition: "Low Immunity",
    tagline: "Strengthen your immune defenses with targeted nutrition",
    icon: Shield,
    gradient: "linear-gradient(135deg, #14532d 0%, #16a34a 60%, #86efac 100%)",
    glowColor: "rgba(22,163,74,0.30)",
    accentColor: "#86efac",
    remedies: [
      {
        name: "Vitamin D3 + K2",
        howTo: "2000–5000 IU vitamin D3 daily with K2 (100–200 mcg MK-7). Take with a fat-containing meal. Vitamin D3 is the most important nutrient for immune regulation.",
      },
      {
        name: "Zinc-Rich Foods",
        howTo: "Eat oysters, beef, pumpkin seeds, or chickpeas daily. Zinc is required for T-cell development and NK cell activity. Even mild deficiency impairs immune response.",
      },
      {
        name: "Elderberry (Sambucus)",
        howTo: "1 tbsp elderberry syrup or 500 mg elderberry extract daily during cold/flu season. Shown to reduce duration of cold and flu by 2–4 days.",
      },
      {
        name: "Fermented Foods Daily",
        howTo: "70% of the immune system lives in the gut. Eat plain yogurt, kefir, kimchi, or sauerkraut daily to maintain a diverse, healthy microbiome that supports immune signaling.",
      },
      {
        name: "Sleep 7–9 Hours",
        howTo: "Sleep deprivation reduces NK cell activity by up to 70% after just one night of 4-hour sleep. Prioritize sleep above all other immune interventions.",
      },
    ],
    scienceFact:
      "Vitamin D receptors are present on virtually every immune cell, and vitamin D3 directly activates over 200 genes involved in immune function. A 2017 BMJ meta-analysis of 25 randomized trials (11,321 participants) found that vitamin D3 supplementation reduced the risk of acute respiratory infections by 12% overall and by 70% in those who were severely deficient. A single night of 4-hour sleep reduces natural killer cell activity by 70% (University of California, Berkeley, 2019), making sleep the most underrated immune intervention available.",
    whenToSeeDoctor:
      "Frequent infections (more than 4 per year), infections that are unusually severe or prolonged, or any signs of autoimmune disease (joint pain, rashes, fatigue with no clear cause).",
  },
];
// ── Muted premium palette per condition ─────────────────────────────────────
const CARD_PALETTE: Record<string, { bg: string; border: string; glow: string; accent: string; dot: string }> = {
  "sore-throat":    { bg: "rgba(120,53,15,0.18)",  border: "rgba(180,100,40,0.22)",  glow: "rgba(180,100,40,0.18)",  accent: "#d97706", dot: "#b45309" },
  "fatigue":        { bg: "rgba(30,58,138,0.18)",  border: "rgba(59,130,246,0.2)",   glow: "rgba(59,130,246,0.15)",  accent: "#60a5fa", dot: "#3b82f6" },
  "cough":          { bg: "rgba(6,78,59,0.2)",     border: "rgba(20,184,166,0.2)",   glow: "rgba(20,184,166,0.14)",  accent: "#2dd4bf", dot: "#0d9488" },
  "bloating":       { bg: "rgba(88,28,135,0.18)",  border: "rgba(167,139,250,0.2)",  glow: "rgba(167,139,250,0.14)", accent: "#a78bfa", dot: "#7c3aed" },
  "stress":         { bg: "rgba(6,78,59,0.22)",    border: "rgba(52,211,153,0.2)",   glow: "rgba(52,211,153,0.14)",  accent: "#34d399", dot: "#059669" },
  "headache":       { bg: "rgba(127,29,29,0.18)",  border: "rgba(252,165,165,0.2)",  glow: "rgba(252,165,165,0.14)", accent: "#fca5a5", dot: "#dc2626" },
  "insomnia":       { bg: "rgba(15,23,42,0.3)",    border: "rgba(148,163,184,0.18)", glow: "rgba(148,163,184,0.12)", accent: "#94a3b8", dot: "#475569" },
  "muscle-soreness":{ bg: "rgba(20,83,45,0.2)",    border: "rgba(74,222,128,0.2)",   glow: "rgba(74,222,128,0.14)",  accent: "#4ade80", dot: "#16a34a" },
  "skin-inflammation":{ bg: "rgba(124,45,18,0.18)",border: "rgba(253,186,116,0.2)",  glow: "rgba(253,186,116,0.14)", accent: "#fdba74", dot: "#ea580c" },
  "nausea":         { bg: "rgba(6,78,59,0.18)",    border: "rgba(110,231,183,0.2)",  glow: "rgba(110,231,183,0.13)", accent: "#6ee7b7", dot: "#10b981" },
  "constipation":   { bg: "rgba(92,38,0,0.18)",    border: "rgba(217,119,6,0.2)",    glow: "rgba(217,119,6,0.13)",   accent: "#d97706", dot: "#92400e" },
  "joint-pain":     { bg: "rgba(23,37,84,0.2)",    border: "rgba(147,197,253,0.2)",  glow: "rgba(147,197,253,0.13)", accent: "#93c5fd", dot: "#1d4ed8" },
  "low-immunity":   { bg: "rgba(20,83,45,0.22)",   border: "rgba(134,239,172,0.2)",  glow: "rgba(134,239,172,0.13)", accent: "#86efac", dot: "#15803d" },
};

// ── Ingredient icon map ──────────────────────────────────────────────────────
const REMEDY_ICONS: Record<string, typeof Leaf> = {
  "Raw Honey": Droplets,
  "Ginger Tea": Coffee,
  "Warm Salt Water Gargle": Waves,
  "Slippery Elm Lozenges": Leaf,
  "Turmeric Milk": Moon,
  "Electrolyte Replenishment": Droplets,
  "Magnesium-Rich Foods": Leaf,
  "Consistent Sleep Schedule": Moon,
  "Cold Water Face Splash": Waves,
  "Iron + Vitamin C Pairing": Apple,
  "Honey + Warm Water": Droplets,
  "Steam Inhalation": Wind,
  "Stay Hydrated": Droplets,
  "Elevate Your Head": Moon,
  "Thyme Tea": Leaf,
  "Peppermint Tea": Leaf,
  "Probiotics": Sparkles,
  "Fennel Seeds": Leaf,
  "Gentle Abdominal Massage": Waves,
  "Avoid Gas-Producing Foods": Apple,
  "Magnesium Glycinate": Moon,
  "Ashwagandha": Leaf,
  "Omega-3 Fatty Acids": Droplets,
  "Daily Walks in Nature": Sun,
  "Sunlight Exposure": Sun,
  "Hydration": Droplets,
  "Peppermint Oil": Leaf,
  "Magnesium": Sparkles,
  "Cold Compress": Waves,
  "Ginger": Leaf,
  "Sleep Schedule Consistency": Moon,
  "Tart Cherry Juice": Apple,
  "Light Dimming": Moon,
  "Room Cooling": Wind,
  "Tart Cherry": Apple,
  "Turmeric + Black Pepper": Leaf,
  "Contrast Shower": Waves,
  "Active Recovery": Activity,
  "Protein Timing": Dumbbell,
  "Colloidal Oatmeal Bath": Waves,
  "Zinc-Rich Foods": Apple,
  "Vitamin D3 + K2": Sun,
  "Elderberry (Sambucus)": Leaf,
  "Fermented Foods Daily": Sparkles,
  "Sleep 7–9 Hours": Moon,
  "Collagen Peptides": Sparkles,
  "Warm Epsom Salt Soak": Waves,
  "Eliminate Inflammatory Foods": Apple,
  "Flaxseed": Leaf,
  "Prunes or Prune Juice": Apple,
  "Magnesium Citrate": Sparkles,
  "Squat Position (Footstool)": Activity,
};

function getRemedyIcon(name: string): typeof Leaf {
  return REMEDY_ICONS[name] ?? Leaf;
}

// ── Sub-component: Remedy Card ───────────────────────────────────────────────
function RemedyCardView({ card, index, initialExpanded }: { card: RemedyCard; index: number; initialExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(initialExpanded ?? false);
  const Icon = card.icon;
  const pal = CARD_PALETTE[card.id] ?? {
    bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)",
    glow: "rgba(255,255,255,0.08)", accent: "#4ade80", dot: "#16a34a",
  };

  return (
    <div
      className="nr-card-in overflow-hidden"
      style={{
        animationDelay: `${index * 55}ms`,
        borderRadius: 18,
        background: expanded ? pal.bg : "rgba(255,255,255,0.025)",
        border: `1px solid ${expanded ? pal.border : "rgba(255,255,255,0.06)"}`,
        boxShadow: expanded
          ? `0 12px 48px ${pal.glow}, 0 2px 0 rgba(255,255,255,0.04) inset`
          : "0 2px 8px rgba(0,0,0,0.25)",
        transition: "background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease",
      }}
    >
      {/* ── Card Header (always visible) ── */}
      <button
        className="w-full text-left"
        style={{ WebkitTapHighlightColor: "transparent" }}
        onClick={() => { setExpanded(v => !v); hapticLight(); }}
      >
        <div
          className="relative overflow-hidden"
          style={{ padding: "16px 18px 14px" }}
        >
          {/* Subtle shimmer on hover/active */}
          {expanded && (
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{ borderRadius: 18 }}
            >
              <div
                className="nr-shimmer absolute top-0 bottom-0"
                style={{
                  width: "40%",
                  background: `linear-gradient(90deg, transparent, ${pal.accent}0a, transparent)`,
                }}
              />
            </div>
          )}

          <div className="relative flex items-center gap-3.5">
            {/* Icon badge */}
            <div
              style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: `${pal.bg}`,
                border: `1px solid ${pal.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: expanded ? `0 4px 16px ${pal.glow}` : "none",
                transition: "box-shadow 0.35s ease",
              }}
            >
              <Icon size={19} style={{ color: pal.accent }} />
            </div>

            {/* Title + tagline */}
            <div className="flex-1 min-w-0">
              <h2
                style={{
                  fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.92)",
                  letterSpacing: "-0.015em", lineHeight: 1.25,
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: 3,
                }}
              >
                {card.condition}
              </h2>
              <p
                style={{
                  fontSize: 11.5, lineHeight: 1.45,
                  color: "rgba(255,255,255,0.38)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {card.tagline}
              </p>
            </div>

            {/* Chevron */}
            <div
              style={{
                width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <ChevronDown size={13} style={{ color: "rgba(255,255,255,0.45)" }} />
            </div>
          </div>

          {/* Pills row */}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <span
              style={{
                fontSize: 10, fontWeight: 600,
                padding: "2.5px 9px", borderRadius: 99,
                background: `${pal.accent}14`,
                color: pal.accent,
                border: `1px solid ${pal.accent}22`,
              }}
            >
              {card.remedies.length} remedies
            </span>
            <span
              style={{
                fontSize: 10, fontWeight: 500,
                padding: "2.5px 9px", borderRadius: 99,
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.3)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              Science-backed
            </span>
          </div>
        </div>
      </button>

      {/* ── Expanded Content ── */}
      {expanded && (
        <div className="nr-expand" style={{ padding: "0 18px 22px" }}>
          {/* Divider */}
          <div style={{ height: 1, background: `${pal.border}`, marginBottom: 18 }} />

          {/* Section label */}
          <p
            style={{
              fontSize: 9, fontWeight: 700,
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: pal.accent, opacity: 0.7,
              fontFamily: "'DM Mono', monospace",
              marginBottom: 12,
            }}
          >
            What to Do
          </p>

          {/* Remedy rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {card.remedies.map((remedy, i) => {
              const RIcon = getRemedyIcon(remedy.name);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex", gap: 12, alignItems: "flex-start",
                    padding: "13px 14px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                      background: `${pal.dot}18`,
                      border: `1px solid ${pal.dot}28`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: 1,
                    }}
                  >
                    <RIcon size={13} style={{ color: pal.accent }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13, fontWeight: 600, marginBottom: 4,
                        color: "rgba(255,255,255,0.82)",
                        fontFamily: "'DM Sans', sans-serif",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {remedy.name}
                    </p>
                    <p style={{ fontSize: 12, lineHeight: 1.65, color: "rgba(255,255,255,0.42)" }}>
                      {remedy.howTo}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "18px 0" }} />

          {/* The Science */}
          <div
            style={{
              padding: "14px 15px",
              borderRadius: 14,
              background: `${pal.accent}08`,
              border: `1px solid ${pal.accent}18`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
              <div
                style={{
                  width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                  background: `${pal.accent}14`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Leaf size={11} style={{ color: pal.accent }} />
              </div>
              <p
                style={{
                  fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: pal.accent, opacity: 0.75,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                The Science
              </p>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.48)" }}>
              {card.scienceFact}
            </p>
          </div>

          {/* See a Doctor If */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              background: "rgba(239,68,68,0.04)",
              border: "1px solid rgba(239,68,68,0.1)",
              marginTop: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div
                style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: "rgba(239,68,68,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Thermometer size={10} style={{ color: "#f87171" }} />
              </div>
              <p
                style={{
                  fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "#f87171", opacity: 0.8,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                See a Doctor If
              </p>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.65, color: "rgba(255,255,255,0.38)" }}>
              {card.whenToSeeDoctor}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function NaturalRecoveryPage() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<RemedyCategory>("All");
  const [autoOpenId, setAutoOpenId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      setAutoOpenId(hash);
      // If the condition exists and has a category, switch to that category
      const card = REMEDY_CARDS.find(c => c.id === hash);
      if (card && card.category !== "All") {
        // Keep "All" so the card is visible
      }
    }
  }, []);

  const CATEGORIES: RemedyCategory[] = ["All", "Throat & Chest", "Energy & Sleep", "Digestion", "Pain & Inflammation", "Immunity", "Skin", "Mind"];

  const filteredCards = REMEDY_CARDS.filter(c => {
    const matchesCategory = activeCategory === "All" || c.category === activeCategory;
    const q = query.trim().toLowerCase();
    const matchesSearch = !q ||
      c.condition.toLowerCase().includes(q) ||
      c.tagline.toLowerCase().includes(q) ||
      c.remedies.some(r => r.name.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background: "linear-gradient(180deg, #040d07 0%, #061210 30%, #081a12 65%, #0a2016 100%)",
      }}
    >
      {/* ── Ambient floating orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="nr-float-a absolute"
          style={{
            top: "8%", left: "15%",
            width: 280, height: 280, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(22,163,74,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="nr-float-b absolute"
          style={{
            top: "35%", right: "-5%",
            width: 220, height: 220, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)",
          }}
        />
        <div
          className="nr-float-c absolute"
          style={{
            bottom: "20%", left: "-8%",
            width: 300, height: 300, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(5,150,105,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Hero Header ── */}
      <div
        className="relative"
        style={{
          paddingTop: 56, paddingBottom: 28,
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          zIndex: 1,
        }}
      >
        {/* Subtle top glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -80, left: "50%", transform: "translateX(-50%)",
            width: 400, height: 200,
            background: "radial-gradient(ellipse, rgba(22,163,74,0.09) 0%, transparent 70%)",
          }}
        />

        <div className="px-5 relative">
          {/* Back button */}
          <button
            onClick={() => navigate("/more")}
            className="flex items-center gap-1.5 mb-8 active:scale-95 transition-transform"
            style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 500 }}
          >
            <ArrowLeft size={15} />
            <span>More</span>
          </button>

          {/* Title row */}
          <div className="flex items-start gap-4 mb-4">
            <div
              style={{
                width: 50, height: 50, borderRadius: 16, flexShrink: 0,
                background: "rgba(22,163,74,0.12)",
                border: "1px solid rgba(22,163,74,0.2)",
                boxShadow: "0 4px 20px rgba(22,163,74,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Leaf size={21} style={{ color: "#4ade80" }} />
            </div>
            <div style={{ paddingTop: 2 }}>
              <p
                style={{
                  fontSize: 9, fontWeight: 600,
                  letterSpacing: "0.22em", textTransform: "uppercase",
                  color: "rgba(74,222,128,0.4)",
                  fontFamily: "'DM Mono', monospace",
                  marginBottom: 5,
                }}
              >
                Wellness
              </p>
              <h1
                style={{
                  fontSize: 27, fontWeight: 800, color: "rgba(255,255,255,0.93)",
                  letterSpacing: "-0.03em", lineHeight: 1.1,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Natural Recovery
              </h1>
            </div>
          </div>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 13, lineHeight: 1.65,
              color: "rgba(255,255,255,0.32)",
              marginBottom: 22,
              maxWidth: 320,
            }}
          >
            Food-first remedies with clinical evidence. Use alongside — not instead of — professional care.
          </p>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Conditions", value: "13" },
              { label: "Remedies", value: "65+" },
              { label: "Evidence", value: "100%" },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  textAlign: "center",
                  padding: "11px 8px",
                  borderRadius: 13,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p
                  style={{
                    fontSize: 19, fontWeight: 800, color: "rgba(255,255,255,0.88)",
                    fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em",
                  }}
                >
                  {value}
                </p>
                <p
                  style={{
                    fontSize: 9, fontWeight: 600,
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)",
                    fontFamily: "'DM Mono', monospace",
                    marginTop: 3,
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

            {/* ── Search bar ── */}
      <div className="px-4 pt-6 pb-2" style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 14px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: query ? "0 0 0 1px rgba(74,222,128,0.2), 0 4px 16px rgba(0,0,0,0.2)" : "none",
            transition: "box-shadow 0.25s ease",
          }}
        >
          <Search size={15} style={{ color: "rgba(255,255,255,0.28)", flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search conditions or remedies…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 13.5, color: "rgba(255,255,255,0.78)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0, lineHeight: 0 }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category chips ── */}
      <div
        className="px-4 pt-3 pb-1"
        style={{
          position: "relative", zIndex: 1,
          display: "flex", gap: 7, overflowX: "auto",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0,
                padding: "6px 13px",
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: isActive ? 700 : 500,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: isActive ? "0.01em" : "0",
                color: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.35)",
                background: isActive
                  ? "linear-gradient(135deg, rgba(46,158,46,0.35) 0%, rgba(34,120,34,0.25) 100%)"
                  : "rgba(255,255,255,0.04)",
                border: isActive
                  ? "1px solid rgba(74,222,128,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
                boxShadow: isActive
                  ? "0 0 10px rgba(74,222,128,0.12), inset 0 1px 0 rgba(255,255,255,0.06)"
                  : "none",
                transition: "all 0.2s ease",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Conditions label ── */}
      <div className="px-5 pt-3 pb-3" style={{ position: "relative", zIndex: 1 }}>
        <p
          style={{
            fontSize: 9, fontWeight: 600,
            letterSpacing: "0.22em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.18)",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {query.trim()
            ? `${filteredCards.length} result${filteredCards.length !== 1 ? "s" : ""} for "${query.trim()}"`
            : activeCategory === "All"
              ? "13 Conditions"
              : `${filteredCards.length} condition${filteredCards.length !== 1 ? "s" : ""} · ${activeCategory}`}
        </p>
      </div>

      {/* ── Remedy Cards ── */}
      <div
        className="px-4"
        style={{
          display: "flex", flexDirection: "column", gap: 8,
          position: "relative", zIndex: 1,
        }}
      >
        {filteredCards.length > 0 ? (
          filteredCards.map((card, i) => (
            <RemedyCardView key={card.id} card={card} index={i} initialExpanded={autoOpenId === card.id} />
          ))
        ) : (
          <div
            style={{
              textAlign: "center", padding: "48px 24px",
              color: "rgba(255,255,255,0.22)",
              fontSize: 13, lineHeight: 1.6,
            }}
          >
            <Search size={28} style={{ color: "rgba(255,255,255,0.12)", margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 600, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>No results found</p>
            <p>Try a different symptom or remedy name.</p>
          </div>
        )}
      </div>

      {/* ── Footer disclaimer ── */}
      <div className="px-6 mt-10 mb-4" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginBottom: 16 }} />
        <p
          style={{
            textAlign: "center", fontSize: 11, lineHeight: 1.65,
            color: "rgba(255,255,255,0.15)",
          }}
        >
          For educational purposes only. Not medical advice.{"\n"}Always consult a qualified healthcare provider.
        </p>
      </div>
    </div>
  );
}
