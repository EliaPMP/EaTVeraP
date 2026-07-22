/**
 * DailyCalorieProgress — shows today's calorie consumption vs goal
 * with a large progress ring, macro bars, and a settings modal.
 */
import { useState } from "react";
import { Settings, Target, Flame, Beef, Wheat, Droplets, CheckCircle, Sparkles, Loader2 } from "lucide-react";
import { useCalorieGoals, CalorieGoals } from "@/hooks/useCalorieGoals";
import { trpc } from "@/lib/trpc";

// ─── Radial Progress Ring ─────────────────────────────────────────────────────
function RadialRing({
  value, max, size = 120, stroke = 10, color,
}: {
  value: number; max: number; size?: number; stroke?: number; color: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ - pct * circ;
  const isOver = value > max;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f5f5f4" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={isOver ? 0 : offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-bold leading-none" style={{ fontSize: 22, color: color, fontFamily: "'DM Mono', monospace" }}>
          {Math.round(value)}
        </div>
        <div className="text-[10px] text-stone-400 mt-0.5">/ {max}</div>
        <div className="text-[9px] text-stone-400 font-medium">kcal</div>
      </div>
    </div>
  );
}

// ─── Mini Macro Bar ───────────────────────────────────────────────────────────
function MiniMacroBar({
  label, value, goal, unit, color, icon: Icon,
}: {
  label: string; value: number; goal: number; unit: string; color: string; icon: React.ElementType;
}) {
  const pct = Math.min((value / goal) * 100, 100);
  const isOver = value > goal;
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Icon size={10} style={{ color }} />
          <span className="text-[10px] text-stone-500 font-medium">{label}</span>
        </div>
        <span className="text-[10px] font-bold" style={{ color: "inherit", fontFamily: "'DM Mono', monospace" }}>
          {Math.round(value)}/{goal}{unit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Goal Settings Modal ──────────────────────────────────────────────────────
export function GoalSettingsModal({
  goals,
  onSave,
  onClose,
}: {
  goals: CalorieGoals;
  onSave: (g: CalorieGoals) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...goals });
  const [saved, setSaved] = useState(false);

  // AI suggestion state
  const [showAI, setShowAI] = useState(false);
  const [aiCurrentWeight, setAiCurrentWeight] = useState("");
  const [aiTargetWeight, setAiTargetWeight] = useState("");
  const [aiUnit, setAiUnit] = useState<"kg" | "lbs">("lbs");
  const [aiActivity, setAiActivity] = useState<"sedentary" | "light" | "moderate" | "active" | "very_active">("moderate");
  const [aiGoal, setAiGoal] = useState<"lose" | "maintain" | "gain">("maintain");
  const [aiExplanation, setAiExplanation] = useState("");
  const suggestGoals = trpc.fitness.suggestGoals.useMutation({
    onSuccess: (data) => {
      setForm({ dailyCalories: data.dailyCalories, dailyProtein: data.dailyProtein, dailyCarbs: data.dailyCarbs, dailyFat: data.dailyFat });
      setAiExplanation(data.explanation);
    },
  });

  function handleSuggest() {
    const cw = parseFloat(aiCurrentWeight);
    const tw = parseFloat(aiTargetWeight);
    if (!cw || !tw || cw <= 0 || tw <= 0) return;
    suggestGoals.mutate({ currentWeight: cw, targetWeight: tw, unit: aiUnit, activityLevel: aiActivity, goal: aiGoal });
  }

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  const field = (
    key: keyof CalorieGoals,
    label: string,
    unit: string,
    color: string,
    icon: React.ElementType
  ) => {
    const Icon = icon;
    return (
      <div key={key}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
            <Icon size={12} style={{ color }} />
          </div>
          <label className="text-sm font-semibold text-stone-700">{label}</label>
          <span className="text-xs text-stone-400 ml-auto">{unit}/day</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setForm(f => ({ ...f, [key]: Math.max(0, f[key] - (key === "dailyCalories" ? 50 : 5)) }))}
            className="w-9 h-9 rounded-xl bg-stone-100 text-stone-600 font-bold text-lg flex items-center justify-center"
          >−</button>
          <input
            type="number"
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: Math.max(0, Number(e.target.value)) }))}
            className="flex-1 text-center rounded-xl border border-stone-200 py-2 font-bold text-stone-800 text-base focus:outline-none focus:border-green-400"
            style={{ fontFamily: "'DM Mono', monospace" }}
          />
          <button
            onClick={() => setForm(f => ({ ...f, [key]: f[key] + (key === "dailyCalories" ? 50 : 5) }))}
            className="w-9 h-9 rounded-xl bg-stone-100 text-stone-600 font-bold text-lg flex items-center justify-center"
          >+</button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
        <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10" style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#DCF4DF] flex items-center justify-center">
                <Target size={16} className="text-[#145A3A]" />
              </div>
              <h2 className="font-bold text-stone-800 text-base">Daily Goals</h2>
            </div>
            <button onClick={onClose} className="text-stone-400 text-xl font-light">✕</button>
          </div>

          {/* AI Suggest button */}
          <div className="mb-4">
            <button
              onClick={() => setShowAI(v => !v)}
              className="w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all"
              style={{
                background: showAI ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.05)",
                borderColor: showAI ? "rgba(139,92,246,0.4)" : "rgba(139,92,246,0.2)",
                color: "#7c3aed",
              }}
            >
              <Sparkles size={15} />
              AI Goal Suggestion
            </button>

            {showAI && (
              <div className="mt-3 rounded-2xl p-4 border" style={{ background: "rgba(139,92,246,0.04)", borderColor: "rgba(139,92,246,0.15)" }}>
                {/* Unit toggle */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-stone-500 font-medium">Unit:</span>
                  {(["lbs", "kg"] as const).map(u => (
                    <button key={u} onClick={() => setAiUnit(u)}
                      className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                      style={{ background: aiUnit === u ? "#7c3aed" : "#f3f4f6", color: aiUnit === u ? "white" : "#6b7280" }}
                    >{u}</button>
                  ))}
                </div>
                {/* Weight inputs */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block mb-1">Current Weight ({aiUnit})</label>
                    <input
                      type="number"
                      value={aiCurrentWeight}
                      onChange={e => setAiCurrentWeight(e.target.value)}
                      placeholder={aiUnit === "lbs" ? "e.g. 180" : "e.g. 82"}
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-800 focus:outline-none focus:border-violet-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block mb-1">Target Weight ({aiUnit})</label>
                    <input
                      type="number"
                      value={aiTargetWeight}
                      onChange={e => setAiTargetWeight(e.target.value)}
                      placeholder={aiUnit === "lbs" ? "e.g. 160" : "e.g. 73"}
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-800 focus:outline-none focus:border-violet-400"
                    />
                  </div>
                </div>
                {/* Goal type */}
                <div className="mb-3">
                  <label className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block mb-1">Goal</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["lose", "maintain", "gain"] as const).map(g => (
                      <button key={g} onClick={() => setAiGoal(g)}
                        className="py-1.5 rounded-xl text-xs font-bold capitalize transition-all"
                        style={{ background: aiGoal === g ? "#7c3aed" : "#f3f4f6", color: aiGoal === g ? "white" : "#6b7280" }}
                      >{g}</button>
                    ))}
                  </div>
                </div>
                {/* Activity level */}
                <div className="mb-3">
                  <label className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block mb-1">Activity Level</label>
                  <select
                    value={aiActivity}
                    onChange={e => setAiActivity(e.target.value as typeof aiActivity)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-violet-400 bg-white"
                  >
                    <option value="sedentary">Sedentary (desk job, no exercise)</option>
                    <option value="light">Lightly active (1-3 days/week)</option>
                    <option value="moderate">Moderately active (3-5 days/week)</option>
                    <option value="active">Very active (6-7 days/week)</option>
                    <option value="very_active">Extra active (physical job + training)</option>
                  </select>
                </div>
                {/* Suggest button */}
                <button
                  onClick={handleSuggest}
                  disabled={suggestGoals.isPending || !aiCurrentWeight || !aiTargetWeight}
                  className="w-full py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                >
                  {suggestGoals.isPending ? <><Loader2 size={15} className="animate-spin" /> Calculating...</> : <><Sparkles size={15} /> Suggest My Goals</>}
                </button>
                {/* AI explanation */}
                {aiExplanation && (
                  <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <p className="text-xs text-violet-700 leading-relaxed">✨ {aiExplanation}</p>
                    <p className="text-[10px] text-stone-400 mt-1">Goals have been filled in below — review and save.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preset buttons */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Quick Presets</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Cut", cal: 1500, p: 160, c: 130, f: 50 },
                { label: "Maintain", cal: 2000, p: 150, c: 200, f: 65 },
                { label: "Bulk", cal: 2800, p: 200, c: 300, f: 80 },
              ].map(preset => (
                <button
                  key={preset.label}
                  onClick={() => setForm({ dailyCalories: preset.cal, dailyProtein: preset.p, dailyCarbs: preset.c, dailyFat: preset.f })}
                  className="py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-green-50 hover:border-green-300 transition-all"
                >
                  {preset.label}<br />
                  <span className="text-[10px] text-stone-400 font-normal">{preset.cal} kcal</span>
                </button>
              ))}
            </div>
          </div>

          {field("dailyCalories", "Daily Calories", "kcal", "#f97316", Flame)}
          {field("dailyProtein", "Protein", "g", "#2563eb", Beef)}
          {field("dailyCarbs", "Carbohydrates", "g", "#d97706", Wheat)}
          {field("dailyFat", "Fat", "g", "#dc2626", Droplets)}

          <button
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all"
            style={{ background: saved ? "#0B3D2E" : "linear-gradient(135deg, #145A3A, #0B3D2E)" }}
          >
            {saved ? <><CheckCircle size={16} /> Saved!</> : "Save Goals"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DailyCalorieProgress({ compact = false, caloriesBurned = 0 }: { compact?: boolean; caloriesBurned?: number }) {
  const { goals, saveGoals, todayTotals, progress, todayEntries } = useCalorieGoals();
  const [showSettings, setShowSettings] = useState(false);

  const caloriesLeft = goals.dailyCalories - todayTotals.calories;
  const isOver = caloriesLeft < 0;
  const netCalories = todayTotals.calories - caloriesBurned;
  const netIsDeficit = netCalories < 0;

  if (compact) {
    // Compact version for History page
    return (
      <>
        {showSettings && (
          <GoalSettingsModal goals={goals} onSave={saveGoals} onClose={() => setShowSettings(false)} />
        )}
        <div className="rounded-2xl border border-stone-100 bg-white p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center">
                <Flame size={14} className="text-orange-500" />
              </div>
              <span className="font-bold text-stone-800 text-sm">Today's Calories</span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100"
            >
              <Settings size={14} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <RadialRing value={todayTotals.calories} max={goals.dailyCalories} size={80} stroke={8} color="#f97316" />
            <div className="flex-1 space-y-2">
              <MiniMacroBar label="Protein" value={todayTotals.protein} goal={goals.dailyProtein} unit="g" color="#2563eb" icon={Beef} />
              <MiniMacroBar label="Carbs" value={todayTotals.carbs} goal={goals.dailyCarbs} unit="g" color="#d97706" icon={Wheat} />
              <MiniMacroBar label="Fat" value={todayTotals.fat} goal={goals.dailyFat} unit="g" color="#dc2626" icon={Droplets} />
            </div>
          </div>
          <div className="mt-3 text-center">
            <span className="text-xs font-semibold" style={{ color: "#0B3D2E" }}>
              {isOver
                ? `${Math.abs(Math.round(caloriesLeft))} kcal over goal`
                : `${Math.round(caloriesLeft)} kcal remaining`}
            </span>
            {todayEntries.length > 0 && (
              <span className="text-xs text-stone-400 ml-2">· {todayEntries.length} meal{todayEntries.length !== 1 ? "s" : ""} logged</span>
            )}
          </div>
        </div>
      </>
    );
  }

  // Full version for Calorie Scanner page
  return (
    <>
      {showSettings && (
        <GoalSettingsModal goals={goals} onSave={saveGoals} onClose={() => setShowSettings(false)} />
      )}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: "linear-gradient(135deg, #145A3A, #0B3D2E)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#bbf7d0" }}>
              Daily Goal
            </div>
            <div className="font-bold text-white text-base">
              {isOver
                ? `${Math.abs(Math.round(caloriesLeft))} kcal over`
                : `${Math.round(caloriesLeft)} kcal left`}
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all"
          >
            <Settings size={15} className="text-white" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Three-arc macro ring */}
          {(() => {
            const R = 42;
            const circ = 2 * Math.PI * R;
            // Total filled arc = calorie progress (capped at 100%)
            const calPct = Math.min(progress.calories, 1);
            const filledArc = calPct * circ;
            // Each macro's raw progress (capped at 1)
            const pP = Math.min(progress.protein, 1);
            const pC = Math.min(progress.carbs, 1);
            const pF = Math.min(progress.fat, 1);
            const macroTotal = pP + pC + pF || 1;
            // Each macro gets a proportional slice of the FILLED arc only
            const arcP = (pP / macroTotal) * filledArc;
            const arcC = (pC / macroTotal) * filledArc;
            const arcF = (pF / macroTotal) * filledArc;
            // Each arc starts where the previous ended
            const offsetP = 0;
            const offsetC = arcP;
            const offsetF = arcP + arcC;
            // dasharray: [visible length, rest of circumference], dashoffset: -startAngle
            const makeArc = (len: number, start: number) => ({
              strokeDasharray: `${len} ${circ - len}`,
              strokeDashoffset: -start,
            });
            return (
              <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
                <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
                  {/* Track — full circle, faint */}
                  <circle cx={50} cy={50} r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={9} />
                  {/* Protein arc — blue */}
                  <circle cx={50} cy={50} r={R} fill="none" stroke="#2563eb" strokeWidth={9}
                    strokeDasharray={makeArc(arcP, offsetP).strokeDasharray}
                    strokeDashoffset={makeArc(arcP, offsetP).strokeDashoffset}
                    strokeLinecap="butt"
                    style={{ transition: "stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease" }}
                  />
                  {/* Carbs arc — orange */}
                  <circle cx={50} cy={50} r={R} fill="none" stroke="#d97706" strokeWidth={9}
                    strokeDasharray={makeArc(arcC, offsetC).strokeDasharray}
                    strokeDashoffset={makeArc(arcC, offsetC).strokeDashoffset}
                    strokeLinecap="butt"
                    style={{ transition: "stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease" }}
                  />
                  {/* Fat arc — red */}
                  <circle cx={50} cy={50} r={R} fill="none" stroke="#dc2626" strokeWidth={9}
                    strokeDasharray={makeArc(arcF, offsetF).strokeDasharray}
                    strokeDashoffset={makeArc(arcF, offsetF).strokeDashoffset}
                    strokeLinecap="butt"
                    style={{ transition: "stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease" }}
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="font-bold text-white leading-none" style={{ fontSize: 20, fontFamily: "'DM Mono', monospace" }}>
                    {Math.round(progress.calories * 100)}%
                  </div>
                  <div className="text-white/70 text-[9px] mt-0.5">of goal</div>
                </div>
              </div>
            );
          })()}


          {/* Macro bars */}
          <div className="flex-1 space-y-2.5">
            {[
              { label: "Protein", value: todayTotals.protein, goal: goals.dailyProtein, pct: progress.protein, color: "#2563eb" },
              { label: "Carbs",   value: todayTotals.carbs,   goal: goals.dailyCarbs,   pct: progress.carbs,   color: "#d97706" },
              { label: "Fat",     value: todayTotals.fat,     goal: goals.dailyFat,     pct: progress.fat,     color: "#dc2626" },
            ].map(({ label, value, goal, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
                  <span className="text-[10px] text-white font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {Math.round(value)}/{goal}g
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(pct * 100, 100)}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {caloriesBurned > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Flame size={11} className="text-orange-300" />
                <span className="text-[11px] text-white/70 font-medium">Calories Burned</span>
              </div>
              <span className="text-[11px] text-orange-300 font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>−{Math.round(caloriesBurned)} kcal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white font-semibold">Net Calories</span>
              <span className="text-[11px] font-bold" style={{ fontFamily: "'DM Mono', monospace", color: netIsDeficit ? "#86efac" : "#fde68a" }}>
                {netIsDeficit ? `${Math.abs(Math.round(netCalories))} kcal deficit` : `${Math.round(netCalories)} kcal net`}
              </span>
            </div>
          </div>
        )}
        {todayEntries.length === 0 && caloriesBurned === 0 && (
          <div className="mt-3 text-center text-white/60 text-xs">
            No meals logged today — scan your first meal!
          </div>
        )}
      </div>
    </>
  );
}
