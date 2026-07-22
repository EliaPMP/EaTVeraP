export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Anthropic (Claude) API — powers all AI food/photo analysis.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  // Overridable so the model can be tuned (e.g. a cheaper model) without code changes.
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8",
};
