import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { AuditForm } from "@/components/audit-form";
import { Check } from "@/components/icons";
import { AUDIT_PAGE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Free Growth Audit",
  description:
    "Get a free audit of your website, Google + AI-search visibility, lead capture, and follow-up — with a prioritized 90-day roadmap. Useful whether you hire us or not.",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: AUDIT_PAGE.faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function AuditPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="pb-16 pt-32 md:pt-40">
        <div className="container-g grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <p className="eyebrow">{AUDIT_PAGE.eyebrow}</p>
              <h1 className="font-display h1 mt-5 !text-[clamp(2.2rem,4.4vw,3.6rem)]">
                {AUDIT_PAGE.h}
              </h1>
              <p className="measure mt-6 text-[1.05rem] leading-relaxed text-ink2">
                {AUDIT_PAGE.body}
              </p>
            </Reveal>

            <Reveal delay={120}>
              <h2 className="eyebrow mt-10 !text-ink2">Your audit includes</h2>
              <ul className="mt-4 space-y-4">
                {AUDIT_PAGE.deliverables.map((d) => (
                  <li key={d.name} className="flex gap-3.5">
                    <Check size={18} className="mt-1 shrink-0 text-emerald" />
                    <div>
                      <p className="font-bold">{d.name}</p>
                      <p className="text-[0.95rem] leading-relaxed text-ink2">{d.copy}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Named-human slot (SITE-PLAN §2) — placeholder until founder details land. */}
            <Reveal delay={180}>
              <div className="mt-10 flex items-center gap-4 rounded-xl border border-hairline bg-surface p-5">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tint font-display text-[1.3rem] text-emerald"
                  aria-hidden="true"
                >
                  G
                </span>
                <p className="text-[0.95rem] leading-relaxed">
                  <span className="font-bold">Every audit is reviewed personally by our founder</span>{" "}
                  <span className="text-ink2">
                    — not scored by a bot, not handed to an intern. You&apos;ll hear what we&apos;d
                    actually do, in plain English.
                  </span>
                </p>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-6">
            <Reveal delay={140}>
              <AuditForm />
            </Reveal>
            <Reveal delay={200}>
              <ol className="mt-8 grid gap-4 sm:grid-cols-3">
                {AUDIT_PAGE.steps.map((s) => (
                  <li key={s.n}>
                    <span className="mono-num text-[0.8rem] font-medium text-emerald">
                      Step {s.n}
                    </span>
                    <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink2">{s.copy}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="container-g section-pad-sm max-w-4xl">
          <Reveal>
            <h2 className="font-display h2">Fair questions.</h2>
            <div className="faq mt-8">
              {AUDIT_PAGE.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
