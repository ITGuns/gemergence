"use client";

/**
 * Motion v2 — the immersive homepage, dark end to end.
 * Copy tiles alternate sides; the growth-system object and each section's
 * exhibit occupy the open half (rendered by the canvas behind). All copy is
 * imported verbatim from lib/content.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "@/components/icons";
import {
  HERO, PROBLEM, SYSTEM, FUEL, DESKII, OFFER, OWNERSHIP,
  INDUSTRIES, PROCESS, PROOF, PLANS, WHY, FINAL_CTA,
} from "@/lib/content";
import { AuditForm } from "@/components/audit-form";
import { journey, clamp01, pinProgress } from "./journey-store";

const JourneyScene = dynamic(() => import("./scene"), { ssr: false });

/** Copy tile column helpers: side 1 = left, -1 = right. */
const col = (side: 1 | -1) =>
  side === 1 ? "lg:col-span-6" : "lg:col-span-6 lg:col-start-7";

export default function ImmersiveHome() {
  const journeyEl = useRef<HTMLDivElement>(null);
  const canvasWrap = useRef<HTMLDivElement>(null);
  const secEls = useRef<(HTMLElement | null)[]>([]);
  const reg = (i: number) => (el: HTMLElement | null) => {
    secEls.current[i] = el;
  };
  const [pillar, setPillar] = useState(0);
  const [deskMod, setDeskMod] = useState(0);
  const [canvasOn, setCanvasOn] = useState(false);
  const [past, setPast] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    try {
      const c = document.createElement("canvas");
      if (c.getContext("webgl2") || c.getContext("webgl")) setCanvasOn(true);
    } catch {
      /* no WebGL — static dark page */
    }
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const j = journeyEl.current;
        if (j) {
          const r = j.getBoundingClientRect();
          journey.p = clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
          const isPast = r.bottom < window.innerHeight * 0.2;
          if (canvasWrap.current) {
            canvasWrap.current.style.opacity = String(clamp01(r.bottom / (window.innerHeight * 0.5)));
            canvasWrap.current.style.display = isPast ? "none" : "";
          }
          setPast((prev) => (prev === isPast ? prev : isPast));
        }
        // active section = the last one whose top passed 55% of the viewport
        const mid = window.innerHeight * 0.55;
        let idx = 0;
        let t = 0;
        secEls.current.forEach((el, i) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.top <= mid) {
            idx = i;
            t = clamp01((mid - r.top) / Math.max(1, r.height));
          }
        });
        journey.sec = idx;
        journey.t = t;
        journey.sys = pinProgress(secEls.current[2] as HTMLElement);
        journey.desk = pinProgress(secEls.current[4] as HTMLElement);
        const pi = Math.min(6, Math.floor(journey.sys * 7));
        setPillar((p) => (p === pi ? p : pi));
        const di = Math.min(5, Math.floor(journey.desk * 6));
        setDeskMod((p) => (p === di ? p : di));
      });
    };
    const onMove = (e: PointerEvent) => {
      journey.mx = (e.clientX / window.innerWidth - 0.5) * 2;
      journey.my = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={journeyEl} className="journey relative">
      <div ref={canvasWrap} className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        {canvasOn && <JourneyScene paused={past} onContextLost={() => setCanvasOn(false)} />}
      </div>

      {/* 0 — HERO (copy left) */}
      <section ref={reg(0)} className="relative z-10 flex min-h-screen items-center pt-16">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a0f0c]/95 via-[#0a0f0c]/70 to-transparent"
          aria-hidden="true"
        />
        <div className="container-g relative grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="eyebrow !text-[#7fc8ad]">{HERO.eyebrow}</p>
            <h1 className="font-display h1 mt-5 text-white">
              {HERO.h1a} <span className="text-[#7fc8ad]">{HERO.h1b}</span> {HERO.h1c}
            </h1>
            <p className="measure mt-6 text-[1.1rem] leading-relaxed text-band-mut">{HERO.sub}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/audit" className="btn btn-primary !px-6 !py-4 text-[1rem]">
                {HERO.primaryCta}
                <ArrowRight size={16} />
              </Link>
              <Link href="/how-it-works" className="link-arrow !text-[#7fc8ad] text-[0.98rem]">
                {HERO.secondaryCta}
                <ArrowRight size={15} />
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-[0.85rem] font-medium text-band-mut">
              {HERO.trustPoints.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-[#7fc8ad]" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="scroll-cue" aria-hidden>
          <span />
          Scroll to enter the system
        </div>
      </section>

      {/* 1 — PROBLEM (copy right) */}
      <section ref={reg(1)} className="relative z-10 flex min-h-screen items-center">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className={`glass max-w-2xl p-8 sm:p-10 ${col(-1)}`}>
            <p className="eyebrow !text-[#7fc8ad]">{PROBLEM.eyebrow}</p>
            <h2 className="font-display h2 mt-4 text-white">{PROBLEM.h}</h2>
            <p className="mt-6 leading-relaxed text-band-mut">{PROBLEM.body}</p>
            <ul className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {PROBLEM.points.map((p) => (
                <li key={p} className="flex items-baseline gap-2.5 text-[0.95rem] font-medium text-band-ink">
                  <span className="text-band-mut" aria-hidden="true">–</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 2 — SYSTEM (pinned, copy left) */}
      <div ref={reg(2)} className="relative h-[400vh]">
        <section className="sticky top-0 z-10 flex h-screen items-center" id="system">
          <div className="container-g grid gap-10 lg:grid-cols-12">
            <div className="glass max-w-xl p-8 sm:p-10 lg:col-span-6">
              <p className="eyebrow !text-[#7fc8ad]">{SYSTEM.eyebrow}</p>
              <h2 className="font-display h2 mt-4 text-white">{SYSTEM.h}</h2>
              <div className="relative mt-8 min-h-[200px]" aria-hidden="true">
                {SYSTEM.pillars.map((pl, i) => (
                  <div
                    key={pl.n}
                    className="absolute inset-0 transition-all duration-500"
                    style={{
                      opacity: pillar === i ? 1 : 0,
                      transform: pillar === i ? "none" : "translateY(14px)",
                      pointerEvents: pillar === i ? "auto" : "none",
                    }}
                  >
                    <p className="mono-num text-[0.85rem] font-medium text-[#7fc8ad]">{pl.n} / 07</p>
                    <h3 className="font-display mt-2 text-[1.6rem] text-white">{pl.name}</h3>
                    <p className="mt-3 leading-relaxed text-band-mut">{pl.copy}</p>
                  </div>
                ))}
              </div>
              <ul className="sr-only">
                {SYSTEM.pillars.map((pl) => (
                  <li key={pl.n}>
                    {pl.n}. {pl.name} — {pl.copy}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex gap-1.5" aria-hidden>
                {SYSTEM.pillars.map((pl, i) => (
                  <span
                    key={pl.n}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= pillar ? "bg-[#7fc8ad]" : "bg-band-line"}`}
                  />
                ))}
              </div>
              <p className="mt-5 text-[0.85rem] text-band-mut">{SYSTEM.body}</p>
            </div>
          </div>
        </section>
      </div>

      {/* 3 — GROWTH FUEL (copy right) */}
      <section ref={reg(3)} className="relative z-10 flex min-h-screen items-center">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className={`glass max-w-2xl p-8 sm:p-10 ${col(-1)}`}>
            <p className="eyebrow !text-[#7fc8ad]">{FUEL.eyebrow}</p>
            <h2 className="font-display h2 mt-4 text-white">{FUEL.h}</h2>
            <p className="mt-6 leading-relaxed text-band-mut">{FUEL.body}</p>
            <ul className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {FUEL.channels.map((c) => (
                <li key={c.name} className="border-l border-band-line pl-3.5">
                  <span className="block text-[0.92rem] font-bold text-band-ink">{c.name}</span>
                  <span className="text-[0.85rem] leading-snug text-band-mut">{c.copy}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 border-l-2 border-[#7fc8ad] pl-5 text-[0.92rem]">
              <p className="font-semibold text-band-ink">{FUEL.eligibility}</p>
              <p className="text-band-mut">{FUEL.feeLine}</p>
            </div>
            <Link href="/marketing" className="link-arrow mt-7 !text-[#7fc8ad] text-[0.98rem]">
              {FUEL.cta}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* 4 — DESKII (pinned, copy left) */}
      <div ref={reg(4)} className="relative h-[360vh]">
        <section className="sticky top-0 z-10 flex h-screen items-center">
          <div className="container-g grid gap-10 lg:grid-cols-12">
            <div className="glass max-w-xl p-8 sm:p-10 lg:col-span-6">
              <p className="eyebrow !text-[#7fc8ad]">{DESKII.eyebrow}</p>
              <h2 className="font-display h2 mt-4 text-white">{DESKII.h}</h2>
              <p className="mt-6 leading-relaxed text-band-mut">{DESKII.body}</p>
              <ul className="mt-7 space-y-2.5">
                {DESKII.features.map((f, i) => (
                  <li key={f.name} className="transition-colors duration-300">
                    <span className={`font-bold ${deskMod === i ? "text-[#7fc8ad]" : "text-band-ink"}`}>{f.name}</span>
                    <span className="text-band-mut"> — {f.copy}</span>
                  </li>
                ))}
              </ul>
              <Link href="/deskii" className="link-arrow mt-7 !text-[#7fc8ad] text-[0.98rem]">
                {DESKII.cta}
                <ArrowRight size={15} />
              </Link>
              <p className="mono-num mt-5 border-t border-band-line pt-4 text-[0.75rem] text-band-mut">
                Deskii — the client command center every Gemfield engagement runs on
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* 5 — OFFER (copy right) */}
      <section ref={reg(5)} className="relative z-10 flex min-h-screen items-center">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className={`space-y-5 ${col(-1)}`}>
            <div className="glass max-w-xl p-8 sm:p-10">
              <p className="eyebrow !text-[#7fc8ad]">{OFFER.eyebrow}</p>
              <h2 className="font-display h2 mt-4 text-white">{OFFER.h}</h2>
              <p className="mt-6 leading-relaxed text-band-mut">{OFFER.body}</p>
            </div>
            <div className="glass max-w-xl p-7">
              <p className="eyebrow !text-[#7fc8ad]">Selective, on purpose</p>
              <p className="mt-3 text-[1rem] font-medium leading-relaxed text-band-ink">{OFFER.qualification}</p>
              <Link href="/audit" className="btn btn-primary mt-6">
                {OFFER.cta}
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6 — OWNERSHIP (copy left) */}
      <section ref={reg(6)} className="relative z-10 flex min-h-screen items-center">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-6">
            <div className="glass p-8">
              <p className="eyebrow !text-[#7fc8ad]">{OWNERSHIP.eyebrow}</p>
              <h2 className="font-display h2 mt-4 text-white">{OWNERSHIP.h}</h2>
              <p className="mt-5 text-[1.02rem] font-medium text-[#7fc8ad]">{OWNERSHIP.kicker}</p>
            </div>
            <div className="glass p-8">
              <dl>
                {OWNERSHIP.declarations.map((d) => (
                  <div key={d.k} className="grid gap-1 border-t border-band-line py-3.5 first:border-t-0 sm:grid-cols-[150px_1fr] sm:gap-5">
                    <dt className="font-bold text-band-ink">{d.k}</dt>
                    <dd className="text-[0.95rem] text-band-mut">{d.v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 border-t border-band-line pt-5 text-[0.9rem] leading-relaxed text-band-mut">
                {OWNERSHIP.terms}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7 — INDUSTRIES (copy right) */}
      <section ref={reg(7)} className="relative z-10 flex min-h-screen items-center py-24" id="industries">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className={`glass max-w-2xl p-8 sm:p-10 ${col(-1)}`}>
            <p className="eyebrow !text-[#7fc8ad]">{INDUSTRIES.eyebrow}</p>
            <h2 className="font-display h2 mt-4 text-white">{INDUSTRIES.h}</h2>
            <p className="mt-5 leading-relaxed text-band-mut">{INDUSTRIES.body}</p>
            <ul className="mt-7 space-y-4">
              {INDUSTRIES.cards.map((c) => (
                <li key={c.name} className="border-t border-band-line pt-4 first:border-t-0 first:pt-0">
                  <h3 className="font-display text-[1.2rem] text-white">{c.name}</h3>
                  <p className="mt-1 text-[0.92rem] leading-relaxed text-band-mut">{c.copy}</p>
                </li>
              ))}
              <li className="border-t border-band-line pt-4">
                <h3 className="font-display text-[1.2rem] text-white">Another service business?</h3>
                <p className="mt-1 text-[0.92rem] leading-relaxed text-band-mut">
                  If your business grows when the phone rings, forms come in, and calendars fill up — the
                  system fits. Tell us what you do in the audit.
                </p>
              </li>
            </ul>
            <Link href="/audit" className="link-arrow mt-6 !text-[#7fc8ad] text-[0.95rem]">
              Get your audit
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 8 — PROCESS (copy left) */}
      <section ref={reg(8)} className="relative z-10 flex min-h-screen items-center">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className="glass max-w-xl p-8 sm:p-10 lg:col-span-6">
            <p className="eyebrow !text-[#7fc8ad]">{PROCESS.eyebrow}</p>
            <h2 className="font-display h2 mt-4 text-white">{PROCESS.h}</h2>
            <ol className="mt-7 space-y-5">
              {PROCESS.steps.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="mono-num shrink-0 text-[0.9rem] font-medium text-[#7fc8ad]">{s.n}/5</span>
                  <div>
                    <h3 className="font-display text-[1.2rem] text-white">{s.name}</h3>
                    <p className="mt-1 text-[0.92rem] leading-relaxed text-band-mut">{s.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/how-it-works" className="link-arrow mt-7 !text-[#7fc8ad] text-[0.95rem]">
              The full process
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 9 — PROOF (copy right) */}
      <section ref={reg(9)} className="relative z-10 flex min-h-screen items-center py-24">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className={`glass max-w-2xl p-8 sm:p-10 ${col(-1)}`}>
            <p className="eyebrow !text-[#7fc8ad]">{PROOF.eyebrow}</p>
            <h2 className="font-display h2 mt-4 text-white">{PROOF.h}</h2>
            <p className="mt-5 leading-relaxed text-band-mut">{PROOF.body}</p>
            <ul className="mt-7 space-y-4">
              {PROOF.artifacts.map((a) => (
                <li key={a.name} className="border-t border-band-line pt-4 first:border-t-0 first:pt-0">
                  <h3 className="text-[1rem] font-bold text-band-ink">{a.name}</h3>
                  <p className="mt-1 text-[0.92rem] leading-relaxed text-band-mut">{a.copy}</p>
                </li>
              ))}
            </ul>
            <div className="mt-7 grid gap-5 border-t border-band-line pt-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow !text-band-mut">{PROOF.beforeAfter.beforeLabel}</p>
                <ul className="mt-3 space-y-1.5 text-[0.9rem] text-band-mut">
                  {PROOF.beforeAfter.beforeItems.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden="true">–</span>
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow">{PROOF.beforeAfter.afterLabel}</p>
                <ul className="mt-3 space-y-1.5 text-[0.9rem] font-medium text-band-ink">
                  {PROOF.beforeAfter.afterItems.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[#7fc8ad]" aria-hidden="true">+</span>
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mono-num mt-4 text-[0.75rem] text-band-mut">{PROOF.beforeAfter.note}</p>
          </div>
        </div>
      </section>

      {/* 10 — PLANS (copy left) */}
      <section ref={reg(10)} className="relative z-10 flex min-h-screen items-center py-24">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className="glass max-w-2xl p-8 sm:p-10 lg:col-span-6">
            <p className="eyebrow !text-[#7fc8ad]">{PLANS.eyebrow}</p>
            <h2 className="font-display h2 mt-4 text-white">{PLANS.h}</h2>
            <p className="mt-5 leading-relaxed text-band-mut">{PLANS.body}</p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {PLANS.tiers.map((t) => (
                <div
                  key={t.name}
                  className={`rounded-xl border p-5 ${t.highlight ? "border-[#7fc8ad]/60 bg-[#7fc8ad]/5" : "border-band-line"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-[1.15rem] text-white">{t.name}</h3>
                    {t.highlight && (
                      <span className="mono-num rounded-full border border-[#7fc8ad]/50 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] text-[#7fc8ad]">
                        Most chosen
                      </span>
                    )}
                  </div>
                  <p className="mt-2">
                    {t.price.startsWith("From ") ? (
                      <>
                        <span className="mr-1 text-[0.8rem] text-band-mut">From</span>
                        <span className="mono-num text-[1.25rem] font-semibold text-band-ink">{t.price.slice(5)}</span>
                      </>
                    ) : (
                      <span className="mono-num text-[1.25rem] font-semibold text-band-ink">{t.price}</span>
                    )}
                    <span className="text-[0.8rem] text-band-mut">{t.period}</span>
                  </p>
                  <p className="mt-1 text-[0.8rem] font-medium text-band-mut">{t.bestFor}</p>
                  <ul className="mt-3 space-y-1.5">
                    {t.highlights.map((h) => (
                      <li key={h} className="flex gap-2 text-[0.82rem] leading-snug text-band-ink">
                        <Check size={13} className="mt-0.5 shrink-0 text-[#7fc8ad]" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-band-line p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[1rem] font-bold text-band-ink">{PLANS.websiteOnly.name}</h3>
                <p className="mono-num text-[1.05rem] font-semibold text-band-ink">{PLANS.websiteOnly.price}</p>
              </div>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-band-mut">{PLANS.websiteOnly.copy}</p>
            </div>
            <Link href="/pricing" className="link-arrow mt-6 !text-[#7fc8ad] text-[0.95rem]">
              {PLANS.cta}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 11 — WHY (copy right) */}
      <section ref={reg(11)} className="relative z-10 flex min-h-screen items-center">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className={`glass max-w-xl p-8 sm:p-10 ${col(-1)}`}>
            <p className="eyebrow !text-[#7fc8ad]">{WHY.eyebrow}</p>
            <h2 className="font-display h2 mt-4 text-white">{WHY.h}</h2>
            <p className="mt-5 leading-relaxed text-band-mut">{WHY.body}</p>
            <ul className="mt-6 space-y-2.5">
              {WHY.points.map((p) => (
                <li key={p} className="flex gap-3 text-[0.95rem] font-medium text-band-ink">
                  <Check size={16} className="mt-0.5 shrink-0 text-[#7fc8ad]" />
                  {p}
                </li>
              ))}
            </ul>
            {/* Founder block — placeholder content (SITE-PLAN §11). */}
            <div className="mt-7 flex items-center gap-4 border-t border-band-line pt-6">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#7fc8ad]/10 font-display text-[1.3rem] text-[#7fc8ad]"
                aria-hidden="true"
              >
                G
              </span>
              <div>
                <p className="font-display text-[1.05rem] text-white">{WHY.founder.name}</p>
                <p className="mt-0.5 text-[0.88rem] leading-relaxed text-band-mut">&ldquo;{WHY.founder.line}&rdquo;</p>
                <p className="eyebrow mt-2 !text-band-mut">{WHY.founder.location}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12 — FINAL CTA (copy left) */}
      <section ref={reg(12)} className="relative z-10 flex min-h-screen items-center py-24">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="glass p-8 sm:p-10">
              <h2 className="font-display h2 text-white">{FINAL_CTA.h}</h2>
              <p className="mt-5 text-[1.02rem] leading-relaxed text-band-mut">{FINAL_CTA.body}</p>
              <p className="mono-num mt-3 text-[0.85rem] text-band-mut">{FINAL_CTA.micro}</p>
              <div className="mt-7">
                <AuditForm id="audit-form" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
