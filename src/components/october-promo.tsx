import { Reveal } from "@/components/reveal";
import { ArrowRight, Check } from "@/components/icons";
import { RESTAURANTS_PAGE, isRestaurantPromoLive } from "@/lib/content";
import { SITE } from "@/lib/constants";

const P = RESTAURANTS_PAGE.promo;

/**
 * The October 2026 Front Door offer. Full width — directly under the hero on
 * /pricing, and above the plans section on the homepage.
 *
 * Renders nothing outside the offer window, so both callers can mount it
 * unconditionally and neither can be left showing a lapsed offer. The window
 * itself, the Front Door tier badge, the detail paragraph and the FAQ entry
 * all read the same date gate and come down together on 1 November.
 */
export function OctoberPromoBanner() {
  if (!isRestaurantPromoLive()) return null;

  return (
    <section className="band blueprint">
      <div className="container-g on-dark-focus grid items-center gap-8 py-12 lg:grid-cols-12 lg:py-14">
        <Reveal className="lg:col-span-7">
          <p className="eyebrow !text-[#7fc8ad]">{P.label}</p>
          <h2 className="font-display mt-3 text-[clamp(1.5rem,2.6vw,2.1rem)]">{P.h}</h2>
          <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-band-mut">
            {P.body.map((seg, i) =>
              seg.em ? (
                <strong key={i} className="font-semibold text-band-ink">
                  {seg.t}
                </strong>
              ) : (
                <span key={i}>{seg.t}</span>
              )
            )}
          </p>
        </Reveal>

        <Reveal className="lg:col-span-5" delay={100}>
          <ul className="space-y-3 border-l border-band-line pl-5">
            {P.inThePanel.map((item) => (
              <li key={item.h} className="flex gap-2.5">
                <Check size={15} className="mt-1 shrink-0 text-[#7fc8ad]" />
                <p className="text-[0.92rem] leading-relaxed text-band-mut">
                  <strong className="font-semibold text-band-ink">{item.h}</strong> {item.copy}
                </p>
              </li>
            ))}
          </ul>
          <a
            href={SITE.calendly}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-on-dark mt-6 !px-6 !py-3.5"
          >
            {P.cta}
            <ArrowRight size={15} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/** The badge and the line that ride on the Front Door tier card in October. */
export function FrontDoorPromoBadge({ dark = false }: { dark?: boolean }) {
  if (!isRestaurantPromoLive()) return null;
  return (
    <span
      className={`mono-num inline-block rounded-full px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.1em] ${
        dark ? "bg-emerald text-white" : "bg-tint text-emerald-deep"
      }`}
    >
      {P.tierBadge}
    </span>
  );
}

export function FrontDoorPromoLine({ dark = false }: { dark?: boolean }) {
  if (!isRestaurantPromoLive()) return null;
  return (
    <p className={`mt-2 text-[0.82rem] font-medium leading-snug ${dark ? "text-[#7fc8ad]" : "text-emerald-deep"}`}>
      {P.tierLine}
    </p>
  );
}
