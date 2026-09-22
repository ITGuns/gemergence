# Gemfield Consulting — Website

The production site for gemfieldconsulting.com. Next.js (App Router) + TypeScript + Tailwind v4.

**Gemfield serves restaurants, bars and taphouses only.** The site was swapped
from general service businesses to the restaurant niche on 2026-09-22. If you
are adding copy, it should read as if no other industry exists — because for
this business, none does.

## Develop

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

## Where things live

- `src/lib/content.ts` — **all site copy.** Edit copy here, not in components.
  The plan ladder, the tier table and the October offer are in the PLANS
  section at the bottom of the file and drive `/pricing`.
- `src/lib/constants.ts` — email, Calendly URL, phone (null = hidden),
  analytics IDs (null = disabled), social links.
- `src/app/globals.css` — the Ink & Emerald design tokens and component classes.
- `src/components/book-call.tsx` — the single site-wide CTA. Every primary
  button points at `SITE.calendly` through it.
- `src/components/deskii-frame.tsx` — hand-drawn UI mocks: the Deskii control
  panel and `RestaurantSiteFrame`, the sample restaurant site in the homepage
  hero. **Swap for real seeded screenshots when captured.**
- `src/components/immersive/scene.tsx` — the WebGL journey. Every screen in it
  is drawn to a canvas (`ScreenPanel` + a `draw` function), not photographed;
  `drawGemfieldSitePart` is the sample taphouse site, `drawBrochureSite` the
  generic template it is contrasted against. There are no image files in
  `/public` any more, so copy changes never leave a stale screenshot behind.
- `gemfield_intake_schema_v2.json` — the post-purchase intake question bank,
  one entry per restaurant segment. The taxonomy is flat: `subSelectorParent`
  is null, so the N-002 sub-selector never renders.

## Routes

`/` `/pricing` `/deskii` `/how-it-works` `/about` `/privacy` `/terms`, plus
`/intake` and `/panel` (post-purchase, noindex) and `/schedule`.
`/classic` and `/immersive` are alternate homepage designs reachable from the
version switcher. `/restaurants`, `/audit` and `/marketing` 301 to `/pricing`
(see `next.config.ts`).

## Before launch (gates)

1. **Ownership model** — confirmed 2026-09-15: free-build websites vest to the
   client after six paid months on any plan, with a buyout available before
   that. Pledge copy and /terms match. Still open: the signed services
   agreement must say the same, and counsel review of /privacy and /terms —
   including the new "Online ordering, payments, and your POS" clause that
   replaced the Growth Fuel one.
2. Founder name/photo/bio → replace placeholders (`WHY.founder` + the portrait
   blocks in `home/closing-sections.tsx` and `about/page.tsx`).
3. Real screenshots of a shipped restaurant build and the Deskii panel →
   replace the drawn mocks in `deskii-frame.tsx`.
4. Confirm domain DNS and the Calendly URL — **every CTA on the site now points
   at it**, so a dead link is a dead funnel. Set up SPF/DKIM/DMARC before
   nurture emails.
5. Set `gaId` / `metaPixelId` in constants.ts.
6. `/` closing CTA links "See a site we built" at `/` until a real restaurant
   case study exists.

## The Front Door offer (live now → 31 October 2026)

Sign Front Door by 31 October 2026 and the integrated menu and booking control
panel — menu control plus advanced booking — is included at no extra cost, for
as long as the client stays on the plan. Normally a Foundation ($497) feature.

Say **"included at no extra cost"**, never "free". The client still pays $197 a
month, and "free" invites the question of what they are paying for.

**The window opened early**, on 21 September rather than 1 October, so all the
copy is deadline-led ("by 31 October", "Ends 31 October", "Until 31 October
2026") rather than month-led. Nothing on the site tells a September prospect to
wait for October — if you edit this copy, keep it that way.

**Dates are evaluated in `America/Los_Angeles`, not the server's or the
operator's timezone.** That is what keeps the offer alive until midnight PT on
the 31st instead of killing it at 5pm mid-service. It also means the site's
"today" runs behind a European or Asian desk by up to a day — set `firstDay`
against the Pacific date, not your own.

Everything on the site reads one date gate (`RESTAURANT_PROMO` +
`isRestaurantPromoLive()`), so it all appears and disappears together:

| Where | What |
|---|---|
| `/` above the plans, `/pricing` under the hero | `<OctoberPromoBanner />` |
| Front Door tier card, all four layouts | `<FrontDoorPromoBadge />` + `<FrontDoorPromoLine />` |
| `/pricing` Front Door detail section | `detail[0].promoPara` |
| `/pricing` FAQ | `faq.promoItem`, which **swaps back to** `faq.standardBookingItem` |

`/pricing` carries `revalidate = 3600`, so the offer lifts on 1 November without
a deploy. The banner components return null outside the window, so a page that
mounts one can never be left showing a lapsed offer.

### Not on the website

Two pieces of this offer live outside the codebase and are recorded here so
they do not get lost:

**Exhibit A of every Front Door agreement signed in October** must include:

> Included under the October 2026 promotion: the integrated menu and booking
> control panel, comprising menu control and advanced booking, at no additional
> charge for as long as the Company remains on the Front Door plan.

That wording — not the website — is what guarantees an October signer keeps the
panel. **Closer line** for calls and follow-up emails:

> "Sign by the 31st and the menu and booking panel comes with it. That is
> normally a $497 plan feature. After the 31st it is not included at this
> price."

## After 31 October 2026

The offer is date-gated, so it stops rendering on its own — and the FAQ swaps
itself back to the standard Front Door booking answer. Delete the dead code
once it has lapsed: `RESTAURANT_PROMO`, `isRestaurantPromoLive`,
`src/components/october-promo.tsx` and its call sites,
`RESTAURANTS_PAGE.promo`, `.faq.promoItem`, `.detail[0].promoPara`,
`.table.recommendedDuringPromo`, `.closing.body` (keep `bodyAfterPromo`), and
the `revalidate` export. Keep `faq.standardBookingItem`.

Do not extend the window instead. An offer that quietly runs into November
teaches every future prospect to wait for the next one — and October signers
keep the panel through their agreement regardless.
