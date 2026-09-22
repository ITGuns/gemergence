# Gemfield Consulting — Website

The production site for gemfieldconsulting.com. Next.js (App Router, fully static) + TypeScript + Tailwind v4.

## Develop

```bash
npm run dev     # http://localhost:3000
npm run build   # production build (all routes static)
npm run lint
```

## Where things live

- `src/lib/content.ts` — **all site copy.** Edit copy here, not in components.
- `src/lib/constants.ts` — email, Calendly URL, form endpoint, phone (null = hidden), analytics IDs (null = disabled), social links.
- `src/app/globals.css` — the Ink & Emerald design tokens and component classes.
- `src/components/deskii-frame.tsx` — placeholder Deskii previews. **Swap for real seeded screenshots when captured.**
- `src/app/restaurants/page.tsx` — the restaurant niche page. Copy in `RESTAURANTS_PAGE`; the October offer is gated on `RESTAURANT_PROMO` + `isRestaurantPromoLive()` in content.ts, and the page carries `revalidate = 3600` so the offer lifts on 1 November without a deploy.
- Founder block placeholders: `WHY.founder` in content.ts + the portrait blocks in `home/closing-sections.tsx` and `about/page.tsx`.

## Before launch (gates)

1. **Ownership model** — confirmed 2026-09-15: free-build websites vest to the client after six months on any plan, with a buyout available before that. Pledge copy and /terms match. Still open: the signed services agreement must say the same, and counsel review of /privacy and /terms.
2. Founder name/photo/bio → replace placeholders.
3. Clean Deskii screenshots with seeded demo data → replace `deskii-frame.tsx` mocks.
4. Confirm domain DNS, Calendly URL, and FormSubmit endpoint activation; set up SPF/DKIM/DMARC before nurture emails.
5. Set `gaId` / `metaPixelId` in constants.ts; verify audit form → email → Calendly end-to-end on a real phone.
6. Marketing (Growth Fuel) management fees → publish numbers when confirmed.
7. **/restaurants open items** — "See a site we built" in the closing CTA points at `/` until a restaurant case study exists; the page has no restaurant exhibit imagery yet.

## After 31 October 2026

The October offer on `/restaurants` is date-gated, so it stops rendering on its
own. Delete the dead code once it has lapsed: `RESTAURANT_PROMO`,
`isRestaurantPromoLive`, `RESTAURANTS_PAGE.promo`, `.faq.promoItem`,
`.detail[0].promoPara`, `.closing.body` (keep `bodyAfterPromo`),
`.table.recommendedDuringPromo` / `.promoBadge`, and the `revalidate` export.
Do not extend the window instead — the inclusion is written into each October
signer's agreement, so their plan is unaffected when the offer ends.
