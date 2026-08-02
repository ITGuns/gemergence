// POST /api/intake/submissions/:id/submit?t=<resumeToken>
// Server-side validation against the schema (required fields for the resolved
// niche; foreign niche answers rejected), then finalize: status → submitted,
// timestamps, ops notification, client confirmation copy.

import { NextRequest, NextResponse } from "next/server";
import {
  NICHE_SELECTOR,
  TRADE_SELECTOR,
  resolveNicheSelection,
  validateSubmission,
} from "@/lib/intake/schema";
import {
  dropAnswers,
  finalizeSubmission,
  getSubmission,
  logEvent,
  saveAnswers,
  tokenMatches,
} from "@/lib/intake/store";
import { notifyOps, sendClientConfirmation } from "@/lib/intake/notify";
import { provisionDeskiiPortal } from "@/lib/intake/deskii";
import type { Answers } from "@/lib/intake/types";

// This route does real work after validation: an ops notification, a portal
// handoff, and an SMTP send. The platform default (10s on some plans) is not
// enough headroom for all three, and being killed mid-flight surfaces to the
// client as a failed intake even though the submission is already stored.
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sub = await getSubmission(id);
  const token = req.nextUrl.searchParams.get("t");
  if (!sub || !tokenMatches(sub, token)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (sub.status === "submitted") {
    return NextResponse.json({ error: "Already submitted", gfId: sub.gfId }, { status: 409 });
  }

  // Accept a final answers payload so submit works even if autosave lagged.
  try {
    const body = (await req.json()) as { answers?: Answers };
    if (body?.answers && typeof body.answers === "object") {
      const clean: Answers = {};
      for (const [k, v] of Object.entries(body.answers)) {
        if (!/^[A-Z]-\d{3}$/.test(k)) continue;
        if (typeof v === "string") clean[k] = v.slice(0, 2000);
        else if (Array.isArray(v)) clean[k] = v.map((x) => String(x).slice(0, 200));
      }
      await saveAnswers(id, clean);
    }
  } catch {
    /* no body — validate what autosave stored */
  }

  const fresh = (await getSubmission(id))!;
  const answers = fresh.answers;

  // Niche resolution order: rep preselect wins, else the client's N-001/N-002.
  const pre = fresh.nichePreselect;
  const { nicheKey } = pre?.niche
    ? { nicheKey: pre.niche }
    : resolveNicheSelection(
        answers[NICHE_SELECTOR.id] as string | undefined,
        answers[TRADE_SELECTOR.id] as string | undefined,
      );

  const n001 = answers[NICHE_SELECTOR.id];
  if (!pre?.niche && !n001) {
    return NextResponse.json(
      { error: "Validation failed", missing: [NICHE_SELECTOR.id], foreign: [] },
      { status: 422 },
    );
  }

  const { missing, foreign } = validateSubmission(answers, nicheKey);

  // Foreign answers are stale, not hostile: they are what a client leaves behind
  // when they pick an industry, answer its questions, then change their mind.
  // Rejecting the submission for them was unrecoverable - the answers are
  // already stored, so every retry failed identically, and the wizard has no
  // message for this case so it showed only "That didn't go through". Drop them
  // and continue; the id shape is already filtered on write, and the export must
  // never carry another niche's answers either way.
  if (foreign.length) {
    for (const key of foreign) delete answers[key];
    await dropAnswers(fresh.id, foreign).catch(() => {});
    await logEvent(
      fresh.id,
      "stale_answers_dropped",
      "system",
      `changed industry: ${foreign.join(", ")}`,
    ).catch(() => {});
  }

  if (missing.length) {
    return NextResponse.json(
      { error: "Validation failed", missing, foreign: [] },
      { status: 422 },
    );
  }

  const trade =
    (typeof answers[TRADE_SELECTOR.id] === "string"
      ? (answers[TRADE_SELECTOR.id] as string)
      : undefined) ??
    pre?.trade ??
    null;
  const done = await finalizeSubmission(id, nicheKey, trade);
  if (!done) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Portal first, confirmation second — deliberately sequential. Deskii returns
  // the client's setup link rather than mailing it (a Deskii-branded credentials
  // email to someone who only knows Gemfield reads as phishing), so the link has
  // to be in hand before the confirmation is composed. Ops notification runs
  // alongside since it needs nothing from Deskii.
  //
  // Provisioning is recorded either way — a failure is the signal that the manual
  // fallback (create the org, enter the GF-ID, invite the client) is still needed,
  // and it must never turn a successful intake into a failed one for the client.
  // If it fails, the confirmation still goes out; it just carries no portal block.
  // Handler attached at creation: it is awaited only after provisioning returns,
  // and an unhandled rejection in that window would be reported as a crash.
  const opsNotified = notifyOps(done).catch(() => {});
  const portal = await provisionDeskiiPortal(done);
  await logEvent(
    done.id,
    portal.ok ? "portal_provisioned" : "portal_provision_failed",
    "system",
    portal.detail,
  ).catch(() => {});

  await Promise.allSettled([opsNotified, sendClientConfirmation(done, portal.portal)]);

  return NextResponse.json({ ok: true, gfId: done.gfId });
}
