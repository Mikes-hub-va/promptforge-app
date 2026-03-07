"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, Rocket, Sparkles, Users } from "lucide-react";
import { PLANS } from "@/data/constants";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function PricingCards({ billingReady }: { billingReady: boolean }) {
  const { user } = useAuth();
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const startCheckout = async () => {
    setCheckoutBusy(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload?.url !== "string") {
        window.location.href = "/account?intent=upgrade";
        return;
      }
      window.location.href = payload.url;
    } finally {
      setCheckoutBusy(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLANS.map((plan) => (
        <Card
          key={plan.id}
          className={`relative flex h-full flex-col border-slate-200/75 ${
            plan.highlight
              ? "ring-2 ring-orange-200 shadow-[0_24px_60px_-36px_rgba(249,115,22,0.24)]"
              : "hover:-translate-y-0.5 hover:shadow-[0_26px_60px_-36px_rgba(15,23,42,0.5)]"
          }`}
        >
          <CardHeader className="pb-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                {plan.accent ?? "Forge"}
              </span>
              {plan.ctaHint ? (
                <span className="text-xs text-slate-500">{plan.ctaHint}</span>
              ) : null}
            </div>
            <CardTitle className="text-slate-900">{plan.name}</CardTitle>
            {plan.handle ? <p className="text-sm font-semibold text-slate-700">{plan.handle}</p> : null}
            {plan.subtitle ? <CardDescription>{plan.subtitle}</CardDescription> : null}
            <p className="text-xs text-slate-500">{plan.description}</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              {plan.price}
              {plan.frequency ? (
                <>
                  {" "}
                  <span className="text-sm font-medium text-slate-500">{plan.frequency}</span>
                </>
              ) : null}
            </p>
            <div className="mt-4 rounded-lg border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-700">
              <span className="font-medium">Runtime:</span> {plan.aiModel}
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  {feature}
                </li>
              ))}
            </ul>
            {plan.id === "pro" ? (
              <p className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                Starter stays local plus BYOK. Pro unlocks managed cloud runs without removing BYOK from your workflow.
              </p>
            ) : null}
            {plan.comingSoon ? (
              <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-500">
                Studio includes concierge onboarding for teams that want a guided rollout.
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col items-start gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              {plan.id === "free" ? <Sparkles className="h-3.5 w-3.5" /> : null}
              {plan.id === "pro" ? <Rocket className="h-3.5 w-3.5" /> : null}
              {plan.id === "team" ? <Users className="h-3.5 w-3.5" /> : null}
              {plan.id === "pro"
                ? "Managed runs for people who do not want billing surprises."
                : plan.id === "team"
                  ? "Shared governance comes through direct onboarding."
                  : "Ready to start today."}
            </div>
            {plan.id === "pro" ? (
              user?.planTier === "pro" ? (
                <Button asChild className="w-full" variant="default">
                  <Link href="/account">Manage plan</Link>
                </Button>
              ) : user && billingReady ? (
                <Button
                  className="w-full"
                  variant="default"
                  disabled={checkoutBusy}
                  onClick={() => {
                    trackEvent("pricing_cta_clicked", {
                      planId: plan.id,
                      planName: plan.name,
                      destination: "/api/stripe/checkout",
                    });
                    void startCheckout();
                  }}
                >
                  {checkoutBusy ? "Opening..." : plan.cta}
                </Button>
              ) : user ? (
                <Button asChild className="w-full" variant="default">
                  <Link
                    href="/account?intent=upgrade"
                    onClick={() =>
                      trackEvent("pricing_cta_clicked", {
                        planId: plan.id,
                        planName: plan.name,
                        destination: "/account?intent=upgrade",
                      })
                    }
                  >
                    {plan.cta}
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full" variant="default">
                  <Link
                    href="/account?intent=upgrade"
                    onClick={() =>
                      trackEvent("pricing_cta_clicked", {
                        planId: plan.id,
                        planName: plan.name,
                        destination: "/account?intent=upgrade",
                      })
                    }
                  >
                    {plan.cta}
                  </Link>
                </Button>
              )
            ) : (
              <Button asChild className="w-full" variant={plan.highlight ? "default" : "outline"}>
                <Link
                  href={plan.id === "team" ? "/contact" : "/workspace"}
                  onClick={() =>
                    trackEvent("pricing_cta_clicked", {
                      planId: plan.id,
                      planName: plan.name,
                      destination: plan.id === "team" ? "/contact" : "/workspace",
                    })
                  }
                >
                  {plan.cta}
                </Link>
              </Button>
            )}
            {plan.id === "pro" && !billingReady ? (
              <p className="text-xs text-amber-700">
                Upgrade from the account page as soon as billing is available.
              </p>
            ) : null}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
