import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "AEO Diagnostic — Answer Engine Optimization",
  description:
    "When shoppers ask AI for product recommendations, how often does your brand show up? Diagnose your AEO score across GPT and Gemini.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans">
        <SiteHeader />
        <main className="flex-1 w-full mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="border-t border-ink-200 py-6 mt-auto">
          <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-400">
            <span>AEO Diagnostic · Built for Pixii</span>
            <span className="flex items-center gap-3">
              <span>Powered by</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                OpenAI
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Gemini
              </span>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
