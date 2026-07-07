"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Floating pill to switch between the three homepage variants. */
const VARIANTS = [
  { href: "/", label: "Daylight" },
  { href: "/immersive", label: "Immersive" },
  { href: "/classic", label: "Classic" },
] as const;

export function VersionSwitcher() {
  const pathname = usePathname();
  const onImmersive = pathname === "/immersive";
  // On the immersive journey the pill is an entry/exit affordance: visible
  // near the top and once the footer arrives, tucked away mid-journey so it
  // never sits on tile content.
  const [away, setAway] = useState(false);
  useEffect(() => {
    if (!onImmersive) return;
    const onScroll = () => {
      const nearTop = window.scrollY < window.innerHeight * 0.5;
      const footer = document.querySelector("footer");
      const nearEnd = footer ? footer.getBoundingClientRect().top < window.innerHeight * 0.92 : false;
      setAway(!nearTop && !nearEnd);
    };
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [onImmersive]);

  if (!VARIANTS.some((v) => v.href === pathname)) return null;
  const tucked = away && onImmersive;

  const base = "rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition-colors";
  return (
    <div
      className={`on-dark-focus fixed bottom-5 left-5 z-[60] flex items-center gap-1 rounded-full border border-band-line bg-band/90 p-1 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-[translate,opacity,visibility] duration-300 ${
        tucked ? "pointer-events-none invisible translate-y-16 opacity-0" : "visible translate-y-0 opacity-100"
      }`}
      role="navigation"
      aria-label="Site version"
    >
      {VARIANTS.map((v) => {
        const active = pathname === v.href;
        return (
          <Link
            key={v.href}
            href={v.href}
            aria-current={active ? "page" : undefined}
            className={`${base} ${active ? "bg-[#7fc8ad] text-band" : "text-band-mut hover:text-band-ink"}`}
          >
            {v.label}
          </Link>
        );
      })}
    </div>
  );
}
