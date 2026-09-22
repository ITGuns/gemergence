import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VersionSwitcher } from "@/components/version-switcher";
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
    default: "Gemfield Consulting — Websites and booking systems for restaurants",
    template: "%s — Gemfield Consulting",
  },
  description:
    "Your website should fill tables, not just exist. Gemfield builds and runs the website, the menu you change from your phone, and the booking system that takes reservations while you are on the floor. For restaurants, bars and taphouses. Live in a week.",
  openGraph: {
    siteName: SITE.name,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

// AEO: machine-readable entity description.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: SITE.name,
  url: SITE.url,
  email: SITE.email,
  description:
    "Gemfield Consulting builds and runs digital systems for restaurants, bars and taphouses: fast phone-first websites, a menu control panel the owner updates themselves, live booking with a table selector, missed-call text back, review engine, Google and Yelp listings, online ordering the restaurant keeps the margin on, POS connection, and reporting through the Deskii control panel.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    addressCountry: "US",
  },
  areaServed: { "@type": "Country", name: "United States" },
  priceRange: "$197–$3,500+/month",
  knowsAbout: [
    "Restaurant website design and development",
    "Online table booking and reservation systems",
    "Restaurant menu management",
    "Local SEO for restaurants",
    "AI search optimization (AEO, GEO)",
    "Missed-call text back and guest follow-up",
    "Review and reputation systems",
    "Online food ordering and POS integration",
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
        {/* Gate reveal-hidden styles on JS availability — must run before paint.
            The timer is the failsafe: `js` hides every section at opacity 0 and
            only the Reveal effect ever un-hides them, so a bundle that never
            runs used to leave the whole page blank. Reveal clears this on mount;
            if it doesn't, `reveal-off` drops the hidden state after 3s. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');" +
              "window.__gfRevealFailsafe=setTimeout(function(){document.documentElement.classList.add('reveal-off')},3000)",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <VersionSwitcher />
      </body>
    </html>
  );
}
