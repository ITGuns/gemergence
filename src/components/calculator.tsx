"use client";

import { useState } from "react";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const PLANS = [
  { name: "Foundation", cost: 497 },
  { name: "Growth", cost: 997 },
  { name: "Scale", cost: 1497 },
];

/** Revenue opportunity calculator (SITE-PLAN §5 — from the founder's SOP §8.3). */
export function RevenueCalculator() {
  const [value, setValue] = useState(450);
  const [clients, setClients] = useState(5);

  const monthly = value * clients;
  const yearly = monthly * 12;

  return (
    <div className="hairline-card p-6 sm:p-8">
      <p className="eyebrow">Revenue opportunity calculator</p>
      <h3 className="font-display h3 mt-3">What would a few more clients a month be worth?</h3>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="calc-value" className="text-[0.9rem] font-semibold">
              Average value of one client
            </label>
            <span className="mono-num text-[1.05rem] font-semibold text-emerald">{fmt(value)}</span>
          </div>
          <input
            id="calc-value"
            type="range"
            min={100}
            max={5000}
            step={50}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="mt-3 w-full accent-[#0e5c45]"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="calc-clients" className="text-[0.9rem] font-semibold">
              Extra clients per month
            </label>
            <span className="mono-num text-[1.05rem] font-semibold text-emerald">{clients}</span>
          </div>
          <input
            id="calc-clients"
            type="range"
            min={1}
            max={30}
            value={clients}
            onChange={(e) => setClients(Number(e.target.value))}
            className="mt-3 w-full accent-[#0e5c45]"
          />
        </div>
      </div>

      <div className="mt-7 grid gap-4 border-t border-hairline pt-6 sm:grid-cols-2">
        <div>
          <p className="eyebrow !text-ink2">Added revenue per month</p>
          <p className="mono-num mt-1 text-[2rem] font-semibold leading-none">{fmt(monthly)}</p>
        </div>
        <div>
          <p className="eyebrow !text-ink2">Added revenue per year</p>
          <p className="mono-num mt-1 text-[2rem] font-semibold leading-none">{fmt(yearly)}</p>
        </div>
      </div>

      <ul className="mt-6 space-y-1.5 text-[0.92rem] text-ink2">
        {PLANS.map((p) => {
          const breakEven = Math.max(1, Math.ceil(p.cost / value));
          return (
            <li key={p.name}>
              <span className="font-semibold text-ink">{p.name}</span> pays for itself at{" "}
              <span className="mono-num font-semibold text-emerald">
                {breakEven} extra client{breakEven > 1 ? "s" : ""}
              </span>{" "}
              a month.
            </li>
          );
        })}
      </ul>
    </div>
  );
}
