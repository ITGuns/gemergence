/**
 * Deskii placeholder previews (real seeded screenshots pending).
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

const navItems = ["Tonight", "Menu", "Bookings", "Table plan", "Reviews", "Reports"];

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
              <p className="text-[10px] font-semibold">Summit Taphouse</p>
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
              <p className="text-[12px] font-semibold">Tonight</p>
              <p className="text-[9.5px] text-band-mut">Covers booked, the menu, and what came in while you were on the floor</p>
            </div>
            <span className="mono-num rounded-full border border-band-line px-2.5 py-1 text-[9px] text-band-mut">
              Sample data
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {[
              { k: "Covers tonight", v: "84", d: "↑ 12% vs last Friday" },
              { k: "Missed calls texted back", v: "19", d: "Avg reply 48s" },
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
              { t: "7:00 · Okafor, party of 4 · window", s: "Seated", on: true },
              { t: "7:30 · Whitfield, party of 2 · bar", s: "Confirmed", on: false },
              { t: "8:15 · Nakamura, party of 6 · back room", s: "Confirmed", on: false },
              { t: "Halibut — marked sold out at 7:12", s: "Menu", on: false },
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
    case "Menu":
      return (
        <div className={frame} aria-hidden="true">
          {[
            { t: "Halibut, brown butter", p: "34", out: true },
            { t: "Duck confit", p: "29", out: false },
            { t: "Burrata, heirloom", p: "17", out: false },
          ].map((row, i) => (
            <div key={row.t} className={`flex items-center gap-2 ${i > 0 ? "mt-2" : ""}`}>
              <span className={`flex-1 truncate text-[10px] ${row.out ? "text-band-mut line-through" : ""}`}>
                {row.t}
              </span>
              {row.out && (
                <span className="mono-num rounded-full border border-band-line px-1.5 py-0.5 text-[8px] text-band-mut">
                  86
                </span>
              )}
              <span className="mono-num text-[9.5px] text-band-mut">${row.p}</span>
            </div>
          ))}
        </div>
      );
    case "Bookings":
      return (
        <div className={frame} aria-hidden="true">
          {[
            { t: "7:00 · Okafor · 4", s: "Seated", on: true },
            { t: "7:30 · Whitfield · 2", s: "Confirmed", on: false },
            { t: "8:15 · Nakamura · 6", s: "Confirmed", on: false },
          ].map((row, i) => (
            <div key={row.t} className={`flex items-center justify-between gap-2 ${i > 0 ? "mt-2" : ""}`}>
              <span className="truncate text-[10px]">{row.t}</span>
              <span
                className={`mono-num shrink-0 rounded-full px-1.5 py-0.5 text-[8px] ${
                  row.on ? "bg-emerald/20 text-[#7fc8ad]" : "border border-band-line text-band-mut"
                }`}
              >
                {row.s}
              </span>
            </div>
          ))}
        </div>
      );
    case "Table plan":
      return (
        <div className={frame} aria-hidden="true">
          <p className="text-[9px] uppercase tracking-[0.12em] text-band-mut">Front room</p>
          <div className="mt-2 grid grid-cols-6 gap-1.5">
            {[1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 2, 0].map((state, i) => (
              <span
                key={i}
                className={`aspect-square rounded-sm ${
                  state === 1 ? "bg-emerald/70" : state === 2 ? "bg-[#7fc8ad]" : "border border-band-line"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-[8.5px] text-band-mut">Filled · held · open</p>
        </div>
      );
    case "Conversations":
      return (
        <div className={frame} aria-hidden="true">
          <p className="text-[9px] uppercase tracking-[0.12em] text-band-mut">Answered at 6:48</p>
          <p className="mt-1.5 text-[10px] text-band-mut">&ldquo;Do you have anything gluten free?&rdquo;</p>
          <p className="mt-1.5 rounded-md bg-band-line/50 px-2 py-1.5 text-[10px]">
            Yes — six dishes, and the kitchen can adapt four more. Shall I hold you a table?
          </p>
        </div>
      );
    case "Reviews":
      return (
        <div className={frame} aria-hidden="true">
          <div className="flex items-baseline gap-2">
            <p className="mono-num text-[22px] font-semibold leading-none text-white">4.9</p>
            <span className="text-[10px] text-[#7fc8ad]">★★★★★</span>
          </div>
          <p className="mt-1.5 text-[9px] text-band-mut">218 reviews · 6 new this month</p>
          <div className="mt-2.5 rounded-md border border-band-line px-2 py-1 text-[9px] text-band-mut">
            Request sent to 41 guests
          </div>
        </div>
      );
    case "Reports":
      return (
        <div className={frame} aria-hidden="true">
          <p className="text-[9px] uppercase tracking-[0.12em] text-band-mut">Bookings from search</p>
          <p className="mono-num mt-1 text-[22px] font-semibold leading-none text-white">+31%</p>
          <div className="mt-2.5 flex h-8 items-end gap-1">
            {[35, 48, 42, 60, 55, 74, 88].map((h, i) => (
              <span key={i} className="w-full rounded-sm bg-emerald/60" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

/** Before/after demonstration panels. */
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

/**
 * A Gemfield-built restaurant site, drawn rather than screenshotted — the
 * exhibit JPGs predate the restaurant swap and showed a home-services build.
 * Same honest "sample" framing as the Deskii mocks: swap for a real seeded
 * screenshot once one is captured.
 */
export function RestaurantSiteFrame() {
  return (
    <figure className="overflow-hidden rounded-xl border border-hairline bg-paper shadow-[0_32px_64px_-24px_rgba(21,23,26,0.35)]">
      <div className="flex items-center gap-3 border-b border-hairline bg-surface px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="h-2.5 w-2.5 rounded-full bg-hairline" />
          <i className="h-2.5 w-2.5 rounded-full bg-hairline" />
          <i className="h-2.5 w-2.5 rounded-full bg-hairline" />
        </span>
        <span className="mono-num rounded-md bg-white px-3 py-1 text-[10px] tracking-wide text-ink2">
          summittaphouse.com
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-[0.95rem]">Summit Taphouse</p>
          <span className="rounded-md bg-emerald px-2.5 py-1 text-[9px] font-semibold text-white">
            Book a table
          </span>
        </div>

        <p className="font-display mt-4 text-[1.35rem] leading-tight">
          Twenty taps, one kitchen, open till late.
        </p>
        <div className="mono-num mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] tracking-wide text-ink2">
          <span>OPEN TILL 11 TONIGHT</span>
          <span aria-hidden="true">·</span>
          <span>412 MISSION ST</span>
          <span aria-hidden="true">·</span>
          <span>TAP TO CALL</span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-hairline bg-white p-3">
            <p className="text-[9px] uppercase tracking-[0.12em] text-ink2">On tonight</p>
            {[
              { t: "Duck confit", p: "29", out: false },
              { t: "Halibut, brown butter", p: "34", out: true },
              { t: "Burrata, heirloom", p: "17", out: false },
            ].map((row, i) => (
              <div key={row.t} className={`flex items-center gap-2 ${i === 0 ? "mt-2" : "mt-1.5"}`}>
                <span className={`flex-1 truncate text-[10px] ${row.out ? "text-ink2 line-through" : ""}`}>
                  {row.t}
                </span>
                {row.out && (
                  <span className="mono-num rounded-full border border-hairline px-1.5 text-[8px] text-ink2">
                    86
                  </span>
                )}
                <span className="mono-num text-[9.5px] text-ink2">${row.p}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-hairline bg-white p-3">
            <p className="text-[9px] uppercase tracking-[0.12em] text-ink2">Pick your table</p>
            <div className="mt-2 grid grid-cols-6 gap-1.5">
              {[1, 1, 0, 1, 0, 0, 0, 1, 2, 0, 0, 0].map((state, i) => (
                <span
                  key={i}
                  className={`aspect-square rounded-sm ${
                    state === 1 ? "bg-ink/15" : state === 2 ? "bg-emerald" : "border border-hairline"
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-[8.5px] text-ink2">Taken · yours · free</p>
          </div>
        </div>
      </div>
    </figure>
  );
}
