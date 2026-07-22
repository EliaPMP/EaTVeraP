import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Update mutable fields on an existing user, matched by openId. New accounts are
 * created via `createUser`; this is a no-op if the user does not exist.
 */
export async function upsertUser(
  user: Partial<InsertUser> & { openId: string }
): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for update");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return;
  }

  try {
    const updateSet: Partial<InsertUser> = {};
    if (user.name !== undefined) updateSet.name = user.name;
    if (user.email !== undefined) updateSet.email = user.email;
    if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod;
    if (user.passwordHash !== undefined) updateSet.passwordHash = user.passwordHash;
    if (user.role !== undefined) updateSet.role = user.role;
    updateSet.lastSignedIn = user.lastSignedIn ?? new Date();

    await db.update(users).set(updateSet).where(eq(users.openId, user.openId));
  } catch (error) {
    console.error("[Database] Failed to update user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Insert a brand-new account and return the created row. The caller is
 * responsible for ensuring the email is not already taken.
 */
export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(users).values(user);
  return getUserByOpenId(user.openId);
}

// TODO: add feature queries here as your schema grows.
