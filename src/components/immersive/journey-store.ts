/**
 * Motion v2 scroll state. One section is "active" at a time; the scene's
 * persistent growth-system object glides to the open side of that section
 * and the section's exhibit pops in beside the copy tile.
 *
 * Plain module singleton mutated by the scroll handler, read in useFrame —
 * no React renders on scroll.
 */

/** Section order — must match the DOM sections on the immersive page.
 * Redesign merge: "process" is a 2-beat pinned chapter (process → proof),
 * "trust" is a 2-beat pinned chapter (ownership → why). */
export const SECTION_IDS = [
  "hero",
  "problem",
  "system",
  "fuel",
  "deskii",
  "offer",
  "industries",
  "process",
  "plans",
  "trust",
  "cta",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/**
 * Which side the COPY tile sits on per section; the exhibit takes the other.
 * 1 = copy left → exhibit right; -1 = copy right → exhibit left.
 */
export const COPY_SIDE: Record<SectionId, 1 | -1> = {
  hero: 1,
  problem: -1,
  system: 1,
  fuel: -1,
  deskii: 1,
  offer: -1,
  industries: 1,
  process: -1,
  plans: 1,
  trust: -1,
  cta: 1,
};

type Journey = {
  /** 0..1 through the whole page */
  p: number;
  /** active section index into SECTION_IDS */
  sec: number;
  /** 0..1 progress within the active section */
  t: number;
  /** 0..1 through the pinned System assembly (7 pillar beats) */
  sys: number;
  /** 0..1 through the pinned Deskii showcase (6 module beats) */
  desk: number;
  /** 0..1 through the pinned Trust chapter (ownership → why beats) */
  trust: number;
  /** -1..1 normalized pointer for parallax */
  mx: number;
  my: number;
};

const fresh = (): Journey => ({ p: 0, sec: 0, t: 0, sys: 0, desk: 0, trust: 0, mx: 0, my: 0 });

/**
 * The scroll store MUST be a true singleton, but this module gets duplicated
 * across bundler chunk graphs (it is imported statically by the page and
 * inside the dynamically-imported scene chunk — each copy evaluates its own
 * module instance, so a plain `const` here would give the scroll handler and
 * the scene two different objects and the scene would never see scroll
 * updates). Keying the object on `window` makes every copy converge.
 * The server-side render gets an inert per-module object (no scrolling there).
 */
export const journey: Journey =
  typeof window === "undefined"
    ? fresh()
    : ((window as unknown as { __gfJourney?: Journey }).__gfJourney ??= fresh());

// QA/diagnostics alias.
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__journey = journey;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const smooth = (t: number) => t * t * (3 - 2 * t);

/** Progress of a sticky-pinned wrapper: 0 when its top hits the viewport top, 1 when its bottom leaves. */
export function pinProgress(el: HTMLElement | null): number {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  const total = r.height - window.innerHeight;
  if (total <= 0) return 0;
  return clamp01(-r.top / total);
}
