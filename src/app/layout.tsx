import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/constants";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
});

const jbmono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Gemfield Consulting — Growth systems for service businesses",
    template: "%s — Gemfield Consulting",
  },
  description:
    "Your website should be a growth system, not a brochure. Gemfield builds and manages the digital infrastructure service businesses need to get found, capture leads, follow up faster, and turn attention into revenue.",
  openGraph: {
    siteName: SITE.name,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

// AEO: machine-readable entity description (SITE-PLAN §8).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: SITE.name,
  url: SITE.url,
  email: SITE.email,
  description:
    "Gemfield Consulting builds and manages digital growth systems for service businesses: conversion-focused websites, local SEO and AI-search visibility (AEO/GEO), lead capture, follow-up automation, review systems, reporting through the Deskii client command center, and custom tools.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    addressCountry: "US",
  },
  areaServed: { "@type": "Country", name: "United States" },
  priceRange: "$497–$3,500+/month",
  knowsAbout: [
    "Website design and development",
    "Local SEO",
    "AI search optimization (AEO, GEO)",
    "Lead capture and follow-up automation",
    "Review and reputation systems",
    "Google Ads and Local Services Ads",
    "Client reporting dashboards",
  ],
  sameAs: SITE.social.map((s) => s.href),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the inline script below adds the `js` class
    // to <html> before hydration (required so reveal styles never hide
    // content from no-JS visitors), which React would otherwise flag.
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} ${jbmono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Gate reveal-hidden styles on JS availability — must run before paint. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
