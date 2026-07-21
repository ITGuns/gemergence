// GET /api/intake/submissions/:id/export — canonical Markdown export.
// Auth: panel key (x-panel-key) or service token (Authorization: Bearer …).
// :id accepts the internal UUID or the GF-ID, so a build kickoff can pull
// intake without a human download: GET …/GF-2026-0147/export

import { NextRequest, NextResponse } from "next/server";
import { serviceAuth } from "@/lib/intake/auth";
import { buildMarkdownExport } from "@/lib/intake/export";
import { getByGfId, getSubmission } from "@/lib/intake/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!serviceAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const sub = /^GF-\d{4}-\d+$/.test(id)
    ? await getByGfId(id)
    : await getSubmission(id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const md = buildMarkdownExport(sub);
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${sub.gfId}_intake.md"`,
    },
  });
}
