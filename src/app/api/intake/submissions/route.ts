// POST /api/intake/submissions — create a submission.
//   Path A (self_signup): called by the wizard after checkout/plan selection.
//     Tier comes from the plan slug in the checkout redirect. Rate-limited +
//     honeypot-protected; returns the id + resume token for autosave.
//   Path B (sales_panel): called from /panel with the x-panel-key header.
//     Rep supplies contact, tier sold, optional niche preselect + notes.
// GET /api/intake/submissions — panel-only list view.

import { NextRequest, NextResponse } from "next/server";
import { panelAuth } from "@/lib/intake/auth";
import { createSubmission, listSubmissions, toClientView } from "@/lib/intake/store";
import { PLAN_TIERS } from "@/lib/intake/types";

// Minimal in-memory rate limit for the public create route (per instance).
const hits = new Map<string, { count: number; windowStart: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.windowStart > 60_000) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  h.count += 1;
  return h.count > 10;
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

  const panel = panelAuth(req);
  const fromPanel = req.headers.get("x-panel-key") !== null;
  if (fromPanel && !panel.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessName = str(body.businessName);
  const contactName = str(body.contactName, 120);
  const contactEmail = str(body.contactEmail, 200);
  const contactPhone = str(body.contactPhone, 40);
  if (!contactName || !/.+@.+\..+/.test(contactEmail)) {
    return NextResponse.json(
      { error: "Contact name and a valid email are required" },
      { status: 400 },
    );
  }

  // Tier is resolved server-side from the plan slug — never a free number
  // from the client (Rule 2). Panel reps may also sell Tier 5 (custom).
  const planSlug = str(body.plan, 40).toLowerCase();
  const plan = PLAN_TIERS[planSlug];
  const tier = plan ? plan.tier : null;

  if (fromPanel) {
    const nichePreselect =
      typeof body.nichePreselect === "object" && body.nichePreselect !== null
        ? {
            niche: str((body.nichePreselect as Record<string, unknown>).niche, 60),
            trade:
              str((body.nichePreselect as Record<string, unknown>).trade, 60) || undefined,
          }
        : undefined;
    const sub = await createSubmission({
      businessName,
      contactName,
      contactEmail,
      contactPhone,
      tier,
      source: "sales_panel",
      salesRepId: panel.repId,
      repNotes: str(body.repNotes, 2000) || undefined,
      nichePreselect: nichePreselect?.niche ? nichePreselect : undefined,
    });
    return NextResponse.json({
      id: sub.id,
      gfId: sub.gfId,
      resumeToken: sub.resumeToken,
      resumePath: `/intake?s=${sub.id}&t=${sub.resumeToken}`,
    });
  }

  // Public path — honeypot + rate limit, spam absorbed silently (spec §8).
  if (str(body.website_url) !== "") {
    return NextResponse.json({ id: "ok", gfId: "GF-0000-0000", resumeToken: "ok" });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const sub = await createSubmission({
    businessName,
    contactName,
    contactEmail,
    contactPhone,
    tier,
    source: "self_signup",
  });
  return NextResponse.json({
    id: sub.id,
    gfId: sub.gfId,
    resumeToken: sub.resumeToken,
    resumePath: `/intake?s=${sub.id}&t=${sub.resumeToken}`,
  });
}

export async function GET(req: NextRequest) {
  const panel = panelAuth(req);
  if (!panel.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subs = await listSubmissions();
  return NextResponse.json({
    submissions: subs.map((s) => ({
      ...toClientView(s),
      source: s.source,
      salesRepId: s.salesRepId,
      repNotes: s.repNotes,
      niche: s.niche,
      trade: s.trade,
      createdAt: s.createdAt,
      submittedAt: s.submittedAt,
      resumePath: `/intake?s=${s.id}&t=${s.resumeToken}`,
      events: s.events,
    })),
  });
}
