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
