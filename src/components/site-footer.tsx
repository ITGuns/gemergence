"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./logo";
import { ArrowRight } from "./icons";
import { SITE } from "@/lib/constants";
import { FOOTER } from "@/lib/content";

const LINKS = [
  { label: "Services", href: "/#system" },
  { label: "Marketing", href: "/marketing" },
  { label: "Industries", href: "/#industries" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Deskii", href: "/deskii" },
  { label: "About", href: "/about" },
];

export function SiteFooter() {
  // The immersive journey at "/" runs dark; the footer follows it.
  const dark = usePathname() === "/";
  const mut = dark ? "text-band-mut" : "text-ink2";
  const strong = dark ? "text-band-ink" : "text-ink";
  const accent = dark ? "text-[#7fc8ad]" : "text-emerald";
  const line = dark ? "border-band-line" : "border-hairline";

  return (
    <footer className={`${dark ? "on-dark-focus border-t border-band-line bg-[#0a0f0c] text-band-ink" : "border-t border-hairline bg-surface"}`}>
      <div className="container-g section-pad-sm">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Wordmark dark={dark} />
            <p className={`measure mt-5 text-[0.95rem] leading-relaxed ${mut}`}>
              {FOOTER.description}
            </p>
            <p className={`eyebrow mt-6 ${dark ? "!text-band-mut" : "!text-ink2"}`}>{FOOTER.location}</p>
            {SITE.phone && (
              <a href={`tel:${SITE.phone}`} className={`mt-2 block font-semibold ${strong}`}>
                {SITE.phoneDisplay ?? SITE.phone}
              </a>
            )}
            <a
              href={`mailto:${SITE.email}`}
              className={`mt-2 block text-[0.95rem] font-medium ${accent}`}
            >
              {SITE.email}
            </a>
          </div>

          <nav className="md:col-span-3" aria-label="Footer">
            <h2 className={`eyebrow ${dark ? "!text-band-mut" : "!text-ink2"}`}>Explore</h2>
            <ul className="mt-4 space-y-2.5">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className={`text-[0.95rem] font-medium transition-colors ${strong} ${dark ? "hover:text-[#7fc8ad]" : "hover:text-emerald"}`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <h2 className={`eyebrow ${dark ? "!text-band-mut" : "!text-ink2"}`}>In one sentence</h2>
            <dl className="mt-4 space-y-4">
              {FOOTER.explainers.map((e) => (
                <div key={e.k}>
                  <dt className={`text-[0.92rem] font-bold ${strong}`}>{e.k}</dt>
                  <dd className={`mt-0.5 text-[0.9rem] leading-relaxed ${mut}`}>
                    {e.v}
                  </dd>
                </div>
              ))}
            </dl>
            <Link href="/audit" className="btn btn-primary mt-7">
              Get a Free Growth Audit
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className={`mt-14 flex flex-col gap-3 border-t pt-6 text-[0.85rem] ${line} ${mut} sm:flex-row sm:items-center sm:justify-between`}>
          <p>© {new Date().getFullYear()} Gemfield Consulting. All rights reserved.</p>
          <p className="flex gap-5">
            {SITE.social.map((s) => (
              <a key={s.label} href={s.href} className={dark ? "hover:text-white" : "hover:text-ink"} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ))}
            <Link href="/privacy" className={dark ? "hover:text-white" : "hover:text-ink"}>
              Privacy
            </Link>
            <Link href="/terms" className={dark ? "hover:text-white" : "hover:text-ink"}>
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
