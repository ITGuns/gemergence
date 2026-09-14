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
- Founder block placeholders: `WHY.founder` in content.ts + the portrait blocks in `home/closing-sections.tsx` and `about/page.tsx`.

## Before launch (gates)

1. **Ownership model** — confirmed 2026-09-15: free-build websites vest to the client after six months on any plan, with a buyout available before that. Pledge copy and /terms match. Still open: the signed services agreement must say the same, and counsel review of /privacy and /terms.
2. Founder name/photo/bio → replace placeholders.
3. Clean Deskii screenshots with seeded demo data → replace `deskii-frame.tsx` mocks.
4. Confirm domain DNS, Calendly URL, and FormSubmit endpoint activation; set up SPF/DKIM/DMARC before nurture emails.
5. Set `gaId` / `metaPixelId` in constants.ts; verify audit form → email → Calendly end-to-end on a real phone.
6. Marketing (Growth Fuel) management fees → publish numbers when confirmed.
