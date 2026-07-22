import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { nanoid } from "nanoid";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { publicProcedure, router } from "./_core/trpc";

const scryptAsync = promisify(scrypt);

const KEY_LEN = 64;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

const credentials = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
});

const registerInput = credentials.extend({
  name: z.string().trim().max(120).optional(),
});

async function issueSession(
  ctx: { req: import("express").Request; res: import("express").Response },
  openId: string,
  name: string
) {
  const token = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: ONE_YEAR_MS,
  });
}

export const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  register: publicProcedure
    .input(registerInput)
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();

      const existing = await db.getUserByEmail(email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const passwordHash = await hashPassword(input.password);
      const openId = nanoid();
      const name = input.name?.trim() || email.split("@")[0];
      const role =
        ENV.ownerEmail && email === ENV.ownerEmail.toLowerCase()
          ? "admin"
          : "user";

      const user = await db.createUser({
        openId,
        email,
        name,
        passwordHash,
        role,
        loginMethod: "password",
        lastSignedIn: new Date(),
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create account.",
        });
      }

      await issueSession(ctx, user.openId, user.name ?? "");
      return user;
    }),

  login: publicProcedure
    .input(credentials)
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      const user = await db.getUserByEmail(email);

      const invalid = new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password.",
      });

      if (!user || !user.passwordHash) throw invalid;

      const ok = await verifyPassword(input.password, user.passwordHash);
      if (!ok) throw invalid;

      await issueSession(ctx, user.openId, user.name ?? "");
      return user;
    }),
});
