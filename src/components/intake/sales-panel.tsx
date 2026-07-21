"use client";

// Sales control panel (integration spec §2, Path B): create a submission with
// the sold tier, copy the magic link to send, track status, pull exports.
// Auth: staff key + rep name, held in sessionStorage, sent as headers on every
// call. Email/SMS sending is a cutover item (Resend/Twilio) — until then the
// rep copies the link into their own email or text thread.

import { useCallback, useEffect, useState } from "react";
import { ArrowRight } from "@/components/icons";
import { NICHE_SELECTOR, niches, TRADE_SELECTOR } from "@/lib/intake/schema";
import { PLAN_TIERS } from "@/lib/intake/types";

const KEY_STORE = "gemfield:panel-auth";

type Row = {
  id: string;
  gfId: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  tierLabel: string;
  status: string;
  source: string;
  salesRepId?: string;
  niche: string | null;
  createdAt: string;
  submittedAt: string | null;
  resumePath: string;
};

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-tint text-emerald-deep",
  in_progress: "bg-[#fdf3e0] text-[#8a5a12]",
  opened: "bg-[#fdf3e0] text-[#8a5a12]",
  created: "bg-surface text-ink2",
  sent: "bg-surface text-ink2",
  expired: "bg-[#f8e5e2] text-[#9c3325]",
};

export function SalesPanel() {
  const [auth, setAuth] = useState<{ key: string; rep: string } | null>(null);
  const [mountedAt] = useState(() => Date.now());
  const [keyInput, setKeyInput] = useState("");
  const [repInput, setRepInput] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [emailState, setEmailState] = useState<Record<string, "sending" | "sent" | "failed">>({});
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    plan: "growth",
    niche: "",
    repNotes: "",
  });

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(KEY_STORE);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time session restore
      if (saved) setAuth(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  const headers = useCallback(
    (a = auth): Record<string, string> => ({
      "Content-Type": "application/json",
      "x-panel-key": a?.key ?? "",
      "x-rep-id": a?.rep ?? "",
    }),
    [auth],
  );

  const load = useCallback(
    async (a = auth) => {
      if (!a) return;
      setError(null);
      const res = await fetch("/api/intake/submissions", { headers: headers(a) });
      if (res.status === 401) {
        setAuth(null);
        setError("That key was rejected.");
        try {
          window.sessionStorage.removeItem(KEY_STORE);
        } catch {
          /* ignore */
        }
        return;
      }
      const data = await res.json();
      setRows(data.submissions ?? []);
    },
    [auth, headers],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-then-set on auth change
    if (auth) void load(auth);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load on auth change only
  }, [auth]);

  const signIn = () => {
    const a = { key: keyInput.trim(), rep: repInput.trim() || "unknown-rep" };
    setAuth(a);
    try {
      window.sessionStorage.setItem(KEY_STORE, JSON.stringify(a));
    } catch {
      /* ignore */
    }
  };

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const nichePick = niches().find((n) => n.key === form.niche);
      const res = await fetch("/api/intake/submissions", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          businessName: form.businessName,
          contactName: form.contactName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          plan: form.plan,
          repNotes: form.repNotes,
          nichePreselect: nichePick ? { niche: nichePick.key } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Create failed");
        return;
      }
      setForm({
        businessName: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        plan: "growth",
        niche: "",
        repNotes: "",
      });
      await copyLink(data.resumePath, data.gfId);
      await load();
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (path: string, gfId: string) => {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(gfId);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      window.prompt("Copy the intake link:", url);
    }
  };

  const emailLink = async (row: Row) => {
    setEmailState((s) => ({ ...s, [row.id]: "sending" }));
    try {
      const res = await fetch(`/api/intake/submissions/${row.id}/send`, {
        method: "POST",
        headers: headers(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEmailState((s) => ({ ...s, [row.id]: "failed" }));
        setError(data.error ?? "Email failed to send");
        return;
      }
      setEmailState((s) => ({ ...s, [row.id]: "sent" }));
      await load();
    } catch {
      setEmailState((s) => ({ ...s, [row.id]: "failed" }));
      setError("Email failed to send");
    }
  };

  const download = async (row: Row) => {
    const res = await fetch(`/api/intake/submissions/${row.id}/export`, {
      headers: headers(),
    });
    if (!res.ok) {
      setError("Export failed");
      return;
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${row.gfId}_intake.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!auth) {
    return (
      <div className="hairline-card mx-auto max-w-md p-6 sm:p-8">
        <p className="eyebrow">Gemfield staff</p>
        <h1 className="font-display mt-3 text-[1.6rem]">Sales panel</h1>
        <div className="mt-6 grid gap-4">
          <div className="field">
            <label htmlFor="sp-rep">Your name</label>
            <input
              id="sp-rep"
              value={repInput}
              onChange={(e) => setRepInput(e.target.value)}
              placeholder="Shown on the audit trail"
            />
          </div>
          <div className="field">
            <label htmlFor="sp-key">Panel key</label>
            <input
              id="sp-key"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && signIn()}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary justify-center disabled:opacity-40"
            disabled={!keyInput.trim()}
            onClick={signIn}
          >
            Open panel
            <ArrowRight size={15} />
          </button>
          {error && <p className="text-[0.9rem] text-[#9c3325]">{error}</p>}
        </div>
      </div>
    );
  }

  // Captured once per mount — Refresh re-renders the list, which is enough
  // precision for a >48h staleness chip.
  const stalled = (r: Row) =>
    r.status !== "submitted" &&
    mountedAt - new Date(r.createdAt).getTime() > 48 * 3600 * 1000;

  return (
    <div className="grid gap-8">
      <div className="hairline-card p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-[1.5rem]">New intake</h1>
          <p className="text-[0.85rem] text-ink2">
            Signed in as <strong className="text-ink">{auth.rep}</strong>
          </p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="sp-biz">Business name</label>
            <input
              id="sp-biz"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="sp-contact">Contact name *</label>
            <input
              id="sp-contact"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="sp-email">Email *</label>
            <input
              id="sp-email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="sp-phone">Phone</label>
            <input
              id="sp-phone"
              type="tel"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="sp-plan">Tier sold *</label>
            <select
              id="sp-plan"
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
            >
              {Object.entries(PLAN_TIERS).map(([slug, p]) => (
                <option key={slug} value={slug}>
                  Tier {p.tier} — {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sp-niche">Niche (optional — skips the picker)</label>
            <select
              id="sp-niche"
              value={form.niche}
              onChange={(e) => setForm({ ...form, niche: e.target.value })}
            >
              <option value="">Client picks ({NICHE_SELECTOR.id}/{TRADE_SELECTOR.id})</option>
              {niches().map((n) => (
                <option key={n.key} value={n.key}>
                  {n.group === "home_services" ? `Home Services · ${n.label}` : n.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field mt-4">
          <label htmlFor="sp-notes">Rep notes (internal — exported to the build team)</label>
          <textarea
            id="sp-notes"
            rows={2}
            value={form.repNotes}
            onChange={(e) => setForm({ ...form, repNotes: e.target.value })}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={
            creating || !form.contactName.trim() || !/.+@.+\..+/.test(form.contactEmail)
          }
          onClick={create}
        >
          {creating ? "Creating…" : "Create & copy link"}
          {!creating && <ArrowRight size={15} />}
        </button>
        {error && <p className="mt-3 text-[0.9rem] text-[#9c3325]">{error}</p>}
      </div>

      <div className="hairline-card overflow-x-auto p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-[1.3rem]">Submissions</h2>
          <button type="button" className="btn btn-ghost !py-2 text-[0.85rem]" onClick={() => load()}>
            Refresh
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="mt-4 text-[0.95rem] text-ink2">Nothing yet.</p>
        ) : (
          <table className="mt-4 w-full min-w-[720px] text-left text-[0.9rem]">
            <thead>
              <tr className="border-b border-hairline font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ink2">
                <th className="py-2 pr-4">GF-ID</th>
                <th className="py-2 pr-4">Business</th>
                <th className="py-2 pr-4">Tier</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-hairline align-top">
                  <td className="mono-num py-3 pr-4 font-semibold">{r.gfId}</td>
                  <td className="py-3 pr-4">
                    {r.businessName || "—"}
                    <span className="block text-[0.8rem] text-ink2">
                      {r.contactName} · {r.contactEmail}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{r.tierLabel}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${
                        STATUS_STYLES[r.status] ?? "bg-surface text-ink2"
                      }`}
                    >
                      {r.status}
                    </span>
                    {stalled(r) && (
                      <span className="mt-1 block text-[0.72rem] font-semibold text-[#9c3325]">
                        stalled &gt;48h — nudge
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {r.source === "sales_panel" ? (r.salesRepId ?? "panel") : "self"}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {r.status !== "submitted" && (
                        <>
                          <button
                            type="button"
                            className="font-semibold text-emerald hover:underline disabled:opacity-50"
                            disabled={emailState[r.id] === "sending"}
                            onClick={() => emailLink(r)}
                          >
                            {emailState[r.id] === "sending"
                              ? "Sending…"
                              : emailState[r.id] === "sent"
                                ? "Email sent ✓"
                                : "Email link"}
                          </button>
                          <button
                            type="button"
                            className="font-semibold text-emerald hover:underline"
                            onClick={() => copyLink(r.resumePath, r.gfId)}
                          >
                            {copied === r.gfId ? "Copied!" : "Copy link"}
                          </button>
                        </>
                      )}
                      {r.status === "submitted" && (
                        <button
                          type="button"
                          className="font-semibold text-emerald hover:underline"
                          onClick={() => download(r)}
                        >
                          Export .md
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
