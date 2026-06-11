/** Minimal inline icon set — 1.5px stroke, monochrome (currentColor), per design system. */
type IconProps = { size?: number; className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ArrowRight({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={`arrow ${className ?? ""}`} {...base} aria-hidden="true">
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function Check({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <path d="M4.5 12.5l5 5L19.5 7" />
    </svg>
  );
}

export function Minus({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <path d="M6 12h12" />
    </svg>
  );
}

export function Menu({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function X({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export function Phone({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} aria-hidden="true">
      <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}
