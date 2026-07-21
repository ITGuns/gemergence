export const SITE = {
  name: "Gemfield Consulting",
  url: "https://gemfieldconsulting.com",
  email: "hello@gemfieldconsulting.com",
  calendly: "https://calendly.com/gemfieldconsulting/discovery-call",
  // Launch plumbing (SITE-PLAN §11 item 4): FormSubmit until API route + proper sender lands.
  formEndpoint: "https://formsubmit.co/ajax/hello@gemfieldconsulting.com",
  // Open item §11-2: business phone. Call paths render only when set (e.g. "+14155550100").
  phone: null as string | null,
  phoneDisplay: null as string | null,
  location: "San Francisco, CA",
  served: "United States",
  // Day-one pixels (SITE-PLAN §2): set IDs to activate. Nothing renders while null.
  gaId: null as string | null,
  metaPixelId: null as string | null,
  // Open item §11-7: social profile URLs (footer + schema sameAs).
  social: [] as { label: string; href: string }[],
};

// Square hosted subscription checkout links. Each is a reusable Square-hosted
// URL that subscribes + charges the buyer (Square keeps the card on file and
// bills monthly) — no card data touches this site. Create each in the Square
// Dashboard (Payment Links → recurring/subscription) or via CreatePaymentLink,
// then paste the https://square.link/… URL for the matching plan name here.
// While a value is null, that tier keeps the audit/quote flow — no broken link
// ever goes live. Only fixed-price recurring tiers belong here; the custom
// "From $…" tiers stay quote-only.
// When creating each link, set its Square confirmation/redirect URL to
// `${SITE.url}/intake?plan=<slug>` (e.g. /intake?plan=growth) so buyers land
// in the 2-minute intake with their tier attached (see src/lib/intake/).
export const CHECKOUT: Record<string, string | null> = {
  Foundation: null,
  Growth: null,
};

export const INTAKE_KEY = "gemfield:last-intake";
export const DRAFT_KEY = "gemfield:audit-draft";

export type Intake = {
  name: string;
  biz: string;
  email: string;
  url: string;
  phone: string;
  industry: string;
  goals: string[];
  notes: string;
};
