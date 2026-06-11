import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ArrowRight, Check } from "@/components/icons";
import { BeforeAfter } from "@/components/deskii-frame";
import { AuditForm } from "@/components/audit-form";
import { INDUSTRIES, PROCESS, PROOF, PLANS, WHY, FINAL_CTA } from "@/lib/content";

/* S8 — Who We Help */
export function Industries() {
  return (
    <section className="bg-surface" id="industries">
      <div className="container-g section-pad">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">{INDUSTRIES.eyebrow}</p>
          <h2 className="font-display h2 mt-4">{INDUSTRIES.h}</h2>
          <p className="measure mt-6 leading-relaxed text-ink2">{INDUSTRIES.body}</p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.cards.map((c, i) => (
            <Reveal key={c.name} delay={Math.min(i * 70, 280)}>
              <div className="hairline-card flex h-full flex-col p-6">
                <h3 className="font-display text-[1.3rem]">{c.name}</h3>
                <p className="mt-2.5 flex-1 text-[0.95rem] leading-relaxed text-ink2">{c.copy}</p>
                <Link href="/audit" className="link-arrow mt-5 text-[0.92rem]">
                  Get your audit
                  <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
          ))}
          <Reveal delay={280}>
            <div className="flex h-full flex-col justify-center rounded-xl border border-dashed border-ink2/40 p-6">
              <p className="font-display text-[1.3rem]">Another service business?</p>
              <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink2">
                If your business grows when the phone rings, forms come in, and calendars fill up —
                the system fits. Tell us what you do in the audit.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* S9 — How It Works */
export function Process() {
  return (
    <section>
      <div className="container-g section-pad">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">{PROCESS.eyebrow}</p>
            <h2 className="font-display h2 mt-4">{PROCESS.h}</h2>
          </div>
          <Link href="/how-it-works" className="link-arrow text-[0.98rem]">
            The full process
            <ArrowRight size={15} />
          </Link>
        </Reveal>
        <ol className="mt-12 grid gap-8 border-t border-hairline pt-10 sm:grid-cols-2 lg:grid-cols-5">
          {PROCESS.steps.map((s, i) => (
            <Reveal key={s.n} as="li" delay={Math.min(i * 70, 280)}>
              <span className="mono-num text-[0.85rem] font-medium text-emerald">
                {s.n} / 5
              </span>
              <h3 className="font-display mt-3 text-[1.35rem]">{s.name}</h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-ink2">{s.copy}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* Small stylized document mocks for the proof artifacts. */
function ArtifactMock({ kind }: { kind: number }) {
  if (kind === 0) {
    // Audit scorecard
    return (
      <div className="rounded-lg border border-hairline bg-white p-4" aria-hidden="true">
        <p className="mono-num text-[9px] uppercase tracking-[0.14em] text-ink2">Growth audit · sample</p>
        {[
          { k: "Conversion", v: 38 },
          { k: "Visibility (Google + AI)", v: 45 },
          { k: "Lead capture & follow-up", v: 22 },
          { k: "Reviews & trust", v: 61 },
        ].map((r) => (
          <div key={r.k} className="mt-2.5">
            <div className="flex justify-between text-[10px] font-medium">
              <span>{r.k}</span>
              <span className="mono-num text-ink2">{r.v}/100</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-emerald/80" style={{ width: `${r.v}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (kind === 1) {
    // 90-day roadmap
    return (
      <div className="rounded-lg border border-hairline bg-white p-4" aria-hidden="true">
        <p className="mono-num text-[9px] uppercase tracking-[0.14em] text-ink2">90-day roadmap · sample</p>
        {[
          { k: "Days 1–30", v: "Website, capture, tracking live" },
          { k: "Days 31–60", v: "Follow-up, reviews, local SEO" },
          { k: "Days 61–90", v: "Optimize, expand, report" },
        ].map((r, i) => (
          <div key={r.k} className="mt-3 flex items-start gap-2.5">
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${i === 0 ? "bg-emerald" : "border border-ink2/50"}`}
            />
            <div>
              <p className="mono-num text-[9.5px] font-medium text-emerald">{r.k}</p>
              <p className="text-[10.5px] font-medium">{r.v}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }
  // Deskii monthly report
  return (
    <div className="rounded-lg border border-hairline bg-white p-4" aria-hidden="true">
      <p className="mono-num text-[9px] uppercase tracking-[0.14em] text-ink2">Monthly report · sample</p>
      {[
        { k: "Tasks shipped", v: "23" },
        { k: "New leads captured", v: "28" },
        { k: "Missed calls recovered", v: "19" },
        { k: "New reviews", v: "6" },
      ].map((r) => (
        <div key={r.k} className="mt-2.5 flex items-center justify-between border-b border-hairline pb-2 text-[10.5px]">
          <span className="font-medium">{r.k}</span>
          <span className="mono-num text-[12px] font-semibold text-emerald">{r.v}</span>
        </div>
      ))}
      <p className="mt-2.5 text-[9.5px] text-ink2">+ what we recommend next, in plain English</p>
    </div>
  );
}

/* S10 — Proof / Example Systems */
export function Proof() {
  return (
    <section className="border-t border-hairline">
      <div className="container-g section-pad">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">{PROOF.eyebrow}</p>
          <h2 className="font-display h2 mt-4">{PROOF.h}</h2>
          <p className="measure mt-6 leading-relaxed text-ink2">{PROOF.body}</p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PROOF.artifacts.map((a, i) => (
            <Reveal key={a.name} delay={Math.min(i * 80, 240)}>
              <div className="flex h-full flex-col gap-4">
                <ArtifactMock kind={i} />
                <div>
                  <h3 className="text-[1.05rem] font-bold">{a.name}</h3>
                  <p className="mt-1 text-[0.92rem] leading-relaxed text-ink2">{a.copy}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-16" delay={100}>
          <BeforeAfter
            before={{ label: PROOF.beforeAfter.beforeLabel, items: PROOF.beforeAfter.beforeItems }}
            after={{ label: PROOF.beforeAfter.afterLabel, items: PROOF.beforeAfter.afterItems }}
            note={PROOF.beforeAfter.note}
          />
        </Reveal>
      </div>
    </section>
  );
}

/* S11 — Plans preview */
export function Plans() {
  return (
    <section className="bg-surface">
      <div className="container-g section-pad">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">{PLANS.eyebrow}</p>
          <h2 className="font-display h2 mt-4">{PLANS.h}</h2>
          <p className="measure mt-6 leading-relaxed text-ink2">{PLANS.body}</p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.tiers.map((t, i) => (
            <Reveal key={t.name} delay={Math.min(i * 70, 280)}>
              <div
                className={`flex h-full flex-col rounded-xl border bg-white p-6 ${
                  t.highlight ? "border-emerald" : "border-hairline"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-[1.35rem]">{t.name}</h3>
                  {t.highlight && (
                    <span className="mono-num rounded-full bg-tint px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-emerald-deep">
                      Most chosen
                    </span>
                  )}
                </div>
                <p className="mt-4">
                  {t.price.startsWith("From ") ? (
                    <>
                      <span className="mr-1.5 text-[0.9rem] font-medium text-ink2">From</span>
                      <span className="mono-num whitespace-nowrap text-[1.7rem] font-semibold">
                        {t.price.slice(5)}
                      </span>
                    </>
                  ) : (
                    <span className="mono-num text-[1.7rem] font-semibold">{t.price}</span>
                  )}
                  <span className="text-[0.9rem] text-ink2">{t.period}</span>
                </p>
                <p className="mt-2 text-[0.88rem] font-medium text-ink2">{t.bestFor}</p>
                <ul className="mt-5 flex-1 space-y-2.5 border-t border-hairline pt-5">
                  {t.highlights.map((h) => (
                    <li key={h} className="flex gap-2.5 text-[0.92rem]">
                      <Check size={15} className="mt-1 shrink-0 text-emerald" />
                      {h}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className={`btn mt-6 w-full justify-center !py-3 text-[0.9rem] ${
                    t.highlight ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  See full plan
                  <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-6" delay={120}>
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-hairline bg-white p-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-[1.05rem] font-bold">{PLANS.websiteOnly.name}</h3>
              <p className="measure mt-1 text-[0.92rem] text-ink2">{PLANS.websiteOnly.copy}</p>
            </div>
            <p className="mono-num shrink-0 text-[1.2rem] font-semibold">{PLANS.websiteOnly.price}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* S12 — Why Gemfield */
export function Why() {
  return (
    <section>
      <div className="container-g section-pad grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-6">
          <p className="eyebrow">{WHY.eyebrow}</p>
          <h2 className="font-display h2 mt-4">{WHY.h}</h2>
          <p className="measure mt-6 leading-relaxed text-ink2">{WHY.body}</p>
          <ul className="mt-8 space-y-3">
            {WHY.points.map((p) => (
              <li key={p} className="flex gap-3 text-[1rem] font-medium">
                <Check size={17} className="mt-1 shrink-0 text-emerald" />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="lg:col-span-5 lg:col-start-8" delay={120}>
          {/* Founder block — placeholder content (SITE-PLAN §11): swap name/photo when provided. */}
          <div className="hairline-card p-7">
            <div
              className="flex h-44 w-full items-center justify-center rounded-lg bg-tint"
              aria-hidden="true"
            >
              <span className="font-display text-[3rem] text-emerald">G</span>
            </div>
            <p className="font-display mt-6 text-[1.25rem]">{WHY.founder.name}</p>
            <p className="mt-2 leading-relaxed text-ink2">&ldquo;{WHY.founder.line}&rdquo;</p>
            <p className="eyebrow mt-5 !text-ink2">{WHY.founder.location}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* S13 — Final CTA with inline form */
export function FinalCta() {
  return (
    <section className="border-t border-hairline bg-surface">
      <div className="container-g section-pad grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <h2 className="font-display h2">{FINAL_CTA.h}</h2>
          <p className="measure mt-6 text-[1.05rem] leading-relaxed text-ink2">{FINAL_CTA.body}</p>
          <p className="mono-num mt-4 text-[0.85rem] text-ink2">{FINAL_CTA.micro}</p>
        </Reveal>
        <Reveal className="lg:col-span-6 lg:col-start-7" delay={120}>
          <AuditForm id="audit-form" />
        </Reveal>
      </div>
    </section>
  );
}
