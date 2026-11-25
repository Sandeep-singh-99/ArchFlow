import { ImageResponse } from "next/og";

export const alt = "ArchFlow — Visual SQL & NoSQL Database Schema Studio with AI Auto-Connect";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          backgroundColor: "#050608",
          backgroundImage:
            "radial-gradient(circle at 18% 18%, rgba(16, 185, 129, 0.20), transparent 42%), radial-gradient(circle at 84% 22%, rgba(56, 189, 248, 0.16), transparent 40%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top Brand Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "rgba(16, 185, 129, 0.18)",
                border: "1px solid rgba(16, 185, 129, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: 800,
                color: "#34d399",
              }}
            >
              A
            </div>
            <span style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              ArchFlow
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "999px",
              backgroundColor: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              color: "#7dd3fc",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            <span>LangGraph + Gemini Multi-Agent AI</span>
          </div>
        </div>

        {/* Main Hero Copy */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "960px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            Visual SQL &amp; NoSQL Database Studio
          </div>
          <div
            style={{
              fontSize: "24px",
              lineHeight: 1.4,
              color: "#a1a1aa",
            }}
          >
            Design tables &amp; collections, auto-connect ER relationships &amp; cardinalities with
            AI diff preview, and export production SQL/NoSQL DDL.
          </div>
        </div>

        {/* Bottom Feature Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              backgroundColor: "rgba(16, 185, 129, 0.14)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              color: "#34d399",
              fontSize: "17px",
              fontWeight: 600,
            }}
          >
            AI Auto-Connect &amp; Cardinality
          </div>
          <div
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 223, 39, 0.12)",
              border: "1px solid rgba(255, 223, 39, 0.35)",
              color: "#ffee72",
              fontSize: "17px",
              fontWeight: 600,
            }}
          >
            PostgreSQL · MySQL · MongoDB
          </div>
          <div
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              color: "#e4e4e7",
              fontSize: "17px",
              fontWeight: 600,
            }}
          >
            Mermaid &amp; CASCADE Simulator
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
