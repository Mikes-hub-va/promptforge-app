import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { createId } from "@/lib/utils/id";
import { AuthUser, BillingStatus, PlanTier } from "@/types";

const SESSION_COOKIE_NAME = "promptify_session";
const SESSION_DURATION_DAYS = 30;

type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  plan_tier: PlanTier;
  billing_status: BillingStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  subscription_current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, original] = storedHash.split(":");
  if (!salt || !original) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(original, "hex");

  if (candidate.length !== originalBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidate, originalBuffer);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function findUserRowById(userId: string) {
  const db = getDatabase();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as UserRow | undefined;
}

function mapUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    planTier: row.plan_tier,
    billingStatus: row.billing_status,
    stripeCustomerId: row.stripe_customer_id ?? undefined,
    stripeSubscriptionId: row.stripe_subscription_id ?? undefined,
    subscriptionCurrentPeriodEnd: row.subscription_current_period_end ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function sessionCookieName() {
  return SESSION_COOKIE_NAME;
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

function shouldUseSecureCookies(request?: Request) {
  const forcedSecure = process.env.PROMPTIFY_FORCE_SECURE_COOKIES?.trim().toLowerCase();
  if (forcedSecure === "true") {
    return true;
  }
  if (forcedSecure === "false") {
    return false;
  }

  if (!request) {
    return process.env.NODE_ENV === "production";
  }

  const url = new URL(request.url);
  if (isLocalHostname(url.hostname)) {
    return false;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return url.protocol === "https:" || process.env.NODE_ENV === "production";
}

export function cookieSecurityOptions(expires: Date, request?: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(request),
    expires,
    path: "/",
  };
}

export function findUserById(userId: string) {
  const row = findUserRowById(userId);
  return row ? mapUser(row) : null;
}

export function findUserByEmail(email: string) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizeEmail(email)) as UserRow | undefined;
  return row ?? null;
}

export function findUserByStripeCustomerId(customerId: string) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM users WHERE stripe_customer_id = ?").get(customerId) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function createUser(input: { email: string; name: string; password: string }) {
  const db = getDatabase();
  const now = new Date().toISOString();
  const userId = createId("user");
  const email = normalizeEmail(input.email);
  const displayName = input.name.trim() || email.split("@")[0];

  db.prepare(`
    INSERT INTO users (
      id,
      email,
      name,
      password_hash,
      plan_tier,
      billing_status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, 'free', 'inactive', ?, ?)
  `).run(userId, email, displayName, hashPassword(input.password), now, now);

  const user = findUserById(userId);
  if (!user) {
    throw new Error("Failed to create user.");
  }

  return user;
}

export function authenticateUser(email: string, password: string) {
  const row = findUserByEmail(email);
  if (!row) {
    return null;
  }

  if (!verifyPassword(password, row.password_hash)) {
    return null;
  }

  return mapUser(row);
}

export function updateUserProfile(userId: string, updates: { name: string }) {
  const current = findUserRowById(userId);
  if (!current) {
    return null;
  }

  const nextName = updates.name.trim();
  const updatedAt = new Date().toISOString();
  const db = getDatabase();

  db.prepare(`
    UPDATE users
    SET
      name = ?,
      updated_at = ?
    WHERE id = ?
  `).run(nextName, updatedAt, userId);

  return findUserById(userId);
}

export function updateUserPassword(userId: string, currentPassword: string, nextPassword: string) {
  const current = findUserRowById(userId);
  if (!current) {
    return { ok: false as const, error: "User not found." };
  }

  if (!verifyPassword(currentPassword, current.password_hash)) {
    return { ok: false as const, error: "Current password is incorrect." };
  }

  if (verifyPassword(nextPassword, current.password_hash)) {
    return { ok: false as const, error: "Choose a new password instead of reusing the current one." };
  }

  const db = getDatabase();
  db.prepare(`
    UPDATE users
    SET
      password_hash = ?,
      updated_at = ?
    WHERE id = ?
  `).run(hashPassword(nextPassword), new Date().toISOString(), userId);

  return { ok: true as const };
}

export function updateUserBilling(userId: string, updates: Partial<{
  planTier: PlanTier;
  billingStatus: BillingStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  subscriptionCurrentPeriodEnd: string | null;
}>) {
  const db = getDatabase();
  const current = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as UserRow | undefined;
  if (!current) {
    return null;
  }

  const next: UserRow = {
    ...current,
    plan_tier: updates.planTier ?? current.plan_tier,
    billing_status: updates.billingStatus ?? current.billing_status,
    stripe_customer_id: updates.stripeCustomerId ?? current.stripe_customer_id,
    stripe_subscription_id: updates.stripeSubscriptionId ?? current.stripe_subscription_id,
    stripe_price_id: updates.stripePriceId ?? current.stripe_price_id,
    subscription_current_period_end: updates.subscriptionCurrentPeriodEnd ?? current.subscription_current_period_end,
    updated_at: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE users
    SET
      plan_tier = ?,
      billing_status = ?,
      stripe_customer_id = ?,
      stripe_subscription_id = ?,
      stripe_price_id = ?,
      subscription_current_period_end = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    next.plan_tier,
    next.billing_status,
    next.stripe_customer_id,
    next.stripe_subscription_id,
    next.stripe_price_id,
    next.subscription_current_period_end,
    next.updated_at,
    userId,
  );

  return mapUser(next);
}

export function createSession(userId: string) {
  const db = getDatabase();
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  db.prepare(`
    INSERT INTO sessions (
      id,
      user_id,
      token_hash,
      created_at,
      expires_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    createId("session"),
    userId,
    hashSessionToken(token),
    now.toISOString(),
    expires.toISOString(),
  );

  return { token, expires };
}

export function invalidateSession(token?: string | null) {
  if (!token) {
    return;
  }

  const db = getDatabase();
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashSessionToken(token));
}

export function invalidateSessionsForUser(userId: string) {
  const db = getDatabase();
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function pruneExpiredSessions() {
  const db = getDatabase();
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
}

export function getUserForSessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  pruneExpiredSessions();

  const db = getDatabase();
  const row = db.prepare(`
    SELECT users.*
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashSessionToken(token), new Date().toISOString()) as UserRow | undefined;

  return row ? mapUser(row) : null;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return getUserForSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null);
}

export function attachSessionCookie(response: NextResponse, session: { token: string; expires: Date }, request?: Request) {
  response.cookies.set(SESSION_COOKIE_NAME, session.token, cookieSecurityOptions(session.expires, request));
  return response;
}

export function clearSessionCookie(response: NextResponse, request?: Request) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...cookieSecurityOptions(new Date(0), request),
    maxAge: 0,
  });
  return response;
}
