import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      // Full-bleed green — no border-radius in the PNG.
      // iOS applies its own rounded mask when it shows the icon in share
      // sheets and on the home screen; baking in a radius creates transparent
      // corners that appear white against the share-sheet background.
      <div
        style={{
          width: 180,
          height: 180,
          background: "#10B981",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "white", fontWeight: 700, fontSize: 118, lineHeight: 1 }}>Q</span>
      </div>
    ),
    { ...size }
  );
}
