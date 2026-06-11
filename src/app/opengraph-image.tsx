import { ImageResponse } from "next/og";

export const alt = "Gemfield Consulting — Your website should be a growth system, not a brochure.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fafaf7",
          padding: 72,
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg viewBox="0 0 48 48" width={52} height={52} fill="none">
            <polygon
              points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5"
              stroke="#15171a"
              strokeWidth="2.4"
              strokeLinejoin="round"
              fill="none"
            />
            <polygon points="24,14 35,20.5 24,25.5 13,20.5" fill="#177a5c" />
            <polygon points="13,20.5 24,25.5 24,36 13,29.5" fill="#0e5c45" />
            <polygon points="35,20.5 24,25.5 24,36 35,29.5" fill="#0a4634" />
          </svg>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#15171a",
              fontFamily: "Arial, sans-serif",
            }}
          >
            GEMFIELD CONSULTING
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 76,
            lineHeight: 1.1,
            color: "#15171a",
            letterSpacing: -2,
            maxWidth: 1000,
          }}
        >
          Your website should be a growth system, not a brochure.
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#4a4f55",
              fontFamily: "Arial, sans-serif",
            }}
          >
            Websites · Visibility · Lead capture · Follow-up · Deskii
          </div>
          <div
            style={{
              display: "flex",
              background: "#0e5c45",
              color: "#ffffff",
              borderRadius: 10,
              padding: "16px 28px",
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "Arial, sans-serif",
            }}
          >
            Get a Free Growth Audit
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
