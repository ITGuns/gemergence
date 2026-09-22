import type { Metadata } from "next";
import { OctoberPromoBanner, FrontDoorPromoBadge, FrontDoorPromoLine } from "@/components/october-promo";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ArrowRight, Check, Minus } from "@/components/icons";
import { RESTAURANTS_PAGE as R, isRestaurantPromoLive, type TableCell } from "@/lib/content";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing — real prices, published",
  description:
    "Gemfield plans for restaurants, bars and taphouses: Front Door $197/mo, Foundation $497/mo, Growth $997/mo, Scale from $1,497/mo, Strategic from $3,500/mo. A menu you control from your phone, bookings that arrive during service, and ordering you keep the margin on.",
};

// The October banner and the two October mentions inside the copy are
// date-gated. The page is otherwise static, so revalidate hourly and the
// offer comes down on 1 November without waiting for the next deploy.
export const revalidate = 3600;

/* Structured data. Deliberately NOT schema.org/Restaurant: this page is a
   Gemfield service page, not a restaurant, and typing it as one would
   misrepresent the page's main entity. Service + audience carries the same
   meaning to search and AI assistants, truthfully. */
function offerFor(name: string, description: string, price: string) {
  const from = price.startsWith("From ");
  const amount = Number(price.replace(/[^0-9]/g, ""));
  return {
    "@type": "Offer",
    name,
    description,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      ...(from ? { minPrice: amount } : { price: amount }),
      priceCurrency: "USD",
      unitText: "MON",
    },
  };
}

function buildJsonLd(promoLive: boolean) {
  const faq = [...R.faq.items, promoLive ? R.faq.promoItem : R.faq.standardBookingItem];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${SITE.url}/pricing#service`,
        name: "Restaurant websites, booking and ordering systems",
        serviceType: "Restaurant website and booking system",
        url: `${SITE.url}/pricing`,
        description: R.hero.sub,
        provider: { "@type": "ProfessionalService", name: SITE.name, url: SITE.url },
        areaServed: { "@type": "Country", name: SITE.served },
        audience: {
          "@type": "BusinessAudience",
          name: "Restaurants, bars and taphouses",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Restaurant plans",
          itemListElement: [
            ...R.table.tiers.map((t) => offerFor(t.name, t.oneLine, t.price)),
            offerFor(R.strategic.name, R.strategic.note, R.strategic.price),
          ],
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}

/** Sets only the money in mono numerals; "From" and "a month" stay in the body
 *  face, so a price does not read as one long code span. Matches /pricing. */
function Money({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\$[\d,]+)/).map((part, i) =>
        part.startsWith("$") ? (
          <span key={i} className="mono-num whitespace-nowrap font-semibold">
            {part}
          </span>
        ) : (
          <span key={i} className="font-medium">
            {part}
          </span>
        )
      )}
    </>
  );
}

/** One comparison cell. "No" becomes a dash with the word kept for screen
 *  readers; emphasised cells are the reason someone buys that tier. */
function Cell({ cell }: { cell: TableCell }) {
  const value = typeof cell === "string" ? cell : cell.v;
  const strong = typeof cell !== "string";

  if (value === "No") {
    return (
      <span className="inline-flex text-ink2/60">
        <Minus size={15} />
        <span className="sr-only">No</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-start gap-1.5 ${
        strong ? "font-semibold text-ink" : "text-ink2"
      }`}
    >
      {value.startsWith("Yes") && (
        <Check size={15} className={`mt-[0.25em] shrink-0 ${strong ? "text-emerald" : "text-emerald/60"}`} />
      )}
      <span>{value}</span>
    </span>
  );
}

export default function RestaurantsPage() {
  const promoLive = isRestaurantPromoLive();
  // 1 November swaps the offer question for the standard Front Door booking
  // answer rather than leaving the FAQ silent on how booking works there.
  const faqItems = [...R.faq.items, promoLive ? R.faq.promoItem : R.faq.standardBookingItem];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(promoLive)) }}
      />

      {/* 1 — HERO */}
      <section className="pb-14 pt-32 md:pt-40">
        <div className="container-g max-w-4xl">
          <Reveal>
            <p className="eyebrow">{R.hero.eyebrow}</p>
            <h1 className="font-display h1 mt-5 !text-[clamp(2.2rem,4.6vw,3.8rem)]">
              {R.hero.h}
            </h1>
            <p className="measure mt-6 text-[1.12rem] leading-relaxed text-ink2">{R.hero.sub}</p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link href="#plans" className="btn btn-primary !px-7 !py-4 text-[1.02rem]">
                {R.hero.primaryCta}
                <ArrowRight size={16} />
              </Link>
              <a
                href={SITE.calendly}
                target="_blank"
                rel="noopener noreferrer"
                className="link-arrow text-[0.98rem]"
              >
                {R.hero.secondaryCta}
                <ArrowRight size={15} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2 — OCTOBER PROMOTION. Full width, directly under the hero. The
          component self-gates on the offer window, as do the Front Door badge,
          the detail paragraph and the FAQ entry — all four come down together
          on 1 November. */}
      <OctoberPromoBanner />

      {/* 3 — THE FOUR PROBLEMS */}
      <section className="section-pad-sm">
        <div className="container-g">
          <Reveal className="max-w-3xl">
            <p className="eyebrow">{R.problems.eyebrow}</p>
            <h2 className="font-display h2 mt-4">{R.problems.h}</h2>
          </Reveal>
          <div className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {R.problems.cards.map((c, i) => (
              <Reveal key={c.h} delay={i * 60} className="border-t border-ink/15 pt-4">
                <p className="mono-num text-[0.8rem] font-medium text-emerald">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="font-display mt-2 text-[1.3rem]">{c.h}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink2">{c.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — TIER TABLE */}
      <section className="section-pad bg-surface" id="plans">
        <div className="container-g">
          <Reveal className="max-w-3xl">
            <p className="eyebrow">{R.table.eyebrow}</p>
            <h2 className="font-display h2 mt-4">{R.table.h}</h2>
          </Reveal>

          {/* Desktop: one comparison grid. */}
          <Reveal className="mt-12 hidden lg:block" delay={80}>
            <div className="overflow-hidden rounded-xl border border-hairline bg-white">
              <table className="w-full border-collapse text-left text-[0.9rem]">
                <caption className="sr-only">
                  Restaurant plans compared, feature by feature
                </caption>
                <thead>
                  <tr className="border-b border-hairline align-bottom">
                    <th scope="col" className="w-[19%] p-5">
                      <span className="sr-only">Feature</span>
                    </th>
                    {R.table.tiers.map((t) => {
                      const flagged = promoLive && t.name === R.table.recommendedDuringPromo;
                      return (
                        <th
                          key={t.name}
                          scope="col"
                          className={`p-5 align-bottom ${flagged ? "bg-tint" : ""}`}
                        >
                          {flagged && (
                            <span className="mb-2 block">
                              <FrontDoorPromoBadge dark />
                            </span>
                          )}
                          <span className="font-display block text-[1.35rem]">{t.name}</span>
                          <span className="mt-1 block text-[1.35rem]">
                            <Money text={t.price} />
                            <span className="text-[1rem] font-medium text-ink2">{t.period}</span>
                          </span>
                          {flagged && <FrontDoorPromoLine />}
                          <span className="mt-1.5 block text-[0.85rem] font-semibold text-emerald-deep">
                            {t.oneLine}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-hairline">
                    <th scope="row" className="p-5 font-semibold">
                      Live in
                    </th>
                    {R.table.tiers.map((t) => (
                      <td
                        key={t.name}
                        className={`p-5 ${
                          promoLive && t.name === R.table.recommendedDuringPromo ? "bg-tint" : ""
                        }`}
                      >
                        <span className={t.liveInEm ? "font-semibold text-ink" : "text-ink2"}>
                          {t.liveIn}
                        </span>
                      </td>
                    ))}
                  </tr>
                  {R.table.rows.map((row) => (
                    <tr key={row.label} className="border-b border-hairline last:border-0">
                      <th scope="row" className="p-5 font-semibold">
                        {row.label}
                      </th>
                      {row.cells.map((cell, i) => (
                        <td
                          key={R.table.tiers[i].name}
                          className={`p-5 ${
                            promoLive && R.table.tiers[i].name === R.table.recommendedDuringPromo
                              ? "bg-tint"
                              : ""
                          }`}
                        >
                          <Cell cell={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          {/* Mobile: stacked by tier, not by feature row — an owner reads one
              plan at a time, not one row across four plans. */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:hidden">
            {R.table.tiers.map((t, ti) => {
              const flagged = promoLive && t.name === R.table.recommendedDuringPromo;
              return (
                <Reveal key={t.name} delay={Math.min(ti * 60, 180)}>
                  <article
                    className={`flex h-full flex-col rounded-xl border bg-white p-6 ${
                      flagged ? "border-emerald" : "border-hairline"
                    }`}
                  >
                    {flagged && (
                      <span className="mb-3 self-start">
                        <FrontDoorPromoBadge />
                      </span>
                    )}
                    <h3 className="font-display text-[1.5rem]">{t.name}</h3>
                    <p className="mt-2 text-[1.7rem]">
                      <Money text={t.price} />
                      <span className="text-[1rem] font-medium text-ink2">{t.period}</span>
                    </p>
                    {flagged && <FrontDoorPromoLine />}
                    <p className="mt-1 text-[0.9rem] font-semibold text-emerald-deep">{t.oneLine}</p>
                    <dl className="mt-5 border-t border-hairline text-[0.88rem]">
                      <div className="flex justify-between gap-4 border-b border-hairline py-2.5">
                        <dt className="font-semibold">Live in</dt>
                        <dd className={`text-right ${t.liveInEm ? "font-semibold" : "text-ink2"}`}>
                          {t.liveIn}
                        </dd>
                      </div>
                      {R.table.rows.map((row) => (
                        <div
                          key={row.label}
                          className="flex justify-between gap-4 border-b border-hairline py-2.5 last:border-0"
                        >
                          <dt className="font-semibold">{row.label}</dt>
                          <dd className="text-right">
                            <Cell cell={row.cells[ti]} />
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                </Reveal>
              );
            })}
          </div>

          {/* Strategic sits below the table as its own block, not a fifth
              column, and publishes no list price. */}
          <Reveal className="mt-5" delay={120}>
            <article className="flex flex-col gap-6 rounded-xl border border-hairline bg-white p-7 lg:flex-row lg:items-start lg:gap-10">
              <div className="shrink-0 lg:w-56">
                <h3 className="font-display text-[1.6rem]">{R.strategic.name}</h3>
                <p className="mt-2 text-[1.2rem]">
                  <Money text={R.strategic.price} />
                </p>
                <p className="mt-2 text-[0.88rem] font-semibold text-emerald-deep">
                  {R.strategic.note}
                </p>
              </div>
              <div className="max-w-3xl space-y-4">
                {R.strategic.paras.map((p) => (
                  <p key={p} className="text-[0.95rem] leading-relaxed text-ink2">
                    {p}
                  </p>
                ))}
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* 5 — TIER DETAIL, one section each */}
      <section className="section-pad">
        <div className="container-g space-y-16">
          {R.detail.map((t, i) => (
            <Reveal key={t.name} delay={i === 0 ? 0 : 60}>
              <div className="grid gap-8 border-t border-ink/15 pt-7 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <h2 className="font-display text-[1.9rem]">{t.name}</h2>
                  <p className="mt-1 text-[1.05rem] text-emerald-deep">
                    <Money text={t.price} />
                  </p>
                  <p className="mt-5 text-[0.88rem] leading-relaxed text-ink2">
                    <span className="block font-semibold text-ink">Who it is for</span>
                    {t.whoFor}
                  </p>
                </div>
                <div className="lg:col-span-7 lg:col-start-6">
                  {t.paras.map((p) => (
                    <p key={p} className="measure mb-4 leading-relaxed text-ink2">
                      {p}
                    </p>
                  ))}

                  {t.bullets.length > 0 && (
                    <ul className="mt-6 space-y-4">
                      {t.bullets.map((b) => (
                        <li key={b.h} className="flex gap-3">
                          <Check size={16} className="mt-1.5 shrink-0 text-emerald" />
                          <p className="leading-relaxed text-ink2">
                            <strong className="font-semibold text-ink">{b.h}</strong> {b.copy}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {"closingPara" in t && t.closingPara && (
                    <p className="measure mt-6 leading-relaxed text-ink2">{t.closingPara}</p>
                  )}

                  {promoLive && "promoPara" in t && t.promoPara && (
                    <p className="measure mt-6 rounded-lg border border-emerald/25 bg-tint p-4 leading-relaxed">
                      <strong className="font-semibold">{t.promoPara.lead}</strong>{" "}
                      {t.promoPara.copy}
                    </p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 6 — WHAT WE DO NOT DO */}
      <section className="band section-pad-sm">
        <div className="container-g on-dark-focus grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow !text-[#7fc8ad]">{R.notDo.eyebrow}</p>
            <h2 className="font-display mt-3 text-[clamp(1.7rem,3vw,2.4rem)]">{R.notDo.h}</h2>
          </Reveal>
          <Reveal className="lg:col-span-7 lg:col-start-6" delay={100}>
            {R.notDo.paras.map((p) => (
              <p key={p} className="measure mb-4 leading-relaxed text-band-mut last:mb-0">
                {p}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 7 — FAQ */}
      <section className="section-pad">
        <div className="container-g grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <h2 className="font-display h2">{R.faq.h}</h2>
          </Reveal>
          <Reveal className="lg:col-span-7 lg:col-start-6" delay={100}>
            <div className="faq">
              {faqItems.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 8 — CLOSING CTA */}
      <section className="border-t border-hairline bg-surface section-pad-sm">
        <div className="container-g max-w-3xl text-center">
          <Reveal>
            <h2 className="font-display h2">{R.closing.h}</h2>
            <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-ink2">
              {promoLive ? R.closing.body : R.closing.bodyAfterPromo}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-5">
              <a
                href={SITE.calendly}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary !px-7 !py-4 text-[1.02rem]"
              >
                {R.closing.primaryCta}
                <ArrowRight size={16} />
              </a>
              <Link href="/" className="link-arrow text-[0.98rem]">
                {R.closing.secondaryCta}
                <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
