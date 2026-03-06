import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FEATURE_HIGHLIGHTS } from "@/data/constants";

export function FeatureGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {FEATURE_HIGHLIGHTS.map((feature) => (
        <Card
          key={feature.title}
          className="h-full border-slate-200/75 bg-gradient-to-b from-white to-slate-50/80 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)]"
        >
          <CardHeader>
            <CardTitle>{feature.title}</CardTitle>
            <CardDescription>{feature.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Built into the forge pipeline by default.</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
