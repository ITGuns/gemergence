import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";
import { AuditForm } from "@/components/audit-form";
import { Reveal } from "@/components/reveal";
import {
  HERO, PROBLEM, SYSTEM, FUEL, DESKII, OFFER, OWNERSHIP,
  INDUSTRIES, PROCESS, PLANS, WHY, FINAL_CTA,
} from "@/lib/content";

/** Shared section header: eyebrow → display headline → measured body. */
function Header({ eyebrow, h, body, center = false }: { eyebrow: string; h: string; body?: string; center?: boolean }) {
  return (
    <Reveal className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="font-display h2 mt-4">{h}</h2>
      {body && <p className={`mt-5 text-[1.05rem] leading-relaxed text-ink2 ${center ? "mx-auto max-w-2xl" : "measure"}`}>{body}</p>}
    </Reveal>
  );
}

/** The daylight homepage — light, editorial, native scroll (design-brief v2). */
export default function DaylightHome() {
  return (
    <main>
      {/* 1 — HERO */}
      <section className="border-b border-hairline pb-16 pt-28 lg:pb-20 lg:pt-36">
        <div className="container-g grid items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <p className="eyebrow">{HERO.eyebrow}</p>
            <h1 className="font-display h1 mt-5">
              {HERO.h1a} <span className="text-emerald">{HERO.h1b}</span> {HERO.h1c}
            </h1>
            <p className="mt-6 max-w-xl text-[1.12rem] leading-relaxed text-ink2">{HERO.sub}</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link href="/audit" className="btn btn-primary !px-7 !py-4 text-[1.02rem]">
                {HERO.primaryCta}
                <ArrowRight size={16} />
              </Link>
              <Link href="/how-it-works" className="link-arrow text-[0.98rem]">
                {HERO.secondaryCta}
                <ArrowRight size={15} />
              </Link>
            </div>
            <ul className="mt-10 flex max-w-xl flex-wrap gap-x-6 gap-y-2.5 border-t border-hairline pt-5 text-[0.88rem] font-medium text-ink2">
              {HERO.trustPoints.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-emerald" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="relative lg:col-span-6" delay={120}>
            <div className="absolute -right-4 -top-4 bottom-10 left-10 rounded-2xl bg-tint" aria-hidden="true" />
            <Image
              src="/exhibits/site-summit-offer.jpg"
              alt="A Gemfield-built website for a home services client — clear headline, one call to action, reviews front and center"
              width={1024}
              height={702}
              priority
              className="relative rounded-xl border border-hairline shadow-[0_32px_64px_-24px_rgba(21,23,26,0.35)]"
            />
            <p className="mono-num relative mt-4 text-[0.78rem] tracking-wide text-ink2">
              A GEMFIELD BUILD — THE WEBSITE IS INCLUDED IN EVERY PLAN
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2 — PROBLEM */}
      <section className="section-pad-sm">
        <div className="container-g grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <p className="eyebrow">{PROBLEM.eyebrow}</p>
            <h2 className="font-display h2 mt-4">{PROBLEM.h}</h2>
            <p className="mt-5 max-w-xl leading-relaxed text-ink2">{PROBLEM.body}</p>
          </Reveal>
          <Reveal className="self-center lg:col-span-5 lg:col-start-8" delay={100}>
            <ul className="grid gap-x-8 sm:grid-cols-2">
              {PROBLEM.points.map((p, i) => (
                <li key={p} className="flex items-baseline gap-3 border-t border-hairline py-2.5">
                  <span className="mono-num text-[0.72rem] font-medium text-emerald">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[0.92rem] font-medium">{p}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 3 — SYSTEM */}
      <section className="section-pad bg-surface" id="system">
        <div className="container-g">
          <Header eyebrow={SYSTEM.eyebrow} h={SYSTEM.h} body={SYSTEM.body} />
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {SYSTEM.pillars.map((pl, i) => (
              <Reveal key={pl.n} delay={i * 60} className="border-t border-ink/15 pt-4">
                <p className="mono-num text-[0.8rem] font-medium text-emerald">{pl.n}</p>
                <h3 className="font-display mt-2 text-[1.3rem]">{pl.name}</h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-ink2">{pl.copy}</p>
              </Reveal>
            ))}
            <Reveal delay={7 * 60} className="flex items-end border-t border-ink/15 pt-4">
              <Link href="/how-it-works" className="link-arrow text-[0.95rem]">
                See how the pieces connect
                <ArrowRight size={14} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4 — GROWTH FUEL */}
      <section className="section-pad-sm">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow">{FUEL.eyebrow}</p>
            <h2 className="font-display h3 mt-3 !text-[1.7rem]">{FUEL.h}</h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink2">{FUEL.body}</p>
            <Link href="/marketing" className="link-arrow mt-5 text-[0.95rem]">
              {FUEL.cta}
              <ArrowRight size={14} />
            </Link>
          </Reveal>
          <Reveal className="self-center lg:col-span-7 lg:col-start-6" delay={100}>
            <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {FUEL.channels.map((c) => (
                <li key={c.name} className="border-t border-hairline pt-2.5">
                  <span className="block text-[0.92rem] font-bold">{c.name}</span>
                  <span className="text-[0.84rem] leading-snug text-ink2">{c.copy}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-l-2 border-emerald pl-4 text-[0.88rem] leading-relaxed">
              <span className="font-semibold">{FUEL.eligibility}</span>{" "}
              <span className="text-ink2">{FUEL.feeLine}</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5 — DESKII (the one dark moment: the product on its home turf) */}
      <section className="band blueprint section-pad">
        <div className="container-g grid items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow !text-[#7fc8ad]">{DESKII.eyebrow}</p>
            <h2 className="font-display h2 mt-4 text-white">{DESKII.h}</h2>
            <p className="mt-5 leading-relaxed text-band-mut">{DESKII.body}</p>
            <ul className="mt-7">
              {DESKII.features.map((f) => (
                <li key={f.name} className="border-t border-band-line py-2.5 text-[0.92rem] leading-snug">
                  <span className="font-bold text-band-ink">{f.name}</span>
                  <span className="text-band-mut"> — {f.copy}</span>
                </li>
              ))}
            </ul>
            <Link href="/deskii" className="link-arrow mt-6 !text-[#7fc8ad] text-[0.95rem]">
              {DESKII.cta}
              <ArrowRight size={14} />
            </Link>
          </Reveal>
          <Reveal className="lg:col-span-7" delay={120}>
            <Image
              src="/exhibits/deskii-dashboard.png"
              alt="The Deskii client command center — projects, approvals, reports, and messages in one workspace"
              width={1440}
              height={900}
              className="rounded-xl border border-band-line shadow-[0_32px_64px_-24px_rgba(0,0,0,0.6)]"
            />
            <p className="mono-num mt-4 text-[0.75rem] tracking-wide text-band-mut">
              DESKII — THE CLIENT COMMAND CENTER EVERY GEMFIELD ENGAGEMENT RUNS ON
            </p>
          </Reveal>
        </div>
      </section>

      {/* 6 — OFFER (whitespace is the design) */}
      <section className="section-pad">
        <div className="container-g">
          <Header center eyebrow={OFFER.eyebrow} h={OFFER.h} body={OFFER.body} />
          <Reveal className="mt-8 text-center" delay={120}>
            <Link href="/audit" className="btn btn-primary !px-7 !py-4 text-[1rem]">
              {OFFER.cta}
              <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 7 — INDUSTRIES */}
      <section className="section-pad-sm border-t border-hairline" id="industries">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow">{INDUSTRIES.eyebrow}</p>
            <h2 className="font-display h3 mt-3 !text-[1.7rem]">{INDUSTRIES.h}</h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink2">{INDUSTRIES.body}</p>
          </Reveal>
          <Reveal className="self-center lg:col-span-7 lg:col-start-6" delay={100}>
            <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {INDUSTRIES.cards.map((c) => (
                <li key={c.name} className="border-t border-hairline pt-2.5">
                  <h3 className="font-display text-[1.08rem]">{c.name}</h3>
                  <p className="mt-1 text-[0.84rem] leading-snug text-ink2">{c.copy}</p>
                </li>
              ))}
              <li className="border-t border-hairline pt-2.5">
                <h3 className="font-display text-[1.08rem]">Another service business?</h3>
                <p className="mt-1 text-[0.84rem] leading-snug text-ink2">
                  If your business grows when the phone rings, forms come in, and calendars fill up — the
                  system fits. Tell us what you do in the audit.
                </p>
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 8 — PROCESS */}
      <section className="section-pad bg-surface">
        <div className="container-g">
          <Header eyebrow={PROCESS.eyebrow} h={PROCESS.h} />
          <ol className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS.steps.map((s, i) => (
              <Reveal key={s.n} as="li" delay={i * 70} className="border-t border-ink/15 pt-4">
                <p className="mono-num text-[0.8rem] font-medium text-emerald">{s.n}/5</p>
                <h3 className="font-display mt-2 text-[1.25rem]">{s.name}</h3>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-ink2">{s.copy}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal className="mt-10" delay={380}>
            <Link href="/how-it-works" className="link-arrow text-[0.95rem]">
              The full process
              <ArrowRight size={14} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 9 — PLANS */}
      <section className="section-pad">
        <div className="container-g">
          <Header eyebrow={PLANS.eyebrow} h={PLANS.h} body={PLANS.body} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.tiers.map((t, i) => (
              <Reveal
                key={t.name}
                delay={i * 70}
                className={`hairline-card p-6 ${t.highlight ? "!border-emerald ring-1 ring-emerald" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-[1.25rem]">{t.name}</h3>
                  {t.highlight && (
                    <span className="mono-num rounded-full bg-tint px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.1em] text-emerald-deep">
                      Most chosen
                    </span>
                  )}
                </div>
                <p className="mt-4">
                  {t.price.startsWith("From ") ? (
                    <>
                      <span className="mr-1.5 text-[0.85rem] text-ink2">From</span>
                      <span className="mono-num text-[1.6rem] font-semibold">{t.price.slice(5)}</span>
                    </>
                  ) : (
                    <span className="mono-num text-[1.6rem] font-semibold">{t.price}</span>
                  )}
                  <span className="text-[0.85rem] text-ink2">{t.period}</span>
                </p>
                <p className="mt-2 min-h-[3.2em] text-[0.86rem] font-medium leading-snug text-ink2">{t.bestFor}</p>
                <ul className="mt-4 space-y-2 border-t border-hairline pt-4">
                  {t.highlights.map((h) => (
                    <li key={h} className="flex gap-2 text-[0.88rem] leading-snug">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald" />
                      {h}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8 grid gap-x-12 gap-y-5 border-t border-hairline pt-6 lg:grid-cols-12" delay={200}>
            <div className="lg:col-span-5">
              <div className="flex flex-wrap items-baseline gap-x-4">
                <h3 className="text-[0.95rem] font-bold">{PLANS.websiteOnly.name}</h3>
                <p className="mono-num text-[1rem] font-semibold">{PLANS.websiteOnly.price}</p>
              </div>
              <p className="mt-1.5 text-[0.86rem] leading-snug text-ink2">{PLANS.websiteOnly.copy}</p>
              <Link href="/pricing" className="link-arrow mt-3 text-[0.95rem]">
                {PLANS.cta}
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <p className="eyebrow">Selective, on purpose</p>
              <p className="mt-2 max-w-xl text-[0.92rem] font-medium leading-relaxed">{OFFER.qualification}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 10 — TRUST (ownership + why, side by side, right before the ask) */}
      <section className="section-pad bg-surface">
        <div className="container-g grid gap-x-16 gap-y-14 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">{OWNERSHIP.eyebrow}</p>
            <h2 className="font-display mt-3 text-[1.9rem] leading-tight">{OWNERSHIP.h}</h2>
            <p className="mt-3 text-[0.95rem] font-medium text-emerald-deep">{OWNERSHIP.kicker}</p>
            <dl className="mt-6">
              {OWNERSHIP.declarations.map((d) => (
                <div key={d.k} className="grid gap-1 border-t border-ink/15 py-3 sm:grid-cols-[150px_1fr] sm:gap-6">
                  <dt className="text-[0.92rem] font-bold">{d.k}</dt>
                  <dd className="text-[0.9rem] text-ink2">{d.v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-ink/15 pt-4 text-[0.86rem] leading-relaxed text-ink2">{OWNERSHIP.terms}</p>
          </Reveal>
          <Reveal delay={120}>
            <p className="eyebrow">{WHY.eyebrow}</p>
            <h2 className="font-display mt-3 text-[1.9rem] leading-tight">{WHY.h}</h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink2">{WHY.body}</p>
            <ul className="mt-6 space-y-2.5">
              {WHY.points.map((p) => (
                <li key={p} className="flex gap-3 text-[0.92rem] font-medium">
                  <Check size={15} className="mt-0.5 shrink-0 text-emerald" />
                  {p}
                </li>
              ))}
            </ul>
            {/* Founder block — placeholder content (SITE-PLAN §11). */}
            <div className="mt-8 flex items-center gap-4 border-t border-ink/15 pt-6">
              <span
                className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tint text-[1.3rem] text-emerald-deep"
                aria-hidden="true"
              >
                G
              </span>
              <div>
                <p className="font-display text-[1.05rem]">{WHY.founder.name}</p>
                <p className="mt-0.5 text-[0.88rem] leading-relaxed text-ink2">&ldquo;{WHY.founder.line}&rdquo;</p>
                <p className="eyebrow mt-2 !text-ink2">{WHY.founder.location}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 11 — FINAL CTA */}
      <section className="section-pad">
        <div className="container-g">
          <Header center eyebrow="Free Growth Audit" h={FINAL_CTA.h} body={FINAL_CTA.body} />
          {/* FINAL_CTA.micro renders inside the form itself — no duplicate here */}
          <Reveal className="mx-auto mt-9 max-w-2xl" delay={120}>
            <AuditForm id="audit-form" />
          </Reveal>
        </div>
      </section>
    </main>
  );
}
