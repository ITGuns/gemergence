// POST /api/intake/submissions/:id/send — panel action: email the magic
// intake link to the client (Resend), signed by the rep. Marks the
// submission `sent` while it's still pre-open, and audit-logs either way.

import { NextRequest, NextResponse } from "next/server";
import { panelAuth } from "@/lib/intake/auth";
import { getSubmission, setStatus } from "@/lib/intake/store";
import { sendIntakeLink } from "@/lib/intake/notify";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const panel = panelAuth(req);
  if (!panel.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sub = await getSubmission(id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sub.status === "submitted") {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  const origin = req.nextUrl.origin;
  const url = `${origin}/intake?s=${sub.id}&t=${sub.resumeToken}`;
  const result = await sendIntakeLink(sub, url, panel.repId);

  if (result.sent && sub.status === "created") {
    await setStatus(sub.id, "sent", panel.repId);
  }
  return NextResponse.json(
    result.sent
      ? { ok: true }
      : { ok: false, error: `Email not sent — ${result.detail}` },
    { status: result.sent ? 200 : 502 },
  );
}
