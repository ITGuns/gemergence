import Link from "next/link";
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
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="container-g section-pad-sm">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Wordmark />
            <p className="measure mt-5 text-[0.95rem] leading-relaxed text-ink2">
              {FOOTER.description}
            </p>
            <p className="eyebrow mt-6 !text-ink2">{FOOTER.location}</p>
            {SITE.phone && (
              <a href={`tel:${SITE.phone}`} className="mt-2 block font-semibold">
                {SITE.phoneDisplay ?? SITE.phone}
              </a>
            )}
            <a
              href={`mailto:${SITE.email}`}
              className="mt-2 block text-[0.95rem] font-medium text-emerald"
            >
              {SITE.email}
            </a>
          </div>

          <nav className="md:col-span-3" aria-label="Footer">
            <h2 className="eyebrow !text-ink2">Explore</h2>
            <ul className="mt-4 space-y-2.5">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[0.95rem] font-medium text-ink transition-colors hover:text-emerald"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <h2 className="eyebrow !text-ink2">In one sentence</h2>
            <dl className="mt-4 space-y-4">
              {FOOTER.explainers.map((e) => (
                <div key={e.k}>
                  <dt className="text-[0.92rem] font-bold">{e.k}</dt>
                  <dd className="mt-0.5 text-[0.9rem] leading-relaxed text-ink2">
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

        <div className="mt-14 flex flex-col gap-3 border-t border-hairline pt-6 text-[0.85rem] text-ink2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Gemfield Consulting. All rights reserved.</p>
          <p className="flex gap-5">
            {SITE.social.map((s) => (
              <a key={s.label} href={s.href} className="hover:text-ink" target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ))}
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
