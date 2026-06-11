import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ArrowRight, Check } from "@/components/icons";
import { MARKETING_PAGE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Marketing — Growth Fuel for service businesses",
  description:
    "Google Ads, Local Services Ads, Meta advertising, retargeting, email & SMS campaigns, and social content — run on top of a growth system built to convert, with flat fees and results reported in Deskii.",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: MARKETING_PAGE.faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function MarketingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="pb-16 pt-32 md:pt-40">
        <div className="container-g grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="eyebrow">{MARKETING_PAGE.eyebrow}</p>
              <h1 className="font-display h1 mt-5 !text-[clamp(2.2rem,4.4vw,3.6rem)]">
                {MARKETING_PAGE.h}
              </h1>
              <p className="measure mt-6 text-[1.05rem] leading-relaxed text-ink2">
                {MARKETING_PAGE.body}
              </p>
              <Link href="/audit" className="btn btn-primary mt-8">
                {MARKETING_PAGE.cta}
                <ArrowRight size={15} />
              </Link>
            </Reveal>
          </div>
          <Reveal className="lg:col-span-4 lg:col-start-9" delay={140}>
            <div className="rounded-xl border border-hairline bg-surface p-6">
              <h2 className="font-display text-[1.3rem]">{MARKETING_PAGE.philosophy.h}</h2>
              <ul className="mt-4 space-y-3">
                {MARKETING_PAGE.philosophy.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[0.92rem] leading-relaxed text-ink2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="container-g section-pad">
          <Reveal>
            <h2 className="font-display h2 max-w-2xl">The channels, and how each one reports.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {MARKETING_PAGE.channels.map((c, i) => (
              <Reveal key={c.name} delay={Math.min(i * 60, 240)}>
                <div className="hairline-card flex h-full flex-col p-6">
                  <h3 className="text-[1.05rem] font-bold">{c.name}</h3>
                  <p className="mt-2 flex-1 text-[0.93rem] leading-relaxed text-ink2">{c.copy}</p>
                  <p className="mono-num mt-4 border-t border-hairline pt-3 text-[0.78rem] text-emerald-deep">
                    {c.measure}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container-g section-pad grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <h2 className="font-display h2 text-white">{MARKETING_PAGE.fees.h}</h2>
            <ul className="mt-7 space-y-4">
              {MARKETING_PAGE.fees.points.map((p) => (
                <li key={p} className="flex gap-3 text-[1rem] leading-relaxed">
                  <Check size={17} className="mt-1 shrink-0 text-[#7fc8ad]" />
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="lg:col-span-5 lg:col-start-8" delay={120}>
            <div className="rounded-xl border border-band-line bg-[#141d17] p-6">
              <p className="eyebrow !text-[#7fc8ad]">Eligibility</p>
              <p className="mt-3 leading-relaxed text-band-mut">{MARKETING_PAGE.eligibility}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section>
        <div className="container-g section-pad-sm max-w-4xl">
          <Reveal>
            <h2 className="font-display h2">Fair questions.</h2>
            <div className="faq mt-8">
              {MARKETING_PAGE.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
            <Link href="/audit" className="btn btn-primary mt-10">
              {MARKETING_PAGE.cta}
              <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
