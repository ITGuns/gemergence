// Staff auth for the sales panel + service-token auth for the export API.
// Keys live in env only. In development a fallback panel key keeps the flow
// testable; in production an unset key disables the surface entirely.

import crypto from "crypto";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function panelKey(): string | null {
  const key = process.env.INTAKE_PANEL_KEY;
  if (key) return key;
  return process.env.NODE_ENV === "development" ? "dev-panel" : null;
}

/** Panel requests carry `x-panel-key` plus `x-rep-id` for the audit trail. */
export function panelAuth(req: Request): { ok: boolean; repId: string } {
  const key = panelKey();
  const given = req.headers.get("x-panel-key") ?? "";
  const repId = (req.headers.get("x-rep-id") ?? "").slice(0, 64) || "unknown-rep";
  return { ok: key !== null && given !== "" && safeEqual(given, key), repId };
}

/** Export automation: `Authorization: Bearer <INTAKE_SERVICE_TOKEN>` or panel key. */
export function serviceAuth(req: Request): boolean {
  const token = process.env.INTAKE_SERVICE_TOKEN;
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token && bearer && safeEqual(bearer, token)) return true;
  return panelAuth(req).ok;
}
