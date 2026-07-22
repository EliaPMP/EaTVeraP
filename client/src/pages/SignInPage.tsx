/**
 * SignInPage — email + password sign in / sign up.
 * Talks to the app's own backend (trpc.auth.login / trpc.auth.register).
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Leaf, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Redirect to home once authenticated.
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const onAuthed = async () => {
    await utils.auth.me.invalidate();
    navigate("/", { replace: true });
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: onAuthed,
    onError: err => setError(err.message),
  });
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: onAuthed,
    onError: err => setError(err.message),
  });

  const submitting = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "signup") {
      registerMutation.mutate({ email, password, name: name || undefined });
    } else {
      loginMutation.mutate({ email, password });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-[#2e9e2e]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        {/* Logo */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: isDark
              ? "linear-gradient(135deg, #1a5c1a, #2e9e2e)"
              : "linear-gradient(135deg, #2e9e2e, #4db84d)",
            boxShadow: isDark
              ? "0 8px 32px rgba(46, 158, 46, 0.3)"
              : "0 8px 32px rgba(46, 158, 46, 0.25)",
          }}
        >
          <Leaf size={28} className="text-white" />
        </div>

        <h1
          className="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-2"
          style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.03em" }}
        >
          EatVera
        </h1>
        <p className="text-stone-400 dark:text-stone-500 text-sm mb-12">
          Know what you eat
        </p>

        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100 text-center mb-2">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-stone-400 dark:text-stone-500 text-sm text-center mb-8">
            Sign in to save your scans, set goals, and track your nutrition journey
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                className="w-full px-4 py-3.5 rounded-2xl text-sm bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 outline-none focus:border-[#2e9e2e]"
              />
            )}
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-4 py-3.5 rounded-2xl text-sm bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 outline-none focus:border-[#2e9e2e]"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full px-4 py-3.5 rounded-2xl text-sm bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 outline-none focus:border-[#2e9e2e]"
            />

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
              style={{
                background: isDark
                  ? "linear-gradient(135deg, #1a5c1a, #2e9e2e)"
                  : "linear-gradient(135deg, #1f7a1f, #2e9e2e)",
                boxShadow: "0 4px 16px rgba(46, 158, 46, 0.3)",
              }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode(mode === "signup" ? "signin" : "signup");
            }}
            className="w-full text-center text-sm text-stone-500 dark:text-stone-400 mt-5"
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </div>
      </div>

      <div className="px-6 pb-8 text-center">
        <p className="text-[11px] text-stone-400 dark:text-stone-600 leading-relaxed">
          By continuing, you agree to EatVera's Terms of Service and Privacy Policy.
          Your data is encrypted and never sold.
        </p>
      </div>
    </div>
  );
}
