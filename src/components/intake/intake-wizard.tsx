"use client";

// Gemfield Web Intake v2 — the 2-minute wizard (integration spec §3).
// Screens: 1 basics → 2 the tap core → 3 style & assets → 4 niche → 5 review.
// Tier is a locked badge from the entry path, never a question (Rule 2).
// Autosave on every answer (localStorage immediately, server debounced once a
// submission exists); magic-link resume via ?s=<id>&t=<token>.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check } from "@/components/icons";
import { FieldInput } from "./field-inputs";
import {
  missingRequired,
  NICHE_SELECTOR,
  nicheFields,
  nicheLabel,
  resolveNicheSelection,
  TRADE_SELECTOR,
  visibleCoreFields,
} from "@/lib/intake/schema";
import type { Answers, AnswerValue, IntakeField } from "@/lib/intake/types";
import { PLAN_TIERS } from "@/lib/intake/types";
import { SITE } from "@/lib/constants";

const DRAFT_KEY = "gemfield:intake-v2-draft";
const REF_KEY = "gemfield:intake-v2-ref";

type ServerRef = { id: string; token: string };

type Contact = { name: string; email: string; phone: string };

type Props = {
  resume?: { id: string; token: string };
  plan?: string; // plan slug from the checkout redirect (self-signup path)
};

// Screen composition: which core field IDs belong to which screen.
const SCREEN_1 = ["D-101", "D-201", "D-205"];
const SCREEN_2 = ["D-501", "D-801", "D-703"];
const SCREEN_3 = ["D-720", "D-721", "D-704", "D-722", "D-723", "D-906"];
const STEP_COUNT = 5;

function pickFields(ids: string[], visible: IntakeField[]): IntakeField[] {
  return ids
    .map((id) => visible.find((f) => f.id === id))
    .filter((f): f is IntakeField => f !== undefined);
}

export function IntakeWizard({ resume, plan }: Props) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [contact, setContact] = useState<Contact>({ name: "", email: "", phone: "" });
  const [serverRef, setServerRef] = useState<ServerRef | null>(resume ?? null);
  const [tierLabel, setTierLabel] = useState<string | null>(null);
  const [preselect, setPreselect] = useState<{ niche: string; trade?: string } | null>(null);
  const [loading, setLoading] = useState(!!resume);
  const [loadError, setLoadError] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "error">("idle");
  const [submitProblem, setSubmitProblem] = useState<string | null>(null);
  const [gfId, setGfId] = useState<string | null>(null);
  const honeypot = useRef("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const planInfo = plan ? PLAN_TIERS[plan.toLowerCase()] : undefined;
  const badge =
    tierLabel ??
    (planInfo ? `Your plan: ${planInfo.label}` : "Plan: confirmed at checkout");

  // ---- hydrate: resume from server, or restore the local draft -------------
  useEffect(() => {
    if (resume) {
      (async () => {
        try {
          const res = await fetch(
            `/api/intake/submissions/${resume.id}?t=${encodeURIComponent(resume.token)}`,
          );
          if (!res.ok) throw new Error(String(res.status));
          const { submission } = await res.json();
          setAnswers(submission.answers ?? {});
          setContact({
            name: submission.contactName ?? "",
            email: submission.contactEmail ?? "",
            phone: submission.contactPhone ?? "",
          });
          if (submission.businessName && !submission.answers?.["D-101"]) {
            setAnswers((a) => ({ ...a, "D-101": submission.businessName }));
          }
          setTierLabel(`Your plan: ${submission.tierLabel}`);
          setPreselect(submission.nichePreselect ?? null);
          if (submission.status === "submitted") setGfId(submission.gfId);
        } catch {
          setLoadError(true);
        } finally {
          setLoading(false);
        }
      })();
      return;
    }
    try {
      const draft = window.localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only draft hydration
        setAnswers(parsed.answers ?? {});
        setContact(parsed.contact ?? { name: "", email: "", phone: "" });
      }
      const ref = window.localStorage.getItem(REF_KEY);
      if (ref) setServerRef(JSON.parse(ref));
    } catch {
      /* private mode — run without a draft */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time hydration
  }, []);

  // ---- autosave ------------------------------------------------------------
  // Resume-mode drafts live server-side only: writing the shared local draft
  // here would leak this submission's answers into a later self-signup
  // started on the same device.
  const persistLocal = useCallback(
    (a: Answers, c: Contact) => {
      if (resume) return;
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers: a, contact: c }));
      } catch {
        /* ignore */
      }
    },
    [resume],
  );

  const scheduleServerSave = useCallback(
    (a: Answers, ref: ServerRef | null) => {
      if (!ref) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        fetch(`/api/intake/submissions/${ref.id}?t=${encodeURIComponent(ref.token)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: a }),
        }).catch(() => {
          /* offline — localStorage still has it; submit sends everything */
        });
      }, 800);
    },
    [],
  );

  const setAnswer = (id: string, value: AnswerValue) => {
    setAnswers((prev) => {
      let next = { ...prev, [id]: value };
      // Switching niches clears the other niche's sub-form answers.
      if (id === NICHE_SELECTOR.id || id === TRADE_SELECTOR.id) {
        const keep = new Set([NICHE_SELECTOR.id, TRADE_SELECTOR.id]);
        next = Object.fromEntries(
          Object.entries(next).filter(([k]) => k.startsWith("D-") || keep.has(k)),
        );
        next[id] = value;
        if (id === NICHE_SELECTOR.id) delete next[TRADE_SELECTOR.id];
      }
      persistLocal(next, contact);
      scheduleServerSave(next, serverRef);
      return next;
    });
  };

  const setContactField = (k: keyof Contact, v: string) => {
    setContact((prev) => {
      const next = { ...prev, [k]: v };
      persistLocal(answers, next);
      return next;
    });
  };

  // ---- server submission record (created after screen 1) -------------------
  const ensureServer = useCallback(async (): Promise<ServerRef | null> => {
    if (serverRef) return serverRef;
    try {
      const res = await fetch("/api/intake/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: (answers["D-101"] as string) ?? "",
          contactName: contact.name,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          plan: plan ?? "",
          website_url: honeypot.current, // honeypot — humans never fill it
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const ref = { id: data.id, token: data.resumeToken };
      setServerRef(ref);
      try {
        window.localStorage.setItem(REF_KEY, JSON.stringify(ref));
      } catch {
        /* ignore */
      }
      return ref;
    } catch {
      return null; // offline: wizard continues locally, submit retries creation
    }
  }, [serverRef, answers, contact, plan]);

  // ---- step logic ----------------------------------------------------------
  const visible = useMemo(() => visibleCoreFields(answers), [answers]);
  const screen1Fields = pickFields(SCREEN_1, visible);
  const screen2Fields = pickFields(SCREEN_2, visible);
  const screen3Fields = pickFields(SCREEN_3, visible);

  const n001 = answers[NICHE_SELECTOR.id] as string | undefined;
  const n002 = answers[TRADE_SELECTOR.id] as string | undefined;
  const { nicheKey } = preselect?.niche
    ? { nicheKey: preselect.niche }
    : resolveNicheSelection(n001, n002);
  const subFormFields = nicheFields(nicheKey);

  const emailOk = /.+@.+\..+/.test(contact.email);
  const stepOk = (s: number): boolean => {
    switch (s) {
      case 1:
        return (
          contact.name.trim() !== "" &&
          emailOk &&
          missingRequired(screen1Fields, answers).length === 0
        );
      case 2:
        return missingRequired(screen2Fields, answers).length === 0;
      case 3:
        return missingRequired(screen3Fields, answers).length === 0;
      case 4: {
        if (!preselect?.niche) {
          if (!n001) return false;
          if (n001 === "Home Services" && !n002) return false;
        }
        return missingRequired(subFormFields, answers).length === 0;
      }
      default:
        return true;
    }
  };

  const goto = (s: number) => {
    setStep(s);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const next = async () => {
    if (step === 1) void ensureServer();
    goto(Math.min(STEP_COUNT, step + 1));
  };

  const submit = async () => {
    setSubmitState("sending");
    setSubmitProblem(null);
    const ref = await ensureServer();
    if (!ref) {
      setSubmitState("error");
      setSubmitProblem(
        "We couldn't reach the server. Check your connection and try again — your answers are saved on this device.",
      );
      return;
    }
    try {
      const res = await fetch(
        `/api/intake/submissions/${ref.id}/submit?t=${encodeURIComponent(ref.token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.gfId) {
          setGfId(data.gfId);
          return;
        }
        setSubmitState("error");
        // Say what actually happened. The generic line used to swallow every
        // non-missing rejection, so a client could retry forever with no idea
        // what to change.
        setSubmitProblem(
          data.missing?.length
            ? "A required answer is missing — use the Edit links above to fill it in."
            : res.status === 404
              ? "We couldn't find this intake. Please reopen the link from your email."
              : res.status >= 500
                ? "Something broke on our side — your answers are saved. Please try again in a moment."
                : typeof data.error === "string" && data.error !== "Validation failed"
                  ? data.error
                  : "That didn't go through. Please try again.",
        );
        return;
      }
      setGfId(data.gfId);
      try {
        window.localStorage.removeItem(DRAFT_KEY);
        window.localStorage.removeItem(REF_KEY);
      } catch {
        /* ignore */
      }
    } catch {
      setSubmitState("error");
      setSubmitProblem("That didn't go through. Please try again.");
    }
  };

  // ---- render --------------------------------------------------------------
  if (loading) {
    return (
      <div className="hairline-card p-6 sm:p-8">
        <p className="text-ink2">Loading your intake…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="hairline-card p-6 sm:p-8">
        <p className="font-bold">This link didn&apos;t work.</p>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink2">
          It may have expired or been mistyped. Ask your Gemfield contact to send a fresh
          link, or email{" "}
          <a className="font-semibold underline" href={`mailto:${SITE.email}`}>
            {SITE.email}
          </a>
          .
        </p>
      </div>
    );
  }

  if (gfId) {
    const assets = answers["D-722"] as string | undefined;
    const wantsUpload = assets && assets !== "Neither yet";
    return (
      <div className="hairline-card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tint">
            <Check size={18} className="text-emerald" />
          </span>
          <p className="eyebrow !mb-0">Submitted</p>
        </div>
        <h2 className="font-display mt-5 text-[1.7rem]">
          Done — that&apos;s everything we need to start.
        </h2>
        <p className="mono-num mt-3 inline-block rounded-lg bg-tint px-3 py-1.5 text-[0.95rem] font-semibold text-emerald-deep">
          Reference: {gfId}
        </p>
        <div className="mt-6 space-y-3 text-[0.95rem] leading-relaxed text-ink2">
          <p>
            <strong className="text-ink">What happens next:</strong> our research team
            studies your market, then we design and build from your answers. You&apos;ll get a
            live preview to refine — nothing goes live without your sign-off.
          </p>
          <p>
            A copy of your answers is on its way to <strong>{contact.email}</strong> for
            your records.
          </p>
          {wantsUpload && (
            <p>
              <strong className="text-ink">Your logo &amp; photos:</strong> reply to that
              email with your files attached — no rush, we&apos;ll start research meanwhile.
            </p>
          )}
        </div>
      </div>
    );
  }

  const stepTitles = ["The basics", "How leads reach you", "Look & feel", "Your trade", "Review"];

  return (
    <div ref={topRef} className="hairline-card scroll-mt-28 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow !mb-0">
          {stepTitles[step - 1]} — step {step} of {STEP_COUNT}
        </p>
        <span className="mono-num rounded-full bg-tint px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-emerald-deep">
          {badge}
        </span>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-7 rounded-full ${i < step ? "bg-emerald" : "bg-hairline"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="iw-name">Your name *</label>
              <input
                id="iw-name"
                value={contact.name}
                onChange={(e) => setContactField("name", e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="field">
              <label htmlFor="iw-email">Email *</label>
              <input
                id="iw-email"
                type="email"
                value={contact.email}
                onChange={(e) => setContactField("email", e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="iw-phone">Phone (optional)</label>
            <input
              id="iw-phone"
              type="tel"
              value={contact.phone}
              onChange={(e) => setContactField("phone", e.target.value)}
              autoComplete="tel"
            />
          </div>
          {/* Honeypot — visually hidden, tab-skipped; bots fill it, humans never see it. */}
          <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
            <label htmlFor="iw-website-url">Website URL</label>
            <input
              id="iw-website-url"
              tabIndex={-1}
              autoComplete="off"
              onChange={(e) => (honeypot.current = e.target.value)}
            />
          </div>
          {screen1Fields.map((f) => (
            <FieldInput
              key={f.id}
              field={f}
              value={answers[f.id]}
              onChange={(v) => setAnswer(f.id, v)}
            />
          ))}
          <p className="text-[0.8rem] leading-relaxed text-ink2">
            We use these answers only to build your website. No spam, and you can request
            deletion any time at {SITE.email}.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 grid gap-6">
          {screen2Fields.map((f) => (
            <FieldInput
              key={f.id}
              field={f}
              value={answers[f.id]}
              onChange={(v) => setAnswer(f.id, v)}
            />
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="mt-6 grid gap-6">
          {screen3Fields.map((f) => (
            <FieldInput
              key={f.id}
              field={f}
              value={answers[f.id]}
              onChange={(v) => setAnswer(f.id, v)}
            />
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="mt-6 grid gap-6">
          {preselect?.niche ? (
            <p className="text-[0.95rem] text-ink2">
              Your industry is on file:{" "}
              <strong className="text-ink">{nicheLabel(preselect.niche)}</strong>. Just a
              few specifics:
            </p>
          ) : (
            <>
              <FieldInput
                field={{
                  id: NICHE_SELECTOR.id,
                  label: NICHE_SELECTOR.label,
                  hint: "",
                  type: "choice",
                  options: NICHE_SELECTOR.options,
                  required: true,
                }}
                value={n001}
                onChange={(v) => setAnswer(NICHE_SELECTOR.id, v)}
              />
              {n001 === "Home Services" && (
                <FieldInput
                  field={{
                    id: TRADE_SELECTOR.id,
                    label: TRADE_SELECTOR.label,
                    hint: "",
                    type: "choice",
                    options: TRADE_SELECTOR.options,
                    required: true,
                  }}
                  value={n002}
                  onChange={(v) => setAnswer(TRADE_SELECTOR.id, v)}
                />
              )}
            </>
          )}
          {subFormFields.map((f) => (
            <FieldInput
              key={f.id}
              field={f}
              value={answers[f.id]}
              onChange={(v) => setAnswer(f.id, v)}
            />
          ))}
          {n001 === "Other / General" && !preselect?.niche && (
            <p className="text-[0.9rem] leading-relaxed text-ink2">
              No extra questions for you — your answers so far cover it.
            </p>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="mt-6">
          <p className="text-[0.95rem] leading-relaxed text-ink2">
            A 20-second check — everything look right?
          </p>
          <dl className="mt-5 divide-y divide-hairline border-y border-hairline">
            <ReviewRow label="Contact" value={`${contact.name} · ${contact.email}${contact.phone ? ` · ${contact.phone}` : ""}`} onEdit={() => goto(1)} />
            {[...screen1Fields, ...screen2Fields, ...screen3Fields].map((f) => (
              <ReviewRow
                key={f.id}
                label={f.label}
                value={fmtValue(answers[f.id])}
                onEdit={() => goto(f.id === "D-101" || SCREEN_1.includes(f.id) ? 1 : SCREEN_2.includes(f.id) ? 2 : 3)}
              />
            ))}
            <ReviewRow
              label="Industry"
              value={
                preselect?.niche
                  ? nicheLabel(preselect.niche)
                  : [n001, n002].filter(Boolean).join(" · ") || "—"
              }
              onEdit={() => goto(4)}
            />
            {subFormFields.map((f) => (
              <ReviewRow
                key={f.id}
                label={f.label}
                value={fmtValue(answers[f.id])}
                onEdit={() => goto(4)}
              />
            ))}
          </dl>
        </div>
      )}

      <div className="mt-7 flex items-center justify-between gap-4">
        {step > 1 ? (
          <button type="button" className="btn btn-ghost" onClick={() => goto(step - 1)}>
            Back
          </button>
        ) : (
          <span className="mono-num text-[0.78rem] text-ink2">About 2 minutes. We timed it.</span>
        )}
        {step < STEP_COUNT ? (
          <button
            type="button"
            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!stepOk(step)}
            onClick={next}
          >
            Continue
            <ArrowRight size={15} />
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            disabled={submitState === "sending"}
            onClick={submit}
          >
            {submitState === "sending" ? "Submitting…" : "Submit my intake"}
            {submitState !== "sending" && <ArrowRight size={15} />}
          </button>
        )}
      </div>

      {submitProblem && (
        <p className="mt-4 text-[0.9rem] text-[#9c3325]">{submitProblem}</p>
      )}
    </div>
  );
}

function fmtValue(v: AnswerValue | undefined): string {
  if (v === undefined) return "—";
  if (Array.isArray(v)) return v.length ? v.join(" · ") : "—";
  return v.trim() === "" ? "—" : v;
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <dt className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ink2">
          {label}
        </dt>
        <dd className="mt-0.5 break-words text-[0.95rem]">{value}</dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-[0.85rem] font-semibold text-emerald hover:underline"
      >
        Edit
      </button>
    </div>
  );
}
