// Gemfield Web Intake v2 — schema engine.
// Pure functions over gemfield_intake_schema_v2.json. All question text,
// options, conditional rules, derivations, and the follow-up pool come from
// the schema file; components render whatever these functions return.

import rawSchema from "../../../gemfield_intake_schema_v2.json";
import type { Answers, AnswerValue, IntakeField, NicheDef } from "./types";

type RawField = {
  id: string;
  label: string;
  hint?: string;
  type: string;
  options?: string[];
  max?: number;
  required?: boolean;
  optional?: boolean;
  prefill?: string;
  derives?: string[];
};

type RawSchema = {
  version: string;
  timeBudget: { coreSeconds: number; nicheSeconds: number };
  nicheSelector: {
    id: string;
    label: string;
    options: string[];
    homeServicesSelector: { id: string; label: string; options: string[] };
  };
  core: RawField[];
  niche: Record<
    string,
    { label: string; group: string | null; fields: RawField[] }
  >;
  derivations: Record<string, Record<string, Record<string, string>>>;
  followUpPool: string[];
};

const schema = rawSchema as unknown as RawSchema;

export const SCHEMA_VERSION = schema.version;

function normalizeField(f: RawField): IntakeField {
  return {
    id: f.id,
    label: f.label,
    hint: f.hint ?? "",
    type: f.type as IntakeField["type"],
    options: f.options,
    max: f.max,
    required: f.required === true,
    optional: f.optional === true,
    prefill: f.prefill,
    derives: f.derives,
  };
}

export function coreFields(): IntakeField[] {
  return schema.core.map(normalizeField);
}

export const NICHE_SELECTOR = {
  id: schema.nicheSelector.id, // N-001
  label: schema.nicheSelector.label,
  options: schema.nicheSelector.options,
};

export const TRADE_SELECTOR = {
  id: schema.nicheSelector.homeServicesSelector.id, // N-002
  label: schema.nicheSelector.homeServicesSelector.label,
  options: schema.nicheSelector.homeServicesSelector.options,
};

export function niches(): NicheDef[] {
  return Object.entries(schema.niche).map(([key, n]) => ({
    key,
    label: n.label,
    group: (n.group as NicheDef["group"]) ?? null,
    fields: n.fields.map(normalizeField),
  }));
}

/** N-001 top-level option → niche key (or "home_services" / "other" markers). */
export function resolveNicheSelection(
  n001: string | undefined,
  n002: string | undefined,
): { nicheKey: string | null; needsTrade: boolean } {
  if (!n001) return { nicheKey: null, needsTrade: false };
  if (n001 === "Home Services") {
    if (!n002) return { nicheKey: null, needsTrade: true };
    const byLabel = niches().find(
      (n) => n.group === "home_services" && n.label === n002,
    );
    return { nicheKey: byLabel?.key ?? "other_home_service", needsTrade: true };
  }
  const direct = niches().find((n) => n.group === null && n.label === n001);
  // "Other / General" has no sub-form by design — core answers carry the build.
  return { nicheKey: direct?.key ?? null, needsTrade: false };
}

export function nicheFields(nicheKey: string | null): IntakeField[] {
  if (!nicheKey) return [];
  const n = schema.niche[nicheKey];
  return n ? n.fields.map(normalizeField) : [];
}

export function nicheLabel(nicheKey: string | null): string {
  if (!nicheKey) return "Other / General";
  return schema.niche[nicheKey]?.label ?? nicheKey;
}

/**
 * The exact field set visible for a given state — the conditional-logic core.
 * D-704 renders only when D-721 = "I'll name them below".
 */
export function visibleCoreFields(answers: Answers): IntakeField[] {
  return coreFields().filter((f) => {
    if (f.id === "D-704") return answers["D-721"] === "I'll name them below";
    return true;
  });
}

export function isAnswered(value: AnswerValue | undefined): boolean {
  if (value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.trim() !== "";
}

/** Missing required fields for the given visible set. */
export function missingRequired(fields: IntakeField[], answers: Answers): string[] {
  return fields
    .filter((f) => f.required && !isAnswered(answers[f.id]))
    .map((f) => f.id);
}

/**
 * Full-submission validation (server side). Returns field IDs in error.
 * Niche fields are validated only for the resolved niche; answers belonging
 * to other niches are rejected so a plumber can never submit S-221.
 */
export function validateSubmission(
  answers: Answers,
  nicheKey: string | null,
): { missing: string[]; foreign: string[] } {
  const visible = [
    ...visibleCoreFields(answers),
    ...nicheFields(nicheKey),
  ];
  const missing = missingRequired(visible, answers);

  const allowed = new Set([
    ...visible.map((f) => f.id),
    ...coreFields().map((f) => f.id), // hidden-but-core (e.g. skipped D-704) is harmless
    NICHE_SELECTOR.id,
    TRADE_SELECTOR.id,
  ]);
  const foreign = Object.keys(answers).filter((id) => !allowed.has(id));
  return { missing, foreign };
}

/**
 * Derivation contract (§5): compact answers (D-720 style card, D-722 assets)
 * expand into the legacy design fields the Build Process references —
 * labeled DERIVED downstream, refinable defaults, never client gospel.
 */
export function deriveFields(answers: Answers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [sourceId, table] of Object.entries(schema.derivations)) {
    const answer = answers[sourceId];
    if (typeof answer !== "string") continue;
    const mapped = table[answer];
    if (mapped) Object.assign(out, mapped);
  }
  return out;
}

/**
 * Follow-up pool (§6), tier-filtered: "(Tier N+)" entries drop below tier N;
 * niche-prefixed entries (H-*, P-*) apply only to that niche; the H-203
 * follow-up applies only when the client answered Yes.
 */
export function followUpPool(
  tier: number | null,
  nicheKey: string | null,
  answers: Answers,
): string[] {
  return schema.followUpPool.filter((entry) => {
    const tierGate = entry.match(/Tier (\d)\+/);
    if (tierGate && (tier === null || tier < Number(tierGate[1]))) return false;
    if (/^P-/.test(entry) && nicheKey !== "personal_injury") return false;
    if (/^H-/.test(entry)) {
      if (nicheKey !== "hvac") return false;
      if (entry.includes("when H-203=Yes") && answers["H-203"] !== "Yes")
        return false;
    }
    return true;
  });
}

/** Every field defined anywhere in the schema, for label lookups in exports. */
export function fieldById(id: string): IntakeField | undefined {
  const all = [
    ...coreFields(),
    ...niches().flatMap((n) => n.fields),
  ];
  return all.find((f) => f.id === id);
}
