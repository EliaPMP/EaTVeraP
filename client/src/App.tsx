/**
 * EatVera App — v4 Full Feature Navigation
 * Light, organic, health-forward aesthetic
 * 5 main tabs + "More" drawer for additional guides
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DietFiltersProvider } from "./contexts/DietFiltersContext";
import Home from "./pages/Home";
import ScanPage from "./pages/ScanPage";
import LearnPage from "./pages/LearnPage";
import MeatGuidePage from "./pages/MeatGuidePage";
import FruitGuidePage from "./pages/FruitGuidePage";
import VegetableGuidePage from "./pages/VegetableGuidePage";
import StoreGuidePage from "./pages/StoreGuidePage";
import ScanHistoryPage from "./pages/ScanHistoryPage";
import CompareProductsPage from "./pages/CompareProductsPage";
import SnacksGuidePage from "./pages/SnacksGuidePage";
import DairyGuidePage from "./pages/DairyGuidePage";
import CondimentsGuidePage from "./pages/CondimentsGuidePage";
import DietFiltersPage from "./pages/DietFiltersPage";
import GrainsGuidePage from "./pages/GrainsGuidePage";
import BeveragesGuidePage from "./pages/BeveragesGuidePage";
import FrozenGuidePage from "./pages/FrozenGuidePage";
import SupplementGuidePage from "./pages/SupplementGuidePage";
import BabyKidsGuidePage from "./pages/BabyKidsGuidePage";
import IceCreamGuidePage from "./pages/IceCreamGuidePage";
import CalorieScannerPage from "./pages/CalorieScannerPage";
import AlcoholGuidePage from "./pages/AlcoholGuidePage";
import WaterGuidePage from "./pages/WaterGuidePage";
import AdminPage from "./pages/AdminPage";
import NutritionGoalsPage from "./pages/NutritionGoalsPage";
import PetCarePage from "./pages/PetCarePage";
import ExplorePage from "./pages/ExplorePage";
import FitnessPage from "./pages/FitnessPage";
import TrackPage from "./pages/TrackPage";
import WeightHistoryPage from "./pages/WeightHistoryPage";
import FavoritesPage from "./pages/FavoritesPage";
import SettingsPage from "./pages/SettingsPage";
import MorePage from "./pages/MorePage";
import AvoidedIngredientsPage from "./pages/AvoidedIngredientsPage";
import SavedSwapsPage from "./pages/SavedSwapsPage";
import NaturalRecoveryPage from "./pages/NaturalRecoveryPage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import BodyBenefitsPage from "./pages/BodyBenefitsPage";
import SignInPage from "./pages/SignInPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import {
  Home as HomeIcon,
  ScanLine,
  MoreHorizontal,
  X,
  Store,
  History,
  BookOpen,
  ArrowLeftRight,
  Settings,
  Flame,
  Compass,
  ShieldAlert,
  Target,
  Heart,
  Bookmark,
  Dumbbell,
  BarChart3,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "./_core/hooks/useAuth";
import { useSwipeBack } from "./hooks/useSwipeBack";
import SplashScreen, { shouldShowSplash } from "./components/SplashScreen";
import { useTheme } from "./contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { useCalorieStreak } from "./hooks/useCalorieStreak";
import OnboardingPage, { hasCompletedOnboarding } from "./pages/OnboardingPage";

// More drawer replaced by /more full-screen page

// Bottom-nav tab paths — no slide transition between these
const TAB_PATHS = new Set(["/", "/more", "/track", "/explore"]);

/** Wraps the current route in a slide-in animation, skipping tab switches */
function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [key, setKey] = useState(location);
  const [animating, setAnimating] = useState(false);
  const prevPathRef = useRef(location);

  useEffect(() => {
    const prev = prevPathRef.current;
    const curr = location;
    prevPathRef.current = curr;
    // Skip animation when switching between main tabs
    const prevIsTab = TAB_PATHS.has(prev);
    const currIsTab = TAB_PATHS.has(curr);
    if (prevIsTab && currIsTab) {
      setKey(curr);
      return;
    }
    setKey(curr);
    setAnimating(true);
    const t = setTimeout(() => setAnimating(false), 300);
    return () => clearTimeout(t);
  }, [location]);

  return (
    <div key={key} className={animating ? "page-enter" : ""} style={{ willChange: animating ? "transform, opacity" : "auto" }}>
      {children}
    </div>
  );
}

function BottomNav() {
  const [location, navigate] = useLocation();
  const { currentStreak } = useCalorieStreak();
  const [plusOpen, setPlusOpen] = useState(false);

  // Hide bottom nav on sign-in page
  if (location === "/signin") return null;

  const leftTabs = [
    { path: "/", label: "Home", icon: HomeIcon },
    { path: "/explore", label: "Explore", icon: Compass },
  ];

  const rightTabs = [
    { path: "/track", label: "Track", icon: BarChart3 },
    { path: "/more", label: "Guides", icon: BookOpen },
  ];

  const renderTab = ({ path, label, icon: Icon }: { path: string; label: string; icon: any }) => {
    const isActive = path === "/" ? location === "/" : location.startsWith(path);
    return (
      <Link key={path} href={path}>
        <div className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
          isActive ? "text-[#0B3D2E]" : "text-stone-500 dark:text-stone-400 hover:text-stone-600"
        }`}>
          <div className="relative">
            <div className={`p-2 rounded-full transition-all duration-200 ${isActive ? "bg-[#E8F5EC]" : ""}`}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
            </div>
          </div>
          <span className={`text-[10px] font-medium tracking-wide ${isActive ? "font-semibold" : ""}`}>{label}</span>
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Plus menu popup */}
      {plusOpen && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" onClick={() => setPlusOpen(false)} />
          <div
            className="fixed z-[70] left-1/2 bottom-24 -translate-x-1/2 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            <button
              onClick={() => { setPlusOpen(false); navigate("/scan?autoCamera=true"); }}
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", minWidth: 200 }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#E8F5EC" }}>
                <ScanLine size={18} style={{ color: "#0B3D2E" }} />
              </div>
              <span className="font-semibold text-sm text-stone-800">Scan a Barcode</span>
            </button>
            <button
              onClick={() => { setPlusOpen(false); navigate("/calories?autoCamera=true"); }}
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", minWidth: 200 }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FFF3E0" }}>
                <Flame size={18} style={{ color: "#d97706" }} />
              </div>
              <span className="font-semibold text-sm text-stone-800">Scan a Meal</span>
            </button>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-around max-w-lg mx-auto px-1 pt-2.5 pb-2.5">
          {leftTabs.map(renderTab)}

          {/* Center Plus Button */}
          <button
            onClick={() => setPlusOpen(!plusOpen)}
            className="relative -mt-6 flex items-center justify-center transition-all duration-200 active:scale-90"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#145A3A",
              boxShadow: "0 4px 20px rgba(20,90,58,0.4)",
            }}
          >
            <svg
              width="24" height="24" viewBox="0 0 24 24" fill="none"
              style={{ transform: plusOpen ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
            >
              <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>

          {rightTabs.map(renderTab)}
        </div>
      </nav>
    </>
  );
}
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/scan" component={ScanPage} />
      <Route path="/learn" component={LearnPage} />
      <Route path="/meats" component={MeatGuidePage} />
      <Route path="/fruits" component={FruitGuidePage} />
      <Route path="/vegetables" component={VegetableGuidePage} />
      <Route path="/stores" component={StoreGuidePage} />
      <Route path="/history" component={ScanHistoryPage} />
      <Route path="/compare" component={CompareProductsPage} />
      <Route path="/snacks" component={SnacksGuidePage} />
      <Route path="/dairy" component={DairyGuidePage} />
      <Route path="/condiments" component={CondimentsGuidePage} />
      <Route path="/filters" component={DietFiltersPage} />
      <Route path="/grains" component={GrainsGuidePage} />
      <Route path="/beverages" component={BeveragesGuidePage} />
      <Route path="/frozen" component={FrozenGuidePage} />
      <Route path="/supplements" component={SupplementGuidePage} />
      <Route path="/baby-kids" component={BabyKidsGuidePage} />
      <Route path="/ice-cream" component={IceCreamGuidePage} />
      <Route path="/calories" component={CalorieScannerPage} />
      <Route path="/alcohol" component={AlcoholGuidePage} />
      <Route path="/water" component={WaterGuidePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/goals" component={NutritionGoalsPage} />
      <Route path="/petcare" component={PetCarePage} />
      <Route path="/explore" component={ExplorePage} />
      <Route path="/fitness" component={FitnessPage} />
      <Route path="/track" component={TrackPage} />
      <Route path="/track/weight" component={WeightHistoryPage} />
      <Route path="/favorites" component={FavoritesPage} />
      <Route path="/avoided" component={AvoidedIngredientsPage} />
      <Route path="/signin" component={SignInPage} />
      <Route path="/product-detail" component={ProductDetailPage} />
      <Route path="/saved-swaps" component={SavedSwapsPage} />
      <Route path="/natural-recovery" component={NaturalRecoveryPage} />
      <Route path="/recipes" component={RecipesPage} />
      <Route path="/recipes/:id" component={RecipeDetailPage} />
      <Route path="/body-benefits" component={BodyBenefitsPage} />
      <Route path="/body-benefits/:id" component={BodyBenefitsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/more" component={MorePage} />
      <Route path="/onboarding" component={() => <OnboardingPage isEditing={true} />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(() => shouldShowSplash());
  const [showOnboarding, setShowOnboarding] = useState(() => !hasCompletedOnboarding());
  useSwipeBack();

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <DietFiltersProvider>
          <TooltipProvider>
            <Toaster
              toastOptions={{
                style: {
                  background: "white",
                  border: "1px solid #e7e5e4",
                  color: "#292524",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                },
              }}
            />
            {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
            {!showSplash && showOnboarding && <OnboardingPage onComplete={() => setShowOnboarding(false)} />}
            <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              <PageTransition>
                <Router />
              </PageTransition>
              <BottomNav />
            </div>
          </TooltipProvider>
        </DietFiltersProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
