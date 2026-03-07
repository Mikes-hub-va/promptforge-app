export type DashboardTone = "good" | "watch" | "critical";

export type DashboardLineItem = {
  title: string;
  detail: string;
  tone: DashboardTone;
};

export type ReleaseLane = {
  name: string;
  url: string;
  purpose: string;
  rules: string;
};

export const OWNER_DASHBOARD_REVIEW_DATE = "March 7, 2026";

export const RELEASE_LANES: ReleaseLane[] = [
  {
    name: "Production",
    url: "https://usepromptify.org",
    purpose: "Live customer traffic, live billing, and managed runtime.",
    rules: "Only merge work here after it clears preview and staging.",
  },
  {
    name: "Staging",
    url: "https://staging.usepromptify.org",
    purpose: "Stable QA lane for release candidates before they touch production.",
    rules: "Use this for sign-off, regression checks, and final smoke tests.",
  },
  {
    name: "Preview",
    url: "Vercel preview deployments",
    purpose: "Branch-by-branch review of feature work and risky fixes.",
    rules: "Treat previews as disposable and keep them out of search engines.",
  },
  {
    name: "Local",
    url: "http://localhost:3000",
    purpose: "Fast iteration, debugging, and one-off implementation work.",
    rules: "Never assume local-only behavior matches Vercel runtime edge cases.",
  },
];

export const RELEASE_WORKFLOW = [
  "Build on a feature branch and validate the automatic Vercel preview URL first.",
  "Promote the exact candidate to staging.usepromptify.org for QA and regression checks.",
  "Only merge to main after staging has passed the release checklist.",
  "Let Production stay mapped to usepromptify.org and avoid skipping the staging lane.",
];

export const DASHBOARD_FIXES_SHIPPED: DashboardLineItem[] = [
  {
    title: "Staging lane added",
    detail: "staging.usepromptify.org is now a dedicated non-production hostname for QA work.",
    tone: "good",
  },
  {
    title: "Non-production banner",
    detail: "Preview, staging, and local builds now label themselves clearly so they do not get confused with production.",
    tone: "good",
  },
  {
    title: "Search indexing guard",
    detail: "Non-production builds now return noindex/noarchive behavior and an empty sitemap so previews do not leak into search.",
    tone: "good",
  },
  {
    title: "Owner dashboard",
    detail: "A signed-in operations view now tracks release lanes, review notes, owner actions, and current runtime posture in one place.",
    tone: "good",
  },
  {
    title: "Release scripts",
    detail: "The repo now includes explicit preview, staging, and production deploy commands so the release path is repeatable.",
    tone: "good",
  },
  {
    title: "Runtime spend guards",
    detail: "Preview and staging now reject live Stripe billing, and managed server-side AI stays disabled there unless you explicitly opt in.",
    tone: "good",
  },
  {
    title: "Password rotation hardened",
    detail: "Changing a password now revokes old sessions and issues a fresh session cookie instead of leaving older logins alive.",
    tone: "good",
  },
  {
    title: "Signed-in surface polish",
    detail: "Home and account CTAs now adapt better to signed-in state, and the owner dashboard can be scoped to configured owner emails.",
    tone: "good",
  },
  {
    title: "Auth state reset",
    detail: "Account notices and form state now clear when the signed-in user changes, so one account does not inherit another account's security or login messages.",
    tone: "good",
  },
  {
    title: "Telemetry runtime gate",
    detail: "Vercel Analytics and Speed Insights now mount only on Vercel, which keeps local production-style verification free of telemetry script noise.",
    tone: "good",
  },
];

export const DASHBOARD_REVIEW_NOTES: DashboardLineItem[] = [
  {
    title: "Billing safety",
    detail: "Live Stripe keys stay in Production; Preview/Staging should use test-mode Stripe keys or remain billing-disabled.",
    tone: "watch",
  },
  {
    title: "Managed runtime cost control",
    detail: "OpenRouter is wired for low-cost managed runs, but Preview should stay keyless unless you intentionally want QA traffic to spend money.",
    tone: "watch",
  },
  {
    title: "Persistence risk",
    detail: "The Vercel deployment still relies on SQLite and /tmp today, which is not durable enough for long-lived sessions or subscription state.",
    tone: "critical",
  },
  {
    title: "Rate limiting scope",
    detail: "Current rate limits are in-memory best-effort limits inside serverless instances, so they help but do not replace a shared limiter.",
    tone: "watch",
  },
  {
    title: "Owner dashboard access",
    detail: "Use PROMPTIFY_OWNER_EMAILS so /ops stays limited to your owner accounts instead of every signed-in user.",
    tone: "watch",
  },
  {
    title: "Comparison failure handling",
    detail: "Failed compare-model runs no longer render duplicated primary output as fake comparison tabs; they now stay hidden.",
    tone: "good",
  },
];

export const DASHBOARD_OWNER_ACTIONS: DashboardLineItem[] = [
  {
    title: "Move Promptify to a managed database",
    detail: "This is the most important production upgrade left because current Vercel SQLite storage is still ephemeral.",
    tone: "critical",
  },
  {
    title: "Add Stripe test-mode keys to Preview when you want full staging checkout tests",
    detail: "Keep live Stripe keys Production-only and use test webhooks on the non-production lane.",
    tone: "watch",
  },
  {
    title: "Use the staging lane before every production push",
    detail: "Preview catches branch issues, staging catches release-level regressions, and production stays clean.",
    tone: "watch",
  },
  {
    title: "Keep managed runtime preview-disabled unless QA specifically needs it",
    detail: "If you ever enable PROMPTIFY_ENABLE_MANAGED_RUNTIME_NON_PRODUCTION, treat it as a temporary QA switch so preview traffic does not quietly spend money.",
    tone: "watch",
  },
];
