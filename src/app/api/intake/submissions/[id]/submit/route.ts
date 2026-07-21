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
  finalizeSubmission,
  getSubmission,
  saveAnswers,
  tokenMatches,
} from "@/lib/intake/store";
import { notifyOps, sendClientConfirmation } from "@/lib/intake/notify";
import type { Answers } from "@/lib/intake/types";

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
  if (missing.length || foreign.length) {
    return NextResponse.json(
      { error: "Validation failed", missing, foreign },
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

  // Notifications never block the client's confirmation screen.
  await Promise.allSettled([notifyOps(done), sendClientConfirmation(done)]);

  return NextResponse.json({ ok: true, gfId: done.gfId });
}
