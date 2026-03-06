import Link from "next/link";
import { APP_DOMAIN } from "@/data/constants";

export default function SiteFooter() {
  const links = [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/changelog", label: "Changelog" },
    { href: "/faq", label: "FAQ" },
    { href: "/templates", label: "Templates" },
  ];

  return (
    <footer className="border-t border-slate-200/70 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">PromptForge</p>
          <p className="text-xs text-slate-500">Built for better prompts. v1.0.0 • {APP_DOMAIN}</p>
        </div>
        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 md:grid-cols-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Disclaimer: outputs are heuristic and should be reviewed before using in production workflows.
        </p>
      </div>
    </footer>
  );
}
