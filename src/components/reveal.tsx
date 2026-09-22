"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Scroll-reveal wrapper: fades/rises once on first intersection. */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Hydration made it to the client, so the blank-page failsafe armed in
    // layout.tsx has nothing left to rescue. Cancel it before it fires and
    // pops the whole page into view mid-animation.
    const w = window as Window & { __gfRevealFailsafe?: ReturnType<typeof setTimeout> };
    if (w.__gfRevealFailsafe) {
      clearTimeout(w.__gfRevealFailsafe);
      w.__gfRevealFailsafe = undefined;
    }

    const show = () => el.classList.add("vis");

    // Nothing else un-hides a .reveal, so a missing IntersectionObserver
    // has to mean "show it now", never "leave it at opacity 0".
    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    // threshold 0, not a fraction: a section taller than the viewport can
    // never reach a fractional ratio (a 7000px block in an 800px window tops
    // out at 0.11) and would sit invisible forever. Any pixel counts; the
    // -40px bottom inset keeps the rise from playing at the screen edge.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={`reveal ${className ?? ""}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}
