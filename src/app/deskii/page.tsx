import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ArrowRight } from "@/components/icons";
import { DeskiiDashboard, DeskiiCrop } from "@/components/deskii-frame";
import { DESKII, DESKII_PAGE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Deskii — the client command center",
  description:
    "Deskii is where Gemfield clients track website builds, approve work, read monthly reports, message the team, and see what happens next. See the work. See the results.",
};

export default function DeskiiPage() {
  return (
    <>
      <section className="band blueprint pb-20 pt-32 md:pt-40">
        <div className="container-g">
          <div className="max-w-3xl">
            <Reveal>
              <p className="eyebrow !text-[#7fc8ad]">{DESKII_PAGE.eyebrow}</p>
              <h1 className="font-display h1 mt-5 !text-[clamp(2.2rem,4.4vw,3.6rem)] text-white">
                {DESKII_PAGE.h}
              </h1>
              <p className="measure mt-6 text-[1.05rem] leading-relaxed text-band-mut">
                {DESKII_PAGE.body}
              </p>
            </Reveal>
          </div>
          <Reveal className="mt-12" delay={140}>
            <DeskiiDashboard />
            <p className="mono-num mt-3 text-right text-[0.75rem] text-band-mut">
              Sample workspace — production screenshots replace these previews
            </p>
          </Reveal>
        </div>
      </section>

      <section>
        <div className="container-g section-pad">
          <Reveal>
            <h2 className="font-display h2 max-w-2xl">How clients actually use it.</h2>
          </Reveal>
          <ol className="mt-12 grid gap-8 border-t border-hairline pt-10 md:grid-cols-2 lg:grid-cols-4">
            {DESKII_PAGE.walkthrough.map((w, i) => (
              <Reveal key={w.n} as="li" delay={Math.min(i * 70, 280)}>
                <p className="mono-num text-[0.85rem] font-medium text-emerald">{w.n}</p>
                <p className="mt-3 leading-relaxed text-ink2">{w.copy}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-hairline bg-surface">
        <div className="container-g section-pad">
          <Reveal>
            <h2 className="font-display h2 max-w-2xl">Six modules. Zero mystery.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DESKII.features.map((f, i) => (
              <Reveal key={f.name} delay={Math.min(i * 60, 240)}>
                <div className="flex h-full flex-col rounded-xl border border-band-line bg-band p-5 text-band-ink">
                  <h3 className="text-[1.02rem] font-bold text-white">{f.name}</h3>
                  <p className="mt-1.5 flex-1 text-[0.9rem] leading-relaxed text-band-mut">{f.copy}</p>
                  <DeskiiCrop kind={f.name} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container-g section-pad-sm">
          <Reveal>
            <div className="grid items-center gap-8 rounded-xl border border-emerald/25 bg-tint p-8 lg:grid-cols-12">
              <p className="measure font-display text-[1.5rem] leading-snug lg:col-span-8">
                {DESKII_PAGE.closing}
              </p>
              <div className="lg:col-span-4 lg:justify-self-end">
                <Link href="/audit" className="btn btn-primary">
                  {DESKII_PAGE.cta}
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
