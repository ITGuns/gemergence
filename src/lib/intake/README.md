# Gemfield Web Intake v2 — admin guide

Post-purchase 2-minute intake. The schema file
**`gemfield_intake_schema_v2.json` (repo root) is the single source of
truth** — question text, options, conditional rules, derivations, and the
follow-up pool all live there. Components render whatever the schema engine
returns; no question text exists in component code.

## Surfaces

| Route | What it is |
|---|---|
| `/intake?plan=<slug>` | Self-signup entry. `plan` slug (foundation/growth/scale/strategic) locks the tier. Point each Square payment link's redirect here. |
| `/intake?s=<id>&t=<token>` | Magic resume link (Path B / abandonment recovery). Prefilled contact, locked tier, server-side autosave. |
| `/panel` | Sales panel: create a submission with the tier sold, optional niche preselect, rep notes; copy or email the magic link; track status; download exports. |
| `POST /api/intake/submissions/:id/send` | Panel action behind "Email link": sends the magic link to the client via Gmail SMTP, signed by the rep. Auth: `x-panel-key`. |
| `GET /api/intake/submissions/:gfId/export` | Canonical MD export (`GF-2026-0147_intake.md`) with DERIVED + FOLLOW-UP sections. Auth: `x-panel-key` header or `Authorization: Bearer $INTAKE_SERVICE_TOKEN`. Accepts UUID or GF-ID. |

## Env vars

| Var | Purpose | Unset behavior |
|---|---|---|
| `DATABASE_URL` | Postgres connection string for `store.ts`. On serverless, use Supabase's transaction pooler (port 6543), not the direct connection. | **Required.** The store throws on first use, so every intake route fails. |
| `PG_POOL_MAX` | Per-instance `pg` pool size | defaults to 3 |
| `INTAKE_PANEL_KEY` | Staff key for `/panel` + list/create/send APIs | dev: `dev-panel` fallback · prod: panel disabled |
| `INTAKE_SERVICE_TOKEN` | Automation token for the export API | export accepts panel key only |
| `GMAIL_USER` + `GMAIL_APP_PASSWORD` | Email sender (Gmail SMTP via app password — no domain verification, delivers to any address, ~500/day) | nothing is sent; the composed message goes to the platform logs (see "Email & notifications") and the failure is written to the event log |
| `DESKII_API_URL` + `GEMFIELD_WEBHOOK_SECRET` | Deskii portal provisioning on submit: HMAC-SHA256-signed POST to `<DESKII_API_URL>/api/gemfield/intake` | no portal is created; the confirmation goes out without the portal block and `portal_provision_failed` lands in the event log |

Every send's outcome (including any provider error) is written to the
submission's event log.

## The client gets exactly one email on submit

The confirmation (`buildConfirmationEmail`) carries the answers **and** the
Deskii portal setup link. Submit provisions Deskii *first* (`provisionDeskiiPortal`),
which creates the org/project and returns `portalSetupUrl` without emailing
anyone, then composes the confirmation around it. A separate Deskii-branded
credentials mail to a client who has only ever dealt with Gemfield reads as
phishing — hence one message, from one sender, under one brand.

Provisioning is capped at 6 seconds. A sleeping Deskii host can never hold the
request long enough for the platform to kill the function, which would make an
intake that was already saved look failed to the client.

If Deskii is down or unconfigured, the confirmation still goes out with no
portal block and `portal_provision_failed` lands in the event log — the signal
that staff must create the org and invite the client by hand. The confirmation
never reaches the logs with a live setup token in it; that body is withheld.

## Adding or editing a niche — schema only, no code

1. Add a block under `niche` in `gemfield_intake_schema_v2.json`:
   `"solar": { "label": "Solar", "group": "home_services", "fields": [...] }`
2. If it's a home-service trade, add its label to
   `nicheSelector.homeServicesSelector.options` (label must match exactly);
   a top-level niche goes in `nicheSelector.options` instead.
3. Keep the budget: ≤ 6 fields per niche, majority tap-type (`choice`/`multichoice`).
4. Redeploy. The wizard, panel preselect list, validation, and exports pick it
   up automatically.

Field shape: `{ id, label, hint, type: text|choice|multichoice, options?, max?,
required?, optional? }`. IDs follow `X-###` (letter–dash–3 digits) — the answer
API drops anything else.

## Rules enforced in code

- **Tier is metadata, never a question.** Set at creation from the plan slug
  (server-resolved) or the rep's panel selection. The client-token PATCH/submit
  routes can only touch `answers`; tier changes are a store-level admin action
  that writes an audit event.
- **Validation** (`schema.ts`): required fields for the resolved niche only;
  answers from another niche's sub-form are rejected at submit (`foreign`).
- **Derivations** (`derivations` in the schema): D-720/D-722 expand into
  legacy design fields, exported under DERIVED as refinable defaults.
- **Follow-up pool**: tier-gated (`(Tier N+)` markers), niche-gated (`H-*`,
  `P-*` prefixes), conditional (`when H-203=Yes`).
- Spam: honeypot + per-IP rate limit on public create, absorbed silently.

## Storage

`store.ts` is the entire persistence contract, and it is Postgres. One row per
submission in `"IntakeSubmission"` (id, GF-ID, status, timestamps, and the full
object in a `data` jsonb column), plus `"IntakeCounter"` for the atomic yearly
GF-ID sequence. Tables are created lazily on first use (`CREATE TABLE IF NOT
EXISTS`, once per warm instance), so there is no migration step.

Each instance holds one small `pg` Pool (`PG_POOL_MAX`, default 3). On
serverless many instances connect at once, so point `DATABASE_URL` at Supabase's
transaction pooler rather than the direct connection. Routes and UI never touch
the database directly; swapping stores again means reimplementing only this
module. Nothing is written to the filesystem — the `data/intake/` directory from
the file-based era no longer exists.

## Email & notifications

Single provider: Gmail SMTP via `nodemailer` (`notify.ts`). Gmail forces the
authenticated account as the envelope sender, so mail goes out as
`"Gemfield Consulting" <GMAIL_USER>` with reply-to set to `SITE.email`. Three
messages exist:

- the client confirmation on submit (`sendClientConfirmation`);
- the panel's "Email link" action (`sendIntakeLink`, via the `/send` route);
- the Free Growth Audit confirmation (`sendAuditConfirmation`, used by
  `/api/audit/confirm`; there is no submission record for an audit).

The "outbox" is not a directory. Serverless filesystems are read-only, so on a
failed send the composed message is logged with an `[intake outbox]` prefix to
the platform logs (Vercel → project → Logs), and the failure is written to the
submission's event log (`confirmation_email_failed`, `link_email_failed`). The
one exception is a confirmation carrying a live Deskii setup link: its body is
withheld from the logs, and staff re-issue the invite from Deskii instead.

Ops notification rides the existing FormSubmit endpoint (`SITE.formEndpoint`),
the same plumbing as the audit form. On failure the answer summary goes to the
platform logs the same way.

## Still pending

- **SMS**: the panel emails the link; there is no text-message send. Adding one
  (Twilio) is a new action next to "Email link".
- **Payment-verified tier**: today the tier comes from the checkout redirect's
  `plan` param. A Square checkout webhook that calls the panel-create API with
  the session's plan would make it fully payment-verified. No Square links are
  live yet — `CHECKOUT` in `constants.ts` is all `null`, so every tier still
  routes to the quote flow.

## Build-process handshake

The MD export is the input contract for the build kickoff (Phase 0 of the
build process): all answered fields in schema order, tier + source + rep notes
in the header, DERIVED section (never client gospel), FOLLOW-UP POOL section
(what was deliberately not asked). Pull it headlessly:

```
curl -H "Authorization: Bearer $INTAKE_SERVICE_TOKEN" \
  https://<site>/api/intake/submissions/GF-2026-0147/export
```
