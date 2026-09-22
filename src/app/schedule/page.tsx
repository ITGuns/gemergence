import type { Metadata } from "next";
import { CalendlyEmbed } from "@/components/calendly";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Book your call",
  description:
    "Pick a time. We review your site, your menu and your listings before we meet, and you get a straight answer on your POS.",
  robots: { index: false },
};

export default function SchedulePage() {
  return (
    <section className="pb-20 pt-32 md:pt-40">
      <div className="container-g grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow">Book a call</p>
            <h1 className="font-display h1 mt-5 !text-[clamp(2.2rem,4.4vw,3.4rem)]">
              One more step: pick your time.
            </h1>
            <p className="measure mt-6 text-[1.05rem] leading-relaxed text-ink2">
              Pick a time below and the calendar invite comes straight to your inbox. We look at
              your site, your menu and your listings before we meet, so the call is spent on
              findings rather than discovery.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <ol className="mt-10 space-y-5">
              {[
                { n: "1", t: "Pick a time", c: "30 minutes, on us. No prep needed on your end." },
                {
                  n: "2",
                  t: "We do the homework",
                  c: "Your menu, your hours across Google and Maps, and your booking path — reviewed before we meet.",
                },
                {
                  n: "3",
                  t: "You get a straight answer",
                  c: "Which tier fits, and whether your POS can connect — yes, yes with a delay, or no.",
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
