import Link from "next/link";
import { Box, CircleCheckBig, Rocket, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { HeroHeader, SectionHeading } from "@/components/marketing/section-heading";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HomeHeroActions } from "@/components/marketing/home-hero-actions";
import { PromptifyPreview } from "@/components/marketing/hero-preview";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Accordion } from "@/components/ui/accordion";
import { ProductMark } from "@/components/navigation/site-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FAQ_ITEMS } from "@/data/constants";
import { PRESET_LIBRARY } from "@/data/presets";
import { getPlatformStatus } from "@/lib/platform/status";
import { JsonLd } from "@/components/seo/json-ld";

const topTemplates = PRESET_LIBRARY.slice(0, 6);

const workflow = [
  {
    title: "Draft",
    detail: "Paste a rough idea, define the outcome, and choose the target prompt profile.",
    icon: Box,
  },
  {
    title: "Compile",
    detail: "Promptify turns that brief into a structured prompt pack with constraints, rationale, and variants.",
    icon: Workflow,
  },
  {
    title: "Evaluate",
    detail: "Review the improved pack, compare versions, and pick the layer you actually want to ship.",
    icon: CircleCheckBig,
  },
  {
    title: "Ship",
    detail: "Save to your account, reopen from history, export, or route into a real provider.",
    icon: Rocket,
  },
];

export default function HomePage() {
  const platform = getPlatformStatus();
  const billingReady = platform.billingReady;
  const managedRuntimeLabel = platform.managedRuntimeReady
    ? `Managed runtime live with ${platform.managedProviders.join(", ")}.`
    : platform.managedRuntimeGuardMessage ?? "Local mode and BYOK are live now. Managed cloud activates when a server key is added.";
  const homeSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Promptify",
        url: "https://usepromptify.org",
        logo: "https://usepromptify.org/icon",
      },
      {
        "@type": "WebSite",
        name: "Promptify",
        url: "https://usepromptify.org",
      },
      {
        "@type": "SoftwareApplication",
        name: "Promptify",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://usepromptify.org",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <div className="space-y-20 pb-20">
      <JsonLd data={homeSchema} />
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-12 md:px-8 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:items-stretch lg:gap-16 lg:pb-20 lg:pt-16">
          <div>
            <ProductMark label="Fresh prompt ops for modern product teams" />
            <HeroHeader
              title="Prompt systems for people shipping real work."
              description="Promptify turns rough ideas into structured prompt packs with synced accounts, managed runs, BYOK routing, and a workspace built for repeatable prompt operations."
              cta={<HomeHeroActions />}
              secondary={
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> {managedRuntimeLabel}
                </span>
              }
            />
            <div className="mt-8 grid gap-3 text-sm text-slate-700">
              <p className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                From rough prompt to structured pack in seconds.
              </p>
              <p className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Compare original vs improved output and copy the exact layer you need.
              </p>
              <p className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Save, restore, duplicate, and sync drafts under a real Promptify account.
              </p>
            </div>
          </div>

          <div className="min-h-[660px]">
            <PromptifyPreview />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[var(--pf-elev)] md:p-10">
          <SectionHeading
            kicker="How it works"
            title="A workflow designed for speed, not friction"
            description="The interface is simple for beginners and strict enough for teams that treat prompt quality as an engineering discipline."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.title} className="h-full border-slate-200/70">
                  <CardHeader>
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-teal-100 bg-[linear-gradient(135deg,rgba(15,118,110,0.14),rgba(14,165,233,0.14))] text-teal-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="mt-3">{step.title}</CardTitle>
                    <CardDescription>{step.detail}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-b from-white/70 to-slate-50/70 p-6 shadow-[var(--pf-elev)] md:p-10">
          <SectionHeading
            kicker="Platform Features"
            title="A premium but practical workspace"
            description="Built for everyday operators and advanced users, Promptify keeps the workflow clear, fast, and surprisingly disciplined."
          />
          <div className="mt-8">
            <FeatureGrid />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeading
          kicker="Use Case Templates"
          title="Start with a preset that matches your task"
          description="Choose from coding, marketing, SEO writing, image prompts, app specs, and more."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topTemplates.map((template) => (
            <Link
              key={template.id}
              href={`/templates/${template.slug}`}
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_-22px_rgba(15,23,42,0.35)]"
            >
              <p className="text-sm text-slate-500">{template.icon}</p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">{template.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{template.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[var(--pf-elev)] md:p-10">
          <SectionHeading
            kicker="Resources"
            title="Prompt playbooks for teams and solo builders"
            description="Explore practical template pages by category, with defaults that match production workflows."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Link href="/resources/coding" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:bg-slate-100">
              Prompt templates for coding
            </Link>
            <Link href="/resources/marketing" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:bg-slate-100">
              Prompt templates for marketing
            </Link>
            <Link href="/resources/content-writing" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:bg-slate-100">
              Prompt templates for content writing
            </Link>
            <Link href="/resources/app-building" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:bg-slate-100">
              Prompt templates for app building
            </Link>
            <Link href="/resources/image-generation" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:bg-slate-100">
              Prompt templates for image generation
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Practical guides and templates you can use immediately, without reworking the structure from scratch.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Original to improved view</CardTitle>
              <CardDescription>What changes and why, without black-box processing.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Promptify extracts objective, adds context and constraints, and outputs strict, copy-ready prompts with model-aware language.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Built-in trust</CardTitle>
              <CardDescription>Every generation includes rationale and clear formatting checks.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                {platform.managedRuntimeReady
                  ? `Managed runs are available through ${platform.managedProviders.join(", ")}, while local mode and BYOK remain available.`
                  : "Local mode works today with no API key, and BYOK remains available even before managed cloud is enabled."}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[var(--pf-elev)] md:p-10">
          <SectionHeading
            kicker="Pricing"
            title="Start free, then upgrade for managed convenience."
            description="No bundled AI credits, just a clean path from local work to managed Promptify Cloud runs."
          />
          <div className="mt-8">
            <PricingCards billingReady={billingReady} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <SectionHeading
          kicker="FAQ"
          title="Trusted Product Basics"
          description="Clear answers for common questions before you ship first."
        />
        <div className="mt-8">
          <Accordion
            items={FAQ_ITEMS.map((item) => ({
              question: item.question,
              answer: <p>{item.answer}</p>,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
