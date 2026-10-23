import { ImageResponse } from "next/og";

// The preview card shown when someone shares a link to the app
// (texts, Slack, email). Kept generic: no customer data ever appears here.
export const alt = "Pipeline — Valinor Group's sales and operations CRM";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#0f172a",
          color: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 88, height: 88, borderRadius: 22, background: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="60" height="60" viewBox="0 0 64 64">
              <path d="M30 12c1.6 8.6 5.4 12.4 14 14-8.6 1.6-12.4 5.4-14 14-1.6-8.6-5.4-12.4-14-14 8.6-1.6 12.4-5.4 14-14Z" fill="#fff" />
              <path d="M46 36c.9 4.6 2.9 6.6 7.5 7.5-4.6.9-6.6 2.9-7.5 7.5-.9-4.6-2.9-6.6-7.5-7.5 4.6-.9 6.6-2.9 7.5-7.5Z" fill="#fff" opacity="0.85" />
            </svg>
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>Pipeline</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            Leads, quotes, orders and dispatch in one place.
          </div>
          <div style={{ fontSize: 32, color: "#94a3b8" }}>Valinor Group · Sign in to continue</div>
        </div>
      </div>
    ),
    size,
  );
}
