import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ArrowRight } from "@/components/icons";
import { DeskiiDashboard, DeskiiCrop } from "@/components/deskii-frame";
import { HERO, PROBLEM, SYSTEM, FUEL, DESKII, OFFER, OWNERSHIP } from "@/lib/content";

/* S1 — Hero */
export function Hero() {
  return (
    <section className="pb-16 pt-32 md:pb-24 md:pt-40" id="top">
      <div className="container-g grid items-center gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow">{HERO.eyebrow}</p>
          </Reveal>
          <Reveal delay={70}>
            <h1 className="font-display h1 mt-5">
              {HERO.h1a} <span className="text-emerald">{HERO.h1b}</span> {HERO.h1c}
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="measure mt-6 text-[1.1rem] leading-relaxed text-ink2">{HERO.sub}</p>
          </Reveal>
          <Reveal delay={210}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/audit" className="btn btn-primary !px-6 !py-4 text-[1rem]">
                {HERO.primaryCta}
                <ArrowRight size={16} />
              </Link>
              <Link href="/how-it-works" className="link-arrow text-[0.98rem]">
                {HERO.secondaryCta}
                <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={280}>
            <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-[0.85rem] font-medium text-ink2">
              {HERO.trustPoints.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-emerald" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <div className="lg:col-span-7">
          <Reveal delay={160}>
            <DeskiiDashboard />
            <p className="mono-num mt-3 text-right text-[0.75rem] text-ink2">
              Deskii — the client command center every Gemfield engagement runs on
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* S2 — Problem */
export function Problem() {
  return (
    <section className="border-t border-hairline">
      <div className="container-g section-pad grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-6">
          <p className="eyebrow">{PROBLEM.eyebrow}</p>
          <h2 className="font-display h2 mt-4">{PROBLEM.h}</h2>
          <p className="measure mt-6 leading-relaxed text-ink2">{PROBLEM.body}</p>
        </Reveal>
        <Reveal className="lg:col-span-5 lg:col-start-8" delay={120}>
          <ul className="grid gap-x-8 gap-y-3 border-t border-hairline pt-6 sm:grid-cols-1">
            {PROBLEM.points.map((p) => (
              <li key={p} className="flex items-baseline gap-3 border-b border-hairline pb-3 text-[1.02rem] font-medium">
                <span className="text-ink2" aria-hidden="true">
                  –
                </span>
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* S3 — The Gemfield Growth System (numbered ledger) */
export function System() {
  return (
    <section className="border-t border-hairline" id="system">
      <div className="container-g section-pad">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">{SYSTEM.eyebrow}</p>
          <h2 className="font-display h2 mt-4">{SYSTEM.h}</h2>
          <p className="measure mt-6 leading-relaxed text-ink2">{SYSTEM.body}</p>
        </Reveal>
        <div className="mt-14">
          {SYSTEM.pillars.map((p, i) => (
            <Reveal key={p.n} delay={Math.min(i * 60, 240)}>
              <div className="grid gap-3 border-t border-hairline py-7 md:grid-cols-12 md:gap-6">
                <span className="mono-num text-[0.85rem] font-medium text-emerald md:col-span-1">
                  {p.n}
                </span>
                <h3 className="font-display text-[1.45rem] md:col-span-4">{p.name}</h3>
                <p className="leading-relaxed text-ink2 md:col-span-7">{p.copy}</p>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-hairline" />
        </div>
      </div>
    </section>
  );
}

/* S4 — Growth Fuel (marketing layer) */
export function Fuel() {
  return (
    <section className="bg-surface">
      <div className="container-g section-pad">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{FUEL.eyebrow}</p>
            <h2 className="font-display h2 mt-4">{FUEL.h}</h2>
            <p className="measure mt-6 leading-relaxed text-ink2">{FUEL.body}</p>
            <div className="mt-8 space-y-3 border-l-2 border-emerald pl-5 text-[0.95rem]">
              <p className="font-semibold">{FUEL.eligibility}</p>
              <p className="text-ink2">{FUEL.feeLine}</p>
            </div>
            <Link href="/marketing" className="link-arrow mt-8 text-[0.98rem]">
              {FUEL.cta}
              <ArrowRight size={15} />
            </Link>
          </Reveal>
          <Reveal className="lg:col-span-6 lg:col-start-7" delay={120}>
            <div className="grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-2">
              {FUEL.channels.map((c) => (
                <div key={c.name} className="bg-paper p-5">
                  <h3 className="text-[1rem] font-bold">{c.name}</h3>
                  <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink2">{c.copy}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* S5 — Deskii (the dark band) */
export function Deskii() {
  const spans = ["sm:col-span-3", "sm:col-span-3", "sm:col-span-2", "sm:col-span-2", "sm:col-span-2"];
  const order = ["Reports", "Approvals", "Projects", "Tasks", "Roadmap"];
  const features = order.map((name) => DESKII.features.find((f) => f.name === name)!);
  const messages = DESKII.features.find((f) => f.name === "Messages")!;

  return (
    <section className="band blueprint">
      <div className="container-g section-pad">
        <Reveal className="max-w-3xl">
          <p className="eyebrow !text-[#7fc8ad]">{DESKII.eyebrow}</p>
          <h2 className="font-display h2 mt-4 text-white">{DESKII.h}</h2>
          <p className="measure mt-6 leading-relaxed text-band-mut">{DESKII.body}</p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-6">
          {features.map((f, i) => (
            <Reveal key={f.name} className={spans[i]} delay={Math.min(i * 70, 280)}>
              <div className="h-full rounded-xl border border-band-line bg-band/60 p-5">
                <h3 className="text-[1.02rem] font-bold text-white">{f.name}</h3>
                <p className="mt-1.5 text-[0.9rem] leading-relaxed text-band-mut">{f.copy}</p>
                <DeskiiCrop kind={f.name} />
              </div>
            </Reveal>
          ))}
          <Reveal className="sm:col-span-6" delay={300}>
            <div className="grid items-center gap-6 rounded-xl border border-band-line bg-band/60 p-5 md:grid-cols-2">
              <div>
                <h3 className="text-[1.02rem] font-bold text-white">{messages.name}</h3>
                <p className="mt-1.5 max-w-md text-[0.9rem] leading-relaxed text-band-mut">
                  {messages.copy}
                </p>
                <Link href="/deskii" className="link-arrow mt-5 !text-[#7fc8ad] text-[0.95rem]">
                  {DESKII.cta}
                  <ArrowRight size={15} />
                </Link>
              </div>
              <div className="max-w-sm md:justify-self-end md:w-full">
                <DeskiiCrop kind="Messages" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* S6 — The Offer */
export function Offer() {
  return (
    <section>
      <div className="container-g section-pad grid items-center gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-6">
          <p className="eyebrow">{OFFER.eyebrow}</p>
          <h2 className="font-display h2 mt-4">{OFFER.h}</h2>
          <p className="measure mt-6 leading-relaxed text-ink2">{OFFER.body}</p>
        </Reveal>
        <Reveal className="lg:col-span-5 lg:col-start-8" delay={120}>
          <div className="rounded-xl border border-emerald/25 bg-tint p-7">
            <p className="eyebrow">Selective, on purpose</p>
            <p className="mt-3 text-[1.05rem] font-medium leading-relaxed">{OFFER.qualification}</p>
            <Link href="/audit" className="btn btn-primary mt-6">
              {OFFER.cta}
              <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* S7 — The Ownership Pledge */
export function Ownership() {
  return (
    <section className="border-t border-hairline">
      <div className="container-g section-pad grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow">{OWNERSHIP.eyebrow}</p>
          <h2 className="font-display h2 mt-4">{OWNERSHIP.h}</h2>
          <p className="mt-6 text-[1.02rem] font-medium text-emerald-deep">{OWNERSHIP.kicker}</p>
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
  );
}
