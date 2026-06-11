"use client";

import Link from "next/link";
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

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
        solid || open
          ? "border-b border-hairline bg-paper/95 backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container-g flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="Gemfield Consulting — home" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[0.92rem] font-medium text-ink2 transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {SITE.phone && (
            <a
              href={`tel:${SITE.phone}`}
              className="hidden items-center gap-2 text-[0.92rem] font-semibold text-ink md:inline-flex"
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
            className="-mr-1 p-1.5 lg:hidden"
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
          className="border-t border-hairline bg-paper px-6 pb-6 pt-3 lg:hidden"
          aria-label="Mobile"
        >
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-hairline py-3.5 text-[1.02rem] font-medium"
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
