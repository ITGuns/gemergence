import type { Metadata } from "next";
import { CalendlyEmbed } from "@/components/calendly";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Book your audit call",
  description:
    "Your audit request is in. Pick a time and we'll walk you through the findings and your 90-day roadmap.",
  robots: { index: false },
};

export default function SchedulePage() {
  return (
    <section className="pb-20 pt-32 md:pt-40">
      <div className="container-g grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow">Request received</p>
            <h1 className="font-display h1 mt-5 !text-[clamp(2.2rem,4.4vw,3.4rem)]">
              One more step: pick your time.
            </h1>
            <p className="measure mt-6 text-[1.05rem] leading-relaxed text-ink2">
              Thanks — we received your request and will review your website before the call. Choose
              a time below and the calendar invite comes straight to your inbox.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <ol className="mt-10 space-y-5">
              {[
                { n: "1", t: "Pick a time", c: "30 minutes, on us. No prep needed on your end." },
                {
                  n: "2",
                  t: "We do the homework",
                  c: "Your site, visibility, capture, and follow-up — reviewed before we meet.",
                },
                {
                  n: "3",
                  t: "You get the roadmap",
                  c: "Findings and priorities, yours to keep — whether or not we work together.",
                },
              ].map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="mono-num flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tint text-[0.85rem] font-semibold text-emerald-deep">
                    {s.n}
                  </span>
                  <div>
                    <p className="font-bold">{s.t}</p>
                    <p className="text-[0.92rem] leading-relaxed text-ink2">{s.c}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
        <div className="lg:col-span-7">
          <Reveal delay={100}>
            <CalendlyEmbed />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
