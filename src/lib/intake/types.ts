// Gemfield Web Intake v2 — shared types.
// The schema file (gemfield_intake_schema_v2.json, repo root) is the single
// source of truth for questions and conditional rules (Rule 1 of the
// integration spec). Nothing here duplicates question text.

export type FieldType = "text" | "choice" | "multichoice";

export type IntakeField = {
  id: string;
  label: string;
  hint: string;
  type: FieldType;
  options?: string[];
  /** Multichoice selection cap (e.g. D-703 "up to 3 words"). */
  max?: number;
  required?: boolean;
  optional?: boolean;
  /** Metadata key this field prefills from (e.g. business_name). */
  prefill?: string;
  /** Field IDs derived from this answer via the schema derivation table. */
  derives?: string[];
};

export type NicheDef = {
  key: string;
  label: string;
  group: "home_services" | null;
  fields: IntakeField[];
};

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;

export type SubmissionSource = "self_signup" | "sales_panel";

export type SubmissionStatus =
  | "created"
  | "sent"
  | "opened"
  | "in_progress"
  | "submitted"
  | "expired";

export type SubmissionEvent = {
  type: string;
  at: string; // ISO timestamp
  actor: string; // "client" | "system" | rep id
  note?: string;
};

export type Submission = {
  id: string; // internal UUID
  gfId: string; // GF-{YYYY}-{seq}
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  /**
   * Tier is metadata, never a question (Rule 2). Set from the purchase path
   * (checkout redirect / sales panel) at creation, immutable from any
   * client-token route by construction. null = purchase pending verification.
   */
  tier: number | null;
  tierLabel: string;
  source: SubmissionSource;
  salesRepId?: string;
  /** Internal rep notes — exported to the build team, never shown to the client. */
  repNotes?: string;
  /** Rep already knows the niche → the form skips N-001/N-002. */
  nichePreselect?: { niche: string; trade?: string };
  /** Resolved at submit from N-001/N-002 answers (or the preselect). */
  niche: string | null;
  trade: string | null;
  status: SubmissionStatus;
  resumeToken: string;
  answers: Answers;
  events: SubmissionEvent[];
  schemaVersion: string;
  createdAt: string;
  submittedAt: string | null;
};

/** What a client-token route is allowed to see (no rep notes, no event log). */
export type ClientSubmissionView = {
  id: string;
  gfId: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  tier: number | null;
  tierLabel: string;
  status: SubmissionStatus;
  nichePreselect?: { niche: string; trade?: string };
  answers: Answers;
};

/** Site plan name → SOP tier number. Tier 5 (custom) is panel-only. */
export const PLAN_TIERS: Record<string, { tier: number; label: string }> = {
  foundation: { tier: 1, label: "Foundation" },
  growth: { tier: 2, label: "Growth" },
  scale: { tier: 3, label: "Scale" },
  strategic: { tier: 4, label: "Strategic" },
  custom: { tier: 5, label: "Custom" },
};

export function tierLabelFor(tier: number | null): string {
  if (tier === null) return "Pending confirmation";
  const hit = Object.values(PLAN_TIERS).find((p) => p.tier === tier);
  return hit ? `Tier ${tier} — ${hit.label}` : `Tier ${tier}`;
}
