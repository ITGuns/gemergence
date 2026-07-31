// Branded HTML emails for the intake system. Email clients are hostile
// territory: everything inline-styled, table-based layout, system fonts,
// no external assets. Palette mirrors the site (globals.css).

import type { Submission } from "./types";
import {
  coreFields,
  fieldById,
  nicheFields,
  NICHE_SELECTOR,
  TRADE_SELECTOR,
} from "./schema";
import { SITE } from "@/lib/constants";

const C = {
  paper: "#fafaf7",
  surface: "#f2f2ec",
  ink: "#15171a",
  ink2: "#4a4f55",
  emerald: "#0e5c45",
  emeraldDeep: "#0a4634",
  tint: "#e8f1ed",
  hairline: "#e3e3dc",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(v: string | string[] | undefined): string | null {
  if (v === undefined) return null;
  const s = Array.isArray(v) ? v.join(" · ") : v;
  return s.trim() === "" ? null : esc(s);
}

/** Label/value rows for every answered question, schema order. */
function answerRows(sub: Submission): string {
  const rows: string[] = [];
  const push = (label: string, v: string | string[] | undefined) => {
    const val = fmt(v);
    if (val === null) return;
    rows.push(`
      <tr>
        <td style="padding:10px 0 2px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${C.ink2};font-family:Consolas,Menlo,monospace;">${esc(label)}</td>
      </tr>
      <tr>
        <td style="padding:0 0 10px;font-size:15px;line-height:1.5;color:${C.ink};border-bottom:1px solid ${C.hairline};">${val}</td>
      </tr>`);
  };
  for (const f of coreFields()) push(f.label, sub.answers[f.id]);
  push(NICHE_SELECTOR.label, sub.answers[NICHE_SELECTOR.id]);
  push(TRADE_SELECTOR.label, sub.answers[TRADE_SELECTOR.id]);
  for (const f of nicheFields(sub.niche)) push(f.label, sub.answers[f.id]);
  return rows.join("");
}

function shell(bodyHtml: string, preheader: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.surface};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="padding:0 8px 18px;">
            <span style="font-size:17px;font-weight:800;letter-spacing:0.02em;color:${C.ink};">GEMFIELD</span>
            <span style="font-size:11px;font-weight:600;letter-spacing:0.28em;color:${C.ink2};"> CONSULTING</span>
          </td>
        </tr>
        <tr><td style="background:#ffffff;border:1px solid ${C.hairline};border-radius:14px;padding:36px 32px;">
          ${bodyHtml}
        </td></tr>
        <tr>
          <td style="padding:20px 8px;font-size:12px;line-height:1.6;color:${C.ink2};">
            ${esc(SITE.name)} · ${esc(SITE.location)}<br>
            Questions? Just reply, or write to
            <a href="mailto:${esc(SITE.email)}" style="color:${C.emerald};">${esc(SITE.email)}</a>.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function gfBadge(gfId: string): string {
  return `<span style="display:inline-block;background:${C.tint};color:${C.emeraldDeep};font-family:Consolas,Menlo,monospace;font-size:14px;font-weight:700;padding:7px 14px;border-radius:999px;">Reference: ${esc(gfId)}</span>`;
}

function step(n: string, title: string, copy: string): string {
  return `
    <tr>
      <td valign="top" style="width:34px;padding:8px 0;">
        <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:${C.tint};color:${C.emeraldDeep};border-radius:999px;font-size:12px;font-weight:700;">${n}</span>
      </td>
      <td style="padding:8px 0;font-size:14px;line-height:1.55;color:${C.ink2};">
        <strong style="color:${C.ink};">${esc(title)}</strong> — ${esc(copy)}
      </td>
    </tr>`;
}

/** Post-submit confirmation: the client's complete copy of their answers. */
export function buildConfirmationEmail(sub: Submission): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = (sub.contactName || "there").split(" ")[0];
  const wantsUpload =
    typeof sub.answers["D-722"] === "string" && sub.answers["D-722"] !== "Neither yet";

  const body = `
    <h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;color:${C.ink};font-weight:800;">Your website is underway.</h1>
    ${gfBadge(sub.gfId)}
    <p style="margin:20px 0 6px;font-size:15px;line-height:1.6;color:${C.ink2};">
      Hi ${esc(firstName)} — thanks for the ${esc(String(2))}-minute intake for
      <strong style="color:${C.ink};">${esc(sub.businessName || "your business")}</strong>.
      That's everything we need to start. Here's what happens next:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 6px;">
      ${step("1", "Research", "our team studies your market, competitors, and search landscape.")}
      ${step("2", "Design & build", "we create your site from your answers below — nothing generic.")}
      ${step("3", "Your preview", "you get a live link to review and refine. Nothing launches without your sign-off.")}
    </table>
    ${
      wantsUpload
        ? `<div style="margin:16px 0 4px;background:${C.paper};border:1px solid ${C.hairline};border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.55;color:${C.ink2};">
             <strong style="color:${C.ink};">Your logo &amp; photos:</strong> simply reply to this email with your files attached. No rush — research starts meanwhile.
           </div>`
        : ""
    }
    <h2 style="margin:26px 0 4px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:${C.emerald};font-weight:700;">Your answers, for your records</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${answerRows(sub)}
    </table>
    <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${C.ink2};">
      Keep this email — your reference <strong style="font-family:Consolas,Menlo,monospace;">${esc(sub.gfId)}</strong> gets you instant answers on any question about your build.
    </p>`;

  // Plain-text alternative for clients that prefer it.
  const textLines = [
    `Your website is underway — ${sub.gfId}`,
    ``,
    `Hi ${firstName}, thanks for the intake for ${sub.businessName}.`,
    `Next: 1) research  2) design & build  3) your live preview to refine.`,
    wantsUpload ? `Logo & photos: reply to this email with files attached.` : ``,
    ``,
    `Your answers:`,
  ];
  const pushText = (label: string, v: string | string[] | undefined) => {
    if (v === undefined) return;
    const s = Array.isArray(v) ? v.join(", ") : v;
    if (s.trim()) textLines.push(`${label}: ${s}`);
  };
  for (const f of coreFields()) pushText(f.label, sub.answers[f.id]);
  pushText(NICHE_SELECTOR.label, sub.answers[NICHE_SELECTOR.id]);
  pushText(TRADE_SELECTOR.label, sub.answers[TRADE_SELECTOR.id]);
  for (const f of nicheFields(sub.niche)) pushText(f.label, sub.answers[f.id]);
  textLines.push(``, `— ${SITE.name} · ${SITE.email}`);

  return {
    subject: `Your website is underway — ${sub.gfId}`,
    html: shell(body, `Received! Reference ${sub.gfId} — here's your copy and what happens next.`),
    text: textLines.filter((l) => l !== undefined).join("\n"),
  };
}

/** Panel "email the link" message: warm, short, one clear button. */
export function buildLinkEmail(
  sub: Submission,
  url: string,
  repName: string,
): { subject: string; html: string; text: string } {
  const firstName = (sub.contactName || "there").split(" ")[0];
  const body = `
    <h1 style="margin:0 0 14px;font-size:24px;line-height:1.3;color:${C.ink};font-weight:800;">Let's start your website.</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${C.ink2};">
      Hi ${esc(firstName)} — great talking with you. Your plan
      (<strong style="color:${C.ink};">${esc(sub.tierLabel)}</strong>) is set up for
      <strong style="color:${C.ink};">${esc(sub.businessName || "your business")}</strong>.
    </p>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:${C.ink2};">
      One small thing from your side: a quick intake — <strong style="color:${C.ink};">about 2 minutes</strong>, mostly taps, works great on your phone. Your answers are saved as you go, so you can stop and pick it back up any time from this same link.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
      <tr><td style="background:${C.emerald};border-radius:10px;">
        <a href="${esc(url)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Start my 2-minute intake &rarr;</a>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;line-height:1.6;color:${C.ink2};">
      Your reference is <strong style="font-family:Consolas,Menlo,monospace;">${esc(sub.gfId)}</strong>.
      If the button doesn't work, paste this into your browser:<br>
      <a href="${esc(url)}" style="color:${C.emerald};word-break:break-all;">${esc(url)}</a>
    </p>
    <p style="margin:16px 0 0;font-size:14px;color:${C.ink2};">— ${esc(repName)}, ${esc(SITE.name)}</p>`;

  return {
    subject: `Your ${sub.tierLabel} plan is ready — 2 minutes to start (${sub.gfId})`,
    html: shell(body, `About 2 minutes, mostly taps — and your website build begins.`),
    text: [
      `Hi ${firstName} — great talking with you.`,
      `Your plan (${sub.tierLabel}) is set up for ${sub.businessName}.`,
      ``,
      `Start your 2-minute intake: ${url}`,
      ``,
      `Answers save as you go — stop and resume any time from the same link.`,
      `Reference: ${sub.gfId}`,
      ``,
      `— ${repName}, ${SITE.name}`,
    ].join("\n"),
  };
}

/**
 * Free Growth Audit — client confirmation. Sent the moment the audit form is
 * completed, so the prospect has a record and a stated expectation instead of
 * silence. Deliberately makes no promise the team cannot keep: it confirms
 * receipt and names the next step, nothing more.
 */
export function buildAuditConfirmationEmail(input: {
  name: string;
  business: string;
  email?: string;
  website?: string;
  phone?: string;
  industry?: string;
  goals?: string[];
  notes?: string;
}): { subject: string; html: string; text: string } {
  const firstName = (input.name || "there").split(" ")[0];
  const business = input.business || "your business";

  // Their own copy of what they sent — same record-keeping purpose as the
  // intake confirmation. Empty fields are omitted rather than shown blank.
  const detail: Array<[string, string | string[] | undefined]> = [
    ["Your name", input.name],
    ["Business", input.business],
    ["Email", input.email],
    ["Website", input.website],
    ["Phone", input.phone],
    ["Industry", input.industry],
    ["What you want more of", input.goals],
    ["Anything else", input.notes],
  ];
  const detailRows = detail
    .map(([label, v]) => {
      const val = fmt(v);
      if (val === null) return "";
      return `
      <tr>
        <td style="padding:10px 0 2px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${C.ink2};font-family:Consolas,Menlo,monospace;">${esc(label)}</td>
      </tr>
      <tr>
        <td style="padding:0 0 10px;font-size:15px;line-height:1.5;color:${C.ink};border-bottom:1px solid ${C.hairline};">${val}</td>
      </tr>`;
    })
    .join("");

  const detailText = detail
    .map(([label, v]) => {
      const s = Array.isArray(v) ? v.join(" · ") : v;
      return s && s.trim() !== "" ? `${label}: ${s}` : "";
    })
    .filter(Boolean)
    .join("\n");

  const body = `
    <h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;color:${C.ink};font-weight:800;">We've got your audit request.</h1>
    <p style="margin:20px 0 6px;font-size:15px;line-height:1.6;color:${C.ink2};">
      Hi ${esc(firstName)} — thanks for sending through the details for
      <strong style="color:${C.ink};">${esc(business)}</strong>.
      A real person reviews every request. Here's what happens next:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 6px;">
      ${step("1", "We review", "we look at your website, your search visibility, and how you currently capture leads.")}
      ${step("2", "We come back to you", "you get our findings and a straight answer on whether we can help — within 1 business day.")}
      ${step("3", "You decide", "the audit is yours either way. No contracts, no pressure.")}
    </table>
    <p style="margin:16px 0 6px;font-size:14px;line-height:1.6;color:${C.ink2};">
      If anything changed or you'd like to add context, just reply to this email — it comes straight to us.
    </p>
    <h2 style="margin:26px 0 2px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:${C.ink2};font-family:Consolas,Menlo,monospace;font-weight:600;">What you sent us</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;">
      ${detailRows}
    </table>
  `;

  return {
    subject: `We've got your audit request — ${business}`,
    html: shell(body, `Thanks ${firstName} — we're reviewing ${business} and will come back within 1 business day.`),
    text: [
      `We've got your audit request.`,
      ``,
      `Hi ${firstName} — thanks for sending through the details for ${business}.`,
      `A real person reviews every request. Here's what happens next:`,
      ``,
      `1. We review — your website, search visibility, and how you capture leads.`,
      `2. We come back to you — findings and a straight answer, within 1 business day.`,
      `3. You decide — the audit is yours either way. No contracts, no pressure.`,
      ``,
      `If anything changed or you'd like to add context, just reply to this email.`,
      ``,
      `WHAT YOU SENT US`,
      detailText,
      ``,
      `— ${SITE.name}`,
    ].join("\n"),
  };
}
