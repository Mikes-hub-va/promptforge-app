import Link from "next/link";
import { BadgeCheck, Rocket, Sparkles, Users } from "lucide-react";
import { PLANS } from "@/data/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function PricingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLANS.map((plan) => (
        <Card
          key={plan.id}
          className={`relative border-slate-200/75 ${
            plan.highlight ? "ring-2 ring-slate-900/65" : "hover:-translate-y-0.5 hover:shadow-[0_26px_60px_-36px_rgba(15,23,42,0.5)]"
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
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              {plan.price}
              {plan.frequency ? (
                <>
                  {" "}
                  <span className="text-sm font-medium text-slate-500">{plan.frequency}</span>
                </>
              ) : null}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex-col items-start gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              {plan.id === "free" ? <Sparkles className="h-3.5 w-3.5" /> : null}
              {plan.id === "pro" ? <Rocket className="h-3.5 w-3.5" /> : null}
              {plan.id === "team" ? <Users className="h-3.5 w-3.5" /> : null}
              {plan.comingSoon ? "Future-ready architecture already in mind." : "Ready to start today."}
            </div>
            <Button asChild className="w-full" variant={plan.highlight ? "default" : "outline"}>
              <Link href={plan.id === "team" ? "/contact" : "/workspace"}>{plan.cta}</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
