// Gemfield Web Intake v2 — persistence (Postgres).
// Production storage: one row per submission in "IntakeSubmission" (the full
// object lives in a jsonb column), with an atomic, yearly GF-ID counter in
// "IntakeCounter". This module IS the storage contract — routes and UI never
// touch it directly, so swapping stores (this file was previously file-based)
// means reimplementing only this module; the exported functions are unchanged.

import crypto from "crypto";
import { Pool, type PoolClient } from "pg";
import type {
  Answers,
  ClientSubmissionView,
  Submission,
  SubmissionSource,
  SubmissionStatus,
} from "./types";
import { tierLabelFor } from "./types";
import { SCHEMA_VERSION } from "./schema";

// One Pool per process, reused across warm serverless invocations. Keep the
// per-instance pool small: on serverless many instances connect at once, so we
// lean on Supabase's transaction pooler (port 6543) to multiplex.
const globalForPg = globalThis as unknown as { __intakePool?: Pool };

function getPool(): Pool {
  if (!globalForPg.__intakePool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set — the intake store needs a Postgres connection string.",
      );
    }
    globalForPg.__intakePool = new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX ?? 3),
    });
  }
  return globalForPg.__intakePool;
}

// Lazy, idempotent schema bootstrap (mirrors the old ensureDirs()). Memoized so
// it runs once per warm instance; resets on failure so a transient error retries.
let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "IntakeSubmission" (
          id         text PRIMARY KEY,
          gf_id      text UNIQUE NOT NULL,
          status     text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          data       jsonb NOT NULL
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "IntakeCounter" (
          year int PRIMARY KEY,
          seq  int NOT NULL DEFAULT 0
        );
      `);
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
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

/** GF-{YYYY}-{seq}, sequence resets yearly. The counter row is the authority;
 *  the upsert increments and returns atomically, so concurrent creates can't
 *  collide on a sequence number. */
async function nextGfId(): Promise<string> {
  await ensureSchema();
  const year = new Date().getFullYear();
  const { rows } = await getPool().query<{ seq: number }>(
    `INSERT INTO "IntakeCounter" (year, seq) VALUES ($1, 1)
     ON CONFLICT (year) DO UPDATE SET seq = "IntakeCounter".seq + 1
     RETURNING seq`,
    [year],
  );
  return `GF-${year}-${String(rows[0].seq).padStart(4, "0")}`;
}

export async function createSubmission(input: CreateInput): Promise<Submission> {
  await ensureSchema();
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
  await getPool().query(
    `INSERT INTO "IntakeSubmission" (id, gf_id, status, created_at, updated_at, data)
     VALUES ($1, $2, $3, $4, now(), $5::jsonb)`,
    [sub.id, sub.gfId, sub.status, sub.createdAt, JSON.stringify(sub)],
  );
  return sub;
}

export async function getSubmission(id: string): Promise<Submission | null> {
  await ensureSchema();
  const { rows } = await getPool().query<{ data: Submission }>(
    `SELECT data FROM "IntakeSubmission" WHERE id = $1`,
    [id],
  );
  return rows[0]?.data ?? null;
}

export async function getByGfId(gfId: string): Promise<Submission | null> {
  await ensureSchema();
  const { rows } = await getPool().query<{ data: Submission }>(
    `SELECT data FROM "IntakeSubmission" WHERE gf_id = $1`,
    [gfId],
  );
  return rows[0]?.data ?? null;
}

export async function listSubmissions(): Promise<Submission[]> {
  await ensureSchema();
  const { rows } = await getPool().query<{ data: Submission }>(
    `SELECT data FROM "IntakeSubmission" ORDER BY created_at DESC`,
  );
  return rows.map((r) => r.data);
}

export function tokenMatches(sub: Submission, token: string | null): boolean {
  if (!token) return false;
  const a = Buffer.from(sub.resumeToken);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Read-modify-write inside a transaction with a row lock, so concurrent updates
// to the same submission serialize instead of clobbering each other.
async function update(
  id: string,
  mutate: (sub: Submission) => void,
): Promise<Submission | null> {
  await ensureSchema();
  const client: PoolClient = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ data: Submission }>(
      `SELECT data FROM "IntakeSubmission" WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const sub = rows[0]?.data ?? null;
    if (!sub) {
      await client.query("ROLLBACK");
      return null;
    }
    mutate(sub);
    await client.query(
      `UPDATE "IntakeSubmission"
         SET data = $2::jsonb, status = $3, gf_id = $4, updated_at = now()
       WHERE id = $1`,
      [id, JSON.stringify(sub), sub.status, sub.gfId],
    );
    await client.query("COMMIT");
    return sub;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
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
