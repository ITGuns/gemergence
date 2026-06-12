"use client";

/**
 * The immersive homepage: a scroll-driven journey through the growth system.
 * Copy is imported verbatim from lib/content — this file changes presentation only.
 * The Three.js canvas mounts behind; pinned CSS-sticky sections drive set pieces.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@/components/icons";
import {
  HERO, PROBLEM, SYSTEM, FUEL, DESKII, OFFER, OWNERSHIP,
} from "@/lib/content";
import {
  Industries, Process, Proof, Plans, Why, FinalCta,
} from "@/components/home/closing-sections";
import { journey, clamp01, pinProgress } from "./journey-store";

const JourneyScene = dynamic(() => import("./scene"), { ssr: false });

export default function ImmersiveHome() {
  const journeyEl = useRef<HTMLDivElement>(null);
  const sysEl = useRef<HTMLDivElement>(null);
  const deskEl = useRef<HTMLDivElement>(null);
  const canvasWrap = useRef<HTMLDivElement>(null);
  const [pillar, setPillar] = useState(0);
  const [deskMod, setDeskMod] = useState(0);
  const [canvasOn, setCanvasOn] = useState(false);
  // True once the journey is fully scrolled past — pauses the render loop.
  const [past, setPast] = useState(false);

  // Mount the canvas only when motion is allowed and WebGL exists.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    try {
      const c = document.createElement("canvas");
      if (c.getContext("webgl2") || c.getContext("webgl")) setCanvasOn(true);
    } catch {
      /* no WebGL — static fallback */
    }
  }, []);

  // The scroll engine: feeds the journey store; minimal React state.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const j = journeyEl.current;
        if (j) {
          const r = j.getBoundingClientRect();
          journey.p = clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
        }
        journey.sys = pinProgress(sysEl.current);
        journey.desk = pinProgress(deskEl.current);
        const pi = Math.min(6, Math.floor(journey.sys * 7));
        setPillar((prev) => (prev === pi ? prev : pi));
        const di = Math.min(5, Math.floor(journey.desk * 6));
        setDeskMod((prev) => (prev === di ? prev : di));
        if (canvasWrap.current) {
          canvasWrap.current.style.opacity = String(1 - clamp01((journey.p - 0.96) / 0.04));
          // Drop the compositor layer entirely once invisible.
          const isPast = journey.p >= 0.999;
          canvasWrap.current.style.display = isPast ? "none" : "";
          setPast((prev) => (prev === isPast ? prev : isPast));
        }
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
    <>
      {/* ── The journey (dark, canvas-backed) ── */}
      <div ref={journeyEl} className="journey relative">
        <div ref={canvasWrap} className="pointer-events-none fixed inset-0 z-0" aria-hidden>
          {canvasOn && <JourneyScene paused={past} onContextLost={() => setCanvasOn(false)} />}
        </div>

        {/* S1 — HERO */}
        <section className="relative z-10 flex min-h-screen items-center pt-16">
          {/* Left scrim keeps hero copy at AA contrast over the gem glow + parallax. */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a0f0c]/95 via-[#0a0f0c]/70 to-transparent"
            aria-hidden="true"
          />
          <div className="container-g relative grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
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

        {/* S2 — PROBLEM */}
        <section className="relative z-10 flex min-h-screen items-center">
          <div className="container-g grid gap-10 lg:grid-cols-12">
            <div className="glass max-w-2xl p-8 sm:p-10 lg:col-span-7">
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

        {/* S3 — SYSTEM ASSEMBLY (pinned set piece) */}
        <div ref={sysEl} className="relative h-[420vh]">
          <section className="sticky top-0 z-10 flex h-screen items-center" id="system">
            <div className="container-g grid gap-10 lg:grid-cols-12">
              <div className="glass max-w-xl p-8 sm:p-10 lg:col-span-6">
                <p className="eyebrow !text-[#7fc8ad]">{SYSTEM.eyebrow}</p>
                <h2 className="font-display h2 mt-4 text-white">{SYSTEM.h}</h2>
                {/* Animated stack is presentation-only; the full list below is
                    always available to screen readers. */}
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

        {/* S4 — GROWTH FUEL (acceleration corridor) */}
        <section className="relative z-10 flex min-h-screen items-center">
          <div className="container-g grid gap-10 lg:grid-cols-12">
            <div className="glass max-w-2xl p-8 sm:p-10 lg:col-span-7 lg:col-start-6">
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

        {/* S5 — DESKII COMMAND DECK (pinned set piece) */}
        <div ref={deskEl} className="relative h-[320vh]">
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

        {/* S6 — OFFER */}
        <section className="relative z-10 flex min-h-screen items-center">
          <div className="container-g grid gap-8 lg:grid-cols-12">
            <div className="glass max-w-xl p-8 sm:p-10 lg:col-span-6">
              <p className="eyebrow !text-[#7fc8ad]">{OFFER.eyebrow}</p>
              <h2 className="font-display h2 mt-4 text-white">{OFFER.h}</h2>
              <p className="mt-6 leading-relaxed text-band-mut">{OFFER.body}</p>
            </div>
            <div className="glass self-end p-7 lg:col-span-5 lg:col-start-8">
              <p className="eyebrow !text-[#7fc8ad]">Selective, on purpose</p>
              <p className="mt-3 text-[1rem] font-medium leading-relaxed text-band-ink">{OFFER.qualification}</p>
              <Link href="/audit" className="btn btn-primary mt-6">
                {OFFER.cta}
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* S7 — OWNERSHIP (the handover) */}
        <section className="relative z-10 flex min-h-screen items-center pb-24">
          <div className="container-g grid gap-10 lg:grid-cols-12">
            <div className="glass self-start p-8 lg:col-span-5">
              <p className="eyebrow !text-[#7fc8ad]">{OWNERSHIP.eyebrow}</p>
              <h2 className="font-display h2 mt-4 text-white">{OWNERSHIP.h}</h2>
              <p className="mt-6 text-[1.02rem] font-medium text-[#7fc8ad]">{OWNERSHIP.kicker}</p>
            </div>
            <div className="glass p-8 lg:col-span-6 lg:col-start-7">
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
        </section>

        {/* Arrival: dissolve to paper */}
        <div className="relative z-10 h-[34vh] bg-gradient-to-b from-transparent via-[#fafaf7cc] to-paper" aria-hidden />
      </div>

      {/* ── Landing zone: the crisp ground-truth sections (existing components, identical copy) ── */}
      <div className="relative z-10 bg-paper">
        <Industries />
        <Process />
        <Proof />
        <Plans />
        <Why />
        <FinalCta />
      </div>
    </>
  );
}
