import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0E1414",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        {/* App icon */}
        <div
          style={{
            width: 140,
            height: 140,
            background: "#10B981",
            borderRadius: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "white", fontWeight: 700, fontSize: 90, lineHeight: 1 }}>Q</span>
        </div>

        {/* Wordmark */}
        <span
          style={{
            color: "white",
            fontWeight: 700,
            fontSize: 80,
            letterSpacing: "-2px",
            lineHeight: 1,
          }}
        >
          QuoteMate
        </span>
      </div>
    ),
    { ...size }
  );
}
