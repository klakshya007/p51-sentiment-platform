import { useState } from "react";

export default function Header({ keyword, onTrack, isLoading, isLive }) {
  const [input, setInput] = useState(keyword || "");

  function handleSubmit(e) {
    e.preventDefault();
    if (input.trim()) onTrack(input.trim());
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 28px",
        borderBottom: "1px solid var(--border)",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: isLive ? "var(--pulse)" : "var(--text-muted)",
            animation: isLive ? "pulse-dot 1.8s infinite" : "none",
          }}
        />
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Pulsecheck
        </h1>
        <span
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "2px 6px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          P51 · real-time
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flex: "1 1 320px", maxWidth: 480 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Track a brand, product, or topic…"
          style={{
            flex: 1,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "10px 14px",
            color: "var(--text-primary)",
            fontSize: 14,
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--pulse)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            background: "var(--pulse)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            cursor: isLoading ? "wait" : "pointer",
            opacity: isLoading || !input.trim() ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {isLoading ? "Fetching…" : "Track"}
        </button>
      </form>
    </header>
  );
}
