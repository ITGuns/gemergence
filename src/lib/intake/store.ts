// Gemfield Web Intake v2 — persistence.
// File-based store under data/intake/ so the whole system runs with zero
// external services in dev. The exported functions are the storage contract:
// swapping to Postgres (the production target in the integration spec) means
// reimplementing this module only — routes and UI never touch the filesystem.

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type {
  Answers,
  ClientSubmissionView,
  Submission,
  SubmissionSource,
  SubmissionStatus,
} from "./types";
import { tierLabelFor } from "./types";
import { SCHEMA_VERSION } from "./schema";

const DATA_DIR = path.join(process.cwd(), "data", "intake");
const SUBMISSIONS_DIR = path.join(DATA_DIR, "submissions");
const COUNTER_FILE = path.join(DATA_DIR, "gf-counter.json");

async function ensureDirs() {
  await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });
}

async function writeJsonAtomic(file: string, value: unknown) {
  const tmp = `${file}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, file);
}

/** GF-{YYYY}-{seq}, sequence resets yearly. Counter file is the authority. */
async function nextGfId(): Promise<string> {
  await ensureDirs();
  const year = new Date().getFullYear();
  let counter = { year, seq: 0 };
  try {
    const raw = JSON.parse(await fs.readFile(COUNTER_FILE, "utf8"));
    if (raw.year === year) counter = raw;
  } catch {
    /* first submission of the install or the year */
  }
  counter.seq += 1;
  await writeJsonAtomic(COUNTER_FILE, counter);
  return `GF-${year}-${String(counter.seq).padStart(4, "0")}`;
}

function submissionFile(id: string) {
  // IDs are UUIDs we generate; the check keeps path traversal impossible anyway.
  if (!/^[a-zA-Z0-9-]+$/.test(id)) throw new Error("Invalid submission id");
  return path.join(SUBMISSIONS_DIR, `${id}.json`);
}

export type CreateInput = {
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  tier: number | null;
  source: SubmissionSource;
  salesRepId?: string;
  repNotes?: string;
  nichePreselect?: { niche: string; trade?: string };
};

export async function createSubmission(input: CreateInput): Promise<Submission> {
  await ensureDirs();
  const now = new Date().toISOString();
  const sub: Submission = {
    id: crypto.randomUUID(),
    gfId: await nextGfId(),
    businessName: input.businessName,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone ?? "",
    tier: input.tier,
    tierLabel: tierLabelFor(input.tier),
    source: input.source,
    salesRepId: input.salesRepId,
    repNotes: input.repNotes,
    nichePreselect: input.nichePreselect,
    niche: null,
    trade: null,
    status: "created",
    resumeToken: crypto.randomBytes(24).toString("base64url"),
    answers: {},
    events: [
      {
        type: "created",
        at: now,
        actor: input.source === "sales_panel" ? (input.salesRepId ?? "rep") : "client",
      },
    ],
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    submittedAt: null,
  };
  await writeJsonAtomic(submissionFile(sub.id), sub);
  return sub;
}

export async function getSubmission(id: string): Promise<Submission | null> {
  try {
    return JSON.parse(await fs.readFile(submissionFile(id), "utf8")) as Submission;
  } catch {
    return null;
  }
}

export async function getByGfId(gfId: string): Promise<Submission | null> {
  const all = await listSubmissions();
  return all.find((s) => s.gfId === gfId) ?? null;
}

export async function listSubmissions(): Promise<Submission[]> {
  await ensureDirs();
  const files = await fs.readdir(SUBMISSIONS_DIR);
  const subs: Submission[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      subs.push(JSON.parse(await fs.readFile(path.join(SUBMISSIONS_DIR, f), "utf8")));
    } catch {
      /* skip unreadable record */
    }
  }
  return subs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function tokenMatches(sub: Submission, token: string | null): boolean {
  if (!token) return false;
  const a = Buffer.from(sub.resumeToken);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function update(
  id: string,
  mutate: (sub: Submission) => void,
): Promise<Submission | null> {
  const sub = await getSubmission(id);
  if (!sub) return null;
  mutate(sub);
  await writeJsonAtomic(submissionFile(id), sub);
  return sub;
}

export async function logEvent(id: string, type: string, actor: string, note?: string) {
  await update(id, (s) => {
    s.events.push({ type, at: new Date().toISOString(), actor, note });
  });
}

/**
 * Client-token answer upsert. Tier, status, and identity fields are not
 * writable here by construction (Rule 2) — the function only touches
 * `answers` and rolls the status forward to in_progress.
 */
export async function saveAnswers(
  id: string,
  answers: Answers,
): Promise<Submission | null> {
  return update(id, (s) => {
    if (s.status === "submitted") throw new Error("Submission is final");
    Object.assign(s.answers, answers);
    if (s.status !== "in_progress") {
      s.status = "in_progress";
      s.events.push({ type: "in_progress", at: new Date().toISOString(), actor: "client" });
    }
  });
}

export async function markOpened(id: string) {
  await update(id, (s) => {
    if (s.status === "created" || s.status === "sent") {
      s.status = "opened";
      s.events.push({ type: "opened", at: new Date().toISOString(), actor: "client" });
    }
  });
}

export async function finalizeSubmission(
  id: string,
  niche: string | null,
  trade: string | null,
): Promise<Submission | null> {
  return update(id, (s) => {
    s.niche = niche;
    s.trade = trade;
    s.status = "submitted";
    s.submittedAt = new Date().toISOString();
    s.events.push({ type: "submitted", at: s.submittedAt, actor: "client" });
  });
}

export async function setStatus(id: string, status: SubmissionStatus, actor: string) {
  await update(id, (s) => {
    s.status = status;
    s.events.push({ type: status, at: new Date().toISOString(), actor });
  });
}

/** Panel-only tier change, always audit-logged (Rule 2). */
export async function changeTier(
  id: string,
  tier: number,
  actor: string,
  note: string,
): Promise<Submission | null> {
  return update(id, (s) => {
    s.tier = tier;
    s.tierLabel = tierLabelFor(tier);
    s.events.push({ type: "tier_changed", at: new Date().toISOString(), actor, note });
  });
}

export function toClientView(sub: Submission): ClientSubmissionView {
  return {
    id: sub.id,
    gfId: sub.gfId,
    businessName: sub.businessName,
    contactName: sub.contactName,
    contactEmail: sub.contactEmail,
    contactPhone: sub.contactPhone,
    tier: sub.tier,
    tierLabel: sub.tierLabel,
    status: sub.status,
    nichePreselect: sub.nichePreselect,
    answers: sub.answers,
  };
}
