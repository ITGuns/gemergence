import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ArrowRight, Check } from "@/components/icons";
import { HOW_PAGE } from "@/lib/content";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Audit → Strategy → Build → Launch → Improve. How Gemfield takes a service business from a website that exists to a growth system that creates clients.",
};

export default function HowItWorksPage() {
  return (
    <>
      <section className="pb-12 pt-32 md:pt-40">
        <div className="container-g max-w-3xl">
          <Reveal>
            <p className="eyebrow">{HOW_PAGE.eyebrow}</p>
            <h1 className="font-display h1 mt-5 !text-[clamp(2.2rem,4.4vw,3.6rem)]">{HOW_PAGE.h}</h1>
            <p className="measure mt-6 text-[1.05rem] leading-relaxed text-ink2">{HOW_PAGE.body}</p>
          </Reveal>
        </div>
      </section>

      <section>
        <div className="container-g section-pad-sm">
          {HOW_PAGE.detail.map((step, i) => (
            <Reveal key={step.n} delay={Math.min(i * 50, 200)}>
              <div className="grid gap-4 border-t border-hairline py-10 md:grid-cols-12 md:gap-8">
                <span className="mono-num text-[0.9rem] font-medium text-emerald md:col-span-1">
                  {step.n}/5
                </span>
                <div className="md:col-span-4">
                  <h2 className="font-display text-[1.7rem]">{step.name}</h2>
                  <p className="mt-3 leading-relaxed text-ink2">{step.copy}</p>
                </div>
                <ul className="space-y-2 md:col-span-6 md:col-start-7">
                  {step.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5 text-[0.95rem] font-medium">
                      <Check size={15} className="mt-1 shrink-0 text-emerald" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-hairline" />
        </div>
      </section>

      <section className="bg-surface">
        <div className="container-g section-pad grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <h2 className="font-display h2">{HOW_PAGE.expectations.h}</h2>
            <p className="mt-4 leading-relaxed text-ink2">
              The system works because both sides do their part. Ours is the build and the
              management. Yours is small, but it matters:
            </p>
          </Reveal>
          <Reveal className="lg:col-span-6 lg:col-start-7" delay={120}>
            <ul className="space-y-4">
              {HOW_PAGE.expectations.points.map((p, i) => (
                <li key={p} className="flex gap-4 rounded-xl border border-hairline bg-white p-5">
                  <span className="mono-num text-[0.85rem] font-medium text-emerald">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="font-medium">{p}</p>
                </li>
              ))}
            </ul>
            <Link href="/audit" className="btn btn-primary mt-8">
              Start with the audit
              <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
