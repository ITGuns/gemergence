/**
 * Frame-rate scroll state shared between the DOM scroll handler and the
 * Three.js scene. Plain module singleton read inside useFrame — values
 * mutate every scroll tick without triggering React renders.
 */
export const journey = {
  /** 0..1 through the dark journey container */
  p: 0,
  /** 0..1 through the pinned System assembly */
  sys: 0,
  /** 0..1 through the pinned Deskii formation */
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

/** Journey section bands (global p ranges) — keep in sync with scene keyframes. */
export const BANDS = {
  hero: [0, 0.12],
  problem: [0.12, 0.26],
  system: [0.26, 0.54],
  fuel: [0.54, 0.66],
  deskii: [0.66, 0.86],
  handover: [0.86, 1],
} as const;

/** 0..1 presence of a band at progress p, with soft edges. */
export function bandWeight(p: number, band: readonly [number, number], feather = 0.04) {
  const [a, b] = band;
  const inUp = clamp01((p - (a - feather)) / feather);
  const outDown = clamp01(((b + feather) - p) / feather);
  return Math.min(inUp, outDown);
}
