import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/navigation/site-nav";
import SiteFooter from "@/components/navigation/site-footer";
import { PromptForgeStoreProvider } from "@/lib/storage/manager";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sourceCode = Source_Code_Pro({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://promptforge.app"),
  title: {
    default: "PromptForge",
    template: "%s | PromptForge",
  },
  description:
    "Refine rough prompts into high-performing, structured prompts for AI systems with local-only engine generation.",
  keywords: [
    "prompt engineering",
    "prompt tool",
    "AI prompts",
    "ChatGPT",
    "Claude",
    "prompt optimization",
  ],
  alternates: {
    canonical: "https://promptforge.app/",
  },
  openGraph: {
    title: "PromptForge",
    description: "Turn your raw ideas into copy-ready AI prompts.",
    type: "website",
    url: "https://promptforge.app",
    images: [
      {
        url: "https://promptforge.app/og.png",
        width: 1200,
        height: 630,
        alt: "PromptForge workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptForge",
    description: "Turn your rough prompt into a structured execution-ready instruction set.",
    images: ["https://promptforge.app/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sourceCode.variable} antialiased`}>
        <PromptForgeStoreProvider>
          <div className="pf-shell min-h-screen text-slate-900">
            <SiteNav />
            <main className="relative">{children}</main>
            <SiteFooter />
          </div>
        </PromptForgeStoreProvider>
      </body>
    </html>
  );
}
