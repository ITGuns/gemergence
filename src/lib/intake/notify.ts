// Gemfield Web Intake v2 — notifications.
// Client-facing email goes out via Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD
// — no domain verification needed, delivers to any address, ~500/day). On any
// failure the composed message lands in data/intake/outbox/ so content is
// inspectable and nothing is ever lost.
// Ops notification rides the existing FormSubmit endpoint (same plumbing as
// the audit form) so the team inbox needs zero new accounts.

import nodemailer from "nodemailer";
import { SITE } from "@/lib/constants";
import type { Submission } from "./types";
import { buildAnswerSummary } from "./export";
import { buildAuditConfirmationEmail, buildConfirmationEmail, buildLinkEmail } from "./email";
import { logEvent } from "./store";

// Serverless filesystems are read-only/ephemeral, so we can't drop unsent mail
// on disk. Log it instead (captured in the platform logs) — and the outcome is
// always recorded in the submission's event log too, so nothing is silently lost.
async function writeOutbox(name: string, content: string) {
  console.warn(`[intake outbox] ${name}\n${content}`);
}

type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/**
 * Gmail SMTP via app password. Gmail forces the authenticated account as the
 * envelope sender, so `from` uses the display name with GMAIL_USER's address.
 */
async function sendViaGmail(msg: Mail): Promise<{ ok: boolean; detail: string }> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return { ok: false, detail: "GMAIL_USER / GMAIL_APP_PASSWORD not set" };
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"${SITE.name}" <${user}>`,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      replyTo: msg.replyTo ?? SITE.email,
    });
    return { ok: true, detail: "accepted (gmail)" };
  } catch (e) {
    return {
      ok: false,
      detail: `Gmail SMTP: ${e instanceof Error ? e.message.slice(0, 300) : "unknown"}`,
    };
  }
}

/** Single provider: Gmail SMTP. Callers fall back to the outbox on failure. */
async function sendEmail(msg: Mail): Promise<{ ok: boolean; detail: string }> {
  return sendViaGmail(msg);
}

/** Notify the internal team a submission landed. Never throws. */
export async function notifyOps(sub: Submission) {
  const summary = buildAnswerSummary(sub);
  try {
    const body = new FormData();
    body.append("_subject", `Intake submitted — ${sub.gfId} (${sub.businessName})`);
    body.append("gf_id", sub.gfId);
    body.append("business", sub.businessName);
    body.append("contact", `${sub.contactName} <${sub.contactEmail}> ${sub.contactPhone}`);
    body.append("tier", sub.tierLabel);
    body.append("source", sub.source + (sub.salesRepId ? ` (rep: ${sub.salesRepId})` : ""));
    body.append("niche", `${sub.niche ?? "other_general"}${sub.trade ? ` / ${sub.trade}` : ""}`);
    body.append("answers", summary);
    const res = await fetch(SITE.formEndpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
    });
    if (!res.ok) throw new Error(`ops notify failed: ${res.status}`);
  } catch {
    await writeOutbox(`${sub.gfId}_ops-notification.txt`, summary).catch(() => {});
  }
}

/**
 * Client confirmation — their complete copy of the answers (record-keeping /
 * dispute prevention). Resend first; outbox fallback. Outcome is written to
 * the submission's event log either way. Never throws.
 */
export async function sendClientConfirmation(sub: Submission) {
  const email = buildConfirmationEmail(sub);
  const sent = await sendEmail({
    to: sub.contactEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  if (sent.ok) {
    await logEvent(sub.id, "confirmation_emailed", "system", `to ${sub.contactEmail}`).catch(
      () => {},
    );
    return;
  }
  await logEvent(sub.id, "confirmation_email_failed", "system", sent.detail).catch(() => {});
  await writeOutbox(
    `${sub.gfId}_client-confirmation.html`,
    `<!-- To: ${sub.contactEmail} · Subject: ${email.subject} · not sent (${sent.detail}) -->\n${email.html}`,
  ).catch(() => {});
}

/**
 * Panel action: email the magic intake link to the client, signed by the rep.
 * Returns whether it actually went out so the panel can say so honestly.
 */
export async function sendIntakeLink(
  sub: Submission,
  url: string,
  repName: string,
): Promise<{ sent: boolean; detail: string }> {
  const email = buildLinkEmail(sub, url, repName);
  const res = await sendEmail({
    to: sub.contactEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  if (res.ok) {
    await logEvent(sub.id, "link_emailed", repName, `to ${sub.contactEmail}`).catch(() => {});
    return { sent: true, detail: "sent" };
  }
  await logEvent(sub.id, "link_email_failed", repName, res.detail).catch(() => {});
  await writeOutbox(
    `${sub.gfId}_intake-link.html`,
    `<!-- To: ${sub.contactEmail} · Subject: ${email.subject} · not sent (${res.detail}) -->\n${email.html}`,
  ).catch(() => {});
  return { sent: false, detail: res.detail };
}

/**
 * Free Growth Audit confirmation to the prospect. There is no submission
 * record for an audit (it rides FormSubmit to the team inbox), so there is no
 * event log to write — a failure lands in the platform logs via the outbox.
 * Never throws: the caller must not let a mail failure break the form.
 */
export async function sendAuditConfirmation(input: {
  name: string;
  business: string;
  email: string;
  website?: string;
  phone?: string;
  industry?: string;
  goals?: string[];
  notes?: string;
}): Promise<{ sent: boolean; detail: string }> {
  const mail = buildAuditConfirmationEmail(input);
  const res = await sendEmail({
    to: input.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  if (res.ok) return { sent: true, detail: "sent" };
  await writeOutbox(
    `audit_${input.email}_confirmation.html`,
    `<!-- To: ${input.email} · Subject: ${mail.subject} · not sent (${res.detail}) -->\n${mail.html}`,
  ).catch(() => {});
  return { sent: false, detail: res.detail };
}
