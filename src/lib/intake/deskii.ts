// Deskii portal provisioning.
//
// When a client completes the intake we hand the portal side off to Deskii:
// POST /api/gemfield/intake creates the organization, the project carrying the
// GF-ID, and the client's login invite. Without this the handoff is manual —
// staff read the intake, create the org, and copy the GF-ID across by hand
// (Deskii's BLOCKERS.md B4).
//
// Authenticated with the same HMAC-SHA256 scheme as Deskii's progress webhook,
// sharing GEMFIELD_WEBHOOK_SECRET. The signature covers a canonical message
// built from the fields in a fixed order — not the raw JSON — so it does not
// depend on key ordering or the receiving app's body parser. The field order
// here MUST match INTAKE_FIELD_ORDER in Deskii's gemfield.webhook.ts.

import crypto from "node:crypto";

import type { Submission } from "./types";

const FIELD_ORDER = [
  "gfId",
  "businessName",
  "contactName",
  "contactEmail",
  "contactPhone",
  "websiteUrl",
  "tierLabel",
  "at",
] as const;

type IntakePayload = Record<(typeof FIELD_ORDER)[number], string | null>;

function canonical(payload: IntakePayload): string {
  return FIELD_ORDER.map((f) => (payload[f] === null ? "" : String(payload[f]))).join("\n");
}

/** Exported for tests: the exact bytes both sides sign. */
export function buildIntakePayload(sub: Submission): IntakePayload {
  return {
    gfId: sub.gfId,
    businessName: sub.businessName || "",
    contactName: sub.contactName || "",
    contactEmail: sub.contactEmail || "",
    contactPhone: sub.contactPhone || null,
    // Deliberately null: the intake has no field for the client's own website.
    // D-723 ("A website you like") is an inspiration reference — often a
    // competitor's — so mapping it here would write the wrong URL onto the
    // organization. Populate only if a field for their current site is added.
    websiteUrl: null,
    tierLabel: sub.tierLabel || null,
    at: sub.submittedAt || new Date().toISOString(),
  };
}

/**
 * Hand the completed intake to Deskii. Never throws — the intake itself has
 * already succeeded and the client has their confirmation, so a portal failure
 * must not surface as a failed submission. The outcome is returned so the
 * caller can write it to the submission's event log, which is what tells staff
 * a manual fallback is needed.
 */
export async function provisionDeskiiPortal(
  sub: Submission,
): Promise<{ ok: boolean; detail: string }> {
  const base = (process.env.DESKII_API_URL || "").trim().replace(/\/+$/, "");
  const secret = process.env.GEMFIELD_WEBHOOK_SECRET;
  if (!base) return { ok: false, detail: "DESKII_API_URL not set" };
  if (!secret) return { ok: false, detail: "GEMFIELD_WEBHOOK_SECRET not set" };

  const payload = buildIntakePayload(sub);
  const signature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(canonical(payload), "utf8")
    .digest("hex")}`;

  try {
    const res = await fetch(`${base}/api/gemfield/intake`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gemfield-Signature": signature,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, detail: `Deskii ${res.status}: ${text.slice(0, 200)}` };
    return { ok: true, detail: text.slice(0, 200) };
  } catch (e) {
    return {
      ok: false,
      detail: `Deskii request failed: ${e instanceof Error ? e.message.slice(0, 200) : "unknown"}`,
    };
  }
}
