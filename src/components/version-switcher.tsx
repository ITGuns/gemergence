"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Floating pill to switch between the immersive and classic homepages. */
export function VersionSwitcher() {
  const pathname = usePathname();
  if (pathname !== "/" && pathname !== "/classic") return null;
  const onImmersive = pathname === "/";

  const base =
    "rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition-colors";
  return (
    <div
      className="on-dark-focus fixed bottom-5 left-5 z-[60] flex items-center gap-1 rounded-full border border-band-line bg-band/90 p-1 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-sm"
      role="navigation"
      aria-label="Site version"
    >
      <Link
        href="/"
        aria-current={onImmersive ? "page" : undefined}
        className={`${base} ${onImmersive ? "bg-[#7fc8ad] text-band" : "text-band-mut hover:text-band-ink"}`}
      >
        Immersive
      </Link>
      <Link
        href="/classic"
        aria-current={!onImmersive ? "page" : undefined}
        className={`${base} ${!onImmersive ? "bg-band-ink text-band" : "text-band-mut hover:text-band-ink"}`}
      >
        Classic
      </Link>
    </div>
  );
}
