import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://crm.valinorgrp.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Pipeline — Sales CRM", template: "%s · Pipeline" },
  description: "Valinor Group's sales and operations CRM: pipeline, quotes, orders, dispatch and team.",
  applicationName: "Pipeline",
  // A private, sign-in-only app: keep it out of search results.
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "Pipeline by Valinor Group",
    title: "Pipeline — Sales CRM",
    description: "Sign in to Valinor Group's sales and operations CRM.",
  },
};

export const viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  // No maximumScale: people must be able to pinch-zoom (WCAG 1.4.4). Inputs
  // use 16px text on phones instead, which is what stops iOS auto-zooming.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        {children}
        {/* Vercel Web Analytics: cookieless page-view counts, no personal
            data. Does nothing until Analytics is enabled for the project in
            the Vercel dashboard (the script 404s harmlessly until then). */}
        {process.env.NODE_ENV === "production" && process.env.VERCEL && (
          <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
