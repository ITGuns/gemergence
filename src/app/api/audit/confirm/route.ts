// POST /api/audit/confirm — send the prospect their audit-request confirmation.
//
// The audit form posts to FormSubmit, which notifies the team only; the
// prospect previously received nothing. This route sends them the branded
// confirmation via the same Gmail SMTP path the intake flow uses.
//
// It accepts an address from the caller and emails it, so it carries the same
// defences as the public intake create route: honeypot field and a per-IP rate
// limit. The message body is fixed — only the name and business appear, and
// both are escaped by the template.

import { NextRequest, NextResponse } from "next/server";

import { sendAuditConfirmation } from "@/lib/intake/notify";

// Minimal in-memory rate limit (per instance), mirroring the intake create
// route. Tighter than that route's 10/min because each call sends real mail.
const hits = new Map<string, { count: number; windowStart: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.windowStart > 60_000) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  h.count += 1;
  return h.count > 5;
}

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot: absorb silently so a bot cannot tell it was rejected.
  if (str(body.website_url) !== "") {
    return NextResponse.json({ sent: true });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const name = str(body.name, 120);
  const business = str(body.business, 200);
  const email = str(body.email, 200);
  if (!/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const result = await sendAuditConfirmation({ name, business, email });
  // Always 200: the audit itself already reached the team, so a mail failure
  // must not read to the caller as the request having failed.
  return NextResponse.json({ sent: result.sent });
}
