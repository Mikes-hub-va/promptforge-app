import { Card, CardContent } from "@/components/ui/card";

export function PromptForgePreview() {
  return (
    <Card className="overflow-hidden border-slate-300/70 bg-gradient-to-br from-white via-slate-100/80 to-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)]">
      <CardContent className="p-0">
        <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="space-y-3 border-slate-200/70 bg-white/90 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Raw input</p>
            <p className="text-sm leading-7 text-slate-700">&quot;Need an email asking users to upgrade, but make it sound less pushy&quot;</p>
            <div className="h-3 rounded-full bg-slate-200">
              <div className="h-full w-11/12 rounded-full bg-slate-900" />
            </div>
          </div>
        <div className="space-y-3 bg-slate-950 p-6 text-slate-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Forged output</p>
            <p className="text-sm leading-7">&quot;Role: product onboarding assistant. Objective: draft a respectful, clear upgrade email with a single conversion goal...&quot;</p>
            <div className="grid gap-2">
              <div className="h-2 rounded-full bg-slate-700">
                <div className="h-full w-9/12 rounded-full bg-slate-200" />
              </div>
              <div className="h-2 rounded-full bg-slate-700">
                <div className="h-full w-8/12 rounded-full bg-slate-200" />
              </div>
              <div className="h-2 rounded-full bg-slate-700">
                <div className="h-full w-10/12 rounded-full bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
