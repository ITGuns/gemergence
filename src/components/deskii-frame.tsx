/**
 * Deskii placeholder previews (SITE-PLAN §11: real seeded screenshots pending).
 * Hand-drawn UI mocks in the product's dark idiom — straight-on, minimal
 * browser chrome, honest "sample workspace" labeling. Swap for production
 * screenshots when captured.
 */

function Chrome({ children }: { children: React.ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-hairline bg-band shadow-[0_24px_60px_-32px_rgba(21,23,26,0.45)]">
      <div className="flex items-center gap-3 border-b border-band-line bg-[#0c120e] px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="h-2.5 w-2.5 rounded-full bg-[#2e3a31]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#2e3a31]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#2e3a31]" />
        </span>
        <span className="mono-num rounded-md bg-band-line/60 px-3 py-1 text-[10px] tracking-wide text-band-mut">
          app.deskii.com
        </span>
      </div>
      {children}
    </figure>
  );
}

const navItems = ["Dashboard", "Tasks", "Approvals", "Reports", "Roadmap", "Messages"];

export function DeskiiDashboard() {
  return (
    <Chrome>
      <div className="flex text-band-ink">
        {/* sidebar */}
        <div className="hidden w-[152px] shrink-0 border-r border-band-line p-3.5 sm:block">
          <div className="flex items-center gap-2 px-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald text-[9px] font-bold text-white">
              D
            </span>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold">Summit Home Services</p>
              <p className="text-[8.5px] text-band-mut">Client workspace</p>
            </div>
          </div>
          <ul className="mt-4 space-y-1">
            {navItems.map((item, i) => (
              <li
                key={item}
                className={`rounded-md px-2 py-1.5 text-[10.5px] font-medium ${
                  i === 0 ? "bg-band-line/70 text-white" : "text-band-mut"
                }`}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* main */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold">This month&apos;s growth work</p>
              <p className="text-[9.5px] text-band-mut">Everything shipped, in progress, and queued</p>
            </div>
            <span className="mono-num rounded-full border border-band-line px-2.5 py-1 text-[9px] text-band-mut">
              Sample data
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {[
              { k: "New leads", v: "28", d: "↑ 12% vs last month" },
              { k: "Missed calls recovered", v: "19", d: "Avg reply 48s" },
              { k: "New reviews", v: "6", d: "4.9 average" },
            ].map((s) => (
              <div key={s.k} className="rounded-lg border border-band-line bg-[#141d17] p-3">
                <p className="text-[8.5px] uppercase tracking-[0.12em] text-band-mut">{s.k}</p>
                <p className="mono-num mt-1 text-[20px] font-semibold leading-none text-white">{s.v}</p>
                <p className="mt-1.5 text-[8.5px] text-band-mut">{s.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-band-line">
            {[
              { t: "Service pages — final QA", s: "Shipped", on: true },
              { t: "Review request automation", s: "In progress", on: false },
              { t: "Google Business Profile refresh", s: "Approval waiting", on: false },
              { t: "Spring offer landing page", s: "Queued", on: false },
            ].map((row, i) => (
              <div
                key={row.t}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 ${
                  i > 0 ? "border-t border-band-line" : ""
                }`}
              >
                <p className="truncate text-[10.5px] font-medium">{row.t}</p>
                <span
                  className={`mono-num shrink-0 rounded-full px-2 py-0.5 text-[8.5px] ${
                    row.on
                      ? "bg-emerald/20 text-[#7fc8ad]"
                      : "border border-band-line text-band-mut"
                  }`}
                >
                  {row.s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Chrome>
  );
}

/** Small UI fragments for the Deskii feature bento. */
export function DeskiiCrop({ kind }: { kind: string }) {
  const frame = "mt-5 rounded-lg border border-band-line bg-[#141d17] p-3 text-band-ink";
  switch (kind) {
    case "Projects":
      return (
        <div className={frame} aria-hidden="true">
          <div className="flex justify-between text-[9.5px]">
            <span className="font-medium">Website build</span>
            <span className="mono-num text-band-mut">72%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-band-line">
            <div className="h-full w-[72%] rounded-full bg-emerald" />
          </div>
          <div className="mt-2.5 flex justify-between text-[9.5px]">
            <span className="font-medium">Local SEO foundation</span>
            <span className="mono-num text-band-mut">41%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-band-line">
            <div className="h-full w-[41%] rounded-full bg-emerald/70" />
          </div>
        </div>
      );
    case "Tasks":
      return (
        <div className={frame} aria-hidden="true">
          {[
            { t: "Publish service pages", done: true },
            { t: "Wire booking form to CRM", done: true },
            { t: "Launch review requests", done: false },
          ].map((task, i) => (
            <div key={task.t} className={`flex items-center gap-2 ${i > 0 ? "mt-2" : ""}`}>
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded ${
                  task.done ? "bg-emerald text-[8px] text-white" : "border border-band-line"
                }`}
              >
                {task.done ? "✓" : ""}
              </span>
              <span className={`text-[10px] ${task.done ? "text-band-mut line-through" : ""}`}>
                {task.t}
              </span>
            </div>
          ))}
        </div>
      );
    case "Approvals":
      return (
        <div className={frame} aria-hidden="true">
          <p className="text-[9px] uppercase tracking-[0.12em] text-band-mut">Awaiting your approval</p>
          <p className="mt-1.5 text-[10.5px] font-medium">Homepage hero copy — v2</p>
          <div className="mt-2.5 flex gap-2">
            <span className="rounded-md bg-emerald px-2.5 py-1 text-[9px] font-semibold text-white">
              Approve
            </span>
            <span className="rounded-md border border-band-line px-2.5 py-1 text-[9px] text-band-mut">
              Request changes
            </span>
          </div>
        </div>
      );
    case "Reports":
      return (
        <div className={frame} aria-hidden="true">
          <p className="text-[9px] uppercase tracking-[0.12em] text-band-mut">Calls from search</p>
          <p className="mono-num mt-1 text-[22px] font-semibold leading-none text-white">+31%</p>
          <div className="mt-2.5 flex h-8 items-end gap-1">
            {[35, 48, 42, 60, 55, 74, 88].map((h, i) => (
              <span key={i} className="w-full rounded-sm bg-emerald/60" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      );
    case "Roadmap":
      return (
        <div className={frame} aria-hidden="true">
          {[
            { t: "Launch", when: "Week 4", done: true },
            { t: "Review engine", when: "Week 6", done: false },
            { t: "Nurture workflows", when: "Week 9", done: false },
          ].map((m, i) => (
            <div key={m.t} className={`flex items-center gap-2.5 ${i > 0 ? "mt-2" : ""}`}>
              <span className={`h-2 w-2 rounded-full ${m.done ? "bg-emerald" : "border border-band-mut"}`} />
              <span className="flex-1 text-[10px] font-medium">{m.t}</span>
              <span className="mono-num text-[9px] text-band-mut">{m.when}</span>
            </div>
          ))}
        </div>
      );
    default:
      return (
        <div className={frame} aria-hidden="true">
          <div className="max-w-[85%] rounded-lg rounded-bl-sm bg-band-line/70 px-2.5 py-1.5 text-[9.5px]">
            New landing page is live — review when you have a sec.
          </div>
          <div className="ml-auto mt-2 max-w-[85%] rounded-lg rounded-br-sm bg-emerald/25 px-2.5 py-1.5 text-[9.5px]">
            Looks great — approved in one click.
          </div>
        </div>
      );
  }
}

/** Before/after demonstration panels (SITE-PLAN §4 S10). */
export function BeforeAfter({
  before,
  after,
  note,
}: {
  before: { label: string; items: string[] };
  after: { label: string; items: string[] };
  note: string;
}) {
  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-surface p-6">
          <p className="eyebrow !text-ink2">{before.label}</p>
          <div className="mt-4 rounded-lg border border-hairline bg-white p-4" aria-hidden="true">
            <div className="h-2.5 w-1/3 rounded bg-hairline" />
            <div className="mt-4 h-7 w-4/5 rounded bg-hairline" />
            <div className="mt-2 h-2.5 w-3/5 rounded bg-hairline" />
            <div className="mt-2 h-2.5 w-2/4 rounded bg-hairline" />
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="h-10 rounded bg-surface" />
              <div className="h-10 rounded bg-surface" />
              <div className="h-10 rounded bg-surface" />
            </div>
          </div>
          <ul className="mt-4 space-y-1.5 text-[0.92rem] text-ink2">
            {before.items.map((i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden="true">–</span>
                {i}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-emerald/25 bg-tint p-6">
          <p className="eyebrow">{after.label}</p>
          <div className="mt-4 rounded-lg border border-hairline bg-white p-4" aria-hidden="true">
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-1/4 rounded bg-ink/15" />
              <div className="h-6 w-1/4 rounded bg-emerald" />
            </div>
            <div className="mt-4 h-7 w-4/5 rounded bg-ink/80" />
            <div className="mt-2 h-2.5 w-3/5 rounded bg-ink/15" />
            <div className="mt-4 flex gap-2">
              <div className="h-8 w-1/3 rounded bg-emerald" />
              <div className="h-8 w-1/4 rounded border border-hairline" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="h-9 rounded bg-tint" />
              <div className="h-9 rounded bg-tint" />
              <div className="h-9 rounded bg-tint" />
            </div>
          </div>
          <ul className="mt-4 space-y-1.5 text-[0.92rem] text-ink">
            {after.items.map((i) => (
              <li key={i} className="flex gap-2 font-medium">
                <span className="text-emerald" aria-hidden="true">
                  +
                </span>
                {i}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mono-num mt-3 text-[0.78rem] text-ink2">{note}</p>
    </div>
  );
}
