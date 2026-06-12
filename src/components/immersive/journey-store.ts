/**
 * Motion v2 scroll state. One section is "active" at a time; the scene's
 * persistent growth-system object glides to the open side of that section
 * and the section's exhibit pops in beside the copy tile.
 *
 * Plain module singleton mutated by the scroll handler, read in useFrame —
 * no React renders on scroll.
 */

/** Section order — must match the DOM sections on the immersive page. */
export const SECTION_IDS = [
  "hero",
  "problem",
  "system",
  "fuel",
  "deskii",
  "offer",
  "ownership",
  "industries",
  "process",
  "proof",
  "plans",
  "why",
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
  ownership: 1,
  industries: -1,
  process: 1,
  proof: -1,
  plans: 1,
  why: -1,
  cta: 1,
};

export const journey = {
  /** 0..1 through the whole page */
  p: 0,
  /** active section index into SECTION_IDS */
  sec: 0,
  /** 0..1 progress within the active section */
  t: 0,
  /** 0..1 through the pinned System assembly (7 pillar beats) */
  sys: 0,
  /** 0..1 through the pinned Deskii showcase (6 module beats) */
  desk: 0,
  /** -1..1 normalized pointer for parallax */
  mx: 0,
  my: 0,
};

// Dev/QA introspection (harmless in prod; lets tooling read scroll state).
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
