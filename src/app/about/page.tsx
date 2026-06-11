import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ArrowRight } from "@/components/icons";
import { ABOUT_PAGE, OWNERSHIP, WHY } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Gemfield Consulting — operators who build and manage digital growth systems for service businesses. Based in San Francisco, serving the United States.",
};

export default function AboutPage() {
  return (
    <>
      <section className="pb-16 pt-32 md:pt-40">
        <div className="container-g grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="eyebrow">{ABOUT_PAGE.eyebrow}</p>
              <h1 className="font-display h1 mt-5 !text-[clamp(2.2rem,4.4vw,3.6rem)]">
                {ABOUT_PAGE.h}
              </h1>
              <p className="measure mt-6 text-[1.05rem] leading-relaxed text-ink2">
                {ABOUT_PAGE.body}
              </p>
              <p className="eyebrow mt-8 !text-ink2">{ABOUT_PAGE.location}</p>
            </Reveal>
          </div>
          <Reveal className="lg:col-span-4 lg:col-start-9" delay={140}>
            {/* Founder block — placeholder content (SITE-PLAN §11): swap when provided. */}
            <div className="hairline-card p-7">
              <div
                className="flex h-44 w-full items-center justify-center rounded-lg bg-tint"
                aria-hidden="true"
              >
                <span className="font-display text-[3rem] text-emerald">G</span>
              </div>
              <p className="font-display mt-6 text-[1.25rem]">{WHY.founder.name}</p>
              <p className="mt-2 leading-relaxed text-ink2">&ldquo;{WHY.founder.line}&rdquo;</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="container-g section-pad">
          <Reveal>
            <h2 className="font-display h2 max-w-2xl">How we operate.</h2>
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-2">
            {ABOUT_PAGE.principles.map((p, i) => (
              <Reveal key={p.k} delay={Math.min(i * 60, 240)}>
                <div className="h-full bg-paper p-7">
                  <h3 className="font-display text-[1.35rem]">{p.k}</h3>
                  <p className="mt-3 leading-relaxed text-ink2">{p.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container-g section-pad grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{OWNERSHIP.eyebrow}</p>
            <h2 className="font-display h2 mt-4">{OWNERSHIP.h}</h2>
            <p className="mt-6 text-[1.02rem] font-medium text-emerald-deep">{OWNERSHIP.kicker}</p>
            <Link href="/audit" className="btn btn-primary mt-8">
              Get a Free Growth Audit
              <ArrowRight size={15} />
            </Link>
          </Reveal>
          <Reveal className="lg:col-span-6 lg:col-start-7" delay={120}>
            <dl>
              {OWNERSHIP.declarations.map((d) => (
                <div
                  key={d.k}
                  className="grid gap-1 border-t border-hairline py-4 sm:grid-cols-[170px_1fr] sm:gap-6"
                >
                  <dt className="font-bold">{d.k}</dt>
                  <dd className="text-ink2">{d.v}</dd>
                </div>
              ))}
            </dl>
            <p className="measure mt-6 border-t border-hairline pt-6 text-[0.95rem] leading-relaxed text-ink2">
              {OWNERSHIP.terms}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
