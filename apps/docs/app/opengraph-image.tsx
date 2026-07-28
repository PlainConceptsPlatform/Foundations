import { siteDescription, siteName } from "@/lib/site";
import { ImageResponse } from "next/og";

export const alt = siteName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Rendered by satori, which supports a subset of CSS: explicit sizes, flexbox,
// and inline SVG only. It also cannot use next/font, so this deliberately falls
// back to the platform sans rather than fetching Outfit over the network at
// build time (the theme package makes the same offline-safe choice for its CSS).
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0d0e0f",
        padding: 80,
      }}
    >
      {/* Decorative: the card's accessible name comes from the `alt` export. */}
      <svg width="88" height="88" viewBox="0 0 64.309 64.025" aria-hidden="true">
        <path
          fill="#2F69FF"
          d="M 0 0 V 48.037 H 16.063 V 64.025 H 64.309 V 0 Z M 48.247 48.037 H 16.063 V 15.99 H 48.247 Z"
        />
      </svg>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            color: "#fafafc",
            letterSpacing: -1.5,
            lineHeight: 1.1,
          }}
        >
          {siteName}
        </div>
        <div style={{ fontSize: 32, color: "#8e8f95", marginTop: 20, lineHeight: 1.35 }}>
          {siteDescription}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: 48, height: 4, backgroundColor: "#2f69ff" }} />
        <div style={{ fontSize: 24, color: "#6a6f74", marginLeft: 20 }}>PlainConcepts Platform</div>
      </div>
    </div>,
    size,
  );
}
