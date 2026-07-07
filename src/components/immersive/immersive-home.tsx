"use client";

/**
 * Motion v2 — the immersive homepage, dark end to end.
 * Copy tiles alternate sides; the growth-system object and each section's
 * exhibit occupy the open half (rendered by the canvas behind). All copy is
 * imported verbatim from lib/content.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowRight, Check } from "@/components/icons";
import {
  HERO, PROBLEM, SYSTEM, FUEL, DESKII, OFFER, OWNERSHIP,
  INDUSTRIES, PROCESS, PLANS, WHY, FINAL_CTA,
} from "@/lib/content";
import { AuditForm } from "@/components/audit-form";
import { journey, clamp01, pinProgress } from "./journey-store";

const JourneyScene = dynamic(() => import("./scene"), { ssr: false });

/** Copy tile column helpers: side 1 = left, -1 = right. */
const col = (side: 1 | -1) =>
  side === 1 ? "lg:col-span-6" : "lg:col-span-6 lg:col-start-7";

/** Wayfinding: one tick per journey stop, current chapter read out below. */
const CHAPTERS = [
  "Start", "The problem", "The system", "Growth fuel", "Deskii", "The offer",
  "Industries", "How it works", "Plans", "Trust", "Begin",
];

/** Crossfade styles for the 2-beat pinned chapters (process/proof, trust). */
const beatStyle = (on: boolean) =>
  ({
    opacity: on ? 1 : 0,
    transform: on ? "none" : "translateY(14px)",
    pointerEvents: on ? "auto" : "none",
  }) as const;

function ChapterRail({
  sec,
  els,
}: {
  sec: number;
  els: RefObject<(HTMLElement | null)[]>;
}) {
  return (
    <nav className="rail" aria-label="Journey chapters">
      {CHAPTERS.map((label, i) => (
        <button
          key={label}
          type="button"
          title={label}
          aria-label={`Go to ${label}`}
          aria-current={sec === i ? "true" : undefined}
          onClick={() => {
            const el = els.current?.[i];
            if (el)
              window.scrollTo({
                top: el.getBoundingClientRect().top + window.scrollY,
                behavior: "smooth",
              });
          }}
        />
      ))}
      <span className="rail-num">
        {String(sec + 1).padStart(2, "0")} / {CHAPTERS.length}
      </span>
    </nav>
  );
}

export default function ImmersiveHome() {
  const journeyEl = useRef<HTMLDivElement>(null);
  const canvasWrap = useRef<HTMLDivElement>(null);
  const secEls = useRef<(HTMLElement | null)[]>([]);
  const reg = (i: number) => (el: HTMLElement | null) => {
    secEls.current[i] = el;
  };
  const [pillar, setPillar] = useState(0);
  const [deskMod, setDeskMod] = useState(0);
  const [sec, setSec] = useState(0);
  const [trustBeat, setTrustBeat] = useState(0);
  const [canvasOn, setCanvasOn] = useState(false);
  const [past, setPast] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      /* no WebGL — static dark page */
    }
    if (!webgl) return;
    // Mount the Canvas on a short timer so React StrictMode's dev
    // double-invoke (effect → cleanup → effect) cancels the first schedule
    // and only ONE R3F instance ever mounts. Two instances share one
    // <canvas> element, and disposing the first force-loses the GL context
    // out from under the second — the dev-only "frozen scene" bug.
    const id = window.setTimeout(() => setCanvasOn(true), 250);
    return () => window.clearTimeout(id);
  }, []);

  // Reveal: tiles glide into place as their section enters the middle band
  // of the viewport (and re-glide on the way back up). CSS handles the motion.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("in", e.isIntersecting)),
      { rootMargin: "-30% 0px -30% 0px" }
    );
    secEls.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Flow: own the wheel on desktop. The first wheel movement immediately
  // starts one continuous ease-out glide to the next stop in that direction —
  // no raw-scroll-then-correct hitch. Reversing mid-glide retargets at once;
  // sustained input chains through stops; touch/scrollbar cancel the glide.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let animating = false;
    let from = 0;
    let to = 0;
    let begin = 0;
    let dur = 0;
    let acc = 0;
    let revAcc = 0;
    let lastWheel = 0;
    let prevMag = 0;
    let heldRun = 0; // consecutive non-decaying wheel events
    // One gesture = one stop. After a glide the wheel dis-arms; it re-arms only
    // on a genuinely new gesture, so a flick's decaying inertia tail can't fire
    // a second glide — but sustained scrolling (which holds its magnitude) does.
    let armed = true;

    const stops = () => {
      const y = window.scrollY;
      const t: number[] = [];
      document
        .querySelectorAll<HTMLElement>(".journey > section, .journey .snap-beat")
        .forEach((el) => t.push(Math.round(el.getBoundingClientRect().top + y)));
      t.push(document.documentElement.scrollHeight - window.innerHeight);
      return t.sort((a, b) => a - b);
    };
    const nextStop = (dir: number, fromY: number) => {
      const ts = stops();
      return dir > 0 ? ts.find((t) => t > fromY + 2) : [...ts].reverse().find((t) => t < fromY - 2);
    };

    // ease-out: motion is visible within the first frames (response), and
    // the long deceleration makes the landing read as deliberate.
    const ease = (k: number) => 1 - Math.pow(1 - k, 4);
    const tick = (now: number) => {
      const k = Math.min(1, (now - begin) / dur);
      window.scrollTo(0, from + (to - from) * ease(k));
      if (k < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        animating = false;
      }
    };
    const go = (target: number) => {
      from = window.scrollY;
      to = target;
      revAcc = 0;
      armed = false;
      if (Math.abs(to - from) < 2) return;
      begin = performance.now();
      dur = Math.min(1400, 650 + Math.abs(to - from) * 0.45);
      if (!animating) {
        animating = true;
        raf = requestAnimationFrame(tick);
      }
    };
    const cancelGlide = () => {
      if (!animating) return;
      cancelAnimationFrame(raf);
      animating = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return; // browser zoom
      if (!window.matchMedia("(min-width: 1024px)").matches) return;
      // overflowing active section (no CSS zoom support, heavy browser zoom):
      // leave native scrolling alone so all content stays reachable.
      const active = secEls.current[journey.sec];
      const sec = active && (active.matches("section") ? active : active.querySelector("section"));
      if (sec && sec.scrollHeight > window.innerHeight + 4) return;
      const d =
        e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      if (d === 0) return;
      e.preventDefault();
      const now = performance.now();
      const gapMs = now - lastWheel;
      lastWheel = now;
      const mag = Math.abs(d);
      // "held" = a non-trivial magnitude that didn't drop. A continuous scroll
      // holds its magnitude; an inertia tail decays AND flattens to near-zero,
      // so the >=10 floor keeps the spent tail's constant 1-2px crawl from
      // counting as sustained input.
      const held = mag >= 10 && mag >= prevMag * 0.85;
      heldRun = gapMs > 200 ? 0 : held ? heldRun + 1 : 0;
      prevMag = mag;

      if (animating) {
        if (Math.sign(d) !== Math.sign(to - from)) {
          // reversed intent (inertia never changes sign): retarget once the
          // reversal is deliberate, not trackpad jitter
          revAcc += Math.abs(d);
          if (revAcc >= 80) {
            const t = nextStop(Math.sign(d), window.scrollY);
            if (t !== undefined) go(t);
          }
        } else {
          revAcc = 0; // same direction mid-glide is swallowed — one stop per gesture
        }
        return;
      }

      // Re-arm on a genuinely new gesture, never on a spent inertia tail.
      // A tail is weak (mag ≤ ~8) and only decays, so every path below
      // demands real magnitude: a meaningful push after a pause, sustained
      // non-decaying input (continuous scroll), or a hard notch. (Magnitude
      // is required even on the pause path because a busy main thread can
      // space a decaying tail's events out past 200ms.)
      if (!armed) {
        if ((gapMs > 200 && mag >= 14) || heldRun >= 3 || (mag >= 100 && gapMs > 120 && held)) armed = true;
        else return;
      }
      if (gapMs > 220) acc = 0;
      acc += d;
      if (Math.abs(acc) < 60) return;
      const dir = Math.sign(acc);
      acc = 0;
      const t = nextStop(dir, window.scrollY);
      if (t !== undefined) go(t);
    };

    // keyboard travels the same stops with the same glide
    const onKey = (e: KeyboardEvent) => {
      if (!window.matchMedia("(min-width: 1024px)").matches) return;
      const el = e.target as HTMLElement;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.tagName === "BUTTON" ||
          el.tagName === "A" ||
          el.isContentEditable)
      )
        return;
      const down = e.key === "PageDown" || e.key === "ArrowDown" || (e.key === " " && !e.shiftKey);
      const up = e.key === "PageUp" || e.key === "ArrowUp" || (e.key === " " && e.shiftKey);
      if (!down && !up) return;
      const t = nextStop(down ? 1 : -1, animating ? to : window.scrollY);
      if (t === undefined) return;
      e.preventDefault();
      go(t);
    };

    const opts = { passive: false } as AddEventListenerOptions;
    window.addEventListener("wheel", onWheel, opts);
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", cancelGlide, { passive: true });
    window.addEventListener("pointerdown", cancelGlide, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", cancelGlide);
      window.removeEventListener("pointerdown", cancelGlide);
    };
  }, []);

  // Settle: once scrolling goes idle, glide to the nearest section top (or
  // beat marker inside a pinned section) so the page always rests composed.
  // The safety net for scrollbar drags and any input the flow doesn't own.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const w = window as Window & { __gfSettling?: boolean };
    let idle = 0;
    let rest = window.scrollY; // last composed resting position
    const settle = () => {
      w.__gfSettling = false;
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        rest = y;
        return;
      }
      // If the active section's own content overflows the viewport (no CSS
      // zoom support, heavy browser zoom), never pull the user away from it.
      const active = secEls.current[journey.sec];
      const activeSec = active && (active.matches("section") ? active : active.querySelector("section"));
      if (activeSec && activeSec.scrollHeight > vh + 4) {
        rest = y;
        return;
      }
      // Stops: section tops, the per-beat markers inside the pinned sections,
      // and the end of the document (footer is a first-class resting place).
      // The pinned WRAPPER tops are intentionally excluded — their first beat
      // already lands on the first pillar, so counting the wrapper top too
      // produced a duplicate stop (a dead "extra swipe" before the 2nd pillar).
      const targets: number[] = [];
      document
        .querySelectorAll<HTMLElement>(".journey > section, .journey .snap-beat")
        .forEach((el) => targets.push(Math.round(el.getBoundingClientRect().top + y)));
      targets.push(document.documentElement.scrollHeight - vh);
      // Directional: a deliberate scroll commits to the next stop in that
      // direction (one wheel notch = next section/beat); a nudge stays put.
      const dir = y > rest + 56 ? 1 : y < rest - 56 ? -1 : 0;
      let cands = targets;
      if (dir === 1) cands = targets.filter((t) => t > rest + 2);
      else if (dir === -1) cands = targets.filter((t) => t < rest - 2);
      if (cands.length === 0) cands = targets;
      const best = cands.reduce((a, t) => (Math.abs(t - y) < Math.abs(a - y) ? t : a));
      if (Math.abs(best - y) <= 2) {
        // Arrived/composed. Only NOW move the rest anchor: a glide that gets
        // re-entered mid-flight (scroll-event gaps on slow frames) must keep
        // measuring direction from where the gesture started, or the halfway
        // point reads as an opposite-direction gesture and the page reverses.
        rest = best;
      } else {
        w.__gfSettling = true;
        window.scrollTo({ top: best, behavior: "smooth" });
      }
    };
    const onScroll = () => {
      window.clearTimeout(idle);
      idle = window.setTimeout(settle, 180);
    };
    const onResize = () => {
      rest = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(idle);
      w.__gfSettling = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
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
            // Fade the scene out as the footer takes the stage.
            canvasWrap.current.style.opacity = String(
              clamp01((r.bottom / window.innerHeight - 0.55) / 0.4)
            );
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
        setSec((p) => (p === idx ? p : idx));
        journey.sys = pinProgress(secEls.current[2] as HTMLElement);
        journey.desk = pinProgress(secEls.current[4] as HTMLElement);
        journey.trust = pinProgress(secEls.current[9] as HTMLElement);
        const pi = Math.min(6, Math.floor(journey.sys * 7));
        setPillar((p) => (p === pi ? p : pi));
        const di = Math.min(5, Math.floor(journey.desk * 6));
        setDeskMod((p) => (p === di ? p : di));
        const tb = journey.trust < 0.5 ? 0 : 1;
        setTrustBeat((p) => (p === tb ? p : tb));
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
      {!past && <ChapterRail sec={sec} els={secEls} />}

      {/* 0 — HERO (copy left) */}
      <section ref={reg(0)} className="relative z-10 flex min-h-screen items-center pt-16 max-lg:items-start max-lg:pb-20 max-lg:pt-[38vh]">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a0f0c]/90 via-[#0a0f0c]/55 to-transparent"
          aria-hidden="true"
        />
        <div className="container-g relative grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7" data-reveal>
            <p className="eyebrow !text-[#7fc8ad]">{HERO.eyebrow}</p>
            <h1 className="font-display h1 mt-6 text-white">
              {HERO.h1a} <span className="text-[#7fc8ad]">{HERO.h1b}</span> {HERO.h1c}
            </h1>
            <p className="measure mt-7 max-w-xl text-[1.12rem] leading-relaxed text-band-mut">{HERO.sub}</p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link href="/audit" className="btn btn-primary !px-7 !py-4 text-[1.02rem]">
                {HERO.primaryCta}
                <ArrowRight size={16} />
              </Link>
              <Link href="/how-it-works" className="link-arrow !text-[#7fc8ad] text-[0.98rem]">
                {HERO.secondaryCta}
                <ArrowRight size={15} />
              </Link>
            </div>
            <ul className="mt-12 flex max-w-xl flex-wrap gap-x-6 gap-y-2.5 border-t border-band-line pt-5 text-[0.88rem] font-medium text-band-mut">
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

      {/* 1 — PROBLEM (copy right, open typography — the copy sits on the scene) */}
      <section ref={reg(1)} className="relative z-10 flex min-h-screen items-center max-lg:items-start max-lg:pb-20 max-lg:pt-[42vh]">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className={`max-w-2xl ${col(-1)}`} data-reveal>
            <p className="eyebrow !text-[#7fc8ad]">{PROBLEM.eyebrow}</p>
            <h2 className="font-display h2 mt-5 text-white">{PROBLEM.h}</h2>
            <p className="mt-7 max-w-xl leading-relaxed text-band-mut">{PROBLEM.body}</p>
            <ul className="chapter-list mt-10 sm:grid-cols-2">
              {PROBLEM.points.map((p, i) => (
                <li key={p}>
                  <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[0.95rem] font-medium text-band-ink">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 2 — SYSTEM (pinned, copy left) */}
      <div ref={reg(2)} className="relative h-[400vh]">
        {/* snap targets: scrolling settles on each pillar beat (sys = (i+.5)/N).
            300vh = wrapper 400vh minus one viewport (pinProgress denominator). */}
        {SYSTEM.pillars.map((pl, i) => (
          <div
            key={pl.n}
            className="snap-beat"
            style={{ top: `${((i + 0.5) / SYSTEM.pillars.length) * 300}vh` }}
            aria-hidden
          />
        ))}
        <section className="sticky top-0 z-10 flex h-screen items-center max-lg:items-start max-lg:pt-[24vh]" id="system">
          <div className="container-g grid gap-10 lg:grid-cols-12">
            <div className="max-w-xl lg:col-span-6" data-reveal>
              <p className="eyebrow !text-[#7fc8ad]">{SYSTEM.eyebrow}</p>
              <h2 className="font-display h2 mt-5 text-white">{SYSTEM.h}</h2>
              <div className="relative mt-10 min-h-[300px] border-t border-band-line pt-7 lg:min-h-[210px]" aria-hidden="true">
                {SYSTEM.pillars.map((pl, i) => (
                  <div
                    key={pl.n}
                    className="absolute inset-x-0 top-7 transition-all duration-500"
                    style={{
                      opacity: pillar === i ? 1 : 0,
                      transform: pillar === i ? "none" : "translateY(14px)",
                      pointerEvents: pillar === i ? "auto" : "none",
                    }}
                  >
                    <p className="mono-num text-[0.85rem] font-medium text-[#7fc8ad]">{pl.n} / 07</p>
                    <h3 className="font-display mt-2.5 text-[1.9rem] text-white">{pl.name}</h3>
                    <p className="mt-3.5 max-w-lg leading-relaxed text-band-mut">{pl.copy}</p>
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
              <div className="mt-7 flex gap-1.5" aria-hidden>
                {SYSTEM.pillars.map((pl, i) => (
                  <span
                    key={pl.n}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= pillar ? "bg-[#7fc8ad]" : "bg-band-line"}`}
                  />
                ))}
              </div>
              <p className="mt-5 max-w-lg text-[0.88rem] leading-relaxed text-band-mut">{SYSTEM.body}</p>
            </div>
          </div>
        </section>
      </div>

      {/* 3 — GROWTH FUEL (copy right, open typography) */}
      <section ref={reg(3)} className="relative z-10 flex min-h-screen items-center max-lg:items-start max-lg:pb-20 max-lg:pt-[42vh]">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className={`max-w-2xl ${col(-1)}`} data-reveal>
            <p className="eyebrow !text-[#7fc8ad]">{FUEL.eyebrow}</p>
            <h2 className="font-display h2 mt-5 text-white">{FUEL.h}</h2>
            <p className="mt-6 max-w-xl leading-relaxed text-band-mut">{FUEL.body}</p>
            <ul className="mt-9 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {FUEL.channels.map((c) => (
                <li key={c.name} className="border-t border-band-line pt-3">
                  <span className="block text-[0.95rem] font-bold text-band-ink">{c.name}</span>
                  <span className="mt-0.5 block text-[0.86rem] leading-snug text-band-mut">{c.copy}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 space-y-1.5 border-l-2 border-[#7fc8ad] pl-5 text-[0.92rem]">
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

      {/* 4 — DESKII (copy left) — the whole app grows out of the gem on arrival,
          so this is a single-viewport section now (no pin / no dead scroll). */}
      <section ref={reg(4)} className="relative z-10 flex min-h-screen items-center max-lg:items-start max-lg:pb-20 max-lg:pt-[42vh]">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className="max-w-xl lg:col-span-6" data-reveal>
            <p className="eyebrow !text-[#7fc8ad]">{DESKII.eyebrow}</p>
            <h2 className="font-display h2 mt-5 text-white">{DESKII.h}</h2>
            <p className="mt-6 max-w-lg leading-relaxed text-band-mut">{DESKII.body}</p>
            <ul className="mt-8 space-y-0 text-[0.95rem] leading-snug">
              {DESKII.features.map((f, i) => (
                <li key={f.name} className="border-t border-band-line py-2.5 transition-colors duration-300">
                  <span className={`font-bold ${deskMod === i ? "text-[#7fc8ad]" : "text-band-ink"}`}>{f.name}</span>
                  <span className="text-band-mut"> — {f.copy}</span>
                </li>
              ))}
            </ul>
            <Link href="/deskii" className="link-arrow mt-6 !text-[#7fc8ad] text-[0.98rem]">
              {DESKII.cta}
              <ArrowRight size={15} />
            </Link>
            <p className="mono-num mt-5 text-[0.78rem] text-band-mut">
              Deskii — the client command center every Gemfield engagement runs on
            </p>
          </div>
        </div>
      </section>

      {/* 5 — OFFER (copy right, open typography; the qualification card lives
          with Plans now — same message, next to the prices it qualifies) */}
      <section ref={reg(5)} className="relative z-10 flex min-h-screen items-center max-lg:items-start max-lg:pb-20 max-lg:pt-[42vh]">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className={`max-w-2xl ${col(-1)}`} data-reveal>
            <p className="eyebrow !text-[#7fc8ad]">{OFFER.eyebrow}</p>
            <h2 className="font-display h2 mt-5 text-white">{OFFER.h}</h2>
            <p className="mt-7 max-w-xl text-[1.05rem] leading-relaxed text-band-mut">{OFFER.body}</p>
            <Link href="/audit" className="btn btn-primary mt-9 !px-6 !py-3.5">
              {OFFER.cta}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* 6 — INDUSTRIES (copy left now — Ownership moved into the Trust chapter) */}
      <section ref={reg(6)} className="relative z-10 flex min-h-screen items-center max-lg:items-start max-lg:pb-20 max-lg:pt-[42vh]" id="industries">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className="max-w-2xl lg:col-span-6" data-reveal>
            <p className="eyebrow !text-[#7fc8ad]">{INDUSTRIES.eyebrow}</p>
            <h2 className="font-display h2 mt-5 text-white">{INDUSTRIES.h}</h2>
            <p className="mt-6 max-w-xl leading-relaxed text-band-mut">{INDUSTRIES.body}</p>
            <ul className="mt-9 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {INDUSTRIES.cards.map((c) => (
                <li key={c.name} className="border-t border-band-line pt-3">
                  <h3 className="font-display text-[1.18rem] text-white">{c.name}</h3>
                  <p className="mt-1 text-[0.88rem] leading-snug text-band-mut">{c.copy}</p>
                </li>
              ))}
              <li className="border-t border-band-line pt-3">
                <h3 className="font-display text-[1.18rem] text-white">Another service business?</h3>
                <p className="mt-1 text-[0.88rem] leading-snug text-band-mut">
                  If your business grows when the phone rings, forms come in, and calendars fill up — the
                  system fits. Tell us what you do in the audit.
                </p>
              </li>
            </ul>
            <Link href="/audit" className="link-arrow mt-7 !text-[#7fc8ad] text-[0.95rem]">
              Get your audit
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 7 — HOW IT WORKS (single-viewport Process; copy right) */}
      <section ref={reg(7)} className="relative z-10 flex min-h-screen items-center pt-16 max-lg:items-start max-lg:pb-20 max-lg:pt-[42vh]">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className={`max-w-2xl ${col(-1)}`} data-reveal>
            <p className="eyebrow !text-[#7fc8ad]">{PROCESS.eyebrow}</p>
            <h2 className="font-display h2 mt-5 text-white">{PROCESS.h}</h2>
            <ol className="mt-8 space-y-4">
              {PROCESS.steps.map((s) => (
                <li key={s.n} className="flex gap-5 border-t border-band-line pt-3.5">
                  <span className="mono-num shrink-0 text-[0.9rem] font-medium text-[#7fc8ad]">{s.n}/5</span>
                  <div>
                    <h3 className="font-display text-[1.25rem] text-white">{s.name}</h3>
                    <p className="mt-1 max-w-lg text-[0.92rem] leading-relaxed text-band-mut">{s.copy}</p>
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

      {/* 8 — PLANS (full-width structured pricing; the qualification from the
          Offer chapter lives here, next to the prices it qualifies) */}
      <section ref={reg(8)} className="relative z-10 flex min-h-screen items-center pt-16 max-lg:items-start max-lg:pb-20 max-lg:pt-[42vh]">
        <div className="container-g w-full">
          <div className="grid gap-8 lg:grid-cols-12" data-reveal>
            <div className="lg:col-span-7">
              <p className="eyebrow !text-[#7fc8ad]">{PLANS.eyebrow}</p>
              <h2 className="font-display h2 mt-4 text-white">{PLANS.h}</h2>
              <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed text-band-mut">{PLANS.body}</p>
            </div>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal>
            {PLANS.tiers.map((t) => (
              <div
                key={t.name}
                className={`glass p-5 ${t.highlight ? "!border-[#7fc8ad]/50" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-[1.15rem] text-white">{t.name}</h3>
                  {t.highlight && (
                    <span className="mono-num rounded-full border border-[#7fc8ad]/50 px-2 py-0.5 text-[0.64rem] uppercase tracking-[0.1em] text-[#7fc8ad]">
                      Most chosen
                    </span>
                  )}
                </div>
                <p className="mt-3">
                  {t.price.startsWith("From ") ? (
                    <>
                      <span className="mr-1.5 text-[0.82rem] text-band-mut">From</span>
                      <span className="mono-num text-[1.45rem] font-semibold text-band-ink">{t.price.slice(5)}</span>
                    </>
                  ) : (
                    <span className="mono-num text-[1.45rem] font-semibold text-band-ink">{t.price}</span>
                  )}
                  <span className="text-[0.82rem] text-band-mut">{t.period}</span>
                </p>
                <p className="mt-2 min-h-[3.4em] text-[0.84rem] font-medium leading-snug text-band-mut">{t.bestFor}</p>
                <ul className="mt-3 space-y-1.5 border-t border-band-line pt-3">
                  {t.highlights.map((h) => (
                    <li key={h} className="flex gap-2 text-[0.86rem] leading-snug text-band-ink">
                      <Check size={13} className="mt-0.5 shrink-0 text-[#7fc8ad]" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-x-10 gap-y-4 border-t border-band-line pt-5 lg:grid-cols-12" data-reveal>
            <div className="lg:col-span-5">
              <div className="flex flex-wrap items-baseline gap-x-4">
                <h3 className="text-[0.95rem] font-bold text-band-ink">{PLANS.websiteOnly.name}</h3>
                <p className="mono-num text-[1rem] font-semibold text-band-ink">{PLANS.websiteOnly.price}</p>
              </div>
              <p className="mt-1.5 text-[0.84rem] leading-snug text-band-mut">{PLANS.websiteOnly.copy}</p>
              <Link href="/pricing" className="link-arrow mt-3 !text-[#7fc8ad] text-[0.95rem]">
                {PLANS.cta}
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <p className="eyebrow !text-[#7fc8ad]">Selective, on purpose</p>
              <p className="mt-1.5 max-w-xl text-[0.92rem] font-medium leading-relaxed text-band-ink">
                {OFFER.qualification}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9 — TRUST (pinned, 2 beats: ownership → why; copy right) */}
      <div ref={reg(9)} className="relative h-[200vh]">
        {[0, 1].map((i) => (
          <div key={i} className="snap-beat" style={{ top: `${((i + 0.5) / 2) * 100}vh` }} aria-hidden />
        ))}
        <section className="sticky top-0 z-10 flex h-screen items-center pt-16 max-lg:items-start max-lg:pt-[20vh]">
          <div className="container-g grid gap-10 lg:grid-cols-12">
            {/* both beats share one grid cell (see How-it-works note) */}
            <div className={`grid max-w-2xl ${col(-1)}`}>
              {/* beat 0 — the ownership pledge */}
              <div
                className="col-start-1 row-start-1 self-center transition-all duration-500"
                style={beatStyle(trustBeat === 0)}
                inert={trustBeat !== 0}
              >
                <p className="eyebrow !text-[#7fc8ad]">{OWNERSHIP.eyebrow}</p>
                <h2 className="font-display h2 mt-5 text-white">{OWNERSHIP.h}</h2>
                <p className="mt-4 text-[0.98rem] font-medium text-[#7fc8ad]">{OWNERSHIP.kicker}</p>
                <dl className="mt-7">
                  {OWNERSHIP.declarations.map((d) => (
                    <div key={d.k} className="grid gap-1 border-t border-band-line py-3 sm:grid-cols-[160px_1fr] sm:gap-6">
                      <dt className="text-[0.95rem] font-bold text-band-ink">{d.k}</dt>
                      <dd className="text-[0.92rem] text-band-mut">{d.v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 max-w-xl border-t border-band-line pt-4 text-[0.88rem] leading-relaxed text-band-mut">
                  {OWNERSHIP.terms}
                </p>
              </div>
              {/* beat 1 — why Gemfield + founder */}
              <div
                className="col-start-1 row-start-1 self-center transition-all duration-500"
                style={beatStyle(trustBeat === 1)}
                inert={trustBeat !== 1}
              >
                <p className="eyebrow !text-[#7fc8ad]">{WHY.eyebrow}</p>
                <h2 className="font-display h2 mt-5 text-white">{WHY.h}</h2>
                <p className="mt-5 max-w-xl leading-relaxed text-band-mut">{WHY.body}</p>
                <ul className="mt-7 space-y-2.5">
                  {WHY.points.map((p) => (
                    <li key={p} className="flex gap-3 text-[0.95rem] font-medium text-band-ink">
                      <Check size={16} className="mt-0.5 shrink-0 text-[#7fc8ad]" />
                      {p}
                    </li>
                  ))}
                </ul>
                {/* Founder block — placeholder content (SITE-PLAN §11). */}
                <div className="mt-8 flex items-center gap-4 border-t border-band-line pt-6">
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
              {/* no-JS / crawler fallback for the hidden beat */}
              <div className="sr-only">
                {WHY.eyebrow}: {WHY.h}. {WHY.body} {WHY.points.join(" ")} {WHY.founder.name} —{" "}
                {WHY.founder.line} {WHY.founder.location}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 10 — FINAL CTA (copy left) */}
      <section ref={reg(10)} className="relative z-10 flex min-h-screen items-center pt-16 max-lg:items-start max-lg:pb-20 max-lg:pt-[38vh]">
        <div className="container-g grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6" data-reveal>
            <h2 className="font-display h2 text-white">{FINAL_CTA.h}</h2>
            <p className="mt-4 max-w-xl text-[1rem] leading-relaxed text-band-mut">{FINAL_CTA.body}</p>
            <p className="mono-num mt-2 text-[0.82rem] text-band-mut">{FINAL_CTA.micro}</p>
            <div className="glass mt-5 p-5">
              <AuditForm id="audit-form" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
