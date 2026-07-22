import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Stable opaque user identifier used in the session token. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  /** Login email. Unique — this is the account identifier for email/password auth. */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** scrypt password hash in the form `<saltHex>:<hashHex>`. */
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Cached products from barcode scans.
 * Stores product data fetched from external APIs to avoid repeated API calls.
 * Barcode is unique to prevent duplicates.
 */
export const cachedProducts = mysqlTable(
  "cachedProducts",
  {
    id: int("id").autoincrement().primaryKey(),
    barcode: varchar("barcode", { length: 128 }).notNull().unique(),
    productName: text("productName"),
    brand: varchar("brand", { length: 255 }),
    category: varchar("category", { length: 512 }),
    imageUrl: text("imageUrl"),
    ingredients: text("ingredients"),
    nutritionFacts: text("nutritionFacts"),
    healthScore: int("healthScore"),
    harmfulIngredients: text("harmfulIngredients"),
    aiAnalysis: text("aiAnalysis"),
    source: varchar("source", { length: 64 }),
    // Extended metadata from Open Food Facts
    allergens: text("allergens"),        // JSON array of allergen strings
    labels: text("labels"),              // JSON array of certification/label strings
    novaGroup: int("novaGroup"),         // 1-4 NOVA processing classification
    nutriScore: varchar("nutriScore", { length: 2 }), // A-E Nutri-Score grade
    servingSize: varchar("servingSize", { length: 64 }), // e.g. "30" or "1 cup"
    servingUnit: varchar("servingUnit", { length: 32 }), // e.g. "g", "ml"
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    barcodeIdx: index("barcode_idx").on(table.barcode),
  })
);

export type CachedProduct = typeof cachedProducts.$inferSelect;
export type InsertCachedProduct = typeof cachedProducts.$inferInsert;

/**
 * User-submitted products pending review.
 * Users can submit missing product info when a barcode has no data.
 */
export const userSubmittedProducts = mysqlTable(
  "userSubmittedProducts",
  {
    id: int("id").autoincrement().primaryKey(),
    barcode: varchar("barcode", { length: 128 }).notNull(),
    productName: text("productName"),
    brand: varchar("brand", { length: 255 }),
    category: varchar("category", { length: 512 }),
    imageUrl: text("imageUrl"),
    ingredients: text("ingredients"),
    nutritionFacts: text("nutritionFacts"),
    status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
    submittedBy: int("submittedBy").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    barcodeIdx: index("barcode_idx").on(table.barcode),
    userIdx: index("user_idx").on(table.submittedBy),
  })
);

export type UserSubmittedProduct = typeof userSubmittedProducts.$inferSelect;
export type InsertUserSubmittedProduct = typeof userSubmittedProducts.$inferInsert;

/**
 * Per-user nutrition goals.
 * Users can set personal daily targets for any nutrient key (e.g. sodium, fiber).
 * targetType 'max' means "stay under", 'min' means "reach at least".
 */
export const nutritionGoals = mysqlTable(
  "nutritionGoals",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    nutrientKey: varchar("nutrientKey", { length: 64 }).notNull(), // e.g. "sodium_100g"
    nutrientLabel: varchar("nutrientLabel", { length: 128 }).notNull(), // e.g. "Sodium"
    targetType: mysqlEnum("targetType", ["min", "max"]).notNull(), // 'min' = reach at least, 'max' = stay under
    targetValue: int("targetValue").notNull(), // daily target in the nutrient's native unit (mg, g, kcal)
    unit: varchar("unit", { length: 16 }).notNull().default("g"), // 'g', 'mg', 'kcal', '%'
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    userNutrientIdx: index("user_nutrient_idx").on(table.userId, table.nutrientKey),
  })
);

export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type InsertNutritionGoal = typeof nutritionGoals.$inferInsert;

/**
 * Server-side scan history per user.
 * Stores the last 200 scans per user with product snapshot data.
 */
export const scanHistory = mysqlTable(
  "scanHistory",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    barcode: varchar("barcode", { length: 128 }),
    productName: text("productName").notNull(),
    brand: varchar("brand", { length: 255 }),
    imageUrl: text("imageUrl"),
    healthScore: int("healthScore").notNull(),
    grade: varchar("grade", { length: 2 }).notNull(),
    category: varchar("category", { length: 512 }),
    scannedAt: timestamp("scannedAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    userScannedIdx: index("user_scanned_idx").on(table.userId, table.scannedAt),
  })
);

export type ScanHistoryRecord = typeof scanHistory.$inferSelect;
export type InsertScanHistoryRecord = typeof scanHistory.$inferInsert;

/**
 * Product favorites per user.
 * Users can save products they want to buy again or reference later.
 */
export const productFavorites = mysqlTable(
  "productFavorites",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    barcode: varchar("barcode", { length: 128 }),
    productName: text("productName").notNull(),
    brand: varchar("brand", { length: 255 }),
    imageUrl: text("imageUrl"),
    healthScore: int("healthScore").notNull(),
    grade: varchar("grade", { length: 2 }).notNull(),
    category: varchar("category", { length: 512 }),
    savedAt: timestamp("savedAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    userBarcodeIdx: index("user_barcode_idx").on(table.userId, table.barcode),
  })
);

export type ProductFavorite = typeof productFavorites.$inferSelect;
export type InsertProductFavorite = typeof productFavorites.$inferInsert;

/**
 * Avoided ingredients per user.
 * Users can flag specific ingredients they want to avoid (e.g. peanuts, gluten, MSG).
 */
export const avoidedIngredients = mysqlTable(
  "avoidedIngredients",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    ingredient: varchar("ingredient", { length: 255 }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    userIngredientIdx: index("user_ingredient_idx").on(table.userId, table.ingredient),
  })
);

export type AvoidedIngredient = typeof avoidedIngredients.$inferSelect;
export type InsertAvoidedIngredient = typeof avoidedIngredients.$inferInsert;

/**
 * Pending product image suggestions submitted by users.
 * Images are stored in S3 and require admin approval before being applied
 * to the cachedProducts table.
 */
export const pendingProductImages = mysqlTable(
  "pendingProductImages",
  {
    id: int("id").autoincrement().primaryKey(),
    barcode: varchar("barcode", { length: 128 }).notNull(),
    userId: int("userId").notNull(),
    imageUrl: text("imageUrl").notNull(),    // S3 URL of the uploaded image
    imageKey: text("imageKey").notNull(),    // S3 key for deletion if rejected
    status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
    productName: text("productName"),        // snapshot for admin review context
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
    reviewedAt: timestamp("reviewedAt"),
  },
  (table) => ({
    barcodeIdx: index("barcode_idx").on(table.barcode),
    userIdx: index("user_idx").on(table.userId),
    statusIdx: index("status_idx").on(table.status),
  })
);

export type PendingProductImage = typeof pendingProductImages.$inferSelect;
export type InsertPendingProductImage = typeof pendingProductImages.$inferInsert;
/**
 * Cache for AI-powered ingredient scan results from the Calorie Scanner.
 * Stores OCR + ingredient flag analysis keyed by image URL hash to avoid
 * repeated LLM calls for the same image.
 */
export const ingredientScanCache = mysqlTable(
  "ingredientScanCache",
  {
    id: int("id").autoincrement().primaryKey(),
    imageUrlHash: varchar("imageUrlHash", { length: 64 }).notNull().unique(), // SHA-256 of imageUrl
    imageUrl: text("imageUrl").notNull(),
    ingredientsDetected: int("ingredientsDetected").default(0).notNull(), // 0 = false, 1 = true
    rawIngredientText: text("rawIngredientText"),   // OCR-extracted ingredient text
    flaggedIngredients: text("flaggedIngredients"), // JSON: [{name, category, severity, reason}]
    ingredientQuality: mysqlEnum("ingredientQuality", ["good", "moderate", "poor", "unknown"]).default("unknown").notNull(),
    imageQualityOk: int("imageQualityOk").default(1).notNull(), // 0 = poor quality, 1 = ok
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    hashIdx: index("hash_idx").on(table.imageUrlHash),
  })
);
export type IngredientScanCache = typeof ingredientScanCache.$inferSelect;
export type InsertIngredientScanCache = typeof ingredientScanCache.$inferInsert;

/**
 * Fitness exercise logs per user.
 * Stores cardio, weightlifting, AI-described, and manual calorie entries.
 */
export const fitnessLogs = mysqlTable(
  "fitnessLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    date: varchar("date", { length: 10 }).notNull(), // ISO date YYYY-MM-DD
    type: mysqlEnum("type", ["cardio", "weightlifting", "described", "manual"]).notNull(),
    name: varchar("name", { length: 255 }).notNull(), // e.g. "Running", "Bench Press"
    durationMin: int("durationMin"),          // minutes (cardio / described)
    caloriesBurned: int("caloriesBurned").notNull().default(0),
    // Cardio fields
    distanceKm: int("distanceKm"),            // stored as meters to avoid float
    // Weightlifting fields
    sets: int("sets"),
    reps: int("reps"),
    weightKg: int("weightKg"),               // stored as grams to avoid float
    // Described / manual
    notes: text("notes"),
    intensity: mysqlEnum("intensity", ["low", "moderate", "high"]),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    userDateIdx: index("user_date_idx").on(table.userId, table.date),
  })
);

export type FitnessLog = typeof fitnessLogs.$inferSelect;
export type InsertFitnessLog = typeof fitnessLogs.$inferInsert;

/**
 * Daily step counts per user.
 * Supports manual entry and iOS Health / pedometer sync.
 */
export const stepLogs = mysqlTable(
  "stepLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    date: varchar("date", { length: 10 }).notNull(), // ISO date YYYY-MM-DD
    steps: int("steps").notNull().default(0),
    distanceM: int("distanceM"),             // meters
    caloriesBurned: int("caloriesBurned"),
    source: mysqlEnum("source", ["manual", "healthkit", "pedometer"]).default("manual").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    userDateIdx: index("user_date_idx").on(table.userId, table.date),
    uniqueUserDate: index("unique_user_date").on(table.userId, table.date),
  })
);

export type StepLog = typeof stepLogs.$inferSelect;
export type InsertStepLog = typeof stepLogs.$inferInsert;

/**
 * Body weight log entries per user.
 * Supports kg and lbs (stored as kg for consistency).
 */
export const bodyWeightLogs = mysqlTable(
  "bodyWeightLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    date: varchar("date", { length: 10 }).notNull(), // ISO date YYYY-MM-DD
    weightKg: int("weightKg").notNull(),              // stored as grams (weightKg * 1000) for precision — actually store as decimal via text
    weightRaw: varchar("weightRaw", { length: 16 }).notNull(), // e.g. "72.5" stored as string for precision
    unit: mysqlEnum("unit", ["kg", "lbs"]).default("kg").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("bw_user_idx").on(table.userId),
    userDateIdx: index("bw_user_date_idx").on(table.userId, table.date),
  })
);
export type BodyWeightLog = typeof bodyWeightLogs.$inferSelect;
export type InsertBodyWeightLog = typeof bodyWeightLogs.$inferInsert;

/**
 * AI-generated workout programs.
 * Stores the full multi-week program generated by the AI for a user.
 * The program JSON contains weeks, days, exercises with sets/reps/rest.
 */
export const workoutPrograms = mysqlTable(
  "workoutPrograms",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    goal: varchar("goal", { length: 64 }).notNull(),         // e.g. "muscle_gain", "weight_loss"
    fitnessLevel: varchar("fitnessLevel", { length: 32 }).notNull(), // beginner/intermediate/advanced
    daysPerWeek: int("daysPerWeek").notNull().default(3),
    totalWeeks: int("totalWeeks").notNull().default(8),
    currentWeek: int("currentWeek").notNull().default(1),
    programJson: text("programJson").notNull(),               // Full program JSON
    isActive: int("isActive").notNull().default(1),           // 1 = active, 0 = archived
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("wp_user_idx").on(table.userId),
    userActiveIdx: index("wp_user_active_idx").on(table.userId, table.isActive),
  })
);

export type WorkoutProgram = typeof workoutPrograms.$inferSelect;
export type InsertWorkoutProgram = typeof workoutPrograms.$inferInsert;

/**
 * Completed workout sessions linked to a program.
 * Tracks which exercises were done, actual sets/reps/weight logged.
 */
export const workoutSessions = mysqlTable(
  "workoutSessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    programId: int("programId"),                              // null for standalone sessions
    date: varchar("date", { length: 10 }).notNull(),          // YYYY-MM-DD
    weekNumber: int("weekNumber"),
    dayNumber: int("dayNumber"),
    workoutName: varchar("workoutName", { length: 255 }).notNull(),
    exercisesJson: text("exercisesJson").notNull(),           // JSON: [{name, sets, reps, weight, completed}]
    durationMin: int("durationMin"),
    caloriesBurned: int("caloriesBurned"),
    notes: text("notes"),
    rating: int("rating"),                                    // 1-5 user rating
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("ws_user_idx").on(table.userId),
    userDateIdx: index("ws_user_date_idx").on(table.userId, table.date),
    programIdx: index("ws_program_idx").on(table.programId),
  })
);

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = typeof workoutSessions.$inferInsert;
