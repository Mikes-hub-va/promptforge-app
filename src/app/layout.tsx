import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import SiteNav from "@/components/navigation/site-nav";
import SiteFooter from "@/components/navigation/site-footer";
import { NonProductionBanner } from "@/components/platform/non-production-banner";
import { AuthProvider } from "@/lib/auth/client";
import { canAccessOwnerDashboard } from "@/lib/auth/owners";
import { getCurrentUser } from "@/lib/auth/server";
import { PromptifyStoreProvider } from "@/lib/storage/manager";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sourceCode = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://usepromptify.org"),
  applicationName: "Promptify",
  title: {
    default: "Promptify",
    template: "%s | Promptify",
  },
  description:
    "Promptify turns rough ideas into structured prompt packs with synced accounts, managed runs, BYOK routing, and a polished workspace for repeatable prompt operations.",
  category: "developer tools",
  creator: "Promptify",
  publisher: "Promptify",
  keywords: [
    "prompt engineering",
    "prompt tool",
    "AI prompts",
    "ChatGPT",
    "Claude",
    "prompt optimization",
  ],
  alternates: {
    canonical: "https://usepromptify.org/",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/promptify-mark.svg", type: "image/svg+xml" },
      { url: "/icon", sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: "/icon", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Promptify",
  },
  openGraph: {
    title: "Promptify",
    description: "Turn rough ideas into structured, execution-ready prompt packs.",
    siteName: "Promptify",
    type: "website",
    url: "https://usepromptify.org",
    images: [
      {
        url: "https://usepromptify.org/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Promptify social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Promptify",
    description: "Turn rough prompts into structured execution-ready instruction sets.",
    images: ["https://usepromptify.org/twitter-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#ff6b35",
  colorScheme: "light",
};

const shouldEnableVercelTelemetry = Boolean(process.env.VERCEL?.trim() || process.env.VERCEL_ENV?.trim());

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sourceCode.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-slate-950 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <AuthProvider initialUser={currentUser}>
          <PromptifyStoreProvider>
            <div className="pf-shell min-h-screen text-slate-900">
              <NonProductionBanner showOwnerLink={canAccessOwnerDashboard(currentUser)} />
              <SiteNav />
              <main id="main-content" className="relative">
                {children}
              </main>
              <SiteFooter />
            </div>
          </PromptifyStoreProvider>
        </AuthProvider>
        {shouldEnableVercelTelemetry ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
