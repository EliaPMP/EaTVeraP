/**
 * SettingsPage — User profile, body stats, Retake Quiz, notifications, account & preferences
 * Accessible from the profile icon on the Home header
 * Design: EatVera dark forest green luxury aesthetic — full dark mode support
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Leaf,
  Target,
  Dumbbell,
  Flame,
  Scale,
  RefreshCw,
  LogOut,
  Moon,
  Sun,
  Bell,
  BellOff,
  BellRing,
  Shield,
  Heart,
  Activity,
  Zap,
  TrendingUp,
  Check,
  Info,
  Settings,
  Clock,
  Calendar,
  X,
} from "lucide-react";
import { getBodyProfile } from "@/pages/OnboardingPage";
import { calculatePersonalizedGoals } from "@/lib/calorieCalculator";
import { isGoalsPersonalized } from "@/hooks/useCalorieGoals";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const ARCHETYPE_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  lose_fat:    { label: "Lose Fat",              color: "#f97316", bg: "rgba(249,115,22,0.15)",  icon: Flame },
  build_muscle:{ label: "Build Muscle",          color: "#3b82f6", bg: "rgba(59,130,246,0.15)",  icon: Dumbbell },
  maintain:    { label: "Maintain & Optimize",   color: "#10b981", bg: "rgba(16,185,129,0.15)",  icon: Target },
  recomp:      { label: "Body Recomp",           color: "#8b5cf6", bg: "rgba(139,92,246,0.15)",  icon: Activity },
  performance: { label: "Athletic Performance",  color: "#eab308", bg: "rgba(234,179,8,0.15)",   icon: Zap },
};

const BUILD_LABELS: Record<string, string> = {
  slim: "Slim", average: "Average", athletic: "Athletic",
  lean_athletic: "Lean & Athletic",
  muscular: "Muscular", skinny_fat: "Skinny Fat",
  overweight: "Overweight", bigger_build: "Bigger Build",
};

const GENDER_LABELS: Record<string, string> = {
  female: "Female", male: "Male", nonbinary: "Non-Binary", prefer_not: "Prefer not to say",
};

const NOTIF_KEY = "eatvera-notifications";
interface NotifSettings {
  mealReminder: boolean;
  mealTime: string; // "HH:MM"
  weeklyCheckIn: boolean;
  weeklyDay: string; // "monday" etc.
  permissionGranted: boolean;
}
const DEFAULT_NOTIF: NotifSettings = {
  mealReminder: false,
  mealTime: "12:00",
  weeklyCheckIn: false,
  weeklyDay: "monday",
  permissionGranted: false,
};
function loadNotifSettings(): NotifSettings {
  try {
    const s = localStorage.getItem(NOTIF_KEY);
    return s ? { ...DEFAULT_NOTIF, ...JSON.parse(s) } : DEFAULT_NOTIF;
  } catch { return DEFAULT_NOTIF; }
}
function saveNotifSettings(s: NotifSettings) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(s));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-mono tracking-[0.15em] uppercase px-4 mb-2 mt-6 text-stone-400 dark:text-stone-500">
      {title}
    </p>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  value,
  onClick,
  accent,
  destructive,
  badge,
  rightEl,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
  accent?: string;
  destructive?: boolean;
  badge?: string;
  rightEl?: React.ReactNode;
}) {
  const color = destructive ? "#ef4444" : accent || "#0B3D2E";
  return (
    <button
      onClick={onClick}
      disabled={!onClick && !rightEl}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 transition-all active:bg-stone-100 dark:active:bg-stone-800/60"
      style={{ cursor: (onClick || rightEl) ? "pointer" : "default" }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: destructive ? "rgba(239,68,68,0.1)" : `${color}18`,
          border: `1px solid ${destructive ? "rgba(239,68,68,0.2)" : `${color}28`}`,
        }}
      >
        <Icon size={16} style={{ color: destructive ? "#ef4444" : color }} strokeWidth={1.8} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={`text-sm font-medium ${destructive ? "text-red-500" : "text-stone-800 dark:text-stone-100"}`}>
          {label}
        </p>
        {value && (
          <p className="text-xs mt-0.5 text-stone-400 dark:text-stone-500 truncate">{value}</p>
        )}
      </div>
      {badge && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
          {badge}
        </span>
      )}
      {rightEl}
      {onClick && !destructive && !rightEl && (
        <ChevronRight size={15} className="text-stone-300 dark:text-stone-600 flex-shrink-0" />
      )}
    </button>
  );
}

function Divider() {
  return <div className="mx-4 h-px bg-stone-100 dark:bg-stone-800" />;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 rounded-2xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm">
      {children}
    </div>
  );
}

// Toggle switch component
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className="flex-shrink-0 relative w-11 h-6 rounded-full transition-all duration-200"
      style={{
        background: checked ? "linear-gradient(135deg, #0B3D2E, #1A7048)" : undefined,
      }}
      aria-checked={checked}
      role="switch"
    >
      <span className={`absolute inset-0 rounded-full transition-colors ${checked ? "" : "bg-stone-200 dark:bg-stone-700"}`} />
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: checked ? "calc(100% - 22px)" : "2px" }}
      />
    </button>
  );
}

// Notification Panel
function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<NotifSettings>(() => loadNotifSettings());
  const [permStatus, setPermStatus] = useState<string>(() =>
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  async function requestPermission() {
    if (typeof Notification === "undefined") {
      toast.error("Notifications not supported in this browser");
      return;
    }
    const result = await Notification.requestPermission();
    setPermStatus(result);
    if (result === "granted") {
      const updated = { ...settings, permissionGranted: true };
      setSettings(updated);
      saveNotifSettings(updated);
      toast.success("Notifications enabled!");
      // Show a test notification
      new Notification("EatVera", {
        body: "You'll now receive meal reminders and weekly check-ins.",
        icon: "/favicon.ico",
      });
    } else {
      toast.error("Permission denied — enable notifications in your browser settings");
    }
  }

  function update(patch: Partial<NotifSettings>) {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    saveNotifSettings(updated);
  }

  const canNotify = permStatus === "granted";

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md bg-white dark:bg-stone-950 rounded-t-3xl pb-safe overflow-hidden"
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-stone-200 dark:bg-stone-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(11,61,46,0.1)" }}>
              <Bell size={15} style={{ color: "#0B3D2E" }} />
            </div>
            <h3 className="font-bold text-base text-stone-800 dark:text-stone-100"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Notifications
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-stone-100 dark:bg-stone-800">
            <X size={15} className="text-stone-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 pb-8">
          {/* Permission banner */}
          {!canNotify && (
            <button
              onClick={requestPermission}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #0B3D2E, #145A3A)",
                boxShadow: "0 4px 16px rgba(11,61,46,0.25)",
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <BellRing size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Enable Notifications</p>
                <p className="text-white/60 text-xs mt-0.5">
                  {permStatus === "denied"
                    ? "Blocked — update in browser settings"
                    : "Tap to allow meal reminders & check-ins"}
                </p>
              </div>
              {permStatus !== "denied" && (
                <ChevronRight size={16} className="text-white/60 flex-shrink-0" />
              )}
            </button>
          )}

          {canNotify && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
              <Check size={13} className="text-emerald-600" strokeWidth={2.5} />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">Notifications are enabled</p>
            </div>
          )}

          {/* Meal reminder */}
          <div className="rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(11,61,46,0.1)", border: "1px solid rgba(11,61,46,0.15)" }}>
                <Clock size={15} style={{ color: "#0B3D2E" }} strokeWidth={1.8} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-800 dark:text-stone-100">Daily Meal Reminder</p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Remind me to log my meals</p>
              </div>
              <Toggle
                checked={settings.mealReminder}
                onChange={(v) => update({ mealReminder: v })}
              />
            </div>
            {settings.mealReminder && (
              <div className="px-4 pb-3.5 border-t border-stone-100 dark:border-stone-800 pt-3">
                <p className="text-[10px] font-mono tracking-wider uppercase text-stone-400 dark:text-stone-500 mb-2">Reminder Time</p>
                <div className="flex gap-2">
                  {["08:00", "12:00", "18:00", "20:00"].map((t) => (
                    <button
                      key={t}
                      onClick={() => update({ mealTime: t })}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: settings.mealTime === t
                          ? "linear-gradient(135deg, #0B3D2E, #1A7048)"
                          : "rgba(0,0,0,0.04)",
                        color: settings.mealTime === t ? "white" : undefined,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="time"
                    value={settings.mealTime}
                    onChange={(e) => update({ mealTime: e.target.value })}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200"
                  />
                  <span className="text-xs text-stone-400">custom</span>
                </div>
              </div>
            )}
          </div>

          {/* Weekly check-in */}
          <div className="rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(11,61,46,0.1)", border: "1px solid rgba(11,61,46,0.15)" }}>
                <Calendar size={15} style={{ color: "#0B3D2E" }} strokeWidth={1.8} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-800 dark:text-stone-100">Weekly Progress Check-In</p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Weekly summary of your food quality</p>
              </div>
              <Toggle
                checked={settings.weeklyCheckIn}
                onChange={(v) => update({ weeklyCheckIn: v })}
              />
            </div>
            {settings.weeklyCheckIn && (
              <div className="px-4 pb-3.5 border-t border-stone-100 dark:border-stone-800 pt-3">
                <p className="text-[10px] font-mono tracking-wider uppercase text-stone-400 dark:text-stone-500 mb-2">Check-In Day</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <button
                      key={d}
                      onClick={() => update({ weeklyDay: d.toLowerCase() })}
                      className="py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: settings.weeklyDay === d.toLowerCase()
                          ? "linear-gradient(135deg, #0B3D2E, #1A7048)"
                          : "rgba(0,0,0,0.04)",
                        color: settings.weeklyDay === d.toLowerCase() ? "white" : undefined,
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={() => {
              saveNotifSettings(settings);
              toast.success("Notification preferences saved");
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #0B3D2E, #1A7048)", boxShadow: "0 4px 16px rgba(11,61,46,0.25)" }}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const profile = getBodyProfile();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Signed out successfully");
      navigate("/");
    },
  });

  const goals = profile ? calculatePersonalizedGoals(profile) : null;
  const archetype = profile ? (ARCHETYPE_META[profile.archetype] || ARCHETYPE_META["maintain"]) : null;
  const ArchetypeIcon = archetype?.icon || Target;
  const isPersonalized = isGoalsPersonalized();

  // Load notification settings for badge display
  const [notifSettings] = useState(() => loadNotifSettings());
  const notifActive = notifSettings.mealReminder || notifSettings.weeklyCheckIn;

  return (
    <>
      {showNotifPanel && <NotificationsPanel onClose={() => setShowNotifPanel(false)} />}

      <div className="min-h-screen pb-28 bg-stone-50 dark:bg-stone-950">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 pt-12 pb-4 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-xl border-b border-stone-100 dark:border-stone-900">
          <button
            onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) { window.history.back(); } else { navigate('/more'); } }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            aria-label="Go back"
          >
            <ChevronLeft size={18} className="text-stone-700 dark:text-stone-300" />
          </button>
          <h1
            className="font-bold text-xl flex-1 text-stone-800 dark:text-stone-100"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}
          >
            Settings
          </h1>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0B3D2E, #145A3A)", boxShadow: "0 2px 8px rgba(11,61,46,0.3)" }}
          >
            <Settings size={16} className="text-white" strokeWidth={1.8} />
          </div>
        </div>

        {/* Profile Hero Card */}
        <div className="px-4 mt-5 mb-2">
          <div
            className="relative overflow-hidden rounded-3xl p-5"
            style={{
              background: "linear-gradient(145deg, #0B3D2E 0%, #145A3A 60%, #1A7048 100%)",
              boxShadow: "0 8px 32px rgba(11,61,46,0.3)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)", transform: "translate(20%, -20%)" }}
            />

            <div className="relative flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              >
                {user?.name ? (
                  <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User size={28} className="text-white/70" strokeWidth={1.5} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-lg leading-tight truncate"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {user?.name || "Your Profile"}
                </p>
                {isAuthenticated && user?.name && (
                  <p className="text-white/50 text-xs mt-0.5 truncate">{user.name}</p>
                )}
                {archetype && (
                  <div
                    className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-xl"
                    style={{ background: archetype.bg, border: `1px solid ${archetype.color}40` }}
                  >
                    <ArchetypeIcon size={11} style={{ color: archetype.color }} strokeWidth={2} />
                    <span className="text-[11px] font-semibold" style={{ color: archetype.color }}>
                      {archetype.label}
                    </span>
                  </div>
                )}
                {!profile && (
                  <div
                    className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                  >
                    <Info size={11} className="text-white/50" />
                    <span className="text-[11px] text-white/50">No profile yet — take the quiz</span>
                  </div>
                )}
              </div>
            </div>

            {goals && profile && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  { label: "Calories", value: goals.dailyCalories.toLocaleString(), unit: "kcal" },
                  { label: "Protein",  value: String(goals.dailyProtein),  unit: "g" },
                  { label: "Carbs",    value: String(goals.dailyCarbs),    unit: "g" },
                  { label: "Fat",      value: String(goals.dailyFat),      unit: "g" },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="rounded-xl p-2 text-center"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <p className="text-white font-bold text-sm leading-none" style={{ fontFamily: "'DM Mono', monospace" }}>{value}</p>
                    <p className="text-white/40 text-[9px] mt-0.5 font-mono">{unit}</p>
                    <p className="text-white/55 text-[9px] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Body Profile */}
        {profile && (
          <>
            <SectionHeader title="Your Body Profile" />
            <Card>
              <div className="p-4 grid grid-cols-2 gap-3">
                {[
                  { label: "Height", value: `${profile.heightFeet}'${profile.heightInches}"` },
                  { label: "Weight", value: `${profile.currentWeightLbs} lbs` },
                  { label: "Age",    value: profile.age ? `${profile.age} yrs` : "—" },
                  { label: "Gender", value: GENDER_LABELS[profile.gender] || "—" },
                  { label: "Current Build", value: BUILD_LABELS[profile.currentBuild] || profile.currentBuild },
                  { label: "Goal Build",    value: BUILD_LABELS[profile.desiredBuild] || profile.desiredBuild },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-3 bg-stone-50 dark:bg-stone-800/60">
                    <p className="text-[10px] font-mono tracking-wider uppercase mb-1 text-stone-400 dark:text-stone-500">{label}</p>
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{value}</p>
                  </div>
                ))}
              </div>
              {goals && (
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                    <Check size={13} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      BMI {goals.bmi} — {goals.bmiCategory}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Personalization */}
        <SectionHeader title="Personalization" />
        <Card>
          <SettingsRow
            icon={RefreshCw}
            label="Retake Quiz"
            value={profile ? "Update your goals & archetype" : "Set up your personalized plan"}
            onClick={() => navigate("/onboarding")}
            accent="#0B3D2E"
            badge={isPersonalized ? "Synced" : undefined}
          />
          {profile && (
            <>
              <Divider />
              <SettingsRow
                icon={TrendingUp}
                label="Nutrition Goals"
                value="Customize daily nutrient targets"
                onClick={() => navigate("/goals")}
                accent="#0B3D2E"
              />
              <Divider />
              <SettingsRow
                icon={Heart}
                label="Diet Filters"
                value="Seed oils, carnivore, gluten-free & more"
                onClick={() => navigate("/filters")}
                accent="#0B3D2E"
              />
            </>
          )}
        </Card>

        {/* App Preferences */}
        <SectionHeader title="App Preferences" />
        <Card>
          <SettingsRow
            icon={theme === "dark" ? Moon : Sun}
            label={theme === "dark" ? "Dark Mode" : "Light Mode"}
            value="Tap to toggle appearance"
            onClick={toggleTheme}
            accent="#0B3D2E"
          />
          <Divider />
          <SettingsRow
            icon={notifActive ? BellRing : Bell}
            label="Notifications"
            value={notifActive ? "Reminders active" : "Meal reminders & weekly check-ins"}
            onClick={() => setShowNotifPanel(true)}
            accent="#0B3D2E"
            badge={notifActive ? "On" : undefined}
          />
        </Card>

        {/* Account */}
        <SectionHeader title="Account" />
        <Card>
          {isAuthenticated ? (
            <>
              <SettingsRow
                icon={Shield}
                label="Account"
                value={user?.name || "Signed in"}
                accent="#0B3D2E"
              />
              <Divider />
              <SettingsRow
                icon={LogOut}
                label="Sign Out"
                onClick={() => logoutMutation.mutate()}
                destructive
              />
            </>
          ) : (
            <SettingsRow
              icon={User}
              label="Sign In"
              value="Sync your data across devices"
              onClick={() => navigate("/signin")}
              accent="#0B3D2E"
            />
          )}
        </Card>

        {/* App info */}
        <div className="px-4 mt-8 mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0B3D2E, #145A3A)" }}>
              <Leaf size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-300"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              EatVera
            </span>
          </div>
          <p className="text-[11px] text-stone-400 dark:text-stone-600">Know what you eat · Version 2.0</p>
          <p className="text-[10px] mt-1 text-stone-300 dark:text-stone-700">
            EatVera provides general wellness guidance and is not medical advice.
          </p>
        </div>
      </div>
    </>
  );
}
