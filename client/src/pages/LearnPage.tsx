/**
 * EatVera LearnPage — v2 Clean & Vital
 * Design: Organic Modernism — educational, clean, health-forward
 */
import { useState } from "react";
import { AlertTriangle, Leaf, ChevronDown, ChevronUp, CheckCircle, Zap, ShieldCheck, BookOpen, ArrowLeft } from "lucide-react";
import { hapticLight } from "@/lib/haptic";

const SEED_OILS = [
  { name: "Canola Oil", why: "High in omega-6, often partially hydrogenated, extracted with hexane solvent" },
  { name: "Corn Oil", why: "Extremely high omega-6 content, heavily refined, promotes inflammation" },
  { name: "Cottonseed Oil", why: "Naturally contains gossypol toxin, requires heavy processing to remove" },
  { name: "Soybean Oil", why: "Most consumed oil in the US, linked to obesity and metabolic dysfunction" },
  { name: "Sunflower Oil", why: "Very high linoleic acid (omega-6), oxidizes easily at high heat" },
  { name: "Safflower Oil", why: "Highest omega-6 content of all oils, strongly pro-inflammatory" },
  { name: "Grapeseed Oil", why: "Marketed as healthy but extremely high in omega-6 linoleic acid" },
  { name: "Rice Bran Oil", why: "Heavily processed, high omega-6, often used in Asian restaurant frying" },
];

const CLEAN_ALTERNATIVES = [
  { bad: "Canola / Vegetable Oil", good: "Beef Tallow or Butter", icon: "🥩" },
  { bad: "Soybean Oil", good: "Extra Virgin Olive Oil", icon: "🫒" },
  { bad: "Corn Oil", good: "Coconut Oil", icon: "🥥" },
  { bad: "Sunflower Oil", good: "Avocado Oil", icon: "🥑" },
  { bad: "Margarine", good: "Grass-Fed Butter or Ghee", icon: "🧈" },
  { bad: "Processed Dressings", good: "Olive Oil + Vinegar", icon: "🍶" },
];

const FAQS = [
  {
    q: "What does the 1-100 score mean?",
    a: "The score is calculated based on ingredient quality. We start at 100 and deduct points for harmful ingredients: seed oils (-15 each), trans fats (-20), artificial colors (-10), HFCS (-15), nitrates (-8), and more. We add points back for clean, whole-food ingredients. 80-100 is Excellent, 60-79 is Good, 40-59 is Fair, 20-39 is Poor, and 0-19 is Avoid.",
  },
  {
    q: "Why are seed oils so bad?",
    a: "Seed oils are industrial oils extracted using chemical solvents (hexane) and high heat. They are extremely high in omega-6 linoleic acid, which in excess promotes chronic inflammation. The human body evolved with an omega-6 to omega-3 ratio of about 4:1. The modern Western diet has pushed this to 20:1 or higher due to seed oil consumption.",
  },
  {
    q: "What is NOVA processing classification?",
    a: "NOVA is a food classification system developed by researchers at the University of Sao Paulo. It groups foods into 4 categories: 1 (unprocessed), 2 (culinary ingredients), 3 (processed foods), and 4 (ultra-processed). Ultra-processed foods (NOVA 4) are strongly linked to obesity, diabetes, cancer, and cardiovascular disease.",
  },
  {
    q: "Is grass-fed beef really better?",
    a: "Yes. Grass-fed beef contains 2-5x more omega-3 fatty acids, higher levels of CLA (a natural anti-cancer fat), more vitamin E, and a healthier omega-6 to omega-3 ratio compared to grain-fed beef. It also avoids the hormones and antibiotics commonly used in conventional feedlot operations.",
  },
  {
    q: "What are the worst food additives to avoid?",
    a: "The most concerning additives include: BHA/BHT (potential carcinogens), sodium nitrate/nitrite (form carcinogenic N-nitrosamines), artificial food dyes (Red 40, Yellow 5/6), TBHQ (petroleum-derived preservative), carrageenan (gut inflammation), and high-fructose corn syrup (metabolic dysfunction).",
  },
  {
    q: "How do I read a nutrition label?",
    a: "Start with the ingredients list. Ingredients are listed in order by weight. If a seed oil, sugar, or unrecognizable chemical appears in the first 5 ingredients, put it back. Then check sodium (aim for under 600mg per 100g), added sugars (aim for under 5g per 100g), and trans fats (should be 0g). Ignore marketing claims on the front.",
  },
];

const SCORE_GRADES = [
  { range: "80-100", label: "Excellent", color: "#145A3A", bg: "#f0faf0", desc: "Clean ingredients, minimal processing, high nutritional value" },
  { range: "60-79", label: "Good", color: "#0B3D2E", bg: "#dcf4dc", desc: "Mostly clean with minor concerns — acceptable choice" },
  { range: "40-59", label: "Fair", color: "#d97706", bg: "#fef3c7", desc: "Some problematic ingredients — consume occasionally" },
  { range: "20-39", label: "Poor", color: "#ea580c", bg: "#fff7ed", desc: "Multiple harmful ingredients — limit consumption" },
  { range: "0-19", label: "Avoid", color: "#dc2626", bg: "#fee2e2", desc: "Highly processed, multiple serious ingredient concerns" },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card rounded-2xl border border-stone-100 dark:border-stone-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
      >
        <span className="font-semibold text-stone-700 dark:text-stone-200 text-sm pr-4">{q}</span>
        {open ? <ChevronUp size={16} className="text-stone-400 dark:text-stone-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-stone-400 dark:text-stone-500 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function LearnPage() {
  return (
    <div className="ec-page-bg pb-24">
      <div className="px-5 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => { hapticLight(); window.history.back(); }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: "rgba(11,61,46,0.08)", border: "1px solid rgba(11,61,46,0.12)" }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} style={{ color: "#0B3D2E" }} />
          </button>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={20} style={{ color: "#3FA34D" }} />
          <h1 className="font-bold text-2xl text-stone-800 dark:text-stone-100" style={{ letterSpacing: "-0.02em" }}>Learn</h1>
        </div>
        <p className="text-stone-400 dark:text-stone-500 text-sm">Understand what is really in your food</p>
      </div>

      <div className="px-4 mb-6">
        <div className="ec-section-label mb-3">EatVera Score Guide</div>
        <div className="ec-card overflow-hidden">
          {SCORE_GRADES.map(({ range, label, color, bg, desc }, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < SCORE_GRADES.length - 1 ? "border-b border-stone-50 dark:border-stone-700/50" : ""}`}>
              <div className="w-14 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <span className="font-bold text-xs font-mono-data" style={{ color }}>{range}</span>
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color }}>{label}</div>
                <div className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="rounded-2xl p-4 border mb-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-red-500 dark:text-red-400" />
            </div>
            <div>
              <h2 className="font-bold text-red-700 dark:text-red-300 text-base mb-1">The Hateful Eight Seed Oils</h2>
              <p className="text-red-600/70 dark:text-red-400/70 text-xs leading-relaxed">
                These 8 industrial oils are the primary driver of inflammation in the modern diet. They are in almost every packaged food. EatVera flags all of them.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {SEED_OILS.map(({ name, why }, i) => (
            <div key={i} className="ec-card p-3.5 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="font-bold text-xs text-red-500 dark:text-red-400 font-mono-data">{i + 1}</span>
              </div>
              <div>
                <p className="font-semibold text-stone-700 dark:text-stone-200 text-sm">{name}</p>
                <p className="text-stone-400 dark:text-stone-500 text-xs leading-relaxed mt-0.5">{why}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="ec-section-label mb-3">Clean Swaps</div>
        <div className="space-y-2">
          {CLEAN_ALTERNATIVES.map(({ bad, good, icon }, i) => (
            <div key={i} className="ec-card p-3.5 flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="ec-badge-red">{bad}</span>
                  <span className="text-stone-400 text-xs">to</span>
                  <span className="ec-badge-green">{good}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="ec-section-label mb-3">Clean Eating Principles</div>
        <div className="grid grid-cols-1 gap-2.5">
          {[
            { icon: Leaf, title: "Eat Whole Foods", desc: "If it grew in the ground, on a tree, or was an animal it is probably fine. If it was made in a factory, be skeptical.", color: "#0B3D2E" },
            { icon: ShieldCheck, title: "5-Ingredient Rule", desc: "Products with more than 5 ingredients are usually ultra-processed. Real food does not need a chemistry lab.", color: "#0B3D2E" },
            { icon: Zap, title: "Shop the Perimeter", desc: "Fresh produce, meat, and dairy are on the outer edges of every grocery store. The center aisles are where processed foods live.", color: "#d97706" },
            { icon: CheckCircle, title: "Know Your Fats", desc: "Saturated fats (butter, tallow, coconut oil) are stable and safe. Polyunsaturated seed oils oxidize and cause inflammation.", color: "#0B3D2E" },
          ].map(({ icon: Icon, title, desc, color }, i) => (
            <div key={i} className="ec-card p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}12` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <h3 className="font-semibold text-stone-700 dark:text-stone-200 text-sm mb-1">{title}</h3>
                <p className="text-stone-400 dark:text-stone-500 text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="ec-section-label mb-3">Frequently Asked Questions</div>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>

      <div className="px-4">
        <div className="rounded-2xl p-5 text-center bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <Leaf size={28} style={{ color: "#3FA34D" }} className="mx-auto mb-2" />
          <h3 className="font-bold text-stone-700 dark:text-stone-200 text-base mb-1">Start Scanning Today</h3>
          <p className="text-stone-500 dark:text-stone-400 text-xs leading-relaxed">
            Knowledge is the first step. Use EatVera to make every grocery trip a healthier choice.
          </p>
        </div>
      </div>
    </div>
  );
}
