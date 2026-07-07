"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "./logo";
import { ArrowRight, Menu, Phone, X } from "./icons";
import { SITE } from "@/lib/constants";

const NAV = [
  { label: "Services", href: "/#system" },
  { label: "Marketing", href: "/marketing" },
  { label: "Industries", href: "/#industries" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  // The immersive journey at "/immersive" runs dark; everything else is paper.
  const dark = usePathname() === "/immersive";

  // The bar stays fixed in place the whole way down; it only picks up a solid
  // background once you've scrolled past the top.
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 ${
        solid || open
          ? dark
            ? "border-b border-band-line bg-band/90 backdrop-blur-sm"
            : "border-b border-hairline bg-paper/95 backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container-g flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="Gemfield Consulting — home" onClick={() => setOpen(false)}>
          <Wordmark dark={dark} />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`text-[0.92rem] font-medium transition-colors ${
                dark ? "text-band-mut hover:text-white" : "text-ink2 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {SITE.phone && (
            <a
              href={`tel:${SITE.phone}`}
              className={`hidden items-center gap-2 text-[0.92rem] font-semibold md:inline-flex ${dark ? "text-band-ink" : "text-ink"}`}
            >
              <Phone size={15} />
              {SITE.phoneDisplay ?? SITE.phone}
            </a>
          )}
          <Link href="/audit" className="btn btn-primary hidden !px-4 !py-2.5 text-[0.88rem] sm:inline-flex">
            Get a Free Growth Audit
            <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            className={`-mr-1 p-1.5 lg:hidden ${dark ? "text-band-ink" : ""}`}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className={`px-6 pb-6 pt-3 lg:hidden ${
            dark ? "border-t border-band-line bg-band text-band-ink" : "border-t border-hairline bg-paper"
          }`}
          aria-label="Mobile"
        >
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block py-3.5 text-[1.02rem] font-medium ${
                dark ? "border-b border-band-line" : "border-b border-hairline"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/audit"
            onClick={() => setOpen(false)}
            className="btn btn-primary mt-5 w-full justify-center"
          >
            Get a Free Growth Audit
            <ArrowRight size={15} />
          </Link>
        </nav>
      )}
    </header>
  );
}
