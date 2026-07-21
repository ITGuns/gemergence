// Client-token routes for one submission (magic-link resume + autosave).
// GET   ?t=<resumeToken> → sanitized view (no rep notes, no event log)
// PATCH ?t=<resumeToken> { answers } → upsert answers only. Tier/status/
//        identity are unreachable from here by construction (Rule 2).

import { NextRequest, NextResponse } from "next/server";
import {
  getSubmission,
  markOpened,
  saveAnswers,
  toClientView,
  tokenMatches,
} from "@/lib/intake/store";
import type { Answers } from "@/lib/intake/types";

async function authed(req: NextRequest, id: string) {
  const sub = await getSubmission(id);
  const token = req.nextUrl.searchParams.get("t");
  if (!sub || !tokenMatches(sub, token)) return null;
  return sub;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sub = await authed(req, id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await markOpened(id);
  return NextResponse.json({ submission: toClientView(sub) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sub = await authed(req, id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sub.status === "submitted") {
    return NextResponse.json({ error: "Submission is final" }, { status: 409 });
  }

  let body: { answers?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.answers !== "object" || body.answers === null) {
    return NextResponse.json({ error: "answers object required" }, { status: 400 });
  }

  // Only schema-shaped answer values pass; anything else is dropped.
  const clean: Answers = {};
  for (const [k, v] of Object.entries(body.answers as Record<string, unknown>)) {
    if (!/^[A-Z]-\d{3}$/.test(k)) continue;
    if (typeof v === "string") clean[k] = v.slice(0, 2000);
    else if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      clean[k] = (v as string[]).map((x) => x.slice(0, 200)).slice(0, 12);
    }
  }
  const updated = await saveAnswers(id, clean);
  return NextResponse.json({ ok: true, status: updated?.status });
}
