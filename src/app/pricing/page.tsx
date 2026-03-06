import { JsonLd } from "@/components/seo/json-ld";
import { PLANS } from "@/data/constants";
import { SectionHeading } from "@/components/marketing/section-heading";
import { PricingCards } from "@/components/marketing/pricing-cards";

const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "PromptForge",
  offers: PLANS.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    price: plan.price === "Coming Soon" ? "0" : plan.price.replace("$", ""),
    priceCurrency: "USD",
    availability: plan.comingSoon ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
    description: plan.description,
  })),
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <JsonLd data={pricingSchema} />
      <SectionHeading
        title="Pricing"
        kicker="Simple and clear"
        description="Start free, forge faster with pro tooling, and bring a team when your prompt stack gets serious."
      />
      <div className="mt-8">
        <p className="mb-6 max-w-3xl text-sm text-slate-600">
          No credit card required to start. Free gives immediate value via the local forge engine, Pro adds
          scale-focused workflow polish, and Team is our &ldquo;coming next quarter&rdquo; placeholder.
        </p>
        <PricingCards />
      </div>
    </div>
  );
}
