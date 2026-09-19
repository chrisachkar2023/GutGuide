import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BottomNav, TopNav } from "@/components/layout/app-nav";
import { GuestBanner } from "@/components/layout/guest-banner";
import { getActiveUser } from "@/lib/auth/session";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: {
    default: "GutGuide — food guidance that learns from you",
    template: "%s · GutGuide",
  },
  description:
    "Crohn's is personal, so food guidance should be personal too. GutGuide learns from your own meals and symptoms to estimate how foods tend to sit with you.",
};

export const viewport: Viewport = {
  themeColor: "#fdfbf7",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Signed out, the only reachable pages are sign in and sign up, which carry
  // their own layout — so the app chrome stays off.
  const actor = await getActiveUser();

  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-moss-600 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        {actor && (
          <>
            {actor.kind === "guest" && <GuestBanner />}
            <TopNav
              accountName={actor.kind === "user" ? actor.name : "Guest"}
              accountEmail={actor.kind === "user" ? actor.email : undefined}
              isGuest={actor.kind === "guest"}
            />
          </>
        )}
        <main
          id="main"
          className={cn(
            "mx-auto w-full max-w-6xl px-4 sm:px-6",
            actor ? "pb-28 pt-6 lg:pb-16" : "py-6",
          )}
        >
          {children}
        </main>
        {actor && <BottomNav />}
      </body>
    </html>
  );
}
