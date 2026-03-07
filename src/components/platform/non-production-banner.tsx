import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { getRuntimeStatus } from "@/lib/platform/runtime";

export function NonProductionBanner({ showOwnerLink = false }: { showOwnerLink?: boolean }) {
  const runtime = getRuntimeStatus();
  if (!runtime.isNonProduction) {
    return null;
  }

  const label = runtime.environmentLabel === "Staging"
    ? "Staging lane"
    : runtime.environmentLabel === "Preview"
      ? "Preview deployment"
      : "Local development";
  const detail = runtime.environmentLabel === "Staging"
    ? "Use this space for QA and release sign-off before anything goes to production."
    : runtime.environmentLabel === "Preview"
      ? "This build is a disposable preview and should not be treated like the live site."
      : "This is a local build for implementation work, not the customer-facing deployment.";

  return (
    <div className="border-b border-amber-200 bg-[linear-gradient(90deg,rgba(255,237,213,0.96),rgba(255,247,237,0.98))]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-sm text-amber-950 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="inline-flex items-start gap-2">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <span>
            <span className="font-semibold">{label}.</span> {detail}
          </span>
        </div>
        {showOwnerLink ? (
          <Link href="/ops" className="font-semibold text-amber-800 underline-offset-4 hover:underline">
            Open owner dashboard
          </Link>
        ) : null}
      </div>
    </div>
  );
}
