"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "./icons";
import { DRAFT_KEY, INTAKE_KEY, SITE, type Intake } from "@/lib/constants";
import { GOALS, INDUSTRY_OPTIONS } from "@/lib/content";

const EMPTY: Intake = {
  name: "",
  biz: "",
  email: "",
  url: "",
  phone: "",
  industry: "",
  goals: [],
  notes: "",
};

async function post(payload: Record<string, string>) {
  const body = new FormData();
  Object.entries(payload).forEach(([k, v]) => body.append(k, v));
  const res = await fetch(SITE.formEndpoint, {
    method: "POST",
    headers: { Accept: "application/json" },
    body,
  });
  if (!res.ok) throw new Error(`Form route failed: ${res.status}`);
}

export function AuditForm({ id }: { id?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Intake>(EMPTY);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const partialSent = useRef(false);

  // Restore a saved draft (progressive capture, SITE-PLAN §2). Must run in an
  // effect — reading localStorage during render would break SSR hydration.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only draft hydration
      if (saved) setForm({ ...EMPTY, ...JSON.parse(saved) });
    } catch {
      /* private mode — continue without draft */
    }
  }, []);

  const set = (k: keyof Intake, v: string | string[]) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const toggleGoal = (g: string) =>
    set("goals", form.goals.includes(g) ? form.goals.filter((x) => x !== g) : [...form.goals, g]);

  const emailOk = /.+@.+\..+/.test(form.email);
  const step1Ok = form.name.trim() && form.biz.trim() && emailOk;
  const step2Ok = form.industry !== "";

  const next = () => {
    if (step === 1 && step1Ok && !partialSent.current) {
      partialSent.current = true;
      // Fire-and-forget partial lead so abandoners aren't lost.
      post({
        _subject: "Partial audit request (step 1 of 3)",
        name: form.name,
        business: form.biz,
        email: form.email,
        website: form.url,
        stage: "step_1_complete",
        page: window.location.href,
      }).catch(() => {
        partialSent.current = false;
      });
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const submit = async () => {
    setStatus("sending");
    try {
      await post({
        _subject: "New Free Growth Audit request",
        name: form.name,
        business: form.biz,
        email: form.email,
        website: form.url,
        phone: form.phone,
        industry: form.industry,
        goals: form.goals.join(", "),
        notes: form.notes,
        stage: "complete",
        page: window.location.href,
      });
      // Confirmation to the prospect. Fire-and-forget with keepalive so it
      // survives the redirect below, and deliberately not awaited: the audit
      // has already reached the team, so a mail failure must never surface as
      // a failed submission. Failures are logged server-side.
      void fetch("/api/audit/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          name: form.name,
          business: form.biz,
          email: form.email,
          website_url: "",
        }),
      }).catch(() => {
        /* prospect still reaches /schedule; team already notified */
      });

      try {
        window.localStorage.setItem(INTAKE_KEY, JSON.stringify(form));
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      router.push("/schedule");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div id={id} className="hairline-card p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow">Free Growth Audit — step {step} of 3</p>
        <div className="flex gap-1.5" aria-hidden="true">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`h-1.5 w-7 rounded-full ${s <= step ? "bg-emerald" : "bg-hairline"}`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="mt-6 grid gap-4">
          <div className="field">
            <label htmlFor="af-name">Your name *</label>
            <input
              id="af-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jordan Avery"
              autoComplete="name"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="af-biz">Business name *</label>
              <input
                id="af-biz"
                value={form.biz}
                onChange={(e) => set("biz", e.target.value)}
                placeholder="Summit Home Services"
                autoComplete="organization"
              />
            </div>
            <div className="field">
              <label htmlFor="af-email">Email *</label>
              <input
                id="af-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@business.com"
                autoComplete="email"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="af-url">Website (if you have one)</label>
            <input
              id="af-url"
              type="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://yourbusiness.com"
              autoComplete="url"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="af-phone">Phone</label>
              <input
                id="af-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(555) 555-0100"
                autoComplete="tel"
              />
            </div>
            <div className="field">
              <label htmlFor="af-industry">Industry *</label>
              <select
                id="af-industry"
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
              >
                <option value="">Select your industry…</option>
                {INDUSTRY_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6 grid gap-5">
          <fieldset>
            <legend className="field !mb-0">
              <span className="block font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink2">
                What do you want more of? *
              </span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {GOALS.map((g) => {
                const on = form.goals.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGoal(g)}
                    aria-pressed={on}
                    className={`rounded-full border px-3.5 py-1.5 text-[0.88rem] font-medium transition-colors ${
                      on
                        ? "border-emerald bg-tint text-emerald-deep"
                        : "border-hairline text-ink2 hover:border-ink2"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="field">
            <label htmlFor="af-notes">Anything else we should know?</label>
            <textarea
              id="af-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Team size, busy season, what you've tried before…"
            />
          </div>
        </div>
      )}

      <div className="mt-7 flex items-center justify-between gap-4">
        {step > 1 ? (
          <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        ) : (
          <span className="mono-num text-[0.78rem] text-ink2">About 90 seconds. We timed it.</span>
        )}
        {step < 3 ? (
          <button
            type="button"
            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            disabled={step === 1 ? !step1Ok : !step2Ok}
            onClick={next}
          >
            Continue my audit
            <ArrowRight size={15} />
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            disabled={form.goals.length === 0 || status === "sending"}
            onClick={submit}
          >
            {status === "sending" ? "Sending…" : "Request my audit"}
            {status !== "sending" && <ArrowRight size={15} />}
          </button>
        )}
      </div>

      {status === "error" && (
        <p className="mt-4 text-[0.9rem] text-[#9c3325]">
          That didn&apos;t go through. Please try again, or email us directly at{" "}
          <a className="font-semibold underline" href={`mailto:${SITE.email}`}>
            {SITE.email}
          </a>
          .
        </p>
      )}

      <p className="mt-5 border-t border-hairline pt-4 text-[0.8rem] leading-relaxed text-ink2">
        By submitting, you agree we may contact you about your audit by email or phone. No spam, no
        contracts, no pressure — and the audit is useful whether you hire us or not.
      </p>
    </div>
  );
}
