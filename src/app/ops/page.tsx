import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Database,
  GitBranch,
  Globe,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DASHBOARD_FIXES_SHIPPED,
  DASHBOARD_OWNER_ACTIONS,
  DASHBOARD_REVIEW_NOTES,
  OWNER_DASHBOARD_REVIEW_DATE,
  RELEASE_LANES,
  RELEASE_WORKFLOW,
  type DashboardLineItem,
} from "@/data/owner-dashboard";
import { canAccessOwnerDashboard } from "@/lib/auth/owners";
import { getCurrentUser } from "@/lib/auth/server";
import { getPlatformStatus } from "@/lib/platform/status";
import { getCurrentSiteUrl, getRuntimeStatus, getSiteUrlFromHeaders } from "@/lib/platform/runtime";

export const metadata: Metadata = {
  title: "Owner Dashboard",
  description: "Release status, review notes, and owner action items for Promptify.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

function toneClasses(tone: DashboardLineItem["tone"]) {
  if (tone === "good") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "critical") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }

  return "border-amber-200 bg-amber-50 text-amber-950";
}

function toneLabel(tone: DashboardLineItem["tone"]) {
  if (tone === "good") {
    return "Done";
  }
  if (tone === "critical") {
    return "Critical";
  }

  return "Watch";
}

function toneIcon(tone: DashboardLineItem["tone"]) {
  if (tone === "good") {
    return CheckCircle2;
  }
  if (tone === "critical") {
    return AlertTriangle;
  }

  return Clock3;
}

function OneLineList({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: DashboardLineItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const Icon = toneIcon(item.tone);
          return (
            <div key={item.title} className={`rounded-2xl border p-4 ${toneClasses(item.tone)}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm leading-6">{item.detail}</p>
                  </div>
                </div>
                <span className="rounded-full border border-current/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {toneLabel(item.tone)}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default async function OpsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/account");
  }
  if (!canAccessOwnerDashboard(user)) {
    redirect("/account?restricted=ops");
  }

  const requestHeaders = await headers();
  const runtime = getRuntimeStatus();
  const currentSiteUrl = getSiteUrlFromHeaders(requestHeaders) ?? getCurrentSiteUrl();
  const platform = getPlatformStatus();
  const currentHost = new URL(currentSiteUrl).host;

  const currentLaneLabel = `${runtime.environmentLabel}${currentHost === runtime.primaryHost ? " lane" : ""}`;
  const billingModeLabel = runtime.stripeMode === "live"
    ? "Live Stripe keys"
    : runtime.stripeMode === "test"
      ? "Test Stripe keys"
      : runtime.stripeMode === "mixed"
        ? "Mixed Stripe keys"
        : "No Stripe keys";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,244,236,0.96),rgba(255,255,255,0.98)_55%,rgba(240,249,255,0.98))] p-6 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.35)] md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Owner Dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Promptify release and product review</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              One place for release lanes, high-level review notes, and the owner actions that still matter after the product is live.
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)]">
            <p className="font-semibold text-slate-900">Last deep review</p>
            <p className="mt-1">{OWNER_DASHBOARD_REVIEW_DATE}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-4">
          <Card className="border-slate-200/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4 text-orange-500" /> Current lane
              </CardTitle>
              <CardDescription>{currentLaneLabel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{currentHost}</p>
              <p>{currentSiteUrl}</p>
              <p>{runtime.searchIndexingAllowed ? "Search indexing allowed." : "Search indexing blocked."}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Runtime
              </CardTitle>
              <CardDescription>Managed provider posture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">
                {platform.managedRuntimeReady ? platform.managedProviders.join(", ") : "Local + BYOK only"}
              </p>
              <p>
                {platform.managedRuntimeReady
                  ? "Managed runs are available here."
                  : platform.managedRuntimeGuardMessage ?? "Managed runs are disabled here."}
              </p>
              <p>{runtime.branch ? `Branch: ${runtime.branch}` : "Branch metadata is not available in this runtime."}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-sky-600" /> Billing mode
              </CardTitle>
              <CardDescription>Stripe posture for this lane</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{billingModeLabel}</p>
              <p>
                {platform.billingReady
                  ? "Checkout and webhook sync are ready."
                  : platform.billing.runtimeGuardMessage ?? "Billing is intentionally disabled or incomplete here."}
              </p>
              <p>{runtime.commitShortSha ? `Commit: ${runtime.commitShortSha}` : "Commit metadata is not available in this runtime."}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4 text-rose-600" /> Storage
              </CardTitle>
              <CardDescription>Persistence posture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{runtime.databaseIsEphemeral ? "Ephemeral database path" : "Stable database path"}</p>
              <p className="break-all">{runtime.databasePath}</p>
              <p>{runtime.databaseIsEphemeral ? "Move this to a managed database before trusting long-lived state." : "This lane is not using /tmp storage."}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Waypoints className="h-4 w-4 text-orange-500" /> Release lanes
            </CardTitle>
            <CardDescription>How Promptify should move from implementation to production.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {RELEASE_LANES.map((lane) => (
              <div key={lane.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{lane.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{lane.purpose}</p>
                  </div>
                  {lane.url.startsWith("http") ? (
                    <a
                      href={lane.url}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:text-orange-900"
                    >
                      Open <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">{lane.url}</p>
                <p className="mt-3 text-sm text-slate-600">{lane.rules}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-slate-900" /> Release workflow
            </CardTitle>
            <CardDescription>The short version of how you should ship from here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {RELEASE_WORKFLOW.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <OneLineList
          title="Fixes shipped"
          description="What already changed in the product and release flow during this review pass."
          items={DASHBOARD_FIXES_SHIPPED}
        />
        <OneLineList
          title="Review notes"
          description="Important findings from the deeper production/readiness review."
          items={DASHBOARD_REVIEW_NOTES}
        />
      </div>

      <div className="mt-8">
        <OneLineList
          title="Action items for you"
          description="Owner tasks worth doing next, ranked by operational importance."
          items={DASHBOARD_OWNER_ACTIONS}
        />
      </div>
    </div>
  );
}
