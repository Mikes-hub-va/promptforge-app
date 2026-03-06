import type { ReactNode } from "react";

export function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      {kicker ? <p className="inline-flex items-center rounded-full bg-slate-900/5 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-500">{kicker}</p> : null}
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

export function HeroHeader({
  title,
  description,
  cta,
  secondary,
}: {
  title: string;
  description: string;
  cta: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div>
      <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl sm:leading-tight">{title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">{description}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">{cta}</div>
      {secondary ? <div className="mt-3 text-sm text-slate-600">{secondary}</div> : null}
    </div>
  );
}
