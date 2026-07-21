# Gemfield Web Intake v2 — admin guide

Post-purchase 2-minute intake per `GEMFIELD_INTAKE_INTEGRATION.md`. The schema
file **`gemfield_intake_schema_v2.json` (repo root) is the single source of
truth** — question text, options, conditional rules, derivations, and the
follow-up pool all live there. Components render whatever the schema engine
returns; no question text exists in component code.

## Surfaces

| Route | What it is |
|---|---|
| `/intake?plan=<slug>` | Self-signup entry. `plan` slug (foundation/growth/scale/strategic) locks the tier. Point each Square payment link's redirect here. |
| `/intake?s=<id>&t=<token>` | Magic resume link (Path B / abandonment recovery). Prefilled contact, locked tier, server-side autosave. |
| `/panel` | Sales panel: create a submission with the tier sold, optional niche preselect, rep notes; copy the link; track status; download exports. |
| `GET /api/intake/submissions/:gfId/export` | Canonical MD export (`GF-2026-0147_intake.md`) with DERIVED + FOLLOW-UP sections. Auth: `x-panel-key` header or `Authorization: Bearer $INTAKE_SERVICE_TOKEN`. Accepts UUID or GF-ID. |

## Env vars

| Var | Purpose | Unset behavior |
|---|---|---|
| `INTAKE_PANEL_KEY` | Staff key for `/panel` + list/create APIs | dev: `dev-panel` fallback · prod: panel disabled |
| `INTAKE_SERVICE_TOKEN` | Automation token for the export API | export accepts panel key only |
| `GMAIL_USER` + `GMAIL_APP_PASSWORD` | Email sender (Gmail SMTP via app password — no domain verification, delivers to any address, ~500/day) | composed emails written to `data/intake/outbox/` instead |

Every send's outcome (including any provider error) is written to the
submission's event log.

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

## Storage & cutover points

`store.ts` is the entire persistence contract — a file-based implementation
under `data/intake/` (gitignored). Production cutovers, each isolated:

- **Postgres**: reimplement `store.ts` only (submissions/answers/events tables
  per the integration spec §4). Routes and UI don't touch the filesystem.
- **Resend**: swap the outbox write in `notify.ts` (`sendClientConfirmation`).
- **Twilio SMS**: add a send action in the panel next to "Copy link".
- **Stripe/Square webhook**: today the tier comes from the checkout redirect's
  `plan` param; a checkout webhook that calls the panel-create API with the
  session's plan makes it fully payment-verified.

Ops notification currently rides the existing FormSubmit endpoint
(`SITE.formEndpoint`), falling back to `data/intake/outbox/` on failure.

## Build-process handshake

The MD export is the input contract for `GEMFIELD_BUILD_PROCESS.md` Phase 0:
all answered fields in schema order, tier + source + rep notes in the header,
DERIVED section (never client gospel), FOLLOW-UP POOL section (what was
deliberately not asked). Pull it headlessly:

```
curl -H "Authorization: Bearer $INTAKE_SERVICE_TOKEN" \
  https://<site>/api/intake/submissions/GF-2026-0147/export
```
