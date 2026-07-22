import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from "./authRouter";
import { calorieRouter } from "./calorieRouter";
import { mealSuggestionsRouter } from "./mealSuggestionsRouter";
import { barcodeRouter } from "./barcodeRouter";
import { goalsRouter } from "./goalsRouter";
import { userFeaturesRouter } from "./userFeaturesRouter";
import { productImageRouter } from "./productImageRouter";
import { priceRouter } from "./priceRouter";
import { fitnessRouter } from "./fitnessRouter";
import { workoutRouter } from "./workoutRouter";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,
  calorie: calorieRouter,
  mealSuggestions: mealSuggestionsRouter,
  barcode: barcodeRouter,
  goals: goalsRouter,
  userFeatures: userFeaturesRouter,
  productImage: productImageRouter,
  price: priceRouter,
  fitness: fitnessRouter,
  workout: workoutRouter,
});

export type AppRouter = typeof appRouter;
