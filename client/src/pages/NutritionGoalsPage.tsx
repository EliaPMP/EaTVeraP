/**
 * Nutrition Goals Page
 * Users can set personal daily nutrient targets (min/max).
 * Goals are highlighted in the Nutrition tab of any scanned product.
 */

import { useState } from "react";
import WeeklyGoalChart from "@/components/WeeklyGoalChart";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Target,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "wouter";

/** Nutrient options users can set goals for */
const NUTRIENT_OPTIONS = [
  // Macros
  { key: "energy-kcal_100g", label: "Calories", unit: "kcal", defaultMax: 2000, defaultMin: 1500 },
  { key: "proteins_100g", label: "Protein", unit: "g", defaultMax: 200, defaultMin: 50 },
  { key: "carbohydrates_100g", label: "Carbohydrates", unit: "g", defaultMax: 300, defaultMin: 100 },
  { key: "fat_100g", label: "Total Fat", unit: "g", defaultMax: 78, defaultMin: 20 },
  { key: "saturated-fat_100g", label: "Saturated Fat", unit: "g", defaultMax: 20, defaultMin: 0 },
  { key: "fiber_100g", label: "Fiber", unit: "g", defaultMax: 100, defaultMin: 25 },
  { key: "sugars_100g", label: "Added Sugars", unit: "g", defaultMax: 50, defaultMin: 0 },
  // Minerals
  { key: "sodium_100g", label: "Sodium", unit: "mg", defaultMax: 2300, defaultMin: 0 },
  { key: "calcium_100g", label: "Calcium", unit: "mg", defaultMax: 3000, defaultMin: 1000 },
  { key: "iron_100g", label: "Iron", unit: "mg", defaultMax: 45, defaultMin: 8 },
  { key: "potassium_100g", label: "Potassium", unit: "mg", defaultMax: 4700, defaultMin: 2000 },
  // Vitamins
  { key: "vitamin-c_100g", label: "Vitamin C", unit: "mg", defaultMax: 2000, defaultMin: 65 },
  { key: "vitamin-d_100g", label: "Vitamin D", unit: "µg", defaultMax: 100, defaultMin: 15 },
];

/** Preset goal bundles for common dietary strategies */
const PRESETS = [
  {
    name: "Low Sodium",
    description: "Heart-healthy sodium limit",
    icon: TrendingDown,
    color: "#2563eb",
    goals: [
      { key: "sodium_100g", label: "Sodium", type: "max" as const, value: 1500, unit: "mg" },
    ],
  },
  {
    name: "High Fiber",
    description: "Gut health & satiety",
    icon: TrendingUp,
    color: "#145A3A",
    goals: [
      { key: "fiber_100g", label: "Fiber", type: "min" as const, value: 30, unit: "g" },
    ],
  },
  {
    name: "High Protein",
    description: "Muscle building & recovery",
    icon: TrendingUp,
    color: "#d97706",
    goals: [
      { key: "proteins_100g", label: "Protein", type: "min" as const, value: 150, unit: "g" },
      { key: "fat_100g", label: "Total Fat", type: "max" as const, value: 60, unit: "g" },
    ],
  },
  {
    name: "Low Sugar",
    description: "Metabolic health focus",
    icon: TrendingDown,
    color: "#dc2626",
    goals: [
      { key: "sugars_100g", label: "Added Sugars", type: "max" as const, value: 25, unit: "g" },
      { key: "carbohydrates_100g", label: "Carbohydrates", type: "max" as const, value: 150, unit: "g" },
    ],
  },
];

interface GoalRow {
  id: number;
  nutrientKey: string;
  nutrientLabel: string;
  targetType: "min" | "max";
  targetValue: number;
  unit: string;
}

function GoalCard({ goal, onDelete, isDeleting }: { goal: GoalRow; onDelete: (id: number) => void; isDeleting: boolean }) {
  return (
    <div className="ec-card p-3.5 flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${goal.targetType === "max" ? "bg-red-50 dark:bg-red-900/20" : "bg-green-50 dark:bg-green-900/20"}`}
      >
        {goal.targetType === "max" ? (
          <TrendingDown size={16} style={{ color: "#dc2626" }} />
        ) : (
          <TrendingUp size={16} style={{ color: "#145A3A" }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm truncate">{goal.nutrientLabel}</p>
        <p className="text-xs text-stone-400 dark:text-stone-500">
          {goal.targetType === "max" ? "Stay under" : "Reach at least"}{" "}
          <span className="font-mono font-bold text-stone-600 dark:text-stone-300">
            {goal.targetValue.toLocaleString()} {goal.unit}
          </span>{" "}
          per day
        </p>
      </div>
      <button
        onClick={() => onDelete(goal.id)}
        disabled={isDeleting}
        className="p-1.5 rounded-lg text-stone-300 dark:text-stone-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
      >
        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}

export default function NutritionGoalsPage() {
  const { user, loading } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedKey, setSelectedKey] = useState(NUTRIENT_OPTIONS[0].key);
  const [targetType, setTargetType] = useState<"min" | "max">("max");
  const [targetValue, setTargetValue] = useState<string>("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: goals = [], isLoading } = trpc.goals.getGoals.useQuery(undefined, {
    enabled: !!user,
  });

  const setGoalMutation = trpc.goals.setGoal.useMutation({
    onSuccess: (data) => {
      toast.success(data.action === "created" ? "Goal added" : "Goal updated");
      utils.goals.getGoals.invalidate();
      setShowAddForm(false);
      setTargetValue("");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteGoalMutation = trpc.goals.deleteGoal.useMutation({
    onSuccess: () => {
      toast.success("Goal removed");
      utils.goals.getGoals.invalidate();
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setDeletingId(null),
  });

  const clearGoalsMutation = trpc.goals.clearGoals.useMutation({
    onSuccess: () => {
      toast.success("All goals cleared");
      utils.goals.getGoals.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAddGoal = () => {
    const val = parseInt(targetValue, 10);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid target value");
      return;
    }
    const nutrient = NUTRIENT_OPTIONS.find((n) => n.key === selectedKey)!;
    setGoalMutation.mutate({
      nutrientKey: selectedKey,
      nutrientLabel: nutrient.label,
      targetType,
      targetValue: val,
      unit: nutrient.unit,
    });
  };

  const handleApplyPreset = (preset: (typeof PRESETS)[number]) => {
    Promise.all(
      preset.goals.map((g) =>
        setGoalMutation.mutateAsync({
          nutrientKey: g.key,
          nutrientLabel: g.label,
          targetType: g.type,
          targetValue: g.value,
          unit: g.unit,
        })
      )
    )
      .then(() => {
        toast.success(`"${preset.name}" preset applied`);
        utils.goals.getGoals.invalidate();
      })
      .catch((err) => toast.error(err.message));
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteGoalMutation.mutate({ goalId: id });
  };

  if (loading) {
    return (
      <div className="ec-page-bg min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-stone-300" />
      </div>
    );
  }

  // No sign-in required — all users can access goals

  const selectedNutrient = NUTRIENT_OPTIONS.find((n) => n.key === selectedKey)!;
  const goalKeys = new Set((goals as GoalRow[]).map((g) => g.nutrientKey));

  return (
    <div className="ec-page-bg pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 ec-sticky-header px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="p-1.5 rounded-xl text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-lg text-stone-800 dark:text-stone-100 leading-tight">Nutrition Goals</h1>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {(goals as GoalRow[]).length} goal{(goals as GoalRow[]).length !== 1 ? "s" : ""} set · highlighted in every scan
            </p>
          </div>
          {(goals as GoalRow[]).length > 0 && (
            <button
              onClick={() => clearGoalsMutation.mutate()}
              disabled={clearGoalsMutation.isPending}
              className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Presets */}
        <div>
          <p className="ec-section-label mb-2">Quick Presets</p>
          <div className="grid grid-cols-2 gap-2.5">
            {PRESETS.map((preset) => {
              const PresetIcon = preset.icon;
              const alreadyApplied = preset.goals.every((g) => goalKeys.has(g.key));
              return (
                <button
                  key={preset.name}
                  onClick={() => !alreadyApplied && handleApplyPreset(preset)}
                  disabled={alreadyApplied || setGoalMutation.isPending}
                  className={`ec-card p-3.5 text-left transition-all ${
                    alreadyApplied ? "opacity-60 cursor-default" : "ec-card-hover"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${preset.color}18` }}
                    >
                      <PresetIcon size={14} style={{ color: preset.color }} />
                    </div>
                    {alreadyApplied && <CheckCircle2 size={13} className="ml-auto" style={{ color: "#145A3A" }} />}
                  </div>
                  <p className="font-semibold text-stone-800 dark:text-stone-100 text-xs">{preset.name}</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 leading-relaxed">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Custom Goal */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="ec-section-label">Custom Goals</p>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: "#0B3D2E" }}
            >
              {showAddForm ? <ChevronUp size={14} /> : <Plus size={14} />}
              {showAddForm ? "Cancel" : "Add Goal"}
            </button>
          </div>

          {showAddForm && (
            <div className="ec-card p-4 mb-3 space-y-3">
              {/* Nutrient picker */}
              <div>
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1 block">Nutrient</label>
                <select
                  value={selectedKey}
                  onChange={(e) => {
                    setSelectedKey(e.target.value);
                    const n = NUTRIENT_OPTIONS.find((o) => o.key === e.target.value)!;
                    setTargetValue(String(targetType === "max" ? n.defaultMax : n.defaultMin));
                  }}
                  className="w-full text-sm border border-stone-200 dark:border-stone-600 rounded-xl px-3 py-2 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800"
                >
                  {NUTRIENT_OPTIONS.map((n) => (
                    <option key={n.key} value={n.key}>
                      {n.label} ({n.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target type */}
              <div>
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1 block">Goal Type</label>
                <div className="flex gap-2">
                  {(["max", "min"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTargetType(t);
                        setTargetValue(String(t === "max" ? selectedNutrient.defaultMax : selectedNutrient.defaultMin));
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        targetType === t
                          ? t === "max"
                            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
                            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-[#145A3A] dark:text-green-300"
                          : "bg-stone-50 dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-500 dark:text-stone-400"
                      }`}
                    >
                      {t === "max" ? "Stay Under (max)" : "Reach At Least (min)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target value */}
              <div>
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1 block">
                  Daily Target ({selectedNutrient.unit})
                </label>
                <Input
                  type="number"
                  min={0}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={`e.g. ${targetType === "max" ? selectedNutrient.defaultMax : selectedNutrient.defaultMin}`}
                  className="text-sm"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleAddGoal}
                disabled={setGoalMutation.isPending || !targetValue}
              >
                {setGoalMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-2" />
                ) : (
                  <Plus size={14} className="mr-2" />
                )}
                {goalKeys.has(selectedKey) ? "Update Goal" : "Add Goal"}
              </Button>
            </div>
          )}

          {/* Goal list */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-stone-300" />
            </div>
          ) : (goals as GoalRow[]).length === 0 ? (
            <div className="text-center py-10">
              <Target size={32} className="text-stone-300 dark:text-stone-600 mx-auto mb-3" />
              <p className="text-stone-500 dark:text-stone-400 text-sm font-semibold mb-1">No goals set yet</p>
              <p className="text-stone-400 dark:text-stone-500 text-xs">
                Add a goal above or pick a preset to start tracking nutrients in every scan.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(goals as GoalRow[]).map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onDelete={handleDelete}
                  isDeleting={deletingId === goal.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* This Week — 7-day goal consistency chart */}
        {(goals as GoalRow[]).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="ec-section-label">This Week</p>
              <span className="text-[10px] text-stone-400 font-mono">
                {new Date(Date.now() - 6 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {" – "}
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <WeeklyGoalChart goals={goals as GoalRow[]} />
          </div>
        )}

        {/* Info box */}
        <div className="rounded-2xl p-4 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60">
          <p className="text-xs font-semibold text-stone-700 dark:text-stone-200 mb-1">How goals work</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Goals appear as indicators next to the % Daily Value column in the Nutrition tab of any scanned product.
            A green check means the product helps you meet your goal; an amber or red flag means it works against it.
          </p>
        </div>
      </div>
    </div>
  );
}
