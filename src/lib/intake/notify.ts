// Gemfield Web Intake v2 — notifications.
// Client-facing email prefers Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD —
// no domain verification needed, delivers to any address), then falls back to
// Resend (RESEND_API_KEY), then to data/intake/outbox/ so the composed
// message is inspectable and nothing is ever lost.
// Ops notification rides the existing FormSubmit endpoint (same plumbing as
// the audit form) so the team inbox needs zero new accounts.

import { promises as fs } from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { SITE } from "@/lib/constants";
import type { Submission } from "./types";
import { buildAnswerSummary } from "./export";
import { buildConfirmationEmail, buildLinkEmail } from "./email";
import { logEvent } from "./store";

const OUTBOX_DIR = path.join(process.cwd(), "data", "intake", "outbox");

async function writeOutbox(name: string, content: string) {
  await fs.mkdir(OUTBOX_DIR, { recursive: true });
  await fs.writeFile(path.join(OUTBOX_DIR, name), content, "utf8");
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

/** Resend HTTP API — secondary path, useful once the domain is verified. */
async function sendViaResend(msg: Mail): Promise<{ ok: boolean; detail: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, detail: "RESEND_API_KEY not set" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.INTAKE_FROM_EMAIL ?? `${SITE.name} <onboarding@resend.dev>`,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        reply_to: msg.replyTo ?? SITE.email,
      }),
    });
    if (res.ok) return { ok: true, detail: "accepted (resend)" };
    const errBody = await res.text().catch(() => "");
    return { ok: false, detail: `Resend ${res.status}: ${errBody.slice(0, 300)}` };
  } catch (e) {
    return { ok: false, detail: `network: ${e instanceof Error ? e.message : "unknown"}` };
  }
}

/** Provider chain: Gmail SMTP → Resend. Callers outbox on total failure. */
async function sendEmail(msg: Mail): Promise<{ ok: boolean; detail: string }> {
  const gmail = await sendViaGmail(msg);
  if (gmail.ok) return gmail;
  const resend = await sendViaResend(msg);
  if (resend.ok) return resend;
  return { ok: false, detail: `${gmail.detail} · ${resend.detail}` };
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
