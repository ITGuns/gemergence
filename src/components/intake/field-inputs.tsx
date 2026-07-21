"use client";

// Schema-driven field renderers for the intake wizard. All question text
// arrives via the field object (from gemfield_intake_schema_v2.json) —
// nothing is hardcoded here (Rule 1 / the grep gate).

import type { AnswerValue, IntakeField } from "@/lib/intake/types";

type Props = {
  field: IntakeField;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
};

export function Pill({
  on,
  onClick,
  children,
  dim,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** Selection cap reached — still clickable (no-op), visually muted. */
  dim?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-3.5 py-2 text-[0.9rem] font-medium transition-colors ${
        on
          ? "border-emerald bg-tint text-emerald-deep"
          : "border-hairline text-ink2 hover:border-ink2"
      } ${dim ? "opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

export function FieldInput({ field, value, onChange }: Props) {
  const labelSuffix = field.required ? " *" : "";

  if (field.type === "choice" && field.options) {
    const current = typeof value === "string" ? value : "";
    return (
      <fieldset>
        <legend className="field !mb-0">
          <span className="block font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink2">
            {field.label}
            {labelSuffix}
          </span>
        </legend>
        {field.hint && <p className="mt-1 text-[0.82rem] text-ink2">{field.hint}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {field.options.map((o) => (
            <Pill key={o} on={current === o} onClick={() => onChange(o)}>
              {o}
            </Pill>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "multichoice" && field.options) {
    const current = Array.isArray(value) ? value : [];
    const toggle = (o: string) => {
      if (current.includes(o)) return onChange(current.filter((x) => x !== o));
      if (field.max && current.length >= field.max) return;
      onChange([...current, o]);
    };
    return (
      <fieldset>
        <legend className="field !mb-0">
          <span className="block font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink2">
            {field.label}
            {labelSuffix}
            {field.max ? ` (up to ${field.max})` : ""}
          </span>
        </legend>
        {field.hint && <p className="mt-1 text-[0.82rem] text-ink2">{field.hint}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {field.options.map((o) => {
            const on = current.includes(o);
            const capped = !on && !!field.max && current.length >= field.max;
            return (
              <Pill key={o} on={on} onClick={() => toggle(o)} dim={capped}>
                {o}
              </Pill>
            );
          })}
        </div>
      </fieldset>
    );
  }

  // text
  const current = typeof value === "string" ? value : "";
  const id = `intake-${field.id}`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {field.label}
        {labelSuffix}
      </label>
      <input
        id={id}
        value={current}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.hint || undefined}
      />
    </div>
  );
}
