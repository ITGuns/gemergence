import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ArrowRight, Check, Minus } from "@/components/icons";
import { RevenueCalculator } from "@/components/calculator";
import { PRICING_PAGE, FUEL } from "@/lib/content";
import { CHECKOUT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing — real prices, published",
  description:
    "Gemfield plans: Foundation $497/mo, Growth $997/mo, Scale from $1,497/mo, Strategic from $3,500/mo — website build included, month-to-month, you own everything. Website-only builds from $3,000.",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PRICING_PAGE.faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="pb-12 pt-32 md:pt-40">
        <div className="container-g max-w-3xl">
          <Reveal>
            <p className="eyebrow">{PRICING_PAGE.eyebrow}</p>
            <h1 className="font-display h1 mt-5 !text-[clamp(2.2rem,4.4vw,3.6rem)]">
              {PRICING_PAGE.h}
            </h1>
            <p className="measure mt-6 text-[1.05rem] leading-relaxed text-ink2">
              {PRICING_PAGE.body}
            </p>
          </Reveal>
        </div>
      </section>

      <section>
        <div className="container-g">
          <div className="grid gap-5 lg:grid-cols-2">
            {PRICING_PAGE.tiers.map((t, i) => (
              <Reveal key={t.name} delay={Math.min(i * 60, 180)}>
                <article
                  className={`flex h-full flex-col rounded-xl border bg-white p-7 ${
                    t.highlight ? "border-emerald" : "border-hairline"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-[1.6rem]">{t.name}</h2>
                    {t.highlight && (
                      <span className="mono-num rounded-full bg-tint px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-emerald-deep">
                        Most chosen
                      </span>
                    )}
                  </div>
                  <p className="mt-3">
                    {t.price.startsWith("From ") ? (
                      <>
                        <span className="mr-2 text-[1rem] font-medium text-ink2">From</span>
                        <span className="mono-num whitespace-nowrap text-[2rem] font-semibold">
                          {t.price.slice(5)}
                        </span>
                      </>
                    ) : (
                      <span className="mono-num text-[2rem] font-semibold">{t.price}</span>
                    )}
                    <span className="text-ink2">{t.period}</span>
                  </p>
                  <p className="mt-1 text-[0.92rem] font-semibold text-emerald-deep">{t.bestFor}</p>
                  <p className="mt-4 text-[0.95rem] leading-relaxed text-ink2">{t.copy}</p>

                  <div className="mt-6 grid flex-1 gap-6 border-t border-hairline pt-6 sm:grid-cols-2">
                    <div>
                      <h3 className="eyebrow !text-ink2">Included</h3>
                      <ul className="mt-3 space-y-2">
                        {t.includes.map((f) => (
                          <li key={f} className="flex gap-2 text-[0.88rem] leading-snug">
                            <Check size={14} className="mt-0.5 shrink-0 text-emerald" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {t.notIncludes.length > 0 && (
                      <div>
                        <h3 className="eyebrow !text-ink2">Not included</h3>
                        <ul className="mt-3 space-y-2">
                          {t.notIncludes.map((f) => (
                            <li key={f} className="flex gap-2 text-[0.88rem] leading-snug text-ink2">
                              <Minus size={14} className="mt-0.5 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Fixed-price tiers with a Square link let visitors subscribe
                      on the spot; the audit stays available as a softer path.
                      Custom "From $…" tiers keep the quote flow only. */}
                  {CHECKOUT[t.name] ? (
                    <div className="mt-7">
                      <a
                        href={CHECKOUT[t.name] as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`btn w-full justify-center ${t.highlight ? "btn-primary" : "btn-ghost"}`}
                      >
                        Subscribe — {t.price}
                        {t.period}
                        <ArrowRight size={15} />
                      </a>
                      <Link
                        href="/audit"
                        className="link-arrow mt-3 justify-center text-[0.9rem]"
                      >
                        Prefer a call first? Start with a free audit
                        <ArrowRight size={13} />
                      </Link>
                      <Link
                        href={`/intake?plan=${t.name.toLowerCase()}`}
                        className="mt-2 block text-center text-[0.82rem] text-ink2 underline-offset-2 hover:underline"
                      >
                        Already subscribed? Complete your 2-minute intake
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href="/audit"
                      className={`btn mt-7 w-full justify-center ${t.highlight ? "btn-primary" : "btn-ghost"}`}
                    >
                      Start with the audit
                      <ArrowRight size={15} />
                    </Link>
                  )}
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-5" delay={100}>
            <article className="flex flex-col items-start justify-between gap-5 rounded-xl border border-hairline bg-white p-7 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <h2 className="font-display text-[1.6rem]">{PRICING_PAGE.websiteOnly.name}</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink2">
                  {PRICING_PAGE.websiteOnly.copy}
                </p>
              </div>
              <div className="shrink-0 lg:text-right">
                <p className="mono-num text-[1.7rem] font-semibold">{PRICING_PAGE.websiteOnly.price}</p>
                <p className="text-[0.9rem] text-ink2">{PRICING_PAGE.websiteOnly.period}</p>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      <section>
        <div className="container-g section-pad grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <h2 className="font-display h2">{PRICING_PAGE.addons.h}</h2>
            <p className="mt-4 leading-relaxed text-ink2">{PRICING_PAGE.addons.body}</p>
            <div className="mt-8 rounded-xl border border-emerald/25 bg-tint p-6">
              <h3 className="font-display text-[1.25rem]">{PRICING_PAGE.fuel.h}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed">{PRICING_PAGE.fuel.body}</p>
              <ul className="mt-4 space-y-1.5 text-[0.92rem] font-medium">
                {FUEL.channels.map((c) => (
                  <li key={c.name} className="flex gap-2">
                    <Check size={15} className="mt-1 shrink-0 text-emerald" />
                    {c.name}
                  </li>
                ))}
              </ul>
              <Link href="/marketing" className="link-arrow mt-5 text-[0.95rem]">
                How Growth Fuel works
                <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
          <Reveal className="lg:col-span-6 lg:col-start-7" delay={120}>
            <dl className="grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-2">
              {PRICING_PAGE.addons.items.map((a) => (
                <div key={a.name} className="bg-paper p-5">
                  <dt className="font-bold">{a.name}</dt>
                  <dd className="mt-1 text-[0.9rem] leading-relaxed text-ink2">{a.copy}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-hairline bg-surface">
        <div className="container-g section-pad grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <RevenueCalculator />
          </Reveal>
          <Reveal className="lg:col-span-5 lg:col-start-8" delay={120}>
            <h2 className="font-display h2">Fair questions.</h2>
            <div className="faq mt-6">
              {PRICING_PAGE.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
            <Link href="/audit" className="btn btn-primary mt-8">
              Get a Free Growth Audit
              <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
