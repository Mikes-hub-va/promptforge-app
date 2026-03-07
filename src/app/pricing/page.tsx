import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck, Users } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { PLANS } from "@/data/constants";
import { SectionHeading } from "@/components/marketing/section-heading";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { getPlatformStatus } from "@/lib/platform/status";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Promptify pricing is built for real daily use: free local work, Pro managed runs on low-cost OpenRouter models, and concierge team onboarding.",
};

const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Promptify",
  offers: PLANS.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    price: /^\d/.test(plan.price) ? plan.price.replace(/[^0-9.]/g, "") : "0",
    priceCurrency: "USD",
    availability: plan.comingSoon ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
    description: plan.description,
  })),
};

const pricingPrinciples = [
  {
    title: "Start free with a complete core workflow",
    description:
      "Starter includes local prompt shaping, account sync, templates, and export tools so the product feels complete before billing enters the picture.",
    icon: ShieldCheck,
  },
  {
    title: "Keep managed AI spend under control",
    description:
      "Promptify Pro uses low-cost OpenRouter models for the hosted lane and leaves unlimited BYOK intact, so the app stays efficient without forcing bundled credits.",
    icon: KeyRound,
  },
  {
    title: "Add guided team onboarding when the workflow needs it",
    description:
      "Studio offers concierge onboarding for teams that want governance, collaboration, and rollout structure around prompt quality.",
    icon: Users,
  },
];

export default function PricingPage() {
  const platform = getPlatformStatus();
  const billingReady = platform.billingReady;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <JsonLd data={pricingSchema} />

      <SectionHeading
        title="Pricing built for sustained daily use"
        kicker="Pricing"
        description="Start with local and BYOK. Upgrade when you want managed Promptify Cloud runs, synced account workflows, and a cleaner operator setup."
      />

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          No card required to start
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm text-sky-700">
          <KeyRound className="h-4 w-4" />
          BYOK works across OpenAI, Anthropic, and Gemini
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-700">
          <Users className="h-4 w-4" />
          Managed cloud runs stay cost-disciplined
        </span>
      </div>

      <div className="mt-10">
        <PricingCards billingReady={billingReady} />
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {pricingPrinciples.map((principle) => {
          const Icon = principle.icon;
          return (
            <div
              key={principle.title}
              className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.45)]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{principle.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{principle.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.88))] p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.4)] md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Platform note</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          Promptify Pro is for convenience, not artificial lock-in.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          The free product is intentionally complete. Pro exists for people who want managed runs alongside real accounts and less key management. Studio adds a guided path for teams that want shared standards and rollout support.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/account?intent=upgrade"
            className="inline-flex items-center gap-2 rounded-xl border border-orange-300/60 bg-[linear-gradient(135deg,#ff6b35_0%,#ff8a48_100%)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_34px_-24px_rgba(249,115,22,0.6)]"
          >
            Upgrade on account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Ask about Pro or team access
          </Link>
        </div>
      </div>
    </div>
  );
}
