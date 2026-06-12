/** Gemfield mark — faceted gem in a hex, flat emerald (no gradients by design). */
export function Logo({ size = 30, dark = false }: { size?: number; dark?: boolean }) {
  const ink = dark ? "#edede8" : "#15171a";
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <polygon
        points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5"
        stroke={ink}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* faceted gem */}
      <polygon points="24,13 35,19.5 24,24.5 13,19.5" fill="#177a5c" />
      <polygon points="13,19.5 24,24.5 24,35 13,28.5" fill="#0e5c45" />
      <polygon points="35,19.5 24,24.5 24,35 35,28.5" fill="#0a4634" />
    </svg>
  );
}

export function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo dark={dark} />
      <span className="leading-none">
        <span className={`block text-[0.95rem] font-bold tracking-[0.08em] ${dark ? "text-band-ink" : "text-ink"}`}>
          GEMFIELD
        </span>
        <span
          className={`block text-[0.6rem] font-medium tracking-[0.3em] ${
            dark ? "text-band-mut" : "text-ink2"
          }`}
        >
          CONSULTING
        </span>
      </span>
    </span>
  );
}
