// Gemfield Web Intake v2 — Markdown export (§5 of the integration spec).
// Canonical build-team artifact: all answered fields in schema order, then a
// DERIVED section (refinable defaults expanded from the style/asset shortcuts,
// never client gospel) and a FOLLOW-UP POOL section (depth fields deliberately
// not asked, tier-filtered). Consumed by GEMFIELD_BUILD_PROCESS.md Phase 0.

import type { Submission } from "./types";
import {
  coreFields,
  deriveFields,
  fieldById,
  followUpPool,
  nicheFields,
  nicheLabel,
  NICHE_SELECTOR,
  TRADE_SELECTOR,
} from "./schema";

function fmt(value: string | string[] | undefined): string {
  if (value === undefined) return "_(not answered)_";
  if (Array.isArray(value)) return value.length ? value.join(" · ") : "_(not answered)_";
  return value.trim() === "" ? "_(not answered)_" : value;
}

export function buildMarkdownExport(sub: Submission): string {
  const lines: string[] = [];
  const nicheDisplay = sub.niche
    ? sub.niche === "personal_injury" || sub.niche === "hvac"
      ? nicheLabel(sub.niche)
      : `home_services / ${sub.niche}`
    : "other_general";

  lines.push(`# Gemfield Intake Export — ${sub.gfId}`);
  lines.push(
    `- business: ${sub.businessName || fmt(sub.answers["D-101"])} · tier: ${
      sub.tier ?? "unverified"
    } (locked, source: ${sub.source}${sub.salesRepId ? `, rep: ${sub.salesRepId}` : ""})`,
  );
  lines.push(
    `- niche: ${nicheDisplay} · submitted: ${sub.submittedAt ?? "not submitted"} · schema: ${sub.schemaVersion}`,
  );
  lines.push(
    `- contact: ${sub.contactName} · ${sub.contactEmail}${sub.contactPhone ? ` · ${sub.contactPhone}` : ""}`,
  );
  if (sub.repNotes) lines.push(`- rep_notes: ${sub.repNotes}`);
  lines.push("");

  // Niche selection answers, if the client walked the selector.
  const n001 = sub.answers[NICHE_SELECTOR.id];
  const n002 = sub.answers[TRADE_SELECTOR.id];
  if (n001) {
    lines.push(`## [${NICHE_SELECTOR.id}] ${NICHE_SELECTOR.label}`);
    lines.push(fmt(n001));
    lines.push("");
  }
  if (n002) {
    lines.push(`## [${TRADE_SELECTOR.id}] ${TRADE_SELECTOR.label}`);
    lines.push(fmt(n002));
    lines.push("");
  }

  // All core fields in schema order (answered or explicitly not).
  for (const f of coreFields()) {
    lines.push(`## [${f.id}] ${f.label}`);
    lines.push(fmt(sub.answers[f.id]));
    lines.push("");
  }

  // Niche sub-form fields in schema order.
  const nf = nicheFields(sub.niche);
  if (nf.length) {
    lines.push(`## Niche: ${nicheLabel(sub.niche)}`);
    lines.push("");
    for (const f of nf) {
      lines.push(`### [${f.id}] ${f.label}`);
      lines.push(fmt(sub.answers[f.id]));
      lines.push("");
    }
  }

  // DERIVED — expanded from D-720/D-722 via the schema derivation table.
  const derived = deriveFields(sub.answers);
  const derivedEntries = Object.entries(derived);
  lines.push("## DERIVED (from D-720 / D-722 via schema derivation table)");
  if (derivedEntries.length) {
    for (const [id, value] of derivedEntries) {
      lines.push(`- [${id}] ${value}`);
    }
  } else {
    lines.push("- _(no derivations — source answers missing)_");
  }
  lines.push("");

  // FOLLOW-UP POOL — unasked by design, tier-filtered.
  lines.push(
    "## FOLLOW-UP POOL (unasked by design — source from research or targeted follow-up)",
  );
  for (const entry of followUpPool(sub.tier, sub.niche, sub.answers)) {
    lines.push(`- ${entry}`);
  }
  lines.push("");

  return lines.join("\n");
}

/** Plain-text summary for the client confirmation + ops notification. */
export function buildAnswerSummary(sub: Submission): string {
  const lines: string[] = [];
  const push = (id: string) => {
    const f = fieldById(id);
    const v = sub.answers[id];
    if (!f || v === undefined) return;
    lines.push(`${f.label}\n  ${Array.isArray(v) ? v.join(", ") : v}`);
  };
  for (const f of coreFields()) push(f.id);
  const n001 = sub.answers[NICHE_SELECTOR.id];
  if (typeof n001 === "string") lines.push(`${NICHE_SELECTOR.label}\n  ${n001}`);
  const n002 = sub.answers[TRADE_SELECTOR.id];
  if (typeof n002 === "string") lines.push(`${TRADE_SELECTOR.label}\n  ${n002}`);
  for (const f of nicheFields(sub.niche)) push(f.id);
  return lines.join("\n\n");
}
