import { APP_DOMAIN } from "@/data/constants";

export type PromptifyRuntimeEnvironment = "production" | "preview" | "development" | "local";
export type PromptifyStripeMode = "live" | "test" | "mixed" | "missing";

const FALLBACK_LOCAL_URL = "http://localhost:3000";
const STAGING_URL = "https://staging.usepromptify.org";

function envFlagEnabled(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function normalizeUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function normalizeHost(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).host;
  } catch {
    return trimmed.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
}

function resolveCurrentUrl() {
  if (getRuntimeEnvironment() === "production") {
    return APP_DOMAIN;
  }

  const explicitUrl = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicitUrl) {
    return explicitUrl;
  }

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }

  return FALLBACK_LOCAL_URL;
}

function classifyStripeKey(key: string | undefined) {
  if (!key?.trim()) {
    return null;
  }

  if (key.startsWith("pk_live_") || key.startsWith("sk_live_")) {
    return "live" as const;
  }

  if (key.startsWith("pk_test_") || key.startsWith("sk_test_")) {
    return "test" as const;
  }

  return null;
}

export function getRuntimeEnvironment(): PromptifyRuntimeEnvironment {
  const vercelEnvironment = process.env.VERCEL_ENV?.trim();
  if (vercelEnvironment === "production" || vercelEnvironment === "preview" || vercelEnvironment === "development") {
    return vercelEnvironment;
  }

  return process.env.NODE_ENV === "production" ? "local" : "development";
}

export function getCurrentSiteUrl() {
  return resolveCurrentUrl();
}

export function getCurrentSiteHost() {
  return normalizeHost(resolveCurrentUrl()) ?? "localhost:3000";
}

export function getPrimarySiteUrl() {
  return APP_DOMAIN;
}

export function getPrimarySiteHost() {
  return normalizeHost(APP_DOMAIN) ?? "usepromptify.org";
}

export function getStagingSiteUrl() {
  return STAGING_URL;
}

export function getStagingSiteHost() {
  return normalizeHost(STAGING_URL) ?? "staging.usepromptify.org";
}

export function isNonProductionRuntime() {
  return getRuntimeEnvironment() !== "production";
}

export function shouldAllowSearchIndexing() {
  return getRuntimeEnvironment() === "production";
}

export function getSiteUrlFromHeaders(headers: Pick<Headers, "get">) {
  const forwardedHost = headers.get("x-forwarded-host")?.trim();
  const host = forwardedHost || headers.get("host")?.trim();
  if (!host) {
    return null;
  }

  const forwardedProto = headers.get("x-forwarded-proto")?.trim();
  const protocol = forwardedProto || (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return normalizeUrl(`${protocol}://${host}`);
}

export function getRuntimeLabel() {
  const environment = getRuntimeEnvironment();
  if (environment === "production") {
    return "Production";
  }
  if (environment === "preview" && getCurrentSiteHost() === getStagingSiteHost()) {
    return "Staging";
  }
  if (environment === "preview") {
    return "Preview";
  }
  if (environment === "development") {
    return "Development";
  }

  return "Local";
}

export function getRuntimeBranch() {
  return process.env.VERCEL_GIT_COMMIT_REF?.trim() || null;
}

export function getRuntimeCommitSha() {
  return process.env.VERCEL_GIT_COMMIT_SHA?.trim() || null;
}

export function getRuntimeCommitShortSha() {
  const sha = getRuntimeCommitSha();
  return sha ? sha.slice(0, 7) : null;
}

export function getDatabasePath() {
  return process.env.PROMPTIFY_DATABASE_PATH?.trim() || "data/promptify.sqlite";
}

export function isEphemeralDatabasePath(databasePath = getDatabasePath()) {
  return databasePath.startsWith("/tmp/") || databasePath === "/tmp" || databasePath.includes("/tmp/");
}

export function getStripeKeyMode(): PromptifyStripeMode {
  const publishableMode = classifyStripeKey(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim());
  const secretMode = classifyStripeKey(process.env.STRIPE_SECRET_KEY?.trim());
  const detectedModes = new Set([publishableMode, secretMode].filter((value): value is "live" | "test" => Boolean(value)));

  if (!detectedModes.size) {
    return "missing";
  }

  if (detectedModes.size > 1) {
    return "mixed";
  }

  return detectedModes.values().next().value ?? "missing";
}

export function isManagedRuntimeAllowedInCurrentEnvironment() {
  const environment = getRuntimeEnvironment();
  if (environment !== "preview") {
    return true;
  }

  return envFlagEnabled(process.env.PROMPTIFY_ENABLE_MANAGED_RUNTIME_NON_PRODUCTION);
}

export function getManagedRuntimeGuardMessage(hasConfiguredManagedProvider: boolean) {
  if (!hasConfiguredManagedProvider || isManagedRuntimeAllowedInCurrentEnvironment()) {
    return null;
  }

  return "Managed runtime stays disabled on preview and staging unless PROMPTIFY_ENABLE_MANAGED_RUNTIME_NON_PRODUCTION=true.";
}

export function isStripeModeAllowedInCurrentEnvironment(mode = getStripeKeyMode()) {
  if (mode === "missing" || mode === "mixed") {
    return false;
  }

  return getRuntimeEnvironment() === "production" ? mode === "live" : mode === "test";
}

export function getStripeRuntimeGuardMessage(mode = getStripeKeyMode()) {
  if (isStripeModeAllowedInCurrentEnvironment(mode)) {
    return null;
  }

  if (mode === "missing") {
    return "Stripe keys are missing for this runtime.";
  }

  if (mode === "mixed") {
    return "Stripe publishable and secret keys must use the same mode.";
  }

  return getRuntimeEnvironment() === "production"
    ? "Production only enables billing with live Stripe keys."
    : "Preview, staging, and local lanes only enable billing with Stripe test keys.";
}

export function getRuntimeStatus() {
  const environment = getRuntimeEnvironment();
  const currentUrl = getCurrentSiteUrl();
  const currentHost = getCurrentSiteHost();
  const branch = getRuntimeBranch();
  const commitShortSha = getRuntimeCommitShortSha();
  const databasePath = getDatabasePath();

  return {
    environment,
    environmentLabel: getRuntimeLabel(),
    currentUrl,
    currentHost,
    primaryUrl: getPrimarySiteUrl(),
    primaryHost: getPrimarySiteHost(),
    stagingUrl: getStagingSiteUrl(),
    stagingHost: getStagingSiteHost(),
    branch,
    commitShortSha,
    databasePath,
    databaseIsEphemeral: isEphemeralDatabasePath(databasePath),
    stripeMode: getStripeKeyMode(),
    stripeModeAllowed: isStripeModeAllowedInCurrentEnvironment(),
    searchIndexingAllowed: shouldAllowSearchIndexing(),
    isNonProduction: environment !== "production",
    managedRuntimeAllowed: isManagedRuntimeAllowedInCurrentEnvironment(),
  };
}
